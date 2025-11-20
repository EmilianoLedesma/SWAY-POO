import pyodbc
from werkzeug.security import generate_password_hash

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

def create_test_user():
    conn = get_db_connection()
    if not conn:
        print("No se pudo conectar a la base de datos")
        return
    
    cursor = conn.cursor()
    
    # Crear usuario de prueba
    email = "admin@sway.com"
    password = "admin123"
    password_hash = generate_password_hash(password)
    
    try:
        cursor.execute("""
            INSERT INTO Usuarios (nombre, email, password_hash, telefono, activo, fecha_registro)
            VALUES (?, ?, ?, ?, ?, ?)
        """, ("Admin", email, password_hash, "1234567890", 1, "2024-01-01"))
        
        conn.commit()
        print(f"Usuario creado exitosamente:")
        print(f"Email: {email}")
        print(f"Password: {password}")
        print(f"Password hash: {password_hash}")
        
    except Exception as e:
        print(f"Error al crear usuario: {e}")
        # Verificar si ya existe
        cursor.execute("SELECT id, nombre, email, password_hash FROM Usuarios WHERE email = ?", (email,))
        user = cursor.fetchone()
        if user:
            print(f"El usuario ya existe:")
            print(f"ID: {user.id}")
            print(f"Nombre: {user.nombre}")
            print(f"Email: {user.email}")
            print(f"Password hash: {user.password_hash}")
    
    conn.close()

if __name__ == "__main__":
    create_test_user()
