const socket = io();

const viewLobby = document.getElementById('view-lobby');
const viewBattle = document.getElementById('view-battle');
const bannerAlert = document.getElementById('banner-alert');
const lobbyPlayers = document.getElementById('lobby-players');
const selPrimerTurno = document.getElementById('cfg-primer-turno');

socket.on('info_servidor', ({ ip, port }) => {
  const fullUrl = `http://${ip}:${port}/player.html`;
  document.getElementById('url-text').textContent = fullUrl;
  document.getElementById('qr-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(fullUrl)}`;
});

// Guardar ajustes de la partida
document.getElementById('btn-aplicar-cfg').addEventListener('click', () => {
  const cfg = {
    comodinesHabilitados: document.getElementById('cfg-comodines-on').value === 'true',
    martillos: document.getElementById('cfg-cant-comodines').value,
    loros: document.getElementById('cfg-cant-comodines').value,
    tiempo: document.getElementById('cfg-tiempo').value,
    modoCategoria: document.getElementById('cfg-modo-cat').value
  };
  socket.emit('guardar_configuracion', cfg);

  const primerTurno = selPrimerTurno.value;
  socket.emit('fijar_primer_turno', { colorOId: primerTurno });
  mostrarAlerta('Ajustes guardados correctamente.');
});

// Renderizar jugadores y dropdown de quién empieza
socket.on('actualizacion_jugadores', (jugadores) => {
  lobbyPlayers.innerHTML = '';
  selPrimerTurno.innerHTML = '<option value="aleatorio">Aleatorio</option>';

  if (jugadores.length === 0) {
    lobbyPlayers.innerHTML = '<p style="color:#64748b;">Esperando conexiones de jugadores...</p>';
    return;
  }

  jugadores.forEach(j => {
    // Card en pantalla
    const tag = document.createElement('div');
    tag.className = 'player-tag';
    tag.style.backgroundColor = `var(--${j.color})`;
    tag.style.color = (j.color === 'amarillo') ? '#000' : '#fff';
    tag.innerHTML = `
      <span>${j.nombre} (${j.color.toUpperCase()})</span>
      <button class="btn-kick" title="Expulsar jugador" onclick="expulsarJugador('${j.id}')">×</button>
    `;
    lobbyPlayers.appendChild(tag);

    // Opción en el select del Host
    const opt = document.createElement('option');
    opt.value = j.color;
    opt.textContent = `${j.nombre} (${j.color.toUpperCase()})`;
    selPrimerTurno.appendChild(opt);
  });
});

window.expulsarJugador = function(socketId) {
  if (confirm('¿Expulsar a este jugador de la partida?')) {
    socket.emit('expulsar_jugador', { socketId });
  }
};

socket.on('turno_actualizado', ({ atacanteNombre, atacanteColor }) => {
  const status = document.getElementById('lobby-status');
  if (atacanteNombre) {
    status.textContent = `🎯 Turno de Ataque: ${atacanteNombre} (${atacanteColor.toUpperCase()}). Declara tu invasión desde el móvil.`;
  }
});

// Combate activo
socket.on('comenzar_duelo', (datos) => {
  viewLobby.classList.add('hidden');
  viewBattle.classList.remove('hidden');

  ['A', 'B', 'C', 'D'].forEach(opt => {
    const el = document.getElementById(`box-${opt}`);
    el.className = 'wood-option';
    el.style.background = '';
  });

  // Paneles de combatientes
  const pAt = document.getElementById('panel-at');
  pAt.style.borderColor = `var(--${datos.atacante.color})`;
  document.getElementById('name-at').textContent = datos.atacante.nombre;
  document.getElementById('name-at').style.color = `var(--${datos.atacante.color})`;

  const pDef = document.getElementById('panel-def');
  pDef.style.borderColor = `var(--${datos.defensor.color})`;
  document.getElementById('name-def').textContent = datos.defensor.nombre;
  document.getElementById('name-def').style.color = `var(--${datos.defensor.color})`;

  // Pregunta
  document.getElementById('question-text').textContent = datos.pregunta.pregunta;
  document.getElementById('lbl-A').textContent = datos.pregunta.opciones.A;
  document.getElementById('lbl-B').textContent = datos.pregunta.opciones.B;
  document.getElementById('lbl-C').textContent = datos.pregunta.opciones.C;
  document.getElementById('lbl-D').textContent = datos.pregunta.opciones.D;
});

socket.on('tick_tiempo', (t) => {
  document.getElementById('timer-badge').textContent = `${t}s`;
});

socket.on('alerta_comodin_publico', ({ mensaje }) => {
  mostrarAlerta(mensaje);
});

socket.on('alerta_desempate', (msg) => {
  mostrarAlerta(msg);
});

socket.on('fin_duelo', ({ correcta, atacante, defensor, requiereDesempate }) => {
  // Pintar con los colores seleccionados
  if (atacante.resp && defensor.resp && atacante.resp === defensor.resp) {
    const el = document.getElementById(`box-${atacante.resp}`);
    el.style.background = `linear-gradient(90deg, var(--${atacante.color}) 50%, var(--${defensor.color}) 50%)`;
    el.style.color = '#fff';
  } else {
    if (atacante.resp) {
      document.getElementById(`box-${atacante.resp}`).classList.add(`voted-${atacante.color}`);
    }
    if (defensor.resp) {
      document.getElementById(`box-${defensor.resp}`).classList.add(`voted-${defensor.color}`);
    }
  }

  // Resaltar la respuesta correcta con dorado
  document.getElementById(`box-${correcta}`).classList.add('gold-correct');

  if (!requiereDesempate) {
    setTimeout(() => {
      viewBattle.classList.add('hidden');
      viewLobby.classList.remove('hidden');
    }, 5000);
  }
});

function mostrarAlerta(msg) {
  bannerAlert.textContent = msg;
  bannerAlert.style.display = 'block';
  setTimeout(() => bannerAlert.style.display = 'none', 3500);
}