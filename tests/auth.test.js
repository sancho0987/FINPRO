'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { agent, newUser, categoryId, PASSWORD, outbox, request, app } = require('./helpers');

describe('Registro', () => {
  test('crea la cuenta, abre sesión con cookie httpOnly y siembra categorías', async () => {
    const a = agent();
    const res = await a.post('/api/auth/register').send({ name: 'Ana Pérez', email: 'ANA@Test.com ', password: PASSWORD });
    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, 'ana@test.com');
    assert.equal(res.body.user.role, 'user');
    assert.equal(res.body.user.password_hash, undefined);
    assert.equal(res.body.user.passwordHash, undefined);
    const cookie = res.headers['set-cookie'][0];
    assert.match(cookie, /finpro_sid=/);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
    const cats = await a.get('/api/categories');
    assert.equal(cats.status, 200);
    assert.ok(cats.body.categories.length >= 10);
  });

  test('rechaza correo duplicado', async () => {
    const u = await newUser();
    const res = await agent().post('/api/auth/register').send({ name: 'Otro', email: u.email, password: PASSWORD });
    assert.equal(res.status, 409);
    assert.ok(res.body.error.fields.email);
  });

  test('valida contraseña débil, correo inválido y nombre corto', async () => {
    const a = agent();
    let res = await a.post('/api/auth/register').send({ name: 'Ana', email: 'a@b.co', password: 'corta1' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.fields.password);
    res = await a.post('/api/auth/register').send({ name: 'Ana', email: 'a@b.co', password: 'soloLetrasAqui' });
    assert.equal(res.status, 400);
    res = await a.post('/api/auth/register').send({ name: 'Ana', email: 'no-es-correo', password: PASSWORD });
    assert.ok(res.body.error.fields.email);
    res = await a.post('/api/auth/register').send({ name: 'A', email: 'a@b.co', password: PASSWORD });
    assert.ok(res.body.error.fields.name);
  });
});

describe('Login, sesión y logout', () => {
  test('login correcto y /me', async () => {
    const u = await newUser();
    const a = agent();
    const res = await a.post('/api/auth/login').send({ email: u.email, password: u.password });
    assert.equal(res.status, 200);
    const me = await a.get('/api/auth/me');
    assert.equal(me.body.user.email, u.email);
  });

  test('mismo mensaje para correo inexistente y contraseña errónea', async () => {
    const u = await newUser();
    const a = await agent().post('/api/auth/login').send({ email: u.email, password: 'Equivocada1' });
    const b = await agent().post('/api/auth/login').send({ email: 'nadie@test.com', password: 'Equivocada1' });
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.equal(a.body.error.message, b.body.error.message);
  });

  test('bloquea la cuenta tras 5 intentos fallidos', async () => {
    const u = await newUser();
    const a = agent();
    for (let i = 0; i < 5; i++) {
      const r = await a.post('/api/auth/login').send({ email: u.email, password: 'Mala12345' });
      assert.equal(r.status, 401);
    }
    const locked = await a.post('/api/auth/login').send({ email: u.email, password: u.password });
    assert.equal(locked.status, 429);
    assert.equal(locked.body.error.code, 'LOCKED');
  });

  test('las rutas privadas exigen sesión', async () => {
    for (const path of ['/api/auth/me', '/api/bootstrap', '/api/transactions', '/api/categories', '/api/members', '/api/settings']) {
      const res = await agent().get(path);
      assert.equal(res.status, 401, path);
    }
  });

  test('logout destruye la sesión en el servidor (la cookie vieja deja de servir)', async () => {
    const u = await newUser();
    const oldCookie = (await agent().post('/api/auth/login').send({ email: u.email, password: u.password })).headers['set-cookie'][0].split(';')[0];
    const ok = await request(app).get('/api/auth/me').set('Cookie', oldCookie);
    assert.equal(ok.status, 200);
    const out = await request(app).post('/api/auth/logout').set('Cookie', oldCookie).set('X-Requested-With', 'FINPRO');
    assert.equal(out.status, 200);
    const after = await request(app).get('/api/auth/me').set('Cookie', oldCookie);
    assert.equal(after.status, 401);
  });

  test('protección CSRF: POST sin cabecera X-Requested-With o con otro origen es rechazado', async () => {
    const u = await newUser();
    const noHeader = await request(app).post('/api/auth/login').send({ email: u.email, password: u.password });
    assert.equal(noHeader.status, 403);
    const evil = await request(app).post('/api/auth/login').set('X-Requested-With', 'FINPRO').set('Origin', 'https://evil.example').send({ email: u.email, password: u.password });
    assert.equal(evil.status, 403);
  });

  test('cabeceras de seguridad (CSP, nosniff) y sin x-powered-by', async () => {
    const res = await request(app).get('/api/health');
    assert.match(res.headers['content-security-policy'], /default-src 'self'/);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['referrer-policy'], 'no-referrer');
    assert.equal(res.headers['x-powered-by'], undefined);
  });

  test('páginas privadas redirigen a login sin sesión', async () => {
    const res = await request(app).get('/app');
    assert.equal(res.status, 302);
    assert.match(res.headers.location, /^\/login\.html/);
  });
});

describe('Recuperación de contraseña', () => {
  test('flujo completo: solicitar, usar el enlace, iniciar con la nueva clave, no reutilizar', async () => {
    const u = await newUser();
    const before = outbox.length;
    const res = await agent().post('/api/auth/forgot-password').send({ email: u.email });
    assert.equal(res.status, 200);
    assert.equal(outbox.length, before + 1);
    const token = new URL(outbox[outbox.length - 1].link).searchParams.get('token');

    const reset = await agent().post('/api/auth/reset-password').send({ token, password: 'NuevaClave99' });
    assert.equal(reset.status, 200);

    // la sesión anterior quedó invalidada
    assert.equal((await u.a.get('/api/auth/me')).status, 401);
    // la clave vieja ya no sirve, la nueva sí
    assert.equal((await agent().post('/api/auth/login').send({ email: u.email, password: u.password })).status, 401);
    assert.equal((await agent().post('/api/auth/login').send({ email: u.email, password: 'NuevaClave99' })).status, 200);
    // el token no se puede reutilizar
    const again = await agent().post('/api/auth/reset-password').send({ token, password: 'OtraClave123' });
    assert.equal(again.status, 400);
  });

  test('no revela si el correo existe', async () => {
    const before = outbox.length;
    const res = await agent().post('/api/auth/forgot-password').send({ email: 'fantasma@test.com' });
    assert.equal(res.status, 200);
    assert.equal(outbox.length, before);
  });

  test('rechaza tokens inventados y contraseñas débiles', async () => {
    const bad = await agent().post('/api/auth/reset-password').send({ token: 'x'.repeat(43), password: 'NuevaClave99' });
    assert.equal(bad.status, 400);
    const weak = await agent().post('/api/auth/reset-password').send({ token: 'x'.repeat(43), password: '123' });
    assert.equal(weak.status, 400);
  });
});

describe('Perfil y cuenta', () => {
  test('actualiza perfil y valida correo duplicado', async () => {
    const a = await newUser();
    const b = await newUser();
    const ok = await a.a.patch('/api/auth/me').send({ name: 'Nuevo Nombre', email: a.email });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.user.name, 'Nuevo Nombre');
    const dup = await a.a.patch('/api/auth/me').send({ name: 'Nuevo Nombre', email: b.email });
    assert.equal(dup.status, 409);
  });

  test('cambiar contraseña exige la actual y cierra otras sesiones', async () => {
    const u = await newUser();
    const other = agent();
    await other.post('/api/auth/login').send({ email: u.email, password: u.password });
    const wrong = await u.a.post('/api/auth/change-password').send({ currentPassword: 'Mala12345', newPassword: 'NuevaClave99' });
    assert.equal(wrong.status, 400);
    const ok = await u.a.post('/api/auth/change-password').send({ currentPassword: u.password, newPassword: 'NuevaClave99' });
    assert.equal(ok.status, 200);
    assert.equal((await u.a.get('/api/auth/me')).status, 200); // la sesión actual se conserva
    assert.equal((await other.get('/api/auth/me')).status, 401); // la otra se cerró
  });

  test('eliminar cuenta exige contraseña y borra todos sus datos', async () => {
    const u = await newUser();
    assert.equal((await u.a.delete('/api/auth/me').send({ password: 'Mala12345' })).status, 400);
    assert.equal((await u.a.delete('/api/auth/me').send({ password: u.password })).status, 200);
    assert.equal((await agent().post('/api/auth/login').send({ email: u.email, password: u.password })).status, 401);
  });

  test('no elimina una cuenta con movimientos ni altera su historial', async () => {
    const u = await newUser();
    const category = await categoryId(u.a);
    const created = await u.a.post('/api/transactions').send({ type: 'gasto', amount: 4321, description: 'Registro que debe conservarse', note: '', date: '2026-10-05', categoryId: category });
    assert.equal(created.status, 201);

    const deletion = await u.a.delete('/api/auth/me').send({ password: u.password });
    assert.equal(deletion.status, 409);
    assert.match(deletion.body.error.message, /movimiento/);
    const persisted = await u.a.get(`/api/transactions/${created.body.transaction.id}`);
    assert.equal(persisted.status, 200);
    assert.equal(persisted.body.transaction.amount, 4321);
    assert.equal((await agent().post('/api/auth/login').send({ email: u.email, password: u.password })).status, 200);
  });
});
