from flask import Blueprint, request, jsonify, session
from db import get_db_connection, construir_nombre_completo

productos_bp = Blueprint('productos', __name__)


@productos_bp.route('/api/productos')
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


@productos_bp.route('/api/producto/<int:producto_id>')
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


@productos_bp.route('/api/reseñas/<int:producto_id>')
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


@productos_bp.route('/api/materiales')
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


@productos_bp.route('/api/categorias')
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
