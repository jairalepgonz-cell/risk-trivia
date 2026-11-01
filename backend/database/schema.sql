-- =========================================================================
-- ESQUEMA INTEGRAL DE BASE DE DATOS: RISK TRIVIA / TRIVIADOR MUNDO & PERÚ
-- =========================================================================

PRAGMA foreign_keys = ON;

-- 1. TABLA DE DIFICULTADES
CREATE TABLE IF NOT EXISTS dificultades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE, -- 'basico', 'intermedio', 'avanzado'
  nombre TEXT NOT NULL,
  puntos_base INTEGER NOT NULL DEFAULT 100,
  tropas_recompensa INTEGER NOT NULL DEFAULT 1,
  penalizacion_puntos INTEGER NOT NULL DEFAULT 25,
  multiplicador REAL NOT NULL DEFAULT 1.0,
  activo INTEGER NOT NULL DEFAULT 1
);

-- 2. TABLA DE CATEGORÍAS
CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  ambito TEXT NOT NULL DEFAULT 'ambos', -- 'peru', 'mundo', 'ambos', 'especial'
  subambito TEXT DEFAULT 'general',
  icono TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#3a86ff',
  descripcion TEXT DEFAULT '',
  es_especial INTEGER NOT NULL DEFAULT 0,
  es_sorpresa INTEGER NOT NULL DEFAULT 0,
  probabilidad INTEGER NOT NULL DEFAULT 100,
  modos_compatibles TEXT NOT NULL DEFAULT 'todos',
  activa INTEGER NOT NULL DEFAULT 1,
  fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. BANCO DE PREGUNTAS INDEPENDIENTE: PERÚ
CREATE TABLE IF NOT EXISTS preguntas_peru (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_unico TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL DEFAULT 'opcion_multiple', -- 'opcion_multiple', 'aproximacion'
  categoria TEXT NOT NULL,
  subcategoria TEXT DEFAULT 'General',
  dificultad TEXT NOT NULL DEFAULT 'basico', -- 'basico', 'intermedio', 'avanzado'
  pregunta TEXT NOT NULL UNIQUE,
  opcion_a TEXT,
  opcion_b TEXT,
  opcion_c TEXT,
  opcion_d TEXT,
  correcta TEXT NOT NULL,
  anio_min INTEGER DEFAULT 1000,
  anio_max INTEGER DEFAULT 2026,
  explicacion TEXT DEFAULT '',
  region_referencia TEXT DEFAULT 'Perú',
  fuente_verificacion TEXT DEFAULT 'Archivo Histórico y Geográfico del Perú',
  fecha_referencia TEXT DEFAULT '2026',
  estado TEXT NOT NULL DEFAULT 'activo', -- 'activo', 'inactivo'
  veces_usada INTEGER NOT NULL DEFAULT 0,
  fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 4. BANCO DE PREGUNTAS INDEPENDIENTE: CONOCIMIENTO MUNDIAL
CREATE TABLE IF NOT EXISTS preguntas_mundo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_unico TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL DEFAULT 'opcion_multiple', -- 'opcion_multiple', 'aproximacion'
  categoria TEXT NOT NULL,
  subcategoria TEXT DEFAULT 'Universal',
  dificultad TEXT NOT NULL DEFAULT 'basico', -- 'basico', 'intermedio', 'avanzado'
  pregunta TEXT NOT NULL UNIQUE,
  opcion_a TEXT,
  opcion_b TEXT,
  opcion_c TEXT,
  opcion_d TEXT,
  correcta TEXT NOT NULL,
  anio_min INTEGER DEFAULT -500,
  anio_max INTEGER DEFAULT 2026,
  explicacion TEXT DEFAULT '',
  pais_referencia TEXT DEFAULT 'Mundial',
  fuente_verificacion TEXT DEFAULT 'Enciclopedia Universal de Conocimiento',
  fecha_referencia TEXT DEFAULT '2026',
  estado TEXT NOT NULL DEFAULT 'activo', -- 'activo', 'inactivo'
  veces_usada INTEGER NOT NULL DEFAULT 0,
  fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de compatibilidad heredada (vista/tabla sincronizada para no romper consultas legadas)
CREATE TABLE IF NOT EXISTS preguntas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT DEFAULT 'opcion_multiple',
  categoria TEXT NOT NULL,
  pregunta TEXT NOT NULL UNIQUE,
  opcion_a TEXT,
  opcion_b TEXT,
  opcion_c TEXT,
  opcion_d TEXT,
  correcta TEXT NOT NULL,
  anio_min INTEGER DEFAULT 1000,
  anio_max INTEGER DEFAULT 2026
);

-- 5. TABLA DE ALTERNATIVAS Y RESPUESTAS (NORMALIZADA PARA AUDITORÍA Y VALIDACIÓN)
CREATE TABLE IF NOT EXISTS alternativas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  banco TEXT NOT NULL, -- 'peru' | 'mundo'
  pregunta_id INTEGER NOT NULL,
  letra TEXT NOT NULL, -- 'A', 'B', 'C', 'D'
  texto TEXT NOT NULL,
  es_correcta INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS respuestas_historial (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partida_id INTEGER,
  combate_id INTEGER,
  jugador_id TEXT,
  banco TEXT,
  pregunta_id INTEGER,
  respuesta_enviada TEXT,
  es_correcta INTEGER,
  tiempo_ms INTEGER,
  puntos_obtenidos INTEGER DEFAULT 0,
  fecha TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 6. CATÁLOGO Y PARAMETRIZACIÓN DE COMODINES
CREATE TABLE IF NOT EXISTS comodines_catalogo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  icono TEXT NOT NULL DEFAULT '✨',
  animacion TEXT NOT NULL DEFAULT 'pulse',
  tipo TEXT NOT NULL DEFAULT 'pregunta', -- 'pregunta', 'combate', 'mapa', 'estrategico'
  cantidad_inicial INTEGER NOT NULL DEFAULT 2,
  limite_maximo INTEGER NOT NULL DEFAULT 5,
  probabilidad_aparicion INTEGER NOT NULL DEFAULT 100,
  costo_monedas INTEGER NOT NULL DEFAULT 100,
  condiciones_uso TEXT DEFAULT 'Durante turno o duelo activo',
  duracion_turnos INTEGER NOT NULL DEFAULT 1,
  tiempo_reutilizacion INTEGER NOT NULL DEFAULT 0,
  modos_compatibles TEXT NOT NULL DEFAULT 'todos',
  activo INTEGER NOT NULL DEFAULT 1,
  disponibilidad_nivel INTEGER NOT NULL DEFAULT 1,
  efecto_combate TEXT DEFAULT 'ninguno',
  efecto_pregunta TEXT DEFAULT 'ninguno',
  efecto_mapa TEXT DEFAULT 'ninguno',
  parametros_json TEXT DEFAULT '{}',
  fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 7. CONFIGURACIONES Y REGLAS DEL JUEGO
CREATE TABLE IF NOT EXISTS configuraciones (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'number', -- 'number', 'boolean', 'string', 'json'
  grupo TEXT NOT NULL DEFAULT 'reglas',
  descripcion TEXT DEFAULT '',
  fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 8. TERRITORIOS Y CONEXIONES (MAPA INTERACTIVO PERÚ, MUNDO E HÍBRIDO)
CREATE TABLE IF NOT EXISTS territorios_catalogo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  mapa TEXT NOT NULL DEFAULT 'ambos', -- 'peru', 'mundo', 'ambos'
  nombre TEXT NOT NULL,
  region_continente TEXT NOT NULL,
  centro_x REAL NOT NULL,
  centro_y REAL NOT NULL,
  svg_path TEXT NOT NULL,
  tropas_iniciales INTEGER NOT NULL DEFAULT 3,
  puntos_valor INTEGER NOT NULL DEFAULT 100,
  bono_region INTEGER NOT NULL DEFAULT 2
);

CREATE TABLE IF NOT EXISTS territorios_conexiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mapa TEXT NOT NULL DEFAULT 'ambos',
  territorio_origen TEXT NOT NULL,
  territorio_destino TEXT NOT NULL,
  UNIQUE(mapa, territorio_origen, territorio_destino)
);

-- 9. JUGADORES Y PERFILES
CREATE TABLE IF NOT EXISTS jugadores (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  color_preferido TEXT DEFAULT 'rojo',
  token_reconexion TEXT,
  monedas INTEGER NOT NULL DEFAULT 500,
  nivel INTEGER NOT NULL DEFAULT 1,
  experiencia INTEGER NOT NULL DEFAULT 0,
  puntos_totales INTEGER NOT NULL DEFAULT 0,
  partidas_jugadas INTEGER NOT NULL DEFAULT 0,
  victorias INTEGER NOT NULL DEFAULT 0,
  derrotas INTEGER NOT NULL DEFAULT 0,
  preguntas_respondidas INTEGER NOT NULL DEFAULT 0,
  preguntas_acertadas INTEGER NOT NULL DEFAULT 0,
  comodines_utilizados INTEGER NOT NULL DEFAULT 0,
  territorios_conquistados INTEGER NOT NULL DEFAULT 0,
  defensas_exitosas INTEGER NOT NULL DEFAULT 0,
  fecha_registro TEXT DEFAULT CURRENT_TIMESTAMP,
  ultima_conexion TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 10. PARTIDAS, TURNOS, EJÉRCITOS, COMBATES Y MOVIMIENTOS
CREATE TABLE IF NOT EXISTS partidas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_sala TEXT NOT NULL,
  modo_mapa TEXT NOT NULL DEFAULT 'peru_mundo', -- 'peru', 'mundo', 'peru_mundo'
  modo_preguntas TEXT NOT NULL DEFAULT 'mixto', -- 'peru', 'mundo', 'mixto'
  estado TEXT NOT NULL DEFAULT 'EN_CURSO', -- 'LOBBY', 'EN_CURSO', 'FINALIZADA', 'CANCELADA'
  ronda_actual INTEGER NOT NULL DEFAULT 1,
  turno_actual INTEGER NOT NULL DEFAULT 1,
  ganador_nombre TEXT,
  ganador_color TEXT,
  configuracion_json TEXT DEFAULT '{}',
  fecha_inicio TEXT DEFAULT CURRENT_TIMESTAMP,
  fecha_fin TEXT
);

CREATE TABLE IF NOT EXISTS turnos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partida_id INTEGER NOT NULL,
  numero_turno INTEGER NOT NULL,
  jugador_nombre TEXT NOT NULL,
  jugador_color TEXT NOT NULL,
  ataques_realizados INTEGER NOT NULL DEFAULT 0,
  conquistas_realizadas INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  fecha_inicio TEXT DEFAULT CURRENT_TIMESTAMP,
  fecha_fin TEXT,
  FOREIGN KEY (partida_id) REFERENCES partidas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ejercitos_territorios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partida_id INTEGER NOT NULL,
  territorio_codigo TEXT NOT NULL,
  propietario_nombre TEXT,
  propietario_color TEXT,
  soldados INTEGER NOT NULL DEFAULT 3,
  escudo_activo INTEGER NOT NULL DEFAULT 0,
  proteccion_turnos INTEGER NOT NULL DEFAULT 0,
  es_capital INTEGER NOT NULL DEFAULT 0,
  actualizado_en TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partida_id) REFERENCES partidas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS combates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partida_id INTEGER,
  turno_id INTEGER,
  territorio_origen TEXT,
  territorio_objetivo TEXT,
  atacante_nombre TEXT NOT NULL,
  atacante_color TEXT NOT NULL,
  defensor_nombre TEXT NOT NULL,
  defensor_color TEXT NOT NULL,
  banco_pregunta TEXT,
  pregunta_id INTEGER,
  categoria TEXT,
  dificultad TEXT,
  respuesta_atacante TEXT,
  respuesta_defensor TEXT,
  tiempo_atacante_ms INTEGER,
  tiempo_defensor_ms INTEGER,
  ganador_color TEXT,
  bajas_atacante INTEGER DEFAULT 0,
  bajas_defensor INTEGER DEFAULT 0,
  territorio_conquistado INTEGER DEFAULT 0,
  detalle_json TEXT DEFAULT '{}',
  fecha TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partida_id INTEGER,
  turno_id INTEGER,
  jugador_nombre TEXT,
  jugador_color TEXT,
  tipo_accion TEXT NOT NULL, -- 'ATAQUE', 'CONQUISTA', 'DEFENSA', 'REFUERZO', 'COMODIN', 'FIN_TURNO'
  territorio_origen TEXT,
  territorio_destino TEXT,
  descripcion TEXT,
  detalle_json TEXT DEFAULT '{}',
  fecha TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventario_comodines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partida_id INTEGER,
  jugador_nombre TEXT NOT NULL,
  comodin_codigo TEXT NOT NULL,
  cantidad INTEGER NOT NULL DEFAULT 0,
  usados INTEGER NOT NULL DEFAULT 0,
  actualizado_en TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estadisticas_partidas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partida_id INTEGER,
  jugador_nombre TEXT NOT NULL,
  jugador_color TEXT NOT NULL,
  puntos_finales INTEGER NOT NULL DEFAULT 0,
  territorios_finales INTEGER NOT NULL DEFAULT 0,
  soldados_finales INTEGER NOT NULL DEFAULT 0,
  conquistas INTEGER NOT NULL DEFAULT 0,
  defensas INTEGER NOT NULL DEFAULT 0,
  respuestas_correctas INTEGER NOT NULL DEFAULT 0,
  respuestas_totales INTEGER NOT NULL DEFAULT 0,
  comodines_usados INTEGER NOT NULL DEFAULT 0,
  es_ganador INTEGER NOT NULL DEFAULT 0,
  fecha TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
CREATE INDEX IF NOT EXISTS idx_preg_peru_cat_dif ON preguntas_peru(categoria, dificultad, estado);
CREATE INDEX IF NOT EXISTS idx_preg_peru_tipo ON preguntas_peru(tipo, estado);
CREATE INDEX IF NOT EXISTS idx_preg_mundo_cat_dif ON preguntas_mundo(categoria, dificultad, estado);
CREATE INDEX IF NOT EXISTS idx_preg_mundo_tipo ON preguntas_mundo(tipo, estado);
CREATE INDEX IF NOT EXISTS idx_cat_ambito ON categorias(ambito, activa);
CREATE INDEX IF NOT EXISTS idx_combates_partida ON combates(partida_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_partida ON movimientos(partida_id);
CREATE INDEX IF NOT EXISTS idx_jugadores_puntos ON jugadores(puntos_totales DESC, victorias DESC);
