"""
Script para remover atributos 'required' de todos los templates HTML
y agregar asteriscos (*) a las etiquetas de campos obligatorios
"""

import os
import re

def remove_required_from_html(file_path):
    """Remover atributo required de un archivo HTML"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Contador de cambios
    changes = 0
    original_content = content
    
    # Remover atributo 'required' (solo, con espacios, o con saltos de línea)
    patterns = [
        r'\s+required\s*',
        r'\s+required=""',
        r'\s+required\n',
        r'\n\s*required\s*',
        r'\n\s*required\n',
    ]
    
    for pattern in patterns:
        before = content
        content = re.sub(pattern, '\n                ', content)
        if content != before:
            changes += 1
    
    # Agregar asterisco (*) a labels de campos con required eliminado
    # Buscar labels que no tengan asterisco
    content = re.sub(
        r'(<label[^>]*>)([^<*]+)(</label>)',
        lambda m: m.group(1) + m.group(2) + ' *' + m.group(3) if '*' not in m.group(2) and 'required' in original_content else m.group(0),
        content
    )
    
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def process_all_templates():
    """Procesar todos los templates HTML"""
    templates_dir = r'c:\Users\Emiliano\Videos\SWAY POO\templates'
    
    processed = 0
    skipped = 0
    
    for filename in os.listdir(templates_dir):
        if filename.endswith('.html'):
            file_path = os.path.join(templates_dir, filename)
            
            # Saltar archivos ya procesados
            if filename in ['login.html', 'register.html', '404.html', '500.html']:
                print(f"⏭️  Saltando {filename} (ya procesado o no requiere cambios)")
                skipped += 1
                continue
            
            print(f"📝 Procesando {filename}...")
            
            if remove_required_from_html(file_path):
                print(f"✅ {filename} - Atributos 'required' removidos")
                processed += 1
            else:
                print(f"ℹ️  {filename} - Sin cambios necesarios")
                skipped += 1
    
    print(f"\n{'='*50}")
    print(f"✅ Archivos procesados: {processed}")
    print(f"⏭️  Archivos saltados: {skipped}")
    print(f"{'='*50}")

if __name__ == '__main__':
    print("🚀 Iniciando remoción de atributos 'required'...\n")
    process_all_templates()
    print("\n✨ Proceso completado!")
