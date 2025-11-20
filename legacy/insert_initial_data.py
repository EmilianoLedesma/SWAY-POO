import pyodbc
from datetime import datetime, date

def get_db_connection():
    try:
        server = 'DESKTOP-VAT773J'
        database = 'PruebaConexion'
        username = 'EmilianoLedesma'
        password = 'Emiliano1'
        
        connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password}'
        connection = pyodbc.connect(connection_string)
        return connection
    except Exception as e:
        print(f"Error de conexión: {e}")
        return None

def insert_initial_data():
    conn = get_db_connection()
    if not conn:
        print("No se pudo conectar a la base de datos")
        return
    
    cursor = conn.cursor()
    
    try:
        # Insertar Estados de Conservación
        estados_conservacion = [
            ('Extinción Crítica', 'Especie en peligro crítico de extinción'),
            ('En Peligro', 'Especie en peligro de extinción'),
            ('Vulnerable', 'Especie vulnerable a la extinción'),
            ('Casi Amenazada', 'Especie casi amenazada'),
            ('Preocupación Menor', 'Especie de preocupación menor')
        ]
        
        for nombre, desc in estados_conservacion:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM EstadosConservacion WHERE nombre = ?)
                INSERT INTO EstadosConservacion (nombre, descripcion) VALUES (?, ?)
            """, (nombre, nombre, desc))
        
        # Insertar Hábitats
        habitats = [
            ('Arrecifes de Coral', 'Ecosistemas marinos con alta biodiversidad'),
            ('Aguas Profundas', 'Zonas oceánicas de gran profundidad'),
            ('Aguas Abiertas', 'Zonas pelágicas del océano'),
            ('Zona Costera', 'Áreas cercanas a la costa'),
            ('Aguas Polares', 'Regiones oceánicas polares'),
            ('Manglares', 'Ecosistemas de manglar'),
            ('Estuarios', 'Zonas donde se encuentran ríos y mar')
        ]
        
        for nombre, desc in habitats:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Habitats WHERE nombre = ?)
                INSERT INTO Habitats (nombre, descripcion) VALUES (?, ?)
            """, (nombre, nombre, desc))
        
        # Insertar Amenazas
        amenazas = [
            ('Cambio Climático', 'Alteración del clima global'),
            ('Contaminación Plástica', 'Contaminación por desechos plásticos'),
            ('Sobrepesca', 'Pesca excesiva de especies marinas'),
            ('Pérdida de Hábitat', 'Destrucción de ecosistemas naturales'),
            ('Contaminación Química', 'Contaminación por sustancias químicas'),
            ('Ruido Oceánico', 'Contaminación acústica marina'),
            ('Acidificación', 'Acidificación de los océanos')
        ]
        
        for nombre, desc in amenazas:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Amenazas WHERE nombre = ?)
                INSERT INTO Amenazas (nombre, descripcion) VALUES (?, ?)
            """, (nombre, nombre, desc))
        
        # Insertar Especies
        especies = [
            ('Tortuga Marina Verde', 'Chelonia mydas', 'La tortuga verde es una de las especies de tortugas marinas más grandes. Su nombre proviene del color verdoso de su grasa.', 80, 85000, 3, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400'),
            ('Ballena Azul', 'Balaenoptera musculus', 'La ballena azul es el animal más grande que ha existido en la Tierra. Pueden pesar hasta 200 toneladas.', 90, 15000, 2, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'),
            ('Coral Cuerno de Alce', 'Acropora palmata', 'Este coral formador de arrecifes era abundante en el Caribe, pero ha sufrido un declive del 97%.', 100, 1000, 1, 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400'),
            ('Delfín Mular', 'Tursiops truncatus', 'Los delfines mulares son conocidos por su inteligencia y sociabilidad.', 50, 600000, 3, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400'),
            ('Tiburón Blanco', 'Carcharodon carcharias', 'El gran tiburón blanco es uno de los depredadores más temidos del océano.', 70, 3500, 3, 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400'),
            ('Manatí del Caribe', 'Trichechus manatus', 'Los manatíes son mamíferos acuáticos herbívoros que habitan en aguas cálidas.', 60, 13000, 3, 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400')
        ]
        
        for nombre, cientifico, desc, vida, poblacion, estado, imagen in especies:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Especies WHERE nombre_cientifico = ?)
                INSERT INTO Especies (nombre_comun, nombre_cientifico, descripcion, esperanza_vida, poblacion_estimada, id_estado_conservacion, imagen_url) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (cientifico, nombre, cientifico, desc, vida, poblacion, estado, imagen))
        
        # Insertar Tipos de Evento
        tipos_evento = [
            ('Conferencia', 'Evento educativo con presentaciones'),
            ('Taller', 'Evento práctico y participativo'),
            ('Limpieza de Playa', 'Actividad de conservación marina'),
            ('Excursión Marina', 'Viaje educativo al mar'),
            ('Webinar', 'Evento virtual online'),
            ('Exposición', 'Muestra educativa')
        ]
        
        for nombre, desc in tipos_evento:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM TiposEvento WHERE nombre = ?)
                INSERT INTO TiposEvento (nombre, descripcion) VALUES (?, ?)
            """, (nombre, nombre, desc))
        
        # Insertar Modalidades
        modalidades = [
            'Presencial',
            'Virtual',
            'Híbrido'
        ]
        
        for modalidad in modalidades:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Modalidades WHERE nombre = ?)
                INSERT INTO Modalidades (nombre) VALUES (?)
            """, (modalidad, modalidad))
        
        # Insertar Estatus
        estatus = [
            'Programado',
            'En Curso',
            'Finalizado',
            'Cancelado',
            'Pendiente',
            'Activo',
            'Inactivo'
        ]
        
        for est in estatus:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Estatus WHERE nombre = ?)
                INSERT INTO Estatus (nombre) VALUES (?)
            """, (est, est))
        
        # Insertar Tipos de Donación
        tipos_donacion = [
            'Única',
            'Mensual',
            'Anual'
        ]
        
        for tipo in tipos_donacion:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM TipoDonaciones WHERE nombre = ?)
                INSERT INTO TipoDonaciones (nombre) VALUES (?)
            """, (tipo, tipo))
        
        # Insertar Tipos de Tarjeta
        tipos_tarjeta = [
            'Visa',
            'Mastercard',
            'American Express',
            'Discover'
        ]
        
        for tipo in tipos_tarjeta:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM TiposTarjeta WHERE nombre = ?)
                INSERT INTO TiposTarjeta (nombre) VALUES (?)
            """, (tipo, tipo))
        
        # Insertar Categorías de Producto
        categorias = [
            ('Ropa Sostenible', 'Prendas fabricadas con materiales eco-amigables'),
            ('Accesorios Marinos', 'Accesorios inspirados en el océano'),
            ('Artículos Educativos', 'Materiales educativos sobre conservación'),
            ('Decoración', 'Artículos decorativos con temática marina'),
            ('Libros', 'Libros sobre conservación marina')
        ]
        
        for nombre, desc in categorias:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM CategoriasProducto WHERE nombre = ?)
                INSERT INTO CategoriasProducto (nombre, descripcion) VALUES (?, ?)
            """, (nombre, nombre, desc))
        
        # Insertar Tipos de Recurso
        tipos_recurso = [
            ('Documento', 'Documentos en formato PDF o similar'),
            ('Video', 'Contenido audiovisual'),
            ('Infografía', 'Gráficos informativos'),
            ('Presentación', 'Presentaciones educativas'),
            ('Guía', 'Guías prácticas'),
            ('Investigación', 'Documentos de investigación científica')
        ]
        
        for nombre, desc in tipos_recurso:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM TiposRecurso WHERE nombre = ?)
                INSERT INTO TiposRecurso (nombre, descripcion) VALUES (?, ?)
            """, (nombre, nombre, desc))
        
        # Insertar Idiomas
        idiomas = [
            'Español',
            'Inglés',
            'Francés',
            'Portugués'
        ]
        
        for idioma in idiomas:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Idiomas WHERE nombre = ?)
                INSERT INTO Idiomas (nombre) VALUES (?)
            """, (idioma, idioma))
        
        # Insertar Especialidades
        especialidades = [
            'Biología Marina',
            'Oceanografía',
            'Conservación',
            'Ecología',
            'Investigación',
            'Educación Ambiental'
        ]
        
        for especialidad in especialidades:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Especialidades WHERE nombre = ?)
                INSERT INTO Especialidades (nombre) VALUES (?)
            """, (especialidad, especialidad))
        
        # Insertar Instituciones
        instituciones = [
            'Universidad Nacional',
            'Instituto Marino',
            'Centro de Investigación Oceánica',
            'Fundación Ambiental',
            'Organización Independiente'
        ]
        
        for institucion in instituciones:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Instituciones WHERE nombre = ?)
                INSERT INTO Instituciones (nombre) VALUES (?)
            """, (institucion, institucion))
        
        # Insertar Organizaciones
        organizaciones = [
            'SWAY',
            'Greenpeace',
            'WWF',
            'Ocean Conservancy',
            'Sea Shepherd'
        ]
        
        for org in organizaciones:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Organizaciones WHERE nombre = ?)
                INSERT INTO Organizaciones (nombre) VALUES (?)
            """, (org, org))
        
        # Insertar Cargos
        cargos = [
            'Coordinador',
            'Director',
            'Especialista',
            'Voluntario',
            'Investigador'
        ]
        
        for cargo in cargos:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Cargos WHERE nombre = ?)
                INSERT INTO Cargos (nombre) VALUES (?)
            """, (cargo, cargo))
        
        # Insertar Materiales
        materiales = [
            'Algodón Orgánico',
            'Materiales Reciclados',
            'Bambú',
            'Papel Reciclado',
            'Plástico Reciclado'
        ]
        
        for material in materiales:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Materiales WHERE nombre = ?)
                INSERT INTO Materiales (nombre) VALUES (?)
            """, (material, material))
        
        # Insertar Estados
        estados = [
            'Querétaro',
            'Ciudad de México',
            'Jalisco',
            'Nuevo León',
            'Veracruz'
        ]
        
        for estado in estados:
            cursor.execute("""
                IF NOT EXISTS (SELECT 1 FROM Estados WHERE nombre = ?)
                INSERT INTO Estados (nombre) VALUES (?)
            """, (estado, estado))
        
        conn.commit()
        print("✅ Datos iniciales insertados correctamente")
        
    except Exception as e:
        print(f"❌ Error al insertar datos: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    insert_initial_data()
