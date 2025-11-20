-- Script para limpiar duplicados en TiposEvento y Modalidades
-- EJECUTAR PASO A PASO para mayor seguridad
-- =========================================
-- PASO 1: VERIFICAR DUPLICADOS EXISTENTES
-- =========================================
-- Ver duplicados en TiposEvento
SELECT 'DUPLICADOS EN TiposEvento' as Tabla;
SELECT nombre,
    COUNT(*) as cantidad,
    STRING_AGG(CAST(id AS VARCHAR), ', ') as ids_duplicados
FROM TiposEvento
GROUP BY nombre
HAVING COUNT(*) > 1
ORDER BY nombre;
-- Ver duplicados en Modalidades
SELECT 'DUPLICADOS EN Modalidades' as Tabla;
SELECT nombre,
    COUNT(*) as cantidad,
    STRING_AGG(CAST(id AS VARCHAR), ', ') as ids_duplicados
FROM Modalidades
GROUP BY nombre
HAVING COUNT(*) > 1
ORDER BY nombre;
-- =========================================
-- PASO 2: ELIMINAR DUPLICADOS DE TiposEvento
-- =========================================
-- Eliminar duplicados manteniendo el registro con menor ID
WITH TiposEvento_Duplicados AS (
    SELECT id,
        nombre,
        descripcion,
        ROW_NUMBER() OVER (
            PARTITION BY nombre
            ORDER BY id ASC
        ) as rn
    FROM TiposEvento
)
DELETE FROM TiposEvento
WHERE id IN (
        SELECT id
        FROM TiposEvento_Duplicados
        WHERE rn > 1
    );
-- =========================================
-- PASO 3: ELIMINAR DUPLICADOS DE Modalidades
-- =========================================
-- Eliminar duplicados manteniendo el registro con menor ID
WITH Modalidades_Duplicados AS (
    SELECT id,
        nombre,
        ROW_NUMBER() OVER (
            PARTITION BY nombre
            ORDER BY id ASC
        ) as rn
    FROM Modalidades
)
DELETE FROM Modalidades
WHERE id IN (
        SELECT id
        FROM Modalidades_Duplicados
        WHERE rn > 1
    );
-- =========================================
-- PASO 4: VERIFICAR QUE NO QUEDAN DUPLICADOS
-- =========================================
-- Verificar TiposEvento
SELECT 'VERIFICACIÓN TiposEvento - Después de limpieza' as Estado;
SELECT nombre,
    COUNT(*) as cantidad
FROM TiposEvento
GROUP BY nombre
ORDER BY nombre;
-- Verificar Modalidades
SELECT 'VERIFICACIÓN Modalidades - Después de limpieza' as Estado;
SELECT nombre,
    COUNT(*) as cantidad
FROM Modalidades
GROUP BY nombre
ORDER BY nombre;
-- =========================================
-- PASO 5: CONTAR REGISTROS TOTALES
-- =========================================
SELECT 'CONTEO FINAL' as Resumen;
SELECT (
        SELECT COUNT(*)
        FROM TiposEvento
    ) as Total_TiposEvento,
    (
        SELECT COUNT(*)
        FROM Modalidades
    ) as Total_Modalidades;