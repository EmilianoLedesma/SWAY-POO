# Guía de Despliegue SWAY — DigitalOcean

> Stack: FastAPI + Uvicorn (puerto 8000) | Flask + Gunicorn (puerto 5000) | React + Vite build | SQL Server 2022 for Linux | Nginx

---

## Arquitectura final en el servidor

```
Internet (HTTP/HTTPS)
        |
    Nginx :80/:443
        |
        ├── /             → Flask Web1   (Gunicorn en 127.0.0.1:5000)
        ├── /api/         → FastAPI      (Uvicorn en 127.0.0.1:8000)
        ├── /docs         → Swagger UI   (proxy a FastAPI)
        └── /portal/      → React build  (archivos estáticos en /dist)

SQL Server 2022 for Linux (127.0.0.1:1433 — solo interno)
```

Los puertos 5000, 8000 y 1433 **no se exponen al exterior** — solo Nginx es el punto de entrada público.

---

## Requisitos previos

- Cuenta DigitalOcean activa (con GitHub Student Pack tienes $200 de crédito)
- Git Bash o PowerShell en Windows para los comandos `ssh` y `scp`
- Tu par de claves SSH generado (`ssh-keygen -t ed25519` si no tienes uno)

---

## FASE 1 — Crear y configurar el Droplet

### 1.1 Crear el Droplet

En el panel de DigitalOcean → **Create → Droplets**:

| Campo | Valor |
|---|---|
| Imagen | Ubuntu 22.04 LTS x64 |
| Plan | Basic — **2GB RAM / 1 vCPU** ($12/mes) — mínimo para SQL Server |
| Datacenter | New York 1 o San Francisco (más cercano a México) |
| Autenticación | **SSH Key** (pega tu clave pública `~/.ssh/id_ed25519.pub`) |
| Hostname | `sway-server` |

Anota la **IP pública** que te asigne DigitalOcean. Se usará como `TU_IP` en el resto de esta guía.

### 1.2 Primera conexión

```bash
# Desde tu máquina Windows (Git Bash o PowerShell)
ssh root@TU_IP
```

### 1.3 Crear usuario no-root y configurar firewall

```bash
# Actualizar el sistema
apt update && apt upgrade -y

# Crear usuario sway
adduser sway
# Te pedirá contraseña — ponla fuerte

# Darle permisos sudo
usermod -aG sudo sway

# Copiar tu clave SSH al nuevo usuario
rsync --archive --chown=sway:sway ~/.ssh /home/sway

# Configurar firewall (solo SSH, HTTP y HTTPS)
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Verificar
ufw status
```

A partir de aquí **todo se ejecuta como el usuario `sway`**:

```bash
ssh sway@TU_IP
```

---

## FASE 2 — Instalar SQL Server 2022 for Linux

### 2.1 Agregar el repositorio de Microsoft

```bash
curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
  | sudo gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg

curl -fsSL https://packages.microsoft.com/config/ubuntu/22.04/mssql-server-2022.list \
  | sudo tee /etc/apt/sources.list.d/mssql-server-2022.list

sudo apt update
```

### 2.2 Instalar y configurar SQL Server

```bash
sudo apt install -y mssql-server

# Asistente de configuración
sudo /opt/mssql/bin/mssql-conf setup
# Selecciona: 2) Developer (gratis para desarrollo)
# Ingresa una contraseña fuerte para SA (guárdala, la necesitarás)

# Verificar que el servicio está activo
systemctl status mssql-server
```

### 2.3 Instalar herramientas de línea de comandos (sqlcmd)

```bash
curl -fsSL https://packages.microsoft.com/config/ubuntu/22.04/prod.list \
  | sudo tee /etc/apt/sources.list.d/msprod.list

sudo apt update
sudo ACCEPT_EULA=Y apt install -y mssql-tools18 unixodbc-dev

# Agregar sqlcmd al PATH permanentemente
echo 'export PATH="$PATH:/opt/mssql-tools18/bin"' >> ~/.bashrc
source ~/.bashrc

# Probar conexión
sqlcmd -S localhost -U SA -P "TU_CONTRASENA_SA" -Q "SELECT @@VERSION"
```

### 2.4 Instalar el driver ODBC 18 (requerido por pyodbc)

```bash
sudo ACCEPT_EULA=Y apt install -y msodbcsql18

# Verificar que el driver está registrado
odbcinst -q -d | grep -i sql
# Debe mostrar: [ODBC Driver 18 for SQL Server]
```

> **Importante:** En Linux el driver se llama `ODBC Driver 18 for SQL Server` (no 17 como en Windows). Esto requiere un cambio en el código — se detalla en la Fase 4.

### 2.5 Limitar SQL Server a localhost (seguridad)

```bash
sudo /opt/mssql/bin/mssql-conf set network.ipaddress 127.0.0.1
sudo systemctl restart mssql-server
```

---

## FASE 3 — Migrar la base de datos desde Windows

### 3.1 Crear la base de datos y usuario de la aplicación

```bash
# Crear la base de datos
sqlcmd -S localhost -U SA -P "TU_CONTRASENA_SA" -Q "CREATE DATABASE sway"

# Crear un usuario dedicado para la app (nunca usar SA en producción)
sqlcmd -S localhost -U SA -P "TU_CONTRASENA_SA" -Q "
CREATE LOGIN sway_app WITH PASSWORD = 'SwayApp_Prod2024!';
USE sway;
CREATE USER sway_app FOR LOGIN sway_app;
ALTER ROLE db_owner ADD MEMBER sway_app;
"
```

### 3.2 Subir los scripts SQL desde Windows

Abre **Git Bash en Windows** y ejecuta:

```bash
scp "C:/Users/Emiliano/Videos/SWAY POO/SWAY_DDL_Estructura.sql" sway@TU_IP:/home/sway/
scp "C:/Users/Emiliano/Videos/SWAY POO/SWAY_DML_Datos.sql"      sway@TU_IP:/home/sway/
```

> Si tienes un archivo de procedimientos almacenados o triggers, súbelo también con `scp`.

### 3.3 Ejecutar los scripts en el servidor

```bash
# 1. Estructura de tablas
sqlcmd -S localhost -U SA -P "TU_CONTRASENA_SA" -d sway \
  -i /home/sway/SWAY_DDL_Estructura.sql

# 2. Datos iniciales (catálogos, seeds)
sqlcmd -S localhost -U SA -P "TU_CONTRASENA_SA" -d sway \
  -i /home/sway/SWAY_DML_Datos.sql

# Verificar que las tablas se crearon correctamente
sqlcmd -S localhost -U SA -P "TU_CONTRASENA_SA" -d sway \
  -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES ORDER BY TABLE_NAME"
```

> **Nota:** Si el DDL contiene `CREATE DATABASE sway`, coméntalo o elimínalo antes de ejecutar porque ya la creaste en el paso anterior.

---

## FASE 4 — Configurar el entorno Python

### 4.1 Instalar dependencias del sistema

```bash
sudo apt install -y python3.11 python3.11-venv python3-pip git
python3.11 --version   # debe mostrar 3.11.x
```

### 4.2 Subir el código del proyecto desde Windows

En **Git Bash en Windows**:

```bash
# Crear la carpeta del proyecto en el servidor
ssh sway@TU_IP "mkdir -p /home/sway/sway"

# Subir los archivos principales
scp "C:/Users/Emiliano/Videos/SWAY POO/app.py"           sway@TU_IP:/home/sway/sway/
scp "C:/Users/Emiliano/Videos/SWAY POO/db.py"            sway@TU_IP:/home/sway/sway/
scp "C:/Users/Emiliano/Videos/SWAY POO/models.py"        sway@TU_IP:/home/sway/sway/
scp "C:/Users/Emiliano/Videos/SWAY POO/requirements.txt" sway@TU_IP:/home/sway/sway/

# Subir carpetas
scp -r "C:/Users/Emiliano/Videos/SWAY POO/app"       sway@TU_IP:/home/sway/sway/
scp -r "C:/Users/Emiliano/Videos/SWAY POO/templates" sway@TU_IP:/home/sway/sway/
scp -r "C:/Users/Emiliano/Videos/SWAY POO/static"    sway@TU_IP:/home/sway/sway/
scp -r "C:/Users/Emiliano/Videos/SWAY POO/assets"    sway@TU_IP:/home/sway/sway/
```

> **Alternativa recomendada:** Subir el proyecto a un repositorio GitHub privado y hacer `git clone` en el servidor. Esto facilita actualizaciones futuras con solo `git pull`.

### 4.3 Crear el entorno virtual e instalar dependencias

```bash
cd /home/sway/sway
python3.11 -m venv venv
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

# Si requirements.txt no incluye gunicorn, instalarlo manualmente
pip install gunicorn
```

### 4.4 Crear el archivo .env de producción

```bash
nano /home/sway/sway/.env
```

Contenido (reemplaza los valores en mayúsculas):

```ini
# Base de datos — SQL Server local en Linux
DB_SERVER=localhost
DB_NAME=sway
DB_USER=sway_app
DB_PASSWORD=SwayApp_Prod2024!

# Flask
SECRET_KEY=GENERA_UNA_CLAVE_ALEATORIA_AQUI
DEBUG=False
FLASK_ENV=production
PORT=5000

# Email — Gmail SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=emilianoledesmaledesma@gmail.com
MAIL_PASS=fppbvvbkpoyllqzm

# URL pública del portal React
WEB2_URL=http://TU_IP/portal
```

Generar una SECRET_KEY segura:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
# Copia el output y pégalo como valor de SECRET_KEY
```

Proteger el archivo:

```bash
chmod 600 /home/sway/sway/.env
```

### 4.5 Corregir las credenciales hardcodeadas en db.py

Este es el cambio más crítico. El archivo `db.py` tiene `DESKTOP-VAT773J` hardcodeado y no funcionará en Linux sin este cambio.

```bash
nano /home/sway/sway/db.py
```

Busca la función `get_db_connection` y reemplázala para que quede así:

```python
import os
import pyodbc
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    try:
        server   = os.environ.get('DB_SERVER', 'localhost')
        database = os.environ.get('DB_NAME', 'sway')
        username = os.environ.get('DB_USER', 'sway_app')
        password = os.environ.get('DB_PASSWORD', '')
        connection_string = (
            f'DRIVER={{ODBC Driver 18 for SQL Server}};'
            f'SERVER={server};DATABASE={database};'
            f'UID={username};PWD={password};'
            f'TrustServerCertificate=yes'
        )
        return pyodbc.connect(connection_string)
    except Exception as e:
        print(f"Error de conexión: {e}")
        return None
```

Hacer el mismo cambio en `app/data/database.py` — busca la cadena de conexión y aplica el mismo patrón de variables de entorno con `ODBC Driver 18` y `TrustServerCertificate=yes`.

### 4.6 Corregir CORS en FastAPI para producción

```bash
nano /home/sway/sway/app/main.py
```

Actualiza `allow_origins` para incluir la IP del servidor:

```python
allow_origins=[
    "http://TU_IP",
    "http://TU_IP/portal",
    "http://localhost:5000",    # mantener para desarrollo local
    "http://localhost:5173",
]
```

### 4.7 Verificar que la conexión a la BD funciona

```bash
source /home/sway/sway/venv/bin/activate
cd /home/sway/sway
python3 -c "
from db import get_db_connection
conn = get_db_connection()
if conn:
    print('Conexion exitosa')
    conn.close()
else:
    print('Error de conexion')
"
```

---

## FASE 5 — Build de React (Web2)

### 5.1 Instalar Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node --version   # debe mostrar v20.x
npm --version
```

### 5.2 Subir el código fuente de Web2

Desde **Git Bash en Windows**:

```bash
ssh sway@TU_IP "mkdir -p /home/sway/sway/web2"

scp -r "C:/Users/Emiliano/Videos/SWAY POO/web2/src"          sway@TU_IP:/home/sway/sway/web2/
scp    "C:/Users/Emiliano/Videos/SWAY POO/web2/package.json"  sway@TU_IP:/home/sway/sway/web2/
scp    "C:/Users/Emiliano/Videos/SWAY POO/web2/index.html"    sway@TU_IP:/home/sway/sway/web2/
scp    "C:/Users/Emiliano/Videos/SWAY POO/web2/vite.config.js" sway@TU_IP:/home/sway/sway/web2/
```

### 5.3 Verificar las URLs del API en el código React

El proxy de Vite (`/api → localhost:8000`) **solo funciona en desarrollo** con `npm run dev`. En el build de producción, el código React debe apuntar directamente al servidor.

```bash
# Buscar si hay URLs hardcodeadas a localhost en el código React
grep -r "localhost:8000" /home/sway/sway/web2/src/
grep -r "localhost:5000" /home/sway/sway/web2/src/
```

Si aparecen, editar `web2/src/api/client.js` y cambiar:

```javascript
// Antes (desarrollo local)
const BASE = 'http://localhost:8000/api'

// Después (producción)
const BASE = '/api'
// Nginx redirige /api/ → FastAPI en 127.0.0.1:8000
```

### 5.4 Hacer el build de producción

```bash
cd /home/sway/sway/web2
npm install
npm run build

# Verificar que se generaron los archivos estáticos
ls dist/
# Debe mostrar: index.html  assets/
```

---

## FASE 6 — Crear servicios systemd

Systemd gestiona los procesos: los inicia automáticamente con el servidor y los reinicia si se caen.

### 6.1 Servicio para FastAPI (Uvicorn)

```bash
sudo nano /etc/systemd/system/sway-api.service
```

```ini
[Unit]
Description=SWAY FastAPI (Uvicorn)
After=network.target mssql-server.service
Requires=mssql-server.service

[Service]
User=sway
Group=sway
WorkingDirectory=/home/sway/sway
EnvironmentFile=/home/sway/sway/.env
ExecStart=/home/sway/sway/venv/bin/uvicorn app.main:app \
          --host 127.0.0.1 --port 8000 --workers 2
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

### 6.2 Servicio para Flask Web1 (Gunicorn)

```bash
sudo nano /etc/systemd/system/sway-web.service
```

```ini
[Unit]
Description=SWAY Flask Web1 (Gunicorn)
After=network.target mssql-server.service
Requires=mssql-server.service

[Service]
User=sway
Group=sway
WorkingDirectory=/home/sway/sway
EnvironmentFile=/home/sway/sway/.env
ExecStart=/home/sway/sway/venv/bin/gunicorn app:app \
          --bind 127.0.0.1:5000 --workers 2 --timeout 120
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

### 6.3 Activar y arrancar los servicios

```bash
sudo systemctl daemon-reload
sudo systemctl enable sway-api sway-web
sudo systemctl start sway-api sway-web

# Verificar estado de ambos servicios
sudo systemctl status sway-api
sudo systemctl status sway-web
```

Si algo falla, ver los logs en tiempo real:

```bash
sudo journalctl -u sway-api -f
sudo journalctl -u sway-web -f
```

---

## FASE 7 — Configurar Nginx como proxy reverso

### 7.1 Instalar Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 7.2 Crear la configuración del sitio SWAY

```bash
sudo nano /etc/nginx/sites-available/sway
```

```nginx
server {
    listen 80;
    server_name TU_IP;   # reemplazar con tu dominio cuando lo tengas

    # Tamaño máximo para subidas de archivos/imágenes
    client_max_body_size 10M;

    # --- FastAPI (API REST) ---
    location /api/ {
        proxy_pass         http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }

    # Documentación Swagger (útil para revisión)
    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
    location /openapi.json {
        proxy_pass http://127.0.0.1:8000/openapi.json;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # --- React Web2 (portal científico de colaboradores) ---
    location /portal/ {
        alias /home/sway/sway/web2/dist/;
        try_files $uri $uri/ /portal/index.html;
        expires 1d;
        add_header Cache-Control "public";
    }

    # Assets de React (JS/CSS con hash en el nombre — cache agresivo)
    location /portal/assets/ {
        alias /home/sway/sway/web2/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # --- Archivos estáticos de Flask (servidos directamente por Nginx) ---
    location /static/ {
        alias /home/sway/sway/static/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # --- Flask Web1 (portal público — todo lo demás) ---
    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
```

### 7.3 Activar el sitio y recargar Nginx

```bash
# Habilitar el sitio
sudo ln -s /etc/nginx/sites-available/sway /etc/nginx/sites-enabled/

# Deshabilitar el sitio por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar sintaxis ANTES de recargar (importante)
sudo nginx -t
# Debe mostrar: syntax is ok / test is successful

# Aplicar configuración
sudo systemctl reload nginx
```

### 7.4 Verificación del stack completo

```bash
# Flask respondiendo internamente
curl -s http://127.0.0.1:5000/ | head -5

# FastAPI respondiendo internamente
curl -s http://127.0.0.1:8000/api/estadisticas

# Nginx sirviendo Flask (acceso externo)
curl -s http://TU_IP/ | head -5

# Nginx proxying a FastAPI
curl -s http://TU_IP/api/estadisticas

# Build de React existe
ls /home/sway/sway/web2/dist/index.html

# Swagger disponible
curl -s http://TU_IP/docs | head -5
```

---

## FASE 8 — SSL con Let's Encrypt (requiere dominio)

> Esta fase es opcional. Necesitas un dominio propio apuntando a la IP del servidor (registro DNS tipo A). Sin dominio no es posible obtener certificado SSL gratuito.

```bash
# Instalar certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener e instalar el certificado
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com

# Certbot modifica nginx.conf automáticamente y agrega redirect HTTP → HTTPS
# Verificar que la renovación automática funciona
sudo certbot renew --dry-run
```

Después de SSL, actualizar en `.env`:

```ini
WEB2_URL=https://tu-dominio.com/portal
```

Y en `app/main.py`:

```python
allow_origins=[
    "https://tu-dominio.com",
    "https://www.tu-dominio.com",
]
```

---

## Comandos de mantenimiento

### Reiniciar servicios tras actualizar código

```bash
sudo systemctl restart sway-api
sudo systemctl restart sway-web
sudo systemctl reload nginx    # solo si cambiaste la config de nginx
```

### Ver logs

```bash
# FastAPI
sudo journalctl -u sway-api -n 50 --no-pager

# Flask
sudo journalctl -u sway-web -n 50 --no-pager

# Nginx (errores)
sudo tail -f /var/log/nginx/error.log

# Nginx (accesos)
sudo tail -f /var/log/nginx/access.log
```

### Actualizar código desde Git

```bash
cd /home/sway/sway
git pull
source venv/bin/activate
pip install -r requirements.txt    # por si hubo cambios de dependencias
sudo systemctl restart sway-api sway-web
```

### Actualizar el build de React

```bash
cd /home/sway/sway/web2
npm install
npm run build
# Nginx sirve los archivos estáticos directamente, no necesita reiniciarse
```

### Estado general del servidor

```bash
# Ver todos los servicios de SWAY
sudo systemctl status sway-api sway-web mssql-server nginx

# Uso de recursos
free -h          # RAM disponible
df -h            # espacio en disco
```

---

## Checklist de despliegue

- [ ] Droplet creado (Ubuntu 22.04, 2GB RAM)
- [ ] Firewall configurado (solo SSH, 80, 443)
- [ ] Usuario `sway` creado con sudo
- [ ] SQL Server instalado y corriendo
- [ ] Driver ODBC 18 instalado y verificado
- [ ] Base de datos `sway` creada con usuario `sway_app`
- [ ] Scripts DDL y DML ejecutados correctamente
- [ ] Código subido al servidor
- [ ] `.env` de producción creado y protegido (`chmod 600`)
- [ ] `db.py` y `app/data/database.py` leen de variables de entorno (driver 18 + TrustServerCertificate)
- [ ] CORS en `app/main.py` incluye la IP del servidor
- [ ] Entorno virtual Python creado y dependencias instaladas
- [ ] Conexión a BD verificada desde Python
- [ ] URLs del API en React apuntan a `/api` (ruta relativa)
- [ ] Build de React generado (`web2/dist/` existe)
- [ ] Servicio `sway-api.service` activo y habilitado
- [ ] Servicio `sway-web.service` activo y habilitado
- [ ] Nginx configurado, sintaxis verificada y activo
- [ ] `http://TU_IP/` carga Flask Web1
- [ ] `http://TU_IP/api/estadisticas` responde JSON
- [ ] `http://TU_IP/portal/` carga React Web2
- [ ] `http://TU_IP/docs` muestra Swagger UI
- [ ] Login de colaborador funciona end-to-end
- [ ] Correo de bienvenida se envía al registrar colaborador

---

## Cambios requeridos en el código antes del despliegue

| Archivo | Problema | Solución |
|---|---|---|
| `db.py` | `DESKTOP-VAT773J` hardcodeado | Leer de `os.environ` con driver 18 |
| `app/data/database.py` | Misma credencial hardcodeada | Mismo cambio |
| `app/main.py` | CORS solo permite `localhost` | Agregar `http://TU_IP` |
| `web2/src/api/client.js` | `BASE = http://localhost:8000/api` | Cambiar a `BASE = '/api'` |

---

## URLs del sistema en producción

| Servicio | URL |
|---|---|
| Web1 Flask (portal público) | `http://TU_IP/` |
| Web2 React (portal colaboradores) | `http://TU_IP/portal/` |
| API REST FastAPI | `http://TU_IP/api/` |
| Documentación Swagger | `http://TU_IP/docs` |
