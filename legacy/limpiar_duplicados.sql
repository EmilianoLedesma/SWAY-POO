-- =============================================
-- SCRIPT PARA LIMPIAR DATOS DUPLICADOS
-- =============================================
-- Limpiar duplicados en Estados
DELETE FROM Estados
WHERE id NOT IN (
        SELECT MIN(id)
        FROM Estados
        GROUP BY nombre
    );
-- Limpiar duplicados en Municipios
DELETE FROM Municipios
WHERE id NOT IN (
        SELECT MIN(id)
        FROM Municipios
        GROUP BY nombre,
            id_estado
    );
-- Limpiar duplicados en Colonias
DELETE FROM Colonias
WHERE id NOT IN (
        SELECT MIN(id)
        FROM Colonias
        GROUP BY nombre,
            id_municipio
    );
-- Limpiar duplicados en Calles
DELETE FROM Calles
WHERE id NOT IN (
        SELECT MIN(id)
        FROM Calles
        GROUP BY nombre,
            id_colonia
    );
-- Limpiar duplicados en Estatus
DELETE FROM Estatus
WHERE id NOT IN (
        SELECT MIN(id)
        FROM Estatus
        GROUP BY nombre
    );
-- Limpiar duplicados en TiposTarjeta
DELETE FROM TiposTarjeta
WHERE id NOT IN (
        SELECT MIN(id)
        FROM TiposTarjeta
        GROUP BY nombre
    );
-- Limpiar duplicados en CategoriasProducto
DELETE FROM CategoriasProducto
WHERE id NOT IN (
        SELECT MIN(id)
        FROM CategoriasProducto
        GROUP BY nombre
    );
-- Limpiar duplicados en Materiales
DELETE FROM Materiales
WHERE id NOT IN (
        SELECT MIN(id)
        FROM Materiales
        GROUP BY nombre
    );
-- Verificar que no haya datos duplicados
SELECT 'Estados duplicados:' as tabla,
    COUNT(*) - COUNT(DISTINCT nombre) as duplicados
FROM Estados
UNION ALL
SELECT 'Municipios duplicados:',
    COUNT(*) - COUNT(DISTINCT CONCAT(nombre, '-', id_estado))
FROM Municipios
UNION ALL
SELECT 'Colonias duplicadas:',
    COUNT(*) - COUNT(DISTINCT CONCAT(nombre, '-', id_municipio))
FROM Colonias
UNION ALL
SELECT 'Calles duplicadas:',
    COUNT(*) - COUNT(DISTINCT CONCAT(nombre, '-', id_colonia))
FROM Calles
UNION ALL
SELECT 'Estatus duplicados:',
    COUNT(*) - COUNT(DISTINCT nombre)
FROM Estatus
UNION ALL
SELECT 'Tipos tarjeta duplicados:',
    COUNT(*) - COUNT(DISTINCT nombre)
FROM TiposTarjeta;