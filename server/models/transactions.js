'use strict';
const { getDb } = require('../db');
const { toCents, fromCents } = require('../utils/money');

const SELECT = `
  SELECT t.*, c.name AS category_name, c.emoji AS category_emoji, c.color AS category_color, c.is_ant AS category_is_ant,
         m.name AS member_name, m.emoji AS member_emoji, m.color AS member_color, m.avatar_json AS member_avatar_json
  FROM transactions t
  JOIN categories c ON c.id = t.category_id
  LEFT JOIN members m ON m.id = t.member_id`;

const toDto = (r, antLimitCents = 0) => ({
  id: r.id,
  type: r.type,
  amount: fromCents(r.amount_cents),
  description: r.description,
  note: r.note,
  date: r.date,
  categoryId: r.category_id,
  memberId: r.member_id,
  category: { id: r.category_id, name: r.category_name, emoji: r.category_emoji, color: r.category_color },
  member: r.member_id ? { id: r.member_id, name: r.member_name, emoji: r.member_emoji, color: r.member_color, avatar: (() => { try { return JSON.parse(r.member_avatar_json || '{}'); } catch { return {}; } })() } : null,
  isAnt: r.type === 'gasto' && (!!r.category_is_ant || (antLimitCents > 0 && r.amount_cents < antLimitCents)),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

function find(userId, id, antLimitCents = 0) {
  const r = getDb().prepare(`${SELECT} WHERE t.id = ? AND t.user_id = ?`).get(id, userId);
  return r ? toDto(r, antLimitCents) : null;
}

function buildWhere(userId, f) {
  const where = ['t.user_id = ?'];
  const params = [userId];
  if (f.from) { where.push('t.date >= ?'); params.push(f.from); }
  if (f.to) { where.push('t.date <= ?'); params.push(f.to); }
  if (f.type) { where.push('t.type = ?'); params.push(f.type); }
  if (f.categoryId) { where.push('t.category_id = ?'); params.push(f.categoryId); }
  if (f.memberId === 'none') where.push('t.member_id IS NULL');
  else if (f.memberId) { where.push('t.member_id = ?'); params.push(f.memberId); }
  if (f.q) {
    where.push("(t.description LIKE ? ESCAPE '\\' OR t.note LIKE ? ESCAPE '\\')");
    const like = `%${f.q.replace(/[\\%_]/g, (c) => '\\' + c)}%`;
    params.push(like, like);
  }
  if (f.minAmount !== undefined) { where.push('t.amount_cents >= ?'); params.push(toCents(f.minAmount)); }
  if (f.maxAmount !== undefined) { where.push('t.amount_cents <= ?'); params.push(toCents(f.maxAmount)); }
  return { sql: where.join(' AND '), params };
}

const SORTS = { date: 't.date', amount: 't.amount_cents', description: 't.description COLLATE NOCASE' };

function list(userId, f, antLimitCents = 0) {
  const db = getDb();
  const { sql, params } = buildWhere(userId, f);
  const sortCol = SORTS[f.sort] || SORTS.date;
  const dir = f.dir === 'asc' ? 'ASC' : 'DESC';
  const totals = db
    .prepare(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(CASE WHEN t.type='ingreso' THEN t.amount_cents END),0) AS income,
              COALESCE(SUM(CASE WHEN t.type='gasto' THEN t.amount_cents END),0) AS expense
       FROM transactions t WHERE ${sql}`
    )
    .get(...params);
  const limit = f.limit || 20;
  const page = f.page || 1;
  const rows = db
    .prepare(`${SELECT} WHERE ${sql} ORDER BY ${sortCol} ${dir}, t.id DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, (page - 1) * limit);
  return {
    items: rows.map((r) => toDto(r, antLimitCents)),
    total: totals.total,
    page,
    limit,
    pages: Math.max(1, Math.ceil(totals.total / limit)),
    totals: { income: fromCents(totals.income), expense: fromCents(totals.expense) },
  };
}

function listAll(userId, f, antLimitCents = 0) {
  const { sql, params } = buildWhere(userId, f);
  return getDb()
    .prepare(`${SELECT} WHERE ${sql} ORDER BY t.date DESC, t.id DESC`)
    .all(...params)
    .map((r) => toDto(r, antLimitCents));
}

function create(userId, t) {
  const info = getDb()
    .prepare(
      'INSERT INTO transactions (user_id, category_id, member_id, type, amount_cents, description, note, date) VALUES (?,?,?,?,?,?,?,?)'
    )
    .run(userId, t.categoryId, t.memberId ?? null, t.type, toCents(t.amount), t.description, t.note || '', t.date);
  return info.lastInsertRowid;
}

function update(userId, id, t) {
  getDb()
    .prepare(
      `UPDATE transactions SET category_id = ?, member_id = ?, type = ?, amount_cents = ?, description = ?, note = ?, date = ?,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND user_id = ?`
    )
    .run(t.categoryId, t.memberId ?? null, t.type, toCents(t.amount), t.description, t.note || '', t.date, id, userId);
}

const remove = (userId, id) => getDb().prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, userId).changes;
const removeAll = (userId) => getDb().prepare('DELETE FROM transactions WHERE user_id = ?').run(userId).changes;
const count = (userId) => getDb().prepare('SELECT COUNT(*) c FROM transactions WHERE user_id = ?').get(userId).c;

module.exports = { find, list, listAll, create, update, remove, removeAll, count };
