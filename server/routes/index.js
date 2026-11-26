'use strict';
const express = require('express');
const { validate } = require('../middleware/validate');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const S = require('../validators/schemas');
const authC = require('../controllers/authController');
const settingsC = require('../controllers/settingsController');
const catC = require('../controllers/categoriesController');
const memC = require('../controllers/membersController');
const txC = require('../controllers/transactionsController');
const repC = require('../controllers/reportsController');
const dataC = require('../controllers/dataController');
const adminC = require('../controllers/adminController');

const api = express.Router();

api.get('/health', (_req, res) => res.json({ ok: true, name: 'finpro', time: new Date().toISOString() }));

api.get('/public-config', (_req, res) => res.json({ allowRegistration: require('../config').allowRegistration }));

// ── Autenticación ──
api.post('/auth/register', authLimiter, validate('body', S.auth.register), authC.register);
api.post('/auth/login', authLimiter, validate('body', S.auth.login), authC.login);
api.post('/auth/logout', authC.logout);
api.post('/auth/forgot-password', authLimiter, validate('body', S.auth.forgot), authC.forgot);
api.post('/auth/reset-password', authLimiter, validate('body', S.auth.reset), authC.reset);

// ── Todo lo siguiente requiere sesión ──
api.use(requireAuth);
api.get('/auth/me', authC.me);
api.patch('/auth/me', validate('body', S.auth.profile), authC.updateProfile);
api.patch('/auth/me/avatar', validate('body', S.avatar), (req, res) => {
  const user = require('../models/users').update(req.user.id, { avatar: req.valid.body });
  res.json({ user: require('../models/users').publicUser(user) });
});
api.delete('/auth/me', validate('body', S.auth.confirmPassword), authC.deleteAccount);
api.post('/auth/change-password', authLimiter, validate('body', S.auth.changePassword), authC.changePassword);
api.post('/auth/logout-others', authC.logoutOthers);
api.get('/bootstrap', authC.bootstrap);

api.get('/settings', settingsC.get);
api.put('/settings', validate('body', S.settings), settingsC.update);

api.get('/categories', catC.list);
api.post('/categories', validate('body', S.category), catC.create);
api.put('/categories/budgets', validate('body', S.categoryBudgets), catC.updateBudgets);
api.put('/categories/:id', validate('body', S.category), catC.update);
api.delete('/categories/:id', catC.remove);

api.get('/members', memC.list);
api.post('/members', validate('body', S.member), memC.create);
api.put('/members/:id', validate('body', S.member), memC.update);
api.patch('/members/:id/avatar', validate('body', S.avatar), memC.updateAvatar);
api.delete('/members/:id', memC.remove);

api.get('/transactions', validate('query', S.txQuery), txC.list);
api.get('/transactions/export.csv', validate('query', S.txQuery), txC.exportCsv);
api.post('/transactions', validate('body', S.transaction), txC.create);
api.get('/transactions/:id', txC.get);
api.put('/transactions/:id', validate('body', S.transaction), txC.update);
api.delete('/transactions/:id', txC.remove);

api.get('/reports/summary', validate('query', S.periodQuery), repC.summary);
api.get('/reports/monthly', validate('query', S.periodQuery), repC.monthly);

api.get('/data/export.json', dataC.exportJson);
api.post('/data/demo', dataC.demo);
api.post('/data/wipe', validate('body', S.auth.confirmPassword), dataC.wipe);

// ── Solo administradores ──
const admin = express.Router();
admin.use(requireAdmin);
admin.get('/stats', adminC.stats);
admin.get('/users', validate('query', S.admin.listUsers), adminC.list);
admin.patch('/users/:id', validate('body', S.admin.updateUser), adminC.update);
admin.delete('/users/:id', adminC.remove);
admin.post('/users/:id/send-reset', adminC.sendReset);
api.use('/admin', admin);

module.exports = api;
