const {
  TERRITORIOS_CATALOGO,
  CONEXIONES_PARES,
  COMODINES_CATALOGO,
  CONFIGURACIONES_INICIALES
} = require('./database/catalogData');

const COLORES = ['rojo', 'azul', 'amarillo', 'verde', 'negro'];

class GameManager {
  constructor() {
    this.estado = 'LOBBY'; // 'LOBBY', 'MAPA_ESTRATEGICO', 'SELECCION_CATEGORIA', 'DUELO', 'DESEMPATE', 'VICTORIA'
    this.jugadores = {};
    this.perfilesDesconectados = {}; // Guarda estado por color/nombre para reconexión limpia
    this.ordenTurnos = [];
    this.indiceTurnoActual = 0;
    this.rondaActual = 1;
    this.preguntasUsadasIds = [];
    this.categoriasRecientes = [];
    this.historialMovimientos = [];

    // Configuración persistente y parametrizable
    this.configuracion = {
      comodinesHabilitados: true,
      martillosPorJugador: 3,
      lorosPorJugador: 3,
      temasPorJugador: 3,
      tiempoPorPregunta: 20,
      puntosRespuestaCorrecta: 150,
      penalizacionRespuestaIncorrecta: 30,
      soldadosInicialesPorTerritorio: 2,
      refuerzosPorRonda: 2,
      maxAtaquesConsecutivos: 5,
      bajasPorDerrotaDefensor: 2,
      bajasPorDerrotaAtacante: 1,
      requiereVecindadParaAtacar: true,
      permitirAtaquesConsecutivos: true,
      modoMapa: 'peru_mundo',      // 'peru', 'mundo', 'peru_mundo'
      modoBancoPreguntas: 'mixto', // 'peru', 'mundo', 'mixto'
      modoSeleccionCategorias: 'tv_show',
      dificultadProgresiva: true,
      condicionVictoria: 'dominacion_o_puntos',
      rondasMaximasPartida: 12,
      sonidosHabilitados: true,
      animacionesHabilitadas: true
    };

    // Catálogo dinámico de comodines cargado desde BD
    this.catalogoComodines = {};
    COMODINES_CATALOGO.forEach(c => {
      this.catalogoComodines[c.codigo] = { ...c };
    });

    // Estado del turno actual (soporta ataques consecutivos estilo Risk)
    this.turnoEstado = {
      atacanteId: null,
      ataquesRealizados: 0,
      conquistasEnTurno: 0,
      puedeSeguirAtacando: true,
      refuerzosRecibidos: false
    };

    // Estado del mapa interactivo de territorios
    this.territorios = {};
    this.conexiones = {};
    this.inicializarEstructuraMapa('peru_mundo');

    // Estado del duelo activo
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
    this.tiempoRestanteSegundos = 20;
  }

  cargarDesdeBaseDeDatos(configMapa = {}, listaComodines = []) {
    Object.assign(this.configuracion, configMapa);
    if (listaComodines && listaComodines.length > 0) {
      this.catalogoComodines = {};
      listaComodines.forEach(c => {
        this.catalogoComodines[c.codigo] = { ...c };
      });
    }
    this.inicializarEstructuraMapa(this.configuracion.modoMapa || 'peru_mundo');
  }

  inicializarEstructuraMapa(modoMapa = 'peru_mundo') {
    this.configuracion.modoMapa = modoMapa;
    this.territorios = {};
    this.conexiones = {};

    const filtrados = TERRITORIOS_CATALOGO.filter(t => {
      if (modoMapa === 'peru') return t.mapa === 'peru';
      if (modoMapa === 'mundo') return t.mapa === 'mundo';
      return true;
    });

    filtrados.forEach(t => {
      this.territorios[t.codigo] = {
        codigo: t.codigo,
        nombre: t.nombre,
        mapa: t.mapa,
        regionContinente: t.region_continente,
        centroX: t.centro_x,
        centroY: t.centro_y,
        svgPath: t.svg_path,
        puntosValor: t.puntos_valor || 150,
        bonoRegion: t.bono_region || 2,
        propietarioId: null,
        propietarioNombre: 'Guarnición Neutral',
        propietarioColor: 'neutral',
        soldados: this.configuracion.soldadosInicialesPorTerritorio || 2,
        escudoActivo: false,
        proteccionTurnos: 0,
        esCapital: false,
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

    this.repartirTerritorios();
  }

  repartirTerritorios() {
    const listaJugadores = Object.values(this.jugadores);
    const codigos = Object.keys(this.territorios);
    if (codigos.length === 0) return;

    const tropasInit = parseInt(this.configuracion.soldadosInicialesPorTerritorio) || 2;

    if (listaJugadores.length === 0) {
      codigos.forEach(cod => {
        const t = this.territorios[cod];
        t.propietarioId = null;
        t.propietarioNombre = 'Guarnición Neutral';
        t.propietarioColor = 'neutral';
        t.soldados = tropasInit;
        t.escudoActivo = false;
        t.proteccionTurnos = 0;
        t.esCapital = false;
        t.bajoAtaque = false;
      });
      return;
    }

    // Reparto equitativo en espiral/round-robin entre los jugadores conectados
    codigos.forEach((cod, idx) => {
      const jug = listaJugadores[idx % listaJugadores.length];
      const t = this.territorios[cod];
      t.propietarioId = jug.id;
      t.propietarioNombre = jug.nombre;
      t.propietarioColor = jug.color;
      t.soldados = tropasInit;
      t.escudoActivo = false;
      t.proteccionTurnos = 0;
      t.bajoAtaque = false;
      t.esCapital = idx < listaJugadores.length;
      if (t.esCapital) t.soldados = tropasInit + 1;
    });

    this.recalcularEstadisticasTerritoriales();
  }

  recalcularEstadisticasTerritoriales() {
    Object.values(this.jugadores).forEach(j => {
      const misTer = Object.values(this.territorios).filter(t => t.propietarioColor === j.color);
      j.territoriosCount = misTer.length;
      j.soldadosTotales = misTer.reduce((acc, t) => acc + t.soldados, 0);
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

    // Garantizar compatibilidad directa con claves clásicas: martillo, loro, tema
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

    // Verificar si es una reconexión de un jugador con el mismo color o nombre
    const existenteMismoColor = Object.values(this.jugadores).find(j => j.color === color);
    if (existenteMismoColor) {
      if (existenteMismoColor.nombre.toLowerCase() === nombreLimpio.toLowerCase()) {
        // Reconexión directa: migrar estado al nuevo socketId
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
        this.registrarMovimiento(nombreLimpio, color, 'RECONEXION', null, null, `${nombreLimpio} se reconectó a la partida.`);
        return { exito: true, jugador: existenteMismoColor, reconectado: true };
      }
      return { exito: false, error: 'Color ocupado por otro comandante.' };
    }

    if (!COLORES.includes(color)) return { exito: false, error: 'Color no válido.' };

    // Verificar si había un perfil desconectado guardado para este color
    const previo = this.perfilesDesconectados[color];
    const inventario = previo ? previo.comodines : this.construirInventarioInicialComodines();

    this.jugadores[socketId] = {
      id: socketId,
      nombre: nombreLimpio,
      color: color,
      conectado: true,
      puntos: previo ? previo.puntos : 300,
      monedas: previo ? previo.monedas : 200,
      territoriosCount: 0,
      soldadosTotales: 0,
      conquistasPartida: previo ? previo.conquistasPartida : 0,
      defensasPartida: previo ? previo.defensasPartida : 0,
      aciertosPartida: previo ? previo.aciertosPartida : 0,
      comodinesUsadosPartida: previo ? previo.comodinesUsadosPartida : 0,
      comodines: inventario,
      respuesta: null,
      tiempoRespuesta: null,
      congelado: false,
      segundaOportunidadActiva: false
    };

    if (!this.ordenTurnos.includes(socketId)) {
      this.ordenTurnos.push(socketId);
    }

    // Si el jugador tenía territorios por su color, conservarlos; si no, repartir equitativamente
    const tieneTerritorios = Object.values(this.territorios).some(t => t.propietarioColor === color);
    if (!tieneTerritorios) {
      this.repartirTerritorios();
    } else {
      this.recalcularEstadisticasTerritoriales();
    }

    if (!this.turnoEstado.atacanteId && this.ordenTurnos.length > 0) {
      this.iniciarTurnoJugador(this.ordenTurnos[this.indiceTurnoActual]);
    }

    this.registrarMovimiento(nombreLimpio, color, 'INGRESO', null, null, `${nombreLimpio} (${color.toUpperCase()}) desplegó su ejército en el mapa.`);
    return { exito: true, jugador: this.jugadores[socketId], reconectado: !!previo };
  }

  removerJugador(socketId, esExpulsion = false) {
    const j = this.jugadores[socketId];
    if (!j) return null;

    const color = j.color;
    if (!esExpulsion) {
      // Guardar estado para permitir reconexión sin perder territorios ni puntos
      this.perfilesDesconectados[color] = { ...j };
    } else {
      delete this.perfilesDesconectados[color];
    }

    delete this.jugadores[socketId];
    this.ordenTurnos = this.ordenTurnos.filter(id => id !== socketId);

    if (esExpulsion) {
      this.repartirTerritorios();
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
      this.configuracion.maxAtaquesConsecutivos = Math.max(1, parseInt(cfg.maxAtaquesConsecutivos) || 5);
    }
    if (cfg.permitirAtaquesConsecutivos !== undefined) {
      this.configuracion.permitirAtaquesConsecutivos = cfg.permitirAtaquesConsecutivos === true || cfg.permitirAtaquesConsecutivos === 'true';
    }
    if (cfg.requiereVecindadParaAtacar !== undefined) {
      this.configuracion.requiereVecindadParaAtacar = cfg.requiereVecindadParaAtacar === true || cfg.requiereVecindadParaAtacar === 'true';
    }
    if (cfg.soldadosInicialesPorTerritorio !== undefined) {
      this.configuracion.soldadosInicialesPorTerritorio = Math.max(1, parseInt(cfg.soldadosInicialesPorTerritorio) || 2);
    }
    if (cfg.refuerzosPorRonda !== undefined) {
      this.configuracion.refuerzosPorRonda = Math.max(0, parseInt(cfg.refuerzosPorRonda) || 2);
    }
    if (cfg.puntosRespuestaCorrecta !== undefined) {
      this.configuracion.puntosRespuestaCorrecta = parseInt(cfg.puntosRespuestaCorrecta) || 150;
    }
    if (cfg.penalizacionRespuestaIncorrecta !== undefined) {
      this.configuracion.penalizacionRespuestaIncorrecta = parseInt(cfg.penalizacionRespuestaIncorrecta) || 30;
    }
    if (cfg.modoBancoPreguntas !== undefined) {
      this.configuracion.modoBancoPreguntas = cfg.modoBancoPreguntas;
    }
    if (cfg.modoSeleccionCategorias !== undefined) {
      this.configuracion.modoSeleccionCategorias = cfg.modoSeleccionCategorias;
    }
    if (cfg.modoMapa !== undefined && cfg.modoMapa !== this.configuracion.modoMapa) {
      this.inicializarEstructuraMapa(cfg.modoMapa);
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
      puedeSeguirAtacando: true,
      refuerzosRecibidos: true
    };

    // Reducir contadores temporales de protección territorial al iniciar turno propio
    Object.values(this.territorios).forEach(t => {
      t.bajoAtaque = false;
      if (t.propietarioColor === j.color && t.proteccionTurnos > 0) {
        t.proteccionTurnos = Math.max(0, t.proteccionTurnos - 1);
      }
    });

    // Otorgar refuerzos estratégicos de inicio de turno en su capital o territorio con menos tropas
    const misTer = Object.values(this.territorios).filter(t => t.propietarioColor === j.color);
    if (misTer.length > 0 && this.rondaActual > 1) {
      const refuerzo = Math.max(1, Math.floor(misTer.length / 3) + (parseInt(this.configuracion.refuerzosPorRonda) || 1));
      const objetivoRefuerzo = misTer.sort((a, b) => a.soldados - b.soldados)[0];
      objetivoRefuerzo.soldados += refuerzo;
      this.registrarMovimiento(j.nombre, j.color, 'REFUERZO_TURNO', null, objetivoRefuerzo.codigo, `${j.nombre} recibió +${refuerzo} soldados de refuerzo en ${objetivoRefuerzo.nombre}.`);
    }

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
  // LÓGICA TERRITORIAL Y VALIDACIÓN DE ATAQUES CONSECUTIVOS (ESTILO RISK)
  // =========================================================================
  obtenerTerritoriosAtacablesPorJugador(jugadorColor) {
    const misTerritorios = Object.values(this.territorios).filter(t => t.propietarioColor === jugadorColor);
    if (misTerritorios.length === 0) return [];

    if (!this.configuracion.requiereVecindadParaAtacar) {
      return Object.values(this.territorios)
        .filter(t => t.propietarioColor !== jugadorColor && t.proteccionTurnos <= 0)
        .map(t => t.codigo);
    }

    const atacables = new Set();
    misTerritorios.forEach(miTer => {
      (miTer.vecinos || []).forEach(vecCodigo => {
        const vec = this.territorios[vecCodigo];
        if (vec && vec.propietarioColor !== jugadorColor && vec.proteccionTurnos <= 0) {
          atacables.add(vecCodigo);
        }
      });
    });

    // Si por alguna razón un jugador quedó encerrado sin vecinos directos desbloqueados, permitir atacar cualquier territorio enemigo para no bloquear el juego
    if (atacables.size === 0) {
      Object.values(this.territorios)
        .filter(t => t.propietarioColor !== jugadorColor)
        .forEach(t => atacables.add(t.codigo));
    }

    return Array.from(atacables);
  }

  prepararAtaqueTerritorial(atacanteId, datosAtaque = {}) {
    const atacante = this.jugadores[atacanteId];
    if (!atacante) return { exito: false, error: 'Atacante no registrado.' };

    const enTurno = this.obtenerAtacanteEnTurno();
    if (!enTurno || enTurno.id !== atacanteId) {
      return { exito: false, error: 'No es tu turno de ataque.' };
    }

    let { territorioOrigen, territorioObjetivo, defensorColor } = datosAtaque;
    let terObj = territorioObjetivo ? this.territorios[territorioObjetivo] : null;
    let terOri = territorioOrigen ? this.territorios[territorioOrigen] : null;

    const atacablesCodigos = this.obtenerTerritoriosAtacablesPorJugador(atacante.color);

    // Si el jugador eligió territorio objetivo en el mapa interactivo
    if (terObj) {
      if (terObj.propietarioColor === atacante.color) {
        return { exito: false, error: 'Ese territorio ya pertenece a tu imperio.' };
      }
      if (terObj.proteccionTurnos > 0) {
        return { exito: false, error: `🏰 ${terObj.nombre} está protegido por una Muralla Inca por ${terObj.proteccionTurnos} turno(s).` };
      }
      if (this.configuracion.requiereVecindadParaAtacar && !atacablesCodigos.includes(terObj.codigo)) {
        return { exito: false, error: `⚠️ ${terObj.nombre} no es fronterizo con ninguno de tus territorios actuales.` };
      }
    } else {
      // Si el jugador declaró ataque seleccionando el color rival desde el selector clásico
      let candidatos = Object.values(this.territorios).filter(
        t => atacablesCodigos.includes(t.codigo) && (!defensorColor || t.propietarioColor === defensorColor)
      );
      if (candidatos.length === 0) {
        candidatos = Object.values(this.territorios).filter(t => t.propietarioColor !== atacante.color);
      }
      if (candidatos.length > 0) {
        terObj = candidatos[0];
      }
    }

    // Seleccionar automáticamente territorio origen fronterizo si no se especificó
    if (terObj && (!terOri || terOri.propietarioColor !== atacante.color)) {
      const misVecinos = (terObj.vecinos || [])
        .map(c => this.territorios[c])
        .filter(t => t && t.propietarioColor === atacante.color)
        .sort((a, b) => b.soldados - a.soldados);

      if (misVecinos.length > 0) {
        terOri = misVecinos[0];
      } else {
        const cualquieraPropio = Object.values(this.territorios)
          .filter(t => t.propietarioColor === atacante.color)
          .sort((a, b) => b.soldados - a.soldados);
        terOri = cualquieraPropio[0] || null;
      }
    }

    // Determinar el comandante defensor dueño del territorio objetivo
    let defensor = null;
    if (terObj && terObj.propietarioColor && terObj.propietarioColor !== 'neutral') {
      defensor = Object.values(this.jugadores).find(j => j.color === terObj.propietarioColor);
    }
    if (!defensor && defensorColor) {
      defensor = Object.values(this.jugadores).find(j => j.color === defensorColor);
    }
    if (!defensor) {
      // Buscar cualquier otro jugador conectado para que defienda la guarnición
      defensor = Object.values(this.jugadores).find(j => j.id !== atacanteId) || {
        id: 'bot_guarnicion',
        nombre: 'Guarnición Defensora',
        color: terObj ? terObj.propietarioColor : 'negro'
      };
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
  // SISTEMA DE COMODINES AMPLIADO (14 COMODINES TRIVIADOR MUNDO)
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

    this.registrarMovimiento(j.nombre, j.color, 'COMODIN', null, null, `🔨 ${j.nombre} usó el Martillo Demoledor.`);
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

    this.registrarMovimiento(j.nombre, j.color, 'COMODIN', null, null, `🦜 ${j.nombre} consultó al Loro Oráculo.`);

    if (preg.tipo === 'aproximacion') {
      const anio = parseInt(preg.correcta);
      const margen = Math.max(3, Math.round(Math.abs(anio) * 0.08));
      return {
        tipo: 'aproximacion',
        pista: `🦜 El Loro Oráculo susurra: ¡El valor exacto está entre ${anio - margen} y ${anio + margen}!`,
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

    // Redirecciones a métodos dedicados si son martillo o loro
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
      return { exito: false, error: `No te quedan unidades del comodín ${codigoComodin}.` };
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
        resultado.mensajePublico = `🎯 ¡${j.nombre} lanzó un Dardo Preciso y descartó 1 alternativa!`;
        break;
      }

      case 'revelar_respuesta': {
        if (!preg) return { exito: false, error: 'Solo puedes usarlo durante una pregunta activa.' };
        let pistaSabio = preg.explicacion || `Referencia geográfica/histórica: ${preg.referenciaGeografica || 'Universal'}.`;
        // Ocultar la respuesta literal si aparece textual para que sea una pista inteligente
        if (preg.tipo === 'opcion_multiple' && preg.opciones[preg.correcta]) {
          const textoCorr = preg.opciones[preg.correcta];
          const inicial = textoCorr.slice(0, 2);
          pistaSabio = `📜 Pista del Sabio: La respuesta correcta empieza con "${inicial}..." (${preg.subcategoria || preg.categoria}).`;
        } else if (preg.tipo === 'aproximacion') {
          const decada = Math.floor(parseInt(preg.correcta) / 10) * 10;
          pistaSabio = `📜 Pista del Sabio: Pertenece a la década de ${decada}s.`;
        }
        resultado.datosEfecto = { pistaSabio };
        resultado.mensajePrivado = pistaSabio;
        resultado.mensajePublico = `📜 ¡${j.nombre} abrió el Pergamino del Sabio!`;
        break;
      }

      case 'tiempo_adicional': {
        if (this.estado !== 'DUELO' && this.estado !== 'DESEMPATE') {
          return { exito: false, error: 'Solo puedes agregar tiempo durante un duelo activo.' };
        }
        resultado.datosEfecto = { segundosExtra: 10 };
        resultado.mensajePrivado = '⏳ ¡Has añadido +10 segundos al reloj del duelo!';
        resultado.mensajePublico = `⏳ ¡${j.nombre} activó el Reloj de Arena (+10s al temporizador)!`;
        break;
      }

      case 'segunda_oportunidad': {
        if (!preg || preg.tipo === 'aproximacion') {
          return { exito: false, error: 'Solo disponible en preguntas de opción múltiple.' };
        }
        j.segundaOportunidadActiva = true;
        misEfectos.segundaOportunidad = true;
        resultado.mensajePrivado = '🦅 ¡Fénix activo! Si fallas tu primera elección, podrás elegir una segunda vez.';
        resultado.mensajePublico = `🦅 ¡${j.nombre} invocó al Fénix de Segunda Oportunidad!`;
        break;
      }

      case 'doble_puntuacion': {
        misEfectos.doblePuntuacion = true;
        resultado.mensajePrivado = '👑 ¡Estandarte Real activo! Ganarás x2 puntos y +1 soldado extra si vences.';
        resultado.mensajePublico = `👑 ¡${j.nombre} alzó el Estandarte Real (Doble Puntuación y Tropa Extra)!`;
        break;
      }

      case 'ataque_especial': {
        misEfectos.ataqueEspecial = true;
        resultado.mensajePrivado = '💣 ¡Cañón de Asedio cargado! Si ganas el duelo, causarás +2 bajas adicionales al territorio enemigo.';
        resultado.mensajePublico = `💣 ¡${j.nombre} desplegó el Cañón de Asedio (+2 de daño territorial)!`;
        break;
      }

      case 'escudo': {
        misEfectos.escudoCombate = true;
        // También puede aplicarse sobre un territorio propio en el mapa
        const codTer = payload.territorioCodigo || this.dueloActual.territorioObjetivo || this.dueloActual.territorioOrigen;
        if (codTer && this.territorios[codTer] && this.territorios[codTer].propietarioColor === j.color) {
          this.territorios[codTer].escudoActivo = true;
        } else {
          const miTer = Object.values(this.territorios).find(t => t.propietarioColor === j.color);
          if (miTer) miTer.escudoActivo = true;
        }
        resultado.mensajePrivado = '🛡️ ¡Escudo Imperial activado! Absorberá hasta 2 bajas en defensa.';
        resultado.mensajePublico = `🛡️ ¡${j.nombre} fortificó sus posiciones con un Escudo Imperial!`;
        break;
      }

      case 'refuerzos': {
        let terDestino = payload.territorioCodigo ? this.territorios[payload.territorioCodigo] : null;
        if (!terDestino || terDestino.propietarioColor !== j.color) {
          const misTer = Object.values(this.territorios).filter(t => t.propietarioColor === j.color);
          terDestino = misTer[0] || null;
        }
        if (!terDestino) return { exito: false, error: 'No tienes territorios para reforzar.' };
        terDestino.soldados += 3;
        this.recalcularEstadisticasTerritoriales();
        resultado.datosEfecto = { territorio: terDestino.codigo, soldados: terDestino.soldados };
        resultado.mensajePrivado = `⚔️ ¡+3 soldados desplegados en ${terDestino.nombre}! (Total: ${terDestino.soldados})`;
        resultado.mensajePublico = `⚔️ ¡${j.nombre} desplegó +3 soldados de reserva en ${terDestino.nombre}!`;
        break;
      }

      case 'congelar_rival': {
        if (rival) {
          rival.congelado = true;
        }
        misEfectos.congelarRival = true;
        resultado.datosEfecto = { rivalId: rival ? rival.id : null };
        resultado.mensajePrivado = `❄️ ¡Congelaste los comodines de ${rival ? rival.nombre : 'tu rival'}!`;
        resultado.mensajePublico = `❄️ ¡${j.nombre} desató una Tormenta Glacial y bloqueó los comodines de ${rival ? rival.nombre : 'su oponente'}!`;
        break;
      }

      case 'robar_puntos': {
        misEfectos.robarPuntos = true;
        resultado.mensajePrivado = '🏴‍☠️ ¡Corsario listo! Si ganas el duelo, saquearás hasta 200 puntos de oro del rival.';
        resultado.mensajePublico = `🏴‍☠️ ¡${j.nombre} izó la bandera Corsaria para saquear el botín del duelo!`;
        break;
      }

      case 'proteccion_territorial': {
        let terProt = payload.territorioCodigo ? this.territorios[payload.territorioCodigo] : null;
        if (!terProt || terProt.propietarioColor !== j.color) {
          const misTer = Object.values(this.territorios).filter(t => t.propietarioColor === j.color);
          terProt = misTer[0] || null;
        }
        if (!terProt) return { exito: false, error: 'No tienes territorios para proteger.' };
        terProt.proteccionTurnos = 2;
        terProt.escudoActivo = true;
        resultado.datosEfecto = { territorio: terProt.codigo, proteccionTurnos: 2 };
        resultado.mensajePrivado = `🏰 ¡Muralla Inca levantada en ${terProt.nombre} por 2 turnos!`;
        resultado.mensajePublico = `🏰 ¡${j.nombre} levantó una Muralla Inca en ${terProt.nombre} (inmune a conquista)!`;
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
  // CICLO DE DUELO Y RESOLUCIÓN CON CONQUISTA TERRITORIAL Y DEFENSA REAL
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

    // Si el defensor es la Guarnición Neutral (bot), programar respuesta automática realista
    if (defensorId === 'bot_guarnicion') {
      this.simularRespuestaGuarnicion(pregunta);
    }
  }

  simularRespuestaGuarnicion(pregunta) {
    this.respuestaBotGuarnicion = {
      respuesta: null,
      tiempoRespuesta: Math.floor(Math.random() * 6000) + 4500
    };
    if (pregunta.tipo === 'aproximacion') {
      const exacto = parseInt(pregunta.correcta) || 1900;
      const desv = Math.floor(Math.random() * 50) - 25;
      this.respuestaBotGuarnicion.respuesta = String(exacto + (desv === 0 ? 12 : desv));
    } else {
      const aciertaBot = Math.random() < 0.35;
      if (aciertaBot) {
        this.respuestaBotGuarnicion.respuesta = pregunta.correcta;
      } else {
        const inc = ['A', 'B', 'C', 'D'].filter(o => o !== pregunta.correcta);
        this.respuestaBotGuarnicion.respuesta = inc[Math.floor(Math.random() * inc.length)];
      }
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

    // Verificar comodín Segunda Oportunidad (Fénix) en preguntas de opción múltiple
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
    const def = this.dueloActual.defensorId === 'bot_guarnicion'
      ? { respuesta: this.respuestaBotGuarnicion?.respuesta || 'A' }
      : this.jugadores[this.dueloActual.defensorId];
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

    let def = this.jugadores[this.dueloActual.defensorId];
    if (!def) {
      if (this.dueloActual.defensorId === 'bot_guarnicion' && this.respuestaBotGuarnicion) {
        const terObj = this.territorios[this.dueloActual.territorioObjetivo];
        def = {
          id: 'bot_guarnicion',
          nombre: terObj ? `Guarnición de ${terObj.nombre}` : 'Guarnición Defensora',
          color: terObj ? terObj.propietarioColor : 'negro',
          respuesta: this.respuestaBotGuarnicion.respuesta,
          tiempoRespuesta: this.respuestaBotGuarnicion.tiempoRespuesta,
          puntos: 100
        };
      } else {
        def = {
          id: this.dueloActual.defensorId,
          nombre: 'Defensor (Desconectado)',
          color: 'azul',
          respuesta: null,
          tiempoRespuesta: 99999,
          puntos: 0
        };
      }
    }

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
        motivo = `¡Defensa heroica! Acertó la respuesta correcta [${correcta}].`;
      } else if (atOk && defOk) {
        requiereDesempate = true;
        motivo = '¡Ambos acertaron! Pasando a desempate numérico de Diana...';
      } else {
        motivo = `Ambos fallaron la trivia (Correcta: ${correcta}). La guarnición defensora resiste el asalto.`;
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

    // Si requiere desempate por Diana, retornar sin resolver aún el territorio
    if (requiereDesempate) {
      return {
        ...resultadoBase,
        combateTerritorial: null,
        turnoContinua: true
      };
    }

    // =====================================================================
    // APLICAR IMPACTO TERRITORIAL, SOLDADOS, DEFENSA Y ATAQUES CONSECUTIVOS
    // =====================================================================
    const impacto = this.aplicarResolucionTerritorial(at, def, ganador, preg);

    return {
      ...resultadoBase,
      combateTerritorial: impacto.combateTerritorial,
      turnoContinua: impacto.turnoContinua,
      ataquesRealizadosEnTurno: this.turnoEstado.ataquesRealizados,
      maxAtaquesConsecutivos: this.configuracion.maxAtaquesConsecutivos,
      victoriaPartida: impacto.victoriaPartida
    };
  }

  aplicarResolucionTerritorial(at, def, ganador, preg) {
    const terOri = this.dueloActual.territorioOrigen ? this.territorios[this.dueloActual.territorioOrigen] : null;
    let terObj = this.dueloActual.territorioObjetivo ? this.territorios[this.dueloActual.territorioObjetivo] : null;

    if (!terObj) {
      // Buscar un territorio del defensor si no se había fijado
      terObj = Object.values(this.territorios).find(t => t.propietarioColor === def.color) || null;
    }

    const ganoAtacante = ganador && ganador.id === at.id;
    const ganoDefensor = ganador && ganador.id === def.id;

    const soldadosAtacanteAntes = terOri ? terOri.soldados : 3;
    const soldadosDefensorAntes = terObj ? terObj.soldados : 2;
    let bajasAtacante = 0;
    let bajasDefensor = 0;
    let territorioConquistado = false;
    let escudoAbsorbio = false;
    let puntosRobados = 0;

    const ptsBase = parseInt(this.configuracion.puntosRespuestaCorrecta) || 150;
    const multDif = preg.dificultad === 'avanzado' ? 1.8 : (preg.dificultad === 'intermedio' ? 1.3 : 1.0);
    let puntosAtacanteDelta = 0;
    let puntosDefensorDelta = 0;

    if (ganoAtacante) {
      this.turnoEstado.ataquesRealizados++;
      let dano = parseInt(this.configuracion.bajasPorDerrotaDefensor) || 2;
      if (this.dueloActual.efectosAtacante?.ataqueEspecial) {
        dano += 2;
      }

      if (terObj) {
        if (terObj.escudoActivo || this.dueloActual.efectosDefensor?.escudoCombate) {
          escudoAbsorbio = true;
          terObj.escudoActivo = false;
          dano = Math.max(1, dano - 2);
        }

        bajasDefensor = Math.min(terObj.soldados, dano);
        terObj.soldados = Math.max(0, terObj.soldados - dano);

        if (terObj.proteccionTurnos > 0 && terObj.soldados <= 0) {
          terObj.soldados = 1; // Inmune a conquista por Muralla Inca
        }

        if (terObj.soldados <= 0) {
          // ¡CONQUISTA TERRITORIAL!
          territorioConquistado = true;
          this.turnoEstado.conquistasEnTurno++;
          terObj.propietarioId = at.id;
          terObj.propietarioNombre = at.nombre;
          terObj.propietarioColor = at.color;
          const tropasOcupacion = (this.dueloActual.efectosAtacante?.doblePuntuacion) ? 3 : 2;
          terObj.soldados = tropasOcupacion;

          if (terOri && terOri.soldados > 2) {
            terOri.soldados = Math.max(1, terOri.soldados - 1);
          }
          if (this.jugadores[at.id]) {
            this.jugadores[at.id].conquistasPartida = (this.jugadores[at.id].conquistasPartida || 0) + 1;
          }
        }
        terObj.bajoAtaque = false;
      }

      let multPuntos = this.dueloActual.efectosAtacante?.doblePuntuacion ? 2 : 1;
      puntosAtacanteDelta = Math.round(ptsBase * multDif * multPuntos) + (territorioConquistado ? (terObj?.puntosValor || 150) : 0);

      // Efecto Corsario (Robar puntos)
      if (this.dueloActual.efectosAtacante?.robarPuntos && this.jugadores[def.id]) {
        puntosRobados = Math.min(250, Math.round((this.jugadores[def.id].puntos || 0) * 0.15));
        this.jugadores[def.id].puntos = Math.max(0, (this.jugadores[def.id].puntos || 0) - puntosRobados);
        puntosAtacanteDelta += puntosRobados;
      }

      if (this.jugadores[at.id]) {
        this.jugadores[at.id].puntos = (this.jugadores[at.id].puntos || 0) + puntosAtacanteDelta;
        this.jugadores[at.id].aciertosPartida = (this.jugadores[at.id].aciertosPartida || 0) + 1;
      }
    } else if (ganoDefensor) {
      // ¡DEFENSA EXITOSA!
      bajasAtacante = parseInt(this.configuracion.bajasPorDerrotaAtacante) || 1;
      if (this.dueloActual.efectosAtacante?.escudoCombate) {
        bajasAtacante = 0;
        escudoAbsorbio = true;
      }
      if (terOri && bajasAtacante > 0) {
        terOri.soldados = Math.max(1, terOri.soldados - bajasAtacante);
      }
      if (terObj) {
        terObj.soldados += 1; // Bonificación moral por defensa heroica
        terObj.bajoAtaque = false;
      }

      let multPuntosDef = this.dueloActual.efectosDefensor?.doblePuntuacion ? 2 : 1;
      puntosDefensorDelta = Math.round(ptsBase * multDif * multPuntosDef);
      if (this.jugadores[def.id]) {
        this.jugadores[def.id].puntos = (this.jugadores[def.id].puntos || 0) + puntosDefensorDelta;
        this.jugadores[def.id].defensasPartida = (this.jugadores[def.id].defensasPartida || 0) + 1;
        this.jugadores[def.id].aciertosPartida = (this.jugadores[def.id].aciertosPartida || 0) + 1;
      }
    } else {
      // Ambos fallaron
      if (terObj) terObj.bajoAtaque = false;
    }

    this.recalcularEstadisticasTerritoriales();

    // Determinar si el atacante conserva el turno para seguir atacando (Ataques Consecutivos estilo Risk)
    const maxConsecutivos = parseInt(this.configuracion.maxAtaquesConsecutivos) || 5;
    const quedanObjetivos = this.obtenerTerritoriosAtacablesPorJugador(at.color).length > 0;
    const turnoContinua = Boolean(
      ganoAtacante &&
      this.configuracion.permitirAtaquesConsecutivos !== false &&
      this.turnoEstado.ataquesRealizados < maxConsecutivos &&
      quedanObjetivos
    );

    this.turnoEstado.puedeSeguirAtacando = turnoContinua;

    // Registrar en el historial de movimientos de la partida
    if (territorioConquistado && terObj) {
      this.registrarMovimiento(
        at.nombre,
        at.color,
        'CONQUISTA',
        terOri ? terOri.codigo : null,
        terObj.codigo,
        `⚔️ ¡${at.nombre} (${at.color.toUpperCase()}) conquistó ${terObj.nombre} derrotando a ${def.nombre}!`
      );
    } else if (ganoAtacante && terObj) {
      this.registrarMovimiento(
        at.nombre,
        at.color,
        'ATAQUE',
        terOri ? terOri.codigo : null,
        terObj.codigo,
        `💥 ${at.nombre} debilitó las defensas de ${terObj.nombre} (-${bajasDefensor} soldados).`
      );
    } else if (ganoDefensor && terObj) {
      this.registrarMovimiento(
        def.nombre,
        def.color,
        'DEFENSA',
        terOri ? terOri.codigo : null,
        terObj.codigo,
        `🛡️ ¡${def.nombre} defendió con éxito ${terObj.nombre} y rechazó la invasión de ${at.nombre}!`
      );
    }

    const victoriaPartida = this.verificarCondicionVictoria();

    return {
      turnoContinua,
      victoriaPartida,
      combateTerritorial: {
        territorioOrigen: terOri ? { codigo: terOri.codigo, nombre: terOri.nombre, soldadosAntes: soldadosAtacanteAntes, soldadosDespues: terOri.soldados } : null,
        territorioObjetivo: terObj ? {
          codigo: terObj.codigo,
          nombre: terObj.nombre,
          propietarioColor: terObj.propietarioColor,
          propietarioNombre: terObj.propietarioNombre,
          soldadosAntes: soldadosDefensorAntes,
          soldadosDespues: terObj.soldados
        } : null,
        bajasAtacante,
        bajasDefensor,
        territorioConquistado,
        defensaExitosa: ganoDefensor,
        escudoAbsorbio,
        puntosRobados,
        puntosAtacanteDelta,
        puntosDefensorDelta
      }
    };
  }

  verificarCondicionVictoria() {
    const listaJug = Object.values(this.jugadores);
    const todosTer = Object.values(this.territorios);
    if (listaJug.length < 2 || todosTer.length === 0) return null;

    // 1. Victoria por Dominación Territorial (>= 80% de los territorios del mapa)
    for (const j of listaJug) {
      const propios = todosTer.filter(t => t.propietarioColor === j.color).length;
      if (propios >= Math.ceil(todosTer.length * 0.80)) {
        return {
          ganador: { id: j.id, nombre: j.nombre, color: j.color, puntos: j.puntos, territorios: propios },
          motivo: `¡DOMINACIÓN IMPERIAL! Conquistó ${propios} de ${todosTer.length} territorios del mapa.`
        };
      }
    }

    // 2. Victoria por Límite de Rondas completadas
    const maxRondas = parseInt(this.configuracion.rondasMaximasPartida) || 12;
    if (this.rondaActual > maxRondas) {
      const ordenados = [...listaJug].sort((a, b) => (b.puntos + b.territoriosCount * 150) - (a.puntos + a.territoriosCount * 150));
      const camp = ordenados[0];
      return {
        ganador: { id: camp.id, nombre: camp.nombre, color: camp.color, puntos: camp.puntos, territorios: camp.territoriosCount },
        motivo: `¡FIN DE LAS ${maxRondas} RONDAS! Mayor puntuación imperial combinada.`
      };
    }

    return null;
  }

  reiniciarPartidaCompleta() {
    this.rondaActual = 1;
    this.indiceTurnoActual = 0;
    this.preguntasUsadasIds = [];
    this.categoriasRecientes = [];
    this.historialMovimientos = [];
    Object.values(this.jugadores).forEach(j => {
      j.puntos = 300;
      j.conquistasPartida = 0;
      j.defensasPartida = 0;
      j.aciertosPartida = 0;
      j.comodines = this.construirInventarioInicialComodines();
    });
    this.repartirTerritorios();
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
      modoMapa: this.configuracion.modoMapa,
      rondaActual: this.rondaActual,
      rondasMaximas: this.configuracion.rondasMaximasPartida || 12,
      atacanteId: atacante ? atacante.id : null,
      atacanteNombre: atacante ? atacante.nombre : null,
      atacanteColor: atacante ? atacante.color : null,
      ataquesRealizados: this.turnoEstado.ataquesRealizados,
      maxAtaquesConsecutivos: this.configuracion.maxAtaquesConsecutivos || 5,
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
