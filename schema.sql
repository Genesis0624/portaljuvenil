-- =========================================================
-- IMPARABLE — Esquema de base de datos (Neon / PostgreSQL)
-- Pega y ejecuta TODO esto una vez en el SQL Editor de Neon.
-- Crea las tablas y carga los datos demo (equipos, reto, PIN admin).
-- =========================================================

CREATE TABLE IF NOT EXISTS equipos (
  id            TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  inicial       TEXT,
  color         TEXT,
  color_text    TEXT,
  pin           TEXT,
  capacidad_max INT  DEFAULT 7,
  activo        BOOLEAN DEFAULT TRUE,
  grito         TEXT,
  versiculo     TEXT,
  creado_secretario BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS miembros (
  id           TEXT PRIMARY KEY,
  equipo_id    TEXT,
  nombre       TEXT,
  es_visita    BOOLEAN DEFAULT FALSE,
  veces_visita INT     DEFAULT 0,
  fecha_union  DATE
);

CREATE TABLE IF NOT EXISTS registros (
  id              TEXT PRIMARY KEY,
  equipo_id       TEXT,
  fecha           DATE,
  hora            TEXT,
  estado          TEXT,
  asis_presentes  INT, asis_total INT, asis_validada BOOLEAN DEFAULT FALSE, asis_puntos INT,
  punt_a_tiempo   INT, punt_total INT, punt_validada BOOLEAN DEFAULT FALSE, punt_puntos INT,
  reto_tipo       TEXT, reto_cumplidos INT, reto_total INT, reto_cumplido BOOLEAN DEFAULT FALSE,
  reto_validada   BOOLEAN DEFAULT FALSE, reto_puntos INT,
  visita_nombre   TEXT, visita_validada BOOLEAN DEFAULT FALSE, visita_puntos INT,
  logros          JSONB DEFAULT '[]'::jsonb,
  total_puntos    INT,
  enviado         TIMESTAMPTZ DEFAULT now(),
  validado_en     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS retos (
  id          TEXT PRIMARY KEY,
  descripcion TEXT,
  tipo        TEXT,
  fecha       DATE,
  activo      BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS puntos_extra (
  id          TEXT PRIMARY KEY,
  equipo_id   TEXT,
  tipo        TEXT,
  descripcion TEXT,
  puntos      INT,
  fecha       DATE,
  otorgado_por TEXT
);

CREATE TABLE IF NOT EXISTS feedback (
  id         TEXT PRIMARY KEY,
  rating     INT,
  comentario TEXT,
  fecha      DATE,
  creado     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS historial (
  id          TEXT PRIMARY KEY,
  registro_id TEXT,
  equipo_id   TEXT,
  equipo      TEXT,
  concepto    TEXT,
  puntos      INT,
  aprobado_por TEXT,
  fecha       DATE,
  hora        TEXT,
  creado      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS config (
  clave TEXT PRIMARY KEY,
  valor TEXT
);

-- ---------- Datos iniciales (solo si están vacías) ----------
INSERT INTO config (clave, valor) VALUES ('pin_validador', '2468')
  ON CONFLICT (clave) DO NOTHING;

INSERT INTO equipos (id, nombre, inicial, color, color_text, pin, grito, versiculo) VALUES
  ('aguilas',    'Águilas',    'A', '#D4A017', NULL,      '1001', '¡Águilas, alto vuelo!',    'Isaías 40:31'),
  ('centinelas', 'Centinelas', 'C', '#dfe6f2', '#0B1F4B', '1002', '¡Centinelas en guardia!',  'Salmo 127:1'),
  ('leones',     'Leones',     'L', '#c08a5a', NULL,      '1003', '¡Leones, rugido de fe!',   'Proverbios 28:1'),
  ('vencedores', 'Vencedores', 'V', '#2EB872', NULL,      '1004', '¡Más que vencedores!',     'Romanos 8:37'),
  ('embajadores','Embajadores','E', '#8E5BD0', NULL,      '1005', '¡Embajadores del Rey!',    '2 Corintios 5:20'),
  ('centella',   'Centella',   'C', '#E07B39', NULL,      '1006', '¡Centella que enciende!',  'Mateo 5:16')
  ON CONFLICT (id) DO NOTHING;

INSERT INTO retos (id, descripcion, tipo, fecha, activo) VALUES
  ('r-salmo23', 'Memorizar y recitar el Salmo 23 completo', 'individual', CURRENT_DATE, TRUE)
  ON CONFLICT (id) DO NOTHING;

-- Integrantes demo (para que los equipos sean usables de inmediato).
-- Puedes editarlos o crear tus equipos reales desde la app.
INSERT INTO miembros (id, equipo_id, nombre, fecha_union) VALUES
  ('m-aguilas-1','aguilas','Marcos Pérez',CURRENT_DATE),('m-aguilas-2','aguilas','Lucía Fonseca',CURRENT_DATE),
  ('m-aguilas-3','aguilas','Andrés Gil',CURRENT_DATE),('m-aguilas-4','aguilas','Paola Núñez',CURRENT_DATE),
  ('m-aguilas-5','aguilas','Tomás Vera',CURRENT_DATE),('m-aguilas-6','aguilas','Carmen Ruiz',CURRENT_DATE),
  ('m-centinelas-1','centinelas','Iván Solís',CURRENT_DATE),('m-centinelas-2','centinelas','Karen Mora',CURRENT_DATE),
  ('m-centinelas-3','centinelas','Bruno Castro',CURRENT_DATE),('m-centinelas-4','centinelas','Elena Pinto',CURRENT_DATE),
  ('m-centinelas-5','centinelas','Hugo Vargas',CURRENT_DATE),
  ('m-leones-1','leones','Daniel Ortega',CURRENT_DATE),('m-leones-2','leones','Sara Méndez',CURRENT_DATE),
  ('m-leones-3','leones','Josué Rivas',CURRENT_DATE),('m-leones-4','leones','Raquel Lara',CURRENT_DATE),
  ('m-leones-5','leones','Esteban Cruz',CURRENT_DATE),('m-leones-6','leones','Noemí Soto',CURRENT_DATE),
  ('m-leones-7','leones','Caleb Díaz',CURRENT_DATE),
  ('m-vencedores-1','vencedores','Rubén Díaz',CURRENT_DATE),('m-vencedores-2','vencedores','Tania Rey',CURRENT_DATE),
  ('m-vencedores-3','vencedores','Omar Lazo',CURRENT_DATE),('m-vencedores-4','vencedores','Pía Solano',CURRENT_DATE),
  ('m-vencedores-5','vencedores','Gael Marín',CURRENT_DATE),
  ('m-embajadores-1','embajadores','Saúl Vidal',CURRENT_DATE),('m-embajadores-2','embajadores','Noa Quintero',CURRENT_DATE),
  ('m-embajadores-3','embajadores','Beto Lima',CURRENT_DATE),('m-embajadores-4','embajadores','Mía Castro',CURRENT_DATE),
  ('m-embajadores-5','embajadores','Aldo Peña',CURRENT_DATE),('m-embajadores-6','embajadores','Vera Soto',CURRENT_DATE),
  ('m-centella-1','centella','Ciro Ramos',CURRENT_DATE),('m-centella-2','centella','Lía Mena',CURRENT_DATE),
  ('m-centella-3','centella','Pol Arias',CURRENT_DATE),('m-centella-4','centella','Ruth Vega',CURRENT_DATE),
  ('m-centella-5','centella','Iker Soto',CURRENT_DATE)
  ON CONFLICT (id) DO NOTHING;
