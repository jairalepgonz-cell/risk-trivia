const {
  TERRITORIOS_CATALOGO,
  CONEXIONES_PARES,
  COMODINES_CATALOGO,
  TABLA_CANJE_ESTRELLAS_RISK
} = require('./database/catalogData');

const COLORES = ['rojo', 'azul', 'amarillo', 'verde', 'negro'];

class GameManager {
  constructor() {
    this.estado = 'LOBBY';
    this.jugadores = {};
    this.perfilesDesconectados = {};
    this.ordenTurnos = [];
    this.indiceTurnoActual = 0;
    this.rondaActual = 1;
    this.preguntasUsadasIds = [];
    this.categoriasRecientes = [];
    this.historialMovimientos = [];

    // Mazo de las 42 tarjetas oficiales de Risk con ★ 1 o ★★ 2 estrellas
    this.mazoTarjetasRisk = [];

    this.configuracion = {
      comodinesHabilitados: true,
      martillosPorJugador: 3,
      lorosPorJugador: 3,
      temasPorJugador: 3,
      tiempoPorPregunta: 20,
      puntosRespuestaCorrecta: 150,
      penalizacionRespuestaIncorrecta: 30,
      soldadosInicialesPorTerritorio: 1,
      refuerzosPorRonda: 3,
      maxAtaquesConsecutivos: 15,
      bajasPorDerrotaDefensor: 1,
      bajasPorDerrotaAtacante: 1,
      requiereVecindadParaAtacar: false, // Desactivado por defecto: se juega en el tablero físico de mesa
      permitirAtaquesConsecutivos: true,
      modoInicioTablero: 'tarjetas_estrellas', // 'tarjetas_estrellas' (Por suerte ★1/★★2), 'eleccion_mapa' (Elegir lugar), 'libre'
      modoMapa: 'risk',
      modoBancoPreguntas: 'mixto', // 'peru', 'mundo', 'mixto'
      modoSeleccionCategorias: 'tv_show',
      dificultadProgresiva: false,
      condicionVictoria: 'tablero_fisico',
      rondasMaximasPartida: 20,
      sonidosHabilitados: true,
      animacionesHabilitadas: true
    };

    this.catalogoComodines = {};
    COMODINES_CATALOGO.forEach(c => {
      this.catalogoComodines[c.codigo] = { ...c };
    });

    this.turnoEstado = {
      atacanteId: null,
      ataquesRealizados: 0,
      conquistasEnTurno: 0,
      ganaTarjetaEnEsteTurno: false,
      puedeSeguirAtacando: true
    };

    this.territorios = {};
    this.conexiones = {};
    this.inicializarEstructuraMapa();

    this.dueloActual = {
      atacanteId: null,
      defensorId: null,
      territorioOrigen: null,
      territorioObjetivo: null,
      pregunta: null,
      esDesempate: false,
      efectosAtacante: {},
      efectosDefensor: {}
    };

    this.tiempoInicioPregunta = null;
  }

  cargarDesdeBaseDeDatos(configMapa = {}, listaComodines = []) {
    Object.assign(this.configuracion, configMapa);
    // Garantizar que el tablero físico nunca bloquee ataques por vecindad digital a menos que se fuerce explícitamente
    if (configMapa.requiereVecindadParaAtacar === undefined) {
      this.configuracion.requiereVecindadParaAtacar = false;
    }
    if (listaComodines && listaComodines.length > 0) {
      this.catalogoComodines = {};
      listaComodines.forEach(c => {
        this.catalogoComodines[c.codigo] = { ...c };
      });
    }
    this.inicializarEstructuraMapa();
  }

  inicializarMazoTarjetasRisk() {
    this.mazoTarjetasRisk = TERRITORIOS_CATALOGO.map(t => ({
      codigo: t.codigo,
      nombre: t.nombre,
      continente: t.region_continente,
      estrellas: t.tropas_iniciales || 1, // ★ 1 estrella (1 soldado) o ★★ 2 estrellas (2 soldados)
      tipoUnidad: (t.tropas_iniciales === 2) ? 'Caballería / Artillería (★★ 2 soldados)' : 'Infantería (★ 1 soldado)'
    })).sort(() => Math.random() - 0.5);
  }

  robarTarjetaRisk() {
    if (this.mazoTarjetasRisk.length === 0) {
      this.inicializarMazoTarjetasRisk();
    }
    return this.mazoTarjetasRisk.pop();
  }

  inicializarEstructuraMapa() {
    this.territorios = {};
    this.conexiones = {};
    this.inicializarMazoTarjetasRisk();

    TERRITORIOS_CATALOGO.forEach(t => {
      const estrellas = t.tropas_iniciales || 1; // 1 o 2 estrellas en la tarjeta oficial de Risk
      this.territorios[t.codigo] = {
        codigo: t.codigo,
        nombre: t.nombre,
        mapa: 'risk',
        regionContinente: t.region_continente,
        centroX: t.centro_x,
        centroY: t.centro_y,
        estrellasTarjeta: estrellas, // ★ 1 o ★★ 2
        bonoRegion: t.bono_region || 3,
        propietarioId: null,
        propietarioNombre: 'Sin ocupar',
        propietarioColor: 'neutral',
        soldados: estrellas,
        escudoActivo: false,
        proteccionTurnos: 0,
        bajoAtaque: false,
        vecinos: []
      };
      this.conexiones[t.codigo] = [];
    });

    CONEXIONES_PARES.forEach(([a, b]) => {
      if (this.territorios[a] && this.territorios[b]) {
        if (!this.conexiones[a].includes(b)) this.conexiones[a].push(b);
        if (!this.conexiones[b].includes(a)) this.conexiones[b].push(a);
        this.territorios[a].vecinos = this.conexiones[a];
        this.territorios[b].vecinos = this.conexiones[b];
      }
    });

    this.repartirTerritoriosPorModo(this.configuracion.modoInicioTablero);
  }

  // =========================================================================
  // MODOS DE PREPARACIÓN DEL TABLERO FÍSICO DE RISK:
  // 1. 'tarjetas_estrellas': Reparte al azar las 42 tarjetas entre los jugadores;
  //    cada territorio recibe ★ 1 soldado o ★★ 2 soldados según las estrellas de su tarjeta.
  // 2. 'eleccion_mapa': Deja los 42 territorios listos para que cada jugador elija
  //    en qué lugar del mapa quiere estar (desde la pantalla o el celular).
  // =========================================================================
  repartirTerritoriosPorModo(modo = 'tarjetas_estrellas') {
    this.configuracion.modoInicioTablero = modo;
    const listaJugadores = Object.values(this.jugadores);
    const codigos = Object.keys(this.territorios);
    if (codigos.length === 0) return;

    if (modo === 'eleccion_mapa' || listaJugadores.length === 0) {
      // Todos los territorios quedan libres para ser elegidos por los jugadores
      codigos.forEach(cod => {
        const t = this.territorios[cod];
        t.propietarioId = null;
        t.propietarioNombre = 'Libre para elegir';
        t.propietarioColor = 'neutral';
        t.soldados = t.estrellasTarjeta || 1;
        t.escudoActivo = false;
        t.proteccionTurnos = 0;
        t.bajoAtaque = false;
      });
      this.recalcularEstadisticasTerritoriales();
      return;
    }

    // Modo 'tarjetas_estrellas': Barajar las 42 tarjetas de Risk por suerte
    const codigosBarajados = [...codigos].sort(() => Math.random() - 0.5);
    codigosBarajados.forEach((cod, idx) => {
      const jug = listaJugadores[idx % listaJugadores.length];
      const t = this.territorios[cod];
      t.propietarioId = jug.id;
      t.propietarioNombre = jug.nombre;
      t.propietarioColor = jug.color;
      // Soldados iniciales según las estrellas de la tarjeta de Risk (★ = 1 soldado, ★★ = 2 soldados)
      t.soldados = t.estrellasTarjeta || 1;
      t.escudoActivo = false;
      t.proteccionTurnos = 0;
      t.bajoAtaque = false;
    });

    this.recalcularEstadisticasTerritoriales();
    this.registrarMovimiento(
      'Mesa Host',
      'gold',
      'SORTEO_TARJETAS',
      null,
      null,
      `🎲 Se repartieron por suerte las 42 Tarjetas de Risk (con ★ 1 o ★★ 2 soldados por tarjeta) para colocar en el tablero físico.`
    );
  }

  // Permite elegir o cambiar el dueño y soldados de cualquier territorio del mapa clásico de Risk
  asignarTerritorioManual(territorioCodigo, colorJugador, soldados = null) {
    const t = this.territorios[territorioCodigo];
    if (!t) return { exito: false, error: 'Territorio no encontrado.' };

    if (!colorJugador || colorJugador === 'neutral') {
      t.propietarioId = null;
      t.propietarioNombre = 'Libre';
      t.propietarioColor = 'neutral';
      t.soldados = soldados !== null ? parseInt(soldados) : (t.estrellasTarjeta || 1);
    } else {
      const jug = Object.values(this.jugadores).find(j => j.color === colorJugador);
      t.propietarioId = jug ? jug.id : null;
      t.propietarioNombre = jug ? jug.nombre : `Ejército ${colorJugador.toUpperCase()}`;
      t.propietarioColor = colorJugador;
      if (soldados !== null && !isNaN(parseInt(soldados))) {
        t.soldados = Math.max(1, parseInt(soldados));
      } else if (t.soldados <= 0) {
        t.soldados = t.estrellasTarjeta || 1;
      }
    }

    this.recalcularEstadisticasTerritoriales();
    return { exito: true, territorio: t };
  }

  recalcularEstadisticasTerritoriales() {
    Object.values(this.jugadores).forEach(j => {
      const misTer = Object.values(this.territorios).filter(t => t.propietarioColor === j.color);
      j.territoriosCount = misTer.length;
      j.soldadosTotales = misTer.reduce((acc, t) => acc + t.soldados, 0);
      j.misTerritoriosIniciales = misTer.map(t => ({
        codigo: t.codigo,
        nombre: t.nombre,
        continente: t.regionContinente,
        estrellas: t.estrellasTarjeta,
        soldados: t.soldados
      }));
      misTer.forEach(t => {
        t.propietarioId = j.id;
        t.propietarioNombre = j.nombre;
      });
    });
  }

  construirInventarioInicialComodines() {
    const habilitados = this.configuracion.comodinesHabilitados !== false;
    const baseCant = parseInt(this.configuracion.martillosPorJugador) || 3;
    const inv = {};

    Object.values(this.catalogoComodines).forEach(com => {
      if (!habilitados || !com.activo) {
        inv[com.codigo] = 0;
      } else {
        inv[com.codigo] = com.cantidad_inicial ?? 2;
      }
    });

    inv.martillo = habilitados ? baseCant : 0;
    inv.loro = habilitados ? baseCant : 0;
    inv.tema = habilitados ? (this.configuracion.temasPorJugador || baseCant) : 0;
    inv.cambio_categoria = inv.tema;

    return inv;
  }

  obtenerColoresDisponibles() {
    const ocupados = Object.values(this.jugadores).map(j => j.color);
    return COLORES.filter(c => !ocupados.includes(c));
  }

  registrarJugador(socketId, nombre, color) {
    const nombreLimpio = (nombre || '').trim() || `Comandante ${String(color).toUpperCase()}`;

    const existenteMismoColor = Object.values(this.jugadores).find(j => j.color === color);
    if (existenteMismoColor) {
      if (existenteMismoColor.nombre.toLowerCase() === nombreLimpio.toLowerCase()) {
        const antiguoId = existenteMismoColor.id;
        delete this.jugadores[antiguoId];
        existenteMismoColor.id = socketId;
        existenteMismoColor.conectado = true;
        this.jugadores[socketId] = existenteMismoColor;
        this.ordenTurnos = this.ordenTurnos.map(id => (id === antiguoId ? socketId : id));
        if (this.turnoEstado.atacanteId === antiguoId) this.turnoEstado.atacanteId = socketId;
        if (this.dueloActual.atacanteId === antiguoId) this.dueloActual.atacanteId = socketId;
        if (this.dueloActual.defensorId === antiguoId) this.dueloActual.defensorId = socketId;
        this.recalcularEstadisticasTerritoriales();
        return { exito: true, jugador: existenteMismoColor, reconectado: true };
      }
      return { exito: false, error: 'Color ocupado por otro comandante.' };
    }

    if (!COLORES.includes(color)) return { exito: false, error: 'Color no válido.' };

    const previo = this.perfilesDesconectados[color];
    const inventario = previo ? previo.comodines : this.construirInventarioInicialComodines();

    this.jugadores[socketId] = {
      id: socketId,
      nombre: nombreLimpio,
      color: color,
      conectado: true,
      puntos: previo ? previo.puntos : 300,
      territoriosCount: 0,
      soldadosTotales: 0,
      conquistasPartida: previo ? previo.conquistasPartida : 0,
      defensasPartida: previo ? previo.defensasPartida : 0,
      aciertosPartida: previo ? previo.aciertosPartida : 0,
      comodinesUsadosPartida: previo ? previo.comodinesUsadosPartida : 0,
      tarjetasRisk: previo ? (previo.tarjetasRisk || []) : [],
      estrellasAcumuladas: previo ? (previo.estrellasAcumuladas || 0) : 0,
      misTerritoriosIniciales: [],
      comodines: inventario,
      respuesta: null,
      tiempoRespuesta: null,
      congelado: false,
      segundaOportunidadActiva: false
    };

    if (!this.ordenTurnos.includes(socketId)) {
      this.ordenTurnos.push(socketId);
    }

    const tieneTerritorios = Object.values(this.territorios).some(t => t.propietarioColor === color);
    if (!tieneTerritorios && this.configuracion.modoInicioTablero === 'tarjetas_estrellas') {
      this.repartirTerritoriosPorModo('tarjetas_estrellas');
    } else {
      this.recalcularEstadisticasTerritoriales();
    }

    if (!this.turnoEstado.atacanteId && this.ordenTurnos.length > 0) {
      this.iniciarTurnoJugador(this.ordenTurnos[this.indiceTurnoActual]);
    }

    return { exito: true, jugador: this.jugadores[socketId], reconectado: !!previo };
  }

  removerJugador(socketId, esExpulsion = false) {
    const j = this.jugadores[socketId];
    if (!j) return null;

    const color = j.color;
    if (!esExpulsion) {
      this.perfilesDesconectados[color] = { ...j };
    } else {
      delete this.perfilesDesconectados[color];
    }

    delete this.jugadores[socketId];
    this.ordenTurnos = this.ordenTurnos.filter(id => id !== socketId);

    if (esExpulsion && this.configuracion.modoInicioTablero === 'tarjetas_estrellas') {
      this.repartirTerritoriosPorModo('tarjetas_estrellas');
    }

    if (this.indiceTurnoActual >= this.ordenTurnos.length) {
      this.indiceTurnoActual = 0;
    }

    if (this.turnoEstado.atacanteId === socketId) {
      const nuevoAtacante = this.obtenerAtacanteEnTurno();
      this.turnoEstado.atacanteId = nuevoAtacante ? nuevoAtacante.id : null;
      this.turnoEstado.ataquesRealizados = 0;
    }

    return color;
  }

  actualizarConfiguracion(cfg = {}) {
    if (cfg.comodinesHabilitados !== undefined) {
      this.configuracion.comodinesHabilitados = cfg.comodinesHabilitados === true || cfg.comodinesHabilitados === 'true';
    }
    if (cfg.cantComodines !== undefined || cfg.martillos !== undefined) {
      const c = parseInt(cfg.cantComodines ?? cfg.martillos) || 3;
      this.configuracion.martillosPorJugador = c;
      this.configuracion.lorosPorJugador = c;
      this.configuracion.temasPorJugador = c;
    }
    if (cfg.tiempo !== undefined || cfg.tiempoPorPregunta !== undefined) {
      this.configuracion.tiempoPorPregunta = Math.max(5, parseInt(cfg.tiempo ?? cfg.tiempoPorPregunta) || 20);
    }
    if (cfg.maxAtaquesConsecutivos !== undefined) {
      this.configuracion.maxAtaquesConsecutivos = Math.max(1, parseInt(cfg.maxAtaquesConsecutivos) || 15);
    }
    if (cfg.modoBancoPreguntas !== undefined) {
      this.configuracion.modoBancoPreguntas = cfg.modoBancoPreguntas;
    }
    if (cfg.modoInicioTablero !== undefined && cfg.modoInicioTablero !== this.configuracion.modoInicioTablero) {
      this.repartirTerritoriosPorModo(cfg.modoInicioTablero);
    }

    Object.values(this.jugadores).forEach(j => {
      j.comodines = this.construirInventarioInicialComodines();
    });
  }

  fijarPrimerJugador(colorOId) {
    if (this.ordenTurnos.length === 0) return;
    if (colorOId === 'aleatorio') {
      this.indiceTurnoActual = Math.floor(Math.random() * this.ordenTurnos.length);
    } else {
      const idx = this.ordenTurnos.findIndex(id => this.jugadores[id]?.color === colorOId || id === colorOId);
      if (idx !== -1) this.indiceTurnoActual = idx;
    }
    this.iniciarTurnoJugador(this.ordenTurnos[this.indiceTurnoActual]);
  }

  iniciarTurnoJugador(jugadorId) {
    const j = this.jugadores[jugadorId];
    if (!j) return;

    this.turnoEstado = {
      atacanteId: jugadorId,
      ataquesRealizados: 0,
      conquistasEnTurno: 0,
      ganaTarjetaEnEsteTurno: false,
      puedeSeguirAtacando: true
    };

    Object.values(this.territorios).forEach(t => {
      t.bajoAtaque = false;
    });

    this.recalcularEstadisticasTerritoriales();
  }

  obtenerAtacanteEnTurno() {
    if (this.ordenTurnos.length === 0) return null;
    const id = this.ordenTurnos[this.indiceTurnoActual];
    return this.jugadores[id] || null;
  }

  avanzarTurno() {
    if (this.ordenTurnos.length === 0) return;
    this.indiceTurnoActual = (this.indiceTurnoActual + 1) % this.ordenTurnos.length;
    if (this.indiceTurnoActual === 0) {
      this.rondaActual++;
    }
    const sigId = this.ordenTurnos[this.indiceTurnoActual];
    this.iniciarTurnoJugador(sigId);
    this.estado = 'LOBBY';
  }

  cancelarDuelo() {
    this.estado = 'LOBBY';
    Object.values(this.territorios).forEach(t => { t.bajoAtaque = false; });
    this.dueloActual = {
      atacanteId: null,
      defensorId: null,
      territorioOrigen: null,
      territorioObjetivo: null,
      pregunta: null,
      esDesempate: false,
      efectosAtacante: {},
      efectosDefensor: {}
    };
    this.tiempoInicioPregunta = null;
  }

  // =========================================================================
  // CANJE DE ESTRELLAS DE TARJETAS RISK POR SOLDADOS EN EL TABLERO FÍSICO
  // =========================================================================
  canjearEstrellasRisk(socketId) {
    const j = this.jugadores[socketId];
    if (!j) return { exito: false, error: 'Jugador no encontrado.' };
    const estrellas = j.estrellasAcumuladas || 0;
    if (estrellas < 2) {
      return { exito: false, error: 'Necesitas al menos 2 estrellas (★★) para canjear por soldados en el tablero físico.' };
    }

    const usarEstrellas = Math.min(10, estrellas);
    const soldadosGanados = TABLA_CANJE_ESTRELLAS_RISK[usarEstrellas] || (usarEstrellas * 3);

    j.estrellasAcumuladas = Math.max(0, estrellas - usarEstrellas);
    j.tarjetasRisk = [];

    const msg = `⭐ ¡${j.nombre} (${j.color.toUpperCase()}) canjeó ${usarEstrellas} estrellas de Tarjetas Risk por +${soldadosGanados} SOLDADOS para colocar en el tablero físico!`;
    this.registrarMovimiento(j.nombre, j.color, 'CANJE_ESTRELLAS', null, null, msg);

    return {
      exito: true,
      estrellasCanjeadas: usarEstrellas,
      soldadosGanados,
      estrellasRestantes: j.estrellasAcumuladas,
      tarjetasRisk: j.tarjetasRisk,
      mensajePublico: msg
    };
  }

  robarTarjetaManual(socketId) {
    const j = this.jugadores[socketId];
    if (!j) return { exito: false, error: 'Jugador no encontrado.' };
    const tarjeta = this.robarTarjetaRisk();
    j.tarjetasRisk = j.tarjetasRisk || [];
    j.tarjetasRisk.push(tarjeta);
    j.estrellasAcumuladas = (j.estrellasAcumuladas || 0) + tarjeta.estrellas;

    const strEstrellas = '★'.repeat(tarjeta.estrellas);
    const msg = `🃏 ${j.nombre} robó una Tarjeta Risk de conquista: ${tarjeta.nombre} (${strEstrellas}).`;
    this.registrarMovimiento(j.nombre, j.color, 'TARJETA_RISK', null, tarjeta.codigo, msg);

    return {
      exito: true,
      tarjeta,
      tarjetasRisk: j.tarjetasRisk,
      estrellasAcumuladas: j.estrellasAcumuladas,
      mensajePublico: msg
    };
  }

  // =========================================================================
  // PREPARAR ATAQUE (PENSADO PARA EL TABLERO FÍSICO DE RISK)
  // El jugador simplemente elige a qué color rival ataca en la mesa
  // (y opcionalmente qué país del mapa están disputando).
  // =========================================================================
  obtenerTerritoriosAtacablesPorJugador(jugadorColor) {
    return Object.values(this.territorios)
      .filter(t => t.propietarioColor !== jugadorColor)
      .map(t => t.codigo);
  }

  prepararAtaqueTerritorial(atacanteId, datosAtaque = {}) {
    const atacante = this.jugadores[atacanteId];
    if (!atacante) return { exito: false, error: 'Atacante no registrado.' };

    let { territorioOrigen, territorioObjetivo, defensorColor } = datosAtaque;
    let terObj = territorioObjetivo ? this.territorios[territorioObjetivo] : null;
    let terOri = territorioOrigen ? this.territorios[territorioOrigen] : null;

    // Determinar el defensor principalmente por el color elegido en el celular
    let defensor = null;
    if (defensorColor) {
      defensor = Object.values(this.jugadores).find(j => j.color === defensorColor);
    }
    if (!defensor && terObj && terObj.propietarioColor && terObj.propietarioColor !== 'neutral') {
      defensor = Object.values(this.jugadores).find(j => j.color === terObj.propietarioColor);
    }
    if (!defensor) {
      defensor = Object.values(this.jugadores).find(j => j.id !== atacanteId);
    }
    if (!defensor) {
      return { exito: false, error: 'Se necesita al menos un jugador rival conectado para declarar un ataque.' };
    }

    if (terObj) {
      Object.values(this.territorios).forEach(t => { t.bajoAtaque = false; });
      terObj.bajoAtaque = true;
    }

    return {
      exito: true,
      atacante,
      defensor,
      territorioOrigen: terOri ? terOri.codigo : null,
      territorioObjetivo: terObj ? terObj.codigo : null,
      infoTerritorioOrigen: terOri || null,
      infoTerritorioObjetivo: terObj || null
    };
  }

  // =========================================================================
  // COMODINES
  // =========================================================================
  usarComodinTema(socketId) {
    const j = this.jugadores[socketId];
    if (!j || !this.configuracion.comodinesHabilitados) return false;
    const disp = j.comodines.tema ?? j.comodines.cambio_categoria ?? 0;
    if (disp <= 0) return false;
    j.comodines.tema = Math.max(0, disp - 1);
    j.comodines.cambio_categoria = j.comodines.tema;
    j.comodinesUsadosPartida = (j.comodinesUsadosPartida || 0) + 1;
    return true;
  }

  usarMartillo(socketId) {
    const j = this.jugadores[socketId];
    if (!j || !this.configuracion.comodinesHabilitados) return null;
    if (j.congelado) return { error: '❄️ ¡Estás congelado por el rival en este duelo!' };
    if (this.dueloActual.pregunta?.tipo === 'aproximacion') return null;
    if ((j.comodines.martillo || 0) <= 0 || !this.dueloActual.pregunta) return null;

    j.comodines.martillo--;
    j.comodinesUsadosPartida = (j.comodinesUsadosPartida || 0) + 1;

    const incorrectas = ['A', 'B', 'C', 'D'].filter(o => o !== this.dueloActual.pregunta.correcta);
    const descartadas = incorrectas.sort(() => 0.5 - Math.random()).slice(0, 2);

    return { descartadas, restantes: j.comodines, animacion: 'hammer-smash' };
  }

  usarLoro(socketId) {
    const j = this.jugadores[socketId];
    if (!j || !this.configuracion.comodinesHabilitados) return null;
    if (j.congelado) return { error: '❄️ ¡Estás congelado por el rival en este duelo!' };
    if ((j.comodines.loro || 0) <= 0 || !this.dueloActual.pregunta) return null;

    j.comodines.loro--;
    j.comodinesUsadosPartida = (j.comodinesUsadosPartida || 0) + 1;
    const preg = this.dueloActual.pregunta;

    if (preg.tipo === 'aproximacion') {
      const anio = parseInt(preg.correcta);
      const margen = Math.max(3, Math.round(Math.abs(anio) * 0.08));
      return {
        tipo: 'aproximacion',
        pista: `Mis plumas me dicen: ¡Entre ${anio - margen} y ${anio + margen}!`,
        restantes: j.comodines,
        animacion: 'parrot-fly'
      };
    } else {
      const correcta = preg.correcta;
      const pct = Math.floor(Math.random() * 18) + 68;
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
        restantes: j.comodines,
        animacion: 'parrot-fly'
      };
    }
  }

  usarComodinAvanzado(socketId, codigoComodin, payload = {}) {
    const j = this.jugadores[socketId];
    if (!j || !this.configuracion.comodinesHabilitados) {
      return { exito: false, error: 'Comodines no disponibles.' };
    }
    if (j.congelado) {
      return { exito: false, error: '❄️ ¡Tormenta Glacial activa! Tus comodines están bloqueados en este duelo.' };
    }

    if (codigoComodin === 'martillo') {
      const r = this.usarMartillo(socketId);
      return r ? { exito: true, codigo: 'martillo', ...r } : { exito: false, error: 'No disponible en esta pregunta.' };
    }
    if (codigoComodin === 'loro') {
      const r = this.usarLoro(socketId);
      return r ? { exito: true, codigo: 'loro', ...r } : { exito: false, error: 'No disponible ahora.' };
    }

    const cantActual = j.comodines[codigoComodin] ?? 0;
    if (cantActual <= 0) {
      return { exito: false, error: `No te quedan unidades de este comodín.` };
    }

    const preg = this.dueloActual.pregunta;
    const soyAtacante = this.dueloActual.atacanteId === socketId;
    const misEfectos = soyAtacante ? this.dueloActual.efectosAtacante : this.dueloActual.efectosDefensor;
    const rivalId = soyAtacante ? this.dueloActual.defensorId : this.dueloActual.atacanteId;
    const rival = this.jugadores[rivalId];

    let resultado = {
      exito: true,
      codigo: codigoComodin,
      jugadorNombre: j.nombre,
      jugadorColor: j.color,
      mensajePublico: '',
      mensajePrivado: '',
      datosEfecto: {}
    };

    switch (codigoComodin) {
      case 'eliminar_alternativa': {
        if (!preg || preg.tipo === 'aproximacion') {
          return { exito: false, error: 'Solo aplica en preguntas de opción múltiple.' };
        }
        const inc = ['A', 'B', 'C', 'D'].filter(o => o !== preg.correcta);
        const eliminada = inc[Math.floor(Math.random() * inc.length)];
        resultado.datosEfecto = { descartadas: [eliminada] };
        resultado.mensajePrivado = `🎯 Dardo Preciso: La opción [${eliminada}] es incorrecta.`;
        resultado.mensajePublico = `🎯 ¡${j.nombre} lanzó un Dardo Preciso y descartó 1 opción!`;
        break;
      }

      case 'revelar_respuesta': {
        if (!preg) return { exito: false, error: 'Solo puedes usarlo durante una pregunta activa.' };
        let pistaSabio = preg.explicacion || `Referencia: ${preg.referenciaGeografica || 'Universal'}.`;
        if (preg.tipo === 'opcion_multiple' && preg.opciones[preg.correcta]) {
          const textoCorr = preg.opciones[preg.correcta];
          const inicial = textoCorr.slice(0, 3);
          pistaSabio = `📜 Pista del Sabio: La respuesta correcta empieza con "${inicial}..."`;
        } else if (preg.tipo === 'aproximacion') {
          const decada = Math.floor(parseInt(preg.correcta) / 10) * 10;
          pistaSabio = `📜 Pista del Sabio: Ocurrió en la década de los ${decada}s.`;
        }
        resultado.datosEfecto = { pistaSabio };
        resultado.mensajePrivado = pistaSabio;
        resultado.mensajePublico = `📜 ¡${j.nombre} consultó el Pergamino del Sabio!`;
        break;
      }

      case 'tiempo_adicional': {
        if (this.estado !== 'DUELO' && this.estado !== 'DESEMPATE') {
          return { exito: false, error: 'Solo puedes agregar tiempo durante un duelo activo.' };
        }
        resultado.datosEfecto = { segundosExtra: 10 };
        resultado.mensajePrivado = '⏳ ¡+10 segundos añadidos al reloj!';
        resultado.mensajePublico = `⏳ ¡${j.nombre} activó el Reloj de Arena (+10s)!`;
        break;
      }

      case 'segunda_oportunidad': {
        if (!preg || preg.tipo === 'aproximacion') {
          return { exito: false, error: 'Solo disponible en preguntas de opción múltiple.' };
        }
        j.segundaOportunidadActiva = true;
        misEfectos.segundaOportunidad = true;
        resultado.mensajePrivado = '🦅 ¡Fénix activo! Si fallas tu primera elección, podrás elegir otra opción.';
        resultado.mensajePublico = `🦅 ¡${j.nombre} activó Segunda Oportunidad!`;
        break;
      }

      case 'doble_puntuacion': {
        misEfectos.doblePuntuacion = true;
        resultado.mensajePrivado = '🌟 ¡Doble Estrella activa! Si ganas recibes una tarjeta ★★ (2 estrellas).';
        resultado.mensajePublico = `🌟 ¡${j.nombre} activó Tarjeta Doble Estrella (★★)!`;
        break;
      }

      case 'ataque_especial': {
        misEfectos.ataqueEspecial = true;
        resultado.mensajePrivado = '💣 ¡Cañón de Asedio! Si ganas este duelo, el defensor pierde 2 soldados en el tablero físico.';
        resultado.mensajePublico = `💣 ¡${j.nombre} activó Cañón de Asedio (si gana, el defensor retira 2 soldados en el tablero físico)!`;
        break;
      }

      case 'escudo': {
        misEfectos.escudoCombate = true;
        resultado.mensajePrivado = '🛡️ ¡Escudo de Trinchera! Si pierdes este duelo defensivo, no retiras soldado en el tablero físico.';
        resultado.mensajePublico = `🛡️ ¡${j.nombre} activó Escudo de Trinchera para proteger a sus soldados en el tablero!`;
        break;
      }

      case 'refuerzos': {
        resultado.mensajePrivado = `💂 ¡Coloca +2 soldados de reserva en uno de tus territorios del tablero físico!`;
        resultado.mensajePublico = `💂 ¡${j.nombre} usó Soldados de Reserva: puede colocar +2 soldados en el tablero físico!`;
        break;
      }

      case 'congelar_rival': {
        if (rival) rival.congelado = true;
        misEfectos.congelarRival = true;
        resultado.datosEfecto = { rivalId: rival ? rival.id : null };
        resultado.mensajePrivado = `❄️ ¡Bloqueaste los comodines de ${rival ? rival.nombre : 'tu rival'}!`;
        resultado.mensajePublico = `❄️ ¡${j.nombre} congeló los comodines de ${rival ? rival.nombre : 'su rival'} en este duelo!`;
        break;
      }

      case 'robar_puntos': {
        misEfectos.robarPuntos = true;
        resultado.mensajePrivado = '🏴‍☠️ ¡Corsario! Si ganas el duelo le robas ★ 1 Estrella a tu rival.';
        resultado.mensajePublico = `🏴‍☠️ ¡${j.nombre} activó Corsario para robar ★ 1 Estrella si gana el duelo!`;
        break;
      }

      case 'proteccion_territorial': {
        resultado.mensajePrivado = `🏰 ¡Tregua Diplomática! Declara 1 territorio tuyo inmune en el tablero físico por esta ronda.`;
        resultado.mensajePublico = `🏰 ¡${j.nombre} activó Tregua Diplomática sobre uno de sus territorios en el tablero físico!`;
        break;
      }

      default:
        return { exito: false, error: 'Comodín no reconocido.' };
    }

    j.comodines[codigoComodin] = Math.max(0, cantActual - 1);
    j.comodinesUsadosPartida = (j.comodinesUsadosPartida || 0) + 1;
    resultado.restantes = j.comodines;

    this.registrarMovimiento(j.nombre, j.color, 'COMODIN', null, null, resultado.mensajePublico);
    return resultado;
  }

  // =========================================================================
  // DUELO Y RESOLUCIÓN ADAPTADA AL JUEGO DE MESA FÍSICO DE RISK
  // =========================================================================
  iniciarDuelo(atacanteId, defensorId, pregunta, esDesempate = false, contextoTerritorial = {}) {
    this.estado = esDesempate ? 'DESEMPATE' : 'DUELO';

    const prevOrigen = this.dueloActual.territorioOrigen;
    const prevObjetivo = this.dueloActual.territorioObjetivo;

    this.dueloActual = {
      atacanteId,
      defensorId,
      territorioOrigen: contextoTerritorial.territorioOrigen || (esDesempate ? prevOrigen : null),
      territorioObjetivo: contextoTerritorial.territorioObjetivo || (esDesempate ? prevObjetivo : null),
      pregunta,
      esDesempate,
      efectosAtacante: esDesempate ? (this.dueloActual.efectosAtacante || {}) : {},
      efectosDefensor: esDesempate ? (this.dueloActual.efectosDefensor || {}) : {}
    };

    this.tiempoInicioPregunta = Date.now();

    if (pregunta.id && typeof pregunta.id === 'number') {
      this.preguntasUsadasIds.push(pregunta.id);
    }
    if (pregunta.codigoUnico) {
      this.preguntasUsadasIds.push(pregunta.codigoUnico);
    }
    if (pregunta.categoria) {
      this.categoriasRecientes.push(pregunta.categoria);
    }

    if (this.jugadores[atacanteId]) {
      this.jugadores[atacanteId].respuesta = null;
      this.jugadores[atacanteId].tiempoRespuesta = null;
      this.jugadores[atacanteId].congelado = false;
      this.jugadores[atacanteId].segundaOportunidadActiva = false;
    }
    if (this.jugadores[defensorId]) {
      this.jugadores[defensorId].respuesta = null;
      this.jugadores[defensorId].tiempoRespuesta = null;
      this.jugadores[defensorId].congelado = false;
      this.jugadores[defensorId].segundaOportunidadActiva = false;
    }
  }

  registrarRespuesta(socketId, valor) {
    const j = this.jugadores[socketId];
    if (!j) return { ok: false };
    if (socketId !== this.dueloActual.atacanteId && socketId !== this.dueloActual.defensorId) {
      return { ok: false };
    }
    if (j.respuesta !== null) return { ok: false };

    const preg = this.dueloActual.pregunta;

    if (
      preg &&
      preg.tipo === 'opcion_multiple' &&
      j.segundaOportunidadActiva &&
      valor !== preg.correcta
    ) {
      j.segundaOportunidadActiva = false;
      return {
        ok: false,
        segundaOportunidadUsada: true,
        opcionIncorrecta: valor,
        mensaje: `🦅 ¡El Fénix te salvó! La opción [${valor}] era incorrecta. ¡Elige otra opción ahora!`
      };
    }

    j.respuesta = valor;
    j.tiempoRespuesta = Date.now() - this.tiempoInicioPregunta;
    return { ok: true };
  }

  ambosRespondieron() {
    const at = this.jugadores[this.dueloActual.atacanteId];
    const def = this.jugadores[this.dueloActual.defensorId];
    const atListo = !at || at.respuesta !== null;
    const defListo = !def || def.respuesta !== null;
    return atListo && defListo;
  }

  resolverDuelo() {
    const at = this.jugadores[this.dueloActual.atacanteId] || {
      id: this.dueloActual.atacanteId,
      nombre: 'Atacante',
      color: 'rojo',
      respuesta: null,
      tiempoRespuesta: 99999,
      puntos: 0
    };

    const def = this.jugadores[this.dueloActual.defensorId] || {
      id: this.dueloActual.defensorId,
      nombre: 'Defensor',
      color: 'azul',
      respuesta: null,
      tiempoRespuesta: 99999,
      puntos: 0
    };

    const preg = this.dueloActual.pregunta || { tipo: 'opcion_multiple', correcta: 'A', explicacion: '' };
    let ganador = null;
    let motivo = '';
    let requiereDesempate = false;
    let resultadoBase = {};

    if (preg.tipo === 'aproximacion') {
      const target = parseInt(preg.correcta) || 0;
      const respAtNum = (at.respuesta !== null && !isNaN(parseInt(at.respuesta))) ? parseInt(at.respuesta) : null;
      const respDefNum = (def.respuesta !== null && !isNaN(parseInt(def.respuesta))) ? parseInt(def.respuesta) : null;

      const diffAt = respAtNum !== null ? Math.abs(target - respAtNum) : 99999;
      const diffDef = respDefNum !== null ? Math.abs(target - respDefNum) : 99999;

      if (respAtNum === null && respDefNum === null) {
        motivo = 'Ninguno de los dos comandantes envió un número.';
      } else if (diffAt < diffDef) {
        ganador = at;
        motivo = `¡Más cerca del valor exacto (${target}) por ${diffDef === 99999 ? 'ausencia del rival' : (diffDef - diffAt) + ' unidades'}!`;
      } else if (diffDef < diffAt) {
        ganador = def;
        motivo = `¡Más cerca del valor exacto (${target}) por ${diffAt === 99999 ? 'ausencia del rival' : (diffAt - diffDef) + ' unidades'}!`;
      } else {
        if ((at.tiempoRespuesta || 99999) < (def.tiempoRespuesta || 99999)) {
          ganador = at;
          motivo = `¡Misma distancia, pero respondió más rápido (${(at.tiempoRespuesta / 1000).toFixed(2)}s vs ${(def.tiempoRespuesta / 1000).toFixed(2)}s)!`;
        } else {
          ganador = def;
          motivo = `¡Misma distancia, pero respondió más rápido (${(def.tiempoRespuesta / 1000).toFixed(2)}s vs ${(at.tiempoRespuesta / 1000).toFixed(2)}s)!`;
        }
      }

      resultadoBase = {
        tipo: 'aproximacion',
        correcta: target,
        explicacion: preg.explicacion || '',
        categoria: preg.categoria,
        dificultad: preg.dificultad || 'basico',
        banco: preg.banco || 'mixto',
        atacante: {
          id: at.id, nombre: at.nombre, color: at.color,
          resp: respAtNum, diff: diffAt === 99999 ? null : diffAt, tiempoMs: at.tiempoRespuesta || 0, acerto: ganador && ganador.id === at.id
        },
        defensor: {
          id: def.id, nombre: def.nombre, color: def.color,
          resp: respDefNum, diff: diffDef === 99999 ? null : diffDef, tiempoMs: def.tiempoRespuesta || 0, acerto: ganador && ganador.id === def.id
        },
        ganador: ganador ? { id: ganador.id, nombre: ganador.nombre, color: ganador.color } : null,
        motivo,
        requiereDesempate: false
      };
    } else {
      const correcta = preg.correcta;
      const atOk = at.respuesta === correcta;
      const defOk = def.respuesta === correcta;

      if (atOk && !defOk) {
        ganador = at;
        motivo = `¡Acertó la respuesta correcta [${correcta}]!`;
      } else if (!atOk && defOk) {
        ganador = def;
        motivo = `¡Defensa exitosa! Acertó la respuesta correcta [${correcta}].`;
      } else if (atOk && defOk) {
        requiereDesempate = true;
        motivo = '¡Ambos acertaron! Pasando a desempate numérico de Diana...';
      } else {
        motivo = `Ambos fallaron la trivia (Respuesta correcta: ${correcta}).`;
      }

      resultadoBase = {
        tipo: 'opcion_multiple',
        correcta,
        textoCorrecta: preg.opciones ? preg.opciones[correcta] : '',
        explicacion: preg.explicacion || '',
        categoria: preg.categoria,
        dificultad: preg.dificultad || 'basico',
        banco: preg.banco || 'mixto',
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

    if (requiereDesempate) {
      return {
        ...resultadoBase,
        combateTerritorial: null,
        turnoContinua: true
      };
    }

    const impacto = this.aplicarResolucionTableroFisico(at, def, ganador, preg);

    return {
      ...resultadoBase,
      combateTerritorial: impacto.combateTerritorial,
      instruccionTableroFisico: impacto.instruccionTableroFisico,
      tarjetaGanada: impacto.tarjetaGanada,
      turnoContinua: impacto.turnoContinua,
      ataquesRealizadosEnTurno: this.turnoEstado.ataquesRealizados,
      maxAtaquesConsecutivos: this.configuracion.maxAtaquesConsecutivos
    };
  }

  aplicarResolucionTableroFisico(at, def, ganador, preg) {
    const terObj = this.dueloActual.territorioObjetivo ? this.territorios[this.dueloActual.territorioObjetivo] : null;
    const ganoAtacante = ganador && ganador.id === at.id;
    const ganoDefensor = ganador && ganador.id === def.id;

    let bajasAtacante = 0;
    let bajasDefensor = 0;
    let territorioConquistado = false;
    let instruccionTableroFisico = '';
    let tarjetaGanada = null;

    if (ganoAtacante) {
      this.turnoEstado.ataquesRealizados++;
      this.turnoEstado.conquistasEnTurno++;

      bajasDefensor = this.dueloActual.efectosAtacante?.ataqueEspecial ? 2 : 1;
      if (this.dueloActual.efectosDefensor?.escudoCombate) {
        bajasDefensor = 0;
        instruccionTableroFisico = `🛡️ ${def.nombre} tenía Escudo activo: conserva sus soldados en el tablero físico.`;
      } else {
        territorioConquistado = true;
        instruccionTableroFisico = `⚔️ EN EL TABLERO FÍSICO: ${def.nombre} (${def.color.toUpperCase()}) pierde ${bajasDefensor} soldado(s). ¡Si era su último soldado, ${at.nombre} conquista el territorio!`;
      }

      if (terObj && !this.dueloActual.efectosDefensor?.escudoCombate) {
        terObj.propietarioId = at.id;
        terObj.propietarioNombre = at.nombre;
        terObj.propietarioColor = at.color;
        terObj.bajoAtaque = false;
      }

      // Entregar 1 Tarjeta de Risk con ★ 1 o ★★ 2 estrellas (1 por turno al ganar su primer ataque, o extra si usó Doble Estrella)
      if (!this.turnoEstado.ganaTarjetaEnEsteTurno || this.dueloActual.efectosAtacante?.doblePuntuacion) {
        this.turnoEstado.ganaTarjetaEnEsteTurno = true;
        tarjetaGanada = this.robarTarjetaRisk();
        if (this.dueloActual.efectosAtacante?.doblePuntuacion) {
          tarjetaGanada.estrellas = 2;
        }
        if (this.jugadores[at.id]) {
          this.jugadores[at.id].tarjetasRisk = this.jugadores[at.id].tarjetasRisk || [];
          this.jugadores[at.id].tarjetasRisk.push(tarjetaGanada);
          this.jugadores[at.id].estrellasAcumuladas = (this.jugadores[at.id].estrellasAcumuladas || 0) + tarjetaGanada.estrellas;
        }
      }

      // Si usó Corsario (robar 1 estrella al rival)
      if (this.dueloActual.efectosAtacante?.robarPuntos && this.jugadores[def.id] && (this.jugadores[def.id].estrellasAcumuladas || 0) > 0) {
        this.jugadores[def.id].estrellasAcumuladas--;
        if (this.jugadores[at.id]) {
          this.jugadores[at.id].estrellasAcumuladas = (this.jugadores[at.id].estrellasAcumuladas || 0) + 1;
        }
      }

      if (this.jugadores[at.id]) {
        this.jugadores[at.id].puntos = (this.jugadores[at.id].puntos || 0) + 150;
        this.jugadores[at.id].conquistasPartida = (this.jugadores[at.id].conquistasPartida || 0) + 1;
        this.jugadores[at.id].aciertosPartida = (this.jugadores[at.id].aciertosPartida || 0) + 1;
      }
    } else if (ganoDefensor) {
      bajasAtacante = 1;
      instruccionTableroFisico = `🛡️ EN EL TABLERO FÍSICO: ¡Defensa exitosa de ${def.nombre}! ${at.nombre} (${at.color.toUpperCase()}) retira 1 soldado atacante en el tablero.`;
      if (terObj) terObj.bajoAtaque = false;

      if (this.jugadores[def.id]) {
        this.jugadores[def.id].puntos = (this.jugadores[def.id].puntos || 0) + 150;
        this.jugadores[def.id].defensasPartida = (this.jugadores[def.id].defensasPartida || 0) + 1;
        this.jugadores[def.id].aciertosPartida = (this.jugadores[def.id].aciertosPartida || 0) + 1;
      }
    } else {
      instruccionTableroFisico = `⚖️ Ninguno acertó: no se mueven soldados en el tablero físico.`;
      if (terObj) terObj.bajoAtaque = false;
    }

    this.recalcularEstadisticasTerritoriales();

    // En Risk de mesa, mientras el atacante gane (o mientras decida seguir en su turno), mantiene su turno para hacer ataques consecutivos
    const turnoContinua = Boolean(
      ganoAtacante &&
      this.configuracion.permitirAtaquesConsecutivos !== false &&
      this.turnoEstado.ataquesRealizados < (parseInt(this.configuracion.maxAtaquesConsecutivos) || 15)
    );

    this.turnoEstado.puedeSeguirAtacando = turnoContinua;

    this.registrarMovimiento(
      ganoAtacante ? at.nombre : def.nombre,
      ganoAtacante ? at.color : def.color,
      ganoAtacante ? 'CONQUISTA' : 'DEFENSA',
      null,
      terObj ? terObj.codigo : null,
      instruccionTableroFisico
    );

    return {
      turnoContinua,
      instruccionTableroFisico,
      tarjetaGanada,
      combateTerritorial: {
        territorioOrigen: null,
        territorioObjetivo: terObj ? {
          codigo: terObj.codigo,
          nombre: terObj.nombre,
          propietarioColor: terObj.propietarioColor,
          propietarioNombre: terObj.propietarioNombre,
          soldadosAntes: terObj.soldados,
          soldadosDespues: terObj.soldados
        } : null,
        bajasAtacante,
        bajasDefensor,
        territorioConquistado,
        defensaExitosa: ganoDefensor,
        puntosAtacanteDelta: ganoAtacante ? 150 : 0,
        puntosDefensorDelta: ganoDefensor ? 150 : 0
      }
    };
  }

  reiniciarPartidaCompleta(modo = null) {
    this.rondaActual = 1;
    this.indiceTurnoActual = 0;
    this.preguntasUsadasIds = [];
    this.categoriasRecientes = [];
    this.historialMovimientos = [];
    this.inicializarMazoTarjetasRisk();

    Object.values(this.jugadores).forEach(j => {
      j.puntos = 300;
      j.conquistasPartida = 0;
      j.defensasPartida = 0;
      j.aciertosPartida = 0;
      j.tarjetasRisk = [];
      j.estrellasAcumuladas = 0;
      j.comodines = this.construirInventarioInicialComodines();
    });

    this.repartirTerritoriosPorModo(modo || this.configuracion.modoInicioTablero || 'tarjetas_estrellas');
    if (this.ordenTurnos.length > 0) {
      this.iniciarTurnoJugador(this.ordenTurnos[0]);
    }
    this.cancelarDuelo();
  }

  registrarMovimiento(jugadorNombre, jugadorColor, tipoAccion, origen, destino, descripcion) {
    const mov = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      ronda: this.rondaActual,
      jugadorNombre,
      jugadorColor,
      tipoAccion,
      origen,
      destino,
      descripcion,
      hora: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    this.historialMovimientos.unshift(mov);
    if (this.historialMovimientos.length > 60) {
      this.historialMovimientos.pop();
    }
    return mov;
  }

  obtenerEstadoCompletoMapa() {
    const atacante = this.obtenerAtacanteEnTurno();
    return {
      modoMapa: 'risk',
      modoInicioTablero: this.configuracion.modoInicioTablero || 'tarjetas_estrellas',
      rondaActual: this.rondaActual,
      atacanteId: atacante ? atacante.id : null,
      atacanteNombre: atacante ? atacante.nombre : null,
      atacanteColor: atacante ? atacante.color : null,
      ataquesRealizados: this.turnoEstado.ataquesRealizados,
      maxAtaquesConsecutivos: this.configuracion.maxAtaquesConsecutivos || 15,
      puedeSeguirAtacando: this.turnoEstado.puedeSeguirAtacando,
      territoriosAtacables: atacante ? this.obtenerTerritoriosAtacablesPorJugador(atacante.color) : [],
      territorios: Object.values(this.territorios),
      conexiones: this.conexiones,
      jugadores: Object.values(this.jugadores),
      historialMovimientos: this.historialMovimientos.slice(0, 15)
    };
  }
}

module.exports = new GameManager();
