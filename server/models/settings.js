'use strict';
const { getDb } = require('../db');
const { toCents, fromCents } = require('../utils/money');

const toDto = (r) => ({
  householdName: r.household_name,
  currency: r.currency,
  cutoffDay: r.cutoff_day,
  alertPct: r.alert_pct,
  antLimit: fromCents(r.ant_limit_cents),
  monthlyBudget: fromCents(r.monthly_budget_cents),
});

function ensure(userId) {
  getDb().prepare('INSERT OR IGNORE INTO settings (user_id) VALUES (?)').run(userId);
}

function get(userId) {
  ensure(userId);
  return toDto(getDb().prepare('SELECT * FROM settings WHERE user_id = ?').get(userId));
}

function update(userId, s) {
  ensure(userId);
  getDb()
    .prepare(
      `UPDATE settings
       SET household_name = ?, currency = ?, cutoff_day = ?, alert_pct = ?, ant_limit_cents = ?,
           monthly_budget_cents = COALESCE(?, monthly_budget_cents)
       WHERE user_id = ?`
    )
    .run(s.householdName, s.currency, s.cutoffDay, s.alertPct, toCents(s.antLimit), s.monthlyBudget === undefined ? null : toCents(s.monthlyBudget), userId);
  return get(userId);
}

function reset(userId) {
  getDb().prepare('DELETE FROM settings WHERE user_id = ?').run(userId);
  return get(userId);
}

module.exports = { get, update, reset };
