# Guía de Despliegue SWAY — Render.com

> Stack desplegado: FastAPI + Uvicorn | Flask + Gunicorn | PostgreSQL (migración desde SQL Server) | React + Vite (Vercel/Netlify)

---

## Arquitectura final en la nube

```
Internet (HTTPS)
        |
        ├── Render Web Service: FastAPI    → https://sway-api.onrender.com/api/
        ├── Render Web Service: Flask Web1 → https://sway-web.onrender.com/
        ├── Render PostgreSQL              → interno (solo accesible por los servicios)
        └── Vercel / Netlify: React Web2  → https://sway-portal.vercel.app/
```

**Importante:** En Render los servicios se comunican entre sí usando la URL interna de la base de datos — PostgreSQL **no es accesible desde Internet**, solo desde los servicios del mismo proyecto.

---

## Requisitos previos

- Cuenta en [Render.com](https://render.com) (tier gratuito disponible)
- Cuenta en GitHub con el repositorio del proyecto subido (privado o público)
- Node.js instalado localmente para hacer el build de React antes de subir
- Cuenta en [Vercel](https://vercel.com) o [Netlify](https://netlify.com) para Web2 (gratuitos)

### Limitaciones del tier gratuito de Render

| Recurso | Free Tier |
|---|---|
| Web Services | Se duermen tras 15 min de inactividad — primera petición tarda ~30-60s |
| PostgreSQL | **Expira a los 90 días** — tienes que recrearla o pagar ($7/mes) |
| RAM | 512 MB por servicio |
| Ancho de banda | 100 GB/mes |
| Builds concurrentes | 1 |

> Para demostración académica el free tier es suficiente. Para producción real considera el plan pagado o Railway.app.

---

## FASE 1 — Preparar el repositorio en GitHub

### 1.1 Crear el repositorio

Si aún no tienes el código en GitHub:

```bash
# Desde Git Bash en Windows, en la carpeta del proyecto
cd "C:/Users/Emiliano/Videos/SWAY POO"

git init
git add .
git commit -m "Initial commit — SWAY POO"

# Crear repositorio en GitHub.com (puedes hacerlo desde la web)
git remote add origin https://github.com/TU_USUARIO/sway-poo.git
git push -u origin master
```

> **Recomendación:** Crea el repo como **privado** ya que contiene credenciales en el historial de commits. Asegúrate de que el `.gitignore` excluya `.env` y `__pycache__`.

### 1.2 Verificar el .gitignore

Asegúrate de que el archivo `.gitignore` en la raíz del proyecto contenga al menos:

```gitignore
.env
__pycache__/
*.pyc
venv/
node_modules/
web2/dist/
*.db
```

---

## FASE 2 — Migrar la base de datos a PostgreSQL

Esta es la parte más importante. Render no ofrece SQL Server — hay que migrar a PostgreSQL.

### 2.1 Crear la base de datos PostgreSQL en Render

1. Entra a [dashboard.render.com](https://dashboard.render.com)
2. Clic en **New → PostgreSQL**
3. Configura:

| Campo | Valor |
|---|---|
| Name | `sway-db` |
| Database | `sway` |
| User | `sway_app` |
| Region | Oregon (US West) o la más cercana |
| Plan | **Free** |

4. Clic en **Create Database**
5. Espera ~2 minutos y anota los valores de la sección **Connections**:
   - **Internal Database URL** — para los servicios de Render (úsala en variables de entorno)
   - **External Database URL** — para conectarte desde tu máquina y cargar los datos

### 2.2 Ejecutar el script PostgreSQL desde tu máquina

Necesitas `psql` instalado. Puedes descargarlo como parte de [PostgreSQL para Windows](https://www.postgresql.org/download/windows/).

```bash
# La External Database URL tiene el formato:
# postgresql://sway_app:PASSWORD@dpg-XXXX.oregon-postgres.render.com/sway

# Ejecutar el script de estructura y datos
psql "postgresql://sway_app:PASSWORD@dpg-XXXX.oregon-postgres.render.com/sway" \
  -f "C:/Users/Emiliano/Videos/SWAY POO/SWAY_PostgreSQL.sql"
```

> El archivo `SWAY_PostgreSQL.sql` en la raíz del proyecto ya tiene el DDL y DML convertidos para PostgreSQL.

Si no tienes `psql` instalado, también puedes usar **pgAdmin** (GUI):
1. Abrir pgAdmin → Add New Server
2. En "Connection" pega los datos de la External Database URL
3. Click derecho sobre la base de datos → Query Tool → pegar y ejecutar `SWAY_PostgreSQL.sql`

### 2.3 Verificar la migración

```sql
-- Desde psql o pgAdmin
SELECT 'Usuarios' AS Tabla, COUNT(*) AS Total FROM Usuarios
UNION ALL SELECT 'Especies', COUNT(*) FROM Especies
UNION ALL SELECT 'Eventos', COUNT(*) FROM Eventos
UNION ALL SELECT 'Productos', COUNT(*) FROM Productos;
```

Debes ver los conteos: 24 usuarios, 17 especies, 5 eventos, 5 productos.

---

## FASE 3 — Adaptar el código para PostgreSQL

El código actual usa `pyodbc` con `ODBC Driver 17/18 for SQL Server`. Hay que cambiar el driver a `psycopg2` para PostgreSQL.

### 3.1 Instalar psycopg2

```bash
# En tu entorno virtual local
pip install psycopg2-binary
```

Agrega al `requirements.txt`:
```
psycopg2-binary==2.9.9
```

### 3.2 Actualizar db.py

Abre `db.py` y reemplaza la función `get_db_connection`:

```python
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'], sslmode='require')
        return conn
    except Exception as e:
        print(f"Error de conexión: {e}")
        return None
```

### 3.3 Actualizar app/data/database.py

Abre `app/data/database.py` y ajusta la cadena de conexión del ORM:

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

def get_engine():
    # Render provee DATABASE_URL con prefijo "postgres://" — SQLAlchemy necesita "postgresql://"
    database_url = os.environ['DATABASE_URL'].replace('postgres://', 'postgresql://', 1)
    return create_engine(database_url)

def get_session():
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    return Session()
```

### 3.4 Cambiar las queries que usan sintaxis SQL Server

Busca en el código cualquier query con sintaxis específica de SQL Server:

```bash
# En Git Bash
grep -rn "GETDATE()" app/
grep -rn "TOP " app/
grep -rn "IDENTITY" app/
grep -rn "ISNULL(" app/
grep -rn "NOLOCK" app/
```

Reemplazos necesarios:

| SQL Server | PostgreSQL |
|---|---|
| `GETDATE()` | `NOW()` |
| `SELECT TOP 10 ...` | `SELECT ... LIMIT 10` |
| `ISNULL(col, val)` | `COALESCE(col, val)` |
| `CONVERT(varchar, col)` | `CAST(col AS TEXT)` |
| `+` para concatenar strings | `\|\|` |
| `BIT` (tipo) | `BOOLEAN` |

### 3.5 Crear el archivo .env de producción local (para pruebas)

```ini
# .env (NO subir a GitHub)
DATABASE_URL=postgresql://sway_app:PASSWORD@dpg-XXXX.oregon-postgres.render.com/sway

SECRET_KEY=genera_una_clave_con_python_secrets
DEBUG=False

MAIL_HOST=smtp.mailersend.net
MAIL_PORT=2525
MAIL_USER=MS_4yx6wE@test-2p0347z0d57lzdrn.mlsender.net
MAIL_PASS=mssp.JeFWAVt.0p7kx4x2nmvg9yjr.aAEdHof

WEB2_URL=https://sway-portal.vercel.app
```

### 3.6 Crear el Procfile para Render

Render necesita saber cómo arrancar cada servicio. Crea un archivo `Procfile` en la raíz (sin extensión):

```
# Para FastAPI
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

> Render asigna el puerto automáticamente via `$PORT` — no uses 8000 hardcodeado.

Y un segundo archivo `Procfile.flask` o usa `render.yaml` (ver Fase 5).

### 3.7 Actualizar CORS en app/main.py

```python
allow_origins=[
    "https://sway-portal.vercel.app",    # Web2 en producción
    "https://sway-web.onrender.com",     # Web1 Flask en producción
    "http://localhost:5173",             # Web2 local
    "http://localhost:5000",             # Web1 local
]
```

---

## FASE 4 — Desplegar FastAPI en Render

### 4.1 Crear el Web Service para FastAPI

1. En Render Dashboard → **New → Web Service**
2. Conecta tu repositorio de GitHub
3. Configura:

| Campo | Valor |
|---|---|
| Name | `sway-api` |
| Branch | `master` |
| Root Directory | (dejar vacío — raíz del proyecto) |
| Runtime | **Python 3** |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Plan | **Free** |

### 4.2 Configurar variables de entorno para FastAPI

En la pestaña **Environment** del servicio `sway-api`, agrega:

| Key | Value |
|---|---|
| `DATABASE_URL` | Internal Database URL de Render PostgreSQL |
| `SECRET_KEY` | Tu clave secreta generada |
| `DEBUG` | `False` |
| `MAIL_HOST` | `smtp.mailersend.net` |
| `MAIL_PORT` | `2525` |
| `MAIL_USER` | Tu usuario SMTP |
| `MAIL_PASS` | Tu contraseña SMTP |
| `WEB2_URL` | `https://sway-portal.vercel.app` |
| `PYTHON_VERSION` | `3.11.0` |

> La **Internal Database URL** tiene el formato `postgresql://sway_app:PASSWORD@dpg-XXXX/sway` — sin el host externo. Úsala aquí para máxima velocidad (red interna de Render).

### 4.3 Esperar el build y verificar

El build tarda entre 2-5 minutos. Cuando termine:

```bash
# Verificar que FastAPI responde
curl https://sway-api.onrender.com/api/estadisticas

# Ver la documentación Swagger
# Abrir en el navegador:
# https://sway-api.onrender.com/docs
```

Si algo falla, ve a **Logs** en el dashboard de Render para ver el error.

---

## FASE 5 — Desplegar Flask Web1 en Render

### 5.1 Crear el Web Service para Flask

1. **New → Web Service** → mismo repositorio
2. Configura:

| Campo | Valor |
|---|---|
| Name | `sway-web` |
| Branch | `master` |
| Root Directory | (dejar vacío) |
| Runtime | **Python 3** |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |
| Plan | **Free** |

### 5.2 Variables de entorno para Flask

Mismas variables que FastAPI más:

| Key | Value |
|---|---|
| `DATABASE_URL` | Internal Database URL |
| `SECRET_KEY` | Misma clave secreta |
| `DEBUG` | `False` |
| `FLASK_ENV` | `production` |
| `SWAY_API_URL` | `https://sway-api.onrender.com` |

### 5.3 Actualizar las URLs de la API en Flask

En los templates de Flask que llaman a la API (`templates/*.html`), asegúrate de que las llamadas usen la variable de entorno:

En `app.py`, puedes exponer la URL de la API a los templates:

```python
@app.context_processor
def inject_api_url():
    return dict(API_BASE=os.environ.get('SWAY_API_URL', 'http://localhost:8000'))
```

Y en los templates:

```html
<!-- En lugar de http://localhost:8000/api/estadisticas -->
<script>
  const API_BASE = "{{ API_BASE }}/api";
</script>
```

---

## FASE 6 — Desplegar React Web2 en Vercel

Vercel es la mejor opción para React + Vite porque:
- Build automático en cada push a GitHub
- CDN global incluida
- HTTPS automático
- Integración nativa con React + Vite

### 6.1 Actualizar la URL base en el cliente de la API

Abre `web2/src/api/client.js` y cambia la URL base:

```javascript
// Antes (desarrollo local)
const BASE = 'http://localhost:8000/api'

// Después (producción — usa variable de entorno de Vite)
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
```

Crea el archivo `web2/.env.production`:

```ini
VITE_API_URL=https://sway-api.onrender.com/api
```

Y `web2/.env` (para desarrollo local):

```ini
VITE_API_URL=http://localhost:8000/api
```

### 6.2 Actualizar vite.config.js para producción

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',                    // Raíz en Vercel (no /portal/ como en Nginx local)
  build: {
    outDir: 'dist',
  }
})
```

### 6.3 Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) → **Add New Project**
2. Importa el mismo repositorio de GitHub
3. Configura:

| Campo | Valor |
|---|---|
| Framework Preset | **Vite** |
| Root Directory | `web2` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

4. En **Environment Variables** agrega:
   - `VITE_API_URL` = `https://sway-api.onrender.com/api`

5. Clic en **Deploy**

Vercel hace el build automáticamente. En ~2 minutos tendrás la URL: `https://sway-portal.vercel.app`

### 6.4 Actualizar CORS con la URL real de Vercel

Una vez que Vercel te asigne la URL definitiva, actualiza la variable `WEB2_URL` y los CORS en Render:

```python
# app/main.py
allow_origins=[
    "https://sway-por-XXXX.vercel.app",   # URL real asignada por Vercel
    "https://sway-portal.vercel.app",      # Si tienes dominio personalizado en Vercel
    "http://localhost:5173",
]
```

Después de editar, haz commit y push — Render redesplegará automáticamente.

---

## FASE 7 — Configurar render.yaml (opcional pero recomendado)

En lugar de configurar cada servicio manualmente, puedes usar un archivo `render.yaml` en la raíz del proyecto para definir todos los servicios de una vez:

```yaml
# render.yaml
services:
  - type: web
    name: sway-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: sway-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: DEBUG
        value: "False"
      - key: PYTHON_VERSION
        value: "3.11.0"

  - type: web
    name: sway-web
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: sway-db
          property: connectionString
      - key: SECRET_KEY
        sync: false
      - key: FLASK_ENV
        value: production

databases:
  - name: sway-db
    databaseName: sway
    user: sway_app
    plan: free
```

Con este archivo, al conectar el repo en Render se configurarán todos los servicios automáticamente.

---

## FASE 8 — Verificación completa del stack

Una vez que todos los servicios estén desplegados:

```bash
# FastAPI responde
curl https://sway-api.onrender.com/api/estadisticas

# Swagger UI accesible
# https://sway-api.onrender.com/docs

# Flask Web1 responde
curl https://sway-web.onrender.com/

# React Web2 carga
# https://sway-portal.vercel.app/
```

Para una prueba completa end-to-end:

1. Abrir `https://sway-portal.vercel.app/` → debe cargar el login
2. Registrar un colaborador → debe llegar el correo de bienvenida
3. Login con las credenciales → debe acceder al portal
4. Ver especies → debe cargar la lista desde FastAPI en Render
5. Descargar PDF → debe generarse y descargarse correctamente

---

## FASE 9 — Dominio personalizado (opcional)

Si tienes un dominio propio (por ejemplo de Namecheap con GitHub Student Pack):

### En Render (FastAPI y Flask):
1. Dashboard del servicio → **Settings → Custom Domains**
2. Agrega `api.tu-dominio.com` para FastAPI y `tu-dominio.com` para Flask
3. Render te dará un registro CNAME — agrégalo en tu proveedor DNS
4. El certificado SSL se genera automáticamente (Let's Encrypt)

### En Vercel (React):
1. Project Settings → **Domains**
2. Agrega `portal.tu-dominio.com`
3. Vercel te dará el CNAME — agrégalo en tu DNS

---

## Comandos de mantenimiento

### Redesplegar tras un cambio

```bash
# Solo necesitas hacer push a GitHub — Render y Vercel redesplegan automáticamente
git add .
git commit -m "fix: descripción del cambio"
git push origin master
```

### Ver logs en tiempo real

En Render Dashboard → selecciona el servicio → **Logs**

O desde la CLI de Render (si la instalaste):
```bash
render logs sway-api --tail
render logs sway-web --tail
```

### Reiniciar un servicio manualmente

En Render Dashboard → servicio → **Manual Deploy → Deploy latest commit**

### Conectarse a la base de datos para diagnóstico

```bash
# Desde tu máquina, usando la External Database URL
psql "postgresql://sway_app:PASSWORD@dpg-XXXX.oregon-postgres.render.com/sway"

-- Ver últimos usuarios registrados
SELECT id, nombre, email, fecha_registro FROM Usuarios ORDER BY fecha_registro DESC LIMIT 5;

-- Ver estado de colaboradores
SELECT estado_solicitud, COUNT(*) FROM Colaboradores GROUP BY estado_solicitud;
```

---

## Resumen de cambios requeridos en el código

| Archivo | Cambio necesario | Motivo |
|---|---|---|
| `requirements.txt` | Agregar `psycopg2-binary` | Driver PostgreSQL |
| `db.py` | Reemplazar `pyodbc` por `psycopg2` | Motor de BD distinto |
| `app/data/database.py` | URL de SQLAlchemy desde `DATABASE_URL` | Variable de entorno Render |
| `app/main.py` | CORS con URLs de Render/Vercel | Producción |
| `web2/src/api/client.js` | `BASE = import.meta.env.VITE_API_URL` | URL dinámica |
| `web2/.env.production` | `VITE_API_URL=https://sway-api.onrender.com/api` | Build producción |
| `web2/vite.config.js` | `base: '/'` (no `/portal/`) | Vercel sirve desde raíz |
| `Procfile` | `web: uvicorn app.main:app ...` | Render necesita este archivo |

---

## URLs del sistema en producción (Render + Vercel)

| Servicio | URL |
|---|---|
| Web1 Flask (portal público) | `https://sway-web.onrender.com/` |
| Web2 React (portal colaboradores) | `https://sway-portal.vercel.app/` |
| API REST FastAPI | `https://sway-api.onrender.com/api/` |
| Documentación Swagger | `https://sway-api.onrender.com/docs` |
| Base de datos PostgreSQL | Solo accesible internamente desde los servicios de Render |

---

## Checklist de despliegue — Render

- [ ] Repositorio en GitHub actualizado con todos los cambios
- [ ] `requirements.txt` incluye `psycopg2-binary` y `gunicorn`
- [ ] `db.py` usa `psycopg2` y lee `DATABASE_URL`
- [ ] `app/data/database.py` ORM usa `DATABASE_URL` (prefijo `postgresql://`)
- [ ] Queries SQL Server migradas a sintaxis PostgreSQL
- [ ] Base de datos `sway` creada en Render PostgreSQL
- [ ] Script `SWAY_PostgreSQL.sql` ejecutado con éxito
- [ ] Datos verificados (24 usuarios, 17 especies, 5 productos)
- [ ] Servicio `sway-api` desplegado y respondiendo
- [ ] Servicio `sway-web` desplegado y respondiendo
- [ ] Variables de entorno configuradas en ambos servicios
- [ ] `web2/.env.production` con `VITE_API_URL` correcto
- [ ] Web2 desplegada en Vercel con build exitoso
- [ ] CORS en FastAPI incluye URL de Vercel
- [ ] `https://sway-api.onrender.com/docs` carga Swagger UI
- [ ] Login end-to-end funciona
- [ ] Correo de bienvenida se envía al registrar colaborador
