-- =============================================
-- BASE DE DATOS SWAY - POSTGRES (DDL + DML)
-- Sistema de Conservación Marina y Vida Acuática
-- Versión: PostgreSQL — Convertida desde SQL Server 2022
-- =============================================
-- Conectar a la base de datos antes de ejecutar:
--   psql -U postgres -d sway
-- O crear la BD primero:
--   CREATE DATABASE sway;
--   \c sway
-- =============================================

-- =============================================
-- TABLAS DE DIRECCIONES
-- =============================================

CREATE TABLE Estados (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(254) NOT NULL
);

CREATE TABLE Municipios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(254) NOT NULL,
    id_estado INT NOT NULL,
    FOREIGN KEY (id_estado) REFERENCES Estados(id)
);

CREATE TABLE Colonias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(254) NOT NULL,
    id_municipio INT NOT NULL,
    cp INT,
    FOREIGN KEY (id_municipio) REFERENCES Municipios(id)
);

CREATE TABLE Calles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(254) NOT NULL,
    id_colonia INT NOT NULL,
    n_interior INT,
    n_exterior INT,
    FOREIGN KEY (id_colonia) REFERENCES Colonias(id)
);

CREATE TABLE Direcciones (
    id SERIAL PRIMARY KEY,
    id_calle INT NOT NULL,
    FOREIGN KEY (id_calle) REFERENCES Calles(id)
);

-- =============================================
-- TABLAS DE CATÁLOGOS
-- =============================================

CREATE TABLE Especialidades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(254) NOT NULL
);

CREATE TABLE Instituciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(254) NOT NULL
);

CREATE TABLE Organizaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(254) NOT NULL
);

CREATE TABLE TipoDonaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(254) NOT NULL
);

CREATE TABLE TiposTarjeta (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(254) NOT NULL
);

CREATE TABLE Estatus (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(254) NOT NULL
);

CREATE TABLE Cargos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(254) NOT NULL
);

CREATE TABLE Modalidades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE Materiales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE Idiomas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

-- =============================================
-- TABLA PRINCIPAL DE USUARIOS
-- =============================================

CREATE TABLE Usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50),
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    telefono VARCHAR(20),
    fecha_nacimiento DATE,
    suscrito_newsletter BOOLEAN DEFAULT false,
    fecha_registro TIMESTAMP DEFAULT NOW(),
    activo BOOLEAN DEFAULT true
);

-- =============================================
-- TABLA DE ADMINISTRADORES
-- =============================================

CREATE TABLE Administradores (
    id SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);

-- =============================================
-- TABLAS DE ROLES DE USUARIO
-- =============================================

CREATE TABLE Autores (
    id SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    biografia TEXT,
    id_especialidad INT,
    id_institucion INT,
    fecha_alta TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id),
    FOREIGN KEY (id_especialidad) REFERENCES Especialidades(id),
    FOREIGN KEY (id_institucion) REFERENCES Instituciones(id)
);

CREATE TABLE Organizadores (
    id SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_organizacion INT,
    id_cargo INT,
    experiencia_eventos INT DEFAULT 0,
    certificado BOOLEAN DEFAULT false,
    fecha_alta TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (id_organizacion) REFERENCES Organizaciones(id),
    FOREIGN KEY (id_cargo) REFERENCES Cargos(id),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);

CREATE TABLE Colaboradores (
    id SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    grado_academico VARCHAR(50) NOT NULL,
    institucion VARCHAR(200) NOT NULL,
    años_experiencia VARCHAR(20) NOT NULL,
    numero_cedula VARCHAR(20),
    orcid VARCHAR(50),
    motivacion TEXT NOT NULL,
    estado_solicitud VARCHAR(50) DEFAULT 'pendiente',
    fecha_solicitud TIMESTAMP DEFAULT NOW(),
    fecha_aprobacion TIMESTAMP,
    aprobado_por INT,
    comentarios_admin TEXT,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_modificacion TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id),
    FOREIGN KEY (aprobado_por) REFERENCES Usuarios(id)
);

-- =============================================
-- TABLAS DE COMUNICACIÓN
-- =============================================

CREATE TABLE Contactos (
    id SERIAL PRIMARY KEY,
    id_usuario INT,
    asunto VARCHAR(50) NOT NULL,
    mensaje TEXT,
    fecha_contacto TIMESTAMP DEFAULT NOW(),
    respondido BOOLEAN DEFAULT false,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);

CREATE TABLE Testimonios (
    id SERIAL PRIMARY KEY,
    id_usuario INT,
    testimonio TEXT,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    aprobado BOOLEAN DEFAULT false,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);

-- =============================================
-- SISTEMA DE DONACIONES
-- =============================================

CREATE TABLE Donadores (
    id SERIAL PRIMARY KEY,
    id_usuario INT,
    monto DECIMAL(10, 2) NOT NULL,
    fecha_donacion TIMESTAMP DEFAULT NOW(),
    id_tipoDonacion INT DEFAULT 1,
    FOREIGN KEY (id_tipoDonacion) REFERENCES TipoDonaciones(id),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);

CREATE TABLE Donaciones (
    id SERIAL PRIMARY KEY,
    id_donador INT,
    numero_tarjeta_encriptado VARCHAR(256),
    fecha_expiracion_encriptada VARCHAR(256),
    cvv_encriptado VARCHAR(256),
    id_tipoTarjeta INT,
    FOREIGN KEY (id_tipoTarjeta) REFERENCES TiposTarjeta(id) ON DELETE CASCADE,
    FOREIGN KEY (id_donador) REFERENCES Donadores(id) ON DELETE CASCADE
);

-- =============================================
-- CATÁLOGO DE ESPECIES MARINAS
-- =============================================

CREATE TABLE EstadosConservacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

CREATE TABLE Caracteristicas (
    id SERIAL PRIMARY KEY,
    tipo_caracteristica VARCHAR(50) NOT NULL,
    valor VARCHAR(100) NOT NULL
);

CREATE TABLE Amenazas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE Habitats (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);

CREATE TABLE Especies (
    id SERIAL PRIMARY KEY,
    nombre_comun VARCHAR(100) NOT NULL,
    nombre_cientifico VARCHAR(100) NOT NULL,
    descripcion TEXT,
    esperanza_vida INT,
    poblacion_estimada INT,
    id_estado_conservacion INT,
    imagen_url VARCHAR(255),
    FOREIGN KEY (id_estado_conservacion) REFERENCES EstadosConservacion(id)
);

CREATE TABLE EspeciesAmenazas (
    id_especie INT,
    id_amenaza INT,
    PRIMARY KEY (id_especie, id_amenaza),
    FOREIGN KEY (id_especie) REFERENCES Especies(id),
    FOREIGN KEY (id_amenaza) REFERENCES Amenazas(id)
);

CREATE TABLE EspeciesHabitats (
    id_especie INT,
    id_habitat INT,
    PRIMARY KEY (id_especie, id_habitat),
    FOREIGN KEY (id_especie) REFERENCES Especies(id),
    FOREIGN KEY (id_habitat) REFERENCES Habitats(id)
);

CREATE TABLE Avistamientos (
    id SERIAL PRIMARY KEY,
    id_especie INT,
    fecha TIMESTAMP NOT NULL,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    notas TEXT,
    id_usuario INT,
    FOREIGN KEY (id_especie) REFERENCES Especies(id),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);

CREATE TABLE EspeciesCaracteristicas (
    id_especie INT,
    id_caracteristica INT,
    PRIMARY KEY (id_especie, id_caracteristica),
    FOREIGN KEY (id_especie) REFERENCES Especies(id),
    FOREIGN KEY (id_caracteristica) REFERENCES Caracteristicas(id)
);

-- =============================================
-- SISTEMA DE EVENTOS
-- =============================================

CREATE TABLE TiposEvento (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

CREATE TABLE Eventos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_evento DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME,
    id_tipo_evento INT,
    id_modalidad INT,
    id_direccion INT,
    url_evento VARCHAR(255),
    capacidad_maxima INT,
    costo DECIMAL(10, 2) DEFAULT 0,
    id_organizador INT,
    id_estatus INT,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (id_direccion) REFERENCES Direcciones(id),
    FOREIGN KEY (id_modalidad) REFERENCES Modalidades(id),
    FOREIGN KEY (id_estatus) REFERENCES Estatus(id),
    FOREIGN KEY (id_tipo_evento) REFERENCES TiposEvento(id),
    FOREIGN KEY (id_organizador) REFERENCES Organizadores(id)
);

CREATE TABLE RegistrosEvento (
    id SERIAL PRIMARY KEY,
    id_evento INT,
    id_usuario INT,
    fecha_registro TIMESTAMP DEFAULT NOW(),
    asistio BOOLEAN DEFAULT false,
    FOREIGN KEY (id_evento) REFERENCES Eventos(id),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id),
    UNIQUE(id_evento, id_usuario)
);

-- =============================================
-- BIBLIOTECA DE RECURSOS
-- =============================================

CREATE TABLE TiposRecurso (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

CREATE TABLE RecursosBiblioteca (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    id_tipo_recurso INT,
    archivo_url VARCHAR(255),
    tamaño_mb DECIMAL(10, 2),
    formato VARCHAR(20),
    id_autor INT,
    fecha_publicacion DATE,
    numero_paginas INT,
    duracion_minutos INT,
    id_idioma INT NOT NULL DEFAULT 1,
    licencia VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    fecha_agregado TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (id_tipo_recurso) REFERENCES TiposRecurso(id),
    FOREIGN KEY (id_autor) REFERENCES Autores(id),
    FOREIGN KEY (id_idioma) REFERENCES Idiomas(id)
);

CREATE TABLE DescargasRecurso (
    id SERIAL PRIMARY KEY,
    id_recurso INT,
    id_usuario INT,
    fecha_descarga TIMESTAMP DEFAULT NOW(),
    ip_descarga VARCHAR(45),
    FOREIGN KEY (id_recurso) REFERENCES RecursosBiblioteca(id),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);

CREATE TABLE TagsRecurso (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE RecursosTags (
    id_recurso INT,
    id_tag INT,
    PRIMARY KEY (id_recurso, id_tag),
    FOREIGN KEY (id_recurso) REFERENCES RecursosBiblioteca(id),
    FOREIGN KEY (id_tag) REFERENCES TagsRecurso(id)
);

-- =============================================
-- SISTEMA DE TIENDA
-- =============================================

CREATE TABLE CategoriasProducto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);

CREATE TABLE Productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    id_categoria INT,
    stock INT DEFAULT 0,
    imagen_url VARCHAR(255),
    id_material INT,
    dimensiones VARCHAR(100),
    peso_gramos INT,
    es_sostenible BOOLEAN DEFAULT true,
    activo BOOLEAN DEFAULT true,
    fecha_agregado TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (id_material) REFERENCES Materiales(id),
    FOREIGN KEY (id_categoria) REFERENCES CategoriasProducto(id)
);

CREATE TABLE Pedidos (
    id SERIAL PRIMARY KEY,
    id_usuario INT,
    fecha_pedido TIMESTAMP DEFAULT NOW(),
    total DECIMAL(10, 2) NOT NULL,
    id_estatus INT,
    id_direccion INT,
    telefono_contacto VARCHAR(20),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id),
    FOREIGN KEY (id_estatus) REFERENCES Estatus(id),
    FOREIGN KEY (id_direccion) REFERENCES Direcciones(id)
);

CREATE TABLE DetallesPedido (
    id SERIAL PRIMARY KEY,
    id_pedido INT,
    id_producto INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES Pedidos(id),
    FOREIGN KEY (id_producto) REFERENCES Productos(id)
);

CREATE TABLE PagosPedidos (
    id SERIAL PRIMARY KEY,
    id_pedido INT,
    numero_tarjeta VARCHAR(16),
    fecha_expiracion VARCHAR(5),
    cvv VARCHAR(4),
    nombre_tarjeta VARCHAR(100),
    id_tipoTarjeta INT,
    monto DECIMAL(10, 2) NOT NULL,
    fecha_pago TIMESTAMP DEFAULT NOW(),
    id_estatus INT,
    FOREIGN KEY (id_pedido) REFERENCES Pedidos(id),
    FOREIGN KEY (id_tipoTarjeta) REFERENCES TiposTarjeta(id),
    FOREIGN KEY (id_estatus) REFERENCES Estatus(id)
);

-- Nombre del campo con carácter especial — en PostgreSQL se permite,
-- pero para máxima compatibilidad se puede renombrar a ResenasProducto
CREATE TABLE "ReseñasProducto" (
    id SERIAL PRIMARY KEY,
    id_producto INT,
    id_usuario INT,
    calificacion INT CHECK (calificacion BETWEEN 1 AND 5),
    comentario TEXT,
    "fecha_reseña" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (id_producto) REFERENCES Productos(id),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id),
    UNIQUE(id_producto, id_usuario)
);

-- =============================================
-- ESPECIALIDADES PARA COLABORADORES
-- =============================================

CREATE TABLE EspecialidadesColaboradores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE GradosAcademicos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    nivel INT NOT NULL,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE InstitucionesColaboradores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    pais VARCHAR(100),
    tipo VARCHAR(50),
    activo BOOLEAN DEFAULT true
);

-- =============================================
-- VISTA CONSOLIDADA PARA GESTIÓN DE COLABORADORES
-- Adaptada para PostgreSQL: || en lugar de +, COALESCE en lugar de ISNULL
-- =============================================

CREATE VIEW Vista_Colaboradores AS
SELECT
    c.id,
    u.nombre || ' ' || u.apellido_paterno || COALESCE(' ' || u.apellido_materno, '') AS nombre_colaborador,
    u.email,
    c.especialidad,
    c.grado_academico,
    c.institucion,
    c.años_experiencia,
    c.numero_cedula,
    c.orcid,
    c.estado_solicitud,
    c.fecha_solicitud,
    c.fecha_aprobacion,
    c.activo,
    CASE
        WHEN c.estado_solicitud = 'aprobada' AND c.activo = true THEN 'Colaborador Activo'
        WHEN c.estado_solicitud = 'pendiente'                    THEN 'Solicitud Pendiente'
        WHEN c.estado_solicitud = 'rechazada'                    THEN 'Solicitud Rechazada'
        WHEN c.activo = false                                    THEN 'Colaborador Inactivo'
        ELSE 'Estado Desconocido'
    END AS estado_descripcion
FROM Colaboradores c
    INNER JOIN Usuarios u ON c.id_usuario = u.id;


-- =============================================
-- =============================================
-- DML — DATOS INICIALES
-- =============================================
-- =============================================

-- =============================================
-- POBLACIÓN INICIAL DE DIRECCIONES MEXICANAS
-- =============================================

INSERT INTO Estados (nombre) VALUES
    ('Querétaro'),
    ('Ciudad de México'),
    ('Veracruz'),
    ('Quintana Roo'),
    ('Baja California'),
    ('Yucatán'),
    ('Jalisco'),
    ('Nuevo León');

INSERT INTO Municipios (nombre, id_estado) VALUES
    ('Santiago de Querétaro', 1),
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

INSERT INTO Colonias (nombre, id_municipio, cp) VALUES
    ('Centro Histórico', 1, 76000),
    ('Juriquilla', 1, 76230),
    ('Zakia', 1, 76269),
    ('El Pueblito', 2, 76900),
    ('Canadas del Lago', 2, 76904),
    ('Zibatá', 3, 76246),
    ('La Pradera', 3, 76220),
    ('Polanco', 4, 11560),
    ('Roma Norte', 5, 6700),
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

INSERT INTO Calles (nombre, id_colonia, n_interior, n_exterior) VALUES
    ('Av. Universidad', 1, NULL, 123),
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

INSERT INTO Direcciones (id_calle) VALUES
    (1), (2), (3), (4), (5), (6), (7), (8), (9), (10),
    (11), (12), (13), (14), (15), (16), (17), (18), (19), (20), (21);

-- =============================================
-- CATÁLOGOS MAESTROS
-- =============================================

INSERT INTO Especialidades (nombre) VALUES
    ('Biología Marina'),
    ('Oceanografía'),
    ('Ecología'),
    ('Conservación Ambiental'),
    ('Veterinaria Marina'),
    ('Educación Ambiental'),
    ('Investigación Científica'),
    ('Comunicación Científica');

INSERT INTO Instituciones (nombre) VALUES
    ('Universidad Nacional Autónoma de México'),
    ('Centro de Investigación Científica y de Educación Superior de Ensenada'),
    ('Instituto Politécnico Nacional'),
    ('Universidad Autónoma de Baja California'),
    ('Universidad Veracruzana'),
    ('Centro de Investigación y Estudios Avanzados'),
    ('Universidad de Guadalajara'),
    ('Universidad Politécnica de Querétaro');

INSERT INTO Organizaciones (nombre) VALUES
    ('SWAY - Conservación Marina'),
    ('WWF México'),
    ('Greenpeace México'),
    ('Oceana México'),
    ('Pronatura'),
    ('Fundación Carlos Slim'),
    ('Grupo Ecológico Sierra Gorda'),
    ('Fundación Mexicana para la Conservación Marina');

INSERT INTO TipoDonaciones (nombre) VALUES
    ('Donación Única'),
    ('Donación Mensual'),
    ('Donación Anual'),
    ('Donación Corporativa'),
    ('Donación en Especie');

INSERT INTO TiposTarjeta (nombre) VALUES
    ('Visa'),
    ('Mastercard'),
    ('American Express'),
    ('Tarjeta de Débito'),
    ('PayPal');

INSERT INTO Estatus (nombre) VALUES
    ('Activo'),
    ('Inactivo'),
    ('Pendiente'),
    ('Completado'),
    ('Cancelado'),
    ('En Proceso'),
    ('Confirmado'),
    ('Rechazado'),
    ('Pagado'),
    ('Preparando'),
    ('Enviado'),
    ('Entregado'),
    ('Reembolsado');

INSERT INTO Cargos (nombre) VALUES
    ('Director'),
    ('Coordinador'),
    ('Investigador'),
    ('Educador'),
    ('Voluntario'),
    ('Asistente'),
    ('Especialista'),
    ('Consultor');

INSERT INTO Modalidades (nombre) VALUES
    ('Presencial'),
    ('Virtual'),
    ('Híbrida'),
    ('Webinar'),
    ('Taller Práctico');

INSERT INTO Materiales (nombre) VALUES
    ('Algodón Orgánico'),
    ('Bambú'),
    ('Plástico Reciclado'),
    ('Vidrio'),
    ('Metal Reciclado'),
    ('Papel Reciclado'),
    ('Madera Sustentable'),
    ('Fibra Natural');

INSERT INTO Idiomas (nombre) VALUES
    ('Español'),
    ('Inglés'),
    ('Francés'),
    ('Portugués'),
    ('Alemán');

-- =============================================
-- USUARIOS DEL SISTEMA
-- Nota: TRUE/FALSE en lugar de 1/0 para columnas boolean
-- =============================================

INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, telefono, fecha_nacimiento, suscrito_newsletter, fecha_registro, activo)
VALUES
    ('Ana', 'García', 'López', 'ana.garcia@email.com', NULL, '4421234567', '1985-03-15', true, '2024-01-15', true),
    ('Carlos', 'Rodríguez', 'Hernández', 'carlos.rodriguez@email.com', NULL, '4421234568', '1990-07-22', true, '2024-01-20', true),
    ('María', 'Fernández', 'Sánchez', 'maria.fernandez@email.com', NULL, '4421234569', '1988-11-08', false, '2024-02-01', true),
    ('Juan', 'Martínez', 'González', 'juan.martinez@email.com', NULL, '4421234570', '1992-04-03', true, '2024-02-15', true),
    ('Laura', 'Sánchez', 'Torres', 'laura.sanchez@email.com', NULL, '4421234571', '1987-09-17', true, '2024-03-01', true),
    ('Pedro', 'Ramírez', 'Morales', 'pedro.ramirez@email.com', NULL, '4421234572', '1991-12-25', false, '2024-03-10', true),
    ('Isabel', 'Torres', 'Jiménez', 'isabel.torres@email.com', NULL, '4421234573', '1989-06-14', true, '2024-03-20', true),
    ('Miguel', 'Herrera', 'Vargas', 'miguel.herrera@email.com', NULL, '4421234574', '1986-01-30', true, '2024-04-01', true),
    ('Carmen', 'Jiménez', 'Delgado', 'carmen.jimenez@email.com', NULL, '4421234575', '1993-08-19', false, '2024-04-15', true),
    ('Rafael', 'Morales', 'Castillo', 'rafael.morales@email.com', NULL, '4421234576', '1984-05-11', true, '2024-05-01', true),
    ('Diego', 'Jiménez', 'Vargas', 'diegojimenez@email.com', 'Diegos1!', '4411314030', '2004-10-10', false, '2025-07-06 18:24:32', true),
    ('Manuel', 'Ledesma', 'Márquez', 'manuel@gmail.com', 'Diegos1!', '4411156641', '1995-03-25', true, '2025-07-06 19:20:53', true),
    ('Admin', 'Sistema', NULL, 'admin@sway.com', 'pbkdf2:sha256:600000$hkgwd8507CSp9SnVSd2e3a16bbf...', '1234567890', '1980-01-01', true, '2024-01-01', true),
    ('Elian Jair', 'Leal', 'Pelcastre', 'elianpelcastre@gmail.com', 'Diegos1!', '4411543216', '2001-01-20', true, '2025-07-06 22:07:02', true),
    ('Artemio', 'Hurtado', 'Hernández', 'artemio@gmail.com', NULL, '4411234577', '1985-08-15', true, '2025-07-07 09:17:49', true),
    ('Cyborg', 'Del', 'Valle', 'cyborg@delvalle.mx', NULL, '4411234578', '1990-05-20', false, '2025-07-07 17:19:50', true),
    ('Cyborg', 'Hernández', NULL, 'cyborg@delvalle.com', '12345', '12345678', '2025-07-08', false, '2025-07-07 17:37:55', true),
    ('Jairo', 'González', 'Pérez', 'jairo@gmail.com', NULL, '4411234579', '1988-12-03', false, '2025-07-23 15:30:47', true),
    ('Terry', 'Newsletter', 'Usuario', 'terry@gmail.com', NULL, '4411234580', '1992-07-18', true, '2025-07-24 15:30:52', true),
    ('Usuario', 'Prueba', 'Test', 'test@example.com', NULL, '4411234581', '1990-01-01', false, '2025-07-25 10:26:31', true),
    ('Verónica', 'Ledesma', 'Márquez', 'vero@gmail.com', NULL, '4411234582', '1987-04-12', false, '2025-07-25 10:24:27', true),
    ('Emiliano', 'Ledesma', 'Márquez', 'emilianoledesma@gmail.com', NULL, '4411234583', '1995-11-28', false, '2025-07-25 10:44:15', true),
    ('Juan', 'Pérez', 'López', 'juan@gmail.com', NULL, '4411234584', '1989-02-14', false, '2025-07-25 10:29:54', true),
    ('Emiliano', 'Ledesma', 'Márquez', 'emilianoledesmaledesma@gmail.com', NULL, '4411234585', '1995-11-28', false, '2025-07-30 16:26:49', true);

-- =============================================
-- ROLES ADMINISTRATIVOS
-- =============================================

INSERT INTO Administradores (id_usuario) VALUES (13);

-- =============================================
-- ROLES ESPECIALIZADOS
-- =============================================

INSERT INTO Autores (id_usuario, biografia, id_especialidad, id_institucion) VALUES
    (1, 'Doctora en Biología Marina con 15 años de experiencia en conservación de tortugas marinas.', 1, 1),
    (2, 'Investigador oceanógrafo especializado en el estudio de corrientes marinas del Golfo de México.', 2, 2),
    (4, 'Biólogo marino con maestría en ecología, enfocado en la conservación de arrecifes de coral.', 3, 3),
    (6, 'Veterinario especializado en mamíferos marinos, con experiencia en rehabilitación de fauna marina.', 5, 4),
    (8, 'Educador ambiental con 10 años promoviendo la conservación marina en comunidades costeras.', 6, 7);

INSERT INTO Organizadores (id_usuario, id_organizacion, id_cargo, experiencia_eventos, certificado) VALUES
    (3, 1, 2, 25, true),
    (5, 2, 1, 40, true),
    (7, 3, 3, 15, true),
    (9, 4, 2, 30, true),
    (10, 5, 5, 8, false);

-- =============================================
-- CATÁLOGO DE ESPECIES MARINAS
-- =============================================

INSERT INTO EstadosConservacion (nombre, descripcion) VALUES
    ('Extinto', 'Especie que ya no existe en la naturaleza'),
    ('Extinto en Estado Silvestre', 'Especie que solo existe en cautiverio'),
    ('En Peligro Crítico', 'Especie que enfrenta un riesgo extremadamente alto de extinción'),
    ('En Peligro', 'Especie que enfrenta un riesgo muy alto de extinción'),
    ('Vulnerable', 'Especie que enfrenta un riesgo alto de extinción'),
    ('Casi Amenazada', 'Especie que podría estar amenazada en el futuro cercano'),
    ('Preocupación Menor', 'Especie con bajo riesgo de extinción'),
    ('Datos Insuficientes', 'No hay suficiente información para evaluar el riesgo');

INSERT INTO Habitats (nombre, descripcion) VALUES
    ('Arrecifes de Coral', 'Ecosistemas marinos diversos con alta biodiversidad'),
    ('Aguas Abiertas', 'Zonas pelágicas alejadas de la costa'),
    ('Zona Costera', 'Áreas cercanas a la costa con influencia terrestre'),
    ('Aguas Profundas', 'Zonas abisales con condiciones extremas'),
    ('Manglares', 'Ecosistemas costeros con vegetación adaptada a agua salada'),
    ('Estuarios', 'Zonas donde los ríos se encuentran con el mar'),
    ('Praderas Marinas', 'Ecosistemas submarinos con plantas vasculares'),
    ('Aguas Polares', 'Zonas frías con condiciones extremas de temperatura'),
    ('Zona Abisal', 'Zonas oceánicas profundas de 4000-6000 metros de profundidad'),
    ('Zona Hadal', 'Las zonas más profundas del océano, fosas oceánicas de más de 6000 metros'),
    ('Plataforma Continental', 'Zona marina cercana a la costa con profundidades menores a 200 metros'),
    ('Zona Mesopelágica', 'Zona crepuscular del océano entre 200-1000 metros de profundidad'),
    ('Zona Epipelágica', 'Zona superior del océano donde penetra la luz solar, 0-200 metros'),
    ('Surgencias Marinas', 'Zonas donde aguas profundas ricas en nutrientes emergen a la superficie'),
    ('Montañas Submarinas', 'Elevaciones del fondo marino que no alcanzan la superficie'),
    ('Cañones Submarinos', 'Valles profundos tallados en la plataforma continental');

INSERT INTO Amenazas (nombre, descripcion) VALUES
    ('Contaminación Plástica', 'Acumulación de desechos plásticos en el océano'),
    ('Cambio Climático', 'Alteración del clima por actividades humanas'),
    ('Sobrepesca', 'Extracción excesiva de recursos pesqueros'),
    ('Acidificación Oceánica', 'Reducción del pH del océano por CO2'),
    ('Pérdida de Hábitat', 'Destrucción o degradación de ecosistemas marinos'),
    ('Contaminación Química', 'Presencia de sustancias tóxicas en el agua'),
    ('Ruido Oceánico', 'Contaminación acústica por actividades humanas'),
    ('Especies Invasoras', 'Introducción de especies no nativas'),
    ('Turismo Irresponsable', 'Actividades turísticas que dañan ecosistemas'),
    ('Pesca Incidental', 'Captura accidental de especies no objetivo'),
    ('Microplásticos', 'Pequeñas partículas de plástico que contaminan la cadena alimentaria'),
    ('Dragado de Fondo', 'Pesca con redes que arrastran el fondo marino destruyendo hábitats'),
    ('Minería Submarina', 'Extracción de minerales del fondo oceánico'),
    ('Blanqueamiento de Corales', 'Pérdida de algas simbióticas en corales por estrés térmico'),
    ('Eutrofización', 'Exceso de nutrientes que causa proliferación de algas nocivas'),
    ('Derrame de Petróleo', 'Contaminación por hidrocarburos en el medio marino'),
    ('Construcción Costera', 'Desarrollo urbano e industrial en zonas costeras'),
    ('Pesca Fantasma', 'Redes y equipos de pesca abandonados que siguen capturando animales');

INSERT INTO Caracteristicas (tipo_caracteristica, valor) VALUES
    ('Longitud', '1.5 metros'),
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
    ('Velocidad', '10 km/h'),
    ('Longitud', '15 metros'),
    ('Longitud', '6 metros'),
    ('Longitud', '4 metros'),
    ('Longitud', '0.5 metros'),
    ('Longitud', '0.3 metros'),
    ('Longitud', '12 metros'),
    ('Peso', '6 toneladas'),
    ('Peso', '1.5 toneladas'),
    ('Peso', '500 kg'),
    ('Peso', '2 kg'),
    ('Peso', '60 toneladas'),
    ('Profundidad', '50-300 metros'),
    ('Profundidad', '300-800 metros'),
    ('Profundidad', '800-2000 metros'),
    ('Profundidad', '2000-4000 metros'),
    ('Temperatura', '5-15°C'),
    ('Temperatura', '25-35°C'),
    ('Velocidad', '65 km/h'),
    ('Velocidad', '5 km/h'),
    ('Velocidad', '80 km/h');

INSERT INTO Especies (nombre_comun, nombre_cientifico, descripcion, esperanza_vida, poblacion_estimada, id_estado_conservacion, imagen_url) VALUES
    ('Tortuga Verde', 'Chelonia mydas', 'Una de las tortugas marinas más grandes, conocida por su dieta herbívora y migración de larga distancia.', 80, 85000, 5, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'),
    ('Ballena Azul', 'Balaenoptera musculus', 'El animal más grande que ha existido en la Tierra, puede alcanzar hasta 30 metros de longitud.', 90, 15000, 4, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'),
    ('Vaquita Marina', 'Phocoena sinus', 'Marsopa endémica del Golfo de California, es el cetáceo más amenazado del mundo.', 20, 10, 3, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'),
    ('Coral Cuerno de Alce', 'Acropora palmata', 'Coral constructor de arrecifes crucial para la biodiversidad del Caribe.', 100, 50000, 3, 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800'),
    ('Delfín Nariz de Botella', 'Tursiops truncatus', 'Delfín inteligente y social, común en aguas costeras tropicales y templadas.', 50, 600000, 7, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'),
    ('Tiburón Ballena', 'Rhincodon typus', 'El pez más grande del mundo, filtrador de plancton y completamente inofensivo.', 70, 200000, 4, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'),
    ('Manatí del Caribe', 'Trichechus manatus', 'Mamífero acuático herbívoro que habita en aguas costeras cálidas.', 60, 13000, 5, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'),
    ('Tortuga Carey', 'Eretmochelys imbricata', 'Tortuga marina conocida por su hermoso caparazón y su papel en la salud de los arrecifes.', 80, 23000, 3, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'),
    ('Orca', 'Orcinus orca', 'El depredador apex de los océanos, conocido por su inteligencia superior y estructura social compleja.', 90, 50000, 7, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'),
    ('Cachalote', 'Physeter macrocephalus', 'El mamífero con el cerebro más grande del planeta. Especialista en buceo profundo para cazar calamares gigantes.', 70, 200000, 5, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'),
    ('Foca Monje del Mediterráneo', 'Monachus monachus', 'Una de las focas más raras del mundo, endémica del Mediterráneo.', 45, 700, 3, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'),
    ('Narval', 'Monodon monoceros', 'El "unicornio del mar", famoso por su colmillo espiral. Habita exclusivamente en aguas árticas.', 50, 75000, 6, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'),
    ('Tiburón Blanco', 'Carcharodon carcharias', 'El gran depredador de los océanos, crucial para el equilibrio de los ecosistemas marinos.', 70, 3500, 5, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'),
    ('Tiburón Martillo', 'Sphyrna mokarran', 'Tiburón distintivo por su cabeza en forma de martillo, que le proporciona ventajas sensoriales únicas.', 30, 5000, 3, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'),
    ('Mantarraya Gigante', 'Mobula birostris', 'La raya más grande del mundo, filtrador de plancton con increíble inteligencia y memoria.', 40, 5000, 5, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'),
    ('Tiburón Peregrino', 'Cetorhinus maximus', 'El segundo pez más grande del mundo, filtrador de plancton completamente inofensivo para humanos.', 50, 8000, 4, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'),
    ('Atún Rojo del Atlántico', 'Thunnus thynnus', 'El pez más valioso comercialmente, capaz de generar calor corporal y nadar a velocidades increíbles.', 40, 60000, 4, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800');

-- =============================================
-- RELACIONES ECOLÓGICAS DE ESPECIES
-- =============================================

INSERT INTO EspeciesHabitats (id_especie, id_habitat) VALUES
    (1, 3), (1, 5), (1, 6),
    (2, 2), (2, 8),
    (3, 3), (3, 6),
    (4, 1), (4, 3),
    (5, 2), (5, 3),
    (6, 1), (6, 2),
    (7, 3), (7, 5), (7, 6),
    (8, 1), (8, 3),
    (9, 2), (9, 3), (9, 11),
    (10, 2), (10, 4), (10, 9), (10, 10),
    (11, 3), (11, 1), (11, 11),
    (12, 8), (12, 2),
    (13, 3), (13, 2), (13, 11), (13, 13),
    (14, 3), (14, 1), (14, 13),
    (15, 2), (15, 13), (15, 14),
    (16, 2), (16, 8), (16, 13),
    (17, 2), (17, 13), (17, 14);

INSERT INTO EspeciesAmenazas (id_especie, id_amenaza) VALUES
    (1, 1), (1, 2), (1, 5), (1, 10),
    (2, 2), (2, 6), (2, 7), (2, 3),
    (3, 3), (3, 7), (3, 10), (3, 6),
    (4, 2), (4, 4), (4, 6), (4, 9),
    (5, 1), (5, 6), (5, 7), (5, 10),
    (6, 3), (6, 2), (6, 7), (6, 9),
    (7, 1), (7, 2), (7, 5), (7, 6),
    (8, 1), (8, 2), (8, 5), (8, 9),
    (9, 1), (9, 6), (9, 7), (9, 11), (9, 16),
    (10, 1), (10, 7), (10, 11), (10, 3), (10, 16),
    (11, 5), (11, 9), (11, 1), (11, 17), (11, 6),
    (12, 2), (12, 7), (12, 16), (12, 3),
    (13, 3), (13, 10), (13, 7), (13, 1), (13, 18),
    (14, 3), (14, 10), (14, 18), (14, 12),
    (15, 3), (15, 10), (15, 1), (15, 11), (15, 9),
    (16, 3), (16, 10), (16, 1), (16, 16),
    (17, 3), (17, 10), (17, 18), (17, 11);

INSERT INTO EspeciesCaracteristicas (id_especie, id_caracteristica) VALUES
    (1, 1), (1, 6), (1, 9), (1, 13),
    (2, 2), (2, 5), (2, 10), (2, 14),
    (3, 4), (3, 8), (3, 9), (3, 13),
    (4, 9), (4, 13),
    (5, 3), (5, 7), (5, 10), (5, 16),
    (6, 2), (6, 5), (6, 10), (6, 13),
    (7, 3), (7, 7), (7, 9), (7, 17),
    (8, 1), (8, 6), (8, 9), (8, 13),
    (9, 19), (9, 25), (9, 15), (9, 36),
    (10, 24), (10, 29), (10, 14), (10, 12),
    (11, 3), (11, 7), (11, 9), (11, 13),
    (12, 20), (12, 26), (12, 15), (12, 18),
    (13, 20), (13, 26), (13, 10), (13, 16),
    (14, 21), (14, 27), (14, 30), (14, 35),
    (15, 21), (15, 27), (15, 30), (15, 37),
    (16, 19), (16, 26), (16, 14), (16, 18),
    (17, 3), (17, 8), (17, 13), (17, 38);

-- =============================================
-- AVISTAMIENTOS
-- =============================================

INSERT INTO Avistamientos (id_especie, fecha, latitud, longitud, notas, id_usuario) VALUES
    (1, '2024-06-01 10:30:00', 20.9674, -89.5926, 'Grupo de 5 tortugas verdes alimentándose en praderas marinas', 1),
    (2, '2024-06-05 14:15:00', 28.2916, -113.1471, 'Avistamiento de ballena azul con cría durante migración', 2),
    (3, '2024-06-10 09:00:00', 31.3069, -114.0825, 'Vaquita marina vista brevemente en la superficie', 4),
    (4, '2024-06-15 11:45:00', 20.5083, -87.4581, 'Colonia de corales en recuperación después de blanqueamiento', 1),
    (5, '2024-06-20 16:20:00', 23.6345, -109.1191, 'Manada de delfines nariz de botella jugando en la superficie', 3),
    (6, '2024-06-25 08:30:00', 18.7669, -88.0821, 'Tiburón ballena alimentándose de plancton', 5),
    (7, '2024-06-30 12:00:00', 21.1619, -86.8515, 'Manatí con cría descansando en aguas someras', 2),
    (8, '2024-07-01 07:45:00', 20.6296, -87.0739, 'Tortuga carey anidando en playa protegida', 4),
    (9, '2024-07-05 11:00:00', 48.8566, 2.3522, 'Manada de orcas avistada en migración con 8 individuos incluyendo crías', 1),
    (10, '2024-07-08 14:30:00', 36.7783, -119.4179, 'Cachalote macho solitario realizando inmersiones profundas', 2),
    (11, '2024-07-10 09:15:00', 35.3387, 25.1442, 'Foca monje descansando en cueva costera protegida', 3),
    (12, '2024-07-12 16:45:00', 82.5018, -82.0000, 'Grupo de narvales con colmillos espectaculares en aguas árticas', 4);

-- =============================================
-- EVENTOS
-- =============================================

INSERT INTO TiposEvento (nombre, descripcion) VALUES
    ('Conferencia', 'Presentación científica sobre temas de conservación marina'),
    ('Taller', 'Actividad práctica de educación ambiental'),
    ('Limpieza de Playa', 'Actividad de voluntariado para limpieza costera'),
    ('Seminario', 'Sesión educativa sobre biodiversidad marina'),
    ('Expedición', 'Viaje de investigación y observación'),
    ('Campaña de Concientización', 'Actividad de divulgación y sensibilización'),
    ('Capacitación', 'Formación especializada en conservación'),
    ('Festival', 'Evento cultural y educativo sobre el océano');

INSERT INTO Eventos (titulo, descripcion, fecha_evento, hora_inicio, hora_fin, id_tipo_evento, id_modalidad, id_direccion, url_evento, capacidad_maxima, costo, id_organizador, id_estatus) VALUES
    ('Conservación de Tortugas Marinas en México', 'Conferencia sobre los esfuerzos de conservación de tortugas marinas en las costas mexicanas', '2025-08-15', '09:00', '12:00', 1, 1, 1, 'https://sway.org/eventos/tortugas-marinas', 100, 0.00, 1, 1),
    ('Taller de Identificación de Especies Marinas', 'Actividad práctica para aprender a identificar especies marinas comunes', '2025-08-20', '10:00', '16:00', 2, 1, 2, 'https://sway.org/eventos/identificacion-especies', 50, 200.00, 2, 1),
    ('Limpieza de Playa Veracruz', 'Jornada de limpieza costera en las playas de Veracruz', '2025-08-25', '08:00', '12:00', 3, 1, 10, NULL, 200, 0.00, 3, 1),
    ('Webinar: Cambio Climático y Océanos', 'Seminario virtual sobre el impacto del cambio climático en los ecosistemas marinos', '2025-09-01', '19:00', '21:00', 4, 2, NULL, 'https://zoom.us/webinar/clima-oceanos', 500, 0.00, 4, 1),
    ('Expedición Científica Cozumel', 'Viaje de investigación para estudiar arrecifes de coral en Cozumel', '2025-09-10', '07:00', '18:00', 5, 1, 12, 'https://sway.org/expedicion-cozumel', 20, 1500.00, 5, 1);

-- =============================================
-- BIBLIOTECA DE RECURSOS
-- =============================================

INSERT INTO TiposRecurso (nombre, descripcion) VALUES
    ('Artículo Científico', 'Publicación de investigación científica revisada por pares'),
    ('Guía Educativa', 'Material educativo para diferentes niveles'),
    ('Informe Técnico', 'Documento técnico con resultados de investigación'),
    ('Video Educativo', 'Contenido audiovisual con fines educativos'),
    ('Presentación', 'Material de apoyo para conferencias y talleres'),
    ('Manual', 'Guía práctica de procedimientos'),
    ('Libro Digital', 'Publicación digital sobre temas de conservación'),
    ('Podcast', 'Contenido de audio educativo');

INSERT INTO RecursosBiblioteca (titulo, descripcion, id_tipo_recurso, archivo_url, tamaño_mb, formato, id_autor, fecha_publicacion, numero_paginas, duracion_minutos, id_idioma, licencia, activo) VALUES
    ('Guía de Identificación de Tortugas Marinas', 'Manual completo para la identificación de especies de tortugas marinas en México', 2, 'https://sway.org/recursos/guia-tortugas.pdf', 25.5, 'PDF', 1, '2024-03-15', 120, NULL, 1, 'Creative Commons', true),
    ('El Impacto del Cambio Climático en Arrecifes de Coral', 'Artículo sobre los efectos del calentamiento global en los ecosistemas coralinos', 1, 'https://sway.org/recursos/clima-arrecifes.pdf', 8.2, 'PDF', 2, '2024-04-10', 45, NULL, 1, 'Open Access', true),
    ('Técnicas de Rehabilitación de Mamíferos Marinos', 'Manual técnico para la rehabilitación de mamíferos marinos heridos', 6, 'https://sway.org/recursos/rehab-mamiferos.pdf', 18.7, 'PDF', 3, '2024-05-20', 85, NULL, 1, 'CC BY-SA', true),
    ('Documental: Vida en los Arrecifes', 'Video educativo sobre la biodiversidad en los arrecifes de coral', 4, 'https://sway.org/recursos/vida-arrecifes.mp4', 850.3, 'MP4', 4, '2024-06-01', NULL, 45, 1, 'Educational Use', true);

INSERT INTO TagsRecurso (nombre) VALUES
    ('Conservación'), ('Educación'), ('Investigación'), ('Tortugas'), ('Ballenas'),
    ('Arrecifes'), ('Cambio Climático'), ('Rehabilitación'), ('Monitoreo'), ('Primeros Auxilios'),
    ('Biodiversidad'), ('Ecosistemas'), ('Sostenibilidad'), ('Océanos'), ('Fauna Marina');

INSERT INTO RecursosTags (id_recurso, id_tag) VALUES
    (1, 1), (1, 2), (1, 4), (1, 11),
    (2, 3), (2, 6), (2, 7), (2, 12),
    (3, 1), (3, 5), (3, 8), (3, 15),
    (4, 2), (4, 6), (4, 11), (4, 14);

-- =============================================
-- TIENDA
-- =============================================

INSERT INTO CategoriasProducto (nombre, descripcion) VALUES
    ('Ropa Sostenible', 'Prendas fabricadas con materiales ecológicos'),
    ('Accesorios Ecológicos', 'Productos útiles hechos con materiales reciclados'),
    ('Educativos', 'Materiales educativos sobre conservación marina'),
    ('Hogar Sustentable', 'Productos para el hogar que respetan el medio ambiente'),
    ('Juguetes Ecológicos', 'Juguetes fabricados con materiales naturales'),
    ('Libros y Guías', 'Publicaciones sobre vida marina y conservación'),
    ('Arte y Decoración', 'Objetos decorativos con temática marina'),
    ('Equipos de Limpieza', 'Herramientas para limpieza de playas y océanos');

INSERT INTO Productos (nombre, descripcion, precio, id_categoria, stock, imagen_url, id_material, dimensiones, peso_gramos, es_sostenible, activo) VALUES
    ('Camiseta SWAY Tortuga Verde', 'Camiseta 100% algodón orgánico con diseño de tortuga verde', 299.00, 1, 150, 'https://sway.org/products/camiseta-tortuga.jpg', 1, 'S, M, L, XL', 200, true, true),
    ('Botella de Agua Reutilizable', 'Botella de acero inoxidable con logo SWAY, libre de BPA', 399.00, 2, 200, 'https://sway.org/products/botella-agua.jpg', 5, '750ml', 350, true, true),
    ('Guía de Especies Marinas de México', 'Libro impreso con información de 200 especies marinas mexicanas', 450.00, 6, 100, 'https://sway.org/products/guia-especies.jpg', 6, '21x28cm', 800, true, true),
    ('Bolsa de Compras Eco-Friendly', 'Bolsa reutilizable hecha de plástico reciclado del océano', 149.00, 2, 300, 'https://sway.org/products/bolsa-eco.jpg', 3, '40x35cm', 80, true, true),
    ('Kit de Limpieza de Playa', 'Set completo para limpieza de playas: bolsas, guantes, recogedores', 399.00, 8, 50, 'https://sway.org/products/kit-limpieza.jpg', 3, '30x20x10cm', 500, true, true);

-- =============================================
-- PEDIDOS Y DETALLES
-- =============================================

INSERT INTO Pedidos (id_usuario, fecha_pedido, total, id_estatus, id_direccion, telefono_contacto) VALUES
    (1, '2024-06-01 14:30:00', 698.00, 4, 1, '4421234567'),
    (2, '2024-06-05 10:15:00', 448.00, 4, 2, '4421234568'),
    (3, '2024-06-10 16:45:00', 597.00, 4, 3, '4421234569'),
    (4, '2024-06-15 11:20:00', 299.00, 4, 4, '4421234570'),
    (5, '2024-06-20 13:10:00', 850.00, 6, 5, '4421234571');

INSERT INTO DetallesPedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal) VALUES
    (1, 1, 1, 299.00, 299.00),
    (1, 2, 1, 399.00, 399.00),
    (2, 3, 1, 450.00, 450.00),
    (3, 4, 2, 149.00, 298.00),
    (3, 1, 1, 299.00, 299.00),
    (4, 1, 1, 299.00, 299.00),
    (5, 5, 1, 399.00, 399.00),
    (5, 3, 1, 450.00, 450.00);

INSERT INTO "ReseñasProducto" (id_producto, id_usuario, calificacion, comentario, "fecha_reseña") VALUES
    (1, 1, 5, 'Excelente calidad, la tela es muy suave y el diseño hermoso. Muy recomendable.', '2024-06-10'),
    (2, 2, 4, 'Buena botella, mantiene la temperatura bien. Solo le falta un poco más de capacidad.', '2024-06-12'),
    (3, 3, 5, 'Guía completa y bien ilustrada. Perfecta para estudiantes y amantes de la vida marina.', '2024-06-18'),
    (4, 1, 5, 'Me encanta que esté hecha de plástico reciclado. Es resistente y muy útil.', '2024-06-20'),
    (1, 4, 4, 'Buena camiseta, aunque el talla un poco grande. El material es excelente.', '2024-06-25');

-- =============================================
-- DONACIONES Y TESTIMONIOS
-- =============================================

INSERT INTO Donadores (id_usuario, monto, fecha_donacion, id_tipoDonacion) VALUES
    (1, 500.00, '2024-01-20', 1),
    (2, 100.00, '2024-02-15', 2),
    (3, 1000.00, '2024-03-10', 1),
    (4, 50.00, '2024-04-05', 2),
    (5, 250.00, '2024-05-12', 1),
    (6, 75.00, '2024-06-01', 2),
    (7, 800.00, '2024-06-15', 1),
    (8, 200.00, '2024-07-01', 2);

INSERT INTO Testimonios (id_usuario, testimonio, fecha_creacion, aprobado) VALUES
    (1, 'SWAY ha cambiado mi perspectiva sobre la conservación marina. Sus programas educativos son excepcionales y realmente hacen la diferencia.', '2024-06-01', true),
    (2, 'Participé en la limpieza de playa organizada por SWAY. Fue una experiencia increíble ver el impacto positivo que podemos tener trabajando juntos.', '2024-06-05', true),
    (3, 'Los recursos educativos de SWAY son de calidad mundial. Como educador, los uso constantemente en mis clases.', '2024-06-10', true),
    (4, 'Adopté una tortuga marina a través de SWAY y recibo actualizaciones regulares. Es emocionante ser parte de su recuperación.', '2024-06-15', true),
    (5, 'La tienda de SWAY ofrece productos realmente sostenibles. Me encanta poder comprar con conciencia ambiental.', '2024-06-20', true);

INSERT INTO Contactos (id_usuario, asunto, mensaje, fecha_contacto, respondido) VALUES
    (1, 'Consulta sobre voluntariado', 'Hola, me interesa ser voluntario en sus programas de conservación marina.', '2024-06-01', true),
    (2, 'Pregunta sobre especies', '¿Tienen información sobre el estado de las mantarrayas en México?', '2024-06-05', true),
    (3, 'Colaboración educativa', 'Soy maestro y me gustaría colaborar con SWAY para llevar educación marina a mi escuela.', '2024-06-10', true),
    (4, 'Reporte de avistamiento', 'Vi una ballena jorobada en la costa de Guerrero.', '2024-06-15', true),
    (5, 'Consulta sobre donaciones', '¿Puedo hacer una donación en especie? Tengo equipos de buceo que ya no uso.', '2024-06-20', false);

-- =============================================
-- REGISTROS DE EVENTOS
-- =============================================

INSERT INTO RegistrosEvento (id_evento, id_usuario, fecha_registro, asistio) VALUES
    (1, 1, '2024-06-01', true),
    (1, 2, '2024-06-02', true),
    (1, 3, '2024-06-03', true),
    (2, 4, '2024-06-05', true),
    (2, 5, '2024-06-06', true),
    (3, 6, '2024-06-10', true),
    (3, 7, '2024-06-11', true),
    (3, 8, '2024-06-12', true),
    (4, 9, '2024-06-15', true),
    (4, 10, '2024-06-16', true);

-- =============================================
-- DESCARGAS DE RECURSOS
-- =============================================

INSERT INTO DescargasRecurso (id_recurso, id_usuario, fecha_descarga, ip_descarga) VALUES
    (1, 1, '2024-06-01 10:30:00', '192.168.1.100'),
    (1, 2, '2024-06-02 14:15:00', '192.168.1.101'),
    (2, 3, '2024-06-05 09:45:00', '192.168.1.102'),
    (3, 4, '2024-06-10 16:20:00', '192.168.1.103'),
    (4, 5, '2024-06-15 11:30:00', '192.168.1.104');

-- =============================================
-- CATÁLOGOS PARA COLABORADORES CIENTÍFICOS
-- =============================================

INSERT INTO EspecialidadesColaboradores (nombre, descripcion) VALUES
    ('Biología Marina', 'Estudio de los organismos marinos y sus ecosistemas'),
    ('Oceanografía', 'Estudio de los océanos y sus procesos físicos, químicos y biológicos'),
    ('Ictiología', 'Estudio de los peces y su comportamiento'),
    ('Conservación Marina', 'Estrategias y técnicas para la preservación de ecosistemas marinos'),
    ('Ecología Marina', 'Estudio de las interacciones entre organismos marinos y su ambiente'),
    ('Taxonomía Marina', 'Clasificación y nomenclatura de especies marinas'),
    ('Otra especialidad', 'Otras áreas relacionadas con ciencias marinas');

INSERT INTO GradosAcademicos (nombre, nivel) VALUES
    ('Licenciatura', 1),
    ('Maestría', 2),
    ('Doctorado', 3),
    ('Postdoctorado', 4);

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

SELECT 'Usuarios' AS Tabla, COUNT(*) AS Registros FROM Usuarios
UNION ALL SELECT 'Especies', COUNT(*) FROM Especies
UNION ALL SELECT 'Eventos', COUNT(*) FROM Eventos
UNION ALL SELECT 'Productos', COUNT(*) FROM Productos
UNION ALL SELECT 'RecursosBiblioteca', COUNT(*) FROM RecursosBiblioteca
UNION ALL SELECT 'Avistamientos', COUNT(*) FROM Avistamientos
UNION ALL SELECT 'Donadores', COUNT(*) FROM Donadores
UNION ALL SELECT 'Testimonios', COUNT(*) FROM Testimonios
UNION ALL SELECT 'Contactos', COUNT(*) FROM Contactos
UNION ALL SELECT 'Pedidos', COUNT(*) FROM Pedidos;
