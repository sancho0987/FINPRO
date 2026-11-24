'use strict';
const { AppError, badRequest, conflict, notFound, forbidden } = require('../utils/errors');
const { toCents, fromCents } = require('../utils/money');
const { getPeriod, shiftPeriod, addDays, todayStr } = require('../utils/period');
const { publicClient } = require('./client');
const { authRequest } = require('./auth');
const { validate } = require('../middleware/validate');
const S = require('../validators/schemas');

function check(result, message = 'No se pudo completar la operación.') {
  if (result.error) {
    const status = result.status || (result.error.code === '42501' ? 403 : 400);
    const msg = result.error.code === '23505' ? 'Ya existe un registro con esos datos.'
      : result.error.code === '23503' ? 'La referencia seleccionada no existe o pertenece a otro hogar.'
        : result.error.code === '42501' ? 'No tienes permiso para realizar esta operación.' : message;
    throw new AppError(status, 'SUPABASE_DATA', msg);
  }
  return result.data;
}
function rowCount(result, message) {
  if (result.error) check(result, message);
  return result.count || 0;
}

async function settingsRow(req) {
  const row = check(await req.supabase.from('households').select('*').eq('id', req.householdId).single(), 'No se pudo cargar la configuración.');
  return row;
}

const settingsDto = (r) => ({ householdName: r.name, currency: r.currency, cutoffDay: r.cutoff_day, alertPct: r.alert_pct, antLimit: fromCents(r.ant_limit_cents) });

function currentPeriod(cutoffDay, date = todayStr()) {
  const [year, month, day] = date.split('-').map(Number);
  const baseMonth = month - 1 - (day < cutoffDay ? 1 : 0);
  const normalized = new Date(Date.UTC(year, baseMonth, 1));
  return getPeriod(normalized.getUTCFullYear(), normalized.getUTCMonth(), cutoffDay);
}

function selectedPeriod(cfg, year, month) {
  return year !== undefined && month !== undefined ? getPeriod(Number(year), Number(month), cfg.cutoff_day) : currentPeriod(cfg.cutoff_day);
}

async function categoriesFor(req, periodStart) {
  const [catsResult, budgetResult] = await Promise.all([
    req.supabase.from('categories').select('*').eq('household_id', req.householdId).order('sort_order').order('name'),
    req.supabase.from('budgets').select('category_id,amount_cents').eq('household_id', req.householdId).eq('period_start', periodStart),
  ]);
  const cats = check(catsResult, 'No se pudieron cargar las categorías.');
  const budgets = check(budgetResult, 'No se pudieron cargar los presupuestos.');
  const map = new Map(budgets.map((b) => [b.category_id, b.amount_cents]));
  return cats.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji, color: c.color, budget: fromCents(map.get(c.id) || 0), isAnt: c.is_ant, sortOrder: c.sort_order }));
}

async function membersFor(req) {
  return check(await req.supabase.from('family_members').select('*').eq('household_id', req.householdId).order('created_at'), 'No se pudieron cargar los miembros.')
    .map((m) => ({ id: m.id, name: m.name, role: m.role, emoji: m.emoji, color: m.color }));
}

async function readTransactions(req, { from, to, type, categoryId, memberId, q, minAmount, maxAmount } = {}) {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    let query = req.supabase.from('transactions').select('*').eq('household_id', req.householdId)
      .order('date', { ascending: true }).order('id', { ascending: true }).range(offset, offset + pageSize - 1);
    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);
    if (type) query = query.eq('type', type);
    if (categoryId) query = query.eq('category_id', categoryId);
    if (memberId === 'none') query = query.is('family_member_id', null);
    else if (memberId) query = query.eq('family_member_id', memberId);
    const page = check(await query, 'No se pudieron cargar los movimientos.');
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  const needle = q?.trim().toLocaleLowerCase();
  return rows.filter((t) => (!needle || `${t.description} ${t.note || ''}`.toLocaleLowerCase().includes(needle))
    && (minAmount === undefined || t.amount_cents >= toCents(Number(minAmount)))
    && (maxAmount === undefined || t.amount_cents <= toCents(Number(maxAmount))));
}

async function decorateTransactions(req, rows, antLimit) {
  const categoryIds = [...new Set(rows.map((r) => r.category_id))];
  const memberIds = [...new Set(rows.map((r) => r.family_member_id).filter(Boolean))];
  const [catRows, memberRows] = await Promise.all([
    categoryIds.length ? req.supabase.from('categories').select('id,name,emoji,color,is_ant').eq('household_id', req.householdId).in('id', categoryIds) : { data: [], error: null },
    memberIds.length ? req.supabase.from('family_members').select('id,name,emoji,color').eq('household_id', req.householdId).in('id', memberIds) : { data: [], error: null },
  ]);
  const cats = new Map(check(catRows, 'No se pudieron cargar las categorías relacionadas.').map((c) => [c.id, c]));
  const members = new Map(check(memberRows, 'No se pudieron cargar los miembros relacionados.').map((m) => [m.id, m]));
  return rows.map((t) => {
    const c = cats.get(t.category_id);
    const m = t.family_member_id ? members.get(t.family_member_id) : null;
    return {
      id: t.id, type: t.type, amount: fromCents(t.amount_cents), description: t.description, note: t.note || '', date: t.date,
      categoryId: t.category_id, memberId: t.family_member_id,
      category: c ? { id: c.id, name: c.name, emoji: c.emoji, color: c.color } : null,
      member: m ? { id: m.id, name: m.name, emoji: m.emoji, color: m.color } : null,
      isAnt: t.type === 'gasto' && (!!c?.is_ant || (antLimit > 0 && t.amount_cents < antLimit)),
      createdAt: t.created_at, updatedAt: t.updated_at,
    };
  });
}

function sortTransactions(rows, sort, dir) {
  const sign = dir === 'asc' ? 1 : -1;
  return rows.sort((a, b) => {
    const av = sort === 'amount' ? a.amount_cents : sort === 'description' ? a.description.toLocaleLowerCase() : a.date;
    const bv = sort === 'amount' ? b.amount_cents : sort === 'description' ? b.description.toLocaleLowerCase() : b.date;
    return (av < bv ? -1 : av > bv ? 1 : 0) * sign || String(b.id).localeCompare(String(a.id));
  });
}

async function pageTransactions(req, filters = {}) {
  const cfg = await settingsRow(req);
  const rows = await readTransactions(req, filters);
  const totals = rows.reduce((a, r) => { a[r.type] += r.amount_cents; return a; }, { gasto: 0, ingreso: 0 });
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const ordered = sortTransactions(rows, filters.sort, filters.dir);
  const items = await decorateTransactions(req, ordered.slice((page - 1) * limit, page * limit), cfg.ant_limit_cents);
  return { items, total: rows.length, page, limit, pages: Math.max(1, Math.ceil(rows.length / limit)), totals: { income: fromCents(totals.ingreso), expense: fromCents(totals.gasto) } };
}

async function oneTransaction(req, id) {
  const cfg = await settingsRow(req);
  const row = check(await req.supabase.from('transactions').select('*').eq('household_id', req.householdId).eq('id', id).maybeSingle(), 'No se pudo cargar el movimiento.');
  if (!row) return null;
  return (await decorateTransactions(req, [row], cfg.ant_limit_cents))[0];
}

async function validateReferences(req, body) {
  const cat = check(await req.supabase.from('categories').select('id').eq('household_id', req.householdId).eq('id', body.categoryId).maybeSingle());
  if (!cat) throw badRequest('La categoría elegida no existe.', { categoryId: 'La categoría elegida no existe.' });
  if (body.memberId) {
    const mem = check(await req.supabase.from('family_members').select('id').eq('household_id', req.householdId).eq('id', body.memberId).maybeSingle());
    if (!mem) throw badRequest('El miembro elegido no existe.', { memberId: 'El miembro elegido no existe.' });
  }
}

async function categoryRows(req, cfg, periodStart) {
  const [cats, budgets, members] = await Promise.all([
    req.supabase.from('categories').select('*').eq('household_id', req.householdId).order('sort_order'),
    req.supabase.from('budgets').select('category_id,amount_cents').eq('household_id', req.householdId).eq('period_start', periodStart),
    req.supabase.from('family_members').select('*').eq('household_id', req.householdId),
  ]);
  return {
    cats: check(cats),
    budgets: new Map(check(budgets).map((b) => [b.category_id, b.amount_cents])),
    members: check(members),
  };
}

async function summary(req, period) {
  const cfg = await settingsRow(req);
  const p = selectedPeriod(cfg, period.year, period.month);
  const [rows, data] = await Promise.all([
    readTransactions(req, { from: p.from, to: p.to }),
    categoryRows(req, cfg, p.from),
  ]);
  const spent = rows.filter((r) => r.type === 'gasto').reduce((s, r) => s + r.amount_cents, 0);
  const income = rows.filter((r) => r.type === 'ingreso').reduce((s, r) => s + r.amount_cents, 0);
  const catMap = new Map(data.cats.map((c) => [c.id, { id: c.id, name: c.name, emoji: c.emoji, color: c.color, isAnt: c.is_ant,
    budgetCents: data.budgets.get(c.id) || 0, spent: 0, income: 0, count: 0 }]));
  const memMap = new Map(data.members.map((m) => [m.id, { id: m.id, name: m.name, role: m.role, emoji: m.emoji, color: m.color, spent: 0, count: 0 }]));
  let unassignedCents = 0, unassignedCount = 0, antCents = 0, antCount = 0;
  for (const t of rows) {
    const c = catMap.get(t.category_id);
    if (c) { if (t.type === 'gasto') c.spent += t.amount_cents; else c.income += t.amount_cents; c.count++; }
    if (t.type === 'gasto') {
      const m = memMap.get(t.family_member_id);
      if (m) { m.spent += t.amount_cents; m.count++; }
      else if (!t.family_member_id) { unassignedCents += t.amount_cents; unassignedCount++; }
      if (c?.isAnt || (cfg.ant_limit_cents > 0 && t.amount_cents < cfg.ant_limit_cents)) { antCents += t.amount_cents; antCount++; }
    }
  }
  const budgetTotal = [...catMap.values()].reduce((s, c) => s + c.budgetCents, 0);
  const byCategory = [...catMap.values()].map((c) => ({ id: c.id, name: c.name, emoji: c.emoji, color: c.color, isAnt: c.isAnt,
    budget: fromCents(c.budgetCents), spent: fromCents(c.spent), income: fromCents(c.income), count: c.count }));
  const byMember = [...memMap.values()].map((m) => ({ ...m, spent: fromCents(m.spent) }));
  const end = period.today && period.today >= p.from && period.today <= p.to ? period.today : p.to;
  const start = addDays(end, -13);
  const dailyMap = new Map();
  for (const t of rows) if (t.type === 'gasto' && t.date >= start && t.date <= end) dailyMap.set(t.date, (dailyMap.get(t.date) || 0) + t.amount_cents);
  const daily = Array.from({ length: 14 }, (_, i) => { const date = addDays(start, i); return { date, amount: fromCents(dailyMap.get(date) || 0) }; });
  return {
    period: { from: p.from, to: p.to, year: p.year, month: p.month }, budgetTotal: fromCents(budgetTotal), spent: fromCents(spent), income: fromCents(income),
    balance: fromCents(income - spent), available: fromCents(budgetTotal - spent), pct: budgetTotal ? Math.round(spent / budgetTotal * 100) : 0,
    txCount: rows.length, antTotal: fromCents(antCents), antCount, byCategory, byMember,
    unassigned: { spent: fromCents(unassignedCents), count: unassignedCount }, daily,
  };
}

function csvCell(v) {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const failRls = (res) => res.status(403).json({ error: { code: 'FORBIDDEN', message: 'No tienes permiso para realizar esta acción.' } });

async function createCategory(req, body) {
  const cfg = await settingsRow(req); const p = currentPeriod(cfg.cutoff_day);
  const cat = check(await req.supabase.from('categories').insert({ household_id: req.householdId, name: body.name, emoji: body.emoji, color: body.color, is_ant: !!body.isAnt })
    .select('*').single(), 'No se pudo crear la categoría.');
  if (body.budget > 0) check(await req.supabase.from('budgets').upsert({ household_id: req.householdId, category_id: cat.id, period_start: p.from, amount_cents: toCents(body.budget) }, { onConflict: 'household_id,category_id,period_start' }));
  return cat;
}

async function authMe(req) {
  const profile = check(await req.supabase.from('profiles').select('full_name,email').eq('id', req.user.id).maybeSingle());
  return { ...req.user, name: profile?.full_name || req.user.name, email: profile?.email || req.user.email };
}

async function bootstrap(req, res) {
  const cfg = await settingsRow(req); const p = currentPeriod(cfg.cutoff_day);
  const [user, categories, members, count] = await Promise.all([
    authMe(req), categoriesFor(req, p.from), membersFor(req),
    req.supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('household_id', req.householdId),
  ]);
  res.json({ user, settings: settingsDto(cfg), categories, members, hasTransactions: !count.error && count.count > 0, demoEnabled: false });
}

function makeRouterHandlers(router) {
  router.get('/bootstrap', bootstrap);
  router.get('/auth/me', async (req, res) => res.json({ user: await authMe(req) }));
  router.get('/settings', async (req, res) => res.json({ settings: settingsDto(await settingsRow(req)) }));
  router.put('/settings', validate('body', S.settings), async (req, res) => {
    const s = req.valid.body;
    const updated = await req.supabase.from('households').update({ name: s.householdName, currency: s.currency, cutoff_day: s.cutoffDay, alert_pct: s.alertPct, ant_limit_cents: toCents(s.antLimit) }).eq('id', req.householdId).select('*').single();
    res.json({ settings: settingsDto(check(updated, 'No se pudo actualizar la configuración.')) });
  });

  router.get('/categories', async (req, res) => {
    const cfg = await settingsRow(req); const p = selectedPeriod(cfg, req.query.year, req.query.month);
    res.json({ categories: await categoriesFor(req, p.from) });
  });
  router.post('/categories', validate('body', S.category), async (req, res) => {
    const cat = await createCategory(req, req.valid.body); const cfg = await settingsRow(req); const p = currentPeriod(cfg.cutoff_day);
    res.status(201).json({ category: (await categoriesFor(req, p.from)).find((c) => c.id === cat.id) });
  });
  router.put('/categories/budgets', validate('body', S.categoryBudgets), async (req, res) => {
    const cfg = await settingsRow(req); const p = currentPeriod(cfg.cutoff_day);
    const rows = req.valid.body.budgets.map((b) => ({ household_id: req.householdId, category_id: b.id, period_start: p.from, amount_cents: toCents(b.budget) }));
    check(await req.supabase.from('budgets').upsert(rows, { onConflict: 'household_id,category_id,period_start' }), 'No se pudieron guardar los presupuestos.');
    res.json({ categories: await categoriesFor(req, p.from) });
  });
  router.put('/categories/:id', validate('body', S.category), async (req, res) => {
    const { id } = req.params; const b = req.valid.body;
    const updated = check(await req.supabase.from('categories').update({ name: b.name, emoji: b.emoji, color: b.color, is_ant: !!b.isAnt }).eq('household_id', req.householdId).eq('id', id).select('id').maybeSingle(), 'No se pudo actualizar la categoría.');
    if (!updated) throw notFound('Categoría no encontrada.');
    const cfg = await settingsRow(req); const p = currentPeriod(cfg.cutoff_day);
    if (b.budget !== undefined) check(await req.supabase.from('budgets').upsert({ household_id: req.householdId, category_id: id, period_start: p.from, amount_cents: toCents(b.budget) }, { onConflict: 'household_id,category_id,period_start' }));
    res.json({ category: (await categoriesFor(req, p.from)).find((c) => c.id === id) });
  });
  router.delete('/categories/:id', async (req, res) => {
    const id = req.params.id;
    const used = rowCount(await req.supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('household_id', req.householdId).eq('category_id', id));
    const categoryCount = rowCount(await req.supabase.from('categories').select('id', { count: 'exact', head: true }).eq('household_id', req.householdId));
    if (categoryCount <= 1) throw conflict('Debes conservar al menos una categoría.');
    let target = null;
    if (used) {
      target = req.query.reassignTo;
      if (!target || target === id) throw conflict(`Esta categoría tiene ${used} movimiento(s). Elige otra categoría a la cual moverlos.`);
      const found = check(await req.supabase.from('categories').select('id').eq('household_id', req.householdId).eq('id', target).maybeSingle());
      if (!found) throw badRequest('La categoría de destino no existe.');
      for (const table of ['incomes', 'expenses']) check(await req.supabase.from(table).update({ category_id: target }).eq('household_id', req.householdId).eq('category_id', id));
    }
    check(await req.supabase.from('categories').delete().eq('household_id', req.householdId).eq('id', id));
    res.json({ ok: true, moved: used });
  });

  router.get('/members', async (req, res) => res.json({ members: await membersFor(req) }));
  router.post('/members', validate('body', S.member), async (req, res) => {
    const b = req.valid.body; const m = check(await req.supabase.from('family_members').insert({ household_id: req.householdId, name: b.name, role: b.role, emoji: b.emoji, color: b.color }).select('*').single());
    res.status(201).json({ member: { id: m.id, name: m.name, role: m.role, emoji: m.emoji, color: m.color } });
  });
  router.put('/members/:id', validate('body', S.member), async (req, res) => {
    const b = req.valid.body; const m = check(await req.supabase.from('family_members').update({ name: b.name, role: b.role, emoji: b.emoji, color: b.color }).eq('household_id', req.householdId).eq('id', req.params.id).select('*').maybeSingle());
    if (!m) throw notFound('Miembro no encontrado.');
    res.json({ member: { id: m.id, name: m.name, role: m.role, emoji: m.emoji, color: m.color } });
  });
  router.delete('/members/:id', async (req, res) => {
    const kept = rowCount(await req.supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('household_id', req.householdId).eq('family_member_id', req.params.id));
    const removed = check(await req.supabase.from('family_members').delete().eq('household_id', req.householdId).eq('id', req.params.id).select('id'));
    if (!removed.length) throw notFound('Miembro no encontrado.');
    res.json({ ok: true, keptTransactions: kept });
  });

  router.get('/transactions', validate('query', S.txQuery), async (req, res) => res.json(await pageTransactions(req, req.valid.query)));
  router.get('/transactions/export.csv', validate('query', S.txQuery), async (req, res) => {
    const cfg = await settingsRow(req); const rows = await readTransactions(req, req.valid.query); const decorated = await decorateTransactions(req, rows, cfg.ant_limit_cents);
    const header = ['Fecha', 'Tipo', 'Descripción', 'Categoría', 'Miembro', 'Monto', 'Nota'];
    const lines = decorated.map((t) => [t.date, t.type, t.description, t.category?.name, t.member?.name, t.amount.toFixed(2), t.note].map(csvCell).join(','));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', 'attachment; filename="finpro-movimientos.csv"');
    res.send('\uFEFF' + [header.join(','), ...lines].join('\r\n'));
  });
  router.get('/transactions/:id', async (req, res) => {
    const t = await oneTransaction(req, req.params.id); if (!t) throw notFound('Movimiento no encontrado.'); res.json({ transaction: t });
  });
  router.post('/transactions', validate('body', S.transaction), async (req, res) => {
    const b = req.valid.body; await validateReferences(req, b);
    const table = b.type === 'ingreso' ? 'incomes' : 'expenses';
    const row = check(await req.supabase.from(table).insert({ household_id: req.householdId, category_id: b.categoryId, family_member_id: b.memberId || null,
      created_by: req.user.id, amount_cents: toCents(b.amount), description: b.description, note: b.note || '', occurred_on: b.date }).select('id').single(), 'No se pudo crear el movimiento.');
    res.status(201).json({ transaction: await oneTransaction(req, row.id) });
  });
  router.put('/transactions/:id', validate('body', S.transaction), async (req, res) => {
    const b = req.valid.body; await validateReferences(req, b);
    const existing = await oneTransaction(req, req.params.id); if (!existing) throw notFound('Movimiento no encontrado.');
    const table = existing.type === 'ingreso' ? 'incomes' : 'expenses';
    check(await req.supabase.from(table).update({ category_id: b.categoryId, family_member_id: b.memberId || null, amount_cents: toCents(b.amount), description: b.description, note: b.note || '', occurred_on: b.date }).eq('household_id', req.householdId).eq('id', req.params.id));
    res.json({ transaction: await oneTransaction(req, req.params.id) });
  });
  router.delete('/transactions/:id', async (req, res) => {
    const t = await oneTransaction(req, req.params.id); if (!t) throw notFound('Movimiento no encontrado.');
    const table = t.type === 'ingreso' ? 'incomes' : 'expenses';
    const removed = check(await req.supabase.from(table).delete().eq('household_id', req.householdId).eq('id', req.params.id).select('id'));
    if (!removed.length) throw notFound('Movimiento no encontrado.'); res.json({ ok: true });
  });

  router.get('/reports/summary', validate('query', S.periodQuery), async (req, res) => res.json(await summary(req, req.valid.query)));
  router.get('/reports/monthly', validate('query', S.periodQuery), async (req, res) => {
    const q = req.valid.query; const cfg = await settingsRow(req); const first = shiftPeriod(q.year, q.month, 1 - q.months, cfg.cutoff_day); const last = getPeriod(q.year, q.month, cfg.cutoff_day);
    const rows = await readTransactions(req, { from: first.from, to: last.to });
    const out = [];
    for (let i = q.months - 1; i >= 0; i--) {
      const p = shiftPeriod(q.year, q.month, -i, cfg.cutoff_day); const part = rows.filter((r) => r.date >= p.from && r.date <= p.to);
      out.push({ year: p.year, month: p.month, from: p.from, to: p.to,
        spent: fromCents(part.filter((r) => r.type === 'gasto').reduce((s, r) => s + r.amount_cents, 0)),
        income: fromCents(part.filter((r) => r.type === 'ingreso').reduce((s, r) => s + r.amount_cents, 0)) });
    }
    res.json({ months: out });
  });

  router.get('/data/export.json', async (req, res) => {
    const cfg = await settingsRow(req); const p = currentPeriod(cfg.cutoff_day); const [categories, members, rows, user] = await Promise.all([categoriesFor(req, p.from), membersFor(req), readTransactions(req), authMe(req)]);
    const decorated = await decorateTransactions(req, rows, 0);
    res.setHeader('Content-Disposition', 'attachment; filename="finpro-datos.json"');
    res.json({ exportedAt: new Date().toISOString(), user: { name: user.name, email: user.email }, settings: settingsDto(cfg), categories, members,
      transactions: decorated.map((t) => ({ id: t.id, type: t.type, amount: t.amount, description: t.description, note: t.note, date: t.date, category: t.category?.name, member: t.member?.name || null })) });
  });
  router.post('/data/wipe', validate('body', S.auth.confirmPassword), async (req, res) => {
    if (!['owner', 'admin'].includes(req.membershipRole)) throw forbidden('Solo el titular o un administrador puede borrar los datos del hogar.');
    await authRequest('/token?grant_type=password', { body: { email: req.user.email, password: req.valid.body.password } });
    check(await req.supabase.rpc('wipe_own_household'));
    res.json({ ok: true });
  });
  router.post('/data/demo', (_req, _res) => { throw new AppError(410, 'DEMO_DISABLED', 'Los datos de ejemplo están desactivados; registra movimientos reales.'); });

  router.get('/admin/stats', async (req, res) => {
    if (!['owner', 'admin'].includes(req.membershipRole)) return failRls(res);
    const [m, t, a] = await Promise.all([
      req.supabase.from('household_members').select('user_id', { count: 'exact', head: true }).eq('household_id', req.householdId),
      req.supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('household_id', req.householdId),
      req.supabase.from('household_members').select('user_id', { count: 'exact', head: true }).eq('household_id', req.householdId).eq('role', 'owner'),
    ]);
    res.json({ stats: { users: m.count || 0, activeUsers: m.count || 0, admins: a.count || 0, transactions: t.count || 0, newLast7Days: 0 } });
  });
  router.get('/admin/users', validate('query', S.admin.listUsers), async (req, res) => {
    if (!['owner', 'admin'].includes(req.membershipRole)) return failRls(res);
    const q = req.valid.query;
    const base = check(await req.supabase.from('household_members').select('household_id,user_id,role,is_active,joined_at,profiles(id,full_name,email)', { count: 'exact' }).eq('household_id', req.householdId).order('joined_at', { ascending: false }), 'No se pudo cargar el hogar.');
    const filtered = base.filter((m) => (!q.q || `${m.profiles?.full_name} ${m.profiles?.email}`.toLowerCase().includes(q.q.toLowerCase()))
      && (!q.role || (q.role === 'admin' ? ['owner','admin'].includes(m.role) : m.role === 'member'))
      && (!q.status || (q.status === 'active' ? m.is_active : !m.is_active)));
    const pageItems = filtered.slice((q.page - 1) * q.limit, q.page * q.limit);
    const items = await Promise.all(pageItems.map(async (m) => {
      const [tx, mem] = await Promise.all([
        req.supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('household_id', req.householdId),
        req.supabase.from('family_members').select('id', { count: 'exact', head: true }).eq('household_id', req.householdId),
      ]);
      return { id: m.user_id, name: m.profiles?.full_name || '', email: m.profiles?.email || '', role: m.role === 'member' ? 'user' : 'admin', isActive: m.is_active, createdAt: m.joined_at, txCount: tx.count || 0, memberCount: mem.count || 0 };
    }));
    res.json({ items, total: filtered.length, page: q.page, limit: q.limit, pages: Math.max(1, Math.ceil(filtered.length / q.limit)) });
  });
  router.patch('/admin/users/:id', validate('body', S.admin.updateUser), async (req, res) => {
    if (!['owner', 'admin'].includes(req.membershipRole)) return failRls(res);
    const targetId = req.params.id; const { role, isActive } = req.valid.body;
    if (targetId === req.user.id && (isActive === false || role === 'user')) throw conflict('No puedes desactivar tu propia cuenta ni quitarte permisos.');
    const target = check(await req.supabase.from('household_members').select('*').eq('household_id', req.householdId).eq('user_id', targetId).maybeSingle());
    if (!target) throw notFound('Usuario no encontrado en este hogar.');
    const update = {};
    if (role) update.role = role === 'admin' ? (target.role === 'owner' ? 'owner' : 'admin') : 'member';
    if (isActive !== undefined) update.is_active = isActive;
    const updated = check(await req.supabase.from('household_members').update(update).eq('household_id', req.householdId).eq('user_id', targetId).select('*').single());
    res.json({ user: { id: targetId, role: updated.role === 'member' ? 'user' : 'admin', isActive: updated.is_active } });
  });
  router.delete('/admin/users/:id', async (req, res) => {
    if (!['owner', 'admin'].includes(req.membershipRole)) return failRls(res);
    if (req.params.id === req.user.id) throw conflict('No puedes quitarte del hogar desde este panel.');
    const removed = check(await req.supabase.from('household_members').delete().eq('household_id', req.householdId).eq('user_id', req.params.id).select('user_id'));
    if (!removed.length) throw notFound('Usuario no encontrado en este hogar.');
    res.json({ ok: true });
  });
  router.post('/admin/users/:id/send-reset', async (req, res) => {
    if (!['owner', 'admin'].includes(req.membershipRole)) return failRls(res);
    const profile = check(await req.supabase.from('profiles').select('email').eq('id', req.params.id).maybeSingle());
    if (!profile?.email) throw notFound('No se encontró el correo de ese usuario.');
    await authRequest(`/recover?redirect_to=${encodeURIComponent(`${require('../config').appUrl}/reset.html`)}`, { body: { email: profile.email } });
    res.json({ ok: true, message: `Se envió el enlace de recuperación a ${profile.email}.` });
  });
}

module.exports = { makeRouterHandlers };
