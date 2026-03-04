import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Creamos el pool usando los nombres exactos que pusiste en Render
const pool = mysql.createPool({
  host: process.env.TIDB_HOST, // Antes era DB_HOST
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
    rejectUnauthorized: true
  }
});

export const db = pool;