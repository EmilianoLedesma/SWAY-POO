"""
Script de prueba para verificar la funcionalidad de la tienda SWAY
"""

import requests
import json
import time

# Configuración
BASE_URL = "http://localhost:5000"

def test_endpoint(endpoint, description):
    """Prueba un endpoint específico"""
    print(f"\n🔍 Probando: {description}")
    print(f"   URL: {BASE_URL}{endpoint}")
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}")
        
        if response.status_code == 200:
            print(f"   ✅ Status: {response.status_code}")
            
            if 'application/json' in response.headers.get('content-type', ''):
                data = response.json()
                print(f"   📄 Datos recibidos: {len(str(data))} caracteres")
                
                # Mostrar estructura básica de los datos
                if isinstance(data, dict):
                    print(f"   🔑 Claves principales: {list(data.keys())}")
                    
                    # Casos específicos
                    if 'productos' in data:
                        print(f"   📦 Productos encontrados: {len(data['productos'])}")
                    elif 'categorias' in data:
                        print(f"   📂 Categorías encontradas: {len(data['categorias'])}")
                    elif 'materiales' in data:
                        print(f"   🔧 Materiales encontrados: {len(data['materiales'])}")
                    elif 'producto' in data:
                        print(f"   📦 Producto: {data['producto']['nombre']}")
                        print(f"   💰 Precio: ${data['producto']['precio']}")
                    elif 'reseñas' in data:
                        print(f"   ⭐ Reseñas encontradas: {len(data['reseñas'])}")
                    elif 'impacto' in data:
                        print(f"   🌍 Métricas de impacto: {list(data['impacto'].keys())}")
                        
            else:
                print(f"   📝 Respuesta HTML/texto: {len(response.text)} caracteres")
                
        else:
            print(f"   ❌ Status: {response.status_code}")
            print(f"   📝 Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Error de conexión - ¿Está ejecutándose el servidor Flask?")
    except Exception as e:
        print(f"   ❌ Error inesperado: {str(e)}")

def main():
    """Función principal de pruebas"""
    print("🚀 Iniciando pruebas de la tienda SWAY...")
    print("=" * 50)
    
    # Pruebas de endpoints
    endpoints = [
        ("/", "Página principal"),
        ("/tienda", "Página de tienda"),
        ("/api/categorias", "Categorías de productos"),
        ("/api/productos", "Lista de productos"),
        ("/api/productos?categoria_id=1", "Productos por categoría"),
        ("/api/productos?busqueda=tortuga", "Búsqueda de productos"),
        ("/api/producto/1", "Detalle de producto específico"),
        ("/api/reseñas/1", "Reseñas de producto"),
        ("/api/materiales", "Lista de materiales"),
        ("/api/impacto-sostenible", "Métricas de impacto sostenible"),
    ]
    
    successful_tests = 0
    total_tests = len(endpoints)
    
    for endpoint, description in endpoints:
        test_endpoint(endpoint, description)
        time.sleep(0.5)  # Pausa pequeña entre pruebas
        successful_tests += 1
    
    print("\n" + "=" * 50)
    print(f"🎯 Pruebas completadas: {successful_tests}/{total_tests}")
    print("\n📋 Resumen:")
    print("   - Si ves errores de conexión, asegúrate de que Flask esté ejecutándose")
    print("   - Si ves errores 500, revisa la conexión a la base de datos")
    print("   - Si ves errores 404, verifica que las rutas estén bien definidas")
    
    print("\n🔧 Para ejecutar el servidor Flask:")
    print("   python app.py")
    print("   o")
    print("   python start.py")
    
    print("\n🌐 Para probar la tienda en el navegador:")
    print("   http://localhost:5000/tienda")

if __name__ == "__main__":
    main()
