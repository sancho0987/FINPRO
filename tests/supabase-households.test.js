'use strict';
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const express = require('express');
const request = require('supertest');
const { makeRouterHandlers } = require('../server/supabase/api');

test('atomic transaction migration preserves the movement ID and changes source table inside one function', () => {
  const sql = readFileSync('supabase/migrations/202611240006_atomic_transaction_update.sql', 'utf8');
  assert.match(sql, /insert into public\.incomes \(id, household_id, category_id, family_member_id, created_by/i);
  assert.match(sql, /insert into public\.expenses \(id, household_id, category_id, family_member_id, created_by/i);
  assert.match(sql, /movement_created_at := old_(income|expense)\.created_at/i);
  assert.match(sql, /occurred_on, created_at, updated_at\)/i);
  assert.match(sql, /delete from public\.expenses where id = p_id/i);
  assert.match(sql, /delete from public\.incomes where id = p_id/i);
  assert.match(sql, /for update/i);
  assert.match(sql, /grant execute on function public\.update_transaction/i);
});

test('role migration limits member movement writes and manager-only shared configuration', () => {
  const sql = readFileSync('supabase/migrations/202611240008_role_permissions.sql', 'utf8');
  assert.match(sql, /created_by = \(select auth\.uid\(\)\)/i);
  assert.match(sql, /create policy "categories_manage_admin"[\s\S]*can_manage_household/i);
  assert.match(sql, /actor_role = 'admin' and target_role = 'admin'/i);
  assert.match(sql, /only the owner can promote administrators/i);
});

test('the current Supabase router does not expose invitation or household-switch endpoints', async () => {
  let dbCalls = 0;
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.householdId = 'home-1';
    req.user = { id: 'user-1' };
    req.supabase = { from: () => { dbCalls++; throw new Error('No disabled feature should query Supabase.'); }, rpc: () => { dbCalls++; throw new Error('No disabled feature should call an RPC.'); } };
    next();
  });
  makeRouterHandlers(app);
  app.use((_req, res) => res.status(404).json({ error: 'not found' }));
  for (const [method, path] of [
    ['get', '/invitations'], ['post', '/invitations'], ['delete', '/invitations/invite-id'],
    ['post', '/invitations/accept'], ['post', '/households/select'],
  ]) {
    const res = await request(app)[method](path).send({});
    assert.equal(res.status, 404);
  }
  assert.equal(dbCalls, 0);
  const files = [
    readFileSync('server/supabase/api.js', 'utf8'),
    readFileSync('server/supabase/session.js', 'utf8'),
    readFileSync('server/supabase/auth.js', 'utf8'),
    readFileSync('public/js/pages/familia.js', 'utf8'),
    readFileSync('public/js/app.js', 'utf8'),
    readFileSync('public/js/auth.js', 'utf8'),
  ].join('\n');
  assert.doesNotMatch(files, /household_invitations|create_household_invitation|accept_household_invitation|revoke_household_invitation|households\/select|data-invite-form/i);
});

test('the production membership key remains unique per user', () => {
  const sql = readFileSync('supabase/migrations/202611240001_initial_schema.sql', 'utf8');
  const roleAndSafetyMigrations = [
    'supabase/migrations/202611240006_atomic_transaction_update.sql',
    'supabase/migrations/202611240007_preserve_movements_on_account_delete.sql',
    'supabase/migrations/202611240008_role_permissions.sql',
  ].map((file) => readFileSync(file, 'utf8')).join('\n');
  assert.match(sql, /unique \(user_id\)/i);
  assert.doesNotMatch(roleAndSafetyMigrations, /drop constraint household_members_user_id_key/i);
  assert.doesNotMatch(readFileSync('server/supabase/api.js', 'utf8'), /household_invitations|accept_household_invitation/i);
});

test('account deletion preserves household data when there is no active successor', () => {
  const sql = readFileSync('supabase/migrations/202611240007_preserve_movements_on_account_delete.sql', 'utf8');
  assert.match(sql, /where user_id = actor and is_active[\s\S]*for update/i);
  assert.match(sql, /exists \(select 1 from public\.incomes where created_by = actor\)/i);
  assert.match(sql, /on delete restrict/i);
  assert.match(sql, /last active household member cannot leave without a successor/i);
  assert.match(sql, /if next_owner is null then[\s\S]*raise exception[\s\S]*end if/i);
  assert.doesNotMatch(sql, /delete from public\.households/i);
});
