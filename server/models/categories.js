'use strict';
const { getDb } = require('../db');
const { toCents, fromCents } = require('../utils/money');

const DEFAULTS = [
  { name: 'Alimentación', emoji: '🍽️', color: '#4fd1a5', budget: 500000 },
  { name: 'Transporte', emoji: '🚌', color: '#6b9fff', budget: 200000 },
  { name: 'Vivienda', emoji: '🏠', color: '#a78bfa', budget: 800000 },
  { name: 'Salud', emoji: '💊', color: '#f07070', budget: 150000 },
  { name: 'Educación', emoji: '📚', color: '#f0b84a', budget: 200000 },
  { name: 'Entretenimiento', emoji: '🎬', color: '#f472b6', budget: 100000 },
  { name: 'Ropa', emoji: '👗', color: '#38bdf8', budget: 100000 },
  { name: 'Servicios', emoji: '💡', color: '#fb923c', budget: 200000 },
  { name: 'Gastos Hormiga', emoji: '🐜', color: '#94a3b8', budget: 80000, isAnt: true },
  { name: 'Otros', emoji: '📦', color: '#64748b', budget: 100000 },
  { name: 'Ingresos', emoji: '💰', color: '#34d399', budget: 0 },
];

const toDto = (r) => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  color: r.color,
  budget: fromCents(r.budget_cents),
  isAnt: !!r.is_ant,
  sortOrder: r.sort_order,
});

function seedDefaults(userId) {
  const stmt = getDb().prepare(
    'INSERT OR IGNORE INTO categories (user_id, name, emoji, color, budget_cents, is_ant, sort_order) VALUES (?,?,?,?,?,?,?)'
  );
  DEFAULTS.forEach((c, i) => stmt.run(userId, c.name, c.emoji, c.color, toCents(c.budget), c.isAnt ? 1 : 0, i));
}

const list = (userId) =>
  getDb().prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY sort_order, id').all(userId).map(toDto);

const find = (userId, id) => {
  const r = getDb().prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(id, userId);
  return r ? toDto(r) : null;
};

const findByName = (userId, name) => {
  const r = getDb().prepare('SELECT * FROM categories WHERE user_id = ? AND name = ?').get(userId, name);
  return r ? toDto(r) : null;
};

function create(userId, c) {
  const db = getDb();
  const max = db.prepare('SELECT COALESCE(MAX(sort_order), -1) m FROM categories WHERE user_id = ?').get(userId).m;
  const info = db
    .prepare('INSERT INTO categories (user_id, name, emoji, color, budget_cents, is_ant, sort_order) VALUES (?,?,?,?,?,?,?)')
    .run(userId, c.name, c.emoji, c.color, toCents(c.budget), c.isAnt ? 1 : 0, max + 1);
  return find(userId, info.lastInsertRowid);
}

function update(userId, id, c) {
  getDb()
    .prepare('UPDATE categories SET name = ?, emoji = ?, color = ?, budget_cents = ?, is_ant = ? WHERE id = ? AND user_id = ?')
    .run(c.name, c.emoji, c.color, toCents(c.budget), c.isAnt ? 1 : 0, id, userId);
  return find(userId, id);
}

const updateBudget = (userId, id, budget) =>
  getDb().prepare('UPDATE categories SET budget_cents = ? WHERE id = ? AND user_id = ?').run(toCents(budget), id, userId);

const countTransactions = (userId, id) =>
  getDb().prepare('SELECT COUNT(*) c FROM transactions WHERE user_id = ? AND category_id = ?').get(userId, id).c;

const countAll = (userId) => getDb().prepare('SELECT COUNT(*) c FROM categories WHERE user_id = ?').get(userId).c;

function remove(userId, id, reassignTo) {
  const db = getDb();
  return db.transaction(() => {
    if (reassignTo) {
      db.prepare('UPDATE transactions SET category_id = ? WHERE user_id = ? AND category_id = ?').run(reassignTo, userId, id);
    }
    db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(id, userId);
  })();
}

function resetToDefaults(userId) {
  getDb().prepare('DELETE FROM categories WHERE user_id = ?').run(userId);
  seedDefaults(userId);
}

module.exports = {
  DEFAULTS, seedDefaults, list, find, findByName, create, update, updateBudget, countTransactions, countAll, remove, resetToDefaults,
};
