'use strict';
const express = require('express');
const { z } = require('zod');
const config = require('../config');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/security');
const { requireSupabaseAuth, clearSessionCookies } = require('../supabase/session');
const auth = require('../supabase/auth');
const { makeRouterHandlers } = require('../supabase/api');
const S = require('../validators/schemas');
const { AppError } = require('../utils/errors');

const api = express.Router();
const resetVerification = z.object({ tokenHash: z.string().min(20).max(512) });
const resetBody = z.object({ tokenHash: z.string().min(20).max(512).optional(), token: z.string().min(20).max(512).optional(), password: S.auth.reset.shape.password })
  .refine((v) => v.tokenHash || v.token, 'El enlace de recuperación no es válido.');
const recoveryBody = z.object({ accessToken: z.string().min(20).max(4096), password: S.auth.reset.shape.password });

api.get('/health', (_req, res) => res.json({ ok: true, name: 'finpro', database: 'supabase', time: new Date().toISOString() }));
api.get('/public-config', (_req, res) => res.json({ allowRegistration: config.allowRegistration, database: 'supabase' }));

api.post('/auth/register', authLimiter, validate('body', S.auth.register), auth.register);
api.post('/auth/login', authLimiter, validate('body', S.auth.login), auth.login);
api.post('/auth/logout', auth.logout);
api.post('/auth/forgot-password', authLimiter, validate('body', S.auth.forgot), auth.forgot);
api.post('/auth/verify-reset', authLimiter, validate('body', resetVerification), auth.verifyReset);
api.post('/auth/reset-password', authLimiter, validate('body', resetBody), auth.reset);
api.post('/auth/complete-recovery', authLimiter, validate('body', recoveryBody), auth.completeRecovery);

api.use(requireSupabaseAuth);
api.post('/auth/logout-others', auth.logoutOthers);
api.patch('/auth/me', validate('body', S.auth.profile), auth.updateProfile);
api.post('/auth/change-password', authLimiter, validate('body', S.auth.changePassword), auth.changePassword);
api.delete('/auth/me', validate('body', S.auth.confirmPassword), auth.deleteAccount);

makeRouterHandlers(api);
module.exports = api;
