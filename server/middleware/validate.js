'use strict';
const { badRequest } = require('../utils/errors');

function formatIssues(error) {
  const fields = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join('.') : '_';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

// validate('body' | 'query', schema) → deja el resultado limpio en req.valid[source]
const validate = (source, schema) => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const fields = formatIssues(result.error);
    const first = Object.values(fields)[0];
    return next(badRequest(first || 'Datos inválidos.', fields));
  }
  req.valid = req.valid || {};
  req.valid[source] = result.data;
  next();
};

module.exports = { validate };
