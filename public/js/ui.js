// Componentes de interfaz: toasts, modales, confirmaciones, validación de formularios, tema.
import { html, raw, esc, $, $$ } from './utils.js';
import { icon } from './icons.js';

// ── Tema ──
export function getTheme() { return document.documentElement.getAttribute('data-theme') || 'dark'; }
export function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('finpro_theme', t); } catch { /* sin almacenamiento */ }
  document.dispatchEvent(new CustomEvent('themechange', { detail: t }));
}
export const toggleTheme = () => setTheme(getTheme() === 'dark' ? 'light' : 'dark');

// ── Toasts ──
export function toast(message, type = 'ok') {
  let root = $('#toasts');
  if (!root) { root = document.createElement('div'); root.id = 'toasts'; root.className = 'toasts'; root.setAttribute('role', 'status'); root.setAttribute('aria-live', 'polite'); document.body.appendChild(root); }
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' error' : '');
  el.innerHTML = `${icon(type === 'error' ? 'alert' : 'check')}<span>${esc(message)}</span>`;
  root.appendChild(el);
  setTimeout(() => { el.classList.add('leaving'); setTimeout(() => el.remove(), 220); }, type === 'error' ? 6000 : 3500);
}

// ── Modales ──
let lastFocus = null;
export function openModal(content, { onClose, label = 'Diálogo' } = {}) {
  lastFocus = document.activeElement;
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(label)}">${content.toString()}</div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  const modal = $('.modal', overlay);

  const close = (result) => {
    document.removeEventListener('keydown', onKey, true);
    overlay.remove();
    if (!$$('.overlay').length) document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    if (onClose) onClose(result);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    if (e.key === 'Tab') {
      const f = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal).filter((x) => !x.disabled && x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener('keydown', onKey, true);
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
  $$('[data-close]', modal).forEach((b) => b.addEventListener('click', () => close()));
  const first = $('input:not([type=hidden]):not([type=radio]), select, textarea', modal) || $('button', modal);
  setTimeout(() => first && first.focus(), 30);
  return { el: modal, close };
}

export const modalHead = (title) => html`<div class="modal-head"><h2>${title}</h2><button class="btn btn-icon" type="button" data-close aria-label="Cerrar">${raw(icon('x'))}</button></div>`;

export function confirmDialog({ title, message, confirmText = 'Confirmar', danger = false }) {
  return new Promise((resolve) => {
    let result = false;
    const m = openModal(html`${modalHead(title)}<p class="msg">${message}</p>
      <div class="modal-actions"><button class="btn btn-ghost" data-close type="button">Cancelar</button>
      <button class="btn ${danger ? 'btn-danger-solid' : 'btn-primary'}" id="cf-ok" type="button">${confirmText}</button></div>`, { label: title, onClose: () => resolve(result) });
    $('#cf-ok', m.el).addEventListener('click', () => { result = true; m.close(); });
  });
}

// Pide la contraseña y ejecuta la acción; muestra el error en el propio diálogo.
export function passwordDialog({ title, message, confirmText, danger = true, action }) {
  return new Promise((resolve) => {
    let done = false;
    const m = openModal(html`${modalHead(title)}<p class="msg">${message}</p>
      <form id="pw-form" novalidate style="margin-top:14px">
        <div class="form-error" id="pw-err" hidden></div>
        <div class="field"><label for="pw-input">Contraseña</label><input class="input" id="pw-input" type="password" autocomplete="current-password" required></div>
        <div class="modal-actions"><button class="btn btn-ghost" data-close type="button">Cancelar</button>
        <button class="btn ${danger ? 'btn-danger-solid' : 'btn-primary'}" type="submit">${confirmText}</button></div>
      </form>`, { label: title, onClose: () => resolve(done) });
    const form = $('#pw-form', m.el);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = $('#pw-input', m.el).value;
      const err = $('#pw-err', m.el);
      err.hidden = true;
      if (!pw) { err.textContent = 'Ingresa tu contraseña.'; err.hidden = false; return; }
      const btn = $('button[type=submit]', m.el);
      setLoading(btn, true);
      try { await action(pw); done = true; m.close(); }
      catch (ex) { err.textContent = ex.message; err.hidden = false; setLoading(btn, false); }
    });
  });
}

// ── Formularios ──
export function setLoading(btn, loading, text) {
  if (!btn) return;
  if (loading) {
    btn.dataset.label = btn.innerHTML;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = `<span class="spinner"></span>${text ? esc(text) : ''}`;
  } else {
    btn.disabled = false;
    btn.removeAttribute('aria-busy');
    if (btn.dataset.label) btn.innerHTML = btn.dataset.label;
  }
}
export function showFieldErrors(form, fields = {}) {
  clearFieldErrors(form);
  let firstEl = null;
  for (const [name, msg] of Object.entries(fields)) {
    const input = form.elements[name];
    const field = input && input.closest && input.closest('.field');
    if (!field) continue;
    field.classList.add('invalid');
    const err = $('.error', field);
    if (err) err.textContent = msg;
    if (input.setAttribute) input.setAttribute('aria-invalid', 'true');
    firstEl ||= input;
  }
  if (firstEl && firstEl.focus) firstEl.focus();
  return !!firstEl;
}
export function clearFieldErrors(form) {
  $$('.field.invalid', form).forEach((f) => f.classList.remove('invalid'));
  $$('[aria-invalid]', form).forEach((i) => i.removeAttribute('aria-invalid'));
}
export function setFormError(form, msg) {
  const box = $('.form-error', form);
  if (!box) return;
  box.textContent = msg || '';
  box.hidden = !msg;
}
// Valida un campo al salir de él (feedback inmediato)
export function liveValidate(form, rules) {
  Object.keys(rules).forEach((name) => {
    const input = form.elements[name];
    if (!input) return;
    input.addEventListener('blur', () => {
      const msg = rules[name](input.value, form);
      const field = input.closest('.field');
      field.classList.toggle('invalid', !!msg);
      const err = $('.error', field);
      if (err) err.textContent = msg || '';
    });
    input.addEventListener('input', () => { const f = input.closest('.field'); if (f.classList.contains('invalid') && !rules[name](input.value, form)) { f.classList.remove('invalid'); } });
  });
}
export const validators = {
  required: (label) => (v) => (String(v).trim() ? '' : `${label} es obligatorio.`),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) ? '' : 'Ingresa un correo válido.'),
  password: (v) => (String(v).length < 8 ? 'Usa al menos 8 caracteres.' : !/[A-Za-z]/.test(v) || !/\d/.test(v) ? 'Incluye al menos una letra y un número.' : ''),
  amount: (v) => { const n = Number(v); return !v || !Number.isFinite(n) || n <= 0 ? 'Ingresa un monto mayor que 0.' : n > 999999999999 ? 'El monto es demasiado grande.' : Math.abs(n * 100 - Math.round(n * 100)) > 1e-6 ? 'Máximo 2 decimales.' : ''; },
};
export function runRules(form, rules) {
  const errs = {};
  for (const [name, rule] of Object.entries(rules)) {
    const el = form.elements[name];
    const msg = rule(el ? el.value : '', form);
    if (msg) errs[name] = msg;
  }
  return errs;
}

export function passwordToggle(root = document) {
  $$('[data-toggle-password]', root).forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.input-wrap').querySelector('input');
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = icon(show ? 'eyeoff' : 'eye');
      btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  });
}
