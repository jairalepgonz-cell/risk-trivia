// =========================================================================
// BANCO ESPECIALIZADO E INDEPENDIENTE DE PREGUNTAS DEL PERÚ
// 21 Categorías Oficiales x 3 Niveles (Básico, Intermedio, Avanzado) + Aproximación
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

function generarBancoPeru() {
  const preguntas = [];
  let contador = 1;

  function agregarOM(categoria, subcategoria, dificultad, pregunta, correctaTexto, inc1, inc2, inc3, explicacion, region = 'Perú', fuente = 'Archivo Histórico Nacional / INEI / Ministerio de Cultura', fechaRef = '2026') {
    const mix = mezclarOpcionesDeterministico(correctaTexto, [inc1, inc2, inc3], contador * 7 + pregunta.length);
    preguntas.push({
      codigo_unico: `PE-${String(contador++).padStart(4, '0')}`,
      tipo: 'opcion_multiple',
      categoria,
      subcategoria,
      dificultad,
      pregunta,
      opcion_a: mix.opcion_a,
      opcion_b: mix.opcion_b,
      opcion_c: mix.opcion_c,
      opcion_d: mix.opcion_d,
      correcta: mix.correcta,
      anio_min: null,
      anio_max: null,
      explicacion,
      region_referencia: region,
      fuente_verificacion: fuente,
      fecha_referencia: fechaRef
    });
  }

  function agregarAprox(categoria, subcategoria, dificultad, pregunta, valorExacto, min, max, explicacion, region = 'Perú', fuente = 'Archivo Histórico del Perú') {
    preguntas.push({
      codigo_unico: `PE-APX-${String(contador++).padStart(4, '0')}`,
      tipo: 'aproximacion',
      categoria,
      subcategoria,
      dificultad,
      pregunta,
      opcion_a: '',
      opcion_b: '',
      opcion_c: '',
      opcion_d: '',
      correcta: String(valorExacto),
      anio_min: min,
      anio_max: max,
      explicacion,
      region_referencia: region,
      fuente_verificacion: fuente,
      fecha_referencia: '2026'
    });
  }

  // =======================================================================
  // 1. HISTORIA DEL PERÚ (historia_peru)
  // =======================================================================
  agregarOM('historia_peru', 'República', 'basico', '¿En qué año se proclamó la Independencia del Perú en la Plaza Mayor de Lima?', '1821', '1824', '1810', '1830', 'José de San Martín proclamó la independencia del Perú en Lima el 28 de julio de 1821.', 'Lima');
  agregarOM('historia_peru', 'Guerra del Pacífico', 'basico', '¿Cómo se llamó el monitor blindado comandado por el almirante Miguel Grau?', 'Huáscar', 'Independencia', 'Unión', 'Manco Cápac', 'El monitor Huáscar fue el buque insignia comandado por Miguel Grau Seminario en 1879.', 'Piura / Callao');
  agregarOM('historia_peru', 'República', 'basico', '¿Qué presidente peruano decretó la abolición de la esclavitud y del tributo indígena en 1854?', 'Ramón Castilla', 'José Balta', 'Nicolás de Piérola', 'Augusto B. Leguía', 'El mariscal Ramón Castilla abolió el tributo indígena en Ayacucho y la esclavitud en Huancayo en 1854.', 'Junín');
  agregarOM('historia_peru', 'Siglo XIX', 'intermedio', '¿Cómo denominó el historiador Jorge Basadre a la época de bonanza económica del guano en el siglo XIX?', 'La Prosperidad Falaz', 'La Patria Nueva', 'La República Aristocrática', 'El Oncenio', 'Jorge Basadre acuñó el término "Prosperidad Falaz" para describir el auge guanero entre 1845 y 1872.', 'Perú');
  agregarOM('historia_peru', 'Confederación', 'intermedio', '¿Quién fue el Supremo Protector de la Confederación Perú-Boliviana (1836-1839)?', 'Andrés de Santa Cruz', 'Agustín Gamarra', 'Felipe Santiago Salaverry', 'Luis José de Orbegoso', 'El mariscal Andrés de Santa Cruz lideró la Confederación Perú-Boliviana hasta la batalla de Yungay.', 'Perú');
  agregarOM('historia_peru', 'Siglo XX', 'intermedio', '¿Con qué nombre se conoce al gobierno de once años de Augusto B. Leguía entre 1919 y 1930?', 'El Oncenio (Patria Nueva)', 'El Ochenio', 'El Docenio Militar', 'La Convivencia', 'Augusto B. Leguía gobernó de 1919 a 1930 bajo el lema de la "Patria Nueva".', 'Lima');
  agregarOM('historia_peru', 'Tratados', 'avanzado', '¿Mediante qué tratado de 1883 se puso fin a la Guerra del Pacífico entre Perú y Chile?', 'Tratado de Ancón', 'Tratado de Lima', 'Tratado Salomón-Lozano', 'Tratado Velarde-Río Branco', 'El Tratado de Ancón fue firmado el 20 de octubre de 1883.', 'Lima');
  agregarOM('historia_peru', 'Siglo XIX', 'avanzado', '¿Quién fue el primer presidente civil en la historia republicana del Perú, elegido en 1872?', 'Manuel Pardo y Lavalle', 'José Pardo y Barreda', 'Francisco García Calderón', 'Manuel Candamo', 'Manuel Pardo y Lavalle, fundador del Partido Civil, asumió la presidencia en 1872.', 'Lima');
  agregarOM('historia_peru', 'República', 'avanzado', '¿En qué batalla de 1839 fue derrotada definitivamente la Confederación Perú-Boliviana?', 'Batalla de Yungay', 'Batalla de Socabaya', 'Batalla de Ingavi', 'Batalla de Uchumayo', 'La Batalla de Yungay (Áncash) el 20 de enero de 1839 disolvió la Confederación.', 'Áncash');

  // =======================================================================
  // 2. GEOGRAFÍA DEL PERÚ (geografia_peru)
  // =======================================================================
  agregarOM('geografia_peru', 'Relieve', 'basico', '¿Cuál es el nevado más alto del Perú, con 6768 metros sobre el nivel del mar?', 'Huascarán', 'Yerupajá', 'Ausangate', 'Coropuna', 'El nevado Huascarán, en la Cordillera Blanca (Áncash), es la cumbre más alta del Perú.', 'Áncash');
  agregarOM('geografia_peru', 'Hidrografía', 'basico', '¿Cuál es el lago navegable más alto del mundo, compartido por Perú y Bolivia?', 'Lago Titicaca', 'Lago Junín (Chinchaycocha)', 'Laguna de Llanganuco', 'Laguna de Choclococha', 'El Lago Titicaca se ubica en la meseta del Collao a unos 3812 m s. n. m.', 'Puno');
  agregarOM('geografia_peru', 'Hidrografía', 'basico', '¿En qué departamento del Perú nace geográficamente el río Amazonas (quebrada Apacheta - nevado Mismi)?', 'Arequipa', 'Loreto', 'Cusco', 'Ucayali', 'El origen más remoto del río Amazonas se ubica en las faldas del nevado Mismi, en Arequipa.', 'Arequipa');
  agregarOM('geografia_peru', 'Regiones Naturales', 'intermedio', '¿Qué geógrafo peruano propuso la clasificación de las Ocho Regiones Naturales del Perú?', 'Javier Pulgar Vidal', 'Antonio Brack Egg', 'Antonio Raimondi', 'Mateo Paz Soldán', 'Javier Pulgar Vidal presentó su tesis de las 8 regiones naturales (Chala, Yunga, Quechua, Suni, Puna, Janca, Rupa-Rupa y Omagua) en 1938.', 'Huánuco');
  agregarOM('geografia_peru', 'Ecorregiones', 'intermedio', '¿Cuántas ecorregiones identificó el ecólogo peruano Antonio Brack Egg en el territorio nacional?', '11 ecorregiones', '8 ecorregiones', '24 ecorregiones', '5 ecorregiones', 'Antonio Brack Egg clasificó al Perú en 11 ecorregiones marinas, costeras, andinas y amazónicas.', 'Perú');
  agregarOM('geografia_peru', 'Cañones', 'intermedio', '¿En qué departamento se ubica el Cañón de Cotahuasi, uno de los más profundos del planeta?', 'Arequipa', 'Áncash', 'Apurímac', 'Huancavelica', 'El Cañón de Cotahuasi se encuentra en la provincia de La Unión, departamento de Arequipa.', 'Arequipa');
  agregarOM('geografia_peru', 'Puntos Extremos', 'avanzado', '¿Cuál es la depresión más profunda de la costa peruana, situada a 37 metros bajo el nivel del mar?', 'Depresión de Bayóvar (Sechura)', 'Depresión de Otuma', 'Depresión de Salinas', 'Depresión de Chilca', 'La depresión de Bayóvar, en Piura, alcanza los -37 m b. n. m.', 'Piura');
  agregarOM('geografia_peru', 'Volcanes', 'avanzado', '¿Cuál es el volcán más alto del Perú con 6425 m s. n. m.?', 'Coropuna', 'Misti', 'Sabancaya', 'Ubinas', 'El volcán Coropuna, ubicado en Arequipa, es el más alto del Perú.', 'Arequipa');
  agregarOM('geografia_peru', 'Hidrografía', 'avanzado', '¿Qué río forma el Pongo de Manseriche al atravesar la Cordillera Oriental de los Andes?', 'Río Marañón', 'Río Huallaga', 'Río Urubamba', 'Río Mantaro', 'El río Marañón forma el imponente Pongo de Manseriche entre Amazonas y Loreto.', 'Amazonas / Loreto');

  // =======================================================================
  // 3. CULTURA Y TRADICIONES (cultura_tradiciones_peru)
  // =======================================================================
  agregarOM('cultura_tradiciones_peru', 'Danzas', 'basico', '¿Qué danza peruana de cortejo con pañuelos es considerada baile nacional y tiene su capital en Trujillo?', 'La Marinera', 'El Huaylarsh', 'El Tondero', 'El Festejo', 'La Marinera es Patrimonio Cultural de la Nación y Trujillo celebra su Concurso Nacional.', 'La Libertad');
  agregarOM('cultura_tradiciones_peru', 'Artesanía', 'basico', '¿De qué localidad del Cusco o Puno son emblemáticos los "Toritos de Pucará" colocados en los techos para la prosperidad?', 'Pucará (Puno)', 'Pisac (Cusco)', 'Quinoa (Ayacucho)', 'Chulucanas (Piura)', 'Los Toritos de Pucará son piezas cerámicas originarias del distrito de Pucará en Puno.', 'Puno');
  agregarOM('cultura_tradiciones_peru', 'Artesanía', 'basico', '¿Qué región es mundialmente célebre por sus coloridos Retablos andinos en cajas de madera?', 'Ayacucho', 'Cajamarca', 'Tacna', 'Tumbes', 'El Retablo Ayacuchano es Patrimonio Cultural de la Nación y símbolo del arte popular peruano.', 'Ayacucho');
  agregarOM('cultura_tradiciones_peru', 'Patrimonio UNESCO', 'intermedio', '¿Qué danza ritual acrobática ejecutada con arpa y violín en el sur andino fue declarada Patrimonio Inmaterial por la UNESCO?', 'La Danza de las Tijeras', 'La Diablada', 'Los Shapish', 'La Chonguinada', 'La Danza de las Tijeras (originaria de Ayacucho, Huancavelica y Apurímac) fue inscrita por la UNESCO en 2010.', 'Ayacucho / Huancavelica');
  agregarOM('cultura_tradiciones_peru', 'Cerámica', 'intermedio', '¿De qué provincia de Piura es famosa la cerámica de tonos negros y blancos trabajada con técnica de paleteado?', 'Chulucanas (Morropón)', 'Catacaos', 'Paita', 'Ayabaca', 'La cerámica de Chulucanas destaca por su bruñido y técnica ancestral Vicús-Tallán.', 'Piura');
  agregarOM('cultura_tradiciones_peru', 'Textilería', 'intermedio', '¿Qué isla del lago Titicaca fue reconocida por la UNESCO por la maestría del arte textil de sus varones tejedores?', 'Isla de Taquile', 'Isla Amantaní', 'Isla Soto', 'Isla Suasi', 'El arte textil de Taquile fue proclamado Obra Maestra del Patrimonio Oral e Inmaterial de la Humanidad.', 'Puno');
  agregarOM('cultura_tradiciones_peru', 'Ingeniería Tradicional', 'avanzado', '¿Cómo se llama el último puente colgante inca de fibra vegetal (ichu) que se renueva anualmente en Cusco?', 'Puente Q’eswachaka', 'Puente Chakanto', 'Puente Kimiri', 'Puente de Piedra', 'El puente Q’eswachaka sobre el río Apurímac en Canas (Cusco) se renueva cada junio mediante trabajo comunitario (minka).', 'Cusco');
  agregarOM('cultura_tradiciones_peru', 'Tradición Oral', 'avanzado', '¿En qué provincia de Lima se conserva el uso ancestral de las "Tablas de Sarhua" pintadas por migrantes ayacuchanos y en la propia comunidad de Víctor Fajardo?', 'Víctor Fajardo (Ayacucho) / Chorrillos', 'Cajatambo', 'Yauyos', 'Huarochirí', 'Las Tablas de Sarhua son originarias del distrito de Sarhua, provincia de Víctor Fajardo (Ayacucho).', 'Ayacucho');
  agregarOM('cultura_tradiciones_peru', 'Lenguas Originarias', 'avanzado', '¿Cuál es la familia lingüística amazónica con mayor número de hablantes en el Perú, a la que pertenece el idioma Asháninka?', 'Familia Arawak', 'Familia Pano', 'Familia Jíbaro', 'Familia Bora', 'El asháninka pertenece a la familia lingüística Arawak y es la lengua amazónica más hablada del Perú.', 'Junín / Ucayali');

  // =======================================================================
  // 4. GASTRONOMÍA PERUANA (gastronomia_peruana)
  // =======================================================================
  agregarOM('gastronomia_peruana', 'Platos Bandera', 'basico', '¿Cuál es el plato bandera del Perú preparado con pescado fresco marinado en jugo de limón, cebolla roja y ají limo?', 'Ceviche', 'Lomo saltado', 'Causa limeña', 'Anticuchos', 'El Ceviche peruano fue declarado Patrimonio Cultural Inmaterial de la Humanidad por la UNESCO en 2023.', 'Costa Peruana');
  agregarOM('gastronomia_peruana', 'Bebidas', 'basico', '¿Con qué aguardiente de uva peruano se prepara el tradicional cóctel Pisco Sour?', 'Pisco', 'Cañazo', 'Chicha de jora', 'Algarrobina', 'El Pisco es el destilado de uva con denominación de origen peruana.', 'Ica / Lima');
  agregarOM('gastronomia_peruana', 'Selva', 'basico', '¿Cómo se llama el plato tradicional de la Amazonía peruana envuelto en hojas de bijao que simboliza la cabeza de San Juan Bautista?', 'Juane', 'Tacacho con cecina', 'Inchicapi', 'Patarashca', 'El Juane de arroz y gallina es el plato emblemático de la fiesta de San Juan en la selva peruana.', 'Loreto / San Martín');
  agregarOM('gastronomia_peruana', 'Andes', 'intermedio', '¿Cómo se denomina el método milenario de cocción bajo tierra con piedras calientes, carnes, papas, habas y humitas?', 'Pachamanca', 'Huatia', 'Kankacho', 'Chairo', 'La Pachamanca ("olla de tierra" en quechua) es una tradición culinaria panandina.', 'Sierra Central');
  agregarOM('gastronomia_peruana', 'Norte', 'intermedio', '¿Qué sopa tradicional trujillana a base de trigo, menestras y pellejo de cerdo se consume tradicionalmente solo los días lunes?', 'Shámbar', 'Sopa teóloga', 'Caldo verde', 'Chupe de viernes', 'El Shámbar es el plato tradicional de los lunes en Trujillo y La Libertad.', 'La Libertad');
  agregarOM('gastronomia_peruana', 'Arequipa', 'intermedio', '¿Cómo se llaman los tradicionales establecimientos gastronómicos de Arequipa y Cusco donde se sirve chicha de güiñapo y rocoto relleno?', 'Picanterías', 'Chicherías norteñas', 'Pulperías', 'Huariques', 'Las Picanterías arequipeñas y cusqueñas son Patrimonio Cultural de la Nación.', 'Arequipa');
  agregarOM('gastronomia_peruana', 'Cusco', 'avanzado', '¿Cuál es el plato frío emblemático de la fiesta del Corpus Christi en el Cusco que combina cuy, gallina, chalona, cochayuyo, torreja y rocoto?', 'Chiriuchu', 'Timpu o Puchero', 'Kapchi de setas', 'Soltero de queso', 'El Chiriuchu ("ají frío" en quechua) integra productos de costa, sierra y selva para el Corpus Christi cusqueño.', 'Cusco');
  agregarOM('gastronomia_peruana', 'Insumos', 'avanzado', '¿Cuál es el nombre científico de la quinua, grano andino domesticado alrededor del lago Titicaca?', 'Chenopodium quinoa', 'Solanum tuberosum', 'Zea mays', 'Lepidium meyenii', 'Chenopodium quinoa es el nombre botánico de la quinua andina.', 'Puno');
  agregarOM('gastronomia_peruana', 'Historia Culinaria', 'avanzado', '¿Cómo se llamaba la influencia gastronómica de los inmigrantes japoneses fusionada con los ingredientes peruanos?', 'Cocina Nikkei', 'Cocina Chifa', 'Cocina Novoandina', 'Cocina Criolla', 'La cocina Nikkei nació de la fusión culinaria peruano-japonesa (como el tiradito).', 'Lima');

  // =======================================================================
  // 5. LITERATURA PERUANA (literatura_peruana)
  // =======================================================================
  agregarOM('literatura_peruana', 'Premio Nobel', 'basico', '¿Qué escritor peruano nacido en Arequipa ganó el Premio Nobel de Literatura en el año 2010?', 'Mario Vargas Llosa', 'Alfredo Bryce Echenique', 'Julio Ramón Ribeyro', 'Ciro Alegría', 'Mario Vargas Llosa recibió el Premio Nobel de Literatura en 2010 por obras como "La ciudad y los perros" y "Conversación en La Catedral".', 'Arequipa');
  agregarOM('literatura_peruana', 'Poesía', 'basico', '¿Quién es el poeta universal nacido en Santiago de Chuco, autor de "Los heraldos negros" y "Trilce"?', 'César Vallejo', 'José María Eguren', 'Carlos Augusto Salaverry', 'José Santos Chocano', 'César Vallejo (1892-1938) es considerado el máximo poeta del Perú.', 'La Libertad');
  agregarOM('literatura_peruana', 'Cuento', 'basico', '¿Quién escribió el célebre cuento "El Caballero Carmelo"?', 'Abraham Valdelomar', 'Ricardo Palma', 'Enrique López Albújar', 'Ventura García Calderón', 'Abraham Valdelomar, el "Conde de Lemos", publicó "El Caballero Carmelo" en 1913.', 'Ica');
  agregarOM('literatura_peruana', 'Costumbrismo y Tradición', 'intermedio', '¿Qué escritor peruano, conocido como el "Bibliotecario Mendigo", escribió las "Tradiciones peruanas"?', 'Ricardo Palma', 'Manuel Ascencio Segura', 'Felipe Pardo y Aliaga', 'Clorinda Matto de Turner', 'Ricardo Palma reconstruyó la Biblioteca Nacional tras la Guerra del Pacífico y creó las Tradiciones peruanas.', 'Lima');
  agregarOM('literatura_peruana', 'Indigenismo', 'intermedio', '¿Quién es el autor de "Los ríos profundos", "Yawar Fiesta" y "Todas las sangres"?', 'José María Arguedas', 'Ciro Alegría', 'Manuel Scorza', 'Eleodoro Vargas Vicuña', 'José María Arguedas retrató con profundidad el mundo andino y quechua.', 'Apurímac');
  agregarOM('literatura_peruana', 'Generación del 50', 'intermedio', '¿Cómo se titula la recopilación de cuentos de Julio Ramón Ribeyro?', 'La palabra del mudo', 'Un mundo para Julius', 'El mundo es ancho y ajeno', 'Cuentos andinos', '"La palabra del mudo" reúne la obra cuentística de Julio Ramón Ribeyro.', 'Lima');
  agregarOM('literatura_peruana', 'Crónicas', 'avanzado', '¿Quién fue el cronista mestizo cusqueño autor de los "Comentarios Reales de los Incas" publicados en 1609?', 'Inca Garcilaso de la Vega', 'Felipe Guamán Poma de Ayala', 'Juan de Santa Cruz Pachacuti', 'Pedro Cieza de León', 'Gómez Suárez de Figueroa, el Inca Garcilaso de la Vega, publicó la primera parte de los Comentarios Reales en Lisboa en 1609.', 'Cusco');
  agregarOM('literatura_peruana', 'Siglo XIX', 'avanzado', '¿Qué escritora cusqueña publicó en 1889 la novela "Aves sin nido", precursora del indigenismo literario?', 'Clorinda Matto de Turner', 'Mercedes Cabello de Carbonera', 'Flora Tristán', 'Juana Manuela Gorriti', 'Clorinda Matto de Turner denunció los abusos contra los indígenas en "Aves sin nido".', 'Cusco');
  agregarOM('literatura_peruana', 'Vanguardismo', 'avanzado', '¿Qué poeta puneño escribió el innovador libro caligramático "5 metros de poemas" (1927)?', 'Carlos Oquendo de Amat', 'Alejandro Peralta', 'Martín Adán', 'Emilio Adolfo Westphalen', 'Carlos Oquendo de Amat publicó "5 metros de poemas", obra cumbre de la vanguardia peruana.', 'Puno');

  // =======================================================================
  // 6. PERSONAJES HISTÓRICOS (personajes_historicos_peru)
  // =======================================================================
  agregarOM('personajes_historicos_peru', 'Héroes Nacionales', 'basico', '¿Qué héroe nacional pronunció la frase: "Tengo deberes sagrados que cumplir y los cumpliré hasta quemar el último cartucho"?', 'Francisco Bolognesi', 'Miguel Grau', 'Andrés Avelino Cáceres', 'Alfonso Ugarte', 'El coronel Francisco Bolognesi dio esta respuesta antes de la batalla de Arica el 7 de junio de 1880.', 'Tacna / Arica');
  agregarOM('personajes_historicos_peru', 'Héroes Nacionales', 'basico', '¿Con qué apelativo fue conocido el mariscal Andrés Avelino Cáceres por su campaña de resistencia en la sierra?', 'El Brujo de los Andes', 'El Caballero de los Mares', 'El Soldado de la Ley', 'El Califa', 'Andrés Avelino Cáceres lideró la Campaña de la Breña y fue llamado "El Brujo de los Andes" y "Taita Cáceres".', 'Ayacucho');
  agregarOM('personajes_historicos_peru', 'Aviación', 'basico', '¿Quién realizó el primer vuelo exitoso a través de los Alpes en 1910 a bordo de su monoplano Bleriot XI?', 'Jorge Chávez Dartnell', 'José Abelardo Quiñones', 'Pedro Paulet', 'Carlos Tenaud', 'El aviador peruano Jorge Chávez cruzó los Alpes el 23 de septiembre de 1910 pronunciando: "Arriba, siempre arriba".', 'Perú');
  agregarOM('personajes_historicos_peru', 'Medicina', 'intermedio', '¿Qué estudiante de medicina cerreño se inoculó la sangre de una paciente con verruga peruana para estudiar la enfermedad?', 'Daniel Alcides Carrión', 'Hipólito Unanue', 'Cayetano Heredia', 'Pedro Weiss', 'Daniel Alcides Carrión se inmoló el 5 de octubre de 1885 demostrando la unidad clínica de la fiebre de La Oroya y la verruga peruana.', 'Pasco');
  agregarOM('personajes_historicos_peru', 'Independencia', 'intermedio', '¿Qué pescador chorrillano prefirió morir fusilado antes que entregar las cartas de los patriotas diciendo: "Si mil vidas tuviera, gustoso las daría por mi patria"?', 'José Olaya Balandra', 'María Parado de Bellido', 'Mateo Pumacahua', 'Túpac Amaru II', 'José Olaya fue fusilado el 29 de junio de 1823 en el pasaje que hoy lleva su nombre en Lima.', 'Lima');
  agregarOM('personajes_historicos_peru', 'Heroínas', 'intermedio', '¿Qué heroína ayacuchana fue fusilada en 1822 por negarse a delatar a los patriotas que informaban al ejército libertador?', 'María Parado de Bellido', 'Micaela Bastidas', 'Francisca Zubiaga ("La Mariscala")', 'Antonia Moreno de Cáceres', 'María Parado de Bellido fue ejecutada por las fuerzas realistas de Carratalá en Huamanga en 1822.', 'Ayacucho');
  agregarOM('personajes_historicos_peru', 'Pensadores', 'avanzado', '¿Quién fue el autor de los "Siete ensayos de interpretación de la realidad peruana" (1928)?', 'José Carlos Mariátegui', 'Víctor Raúl Haya de la Torre', 'Manuel González Prada', 'Víctor Andrés Belaunde', 'José Carlos Mariátegui ("El Amauta"), nacido en Moquegua, publicó los Siete ensayos en 1928.', 'Moquegua');
  agregarOM('personajes_historicos_peru', 'Historia', 'avanzado', '¿Qué historiador tacneño escribió la monumental obra "Historia de la República del Perú"?', 'Jorge Basadre Grohmann', 'Raúl Porras Barrenechea', 'María Rostworowski', 'Pablo Macera', 'Jorge Basadre Grohmann (1903-1980) es el máximo historiador de la etapa republicana del Perú.', 'Tacna');
  agregarOM('personajes_historicos_peru', 'Arqueología', 'avanzado', '¿Quién es considerado el "Padre de la Arqueología Peruana", descubridor de las culturas Chavín y Paracas?', 'Julio C. Tello', 'Federico Kauffmann Doig', 'Luis Guillermo Lumbreras', 'Walter Alva', 'Julio César Tello Rojas, nacido en Huarochirí, descubrió Chavín (1919) y Paracas (1925).', 'Lima');

  // =======================================================================
  // 7. POLÍTICA E INSTITUCIONES DEL PERÚ (politica_instituciones_peru)
  // =======================================================================
  agregarOM('politica_instituciones_peru', 'Poderes del Estado', 'basico', '¿Cuántos congresistas integran el Congreso unicameral según el esquema vigente en las elecciones de principios del siglo XXI antes de la reforma bicameral?', '130 congresistas', '120 congresistas', '100 congresistas', '150 congresistas', 'El Congreso de la República estuvo conformado por 130 congresistas elegidos por distrito múltiple.', 'Lima');
  agregarOM('politica_instituciones_peru', 'Constitución', 'basico', '¿De qué año data la Constitución Política del Perú actualmente vigente?', '1993', '1979', '1933', '1920', 'La Constitución Política vigente fue promulgada el 29 de diciembre de 1993.', 'Perú');
  agregarOM('politica_instituciones_peru', 'Organismos Electorales', 'basico', '¿Qué organismo autónomo se encarga de organizar y ejecutar los procesos electorales en el Perú?', 'ONPE', 'SUNAT', 'INDECOPI', 'OSIPTEL', 'La Oficina Nacional de Procesos Electorales (ONPE) organiza los comicios junto al JNE y RENIEC.', 'Perú');
  agregarOM('politica_instituciones_peru', 'Derechos Ciudadanos', 'intermedio', '¿Qué institución constitucional autónoma supervisa el cumplimiento de los deberes de la administración estatal y defiende los derechos fundamentales de la persona?', 'La Defensoría del Pueblo', 'La Contraloría General', 'El Ministerio Público', 'La Junta Nacional de Justicia', 'La Defensoría del Pueblo fue creada por la Constitución de 1993.', 'Perú');
  agregarOM('politica_instituciones_peru', 'Control Fiscal', 'intermedio', '¿Cuál es el órgano superior del Sistema Nacional de Control encargado de supervisar la legalidad de la ejecución del presupuesto del Estado?', 'La Contraloría General de la República', 'El Banco Central de Reserva', 'La Superintendencia de Banca y Seguros', 'El Tribunal Fiscal', 'La Contraloría General de la República supervisa el uso correcto de los recursos públicos.', 'Perú');
  agregarOM('politica_instituciones_peru', 'Justicia Constitucional', 'intermedio', '¿Cuántos magistrados integran el Tribunal Constitucional del Perú?', '7 magistrados', '5 magistrados', '9 magistrados', '11 magistrados', 'El Tribunal Constitucional está integrado por 7 miembros elegidos por el Congreso con dos tercios de votos.', 'Lima / Arequipa');
  agregarOM('politica_instituciones_peru', 'Historia Constitucional', 'avanzado', '¿En qué año se promulgó la primera Constitución Política del Perú por el Primer Congreso Constituyente?', '1823', '1821', '1826', '1828', 'La primera Constitución Política de la República Peruana fue promulgada el 12 de noviembre de 1823.', 'Lima');
  agregarOM('politica_instituciones_peru', 'Diplomacia Internacional', 'avanzado', '¿Qué diplomático peruano fue Secretario General de la Organización de las Naciones Unidas (ONU) entre 1982 y 1991?', 'Javier Pérez de Cuéllar', 'Víctor Andrés Belaunde', 'José Luis Bustamante y Rivero', 'Allan Wagner', 'Javier Pérez de Cuéllar fue el quinto Secretario General de la ONU durante dos periodos.', 'Lima');
  agregarOM('politica_instituciones_peru', 'Derecho Internacional', 'avanzado', '¿Qué expresidente peruano llegó a presidir la Corte Internacional de Justicia de La Haya entre 1967 y 1970?', 'José Luis Bustamante y Rivero', 'Fernando Belaunde Terry', 'Valentín Paniagua', 'Francisco Morales Bermúdez', 'El jurista arequipeño José Luis Bustamante y Rivero presidió la Corte Internacional de Justicia de La Haya.', 'Arequipa');

  // =======================================================================
  // 8. ECONOMÍA PERUANA (economia_peruana)
  // =======================================================================
  agregarOM('economia_peruana', 'Moneda', 'basico', '¿Cuál es la unidad monetaria oficial del Perú administrada por el BCRP?', 'El Sol (PEN)', 'El Inti', 'El Sol de Oro', 'El Peso Peruano', 'La moneda oficial del Perú es el Sol (código ISO: PEN).', 'Perú');
  agregarOM('economia_peruana', 'Banca Central', 'basico', '¿Cuál es la finalidad constitucional del Banco Central de Reserva del Perú (BCRP)?', 'Preservar la estabilidad monetaria', 'Recaudar los impuestos nacionales', 'Aprobar el presupuesto anual del Congreso', 'Fijar los sueldos del sector privado', 'Según el artículo 84 de la Constitución, la finalidad del BCRP es preservar la estabilidad monetaria.', 'Perú');
  agregarOM('economia_peruana', 'Minería', 'basico', '¿De qué mineral metálico es el Perú uno de los dos mayores productores mundiales junto con Chile?', 'Cobre', 'Aluminio', 'Níquel', 'Titanio', 'El cobre es el principal producto de exportación minera del Perú.', 'Sur y Centro del Perú');
  agregarOM('economia_peruana', 'Historia Monetaria', 'intermedio', '¿Qué moneda circuló en el Perú entre 1985 y 1991 antes de ser reemplazada por el Nuevo Sol?', 'El Inti', 'La Libra Peruana', 'El Peso de Plata', 'El Escudo', 'El Inti reemplazó al Sol de Oro en 1985 y fue sustituido en 1991 debido a la hiperinflación.', 'Perú');
  agregarOM('economia_peruana', 'Agroexportación', 'intermedio', '¿En la exportación de qué fruta o baya se consolidó el Perú como líder mundial durante la última década?', 'Arándanos (y uva de mesa)', 'Manzanas', 'Kiwis', 'Cerezas', 'El Perú es el primer exportador mundial de arándanos y uvas de mesa.', 'La Libertad / Ica');
  agregarOM('economia_peruana', 'Energía', 'intermedio', '¿En qué departamento se ubica el gran yacimiento de gas natural de Camisea?', 'Cusco (La Convención)', 'Piura', 'Loreto', 'Ucayali', 'El proyecto de gas de Camisea se localiza en el bajo Urubamba, provincia de La Convención, Cusco.', 'Cusco');
  agregarOM('economia_peruana', 'Infraestructura Portuaria', 'avanzado', '¿En qué provincia al norte de Lima se ubica el Megapuerto de Chancay, nodo logístico transpacífico inaugurado en 2024?', 'Huaral (Chancay)', 'Cañete', 'Barranca', 'Huaura', 'El Terminal Portuario Multipropósito de Chancay está ubicado en el distrito de Chancay, provincia de Huaral.', 'Lima', 'MTC / APN', '2026');
  agregarOM('economia_peruana', 'Billetes', 'avanzado', '¿Qué destacada pintora indigenista aparece en el anverso del billete de 10 soles de la familia de diseños iniciada en 2021 junto a Chabuca Granda (10), Tilsa Tsuchiya (200) y María Rostworowski (50)?', 'Tilsa Tsuchiya está en el de 200 soles y Chabuca Granda en el de 10 soles', 'Santa Rosa de Lima en el nuevo de 10', 'Abraham Valdelomar en el nuevo de 200', 'Jorge Basadre en el nuevo de 10', 'En la nueva familia de billetes del BCRP: Chabuca Granda (S/ 10), José María Arguedas (S/ 20), María Rostworowski (S/ 50), Pedro Paulet (S/ 100) y Tilsa Tsuchiya (S/ 200).', 'Perú', 'BCRP', '2026');
  agregarOM('economia_peruana', 'Pesca', 'avanzado', '¿Qué especie marina sostiene la mayor pesquería industrial de harina y aceite de pescado en el mar peruano?', 'La anchoveta (Engraulis ringens)', 'El bonito', 'La merluza', 'El perico', 'La anchoveta peruana (Engraulis ringens) es la base de la industria pesquera nacional.', 'Mar de Grau');

  // =======================================================================
  // 9. DEPORTES PERUANOS (deportes_peruanos)
  // =======================================================================
  agregarOM('deportes_peruanos', 'Juegos Olímpicos', 'basico', '¿En qué Juegos Olímpicos obtuvo la selección femenina de vóley del Perú la histórica medalla de plata?', 'Seúl 1988', 'Los Ángeles 1984', 'Barcelona 1992', 'Moscú 1980', 'Las "Matadoras" dirigidas por Man Bok Park ganaron la medalla de plata en Seúl 1988.', 'Perú');
  agregarOM('deportes_peruanos', 'Surf', 'basico', '¿Qué tablista peruana se coronó campeona mundial de surf de la ISA y WSL en 2004?', 'Sofía Mulánovich', 'Analí Gómez', 'Daniella Rosas', 'Sol Aguirre', 'Sofía Mulánovich logró el título mundial de surf en 2004 y fue ingresada al Salón de la Fama del Surf.', 'Lima');
  agregarOM('deportes_peruanos', 'Atletismo', 'basico', '¿Qué atleta huancaína es bicampeona mundial de marcha atlética (2022 y 2023)?', 'Kimberly García', 'Inés Melchor', 'Gladys Tejeda', 'Luz Mery Rojas', 'Kimberly García León ganó dos medallas de oro en el Mundial de Atletismo de Eugene 2022.', 'Junín');
  agregarOM('deportes_peruanos', 'Juegos Olímpicos', 'intermedio', '¿Quién ganó la única medalla de oro olímpica de la historia del Perú en tiro (Londres 1948)?', 'Edwin Vásquez Cam', 'Francisco Boza', 'Juan Giha', 'Stefano Peschiera', 'Edwin Vásquez Cam ganó el oro olímpico en pistola libre a 50 metros en Londres 1948.', 'Lima');
  agregarOM('deportes_peruanos', 'Juegos Olímpicos Recientes', 'intermedio', '¿En qué disciplina náutica ganó Stefano Peschiera la medalla de bronce para el Perú en los Juegos Olímpicos de París 2024?', 'Vela (Dinghy / Laser ILCA 7)', 'Remo individual', 'Surf masculino', 'Esquí acuático', 'Stefano Peschiera obtuvo la medalla de bronce en vela (ILCA 7) en París 2024, rompiendo 32 años sin medallas olímpicas.', 'Lima', 'COI / IPD', '2026');
  agregarOM('deportes_peruanos', 'Tenis', 'intermedio', '¿Qué tenista nacido en Arequipa representó al Perú y luego ganó Wimbledon y la Copa Davis en los años 50, dando nombre al estadio del Lawn Tennis?', 'Alejandro "Cacique" Olmedo', 'Jaime Yzaga', 'Luis Horna', 'Juan Pablo Varillas', 'Alejandro Olmedo nació en Arequipa y fue número 2 del mundo y campeón de Wimbledon en 1959.', 'Arequipa');
  agregarOM('deportes_peruanos', 'Ajedrez', 'avanzado', '¿Quién fue el primer Gran Maestro Internacional de ajedrez del Perú y de Iberoamérica (1982)?', 'Julio Granda Zúñiga', 'Emilio Córdova', 'Jorge Cori', 'Deysi Cori', 'Julio Granda, nacido en Camaná (Arequipa), obtuvo el título de Gran Maestro en 1986 (tras Esteban Canal).', 'Arequipa');
  agregarOM('deportes_peruanos', 'Boxeo', 'avanzado', '¿Qué boxeadora peruana conquistó el título mundial superpluma de la AMB en 2012?', 'Kina Malpartida', 'Linda Lecca', 'Alberto "Chiquito" Rossel', 'Mauro Mina', 'Kina "Dinamita" Malpartida fue campeona mundial superpluma de la AMB desde 2009 hasta 2013.', 'Lima');
  agregarOM('deportes_peruanos', 'Tiro Olímpico', 'avanzado', '¿Qué tiradores peruanos ganaron medallas de plata olímpicas en Los Ángeles 1984 y Barcelona 1992 respectivamente?', 'Francisco Boza y Juan Giha', 'Edwin Vásquez y Nicolás Pacheco', 'Marko Carrillo y Alessandro de Souza', 'Juan Giha y Edwin Vásquez', 'Francisco Boza ganó plata en fosa olímpica (1984) y Juan Giha plata en skeet (1992).', 'Lima');

  // =======================================================================
  // 10. FÚTBOL PERUANO (futbol_peruano)
  // =======================================================================
  agregarOM('futbol_peruano', 'Selección Nacional', 'basico', '¿Quién es el máximo goleador histórico de la Selección Peruana de Fútbol junto a Teófilo Cubillas y Jefferson Farfán en el podio?', 'Paolo Guerrero', 'Claudio Pizarro', 'Teodoro "Lolo" Fernández', 'Nolberto Solano', 'Paolo Guerrero lidera la tabla histórica de goleadores de la selección peruana con 40 goles.', 'Lima');
  agregarOM('futbol_peruano', 'Torneos Internacionales', 'basico', '¿Qué club cusqueño hizo historia al ganar la Copa Sudamericana 2003 y la Recopa Sudamericana 2004?', 'Cienciano', 'Real Garcilaso', 'Melgar', 'Universitario de Deportes', 'El Club Cienciano del Cusco venció a River Plate en 2003 y a Boca Juniors en 2004.', 'Cusco');
  agregarOM('futbol_peruano', 'Mundiales', 'basico', '¿A qué Copa del Mundo clasificó el Perú en noviembre de 2017 tras 36 años de ausencia?', 'Rusia 2018', 'Brasil 2014', 'Qatar 2022', 'Sudáfrica 2010', 'Dirigida por Ricardo Gareca, la selección peruana clasificó al Mundial de Rusia 2018 tras vencer a Nueva Zelanda.', 'Perú');
  agregarOM('futbol_peruano', 'Copa América', 'intermedio', '¿En qué años se consagró campeona de la Copa América la Selección Peruana de Fútbol?', '1939 y 1975', '1930 y 1970', '1949 y 1979', '1975 y 2019', 'Perú ganó el Campeonato Sudamericano de 1939 en Lima y la Copa América de 1975 venciendo a Colombia.', 'Perú');
  agregarOM('futbol_peruano', 'Ídolos', 'intermedio', '¿Qué futbolista peruano anotó 10 goles en las Copas del Mundo (5 en México 70 y 5 en Argentina 78)?', 'Teófilo "El Nene" Cubillas', 'Hugo "Cholo" Sotil', 'César Cueto', 'Héctor Chumpitaz', 'Teófilo Cubillas anotó 10 goles mundialistas y fue elegido Mejor Jugador Joven en México 1970.', 'Lima');
  agregarOM('futbol_peruano', 'Clubes', 'intermedio', '¿Quién es el máximo ídolo histórico de Universitario de Deportes, apodado "El Cañonero"?', 'Teodoro "Lolo" Fernández', 'Héctor Chumpitaz', 'Roberto Chale', 'José Luis Carranza', 'Teodoro "Lolo" Fernández jugó toda su carrera en Universitario y fue campeón y goleador de la Copa América 1939.', 'Ica / Lima');
  agregarOM('futbol_peruano', 'Historia Mundialista', 'avanzado', '¿Quién anotó el primer gol de la Selección Peruana en la historia de los Mundiales (Uruguay 1930 ante Rumania)?', 'Luis de Souza Ferreira', 'Alejandro Villanueva', 'Teodoro Fernández', 'Alberto Terry', 'El ingeniero y futbolista Luis de Souza Ferreira anotó el primer gol mundialista de Perú el 14 de julio de 1930.', 'Lima');
  agregarOM('futbol_peruano', 'Copa América 1975', 'avanzado', '¿Qué delantero peruano que jugaba en el FC Barcelona anotó el gol del título en la final de la Copa América 1975 en Caracas?', 'Hugo "El Cholo" Sotil', 'Percy Rojas', 'Juan Carlos Oblitas', 'Oswaldo "Cachito" Ramírez', 'Hugo Sotil marcó el 1-0 definitivo ante Colombia en el Estadio Olímpico de Caracas el 28 de octubre de 1975.', 'Ica');
  agregarOM('futbol_peruano', 'Fútbol Regional', 'avanzado', '¿En qué año ganó el FBC Melgar de Arequipa su primer campeonato descentralizado nacional con el recordado gol de Genaro Neyra?', '1981', '1971', '2015', '1985', 'FBC Melgar se coronó campeón nacional por primera vez en 1981 (y luego en 2015).', 'Arequipa');

  // =======================================================================
  // 11. TURISMO Y LUGARES HISTÓRICOS (turismo_lugares_peru)
  // =======================================================================
  agregarOM('turismo_lugares_peru', 'Maravillas', 'basico', '¿En qué provincia del departamento del Cusco se encuentra la ciudadela inca de Machu Picchu?', 'Urubamba', 'Calca', 'Paucartambo', 'Quispicanchi', 'El Santuario Histórico de Machu Picchu se ubica en el distrito de Machu Picchu, provincia de Urubamba.', 'Cusco');
  agregarOM('turismo_lugares_peru', 'Costa Sur', 'basico', '¿En qué departamento se encuentra el famoso oasis de la Huacachina, rodeado de enormes dunas de arena?', 'Ica', 'Arequipa', 'Moquegua', 'Tacna', 'La laguna de Huacachina está situada a pocos kilómetros de la ciudad de Ica.', 'Ica');
  agregarOM('turismo_lugares_peru', 'Norte', 'basico', '¿En qué departamento se localiza la monumental fortaleza amurallada de Kuélap, construida por los Chachapoyas?', 'Amazonas', 'Cajamarca', 'San Martín', 'Lambayeque', 'Kuélap se ubica en la provincia de Luya, departamento de Amazonas.', 'Amazonas');
  agregarOM('turismo_lugares_peru', 'Arequipa', 'intermedio', '¿Cómo se llama el célebre complejo religioso virreinal de Arequipa construido en sillar blanco y rojo en 1579?', 'Monasterio de Santa Catalina', 'Convento de San Francisco', 'Monasterio de Santa Rosa', 'Convento de Santo Domingo', 'El Monasterio de Santa Catalina de Siena es una ciudadela colonial dentro de Arequipa.', 'Arequipa');
  agregarOM('turismo_lugares_peru', 'Cusco', 'intermedio', '¿Con qué nombre se conoce a la montaña de colores (5200 m s. n. m.) ubicada en la cordillera del Vilcanota en Cusco?', 'Vinicunca', 'Salkantay', 'Choquequirao', 'Waqrapukara', 'Vinicunca (Montaña de Siete Colores) debe sus franjas multicolores a su composición mineralógica sedimentaria.', 'Cusco');
  agregarOM('turismo_lugares_peru', 'Puno', 'intermedio', '¿Qué complejo arqueológico de Puno a orillas de la laguna Umayo destaca por sus torres funerarias cilíndricas llamadas "Chullpas"?', 'Sillustani', 'Pukara', 'Cutimbo', 'Inca Uyo', 'Las Chullpas de Sillustani pertenecieron a la cultura Kolla e Inca en Puno.', 'Puno');
  agregarOM('turismo_lugares_peru', 'Cusco', 'avanzado', '¿Qué ciudadela inca ubicada entre Cusco y Apurímac es llamada la "Hermana Sagrada de Machu Picchu"?', 'Choquequirao', 'Ollantaytambo', 'Pisac', 'Moray', 'Choquequirao ("Cuna de Oro") se alza sobre el cañón del río Apurímac.', 'Cusco');
  agregarOM('turismo_lugares_peru', 'Pasco', 'avanzado', '¿Cómo se llama el santuario nacional ubicado en Pasco a más de 4300 m s. n. m., famoso por su gigantesco bosque geológico de rocas volcánicas?', 'Bosque de Piedras de Huayllay', 'Marcahuasi', 'Pampachiri', 'Cumbemayo', 'El Santuario Nacional de Huayllay en Pasco es uno de los museos geológicos al aire libre más grandes del mundo.', 'Pasco');
  agregarOM('turismo_lugares_peru', 'Cajamarca', 'avanzado', '¿Qué sitio arqueológico de Cajamarca posee un acueducto hidráulico preincaico tallado en roca volcánica a 3500 m s. n. m.?', 'Cumbemayo', 'Ventanillas de Otuzco', 'Kuntur Wasi', 'Baños del Inca', 'El canal de Cumbemayo es una obra maestra de ingeniería hidráulica de unos 3000 años de antigüedad.', 'Cajamarca');

  // =======================================================================
  // 12. REGIONES, DEPARTAMENTOS Y PROVINCIAS (regiones_departamentos_peru)
  // =======================================================================
  const matrizDepartamentos = [
    { dep: 'Amazonas', cap: 'Chachapoyas', prov: 'Utcubamba (Bagua Grande)', rio: 'Marañón y Utcubamba' },
    { dep: 'Áncash', cap: 'Huaraz', prov: 'Santa (Chimbote)', rio: 'Santa' },
    { dep: 'Apurímac', cap: 'Abancay', prov: 'Andahuaylas', rio: 'Apurímac y Pachachaca' },
    { dep: 'Arequipa', cap: 'Arequipa', prov: 'Caylloma (Chivay)', rio: 'Chili y Majes' },
    { dep: 'Ayacucho', cap: 'Ayacucho (Huamanga)', prov: 'Huanta', rio: 'Pampas y Huarpa' },
    { dep: 'Cajamarca', cap: 'Cajamarca', prov: 'Jaén', rio: 'Chonta y Marañón' },
    { dep: 'Cusco', cap: 'Cusco', prov: 'La Convención (Quillabamba)', rio: 'Vilcanota - Urubamba' },
    { dep: 'Huancavelica', cap: 'Huancavelica', prov: 'Tayacaja (Pampas)', rio: 'Ichu y Mantaro' },
    { dep: 'Huánuco', cap: 'Huánuco', prov: 'Leoncio Prado (Tingo María)', rio: 'Huallaga' },
    { dep: 'Ica', cap: 'Ica', prov: 'Chincha', rio: 'Ica y Pisco' },
    { dep: 'Junín', cap: 'Huancayo', prov: 'Chanchamayo (La Merced)', rio: 'Mantaro y Perené' },
    { dep: 'La Libertad', cap: 'Trujillo', prov: 'Pacasmayo', rio: 'Moche y Chicama' },
    { dep: 'Lambayeque', cap: 'Chiclayo', prov: 'Ferreñafe', rio: 'Chancay - Reque' },
    { dep: 'Loreto', cap: 'Iquitos', prov: 'Alto Amazonas (Yurimaguas)', rio: 'Amazonas y Napo' },
    { dep: 'Madre de Dios', cap: 'Puerto Maldonado', prov: 'Tambopata', rio: 'Madre de Dios y Heath' },
    { dep: 'Moquegua', cap: 'Moquegua', prov: 'Ilo', rio: 'Osmore' },
    { dep: 'Pasco', cap: 'Cerro de Pasco', prov: 'Oxapampa', rio: 'Pozuzo y Palcazu' },
    { dep: 'Piura', cap: 'Piura', prov: 'Sullana', rio: 'Chira y Piura' },
    { dep: 'Puno', cap: 'Puno', prov: 'San Román (Juliaca)', rio: 'Ramis e Ilave' },
    { dep: 'San Martín', cap: 'Moyobamba', prov: 'San Martín (Tarapoto)', rio: 'Mayo y Huallaga' },
    { dep: 'Tacna', cap: 'Tacna', prov: 'Jorge Basadre', rio: 'Caplina y Sama' },
    { dep: 'Tumbes', cap: 'Tumbes', prov: 'Zarumilla', rio: 'Tumbes' },
    { dep: 'Ucayali', cap: 'Pucallpa', prov: 'Atalaya', rio: 'Ucayali y Aguaytía' }
  ];

  matrizDepartamentos.forEach((d, idx) => {
    const otros = matrizDepartamentos.filter((_, i) => i !== idx);
    agregarOM(
      'regiones_departamentos_peru',
      'Capitales Departamentales',
      idx % 3 === 0 ? 'basico' : 'intermedio',
      `¿Cuál es la ciudad capital del departamento de ${d.dep}?`,
      d.cap,
      otros[(idx + 1) % otros.length].cap,
      otros[(idx + 4) % otros.length].cap,
      otros[(idx + 7) % otros.length].cap,
      `La capital oficial del departamento de ${d.dep} es ${d.cap}.`,
      d.dep
    );
    agregarOM(
      'regiones_departamentos_peru',
      'Provincias del Perú',
      idx % 2 === 0 ? 'intermedio' : 'avanzado',
      `¿A qué departamento del Perú pertenece la provincia de ${d.prov}?`,
      d.dep,
      otros[(idx + 2) % otros.length].dep,
      otros[(idx + 5) % otros.length].dep,
      otros[(idx + 9) % otros.length].dep,
      `La provincia de ${d.prov} forma parte de la jurisdicción del departamento de ${d.dep}.`,
      d.dep
    );
  });

  agregarOM('regiones_departamentos_peru', 'Extensión Territorial', 'basico', '¿Cuál es el departamento más extenso del Perú, abarcando casi el 29% del territorio nacional?', 'Loreto', 'Ucayali', 'Cusco', 'Madre de Dios', 'Loreto tiene una superficie de 368 851 km², siendo el más grande del Perú.', 'Loreto');
  agregarOM('regiones_departamentos_peru', 'Extensión Territorial', 'intermedio', '¿Cuál es el departamento de menor extensión territorial del Perú (sin contar la Provincia Constitucional del Callao)?', 'Tumbes', 'Moquegua', 'Lambayeque', 'Tacna', 'Tumbes es el departamento más pequeño del Perú con 4669 km².', 'Tumbes');
  agregarOM('regiones_departamentos_peru', 'Fronteras', 'avanzado', '¿Qué departamento peruano tiene triple frontera internacional al limitar con Ecuador, Colombia y Brasil?', 'Loreto', 'Madre de Dios', 'Puno', 'Ucayali', 'Loreto limita al norte y este con Ecuador, Colombia y Brasil.', 'Loreto');

  // =======================================================================
  // 13. CIVILIZACIONES PREINCAICAS (civilizaciones_preincaicas)
  // =======================================================================
  agregarOM('civilizaciones_preincaicas', 'Caral', 'basico', '¿Cuál es considerada la civilización más antigua de América (3000 a. C.), ubicada en el valle de Supe al norte de Lima?', 'Caral', 'Chavín', 'Paracas', 'Moche', 'La Ciudad Sagrada de Caral, investigada por Ruth Shady, data de hace 5000 años.', 'Lima');
  agregarOM('civilizaciones_preincaicas', 'Nazca', 'basico', '¿Qué investigadora alemana dedicó su vida al estudio y conservación de las Líneas y Geoglifos de Nazca?', 'María Reiche', 'Ruth Shady', 'María Rostworowski', 'Victoria de la Jara', 'María Reiche, la "Dama de la Pampa", estudió y protegió las Líneas de Nazca durante décadas.', 'Ica');
  agregarOM('civilizaciones_preincaicas', 'Moche', 'basico', '¿En qué complejo arqueológico de Lambayeque descubrió el arqueólogo Walter Alva la tumba intacta del Señor de Sipán en 1987?', 'Huaca Rajada', 'Huaca de la Luna', 'Túcume', 'Batán Grande', 'El Señor de Sipán, gobernante mochica del siglo III d. C., fue hallado en Huaca Rajada.', 'Lambayeque');
  agregarOM('civilizaciones_preincaicas', 'Chavín', 'intermedio', '¿Cuál de estas esculturas líticas pertenece al templo de Chavín de Huántar en Áncash?', 'El Lanzón Monolítico', 'La Portada del Sol', 'El Monolito Ponce', 'El Monolito Bennett', 'El Lanzón Monolítico, la Estela Raimondi, el Obelisco Tello y las Cabezas Clavas son de Chavín.', 'Áncash');
  agregarOM('civilizaciones_preincaicas', 'Paracas', 'intermedio', '¿Por qué práctica médica craneana y por la finura de sus mantos funerarios destacó la cultura Paracas en Ica?', 'Trepanaciones craneanas', 'Momificación en hielo', 'Escritura en pallares', 'Orfebrería en platino', 'Los Paracas realizaron exitosas trepanaciones craneanas y tejieron los mantos más finos de América precolombina.', 'Ica');
  agregarOM('civilizaciones_preincaicas', 'Chimú', 'intermedio', '¿Cuál fue la capital del Reino Chimú, considerada la ciudad de adobe más grande de América precolombina?', 'Chan Chan', 'Pachacámac', 'Pikillacta', 'Cahuachi', 'Chan Chan, ubicada en Trujillo (La Libertad), fue la capital del Imperio Chimú conquistado luego por los Incas.', 'La Libertad');
  agregarOM('civilizaciones_preincaicas', 'Moche', 'avanzado', '¿Cómo se llama la gobernante mochica descubierta en 2006 en la Huaca Cao Viejo del Complejo El Brujo (La Libertad)?', 'La Señora de Cao', 'La Sacerdotisa de San José de Moro', 'La Dama de Ampato', 'La Dama de los Cuatro Tupus', 'La Señora de Cao demostró que las mujeres ejercieron el máximo poder político y religioso en la sociedad Moche.', 'La Libertad');
  agregarOM('civilizaciones_preincaicas', 'Wari', 'avanzado', '¿En qué departamento tuvo su núcleo central y capital el Imperio Wari (Horizonte Medio)?', 'Ayacucho', 'Apurímac', 'Huancavelica', 'Cusco', 'La ciudad capital de Wari se desarrolló a 22 km al noreste de la actual ciudad de Ayacucho.', 'Ayacucho');
  agregarOM('civilizaciones_preincaicas', 'Lambayeque / Sicán', 'avanzado', '¿A qué cultura preincaica del norte pertenece originalmente el famoso cuchillo ceremonial de oro llamado "Tumi" hallado en Batán Grande?', 'Cultura Lambayeque (Sicán)', 'Cultura Chavín', 'Cultura Recuay', 'Cultura Chincha', 'El Tumi de oro con la representación de Naylamp es una obra maestra de la orfebrería Lambayeque (Sicán).', 'Lambayeque');

  // =======================================================================
  // 14. IMPERIO INCAICO (imperio_incaico)
  // =======================================================================
  agregarOM('imperio_incaico', 'Organización', 'basico', '¿En cuántos "suyos" o regiones estaba dividido el Tahuantinsuyo?', '4 suyos (Chinchaysuyo, Antisuyo, Contisuyo y Collasuyo)', '2 suyos', '6 suyos', '12 suyos', 'Tahuantinsuyo significa en quechua "las cuatro regiones unidas entre sí".', 'Cusco');
  agregarOM('imperio_incaico', 'Registro', 'basico', '¿Cómo se llamaba el sistema de cuerdas con nudos de colores utilizado por los incas para la contabilidad y registro?', 'Quipu', 'Yupana', 'Chasqui', 'Tupu', 'El Quipu era manejado por los Quipucamayoc para llevar estadísticas y memoria histórica.', 'Andes');
  agregarOM('imperio_incaico', 'Comunicaciones', 'basico', '¿Cómo se llamaban los corredores mensajeros que recorrían el Qhapaq Ñan llevando encargos reales por relevos?', 'Chasquis', 'Mitimaes', 'Yanaconas', 'Tucuy Ricuy', 'Los Chasquis corrían entre tambos a lo largo de la red vial del Qhapaq Ñan.', 'Tahuantinsuyo');
  agregarOM('imperio_incaico', 'Gobernantes', 'intermedio', '¿Qué Sapa Inca venció a los Chancas en la batalla de Yahuarpampa e inició la gran expansión imperial y reconstrucción del Cusco?', 'Pachacútec', 'Huayna Cápac', 'Sinchi Roca', 'Lloque Yupanqui', 'Cusi Yupanqui asumió como Pachacútec ("El que transforma la tierra") en el siglo XV.', 'Cusco');
  agregarOM('imperio_incaico', 'Trabajo', 'intermedio', '¿Cómo se denominaba el sistema de reciprocidad y ayuda mutua familiar ("hoy por ti, mañana por mí") dentro del Ayllu?', 'Ayni', 'Mita', 'Minka', 'Chunca', 'El Ayni era la prestación recíproca de trabajo entre los miembros de un mismo ayllu.', 'Andes');
  agregarOM('imperio_incaico', 'Religión', 'intermedio', '¿Cómo se llamaba el templo principal del Cusco dedicado al dios Sol (Inti), sobre cuyos muros se edificó el Convento de Santo Domingo?', 'Coricancha', 'Sacsayhuamán', 'Tambomachay', 'Qenqo', 'El Coricancha ("Recinto de Oro") fue el santuario más sagrado del Imperio Incaico.', 'Cusco');
  agregarOM('imperio_incaico', 'Administración', 'avanzado', '¿Cómo se llamaba el funcionario visitador e inspector imperial cuyo nombre significa "el que todo lo ve"?', 'Tucuy Ricuy', 'Apunchic', 'Curaca', 'Auqui', 'El Tucuy Ricuy supervisaba en secreto a las autoridades provinciales en nombre del Sapa Inca.', 'Tahuantinsuyo');
  agregarOM('imperio_incaico', 'Resistencia de Vilcabamba', 'avanzado', '¿Quién fue el último de los cuatro Incas de la resistencia de Vilcabamba, ejecutado por orden del virrey Toledo en 1572?', 'Túpac Amaru I', 'Manco Inca', 'Sayri Túpac', 'Titu Cusi Yupanqui', 'Túpac Amaru I fue capturado y decapitado en la Plaza del Cusco en 1572, cerrando el ciclo de los Incas de Vilcabamba.', 'Cusco');
  agregarOM('imperio_incaico', 'Expansión', 'avanzado', '¿Bajo el reinado de qué Sapa Inca alcanzó el Tahuantinsuyo su máxima extensión territorial llegando hasta el río Ancasmayo (Colombia)?', 'Huayna Cápac', 'Túpac Yupanqui', 'Huiracocha', 'Yahuar Huácac', 'Huayna Cápac consolidó la frontera norte en Pasto (río Ancasmayo) antes de la guerra civil entre Huáscar y Atahualpa.', 'Tahuantinsuyo');

  // =======================================================================
  // 15. VIRREINATO DEL PERÚ (virreinato_peru)
  // =======================================================================
  agregarOM('virreinato_peru', 'Fundación', 'basico', '¿Qué rey de España creó el Virreinato del Perú mediante las Nuevas Leyes de Indias el 20 de noviembre de 1542?', 'Carlos I de España (Carlos V)', 'Felipe II', 'Carlos III', 'Fernando VII', 'El emperador Carlos V firmó en Barcelona las Leyes Nuevas que crearon el Virreinato del Perú en 1542.', 'Perú');
  agregarOM('virreinato_peru', 'Religión', 'basico', '¿Cuál era el nombre secular de Santa Rosa de Lima, primera santa de América canonizada en 1671?', 'Isabel Flores de Oliva', 'Rosa de Santa María', 'Ana de los Ángeles Monteagudo', 'Melchora Saravia', 'Isabel Flores de Oliva nació en Lima en 1586 y fue canonizada por el papa Clemente X en 1671.', 'Lima');
  agregarOM('virreinato_peru', 'Rebeliones', 'basico', '¿Cuál era el verdadero nombre de Túpac Amaru II, líder de la gran rebelión de 1780 en Tinta (Cusco)?', 'José Gabriel Condorcanqui Noguera', 'Juan Santos Atahualpa', 'Julián Apaza (Túpac Katari)', 'Mateo Pumacahua', 'José Gabriel Condorcanqui, cacique de Surimana, Pampamarca y Tungasuca, inició la gran rebelión el 4 de noviembre de 1780.', 'Cusco');
  agregarOM('virreinato_peru', 'Virreyes', 'intermedio', '¿Quién fue el quinto virrey del Perú (1569-1581), considerado el gran organizador del sistema administrativo, tributario y de la mita minera colonial?', 'Francisco de Toledo', 'Blasco Núñez Vela', 'Manuel de Amat y Junyent', 'Fernando de Abascal', 'El virrey Francisco de Toledo realizó la Visita General, reglamentó la mita de Potosí y las reducciones de indios.', 'Perú');
  agregarOM('virreinato_peru', 'Educación', 'intermedio', '¿En qué año fue fundada la Universidad Nacional Mayor de San Marcos, Decana de América, por Real Cédula?', '1551 (12 de mayo)', '1535', '1600', '1572', 'La Universidad de San Marcos fue fundada el 12 de mayo de 1551 en Lima.', 'Lima');
  agregarOM('virreinato_peru', 'Economía Colonial', 'intermedio', '¿Qué institución ubicada en España regulaba el monopolio comercial con el puerto del Callao durante los siglos XVI y XVII?', 'La Casa de Contratación de Sevilla', 'El Real y Supremo Consejo de Indias', 'La Real Audiencia de Lima', 'El Tribunal del Consulado', 'La Casa de Contratación de Sevilla controlaba el tráfico comercial y naviero con las Indias.', 'Callao');
  agregarOM('virreinato_peru', 'Arte Virreinal', 'avanzado', '¿Quién fue el pintor indígena cusqueño del siglo XVII, máximo exponente de la Escuela Cusqueña de pintura colonial?', 'Diego Quispe Tito', 'Basilio Santa Cruz Pumacallao', 'Bernardo Bitti', 'Mateo Pérez de Alesio', 'Diego Quispe Tito (1611-1681), nacido en San Sebastián (Cusco), lideró la Escuela Cusqueña.', 'Cusco');
  agregarOM('virreinato_peru', 'Rebeliones Amazónicas', 'avanzado', '¿Qué líder indígena dirigió desde 1742 una rebelión invicta en el Gran Pajonal (selva central) que expulsó a las misiones y tropas virreinales?', 'Juan Santos Atahualpa', 'Ignacio Torote', 'Pedro Vilcapaza', 'Túpac Katari', 'Juan Santos Atahualpa lideró la rebelión en la selva central (Chanchamayo, Oxapampa, Gran Pajonal) sin ser jamás derrotado.', 'Junín / Pasco');
  agregarOM('virreinato_peru', 'Primer Virrey', 'avanzado', '¿Quién fue el primer virrey del Perú, derrotado en la batalla de Iñaquito (1546) por los encomenderos rebeldes de Gonzalo Pizarro?', 'Blasco Núñez Vela', 'Antonio de Mendoza', 'Pedro de la Gasca', 'Andrés Hurtado de Mendoza', 'Blasco Núñez Vela llegó en 1544 para aplicar las Leyes Nuevas y murió en la batalla de Añaquito (Iñaquito) en 1546.', 'Perú');

  // =======================================================================
  // 16. INDEPENDENCIA DEL PERÚ (independencia_peru)
  // =======================================================================
  agregarOM('independencia_peru', 'Batallas Decisivas', 'basico', '¿Qué batalla librada el 9 de diciembre de 1824 en la Pampa de la Quinua selló definitivamente la Independencia del Perú y de América del Sur?', 'Batalla de Ayacucho', 'Batalla de Junín', 'Batalla de Maipú', 'Batalla de Pichincha', 'La Batalla de Ayacucho, comandada por Antonio José de Sucre, concluyó con la Capitulación de Ayacucho el 9 de diciembre de 1824.', 'Ayacucho');
  agregarOM('independencia_peru', 'Símbolos Patrios', 'basico', '¿Quiénes son los autores de la letra y la música del Himno Nacional del Perú (1821)?', 'José de la Torre Ugarte (letra) y José Bernardo Alcedo (música)', 'Rosa Merino y Claudio Rebagliati', 'Mariano Melgar y José Bernardo Alcedo', 'Faustino Sánchez Carrión y José de la Torre Ugarte', 'El himno compuesto por José Bernardo Alcedo y José de la Torre Ugarte fue cantado por primera vez por Rosa Merino en septiembre de 1821.', 'Lima');
  agregarOM('independencia_peru', 'Corriente Libertadora del Sur', 'basico', '¿En qué bahía del departamento de Ica desembarcó la Expedición Libertadora de José de San Martín el 8 de septiembre de 1820?', 'Bahía de Paracas', 'Bahía de Independencia', 'Puerto de Cerro Azul', 'Puerto de Huacho', 'San Martín desembarcó en Paracas (Pisco) y allí concibió la primera bandera del Perú.', 'Ica');
  agregarOM('independencia_peru', 'Precursores', 'intermedio', '¿Qué precursor arequipeño redactó la célebre "Carta a los españoles americanos" en 1791 exhortando a la independencia continental?', 'Juan Pablo Viscardo y Guzmán', 'Toribio Rodríguez de Mendoza', 'José Baquíjano y Carrillo', 'Hipólito Unanue', 'El jesuita pampacolquino Juan Pablo Viscardo y Guzmán escribió la "Carta a los españoles americanos", difundida por Francisco de Miranda.', 'Arequipa');
  agregarOM('independencia_peru', 'Batalla de Junín', 'intermedio', '¿Qué escuadrón de caballería peruano al mando de Isidoro Suárez e impulsado por la orden de Andrés Rázuri revirtió la Batalla de Junín el 6 de agosto de 1824?', 'Los Húsares del Perú (luego Húsares de Junín)', 'Los Granaderos a Caballo', 'El Batallón Voltígeros', 'La Legión Peruana de la Guardia', 'Por su carga victoriosa sin disparar un solo tiro, Simón Bolívar los rebautizó como "Húsares de Junín".', 'Junín');
  agregarOM('independencia_peru', 'Próceres', 'intermedio', '¿Qué poeta y patriota arequipeño, creador de los "Yaravíes", murió fusilado tras la batalla de Umachiri en 1815?', 'Mariano Melgar Valdivieso', 'Mateo Pumacahua', 'Francisco de Zela', 'Enrique Paillardelle', 'Mariano Melgar se unió a la rebelión de los hermanos Angulo y Pumacahua como auditor de guerra y fue fusilado a los 24 años.', 'Arequipa / Puno');
  agregarOM('independencia_peru', 'Ideólogos Republicanos', 'avanzado', '¿Qué precursor huamachuquino defendió el sistema republicano frente al proyecto monárquico firmando sus cartas como "El Solitario de Sayán"?', 'José Faustino Sánchez Carrión', 'Francisco Javier de Luna Pizarro', 'Bernardo Monteagudo', 'José de la Riva Agüero', 'José Faustino Sánchez Carrión fue el principal ideólogo de la República Peruana y ministro general de Bolívar.', 'La Libertad / Lima');
  agregarOM('independencia_peru', 'Primer Grito', 'avanzado', '¿Quién dio el primer grito de libertad en la ciudad de Tacna el 20 de junio de 1811?', 'Francisco Antonio de Zela', 'Juan José Crespo y Castillo', 'Enrique Paillardelle', 'Manuel Ubalde', 'Francisco Antonio de Zela lideró la primera insurrección autonomista en Tacna en junio de 1811.', 'Tacna');
  agregarOM('independencia_peru', 'Primer Presidente', 'avanzado', '¿Quién fue el primer Presidente de la República del Perú nombrado tras el Motín de Balconcillo en febrero de 1823?', 'José de la Riva Agüero y Sánchez Boquete', 'José Bernardo de Tagle (Torre Tagle)', 'José de La Mar', 'Manuel Salazar y Baquíjano', 'José de la Riva Agüero fue investido como el primer Presidente de la República el 28 de febrero de 1823.', 'Lima');

  // =======================================================================
  // 17. ACTUALIDAD PERUANA (actualidad_peruana)
  // =======================================================================
  agregarOM('actualidad_peruana', 'Transporte e Infraestructura', 'basico', '¿Cómo se llama el primer tren subterráneo del Perú cuyos primeros 5 kilómetros empezaron a operar en Lima entre Santa Anita y Evitamiento?', 'Línea 2 del Metro de Lima y Callao', 'Línea 1 del Metro de Lima', 'Metropolitano Norte', 'Tren de la Costa', 'La Línea 2 es el primer metro completamente subterráneo y automatizado del Perú.', 'Lima', 'MTC / ATU', '2026');
  agregarOM('actualidad_peruana', 'Gastronomía Mundial', 'basico', '¿Qué restaurante limeño dirigido por Virgilio Martínez y Pía León fue elegido el Mejor Restaurante del Mundo (N.º 1 en The World’s 50 Best Restaurants 2023)?', 'Central', 'Maido', 'Astrid & Gastón', 'Kjolle', 'El restaurante Central en Barranco (Lima) ocupó el puesto N.º 1 mundial en 2023 y Maido en 2025.', 'Lima', 'The World 50 Best', '2026');
  agregarOM('actualidad_peruana', 'Cumbres Internacionales', 'basico', '¿Qué foro económico de las 21 economías del Asia-Pacífico tuvo al Perú como país anfitrión por tercera vez en noviembre de 2024?', 'Foro APEC', 'Cumbre del G20', 'Cumbre de la ASEAN', 'Foro de Davos', 'El Perú fue sede de la Cumbre de Líderes de APEC en 2008, 2016 y 2024.', 'Lima', 'Cancillería del Perú', '2026');
  agregarOM('actualidad_peruana', 'Patrimonio UNESCO', 'intermedio', '¿Qué observatorio solar preincaico de 13 torres ubicado en Casma (Áncash) fue inscrito como Patrimonio Mundial por la UNESCO en 2021?', 'Complejo Astronómico de Chankillo', 'Sechín Bajo', 'Pañamarca', 'Vichama', 'Chankillo (Áncash) es el observatorio solar más antiguo de América (250 a. C.) e ingresó a la lista UNESCO en julio de 2021.', 'Áncash', 'UNESCO / Ministerio de Cultura', '2026');
  agregarOM('actualidad_peruana', 'Bicentenario', 'intermedio', '¿En qué año se conmemoró el Bicentenario de las batallas de Junín y Ayacucho que consolidaron la independencia del Perú?', '2024', '2021', '2022', '2025', 'En 2024 se cumplieron 200 años de las batallas de Junín (6 de agosto) y Ayacucho (9 de diciembre) de 1824.', 'Junín / Ayacucho', 'Proyecto Especial Bicentenario', '2026');
  agregarOM('actualidad_peruana', 'Aviación y Puertos', 'intermedio', '¿Cómo se llama el principal aeropuerto internacional del Perú ubicado en el Callao que estrenó su segunda pista y nuevo terminal de pasajeros?', 'Aeropuerto Internacional Jorge Chávez', 'Aeropuerto Alejandro Velasco Astete', 'Aeropuerto Alfredo Rodríguez Ballón', 'Aeropuerto Capitán FAP José A. Quiñones', 'El Aeropuerto Internacional Jorge Chávez en el Callao inauguró su nueva torre de control, segunda pista y nuevo terminal.', 'Callao', 'LAP / MTC', '2026');
  agregarOM('actualidad_peruana', 'Conservación Marina', 'avanzado', '¿Cómo se llama la reserva nacional marina creada en el Perú frente a la costa de Ica para proteger montes submarinos a más de 100 km del litoral?', 'Reserva Nacional Dorsal de Nasca (y Mar Tropical de Grau en el norte)', 'Reserva de Paracas Sur', 'Santuario de Lobos de Tierra', 'Reserva de Punta Coles', 'El Perú creó la Reserva Nacional Dorsal de Nasca (2021) y la Reserva Nacional Mar Tropical de Grau (2024).', 'Ica / Piura / Tumbes', 'SERNANP', '2026');
  agregarOM('actualidad_peruana', 'Cultura', 'avanzado', '¿En qué distrito del sur de Lima se inauguró el Museo Nacional del Perú (MUNA), junto al santuario arqueológico de Pachacámac?', 'Lurín', 'Punta Hermosa', 'Cieneguilla', 'Villa El Salvador', 'El Museo Nacional del Perú (MUNA) está ubicado en el kilómetro 31 de la Antigua Panamericana Sur, en Lurín.', 'Lima', 'Ministerio de Cultura', '2026');
  agregarOM('actualidad_peruana', 'Ciencia Antártica', 'avanzado', '¿Cómo se llama el buque oceanográfico polar de la Marina de Guerra del Perú que realiza las campañas científicas ANTAR hacia la estación Machu Picchu?', 'B.A.P. Carrasco (BOP-171)', 'B.A.P. Unión', 'B.A.P. Humboldt', 'B.A.P. Almirante Grau', 'El B.A.P. Carrasco es el buque oceanográfico polar que lidera las expediciones científicas peruanas a la Antártida.', 'Callao / Antártida', 'Marina de Guerra del Perú', '2026');

  // =======================================================================
  // 18. CIENCIA Y TECNOLOGÍA EN EL PERÚ (ciencia_tecnologia_peru)
  // =======================================================================
  agregarOM('ciencia_tecnologia_peru', 'Aeroespacial', 'basico', '¿Qué ingeniero arequipeño diseñó en 1895 el primer motor cohete de propelente líquido y es considerado pionero mundial de la astronáutica?', 'Pedro Paulet Mostajo', 'Santiago Antúnez de Mayolo', 'Federico Villarreal', 'Pedro Ruiz Gallo', 'Pedro Paulet (1874-1945) diseñó el motor a reacción con propelente líquido y el "Avión Torpedo".', 'Arequipa');
  agregarOM('ciencia_tecnologia_peru', 'Satélites', 'basico', '¿Cómo se llama el primer satélite submétrico de observación terrestre del Estado peruano lanzado en septiembre de 2016 y operado por CONIDA?', 'PerúSAT-1', 'Chasqui I', 'PUCP-Sat-1', 'Inti-Sat', 'El PerúSAT-1 fue lanzado desde Kourou el 15 de septiembre de 2016 y es operado por la Agencia Espacial del Perú (CONIDA).', 'Lima');
  agregarOM('ciencia_tecnologia_peru', 'Medicina', 'basico', '¿Qué árbol nativo de la ceja de selva peruana, presente en el Escudo Nacional, dio al mundo la quinina para curar la malaria o paludismo?', 'El árbol de la Quina (Cascarilla)', 'La Uña de gato', 'El Sangre de grado', 'El Algarrobo', 'La corteza del árbol de la Quina (Cinchona officinalis) contiene quinina, alcaloide que salvó millones de vidas del paludismo.', 'Amazonas / Cajamarca / Loja');
  agregarOM('ciencia_tecnologia_peru', 'Física e Ingeniería', 'intermedio', '¿Qué científico ancashino diseñó las grandes centrales hidroeléctricas del Cañón del Pato y del Mantaro y predijo en 1924 la existencia del neutrón?', 'Santiago Antúnez de Mayolo', 'Barton Zwiebach', 'Modesto Montoya', 'Alberto Giesecke', 'Santiago Antúnez de Mayolo (nacido en Aija, Áncash) fue físico, ingeniero y pionero hidroenergético del Perú.', 'Áncash');
  agregarOM('ciencia_tecnologia_peru', 'Matemáticas', 'intermedio', '¿Qué matemático lambayecano nacido en Túcume descubrió en 1873 un método original para elevar cualquier polinomio a una potencia cualquiera?', 'Federico Villarreal', 'Godofredo García', 'José Tola Pasquel', 'Harald Helfgott', 'El sabio Federico Villarreal (1850-1923) descubrió el célebre "Polinomio de Villarreal".', 'Lambayeque');
  agregarOM('ciencia_tecnologia_peru', 'Fisiología de Altura', 'intermedio', '¿Qué médico peruano fundó la biología andina al demostrar que el habitante de los Andes está perfectamente adaptado a la hipoxia de gran altitud?', 'Carlos Monge Medrano', 'Honorio Delgado', 'Hermenegildo Valdizán', 'Alberto Hurtado', 'Carlos Monge Medrano describió la fisiología del hombre andino y el mal de montaña crónico ("Enfermedad de Monge").', 'Lima');
  agregarOM('ciencia_tecnologia_peru', 'Matemáticas Modernas', 'avanzado', '¿Qué matemático peruano demostró en 2013 la Conjetura Débil de Goldbach, un problema matemático abierto durante 271 años?', 'Harald Helfgott', 'César Camacho Manco', 'Fernando Cukierman', 'Barton Zwiebach', 'El matemático peruano Harald Andrés Helfgott demostró rigurosamente la Conjetura Débil de Goldbach en 2013.', 'Lima');
  agregarOM('ciencia_tecnologia_peru', 'Radioastronomía', 'avanzado', '¿Cómo se llama el radioobservatorio ecuatorial ubicado al este de Lima que posee uno de los radares de dispersión incoherente más grandes del mundo para estudiar la ionósfera?', 'Radio Observatorio de Jicamarca', 'Observatorio de Huancayo', 'Observatorio de Moquegua', 'Observatorio de Carmen Alto', 'El Radio Observatorio de Jicamarca (IGP) opera desde 1961 estudiando la ionósfera ecuatorial.', 'Lima');
  agregarOM('ciencia_tecnologia_peru', 'Inventos del Siglo XIX', 'avanzado', '¿Qué militar e inventor chiclayano construyó el monumental Gran Reloj de Lima para la Exposición de 1872 y murió fabricando torpedos para defender el Callao en 1880?', 'Pedro Ruiz Gallo', 'Juan Gualberto Guevara', 'Manuel Cuadros Viñas', 'Mariano Ignacio Prado', 'El teniente coronel Pedro Ruiz Gallo (1838-1880) es patrono del Arma de Ingeniería del Ejército del Perú.', 'Lambayeque');

  // =======================================================================
  // 19. MÚSICA Y ARTISTAS PERUANOS (musica_artistas_peru)
  // =======================================================================
  agregarOM('musica_artistas_peru', 'Música Criolla', 'basico', '¿Qué cantautora peruana compuso el inmortal vals "La flor de la canela", además de "Fina estampa" y "José Antonio"?', 'Chabuca Granda', 'Eva Ayllón', 'Alicia Maguiña', 'Lucha Reyes', 'María Isabel Granda y Larco (Chabuca Granda), nacida en Cotabambas (Apurímac), compuso "La flor de la canela" en 1950.', 'Apurímac / Lima');
  agregarOM('musica_artistas_peru', 'Canto Lírico', 'basico', '¿Quién es el famoso tenor lírico peruano considerado una de las máximas figuras de la ópera mundial contemporánea y fundador de "Sinfonía por el Perú"?', 'Juan Diego Flórez', 'Luis Alva', 'Ernesto Palacio', 'Alejandro Granda', 'Juan Diego Flórez es reconocido mundialmente por sus interpretaciones de Rossini, Bellini y Donizetti.', 'Lima');
  agregarOM('musica_artistas_peru', 'Canción Patriótica', 'basico', '¿Quién compuso el emblemático vals "Contigo Perú", considerado el segundo himno nacional, e interpretado de forma inmortal por Arturo "Zambo" Cavero y Óscar Avilés?', 'Augusto Polo Campos', 'Felipe Pinglo Alva', 'Mario Cavagnaro', 'Manuel Acosta Ojeda', 'Augusto Polo Campos compuso "Contigo Perú" en 1977 e hizo historia junto al "Zambo" Cavero y la primera guitarra de Óscar Avilés.', 'Ayacucho / Lima');
  agregarOM('musica_artistas_peru', 'Música Andina', 'intermedio', '¿Quién compuso en 1913 la zarzuela y obra sinfónica "El cóndor pasa", declarada Patrimonio Cultural de la Nación?', 'Daniel Alomía Robles', 'Theodoro Valcárcel', 'Jorge Bravo de Rueda', 'Armando Guevara Ochoa', 'El compositor huanuqueño Daniel Alomía Robles compuso la música de "El cóndor pasa" en 1913.', 'Huánuco');
  agregarOM('musica_artistas_peru', 'Música Afroperuana', 'intermedio', '¿Qué investigadora, poeta y folclorista junto a su hermano Nicomedes lideró el renacimiento de la música y danza afroperuana (como el festejo y el landó)?', 'Victoria Santa Cruz', 'Susana Baca', 'Caitro Soto', 'Ronaldo Campos', 'Victoria y Nicomedes Santa Cruz rescataron y difundieron el patrimonio cultural afroperuano en el siglo XX.', 'Lima');
  agregarOM('musica_artistas_peru', 'Voz Lírica Andina', 'intermedio', '¿Qué soprano peruana nacida en Cajamarca / Ichocán deslumbró al mundo en los años 50 con un registro vocal de más de cuatro octavas?', 'Yma Sumac', 'Pastorita Huaracina', 'Flor Pucarina', 'Picaflor de los Andes', 'Zoila Emperatriz Chávarri del Castillo (Yma Sumac) triunfó en Hollywood y Broadway por su prodigioso rango vocal.', 'Cajamarca');
  agregarOM('musica_artistas_peru', 'Guardia Vieja y Vals', 'avanzado', '¿Qué compositor limeño, llamado "El Bardo Inmortal", es autor del célebre vals "El plebeyo"?', 'Felipe Pinglo Alva', 'Pedro Espinel', 'Eduardo Márquez Talledo', 'César Miró', 'Felipe Pinglo Alva (1899-1936) renovó la canción criolla peruana con "El plebeyo", "El huerto de mi amada" y "Mendicidad".', 'Lima');
  agregarOM('musica_artistas_peru', 'Premios Internacionales', 'avanzado', '¿Qué cantante e investigadora afroperuana, exministra de Cultura, ha ganado tres premios Grammy Latinos por álbumes como "Lamento negro" y "A capella"?', 'Susana Baca', 'Tania Libertad', 'Cecilia Barraza', 'Bartola', 'Susana Baca ganó el Grammy Latino en 2002, 2011 y 2020.', 'Lima');
  agregarOM('musica_artistas_peru', 'Quechua Pop y Rock', 'avanzado', '¿Qué banda peruana formada en Lima en 1964 es considerada por la crítica internacional como una de las precursoras mundiales del punk rock con su tema "Demolición"?', 'Los Saicos', 'Los Belkings', 'Traffic Sound', 'Frágil', 'Los Saicos (Erwin Flores, Rolando Carpio, César Castrillón y Pancho Guevara) grabaron "Demolición" en 1965.', 'Lima');

  // =======================================================================
  // 20. FLORA Y FAUNA DEL PERÚ (flora_fauna_peru)
  // =======================================================================
  agregarOM('flora_fauna_peru', 'Aves Nacionales', 'basico', '¿Cuál es el ave nacional del Perú, habitante de los bosques de neblina de la ceja de selva?', 'El Gallito de las Rocas (Tunqui)', 'El Cóndor Andino', 'El Pingüino de Humboldt', 'El Parihuana', 'El Gallito de las Rocas (Rupicola peruvianus), llamado "Tunqui" en quechua, es el ave nacional del Perú.', 'Ceja de Selva');
  agregarOM('flora_fauna_peru', 'Camélidos', 'basico', '¿Qué camélido sudamericano silvestre figura en el Escudo Nacional del Perú y posee la fibra animal más fina del mundo?', 'La Vicuña', 'La Alpaca', 'La Llama', 'El Guanaco', 'La vicuña (Vicugna vicugna) representa la riqueza del reino animal en el Escudo Nacional.', 'Andes Peruanos');
  agregarOM('flora_fauna_peru', 'Perro Peruano', 'basico', '¿Qué raza canina originaria del Perú es reconocida como Patrimonio Cultural de la Nación y fue retratada en ceramios Moche, Wari y Chimú?', 'El Perro sin pelo del Perú (Viringo)', 'El Pastor Chiribaya', 'El Dogo Andino', 'El Alco Serrano', 'El Perro sin pelo del Perú o Viringo acompaña a las culturas peruanas desde hace miles de años.', 'Costa Peruana');
  agregarOM('flora_fauna_peru', 'Botánica Andina', 'intermedio', '¿Qué planta bromeliácea gigante que crece por encima de los 3800 m s. n. m. en Áncash y Ayacucho tiene la inflorescencia más grande del mundo y florece una sola vez tras casi 100 años?', 'La Puya Raimondi (Titanka)', 'La Cantuta', 'El Queñual', 'El Molle', 'La Puya Raimondi puede alcanzar hasta 12 metros de altura y producir más de 8000 flores antes de morir.', 'Áncash / Ayacucho');
  agregarOM('flora_fauna_peru', 'Flor Nacional', 'intermedio', '¿Cómo se llama la flor sagrada de los Incas, también considerada Flor Nacional del Perú?', 'La Cantuta (Qantu)', 'La Amancaes', 'La Orquídea Waqanki', 'El Floripondio', 'La Cantuta (Cantua buxifolia) de colores rojo, amarillo y blanco era consagrada al Sol por los Incas.', 'Andes');
  agregarOM('flora_fauna_peru', 'Mamíferos Andinos', 'intermedio', '¿Cómo se llama la única especie de oso nativa de Sudamérica, que habita en los bosques andinos y secos del Perú?', 'Oso de anteojos (Ukumari)', 'Oso pardo andino', 'Puma concolor', 'Taruca', 'El oso andino o de anteojos (Tremarctos ornatus), llamado Ukumari en quechua, es una especie clave dispersora de semillas.', 'Andes / Bosques Secos');
  agregarOM('flora_fauna_peru', 'Áreas Naturales Protegidas', 'avanzado', '¿En qué Reserva Nacional de Ayacucho se logró salvar de la extinción a la vicuña en las décadas de 1960 y 1970?', 'Reserva Nacional Pampa Galeras - Bárbara D’Achille', 'Reserva Nacional de Salinas y Aguada Blanca', 'Reserva Nacional de Junín', 'Parque Nacional del Manu', 'Pampa Galeras, en Lucanas (Ayacucho), es el principal centro de conservación de la vicuña y sede del Chaccu.', 'Ayacucho');
  agregarOM('flora_fauna_peru', 'Fauna Amazónica', 'avanzado', '¿Cuál es el pez de escamas de agua dulce más grande de la Amazonía peruana, capaz de respirar aire atmosférico?', 'El Paiche (Arapaima gigas)', 'El Dorado o Zúngaro', 'La Gamitana', 'El Doncella', 'El Paiche (Arapaima gigas) puede superar los 2.5 metros de longitud y 200 kg en los ríos y cochas de Loreto y Ucayali.', 'Loreto / Ucayali');
  agregarOM('flora_fauna_peru', 'Aves Endémicas', 'avanzado', '¿En qué región del norte peruano fue redescubierta en 1977 la Pava Aliblanca (Penelope albipennis), tras creerse extinta durante un siglo?', 'Lambayeque / Piura (Olmos)', 'Loreto (Iquitos)', 'Tacna', 'Puno', 'La Pava Aliblanca fue redescubierta en la quebrada San Isidro (Olmos, Lambayeque) por Gustavo del Solar y John O’Neill.', 'Lambayeque');

  // =======================================================================
  // 21. FESTIVIDADES Y COSTUMBRES (festividades_costumbres_peru)
  // =======================================================================
  agregarOM('festividades_costumbres_peru', 'Cusco', 'basico', '¿En qué fecha del solsticio de invierno austral se escenifica en Sacsayhuamán y el Coricancha la fiesta inca del Inti Raymi?', '24 de junio', '28 de julio', '1 de noviembre', '25 de diciembre', 'El Inti Raymi ("Fiesta del Sol") se celebra cada 24 de junio en el Cusco.', 'Cusco');
  agregarOM('festividades_costumbres_peru', 'Lima', 'basico', '¿En qué mes del año recorre las calles de Lima la multitudinaria procesión del Señor de los Milagros, conocido como el Mes Morado?', 'Octubre', 'Mayo', 'Agosto', 'Julio', 'La procesión del Señor de los Milagros sale del Monasterio de las Nazarenas durante el mes de octubre.', 'Lima');
  agregarOM('festividades_costumbres_peru', 'Puno', 'basico', '¿En qué ciudad a orillas del lago Titicaca se celebra en febrero la grandiosa Festividad de la Virgen de la Candelaria, Patrimonio Inmaterial de la Humanidad?', 'Puno', 'Juliaca', 'Cusco', 'Arequipa', 'La Festividad de la Virgen de la Candelaria de Puno congrega a cientos de conjuntos de danzas autóctonas y de luces.', 'Puno');
  agregarOM('festividades_costumbres_peru', 'Amazonía', 'intermedio', '¿Cuál es la fiesta patronal más importante de toda la Amazonía peruana, celebrada el 24 de junio con el "baño bendito" en los ríos y el consumo de juane?', 'Fiesta de San Juan', 'Fiesta de San Pedro y San Pablo', 'Carnaval de Iquitos', 'Señor de Gualamita', 'La Fiesta de San Juan Bautista el 24 de junio une a todos los pueblos de la selva peruana.', 'Selva Peruana');
  agregarOM('festividades_costumbres_peru', 'Peregrinaciones Andinas', 'intermedio', '¿Cómo se llama la multitudinaria peregrinación al pie del nevado Ausangate (Sinakara, Cusco) en la que participan los "Ukukus" o "Pabluchas"?', 'Señor de Qoyllur Rit’i', 'Virgen del Carmen de Paucartambo', 'Señor de Huanca', 'Virgen de Chapi', 'La peregrinación al santuario del Señor de Qoyllur Rit’i ("Estrella de la Nieve") es Patrimonio Inmaterial de la Humanidad.', 'Cusco');
  agregarOM('festividades_costumbres_peru', 'Carnavales', 'intermedio', '¿Qué ciudad del norte peruano es conocida oficialmente como la "Capital del Carnaval Peruano" por sus patrullas, comparsas y el Rey Momo (Ño Carnavalón)?', 'Cajamarca', 'Piura', 'Chachapoyas', 'Trujillo', 'El Carnaval de Cajamarca es famoso por sus coplas, cilulo, patrullas y comparsas.', 'Cajamarca');
  agregarOM('festividades_costumbres_peru', 'Cusco', 'avanzado', '¿En qué localidad cusqueña se celebra en julio la fiesta de la "Mamacha Carmen" con danzas como los Qhapaq Qolla, Saqras y Qhapaq Negro?', 'Paucartambo', 'Urubamba', 'Sicuani', 'Chinchero', 'La fiesta de la Virgen del Carmen de Paucartambo se celebra del 15 al 18 de julio.', 'Cusco');
  agregarOM('festividades_costumbres_peru', 'La Libertad', 'avanzado', '¿En qué provincia de La Libertad se celebra cada diciembre la festividad de la Virgen de la Puerta, patrona del Norte y "Mamita de Otuzco"?', 'Otuzco', 'Huamachuco', 'Santiago de Chuco', 'Chepén', 'La festividad de la Inmaculada Virgen de la Puerta de Otuzco se celebra el 15 de diciembre.', 'La Libertad');
  agregarOM('festividades_costumbres_peru', 'Arequipa', 'avanzado', '¿Cuál es la principal advocación mariana de Arequipa cuyo santuario es visitado por miles de peregrinos cada 1 de mayo?', 'Virgen de Chapi', 'Virgen de Cocharcas', 'Virgen de la Alta Gracia', 'Virgen del Socorro', 'El Santuario de la Virgen de Chapi se ubica en el distrito de Polobaya, Arequipa.', 'Arequipa');

  // =======================================================================
  // PREGUNTAS DE APROXIMACIÓN NUMÉRICA (DIANA) DEL PERÚ
  // =======================================================================
  const aproximacionPeru = [
    ['historia_peru', 'Independencia', 'basico', '¿En qué año proclamó José de San Martín la Independencia del Perú en Lima?', 1821, 1750, 1900, 'La proclamación fue el 28 de julio de 1821.'],
    ['independencia_peru', 'Batallas', 'basico', '¿En qué año se libraron las batallas de Junín y Ayacucho?', 1824, 1750, 1900, 'Ambas batallas se libraron en 1824 (6 de agosto y 9 de diciembre).'],
    ['historia_peru', 'Guerra del Pacífico', 'basico', '¿En qué año ocurrió el Combate Naval de Angamos donde se inmoló Miguel Grau?', 1879, 1800, 1930, 'El Combate de Angamos tuvo lugar el 8 de octubre de 1879.'],
    ['virreinato_peru', 'Fundación de Lima', 'intermedio', '¿En qué año fundó Francisco Pizarro la ciudad de Lima ("Ciudad de los Reyes")?', 1535, 1480, 1650, 'Lima fue fundada el 18 de enero de 1535.'],
    ['virreinato_peru', 'Educación', 'intermedio', '¿En qué año se fundó la Universidad Nacional Mayor de San Marcos en Lima?', 1551, 1500, 1700, 'Fue fundada el 12 de mayo de 1551 por Real Cédula de Carlos V.'],
    ['virreinato_peru', 'Rebeliones', 'intermedio', '¿En qué año estalló la Gran Rebelión de Túpac Amaru II en Tinta (Cusco)?', 1780, 1700, 1830, 'Inició el 4 de noviembre de 1780 con la captura del corregidor Arriaga.'],
    ['turismo_lugares_peru', 'Machu Picchu', 'basico', '¿En qué año llegó Hiram Bingham a la ciudadela inca de Machu Picchu dando a conocer su hallazgo al mundo académico?', 1911, 1850, 1960, 'Hiram Bingham llegó a Machu Picchu el 24 de julio de 1911 guiado por pobladores locales.'],
    ['civilizaciones_preincaicas', 'Sipán', 'intermedio', '¿En qué año descubrió el arqueólogo Walter Alva la tumba real del Señor de Sipán en Lambayeque?', 1987, 1940, 2015, 'El hallazgo en Huaca Rajada se produjo en 1987.'],
    ['literatura_peruana', 'Premio Nobel', 'basico', '¿En qué año recibió Mario Vargas Llosa el Premio Nobel de Literatura?', 2010, 1980, 2025, 'La Academia Sueca le otorgó el Nobel de Literatura en 2010.'],
    ['deportes_peruanos', 'Vóley Olímpico', 'basico', '¿En qué año ganó la selección peruana de vóley la medalla de plata en los Juegos Olímpicos de Seúl?', 1988, 1960, 2010, 'Ocurrió en los Juegos Olímpicos de Seúl 1988.'],
    ['futbol_peruano', 'Copa Sudamericana', 'intermedio', '¿En qué año se coronó campeón de la Copa Sudamericana el club Cienciano del Cusco?', 2003, 1985, 2020, 'Cienciano venció a River Plate en diciembre de 2003 en Arequipa.'],
    ['geografia_peru', 'Cordillera Blanca', 'avanzado', '¿Cuántos metros sobre el nivel del mar mide aproximadamente el nevado Huascarán, punto más alto del Perú?', 6768, 5000, 8000, 'La cumbre sur del nevado Huascarán mide 6768 m s. n. m.'],
    ['geografia_peru', 'Lago Titicaca', 'avanzado', '¿A cuántos metros sobre el nivel del mar se encuentra aproximadamente el Lago Titicaca en Puno?', 3812, 2000, 5000, 'El lago Titicaca se sitúa a una altitud media de 3812 m s. n. m.'],
    ['regiones_departamentos_peru', 'Organización Territorial', 'basico', '¿Cuántos departamentos (sin contar la Provincia Constitucional del Callao) conforman la división política del Perú?', 24, 10, 40, 'El Perú cuenta con 24 departamentos más la Provincia Constitucional del Callao.'],
    ['historia_peru', 'Combate del Dos de Mayo', 'intermedio', '¿En qué año se libró el glorioso Combate del 2 de Mayo en el Callao donde murió José Gálvez?', 1866, 1820, 1900, 'El Combate del Callao se libró el 2 de mayo de 1866.'],
    ['ciencia_tecnologia_peru', 'Satélite', 'intermedio', '¿En qué año fue lanzado al espacio el satélite peruano de observación terrestre PerúSAT-1?', 2016, 2000, 2025, 'El PerúSAT-1 fue puesto en órbita el 15 de septiembre de 2016.']
  ];

  aproximacionPeru.forEach(item => {
    agregarAprox(item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7]);
  });

  return preguntas;
}

module.exports = { generarBancoPeru };
