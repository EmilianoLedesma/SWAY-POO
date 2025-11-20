-- =============================================
-- BASE DE DATOS SWAY - ESTRUCTURA COMPLETA (DDL)
-- Sistema de Conservación Marina y Vida Acuática
-- Versión: 2.0 - Normalizada y Corregida
-- =============================================

USE sway;

-- =============================================
-- TABLAS DE DIRECCIONES
-- =============================================

-- Tabla de estados de la República Mexicana para el sistema de direcciones
CREATE TABLE Estados (
    id int identity(1,1) primary key,       -- Identificador único del estado
    nombre varchar(254) not null             -- Nombre completo del estado mexicano
);

-- Tabla de municipios asociados a cada estado
CREATE TABLE Municipios (
    id int identity(1,1) primary key,       -- Identificador único del municipio
    nombre varchar(254) not null,            -- Nombre oficial del municipio
    id_estado int not null,                  -- Referencia al estado al que pertenece
    foreign key (id_estado) references Estados(id)
);

-- Tabla de colonias y códigos postales
CREATE TABLE Colonias (
    id int identity(1,1) primary key,       -- Identificador único de la colonia
    nombre varchar(254) not null,            -- Nombre de la colonia o barrio
    id_municipio int not null,               -- Referencia al municipio
    cp int,                                  -- Código postal de la colonia
    foreign key (id_municipio) references Municipios(id)
);

-- Tabla de calles con numeración interior y exterior
CREATE TABLE Calles (
    id int identity(1,1) primary key,       -- Identificador único de la calle
    nombre varchar(254) not null,            -- Nombre de la calle o avenida
    id_colonia int not null,                 -- Referencia a la colonia
    n_interior int,                          -- Número interior (opcional)
    n_exterior int,                          -- Número exterior (opcional)
    foreign key (id_colonia) references Colonias(id)
);

-- Tabla principal de direcciones completas para usuarios y eventos
CREATE TABLE Direcciones (
    id int identity(1,1) primary key,       -- Identificador único de la dirección
    id_calle int not null,                   -- Referencia a la calle específica
    foreign key (id_calle) references Calles(id)
);

-- =============================================
-- TABLAS DE CATÁLOGOS
-- =============================================

-- Catálogo de especialidades científicas para autores y colaboradores
CREATE TABLE Especialidades (
    id int identity(1,1) primary key,       -- Identificador único de especialidad
    nombre varchar(254) not null             -- Nombre de la especialidad científica
);

-- Catálogo de instituciones académicas y de investigación
CREATE TABLE Instituciones (
    id int identity(1,1) primary key,       -- Identificador único de institución
    nombre varchar(254) not null             -- Nombre completo de la institución
);

-- Catálogo de organizaciones para eventos y actividades
CREATE TABLE Organizaciones (
    id int identity(1,1) primary key,       -- Identificador único de organización
    nombre varchar(254) not null             -- Nombre de la organización
);

-- Catálogo de tipos de donaciones (única, mensual, anual, etc.)
CREATE TABLE TipoDonaciones (
    id int identity(1,1) primary key,       -- Identificador único del tipo
    nombre varchar(254) not null             -- Descripción del tipo de donación
);

-- Catálogo de tipos de tarjetas de pago aceptadas
CREATE TABLE TiposTarjeta (
    id int identity(1,1) primary key,       -- Identificador único del tipo de tarjeta
    nombre varchar(254) not null             -- Nombre del tipo (Visa, Mastercard, etc.)
);

-- Catálogo de estatus para pedidos, eventos y procesos del sistema
CREATE TABLE Estatus (
    id int identity(1,1) primary key,       -- Identificador único del estatus
    nombre varchar(254) not null             -- Descripción del estado (Activo, Pendiente, etc.)
);

-- Catálogo de cargos para organizadores de eventos
CREATE TABLE Cargos (
    id int identity(1,1) primary key,       -- Identificador único del cargo
    nombre varchar(254) not null             -- Nombre del cargo (Director, Coordinador, etc.)
);

-- Catálogo de modalidades para eventos (presencial, virtual, híbrida)
CREATE TABLE Modalidades (
    id int identity(1,1) primary key,       -- Identificador único de modalidad
    nombre varchar(50) not null              -- Tipo de modalidad del evento
);

-- Catálogo de materiales sostenibles para productos de la tienda
CREATE TABLE Materiales (
    id int identity(1,1) primary key,       -- Identificador único del material
    nombre varchar(50) not null              -- Tipo de material ecológico
);

-- Catálogo de idiomas para recursos de la biblioteca
CREATE TABLE Idiomas (
    id int identity(1,1) primary key,       -- Identificador único del idioma
    nombre varchar(50) not null              -- Nombre del idioma
);

-- =============================================
-- TABLA PRINCIPAL DE USUARIOS (ESTRUCTURA CORREGIDA)
-- =============================================

/*
 * Tabla principal de usuarios del sistema SWAY
 * Almacena información básica de todos los tipos de usuarios
 * (visitantes, colaboradores, organizadores, administradores)
 */
CREATE TABLE Usuarios (
    id int identity(1,1) primary key,       -- Identificador único del usuario
    nombre varchar(50) not null,             -- Primer nombre del usuario
    apellido_paterno varchar(50) not null,   -- Apellido paterno obligatorio
    apellido_materno varchar(50) null,       -- Apellido materno opcional
    email varchar(100) not null unique,      -- Correo electrónico único
    password_hash varchar(255),              -- Contraseña encriptada
    telefono varchar(20),                    -- Número telefónico
    fecha_nacimiento date,                   -- Fecha de nacimiento
    suscrito_newsletter bit default 0,      -- Suscripción al boletín
    fecha_registro datetime default getdate(), -- Fecha de registro automática
    activo bit default 1                     -- Estado activo del usuario
);

-- =============================================
-- TABLA DE ADMINISTRADORES
-- =============================================

-- Tabla de administradores del sistema con privilegios especiales
CREATE TABLE Administradores (
    id int identity(1,1) primary key,       -- Identificador único del administrador
    id_usuario int not null,                 -- Referencia al usuario base
    foreign key (id_usuario) references Usuarios(id)
);

-- =============================================
-- TABLAS DE ROLES DE USUARIO
-- =============================================

-- Tabla de autores científicos que publican recursos en la biblioteca
CREATE TABLE Autores (
    id int identity(1,1) primary key,       -- Identificador único del autor
    id_usuario int not null,                 -- Referencia al usuario base
    biografia text,                          -- Descripción profesional del autor
    id_especialidad int,                     -- Área de especialización
    id_institucion int,                      -- Institución de adscripción
    fecha_alta datetime default getdate(),   -- Fecha de registro como autor
    foreign key (id_usuario) references Usuarios(id),
    foreign key (id_especialidad) references Especialidades(id),
    foreign key (id_institucion) references Instituciones(id)
);

-- Tabla de organizadores de eventos de conservación marina
CREATE TABLE Organizadores (
    id int identity(1,1) primary key,       -- Identificador único del organizador
    id_usuario int not null,                 -- Referencia al usuario base
    id_organizacion int,                     -- Organización a la que pertenece
    id_cargo int,                            -- Cargo dentro de la organización
    experiencia_eventos int default 0,       -- Número de eventos organizados
    certificado bit default 0,              -- Tiene certificación oficial
    fecha_alta datetime default getdate(),   -- Fecha de registro como organizador
    foreign key (id_organizacion) references Organizaciones(id),
    foreign key (id_cargo) references Cargos(id),
    foreign key (id_usuario) references Usuarios(id)
);

/*
 * Tabla de colaboradores científicos del sistema SWAY
 * Gestiona solicitudes y perfiles de expertos en conservación marina
 * que desean contribuir con contenido y conocimiento especializado
 */
CREATE TABLE Colaboradores (
    id int identity(1,1) primary key,       -- Identificador único del colaborador
    id_usuario int not null,                 -- Referencia al usuario base
    especialidad varchar(100) not null,      -- Área de especialización científica
    grado_academico varchar(50) not null,    -- Nivel académico alcanzado
    institucion varchar(200) not null,       -- Institución de adscripción actual
    años_experiencia varchar(20) not null,   -- Años de experiencia profesional
    numero_cedula varchar(20) null,          -- Cédula profesional (opcional)
    orcid varchar(50) null,                  -- Identificador ORCID del investigador
    motivacion text not null,                -- Motivación para colaborar
    estado_solicitud varchar(50) default 'pendiente', -- Estado de la solicitud
    fecha_solicitud datetime default getdate(), -- Fecha de solicitud
    fecha_aprobacion datetime null,          -- Fecha de aprobación/rechazo
    aprobado_por int null,                   -- Administrador que procesó solicitud
    comentarios_admin text null,             -- Comentarios del administrador
    activo bit default 1,                    -- Estado activo del colaborador
    fecha_creacion datetime default getdate(), -- Fecha de creación del registro
    fecha_modificacion datetime default getdate(), -- Última modificación
    foreign key (id_usuario) references Usuarios(id),
    foreign key (aprobado_por) references Usuarios(id)
);

-- =============================================
-- TABLAS DE COMUNICACIÓN
-- =============================================

-- Tabla de contactos y consultas de usuarios hacia la organización
CREATE TABLE Contactos (
    id int identity(1,1) primary key,       -- Identificador único del contacto
    id_usuario int,                          -- Usuario que envía el contacto (opcional)
    asunto varchar(50) not null,             -- Tema o asunto del mensaje
    mensaje text default null,               -- Contenido del mensaje
    fecha_contacto datetime default getdate(), -- Fecha de envío
    respondido bit default 0,               -- Indica si ya fue respondido
    foreign key (id_usuario) references Usuarios(id)
);

-- Tabla de testimonios de usuarios sobre la organización SWAY
CREATE TABLE Testimonios (
    id int identity(1,1) primary key,       -- Identificador único del testimonio
    id_usuario int,                          -- Usuario que proporciona el testimonio
    testimonio text,                         -- Contenido del testimonio
    fecha_creacion datetime default getdate(), -- Fecha de creación
    aprobado bit default 0,                 -- Aprobado para mostrar públicamente
    foreign key (id_usuario) references Usuarios(id)
);

-- =============================================
-- SISTEMA DE DONACIONES
-- =============================================

-- Tabla de donadores y registro de donaciones para conservación marina
CREATE TABLE Donadores (
    id int identity(1,1) primary key,       -- Identificador único de la donación
    id_usuario int,                          -- Usuario donante (puede ser anónimo)
    monto decimal(10, 2) not null,           -- Cantidad donada en pesos mexicanos
    fecha_donacion datetime default getdate(), -- Fecha de la donación
    id_tipoDonacion int default 1,           -- Tipo de donación realizada
    foreign key (id_tipoDonacion) references TipoDonaciones(id),
    foreign key (id_usuario) references Usuarios(id)
);

/*
 * Tabla de información de pago para donaciones
 * IMPORTANTE: Todos los datos sensibles están encriptados por seguridad
 * Esta tabla almacena datos de tarjetas de forma segura
 */
CREATE TABLE Donaciones (
    id int identity(1,1) primary key,       -- Identificador único del pago
    id_donador int,                          -- Referencia a la donación
    numero_tarjeta_encriptado varchar(256),  -- Número de tarjeta encriptado
    fecha_expiracion_encriptada varchar(256), -- Fecha de expiración encriptada
    cvv_encriptado varchar(256),             -- Código CVV encriptado
    id_tipoTarjeta int,                      -- Tipo de tarjeta utilizada
    foreign key (id_tipoTarjeta) references TiposTarjeta(id) on delete cascade,
    foreign key (id_donador) references Donadores(id) on delete cascade
);

-- =============================================
-- CATÁLOGO DE ESPECIES MARINAS
-- =============================================

-- Catálogo de estados de conservación según clasificación IUCN
CREATE TABLE EstadosConservacion (
    id int identity(1,1) primary key,       -- Identificador único del estado
    nombre varchar(50) not null,             -- Nombre del estado (En Peligro, Vulnerable, etc.)
    descripcion text                         -- Descripción detallada del nivel de riesgo
);

-- Catálogo de características físicas y biológicas de especies marinas
CREATE TABLE Caracteristicas (
    id int identity(1,1) primary key,       -- Identificador único de la característica
    tipo_caracteristica varchar(50) not null, -- Tipo (longitud, peso, profundidad, etc.)
    valor varchar(100) not null              -- Valor de la característica
);

-- Catálogo de amenazas que afectan a las especies marinas
CREATE TABLE Amenazas (
    id int identity(1,1) primary key,       -- Identificador único de la amenaza
    nombre varchar(100) not null,            -- Nombre de la amenaza
    descripcion text                         -- Descripción detallada del impacto
);

-- Catálogo de hábitats marinos donde viven las especies
CREATE TABLE Habitats (
    id int identity(1,1) primary key,       -- Identificador único del hábitat
    nombre varchar(100) not null,            -- Nombre del hábitat marino
    descripcion text                         -- Características del ecosistema
);

/*
 * Tabla principal de especies marinas del catálogo SWAY
 * Contiene información científica y de conservación de cada especie
 * registrada en el sistema para monitoreo y educación
 */
CREATE TABLE Especies (
    id int identity(1,1) primary key,       -- Identificador único de la especie
    nombre_comun varchar(100) not null,      -- Nombre popular de la especie
    nombre_cientifico varchar(100) not null, -- Nombre taxonómico binomial
    descripcion text,                        -- Descripción biológica y comportamental
    esperanza_vida int,                      -- Esperanza de vida en años
    poblacion_estimada int,                  -- Estimación poblacional actual
    id_estado_conservacion int,              -- Estado de conservación IUCN
    imagen_url varchar(255),                 -- URL de imagen representativa
    foreign key (id_estado_conservacion) references EstadosConservacion(id)
);

-- Tabla de relación muchos a muchos: especies y sus amenazas específicas
CREATE TABLE EspeciesAmenazas (
    id_especie int,                          -- Referencia a la especie afectada
    id_amenaza int,                          -- Referencia a la amenaza específica
    primary key (id_especie, id_amenaza),
    foreign key (id_especie) references Especies(id),
    foreign key (id_amenaza) references Amenazas(id)
);

-- Tabla de relación muchos a muchos: especies y sus hábitats naturales
CREATE TABLE EspeciesHabitats (
    id_especie int,                          -- Referencia a la especie
    id_habitat int,                          -- Referencia al hábitat donde vive
    primary key (id_especie, id_habitat),
    foreign key (id_especie) references Especies(id),
    foreign key (id_habitat) references Habitats(id)
);

-- Tabla de registro de avistamientos de especies marinas por usuarios
CREATE TABLE Avistamientos (
    id int identity(1,1) primary key,       -- Identificador único del avistamiento
    id_especie int,                          -- Especie avistada
    fecha datetime not null,                 -- Fecha y hora del avistamiento
    latitud decimal(10, 8),                  -- Coordenada de latitud GPS
    longitud decimal(11, 8),                 -- Coordenada de longitud GPS
    notas text,                              -- Observaciones adicionales
    id_usuario int,                          -- Usuario que reporta el avistamiento
    foreign key (id_especie) references Especies(id),
    foreign key (id_usuario) references Usuarios(id)
);

-- Tabla de relación muchos a muchos: especies y sus características físicas
CREATE TABLE EspeciesCaracteristicas (
    id_especie int,                          -- Referencia a la especie
    id_caracteristica int,                   -- Referencia a la característica
    primary key (id_especie, id_caracteristica),
    foreign key (id_especie) references Especies(id),
    foreign key (id_caracteristica) references Caracteristicas(id)
);

-- =============================================
-- SISTEMA DE EVENTOS
-- =============================================

-- Catálogo de tipos de eventos de conservación y educación marina
CREATE TABLE TiposEvento (
    id int identity(1,1) primary key,       -- Identificador único del tipo
    nombre varchar(50) not null,             -- Nombre del tipo de evento
    descripcion text                         -- Descripción del propósito y características
);

/*
 * Tabla principal de eventos de conservación marina
 * Almacena información completa de conferencias, talleres,
 * limpiezas de playa y otros eventos organizados por SWAY
 */
CREATE TABLE Eventos (
    id int identity(1,1) primary key,       -- Identificador único del evento
    titulo varchar(200) not null,            -- Título descriptivo del evento
    descripcion text,                        -- Descripción detallada y objetivos
    fecha_evento date not null,              -- Fecha de realización
    hora_inicio time not null,               -- Hora de inicio
    hora_fin time,                           -- Hora de finalización (opcional)
    id_tipo_evento int,                      -- Tipo de evento (conferencia, taller, etc.)
    id_modalidad int,                        -- Modalidad (presencial, virtual, híbrida)
    id_direccion int,                        -- Ubicación física (si aplica)
    url_evento varchar(255),                 -- Enlace virtual (si aplica)
    capacidad_maxima int,                    -- Número máximo de participantes
    costo decimal(10, 2) default 0,          -- Costo de participación en pesos
    id_organizador int,                      -- Organizador responsable
    id_estatus int,                          -- Estado actual del evento
    fecha_creacion datetime default getdate(), -- Fecha de creación del evento
    foreign key (id_direccion) references Direcciones(id),
    foreign key (id_modalidad) references Modalidades(id),
    foreign key (id_estatus) references Estatus(id),
    foreign key (id_tipo_evento) references TiposEvento(id),
    foreign key (id_organizador) references Organizadores(id)
);

-- Tabla de registro de participantes en eventos
CREATE TABLE RegistrosEvento (
    id int identity(1,1) primary key,       -- Identificador único del registro
    id_evento int,                           -- Evento al que se registra
    id_usuario int,                          -- Usuario registrado
    fecha_registro datetime default getdate(), -- Fecha de inscripción
    asistio bit default 0,                  -- Confirmó asistencia al evento
    foreign key (id_evento) references Eventos(id),
    foreign key (id_usuario) references Usuarios(id),
    unique(id_evento, id_usuario)           -- Un usuario por evento
);

-- =============================================
-- BIBLIOTECA DE RECURSOS
-- =============================================

-- Catálogo de tipos de recursos educativos de la biblioteca
CREATE TABLE TiposRecurso (
    id int identity(1,1) primary key,       -- Identificador único del tipo
    nombre varchar(50) not null,             -- Nombre del tipo de recurso
    descripcion text                         -- Descripción del formato y uso
);

/*
 * Tabla principal de recursos educativos de la biblioteca SWAY
 * Almacena artículos, guías, videos y otros materiales
 * científicos sobre conservación marina
 */
CREATE TABLE RecursosBiblioteca (
    id int identity(1,1) primary key,       -- Identificador único del recurso
    titulo varchar(200) not null,            -- Título del recurso educativo
    descripcion text,                        -- Resumen del contenido
    id_tipo_recurso int,                     -- Tipo de recurso (artículo, video, etc.)
    archivo_url varchar(255),                -- URL del archivo o recurso
    tamaño_mb decimal(10, 2),                -- Tamaño del archivo en megabytes
    formato varchar(20),                     -- Formato del archivo (PDF, MP4, etc.)
    id_autor int,                            -- Autor o creador del recurso
    fecha_publicacion date,                  -- Fecha de publicación original
    numero_paginas int,                      -- Número de páginas (si aplica)
    duracion_minutos int,                    -- Duración en minutos (videos/audio)
    id_idioma int not null default 1,        -- Idioma del recurso
    licencia varchar(100),                   -- Tipo de licencia de uso
    activo bit default 1,                    -- Recurso disponible públicamente
    fecha_agregado datetime default getdate(), -- Fecha de incorporación al sistema
    foreign key (id_tipo_recurso) references TiposRecurso(id),
    foreign key (id_autor) references Autores(id),
    foreign key (id_idioma) references Idiomas(id)
);

-- Tabla de registro de descargas de recursos para estadísticas
CREATE TABLE DescargasRecurso (
    id int identity(1,1) primary key,       -- Identificador único de la descarga
    id_recurso int,                          -- Recurso descargado
    id_usuario int,                          -- Usuario que descargó (opcional)
    fecha_descarga datetime default getdate(), -- Fecha y hora de descarga
    ip_descarga varchar(45),                 -- Dirección IP para analítica
    foreign key (id_recurso) references RecursosBiblioteca(id),
    foreign key (id_usuario) references Usuarios(id)
);

-- Catálogo de etiquetas para categorizar recursos educativos
CREATE TABLE TagsRecurso (
    id int identity(1,1) primary key,       -- Identificador único de la etiqueta
    nombre varchar(50) not null unique       -- Nombre de la etiqueta temática
);

-- Tabla de relación muchos a muchos: recursos y sus etiquetas temáticas
CREATE TABLE RecursosTags (
    id_recurso int,                          -- Referencia al recurso
    id_tag int,                              -- Referencia a la etiqueta
    primary key (id_recurso, id_tag),
    foreign key (id_recurso) references RecursosBiblioteca(id),
    foreign key (id_tag) references TagsRecurso(id)
);

-- =============================================
-- SISTEMA DE TIENDA
-- =============================================

-- Catálogo de categorías para productos sostenibles de la tienda
CREATE TABLE CategoriasProducto (
    id int identity(1,1) primary key,       -- Identificador único de la categoría
    nombre varchar(50) not null,             -- Nombre de la categoría de producto
    descripcion text                         -- Descripción de los productos incluidos
);

/*
 * Tabla principal de productos sostenibles de la tienda SWAY
 * Todos los productos están diseñados para promover
 * la conservación marina y el consumo responsable
 */
CREATE TABLE Productos (
    id int identity(1,1) primary key,       -- Identificador único del producto
    nombre varchar(100) not null,            -- Nombre comercial del producto
    descripcion text,                        -- Descripción detallada y beneficios
    precio decimal(10, 2) not null,          -- Precio en pesos mexicanos
    id_categoria int,                        -- Categoría del producto
    stock int default 0,                     -- Cantidad disponible en inventario
    imagen_url varchar(255),                 -- URL de imagen del producto
    id_material int,                         -- Material principal de fabricación
    dimensiones varchar(100),                -- Medidas del producto
    peso_gramos int,                         -- Peso en gramos
    es_sostenible bit default 1,            -- Certificación de sostenibilidad
    activo bit default 1,                    -- Producto disponible para venta
    fecha_agregado datetime default getdate(), -- Fecha de incorporación al catálogo
    foreign key (id_material) references Materiales(id),
    foreign key (id_categoria) references CategoriasProducto(id)
);

-- Tabla principal de pedidos de la tienda en línea
CREATE TABLE Pedidos (
    id int identity(1,1) primary key,       -- Identificador único del pedido
    id_usuario int,                          -- Cliente que realiza el pedido
    fecha_pedido datetime default getdate(), -- Fecha y hora del pedido
    total decimal(10, 2) not null,           -- Monto total del pedido
    id_estatus int,                          -- Estado actual del pedido
    id_direccion int,                        -- Dirección de envío
    telefono_contacto varchar(20),           -- Teléfono para contacto de entrega
    foreign key (id_usuario) references Usuarios(id),
    foreign key (id_estatus) references Estatus(id),
    foreign key (id_direccion) references Direcciones(id)
);

-- Tabla de detalle de productos incluidos en cada pedido
CREATE TABLE DetallesPedido (
    id int identity(1,1) primary key,       -- Identificador único del detalle
    id_pedido int,                           -- Pedido al que pertenece
    id_producto int,                         -- Producto solicitado
    cantidad int not null,                   -- Cantidad de unidades
    precio_unitario decimal(10, 2) not null, -- Precio por unidad al momento
    subtotal decimal(10, 2) not null,        -- Total por este producto
    foreign key (id_pedido) references Pedidos(id),
    foreign key (id_producto) references Productos(id)
);

/*
 * Tabla de información de pagos de pedidos
 * IMPORTANTE: Los datos de tarjeta deben encriptarse
 * antes de almacenarse por seguridad
 */
CREATE TABLE PagosPedidos (
    id int identity(1,1) primary key,       -- Identificador único del pago
    id_pedido int,                           -- Pedido asociado al pago
    numero_tarjeta varchar(16),              -- Número de tarjeta (debe encriptarse)
    fecha_expiracion varchar(5),             -- Fecha de expiración MM/AA
    cvv varchar(4),                          -- Código de seguridad (debe encriptarse)
    nombre_tarjeta varchar(100),             -- Nombre en la tarjeta
    id_tipoTarjeta int,                      -- Tipo de tarjeta utilizada
    monto decimal(10, 2) not null,           -- Monto del pago procesado
    fecha_pago datetime default getdate(),   -- Fecha y hora del pago
    id_estatus int,                          -- Estado del pago
    foreign key (id_pedido) references Pedidos(id),
    foreign key (id_tipoTarjeta) references TiposTarjeta(id),
    foreign key (id_estatus) references Estatus(id)
);

-- Tabla de reseñas y calificaciones de productos por usuarios
CREATE TABLE ReseñasProducto (
    id int identity(1,1) primary key,       -- Identificador único de la reseña
    id_producto int,                         -- Producto reseñado
    id_usuario int,                          -- Usuario que reseña
    calificacion int check (calificacion between 1 and 5), -- Puntuación de 1 a 5 estrellas
    comentario text,                         -- Comentario sobre el producto
    fecha_reseña datetime default getdate(), -- Fecha de publicación
    foreign key (id_producto) references Productos(id),
    foreign key (id_usuario) references Usuarios(id),
    unique(id_producto, id_usuario)         -- Una reseña por usuario por producto
);

-- =============================================
-- ESPECIALIDADES PARA COLABORADORES
-- =============================================

-- Catálogo especializado de áreas científicas para colaboradores
CREATE TABLE EspecialidadesColaboradores (
    id int identity(1,1) primary key,       -- Identificador único de especialidad
    nombre varchar(100) not null unique,     -- Nombre de la especialidad científica
    descripcion text null,                   -- Descripción del campo de estudio
    activo bit default 1                     -- Especialidad disponible para selección
);

-- Catálogo de grados académicos jerarquizados para colaboradores
CREATE TABLE GradosAcademicos (
    id int identity(1,1) primary key,       -- Identificador único del grado
    nombre varchar(50) not null unique,      -- Nombre del grado académico
    nivel int not null,                      -- Nivel jerárquico (1=Lic, 2=Mtr, 3=Dr, etc.)
    activo bit default 1                     -- Grado disponible para selección
);

-- Catálogo de instituciones académicas para colaboradores científicos
CREATE TABLE InstitucionesColaboradores (
    id int identity(1,1) primary key,       -- Identificador único de institución
    nombre varchar(200) not null,            -- Nombre completo de la institución
    pais varchar(100) null,                  -- País donde se ubica
    tipo varchar(50) null,                   -- Tipo (Universidad, Centro, Instituto, etc.)
    activo bit default 1                     -- Institución disponible para selección
);

-- =============================================
-- VISTA CONSOLIDADA PARA GESTIÓN DE COLABORADORES
-- =============================================

/*
 * Vista que combina información de usuarios y colaboradores
 * para facilitar la administración y consulta de perfiles
 * de colaboradores científicos del sistema SWAY
 */
CREATE VIEW Vista_Colaboradores AS
SELECT c.id,                                 -- ID único del colaborador
    u.nombre + ' ' + u.apellido_paterno + ISNULL(' ' + u.apellido_materno, '') as nombre_colaborador, -- Nombre completo
    u.email,                                 -- Correo electrónico
    c.especialidad,                          -- Área de especialización
    c.grado_academico,                       -- Nivel académico
    c.institucion,                           -- Institución de adscripción
    c.años_experiencia,                      -- Años de experiencia
    c.numero_cedula,                         -- Cédula profesional
    c.orcid,                                 -- Identificador ORCID
    c.estado_solicitud,                      -- Estado de la solicitud
    c.fecha_solicitud,                       -- Fecha de solicitud
    c.fecha_aprobacion,                      -- Fecha de aprobación/rechazo
    c.activo,                                -- Estado activo
    CASE                                     -- Descripción del estado actual
        WHEN c.estado_solicitud = 'aprobada' AND c.activo = 1 THEN 'Colaborador Activo'
        WHEN c.estado_solicitud = 'pendiente' THEN 'Solicitud Pendiente'
        WHEN c.estado_solicitud = 'rechazada' THEN 'Solicitud Rechazada'
        WHEN c.activo = 0 THEN 'Colaborador Inactivo'
        ELSE 'Estado Desconocido'
    END as estado_descripcion
FROM Colaboradores c
    INNER JOIN Usuarios u ON c.id_usuario = u.id;