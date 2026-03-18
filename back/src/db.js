import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('📦 DB Config:', {
  host: process.env.TIDB_HOST,
  port: process.env.TIDB_PORT,
  user: process.env.TIDB_USER,
  database: process.env.TIDB_DATABASE,
  hasPassword: !!process.env.TIDB_PASSWORD,
});

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
  }
});

export const db = pool;