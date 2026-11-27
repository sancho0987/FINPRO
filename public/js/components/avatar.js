import { raw, esc } from '../utils.js';
import { editablePortrait } from './avatar-portrait.js';
import { AVATAR_CATALOG, AVATAR_CHARACTER_IDS, AVATAR_ACCESSORIES, AVATAR_ARTWORKS, AVATAR_CHARACTER_ANCHORS, AVATAR_CHARACTER_ACCESSORY_FIT, canEditAppearance, compatibleAccessories } from './avatar-catalog.js';

const BASE_AVATAR = {
  version: 1, character: 'luna', appearance: 'neutral', skin: 'medium', hairStyle: 'short', hairColor: '#38251f',
  eyes: 'almond', eyeColor: '#334155', brows: 'soft', mouth: 'smile', faceShape: 'soft', accessory: 'none', accessories: [], clothing: 'tee', clothingColor: '#4fd1a5',
};
export const DEFAULT_AVATAR = Object.freeze({ ...BASE_AVATAR });

const COLORS = [
  ['#211814', 'Negro'], ['#38251f', 'Castaño'], ['#a65324', 'Cobrizo'], ['#e0b85b', 'Rubio'],
  ['#8b5cf6', 'Violeta'], ['#e879a9', 'Rosa'], ['#4fd1a5', 'Menta'], ['#6b9fff', 'Azul'],
  ['#f0b84a', 'Dorado'], ['#f07070', 'Coral'], ['#334155', 'Noche'], ['#f8fafc', 'Blanco'], ['#94a3b8', 'Plata'],
];
const CLOTHING_COLORS = [...COLORS, ['#a78bfa', 'Lavanda'], ['#f472b6', 'Fucsia']];

export const AVATAR_OPTIONS = Object.freeze({
  appearance: [['feminine', 'Femenina'], ['masculine', 'Masculina'], ['neutral', 'Neutra']],
  skin: [['light', 'Clara'], ['fair', 'Marfil'], ['medium', 'Media'], ['tan', 'Canela'], ['brown', 'Morena'], ['deep', 'Oscura']],
  hairStyle: [['short', 'Corto'], ['long', 'Largo'], ['curly', 'Rizado'], ['coily', 'Afro'], ['bob', 'Bob'], ['buzz', 'Rapado'], ['bald', 'Sin cabello'], ['ponytail', 'Cola alta'], ['braids', 'Trenzas'], ['mohawk', 'Cresta'], ['pigtails', 'Coletas'], ['side-swept', 'Lateral'], ['bun', 'Moño alto'], ['twin-buns', 'Dos moños'], ['wavy-bob', 'Bob ondulado'], ['fringe', 'Flequillo'], ['undercut', 'Undercut']],
  hairColor: COLORS,
  eyes: [['almond', 'Almendrados'], ['round', 'Redondos'], ['happy', 'Alegres'], ['starry', 'Brillantes'], ['sleepy', 'Soñolientos'], ['wink', 'Guiño']],
  eyeColor: [['#334155', 'Gris oscuro'], ['#293747', 'Carbón'], ['#6b432d', 'Marrón'], ['#3f8f82', 'Verde'], ['#6b9fff', 'Azul'], ['#8b5cf6', 'Violeta']],
  brows: [['soft', 'Suaves'], ['straight', 'Rectas'], ['arched', 'Arqueadas']],
  mouth: [['smile', 'Sonrisa'], ['neutral', 'Serena'], ['open', 'Abierta'], ['grin', 'Risa'], ['surprised', 'Sorpresa'], ['smirk', 'Pícara'], ['pout', 'Puchero']],
  faceShape: [['soft', 'Suave'], ['oval', 'Ovalado'], ['round', 'Redondo'], ['angular', 'Angular']],
  accessory: [
    ['none', 'Ninguno'], ['glasses', 'Gafas'], ['round-glasses', 'Gafas redondas'], ['cap', 'Gorra'], ['beanie', 'Gorro'],
    ['star-pin', 'Estrella'], ['bow', 'Lazo'], ['scarf', 'Bufanda'], ['headphones', 'Auriculares'], ['bandana', 'Pañuelo'],
    ['leaf', 'Hoja'], ['flower', 'Flor'], ['shell', 'Concha'], ['antenna', 'Antenas'], ['helmet', 'Casco'], ['pirate-hat', 'Sombrero pirata'],
    ['wizard-hat', 'Sombrero mágico'], ['chef-hat', 'Gorro de chef'], ['mask', 'Antifaz'], ['hat', 'Sombrero'],
  ],
  clothing: [['tee', 'Camiseta'], ['shirt', 'Camisa'], ['hoodie', 'Sudadera'], ['sweater', 'Suéter'], ['dress', 'Vestido'], ['suit', 'Traje'], ['cape', 'Capa'], ['jacket', 'Chaqueta'], ['sport', 'Deportiva'], ['uniform', 'Uniforme'], ['armor', 'Armadura'], ['robe', 'Túnica'], ['overalls', 'Overol'], ['raincoat', 'Impermeable'], ['blazer', 'Blazer']],
  clothingColor: CLOTHING_COLORS,
});

export const AVATAR_PRESETS = AVATAR_CATALOG.map((item) => ({
  ...item,
  avatar: Object.freeze({ ...BASE_AVATAR, ...item.avatar, character: item.id, accessories: item.avatar.accessory && item.avatar.accessory !== 'none' ? [item.avatar.accessory] : [], accessory: 'none' }),
}));

const SKIN = { light: '#f7d9c3', fair: '#edc1a2', medium: '#d99c73', tan: '#b87852', brown: '#8f563d', deep: '#603b30' };
let gradientIndex = 0;
const OPTIONS = Object.fromEntries(Object.entries(AVATAR_OPTIONS).map(([key, values]) => [key, new Set(values.map(([value]) => value))]));
const safe = (obj) => {
  const input = obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
  const out = { ...DEFAULT_AVATAR };
  if (AVATAR_CHARACTER_IDS.includes(input.character)) out.character = input.character;
  if (canEditAppearance(out.character) && (input.style === 'custom' || (!input.character && input.version === 1))) out.style = 'custom';
  for (const key of Object.keys(OPTIONS)) if (OPTIONS[key].has(input[key])) out[key] = input[key];
  const requestedAccessories = Array.isArray(input.accessories) ? input.accessories : (input.accessory && input.accessory !== 'none' ? [input.accessory] : []);
  out.accessories = compatibleAccessories([...new Set(requestedAccessories)], out.character).slice(0, 12);
  // Keep the legacy field for existing API clients and saved records.
  out.accessory = 'none';
  return out;
};

function illustratedHairOverlay(style, color) {
  const stroke = '#293747';
  const shapes = {
    short: '<path d="M29 51q-2-30 16-37 21-10 42 0 16 9 13 37l-9-8-5-14q-18 13-48 9l-3 12Z"/>',
    long: '<path d="M28 52q-2-31 17-39 21-10 42 0 17 9 13 39l-8-8-5-15q-18 13-48 9l-3 14Z"/><path d="M31 45q-9 22-3 43m72-43q8 22 2 43" fill="none" stroke-width="8"/>',
    curly: '<path d="M28 51q-3-28 15-37 21-13 42-1 19 10 14 39l-9-10-5-13q-21 12-48 9Z"/><g><circle cx="34" cy="34" r="8"/><circle cx="48" cy="21" r="9"/><circle cx="64" cy="16" r="10"/><circle cx="81" cy="21" r="9"/><circle cx="94" cy="35" r="8"/></g>',
    coily: '<path d="M27 51q-4-28 15-38 23-13 45 0 19 11 13 39l-9-8-3-14q-22 10-50 8Z"/><g><circle cx="31" cy="36" r="9"/><circle cx="45" cy="23" r="10"/><circle cx="62" cy="17" r="11"/><circle cx="80" cy="22" r="10"/><circle cx="96" cy="37" r="9"/></g>',
    braids: '<path d="M28 49q-2-29 17-37 21-10 42 0 17 9 13 38l-9-8-5-14q-18 13-48 9Z"/><path d="M30 44q-8 21 0 40m68-40q8 21 0 40" fill="none" stroke-width="8"/><path d="M28 79v5m72-5v5" fill="none" stroke="#e0b85b" stroke-width="2.4"/>',
    mohawk: '<path d="M49 49q0-31 15-42 15 11 15 42l-8-8h-14Z"/><path d="M52 20q11-10 23 0" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="2.5"/>',
    bun: '<path d="M31 49q0-27 17-35 19-10 37 0 16 8 15 35l-9-7-5-14q-18 11-47 8Z"/><circle cx="65" cy="13" r="10"/>',
    'twin-buns': '<path d="M31 49q0-27 17-35 18-9 34 0 16 8 15 35l-9-7-5-14q-20 11-47 8Z"/><circle cx="42" cy="16" r="9"/><circle cx="86" cy="16" r="9"/>',
    'wavy-bob': '<path d="M28 49q0-30 17-37 20-10 39 0 17 8 16 37l-9-8-5-14q-18 11-48 8Z"/><path d="M31 45q-8 17-3 28 5 7 10-1l1-19m58-8q8 17 3 28-5 7-10-1l-1-19" fill="none" stroke-width="7"/>',
    fringe: '<path d="M29 50q0-31 18-38 20-10 39 0 17 9 15 38l-9-8-5-14q-7 15-19 14-10 0-15-8-9 14-24 16Z"/>',
    undercut: '<path d="M28 49q0-29 19-37 20-9 40 0 17 9 14 36l-10-8-6-14q-16 13-43 9Z"/><path d="M31 46q-6 13-2 23m68-23q6 13 2 23" fill="none" stroke-width="7"/>',
  };
  const path = shapes[style] || shapes.short;
  return `<g fill="${color}" stroke="${stroke}" stroke-width="2.3" stroke-linejoin="round" stroke-linecap="round">${path}<path d="M40 34q8-15 21-15m7-2q11 0 17 8" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2.3"/></g>`;
}

const FITTED_HEADWEAR = new Set(['cap', 'beanie', 'hat']);

function accessoryLayer(id, a) {
  const ink = '#293747';
  const accent = a.clothingColor;
  const glasses = `<g fill="none" stroke="${ink}" stroke-width="3.2" stroke-linecap="round"><rect x="41" y="53" width="19" height="15" rx="6"/><rect x="68" y="53" width="19" height="15" rx="6"/><path d="M60 59h8m-27 0-5-2m51 2 5-2"/></g>`;
  const roundGlasses = `<g fill="${id === 'sunglasses' ? '#334155' : 'none'}" stroke="${ink}" stroke-width="3"><circle cx="51" cy="60" r="9"/><circle cx="77" cy="60" r="9"/><path d="M60 60h8"/></g>`;
  const headwear = {
    cap: `<g stroke="${ink}" stroke-width="1.5" stroke-linejoin="round">
      <path d="M25 45c-2-16 6-29 20-33 20-6 43 0 51 16 3 6 5 12 5 17Z" fill="${accent}"/>
      <path d="M65 9c20 2 32 14 35 34H73C78 26 74 17 65 9Z" fill="#182132" stroke="none" opacity=".24"/>
      <path d="M41 14C32 21 30 32 30 39m28-29c-10 6-14 17-14 29" fill="none" stroke="#fff5e0" opacity=".44" stroke-linecap="round"/>
      <path d="M24 41q19-4 45-1 20 0 38 6-8 7-27 7-27 0-49-7Z" fill="${accent}"/>
      <path d="M30 46q17 2 50 4 18 0 26-4-7 7-26 8-25 0-49-7Z" fill="#17232b" stroke="none" opacity=".44"/>
    </g>`,
    beanie: `<g stroke="${ink}" stroke-width="1.4" stroke-linejoin="round">
      <path d="M25 45C26 24 40 8 64 8c22 0 38 15 39 37Z" fill="${accent}"/>
      <path d="M64 9c22 2 37 17 38 36H72c10-12 10-24-8-36Z" fill="#17232b" stroke="none" opacity=".25"/>
      <path d="M35 40q1-13 9-21m-3 22q1-16 10-25m-4 24q2-17 10-26m-3 26q1-16 7-26m1 27 2-28m6 28q0-17-3-27m10 27q-1-17-6-25m13 25q-2-15-8-22m15 21q-2-11-8-17" fill="none" stroke="#fff5e0" opacity=".29" stroke-linecap="round"/>
      <path d="M24 39q40-6 80 0l-1 10q-43-4-78 1Z" fill="${accent}"/>
      <path d="M28 46q33-5 72-1" stroke="#17232b" opacity=".35" fill="none"/>
      <path d="m31 41 1 5m6-6 1 5m7-6 1 5m7-5 1 5m7-6v6m7-6v6m7-6 1 6m7-5 1 5m7-5v5m7-4v5" fill="none" stroke="#fff5e0" opacity=".38"/>
    </g>`,
    hat: `<g stroke="#473026" stroke-width="1.5" stroke-linejoin="round">
      <path d="M33 43c3-9 5-20 11-28 5-7 13-2 20-3 8-1 15-6 21 0 5 6 10 21 11 31Z" fill="#a77550"/>
      <path d="M69 13c8-2 12-5 16 0 5 7 9 20 11 29H79c5-9 3-21-10-29Z" fill="#77503c" stroke="none"/>
      <path d="M40 34c3-9 6-16 11-17 4-1 9 2 15 0" fill="none" stroke="#ebbe91" opacity=".68" stroke-linecap="round"/>
      <path d="M35 35q30 5 58-2l3 9q-30 8-63 1Z" fill="${accent}"/>
      <path d="M18 42c10-4 20-3 35-2 25 3 44-2 57-4q2 9-14 14c-12 4-45 4-63-1-7-2-12-5-15-7Z" fill="#ad7851"/>
      <path d="M23 43c19 6 53 7 76 1" fill="none" stroke="#edbc8c" opacity=".68" stroke-linecap="round"/>
    </g>`,
    beret: `<path d="M34 43q7-25 32-23 20 2 28 18-27 11-60 5Z" fill="#f07070" stroke="${ink}" stroke-width="3"/><path d="M64 20q2-8 9-7" fill="none" stroke="${ink}" stroke-width="3"/>`,
    crown: '<path d="m39 44-5-25 17 14 13-23 13 23 17-14-5 25Z" fill="#f0b84a" stroke="#8f563d" stroke-width="3"/><path d="M39 44h50" stroke="#fff2b2" stroke-width="4"/>',
    headband: '<path d="M30 48q4-31 34-31t34 31" fill="none" stroke="#f472b6" stroke-width="7"/><path d="M31 49q33-17 66 0" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>',
    'flower-crown': '<path d="M30 48q34-28 68 0" fill="none" stroke="#4fd1a5" stroke-width="4"/><g fill="#f472b6" stroke="#fff" stroke-width="1.5"><circle cx="36" cy="41" r="6"/><circle cx="49" cy="34" r="6"/><circle cx="64" cy="31" r="6"/><circle cx="79" cy="34" r="6"/><circle cx="92" cy="41" r="6"/></g><circle cx="64" cy="31" r="2.5" fill="#f0b84a"/>',
    'cowboy-hat': '<path d="M39 39q2-17 25-17t25 17l19 8q-44 15-88 0Z" fill="#a65324" stroke="#38251f" stroke-width="3"/><path d="M37 39h54" stroke="#f0b84a" stroke-width="5"/>',
    visor: '<path d="M37 39q4-20 27-20t27 20Z" fill="#f07070" stroke="#293747" stroke-width="3"/><path d="M31 41q33-8 66 1-17 10-66-1Z" fill="#f8fafc" stroke="#293747" stroke-width="2"/>',
    helmet: '<path d="M27 54V48q0-35 37-35t37 35v7Z" fill="#6b9fff" stroke="#293747" stroke-width="4"/><path d="M34 48h60" stroke="#f8fafc" stroke-width="5"/><path d="M35 54h58" stroke="#334155" stroke-width="4"/>',
    'pirate-hat': '<path d="M31 47q-8-24 6-31 11 10 27 2 16 8 28-2 14 10 5 31Z" fill="#334155" stroke="#211814" stroke-width="3"/><path d="M25 47q39-11 78 0l-8 8H33Z" fill="#211814"/><circle cx="64" cy="34" r="7" fill="#f8fafc"/>',
    'wizard-hat': '<path d="m29 43 35-38 35 38q-35-10-70 0Z" fill="#334155" stroke="#a78bfa" stroke-width="4"/><path d="M30 43q34-9 68 0l-5 8H35Z" fill="#a78bfa"/><path d="m64 12 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#f0b84a"/>',
    'chef-hat': '<path d="M39 45q-19-20 1-30 10-8 19 4 8-20 21-10 17 11 8 32l-7 12H44Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="3"/>',
    antenna: '<path d="M49 31 42 17m37 14 7-14" stroke="#f0b84a" stroke-width="4" stroke-linecap="round"/><circle cx="41" cy="14" r="6" fill="#f07070" stroke="#fff" stroke-width="2"/><circle cx="88" cy="14" r="6" fill="#6b9fff" stroke="#fff" stroke-width="2"/>',
    halo: '<ellipse cx="64" cy="14" rx="25" ry="7" fill="none" stroke="#f0b84a" stroke-width="5"/><ellipse cx="64" cy="14" rx="25" ry="7" fill="none" stroke="#fff2b2" stroke-width="1.5"/>',
    'cat-ears': '<path d="M31 48 27 15q1-9 9-3l23 28m38 8 4-33q-1-9-9-3L69 40Z" fill="#a65324" stroke="#293747" stroke-width="3"/><path d="m34 25 13 15m47-15L81 40" stroke="#f4a6ad" stroke-width="5" stroke-linecap="round"/>',
    'bunny-ears': '<path d="M43 42Q26-5 40 1q15 3 17 39m13 2Q72-5 87 1q14 6-3 48" fill="#edc1a2" stroke="#293747" stroke-width="3"/><path d="M42 9q7 14 10 31m28-1q5-18 12-30" fill="none" stroke="#f4a6ad" stroke-width="5"/>',
    'devil-horns': '<path d="M45 39Q20 24 31 6q5 16 25 19m27 14Q108 24 97 6q-5 16-25 19Z" fill="#f07070" stroke="#7f1d1d" stroke-width="3"/>',
    antlers: '<path d="M43 45q-18-14-14-34m14 34q-20-2-25-14m25 14Q29 35 31 20m54 25q18-14 14-34m-14 34q20-2 25-14m-25 14q14-10 12-25" fill="none" stroke="#8f563d" stroke-width="5" stroke-linecap="round"/>',
    'top-hat': '<path d="M40 44V13q0-6 6-6h36q6 0 6 6v31Z" fill="#334155" stroke="#293747" stroke-width="3"/><path d="M30 44q34-8 68 0l-4 8H34Z" fill="#f0b84a" stroke="#293747" stroke-width="2"/>',
    'knight-helmet': '<path d="M34 50V27q0-20 30-20t30 20v23l-11 11H45Z" fill="#94a3b8" stroke="#334155" stroke-width="4"/><path d="M36 39h56M64 9v51m-20-9 20 4 20-4" fill="none" stroke="#e2e8f0" stroke-width="4"/><path d="M42 42h15m14 0h15" stroke="#334155" stroke-width="5"/>',
    'nurse-cap': '<path d="M35 42q29-23 58 0l-5 10H40Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="3"/><path d="M64 29v17m-8-9h16" stroke="#f07070" stroke-width="4" stroke-linecap="round"/>',
    'crescent-crown': '<path d="M64 8a22 22 0 1 0 19 34A18 18 0 0 1 64 8Z" fill="#f0b84a" stroke="#fff2b2" stroke-width="2"/><circle cx="88" cy="21" r="3" fill="#fff2b2"/><circle cx="42" cy="30" r="2.5" fill="#fff2b2"/>',
    'star-headband': '<path d="M30 48q34-27 68 0" fill="none" stroke="#6b9fff" stroke-width="6"/><path d="m64 20 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1Z" fill="#f0b84a" stroke="#fff2b2" stroke-width="1.5"/>',
  };
  if (id === 'glasses') return glasses;
  if (['round-glasses', 'sunglasses', 'safety-goggles'].includes(id)) return roundGlasses;
  if (id === 'heart-glasses') return '<path d="M40 59q0-11 10-5 10-6 10 5-1 7-10 13-9-6-10-13Zm28 0q0-11 10-5 10-6 10 5-1 7-10 13-9-6-10-13Z" fill="#f472b6" stroke="#293747" stroke-width="2.5"/><path d="M60 59h8" stroke="#293747" stroke-width="3"/>';
  if (id === 'star-glasses') return '<g fill="#f0b84a" stroke="#293747" stroke-width="2"><path d="m51 50 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Zm26 0 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z"/></g><path d="M60 59h8" stroke="#293747" stroke-width="3"/>';
  if (id === 'monocle') return '<circle cx="76" cy="60" r="10" fill="#dbeafe" fill-opacity=".45" stroke="#f0b84a" stroke-width="3"/><path d="m82 69 5 17" stroke="#f0b84a" stroke-width="2"/>';
  if (id === 'square-glasses') return '<g fill="none" stroke="#293747" stroke-width="3"><rect x="40" y="52" width="21" height="16" rx="2"/><rect x="67" y="52" width="21" height="16" rx="2"/><path d="M61 58h6m-27 0-5-3m52 3 5-3"/></g>';
  if (id === 'aviators') return '<g fill="#6b9fff" fill-opacity=".28" stroke="#334155" stroke-width="3"><path d="M40 52h21v8q-2 11-11 11t-10-11Zm27 0h21v8q-2 11-11 11t-10-11Z"/><path d="M61 55h6"/></g>';
  if (id === 'eye-patch') return '<path d="M40 51h26v18q-14 8-26-2Z" fill="#334155" stroke="#211814" stroke-width="3"/><path d="M41 54 31 48m35 5 13-8" stroke="#211814" stroke-width="2.5"/>';
  if (id === 'robot-visor') return '<path d="M36 51q28-10 56 0v17q-28 10-56 0Z" fill="#334155" stroke="#6b9fff" stroke-width="3"/><path d="M43 58h12m8 0h19" stroke="#4fd1a5" stroke-width="3"/><circle cx="51" cy="62" r="2" fill="#fff"/><circle cx="75" cy="62" r="2" fill="#fff"/>';
  if (id === 'gas-mask') return '<path d="M43 64q21-13 42 0l-5 23H48Z" fill="#64748b" stroke="#293747" stroke-width="3"/><circle cx="54" cy="77" r="5" fill="#a7f3d0" stroke="#334155" stroke-width="2"/><circle cx="74" cy="77" r="5" fill="#a7f3d0" stroke="#334155" stroke-width="2"/><path d="M48 62 38 55m42 7 10-7" stroke="#334155" stroke-width="3"/>';
  if (id === 'nose-ring') return '<path d="M66 69q-2 9-5 11" fill="none" stroke="#f0b84a" stroke-width="2.5"/><circle cx="60" cy="81" r="2.5" fill="#f0b84a"/>';
  if (id === 'lip-piercing') return '<circle cx="72" cy="83" r="2.5" fill="#f0b84a" stroke="#fff2b2" stroke-width="1"/>';
  if (id === 'beauty-mark') return '<circle cx="80" cy="73" r="2" fill="#603b30"/>';
  if (id === 'cheek-hearts') return '<g fill="#f07070"><path d="M42 72q-7-7 0-8 4 0 5 4 2-4 6-4 7 1 0 8l-6 5Zm31 0q-7-7 0-8 4 0 5 4 2-4 6-4 7 1 0 8l-6 5Z"/></g>';
  if (id === 'freckles-gold') return '<g fill="#f0b84a"><circle cx="43" cy="70" r="1.8"/><circle cx="50" cy="74" r="1.5"/><circle cx="55" cy="70" r="1.4"/><circle cx="73" cy="70" r="1.4"/><circle cx="78" cy="74" r="1.5"/><circle cx="85" cy="70" r="1.8"/></g>';
  if (id === 'mask') return '<path d="M39 70q25-2 50 0l-5 17q-20 8-40 0Z" fill="#6b9fff" stroke="#293747" stroke-width="2.5"/><path d="M39 72 31 67m58 5 8-5m-48 8v8m14-10v10m14-10v10" fill="none" stroke="#f8fafc" stroke-opacity=".78" stroke-width="2" stroke-linecap="round"/>';
  if (id === 'domino-mask') return '<path d="M38 53q26-12 52 0l-4 17q-22 7-44 0Z" fill="#a78bfa" stroke="#293747" stroke-width="2.5"/><path d="M41 57q9-6 16 0m14 0q8-6 16 0" fill="none" stroke="#f0b84a" stroke-width="2.5" stroke-linecap="round"/><circle cx="64" cy="59" r="2.5" fill="#f8fafc"/>';
  if (id === 'masquerade-mask') return '<path d="M37 53q12-11 27-3 15-8 27 3l-5 14q-9 8-22-2-13 10-22 2Z" fill="#8b5cf6" stroke="#293747" stroke-width="2.5"/><path d="M41 57q8-5 15 0m16 0q7-5 15 0M64 50l3-8 5 8" fill="none" stroke="#f0b84a" stroke-width="2.5" stroke-linecap="round"/>';
  if (id === 'face-paint-stars') return '<path d="m42 72 2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1Zm39-3 2 4 5 1-4 3 1 5-4-2-4 2 1-5-4-3 5-1Z" fill="#f0b84a"/>';
  if (id === 'face-paint-stripe') return '<path d="M39 71q12-8 22-3m9 3q11-8 21-3" stroke="#f07070" stroke-width="4" stroke-linecap="round"/><path d="M42 78q8-4 13-2m18 2q8-4 13-2" stroke="#f0b84a" stroke-width="2.5" stroke-linecap="round"/>';
  if (id === 'freckles') return '<g fill="#a65324"><circle cx="43" cy="71" r="1.8"/><circle cx="49" cy="75" r="1.7"/><circle cx="55" cy="71" r="1.5"/><circle cx="73" cy="71" r="1.5"/><circle cx="79" cy="75" r="1.7"/><circle cx="85" cy="71" r="1.8"/></g>';
  if (id === 'scar') return '<path d="m77 69 9 8m-7-12 9 8" stroke="#b84e50" stroke-width="2.5" stroke-linecap="round"/>';
  if (id === 'whisker-paint') return '<g fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round"><path d="m44 76-10-3m10 7-10 1m50-5 10-3m-10 7 10 1"/></g>';
  if (id.startsWith('beard-') || id.startsWith('moustache')) {
    if (id.startsWith('moustache')) return `<path d="M48 77q8-8 16-2 8-6 16 2-4 8-11 4l-5-3-5 3q-7 4-11-4Z" fill="${a.hairColor}" stroke="#293747" stroke-width="1.5"/>`;
    if (id === 'beard-stubble') return '<g fill="#38251f" opacity=".55"><circle cx="46" cy="83" r="1.2"/><circle cx="52" cy="87" r="1.2"/><circle cx="59" cy="89" r="1.2"/><circle cx="69" cy="89" r="1.2"/><circle cx="76" cy="87" r="1.2"/><circle cx="82" cy="83" r="1.2"/></g>';
    const shape = id === 'beard-goatee' ? 'M56 78q8 3 16 0l-2 11q-3 7-6 8-4-2-6-8Z' : id === 'beard-viking' || id === 'beard-braided' || id === 'beard-long' ? 'M40 73q12 8 24 4 12 4 24-4l-4 31-20 13-20-13Z' : id === 'beard-full' ? 'M40 82q8 5 16 3 5-1 8 3 3-4 8-3 8 2 16-3l-3 10q-5 10-21 12-16-2-21-12Z' : id === 'beard-short' ? 'M48 78q7 4 13 1l3-2 3 2q6 3 13-1l-2 6q-2 6-7 8l-7 2-7-2q-5-2-7-8Z' : 'M42 75q10 6 18 3l4 4 4-4q8 3 18-3l-4 13q-18 12-36 0Z';
    if (id === 'beard-long' || id === 'beard-braided') return `<path d="${shape}" fill="${a.hairColor}" stroke="#293747" stroke-width="1.5"/><path d="M64 87q-4 9 0 24m-3-10 6 3m-6 4 6 3" fill="none" stroke="#f0b84a" stroke-width="2.3" stroke-linecap="round"/>`;
    if (id === 'beard-shadow') return '<path d="M43 77q21 11 42 0l-4 10q-17 9-34 0Z" fill="#38251f" opacity=".36"/>';
    if (id === 'moustache-pencil') return `<path d="M49 79q7-5 15-1 8-4 15 1-6 3-15 2-9 1-15-2Z" fill="${a.hairColor}"/>`;
    if (id === 'moustache-walrus') return `<path d="M48 75q8-5 16 1 8-6 16-1-1 15-9 15-4 0-7-10-3 10-7 10-8 0-9-15Z" fill="${a.hairColor}" stroke="#293747" stroke-width="1.5"/>`;
    return `<path d="${shape}" fill="${a.hairColor}" stroke="#293747" stroke-width="1.5"/>`;
  }
  if (id === 'earrings-hoop') return '<g fill="none" stroke="#f0b84a" stroke-width="3"><circle cx="34" cy="76" r="5"/><circle cx="94" cy="76" r="5"/></g>';
  if (id === 'earrings-stud') return '<g fill="#f0b84a" stroke="#fff" stroke-width="1.5"><circle cx="34" cy="73" r="3.5"/><circle cx="94" cy="73" r="3.5"/></g>';
  if (id === 'ear-cuff') return '<path d="M31 65q-5 14 4 22m62-22q5 14-4 22" fill="none" stroke="#a78bfa" stroke-width="4" stroke-linecap="round"/>';
  if (id === 'earrings-drop') return '<g fill="#a78bfa" stroke="#f8fafc" stroke-width="1.5"><path d="M33 73q-7 5 0 14 7-9 0-14Zm62 0q-7 5 0 14 7-9 0-14Z"/></g><circle cx="33" cy="72" r="2.5" fill="#f0b84a"/><circle cx="95" cy="72" r="2.5" fill="#f0b84a"/>';
  if (id === 'headphones' || id === 'headset' || id === 'earphones') return '<path d="M31 62V50q0-33 33-33t33 33v12" fill="none" stroke="#334155" stroke-width="7"/><rect x="25" y="56" width="14" height="24" rx="7" fill="#f07070" stroke="#293747" stroke-width="2"/><rect x="89" y="56" width="14" height="24" rx="7" fill="#6b9fff" stroke="#293747" stroke-width="2"/>';
  if (id === 'scarf') return '<path d="M42 84q22 16 44 0l-5 12q-17 10-34 0Z" fill="#d98232" stroke="#293747" stroke-width="1.8"/><path d="M46 88q18 12 36 0l-2 5q-16 9-32 0Z" fill="#f0b84a"/><path d="M49 95q7 5 14 5l-5 12-12-5q-2-7 3-12Z" fill="#e9a83d" stroke="#293747" stroke-width="1.6"/><path d="M47 98q5 4 11 5m-11-2 4 1m-5 2 3 1" fill="none" stroke="#ffd987" stroke-width="1.5" stroke-linecap="round"/>';
  if (id === 'bandana') return `<path d="m43 86 21 12 21-12 10 15-31 15-31-15Z" fill="#f07070" stroke="#293747" stroke-width="2"/><path d="m78 96 13 16-2-18" fill="#f07070" stroke="#293747" stroke-width="2"/>`;
  if (id === 'tie' || id === 'bowtie') return id === 'tie' ? '<path d="m56 91 8 5 8-5-3 9 6 24H57l6-24Z" fill="#f07070" stroke="#293747" stroke-width="2"/>' : '<path d="m64 98-16-9 2 18 14-6 14 6 2-18Z" fill="#f07070" stroke="#293747" stroke-width="2"/><circle cx="64" cy="99" r="4" fill="#f0b84a"/>';
  if (id === 'necklace-star' || id === 'necklace-pearl' || id === 'necklace-moon') return `<path d="M45 89q19 18 38 0" fill="none" stroke="#f0b84a" stroke-width="2.5"/><circle cx="64" cy="104" r="${id === 'necklace-star' ? 5 : 4}" fill="${id === 'necklace-star' ? '#f0b84a' : '#f8fafc'}" stroke="#c28436" stroke-width="1.5"/>${id === 'necklace-moon' ? '<path d="M65 98a6 6 0 1 0 6 6 5 5 0 0 1-6-6Z" fill="#f0b84a"/>' : ''}`;
  if (id === 'choker') return '<path d="M47 91q17 8 34 0l-2 7q-15 6-30 0Z" fill="#f472b6" stroke="#293747" stroke-width="2"/><circle cx="64" cy="98" r="2.5" fill="#f0b84a"/>';
  if (id === 'neck-ribbon') return '<path d="M46 90q18 11 36 0l-3 10-12 8-3-7-3 7-12-8Z" fill="#f07070" stroke="#293747" stroke-width="2"/><circle cx="64" cy="99" r="3" fill="#f0b84a"/>';
  if (id === 'backpack') return '<path d="M31 96q0-13 12-13h42q12 0 12 13v28H31Z" fill="#f07070" stroke="#293747" stroke-width="3"/><path d="M43 91q-10 4-10 17m52-17q10 4 10 17" fill="none" stroke="#f0b84a" stroke-width="4"/><path d="M44 103h40v16H44Z" fill="#f0b84a" stroke="#293747" stroke-width="2"/><path d="M62 104v14" stroke="#293747" stroke-width="2"/>';
  if (id === 'wings') return '<path d="M44 85Q6 42 11 77q4 26 36 29m37-21q38-43 33-8-4 26-36 29" fill="#a7f3d0" fill-opacity=".85" stroke="#f8fafc" stroke-width="3"/><path d="M42 93Q19 71 17 80m69 13q23-22 25-13" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="3"/>';
  if (id === 'magic-aura') return '<ellipse cx="64" cy="67" rx="49" ry="57" fill="none" stroke="#a78bfa" stroke-width="3" stroke-dasharray="5 6" opacity=".8"/><circle cx="21" cy="63" r="4" fill="#f0b84a"/><circle cx="106" cy="82" r="3" fill="#e879a9"/>';
  if (id === 'sparkle-orbit') return '<ellipse cx="64" cy="64" rx="53" ry="31" fill="none" stroke="#f0b84a" stroke-width="2" stroke-dasharray="2 8"/><path d="m25 44 3 6 7 1-5 4 1 7-6-3-6 3 1-7-5-4 7-1Zm72 33 2 5 6 1-4 4 1 6-5-3-5 3 1-6-4-4 6-1Z" fill="#f0b84a"/>';
  if (id === 'star-pin' || id === 'medal' || id === 'patch' || id === 'shell') return id === 'shell' ? '<path d="M79 87q-2-22 15-24 12 17-2 30l-13-6Z" fill="#f8fafc" stroke="#6b9fff" stroke-width="3"/><path d="m80 87 10-21m-6 22 12-13" stroke="#6b9fff" stroke-width="2"/>' : `<path d="m85 85 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="${id === 'medal' ? '#f0b84a' : accent}" stroke="#fff" stroke-width="2"/>`;
  if (id === 'bow') return '<path d="M50 34q-18-18-20-2 0 13 20 10m28-8q18-18 20-2 0 13-20 10" fill="#f472b6" stroke="#fff" stroke-width="2"/><circle cx="64" cy="39" r="6" fill="#f0b84a"/>';
  if (id === 'flower') return '<g fill="#f472b6"><circle cx="64" cy="24" r="6"/><circle cx="54" cy="31" r="6"/><circle cx="74" cy="31" r="6"/><circle cx="58" cy="42" r="6"/><circle cx="70" cy="42" r="6"/></g><circle cx="64" cy="33" r="5" fill="#f0b84a"/>';
  if (id === 'flower-barrette') return '<g fill="#f472b6" stroke="#fff" stroke-width="1.5"><circle cx="81" cy="32" r="5"/><circle cx="89" cy="37" r="5"/><circle cx="81" cy="42" r="5"/></g><circle cx="84" cy="37" r="3" fill="#f0b84a"/><path d="M78 47h17" stroke="#f0b84a" stroke-width="2"/>';
  if (id === 'leaf') return '<path d="M80 42q3-18 22-20-2 19-22 20Zm2-1 13-13" fill="#4fd1a5" stroke="#fff" stroke-width="2"/>';
  if (headwear[id]) return headwear[id];
  const accessory = AVATAR_ACCESSORIES.find((item) => item.id === id);
  if (accessory?.hairStyle) {
    const hairColor = accessory.id.startsWith('wig-') ? (accessory.hairColor || a.hairColor) : a.hairColor;
    return illustratedHairOverlay(accessory.hairStyle, hairColor);
  }
  if (id.startsWith('wig-')) {
    const wigColor = id === 'wig-rainbow' ? '#e879a9' : id === 'wig-copper' ? '#a65324' : id === 'wig-mohawk' ? '#f07070' : '#211814';
    return illustratedHairOverlay(id === 'wig-afro' ? 'coily' : id === 'wig-braids' ? 'braids' : id === 'wig-mohawk' ? 'mohawk' : id === 'wig-copper' ? 'long' : 'curly', wigColor);
  }
  return '';
}

const EDITABLE_ACCESSORY_FIT = {
  eyewear: { targetX: 64, targetY: 59, scaleX: 25 / 26, scaleY: .91 },
  beard: { targetX: 64, targetY: 83, scaleX: .94, scaleY: .74 },
  neckwear: { y: 8, scaleX: 1.03, scaleY: .88 },
  necklace: { y: 7 },
};

function accessoryTransform(item, fit) {
  const { x: ax, y: ay } = item.anchor;
  const { x: px, y: py } = item.position;
  const { x, y, scaleX, scaleY, rotation } = fit;
  return `translate(${x + px} ${y + py}) rotate(${rotation}) scale(${scaleX} ${scaleY}) translate(${-ax} ${-ay})`;
}

function fittedHeadwear(a, illustrated) {
  const id = a.accessories.find((accessory) => FITTED_HEADWEAR.has(accessory));
  if (!id) return null;
  const fit = illustrated
    ? AVATAR_CHARACTER_ACCESSORY_FIT[a.character]?.headwear
    : { targetX: 64, targetY: 42, width: a.faceShape === 'round' || a.appearance === 'masculine' ? 88 : 83, rotation: 0 };
  if (!fit) return null;
  const { targetX: x, targetY: y, width, rotation } = fit;
  const scaleX = width / 80;
  const offsetY = illustrated ? Math.max(0, 29 - y) : 0;
  const scaleY = Math.min(scaleX, (y + offsetY - 3) / 34);
  const item = AVATAR_ACCESSORIES.find((entry) => entry.id === id);
  return { id, offsetY, transform: accessoryTransform(item, { x, y, scaleX, scaleY, rotation }) };
}

function accessoryMarkup(a, { illustrated, headwear, crownClipId, behind = false }) {
  const items = (a.accessories || []).map((id) => AVATAR_ACCESSORIES.find((item) => item.id === id))
    .filter((item) => !illustrated || item.id !== 'beard-full' || AVATAR_CHARACTER_ACCESSORY_FIT[a.character]?.['beard-full'])
    .filter((item) => (item.renderStage === 'behind') === behind)
    .sort((left, right) => left.layer - right.layer || left.id.localeCompare(right.id));
  return items.map((item) => {
    const target = (illustrated && AVATAR_CHARACTER_ANCHORS[a.character]?.[item.anchorKey]) || item.anchor;
    const portraitFit = AVATAR_CHARACTER_ACCESSORY_FIT[a.character];
    const fit = (illustrated
      ? portraitFit?.[item.id] || (item.slot === 'headwear' ? null : portraitFit?.[item.slot])
      : EDITABLE_ACCESSORY_FIT[item.slot]) || {};
    const transform = headwear?.id === item.id ? headwear.transform : accessoryTransform(item, {
      x: fit.targetX ?? (target.x + (fit.x || 0)),
      y: fit.targetY ?? (target.y + (fit.y || 0)),
      scaleX: fit.scaleX ?? item.scale,
      scaleY: fit.scaleY ?? item.scale,
      rotation: item.rotation + (fit.rotation || 0),
    });
    const layer = `<g data-accessory="${item.id}" data-anchor="${item.anchorKey}" data-layer="${item.layer}" transform="${transform}">${accessoryLayer(item.id, a)}</g>`;
    return crownClipId && item.slot === 'hair' ? `<g clip-path="url(#${crownClipId})">${layer}</g>` : layer;
  }).join('');
}

export function avatarAccessoryMarkup(accessoryId) {
  const item = AVATAR_ACCESSORIES.find(({ id }) => id === accessoryId);
  if (!item) return '';
  const previewAvatar = { ...DEFAULT_AVATAR, hairColor: item.hairColor || DEFAULT_AVATAR.hairColor };
  const { x, y } = item.anchor;
  const viewBox = `${x - 35} ${y - 35} 70 70`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" aria-hidden="true" focusable="false" class="avatar-accessory-art"><g transform="translate(${item.position.x} ${item.position.y}) translate(${x} ${y}) rotate(${item.rotation}) scale(${item.scale}) translate(${-x} ${-y})">${accessoryLayer(item.id, previewAvatar)}</g></svg>`;
}

function illustratedPortraitMarkup(artwork) {
  const [x, y, width, height] = artwork.viewBox.split(' ').map(Number);
  const cellWidth = artwork.width / 2;
  const cellHeight = artwork.height / 2;
  const cellX = x + width / 2 >= cellWidth ? cellWidth : 0;
  const cellY = y + height / 2 >= cellHeight ? cellHeight : 0;
  const cell = `${cellX} ${cellY} ${cellWidth} ${cellHeight}`;
  return `<svg width="128" height="128" viewBox="${artwork.viewBox}" preserveAspectRatio="none" aria-hidden="true"><svg x="${cellX}" y="${cellY}" width="${cellWidth}" height="${cellHeight}" viewBox="${cell}" overflow="hidden"><image href="${artwork.src}" width="${artwork.width}" height="${artwork.height}"/></svg></svg>`;
}

function renderSvg(a, color) {
  const uniqueId = `finpro-avatar-${++gradientIndex}`;
  const custom = a.style === 'custom';
  const artwork = custom ? null : AVATAR_ARTWORKS[a.character];
  const illustrated = Boolean(artwork);
  const headwear = fittedHeadwear(a, illustrated);
  const background = custom
    ? `<radialGradient id="${uniqueId}" cx=".37" cy=".33" r=".84"><stop stop-color="${color}" stop-opacity=".52"/><stop offset=".6" stop-color="${color}" stop-opacity=".21"/><stop offset="1" stop-color="#171823" stop-opacity=".47"/></radialGradient>`
    : `<linearGradient id="${uniqueId}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${color}" stop-opacity=".34"/><stop offset="1" stop-color="${color}" stop-opacity=".08"/></linearGradient>`;
  const characterArt = artwork
    ? illustratedPortraitMarkup(artwork)
    : editablePortrait(a, SKIN[a.skin], uniqueId);
  // El borde del recorte usa la misma posición, inclinación y escala que
  // el ala. El cabello visible cae por debajo del sombrero.
  const crownClipId = headwear ? `${uniqueId}-crown` : null;
  const crownClip = headwear ? `<clipPath id="${crownClipId}"><path d="M-128 42h384v512h-384Z" transform="${headwear.transform}"/></clipPath>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" role="img" aria-label="${esc(a.label || 'Avatar familiar')}" class="avatar-art${custom ? ' avatar-art-editable' : ''}">
    <defs>${background}${crownClip}</defs>
    <circle cx="64" cy="64" r="64" fill="url(#${uniqueId})"/>
    <g${headwear?.offsetY ? ` transform="translate(0 ${headwear.offsetY})"` : ''}>
      ${accessoryMarkup(a, { illustrated, behind: true })}
      ${headwear ? `<g clip-path="url(#${crownClipId})">${characterArt}</g>` : characterArt}
      ${accessoryMarkup(a, { illustrated, headwear, crownClipId })}
    </g>
  </svg>`;
}

export function normalizeAvatar(value) { return safe(value); }

export function avatarMarkup(value, { size = 52, label = 'Avatar familiar', background = '#4fd1a5' } = {}) {
  const a = safe(value);
  const color = /^#[0-9a-f]{6}$/i.test(background) ? background : '#4fd1a5';
  const svg = renderSvg({ ...a, label }, color);
  return raw(`<span class="avatar-visual" style="width:${size}px;height:${size}px" aria-label="${esc(label)}">${svg}</span>`);
}
