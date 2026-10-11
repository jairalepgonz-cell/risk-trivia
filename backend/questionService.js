const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const https = require('https');

const dbPath = path.join(__dirname, 'database', 'preguntas.db');
const db = new sqlite3.Database(dbPath);

// Traductor universal de Google
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
  return t
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// Español principal, inglés en paréntesis secundario
function combinarBilingue(es, en) {
  if (!es || !en) return es || en || '';
  if (es.trim().toLowerCase() === en.trim().toLowerCase()) return es;
  return `${es} (${en})`;
}

// Categorías estrictamente de CULTURA GENERAL UNIVERSAL
const CATEGORIAS_API = {
  general: 9,      // Conocimiento general
  ciencia: 17,     // Ciencia y naturaleza
  deportes: 21,    // Deportes
  geografia: 22,   // Geografía
  historia: 23,    // Historia
  arte: 25         // Arte
};

function consultarAPIExterna(catKey) {
  return new Promise((resolve) => {
    const idCat = CATEGORIAS_API[catKey] || CATEGORIAS_API.general;
    // &difficulty=easy garantiza preguntas elementales conocidas
    const url = `https://opentdb.com/api.php?amount=1&type=multiple&category=${idCat}&difficulty=easy`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.response_code === 0 && json.results && json.results.length > 0) {
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
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
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

async function obtenerPregunta(categoria = 'aleatorio', esDesempate = false, idsExcluidos = []) {
  // 1. Desempate por año (aproximación)
  if (esDesempate) {
    const pLocal = await consultarBaseLocal('aproximacion', null, idsExcluidos);
    if (pLocal) {
      const pregEn = await traducir(pLocal.pregunta, 'es', 'en');
      return {
        ...pLocal,
        pregunta: `${pLocal.pregunta}\n(${pregEn})`
      };
    }
    return pLocal;
  }

  // 2. Cultura Peruana (siempre de nuestra base local en español)
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

  // 3. API Externa (Cultura general de fácil acceso, español arriba e inglés abajo)
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