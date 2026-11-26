'use strict';
process.env.NODE_ENV = 'test';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateProductionSupabase } = require('../server/config');

test('production requires an HTTPS Supabase project and a public anon/publishable key', () => {
  const url = 'https://finpro.supabase.co';
  assert.throws(() => validateProductionSupabase({ production: true, url: '', key: '' }), /requires SUPABASE_URL and SUPABASE_ANON_KEY/);
  assert.throws(() => validateProductionSupabase({ production: true, url: 'http://finpro.supabase.co', key: 'sb_publishable_abcdefghijklmnop' }), /HTTPS/);
  assert.throws(() => validateProductionSupabase({ production: true, url, key: 'sb_secret_abcdefghijklmnop' }), /publishable or legacy anon/i);
  assert.doesNotThrow(() => validateProductionSupabase({ production: true, url, key: 'sb_publishable_abcdefghijklmnop' }));
});

test('production accepts legacy Supabase JWT keys only when the role is anon', () => {
  const anon = `header.${Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url')}.signature`;
  const service = `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
  assert.doesNotThrow(() => validateProductionSupabase({ production: true, url: 'https://finpro.supabase.co', key: anon }));
  assert.throws(() => validateProductionSupabase({ production: true, url: 'https://finpro.supabase.co', key: service }), /publishable or legacy anon/i);
});

test('development and tests may still use SQLite without Supabase variables', () => {
  assert.doesNotThrow(() => validateProductionSupabase({ production: false, url: '', key: '' }));
});
