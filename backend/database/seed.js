const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'preguntas.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS preguntas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo TEXT DEFAULT 'opcion_multiple',
      categoria TEXT NOT NULL,
      pregunta TEXT NOT NULL UNIQUE,
      opcion_a TEXT,
      opcion_b TEXT,
      opcion_c TEXT,
      opcion_d TEXT,
      correcta TEXT NOT NULL,
      anio_min INTEGER DEFAULT 1000,
      anio_max INTEGER DEFAULT 2026
    )
  `);

  db.run(`DELETE FROM preguntas`);

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO preguntas (tipo, categoria, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, correcta, anio_min, anio_max)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const preguntas = [
    // ==========================================
    // 1. GASTRONOMÍA Y COMIDA
    // ==========================================
    ['opcion_multiple', 'comida', '¿De qué país es originario el plato sushi?', 'China', 'Japón', 'Corea del Sur', 'Tailandia', 'B', null, null],
    ['opcion_multiple', 'comida', '¿Cuál es el ingrediente base tradicional del guacamole mexicano?', 'Tomate', 'Aguacate (Palta)', 'Cilantro', 'Pimiento', 'B', null, null],
    ['opcion_multiple', 'comida', '¿Qué especia, la más cara del mundo, se obtiene de los estigmas de una flor?', 'Azafrán', 'Cardamomo', 'Vainilla', 'Clavo de olor', 'A', null, null],
    ['opcion_multiple', 'comida', '¿Cuál es la masa base para preparar pasta italiana tradicional?', 'Harina de trigo y huevo', 'Harina de maíz y agua', 'Fécula de papa y leche', 'Arroz molido', 'A', null, null],
    ['opcion_multiple', 'comida', '¿De qué fruto se extrae el chocolate?', 'Cafeto', 'Cacao', 'Algarroba', 'Nuez moscada', 'B', null, null],
    ['opcion_multiple', 'comida', '¿Qué tipo de queso se utiliza tradicionalmente en la pizza Margarita italiana?', 'Cheddar', 'Mozzarella', 'Gouda', 'Parmesano', 'B', null, null],
    ['opcion_multiple', 'comida', '¿Qué país es el mayor productor y exportador de café del mundo?', 'Colombia', 'Brasil', 'Etiopía', 'Vietnam', 'B', null, null],
    ['opcion_multiple', 'comida', '¿Qué hongo comestible subterráneo es considerado un manjar de lujo culinario?', 'Champiñón', 'Trufa', 'Shiitake', 'Portobello', 'B', null, null],
    ['opcion_multiple', 'comida', '¿Cuál es el ingrediente principal del hummus de Medio Oriente?', 'Lentejas', 'Garbanzos', 'Frijoles negros', 'Arvejas', 'B', null, null],
    ['opcion_multiple', 'comida', '¿Qué bebida alcohólica se destila a partir del agave azul?', 'Ron', 'Tequila', 'Vodka', 'Ginebra', 'B', null, null],
    ['opcion_multiple', 'comida', '¿Cuál es el ingrediente fundamental del plato español paella valenciana?', 'Arroz', 'Fideos', 'Papas', 'Trigo', 'A', null, null],
    ['opcion_multiple', 'comida', '¿Qué bebida fermentada se elabora a base de cebada malteada y lúpulo?', 'Vino', 'Cerveza', 'Sidra', 'Sake', 'B', null, null],
    ['opcion_multiple', 'comida', '¿De qué carne se elabora el tradicional jamón serrano o ibérico?', 'Vaca', 'Cerdo', 'Cordero', 'Pavo', 'B', null, null],
    ['opcion_multiple', 'comida', '¿Qué salsa francesa se prepara emulsionando mantequilla clarificada y yema de huevo con jugo de limón?', 'Bechamel', 'Holandesa', 'Boloñesa', 'Tártara', 'B', null, null],
    ['opcion_multiple', 'comida', '¿Cuál es el licor típico de Grecia con marcado sabor a anís?', 'Ouzo', 'Grappa', 'Pisco', 'Pastis', 'A', null, null],

    // ==========================================
    // 2. CULTURA Y GASTRONOMÍA PERUANA
    // ==========================================
    ['opcion_multiple', 'cultura_peruana', '¿En qué departamento se ubica la ciudadela de Kuélap?', 'Cusco', 'Amazonas', 'Áncash', 'La Libertad', 'B', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Quién escribió la novela "Los ríos profundos"?', 'César Vallejo', 'Mario Vargas Llosa', 'José María Arguedas', 'Ciro Alegría', 'C', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Cuál es el nevado más alto de todo el Perú?', 'Alpamayo', 'Huascarán', 'Yerupajá', 'Coropuna', 'B', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿En qué departamento se encuentran las Líneas de Nazca?', 'Ica', 'Arequipa', 'Moquegua', 'Lima', 'A', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Qué plato típico de la selva peruana se envuelve en hojas de bijao?', 'Tacacho', 'Juane', 'Inchicapi', 'Patarasca', 'B', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Quién es conocido en la historia como "El Brujo de los Andes"?', 'Andrés Avelino Cáceres', 'Miguel Grau', 'Francisco Bolognesi', 'Alfonso Ugarte', 'A', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Qué fruto cítrico es el alma indiscutible del ceviche tradicional peruano?', 'Naranja agria', 'Limón sutil piurano', 'Toronja', 'Lima dulce', 'B', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Cuál es el ingrediente base de la carapulcra tradicional?', 'Papa seca', 'Maíz morado', 'Yuca sancochada', 'Camote asado', 'A', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Qué sopa emblemática arequipeña lleva camarones, leche, queso y huacatay?', 'Chupe de camarones', 'Parihuela', 'Chilcano', 'Aguadito', 'A', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Cuál es el licor destilado de uva bandera del Perú?', 'Pisco', 'Singani', 'Aguardiente', 'Tequila', 'A', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Qué cultura preincaica destacó por sus finos mantos funerarios y trepanaciones craneanas?', 'Paracas', 'Moche', 'Chavín', 'Huari', 'A', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Quién escribió el poemario cumbre "Trilce"?', 'Abraham Valdelomar', 'César Vallejo', 'José Santos Chocano', 'Martín Adán', 'B', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Qué plato criollo se prepara tradicionalmente con corazón de res en brochetas?', 'Anticuchos', 'Seco de res', 'Cau cau', 'Mondonguito', 'A', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿En qué ciudad se celebra la imponente fiesta folclórica de la Virgen de la Candelaria?', 'Puno', 'Cusco', 'Arequipa', 'Ayacucho', 'A', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Qué ave es reconocida como el Ave Nacional del Perú?', 'Cóndor andino', 'Gallito de las rocas', 'Picaflor gigante', 'Pelícano peruano', 'B', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Qué ciudadela prehispánica de barro es considerada la más grande de América?', 'Chan Chan', 'Pachacámac', 'Cahuachi', 'Túcume', 'A', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Quién comandó el monitor Huáscar en el combate naval de Angamos?', 'Miguel Grau', 'Lizardo Montero', 'Guillermo More', 'Aurelio García', 'A', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Qué ají seco peruano le da el color y sabor característico al ají de gallina?', 'Ají amarillo', 'Rocoto', 'Ají limo', 'Ají panca', 'A', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Cuál es el árbol que figura en el Escudo Nacional del Perú simbolizando el reino vegetal?', 'Quina', 'Cedro', 'Caoba', 'Algarrobo', 'A', null, null],
    ['opcion_multiple', 'cultura_peruana', '¿Qué cañón situado en Arequipa es uno de los más profundos del planeta?', 'Cañón del Colca', 'Cañón del Pato', 'Cañón del Infiernillo', 'Cañón de Tinajani', 'A', null, null],

    // ==========================================
    // 3. HISTORIA UNIVERSAL
    // ==========================================
    ['opcion_multiple', 'historia', '¿Quién fue el primer emperador de Roma?', 'Julio César', 'Nerón', 'César Augusto', 'Marco Aurelio', 'C', null, null],
    ['opcion_multiple', 'historia', '¿En qué país comenzó la Revolución Industrial en el siglo XVIII?', 'Francia', 'Gran Bretaña', 'Alemania', 'Estados Unidos', 'B', null, null],
    ['opcion_multiple', 'historia', '¿Qué faraón egipcio mandó a construir la Gran Pirámide de Guiza?', 'Ramsés II', 'Keops', 'Tutankamón', 'Akenatón', 'B', null, null],
    ['opcion_multiple', 'historia', '¿Quién fue el líder militar cartaginés que cruzó los Alpes con elefantes de combate?', 'Aníbal Barca', 'Escipión', 'Amílcar', 'Asdrúbal', 'A', null, null],
    ['opcion_multiple', 'historia', '¿En qué batalla fue derrotado definitivamente Napoleón Bonaparte en 1815?', 'Austerlitz', 'Waterloo', 'Trafalgar', 'Leipzig', 'B', null, null],
    ['opcion_multiple', 'historia', '¿Qué dinastía imperial gobernó Rusia hasta la revolución bolchevique de 1917?', 'Habsburgo', 'Romanov', 'Borbón', 'Tudor', 'B', null, null],
    ['opcion_multiple', 'historia', '¿Qué tratado puso fin formal a la Primera Guerra Mundial en 1919?', 'Tratado de Versalles', 'Paz de Westfalia', 'Tratado de Utrecht', 'Pacto de Varsovia', 'A', null, null],
    ['opcion_multiple', 'historia', '¿Quién fue el navegante portugués que comandó la primera expedición en circunnavegar la Tierra?', 'Fernando de Magallanes', 'Vasco da Gama', 'Bartolomé Díaz', 'Cristóbal Colón', 'A', null, null],
    ['opcion_multiple', 'historia', '¿Qué civilización antigua inventó el sistema de escritura cuneiforme?', 'Egipcia', 'Sumeria', 'Fenicia', 'Persa', 'B', null, null],
    ['opcion_multiple', 'historia', '¿Qué ciudad japonesa fue la primera en sufrir el bombardeo con una bomba atómica en 1945?', 'Nagasaki', 'Hiroshima', 'Tokio', 'Kioto', 'B', null, null],
    ['opcion_multiple', 'historia', '¿Quién redactó la Declaración de Independencia de los Estados Unidos en 1776?', 'George Washington', 'Thomas Jefferson', 'Benjamin Franklin', 'John Adams', 'B', null, null],
    ['opcion_multiple', 'historia', '¿Qué emperador francés se autoproclamó emperador en la catedral de Notre Dame en 1804?', 'Luis XIV', 'Napoleón Bonaparte', 'Luis XVI', 'Carlos Magno', 'B', null, null],
    ['opcion_multiple', 'historia', '¿Cómo se llamaba la fortaleza parisina cuya toma dio inicio formal a la Revolución Francesa en 1789?', 'La Bastilla', 'Versalles', 'El Louvre', 'Las Tullerías', 'A', null, null],
    ['opcion_multiple', 'historia', '¿Qué líder condujo a la India hacia su independencia mediante la resistencia pacífica?', 'Jawaharlal Nehru', 'Mahatma Gandhi', 'Indira Gandhi', 'Subhas Chandra Bose', 'B', null, null],
    ['opcion_multiple', 'historia', '¿Quién fue el caudillo huno conocido como "El azote de Dios"?', 'Gengis Kan', 'Atila', 'Tamerlán', 'Alarico', 'B', null, null],

    // ==========================================
    // 4. DEPORTES
    // ==========================================
    ['opcion_multiple', 'deportes', '¿Cuántos jugadores por equipo juegan simultáneamente en un partido de fútbol?', '10', '11', '12', '9', 'B', null, null],
    ['opcion_multiple', 'deportes', '¿Qué selección ganó la primera Copa del Mundo de Fútbol en 1930?', 'Brasil', 'Argentina', 'Uruguay', 'Italia', 'C', null, null],
    ['opcion_multiple', 'deportes', '¿Quién ostenta el récord de los 100 metros planos con un tiempo de 9.58 segundos?', 'Carl Lewis', 'Usain Bolt', 'Tyson Gay', 'Justin Gatlin', 'B', null, null],
    ['opcion_multiple', 'deportes', '¿En qué deporte se compite por la famosa Ensaladera de Plata en la Copa Davis?', 'Golf', 'Tenis', 'Rugby', 'Polo', 'B', null, null],
    ['opcion_multiple', 'deportes', '¿Cuántos anillos de colores componen el símbolo oficial de los Juegos Olímpicos?', '4', '5', '6', '7', 'B', null, null],
    ['opcion_multiple', 'deportes', '¿Cuántos minutos reglamentarios dura un partido de fútbol profesional sin prórroga?', '80', '90', '100', '120', 'B', null, null],
    ['opcion_multiple', 'deportes', '¿Qué país ha ganado la mayor cantidad de Copas Mundiales de la FIFA?', 'Alemania', 'Italia', 'Brasil', 'Argentina', 'C', null, null],
    ['opcion_multiple', 'deportes', '¿En qué ciudad se celebraron los primeros Juegos Olímpicos de la era moderna en 1896?', 'París', 'Atenas', 'Londres', 'Roma', 'B', null, null],
    ['opcion_multiple', 'deportes', '¿Cuántos puntos otorga un tiro libre encestado en básquetbol?', '1', '2', '3', '4', 'A', null, null],
    ['opcion_multiple', 'deportes', '¿Qué tenista masculino ganó 14 títulos individuales en Roland Garros sobre tierra batida?', 'Roger Federer', 'Rafael Nadal', 'Novak Djokovic', 'Björn Borg', 'B', null, null],
    ['opcion_multiple', 'deportes', '¿Qué legendario piloto brasileño de Fórmula 1 fue tricampeón mundial antes de su trágico accidente en Imola?', 'Nelson Piquet', 'Ayrton Senna', 'Emerson Fittipaldi', 'Felipe Massa', 'B', null, null],
    ['opcion_multiple', 'deportes', '¿Cuántos jugadores componen un equipo de rugby tradicional (Rugby Union) en el campo?', '11', '13', '15', '17', 'C', null, null],
    ['opcion_multiple', 'deportes', '¿En qué estilo de natación los nadadores parten sumergidos mirando hacia arriba?', 'Crol', 'Espalda', 'Pecho', 'Mariposa', 'B', null, null],
    ['opcion_multiple', 'deportes', '¿Qué boxeador peso pesado flotaba como mariposa y picaba como abeja?', 'Mike Tyson', 'Muhammad Ali', 'George Foreman', 'Joe Frazier', 'B', null, null],
    ['opcion_multiple', 'deportes', '¿Cuántos hoyos conforman una vuelta estándar en un campo de golf profesional?', '9', '12', '18', '24', 'C', null, null],

    // ==========================================
    // 5. CINE Y ENTRETENIMIENTO
    // ==========================================
    ['opcion_multiple', 'cine', '¿Quién dirigió la trilogía de películas de "El Señor de los Anillos"?', 'Steven Spielberg', 'Peter Jackson', 'Christopher Nolan', 'James Cameron', 'B', null, null],
    ['opcion_multiple', 'cine', '¿Qué película ganó el primer Óscar a Mejor Película Animada en la historia (2002)?', 'Monsters, Inc.', 'Shrek', 'El viaje de Chihiro', 'Toy Story', 'B', null, null],
    ['opcion_multiple', 'cine', '¿Cómo se llama el planeta desértico hogar original de Luke Skywalker en Star Wars?', 'Tatooine', 'Hoth', 'Endor', 'Naboo', 'A', null, null],
    ['opcion_multiple', 'cine', '¿Qué actor dio vida al Joker en la película "The Dark Knight" (2008)?', 'Joaquin Phoenix', 'Heath Ledger', 'Jack Nicholson', 'Jared Leto', 'B', null, null],
    ['opcion_multiple', 'cine', '¿Quién dirigió el clásico cinematográfico de suspenso "Psicosis" (1960)?', 'Stanley Kubrick', 'Alfred Hitchcock', 'Billy Wilder', 'Francis Ford Coppola', 'B', null, null],
    ['opcion_multiple', 'cine', '¿Cuál fue la película que inició formalmente el Universo Cinematográfico de Marvel en 2008?', 'El increíble Hulk', 'Iron Man', 'Thor', 'Capitán América', 'B', null, null],
    ['opcion_multiple', 'cine', '¿Qué película de ciencia ficción de James Cameron es la más taquillera de todos los tiempos?', 'Titanic', 'Avatar', 'Terminator 2', 'Aliens', 'B', null, null],
    ['opcion_multiple', 'cine', '¿Cómo se llama la inteligencia artificial del computador de la nave en "2001: Odisea del espacio"?', 'HAL 9000', 'Skynet', 'JARVIS', 'GLaDOS', 'A', null, null],
    ['opcion_multiple', 'cine', '¿Qué actor interpretó al arqueólogo Indiana Jones en la saga clásica de películas?', 'Harrison Ford', 'Tom Cruise', 'Mel Gibson', 'Clint Eastwood', 'A', null, null],
    ['opcion_multiple', 'cine', '¿Qué director creó películas como "Pulp Fiction", "Kill Bill" e "Inglourious Basterds"?', 'Martin Scorsese', 'Quentin Tarantino', 'David Fincher', 'Ridley Scott', 'B', null, null],
    ['opcion_multiple', 'cine', '¿Cuál es el nombre del león protagonista que se convierte en rey en "El Rey León"?', 'Mufasa', 'Simba', 'Scar', 'Kovu', 'B', null, null],
    ['opcion_multiple', 'cine', '¿En qué trilogía cinematográfica Keanu Reeves encarna al elegido "Neo"?', 'John Wick', 'Matrix', 'Constantine', 'Speed', 'B', null, null],
    ['opcion_multiple', 'cine', '¿Quién compuso la icónica banda sonora de "Tiburón", "Star Wars" y "Jurassic Park"?', 'Hans Zimmer', 'John Williams', 'Ennio Morricone', 'Alan Silvestri', 'B', null, null],
    ['opcion_multiple', 'cine', '¿Qué actriz protagonizó la película "El silencio de los inocentes" como la agente Clarice Starling?', 'Meryl Streep', 'Jodie Foster', 'Sigourney Weaver', 'Glenn Close', 'B', null, null],
    ['opcion_multiple', 'cine', '¿Qué película animada de Pixar cuenta la historia del anciano Carl Fredricksen volando con globos?', 'Coco', 'Up', 'WALL-E', 'Soul', 'B', null, null],

    // ==========================================
    // 6. CIENCIA Y NATURALEZA
    // ==========================================
    ['opcion_multiple', 'ciencia', '¿Cuál es el elemento químico más abundante en el universo observable?', 'Oxígeno', 'Helio', 'Hidrógeno', 'Carbono', 'C', null, null],
    ['opcion_multiple', 'ciencia', '¿Cuál es el órgano más extenso y pesado del cuerpo humano?', 'Hígado', 'Piel', 'Cerebro', 'Pulmones', 'B', null, null],
    ['opcion_multiple', 'ciencia', '¿A qué velocidad aproximada se propaga la luz en el vacío?', '150,000 km/s', '300,000 km/s', '450,000 km/s', '600,000 km/s', 'B', null, null],
    ['opcion_multiple', 'ciencia', '¿Qué científico formuló la teoría de la evolución por selección natural?', 'Gregor Mendel', 'Charles Darwin', 'Louis Pasteur', 'Jean-Baptiste Lamarck', 'B', null, null],
    ['opcion_multiple', 'ciencia', '¿Cuál es el planeta más grande de todo el Sistema Solar?', 'Saturno', 'Júpiter', 'Neptuno', 'Urano', 'B', null, null],
    ['opcion_multiple', 'ciencia', '¿Cuántos huesos componen el esqueleto de un cuerpo humano adulto promedio?', '186', '206', '226', '256', 'B', null, null],
    ['opcion_multiple', 'ciencia', '¿Qué partícula atómica posee carga eléctrica negativa?', 'Protón', 'Electrón', 'Neutrón', 'Fotón', 'B', null, null],
    ['opcion_multiple', 'ciencia', '¿Qué gas es fundamental para la respiración de los seres vivos aeróbicos?', 'Nitrógeno', 'Oxígeno', 'Dióxido de carbono', 'Helio', 'B', null, null],
    ['opcion_multiple', 'ciencia', '¿Cuál es la fórmula química fundamental del agua potable?', 'CO2', 'H2O', 'NaCl', 'CH4', 'B', null, null],
    ['opcion_multiple', 'ciencia', '¿Qué instrumento astronómico inventado por Galileo sirvió para observar las lunas de Júpiter?', 'Telescopio', 'Microscopio', 'Astrolabio', 'Barómetro', 'A', null, null],
    ['opcion_multiple', 'ciencia', '¿Cuál es el metal líquido a temperatura ambiente más conocido?', 'Plomo', 'Mercurio', 'Estaño', 'Galio', 'B', null, null],
    ['opcion_multiple', 'ciencia', '¿Qué parte de la célula vegetal es responsable directa de la fotosíntesis?', 'Mitocondria', 'Cloroplasto', 'Núcleo', 'Ribosoma', 'B', null, null],
    ['opcion_multiple', 'ciencia', '¿Cuál es el animal terrestre más veloz del mundo en carreras cortas?', 'León', 'Guepardo', 'Gacela', 'Leopardo', 'B', null, null],
    ['opcion_multiple', 'ciencia', '¿Cuál es la capa gaseosa exterior de la Tierra que nos protege de la radiación ultravioleta?', 'Capa de ozono', 'Tropósfera', 'Termósfera', 'Mesósfera', 'A', null, null],
    ['opcion_multiple', 'ciencia', '¿Quién descubrió el principio de flotabilidad mientras tomaba un baño y gritó ¡Eureka!?', 'Pitágoras', 'Arquímedes', 'Euclides', 'Tales de Mileto', 'B', null, null],

    // ==========================================
    // 7. GEOGRAFÍA UNIVERSAL
    // ==========================================
    ['opcion_multiple', 'geografia', '¿Cuál es el río más caudaloso y largo del planeta?', 'Nilo', 'Amazonas', 'Yangtsé', 'Misisipi', 'B', null, null],
    ['opcion_multiple', 'geografia', '¿Cuál es el país más extenso del mundo en superficie terrestre?', 'Canadá', 'Rusia', 'China', 'Estados Unidos', 'B', null, null],
    ['opcion_multiple', 'geografia', '¿En qué continente se ubica el vasto desierto del Sahara?', 'Asia', 'África', 'Oceanía', 'América', 'B', null, null],
    ['opcion_multiple', 'geografia', '¿Cuál es la capital oficial de Australia?', 'Sídney', 'Melbourne', 'Canberra', 'Brisbane', 'C', null, null],
    ['opcion_multiple', 'geografia', '¿Cuál es el océano de mayor extensión superficial de la Tierra?', 'Atlántico', 'Índico', 'Pacífico', 'Ártico', 'C', null, null],
    ['opcion_multiple', 'geografia', '¿En qué cordillera montañosa se encuentra la cima del monte Everest?', 'Andes', 'Himalaya', 'Alpes', 'Rocosas', 'B', null, null],
    ['opcion_multiple', 'geografia', '¿Cuál es el país más poblado de todo el continente americano?', 'Brasil', 'Estados Unidos', 'México', 'Colombia', 'B', null, null],
    ['opcion_multiple', 'geografia', '¿Qué estrecho marítimo separa naturalmente a España de Marruecos?', 'Estrecho de Bering', 'Estrecho de Gibraltar', 'Estrecho de Magallanes', 'Estrecho del Bósforo', 'B', null, null],
    ['opcion_multiple', 'geografia', '¿Cuál es la isla más grande del mundo por superficie territorial?', 'Madagascar', 'Groenlandia', 'Borneo', 'Nueva Guinea', 'B', null, null],
    ['opcion_multiple', 'geografia', '¿Cuál es la capital de Canadá?', 'Toronto', 'Montreal', 'Ottawa', 'Vancouver', 'C', null, null],
    ['opcion_multiple', 'geografia', '¿Qué país sudamericano no posee salida soberana al mar junto con Bolivia?', 'Uruguay', 'Paraguay', 'Ecuador', 'Surinam', 'B', null, null],
    ['opcion_multiple', 'geografia', '¿En qué país europeo se encuentra la región histórica de Transilvania?', 'Hungría', 'Rumania', 'Polonia', 'Bulgaria', 'B', null, null],
    ['opcion_multiple', 'geografia', '¿Qué mar interior de agua salada es el punto continental más bajo sobre la Tierra?', 'Mar Caspio', 'Mar Muerto', 'Mar Negro', 'Mar Rojo', 'B', null, null],
    ['opcion_multiple', 'geografia', '¿Cuál es la capital de Japón?', 'Kioto', 'Osaka', 'Tokio', 'Yokohama', 'C', null, null],
    ['opcion_multiple', 'geografia', '¿Qué país europeo tiene forma de bota peninsular en el mar Mediterráneo?', 'Grecia', 'Italia', 'Portugal', 'Croacia', 'B', null, null],

    // ==========================================
    // 8. ARTE, LITERATURA Y MÚSICA
    // ==========================================
    ['opcion_multiple', 'arte', '¿Quién pintó la enigmática obra "La Gioconda" (Mona Lisa)?', 'Miguel Ángel', 'Leonardo da Vinci', 'Rafael', 'Donatello', 'B', null, null],
    ['opcion_multiple', 'arte', '¿Quién escribió la obra cumbre "Don Quijote de la Mancha"?', 'Lope de Vega', 'Miguel de Cervantes', 'Francisco de Quevedo', 'Luis de Góngora', 'B', null, null],
    ['opcion_multiple', 'arte', '¿Qué compositor clásico alemán compuso la Novena Sinfonía estando casi completamente sordo?', 'Mozart', 'Ludwig van Beethoven', 'Johann Sebastian Bach', 'Johannes Brahms', 'B', null, null],
    ['opcion_multiple', 'arte', '¿Quién esculpió la monumental estatua de mármol del "David" en Florencia?', 'Donatello', 'Miguel Ángel', 'Bernini', 'Brunelleschi', 'B', null, null],
    ['opcion_multiple', 'arte', '¿Qué pintor holandés postimpresionista creó "La noche estrellada"?', 'Rembrandt', 'Vincent van Gogh', 'Johannes Vermeer', 'Piet Mondrian', 'B', null, null],
    ['opcion_multiple', 'arte', '¿De qué banda británica de rock formaron parte John Lennon y Paul McCartney?', 'The Rolling Stones', 'The Beatles', 'Queen', 'Pink Floyd', 'B', null, null],
    ['opcion_multiple', 'arte', '¿Quién escribió la novela distópica "1984"?', 'Aldous Huxley', 'George Orwell', 'Ray Bradbury', 'H.G. Wells', 'B', null, null],
    ['opcion_multiple', 'arte', '¿Qué pintor español creó el desgarrador mural antibélico "Guernica"?', 'Salvador Dalí', 'Pablo Picasso', 'Diego Velázquez', 'Francisco de Goya', 'B', null, null],
    ['opcion_multiple', 'arte', '¿Quién escribió la tragedia dramática "Romeo y Julieta"?', 'Charles Dickens', 'William Shakespeare', 'Oscar Wilde', 'Christopher Marlowe', 'B', null, null],
    ['opcion_multiple', 'arte', '¿Qué banda de rock británica lideró Freddie Mercury hasta 1991?', 'Led Zeppelin', 'Queen', 'The Who', 'The Clash', 'B', null, null],
    ['opcion_multiple', 'arte', '¿Qué pintor surrealista español es célebre por sus relojes derretidos en "La persistencia de la memoria"?', 'Joan Miró', 'Salvador Dalí', 'Pablo Picasso', 'Antoni Gaudí', 'B', null, null],
    ['opcion_multiple', 'arte', '¿Quién escribió la célebre novela colombiana "Cien años de soledad"?', 'Mario Vargas Llosa', 'Gabriel García Márquez', 'Julio Cortázar', 'Jorge Luis Borges', 'B', null, null],
    ['opcion_multiple', 'arte', '¿Qué género musical con raíces afroamericanas nació en Nueva Orleans a principios del siglo XX?', 'Rock and Roll', 'Jazz', 'Reggae', 'Country', 'B', null, null],
    ['opcion_multiple', 'arte', '¿Quién pintó el sobrecogedor cuadro expresionista "El grito"?', 'Gustav Klimt', 'Edvard Munch', 'Egon Schiele', 'Wassily Kandinsky', 'B', null, null],
    ['opcion_multiple', 'arte', '¿Qué filósofo griego fue maestro de Platón y bebió la cicuta tras ser condenado a muerte?', 'Aristóteles', 'Sócrates', 'Epicuro', 'Pitágoras', 'B', null, null],

    // ==========================================
    // 9. DESEMPATE: PREGUNTAS POR AÑO (APROXIMACIÓN TRIVIADOR)
    // ==========================================
    ['aproximacion', 'historia_peru', '¿En qué año se proclamó la Independencia del Perú por José de San Martín?', '', '', '', '', '1821', 1700, 1920],
    ['aproximacion', 'historia_peru', '¿En qué año ocurrió el Combate Naval de Angamos?', '', '', '', '', '1879', 1800, 1920],
    ['aproximacion', 'historia_peru', '¿En qué año se libró la Batalla de Ayacucho que selló la independencia del Perú?', '', '', '', '', '1824', 1750, 1850],
    ['aproximacion', 'historia_peru', '¿En qué año el explorador Hiram Bingham dio a conocer Machu Picchu al mundo?', '', '', '', '', '1911', 1850, 1950],
    ['aproximacion', 'historia_peru', '¿En qué año fundó Francisco Pizarro la ciudad de Lima (Ciudad de los Reyes)?', '', '', '', '', '1535', 1500, 1600],
    ['aproximacion', 'historia_universal', '¿En qué año cayó el Muro de Berlín marcando el fin de la Guerra Fría?', '', '', '', '', '1989', 1940, 2010],
    ['aproximacion', 'historia_universal', '¿En qué año llegó Cristóbal Colón a tierras americanas?', '', '', '', '', '1492', 1400, 1600],
    ['aproximacion', 'historia_universal', '¿En qué año concluyó formalmente la Segunda Guerra Mundial?', '', '', '', '', '1945', 1920, 1960],
    ['aproximacion', 'historia_universal', '¿En qué año dio inicio la Primera Guerra Mundial?', '', '', '', '', '1914', 1900, 1930],
    ['aproximacion', 'historia_universal', '¿En qué año se produjo la Toma de la Bastilla durante la Revolución Francesa?', '', '', '', '', '1789', 1750, 1850],
    ['aproximacion', 'historia_universal', '¿En qué año se disolvió formalmente la Unión Soviética (URSS)?', '', '', '', '', '1991', 1970, 2010],
    ['aproximacion', 'historia_universal', '¿En qué año ocurrió el trágico hundimiento del trasatlántico Titanic?', '', '', '', '', '1912', 1880, 1940],
    ['aproximacion', 'ciencia_tecnologia', '¿En qué año pisó el ser humano la Luna con la misión Apolo 11?', '', '', '', '', '1969', 1950, 2000],
    ['aproximacion', 'ciencia_tecnologia', '¿En qué año se lanzó el primer iPhone al mercado por Steve Jobs?', '', '', '', '', '2007', 1995, 2015],
    ['aproximacion', 'ciencia_tecnologia', '¿En qué año ocurrió el grave accidente nuclear en la central de Chernóbil?', '', '', '', '', '1986', 1970, 2005],
    ['aproximacion', 'cine_cultura', '¿En qué año se estrenó la película Titanic dirigida por James Cameron?', '', '', '', '', '1997', 1980, 2010],
    ['aproximacion', 'cine_cultura', '¿En qué año se estrenó en cines Star Wars: Episodio IV (Una nueva esperanza)?', '', '', '', '', '1977', 1965, 1995],
    ['aproximacion', 'cine_cultura', '¿En qué año se lanzó la primera película animada por computadora, Toy Story?', '', '', '', '', '1995', 1985, 2010],
    ['aproximacion', 'deportes', '¿En qué año se disputó el primer Mundial de Fútbol de la historia en Uruguay?', '', '', '', '', '1930', 1900, 1960],
    ['aproximacion', 'deportes', '¿En qué año ganó la selección de fútbol de Argentina su primer Mundial siendo anfitriona?', '', '', '', '', '1978', 1960, 2000]
  ];

  preguntas.forEach(p => stmt.run(p));
  stmt.finalize();

  console.log(`Base de datos poblada exitosamente: ${preguntas.length} preguntas listas en preguntas.db.`);
});

db.close();