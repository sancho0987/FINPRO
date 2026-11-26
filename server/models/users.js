'use strict';
const { getDb } = require('../db');
const { conflict } = require('../utils/errors');

const publicUser = (r) =>
  r && {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    isActive: !!r.is_active,
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at,
    avatar: (() => { try { return JSON.parse(r.avatar_json || '{}'); } catch { return {}; } })(),
  };

const findByEmail = (email) => getDb().prepare('SELECT * FROM users WHERE email = ?').get(email);
const findById = (id) => getDb().prepare('SELECT * FROM users WHERE id = ?').get(id);

function create({ name, email, passwordHash, role = 'user' }) {
  const info = getDb()
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, passwordHash, role);
  return findById(info.lastInsertRowid);
}

function update(id, fields) {
  const map = { name: 'name', email: 'email', passwordHash: 'password_hash', role: 'role', isActive: 'is_active', avatar: 'avatar_json' };
  const sets = [];
  const vals = [];
  for (const [k, col] of Object.entries(map)) {
    if (fields[k] !== undefined) {
      sets.push(`${col} = ?`);
      vals.push(k === 'isActive' ? (fields[k] ? 1 : 0) : k === 'avatar' ? JSON.stringify(fields[k]) : fields[k]);
    }
  }
  if (!sets.length) return findById(id);
  sets.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  getDb().prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals, id);
  return findById(id);
}

function registerFailedLogin(id, max, lockMinutes) {
  const db = getDb();
  const u = findById(id);
  const attempts = u.failed_attempts + 1;
  if (attempts >= max) {
    const until = new Date(Date.now() + lockMinutes * 60000).toISOString();
    db.prepare('UPDATE users SET failed_attempts = 0, locked_until = ? WHERE id = ?').run(until, id);
  } else {
    db.prepare('UPDATE users SET failed_attempts = ? WHERE id = ?').run(attempts, id);
  }
}

function registerSuccessfulLogin(id) {
  getDb()
    .prepare("UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?")
    .run(id);
}

function clearLock(id) {
  getDb().prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(id);
}

const countActiveAdmins = () =>
  getDb().prepare("SELECT COUNT(*) c FROM users WHERE role = 'admin' AND is_active = 1").get().c;

function list({ q, role, status, page = 1, limit = 20 }) {
  const where = [];
  const params = [];
  if (q) {
    where.push('(u.name LIKE ? ESCAPE \'\\\' OR u.email LIKE ? ESCAPE \'\\\')');
    const like = `%${q.replace(/[\\%_]/g, (c) => '\\' + c)}%`;
    params.push(like, like);
  }
  if (role) { where.push('u.role = ?'); params.push(role); }
  if (status === 'active') where.push('u.is_active = 1');
  if (status === 'inactive') where.push('u.is_active = 0');
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const db = getDb();
  const total = db.prepare(`SELECT COUNT(*) c FROM users u ${w}`).get(...params).c;
  const rows = db
    .prepare(
      `SELECT u.*,
         (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.id) AS tx_count,
         (SELECT COUNT(*) FROM members m WHERE m.user_id = u.id) AS member_count
       FROM users u ${w} ORDER BY u.created_at DESC, u.id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, (page - 1) * limit);
  return {
    total,
    items: rows.map((r) => ({ ...publicUser(r), txCount: r.tx_count, memberCount: r.member_count })),
  };
}

function remove(id) {
  const db = getDb();
  const movements = db.prepare('SELECT COUNT(*) c FROM transactions WHERE user_id = ?').get(id).c;
  if (movements > 0) throw conflict(`No se puede eliminar esta cuenta porque tiene ${movements} movimiento(s). No se modificó ningún dato.`);
  return db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

function stats() {
  const db = getDb();
  const one = (sql) => db.prepare(sql).get().c;
  return {
    users: one('SELECT COUNT(*) c FROM users'),
    activeUsers: one('SELECT COUNT(*) c FROM users WHERE is_active = 1'),
    admins: one("SELECT COUNT(*) c FROM users WHERE role = 'admin'"),
    transactions: one('SELECT COUNT(*) c FROM transactions'),
    newLast7Days: one("SELECT COUNT(*) c FROM users WHERE created_at >= datetime('now','-7 days')"),
  };
}

module.exports = {
  publicUser, findByEmail, findById, create, update, registerFailedLogin, registerSuccessfulLogin,
  clearLock, countActiveAdmins, list, remove, stats,
};
