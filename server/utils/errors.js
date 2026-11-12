'use strict';

class AppError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
const badRequest = (msg, fields) => new AppError(400, 'BAD_REQUEST', msg, fields);
const unauthorized = (msg = 'Debes iniciar sesión.') => new AppError(401, 'UNAUTHORIZED', msg);
const forbidden = (msg = 'No tienes permiso para realizar esta acción.') => new AppError(403, 'FORBIDDEN', msg);
const notFound = (msg = 'Recurso no encontrado.') => new AppError(404, 'NOT_FOUND', msg);
const conflict = (msg, fields) => new AppError(409, 'CONFLICT', msg, fields);

module.exports = { AppError, badRequest, unauthorized, forbidden, notFound, conflict };
