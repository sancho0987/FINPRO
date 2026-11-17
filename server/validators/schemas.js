'use strict';
const { z } = require('zod');
const c = require('./common');

const CURRENCIES = ['COP', 'USD', 'EUR', 'MXN', 'ARS'];
const ROLES = ['Titular', 'Adulto', 'Joven', 'Niño', 'Otro'];

const auth = {
  register: z.object({
    name: c.text('El nombre', 80, { min: 2 }),
    email: c.email,
    password: c.password,
  }),
  login: z.object({
    email: c.email,
    password: z.string({ message: 'La contraseña es obligatoria.' }).min(1, 'La contraseña es obligatoria.').max(200),
  }),
  forgot: z.object({ email: c.email }),
  reset: z.object({
    token: z.string({ message: 'Token inválido.' }).min(20).max(200),
    password: c.password,
  }),
  profile: z.object({ name: c.text('El nombre', 80, { min: 2 }), email: c.email }),
  changePassword: z.object({
    currentPassword: z.string({ message: 'Ingresa tu contraseña actual.' }).min(1, 'Ingresa tu contraseña actual.').max(200),
    newPassword: c.password,
  }),
  confirmPassword: z.object({
    password: z.string({ message: 'Ingresa tu contraseña.' }).min(1, 'Ingresa tu contraseña.').max(200),
  }),
};

const settings = z.object({
  householdName: c.text('El nombre del hogar', 60),
  currency: z.enum(CURRENCIES, { message: 'Moneda no soportada.' }),
  cutoffDay: z.number({ message: 'El día de corte debe ser un número.' }).int('El día de corte debe ser entero.').min(1, 'El día de corte va de 1 a 28.').max(28, 'El día de corte va de 1 a 28.'),
  alertPct: z.number({ message: 'El porcentaje de alerta debe ser un número.' }).int('Debe ser un número entero.').min(50, 'La alerta va de 50% a 100%.').max(100, 'La alerta va de 50% a 100%.'),
  antLimit: c.money('El límite de gasto hormiga', { allowZero: true }),
  // Opcional por compatibilidad con clientes ya instalados; la interfaz actual siempre lo envía.
  monthlyBudget: c.money('El presupuesto mensual', { allowZero: true }).optional(),
});

const category = z.object({
  name: c.text('El nombre', 40),
  emoji: c.emoji,
  color: c.color,
  budget: c.money('El presupuesto', { allowZero: true }),
  isAnt: z.boolean().optional().default(false),
});
const categoryBudgets = z.object({
  budgets: z
    .array(z.object({ id: c.id, budget: c.money('El presupuesto', { allowZero: true }) }))
    .min(1)
    .max(200),
});

const member = z.object({
  name: c.text('El nombre', 40),
  role: z.enum(ROLES, { message: 'Rol inválido.' }),
  emoji: c.emoji,
  color: c.color,
});

const transaction = z.object({
  type: z.enum(['gasto', 'ingreso'], { message: 'Tipo inválido.' }),
  amount: c.money('El monto'),
  description: c.text('La descripción', 120),
  note: c.optionalText('La nota', 300),
  date: c.dateStr,
  categoryId: z.number({ message: 'Elige una categoría.' }).int().positive('Elige una categoría.'),
  memberId: z.number().int().positive().nullable().optional(),
});

const txQuery = z.object({
  from: c.dateStr.optional(),
  to: c.dateStr.optional(),
  type: z.enum(['gasto', 'ingreso']).optional(),
  categoryId: c.id.optional(),
  memberId: z.union([c.id, z.literal('none')]).optional(),
  q: z.string().trim().max(80).optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  sort: z.enum(['date', 'amount', 'description']).optional().default('date'),
  dir: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const periodQuery = z.object({
  year: z.coerce.number().int().min(1990).max(2100),
  month: z.coerce.number().int().min(0).max(11),
  today: c.dateStr.optional(),
  months: z.coerce.number().int().min(1).max(24).optional().default(6),
});

const admin = {
  listUsers: z.object({
    q: z.string().trim().max(80).optional(),
    role: z.enum(['user', 'admin']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  }),
  updateUser: z
    .object({
      role: z.enum(['user', 'admin']).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((v) => v.role !== undefined || v.isActive !== undefined, 'No hay cambios para aplicar.'),
};

module.exports = { auth, settings, category, categoryBudgets, member, transaction, txQuery, periodQuery, admin, CURRENCIES, ROLES };
