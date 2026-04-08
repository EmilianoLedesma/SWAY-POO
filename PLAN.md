# Plan SWAY — Estado Actual y Tareas Pendientes
*Última actualización: 2026-03-19 (sesión 2)*

---

## Arquitectura actual (post-migración FastAPI completa)

```
SWAY POO/
├── app/                              ← FastAPI (puerto 8000) ✅
│   ├── main.py                       ← 60+ endpoints, 9 routers, CORS
│   ├── data/database.py              ← get_db_connection(), construir_nombre_completo()
│   ├── models/                       ← Pydantic v2 schemas
│   │   ├── colaboradores.py          ← ColaboradorLogin, ColaboradorRegister,
│   │   │                                ColaboradorPerfilUpdate, ColaboradorPasswordChange
│   │   ├── especies.py               ← EspecieCreate, EspecieUpdate
│   │   ├── pedidos.py                ← DireccionEnvio, PagoInfo, PedidoCreate, CarritoAgregar
│   │   ├── productos.py
│   │   ├── eventos.py                ← EventoCreate
│   │   └── catalogos.py              ← NewsletterSuscripcion, ContactoMensaje, DonacionCreate
│   ├── routers/                      ← Migración 1:1 de blueprints Flask
│   │   ├── auth.py                   ← /api/user/*, /api/auth/*
│   │   ├── colaboradores.py          ← /api/colaboradores/* (10 endpoints)
│   │   ├── especies.py               ← /api/especies/* + catálogos (12 endpoints)
│   │   ├── pedidos.py                ← /api/pedidos/*, /api/carrito/*
│   │   ├── productos.py              ← /api/productos, /api/categorias...
│   │   ├── eventos.py                ← /api/eventos/*
│   │   ├── estadisticas.py           ← /api/estadisticas, /api/reportes/especies (PDF)
│   │   ├── direcciones.py            ← /api/direcciones/*
│   │   └── catalogos.py              ← /api/newsletter, /api/contacto, /api/donacion...
│   └── security/auth.py              ← JWT: create_token, decode_token, 3 Depends
│
├── app.py                            ← Flask (puerto 5000) — solo 14 rutas de templates ✅
├── models.py                         ← SQLAlchemy ORM (sin cambios)
├── db.py                             ← Referencia (sin cambios)
├── face_service.py                   ← Firma biométrica (funcionalidad pausada)
│
├── LEGACY_FLASK/                     ← Archivos Flask ya no activos ✅
│   ├── blueprints/                   ← 9 módulos API originales
│   ├── routes_orm.py
│   ├── validators.py
│   └── README.md
│
├── web2/                             ← React 18 + Vite (puerto 5173) ✅
│   ├── vite.config.js                ← Proxy → puerto 8000
│   └── src/
│       ├── api/client.js             ← Bearer JWT, BASE = http://localhost:8000/api
│       ├── pages/
│       │   ├── Login.jsx             ← Login colaborador → guarda colab_token
│       │   └── Portal.jsx            ← Vista principal con 4 secciones de sidebar
│       └── components/
│           ├── EspeciesGrid.jsx      ← Listado CRUD de especies
│           ├── EspecieModal.jsx      ← Formulario crear/editar especie
│           ├── AvistamientosList.jsx ← Timeline de avistamientos
│           ├── PerfilView.jsx        ← CRUD completo perfil colaborador (4 tabs)
│           ├── DashboardView.jsx     ← Dashboard con SVG charts + stats + PDF (sesión 2)
│           └── Navbar.jsx
│
├── assets/js/                        ← Web1 JS ✅ (todos actualizados a JWT)
│   ├── tienda.js                     ← API_BASE :8000, authHeaders(), tienda_token
│   ├── mis-pedidos.js                ← API_BASE :8000, authHeaders()
│   ├── main.js                       ← API_BASE :8000
│   ├── especies.js                   ← API_BASE :8000
│   └── eventos.js                    ← API_BASE :8000
│
└── templates/portal-colaboradores.html ← Chart.js integrado (2 gráficas) ✅
```

---

## Cómo arrancar el proyecto

```bash
# Terminal 1 — FastAPI (APIs)
python -m uvicorn app.main:app --port 8000 --reload
# → http://localhost:8000/docs  (60+ endpoints documentados)

# Terminal 2 — Flask (Web1 templates)
python app.py
# → http://localhost:5000

# Terminal 3 — React Web2
cd web2 && npm run dev
# → http://localhost:5173
```

---

## Estado de requisitos de evaluación

| # | Requisito | Pts | Estado | Detalle |
|---|-----------|-----|--------|---------|
| 1 | Arquitectura desacoplada (Web+API+BD) | 5 | ✅ Completo | Flask Web1 + FastAPI + React Web2 + SQL Server |
| 2 | 2 frameworks diferentes | 5 | ✅ Completo | Flask/Jinja2 (Web1) + React 18 (Web2) |
| 3 | Web2 consume API REST | 5 | ✅ Completo | client.js → FastAPI :8000, Bearer JWT |
| 4 | API REST con FastAPI | 5 | ✅ Completo | 60+ endpoints en /docs, 9 routers |
| 5 | 2+ CRUDs funcionales | 5 | ✅ Completo | Especies, Colaboradores/Perfil, Productos, Pedidos |
| 6 | Validaciones de datos | 5 | ✅ Completo | Pydantic v2 server-side + validaciones cliente JS |
| 7 | Autenticación JWT | 5 | ✅ Completo | Bearer tokens tienda + colaborador, 8h expiry |
| 8 | Frontend estético (Bootstrap 5) | 5 | ✅ Completo | 11 páginas Web1 + SPA React con design system |
| 9 | Reportes descargables PDF | 5 | ✅ Completo | GET /api/reportes/especies → PDF reportlab; botón en Web2 |
| 10 | Gráficas con Chart.js | 5 | ✅ Completo | 2 gráficas en portal-colaboradores.html (doughnut + bar) |
| 11 | Dashboard con estadísticas dinámicas | 5 | ✅ Completo | Datos desde /api/estadisticas y /api/especies/estadisticas |
| 12 | Despliegue en la nube | 5 | ⏳ Pendiente | Procfile listo, falta ejecutar el deploy |
| 13 | ORM SQLAlchemy | 5 | ✅ Completo | models.py + SQLAlchemy, get_engine/get_session |
| 14 | Estructura del proyecto | 5 | ✅ Completo | app/ estructura miAPI, LEGACY_FLASK/ separado |

**Estimado actual: ~65 / 70 pts**
**Con despliegue: 70 / 70 pts**

---

## Lo que se completó en esta sesión (2026-03-19 — sesión 2)

### Web2 React — Frontend

- **DashboardView.jsx** — nuevo componente que reemplaza la vista simple de reportes. Incluye:
  - 8 stat cards en 2 filas (total especies, extinción crítica, en peligro, vulnerables / agregadas mes, avistamientos totales, hábitats, calidad agua)
  - SVG Donut chart: distribución de estados de conservación con leyenda
  - SVG Bar chart vertical: distribución por estado de conservación
  - SVG Horizontal bar chart: top 6 especies más avistadas
  - Lista de avistamientos recientes con fecha y coordenadas
  - Cards de impacto sostenible (agua limpiada, corales plantados, familias beneficiadas, plástico reciclado)
  - Botón PDF integrado al fondo del dashboard
  - Sin dependencias externas — puro SVG/CSS
- **client.js** — 2 nuevos métodos añadidos:
  - `getAvistamientosAll: () => request('GET', '/avistamientos')`
  - `getImpactoSostenible: () => request('GET', '/impacto-sostenible')`
- **Portal.jsx** — sección `reportes` ahora renderiza `<DashboardView />` en lugar del card simple; sidebar responsive (abierto/cerrado según ancho de ventana)

### FastAPI — Modelos Pydantic

- **Todos los modelos** actualizados con `Field(...)` estilo miAPI (min_length, max_length, gt, ge, le, description, example)
- **Eliminado `Optional`** de los modelos CRUD principales para evitar `anyOf` en Swagger:
  - `EspecieCreate` / `EspecieUpdate`: campos nullable con defaults (`str=""`, `int=0`, `List[int]=[]`), `id_estado_conservacion` requerido
  - `ColaboradorRegister`: apellidos/cedula/orcid como `str = Field("")`
  - `ColaboradorPerfilUpdate`: todos los campos como `str = Field("")` (sin Optional)
- **Routers actualizados**:
  - `app/routers/especies.py`: INSERT/UPDATE usan `data.campo or None` para convertir `""` y `0` a NULL
  - `app/routers/colaboradores.py`: `update_colaborador_perfil` usa `if data.campo:` en lugar de `if data.campo is not None:`

### Autenticación JWT Bearer (Web2)

- Login (`Login.jsx`) guarda `colab_token` en localStorage tras respuesta exitosa de `/api/colaboradores/login`
- Todas las peticiones en `client.js` incluyen `Authorization: Bearer <colab_token>` automáticamente vía la función `request()`
- Descarga de PDF usa `Bearer` en header separado (fetch directo a `/api/reportes/especies`)
- Portal redirige al login si el token es inválido o expira (catch en `loadData`)

---

## Lo que se completó en esta sesión (2026-03-19)

### FastAPI — Backend

- **Migración completa** de 9 blueprints Flask → 9 routers FastAPI (`app/`)
- **JWT Bearer tokens** — dos tipos: `tienda` y `colaborador`, 8h expiry, python-jose
- **CRUD perfil colaborador** — 3 endpoints nuevos:
  - `PUT /api/colaboradores/perfil` — actualiza Usuarios + Colaboradores en una llamada
  - `PUT /api/colaboradores/perfil/password` — cambia contraseña con verificación
  - `DELETE /api/colaboradores/perfil` — soft delete (activo=0 en ambas tablas)
- **GET /api/colaboradores/profile** — extendido para retornar `telefono`, `fecha_nacimiento`, `motivacion`, `usuario_id`
- **GET /api/reportes/especies** — genera PDF con reportlab (especies + estadísticas)
- **Bug crítico corregido**: `INSERT/UPDATE Especies` usaba columnas `firmado_por` y `fecha_firma` que no existen en el DDL — removidas

### Web2 React — Frontend

- **Portal sidebar** ahora tiene 4 secciones: Especies, Avistamientos, Mi Perfil, Reportes
- **Mi Perfil** (`PerfilView.jsx`) — CRUD completo con 4 pestañas:
  - *Datos Personales*: nombre, apellidos, teléfono, fecha nacimiento (lectura/edición)
  - *Datos Profesionales*: especialidad, grado, institución, años de exp, cédula, ORCID, motivación
  - *Contraseña*: formulario de cambio con verificación de contraseña actual
  - *Cuenta*: desactivación con confirmación de dos pasos (soft delete)
- **Reportes** — vista con botón "Descargar Reporte PDF" + spinner + mensaje éxito/error
- **Bug corregido**: `setProfile(profileData)` guardaba respuesta completa `{success, colaborador:{...}}`; ahora extrae `profileData.colaborador` — las iniciales y el perfil funcionan correctamente
- **PerfilView** sincroniza form con `useEffect([perfil])` para cuando los datos cargan después del mount

### Web1 JS — Assets

- `tienda.js`, `mis-pedidos.js`, `main.js`, `especies.js`, `eventos.js` — todos actualizados:
  - `const API_BASE = 'http://localhost:8000/api'`
  - `function authHeaders()` con `localStorage.getItem('tienda_token')`
- **Bug corregido** en mis-pedidos.js: logout llamaba `/logout` → corregido a `/user/logout`

### Chart.js — Templates Flask

- `templates/portal-colaboradores.html` — 2 gráficas integradas:
  - Doughnut: especies por estado de conservación (`/api/especies/estadisticas`)
  - Bar: estadísticas generales (`/api/estadisticas`)
- CDN Chart.js + IIFE de inicialización con Bearer token desde localStorage

### LEGACY_FLASK/

- `blueprints/`, `routes_orm.py`, `validators.py` movidos a `LEGACY_FLASK/`
- `app.py` arranca limpio (sin dependencias de LEGACY_FLASK)
- FastAPI mantiene 60+ rutas activas

---

## Tarea única pendiente

### Despliegue en la nube (+5 pts, req 12)

El proyecto necesita estar accesible desde internet. Opciones ordenadas por facilidad:

**Opción A — ngrok (demo rápida, sin migración de BD)**
```bash
# Con FastAPI corriendo en :8000
ngrok http 8000
# URL pública temporal: https://xxxx.ngrok.io
# Actualizar BASE en client.js y API_BASE en assets/js/*
```

**Opción B — Railway.app (permanente)**
1. Crear cuenta en railway.app
2. Conectar repo GitHub
3. Agregar servicio Python → FastAPI:
   ```
   # Variables de entorno en Railway:
   DATABASE_URL=...  # SQL Server o migrar a PostgreSQL
   SECRET_KEY=sway_secret_key_ultra_secreta
   ```
4. Actualizar Procfile:
   ```
   web: python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. Web2 → Vercel o Netlify (build: `npm run build`, root: `web2/`)

**Opción C — Render.com**
- Similar a Railway, detección automática de Python
- BD: usar Render PostgreSQL o mantener SQL Server con conexión externa

---

## Endpoints FastAPI — referencia completa

### Auth — tienda (`/api/user/*`, `/api/auth/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /api/user/login | — | Login tienda → JWT `token_type:tienda` |
| POST | /api/user/register | — | Registro usuario |
| POST | /api/user/logout | — | No-op server-side |
| GET | /api/user/status | tienda | Datos del usuario autenticado |
| POST | /api/auth/login | — | Login alternativo |
| POST | /api/auth/register | — | Registro alternativo |

### Colaboradores (`/api/colaboradores/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /api/colaboradores/login | — | Login → JWT `token_type:colaborador` |
| POST | /api/colaboradores/register | — | Registro colaborador |
| POST | /api/colaboradores/logout | — | No-op |
| GET | /api/colaboradores/profile | colaborador | Perfil completo (Usuarios + Colaboradores) |
| GET | /api/colaboradores/status | colaborador | Estado de sesión |
| POST | /api/colaboradores/check-email | — | Verificar email registrado |
| GET | /api/colaboradores/avistamientos | colaborador | Avistamientos del colaborador |
| PUT | /api/colaboradores/perfil | colaborador | Actualizar datos personales y profesionales |
| PUT | /api/colaboradores/perfil/password | colaborador | Cambiar contraseña |
| DELETE | /api/colaboradores/perfil | colaborador | Desactivar cuenta (soft delete) |

### Especies (`/api/especies/*`)
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /api/especies | — | Lista paginada con filtros (search, habitat, conservation) |
| POST | /api/especies | colaborador | Crear especie |
| GET | /api/especies/estadisticas | — | Conteos por estado de conservación |
| GET | /api/especies/opciones-filtros | — | Catálogos para dropdowns |
| GET | /api/especies/busqueda-avanzada | — | Búsqueda multi-criterio |
| GET | /api/especies/{id} | — | Detalle completo de especie |
| PUT | /api/especies/{id} | colaborador | Actualizar especie |
| DELETE | /api/especies/{id} | colaborador | Eliminar especie |
| GET | /api/estados-conservacion | — | Catálogo IUCN |
| GET | /api/amenazas | — | Catálogo amenazas |
| GET | /api/habitats | — | Catálogo hábitats |
| GET | /api/tipos-especies | — | Catálogo tipos de organismos |

### Productos y Tienda
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /api/productos | — | Lista paginada de productos |
| GET | /api/producto/{id} | — | Detalle de producto |
| GET | /api/reseñas/{id} | — | Reseñas de producto |
| GET | /api/materiales | — | Catálogo materiales |
| GET | /api/categorias | — | Catálogo categorías |

### Pedidos y Carrito
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /api/pedidos/crear | — | Crear pedido (user_id en body) |
| GET | /api/pedidos/mis-pedidos | tienda | Pedidos del usuario autenticado |
| GET | /api/pedidos/usuario/{id} | tienda | Pedidos por user_id |
| GET | /api/pedidos/detalle/{id} | tienda | Detalle de pedido |
| POST | /api/pedidos/reordenar/{id} | tienda | Reordenar pedido anterior |
| POST | /api/carrito/agregar | — | Validar stock antes de agregar |
| GET | /api/tipos-tarjeta | — | Catálogo tipos de tarjeta |

### Eventos
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /api/eventos | — | Lista eventos activos |
| POST | /api/eventos/crear | opcional | Crear evento |
| GET | /api/tipos-evento | — | Catálogo tipos de evento |
| GET | /api/modalidades | — | Catálogo modalidades |

### Estadísticas y Reportes
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /api/estadisticas | — | Estadísticas generales del sistema |
| GET | /api/impacto-sostenible | — | Métricas de impacto ambiental |
| GET | /api/avistamientos | — | Todos los avistamientos |
| POST | /api/reportar-avistamiento | — | Registrar avistamiento |
| GET | /api/reportes/especies | colaborador | PDF con catálogo de especies (reportlab) |

### Direcciones y Catálogos
| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | /api/direcciones/estados | — | Catálogo estados de México |
| GET | /api/direcciones/municipios/{id} | — | Municipios por estado |
| GET | /api/direcciones/colonias/{id} | — | Colonias por municipio |
| GET | /api/direcciones/calles/{id} | — | Calles por colonia |
| GET | /api/regiones | — | Catálogo regiones oceánicas |
| POST | /api/newsletter | — | Suscribir email |
| POST | /api/contacto | — | Enviar mensaje de contacto |
| POST | /api/procesar-donacion | — | Procesar donación |
| POST | /api/setup-tienda | — | Insertar datos de ejemplo |

---

## Diseño JWT — referencia rápida

```json
// Token tienda
{ "sub": "42", "email": "user@mail.com", "name": "Juan Pérez", "token_type": "tienda", "exp": ... }

// Token colaborador
{ "sub": "7", "colaborador_id": 3, "email": "colab@upq.edu.mx", "token_type": "colaborador", "exp": ... }
```

```
Authorization: Bearer <token>
localStorage keys: tienda_token (Web1), colab_token (Web2)
```
