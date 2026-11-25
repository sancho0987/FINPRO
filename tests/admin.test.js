'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { agent, newUser, newAdmin, categoryId, outbox } = require('./helpers');
const { getDb } = require('../server/db');

describe('Panel de administración', () => {
  test('un usuario normal recibe 403 en todas las rutas de admin', async () => {
    const u = await newUser();
    for (const [m, p] of [['get', '/api/admin/users'], ['get', '/api/admin/stats'], ['patch', '/api/admin/users/1'], ['delete', '/api/admin/users/1'], ['post', '/api/admin/users/1/send-reset']]) {
      const r = await u.a[m](p).send({ role: 'admin' });
      assert.equal(r.status, 403, `${m} ${p}`);
    }
  });

  test('sin sesión recibe 401', async () => {
    assert.equal((await agent().get('/api/admin/users')).status, 401);
  });

  test('lista usuarios con búsqueda y no expone hashes', async () => {
    const adm = await newAdmin();
    const target = await newUser({ name: 'Zulema Buscada' });
    const r = await adm.a.get('/api/admin/users?q=zulema');
    assert.equal(r.status, 200);
    assert.equal(r.body.total, 1);
    assert.equal(r.body.items[0].email, target.email);
    assert.ok(!JSON.stringify(r.body).includes('password'));
    assert.equal((await adm.a.get('/api/admin/stats')).body.stats.users >= 2, true);
  });

  test('el admin no ve los movimientos de otros usuarios por la API de datos', async () => {
    const adm = await newAdmin();
    const u = await newUser();
    const cat = await categoryId(u.a);
    await u.a.post('/api/transactions').send({ type: 'gasto', amount: 10, description: 'privado', date: '2026-10-01', categoryId: cat });
    assert.equal((await adm.a.get('/api/transactions')).body.total, 0);
  });

  test('cambiar rol, desactivar (cierra sesiones y bloquea login) y reactivar', async () => {
    const adm = await newAdmin();
    const u = await newUser();
    const promoted = await adm.a.patch(`/api/admin/users/${u.user.id}`).send({ role: 'admin' });
    assert.equal(promoted.body.user.role, 'admin');
    await adm.a.patch(`/api/admin/users/${u.user.id}`).send({ role: 'user' });

    const off = await adm.a.patch(`/api/admin/users/${u.user.id}`).send({ isActive: false });
    assert.equal(off.body.user.isActive, false);
    assert.equal((await u.a.get('/api/auth/me')).status, 401);
    assert.equal((await agent().post('/api/auth/login').send({ email: u.email, password: u.password })).status, 403);

    await adm.a.patch(`/api/admin/users/${u.user.id}`).send({ isActive: true });
    assert.equal((await agent().post('/api/auth/login').send({ email: u.email, password: u.password })).status, 200);
  });

  test('protecciones: no auto-degradarse, no dejar el sistema sin admin, no eliminarse', async () => {
    const adm = await newAdmin();
    assert.equal((await adm.a.patch(`/api/admin/users/${adm.user.id}`).send({ role: 'user' })).status, 409);
    assert.equal((await adm.a.patch(`/api/admin/users/${adm.user.id}`).send({ isActive: false })).status, 409);
    assert.equal((await adm.a.delete(`/api/admin/users/${adm.user.id}`)).status, 409);
    assert.equal((await adm.a.delete('/api/admin/users/99999')).status, 404);
    assert.equal((await adm.a.patch(`/api/admin/users/${adm.user.id}`).send({})).status, 400);
  });

  test('eliminar una cuenta con movimientos se rechaza y conserva sus datos', async () => {
    const adm = await newAdmin();
    const u = await newUser();
    await u.a.post('/api/data/demo').send({});
    const db = getDb();
    assert.ok(db.prepare('SELECT COUNT(*) c FROM transactions WHERE user_id = ?').get(u.user.id).c > 0);
    const removal = await adm.a.delete(`/api/admin/users/${u.user.id}`);
    assert.equal(removal.status, 409);
    assert.match(removal.body.error.message, /movimiento/);
    assert.ok(db.prepare('SELECT COUNT(*) c FROM transactions WHERE user_id = ?').get(u.user.id).c > 0);
    assert.equal((await u.a.get('/api/bootstrap')).status, 200);
  });

  test('enviar enlace de recuperación a un usuario', async () => {
    const adm = await newAdmin();
    const u = await newUser();
    const before = outbox.length;
    const r = await adm.a.post(`/api/admin/users/${u.user.id}/send-reset`).send({});
    assert.equal(r.status, 200);
    assert.equal(outbox.length, before + 1);
    assert.equal(outbox[outbox.length - 1].to, u.email);
  });
});
