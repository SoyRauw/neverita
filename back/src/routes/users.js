import express from 'express';
import { db } from '../db.js';
import { hashPassword, verifyPassword, looksHashed, passwordIssues } from '../utils/password.js';

export const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT user_id, username, name, email FROM users');
    res.json(rows);
  } catch (err) { next(err); }
});

// Columnas de perfil (físico + preferencias alimentarias) para nutrición/métricas por persona
const PROFILE_COLS = 'birth_date, height_cm, weight_kg, sex, activity_level, diet_type, goal, dietary_restrictions';

// Valores permitidos para las preferencias (deben coincidir con el front: src/profileOptions.js)
const DIET_VALUES = ['omnivoro', 'vegetariano', 'vegano', 'pescetariano', 'keto'];
const GOAL_VALUES = ['bajar', 'mantener', 'ganar'];
const RESTRICTION_VALUES = ['gluten', 'lactosa', 'frutos_secos', 'mariscos', 'huevo', 'cerdo', 'azucar', 'halal', 'kosher'];

// Devuelve la fila con `dietary_restrictions` ya parseado a array (en BD se guarda como JSON string)
function serializeUser(row) {
  if (!row) return row;
  let restrictions = [];
  if (row.dietary_restrictions) {
    try {
      const parsed = JSON.parse(row.dietary_restrictions);
      if (Array.isArray(parsed)) restrictions = parsed;
    } catch { /* dato corrupto → array vacío */ }
  }
  return { ...row, dietary_restrictions: restrictions };
}

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT user_id, username, name, email, ${PROFILE_COLS} FROM users WHERE user_id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(serializeUser(rows[0]));
  } catch (err) { next(err); }
});

// Actualizar SOLO los datos físicos del perfil (no exige usuario/clave).
router.put('/:id/profile', async (req, res, next) => {
  try {
    const { birth_date, height_cm, weight_kg, sex, activity_level, diet_type, goal, dietary_restrictions } = req.body;
    const sets = [];
    const params = [];

    if (birth_date !== undefined) {
      const bd = birth_date === '' ? null : birth_date;
      if (bd !== null) {
        const s = String(bd);
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
        const d = m ? new Date(`${s}T00:00:00Z`) : null;
        // No basta el formato: hay que validar que sea una fecha real (rechaza 2026-02-31, 2026-99-99, etc.)
        const validDate = m && d && !Number.isNaN(d.getTime())
          && d.getUTCFullYear() === Number(m[1])
          && d.getUTCMonth() + 1 === Number(m[2])
          && d.getUTCDate() === Number(m[3]);
        if (!validDate) {
          return res.status(400).json({ error: 'Fecha de nacimiento inválida (formato AAAA-MM-DD).' });
        }
        if (d.getTime() > Date.now()) {
          return res.status(400).json({ error: 'La fecha de nacimiento no puede ser futura.' });
        }
      }
      sets.push('birth_date = ?'); params.push(bd);
    }
    if (height_cm !== undefined) {
      const h = height_cm === null || height_cm === '' ? null : Number(height_cm);
      if (h !== null && (!Number.isFinite(h) || h < 30 || h > 260)) {
        return res.status(400).json({ error: 'Altura inválida (30–260 cm).' });
      }
      sets.push('height_cm = ?'); params.push(h);
    }
    if (weight_kg !== undefined) {
      const w = weight_kg === null || weight_kg === '' ? null : Number(weight_kg);
      if (w !== null && (!Number.isFinite(w) || w < 1 || w > 400)) {
        return res.status(400).json({ error: 'Peso inválido (1–400 kg).' });
      }
      sets.push('weight_kg = ?'); params.push(w);
    }
    if (sex !== undefined) {
      if (sex !== null && !['m', 'f', 'otro'].includes(sex)) {
        return res.status(400).json({ error: 'Sexo inválido.' });
      }
      sets.push('sex = ?'); params.push(sex || null);
    }
    if (activity_level !== undefined) {
      if (activity_level !== null && !['bajo', 'medio', 'alto'].includes(activity_level)) {
        return res.status(400).json({ error: 'Nivel de actividad inválido.' });
      }
      sets.push('activity_level = ?'); params.push(activity_level || null);
    }
    if (diet_type !== undefined) {
      if (diet_type !== null && diet_type !== '' && !DIET_VALUES.includes(diet_type)) {
        return res.status(400).json({ error: 'Tipo de alimentación inválido.' });
      }
      sets.push('diet_type = ?'); params.push(diet_type || null);
    }
    if (goal !== undefined) {
      if (goal !== null && goal !== '' && !GOAL_VALUES.includes(goal)) {
        return res.status(400).json({ error: 'Objetivo inválido.' });
      }
      sets.push('goal = ?'); params.push(goal || null);
    }
    if (dietary_restrictions !== undefined) {
      let arr = dietary_restrictions === null ? [] : dietary_restrictions;
      if (!Array.isArray(arr)) {
        return res.status(400).json({ error: 'Restricciones inválidas.' });
      }
      // Solo se guardan valores conocidos (evita basura/inyección de etiquetas)
      const clean = [...new Set(arr.filter(x => RESTRICTION_VALUES.includes(x)))];
      sets.push('dietary_restrictions = ?'); params.push(JSON.stringify(clean));
    }

    if (sets.length === 0) return res.status(400).json({ error: 'No hay datos de perfil para actualizar.' });

    params.push(req.params.id);
    const [result] = await db.query(`UPDATE users SET ${sets.join(', ')} WHERE user_id = ?`, params);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });

    const [rows] = await db.query(
      `SELECT user_id, username, name, email, ${PROFILE_COLS} FROM users WHERE user_id = ?`,
      [req.params.id]
    );
    res.json(serializeUser(rows[0]));
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
    }

    const [rows] = await db.query(
      'SELECT user_id, username, name, email, password FROM users WHERE username = ?',
      [username]
    );
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = rows[0];
    const ok = await verifyPassword(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    // Migración transparente: si la contraseña estaba en texto plano, la re-guardamos hasheada.
    if (!looksHashed(user.password)) {
      try {
        const hashed = await hashPassword(password);
        await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashed, user.user_id]);
      } catch (e) { /* si falla la migración, no bloqueamos el login */ }
    }

    res.json({ user_id: user.user_id, username: user.username, name: user.name, email: user.email });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { username, password, name, email } = req.body;
    if (!username || !username.trim()) return res.status(400).json({ error: 'El nombre de usuario es obligatorio.' });
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio.' });
    if (!email || !email.trim()) return res.status(400).json({ error: 'El correo es obligatorio.' });
    if (!EMAIL_RE.test(email.trim())) return res.status(400).json({ error: 'El correo no tiene un formato válido.' });
    const pwIssues = passwordIssues(password);
    if (pwIssues.length) return res.status(400).json({ error: `La contraseña debe tener: ${pwIssues.join(', ')}.` });

    const cleanEmail = email.trim().toLowerCase();
    // Unicidad con mensajes claros (username y email) antes de insertar.
    const [dupU] = await db.query('SELECT user_id FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1', [username.trim()]);
    if (dupU.length) return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso.' });
    const [dupE] = await db.query('SELECT user_id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [cleanEmail]);
    if (dupE.length) return res.status(409).json({ error: 'Ese correo ya está registrado.' });
    const hashed = await hashPassword(password);
    const [result] = await db.query(
      'INSERT INTO users (username, password, name, email) VALUES (?, ?, ?, ?)',
      [username.trim(), hashed, name.trim(), cleanEmail]
    );
    res.status(201).json({ user_id: result.insertId, username: username.trim(), name: name.trim(), email: cleanEmail });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { username, password, current_password, name, email } = req.body;
    if (!username || !username.trim() || !name || !name.trim()) return res.status(400).json({ error: 'Usuario y nombre son obligatorios.' });
    if (email && !EMAIL_RE.test(String(email).trim())) return res.status(400).json({ error: 'El correo no tiene un formato válido.' });
    const cleanEmail = email ? String(email).trim().toLowerCase() : null;

    const [cur] = await db.query('SELECT user_id, password FROM users WHERE user_id = ?', [req.params.id]);
    if (!cur.length) return res.status(404).json({ error: 'Not found' });

    // Unicidad excluyéndose a sí mismo (mensajes claros).
    const [dupU] = await db.query('SELECT user_id FROM users WHERE LOWER(username) = LOWER(?) AND user_id <> ? LIMIT 1', [username.trim(), req.params.id]);
    if (dupU.length) return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso.' });
    if (cleanEmail) {
      const [dupE] = await db.query('SELECT user_id FROM users WHERE LOWER(email) = LOWER(?) AND user_id <> ? LIMIT 1', [cleanEmail, req.params.id]);
      if (dupE.length) return res.status(409).json({ error: 'Ese correo ya está registrado por otra cuenta.' });
    }

    // Cambio de contraseña: exige y verifica la ACTUAL.
    let passwordSql = '';
    const params = [username.trim(), name.trim(), cleanEmail];
    if (password) {
      const ok = await verifyPassword(current_password || '', cur[0].password);
      if (!ok) return res.status(401).json({ error: 'La contraseña actual no es correcta.' });
      const pwIssues = passwordIssues(password);
      if (pwIssues.length) return res.status(400).json({ error: `La nueva contraseña debe tener: ${pwIssues.join(', ')}.` });
      passwordSql = ', password = ?';
      params.push(await hashPassword(password));
    }
    params.push(req.params.id);

    await db.query(`UPDATE users SET username = ?, name = ?, email = ?${passwordSql} WHERE user_id = ?`, params);
    res.json({ user_id: Number(req.params.id), username: username.trim(), name: name.trim(), email: cleanEmail });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) { next(err); }
});
