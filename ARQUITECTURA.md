# Arquitectura Desacoplada — SWAY

## Índice

1. [Visión general](#1-visión-general)
2. [Las 4 capas del sistema](#2-las-4-capas-del-sistema)
3. [Capa 1 — Base de Datos](#3-capa-1--base-de-datos)
4. [Capa 2 — La API](#4-capa-2--la-api)
5. [Capa 3 — Web 1 (Flask + Jinja2)](#5-capa-3--web-1-flask--jinja2)
6. [Capa 4 — Web 2 (React + Vite)](#6-capa-4--web-2-react--vite)
7. [Cómo se comunican las capas](#7-cómo-se-comunican-las-capas)
8. [El flujo completo de una petición](#8-el-flujo-completo-de-una-petición)
9. [Por qué "desacoplado"](#9-por-qué-desacoplado)
10. [Autenticación compartida entre Web 1 y Web 2](#10-autenticación-compartida-entre-web-1-y-web-2)
11. [El problema del CORS y cómo se resuelve](#11-el-problema-del-cors-y-cómo-se-resuelve)
12. [Resumen visual](#12-resumen-visual)

---

## 1. Visión general

Una aplicación web tradicional tiene todo junto: el servidor procesa la petición, consulta la base de datos, construye el HTML y lo envía al navegador. Todo en un mismo lugar.

SWAY usa un enfoque **desacoplado**: las responsabilidades están separadas en piezas independientes que se comunican entre sí mediante HTTP y JSON — el mismo protocolo que usa cualquier navegador para cargar una página web.

```
                        ┌──────────────────────────────────┐
                        │            API Flask             │
                        │           (app.py)               │
                        │      corre en puerto 5000        │
                        │                                  │
  ┌──────────────┐      │  /api/especies                   │      ┌─────────────┐
  │    Web 1     │◄────►│  /api/colaboradores/login        │◄────►│  SQL Server │
  │Flask + Jinja │      │  /api/avistamientos              │      │  (Base de   │
  │puerto: 5000  │      │  /api/estadisticas               │      │   Datos)    │
  └──────────────┘      │  ...50+ endpoints                │      └─────────────┘
                        └──────────────────────────────────┘
  ┌──────────────┐               ▲
  │    Web 2     │               │ HTTP + JSON
  │React + Vite  │◄──────────────┘
  │puerto: 5173  │
  └──────────────┘
```

Cada pieza puede existir, ejecutarse y en teoría desplegarse de manera independiente. Lo único que las conecta es el **contrato de la API**: las URLs, los métodos HTTP y el formato JSON de las respuestas.

---

## 2. Las 4 capas del sistema

| Capa | Tecnología | Responsabilidad |
|------|-----------|-----------------|
| **Base de Datos** | SQL Server | Almacenar y persistir todos los datos |
| **API** | Flask 2.3.3 + SQLAlchemy | Lógica de negocio, acceso a BD, autenticación |
| **Web 1** | Flask + Jinja2 + Bootstrap 5 | Sitio público, portal de colaboradores (SSR) |
| **Web 2** | React 18 + Vite + React Router | Portal científico como SPA (CSR) |

> **SSR** = Server-Side Rendering: el servidor construye el HTML antes de enviarlo al navegador.
> **CSR/SPA** = Client-Side Rendering / Single Page Application: el navegador recibe JS y construye el HTML él mismo.

---

## 3. Capa 1 — Base de Datos

SQL Server contiene 25+ tablas normalizadas a 3NF. Las principales:

```
Especies               Colaboradores          Avistamientos
──────────────         ──────────────         ──────────────
id (PK)                id (PK)                id (PK)
nombre_comun           nombre                 id_especie (FK)
nombre_cientifico      email                  id_colaborador (FK)
descripcion            password_hash          fecha
esperanza_vida         especialidad           latitud / longitud
poblacion_estimada     rol                    temperatura
id_estado_conservac.   ...                    profundidad
imagen_url                                    notas
...
```

**Regla fundamental**: ningún cliente web toca la base de datos directamente. No hay consultas SQL en el frontend. Todo pasa por la API.

Esto significa que si mañana se decide cambiar de SQL Server a PostgreSQL o MongoDB, los clientes web no se enteran — solo cambia el interior de la API.

---

## 4. Capa 2 — La API

Definida en `app.py`, es el **corazón del sistema**. Su única función es recibir peticiones HTTP, ejecutar lógica de negocio, hablar con la BD y devolver JSON.

### Endpoints principales

```
Autenticación
─────────────────────────────────────────────────────
POST   /api/colaboradores/login         Iniciar sesión
POST   /api/colaboradores/logout        Cerrar sesión
GET    /api/colaboradores/profile       Perfil del usuario actual
POST   /api/colaboradores/registro      Registrar nuevo colaborador

Especies
─────────────────────────────────────────────────────
GET    /api/especies                    Listar especies (con filtros y paginación)
GET    /api/especies/<id>               Detalle de una especie
POST   /api/especies                    Crear especie
PUT    /api/especies/<id>               Actualizar especie
DELETE /api/especies/<id>              Eliminar especie

Avistamientos
─────────────────────────────────────────────────────
GET    /api/colaboradores/avistamientos Avistamientos del colaborador logueado
POST   /api/reportar-avistamiento       Registrar nuevo avistamiento

Catálogos y estadísticas
─────────────────────────────────────────────────────
GET    /api/estados-conservacion        Catálogo de estados IUCN
GET    /api/estadisticas                Métricas generales del sistema
GET    /api/impacto-sostenible          Métricas de impacto ambiental
```

### Cómo responde la API

Toda respuesta es JSON. Por ejemplo, `GET /api/especies`:

```json
{
  "success": true,
  "especies": [
    {
      "id": 1,
      "nombre_comun": "Tortuga Verde",
      "nombre_cientifico": "Chelonia mydas",
      "imagen_url": "https://ejemplo.com/tortuga.jpg",
      "id_estado_conservacion": 3,
      "estado_conservacion": "peligro",
      "poblacion_estimada": 85000
    },
    ...
  ],
  "total": 47,
  "page": 1
}
```

Y ante un error, como `PUT /api/especies/999`:

```json
{
  "success": false,
  "error": "Especie no encontrada"
}
```

Con código HTTP `404`. El cliente lee ese código para saber si la operación tuvo éxito o no.

### Cómo se define un endpoint en Flask

```python
@app.route('/api/especies/<int:especie_id>', methods=['PUT'])
def update_especie(especie_id):
    # 1. Verificar que el usuario está autenticado
    if 'colaborador_id' not in session:
        return jsonify({'error': 'No autenticado'}), 401

    # 2. Leer el cuerpo JSON de la petición
    data = request.get_json()

    # 3. Validar los datos
    if not data.get('nombre_comun'):
        return jsonify({'error': 'nombre_comun es requerido'}), 400

    # 4. Actualizar en la base de datos
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE Especies SET nombre_comun=?, nombre_cientifico=? WHERE id=?",
        (data['nombre_comun'], data['nombre_cientifico'], especie_id)
    )
    conn.commit()

    # 5. Responder con JSON
    return jsonify({'success': True, 'message': 'Especie actualizada'})
```

Flask no sabe ni le importa si quien hizo esa petición fue Web 1, Web 2, una app móvil o Postman. Solo lee el JSON que llega y responde con JSON.

---

## 5. Capa 3 — Web 1 (Flask + Jinja2)

Web 1 es el sitio tradicional: páginas HTML generadas en el servidor. Flask tiene aquí un **doble rol**.

### Rol A — Servidor de páginas (SSR)

Flask renderiza templates Jinja2 y los envía al navegador como HTML completo:

```python
@app.route('/especies')
def especies_page():
    return render_template('especies.html')
    # El navegador recibe HTML listo para mostrar
```

El archivo `templates/especies.html` es HTML con variables de Jinja2:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Especies — SWAY</title>
  <!-- Bootstrap cargado desde CDN -->
</head>
<body>
  <div id="especies-container">
    <!-- Vacío al cargar, se llena con JS -->
  </div>

  <script>
    // Rol B: el JS de la página llama a la API
    fetch('/api/especies')
      .then(r => r.json())
      .then(data => {
        data.especies.forEach(esp => {
          document.getElementById('especies-container').innerHTML += `
            <div class="card">
              <img src="${esp.imagen_url}">
              <h3>${esp.nombre_comun}</h3>
            </div>
          `
        })
      })
  </script>
</body>
</html>
```

### ¿Por qué no hay CORS en Web 1?

Web 1 corre en el **mismo servidor** que la API (ambos son Flask, mismo proceso, mismo puerto `5000`). Cuando el JS de `especies.html` hace `fetch('/api/especies')`, la petición va al mismo origen — el navegador no aplica restricciones CORS porque no hay cruce de dominios.

---

## 6. Capa 4 — Web 2 (React + Vite)

Web 2 es una aplicación completamente diferente. No tiene servidor propio — es JavaScript puro que corre en el navegador. Vite es solo una herramienta de desarrollo que sirve los archivos estáticos.

### Estructura de archivos

```
web2/
├── index.html              # Punto de entrada (solo tiene <div id="root">)
├── vite.config.js          # Configuración del servidor de desarrollo
└── src/
    ├── main.jsx            # Monta React en el DOM
    ├── App.jsx             # Router principal
    ├── api/
    │   └── client.js       # TODA la comunicación con la API
    ├── pages/
    │   ├── Login.jsx       # Página de login
    │   └── Portal.jsx      # Dashboard principal
    └── components/
        ├── EspeciesGrid.jsx    # Grilla de tarjetas de especies
        ├── EspecieModal.jsx    # Modal de crear/editar especie
        ├── AvistamientosList.jsx
        └── Navbar.jsx
```

### El cliente de API — `src/api/client.js`

Este archivo es el punto central de toda la comunicación con el backend. Encapsula todos los `fetch()` en funciones reutilizables:

```js
const BASE = '/api'

// Función base que maneja cualquier petición HTTP
async function request(method, path, body) {
  const opts = {
    method,
    credentials: 'include',   // Envía las cookies de sesión Flask
    headers: body ? { 'Content-Type': 'application/json' } : {},
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(BASE + path, opts)

  const text = await res.text()
  const data = text ? JSON.parse(text) : {}

  if (!res.ok) {
    // Si el servidor respondió 4xx o 5xx, lanzar error
    throw new Error(data.error || data.message || `Error ${res.status}`)
  }
  return data
}

// Funciones específicas por dominio
export const api = {
  // Autenticación
  login:   (email, password) => request('POST', '/colaboradores/login', { email, password }),
  logout:  ()                => request('POST', '/colaboradores/logout'),
  profile: ()                => request('GET',  '/colaboradores/profile'),

  // Especies (CRUD completo)
  getEspecies:   ()         => request('GET',    '/especies'),
  createEspecie: (data)     => request('POST',   '/especies', data),
  updateEspecie: (id, data) => request('PUT',    `/especies/${id}`, data),
  deleteEspecie: (id)       => request('DELETE', `/especies/${id}`),

  // Avistamientos
  getAvistamientos: ()      => request('GET', '/colaboradores/avistamientos'),

  // Catálogos
  getEstadosConservacion: () => request('GET', '/estados-conservacion'),
}
```

### Cómo un componente React usa la API

En `Portal.jsx`, al montar el componente se cargan los datos:

```jsx
import { api } from '../api/client.js'

export default function Portal() {
  const [especies, setEspecies] = useState([])

  useEffect(() => {
    // Al montar, llamar a la API
    api.getEspecies().then(data => {
      setEspecies(data.especies)
    })
  }, [])

  const handleDelete = async (id) => {
    await api.deleteEspecie(id)      // DELETE /api/especies/7
    const data = await api.getEspecies()
    setEspecies(data.especies)       // Refrescar la lista
  }

  return (
    <div>
      {especies.map(esp => (
        <EspecieCard
          key={esp.id}
          especie={esp}
          onDelete={() => handleDelete(esp.id)}
        />
      ))}
    </div>
  )
}
```

React no sabe cómo funciona Flask ni SQL Server. Solo sabe que si llama a `api.getEspecies()` recibirá una lista de especies en JSON.

---

## 7. Cómo se comunican las capas

La comunicación es siempre mediante **HTTP + JSON**. No hay imports cruzados, no se comparte código entre capas, no hay llamadas a funciones de otro módulo.

```
Web 2 (React)                API (Flask)              Base de Datos
─────────────                ──────────               ─────────────

api.getEspecies()
  → fetch GET /api/especies
                        ───► recibe GET /api/especies
                             verifica sesión
                             cursor.execute(SELECT...)
                                                  ───► consulta SQL
                                                  ◄─── rows de datos
                             construye lista Python
                             return jsonify({...})
  ◄───────────────────────── {"success":true,"especies":[...]}

setEspecies(data.especies)
renderiza tarjetas en el DOM
```

Cada flecha representa una petición HTTP estándar — el mismo mecanismo que usa el navegador para cargar imágenes o páginas web.

---

## 8. El flujo completo de una petición

**Caso: el colaborador edita una especie desde Web 2**

```
1. USUARIO
   Hace clic en "Editar" en la tarjeta de la Tortuga Verde

2. REACT (EspeciesGrid.jsx)
   onEdit(especie) → abre EspecieModal con los datos actuales

3. USUARIO
   Cambia el nombre común, hace clic en "Guardar cambios"

4. REACT (EspecieModal.jsx)
   Valida el formulario localmente (campos requeridos, formatos)
   Llama a: onSave({ nombre_comun: "Tortuga Verde del Pacífico", ... })

5. REACT (Portal.jsx)
   handleSaveEspecie(formData)
   Llama a: api.updateEspecie(especie.id, formData)

6. api/client.js
   fetch('PUT', '/api/especies/1', { nombre_comun: "Tortuga Verde del Pacífico", ... })
   El navegador envía la cookie de sesión automáticamente

7. VITE PROXY (vite.config.js)
   Intercepta la petición a /api/especies/1
   La redirige a http://localhost:5000/api/especies/1
   (Evita el error de CORS entre puertos 5173 y 5000)

8. FLASK API (app.py → update_especie)
   Verifica que session['colaborador_id'] existe
   Lee el JSON del cuerpo de la petición
   Valida los datos
   Ejecuta UPDATE en SQL Server
   Retorna: {"success": true, "message": "Especie actualizada"}

9. SQL Server
   Actualiza el registro, confirma la transacción

10. DE VUELTA EN REACT
    api.updateEspecie() resuelve su promesa
    Portal.jsx llama refreshEspecies() → nuevo GET /api/especies
    setEspecies(nuevaLista) → React re-renderiza la grilla
    El usuario ve la especie con el nombre actualizado
```

---

## 9. Por qué "desacoplado"

**Acoplado** significaría que las piezas dependen unas de otras directamente. Por ejemplo, si Web 2 importara código Python de Flask — si Flask cambia, React se rompe.

**Desacoplado** significa que las piezas se conocen solo por su **interfaz pública** (las URLs y el formato JSON), no por su implementación interna.

### Consecuencias prácticas del desacoplamiento

| Pregunta | Respuesta gracias al desacoplamiento |
|----------|--------------------------------------|
| ¿Puedo cambiar Flask por FastAPI o Django? | Sí — mientras los endpoints respondan el mismo JSON, Web 1 y Web 2 no notan el cambio |
| ¿Puedo cambiar React por Vue o Angular en Web 2? | Sí — la API no cambia nada |
| ¿Puedo hacer una app móvil que use la misma API? | Sí — consume los mismos endpoints |
| ¿Puedo cambiar SQL Server por PostgreSQL? | Sí — solo cambia el interior de la API |
| ¿Puedo desplegar Web 2 en Vercel y la API en Railway? | Sí — se comunican por HTTP normal |

---

## 10. Autenticación compartida entre Web 1 y Web 2

La autenticación es el punto más delicado de la arquitectura. Flask maneja sesiones con **cookies**: cuando el usuario inicia sesión, Flask crea una cookie firmada que el navegador guarda y envía automáticamente en cada petición posterior.

### Login desde Web 2

```
POST /api/colaboradores/login
Body: { "email": "bio@sway.org", "password": "secreto123" }

Flask verifica credenciales
Flask ejecuta: session['colaborador_id'] = colaborador.id
Flask responde: {"success": true, "colaborador": {...}}
El navegador recibe la cookie Set-Cookie: session=...
```

### Peticiones posteriores

```
GET /api/colaboradores/profile
Cookie: session=xyz...  ← el navegador la envía automáticamente

Flask lee: session['colaborador_id'] → 42
Flask consulta el colaborador con id=42
Flask responde: {"nombre": "Dr. García", "especialidad": "Biología Marina"}
```

### La clave: `credentials: 'include'`

Por defecto, `fetch()` no envía cookies a orígenes distintos. Como Web 2 está en un puerto diferente, es necesario indicarlo explícitamente:

```js
fetch('/api/colaboradores/profile', {
  credentials: 'include'   // ← envía las cookies aunque sea cross-origin
})
```

Sin esto, cada petición de React llegaría a Flask sin sesión y devolvería `401 No autenticado`.

---

## 11. El problema del CORS y cómo se resuelve

**CORS** (Cross-Origin Resource Sharing) es una política de seguridad del navegador: si una página en `localhost:5173` intenta hacer `fetch` a `localhost:5000`, el navegador lo bloquea por defecto.

```
Web 2 en :5173 → fetch('http://localhost:5000/api/...') → BLOQUEADO por CORS
```

### Solución: el proxy de Vite

`vite.config.js` configura un proxy en el servidor de desarrollo:

```js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

Esto hace que las peticiones a `/api/*` desde React **no salgan del navegador hacia Flask directamente**. En cambio:

```
Web 2 en :5173 → fetch('/api/especies')
                     ↓
              Vite intercepta (mismo origen :5173)
                     ↓
              Vite reenvía a http://localhost:5000/api/especies
                     ↓
              Flask responde a Vite
                     ↓
              Vite devuelve la respuesta a React
```

Para el navegador, toda la comunicación ocurre con `localhost:5173` — sin cruces de origen, sin CORS.

### En producción

En producción no existe el proxy de Vite. La solución habitual es:
- Servir Web 2 como archivos estáticos desde el mismo servidor Flask (`/static/web2/`)
- O configurar un proxy inverso (Nginx) que enrute `/api/*` a Flask y todo lo demás a los archivos de React
- O habilitar CORS en Flask para el dominio de Vercel/Netlify donde esté desplegado Web 2

---

## 12. Resumen visual

```
NAVEGADOR DEL USUARIO
│
├── Abre localhost:5000/especies (Web 1)
│     │
│     └── Flask devuelve HTML (template Jinja2)
│           └── El HTML contiene JS que llama a /api/especies
│                 └── Flask responde JSON → JS renderiza las tarjetas
│
└── Abre localhost:5173 (Web 2 — React)
      │
      └── Vite devuelve index.html + bundle JS
            └── React se monta, llama a /api/especies (via proxy Vite)
                  └── Flask responde JSON → React renderiza componentes


SERVIDOR (mismo proceso Python)
│
├── Puerto 5000 — Flask
│     ├── Sirve páginas HTML (Web 1) → GET /especies, /tienda, /login...
│     └── Sirve la API (JSON)        → GET /api/especies, POST /api/colaboradores/login...
│           └── SQLAlchemy + pyodbc → SQL Server
│
└── Puerto 5173 — Vite (solo en desarrollo)
      └── Sirve archivos estáticos de React (JS, CSS, HTML)
            └── Proxy: /api/* → localhost:5000
```

---

*Generado por Claude Code — SWAY POO, 2026-03-17*
