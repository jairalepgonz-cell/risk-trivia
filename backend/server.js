const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const os = require('os');

const gameManager = require('./gameManager');
const questionService = require('./questionService');
const { ejecutarSeed } = require('./database/seed');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

function obtenerIPLocal() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

const IP_LOCAL = obtenerIPLocal();
const PORT = process.env.PORT || 3000;
let timerInterval = null;
let tiempoRestanteGlobal = 20;
let tiempoTotalGlobal = 20;

// =========================================================================
// SINCRONIZACIÓN EN TIEMPO REAL DEL TURNO Y DEL MAPA INTERACTIVO
// =========================================================================
async function broadcastTurnoYMapa() {
  const atacante = gameManager.obtenerAtacanteEnTurno();
  const estadoMapa = gameManager.obtenerEstadoCompletoMapa();
  const opcionesCatTV = await questionService.generarOpcionesCategoriasTV(
    gameManager.configuracion.modoBancoPreguntas || 'mixto',
    gameManager.categoriasRecientes,
    5
  ).catch(() => []);

  const payloadTurno = {
    atacanteId: atacante ? atacante.id : null,
    atacanteColor: atacante ? atacante.color : null,
    atacanteNombre: atacante ? atacante.nombre : null,
    rondaActual: gameManager.rondaActual,
    ataquesRealizados: gameManager.turnoEstado.ataquesRealizados,
    maxAtaquesConsecutivos: gameManager.configuracion.maxAtaquesConsecutivos,
    puedeSeguirAtacando: gameManager.turnoEstado.puedeSeguirAtacando,
    territoriosAtacables: estadoMapa.territoriosAtacables,
    categoriasTV: opcionesCatTV,
    config: gameManager.configuracion,
    jugadores: Object.values(gameManager.jugadores)
  };

  io.emit('turno_actualizado', payloadTurno);
  io.emit('mapa_actualizado', estadoMapa);
}

function iniciarReloj(tiempoTotal, onFinish) {
  tiempoTotalGlobal = tiempoTotal;
  tiempoRestanteGlobal = tiempoTotal;
  io.emit('tick_tiempo', { tiempo: tiempoRestanteGlobal, total: tiempoTotalGlobal });
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    tiempoRestanteGlobal--;
    io.emit('tick_tiempo', { tiempo: tiempoRestanteGlobal, total: tiempoTotalGlobal });
    if (tiempoRestanteGlobal <= 0) {
      clearInterval(timerInterval);
      onFinish();
    }
  }, 1000);
}

function agregarTiempoReloj(segundosExtra = 10) {
  tiempoRestanteGlobal += segundosExtra;
  tiempoTotalGlobal = Math.max(tiempoTotalGlobal, tiempoRestanteGlobal);
  io.emit('tick_tiempo', { tiempo: tiempoRestanteGlobal, total: tiempoTotalGlobal });
}

async function resolverYFinalizar() {
  clearInterval(timerInterval);
  const resolucion = gameManager.resolverDuelo();

  // Persistir estadísticas del combate en SQLite
  if (!resolucion.requiereDesempate && resolucion.combateTerritorial) {
    const ct = resolucion.combateTerritorial;
    questionService.registrarCombateBD({
      partidaId: 1,
      territorioOrigen: ct.territorioOrigen ? ct.territorioOrigen.codigo : '',
      territorioObjetivo: ct.territorioObjetivo ? ct.territorioObjetivo.codigo : '',
      atacanteNombre: resolucion.atacante?.nombre,
      atacanteColor: resolucion.atacante?.color,
      defensorNombre: resolucion.defensor?.nombre,
      defensorColor: resolucion.defensor?.color,
      banco: resolucion.banco,
      preguntaId: gameManager.dueloActual.pregunta?.id || 0,
      categoria: resolucion.categoria,
      dificultad: resolucion.dificultad,
      respAt: resolucion.atacante?.resp,
      respDef: resolucion.defensor?.resp,
      tiempoAt: resolucion.atacante?.tiempoMs,
      tiempoDef: resolucion.defensor?.tiempoMs,
      ganadorColor: resolucion.ganador?.color || '',
      bajasAtacante: ct.bajasAtacante,
      bajasDefensor: ct.bajasDefensor,
      conquistado: ct.territorioConquistado,
      atacanteAcerto: resolucion.atacante?.acerto,
      defensorAcerto: resolucion.defensor?.acerto,
      defensaExitosa: ct.defensaExitosa,
      puntosAtacanteDelta: ct.puntosAtacanteDelta,
      puntosDefensorDelta: ct.puntosDefensorDelta
    });
  }

  io.emit('fin_duelo', resolucion);
  io.emit('mapa_actualizado', gameManager.obtenerEstadoCompletoMapa());
  io.emit('actualizacion_jugadores', Object.values(gameManager.jugadores));

  if (resolucion.requiereDesempate) {
    setTimeout(() => {
      io.emit('alerta_desempate', '⚖️ ¡EMPATE EN TRIVIA! Pasando a desempate numérico de Diana...');
      ejecutarDuelo(
        gameManager.dueloActual.atacanteId,
        gameManager.dueloActual.defensorId,
        'aleatorio',
        true,
        {
          territorioOrigen: gameManager.dueloActual.territorioOrigen,
          territorioObjetivo: gameManager.dueloActual.territorioObjetivo
        }
      );
    }, 3400);
  } else {
    // Si hay victoria total de la partida, anunciarla
    if (resolucion.victoriaPartida) {
      io.emit('victoria_partida', resolucion.victoriaPartida);
    }

    // SISTEMA DE ATAQUES CONSECUTIVOS ESTILO RISK:
    // Si el atacante ganó el duelo y aún puede realizar ataques consecutivos, NO pierde el turno automáticamente.
    // Puede elegir otro territorio enemigo para seguir conquistando o finalizar voluntariamente su fase de ataque.
    if (!resolucion.turnoContinua) {
      gameManager.avanzarTurno();
    } else {
      gameManager.estado = 'LOBBY';
    }

    setTimeout(() => {
      broadcastTurnoYMapa();
    }, 6200);
  }
}

async function ejecutarDuelo(atacanteId, defensorId, categoria, esDesempate, contextoTerritorial = {}) {
  let dificultadDeseada = 'aleatorio';
  if (gameManager.configuracion.dificultadProgresiva) {
    if (gameManager.rondaActual <= 2) dificultadDeseada = Math.random() < 0.7 ? 'basico' : 'intermedio';
    else if (gameManager.rondaActual <= 5) dificultadDeseada = Math.random() < 0.6 ? 'intermedio' : 'avanzado';
    else dificultadDeseada = Math.random() < 0.55 ? 'avanzado' : 'intermedio';
  }

  const pregunta = await questionService.obtenerPregunta(
    categoria,
    esDesempate,
    gameManager.preguntasUsadasIds,
    {
      modoBanco: gameManager.configuracion.modoBancoPreguntas || 'mixto',
      dificultad: dificultadDeseada,
      territorioObjetivo: contextoTerritorial.territorioObjetivo
    }
  );

  if (!pregunta) {
    return io.emit('error_juego', 'Error al cargar pregunta del banco.');
  }

  gameManager.iniciarDuelo(atacanteId, defensorId, pregunta, esDesempate, contextoTerritorial);

  const at = gameManager.jugadores[atacanteId] || { id: atacanteId, nombre: 'Atacante', color: 'rojo' };
  const terObj = contextoTerritorial.territorioObjetivo ? gameManager.territorios[contextoTerritorial.territorioObjetivo] : null;
  const terOri = contextoTerritorial.territorioOrigen ? gameManager.territorios[contextoTerritorial.territorioOrigen] : null;

  const def = gameManager.jugadores[defensorId] || {
    id: defensorId,
    nombre: terObj ? `Guarnición (${terObj.nombre})` : 'Defensor',
    color: terObj ? terObj.propietarioColor : 'azul'
  };

  io.emit('comenzar_duelo', {
    atacante: {
      id: at.id,
      nombre: at.nombre,
      color: at.color,
      soldados: terOri ? terOri.soldados : 3,
      territorioNombre: terOri ? terOri.nombre : 'Base Atacante'
    },
    defensor: {
      id: def.id,
      nombre: def.nombre,
      color: def.color,
      soldados: terObj ? terObj.soldados : 2,
      territorioNombre: terObj ? terObj.nombre : 'Territorio Defensor',
      escudoActivo: terObj ? terObj.escudoActivo : false
    },
    territorioOrigen: terOri ? terOri.codigo : null,
    territorioObjetivo: terObj ? terObj.codigo : null,
    esDesempate,
    ataqueConsecutivoNum: gameManager.turnoEstado.ataquesRealizados + 1,
    maxAtaquesConsecutivos: gameManager.configuracion.maxAtaquesConsecutivos,
    pregunta: {
      id: pregunta.id,
      codigoUnico: pregunta.codigoUnico,
      banco: pregunta.banco,
      tipo: pregunta.tipo,
      categoria: pregunta.categoria,
      subcategoria: pregunta.subcategoria,
      dificultad: pregunta.dificultad,
      referenciaGeografica: pregunta.referenciaGeografica,
      pregunta: pregunta.pregunta,
      opciones: pregunta.opciones,
      bonificacionEspecial: pregunta.bonificacionEspecial || null
    }
  });

  const payloadMobile = {
    tipo: pregunta.tipo,
    categoria: pregunta.categoria,
    dificultad: pregunta.dificultad,
    banco: pregunta.banco,
    preguntaTexto: pregunta.pregunta,
    opciones: pregunta.opciones,
    anioMin: pregunta.anioMin || 1000,
    anioMax: pregunta.anioMax || 2026,
    territorioObjetivoNombre: terObj ? terObj.nombre : 'Territorio Enemigo',
    soyAtacante: true
  };

  io.to(atacanteId).emit('tu_turno_responder', { ...payloadMobile, soyAtacante: true });
  if (defensorId && defensorId !== 'bot_guarnicion') {
    io.to(defensorId).emit('tu_turno_responder', { ...payloadMobile, soyAtacante: false });
  }

  iniciarReloj(gameManager.configuracion.tiempoPorPregunta, () => {
    resolverYFinalizar();
  });
}

// =========================================================================
// API REST DE ADMINISTRACIÓN Y PARAMETRIZACIÓN (/api/admin/...)
// =========================================================================
app.get('/api/estado-mapa', (req, res) => {
  res.json(gameManager.obtenerEstadoCompletoMapa());
});

app.get('/api/categorias', async (req, res) => {
  try {
    const cats = await questionService.obtenerCategorias(req.query.ambito, req.query.activas === 'true');
    res.json({ exito: true, categorias: cats });
  } catch (e) {
    res.status(500).json({ exito: false, error: e.message });
  }
});

app.get('/api/comodines', async (req, res) => {
  try {
    const coms = await questionService.obtenerComodinesCatalogo(req.query.activos === 'true');
    res.json({ exito: true, comodines: coms });
  } catch (e) {
    res.status(500).json({ exito: false, error: e.message });
  }
});

app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const data = await questionService.obtenerResumenDashboardAdmin();
    const cfg = await questionService.obtenerConfiguraciones();
    res.json({
      exito: true,
      ...data,
      configuraciones: cfg.lista,
      configMapa: cfg.mapa,
      partidaEnVivo: gameManager.obtenerEstadoCompletoMapa()
    });
  } catch (e) {
    res.status(500).json({ exito: false, error: e.message });
  }
});

app.get('/api/admin/preguntas', async (req, res) => {
  try {
    const lista = await questionService.listarPreguntasAdmin(req.query);
    res.json({ exito: true, total: lista.length, preguntas: lista });
  } catch (e) {
    res.status(500).json({ exito: false, error: e.message });
  }
});

app.post('/api/admin/preguntas', async (req, res) => {
  try {
    const r = await questionService.crearOActualizarPregunta(req.body);
    res.json(r);
  } catch (e) {
    res.status(400).json({ exito: false, error: e.message });
  }
});

app.delete('/api/admin/preguntas/:banco/:id', async (req, res) => {
  try {
    const accion = req.query.accion || 'eliminar';
    const r = await questionService.cambiarEstadoOEliminarPregunta(req.params.banco, req.params.id, accion);
    res.json(r);
  } catch (e) {
    res.status(400).json({ exito: false, error: e.message });
  }
});

app.post('/api/admin/preguntas/importar', async (req, res) => {
  try {
    const { preguntas, banco } = req.body;
    if (!Array.isArray(preguntas)) return res.status(400).json({ exito: false, error: 'Se requiere un arreglo de preguntas.' });
    const r = await questionService.importarPreguntasMasivo(preguntas, banco || 'peru');
    res.json(r);
  } catch (e) {
    res.status(400).json({ exito: false, error: e.message });
  }
});

app.get('/api/admin/preguntas/exportar', async (req, res) => {
  try {
    const banco = req.query.banco || 'todos';
    const preguntas = await questionService.listarPreguntasAdmin({ banco, limite: 5000 });
    res.setHeader('Content-Disposition', `attachment; filename="banco_preguntas_${banco}_2026.json"`);
    res.json({ exportadoEn: new Date().toISOString(), banco, total: preguntas.length, preguntas });
  } catch (e) {
    res.status(500).json({ exito: false, error: e.message });
  }
});

app.get('/api/admin/preguntas/auditoria', async (req, res) => {
  try {
    const reporte = await questionService.detectarDuplicadosYValidar();
    res.json({ exito: true, ...reporte });
  } catch (e) {
    res.status(500).json({ exito: false, error: e.message });
  }
});

app.post('/api/admin/categorias', async (req, res) => {
  try {
    const r = await questionService.guardarCategoria(req.body);
    res.json(r);
  } catch (e) {
    res.status(400).json({ exito: false, error: e.message });
  }
});

app.post('/api/admin/comodines', async (req, res) => {
  try {
    const r = await questionService.guardarComodinCatalogo(req.body);
    const listaCom = await questionService.obtenerComodinesCatalogo(false);
    gameManager.cargarDesdeBaseDeDatos({}, listaCom);
    io.emit('catalogo_comodines_actualizado', listaCom);
    res.json(r);
  } catch (e) {
    res.status(400).json({ exito: false, error: e.message });
  }
});

app.get('/api/admin/configuraciones', async (req, res) => {
  try {
    const cfg = await questionService.obtenerConfiguraciones();
    res.json({ exito: true, ...cfg });
  } catch (e) {
    res.status(500).json({ exito: false, error: e.message });
  }
});

app.post('/api/admin/configuraciones', async (req, res) => {
  try {
    const cfg = await questionService.guardarConfiguraciones(req.body);
    gameManager.actualizarConfiguracion(cfg.mapa);
    Object.values(gameManager.jugadores).forEach(j => {
      io.to(j.id).emit('actualizar_comodines', j.comodines);
    });
    await broadcastTurnoYMapa();
    res.json({ exito: true, ...cfg });
  } catch (e) {
    res.status(400).json({ exito: false, error: e.message });
  }
});

// =========================================================================
// SOCKET.IO: EVENTOS MULTIJUGADOR EN TIEMPO REAL
// =========================================================================
io.on('connection', async (socket) => {
  socket.emit('info_servidor', { ip: IP_LOCAL, port: PORT });
  socket.emit('lobby_colores_disponibles', gameManager.obtenerColoresDisponibles());
  socket.emit('actualizacion_jugadores', Object.values(gameManager.jugadores));
  socket.emit('mapa_actualizado', gameManager.obtenerEstadoCompletoMapa());

  const listaComodines = await questionService.obtenerComodinesCatalogo(true).catch(() => []);
  const listaCategorias = await questionService.obtenerCategorias(null, true).catch(() => []);
  socket.emit('catalogo_inicial', {
    comodines: listaComodines,
    categorias: listaCategorias,
    configuracion: gameManager.configuracion
  });

  socket.on('guardar_configuracion', async (cfg) => {
    gameManager.actualizarConfiguracion(cfg);
    await questionService.guardarConfiguraciones(cfg).catch(() => {});
    Object.values(gameManager.jugadores).forEach(j => {
      io.to(j.id).emit('actualizar_comodines', j.comodines);
    });
    await broadcastTurnoYMapa();
  });

  socket.on('cambiar_modo_mapa', async ({ modoMapa, modoBancoPreguntas }) => {
    const cambios = {};
    if (modoMapa) cambios.modoMapa = modoMapa;
    if (modoBancoPreguntas) cambios.modoBancoPreguntas = modoBancoPreguntas;
    gameManager.actualizarConfiguracion(cambios);
    await questionService.guardarConfiguraciones(cambios).catch(() => {});
    await broadcastTurnoYMapa();
  });

  socket.on('reiniciar_mapa_partida', async () => {
    clearInterval(timerInterval);
    gameManager.reiniciarPartidaCompleta();
    io.emit('alerta_comodin_publico', { mensaje: '🗺️ ¡Tablero Risk y partida reiniciados para una nueva campaña!' });
    await broadcastTurnoYMapa();
  });

  // =========================================================================
  // REGLAS TABLERO FÍSICO RISK: SORTEO DE 42 TARJETAS (★1 / ★★2) O ELEGIR LUGAR
  // =========================================================================
  socket.on('sortear_tarjetas_inicio', async ({ modo } = {}) => {
    const modoSeleccionado = modo || 'tarjetas_estrellas';
    const res = gameManager.repartirTerritoriosPorModo(modoSeleccionado);
    const msg = modoSeleccionado === 'eleccion_mapa'
      ? '📍 ¡Modo ELEGIR LUGAR EN EL MAPA activado! Cada comandante puede elegir qué territorios ocupar en el tablero físico.'
      : '🎲 ¡42 Tarjetas Oficiales de Risk repartidas por suerte! Revisen en pantalla o en su celular cuántos soldados (★1 o ★★2) poner en cada país del tablero físico.';
    io.emit('alerta_comodin_publico', { mensaje: msg });
    io.emit('tarjetas_inicio_repartidas', { modo: modoSeleccionado, ...res });
    io.emit('actualizacion_jugadores', Object.values(gameManager.jugadores));
    await broadcastTurnoYMapa();
  });

  socket.on('elegir_territorio_mapa', async ({ territorioCodigo, colorJugador, soldados }) => {
    const jug = gameManager.jugadores[socket.id];
    const colorFinal = colorJugador || (jug ? jug.color : null);
    if (!colorFinal) return socket.emit('error_juego', 'Selecciona o regístrate con un color primero.');

    const res = gameManager.asignarTerritorioManual(territorioCodigo, colorFinal, soldados);
    if (!res.exito) return socket.emit('error_juego', res.error);

    io.emit('alerta_comodin_publico', {
      mensaje: `📍 ${res.territorio.nombre} asignado al ejército ${colorFinal.toUpperCase()} con ${res.territorio.soldados} soldado(s) (${'★'.repeat(res.territorio.estrellasTarjeta || 1)}).`
    });
    io.emit('actualizacion_jugadores', Object.values(gameManager.jugadores));
    await broadcastTurnoYMapa();
  });

  socket.on('robar_tarjeta_risk', async ({ socketId } = {}) => {
    const targetId = socketId || socket.id;
    const res = gameManager.robarTarjetaManual(targetId);
    if (!res.exito) return socket.emit('error_juego', res.error);

    const jug = gameManager.jugadores[targetId];
    socket.emit('tarjeta_risk_recibida', res);
    if (targetId !== socket.id) io.to(targetId).emit('tarjeta_risk_recibida', res);
    io.emit('alerta_comodin_publico', {
      mensaje: `🃏 ¡${jug ? jug.nombre : 'Comandante'} robó tarjeta Risk: ${res.tarjeta.nombre} (${'★'.repeat(res.tarjeta.estrellas)} = ${res.tarjeta.estrellas} soldado${res.tarjeta.estrellas > 1 ? 's' : ''})!`
    });
    io.emit('actualizacion_jugadores', Object.values(gameManager.jugadores));
    await broadcastTurnoYMapa();
  });

  socket.on('canjear_estrellas_risk', async ({ socketId } = {}) => {
    const targetId = socketId || socket.id;
    const res = gameManager.canjearEstrellasRisk(targetId);
    if (!res.exito) return socket.emit('error_juego', res.error);

    socket.emit('estrellas_canjeadas_ok', res);
    if (targetId !== socket.id) io.to(targetId).emit('estrellas_canjeadas_ok', res);
    io.emit('alerta_comodin_publico', {
      mensaje: res.mensajeTableroFisico
    });
    io.emit('actualizacion_jugadores', Object.values(gameManager.jugadores));
    await broadcastTurnoYMapa();
  });

  socket.on('fijar_primer_turno', async ({ colorOId }) => {
    gameManager.fijarPrimerJugador(colorOId);
    await broadcastTurnoYMapa();
  });

  // BOTÓN DEL HOST: TERMINAR JUEGO Y FORZAR REGRESO AL LOBBY / MAPA
  socket.on('forzar_terminar_juego', async () => {
    clearInterval(timerInterval);
    gameManager.cancelarDuelo();
    io.emit('juego_cancelado_por_host');
    await broadcastTurnoYMapa();
  });

  // PASAR TURNO O FINALIZAR VOLUNTARIAMENTE LA FASE DE ATAQUE CONSECUTIVO
  socket.on('pasar_turno', async () => {
    const jugador = gameManager.jugadores[socket.id];
    if (!jugador) return;

    const atacante = gameManager.obtenerAtacanteEnTurno();
    if (atacante && atacante.id === socket.id) {
      const ataquesHechos = gameManager.turnoEstado.ataquesRealizados;
      gameManager.avanzarTurno();
      io.emit('alerta_comodin_publico', {
        mensaje: ataquesHechos > 0
          ? `🚩 ${jugador.nombre} (${jugador.color.toUpperCase()}) finalizó su fase de ataque tras ${ataquesHechos} asalto(s) y cedió el turno.`
          : `⏩ ${jugador.nombre} (${jugador.color.toUpperCase()}) consolidó posiciones y pasó el turno.`
      });
      await broadcastTurnoYMapa();
    }
  });

  socket.on('finalizar_fase_ataque', async () => {
    const jugador = gameManager.jugadores[socket.id];
    if (!jugador) return;
    const atacante = gameManager.obtenerAtacanteEnTurno();
    if (atacante && atacante.id === socket.id) {
      gameManager.avanzarTurno();
      io.emit('alerta_comodin_publico', {
        mensaje: `🚩 ${jugador.nombre} (${jugador.color.toUpperCase()}) aseguró sus conquistas y terminó su turno.`
      });
      await broadcastTurnoYMapa();
    }
  });

  socket.on('expulsar_jugador', async ({ socketId }) => {
    const color = gameManager.removerJugador(socketId, true);
    if (color) {
      io.to(socketId).emit('fuiste_expulsado');
      io.emit('lobby_colores_disponibles', gameManager.obtenerColoresDisponibles());
      io.emit('actualizacion_jugadores', Object.values(gameManager.jugadores));
      await broadcastTurnoYMapa();
    }
  });

  socket.on('jugador_unirse', async ({ nombre, color }) => {
    const res = gameManager.registrarJugador(socket.id, nombre, color);
    if (!res.exito) return socket.emit('error_registro', res.error);

    await questionService.registrarOActualizarPerfilJugador(res.jugador.nombre, res.jugador.color).catch(() => {});

    socket.emit('registro_exitoso', res.jugador);
    io.emit('lobby_colores_disponibles', gameManager.obtenerColoresDisponibles());
    io.emit('actualizacion_jugadores', Object.values(gameManager.jugadores));
    await broadcastTurnoYMapa();
  });

  // Selección o resaltado en vivo de un territorio en el mapa (desde Host o Móvil)
  socket.on('seleccionar_territorio_mapa', ({ territorioCodigo }) => {
    const ter = gameManager.territorios[territorioCodigo];
    if (!ter) return;
    io.emit('territorio_resaltado_mapa', {
      territorioCodigo,
      nombre: ter.nombre,
      propietarioColor: ter.propietarioColor,
      propietarioNombre: ter.propietarioNombre,
      soldados: ter.soldados,
      vecinos: ter.vecinos
    });
  });

  // Ruleta de Categorías estilo Concurso de TV
  socket.on('girar_ruleta_categorias', async () => {
    const opciones = await questionService.generarOpcionesCategoriasTV(
      gameManager.configuracion.modoBancoPreguntas || 'mixto',
      gameManager.categoriasRecientes,
      5
    );
    const ganadora = opciones[Math.floor(Math.random() * opciones.length)] || { codigo: 'aleatorio', nombre: 'Cultura General', icono: '🎡' };
    io.emit('ruleta_categorias_resultado', { opciones, ganadora });
  });

  // DECLARAR ATAQUE (SOPORTA SELECCIÓN DE TERRITORIO EN MAPA O RIVAL DIRECTO)
  socket.on('declarar_ataque', async (datosAtaque = {}) => {
    const {
      defensorColor,
      territorioOrigen,
      territorioObjetivo,
      categoriaDeseada,
      usoComodinTema
    } = datosAtaque;

    // Permitir que el Host también dispare un ataque en nombre del atacante en turno si se juega en pantalla compartida
    const atacanteEnTurno = gameManager.obtenerAtacanteEnTurno();
    const idAtacanteEfectivo = gameManager.jugadores[socket.id]
      ? socket.id
      : (atacanteEnTurno ? atacanteEnTurno.id : null);

    if (!idAtacanteEfectivo) return socket.emit('error_juego', 'No hay comandante activo.');

    const prep = gameManager.prepararAtaqueTerritorial(idAtacanteEfectivo, {
      territorioOrigen,
      territorioObjetivo,
      defensorColor
    });

    if (!prep.exito) {
      return socket.emit('error_juego', prep.error);
    }

    const atacante = prep.atacante;
    const defensor = prep.defensor;

    let categoriaFinal = categoriaDeseada || 'aleatorio';
    if (usoComodinTema) {
      const ok = gameManager.usarComodinTema(atacante.id);
      if (ok) {
        await questionService.registrarUsoComodinBD(atacante.nombre);
        io.to(atacante.id).emit('actualizar_comodines', atacante.comodines);
        io.emit('alerta_comodin_publico', {
          mensaje: `🎯 ¡${atacante.nombre} activó Cambio de Categoría: ${categoriaFinal.toUpperCase()}!`
        });
      }
    }

    // Emitir animación previa de marcha de tropas hacia el territorio objetivo en el mapa
    io.emit('animacion_ataque_mapa', {
      atacanteNombre: atacante.nombre,
      atacanteColor: atacante.color,
      defensorNombre: defensor.nombre,
      defensorColor: defensor.color,
      territorioOrigen: prep.territorioOrigen,
      territorioObjetivo: prep.territorioObjetivo,
      nombreTerritorioObjetivo: prep.infoTerritorioObjetivo ? prep.infoTerritorioObjetivo.nombre : 'Territorio Rival'
    });

    await ejecutarDuelo(atacante.id, defensor.id, categoriaFinal, false, {
      territorioOrigen: prep.territorioOrigen,
      territorioObjetivo: prep.territorioObjetivo
    });
  });

  socket.on('enviar_respuesta', ({ opcion }) => {
    const res = gameManager.registrarRespuesta(socket.id, opcion);

    if (res.segundaOportunidadUsada) {
      // El comodín Fénix (Segunda Oportunidad) salvó al jugador del primer error
      socket.emit('efecto_segunda_oportunidad', {
        opcionIncorrecta: res.opcionIncorrecta,
        mensaje: res.mensaje
      });
      const j = gameManager.jugadores[socket.id];
      if (j) {
        io.emit('alerta_comodin_publico', {
          mensaje: `🦅 ¡El Fénix salvó a ${j.nombre} de una respuesta fallida y le dio una segunda oportunidad!`
        });
      }
      return;
    }

    if (res.ok) {
      const j = gameManager.jugadores[socket.id];
      socket.emit('respuesta_confirmada', { opcion });
      io.emit('jugador_ha_respondido', { color: j ? j.color : 'gris', nombre: j ? j.nombre : '' });

      if (gameManager.ambosRespondieron()) {
        resolverYFinalizar();
      }
    }
  });

  socket.on('usar_martillo', async () => {
    const res = gameManager.usarMartillo(socket.id);
    if (!res) return;
    if (res.error) return socket.emit('error_juego', res.error);

    const j = gameManager.jugadores[socket.id];
    await questionService.registrarUsoComodinBD(j?.nombre);
    socket.emit('efecto_martillo_privado', res);
    socket.emit('actualizar_comodines', res.restantes);
    io.emit('alerta_comodin_publico', {
      mensaje: `🔨 ¡${j.nombre} (${j.color.toUpperCase()}) golpeó las opciones con el Martillo Demoledor!`,
      animacion: 'hammer-smash',
      color: j.color
    });
  });

  socket.on('usar_loro', async () => {
    const res = gameManager.usarLoro(socket.id);
    if (!res) return;
    if (res.error) return socket.emit('error_juego', res.error);

    const j = gameManager.jugadores[socket.id];
    await questionService.registrarUsoComodinBD(j?.nombre);
    socket.emit('efecto_loro_privado', res);
    socket.emit('actualizar_comodines', res.restantes);
    io.emit('alerta_comodin_publico', {
      mensaje: `🦜 ¡${j.nombre} (${j.color.toUpperCase()}) invocó al Loro Oráculo!`,
      animacion: 'parrot-fly',
      color: j.color
    });
  });

  // NUEVO MANEJADOR PARA TODOS LOS 14 COMODINES DE TRIVIADOR MUNDO
  socket.on('usar_comodin_avanzado', async ({ codigo, territorioCodigo }) => {
    const res = gameManager.usarComodinAvanzado(socket.id, codigo, { territorioCodigo });
    if (!res.exito) {
      return socket.emit('error_juego', res.error || 'No se pudo usar el comodín.');
    }

    const j = gameManager.jugadores[socket.id];
    await questionService.registrarUsoComodinBD(j?.nombre);

    if (codigo === 'tiempo_adicional' && res.datosEfecto?.segundosExtra) {
      agregarTiempoReloj(res.datosEfecto.segundosExtra);
    }

    if (codigo === 'congelar_rival' && res.datosEfecto?.rivalId) {
      io.to(res.datosEfecto.rivalId).emit('fuiste_congelado', {
        por: j ? j.nombre : 'Rival'
      });
    }

    socket.emit('efecto_comodin_privado', res);
    socket.emit('actualizar_comodines', res.restantes);

    if (res.mensajePublico) {
      io.emit('alerta_comodin_publico', {
        mensaje: res.mensajePublico,
        codigo: res.codigo,
        color: j ? j.color : 'gold'
      });
    }

    if (['refuerzos', 'escudo', 'proteccion_territorial'].includes(codigo)) {
      io.emit('mapa_actualizado', gameManager.obtenerEstadoCompletoMapa());
    }
  });

  socket.on('disconnect', async () => {
    const eraParticipanteDuelo = (
      gameManager.estado !== 'LOBBY' &&
      (socket.id === gameManager.dueloActual.atacanteId || socket.id === gameManager.dueloActual.defensorId)
    );
    const color = gameManager.removerJugador(socket.id, false);
    if (color) {
      io.emit('lobby_colores_disponibles', gameManager.obtenerColoresDisponibles());
      io.emit('actualizacion_jugadores', Object.values(gameManager.jugadores));

      if (eraParticipanteDuelo) {
        await resolverYFinalizar();
      } else {
        await broadcastTurnoYMapa();
      }
    }
  });
});

// Inicializar base de datos y arrancar servidor
async function iniciarServidor() {
  try {
    await ejecutarSeed();
    const cfg = await questionService.obtenerConfiguraciones();
    const coms = await questionService.obtenerComodinesCatalogo(false);
    gameManager.cargarDesdeBaseDeDatos(cfg.mapa, coms);
  } catch (e) {
    console.error('Aviso inicializando datos:', e.message);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`⚔️  RISK TRIVIA / TRIVIADOR MUNDO ONLINE`);
    console.log(`📺 Mesa Host / Mapa TV: http://${IP_LOCAL}:${PORT}/host.html`);
    console.log(`📱 Control Móvil:       http://${IP_LOCAL}:${PORT}/player.html`);
    console.log(`⚙️  Panel Admin:         http://${IP_LOCAL}:${PORT}/admin.html`);
    console.log(`=======================================================`);
  });
}

iniciarServidor();
