import { db } from './src/db.js';

async function migrate() {
    try {
        console.log('Creating shopping_list table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS shopping_list (
                item_id       INT AUTO_INCREMENT PRIMARY KEY,
                family_id     INT NOT NULL,
                name          VARCHAR(255) NOT NULL,
                quantity      DECIMAL(10,2) DEFAULT 1,
                unit          VARCHAR(50)   DEFAULT 'unidad',
                checked       TINYINT(1)    DEFAULT 0,
                source        ENUM('manual','ai') DEFAULT 'manual',
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_family (family_id)
            )
        `);
        console.log('Migration successful!');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        process.exit(0);
    }
}

migrate();
