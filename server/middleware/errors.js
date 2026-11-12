'use strict';
const { AppError } = require('../utils/errors');
const config = require('../config');

const notFoundApi = (_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Ruta no encontrada.'));

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, fields: err.fields } });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'BAD_JSON', message: 'El cuerpo de la solicitud no es JSON válido.' } });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'TOO_LARGE', message: 'La solicitud es demasiado grande.' } });
  }
  if (!config.isTest) console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Ocurrió un error inesperado. Inténtalo de nuevo.' } });
}

module.exports = { notFoundApi, errorHandler };
