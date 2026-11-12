'use strict';
const categories = require('../models/categories');
const { AppError, notFound, conflict, badRequest } = require('../utils/errors');
const { id } = require('../validators/common');

const pid = (req) => {
  const r = id.safeParse(req.params.id);
  if (!r.success) throw notFound('Categoría no encontrada.');
  return r.data;
};
const dupMsg = { name: 'Ya existe una categoría con ese nombre.' };

exports.list = (req, res) => res.json({ categories: categories.list(req.user.id) });

exports.create = (req, res) => {
  if (categories.findByName(req.user.id, req.valid.body.name)) throw conflict(dupMsg.name, dupMsg);
  res.status(201).json({ category: categories.create(req.user.id, req.valid.body) });
};

exports.update = (req, res) => {
  const cid = pid(req);
  if (!categories.find(req.user.id, cid)) throw notFound('Categoría no encontrada.');
  const same = categories.findByName(req.user.id, req.valid.body.name);
  if (same && same.id !== cid) throw conflict(dupMsg.name, dupMsg);
  res.json({ category: categories.update(req.user.id, cid, req.valid.body) });
};

exports.updateBudgets = (req, res) => {
  const uid = req.user.id;
  const list = req.valid.body.budgets;
  for (const b of list) if (!categories.find(uid, b.id)) throw badRequest('Una de las categorías no existe.');
  list.forEach((b) => categories.updateBudget(uid, b.id, b.budget));
  res.json({ categories: categories.list(uid) });
};

exports.remove = (req, res) => {
  const uid = req.user.id;
  const cid = pid(req);
  if (!categories.find(uid, cid)) throw notFound('Categoría no encontrada.');
  if (categories.countAll(uid) <= 1) throw conflict('Debes conservar al menos una categoría.');
  const used = categories.countTransactions(uid, cid);
  let reassignTo;
  if (used > 0) {
    reassignTo = Number(req.query.reassignTo);
    if (!Number.isInteger(reassignTo) || reassignTo === cid || !categories.find(uid, reassignTo)) {
      throw new AppError(409, 'CATEGORY_IN_USE', `Esta categoría tiene ${used} movimiento(s). Elige otra categoría a la cual moverlos.`);
    }
  }
  categories.remove(uid, cid, reassignTo);
  res.json({ ok: true, moved: used });
};
