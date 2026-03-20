import pyodbc
import os


def construir_nombre_completo(nombre, apellido_paterno, apellido_materno, prefijo=""):
    if not nombre:
        return "Usuario"
    if apellido_paterno and apellido_paterno in nombre:
        return f"{prefijo}{nombre}".strip()
    else:
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
        database = 'sway'
        username = 'EmilianoLedesma'
        password = 'Emiliano1'
        connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
        connection = pyodbc.connect(connection_string)
        return connection
    except Exception as e:
        print(f"Error de conexión: {e}")
        return None


def get_engine():
    from sqlalchemy import create_engine
    server = 'DESKTOP-VAT773J'
    database = 'sway'
    username = 'EmilianoLedesma'
    password = 'Emiliano1'
    connection_string = f'mssql+pyodbc://{username}:{password}@{server}/{database}?driver=ODBC+Driver+17+for+SQL+Server'
    return create_engine(connection_string, echo=False)


def get_session():
    from sqlalchemy.orm import sessionmaker
    engine = get_engine()
    Session = sessionmaker(bind=engine)
    return Session()
