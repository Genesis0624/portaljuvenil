# Desplegar IMPARABLE con Neon + Vercel

Esta guía conecta la app a una base de datos real **Neon** (PostgreSQL), alojando
todo en **Vercel** (la app y una mini‑API que habla con Neon). El despliegue se hace
desde **GitHub**. Tú ya tienes las tres cuentas.

Arquitectura:
```
Navegador (la app)  ──>  /api/imparable (función en Vercel)  ──>  Neon (base de datos)
```
La contraseña de la base **nunca** llega al navegador: vive como variable de entorno
en Vercel.

---

## Paso 1 — Crear la base de datos en Neon
1. Entra a https://neon.tech y abre (o crea) un proyecto.
2. En el panel del proyecto, busca **Connection string** (cadena de conexión).
   Cópiala. Se ve así:
   `postgresql://usuario:clave@ep-xxxx.neon.tech/neondb?sslmode=require`
   Guárdala, la necesitarás en el Paso 4.
3. Abre el **SQL Editor** de Neon, pega TODO el contenido de **`schema.sql`** y
   ejecútalo. Esto crea las tablas y carga los datos demo (6 equipos, el reto y el
   PIN de administrador `2468`, que puedes cambiar luego en la tabla `config`).

---

## Paso 2 — Subir el proyecto a GitHub
Yo te puedo dejar el repositorio listo (git init + commit). Solo necesito que crees
un repositorio vacío en tu GitHub (o me confirmes su URL) y lo conectamos. Si
prefieres hacerlo tú: sube esta carpeta completa a un repo nuevo de GitHub.

> Importante: el archivo `.gitignore` ya evita subir `node_modules`. No subas la
> cadena de conexión de Neon a GitHub: irá como variable de entorno en Vercel.

---

## Paso 3 — Importar en Vercel
1. Entra a https://vercel.com → **Add New… → Project**.
2. **Import** el repositorio de GitHub de la app.
3. Framework Preset: **Other** (no requiere comando de build). Deja lo demás por
   defecto.
4. Aún **no** pulses Deploy; primero agrega la variable de entorno (Paso 4).

---

## Paso 4 — Conectar Neon (variable de entorno)
1. En la pantalla de importación (o luego en **Settings → Environment Variables**),
   agrega:
   - **Name:** `DATABASE_URL`
   - **Value:** la *connection string* de Neon del Paso 1.
   - Marca los tres entornos (Production, Preview, Development).
2. Ahora sí: **Deploy**.

> Alternativa de un clic: en Vercel, pestaña **Storage → Connect / Create →
> Postgres (Neon)** crea/enlaza la base y agrega `DATABASE_URL` automáticamente.
> Si usas esa, igual debes correr `schema.sql` en el SQL Editor de esa base.

---

## Paso 5 — Activar el modo backend en la app
1. Abre **`config.js`** y pon:
   ```js
   window.IMPARABLE_CONFIG = { API_URL: "/api/imparable" };
   ```
2. Sube el cambio (commit) → Vercel redepliega solo.
   *(Mientras `API_URL` esté vacío, la app sigue en modo demo.)*

---

## Paso 6 — Probar juntos
Cuando esté desplegado, lo probamos de punta a punta contra tu base real:
crear equipo, registrar, validar criterio por criterio, publicar, ver ranking,
historial y feedback. Tu URL pública de Vercel (la del ranking) es la que pones en
el **código QR**.

---

## Notas
- **Cambios en el código:** cada vez que hagas commit a GitHub, Vercel redepliega
  automáticamente. No hay que “re‑publicar” a mano.
- **Zona horaria:** las fechas se calculan en UTC. Si el cambio de día a medianoche
  afecta el corte de “esta semana”, lo ajustamos con una variable de zona horaria.
- **PIN de administrador:** está en la tabla `config` (`pin_validador`). Cámbialo por
  uno tuyo desde el SQL Editor de Neon.
- **Respaldo:** Neon guarda historial/branches de la base; puedes exportar cuando
  quieras.
- **Seguridad:** la app pública (QR) no expone los PINs; la verificación se hace en
  el servidor. Comparte el acceso de directiva/secretario solo con quien corresponda.
