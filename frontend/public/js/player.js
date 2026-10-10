const socket = io();

let miJugador = null;
let yaVoto = false;

const screenReg = document.getElementById('screen-reg');
const screenWait = document.getElementById('screen-wait');
const screenAttack = document.getElementById('screen-attack');
const screenBattle = document.getElementById('screen-battle');
const userBar = document.getElementById('user-bar');
const parrotBox = document.getElementById('parrot-box');
const txtStatus = document.getElementById('txt-status');

// Colores disponibles
socket.on('lobby_colores_disponibles', (disp) => {
  document.querySelectorAll('.btn-color').forEach(btn => {
    btn.disabled = !disp.includes(btn.dataset.color);
  });
});

document.querySelectorAll('.btn-color').forEach(btn => {
  btn.addEventListener('click', () => {
    const nombre = document.getElementById('in-name').value.trim();
    const color = btn.dataset.color;
    if (!nombre) return alert('Por favor escribe tu nombre.');
    socket.emit('jugador_unirse', { nombre, color });
  });
});

socket.on('registro_exitoso', (j) => {
  miJugador = j;
  screenReg.classList.add('hidden');
  screenWait.classList.remove('hidden');

  userBar.classList.remove('hidden');
  userBar.style.backgroundColor = `var(--${j.color})`;
  userBar.style.color = (j.color === 'amarillo') ? '#000' : '#fff';
  document.getElementById('txt-name').textContent = j.nombre;
  document.getElementById('txt-color').textContent = j.color.toUpperCase();
});

socket.on('fuiste_expulsado', () => {
  alert('Has sido expulsado de la sala por el Host.');
  location.reload();
});

// Turno de ataque
socket.on('turno_actualizado', ({ atacanteId, config, jugadores }) => {
  if (!miJugador) return;

  if (socket.id === atacanteId) {
    screenWait.classList.add('hidden');
    screenBattle.classList.add('hidden');
    screenAttack.classList.remove('hidden');

    // Llenar rivales
    const selRival = document.getElementById('sel-rival');
    selRival.innerHTML = '';
    jugadores.filter(j => j.id !== socket.id).forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.color;
      opt.textContent = `${r.nombre} (${r.color.toUpperCase()})`;
      selRival.appendChild(opt);
    });

    // Mostrar u ocultar selector de categoría según configuración del Host
    const boxCat = document.getElementById('box-cat-select');
    if (config.modoCategoria === 'aleatorio') {
      boxCat.style.display = 'none';
    } else {
      boxCat.style.display = 'block';
    }
  } else {
    screenAttack.classList.add('hidden');
    screenBattle.classList.add('hidden');
    screenWait.classList.remove('hidden');
  }
});

// Lanzar invasión
document.getElementById('btn-atacar').addEventListener('click', () => {
  const defensorColor = document.getElementById('sel-rival').value;
  const categoria = document.getElementById('sel-cat').value;
  if (!defensorColor) return alert('Debes elegir a quién atacar.');
  socket.emit('declarar_ataque', { defensorColor, categoria });
});

// Ronda de combate activa
socket.on('tu_turno_responder', () => {
  yaVoto = false;
  screenWait.classList.add('hidden');
  screenAttack.classList.add('hidden');
  screenBattle.classList.remove('hidden');

  parrotBox.style.display = 'none';
  txtStatus.textContent = '';

  document.querySelectorAll('.btn-opt').forEach(btn => {
    btn.disabled = false;
    btn.classList.remove('selected');
  });

  // Comodines
  document.getElementById('cnt-m').textContent = miJugador.comodines.martillo;
  document.getElementById('cnt-l').textContent = miJugador.comodines.loro;
  document.getElementById('btn-martillo').disabled = miJugador.comodines.martillo <= 0;
  document.getElementById('btn-loro').disabled = miJugador.comodines.loro <= 0;
});

// Votar
document.querySelectorAll('.btn-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    if (yaVoto) return;
    const opcion = btn.dataset.opt;
    socket.emit('enviar_respuesta', { opcion });
  });
});

socket.on('respuesta_confirmada', ({ opcion }) => {
  yaVoto = true;
  document.querySelectorAll('.btn-opt').forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.opt === opcion) btn.classList.add('selected');
  });
  document.getElementById('btn-martillo').disabled = true;
  document.getElementById('btn-loro').disabled = true;
  txtStatus.textContent = `Elección [ ${opcion} ] enviada.`;
});

// Martillo
document.getElementById('btn-martillo').addEventListener('click', () => {
  if (yaVoto) return;
  socket.emit('usar_martillo');
});

socket.on('efecto_martillo_privado', ({ descartadas, restantes }) => {
  miJugador.comodines.martillo = restantes;
  document.getElementById('cnt-m').textContent = restantes;
  document.getElementById('btn-martillo').disabled = true;
  descartadas.forEach(opt => {
    const el = document.querySelector(`.btn-opt[data-opt="${opt}"]`);
    if (el) el.disabled = true;
  });
});

// Loro
document.getElementById('btn-loro').addEventListener('click', () => {
  if (yaVoto) return;
  socket.emit('usar_loro');
});

socket.on('efecto_loro_privado', ({ porcentajes, restantes }) => {
  miJugador.comodines.loro = restantes;
  document.getElementById('cnt-l').textContent = restantes;
  document.getElementById('btn-loro').disabled = true;
  parrotBox.innerHTML = `🦜 <strong>Consejo del Loro:</strong><br>` +
    Object.entries(porcentajes).map(([o, v]) => `<strong>${o}:</strong> ${v}%`).join(' | ');
  parrotBox.style.display = 'block';
});

socket.on('fin_duelo', () => {
  setTimeout(() => {
    screenBattle.classList.add('hidden');
    screenWait.classList.remove('hidden');
  }, 4500);
});