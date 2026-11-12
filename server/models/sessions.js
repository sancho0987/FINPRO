'use strict';
const { getDb } = require('../db');
const { sha256 } = require('../utils/crypto');

function create(userId, token, ttlDays, meta = {}) {
  const expires = new Date(Date.now() + ttlDays * 86400000).toISOString();
  getDb()
    .prepare('INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?)')
    .run(userId, sha256(token), expires, (meta.userAgent || '').slice(0, 255), meta.ip || null);
  return expires;
}

function findValid(token) {
  const row = getDb()
    .prepare(
      `SELECT s.id AS session_id, s.expires_at, s.last_used_at, u.*
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(sha256(token));
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    getDb().prepare('DELETE FROM sessions WHERE id = ?').run(row.session_id);
    return null;
  }
  return row;
}

function touch(sessionId, ttlDays) {
  const expires = new Date(Date.now() + ttlDays * 86400000).toISOString();
  getDb()
    .prepare("UPDATE sessions SET last_used_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'), expires_at = ? WHERE id = ?")
    .run(expires, sessionId);
}

const destroyByToken = (token) => getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
const destroyAllForUser = (userId, exceptSessionId) =>
  exceptSessionId
    ? getDb().prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').run(userId, exceptSessionId)
    : getDb().prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
const purgeExpired = () => getDb().prepare("DELETE FROM sessions WHERE expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ','now')").run();

module.exports = { create, findValid, touch, destroyByToken, destroyAllForUser, purgeExpired };
