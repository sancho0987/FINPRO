import { api } from '../api.js';
import { html, raw, setHtml, $, $$, money, todayStr, fmtDate, periodLabel } from '../utils.js';
import { icon } from '../icons.js';
import { app, notifyChange } from '../store.js';
import { draw, axes, tooltip } from '../charts.js';
import { openTxModal } from '../forms.js';
import { toast, setLoading } from '../ui.js';
import { txRow, budgetStatus } from '../components/tx.js';

function countUp(el, to, duration = 700) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = money(to); return; }
  const start = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - start) / duration);
    el.textContent = money(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step); else el.textContent = money(to);
  };
  requestAnimationFrame(step);
}

export async function render({ root, isCurrent, signal }) {
  const cfg = app.settings;
  const [s, recent] = await Promise.all([
    api.get('/api/reports/summary', { year: app.period.year, month: app.period.month, today: todayStr() }, { signal }),
    api.get('/api/transactions', { from: periodFrom(app), to: periodTo(app), limit: 8 }, { signal }),
  ]);
  if (!isCurrent()) return;
  // los límites del período vienen del servidor
  const hasBudget = s.budgetTotal > 0;
  const spentPct = hasBudget ? s.pct : null;
  const over = s.budgetTotal > 0 && s.spent > s.budgetTotal;
  const label = periodLabel(app.period.year, app.period.month, cfg.cutoffDay);

  // Segmentos de la barra: cada categoría con gasto ocupa su parte del presupuesto total
  const segs = s.byCategory.filter((c) => c.spent > 0).sort((a, b) => b.spent - a.spent);
  const denom = Math.max(s.budgetTotal, s.spent) || 1;
  const alerts = [];
  if (hasBudget && spentPct > 100) alerts.push(html`<div class="alert bad" role="alert">${raw(icon('alert'))}<span>Superaste el presupuesto del período: llevas el <b>${spentPct}%</b> (${money(s.spent - s.budgetTotal)} de más).</span></div>`);
  else if (s.budgetTotal > 0 && spentPct >= cfg.alertPct) alerts.push(html`<div class="alert warn" role="alert">${raw(icon('alert'))}<span>Atención: ya usaste el <b>${spentPct}%</b> del presupuesto del período.</span></div>`);
  const overCats = s.byCategory.filter((c) => c.budget > 0 && c.spent > c.budget);
  if (overCats.length) alerts.push(html`<div class="alert warn">${raw(icon('alert'))}<span>Categorías excedidas: ${overCats.map((c) => `${c.emoji} ${c.name}`).join(', ')}.</span></div>`);
  if (s.antTotal > 0) alerts.push(html`<div class="alert info">${raw(icon('info'))}<span>🐜 Gastos hormiga del período: <b>${money(s.antTotal)}</b> en ${s.antCount} compra(s).</span></div>`);

  const topCats = s.byCategory.filter((c) => c.spent > 0 || c.budget > 0).filter((c) => c.name.toLowerCase() !== 'ingresos' || c.spent > 0).sort((a, b) => b.spent - a.spent || b.budget - a.budget).slice(0, 8);

  const onboarding = !app.hasTransactions;
  setHtml(root, html`
    <div class="page-head"><div><h1>Resumen</h1><p>${label}</p></div>
      <div class="actions"><button class="btn btn-primary hide-mobile" type="button" data-add>${raw(icon('plus'))}Agregar gasto</button></div></div>
    ${onboarding ? html`<div class="panel mb"><div class="empty"><div class="em">👋</div><h3>Empieza registrando tu primer movimiento</h3>
      <p>Anota un gasto o un ingreso y verás aquí tu presupuesto, gráficos y alertas.</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn btn-primary" type="button" data-add>${raw(icon('plus'))}Registrar movimiento</button>
      ${app.demoEnabled ? html`<button class="btn btn-ghost" type="button" id="demo-btn">Cargar datos de ejemplo</button>` : ''}</div></div></div>` : ''}
    ${alerts}
    <section class="hero" aria-label="Estado del presupuesto">
      <div class="hero-top">
        <div><div class="label">${!hasBudget ? 'Sin presupuesto configurado' : over ? 'Excedido sobre el presupuesto' : 'Disponible del presupuesto'}</div>
          <div class="figure ${over ? 'bad' : ''}" id="figure" aria-live="off">${hasBudget ? money(Math.abs(s.available)) : money(0)}</div>
          <div class="caption">${hasBudget ? html`${spentPct}% usado de <span class="mono">${money(s.budgetTotal)}</span> presupuestados${s.monthlyBudget > 0 ? ' este mes' : ' por categorías'}` : html`Aún no defines presupuesto. <a href="#/config">Configúralo aquí</a>.`}</div></div>
        <dl class="mini-stats">
          <div><dt>Gastado</dt><dd class="neg">${money(s.spent)}</dd></div>
          <div><dt>Ingresos</dt><dd class="pos">${money(s.income)}</dd></div>
          <div><dt>Balance</dt><dd class="${s.balance >= 0 ? 'pos' : 'neg'}">${money(s.balance, { sign: true })}</dd></div>
          <div><dt>Movimientos</dt><dd>${s.txCount}</dd></div>
        </dl>
      </div>
      ${hasBudget && s.spent > 0 ? html`<div class="budget-bar"><div class="budget-track-wrap">
        ${s.budgetTotal > 0 && cfg.alertPct < 100 ? html`<span class="alert-tick" style="left:${(cfg.alertPct / 100) * (s.budgetTotal / denom) * 100}%" data-label="${cfg.alertPct}%"></span>` : ''}
        <div class="budget-track" role="img" aria-label="${hasBudget ? `Gastos del período por categoría; ${spentPct}% del presupuesto utilizado` : 'Distribución de los gastos del período por categoría; no hay presupuesto configurado'}">${segs.map((c) => html`<span style="--c:${c.color};width:${(c.spent / denom) * 100}%" title="${c.name}: ${money(c.spent)}"></span>`)}</div></div>
        <div class="bar-legend">${segs.slice(0, 5).map((c) => html`<span><i style="--c:${c.color}"></i>${c.name} ${Math.round((c.spent / s.spent) * 100)}%</span>`)}</div>
      </div>` : !s.spent ? html`<p class="hero-empty">Sin gastos en este período.</p>` : ''}
    </section>
    <div class="grid-2 wide-left">
      <section class="panel"><div class="panel-head"><h2>Presupuesto por categoría</h2><a class="sub" href="#/reportes">Ver detalle</a></div>
        ${topCats.length ? topCats.map((c) => { const st = budgetStatus(c.spent, c.budget, cfg.alertPct); const w = c.budget ? Math.min(100, (c.spent / c.budget) * 100) : 0;
          return html`<div class="cat-row"><div class="top"><span class="name"><span class="dot" style="--c:${c.color}"></span><span class="t">${c.emoji} ${c.name}</span></span><span class="nums">${c.budget ? html`<b>${money(c.spent)}</b> / ${money(c.budget)}` : html`<b>${money(c.spent)}</b> · Sin presupuesto`}</span></div>
          ${c.budget ? html`<div class="track ${st.key === 'over' ? 'over' : st.key === 'warn' ? 'warn' : ''}" style="--c:${c.color}" role="progressbar" aria-valuenow="${Math.round(w)}" aria-valuemin="0" aria-valuemax="100" aria-label="${c.name}"><i data-w="${w}"></i></div>` : ''}</div>`; })
          : html`<div class="empty"><p>Todavía no hay gastos ni presupuestos para mostrar.</p></div>`}
      </section>
      <section class="panel"><div class="panel-head"><h2>Gasto diario</h2><span class="sub">Últimos 14 días</span></div><div class="chart-box"><canvas id="daily-chart" role="img" aria-label="Gasto diario de los últimos 14 días"></canvas></div></section>
    </div>
    <section class="panel"><div class="panel-head"><h2>Últimos movimientos</h2><a class="sub" href="#/gastos">Ver todos</a></div>
      <div class="tx-list">${recent.items.length ? recent.items.map(txRow) : html`<div class="empty"><p>Sin movimientos en este período.</p></div>`}</div></section>`);

  if (hasBudget) countUp($('#figure', root), Math.abs(s.available));
  requestAnimationFrame(() => $$('.track > i', root).forEach((i) => { i.style.width = i.dataset.w + '%'; }));
  draw('daily-chart', (p) => ({
    type: 'bar',
    data: { labels: s.daily.map((d) => fmtDate(d.date, { day: 'numeric' })), datasets: [{ label: 'Gasto', data: s.daily.map((d) => d.amount), backgroundColor: p.brand + '55', borderColor: p.brand, borderWidth: 1.5, borderRadius: 5, maxBarThickness: 22 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { ...tooltip(p), callbacks: { title: (i) => fmtDate(s.daily[i[0].dataIndex].date, { weekday: 'short', day: 'numeric', month: 'short' }), label: (c) => ' ' + money(c.parsed.y) } } }, scales: axes(p) },
  }));

  root.addEventListener('click', async (e) => {
    if (e.target.closest('[data-add]')) return openTxModal();
    const row = e.target.closest('[data-edit-tx]');
    if (row) return openTxModal(recent.items.find((t) => String(t.id) === row.dataset.editTx));
    if (e.target.closest('#demo-btn')) {
      const btn = $('#demo-btn', root);
      setLoading(btn, true);
      try { await api.post('/api/data/demo', { today: todayStr() }); toast('Datos de ejemplo cargados'); notifyChange(true); }
      catch (err) { setLoading(btn, false); toast(err.message, 'error'); }
    }
  });
}

// El servidor calcula el período; aquí solo pedimos "los movimientos de este período".
import { periodRange } from '../utils.js';
const periodFrom = (a) => periodRange(a.period.year, a.period.month, a.settings.cutoffDay).from;
const periodTo = (a) => periodRange(a.period.year, a.period.month, a.settings.cutoffDay).to;
