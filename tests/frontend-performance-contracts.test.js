'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');

const source = (file) => readFileSync(file, 'utf8');

test('el cliente HTTP conserva AbortError y transmite AbortSignal a fetch', () => {
  const api = source('public/js/api.js');
  assert.match(api, /\{ silent401 = false, signal \}/);
  assert.match(api, /\{ signal \}/);
  assert.match(api, /error\?\.name === 'AbortError'/);
});

test('el enrutador cancela la carga anterior y anuncia el estado de carga', () => {
  const app = source('public/js/app.js');
  assert.match(app, /renderController\?\.abort\(\)/);
  assert.match(app, /new AbortController\(\)/);
  assert.match(app, /view\.setAttribute\('aria-busy', 'true'\)/);
  assert.match(app, /signal: controller\.signal/);
  assert.match(source('public/js/ui.js'), /btn\.setAttribute\('aria-busy', 'true'\)/);
});

test('las páginas de datos reciben la señal de cancelación y el flujo de categoría conserva CATEGORY_IN_USE', () => {
  for (const file of ['public/js/pages/dashboard.js', 'public/js/pages/gastos.js', 'public/js/pages/familia.js', 'public/js/pages/reportes.js', 'public/js/pages/usuarios.js']) {
    assert.match(source(file), /signal/);
  }
  assert.match(source('server/supabase/api.js'), /new AppError\(409, 'CATEGORY_IN_USE'/);
  assert.match(source('public/js/forms.js'), /e\.code !== 'CATEGORY_IN_USE'/);
  for (const file of ['public/js/pages/gastos.js', 'public/js/pages/usuarios.js', 'public/js/pages/reportes.js']) {
    assert.match(source(file), /AbortError/);
  }
});
