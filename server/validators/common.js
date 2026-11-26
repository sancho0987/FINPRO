'use strict';
const { z } = require('zod');
const { isValidDate } = require('../utils/period');

const text = (label, max, { min = 1 } = {}) =>
  z
    .string({ message: `${label} es obligatorio.` })
    .trim()
    // elimina caracteres de control (salvo saltos de línea/tab) para evitar basura invisible
    .transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ''))
    .pipe(
      z
        .string()
        .min(min, `${label} es obligatorio.`)
        .max(max, `${label} no puede superar ${max} caracteres.`)
    );

const optionalText = (label, max) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((s) => (s == null ? '' : s.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')))
    .pipe(z.string().max(max, `${label} no puede superar ${max} caracteres.`));

const email = z
  .string({ message: 'El correo es obligatorio.' })
  .trim()
  .toLowerCase()
  .max(254, 'El correo es demasiado largo.')
  .email('Ingresa un correo válido.');

const password = z
  .string({ message: 'La contraseña es obligatoria.' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .refine((s) => Buffer.byteLength(s, 'utf8') <= 72, 'La contraseña es demasiado larga (máx. 72 bytes).')
  .refine((s) => /[A-Za-z]/.test(s) && /\d/.test(s), 'La contraseña debe incluir al menos una letra y un número.');

const color = z.string({ message: 'El color es obligatorio.' }).regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido (use formato #RRGGBB).');
const emoji = z
  .string()
  .trim()
  .min(1, 'Elige un emoji.')
  .max(12, 'El emoji es demasiado largo.');

const money = (label, { allowZero = false } = {}) =>
  z
    .number({ message: `${label} debe ser un número.` })
    .finite(`${label} debe ser un número.`)
    .refine((n) => (allowZero ? n >= 0 : n > 0), allowZero ? `${label} no puede ser negativo.` : `${label} debe ser mayor que 0.`)
    .refine((n) => n <= 999999999999, `${label} es demasiado grande.`)
    .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, `${label} admite máximo 2 decimales.`);

const dateStr = z
  .string({ message: 'La fecha es obligatoria.' })
  .refine(isValidDate, 'Fecha inválida (use AAAA-MM-DD).')
  .refine((d) => d >= '1990-01-01' && d <= '2100-12-31', 'La fecha está fuera del rango permitido.');

const id = z.union([z.coerce.number().int().positive(), z.string().uuid()]);
const emptyToUndef = (v) => (v === '' || v === null ? undefined : v);

module.exports = { text, optionalText, email, password, color, emoji, money, dateStr, id, emptyToUndef };
