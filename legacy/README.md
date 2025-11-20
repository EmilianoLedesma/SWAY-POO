# SWAY - Sistema Web de Conservación Marina

## Descripción
SWAY es una aplicación web desarrollada con Flask que se enfoca en la conservación marina y la educación sobre especies en peligro de extinción.

## Características
- Catálogo interactivo de especies marinas
- Sistema de reporte de avistamientos
- Newsletter y suscripciones
- API RESTful para datos de especies
- Interfaz responsive y moderna

## Instalación

### Requisitos previos
- Python 3.8 o superior
- pip (gestor de paquetes de Python)

### Pasos de instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd c:\Users\Emiliano\Documents\Sway
   ```

2. **Crear un entorno virtual (recomendado)**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # En Windows
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Ejecutar la aplicación**
   ```bash
   python app.py
   ```

5. **Acceder a la aplicación**
   - Abrir navegador web
   - Ir a: `http://localhost:5000`

## Estructura del proyecto

```
Sway/
├── app.py                 # Archivo principal de Flask
├── requirements.txt       # Dependencias del proyecto
├── README.md             # Este archivo
├── templates/            # Plantillas HTML
│   ├── index.html
│   ├── especies.html
│   ├── eventos.html
│   ├── biblioteca.html
│   ├── tienda.html
│   ├── payment.html
│   ├── toma-accion.html
│   ├── starter-page.html
│   ├── 404.html
│   └── 500.html
└── assets/               # Archivos estáticos
    ├── css/
    ├── js/
    ├── img/
    └── vendor/
```

## Rutas disponibles

### Páginas principales
- `/` - Página de inicio
- `/especies` - Catálogo de especies
- `/eventos` - Eventos y actividades
- `/biblioteca` - Biblioteca de recursos
- `/tienda` - Tienda online
- `/payment` - Procesamiento de pagos
- `/toma-accion` - Acciones de conservación
- `/starter-page` - Página de inicio básica

### API Endpoints
- `GET /api/especies` - Obtener todas las especies (con filtros)
- `GET /api/especies/<id>` - Obtener detalles de una especie
- `POST /api/reportar-avistamiento` - Reportar avistamiento
- `POST /api/newsletter` - Suscribirse al newsletter
- `GET /api/estadisticas` - Obtener estadísticas generales

## Parámetros de filtrado para especies

### GET /api/especies
- `habitat`: arrecife, aguas-profundas, aguas-abiertas, costero, polar, manglar, estuario
- `conservation`: extincion-critica, peligro, vulnerable, casi-amenazada, preocupacion-menor
- `type`: mamiferos, peces, reptiles, invertebrados, corales, algas, aves
- `region`: pacifico, atlantico, indico, artico, antartico, mediterraneo, caribe
- `search`: búsqueda por nombre común o científico

Ejemplo:
```
GET /api/especies?habitat=arrecife&conservation=peligro&search=coral
```

## Configuración

### Variables de entorno
Puedes crear un archivo `.env` con las siguientes variables:

```env
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=tu_clave_secreta_muy_segura
DATABASE_URL=postgresql://usuario:contraseña@localhost/sway_db
```

### Configuración de producción
Para producción, modifica las siguientes configuraciones en `app.py`:

```python
if __name__ == '__main__':
    app.run(
        debug=False,  # Cambiar a False en producción
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000))
    )
```

## Desarrollo

### Agregar nuevas especies
Para agregar nuevas especies, modifica el array `especies_data` en `app.py`:

```python
nueva_especie = {
    'id': 'id-unico',
    'nombre': 'Nombre común',
    'nombre_cientifico': 'Nombre científico',
    'estado_conservacion': 'vulnerable',
    'habitat': 'costero',
    'tipo': 'mamiferos',
    'region': 'pacifico',
    # ... otros campos
}
```

### Estructura de datos para avistamientos
```json
{
    "species_name": "Nombre de la especie",
    "sighting_date": "2025-01-01",
    "location": "Ubicación del avistamiento",
    "coordinates": "lat, lng (opcional)",
    "observer_name": "Nombre del observador",
    "observer_email": "email@ejemplo.com",
    "description": "Descripción del avistamiento",
    "photo_url": "URL de la foto (opcional)"
}
```

## Comandos útiles

### Instalar dependencias
```bash
pip install -r requirements.txt
```

### Ejecutar en modo desarrollo
```bash
python app.py
```

### Ejecutar con gunicorn (producción)
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Generar requirements.txt
```bash
pip freeze > requirements.txt
```

## Troubleshooting

### Error: "No module named 'flask'"
```bash
pip install flask
```

### Error: "TemplateNotFound"
- Verificar que los archivos HTML están en la carpeta `templates/`
- Verificar que el nombre del archivo coincide exactamente

### Error: "FileNotFoundError" para archivos CSS/JS
- Verificar que los archivos están en la carpeta `assets/`
- Verificar las rutas en los archivos HTML

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

## Contacto

- **Proyecto**: SWAY - Sistema Web de Conservación Marina
- **Email**: 123046244@upq.edu.mx
- **Ubicación**: Universidad Politécnica de Querétaro

## Próximas funcionalidades

- [ ] Integración con base de datos PostgreSQL/MySQL
- [ ] Sistema de autenticación de usuarios
- [ ] Panel de administración
- [ ] Mapa interactivo con Leaflet/OpenStreetMap
- [ ] Sistema de notificaciones
- [ ] API de geolocalización
- [ ] Integración con redes sociales
- [ ] Sistema de donaciones
- [ ] Reportes y analytics
- [ ] Versión móvil nativa
