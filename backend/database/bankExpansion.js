// =========================================================================
// EXPANSIÓN DE BANCOS VERIFICADOS (PERÚ Y MUNDO) - SIN DUPLICADOS
// =========================================================================

function mezclarOpcionesDeterministico(correctaTexto, incorrectas, semilla) {
  const letras = ['A', 'B', 'C', 'D'];
  const posCorrecta = semilla % 4;
  const opciones = [];
  let idxInc = 0;
  for (let i = 0; i < 4; i++) {
    if (i === posCorrecta) {
      opciones.push(correctaTexto);
    } else {
      opciones.push(incorrectas[idxInc++]);
    }
  }
  return {
    opcion_a: opciones[0],
    opcion_b: opciones[1],
    opcion_c: opciones[2],
    opcion_d: opciones[3],
    correcta: letras[posCorrecta]
  };
}

function generarExpansionPeru(inicioId = 500) {
  const lista = [];
  let seq = inicioId;

  function add(cat, sub, dif, preg, ok, i1, i2, i3, exp, reg = 'Perú') {
    const m = mezclarOpcionesDeterministico(ok, [i1, i2, i3], seq * 13 + preg.length);
    lista.push({
      codigo_unico: `PE-${String(seq++).padStart(4, '0')}`,
      tipo: 'opcion_multiple',
      categoria: cat,
      subcategoria: sub,
      dificultad: dif,
      pregunta: preg,
      opcion_a: m.opcion_a,
      opcion_b: m.opcion_b,
      opcion_c: m.opcion_c,
      opcion_d: m.opcion_d,
      correcta: m.correcta,
      anio_min: null,
      anio_max: null,
      explicacion: exp,
      region_referencia: reg,
      fuente_verificacion: 'Enciclopedia del Perú / Ministerio de Cultura',
      fecha_referencia: '2026'
    });
  }

  // Platos regionales verificados por departamento
  const platosRegionales = [
    { dep: 'Amazonas', plato: 'el Purtumute y el Juane de yuca', dif: 'avanzado' },
    { dep: 'Áncash', plato: 'el Picante de cuy huaracino y el Llunca kashki', dif: 'intermedio' },
    { dep: 'Apurímac', plato: 'el Tallarín de casa abanquino con kapchi de chuño', dif: 'avanzado' },
    { dep: 'Arequipa', plato: 'el Rocoto relleno con pastel de papa y el Chupe de camarones', dif: 'basico' },
    { dep: 'Ayacucho', plato: 'la Puca picante y el Mondongo ayacuchano', dif: 'intermedio' },
    { dep: 'Cajamarca', plato: 'el Caldo verde con quesillo con miel', dif: 'intermedio' },
    { dep: 'Cusco', plato: 'el Chiriuchu y el Kapchi de habas', dif: 'intermedio' },
    { dep: 'Huancavelica', plato: 'el Mondongo huancavelicano y la Pachamanca de cordero', dif: 'avanzado' },
    { dep: 'Huánuco', plato: 'el Locro de gallina huanuqueño y los Prestinos', dif: 'intermedio' },
    { dep: 'Ica', plato: 'la Carapulcra chinchana con Sopa seca (Manchapecho)', dif: 'basico' },
    { dep: 'Junín', plato: 'la Papa a la huancaína y la Trucha frita del Ingenio', dif: 'basico' },
    { dep: 'La Libertad', plato: 'el Shámbar trujillano y el Seco de cabrito con frijoles', dif: 'basico' },
    { dep: 'Lambayeque', plato: 'el Arroz con pato a la chiclayana y el Espesado', dif: 'basico' },
    { dep: 'Lima', plato: 'la Causa limeña, los Anticuchos y el Suspiro a la limeña', dif: 'basico' },
    { dep: 'Loreto', plato: 'la Patarashca amazónica y el Inchicapi de gallina con maní', dif: 'intermedio' },
    { dep: 'Madre de Dios', plato: 'el Asado de picuro y el Timbuche amazónico', dif: 'avanzado' },
    { dep: 'Moquegua', plato: 'la Patasca moqueguana y el Cuy frito con maíz', dif: 'intermedio' },
    { dep: 'Pasco', plato: 'el Caldo de cabeza cerreño y el Charquicán', dif: 'avanzado' },
    { dep: 'Piura', plato: 'el Seco de chabelo, el Majado de yuca y la Malarrabia', dif: 'basico' },
    { dep: 'Puno', plato: 'el Chairo puneño, el Cancacho ayavireño y el Pesque de quinua', dif: 'intermedio' },
    { dep: 'San Martín', plato: 'el Tacacho con cecina y el Avispa juane', dif: 'basico' },
    { dep: 'Tacna', plato: 'el Picante a la tacneña y el Adobo tacneño', dif: 'basico' },
    { dep: 'Tumbes', plato: 'el Ceviche de conchas negras y el Chilcano tumbesino', dif: 'basico' },
    { dep: 'Ucayali', plato: 'la Ensalada de chonta (palmito) y el Juane ucayalino', dif: 'intermedio' }
  ];

  platosRegionales.forEach((p, idx) => {
    const otros = platosRegionales.filter((_, i) => i !== idx);
    add(
      'gastronomia_peruana',
      'Cocina Regional',
      p.dif,
      `¿De qué departamento del Perú son platos típicos representativos ${p.plato}?`,
      p.dep,
      otros[(idx + 3) % otros.length].dep,
      otros[(idx + 6) % otros.length].dep,
      otros[(idx + 11) % otros.length].dep,
      `La gastronomía de ${p.dep} se distingue tradicionalmente por ${p.plato}.`,
      p.dep
    );
  });

  // Atractivos turísticos y arqueológicos por región
  const atractivosRegionales = [
    { dep: 'Amazonas', atr: 'la Catarata de Gocta y los Sarcófagos de Karajía', dif: 'intermedio' },
    { dep: 'Áncash', atr: 'el Parque Nacional Huascarán y la Laguna 69', dif: 'basico' },
    { dep: 'Apurímac', atr: 'el Santuario Nacional del Ampay y el Cañón del Apurímac', dif: 'intermedio' },
    { dep: 'Arequipa', atr: 'el Valle del Colca y el Volcán Misti', dif: 'basico' },
    { dep: 'Ayacucho', atr: 'el Santuario Histórico de la Pampa de Ayacucho y las aguas turquesas de Millpu', dif: 'intermedio' },
    { dep: 'Cajamarca', atr: 'el Cuarto del Rescate y los Baños del Inca', dif: 'basico' },
    { dep: 'Cusco', atr: 'la fortaleza ceremonial de Sacsayhuamán y el Valle Sagrado de los Incas', dif: 'basico' },
    { dep: 'Huancavelica', atr: 'la histórica Mina de Santa Bárbara y el complejo inca de Huaytará', dif: 'avanzado' },
    { dep: 'Huánuco', atr: 'el Templo de las Manos Cruzadas de Kotosh y la Bella Durmiente en Tingo María', dif: 'basico' },
    { dep: 'Ica', atr: 'la Reserva Nacional de Paracas y las Islas Ballestas', dif: 'basico' },
    { dep: 'Junín', atr: 'el Nevado Huaytapallana y el Convento de Santa Rosa de Ocopa', dif: 'intermedio' },
    { dep: 'La Libertad', atr: 'las Huacas del Sol y de la Luna y el balneario de Huanchaco con caballitos de totora', dif: 'basico' },
    { dep: 'Lambayeque', atr: 'el Museo Tumbas Reales de Sipán y las Pirámides de Túcume', dif: 'basico' },
    { dep: 'Lima', atr: 'el Santuario Arqueológico de Pachacámac y el Castillo de Chancay', dif: 'basico' },
    { dep: 'Loreto', atr: 'la Reserva Nacional Pacaya Samiria y el Río Amazonas', dif: 'basico' },
    { dep: 'Madre de Dios', atr: 'la Reserva Nacional Tambopata y el Parque Nacional del Manu', dif: 'intermedio' },
    { dep: 'Moquegua', atr: 'el Cerro Baúl y el puerto de Ilo', dif: 'intermedio' },
    { dep: 'Pasco', atr: 'la colonia austro-alemana de Pozuzo y el Parque Nacional Yanachaga-Chemillén', dif: 'intermedio' },
    { dep: 'Piura', atr: 'las playas de Máncora y Colán y la laguna de Las Huaringas', dif: 'basico' },
    { dep: 'Puno', atr: 'las Islas Flotantes de los Uros y el portal lítico de Aramu Muru', dif: 'basico' },
    { dep: 'San Martín', atr: 'las Cataratas de Ahuashiyacu y la Laguna Azul de Sauce', dif: 'intermedio' },
    { dep: 'Tacna', atr: 'el Paseo Cívico con el Arco Parabólico y el Campo de la Alianza', dif: 'basico' },
    { dep: 'Tumbes', atr: 'el Santuario Nacional Los Manglares de Tumbes y Punta Sal', dif: 'basico' },
    { dep: 'Ucayali', atr: 'la Laguna de Yarinacocha y el Velo de la Novia del Boquerón del Padre Abad', dif: 'intermedio' }
  ];

  atractivosRegionales.forEach((a, idx) => {
    const otros = atractivosRegionales.filter((_, i) => i !== idx);
    add(
      'turismo_lugares_peru',
      'Patrimonio Regional',
      a.dif,
      `¿En qué departamento del Perú se localizan ${a.atr}?`,
      a.dep,
      otros[(idx + 2) % otros.length].dep,
      otros[(idx + 7) % otros.length].dep,
      otros[(idx + 12) % otros.length].dep,
      `${a.atr} son atractivos emblemáticos del departamento de ${a.dep}.`,
      a.dep
    );
  });

  // Obras literarias peruanas verificadas
  const obrasLiterariasPeru = [
    { obra: '"La ciudad y los perros"', autor: 'Mario Vargas Llosa', dif: 'basico' },
    { obra: '"Conversación en La Catedral"', autor: 'Mario Vargas Llosa', dif: 'intermedio' },
    { obra: '"El mundo es ancho y ajeno"', autor: 'Ciro Alegría', dif: 'basico' },
    { obra: '"Los perros hambrientos"', autor: 'Ciro Alegría', dif: 'intermedio' },
    { obra: '"La serpiente de oro"', autor: 'Ciro Alegría', dif: 'intermedio' },
    { obra: '"Un mundo para Julius"', autor: 'Alfredo Bryce Echenique', dif: 'basico' },
    { obra: '"Paco Yunque"', autor: 'César Vallejo', dif: 'basico' },
    { obra: '"Poemas humanos"', autor: 'César Vallejo', dif: 'intermedio' },
    { obra: '"Los gallinazos sin plumas"', autor: 'Julio Ramón Ribeyro', dif: 'basico' },
    { obra: '"Redoble por Rancas"', autor: 'Manuel Scorza', dif: 'avanzado' },
    { obra: '"La casa de cartón"', autor: 'Martín Adán (Rafael de la Fuente Benavides)', dif: 'avanzado' },
    { obra: '"Simbólicas" (1911)', autor: 'José María Eguren', dif: 'avanzado' },
    { obra: '"Ña Catita"', autor: 'Manuel Ascencio Segura', dif: 'intermedio' },
    { obra: '"Un viaje" (El niño Goyito)', autor: 'Felipe Pardo y Aliaga', dif: 'intermedio' },
    { obra: '"Pájinas libres" y "Horas de lucha"', autor: 'Manuel González Prada', dif: 'intermedio' },
    { obra: '"Cuentos andinos" y "Matalaché"', autor: 'Enrique López Albújar', dif: 'avanzado' }
  ];

  obrasLiterariasPeru.forEach((lit, idx) => {
    const otros = ['Mario Vargas Llosa', 'César Vallejo', 'Ciro Alegría', 'Julio Ramón Ribeyro', 'José María Arguedas', 'Abraham Valdelomar', 'Ricardo Palma', 'Alfredo Bryce Echenique'].filter(a => a !== lit.autor);
    add(
      'literatura_peruana',
      'Obras Clásicas',
      lit.dif,
      `¿Qué escritor peruano es el autor de la obra literaria ${lit.obra}?`,
      lit.autor,
      otros[idx % otros.length],
      otros[(idx + 1) % otros.length],
      otros[(idx + 2) % otros.length],
      `${lit.obra} fue escrita por el autor peruano ${lit.autor}.`,
      'Perú'
    );
  });

  // Sapa Incas y su legado
  const incasLegado = [
    { inca: 'Manco Cápac', hecho: 'fundar el Curacazgo del Cusco y levantar el Inticancha junto a Mama Ocllo', dif: 'basico' },
    { inca: 'Sinchi Roca', hecho: 'ser el segundo gobernante inca e instituir el uso de la Mascaipacha', dif: 'intermedio' },
    { inca: 'Inca Roca', hecho: 'ser el primer gobernante de la dinastía Hanan Cusco y fundar el Yachayhuasi (Casa del Saber)', dif: 'avanzado' },
    { inca: 'Pachacútec', hecho: 'derrotar a los Chancas, dividir el imperio en cuatro suyos y ordenar construir Machu Picchu', dif: 'basico' },
    { inca: 'Túpac Yupanqui', hecho: 'conquistar el Reino Chimú, expandir el imperio hasta el río Maule (Chile) y navegar hacia Oceanía', dif: 'intermedio' },
    { inca: 'Huayna Cápac', hecho: 'llevar el Tahuantinsuyo a su máxima extensión norte en Pasto y embellecer Tomebamba', dif: 'intermedio' },
    { inca: 'Huáscar', hecho: 'ser coronado en el Cusco como hijo legítimo de Huayna Cápac y enfrentarse en guerra civil a su hermano Atahualpa', dif: 'basico' },
    { inca: 'Manco Inca', hecho: 'iniciar el gran cerco del Cusco en 1536 y establecer el reducto rebelde de Vilcabamba', dif: 'intermedio' }
  ];

  incasLegado.forEach((inc, idx) => {
    const otros = incasLegado.filter((_, i) => i !== idx);
    add(
      'imperio_incaico',
      'Gobernantes del Tahuantinsuyo',
      inc.dif,
      `¿A qué gobernante inca se le atribuye históricamente ${inc.hecho}?`,
      inc.inca,
      otros[(idx + 1) % otros.length].inca,
      otros[(idx + 2) % otros.length].inca,
      otros[(idx + 3) % otros.length].inca,
      `${inc.inca} destacó en la historia incaica por ${inc.hecho}.`,
      'Cusco'
    );
  });

  return lista;
}

function generarExpansionMundo(inicioId = 500) {
  const lista = [];
  let seq = inicioId;

  function add(cat, sub, dif, preg, ok, i1, i2, i3, exp, pais = 'Mundial') {
    const m = mezclarOpcionesDeterministico(ok, [i1, i2, i3], seq * 17 + preg.length);
    lista.push({
      codigo_unico: `MU-${String(seq++).padStart(4, '0')}`,
      tipo: 'opcion_multiple',
      categoria: cat,
      subcategoria: sub,
      dificultad: dif,
      pregunta: preg,
      opcion_a: m.opcion_a,
      opcion_b: m.opcion_b,
      opcion_c: m.opcion_c,
      opcion_d: m.opcion_d,
      correcta: m.correcta,
      anio_min: null,
      anio_max: null,
      explicacion: exp,
      pais_referencia: pais,
      fuente_verificacion: 'Enciclopedia Universal / IUPAC / FIFA / UNESCO',
      fecha_referencia: '2026'
    });
  }

  // Elementos químicos verificados
  const elementosQuimicos = [
    { nombre: 'Hidrógeno', simbolo: 'H', num: 1, dif: 'basico' },
    { nombre: 'Carbono', simbolo: 'C', num: 6, dif: 'basico' },
    { nombre: 'Oxígeno', simbolo: 'O', num: 8, dif: 'basico' },
    { nombre: 'Sodio', simbolo: 'Na', num: 11, dif: 'intermedio' },
    { nombre: 'Hierro', simbolo: 'Fe', num: 26, dif: 'basico' },
    { nombre: 'Cobre', simbolo: 'Cu', num: 29, dif: 'basico' },
    { nombre: 'Plata', simbolo: 'Ag', num: 47, dif: 'intermedio' },
    { nombre: 'Estaño', simbolo: 'Sn', num: 50, dif: 'avanzado' },
    { nombre: 'Tungsteno (Wolframio)', simbolo: 'W', num: 74, dif: 'avanzado' },
    { nombre: 'Platino', simbolo: 'Pt', num: 78, dif: 'intermedio' },
    { nombre: 'Plomo', simbolo: 'Pb', num: 82, dif: 'intermedio' },
    { nombre: 'Uranio', simbolo: 'U', num: 92, dif: 'intermedio' },
    { nombre: 'Potasio', simbolo: 'K', num: 19, dif: 'intermedio' },
    { nombre: 'Antimonio', simbolo: 'Sb', num: 51, dif: 'avanzado' }
  ];

  elementosQuimicos.forEach((el, idx) => {
    const otros = elementosQuimicos.filter((_, i) => i !== idx);
    add(
      'fisica_quimica',
      'Elementos Químicos',
      el.dif,
      `¿Cuál es el símbolo químico oficial del elemento ${el.nombre} (número atómico ${el.num})?`,
      el.simbolo,
      otros[(idx + 1) % otros.length].simbolo,
      otros[(idx + 3) % otros.length].simbolo,
      otros[(idx + 5) % otros.length].simbolo,
      `En la Tabla Periódica de la IUPAC, el símbolo de ${el.nombre} (Z=${el.num}) es ${el.simbolo}.`
    );
  });

  // Obras maestras de la Literatura Universal
  const obrasUniversales = [
    { obra: '"La Odisea"', autor: 'Homero', pais: 'Grecia', dif: 'basico' },
    { obra: '"Los miserables"', autor: 'Victor Hugo', pais: 'Francia', dif: 'basico' },
    { obra: '"Guerra y paz"', autor: 'León Tolstói', pais: 'Rusia', dif: 'intermedio' },
    { obra: '"El principito"', autor: 'Antoine de Saint-Exupéry', pais: 'Francia', dif: 'basico' },
    { obra: '"Orgullo y prejuicio"', autor: 'Jane Austen', pais: 'Reino Unido', dif: 'intermedio' },
    { obra: '"Don Juan Tenorio"', autor: 'José Zorrilla', pais: 'España', dif: 'avanzado' },
    { obra: '"El viejo y el mar"', autor: 'Ernest Hemingway', pais: 'Estados Unidos', dif: 'basico' },
    { obra: '"Ficciones" y "El Aleph"', autor: 'Jorge Luis Borges', pais: 'Argentina', dif: 'intermedio' },
    { obra: '"Rayuela"', autor: 'Julio Cortázar', pais: 'Argentina', dif: 'intermedio' },
    { obra: '"Pedro Páramo"', autor: 'Juan Rulfo', pais: 'México', dif: 'intermedio' },
    { obra: '"Veinte poemas de amor y una canción desesperada"', autor: 'Pablo Neruda', pais: 'Chile', dif: 'basico' },
    { obra: '"Fausto"', autor: 'Johann Wolfgang von Goethe', pais: 'Alemania', dif: 'avanzado' },
    { obra: '"Ulises" (1922)', autor: 'James Joyce', pais: 'Irlanda', dif: 'avanzado' },
    { obra: '"En busca del tiempo perdido"', autor: 'Marcel Proust', pais: 'Francia', dif: 'avanzado' }
  ];

  obrasUniversales.forEach((ob, idx) => {
    const otros = obrasUniversales.filter((_, i) => i !== idx);
    add(
      'literatura_universal',
      'Grandes Obras',
      ob.dif,
      `¿Quién es el autor de la célebre obra de la literatura universal ${ob.obra}?`,
      ob.autor,
      otros[(idx + 2) % otros.length].autor,
      otros[(idx + 4) % otros.length].autor,
      otros[(idx + 6) % otros.length].autor,
      `${ob.obra} fue escrita por ${ob.autor} (${ob.pais}).`,
      ob.pais
    );
  });

  // Finales históricas de los Mundiales de Fútbol
  const mundialesFutbol = [
    { edicion: 'Suecia 1958', campeon: 'Brasil', sub: 'Suecia', dif: 'intermedio' },
    { edicion: 'Inglaterra 1966', campeon: 'Inglaterra', sub: 'Alemania Federal', dif: 'intermedio' },
    { edicion: 'México 1970', campeon: 'Brasil', sub: 'Italia', dif: 'basico' },
    { edicion: 'Argentina 1978', campeon: 'Argentina', sub: 'Países Bajos', dif: 'intermedio' },
    { edicion: 'España 1982', campeon: 'Italia', sub: 'Alemania Federal', dif: 'intermedio' },
    { edicion: 'México 1986', campeon: 'Argentina', sub: 'Alemania Federal', dif: 'basico' },
    { edicion: 'Francia 1998', campeon: 'Francia', sub: 'Brasil', dif: 'basico' },
    { edicion: 'Corea-Japón 2002', campeon: 'Brasil', sub: 'Alemania', dif: 'basico' },
    { edicion: 'Alemania 2006', campeon: 'Italia', sub: 'Francia', dif: 'intermedio' },
    { edicion: 'Sudáfrica 2010', campeon: 'España', sub: 'Países Bajos', dif: 'basico' },
    { edicion: 'Brasil 2014', campeon: 'Alemania', sub: 'Argentina', dif: 'basico' },
    { edicion: 'Rusia 2018', campeon: 'Francia', sub: 'Croacia', dif: 'basico' }
  ];

  mundialesFutbol.forEach((m, idx) => {
    const otros = ['Brasil', 'Alemania', 'Italia', 'Argentina', 'Francia', 'España', 'Inglaterra', 'Uruguay', 'Países Bajos'].filter(c => c !== m.campeon);
    add(
      'futbol_mundial',
      'Historia de los Mundiales',
      m.dif,
      `¿Qué selección nacional se consagró campeona en la Copa Mundial de la FIFA de ${m.edicion} tras vencer en la final a ${m.sub}?`,
      m.campeon,
      otros[idx % otros.length],
      otros[(idx + 1) % otros.length],
      otros[(idx + 2) % otros.length],
      `En la final del Mundial de ${m.edicion}, ${m.campeon} venció a ${m.sub}.`,
      m.campeon
    );
  });

  return lista;
}

module.exports = {
  generarExpansionPeru,
  generarExpansionMundo
};
