-- =============================================
-- DATOS INICIALES PARA BASE DE DATOS SWAY
-- =============================================
USE sway;
-- Cambiado a la base de datos correcta
-- =============================================
-- DATOS PARA DIRECCIONES
-- =============================================
INSERT INTO estados (nombre)
VALUES ('Querétaro'),
    ('Ciudad de México'),
    ('Veracruz'),
    ('Quintana Roo'),
    ('Baja California'),
    ('Yucatán'),
    ('Jalisco'),
    ('Nuevo León');
INSERT INTO municipios (nombre, id_estado)
VALUES ('Santiago de Querétaro', 1),
    ('Corregidora', 1),
    ('El Marqués', 1),
    ('Miguel Hidalgo', 2),
    ('Coyoacán', 2),
    ('Veracruz', 3),
    ('Boca del Río', 3),
    ('Cozumel', 4),
    ('Playa del Carmen', 4),
    ('Ensenada', 5),
    ('Tijuana', 5),
    ('Mérida', 6),
    ('Valladolid', 6),
    ('Guadalajara', 7),
    ('Puerto Vallarta', 7),
    ('Monterrey', 8),
    ('San Pedro Garza García', 8);
INSERT INTO colonias (nombre, id_municipio, cp)
VALUES ('Centro Histórico', 1, 76000),
    ('Juriquilla', 1, 76230),
    ('Zakia', 1, 76269),
    ('El Pueblito', 2, 76900),
    ('Canadas del Lago', 2, 76904),
    ('Zibatá', 3, 76246),
    ('La Pradera', 3, 76220),
    ('Polanco', 4, 11560),
    ('Roma Norte', 5, 06700),
    ('Centro', 6, 91700),
    ('Mocambo', 7, 94293),
    ('Centro', 8, 77600),
    ('Playacar', 9, 77710),
    ('La Bocana', 10, 22880),
    ('Zona Río', 11, 22010),
    ('García Ginerés', 12, 97070),
    ('Centro', 13, 97780),
    ('Americana', 14, 44160),
    ('Zona Hotelera', 15, 48300),
    ('Centro', 16, 64000),
    ('San Pedro', 17, 66220);
INSERT INTO calles (nombre, id_colonia, n_interior, n_exterior)
VALUES ('Av. Universidad', 1, NULL, 123),
    ('Blvd. Juriquilla', 2, NULL, 456),
    ('Av. Zakia', 3, NULL, 789),
    ('Calle Pueblito', 4, NULL, 101),
    ('Av. Canadas', 5, NULL, 202),
    ('Blvd. Zibatá', 6, NULL, 303),
    ('Av. La Pradera', 7, NULL, 404),
    ('Av. Presidente Masaryk', 8, NULL, 505),
    ('Av. Álvaro Obregón', 9, NULL, 606),
    ('Av. Independencia', 10, NULL, 707),
    ('Av. Ruiz Cortines', 11, NULL, 808),
    ('Av. Rafael E. Melgar', 12, NULL, 909),
    ('Av. Constituyentes', 13, NULL, 1010),
    ('Av. Reforma', 14, NULL, 1111),
    ('Av. Francisco Villa', 15, NULL, 1212),
    ('Calle 60', 16, NULL, 1313),
    ('Calle 41', 17, NULL, 1414),
    ('Av. Américas', 18, NULL, 1515),
    ('Av. Francisco Medina Ascencio', 19, NULL, 1616),
    ('Av. Constitución', 20, NULL, 1717),
    ('Av. Vasconcelos', 21, NULL, 1818);
INSERT INTO direcciones (id_calle)
VALUES (1),
    (2),
    (3),
    (4),
    (5),
    (6),
    (7),
    (8),
    (9),
    (10),
    (11),
    (12),
    (13),
    (14),
    (15),
    (16),
    (17),
    (18),
    (19),
    (20),
    (21);
-- =============================================
-- DATOS PARA CATÁLOGOS
-- =============================================
INSERT INTO Especialidades (nombre)
VALUES ('Biología Marina'),
    ('Oceanografía'),
    ('Ecología'),
    ('Conservación Ambiental'),
    ('Veterinaria Marina'),
    ('Educación Ambiental'),
    ('Investigación Científica'),
    ('Comunicación Científica');
INSERT INTO Instituciones (nombre)
VALUES ('Universidad Nacional Autónoma de México'),
    (
        'Centro de Investigación Científica y de Educación Superior de Ensenada'
    ),
    ('Instituto Politécnico Nacional'),
    ('Universidad Autónoma de Baja California'),
    ('Universidad Veracruzana'),
    ('Centro de Investigación y Estudios Avanzados'),
    ('Universidad de Guadalajara'),
    ('Universidad Politécnica de Querétaro');
INSERT INTO Organizaciones (nombre)
VALUES ('SWAY - Conservación Marina'),
    ('WWF México'),
    ('Greenpeace México'),
    ('Oceana México'),
    ('Pronatura'),
    ('Fundación Carlos Slim'),
    ('Grupo Ecológico Sierra Gorda'),
    ('Fundación Mexicana para la Conservación Marina');
INSERT INTO TipoDonaciones (nombre)
VALUES ('Donación Única'),
    ('Donación Mensual'),
    ('Donación Anual'),
    ('Donación Corporativa'),
    ('Donación en Especie');
INSERT INTO TiposTarjeta (nombre)
VALUES ('Visa'),
    ('Mastercard'),
    ('American Express'),
    ('Tarjeta de Débito'),
    ('PayPal');
INSERT INTO Estatus (nombre)
VALUES ('Activo'),
    ('Inactivo'),
    ('Pendiente'),
    ('Completado'),
    ('Cancelado'),
    ('En Proceso'),
    ('Confirmado'),
    ('Rechazado');
INSERT INTO Cargos (nombre)
VALUES ('Director'),
    ('Coordinador'),
    ('Investigador'),
    ('Educador'),
    ('Voluntario'),
    ('Asistente'),
    ('Especialista'),
    ('Consultor');
INSERT INTO Modalidades (nombre)
VALUES ('Presencial'),
    ('Virtual'),
    ('Híbrida'),
    ('Webinar'),
    ('Taller Práctico');
INSERT INTO Materiales (nombre)
VALUES ('Algodón Orgánico'),
    ('Bambú'),
    ('Plástico Reciclado'),
    ('Vidrio'),
    ('Metal Reciclado'),
    ('Papel Reciclado'),
    ('Madera Sustentable'),
    ('Fibra Natural');
INSERT INTO Idiomas (nombre)
VALUES ('Español'),
    ('Inglés'),
    ('Francés'),
    ('Portugués'),
    ('Alemán');
-- =============================================
-- DATOS PARA USUARIOS Y ROLES
-- =============================================
INSERT INTO Usuarios (
        nombre,
        email,
        suscrito_newsletter,
        fecha_registro
    )
VALUES (
        'Ana García López',
        'ana.garcia@email.com',
        1,
        '2024-01-15'
    ),
    (
        'Carlos Rodríguez',
        'carlos.rodriguez@email.com',
        1,
        '2024-01-20'
    ),
    (
        'María Fernández',
        'maria.fernandez@email.com',
        0,
        '2024-02-01'
    ),
    (
        'Juan Martínez',
        'juan.martinez@email.com',
        1,
        '2024-02-15'
    ),
    (
        'Laura Sánchez',
        'laura.sanchez@email.com',
        1,
        '2024-03-01'
    ),
    (
        'Pedro Ramírez',
        'pedro.ramirez@email.com',
        0,
        '2024-03-10'
    ),
    (
        'Isabel Torres',
        'isabel.torres@email.com',
        1,
        '2024-03-20'
    ),
    (
        'Miguel Herrera',
        'miguel.herrera@email.com',
        1,
        '2024-04-01'
    ),
    (
        'Carmen Jiménez',
        'carmen.jimenez@email.com',
        0,
        '2024-04-15'
    ),
    (
        'Rafael Morales',
        'rafael.morales@email.com',
        1,
        '2024-05-01'
    );
INSERT INTO Autores (
        id_usuario,
        biografia,
        id_especialidad,
        id_institucion
    )
VALUES (
        1,
        'Doctora en Biología Marina con 15 años de experiencia en conservación de tortugas marinas.',
        1,
        1
    ),
    (
        2,
        'Investigador oceanógrafo especializado en el estudio de corrientes marinas del Golfo de México.',
        2,
        2
    ),
    (
        4,
        'Biólogo marino con maestría en ecología, enfocado en la conservación de arrecifes de coral.',
        3,
        3
    ),
    (
        6,
        'Veterinario especializado en mamíferos marinos, con experiencia en rehabilitación de fauna marina.',
        5,
        4
    ),
    (
        8,
        'Educador ambiental con 10 años promoviendo la conservación marina en comunidades costeras.',
        6,
        7
    );
INSERT INTO Organizadores (
        id_usuario,
        id_organizacion,
        id_cargo,
        experiencia_eventos,
        certificado
    )
VALUES (3, 1, 2, 25, 1),
    (5, 2, 1, 40, 1),
    (7, 3, 3, 15, 1),
    (9, 4, 2, 30, 1),
    (10, 5, 5, 8, 0);
-- =============================================
-- DATOS PARA ESPECIES Y CONSERVACIÓN
-- =============================================
INSERT INTO EstadosConservacion (nombre, descripcion)
VALUES (
        'Extinto',
        'Especie que ya no existe en la naturaleza'
    ),
    (
        'Extinto en Estado Silvestre',
        'Especie que solo existe en cautiverio'
    ),
    (
        'En Peligro Crítico',
        'Especie que enfrenta un riesgo extremadamente alto de extinción'
    ),
    (
        'En Peligro',
        'Especie que enfrenta un riesgo muy alto de extinción'
    ),
    (
        'Vulnerable',
        'Especie que enfrenta un riesgo alto de extinción'
    ),
    (
        'Casi Amenazada',
        'Especie que podría estar amenazada en el futuro cercano'
    ),
    (
        'Preocupación Menor',
        'Especie con bajo riesgo de extinción'
    ),
    (
        'Datos Insuficientes',
        'No hay suficiente información para evaluar el riesgo'
    );
INSERT INTO Habitats (nombre, descripcion)
VALUES (
        'Arrecifes de Coral',
        'Ecosistemas marinos diversos con alta biodiversidad'
    ),
    (
        'Aguas Abiertas',
        'Zonas pelágicas alejadas de la costa'
    ),
    (
        'Zona Costera',
        'Áreas cercanas a la costa con influencia terrestre'
    ),
    (
        'Aguas Profundas',
        'Zonas abisales con condiciones extremas'
    ),
    (
        'Manglares',
        'Ecosistemas costeros con vegetación adaptada a agua salada'
    ),
    (
        'Estuarios',
        'Zonas donde los ríos se encuentran con el mar'
    ),
    (
        'Praderas Marinas',
        'Ecosistemas submarinos con plantas vasculares'
    ),
    (
        'Aguas Polares',
        'Zonas frías con condiciones extremas de temperatura'
    );
INSERT INTO Amenazas (nombre, descripcion)
VALUES (
        'Contaminación Plástica',
        'Acumulación de desechos plásticos en el océano'
    ),
    (
        'Cambio Climático',
        'Alteración del clima por actividades humanas'
    ),
    (
        'Sobrepesca',
        'Extracción excesiva de recursos pesqueros'
    ),
    (
        'Acidificación Oceánica',
        'Reducción del pH del océano por CO2'
    ),
    (
        'Pérdida de Hábitat',
        'Destrucción o degradación de ecosistemas marinos'
    ),
    (
        'Contaminación Química',
        'Presencia de sustancias tóxicas en el agua'
    ),
    (
        'Ruido Oceánico',
        'Contaminación acústica por actividades humanas'
    ),
    (
        'Especies Invasoras',
        'Introducción de especies no nativas'
    ),
    (
        'Turismo Irresponsable',
        'Actividades turísticas que dañan ecosistemas'
    ),
    (
        'Pesca Incidental',
        'Captura accidental de especies no objetivo'
    );
INSERT INTO Caracteristicas (tipo_caracteristica, valor)
VALUES ('Longitud', '1.5 metros'),
    ('Longitud', '30 metros'),
    ('Longitud', '2.5 metros'),
    ('Longitud', '0.8 metros'),
    ('Peso', '200 toneladas'),
    ('Peso', '150 kg'),
    ('Peso', '300 kg'),
    ('Peso', '50 kg'),
    ('Profundidad', '0-50 metros'),
    ('Profundidad', '0-200 metros'),
    ('Profundidad', '200-1000 metros'),
    ('Profundidad', '1000+ metros'),
    ('Temperatura', '20-30°C'),
    ('Temperatura', '15-25°C'),
    ('Temperatura', '0-10°C'),
    ('Velocidad', '50 km/h'),
    ('Velocidad', '30 km/h'),
    ('Velocidad', '10 km/h');
INSERT INTO Especies (
        nombre_comun,
        nombre_cientifico,
        descripcion,
        esperanza_vida,
        poblacion_estimada,
        id_estado_conservacion,
        imagen_url
    )
VALUES (
        'Tortuga Verde',
        'Chelonia mydas',
        'Una de las tortugas marinas más grandes, conocida por su dieta herbívora y migración de larga distancia.',
        80,
        85000,
        5,
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
    ),
    (
        'Ballena Azul',
        'Balaenoptera musculus',
        'El animal más grande que ha existido en la Tierra, puede alcanzar hasta 30 metros de longitud.',
        90,
        15000,
        4,
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
    ),
    (
        'Vaquita Marina',
        'Phocoena sinus',
        'Marsopa endémica del Golfo de California, es el cetáceo más amenazado del mundo.',
        20,
        10,
        3,
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
    ),
    (
        'Coral Cuerno de Alce',
        'Acropora palmata',
        'Coral constructor de arrecifes crucial para la biodiversidad del Caribe.',
        100,
        50000,
        3,
        'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800'
    ),
    (
        'Delfín Nariz de Botella',
        'Tursiops truncatus',
        'Delfín inteligente y social, común en aguas costeras tropicales y templadas.',
        50,
        600000,
        7,
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
    ),
    (
        'Tiburón Ballena',
        'Rhincodon typus',
        'El pez más grande del mundo, filtrador de plancton y completamente inofensivo.',
        70,
        200000,
        4,
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
    ),
    (
        'Manatí del Caribe',
        'Trichechus manatus',
        'Mamífero acuático herbívoro que habita en aguas costeras cálidas.',
        60,
        13000,
        5,
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
    ),
    (
        'Tortuga Carey',
        'Eretmochelys imbricata',
        'Tortuga marina conocida por su hermoso caparazón y su papel en la salud de los arrecifes.',
        80,
        23000,
        3,
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
    );
-- Relaciones Especies-Habitats
INSERT INTO EspeciesHabitats (id_especie, id_habitat)
VALUES (1, 3),
    (1, 5),
    (1, 6),
    -- Tortuga Verde
    (2, 2),
    (2, 8),
    -- Ballena Azul
    (3, 3),
    (3, 6),
    -- Vaquita Marina
    (4, 1),
    (4, 3),
    -- Coral Cuerno de Alce
    (5, 2),
    (5, 3),
    -- Delfín Nariz de Botella
    (6, 1),
    (6, 2),
    -- Tiburón Ballena
    (7, 3),
    (7, 5),
    (7, 6),
    -- Manatí del Caribe
    (8, 1),
    (8, 3);
-- Tortuga Carey
-- Relaciones Especies-Amenazas
INSERT INTO EspeciesAmenazas (id_especie, id_amenaza)
VALUES (1, 1),
    (1, 2),
    (1, 5),
    (1, 10),
    -- Tortuga Verde
    (2, 2),
    (2, 6),
    (2, 7),
    (2, 3),
    -- Ballena Azul
    (3, 3),
    (3, 7),
    (3, 10),
    (3, 6),
    -- Vaquita Marina
    (4, 2),
    (4, 4),
    (4, 6),
    (4, 9),
    -- Coral Cuerno de Alce
    (5, 1),
    (5, 6),
    (5, 7),
    (5, 10),
    -- Delfín Nariz de Botella
    (6, 3),
    (6, 2),
    (6, 7),
    (6, 9),
    -- Tiburón Ballena
    (7, 1),
    (7, 2),
    (7, 5),
    (7, 6),
    -- Manatí del Caribe
    (8, 1),
    (8, 2),
    (8, 5),
    (8, 9);
-- Tortuga Carey
-- Relaciones Especies-Características
INSERT INTO EspeciesCaracteristicas (id_especie, id_caracteristica)
VALUES (1, 1),
    (1, 6),
    (1, 9),
    (1, 13),
    -- Tortuga Verde
    (2, 2),
    (2, 5),
    (2, 10),
    (2, 14),
    -- Ballena Azul
    (3, 4),
    (3, 8),
    (3, 9),
    (3, 13),
    -- Vaquita Marina
    (4, 9),
    (4, 13),
    -- Coral Cuerno de Alce
    (5, 3),
    (5, 7),
    (5, 10),
    (5, 16),
    -- Delfín Nariz de Botella
    (6, 2),
    (6, 5),
    (6, 10),
    (6, 13),
    -- Tiburón Ballena
    (7, 3),
    (7, 7),
    (7, 9),
    (7, 17),
    -- Manatí del Caribe
    (8, 1),
    (8, 6),
    (8, 9),
    (8, 13);
-- Tortuga Carey
-- =============================================
-- DATOS PARA AVISTAMIENTOS
-- =============================================
INSERT INTO Avistamientos (
        id_especie,
        fecha,
        latitud,
        longitud,
        notas,
        id_usuario
    )
VALUES (
        1,
        '2024-06-01 10:30:00',
        20.9674,
        -89.5926,
        'Grupo de 5 tortugas verdes alimentándose en praderas marinas',
        1
    ),
    (
        2,
        '2024-06-05 14:15:00',
        28.2916,
        -113.1471,
        'Avistamiento de ballena azul con cría durante migración',
        2
    ),
    (
        3,
        '2024-06-10 09:00:00',
        31.3069,
        -114.0825,
        'Vaquita marina vista brevemente en la superficie',
        4
    ),
    (
        4,
        '2024-06-15 11:45:00',
        20.5083,
        -87.4581,
        'Colonia de corales en recuperación después de blanqueamiento',
        1
    ),
    (
        5,
        '2024-06-20 16:20:00',
        23.6345,
        -109.1191,
        'Manada de delfines nariz de botella jugando en la superficie',
        3
    ),
    (
        6,
        '2024-06-25 08:30:00',
        18.7669,
        -88.0821,
        'Tiburón ballena alimentándose de plancton',
        5
    ),
    (
        7,
        '2024-06-30 12:00:00',
        21.1619,
        -86.8515,
        'Manatí con cría descansando en aguas someras',
        2
    ),
    (
        8,
        '2024-07-01 07:45:00',
        20.6296,
        -87.0739,
        'Tortuga carey anidando en playa protegida',
        4
    );
-- =============================================
-- DATOS PARA TIPOS DE EVENTO Y EVENTOS
-- =============================================
INSERT INTO TiposEvento (nombre, descripcion)
VALUES (
        'Conferencia',
        'Presentación científica sobre temas de conservación marina'
    ),
    (
        'Taller',
        'Actividad práctica de educación ambiental'
    ),
    (
        'Limpieza de Playa',
        'Actividad de voluntariado para limpieza costera'
    ),
    (
        'Seminario',
        'Sesión educativa sobre biodiversidad marina'
    ),
    (
        'Expedición',
        'Viaje de investigación y observación'
    ),
    (
        'Campaña de Concientización',
        'Actividad de divulgación y sensibilización'
    ),
    (
        'Capacitación',
        'Formación especializada en conservación'
    ),
    (
        'Festival',
        'Evento cultural y educativo sobre el océano'
    );
INSERT INTO Eventos (
        titulo,
        descripcion,
        fecha_evento,
        hora_inicio,
        hora_fin,
        id_tipo_evento,
        id_modalidad,
        id_direccion,
        url_evento,
        capacidad_maxima,
        costo,
        id_organizador,
        id_estatus
    )
VALUES (
        'Conservación de Tortugas Marinas en México',
        'Conferencia sobre los esfuerzos de conservación de tortugas marinas en las costas mexicanas',
        '2025-08-15',
        '09:00',
        '12:00',
        1,
        1,
        1,
        'https://sway.org/eventos/tortugas-marinas',
        100,
        0.00,
        1,
        1
    ),
    (
        'Taller de Identificación de Especies Marinas',
        'Actividad práctica para aprender a identificar especies marinas comunes',
        '2025-08-20',
        '10:00',
        '16:00',
        2,
        1,
        2,
        'https://sway.org/eventos/identificacion-especies',
        50,
        200.00,
        2,
        1
    ),
    (
        'Limpieza de Playa Veracruz',
        'Jornada de limpieza costera en las playas de Veracruz',
        '2025-08-25',
        '08:00',
        '12:00',
        3,
        1,
        10,
        NULL,
        200,
        0.00,
        3,
        1
    ),
    (
        'Webinar: Cambio Climático y Océanos',
        'Seminario virtual sobre el impacto del cambio climático en los ecosistemas marinos',
        '2025-09-01',
        '19:00',
        '21:00',
        4,
        2,
        NULL,
        'https://zoom.us/webinar/clima-oceanos',
        500,
        0.00,
        4,
        1
    ),
    (
        'Expedición Científica Cozumel',
        'Viaje de investigación para estudiar arrecifes de coral en Cozumel',
        '2025-09-10',
        '07:00',
        '18:00',
        5,
        1,
        12,
        'https://sway.org/expedicion-cozumel',
        20,
        1500.00,
        5,
        1
    ),
    (
        'Campaña Salvar las Ballenas',
        'Actividad de concientización sobre la conservación de ballenas',
        '2025-09-15',
        '11:00',
        '15:00',
        6,
        3,
        3,
        'https://sway.org/salvar-ballenas',
        300,
        0.00,
        1,
        1
    ),
    (
        'Capacitación en Rescate de Fauna Marina',
        'Curso especializado para el rescate y rehabilitación de fauna marina',
        '2025-09-20',
        '08:00',
        '17:00',
        7,
        1,
        4,
        'https://sway.org/capacitacion-rescate',
        30,
        800.00,
        2,
        1
    ),
    (
        'Festival del Océano SWAY',
        'Festival cultural y educativo sobre la biodiversidad marina',
        '2025-10-01',
        '10:00',
        '20:00',
        8,
        1,
        5,
        'https://sway.org/festival-oceano',
        1000,
        50.00,
        3,
        1
    );
-- =============================================
-- DATOS PARA BIBLIOTECA
-- =============================================
INSERT INTO TiposRecurso (nombre, descripcion)
VALUES (
        'Artículo Científico',
        'Publicación de investigación científica revisada por pares'
    ),
    (
        'Guía Educativa',
        'Material educativo para diferentes niveles'
    ),
    (
        'Informe Técnico',
        'Documento técnico con resultados de investigación'
    ),
    (
        'Video Educativo',
        'Contenido audiovisual con fines educativos'
    ),
    (
        'Presentación',
        'Material de apoyo para conferencias y talleres'
    ),
    ('Manual', 'Guía práctica de procedimientos'),
    (
        'Libro Digital',
        'Publicación digital sobre temas de conservación'
    ),
    ('Podcast', 'Contenido de audio educativo');
INSERT INTO RecursosBiblioteca (
        titulo,
        descripcion,
        id_tipo_recurso,
        archivo_url,
        tamaño_mb,
        formato,
        id_autor,
        fecha_publicacion,
        numero_paginas,
        duracion_minutos,
        id_idioma,
        licencia,
        activo
    )
VALUES (
        'Guía de Identificación de Tortugas Marinas',
        'Manual completo para la identificación de especies de tortugas marinas en México',
        2,
        'https://sway.org/recursos/guia-tortugas.pdf',
        25.5,
        'PDF',
        1,
        '2024-03-15',
        120,
        NULL,
        1,
        'Creative Commons',
        1
    ),
    (
        'El Impacto del Cambio Climático en Arrecifes de Coral',
        'Artículo sobre los efectos del calentamiento global en los ecosistemas coralinos',
        1,
        'https://sway.org/recursos/clima-arrecifes.pdf',
        8.2,
        'PDF',
        2,
        '2024-04-10',
        45,
        NULL,
        1,
        'Open Access',
        1
    ),
    (
        'Técnicas de Rehabilitación de Mamíferos Marinos',
        'Manual técnico para la rehabilitación de mamíferos marinos heridos',
        6,
        'https://sway.org/recursos/rehab-mamiferos.pdf',
        18.7,
        'PDF',
        3,
        '2024-05-20',
        85,
        NULL,
        1,
        'CC BY-SA',
        1
    ),
    (
        'Documental: Vida en los Arrecifes',
        'Video educativo sobre la biodiversidad en los arrecifes de coral',
        4,
        'https://sway.org/recursos/vida-arrecifes.mp4',
        850.3,
        'MP4',
        4,
        '2024-06-01',
        NULL,
        45,
        1,
        'Educational Use',
        1
    ),
    (
        'Conservación Marina: Estrategias Exitosas',
        'Presentación sobre casos de éxito en conservación marina mundial',
        5,
        'https://sway.org/recursos/estrategias-conservacion.pptx',
        12.4,
        'PPTX',
        5,
        '2024-06-15',
        60,
        NULL,
        1,
        'CC BY',
        1
    ),
    (
        'Protocolo de Monitoreo de Avistamientos',
        'Guía para el registro científico de avistamientos de fauna marina',
        6,
        'https://sway.org/recursos/protocolo-monitoreo.pdf',
        6.8,
        'PDF',
        1,
        '2024-07-01',
        32,
        NULL,
        1,
        'Open Access',
        1
    ),
    (
        'Podcast: Voces del Océano',
        'Serie de entrevistas con expertos en conservación marina',
        8,
        'https://sway.org/recursos/voces-oceano-ep1.mp3',
        45.2,
        'MP3',
        2,
        '2024-07-05',
        NULL,
        60,
        1,
        'CC BY-NC',
        1
    ),
    (
        'Manual de Primeros Auxilios para Fauna Marina',
        'Procedimientos de emergencia para ayudar a animales marinos',
        6,
        'https://sway.org/recursos/primeros-auxilios.pdf',
        15.1,
        'PDF',
        3,
        '2024-07-10',
        75,
        NULL,
        1,
        'Educational Use',
        1
    );
-- Tags para recursos
INSERT INTO TagsRecurso (nombre)
VALUES ('Conservación'),
    ('Educación'),
    ('Investigación'),
    ('Tortugas'),
    ('Ballenas'),
    ('Arrecifes'),
    ('Cambio Climático'),
    ('Rehabilitación'),
    ('Monitoreo'),
    ('Primeros Auxilios'),
    ('Biodiversidad'),
    ('Ecosistemas'),
    ('Sostenibilidad'),
    ('Océanos'),
    ('Fauna Marina');
-- Relaciones Recursos-Tags
INSERT INTO RecursosTags (id_recurso, id_tag)
VALUES (1, 1),
    (1, 2),
    (1, 4),
    (1, 11),
    -- Guía de Tortugas
    (2, 3),
    (2, 6),
    (2, 7),
    (2, 12),
    -- Cambio Climático Arrecifes
    (3, 1),
    (3, 5),
    (3, 8),
    (3, 15),
    -- Rehabilitación Mamíferos
    (4, 2),
    (4, 6),
    (4, 11),
    (4, 14),
    -- Documental Arrecifes
    (5, 1),
    (5, 3),
    (5, 13),
    (5, 14),
    -- Estrategias Conservación
    (6, 3),
    (6, 9),
    (6, 15),
    (6, 14),
    -- Protocolo Monitoreo
    (7, 2),
    (7, 1),
    (7, 14),
    (7, 15),
    -- Podcast Océano
    (8, 2),
    (8, 8),
    (8, 10),
    (8, 15);
-- Primeros Auxilios
-- =============================================
-- DATOS PARA TIENDA
-- =============================================
INSERT INTO CategoriasProducto (nombre, descripcion)
VALUES (
        'Ropa Sostenible',
        'Prendas fabricadas con materiales ecológicos'
    ),
    (
        'Accesorios Ecológicos',
        'Productos útiles hechos con materiales reciclados'
    ),
    (
        'Educativos',
        'Materiales educativos sobre conservación marina'
    ),
    (
        'Hogar Sustentable',
        'Productos para el hogar que respetan el medio ambiente'
    ),
    (
        'Juguetes Ecológicos',
        'Juguetes fabricados con materiales naturales'
    ),
    (
        'Libros y Guías',
        'Publicaciones sobre vida marina y conservación'
    ),
    (
        'Arte y Decoración',
        'Objetos decorativos con temática marina'
    ),
    (
        'Equipos de Limpieza',
        'Herramientas para limpieza de playas y océanos'
    );
INSERT INTO Productos (
        nombre,
        descripcion,
        precio,
        id_categoria,
        stock,
        imagen_url,
        id_material,
        dimensiones,
        peso_gramos,
        es_sostenible,
        activo
    )
VALUES (
        'Camiseta SWAY Tortuga Verde',
        'Camiseta 100% algodón orgánico con diseño de tortuga verde',
        299.00,
        1,
        150,
        'https://sway.org/products/camiseta-tortuga.jpg',
        1,
        'S, M, L, XL',
        200,
        1,
        1
    ),
    (
        'Botella de Agua Reutilizable',
        'Botella de acero inoxidable con logo SWAY, libre de BPA',
        399.00,
        2,
        200,
        'https://sway.org/products/botella-agua.jpg',
        5,
        '750ml',
        350,
        1,
        1
    ),
    (
        'Guía de Especies Marinas de México',
        'Libro impreso con información de 200 especies marinas mexicanas',
        450.00,
        6,
        100,
        'https://sway.org/products/guia-especies.jpg',
        6,
        '21x28cm',
        800,
        1,
        1
    ),
    (
        'Bolsa de Compras Eco-Friendly',
        'Bolsa reutilizable hecha de plástico reciclado del océano',
        149.00,
        2,
        300,
        'https://sway.org/products/bolsa-eco.jpg',
        3,
        '40x35cm',
        80,
        1,
        1
    ),
    (
        'Puzzle Arrecife de Coral',
        'Rompecabezas de 1000 piezas con imagen de arrecife de coral',
        299.00,
        5,
        75,
        'https://sway.org/products/puzzle-arrecife.jpg',
        6,
        '70x50cm',
        600,
        1,
        1
    ),
    (
        'Vaso de Bambú SWAY',
        'Vaso térmico de bambú con tapa, ideal para bebidas calientes',
        199.00,
        4,
        120,
        'https://sway.org/products/vaso-bambu.jpg',
        2,
        '350ml',
        150,
        1,
        1
    ),
    (
        'Cuaderno de Notas Marino',
        'Cuaderno de papel reciclado con portada de vida marina',
        89.00,
        3,
        200,
        'https://sway.org/products/cuaderno-marino.jpg',
        6,
        '15x21cm',
        180,
        1,
        1
    ),
    (
        'Kit de Limpieza de Playa',
        'Set completo para limpieza de playas: bolsas, guantes, recogedores',
        399.00,
        8,
        50,
        'https://sway.org/products/kit-limpieza.jpg',
        3,
        '30x20x10cm',
        500,
        1,
        1
    ),
    (
        'Gorra Solar SWAY',
        'Gorra con protección UV y logo bordado de SWAY',
        249.00,
        1,
        180,
        'https://sway.org/products/gorra-solar.jpg',
        1,
        'Ajustable',
        120,
        1,
        1
    ),
    (
        'Llavero de Tortuga Marina',
        'Llavero artesanal de madera con forma de tortuga',
        59.00,
        2,
        250,
        'https://sway.org/products/llavero-tortuga.jpg',
        7,
        '8x5cm',
        25,
        1,
        1
    );
-- =============================================
-- DATOS PARA PEDIDOS Y RESEÑAS
-- =============================================
INSERT INTO Pedidos (
        id_usuario,
        fecha_pedido,
        total,
        id_estatus,
        id_direccion,
        telefono_contacto
    )
VALUES (
        1,
        '2024-06-01 14:30:00',
        698.00,
        4,
        1,
        '4421234567'
    ),
    (
        2,
        '2024-06-05 10:15:00',
        448.00,
        4,
        2,
        '4421234568'
    ),
    (
        3,
        '2024-06-10 16:45:00',
        597.00,
        4,
        3,
        '4421234569'
    ),
    (
        4,
        '2024-06-15 11:20:00',
        299.00,
        4,
        4,
        '4421234570'
    ),
    (
        5,
        '2024-06-20 13:10:00',
        850.00,
        6,
        5,
        '4421234571'
    );
INSERT INTO DetallesPedido (
        id_pedido,
        id_producto,
        cantidad,
        precio_unitario,
        subtotal
    )
VALUES (1, 1, 1, 299.00, 299.00),
    (1, 2, 1, 399.00, 399.00),
    (2, 3, 1, 450.00, 450.00),
    (3, 4, 2, 149.00, 298.00),
    (3, 1, 1, 299.00, 299.00),
    (4, 1, 1, 299.00, 299.00),
    (5, 8, 1, 399.00, 399.00),
    (5, 3, 1, 450.00, 450.00);
INSERT INTO ReseñasProducto (
        id_producto,
        id_usuario,
        calificacion,
        comentario,
        fecha_reseña
    )
VALUES (
        1,
        1,
        5,
        'Excelente calidad, la tela es muy suave y el diseño hermoso. Muy recomendable.',
        '2024-06-10'
    ),
    (
        2,
        2,
        4,
        'Buena botella, mantiene la temperatura bien. Solo le falta un poco más de capacidad.',
        '2024-06-12'
    ),
    (
        3,
        3,
        5,
        'Guía completa y bien ilustrada. Perfecta para estudiantes y amantes de la vida marina.',
        '2024-06-18'
    ),
    (
        4,
        1,
        5,
        'Me encanta que esté hecha de plástico reciclado. Es resistente y muy útil.',
        '2024-06-20'
    ),
    (
        1,
        4,
        4,
        'Buena camiseta, aunque el talla un poco grande. El material es excelente.',
        '2024-06-25'
    );
-- =============================================
-- DATOS PARA DONACIONES Y TESTIMONIOS
-- =============================================
INSERT INTO Donadores (
        id_usuario,
        monto,
        fecha_donacion,
        id_tipoDonacion
    )
VALUES (1, 500.00, '2024-01-20', 1),
    (2, 100.00, '2024-02-15', 2),
    (3, 1000.00, '2024-03-10', 1),
    (4, 50.00, '2024-04-05', 2),
    (5, 250.00, '2024-05-12', 1),
    (6, 75.00, '2024-06-01', 2),
    (7, 800.00, '2024-06-15', 1),
    (8, 200.00, '2024-07-01', 2);
INSERT INTO Testimonios (id_usuario, testimonio, fecha_creacion, aprobado)
VALUES (
        1,
        'SWAY ha cambiado mi perspectiva sobre la conservación marina. Sus programas educativos son excepcionales y realmente hacen la diferencia.',
        '2024-06-01',
        1
    ),
    (
        2,
        'Participé en la limpieza de playa organizada por SWAY. Fue una experiencia increíble ver el impacto positivo que podemos tener trabajando juntos.',
        '2024-06-05',
        1
    ),
    (
        3,
        'Los recursos educativos de SWAY son de calidad mundial. Como educador, los uso constantemente en mis clases.',
        '2024-06-10',
        1
    ),
    (
        4,
        'Adopté una tortuga marina a través de SWAY y recibo actualizaciones regulares. Es emocionante ser parte de su recuperación.',
        '2024-06-15',
        1
    ),
    (
        5,
        'La tienda de SWAY ofrece productos realmente sostenibles. Me encanta poder comprar con conciencia ambiental.',
        '2024-06-20',
        1
    );
INSERT INTO Contactos (
        id_usuario,
        asunto,
        mensaje,
        fecha_contacto,
        respondido
    )
VALUES (
        1,
        'Consulta sobre voluntariado',
        'Hola, me interesa ser voluntario en sus programas de conservación marina. ¿Podrían enviarme información?',
        '2024-06-01',
        1
    ),
    (
        2,
        'Pregunta sobre especies',
        '¿Tienen información sobre el estado de las mantarrayas en México?',
        '2024-06-05',
        1
    ),
    (
        3,
        'Colaboración educativa',
        'Soy maestro y me gustaría colaborar con SWAY para llevar educación marina a mi escuela.',
        '2024-06-10',
        1
    ),
    (
        4,
        'Reporte de avistamiento',
        'Vi una ballena jorobada en la costa de Guerrero. ¿Cómo puedo reportar este avistamiento?',
        '2024-06-15',
        1
    ),
    (
        5,
        'Consulta sobre donaciones',
        '¿Puedo hacer una donación en especie? Tengo equipos de buceo que ya no uso.',
        '2024-06-20',
        0
    );
-- =============================================
-- DATOS PARA REGISTROS DE EVENTOS
-- =============================================
INSERT INTO RegistrosEvento (id_evento, id_usuario, fecha_registro, asistio)
VALUES (1, 1, '2024-06-01', 1),
    (1, 2, '2024-06-02', 1),
    (1, 3, '2024-06-03', 1),
    (2, 4, '2024-06-05', 1),
    (2, 5, '2024-06-06', 1),
    (3, 6, '2024-06-10', 1),
    (3, 7, '2024-06-11', 1),
    (3, 8, '2024-06-12', 1),
    (4, 9, '2024-06-15', 1),
    (4, 10, '2024-06-16', 1),
    (5, 1, '2024-06-20', 0),
    (5, 3, '2024-06-21', 0),
    (6, 2, '2024-06-25', 0),
    (6, 4, '2024-06-26', 0),
    (7, 5, '2024-06-30', 0),
    (8, 6, '2024-07-01', 0);
-- =============================================
-- DATOS PARA DESCARGAS DE RECURSOS
-- =============================================
INSERT INTO DescargasRecurso (
        id_recurso,
        id_usuario,
        fecha_descarga,
        ip_descarga
    )
VALUES (1, 1, '2024-06-01 10:30:00', '192.168.1.100'),
    (1, 2, '2024-06-02 14:15:00', '192.168.1.101'),
    (2, 3, '2024-06-05 09:45:00', '192.168.1.102'),
    (3, 4, '2024-06-10 16:20:00', '192.168.1.103'),
    (4, 5, '2024-06-15 11:30:00', '192.168.1.104'),
    (5, 6, '2024-06-20 13:45:00', '192.168.1.105'),
    (6, 7, '2024-06-25 08:15:00', '192.168.1.106'),
    (7, 8, '2024-06-30 17:00:00', '192.168.1.107'),
    (8, 9, '2024-07-01 12:30:00', '192.168.1.108'),
    (1, 10, '2024-07-02 15:45:00', '192.168.1.109');
-- =============================================
-- VERIFICACIÓN DE DATOS
-- =============================================
SELECT 'Usuarios' as Tabla,
    COUNT(*) as Registros
FROM Usuarios
UNION ALL
SELECT 'Especies',
    COUNT(*)
FROM Especies
UNION ALL
SELECT 'Eventos',
    COUNT(*)
FROM Eventos
UNION ALL
SELECT 'Productos',
    COUNT(*)
FROM Productos
UNION ALL
SELECT 'Recursos Biblioteca',
    COUNT(*)
FROM RecursosBiblioteca
UNION ALL
SELECT 'Avistamientos',
    COUNT(*)
FROM Avistamientos
UNION ALL
SELECT 'Donadores',
    COUNT(*)
FROM Donadores
UNION ALL
SELECT 'Testimonios',
    COUNT(*)
FROM Testimonios
UNION ALL
SELECT 'Contactos',
    COUNT(*)
FROM Contactos
UNION ALL
SELECT 'Pedidos',
    COUNT(*)
FROM Pedidos;