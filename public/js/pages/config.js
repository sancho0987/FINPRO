import { api } from '../api.js';
import { html, raw, setHtml, $, $$, money } from '../utils.js';
import { icon } from '../icons.js';
import { app, canManageHousehold, notifyChange } from '../store.js';
import { toast, setLoading, showFieldErrors, clearFieldErrors, setFormError, runRules, validators as v, confirmDialog, passwordDialog, liveValidate } from '../ui.js';
import { openCategoryModal, deleteCategory } from '../forms.js';

const CURRENCIES = { COP: 'COP — Peso colombiano', USD: 'USD — Dólar estadounidense', EUR: 'EUR — Euro', MXN: 'MXN — Peso mexicano', ARS: 'ARS — Peso argentino' };

export async function render({ root }) {
  const c = app.settings;
  const canManage = canManageHousehold();
  setHtml(root, html`
    <div class="page-head"><div><h1>Configuración</h1><p>Personaliza tu hogar, presupuestos y datos</p></div></div>
    <form id="cfg-form" novalidate>
      <div class="form-error" hidden role="alert"></div>
      <div class="grid-2">
        <section class="panel"><div class="panel-head"><h2>Tu hogar</h2></div>
          <div class="field"><label for="c-hogar">Nombre del hogar</label><input class="input" id="c-hogar" name="householdName" maxlength="60" value="${c.householdName}" ${raw(canManage ? '' : 'disabled')} required><span class="error"></span></div>
          <div class="field"><label for="c-mon">Moneda</label><select class="select" id="c-mon" name="currency" ${raw(canManage ? '' : 'disabled')}>${Object.entries(CURRENCIES).map(([k, l]) => html`<option value="${k}" ${raw(k === c.currency ? 'selected' : '')}>${l}</option>`)}</select>
            <span class="hint">Cambiar la moneda solo cambia el símbolo: no convierte tus montos.</span><span class="error"></span></div>
          <div class="field"><label for="c-corte">Día de corte mensual</label><input class="input mono" id="c-corte" name="cutoffDay" type="number" min="1" max="28" step="1" value="${c.cutoffDay}" ${raw(canManage ? '' : 'disabled')}><span class="hint">Tu mes financiero empieza este día (1 = mes calendario). Útil si cobras el 15 o el 30.</span><span class="error"></span></div>
        </section>
        <section class="panel"><div class="panel-head"><h2>Alertas</h2></div>
          <div class="field"><label for="c-alerta">Avisarme al llegar al (% del presupuesto)</label><input class="input mono" id="c-alerta" name="alertPct" type="number" min="50" max="100" step="1" value="${c.alertPct}" ${raw(canManage ? '' : 'disabled')}><span class="error"></span></div>
          <div class="field"><label for="c-hormiga">Gasto hormiga: límite por compra</label><input class="input mono" id="c-hormiga" name="antLimit" type="number" min="0" step="0.01" value="${c.antLimit}" ${raw(canManage ? '' : 'disabled')}><span class="hint">Los gastos por debajo de este monto se marcan como “hormiga”. Usa 0 para desactivarlo.</span><span class="error"></span></div>
        </section>
      </div>
      <section class="panel mb"><div class="panel-head"><h2>Presupuesto por categoría</h2><div style="display:flex;gap:8px"><span class="sub hide-mobile" style="align-self:center">Monto mensual</span>${canManage ? html`<button class="btn btn-sm btn-ghost" type="button" id="new-cat">${raw(icon('plus'))}Nueva categoría</button>` : ''}</div></div>
        ${canManage ? '' : html`<p class="sub">Solo el titular o un administrador puede cambiar la configuración y los presupuestos del hogar.</p>`}
        ${app.categories.map((k) => html`<div class="cat-edit"><span class="tx-ico" style="--c:${k.color}">${k.emoji}</span>
          <div class="nm"><span>${k.name}</span>${k.isAnt ? html`<span class="pill">🐜 hormiga</span>` : ''}</div>
          <input class="input" type="number" min="0" step="0.01" data-budget="${k.id}" value="${k.budget}" aria-label="Presupuesto de ${k.name}" ${raw(canManage ? '' : 'disabled')}>
          ${canManage ? html`<div class="row-actions"><button class="btn btn-icon" type="button" data-edit-cat="${k.id}" aria-label="Editar ${k.name}">${raw(icon('edit'))}</button>
          <button class="btn btn-icon danger" type="button" data-del-cat="${k.id}" aria-label="Eliminar ${k.name}">${raw(icon('trash'))}</button></div>` : ''}</div>`)}
        <div style="margin-top:14px" class="muted">Total presupuestado: <b class="mono" id="budget-total" style="color:var(--text)"></b></div>
      </section>
      ${canManage ? html`<div style="display:flex;justify-content:flex-end;margin-bottom:24px"><button class="btn btn-primary" type="submit" id="save-cfg">Guardar cambios</button></div>` : ''}
    </form>
    <section class="panel mb"><div class="panel-head"><h2>Tus datos</h2></div>
      <div class="action-row"><div><b>Exportar movimientos</b><span>Descarga todos tus movimientos en CSV (Excel) o todo en JSON.</span></div>
        <div style="display:flex;gap:8px"><a class="btn btn-ghost btn-sm" download href="/api/transactions/export.csv">${raw(icon('download'))}CSV</a><a class="btn btn-ghost btn-sm" download href="/api/data/export.json">${raw(icon('download'))}JSON</a></div></div>
      ${app.demoEnabled && !app.hasTransactions ? html`<div class="action-row"><div><b>Datos de ejemplo</b><span>Carga una familia y movimientos de muestra para explorar la app.</span></div><button class="btn btn-ghost btn-sm" type="button" id="demo">Cargar ejemplo</button></div>` : ''}
    </section>
    ${canManage ? html`<section class="panel danger-zone"><div class="panel-head"><h2>Zona de peligro</h2></div>
      <div class="action-row"><div><b>Borrar todos mis datos</b><span>Elimina movimientos y miembros, y restablece categorías y configuración. No se puede deshacer.</span></div>
        <button class="btn btn-danger" type="button" id="wipe">Borrar todo</button></div></section>` : ''}`);

  const form = $('#cfg-form', root);
  const sum = () => { $('#budget-total', root).textContent = money($$('[data-budget]', root).reduce((a, i) => a + (Number(i.value) || 0), 0)); };
  sum();
  root.addEventListener('input', (e) => { if (e.target.matches('[data-budget]')) sum(); });
  const rules = {
    householdName: v.required('El nombre del hogar'),
    cutoffDay: (x) => (!Number.isInteger(Number(x)) || Number(x) < 1 || Number(x) > 28 ? 'Elige un día entre 1 y 28.' : ''),
    alertPct: (x) => (!Number.isInteger(Number(x)) || Number(x) < 50 || Number(x) > 100 ? 'Debe estar entre 50 y 100.' : ''),
    antLimit: (x) => (x === '' || Number(x) < 0 ? 'Ingresa 0 o un monto positivo.' : ''),
  };
  liveValidate(form, rules);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!canManage) return;
    clearFieldErrors(form); setFormError(form, '');
    const errs = runRules(form, rules);
    const budgets = $$('[data-budget]', root).map((i) => ({ id: i.dataset.budget, budget: Number(i.value || 0) }));
    if (budgets.some((b) => !(b.budget >= 0))) errs._ = 'Revisa los presupuestos: no pueden ser negativos.';
    if (Object.keys(errs).length) { if (errs._) setFormError(form, errs._); showFieldErrors(form, errs); return; }
    const btn = $('#save-cfg', root); setLoading(btn, true);
    try {
      await api.put('/api/settings', { householdName: form.elements.householdName.value.trim(), currency: form.elements.currency.value, cutoffDay: Number(form.elements.cutoffDay.value), alertPct: Number(form.elements.alertPct.value), antLimit: Number(form.elements.antLimit.value) });
      await api.put('/api/categories/budgets', { budgets });
      toast('Cambios guardados');
      app.period = null; notifyChange(true);
    } catch (ex) { setLoading(btn, false); if (!(ex.fields && showFieldErrors(form, ex.fields))) setFormError(form, ex.message); }
  });

  root.addEventListener('click', async (e) => {
    if (e.target.closest('#new-cat')) return openCategoryModal();
    const ed = e.target.closest('[data-edit-cat]'); if (ed) return openCategoryModal(app.categories.find((k) => String(k.id) === ed.dataset.editCat));
    const del = e.target.closest('[data-del-cat]'); if (del) return deleteCategory(app.categories.find((k) => String(k.id) === del.dataset.delCat));
    if (e.target.closest('#demo')) { try { await api.post('/api/data/demo', { today: new Date().toLocaleDateString('en-CA') }); toast('Datos de ejemplo cargados'); notifyChange(true); } catch (ex) { toast(ex.message, 'error'); } }
    if (e.target.closest('#wipe')) {
      await passwordDialog({ title: 'Borrar todos los datos', message: 'Se eliminarán todos tus movimientos y miembros, y se restablecerán categorías y configuración. Confirma con tu contraseña.', confirmText: 'Borrar todo',
        action: async (password) => { await api.post('/api/data/wipe', { password }); toast('Datos borrados'); app.period = null; notifyChange(true); } });
    }
  });
}
