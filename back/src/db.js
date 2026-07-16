import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Aviso mínimo de arranque (sin exponer host/usuario/credenciales en logs)
console.log('📦 DB pool inicializado', process.env.TIDB_DATABASE ? '(config presente)' : '(⚠️ faltan variables TIDB_*)');

// Creamos el pool usando los nombres exactos que pusiste en Render
const pool = mysql.createPool({
  host: process.env.TIDB_HOST,
  port: Number(process.env.TIDB_PORT || 4000),
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // ESTO ES OBLIGATORIO PARA TIDB CLOUD
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false
  },
  dateStrings: true, // Prevent timezone shifting on DATE columns
  enableKeepAlive: true, // Evita que conexiones idle se queden obsoletas
  keepAliveInitialDelay: 10000,
});

// Evita que un error de conexión inactiva tumbe el proceso.
pool.on('error', (err) => {
  console.error('⚠️ Error del pool de MySQL:', err.code || err.message);
});

export const db = pool;