'use strict';
const config = require('../config');
const auth = require('../services/authService');
const users = require('../models/users');
const settings = require('../models/settings');
const categories = require('../models/categories');
const members = require('../models/members');
const transactions = require('../models/transactions');
const sessions = require('../models/sessions');
const { cookieOptions } = require('../middleware/auth');
const { forbidden, conflict } = require('../utils/errors');

const meta = (req) => ({ userAgent: req.get('user-agent'), ip: req.ip });
const setCookie = (res, token) => res.cookie(config.cookieName, token, cookieOptions());
const clearCookie = (res) => res.clearCookie(config.cookieName, { ...cookieOptions(), maxAge: undefined });

exports.register = async (req, res) => {
  if (!config.allowRegistration) throw forbidden('El registro de nuevas cuentas está deshabilitado.');
  const { user, token } = await auth.register(req.valid.body, meta(req));
  setCookie(res, token);
  res.status(201).json({ user });
};

exports.login = async (req, res) => {
  const { user, token } = await auth.login(req.valid.body, meta(req));
  setCookie(res, token);
  res.json({ user });
};

exports.logout = (req, res) => {
  auth.logout(req.cookies && req.cookies[config.cookieName]);
  clearCookie(res);
  res.json({ ok: true });
};

exports.forgot = async (req, res) => {
  await auth.forgotPassword(req.valid.body.email);
  res.json({ ok: true, message: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.' });
};

exports.reset = async (req, res) => {
  await auth.resetPassword(req.valid.body.token, req.valid.body.password);
  res.json({ ok: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
};

exports.me = (req, res) => res.json({ user: req.user });

exports.bootstrap = (req, res) => {
  const uid = req.user.id;
  res.json({
    user: req.user,
    settings: settings.get(uid),
    categories: categories.list(uid),
    members: members.list(uid),
    hasTransactions: transactions.count(uid) > 0,
  });
};

exports.updateProfile = (req, res) => res.json({ user: auth.updateProfile(req.user.id, req.valid.body) });

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.valid.body;
  await auth.changePassword(req.user.id, currentPassword, newPassword, req.sessionId);
  res.json({ ok: true, message: 'Contraseña actualizada. Se cerraron tus otras sesiones.' });
};

exports.deleteAccount = async (req, res) => {
  await auth.verifyPassword(req.user.id, req.valid.body.password);
  if (req.user.role === 'admin' && users.countActiveAdmins() <= 1) {
    throw conflict('Eres el único administrador. Asigna otro administrador antes de eliminar tu cuenta.');
  }
  users.remove(req.user.id);
  clearCookie(res);
  res.json({ ok: true });
};

exports.logoutOthers = (req, res) => {
  sessions.destroyAllForUser(req.user.id, req.sessionId);
  res.json({ ok: true });
};
