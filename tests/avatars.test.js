'use strict';
process.env.NODE_ENV = 'test';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { newUser, categoryId } = require('./helpers');

async function loadAvatarModules() {
  const moduleUrl = (source) => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
  const catalog = moduleUrl(readFileSync('public/js/components/avatar-catalog.js', 'utf8'));
  const utils = moduleUrl(readFileSync('public/js/utils.js', 'utf8'));
  const portrait = moduleUrl(readFileSync('public/js/components/avatar-portrait.js', 'utf8'));
  const renderer = moduleUrl(readFileSync('public/js/components/avatar.js', 'utf8')
    .replace("'../utils.js'", JSON.stringify(utils))
    .replace("'./avatar-portrait.js'", JSON.stringify(portrait))
    .replace("'./avatar-catalog.js'", JSON.stringify(catalog)));
  return { ...await import(catalog), ...await import(renderer) };
}

const AVATAR = {
  version: 1, character: 'luna', appearance: 'feminine', skin: 'tan', hairStyle: 'curly', hairColor: '#a65324',
  eyes: 'round', eyeColor: '#3f8f82', brows: 'arched', mouth: 'smile', faceShape: 'oval', accessory: 'none', accessories: ['glasses', 'scarf', 'earrings-hoop'], clothing: 'hoodie', clothingColor: '#6b9fff',
};
const DEFAULT = {
  version: 1, character: 'luna', appearance: 'neutral', skin: 'medium', hairStyle: 'short', hairColor: '#38251f',
  eyes: 'almond', eyeColor: '#334155', brows: 'soft', mouth: 'smile', faceShape: 'soft', accessory: 'none', accessories: [], clothing: 'tee', clothingColor: '#4fd1a5',
};

describe('Avatares personalizados', () => {
  test('guarda por perfil y persiste tras pedir de nuevo el bootstrap', async () => {
    const { a, user, email, password } = await newUser();
    const custom = { ...AVATAR, style: 'custom', clothingColor: '#a78bfa' };
    const saved = await a.patch('/api/auth/me/avatar').send(custom);
    assert.equal(saved.status, 200);
    assert.deepEqual(saved.body.user.avatar, custom);
    assert.deepEqual((await a.get('/api/bootstrap')).body.user.avatar, custom);
    assert.deepEqual((await a.get('/api/auth/me')).body.user.avatar, custom);
    await a.post('/api/auth/logout');
    const anotherSession = require('./helpers').agent();
    assert.equal((await anotherSession.post('/api/auth/login').send({ email, password })).status, 200);
    assert.deepEqual((await anotherSession.get('/api/bootstrap')).body.user.avatar, custom);
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

  test('cada opción de apariencia modifica el retrato y produce un valor válido', async () => {
    const { AVATAR_OPTIONS, avatarMarkup, normalizeAvatar } = await loadAvatarModules();
    const schema = require('../server/validators/schemas').avatar;
    const render = (avatar) => String(avatarMarkup(avatar)).replace(/finpro-avatar-\d+/g, 'avatar');
    const custom = { ...DEFAULT, style: 'custom' };
    assert.match(render(DEFAULT), /<image href=/);
    assert.doesNotMatch(render(custom), /<image href=/);
    assert.match(render(custom), /data-portrait="editable"/);
    const faceGradient = render(custom).match(/<radialGradient id="avatar-face"[^>]*>(.*?)<\/radialGradient>/)?.[1];
    assert.ok(faceGradient);
    assert.doesNotMatch(faceGradient, /stop-opacity/);
    assert.equal(normalizeAvatar({ version: 1, skin: 'tan', accessory: 'glasses' }).style, 'custom');
    for (const [key, options] of Object.entries(AVATAR_OPTIONS)) {
      if (key === 'accessory') continue;
      const variants = options.map(([value]) => {
        const draft = normalizeAvatar({ ...custom, [key]: value });
        assert.equal(draft[key], value, `${key} acepta ${value}`);
        assert.ok(schema.safeParse(draft).success, `${key} permite guardar ${value}`);
        return render(draft);
      });
      assert.equal(new Set(variants).size, options.length, `cada valor de ${key} modifica el retrato`);
    }
    for (const file of ['public/js/pages/familia.js', 'public/js/pages/perfil.js', 'public/js/pages/usuarios.js', 'public/js/components/tx.js', 'public/js/pages/gastos.js']) {
      assert.match(readFileSync(file, 'utf8'), /avatarMarkup/);
    }
  });

  test('todo el catálogo de personajes usa atlas raster originales de alta resolución', () => {
    const catalog = readFileSync('public/js/components/avatar-catalog.js', 'utf8');
    const characterSource = catalog.split('export const AVATAR_CATEGORIES')[0];
    const ids = [...characterSource.matchAll(/\{ id: '([a-z0-9-]+)', name:/g)].map((match) => match[1]);
    const artworkSource = catalog.split('export const AVATAR_ARTWORKS = Object.freeze({')[1].split('});')[0];
    const mapped = [...artworkSource.matchAll(/^\s*([a-z0-9-]+): \{ src: '([^']+)', width: (\d+), height: (\d+)/gm)];
    assert.equal(ids.length, 64, 'el catálogo debe contener 64 personajes');
    assert.deepEqual(mapped.map((match) => match[1]).sort(), [...ids].sort(), 'cada personaje tiene exactamente una ilustración');
    const expectedAtlases = {
      'finpro-animal-04.png': ['leon', 'tortuga', 'ciervo', 'tiburon'],
      'finpro-fantasy-01.png': ['dragon', 'unicornio', 'hada', 'sirena'],
      'finpro-fantasy-02.png': ['fenix', 'fantasma', 'mago', 'vampiro'],
      'finpro-fantasy-03.png': ['slime', 'alien', 'polilla', 'golem'],
      'finpro-misc-01.png': ['taco', 'cactus', 'astronauta', 'pirata'],
    };
    for (const [file, characters] of Object.entries(expectedAtlases)) {
      for (const id of characters) assert.equal(mapped.find((match) => match[1] === id)?.[2], `/images/avatars/${file}`, `${id} usa el atlas correcto`);
    }
    const sources = [...new Set(mapped.map((match) => match[2]))];
    for (const source of sources) {
      const asset = readFileSync(`public${source}`);
      assert.equal(asset.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${source} es un PNG válido`);
      const entry = mapped.find((match) => match[2] === source);
      assert.ok(asset.readUInt32BE(16) >= 1100 && asset.readUInt32BE(20) >= 1100, `${source} conserva alta resolución`);
      assert.equal(asset.readUInt32BE(16), Number(entry[3]), `${source} declara su anchura real`);
      assert.equal(asset.readUInt32BE(20), Number(entry[4]), `${source} declara su altura real`);
    }
    const renderer = readFileSync('public/js/components/avatar.js', 'utf8');
    assert.match(renderer, /AVATAR_ARTWORKS\[a\.character\]/);
    assert.match(renderer, /illustratedPortraitMarkup\(artwork\)/);
    assert.match(renderer, /AVATAR_CHARACTER_ANCHORS\[a\.character\]/);
    assert.match(renderer, /accessoryTransform/);
  });

  test('el catálogo trae más de 40 personajes originales repartidos en seis categorías', () => {
    const catalog = readFileSync('public/js/components/avatar-catalog.js', 'utf8');
    const characterSource = catalog.split('export const AVATAR_CATEGORIES')[0];
    const ids = [...characterSource.matchAll(/\{ id: '([a-z0-9-]+)', name:/g)].map((match) => match[1]);
    const kinds = [...characterSource.matchAll(/kind: '([a-z0-9-]+)'/g)].map((match) => match[1]);
    assert.ok(ids.length >= 60, `Catálogo encontrado: ${ids.length}`);
    assert.equal(new Set(ids).size, ids.length, 'los identificadores del catálogo son únicos');
    assert.ok(new Set(kinds).size >= 18, 'las siluetas incluyen animales, humanos, fantasía y personajes temáticos');
    for (const category of ['popular', 'human', 'animal', 'fantasy', 'fun', 'special']) assert.match(catalog, new RegExp(`category: '${category}'`));
    const editor = readFileSync('public/js/components/avatar-editor.js', 'utf8');
    assert.match(editor, /avatar-studio-tabs/);
    assert.match(editor, /data-avatar-preset/);
    assert.match(editor, /preset\.id === draft\.character/);
    assert.match(editor, /avatar-catalog/);
    assert.match(editor, /avatar-preview/);
    const schema = readFileSync('server/validators/schemas.js', 'utf8');
    for (const id of ids) assert.match(schema, new RegExp(`'${id}'`), `el backend valida el personaje ${id}`);
  });

  test('las tarjetas conservan borrar, mover avatar y editar datos sin el lápiz', () => {
    const family = readFileSync('public/js/pages/familia.js', 'utf8');
    const cardActions = family.match(/<div class="m-actions">([\s\S]*?)<\/div>/)?.[1] || '';
    assert.match(cardActions, /data-del=/);
    assert.doesNotMatch(cardActions, /data-edit=|icon\('edit'\)/);
    assert.match(family, /class="m-ava member-avatar-trigger"[^>]*data-avatar=/);
    assert.match(family, /class="member-edit-link"[^>]*data-edit=/);
    assert.match(family, /deleteMember\(/);
    assert.match(family, /openMemberModal\(/);
  });

  test('acepta personajes del catálogo y rechaza IDs arbitrarios', async () => {
    const { a } = await newUser();
    const member = (await a.post('/api/members').send({ name: 'Nube', role: 'Niño', emoji: '🦄', color: '#a78bfa' })).body.member;
    const fantasy = { ...AVATAR, character: 'dragon', accessory: 'antenna', clothing: 'cape', hairColor: '#f07070' };
    assert.equal((await a.patch(`/api/members/${member.id}/avatar`).send(fantasy)).status, 200);
    assert.deepEqual((await a.get('/api/members')).body.members[0].avatar, fantasy);
    const invalid = await a.patch(`/api/members/${member.id}/avatar`).send({ ...fantasy, character: 'not-in-catalog' });
    assert.equal(invalid.status, 400);
  });

  test('persiste accesorios combinados, reemplaza configuración y rechaza valores inválidos', async () => {
    const { a } = await newUser();
    const member = (await a.post('/api/members').send({ name: 'Nube', role: 'Niño', emoji: '🦄', color: '#a78bfa' })).body.member;
    const styled = { ...AVATAR, character: 'luna', accessories: ['wig-braids', 'glasses', 'beard-short', 'moustache', 'necklace-star', 'earrings-hoop'] };
    const saved = await a.patch(`/api/members/${member.id}/avatar`).send(styled);
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
    assert.deepEqual(saved.body.member.avatar.accessories, styled.accessories);
    assert.deepEqual((await a.get('/api/bootstrap')).body.members.find((item) => item.id === member.id).avatar.accessories, styled.accessories);
    const invalid = await a.patch(`/api/members/${member.id}/avatar`).send({ ...styled, accessories: ['glasses', 'round-glasses'] });
    assert.equal(invalid.status, 400, 'no acepta dos accesorios que ocupan la misma zona');
    assert.equal((await a.patch(`/api/members/${member.id}/avatar`).send({ ...styled, accessories: ['beard-full', 'moustache'] })).status, 400, 'la barba completa no se combina con bigote independiente');
    assert.equal((await a.patch(`/api/members/${member.id}/avatar`).send({ ...styled, accessories: ['glasses', 'mask'] })).status, 200, 'las gafas pueden combinarse con mascarilla inferior');
    assert.equal((await a.patch(`/api/members/${member.id}/avatar`).send({ ...styled, accessories: ['glasses', 'domino-mask'] })).status, 400, 'el antifaz no ocupa el mismo espacio que las gafas');
    assert.equal((await a.patch(`/api/members/${member.id}/avatar`).send({ ...styled, accessories: ['hat', 'cat-ears'] })).status, 400, 'los accesorios de cabeza comparten zona');
    assert.equal((await a.patch(`/api/members/${member.id}/avatar`).send({ ...styled, accessories: ['mask', 'beard-short'] })).status, 400, 'la mascarilla no se mezcla con la barba');
    assert.equal((await a.patch(`/api/members/${member.id}/avatar`).send({ ...styled, accessories: ['hat', 'flower-barrette'] })).status, 400, 'el sombrero y el pasador no se colocan en la misma zona');
    assert.equal((await a.patch(`/api/members/${member.id}/avatar`).send({ ...styled, accessories: ['headphones', 'earrings-stud'] })).status, 400, 'los audífonos dejan libres las orejas');
    assert.equal((await a.patch(`/api/members/${member.id}/avatar`).send({ ...styled, accessories: ['scarf', 'necklace-star'] })).status, 400, 'bufanda y collar no se superponen');
    assert.equal((await a.patch(`/api/members/${member.id}/avatar`).send({ ...styled, accessories: ['freckles', 'freckles-gold'] })).status, 400, 'las pecas comparten zona');
    const restored = await a.patch(`/api/members/${member.id}/avatar`).send(DEFAULT);
    assert.deepEqual(restored.body.member.avatar.accessories, []);
  });

  test('el editor ofrece pocos accesorios compatibles y evita controles de catálogo innecesarios', () => {
    const catalog = readFileSync('public/js/components/avatar-catalog.js', 'utf8');
    const editor = readFileSync('public/js/components/avatar-editor.js', 'utf8');
    const accessories = [...catalog.matchAll(/^  \{ id: '([a-z0-9-]+)', name: '[^']+', category: '[^']+', slot:/gm)].map((item) => item[1]);
    assert.ok(accessories.length >= 100, `hay ${accessories.length} accesorios detallados`);
    assert.equal(new Set(accessories).size, accessories.length, 'los accesorios tienen identificadores únicos');
    assert.match(catalog, /export function isAccessoryCompatible/);
    assert.match(editor, /data-avatar-accessory/);
    assert.match(editor, /data-remove-accessory/);
    assert.match(editor, /accessoryConflicts/);
    const schema = readFileSync('server/validators/schemas.js', 'utf8');
    for (const id of accessories) assert.match(schema, new RegExp(`'${id}'`), `el backend acepta el accesorio ${id}`);
    assert.match(catalog, /AVATAR_CHARACTER_ANCHORS/);
    assert.match(catalog, /anchorKey: ACCESSORY_ANCHOR_OVERRIDES\[item\.id\] \|\| SLOT_ANCHORS\[item\.slot\]/);
    assert.match(catalog, /accessoryConflict/);
    assert.match(catalog, /selected\.slot === 'eyewear' && EYE_OCCLUSION_ACCESSORIES\.has\(accessoryId\)/);
    assert.match(catalog, /renderStage/);
    assert.match(catalog, /position: item\.position/);
    assert.match(catalog, /scale: item\.slot === 'headwear'/);
    assert.match(catalog, /Math\.min\(item\.scale \?\? 1, 0\.78\)/);
    assert.match(catalog, /rotation: item\.rotation/);
    assert.match(catalog, /layer: SLOT_RENDER_LAYERS\[item\.slot\] \?\? RENDER_LAYERS/);
    const avatar = readFileSync('public/js/components/avatar.js', 'utf8');
    assert.match(avatar, /data-anchor="\$\{item\.anchorKey\}"/);
    assert.match(avatar, /export function avatarAccessoryMarkup/);
    assert.match(avatar, /compatibleAccessories/);
    assert.match(editor, /avatarAccessoryMarkup\(item\.id\)/);
  });

  test('el editor presenta un catálogo reducido y conserva el catálogo legado para avatares guardados', () => {
    const catalog = readFileSync('public/js/components/avatar-catalog.js', 'utf8');
    const editor = readFileSync('public/js/components/avatar-editor.js', 'utf8');
    const curated = catalog.match(/export const AVATAR_ACCESSORY_CATALOG_IDS = \[([\s\S]*?)\];/)?.[1] || '';
    const visibleIds = [...curated.matchAll(/'([a-z0-9-]+)'/g)].map((match) => match[1]);
    assert.equal(visibleIds.length, 7, `se muestran ${visibleIds.length} accesorios seleccionados`);
    assert.equal(new Set(visibleIds).size, visibleIds.length);
    assert.match(catalog, /AVATAR_ACCESSORY_CATALOG = AVATAR_ACCESSORY_CATALOG_IDS/);
    assert.match(editor, /AVATAR_ACCESSORIES\.find\(\(\{ id: itemId \}\) => itemId === id\)/, 'los accesorios guardados siguen teniendo nombre al editar');
    for (const id of visibleIds) assert.match(catalog, new RegExp(`\\{ id: '${id}', name:`), `${id} existe en el catálogo completo`);
    assert.match(catalog, /AVATAR_ACCESSORIES = ACCESSORY_DATA\.map/, 'se conservan las definiciones que permiten mostrar avatares previos');
  });

  test('cada personaje del selector ofrece piezas que se dibujan y se pueden guardar', async () => {
    const { AVATAR_PICKER_PRESETS, AVATAR_ACCESSORY_CATALOG, AVATAR_OPTIONS, canUseAccessory, avatarMarkup, normalizeAvatar, accessoryConflicts } = await loadAvatarModules();
    const schema = require('../server/validators/schemas').avatar;
    const fittedHeadwear = ['cap', 'beanie', 'hat'];
    const assertCrownFit = (markup, accessory, name) => {
      const band = markup.match(new RegExp(`data-accessory="${accessory}"[^>]+transform="([^"]+)"`))?.[1];
      const clip = markup.match(/<clipPath id="finpro-avatar-\d+-crown"><path[^>]+transform="([^"]+)"/)?.[1];
      assert.ok(band && clip, `${name} monta ${accessory} sobre la línea de la cabeza`);
      assert.equal(band, clip);
    };
    assert.equal(AVATAR_PICKER_PRESETS.length, 20);
    for (const { id, avatar } of AVATAR_PICKER_PRESETS) {
      const available = AVATAR_ACCESSORY_CATALOG.filter((item) => canUseAccessory(item, avatar));
      assert.ok(available.length, `${id} ofrece accesorios`);
      for (const { id: accessory } of available) {
        const draft = normalizeAvatar({ ...avatar, accessories: [accessory] });
        assert.ok(schema.safeParse(draft).success, `${id} puede guardar ${accessory}`);
        const markup = String(avatarMarkup(draft));
        assert.match(markup, new RegExp(`data-accessory="${accessory}"`));
        if (fittedHeadwear.includes(accessory)) assertCrownFit(markup, accessory, id);
      }
    }
    for (const [hairStyle] of AVATAR_OPTIONS.hairStyle) {
      for (const accessory of fittedHeadwear) {
        const draft = { ...DEFAULT, style: 'custom', hairStyle, accessories: [accessory] };
        assertCrownFit(String(avatarMarkup(draft)), accessory, hairStyle);
      }
    }
    assert.deepEqual(accessoryConflicts('beard-full', ['beard-short', 'moustache', 'scarf']).map(({ id }) => id), ['beard-short', 'moustache']);
  });
});
