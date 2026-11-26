'use strict';
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { deleteAccount } = require('../server/supabase/auth');

test('Supabase maps the database movement-preservation guard to a conflict without clearing the session', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({}) });

  let rpcCalls = 0;
  const clearedCookies = [];
  const req = {
    valid: { body: { password: 'test-password' } },
    user: { email: 'test@example.com' },
    supabase: { rpc: async (name) => { rpcCalls++; assert.equal(name, 'delete_own_account'); return { error: { code: '55000' } }; } },
  };
  const res = { clearCookie: (name) => clearedCookies.push(name), json: () => { throw new Error('La cuenta no debió responder como eliminada.'); } };

  await assert.rejects(deleteAccount(req, res), (error) => {
    assert.equal(error.status, 409);
    assert.equal(error.code, 'ACCOUNT_DELETE_BLOCKED');
    assert.match(error.message, /movimientos o el hogar sin una atribución y titularidad seguras/);
    return true;
  });
  assert.equal(rpcCalls, 1);
  assert.deepEqual(clearedCookies, []);
});
