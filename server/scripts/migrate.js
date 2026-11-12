'use strict';
const { getDb, closeDb } = require('../db');
const db = getDb();
const rows = db.prepare('SELECT name, applied_at FROM schema_migrations ORDER BY name').all();
console.log('Migraciones aplicadas:');
rows.forEach((r) => console.log(`  ✔ ${r.name}  (${r.applied_at})`));
closeDb();
