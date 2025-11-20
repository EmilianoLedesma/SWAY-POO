import pyodbc
from werkzeug.security import generate_password_hash, check_password_hash

# Función para conectar a la base de datos
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

def main():
    conn = get_db_connection()
    if not conn:
        print("No se pudo conectar a la base de datos")
        return
    
    cursor = conn.cursor()
    
    # Verificar si hay usuarios
    cursor.execute("SELECT id, nombre, email, password_hash, activo FROM Usuarios")
    users = cursor.fetchall()
    
    print(f"Usuarios encontrados: {len(users)}")
    
    for user in users:
        print(f"ID: {user.id}, Nombre: {user.nombre}, Email: {user.email}")
        print(f"Password hash: {user.password_hash}")
        print(f"Activo: {user.activo}")
        print("-" * 50)
    
    # Si no hay usuarios, crear uno de prueba
    if len(users) == 0:
        print("No hay usuarios. Creando usuario de prueba...")
        
        # Crear usuario de prueba
        email = "admin@sway.com"
        password = "123456"
        nombre = "Admin"
        telefono = "1234567890"
        
        password_hash = generate_password_hash(password)
        
        cursor.execute("""
            INSERT INTO Usuarios (nombre, email, password_hash, telefono, activo, fecha_registro)
            VALUES (?, ?, ?, ?, 1, GETDATE())
        """, (nombre, email, password_hash, telefono))
        
        conn.commit()
        print(f"Usuario creado: {email} / {password}")
    
    conn.close()

if __name__ == "__main__":
    main()
