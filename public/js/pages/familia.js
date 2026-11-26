import { api } from '../api.js';
import { html, raw, setHtml, $, $$, money, todayStr, periodLabel } from '../utils.js';
import { icon } from '../icons.js';
import { app, canManageHousehold } from '../store.js';
import { draw, tooltip } from '../charts.js';
import { openMemberModal, deleteMember } from '../forms.js';
import { avatarMarkup } from '../components/avatar.js';
import { editMemberAvatar } from '../components/avatar-editor.js';

export async function render({ root, isCurrent }) {
  const canManage = canManageHousehold();
  const s = await api.get('/api/reports/summary', { year: app.period.year, month: app.period.month, today: todayStr() });
  if (!isCurrent()) return;
  const total = s.byMember.reduce((a, m) => a + m.spent, 0) + s.unassigned.spent;
  const share = (v) => (total ? Math.round((v / total) * 100) : 0);
  const label = periodLabel(app.period.year, app.period.month, app.settings.cutoffDay);

  setHtml(root, html`
    <div class="page-head"><div><h1>Familia</h1><p>Gastos por miembro del hogar · ${label}</p></div>
      ${canManage ? html`<div class="actions"><button class="btn btn-primary" type="button" data-add-member>${raw(icon('plus'))}Añadir miembro</button></div>` : ''}</div>
    <div class="members">
      ${s.byMember.map((m) => html`<article class="member" style="--c:${m.color}">
        ${canManage ? html`<div class="m-actions"><button class="btn btn-icon" type="button" data-avatar="${m.id}" title="Personalizar avatar" aria-label="Personalizar avatar de ${m.name}">✦</button><button class="btn btn-icon" type="button" data-edit="${m.id}" aria-label="Editar ${m.name}">${raw(icon('edit'))}</button>
          <button class="btn btn-icon danger" type="button" data-del="${m.id}" aria-label="Eliminar ${m.name}">${raw(icon('trash'))}</button></div>
        ` : ''}
        <div class="m-ava">${avatarMarkup(m.avatar, { size: 66, label: `Avatar de ${m.name}`, background: m.color })}</div><h3>${m.name}</h3><span class="role">${m.role}</span>
        <div class="m-amt">${m.spent > 0 ? money(m.spent) : '—'}</div>
        <div class="m-sub">${m.count} gasto(s) · ${share(m.spent)}% del total</div>
        <div class="track" style="--c:${m.color}"><i data-w="${share(m.spent)}"></i></div></article>`)}
      ${s.unassigned.count ? html`<article class="member" style="--c:#94a3b8"><div class="m-ava" aria-hidden="true">👥</div><h3>Sin asignar</h3><span class="role">Gastos sin miembro</span>
        <div class="m-amt">${money(s.unassigned.spent)}</div><div class="m-sub">${s.unassigned.count} gasto(s) · ${share(s.unassigned.spent)}% del total</div>
        <div class="track" style="--c:#94a3b8"><i data-w="${share(s.unassigned.spent)}"></i></div></article>` : ''}
      ${canManage ? html`<button class="member member-add" type="button" data-add-member><span class="plus">${raw(icon('plus'))}</span>Añadir miembro</button>` : ''}
    </div>
    <section class="panel"><div class="panel-head"><h2>Distribución de gastos por miembro</h2><span class="sub">${label}</span></div>
      ${total > 0 ? html`<div class="chart-box tall"><canvas id="member-chart" role="img" aria-label="Distribución de gastos por miembro"></canvas></div>`
        : html`<div class="empty"><p>Cuando registres gastos con un miembro asignado, verás aquí cómo se reparten.</p></div>`}</section>`);

  requestAnimationFrame(() => $$('.track > i', root).forEach((i) => { i.style.width = i.dataset.w + '%'; }));
  if (total > 0) {
    const items = [...s.byMember.filter((m) => m.spent > 0).map((m) => ({ l: `${m.emoji} ${m.name}`, v: m.spent, c: m.color })), ...(s.unassigned.spent ? [{ l: '👥 Sin asignar', v: s.unassigned.spent, c: '#94a3b8' }] : [])];
    draw('member-chart', (p) => ({
      type: 'doughnut',
      data: { labels: items.map((i) => i.l), datasets: [{ data: items.map((i) => i.v), backgroundColor: items.map((i) => i.c + 'cc'), borderColor: p.surface, borderWidth: 3, hoverOffset: 6 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: window.innerWidth < 600 ? 'bottom' : 'right', labels: { color: p.text, padding: 14, usePointStyle: true, font: { size: 12 } } }, tooltip: { ...tooltip(p), callbacks: { label: (c) => ` ${money(c.parsed)} (${share(c.parsed)}%)` } } } },
    }));
  }
  root.addEventListener('click', (e) => {
    if (!canManage) return;
    if (e.target.closest('[data-add-member]')) return openMemberModal();
    const avatar = e.target.closest('[data-avatar]'); if (avatar) { const member = app.members.find((m) => String(m.id) === avatar.dataset.avatar); if (member) editMemberAvatar(member); return; }
    const ed = e.target.closest('[data-edit]'); if (ed) return openMemberModal(app.members.find((m) => String(m.id) === ed.dataset.edit));
    const del = e.target.closest('[data-del]'); if (del) return deleteMember(app.members.find((m) => String(m.id) === del.dataset.del));
  });
}
