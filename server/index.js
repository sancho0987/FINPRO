'use strict';
const config = require('./config');
const { createApp } = require('./app');
const { closeDb } = require('./db');
const sessions = require('./models/sessions');

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`\n  FINPRO listo →  ${config.appUrl}   (${config.nodeEnv})`);
  if (!config.smtp.enabled) console.log('  ⚠ SMTP no configurado: los enlaces de recuperación se imprimen en esta consola.');
  console.log('');
});

const purge = setInterval(() => sessions.purgeExpired(), 60 * 60 * 1000);
purge.unref();

function shutdown() {
  server.close(() => {
    closeDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
