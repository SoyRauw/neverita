import { db } from './src/db.js';

async function migrate() {
    try {
        console.log('Verificando columnas en tabla inventory...');
        
        // Revisar si existe is_frozen
        const [frozenCols] = await db.query(`SHOW COLUMNS FROM inventory LIKE 'is_frozen'`);
        if (frozenCols.length === 0) {
            console.log('Agregando columna is_frozen...');
            await db.query(`ALTER TABLE inventory ADD COLUMN is_frozen TINYINT(1) NOT NULL DEFAULT 0`);
        } else {
            console.log('Columna is_frozen ya existe.');
        }

        // Revisar si existe frozen_at
        const [frozenAtCols] = await db.query(`SHOW COLUMNS FROM inventory LIKE 'frozen_at'`);
        if (frozenAtCols.length === 0) {
            console.log('Agregando columna frozen_at...');
            await db.query(`ALTER TABLE inventory ADD COLUMN frozen_at DATETIME NULL DEFAULT NULL`);
        } else {
            console.log('Columna frozen_at ya existe.');
        }

        console.log('Migración completada exitosamente.');
    } catch (err) {
        console.error('Error ejecutando migración:', err);
    } finally {
        process.exit(0);
    }
}

migrate();
