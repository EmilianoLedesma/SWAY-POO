# 🌊 SWAY - Sistema de Conservación Marina

**SWAY** (Sistema Web de Avistamientos y Conservación Marina) es una plataforma integral diseñada para la conservación, monitoreo y educación sobre la vida marina. El sistema conecta a científicos, colaboradores y el público general en la misión de proteger nuestros océanos.

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Tecnologías Utilizadas](#️-tecnologías-utilizadas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Funcionalidades Clave](#-funcionalidades-clave)
- [Sistema de Usuarios](#-sistema-de-usuarios)
- [Catálogo de Especies](#-catálogo-de-especies)
- [Tienda Educativa](#️-tienda-educativa)
- [Portal de Colaboradores](#-portal-de-colaboradores)
- [Base de Datos](#️-base-de-datos)
- [API Endpoints](#-api-endpoints)
- [Instalación y Configuración](#-instalación-y-configuración)

## 🌟 Características Principales

### 🔬 **Investigación Científica**
- Catálogo completo de especies marinas con información científica verificada
- Sistema de clasificación por estado de conservación (IUCN)
- Registro y seguimiento de avistamientos con coordenadas GPS
- Portal especializado para colaboradores científicos

### 🌐 **Educación y Concienciación**
- Interfaz educativa con información detallada de especies
- Mapas interactivos de distribución y avistamientos
- Tienda de productos educativos sostenibles
- Contenido optimizado para diferentes niveles de conocimiento

### 🤝 **Colaboración Científica**
- Sistema de registro para colaboradores especializados
- Validación de credenciales académicas y experiencia
- Portal privado para gestión de datos científicos
- Herramientas de análisis y reportes

### 🛒 **Sostenibilidad Comercial**
- Tienda integrada con productos educativos
- Sistema de pagos seguro
- Gestión de inventario y pedidos
- Enfoque en productos sostenibles

## 🛠️ Tecnologías Utilizadas

### **Backend**
- **Python 3.x** - Lenguaje principal del servidor
- **Flask** - Framework web ligero y flexible
- **SQL Server** - Base de datos empresarial
- **pyodbc** - Conectividad con base de datos

### **Frontend**
- **HTML5** - Estructura semántica
- **CSS3** - Estilos avanzados y animaciones
- **JavaScript ES6+** - Interactividad y dinamismo
- **Bootstrap 5** - Framework responsive
- **AOS (Animate On Scroll)** - Animaciones suaves

### **Características Técnicas**
- **Diseño Responsive** - Adaptable a todos los dispositivos
- **Progressive Web App (PWA)** - Experiencia similar a app nativa
- **API RESTful** - Arquitectura escalable y modular
- **Validaciones Avanzadas** - Sistema de validación en tiempo real
- **Seguridad** - Autenticación, sesiones y encriptación

## 📁 Estructura del Proyecto

```
SWAY/
├── 📄 app.py                     # Servidor principal Flask
├── 📄 SWAY_DDL_Estructura.sql    # Esquema de base de datos
├── 📄 README.md                  # Documentación del proyecto
├── 📁 templates/                 # Plantillas HTML
│   ├── 🏠 index.html            # Página principal
│   ├── 🐠 especies.html         # Catálogo de especies
│   ├── 🛒 tienda.html           # Tienda educativa
│   ├── 👥 portal-colaboradores.html # Portal científico
│   └── 📄 ...                   # Otras páginas
├── 📁 assets/                    # Recursos estáticos
│   ├── 📁 css/                  # Hojas de estilo
│   ├── 📁 js/                   # Scripts JavaScript
│   └── 📁 img/                  # Imágenes y recursos
└── 📁 static/                    # Archivos estáticos públicos
```

## 🚀 Funcionalidades Clave

### 🔍 **Sistema de Búsqueda Avanzada**
- **Filtros Inteligentes**: Hábitat, estado de conservación, región
- **Búsqueda de Texto**: Por nombre común o científico
- **Ordenamiento Dinámico**: Múltiples criterios de ordenación
- **Paginación Eficiente**: Carga optimizada de resultados

### 🗺️ **Mapas Interactivos**
- **Visualización de Avistamientos**: Ubicaciones precisas con GPS
- **Filtros por Conservación**: Estados de amenaza visualizados
- **Zoom y Navegación**: Controles intuitivos de mapa
- **Información Contextual**: Tooltips informativos

### 📊 **Dashboard de Estadísticas**
- **Métricas en Tiempo Real**: Especies registradas, avistamientos
- **Gráficos Interactivos**: Estados de conservación, distribución
- **Análisis de Tendencias**: Evolución de avistamientos
- **Reportes Exportables**: Datos para investigación

## 👥 Sistema de Usuarios

### 🌐 **Usuarios Públicos**
- Exploración libre del catálogo de especies
- Acceso a información educativa
- Compras en la tienda (con registro)
- Visualización de mapas y estadísticas

### 🔬 **Colaboradores Científicos**
**Proceso de Registro:**
- Información académica detallada
- Años de experiencia (validación 0-100)
- Número de cédula profesional
- ORCID (identificador de investigador)
- Motivación y especialización

**Funcionalidades Exclusivas:**
- Portal privado con herramientas especializadas
- Carga y gestión de datos científicos
- Acceso a información detallada de especies
- Sistema de reportes y análisis

### 🛡️ **Sistema de Autenticación**
- **Registro Seguro**: Validación de contraseñas robustas
- **Login Protegido**: Verificación de credenciales
- **Sesiones Gestionadas**: Control de acceso por roles
- **Validaciones en Tiempo Real**: Feedback inmediato

## 🐠 Catálogo de Especies

### 📋 **Información Científica**
- **Taxonomía Completa**: Nombre común y científico
- **Estado de Conservación**: Clasificación IUCN
- **Características Físicas**: Descripción detallada
- **Datos Poblacionales**: Estimaciones y tendencias
- **Hábitat Natural**: Ecosistemas y distribución

### 🏷️ **Sistema de Filtrado**
- **Por Hábitat**: Arrecifes, aguas profundas, costero, etc.
- **Por Conservación**: Extinción crítica, vulnerable, etc.
- **Búsqueda de Texto**: Nombres y descripciones
- **Ordenamiento**: Alfabético, conservación, popularidad

### 🖼️ **Presentación Visual**
- **Galería de Imágenes**: Fotografías de alta calidad
- **Tarjetas Informativas**: Resumen visual atractivo
- **Modal Detallado**: Información completa expandible
- **Diseño Responsive**: Optimizado para todos los dispositivos

## 🛒 Tienda Educativa

### 📦 **Gestión de Productos**
- **Catálogo Diverso**: Productos educativos y sostenibles
- **Información Detallada**: Especificaciones técnicas
- **Imágenes Múltiples**: Visualización completa
- **Inventario en Tiempo Real**: Stock actualizado

### 🛍️ **Experiencia de Compra**
- **Carrito Inteligente**: Gestión dinámica de productos
- **Proceso de Pago**: Flujo simplificado y seguro
- **Cálculo de Envío**: Costos transparentes
- **Confirmación Inmediata**: Feedback de transacciones

### 💳 **Sistema de Pagos**
- **Múltiples Métodos**: Tarjetas, transferencias
- **Procesamiento Seguro**: Encriptación de datos
- **Historial de Pedidos**: Seguimiento completo
- **Facturación Automática**: Generación de comprobantes

## 🧑‍🔬 Portal de Colaboradores

### 🔐 **Acceso Exclusivo**
- **Autenticación Dual**: Email y contraseña verificados
- **Perfil Científico**: Información académica completa
- **Dashboard Personalizado**: Herramientas especializadas
- **Sesiones Seguras**: Control de acceso temporal

### 📊 **Herramientas de Investigación**
- **Base de Datos Completa**: Información científica detallada
- **Sistema de Avistamientos**: Registro de observaciones
- **Análisis Estadístico**: Tendencias y patrones
- **Exportación de Datos**: Formatos científicos estándar

### 🤝 **Colaboración Científica**
- **Red de Investigadores**: Conexión entre especialistas
- **Intercambio de Datos**: Plataforma colaborativa
- **Validación Científica**: Proceso de revisión por pares
- **Contribuciones Reconocidas**: Sistema de créditos

## 🗄️ Base de Datos

### 📊 **Estructura Principal**
```sql
Usuarios          -- Información base de usuarios
├── Colaboradores -- Datos científicos específicos
├── Especies      -- Catálogo de vida marina
├── Avistamientos -- Registros de observaciones
├── Productos     -- Catálogo de tienda
└── Pedidos       -- Transacciones comerciales
```

### 🔗 **Relaciones Clave**
- **Especies ↔ Hábitats**: Relación muchos a muchos
- **Especies ↔ Amenazas**: Factores de riesgo
- **Usuarios ↔ Avistamientos**: Contribuciones científicas
- **Colaboradores ↔ Especialidades**: Áreas de expertise

### 🛡️ **Integridad de Datos**
- **Claves Foráneas**: Consistencia referencial
- **Validaciones**: Restricciones de dominio
- **Índices Optimizados**: Consultas eficientes
- **Transacciones**: Operaciones atómicas

## 🔌 API Endpoints

### 🐠 **Especies**
```http
GET    /api/especies                 # Lista paginada con filtros
GET    /api/especies/{id}            # Detalles de especie específica
POST   /api/especies                 # Crear nueva especie (admin)
PUT    /api/especies/{id}            # Actualizar especie (admin)
DELETE /api/especies/{id}            # Eliminar especie (admin)
```

### 👥 **Usuarios y Colaboradores**
```http
POST   /api/usuarios/register        # Registro de usuario público
POST   /api/usuarios/login           # Autenticación de usuario
POST   /api/colaboradores/register   # Registro de colaborador
POST   /api/colaboradores/login      # Autenticación de colaborador
GET    /api/colaboradores/profile    # Perfil de colaborador autenticado
```

### 🛒 **Tienda**
```http
GET    /api/productos                # Catálogo de productos
GET    /api/productos/{id}           # Detalles de producto
POST   /api/pedidos                  # Crear nuevo pedido
GET    /api/pedidos/{id}             # Detalles de pedido
```

### 📍 **Avistamientos**
```http
GET    /api/avistamientos            # Lista de avistamientos
POST   /api/avistamientos            # Registrar nuevo avistamiento
GET    /api/avistamientos/mapa       # Datos para visualización en mapa
```

## ⚙️ Instalación y Configuración

### 📋 **Requisitos Previos**
- Python 3.8 o superior
- SQL Server 2019 o superior
- Driver ODBC para SQL Server

### 🚀 **Pasos de Instalación**

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/sway-marina.git
cd sway-marina
```

2. **Instalar dependencias**
```bash
pip install flask pyodbc python-dotenv
```

3. **Configurar base de datos**
```bash
# Ejecutar el script DDL en SQL Server
sqlcmd -S tu-servidor -d sway_db -i SWAY_DDL_Estructura.sql
```

4. **Configurar variables de entorno**
```bash
# Crear archivo .env
DB_SERVER=tu-servidor-sql
DB_DATABASE=sway_db
DB_USERNAME=tu-usuario
DB_PASSWORD=tu-contraseña
SECRET_KEY=tu-clave-secreta
```

5. **Ejecutar la aplicación**
```bash
python app.py
```

6. **Acceder al sistema**
```
http://localhost:5000
```

### 🔧 **Configuración Adicional**

- **Certificados SSL**: Para producción, configurar HTTPS
- **Base de datos**: Ajustar cadena de conexión según entorno
- **Archivos estáticos**: Configurar servidor web para producción
- **Logs**: Habilitar logging detallado para debugging

## 📈 **Métricas del Proyecto**

- **+50 Especies** documentadas con información científica
- **+1000 líneas** de código Python backend
- **+2000 líneas** de código JavaScript frontend
- **15+ Tablas** en base de datos normalizada
- **20+ Endpoints** API RESTful
- **100% Responsive** en todos los dispositivos

## 🌟 **Funcionalidades Destacadas**

### 🎨 **Interfaz de Usuario**
- Diseño moderno y atractivo
- Animaciones suaves y transiciones
- Navegación intuitiva
- Accesibilidad optimizada

### ⚡ **Rendimiento**
- Carga rápida de páginas
- Optimización de imágenes
- Consultas eficientes a BD
- Caché inteligente

### 🔒 **Seguridad**
- Validación de datos robusta
- Protección contra inyección SQL
- Sesiones seguras
- Encriptación de contraseñas

## 🤝 **Contribuciones**

SWAY es un proyecto de conservación marina que busca crear conciencia y facilitar la investigación científica. Cada funcionalidad ha sido diseñada pensando en la usabilidad tanto para el público general como para la comunidad científica.

---

**Desarrollado con 💙 para la conservación de nuestros océanos** 🌊

*"En cada gota del océano, existe la historia de la vida"*