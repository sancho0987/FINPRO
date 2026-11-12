'use strict';
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { getDb } = require('./db');
const { helmetMw, csrfGuard, apiLimiter } = require('./middleware/security');
const { pageAuth, redirectIfLoggedIn } = require('./middleware/auth');
const { notFoundApi, errorHandler } = require('./middleware/errors');
const sessions = require('./models/sessions');
const routes = require('./routes');

function createApp() {
  getDb(); // abre la base y ejecuta migraciones pendientes
  sessions.purgeExpired();

  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', config.trustProxy);

  app.use(helmetMw());
  app.use(express.json({ limit: '50kb' }));
  app.use(cookieParser());

  // ── API ──
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api', apiLimiter, csrfGuard, routes, notFoundApi);

  // ── Librerías del frontend servidas localmente (sin CDN) ──
  const nm = path.join(config.root, 'node_modules');
  app.use('/vendor/chart', express.static(path.join(nm, 'chart.js', 'dist'), { index: false, maxAge: '7d' }));
  app.use('/vendor/fonts/sora', express.static(path.join(nm, '@fontsource', 'sora'), { index: false, maxAge: '30d' }));
  app.use('/vendor/fonts/dm-mono', express.static(path.join(nm, '@fontsource', 'dm-mono'), { index: false, maxAge: '30d' }));

  // ── Páginas ──
  const page = (name) => (_req, res) => res.sendFile(path.join(config.publicDir, name));
  app.get('/', (req, res) => res.redirect('/app'));
  app.get('/app', pageAuth(), (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(path.join(config.publicDir, 'app.html'));
  });
  app.get(['/login', '/login.html'], redirectIfLoggedIn, page('login.html'));
  app.get(['/register', '/register.html'], redirectIfLoggedIn, page('register.html'));

  app.use(express.static(config.publicDir, { index: false, maxAge: config.isProd ? '1h' : 0, extensions: ['html'] }));

  app.use((req, res) => res.status(404).sendFile(path.join(config.publicDir, '404.html')));
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
