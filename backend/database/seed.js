const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const {
  DIFICULTADES,
  CATEGORIAS,
  COMODINES_CATALOGO,
  CONFIGURACIONES_INICIALES,
  TERRITORIOS_CATALOGO,
  CONEXIONES_PARES
} = require('./catalogData');

const { generarBancoPeru } = require('./bankPeru');
const { generarBancoMundo } = require('./bankMundo');
const { generarExpansionPeru, generarExpansionMundo } = require('./bankExpansion');

const dbPrincipalPath = path.join(__dirname, 'preguntas.db');
const dbPeruPath = path.join(__dirname, 'preguntas_peru.db');
const dbMundoPath = path.join(__dirname, 'preguntas_mundo.db');
const schemaPath = path.join(__dirname, 'schema.sql');

function inicializarBaseIndependiente(filePath, tablaNombre, preguntas) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filePath);
    const colPaisORegion = tablaNombre === 'preguntas_peru' ? 'region_referencia' : 'pais_referencia';

    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS ${tablaNombre} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          codigo_unico TEXT NOT NULL UNIQUE,
          tipo TEXT NOT NULL DEFAULT 'opcion_multiple',
          categoria TEXT NOT NULL,
          subcategoria TEXT DEFAULT 'General',
          dificultad TEXT NOT NULL DEFAULT 'basico',
          pregunta TEXT NOT NULL UNIQUE,
          opcion_a TEXT,
          opcion_b TEXT,
          opcion_c TEXT,
          opcion_d TEXT,
          correcta TEXT NOT NULL,
          anio_min INTEGER DEFAULT 1000,
          anio_max INTEGER DEFAULT 2026,
          explicacion TEXT DEFAULT '',
          ${colPaisORegion} TEXT DEFAULT '',
          fuente_verificacion TEXT DEFAULT '',
          fecha_referencia TEXT DEFAULT '2026',
          estado TEXT NOT NULL DEFAULT 'activo',
          veces_usada INTEGER NOT NULL DEFAULT 0,
          fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
          fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run('BEGIN TRANSACTION');
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO ${tablaNombre} (
          codigo_unico, tipo, categoria, subcategoria, dificultad,
          pregunta, opcion_a, opcion_b, opcion_c, opcion_d, correcta,
          anio_min, anio_max, explicacion, ${colPaisORegion}, fuente_verificacion, fecha_referencia, estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')
      `);

      preguntas.forEach(p => {
        stmt.run([
          p.codigo_unico,
          p.tipo,
          p.categoria,
          p.subcategoria,
          p.dificultad,
          p.pregunta,
          p.opcion_a,
          p.opcion_b,
          p.opcion_c,
          p.opcion_d,
          p.correcta,
          p.anio_min,
          p.anio_max,
          p.explicacion,
          p.region_referencia || p.pais_referencia || 'General',
          p.fuente_verificacion,
          p.fecha_referencia || '2026'
        ]);
      });

      stmt.finalize();
      db.run('COMMIT', (err) => {
        if (err) return reject(err);
        db.close(() => resolve(preguntas.length));
      });
    });
  });
}

async function ejecutarSeed() {
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  const preguntasPeru = [...generarBancoPeru(), ...generarExpansionPeru(500)];
  const preguntasMundo = [...generarBancoMundo(), ...generarExpansionMundo(500)];

  // 1. Inicializar Bases de Datos Físicas Independientes (Perú y Mundo)
  await inicializarBaseIndependiente(dbPeruPath, 'preguntas_peru', preguntasPeru);
  await inicializarBaseIndependiente(dbMundoPath, 'preguntas_mundo', preguntasMundo);

  // 2. Inicializar Base de Datos Principal Unificada (preguntas.db)
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPrincipalPath);

    db.exec(schemaSQL, (errSchema) => {
      if (errSchema) {
        console.error('Error ejecutando schema.sql:', errSchema);
        return reject(errSchema);
      }

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Limpiar registros artificiales repetidos "(Registro X-Y)" de la tabla heredada
        db.run(`DELETE FROM preguntas WHERE pregunta LIKE '%(Registro %'`);

        // Poblar Dificultades
        const stmtDif = db.prepare(`
          INSERT OR REPLACE INTO dificultades (codigo, nombre, puntos_base, tropas_recompensa, penalizacion_puntos, multiplicador, activo)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `);
        DIFICULTADES.forEach(d => {
          stmtDif.run([d.codigo, d.nombre, d.puntos_base, d.tropas_recompensa, d.penalizacion_puntos, d.multiplicador]);
        });
        stmtDif.finalize();

        // Poblar Categorías
        const stmtCat = db.prepare(`
          INSERT OR REPLACE INTO categorias (codigo, nombre, ambito, subambito, icono, color, descripcion, es_especial, es_sorpresa, probabilidad, modos_compatibles, activa)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'todos', 1)
        `);
        CATEGORIAS.forEach(c => {
          stmtCat.run([
            c.codigo, c.nombre, c.ambito, c.subambito || 'General',
            c.icono || '🎯', c.color || '#3a86ff', c.descripcion || '',
            c.es_especial || 0, c.es_sorpresa || 0, c.probabilidad || 100
          ]);
        });
        stmtCat.finalize();

        // Poblar Comodines
        const stmtCom = db.prepare(`
          INSERT OR REPLACE INTO comodines_catalogo (
            codigo, nombre, descripcion, icono, animacion, tipo,
            cantidad_inicial, limite_maximo, probabilidad_aparicion, costo_monedas,
            condiciones_uso, duracion_turnos, tiempo_reutilizacion, modos_compatibles,
            activo, disponibilidad_nivel, efecto_combate, efecto_pregunta, efecto_mapa
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        COMODINES_CATALOGO.forEach(cm => {
          stmtCom.run([
            cm.codigo, cm.nombre, cm.descripcion, cm.icono, cm.animacion, cm.tipo,
            cm.cantidad_inicial, cm.limite_maximo, cm.probabilidad_aparicion, cm.costo_monedas,
            cm.condiciones_uso, cm.duracion_turnos, cm.tiempo_reutilizacion, cm.modos_compatibles,
            cm.activo, cm.disponibilidad_nivel, cm.efecto_combate, cm.efecto_pregunta, cm.efecto_mapa
          ]);
        });
        stmtCom.finalize();

        // Poblar Configuraciones (INSERT OR IGNORE para preservar ajustes personalizados del administrador)
        const stmtCfg = db.prepare(`
          INSERT OR IGNORE INTO configuraciones (clave, valor, tipo, grupo, descripcion)
          VALUES (?, ?, ?, ?, ?)
        `);
        CONFIGURACIONES_INICIALES.forEach(cfg => {
          stmtCfg.run([cfg.clave, cfg.valor, cfg.tipo, cfg.grupo, cfg.descripcion]);
        });
        stmtCfg.finalize();

        // Poblar Territorios y Conexiones
        const stmtTer = db.prepare(`
          INSERT OR REPLACE INTO territorios_catalogo (
            codigo, mapa, nombre, region_continente, centro_x, centro_y, svg_path, tropas_iniciales, puntos_valor, bono_region
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        TERRITORIOS_CATALOGO.forEach(t => {
          stmtTer.run([
            t.codigo, t.mapa, t.nombre, t.region_continente,
            t.centro_x, t.centro_y, t.svg_path, t.tropas_iniciales, t.puntos_valor, t.bono_region
          ]);
        });
        stmtTer.finalize();

        db.run(`DELETE FROM territorios_conexiones`);
        const stmtCon = db.prepare(`
          INSERT OR IGNORE INTO territorios_conexiones (mapa, territorio_origen, territorio_destino)
          VALUES (?, ?, ?)
        `);
        CONEXIONES_PARES.forEach(([a, b]) => {
          const m = (a.startsWith('PE_') && b.startsWith('PE_')) ? 'peru'
            : (a.startsWith('MU_') && b.startsWith('MU_')) ? 'mundo'
            : 'peru_mundo';
          stmtCon.run([m, a, b]);
          stmtCon.run([m, b, a]);
        });
        stmtCon.finalize();

        // Poblar Banco Perú en la base unificada
        const stmtPeru = db.prepare(`
          INSERT OR REPLACE INTO preguntas_peru (
            codigo_unico, tipo, categoria, subcategoria, dificultad,
            pregunta, opcion_a, opcion_b, opcion_c, opcion_d, correcta,
            anio_min, anio_max, explicacion, region_referencia, fuente_verificacion, fecha_referencia, estado
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')
        `);
        preguntasPeru.forEach(p => {
          stmtPeru.run([
            p.codigo_unico, p.tipo, p.categoria, p.subcategoria, p.dificultad,
            p.pregunta, p.opcion_a, p.opcion_b, p.opcion_c, p.opcion_d, p.correcta,
            p.anio_min, p.anio_max, p.explicacion, p.region_referencia, p.fuente_verificacion, p.fecha_referencia
          ]);
        });
        stmtPeru.finalize();

        // Poblar Banco Mundo en la base unificada
        const stmtMundo = db.prepare(`
          INSERT OR REPLACE INTO preguntas_mundo (
            codigo_unico, tipo, categoria, subcategoria, dificultad,
            pregunta, opcion_a, opcion_b, opcion_c, opcion_d, correcta,
            anio_min, anio_max, explicacion, pais_referencia, fuente_verificacion, fecha_referencia, estado
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'activo')
        `);
        preguntasMundo.forEach(p => {
          stmtMundo.run([
            p.codigo_unico, p.tipo, p.categoria, p.subcategoria, p.dificultad,
            p.pregunta, p.opcion_a, p.opcion_b, p.opcion_c, p.opcion_d, p.correcta,
            p.anio_min, p.anio_max, p.explicacion, p.pais_referencia, p.fuente_verificacion, p.fecha_referencia
          ]);
        });
        stmtMundo.finalize();

        // Sincronizar también en tabla `preguntas` para máxima compatibilidad
        const stmtLegacy = db.prepare(`
          INSERT OR REPLACE INTO preguntas (tipo, categoria, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, correcta, anio_min, anio_max)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        [...preguntasPeru, ...preguntasMundo].forEach(p => {
          stmtLegacy.run([
            p.tipo, p.categoria, p.pregunta, p.opcion_a, p.opcion_b, p.opcion_c, p.opcion_d, p.correcta, p.anio_min || 1000, p.anio_max || 2026
          ]);
        });
        stmtLegacy.finalize();

        db.run('COMMIT', (errCommit) => {
          if (errCommit) return reject(errCommit);
          db.get('SELECT COUNT(*) AS cPeru FROM preguntas_peru', (e1, r1) => {
            db.get('SELECT COUNT(*) AS cMundo FROM preguntas_mundo', (e2, r2) => {
              db.get('SELECT COUNT(*) AS cCat FROM categorias', (e3, r3) => {
                db.get('SELECT COUNT(*) AS cCom FROM comodines_catalogo', (e4, r4) => {
                  const resumen = {
                    preguntasPeru: r1 ? r1.cPeru : 0,
                    preguntasMundo: r2 ? r2.cMundo : 0,
                    totalPreguntas: (r1 ? r1.cPeru : 0) + (r2 ? r2.cMundo : 0),
                    categorias: r3 ? r3.cCat : 0,
                    comodines: r4 ? r4.cCom : 0
                  };
                  console.log('=======================================================');
                  console.log('¡BASES DE DATOS INICIALIZADAS Y SINCRONIZADAS CON ÉXITO!');
                  console.log(`- Banco Independiente Perú (preguntas_peru.db): ${resumen.preguntasPeru} preguntas`);
                  console.log(`- Banco Independiente Mundo (preguntas_mundo.db): ${resumen.preguntasMundo} preguntas`);
                  console.log(`- Total Preguntas Verificadas sin duplicados: ${resumen.totalPreguntas}`);
                  console.log(`- Categorías activas: ${resumen.categorias} | Comodines: ${resumen.comodines}`);
                  console.log('=======================================================');
                  db.close(() => resolve(resumen));
                });
              });
            });
          });
        });
      });
    });
  });
}

if (require.main === module) {
  ejecutarSeed().catch(err => {
    console.error('Error en seed:', err);
    process.exit(1);
  });
}

module.exports = { ejecutarSeed };
