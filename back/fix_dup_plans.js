import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function fix() {
    const c = await mysql.createConnection({
        host: process.env.TIDB_HOST, port: Number(process.env.TIDB_PORT),
        user: process.env.TIDB_USER, password: process.env.TIDB_PASSWORD,
        database: process.env.TIDB_DATABASE,
        ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    });

    // Encontrar familias con planes duplicados para la semana actual
    const [dups] = await c.query(`
        SELECT family_id, COUNT(*) as cnt, 
               GROUP_CONCAT(menu_plan_id ORDER BY menu_plan_id ASC) as ids
        FROM menu_plans 
        WHERE start_date >= '2026-05-04'
        GROUP BY family_id 
        HAVING cnt > 1
    `);

    console.log('Familias con planes duplicados:', dups.length);

    for (const dup of dups) {
        const ids = dup.ids.split(',');
        const keep = ids[0]; // Mantener el más viejo (el original)
        const remove = ids.slice(1);
        console.log(`\nFamily ${dup.family_id}: keep=${keep}, remove=[${remove}]`);

        for (const rid of remove) {
            // Mover meals huérfanos al plan principal
            const [moved] = await c.query(
                'UPDATE daily_meals SET menu_plan_id = ? WHERE menu_plan_id = ?',
                [keep, rid]
            );
            console.log(`  Plan ${rid}: ${moved.affectedRows} meals migrados`);
            
            // Eliminar plan duplicado
            await c.query('DELETE FROM menu_plans WHERE menu_plan_id = ?', [rid]);
            console.log(`  Plan ${rid} eliminado`);
        }
    }

    console.log('\n✅ Limpieza completada');
    await c.end();
}

fix().catch(console.error);
