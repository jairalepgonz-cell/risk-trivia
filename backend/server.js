const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const os = require('os');

const gameManager = require('./gameManager');
const questionService = require('./questionService');

const app = express();
app.use(cors());
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
const PORT = 3000;
let timerInterval = null;

function broadcastTurno() {
  const atacante = gameManager.obtenerAtacanteEnTurno();
  io.emit('turno_actualizado', {
    atacanteId: atacante ? atacante.id : null,
    atacanteColor: atacante ? atacante.color : null,
    atacanteNombre: atacante ? atacante.nombre : null,
    jugadores: Object.values(gameManager.jugadores)
  });
}

function iniciarReloj(tiempoTotal, onFinish) {
  let tiempo = tiempoTotal;
  io.emit('tick_tiempo', { tiempo, total: tiempoTotal });
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    tiempo--;
    io.emit('tick_tiempo', { tiempo, total: tiempoTotal });
    if (tiempo <= 0) {
      clearInterval(timerInterval);
      onFinish();
    }
  }, 1000);
}

function resolverYFinalizar() {
  clearInterval(timerInterval);
  const resolucion = gameManager.resolverDuelo();
  io.emit('fin_duelo', resolucion);

  if (resolucion.requiereDesempate) {
    setTimeout(() => {
      io.emit('alerta_desempate', '¡EMPATE! Pasando a desempate numérico de Diana...');
      ejecutarDuelo(gameManager.dueloActual.atacanteId, gameManager.dueloActual.defensorId, 'aleatorio', true);
    }, 3200);
  } else {
    gameManager.avanzarTurno();
    setTimeout(() => broadcastTurno(), 6500);
  }
}

async function ejecutarDuelo(atacanteId, defensorId, categoria, esDesempate) {
  const pregunta = await questionService.obtenerPregunta(categoria, esDesempate, gameManager.preguntasUsadasIds);
  if (!pregunta) return io.emit('error_juego', 'Error al cargar pregunta.');

  gameManager.iniciarDuelo(atacanteId, defensorId, pregunta, esDesempate);

  const at = gameManager.jugadores[atacanteId] || { id: atacanteId, nombre: 'Atacante', color: 'rojo' };
  const def = gameManager.jugadores[defensorId] || { id: defensorId, nombre: 'Defensor', color: 'azul' };

  io.emit('comenzar_duelo', {
    atacante: { id: at.id, nombre: at.nombre, color: at.color },
    defensor: { id: def.id, nombre: def.nombre, color: def.color },
    esDesempate,
    pregunta: {
      tipo: pregunta.tipo,
      categoria: pregunta.categoria,
      pregunta: pregunta.pregunta,
      opciones: pregunta.opciones
    }
  });

  const payloadMobile = {
    tipo: pregunta.tipo,
    anioMin: pregunta.anioMin || 1000,
    anioMax: pregunta.anioMax || 2026
  };

  io.to(atacanteId).emit('tu_turno_responder', payloadMobile);
  io.to(defensorId).emit('tu_turno_responder', payloadMobile);

  iniciarReloj(gameManager.configuracion.tiempoPorPregunta, () => {
    resolverYFinalizar();
  });
}

io.on('connection', (socket) => {
  socket.emit('info_servidor', { ip: IP_LOCAL, port: PORT });
  socket.emit('lobby_colores_disponibles', gameManager.obtenerColoresDisponibles());
  socket.emit('actualizacion_jugadores', Object.values(gameManager.jugadores));

  socket.on('guardar_configuracion', (cfg) => {
    gameManager.actualizarConfiguracion(cfg);
    Object.values(gameManager.jugadores).forEach(j => {
      io.to(j.id).emit('actualizar_comodines', j.comodines);
    });
  });

  socket.on('fijar_primer_turno', ({ colorOId }) => {
    gameManager.fijarPrimerJugador(colorOId);
    broadcastTurno();
  });

  // BOTÓN DEL HOST: TERMINAR JUEGO Y FORZAR REGRESO AL LOBBY
  socket.on('forzar_terminar_juego', () => {
    clearInterval(timerInterval);
    gameManager.cancelarDuelo();
    io.emit('juego_cancelado_por_host');
    broadcastTurno();
  });

  socket.on('pasar_turno', () => {
    const jugador = gameManager.jugadores[socket.id];
    if (!jugador) return;

    const atacante = gameManager.obtenerAtacanteEnTurno();
    if (atacante && atacante.id === socket.id) {
      gameManager.avanzarTurno();
      io.emit('alerta_comodin_publico', {
        mensaje: `⏩ ${jugador.nombre} (${jugador.color.toUpperCase()}) omitió su ataque y pasó el turno.`
      });
      broadcastTurno();
    }
  });

  socket.on('expulsar_jugador', ({ socketId }) => {
    const color = gameManager.removerJugador(socketId);
    if (color) {
      io.to(socketId).emit('fuiste_expulsado');
      io.emit('lobby_colores_disponibles', gameManager.obtenerColoresDisponibles());
      io.emit('actualizacion_jugadores', Object.values(gameManager.jugadores));
      broadcastTurno();
    }
  });

  socket.on('jugador_unirse', ({ nombre, color }) => {
    const res = gameManager.registrarJugador(socket.id, nombre, color);
    if (!res.exito) return socket.emit('error_registro', res.error);

    socket.emit('registro_exitoso', res.jugador);
    io.emit('lobby_colores_disponibles', gameManager.obtenerColoresDisponibles());
    io.emit('actualizacion_jugadores', Object.values(gameManager.jugadores));
    broadcastTurno();
  });

  socket.on('declarar_ataque', async ({ defensorColor, categoriaDeseada, usoComodinTema }) => {
    const atacante = gameManager.jugadores[socket.id];
    if (!atacante) return;
    const defensor = Object.values(gameManager.jugadores).find(j => j.color === defensorColor);
    if (!defensor) return socket.emit('error_juego', 'Defensor no encontrado.');

    let categoriaFinal = 'aleatorio';
    if (usoComodinTema) {
      const ok = gameManager.usarComodinTema(socket.id);
      if (ok) {
        categoriaFinal = categoriaDeseada || 'aleatorio';
        socket.emit('actualizar_comodines', atacante.comodines);
        io.emit('alerta_comodin_publico', {
          mensaje: `¡${atacante.nombre} gastó comodín de tema: ${categoriaFinal.toUpperCase()}!`
        });
      }
    }

    ejecutarDuelo(atacante.id, defensor.id, categoriaFinal, false);
  });

  socket.on('enviar_respuesta', ({ opcion }) => {
    const ok = gameManager.registrarRespuesta(socket.id, opcion);
    if (ok) {
      const j = gameManager.jugadores[socket.id];
      socket.emit('respuesta_confirmada', { opcion });
      io.emit('jugador_ha_respondido', { color: j ? j.color : 'gris' });

      // Si ambos respondieron, corte inmediato sin esperar el reloj
      if (gameManager.ambosRespondieron()) {
        resolverYFinalizar();
      }
    }
  });

  socket.on('usar_martillo', () => {
    const res = gameManager.usarMartillo(socket.id);
    if (res) {
      const j = gameManager.jugadores[socket.id];
      socket.emit('efecto_martillo_privado', res);
      socket.emit('actualizar_comodines', res.restantes);
      io.emit('alerta_comodin_publico', { mensaje: `¡${j.nombre} (${j.color.toUpperCase()}) usó el Martillo!` });
    }
  });

  socket.on('usar_loro', () => {
    const res = gameManager.usarLoro(socket.id);
    if (res) {
      const j = gameManager.jugadores[socket.id];
      socket.emit('efecto_loro_privado', res);
      socket.emit('actualizar_comodines', res.restantes);
      io.emit('alerta_comodin_publico', { mensaje: `¡${j.nombre} (${j.color.toUpperCase()}) consultó al Loro!` });
    }
  });

  socket.on('disconnect', () => {
    const color = gameManager.removerJugador(socket.id);
    if (color) {
      io.emit('lobby_colores_disponibles', gameManager.obtenerColoresDisponibles());
      io.emit('actualizacion_jugadores', Object.values(gameManager.jugadores));
      
      // Si el desconectado estaba en duelo, resolver inmediatamente para que no se quede colgado
      if (gameManager.estado !== 'LOBBY' && (socket.id === gameManager.dueloActual.atacanteId || socket.id === gameManager.dueloActual.defensorId)) {
        resolverYFinalizar();
      } else {
        broadcastTurno();
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Risk Trivia online en: http://${IP_LOCAL}:${PORT}`);
});