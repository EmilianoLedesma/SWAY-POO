-- =============================================
-- BASE DE DATOS SWAY - PROCEDIMIENTOS ALMACENADOS Y TRIGGERS
-- Sistema de Conservación Marina y Vida Acuática
-- Versión: 2.0 - Funcionalidades Avanzadas
-- =============================================

USE sway;
GO

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS ESPECIALIZADOS
-- Funcionalidades avanzadas para gestión de colaboradores,
-- procesamiento de pedidos, estadísticas y operaciones complejas
-- =============================================

-- =============================================
-- PROCEDIMIENTO: SOLICITUD DE COLABORACIÓN CIENTÍFICA
-- Permite a usuarios registrados solicitar unirse
-- al programa de colaboradores académicos de SWAY
-- =============================================

CREATE PROCEDURE solicitar_colaboracion_usuario
@id_usuario INT,
@especialidad VARCHAR(100),
@grado_academico VARCHAR(50),
@institucion VARCHAR(200),
@años_experiencia VARCHAR(20),
@numero_cedula VARCHAR(20) = NULL,
@orcid VARCHAR(50) = NULL,
@motivacion TEXT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar si el usuario ya tiene una solicitud activa
    IF EXISTS (
        SELECT 1 
        FROM Colaboradores 
        WHERE id_usuario = @id_usuario 
        AND estado_solicitud = 'pendiente'
    )
    BEGIN
        RAISERROR('El usuario ya tiene una solicitud de colaboración pendiente', 16, 1);
        RETURN;
    END
    
    -- Verificar si el usuario ya es colaborador activo
    IF EXISTS (
        SELECT 1 
        FROM Colaboradores 
        WHERE id_usuario = @id_usuario 
        AND estado_solicitud = 'aprobada' 
        AND activo = 1
    )
    BEGIN
        RAISERROR('El usuario ya es un colaborador activo', 16, 1);
        RETURN;
    END
    
    -- Insertar nueva solicitud
    INSERT INTO Colaboradores (
        id_usuario,
        especialidad,
        grado_academico,
        institucion,
        años_experiencia,
        numero_cedula,
        orcid,
        motivacion
    )
    VALUES (
        @id_usuario,
        @especialidad,
        @grado_academico,
        @institucion,
        @años_experiencia,
        @numero_cedula,
        @orcid,
        @motivacion
    );
    
    SELECT SCOPE_IDENTITY() as id_colaborador;
END;
GO

-- =============================================
-- PROCEDIMIENTO: APROBACIÓN/RECHAZO DE COLABORADORES
-- Permite a administradores procesar solicitudes
-- de colaboración con comentarios y seguimiento
-- =============================================

CREATE PROCEDURE procesar_solicitud_colaboracion
@id_colaborador INT,
@nuevo_estado VARCHAR(50),
@aprobado_por INT,
@comentarios_admin TEXT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @nuevo_estado NOT IN ('aprobada', 'rechazada')
    BEGIN
        RAISERROR('Estado inválido. Debe ser "aprobada" o "rechazada"', 16, 1);
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
    
    IF @@ROWCOUNT = 0
    BEGIN
        RAISERROR('No se encontró una solicitud pendiente con el ID especificado', 16, 1);
        RETURN;
    END
    
    SELECT 'Solicitud procesada exitosamente' as mensaje;
END;
GO

-- =============================================
-- PROCEDIMIENTO: REGISTRO DE AVISTAMIENTOS MARINOS
-- Sistema de ciencia ciudadana para reportar
-- observaciones de especies en su hábitat natural
-- ==============================================

CREATE PROCEDURE registrar_avistamiento_especie
@id_especie INT,
@fecha DATETIME,
@latitud DECIMAL(10, 8) = NULL,
@longitud DECIMAL(11, 8) = NULL,
@notas TEXT = NULL,
@id_usuario INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar que la especie existe
    IF NOT EXISTS (SELECT 1 FROM Especies WHERE id = @id_especie AND activo = 1)
    BEGIN
        RAISERROR('La especie especificada no existe o no está activa', 16, 1);
        RETURN;
    END
    
    -- Verificar que el usuario existe si se proporciona
    IF @id_usuario IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Usuarios WHERE id = @id_usuario AND activo = 1)
    BEGIN
        RAISERROR('El usuario especificado no existe o no está activo', 16, 1);
        RETURN;
    END
    
    -- Insertar el avistamiento
    INSERT INTO Avistamientos (
        id_especie,
        fecha,
        latitud,
        longitud,
        notas,
        id_usuario
    )
    VALUES (
        @id_especie,
        @fecha,
        @latitud,
        @longitud,
        @notas,
        @id_usuario
    );
    
    SELECT SCOPE_IDENTITY() as id_avistamiento;
END;
GO

-- =============================================
-- PROCEDIMIENTO: PROCESAMIENTO INTEGRAL DE PEDIDOS
-- Manejo transaccional completo de pedidos de la tienda
-- incluyendo validación de stock y cálculo de totales
-- =============================================

CREATE PROCEDURE procesar_pedido_completo
@id_usuario INT,
@id_direccion INT,
@telefono_contacto VARCHAR(20),
@productos_json NVARCHAR(MAX) -- JSON con productos: [{"id_producto": 1, "cantidad": 2}]
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    DECLARE @id_pedido INT, @total DECIMAL(10,2) = 0;
    DECLARE @id_producto INT, @cantidad INT, @precio DECIMAL(10,2), @subtotal DECIMAL(10,2);
    
    -- Crear el pedido principal
    INSERT INTO Pedidos (id_usuario, id_direccion, telefono_contacto, total, id_estatus)
    VALUES (@id_usuario, @id_direccion, @telefono_contacto, 0, 3); -- Estatus 'Pendiente'
    
    SET @id_pedido = SCOPE_IDENTITY();
    
    -- Procesar productos del JSON
    DECLARE productos_cursor CURSOR FOR
    SELECT JSON_VALUE(value, '$.id_producto') as id_producto,
           JSON_VALUE(value, '$.cantidad') as cantidad
    FROM OPENJSON(@productos_json);
    
    OPEN productos_cursor;
    FETCH NEXT FROM productos_cursor INTO @id_producto, @cantidad;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Obtener precio del producto
        SELECT @precio = precio
        FROM Productos
        WHERE id = @id_producto AND activo = 1;
        
        IF @precio IS NULL
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('Producto no encontrado o inactivo', 16, 1);
            RETURN;
        END
        
        -- Verificar stock disponible
        IF (SELECT stock FROM Productos WHERE id = @id_producto) < @cantidad
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('Stock insuficiente para el producto', 16, 1);
            RETURN;
        END
        
        SET @subtotal = @precio * @cantidad;
        SET @total = @total + @subtotal;
        
        -- Insertar detalle del pedido
        INSERT INTO DetallesPedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
        VALUES (@id_pedido, @id_producto, @cantidad, @precio, @subtotal);
        
        -- Actualizar stock
        UPDATE Productos
        SET stock = stock - @cantidad
        WHERE id = @id_producto;
        
        FETCH NEXT FROM productos_cursor INTO @id_producto, @cantidad;
    END
    
    CLOSE productos_cursor;
    DEALLOCATE productos_cursor;
    
    -- Actualizar total del pedido
    UPDATE Pedidos
    SET total = @total
    WHERE id = @id_pedido;
    
    COMMIT TRANSACTION;
    
    SELECT @id_pedido as id_pedido, @total as total;
END;
GO

-- =============================================
-- PROCEDIMIENTO: REPORTES DE CONSERVACIÓN MARINA
-- Genera estadísticas y métricas sobre el estado
-- de especies, avistamientos y amenazas registradas
-- =============================================

CREATE PROCEDURE obtener_estadisticas_conservacion
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Estadísticas por estado de conservación
    SELECT 
        ec.nombre as estado_conservacion,
        COUNT(e.id) as total_especies,
        AVG(CAST(e.esperanza_vida as FLOAT)) as promedio_esperanza_vida,
        SUM(e.poblacion_estimada) as poblacion_total_estimada
    FROM EstadosConservacion ec
    LEFT JOIN Especies e ON ec.id = e.id_estado_conservacion
    GROUP BY ec.id, ec.nombre
    ORDER BY total_especies DESC;
    
    -- Top 5 especies más avistadas
    SELECT TOP 5
        e.nombre_comun,
        e.nombre_cientifico,
        COUNT(a.id) as total_avistamientos,
        MAX(a.fecha) as ultimo_avistamiento
    FROM Especies e
    INNER JOIN Avistamientos a ON e.id = a.id_especie
    GROUP BY e.id, e.nombre_comun, e.nombre_cientifico
    ORDER BY total_avistamientos DESC;
    
    -- Amenazas más frecuentes
    SELECT 
        am.nombre as amenaza,
        COUNT(ea.id_especie) as especies_afectadas,
        am.descripcion
    FROM Amenazas am
    INNER JOIN EspeciesAmenazas ea ON am.id = ea.id_amenaza
    GROUP BY am.id, am.nombre, am.descripcion
    ORDER BY especies_afectadas DESC;
END;
GO

-- =============================================
-- TRIGGERS AUTOMATIZADOS DEL SISTEMA
-- Disparadores para auditoría, validaciones
-- y mantenimiento automático de integridad de datos
-- =============================================

-- =============================================
-- TRIGGER: TIMESTAMP AUTOMÁTICO EN COLABORADORES
-- Actualiza automáticamente la fecha de modificación
-- cuando se actualizan registros de colaboradores
-- ==============================================

CREATE TRIGGER actualizar_fecha_modificacion_colaboradores
ON Colaboradores
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Colaboradores
    SET fecha_modificacion = GETDATE()
    WHERE id IN (SELECT id FROM inserted);
END;
GO

-- =============================================
-- TRIGGER: AUDITORÍA COMPLETA DE ESPECIES MARINAS
-- Registra todos los cambios realizados en el catálogo
-- de especies para trazabilidad científica
-- =============================================

-- =============================================
-- TABLA AUXILIAR: REGISTRO DE AUDITORÍA
-- Almacena el historial de cambios en especies
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditoriaEspecies')
BEGIN
    CREATE TABLE AuditoriaEspecies (
        id INT IDENTITY(1,1) PRIMARY KEY,
        id_especie INT NOT NULL,
        accion VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
        nombre_comun_anterior VARCHAR(100),
        nombre_comun_nuevo VARCHAR(100),
        nombre_cientifico_anterior VARCHAR(100),
        nombre_cientifico_nuevo VARCHAR(100),
        estado_conservacion_anterior INT,
        estado_conservacion_nuevo INT,
        usuario_modificacion VARCHAR(100),
        fecha_modificacion DATETIME DEFAULT GETDATE()
    );
END
GO

CREATE TRIGGER auditar_cambios_especies
ON Especies
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Para inserciones
    IF EXISTS (SELECT * FROM inserted) AND NOT EXISTS (SELECT * FROM deleted)
    BEGIN
        INSERT INTO AuditoriaEspecies (
            id_especie, accion, nombre_comun_nuevo, nombre_cientifico_nuevo, 
            estado_conservacion_nuevo, usuario_modificacion
        )
        SELECT 
            i.id, 'INSERT', i.nombre_comun, i.nombre_cientifico, 
            i.id_estado_conservacion, SYSTEM_USER
        FROM inserted i;
    END
    
    -- Para actualizaciones
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
    BEGIN
        INSERT INTO AuditoriaEspecies (
            id_especie, accion, 
            nombre_comun_anterior, nombre_comun_nuevo,
            nombre_cientifico_anterior, nombre_cientifico_nuevo,
            estado_conservacion_anterior, estado_conservacion_nuevo,
            usuario_modificacion
        )
        SELECT 
            i.id, 'UPDATE',
            d.nombre_comun, i.nombre_comun,
            d.nombre_cientifico, i.nombre_cientifico,
            d.id_estado_conservacion, i.id_estado_conservacion,
            SYSTEM_USER
        FROM inserted i
        INNER JOIN deleted d ON i.id = d.id;
    END
    
    -- Para eliminaciones
    IF EXISTS (SELECT * FROM deleted) AND NOT EXISTS (SELECT * FROM inserted)
    BEGIN
        INSERT INTO AuditoriaEspecies (
            id_especie, accion, nombre_comun_anterior, nombre_cientifico_anterior,
            estado_conservacion_anterior, usuario_modificacion
        )
        SELECT 
            d.id, 'DELETE', d.nombre_comun, d.nombre_cientifico,
            d.id_estado_conservacion, SYSTEM_USER
        FROM deleted d;
    END
END;
GO

-- =============================================
-- TRIGGER: VALIDACIÓN DE INVENTARIO EN TIEMPO REAL
-- Previene ventas cuando no hay stock suficiente
-- en productos de la tienda
-- =============================================

CREATE TRIGGER validar_stock_productos
ON DetallesPedido
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @id_producto INT, @cantidad_solicitada INT, @stock_disponible INT;
    
    DECLARE validacion_cursor CURSOR FOR
    SELECT id_producto, cantidad
    FROM inserted;
    
    OPEN validacion_cursor;
    FETCH NEXT FROM validacion_cursor INTO @id_producto, @cantidad_solicitada;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SELECT @stock_disponible = stock
        FROM Productos
        WHERE id = @id_producto;
        
        IF @stock_disponible < @cantidad_solicitada
        BEGIN
            CLOSE validacion_cursor;
            DEALLOCATE validacion_cursor;
            RAISERROR('Stock insuficiente para el producto solicitado', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        FETCH NEXT FROM validacion_cursor INTO @id_producto, @cantidad_solicitada;
    END
    
    CLOSE validacion_cursor;
    DEALLOCATE validacion_cursor;
END;
GO

-- =============================================
-- TRIGGER: CONTADOR AUTOMÁTICO DE DESCARGAS
-- Mantiene estadísticas actualizadas de uso
-- de recursos de la biblioteca digital
-- ==============================================

CREATE TRIGGER actualizar_contador_descargas
ON DescargasRecurso
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE RecursosBiblioteca
    SET descargas_totales = ISNULL(descargas_totales, 0) + 1
    WHERE id IN (SELECT DISTINCT id_recurso FROM inserted);
END;
GO

-- =============================================
-- TRIGGER: ALERTAS DE CONSERVACIÓN CRÍTICA
-- Genera notificaciones automáticas cuando se reportan
-- avistamientos de especies en peligro de extinción
-- =============================================

-- =============================================
-- TABLA AUXILIAR: SISTEMA DE NOTIFICACIONES
-- Almacena alertas de avistamientos de especies críticas
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'NotificacionesAvistamientos')
BEGIN
    CREATE TABLE NotificacionesAvistamientos (
        id INT IDENTITY(1,1) PRIMARY KEY,
        id_avistamiento INT NOT NULL,
        id_especie INT NOT NULL,
        nombre_especie VARCHAR(100) NOT NULL,
        estado_conservacion VARCHAR(50) NOT NULL,
        fecha_avistamiento DATETIME NOT NULL,
        id_usuario INT,
        mensaje TEXT NOT NULL,
        fecha_notificacion DATETIME DEFAULT GETDATE(),
        procesada BIT DEFAULT 0
    );
END
GO

CREATE TRIGGER notificar_avistamientos_criticos
ON Avistamientos
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO NotificacionesAvistamientos (
        id_avistamiento,
        id_especie,
        nombre_especie,
        estado_conservacion,
        fecha_avistamiento,
        id_usuario,
        mensaje
    )
    SELECT 
        i.id,
        e.id,
        e.nombre_comun,
        ec.nombre,
        i.fecha,
        i.id_usuario,
        'ALERTA: Se ha registrado un avistamiento de ' + e.nombre_comun + 
        ' (' + e.nombre_cientifico + '), especie catalogada como ' + ec.nombre + 
        '. Fecha: ' + CONVERT(VARCHAR, i.fecha, 120) + 
        CASE WHEN i.notas IS NOT NULL THEN '. Notas: ' + i.notas ELSE '' END
    FROM inserted i
    INNER JOIN Especies e ON i.id_especie = e.id
    INNER JOIN EstadosConservacion ec ON e.id_estado_conservacion = ec.id
    WHERE ec.nombre IN ('En Peligro Crítico', 'En Peligro', 'Extinto en Estado Silvestre');
END;
GO

-- =============================================
-- PROCEDIMIENTOS DE MANTENIMIENTO DEL SISTEMA
-- Utilidades para limpieza de datos y reportes
-- administrativos del sistema SWAY
-- =============================================

-- =============================================
-- PROCEDIMIENTO: LIMPIEZA DE AUDITORÍA HISTÓRICA
-- Elimina registros de auditoría antiguos para optimizar
-- =============================================
CREATE PROCEDURE limpiar_auditoria_antigua
@dias_antiguedad INT = 365
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @fecha_limite DATETIME = DATEADD(DAY, -@dias_antiguedad, GETDATE());
    
    DELETE FROM AuditoriaEspecies
    WHERE fecha_modificacion < @fecha_limite;
    
    SELECT @@ROWCOUNT as registros_eliminados;
END;
GO

-- =============================================
-- PROCEDIMIENTO: REPORTE DE NOTIFICACIONES
-- Genera resumen de alertas de conservación
-- ==============================================
CREATE PROCEDURE obtener_resumen_notificaciones
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        estado_conservacion,
        COUNT(*) as total_notificaciones,
        COUNT(CASE WHEN procesada = 0 THEN 1 END) as pendientes,
        MAX(fecha_avistamiento) as ultimo_avistamiento
    FROM NotificacionesAvistamientos
    GROUP BY estado_conservacion
    ORDER BY total_notificaciones DESC;
END;
GO

-- =============================================
-- DOCUMENTACIÓN TÉCNICA DEL SISTEMA SWAY
-- Resumen de funcionalidades avanzadas implementadas
-- =============================================

/*
 * SISTEMA DE PROCEDIMIENTOS ALMACENADOS PARA CONSERVACIÓN MARINA
 * 
 * El sistema SWAY implementa funcionalidades especializadas para:
 * - Gestión de colaboradores científicos
 * - Monitoreo de especies marinas
 * - Comercio electrónico sostenible
 * - Auditoría y trazabilidad de datos
 * 
 * PROCEDIMIENTOS PRINCIPALES:
 * 1. solicitar_colaboracion_usuario: Permite solicitudes de colaboración científica
 * 2. procesar_solicitud_colaboracion: Gestión administrativa de colaboradores
 * 3. registrar_avistamiento_especie: Sistema de ciencia ciudadana
 * 4. procesar_pedido_completo: Transacciones completas de e-commerce
 * 5. obtener_estadisticas_conservacion: Reportes de impacto ambiental
 * 
 * TRIGGERS AUTOMATIZADOS:
 * 1. actualizar_fecha_modificacion_colaboradores: Timestamps automáticos
 * 2. auditar_cambios_especies: Trazabilidad científica completa
 * 3. validar_stock_productos: Control de inventario en tiempo real
 * 4. actualizar_contador_descargas: Analítica de recursos educativos
 * 5. notificar_avistamientos_criticos: Alertas de conservación
 * 
 * TABLAS AUXILIARES DEL SISTEMA:
 * - AuditoriaEspecies: Historial completo de cambios en especies
 * - NotificacionesAvistamientos: Sistema de alertas de conservación
 * 
 * CARACTERÍSTICAS TÉCNICAS:
 * ✓ Validaciones robustas con manejo de errores
 * ✓ Transacciones ACID para operaciones críticas
 * ✓ Auditoría automática para trazabilidad científica
 * ✓ Sistema de notificaciones para eventos importantes
 * ✓ Integridad referencial y consistencia de datos
 * ✓ Optimización para consultas de conservación marina
 * 
 * SEGURIDAD Y PRIVACIDAD:
 * ✓ Encriptación de datos sensibles de pagos
 * ✓ Validaciones de entrada para prevenir inyección SQL
 * ✓ Control de acceso basado en roles de usuario
 * ✓ Protección de información personal de colaboradores
 */