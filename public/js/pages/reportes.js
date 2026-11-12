import { api } from '../api.js';
import { html, raw, setHtml, $, money, todayStr, fmtDate, periodLabel, periodRange, cap, monthName } from '../utils.js';
import { icon } from '../icons.js';
import { app } from '../store.js';
import { draw, axes, tooltip } from '../charts.js';
import { budgetStatus } from '../components/tx.js';

let months = 6;

export async function render({ root, isCurrent }) {
  const cfg = app.settings;
  const [s, m] = await Promise.all([
    api.get('/api/reports/summary', { year: app.period.year, month: app.period.month, today: todayStr() }),
    api.get('/api/reports/monthly', { year: app.period.year, month: app.period.month, months }),
  ]);
  if (!isCurrent()) return;
  const label = periodLabel(app.period.year, app.period.month, cfg.cutoffDay);
  const { from, to } = periodRange(app.period.year, app.period.month, cfg.cutoffDay);
  const ranked = s.byCategory.filter((c) => c.spent > 0).sort((a, b) => b.spent - a.spent).slice(0, 6);
  const max = ranked[0]?.spent || 1;
  const rows = s.byCategory.filter((c) => c.name.toLowerCase() !== 'ingresos' || c.spent > 0);
  const labels = m.months.map((x) => cfg.cutoffDay === 1 ? cap(monthName(x.month)).slice(0, 3) : fmtDate(x.from, { day: 'numeric', month: 'short' }));

  setHtml(root, html`
    <div class="page-head"><div><h1>Reportes</h1><p>Análisis de ${label}</p></div>
      <div class="actions"><a class="btn btn-ghost" download href="${api.url('/api/transactions/export.csv', { from, to })}">${raw(icon('download'))}Exportar período (CSV)</a></div></div>
    <div class="kpis">
      <dl class="kpi"><dt>Gastado</dt><dd style="color:var(--danger)">${money(s.spent)}</dd></dl>
      <dl class="kpi"><dt>Ingresos</dt><dd style="color:var(--brand)">${money(s.income)}</dd></dl>
      <dl class="kpi"><dt>Balance</dt><dd style="color:${s.balance >= 0 ? 'var(--brand)' : 'var(--danger)'}">${money(s.balance, { sign: true })}</dd></dl>
      <dl class="kpi"><dt>Gastos hormiga</dt><dd>${money(s.antTotal)}</dd></dl>
    </div>
    <div class="grid-2 wide-left">
      <section class="panel"><div class="panel-head"><h2>Evolución mensual</h2>
        <label class="sr-only" for="months">Meses a mostrar</label><select class="select inline-select" id="months">${[6, 12].map((n) => html`<option value="${n}" ${raw(n === months ? 'selected' : '')}>Últimos ${n} meses</option>`)}</select></div>
        <div class="chart-box tall"><canvas id="monthly-chart" role="img" aria-label="Gastos e ingresos por mes"></canvas></div></section>
      <section class="panel"><div class="panel-head"><h2>Top categorías</h2><span class="sub">${label}</span></div>
        ${ranked.length ? ranked.map((c) => html`<div class="cat-row"><div class="top"><span class="name"><span class="dot" style="--c:${c.color}"></span><span class="t">${c.emoji} ${c.name}</span></span><span class="nums"><b>${money(c.spent)}</b></span></div>
          <div class="track" style="--c:${c.color}"><i data-w="${(c.spent / max) * 100}"></i></div></div>`) : html`<div class="empty"><p>Sin gastos en este período.</p></div>`}</section>
    </div>
    <section class="panel"><div class="panel-head"><h2>Resumen comparativo</h2><span class="sub">Presupuesto vs. gasto real</span></div>
      <div class="table-wrap"><table class="table stack-m"><thead><tr><th>Categoría</th><th class="r">Presupuesto</th><th class="r">Gastado</th><th class="r">Restante</th><th class="r">Uso</th><th>Estado</th></tr></thead><tbody>
      ${rows.map((c) => { const st = budgetStatus(c.spent, c.budget, cfg.alertPct); const rest = c.budget - c.spent;
        return html`<tr><td class="full"><span class="cellflex"><span class="dot" style="--c:${c.color}"></span>${c.emoji} ${c.name}</span></td>
          <td class="r sub mono" data-label="Presupuesto">${money(c.budget)}</td><td class="r mono" data-label="Gastado" style="color:var(--danger)">${money(c.spent)}</td>
          <td class="r mono" data-label="Restante" style="color:${rest >= 0 ? 'var(--brand)' : 'var(--danger)'}">${c.budget ? money(rest) : '—'}</td>
          <td class="r mono" data-label="Uso">${st.pct === null ? '—' : st.pct + '%'}</td><td class="full"><span class="pill ${st.cls}">${st.label}</span></td></tr>`; })}
      </tbody></table></div></section>`);

  requestAnimationFrame(() => root.querySelectorAll('.track > i').forEach((i) => { i.style.width = i.dataset.w + '%'; }));
  $('#months', root).addEventListener('change', (e) => { months = Number(e.target.value); render({ root, isCurrent }); });
  draw('monthly-chart', (p) => ({
    type: 'bar',
    data: { labels, datasets: [
      { label: 'Gastos', data: m.months.map((x) => x.spent), backgroundColor: p.danger + 'aa', borderRadius: 5, maxBarThickness: 26 },
      { label: 'Ingresos', data: m.months.map((x) => x.income), backgroundColor: p.brand + 'aa', borderRadius: 5, maxBarThickness: 26 } ] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: p.text, usePointStyle: true, boxWidth: 8 } }, tooltip: tooltip(p) }, scales: axes(p) },
  }));
}
