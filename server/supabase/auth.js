'use strict';
const config = require('../config');
const { setSessionCookies, clearSessionCookies } = require('./session');
const { AppError, badRequest, unauthorized } = require('../utils/errors');

async function authRequest(path, { method = 'POST', body, accessToken } = {}) {
  const headers = { apikey: config.supabaseAnonKey, 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const response = await fetch(`${config.supabaseUrl}/auth/v1${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = String(data.msg || data.message || data.error_description || '');
    const errorCode = String(data.code || data.error_code || '').toLowerCase();
    const safeCode = /^[a-z0-9_.-]{1,64}$/.test(errorCode) ? errorCode : 'unknown';
    // Log only the fixed endpoint, status, and provider error code. Never log the
    // request body, email, password, access token, or raw provider message.
    console.warn(`[supabase-auth] ${method} ${path.split('?')[0]} status=${response.status} code=${safeCode}`);

    if (errorCode === 'email_address_not_authorized' || /email address not authorized/i.test(message)) {
      throw new AppError(503, 'AUTH_EMAIL_PROVIDER_UNCONFIGURED', 'Supabase no puede enviar la confirmación a este correo. El administrador debe configurar SMTP personalizado en Supabase.');
    }
    if (errorCode === 'over_email_send_rate_limit' || /email rate limit exceeded/i.test(message)) {
      throw new AppError(429, 'AUTH_EMAIL_RATE_LIMIT', 'Supabase alcanzó el límite temporal de correos. Inténtalo más tarde o configura SMTP personalizado.');
    }
    if (response.status === 400 || response.status === 422) {
      const translated = /already registered/i.test(message) ? 'Ya existe una cuenta con ese correo.'
        : /invalid login credentials/i.test(message) ? 'Correo o contraseña incorrectos.'
          : /email not confirmed/i.test(message) ? 'Confirma tu correo antes de iniciar sesión.'
            : /password/i.test(message) ? 'La contraseña no cumple los requisitos de Supabase.'
              : 'No fue posible procesar la solicitud. Revisa los datos e inténtalo de nuevo.';
      throw new AppError(response.status === 422 ? 409 : 400, 'AUTH_VALIDATION', translated);
    }
    if (response.status === 401) throw unauthorized('Correo o contraseña incorrectos.');
    throw new AppError(response.status >= 500 ? 502 : response.status, 'SUPABASE_AUTH', 'El servicio de autenticación no pudo completar la solicitud.');
  }
  return data;
}

const setAuthSession = (res, data) => {
  if (data && data.access_token && data.refresh_token) setSessionCookies(res, data);
};

async function register(req, res) {
  const { name, email, password } = req.valid.body;
  const redirectTo = `${config.appUrl}/app`;
  const data = await authRequest(`/signup?redirect_to=${encodeURIComponent(redirectTo)}`, { body: { email, password, data: { full_name: name } } });
  setAuthSession(res, data.session || data);
  const hasSession = Boolean(data.access_token || data.session?.access_token);
  const user = data.user || (data.id ? data : null);
  if (!user) throw new AppError(502, 'SUPABASE_AUTH', 'Supabase no devolvió el usuario registrado.');
  res.status(hasSession ? 201 : 202).json({
    user: { id: user.id, name: user.user_metadata?.full_name || name, email: user.email, role: 'user', isActive: true },
    ...(hasSession ? {} : { message: 'Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.' }),
  });
}

async function login(req, res) {
  const { email, password } = req.valid.body;
  const data = await authRequest('/token?grant_type=password', { body: { email, password } });
  setAuthSession(res, data);
  res.json({ user: { id: data.user.id, name: data.user.user_metadata?.full_name || data.user.email.split('@')[0], email: data.user.email, role: 'user', isActive: true } });
}

async function logout(req, res) {
  const token = req.cookies?.finpro_sb_at;
  if (token) {
    try { await authRequest('/logout', { accessToken: token }); } catch { /* la cookie se revoca localmente aunque la sesión ya expirara */ }
  }
  clearSessionCookies(res);
  res.clearCookie(config.cookieName, { httpOnly: true, sameSite: 'lax', secure: config.cookieSecure, path: '/' });
  res.json({ ok: true });
}

async function forgot(req, res) {
  const redirectTo = `${config.appUrl}/reset.html`;
  await authRequest(`/recover?redirect_to=${encodeURIComponent(redirectTo)}`, { body: { email: req.valid.body.email } });
  res.json({ ok: true, message: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.' });
}

async function verifyReset(req, res) {
  const tokenHash = req.body?.tokenHash;
  if (typeof tokenHash !== 'string' || tokenHash.length < 20 || tokenHash.length > 512) throw badRequest('El enlace de recuperación no es válido.');
  const data = await authRequest('/verify', { body: { token_hash: tokenHash, type: 'recovery' } });
  setAuthSession(res, data);
  res.json({ ok: true });
}

async function reset(req, res) {
  const tokenHash = req.body?.tokenHash || req.body?.token;
  if (typeof tokenHash !== 'string' || tokenHash.length < 20 || tokenHash.length > 512) throw badRequest('El enlace de recuperación no es válido.');
  const data = await authRequest('/verify', { body: { token_hash: tokenHash, type: 'recovery' } });
  if (!data.access_token) throw badRequest('El enlace de recuperación es inválido o ya expiró.');
  const user = await authRequest('/user', { method: 'PUT', accessToken: data.access_token, body: { password: req.valid.body.password } });
  clearSessionCookies(res);
  res.json({ ok: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.', user: { id: user.id } });
}

async function completeRecovery(req, res) {
  const { accessToken, password } = req.valid.body;
  await authRequest('/user', { method: 'PUT', accessToken, body: { password } });
  res.json({ ok: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
}

async function updateProfile(req, res) {
  const { name, email } = req.valid.body;
  const changes = { data: { ...req.user.user_metadata, full_name: name } };
  if (email !== req.user.email) changes.email = email;
  await authRequest('/user', { method: 'PUT', accessToken: req.supabaseAccessToken, body: changes });
  const { error } = await req.supabase.from('profiles').update({ full_name: name }).eq('id', req.user.id);
  if (error) throw new AppError(400, 'PROFILE_UPDATE', 'No se pudo actualizar el perfil.');
  res.json({ user: { ...req.user, name, email } });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.valid.body;
  if (currentPassword === newPassword) throw badRequest('La nueva contraseña debe ser diferente.', { newPassword: 'La nueva contraseña debe ser diferente.' });
  await authRequest('/token?grant_type=password', { body: { email: req.user.email, password: currentPassword } });
  await authRequest('/user', { method: 'PUT', accessToken: req.supabaseAccessToken, body: { password: newPassword } });
  res.json({ ok: true, message: 'Contraseña actualizada.' });
}

async function deleteAccount(req, res) {
  await authRequest('/token?grant_type=password', { body: { email: req.user.email, password: req.valid.body.password } });
  const { error } = await req.supabase.rpc('delete_own_account');
  if (error) throw new AppError(400, 'ACCOUNT_DELETE', 'No se pudo eliminar la cuenta.');
  clearSessionCookies(res);
  res.json({ ok: true });
}

async function logoutOthers(req, res) {
  try { await authRequest('/logout?scope=others', { accessToken: req.supabaseAccessToken }); }
  catch { /* Supabase may reject scopes unsupported by a project; current session remains valid. */ }
  res.json({ ok: true });
}

module.exports = { authRequest, register, login, logout, forgot, verifyReset, reset, completeRecovery, updateProfile, changePassword, deleteAccount, logoutOthers };
