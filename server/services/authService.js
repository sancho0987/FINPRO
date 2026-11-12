'use strict';
const bcrypt = require('bcryptjs');
const config = require('../config');
const { getDb } = require('../db');
const users = require('../models/users');
const sessions = require('../models/sessions');
const resets = require('../models/passwordResets');
const settings = require('../models/settings');
const categories = require('../models/categories');
const mail = require('./mailService');
const { randomToken } = require('../utils/crypto');
const { AppError, conflict, unauthorized, badRequest, forbidden } = require('../utils/errors');

let dummyHash = null;
const getDummyHash = () => (dummyHash ||= bcrypt.hashSync(randomToken(12), config.bcryptRounds));
const hash = (pw) => bcrypt.hash(pw, config.bcryptRounds);

function openSession(userId, meta) {
  const token = randomToken(32);
  sessions.create(userId, token, config.sessionTtlDays, meta);
  return token;
}

async function register({ name, email, password }, meta, role = 'user') {
  if (users.findByEmail(email)) throw conflict('Ya existe una cuenta con ese correo.', { email: 'Este correo ya está registrado.' });
  const passwordHash = await hash(password);
  const db = getDb();
  let user;
  try {
    user = db.transaction(() => {
      const u = users.create({ name, email, passwordHash, role });
      settings.get(u.id);
      categories.seedDefaults(u.id);
      return u;
    })();
  } catch (e) {
    if (/UNIQUE constraint/i.test(String(e.message))) throw conflict('Ya existe una cuenta con ese correo.', { email: 'Este correo ya está registrado.' });
    throw e;
  }
  const token = openSession(user.id, meta);
  users.registerSuccessfulLogin(user.id);
  return { user: users.publicUser(users.findById(user.id)), token };
}

async function login({ email, password }, meta) {
  const u = users.findByEmail(email);
  if (!u) {
    await bcrypt.compare(password, getDummyHash()); // evita revelar si el correo existe por tiempos
    throw unauthorized('Correo o contraseña incorrectos.');
  }
  if (u.locked_until && new Date(u.locked_until).getTime() > Date.now()) {
    const mins = Math.ceil((new Date(u.locked_until).getTime() - Date.now()) / 60000);
    throw new AppError(429, 'LOCKED', `Demasiados intentos fallidos. Inténtalo de nuevo en ${mins} minuto(s).`);
  }
  const ok = await bcrypt.compare(password, u.password_hash);
  if (!ok) {
    users.registerFailedLogin(u.id, config.maxFailedLogins, config.lockMinutes);
    throw unauthorized('Correo o contraseña incorrectos.');
  }
  if (!u.is_active) throw forbidden('Tu cuenta está desactivada. Contacta al administrador.');
  users.registerSuccessfulLogin(u.id);
  const token = openSession(u.id, meta);
  return { user: users.publicUser(users.findById(u.id)), token };
}

const logout = (token) => token && sessions.destroyByToken(token);

async function forgotPassword(email) {
  const u = users.findByEmail(email);
  if (!u || !u.is_active) return; // respuesta idéntica para no revelar si existe
  const token = randomToken(32);
  resets.create(u.id, token, config.resetTokenMinutes);
  const link = `${config.appUrl}/reset.html?token=${encodeURIComponent(token)}`;
  try {
    await mail.sendPasswordReset(u, link);
  } catch (e) {
    console.error('[mail] No se pudo enviar el correo de recuperación:', e.message);
  }
}

async function resetPassword(token, newPassword) {
  const r = resets.findValid(token);
  if (!r) throw badRequest('El enlace de recuperación es inválido o ya expiró. Solicita uno nuevo.');
  const passwordHash = await hash(newPassword);
  getDb().transaction(() => {
    users.update(r.user_id, { passwordHash });
    users.clearLock(r.user_id);
    resets.markUsed(r.id);
    sessions.destroyAllForUser(r.user_id); // cierra todas las sesiones abiertas
  })();
}

async function changePassword(userId, currentPassword, newPassword, keepSessionId) {
  const u = users.findById(userId);
  if (!(await bcrypt.compare(currentPassword, u.password_hash))) {
    throw badRequest('La contraseña actual es incorrecta.', { currentPassword: 'La contraseña actual es incorrecta.' });
  }
  if (currentPassword === newPassword) {
    throw badRequest('La nueva contraseña debe ser diferente.', { newPassword: 'La nueva contraseña debe ser diferente.' });
  }
  const passwordHash = await hash(newPassword);
  users.update(userId, { passwordHash });
  sessions.destroyAllForUser(userId, keepSessionId);
}

async function verifyPassword(userId, password) {
  const u = users.findById(userId);
  if (!(await bcrypt.compare(password, u.password_hash))) {
    throw badRequest('La contraseña es incorrecta.', { password: 'La contraseña es incorrecta.' });
  }
}

function updateProfile(userId, { name, email }) {
  const existing = users.findByEmail(email);
  if (existing && existing.id !== userId) throw conflict('Ya existe una cuenta con ese correo.', { email: 'Este correo ya está en uso.' });
  return users.publicUser(users.update(userId, { name, email }));
}

module.exports = { register, login, logout, forgotPassword, resetPassword, changePassword, verifyPassword, updateProfile, hash };
