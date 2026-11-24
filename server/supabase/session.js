'use strict';
const config = require('../config');
const { createSupabase } = require('./client');
const { unauthorized, forbidden } = require('../utils/errors');

const ACCESS_COOKIE = 'finpro_sb_at';
const REFRESH_COOKIE = 'finpro_sb_rt';
const baseCookie = { httpOnly: true, sameSite: 'lax', secure: config.cookieSecure, path: '/' };

function setSessionCookies(res, session) {
  res.cookie(ACCESS_COOKIE, session.access_token, { ...baseCookie, maxAge: Math.max(60, session.expires_in || 3600) * 1000 });
  res.cookie(REFRESH_COOKIE, session.refresh_token, { ...baseCookie, maxAge: config.sessionTtlDays * 86400000 });
}

function clearSessionCookies(res) {
  res.clearCookie(ACCESS_COOKIE, baseCookie);
  res.clearCookie(REFRESH_COOKIE, baseCookie);
}

async function loadSupabaseSession(req, res) {
  const access = req.cookies && req.cookies[ACCESS_COOKIE];
  const refresh = req.cookies && req.cookies[REFRESH_COOKIE];
  if (!access && !refresh) return null;

  const authClient = createSupabase();
  let session = null;
  let user = null;
  if (access) {
    const checked = await authClient.auth.getUser(access);
    if (!checked.error) user = checked.data.user;
  }
  if (!user && refresh) {
    const renewed = await authClient.auth.refreshSession({ refresh_token: refresh });
    if (!renewed.error && renewed.data.session) {
      session = renewed.data.session;
      user = renewed.data.user;
      setSessionCookies(res, session);
    }
  }
  if (!user) {
    clearSessionCookies(res);
    return null;
  }

  const db = createSupabase(session ? session.access_token : access);
  const membership = await db.from('household_members').select('household_id,role').eq('user_id', user.id).maybeSingle();
  if (membership.error || !membership.data) return null;
  req.supabase = db;
  req.householdId = membership.data.household_id;
  req.membershipRole = membership.data.role;
  req.sessionId = null;
  req.user = {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
    userMetadata: user.user_metadata || {},
    email: user.email,
    role: membership.data.role === 'owner' || membership.data.role === 'admin' ? 'admin' : 'user',
    isActive: true,
    createdAt: user.created_at,
    lastLoginAt: user.last_sign_in_at,
  };
  return { user: req.user, accessToken: session ? session.access_token : access };
}

async function requireSupabaseAuth(req, res, next) {
  try {
    const session = await loadSupabaseSession(req, res);
    if (!session) return next(unauthorized());
    req.supabaseAccessToken = session.accessToken;
    next();
  } catch (error) { next(error); }
}

async function pageSupabaseAuth(req, res, next, adminOnly = false) {
  try {
    const session = await loadSupabaseSession(req, res);
    if (!session) return res.redirect('/login.html?next=' + encodeURIComponent(req.path));
    if (adminOnly && req.user.role !== 'admin') return res.redirect('/app');
    next();
  } catch (error) { next(error); }
}

async function redirectIfSupabaseLoggedIn(req, res, next) {
  try {
    if (await loadSupabaseSession(req, res)) return res.redirect('/app');
    next();
  } catch (error) { next(error); }
}

module.exports = { ACCESS_COOKIE, REFRESH_COOKIE, setSessionCookies, clearSessionCookies, loadSupabaseSession, requireSupabaseAuth, pageSupabaseAuth, redirectIfSupabaseLoggedIn };
