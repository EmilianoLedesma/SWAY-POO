-- =============================================
-- MODIFICACIONES PARA CARRITO FUNCIONAL
-- =============================================
-- 1. Modificar tabla Usuarios para agregar campos necesarios
ALTER TABLE Usuarios
ADD password_hash VARCHAR(255),
    telefono VARCHAR(20),
    fecha_nacimiento DATE;
-- 2. Modificar tabla Direcciones para relacionar directamente con usuarios
ALTER TABLE Direcciones
ADD id_usuario INT,
    nombre_destinatario VARCHAR(100),
    telefono_contacto VARCHAR(20),
    es_principal BIT DEFAULT 0,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id);
-- 3. Crear tabla PagosPedidos (sin encriptación para proyecto académico)
CREATE TABLE PagosPedidos(
    id INT IDENTITY(1, 1) PRIMARY KEY,
    id_pedido INT,
    numero_tarjeta VARCHAR(16),
    fecha_expiracion VARCHAR(5),
    -- MM/YY
    cvv VARCHAR(4),
    nombre_tarjeta VARCHAR(100),
    id_tipoTarjeta INT,
    monto DECIMAL(10, 2) NOT NULL,
    fecha_pago DATETIME DEFAULT GETDATE(),
    id_estatus INT,
    FOREIGN KEY (id_pedido) REFERENCES Pedidos(id),
    FOREIGN KEY (id_tipoTarjeta) REFERENCES TiposTarjeta(id),
    FOREIGN KEY (id_estatus) REFERENCES Estatus(id)
);
-- 4. Poblar tabla Estatus con estados de pedidos
INSERT INTO Estatus (nombre)
VALUES ('Pendiente'),
    ('Procesando'),
    ('Pagado'),
    ('Preparando'),
    ('Enviado'),
    ('Entregado'),
    ('Cancelado'),
    ('Reembolsado');
-- 5. Poblar tabla TiposTarjeta
INSERT INTO TiposTarjeta (nombre)
VALUES ('Visa'),
    ('Mastercard'),
    ('American Express'),
    ('Débito');
-- 6. Agregar algunos datos de ejemplo para direcciones
INSERT INTO Estados (nombre)
VALUES ('Querétaro'),
    ('Ciudad de México'),
    ('Jalisco'),
    ('Nuevo León');
INSERT INTO Municipios (nombre, id_estado)
VALUES ('Santiago de Querétaro', 1),
    ('El Marqués', 1),
    ('Benito Juárez', 2),
    ('Guadalajara', 3),
    ('Monterrey', 4);
INSERT INTO Colonias (nombre, id_municipio, cp)
VALUES ('Centro', 1, 76000),
    ('Lomas de Casablanca', 1, 76020),
    ('Zacatenco', 1, 76030),
    ('La Pradera', 2, 76240),
    ('Del Valle', 3, 03100);
INSERT INTO Calles (nombre, id_colonia, n_interior, n_exterior)
VALUES ('Avenida 5 de Febrero', 1, NULL, NULL),
    ('Calle Madero', 1, NULL, NULL),
    ('Carretera Estatal 420', 4, NULL, NULL),
    ('Paseo de la Reforma', 5, NULL, NULL),
    ('Avenida Universidad', 3, NULL, NULL);