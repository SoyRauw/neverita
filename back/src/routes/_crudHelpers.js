import { db } from '../db.js';

export function buildCrudRouter(table, idField, readonlyFields = []) {
  const express = require('express');
  const router = express.Router();

  // GET all
  router.get('/', async (req, res, next) => {
    try {
      const [rows] = await db.query(`SELECT * FROM ${table}`);
      res.json(rows);
    } catch (err) { next(err); }
  });

  // GET by id
  router.get('/:id', async (req, res, next) => {
    try {
      const [rows] = await db.query(`SELECT * FROM ${table} WHERE ${idField} = ?`, [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      res.json(rows[0]);
    } catch (err) { next(err); }
  });

  // POST create
  router.post('/', async (req, res, next) => {
    try {
      const body = sanitizeBody(req.body, readonlyFields);
      const [result] = await db.query(`INSERT INTO ${table} SET ?`, body);
      res.status(201).json({ id: result.insertId, ...body });
    } catch (err) { next(err); }
  });

  // PUT update
  router.put('/:id', async (req, res, next) => {
    try {
      const body = sanitizeBody(req.body, readonlyFields.concat([idField]));
      const [result] = await db.query(`UPDATE ${table} SET ? WHERE ${idField} = ?`, [body, req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ id: Number(req.params.id), ...body });
    } catch (err) { next(err); }
  });

  // DELETE
  router.delete('/:id', async (req, res, next) => {
    try {
      const [result] = await db.query(`DELETE FROM ${table} WHERE ${idField} = ?`, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
      res.status(204).send();
    } catch (err) { next(err); }
  });

  return router;
}

function sanitizeBody(body, readonlyFields) {
  const copy = { ...body };
  for (const f of readonlyFields) delete copy[f];
  return copy;
}
