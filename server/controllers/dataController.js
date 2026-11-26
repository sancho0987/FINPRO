'use strict';
const auth = require('../services/authService');
const demo = require('../services/demoService');
const { getDb } = require('../db');
const transactions = require('../models/transactions');
const members = require('../models/members');
const categories = require('../models/categories');
const settings = require('../models/settings');
const { dateStr } = require('../validators/common');
const { todayStr } = require('../utils/period');
const { badRequest } = require('../utils/errors');

exports.wipe = async (req, res) => {
  const uid = req.user.id;
  await auth.verifyPassword(uid, req.valid.body.password);
  getDb().transaction(() => {
    transactions.removeAll(uid);
    getDb().prepare('DELETE FROM members WHERE user_id = ?').run(uid);
    categories.resetToDefaults(uid);
    settings.reset(uid);
  })();
  res.json({ ok: true });
};

exports.demo = (req, res) => {
  const parsed = dateStr.optional().safeParse(req.body && req.body.today);
  if (!parsed.success) throw badRequest('Fecha inválida.');
  demo.seed(req.user.id, parsed.data || todayStr());
  res.status(201).json({ ok: true });
};

exports.exportJson = (req, res) => {
  const uid = req.user.id;
  const cfg = settings.get(uid);
  const payload = {
    exportedAt: new Date().toISOString(),
    user: { name: req.user.name, email: req.user.email, avatar: req.user.avatar },
    settings: cfg,
    categories: categories.list(uid),
    members: members.list(uid),
    transactions: transactions.listAll(uid, {}, 0).map((t) => ({
      id: t.id, type: t.type, amount: t.amount, description: t.description, note: t.note, date: t.date,
      category: t.category.name, member: t.member ? t.member.name : null,
    })),
  };
  res.setHeader('Content-Disposition', 'attachment; filename="finpro-datos.json"');
  res.json(payload);
};
