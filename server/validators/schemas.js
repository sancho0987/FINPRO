'use strict';
const { z } = require('zod');
const c = require('./common');

const CURRENCIES = ['COP', 'USD', 'EUR', 'MXN', 'ARS'];
const ROLES = ['Titular', 'Adulto', 'Joven', 'Niño', 'Otro'];
const AVATAR_ACCESSORY_SLOTS = [
  ['cap', 'beanie', 'hat', 'beret', 'crown', 'headband', 'flower-crown', 'cowboy-hat', 'visor', 'helmet', 'pirate-hat', 'wizard-hat', 'chef-hat', 'antenna', 'halo', 'cat-ears', 'bunny-ears', 'devil-horns', 'antlers', 'top-hat', 'knight-helmet', 'nurse-cap', 'crescent-crown', 'star-headband'],
  ['wig-afro', 'wig-braids', 'wig-rainbow', 'wig-copper', 'wig-mohawk'],
  ['glasses', 'round-glasses', 'sunglasses', 'heart-glasses', 'star-glasses', 'safety-goggles', 'monocle'],
  ['mask', 'masquerade-mask', 'domino-mask'],
  ['face-paint-stars', 'face-paint-stripe', 'whisker-paint'],
  ['beard-stubble', 'beard-short', 'beard-full', 'beard-goatee', 'beard-viking', 'beard-long', 'beard-braided', 'beard-shadow'],
  ['moustache', 'moustache-curly', 'moustache-handlebar', 'moustache-pencil', 'moustache-walrus'],
  ['earrings-hoop', 'earrings-stud', 'ear-cuff', 'earrings-drop'], ['headphones', 'headset', 'earphones'],
  ['scarf', 'bandana', 'tie', 'bowtie', 'choker', 'neck-ribbon'], ['necklace-star', 'necklace-pearl', 'necklace-moon'], ['star-pin', 'shell'], ['bow', 'flower', 'leaf', 'flower-barrette'],
  ['bun', 'twin-buns', 'wavy-bob', 'fringe', 'undercut', 'wig-afro', 'wig-braids', 'wig-rainbow', 'wig-copper', 'wig-mohawk'],
  ['square-glasses', 'aviators', 'glasses', 'round-glasses', 'sunglasses', 'heart-glasses', 'star-glasses', 'safety-goggles'],
  ['mask', 'masquerade-mask', 'domino-mask', 'eye-patch', 'robot-visor', 'gas-mask'],
  ['freckles', 'freckles-gold'],
];
const AVATAR_OVERLAP_GROUPS = {
  headwear: new Set(['cap', 'beanie', 'hat', 'beret', 'crown', 'headband', 'flower-crown', 'cowboy-hat', 'visor', 'helmet', 'pirate-hat', 'wizard-hat', 'chef-hat', 'antenna', 'halo', 'cat-ears', 'bunny-ears', 'devil-horns', 'antlers', 'top-hat', 'knight-helmet', 'nurse-cap', 'crescent-crown', 'star-headband']),
  hairClips: new Set(['bow', 'flower', 'leaf', 'flower-barrette']),
  masks: new Set(['mask', 'masquerade-mask', 'domino-mask', 'eye-patch', 'robot-visor', 'gas-mask']),
  facialHair: new Set(['beard-stubble', 'beard-short', 'beard-full', 'beard-goatee', 'beard-viking', 'beard-long', 'beard-braided', 'beard-shadow', 'moustache', 'moustache-curly', 'moustache-handlebar', 'moustache-pencil', 'moustache-walrus']),
  audio: new Set(['headphones', 'headset', 'earphones']),
  earrings: new Set(['earrings-hoop', 'earrings-stud', 'ear-cuff', 'earrings-drop']),
  neckwear: new Set(['scarf', 'bandana', 'tie', 'bowtie', 'choker', 'neck-ribbon']),
  necklaces: new Set(['necklace-star', 'necklace-pearl', 'necklace-moon']),
};
const hasGroup = (items, group) => items.some((item) => group.has(item));
const avatar = z.object({
  version: z.literal(1),
  style: z.literal('custom').optional(),
  character: z.enum([
    'luna', 'mateo', 'kiwi', 'michi', 'cosmo', 'pixel', 'zuri', 'bruno', 'ines', 'diego', 'amara', 'tomas',
    'valentina', 'kai', 'omar', 'zoe', 'rafa', 'sofia', 'zorro', 'conejo', 'panda', 'rana', 'buho', 'tigre',
    'perro', 'pinguino', 'mapache', 'koala', 'leon', 'tortuga', 'dragon', 'unicornio', 'hada', 'sirena', 'fenix',
    'fantasma', 'mago', 'vampiro', 'slime', 'alien', 'taco', 'cactus', 'astronauta', 'pirata', 'chef', 'disco',
    'ninja', 'exploradora', 'inventor', 'superheroina', 'astronomo', 'jardinera', 'alma', 'lucas', 'noor', 'inesa',
    'ciervo', 'tiburon', 'erizo', 'ajolote', 'polilla', 'golem', 'seta', 'nube',
  ]),
  appearance: z.enum(['masculine', 'feminine', 'neutral']),
  skin: z.enum(['light', 'fair', 'medium', 'tan', 'brown', 'deep']),
  hairStyle: z.enum(['short', 'long', 'curly', 'coily', 'bob', 'buzz', 'bald', 'ponytail', 'braids', 'mohawk', 'pigtails', 'side-swept', 'bun', 'twin-buns', 'wavy-bob', 'fringe', 'undercut']),
  hairColor: z.enum(['#211814', '#38251f', '#a65324', '#e0b85b', '#8b5cf6', '#e879a9', '#4fd1a5', '#6b9fff', '#f0b84a', '#f07070', '#334155', '#f8fafc', '#94a3b8']),
  eyes: z.enum(['almond', 'round', 'happy', 'starry', 'sleepy', 'wink']),
  eyeColor: z.enum(['#293747', '#334155', '#6b432d', '#3f8f82', '#6b9fff', '#8b5cf6']),
  brows: z.enum(['soft', 'straight', 'arched']),
  mouth: z.enum(['smile', 'neutral', 'open', 'grin', 'surprised', 'smirk', 'pout']),
  faceShape: z.enum(['soft', 'oval', 'round', 'angular']),
  accessory: z.enum(['none', 'glasses', 'round-glasses', 'cap', 'beanie', 'star-pin', 'bow', 'scarf', 'headphones', 'bandana', 'leaf', 'flower', 'shell', 'antenna', 'helmet', 'pirate-hat', 'wizard-hat', 'chef-hat', 'mask', 'hat']),
  accessories: z.array(z.enum([
    'cap', 'beanie', 'hat', 'beret', 'crown', 'headband', 'flower-crown', 'cowboy-hat', 'visor', 'helmet', 'pirate-hat', 'wizard-hat', 'chef-hat', 'antenna', 'halo',
    'wig-afro', 'wig-braids', 'wig-rainbow', 'wig-copper', 'wig-mohawk',
    'glasses', 'round-glasses', 'sunglasses', 'heart-glasses', 'star-glasses', 'safety-goggles', 'monocle', 'mask', 'masquerade-mask', 'domino-mask', 'face-paint-stars', 'face-paint-stripe', 'freckles', 'scar', 'whisker-paint',
    'beard-stubble', 'beard-short', 'beard-full', 'beard-goatee', 'beard-viking', 'moustache', 'moustache-curly', 'moustache-handlebar',
    'cat-ears', 'bunny-ears', 'devil-horns', 'antlers', 'top-hat', 'knight-helmet', 'nurse-cap', 'crescent-crown', 'star-headband',
    'bun', 'twin-buns', 'wavy-bob', 'fringe', 'undercut', 'flower-barrette',
    'square-glasses', 'aviators', 'eye-patch', 'robot-visor', 'gas-mask', 'nose-ring', 'lip-piercing', 'beauty-mark', 'cheek-hearts', 'freckles-gold',
    'beard-long', 'beard-braided', 'beard-shadow', 'moustache-pencil', 'moustache-walrus', 'earrings-drop', 'earphones', 'choker', 'necklace-moon', 'neck-ribbon', 'backpack', 'wings', 'magic-aura', 'sparkle-orbit',
    'earrings-hoop', 'earrings-stud', 'ear-cuff', 'headphones', 'headset',
    'scarf', 'bandana', 'tie', 'bowtie', 'necklace-star', 'necklace-pearl', 'star-pin', 'bow', 'flower', 'leaf', 'shell', 'medal', 'patch',
  ])).max(12)
    .refine((items) => new Set(items).size === items.length, 'No repitas accesorios.')
    .refine((items) => AVATAR_ACCESSORY_SLOTS.every((slot) => items.filter((id) => slot.includes(id)).length <= 1), 'Hay accesorios que ocupan la misma zona.')
    .refine((items) => {
      const incompatiblePairs = new Set([
        'eye-patch|glasses', 'eye-patch|round-glasses', 'eye-patch|square-glasses', 'eye-patch|aviators', 'eye-patch|sunglasses', 'eye-patch|heart-glasses', 'eye-patch|star-glasses', 'eye-patch|safety-goggles',
        'masquerade-mask|glasses', 'masquerade-mask|round-glasses', 'masquerade-mask|square-glasses', 'masquerade-mask|aviators', 'masquerade-mask|sunglasses', 'masquerade-mask|heart-glasses', 'masquerade-mask|star-glasses', 'masquerade-mask|safety-goggles',
        'domino-mask|glasses', 'domino-mask|round-glasses', 'domino-mask|square-glasses', 'domino-mask|aviators', 'domino-mask|sunglasses', 'domino-mask|heart-glasses', 'domino-mask|star-glasses', 'domino-mask|safety-goggles',
        'robot-visor|glasses', 'robot-visor|round-glasses', 'robot-visor|square-glasses', 'robot-visor|aviators', 'robot-visor|sunglasses', 'robot-visor|heart-glasses', 'robot-visor|star-glasses', 'robot-visor|safety-goggles',
        'gas-mask|glasses', 'gas-mask|round-glasses', 'gas-mask|square-glasses', 'gas-mask|aviators', 'gas-mask|sunglasses', 'gas-mask|heart-glasses', 'gas-mask|star-glasses', 'gas-mask|safety-goggles',
        ...['beard-full', 'beard-long', 'beard-braided', 'beard-viking'].flatMap((beard) => ['moustache', 'moustache-curly', 'moustache-handlebar', 'moustache-pencil', 'moustache-walrus'].map((moustache) => `${beard}|${moustache}`)),
      ]);
      const hasOcclusion = items.some((left, index) => items.slice(index + 1).some((right) => incompatiblePairs.has([left, right].sort().join('|'))));
      const hasHeadwearHairClip = hasGroup(items, AVATAR_OVERLAP_GROUPS.headwear) && hasGroup(items, AVATAR_OVERLAP_GROUPS.hairClips);
      const hasMaskFacialHair = hasGroup(items, AVATAR_OVERLAP_GROUPS.masks) && hasGroup(items, AVATAR_OVERLAP_GROUPS.facialHair);
      const hasAudioEarrings = hasGroup(items, AVATAR_OVERLAP_GROUPS.audio) && hasGroup(items, AVATAR_OVERLAP_GROUPS.earrings);
      const hasNeckwearNecklace = hasGroup(items, AVATAR_OVERLAP_GROUPS.neckwear) && hasGroup(items, AVATAR_OVERLAP_GROUPS.necklaces);
      return !hasOcclusion && !hasHeadwearHairClip && !hasMaskFacialHair && !hasAudioEarrings && !hasNeckwearNecklace;
    }, 'Hay accesorios que se superponen y no pueden combinarse.'),
  clothing: z.enum(['tee', 'shirt', 'hoodie', 'sweater', 'dress', 'suit', 'cape', 'jacket', 'sport', 'uniform', 'armor', 'robe', 'overalls', 'raincoat', 'blazer']),
  clothingColor: z.enum(['#211814', '#38251f', '#a65324', '#e0b85b', '#8b5cf6', '#e879a9', '#4fd1a5', '#6b9fff', '#f472b6', '#a78bfa', '#f0b84a', '#f07070', '#334155', '#f8fafc', '#94a3b8']),
}).strict();

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
const memberAvatar = z.object({ avatar });


const transaction = z.object({
  type: z.enum(['gasto', 'ingreso'], { message: 'Tipo inválido.' }),
  amount: c.money('El monto'),
  description: c.text('La descripción', 120),
  note: c.optionalText('La nota', 300),
  date: c.dateStr,
  categoryId: c.id,
  memberId: z.union([c.id, z.null()]).optional(),
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

module.exports = { auth, settings, category, categoryBudgets, member, memberAvatar, avatar, transaction, txQuery, periodQuery, admin, CURRENCIES, ROLES };
