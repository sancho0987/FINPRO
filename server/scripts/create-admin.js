'use strict';
// Uso:  npm run create-admin
//       npm run create-admin -- --email admin@tu-dominio.com --name "Administrador"
// La contraseña se pide por consola (oculta) o se toma de la variable ADMIN_PASSWORD.
const readline = require('readline');
const { getDb, closeDb } = require('../db');
const users = require('../models/users');
const auth = require('../services/authService');
const { register: registerSchema } = require('../validators/schemas').auth;

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), [])
);

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => {
        if (s.includes(question)) process.stdout.write(question);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer);
    });
  });
}

(async () => {
  getDb();
  const email = (args.email || process.env.ADMIN_EMAIL || (await ask('Correo del administrador: '))).trim().toLowerCase();
  const existing = users.findByEmail(email);

  if (existing) {
    if (existing.role === 'admin') console.log(`✔ ${email} ya es administrador.`);
    else {
      users.update(existing.id, { role: 'admin', isActive: true });
      console.log(`✔ La cuenta existente ${email} ahora es administrador.`);
    }
    return;
  }

  const name = (args.name || process.env.ADMIN_NAME || (await ask('Nombre: '))).trim();
  const password = process.env.ADMIN_PASSWORD || (await ask('Contraseña (mín. 8, letras y números): ', { hidden: true }));
  const parsed = registerSchema.safeParse({ name, email, password });
  if (!parsed.success) {
    parsed.error.issues.forEach((i) => console.error('✘ ' + i.message));
    process.exitCode = 1;
    return;
  }
  const { user } = await auth.register(parsed.data, { userAgent: 'cli' }, 'admin');
  console.log(`✔ Administrador creado: ${user.email}`);
})()
  .catch((e) => {
    console.error('✘ Error:', e.message);
    process.exitCode = 1;
  })
  .finally(closeDb);
