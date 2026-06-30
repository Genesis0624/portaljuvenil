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

  const STORE_KEY = 'imparable_v2';

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
        { id: 'aguilas',    nombre: 'Águilas',    inicial: 'A', color: '#D4A017', pin: '1001', capacidad_max: 7, activo: true, grito: '¡Águilas, alto vuelo!', versiculo: 'Isaías 40:31' },
        { id: 'centinelas', nombre: 'Centinelas', inicial: 'C', color: '#dfe6f2', color_text:'#0B1F4B', pin: '1002', capacidad_max: 7, activo: true, grito: '¡Centinelas en guardia!', versiculo: 'Salmo 127:1' },
        { id: 'leones',     nombre: 'Leones',     inicial: 'L', color: '#c08a5a', pin: '1003', capacidad_max: 7, activo: true, grito: '¡Leones, rugido de fe!', versiculo: 'Proverbios 28:1' },
        { id: 'vencedores', nombre: 'Vencedores', inicial: 'V', color: '#2EB872', pin: '1004', capacidad_max: 7, activo: true, grito: '¡Más que vencedores!', versiculo: 'Romanos 8:37' },
        { id: 'embajadores',nombre: 'Embajadores',inicial: 'E', color: '#8E5BD0', pin: '1005', capacidad_max: 7, activo: true, grito: '¡Embajadores del Rey!', versiculo: '2 Corintios 5:20' },
        { id: 'centella',   nombre: 'Centella',   inicial: 'C', color: '#E07B39', pin: '1006', capacidad_max: 7, activo: true, grito: '¡Centella que enciende!', versiculo: 'Mateo 5:16' }
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
          logros: [ { tipo: 'colaboracion', descripcion: 'Ayudamos con la limpieza del templo', confirmado: false } ]
        },
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
      historial: []
    };
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
      feedback: s.feedback || [], historial: s.historial || []
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

  function _crearEquipo({ nombre, pin, color, grito, versiculo, miembros, capacidad_max }) {
    const d = db();
    let id = (nombre || '').toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '').slice(0, 14) || ('eq' + d.equipos.length);
    if (d.equipos.some(e => e.id === id)) id += '-' + next();
    if (d.equipos.some(e => e.pin === pin)) return { error: 'Ese PIN ya está en uso por otro equipo' };
    const eq = { id, nombre, inicial: (nombre || '?').charAt(0).toUpperCase(), color: color || '#1A3A8F', pin, capacidad_max: capacidad_max || 7, activo: true, grito: grito || '', versiculo: versiculo || '', creado_por_secretario: true };
    d.equipos.push(eq); d.miembros[id] = (miembros || []).filter(Boolean);
    d.base_puntos[id] = { semanal: 0, mensual: 0, acumulado: 0 };
    persist(); return eq;
  }
  function _actualizarEquipo(id, cambios) {
    const d = db(); const eq = d.equipos.find(e => e.id === id); if (!eq) return null;
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
      logros: (payload.logros || []).map(l => ({ tipo: l.tipo, descripcion: l.descripcion || '', porcentaje: l.porcentaje, confirmado: false }))
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
  function _enviarFeedback({ rating, comentario }) {
    const d = db(); const fb = { id: 'fb-' + next(), rating: rating || 0, comentario: (comentario || '').trim(), fecha: hoyISO() };
    (d.feedback = d.feedback || []).push(fb); persist(); return fb;
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

    calc: { asistencia: pAsistencia, puntualidad: pPuntualidad, reto: pReto, visita: (n) => pVisita(n, db()), actividad: pActividad, logro: pLogro },

    /* ---- login (async) ---- */
    async verificarPinEquipo(pin) {
      if (backendMode()) { const r = await remotePost('verificar_pin_equipo', { pin }); return (r && r.ok) ? r.equipo : null; }
      return db().equipos.find(e => e.pin === pin && e.activo) || null;
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
