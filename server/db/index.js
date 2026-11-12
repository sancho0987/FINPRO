'use strict';
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite'); // SQLite incluido en Node ≥ 22.13 (sin compilar nada)
const config = require('../config');

let db = null;

// Pequeño envoltorio para ofrecer transaction() sobre node:sqlite
function enhance(conn) {
  conn.transaction = (fn) => (...args) => {
    conn.exec('BEGIN');
    try {
      const result = fn(...args);
      conn.exec('COMMIT');
      return result;
    } catch (err) {
      try { conn.exec('ROLLBACK'); } catch { /* ya revertida */ }
      throw err;
    }
  };
  return conn;
}

function runMigrations(conn) {
  conn.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  )`);
  const dir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const applied = new Set(conn.prepare('SELECT name FROM schema_migrations').all().map((r) => r.name));
  const applyOne = conn.transaction((file) => {
    conn.exec(fs.readFileSync(path.join(dir, file), 'utf8'));
    conn.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(file);
  });
  const done = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    applyOne(file);
    done.push(file);
  }
  return done;
}

function getDb() {
  if (db) return db;
  if (config.databasePath !== ':memory:') fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });
  db = enhance(new DatabaseSync(config.databasePath));
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  runMigrations(db);
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, closeDb, runMigrations };
