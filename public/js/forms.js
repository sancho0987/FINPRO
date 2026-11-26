// Diálogos de creación/edición: movimientos, miembros y categorías.
import { api } from './api.js';
import { html, raw, $, $$, todayStr, money } from './utils.js';
import { icon } from './icons.js';
import { avatarMarkup } from './components/avatar.js';
import { app, notifyChange, incomeCategory } from './store.js';
import { openModal, modalHead, toast, setLoading, showFieldErrors, clearFieldErrors, setFormError, runRules, validators as v, confirmDialog, liveValidate } from './ui.js';

const COLORS = ['#4fd1a5', '#6b9fff', '#f472b6', '#f0b84a', '#a78bfa', '#f07070', '#38bdf8', '#fb923c', '#94a3b8', '#34d399'];
const swatches = (selected) => html`<div class="swatches" role="radiogroup" aria-label="Color">${COLORS.map((c) =>
  html`<label class="swatch" style="--c:${c}" title="${c}"><input type="radio" name="color" value="${c}" ${raw(c.toLowerCase() === String(selected).toLowerCase() ? 'checked' : '')} aria-label="Color ${c}"></label>`)}</div>`;
const emojiPicks = (list) => html`<div class="emoji-picks">${list.map((e) => html`<button type="button" data-emoji="${e}" aria-label="Usar ${e}">${e}</button>`)}</div>`;
const field = (label, id, inner, hint) => html`<div class="field"><label for="${id}">${label}</label>${inner}${hint ? html`<span class="hint">${hint}</span>` : ''}<span class="error"></span></div>`;

function bindEmojiPicks(root) {
  $$('[data-emoji]', root).forEach((b) => b.addEventListener('click', () => { root.elements.emoji.value = b.dataset.emoji; root.elements.emoji.focus(); }));
}

async function submitForm(form, { rules, payload, call, onDone, successMsg }) {
  clearFieldErrors(form); setFormError(form, '');
  const errs = runRules(form, rules);
  if (Object.keys(errs).length) { showFieldErrors(form, errs); return; }
  const btn = $('button[type=submit]', form);
  setLoading(btn, true);
  try {
    const res = await call(payload());
    if (successMsg) toast(successMsg);
    onDone(res);
  } catch (e) {
    setLoading(btn, false);
    if (e.fields && Object.keys(e.fields).length && showFieldErrors(form, e.fields)) return;
    setFormError(form, e.message);
  }
}

// ── Movimiento ──
export function openTxModal(tx = null, defaults = {}) {
  const editing = !!tx;
  const cats = app.categories;
  const incomeId = incomeCategory()?.id;
  const firstExpense = cats.find((c) => c.id !== incomeId) || cats[0];
  const initType = tx?.type || defaults.type || 'gasto';
  const initCat = tx?.categoryId || (initType === 'ingreso' ? incomeId : firstExpense?.id) || cats[0]?.id;
  const m = openModal(html`${modalHead(editing ? 'Editar movimiento' : 'Nuevo movimiento')}
    <form id="tx-form" novalidate>
      <div class="form-error" hidden role="alert"></div>
      <div class="field"><span class="label">Tipo</span>
        <div class="segmented" role="radiogroup" aria-label="Tipo de movimiento">
          <label><input type="radio" name="type" value="gasto" class="is-gasto" ${raw(initType === 'gasto' ? 'checked' : '')}>Gasto</label>
          <label><input type="radio" name="type" value="ingreso" class="is-ingreso" ${raw(initType === 'ingreso' ? 'checked' : '')}>Ingreso</label>
        </div></div>
      ${field('Monto', 'tx-amount', html`<input class="input mono" id="tx-amount" name="amount" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0" value="${tx?.amount ?? ''}" required>`)}
      ${field('Descripción', 'tx-desc', html`<input class="input" id="tx-desc" name="description" maxlength="120" placeholder="Ej: Mercado de la semana" value="${tx?.description ?? ''}" required>`)}
      <div class="form-row">
        ${field('Categoría', 'tx-cat', html`<select class="select" id="tx-cat" name="categoryId">${cats.map((c) => html`<option value="${c.id}" ${raw(c.id === initCat ? 'selected' : '')}>${c.emoji} ${c.name}</option>`)}</select>`)}
        ${field('Miembro', 'tx-mem', html`<select class="select" id="tx-mem" name="memberId"><option value="">Sin asignar</option>${app.members.map((mm) => html`<option value="${mm.id}" ${raw(mm.id === tx?.memberId ? 'selected' : '')}>${mm.emoji} ${mm.name}</option>`)}</select>`)}
      </div>
      <div class="tx-member-preview" id="tx-member-preview" aria-live="polite"></div>
      ${field('Fecha', 'tx-date', html`<input class="input" id="tx-date" name="date" type="date" min="1990-01-01" max="2100-12-31" value="${tx?.date || defaults.date || todayStr()}" required>`)}
      ${field('Nota (opcional)', 'tx-note', html`<input class="input" id="tx-note" name="note" maxlength="300" placeholder="Detalles adicionales" value="${tx?.note ?? ''}">`)}
      <div class="modal-actions">
        ${editing ? html`<button class="btn btn-danger" type="button" id="tx-del" aria-label="Eliminar movimiento">${raw(icon('trash'))}</button>` : ''}
        <button class="btn btn-ghost" type="button" data-close>Cancelar</button>
        <button class="btn btn-primary" type="submit">${editing ? 'Guardar cambios' : 'Guardar'}</button>
      </div>
    </form>`, { label: editing ? 'Editar movimiento' : 'Nuevo movimiento' });
  const form = $('#tx-form', m.el);
  const memberSelect = form.elements.memberId;
  const memberPreview = $('#tx-member-preview', m.el);
  const updateMemberPreview = () => {
    const member = app.members.find((item) => String(item.id) === memberSelect.value);
    memberPreview.innerHTML = member ? html`<span>Responsable</span>${avatarMarkup(member.avatar, { size: 28, label: `Avatar de ${member.name}`, background: member.color })}<b>${member.name}</b>` : html`<span>Movimiento sin integrante asignado</span>`;
  };
  memberSelect.addEventListener('change', updateMemberPreview);
  updateMemberPreview();
  let catTouched = editing;
  form.elements.categoryId.addEventListener('change', () => { catTouched = true; });
  $$('input[name=type]', form).forEach((r) => r.addEventListener('change', () => {
    if (catTouched) return;
    const target = r.value === 'ingreso' ? incomeId : firstExpense?.id;
    if (target) form.elements.categoryId.value = target;
  }));
  const rules = { amount: v.amount, description: v.required('La descripción'), date: v.required('La fecha') };
  liveValidate(form, rules);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(form, {
      rules,
      payload: () => ({
        type: form.elements.type.value,
        amount: Number(form.elements.amount.value),
        description: form.elements.description.value.trim(),
        note: form.elements.note.value.trim(),
        date: form.elements.date.value,
        categoryId: form.elements.categoryId.value,
        memberId: form.elements.memberId.value || null,
      }),
      call: (body) => (editing ? api.put(`/api/transactions/${tx.id}`, body) : api.post('/api/transactions', body)),
      successMsg: editing ? 'Movimiento actualizado' : 'Movimiento guardado',
      onDone: () => { app.hasTransactions = true; m.close(); notifyChange(); },
    });
  });
  if (editing) $('#tx-del', m.el).addEventListener('click', async () => {
    if (await deleteTx(tx)) m.close();
  });
  return m;
}

export async function deleteTx(tx) {
  const ok = await confirmDialog({ title: 'Eliminar movimiento', message: `Se eliminará “${tx.description}” por ${money(tx.amount)}. Esta acción no se puede deshacer.`, confirmText: 'Eliminar', danger: true });
  if (!ok) return false;
  try { await api.del(`/api/transactions/${tx.id}`); toast('Movimiento eliminado'); notifyChange(); return true; }
  catch (e) { toast(e.message, 'error'); return false; }
}

// ── Miembro ──
export function openMemberModal(member = null) {
  const editing = !!member;
  const m = openModal(html`${modalHead(editing ? 'Editar miembro' : 'Añadir miembro')}
    <form id="mem-form" novalidate>
      <div class="form-error" hidden role="alert"></div>
      ${field('Nombre', 'mem-name', html`<input class="input" id="mem-name" name="name" maxlength="40" placeholder="Ej: Mamá, Papá, Carlos" value="${member?.name ?? ''}" required>`)}
      <div class="form-row">
        ${field('Rol', 'mem-role', html`<select class="select" id="mem-role" name="role">${['Titular', 'Adulto', 'Joven', 'Niño', 'Otro'].map((r) => html`<option ${raw(r === (member?.role || 'Adulto') ? 'selected' : '')}>${r}</option>`)}</select>`)}
        ${field('Ícono', 'mem-emoji', html`<input class="input" id="mem-emoji" name="emoji" maxlength="12" value="${member?.emoji ?? '👤'}" required>`)}
      </div>
      ${emojiPicks(['👨', '👩', '👦', '👧', '👴', '👵', '🧑', '👶', '🐶', '🐱'])}
      <div class="field" style="margin-top:16px"><span class="label">Color</span>${swatches(member?.color || COLORS[0])}</div>
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancelar</button>
      <button class="btn btn-primary" type="submit">${editing ? 'Guardar cambios' : 'Añadir'}</button></div>
    </form>`, { label: 'Miembro' });
  const form = $('#mem-form', m.el);
  bindEmojiPicks(form);
  const rules = { name: v.required('El nombre'), emoji: v.required('El ícono') };
  liveValidate(form, rules);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(form, {
      rules,
      payload: () => ({ name: form.elements.name.value.trim(), role: form.elements.role.value, emoji: form.elements.emoji.value.trim(), color: form.elements.color.value }),
      call: (body) => (editing ? api.put(`/api/members/${member.id}`, body) : api.post('/api/members', body)),
      successMsg: editing ? 'Miembro actualizado' : 'Miembro añadido',
      onDone: () => { m.close(); notifyChange(true); },
    });
  });
}

export async function deleteMember(member) {
  const ok = await confirmDialog({ title: 'Eliminar miembro', message: `Se eliminará a ${member.name}. Sus movimientos se conservarán como “Sin asignar”.`, confirmText: 'Eliminar', danger: true });
  if (!ok) return;
  try { await api.del(`/api/members/${member.id}`); toast('Miembro eliminado'); notifyChange(true); }
  catch (e) { toast(e.message, 'error'); }
}

// ── Categoría ──
export function openCategoryModal(cat = null) {
  const editing = !!cat;
  const m = openModal(html`${modalHead(editing ? 'Editar categoría' : 'Nueva categoría')}
    <form id="cat-form" novalidate>
      <div class="form-error" hidden role="alert"></div>
      ${field('Nombre', 'cat-name', html`<input class="input" id="cat-name" name="name" maxlength="40" placeholder="Ej: Mascotas" value="${cat?.name ?? ''}" required>`)}
      <div class="form-row">
        ${field('Ícono', 'cat-emoji', html`<input class="input" id="cat-emoji" name="emoji" maxlength="12" value="${cat?.emoji ?? '📦'}" required>`)}
        ${field('Presupuesto mensual', 'cat-budget', html`<input class="input mono" id="cat-budget" name="budget" type="number" min="0" step="0.01" value="${cat?.budget ?? 0}">`)}
      </div>
      ${emojiPicks(['🍽️', '🚌', '🏠', '💊', '📚', '🎬', '👗', '💡', '🐶', '🎁', '✈️', '💰'])}
      <div class="field" style="margin-top:16px"><span class="label">Color</span>${swatches(cat?.color || COLORS[1])}</div>
      <label class="check"><input type="checkbox" name="isAnt" ${raw(cat?.isAnt ? 'checked' : '')}><span>Contar como <b>gasto hormiga</b> (compras pequeñas y frecuentes)</span></label>
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancelar</button>
      <button class="btn btn-primary" type="submit">${editing ? 'Guardar cambios' : 'Crear categoría'}</button></div>
    </form>`, { label: 'Categoría' });
  const form = $('#cat-form', m.el);
  bindEmojiPicks(form);
  const rules = { name: v.required('El nombre'), emoji: v.required('El ícono'), budget: (x) => (x !== '' && Number(x) < 0 ? 'No puede ser negativo.' : '') };
  liveValidate(form, rules);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(form, {
      rules,
      payload: () => ({ name: form.elements.name.value.trim(), emoji: form.elements.emoji.value.trim(), color: form.elements.color.value, budget: Number(form.elements.budget.value || 0), isAnt: form.elements.isAnt.checked }),
      call: (body) => (editing ? api.put(`/api/categories/${cat.id}`, body) : api.post('/api/categories', body)),
      successMsg: editing ? 'Categoría actualizada' : 'Categoría creada',
      onDone: () => { m.close(); notifyChange(true); },
    });
  });
}

export async function deleteCategory(cat) {
  const ok = await confirmDialog({ title: 'Eliminar categoría', message: `¿Eliminar la categoría “${cat.name}”?`, confirmText: 'Eliminar', danger: true });
  if (!ok) return;
  try { await api.del(`/api/categories/${cat.id}`); toast('Categoría eliminada'); notifyChange(true); }
  catch (e) {
    if (e.code !== 'CATEGORY_IN_USE') { toast(e.message, 'error'); return; }
    const others = app.categories.filter((c) => c.id !== cat.id);
    const m = openModal(html`${modalHead('Mover movimientos')}<p class="msg">${e.message}</p>
      <form id="mv-form" style="margin-top:14px"><div class="field"><label for="mv-to">Mover a</label>
      <select class="select" id="mv-to" name="to">${others.map((c) => html`<option value="${c.id}">${c.emoji} ${c.name}</option>`)}</select></div>
      <div class="modal-actions"><button class="btn btn-ghost" type="button" data-close>Cancelar</button><button class="btn btn-danger-solid" type="submit">Mover y eliminar</button></div></form>`, { label: 'Mover movimientos' });
    $('#mv-form', m.el).addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const btn = $('button[type=submit]', m.el);
      setLoading(btn, true);
      try { await api.del(`/api/categories/${cat.id}`, { query: { reassignTo: $('#mv-to', m.el).value } }); toast('Categoría eliminada'); m.close(); notifyChange(true); }
      catch (e2) { setLoading(btn, false); toast(e2.message, 'error'); }
    });
  }
}
