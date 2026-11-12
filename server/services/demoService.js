'use strict';
const { getDb } = require('../db');
const members = require('../models/members');
const categories = require('../models/categories');
const transactions = require('../models/transactions');
const { addDays } = require('../utils/period');
const { conflict } = require('../utils/errors');

// Datos de ejemplo (equivalentes a los que traía el prototipo original en localStorage)
function seed(userId, today) {
  if (transactions.count(userId) > 0) throw conflict('Ya tienes movimientos registrados; los datos de ejemplo solo se cargan en cuentas vacías.');
  const db = getDb();
  db.transaction(() => {
    let ms = members.list(userId);
    if (!ms.length) {
      members.create(userId, { name: 'Papá', role: 'Titular', emoji: '👨', color: '#4fd1a5' });
      members.create(userId, { name: 'Mamá', role: 'Adulto', emoji: '👩', color: '#f472b6' });
      members.create(userId, { name: 'Hijo', role: 'Joven', emoji: '👦', color: '#f0b84a' });
      ms = members.list(userId);
    }
    const cat = (name) => (categories.findByName(userId, name) || categories.list(userId)[0]).id;
    const [papa, mama, hijo] = [ms[0]?.id ?? null, ms[1]?.id ?? ms[0]?.id ?? null, ms[2]?.id ?? ms[0]?.id ?? null];
    const rows = [
      ['gasto', 12000, 'Café en la tarde', 'Gastos Hormiga', papa, 0],
      ['gasto', 45000, 'Mercado semanal', 'Alimentación', mama, 1],
      ['gasto', 8500, 'Tinto y pandebono', 'Gastos Hormiga', papa, 2],
      ['gasto', 120000, 'Servicios públicos', 'Servicios', mama, 3],
      ['gasto', 35000, 'Bus mensual', 'Transporte', hijo, 4],
      ['gasto', 15000, 'Snacks tienda', 'Gastos Hormiga', hijo, 5],
      ['gasto', 80000, 'Netflix + Spotify', 'Entretenimiento', papa, 6],
      ['gasto', 200000, 'Arriendo parqueadero', 'Vivienda', mama, 7],
      ['gasto', 9000, 'Agua botellón', 'Gastos Hormiga', papa, 8],
      ['gasto', 60000, 'Farmacia vitaminas', 'Salud', mama, 9],
      ['gasto', 25000, 'Cuadernos colegio', 'Educación', hijo, 10],
      ['gasto', 7000, 'Merienda escuela', 'Gastos Hormiga', hijo, 11],
      ['ingreso', 2500000, 'Salario Papá', 'Ingresos', papa, 12],
      ['ingreso', 1800000, 'Salario Mamá', 'Ingresos', mama, 12],
    ];
    for (const [type, amount, description, catName, memberId, ago] of rows) {
      transactions.create(userId, { type, amount, description, note: '', date: addDays(today, -ago), categoryId: cat(catName), memberId });
    }
  })();
}

module.exports = { seed };
