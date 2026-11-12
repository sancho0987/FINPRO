'use strict';
const { getDb } = require('../db');

const toDto = (r) => ({ id: r.id, name: r.name, role: r.role, emoji: r.emoji, color: r.color });

const list = (userId) => getDb().prepare('SELECT * FROM members WHERE user_id = ? ORDER BY id').all(userId).map(toDto);
const find = (userId, id) => {
  const r = getDb().prepare('SELECT * FROM members WHERE id = ? AND user_id = ?').get(id, userId);
  return r ? toDto(r) : null;
};
function create(userId, m) {
  const info = getDb()
    .prepare('INSERT INTO members (user_id, name, role, emoji, color) VALUES (?,?,?,?,?)')
    .run(userId, m.name, m.role, m.emoji, m.color);
  return find(userId, info.lastInsertRowid);
}
function update(userId, id, m) {
  getDb().prepare('UPDATE members SET name = ?, role = ?, emoji = ?, color = ? WHERE id = ? AND user_id = ?').run(m.name, m.role, m.emoji, m.color, id, userId);
  return find(userId, id);
}
const remove = (userId, id) => getDb().prepare('DELETE FROM members WHERE id = ? AND user_id = ?').run(id, userId);
const countTransactions = (userId, id) =>
  getDb().prepare('SELECT COUNT(*) c FROM transactions WHERE user_id = ? AND member_id = ?').get(userId, id).c;

module.exports = { list, find, create, update, remove, countTransactions };
