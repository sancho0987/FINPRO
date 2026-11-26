import { api } from '../api.js';
import { html, raw, setHtml, $, $$, fmtDate, debounce } from '../utils.js';
import { icon } from '../icons.js';
import { app } from '../store.js';
import { toast, confirmDialog } from '../ui.js';
import { avatarMarkup } from '../components/avatar.js';

const F = { q: '', role: '', status: '', page: 1 };

export async function render({ root, isCurrent, signal }) {
  const [stats, list] = await Promise.all([
    api.get('/api/admin/stats', undefined, { signal }),
    api.get('/api/admin/users', { q: F.q, role: F.role, status: F.status, page: F.page, limit: 15 }, { signal }),
  ]);
  if (!isCurrent()) return;
  const st = stats.stats;
  const canManageAdmins = list.canManageAdmins ?? true;
  const opt = (v, cur, l) => html`<option value="${v}" ${raw(v === cur ? 'selected' : '')}>${l}</option>`;
  setHtml(root, html`
    <div class="page-head"><div><h1>Usuarios</h1><p>Administra las cuentas de FINPRO. Por privacidad no ves los movimientos de nadie.</p></div></div>
    <dl class="kpis"><div class="kpi"><dt>Usuarios</dt><dd>${st.users}</dd></div><div class="kpi"><dt>Activos</dt><dd>${st.activeUsers}</dd></div>
      <div class="kpi"><dt>Administradores</dt><dd>${st.admins}</dd></div><div class="kpi"><dt>Nuevos (7 días)</dt><dd>${st.newLast7Days}</dd></div></dl>
    <section class="panel">
      <form class="toolbar" style="grid-template-columns:minmax(180px,2fr) 1fr 1fr" id="uf" role="search">
        <div class="search">${raw(icon('search'))}<input class="input" id="u-q" type="search" placeholder="Buscar por nombre o correo" aria-label="Buscar usuarios" value="${F.q}"></div>
        <select class="select" id="u-role" aria-label="Rol">${opt('', F.role, 'Todos los roles')}${opt('admin', F.role, 'Administradores')}${opt('user', F.role, 'Usuarios')}</select>
        <select class="select" id="u-status" aria-label="Estado">${opt('', F.status, 'Todos los estados')}${opt('active', F.status, 'Activos')}${opt('inactive', F.status, 'Desactivados')}</select></form>
      ${list.items.length ? html`<div class="table-wrap"><table class="table stack-m"><thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Registro</th><th class="r">Movimientos</th><th><span class="sr-only">Acciones</span></th></tr></thead><tbody>
        ${list.items.map((u) => { const me = u.id === app.user.id; const protectedRole = me || u.isOwner || (!canManageAdmins && u.role === 'admin'); const canManageTarget = !me && !u.isOwner && (canManageAdmins || u.role === 'user'); return html`<tr>
          <td class="full"><div class="cellflex">${avatarMarkup(u.avatar, { size: 36, label: `Avatar de ${u.name}` })}<div style="min-width:0"><div>${u.name}${me ? html` <span class="pill ok">Tú</span>` : ''}</div><div class="faint" style="font-size:12px;word-break:break-all">${u.email}</div></div></div></td>
          <td data-label="Rol">${u.isOwner ? html`<span class="pill info">Titular</span>` : protectedRole ? html`<span class="pill">${u.role === 'admin' ? 'Administrador' : 'Usuario'}</span>` : html`<select class="select inline-select" data-role="${u.id}" aria-label="Rol de ${u.name}">${opt('user', u.role, 'Usuario')}${canManageAdmins ? opt('admin', u.role, 'Administrador') : ''}</select>`}</td>
          <td data-label="Estado"><span class="pill ${u.isActive ? 'ok' : 'bad'}">${u.isActive ? 'Activo' : 'Desactivado'}</span></td>
          <td class="sub" data-label="Registro">${fmtDate(u.createdAt.slice(0, 10), { day: '2-digit', month: 'short', year: 'numeric' })}</td>
          <td class="r mono sub" data-label="Movimientos">${u.txCount}</td>
          <td class="full"><div class="row-actions">
            <button class="btn btn-icon" type="button" data-reset="${u.id}" title="Enviar enlace de recuperación" aria-label="Enviar enlace de recuperación a ${u.name}">${raw(icon('key'))}</button>
            ${canManageTarget ? html`<button class="btn btn-sm ${u.isActive ? 'btn-ghost' : 'btn-primary'}" type="button" data-toggle="${u.id}">${u.isActive ? 'Desactivar' : 'Activar'}</button>
            <button class="btn btn-icon danger" type="button" data-del="${u.id}" aria-label="Eliminar a ${u.name}">${raw(icon('trash'))}</button>` : ''}</div></td></tr>`; })}
        </tbody></table></div>
        <div class="pager"><span>${list.total} usuario(s) · Página ${list.page} de ${list.pages}</span><div class="btns">
          <button class="btn btn-sm btn-ghost" type="button" data-page="${list.page - 1}" ${raw(list.page <= 1 ? 'disabled' : '')}>Anterior</button>
          <button class="btn btn-sm btn-ghost" type="button" data-page="${list.page + 1}" ${raw(list.page >= list.pages ? 'disabled' : '')}>Siguiente</button></div></div>`
      : html`<div class="empty"><div class="em">🔎</div><h3>Sin resultados</h3><p>No hay usuarios con esos filtros.</p></div>`}
    </section>`);

  const redo = () => render({ root, isCurrent, signal });
  const reportRefreshError = (error) => { if (error?.name !== 'AbortError') toast(error.message || 'No se pudo actualizar la lista de usuarios.', 'error'); };
  const refresh = () => { void redo().catch(reportRefreshError); };
  $('#uf', root).addEventListener('submit', (e) => e.preventDefault());
  $('#u-q', root).addEventListener('input', debounce((e) => {
    F.q = e.target.value.trim(); F.page = 1;
    void redo().then(() => { const el = $('#u-q', root); el?.focus(); el?.setSelectionRange(el.value.length, el.value.length); }).catch(reportRefreshError);
  }, 350));
  $('#u-role', root).addEventListener('change', (e) => { F.role = e.target.value; F.page = 1; refresh(); });
  $('#u-status', root).addEventListener('change', (e) => { F.status = e.target.value; F.page = 1; refresh(); });
  root.__list = list; root.__redo = redo;
  if (root.__bound) return;
  root.__bound = true;
  const byId = (id) => root.__list.items.find((u) => String(u.id) === String(id));

  root.addEventListener('change', async (e) => {
    const sel = e.target.closest('[data-role]'); if (!sel) return;
    const u = byId(sel.dataset.role);
    if (!(await confirmDialog({ title: 'Cambiar rol', message: `${u.name} pasará a ser ${sel.value === 'admin' ? 'administrador' : 'usuario'}.`, confirmText: 'Cambiar rol' }))) return refresh();
    try { await api.patch(`/api/admin/users/${u.id}`, { role: sel.value }); toast('Rol actualizado'); } catch (ex) { toast(ex.message, 'error'); }
    refresh();
  });
  root.addEventListener('click', async (e) => {
    const pg = e.target.closest('[data-page]'); if (pg && !pg.disabled) { F.page = Number(pg.dataset.page); return refresh(); }
    const tg = e.target.closest('[data-toggle]');
    if (tg) {
      const u = byId(tg.dataset.toggle);
      if (u.isActive && !(await confirmDialog({ title: 'Desactivar cuenta', message: `${u.name} no podrá iniciar sesión y se cerrarán sus sesiones abiertas. Sus datos se conservan.`, confirmText: 'Desactivar', danger: true }))) return;
      try { await api.patch(`/api/admin/users/${u.id}`, { isActive: !u.isActive }); toast(u.isActive ? 'Cuenta desactivada' : 'Cuenta activada'); } catch (ex) { toast(ex.message, 'error'); }
      return refresh();
    }
    const rs = e.target.closest('[data-reset]');
    if (rs) { const u = byId(rs.dataset.reset); try { const r = await api.post(`/api/admin/users/${u.id}/send-reset`); toast(r.message); } catch (ex) { toast(ex.message, 'error'); } return; }
    const dl = e.target.closest('[data-del]');
    if (dl) {
      const u = byId(dl.dataset.del);
      if (!(await confirmDialog({ title: 'Eliminar usuario', message: `Se eliminará la cuenta de ${u.name} (${u.email}) y TODOS sus datos (${u.txCount} movimientos). No se puede deshacer.`, confirmText: 'Eliminar usuario', danger: true }))) return;
      try { await api.del(`/api/admin/users/${u.id}`); toast('Usuario eliminado'); } catch (ex) { toast(ex.message, 'error'); }
      refresh();
    }
  });
}
