import { db } from './src/db.js';

async function migrate() {
    try {
        console.log('Agregando "porción" al ENUM de unit en ingredients...');
        await db.query(
            `ALTER TABLE ingredients MODIFY COLUMN unit ENUM('g','kg','ml','l','unidad','porcion') DEFAULT 'unidad'`
        );
        console.log('✅ Listo!');
    } catch (e) {
        console.error('❌', e.message);
    } finally {
        process.exit(0);
    }
}
migrate();
