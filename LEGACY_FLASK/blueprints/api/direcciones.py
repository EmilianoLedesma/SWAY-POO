from flask import Blueprint, request, jsonify, session
from db import get_db_connection, construir_nombre_completo

direcciones_bp = Blueprint('direcciones', __name__)


@direcciones_bp.route('/api/direcciones/estados')
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


@direcciones_bp.route('/api/direcciones/municipios/<int:estado_id>')
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


@direcciones_bp.route('/api/direcciones/colonias/<int:municipio_id>')
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


@direcciones_bp.route('/api/direcciones/calles/<int:colonia_id>')
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
