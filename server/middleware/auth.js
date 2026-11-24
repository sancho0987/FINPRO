'use strict';
const config = require('../config');
const sessions = require('../models/sessions');
const users = require('../models/users');
const { unauthorized, forbidden } = require('../utils/errors');

const TOUCH_AFTER_MS = 10 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
    maxAge: config.sessionTtlDays * 86400000,
  };
}

function loadSession(req) {
  const token = req.cookies && req.cookies[config.cookieName];
  if (!token || typeof token !== 'string' || token.length > 200) return null;
  const row = sessions.findValid(token);
  if (!row || !row.is_active) return null;
  if (Date.now() - new Date(row.last_used_at).getTime() > TOUCH_AFTER_MS) {
    sessions.touch(row.session_id, config.sessionTtlDays);
  }
  return { token, sessionId: row.session_id, user: row };
}

function requireAuth(req, _res, next) {
  const s = loadSession(req);
  if (!s) return next(unauthorized());
  req.sessionId = s.sessionId;
  req.sessionToken = s.token;
  req.user = users.publicUser(s.user);
  next();
}

function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') return next(forbidden('Se requiere rol de administrador.'));
  next();
}

// Para páginas HTML privadas: redirige a login si no hay sesión válida
const pageAuth = (adminOnly = false) => (req, res, next) => {
  if (config.useSupabase) return require('../supabase/session').pageSupabaseAuth(req, res, next, adminOnly);
  const s = loadSession(req);
  if (!s) return res.redirect('/login.html?next=' + encodeURIComponent(req.path));
  if (adminOnly && s.user.role !== 'admin') return res.redirect('/app');
  req.user = users.publicUser(s.user);
  next();
};

// Páginas de login/registro: si ya hay sesión, ir directo a la app
const redirectIfLoggedIn = (req, res, next) => {
  if (config.useSupabase) return require('../supabase/session').redirectIfSupabaseLoggedIn(req, res, next);
  if (loadSession(req)) return res.redirect('/app');
  next();
};

module.exports = { requireAuth, requireAdmin, pageAuth, redirectIfLoggedIn, cookieOptions };
