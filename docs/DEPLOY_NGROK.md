# Guía de Demo con ngrok — SWAY

> ngrok crea un túnel seguro desde Internet hacia tu máquina local. Es la forma más rápida de demostrar el proyecto sin migrar la base de datos ni modificar el código de producción. Ideal para presentaciones y evaluaciones académicas.

---

## ¿Qué hace ngrok exactamente?

```
Evaluador / Profesor
        |
   Internet (HTTPS)
        |
https://xxxx.ngrok-free.app   ← URL pública temporal asignada por ngrok
        |
   [Túnel cifrado ngrok]
        |
   Tu laptop (localhost)
        |
        ├── FastAPI en puerto 8000
        ├── Flask en puerto 5000
        └── SQL Server (solo interno, no expuesto)
```

El evaluador accede a una URL pública real. Tú tienes todo corriendo en tu laptop con tu SQL Server Windows — sin migrar nada.

### Ventajas para la demo

- No requiere migrar la base de datos
- No requiere modificar el código principal
- Listo en menos de 10 minutos
- HTTPS automático incluido
- Funciona aunque no tengas IP pública

### Desventajas (a tener en cuenta)

- La URL cambia cada vez que reinicias ngrok (tier gratuito)
- El túnel dura máximo 8 horas (tier gratuito) o 1 hora sin actividad
- Requiere que tu laptop esté encendida y conectada durante la demostración
- La velocidad depende de tu conexión a Internet local

---

## FASE 1 — Instalar y configurar ngrok

### 1.1 Crear cuenta en ngrok

1. Ve a [ngrok.com](https://ngrok.com)
2. Regístrate con tu cuenta de GitHub o email
3. En el dashboard, ve a **Your Authtoken** y copia el token

### 1.2 Descargar e instalar ngrok en Windows

**Opción A — Con Chocolatey (recomendada si lo tienes):**
```bash
choco install ngrok
```

**Opción B — Descarga directa:**
1. Ve a [ngrok.com/download](https://ngrok.com/download)
2. Descarga el ZIP para Windows (64-bit)
3. Extrae `ngrok.exe` en una carpeta de tu PATH, por ejemplo `C:\Windows\System32\` o crea una carpeta `C:\ngrok\` y agrégala al PATH

**Verificar instalación:**
```bash
ngrok version
# Debe mostrar: ngrok version 3.x.x
```

### 1.3 Autenticar ngrok

```bash
# Pega tu authtoken del dashboard de ngrok
ngrok config add-authtoken TU_TOKEN_AQUI
```

Esto guarda el token en `~/.config/ngrok/ngrok.yml` y no necesitarás ingresarlo de nuevo.

---

## FASE 2 — Arrancar el proyecto localmente

Antes de crear el túnel, todo el stack debe estar corriendo. Abre **4 terminales** diferentes (o tabs en Windows Terminal):

### Terminal 1 — SQL Server

SQL Server corre como servicio de Windows — verifica que esté activo:

```bash
# En PowerShell (como administrador)
Get-Service -Name MSSQLSERVER
# Debe mostrar: Running

# Si no está corriendo:
Start-Service MSSQLSERVER
```

O desde el panel de SQL Server Configuration Manager.

### Terminal 2 — FastAPI

```bash
cd "C:\Users\Emiliano\Videos\SWAY POO"

# Activar el entorno virtual (si tienes uno)
# venv\Scripts\activate

python -m uvicorn app.main:app --port 8000 --reload
```

Verifica que responda: [http://localhost:8000/docs](http://localhost:8000/docs)

### Terminal 3 — Flask Web1

```bash
cd "C:\Users\Emiliano\Videos\SWAY POO"
python app.py
```

Verifica que responda: [http://localhost:5000](http://localhost:5000)

### Terminal 4 — React Web2 (opcional para demo local simultánea)

```bash
cd "C:\Users\Emiliano\Videos\SWAY POO\web2"
npm run dev
```

Verifica: [http://localhost:5173](http://localhost:5173)

---

## FASE 3 — Crear los túneles ngrok

Tienes dos estrategias según lo que necesites demostrar:

### Estrategia A — Solo exponer FastAPI (recomendada para evaluación rápida)

Esto es suficiente si el evaluador solo necesita ver que la API está en línea y acceder a la documentación Swagger:

```bash
# En una nueva terminal
ngrok http 8000
```

ngrok mostrará algo así:

```
Session Status                online
Account                       tu@email.com (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abcd-123-456-789.ngrok-free.app -> http://localhost:8000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

La URL pública es: `https://abcd-123-456-789.ngrok-free.app`

Prueba inmediata:
- Swagger: `https://abcd-123-456-789.ngrok-free.app/docs`
- API: `https://abcd-123-456-789.ngrok-free.app/api/estadisticas`

### Estrategia B — Exponer FastAPI y Flask simultáneamente

Con el plan gratuito de ngrok puedes abrir **2 túneles** al mismo tiempo usando el archivo de configuración:

**Paso 1:** Crea el archivo de configuración ngrok en `C:\Users\Emiliano\.config\ngrok\ngrok.yml` o usa el que ya existe:

```bash
ngrok config edit
```

Agrega las siguientes líneas al final del archivo:

```yaml
tunnels:
  sway-api:
    proto: http
    addr: 8000
  sway-web:
    proto: http
    addr: 5000
```

**Paso 2:** Lanza ambos túneles con un solo comando:

```bash
ngrok start sway-api sway-web
```

ngrok mostrará dos URLs:
```
Forwarding  https://xxxx.ngrok-free.app  ->  http://localhost:8000  (API)
Forwarding  https://yyyy.ngrok-free.app  ->  http://localhost:5000  (Flask)
```

---

## FASE 4 — Actualizar URLs en el código para la demo

Con las URLs de ngrok, necesitas actualizar algunas referencias para que todo funcione de extremo a extremo.

### 4.1 Actualizar CORS en FastAPI

Abre `app/main.py` y agrega la URL de ngrok a la lista de orígenes permitidos:

```python
# app/main.py — busca la sección de CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://localhost:5173",
        "https://abcd-123-456-789.ngrok-free.app",  # ← agrega esta línea con TU URL
        "https://yyyy.ngrok-free.app",               # ← si también expones Flask
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Guarda el archivo — Uvicorn recargará automáticamente (por el `--reload`).

### 4.2 Actualizar la URL base en React Web2

Si también quieres que Web2 consuma la API desde Internet (no solo localhost):

Abre `web2/src/api/client.js`:

```javascript
// Cambia esta línea temporalmente para la demo:
const BASE = 'https://abcd-123-456-789.ngrok-free.app/api'

// Cuando termines la demo, regresa a:
// const BASE = 'http://localhost:8000/api'
```

Luego reconstruye o reinicia el servidor de desarrollo:

```bash
# Si usas npm run dev (modo desarrollo) — el cambio aplica en caliente

# Si quieres hacer un build de producción para que sea más rápido:
cd web2
npm run build
# Sirve la carpeta dist con un servidor estático si quieres
```

### 4.3 Actualizar API_BASE en assets/js (para Web1)

Los archivos JS de Web1 que llaman a la API también necesitan la URL de ngrok si Web1 se va a acceder vía el túnel de Flask:

En `assets/js/main.js`:

```javascript
// Temporalmente para la demo ngrok:
const API_BASE = 'https://abcd-123-456-789.ngrok-free.app/api';

// Regresa a esto después:
// const API_BASE = 'http://localhost:8000/api';
```

> **Atajo:** Si el evaluador accede a Web1 desde `http://localhost:5000` directamente en tu laptop, no necesitas cambiar esta URL — solo aplica si acceden vía el túnel de Flask.

### 4.4 Manejar la pantalla de advertencia de ngrok

Cuando alguien abre por primera vez una URL de ngrok, aparece una pantalla de aviso:

```
You are about to visit: localhost:8000
Served by ngrok
[Visit Site]
```

**Para evitarla en la demo**, agrega el header `ngrok-skip-browser-warning` a las peticiones. En `web2/src/api/client.js`:

```javascript
async function request(method, path, body = null) {
    const headers = {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',  // ← agrega esta línea
    };
    const token = localStorage.getItem('colab_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // ...resto de la función
}
```

Y en `assets/js/main.js` para las llamadas de Flask:

```javascript
const defaultHeaders = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
};
```

---

## FASE 5 — Panel de monitoreo de ngrok

ngrok incluye un panel web local donde puedes ver todas las peticiones en tiempo real. Muy útil para la demo:

Abre: [http://127.0.0.1:4040](http://127.0.0.1:4040)

En este panel puedes:
- Ver cada petición HTTP con todos sus headers y body
- Ver la respuesta completa del servidor
- Reproducir peticiones (útil para depuración)
- Ver estadísticas de latencia

Es una herramienta excelente para mostrar al evaluador que las peticiones llegan desde Internet y son procesadas por tu API local.

---

## FASE 6 — Script de arranque automático para la demo

Para no tener que abrir 5 terminales manualmente cada vez, crea un script `iniciar_demo.bat` en la raíz del proyecto:

```batch
@echo off
echo ========================================
echo   SWAY POO - Iniciando stack completo
echo ========================================

REM Verificar que SQL Server está corriendo
sc query MSSQLSERVER | findstr "RUNNING" >nul
if %ERRORLEVEL% neq 0 (
    echo Iniciando SQL Server...
    net start MSSQLSERVER
    timeout /t 5
)

echo.
echo [1/3] Iniciando FastAPI en puerto 8000...
start "FastAPI - SWAY" cmd /k "cd /d ""C:\Users\Emiliano\Videos\SWAY POO"" && python -m uvicorn app.main:app --port 8000 --reload"

timeout /t 3

echo [2/3] Iniciando Flask Web1 en puerto 5000...
start "Flask Web1 - SWAY" cmd /k "cd /d ""C:\Users\Emiliano\Videos\SWAY POO"" && python app.py"

timeout /t 3

echo [3/3] Iniciando React Web2 en puerto 5173...
start "React Web2 - SWAY" cmd /k "cd /d ""C:\Users\Emiliano\Videos\SWAY POO\web2"" && npm run dev"

timeout /t 5

echo.
echo [4/4] Iniciando tunel ngrok para FastAPI...
start "ngrok - SWAY API" cmd /k "ngrok http 8000"

echo.
echo ========================================
echo  Stack iniciado. Abriendo navegadores...
echo ========================================
timeout /t 3

start http://localhost:8000/docs
start http://localhost:5000
start http://localhost:5173
start http://127.0.0.1:4040

echo.
echo Listo! Copia la URL HTTPS de la ventana de ngrok
echo y actualiza CORS en app/main.py si es necesario.
```

Ejecuta el script haciendo doble clic en él desde el Explorador de Windows, o desde Git Bash:

```bash
cmd /c iniciar_demo.bat
```

---

## FASE 7 — Mantener la URL de ngrok fija (plan gratuito vs. pagado)

### Problema del plan gratuito

Con el plan gratuito, la URL de ngrok cambia **cada vez que reinicias el proceso**. Esto significa que si la laptop se apaga o ngrok se cierra, tendrás que actualizar las URLs en el código nuevamente.

### Solución 1 — Dominio estático en ngrok (plan gratuito tiene 1 gratis)

Desde el [dashboard de ngrok](https://dashboard.ngrok.com/domains):

1. Ve a **Domains → New Domain**
2. ngrok te asigna un dominio estático gratuito como `tu-nombre.ngrok-free.app`
3. Úsalo así:

```bash
ngrok http --domain=tu-nombre.ngrok-free.app 8000
```

Ahora la URL nunca cambia — puedes configurarla en el código una sola vez.

### Solución 2 — Script que actualiza las URLs automáticamente

Si no puedes usar dominio estático, este script lee la URL actual de ngrok y la aplica al código:

```python
# actualizar_ngrok.py
import requests
import re

# ngrok expone su API en localhost:4040
resp = requests.get('http://localhost:4040/api/tunnels')
tunnels = resp.json()['tunnels']

# Buscar el túnel HTTPS de FastAPI (puerto 8000)
ngrok_url = None
for t in tunnels:
    if t['config']['addr'] == 'http://localhost:8000' and t['proto'] == 'https':
        ngrok_url = t['public_url']
        break

if not ngrok_url:
    print("No se encontró el túnel ngrok. ¿Está corriendo ngrok?")
    exit(1)

print(f"URL de ngrok detectada: {ngrok_url}")

# Actualizar client.js de React Web2
client_js_path = r"web2\src\api\client.js"
with open(client_js_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r"const BASE = '.*?'",
    f"const BASE = '{ngrok_url}/api'",
    content
)

with open(client_js_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"client.js actualizado con: {ngrok_url}/api")
print(f"\nRecuerda actualizar CORS en app/main.py con: {ngrok_url}")
```

Úsalo después de iniciar ngrok:

```bash
python actualizar_ngrok.py
```

---

## Checklist de demo con ngrok

Antes de la presentación:

- [ ] SQL Server corriendo y base de datos accesible
- [ ] FastAPI corriendo en `localhost:8000` (verifica `/docs`)
- [ ] Flask corriendo en `localhost:5000`
- [ ] React corriendo en `localhost:5173`
- [ ] ngrok corriendo con URL HTTPS activa
- [ ] URL de ngrok agregada a `allow_origins` en `app/main.py`
- [ ] Uvicorn recargó tras el cambio de CORS (ver logs en terminal)
- [ ] `web2/src/api/client.js` con la URL de ngrok actualizada
- [ ] Header `ngrok-skip-browser-warning` agregado (para evitar pantalla de aviso)
- [ ] Panel ngrok en `http://localhost:4040` disponible para mostrar peticiones
- [ ] Prueba end-to-end: login → ver especies → descargar PDF → funciona vía URL ngrok

---

## Referencia rápida de comandos ngrok

```bash
# Túnel simple al puerto 8000
ngrok http 8000

# Túnel con dominio estático (si lo tienes configurado)
ngrok http --domain=mi-dominio.ngrok-free.app 8000

# Arrancar múltiples túneles definidos en el archivo de configuración
ngrok start sway-api sway-web

# Ver la configuración actual
ngrok config check

# Ver el estado de los túneles activos (desde otra terminal)
curl http://localhost:4040/api/tunnels | python -m json.tool

# Actualizar ngrok
ngrok update
```

---

## Tabla comparativa: ngrok vs Render para el proyecto SWAY

| Aspecto | ngrok (demo) | Render.com (producción) |
|---|---|---|
| Tiempo de configuración | ~10 minutos | ~60-90 minutos |
| Migración de BD | No necesaria | Requerida (SQL Server → PostgreSQL) |
| Cambios en el código | Mínimos (CORS + URL) | Moderados (driver + queries) |
| Disponibilidad | Mientras tu laptop esté encendida | 24/7 (con límites del tier gratuito) |
| URL fija | Solo con dominio estático (1 gratis) | Sí, siempre fija |
| Costo | Gratuito | Gratuito (BD expira a 90 días) |
| Ideal para | Demos, presentaciones, evaluaciones | Despliegue permanente |
| Requisito de internet | Sí (durante toda la demo) | No (servidor externo) |
