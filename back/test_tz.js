import mysql from 'mysql2/promise';

async function test() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'neverita_db' // Assuming this is the local DB
    });

    const [rows] = await connection.query(`SELECT CAST('2026-05-21' AS DATE) as exp_date`);
    console.log("Local mysql2 returns:", rows[0].exp_date);
    console.log("JSON.stringify:", JSON.stringify(rows[0].exp_date));

    // Simulate Render (UTC)
    process.env.TZ = 'UTC';
    const [rows2] = await connection.query(`SELECT CAST('2026-05-21' AS DATE) as exp_date`);
    console.log("UTC mysql2 returns:", rows2[0].exp_date);
    console.log("UTC JSON.stringify:", JSON.stringify(rows2[0].exp_date));
    
    await connection.end();
}

test().catch(console.error);
