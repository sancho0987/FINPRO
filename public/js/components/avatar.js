import { raw, esc } from '../utils.js';

export const DEFAULT_AVATAR = Object.freeze({
  version: 1, appearance: 'neutral', skin: 'medium', hairStyle: 'short', hairColor: '#38251f',
  eyes: 'almond', brows: 'soft', mouth: 'smile', accessory: 'none', clothing: 'tee', clothingColor: '#4fd1a5',
});

export const AVATAR_OPTIONS = Object.freeze({
  appearance: [['feminine', 'Femenina'], ['masculine', 'Masculina'], ['neutral', 'Neutra']],
  skin: [['light', 'Clara'], ['fair', 'Marfil'], ['medium', 'Media'], ['tan', 'Canela'], ['brown', 'Morena'], ['deep', 'Oscura']],
  hairStyle: [['short', 'Corto'], ['long', 'Largo'], ['curly', 'Rizado'], ['coily', 'Afro'], ['bob', 'Bob'], ['buzz', 'Rapado'], ['bald', 'Sin cabello']],
  hairColor: [['#211814', 'Negro'], ['#38251f', 'Castaño'], ['#a65324', 'Cobrizo'], ['#e0b85b', 'Rubio'], ['#8b5cf6', 'Violeta'], ['#e879a9', 'Rosa']],
  eyes: [['almond', 'Almendrados'], ['round', 'Redondos'], ['happy', 'Alegres']],
  brows: [['soft', 'Suaves'], ['straight', 'Rectas'], ['arched', 'Arqueadas']],
  mouth: [['smile', 'Sonrisa'], ['neutral', 'Serena'], ['open', 'Abierta']],
  accessory: [['none', 'Ninguno'], ['glasses', 'Gafas'], ['round-glasses', 'Gafas redondas'], ['cap', 'Gorra'], ['beanie', 'Gorro']],
  clothing: [['tee', 'Camiseta'], ['shirt', 'Camisa'], ['hoodie', 'Sudadera'], ['sweater', 'Suéter']],
  clothingColor: [['#4fd1a5', 'Verde menta'], ['#6b9fff', 'Azul'], ['#f472b6', 'Rosa'], ['#f0b84a', 'Amarillo'], ['#a78bfa', 'Violeta'], ['#f07070', 'Coral'], ['#334155', 'Azul noche'], ['#f8fafc', 'Blanco']],
});

const SKIN = { light: '#f7d9c3', fair: '#edc1a2', medium: '#d99c73', tan: '#b87852', brown: '#8f563d', deep: '#603b30' };
let gradientIndex = 0;
const safe = (obj) => {
  const input = obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
  const out = { ...DEFAULT_AVATAR };
  for (const key of ['appearance', 'skin', 'hairStyle', 'eyes', 'brows', 'mouth', 'accessory', 'clothing']) {
    const allowed = AVATAR_OPTIONS[key].map(([v]) => v);
    if (allowed.includes(input[key])) out[key] = input[key];
  }
  for (const key of ['hairColor', 'clothingColor']) {
    if (AVATAR_OPTIONS[key].some(([v]) => v.toLowerCase() === String(input[key] || '').toLowerCase())) out[key] = String(input[key]).toLowerCase();
  }
  return out;
};

const HAIR = {
  short: '<path d="M28 48c0-21 12-32 36-32s36 12 36 34c-7-8-14-12-23-12-11 0-18 5-27 12-6 4-13 4-22-2Z"/>',
  long: '<path d="M27 47c0-20 13-31 37-31s37 13 37 35v38H88V52c-8-1-15-5-20-12-8 9-20 14-34 14v34H25V51Z"/>',
  curly: '<path d="M25 49c-5-13 4-24 14-25-1-13 12-20 23-14 9-10 25-6 27 5 14-2 22 10 17 22l-8 10c-7-7-14-10-21-10-13 0-22 9-31 14-9 5-16 2-21-2Z"/><circle cx="31" cy="36" r="8"/><circle cx="48" cy="22" r="9"/><circle cx="72" cy="19" r="9"/><circle cx="94" cy="31" r="8"/>',
  coily: '<path d="M24 54c-6-12 0-23 10-25-1-13 10-20 20-16 7-12 24-12 30-1 13-5 24 5 21 17 11 6 11 18 2 27l-7 5c-8-11-19-16-31-16S47 55 37 64Z"/><circle cx="29" cy="39" r="9"/><circle cx="46" cy="25" r="10"/><circle cx="68" cy="19" r="11"/><circle cx="91" cy="29" r="10"/><circle cx="99" cy="47" r="8"/>',
  bob: '<path d="M26 49c0-21 13-33 38-33s38 13 38 35v31H88V52c-10 0-18-5-24-13-8 10-19 14-34 14v29H26Z"/>',
  buzz: '<path d="M30 47c0-19 12-30 34-30s34 12 34 31c-9-7-18-10-31-10s-24 3-37 9Z"/>',
  bald: '',
};

export function normalizeAvatar(value) { return safe(value); }

export function avatarMarkup(value, { size = 52, label = 'Avatar familiar', background = '#4fd1a5' } = {}) {
  const a = safe(value);
  const safeBackground = /^#[0-9a-f]{6}$/i.test(background) ? background : '#4fd1a5';
  const gradientId = `finpro-avatar-gradient-${++gradientIndex}`;
  const skin = SKIN[a.skin];
  const face = a.appearance === 'masculine' ? 'M64 29c18 0 30 13 30 32l-3 21c-2 10-12 18-27 18S39 92 37 82l-3-21c0-19 12-32 30-32Z'
    : a.appearance === 'feminine' ? 'M64 29c19 0 31 14 31 34 0 17-9 29-19 35l-12 7-12-7C42 92 33 80 33 63c0-20 12-34 31-34Z'
      : 'M64 29c19 0 30 14 30 34 0 22-12 36-30 36S34 85 34 63c0-20 11-34 30-34Z';
  const eyeY = a.eyes === 'happy' ? 62 : 60;
  const eye = a.eyes === 'round' ? `<circle cx="51" cy="${eyeY}" r="3.2" fill="#322521"/><circle cx="77" cy="${eyeY}" r="3.2" fill="#322521"/>`
    : `<path d="M46 ${eyeY}q5-5 10 0M72 ${eyeY}q5-5 10 0" fill="none" stroke="#322521" stroke-width="3" stroke-linecap="round"/>`;
  const brow = a.brows === 'straight' ? 'M46 52h11m15 0h11' : a.brows === 'arched' ? 'M45 53q6-7 13-1m13 0q7-6 13 1' : 'M46 53q5-4 11 0m15 0q6-4 11 0';
  const mouth = a.mouth === 'open' ? '<ellipse cx="64" cy="79" rx="5" ry="6" fill="#9e4f50"/>' : a.mouth === 'neutral' ? '<path d="M56 79h16" fill="none" stroke="#9e4f50" stroke-width="3" stroke-linecap="round"/>' : '<path d="M55 76q9 10 18 0" fill="none" stroke="#9e4f50" stroke-width="3" stroke-linecap="round"/>';
  const clothes = a.clothing === 'hoodie' ? '<path d="M25 127c2-23 12-34 27-39l12 11 12-11c16 5 25 16 27 39Z"/><path d="M53 90q11-12 22 0l-4 12h-14Z" fill="#fff" opacity=".22"/>'
    : a.clothing === 'shirt' ? '<path d="M25 127c2-23 12-34 27-39l12 11 12-11c16 5 25 16 27 39Z"/><path d="m52 89 12 10 12-10-5 38H57Z" fill="#fff" opacity=".72"/><path d="m52 89 12 10-7 9-9-15Zm24 0L64 99l7 9 9-15Z" fill="#e6eef7"/>'
      : a.clothing === 'sweater' ? '<path d="M25 127c2-23 12-34 27-39l12 11 12-11c16 5 25 16 27 39Z"/><path d="M27 116h74" fill="none" stroke="#fff" opacity=".25" stroke-width="4"/>'
        : '<path d="M25 127c2-23 12-34 27-39l12 11 12-11c16 5 25 16 27 39Z"/>';
  const accessory = a.accessory === 'glasses' ? '<g fill="none" stroke="#293747" stroke-width="3"><rect x="43" y="54" width="17" height="13" rx="5"/><rect x="68" y="54" width="17" height="13" rx="5"/><path d="M60 59h8m-27 0-5-2m49 2 5-2"/></g>'
    : a.accessory === 'round-glasses' ? '<g fill="none" stroke="#293747" stroke-width="3"><circle cx="52" cy="60" r="8"/><circle cx="76" cy="60" r="8"/><path d="M60 60h8m-24-2-5-2m45 2 5-2"/></g>'
      : a.accessory === 'cap' ? `<path d="M34 43q4-21 30-21t31 22q-31-8-61 0Z" fill="${a.hairColor}"/><path d="M31 44q35-11 69 1-24 10-69 1Z" fill="${a.hairColor}"/>`
        : a.accessory === 'beanie' ? `<path d="M33 45q2-27 31-27t31 27Z" fill="${a.hairColor}"/><path d="M32 43h65v9H32Z" fill="${a.clothingColor}"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${esc(label)}" class="avatar-art"><defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${safeBackground}" stop-opacity=".28"/><stop offset="1" stop-color="${safeBackground}" stop-opacity=".08"/></linearGradient></defs><circle cx="64" cy="64" r="64" fill="url(#${gradientId})"/><path d="M25 128c2-24 13-37 29-41h20c17 4 27 17 29 41Z" fill="${a.clothingColor}"/><g fill="${a.clothingColor}">${clothes}</g><rect x="55" y="83" width="18" height="18" rx="8" fill="${skin}"/><path d="${face}" fill="${skin}"/><g fill="${a.hairColor}">${HAIR[a.hairStyle]}</g>${brow ? `<path d="${brow}" fill="none" stroke="${a.hairColor}" stroke-width="2.7" stroke-linecap="round"/>` : ''}${eye}${mouth}${accessory}</svg>`;
  return raw(`<span class="avatar-visual" style="width:${size}px;height:${size}px" aria-label="${esc(label)}">${svg}</span>`);
}

