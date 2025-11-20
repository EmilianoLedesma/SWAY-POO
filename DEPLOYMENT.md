# ☁️ GUÍA DE DEPLOYMENT - SWAY

## 🎯 IMPORTANTE: Base de Datos Local

Tu proyecto usa **SQL Server local** con esta conexión:
```python
server = 'DESKTOP-VAT773J'
database = 'sway'
username = 'EmilianoLedesma'
password = 'Emiliano1'
```

**PROBLEMA:** Esto NO funcionará en un servidor en la nube.

---

## 📋 Opciones de Deployment

### Opción 1: Render.com (GRATIS) ⭐ Recomendado

**Limitaciones:**
- ❌ NO soporta SQL Server directamente
- ✅ Soporta PostgreSQL gratis

**Solución:**
1. Migrar de SQL Server a PostgreSQL
2. Usar servicio de BD gratuito de Render

**Pasos:**

#### 1. Crear cuenta en Render.com
- Ir a https://render.com
- Registrarse con GitHub

#### 2. Preparar proyecto para PostgreSQL

**Crear archivo `.env`:**
```bash
# .env (NO subir a GitHub - está en .gitignore)
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=tu_clave_secreta_aqui
DEBUG=False
```

**Modificar `models.py`:**
```python
import os
from dotenv import load_dotenv

load_dotenv()

def get_engine():
    """Crear engine que funcione con SQL Server local Y PostgreSQL en nube"""
    database_url = os.getenv('DATABASE_URL')
    
    if database_url:
        # Producción - PostgreSQL en Render
        engine = create_engine(database_url, echo=False)
    else:
        # Desarrollo local - SQL Server
        server = 'DESKTOP-VAT773J'
        database = 'sway'
        username = 'EmilianoLedesma'
        password = 'Emiliano1'
        connection_string = f'mssql+pyodbc://{username}:{password}@{server}/{database}?driver=ODBC+Driver+17+for+SQL+Server'
        engine = create_engine(connection_string, echo=False)
    
    return engine
```

#### 3. Crear `Procfile` para Render:
```
web: gunicorn app:app
```

#### 4. Actualizar `requirements.txt`:
```txt
Flask==2.3.3
Flask-CORS==4.0.0
SQLAlchemy==2.0.35
python-dotenv==1.0.0
Werkzeug==2.3.7
gunicorn==21.2.0
psycopg2-binary==2.9.9  # Para PostgreSQL
```

#### 5. Deployment en Render:
1. Crear nuevo "Web Service"
2. Conectar con GitHub
3. Configurar:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
4. Agregar PostgreSQL database (gratis)
5. Copiar `DATABASE_URL` a variables de entorno

**Costo:** ✅ GRATIS (con limitaciones)
- 750 horas/mes gratis
- 512 MB RAM
- PostgreSQL gratis con 1GB storage

---

### Opción 2: Railway.app (GRATIS con crédito) ⭐

**Ventajas:**
- ✅ Más fácil de configurar
- ✅ PostgreSQL incluido
- ✅ $5 crédito gratis/mes

**Pasos:**

#### 1. Crear cuenta en Railway.app
- Ir a https://railway.app
- Registrarse con GitHub

#### 2. Crear proyecto:
```bash
# Instalar CLI de Railway
npm install -g @railway/cli

# Login
railway login

# Iniciar proyecto
railway init
```

#### 3. Agregar PostgreSQL:
```bash
railway add postgresql
```

#### 4. Deploy:
```bash
railway up
```

**Railway auto-detecta:**
- `requirements.txt`
- Puerto 5000 de Flask
- Variables de entorno automáticas

**Costo:** ✅ GRATIS hasta $5/mes
- Después: ~$5-10/mes

---

### Opción 3: PythonAnywhere (GRATIS limitado) ⚠️

**Limitaciones:**
- ❌ NO soporta SQL Server
- ✅ Soporta MySQL gratis
- ⚠️ Plan gratis muy limitado

**Pasos:**

#### 1. Crear cuenta
- Ir a https://www.pythonanywhere.com
- Plan Beginner (gratis)

#### 2. Subir archivos:
- Via web interface o Git
- Configurar WSGI

#### 3. Usar MySQL:
```python
# Cambiar en models.py
connection_string = 'mysql+pymysql://username:password@hostname/dbname'
```

**Costo:** ✅ GRATIS (muy limitado)
- 512 MB storage
- 1 web app
- MySQL pequeño

---

### Opción 4: Mantener SQL Server - Azure (PAGO) 💰

**Si DEBES usar SQL Server:**

#### Azure SQL Database:
- Costo: ~$5-15/mes mínimo
- Compatible con tu código actual
- Sin migrar BD

**Pasos:**
1. Crear cuenta Azure (tiene $200 gratis trial)
2. Crear Azure SQL Database
3. Configurar firewall
4. Actualizar connection string

---

## 🔧 Solución Recomendada para Ti

### Opción A: SOLO PARA DEMOSTRACIÓN (Gratis, Temporal)

**Usar Render.com con PostgreSQL:**

1. **Migrar datos de SQL Server a PostgreSQL:**
```bash
# Exportar esquema de SQL Server
# Importar a PostgreSQL en Render
```

2. **Variables de entorno en Render:**
```
DATABASE_URL=postgres://...  (auto-generado)
SECRET_KEY=clave_segura_aqui
```

3. **Deploy automático desde GitHub**

**Ventajas:**
- ✅ Gratis
- ✅ Fácil de demostrar al profesor
- ✅ URL pública: `https://sway-app.onrender.com`

---

### Opción B: MANTENER LOCAL (Para desarrollo)

**Configurar para acceso externo:**

#### 1. Usar ngrok (temporal):
```bash
# Instalar ngrok
# Ejecutar servidor local
python app.py

# En otra terminal
ngrok http 5000
```

Te da URL pública temporal: `https://abc123.ngrok.io`

**Ventajas:**
- ✅ Gratis (sesiones de 2 horas)
- ✅ No migrar BD
- ✅ Código sin cambios

**Desventajas:**
- ⏱️ URL cambia cada vez
- ⚠️ Solo para demos

---

## 📝 Archivos que SÍ Debes Subir a GitHub

Los **archivos .md SÍ deben subirse** (documentación):
- ✅ README.md
- ✅ CAMBIOS_ORM.md
- ✅ DOCUMENTACION_TECNICA.md
- ✅ EXPLICACION_SISTEMA_HIBRIDO.md
- ✅ GUIA_VERIFICACION_ORM.md
- ✅ RESUMEN_IMPLEMENTACION.md

**Archivos que NO subir:**
- ❌ `.env` (credenciales)
- ❌ `__pycache__/`
- ❌ `*.pyc`
- ❌ `venv/`
- ❌ `server_log.txt`
- ❌ `uploads/*` (archivos de usuarios)
- ❌ Archivos de prueba temporal

---

## 🚀 Pasos Rápidos para Deploy en Render

### 1. Crear archivos necesarios:

**`.env` (local, NO subir):**
```env
DATABASE_URL=
SECRET_KEY=mi_clave_super_secreta_12345
DEBUG=True
```

**`Procfile`:**
```
web: gunicorn app:app
```

**Actualizar `requirements.txt`:**
```txt
Flask==2.3.3
Flask-CORS==4.0.0
SQLAlchemy==2.0.35
python-dotenv==1.0.0
Werkzeug==2.3.7
gunicorn==21.2.0
psycopg2-binary==2.9.9
```

### 2. Modificar código para usar variables de entorno:

**`models.py`:**
```python
import os
from dotenv import load_dotenv

load_dotenv()

def get_engine():
    database_url = os.getenv('DATABASE_URL')
    
    if database_url:
        # Producción
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
        engine = create_engine(database_url, echo=False)
    else:
        # Desarrollo local - SQL Server
        server = os.getenv('DB_SERVER', 'DESKTOP-VAT773J')
        database = os.getenv('DB_NAME', 'sway')
        username = os.getenv('DB_USER', 'EmilianoLedesma')
        password = os.getenv('DB_PASSWORD', 'Emiliano1')
        
        connection_string = f'mssql+pyodbc://{username}:{password}@{server}/{database}?driver=ODBC+Driver+17+for+SQL+Server'
        engine = create_engine(connection_string, echo=False)
    
    return engine
```

### 3. Subir a GitHub:
```bash
git add .
git commit -m "Preparar para deployment"
git push origin main
```

### 4. Deploy en Render:
1. Ir a https://render.com
2. "New" → "Web Service"
3. Conectar repositorio GitHub
4. Configurar:
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
5. Agregar PostgreSQL
6. Copiar DATABASE_URL a variables de entorno

---

## 💡 Mi Recomendación Final

**Para EVALUACIÓN:**
1. Usar **ngrok** para demo rápida (gratis, sin migrar BD)
2. Mostrar proyecto funcionando en local + URL pública temporal

**Para PRODUCCIÓN real:**
1. Migrar a PostgreSQL
2. Deploy en Render.com (gratis) o Railway (mejor pero pago mínimo)

**Para SOLO entregar código:**
1. Subir a GitHub (público o privado)
2. Incluir README.md con instrucciones
3. No necesitas deployment si solo piden código

---

## 📞 Ayuda Adicional

¿Quieres que te ayude a:
1. ✅ Configurar variables de entorno
2. ✅ Crear archivos de deployment (Procfile, etc.)
3. ✅ Modificar código para usar PostgreSQL
4. ✅ Configurar ngrok para demo rápida

Dime qué opción prefieres y te guío paso a paso.
