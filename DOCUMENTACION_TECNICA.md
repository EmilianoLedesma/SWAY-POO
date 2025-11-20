# SWAY - Documentación Técnica Completa del Stack Tecnológico

## Información General del Proyecto

**SWAY** (Sistema Web de Apoyo a la Vida Acuática) es una plataforma web integral desarrollada para la conservación marina y protección de ecosistemas acuáticos. La plataforma combina múltiples módulos interconectados:

- **Portal de Colaboradores Científicos**: Gestión de especies marinas, registro de avistamientos, investigación colaborativa
- **E-commerce Sustentable**: Tienda de productos eco-friendly con sistema de donaciones integrado
- **Gestión de Eventos**: Organización de conferencias, talleres, expediciones y webinars sobre conservación marina
- **Biblioteca Digital**: Repositorio de recursos educativos, investigaciones y documentación científica
- **Sistema de Donaciones**: Plataforma para contribuciones económicas a proyectos de conservación
- **Portal Público**: Información educativa y sensibilización sobre conservación marina

### **Objetivos del Proyecto**
1. **Científicos**: Facilitar la investigación colaborativa y el intercambio de datos sobre especies marinas
2. **Comerciales**: Generar fondos sostenibles através de la venta de productos eco-friendly
3. **Educativos**: Difundir conocimiento sobre conservación marina y biodiversidad acuática
4. **Comunitarios**: Crear una red de colaboradores, donadores y activistas comprometidos
5. **Tecnológicos**: Demostrar capacidades de desarrollo full-stack con arquitectura escalable

---

## Stack Tecnológico Principal

### **Backend - Python/Flask Stack**
- **Framework Principal**: Flask 2.x (Python 3.8+)
  - Microframework minimalista pero extensible
  - Arquitectura modular con blueprints conceptuales
  - Sistema de ruteo flexible con decoradores
  - Integración nativa con Jinja2 para templating
- **Base de Datos**: Microsoft SQL Server
  - Arquitectura normalizada hasta 3NF (Third Normal Form)
  - 25+ tablas interconectadas con integridad referencial
  - Índices optimizados para consultas frecuentes
  - Stored procedures para operaciones complejas
- **Conectividad de Datos**: pyodbc
  - Driver ODBC nativo para SQL Server
  - Conexiones parametrizadas (prevención SQL injection)
  - Pool de conexiones implícito
  - Manejo de transacciones explícitas
- **Gestión de Sesiones**: Flask Sessions
  - Secret key personalizada para seguridad
  - Sesiones duales separadas (tienda vs colaboradores)
  - Almacenamiento server-side en memoria
  - Cookies httpOnly para mayor seguridad
- **Cross-Origin Resource Sharing**: Flask-CORS
  - Configuración permisiva para desarrollo
  - Headers personalizados para caché control
  - Soporte para peticiones preflight OPTIONS

### **Frontend - Modern Web Stack**
- **Arquitectura Base**: Progressive Web Application (PWA) concepts
  - HTML5 semántico con accesibilidad WCAG 2.1
  - CSS3 con metodología BEM para nomenclatura
  - JavaScript ES6+ vanilla (sin frameworks pesados)
  - Diseño mobile-first responsive
- **Framework UI**: Bootstrap 5.2.x
  - Grid system de 12 columnas
  - Componentes pre-diseñados (modales, navbars, cards)
  - Utilidades de espaciado y tipografía
  - Customización through CSS variables
- **Iconografía y Assets**: 
  - Bootstrap Icons (1000+ iconos vectoriales)
  - Imágenes optimizadas en formato WebP/PNG
  - Sprites CSS para iconos frecuentes
  - Lazy loading para recursos gráficos
- **Tipografías**: Google Fonts API
  - Open Sans: Legibilidad en textos largos
  - Poppins: Headers y elementos destacados
  - Jost: Texto decorativo y branding
  - Carga asíncrona para rendimiento optimizado
- **Patrón de Arquitectura**: Module Pattern + Observer
  - Módulos JavaScript independientes por funcionalidad
  - Event-driven communication entre componentes
  - State management centralizado en localStorage
  - API client con fetch() y async/await

### **Base de Datos - Arquitectura Empresarial**
- **Motor de Base de Datos**: Microsoft SQL Server 2019+
  - Motor relacional robusto para aplicaciones empresariales
  - Soporte para transacciones ACID completas
  - Capacidades de backup y recovery automáticas
  - Optimizador de consultas inteligente
- **Diseño de Esquemas**: Normalización Avanzada
  - **1NF**: Eliminación de grupos repetitivos
  - **2NF**: Eliminación de dependencias parciales
  - **3NF**: Eliminación de dependencias transitivas
  - Índices compuestos para consultas complejas
- **Estructura de Tablas**: 25+ entidades especializadas
  - **Core Entities**: Usuarios, Colaboradores, Productos, Especies
  - **Junction Tables**: Para relaciones many-to-many
  - **Lookup Tables**: Estados, Categorías, Tipos
  - **Audit Tables**: Para trazabilidad de cambios
- **Procedimientos Almacenados**: Business Logic en BD
  - Validaciones de integridad complejas
  - Operaciones transaccionales críticas
  - Reportes y estadísticas automatizadas
  - Triggers para auditoría automática

---

## Preguntas y Respuestas sobre Funcionalidades Específicas

### **¿Cómo funciona el sistema de autenticación dual avanzado?**

SWAY implementa un **sistema de autenticación de sesiones duales completamente independientes** que permite a los usuarios mantener sesiones simultáneas como cliente de tienda y como colaborador científico sin interferencias.

#### **Arquitectura de Sesiones Separadas**

**Sesión de Tienda (Cliente E-commerce):**
```python
# Claves de sesión específicas para tienda
session_keys = {
    'tienda_user_id': int,      # ID único del usuario
    'tienda_user_name': str,    # Nombre completo construido
    'tienda_user_email': str    # Email para comunicaciones
}

# Endpoints específicos de tienda
@app.route('/api/user/login', methods=['POST'])
def login_tienda():
    # Validación de credenciales
    # Construcción de nombre completo sin duplicación
    # Creación de sesión específica de tienda
    session['tienda_user_id'] = user.id
    session['tienda_user_name'] = construir_nombre_completo(...)
    session['tienda_user_email'] = user.email
```

**Sesión de Colaboradores (Portal Científico):**
```python
# Claves de sesión específicas para colaboradores
session_keys = {
    'colab_user_id': int,           # ID del usuario base
    'colab_user_name': str,         # Nombre con prefijo "Dr."
    'colab_user_email': str,        # Email institucional
    'colab_colaborador_id': int,    # ID específico de colaborador
    'colab_user_type': str          # Tipo fijo: 'colaborador'
}

# Validación especializada para colaboradores
@app.route('/api/colaboradores/login', methods=['POST'])
def login_colaborador():
    # Verificación de estado de solicitud aprobada
    # Validación de permisos de colaborador activo
    # Construcción de nombre con prefijo académico
    session['colab_user_name'] = construir_nombre_completo(nombre, apellido_p, apellido_m, "Dr. ")
```

#### **Función Helper Avanzada para Nombres**
```python
def construir_nombre_completo(nombre, apellido_paterno, apellido_materno, prefijo=""):
    """
    Construye nombres completos evitando duplicación de apellidos.
    Problema resuelto: Evitar "Dr. Diego Jiménez Vargas Jiménez Vargas"
    
    Casos manejados:
    1. Nombre ya contiene apellidos -> usar solo nombre base
    2. Apellidos separados -> construir nombre completo
    3. Apellidos faltantes -> manejar graciosamente
    """
    if not nombre:
        return "Usuario"
    
    # Detectar si apellidos ya están en el nombre
    if apellido_paterno and apellido_paterno in nombre:
        return f"{prefijo}{nombre}".strip()
    else:
        apellidos = [a for a in [apellido_paterno, apellido_materno] if a]
        if apellidos:
            return f"{prefijo}{nombre} {' '.join(apellidos)}".strip()
        else:
            return f"{prefijo}{nombre}".strip()
```

#### **Sistema de Logout Granular**
```python
@app.route('/api/user/logout', methods=['POST'])
def logout_tienda():
    """Logout específico de tienda - preserva sesión de colaborador"""
    keys_to_remove = ['tienda_user_id', 'tienda_user_name', 'tienda_user_email']
    for key in keys_to_remove:
        session.pop(key, None)
    return jsonify({'success': True, 'message': 'Sesión de tienda cerrada'})

@app.route('/api/colaboradores/logout', methods=['POST'])
def logout_colaborador():
    """Logout específico de colaborador - preserva sesión de tienda"""
    keys_to_remove = ['colab_user_id', 'colab_user_name', 'colab_user_email', 
                      'colab_colaborador_id', 'colab_user_type']
    for key in keys_to_remove:
        session.pop(key, None)
    return jsonify({'success': True, 'message': 'Sesión de colaborador cerrada'})
```

#### **Verificación de Estado de Sesiones**
```python
# Middleware de verificación para endpoints de tienda
def require_tienda_auth():
    if 'tienda_user_id' not in session:
        return jsonify({'error': 'Usuario no autenticado'}), 401
    return session['tienda_user_id']

# Middleware de verificación para endpoints de colaboradores
def require_colaborador_auth():
    if 'colab_user_email' not in session:
        return jsonify({'error': 'Colaborador no autenticado'}), 401
    return session['colab_user_email']
```

#### **Casos de Uso del Sistema Dual**
1. **Usuario Científico + Cliente**: Dr. María puede estar logueada como colaboradora registrando especies Y como cliente comprando productos
2. **Administrador de Evento + Comprador**: Un organizador puede gestionar eventos mientras compra materiales para su evento
3. **Investigador Invitado**: Puede acceder al portal científico sin necesidad de crear cuenta de tienda
4. **Cliente Premium**: Puede comprar productos sin interferir con sesiones científicas de otros miembros de su institución

### **¿Cómo se estructura la base de datos empresarial?**

SWAY utiliza una **arquitectura de base de datos altamente normalizada** diseñada para escalabilidad, integridad de datos y rendimiento optimizado. La estructura sigue principios de diseño empresarial con 25+ tablas interconectadas.

#### **Módulos Principales de Datos**

**1. Sistema de Direcciones Geográficas (Normalizado)**
```sql
-- Jerarquía geográfica completa de México
CREATE TABLE Estados (
    id int identity(1,1) primary key,
    nombre varchar(254) not null,        -- Ej: "Querétaro", "Ciudad de México"
    codigo_postal_base varchar(5)        -- Código base del estado
);

CREATE TABLE Municipios (
    id int identity(1,1) primary key,
    nombre varchar(254) not null,        -- Ej: "Santiago de Querétaro"
    id_estado int not null,
    FOREIGN KEY (id_estado) REFERENCES Estados(id)
);

CREATE TABLE Colonias (
    id int identity(1,1) primary key,
    nombre varchar(254) not null,        -- Ej: "Centro Histórico"
    codigo_postal varchar(5) not null,   -- Código postal específico
    id_municipio int not null,
    FOREIGN KEY (id_municipio) REFERENCES Municipios(id)
);

CREATE TABLE Calles (
    id int identity(1,1) primary key,
    nombre varchar(254) not null,        -- Ej: "5 de Mayo", "Av. Universidad"
    id_colonia int not null,
    FOREIGN KEY (id_colonia) REFERENCES Colonias(id)
);

CREATE TABLE Direcciones (
    id int identity(1,1) primary key,
    id_calle int not null,
    numero_exterior varchar(10),         -- Número de casa/edificio
    numero_interior varchar(10),         -- Apartamento/suite (opcional)
    referencias varchar(500),            -- Referencias adicionales
    FOREIGN KEY (id_calle) REFERENCES Calles(id)
);
```

**2. Sistema de Usuarios y Roles (Role-Based Access Control)**
```sql
-- Tabla central de usuarios (Single Source of Truth)
CREATE TABLE Usuarios (
    id int identity(1,1) primary key,
    nombre varchar(100) not null,
    apellido_paterno varchar(100),
    apellido_materno varchar(100),
    email varchar(254) unique not null,
    password_hash varchar(254),          -- Hash seguro de contraseña
    telefono varchar(15),
    fecha_nacimiento date,
    id_direccion int,                    -- Dirección principal del usuario
    suscrito_newsletter bit default 0,
    activo bit default 1,               -- Soft delete
    fecha_registro datetime2 default GETDATE(),
    FOREIGN KEY (id_direccion) REFERENCES Direcciones(id)
);

-- Roles especializados con herencia de usuarios
CREATE TABLE Colaboradores (
    id int identity(1,1) primary key,
    id_usuario int not null unique,      -- Relación 1:1 con Usuarios
    especialidad varchar(100),           -- Ej: "Biología Marina", "Oceanografía"
    grado_academico varchar(50),         -- Ej: "Doctorado", "Maestría"
    institucion varchar(200),            -- Institución de afiliación
    años_experiencia int,
    numero_cedula varchar(20),           -- Cédula profesional
    orcid varchar(50),                   -- ORCID ID para investigadores
    estado_solicitud varchar(20) default 'pendiente', -- 'pendiente', 'aprobada', 'rechazada'
    activo bit default 1,
    fecha_solicitud datetime2 default GETDATE(),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);

CREATE TABLE Organizadores (
    id int identity(1,1) primary key,
    id_usuario int not null unique,
    id_organizacion int not null,
    cargo varchar(100),                  -- Cargo en la organización
    fecha_inicio date,
    activo bit default 1,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id),
    FOREIGN KEY (id_organizacion) REFERENCES Organizaciones(id)
);

CREATE TABLE Administradores (
    id int identity(1,1) primary key,
    id_usuario int not null unique,
    nivel_acceso int not null,           -- 1=básico, 2=avanzado, 3=super
    permisos_especiales text,            -- JSON con permisos específicos
    fecha_nombramiento datetime2 default GETDATE(),
    activo bit default 1,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id)
);
```

**3. Sistema de E-commerce Completo**
```sql
-- Catálogo de productos con inventario
CREATE TABLE Productos (
    id int identity(1,1) primary key,
    nombre varchar(200) not null,
    descripcion text,
    precio decimal(10,2) not null,
    id_categoria int not null,
    stock_disponible int default 0,
    stock_minimo int default 5,         -- Alerta de restock
    sku varchar(50) unique,             -- Stock Keeping Unit
    peso decimal(8,2),                  -- Para cálculo de envío
    dimensiones varchar(50),            -- "10x15x5 cm"
    imagen_url varchar(500),
    activo bit default 1,
    fecha_creacion datetime2 default GETDATE(),
    FOREIGN KEY (id_categoria) REFERENCES CategoriasProducto(id)
);

-- Sistema de carrito y pedidos
CREATE TABLE CarritoCompras (
    id int identity(1,1) primary key,
    id_usuario int not null,
    id_producto int not null,
    cantidad int not null,
    precio_unitario decimal(10,2),      -- Precio al momento de agregar
    fecha_agregado datetime2 default GETDATE(),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id),
    FOREIGN KEY (id_producto) REFERENCES Productos(id),
    UNIQUE (id_usuario, id_producto)    -- Un producto por usuario en carrito
);

CREATE TABLE Pedidos (
    id int identity(1,1) primary key,
    id_usuario int not null,
    numero_pedido varchar(20) unique,   -- Número de seguimiento
    subtotal decimal(10,2) not null,
    impuestos decimal(10,2) default 0,
    costo_envio decimal(10,2) default 0,
    total decimal(10,2) not null,
    id_direccion_envio int not null,
    estado varchar(20) default 'pendiente', -- 'pendiente', 'procesando', 'enviado', 'entregado'
    metodo_pago varchar(50),
    fecha_pedido datetime2 default GETDATE(),
    fecha_estimada_entrega date,
    notas_especiales text,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id),
    FOREIGN KEY (id_direccion_envio) REFERENCES Direcciones(id)
);

CREATE TABLE DetallesPedido (
    id int identity(1,1) primary key,
    id_pedido int not null,
    id_producto int not null,
    cantidad int not null,
    precio_unitario decimal(10,2) not null, -- Precio histórico
    subtotal decimal(10,2) not null,
    FOREIGN KEY (id_pedido) REFERENCES Pedidos(id),
    FOREIGN KEY (id_producto) REFERENCES Productos(id)
);
```

**4. Sistema Científico de Especies Marinas**
```sql
-- Especies marinas con clasificación científica completa
CREATE TABLE EspeciesMarinas (
    id int identity(1,1) primary key,
    nombre_comun varchar(100) not null,
    nombre_cientifico varchar(100) not null unique,
    reino varchar(50) default 'Animalia',
    filo varchar(50),                    -- Ej: "Chordata"
    clase varchar(50),                   -- Ej: "Actinopterygii"
    orden varchar(50),                   -- Ej: "Perciformes"
    familia varchar(50),                 -- Ej: "Scombridae"
    genero varchar(50),                  -- Ej: "Thunnus"
    especie varchar(50),                 -- Ej: "albacares"
    descripcion text,
    habitat_principal varchar(200),
    profundidad_min int,                 -- Metros
    profundidad_max int,
    temperatura_min decimal(4,1),        -- Celsius
    temperatura_max decimal(4,1),
    distribucion_geografica text,
    esperanza_vida int,                  -- Años
    longitud_max decimal(6,2),          -- Centímetros
    peso_max decimal(8,2),              -- Kilogramos
    id_estado_conservacion int not null,
    id_colaborador_registrante int not null, -- Quien registró la especie
    imagen_url varchar(500),
    fecha_registro datetime2 default GETDATE(),
    activo bit default 1,
    FOREIGN KEY (id_estado_conservacion) REFERENCES EstadosConservacion(id),
    FOREIGN KEY (id_colaborador_registrante) REFERENCES Colaboradores(id)
);

-- Estados de conservación IUCN
CREATE TABLE EstadosConservacion (
    id int identity(1,1) primary key,
    codigo varchar(5) not null unique,   -- 'LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX'
    nombre varchar(50) not null,         -- 'Least Concern', 'Vulnerable', etc.
    descripcion text,
    color_codigo varchar(7),             -- Color hex para UI: '#008000'
    nivel_prioridad int                  -- 1=baja, 5=crítica
);

-- Relaciones many-to-many para amenazas y hábitats
CREATE TABLE EspeciesAmenazas (
    id int identity(1,1) primary key,
    id_especie int not null,
    id_amenaza int not null,
    nivel_impacto varchar(20),           -- 'bajo', 'medio', 'alto', 'crítico'
    notas text,
    FOREIGN KEY (id_especie) REFERENCES EspeciesMarinas(id),
    FOREIGN KEY (id_amenaza) REFERENCES TiposAmenaza(id),
    UNIQUE (id_especie, id_amenaza)
);

CREATE TABLE EspeciesHabitats (
    id int identity(1,1) primary key,
    id_especie int not null,
    id_habitat int not null,
    preferencia varchar(20),             -- 'primario', 'secundario', 'ocasional'
    FOREIGN KEY (id_especie) REFERENCES EspeciesMarinas(id),
    FOREIGN KEY (id_habitat) REFERENCES TiposHabitat(id),
    UNIQUE (id_especie, id_habitat)
);
```

**5. Sistema de Avistamientos Científicos**
```sql
CREATE TABLE AvistamientosEspecies (
    id int identity(1,1) primary key,
    id_especie int not null,
    id_colaborador int not null,
    latitud decimal(10,8),               -- Coordenadas GPS precisas
    longitud decimal(11,8),
    profundidad decimal(6,2),            -- Metros
    temperatura_agua decimal(4,1),       -- Celsius
    cantidad_observada int,
    comportamiento_observado text,
    calidad_avistamiento varchar(20),    -- 'confirmado', 'probable', 'posible'
    equipo_utilizado varchar(200),       -- Cámara, sonar, etc.
    condiciones_climaticas varchar(100),
    visibilidad_agua varchar(20),        -- 'excelente', 'buena', 'regular', 'pobre'
    fotos_evidencia text,                -- URLs de fotos separadas por comas
    notas_adicionales text,
    fecha_avistamiento datetime2 not null,
    fecha_registro datetime2 default GETDATE(),
    validado bit default 0,              -- Validación por expertos
    id_validador int,                    -- Colaborador que validó
    FOREIGN KEY (id_especie) REFERENCES EspeciesMarinas(id),
    FOREIGN KEY (id_colaborador) REFERENCES Colaboradores(id),
    FOREIGN KEY (id_validador) REFERENCES Colaboradores(id)
);
```

#### **Índices de Rendimiento Optimizados**
```sql
-- Índices compuestos para consultas frecuentes
CREATE INDEX IX_Especies_Conservacion_Activo ON EspeciesMarinas (id_estado_conservacion, activo);
CREATE INDEX IX_Avistamientos_Fecha_Colaborador ON AvistamientosEspecies (fecha_avistamiento, id_colaborador);
CREATE INDEX IX_Productos_Categoria_Activo ON Productos (id_categoria, activo, stock_disponible);
CREATE INDEX IX_Pedidos_Usuario_Estado ON Pedidos (id_usuario, estado, fecha_pedido);

-- Índices para búsquedas de texto
CREATE INDEX IX_Especies_Nombre_Cientifico ON EspeciesMarinas (nombre_cientifico);
CREATE INDEX IX_Especies_Nombre_Comun ON EspeciesMarinas (nombre_comun);
```

#### **Triggers de Auditoría y Business Logic**
```sql
-- Trigger para actualizar stock después de pedido
CREATE TRIGGER TR_ActualizarStock_DespuesPedido
ON DetallesPedido
AFTER INSERT
AS
BEGIN
    UPDATE Productos 
    SET stock_disponible = stock_disponible - i.cantidad
    FROM Productos p
    INNER JOIN inserted i ON p.id = i.id_producto;
END;

-- Trigger para generar número de pedido automático
CREATE TRIGGER TR_GenerarNumeroPedido
ON Pedidos
AFTER INSERT
AS
BEGIN
    UPDATE Pedidos 
    SET numero_pedido = 'SW' + FORMAT(GETDATE(), 'yyyyMM') + FORMAT(id, '00000')
    FROM inserted i
    WHERE Pedidos.id = i.id;
END;
```

#### **Procedimientos Almacenados para Operaciones Complejas**
```sql
-- Procedimiento para calcular estadísticas de conservación
CREATE PROCEDURE sp_ObtenerEstadisticasConservacion
AS
BEGIN
    SELECT 
        ec.nombre as estado_conservacion,
        COUNT(em.id) as cantidad_especies,
        AVG(em.esperanza_vida) as promedio_esperanza_vida,
        COUNT(av.id) as total_avistamientos
    FROM EstadosConservacion ec
    LEFT JOIN EspeciesMarinas em ON ec.id = em.id_estado_conservacion
    LEFT JOIN AvistamientosEspecies av ON em.id = av.id_especie
    WHERE em.activo = 1
    GROUP BY ec.id, ec.nombre
    ORDER BY cantidad_especies DESC;
END;
```

#### **Ventajas de esta Arquitectura**
1. **Escalabilidad**: Diseño normalizado permite crecimiento sin reestructuración
2. **Integridad**: Claves foráneas y constraints garantizan consistencia
3. **Rendimiento**: Índices optimizados para consultas frecuentes
4. **Auditoría**: Triggers automáticos para trazabilidad
5. **Flexibilidad**: Estructura modular permite agregar funcionalidades
6. **Estándares**: Sigue convenciones de nomenclatura SQL Server

### **¿Cómo funciona el sistema de gestión de especies marinas?**

**Componentes Principales:**
1. **Modelo de Datos**: Tabla `EspeciesMarinas` con 20+ campos descriptivos
2. **Estados de Conservación**: Integración con clasificaciones IUCN
3. **Amenazas y Hábitats**: Relaciones many-to-many para clasificación completa
4. **Sistema CRUD**: Crear, leer, actualizar, eliminar especies

**Funcionalidades de Colaboradores:**
- **Crear Especies**: Formulario con validación frontend y backend
- **Editar Especies**: Modal con carga dinámica de datos existentes
- **Eliminar Especies**: Confirmación con nombre de especie para seguridad
- **Gestión de Avistamientos**: Registro de observaciones con geolocalización

**Implementación Frontend:**
```javascript
// Carga dinámica de especies con paginación
async function loadEspecies() {
    const response = await fetch('/api/especies/colaborador');
    const data = await response.json();
    if (data.success) {
        displayEspecies(data.especies);
    }
}

// Modal dinámico para edición
function openEspecieModal(especieId = null) {
    if (especieId) {
        // Cargar datos existentes
        fetch(`/api/especies/${especieId}`)
            .then(response => response.json())
            .then(data => populateModal(data.especie));
    }
    showModal('especieModal');
}
```

### **¿Cómo funciona el sistema de carrito y pedidos?**

**Arquitectura del Carrito:**
1. **Almacenamiento**: LocalStorage del navegador para persistencia
2. **Sincronización**: API endpoints para validación de inventario
3. **Checkout**: Proceso de múltiples pasos con validación

**Flujo de Pedido:**
```javascript
// 1. Agregar al carrito
function addToCart(productId, quantity) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ id: productId, quantity: quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
}

// 2. Proceso de checkout
async function processCheckout(orderData) {
    const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    });
    return response.json();
}
```

**Backend - Procesamiento de Pedidos:**
```python
@app.route('/api/pedidos', methods=['POST'])
def crear_pedido():
    # 1. Validar usuario autenticado
    if 'tienda_user_id' not in session:
        return jsonify({'error': 'Usuario no autenticado'}), 401
    
    # 2. Validar inventario
    # 3. Calcular totales
    # 4. Crear registro de pedido
    # 5. Actualizar inventario
    # 6. Limpiar carrito
```

### **¿Cómo se implementa la gestión de eventos?**

**Componentes del Sistema:**
1. **Tipos de Evento**: Conferencias, talleres, expediciones, webinars
2. **Modalidades**: Presencial, virtual, híbrida
3. **Registro**: Sistema de inscripciones con capacidad máxima
4. **Organizadores**: Role-based access control

**Creación de Eventos:**
```python
@app.route('/api/eventos', methods=['POST'])
def crear_evento():
    # Validaciones:
    # - Usuario autenticado
    # - Datos requeridos
    # - Fechas válidas
    # - Capacidad máxima
    
    # Inserción en BD con manejo de direcciones
    cursor.execute("""
        INSERT INTO Eventos (titulo, descripcion, fecha_inicio, fecha_fin, 
                           id_organizador, id_tipo_evento, id_modalidad, 
                           capacidad_maxima, costo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (titulo, descripcion, fecha_inicio, fecha_fin, organizador_id, 
          tipo_evento, modalidad, capacidad, costo))
```

### **¿Cómo funciona el sistema de biblioteca digital?**

**Estructura de Contenido:**
1. **Recursos**: PDFs, videos, artículos, investigaciones
2. **Categorización**: Por tipo, tema, nivel académico
3. **Autores**: Sistema de atribución y biografías
4. **Búsqueda**: Filtros por múltiples criterios

**Gestión de Archivos:**
- **Upload**: Directorio `/uploads/` con validación de tipos
- **Metadatos**: Almacenamiento de información descriptiva
- **Control de Acceso**: Algunos recursos requieren registro

### **¿Cómo se maneja la seguridad de la aplicación?**

**Medidas de Seguridad Implementadas:**

1. **Autenticación**:
   - Hashing de contraseñas (implementación básica)
   - Sesiones con secret key
   - Validación de estado de usuario (activo/inactivo)

2. **Autorización**:
   - Role-based access control
   - Verificación de permisos por endpoint
   - Separación de sesiones por tipo de usuario

3. **Validación de Entrada**:
   - Sanitización de datos en formularios
   - Validación de tipos de archivo
   - Límites de longitud en campos

4. **Base de Datos**:
   - Consultas parametrizadas (prevención SQL injection)
   - Transacciones para operaciones críticas
   - Claves foráneas para integridad referencial

**Ejemplo de Validación:**
```python
# Validación de entrada en endpoint
if not email or '@' not in email:
    return jsonify({'error': 'Email inválido'}), 400

# Consulta parametrizada
cursor.execute("SELECT * FROM Usuarios WHERE email = ?", (email,))
```

### **¿Cómo se estructura el frontend?**

**Arquitectura de Archivos:**
```
assets/
├── css/
│   ├── main.css          # Estilos globales
│   ├── tienda.css        # Estilos específicos de tienda
│   ├── especies.css      # Estilos del portal de especies
│   └── eventos.css       # Estilos de gestión de eventos
├── js/
│   ├── main.js           # Funcionalidades globales
│   ├── tienda.js         # Lógica de carrito y productos
│   ├── especies.js       # CRUD de especies marinas
│   └── validaciones.js   # Validación de formularios
└── img/                  # Recursos gráficos organizados
```

**Patrón de Desarrollo:**
1. **Modularidad**: Cada sección tiene sus propios CSS/JS
2. **Responsividad**: Bootstrap Grid System + CSS personalizado
3. **Interactividad**: JavaScript vanilla con fetch API
4. **Componentes Reutilizables**: Modales, formularios, tablas

### **¿Cómo se implementa la comunicación cliente-servidor?**

**API REST Endpoints:**

**Autenticación:**
- `POST /api/user/login` - Login tienda
- `POST /api/colaboradores/login` - Login colaboradores
- `GET /api/user/status` - Estado sesión tienda
- `GET /api/colaboradores/status` - Estado sesión colaboradores

**Gestión de Especies:**
- `GET /api/especies/colaborador` - Listar especies del colaborador
- `POST /api/especies` - Crear nueva especie
- `PUT /api/especies/<id>` - Actualizar especie
- `DELETE /api/especies/<id>` - Eliminar especie

**E-commerce:**
- `GET /api/productos` - Catálogo de productos
- `POST /api/pedidos` - Crear pedido
- `GET /api/pedidos/mis-pedidos` - Historial del usuario

**Comunicación Asíncrona:**
```javascript
// Patrón estándar para llamadas API
async function apiCall(endpoint, method = 'GET', data = null) {
    const config = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) config.body = JSON.stringify(data);
    
    try {
        const response = await fetch(endpoint, config);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
```

### **¿Cómo se maneja el deployment y la configuración?**

**Configuración de Aplicación:**
```python
# Configuración Flask
app = Flask(__name__, static_folder='assets', static_url_path='/static')
app.secret_key = 'sway_marine_conservation_2024_secret_key_ultra_secure'
CORS(app)  # Para desarrollo, en producción sería más restrictivo
```

**Conexión a Base de Datos:**
```python
def get_db_connection():
    try:
        # String de conexión SQL Server
        conn = pyodbc.connect(
            'DRIVER={ODBC Driver 17 for SQL Server};'
            'SERVER=localhost;'
            'DATABASE=sway;'
            'Trusted_Connection=yes;'
        )
        return conn
    except Exception as e:
        print(f"Error de conexión: {e}")
        return None
```

**Estructura de Deployment:**
- **Desarrollo**: Flask development server
- **Producción**: Recomendado Gunicorn + Nginx
- **Base de Datos**: SQL Server (local o cloud)
- **Archivos Estáticos**: Servidos por Flask en desarrollo

---

## Características Técnicas Destacadas

### **1. Arquitectura Escalable**
- Separación clara de responsabilidades (MVC pattern)
- API RESTful bien estructurada
- Base de datos normalizada para optimización

### **2. Experiencia de Usuario**
- SPA con navegación fluida
- Formularios con validación en tiempo real
- Feedback visual inmediato
- Responsive design para móviles

### **3. Gestión de Datos Robusta**
- Transacciones para operaciones críticas
- Backup automático de sesiones en localStorage
- Validación dual (cliente y servidor)
- Integridad referencial en BD

### **4. Modularidad y Mantenibilidad**
- Código JavaScript modular
- CSS organizado por funcionalidad
- Funciones helper reutilizables
- Documentación in-code extensa

---

## Casos de Uso Detallados y Escenarios Reales

### **Caso de Uso 1: Dr. María González - Bióloga Marina Senior**

**Perfil**: Doctora en Biología Marina con 15 años de experiencia, investigadora del Instituto de Ciencias del Mar.

**Flujo de Trabajo Diario:**

1. **Login como Colaboradora (8:00 AM)**
   ```javascript
   // Frontend: Portal de colaboradores
   POST /api/colaboradores/login
   {
     "email": "maria.gonzalez@icimar.mx",
     "password": "SecurePass123"
   }
   
   // Respuesta del sistema
   {
     "success": true,
     "user": {
       "nombre_completo": "Dr. María González Rodríguez",
       "colaborador_id": 12,
       "especialidad": "Biología Marina",
       "institucion": "Instituto de Ciencias del Mar"
     }
   }
   ```

2. **Registro de Nueva Especie (8:30 AM)**
   - Descubrió una nueva subespecie de pulpo en aguas profundas del Golfo de México
   - Utiliza el formulario de registro de especies con validación científica
   ```javascript
   // Datos del formulario de nueva especie
   const nuevaEspecie = {
     nombre_comun: "Pulpo de Campeche",
     nombre_cientifico: "Octopus campechensis",
     familia: "Octopodidae",
     habitat_principal: "Fondos rocosos de 200-400m de profundidad",
     distribucion_geografica: "Golfo de México, costas de Campeche",
     id_estado_conservacion: 2, // "Data Deficient"
     amenazas_principales: [1, 3, 7], // Pesca, contaminación, cambio climático
     habitats_secundarios: [2, 5] // Arrecifes, fondos arenosos
   };
   ```

3. **Consulta de Estadísticas (9:15 AM)**
   - Revisa el dashboard de especies registradas por su institución
   - Analiza tendencias de avistamientos de los últimos 6 meses
   ```sql
   -- Consulta ejecutada en el backend
   SELECT 
     em.nombre_comun,
     COUNT(av.id) as total_avistamientos,
     AVG(av.profundidad) as profundidad_promedio,
     MAX(av.fecha_avistamiento) as ultimo_avistamiento
   FROM EspeciesMarinas em
   LEFT JOIN AvistamientosEspecies av ON em.id = av.id_especie
   WHERE em.id_colaborador_registrante = 12
     AND av.fecha_avistamiento >= DATEADD(MONTH, -6, GETDATE())
   GROUP BY em.id, em.nombre_comun
   ORDER BY total_avistamientos DESC;
   ```

4. **Validación de Avistamientos (10:00 AM)**
   - Como experta senior, valida avistamientos reportados por colaboradores junior
   - Sistema de peer review científico integrado
   ```python
   @app.route('/api/avistamientos/validar/<int:avistamiento_id>', methods=['POST'])
   def validar_avistamiento(avistamiento_id):
       if session.get('colab_user_type') != 'colaborador':
           return jsonify({'error': 'Permisos insuficientes'}), 403
       
       # Verificar que el colaborador tiene experiencia suficiente
       cursor.execute("""
           SELECT años_experiencia FROM Colaboradores c
           JOIN Usuarios u ON c.id_usuario = u.id
           WHERE u.email = ?
       """, (session['colab_user_email'],))
       
       experiencia = cursor.fetchone()[0]
       if experiencia < 5:  # Mínimo 5 años para validar
           return jsonify({'error': 'Experiencia insuficiente para validar'}), 403
   ```

5. **Compra de Equipos (11:30 AM)**
   - Cambia a sesión de tienda para comprar equipos de investigación
   - Mantiene ambas sesiones activas simultáneamente
   ```javascript
   // Cambio de contexto sin logout de colaboradora
   window.location.href = '/tienda';
   
   // Login automático o manual en tienda
   POST /api/user/login
   {
     "email": "maria.gonzalez@icimar.mx", // Mismo email, diferente sesión
     "password": "SecurePass123"
   }
   
   // Ahora tiene ambas sesiones activas:
   // - Colaboradora: session['colab_user_id'] = 45
   // - Cliente: session['tienda_user_id'] = 78
   ```

### **Caso de Uso 2: Carlos Mendoza - Organizador de Eventos y Cliente Premium**

**Perfil**: Director de Sustentabilidad de una ONG ambiental, organiza eventos educativos.

**Escenario Complejo: Organización de Conferencia Marina**

1. **Creación de Evento Masivo (Conferencia Internacional)**
   ```python
   # Endpoint para crear evento con múltiples servicios
   @app.route('/api/eventos/crear-conferencia', methods=['POST'])
   def crear_conferencia():
       data = request.json
       
       # Validar capacidad del venue
       if data.get('capacidad_maxima', 0) > 500:
           # Requerir aprobación adicional para eventos masivos
           data['requiere_aprobacion'] = True
       
       # Crear evento principal
       evento_id = crear_evento_base(data)
       
       # Crear sub-eventos (talleres, mesas redondas)
       for sub_evento in data.get('sub_eventos', []):
           crear_sub_evento(evento_id, sub_evento)
       
       # Integrar con sistema de productos para materiales
       if data.get('requiere_materiales'):
           crear_pedido_materiales_evento(evento_id, data['materiales'])
   ```

2. **Gestión de Inscripciones con Límites Dinámicos**
   ```javascript
   // Frontend: Sistema de inscripciones en tiempo real
   class EventRegistrationManager {
     constructor(eventoId) {
       this.eventoId = eventoId;
       this.websocket = new WebSocket(`ws://localhost:5000/ws/evento/${eventoId}`);
       this.setupWebSocketHandlers();
     }
     
     async inscribirParticipante(datosParticipante) {
       // Verificar disponibilidad en tiempo real
       const response = await fetch(`/api/eventos/${this.eventoId}/inscribir`, {
         method: 'POST',
         body: JSON.stringify(datosParticipante)
       });
       
       if (response.status === 409) {
         // Evento lleno - ofrecer lista de espera
         this.ofrecerListaEspera();
       }
     }
     
     setupWebSocketHandlers() {
       this.websocket.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (data.type === 'capacity_update') {
           this.updateCapacityDisplay(data.remaining_spots);
         }
       };
     }
   }
   ```

3. **Compra Masiva de Materiales para Evento**
   ```python
   # Sistema de descuentos por volumen y propósito educativo
   def calcular_descuento_evento(items, evento_id):
       total_items = sum(item['cantidad'] for item in items)
       descuento = 0
       
       # Descuento por volumen
       if total_items > 100:
           descuento += 0.15  # 15% descuento por volumen
       
       # Descuento adicional para eventos educativos
       evento = get_evento_by_id(evento_id)
       if evento.tipo_evento == 'educativo':
           descuento += 0.10  # 10% adicional para educación
       
       # Máximo 25% de descuento
       return min(descuento, 0.25)
   ```

### **Caso de Uso 3: Ana Cristina - Estudiante de Maestría y Colaboradora Junior**

**Perfil**: Estudiante de Maestría en Oceanografía, nueva en el sistema, requiere mentoría.

**Flujo de Aprendizaje y Contribución:**

1. **Proceso de Solicitud de Colaboración**
   ```python
   @app.route('/api/colaboradores/solicitar', methods=['POST'])
   def solicitar_colaboracion():
       data = request.json
       
       # Crear usuario si no existe
       user_id = crear_o_obtener_usuario(data)
       
       # Crear solicitud de colaborador con estado pendiente
       cursor.execute("""
           INSERT INTO Colaboradores 
           (id_usuario, especialidad, grado_academico, institucion, 
            años_experiencia, estado_solicitud, mentor_asignado)
           VALUES (?, ?, ?, ?, ?, 'pendiente', ?)
       """, (user_id, data['especialidad'], 'Maestría', 
             data['institucion'], 1, asignar_mentor(data['especialidad'])))
   ```

2. **Sistema de Mentoría Integrado**
   ```javascript
   // Dashboard específico para colaboradores junior
   class JuniorCollaboratorDashboard {
     async loadMentorGuidance() {
       const guidance = await fetch('/api/colaboradores/mentor-guidance');
       this.displayTasks(guidance.suggested_tasks);
       this.displayLearningResources(guidance.learning_resources);
     }
     
     async submitSpeciesForReview(speciesData) {
       // Todas las especies de junior requieren revisión
       speciesData.requires_mentor_approval = true;
       const response = await fetch('/api/especies/submit-for-review', {
         method: 'POST',
         body: JSON.stringify(speciesData)
       });
     }
   }
   ```

3. **Sistema de Gamificación para Aprendizaje**
   ```sql
   -- Tabla de logros y puntos para colaboradores junior
   CREATE TABLE ColaboradorLogros (
       id int identity(1,1) primary key,
       id_colaborador int not null,
       tipo_logro varchar(50),              -- 'primera_especie', 'primer_avistamiento'
       puntos_obtenidos int,
       fecha_obtencion datetime2 default GETDATE(),
       FOREIGN KEY (id_colaborador) REFERENCES Colaboradores(id)
   );
   
   -- Procedimiento para calcular nivel de colaborador
   CREATE PROCEDURE sp_CalcularNivelColaborador(@colaborador_id INT)
   AS
   BEGIN
       DECLARE @total_puntos INT;
       SELECT @total_puntos = SUM(puntos_obtenidos) 
       FROM ColaboradorLogros 
       WHERE id_colaborador = @colaborador_id;
       
       DECLARE @nivel VARCHAR(20);
       SET @nivel = CASE 
           WHEN @total_puntos < 100 THEN 'Novato'
           WHEN @total_puntos < 500 THEN 'Aprendiz'
           WHEN @total_puntos < 1000 THEN 'Competente'
           WHEN @total_puntos < 2000 THEN 'Experto'
           ELSE 'Maestro'
       END;
       
       UPDATE Colaboradores 
       SET nivel_experiencia = @nivel, puntos_totales = @total_puntos
       WHERE id = @colaborador_id;
   END;
   ```

### **Caso de Uso 4: Roberto Silva - Cliente Corporativo y Donador Recurrente**

**Perfil**: Director de RSE de empresa naviera, compra productos para empleados y dona mensualmente.

**Escenario de Impacto Empresarial:**

1. **Compras Corporativas con Facturación Especial**
   ```python
   @app.route('/api/pedidos/corporativo', methods=['POST'])
   def crear_pedido_corporativo():
       data = request.json
       user_id = session.get('tienda_user_id')
       
       # Validar usuario como cliente corporativo
       if not es_cliente_corporativo(user_id):
           return jsonify({'error': 'No autorizado para pedidos corporativos'}), 403
       
       # Aplicar descuentos corporativos
       descuento_corp = calcular_descuento_corporativo(data['items'], user_id)
       
       # Generar factura con RFC corporativo
       pedido_id = crear_pedido_con_factura(data, descuento_corp)
       
       # Generar reporte de impacto ambiental
       impacto = calcular_impacto_ambiental(data['items'])
       generar_reporte_impacto(pedido_id, impacto)
   ```

2. **Sistema de Donaciones Recurrentes**
   ```javascript
   // Configuración de donación mensual automática
   class RecurringDonationManager {
     async setupMonthlyDonation(amount, projectId, paymentMethod) {
       const donationConfig = {
         user_id: this.getCurrentUserId(),
         amount: amount,
         frequency: 'monthly',
         project_id: projectId,
         payment_method: paymentMethod,
         next_charge_date: this.calculateNextChargeDate(),
         active: true
       };
       
       const response = await fetch('/api/donaciones/recurrente', {
         method: 'POST',
         body: JSON.stringify(donationConfig)
       });
       
       if (response.ok) {
         this.scheduleReminders(donationConfig);
         this.sendConfirmationEmail(donationConfig);
       }
     }
   }
   ```

3. **Dashboard de Impacto Corporativo**
   ```sql
   -- Vista para reportes de impacto corporativo
   CREATE VIEW vw_ImpactoCorporativo AS
   SELECT 
       u.nombre as empresa,
       COUNT(DISTINCT p.id) as total_pedidos,
       SUM(p.total) as inversion_total,
       COUNT(DISTINCT d.id) as total_donaciones,
       SUM(d.monto) as donaciones_totales,
       COUNT(DISTINCT re.id) as eventos_participados,
       -- Cálculo de impacto ambiental
       SUM(pi.co2_ahorrado) as co2_total_ahorrado,
       SUM(pi.plastico_reciclado) as plastico_total_reciclado
   FROM Usuarios u
   LEFT JOIN Pedidos p ON u.id = p.id_usuario
   LEFT JOIN Donaciones d ON u.id = d.id_donador
   LEFT JOIN RegistroEventos re ON u.id = re.id_usuario
   LEFT JOIN ProductosImpacto pi ON p.id = pi.id_pedido
   WHERE u.tipo_cliente = 'corporativo'
   GROUP BY u.id, u.nombre;
   ```

### **Caso de Uso 5: Elena Vásquez - Educadora y Organizadora de Talleres Comunitarios**

**Perfil**: Maestra de secundaria que organiza talleres de conservación marina para jóvenes.

**Integración Educativa Completa:**

1. **Creación de Programas Educativos Modulares**
   ```python
   # Sistema de eventos educativos con progresión
   class ProgramaEducativo:
       def __init__(self, nombre, nivel_educativo, duracion_semanas):
           self.nombre = nombre
           self.nivel = nivel_educativo  # 'primaria', 'secundaria', 'preparatoria'
           self.duracion = duracion_semanas
           self.modulos = []
       
       def agregar_modulo(self, titulo, recursos_necesarios, especies_relacionadas):
           modulo = {
               'titulo': titulo,
               'recursos': recursos_necesarios,
               'especies': especies_relacionadas,
               'evaluacion': self.generar_evaluacion(especies_relacionadas)
           }
           self.modulos.append(modulo)
   
   @app.route('/api/educacion/crear-programa', methods=['POST'])
   def crear_programa_educativo():
       # Integra eventos, biblioteca, especies y productos
       programa = ProgramaEducativo(**request.json)
       
       # Crear eventos para cada módulo
       for modulo in programa.modulos:
           evento_id = crear_evento_educativo(modulo)
           
           # Asociar recursos de biblioteca
           asociar_recursos_biblioteca(evento_id, modulo['recursos'])
           
           # Crear kit de materiales educativos
           crear_kit_materiales(evento_id, modulo['recursos'])
   ```

2. **Sistema de Evaluación y Certificación**
   ```javascript
   // Plataforma de evaluación integrada
   class SistemaEvaluacion {
     async crearEvaluacion(eventoId, tipoEvaluacion) {
       const especies = await this.obtenerEspeciesDelEvento(eventoId);
       const preguntas = await this.generarPreguntasAutomaticas(especies);
       
       const evaluacion = {
         evento_id: eventoId,
         tipo: tipoEvaluacion, // 'diagnostica', 'formativa', 'sumativa'
         preguntas: preguntas,
         tiempo_limite: this.calcularTiempoLimite(preguntas.length),
         criterios_aprobacion: { puntaje_minimo: 70, intentos_maximos: 3 }
       };
       
       return await fetch('/api/evaluaciones/crear', {
         method: 'POST',
         body: JSON.stringify(evaluacion)
       });
     }
     
     async generarCertificado(estudianteId, programaId) {
       const resultados = await this.obtenerResultadosEstudiante(estudianteId, programaId);
       if (resultados.promedio >= 70) {
         return await this.emitirCertificadoDigital(estudianteId, programaId);
       }
     }
   }
   ```

### **Caso de Uso 6: Dr. Fernando Torres - Investigador Internacional y Validador Senior**

**Perfil**: Investigador principal con 25+ años de experiencia, valida investigaciones internacionales.

**Colaboración Científica Avanzada:**

1. **Sistema de Peer Review Científico**
   ```python
   @app.route('/api/investigacion/peer-review', methods=['POST'])
   def sistema_peer_review():
       data = request.json
       revisor_id = session.get('colab_colaborador_id')
       
       # Verificar calificaciones del revisor
       cursor.execute("""
           SELECT años_experiencia, publicaciones_h_index, especialidad
           FROM Colaboradores c
           JOIN PerfilCientifico pc ON c.id = pc.id_colaborador
           WHERE c.id = ?
       """, (revisor_id,))
       
       perfil = cursor.fetchone()
       if perfil.años_experiencia < 10 or perfil.publicaciones_h_index < 5:
           return jsonify({'error': 'Calificaciones insuficientes para peer review'}), 403
       
       # Asignar review con conflicto de intereses
       if not verificar_conflicto_intereses(revisor_id, data['investigacion_id']):
           asignar_peer_review(revisor_id, data['investigacion_id'])
   ```

2. **Integración con Bases de Datos Científicas Externas**
   ```python
   # Sincronización con GBIF, OBIS, y otros repositorios
   class IntegracionCientifica:
       def __init__(self):
           self.gbif_api = GBIFConnector()
           self.obis_api = OBISConnector()
           self.crossref_api = CrossRefConnector()
       
       async def sincronizar_especie_con_gbif(self, especie_id):
           especie_local = obtener_especie(especie_id)
           gbif_data = await self.gbif_api.buscar_por_nombre_cientifico(
               especie_local.nombre_cientifico
           )
           
           if gbif_data:
               # Actualizar datos con información internacional
               actualizar_especie_con_datos_externos(especie_id, gbif_data)
               registrar_fuente_externa(especie_id, 'GBIF', gbif_data.key)
       
       async def exportar_datos_para_publicacion(self, colaborador_id):
           # Generar datasets en formato Darwin Core para publicación
           especies = obtener_especies_colaborador(colaborador_id)
           avistamientos = obtener_avistamientos_colaborador(colaborador_id)
           
           darwin_core_dataset = convertir_a_darwin_core(especies, avistamientos)
           return generar_archivo_dwc(darwin_core_dataset)
   ```

### **Arquitectura de Casos de Uso Cross-Funcionales**

**1. Sistema de Notificaciones Inteligentes**
```python
# Motor de notificaciones contextual
class NotificationEngine:
    def __init__(self):
        self.channels = ['email', 'in_app', 'sms', 'webhook']
        self.rules = self.load_notification_rules()
    
    def process_event(self, event_type, user_id, context):
        user_preferences = self.get_user_preferences(user_id)
        applicable_rules = self.filter_rules(event_type, context)
        
        for rule in applicable_rules:
            if self.should_notify(rule, user_preferences, context):
                self.send_notification(rule, user_id, context)
    
    def send_notification(self, rule, user_id, context):
        # Ejemplo: Nueva especie en área de interés del colaborador
        if rule.type == 'new_species_in_area':
            message = self.generate_species_alert(context['species'], context['location'])
            self.send_via_preferred_channel(user_id, message)
```

**2. Sistema de Analytics y Machine Learning**
```python
# Análisis predictivo para conservación
class ConservationAnalytics:
    def __init__(self):
        self.ml_models = self.load_trained_models()
    
    def predict_species_risk(self, species_id):
        # Factores: avistamientos, amenazas, cambio climático, actividad humana
        features = self.extract_species_features(species_id)
        risk_score = self.ml_models['species_risk'].predict(features)
        
        return {
            'risk_level': self.categorize_risk(risk_score),
            'primary_threats': self.identify_main_threats(features),
            'recommended_actions': self.suggest_conservation_actions(risk_score)
        }
    
    def optimize_event_scheduling(self, event_type, target_audience):
        # ML para optimizar fechas y horarios de eventos
        historical_data = self.get_event_attendance_history(event_type)
        seasonal_patterns = self.analyze_seasonal_patterns(target_audience)
        
        optimal_schedule = self.ml_models['event_optimizer'].predict({
            'historical': historical_data,
            'seasonal': seasonal_patterns,
            'audience': target_audience
        })
        
        return optimal_schedule
```

Esta documentación extendida proporciona una visión comprehensiva y detallada de SWAY como sistema empresarial completo, mostrando no solo el stack tecnológico sino también casos de uso reales, flujos de trabajo complejos y la integración entre diferentes módulos del sistema.