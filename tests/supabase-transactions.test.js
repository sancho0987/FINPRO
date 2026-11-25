'use strict';
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { updateSupabaseTransaction } = require('../server/supabase/api');

const body = (overrides = {}) => ({
  type: 'ingreso', amount: 1234.56, description: 'Devolución', note: 'Ajuste',
  date: '2026-10-05', categoryId: 'income-cat', memberId: null, ...overrides,
});

test('Supabase usa la RPC atómica al cambiar de gasto a ingreso', async () => {
  const calls = [];
  const req = { householdId: 'house-1', supabase: {
    rpc: async (...args) => { calls.push(args); return { data: null, error: null }; },
    from: () => { throw new Error('Un cambio de tipo no debe ejecutarse con escrituras separadas.'); },
  } };

  await updateSupabaseTransaction(req, 'movement-1', body(), { type: 'gasto' });

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'update_transaction');
  assert.deepEqual(calls[0][1], {
    p_id: 'movement-1', p_type: 'ingreso', p_category_id: 'income-cat', p_family_member_id: null,
    p_amount_cents: 123456, p_description: 'Devolución', p_note: 'Ajuste', p_occurred_on: '2026-10-05',
  });
});

test('Supabase usa la RPC atómica al cambiar de ingreso a gasto', async () => {
  let called = false;
  const req = { householdId: 'house-1', supabase: {
    rpc: async (name, args) => { called = true; assert.equal(name, 'update_transaction'); assert.equal(args.p_type, 'gasto'); return { data: null, error: null }; },
    from: () => { throw new Error('Un cambio de tipo no debe ejecutarse con escrituras separadas.'); },
  } };

  await updateSupabaseTransaction(req, 'movement-2', body({ type: 'gasto' }), { type: 'ingreso' });
  assert.equal(called, true);
});

test('Supabase conserva la actualización directa cuando el tipo no cambia', async () => {
  const writes = [];
  const query = { eq() { return this; }, then(resolve, reject) { return Promise.resolve({ data: null, error: null }).then(resolve, reject); } };
  const req = { householdId: 'house-1', supabase: {
    rpc: async () => { throw new Error('No debe llamar a la RPC si el tipo no cambia.'); },
    from: (table) => ({ update: (values) => { writes.push({ table, values }); return query; } }),
  } };

  await updateSupabaseTransaction(req, 'movement-3', body({ type: 'ingreso' }), { type: 'ingreso' });

  assert.equal(writes.length, 1);
  assert.equal(writes[0].table, 'incomes');
  assert.equal(writes[0].values.amount_cents, 123456);
  assert.equal(writes[0].values.category_id, 'income-cat');
});

test('Supabase no reporta éxito si la RPC atómica devuelve error', async () => {
  const req = { householdId: 'house-1', supabase: {
    rpc: async () => ({ data: null, error: { code: '42501', message: 'denied' } }),
  } };

  await assert.rejects(
    updateSupabaseTransaction(req, 'movement-4', body(), { type: 'gasto' }),
    (error) => error.status === 403 && error.code === 'SUPABASE_DATA'
  );
});
