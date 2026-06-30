/* =========================================================
   IMPARABLE — Configuración
   ---------------------------------------------------------
   API_URL apunta a la mini-API (función serverless en Vercel)
   que habla con la base de datos Neon.

   - VACÍO ("")  -> modo DEMO (datos de prueba en el navegador,
     no se guardan en línea). Útil para probar sin backend.
   - "/api/imparable" -> usa tu base de datos real en Neon
     (cuando la app está desplegada en Vercel; mismo dominio,
     sin problemas de CORS).

   Ver DEPLOY.md para el paso a paso.
   ========================================================= */
window.IMPARABLE_CONFIG = {
  API_URL: ""   // en producción (Vercel): "/api/imparable"
};
