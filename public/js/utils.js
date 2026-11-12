// Utilidades compartidas: escape HTML seguro, formato de dinero y fechas.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"'`]/g, (c) => ESC[c]);

// Plantillas HTML que escapan por defecto todo valor interpolado (previene XSS).
class Safe { constructor(s) { this.s = s; } toString() { return this.s; } }
export const raw = (s) => new Safe(String(s ?? ''));
const render = (v) => {
  if (v instanceof Safe) return v.s;
  if (Array.isArray(v)) return v.map(render).join('');
  if (v === null || v === undefined || v === false) return '';
  return esc(v);
};
export function html(strings, ...vals) {
  let out = strings[0];
  vals.forEach((v, i) => { out += render(v) + strings[i + 1]; });
  return new Safe(out);
}
export const setHtml = (el, safe) => { el.innerHTML = safe instanceof Safe ? safe.s : esc(safe); };

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ── Dinero ──
let currency = 'COP';
let fmtCache = {};
export function setCurrency(c) { currency = c; fmtCache = {}; }
export function getCurrency() { return currency; }
export function money(n, { sign = false } = {}) {
  const key = currency;
  fmtCache[key] ||= new Intl.NumberFormat('es-CO', { style: 'currency', currency: key, minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const v = Number(n) || 0;
  const s = fmtCache[key].format(Math.abs(v));
  if (sign) return (v < 0 ? '−' : '+') + s;
  return v < 0 ? '−' + s : s;
}
export const moneyCompact = (n) =>
  new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(n) || 0);

// ── Fechas (siempre en hora local, nunca vía toISOString) ──
const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => ymd(new Date());
export const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const fmtDate = (s, opts = { day: '2-digit', month: 'short' }) => parseYmd(s).toLocaleDateString('es-CO', opts);
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const monthName = (m) => MONTHS[m];
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Período financiero (igual lógica que el servidor)
export function periodRange(year, month, cutoff = 1) {
  const norm = (y, m) => ({ y: y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 });
  const s = norm(year, month);
  const from = `${s.y}-${pad(s.m + 1)}-${pad(cutoff)}`;
  let to;
  if (cutoff === 1) to = ymd(new Date(s.y, s.m + 1, 0));
  else { const n = norm(s.y, s.m + 1); to = `${n.y}-${pad(n.m + 1)}-${pad(cutoff - 1)}`; }
  return { from, to };
}
export function currentPeriod(cutoff = 1) {
  const t = new Date();
  let y = t.getFullYear(), m = t.getMonth();
  if (t.getDate() < cutoff) { m -= 1; if (m < 0) { m = 11; y -= 1; } }
  return { year: y, month: m };
}
export function periodLabel(year, month, cutoff = 1) {
  if (cutoff === 1) return `${cap(monthName(month))} ${year}`;
  const { from, to } = periodRange(year, month, cutoff);
  const f = fmtDate(from, { day: 'numeric', month: 'short' });
  const t = fmtDate(to, { day: 'numeric', month: 'short' });
  return `${f} – ${t}`;
}

export const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
export const initials = (name) => (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
export const safeNext = (n) => (typeof n === 'string' && /^\/(?!\/)[\w\-./?=&%#]*$/.test(n) ? n : '/app');
