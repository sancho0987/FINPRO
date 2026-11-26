'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { authRequest } = require('../server/supabase/auth');

test('Supabase email delivery errors are reported with an actionable message and no PII', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  const logged = [];
  t.after(() => {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  });

  console.warn = (message) => logged.push(String(message));
  globalThis.fetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({
      code: 'email_address_not_authorized',
      msg: 'Email address not authorized: private.person@example.com',
    }),
  });

  await assert.rejects(
    authRequest('/signup?redirect_to=https%3A%2F%2Ffinpro.example%2Fapp', {
      body: { email: 'private.person@example.com', password: 'do-not-log-this' },
    }),
    (error) => {
      assert.equal(error.status, 503);
      assert.equal(error.code, 'AUTH_EMAIL_PROVIDER_UNCONFIGURED');
      assert.match(error.message, /SMTP personalizado/);
      return true;
    },
  );

  assert.equal(logged.length, 1);
  assert.match(logged[0], /POST \/signup status=500 code=email_address_not_authorized/);
  assert.doesNotMatch(logged[0], /private\.person|do-not-log-this/);
});

test('Supabase email rate limits return a specific retryable error', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  t.after(() => {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
  });

  console.warn = () => {};
  globalThis.fetch = async () => ({
    ok: false,
    status: 429,
    json: async () => ({ code: 'over_email_send_rate_limit', msg: 'email rate limit exceeded' }),
  });

  await assert.rejects(
    authRequest('/signup', { body: { email: 'test@example.com', password: 'do-not-log-this' } }),
    (error) => {
      assert.equal(error.status, 429);
      assert.equal(error.code, 'AUTH_EMAIL_RATE_LIMIT');
      assert.match(error.message, /límite temporal/);
      return true;
    },
  );
});
