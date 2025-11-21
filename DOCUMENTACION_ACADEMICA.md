# 📚 DOCUMENTACIÓN ACADÉMICA - PROYECTO SWAY
## Sistema de Conservación Marina con Arquitectura ORM

---

## 📋 CUMPLIMIENTO DE REQUISITOS ACADÉMICOS

### ✅ **FRONTEND - 100% Cumplido**

#### 1. **Diseño Responsivo**
- **Ubicación**: Todos los templates en `templates/`
- **Implementación**: CSS responsive con media queries en cada página
- **Ejemplo**: [portal-colaboradores.html](templates/portal-colaboradores.html)
  ```css
  @media (max-width: 768px) {
      .especies-grid {
          grid-template-columns: 1fr !important;
      }
  }
  ```
- **Prueba**: Todas las páginas se adaptan a móvil, tablet y desktop

#### 2. **Framework CSS - Bootstrap**
- **Framework usado**: Bootstrap 5
- **Ubicación**: `assets/vendor/bootstrap/`
- **Implementación**:
  - Grid system en todas las páginas
  - Componentes: modals, forms, cards, navbar
- **Ejemplo**: [tienda.html](templates/tienda.html)
  ```html
  <link href="{{ url_for('static', filename='vendor/bootstrap/css/bootstrap.min.css') }}" />
  ```

#### 3. **Motor de Plantillas - Jinja2**
- **Motor**: Jinja2 (integrado con Flask)
- **Implementación**:
  - Variables dinámicas: `{{ variable }}`
  - Control de flujo: `{% for %} {% if %}`
  - URLs dinámicas: `{{ url_for('static', filename='...') }}`
- **Ejemplo**: [especies.html](templates/especies.html)
  ```jinja2
  {% for especie in especies %}
      <div class="especie-card">
          <h3>{{ especie.nombre }}</h3>
      </div>
  {% endfor %}
  ```

#### 4. **Validación de Campos - Implementación Dual**
- **Ubicación**:
  - Cliente: `assets/js/tienda.js`, `assets/js/portal-colaboradores.js`
  - Servidor: [validators.py](validators.py)
- **Implementación**:
  - HTML: Atributos `data-validation` (NO `required` para cumplir con validación del servidor)
  - JavaScript: Validación pre-envío
  - **Python**: Validación robusta del servidor (requisito principal)
- **Ejemplo**: [portal-colaboradores.html:1450-1459](templates/portal-colaboradores.html:1450-1459)
  ```html
  <input type="text" id="nombre-comun" name="nombre_comun"
         maxlength="100" placeholder="Ej: Tortuga Marina Verde" />
  ```

#### 5. **Mensajes de Alert**
- **Tipos**: Success, Error, Warning
- **Ubicación**: JavaScript en cada página
- **Implementación**: Notificaciones dinámicas con feedback visual
- **Ejemplo**: [tienda.js](assets/js/tienda.js)
  ```javascript
  showNotification('Especie creada exitosamente', 'success');
  showNotification('Error al crear especie', 'error');
  ```

---

### ✅ **BACKEND - 100% Cumplido**

#### 1. **Framework Web - Flask**
- **Framework**: Flask 3.x
- **Archivo principal**: [app.py](app.py)
- **Configuración**:
  ```python
  app = Flask(__name__, static_folder='assets', static_url_path='/static')
  app.secret_key = 'sway_secret_key_ultra_secreta'
  CORS(app)
  ```
- **Rutas registradas**: 50+ endpoints (HTML + API)

#### 2. **CRUD Completo con ORM** ⭐ **REQUISITO PRINCIPAL**

##### **Modelo: EspecieMarina (Especies Marinas)**
- **Archivo ORM**: [models.py:153-172](models.py:153-172)
- **Rutas ORM**: [routes_orm.py:340-566](routes_orm.py:340-566)

##### **CREATE - Crear Especie**
```python
@app.route('/api/especies', methods=['POST'])
def create_especie_orm():
    # 1. Validación del servidor
    validated_data = validate_especie_marina(data)

    # 2. Verificar unicidad
    existing = db.query(EspecieMarina).filter_by(
        nombre_cientifico=validated_data['nombre_cientifico']
    ).first()

    # 3. Crear con ORM
    nueva_especie = EspecieMarina(
        nombre_comun=validated_data['nombre_comun'],
        nombre_cientifico=validated_data['nombre_cientifico'],
        descripcion=validated_data.get('descripcion'),
        esperanza_vida=validated_data.get('esperanza_vida'),
        poblacion_estimada=validated_data.get('poblacion_estimada'),
        id_estado_conservacion=validated_data['id_estado_conservacion'],
        imagen_url=validated_data.get('imagen_url')
    )
    db.add(nueva_especie)
    db.commit()
```

**Interfaz**: [portal-colaboradores.html:1376-1378](templates/portal-colaboradores.html:1376-1378)
```html
<button class="btn-sway-primary" onclick="openEspecieModal()">
    <i class="bi bi-plus-circle"></i> Nueva Especie
</button>
```

##### **READ - Leer Especies**
```python
@app.route('/api/especies', methods=['GET'])
def get_especies_orm():
    # Query con ORM
    query = db.query(EspecieMarina)

    # Filtros opcionales
    if search:
        query = query.filter(
            (EspecieMarina.nombre_comun.ilike(f'%{search}%')) |
            (EspecieMarina.nombre_cientifico.ilike(f'%{search}%'))
        )

    # Paginación
    especies = query.offset((page - 1) * limit).limit(limit).all()

    # Serialización
    return jsonify({'success': True, 'especies': especies_list})
```

**Interfaz**: [portal-colaboradores.html:1381-1387](templates/portal-colaboradores.html:1381-1387)
```html
<div id="especies-container" class="especies-grid">
    <!-- Especies cargadas dinámicamente -->
</div>
```

##### **UPDATE - Actualizar Especie**
```python
@app.route('/api/especies/<int:id>', methods=['PUT'])
def update_especie_orm(id):
    # Buscar con ORM
    especie = db.query(EspecieMarina).filter_by(id=id).first()

    # Actualizar campos
    especie.nombre_comun = validated_data['nombre_comun']
    especie.descripcion = validated_data.get('descripcion')
    especie.esperanza_vida = validated_data.get('esperanza_vida')

    db.commit()
```

**Interfaz**: Botón "Modificar registro" en cada card de especie

##### **DELETE - Eliminar Especie**
```python
@app.route('/api/especies/<int:id>', methods=['DELETE'])
def delete_especie_orm(id):
    especie = db.query(EspecieMarina).filter_by(id=id).first()

    # Hard delete
    db.delete(especie)
    db.commit()
```

**Interfaz**: Botón "Eliminar especie" con modal de confirmación

#### 3. **ORM - SQLAlchemy** ⭐ **REQUISITO PRINCIPAL**

##### **Configuración del ORM**
```python
# models.py - Configuración
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

Base = declarative_base()

def get_engine():
    connection_string = f'mssql+pyodbc://{username}:{password}@{server}/{database}?driver=ODBC+Driver+17+for+SQL+Server'
    engine = create_engine(connection_string, echo=False)
    return engine

def get_session():
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    return Session()
```

##### **Modelos ORM Implementados**
1. **EspecieMarina** (CRUD completo) ⭐
   ```python
   class EspecieMarina(Base):
       __tablename__ = 'Especies'

       id = Column(Integer, primary_key=True, autoincrement=True)
       nombre_comun = Column(String(100), nullable=False)
       nombre_cientifico = Column(String(100), unique=True, nullable=False)
       descripcion = Column(Text)
       esperanza_vida = Column(Integer)
       poblacion_estimada = Column(Integer)
       id_estado_conservacion = Column(Integer, ForeignKey('EstadosConservacion.id'))
       imagen_url = Column(String(255))

       # Relación
       estado_conservacion = relationship('EstadoConservacion', back_populates='especies')
   ```

2. **Usuario** (Autenticación)
   ```python
   class Usuario(Base):
       __tablename__ = 'Usuarios'
       id = Column(Integer, primary_key=True)
       nombre = Column(String(100), nullable=False)
       email = Column(String(254), unique=True, nullable=False)
       password_hash = Column(String(254))
   ```

3. **Colaborador** (Roles)
   ```python
   class Colaborador(Base):
       __tablename__ = 'Colaboradores'
       id = Column(Integer, primary_key=True)
       id_usuario = Column(Integer, ForeignKey('Usuarios.id'))
       especialidad = Column(String(100))
       grado_academico = Column(String(50))
   ```

4. **EstadoConservacion** (Catálogo)
   ```python
   class EstadoConservacion(Base):
       __tablename__ = 'EstadosConservacion'
       id = Column(Integer, primary_key=True)
       nombre = Column(String(50), nullable=False)
       especies = relationship('EspecieMarina', back_populates='estado_conservacion')
   ```

5. **Producto, Pedido, DetallePedido** (E-commerce)

##### **Relaciones ORM**
- **One-to-Many**: Usuario → Colaborador
- **One-to-Many**: EstadoConservacion → EspecieMarina
- **Many-to-Many**: EspecieMarina ↔ Amenazas (via EspeciesAmenazas)
- **Many-to-Many**: EspecieMarina ↔ Habitats (via EspeciesHabitats)

#### 4. **Validaciones del Servidor** ⭐ **REQUISITO PRINCIPAL**

##### **Archivo de Validaciones**: [validators.py](validators.py)

##### **Validador de Especies Marinas**
```python
def validate_especie_marina(data):
    """Validación completa del lado del servidor"""
    errors = []

    # Validar nombre común
    if not data.get('nombre_comun') or not data['nombre_comun'].strip():
        errors.append('Nombre común es obligatorio')
    elif len(data['nombre_comun']) > 100:
        errors.append('Nombre común no debe exceder 100 caracteres')

    # Validar nombre científico
    if not data.get('nombre_cientifico') or not data['nombre_cientifico'].strip():
        errors.append('Nombre científico es obligatorio')
    elif not re.match(r'^[A-Z][a-z]+ [a-z]+$', data['nombre_cientifico']):
        errors.append('Nombre científico debe estar en formato binomial')

    # Validar esperanza de vida
    if data.get('esperanza_vida'):
        try:
            esperanza = int(data['esperanza_vida'])
            if esperanza < 1 or esperanza > 500:
                errors.append('Esperanza de vida debe estar entre 1 y 500 años')
        except ValueError:
            errors.append('Esperanza de vida debe ser un número entero')

    # Validar población estimada
    if data.get('poblacion_estimada'):
        try:
            poblacion = int(data['poblacion_estimada'])
            if poblacion < 0:
                errors.append('Población estimada no puede ser negativa')
        except ValueError:
            errors.append('Población estimada debe ser un número entero')

    # Validar estado de conservación
    if not data.get('id_estado_conservacion'):
        errors.append('Estado de conservación es obligatorio')

    if errors:
        raise ValidationError('; '.join(errors))

    return data
```

##### **Flujo de Validación**
1. **Cliente** envía datos →
2. **Servidor** valida con `validators.py` →
3. Si hay errores → **Respuesta 400** con mensaje de error →
4. Cliente muestra alert de error
5. Si es válido → **ORM inserta** en base de datos →
6. **Respuesta 201** con éxito →
7. Cliente muestra alert de éxito

##### **Ejemplo de Uso en Ruta**
```python
@app.route('/api/especies', methods=['POST'])
def create_especie_orm():
    data = request.get_json()

    # VALIDACIÓN DEL SERVIDOR
    try:
        validated_data = validate_especie_marina(data)
    except ValidationError as e:
        return jsonify({'success': False, 'error': str(e)}), 400

    # Si pasa validación, proceder con ORM
    nueva_especie = EspecieMarina(**validated_data)
    db.add(nueva_especie)
    db.commit()
```

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### **Flujo de Datos Completo**

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Cliente)                            │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │  templates/  │   │  assets/js/  │   │  assets/css/ │        │
│  │  Jinja2      │◄──┤  JavaScript  │◄──┤  Bootstrap   │        │
│  └──────┬───────┘   └──────┬───────┘   └──────────────┘        │
│         │                  │                                     │
│         └──────────┬───────┘                                     │
│                    │ HTTP Request (POST /api/especies)          │
└────────────────────┼─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Servidor Flask)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  app.py - Aplicación Principal                           │   │
│  │  ├─ Registra routes_orm.py                               │   │
│  │  ├─ Maneja sesiones                                      │   │
│  │  └─ Sirve templates                                      │   │
│  └────────────────┬─────────────────────────────────────────┘   │
│                   │                                              │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  routes_orm.py - Endpoints ORM                           │   │
│  │  ├─ POST   /api/especies      (CREATE)                  │   │
│  │  ├─ GET    /api/especies      (READ List)               │   │
│  │  ├─ GET    /api/especies/:id  (READ One)                │   │
│  │  ├─ PUT    /api/especies/:id  (UPDATE)                  │   │
│  │  └─ DELETE /api/especies/:id  (DELETE)                  │   │
│  └────────────────┬─────────────────────────────────────────┘   │
│                   │                                              │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  validators.py - Validación del Servidor                │   │
│  │  ├─ validate_especie_marina()                           │   │
│  │  ├─ validate_user_registration()                        │   │
│  │  ├─ validate_colaborador_registration()                 │   │
│  │  └─ ValidationError (excepciones)                       │   │
│  └────────────────┬─────────────────────────────────────────┘   │
│                   │ Datos Validados                              │
│                   ▼                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  models.py - ORM SQLAlchemy                              │   │
│  │  ├─ EspecieMarina (modelo)                               │   │
│  │  ├─ Usuario, Colaborador, EstadoConservacion            │   │
│  │  ├─ get_session() → SQLAlchemy Session                  │   │
│  │  └─ Relaciones: ForeignKey, relationship()              │   │
│  └────────────────┬─────────────────────────────────────────┘   │
│                   │ SQL generado por ORM                         │
└───────────────────┼──────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              BASE DE DATOS (SQL Server)                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Tabla: Especies                                         │   │
│  │  ├─ id (PK)                                              │   │
│  │  ├─ nombre_comun                                         │   │
│  │  ├─ nombre_cientifico (UNIQUE)                          │   │
│  │  ├─ descripcion                                          │   │
│  │  ├─ esperanza_vida                                       │   │
│  │  ├─ poblacion_estimada                                   │   │
│  │  ├─ id_estado_conservacion (FK)                         │   │
│  │  └─ imagen_url                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Tabla: EstadosConservacion                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Tabla: Usuarios, Colaboradores, Productos, etc.        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 ANTES vs DESPUÉS DE LA CORRECCIÓN

### **PROBLEMA INICIAL**

#### **Discrepancias Encontradas**
1. **Nombre de tabla incorrecto** en models.py:
   - ❌ `__tablename__ = 'EspeciesMarinas'` (no existía)
   - ✅ `__tablename__ = 'Especies'` (tabla real)

2. **18 columnas inexistentes** en el modelo:
   - ❌ reino, filo, clase, orden, familia, genero, especie
   - ❌ habitat_principal, profundidad_min/max, temperatura_min/max
   - ❌ distribucion_geografica, longitud_max, peso_max
   - ❌ id_colaborador_registrante, activo, fecha_registro

3. **Columna faltante**:
   - ❌ No estaba: `poblacion_estimada`

4. **Tamaño incorrecto**:
   - ❌ `imagen_url = Column(String(500))`
   - ✅ `imagen_url = Column(String(255))`

5. **EstadoConservacion** con columnas inexistentes:
   - ❌ codigo, color_codigo, nivel_prioridad

### **¿POR QUÉ FUNCIONABA EL SISTEMA?**

El sistema funcionaba porque:
1. **Rutas duplicadas**: app.py tenía SQL directo que SÍ funcionaba
2. **Las rutas ORM** estaban registradas pero **fallaban silenciosamente**
3. Portal-colaboradores.html probablemente mostraba errores al intentar crear especies

### **SOLUCIÓN IMPLEMENTADA**

#### **1. Corrección de models.py**
```python
# ANTES (incorrecto)
class EspecieMarina(Base):
    __tablename__ = 'EspeciesMarinas'  # ❌ Tabla no existe
    reino = Column(String(50))          # ❌ Columna no existe
    filo = Column(String(50))           # ❌ Columna no existe
    # ... 18 columnas más que no existen
    imagen_url = Column(String(500))    # ❌ Tamaño incorrecto

# DESPUÉS (corregido)
class EspecieMarina(Base):
    __tablename__ = 'Especies'  # ✅ Nombre correcto

    # Solo columnas que SÍ existen en la BD
    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre_comun = Column(String(100), nullable=False)
    nombre_cientifico = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text)
    esperanza_vida = Column(Integer)
    poblacion_estimada = Column(Integer)  # ✅ Agregada
    id_estado_conservacion = Column(Integer, ForeignKey('EstadosConservacion.id'))
    imagen_url = Column(String(255))  # ✅ Tamaño correcto
```

#### **2. Corrección de routes_orm.py**
```python
# ANTES (incorrecto)
nueva_especie = EspecieMarina(
    nombre_comun=validated_data['nombre_comun'],
    filo=validated_data.get('filo'),  # ❌ No existe
    clase=validated_data.get('clase'),  # ❌ No existe
    activo=True  # ❌ No existe
)

# DESPUÉS (corregido)
nueva_especie = EspecieMarina(
    nombre_comun=validated_data['nombre_comun'],
    nombre_cientifico=validated_data['nombre_cientifico'],
    descripcion=validated_data.get('descripcion'),
    esperanza_vida=validated_data.get('esperanza_vida'),
    poblacion_estimada=validated_data.get('poblacion_estimada'),
    id_estado_conservacion=validated_data['id_estado_conservacion'],
    imagen_url=validated_data.get('imagen_url')
)
```

#### **3. Prueba de Funcionamiento**
```bash
=== PRUEBA DE ORM CON TABLA ESPECIES ===

1. Consultando especies existentes...
   ✅ OK: Encontradas 3 especies de prueba
   - Tortuga Verde (Chelonia mydas)
   - Ballena (Balaenoptera musculus)
   - Vaquita Marina (Phocoena sinus)

2. Consultando estados de conservacion...
   ✅ OK: Encontrados 8 estados de conservacion

3. Insertando especie de prueba...
   ✅ OK: Especie insertada con ID: 25

4. Verificando insercion en BD...
   ✅ OK: Especie encontrada: Especie Prueba ORM
   - Poblacion estimada: 1000

5. Limpiando: eliminando especie de prueba...
   ✅ OK: Especie de prueba eliminada

✅ EXITO: El ORM funciona correctamente con la tabla Especies
```

---

## 📊 EVIDENCIA DE FUNCIONAMIENTO

### **1. Código ORM Verificado**

#### **Consulta (SELECT)**
```python
# ORM
especies = db.query(EspecieMarina).filter(
    EspecieMarina.nombre_comun.ilike(f'%{search}%')
).all()

# SQL Generado
SELECT * FROM Especies
WHERE nombre_comun LIKE '%tortuga%'
```

#### **Inserción (INSERT)**
```python
# ORM
nueva_especie = EspecieMarina(nombre_comun="Tortuga Verde")
db.add(nueva_especie)
db.commit()

# SQL Generado
INSERT INTO Especies (nombre_comun, nombre_cientifico, ...)
VALUES ('Tortuga Verde', 'Chelonia mydas', ...)
```

#### **Actualización (UPDATE)**
```python
# ORM
especie = db.query(EspecieMarina).filter_by(id=5).first()
especie.nombre_comun = "Nuevo Nombre"
db.commit()

# SQL Generado
UPDATE Especies SET nombre_comun = 'Nuevo Nombre'
WHERE id = 5
```

#### **Eliminación (DELETE)**
```python
# ORM
especie = db.query(EspecieMarina).filter_by(id=5).first()
db.delete(especie)
db.commit()

# SQL Generado
DELETE FROM Especies WHERE id = 5
```

### **2. Relaciones ORM**
```python
# Consulta con relación (JOIN)
especie = db.query(EspecieMarina).filter_by(id=1).first()
print(especie.estado_conservacion.nombre)  # "En Peligro Crítico"

# SQL Generado
SELECT e.*, ec.nombre
FROM Especies e
LEFT JOIN EstadosConservacion ec ON e.id_estado_conservacion = ec.id
WHERE e.id = 1
```

---

## 🎤 GUÍA PARA LA EXPOSICIÓN

### **SLIDE 1: Introducción**
**"SWAY - Sistema de Conservación Marina con ORM"**

- Proyecto web completo usando Flask + SQLAlchemy
- Cumple 100% de requisitos académicos
- CRUD funcional con validaciones del servidor

### **SLIDE 2: Frontend - Requisitos Cumplidos**

**Mostrar**: [portal-colaboradores.html](templates/portal-colaboradores.html)

**Explicar**:
1. ✅ **Diseño Responsivo**: "Como pueden ver, la interfaz se adapta a diferentes tamaños de pantalla usando media queries"
2. ✅ **Bootstrap**: "Usamos Bootstrap 5 para components como modals, forms y grid system"
3. ✅ **Jinja2**: "El motor de plantillas Jinja2 renderiza datos dinámicamente desde el servidor"
4. ✅ **Validaciones**: "Los campos tienen validación en el cliente, pero la validación principal es del servidor"
5. ✅ **Alerts**: "El sistema muestra mensajes de confirmación, error y éxito"

### **SLIDE 3: Backend - Framework Flask**

**Mostrar**: [app.py](app.py) estructura

**Explicar**:
```python
app = Flask(__name__)
app.secret_key = 'sway_secret_key_ultra_secreta'

# Registrar rutas ORM
from routes_orm import register_all_orm_routes
register_all_orm_routes(app)
```

"Flask es nuestro framework principal que maneja las rutas, sesiones y renderiza templates"

### **SLIDE 4: ORM - SQLAlchemy** ⭐

**Mostrar**: [models.py:153-172](models.py:153-172)

**Explicar**:
"Aquí está nuestro modelo ORM principal - EspecieMarina"

```python
class EspecieMarina(Base):
    __tablename__ = 'Especies'

    id = Column(Integer, primary_key=True)
    nombre_comun = Column(String(100), nullable=False)
    nombre_cientifico = Column(String(100), unique=True)
    # ... más columnas

    # Relación con otro modelo
    estado_conservacion = relationship('EstadoConservacion')
```

"SQLAlchemy convierte este modelo Python en consultas SQL automáticamente"

### **SLIDE 5: CRUD Completo** ⭐

**Mostrar**: Tabla con las 4 operaciones

| Operación | Método HTTP | Endpoint | Código ORM |
|-----------|-------------|----------|------------|
| **CREATE** | POST | /api/especies | `db.add()` + `db.commit()` |
| **READ** | GET | /api/especies | `db.query().all()` |
| **UPDATE** | PUT | /api/especies/:id | `especie.campo = valor` + `db.commit()` |
| **DELETE** | DELETE | /api/especies/:id | `db.delete()` + `db.commit()` |

**Demostrar**: Abrir portal-colaboradores.html y crear una especie en vivo

### **SLIDE 6: Validaciones del Servidor** ⭐

**Mostrar**: [validators.py](validators.py)

**Explicar**:
"La validación del servidor es obligatoria y robusta"

```python
def validate_especie_marina(data):
    errors = []

    if not data.get('nombre_comun'):
        errors.append('Nombre común es obligatorio')

    if errors:
        raise ValidationError(errors)

    return data
```

"Si hay errores, el servidor responde con código 400 y el cliente muestra un alert"

### **SLIDE 7: Flujo Completo**

**Mostrar**: Diagrama de arquitectura (del documento)

**Explicar**:
1. Usuario llena formulario en **Frontend** (Jinja2 + Bootstrap)
2. JavaScript envía datos a **Backend** (Flask)
3. **Validación del Servidor** (validators.py)
4. Si es válido → **ORM** inserta en BD (SQLAlchemy)
5. Respuesta al cliente con alert de éxito/error

### **SLIDE 8: Demostración en Vivo**

**Pasos**:
1. Abrir http://localhost:5000/especies
2. Iniciar sesión como colaborador
3. Click en "Nueva Especie"
4. Llenar formulario
5. **Mostrar validación**: dejar campos vacíos → alert de error
6. Llenar correctamente
7. Guardar → alert de éxito
8. Verificar que aparece en la lista

### **SLIDE 9: Ventajas del ORM**

**Explicar**:

❌ **Sin ORM (SQL directo)**:
```python
cursor.execute("INSERT INTO Especies (nombre_comun) VALUES (?)", (nombre,))
```
- Propenso a SQL injection
- Código repetitivo
- Difícil de mantener

✅ **Con ORM (SQLAlchemy)**:
```python
nueva_especie = EspecieMarina(nombre_comun=nombre)
db.add(nueva_especie)
```
- Seguro (previene SQL injection)
- Código limpio y reutilizable
- Relaciones automáticas

### **SLIDE 10: Conclusiones**

**Resumen de Cumplimiento**:

✅ **Frontend**:
- Diseño responsivo con media queries
- Bootstrap 5 para UI components
- Jinja2 como motor de plantillas
- Validación de campos
- Mensajes de alert

✅ **Backend**:
- Flask como framework
- **CRUD completo funcional** (Especies)
- **SQLAlchemy ORM** con 5+ modelos
- **Validaciones del servidor** robustas

**Resultado**: Sistema completo, funcional y que cumple todos los requisitos académicos

---

## 📁 ARCHIVOS CLAVE PARA DEMOSTRAR

1. **models.py** - Definición del ORM
2. **routes_orm.py** - Endpoints CRUD
3. **validators.py** - Validaciones del servidor
4. **templates/portal-colaboradores.html** - Interfaz del CRUD
5. **test_orm_especies.py** - Prueba de funcionamiento

---

## ✅ CHECKLIST FINAL

### Frontend
- [x] Diseño responsivo
- [x] Framework CSS (Bootstrap 5)
- [x] Motor de plantillas (Jinja2)
- [x] Validación de campos
- [x] Mensajes de alert

### Backend
- [x] Framework web (Flask)
- [x] CRUD completo funcional (EspecieMarina)
- [x] ORM (SQLAlchemy)
- [x] Validaciones del servidor

---

## 🎓 VALOR ACADÉMICO

Este proyecto demuestra:
1. **Arquitectura MVC** completa
2. **Separación de responsabilidades** (models, views, controllers)
3. **Buenas prácticas**: validación del servidor, ORM, relaciones
4. **Código limpio y mantenible**
5. **Sistema funcional end-to-end**

---

**Fecha de actualización**: 2025
**Autor**: Emiliano Ledesma
**Materia**: Programación Web
**Requisito**: CRUD con ORM y Validaciones del Servidor ✅
