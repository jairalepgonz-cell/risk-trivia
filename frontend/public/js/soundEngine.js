// =========================================================================
// MOTOR DE SONIDO SINTETIZADO (WEB AUDIO API) - CONFIGURABLE SIN ARCHIVOS EXTERNOS
// =========================================================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    const saved = localStorage.getItem('risk_trivia_sound');
    this.enabled = saved !== null ? saved === 'true' : true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggle(state) {
    this.enabled = state !== undefined ? Boolean(state) : !this.enabled;
    localStorage.setItem('risk_trivia_sound', String(this.enabled));
    if (this.enabled) this.play('select');
    return this.enabled;
  }

  tone(freq, duration = 0.12, type = 'sine', delay = 0, vol = 0.12) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const start = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(vol, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    } catch (e) {}
  }

  play(effect) {
    if (!this.enabled) return;
    switch (effect) {
      case 'select': // Selección de territorio o botón
        this.tone(520, 0.08, 'triangle', 0, 0.1);
        this.tone(680, 0.09, 'triangle', 0.05, 0.1);
        break;
      case 'tick': // Reloj en peligro
        this.tone(480, 0.06, 'sine', 0, 0.08);
        break;
      case 'wheel': // Giro de ruleta de categorías TV
        [380, 440, 520, 587, 659, 784].forEach((f, i) => {
          this.tone(f, 0.07, 'triangle', i * 0.055, 0.09);
        });
        break;
      case 'attack': // Declaración de ataque / tambores de guerra
        this.tone(220, 0.18, 'sawtooth', 0, 0.14);
        this.tone(277, 0.18, 'sawtooth', 0.14, 0.14);
        this.tone(330, 0.25, 'sawtooth', 0.28, 0.16);
        this.tone(440, 0.35, 'triangle', 0.44, 0.18);
        break;
      case 'defense': // Escudo / Defensa exitosa
        this.tone(330, 0.15, 'triangle', 0, 0.14);
        this.tone(494, 0.2, 'triangle', 0.12, 0.15);
        this.tone(659, 0.3, 'sine', 0.24, 0.15);
        break;
      case 'correct': // Respuesta correcta
        this.tone(523.25, 0.12, 'triangle', 0, 0.14);
        this.tone(659.25, 0.12, 'triangle', 0.1, 0.14);
        this.tone(783.99, 0.25, 'triangle', 0.2, 0.16);
        break;
      case 'wrong': // Respuesta incorrecta
        this.tone(310, 0.18, 'sawtooth', 0, 0.12);
        this.tone(230, 0.3, 'sawtooth', 0.16, 0.14);
        break;
      case 'conquest': // Conquista de territorio
        this.tone(440, 0.14, 'triangle', 0, 0.15);
        this.tone(554.37, 0.14, 'triangle', 0.12, 0.15);
        this.tone(659.25, 0.14, 'triangle', 0.24, 0.15);
        this.tone(880, 0.45, 'triangle', 0.36, 0.18);
        break;
      case 'comodin': // Activación de comodín
        this.tone(587.33, 0.09, 'sine', 0, 0.12);
        this.tone(783.99, 0.09, 'sine', 0.08, 0.12);
        this.tone(1046.5, 0.22, 'triangle', 0.16, 0.14);
        break;
      case 'hammer': // Golpe de martillo
        this.tone(140, 0.22, 'sawtooth', 0, 0.2);
        this.tone(95, 0.28, 'square', 0.05, 0.18);
        break;
      case 'victory': // Victoria de partida
        [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) => {
          this.tone(f, i === 5 ? 0.55 : 0.16, 'triangle', i * 0.14, 0.16);
        });
        break;
      case 'defeat': // Derrota
        [392, 349.23, 329.63, 261.63].forEach((f, i) => {
          this.tone(f, 0.25, 'sawtooth', i * 0.18, 0.12);
        });
        break;
      default:
        this.tone(600, 0.08);
    }
  }
}

window.soundFX = new SoundEngine();
