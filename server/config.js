'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const env = process.env;
const bool = (v, def) => (v === undefined || v === '' ? def : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase()));
const int = (v, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
};

const nodeEnv = env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';
const root = path.join(__dirname, '..');
const supabaseUrl = (env.SUPABASE_URL || '').replace(/\/+$/, '');
const supabaseAnonKey = env.SUPABASE_ANON_KEY || '';

function isPublicSupabaseKey(key) {
  if (/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key)) return true;
  try {
    const payload = key.split('.')[1];
    return Boolean(payload && JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).role === 'anon');
  } catch { return false; }
}

function validateProductionSupabase({ production, url, key }) {
  if (!production) return;
  if (!url || !key) throw new Error('Production requires SUPABASE_URL and SUPABASE_ANON_KEY; SQLite is not persistent on Render.');
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('Production SUPABASE_URL must be a valid HTTPS URL.'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('Production SUPABASE_URL must be a valid HTTPS project URL without credentials or path.');
  }
  if (!isPublicSupabaseKey(key)) throw new Error('Production SUPABASE_ANON_KEY must be a Supabase publishable or legacy anon key; secret keys are not allowed.');
}

validateProductionSupabase({ production: isProd, url: supabaseUrl, key: supabaseAnonKey });

const config = {
  nodeEnv,
  isProd,
  isTest: nodeEnv === 'test',
  root,
  publicDir: path.join(root, 'public'),
  port: int(env.PORT, 3000),
  appUrl: (env.APP_URL || env.RENDER_EXTERNAL_URL || `http://localhost:${int(env.PORT, 3000)}`).replace(/\/+$/, ''),
  databasePath:
    env.DATABASE_PATH === ':memory:'
      ? ':memory:'
      : path.resolve(root, env.DATABASE_PATH || './data/finpro.db'),
  supabaseUrl,
  supabaseAnonKey,
  sessionTtlDays: Math.max(1, int(env.SESSION_TTL_DAYS, 7)),
  bcryptRounds: Math.min(15, Math.max(4, int(env.BCRYPT_ROUNDS, 12))),
  allowRegistration: bool(env.ALLOW_REGISTRATION, true),
  cookieSecure: bool(env.COOKIE_SECURE, isProd),
  trustProxy: env.TRUST_PROXY ? int(env.TRUST_PROXY, 1) : false,
  cookieName: 'finpro_sid',
  resetTokenMinutes: 60,
  maxFailedLogins: 5,
  lockMinutes: 15,
  rateLimit: { enabled: nodeEnv !== 'test' },
  smtp: {
    host: env.SMTP_HOST || '',
    port: int(env.SMTP_PORT, 587),
    secure: bool(env.SMTP_SECURE, false),
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.MAIL_FROM || 'FINPRO <no-reply@finpro.local>',
  },
};
config.useSupabase = Boolean(config.supabaseUrl && config.supabaseAnonKey && !config.isTest);
config.smtp.enabled = Boolean(config.smtp.host);

module.exports = config;
module.exports.validateProductionSupabase = validateProductionSupabase;
