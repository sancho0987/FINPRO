// Shell de la aplicación: navegación, período, menú de usuario y enrutador por hash.
import { api, setUnauthorizedHandler } from './api.js';
import { html, raw, setHtml, $, $$, periodLabel, initials } from './utils.js';
import { icon } from './icons.js';
import { app, bus, loadMeta } from './store.js';
import { toast, toggleTheme, getTheme } from './ui.js';
import { destroyAll } from './charts.js';
import { openTxModal } from './forms.js';

const ROUTES = {
  dashboard: { title: 'Resumen', icon: 'home', period: true, load: () => import('./pages/dashboard.js') },
  gastos: { title: 'Movimientos', icon: 'receipt', period: true, load: () => import('./pages/gastos.js') },
  familia: { title: 'Familia', icon: 'users', period: true, load: () => import('./pages/familia.js') },
  reportes: { title: 'Reportes', icon: 'chart', period: true, load: () => import('./pages/reportes.js') },
  config: { title: 'Configuración', icon: 'settings', load: () => import('./pages/config.js') },
  perfil: { title: 'Mi perfil', icon: 'user', load: () => import('./pages/perfil.js') },
  usuarios: { title: 'Usuarios', icon: 'shield', admin: true, load: () => import('./pages/usuarios.js') },
};

let current = 'dashboard';
let renderId = 0;
const view = $('#view');

setUnauthorizedHandler(() => { location.href = '/login.html?expired=1'; });

// ── Estructura fija ──
function paintShell() {
  const u = app.user;
  const link = (key) => { const r = ROUTES[key]; return html`<a href="#/${key}" data-route="${key}">${raw(icon(r.icon))}<span>${r.title}</span></a>`; };
  setHtml($('#nav'), html`<div class="nav-group" style="padding-top:0">Principal</div>${['dashboard', 'gastos', 'familia', 'reportes'].map(link)}
    <div class="nav-group">Cuenta</div>${['config', 'perfil'].map(link)}${u.role === 'admin' ? link('usuarios') : ''}`);
  setHtml($('#user-chip'), html`<span class="avatar">${initials(u.name)}</span><span class="meta"><b>${u.name}</b><span>${u.role === 'admin' ? 'Administrador' : 'Usuario'}</span></span>`);
  setHtml($('#top-avatar'), html`<span class="avatar">${initials(u.name)}</span>`);
  setHtml($('#top-add'), html`${raw(icon('plus'))}Nuevo movimiento`);
  const tab = (key) => { const r = ROUTES[key]; return html`<a href="#/${key}" data-route="${key}">${raw(icon(r.icon))}<span>${r.title}</span></a>`; };
  setHtml($('#tabbar'), html`${tab('dashboard')}${tab('gastos')}<button class="fab" type="button" data-action="add-tx" aria-label="Nuevo movimiento">${raw(icon('plus'))}</button>${tab('familia')}${tab('reportes')}`);
  $('[data-action=period-prev]').innerHTML = icon('left');
  $('[data-action=period-next]').innerHTML = icon('right');
  paintTheme();
}
const paintTheme = () => { $('#top-theme').innerHTML = icon(getTheme() === 'dark' ? 'sun' : 'moon'); };

function paintPeriod() {
  $('#period-label').textContent = periodLabel(app.period.year, app.period.month, app.settings.cutoffDay);
}
function paintNav() {
  $$('[data-route]').forEach((a) => {
    if (a.dataset.route === current) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  $('#period').hidden = !ROUTES[current].period;
}

// ── Enrutador ──
const routeFromHash = () => {
  const key = (location.hash.replace(/^#\/?/, '').split('?')[0]) || 'dashboard';
  const r = ROUTES[key];
  if (!r || (r.admin && app.user.role !== 'admin')) return 'dashboard';
  return key;
};

async function render({ keepScroll = false } = {}) {
  const id = ++renderId;
  const scroll = window.scrollY;
  current = routeFromHash();
  paintNav(); paintPeriod();
  document.title = `${ROUTES[current].title} — FINPRO`;
  destroyAll();
  const root = document.createElement('div');
  view.replaceChildren(root);
  root.innerHTML = '<div class="stack"><div class="skeleton" style="height:150px"></div><div class="skeleton" style="height:260px"></div></div>';
  try {
    const mod = await ROUTES[current].load();
    if (id !== renderId) return;
    root.innerHTML = '';
    await mod.render({ root, isCurrent: () => id === renderId });
    if (keepScroll) window.scrollTo(0, scroll); else if (!keepScroll) { window.scrollTo(0, 0); view.focus({ preventScroll: true }); }
  } catch (e) {
    if (id !== renderId) return;
    root.innerHTML = '';
    setHtml(root, html`<div class="panel"><div class="empty"><div class="em">⚠️</div><h3>No pudimos cargar esta sección</h3><p>${e.message || 'Ocurrió un error inesperado.'}</p><button class="btn btn-primary" type="button" data-action="reload">Reintentar</button></div></div>`);
  }
}

window.addEventListener('hashchange', () => render());
bus.addEventListener('data-changed', async (e) => {
  try { if (e.detail.meta) { await loadMeta(); paintShell(); paintNav(); } else { const b = await api.get('/api/bootstrap'); app.hasTransactions = b.hasTransactions; } } catch { /* la vista mostrará el error */ }
  render({ keepScroll: true });
});
document.addEventListener('themechange', () => { paintTheme(); render({ keepScroll: true }); });

// ── Menú de usuario ──
function closePopover() { $$('.popover').forEach((p) => p.remove()); }
function openUserMenu(trigger) {
  if ($('.popover')) { closePopover(); return; }
  const u = app.user;
  const pop = document.createElement('div');
  pop.className = 'popover';
  pop.setAttribute('role', 'menu');
  setHtml(pop, html`<div class="who"><b>${u.name}</b><span>${u.email}</span></div>
    <a href="#/config" role="menuitem">${raw(icon('settings'))}Configuración</a>
    <a href="#/perfil" role="menuitem">${raw(icon('user'))}Mi perfil</a>
    ${u.role === 'admin' ? html`<a href="#/usuarios" role="menuitem">${raw(icon('shield'))}Usuarios</a>` : ''}
    <button type="button" data-action="toggle-theme" role="menuitem">${raw(icon(getTheme() === 'dark' ? 'sun' : 'moon'))}${getTheme() === 'dark' ? 'Tema claro' : 'Tema oscuro'}</button>
    <button type="button" class="danger" data-action="logout" role="menuitem">${raw(icon('logout'))}Cerrar sesión</button>`);
  document.body.appendChild(pop);
  const r = trigger.getBoundingClientRect();
  const w = pop.offsetWidth, h = pop.offsetHeight;
  let left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8);
  if (r.right > window.innerWidth - 40) left = window.innerWidth - w - 12;
  const top = r.top > window.innerHeight / 2 ? r.top - h - 8 : r.bottom + 8;
  pop.style.left = left + 'px'; pop.style.top = Math.max(8, top) + 'px';
  setTimeout(() => $('a, button', pop)?.focus(), 20);
}

async function logout() {
  try { await api.post('/api/auth/logout', {}, { silent401: true }); } catch { /* da igual */ }
  location.href = '/login.html';
}

function shiftPeriod(d) {
  let m = app.period.month + d, y = app.period.year;
  if (m > 11) { m = 0; y++; } if (m < 0) { m = 11; y--; }
  app.period = { year: y, month: m };
  render({ keepScroll: true });
}

document.addEventListener('click', (e) => {
  const act = e.target.closest('[data-action]');
  if (!act) { if (!e.target.closest('.popover')) closePopover(); return; }
  const a = act.dataset.action;
  if (a === 'user-menu') { e.stopPropagation(); openUserMenu(act); return; }
  if (a !== 'toggle-theme' || !act.closest('.popover')) { /* mantener popover solo para nav links */ }
  closePopover();
  if (a === 'add-tx') openTxModal();
  else if (a === 'toggle-theme') toggleTheme();
  else if (a === 'logout') logout();
  else if (a === 'period-prev') shiftPeriod(-1);
  else if (a === 'period-next') shiftPeriod(1);
  else if (a === 'reload') render();
});
document.addEventListener('click', (e) => { if (e.target.closest('.popover a')) closePopover(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopover(); });

// ── Arranque ──
(async function init() {
  try {
    await loadMeta();
  } catch (e) {
    if (e.status !== 401) view.textContent = e.message;
    return;
  }
  paintShell();
  if (!location.hash) history.replaceState(null, '', '#/dashboard');
  render();
})();
