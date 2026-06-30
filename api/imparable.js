// =========================================================
// IMPARABLE — API (Vercel Serverless Function · Node)
// Habla con Neon (PostgreSQL). Misma "accion" que usa el frontend.
// La credencial vive en la variable de entorno DATABASE_URL (Vercel).
// =========================================================
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const PUNTOS = { asistencia: 10, puntualidad: 10, reto: 15, visita: 15 };
const PUNTOS_LOGRO = { colaboracion: 10, dinamica: 15, proyecto: 20, actividad: 15 };
const LOGRO_LABEL = {
  colaboracion: 'Colaboración con la sociedad',
  dinamica: 'Ganaron una dinámica',
  proyecto: 'Proyecto comunitario cumplido',
  actividad: 'Actividad extendida (retiro/campamento)'
};

const pAsistencia = (p, t) => (t ? Math.round((p / t) * PUNTOS.asistencia) : 0);
const pPuntualidad = (a, t) => (t ? Math.round((a / t) * PUNTOS.puntualidad) : 0);
const pRetoInd = (c, t) => (t && c >= t ? PUNTOS.reto : 0);
const pActividad = (pct) => (pct > 50 ? PUNTOS_LOGRO.actividad : 0);
const pLogro = (l) => (l.tipo === 'actividad' ? pActividad(Number(l.porcentaje) || 0) : (PUNTOS_LOGRO[l.tipo] || 0));

const uid = (p) => `${p}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const todayISO = () => new Date().toISOString().slice(0, 10);
function nowHora() {
  const d = new Date(); let h = d.getHours(), m = d.getMinutes();
  const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')}${ap}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const accion = req.query.accion;
      switch (accion) {
        case 'snapshot':              return res.json(await snapshot());
        case 'ranking':               return res.json(await ranking(req.query.tipo || 'acumulado'));
        case 'equipos':               return res.json(await equiposPublicos());
        case 'reto_vigente':          return res.json(await retoVigente());
        case 'pendientes_validacion': return res.json(await registrosPorEstado('pendiente'));
        case 'revisados':             return res.json(await registrosPorEstado('validado'));
        case 'historial':             return res.json(await historialList());
        case 'feedback':              return res.json(await feedbackList());
        default:                      return res.json({ ok: true, msg: 'IMPARABLE API' });
      }
    }
    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      switch (b.accion) {
        case 'verificar_pin_equipo':    return res.json(await verificarPinEquipo(b.pin));
        case 'verificar_pin_validador': return res.json({ ok: await verificarPinValidador(b.pin) });
        case 'crear_equipo':            return res.json(await crearEquipo(b));
        case 'actualizar_equipo':       return res.json(await actualizarEquipo(b));
        case 'registrar_secretario':    return res.json(await registrarSecretario(b));
        case 'validar_punto':           return res.json(await validarPunto(b));
        case 'confirmar_logro':         return res.json(await confirmarLogro(b));
        case 'deshacer_punto':          return res.json(await deshacerPunto(b));
        case 'deshacer_logro':          return res.json(await deshacerLogro(b));
        case 'finalizar_validacion':    return res.json(await finalizarValidacion(b.registro_id));
        case 'reabrir_registro':        return res.json(await reabrirRegistro(b.registro_id));
        case 'otorgar_punto_extra':     return res.json(await otorgarPuntoExtra(b));
        case 'crear_reto':              return res.json(await crearReto(b));
        case 'enviar_feedback':         return res.json(await enviarFeedback(b));
        default:                        return res.json({ error: 'accion desconocida: ' + b.accion });
      }
    }
    return res.status(405).json({ error: 'método no permitido' });
  } catch (err) {
    return res.status(200).json({ error: String(err && err.message || err) });
  }
}

/* ===================== Lecturas ===================== */
function mapRegistro(r) {
  return {
    id: r.id, equipo_id: r.equipo_id,
    fecha: r.fecha instanceof Date ? r.fecha.toISOString().slice(0, 10) : r.fecha,
    hora: r.hora, estado: r.estado,
    asistencia: { presentes: r.asis_presentes, total: r.asis_total, validada: r.asis_validada, puntos: r.asis_puntos },
    puntualidad: { a_tiempo: r.punt_a_tiempo, total: r.punt_total, validada: r.punt_validada, puntos: r.punt_puntos },
    reto: { tipo: r.reto_tipo, cumplidos: r.reto_cumplidos, total: r.reto_total, cumplido: r.reto_cumplido, validada: r.reto_validada, puntos: r.reto_puntos },
    visita: { nombre: r.visita_nombre || '', validada: r.visita_validada, puntos: r.visita_puntos },
    logros: Array.isArray(r.logros) ? r.logros : [],
    total_puntos_semana: r.total_puntos
  };
}

async function snapshot() {
  const [eq, mi, regs, ret, ext, fb, hist] = await Promise.all([
    sql`SELECT id,nombre,inicial,color,color_text,capacidad_max,activo,grito,versiculo FROM equipos`,
    sql`SELECT equipo_id,nombre,es_visita,veces_visita FROM miembros`,
    sql`SELECT * FROM registros`,
    sql`SELECT id,descripcion,tipo,fecha,activo FROM retos ORDER BY fecha`,
    sql`SELECT id,equipo_id,tipo,descripcion,puntos,fecha,otorgado_por FROM puntos_extra`,
    sql`SELECT id,rating,comentario,fecha FROM feedback ORDER BY creado DESC`,
    sql`SELECT id,registro_id,equipo_id,equipo,concepto,puntos,aprobado_por,fecha,hora FROM historial ORDER BY creado DESC`
  ]);
  const miembros = {};
  for (const m of mi) (miembros[m.equipo_id] = miembros[m.equipo_id] || []).push(m.nombre);
  const visitas = {};
  for (const m of mi) if (m.es_visita) visitas[m.nombre] = m.veces_visita;
  const retosActivos = ret.filter(r => r.activo);
  return {
    config: {},
    equipos: eq,
    miembros,
    base_puntos: {},
    reto_vigente: retosActivos.length ? retosActivos[retosActivos.length - 1] : null,
    retos_historial: ret.filter(r => !r.activo).reverse(),
    registros: regs.map(mapRegistro),
    visitas_conteo: visitas,
    puntos_extra: ext,
    feedback: fb,
    historial: hist
  };
}

async function equiposPublicos() {
  const eq = await sql`SELECT id,nombre,inicial,color,color_text,grito,versiculo FROM equipos WHERE activo = TRUE`;
  const counts = await sql`SELECT equipo_id, COUNT(*)::int AS n FROM miembros GROUP BY equipo_id`;
  const map = {}; counts.forEach(c => map[c.equipo_id] = c.n);
  return eq.map(e => ({ ...e, miembros: map[e.id] || 0 }));
}
async function retoVigente() {
  const r = await sql`SELECT id,descripcion,tipo,fecha,activo FROM retos WHERE activo = TRUE ORDER BY fecha DESC LIMIT 1`;
  return r[0] || null;
}
async function registrosPorEstado(estado) {
  const r = await sql`SELECT * FROM registros WHERE estado = ${estado}`;
  return r.map(mapRegistro);
}
async function historialList() {
  return sql`SELECT id,registro_id,equipo_id,equipo,concepto,puntos,aprobado_por,fecha,hora FROM historial ORDER BY creado DESC`;
}
async function feedbackList() {
  return sql`SELECT id,rating,comentario,fecha FROM feedback ORDER BY creado DESC`;
}

async function ranking(tipo) {
  const equipos = await equiposPublicos();
  const regs = await sql`SELECT equipo_id, total_puntos, fecha FROM registros WHERE estado = 'validado'`;
  const ext = await sql`SELECT equipo_id, puntos, fecha FROM puntos_extra`;
  const now = new Date();
  let desde = new Date(2000, 0, 1);
  if (tipo === 'semanal') { desde = new Date(now); desde.setHours(0, 0, 0, 0); desde.setDate(desde.getDate() - desde.getDay()); }
  else if (tipo === 'mensual') { desde = new Date(now.getFullYear(), now.getMonth(), 1); }
  const inWin = (f) => new Date(f) >= desde;
  const tabla = equipos.map(e => {
    let pts = 0;
    regs.forEach(r => { if (r.equipo_id === e.id && inWin(r.fecha)) pts += (r.total_puntos || 0); });
    ext.forEach(x => { if (x.equipo_id === e.id && inWin(x.fecha)) pts += (x.puntos || 0); });
    return { id: e.id, nombre: e.nombre, inicial: e.inicial, color: e.color, color_text: e.color_text, miembros: e.miembros, puntos: pts };
  });
  tabla.sort((a, b) => b.puntos - a.puntos);
  tabla.forEach((f, i) => f.pos = i + 1);
  return tabla;
}

/* ===================== PIN ===================== */
async function verificarPinEquipo(pin) {
  const r = await sql`SELECT id,nombre,inicial,color,color_text,grito,versiculo FROM equipos WHERE pin = ${String(pin)} AND activo = TRUE LIMIT 1`;
  return r[0] ? { ok: true, equipo: r[0] } : { ok: false };
}
async function verificarPinValidador(pin) {
  const r = await sql`SELECT valor FROM config WHERE clave = 'pin_validador' LIMIT 1`;
  return !!r[0] && String(r[0].valor) === String(pin);
}

/* ===================== Escrituras ===================== */
async function crearEquipo(b) {
  const dup = await sql`SELECT 1 FROM equipos WHERE pin = ${String(b.pin)} LIMIT 1`;
  if (dup.length) return { error: 'Ese PIN ya está en uso por otro equipo' };
  const id = uid('eq');
  const inicial = (b.nombre || '?').charAt(0).toUpperCase();
  await sql`INSERT INTO equipos (id,nombre,inicial,color,color_text,pin,capacidad_max,activo,grito,versiculo,creado_secretario)
            VALUES (${id}, ${b.nombre}, ${inicial}, ${b.color || '#1A3A8F'}, NULL, ${String(b.pin)}, ${b.capacidad_max || 7}, TRUE, ${b.grito || ''}, ${b.versiculo || ''}, TRUE)`;
  for (const n of (b.miembros || [])) {
    if (n) await sql`INSERT INTO miembros (id,equipo_id,nombre,es_visita,veces_visita,fecha_union) VALUES (${uid('mb')}, ${id}, ${n}, FALSE, 0, ${todayISO()})`;
  }
  return { ok: true, id };
}
async function actualizarEquipo(b) {
  const cur = (await sql`SELECT * FROM equipos WHERE id = ${b.id} LIMIT 1`)[0];
  if (!cur) return { error: 'equipo no encontrado' };
  const v = (k, d) => (b[k] != null ? b[k] : d);
  await sql`UPDATE equipos SET
              nombre = ${v('nombre', cur.nombre)},
              color = ${v('color', cur.color)},
              grito = ${v('grito', cur.grito)},
              versiculo = ${v('versiculo', cur.versiculo)},
              pin = ${b.pin != null ? String(b.pin) : cur.pin},
              activo = ${b.activo != null ? b.activo : cur.activo}
            WHERE id = ${b.id}`;
  return { ok: true };
}

async function registrarSecretario(b) {
  const reto = await retoVigente();
  const id = uid('reg');
  const logros = JSON.stringify((b.logros || []).map(l => ({ tipo: l.tipo, descripcion: l.descripcion || '', porcentaje: l.porcentaje, confirmado: false })));
  await sql`INSERT INTO registros
    (id,equipo_id,fecha,hora,estado,
     asis_presentes,asis_total,asis_validada,
     punt_a_tiempo,punt_total,punt_validada,
     reto_tipo,reto_cumplidos,reto_total,reto_cumplido,reto_validada,
     visita_nombre,visita_validada, logros)
    VALUES
    (${id}, ${b.equipo_id}, ${todayISO()}, ${nowHora()}, 'pendiente',
     ${b.presentes}, ${b.total}, FALSE,
     ${b.a_tiempo}, ${b.presentes}, FALSE,
     ${(reto && reto.tipo) || b.reto_tipo}, ${b.reto_cumplidos || 0}, ${b.total}, ${!!b.reto_cumplido}, FALSE,
     ${b.visita_nombre || ''}, FALSE, ${logros}::jsonb)`;
  return { ok: true, id };
}

async function getReg(id) { return (await sql`SELECT * FROM registros WHERE id = ${id} LIMIT 1`)[0]; }

async function validarPunto(b) {
  const r = await getReg(b.registro_id); if (!r) return { error: 'no encontrado' };
  const aj = b.valor_ajustado;
  if (b.criterio === 'asistencia') {
    const pr = aj != null ? aj : r.asis_presentes;
    await sql`UPDATE registros SET asis_presentes = ${pr}, asis_validada = TRUE, asis_puntos = ${pAsistencia(pr, r.asis_total)} WHERE id = ${r.id}`;
  } else if (b.criterio === 'puntualidad') {
    const a = aj != null ? aj : r.punt_a_tiempo;
    await sql`UPDATE registros SET punt_a_tiempo = ${a}, punt_validada = TRUE, punt_puntos = ${pPuntualidad(a, r.punt_total)} WHERE id = ${r.id}`;
  } else if (b.criterio === 'reto') {
    let pts;
    if (r.reto_tipo === 'grupal') { pts = r.reto_cumplido ? PUNTOS.reto : 0; await sql`UPDATE registros SET reto_validada = TRUE, reto_puntos = ${pts} WHERE id = ${r.id}`; }
    else { const c = aj != null ? aj : r.reto_cumplidos; pts = pRetoInd(c, r.reto_total); await sql`UPDATE registros SET reto_cumplidos = ${c}, reto_validada = TRUE, reto_puntos = ${pts} WHERE id = ${r.id}`; }
  } else if (b.criterio === 'visita') {
    const pts = await puntosVisitaAuto(r.visita_nombre, r.equipo_id);
    await sql`UPDATE registros SET visita_validada = TRUE, visita_puntos = ${pts} WHERE id = ${r.id}`;
  }
  return { ok: true };
}
async function deshacerPunto(b) {
  const map = { asistencia: ['asis_validada', 'asis_puntos'], puntualidad: ['punt_validada', 'punt_puntos'], reto: ['reto_validada', 'reto_puntos'], visita: ['visita_validada', 'visita_puntos'] };
  const c = map[b.criterio]; if (!c) return { error: 'criterio inválido' };
  if (b.criterio === 'asistencia') await sql`UPDATE registros SET asis_validada=FALSE, asis_puntos=NULL WHERE id=${b.registro_id}`;
  else if (b.criterio === 'puntualidad') await sql`UPDATE registros SET punt_validada=FALSE, punt_puntos=NULL WHERE id=${b.registro_id}`;
  else if (b.criterio === 'reto') await sql`UPDATE registros SET reto_validada=FALSE, reto_puntos=NULL WHERE id=${b.registro_id}`;
  else await sql`UPDATE registros SET visita_validada=FALSE, visita_puntos=NULL WHERE id=${b.registro_id}`;
  return { ok: true };
}
async function confirmarLogro(b) {
  const r = await getReg(b.registro_id); if (!r) return { error: 'no encontrado' };
  const logros = Array.isArray(r.logros) ? r.logros : [];
  const l = logros[b.indice]; if (!l) return { error: 'logro no encontrado' };
  if (b.porcentaje != null) l.porcentaje = b.porcentaje;
  l.confirmado = true; l.cumplido = b.cumplido !== false; l.puntos = l.cumplido ? pLogro(l) : 0;
  await sql`UPDATE registros SET logros = ${JSON.stringify(logros)}::jsonb WHERE id = ${r.id}`;
  return { ok: true };
}
async function deshacerLogro(b) {
  const r = await getReg(b.registro_id); if (!r) return { error: 'no encontrado' };
  const logros = Array.isArray(r.logros) ? r.logros : [];
  if (!logros[b.indice]) return { error: 'logro no encontrado' };
  logros[b.indice].confirmado = false; delete logros[b.indice].puntos; delete logros[b.indice].cumplido;
  await sql`UPDATE registros SET logros = ${JSON.stringify(logros)}::jsonb WHERE id = ${r.id}`;
  return { ok: true };
}

async function puntosVisitaAuto(nombre, equipoId) {
  if (!nombre) return 0;
  const m = (await sql`SELECT veces_visita FROM miembros WHERE equipo_id = ${equipoId} AND nombre = ${nombre} AND es_visita = TRUE LIMIT 1`)[0];
  const veces = m ? m.veces_visita : 0;
  return veces < 3 ? PUNTOS.visita : 0;
}
async function incrementarVisita(nombre, equipoId) {
  const m = (await sql`SELECT id,veces_visita FROM miembros WHERE equipo_id = ${equipoId} AND nombre = ${nombre} LIMIT 1`)[0];
  if (m) await sql`UPDATE miembros SET veces_visita = ${(m.veces_visita || 0) + 1}, es_visita = TRUE WHERE id = ${m.id}`;
  else await sql`INSERT INTO miembros (id,equipo_id,nombre,es_visita,veces_visita,fecha_union) VALUES (${uid('mb')}, ${equipoId}, ${nombre}, TRUE, 1, ${todayISO()})`;
}
async function decrementarVisita(nombre, equipoId) {
  const m = (await sql`SELECT id,veces_visita FROM miembros WHERE equipo_id = ${equipoId} AND nombre = ${nombre} LIMIT 1`)[0];
  if (m) await sql`UPDATE miembros SET veces_visita = ${Math.max(0, (m.veces_visita || 0) - 1)} WHERE id = ${m.id}`;
}

async function finalizarValidacion(id) {
  const r = await getReg(id); if (!r) return { error: 'no encontrado' };
  const logros = Array.isArray(r.logros) ? r.logros : [];
  const ok = r.asis_validada && r.punt_validada && r.reto_validada &&
             (r.visita_nombre ? r.visita_validada : true) && logros.every(l => l.confirmado);
  if (!ok) return { error: 'faltan criterios por confirmar' };
  const base = (r.asis_puntos || 0) + (r.punt_puntos || 0) + (r.reto_puntos || 0);
  const totalLogros = logros.reduce((s, l) => s + (Number(l.puntos) || 0), 0);
  const total = base + (r.visita_puntos || 0) + totalLogros;
  await sql`UPDATE registros SET estado='validado', total_puntos=${total}, validado_en=now() WHERE id=${r.id}`;
  if (r.visita_nombre && (r.visita_puntos || 0) > 0) await incrementarVisita(r.visita_nombre, r.equipo_id);

  const eqName = (await sql`SELECT nombre FROM equipos WHERE id = ${r.equipo_id} LIMIT 1`)[0]?.nombre || r.equipo_id;
  const baseConcepto = 'Registro semanal (asistencia, puntualidad, reto)';
  await sql`INSERT INTO historial (id,registro_id,equipo_id,equipo,concepto,puntos,aprobado_por,fecha,hora) VALUES (${uid('h')}, ${r.id}, ${r.equipo_id}, ${eqName}, ${baseConcepto}, ${base}, 'Directiva', ${todayISO()}, ${nowHora()})`;
  if (r.visita_nombre && (r.visita_puntos || 0) > 0)
    await sql`INSERT INTO historial (id,registro_id,equipo_id,equipo,concepto,puntos,aprobado_por,fecha,hora) VALUES (${uid('h')}, ${r.id}, ${r.equipo_id}, ${eqName}, ${'Visita: ' + r.visita_nombre}, ${r.visita_puntos}, 'Directiva', ${todayISO()}, ${nowHora()})`;
  for (const l of logros) {
    if (l.confirmado && (Number(l.puntos) || 0) > 0)
      await sql`INSERT INTO historial (id,registro_id,equipo_id,equipo,concepto,puntos,aprobado_por,fecha,hora) VALUES (${uid('h')}, ${r.id}, ${r.equipo_id}, ${eqName}, ${LOGRO_LABEL[l.tipo] || l.tipo}, ${l.puntos}, 'Directiva', ${todayISO()}, ${nowHora()})`;
  }
  return { ok: true, total_puntos_semana: total };
}

async function reabrirRegistro(id) {
  const r = await getReg(id); if (!r || r.estado !== 'validado') return { error: 'no se puede reabrir' };
  if (r.visita_nombre && (r.visita_puntos || 0) > 0) await decrementarVisita(r.visita_nombre, r.equipo_id);
  await sql`DELETE FROM historial WHERE registro_id = ${id}`;
  await sql`UPDATE registros SET estado='pendiente', total_puntos=NULL, validado_en=NULL WHERE id=${id}`;
  return { ok: true };
}

async function otorgarPuntoExtra(b) {
  const pts = b.tipo === 'actividad' ? pActividad(Number(b.porcentaje) || 0) : (PUNTOS_LOGRO[b.tipo] || 0);
  const desc = b.descripcion || LOGRO_LABEL[b.tipo];
  await sql`INSERT INTO puntos_extra (id,equipo_id,tipo,descripcion,puntos,fecha,otorgado_por) VALUES (${uid('ext')}, ${b.equipo_id}, ${b.tipo}, ${desc}, ${pts}, ${todayISO()}, ${b.otorgado_por || 'Directiva'})`;
  const eqName = (await sql`SELECT nombre FROM equipos WHERE id = ${b.equipo_id} LIMIT 1`)[0]?.nombre || b.equipo_id;
  const concepto = (LOGRO_LABEL[b.tipo] || b.tipo) + (b.descripcion ? ' · ' + b.descripcion : '');
  await sql`INSERT INTO historial (id,registro_id,equipo_id,equipo,concepto,puntos,aprobado_por,fecha,hora) VALUES (${uid('h')}, NULL, ${b.equipo_id}, ${eqName}, ${concepto}, ${pts}, ${b.otorgado_por || 'Directiva'}, ${todayISO()}, ${nowHora()})`;
  return { ok: true, puntos: pts };
}

async function crearReto(b) {
  await sql`UPDATE retos SET activo = FALSE WHERE activo = TRUE`;
  const id = uid('reto');
  await sql`INSERT INTO retos (id,descripcion,tipo,fecha,activo) VALUES (${id}, ${b.descripcion}, ${b.tipo}, ${todayISO()}, TRUE)`;
  return { ok: true, id };
}

async function enviarFeedback(b) {
  await sql`INSERT INTO feedback (id,rating,comentario,fecha) VALUES (${uid('fb')}, ${Number(b.rating) || 0}, ${b.comentario || ''}, ${todayISO()})`;
  return { ok: true };
}
