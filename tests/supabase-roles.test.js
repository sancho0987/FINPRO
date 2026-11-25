'use strict';
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { manageHouseholdMember } = require('../server/supabase/api');

const roleMigration = fs.readFileSync(path.join(__dirname, '../supabase/migrations/202611240008_role_permissions.sql'), 'utf8');

test('role migration prevents movements from crossing household RLS boundaries', () => {
  assert.match(roleMigration, /new\.household_id\s+is distinct from\s+old\.household_id/i);
  assert.match(roleMigration, /incomes_prevent_household_change[\s\S]*?before update of household_id on public\.incomes/i);
  assert.match(roleMigration, /expenses_prevent_household_change[\s\S]*?before update of household_id on public\.expenses/i);
  assert.match(roleMigration, /using errcode\s*=\s*'42501'/i);
});

test('role migration keeps creator attribution immutable during manager edits', () => {
  assert.match(roleMigration, /prevent_movement_attribution_change/i);
  assert.match(roleMigration, /incomes_prevent_attribution_change[\s\S]*before update of created_by on public\.incomes/i);
  assert.match(roleMigration, /expenses_prevent_attribution_change[\s\S]*before update of created_by on public\.expenses/i);
  assert.match(roleMigration, /created_by = \(select auth\.uid\(\)\) or public\.can_manage_household\(household_id\)/i);
});

test('production compatibility preflight contains only read-only SELECT statements', () => {
  const sql = fs.readFileSync(path.join(__dirname, '../supabase/verification/preflight_006_008.sql'), 'utf8');
  const statements = sql.replace(/^\s*--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);
  assert.ok(statements.length >= 10);
  for (const statement of statements) {
    assert.match(statement, /^(?:select\b|with\b[\s\S]*\)\s*select\b)/i);
  }
  assert.doesNotMatch(sql, /^\s*(?:insert|update|delete|alter|drop|create|truncate|grant|revoke)\b/gim);
});

test('Supabase delegates membership changes to the role-checking RPC', async () => {
  let call;
  const req = { householdId: 'house-1', supabase: {
    rpc: async (...args) => { call = args; return { data: null, error: null }; },
  } };

  await manageHouseholdMember(req, { userId: 'member-2', role: 'member', isActive: false });

  assert.equal(call[0], 'manage_household_member');
  assert.deepEqual(call[1], {
    p_household_id: 'house-1', p_user_id: 'member-2', p_role: 'member', p_is_active: false, p_remove: false,
  });
});

test('Supabase routes member removal through the guarded membership RPC', async () => {
  let call;
  const req = { householdId: 'house-1', supabase: {
    rpc: async (...args) => { call = args; return { data: null, error: null }; },
  } };

  await manageHouseholdMember(req, { userId: 'member-3', remove: true });

  assert.equal(call[0], 'manage_household_member');
  assert.deepEqual(call[1], {
    p_household_id: 'house-1', p_user_id: 'member-3', p_role: null, p_is_active: null, p_remove: true,
  });
});

test('membership RPC errors are not reported as successful changes', async () => {
  const req = { householdId: 'house-1', supabase: {
    rpc: async () => ({ data: null, error: { code: '42501' } }),
  } };

  await assert.rejects(
    manageHouseholdMember(req, { userId: 'owner-1', role: 'member' }),
    (error) => error.status === 403 && error.code === 'SUPABASE_DATA'
  );
});
