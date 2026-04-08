# Guía de Despliegue SWAY — DigitalOcean (Docker)

> Stack: FastAPI + Uvicorn | Flask + Gunicorn | React (build estático) | PostgreSQL 15 | Nginx
> Todo orquestado con **Docker Compose** — cero instalaciones manuales en el servidor.

---

## Arquitectura en producción

```
Internet (HTTP :80)
        │
    Nginx (contenedor)
        │
        ├── /api/      → FastAPI :8000  (contenedor sway_api)
        ├── /docs      → FastAPI :8000  (Swagger UI)
        ├── /portal/   → React dist     (archivos estáticos en nginx)
        ├── /static/   → assets Flask   (archivos estáticos en nginx)
        └── /          → Flask :5000    (contenedor sway_web)
                                │
                         PostgreSQL :5432 (contenedor sway_postgres)
                         (red interna Docker — no expuesto al exterior)
```

Los puertos 5000, 8000 y 5432 **solo existen dentro de la red Docker**. El único puerto público es el **80 de Nginx**.

---

## Requisitos del Droplet

| Campo | Valor |
|---|---|
| Imagen | Ubuntu 22.04 LTS x64 |
| Plan | Basic — **1GB RAM / 1 vCPU** ($6/mes) — suficiente con Docker |
| Datacenter | New York 1 o San Francisco |
| Autenticación | SSH Key |
| Hostname | `sway-server` |

> Con Docker no se instala SQL Server, por eso 1GB de RAM es suficiente (antes se necesitaban 2GB mínimo para SQL Server).

---

## FASE 1 — Preparar el proyecto localmente (hacer esto ANTES de subir al servidor)

### 1.1 Construir el portal React

```bash
# En tu máquina Windows, desde la raíz del proyecto
cd web2
npm install
npm run build
# Se genera web2/dist/ con los archivos estáticos
```

### 1.2 Verificar que no hay localhost hardcodeado

```bash
# Debe salir vacío — si aparece algo, corrígelo antes de subir
grep -r "localhost:8000" assets/js/ web2/src/ templates/
```

---

## FASE 2 — Configurar el servidor

### 2.1 Primera conexión al Droplet

```bash
ssh root@TU_IP
```

### 2.2 Crear usuario no-root y firewall

```bash
adduser sway
usermod -aG sudo sway
rsync --archive --chown=sway:sway ~/.ssh /home/sway

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2.3 Instalar Docker y Docker Compose

```bash
# Cambiar al usuario sway
su - sway

# Instalar Docker
curl -fsSL https://get.docker.com | sudo bash

# Agregar usuario al grupo docker (evita usar sudo en cada comando)
sudo usermod -aG docker sway

# Cerrar sesión y volver a entrar para que tome efecto
exit
ssh sway@TU_IP

# Verificar
docker --version
docker compose version
```

---

## FASE 3 — Subir el proyecto al servidor

### Opción A — Git (recomendada para actualizaciones futuras)

```bash
# En el servidor
cd /home/sway
git clone https://github.com/TU_USUARIO/TU_REPO.git sway
cd sway
```

### Opción B — SCP directo desde Windows

```bash
# En Git Bash de Windows
scp -r "C:/Users/Emiliano/Videos/SWAY POO/" sway@TU_IP:/home/sway/sway
```

> **Importante:** Asegúrate de que `web2/dist/` esté incluido (generado en Fase 1).

---

## FASE 4 — Configurar variables de entorno en el servidor

```bash
cd /home/sway/sway

# Copiar la plantilla
cp .env.example .env

# Editar con los valores reales
nano .env
```

Contenido del `.env` en el servidor:

```ini
DB_USER=sway_app
DB_PASSWORD=pon_una_contrasena_segura
DB_NAME=sway

SECRET_KEY=genera_con: python3 -c "import secrets; print(secrets.token_hex(32))"

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=emilianoledesmaledesma@gmail.com
MAIL_PASS=tu_app_password

# Poner la IP real del servidor
CORS_ORIGINS=http://TU_IP
```

Proteger el archivo:

```bash
chmod 600 .env
```

---

## FASE 5 — Levantar los contenedores

```bash
cd /home/sway/sway

# Primera vez — construye las imágenes y levanta todo
docker compose -f docker-compose.prod.yml up --build -d

# Ver que todos los contenedores estén corriendo
docker compose -f docker-compose.prod.yml ps
```

Debes ver 4 contenedores en estado `Up`:

```
sway_postgres   Up (healthy)
sway_api        Up
sway_web        Up
sway_nginx      Up
```

---

## FASE 6 — Verificar que todo funciona

```bash
# Flask sirve HTML
curl -s http://TU_IP/ | head -5

# FastAPI responde JSON
curl -s http://TU_IP/api/estadisticas

# Swagger disponible
curl -s http://TU_IP/docs | grep -o "<title>.*</title>"

# Portal React existe
curl -s http://TU_IP/portal/ | grep -o "<title>.*</title>"
```

Desde el navegador:

| URL | Debe mostrar |
|---|---|
| `http://TU_IP/` | Portal público Flask |
| `http://TU_IP/portal/` | Portal React colaboradores |
| `http://TU_IP/api/estadisticas` | JSON con estadísticas |
| `http://TU_IP/docs` | Swagger UI |

---

## Comandos de mantenimiento

### Ver logs en tiempo real

```bash
# Todos los servicios
docker compose -f docker-compose.prod.yml logs -f

# Solo FastAPI
docker compose -f docker-compose.prod.yml logs -f api

# Solo Flask
docker compose -f docker-compose.prod.yml logs -f web

# Solo Nginx
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Reiniciar un servicio

```bash
docker compose -f docker-compose.prod.yml restart api
docker compose -f docker-compose.prod.yml restart web
```

### Actualizar código (con Git)

```bash
cd /home/sway/sway
git pull

# Si cambiaron dependencias Python o el Dockerfile
docker compose -f docker-compose.prod.yml up --build -d

# Si solo cambió código Python (sin dependencias)
docker compose -f docker-compose.prod.yml restart api web
```

### Actualizar el portal React

```bash
# En tu máquina local
cd web2
npm run build

# Subir solo el dist al servidor
scp -r web2/dist sway@TU_IP:/home/sway/sway/web2/
# Nginx sirve los archivos directamente — no necesita reiniciarse
```

### Estado general

```bash
docker compose -f docker-compose.prod.yml ps
docker stats --no-stream   # uso de RAM y CPU
```

### Reinicio completo (si algo falla)

```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up --build -d
```

### Borrar todo y empezar de cero (¡borra la BD!)

```bash
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up --build -d
```

---

## SSL con Let's Encrypt (requiere dominio propio)

```bash
# Instalar certbot
sudo apt install -y certbot

# Parar nginx de Docker temporalmente
docker compose -f docker-compose.prod.yml stop nginx

# Obtener certificado
sudo certbot certonly --standalone -d tu-dominio.com

# Actualizar nginx.prod.conf para HTTPS y reiniciar
docker compose -f docker-compose.prod.yml start nginx
```

---

## Checklist de despliegue

- [ ] `web2/dist/` generado localmente con `npm run build`
- [ ] Sin `localhost:8000` hardcodeado en templates ni JS
- [ ] Droplet Ubuntu 22.04 creado
- [ ] Firewall: SSH, 80, 443
- [ ] Docker y Docker Compose instalados
- [ ] Proyecto subido al servidor
- [ ] `.env` creado en el servidor con `CORS_ORIGINS=http://TU_IP`
- [ ] `docker compose -f docker-compose.prod.yml up --build -d` ejecutado
- [ ] Los 4 contenedores están en estado `Up`
- [ ] `http://TU_IP/` carga Flask
- [ ] `http://TU_IP/api/estadisticas` responde JSON
- [ ] `http://TU_IP/portal/` carga React
- [ ] `http://TU_IP/docs` muestra Swagger

---

## URLs del sistema en producción

| Servicio | URL |
|---|---|
| Portal público Flask | `http://TU_IP/` |
| Portal colaboradores React | `http://TU_IP/portal/` |
| API REST FastAPI | `http://TU_IP/api/` |
| Documentación Swagger | `http://TU_IP/docs` |
