# Plan de Acción — Separación Web 1 / API en app.py

## Problema actual

`app.py` tiene **3899 líneas** y mezcla dos responsabilidades en el mismo archivo:

- **Web 1**: rutas que devuelven HTML (`render_template`) — 13 rutas de página
- **API**: rutas que devuelven JSON (`jsonify`) — 50+ endpoints `/api/*`

Además contiene configuración de Flask, conexión a BD, helpers y modelos importados.

Todo esto en un solo archivo hace que:
- Sea difícil de mantener (buscar un endpoint requiere scrollear cientos de líneas)
- La separación entre "sitio web" y "API" no sea clara estructuralmente
- Agregar nuevas rutas genere más desorden

---

## Objetivo final

Pasar de un solo `app.py` monolítico a una estructura modular con **Blueprints de Flask**:

```
SWAY POO/
├── app.py                        ← solo inicialización (30 líneas)
├── extensions.py                 ← CORS, configuración compartida
├── db.py                         ← get_db_connection() y helpers de BD
│
├── blueprints/
│   ├── web/                      ← Web 1: rutas de páginas HTML
│   │   ├── __init__.py
│   │   └── routes.py
│   │
│   └── api/                      ← API: rutas JSON
│       ├── __init__.py
│       ├── especies.py           ← /api/especies/*
│       ├── colaboradores.py      ← /api/colaboradores/*
│       ├── auth.py               ← /api/user/*, /api/auth/*
│       ├── pedidos.py            ← /api/pedidos/*, /api/carrito/*
│       ├── productos.py          ← /api/productos, /api/producto/*
│       ├── eventos.py            ← /api/eventos/*
│       ├── estadisticas.py       ← /api/estadisticas, /api/impacto-sostenible
│       ├── direcciones.py        ← /api/direcciones/*
│       └── catalogos.py          ← /api/estados-conservacion, /api/amenazas, etc.
│
├── models.py                     ← sin cambios
├── validators.py                 ← sin cambios
├── templates/                    ← sin cambios
└── static/                       ← sin cambios
```

---

## Por qué Blueprints

Un **Blueprint** en Flask es un grupo de rutas registrable. Funciona exactamente igual que `@app.route(...)` pero en lugar de `app` se usa el nombre del blueprint:

```python
# Antes (todo en app.py)
@app.route('/api/especies')
def get_especies():
    return jsonify(...)

# Después (en blueprints/api/especies.py)
from flask import Blueprint
especies_bp = Blueprint('especies', __name__)

@especies_bp.route('/api/especies')
def get_especies():
    return jsonify(...)
```

Y en `app.py` solo se registran:
```python
from blueprints.api.especies import especies_bp
app.register_blueprint(especies_bp)
```

El comportamiento es **100% idéntico** para el usuario y para Web 2. Las URLs no cambian.

---

## Fases del plan

---

### FASE 0 — Preparación (antes de tocar nada)

**Objetivo**: tener un respaldo y entender qué se va a mover.

**Pasos**:

1. Crear rama de git para el refactor:
   ```bash
   git checkout -b refactor/blueprints
   ```

2. Verificar que el proyecto funciona actualmente (Flask corre, Web 2 consume la API).

3. Mapear las rutas por categoría (ya hecho — ver tabla al final).

**Riesgo**: ninguno — aún no se toca código.

---

### FASE 1 — Extraer helpers compartidos

**Objetivo**: aislar el código que usan todas las rutas para que los blueprints lo puedan importar.

**Archivo a crear: `db.py`**

Mover desde `app.py` (líneas ~5-80):
```python
# db.py
import pyodbc
import os

def get_db_connection():
    # ... código exacto de app.py línea 69
    pass

def construir_nombre_completo(nombre, apellido_paterno, apellido_materno, prefijo=""):
    # ... código exacto de app.py línea 36
    pass
```

**Archivo a crear: `extensions.py`**

```python
# extensions.py
from flask_cors import CORS

def init_extensions(app):
    CORS(app, supports_credentials=True, origins=['http://localhost:5173'])
```

**En `app.py`**, reemplazar las definiciones por imports:
```python
from db import get_db_connection, construir_nombre_completo
from extensions import init_extensions
```

**Riesgo bajo**: solo se mueven funciones de utilidad. Las rutas no cambian todavía.

---

### FASE 2 — Blueprint de Web 1 (páginas HTML)

**Objetivo**: extraer las 13 rutas de páginas a su propio módulo.

**Rutas a mover** (líneas 83–129 y 933–939 de `app.py`):

| Ruta | Función | Línea actual |
|------|---------|-------------|
| `/` | `index` | 83 |
| `/especies` | `especies` | 88 |
| `/eventos` | `eventos` | 93 |
| `/biblioteca` | `biblioteca` | 98 |
| `/tienda` | `tienda` | 103 |
| `/mis-pedidos` | `mis_pedidos` | 108 |
| `/payment` | `payment` | 113 |
| `/toma-accion` | `toma_accion` | 118 |
| `/starter-page` | `starter_page` | 123 |
| `/login` | `login_page` | 933 |
| `/register` | `register_page` | 938 |
| `/portal-colaboradores` | `portal_colaboradores` | 2860 |
| `/test_dropdown.html` | `test_dropdown` | 1197 |

**Archivo a crear: `blueprints/web/__init__.py`** (vacío)

**Archivo a crear: `blueprints/web/routes.py`**:
```python
from flask import Blueprint, render_template

web_bp = Blueprint('web', __name__)

@web_bp.route('/')
def index():
    return render_template('index.html')

@web_bp.route('/especies')
def especies():
    return render_template('especies.html')

# ... resto de rutas idénticas
```

**En `app.py`**:
```python
from blueprints.web.routes import web_bp
app.register_blueprint(web_bp)
```

**Riesgo bajo**: las rutas de página son simples, solo hacen `render_template`. No hay lógica de BD.

---

### FASE 3 — Blueprint de API: Especies

**Objetivo**: extraer el grupo más importante de la API a su propio módulo.

**Rutas a mover**:

| Ruta | Método | Función | Línea |
|------|--------|---------|-------|
| `/api/especies` | GET | `get_especies` | 2941 |
| `/api/especies/<id>` | GET | `get_especie_detalle` | 3121 |
| `/api/especies` | POST | `create_especie` | 3225 |
| `/api/especies/<id>` | PUT | `update_especie` | 3363 |
| `/api/especies/<id>` | DELETE | `delete_especie` | 3498 |
| `/api/especies/estadisticas` | GET | `get_especies_estadisticas` | 2088 |
| `/api/especies/opciones-filtros` | GET | `get_opciones_filtros` | 2182 |
| `/api/especies/busqueda-avanzada` | GET | `busqueda_avanzada_especies` | 2234 |
| `/api/estados-conservacion` | GET | `get_estados_conservacion` | 3552 |
| `/api/amenazas` | GET | `get_amenazas` | 3578 |
| `/api/habitats` | GET | `get_habitats` | 3604 |
| `/api/tipos-especies` | GET | `get_tipos_especies` | 2042 |

**Archivo a crear: `blueprints/api/especies.py`**:
```python
from flask import Blueprint, request, jsonify, session
from db import get_db_connection

especies_bp = Blueprint('especies', __name__)

@especies_bp.route('/api/especies', methods=['GET'])
def get_especies():
    # ... código exacto del app.py actual
    pass

@especies_bp.route('/api/especies', methods=['POST'])
def create_especie():
    # ... código exacto del app.py actual
    pass

# ... resto de rutas
```

**En `app.py`**:
```python
from blueprints.api.especies import especies_bp
app.register_blueprint(especies_bp)
```

**Riesgo medio**: estas rutas tienen lógica de BD compleja. Copiar exactamente, verificar que `get_db_connection` y `session` sean accesibles vía imports.

**Prueba**: después de mover, ejecutar el proyecto y probar desde Web 2 que el CRUD de especies sigue funcionando.

---

### FASE 4 — Blueprint de API: Colaboradores y Auth

**Objetivo**: extraer autenticación y gestión de colaboradores.

**Rutas a mover**:

| Ruta | Método | Línea |
|------|--------|-------|
| `/api/colaboradores/login` | POST | 2610 |
| `/api/colaboradores/register` | POST | 2680 |
| `/api/colaboradores/logout` | POST | 1102 |
| `/api/colaboradores/profile` | GET | 2865 |
| `/api/colaboradores/status` | GET | 1170 |
| `/api/colaboradores/check-email` | POST | 2804 |
| `/api/colaboradores/avistamientos` | GET | 3630 |
| `/api/user/login` | POST | 943 |
| `/api/user/register` | POST | 1009 |
| `/api/user/logout` | POST | 1089 |
| `/api/user/status` | GET | 1115 |
| `/api/auth/register` | POST | 1279 |
| `/api/auth/login` | POST | 1346 |

**Archivo a crear: `blueprints/api/colaboradores.py`**

**Riesgo medio-alto**: rutas con lógica de autenticación y sesiones. Probar login/logout desde Web 2 y Web 1 después de mover.

---

### FASE 5 — Blueprints restantes de API

Siguiendo el mismo patrón, crear un módulo por dominio:

**`blueprints/api/pedidos.py`** — rutas de compras:
- `/api/pedidos/crear` (POST, línea 1555)
- `/api/pedidos/mis-pedidos` (GET, 1806)
- `/api/pedidos/usuario/<id>` (GET, 1766)
- `/api/pedidos/detalle/<id>` (GET, 1870)
- `/api/pedidos/reordenar/<id>` (POST, 1945)
- `/api/carrito/agregar` (POST, 1393)
- `/api/setup-tienda` (POST, 1212)

**`blueprints/api/productos.py`** — catálogo de tienda:
- `/api/productos` (GET, 670)
- `/api/producto/<id>` (GET, 801)
- `/api/reseñas/<id>` (GET, 865)
- `/api/materiales` (GET, 902)
- `/api/categorias` (GET, 2003)

**`blueprints/api/eventos.py`** — eventos de conservación:
- `/api/eventos` (GET, 3713)
- `/api/eventos/crear` (POST, 2373)
- `/api/tipos-evento` (GET, 3831)
- `/api/modalidades` (GET, 3858)

**`blueprints/api/estadisticas.py`** — métricas y dashboard:
- `/api/estadisticas` (GET, 530)
- `/api/impacto-sostenible` (GET, 598)
- `/api/avistamientos` (GET, 3672)
- `/api/reportar-avistamiento` (POST, 332)

**`blueprints/api/direcciones.py`** — catálogo geográfico:
- `/api/direcciones/estados` (GET, 1439)
- `/api/direcciones/municipios/<id>` (GET, 1464)
- `/api/direcciones/colonias/<id>` (GET, 1494)
- `/api/direcciones/calles/<id>` (GET, 1525)

**`blueprints/api/catalogos.py`** — datos de referencia:
- `/api/tipos-tarjeta` (GET, 1845)
- `/api/regiones` (GET, 2065)
- `/api/newsletter` (POST, 471)
- `/api/contacto` (POST, 2297)
- `/api/procesar-donacion` (POST, 2483)
- `/api/tipos-tarjeta` (GET, 1845)

---

### FASE 6 — Limpiar app.py

**Objetivo**: reducir `app.py` a solo la inicialización de la app.

**`app.py` final (~40 líneas)**:
```python
from flask import Flask
from extensions import init_extensions
from models import init_db

# Blueprints — Web 1
from blueprints.web.routes import web_bp

# Blueprints — API
from blueprints.api.especies import especies_bp
from blueprints.api.colaboradores import colaboradores_bp
from blueprints.api.pedidos import pedidos_bp
from blueprints.api.productos import productos_bp
from blueprints.api.eventos import eventos_bp
from blueprints.api.estadisticas import estadisticas_bp
from blueprints.api.direcciones import direcciones_bp
from blueprints.api.catalogos import catalogos_bp

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret')

init_extensions(app)
init_db(app)

app.register_blueprint(web_bp)
app.register_blueprint(especies_bp)
app.register_blueprint(colaboradores_bp)
app.register_blueprint(pedidos_bp)
app.register_blueprint(productos_bp)
app.register_blueprint(eventos_bp)
app.register_blueprint(estadisticas_bp)
app.register_blueprint(direcciones_bp)
app.register_blueprint(catalogos_bp)

@app.errorhandler(404)
def not_found(e): ...

@app.errorhandler(500)
def internal_error(e): ...

if __name__ == '__main__':
    app.run(debug=True)
```

---

## Regla de oro durante el refactor

> **Copiar, no reescribir.**

El código dentro de cada función de ruta no cambia ni una línea. Solo cambia:
1. Dónde está el archivo
2. `@app.route(...)` → `@nombre_bp.route(...)`
3. Los imports al principio del archivo

---

## Qué no cambia para Web 2

Absolutamente nada. Web 2 (React) consume URLs como `/api/especies`, `/api/colaboradores/login`, etc. Los blueprints registran exactamente las mismas URLs — Flask no distingue si la ruta viene de `app.py` o de un blueprint. Para el cliente HTTP, es transparente.

---

## Criterios de éxito por fase

| Fase | Criterio de éxito |
|------|------------------|
| 0 | `git status` limpio en rama nueva |
| 1 | `python app.py` arranca sin errores |
| 2 | Todas las páginas de Web 1 cargan correctamente |
| 3 | Web 2 puede listar, crear, editar y eliminar especies |
| 4 | Web 2 puede hacer login, ver perfil, ver avistamientos |
| 5 | Tienda, eventos y demás endpoints responden igual que antes |
| 6 | `app.py` tiene menos de 50 líneas. Todos los tests pasan |

---

## Estimación de esfuerzo

| Fase | Trabajo | Riesgo |
|------|---------|--------|
| 0 — Preparación | 10 min | Ninguno |
| 1 — Helpers compartidos | 20 min | Bajo |
| 2 — Blueprint Web 1 | 20 min | Bajo |
| 3 — Blueprint Especies | 30 min | Medio |
| 4 — Blueprint Colaboradores | 40 min | Medio-alto |
| 5 — Blueprints restantes | 60 min | Bajo (patrón repetitivo) |
| 6 — Limpieza app.py | 10 min | Bajo |
| **Total** | **~3 horas** | |

---

*Generado por Claude Code — SWAY POO, 2026-03-17*
