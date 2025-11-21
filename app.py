from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, flash, session
from flask_cors import CORS
import os
import json
import pyodbc
from datetime import datetime
import sqlite3
from sqlalchemy.orm import scoped_session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash

# Importar modelos y validadores
from models import (
    get_session, Usuario, Colaborador, EspecieMarina, EstadoConservacion,
    Producto, CategoriaProducto, Pedido, DetallePedido, CarritoCompra,
    AvistamientoEspecie, TipoHabitat, TipoAmenaza
)
from validators import (
    validate_user_registration, validate_user_login, validate_colaborador_registration,
    validate_especie_marina, validate_producto, validate_pedido, validate_direccion_envio,
    validate_metodo_pago, ValidationError
)

app = Flask(__name__, static_folder='assets', static_url_path='/static')

# Configurar secret key para sesiones
app.secret_key = 'sway_secret_key_ultra_secreta'

# Configurar CORS para permitir peticiones AJAX
CORS(app)

# Crear sesión de SQLAlchemy con scope
db_session = scoped_session(lambda: get_session())

# Función helper para construir nombres completos evitando duplicación
def construir_nombre_completo(nombre, apellido_paterno, apellido_materno, prefijo=""):
    """
    Construye un nombre completo evitando duplicación de apellidos.
    Si el nombre ya contiene los apellidos, no los agrega nuevamente.
    """
    if not nombre:
        return "Usuario"
    
    # Verificar si el nombre ya incluye los apellidos
    if apellido_paterno and apellido_paterno in nombre:
        return f"{prefijo}{nombre}".strip()
    else:
        # Construir el nombre completo con apellidos separados
        apellidos = []
        if apellido_paterno:
            apellidos.append(apellido_paterno)
        if apellido_materno:
            apellidos.append(apellido_materno)
        
        if apellidos:
            return f"{prefijo}{nombre} {' '.join(apellidos)}".strip()
        else:
            return f"{prefijo}{nombre}".strip()

# Configurar headers para evitar caché en desarrollo
@app.after_request
def add_no_cache_headers(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache' 
    response.headers['Expires'] = '0'
    return response

# Función para conectar a la base de datos
def get_db_connection():
    try:
        server = 'DESKTOP-VAT773J'
        database = 'sway'  # Cambiado a la base de datos sway
        username = 'EmilianoLedesma'
        password = 'Emiliano1'
        
        connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
        connection = pyodbc.connect(connection_string)
        return connection
    except Exception as e:
        print(f"Error de conexión: {e}")
        return None

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/especies')
def especies():
    """Página del catálogo de especies"""
    return render_template('especies.html')

@app.route('/eventos')
def eventos():
    """Página de eventos"""
    return render_template('eventos.html')

@app.route('/biblioteca')
def biblioteca():
    """Página de biblioteca"""
    return render_template('biblioteca.html')

@app.route('/tienda')
def tienda():
    """Página de tienda"""
    return render_template('tienda.html')

@app.route('/mis-pedidos')
def mis_pedidos():
    """Página de pedidos del usuario"""
    return render_template('mis-pedidos.html')

@app.route('/payment')
def payment():
    """Página de pagos"""
    return render_template('payment.html')

@app.route('/toma-accion')
def toma_accion():
    """Página de toma de acción"""
    return render_template('toma-accion.html')

@app.route('/starter-page')
def starter_page():
    """Página de inicio básica"""
    return render_template('starter-page.html')

# API Endpoints para especies
# FUNCIÓN DUPLICADA ELIMINADA - Se usa la versión más actualizada más abajo

def get_especies_fallback():
    """Devolver datos de especies de fallback cuando no hay conexión a BD"""
    try:
        # Obtener parámetros de filtro
        habitat = request.args.get('habitat', '')
        conservation = request.args.get('conservation', '')
        tipo = request.args.get('type', '')
        region = request.args.get('region', '')
        search = request.args.get('search', '').lower()
        sort_by = request.args.get('sort', 'nombre')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 12))
        
        # Usar datos simulados extendidos
        filtered_especies = especies_data.copy()
        
        # Aplicar filtros
        if search:
            filtered_especies = [e for e in filtered_especies if 
                               search in e['nombre'].lower() or 
                               search in e['nombre_cientifico'].lower()]
        
        if habitat:
            filtered_especies = [e for e in filtered_especies if e.get('habitat') == habitat]
        
        if conservation:
            filtered_especies = [e for e in filtered_especies if e.get('estado_conservacion') == conservation]
        
        if tipo:
            filtered_especies = [e for e in filtered_especies if e.get('tipo') == tipo]
        
        if region:
            filtered_especies = [e for e in filtered_especies if e.get('region') == region]
        
        # Aplicar ordenamiento
        if sort_by == 'conservation':
            conservation_order = {
                'extincion-critica': 0,
                'peligro': 1,
                'vulnerable': 2,
                'casi-amenazada': 3,
                'preocupacion-menor': 4
            }
            filtered_especies.sort(key=lambda x: conservation_order.get(x.get('estado_conservacion', ''), 5))
        elif sort_by == 'nombre':
            filtered_especies.sort(key=lambda x: x.get('nombre', ''))
        
        # Aplicar paginación
        total_records = len(filtered_especies)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_especies = filtered_especies[start_idx:end_idx]
        
        return jsonify({
            'especies': paginated_especies,
            'total': total_records,
            'page': page,
            'limit': limit,
            'total_pages': (total_records + limit - 1) // limit
        })
        
    except Exception as e:
        print(f"Error en get_especies_fallback: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


# COMENTADO: Función duplicada - usamos la versión más actualizada en línea 2796
# @app.route('/api/especies/<int:especie_id>')
# def api_especie_detalle(especie_id):
    """API para obtener detalles de una especie específica por ID numérico"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Obtener datos básicos de la especie
        cursor.execute("""
            SELECT e.id, e.nombre_comun, e.nombre_cientifico, e.descripcion, 
                   e.esperanza_vida, e.poblacion_estimada, e.imagen_url,
                   ec.nombre as estado_conservacion
            FROM Especies e
            LEFT JOIN EstadosConservacion ec ON e.id_estado_conservacion = ec.id
            WHERE e.id = ?
        """, (especie_id,))
        
        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({'error': 'Especie no encontrada'}), 404
        
        # Obtener hábitats de la especie
        cursor.execute("""
            SELECT h.nombre, h.descripcion
            FROM EspeciesHabitats eh
            JOIN Habitats h ON eh.id_habitat = h.id
            WHERE eh.id_especie = ?
        """, (especie_id,))
        habitats = cursor.fetchall()
        
        # Obtener características de la especie
        cursor.execute("""
            SELECT c.tipo_caracteristica, c.valor
            FROM EspeciesCaracteristicas ec
            JOIN Caracteristicas c ON ec.id_caracteristica = c.id
            WHERE ec.id_especie = ?
        """, (especie_id,))
        caracteristicas = cursor.fetchall()
        
        # Obtener amenazas de la especie
        cursor.execute("""
            SELECT a.nombre, a.descripcion
            FROM EspeciesAmenazas ea
            JOIN Amenazas a ON ea.id_amenaza = a.id
            WHERE ea.id_especie = ?
        """, (especie_id,))
        amenazas = cursor.fetchall()
        
        # Procesar características para extraer información específica
        longitud = 'No disponible'
        peso = 'No disponible'
        temperatura = 'No disponible'
        profundidad = 'No disponible'
        
        for tipo, valor in caracteristicas:
            tipo_lower = tipo.lower()
            if 'longitud' in tipo_lower or 'tamaño' in tipo_lower:
                longitud = valor
            elif 'peso' in tipo_lower:
                peso = valor
            elif 'temperatura' in tipo_lower:
                temperatura = valor
            elif 'profundidad' in tipo_lower:
                profundidad = valor
        
        # Mapear estado de conservación para el frontend
        estado_conservacion = 'preocupacion-menor'
        if row[7]:
            conservation_mapping = {
                'En Peligro Crítico': 'extincion-critica',
                'En Peligro': 'peligro',
                'Vulnerable': 'vulnerable',
                'Casi Amenazada': 'casi-amenazada',
                'Preocupación Menor': 'preocupacion-menor'
            }
            estado_conservacion = conservation_mapping.get(row[7], 'preocupacion-menor')
        
        # Mapear primer hábitat para el frontend
        habitat = 'aguas-abiertas'
        if habitats:
            habitat_nombre = habitats[0][0]
            habitat_mapping = {
                'Arrecifes de Coral': 'arrecife',
                'Aguas Abiertas': 'aguas-abiertas',
                'Aguas Profundas': 'aguas-profundas',
                'Zona Costera': 'costero',
                'Aguas Polares': 'polar',
                'Manglares': 'manglar',
                'Estuarios': 'estuario',
                'Praderas Marinas': 'praderas-marinas',
                'Zona Abisal': 'aguas-profundas',
                'Zona Hadal': 'aguas-profundas',
                'Plataforma Continental': 'costero',
                'Zona Mesopelágica': 'aguas-profundas',
                'Zona Epipelágica': 'aguas-abiertas',
                'Surgencias Marinas': 'aguas-abiertas',
                'Montañas Submarinas': 'aguas-profundas',
                'Cañones Submarinos': 'aguas-profundas'
            }
            habitat = habitat_mapping.get(habitat_nombre, 'aguas-abiertas')
        
        # Construir respuesta completa
        especie = {
            'id': row[0],
            'nombre': row[1],
            'nombre_cientifico': row[2],
            'descripcion': row[3],
            'esperanza_vida': f"{row[4]} años" if row[4] else 'No disponible',
            'poblacion_estimada': str(row[5]) if row[5] else 'No disponible',
            'imagen': row[6] or 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkVzcGVjaWUgTWFyaW5hPC90ZXh0Pgo8L3N2Zz4K',
            'estado_conservacion': estado_conservacion,
            'habitat': habitat,
            'longitud': longitud,
            'peso': peso,
            'temperatura': temperatura,
            'profundidad': profundidad,
            'habitats': [{'nombre': h[0], 'descripcion': h[1]} for h in habitats],
            'caracteristicas': [{'tipo': c[0], 'valor': c[1]} for c in caracteristicas],
            'amenazas': [a[0] for a in amenazas]  # Solo los nombres de las amenazas
        }
        
        conn.close()
        return jsonify(especie)
        
    except Exception as e:
        print(f"Error en api_especie_detalle: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/reportar-avistamiento', methods=['POST'])
def reportar_avistamiento():
    """API para reportar avistamientos de especies"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos para la nueva estructura
        required_fields = ['id_especie', 'fecha_avistamiento', 'latitud', 'longitud', 'nombre_usuario', 'email_usuario']
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == '':
                return jsonify({'error': f'Campo requerido: {field}'}), 400
        
        # Validar tipos de datos
        try:
            id_especie = int(data['id_especie'])
            latitud = float(data['latitud'])
            longitud = float(data['longitud'])
            fecha_avistamiento_raw = data['fecha_avistamiento']
            
            # Convertir fecha desde formato datetime-local a formato SQL Server
            from datetime import datetime
            print(f"Fecha recibida raw: '{fecha_avistamiento_raw}'")
            
            fecha_obj = datetime.fromisoformat(fecha_avistamiento_raw.replace('T', ' '))
            print(f"Fecha parseada: {fecha_obj}")
            
            # Validar que la fecha no sea futura
            if fecha_obj > datetime.now():
                return jsonify({'error': 'La fecha del avistamiento no puede ser futura'}), 400
            
            # Formatear fecha para SQL Server (YYYY-MM-DD HH:MM:SS)
            fecha_avistamiento = fecha_obj.strftime('%Y-%m-%d %H:%M:%S')
            print(f"Fecha formateada para SQL Server: '{fecha_avistamiento}'")
                
        except (ValueError, TypeError) as e:
            return jsonify({'error': f'Error en formato de datos: {str(e)}'}), 400
        
        print(f"Datos validados - ID Especie: {id_especie}, Fecha: {fecha_avistamiento}, Lat: {latitud}, Lng: {longitud}")
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Buscar o crear usuario por email
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (data['email_usuario'],))
        user_row = cursor.fetchone()
        
        if user_row:
            # Usuario existe, usar su ID
            user_id = user_row[0]
            print(f"Usuario existente encontrado con ID: {user_id}")
        else:
            # Crear nuevo usuario
            print(f"Creando nuevo usuario: {data['nombre_usuario']} - {data['email_usuario']}")
            # Usar campos separados si están disponibles
            if 'nombre' in data and 'apellido_paterno' in data:
                primer_nombre = data['nombre']
                apellido_paterno = data['apellido_paterno']
                apellido_materno = data.get('apellido_materno')
            else:
                # Fallback: dividir el nombre completo
                nombre_partes = data['nombre_usuario'].split()
                primer_nombre = nombre_partes[0] if nombre_partes else 'Usuario'
                apellido_paterno = nombre_partes[1] if len(nombre_partes) > 1 else 'Sin Apellido'
                apellido_materno = nombre_partes[2] if len(nombre_partes) > 2 else None
            
            cursor.execute("""
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, fecha_registro, activo) 
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, GETDATE(), 1)
            """, (primer_nombre, apellido_paterno, apellido_materno, data['email_usuario']))
            user_result = cursor.fetchone()
            if user_result:
                user_id = user_result[0]
                print(f"Nuevo usuario creado con ID: {user_id}")
            else:
                return jsonify({'error': 'Error al crear nuevo usuario'}), 500
        
        # Validar que la especie existe
        cursor.execute("SELECT id FROM Especies WHERE id = ?", (id_especie,))
        species_row = cursor.fetchone()
        
        if not species_row:
            return jsonify({'error': f'Especie con ID {id_especie} no encontrada'}), 400
        
        print(f"Especie validada con ID: {id_especie}")
        
        # Insertar avistamiento con la fecha especificada por el usuario
        notas = data.get('notas', '') or ''  # Asegurar que notas no sea None
        
        print(f"Insertando avistamiento - Especie: {id_especie}, Usuario: {user_id}, Fecha: {fecha_avistamiento}, Coordenadas: ({latitud}, {longitud})")
        
        # Intentar insertar con objeto datetime directamente
        try:
            cursor.execute("""
                INSERT INTO Avistamientos (id_especie, fecha, latitud, longitud, notas, id_usuario)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                id_especie, 
                fecha_obj,  # Usar el objeto datetime directamente
                latitud, 
                longitud, 
                notas, 
                user_id
            ))
        except Exception as date_error:
            print(f"Error con objeto datetime, intentando con string: {date_error}")
            # Si falla, intentar con string formateado
            cursor.execute("""
                INSERT INTO Avistamientos (id_especie, fecha, latitud, longitud, notas, id_usuario)
                VALUES (?, CONVERT(datetime, ?, 120), ?, ?, ?, ?)
            """, (
                id_especie, 
                fecha_avistamiento,
                latitud, 
                longitud, 
                notas, 
                user_id
            ))
        
        conn.commit()
        conn.close()
        
        print(f"Avistamiento insertado exitosamente para usuario ID: {user_id}")
        return jsonify({
            'success': True,
            'message': 'Avistamiento reportado exitosamente'
        })
        
    except Exception as e:
        print(f"Error en reportar_avistamiento: {e}")
        print(f"Datos recibidos: {data}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/newsletter', methods=['POST'])
def suscribir_newsletter():
    """API para suscribir al newsletter"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email requerido'}), 400
        
        # Validar formato de email básico
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Email inválido'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Verificar si ya existe el usuario
        cursor.execute("SELECT id, suscrito_newsletter FROM Usuarios WHERE email = ?", (email,))
        user_row = cursor.fetchone()
        
        if user_row:
            if user_row[1]:  # Ya está suscrito
                conn.close()
                return jsonify({
                    'success': True,
                    'message': 'Este email ya está suscrito al newsletter',
                    'already_subscribed': True
                }), 200
            else:
                # Actualizar suscripción
                cursor.execute("UPDATE Usuarios SET suscrito_newsletter = 1 WHERE email = ?", (email,))
                conn.commit()
                conn.close()
                return jsonify({
                    'success': True,
                    'message': 'Suscripción reactivada exitosamente'
                }), 200
        else:
            # Crear nuevo usuario suscrito
            cursor.execute("""
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, suscrito_newsletter, fecha_registro, activo) 
                VALUES ('Usuario', 'Newsletter', NULL, ?, 1, GETDATE(), 1)
            """, (email,))
            conn.commit()
            conn.close()
            
            return jsonify({
                'success': True,
                'message': 'Suscripción exitosa al newsletter'
            }), 200
        
    except Exception as e:
        print(f"Error en suscribir_newsletter: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/estadisticas')
def api_estadisticas():
    """API para obtener estadísticas generales"""
    try:
        conn = get_db_connection()
        if not conn:
            # Datos de fallback si no hay conexión
            return jsonify({
                'success': True,
                'especies_catalogadas': 2847,
                'en_peligro': 456,
                'especies_protegidas': 1234,
                'descubiertas_este_ano': 89,
                'calidad_agua': 78,
                'biodiversidad': 65,
                'cobertura_corales': 45,
                'temperatura_oceanica': 72
            })
        
        cursor = conn.cursor()
        
        # Obtener estadísticas reales de la base de datos
        cursor.execute("SELECT COUNT(*) FROM Especies")
        especies_catalogadas = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM Especies e
            JOIN EstadosConservacion ec ON e.id_estado_conservacion = ec.id
            WHERE ec.nombre IN ('En Peligro', 'Extinción Crítica')
        """)
        en_peligro = cursor.fetchone()[0]
        
        # Como no tenemos fecha de registro, usamos un valor simulado
        descubiertas_este_ano = 7
        
        conn.close()
        
        return jsonify({
            'success': True,
            'especies_catalogadas': especies_catalogadas,
            'en_peligro': en_peligro,
            'especies_protegidas': especies_catalogadas - en_peligro,  # Asumiendo que protegidas = total - en peligro
            'descubiertas_este_ano': descubiertas_este_ano,
            'calidad_agua': 78,  # Datos simulados para métricas ambientales
            'biodiversidad': 65,
            'cobertura_corales': 45,
            'temperatura_oceanica': 72
        })
        
    except Exception as e:
        print(f"Error en api_estadisticas: {e}")
        # Retornar datos de fallback en caso de error
        return jsonify({
            'success': True,
            'especies_catalogadas': 2847,
            'en_peligro': 456,
            'especies_protegidas': 1234,
            'descubiertas_este_ano': 89,
            'calidad_agua': 78,
            'biodiversidad': 65,
            'cobertura_corales': 45,
            'temperatura_oceanica': 72
        })

# =============================================
# ENDPOINTS DE TIENDA
# =============================================

@app.route('/api/impacto-sostenible')
def get_impacto_sostenible():
    """Obtener métricas de impacto sostenible basadas en ventas"""
    try:
        conn = get_db_connection()
        if not conn:
            # Valores por defecto si no hay conexión
            return jsonify({
                'success': True,
                'impacto': {
                    'agua_limpiada': 15420,
                    'corales_plantados': 892,
                    'familias_beneficiadas': 127,
                    'plastico_reciclado': 3250
                }
            })
        
        cursor = conn.cursor()
        
        # Calcular métricas basadas en ventas de 2025 (incluye todos los pedidos)
        cursor.execute("""
            SELECT 
                COALESCE(SUM(p.total), 0) as total_ventas,
                COALESCE(COUNT(p.id), 0) as total_pedidos,
                COALESCE(SUM(dp.cantidad), 0) as total_productos_vendidos
            FROM Pedidos p
            LEFT JOIN DetallesPedido dp ON p.id = dp.id_pedido
            WHERE YEAR(p.fecha_pedido) = 2025
        """)
        
        row = cursor.fetchone()
        total_ventas = float(row.total_ventas) if row.total_ventas else 0
        total_pedidos = row.total_pedidos if row.total_pedidos else 0
        total_productos = row.total_productos_vendidos if row.total_productos_vendidos else 0
        
        # Calcular métricas de impacto basadas en fórmulas
        # Por cada $100 pesos vendidos:
        # - 50 litros de agua marina limpiada
        # - 0.3 corales plantados
        # - Por cada 10 pedidos: 1 familia beneficiada
        # - Por cada producto vendido: 2.5 kg de plástico reciclado
        
        agua_limpiada = int((total_ventas / 100) * 50) + 15420  # Base inicial + impacto de ventas
        corales_plantados = int((total_ventas / 100) * 0.3) + 892
        familias_beneficiadas = int(total_pedidos / 10) + 127
        plastico_reciclado = int(total_productos * 2.5) + 3250
        
        conn.close()
        
        return jsonify({
            'success': True,
            'impacto': {
                'agua_limpiada': agua_limpiada,
                'corales_plantados': corales_plantados,
                'familias_beneficiadas': familias_beneficiadas,
                'plastico_reciclado': plastico_reciclado
            }
        })
        
    except Exception as e:
        print(f"Error en get_impacto_sostenible: {e}")
        # Valores por defecto en caso de error
        return jsonify({
            'success': True,
            'impacto': {
                'agua_limpiada': 15420,
                'corales_plantados': 892,
                'familias_beneficiadas': 127,
                'plastico_reciclado': 3250
            }
        })

@app.route('/api/productos')
def get_productos():
    """Obtener productos con filtros y paginación"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        # Parámetros de consulta
        categoria_id = request.args.get('categoria_id', type=int)
        busqueda = request.args.get('busqueda', '')
        pagina = request.args.get('pagina', 1, type=int)
        limite = request.args.get('limite', 6, type=int)
        ordenar = request.args.get('ordenar', 'fecha_agregado')
        
        # Construir consulta SQL
        base_query = """
            SELECT 
                p.id, p.nombre, p.descripcion, p.precio, p.stock,
                p.imagen_url, p.dimensiones, p.peso_gramos, p.es_sostenible,
                p.fecha_agregado, cp.nombre as categoria_nombre,
                m.nombre as material_nombre,
                COALESCE(r.calificacion_promedio, 0) as calificacion_promedio,
                COALESCE(r.total_reseñas, 0) as total_reseñas
            FROM Productos p
            LEFT JOIN CategoriasProducto cp ON p.id_categoria = cp.id
            LEFT JOIN Materiales m ON p.id_material = m.id
            LEFT JOIN (
                SELECT 
                    id_producto,
                    AVG(CAST(calificacion AS FLOAT)) as calificacion_promedio,
                    COUNT(id) as total_reseñas
                FROM ReseñasProducto
                GROUP BY id_producto
            ) r ON p.id = r.id_producto
            WHERE p.activo = 1
        """
        
        params = []
        
        # Filtros
        if categoria_id:
            base_query += " AND p.id_categoria = ?"
            params.append(categoria_id)
        
        if busqueda:
            base_query += " AND (p.nombre LIKE ? OR p.descripcion LIKE ?)"

            params.extend([f'%{busqueda}%', f'%{busqueda}%'])
        
        # No necesita GROUP BY ahora que usamos subconsulta
        # base_query += " GROUP BY p.id, p.nombre, p.precio, p.stock, p.imagen_url, p.dimensiones, p.peso_gramos, p.es_sostenible, p.fecha_agregado, cp.nombre, m.nombre"
        
        # Ordenamiento
        if ordenar == 'precio_asc':
            base_query += " ORDER BY p.precio ASC"
        elif ordenar == 'precio_desc':
            base_query += " ORDER BY p.precio DESC"
        elif ordenar == 'nombre':
            base_query += " ORDER BY p.nombre ASC"
        elif ordenar == 'popularidad':
            base_query += " ORDER BY total_reseñas DESC"
        else:
            base_query += " ORDER BY p.fecha_agregado DESC"
        
        # Paginación - SQL Server usa OFFSET y FETCH
        offset = (pagina - 1) * limite
        base_query += f" OFFSET {offset} ROWS FETCH NEXT {limite} ROWS ONLY"
        
        cursor = conn.cursor()
        cursor.execute(base_query, params)
        
        productos = []
        for row in cursor.fetchall():
            # Debug: imprimir valores de calificación
            print(f"Producto {row.nombre}: calificacion_promedio={row.calificacion_promedio}, total_reseñas={row.total_reseñas}")
            
            productos.append({
                'id': row.id,
                'name': row.nombre,
                'description': row.descripcion,
                'price': float(row.precio),
                'stock': row.stock,
                'image_url': row.imagen_url,
                'dimensions': row.dimensiones,
                'weight_grams': row.peso_gramos,
                'is_sustainable': bool(row.es_sostenible),
                'date_added': row.fecha_agregado.isoformat() if row.fecha_agregado else None,
                'category': row.categoria_nombre,
                'material': row.material_nombre,
                'average_rating': round(row.calificacion_promedio, 1) if row.calificacion_promedio else 0,
                'total_reviews': row.total_reseñas or 0
            })
        
        # Obtener total de productos para paginación
        count_query = """
            SELECT COUNT(*) as total
            FROM Productos p
            WHERE p.activo = 1
        """
        
        count_params = []
        if categoria_id:
            count_query += " AND p.id_categoria = ?"
            count_params.append(categoria_id)
        
        if busqueda:
            count_query += " AND (p.nombre LIKE ? OR p.descripcion LIKE ?)"

            count_params.extend([f'%{busqueda}%', f'%{busqueda}%'])
        
        cursor.execute(count_query, count_params)
        total_productos = cursor.fetchone().total
        
        conn.close()
        
        return jsonify({
            'success': True,
            'products': productos,
            'total': total_productos,
            'pagina': pagina,
            'limite': limite,
            'total_paginas': (total_productos + limite - 1) // limite
        })
    
    except Exception as e:
        import traceback
        print(f"Error en get_productos: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Error interno del servidor: {str(e)}'}), 500

@app.route('/api/producto/<int:producto_id>')
def get_producto_detalle(producto_id):
    """Obtener detalles completos de un producto"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Primero obtener información básica del producto
        cursor.execute("""
            SELECT 
                p.id, p.nombre, p.descripcion, p.precio, p.stock,
                p.imagen_url, p.dimensiones, p.peso_gramos, p.es_sostenible,
                p.fecha_agregado, cp.nombre as categoria_nombre,
                m.nombre as material_nombre
            FROM Productos p
            LEFT JOIN CategoriasProducto cp ON p.id_categoria = cp.id
            LEFT JOIN Materiales m ON p.id_material = m.id
            WHERE p.id = ? AND p.activo = 1
        """, (producto_id,))
        
        row = cursor.fetchone()
        if not row:
            return jsonify({'error': 'Producto no encontrado'}), 404
        
        # Obtener estadísticas de reseñas por separado
        cursor.execute("""
            SELECT 
                COALESCE(AVG(CAST(calificacion AS FLOAT)), 0) as calificacion_promedio,
                COUNT(id) as total_reseñas
            FROM ReseñasProducto 
            WHERE id_producto = ?
        """, (producto_id,))
        
        reseñas_row = cursor.fetchone()
        calificacion_promedio = reseñas_row.calificacion_promedio if reseñas_row else 0
        total_reseñas = reseñas_row.total_reseñas if reseñas_row else 0
        
        producto = {
            'id': row.id,
            'nombre': row.nombre,
            'descripcion': row.descripcion,
            'precio': float(row.precio),
            'stock': row.stock,
            'imagen_url': row.imagen_url,
            'dimensiones': row.dimensiones,
            'peso_gramos': row.peso_gramos,
            'es_sostenible': bool(row.es_sostenible),
            'fecha_agregado': row.fecha_agregado.isoformat() if row.fecha_agregado else None,
            'categoria_nombre': row.categoria_nombre,
            'material_nombre': row.material_nombre,
            'calificacion_promedio': round(calificacion_promedio, 1),
            'total_reseñas': total_reseñas
        }
        
        conn.close()
        return jsonify({'success': True, 'producto': producto})
    
    except Exception as e:
        print(f"Error en get_producto_detalle: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/reseñas/<int:producto_id>')
def get_reseñas_producto(producto_id):
    """Obtener reseñas de un producto"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                r.id, r.calificacion, r.comentario, r.fecha_reseña,
                u.nombre, u.apellido_paterno, u.apellido_materno
            FROM ReseñasProducto r
            JOIN Usuarios u ON r.id_usuario = u.id
            WHERE r.id_producto = ?
            ORDER BY r.fecha_reseña DESC
        """, (producto_id,))
        
        reseñas = []
        for row in cursor.fetchall():
            usuario_nombre = construir_nombre_completo(row.nombre, row.apellido_paterno, row.apellido_materno)
            reseñas.append({
                'id': row.id,
                'calificacion': row.calificacion,
                'comentario': row.comentario,
                'fecha_reseña': row.fecha_reseña.isoformat() if row.fecha_reseña else None,
                'usuario_nombre': usuario_nombre
            })
        
        conn.close()
        return jsonify({'reseñas': reseñas})
    
    except Exception as e:
        print(f"Error en get_reseñas_producto: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/materiales')
def get_materiales():
    """Obtener todos los materiales"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre FROM Materiales ORDER BY nombre")
        
        materiales = []
        for row in cursor.fetchall():
            materiales.append({
                'id': row.id,
                'nombre': row.nombre
            })
        
        conn.close()
        return jsonify({'materiales': materiales})
    
    except Exception as e:
        print(f"Error en get_materiales: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


# =============================================
# ENDPOINTS DE USUARIO
# =============================================


@app.route('/login')
def login_page():
    """Página de login"""
    return render_template('login.html')

@app.route('/register')
def register_page():
    """Página de registro"""
    return render_template('register.html')

@app.route('/api/user/login', methods=['POST'])
def user_login():
    """Iniciar sesión"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'message': 'Email y contraseña son requeridos'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Error de conexión a la base de datos'
            }), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nombre, apellido_paterno, apellido_materno, 
                   email, password_hash, telefono, activo
            FROM Usuarios
            WHERE email = ? AND activo = 1
        """, (email,))
        
        user = cursor.fetchone()
        conn.close()
        
        if user and user.password_hash == password:
            # Construir nombre completo evitando duplicación
            nombre_completo = construir_nombre_completo(user.nombre, user.apellido_paterno, user.apellido_materno)
            
            # Crear sesión para tienda
            session['tienda_user_id'] = user.id
            session['tienda_user_name'] = nombre_completo
            session['tienda_user_email'] = user.email
            
            return jsonify({
                'success': True,
                'message': 'Login exitoso',
                'user': {
                    'id': user.id,
                    'nombre': nombre_completo,
                    'email': user.email,
                    'telefono': user.telefono
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Credenciales incorrectas'
            }), 401
            
    except Exception as e:
        import traceback
        print(f"Error en login: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@app.route('/api/user/register', methods=['POST'])
def user_register():
    """Registrar nuevo usuario"""
    try:
        data = request.get_json()
        nombre = data.get('nombre')
        apellidoPaterno = data.get('apellidoPaterno')
        apellidoMaterno = data.get('apellidoMaterno')
        email = data.get('email')
        password = data.get('password')
        telefono = data.get('telefono')
        fecha_nacimiento = data.get('fecha_nacimiento')
        newsletter = data.get('newsletter', False)
        
        print(f"Datos de registro recibidos: {data}")
        
        if not all([nombre, apellidoPaterno, email, password]):
            return jsonify({
                'success': False,
                'message': 'Nombre, apellido paterno, email y contraseña son requeridos'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Error de conexión a la base de datos'
            }), 500
        
        cursor = conn.cursor()
        
        # Verificar si el email ya existe
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({
                'success': False,
                'message': 'El email ya está registrado'
            }), 400
        
        # Crear el usuario con los campos separados ya recibidos
        cursor.execute("""
            INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, telefono, fecha_nacimiento, suscrito_newsletter, activo, fecha_registro)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, GETDATE())
        """, (nombre, apellidoPaterno, apellidoMaterno, email, password, telefono, fecha_nacimiento, newsletter))
        
        conn.commit()
        
        # Obtener el ID del usuario creado
        cursor.execute("SELECT @@IDENTITY")
        user_id = cursor.fetchone()[0]
        
        conn.close()
        
        # Crear sesión automáticamente para tienda
        nombre_completo = nombre + ' ' + apellidoPaterno + (' ' + apellidoMaterno if apellidoMaterno else '')
        session['tienda_user_id'] = user_id
        session['tienda_user_name'] = nombre_completo
        session['tienda_user_email'] = email
        
        return jsonify({
            'success': True,
            'message': 'Registro exitoso',
            'user': {
                'id': user_id,
                'nombre': nombre_completo,
                'email': email,
                'telefono': telefono
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Error en registro: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@app.route('/api/user/logout', methods=['POST'])
def logout():
    """Cerrar sesión del usuario de tienda"""
    try:
        # Limpiar solo las claves de sesión de tienda
        keys_to_remove = ['tienda_user_id', 'tienda_user_name', 'tienda_user_email']
        for key in keys_to_remove:
            session.pop(key, None)
        return jsonify({'success': True, 'message': 'Sesión de tienda cerrada exitosamente'})
    except Exception as e:
        print(f"Error en logout tienda: {e}")
        return jsonify({'success': False, 'error': 'Error al cerrar sesión'}), 500

@app.route('/api/colaboradores/logout', methods=['POST'])
def logout_colaborador():
    """Cerrar sesión del colaborador"""
    try:
        # Limpiar solo las claves de sesión de colaborador
        keys_to_remove = ['colab_user_id', 'colab_user_name', 'colab_user_email', 'colab_colaborador_id', 'colab_user_type']
        for key in keys_to_remove:
            session.pop(key, None)
        return jsonify({'success': True, 'message': 'Sesión de colaborador cerrada exitosamente'})
    except Exception as e:
        print(f"Error en logout colaborador: {e}")
        return jsonify({'success': False, 'error': 'Error al cerrar sesión'}), 500

@app.route('/api/user/status')
def user_status():
    """Verificar estado de sesión"""
    try:
        if 'tienda_user_id' in session:
            # Obtener información completa del usuario desde la base de datos
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, nombre, apellido_paterno, apellido_materno, 
                       email, telefono, fecha_registro, fecha_nacimiento
                FROM Usuarios 
                WHERE id = ?
            """, (session['tienda_user_id'],))
            
            user = cursor.fetchone()
            conn.close()
            
            if user:
                # Construir nombre completo evitando duplicación
                nombre_completo = construir_nombre_completo(user[1], user[2], user[3])
                
                return jsonify({
                    'success': True,
                    'user': {
                        'id': user[0],
                        'nombre': nombre_completo,
                        'email': user[4],
                        'telefono': user[5],
                        'fecha_registro': user[6].isoformat() if user[6] else None,
                        'fecha_nacimiento': user[7].isoformat() if user[7] else None
                    }
                })
            else:
                # Usuario no encontrado en la base de datos, limpiar sesión de tienda
                keys_to_remove = ['tienda_user_id', 'tienda_user_name', 'tienda_user_email']
                for key in keys_to_remove:
                    session.pop(key, None)
                return jsonify({
                    'success': False,
                    'message': 'Usuario no encontrado'
                }), 401
        else:
            return jsonify({
                'success': False,
                'message': 'No hay sesión activa'
            }), 401
    except Exception as e:
        print(f"Error en user_status: {e}")
        return jsonify({
            'success': False,
            'message': 'Error al verificar sesión'
        }), 500

@app.route('/api/colaboradores/status')
def colaborador_status():
    """Verificar estado de sesión de colaborador"""
    try:
        if 'colab_user_id' in session:
            return jsonify({
                'success': True,
                'user': {
                    'id': session['colab_user_id'],
                    'name': session.get('colab_user_name', 'Usuario'),
                    'email': session.get('colab_user_email', ''),
                    'colaborador_id': session.get('colab_colaborador_id', ''),
                    'user_type': 'colaborador'
                }
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No hay sesión activa de colaborador'
            }), 401
    except Exception as e:
        print(f"Error en colaborador_status: {e}")
        return jsonify({
            'success': False,
            'message': 'Error al verificar sesión'
        }), 500

@app.route('/test_dropdown.html')
def test_dropdown():
    """Página de prueba del dropdown"""
    return send_from_directory('.', 'test_dropdown.html')

# Manejo de errores
@app.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500

# Endpoint para crear productos de ejemplo (solo para desarrollo)
@app.route('/api/setup-tienda', methods=['POST'])
def setup_tienda():
    """Crear datos de ejemplo para la tienda"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Crear categorías de ejemplo
        categorias_ejemplo = [
            ('Ropa Sostenible', 'Prendas fabricadas con materiales ecológicos'),
            ('Accesorios Ecológicos', 'Productos útiles hechos con materiales reciclados'),
            ('Educativos', 'Materiales educativos sobre conservación marina'),
            ('Hogar Sustentable', 'Productos para el hogar que respetan el medio ambiente'),
            ('Juguetes Ecológicos', 'Juguetes fabricados con materiales naturales')
        ]
        
        for nombre, descripcion in categorias_ejemplo:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM CategoriasProducto WHERE nombre = ?)
                INSERT INTO CategoriasProducto (nombre, descripcion) VALUES (?, ?)
            """, (nombre, nombre, descripcion))
        
        # Crear materiales de ejemplo
        materiales_ejemplo = [
            'Algodón Orgánico', 'Plástico Reciclado', 'Bambú', 'Madera Certificada', 
            'Acero Inoxidable', 'Vidrio Reciclado', 'Materiales Naturales'
        ]
        
        for material in materiales_ejemplo:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Materiales WHERE nombre = ?)
                INSERT INTO Materiales (nombre) VALUES (?)
            """, (material, material))
        
        # Crear productos de ejemplo
        productos_ejemplo = [
            ('Peluche Tortuga Marina', 'Adorable peluche de tortuga marina hecho con materiales 100% reciclados.', 24.99, 1, 50, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 2, '25x20x15 cm', 300),
            ('Termo Océano Azul 500ml', 'Termo de acero inoxidable con diseño oceánico, mantiene temperatura 12 horas.', 34.99, 2, 30, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 5, '22x7x7 cm', 450),
            ('Set de Pines Vida Marina', 'Colección de 6 pines esmaltados con especies marinas icónicas.', 15.99, 2, 100, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', 3, '8x6x2 cm', 50),
            ('Camiseta Salva las Ballenas', 'Camiseta 100% algodón orgánico con estampado de ballena jorobada.', 28.99, 1, 25, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', 1, 'Varias tallas', 200),
            ('Bolsa Reutilizable Coral', 'Bolsa eco-friendly resistente con diseño de arrecife de coral.', 12.99, 2, 75, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 2, '40x35x10 cm', 150),
            ('Pack Stickers Océano Limpio', '25 stickers impermeables con mensajes de conservación marina.', 9.99, 3, 200, 'https://images.unsplash.com/photo-1586510419923-3dde510e6cd9?w=400', 2, '15x10x1 cm', 25)
        ]
        
        for nombre, desc, precio, cat_id, stock, img, mat_id, dim, peso in productos_ejemplo:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Productos WHERE nombre = ?)
                INSERT INTO Productos (nombre, descripcion, precio, id_categoria, stock, imagen_url, id_material, dimensiones, peso_gramos, es_sostenible, activo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
            """, (nombre, nombre, desc, precio, cat_id, stock, img, mat_id, dim, peso))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Tienda configurada con productos de ejemplo'})
    
    except Exception as e:
        print(f"Error en setup_tienda: {e}")
        return jsonify({'error': str(e)}), 500

# =============================================
# ENDPOINTS PARA CARRITO FUNCIONAL
# =============================================

@app.route('/api/auth/register', methods=['POST'])
def auth_register():
    """Registrar nuevo usuario"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['nombre', 'email', 'password', 'telefono']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es requerido'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Verificar si el email ya existe
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (data['email'],))
        if cursor.fetchone():
            return jsonify({'error': 'El email ya está registrado'}), 400
        
        # Insertar nuevo usuario - usar campos separados si están disponibles
        if 'apellidoPaterno' in data and data['apellidoPaterno']:
            primer_nombre = data['nombre']
            apellido_paterno = data['apellidoPaterno']
            apellido_materno = data.get('apellidoMaterno')
        else:
            # Fallback: dividir el nombre completo
            nombre_partes = data['nombre'].split()
            primer_nombre = nombre_partes[0] if nombre_partes else 'Usuario'
            apellido_paterno = nombre_partes[1] if len(nombre_partes) > 1 else 'Sin Apellido'
            apellido_materno = nombre_partes[2] if len(nombre_partes) > 2 else None
        
        cursor.execute("""
            INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, telefono, fecha_nacimiento, suscrito_newsletter)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            primer_nombre,
            apellido_paterno,
            apellido_materno,
            data['email'],
            data['password'],  # En proyecto real se haría hash
            data['telefono'],
            data.get('fecha_nacimiento'),
            data.get('newsletter', False)
        ))
        
        conn.commit()
        
        # Obtener el ID del usuario creado
        cursor.execute("SELECT @@IDENTITY")
        user_id = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Usuario registrado exitosamente',
            'user_id': user_id
        })
        
    except Exception as e:
        print(f"Error en register: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    """Iniciar sesión"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email y contraseña son requeridos'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Buscar usuario
        cursor.execute("""
            SELECT id, nombre, apellido_paterno, apellido_materno, 
                   email, telefono, activo 
            FROM Usuarios 
            WHERE email = ? AND password_hash = ?
        """, (data['email'], data['password']))
        
        user = cursor.fetchone()
        
        if not user or not user.activo:
            return jsonify({'error': 'Credenciales inválidas'}), 401
        
        conn.close()
        
        # Construir nombre completo evitando duplicación
        nombre_completo = construir_nombre_completo(user.nombre, user.apellido_paterno, user.apellido_materno)
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'nombre': nombre_completo,
                'email': user.email,
                'telefono': user.telefono
            }
        })
        
    except Exception as e:
        print(f"Error en login: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/carrito/agregar', methods=['POST'])
def agregar_al_carrito():
    """Agregar producto al carrito (usando localStorage del frontend)"""
    try:
        data = request.get_json()
        
        if not data.get('producto_id') or not data.get('cantidad'):
            return jsonify({'error': 'ID de producto y cantidad son requeridos'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Verificar que el producto existe y hay stock suficiente
        cursor.execute("""
            SELECT id, nombre, precio, stock, activo 
            FROM Productos 
            WHERE id = ?
        """, (data['producto_id'],))
        
        producto = cursor.fetchone()
        
        if not producto or not producto.activo:
            return jsonify({'error': 'Producto no encontrado'}), 404
        
        if producto.stock < int(data['cantidad']):
            return jsonify({'error': 'Stock insuficiente'}), 400
        
        conn.close()
        
        return jsonify({
            'success': True,
            'producto': {
                'id': producto.id,
                'nombre': producto.nombre,
                'precio': float(producto.precio),
                'stock': producto.stock
            }
        })
        
    except Exception as e:
        print(f"Error en agregar_al_carrito: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/direcciones/estados')
def get_estados():
    """Obtener lista de estados"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT id, nombre FROM Estados ORDER BY nombre")
        
        estados = []
        for row in cursor.fetchall():
            estados.append({
                'id': row.id,
                'nombre': row.nombre
            })
        
        conn.close()
        return jsonify({'estados': estados})
        
    except Exception as e:
        print(f"Error en get_estados: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/direcciones/municipios/<int:estado_id>')
def get_municipios(estado_id):
    """Obtener municipios por estado"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nombre 
            FROM Municipios 
            WHERE id_estado = ? 
            ORDER BY nombre
        """, (estado_id,))
        
        municipios = []
        for row in cursor.fetchall():
            municipios.append({
                'id': row.id,
                'nombre': row.nombre
            })
        
        conn.close()
        return jsonify({'municipios': municipios})
        
    except Exception as e:
        print(f"Error en get_municipios: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/direcciones/colonias/<int:municipio_id>')
def get_colonias(municipio_id):
    """Obtener colonias por municipio"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nombre, cp 
            FROM Colonias 
            WHERE id_municipio = ? 
            ORDER BY nombre
        """, (municipio_id,))
        
        colonias = []
        for row in cursor.fetchall():
            colonias.append({
                'id': row.id,
                'nombre': row.nombre,
                'cp': row.cp
            })
        
        conn.close()
        return jsonify({'colonias': colonias})
        
    except Exception as e:
        print(f"Error en get_colonias: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/direcciones/calles/<int:colonia_id>')
def get_calles(colonia_id):
    """Obtener calles por colonia"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, nombre 
            FROM Calles 
            WHERE id_colonia = ? 
            ORDER BY nombre
        """, (colonia_id,))
        
        calles = []
        for row in cursor.fetchall():
            calles.append({
                'id': row.id,
                'nombre': row.nombre
            })
        
        conn.close()
        return jsonify({'calles': calles})
        
    except Exception as e:
        print(f"Error en get_calles: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/pedidos/crear', methods=['POST'])
def crear_pedido():
    """Crear nuevo pedido con validación del servidor"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['user_id', 'productos', 'direccion', 'pago']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es requerido'}), 400
        
        # VALIDAR DIRECCIÓN DE ENVÍO usando validators.py
        try:
            direccion_data = data['direccion']
            validated_direccion = validate_direccion_envio(direccion_data)
        except ValidationError as ve:
            return jsonify({'error': str(ve)}), 400
        
        # VALIDAR MÉTODO DE PAGO usando validators.py
        pago_data = data['pago']
        metodo_pago = pago_data.get('tipo_pago', 'credit_card')
        try:
            validated_pago = validate_metodo_pago(pago_data, metodo_pago)
        except ValidationError as ve:
            return jsonify({'error': str(ve)}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # 1. Procesar dirección: convertir nombres a IDs
        direccion_data = data['direccion']
        
        # Función auxiliar para buscar o crear direcciones
        def buscar_o_crear_direccion(direccion_info):
            # Buscar o crear estado
            cursor.execute("SELECT id FROM Estados WHERE nombre = ?", (direccion_info['estado'],))
            estado = cursor.fetchone()
            if not estado:
                cursor.execute("INSERT INTO Estados (nombre) VALUES (?)", (direccion_info['estado'],))
                cursor.execute("SELECT @@IDENTITY")
                estado_id = cursor.fetchone()[0]
            else:
                estado_id = estado[0]
            
            # Buscar o crear municipio
            cursor.execute("SELECT id FROM Municipios WHERE nombre = ? AND id_estado = ?", (direccion_info['municipio'], estado_id))
            municipio = cursor.fetchone()
            if not municipio:
                cursor.execute("INSERT INTO Municipios (nombre, id_estado) VALUES (?, ?)", (direccion_info['municipio'], estado_id))
                cursor.execute("SELECT @@IDENTITY")
                municipio_id = cursor.fetchone()[0]
            else:
                municipio_id = municipio[0]
            
            # Buscar o crear colonia
            cursor.execute("SELECT id FROM Colonias WHERE nombre = ? AND id_municipio = ?", (direccion_info['colonia'], municipio_id))
            colonia = cursor.fetchone()
            if not colonia:
                cp = direccion_info.get('codigo_postal')
                cursor.execute("INSERT INTO Colonias (nombre, id_municipio, cp) VALUES (?, ?, ?)", (direccion_info['colonia'], municipio_id, cp))
                cursor.execute("SELECT @@IDENTITY")
                colonia_id = cursor.fetchone()[0]
            else:
                colonia_id = colonia[0]
            
            # Buscar o crear calle
            cursor.execute("SELECT id FROM Calles WHERE nombre = ? AND id_colonia = ?", (direccion_info['calle'], colonia_id))
            calle = cursor.fetchone()
            if not calle:
                n_exterior = direccion_info.get('numero_exterior')
                n_interior = direccion_info.get('numero_interior')
                cursor.execute("INSERT INTO Calles (nombre, id_colonia, n_exterior, n_interior) VALUES (?, ?, ?, ?)", 
                             (direccion_info['calle'], colonia_id, n_exterior, n_interior))
                cursor.execute("SELECT @@IDENTITY")
                calle_id = cursor.fetchone()[0]
            else:
                calle_id = calle[0]
            
            return calle_id
        
        # Obtener el id_calle
        id_calle = buscar_o_crear_direccion(direccion_data)
        
        # Crear dirección si no existe
        cursor.execute("""
            INSERT INTO Direcciones (id_calle)
            VALUES (?)
        """, (id_calle,))
        
        cursor.execute("SELECT @@IDENTITY")
        direccion_id = cursor.fetchone()[0]
        
        # 2. Calcular total del pedido
        total = 0
        productos = data['productos']
        
        for item in productos:
            cursor.execute("SELECT precio FROM Productos WHERE id = ?", (item['id'],))
            producto = cursor.fetchone()
            if producto:
                precio = float(producto[0])
                cantidad = int(item['quantity'])
                subtotal = precio * cantidad
                total += subtotal
        
        # 3. Crear pedido con estatus inicial (1 = Pendiente)
        cursor.execute("""
            INSERT INTO Pedidos (id_usuario, total, id_estatus, id_direccion, telefono_contacto)
            VALUES (?, ?, ?, ?, ?)
        """, (
            data['user_id'],
            total,
            1,  # Estatus pendiente
            direccion_id,
            direccion_data.get('telefono_contacto', '')
        ))
        
        cursor.execute("SELECT @@IDENTITY")
        pedido_id = cursor.fetchone()[0]
        
        # 4. Crear detalles del pedido
        for item in productos:
            cursor.execute("SELECT precio FROM Productos WHERE id = ?", (item['id'],))
            producto = cursor.fetchone()
            if producto:
                precio_unitario = float(producto[0])
                # El frontend envía 'quantity', no 'cantidad'
                cantidad = int(item.get('quantity', item.get('cantidad', 1)))
                subtotal = precio_unitario * cantidad
                
                cursor.execute("""
                    INSERT INTO DetallesPedido (id_pedido, id_producto, cantidad, precio_unitario, subtotal)
                    VALUES (?, ?, ?, ?, ?)
                """, (pedido_id, item['id'], cantidad, precio_unitario, subtotal))
        
        # 5. Procesar pago
        pago_data = data['pago']
        
        # Procesar el pago según el método seleccionado
        if pago_data.get('tipo_pago') == 'paypal':
            # Para PayPal, usar valores especiales como en donaciones
            cursor.execute("""
                INSERT INTO PagosPedidos (id_pedido, numero_tarjeta, fecha_expiracion, cvv, nombre_tarjeta, id_tipoTarjeta, monto, id_estatus)
                VALUES (?, ?, ?, ?, ?, ?, ?, 3)
            """, (
                pedido_id,
                'PAYPAL_TRANS',  # Identificador corto para PayPal (máx 16 chars)
                'N/A',           # No aplica fecha de expiración
                'N/A',           # No aplica CVV
                'PayPal User',   # Nombre genérico
                5,               # PayPal es ID 5 según los datos
                total
            ))
        else:
            # Para tarjetas de crédito/débito, limpiar el número (sin espacios)
            numero_limpio = pago_data.get('numero_tarjeta', '').replace(' ', '')
            
            # Determinar tipo de tarjeta basado en el primer dígito
            tipo_tarjeta_id = 1  # Default: Visa
            if numero_limpio.startswith('5'):
                tipo_tarjeta_id = 2  # Mastercard
            elif numero_limpio.startswith('3'):
                tipo_tarjeta_id = 3  # American Express
            # Otros casos podrían ser tarjeta de débito (ID 4)
            
            cursor.execute("""
                INSERT INTO PagosPedidos (id_pedido, numero_tarjeta, fecha_expiracion, cvv, nombre_tarjeta, id_tipoTarjeta, monto, id_estatus)
                VALUES (?, ?, ?, ?, ?, ?, ?, 3)
            """, (
                pedido_id,
                numero_limpio,  # Sin espacios para que quepa en varchar(16)
                pago_data.get('fecha_expiracion', ''),
                pago_data.get('cvv', ''),
                pago_data.get('nombre_tarjeta', ''),
                tipo_tarjeta_id,
                total
            ))
        
        # 6. Actualizar stock de productos
        for item in productos:
            # El frontend envía 'quantity', no 'cantidad'
            cantidad = int(item.get('quantity', item.get('cantidad', 1)))
            cursor.execute("""
                UPDATE Productos 
                SET stock = stock - ? 
                WHERE id = ?
            """, (cantidad, item['id']))
        
        # 7. Actualizar estatus del pedido a "Pagado"
        cursor.execute("UPDATE Pedidos SET id_estatus = 3 WHERE id = ?", (pedido_id,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'pedido_id': pedido_id,
            'total': total,
            'message': 'Pedido creado exitosamente'
        })
        
    except Exception as e:
        import traceback
        print(f"Error en crear_pedido: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Error interno del servidor: {str(e)}'}), 500

@app.route('/api/pedidos/usuario/<int:user_id>')
def get_pedidos_usuario(user_id):
    """Obtener pedidos de un usuario"""
    try:
        # Verificar que el usuario esté autenticado y sea el mismo que solicita los pedidos
        if 'tienda_user_id' not in session:
            return jsonify({'error': 'Usuario no autenticado'}), 401
        
        if session['tienda_user_id'] != user_id:
            return jsonify({'error': 'No autorizado para ver estos pedidos'}), 403
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.id, p.fecha_pedido, p.total, e.nombre as estatus
            FROM Pedidos p
            JOIN Estatus e ON p.id_estatus = e.id
            WHERE p.id_usuario = ?
            ORDER BY p.fecha_pedido DESC
        """, (user_id,))
        
        pedidos = []
        for row in cursor.fetchall():
            pedidos.append({
                'id': row.id,
                'fecha_pedido': row.fecha_pedido.isoformat() if row.fecha_pedido else None,
                'total': float(row.total),
                'estatus': row.estatus
            })
        
        conn.close()
        return jsonify({'pedidos': pedidos})
        
    except Exception as e:
        print(f"Error en get_pedidos_usuario: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/pedidos/mis-pedidos')
def get_mis_pedidos():
    """Obtener pedidos del usuario autenticado"""
    try:
        # Verificar que el usuario esté autenticado
        if 'tienda_user_id' not in session:
            return jsonify({'error': 'Usuario no autenticado'}), 401
        
        user_id = session['tienda_user_id']
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT p.id, p.fecha_pedido, p.total, e.nombre as estatus
            FROM Pedidos p
            JOIN Estatus e ON p.id_estatus = e.id
            WHERE p.id_usuario = ?
            ORDER BY p.fecha_pedido DESC
        """, (user_id,))
        
        pedidos = []
        for row in cursor.fetchall():
            pedidos.append({
                'id': row.id,
                'fecha_pedido': row.fecha_pedido.isoformat() if row.fecha_pedido else None,
                'total': float(row.total),
                'estatus': row.estatus
            })
        
        conn.close()
        return jsonify({'pedidos': pedidos})
        
    except Exception as e:
        print(f"Error en get_mis_pedidos: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/tipos-tarjeta')
def get_tipos_tarjeta():
    """Obtener tipos de tarjeta disponibles"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre FROM TiposTarjeta ORDER BY nombre")
        
        tipos = []
        for row in cursor.fetchall():
            tipos.append({
                'id': row.id,
                'nombre': row.nombre
            })
        
        conn.close()
        return jsonify({'tipos_tarjeta': tipos})
        
    except Exception as e:
        print(f"Error en get_tipos_tarjeta: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/pedidos/detalle/<int:pedido_id>')
def get_pedido_detalle(pedido_id):
    """Obtener detalles completos de un pedido"""
    try:
        # Verificar que el usuario esté autenticado
        if 'tienda_user_id' not in session:
            return jsonify({'error': 'Usuario no autenticado'}), 401
        
        user_id = session['tienda_user_id']
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Verificar que el pedido pertenece al usuario autenticado
        cursor.execute("SELECT id_usuario FROM Pedidos WHERE id = ?", (pedido_id,))
        pedido_owner = cursor.fetchone()
        
        if not pedido_owner or pedido_owner.id_usuario != user_id:
            return jsonify({'error': 'No autorizado para ver este pedido'}), 403
        
        # Obtener información del pedido
        cursor.execute("""
            SELECT p.id, p.fecha_pedido, p.total, e.nombre as estatus, p.telefono_contacto,
                   CONCAT(ca.nombre, ', ', co.nombre, ', ', m.nombre, ', ', es.nombre) as direccion_completa
            FROM Pedidos p
            JOIN Estatus e ON p.id_estatus = e.id
            LEFT JOIN Direcciones d ON p.id_direccion = d.id
            LEFT JOIN Calles ca ON d.id_calle = ca.id
            LEFT JOIN Colonias co ON ca.id_colonia = co.id
            LEFT JOIN Municipios m ON co.id_municipio = m.id
            LEFT JOIN Estados es ON m.id_estado = es.id
            WHERE p.id = ?
        """, (pedido_id,))
        
        pedido_row = cursor.fetchone()
        if not pedido_row:
            return jsonify({'error': 'Pedido no encontrado'}), 404
        
        # Obtener detalles del pedido
        cursor.execute("""
            SELECT dp.cantidad, dp.precio_unitario, dp.subtotal, pr.nombre as producto_nombre
            FROM DetallesPedido dp
            JOIN Productos pr ON dp.id_producto = pr.id
            WHERE dp.id_pedido = ?
        """, (pedido_id,))
        
        detalles = []
        for row in cursor.fetchall():
            detalles.append({
                'cantidad': row.cantidad,
                'precio_unitario': float(row.precio_unitario),
                'subtotal': float(row.subtotal),
                'producto_nombre': row.producto_nombre
            })
        
        pedido = {
            'id': pedido_row.id,
            'fecha_pedido': pedido_row.fecha_pedido.isoformat() if pedido_row.fecha_pedido else None,
            'total': float(pedido_row.total),
            'estatus': pedido_row.estatus,
            'telefono_contacto': pedido_row.telefono_contacto,
            'direccion': pedido_row.direccion_completa,
            'detalles': detalles
        }
        
        conn.close()
        return jsonify({'pedido': pedido})
        
    except Exception as e:
        print(f"Error en get_pedido_detalle: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/pedidos/reordenar/<int:pedido_id>', methods=['POST'])
def reordenar_pedido(pedido_id):
    """Reordenar un pedido (agregar productos al carrito)"""
    try:
        # Verificar que el usuario esté autenticado
        if 'tienda_user_id' not in session:
            return jsonify({'error': 'Usuario no autenticado'}), 401
        
        user_id = session['tienda_user_id']
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Verificar que el pedido pertenece al usuario autenticado
        cursor.execute("SELECT id_usuario FROM Pedidos WHERE id = ?", (pedido_id,))
        pedido_owner = cursor.fetchone()
        
        if not pedido_owner or pedido_owner.id_usuario != user_id:
            return jsonify({'error': 'No autorizado para reordenar este pedido'}), 403
        
        # Obtener productos del pedido original
        cursor.execute("""
            SELECT dp.id_producto, dp.cantidad, pr.nombre, pr.precio, pr.stock, pr.imagen_url
            FROM DetallesPedido dp
            JOIN Productos pr ON dp.id_producto = pr.id
            WHERE dp.id_pedido = ? AND pr.activo = 1
        """, (pedido_id,))
        
        productos = []
        for row in cursor.fetchall():
            if row.stock >= row.cantidad:  # Solo agregar si hay stock suficiente
                productos.append({
                    'id': row.id_producto,
                    'nombre': row.nombre,
                    'precio': float(row.precio),
                    'cantidad': row.cantidad,
                    'imagen_url': row.imagen_url,
                    'stock': row.stock
                })
        
        conn.close()
        
        if not productos:
            return jsonify({'error': 'No hay productos disponibles para reordenar'}), 400
        
        return jsonify({
            'success': True,
            'productos': productos,
            'message': f'Se agregaron {len(productos)} productos al carrito'
        })
        
    except Exception as e:
        print(f"Error en reordenar_pedido: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/categorias')
def get_categories():
    """Obtener todas las categorías"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute('SELECT id, nombre, descripcion FROM CategoriasProducto ORDER BY nombre')
        categories = cursor.fetchall()
        
        # Convertir a lista de diccionarios
        categories_list = []
        for category in categories:
            categories_list.append({
                'id': category[0],
                'name': category[1],
                'description': category[2] if category[2] else ''
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'categories': categories_list
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error al obtener categorías: {str(e)}'
        }), 500

# =============================================
# ENDPOINTS DE ESPECIES - FILTROS Y METADATOS
# =============================================


@app.route('/api/tipos-especies')
def get_tipos_especies():
    """API para obtener tipos de organismos/especies disponibles"""
    try:
        tipos = [
            {'id': 'mamiferos', 'nombre': 'Mamíferos Marinos', 'descripcion': 'Ballenas, delfines, focas y otros mamíferos marinos'},
            {'id': 'peces', 'nombre': 'Peces', 'descripcion': 'Peces cartilaginosos y óseos'},
            {'id': 'reptiles', 'nombre': 'Reptiles Marinos', 'descripcion': 'Tortugas marinas, serpientes marinas e iguanas'},
            {'id': 'invertebrados', 'nombre': 'Invertebrados', 'descripcion': 'Moluscos, crustáceos, equinodermos y otros'},
            {'id': 'corales', 'nombre': 'Corales', 'descripcion': 'Corales duros y blandos formadores de arrecifes'},
            {'id': 'algas', 'nombre': 'Algas Marinas', 'descripcion': 'Macroalgas y microalgas marinas'},
            {'id': 'aves', 'nombre': 'Aves Marinas', 'descripcion': 'Aves que dependen del ambiente marino'}
        ]
        
        return jsonify({
            'success': True,
            'tipos': tipos
        })
        
    except Exception as e:
        print(f"Error en get_tipos_especies: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/regiones')
def get_regiones():
    """API para obtener regiones geográficas disponibles"""
    try:
        regiones = [
            {'id': 'pacifico', 'nombre': 'Océano Pacífico', 'descripcion': 'El mayor océano del planeta'},
            {'id': 'atlantico', 'nombre': 'Océano Atlántico', 'descripcion': 'Segundo océano más grande del mundo'},
            {'id': 'indico', 'nombre': 'Océano Índico', 'descripcion': 'Tercer océano más grande'},
            {'id': 'artico', 'nombre': 'Océano Ártico', 'descripcion': 'Océano polar del norte'},
            {'id': 'antartico', 'nombre': 'Océano Antártico', 'descripcion': 'Océano que rodea la Antártida'},
            {'id': 'mediterraneo', 'nombre': 'Mar Mediterráneo', 'descripcion': 'Mar semicerrado entre Europa, África y Asia'},
            {'id': 'caribe', 'nombre': 'Mar Caribe', 'descripcion': 'Mar tropical en América Central'}
        ]
        
        return jsonify({
            'success': True,
            'regiones': regiones
        })
        
    except Exception as e:
        print(f"Error en get_regiones: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500

@app.route('/api/especies/estadisticas')
def get_especies_estadisticas():
    """API para obtener estadísticas dinámicas de especies"""
    try:
        conn = get_db_connection()
        if not conn:
            # Datos de fallback si no hay conexión
            return jsonify({
                'success': True,
                'estadisticas': {
                    'total_especies': 2847,
                    'en_peligro_critico': 156,
                    'en_peligro': 300,
                    'vulnerables': 891,
                    'especies_marinas': 2200,
                    'especies_agregadas_hoy': 3,
                    'especies_agregadas_mes': 89,
                    'habitats_representados': 7,
                    'regiones_cubiertas': 7
                }
            })
        
        cursor = conn.cursor()
        
        # Contar total de especies
        cursor.execute("SELECT COUNT(*) as total FROM Especies WHERE activo = 1")
        total_especies = cursor.fetchone()[0]
        
        # Contar por estados de conservación
        cursor.execute("""
            SELECT ec.nombre, COUNT(*) as cantidad
            FROM Especies e
            LEFT JOIN EstadosConservacion ec ON e.id_estado_conservacion = ec.id
            WHERE e.activo = 1
            GROUP BY ec.nombre
        """)
        
        conservacion_stats = {}
        for row in cursor.fetchall():
            conservacion_stats[row[0]] = row[1]
        
        # Especies agregadas recientemente
        cursor.execute("""
            SELECT COUNT(*) as agregadas_hoy
            FROM Especies 
            WHERE CAST(fecha_registro AS DATE) = CAST(GETDATE() AS DATE)
            AND activo = 1
        """)
        agregadas_hoy = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) as agregadas_mes
            FROM Especies 
            WHERE YEAR(fecha_registro) = YEAR(GETDATE()) 
            AND MONTH(fecha_registro) = MONTH(GETDATE())
            AND activo = 1
        """)
        agregadas_mes = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'estadisticas': {
                'total_especies': total_especies,
                'en_peligro_critico': conservacion_stats.get('Extinción Crítica', 0),
                'en_peligro': conservacion_stats.get('En Peligro', 0),
                'vulnerables': conservacion_stats.get('Vulnerable', 0),
                'especies_marinas': total_especies,  # En este caso todas son marinas
                'especies_agregadas_hoy': agregadas_hoy,
                'especies_agregadas_mes': agregadas_mes,
                'habitats_representados': 7,  # Número fijo de hábitats disponibles
                'regiones_cubiertas': 7  # Número fijo de regiones disponibles
            }
        })
        
    except Exception as e:
        print(f"Error en get_especies_estadisticas: {e}")
        # Datos de fallback en caso de error
        return jsonify({
            'success': True,
            'estadisticas': {
                'total_especies': 2847,
                'en_peligro_critico': 156,
                'en_peligro': 300,
                'vulnerables': 891,
                'especies_marinas': 2200,
                'especies_agregadas_hoy': 3,
                'especies_agregadas_mes': 89,
                'habitats_representados': 7,
                'regiones_cubiertas': 7
            }
        })

@app.route('/api/especies/opciones-filtros')
def get_opciones_filtros():
    """API para obtener todas las opciones de filtros disponibles de una vez"""
    try:
        # Obtener hábitats
        response_habitats = get_habitats()
        habitats_data = response_habitats.get_json()
        
        # Obtener tipos
        response_tipos = get_tipos_especies()
        tipos_data = response_tipos.get_json()
        
        # Obtener regiones
        response_regiones = get_regiones()
        regiones_data = response_regiones.get_json()
        
        # Estados de conservación (estáticos)
        estados_conservacion = [
            {'id': 'extincion-critica', 'nombre': 'Extinción Crítica', 'descripcion': 'Especies con riesgo extremadamente alto de extinción'},
            {'id': 'peligro', 'nombre': 'En Peligro', 'descripcion': 'Especies con riesgo muy alto de extinción'},
            {'id': 'vulnerable', 'nombre': 'Vulnerable', 'descripcion': 'Especies con riesgo alto de extinción'},
            {'id': 'casi-amenazada', 'nombre': 'Casi Amenazada', 'descripcion': 'Especies cerca de ser vulnerables'},
            {'id': 'preocupacion-menor', 'nombre': 'Preocupación Menor', 'descripcion': 'Especies con riesgo bajo de extinción'}
        ]
        
        # Opciones de ordenamiento
        ordenamiento = [
            {'id': 'nombre', 'nombre': 'Nombre', 'descripcion': 'Ordenar alfabéticamente por nombre'},
            {'id': 'conservation', 'nombre': 'Estado de Conservación', 'descripcion': 'Ordenar por nivel de amenaza'},
            {'id': 'size', 'nombre': 'Tamaño', 'descripcion': 'Ordenar por tamaño de la especie'},
            {'id': 'habitat', 'nombre': 'Hábitat', 'descripcion': 'Ordenar por tipo de hábitat'},
            {'id': 'added', 'nombre': 'Recién Agregados', 'descripcion': 'Ordenar por fecha de adición'}
        ]
        
        return jsonify({
            'success': True,
            'filtros': {
                'habitats': habitats_data.get('habitats', []) if habitats_data.get('success') else [],
                'tipos': tipos_data.get('tipos', []) if tipos_data.get('success') else [],
                'regiones': regiones_data.get('regiones', []) if regiones_data.get('success') else [],
                'estados_conservacion': estados_conservacion,
                'ordenamiento': ordenamiento
            }
        })
        
    except Exception as e:
        print(f"Error en get_opciones_filtros: {e}")
        return jsonify({
            'success': False,
            'error': 'Error al obtener opciones de filtros'
        }), 500

@app.route('/api/especies/busqueda-avanzada')
def busqueda_avanzada_especies():
    """API para búsqueda avanzada con múltiples criterios"""
    try:
        # Parámetros de búsqueda avanzada
        nombre = request.args.get('nombre', '').strip()
        nombre_cientifico = request.args.get('nombre_cientifico', '').strip()
        habitat = request.args.get('habitat', '')
        conservation = request.args.get('conservation', '')
        tipo = request.args.get('tipo', '')
        region = request.args.get('region', '')
        tamaño_min = request.args.get('tamaño_min', '')
        tamaño_max = request.args.get('tamaño_max', '')
        amenaza = request.args.get('amenaza', '').strip()
        
        # Usar el endpoint principal con parámetros expandidos
        search_terms = []
        if nombre:
            search_terms.append(nombre)
        if nombre_cientifico:
            search_terms.append(nombre_cientifico)
        
        search_query = ' '.join(search_terms)
        
        # Construir parámetros para el endpoint principal
        params = {}
        if search_query:
            params['search'] = search_query
        if habitat:
            params['habitat'] = habitat
        if conservation:
            params['conservation'] = conservation
        if tipo:
            params['type'] = tipo
        if region:
            params['region'] = region
        
        # Llamar al endpoint principal con los parámetros
        from flask import request as flask_request
        
        # Temporalmente cambiar los args del request
        original_args = flask_request.args
        flask_request.args = params
        
        # Llamar a la función principal
        result = api_especies()
        
        # Restaurar args originales
        flask_request.args = original_args
        
        return result
        
    except Exception as e:
        print(f"Error en busqueda_avanzada_especies: {e}")
        return jsonify({
            'success': False,
            'error': 'Error en búsqueda avanzada'
        }), 500

# =============================================
# ENDPOINTS DE CONTACTO
# =============================================

@app.route('/api/contacto', methods=['POST'])
def enviar_contacto():
    """Enviar mensaje de contacto"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not data.get('name') or not data.get('email') or not data.get('subject') or not data.get('message'):
            return jsonify({
                'success': False,
                'message': 'Todos los campos son requeridos'
            }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Error de conexión a la base de datos'
            }), 500
        
        cursor = conn.cursor()
        
        # 1. Verificar si el usuario ya existe por email
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (data['email'],))
        user_row = cursor.fetchone()
        
        if user_row:
            user_id = user_row.id
        else:
            # 2. Crear nuevo usuario con solo nombre y email
            # Usar campos separados si están disponibles, sino dividir el nombre completo
            if data.get('nombre') and data.get('apellidoPaterno'):
                primer_nombre = data['nombre']
                apellido_paterno = data['apellidoPaterno']  
                apellido_materno = data.get('apellidoMaterno')
            else:
                # Dividir el nombre en partes como fallback
                nombre_partes = data['name'].split()
                primer_nombre = nombre_partes[0] if nombre_partes else 'Usuario'
                apellido_paterno = nombre_partes[1] if len(nombre_partes) > 1 else 'Sin Apellido'
                apellido_materno = nombre_partes[2] if len(nombre_partes) > 2 else None
            
            cursor.execute("""
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, suscrito_newsletter, activo)
                VALUES (?, ?, ?, ?, 0, 1)
            """, (primer_nombre, apellido_paterno, apellido_materno, data['email']))
            
            # Obtener el ID del usuario creado
            cursor.execute("SELECT @@IDENTITY")
            user_id = cursor.fetchone()[0]
        
        # 3. Insertar mensaje de contacto
        cursor.execute("""
            INSERT INTO Contactos (id_usuario, asunto, mensaje, fecha_contacto, respondido)
            VALUES (?, ?, ?, GETDATE(), 0)
        """, (user_id, data['subject'], data['message']))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Mensaje enviado exitosamente. Te contactaremos pronto.'
        })
        
    except Exception as e:
        print(f"Error en enviar_contacto: {e}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

# =============================================
# ENDPOINTS DE EVENTOS
# =============================================

@app.route('/api/eventos/crear', methods=['POST'])
def crear_evento():
    """Crear nuevo evento"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['titulo', 'descripcion', 'fecha_evento', 'hora_inicio', 'id_tipo_evento', 'id_modalidad']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'El campo {field} es requerido'
                }), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Error de conexión a la base de datos'
            }), 500
        
        cursor = conn.cursor()
        
        # Verificar si el usuario está autenticado
        user_id = None
        if 'tienda_user_id' in session:
            user_id = session['tienda_user_id']
        else:
            # Crear usuario temporal con solo nombre y email de contacto
            # Dividir el nombre en partes
            nombre_completo = data.get('nombre_organizador', 'Organizador Sin Apellido')
            nombre_partes = nombre_completo.split()
            primer_nombre = nombre_partes[0] if nombre_partes else 'Organizador'
            apellido_paterno = nombre_partes[1] if len(nombre_partes) > 1 else 'Sin Apellido'
            apellido_materno = nombre_partes[2] if len(nombre_partes) > 2 else None
            
            cursor.execute("""
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, suscrito_newsletter, activo)
                VALUES (?, ?, ?, ?, 0, 1)
            """, (primer_nombre, apellido_paterno, apellido_materno, data.get('contacto')))
            
            cursor.execute("SELECT @@IDENTITY")
            user_id = cursor.fetchone()[0]
        
        # Verificar si ya existe un organizador para este usuario
        cursor.execute("SELECT id FROM Organizadores WHERE id_usuario = ?", (user_id,))
        organizador_row = cursor.fetchone()
        
        if organizador_row:
            organizador_id = organizador_row.id
        else:
            # Crear nuevo organizador
            cursor.execute("""
                INSERT INTO Organizadores (id_usuario, experiencia_eventos, certificado)
                VALUES (?, 0, 0)
            """, (user_id,))
            
            cursor.execute("SELECT @@IDENTITY")
            organizador_id = cursor.fetchone()[0]
        
        # Manejar la dirección/ubicación
        direccion_id = None
        if data.get('url_evento'):
            # Para eventos virtuales, no necesitamos dirección física
            url_evento = data.get('url_evento')
        else:
            url_evento = None
        
        # Insertar el evento
        cursor.execute("""
            INSERT INTO Eventos (
                titulo, descripcion, fecha_evento, hora_inicio, hora_fin,
                id_tipo_evento, id_modalidad, url_evento, capacidad_maxima,
                costo, id_organizador, id_estatus
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            data['titulo'],
            data['descripcion'],
            data['fecha_evento'],
            data['hora_inicio'],
            data.get('hora_fin'),
            data['id_tipo_evento'],
            data['id_modalidad'],
            url_evento,
            data.get('capacidad_maxima', 50),
            data.get('costo', 0),
            organizador_id
        ))
        
        cursor.execute("SELECT @@IDENTITY")
        evento_id = cursor.fetchone()[0]
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'evento_id': evento_id,
            'message': 'Evento creado exitosamente. Será revisado y publicado pronto.'
        })
        
    except Exception as e:
        print(f"Error en crear_evento: {e}")
        return jsonify({
            'success': False,
            'message': 'Error interno del servidor'
        }), 500

@app.route('/api/procesar-donacion', methods=['POST'])
def procesar_donacion():
    """API para procesar donaciones y guardar datos de pago"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        required_fields = ['amount', 'contact_name', 'contact_email', 'payment_method']
        for field in required_fields:
            if field not in data or data[field] is None or data[field] == '':
                return jsonify({'error': f'Campo requerido: {field}'}), 400
        
        # Si es pago con tarjeta, validar datos adicionales
        if data['payment_method'] == 'credit_card':
            card_fields = ['card_number', 'card_name', 'card_expiry', 'card_cvv']
            for field in card_fields:
                if field not in data or data[field] is None or data[field] == '':
                    return jsonify({'error': f'Campo requerido para tarjeta: {field}'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # 1. Buscar o crear usuario
        cursor.execute("SELECT id FROM Usuarios WHERE email = ?", (data['contact_email'],))
        user_row = cursor.fetchone()
        
        if user_row:
            user_id = user_row[0]
        else:
            # Crear nuevo usuario - usar campos separados si están disponibles
            if 'contact_nombre' in data and 'contact_apellido_paterno' in data:
                primer_nombre = data['contact_nombre']
                apellido_paterno = data['contact_apellido_paterno']
                apellido_materno = data.get('contact_apellido_materno')
            else:
                # Fallback: dividir el nombre completo
                nombre_partes = data['contact_name'].split()
                primer_nombre = nombre_partes[0] if nombre_partes else 'Usuario'
                apellido_paterno = nombre_partes[1] if len(nombre_partes) > 1 else 'Sin Apellido'
                apellido_materno = nombre_partes[2] if len(nombre_partes) > 2 else None
            
            cursor.execute("""
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, suscrito_newsletter, fecha_registro, activo) 
                VALUES (?, ?, ?, ?, 0, GETDATE(), 1)
            """, (primer_nombre, apellido_paterno, apellido_materno, data['contact_email']))
            
            cursor.execute("SELECT @@IDENTITY")
            user_id = cursor.fetchone()[0]
        
        # 2. Crear registro de donador
        cursor.execute("""
            INSERT INTO Donadores (id_usuario, monto, fecha_donacion, id_tipoDonacion) 
            VALUES (?, ?, GETDATE(), 1)
        """, (user_id, float(data['amount'])))
        
        cursor.execute("SELECT @@IDENTITY")
        donador_id = cursor.fetchone()[0]
        
        # 3. Crear registro de donación según el método de pago
        if data['payment_method'] == 'credit_card':
            # Determinar tipo de tarjeta basándose en el primer dígito
            primer_digito = data['card_number'].replace(' ', '')[0]
            if primer_digito == '4':
                tipo_tarjeta_id = 1  # Visa
            elif primer_digito in ['5', '2']:
                tipo_tarjeta_id = 2  # Mastercard
            elif primer_digito == '3':
                tipo_tarjeta_id = 3  # American Express
            else:
                tipo_tarjeta_id = 4  # Tarjeta de Débito (genérico)
            
            # Insertar datos de la tarjeta (SIN ENCRIPTAR como solicitado)
            cursor.execute("""
                INSERT INTO Donaciones (
                    id_donador, 
                    numero_tarjeta_encriptado, 
                    fecha_expiracion_encriptada, 
                    cvv_encriptado, 
                    id_tipoTarjeta
                ) 
                VALUES (?, ?, ?, ?, ?)
            """, (
                donador_id,
                data['card_number'].replace(' ', ''),  # Sin encriptar
                data['card_expiry'],  # Sin encriptar
                data['card_cvv'],  # Sin encriptar
                tipo_tarjeta_id
            ))
        elif data['payment_method'] == 'paypal':
            # Para PayPal, crear registro con tipo PayPal (ID 5)
            cursor.execute("""
                INSERT INTO Donaciones (
                    id_donador, 
                    numero_tarjeta_encriptado, 
                    fecha_expiracion_encriptada, 
                    cvv_encriptado, 
                    id_tipoTarjeta
                ) 
                VALUES (?, ?, ?, ?, ?)
            """, (
                donador_id,
                'PAYPAL_TRANSACTION',  # Identificador para PayPal
                'N/A',  # No aplica para PayPal
                'N/A',  # No aplica para PayPal
                5  # PayPal en TiposTarjeta
            ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Donación procesada exitosamente',
            'donador_id': donador_id
        })
        
    except Exception as e:
        print(f"Error en procesar_donacion: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return jsonify({'error': str(e)}), 500

# API Endpoints para colaboradores
@app.route('/api/colaboradores/login', methods=['POST'])
def colaborador_login():
    """API para login de colaboradores"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email y contraseña son requeridos'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Buscar usuario y verificar si es colaborador activo
        cursor.execute("""
            SELECT u.id, u.nombre, u.apellido_paterno, u.apellido_materno, u.email, 
                   u.password_hash, c.id as colaborador_id, c.especialidad, c.estado_solicitud, 
                   c.institucion, c.años_experiencia, c.grado_academico
            FROM Usuarios u
            INNER JOIN Colaboradores c ON u.id = c.id_usuario
            WHERE LOWER(u.email) = ? AND c.estado_solicitud = 'aprobada' AND c.activo = 1
        """, (email,))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'Usuario no encontrado o no es un colaborador activo'}), 401
        
        # Validar contraseña
        if user[5] != password:  # password_hash está en índice 5 ahora
            return jsonify({'error': 'Contraseña incorrecta'}), 401
        
        # Construir nombre completo evitando duplicación
        nombre_completo = construir_nombre_completo(user[1], user[2], user[3])
        
        # Crear sesión para el colaborador
        session['colab_user_id'] = user[0]
        session['colab_user_email'] = user[4]
        session['colab_user_name'] = nombre_completo
        session['colab_colaborador_id'] = user[6]
        session['colab_user_type'] = 'colaborador'
        
        return jsonify({
            'success': True,
            'message': 'Login exitoso',
            'user': {
                'id': user[0],
                'nombre': user[1],
                'apellido_paterno': user[2],
                'apellido_materno': user[3],
                'nombre_completo': nombre_completo,
                'email': user[4],
                'colaborador_id': user[6],
                'especialidad': user[7],
                'institucion': user[9],
                'años_experiencia': user[10],
                'grado_academico': user[11]
            }
        })
        
    except Exception as e:
        print(f"Error en colaborador_login: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/colaboradores/register', methods=['POST'])
def colaborador_register():
    """API para registro de nuevos colaboradores"""
    try:
        data = request.get_json()
        
        # Validar datos obligatorios
        required_fields = ['nombre', 'email', 'password', 'especialidad', 'grado_academico', 
                          'institucion', 'años_experiencia', 'motivacion']
        
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'El campo {field} es obligatorio'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Verificar si el usuario ya existe
        cursor.execute("SELECT id FROM Usuarios WHERE LOWER(email) = ?", (data['email'].lower(),))
        existing_user = cursor.fetchone()
        
        if existing_user:
            # Usuario existe, verificar si ya es colaborador
            cursor.execute("""
                SELECT estado_solicitud FROM Colaboradores 
                WHERE id_usuario = ? AND estado_solicitud IN ('pendiente', 'aprobada')
            """, (existing_user[0],))
            
            existing_collaborator = cursor.fetchone()
            if existing_collaborator:
                estado = existing_collaborator[0]
                if estado == 'pendiente':
                    return jsonify({'error': 'Ya tienes una solicitud de colaboración pendiente'}), 400
                elif estado == 'aprobada':
                    return jsonify({'error': 'Ya eres un colaborador activo'}), 400
            
            # Usuario existe pero no es colaborador, usar su ID
            user_id = existing_user[0]
        else:
            # Crear nuevo usuario - usar campos separados si están disponibles
            if 'apellidoPaterno' in data and data['apellidoPaterno']:
                primer_nombre = data['nombre']
                apellido_paterno = data['apellidoPaterno']
                apellido_materno = data.get('apellidoMaterno')
            else:
                # Fallback: dividir el nombre completo
                nombre_partes = data['nombre'].split()
                primer_nombre = nombre_partes[0] if nombre_partes else 'Usuario'
                apellido_paterno = nombre_partes[1] if len(nombre_partes) > 1 else 'Sin Apellido'
                apellido_materno = nombre_partes[2] if len(nombre_partes) > 2 else None
            
            cursor.execute("""
                INSERT INTO Usuarios (nombre, apellido_paterno, apellido_materno, email, password_hash, suscrito_newsletter, activo) 
                OUTPUT INSERTED.id
                VALUES (?, ?, ?, ?, ?, 0, 1)
            """, (primer_nombre, apellido_paterno, apellido_materno, data['email'].lower(), data['password']))
            
            # Obtener el ID del usuario recién insertado
            user_result = cursor.fetchone()
            if not user_result:
                raise Exception("No se pudo obtener el ID del usuario creado")
            user_id = user_result[0]
            print(f"Usuario creado con ID: {user_id}")  # Debug
        
        # Crear solicitud de colaboración (por defecto se aprueba automáticamente)
        cursor.execute("""
            INSERT INTO Colaboradores (
                id_usuario, especialidad, grado_academico, institucion, 
                años_experiencia, numero_cedula, orcid, motivacion,
                estado_solicitud, fecha_aprobacion, aprobado_por
            ) OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aprobada', GETDATE(), NULL)
        """, (
            user_id,
            data['especialidad'],
            data['grado_academico'],
            data['institucion'],
            data['años_experiencia'],
            data.get('numero_cedula', None),
            data.get('orcid', None),
            data['motivacion']
        ))
        
        # Obtener el ID del colaborador recién insertado
        colaborador_result = cursor.fetchone()
        if not colaborador_result:
            raise Exception("No se pudo obtener el ID del colaborador creado")
        colaborador_id = colaborador_result[0]
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Registro exitoso. Has sido aprobado como colaborador científico.',
            'colaborador_id': colaborador_id,
            'user_id': user_id
        })
        
    except pyodbc.IntegrityError as e:
        print(f"Error de integridad en colaborador_register: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        
        # Proporcionar más detalles del error para debugging
        error_message = str(e)
        if 'UNIQUE constraint failed' in error_message or 'duplicate' in error_message.lower():
            return jsonify({'error': 'Este email ya está registrado como colaborador'}), 400
        elif 'FOREIGN KEY constraint failed' in error_message or 'foreign key' in error_message.lower():
            return jsonify({'error': 'Error de referencia en los datos'}), 400
        else:
            return jsonify({'error': f'Error de integridad: {error_message}'}), 400
        
    except Exception as e:
        print(f"Error en colaborador_register: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/colaboradores/check-email', methods=['POST'])
def check_collaborator_email():
    """API para verificar si un email ya está registrado como colaborador"""
    try:
        data = request.get_json()
        
        if not data or not data.get('email'):
            return jsonify({'error': 'Email es requerido'}), 400
        
        email = data['email'].strip().lower()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Verificar si existe usuario con este email y su estado como colaborador
        cursor.execute("""
            SELECT u.id, c.estado_solicitud, c.activo
            FROM Usuarios u
            LEFT JOIN Colaboradores c ON u.id = c.id_usuario
            WHERE LOWER(u.email) = ?
        """, (email,))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return jsonify({'exists': False, 'can_register': True})
        
        user_id, estado_solicitud, activo = result
        
        if estado_solicitud == 'pendiente':
            return jsonify({
                'exists': True, 
                'can_register': False, 
                'message': 'Ya tienes una solicitud pendiente'
            })
        elif estado_solicitud == 'aprobada' and activo:
            return jsonify({
                'exists': True, 
                'can_register': False, 
                'message': 'Ya eres un colaborador activo'
            })
        else:
            return jsonify({'exists': True, 'can_register': True})
        
    except Exception as e:
        print(f"Error en check_collaborator_email: {e}")
        return jsonify({'error': str(e)}), 500

# =============================================
# PORTAL DE COLABORADORES
# =============================================

@app.route('/portal-colaboradores')
def portal_colaboradores():
    """Página del portal de colaboradores"""
    return render_template('portal-colaboradores.html')

@app.route('/api/colaboradores/profile', methods=['GET'])
def get_colaborador_profile():
    """Obtener perfil del colaborador desde session"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Obtener email del colaborador desde la sesión
        colaborador_email = session.get('colab_user_email')
        if not colaborador_email:
            conn.close()
            return jsonify({'success': False, 'error': 'No hay sesión activa de colaborador'}), 401
        
        cursor.execute("""
            SELECT c.id, c.especialidad, c.grado_academico, c.institucion, 
                   c.años_experiencia, c.numero_cedula, c.orcid, c.estado_solicitud,
                   u.nombre, u.apellido_paterno, u.apellido_materno, u.email
            FROM Colaboradores c
            JOIN Usuarios u ON c.id_usuario = u.id
            WHERE u.email = ?
        """, (colaborador_email,))
        
        row = cursor.fetchone()
        
        if row:
            # Debug: imprimir el valor raw de años_experiencia
            print(f"Valor raw años_experiencia desde BD: '{row[4]}'")
            
            # Construir nombre completo evitando duplicación
            nombre_completo = construir_nombre_completo(row[8], row[9], row[10], "Dr. ")
            
            # Procesar años de experiencia
            experiencia_raw = row[4]
            if experiencia_raw is None:
                experiencia_procesada = '0'
            else:
                # Limpiar el valor si viene con texto
                experiencia_procesada = str(experiencia_raw).replace(' años', '').replace(' año', '').strip()
                # Si después de limpiar queda vacío, usar 0
                if not experiencia_procesada:
                    experiencia_procesada = '0'
            
            print(f"Valor procesado años_experiencia: '{experiencia_procesada}'")
            
            colaborador = {
                'id': row[0],
                'especialidad': row[1],
                'grado_academico': row[2],
                'institucion': row[3],
                'años_experiencia': experiencia_procesada,
                'numero_cedula': row[5],
                'orcid': row[6],
                'estado_solicitud': row[7],
                'nombre': row[8],
                'apellido_paterno': row[9],
                'apellido_materno': row[10],
                'nombre_completo': nombre_completo,
                'email': row[11]
            }
            
            conn.close()
            return jsonify({
                'success': True,
                'colaborador': colaborador
            })
        else:
            conn.close()
            return jsonify({'success': False, 'error': 'Colaborador no encontrado o no autenticado'}), 404
            
    except Exception as e:
        print(f"Error en get_colaborador_profile: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/especies', methods=['GET'])
def get_especies():
    """Obtener especies con filtros y paginación"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Obtener parámetros de consulta
        search = request.args.get('search', '').strip()
        habitat_filter = request.args.get('habitat', '')
        conservation_filter = request.args.get('conservation', '')
        sort_by = request.args.get('sort', 'nombre')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 12))
        offset = (page - 1) * limit
        
        # Debug: imprimir filtros recibidos (comentar en producción)
        # print(f"Filtros recibidos - Habitat: '{habitat_filter}', Conservation: '{conservation_filter}', Search: '{search}'")
        
        # Construir consulta SQL con filtros
        base_query = """
            SELECT DISTINCT e.id, e.nombre_comun, e.nombre_cientifico, 
                   e.esperanza_vida, e.poblacion_estimada, e.id_estado_conservacion, 
                   e.imagen_url, ec.nombre as estado_conservacion
            FROM Especies e
            LEFT JOIN EstadosConservacion ec ON e.id_estado_conservacion = ec.id
            LEFT JOIN EspeciesHabitats eh ON e.id = eh.id_especie
            LEFT JOIN Habitats h ON eh.id_habitat = h.id
        """
        
        count_query = """
            SELECT COUNT(DISTINCT e.id)
            FROM Especies e
            LEFT JOIN EstadosConservacion ec ON e.id_estado_conservacion = ec.id
            LEFT JOIN EspeciesHabitats eh ON e.id = eh.id_especie
            LEFT JOIN Habitats h ON eh.id_habitat = h.id
        """
        
        conditions = []
        params = []
        
        # Aplicar filtros
        if search:
            conditions.append("(e.nombre_comun LIKE ? OR e.nombre_cientifico LIKE ?)")
            params.extend([f'%{search}%', f'%{search}%'])
        
        if conservation_filter:
            # Mapear filtro a nombre de estado
            conservation_map = {
                'extincion-critica': ['crítica', 'critica'],
                'peligro': ['peligro'],
                'vulnerable': ['vulnerable'],
                'casi-amenazada': ['amenazada'],
                'preocupacion-menor': ['menor', 'preocupación menor']
            }
            if conservation_filter in conservation_map:
                search_terms = conservation_map[conservation_filter]
                condition_parts = []
                for term in search_terms:
                    condition_parts.append("LOWER(ec.nombre) LIKE ?")
                    params.append(f'%{term}%')
                conditions.append(f"({' OR '.join(condition_parts)})")
        
        if habitat_filter:
            # Mapear filtro de hábitat a nombres de hábitat en la base de datos
            habitat_map = {
                'arrecife': ['arrecife', 'coral'],
                'aguas-profundas': ['profundas', 'abisales'],
                'aguas-abiertas': ['abiertas', 'pelágicas', 'oceánicas'],
                'costero': ['costero', 'costa', 'litoral'],
                'polar': ['polar', 'ártico', 'antártico'],
                'manglar': ['manglar', 'manglares'],
                'estuario': ['estuario', 'estuarios']
            }
            if habitat_filter in habitat_map:
                search_terms = habitat_map[habitat_filter]
                condition_parts = []
                for term in search_terms:
                    condition_parts.append("LOWER(h.nombre) LIKE ?")
                    params.append(f'%{term}%')
                conditions.append(f"({' OR '.join(condition_parts)})")
        
        # Agregar condiciones WHERE si hay filtros
        where_clause = ""
        if conditions:
            where_clause = " WHERE " + " AND ".join(conditions)
        
        # Ordenamiento
        order_map = {
            'nombre': 'e.nombre_comun',
            'conservation': 'ec.nombre',
            'size': 'e.poblacion_estimada DESC',
            'habitat': 'e.nombre_comun',  # Por ahora por nombre
            'added': 'e.id DESC'  # Más recientes primero
        }
        order_clause = f" ORDER BY {order_map.get(sort_by, 'e.nombre_comun')}"
        
        # Contar total de resultados
        total_query = count_query + where_clause
        cursor.execute(total_query, params)
        total_count = cursor.fetchone()[0]
        
        # Obtener especies paginadas
        especies_query = base_query + where_clause + order_clause + f" OFFSET {offset} ROWS FETCH NEXT {limit} ROWS ONLY"
        cursor.execute(especies_query, params)
        
        especies_data = cursor.fetchall()
        
        # Obtener descripciones por separado para evitar problemas con DISTINCT
        descripciones = {}
        if especies_data:
            species_ids = [str(row[0]) for row in especies_data]
            desc_query = f"SELECT id, descripcion FROM Especies WHERE id IN ({','.join(['?' for _ in species_ids])})"
            cursor.execute(desc_query, species_ids)
            desc_data = cursor.fetchall()
            descripciones = {row[0]: row[1] for row in desc_data}
        
        especies = []
        
        for row in especies_data:
            especie_id = row[0]
            
            # Mapear estado de conservación a formato esperado por el frontend
            estado_conservacion = 'preocupacion-menor'  # valor por defecto
            if row[7]:
                estado_nombre = row[7].lower()
                if 'crítica' in estado_nombre or 'critica' in estado_nombre:
                    estado_conservacion = 'extincion-critica'
                elif 'peligro' in estado_nombre:
                    estado_conservacion = 'peligro'
                elif 'vulnerable' in estado_nombre:
                    estado_conservacion = 'vulnerable'
                elif 'amenazada' in estado_nombre:
                    estado_conservacion = 'casi-amenazada'
            
            # Usar datos por defecto para evitar consultas complejas
            caracteristicas = {}
            habitats_nombres = ['Océano Atlántico', 'Océano Pacífico']
            amenazas_nombres = ['Contaminación', 'Pesca excesiva']
            
            especies.append({
                'id': row[0],
                'nombre': row[1],  # Para compatibilidad con especies.js
                'nombre_comun': row[1],
                'nombre_cientifico': row[2],
                'descripcion': descripciones.get(especie_id, 'Sin descripción disponible'),
                'esperanza_vida': f"{row[3]} años" if row[3] else 'No disponible',
                'poblacion_estimada': row[4],
                'id_estado_conservacion': row[5],
                'imagen': row[6] or 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjBmMGYwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkVzcGVjaWUgTWFyaW5hPC90ZXh0Pgo8L3N2Zz4K',
                'imagen_url': row[6],
                'estado_conservacion': estado_conservacion,
                # Datos reales obtenidos de la BD
                'longitud': caracteristicas.get('longitud', ['Variable'])[0] if caracteristicas.get('longitud') else 'Variable',
                'ubicacion': ', '.join(habitats_nombres) if habitats_nombres else 'Océanos',
                'habitat': habitats_nombres[0].lower().replace(' ', '-') if habitats_nombres else 'marino',
                'tipo': 'marina',  # Se puede mejorar más adelante
                'region': 'global',  # Se puede mejorar más adelante
                'amenazas': amenazas_nombres,
                'habitats': habitats_nombres
            })
        
        conn.close()
        
        return jsonify({
            'success': True, 
            'especies': especies,
            'total': total_count,
            'page': page,
            'limit': limit,
            'total_pages': (total_count + limit - 1) // limit  # Ceiling division
        })
        
    except Exception as e:
        print(f"Error en get_especies: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/especies/<int:especie_id>', methods=['GET'])
def get_especie(especie_id):
    """Obtener una especie específica con sus relaciones"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Obtener datos básicos de la especie con estado de conservación
        cursor.execute("""
            SELECT e.id, e.nombre_comun, e.nombre_cientifico, e.descripcion, 
                   e.esperanza_vida, e.poblacion_estimada, e.id_estado_conservacion, 
                   e.imagen_url, ec.nombre as estado_conservacion
            FROM Especies e
            LEFT JOIN EstadosConservacion ec ON e.id_estado_conservacion = ec.id
            WHERE e.id = ?
        """, (especie_id,))
        
        row = cursor.fetchone()
        if not row:
            conn.close()
            return jsonify({'error': 'Especie no encontrada'}), 404
        
        # Mapear estado de conservación a formato esperado por el frontend
        estado_conservacion = 'preocupacion-menor'  # valor por defecto
        if row[8]:
            estado_nombre = row[8].lower()
            if 'crítica' in estado_nombre or 'critica' in estado_nombre:
                estado_conservacion = 'extincion-critica'
            elif 'peligro' in estado_nombre:
                estado_conservacion = 'peligro'
            elif 'vulnerable' in estado_nombre:
                estado_conservacion = 'vulnerable'
            elif 'amenazada' in estado_nombre:
                estado_conservacion = 'casi-amenazada'
        
        # Obtener amenazas asociadas con nombres
        cursor.execute("""
            SELECT a.nombre FROM EspeciesAmenazas ea
            JOIN Amenazas a ON ea.id_amenaza = a.id
            WHERE ea.id_especie = ?
        """, (especie_id,))
        amenazas_nombres = [amenaza_row[0] for amenaza_row in cursor.fetchall()]
        
        # Obtener hábitats asociados con nombres
        cursor.execute("""
            SELECT h.nombre FROM EspeciesHabitats eh
            JOIN Habitats h ON eh.id_habitat = h.id
            WHERE eh.id_especie = ?
        """, (especie_id,))
        habitats_nombres = [habitat_row[0] for habitat_row in cursor.fetchall()]
        
        # Obtener características adicionales si existen
        cursor.execute("""
            SELECT c.tipo_caracteristica, c.valor 
            FROM EspeciesCaracteristicas ec
            JOIN Caracteristicas c ON ec.id_caracteristica = c.id
            WHERE ec.id_especie = ?
        """, (especie_id,))
        caracteristicas_rows = cursor.fetchall()
        
        # Procesar características
        longitud = 'Variable'
        peso = 'Variable'
        for carac_row in caracteristicas_rows:
            tipo = carac_row[0].lower()
            valor = carac_row[1]
            if 'longitud' in tipo or 'tamaño' in tipo or 'talla' in tipo:
                longitud = valor
            elif 'peso' in tipo:
                peso = valor
        
        especie = {
            'id': row[0],
            'nombre_comun': row[1],
            'nombre': row[1],  # Para compatibilidad con el frontend
            'nombre_cientifico': row[2],
            'descripcion': row[3] or 'Sin descripción disponible',
            'esperanza_vida': row[4],
            'poblacion_estimada': row[5],
            'id_estado_conservacion': row[6],
            'imagen_url': row[7],
            'imagen': row[7],  # Para compatibilidad con el frontend
            'estado_conservacion': estado_conservacion,
            'amenazas': amenazas_nombres,
            'habitats': habitats_nombres,
            'longitud': longitud,
            'peso': peso,
            'habitat': habitats_nombres[0].lower().replace(' ', '-') if habitats_nombres else 'marino'
        }
        
        conn.close()
        return jsonify({'success': True, 'especie': especie})
        
    except Exception as e:
        print(f"Error en get_especie: {e}")
        return jsonify({'error': str(e)}), 500
        
    except Exception as e:
        print(f"Error en get_especie: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/especies', methods=['POST'])
def create_especie():
    """Crear nueva especie"""
    try:
        data = request.get_json()
        
        # Validar datos requeridos
        if not data.get('nombre_comun') or not data.get('nombre_cientifico'):
            return jsonify({'error': 'Nombre común y científico son requeridos'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Insertar especie
        cursor.execute("""
            INSERT INTO Especies (nombre_comun, nombre_cientifico, descripcion, 
                                esperanza_vida, poblacion_estimada, id_estado_conservacion, imagen_url)
            OUTPUT INSERTED.id
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            data['nombre_comun'],
            data['nombre_cientifico'],
            data.get('descripcion'),
            data.get('esperanza_vida'),
            data.get('poblacion_estimada'),
            data.get('id_estado_conservacion'),
            data.get('imagen_url')
        ))
        
        especie_result = cursor.fetchone()
        if not especie_result:
            raise Exception("No se pudo obtener el ID de la especie creada")
        especie_id = especie_result[0]
        
        # Insertar amenazas asociadas - Validar que no sean NULL o vacías
        if data.get('amenazas') and isinstance(data['amenazas'], list):
            for amenaza_id in data['amenazas']:
                if amenaza_id and str(amenaza_id).strip() and str(amenaza_id) != 'null':
                    try:
                        amenaza_id_int = int(amenaza_id)
                        cursor.execute("""
                            INSERT INTO EspeciesAmenazas (id_especie, id_amenaza) VALUES (?, ?)
                        """, (especie_id, amenaza_id_int))
                    except (ValueError, TypeError):
                        print(f"ID de amenaza inválido ignorado: {amenaza_id}")
                        continue
        
        # Insertar hábitats asociados - Validar que no sean NULL or vacías
        if data.get('habitats') and isinstance(data['habitats'], list):
            for habitat_id in data['habitats']:
                if habitat_id and str(habitat_id).strip() and str(habitat_id) != 'null':
                    try:
                        habitat_id_int = int(habitat_id)
                        cursor.execute("""
                            INSERT INTO EspeciesHabitats (id_especie, id_habitat) VALUES (?, ?)
                        """, (especie_id, habitat_id_int))
                    except (ValueError, TypeError):
                        print(f"ID de hábitat inválido ignorado: {habitat_id}")
                        continue
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'especie_id': especie_id})
        
    except Exception as e:
        print(f"Error en create_especie: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/especies/<int:especie_id>', methods=['PUT'])
def update_especie(especie_id):
    """Actualizar especie existente"""
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Actualizar datos básicos de la especie
        cursor.execute("""
            UPDATE Especies SET 
                nombre_comun = ?, nombre_cientifico = ?, descripcion = ?,
                esperanza_vida = ?, poblacion_estimada = ?, 
                id_estado_conservacion = ?, imagen_url = ?
            WHERE id = ?
        """, (
            data['nombre_comun'],
            data['nombre_cientifico'],
            data.get('descripcion'),
            data.get('esperanza_vida'),
            data.get('poblacion_estimada'),
            data.get('id_estado_conservacion'),
            data.get('imagen_url'),
            especie_id
        ))
        
        # Eliminar relaciones existentes
        cursor.execute("DELETE FROM EspeciesAmenazas WHERE id_especie = ?", (especie_id,))
        cursor.execute("DELETE FROM EspeciesHabitats WHERE id_especie = ?", (especie_id,))
        
        # Insertar nuevas amenazas - Validar que no sean NULL o vacías
        if data.get('amenazas') and isinstance(data['amenazas'], list):
            for amenaza_id in data['amenazas']:
                if amenaza_id and str(amenaza_id).strip() and str(amenaza_id) != 'null':
                    try:
                        amenaza_id_int = int(amenaza_id)
                        cursor.execute("""
                            INSERT INTO EspeciesAmenazas (id_especie, id_amenaza) VALUES (?, ?)
                        """, (especie_id, amenaza_id_int))
                    except (ValueError, TypeError):
                        print(f"ID de amenaza inválido ignorado: {amenaza_id}")
                        continue
        
        # Insertar nuevos hábitats - Validar que no sean NULL o vacías
        if data.get('habitats') and isinstance(data['habitats'], list):
            for habitat_id in data['habitats']:
                if habitat_id and str(habitat_id).strip() and str(habitat_id) != 'null':
                    try:
                        habitat_id_int = int(habitat_id)
                        cursor.execute("""
                            INSERT INTO EspeciesHabitats (id_especie, id_habitat) VALUES (?, ?)
                        """, (especie_id, habitat_id_int))
                    except (ValueError, TypeError):
                        print(f"ID de hábitat inválido ignorado: {habitat_id}")
                        continue
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True})
        
    except Exception as e:
        print(f"Error en update_especie: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/especies/<int:especie_id>', methods=['DELETE'])
def delete_especie(especie_id):
    """Eliminar especie y todas sus relaciones"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Verificar que la especie existe
        cursor.execute("SELECT nombre_comun FROM Especies WHERE id = ?", (especie_id,))
        especie = cursor.fetchone()
        if not especie:
            conn.close()
            return jsonify({'error': 'Especie no encontrada'}), 404
        
        # Eliminar relaciones en orden correcto (tablas dependientes primero)
        # 1. Avistamientos relacionados
        cursor.execute("DELETE FROM Avistamientos WHERE id_especie = ?", (especie_id,))
        
        # 2. Relaciones especies-amenazas
        cursor.execute("DELETE FROM EspeciesAmenazas WHERE id_especie = ?", (especie_id,))
        
        # 3. Relaciones especies-hábitats  
        cursor.execute("DELETE FROM EspeciesHabitats WHERE id_especie = ?", (especie_id,))
        
        # 4. Características de las especies
        cursor.execute("DELETE FROM EspeciesCaracteristicas WHERE id_especie = ?", (especie_id,))
        
        # 5. Finalmente, eliminar la especie
        cursor.execute("DELETE FROM Especies WHERE id = ?", (especie_id,))
        
        # Verificar que la especie fue eliminada
        if cursor.rowcount == 0:
            conn.rollback()
            conn.close()
            return jsonify({'error': 'No se pudo eliminar la especie'}), 500
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True, 
            'message': f'Especie "{especie[0]}" eliminada exitosamente junto con todas sus relaciones'
        })
        
    except Exception as e:
        print(f"Error en delete_especie: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/estados-conservacion', methods=['GET'])
def get_estados_conservacion():
    """Obtener estados de conservación para formularios"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, descripcion FROM EstadosConservacion ORDER BY nombre")
        
        estados = []
        for row in cursor.fetchall():
            estados.append({
                'id': row[0],
                'nombre': row[1],
                'descripcion': row[2]
            })
        
        conn.close()
        return jsonify({'success': True, 'estados': estados})
        
    except Exception as e:
        print(f"Error en get_estados_conservacion: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/amenazas', methods=['GET'])
def get_amenazas():
    """Obtener amenazas para formularios"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, descripcion FROM Amenazas ORDER BY nombre")
        
        amenazas = []
        for row in cursor.fetchall():
            amenazas.append({
                'id': row[0],
                'nombre': row[1],
                'descripcion': row[2]
            })
        
        conn.close()
        return jsonify({'success': True, 'amenazas': amenazas})
        
    except Exception as e:
        print(f"Error en get_amenazas: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/habitats', methods=['GET'])
def get_habitats():
    """Obtener hábitats para formularios"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, descripcion FROM Habitats ORDER BY nombre")
        
        habitats = []
        for row in cursor.fetchall():
            habitats.append({
                'id': row[0],
                'nombre': row[1],
                'descripcion': row[2]
            })
        
        conn.close()
        return jsonify({'success': True, 'habitats': habitats})
        
    except Exception as e:
        print(f"Error en get_habitats: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/colaboradores/avistamientos', methods=['GET'])
def get_colaborador_avistamientos():
    """Obtener avistamientos del colaborador actual"""
    try:
        # En una implementación real, obtendrías el email del colaborador de la sesión
        # Por ahora, usamos un email de ejemplo
        colaborador_email = "maria.gonzalez@universidad.edu"
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.id, a.fecha, a.latitud, a.longitud, a.notas,
                   e.nombre_comun as especie_nombre, e.nombre_cientifico
            FROM Avistamientos a
            JOIN Especies e ON a.id_especie = e.id
            JOIN Usuarios u ON a.id_usuario = u.id
            WHERE u.email = ?
            ORDER BY a.fecha DESC
        """, (colaborador_email,))
        
        avistamientos = []
        for row in cursor.fetchall():
            avistamientos.append({
                'id': row[0],
                'fecha': row[1].isoformat() if row[1] else None,
                'latitud': float(row[2]) if row[2] else None,
                'longitud': float(row[3]) if row[3] else None,
                'notas': row[4],
                'especie_nombre': row[5],
                'especie_cientifica': row[6]
            })
        
        conn.close()
        return jsonify({'success': True, 'avistamientos': avistamientos})
        
    except Exception as e:
        print(f"Error en get_colaborador_avistamientos: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/avistamientos', methods=['GET'])
def get_avistamientos():
    """Obtener todos los avistamientos"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.id, a.fecha, a.latitud, a.longitud, a.notas,
                   e.nombre_comun as especie_nombre, e.nombre_cientifico,
                   u.email as email_usuario
            FROM Avistamientos a
            JOIN Especies e ON a.id_especie = e.id
            JOIN Usuarios u ON a.id_usuario = u.id
            ORDER BY a.fecha DESC
        """)
        
        avistamientos = []
        for row in cursor.fetchall():
            avistamientos.append({
                'id': row[0],
                'fecha': row[1].isoformat() if row[1] else None,
                'latitud': float(row[2]) if row[2] else None,
                'longitud': float(row[3]) if row[3] else None,
                'notas': row[4],
                'especie_nombre': row[5],
                'especie_cientifica': row[6],
                'email_usuario': row[7]
            })
        
        conn.close()
        return jsonify({'success': True, 'avistamientos': avistamientos})
        
    except Exception as e:
        print(f"Error en get_avistamientos: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Endpoints adicionales para el portal de colaboradores

@app.route('/api/eventos', methods=['GET'])
def get_eventos():
    """Obtener eventos para el calendario"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Obtener parámetros de consulta
        tipo_evento = request.args.get('tipo', '')
        modalidad = request.args.get('modalidad', '')
        fecha_inicio = request.args.get('fecha_inicio', '')
        fecha_fin = request.args.get('fecha_fin', '')
        
        # Construir consulta SQL
        query = """
            SELECT 
                e.id,
                e.titulo,
                e.descripcion,
                e.fecha_evento,
                e.hora_inicio,
                e.hora_fin,
                e.url_evento,
                e.capacidad_maxima,
                e.costo,
                te.nombre as tipo_evento,
                m.nombre as modalidad,
                CONCAT(u.nombre, ' ', u.apellido_paterno, ISNULL(' ' + u.apellido_materno, '')) as organizador,
                est.nombre as estatus,
                ca.nombre as direccion_calle,
                ca.n_exterior as numero_exterior,
                col.nombre as colonia,
                mun.nombre as municipio,
                edo.nombre as estado
            FROM Eventos e
            LEFT JOIN TiposEvento te ON e.id_tipo_evento = te.id
            LEFT JOIN Modalidades m ON e.id_modalidad = m.id
            LEFT JOIN Organizadores org ON e.id_organizador = org.id
            LEFT JOIN Usuarios u ON org.id_usuario = u.id
            LEFT JOIN Estatus est ON e.id_estatus = est.id
            LEFT JOIN Direcciones d ON e.id_direccion = d.id
            LEFT JOIN Calles ca ON d.id_calle = ca.id
            LEFT JOIN Colonias col ON ca.id_colonia = col.id
            LEFT JOIN Municipios mun ON col.id_municipio = mun.id
            LEFT JOIN Estados edo ON mun.id_estado = edo.id
            WHERE est.nombre = 'Activo'
        """
        
        params = []
        
        # Aplicar filtros
        if tipo_evento:
            query += " AND te.nombre = ?"
            params.append(tipo_evento)
        
        if modalidad:
            query += " AND m.nombre = ?"
            params.append(modalidad)
        
        if fecha_inicio:
            query += " AND e.fecha_evento >= ?"
            params.append(fecha_inicio)
        
        if fecha_fin:
            query += " AND e.fecha_evento <= ?"
            params.append(fecha_fin)
        
        query += " ORDER BY e.fecha_evento ASC, e.hora_inicio ASC"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        eventos = []
        for row in rows:
            # Construir dirección completa
            direccion_completa = ""
            if row[13]:  # direccion_calle
                direccion_completa = f"{row[13]}"
                if row[14]:  # numero_exterior
                    direccion_completa += f" {row[14]}"
                if row[15]:  # colonia
                    direccion_completa += f", {row[15]}"
                if row[16]:  # municipio
                    direccion_completa += f", {row[16]}"
                if row[17]:  # estado
                    direccion_completa += f", {row[17]}"
            
            evento = {
                'id': row[0],
                'title': row[1],  # Para compatibilidad con FullCalendar
                'titulo': row[1],
                'descripcion': row[2],
                'start': row[3].isoformat() if row[3] else None,  # Para FullCalendar
                'fecha_evento': row[3].isoformat() if row[3] else None,
                'hora_inicio': str(row[4]) if row[4] else None,
                'hora_fin': str(row[5]) if row[5] else None,
                'url_evento': row[6],
                'capacidad_maxima': row[7],
                'costo': float(row[8]) if row[8] else 0.0,
                'tipo_evento': row[9],
                'modalidad': row[10],
                'organizador': row[11],
                'estatus': row[12],
                'direccion': direccion_completa,
                'es_gratuito': float(row[8]) == 0.0 if row[8] else True
            }
            eventos.append(evento)
        
        conn.close()
        return jsonify({'success': True, 'eventos': eventos})
        
    except Exception as e:
        print(f"Error en get_eventos: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/tipos-evento', methods=['GET'])
def get_tipos_evento():
    """Obtener tipos de evento para filtros"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre, descripcion FROM TiposEvento ORDER BY nombre")
        rows = cursor.fetchall()
        
        tipos = []
        for row in rows:
            tipos.append({
                'id': row[0],
                'nombre': row[1],
                'descripcion': row[2]
            })
        
        conn.close()
        return jsonify({'success': True, 'tipos': tipos})
        
    except Exception as e:
        print(f"Error en get_tipos_evento: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/modalidades', methods=['GET'])
def get_modalidades():
    """Obtener modalidades de evento para filtros"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT id, nombre FROM Modalidades ORDER BY nombre")
        rows = cursor.fetchall()
        
        modalidades = []
        for row in rows:
            modalidades.append({
                'id': row[0],
                'nombre': row[1]
            })
        
        conn.close()
        return jsonify({'success': True, 'modalidades': modalidades})
        
    except Exception as e:
        print(f"Error en get_modalidades: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ========================================
# INTEGRACIÓN DE RUTAS ORM
# ========================================
try:
    from routes_orm import register_all_orm_routes
    register_all_orm_routes(app)
    print("✅ Sistema ORM SQLAlchemy integrado correctamente")
except ImportError as e:
    print(f"⚠️ No se pudo cargar routes_orm: {e}")
    print("ℹ️ Continuando con rutas pyodbc existentes")

if __name__ == '__main__':
    print("🌊 Iniciando servidor SWAY...")
    print("📊 Base de datos: SQL Server")
    print("🔧 ORM: SQLAlchemy + pyodbc (híbrido)")
    print("🚀 Servidor corriendo en http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)