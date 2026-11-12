'use strict';
const { getDb } = require('../db');
const settingsModel = require('../models/settings');
const { fromCents, toCents } = require('../utils/money');
const { getPeriod, shiftPeriod, addDays, todayStr } = require('../utils/period');

function summary(userId, { year, month, today }) {
  const db = getDb();
  const cfg = settingsModel.get(userId);
  const p = getPeriod(year, month, cfg.cutoffDay);
  const antLimit = toCents(cfg.antLimit);

  const totals = db
    .prepare(
      `SELECT COUNT(*) AS n,
              COALESCE(SUM(CASE WHEN type='gasto'   THEN amount_cents END),0) AS spent,
              COALESCE(SUM(CASE WHEN type='ingreso' THEN amount_cents END),0) AS income
       FROM transactions WHERE user_id = ? AND date BETWEEN ? AND ?`
    )
    .get(userId, p.from, p.to);

  const budgetTotal = db.prepare('SELECT COALESCE(SUM(budget_cents),0) b FROM categories WHERE user_id = ?').get(userId).b;

  const byCategory = db
    .prepare(
      `SELECT c.id, c.name, c.emoji, c.color, c.budget_cents, c.is_ant,
              COALESCE(SUM(CASE WHEN t.type='gasto' THEN t.amount_cents END),0) AS spent,
              COALESCE(SUM(CASE WHEN t.type='ingreso' THEN t.amount_cents END),0) AS income,
              COUNT(t.id) AS n
       FROM categories c
       LEFT JOIN transactions t ON t.category_id = c.id AND t.user_id = c.user_id AND t.date BETWEEN ? AND ?
       WHERE c.user_id = ? GROUP BY c.id ORDER BY c.sort_order, c.id`
    )
    .all(p.from, p.to, userId)
    .map((r) => ({
      id: r.id, name: r.name, emoji: r.emoji, color: r.color, isAnt: !!r.is_ant,
      budget: fromCents(r.budget_cents), spent: fromCents(r.spent), income: fromCents(r.income), count: r.n,
    }));

  const byMember = db
    .prepare(
      `SELECT m.id, m.name, m.role, m.emoji, m.color,
              COALESCE(SUM(CASE WHEN t.type='gasto' THEN t.amount_cents END),0) AS spent,
              COALESCE(SUM(CASE WHEN t.type='gasto' THEN 1 END),0) AS n
       FROM members m
       LEFT JOIN transactions t ON t.member_id = m.id AND t.user_id = m.user_id AND t.date BETWEEN ? AND ?
       WHERE m.user_id = ? GROUP BY m.id ORDER BY m.id`
    )
    .all(p.from, p.to, userId)
    .map((r) => ({ id: r.id, name: r.name, role: r.role, emoji: r.emoji, color: r.color, spent: fromCents(r.spent), count: r.n }));

  const unassigned = db
    .prepare(
      `SELECT COALESCE(SUM(amount_cents),0) s, COUNT(*) n FROM transactions
       WHERE user_id = ? AND member_id IS NULL AND type='gasto' AND date BETWEEN ? AND ?`
    )
    .get(userId, p.from, p.to);

  const ant = db
    .prepare(
      `SELECT COALESCE(SUM(t.amount_cents),0) s, COUNT(*) n FROM transactions t JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = ? AND t.type='gasto' AND t.date BETWEEN ? AND ? AND (c.is_ant = 1 OR (? > 0 AND t.amount_cents < ?))`
    )
    .get(userId, p.from, p.to, antLimit, antLimit);

  // Serie diaria: 14 días que terminan hoy (si hoy cae en el período) o en el último día del período
  const t = today || todayStr();
  let end = p.to;
  if (t >= p.from && t <= p.to) end = t;
  const start = addDays(end, -13);
  const dailyRows = db
    .prepare(
      `SELECT date, SUM(amount_cents) s FROM transactions
       WHERE user_id = ? AND type='gasto' AND date BETWEEN ? AND ? GROUP BY date`
    )
    .all(userId, start, end);
  const map = new Map(dailyRows.map((r) => [r.date, r.s]));
  const daily = [];
  for (let i = 0; i < 14; i++) {
    const d = addDays(start, i);
    daily.push({ date: d, amount: fromCents(map.get(d) || 0) });
  }

  const pct = budgetTotal ? Math.round((totals.spent / budgetTotal) * 100) : 0;
  return {
    period: { from: p.from, to: p.to, year: p.year, month: p.month },
    budgetTotal: fromCents(budgetTotal),
    spent: fromCents(totals.spent),
    income: fromCents(totals.income),
    balance: fromCents(totals.income - totals.spent),
    available: fromCents(budgetTotal - totals.spent),
    pct,
    txCount: totals.n,
    antTotal: fromCents(ant.s),
    antCount: ant.n,
    byCategory,
    byMember,
    unassigned: { spent: fromCents(unassigned.s), count: unassigned.n },
    daily,
  };
}

function monthly(userId, { year, month, months }) {
  const db = getDb();
  const cfg = settingsModel.get(userId);
  const stmt = db.prepare(
    `SELECT COALESCE(SUM(CASE WHEN type='gasto' THEN amount_cents END),0) AS spent,
            COALESCE(SUM(CASE WHEN type='ingreso' THEN amount_cents END),0) AS income
     FROM transactions WHERE user_id = ? AND date BETWEEN ? AND ?`
  );
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const p = shiftPeriod(year, month, -i, cfg.cutoffDay);
    const r = stmt.get(userId, p.from, p.to);
    out.push({ year: p.year, month: p.month, from: p.from, to: p.to, spent: fromCents(r.spent), income: fromCents(r.income) });
  }
  return out;
}

module.exports = { summary, monthly };
