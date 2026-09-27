/* =========================================================
   IMPARABLE — data.js  (v3 · cache + backend-ready)
   ---------------------------------------------------------
   Capa de datos única para toda la app.
   - LECTURAS: síncronas, leen de un cache en memoria.
   - ESCRITURAS / login: async (Promesas).
   - init(): carga el cache. Si IMPARABLE_CONFIG.API_URL está
     definido -> pide el snapshot al backend (Neon vía Vercel).
     Si está vacío -> modo DEMO con localStorage.
   Así las páginas hacen `await API.init()` una vez y luego
   leen de forma síncrona; las escrituras se hacen con await.
   ========================================================= */

(function () {
  'use strict';

  const STORE_KEY = 'imparable_v5';

  const COLORES = [
    { hex: '#D4A017', nombre: 'Dorado' }, { hex: '#1A3A8F', nombre: 'Azul' },
    { hex: '#C9614A', nombre: 'Rojo' }, { hex: '#2EB872', nombre: 'Verde' },
    { hex: '#8E5BD0', nombre: 'Morado' }, { hex: '#E07B39', nombre: 'Naranja' },
    { hex: '#3BA7C4', nombre: 'Celeste' }, { hex: '#c08a5a', nombre: 'Bronce' },
    { hex: '#dfe6f2', nombre: 'Plata' }
  ];

  /* ---------- Semilla demo (coincide con los mockups) ---------- */
  function seed() {
    return {
      config: { pin_validador: '2468' },
      equipos: [
        { id: 'aguilas',    nombre: 'Águilas',    inicial: 'A', color: '#D4A017', pin: '1001', capacidad_max: 7, activo: true, grito: '¡Águilas, alto vuelo!', versiculo: 'Isaías 40:31' , pin_lider: '3001', lider_nombre: 'Rebeca Salinas' },
        { id: 'centinelas', nombre: 'Centinelas', inicial: 'C', color: '#dfe6f2', color_text:'#0B1F4B', pin: '1002', capacidad_max: 7, activo: true, grito: '¡Centinelas en guardia!', versiculo: 'Salmo 127:1' , pin_lider: '3002', lider_nombre: 'Jonatán Ríos' },
        { id: 'leones',     nombre: 'Leones',     inicial: 'L', color: '#c08a5a', pin: '1003', capacidad_max: 7, activo: true, grito: '¡Leones, rugido de fe!', versiculo: 'Proverbios 28:1' , pin_lider: '3003', lider_nombre: 'Miriam Acosta', hora_oracion: '21:00' },
        { id: 'vencedores', nombre: 'Vencedores', inicial: 'V', color: '#2EB872', pin: '1004', capacidad_max: 7, activo: true, grito: '¡Más que vencedores!', versiculo: 'Romanos 8:37' , pin_lider: '3004', lider_nombre: 'Samuel Paredes' },
        { id: 'embajadores',nombre: 'Embajadores',inicial: 'E', color: '#8E5BD0', pin: '1005', capacidad_max: 7, activo: true, grito: '¡Embajadores del Rey!', versiculo: '2 Corintios 5:20' , pin_lider: '3005', lider_nombre: 'Ester Villalobos' },
        { id: 'centella',   nombre: 'Centella',   inicial: 'C', color: '#E07B39', pin: '1006', capacidad_max: 7, activo: true, grito: '¡Centella que enciende!', versiculo: 'Mateo 5:16' , pin_lider: '3006', lider_nombre: 'Natán Herrera' }
      ],
      miembros: {
        leones: ['Daniel Ortega','Sara Méndez','Josué Rivas','Raquel Lara','Esteban Cruz','Noemí Soto','Caleb Díaz'],
        aguilas: ['Marcos Pérez','Lucía Fonseca','Andrés Gil','Paola Núñez','Tomás Vera','Carmen Ruiz'],
        centinelas: ['Iván Solís','Karen Mora','Bruno Castro','Elena Pinto','Hugo Vargas'],
        vencedores: ['Rubén Díaz','Tania Rey','Omar Lazo','Pía Solano','Gael Marín'],
        embajadores: ['Saúl Vidal','Noa Quintero','Beto Lima','Mía Castro','Aldo Peña','Vera Soto'],
        centella: ['Ciro Ramos','Lía Mena','Pol Arias','Ruth Vega','Iker Soto']
      },
      base_puntos: {
        aguilas:    { semanal: 22, mensual: 41, acumulado: 68 },
        centinelas: { semanal: 19, mensual: 38, acumulado: 61 },
        leones:     { semanal: 8,  mensual: 33, acumulado: 54 },
        vencedores: { semanal: 17, mensual: 29, acumulado: 47 },
        embajadores:{ semanal: 12, mensual: 24, acumulado: 39 },
        centella:   { semanal: 9,  mensual: 19, acumulado: 31 }
      },
      reto_vigente: { id: 'r-salmo23', descripcion: 'Memorizar y recitar el Salmo 23 completo', tipo: 'individual', activo: true, fecha: hoyISO() },
      retos_historial: [
        { id: 'r-prev1', descripcion: 'Invitar a un amigo a la reunión', tipo: 'grupal', activo: false, fecha: '2026-06-21' },
        { id: 'r-prev2', descripcion: 'Leer el libro de Filipenses', tipo: 'individual', activo: false, fecha: '2026-06-14' }
      ],
      registros: [
        {
          id: 'reg-leones-1', equipo_id: 'leones', fecha: hoyISO(), hora: '7:12pm', estado: 'pendiente',
          asistencia: { presentes: 6, total: 7, validada: false },
          puntualidad: { a_tiempo: 5, total: 6, validada: false },
          reto: { tipo: 'individual', cumplidos: 5, total: 7, validada: false },
          visita: { nombre: '', validada: false },
          logros: [ { tipo: 'colaboracion', descripcion: 'Ayudamos con la limpieza del templo', confirmado: false } ],
          detalle: { miembros: ['Daniel Ortega','Sara Méndez','Josué Rivas','Raquel Lara','Esteban Cruz','Noemí Soto','Caleb Díaz'],
                     presentes: ['Daniel Ortega','Sara Méndez','Josué Rivas','Raquel Lara','Esteban Cruz','Noemí Soto'],
                     a_tiempo: ['Daniel Ortega','Sara Méndez','Josué Rivas','Raquel Lara','Noemí Soto'],
                     reto: ['Daniel Ortega','Sara Méndez','Josué Rivas','Raquel Lara','Noemí Soto'] }
        },
        ...historialDemoLeones(),
        {
          id: 'reg-aguilas-1', equipo_id: 'aguilas', fecha: hoyISO(), hora: '7:20pm', estado: 'pendiente',
          asistencia: { presentes: 5, total: 6, validada: false },
          puntualidad: { a_tiempo: 5, total: 5, validada: false },
          reto: { tipo: 'individual', cumplidos: 6, total: 6, validada: false },
          visita: { nombre: 'Diego Salas', validada: false },
          logros: []
        }
      ],
      visitas_conteo: { 'Diego Salas': 0 },
      puntos_extra: [],
      feedback: [],
      historial: [],
      interacciones: interaccionesDemo(),
      actividades: actividadesDemo()
    };
  }
  function actividadesDemo() {
    const M = ['Daniel Ortega','Sara Méndez','Josué Rivas','Raquel Lara','Esteban Cruz','Noemí Soto','Caleb Díaz'];
    const dia = (n) => { const f = new Date(); f.setDate(f.getDate() - n); return fechaLocal(f); };
    const orac = (n, idx) => ({ id: 'act-o' + n, equipo_id: 'leones', tipo: 'oracion', subtipo: '', descripcion: '', fecha: dia(n), participantes: idx.map(i => M[i]) });
    return [
      orac(0, [0,1,2,3,5]), orac(1, [0,1,3,5]), orac(2, [0,1,2,3,4,5]), orac(4, [0,1,3]), orac(5, [0,1,2,3,5]),
      { id: 'act-c1', equipo_id: 'leones', tipo: 'crecimiento', subtipo: 'estudio', descripcion: 'Estudio de Filipenses 4 por videollamada', fecha: dia(3), participantes: [M[0],M[1],M[2],M[3],M[5]] }
    ];
  }
  function fechaLocal(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function interaccionesDemo() {
    const dia = (n) => { const f = new Date(); f.setDate(f.getDate() - n); return f.toISOString().slice(0, 10); };
    const base = { equipo_id: 'leones', lider: 'Miriam Acosta', ayuda: '', estado: '', atendida_en: null };
    return [
      { ...base, id: 'int-d1', miembro: 'Caleb Díaz', tipo: 'necesidad', fecha: dia(9), estado: 'abierta',
        nota: 'Perdió su trabajo y está desanimado; por eso ha faltado.', ayuda: 'Orar con él y compartirle ofertas de empleo.' },
      { ...base, id: 'int-d2', miembro: 'Caleb Díaz', tipo: 'contacto', fecha: dia(9), nota: 'Le escribí por WhatsApp.' },
      { ...base, id: 'int-d3', miembro: 'Sara Méndez', tipo: 'visita', fecha: dia(1), nota: 'Visita en su casa con su familia.' },
      { ...base, id: 'int-d4', miembro: 'Daniel Ortega', tipo: 'contacto', fecha: dia(0), nota: '' }
    ];
  }

  // Semanas pasadas ya validadas de Leones, con detalle por persona, para que el
  // panel del líder tenga datos que mostrar en modo demo.
  function historialDemoLeones() {
    const M = ['Daniel Ortega','Sara Méndez','Josué Rivas','Raquel Lara','Esteban Cruz','Noemí Soto','Caleb Díaz'];
    const semanas = [ // [presentes, a_tiempo, reto] por índice de integrante
      [[0,1,2,3,4,5,6],[0,1,2,3,5,6],[0,1,2,3,4,5]],
      [[0,1,2,3,5,6],[0,1,3,5],[0,1,2,3,5]],
      [[0,1,2,3,4,5],[0,1,2,3,5],[0,1,3,5]],
      [[0,1,2,3,5],[0,1,2,3],[0,1,2,3,5]],
      [[0,1,3,4,5],[0,1,3,5],[0,1,3]]
    ];
    return semanas.map((w, i) => {
      const f = new Date(); f.setDate(f.getDate() - 7 * (semanas.length - i));
      const [pr, at, re] = w.map(ix => ix.map(k => M[k]));
      return {
        id: 'reg-leones-h' + i, equipo_id: 'leones', fecha: f.toISOString().slice(0, 10), hora: '7:10pm', estado: 'validado',
        asistencia: { presentes: pr.length, total: M.length, validada: true, puntos: pAsistencia(pr.length, M.length) },
        puntualidad: { a_tiempo: at.length, total: pr.length, validada: true, puntos: pPuntualidad(at.length, pr.length) },
        reto: { tipo: 'individual', cumplidos: re.length, total: M.length, validada: true, puntos: 0 },
        visita: { nombre: '', validada: true, puntos: 0 }, logros: [],
        detalle: { miembros: M, presentes: pr, a_tiempo: at, reto: re },
        total_puntos_semana: pAsistencia(pr.length, M.length) + pPuntualidad(at.length, pr.length)
      };
    });
  }

  function hoyISO() { try { return new Date().toISOString().slice(0, 10); } catch (e) { return '2026-01-01'; } }

  /* ---------- Cache + modo ---------- */
  let cache = null;
  function backendMode() { return !!(window.IMPARABLE_CONFIG && window.IMPARABLE_CONFIG.API_URL); }
  function apiUrl() { return window.IMPARABLE_CONFIG.API_URL; }

  function loadLocal() {
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    const fresh = seed(); saveLocal(fresh); return fresh;
  }
  function saveLocal(d) { try { localStorage.setItem(STORE_KEY, JSON.stringify(d)); } catch (e) {} }
  function db() { return cache || (cache = loadLocal()); }
  function persist() { if (!backendMode()) saveLocal(cache); }

  /* ---------- Capa remota (Neon vía Vercel) ---------- */
  async function remoteGet(accion, params) {
    const qs = new URLSearchParams(Object.assign({ accion: accion }, params || {})).toString();
    const res = await fetch(apiUrl() + '?' + qs, { headers: { 'Accept': 'application/json' } });
    return res.json();
  }
  async function remotePost(accion, payload) {
    const res = await fetch(apiUrl(), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ accion: accion }, payload || {}))
    });
    return res.json();
  }
  async function refreshCache() {
    const snap = await remoteGet('snapshot');
    if (snap && !snap.error) cache = normalizeSnapshot(snap);
  }
  // Garantiza que el snapshot tenga la forma esperada por las lecturas.
  function normalizeSnapshot(s) {
    return {
      config: s.config || {}, equipos: s.equipos || [], miembros: s.miembros || {},
      base_puntos: s.base_puntos || {}, reto_vigente: s.reto_vigente || null,
      retos_historial: s.retos_historial || [], registros: s.registros || [],
      visitas_conteo: s.visitas_conteo || {}, puntos_extra: s.puntos_extra || [],
      feedback: s.feedback || [], historial: s.historial || [], interacciones: []
    };
  }
  // Escritura remota estándar: POST -> refresca cache -> devuelve respuesta.
  async function remoteWrite(accion, payload) {
    const r = await remotePost(accion, payload);
    if (r && r.error) return r;
    await refreshCache();
    return r || { ok: true };
  }

  /* ---------- Motor de puntaje (§5) ---------- */
  const PUNTOS = { asistencia: 10, puntualidad: 10, reto: 15, visita: 15 };
  const PUNTOS_LOGRO = { colaboracion: 10, dinamica: 15, proyecto: 20, actividad: 15 };
  const LOGRO_LABEL = {
    colaboracion: 'Colaboración con la sociedad', dinamica: 'Ganaron una dinámica',
    proyecto: 'Proyecto comunitario cumplido', actividad: 'Actividad extendida (retiro/campamento)'
  };
  function pAsistencia(p, t) { return t ? Math.round((p / t) * PUNTOS.asistencia) : 0; }
  function pPuntualidad(a, t) { return t ? Math.round((a / t) * PUNTOS.puntualidad) : 0; }
  function pReto(r) { if (r.tipo === 'grupal') return r.cumplido ? PUNTOS.reto : 0; if (!r.total) return 0; return r.cumplidos >= r.total ? PUNTOS.reto : 0; }
  function pVisita(nombre, d) { if (!nombre || !nombre.trim()) return 0; const v = d.visitas_conteo[nombre.trim()] || 0; return v < 3 ? PUNTOS.visita : 0; }
  function pActividad(pct) { return pct > 50 ? PUNTOS_LOGRO.actividad : 0; }
  function pLogro(l) { return l.tipo === 'actividad' ? pActividad(l.porcentaje || 0) : (PUNTOS_LOGRO[l.tipo] || 0); }
  function totalRegistro(reg, d) {
    let t = 0;
    t += reg.asistencia.puntos != null ? reg.asistencia.puntos : pAsistencia(reg.asistencia.presentes, reg.asistencia.total);
    t += reg.puntualidad.puntos != null ? reg.puntualidad.puntos : pPuntualidad(reg.puntualidad.a_tiempo, reg.puntualidad.total);
    t += reg.reto.puntos != null ? reg.reto.puntos : pReto(reg.reto);
    t += reg.visita.puntos != null ? reg.visita.puntos : pVisita(reg.visita.nombre, d);
    (reg.logros || []).forEach(l => { if (l.confirmado) t += (l.puntos != null ? l.puntos : pLogro(l)); });
    return t;
  }
  function inWindow(fechaStr, tipo) {
    if (tipo === 'acumulado' || !fechaStr) return true;
    let f; try { f = new Date(fechaStr + 'T00:00:00'); } catch (e) { return true; }
    const now = new Date();
    if (tipo === 'semanal') { const s = new Date(now); s.setHours(0,0,0,0); s.setDate(s.getDate() - s.getDay()); return f >= s; }
    if (tipo === 'mensual') { const s = new Date(now.getFullYear(), now.getMonth(), 1); return f >= s; }
    return true;
  }

  /* ============ Lógica local de escritura (modo demo) ============ */
  let _counter = 0;
  function next() { _counter += 1; return _counter; }
  function nowHora() {
    try { const d = new Date(); let h = d.getHours(), m = d.getMinutes(); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + ':' + String(m).padStart(2, '0') + ap; }
    catch (e) { return '—'; }
  }

  function pinEnUsoLocal(pin) {
    const d = db();
    return d.config.pin_validador === pin || d.equipos.some(e => e.pin === pin || e.pin_lider === pin);
  }
  function _crearEquipo({ nombre, pin, color, grito, versiculo, miembros, capacidad_max }) {
    const d = db();
    let id = (nombre || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '').slice(0, 14) || ('eq' + d.equipos.length);
    if (d.equipos.some(e => e.id === id)) id += '-' + next();
    if (pinEnUsoLocal(pin)) return { error: 'Ese PIN ya está en uso, elige otro' };
    const eq = { id, nombre, inicial: (nombre || '?').charAt(0).toUpperCase(), color: color || '#1A3A8F', pin, capacidad_max: capacidad_max || 7, activo: true, grito: grito || '', versiculo: versiculo || '', creado_por_secretario: true };
    d.equipos.push(eq); d.miembros[id] = (miembros || []).filter(Boolean);
    d.base_puntos[id] = { semanal: 0, mensual: 0, acumulado: 0 };
    persist(); return eq;
  }
  function _actualizarEquipo(id, cambios) {
    const d = db(); const eq = d.equipos.find(e => e.id === id); if (!eq) return null;
    if (cambios.pin != null && cambios.pin !== eq.pin && pinEnUsoLocal(cambios.pin)) return { error: 'Ese PIN ya está en uso, elige otro' };
    if (cambios.pin_lider != null && cambios.pin_lider !== (eq.pin_lider || '') && pinEnUsoLocal(cambios.pin_lider)) return { error: 'Ese código ya está en uso, elige otro' };
    Object.assign(eq, cambios); if (cambios.miembros) d.miembros[id] = cambios.miembros.filter(Boolean);
    persist(); return eq;
  }
  function _registrarSecretario(payload) {
    const d = db(); const id = 'reg-' + payload.equipo_id + '-' + next(); const reto = d.reto_vigente || {};
    const reg = {
      id, equipo_id: payload.equipo_id, fecha: hoyISO(), hora: nowHora(), estado: 'pendiente',
      asistencia: { presentes: payload.presentes, total: payload.total, validada: false },
      puntualidad: { a_tiempo: payload.a_tiempo, total: payload.presentes, validada: false },
      reto: { tipo: reto.tipo || payload.reto_tipo, cumplidos: payload.reto_cumplidos, total: payload.total, cumplido: payload.reto_cumplido, validada: false },
      visita: { nombre: payload.visita_nombre || '', validada: false },
      logros: (payload.logros || []).map(l => ({ tipo: l.tipo, descripcion: l.descripcion || '', porcentaje: l.porcentaje, confirmado: false })),
      detalle: payload.detalle || {}
    };
    d.registros.push(reg); persist(); return reg;
  }
  function _validarPunto(registroId, criterio, ajuste) {
    const d = db(); const r = d.registros.find(x => x.id === registroId); if (!r) return null;
    if (criterio === 'asistencia') { if (ajuste != null) r.asistencia.presentes = ajuste; r.asistencia.validada = true; r.asistencia.puntos = pAsistencia(r.asistencia.presentes, r.asistencia.total); }
    else if (criterio === 'puntualidad') { if (ajuste != null) r.puntualidad.a_tiempo = ajuste; r.puntualidad.validada = true; r.puntualidad.puntos = pPuntualidad(r.puntualidad.a_tiempo, r.puntualidad.total); }
    else if (criterio === 'reto') { if (ajuste != null) r.reto.cumplidos = ajuste; r.reto.validada = true; r.reto.puntos = pReto(r.reto); }
    else if (criterio === 'visita') { r.visita.validada = true; r.visita.puntos = pVisita(r.visita.nombre, d); }
    persist(); return r;
  }
  function _deshacerPunto(registroId, criterio) {
    const d = db(); const r = d.registros.find(x => x.id === registroId); if (!r || !r[criterio]) return null;
    r[criterio].validada = false; delete r[criterio].puntos; persist(); return r;
  }
  function _confirmarLogro(registroId, idx, opt) {
    opt = opt || {}; const d = db(); const r = d.registros.find(x => x.id === registroId); if (!r || !r.logros[idx]) return null;
    const l = r.logros[idx]; if (opt.porcentaje != null) l.porcentaje = opt.porcentaje;
    l.confirmado = true; l.cumplido = opt.cumplido !== false; l.puntos = l.cumplido ? pLogro(l) : 0;
    persist(); return r;
  }
  function _deshacerLogro(registroId, idx) {
    const d = db(); const r = d.registros.find(x => x.id === registroId); if (!r || !r.logros[idx]) return null;
    r.logros[idx].confirmado = false; delete r.logros[idx].puntos; delete r.logros[idx].cumplido; persist(); return r;
  }
  function _finalizarValidacion(registroId) {
    const d = db(); const r = d.registros.find(x => x.id === registroId); if (!r) return null;
    const baseOk = r.asistencia.validada && r.puntualidad.validada && r.reto.validada && (r.visita.nombre ? r.visita.validada : true);
    const logrosOk = (r.logros || []).every(l => l.confirmado);
    if (!baseOk || !logrosOk) return { error: 'Faltan criterios por confirmar' };
    r.total_puntos_semana = totalRegistro(r, d); r.estado = 'validado';
    if (r.visita.nombre && r.visita.puntos > 0) { const n = r.visita.nombre.trim(); d.visitas_conteo[n] = (d.visitas_conteo[n] || 0) + 1; }
    d.historial = d.historial || [];
    const eqName = (d.equipos.find(e => e.id === r.equipo_id) || {}).nombre || r.equipo_id;
    const baseTotal = (r.asistencia.puntos || 0) + (r.puntualidad.puntos || 0) + (r.reto.puntos || 0);
    d.historial.unshift({ id: 'h-' + next(), registro_id: r.id, equipo_id: r.equipo_id, equipo: eqName, concepto: 'Registro semanal (asistencia, puntualidad, reto)', puntos: baseTotal, aprobado_por: 'Directiva', fecha: hoyISO(), hora: nowHora() });
    if (r.visita.nombre && (r.visita.puntos || 0) > 0) d.historial.unshift({ id: 'h-' + next(), registro_id: r.id, equipo_id: r.equipo_id, equipo: eqName, concepto: 'Visita: ' + r.visita.nombre, puntos: r.visita.puntos, aprobado_por: 'Directiva', fecha: hoyISO(), hora: nowHora() });
    (r.logros || []).forEach(l => { if (l.confirmado && (l.puntos || 0) > 0) d.historial.unshift({ id: 'h-' + next(), registro_id: r.id, equipo_id: r.equipo_id, equipo: eqName, concepto: LOGRO_LABEL[l.tipo] || l.tipo, puntos: l.puntos, aprobado_por: 'Directiva', fecha: hoyISO(), hora: nowHora() }); });
    persist(); return r;
  }
  function _reabrirRegistro(id) {
    const d = db(); const r = d.registros.find(x => x.id === id); if (!r || r.estado !== 'validado') return null;
    if (r.visita.nombre && r.visita.puntos > 0) { const n = r.visita.nombre.trim(); d.visitas_conteo[n] = Math.max(0, (d.visitas_conteo[n] || 0) - 1); }
    d.historial = (d.historial || []).filter(h => h.registro_id !== id);
    delete r.total_puntos_semana; r.estado = 'pendiente'; persist(); return r;
  }
  function _otorgarPuntoExtra({ equipo_id, tipo, descripcion, porcentaje, otorgado_por }) {
    const d = db(); const pts = tipo === 'actividad' ? pActividad(porcentaje || 0) : (PUNTOS_LOGRO[tipo] || 0);
    const reg = { id: 'ext-' + next(), equipo_id, tipo, descripcion: descripcion || LOGRO_LABEL[tipo], puntos: pts, fecha: hoyISO(), otorgado_por: otorgado_por || 'Directiva' };
    d.puntos_extra.push(reg); d.historial = d.historial || [];
    const eqName = (d.equipos.find(e => e.id === equipo_id) || {}).nombre || equipo_id;
    d.historial.unshift({ id: 'h-' + next(), registro_id: null, equipo_id, equipo: eqName, concepto: (LOGRO_LABEL[tipo] || tipo) + (descripcion ? ' · ' + descripcion : ''), puntos: pts, aprobado_por: otorgado_por || 'Directiva', fecha: hoyISO(), hora: nowHora() });
    persist(); return reg;
  }
  function _crearReto({ descripcion, tipo }) {
    const d = db();
    if (d.reto_vigente) { d.reto_vigente.activo = false; (d.retos_historial = d.retos_historial || []).unshift(d.reto_vigente); }
    d.reto_vigente = { id: 'r-' + next(), descripcion, tipo, activo: true, fecha: hoyISO() }; persist(); return d.reto_vigente;
  }
  function _interaccionesDe(equipoId) {
    return (db().interacciones || []).filter(i => !equipoId || i.equipo_id === equipoId)
      .slice().sort((a, b) => (b.fecha + b.id).localeCompare(a.fecha + a.id));
  }
  function _datosLider(eq) {
    const d = db();
    return { ok: true, interacciones: _interaccionesDe(eq.id),
      actividades: (d.actividades || []).filter(a => a.equipo_id === eq.id).slice().sort((a, b) => (b.fecha + b.id).localeCompare(a.fecha + a.id)),
      hora_oracion: eq.hora_oracion || '' };
  }
  function _datosDirectiva() {
    const d = db(); const horas = {}; d.equipos.forEach(e => { if (e.hora_oracion) horas[e.id] = e.hora_oracion; });
    return { ok: true, interacciones: _interaccionesDe(null), actividades: (d.actividades || []).slice(), horas_oracion: horas };
  }
  function _registrarActividad(pin, p) {
    const d = db(); const eq = _equipoDeLider(pin); if (!eq) return { error: 'código de líder inválido' };
    if (!['oracion', 'crecimiento'].includes(p.tipo)) return { error: 'tipo de actividad inválido' };
    if (p.tipo === 'crecimiento' && !(p.descripcion || '').trim()) return { error: 'describe la actividad' };
    const nombres = d.miembros[eq.id] || [];
    const fecha = p.fecha || fechaLocal(new Date());
    d.actividades = d.actividades || [];
    if (p.tipo === 'oracion') d.actividades = d.actividades.filter(a => !(a.equipo_id === eq.id && a.tipo === 'oracion' && a.fecha === fecha));
    d.actividades.push({ id: 'act-' + Date.now() + '-' + next(), equipo_id: eq.id, tipo: p.tipo,
      subtipo: p.tipo === 'crecimiento' ? (p.subtipo === 'estudio' ? 'estudio' : 'actividad') : '',
      descripcion: (p.descripcion || '').trim(), fecha, participantes: (p.participantes || []).filter(n => nombres.includes(n)) });
    persist(); return _datosLider(eq);
  }
  function _eliminarActividad(pin, id) {
    const d = db(); const eq = _equipoDeLider(pin); if (!eq) return { error: 'código de líder inválido' };
    d.actividades = (d.actividades || []).filter(a => !(a.id === id && a.equipo_id === eq.id));
    persist(); return _datosLider(eq);
  }
  function _fijarHoraOracion(pin, hora) {
    const eq = _equipoDeLider(pin); if (!eq) return { error: 'código de líder inválido' };
    eq.hora_oracion = /^\d{2}:\d{2}$/.test(hora || '') ? hora : '';
    persist(); return _datosLider(eq);
  }
  function _equipoDeLider(pin) { return db().equipos.find(e => e.pin_lider && e.pin_lider === pin && e.activo) || null; }
  function _registrarInteraccion(pin, p) {
    const d = db(); const eq = _equipoDeLider(pin); if (!eq) return { error: 'código de líder inválido' };
    if (!['visita', 'contacto', 'necesidad'].includes(p.tipo)) return { error: 'tipo de seguimiento inválido' };
    if (!(d.miembros[eq.id] || []).includes(p.miembro)) return { error: 'esa persona no es parte de tu grupo' };
    if (p.tipo === 'necesidad' && !(p.nota || '').trim()) return { error: 'describe la necesidad' };
    (d.interacciones = d.interacciones || []).push({ id: 'int-' + Date.now() + '-' + next(), equipo_id: eq.id, miembro: p.miembro, tipo: p.tipo,
      nota: (p.nota || '').trim(), ayuda: (p.ayuda || '').trim(), estado: p.tipo === 'necesidad' ? 'abierta' : '',
      fecha: p.fecha || hoyISO(), lider: eq.lider_nombre || 'Líder', atendida_en: null });
    persist(); return _datosLider(eq);
  }
  function _actualizarInteraccion(pin, id, estado) {
    const d = db(); const it = (d.interacciones || []).find(i => i.id === id); if (!it) return { error: 'registro no encontrado' };
    const eq = _equipoDeLider(pin); const esDirectiva = !eq && d.config.pin_validador === pin;
    if (!esDirectiva && !(eq && eq.id === it.equipo_id)) return { error: 'sin permiso' };
    it.estado = estado === 'atendida' ? 'atendida' : 'abierta'; it.atendida_en = it.estado === 'atendida' ? hoyISO() : null;
    persist(); return esDirectiva ? _datosDirectiva() : _datosLider(eq);
  }
  function _enviarFeedback({ rating, comentario }) {
    const d = db(); const fb = { id: 'fb-' + next(), rating: rating || 0, comentario: (comentario || '').trim(), fecha: hoyISO() };
    (d.feedback = d.feedback || []).push(fb); persist(); return fb;
  }

  /* ============ Indicadores del líder ============ */
  // Se calculan con el detalle por persona que envía el secretario (quién asistió,
  // quién llegó a tiempo, quién cumplió el reto). Registros viejos sin detalle
  // solo cuentan para el promedio del grupo.
  const pct = (n, t) => (t ? Math.round((n / t) * 100) : null);
  function estadoMiembro(m) {
    if (!m.reuniones) return 'sin_datos';
    if (m.racha_ausencias >= 2 || (m.reuniones >= 2 && m.asistencia < 50)) return 'atencion';
    if (m.asistencia < 75 || (m.puntualidad != null && m.puntualidad < 60)) return 'seguimiento';
    return 'bien';
  }
  function indicadores(d, equipoId) {
    const regs = d.registros.filter(r => r.equipo_id === equipoId).slice()
      .sort((a, b) => (a.fecha + (a.id || '')).localeCompare(b.fecha + (b.id || '')));
    const conDetalle = regs.filter(r => r.detalle && Array.isArray(r.detalle.presentes) && r.detalle.presentes.length + (r.detalle.miembros || []).length > 0);
    const miembros = (d.miembros[equipoId] || []).map(nombre => {
      // Solo cuentan las reuniones en las que la persona ya era parte del equipo.
      const suyas = conDetalle.filter(r => !(r.detalle.miembros || []).length || r.detalle.miembros.includes(nombre));
      const asistio = suyas.map(r => r.detalle.presentes.includes(nombre));
      const presentes = asistio.filter(Boolean).length;
      const aTiempo = suyas.filter(r => r.detalle.presentes.includes(nombre) && (r.detalle.a_tiempo || []).includes(nombre)).length;
      const conRetoInd = suyas.filter(r => r.reto && r.reto.tipo === 'individual');
      const retos = conRetoInd.filter(r => (r.detalle.reto || []).includes(nombre)).length;
      let racha = 0; for (let i = asistio.length - 1; i >= 0 && !asistio[i]; i--) racha++;
      const m = { nombre, reuniones: suyas.length, presentes, asistencia: pct(presentes, suyas.length),
        puntualidad: pct(aTiempo, presentes), retos, retos_total: conRetoInd.length, reto: pct(retos, conRetoInd.length),
        racha_ausencias: racha, ultimas: asistio.slice(-6) };
      m.estado = estadoMiembro(m);
      return m;
    });
    const sum = (f) => regs.reduce((s, r) => s + (f(r) || 0), 0);
    const indRegs = regs.filter(r => r.reto && r.reto.tipo === 'individual');
    const ranking = API.ranking('acumulado');
    const fila = ranking.find(f => f.id === equipoId) || null;
    return {
      reuniones: regs.length,
      grupo: {
        asistencia: pct(sum(r => r.asistencia.presentes), sum(r => r.asistencia.total)),
        puntualidad: pct(sum(r => r.puntualidad.a_tiempo), sum(r => r.puntualidad.total)),
        reto: pct(indRegs.reduce((s, r) => s + (r.reto.cumplidos || 0), 0), indRegs.reduce((s, r) => s + (r.reto.total || 0), 0))
      },
      semanas: regs.slice(-8).map(r => ({ fecha: r.fecha, presentes: r.asistencia.presentes, total: r.asistencia.total, estado: r.estado })),
      miembros,
      atencion: miembros.filter(m => m.estado === 'atencion'),
      ranking, posicion: fila ? fila.pos : null, puntos: fila ? fila.puntos : 0
    };
  }

  /* ============ Seguimiento semanal del líder ============ */
  // Meta: al menos un contacto (visita, llamada/mensaje o necesidad atendida en
  // persona) con cada integrante por semana. La semana empieza el domingo.
  function seguimiento(d, equipoId, lista) {
    const suyas = (lista || []).filter(i => i.equipo_id === equipoId);
    const miembros = (d.miembros[equipoId] || []).map(nombre => {
      const deEl = suyas.filter(i => i.miembro === nombre);
      const semana = deEl.filter(i => inWindow(i.fecha, 'semanal'));
      return { nombre, interacciones: deEl, contactado_semana: semana.length > 0, semana,
        ultima: deEl[0] || null, abiertas: deEl.filter(i => i.tipo === 'necesidad' && i.estado === 'abierta') };
    });
    return { miembros, total: miembros.length, contactados: miembros.filter(m => m.contactado_semana).length,
      sin_contacto: miembros.filter(m => !m.contactado_semana),
      necesidades_abiertas: suyas.filter(i => i.tipo === 'necesidad' && i.estado === 'abierta') };
  }

  /* ============ Vida del equipo (oración diaria + crecimiento) ============ */
  // Semana de domingo a sábado (igual que el ranking semanal).
  function vidaEquipo(d, equipoId, actividades) {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(hoy); inicio.setDate(hoy.getDate() - hoy.getDay());
    const dias = Array.from({ length: 7 }, (_, i) => { const f = new Date(inicio); f.setDate(inicio.getDate() + i); return fechaLocal(f); });
    const hoyStr = fechaLocal(hoy);
    const suyas = (actividades || []).filter(a => a.equipo_id === equipoId);
    const semana = suyas.filter(a => a.fecha >= dias[0] && a.fecha <= dias[6]);
    const oraciones = semana.filter(a => a.tipo === 'oracion');
    const crecimiento = semana.filter(a => a.tipo === 'crecimiento');
    const porMiembro = {};
    (d.miembros[equipoId] || []).forEach(n => {
      porMiembro[n] = { oraciones: oraciones.filter(a => a.participantes.includes(n)).length,
                        crecimiento: crecimiento.filter(a => a.participantes.includes(n)).length };
    });
    return {
      dias: dias.map(f => ({ fecha: f, futuro: f > hoyStr, hoy: f === hoyStr, oracion: oraciones.find(a => a.fecha === f) || null })),
      dias_transcurridos: dias.filter(f => f <= hoyStr).length,
      oraciones: oraciones.length, oracion_hoy: oraciones.find(a => a.fecha === hoyStr) || null,
      crecimiento, por_miembro: porMiembro,
      historial: suyas.slice(0, 12)
    };
  }

  /* ============================ API pública ============================ */
  const API = {
    /* ---- init ---- */
    async init() {
      if (backendMode()) { try { await refreshCache(); } catch (e) { if (!cache) cache = normalizeSnapshot({}); } }
      else { db(); }
      return true;
    },

    /* ---- meta ---- */
    colores: () => COLORES.slice(),
    logroLabel: (t) => LOGRO_LABEL[t] || t,
    logroPuntos: (t) => PUNTOS_LOGRO[t] || 0,
    config() { return db().config; },

    /* ---- lecturas (síncronas, desde cache) ---- */
    equipos() { const d = db(); return d.equipos.filter(e => e.activo).map(e => ({ ...e, miembros: (d.miembros[e.id] || []).length })); },
    todosLosEquipos() { const d = db(); return d.equipos.map(e => ({ ...e, miembros: (d.miembros[e.id] || []).length })); },
    equipo(id) { return db().equipos.find(e => e.id === id) || null; },
    miembros(equipoId) { return (db().miembros[equipoId] || []).slice(); },
    retoVigente() { return db().reto_vigente; },
    retosHistorial() { return (db().retos_historial || []).slice(); },

    ranking(tipo) {
      const d = db();
      const ventana = ['semanal', 'mensual', 'acumulado'].includes(tipo) ? tipo : 'acumulado';
      const filas = d.equipos.filter(e => e.activo).map(e => {
        const base = (d.base_puntos[e.id] || {})[ventana] || 0;
        const extra = d.registros.filter(r => r.equipo_id === e.id && r.estado === 'validado' && inWindow(r.fecha, ventana)).reduce((s, r) => s + (r.total_puntos_semana || 0), 0);
        const xtra = d.puntos_extra.filter(p => p.equipo_id === e.id && inWindow(p.fecha, ventana)).reduce((s, p) => s + p.puntos, 0);
        return { id: e.id, nombre: e.nombre, inicial: e.inicial, color: e.color, color_text: e.color_text, grito: e.grito, versiculo: e.versiculo, miembros: (d.miembros[e.id] || []).length, puntos: base + extra + xtra };
      });
      filas.sort((a, b) => b.puntos - a.puntos); filas.forEach((f, i) => f.pos = i + 1); return filas;
    },

    pendientes() {
      const d = db();
      return d.registros.filter(r => r.estado === 'pendiente').map(r => { const eq = d.equipos.find(e => e.id === r.equipo_id); return { ...r, equipo_nombre: eq ? eq.nombre : r.equipo_id, equipo: eq }; });
    },
    registro(id) {
      const d = db(); const r = d.registros.find(x => x.id === id); if (!r) return null;
      const eq = d.equipos.find(e => e.id === r.equipo_id);
      return JSON.parse(JSON.stringify({ ...r, equipo_nombre: eq ? eq.nombre : r.equipo_id, equipo: eq }));
    },
    revisados() {
      const d = db();
      return d.registros.filter(r => r.estado === 'validado').map(r => { const eq = d.equipos.find(e => e.id === r.equipo_id); return JSON.parse(JSON.stringify({ ...r, equipo_nombre: eq ? eq.nombre : r.equipo_id })); }).reverse();
    },
    historial() { return (db().historial || []).slice(); },
    puntosExtraList() { return (db().puntos_extra || []).slice().reverse(); },
    feedbackList() { return (db().feedback || []).slice().reverse(); },
    feedbackResumen() { const list = db().feedback || []; const n = list.length; const avg = n ? (list.reduce((s, f) => s + (f.rating || 0), 0) / n) : 0; return { total: n, promedio: Math.round(avg * 10) / 10 }; },

    indicadoresEquipo(equipoId) { return indicadores(db(), equipoId); },
    seguimientoEquipo(equipoId, interacciones) { return seguimiento(db(), equipoId, interacciones); },
    vidaEquipo(equipoId, actividades) { return vidaEquipo(db(), equipoId, actividades); },
    hoyLocal() { return fechaLocal(new Date()); },
    tipoInteraccionLabel: (t) => ({ visita: 'Visita', contacto: 'Contacto', necesidad: 'Necesidad identificada' }[t] || t),

    /* ---- seguimiento privado (requiere código de líder o PIN de directiva) ---- */
    // Devuelven { interacciones, actividades, hora_oracion | horas_oracion }.
    async datosLider(pin) {
      const vacio = { interacciones: [], actividades: [], hora_oracion: '' };
      if (backendMode()) { const r = await remotePost('interacciones_lider', { pin }); return (r && r.ok) ? r : vacio; }
      return _equipoDeLider(pin) ? _datosLider(_equipoDeLider(pin)) : vacio;
    },
    async datosDirectiva(pin) {
      const vacio = { interacciones: [], actividades: [], horas_oracion: {} };
      if (backendMode()) { const r = await remotePost('interacciones_directiva', { pin }); return (r && r.ok) ? r : vacio; }
      return db().config.pin_validador === pin ? _datosDirectiva() : vacio;
    },
    async registrarActividad(pin, payload) {
      if (backendMode()) return remotePost('registrar_actividad', Object.assign({ pin }, payload));
      return _registrarActividad(pin, payload);
    },
    async eliminarActividad(pin, id) {
      if (backendMode()) return remotePost('eliminar_actividad', { pin, id });
      return _eliminarActividad(pin, id);
    },
    async fijarHoraOracion(pin, hora) {
      if (backendMode()) return remotePost('fijar_hora_oracion', { pin, hora });
      return _fijarHoraOracion(pin, hora);
    },
    async registrarInteraccion(pin, payload) {
      if (backendMode()) return remotePost('registrar_interaccion', Object.assign({ pin }, payload));
      return _registrarInteraccion(pin, payload);
    },
    async actualizarInteraccion(pin, id, estado) {
      if (backendMode()) return remotePost('actualizar_interaccion', { pin, id, estado });
      return _actualizarInteraccion(pin, id, estado);
    },

    calc: { asistencia: pAsistencia, puntualidad: pPuntualidad, reto: pReto, visita: (n) => pVisita(n, db()), actividad: pActividad, logro: pLogro },

    /* ---- login (async) ---- */
    async verificarPinEquipo(pin) {
      if (backendMode()) { const r = await remotePost('verificar_pin_equipo', { pin }); return (r && r.ok) ? r.equipo : null; }
      return db().equipos.find(e => e.pin === pin && e.activo) || null;
    },
    async verificarPinLider(pin) {
      if (backendMode()) { const r = await remotePost('verificar_pin_lider', { pin }); return (r && r.ok) ? r.equipo : null; }
      return db().equipos.find(e => e.pin_lider && e.pin_lider === pin && e.activo) || null;
    },
    async verificarPinValidador(pin) {
      if (backendMode()) { const r = await remotePost('verificar_pin_validador', { pin }); return !!(r && r.ok); }
      return db().config.pin_validador === pin;
    },

    /* ---- escrituras (async) ---- */
    async crearEquipo(payload) {
      if (backendMode()) { const r = await remotePost('crear_equipo', payload); if (r && r.error) return r; await refreshCache(); return db().equipos.find(e => e.id === r.id) || { error: 'No se pudo crear el equipo' }; }
      return _crearEquipo(payload);
    },
    async actualizarEquipo(id, cambios) {
      if (backendMode()) return remoteWrite('actualizar_equipo', Object.assign({ id }, cambios));
      return _actualizarEquipo(id, cambios);
    },
    async registrarSecretario(payload) {
      if (backendMode()) return remoteWrite('registrar_secretario', payload);
      return _registrarSecretario(payload);
    },
    async validarPunto(registroId, criterio, ajuste) {
      if (backendMode()) return remoteWrite('validar_punto', { registro_id: registroId, criterio, valor_ajustado: ajuste });
      return _validarPunto(registroId, criterio, ajuste);
    },
    async deshacerPunto(registroId, criterio) {
      if (backendMode()) return remoteWrite('deshacer_punto', { registro_id: registroId, criterio });
      return _deshacerPunto(registroId, criterio);
    },
    async confirmarLogro(registroId, idx, opt) {
      if (backendMode()) return remoteWrite('confirmar_logro', { registro_id: registroId, indice: idx, cumplido: opt ? opt.cumplido : true, porcentaje: opt ? opt.porcentaje : undefined });
      return _confirmarLogro(registroId, idx, opt);
    },
    async deshacerLogro(registroId, idx) {
      if (backendMode()) return remoteWrite('deshacer_logro', { registro_id: registroId, indice: idx });
      return _deshacerLogro(registroId, idx);
    },
    async finalizarValidacion(registroId) {
      if (backendMode()) return remoteWrite('finalizar_validacion', { registro_id: registroId });
      return _finalizarValidacion(registroId);
    },
    async reabrirRegistro(id) {
      if (backendMode()) return remoteWrite('reabrir_registro', { registro_id: id });
      return _reabrirRegistro(id);
    },
    async otorgarPuntoExtra(payload) {
      if (backendMode()) return remoteWrite('otorgar_punto_extra', payload);
      return _otorgarPuntoExtra(payload);
    },
    async crearReto(payload) {
      if (backendMode()) return remoteWrite('crear_reto', payload);
      return _crearReto(payload);
    },
    async enviarFeedback(payload) {
      if (backendMode()) return remoteWrite('enviar_feedback', payload);
      return _enviarFeedback(payload);
    },

    /* ---- utilidad de demo ---- */
    _reset() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} cache = null; if (!backendMode()) db(); return true; }
  };

  window.API = API;
})();
