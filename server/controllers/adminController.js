'use strict';
const users = require('../models/users');
const sessions = require('../models/sessions');
const auth = require('../services/authService');
const { notFound, conflict } = require('../utils/errors');
const { id } = require('../validators/common');

function target(req) {
  const r = id.safeParse(req.params.id);
  const u = r.success ? users.findById(r.data) : null;
  if (!u) throw notFound('Usuario no encontrado.');
  return u;
}

exports.stats = (_req, res) => res.json({ stats: users.stats() });
exports.list = (req, res) => {
  const { page, limit } = req.valid.query;
  const { total, items } = users.list(req.valid.query);
  res.json({ items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) });
};

exports.update = (req, res) => {
  const u = target(req);
  const { role, isActive } = req.valid.body;
  const isSelf = u.id === req.user.id;
  if (isSelf && ((role && role !== u.role) || isActive === false)) {
    throw conflict('No puedes quitarte el rol de administrador ni desactivar tu propia cuenta.');
  }
  const losesAdmin = u.role === 'admin' && u.is_active && ((role && role !== 'admin') || isActive === false);
  if (losesAdmin && users.countActiveAdmins() <= 1) throw conflict('Debe existir al menos un administrador activo.');
  const updated = users.update(u.id, { role, isActive });
  if (isActive === false) sessions.destroyAllForUser(u.id);
  res.json({ user: users.publicUser(updated) });
};

exports.remove = (req, res) => {
  const u = target(req);
  if (u.id === req.user.id) throw conflict('No puedes eliminar tu propia cuenta desde el panel.');
  if (u.role === 'admin' && u.is_active && users.countActiveAdmins() <= 1) throw conflict('Debe existir al menos un administrador activo.');
  users.remove(u.id);
  res.json({ ok: true });
};

exports.sendReset = async (req, res) => {
  const u = target(req);
  await auth.forgotPassword(u.email);
  res.json({ ok: true, message: `Se envió el enlace de recuperación a ${u.email}.` });
};
