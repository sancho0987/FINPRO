'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { newUser, categoryId, PASSWORD } = require('./helpers');

const tx = (over = {}) => ({ type: 'gasto', amount: 12000, description: 'Café', date: '2026-10-05', note: '', ...over });

async function setup() {
  const u = await newUser();
  const cat = await categoryId(u.a, 'Alimentación');
  const m = (await u.a.post('/api/members').send({ name: 'Mamá', role: 'Adulto', emoji: '👩', color: '#f472b6' })).body.member;
  return { ...u, cat, member: m };
}

describe('Movimientos (CRUD)', () => {
  test('crear, consultar, actualizar y eliminar', async () => {
    const { a, cat, member } = await setup();
    const created = await a.post('/api/transactions').send(tx({ categoryId: cat, memberId: member.id, amount: 45000.5, description: 'Mercado' }));
    assert.equal(created.status, 201);
    const t = created.body.transaction;
    assert.equal(t.amount, 45000.5);
    assert.equal(t.category.name, 'Alimentación');
    assert.equal(t.member.name, 'Mamá');

    assert.equal((await a.get(`/api/transactions/${t.id}`)).body.transaction.description, 'Mercado');

    const upd = await a.put(`/api/transactions/${t.id}`).send(tx({ categoryId: cat, memberId: null, amount: 50000, description: 'Mercado grande', type: 'gasto' }));
    assert.equal(upd.status, 200);
    assert.equal(upd.body.transaction.amount, 50000);
    assert.equal(upd.body.transaction.member, null);

    assert.equal((await a.delete(`/api/transactions/${t.id}`)).status, 200);
    assert.equal((await a.get(`/api/transactions/${t.id}`)).status, 404);
    assert.equal((await a.delete(`/api/transactions/${t.id}`)).status, 404);
  });

  test('validación: monto, fecha, tipo, descripción y referencias', async () => {
    const { a, cat } = await setup();
    const bad = async (over, field) => {
      const r = await a.post('/api/transactions').send(tx({ categoryId: cat, ...over }));
      assert.equal(r.status, 400, JSON.stringify(over));
      if (field) assert.ok(r.body.error.fields[field], `campo ${field}: ${JSON.stringify(r.body)}`);
    };
    await bad({ amount: -5 }, 'amount');
    await bad({ amount: 0 }, 'amount');
    await bad({ amount: '1000' }, 'amount');
    await bad({ amount: 10.123 }, 'amount');
    await bad({ date: '2026-02-30' }, 'date');
    await bad({ date: 'ayer' }, 'date');
    await bad({ type: 'regalo' }, 'type');
    await bad({ description: '   ' }, 'description');
    await bad({ description: 'x'.repeat(121) }, 'description');
    await bad({ categoryId: 999999 }, 'categoryId');
    await bad({ memberId: 999999 }, 'memberId');
  });

  test('guarda el texto tal cual (el escape se hace al mostrar) sin romper', async () => {
    const { a, cat } = await setup();
    const r = await a.post('/api/transactions').send(tx({ categoryId: cat, description: '<img src=x onerror=alert(1)>' }));
    assert.equal(r.status, 201);
    assert.equal(r.body.transaction.description, '<img src=x onerror=alert(1)>');
  });
});

describe('Filtros, orden y paginación', () => {
  test('filtra por tipo, categoría, miembro, texto y fechas; pagina y calcula totales', async () => {
    const { a, cat, member } = await setup();
    const transporte = await categoryId(a, 'Transporte');
    const make = (o) => a.post('/api/transactions').send(tx(o));
    await make({ categoryId: cat, memberId: member.id, description: 'Mercado', amount: 1000, date: '2026-10-01' });
    await make({ categoryId: cat, description: 'Pan', amount: 2000, date: '2026-10-02' });
    await make({ categoryId: transporte, description: 'Bus', amount: 3000, date: '2026-10-03' });
    await make({ categoryId: transporte, description: 'Salario', type: 'ingreso', amount: 9000, date: '2026-11-01' });

    const q = async (qs) => (await a.get('/api/transactions?' + qs)).body;
    assert.equal((await q('')).total, 4);
    assert.equal((await q('type=ingreso')).total, 1);
    assert.equal((await q(`categoryId=${transporte}`)).total, 2);
    assert.equal((await q(`memberId=${member.id}`)).total, 1);
    assert.equal((await q('memberId=none')).total, 3);
    assert.equal((await q('q=merc')).items[0].description, 'Mercado');
    assert.equal((await q('q=%25')).total, 0); // el % se trata como texto, no como comodín
    const oct = await q('from=2026-10-01&to=2026-10-31');
    assert.equal(oct.total, 3);
    assert.equal(oct.totals.expense, 6000);
    assert.equal(oct.totals.income, 0);
    const paged = await q('limit=2&page=2&sort=amount&dir=asc&from=2026-10-01&to=2026-10-31');
    assert.equal(paged.items.length, 1);
    assert.equal(paged.pages, 2);
    assert.equal(paged.items[0].amount, 3000);
    assert.equal((await a.get('/api/transactions?limit=1000')).status, 400);
  });
});

describe('Aislamiento entre usuarios', () => {
  test('un usuario no puede ver, editar ni borrar datos de otro', async () => {
    const A = await setup();
    const B = await setup();
    const t = (await A.a.post('/api/transactions').send(tx({ categoryId: A.cat, memberId: A.member.id }))).body.transaction;

    assert.equal((await B.a.get(`/api/transactions/${t.id}`)).status, 404);
    assert.equal((await B.a.put(`/api/transactions/${t.id}`).send(tx({ categoryId: B.cat }))).status, 404);
    assert.equal((await B.a.delete(`/api/transactions/${t.id}`)).status, 404);
    assert.equal((await B.a.get('/api/transactions')).body.total, 0);
    assert.equal((await A.a.get(`/api/transactions/${t.id}`)).status, 200);

    // no se pueden usar categorías ni miembros ajenos
    const stealCat = await B.a.post('/api/transactions').send(tx({ categoryId: A.cat }));
    assert.equal(stealCat.status, 400);
    const stealMember = await B.a.post('/api/transactions').send(tx({ categoryId: B.cat, memberId: A.member.id }));
    assert.equal(stealMember.status, 400);
    assert.equal((await B.a.put(`/api/members/${A.member.id}`).send({ name: 'Hack', role: 'Adulto', emoji: '👤', color: '#000000' })).status, 404);
    assert.equal((await B.a.delete(`/api/members/${A.member.id}`)).status, 404);
    assert.equal((await B.a.put(`/api/categories/${A.cat}`).send({ name: 'Hack', emoji: '👤', color: '#000000', budget: 1 })).status, 404);
    assert.equal((await B.a.delete(`/api/categories/${A.cat}`)).status, 404);
    assert.equal((await B.a.put('/api/categories/budgets').send({ budgets: [{ id: A.cat, budget: 1 }] })).status, 400);

    // los reportes de B no incluyen nada de A
    const rep = (await B.a.get('/api/reports/summary?year=2026&month=9')).body;
    assert.equal(rep.txCount, 0);
    assert.equal(rep.spent, 0);
  });
});

describe('Categorías y miembros', () => {
  test('categorías: crear, editar, nombre único, borrar con reasignación', async () => {
    const { a, cat } = await setup();
    const created = await a.post('/api/categories').send({ name: 'Mascotas', emoji: '🐶', color: '#aabbcc', budget: 90000 });
    assert.equal(created.status, 201);
    const mid = created.body.category.id;
    assert.equal((await a.post('/api/categories').send({ name: 'mascotas', emoji: '🐶', color: '#aabbcc', budget: 0 })).status, 409);
    assert.equal((await a.post('/api/categories').send({ name: 'X', emoji: '🐶', color: 'rojo', budget: 0 })).status, 400);
    const upd = await a.put(`/api/categories/${mid}`).send({ name: 'Mascotas y más', emoji: '🐱', color: '#112233', budget: 100000 });
    assert.equal(upd.body.category.budget, 100000);

    await a.post('/api/transactions').send(tx({ categoryId: mid }));
    const blocked = await a.delete(`/api/categories/${mid}`);
    assert.equal(blocked.status, 409);
    const del = await a.delete(`/api/categories/${mid}?reassignTo=${cat}`);
    assert.equal(del.status, 200);
    assert.equal(del.body.moved, 1);
    assert.equal((await a.get('/api/transactions')).body.items[0].categoryId, cat);
  });

  test('presupuestos en lote', async () => {
    const { a, cat } = await setup();
    const r = await a.put('/api/categories/budgets').send({ budgets: [{ id: cat, budget: 123456 }] });
    assert.equal(r.status, 200);
    assert.equal(r.body.categories.find((c) => c.id === cat).budget, 123456);
    assert.equal((await a.put('/api/categories/budgets').send({ budgets: [{ id: cat, budget: -1 }] })).status, 400);
  });

  test('miembros: al eliminar uno, sus movimientos se conservan sin miembro', async () => {
    const { a, cat, member } = await setup();
    const t = (await a.post('/api/transactions').send(tx({ categoryId: cat, memberId: member.id }))).body.transaction;
    const del = await a.delete(`/api/members/${member.id}`);
    assert.equal(del.body.keptTransactions, 1);
    const after = (await a.get(`/api/transactions/${t.id}`)).body.transaction;
    assert.equal(after.member, null);
    const bad = await a.post('/api/members').send({ name: 'X', role: 'Jefe', emoji: '👤', color: '#000000' });
    assert.equal(bad.status, 400);
  });
});

describe('Configuración y reportes', () => {
  test('actualiza y valida la configuración', async () => {
    const { a } = await setup();
    const ok = await a.put('/api/settings').send({ householdName: 'Los Gómez', currency: 'USD', cutoffDay: 15, alertPct: 90, antLimit: 20, monthlyBudget: 3500000 });
    assert.equal(ok.status, 200);
    assert.equal((await a.get('/api/settings')).body.settings.currency, 'USD');
    assert.equal((await a.get('/api/settings')).body.settings.monthlyBudget, 3500000);
    for (const bad of [{ cutoffDay: 31 }, { alertPct: 10 }, { currency: 'XYZ' }, { antLimit: -1 }, { monthlyBudget: -1 }, { householdName: '' }]) {
      const r = await a.put('/api/settings').send({ householdName: 'X', currency: 'COP', cutoffDay: 1, alertPct: 80, antLimit: 0, monthlyBudget: 0, ...bad });
      assert.equal(r.status, 400, JSON.stringify(bad));
    }
  });

  test('resumen: totales, presupuesto por categoría, hormiga, miembros y serie diaria', async () => {
    const { a, cat, member } = await setup();
    const hormiga = await categoryId(a, 'Gastos Hormiga');
    const ingresos = await categoryId(a, 'Ingresos');
    const make = (o) => a.post('/api/transactions').send(tx(o));
    await make({ categoryId: cat, memberId: member.id, amount: 100000, date: '2026-10-10' });
    await make({ categoryId: hormiga, amount: 8000, date: '2026-10-12' });
    await make({ categoryId: ingresos, type: 'ingreso', amount: 2000000, date: '2026-10-01' });
    await make({ categoryId: cat, amount: 5000, date: '2026-09-30' }); // fuera del período

    const s = (await a.get('/api/reports/summary?year=2026&month=9&today=2026-10-14')).body;
    assert.equal(s.period.from, '2026-10-01');
    assert.equal(s.period.to, '2026-10-31');
    assert.equal(s.spent, 108000);
    assert.equal(s.income, 2000000);
    assert.equal(s.balance, 1892000);
    assert.equal(s.txCount, 3);
    assert.equal(s.budgetTotal, 2430000);
    assert.equal(s.antTotal, 8000);
    assert.equal(s.byCategory.find((c) => c.id === cat).spent, 100000);
    assert.equal(s.byMember.find((m) => m.id === member.id).spent, 100000);
    assert.equal(s.unassigned.spent, 8000);
    assert.equal(s.daily.length, 14);
    assert.equal(s.daily[13].date, '2026-10-14');
    assert.equal(s.daily.find((d) => d.date === '2026-10-10').amount, 100000);

    const m = (await a.get('/api/reports/monthly?year=2026&month=9&months=3')).body.months;
    assert.deepEqual(m.map((x) => x.spent), [0, 5000, 108000]);
  });

  test('día de corte desplaza el período', async () => {
    const { a, cat } = await setup();
    await a.put('/api/settings').send({ householdName: 'X', currency: 'COP', cutoffDay: 15, alertPct: 80, antLimit: 0 });
    await a.post('/api/transactions').send(tx({ categoryId: cat, amount: 1000, date: '2026-10-20' }));
    await a.post('/api/transactions').send(tx({ categoryId: cat, amount: 2000, date: '2026-11-10' }));
    await a.post('/api/transactions').send(tx({ categoryId: cat, amount: 4000, date: '2026-11-15' }));
    const s = (await a.get('/api/reports/summary?year=2026&month=9')).body;
    assert.equal(s.period.from, '2026-10-15');
    assert.equal(s.period.to, '2026-11-14');
    assert.equal(s.spent, 3000);
  });

  test('el presupuesto mensual global sustituye el total de categorías para alertas y disponible', async () => {
    const { a, cat } = await setup();
    await a.put('/api/settings').send({ householdName: 'X', currency: 'COP', cutoffDay: 1, alertPct: 80, antLimit: 0, monthlyBudget: 100000 });
    await a.post('/api/transactions').send(tx({ categoryId: cat, amount: 120000, date: '2026-10-10' }));
    const s = (await a.get('/api/reports/summary?year=2026&month=9')).body;
    assert.equal(s.monthlyBudget, 100000);
    assert.equal(s.categoryBudgetTotal, 2430000);
    assert.equal(s.budgetTotal, 100000);
    assert.equal(s.available, -20000);
    assert.equal(s.pct, 120);
  });

  test('parámetros de período inválidos → 400', async () => {
    const { a } = await setup();
    assert.equal((await a.get('/api/reports/summary?year=2026&month=13')).status, 400);
    assert.equal((await a.get('/api/reports/summary')).status, 400);
  });
});

describe('Exportación, datos de ejemplo y borrado', () => {
  test('CSV con BOM y neutralización de fórmulas', async () => {
    const { a, cat } = await setup();
    await a.post('/api/transactions').send(tx({ categoryId: cat, description: '=HYPERLINK("http://x")', note: 'a,b' }));
    const r = await a.get('/api/transactions/export.csv');
    assert.equal(r.status, 200);
    assert.match(r.headers['content-type'], /text\/csv/);
    assert.ok(r.text.startsWith('﻿Fecha,Tipo'));
    assert.ok(r.text.includes(`"'=HYPERLINK(""http://x"")"`));
    assert.ok(r.text.includes('"a,b"'));
  });

  test('datos de ejemplo solo en cuentas vacías', async () => {
    const u = await newUser();
    const r = await u.a.post('/api/data/demo').send({ today: '2026-10-25' });
    assert.equal(r.status, 201);
    const list = (await u.a.get('/api/transactions?limit=100')).body;
    assert.equal(list.total, 14);
    assert.equal((await u.a.post('/api/data/demo').send({})).status, 409);
  });

  test('borrar todo exige contraseña y restablece la cuenta', async () => {
    const u = await newUser();
    await u.a.post('/api/data/demo').send({});
    assert.equal((await u.a.post('/api/data/wipe').send({ password: 'Mala12345' })).status, 400);
    assert.equal((await u.a.post('/api/data/wipe').send({ password: u.password })).status, 200);
    assert.equal((await u.a.get('/api/transactions')).body.total, 0);
    assert.equal((await u.a.get('/api/members')).body.members.length, 0);
    assert.ok((await u.a.get('/api/categories')).body.categories.length >= 10);
  });

  test('exportación JSON', async () => {
    const u = await newUser();
    await u.a.post('/api/data/demo').send({});
    const r = await u.a.get('/api/data/export.json');
    assert.equal(r.status, 200);
    assert.equal(r.body.transactions.length, 14);
    assert.equal(r.body.user.email, u.email);
  });
});
