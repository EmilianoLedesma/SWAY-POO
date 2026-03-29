# Comandos útiles — SWAY Servidor producción
# IP: 165.232.146.240

## Conexión al servidor
```bash
ssh root@165.232.146.240
cd /root/sway   # siempre trabajar desde aquí
```

---

## Estado general de contenedores
```bash
# Ver los 4 servicios y su estado
docker compose -f docker-compose.prod.yml ps

# Uso de RAM y CPU en tiempo real
docker stats --no-stream
```

---

## Demostrar arquitectura desacoplada

### Flask (Web1) corriendo independiente en puerto 5000
```bash
docker compose -f docker-compose.prod.yml logs web --tail 10
# Muestra gunicorn sirviendo Flask en :5000
```

### FastAPI corriendo independiente en puerto 8000
```bash
docker compose -f docker-compose.prod.yml logs api --tail 10
# Muestra uvicorn sirviendo FastAPI en :8000
```

### React (Web2) servido como archivos estáticos por Nginx
```bash
curl -s http://165.232.146.240/portal/ | grep "<title>"
# Devuelve: <title>SWAY | Portal Científico</title>
```

### Flask y React consumen la misma API (FastAPI)
```bash
# API responde JSON — independiente de Flask y React
curl -s http://165.232.146.240/api/estadisticas
curl -s http://165.232.146.240/api/especies?page=1&limit=5
```

### Swagger UI (documentación automática FastAPI)
```bash
curl -s http://165.232.146.240/docs | grep "<title>"
# O abrir en navegador: http://165.232.146.240/docs
```

---

## Base de datos PostgreSQL en Docker

### Acceder al psql
```bash
docker exec -it sway_postgres psql -U sway_app -d sway
```

### Comandos útiles dentro de psql
```sql
\dt                          -- listar todas las tablas
\q                           -- salir

-- Ver último usuario registrado
SELECT * FROM usuarios ORDER BY id DESC LIMIT 1;

-- Ver colaboradores registrados
SELECT * FROM colaboradores ORDER BY id DESC LIMIT 5;

-- Ver especies
SELECT id, nombre_comun, nombre_cientifico FROM especies LIMIT 10;

-- Eliminar último colaborador y usuario (para pruebas)
DELETE FROM colaboradores WHERE id = (SELECT MAX(id) FROM colaboradores);
DELETE FROM usuarios WHERE id = (SELECT MAX(id) FROM usuarios);

-- Contar registros por tabla
SELECT COUNT(*) FROM usuarios;
SELECT COUNT(*) FROM colaboradores;
SELECT COUNT(*) FROM especies;
```

---

## Logs en tiempo real

```bash
# Todos los servicios
docker compose -f docker-compose.prod.yml logs -f

# Solo FastAPI (ver peticiones a la API)
docker compose -f docker-compose.prod.yml logs api --tail 30

# Solo Flask (ver peticiones al portal público)
docker compose -f docker-compose.prod.yml logs web --tail 30

# Solo Nginx
docker compose -f docker-compose.prod.yml logs nginx --tail 20

# Ver errores de email
docker compose -f docker-compose.prod.yml logs api | grep -i "email\|mail\|error"
```

---

## Variables de entorno del contenedor

```bash
# Ver que el api tiene las variables correctas
docker exec sway_api env | grep -i "mail\|web2\|cors\|database"
```

---

## Actualizar código en producción

### Subir un archivo modificado desde Windows
```bash
scp "C:/Users/Emiliano/Videos/SWAY POO/app/services/email_service.py" root@165.232.146.240:/root/sway/app/services/email_service.py
```

### Reconstruir imagen y reiniciar servicio
```bash
cd /root/sway
docker compose -f docker-compose.prod.yml up --build -d api   # reconstruye api
docker compose -f docker-compose.prod.yml up --build -d web   # reconstruye flask
```

### Reiniciar sin reconstruir (solo para cambios de .env)
```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate api
```

### Actualizar portal React (después de npm run build local)
```bash
# En Windows — subir nuevo dist
scp -r "C:/Users/Emiliano/Videos/SWAY POO/web2/dist/" root@165.232.146.240:/root/sway/web2/

# En servidor — arreglar permisos (nginx necesita leer los archivos)
chmod -R 755 /root/sway/web2/dist/
# Nginx sirve estáticos directamente — no necesita reiniciarse
```

---

## Reinicio completo

```bash
# Bajar todo y levantar de nuevo (sin borrar BD)
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up --build -d

# CUIDADO: esto borra la base de datos
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up --build -d
```

---

## URLs del sistema en producción

| URL | Servicio |
|-----|---------|
| http://165.232.146.240/ | Portal público Flask |
| http://165.232.146.240/portal/ | Portal colaboradores React |
| http://165.232.146.240/api/estadisticas | JSON FastAPI |
| http://165.232.146.240/docs | Swagger UI |
