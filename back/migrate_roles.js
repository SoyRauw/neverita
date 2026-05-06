import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.TIDB_HOST,
        port: Number(process.env.TIDB_PORT),
        user: process.env.TIDB_USER,
        password: process.env.TIDB_PASSWORD,
        database: process.env.TIDB_DATABASE,
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    });

    try {
        // 1. Agregar columna role
        console.log('1️⃣ Agregando columna role a user_family...');
        await connection.query(`
            ALTER TABLE user_family 
            ADD COLUMN role ENUM('creador', 'chef', 'ayudante') NOT NULL DEFAULT 'ayudante'
        `);
        console.log('   ✅ Columna agregada');

        // 2. Marcar creadores existentes
        console.log('2️⃣ Marcando creadores existentes...');
        const [result] = await connection.query(`
            UPDATE user_family uf
            JOIN families f ON uf.family_id = f.family_id AND uf.user_id = f.created_by
            SET uf.role = 'creador'
        `);
        console.log(`   ✅ ${result.affectedRows} creador(es) marcados`);

        // 3. Verificar
        const [rows] = await connection.query('SELECT * FROM user_family');
        console.log('3️⃣ Estado actual de user_family:');
        rows.forEach(r => console.log(`   user_id=${r.user_id}, family_id=${r.family_id}, role=${r.role}`));

        console.log('\n🎉 Migración completada exitosamente!');
    } catch (err) {
        if (err.message.includes('Duplicate column')) {
            console.log('⚠️ La columna role ya existe. Saltando...');
        } else {
            console.error('❌ Error:', err.message);
        }
    } finally {
        await connection.end();
    }
}

migrate();
