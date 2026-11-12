import { html, raw, money, fmtDate } from '../utils.js';

export const antPill = html`<span class="pill" title="Gasto hormiga: compra pequeña o de una categoría hormiga">🐜 hormiga</span>`;

export function txRow(t) {
  const sub = [t.category.name, t.member ? `${t.member.emoji} ${t.member.name}` : null, fmtDate(t.date)].filter(Boolean).join(' · ');
  return html`<button class="tx" type="button" data-edit-tx="${t.id}" aria-label="Editar ${t.description}">
    <span class="tx-ico" style="--c:${t.category.color}">${t.category.emoji}</span>
    <span class="tx-body"><span class="tx-title"><span class="tx-text">${t.description}</span>${t.isAnt ? antPill : ''}</span><span class="tx-sub">${sub}</span></span>
    <span class="amt ${t.type === 'ingreso' ? 'pos' : 'neg'}">${t.type === 'ingreso' ? '+' : '−'}${money(t.amount)}</span>
  </button>`;
}

// Estado de uso de presupuesto
export function budgetStatus(spent, budget, alertPct) {
  if (!budget) return spent > 0 ? { key: 'none', label: 'Sin presupuesto', cls: 'info', pct: null } : { key: 'idle', label: 'Sin uso', cls: '', pct: 0 };
  const pct = Math.round((spent / budget) * 100);
  if (pct >= 100) return { key: 'over', label: 'Excedido', cls: 'bad', pct };
  if (pct >= alertPct) return { key: 'warn', label: 'En alerta', cls: 'warn', pct };
  return spent > 0 ? { key: 'ok', label: 'Dentro del límite', cls: 'ok', pct } : { key: 'idle', label: 'Sin uso', cls: '', pct };
}

export const periodQuery = (app) => ({ year: app.period.year, month: app.period.month });
export { raw };
