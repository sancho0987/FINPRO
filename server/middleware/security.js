'use strict';
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { AppError } = require('../utils/errors');

const helmetMw = () =>
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'style-src-attr': ["'unsafe-inline'"], // colores dinámicos de categorías/miembros
        'img-src': ["'self'", 'data:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'frame-ancestors': ["'none'"],
        ...(config.isProd && config.cookieSecure ? { 'upgrade-insecure-requests': [] } : {}),
      },
    },
    hsts: config.isProd && config.cookieSecure,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' },
  });

// Defensa CSRF: SameSite=Lax + cabecera personalizada (no se puede enviar entre sitios sin CORS)
// + verificación de Origin cuando el navegador lo envía.
function csrfGuard(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('x-requested-with') !== 'FINPRO') {
    return next(new AppError(403, 'CSRF', 'Solicitud no permitida.'));
  }
  const origin = req.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== req.get('host')) {
        return next(new AppError(403, 'CSRF', 'Origen no permitido.'));
      }
    } catch {
      return next(new AppError(403, 'CSRF', 'Origen no permitido.'));
    }
  }
  next();
}

const limiter = (opts) =>
  config.rateLimit.enabled
    ? rateLimit({
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req, res) =>
          res.status(429).json({ error: { code: 'RATE_LIMIT', message: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' } }),
        ...opts,
      })
    : (_req, _res, next) => next();

const authLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 20 });
const apiLimiter = limiter({ windowMs: 60 * 1000, limit: 300 });

module.exports = { helmetMw, csrfGuard, authLimiter, apiLimiter };
