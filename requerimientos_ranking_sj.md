# Documento de requerimientos — Sistema de ranking de equipos, Sociedad de Jóvenes

**Versión:** 1.0
**Estado:** Validado en diseño conceptual, pendiente de implementación final
**Audiencia:** Claude Code / equipo de desarrollo

---

## 1. Resumen del producto

Aplicación web instalable (PWA) que gestiona un sistema de puntaje semanal entre equipos de una Sociedad de Jóvenes adventista. El sistema registra criterios de desempeño por reunión (asistencia, puntualidad, reto semanal, visitas) más puntos extra no semanales (colaboración, dinámicas, proyectos, actividades extendidas), pasa por un flujo de validación humana punto por punto, y expone un ranking público en tres vistas: semanal, mensual y acumulado.

La aplicación debe ser accesible por código QR y descargable/instalable como app (PWA), sin necesidad de tiendas de aplicaciones.

---

## 2. Nota sobre identidad de marca

**Importante para quien implemente:** la identidad visual descrita en la sección 3 fue propuesta durante el diseño conceptual de este proyecto (paleta cálida tipo tablero de marcador deportivo, tipografía Bebas Neue + Manrope). **No proviene de una guía de marca institucional preexistente de esta Sociedad de Jóvenes.** Si la organización ya cuenta con colores, logo o lineamientos de marca propios, esos deben prevalecer sobre lo aquí descrito. Esta sección debe tratarse como punto de partida, no como restricción fija, y debe confirmarse con la persona dueña del producto antes de considerarse definitiva.

---

## 3. Identidad visual propuesta (pendiente de confirmación)

### Paleta de colores

| Token | Valor hex | Uso |
|---|---|---|
| `--bg-deep` | `#1a1410` | Fondo principal, marrón oscuro cálido |
| `--bg-card` | `#241c16` | Fondo de tarjetas |
| `--bg-card-2` | `#2c2219` | Fondo de inputs y elementos secundarios |
| `--gold` | `#e8a730` | Acento principal, color de logro/trofeo |
| `--gold-dim` | `#a8762a` | Acento secundario, etiquetas |
| `--cream` | `#f4ecdc` | Texto principal |
| `--cream-dim` | `#b5a890` | Texto secundario |
| `--green` | `#5c9e5a` | Estados positivos, confirmaciones |
| `--green-dim` | `#2e3d24` | Fondo de estados positivos |
| `--line` | `#3a2f24` | Bordes y divisores |
| `--red` / `--red-dim` | `#c9614a` / `#3a2420` | Estados negativos (uso mínimo) |

### Tipografía

- **Display (números de puntaje, títulos):** Bebas Neue — condensada, con carácter de marcador deportivo
- **Cuerpo de texto:** Manrope, pesos 400/500/600/700
- Ambas vía Google Fonts

### Principios de diseño

- Estética de tablero de campeonato deportivo, no de app corporativa
- El ranking y los puntajes son el elemento visual jerárquico más importante de toda la app
- Top 3 del ranking se presenta como podio visual, no solo como lista
- Iconografía: Tabler Icons (outline), vía CDN
- Sin gradientes ni sombras decorativas; superficies planas

---

## 4. Roles de usuario

| Rol | Acceso | Permisos |
|---|---|---|
| **Secretario de equipo** | PIN numérico de 4 dígitos por equipo | Registra asistencia, puntualidad, reto semanal y visita de su propio equipo. No accede a puntos extra ni a datos de otros equipos. |
| **Validador (directiva)** | PIN propio de administrador | Revisa y confirma o ajusta cada criterio reportado por los secretarios, punto por punto. Único rol que puede otorgar puntos extra. |
| **Público general** | Sin login, acceso abierto | Ve el ranking en sus tres vistas, el reto vigente, y accede al formulario de feedback. |

No existe registro de cuentas individuales por persona del público; el acceso público es completamente anónimo y de solo lectura.

---

## 5. Sistema de puntaje

### 5.1 Criterios semanales (cada reunión)

| Criterio | Puntos máximos | Método de cálculo |
|---|---|---|
| Asistencia | 10 | Proporcional: (miembros presentes / total de miembros del equipo) × 10 |
| Puntualidad | 10 | Proporcional: (miembros a tiempo / total de presentes) × 10 |
| Reto semanal | 15 | Ver lógica diferenciada en 5.2 |
| Visita | 15 por visita nueva, sin tope mensual fijo | Ver lógica en 5.3 |

### 5.2 Reto semanal: dos modalidades

El sistema debe soportar **dos tipos de reto**, definidos por el validador al crear el reto de la semana:

- **Reto individual:** se registra el cumplimiento por cada miembro del equipo. El equipo solo recibe los 15 puntos completos si el 100% de sus miembros cumplió el reto. Si falta uno solo, el equipo no recibe puntos por este criterio (todo o nada, sin proporcionalidad).
- **Reto grupal:** se marca una sola vez por equipo, como cumplido o no cumplido, sin desglose individual.

El reto vigente debe ser visible públicamente en la pantalla principal, indicando su tipo.

### 5.3 Visitas: regla de las 3 veces

- La primera vez que alguien asiste como visita, su equipo recibe 15 puntos extra.
- Esto se repite hasta un máximo de **3 veces por la misma persona**.
- A partir de la 4ª asistencia, esa persona se considera miembro regular del equipo: **no resta puntos, simplemente deja de generar puntos extra por concepto de visita.**
- El sistema debe almacenar el conteo de asistencias por visita, identificada por nombre y equipo, para aplicar esta regla automáticamente.
- El registro de visita lo hace el secretario; la validación de si corresponde otorgar el punto (por el conteo de veces) es automática, no manual.

### 5.4 Puntos extra (no semanales)

| Tipo | Puntos | Regla de otorgamiento |
|---|---|---|
| Colaboración con la sociedad | 10 | Binario: ocurrió o no. No depende de cuántas personas participaron. |
| Ganar dinámica | 15 | Binario: el equipo ganó o no ganó. No depende de cantidad de participantes. |
| Proyecto especial cumplido | 20 | Binario: se completó el proyecto o no. No depende de cuántos miembros participaron. |
| Actividad extendida (retiro, campamento, evento especial) | 15 | Condicional: se otorgan los 15 puntos completos únicamente si participó **más del 50%** del equipo. Si la participación fue 50% o menos, no se otorgan puntos. |

**Estos puntos solo pueden ser otorgados por el rol Validador/Admin, nunca por el secretario.** No están ligados a una reunión semanal específica ni a un registro del secretario; se otorgan de forma independiente cuando ocurre el evento que los genera.

### 5.5 Vistas de ranking

El sistema debe calcular y mostrar el ranking en tres ventanas de tiempo, cada una sumando criterios semanales validados + puntos extra otorgados dentro de la ventana correspondiente:

- **Semanal:** desde el inicio de la semana en curso (domingo) hasta hoy
- **Mensual:** desde el día 1 del mes en curso hasta hoy
- **Acumulado:** todo el histórico desde que el equipo existe

---

## 6. Flujo de validación (crítico, no simplificar)

Este es el flujo central del producto y no debe reducirse a una aprobación general de "todo o nada":

1. **Registro del secretario** (ventana de 3 minutos durante la reunión): el secretario entra con el PIN de su equipo y marca, miembro por miembro, asistencia y puntualidad; marca el reto (individual: por persona / grupal: una vez); y escribe el nombre de la visita si aplica. Envía el registro.
2. **El registro queda en estado "pendiente de validación"** y aparece en la bandeja del validador.
3. **El validador abre el registro** y revisa **cada criterio de forma independiente**, no en bloque:
   - **Asistencia:** ve el número reportado por el secretario, puede ajustarlo si lo verifica diferente, y confirma ese criterio específico.
   - **Puntualidad:** mismo patrón de revisión y ajuste independiente.
   - **Reto:** si es individual, ve cuántos lo cumplieron y puede ajustar el número antes de confirmar; el sistema calcula automáticamente si llegó al 100% para otorgar los 15 puntos. Si es grupal, confirma cumplido/no cumplido.
   - **Visita:** confirma el nombre reportado; el sistema determina automáticamente, según el conteo histórico de esa persona, si corresponde otorgar puntos (regla de las 3 veces).
4. **Cada criterio se confirma individualmente** antes de poder finalizar.
5. **Al finalizar la validación completa del registro**, el sistema calcula el total de puntos de esa semana para ese equipo y los publica: a partir de ese momento el ranking público se actualiza automáticamente.
6. El estado del registro pasa a "validado" y deja de aparecer en la bandeja de pendientes.

La interacción presencial esperada es que el secretario y el validador están físicamente juntos en este momento, mostrando evidencia verbal (lista de asistencia, hora de llegada, evidencia del reto) mientras el validador confirma en pantalla.

---

## 7. Pantallas requeridas

### 7.1 Pantalla pública / ranking (`index.html`)
- Pestañas: Esta semana / Del mes / Acumulado
- Visualización tipo podio para el top 3
- Tabla completa de posiciones debajo del podio
- Tarjeta de "reto de la semana" vigente, indicando si es individual o grupal
- Accesos rápidos a feedback y a la pantalla de secretario
- Navegación inferior fija con accesos a las 4 secciones principales

### 7.2 Pantalla de secretario (`secretario.html`)
- Entrada por PIN de equipo
- Indicador visible de los 3 minutos disponibles para completar el registro
- Lista de miembros del equipo con marcado sí/no para asistencia
- Lista de miembros con marcado sí/no para puntualidad (solo aplica a quienes asistieron)
- Sección de reto, renderizada según el tipo vigente (lista individual o marcado único grupal)
- Campo de texto para nombre de visita (opcional)
- Botón de envío a validación
- Pantalla de confirmación post-envío

### 7.3 Pantalla de validador (`validador.html`)
- Entrada por PIN de administrador (diferente al PIN de los equipos)
- Bandeja de solicitudes pendientes, con nombre de equipo y fecha
- Vista de detalle por registro, con tarjetas independientes por criterio (asistencia, puntualidad, reto, visita), cada una con:
  - Lo reportado por el secretario
  - Campo de ajuste numérico cuando aplica
  - Botón de confirmación individual por criterio
- Botón de "Finalizar y publicar puntos", que debe quedar deshabilitado o claramente distinguido hasta que todos los criterios estén confirmados
- Sección separada y siempre visible para otorgar puntos extra (colaboración, dinámica, proyecto, actividad extendida), con selector de equipo

### 7.4 Pantalla de feedback (`feedback.html`)
- Enlace o formulario embebido hacia Google Forms para retroalimentación de la reunión
- Debe permitir que el responsable del producto actualice el link del formulario sin tocar código (variable de configuración clara)

---

## 8. Backend y almacenamiento de datos

### 8.1 Decisión de arquitectura

Base de datos: **Google Sheets**, con **Google Apps Script** como intermediario (no es posible escribir en Sheets directamente desde JavaScript del navegador sin un backend intermedio).

### 8.2 Estructura de hojas (pestañas) requerida

El Apps Script debe crear estas pestañas automáticamente si no existen, con estas columnas exactas:

**Equipos:** `id, nombre, pin, capacidad_max, activo`

**Miembros:** `id, equipo_id, nombre, es_visita, veces_asistio_visita, fecha_se_unio`

**Registros:** `id, equipo_id, fecha, estado, asistencia_presentes, asistencia_total, asistencia_validada, asistencia_puntos, puntualidad_a_tiempo, puntualidad_total, puntualidad_validada, puntualidad_puntos, reto_tipo, reto_id, reto_cumplidos, reto_total, reto_validado, reto_puntos, visita_nombre, visita_validada, visita_puntos, total_puntos_semana, timestamp_envio, timestamp_validacion`

**Retos:** `id, descripcion, tipo, fecha_inicio, fecha_fin, activo`

**PuntosExtra:** `id, equipo_id, tipo, descripcion, puntos, fecha, otorgado_por`

**Config:** `clave, valor` (incluye PIN del validador y otras configuraciones globales)

### 8.3 Endpoints requeridos (vía `doGet` / `doPost` de Apps Script)

**GET:**
- `?accion=ranking&tipo=semanal|mensual|acumulado` — devuelve ranking calculado
- `?accion=equipos` — lista de equipos activos con conteo de miembros
- `?accion=reto_vigente` — reto activo actual
- `?accion=pendientes_validacion` — registros en estado pendiente
- `?accion=historial_equipo&equipoId=X` — histórico de un equipo

**POST** (body JSON con campo `accion`):
- `crear_equipo` — nombre, pin, capacidad_max
- `registrar_secretario` — payload completo del registro semanal de un equipo
- `validar_punto` — registro_id, criterio, valor_ajustado/cumplido — valida un criterio individual
- `finalizar_validacion` — registro_id — cierra el registro, calcula y publica el total
- `otorgar_punto_extra` — equipo_id, tipo, descripcion, porcentaje_participacion (si aplica), otorgado_por
- `crear_reto` — descripcion, tipo (individual/grupal)

Una implementación de referencia de este Apps Script ya existe (`Codigo.gs`, entregado junto a este documento) y puede usarse como base o reescribirse completamente, siempre que respete los contratos de entrada/salida aquí descritos.

### 8.4 Lógica de negocio que debe vivir en el backend, no en el frontend

- Cálculo proporcional de asistencia y puntualidad
- Regla de todo-o-nada para reto individual
- Regla de las 3 veces para visitas (debe leer histórico antes de otorgar puntos)
- Regla del 50% de participación para actividades extendidas
- Cálculo de ranking por ventana de tiempo (semanal/mensual/acumulado)

El frontend nunca debe calcular puntos finales por sí mismo; solo envía datos crudos y solicita resultados ya calculados.

---

## 9. Requerimientos no funcionales

- **PWA instalable:** manifest.json con ícono, nombre corto, color de tema, `display: standalone`
- **Acceso por QR:** la URL pública desplegada debe poder codificarse en un QR sin parámetros adicionales
- **Sin login para el público:** cero fricción para ver el ranking
- **Tiempo de registro del secretario:** la interfaz debe comunicar visualmente el límite de 3 minutos, aunque no es necesario bloquear el envío por tiempo (es una guía operativa, no una restricción técnica dura salvo que se indique lo contrario)
- **Equipos dinámicos:** el sistema debe permitir crear nuevos equipos en cualquier momento, con capacidad máxima configurable (por defecto 7 miembros), para soportar el crecimiento orgánico de la Sociedad de Jóvenes
- **Responsivo:** prioridad a móvil, ya que el uso principal ocurre en teléfonos durante la reunión

---

## 10. Pendientes conocidos, no resueltos en este documento

Estos puntos deben resolverse antes o durante la implementación, y no deben asumirse:

1. **Ícono de la PWA:** no existe un logo institucional confirmado; se requiere uno antes de finalizar el manifest.
2. **Google Form de feedback:** debe crearse en la cuenta de Google de la persona dueña del producto; el link debe inyectarse en `feedback.html` o por configuración.
3. **Conexión real Apps Script ↔ Sheet:** requiere que la persona dueña del producto despliegue el Apps Script como aplicación web desde su propia cuenta de Google (paso manual, no automatizable por terceros por razones de seguridad de cuenta) y entregue la URL resultante para conectarla al frontend.
4. **Confirmación de identidad de marca:** ver sección 2.
5. **Definición de quién puede crear nuevos equipos/retos:** actualmente implícito como función del rol Validador, pero no se ha confirmado explícitamente si debe restringirse aún más (por ejemplo, solo el director general).

---

## 11. Entregables de referencia ya construidos

Adjuntos a este documento, como prototipo funcional con datos de prueba (no conectado a datos reales):

- `index.html`, `secretario.html`, `validador.html`, `feedback.html`
- `data.js` (datos de prueba, debe eliminarse o sustituirse por las llamadas reales al backend)
- `manifest.json`
- `Codigo.gs` (implementación de referencia del backend en Apps Script)

Estos archivos reflejan fielmente las secciones 3, 7 y 8 de este documento y pueden tomarse como punto de partida de la implementación.
