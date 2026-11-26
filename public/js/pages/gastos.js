import { api } from '../api.js';
import { html, raw, setHtml, $, $$, money, fmtDate, periodRange, periodLabel, debounce } from '../utils.js';
import { icon } from '../icons.js';
import { app } from '../store.js';
import { openTxModal, deleteTx } from '../forms.js';
import { antPill } from '../components/tx.js';

// Los filtros se conservan al cambiar de sección o recargar datos
const F = { q: '', type: '', categoryId: '', memberId: '', scope: 'period', sort: 'date', dir: 'desc', page: 1 };

export async function render({ root, isCurrent }) {
  const { from, to } = periodRange(app.period.year, app.period.month, app.settings.cutoffDay);
  const params = { q: F.q, type: F.type, categoryId: F.categoryId, memberId: F.memberId, sort: F.sort, dir: F.dir, page: F.page, limit: 15,
    ...(F.scope === 'period' ? { from, to } : {}) };
  const data = await api.get('/api/transactions', params);
  if (!isCurrent()) return;
  if (F.page > data.pages) { F.page = data.pages; return render({ root, isCurrent }); }

  const opt = (v, cur, label) => html`<option value="${v}" ${raw(String(cur) === String(v) ? 'selected' : '')}>${label}</option>`;
  const sortBtn = (key, label) => html`<button type="button" class="sort-btn" data-sort="${key}" aria-label="Ordenar por ${label}">${label}${F.sort === key ? raw(icon(F.dir === 'asc' ? 'up' : 'down')) : ''}</button>`;
  const hasFilters = F.q || F.type || F.categoryId || F.memberId;

  setHtml(root, html`
    <div class="page-head"><div><h1>Movimientos</h1><p>${F.scope === 'period' ? periodLabel(app.period.year, app.period.month, app.settings.cutoffDay) : 'Todo el historial'}</p></div>
      <div class="actions"><a class="btn btn-ghost" id="export" href="${api.url('/api/transactions/export.csv', { ...params, page: undefined, limit: undefined })}" download>${raw(icon('download'))}<span class="hide-mobile">Exportar CSV</span></a>
      <button class="btn btn-primary hide-mobile" type="button" data-add>${raw(icon('plus'))}Nuevo</button></div></div>
    <section class="panel">
      <form class="toolbar" id="filters" role="search" aria-label="Filtros">
        <div class="search"><span class="sr-only"><label for="f-q">Buscar</label></span>${raw(icon('search'))}<input class="input" id="f-q" type="search" placeholder="Buscar por descripción o nota" value="${F.q}"></div>
        <select class="select" id="f-type" aria-label="Tipo">${opt('', F.type, 'Todos los tipos')}${opt('gasto', F.type, 'Gastos')}${opt('ingreso', F.type, 'Ingresos')}</select>
        <select class="select" id="f-cat" aria-label="Categoría">${opt('', F.categoryId, 'Todas las categorías')}${app.categories.map((c) => opt(c.id, F.categoryId, `${c.emoji} ${c.name}`))}</select>
        <select class="select" id="f-mem" aria-label="Miembro">${opt('', F.memberId, 'Todos los miembros')}${app.members.map((m) => opt(m.id, F.memberId, `${m.emoji} ${m.name}`))}${opt('none', F.memberId, 'Sin asignar')}</select>
        <select class="select" id="f-scope" aria-label="Rango">${opt('period', F.scope, 'Este período')}${opt('all', F.scope, 'Todo el historial')}</select>
      </form>
      <div class="summary-line"><span><b>${data.total}</b> movimiento(s)</span><span>Ingresos <b style="color:var(--brand)">${money(data.totals.income)}</b></span><span>Gastos <b style="color:var(--danger)">${money(data.totals.expense)}</b></span>
        ${hasFilters ? html`<button class="btn btn-sm btn-ghost" type="button" id="clear">Limpiar filtros</button>` : ''}</div>
      ${data.items.length ? html`<div class="table-wrap"><table class="table stack-m tx-table"><thead><tr>
        <th>${sortBtn('description', 'Descripción')}</th><th>Categoría</th><th>Miembro</th><th>${sortBtn('date', 'Fecha')}</th><th class="r">${sortBtn('amount', 'Monto')}</th><th><span class="sr-only">Acciones</span></th></tr></thead><tbody>
        ${data.items.map((t) => html`<tr>
          <td class="c-desc"><div class="cellflex"><span>${t.description}</span>${t.isAnt ? antPill : ''}</div>${t.note ? html`<div class="faint" style="font-size:12px">${t.note}</div>` : ''}</td>
          <td class="sub c-cat"><span class="cellflex"><span class="dot" style="--c:${t.category.color}"></span>${t.category.emoji} ${t.category.name}</span></td>
          <td class="sub c-mem">${t.member ? `${t.member.emoji} ${t.member.name}` : html`<span class="faint">Sin asignar</span>`}</td>
          <td class="sub c-date">${fmtDate(t.date, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
          <td class="r c-amt"><span class="amt ${t.type === 'ingreso' ? 'pos' : 'neg'}">${t.type === 'ingreso' ? '+' : '−'}${money(t.amount)}</span></td>
          <td class="full c-act"><div class="row-actions"><button class="btn btn-icon" type="button" data-edit="${t.id}" aria-label="Editar ${t.description}">${raw(icon('edit'))}</button>
            <button class="btn btn-icon danger" type="button" data-del="${t.id}" aria-label="Eliminar ${t.description}">${raw(icon('trash'))}</button></div></td></tr>`)}
        </tbody></table></div>
        <div class="pager"><span>Página ${data.page} de ${data.pages}</span><div class="btns">
          <button class="btn btn-sm btn-ghost" type="button" data-page="${data.page - 1}" ${raw(data.page <= 1 ? 'disabled' : '')}>Anterior</button>
          <button class="btn btn-sm btn-ghost" type="button" data-page="${data.page + 1}" ${raw(data.page >= data.pages ? 'disabled' : '')}>Siguiente</button></div></div>`
      : html`<div class="empty"><div class="em">📋</div><h3>${hasFilters ? 'Sin resultados' : 'No hay movimientos'}</h3><p>${hasFilters ? 'Prueba con otros filtros o límpialos para ver todo.' : 'Registra tu primer gasto o ingreso de este período.'}</p>
        ${hasFilters ? html`<button class="btn btn-ghost" type="button" id="clear2">Limpiar filtros</button>` : html`<button class="btn btn-primary" type="button" data-add>${raw(icon('plus'))}Nuevo movimiento</button>`}</div>`}
    </section>`);

  const redo = () => render({ root, isCurrent });
  const setF = (patch) => { Object.assign(F, patch, { page: patch.page ?? 1 }); redo(); };
  $('#f-q', root).addEventListener('input', debounce((e) => { F.q = e.target.value.trim(); F.page = 1; redo().then(() => { const el = $('#f-q', root); el.focus(); el.setSelectionRange(el.value.length, el.value.length); }); }, 350));
  $('#f-type', root).addEventListener('change', (e) => setF({ type: e.target.value }));
  $('#f-cat', root).addEventListener('change', (e) => setF({ categoryId: e.target.value }));
  $('#f-mem', root).addEventListener('change', (e) => setF({ memberId: e.target.value }));
  $('#f-scope', root).addEventListener('change', (e) => setF({ scope: e.target.value }));
  $('#filters', root).addEventListener('submit', (e) => e.preventDefault());
  const clear = () => setF({ q: '', type: '', categoryId: '', memberId: '' });
  $('#clear', root)?.addEventListener('click', clear);
  $('#clear2', root)?.addEventListener('click', clear);
  root.__data = data; root.__redo = redo; root.__setF = setF;
  if (root.__bound) return;
  root.__bound = true;
  root.addEventListener('click', (e) => {
    const { __data: data, __setF: setF } = root;
    if (e.target.closest('[data-add]')) return openTxModal();
    const ed = e.target.closest('[data-edit]'); if (ed) return openTxModal(data.items.find((t) => String(t.id) === ed.dataset.edit));
    const del = e.target.closest('[data-del]'); if (del) return deleteTx(data.items.find((t) => String(t.id) === del.dataset.del));
    const pg = e.target.closest('[data-page]'); if (pg && !pg.disabled) return setF({ page: Number(pg.dataset.page) });
    const so = e.target.closest('[data-sort]');
    if (so) { const k = so.dataset.sort; setF(F.sort === k ? { dir: F.dir === 'asc' ? 'desc' : 'asc' } : { sort: k, dir: k === 'description' ? 'asc' : 'desc' }); }
  });
}
