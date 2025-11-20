-- =============================================
-- TABLA DE COLABORADORES CIENTÍFICOS - SWAY
-- =============================================
USE sway;
-- Crear tabla de colaboradores
CREATE TABLE Colaboradores (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    id_usuario INT NOT NULL,
    -- Información académica
    especialidad VARCHAR(100) NOT NULL,
    grado_academico VARCHAR(50) NOT NULL,
    institucion VARCHAR(200) NOT NULL,
    anos_experiencia VARCHAR(20) NOT NULL,
    -- Documentación profesional (opcional)
    numero_cedula VARCHAR(20) NULL,
    orcid VARCHAR(50) NULL,
    -- Motivación y estado
    motivacion TEXT NOT NULL,
    estado_solicitud VARCHAR(50) DEFAULT 'pendiente',
    -- pendiente, aprobada, rechazada
    fecha_solicitud DATETIME DEFAULT GETDATE(),
    fecha_aprobacion DATETIME NULL,
    -- Información de aprobación
    aprobado_por INT NULL,
    -- ID del admin que aprobó
    comentarios_admin TEXT NULL,
    -- Estado del colaborador
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME DEFAULT GETDATE(),
    fecha_modificacion DATETIME DEFAULT GETDATE(),
    -- Claves foráneas
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id),
    FOREIGN KEY (aprobado_por) REFERENCES Usuarios(id)
);
-- Crear índices para mejor rendimiento
CREATE INDEX IX_Colaboradores_Usuario ON Colaboradores(id_usuario);
CREATE INDEX IX_Colaboradores_Estado ON Colaboradores(estado_solicitud);
CREATE INDEX IX_Colaboradores_Especialidad ON Colaboradores(especialidad);
CREATE INDEX IX_Colaboradores_Activo ON Colaboradores(activo);
-- Crear tabla de especialidades para normalizar (opcional pero recomendado)
CREATE TABLE EspecialidadesColaboradores (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    activo BIT DEFAULT 1
);
-- Insertar especialidades predefinidas
INSERT INTO EspecialidadesColaboradores (nombre, descripcion)
VALUES (
        'Biología Marina',
        'Estudio de los organismos marinos y sus ecosistemas'
    ),
    (
        'Oceanografía',
        'Estudio de los océanos y sus procesos físicos, químicos y biológicos'
    ),
    (
        'Ictiología',
        'Estudio de los peces y su comportamiento'
    ),
    (
        'Conservación Marina',
        'Estrategias y técnicas para la preservación de ecosistemas marinos'
    ),
    (
        'Ecología Marina',
        'Estudio de las interacciones entre organismos marinos y su ambiente'
    ),
    (
        'Taxonomía Marina',
        'Clasificación y nomenclatura de especies marinas'
    ),
    (
        'Otra especialidad',
        'Otras áreas relacionadas con ciencias marinas'
    );
-- Crear tabla de grados académicos
CREATE TABLE GradosAcademicos (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    nivel INT NOT NULL,
    -- 1=Licenciatura, 2=Maestría, 3=Doctorado, 4=Postdoctorado
    activo BIT DEFAULT 1
);
-- Insertar grados académicos
INSERT INTO GradosAcademicos (nombre, nivel)
VALUES ('Licenciatura', 1),
    ('Maestría', 2),
    ('Doctorado', 3),
    ('Postdoctorado', 4);
-- Crear tabla de instituciones para normalizar (opcional)
CREATE TABLE InstitucionesColaboradores (
    id INT IDENTITY(1, 1) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    pais VARCHAR(100) NULL,
    tipo VARCHAR(50) NULL,
    -- Universidad, Centro de Investigación, etc.
    activo BIT DEFAULT 1
);
-- Crear vista para consultas fáciles de colaboradores
CREATE VIEW Vista_Colaboradores AS
SELECT c.id,
    u.nombre as nombre_colaborador,
    u.email,
    c.especialidad,
    c.grado_academico,
    c.institucion,
    c.anos_experiencia,
    c.numero_cedula,
    c.orcid,
    c.estado_solicitud,
    c.fecha_solicitud,
    c.fecha_aprobacion,
    c.activo,
    CASE
        WHEN c.estado_solicitud = 'aprobada'
        AND c.activo = 1 THEN 'Colaborador Activo'
        WHEN c.estado_solicitud = 'pendiente' THEN 'Solicitud Pendiente'
        WHEN c.estado_solicitud = 'rechazada' THEN 'Solicitud Rechazada'
        WHEN c.activo = 0 THEN 'Colaborador Inactivo'
        ELSE 'Estado Desconocido'
    END as estado_descripcion
FROM Colaboradores c
    INNER JOIN Usuarios u ON c.id_usuario = u.id;
-- Crear procedimiento almacenado para solicitud de colaboración
CREATE PROCEDURE sp_SolicitarColaboracion @id_usuario INT,
@especialidad VARCHAR(100),
@grado_academico VARCHAR(50),
@institucion VARCHAR(200),
@anos_experiencia VARCHAR(20),
@numero_cedula VARCHAR(20) = NULL,
@orcid VARCHAR(50) = NULL,
@motivacion TEXT AS BEGIN
SET NOCOUNT ON;
-- Verificar si el usuario ya tiene una solicitud activa
IF EXISTS (
    SELECT 1
    FROM Colaboradores
    WHERE id_usuario = @id_usuario
        AND estado_solicitud = 'pendiente'
) BEGIN RAISERROR(
    'El usuario ya tiene una solicitud de colaboración pendiente',
    16,
    1
);
RETURN;
END -- Verificar si el usuario ya es colaborador activo
IF EXISTS (
    SELECT 1
    FROM Colaboradores
    WHERE id_usuario = @id_usuario
        AND estado_solicitud = 'aprobada'
        AND activo = 1
) BEGIN RAISERROR('El usuario ya es un colaborador activo', 16, 1);
RETURN;
END -- Insertar nueva solicitud
INSERT INTO Colaboradores (
        id_usuario,
        especialidad,
        grado_academico,
        institucion,
        anos_experiencia,
        numero_cedula,
        orcid,
        motivacion
    )
VALUES (
        @id_usuario,
        @especialidad,
        @grado_academico,
        @institucion,
        @anos_experiencia,
        @numero_cedula,
        @orcid,
        @motivacion
    );
SELECT SCOPE_IDENTITY() as id_colaborador;
END;
-- Crear procedimiento para aprobar/rechazar solicitudes
CREATE PROCEDURE sp_ProcesarSolicitudColaboracion @id_colaborador INT,
@nuevo_estado VARCHAR(50),
-- 'aprobada' o 'rechazada'
@aprobado_por INT,
@comentarios_admin TEXT = NULL AS BEGIN
SET NOCOUNT ON;
IF @nuevo_estado NOT IN ('aprobada', 'rechazada') BEGIN RAISERROR(
    'Estado inválido. Debe ser "aprobada" o "rechazada"',
    16,
    1
);
RETURN;
END
UPDATE Colaboradores
SET estado_solicitud = @nuevo_estado,
    fecha_aprobacion = GETDATE(),
    aprobado_por = @aprobado_por,
    comentarios_admin = @comentarios_admin,
    fecha_modificacion = GETDATE()
WHERE id = @id_colaborador
    AND estado_solicitud = 'pendiente';
IF @@ROWCOUNT = 0 BEGIN RAISERROR(
    'No se encontró una solicitud pendiente con el ID especificado',
    16,
    1
);
RETURN;
END
SELECT 'Solicitud procesada exitosamente' as mensaje;
END;
-- Crear trigger para actualizar fecha de modificación
CREATE TRIGGER tr_Colaboradores_Update ON Colaboradores
AFTER
UPDATE AS BEGIN
SET NOCOUNT ON;
UPDATE Colaboradores
SET fecha_modificacion = GETDATE()
WHERE id IN (
        SELECT id
        FROM inserted
    );
END;
-- Comentarios sobre la estructura
/*
 NOTAS SOBRE LA TABLA COLABORADORES:
 
 1. RELACIÓN CON USUARIOS:
 - Se relaciona con la tabla Usuarios existente
 - Un usuario puede tener múltiples solicitudes (histórico)
 - Solo puede tener una solicitud pendiente o aprobada activa
 
 2. CAMPOS PRINCIPALES:
 - Todos los campos del formulario de registro están incluidos
 - especialidad: Área de experticia del colaborador
 - grado_academico: Nivel académico (Licenciatura, Maestría, etc.)
 - institucion: Universidad o centro de investigación
 - anos_experiencia: Rango de experiencia
 - numero_cedula: Opcional, para profesionales con cédula
 - orcid: Opcional, identificador académico internacional
 - motivacion: Texto explicativo del colaborador
 
 3. SISTEMA DE APROBACIÓN:
 - estado_solicitud: pendiente, aprobada, rechazada
 - fecha_solicitud: Cuando se envió la solicitud
 - fecha_aprobacion: Cuando se procesó
 - aprobado_por: Admin que procesó la solicitud
 - comentarios_admin: Feedback del admin
 
 4. CONTROL DE ESTADO:
 - activo: Para desactivar colaboradores sin eliminar historial
 - fechas de auditoría para seguimiento
 
 5. PROCEDIMIENTOS INCLUIDOS:
 - sp_SolicitarColaboracion: Para nuevas solicitudes
 - sp_ProcesarSolicitudColaboracion: Para aprobar/rechazar
 - Vista_Colaboradores: Para consultas fáciles
 
 6. SEGURIDAD:
 - Validaciones en procedimientos almacenados
 - Índices para optimizar consultas
 - Trigger para auditoría automática
 */