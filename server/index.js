'use strict';
const config = require('./config');
const { createApp } = require('./app');
const { closeDb } = require('./db');
const sessions = require('./models/sessions');

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`\n  FINPRO listo →  ${config.appUrl}   (${config.nodeEnv})`);
  if (config.useSupabase) console.log('  ✓ Supabase Auth + PostgreSQL habilitados (RLS por usuario/hogar).');
  if (!config.smtp.enabled && !config.useSupabase) console.log('  ⚠ SMTP no configurado: los enlaces de recuperación se imprimen en esta consola.');
  console.log('');
});

const purge = config.useSupabase ? null : setInterval(() => sessions.purgeExpired(), 60 * 60 * 1000);
if (purge) purge.unref();

function shutdown() {
  server.close(() => {
    if (!config.useSupabase) closeDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
