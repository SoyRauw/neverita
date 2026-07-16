export function errorHandler(err, req, res, next) {
  // Log completo del lado servidor (para depurar), sin exponerlo al cliente.
  console.error(err);

  // Si ya se empezó a enviar la respuesta, delegar en Express.
  if (res.headersSent) return next(err);

  // Body JSON malformado (body-parser): mensaje controlado, no filtrar el parseo.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El cuerpo de la petición es demasiado grande.' });
  }

  // Errores conocidos de MySQL/MariaDB → respuestas amables (no 500 crudo)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos.' });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    return res.status(409).json({ error: 'No se puede eliminar: hay otros datos que dependen de este registro.' });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    return res.status(400).json({ error: 'Referencia inválida: alguno de los datos enviados no existe.' });
  }

  const status = err.status || err.statusCode || 500;

  // Errores 4xx con mensaje explícito y controlado: se devuelven tal cual.
  if (status >= 400 && status < 500 && err.message) {
    return res.status(status).json({ error: err.message });
  }

  // Errores 5xx: nunca exponer el mensaje interno (puede filtrar SQL/rutas).
  res.status(status).json({ error: 'Error interno del servidor.' });
}
