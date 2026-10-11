const COLORES = ['rojo', 'azul', 'amarillo', 'verde', 'negro'];

class GameManager {
  constructor() {
    this.estado = 'LOBBY';
    this.jugadores = {};
    this.ordenTurnos = [];
    this.indiceTurnoActual = 0;
    this.preguntasUsadasIds = [];

    this.configuracion = {
      comodinesHabilitados: true,
      martillosPorJugador: 3,
      lorosPorJugador: 3,
      temasPorJugador: 3,
      tiempoPorPregunta: 20
    };

    this.dueloActual = {
      atacanteId: null,
      defensorId: null,
      pregunta: null,
      esDesempate: false
    };
    this.tiempoInicioPregunta = null;
  }

  obtenerColoresDisponibles() {
    const ocupados = Object.values(this.jugadores).map(j => j.color);
    return COLORES.filter(c => !ocupados.includes(c));
  }

  registrarJugador(socketId, nombre, color) {
    if (!COLORES.includes(color)) return { exito: false, error: 'Color no válido.' };
    if (Object.values(this.jugadores).some(j => j.color === color)) {
      return { exito: false, error: 'Color ocupado.' };
    }

    const c = this.configuracion.comodinesHabilitados ? (this.configuracion.martillosPorJugador || 3) : 0;

    this.jugadores[socketId] = {
      id: socketId,
      nombre: nombre.trim() || `Comandante ${color.toUpperCase()}`,
      color: color,
      comodines: { martillo: c, loro: c, tema: c },
      respuesta: null,
      tiempoRespuesta: null
    };

    if (!this.ordenTurnos.includes(socketId)) this.ordenTurnos.push(socketId);
    return { exito: true, jugador: this.jugadores[socketId] };
  }

  removerJugador(socketId) {
    if (this.jugadores[socketId]) {
      const color = this.jugadores[socketId].color;
      delete this.jugadores[socketId];
      this.ordenTurnos = this.ordenTurnos.filter(id => id !== socketId);
      if (this.indiceTurnoActual >= this.ordenTurnos.length) this.indiceTurnoActual = 0;
      return color;
    }
    return null;
  }

  actualizarConfiguracion(cfg) {
    this.configuracion.comodinesHabilitados = cfg.comodinesHabilitados ?? true;
    const c = parseInt(cfg.cantComodines) || 3;
    this.configuracion.martillosPorJugador = c;
    this.configuracion.lorosPorJugador = c;
    this.configuracion.temasPorJugador = c;
    this.configuracion.tiempoPorPregunta = parseInt(cfg.tiempo) || 20;

    Object.values(this.jugadores).forEach(j => {
      j.comodines = {
        martillo: this.configuracion.comodinesHabilitados ? c : 0,
        loro: this.configuracion.comodinesHabilitados ? c : 0,
        tema: this.configuracion.comodinesHabilitados ? c : 0
      };
    });
  }

  fijarPrimerJugador(colorOId) {
    if (colorOId === 'aleatorio') {
      this.indiceTurnoActual = Math.floor(Math.random() * this.ordenTurnos.length);
      return;
    }
    const idx = this.ordenTurnos.findIndex(id => this.jugadores[id]?.color === colorOId || id === colorOId);
    if (idx !== -1) this.indiceTurnoActual = idx;
  }

  obtenerAtacanteEnTurno() {
    if (this.ordenTurnos.length === 0) return null;
    return this.jugadores[this.ordenTurnos[this.indiceTurnoActual]] || null;
  }

  avanzarTurno() {
    if (this.ordenTurnos.length === 0) return;
    this.indiceTurnoActual = (this.indiceTurnoActual + 1) % this.ordenTurnos.length;
  }

  cancelarDuelo() {
    this.estado = 'LOBBY';
    this.dueloActual = { atacanteId: null, defensorId: null, pregunta: null, esDesempate: false };
    this.tiempoInicioPregunta = null;
  }

  usarComodinTema(socketId) {
    const j = this.jugadores[socketId];
    if (!j || !this.configuracion.comodinesHabilitados) return false;
    if (j.comodines.tema <= 0) return false;
    j.comodines.tema--;
    return true;
  }

  usarMartillo(socketId) {
    const j = this.jugadores[socketId];
    if (this.dueloActual.pregunta?.tipo === 'aproximacion') return null;
    if (!j || j.comodines.martillo <= 0) return null;

    j.comodines.martillo--;
    const incorrectas = ['A', 'B', 'C', 'D'].filter(o => o !== this.dueloActual.pregunta.correcta);
    const descartadas = incorrectas.sort(() => 0.5 - Math.random()).slice(0, 2);

    return { descartadas, restantes: j.comodines };
  }

  usarLoro(socketId) {
    const j = this.jugadores[socketId];
    if (!j || j.comodines.loro <= 0 || !this.dueloActual.pregunta) return null;

    j.comodines.loro--;
    const preg = this.dueloActual.pregunta;

    if (preg.tipo === 'aproximacion') {
      const anio = parseInt(preg.correcta);
      const margen = Math.max(3, Math.round(anio * 0.15));
      return {
        tipo: 'aproximacion',
        pista: `Mis plumas me dicen: ¡Entre ${Math.max(0, anio - margen)} y ${anio + margen}!`,
        restantes: j.comodines
      };
    } else {
      const correcta = preg.correcta;
      const pct = Math.floor(Math.random() * 20) + 65;
      const resto = 100 - pct;

      const porcentajes = { A: 0, B: 0, C: 0, D: 0 };
      porcentajes[correcta] = pct;
      const inc = ['A', 'B', 'C', 'D'].filter(o => o !== correcta);
      porcentajes[inc[0]] = Math.floor(resto * 0.55);
      porcentajes[inc[1]] = Math.floor(resto * 0.30);
      porcentajes[inc[2]] = resto - porcentajes[inc[0]] - porcentajes[inc[1]];

      return {
        tipo: 'opcion_multiple',
        porcentajes,
        restantes: j.comodines
      };
    }
  }

  iniciarDuelo(atacanteId, defensorId, pregunta, esDesempate = false) {
    this.estado = esDesempate ? 'DESEMPATE' : 'DUELO';
    this.dueloActual = { atacanteId, defensorId, pregunta, esDesempate };
    this.tiempoInicioPregunta = Date.now();

    if (pregunta.id && typeof pregunta.id === 'number') {
      this.preguntasUsadasIds.push(pregunta.id);
    }

    if (this.jugadores[atacanteId]) {
      this.jugadores[atacanteId].respuesta = null;
      this.jugadores[atacanteId].tiempoRespuesta = null;
    }
    if (this.jugadores[defensorId]) {
      this.jugadores[defensorId].respuesta = null;
      this.jugadores[defensorId].tiempoRespuesta = null;
    }
  }

  registrarRespuesta(socketId, valor) {
    const j = this.jugadores[socketId];
    if (!j) return false;
    if (socketId !== this.dueloActual.atacanteId && socketId !== this.dueloActual.defensorId) return false;
    if (j.respuesta !== null) return false;

    j.respuesta = valor;
    j.tiempoRespuesta = Date.now() - this.tiempoInicioPregunta;
    return true;
  }

  ambosRespondieron() {
    const at = this.jugadores[this.dueloActual.atacanteId];
    const def = this.jugadores[this.dueloActual.defensorId];
    const atListo = !at || at.respuesta !== null;
    const defListo = !def || def.respuesta !== null;
    return atListo && defListo;
  }

  resolverDuelo() {
    // Si un jugador desconectó el teléfono, se usa un fallback seguro para evitar excepciones
    const at = this.jugadores[this.dueloActual.atacanteId] || {
      id: this.dueloActual.atacanteId, nombre: 'Atacante (Desconectado)', color: 'rojo', respuesta: null, tiempoRespuesta: 99999
    };
    const def = this.jugadores[this.dueloActual.defensorId] || {
      id: this.dueloActual.defensorId, nombre: 'Defensor (Desconectado)', color: 'azul', respuesta: null, tiempoRespuesta: 99999
    };
    const preg = this.dueloActual.pregunta || { tipo: 'opcion_multiple', correcta: 'A' };

    if (preg.tipo === 'aproximacion') {
      const target = parseInt(preg.correcta) || 0;
      const respAtNum = (at.respuesta !== null && !isNaN(parseInt(at.respuesta))) ? parseInt(at.respuesta) : null;
      const respDefNum = (def.respuesta !== null && !isNaN(parseInt(def.respuesta))) ? parseInt(def.respuesta) : null;

      const diffAt = respAtNum !== null ? Math.abs(target - respAtNum) : 99999;
      const diffDef = respDefNum !== null ? Math.abs(target - respDefNum) : 99999;

      let ganador = null;
      let motivo = '';

      if (respAtNum === null && respDefNum === null) {
        motivo = 'Ninguno de los dos comandantes envió un número.';
      } else if (diffAt < diffDef) {
        ganador = at;
        motivo = `¡Más cerca del valor exacto (${target}) por ${diffDef === 99999 ? 'ausencia del rival' : (diffDef - diffAt) + ' unidades'}!`;
      } else if (diffDef < diffAt) {
        ganador = def;
        motivo = `¡Más cerca del valor exacto (${target}) por ${diffAt === 99999 ? 'ausencia del rival' : (diffAt - diffDef) + ' unidades'}!`;
      } else {
        // Empate exacto en número: define velocidad
        if ((at.tiempoRespuesta || 99999) < (def.tiempoRespuesta || 99999)) {
          ganador = at;
          motivo = `¡Misma distancia, pero respondió más rápido (${(at.tiempoRespuesta/1000).toFixed(2)}s vs ${(def.tiempoRespuesta/1000).toFixed(2)}s)!`;
        } else {
          ganador = def;
          motivo = `¡Misma distancia, pero respondió más rápido (${(def.tiempoRespuesta/1000).toFixed(2)}s vs ${(at.tiempoRespuesta/1000).toFixed(2)}s)!`;
        }
      }

      return {
        tipo: 'aproximacion',
        correcta: target,
        atacante: {
          id: at.id, nombre: at.nombre, color: at.color,
          resp: respAtNum, diff: diffAt === 99999 ? null : diffAt, tiempoMs: at.tiempoRespuesta || 0
        },
        defensor: {
          id: def.id, nombre: def.nombre, color: def.color,
          resp: respDefNum, diff: diffDef === 99999 ? null : diffDef, tiempoMs: def.tiempoRespuesta || 0
        },
        ganador: ganador ? { id: ganador.id, nombre: ganador.nombre, color: ganador.color } : null,
        motivo,
        requiereDesempate: false
      };
    } else {
      const correcta = preg.correcta;
      const atOk = at.respuesta === correcta;
      const defOk = def.respuesta === correcta;

      let ganador = null;
      let motivo = '';
      let requiereDesempate = false;

      if (atOk && !defOk) {
        ganador = at;
        motivo = `¡Acertó la respuesta correcta [${correcta}]!`;
      } else if (!atOk && defOk) {
        ganador = def;
        motivo = `¡Acertó la respuesta correcta [${correcta}]!`;
      } else if (atOk && defOk) {
        requiereDesempate = true;
        motivo = '¡Ambos acertaron! Pasando a desempate numérico de Diana...';
      } else {
        motivo = 'Ambos fallaron la trivia.';
      }

      return {
        tipo: 'opcion_multiple',
        correcta,
        atacante: {
          id: at.id, nombre: at.nombre, color: at.color,
          resp: at.respuesta, tiempoMs: at.tiempoRespuesta || 0, acerto: atOk
        },
        defensor: {
          id: def.id, nombre: def.nombre, color: def.color,
          resp: def.respuesta, tiempoMs: def.tiempoRespuesta || 0, acerto: defOk
        },
        ganador: ganador ? { id: ganador.id, nombre: ganador.nombre, color: ganador.color } : null,
        motivo,
        requiereDesempate
      };
    }
  }
}

module.exports = new GameManager();