'use strict';
process.env.NODE_ENV = 'test';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { newUser, categoryId } = require('./helpers');

const AVATAR = {
  version: 1, appearance: 'feminine', skin: 'tan', hairStyle: 'curly', hairColor: '#a65324',
  eyes: 'round', brows: 'arched', mouth: 'smile', accessory: 'glasses', clothing: 'hoodie', clothingColor: '#6b9fff',
};
const DEFAULT = {
  version: 1, appearance: 'neutral', skin: 'medium', hairStyle: 'short', hairColor: '#38251f',
  eyes: 'almond', brows: 'soft', mouth: 'smile', accessory: 'none', clothing: 'tee', clothingColor: '#4fd1a5',
};

describe('Avatares personalizados', () => {
  test('guarda por perfil y persiste tras pedir de nuevo el bootstrap', async () => {
    const { a, user, email, password } = await newUser();
    const saved = await a.patch('/api/auth/me/avatar').send(AVATAR);
    assert.equal(saved.status, 200);
    assert.deepEqual(saved.body.user.avatar, AVATAR);
    assert.deepEqual((await a.get('/api/bootstrap')).body.user.avatar, AVATAR);
    assert.deepEqual((await a.get('/api/auth/me')).body.user.avatar, AVATAR);
    await a.post('/api/auth/logout');
    const anotherSession = require('./helpers').agent();
    assert.equal((await anotherSession.post('/api/auth/login').send({ email, password })).status, 200);
    assert.deepEqual((await anotherSession.get('/api/bootstrap')).body.user.avatar, AVATAR);
    assert.notDeepEqual(saved.body.user.avatar, (await newUser()).user.avatar);
    assert.ok(user.id);
  });

  test('mantiene configuraciones separadas por integrante y las devuelve en movimientos y familia', async () => {
    const { a } = await newUser();
    const { a: other } = await newUser();
    const member = (await a.post('/api/members').send({ name: 'Mamá', role: 'Adulto', emoji: '👩', color: '#f472b6' })).body.member;
    const second = (await a.post('/api/members').send({ name: 'Papá', role: 'Adulto', emoji: '👨', color: '#6b9fff' })).body.member;
    assert.deepEqual((await a.patch(`/api/members/${member.id}/avatar`).send(AVATAR)).body.member.avatar, AVATAR);
    const { members } = (await a.get('/api/bootstrap')).body;
    assert.deepEqual(members.find((m) => m.id === member.id).avatar, AVATAR);
    assert.deepEqual(members.find((m) => m.id === second.id).avatar, {});
    assert.equal((await other.patch(`/api/members/${member.id}/avatar`).send(AVATAR)).status, 404);

    const category = await categoryId(a);
    const tx = await a.post('/api/transactions').send({ type: 'gasto', amount: 1000, description: 'Café', note: '', date: '2026-11-01', categoryId: category, memberId: member.id });
    assert.equal(tx.status, 201, JSON.stringify(tx.body));
    assert.deepEqual(tx.body.transaction.member.avatar, AVATAR);
    const summary = await a.get('/api/reports/summary?year=2026&month=10&today=2026-11-24');
    assert.deepEqual(summary.body.byMember.find((m) => m.id === member.id).avatar, AVATAR);
  });

  test('rechaza opciones fuera de catálogo y restaura el avatar predeterminado', async () => {
    const { a } = await newUser();
    const member = (await a.post('/api/members').send({ name: 'Leo', role: 'Niño', emoji: '🧒', color: '#4fd1a5' })).body.member;
    const invalid = await a.patch(`/api/members/${member.id}/avatar`).send({ ...AVATAR, accessory: '<script>' });
    assert.equal(invalid.status, 400);
    assert.deepEqual((await a.get('/api/members')).body.members[0].avatar, {});
    const restored = await a.patch(`/api/members/${member.id}/avatar`).send(DEFAULT);
    assert.equal(restored.status, 200);
    assert.deepEqual(restored.body.member.avatar, DEFAULT);
  });

  test('Supabase usa columnas aditivas y restringe actualizaciones por perfil u hogar', () => {
    const migration = readFileSync('supabase/migrations/202611260001_family_avatars.sql', 'utf8');
    const api = readFileSync('server/supabase/api.js', 'utf8');
    assert.match(migration, /add column if not exists avatar jsonb not null default '\{\}'::jsonb/i);
    assert.ok(api.includes("profiles').update({ avatar: req.valid.body }).eq('id', req.user.id)"));
    assert.ok(api.includes("family_members').update({ avatar: req.valid.body }).eq('household_id', req.householdId).eq('id', req.params.id)"));
    assert.doesNotMatch(migration, /drop\s+|delete\s+from|truncate\s+/i);
  });

  test('editor visual y secciones principales usan la vista SVG compartida', () => {
    const editor = readFileSync('public/js/components/avatar-editor.js', 'utf8');
    const avatarComponent = readFileSync('public/js/components/avatar.js', 'utf8');
    assert.match(editor, /Vista previa/);
    assert.match(editor, /Restaurar predeterminado/);
    assert.match(editor, /data-avatar-choice/);
    assert.match(editor, /button\.dataset\.avatarChoice === option\.dataset\.avatarChoice/);
    assert.match(avatarComponent, /<g fill="\$\{a\.hairColor\}">\$\{HAIR\[a\.hairStyle\]\}<\/g>/);
    assert.match(avatarComponent, /a\.appearance === 'masculine'[\s\S]*a\.appearance === 'feminine'/);
    for (const file of ['public/js/pages/familia.js', 'public/js/pages/perfil.js', 'public/js/pages/usuarios.js', 'public/js/components/tx.js', 'public/js/pages/gastos.js']) {
      assert.match(readFileSync(file, 'utf8'), /avatarMarkup/);
    }
  });
});
