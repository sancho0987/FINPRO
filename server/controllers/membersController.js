'use strict';
const members = require('../models/members');
const { notFound } = require('../utils/errors');
const { id } = require('../validators/common');

const pid = (req) => {
  const r = id.safeParse(req.params.id);
  if (!r.success) throw notFound('Miembro no encontrado.');
  return r.data;
};

exports.list = (req, res) => res.json({ members: members.list(req.user.id) });
exports.create = (req, res) => res.status(201).json({ member: members.create(req.user.id, req.valid.body) });
exports.update = (req, res) => {
  const mid = pid(req);
  if (!members.find(req.user.id, mid)) throw notFound('Miembro no encontrado.');
  res.json({ member: members.update(req.user.id, mid, req.valid.body) });
};
exports.remove = (req, res) => {
  const mid = pid(req);
  if (!members.find(req.user.id, mid)) throw notFound('Miembro no encontrado.');
  const kept = members.countTransactions(req.user.id, mid);
  members.remove(req.user.id, mid);
  res.json({ ok: true, keptTransactions: kept });
};
