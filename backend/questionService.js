const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'preguntas.db');
const dbPeruPath = path.join(__dirname, 'database', 'preguntas_peru.db');
const dbMundoPath = path.join(__dirname, 'database', 'preguntas_mundo.db');

const db = new sqlite3.Database(dbPath);
const dbPeru = new sqlite3.Database(dbPeruPath);
const dbMundo = new sqlite3.Database(dbMundoPath);

// Helpers Promisificados para SQLite
function dbAll(database, sql, params = []) {
  return new Promise((resolve, reject) => {
    database.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function dbGet(database, sql, params = []) {
  return new Promise((resolve, reject) => {
    database.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function dbRun(database, sql, params = []) {
  return new Promise((resolve, reject) => {
    database.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Mapeo de alias de categorías legadas o agrupadas
const ALIAS_CATEGORIAS = {
  cultura_peruana: [
    'historia_peru', 'geografia_peru', 'cultura_tradiciones_peru', 'gastronomia_peruana',
    'literatura_peruana', 'personajes_historicos_peru', 'turismo_lugares_peru',
    'regiones_departamentos_peru', 'civilizaciones_preincaicas', 'imperio_incaico',
    'virreinato_peru', 'independencia_peru', 'musica_artistas_peru', 'flora_fauna_peru',
    'festividades_costumbres_peru'
  ],
  historia: ['historia_universal', 'historia_peru', 'imperio_incaico', 'independencia_peru', 'civilizaciones_preincaicas'],
  geografia: ['geografia_mundial', 'paises_capitales', 'geografia_peru', 'regiones_departamentos_peru', 'maravillas_mundo'],
  ciencia: ['ciencia', 'fisica_quimica', 'biologia', 'astronomia', 'tecnologia', 'inventos_descubrimientos', 'ciencia_tecnologia_peru'],
  deportes: ['futbol_mundial', 'deportes_internacionales', 'futbol_peruano', 'deportes_peruanos'],
  arte: ['arte_pintura', 'literatura_universal', 'musica_internacional', 'literatura_peruana', 'musica_artistas_peru'],
  cine: ['cine_television', 'series_entretenimiento', 'videojuegos'],
  general: ['cultura_general', 'maravillas_mundo', 'personajes_famosos', 'inventos_descubrimientos']
};

function formatearPregunta(row, bancoOrigen = 'mixto') {
  if (!row) return null;
  const esPeru = bancoOrigen === 'peru' || (row.codigo_unico && row.codigo_unico.startsWith('PE'));
  return {
    id: row.id,
    codigoUnico: row.codigo_unico || `Q-${row.id}`,
    banco: esPeru ? 'peru' : 'mundo',
    tipo: row.tipo || 'opcion_multiple',
    categoria: row.categoria,
    subcategoria: row.subcategoria || 'General',
    dificultad: row.dificultad || 'basico',
    pregunta: row.pregunta,
    opciones: {
      A: row.opcion_a || '',
      B: row.opcion_b || '',
      C: row.opcion_c || '',
      D: row.opcion_d || ''
    },
    correcta: row.correcta,
    anioMin: row.anio_min || 1000,
    anioMax: row.anio_max || 2026,
    explicacion: row.explicacion || '',
    referenciaGeografica: row.region_referencia || row.pais_referencia || (esPeru ? 'Perú' : 'Mundial'),
    fuente: row.fuente_verificacion || 'Archivo Oficial Verificado',
    fechaReferencia: row.fecha_referencia || '2026',
    estado: row.estado || 'activo'
  };
}

// =========================================================================
// MOTOR DE PREGUNTAS UNIFICADO (USA BANCO PERÚ Y BANCO MUNDO)
// =========================================================================
async function obtenerPregunta(categoria = 'aleatorio', esDesempate = false, idsExcluidos = [], opcionesMotor = {}) {
  const {
    modoBanco = 'mixto',       // 'peru', 'mundo', 'mixto'
    dificultad = 'aleatorio',  // 'basico', 'intermedio', 'avanzado', 'aleatorio'
    territorioObjetivo = null  // Si ataca territorio PE_*, prioriza Perú si modoBanco es mixto
  } = opcionesMotor;

  const tipoRequerido = esDesempate ? 'aproximacion' : 'opcion_multiple';

  // Determinar de qué banco extraer
  let bancoElegido = modoBanco;
  if (categoria && categoria !== 'aleatorio') {
    if (
      categoria.endsWith('_peru') ||
      categoria.endsWith('_peruana') ||
      categoria.endsWith('_peruanos') ||
      ['civilizaciones_preincaicas', 'imperio_incaico', 'cultura_peruana'].includes(categoria)
    ) {
      bancoElegido = 'peru';
    } else if (
      ['historia_universal', 'geografia_mundial', 'paises_capitales', 'astronomia', 'mitologia', 'religion_civilizaciones', 'fisica_quimica', 'biologia', 'maravillas_mundo', 'videojuegos', 'series_entretenimiento'].includes(categoria)
    ) {
      bancoElegido = 'mundo';
    }
  }

  if (bancoElegido === 'mixto') {
    if (territorioObjetivo && territorioObjetivo.startsWith('PE_')) {
      bancoElegido = Math.random() < 0.75 ? 'peru' : 'mundo';
    } else if (territorioObjetivo && territorioObjetivo.startsWith('MU_')) {
      bancoElegido = Math.random() < 0.75 ? 'mundo' : 'peru';
    } else {
      bancoElegido = Math.random() < 0.5 ? 'peru' : 'mundo';
    }
  }

  // Categorías especiales de TV
  let dificultadFiltro = dificultad;
  let categoriasFiltro = [];
  let bonificacionEspecial = null;

  if (categoria === 'desafio_experto') {
    dificultadFiltro = 'avanzado';
    bonificacionEspecial = { tipo: 'desafio_experto', multiplicadorPuntos: 2.0, tropasExtra: 1 };
  } else if (categoria === 'ruleta_dorada') {
    bonificacionEspecial = { tipo: 'ruleta_dorada', multiplicadorPuntos: 1.5, monedasExtra: 50 };
  } else if (categoria === 'caja_sorpresa') {
    bonificacionEspecial = { tipo: 'caja_sorpresa', sorpresa: true };
  } else if (categoria && categoria !== 'aleatorio' && categoria !== 'duelo_peru_mundo') {
    if (ALIAS_CATEGORIAS[categoria]) {
      categoriasFiltro = ALIAS_CATEGORIAS[categoria];
    } else {
      categoriasFiltro = [categoria];
    }
  }

  const intentarConsulta = async (tabla, usarCat, usarDif, excluirIds) => {
    let sql = `SELECT * FROM ${tabla} WHERE tipo = ? AND estado = 'activo'`;
    const params = [tipoRequerido];

    if (usarCat && categoriasFiltro.length > 0 && tipoRequerido === 'opcion_multiple') {
      sql += ` AND categoria IN (${categoriasFiltro.map(() => '?').join(',')})`;
      params.push(...categoriasFiltro);
    }

    if (usarDif && dificultadFiltro && dificultadFiltro !== 'aleatorio') {
      sql += ` AND dificultad = ?`;
      params.push(dificultadFiltro);
    }

    if (excluirIds && idsExcluidos.length > 0) {
      const codigosNum = idsExcluidos.filter(x => typeof x === 'number');
      const codigosStr = idsExcluidos.filter(x => typeof x === 'string');
      if (codigosNum.length > 0) {
        sql += ` AND id NOT IN (${codigosNum.map(() => '?').join(',')})`;
        params.push(...codigosNum);
      }
      if (codigosStr.length > 0) {
        sql += ` AND codigo_unico NOT IN (${codigosStr.map(() => '?').join(',')})`;
        params.push(...codigosStr);
      }
    }

    sql += ` ORDER BY RANDOM() LIMIT 1`;
    return await dbGet(db, sql, params);
  };

  const tablaPrimaria = bancoElegido === 'peru' ? 'preguntas_peru' : 'preguntas_mundo';
  const tablaSecundaria = bancoElegido === 'peru' ? 'preguntas_mundo' : 'preguntas_peru';

  // Cascada inteligente de búsqueda para garantizar que SIEMPRE retorne una pregunta válida
  let row = await intentarConsulta(tablaPrimaria, true, true, true);
  let bancoFinal = bancoElegido;

  if (!row) row = await intentarConsulta(tablaPrimaria, true, false, true);
  if (!row) {
    row = await intentarConsulta(tablaSecundaria, true, false, true);
    if (row) bancoFinal = bancoElegido === 'peru' ? 'mundo' : 'peru';
  }
  if (!row) {
    row = await intentarConsulta(tablaPrimaria, false, false, true);
    bancoFinal = bancoElegido;
  }
  if (!row) {
    row = await intentarConsulta(tablaPrimaria, false, false, false);
  }

  if (row) {
    const tablaUsada = bancoFinal === 'peru' ? 'preguntas_peru' : 'preguntas_mundo';
    await dbRun(db, `UPDATE ${tablaUsada} SET veces_usada = veces_usada + 1 WHERE id = ?`, [row.id]).catch(() => {});
    const formateada = formatearPregunta(row, bancoFinal);
    if (bonificacionEspecial) formateada.bonificacionEspecial = bonificacionEspecial;
    return formateada;
  }

  return null;
}

// =========================================================================
// SISTEMA DE CATEGORÍAS DINÁMICO ESTILO PROGRAMA DE TELEVISIÓN
// =========================================================================
async function generarOpcionesCategoriasTV(modoBanco = 'mixto', categoriasRecientes = [], cantidad = 4) {
  let sql = `SELECT * FROM categorias WHERE activa = 1`;
  const params = [];

  if (modoBanco === 'peru') {
    sql += ` AND ambito IN ('peru', 'especial')`;
  } else if (modoBanco === 'mundo') {
    sql += ` AND ambito IN ('mundo', 'especial')`;
  }

  const todas = await dbAll(db, sql, params);
  if (todas.length === 0) return [];

  // Filtrar las usadas recientemente para evitar repeticiones
  let candidatas = todas.filter(c => !categoriasRecientes.slice(-6).includes(c.codigo));
  if (candidatas.length < cantidad) candidatas = todas;

  const normales = candidatas.filter(c => !c.es_especial);
  const especiales = candidatas.filter(c => c.es_especial);

  // Seleccionar ponderadamente por probabilidad
  const mezcladas = normales
    .map(c => ({ item: c, peso: Math.random() * (c.probabilidad || 100) }))
    .sort((a, b) => b.peso - a.peso)
    .map(x => x.item);

  const seleccion = mezcladas.slice(0, Math.max(1, cantidad - 1));

  // Agregar 1 categoría especial o sorpresa estilo concurso de TV
  if (especiales.length > 0 && seleccion.length < cantidad) {
    const esp = especiales[Math.floor(Math.random() * especiales.length)];
    seleccion.push(esp);
  } else if (mezcladas.length >= cantidad) {
    seleccion.push(mezcladas[cantidad - 1]);
  }

  return seleccion;
}

async function obtenerCategorias(ambito = null, soloActivas = false) {
  let sql = `SELECT * FROM categorias WHERE 1=1`;
  const params = [];
  if (ambito && ambito !== 'todos') {
    sql += ` AND ambito = ?`;
    params.push(ambito);
  }
  if (soloActivas) {
    sql += ` AND activa = 1`;
  }
  sql += ` ORDER BY es_especial ASC, ambito ASC, nombre ASC`;
  return await dbAll(db, sql, params);
}

// =========================================================================
// ADMINISTRACIÓN DE PREGUNTAS (CRUD, IMPORT/EXPORT, DUPLICADOS, VALIDACIÓN)
// =========================================================================
async function listarPreguntasAdmin(filtros = {}) {
  const {
    banco = 'todos',
    categoria = '',
    dificultad = '',
    tipo = '',
    estado = '',
    busqueda = '',
    limite = 200
  } = filtros;

  const construirSQL = (tabla, labelBanco) => {
    let sql = `SELECT *, '${labelBanco}' as banco_origen FROM ${tabla} WHERE 1=1`;
    const params = [];
    if (categoria) { sql += ` AND categoria = ?`; params.push(categoria); }
    if (dificultad) { sql += ` AND dificultad = ?`; params.push(dificultad); }
    if (tipo) { sql += ` AND tipo = ?`; params.push(tipo); }
    if (estado) { sql += ` AND estado = ?`; params.push(estado); }
    if (busqueda) {
      sql += ` AND (pregunta LIKE ? OR subcategoria LIKE ? OR explicacion LIKE ? OR codigo_unico LIKE ?)`;
      const term = `%${busqueda}%`;
      params.push(term, term, term, term);
    }
    sql += ` ORDER BY id DESC LIMIT ?`;
    params.push(parseInt(limite) || 200);
    return { sql, params };
  };

  let resultados = [];
  if (banco === 'peru' || banco === 'todos') {
    const q = construirSQL('preguntas_peru', 'peru');
    const rowsPeru = await dbAll(db, q.sql, q.params);
    resultados.push(...rowsPeru.map(r => formatearPregunta(r, 'peru')));
  }
  if (banco === 'mundo' || banco === 'todos') {
    const q = construirSQL('preguntas_mundo', 'mundo');
    const rowsMundo = await dbAll(db, q.sql, q.params);
    resultados.push(...rowsMundo.map(r => formatearPregunta(r, 'mundo')));
  }

  return resultados.slice(0, parseInt(limite) || 200);
}

async function crearOActualizarPregunta(datos) {
  const banco = datos.banco === 'peru' ? 'peru' : 'mundo';
  const tabla = banco === 'peru' ? 'preguntas_peru' : 'preguntas_mundo';
  const colRef = banco === 'peru' ? 'region_referencia' : 'pais_referencia';
  const dbIndep = banco === 'peru' ? dbPeru : dbMundo;

  const tipo = datos.tipo || 'opcion_multiple';
  const preguntaTexto = (datos.pregunta || '').trim();
  if (!preguntaTexto) throw new Error('El texto de la pregunta es obligatorio.');

  if (tipo === 'opcion_multiple') {
    if (!datos.opcion_a || !datos.opcion_b || !datos.opcion_c || !datos.opcion_d) {
      throw new Error('Las preguntas de opción múltiple requieren las 4 alternativas (A, B, C y D).');
    }
    if (!['A', 'B', 'C', 'D'].includes(datos.correcta)) {
      throw new Error('La respuesta correcta debe ser A, B, C o D.');
    }
  } else {
    if (isNaN(parseInt(datos.correcta))) {
      throw new Error('Las preguntas de aproximación requieren un valor numérico exacto.');
    }
  }

  const codigoUnico = datos.codigoUnico || `${banco === 'peru' ? 'PE' : 'MU'}-USR-${Date.now().toString().slice(-6)}`;

  if (datos.id) {
    const sqlUpdate = `
      UPDATE ${tabla}
      SET tipo = ?, categoria = ?, subcategoria = ?, dificultad = ?,
          pregunta = ?, opcion_a = ?, opcion_b = ?, opcion_c = ?, opcion_d = ?,
          correcta = ?, anio_min = ?, anio_max = ?, explicacion = ?,
          ${colRef} = ?, fuente_verificacion = ?, fecha_referencia = ?,
          estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    const params = [
      tipo, datos.categoria || 'cultura_general', datos.subcategoria || 'General', datos.dificultad || 'basico',
      preguntaTexto, datos.opcion_a || '', datos.opcion_b || '', datos.opcion_c || '', datos.opcion_d || '',
      String(datos.correcta), datos.anioMin || 1000, datos.anioMax || 2026, datos.explicacion || '',
      datos.referenciaGeografica || (banco === 'peru' ? 'Perú' : 'Mundial'),
      datos.fuente || 'Panel de Administración', datos.fechaReferencia || '2026',
      datos.estado || 'activo', datos.id
    ];
    await dbRun(db, sqlUpdate, params);
    await dbRun(dbIndep, sqlUpdate, params).catch(() => {});
    return { exito: true, id: datos.id, banco };
  } else {
    const sqlInsert = `
      INSERT INTO ${tabla} (
        codigo_unico, tipo, categoria, subcategoria, dificultad,
        pregunta, opcion_a, opcion_b, opcion_c, opcion_d, correcta,
        anio_min, anio_max, explicacion, ${colRef}, fuente_verificacion, fecha_referencia, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      codigoUnico, tipo, datos.categoria || 'cultura_general', datos.subcategoria || 'General', datos.dificultad || 'basico',
      preguntaTexto, datos.opcion_a || '', datos.opcion_b || '', datos.opcion_c || '', datos.opcion_d || '',
      String(datos.correcta), datos.anioMin || 1000, datos.anioMax || 2026, datos.explicacion || '',
      datos.referenciaGeografica || (banco === 'peru' ? 'Perú' : 'Mundial'),
      datos.fuente || 'Panel de Administración', datos.fechaReferencia || '2026',
      datos.estado || 'activo'
    ];
    const res = await dbRun(db, sqlInsert, params);
    await dbRun(dbIndep, sqlInsert, params).catch(() => {});
    return { exito: true, id: res.lastID, codigoUnico, banco };
  }
}

async function cambiarEstadoOEliminarPregunta(banco, id, accion = 'desactivar') {
  const tabla = banco === 'peru' ? 'preguntas_peru' : 'preguntas_mundo';
  const dbIndep = banco === 'peru' ? dbPeru : dbMundo;
  if (accion === 'eliminar') {
    await dbRun(db, `DELETE FROM ${tabla} WHERE id = ?`, [id]);
    await dbRun(dbIndep, `DELETE FROM ${tabla} WHERE id = ?`, [id]).catch(() => {});
  } else {
    const nuevoEstado = accion === 'activar' ? 'activo' : 'inactivo';
    await dbRun(db, `UPDATE ${tabla} SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`, [nuevoEstado, id]);
    await dbRun(dbIndep, `UPDATE ${tabla} SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`, [nuevoEstado, id]).catch(() => {});
  }
  return { exito: true };
}

async function importarPreguntasMasivo(listaPreguntas, bancoPorDefecto = 'peru') {
  let insertadas = 0;
  let omitidas = 0;
  for (const item of listaPreguntas) {
    try {
      await crearOActualizarPregunta({
        ...item,
        banco: item.banco || bancoPorDefecto
      });
      insertadas++;
    } catch (e) {
      omitidas++;
    }
  }
  return { exito: true, insertadas, omitidas };
}

async function detectarDuplicadosYValidar() {
  const peru = await dbAll(db, `SELECT id, codigo_unico, tipo, categoria, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, correcta FROM preguntas_peru`);
  const mundo = await dbAll(db, `SELECT id, codigo_unico, tipo, categoria, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, correcta FROM preguntas_mundo`);

  const mapaTextos = new Map();
  const duplicados = [];
  const erroresValidacion = [];

  const revisar = (lista, banco) => {
    for (const r of lista) {
      const clave = r.pregunta.trim().toLowerCase();
      if (mapaTextos.has(clave)) {
        duplicados.push({ banco, id: r.id, codigo: r.codigo_unico, pregunta: r.pregunta, coincideCon: mapaTextos.get(clave) });
      } else {
        mapaTextos.set(clave, `${banco}:${r.codigo_unico}`);
      }

      if (r.tipo === 'opcion_multiple') {
        const opts = [r.opcion_a, r.opcion_b, r.opcion_c, r.opcion_d].map(x => (x || '').trim());
        if (opts.some(x => !x)) {
          erroresValidacion.push({ banco, id: r.id, codigo: r.codigo_unico, error: 'Opciones vacías' });
        }
        const unicas = new Set(opts.map(x => x.toLowerCase()));
        if (unicas.size < 4) {
          erroresValidacion.push({ banco, id: r.id, codigo: r.codigo_unico, error: 'Alternativas repetidas en la misma pregunta' });
        }
        if (!['A', 'B', 'C', 'D'].includes(r.correcta)) {
          erroresValidacion.push({ banco, id: r.id, codigo: r.codigo_unico, error: `Respuesta correcta inválida: ${r.correcta}` });
        }
      }
    }
  };

  revisar(peru, 'peru');
  revisar(mundo, 'mundo');

  return {
    totalPeru: peru.length,
    totalMundo: mundo.length,
    totalGeneral: peru.length + mundo.length,
    duplicadosEncontrados: duplicados.length,
    duplicados,
    erroresValidacionEncontrados: erroresValidacion.length,
    erroresValidacion
  };
}

// =========================================================================
// ADMINISTRACIÓN DE CATEGORÍAS, COMODINES, REGLAS Y ESTADÍSTICAS
// =========================================================================
async function guardarCategoria(cat) {
  if (cat.id) {
    await dbRun(db, `
      UPDATE categorias
      SET nombre = ?, ambito = ?, subambito = ?, icono = ?, color = ?, descripcion = ?,
          es_especial = ?, es_sorpresa = ?, probabilidad = ?, activa = ?
      WHERE id = ?
    `, [
      cat.nombre, cat.ambito || 'peru', cat.subambito || 'General', cat.icono || '🎯',
      cat.color || '#3a86ff', cat.descripcion || '', cat.es_especial ? 1 : 0,
      cat.es_sorpresa ? 1 : 0, parseInt(cat.probabilidad) || 100, cat.activa ? 1 : 0, cat.id
    ]);
    return { exito: true, id: cat.id };
  } else {
    const codigo = (cat.codigo || cat.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '_')).slice(0, 40);
    const res = await dbRun(db, `
      INSERT INTO categorias (codigo, nombre, ambito, subambito, icono, color, descripcion, es_especial, es_sorpresa, probabilidad, activa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      codigo, cat.nombre, cat.ambito || 'peru', cat.subambito || 'General', cat.icono || '🎯',
      cat.color || '#3a86ff', cat.descripcion || '', cat.es_especial ? 1 : 0,
      cat.es_sorpresa ? 1 : 0, parseInt(cat.probabilidad) || 100, cat.activa !== false ? 1 : 0
    ]);
    return { exito: true, id: res.lastID, codigo };
  }
}

async function obtenerComodinesCatalogo(soloActivos = false) {
  let sql = `SELECT * FROM comodines_catalogo`;
  if (soloActivos) sql += ` WHERE activo = 1`;
  sql += ` ORDER BY id ASC`;
  return await dbAll(db, sql);
}

async function guardarComodinCatalogo(com) {
  if (com.id || com.codigo) {
    await dbRun(db, `
      UPDATE comodines_catalogo
      SET nombre = ?, descripcion = ?, icono = ?, animacion = ?, tipo = ?,
          cantidad_inicial = ?, limite_maximo = ?, probabilidad_aparicion = ?,
          costo_monedas = ?, condiciones_uso = ?, duracion_turnos = ?,
          tiempo_reutilizacion = ?, activo = ?, efecto_combate = ?,
          efecto_pregunta = ?, efecto_mapa = ?, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE codigo = ? OR id = ?
    `, [
      com.nombre, com.descripcion, com.icono || '✨', com.animacion || 'pulse', com.tipo || 'pregunta',
      parseInt(com.cantidad_inicial) ?? 2, parseInt(com.limite_maximo) ?? 5, parseInt(com.probabilidad_aparicion) ?? 100,
      parseInt(com.costo_monedas) ?? 100, com.condiciones_uso || '', parseInt(com.duracion_turnos) ?? 1,
      parseInt(com.tiempo_reutilizacion) ?? 0, com.activo ? 1 : 0,
      com.efecto_combate || 'ninguno', com.efecto_pregunta || 'ninguno', com.efecto_mapa || 'ninguno',
      com.codigo, com.id
    ]);
    return { exito: true };
  } else {
    const codigo = com.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    await dbRun(db, `
      INSERT INTO comodines_catalogo (
        codigo, nombre, descripcion, icono, animacion, tipo,
        cantidad_inicial, limite_maximo, probabilidad_aparicion, costo_monedas,
        condiciones_uso, duracion_turnos, tiempo_reutilizacion, activo,
        efecto_combate, efecto_pregunta, efecto_mapa
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      codigo, com.nombre, com.descripcion || '', com.icono || '✨', com.animacion || 'pulse', com.tipo || 'pregunta',
      parseInt(com.cantidad_inicial) || 2, parseInt(com.limite_maximo) || 5, parseInt(com.probabilidad_aparicion) || 100,
      parseInt(com.costo_monedas) || 100, com.condiciones_uso || '', parseInt(com.duracion_turnos) || 1,
      parseInt(com.tiempo_reutilizacion) || 0, com.activo !== false ? 1 : 0,
      com.efecto_combate || 'ninguno', com.efecto_pregunta || 'ninguno', com.efecto_mapa || 'ninguno'
    ]);
    return { exito: true, codigo };
  }
}

async function obtenerConfiguraciones() {
  const rows = await dbAll(db, `SELECT * FROM configuraciones ORDER BY grupo, clave`);
  const mapa = {};
  rows.forEach(r => {
    if (r.tipo === 'number') mapa[r.clave] = Number(r.valor);
    else if (r.tipo === 'boolean') mapa[r.clave] = r.valor === 'true' || r.valor === '1';
    else mapa[r.clave] = r.valor;
  });
  return { lista: rows, mapa };
}

async function guardarConfiguraciones(nuevasCfg = {}) {
  for (const [clave, valor] of Object.entries(nuevasCfg)) {
    const tipo = typeof valor === 'boolean' ? 'boolean' : (!isNaN(Number(valor)) && valor !== '' ? 'number' : 'string');
    await dbRun(db, `
      INSERT INTO configuraciones (clave, valor, tipo, grupo, fecha_actualizacion)
      VALUES (?, ?, ?, 'reglas', CURRENT_TIMESTAMP)
      ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor, fecha_actualizacion = CURRENT_TIMESTAMP
    `, [clave, String(valor), tipo]);
  }
  return await obtenerConfiguraciones();
}

async function obtenerTerritoriosYConexiones(modoMapa = 'peru_mundo') {
  let sqlTer = `SELECT * FROM territorios_catalogo`;
  const params = [];
  if (modoMapa === 'peru') {
    sqlTer += ` WHERE mapa = 'peru'`;
  } else if (modoMapa === 'mundo') {
    sqlTer += ` WHERE mapa = 'mundo'`;
  }
  const territorios = await dbAll(db, sqlTer, params);
  const conexiones = await dbAll(db, `SELECT * FROM territorios_conexiones`);
  return { territorios, conexiones };
}

// =========================================================================
// REGISTRO DE JUGADORES, HISTORIAL DE COMBATES Y ESTADÍSTICAS
// =========================================================================
async function registrarOActualizarPerfilJugador(nombre, color) {
  const cleanName = (nombre || '').trim();
  if (!cleanName) return null;
  const id = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  await dbRun(db, `
    INSERT INTO jugadores (id, nombre, color_preferido, ultima_conexion)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(nombre) DO UPDATE SET color_preferido = excluded.color_preferido, ultima_conexion = CURRENT_TIMESTAMP
  `, [id, cleanName, color]);
  return await dbGet(db, `SELECT * FROM jugadores WHERE nombre = ?`, [cleanName]);
}

async function registrarCombateBD(datosCombate) {
  try {
    await dbRun(db, `
      INSERT INTO combates (
        partida_id, territorio_origen, territorio_objetivo,
        atacante_nombre, atacante_color, defensor_nombre, defensor_color,
        banco_pregunta, pregunta_id, categoria, dificultad,
        respuesta_atacante, respuesta_defensor, tiempo_atacante_ms, tiempo_defensor_ms,
        ganador_color, bajas_atacante, bajas_defensor, territorio_conquistado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      datosCombate.partidaId || 1,
      datosCombate.territorioOrigen || '',
      datosCombate.territorioObjetivo || '',
      datosCombate.atacanteNombre || '',
      datosCombate.atacanteColor || '',
      datosCombate.defensorNombre || '',
      datosCombate.defensorColor || '',
      datosCombate.banco || 'mixto',
      datosCombate.preguntaId || 0,
      datosCombate.categoria || 'general',
      datosCombate.dificultad || 'basico',
      String(datosCombate.respAt ?? ''),
      String(datosCombate.respDef ?? ''),
      datosCombate.tiempoAt || 0,
      datosCombate.tiempoDef || 0,
      datosCombate.ganadorColor || '',
      datosCombate.bajasAtacante || 0,
      datosCombate.bajasDefensor || 0,
      datosCombate.conquistado ? 1 : 0
    ]);

    // Actualizar estadísticas de jugadores
    if (datosCombate.atacanteNombre) {
      await dbRun(db, `
        UPDATE jugadores
        SET preguntas_respondidas = preguntas_respondidas + 1,
            preguntas_acertadas = preguntas_acertadas + ?,
            territorios_conquistados = territorios_conquistados + ?,
            puntos_totales = MAX(0, puntos_totales + ?)
        WHERE nombre = ?
      `, [
        datosCombate.atacanteAcerto ? 1 : 0,
        datosCombate.conquistado ? 1 : 0,
        datosCombate.puntosAtacanteDelta || 0,
        datosCombate.atacanteNombre
      ]);
    }
    if (datosCombate.defensorNombre) {
      await dbRun(db, `
        UPDATE jugadores
        SET preguntas_respondidas = preguntas_respondidas + 1,
            preguntas_acertadas = preguntas_acertadas + ?,
            defensas_exitosas = defensas_exitosas + ?,
            puntos_totales = MAX(0, puntos_totales + ?)
        WHERE nombre = ?
      `, [
        datosCombate.defensorAcerto ? 1 : 0,
        datosCombate.defensaExitosa ? 1 : 0,
        datosCombate.puntosDefensorDelta || 0,
        datosCombate.defensorNombre
      ]);
    }
  } catch (e) {
    console.error('Error registrando combate en BD:', e.message);
  }
}

async function registrarUsoComodinBD(nombreJugador) {
  if (!nombreJugador) return;
  await dbRun(db, `UPDATE jugadores SET comodines_utilizados = comodines_utilizados + 1 WHERE nombre = ?`, [nombreJugador]).catch(() => {});
}

async function obtenerResumenDashboardAdmin() {
  const [
    cPeru,
    cMundo,
    porCatPeru,
    porCatMundo,
    porDifPeru,
    porDifMundo,
    jugadores,
    combatesRecientes,
    comodines,
    categorias
  ] = await Promise.all([
    dbGet(db, `SELECT COUNT(*) as total FROM preguntas_peru WHERE estado = 'activo'`),
    dbGet(db, `SELECT COUNT(*) as total FROM preguntas_mundo WHERE estado = 'activo'`),
    dbAll(db, `SELECT categoria, COUNT(*) as total FROM preguntas_peru GROUP BY categoria ORDER BY total DESC`),
    dbAll(db, `SELECT categoria, COUNT(*) as total FROM preguntas_mundo GROUP BY categoria ORDER BY total DESC`),
    dbAll(db, `SELECT dificultad, COUNT(*) as total FROM preguntas_peru GROUP BY dificultad`),
    dbAll(db, `SELECT dificultad, COUNT(*) as total FROM preguntas_mundo GROUP BY dificultad`),
    dbAll(db, `SELECT * FROM jugadores ORDER BY puntos_totales DESC, territorios_conquistados DESC LIMIT 50`),
    dbAll(db, `SELECT * FROM combates ORDER BY id DESC LIMIT 40`),
    obtenerComodinesCatalogo(false),
    obtenerCategorias(null, false)
  ]);

  return {
    totales: {
      preguntasPeru: cPeru ? cPeru.total : 0,
      preguntasMundo: cMundo ? cMundo.total : 0,
      totalPreguntas: (cPeru ? cPeru.total : 0) + (cMundo ? cMundo.total : 0),
      totalCategorias: categorias.length,
      totalComodines: comodines.length,
      totalJugadores: jugadores.length
    },
    porCategoriaPeru: porCatPeru,
    porCategoriaMundo: porCatMundo,
    porDificultadPeru: porDifPeru,
    porDificultadMundo: porDifMundo,
    jugadores,
    combatesRecientes,
    comodines,
    categorias
  };
}

module.exports = {
  obtenerPregunta,
  generarOpcionesCategoriasTV,
  obtenerCategorias,
  listarPreguntasAdmin,
  crearOActualizarPregunta,
  cambiarEstadoOEliminarPregunta,
  importarPreguntasMasivo,
  detectarDuplicadosYValidar,
  guardarCategoria,
  obtenerComodinesCatalogo,
  guardarComodinCatalogo,
  obtenerConfiguraciones,
  guardarConfiguraciones,
  obtenerTerritoriosYConexiones,
  registrarOActualizarPerfilJugador,
  registrarCombateBD,
  registrarUsoComodinBD,
  obtenerResumenDashboardAdmin
};
