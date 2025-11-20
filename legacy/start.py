#!/usr/bin/env python3
"""
Script para ejecutar la aplicación SWAY
"""

import os
import sys
import subprocess

def check_python_version():
    """Verificar que la versión de Python sea compatible"""
    if sys.version_info < (3, 8):
        print("ERROR: Se requiere Python 3.8 o superior")
        print(f"Versión actual: {sys.version}")
        sys.exit(1)

def install_dependencies():
    """Instalar dependencias si no están instaladas"""
    try:
        import flask
        print("✓ Flask ya está instalado")
    except ImportError:
        print("Instalando dependencias...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Dependencias instaladas")

def create_directories():
    """Crear directorios necesarios"""
    directories = ['uploads', 'templates', 'static']
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"✓ Directorio '{directory}' creado")

def run_app():
    """Ejecutar la aplicación Flask"""
    print("\n" + "="*50)
    print("    SWAY - Sistema Web de Conservación Marina")
    print("="*50)
    print("\nIniciando servidor...")
    print("URL: http://localhost:5000")
    print("Presiona Ctrl+C para detener el servidor\n")
    
    try:
        # Importar y ejecutar la aplicación
        from app import app
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n\nServidor detenido por el usuario")
    except Exception as e:
        print(f"\nError al ejecutar la aplicación: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_python_version()
    install_dependencies()
    create_directories()
    run_app()
