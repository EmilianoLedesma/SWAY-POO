-- =============================================
-- SCRIPT DE INSERCIÓN DE ESPECIES MARINAS
-- Base de datos SWAY - Especies de ejemplo
-- =============================================
USE sway;

-- =============================================
-- VERIFICAR Y COMPLETAR ESTADOS DE CONSERVACIÓN
-- =============================================
-- Los estados de conservación ya están completos en el archivo inicial
-- Verificamos que existan todos los estados necesarios

-- =============================================
-- AGREGAR MÁS HÁBITATS MARINOS
-- =============================================
INSERT INTO Habitats (nombre, descripcion)
VALUES 
    ('Zona Abisal', 'Zonas oceánicas profundas de 4000-6000 metros de profundidad'),
    ('Zona Hadal', 'Las zonas más profundas del océano, fosas oceánicas de más de 6000 metros'),
    ('Plataforma Continental', 'Zona marina cercana a la costa con profundidades menores a 200 metros'),
    ('Zona Mesopelágica', 'Zona crepuscular del océano entre 200-1000 metros de profundidad'),
    ('Zona Epipelágica', 'Zona superior del océano donde penetra la luz solar, 0-200 metros'),
    ('Surgencias Marinas', 'Zonas donde aguas profundas ricas en nutrientes emergen a la superficie'),
    ('Montañas Submarinas', 'Elevaciones del fondo marino que no alcanzan la superficie'),
    ('Cañones Submarinos', 'Valles profundos tallados en la plataforma continental');

-- =============================================
-- AGREGAR MÁS AMENAZAS ESPECÍFICAS
-- =============================================
INSERT INTO Amenazas (nombre, descripcion)
VALUES 
    ('Microplásticos', 'Pequeñas partículas de plástico que contaminan la cadena alimentaria'),
    ('Dragado de Fondo', 'Pesca con redes que arrastran el fondo marino destruyendo hábitats'),
    ('Minería Submarina', 'Extracción de minerales del fondo oceánico'),
    ('Blanqueamiento de Corales', 'Pérdida de algas simbióticas en corales por estrés térmico'),
    ('Eutrofización', 'Exceso de nutrientes que causa proliferación de algas nocivas'),
    ('Derrame de Petróleo', 'Contaminación por hidrocarburos en el medio marino'),
    ('Construcción Costera', 'Desarrollo urbano e industrial en zonas costeras'),
    ('Pesca Fantasma', 'Redes y equipos de pesca abandonados que siguen capturando animales');

-- =============================================
-- AGREGAR MÁS CARACTERÍSTICAS FÍSICAS
-- =============================================
INSERT INTO Caracteristicas (tipo_caracteristica, valor)
VALUES 
    ('Longitud', '15 metros'),       -- Para orcas
    ('Longitud', '6 metros'),        -- Para tiburones grandes
    ('Longitud', '4 metros'),        -- Para rayas grandes
    ('Longitud', '0.5 metros'),      -- Para peces pequeños
    ('Longitud', '0.3 metros'),      -- Para corales
    ('Longitud', '12 metros'),       -- Para cachalotes
    ('Peso', '6 toneladas'),         -- Para orcas
    ('Peso', '1.5 toneladas'),       -- Para tiburones grandes
    ('Peso', '500 kg'),              -- Para rayas grandes
    ('Peso', '2 kg'),                -- Para peces medianos
    ('Peso', '60 toneladas'),        -- Para cachalotes
    ('Profundidad', '50-300 metros'), -- Zona mesopelágica superior
    ('Profundidad', '300-800 metros'), -- Zona mesopelágica inferior
    ('Profundidad', '800-2000 metros'), -- Zona batial
    ('Profundidad', '2000-4000 metros'), -- Zona abisal
    ('Temperatura', '5-15°C'),       -- Aguas frías
    ('Temperatura', '25-35°C'),      -- Aguas tropicales
    ('Velocidad', '65 km/h'),        -- Depredadores rápidos
    ('Velocidad', '5 km/h'),         -- Especies lentas
    ('Velocidad', '80 km/h');        -- Velocidad máxima de algunos peces

-- =============================================
-- INSERTAR ESPECIES MARINAS DIVERSAS
-- =============================================
INSERT INTO Especies (
    nombre_comun,
    nombre_cientifico,
    descripcion,
    esperanza_vida,
    poblacion_estimada,
    id_estado_conservacion,
    imagen_url
)
VALUES 
    -- MAMÍFEROS MARINOS
    (
        'Orca',
        'Orcinus orca',
        'El depredador apex de los océanos, conocido por su inteligencia superior y estructura social compleja. Vive en grupos familiares matriarcales.',
        90,
        50000,
        7, -- Preocupación Menor
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
    ),
    (
        'Cachalote',
        'Physeter macrocephalus',
        'El mamífero con el cerebro más grande del planeta. Especialista en buceo profundo para cazar calamares gigantes.',
        70,
        200000,
        5, -- Vulnerable
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
    ),
    (
        'Foca Monje del Mediterráneo',
        'Monachus monachus',
        'Una de las focas más raras del mundo, endémica del Mediterráneo. Símbolo de la conservación marina europea.',
        45,
        700,
        3, -- En Peligro Crítico
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
    ),
    (
        'Narval',
        'Monodon monoceros',
        'El "unicornio del mar", famoso por su colmillo espiral. Habita exclusivamente en aguas árticas.',
        50,
        75000,
        6, -- Casi Amenazada
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
    ),

    -- TIBURONES Y RAYAS
    (
        'Tiburón Blanco',
        'Carcharodon carcharias',
        'El gran depredador de los océanos, crucial para el equilibrio de los ecosistemas marinos.',
        70,
        3500,
        5, -- Vulnerable
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
    ),
    (
        'Tiburón Martillo',
        'Sphyrna mokarran',
        'Tiburón distintivo por su cabeza en forma de martillo, que le proporciona ventajas sensoriales únicas.',
        30,
        5000,
        3, -- En Peligro Crítico
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
    ),
    (
        'Mantarraya Gigante',
        'Mobula birostris',
        'La raya más grande del mundo, filtrador de plancton con increíble inteligencia y memoria.',
        40,
        5000,
        5, -- Vulnerable
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
    ),
    (
        'Tiburón Peregrino',
        'Cetorhinus maximus',
        'El segundo pez más grande del mundo, filtrador de plancton completamente inofensivo para humanos.',
        50,
        8000,
        4, -- En Peligro
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
    ),

    -- PECES ÓSEOS
    (
        'Atún Rojo del Atlántico',
        'Thunnus thynnus',
        'El pez más valioso comercialmente, capaz de generar calor corporal y nadar a velocidades increíbles.',
        40,
        60000,
        4, -- En Peligro
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
    ),
    (
        'Pez Luna',
        'Mola mola',
        'El pez óseo más pesado del mundo, con una forma distintiva y comportamiento único de termorregulación.',
        10,
        40000000,
        5, -- Vulnerable
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
    ),
    (
        'Pez Napoleón',
        'Cheilinus undulatus',
        'Pez gigante de arrecife, importante para la salud de los ecosistemas coralinos.',
        30,
        320000,
        4, -- En Peligro
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
    ),
    (
        'Seahorse Pigmeo',
        'Hippocampus bargibanti',
        'Diminuto caballito de mar que vive exclusivamente en corales gorgonia, maestro del camuflaje.',
        5,
        25000,
        5, -- Vulnerable
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
    ),

    -- CORALES E INVERTEBRADOS
    (
        'Coral Cerebro',
        'Diploria labyrinthiformis',
        'Coral duro formador de arrecifes con patrones cerebrales distintivos, fundamental para la biodiversidad.',
        150,
        100000,
        5, -- Vulnerable
        'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800'
    ),
    (
        'Esponja Barril Gigante',
        'Xestospongia muta',
        'Una de las esponjas más grandes del Caribe, puede vivir cientos de años filtrando agua marina.',
        200,
        50000,
        7, -- Preocupación Menor
        'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800'
    ),
    (
        'Medusa Melena de León',
        'Cyanea capillata',
        'Una de las medusas más grandes del mundo, con tentáculos que pueden extenderse más de 30 metros.',
        1,
        5000000,
        7, -- Preocupación Menor
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
    ),

    -- REPTILES MARINOS
    (
        'Iguana Marina',
        'Amblyrhynchus cristatus',
        'El único lagarto marino del mundo, endémico de las Islas Galápagos, capaz de bucear y alimentarse de algas.',
        60,
        200000,
        5, -- Vulnerable
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'
    ),
    (
        'Serpiente Marina de Bandas',
        'Laticauda colubrina',
        'Serpiente venenosa marina que alterna entre vida acuática y terrestre, encontrada en el Pacífico.',
        15,
        500000,
        7, -- Preocupación Menor
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
    );

-- =============================================
-- RELACIONES ESPECIES-HÁBITATS
-- =============================================
INSERT INTO EspeciesHabitats (id_especie, id_habitat)
VALUES 
    -- Orca (id: 9)
    (9, 2), (9, 3), (9, 8), (9, 11), -- Aguas abiertas, costeras, polares, plataforma continental
    
    -- Cachalote (id: 10)
    (10, 2), (10, 4), (10, 9), (10, 10), -- Aguas abiertas, profundas, zona abisal, zona hadal
    
    -- Foca Monje (id: 11)
    (11, 3), (11, 1), (11, 11), -- Zona costera, arrecifes, plataforma continental
    
    -- Narval (id: 12)
    (12, 8), (12, 2), -- Aguas polares, aguas abiertas
    
    -- Tiburón Blanco (id: 13)
    (13, 3), (13, 2), (13, 11), (13, 13), -- Costera, abierta, plataforma continental, epipelágica
    
    -- Tiburón Martillo (id: 14)
    (14, 3), (14, 1), (14, 13), -- Costera, arrecifes, epipelágica
    
    -- Mantarraya Gigante (id: 15)
    (15, 2), (15, 13), (15, 14), -- Aguas abiertas, epipelágica, surgencias
    
    -- Tiburón Peregrino (id: 16)
    (16, 2), (16, 8), (16, 13), -- Aguas abiertas, polares, epipelágica
    
    -- Atún Rojo (id: 17)
    (17, 2), (17, 13), (17, 14), -- Aguas abiertas, epipelágica, surgencias
    
    -- Pez Luna (id: 18)
    (18, 2), (18, 13), (18, 12), -- Aguas abiertas, epipelágica, mesopelágica
    
    -- Pez Napoleón (id: 19)
    (19, 1), (19, 3), -- Arrecifes, costera
    
    -- Seahorse Pigmeo (id: 20)
    (20, 1), -- Arrecifes
    
    -- Coral Cerebro (id: 21)
    (21, 1), (21, 3), -- Arrecifes, costera
    
    -- Esponja Barril (id: 22)
    (22, 1), (22, 3), -- Arrecifes, costera
    
    -- Medusa Melena de León (id: 23)
    (23, 2), (23, 8), (23, 13), -- Aguas abiertas, polares, epipelágica
    
    -- Iguana Marina (id: 24)
    (24, 3), (24, 1), -- Costera, arrecifes
    
    -- Serpiente Marina (id: 25)
    (25, 3), (25, 1), (25, 13); -- Costera, arrecifes, epipelágica

-- =============================================
-- RELACIONES ESPECIES-AMENAZAS
-- =============================================
INSERT INTO EspeciesAmenazas (id_especie, id_amenaza)
VALUES 
    -- Orca (id: 9)
    (9, 1), (9, 6), (9, 7), (9, 11), (9, 16), -- Plásticos, químicos, ruido, microplásticos, derrame petróleo
    
    -- Cachalote (id: 10)
    (10, 1), (10, 7), (10, 11), (10, 3), (10, 16), -- Plásticos, ruido, microplásticos, sobrepesca, derrame petróleo
    
    -- Foca Monje (id: 11)
    (11, 5), (11, 9), (11, 1), (11, 17), (11, 6), -- Pérdida hábitat, turismo, plásticos, construcción costera, químicos
    
    -- Narval (id: 12)
    (12, 2), (12, 7), (12, 16), (12, 3), -- Cambio climático, ruido, derrame petróleo, sobrepesca
    
    -- Tiburón Blanco (id: 13)
    (13, 3), (13, 10), (13, 7), (13, 1), (13, 18), -- Sobrepesca, pesca incidental, ruido, plásticos, pesca fantasma
    
    -- Tiburón Martillo (id: 14)
    (14, 3), (14, 10), (14, 18), (14, 12), -- Sobrepesca, pesca incidental, pesca fantasma, dragado
    
    -- Mantarraya Gigante (id: 15)
    (15, 3), (15, 10), (15, 1), (15, 11), (15, 9), -- Sobrepesca, pesca incidental, plásticos, microplásticos, turismo
    
    -- Tiburón Peregrino (id: 16)
    (16, 3), (16, 10), (16, 1), (16, 16), -- Sobrepesca, pesca incidental, plásticos, derrame petróleo
    
    -- Atún Rojo (id: 17)
    (17, 3), (17, 10), (17, 18), (17, 11), -- Sobrepesca, pesca incidental, pesca fantasma, microplásticos
    
    -- Pez Luna (id: 18)
    (18, 1), (18, 10), (18, 11), (18, 6), -- Plásticos, pesca incidental, microplásticos, químicos
    
    -- Pez Napoleón (id: 19)
    (19, 3), (19, 9), (19, 5), (19, 14), -- Sobrepesca, turismo, pérdida hábitat, blanqueamiento
    
    -- Seahorse Pigmeo (id: 20)
    (20, 2), (20, 4), (20, 14), (20, 9), -- Cambio climático, acidificación, blanqueamiento, turismo
    
    -- Coral Cerebro (id: 21)
    (21, 2), (21, 4), (21, 14), (21, 6), (21, 15), -- Cambio climático, acidificación, blanqueamiento, químicos, eutrofización
    
    -- Esponja Barril (id: 22)
    (22, 6), (22, 9), (22, 15), (22, 17), -- Químicos, turismo, eutrofización, construcción costera
    
    -- Medusa Melena de León (id: 23)
    (23, 2), (23, 1), (23, 6), -- Cambio climático, plásticos, químicos
    
    -- Iguana Marina (id: 24)
    (24, 2), (24, 5), (24, 17), (24, 8), -- Cambio climático, pérdida hábitat, construcción costera, especies invasoras
    
    -- Serpiente Marina (id: 25)
    (25, 2), (25, 5), (25, 6), (25, 17); -- Cambio climático, pérdida hábitat, químicos, construcción costera

-- =============================================
-- RELACIONES ESPECIES-CARACTERÍSTICAS
-- =============================================
INSERT INTO EspeciesCaracteristicas (id_especie, id_caracteristica)
VALUES 
    -- Orca (id: 9)
    (9, 21), (9, 29), (9, 15), (9, 37), -- 15m longitud, 6 toneladas peso, 0-10°C temperatura, 65 km/h velocidad
    
    -- Cachalote (id: 10)
    (10, 26), (10, 33), (10, 16), (10, 14), -- 12m longitud, 60 toneladas peso, 15-25°C, zona batial-abisal
    
    -- Foca Monje (id: 11)
    (11, 3), (11, 7), (11, 9), (11, 13), -- 2.5m longitud, 300kg peso, 0-50m profundidad, 20-30°C
    
    -- Narval (id: 12)
    (12, 22), (12, 28), (12, 15), (12, 18), -- 6m longitud, 1.5 toneladas peso, 0-10°C, 10 km/h
    
    -- Tiburón Blanco (id: 13)
    (13, 22), (13, 28), (13, 10), (13, 16), -- 6m longitud, 1.5 toneladas peso, 0-200m profundidad, 50 km/h
    
    -- Tiburón Martillo (id: 14)
    (14, 23), (14, 30), (14, 31), (14, 35), -- 4m longitud, 500kg peso, 50-300m profundidad, 25-35°C
    
    -- Mantarraya Gigante (id: 15)
    (15, 23), (15, 30), (15, 31), (15, 39), -- 4m longitud, 500kg peso, 50-300m profundidad, 5 km/h
    
    -- Tiburón Peregrino (id: 16)
    (16, 21), (16, 28), (16, 14), (16, 18), -- 15m longitud, 1.5 toneladas peso, 15-25°C, 10 km/h
    
    -- Atún Rojo (id: 17)
    (17, 3), (17, 8), (17, 13), (17, 40), -- 2.5m longitud, 50kg peso, 20-30°C, 80 km/h
    
    -- Pez Luna (id: 18)
    (18, 3), (18, 30), (18, 10), (18, 39), -- 2.5m longitud, 500kg peso, 0-200m profundidad, 5 km/h
    
    -- Pez Napoleón (id: 19)
    (19, 3), (19, 8), (19, 9), (19, 13), -- 2.5m longitud, 50kg peso, 0-50m profundidad, 20-30°C
    
    -- Seahorse Pigmeo (id: 20)
    (20, 25), (20, 32), (20, 9), (20, 13), -- 0.3m longitud, 2kg peso, 0-50m profundidad, 20-30°C
    
    -- Coral Cerebro (id: 21)
    (21, 25), (21, 9), (21, 13), -- 0.3m longitud, 0-50m profundidad, 20-30°C
    
    -- Esponja Barril (id: 22)
    (22, 1), (22, 9), (22, 13), -- 1.5m longitud, 0-50m profundidad, 20-30°C
    
    -- Medusa Melena de León (id: 23)
    (23, 3), (23, 32), (23, 9), (23, 15), -- 2.5m longitud, 2kg peso, 0-50m profundidad, 0-10°C
    
    -- Iguana Marina (id: 24)
    (24, 4), (24, 32), (24, 9), (24, 13), -- 0.8m longitud, 2kg peso, 0-50m profundidad, 20-30°C
    
    -- Serpiente Marina (id: 25)
    (25, 4), (25, 32), (25, 9), (25, 35); -- 0.8m longitud, 2kg peso, 0-50m profundidad, 25-35°C

-- =============================================
-- AGREGAR AVISTAMIENTOS DE NUEVAS ESPECIES
-- =============================================
INSERT INTO Avistamientos (
    id_especie,
    fecha,
    latitud,
    longitud,
    notas,
    id_usuario
)
VALUES 
    (9, '2024-07-05 11:00:00', 48.8566, 2.3522, 'Manada de orcas avistada en migración con 8 individuos incluyendo crías', 1),
    (10, '2024-07-08 14:30:00', 36.7783, -119.4179, 'Cachalote macho solitario realizando inmersiones profundas', 2),
    (11, '2024-07-10 09:15:00', 35.3387, 25.1442, 'Foca monje descansando en cueva costera protegida', 3),
    (12, '2024-07-12 16:45:00', 82.5018, -82.0000, 'Grupo de narvales con colmillos espectaculares en aguas árticas', 4),
    (13, '2024-07-15 08:20:00', -34.6118, -58.3960, 'Tiburón blanco juvenil avistado cerca de colonia de lobos marinos', 5),
    (14, '2024-07-18 12:10:00', 1.3521, 103.8198, 'Escuela de tiburones martillo en formación de caza', 1),
    (15, '2024-07-20 15:35:00', -23.5505, -46.6333, 'Mantarraya gigante alimentándose en estación de limpieza', 2),
    (16, '2024-07-22 07:50:00', 55.3781, -3.4360, 'Tiburón peregrino alimentándose de plancton en superficie', 3),
    (17, '2024-07-25 10:25:00', 43.7696, 11.2558, 'Atún rojo de gran tamaño durante temporada de reproducción', 4),
    (18, '2024-07-28 13:40:00', 35.6762, 139.6503, 'Pez luna termorregulándose en superficie marina', 5),
    (21, '2024-07-30 11:30:00', 18.2208, -66.5901, 'Colonia de coral cerebro en proceso de recuperación natural', 1),
    (24, '2024-08-01 09:00:00', -0.7893, -90.3112, 'Iguana marina buceando para alimentarse de algas marinas', 2);

-- =============================================
-- VERIFICACIÓN DE INSERCIÓN
-- =============================================
SELECT 
    'RESUMEN DE ESPECIES INSERTADAS' as Informacion,
    '' as Detalle
UNION ALL
SELECT 
    'Total de Especies en Base de Datos:',
    CAST(COUNT(*) as VARCHAR) + ' especies'
FROM Especies
UNION ALL
SELECT 
    'Especies por Estado de Conservación:',
    ''
UNION ALL
SELECT 
    ec.nombre,
    CAST(COUNT(e.id) as VARCHAR) + ' especies'
FROM EstadosConservacion ec
LEFT JOIN Especies e ON ec.id = e.id_estado_conservacion
GROUP BY ec.nombre, ec.id
ORDER BY ec.id;

-- =============================================
-- CONSULTA DETALLADA DE NUEVAS ESPECIES
-- =============================================
SELECT 
    e.id,
    e.nombre_comun,
    e.nombre_cientifico,
    ec.nombre as estado_conservacion,
    e.esperanza_vida,
    e.poblacion_estimada,
    STRING_AGG(h.nombre, ', ') as habitats
FROM Especies e
LEFT JOIN EstadosConservacion ec ON e.id_estado_conservacion = ec.id
LEFT JOIN EspeciesHabitats eh ON e.id = eh.id_especie
LEFT JOIN Habitats h ON eh.id_habitat = h.id
WHERE e.id > 8  -- Solo especies nuevas (después de las 8 originales)
GROUP BY e.id, e.nombre_comun, e.nombre_cientifico, ec.nombre, e.esperanza_vida, e.poblacion_estimada
ORDER BY e.id;

PRINT '✅ Script ejecutado exitosamente';
PRINT '📊 Se han insertado 17 nuevas especies marinas';
PRINT '🌊 Se han agregado 8 nuevos hábitats marinos';
PRINT '⚠️ Se han agregado 8 nuevas amenazas específicas';
PRINT '📏 Se han agregado 20 nuevas características físicas';
PRINT '👁️ Se han registrado 12 nuevos avistamientos';