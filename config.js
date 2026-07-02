/* =========================================================
   IMPARABLE — Configuración
   ---------------------------------------------------------
   Detecta el entorno automáticamente:
   - En local (localhost / archivo) -> modo DEMO (datos de
     prueba en el navegador, no tocan la base real).
   - Desplegado (Vercel) -> usa la mini-API "/api/imparable"
     que habla con tu base de datos Neon.

   Si alguna vez quieres forzar un modo, cambia API_URL a mano:
     ""               -> demo
     "/api/imparable" -> backend Neon
   Ver DEPLOY.md.
   ========================================================= */
(function () {
  var h = (location.hostname || '').toLowerCase();
  var esLocal = h === 'localhost' || h === '127.0.0.1' || h === '' || location.protocol === 'file:';
  window.IMPARABLE_CONFIG = {
    API_URL: esLocal ? '' : '/api/imparable'
  };
})();
