// Lógica de login, registro y recuperación de contraseña.
import { api } from './api.js';
import { icon } from './icons.js';
import { $, safeNext } from './utils.js';
import { toggleTheme, getTheme, setLoading, showFieldErrors, clearFieldErrors, setFormError, liveValidate, runRules, validators as v, passwordToggle, toast } from './ui.js';

const page = document.body.dataset.page;
const form = $('#form');

// Tema
const themeBtn = $('#theme-btn');
const paintTheme = () => { themeBtn.innerHTML = icon(getTheme() === 'dark' ? 'sun' : 'moon'); };
paintTheme();
themeBtn.addEventListener('click', () => { toggleTheme(); paintTheme(); });

document.querySelectorAll('[data-toggle-password]').forEach((b) => { b.innerHTML = icon('eye'); });
passwordToggle();

function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) s++;
  if (pw.length >= 12) s++;
  if (/[^A-Za-z0-9]/.test(pw) || (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && pw.length >= 10)) s++;
  return pw ? Math.max(1, s) : 0;
}
function bindStrength() {
  const input = form.elements.password;
  const bar = $('#strength'), label = $('#strength-label');
  if (!bar) return;
  const names = ['', 'Débil', 'Aceptable', 'Buena', 'Excelente'];
  input.addEventListener('input', () => { const l = strength(input.value); bar.dataset.level = l; label.textContent = names[l] ? `Seguridad: ${names[l]}` : ''; });
}

const confirmRule = () => (val, f) => (val !== f.elements.password.value ? 'Las contraseñas no coinciden.' : '');

async function submit(rules, call, onOk) {
  clearFieldErrors(form); setFormError(form, '');
  const errs = runRules(form, rules);
  if (Object.keys(errs).length) { showFieldErrors(form, errs); return; }
  const btn = $('button[type=submit]', form);
  setLoading(btn, true);
  try { await onOk(await call()); }
  catch (e) {
    setLoading(btn, false);
    if (e.fields && Object.keys(e.fields).length) showFieldErrors(form, e.fields);
    else setFormError(form, e.message);
  }
}

if (page === 'login') {
  api.get('/api/public-config').then((c) => { if (!c.allowRegistration) $('#register-link').hidden = true; }).catch(() => {});
  const params = new URLSearchParams(location.search);
  if (params.get('expired')) setFormError(form, 'Tu sesión expiró. Inicia sesión de nuevo.');
  if (params.get('reset')) toast('Contraseña actualizada. Inicia sesión.');
  const rules = { email: v.email, password: v.required('La contraseña') };
  liveValidate(form, { email: v.email });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit(rules, () => api.post('/api/auth/login', { email: form.elements.email.value.trim(), password: form.elements.password.value }, { silent401: true }),
      () => { location.href = safeNext(params.get('next')); });
  });
}

if (page === 'register') {
  bindStrength();
  const rules = { name: (x) => (x.trim().length < 2 ? 'Escribe tu nombre (mínimo 2 letras).' : ''), email: v.email, password: v.password, confirm: confirmRule() };
  liveValidate(form, rules);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit(rules, () => api.post('/api/auth/register', { name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), password: form.elements.password.value }, { silent401: true }),
      () => { location.href = '/app'; });
  });
}

if (page === 'forgot') {
  liveValidate(form, { email: v.email });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit({ email: v.email }, () => api.post('/api/auth/forgot-password', { email: form.elements.email.value.trim() }),
      (r) => { form.hidden = true; $('#done').hidden = false; $('#done-msg').textContent = r.message; });
  });
}

if (page === 'reset') {
  const token = new URLSearchParams(location.search).get('token');
  bindStrength();
  if (!token) { form.hidden = true; $('.lead').textContent = ''; setFormError(form, ''); $('#back').insertAdjacentHTML('beforebegin', '<div class="form-error">El enlace no es válido. Solicita uno nuevo desde “¿Olvidaste tu contraseña?”.</div>'); }
  const rules = { password: v.password, confirm: confirmRule() };
  liveValidate(form, rules);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit(rules, () => api.post('/api/auth/reset-password', { token, password: form.elements.password.value }, { silent401: true }),
      () => { form.hidden = true; $('#back').hidden = true; $('#done').hidden = false; $('.lead').hidden = true; document.querySelector('.auth-card > h2').hidden = true; history.replaceState(null, '', '/reset.html'); });
  });
}
