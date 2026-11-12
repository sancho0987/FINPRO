'use strict';
const transactions = require('../models/transactions');
const categories = require('../models/categories');
const members = require('../models/members');
const settings = require('../models/settings');
const { toCents } = require('../utils/money');
const { notFound, badRequest } = require('../utils/errors');
const { id } = require('../validators/common');

const pid = (req) => {
  const r = id.safeParse(req.params.id);
  if (!r.success) throw notFound('Movimiento no encontrado.');
  return r.data;
};
const antLimit = (uid) => toCents(settings.get(uid).antLimit);

function checkRefs(uid, body) {
  if (!categories.find(uid, body.categoryId)) throw badRequest('La categoría elegida no existe.', { categoryId: 'La categoría elegida no existe.' });
  if (body.memberId && !members.find(uid, body.memberId)) throw badRequest('El miembro elegido no existe.', { memberId: 'El miembro elegido no existe.' });
}

exports.list = (req, res) => res.json(transactions.list(req.user.id, req.valid.query, antLimit(req.user.id)));

exports.get = (req, res) => {
  const t = transactions.find(req.user.id, pid(req), antLimit(req.user.id));
  if (!t) throw notFound('Movimiento no encontrado.');
  res.json({ transaction: t });
};

exports.create = (req, res) => {
  const uid = req.user.id;
  checkRefs(uid, req.valid.body);
  const newId = transactions.create(uid, req.valid.body);
  res.status(201).json({ transaction: transactions.find(uid, newId, antLimit(uid)) });
};

exports.update = (req, res) => {
  const uid = req.user.id;
  const tid = pid(req);
  if (!transactions.find(uid, tid)) throw notFound('Movimiento no encontrado.');
  checkRefs(uid, req.valid.body);
  transactions.update(uid, tid, req.valid.body);
  res.json({ transaction: transactions.find(uid, tid, antLimit(uid)) });
};

exports.remove = (req, res) => {
  const changes = transactions.remove(req.user.id, pid(req));
  if (!changes) throw notFound('Movimiento no encontrado.');
  res.json({ ok: true });
};

// Protege contra inyección de fórmulas al abrir el CSV en Excel/Sheets
const csvCell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

exports.exportCsv = (req, res) => {
  const rows = transactions.listAll(req.user.id, req.valid.query, antLimit(req.user.id));
  const header = ['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Miembro', 'Monto', 'Nota'];
  const lines = rows.map((t) =>
    [t.date, t.type, t.description, t.category.name, t.member ? t.member.name : '', t.amount.toFixed(2), t.note].map(csvCell).join(',')
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="finpro-movimientos.csv"');
  res.send('﻿' + [header.join(','), ...lines].join('\r\n'));
};
