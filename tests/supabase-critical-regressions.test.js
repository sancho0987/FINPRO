'use strict';
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const express = require('express');
const request = require('supertest');
const config = require('../server/config');
const { register } = require('../server/supabase/auth');
const { makeRouterHandlers, budgetTotals, settingsDto } = require('../server/supabase/api');

test('Supabase respeta el cierre de registro antes de llamar al proveedor de identidad', async (t) => {
  const originalAllowRegistration = config.allowRegistration;
  const originalFetch = globalThis.fetch;
  t.after(() => {
    config.allowRegistration = originalAllowRegistration;
    globalThis.fetch = originalFetch;
  });
  config.allowRegistration = false;
  globalThis.fetch = async () => { throw new Error('No debe llamar a Supabase si el registro está cerrado.'); };

  await assert.rejects(
    register({ valid: { body: { name: 'Ana', email: 'ana@example.com', password: 'Clave1234' } } }, {}),
    (error) => error.status === 403 && error.code === 'FORBIDDEN'
  );
});

test('Supabase guarda y expone el presupuesto mensual global sin cambiar el contrato de settings', async () => {
  const app = express();
  let changes;
  app.use(express.json());
  app.use((req, _res, next) => {
    req.householdId = 'household-1';
    req.supabase = {
      from: (table) => {
        assert.equal(table, 'households');
        return {
          update: (values) => {
            changes = values;
            return {
              eq: () => ({
                select: () => ({
                  single: async () => ({
                    data: { id: 'household-1', ...values }, error: null,
                  }),
                }),
              }),
            };
          },
        };
      },
    };
    next();
  });
  makeRouterHandlers(app);

  const res = await request(app).put('/settings').send({
    householdName: 'Casa', currency: 'COP', cutoffDay: 1, alertPct: 80, antLimit: 30000, monthlyBudget: 1250000,
  });

  assert.equal(res.status, 200);
  assert.equal(changes.monthly_budget_cents, 125000000);
  assert.equal(res.body.settings.monthlyBudget, 1250000);
  assert.deepEqual(settingsDto({ name: 'Casa', currency: 'COP', cutoff_day: 1, alert_pct: 80, ant_limit_cents: 3000000, monthly_budget_cents: 125000000 }), {
    householdName: 'Casa', currency: 'COP', cutoffDay: 1, alertPct: 80, antLimit: 30000, monthlyBudget: 1250000,
  });
});

test('Supabase usa el presupuesto global cuando existe y conserva el total por categorías como fallback', () => {
  assert.deepEqual(budgetTotals({ monthly_budget_cents: 0 }, 80000000), {
    monthlyBudgetCents: 0, categoryBudgetCents: 80000000, budgetTotalCents: 80000000,
  });
  assert.deepEqual(budgetTotals({ monthly_budget_cents: 125000000 }, 80000000), {
    monthlyBudgetCents: 125000000, categoryBudgetCents: 80000000, budgetTotalCents: 125000000,
  });
});

test('La migración mensual es aditiva y reinicia el presupuesto global al borrar datos', () => {
  const sql = readFileSync('supabase/migrations/202611260001_add_monthly_budget.sql', 'utf8');
  assert.match(sql, /add column if not exists monthly_budget_cents bigint not null default 0/i);
  assert.match(sql, /monthly_budget_cents >= 0/i);
  assert.match(sql, /monthly_budget_cents = 0/i);
  assert.match(sql, /grant execute on function public\.wipe_own_household\(\) to authenticated/i);
});
