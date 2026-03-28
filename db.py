import psycopg
import os
from dotenv import load_dotenv

load_dotenv()


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


def get_db_connection():
    try:
        conn = psycopg.connect(
            host=os.environ.get('DB_HOST', 'localhost'),
            port=os.environ.get('DB_PORT', '5433'),
            dbname=os.environ.get('DB_NAME', 'sway'),
            user=os.environ.get('DB_USER', 'sway_app'),
            password=os.environ.get('DB_PASSWORD', '')
        )
        return conn
    except Exception as e:
        print(f"Error de conexion: {e}")
        return None
