'use strict';
const { getDb } = require('../db');
const { sha256 } = require('../utils/crypto');

function create(userId, token, minutes) {
  const db = getDb();
  db.prepare('DELETE FROM password_resets WHERE user_id = ?').run(userId);
  const expires = new Date(Date.now() + minutes * 60000).toISOString();
  db.prepare('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)').run(userId, sha256(token), expires);
}

function findValid(token) {
  const row = getDb().prepare('SELECT * FROM password_resets WHERE token_hash = ?').get(sha256(token));
  if (!row || row.used_at || new Date(row.expires_at).getTime() <= Date.now()) return null;
  return row;
}

const markUsed = (id) =>
  getDb().prepare("UPDATE password_resets SET used_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?").run(id);

module.exports = { create, findValid, markUsed };
