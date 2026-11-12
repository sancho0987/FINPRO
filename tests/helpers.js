'use strict';
// Entorno de pruebas: base de datos en memoria, bcrypt rápido y sin límites de tasa.
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
process.env.BCRYPT_ROUNDS = '4';

const request = require('supertest');
const { createApp } = require('../server/app');
const users = require('../server/models/users');
const mail = require('../server/services/mailService');

const app = createApp();
let counter = 0;

const agent = () => request.agent(app).set('X-Requested-With', 'FINPRO');
const PASSWORD = 'Clave1234';

async function newUser(overrides = {}) {
  counter += 1;
  const a = agent();
  const body = { name: `Usuario ${counter}`, email: `user${counter}@test.com`, password: PASSWORD, ...overrides };
  const res = await a.post('/api/auth/register').send(body);
  if (res.status !== 201) throw new Error('No se pudo registrar: ' + JSON.stringify(res.body));
  return { a, user: res.body.user, email: body.email, password: body.password };
}

async function newAdmin() {
  const u = await newUser();
  users.update(u.user.id, { role: 'admin' });
  return u;
}

async function categoryId(a, name = 'Alimentación') {
  const res = await a.get('/api/categories');
  return res.body.categories.find((c) => c.name === name).id;
}

module.exports = { app, agent, request, newUser, newAdmin, categoryId, PASSWORD, outbox: mail.outbox, users };
