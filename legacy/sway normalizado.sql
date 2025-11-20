-- =============================================
-- BASE DE DATOS SWAY - VERSIÓN MEJORADA
-- =============================================
--CREATE DATABASE sway;
USE sway;

-- =============================================
-- TABLAS direccion
-- =============================================

create table estados (
    id int identity(1,1) primary key,
    nombre varchar(254) not null
);


create table municipios (
    id int identity(1,1) primary key,
    nombre varchar(254) not null,
    id_estado int not null,
    foreign key (id_estado) references estados(id)
);


create table colonias (
    id int identity(1,1) primary key,
    nombre varchar(254) not null,
    id_municipio int not null,
    cp int,
    foreign key (id_municipio) references municipios(id)
);


create table calles (
    id int identity(1,1) primary key,
    nombre varchar(254) not null,
    id_colonia int not null,
    n_interior int,
    n_exterior int,
    foreign key (id_colonia) references colonias(id)
);


create table direcciones (
    id int identity(1,1) primary key,
    id_calle int not null,
    foreign key (id_calle) references calles(id)
);



create table Especialidades(
    id int identity(1,1) primary key,
	nombre VARCHAR(254) NOT NULL,
);

create table Instituciones(
    id int identity(1,1) primary key,
	nombre VARCHAR(254) NOT NULL,
);

create table Organizaciones(
    id int identity(1,1) primary key,
	nombre VARCHAR(254) NOT NULL,
);

create table TipoDonaciones(
    id int identity(1,1) primary key,
	nombre VARCHAR(254) NOT NULL,
);

create table TiposTarjeta(
    id int identity(1,1) primary key,
	nombre VARCHAR(254) NOT NULL,
);

create table Estatus(
    id int identity(1,1) primary key,
	nombre VARCHAR(254) NOT NULL,
);

create table Cargos(
    id int identity(1,1) primary key,
	nombre VARCHAR(254) NOT NULL,
);


-- =============================================
-- TABLAS EXISTENTES (MEJORADAS)
-- =============================================
CREATE TABLE Usuarios(
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellidoPaterno VARCHAR(50) NOT NULL,
    apellidoMaterno VARCHAR(50) NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    suscrito_newsletter BIT DEFAULT 0,
    -- 0 = No, 1 = Sí
    fecha_registro DATETIME DEFAULT GETDATE(),
    activo BIT DEFAULT 1
);
-- Nueva tabla para autores
CREATE TABLE Autores(
    id INT IDENTITY(1, 1) PRIMARY KEY,
    id_usuario INT NOT NULL,
    biografia TEXT,
    id_especialidad INT, --normalizar especialidad
    id_institucion INT,-- normalizar institucion
    fecha_alta DATETIME DEFAULT GETDATE(),
	FOREIGN KEY (id_usuario) REFERENCES Usuarios(id),
	FOREIGN KEY (id_especialidad) REFERENCES Especialidades(id),
	FOREIGN KEY (id_institucion) REFERENCES Instituciones(id)
);
-- Nueva tabla para organizadores
CREATE TABLE Organizadores(
    id INT IDENTITY(1, 1) PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_organizacion INT, 
    id_cargo INT, -- normalizar cargo 
    experiencia_eventos INT DEFAULT 0,
    -- Número de eventos organizados
    certificado BIT DEFAULT 0,
    fecha_alta DATETIME DEFAULT GETDATE(),
	FOREIGN KEY (id_organizacion) REFERENCES Organizaciones(id),
	FOREIGN KEY (id_cargo) REFERENCES Cargos(id),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);

CREATE TABLE Contactos(
    id INT IDENTITY(1, 1) PRIMARY KEY,
    id_usuario INT,
    asunto VARCHAR(50) NOT NULL,
    mensaje TEXT DEFAULT NULL,
    fecha_contacto DATETIME DEFAULT GETDATE(),
    respondido BIT DEFAULT 0,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);

CREATE TABLE Donadores(
    id INT IDENTITY(1, 1) PRIMARY KEY,
    id_usuario INT,
    monto DECIMAL(10, 2) NOT NULL,
    fecha_donacion DATETIME DEFAULT GETDATE(),
    id_tipoDonacion INT DEFAULT 1, -- normalizar tipo_donacion '1' unica
    -- única, mensual, anual
	FOREIGN KEY (id_tipoDonacion) REFERENCES tipoDonaciones(id),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);
-- Tabla mejorada con encriptación para datos sensibles
CREATE TABLE Donaciones(
    id INT IDENTITY(1, 1) PRIMARY KEY,
    id_donador INT,
    numero_tarjeta_encriptado VARCHAR(256),
    -- Encriptado
    fecha_expiracion_encriptada VARCHAR(256),
    -- Encriptado
    cvv_encriptado VARCHAR(256),
    -- Encriptado
    id_tipoTarjeta INT,--normalizar tipo_tarjeta
    -- Visa, Mastercard, etc.
	FOREIGN KEY (id_tipoTarjeta) REFERENCES tiposTarjeta(id) ON DELETE CASCADE,
    FOREIGN KEY (id_donador) REFERENCES Donadores(id) ON DELETE CASCADE
);
CREATE TABLE Testimonios(
    id INT IDENTITY(1, 1) PRIMARY KEY,
    id_usuario INT,
    testimonio TEXT,
    fecha_creacion DATETIME DEFAULT GETDATE(),
    aprobado BIT DEFAULT 0,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);
-- Catálogo de especies
CREATE TABLE EstadosConservacion (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);
CREATE TABLE Caracteristicas (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    tipo_caracteristica VARCHAR(50) NOT NULL,
    valor VARCHAR(100) NOT NULL
);
CREATE TABLE Amenazas(
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);
CREATE TABLE Habitats (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
);
CREATE TABLE Especies (
    id INT IDENTITY(1, 1) PRIMARY KEY,
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
    id INT IDENTITY(1, 1) PRIMARY KEY,
    id_especie INT,
    fecha DATETIME NOT NULL,
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
-- NUEVAS TABLAS
-- =============================================
-- Tabla de Eventos
CREATE TABLE Modalidades(
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE Materiales(
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE Idiomas(
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

CREATE TABLE TiposEvento (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);
CREATE TABLE Eventos (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_evento DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME,
    id_tipo_evento INT,
	id_modalidad INT, -- normalizar modalidad
    id_direccion int,
    url_evento VARCHAR(255),
    capacidad_maxima INT,
    costo DECIMAL(10, 2) DEFAULT 0,
    id_organizador INT,
    -- Ahora referencia a la tabla Organizadores
	id_estatus INT,--normalizar en estatus
    fecha_creacion DATETIME DEFAULT GETDATE(),
	FOREIGN KEY (id_direccion) REFERENCES Direcciones(id),
	FOREIGN KEY (id_modalidad) REFERENCES Modalidades(id),
	FOREIGN KEY (id_estatus) REFERENCES Estatus(id),
    FOREIGN KEY (id_tipo_evento) REFERENCES TiposEvento(id),
    FOREIGN KEY (id_organizador) REFERENCES Organizadores(id)
);
CREATE TABLE RegistrosEvento (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    id_evento INT,
    id_usuario INT,
    fecha_registro DATETIME DEFAULT GETDATE(),
    asistio BIT DEFAULT 0,
    FOREIGN KEY (id_evento) REFERENCES Eventos(id),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id),
    UNIQUE(id_evento, id_usuario)
);
-- Tabla de Biblioteca
CREATE TABLE TiposRecurso (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);
CREATE TABLE RecursosBiblioteca (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    id_tipo_recurso INT,
    archivo_url VARCHAR(255),
    tamaño_mb DECIMAL(10, 2),
    formato VARCHAR(20),
    -- PDF, DOCX, MP4, etc.
    id_autor INT,
    -- Ahora referencia a la tabla Autores
    fecha_publicacion DATE,
    numero_paginas INT,
    duracion_minutos INT,
    -- Para videos
    id_idioma INT NOT NULL DEFAULT 1, --normalizar idioma '1' Español
    licencia VARCHAR(100),
    activo BIT DEFAULT 1,
    fecha_agregado DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (id_tipo_recurso) REFERENCES TiposRecurso(id),
    FOREIGN KEY (id_autor) REFERENCES Autores(id),
	FOREIGN KEY (id_idioma) REFERENCES Idiomas(id)
);
CREATE TABLE DescargasRecurso (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    id_recurso INT,
    id_usuario INT,
    fecha_descarga DATETIME DEFAULT GETDATE(),
    ip_descarga VARCHAR(45),
    FOREIGN KEY (id_recurso) REFERENCES RecursosBiblioteca(id),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);
CREATE TABLE TagsRecurso (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE RecursosTags (
    id_recurso INT,
    id_tag INT,
    PRIMARY KEY (id_recurso, id_tag),
    FOREIGN KEY (id_recurso) REFERENCES RecursosBiblioteca(id),
    FOREIGN KEY (id_tag) REFERENCES TagsRecurso(id)
);
-- Tabla de Tienda
CREATE TABLE CategoriasProducto (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT
);
CREATE TABLE Productos (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    id_categoria INT,
    stock INT DEFAULT 0,
    imagen_url VARCHAR(255),
    id_material INT, --normalizar
    dimensiones VARCHAR(100),
    peso_gramos INT,
    es_sostenible BIT DEFAULT 1,
    activo BIT DEFAULT 1,
    fecha_agregado DATETIME DEFAULT GETDATE(),
	FOREIGN KEY (id_material) REFERENCES Materiales(id),
    FOREIGN KEY (id_categoria) REFERENCES CategoriasProducto(id)
);
CREATE TABLE Pedidos (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    id_usuario INT,
    fecha_pedido DATETIME DEFAULT GETDATE(),
    total DECIMAL(10, 2) NOT NULL,
	id_estatus INT, --normalizar estatus
	id_direccion INT,
    telefono_contacto VARCHAR(20),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id),
	FOREIGN KEY (id_estatus) REFERENCES Estatus(id),
	FOREIGN KEY (id_direccion) REFERENCES Direcciones(id)
);
CREATE TABLE DetallesPedido (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    id_pedido INT,
    id_producto INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES Pedidos(id),
    FOREIGN KEY (id_producto) REFERENCES Productos(id)
);
CREATE TABLE ReseñasProducto (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    id_producto INT,
    id_usuario INT,
    calificacion INT CHECK (
        calificacion BETWEEN 1 AND 5
    ),
    comentario TEXT,
    fecha_reseña DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (id_producto) REFERENCES Productos(id),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id),
    UNIQUE(id_producto, id_usuario)
);
