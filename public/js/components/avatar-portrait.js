// Los peinados se apilan alrededor del rostro. Cada silueta tiene su propia
// dirección de mechones, y los detalles se recortan al volumen del cabello.
const HAIRSTYLES = {
  short: {
    crown: 'M36 58C29 49 28 37 33 27 37 18 46 16 49 10c3 5 8 3 14 2 16-4 30 3 34 15 4 9 3 22-4 32l-4-16c-2-11-10-17-20-18-6 11-18 16-29 18Z',
    locks: 'M31 42C35 23 50 25 58 15M33 48c7-14 27-13 35-31m-5 13c8-8 16-10 24-5m-12 3c10 3 16 11 17 21m-54-9c6-10 17-9 22-17',
  },
  long: {
    back: 'M32 34C36 15 48 10 65 12c23-2 34 14 34 35 0 30 2 47 17 67-21 6-38-1-52-12-16 12-37 19-53 9 14-17 13-41 21-77Z',
    crown: 'M31 61c-4-25 3-43 19-47 7-4 14-4 19-1 18-3 30 12 31 29l-7 30-5-22C82 43 72 32 69 22c-2 12-11 21-27 29l-5 20Z',
    sides: 'M38 48c-8 13-6 29-10 44-2 9-6 15-10 20 17 0 23-11 25-25 1-11-4-22-3-32Zm54-2c8 15 5 26 7 39 3 13 8 19 13 24-17 0-23-10-24-22-1-13 3-25 0-35Z',
    locks: 'M34 51c5-22 15-26 29-35m7 1c3 12 17 18 22 35M35 58c-5 14-1 38-13 52m16-41c3 16-3 32-10 38m65-53c5 14 1 38 14 53m-15-32c-1 14 3 25 11 30',
  },
  curly: {
    crown: 'M32 61c-8-1-11-10-6-15-8-5-4-14 2-16-2-7 4-14 10-13 0-8 10-12 16-7 5-6 14-6 19-1 6-5 15-2 16 4 9-2 15 4 14 11 8 3 11 10 7 16 6 7 3 15-4 18 0 8-7 14-14 12-1-11 0-19-4-25-8 4-13 1-17-5-5 6-14 9-22 4-4 6-9 9-14 6Z',
    locks: 'M28 44c-5-7 6-13 10-6s-5 9-7 4m6-14c-5-7 7-14 12-7s-2 11-7 8m11-8c-4-10 11-14 15-7 3 7-5 10-9 6m15-2c2-7 13-9 17-1 2 6-5 9-9 6m13 3c8-4 15 6 9 11-4 3-8 1-8-2m3 13c8-4 13 6 7 11m-59-16c-3-7 5-13 12-9m10-6c5 5 14 7 20 2',
  },
  coily: {
    crown: 'M30 65 25 61 24 55 20 51 22 44 19 39 23 33 22 27 28 22 29 16 36 15 40 9 47 10 52 6 58 7 65 4 71 7 77 5 83 9 90 9 94 14 100 16 101 22 107 26 106 33 111 38 109 44 112 50 108 55 107 62 100 67 95 66c-2-10-1-18-8-25-6 4-16 1-23-3-6 4-15 5-22 4-5 7-5 15-7 22Z',
    locks: 'M30 33q5-8 12-6m-13 15q-4 5 1 9m9-12q3-7 8-5m0-14q4-7 10-4m-5 13q4-6 10-4m0-12q6-4 10 0m-7 7q7 1 9 6m1-8q7-5 11 1m-4 10q5-5 10 1m-1-9q7 0 8 6m-4 8q6 0 7 7m-3 4q5 1 4 7',
  },
  bob: {
    back: 'M26 48C25 22 43 13 63 13c22-3 42 11 40 39l4 36c-17 9-25 3-40-2-15 4-31 9-44 2Z',
    crown: 'M27 66C21 45 26 25 42 17c12-7 32-8 46 0 14 8 19 28 12 43l-9-9C83 45 75 39 69 23c-4 15-16 23-29 26l-3 18Z',
    sides: 'M27 47c-2 14-5 29-5 40 7 5 14 6 23 3-8-10-9-27-6-43Zm72 0c4 13 5 27 7 39-6 5-13 7-22 5 8-13 10-27 7-40Z',
    locks: 'M30 49c5-14 20-16 29-31m4-2C52 39 35 38 33 61l-4 27m44-71c4 15 18 19 22 33l5 36',
  },
  buzz: {
    crown: 'M34 56C30 38 35 23 48 18c10-4 23-5 34 0 10 4 16 16 15 36l-5 2-4-12c-4-2-5-8-7-10-7 3-22 4-36 0-1 4-2 7-5 10l-2 13Z',
    locks: 'M41 31l2-3m5-3 2-2m4 6 2-3m4-5 2-2m6 6 2-3m5 7 2-3m3-3 2-2m3 9 2-2m2 6 2-1m-52 5 2-2m4-3 2-2',
  },
  bald: {},
  ponytail: {
    back: 'M81 29c6-15 22-13 27 1 9 18 1 35 2 52 0 13 5 20 10 28-19-1-30-14-29-33 3-23 11-38-1-43Z',
    crown: 'M34 66C22 33 42 13 67 13c24 0 37 23 26 53l-6-17c0-8-4-13-10-18-9 9-24 12-37 16l-3 19Z',
    locks: 'M34 50c6-19 25-16 41-30M38 38c8-11 23-12 30-18m11 3c9 5 15 14 14 28m8-19c8 16-4 35 1 57m-3-18c-1 15 6 28 13 33',
    band: 'M97 31q6 3 9 0',
  },
  braids: {
    back: 'M29 44q5-5 13-1l-4 23-8-2Zm69 0q-5-5-13-1l4 23 8-2Z',
    crown: 'M33 58c-7-19 0-34 14-42 8-4 13-3 19-2 10-3 21 2 27 12 4 7 6 20 2 33l-6-11C79 43 72 32 66 21c-6 12-17 21-27 27Z',
    sides: 'M36 48c-7 0-11 9-8 15-5 5-5 11-1 15-4 7-4 13 0 17-3 7-1 14 5 17l5 8 5-8c4-6 1-12-3-16 2-7 0-13-4-17 3-5 2-12-1-17l5-10Zm57-1c7 1 11 9 8 15 5 5 5 12 1 16 4 7 4 13 0 17 3 7 1 14-5 17l-5 8-5-8c-4-6-1-12 3-16-2-7 0-13 4-17-3-5-2-12 1-17l-5-10Z',
    locks: 'M37 40c11-4 20-13 23-21m10 0c6 11 13 15 21 20M30 57l6 6m-7 8 6 6m-6 7 7 6m-7 8 9 7m63-48-6 6m7 8-6 6m6 7-7 6m7 8-9 7',
    band: 'M32 111l9-2m47 0 9 2',
  },
  mohawk: {
    crown: 'M32 58c-1-16 5-26 17-33 3-9 9-18 21-23l-1 7 11-4-4 10 10-2-4 8 9 4c8 8 8 18 5 32l-7 2c0-11-5-17-13-19-12-4-21-3-29 1l-7 6-2 11Z',
    locks: 'M47 38c2-14 16-23 27-26m-19 23c6-9 15-12 24-14m-16 15c8-6 15-7 21-7m-46 14 3-5m51 3 2 5',
  },
  pigtails: {
    back: 'M36 33C21 27 13 41 15 59c2 13-5 25-10 36 18 0 28-15 26-32-1-10 1-17 9-19Zm57 0c15-6 23 8 21 26-2 13 5 25 10 36-18 0-28-15-26-32 1-10-1-17-9-19Z',
    crown: 'M34 60c-9-21-2-38 12-45 6-3 13-3 18-1 8-3 15-1 23 2 12 8 16 24 9 43l-8-12C75 39 68 32 65 21c-4 11-11 20-25 27Z',
    locks: 'M34 42c6-2 21-14 25-24m9-1c7 12 13 18 25 24M25 41c-9 15 0 33-16 51m21-47c-7 7-4 24-10 34m83-38c9 15 0 33 16 51m-21-47c7 7 4 24 10 34',
    band: 'M26 38l5 6m68 0 5-6',
  },
  'side-swept': {
    crown: 'M96 60c7-10 9-24 2-33-7-10-18-11-26-10-11-8-28-6-40 4-10 9-11 25-5 41 6-5 8-10 14-14 11-2 30-9 40-24 6 6 10 20 10 31Z',
    locks: 'M26 51c4-16 28-11 49-29M27 43c7-14 31-11 43-22m-39 11c7-10 21-13 35-12m16 5c8 8 13 18 14 27',
  },
  bun: {
    back: 'M43 24C38 14 48 3 59 4 69 0 80 10 80 19c2 9-8 15-19 15-9 1-15-3-18-10Z',
    crown: 'M33 61C22 36 41 15 63 16c24-3 41 17 33 45l-9-19c-9-5-17-9-23-18-7 8-16 14-24 21Z',
    locks: 'M47 17C51 8 62 7 68 9m-13 7c5-5 13-4 19 1M35 48c3-11 14-20 23-24m11-1c8 4 19 11 23 24',
  },
  'twin-buns': {
    back: 'M42 33c-13 3-21-5-20-14C23 7 35 4 44 10c8 6 10 20-2 23Zm44 0c13 3 21-5 20-14-1-12-13-15-22-9-8 6-10 20 2 23Z',
    crown: 'M33 58C26 39 39 17 63 17c21-3 43 18 33 42l-9-13C75 38 69 30 65 22c-5 9-14 17-26 24Z',
    locks: 'M27 21c-2-10 11-12 16-6m-14 9c4-7 11-8 16-5m56 2c2-10-11-12-16-6m14 9c-4-7-11-8-16-5M37 41c7-4 17-10 22-17m11 0c6 8 13 12 21 17',
  },
  'wavy-bob': {
    back: 'M28 33C33 16 51 11 65 13c21-3 38 12 37 36-1 16 2 31 11 40-8 7-22 10-36 1-9-5-18-4-24 1-12 8-31 1-37-6 12-9 8-35 12-52Z',
    crown: 'M31 61C23 42 27 25 42 17c16-8 32-6 44 2 15 10 21 29 11 45l-9-15c-13 0-22-12-23-27-6 14-16 27-27 27Z',
    sides: 'M31 43c-9 10-3 21-6 33-2 5-4 9-9 11 13 7 24-1 23-11-1-7-4-13 1-26Zm64 4c12 5 5 16 8 25 1 6 5 12 10 15-13 7-25-1-24-10 1-7 5-16-1-23Z',
    locks: 'M33 42c4-13 17-12 26-25m10 2c1 12 16 16 22 24M33 51c-9 10 6 28-12 35m77-32c6 9-6 24 10 33',
  },
  fringe: {
    crown: 'M33 65C20 58 24 34 34 22c14-16 35-17 52-8 15 8 21 27 15 46l-7 8-5-21-9 5-4-7-10 8-7-8-13 6-5-5Z',
    locks: 'M31 49c1-14 11-25 20-30m-12 23c9-9 13-14 19-25m-9 30c8-10 13-17 14-29m0 29c7-10 8-18 6-29m7 27c3-11 1-19-1-25m15 22c-1-9-5-16-9-20',
  },
  undercut: {
    crown: 'M35 63c-9-9-11-20-6-32 2-7 6-8 7-16l7 4 1-10 9 5 11-7 8 4c14-1 28 7 31 19 2 10-3 22-8 29l-6-15 2-14c-18 3-32 2-43 9l-8 10-2 13Z',
    locks: 'M29 40c12-13 24-19 42-22m-38 8c9-6 25-9 32-13m-25 23c17-11 33-13 51-13m-57 28 4-4m-3 10 3-4m57-14 2-3m-3 10 2-3',
  },
};

const HEADS = {
  soft: 'M36 48c0-19 12-30 28-30 18 0 29 12 29 30l-2 22c-2 10-8 16-18 22-6 4-15 3-21-1-12-8-16-16-16-28Z',
  oval: 'M39 47c0-20 10-31 25-31 17 0 27 12 27 32l-1 20c-1 10-7 18-16 25-7 5-13 5-20 0-11-8-15-18-15-28Z',
  round: 'M33 49c0-20 13-31 31-31 19 0 33 13 33 35l-1 15c-3 13-17 23-32 25-16-1-29-11-31-26Z',
  angular: 'M35 47c0-18 13-29 29-29 18 0 30 11 30 29l-1 23-8 16-15 8H57l-15-9-7-18Z',
};

const MOUTHS = {
  smile: ['M54 77q5 0 10 1 6 0 12-3-6 10-12 9-7 0-10-7Z', 'M56 78q8 3 17-1-4 4-10 4-4 0-7-3Z'],
  neutral: ['M56 79q5-3 8-2 4-1 8 1-4 4-8 4t-8-3Z', ''],
  open: ['M56 77q8-4 16 0 0 9-8 9t-8-9Z', 'M58 77q6-2 12 0l-1 2H59Z'],
  grin: ['M52 75q12 5 24-2-1 12-12 13-9 0-12-11Z', 'M54 76q9 3 20-1-1 4-8 5-8 1-12-4Z'],
  surprised: ['M59 78q0-6 5-6t5 6q0 8-5 8t-5-8Z', ''],
  smirk: ['M55 79q10 1 18-6-2 8-10 10-5 0-8-4Z', 'M57 79q9 0 14-4-4 5-10 5Z'],
  pout: ['M56 79q4-4 8-2 4-3 8 1-2 6-8 6-5 0-8-5Z', ''],
};

const EYES = {
  almond: 'M-8 0Q0-7 8-1 2 5-3 3-6 2-8 0Z',
  round: 'M-8 0c4-9 12-8 16 0-3 6-12 6-16 0Z',
  sleepy: 'M-8 0Q-1-4 8-1 2 5-3 3-6 2-8 0Z',
  starry: 'M-8 0C-5-7 4-8 8-1 5 6-5 6-8 0Z',
  wink: 'M-8 0Q0-7 8-1 2 5-3 3-6 2-8 0Z',
};

const BROWS = {
  soft: 'M-8 0q7-6 15-2-6-2-14 3Z',
  straight: 'M-8-1Q0-4 8-2l-1 2Q0-2-8 1Z',
  arched: 'M-8 0q7-10 16-2-7-5-15 3Z',
};

function mix(hex, target, amount) {
  const color = parseInt(hex.slice(1), 16);
  const end = parseInt(target.slice(1), 16);
  const channel = (shift) => {
    const from = (color >> shift) & 255;
    return Math.round(from + (((end >> shift) & 255) - from) * amount).toString(16).padStart(2, '0');
  };
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

function hairMarkup(hair, id, color, accent) {
  const light = mix(color, '#ffd4ad', .4);
  const dark = mix(color, '#1b1324', .52);
  const front = [hair.crown, hair.sides].filter(Boolean).join(' ');
  const texture = (part) => `<g fill="none" stroke-linecap="round" clip-path="url(#${id}-${part})">
    <path d="${hair.locks}" transform="translate(.75 1)" stroke="${dark}" stroke-width="1.7" opacity=".72"/>
    <path d="${hair.locks}" stroke="${light}" stroke-width=".76" opacity=".61"/>
    <path d="${hair.locks}" transform="translate(-1.4 -1.55)" stroke="${light}" stroke-width=".36" opacity=".35"/>
  </g>`;
  return {
    defs: front ? `<linearGradient id="${id}-hair" x2=".85" y2=".92"><stop stop-color="${light}"/><stop offset=".36" stop-color="${color}"/><stop offset=".8" stop-color="${dark}"/><stop offset="1" stop-color="${mix(dark, color, .28)}"/></linearGradient>
      <clipPath id="${id}-hair-front"><path d="${hair.crown}"/>${hair.sides ? `<path d="${hair.sides}"/>` : ''}</clipPath>
      ${hair.back ? `<clipPath id="${id}-hair-back"><path d="${hair.back}"/></clipPath>` : ''}` : '',
    back: hair.back ? `<g><path d="${hair.back}" fill="${dark}" stroke="${dark}" stroke-linejoin="round"/>${texture('hair-back')}</g>` : '',
    front: front ? `<g stroke-linejoin="round">
      <path d="${front}" fill="url(#${id}-hair)" stroke="${dark}" stroke-width=".85"/>
      ${texture('hair-front')}
      ${hair.band ? `<path d="${hair.band}" fill="none" stroke="${accent}" stroke-width="2.7" stroke-linecap="round"/>` : ''}
    </g>` : '',
  };
}

function eyesMarkup(a, skin, id) {
  const lash = mix(a.hairColor, '#2b1a26', .68);
  return [51.5, 76.5].map((x, i) => {
    const closed = a.eyes === 'happy' || (a.eyes === 'wink' && i === 1);
    const eye = EYES[a.eyes] || EYES.almond;
    const clip = `${id}-eye-${i}`;
    const iris = a.eyes === 'starry'
      ? '<path d="M0-2 .8-.6 2 0 .8.6 0 2-.8.6-2 0-.8-.6Z" fill="#fff4dc"/>'
      : '<circle r="1.55" cy="-.35" fill="#201820"/><circle cx="1.2" cy="-1.55" r=".85" fill="#fff7e8"/><circle cx="-1" cy="1.05" r=".4" fill="#fff7e8" opacity=".7"/>';
    return `<g transform="translate(${x} ${i ? 58.6 : 59.4}) scale(${i ? .93 : 1} 1)">
      <path d="M-9-2q7-9 18-2-8-3-15 3Z" fill="${mix(skin, '#69414b', .33)}" opacity=".65"/>
      ${closed ? `<path d="M-7 1q7-8 14-1" fill="none" stroke="${a.eyeColor}" stroke-width="1.65" stroke-linecap="round"/>`
        : `<clipPath id="${clip}"><path d="${eye}"/></clipPath>
          <path d="${eye}" fill="#f9e8d9" stroke="${lash}" stroke-width="1.1" stroke-linejoin="round"/>
          <g clip-path="url(#${clip})"><circle r="3.45" fill="${a.eyeColor}" stroke="${lash}" stroke-width=".65"/>${iris}</g>`}
      <path d="${BROWS[a.brows]}" transform="translate(0 -8)" fill="${lash}"/>
    </g>`;
  }).join('');
}

function wardrobe(a, id) {
  const fabric = `url(#${id}-fabric)`;
  const seam = mix(a.clothingColor, '#242136', .53);
  const trim = mix(a.clothingColor, '#fff1d5', .68);
  const body = '<path d="M5 128q5-18 15-24l31-12 13 4 13-4 31 12q10 6 15 24Z"/>';
  const collar = {
    tee: '<path d="M48 94q16 23 32 0-5 19-16 20-11-1-16-20Z"/>',
    shirt: '<path d="m48 93 16 11-11 11-11-17Zm32 0-16 11 11 11 11-17ZM64 106v24"/><circle cx="67" cy="119" r="1.3"/>',
    hoodie: '<path d="M48 90c4 8 10 11 17 12 7-3 12-6 15-12 12 5 19 13 14 16l-26 9-5-8-9 7-20-10c-4-3 3-11 14-14Z"/><path d="m56 106-3 15m21-15 5 14" fill="none" stroke-width="2"/>',
    sweater: '<path d="M45 97q19 24 38 0l3 2q-20 34-44 0Z"/><path d="m49 103-1 3m7 1-1 4m7-1v4m7-4v4m6-7 1 4m5-9 2 3" fill="none"/>',
    dress: '<path d="M45 94q19 22 38 0l6 5q-8 19-25 20-17-1-25-20Z"/><path d="M43 106q21 17 42 0m-25 11-2 13m10-13 2 13" fill="none"/>',
    suit: '<path d="m51 93 13 9 13-9 6 13-19 23-19-23Z"/><path d="m64 102-4 5 2 4-3 13 5 5 5-5-3-13 2-4Z" fill="#382a3c"/><path d="m45 97-8 9 8 4-5 4 16 15m27-32 8 9-8 4 5 4-16 15" fill="none"/>',
    cape: '<path d="m48 93-23 5-14 30h26l16-29m27-6 23 5 14 30H91L75 99"/><circle cx="49" cy="103" r="3"/><circle cx="79" cy="103" r="3"/><path d="M49 104q15 14 30 0" fill="none"/>',
    jacket: '<path d="m50 92 12 13v23m16-36-12 13v23M41 99l-6 20m52-20 6 20" fill="none" stroke-width="2.3"/><path d="M44 116h12m16 0h12" fill="none"/>',
    sport: '<path d="m30 100 9-3 9 31h-7Zm68 0-9-3-9 31h7ZM49 94q15 18 30 0l-3 8-12 12-12-12Z"/>',
    uniform: '<path d="m48 94 16 10-10 7-11-12Zm32 0-16 10 10 7 11-12ZM27 102l15-5 2 5-16 5Zm74 0-15-5-2 5 16 5Zm-36 2v24"/><path d="M74 114h12v5l-6 3-6-3Z"/>',
    armor: '<path d="m33 100 11-5 20 11 20-11 11 5-4 11-27 10-27-10Zm13 12 18 9 18-9-3 16H49Z"/><path d="m64 107 6 6-6 5-6-5Z" fill="#f4bd73"/><path d="m27 101-11 7 2 9 17-5m66-11 11 7-2 9-17-5"/>',
    robe: '<path d="m46 95 10-3 22 36H63Zm36 0-10-3-9 18 7 10Z"/><path d="M47 102l15 26m18-26-8 14" fill="none" stroke="#ddb47d"/>',
    overalls: '<path d="m39 97 8-3 5 16h24l5-16 8 3-5 31H44Z"/><circle cx="49" cy="111" r="2"/><circle cx="79" cy="111" r="2"/><path d="M56 115h16v7l-8 4-8-4Z" fill="none"/>',
    raincoat: '<path d="M44 94q-13 5-11 13l25 9 6-9 7 9 24-9q2-8-11-13-6 9-20 13-14-4-20-13Z"/><path d="M64 109v19m6-11h2m-2 6h2" fill="none" stroke-width="2"/>',
    blazer: '<path d="m50 94-13 11 7 5-3 6 18 12Zm28 0 13 11-7 5 3 6-18 12Z"/><path d="M76 117h13m-25-3q0 13-7 14" fill="none"/><circle cx="66" cy="124" r="1.5"/>',
  }[a.clothing];
  return `<g stroke-linejoin="round" stroke-linecap="round">
    <g fill="${fabric}" stroke="${seam}" stroke-width=".7">${body}</g>
    <path d="M12 124c10-16 28-18 37-24l-15 17-6 11Zm104 0c-10-16-24-16-34-24l12 17 6 11Z" fill="${trim}" opacity=".2"/>
    <path d="M29 110q-2 10 2 18m68-18q2 10-2 18M36 119l-2 9m58-9 2 9" stroke="${seam}" stroke-width=".9" opacity=".65" fill="none"/>
    <g fill="${mix(a.clothingColor, trim, .29)}" stroke="${seam}" stroke-width="1.1">${collar}</g>
  </g>`;
}

export function editablePortrait(a, skin, id) {
  const shadow = mix(skin, '#713f52', .49);
  const light = mix(skin, '#ffe9cb', .35);
  const lips = mix(skin, '#793a4c', .58);
  const hair = hairMarkup(HAIRSTYLES[a.hairStyle], id, a.hairColor, a.clothingColor);
  const [mouth, teeth] = MOUTHS[a.mouth];
  const width = { feminine: .96, masculine: 1.09, neutral: 1 }[a.appearance];
  const head = HEADS[a.faceShape];
  return `<g data-portrait="editable">
    <defs>
      <radialGradient id="${id}-face" cx=".37" cy=".33" r=".79"><stop stop-color="${light}"/><stop offset=".55" stop-color="${skin}"/><stop offset="1" stop-color="${shadow}"/></radialGradient>
      <linearGradient id="${id}-neck" x1=".15" y1=".9" x2=".8" y2=".1"><stop stop-color="${skin}"/><stop offset=".69" stop-color="${shadow}"/><stop offset="1" stop-color="${mix(shadow, '#372439', .35)}"/></linearGradient>
      <linearGradient id="${id}-fabric" x2=".85" y2="1"><stop stop-color="${mix(a.clothingColor, '#fff1d5', .35)}"/><stop offset=".45" stop-color="${a.clothingColor}"/><stop offset="1" stop-color="${mix(a.clothingColor, '#252237', .65)}"/></linearGradient>
      <radialGradient id="${id}-cheek"><stop stop-color="${mix(skin, '#ba4d61', .66)}" stop-opacity=".61"/><stop offset="1" stop-color="${skin}" stop-opacity="0"/></radialGradient>
      ${hair.defs}
    </defs>
    ${hair.back}
    <path d="M51 79q2 11-2 15l-4 4q9 12 19 11 12-2 19-11l-6-5q-5-7-2-15Z" fill="url(#${id}-neck)"/>
    ${wardrobe(a, id)}
    <g transform="translate(64) scale(${width} 1) translate(-64)">
      <path d="M38 55c-11-6-13 5-7 14l8 4m52-19c10-7 14 5 8 14l-8 5" fill="url(#${id}-neck)" stroke="${shadow}" stroke-width=".8"/>
      <path d="M33 59q-3 3 2 8m61-8q3 3-2 8" fill="none" stroke="${shadow}" stroke-width="1.15" stroke-linecap="round"/>
      <path d="${head}" fill="url(#${id}-face)" stroke="${shadow}" stroke-width=".55"/>
      <path d="M38 50q-1-13 7-21m-4 44q3 7 10 12" fill="none" stroke="${light}" stroke-width="1.5" opacity=".72" stroke-linecap="round"/>
    </g>
    <ellipse cx="46" cy="70" rx="8.1" ry="5.2" fill="url(#${id}-cheek)"/>
    <ellipse cx="82" cy="69" rx="8.4" ry="5.4" fill="url(#${id}-cheek)"/>
    ${eyesMarkup(a, skin, id)}
    <path d="M63 59q0 6-3 10 0 4 6 4l4-3q-4-2-5-11Z" fill="${shadow}" opacity=".37"/>
    <path d="M63 62q0 4-1.8 6m.2 1.6q1.8 1.2 4 .5" stroke="${light}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <path d="M60 70q1 2 3 1m3 0q2 0 3-2" fill="none" stroke="${shadow}" stroke-width=".8" stroke-linecap="round"/>
    <path d="${mouth}" fill="${lips}" stroke="${shadow}" stroke-width=".55"/>
    ${teeth ? `<path d="${teeth}" fill="#ffece1"/>` : ''}
    <path d="M61 87q3 1 6 0" stroke="${light}" stroke-width="1.1" opacity=".7" fill="none" stroke-linecap="round"/>
    ${hair.front}
  </g>`;
}
