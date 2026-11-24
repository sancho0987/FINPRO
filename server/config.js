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
  supabaseUrl: (env.SUPABASE_URL || '').replace(/\/+$/, ''),
  supabaseAnonKey: env.SUPABASE_ANON_KEY || '',
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
