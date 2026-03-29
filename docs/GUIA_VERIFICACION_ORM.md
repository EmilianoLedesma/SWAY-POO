# 🔍 GUÍA DE VERIFICACIÓN - SQLAlchemy ORM vs Consultas Directas

## 📊 MÉTODOS DE VERIFICACIÓN

### 1️⃣ Revisar Logs del Servidor

**Cuando inicias el servidor (`python app.py`), debes ver:**

```
✅ Rutas ORM registradas exitosamente
✅ Sistema ORM SQLAlchemy integrado correctamente
🌊 Iniciando servidor SWAY...
📊 Base de datos: SQL Server
🔧 ORM: SQLAlchemy + pyodbc (híbrido)
🚀 Servidor corriendo en http://localhost:5000
```

**Si ves estos mensajes:** ✅ El ORM está cargado y funcionando

---

### 2️⃣ Revisar el Código Directamente

#### A) Buscar importaciones en app.py:

```bash
# Buscar estas líneas en app.py
```

```python
# LÍNEA ~15-20 de app.py
from models import (
    get_session, Usuario, Colaborador, EspecieMarina, EstadoConservacion,
    Producto, CategoriaProducto, Pedido, DetallePedido, CarritoCompra,
    AvistamientoEspecie, TipoHabitat, TipoAmenaza
)
from validators import (
    validate_user_registration, validate_user_login, validate_colaborador_registration,
    validate_especie_marina, validate_producto, validate_pedido, ValidationError
)
```

#### B) Verificar integración de rutas ORM:

```python
# LÍNEA ~3740 de app.py (al final)
try:
    from routes_orm import register_all_orm_routes
    register_all_orm_routes(app)
    print("✅ Sistema ORM SQLAlchemy integrado correctamente")
except ImportError as e:
    print(f"⚠️ No se pudo cargar routes_orm: {e}")
```

---

### 3️⃣ Comparar Código: ORM vs SQL Directo

#### ❌ CÓDIGO ANTIGUO (SQL Directo con pyodbc):

```python
# Ejemplo de app.py líneas ~200-300
@app.route('/api/user/login', methods=['POST'])
def user_login():
    conn = get_db_connection()  # <-- pyodbc connection
    cursor = conn.cursor()
    
    # SQL directo
    cursor.execute("""
        SELECT id, nombre, apellido_paterno, email 
        FROM Usuarios 
        WHERE email = ?
    """, (email,))
    
    row = cursor.fetchone()  # <-- Mapeo manual
    if row:
        user = {
            'id': row[0],      # <-- Mapeo por índice
            'nombre': row[1],
            'email': row[3]
        }
```

#### ✅ CÓDIGO NUEVO (SQLAlchemy ORM):

```python
# Archivo: routes_orm.py líneas ~97-147
@app.route('/api/user/login', methods=['POST'])
def user_login_orm():
    db = get_session()  # <-- SQLAlchemy Session
    
    # ORM Query
    usuario = db.query(Usuario).filter_by(email=validated_data['email']).first()
    
    # Acceso a atributos del modelo
    if usuario:
        user = {
            'id': usuario.id,        # <-- Atributos del objeto
            'nombre': usuario.nombre,
            'email': usuario.email
        }
        
        # Relaciones ORM
        if usuario.colaborador:  # <-- Navegación por relaciones
            print(usuario.colaborador.especialidad)
```

---

### 4️⃣ Probar Endpoints con Curl o Postman

#### Prueba 1: Registro con Validación del Servidor (SIN required HTML)

```bash
# Enviar datos VACÍOS - debe rechazar
curl -X POST http://localhost:5000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "",
    "apellidoPaterno": "",
    "email": "",
    "password": ""
  }'

# Respuesta esperada (validación del servidor):
{
  "success": false,
  "error": "El campo Nombre es obligatorio"
}
```

#### Prueba 2: Registro Válido con ORM

```bash
curl -X POST http://localhost:5000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan",
    "apellidoPaterno": "Pérez",
    "apellidoMaterno": "García",
    "email": "juan.perez@example.com",
    "password": "password123",
    "password_confirm": "password123"
  }'

# Respuesta esperada (ORM exitoso):
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "user_id": 123
}
```

#### Prueba 3: CRUD de Especies con ORM

```bash
# GET - Listar especies (ORM)
curl http://localhost:5000/api/especies

# POST - Crear especie (requiere login de colaborador)
curl -X POST http://localhost:5000/api/especies \
  -H "Content-Type: application/json" \
  -H "Cookie: session=tu_cookie_aqui" \
  -d '{
    "nombreComun": "Tiburón Ballena",
    "nombreCientifico": "Rhincodon typus",
    "descripcion": "El pez más grande del mundo",
    "idEstadoConservacion": 1
  }'
```

---

### 5️⃣ Verificar en Base de Datos SQL Server

```sql
-- Conectar a SQL Server Management Studio

-- Ver usuarios creados recientemente (ORM)
SELECT TOP 10 
    id, 
    nombre, 
    apellido_paterno, 
    email, 
    fecha_registro,
    activo
FROM Usuarios
ORDER BY fecha_registro DESC;

-- Verificar password hasheado (señal de ORM con Werkzeug)
SELECT TOP 5 
    email, 
    password_hash,
    LEN(password_hash) as hash_length
FROM Usuarios
ORDER BY fecha_registro DESC;
-- Si ves hashes largos (200+ caracteres), el ORM está funcionando

-- Ver colaboradores registrados
SELECT 
    c.id,
    u.email,
    c.especialidad,
    c.grado_academico,
    c.estado_solicitud,
    c.fecha_solicitud
FROM Colaboradores c
JOIN Usuarios u ON c.id_usuario = u.id
ORDER BY c.fecha_solicitud DESC;
```

---

### 6️⃣ Habilitar Logging de SQLAlchemy

Puedes modificar `models.py` para ver las queries SQL que genera el ORM:

```python
# En models.py, línea 337
def get_engine():
    """Crear engine de SQLAlchemy para SQL Server"""
    server = 'DESKTOP-VAT773J'
    database = 'sway'
    username = 'EmilianoLedesma'
    password = 'Emiliano1'
    
    connection_string = f'mssql+pyodbc://{username}:{password}@{server}/{database}?driver=ODBC+Driver+17+for+SQL+Server'
    
    # CAMBIAR echo=False a echo=True para ver queries
    engine = create_engine(connection_string, echo=True)  # <-- Activar logging
    return engine
```

**Con `echo=True` verás en consola:**

```sql
2025-11-20 14:30:00,123 INFO sqlalchemy.engine.Engine 
SELECT usuarios.id, usuarios.nombre, usuarios.email 
FROM usuarios 
WHERE usuarios.email = ?
2025-11-20 14:30:00,124 INFO sqlalchemy.engine.Engine ('juan.perez@example.com',)
```

---

### 7️⃣ Buscar Archivos Específicos del ORM

```bash
# Verificar que existan estos archivos
ls -la models.py          # Modelos SQLAlchemy (354 líneas)
ls -la validators.py      # Validaciones servidor (246 líneas)
ls -la routes_orm.py      # Rutas ORM (597 líneas)
```

**Contenido de models.py:**
- ✅ Línea 6: `from sqlalchemy import ...`
- ✅ Línea 12: `Base = declarative_base()`
- ✅ Línea 77: `class Usuario(Base):`
- ✅ Línea 340: `def get_session():`

**Contenido de routes_orm.py:**
- ✅ Línea 47: `def user_register_orm():`
- ✅ Línea 51: `db = get_session()`
- ✅ Línea 66: `nuevo_usuario = Usuario(...)`
- ✅ Línea 77: `db.add(nuevo_usuario)`
- ✅ Línea 78: `db.commit()`

---

## 🎯 CHECKLIST DE VERIFICACIÓN

### ✅ ORM está funcionando si:

- [ ] Ves "✅ Rutas ORM registradas" en logs del servidor
- [ ] Archivo `models.py` existe con 354 líneas
- [ ] Archivo `routes_orm.py` existe con 597 líneas
- [ ] Archivo `validators.py` existe con 246 líneas
- [ ] Puedes enviar datos vacíos y el servidor rechaza (no el HTML)
- [ ] Las contraseñas en BD son hashes largos, no texto plano
- [ ] Los endpoints `/api/user/*` y `/api/especies` funcionan
- [ ] Con `echo=True` ves queries SQL generadas por SQLAlchemy

### ❌ ORM NO está funcionando si:

- [ ] No ves mensaje "Rutas ORM registradas" en logs
- [ ] Los archivos `models.py`, `validators.py`, `routes_orm.py` no existen
- [ ] Las validaciones HTML (required) siguen funcionando
- [ ] Las contraseñas en BD son texto plano
- [ ] Solo funcionan rutas antiguas con pyodbc

---

## 🔬 PRUEBA DEFINITIVA

**Abre dos ventanas de terminal:**

### Terminal 1 - Servidor con Logging:
```bash
# Editar models.py, cambiar echo=False a echo=True
# Luego ejecutar:
python app.py
```

### Terminal 2 - Hacer Request:
```bash
curl -X POST http://localhost:5000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test",
    "apellidoPaterno": "ORM",
    "email": "test.orm@example.com",
    "password": "test123",
    "password_confirm": "test123"
  }'
```

**En Terminal 1 deberías ver:**
```
✅ Rutas ORM registradas exitosamente
...
INFO sqlalchemy.engine.Engine SELECT usuarios.id FROM usuarios WHERE usuarios.email = ?
INFO sqlalchemy.engine.Engine ('test.orm@example.com',)
INFO sqlalchemy.engine.Engine BEGIN (implicit)
INFO sqlalchemy.engine.Engine INSERT INTO usuarios (nombre, apellido_paterno, ...) VALUES (?, ?, ...)
INFO sqlalchemy.engine.Engine COMMIT
```

**Si ves estos logs de SQLAlchemy:** ✅ **El ORM está 100% funcional**

---

## 📋 RESUMEN

| Característica | SQL Directo (app.py) | SQLAlchemy ORM (routes_orm.py) |
|----------------|----------------------|-------------------------------|
| Archivo | app.py | routes_orm.py |
| Conexión | `pyodbc.connect()` | `get_session()` |
| Query | `cursor.execute("SELECT...")` | `db.query(Usuario).filter_by()` |
| Mapeo | Manual `row[0], row[1]` | Automático `usuario.nombre` |
| Relaciones | JOINs manuales | `usuario.colaborador` |
| Validaciones | Dispersas | Centralizadas en `validators.py` |
| Seguridad | SQL parametrizado | ORM + Validaciones |
| Mantenibilidad | Media | Alta |

**El proyecto usa AMBOS sistemas (híbrido) para cumplir requisitos sin romper código existente.**
