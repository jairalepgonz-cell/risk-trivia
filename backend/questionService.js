const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const https = require('https');

const dbPath = path.join(__dirname, 'database', 'preguntas.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
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
    )
  `);
});

// Función de traducción universal
function traducir(texto, de = 'auto', a = 'es') {
  return new Promise((resolve) => {
    if (!texto) return resolve('');
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${de}&tl=${a}&dt=t&q=${encodeURIComponent(texto)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json[0].map(i => i[0]).join(''));
        } catch {
          resolve(texto);
        }
      });
    }).on('error', () => resolve(texto));
  });
}

function decodificarHTML(t) {
  if (!t) return '';
  return t.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

// Combina el texto en inglés y español entre paréntesis
function combinarBilingue(es, en) {
  if (!es || !en) return es || en || '';
  if (es.trim().toLowerCase() === en.trim().toLowerCase()) return es;
  return `${es} (${en})`; // Español principal, inglés entre paréntesis
}

function guardarPreguntaEnDB(tipo, categoria, pregunta, a, b, c, d, correcta) {
  const sql = `
    INSERT OR IGNORE INTO preguntas (tipo, categoria, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, correcta)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.run(sql, [tipo, categoria, pregunta, a, b, c, d, correcta]);
}

function consultarBaseLocal(tipo, categoria, idsExcluidos = []) {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM preguntas WHERE tipo = ?';
    const params = [tipo];

    if (categoria && categoria !== 'aleatorio' && tipo === 'opcion_multiple') {
      sql += ' AND categoria = ?';
      params.push(categoria);
    }

    if (idsExcluidos.length > 0) {
      sql += ` AND id NOT IN (${idsExcluidos.map(() => '?').join(',')})`;
      params.push(...idsExcluidos);
    }

    sql += ' ORDER BY RANDOM() LIMIT 1';

    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      if (!row) {
        db.get('SELECT * FROM preguntas WHERE tipo = ? ORDER BY RANDOM() LIMIT 1', [tipo], (e, rFallback) => {
          if (e || !rFallback) return resolve(null);
          resolve(formatear(rFallback));
        });
        return;
      }
      resolve(formatear(row));
    });
  });
}

function formatear(row) {
  return {
    id: row.id,
    tipo: row.tipo,
    categoria: row.categoria,
    pregunta: row.pregunta,
    opciones: {
      A: row.opcion_a,
      B: row.opcion_b,
      C: row.opcion_c,
      D: row.opcion_d
    },
    correcta: row.correcta,
    anioMin: row.anio_min || 1000,
    anioMax: row.anio_max || 2026
  };
}

const CATEGORIAS_API = {
  historia: 23,
  cine: 11,
  deportes: 21,
  ciencia: 17,
  geografia: 22,
  videojuegos: 15,
  musica: 12,
  arte: 25
};

function consultarAPIExterna(catKey) {
  return new Promise((resolve) => {
    let url = 'https://opentdb.com/api.php?amount=1&type=multiple';
    if (catKey && CATEGORIAS_API[catKey]) {
      url += `&category=${CATEGORIAS_API[catKey]}`;
    }

    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.response_code === 0 && json.results.length > 0) {
            const item = json.results[0];
            const incorrectas = item.incorrect_answers.map(decodificarHTML);
            const correcta = decodificarHTML(item.correct_answer);
            const todas = [...incorrectas, correcta].sort(() => 0.5 - Math.random());
            const letras = ['A', 'B', 'C', 'D'];

            resolve({
              pregunta: decodificarHTML(item.question),
              opciones: { A: todas[0], B: todas[1], C: todas[2], D: todas[3] },
              correcta: letras[todas.indexOf(correcta)]
            });
          } else resolve(null);
        } catch { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function obtenerPregunta(categoria = 'aleatorio', esDesempate = false, idsExcluidos = []) {
  // 1. Desempate por aproximación (Años)
  if (esDesempate) {
    const pLocal = await consultarBaseLocal('aproximacion', null, idsExcluidos);
    if (pLocal) {
      // Traducir pregunta al inglés para formato bilingüe
      const pregEn = await traducir(pLocal.pregunta, 'es', 'en');
      return {
        ...pLocal,
        pregunta: `${pregEn}\n(${pLocal.pregunta})`
      };
    }
    return pLocal;
  }

  // 2. Cultura Peruana (origen español -> traduce inglés y combina)
  if (categoria === 'cultura_peruana') {
    const pLocal = await consultarBaseLocal('opcion_multiple', 'cultura_peruana', idsExcluidos);
    if (pLocal) {
      const [pregEn, opAEn, opBEn, opCEn, opDEn] = await Promise.all([
        traducir(pLocal.pregunta, 'es', 'en'),
        traducir(pLocal.opciones.A, 'es', 'en'),
        traducir(pLocal.opciones.B, 'es', 'en'),
        traducir(pLocal.opciones.C, 'es', 'en'),
        traducir(pLocal.opciones.D, 'es', 'en')
      ]);

      return {
        ...pLocal,
       pregunta: `${pLocal.pregunta}\n(${pregEn})`,
        opciones: {
          A: combinarBilingue(pLocal.opciones.A, opAEn),
          B: combinarBilingue(pLocal.opciones.B, opBEn),
          C: combinarBilingue(pLocal.opciones.C, opCEn),
          D: combinarBilingue(pLocal.opciones.D, opDEn)
        }
      };
    }
    return pLocal;
  }

  // 3. API Externa (origen inglés -> traduce español y combina)
  try {
    const raw = await consultarAPIExterna(categoria);
    if (raw) {
      const [pregEs, opAEs, opBEs, opCEs, opDEs] = await Promise.all([
        traducir(raw.pregunta, 'en', 'es'),
        traducir(raw.opciones.A, 'en', 'es'),
        traducir(raw.opciones.B, 'en', 'es'),
        traducir(raw.opciones.C, 'en', 'es'),
        traducir(raw.opciones.D, 'en', 'es')
      ]);

      const pregFinal = `${pregEs}\n(${raw.pregunta})`;
      const opcionesFinal = {
        A: combinarBilingue(opAEs, raw.opciones.A),
        B: combinarBilingue(opBEs, raw.opciones.B),
        C: combinarBilingue(opCEs, raw.opciones.C),
        D: combinarBilingue(opDEs, raw.opciones.D)
      };

      guardarPreguntaEnDB('opcion_multiple', categoria, pregFinal, opcionesFinal.A, opcionesFinal.B, opcionesFinal.C, opcionesFinal.D, raw.correcta);

      return {
        id: 'api_' + Date.now(),
        tipo: 'opcion_multiple',
        categoria,
        pregunta: pregFinal,
        opciones: opcionesFinal,
        correcta: raw.correcta
      };
    }
  } catch (e) {}

  return await consultarBaseLocal('opcion_multiple', categoria, idsExcluidos);
}

module.exports = { obtenerPregunta };