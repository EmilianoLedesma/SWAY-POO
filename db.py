import pyodbc
import os


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
