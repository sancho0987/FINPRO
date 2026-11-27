// Catálogo de personajes vectoriales originales. Cada preset define silueta,
// rostro y vestuario; las categorías solo organizan la selección.
export const AVATAR_CATALOG = [
  { id: 'luna', name: 'Luna', category: 'popular', kind: 'human', avatar: { appearance: 'feminine', skin: 'fair', hairStyle: 'long', hairColor: '#38251f', eyes: 'happy', mouth: 'smile', clothing: 'sweater', clothingColor: '#a78bfa', accessory: 'star-pin' } },
  { id: 'mateo', name: 'Mateo', category: 'popular', kind: 'human', avatar: { appearance: 'masculine', skin: 'tan', hairStyle: 'curly', hairColor: '#211814', eyes: 'round', clothing: 'hoodie', clothingColor: '#6b9fff', accessory: 'glasses' } },
  { id: 'kiwi', name: 'Kiwi', category: 'popular', kind: 'bird', avatar: { skin: 'deep', hairColor: '#4fd1a5', clothing: 'sweater', clothingColor: '#f0b84a', accessory: 'none' } },
  { id: 'michi', name: 'Michi', category: 'popular', kind: 'cat', avatar: { skin: 'fair', hairColor: '#e879a9', clothing: 'hoodie', clothingColor: '#f472b6', eyes: 'round', accessory: 'bow' } },
  { id: 'cosmo', name: 'Cosmo', category: 'popular', kind: 'alien', avatar: { skin: 'medium', hairColor: '#a78bfa', clothing: 'tee', clothingColor: '#4fd1a5', eyes: 'round' } },
  { id: 'pixel', name: 'Pixel', category: 'popular', kind: 'robot', avatar: { skin: 'light', hairColor: '#6b9fff', clothing: 'hoodie', clothingColor: '#334155', eyes: 'round', accessory: 'none' } },
  { id: 'zuri', name: 'Zuri', category: 'popular', kind: 'human', avatar: { appearance: 'feminine', skin: 'deep', hairStyle: 'coily', hairColor: '#211814', clothing: 'shirt', clothingColor: '#f07070', accessory: 'round-glasses' } },
  { id: 'bruno', name: 'Bruno', category: 'popular', kind: 'bear', avatar: { skin: 'tan', hairColor: '#38251f', clothing: 'sweater', clothingColor: '#4fd1a5', accessory: 'scarf' } },

  { id: 'ines', name: 'Inés', category: 'human', kind: 'human', avatar: { appearance: 'feminine', skin: 'light', hairStyle: 'bob', hairColor: '#a65324', eyes: 'round', clothing: 'shirt', clothingColor: '#f0b84a', accessory: 'glasses' } },
  { id: 'diego', name: 'Diego', category: 'human', kind: 'human', avatar: { appearance: 'masculine', skin: 'brown', hairStyle: 'buzz', hairColor: '#211814', eyes: 'almond', clothing: 'hoodie', clothingColor: '#334155', accessory: 'cap' } },
  { id: 'amara', name: 'Amara', category: 'human', kind: 'human', avatar: { appearance: 'feminine', skin: 'deep', hairStyle: 'long', hairColor: '#211814', brows: 'arched', clothing: 'sweater', clothingColor: '#f472b6', accessory: 'star-pin' } },
  { id: 'tomas', name: 'Tomás', category: 'human', kind: 'human', avatar: { appearance: 'masculine', skin: 'fair', hairStyle: 'curly', hairColor: '#e0b85b', eyes: 'happy', clothing: 'shirt', clothingColor: '#6b9fff', accessory: 'none' } },
  { id: 'valentina', name: 'Valentina', category: 'human', kind: 'human', avatar: { appearance: 'feminine', skin: 'medium', hairStyle: 'coily', hairColor: '#38251f', clothing: 'hoodie', clothingColor: '#a78bfa', accessory: 'round-glasses' } },
  { id: 'kai', name: 'Kai', category: 'human', kind: 'human', avatar: { appearance: 'neutral', skin: 'tan', hairStyle: 'short', hairColor: '#8b5cf6', eyes: 'round', brows: 'straight', clothing: 'tee', clothingColor: '#f07070', accessory: 'beanie' } },
  { id: 'omar', name: 'Omar', category: 'human', kind: 'human', avatar: { appearance: 'masculine', skin: 'deep', hairStyle: 'short', hairColor: '#211814', eyes: 'happy', clothing: 'sweater', clothingColor: '#f0b84a', accessory: 'glasses' } },
  { id: 'zoe', name: 'Zoe', category: 'human', kind: 'human', avatar: { appearance: 'feminine', skin: 'fair', hairStyle: 'curly', hairColor: '#e879a9', eyes: 'round', mouth: 'open', clothing: 'tee', clothingColor: '#4fd1a5', accessory: 'bow' } },
  { id: 'rafa', name: 'Rafa', category: 'human', kind: 'human', avatar: { appearance: 'neutral', skin: 'brown', hairStyle: 'long', hairColor: '#211814', eyes: 'almond', clothing: 'shirt', clothingColor: '#f8fafc', accessory: 'scarf' } },
  { id: 'sofia', name: 'Sofía', category: 'human', kind: 'human', avatar: { appearance: 'feminine', skin: 'tan', hairStyle: 'short', hairColor: '#a65324', eyes: 'happy', clothing: 'sweater', clothingColor: '#6b9fff', accessory: 'headphones' } },

  { id: 'zorro', name: 'Chispa', category: 'animal', kind: 'fox', avatar: { skin: 'tan', hairColor: '#a65324', clothing: 'scarf', clothingColor: '#4fd1a5', eyes: 'happy' } },
  { id: 'conejo', name: 'Mora', category: 'animal', kind: 'rabbit', avatar: { skin: 'light', hairColor: '#e879a9', clothing: 'sweater', clothingColor: '#f0b84a', accessory: 'bow' } },
  { id: 'panda', name: 'Bambú', category: 'animal', kind: 'panda', avatar: { skin: 'light', hairColor: '#211814', clothing: 'hoodie', clothingColor: '#4fd1a5', accessory: 'scarf' } },
  { id: 'rana', name: 'Croac', category: 'animal', kind: 'frog', avatar: { skin: 'medium', hairColor: '#4fd1a5', clothing: 'tee', clothingColor: '#f0b84a', eyes: 'round', accessory: 'none' } },
  { id: 'buho', name: 'Pluma', category: 'animal', kind: 'owl', avatar: { skin: 'tan', hairColor: '#a65324', clothing: 'sweater', clothingColor: '#a78bfa', eyes: 'round', accessory: 'glasses' } },
  { id: 'tigre', name: 'Rayas', category: 'animal', kind: 'tiger', avatar: { skin: 'fair', hairColor: '#f07070', clothing: 'hoodie', clothingColor: '#334155', eyes: 'happy' } },
  { id: 'perro', name: 'Churro', category: 'animal', kind: 'dog', avatar: { skin: 'fair', hairColor: '#a65324', clothing: 'shirt', clothingColor: '#6b9fff', accessory: 'bandana' } },
  { id: 'pinguino', name: 'Pipo', category: 'animal', kind: 'penguin', avatar: { skin: 'light', hairColor: '#334155', clothing: 'sweater', clothingColor: '#f07070', accessory: 'beanie' } },
  { id: 'mapache', name: 'Rufi', category: 'animal', kind: 'raccoon', avatar: { skin: 'fair', hairColor: '#334155', clothing: 'hoodie', clothingColor: '#f0b84a', accessory: 'none' } },
  { id: 'koala', name: 'Euca', category: 'animal', kind: 'koala', avatar: { skin: 'light', hairColor: '#94a3b8', clothing: 'tee', clothingColor: '#a78bfa', accessory: 'leaf' } },
  { id: 'leon', name: 'Simba', category: 'animal', kind: 'lion', avatar: { skin: 'tan', hairColor: '#f0b84a', clothing: 'cape', clothingColor: '#f07070', eyes: 'happy' } },
  { id: 'tortuga', name: 'Lenta', category: 'animal', kind: 'turtle', avatar: { skin: 'medium', hairColor: '#4fd1a5', clothing: 'sweater', clothingColor: '#6b9fff', accessory: 'glasses' } },

  { id: 'dragon', name: 'Fuego', category: 'fantasy', kind: 'dragon', avatar: { skin: 'medium', hairColor: '#f07070', clothing: 'cape', clothingColor: '#334155', accessory: 'none', eyes: 'round' } },
  { id: 'unicornio', name: 'Nube', category: 'fantasy', kind: 'unicorn', avatar: { skin: 'fair', hairColor: '#e879a9', clothing: 'sweater', clothingColor: '#a78bfa', accessory: 'star-pin' } },
  { id: 'hada', name: 'Brisa', category: 'fantasy', kind: 'fairy', avatar: { skin: 'light', hairColor: '#4fd1a5', clothing: 'dress', clothingColor: '#f472b6', accessory: 'flower' } },
  { id: 'sirena', name: 'Marina', category: 'fantasy', kind: 'mermaid', avatar: { skin: 'brown', hairColor: '#6b9fff', clothing: 'dress', clothingColor: '#4fd1a5', accessory: 'shell' } },
  { id: 'fenix', name: 'Aurea', category: 'fantasy', kind: 'phoenix', avatar: { skin: 'fair', hairColor: '#f07070', clothing: 'cape', clothingColor: '#f0b84a', eyes: 'happy' } },
  { id: 'fantasma', name: 'Buu', category: 'fantasy', kind: 'ghost', avatar: { skin: 'light', hairColor: '#f8fafc', clothing: 'cape', clothingColor: '#6b9fff', eyes: 'round' } },
  { id: 'mago', name: 'Merlín', category: 'fantasy', kind: 'wizard', avatar: { skin: 'tan', hairColor: '#f8fafc', clothing: 'cape', clothingColor: '#334155', accessory: 'wizard-hat' } },
  { id: 'vampiro', name: 'Conde', category: 'fantasy', kind: 'vampire', avatar: { skin: 'fair', hairColor: '#211814', clothing: 'cape', clothingColor: '#f07070', eyes: 'happy' } },
  { id: 'slime', name: 'Gota', category: 'fantasy', kind: 'slime', avatar: { skin: 'medium', hairColor: '#4fd1a5', clothing: 'tee', clothingColor: '#a78bfa', eyes: 'round' } },
  { id: 'alien', name: 'Órbita', category: 'fantasy', kind: 'alien', avatar: { skin: 'deep', hairColor: '#a78bfa', clothing: 'hoodie', clothingColor: '#4fd1a5', accessory: 'antenna' } },

  { id: 'taco', name: 'Tacolín', category: 'fun', kind: 'taco', avatar: { skin: 'tan', hairColor: '#4fd1a5', clothing: 'sweater', clothingColor: '#f07070', eyes: 'round', mouth: 'open' } },
  { id: 'cactus', name: 'Pinchi', category: 'fun', kind: 'cactus', avatar: { skin: 'medium', hairColor: '#4fd1a5', clothing: 'cape', clothingColor: '#f0b84a', accessory: 'flower' } },
  { id: 'astronauta', name: 'Cometa', category: 'fun', kind: 'astronaut', avatar: { skin: 'brown', hairColor: '#38251f', clothing: 'suit', clothingColor: '#f8fafc', accessory: 'helmet' } },
  { id: 'pirata', name: 'Capitana', category: 'fun', kind: 'pirate', avatar: { appearance: 'feminine', skin: 'tan', hairStyle: 'long', hairColor: '#211814', clothing: 'shirt', clothingColor: '#334155', accessory: 'pirate-hat' } },
  { id: 'chef', name: 'Chefito', category: 'fun', kind: 'chef', avatar: { skin: 'fair', hairColor: '#38251f', clothing: 'suit', clothingColor: '#f8fafc', accessory: 'chef-hat' } },
  { id: 'disco', name: 'Brilli', category: 'fun', kind: 'human', avatar: { appearance: 'neutral', skin: 'medium', hairStyle: 'curly', hairColor: '#8b5cf6', clothing: 'suit', clothingColor: '#f0b84a', accessory: 'headphones' } },

  { id: 'ninja', name: 'Sombra', category: 'special', kind: 'ninja', avatar: { skin: 'deep', hairColor: '#211814', clothing: 'suit', clothingColor: '#334155', accessory: 'mask' } },
  { id: 'exploradora', name: 'Dora', category: 'special', kind: 'explorer', avatar: { appearance: 'feminine', skin: 'brown', hairStyle: 'short', hairColor: '#38251f', clothing: 'suit', clothingColor: '#4fd1a5', accessory: 'hat' } },
  { id: 'inventor', name: 'Voltio', category: 'special', kind: 'robot', avatar: { skin: 'light', hairColor: '#6b9fff', clothing: 'suit', clothingColor: '#f0b84a', accessory: 'glasses' } },
  { id: 'superheroina', name: 'Rayo', category: 'special', kind: 'hero', avatar: { appearance: 'feminine', skin: 'medium', hairStyle: 'long', hairColor: '#211814', clothing: 'cape', clothingColor: '#f07070', accessory: 'mask' } },
  { id: 'astronomo', name: 'Estelar', category: 'special', kind: 'human', avatar: { appearance: 'masculine', skin: 'deep', hairStyle: 'buzz', hairColor: '#211814', clothing: 'suit', clothingColor: '#334155', accessory: 'star-pin' } },
  { id: 'jardinera', name: 'Petunia', category: 'special', kind: 'human', avatar: { appearance: 'feminine', skin: 'fair', hairStyle: 'bob', hairColor: '#e0b85b', clothing: 'dress', clothingColor: '#4fd1a5', accessory: 'flower' } },

  { id: 'alma', name: 'Alma', category: 'human', kind: 'human', avatar: { appearance: 'feminine', skin: 'tan', hairStyle: 'ponytail', hairColor: '#211814', eyes: 'happy', clothing: 'jacket', clothingColor: '#f472b6' } },
  { id: 'lucas', name: 'Lucas', category: 'human', kind: 'human', avatar: { appearance: 'masculine', skin: 'brown', hairStyle: 'curly', hairColor: '#38251f', eyes: 'round', clothing: 'sport', clothingColor: '#6b9fff', accessory: 'glasses' } },
  { id: 'noor', name: 'Noor', category: 'human', kind: 'human', avatar: { appearance: 'neutral', skin: 'deep', hairStyle: 'braids', hairColor: '#211814', eyes: 'almond', clothing: 'overalls', clothingColor: '#4fd1a5' } },
  { id: 'inesa', name: 'Inesa', category: 'human', kind: 'human', avatar: { appearance: 'feminine', skin: 'light', hairStyle: 'bun', hairColor: '#a65324', eyes: 'happy', clothing: 'blazer', clothingColor: '#a78bfa' } },

  { id: 'ciervo', name: 'Bellota', category: 'animal', kind: 'deer', avatar: { skin: 'tan', hairColor: '#a65324', clothing: 'scarf', clothingColor: '#4fd1a5', eyes: 'almond' } },
  { id: 'tiburon', name: 'Azul', category: 'animal', kind: 'shark', avatar: { skin: 'light', hairColor: '#6b9fff', clothing: 'sport', clothingColor: '#f0b84a', eyes: 'round' } },
  { id: 'erizo', name: 'Púa', category: 'animal', kind: 'hedgehog', avatar: { skin: 'fair', hairColor: '#38251f', clothing: 'hoodie', clothingColor: '#e879a9', eyes: 'happy' } },
  { id: 'ajolote', name: 'Loti', category: 'animal', kind: 'axolotl', avatar: { skin: 'light', hairColor: '#e879a9', clothing: 'sweater', clothingColor: '#a78bfa', eyes: 'round' } },

  { id: 'polilla', name: 'Lúmina', category: 'fantasy', kind: 'moth', avatar: { skin: 'fair', hairColor: '#a78bfa', clothing: 'robe', clothingColor: '#334155', eyes: 'happy' } },
  { id: 'golem', name: 'Terrón', category: 'fantasy', kind: 'golem', avatar: { skin: 'brown', hairColor: '#4fd1a5', clothing: 'armor', clothingColor: '#94a3b8', eyes: 'round' } },
  { id: 'seta', name: 'Champi', category: 'fun', kind: 'mushroom', avatar: { skin: 'light', hairColor: '#f07070', clothing: 'cape', clothingColor: '#4fd1a5', eyes: 'happy' } },
  { id: 'nube', name: 'Algodón', category: 'fun', kind: 'cloud', avatar: { skin: 'light', hairColor: '#6b9fff', clothing: 'sweater', clothingColor: '#f0b84a', eyes: 'round' } },
];

export const AVATAR_CATEGORIES = [
  ['popular', 'Populares'], ['human', 'Humanos'], ['animal', 'Animales'],
  ['fantasy', 'Fantasía'], ['fun', 'Divertidos'], ['special', 'Especiales'],
];

// La nueva colección se integra por láminas raster originales. Cada retrato
// recorta una celda transparente de 2x2 sin alterar el JSON guardado por usuario.
export const AVATAR_ARTWORKS = Object.freeze({
  luna: { src: '/images/avatars/finpro-samples.png', width: 1254, height: 1254, viewBox: '-40 -80 707 707' },
  mateo: { src: '/images/avatars/finpro-samples.png', width: 1254, height: 1254, viewBox: '619 -80 707 707' },
  zoe: { src: '/images/avatars/finpro-samples.png', width: 1254, height: 1254, viewBox: '-40 619 707 707' },
  michi: { src: '/images/avatars/finpro-samples.png', width: 1254, height: 1254, viewBox: '568 457 707 707' },
  ines: { src: '/images/avatars/finpro-human-01.png', width: 1261, height: 1247, viewBox: '-40 -80 707 707' },
  diego: { src: '/images/avatars/finpro-human-01.png', width: 1261, height: 1247, viewBox: '622 -80 707 707' },
  amara: { src: '/images/avatars/finpro-human-01.png', width: 1261, height: 1247, viewBox: '-40 616 707 707' },
  tomas: { src: '/images/avatars/finpro-human-01.png', width: 1261, height: 1247, viewBox: '622 616 707 707' },
  valentina: { src: '/images/avatars/finpro-human-02.png', width: 1266, height: 1242, viewBox: '-40 -80 707 707' },
  kai: { src: '/images/avatars/finpro-human-02.png', width: 1266, height: 1242, viewBox: '625 -80 707 707' },
  omar: { src: '/images/avatars/finpro-human-02.png', width: 1266, height: 1242, viewBox: '-40 613 707 707' },
  rafa: { src: '/images/avatars/finpro-human-02.png', width: 1266, height: 1242, viewBox: '625 613 707 707' },
  sofia: { src: '/images/avatars/finpro-human-03.png', width: 1292, height: 1218, viewBox: '-40 -80 707 707' },
  alma: { src: '/images/avatars/finpro-human-03.png', width: 1292, height: 1218, viewBox: '638 -80 707 707' },
  lucas: { src: '/images/avatars/finpro-human-03.png', width: 1292, height: 1218, viewBox: '-40 601 707 707' },
  noor: { src: '/images/avatars/finpro-human-03.png', width: 1292, height: 1218, viewBox: '638 601 707 707' },
  kiwi: { src: '/images/avatars/finpro-animal-01.png', width: 1312, height: 1199, viewBox: '-40 -80 707 707' },
  bruno: { src: '/images/avatars/finpro-animal-01.png', width: 1312, height: 1199, viewBox: '648 -80 707 707' },
  zorro: { src: '/images/avatars/finpro-animal-01.png', width: 1312, height: 1199, viewBox: '-40 592 707 707' },
  conejo: { src: '/images/avatars/finpro-animal-01.png', width: 1312, height: 1199, viewBox: '648 592 707 707' },
  panda: { src: '/images/avatars/finpro-animal-02.png', width: 1254, height: 1254, viewBox: '-40 -80 707 707' },
  rana: { src: '/images/avatars/finpro-animal-02.png', width: 1254, height: 1254, viewBox: '619 -80 707 707' },
  buho: { src: '/images/avatars/finpro-animal-02.png', width: 1254, height: 1254, viewBox: '-40 619 707 707' },
  tigre: { src: '/images/avatars/finpro-animal-02.png', width: 1254, height: 1254, viewBox: '619 619 707 707' },
  perro: { src: '/images/avatars/finpro-animal-03.png', width: 1312, height: 1199, viewBox: '-40 -80 707 707' },
  pinguino: { src: '/images/avatars/finpro-animal-03.png', width: 1312, height: 1199, viewBox: '648 -80 707 707' },
  mapache: { src: '/images/avatars/finpro-animal-03.png', width: 1312, height: 1199, viewBox: '-40 592 707 707' },
  koala: { src: '/images/avatars/finpro-animal-03.png', width: 1312, height: 1199, viewBox: '648 592 707 707' },
  leon: { src: '/images/avatars/finpro-animal-04.png', width: 1218, height: 1292, viewBox: '-40 -80 707 707' },
  tortuga: { src: '/images/avatars/finpro-animal-04.png', width: 1218, height: 1292, viewBox: '601 -80 707 707' },
  ciervo: { src: '/images/avatars/finpro-animal-04.png', width: 1218, height: 1292, viewBox: '-40 638 707 707' },
  tiburon: { src: '/images/avatars/finpro-animal-04.png', width: 1218, height: 1292, viewBox: '601 638 707 707' },
  erizo: { src: '/images/avatars/finpro-animal-05.png', width: 1261, height: 1247, viewBox: '-40 -80 707 707' },
  ajolote: { src: '/images/avatars/finpro-animal-05.png', width: 1261, height: 1247, viewBox: '622 -80 707 707' },
  cosmo: { src: '/images/avatars/finpro-animal-05.png', width: 1261, height: 1247, viewBox: '-40 616 707 707' },
  pixel: { src: '/images/avatars/finpro-animal-05.png', width: 1261, height: 1247, viewBox: '622 616 707 707' },
  dragon: { src: '/images/avatars/finpro-fantasy-01.png', width: 1268, height: 1241, viewBox: '-40 -80 707 707' },
  unicornio: { src: '/images/avatars/finpro-fantasy-01.png', width: 1268, height: 1241, viewBox: '626 -80 707 707' },
  hada: { src: '/images/avatars/finpro-fantasy-01.png', width: 1268, height: 1241, viewBox: '-40 612 707 707' },
  sirena: { src: '/images/avatars/finpro-fantasy-01.png', width: 1268, height: 1241, viewBox: '626 612 707 707' },
  fenix: { src: '/images/avatars/finpro-fantasy-02.png', width: 1274, height: 1235, viewBox: '-40 -80 707 707' },
  fantasma: { src: '/images/avatars/finpro-fantasy-02.png', width: 1274, height: 1235, viewBox: '629 -80 707 707' },
  mago: { src: '/images/avatars/finpro-fantasy-02.png', width: 1274, height: 1235, viewBox: '-40 610 707 707' },
  vampiro: { src: '/images/avatars/finpro-fantasy-02.png', width: 1274, height: 1235, viewBox: '629 610 707 707' },
  slime: { src: '/images/avatars/finpro-fantasy-03.png', width: 1312, height: 1199, viewBox: '-40 -80 707 707' },
  alien: { src: '/images/avatars/finpro-fantasy-03.png', width: 1312, height: 1199, viewBox: '648 -80 707 707' },
  polilla: { src: '/images/avatars/finpro-fantasy-03.png', width: 1312, height: 1199, viewBox: '-40 592 707 707' },
  golem: { src: '/images/avatars/finpro-fantasy-03.png', width: 1312, height: 1199, viewBox: '648 592 707 707' },
  taco: { src: '/images/avatars/finpro-misc-01.png', width: 1263, height: 1245, viewBox: '-40 -80 707 707' },
  cactus: { src: '/images/avatars/finpro-misc-01.png', width: 1263, height: 1245, viewBox: '624 -80 707 707' },
  astronauta: { src: '/images/avatars/finpro-misc-01.png', width: 1263, height: 1245, viewBox: '-40 614 707 707' },
  pirata: { src: '/images/avatars/finpro-misc-01.png', width: 1263, height: 1245, viewBox: '624 614 707 707' },
  chef: { src: '/images/avatars/finpro-misc-02.png', width: 1261, height: 1247, viewBox: '-40 -80 707 707' },
  disco: { src: '/images/avatars/finpro-misc-02.png', width: 1261, height: 1247, viewBox: '622 -80 707 707' },
  ninja: { src: '/images/avatars/finpro-misc-02.png', width: 1261, height: 1247, viewBox: '-40 616 707 707' },
  exploradora: { src: '/images/avatars/finpro-misc-02.png', width: 1261, height: 1247, viewBox: '622 616 707 707' },
  inventor: { src: '/images/avatars/finpro-misc-03.png', width: 1261, height: 1247, viewBox: '-40 -80 707 707' },
  superheroina: { src: '/images/avatars/finpro-misc-03.png', width: 1261, height: 1247, viewBox: '622 -80 707 707' },
  astronomo: { src: '/images/avatars/finpro-misc-03.png', width: 1261, height: 1247, viewBox: '-40 616 707 707' },
  jardinera: { src: '/images/avatars/finpro-misc-03.png', width: 1261, height: 1247, viewBox: '622 616 707 707' },
  zuri: { src: '/images/avatars/finpro-misc-04.png', width: 1263, height: 1246, viewBox: '-40 -80 707 707' },
  inesa: { src: '/images/avatars/finpro-misc-04.png', width: 1263, height: 1246, viewBox: '624 -80 707 707' },
  seta: { src: '/images/avatars/finpro-misc-04.png', width: 1263, height: 1246, viewBox: '-40 615 707 707' },
  nube: { src: '/images/avatars/finpro-misc-04.png', width: 1263, height: 1246, viewBox: '624 615 707 707' },
});

export const AVATAR_CHARACTER_IDS = AVATAR_CATALOG.map(({ id }) => id);

// Los slots permiten combinar, por ejemplo, gafas + barba + collar, a la vez
// que impiden superponer dos sombreros o varias piezas para la misma zona.
const ACCESSORY_DATA = [
  { id: 'cap', name: 'Gorra', category: 'headwear', slot: 'headwear', compatibility: 'head' },
  { id: 'beanie', name: 'Gorro tejido', category: 'headwear', slot: 'headwear', compatibility: 'head' },
  { id: 'hat', name: 'Sombrero', category: 'headwear', slot: 'headwear', compatibility: 'head' },
  { id: 'beret', name: 'Boina', category: 'headwear', slot: 'headwear', compatibility: 'head' },
  { id: 'crown', name: 'Corona', category: 'headwear', slot: 'headwear', compatibility: 'head' },
  { id: 'headband', name: 'Diadema', category: 'headwear', slot: 'headwear', compatibility: 'head' },
  { id: 'flower-crown', name: 'Corona floral', category: 'headwear', slot: 'headwear', compatibility: 'head' },
  { id: 'cowboy-hat', name: 'Vaquero', category: 'headwear', slot: 'headwear', compatibility: 'humanoid' },
  { id: 'visor', name: 'Visera', category: 'headwear', slot: 'headwear', compatibility: 'humanoid' },
  { id: 'helmet', name: 'Casco', category: 'headwear', slot: 'headwear', compatibility: 'humanoid' },
  { id: 'pirate-hat', name: 'Pirata', category: 'headwear', slot: 'headwear', compatibility: 'humanoid' },
  { id: 'wizard-hat', name: 'Mago', category: 'headwear', slot: 'headwear', compatibility: 'humanoid' },
  { id: 'chef-hat', name: 'Chef', category: 'headwear', slot: 'headwear', compatibility: 'humanoid' },
  { id: 'antenna', name: 'Antenas', category: 'headwear', slot: 'headwear', compatibility: 'antenna' },
  { id: 'halo', name: 'Aureola', category: 'headwear', slot: 'headwear', compatibility: 'head' },

  { id: 'wig-afro', name: 'Peluca afro', category: 'hair', slot: 'hair', compatibility: 'humanoid', hairStyle: 'coily', hairColor: '#211814' },
  { id: 'wig-braids', name: 'Trenzas', category: 'hair', slot: 'hair', compatibility: 'humanoid', hairStyle: 'braids', hairColor: '#38251f' },
  { id: 'wig-rainbow', name: 'Rizos arcoíris', category: 'hair', slot: 'hair', compatibility: 'humanoid', hairStyle: 'curly', hairColor: '#e879a9' },
  { id: 'wig-copper', name: 'Melena cobriza', category: 'hair', slot: 'hair', compatibility: 'humanoid', hairStyle: 'long', hairColor: '#a65324' },
  { id: 'wig-mohawk', name: 'Cresta', category: 'hair', slot: 'hair', compatibility: 'humanoid', hairStyle: 'mohawk', hairColor: '#f07070' },

  { id: 'glasses', name: 'Gafas clásicas', category: 'face', slot: 'eyewear', compatibility: 'rounded' },
  { id: 'round-glasses', name: 'Gafas redondas', category: 'face', slot: 'eyewear', compatibility: 'rounded' },
  { id: 'sunglasses', name: 'Gafas de sol', category: 'face', slot: 'eyewear', compatibility: 'rounded' },
  { id: 'heart-glasses', name: 'Gafas corazón', category: 'face', slot: 'eyewear', compatibility: 'rounded' },
  { id: 'star-glasses', name: 'Gafas estrella', category: 'face', slot: 'eyewear', compatibility: 'rounded' },
  { id: 'safety-goggles', name: 'Gafas de taller', category: 'face', slot: 'eyewear', compatibility: 'rounded' },
  { id: 'monocle', name: 'Monóculo', category: 'face', slot: 'eyewear', compatibility: 'humanoid' },
  { id: 'mask', name: 'Mascarilla', category: 'face', slot: 'face-cover', compatibility: 'rounded' },
  { id: 'masquerade-mask', name: 'Máscara veneciana', category: 'face', slot: 'face-cover', compatibility: 'humanoid' },
  { id: 'domino-mask', name: 'Antifaz', category: 'face', slot: 'face-cover', compatibility: 'rounded' },
  { id: 'face-paint-stars', name: 'Estrellas', category: 'face', slot: 'face-art', compatibility: 'rounded' },
  { id: 'face-paint-stripe', name: 'Pintura tribal', category: 'face', slot: 'face-art', compatibility: 'rounded' },
  { id: 'freckles', name: 'Pecas', category: 'face', slot: 'freckles', compatibility: 'rounded' },
  { id: 'scar', name: 'Cicatriz', category: 'face', slot: 'scar', compatibility: 'rounded' },
  { id: 'whisker-paint', name: 'Bigotes pintados', category: 'face', slot: 'face-art', compatibility: 'rounded' },

  { id: 'beard-stubble', name: 'Barba de tres días', category: 'beard', slot: 'beard', compatibility: 'humanoid' },
  { id: 'beard-short', name: 'Barba corta', category: 'beard', slot: 'beard', compatibility: 'humanoid' },
  { id: 'beard-full', name: 'Barba completa', category: 'beard', slot: 'beard', compatibility: 'humanoid' },
  { id: 'beard-goatee', name: 'Candado', category: 'beard', slot: 'beard', compatibility: 'humanoid' },
  { id: 'beard-viking', name: 'Barba vikinga', category: 'beard', slot: 'beard', compatibility: 'humanoid' },
  { id: 'moustache', name: 'Bigote clásico', category: 'beard', slot: 'moustache', compatibility: 'humanoid' },
  { id: 'moustache-curly', name: 'Bigote rizado', category: 'beard', slot: 'moustache', compatibility: 'humanoid' },
  { id: 'moustache-handlebar', name: 'Bigote manubrio', category: 'beard', slot: 'moustache', compatibility: 'humanoid' },

  { id: 'earrings-hoop', name: 'Aros', category: 'ears', slot: 'earrings', compatibility: 'ears' },
  { id: 'earrings-stud', name: 'Aretes', category: 'ears', slot: 'earrings', compatibility: 'ears' },
  { id: 'ear-cuff', name: 'Pendiente lateral', category: 'ears', slot: 'earrings', compatibility: 'ears' },
  { id: 'headphones', name: 'Audífonos', category: 'ears', slot: 'audio', compatibility: 'audio' },
  { id: 'headset', name: 'Diadema gamer', category: 'ears', slot: 'audio', compatibility: 'audio' },

  { id: 'scarf', name: 'Bufanda', category: 'neck', slot: 'neckwear', compatibility: 'wearer' },
  { id: 'bandana', name: 'Pañuelo', category: 'neck', slot: 'neckwear', compatibility: 'wearer' },
  { id: 'tie', name: 'Corbata', category: 'neck', slot: 'neckwear', compatibility: 'humanoid' },
  { id: 'bowtie', name: 'Corbatín', category: 'neck', slot: 'neckwear', compatibility: 'humanoid' },
  { id: 'necklace-star', name: 'Collar estrella', category: 'neck', slot: 'necklace', compatibility: 'wearer' },
  { id: 'necklace-pearl', name: 'Collar de perlas', category: 'neck', slot: 'necklace', compatibility: 'wearer' },

  { id: 'star-pin', name: 'Broche estrella', category: 'decor', slot: 'pin', compatibility: 'head', scale: 0.72 },
  { id: 'bow', name: 'Lazo', category: 'decor', slot: 'hair-clip', compatibility: 'head' },
  { id: 'flower', name: 'Flor', category: 'decor', slot: 'hair-clip', compatibility: 'head' },
  { id: 'leaf', name: 'Hoja', category: 'decor', slot: 'hair-clip', compatibility: 'head' },
  { id: 'shell', name: 'Concha', category: 'decor', slot: 'pin', compatibility: 'mermaid' },
  { id: 'medal', name: 'Medalla', category: 'decor', slot: 'medal', compatibility: 'wearer' },
  { id: 'patch', name: 'Parche', category: 'decor', slot: 'patch', compatibility: 'wearer' },

  { id: 'cat-ears', name: 'Orejas felinas', category: 'headwear', slot: 'headwear', compatibility: 'head', scale: 1.05 },
  { id: 'bunny-ears', name: 'Orejas de conejo', category: 'headwear', slot: 'headwear', compatibility: 'head', scale: 1.05 },
  { id: 'devil-horns', name: 'Cuernos', category: 'headwear', slot: 'headwear', compatibility: 'head' },
  { id: 'antlers', name: 'Astas', category: 'headwear', slot: 'headwear', compatibility: 'head' },
  { id: 'top-hat', name: 'Sombrero de copa', category: 'headwear', slot: 'headwear', compatibility: 'head' },
  { id: 'knight-helmet', name: 'Yelmo', category: 'headwear', slot: 'headwear', compatibility: 'head' },
  { id: 'nurse-cap', name: 'Cofia', category: 'headwear', slot: 'headwear', compatibility: 'humanoid' },
  { id: 'crescent-crown', name: 'Corona lunar', category: 'headwear', slot: 'headwear', compatibility: 'head' },
  { id: 'star-headband', name: 'Vincha estelar', category: 'headwear', slot: 'headwear', compatibility: 'head' },
  { id: 'bun', name: 'Moño alto', category: 'hair', slot: 'hair', compatibility: 'humanoid', hairStyle: 'bun' },
  { id: 'twin-buns', name: 'Dos moños', category: 'hair', slot: 'hair', compatibility: 'humanoid', hairStyle: 'twin-buns' },
  { id: 'wavy-bob', name: 'Bob ondulado', category: 'hair', slot: 'hair', compatibility: 'humanoid', hairStyle: 'wavy-bob' },
  { id: 'fringe', name: 'Flequillo', category: 'hair', slot: 'hair', compatibility: 'humanoid', hairStyle: 'fringe' },
  { id: 'undercut', name: 'Undercut', category: 'hair', slot: 'hair', compatibility: 'humanoid', hairStyle: 'undercut' },
  { id: 'flower-barrette', name: 'Pasador floral', category: 'hair', slot: 'hair-clip', compatibility: 'head' },
  { id: 'square-glasses', name: 'Gafas cuadradas', category: 'face', slot: 'eyewear', compatibility: 'rounded' },
  { id: 'aviators', name: 'Gafas aviador', category: 'face', slot: 'eyewear', compatibility: 'rounded' },
  { id: 'eye-patch', name: 'Parche pirata', category: 'face', slot: 'face-cover', compatibility: 'rounded' },
  { id: 'robot-visor', name: 'Visor digital', category: 'face', slot: 'face-cover', compatibility: 'rounded' },
  { id: 'gas-mask', name: 'Máscara de exploración', category: 'face', slot: 'face-cover', compatibility: 'rounded' },
  { id: 'nose-ring', name: 'Aro nasal', category: 'face', slot: 'nose-jewelry', compatibility: 'rounded' },
  { id: 'lip-piercing', name: 'Piercing labial', category: 'face', slot: 'lip-jewelry', compatibility: 'rounded' },
  { id: 'beauty-mark', name: 'Lunar', category: 'face', slot: 'beauty-mark', compatibility: 'rounded' },
  { id: 'cheek-hearts', name: 'Corazones en mejillas', category: 'face', slot: 'cheek-art', compatibility: 'rounded' },
  { id: 'freckles-gold', name: 'Pecas doradas', category: 'face', slot: 'freckles', compatibility: 'rounded' },
  { id: 'beard-long', name: 'Barba larga', category: 'beard', slot: 'beard', compatibility: 'humanoid' },
  { id: 'beard-braided', name: 'Barba trenzada', category: 'beard', slot: 'beard', compatibility: 'humanoid' },
  { id: 'beard-shadow', name: 'Sombra de barba', category: 'beard', slot: 'beard', compatibility: 'humanoid' },
  { id: 'moustache-pencil', name: 'Bigote fino', category: 'beard', slot: 'moustache', compatibility: 'humanoid' },
  { id: 'moustache-walrus', name: 'Bigote imperial', category: 'beard', slot: 'moustache', compatibility: 'humanoid' },
  { id: 'earrings-drop', name: 'Aretes largos', category: 'ears', slot: 'earrings', compatibility: 'ears' },
  { id: 'earphones', name: 'Auriculares', category: 'ears', slot: 'audio', compatibility: 'audio' },
  { id: 'choker', name: 'Gargantilla', category: 'neck', slot: 'neckwear', compatibility: 'wearer' },
  { id: 'necklace-moon', name: 'Collar lunar', category: 'neck', slot: 'necklace', compatibility: 'wearer' },
  { id: 'neck-ribbon', name: 'Cinta de cuello', category: 'neck', slot: 'neckwear', compatibility: 'wearer' },
  { id: 'backpack', name: 'Mochila', category: 'body', slot: 'backpack', compatibility: 'wearer' },
  { id: 'wings', name: 'Alas brillantes', category: 'special', slot: 'wings', compatibility: 'wearer' },
  { id: 'magic-aura', name: 'Aura mágica', category: 'special', slot: 'magic-aura', compatibility: 'wearer' },
  { id: 'sparkle-orbit', name: 'Órbita de destellos', category: 'special', slot: 'sparkle-orbit', compatibility: 'head' },
];

// Los anclajes describen puntos anatómicos del lienzo 128×128. Cada perfil
// recibe su propia tabla por personaje: los perfiles de arte rasterizados
// usan ajustes por retrato y los avatares vectoriales conservan sus medidas.
const ANCHOR_POINTS = {
  headTop: { x: 64, y: 42 }, forehead: { x: 64, y: 48 }, hair: { x: 64, y: 45 },
  eyes: { x: 64, y: 50 }, nose: { x: 64, y: 70 }, mouth: { x: 64, y: 78 },
  jaw: { x: 64, y: 82 }, chin: { x: 64, y: 83 }, lowerFace: { x: 64, y: 70 }, faceCover: { x: 64, y: 58 }, ears: { x: 64, y: 74 },
  neck: { x: 64, y: 94 }, shoulders: { x: 64, y: 101 }, back: { x: 64, y: 104 }, body: { x: 64, y: 107 },
  hairClip: { x: 84, y: 38 }, cheek: { x: 64, y: 72 }, cheekRight: { x: 80, y: 73 },
  pin: { x: 88, y: 43 }, patch: { x: 43, y: 105 }, center: { x: 64, y: 64 },
};
const SLOT_ANCHORS = {
  headwear: 'headTop', hair: 'hair', 'hair-clip': 'hairClip', eyewear: 'eyes',
  'face-cover': 'faceCover', beard: 'chin', moustache: 'mouth', 'nose-jewelry': 'nose',
  'lip-jewelry': 'mouth', freckles: 'cheek', 'beauty-mark': 'cheekRight',
  'cheek-art': 'cheek', earrings: 'ears', audio: 'ears', neckwear: 'neck',
  necklace: 'neck', backpack: 'back', pin: 'pin', medal: 'body', patch: 'patch',
  wings: 'shoulders', 'magic-aura': 'center', 'sparkle-orbit': 'center',
};
const ACCESSORY_ANCHOR_OVERRIDES = {
  mask: 'lowerFace', 'eye-patch': 'eyes', 'domino-mask': 'eyes', 'masquerade-mask': 'eyes', 'robot-visor': 'eyes', 'gas-mask': 'lowerFace',
};
const RENDER_LAYERS = {
  body: 10, special: 12, neck: 20, hair: 30, face: 40,
  beard: 50, ears: 60, decor: 70, headwear: 80,
};
const SLOT_RENDER_LAYERS = {
  'magic-aura': 1, 'sparkle-orbit': 2, wings: 8, backpack: 9,
  neckwear: 20, necklace: 24, hair: 30, 'hair-clip': 34,
  'face-art': 40, freckles: 42, scar: 43, 'beauty-mark': 44,
  'cheek-art': 45, 'nose-jewelry': 46, 'lip-jewelry': 47,
  eyewear: 50, 'face-cover': 52, beard: 60, moustache: 62,
  earrings: 70, audio: 72, pin: 74, medal: 76, patch: 78, headwear: 80,
};
// Ajustes de anclaje por retrato (dx,dy en coordenadas del lienzo). La tabla
// explícita facilita afinar un retrato sin desplazar a los demás.
const PORTRAIT_ANCHOR_TUNING = {
  luna: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -16], neck: [0, 5] },
  mateo: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -16], neck: [0, 5] },
  zoe: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -16], neck: [0, 5] },
  michi: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -17], neck: [0, 5] },
  ines: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -16], neck: [0, 5], headTop: [0, -6] },
  diego: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -16], neck: [0, 5], headTop: [0, -6] },
  amara: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -16], neck: [0, 5] },
  tomas: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -16], neck: [0, 5] },
  valentina: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -16], neck: [0, 5], headTop: [0, -6] },
  kai: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -16], neck: [0, 5], headTop: [0, -6] },
  omar: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -16], neck: [0, 5] },
  rafa: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -16], neck: [0, 5] },
  sofia: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -16], neck: [0, 5], headTop: [0, -6] },
  alma: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -16], neck: [0, 5] },
  lucas: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -16], neck: [0, 5] },
  noor: { nose: [0, 8], mouth: [0, 7], chin: [0, 7], ears: [0, -16], neck: [0, 5] },
};
const DEFAULT_PORTRAIT_TUNING = { eyes: [0, 4], nose: [0, -10], mouth: [0, -12], chin: [0, -5], headTop: [0, -18], ears: [0, -12], neck: [0, -4], lowerFace: [0, -6] };
// Coordenadas sobre el recorte de 128 × 128. Cada montura usa el punto
// medio, la separación y la inclinación de los ojos de ese retrato.
const PORTRAIT_LANDMARKS = {
  //                 ojos (x1, y1, x2, y2)     ala (x, y, ancho, giro)   cuello (x, y)
  luna:      { eyes: [64, 61, 84, 57], crown: [67, 43, 75, -7], neck: [72, 94] },
  mateo:     { eyes: [53, 56, 73, 53], crown: [56, 36, 69, -9], neck: [63, 83], beard: [66, 68, .76, .51, -8] },
  zoe:       { eyes: [60, 42, 76, 36], crown: [62, 26, 76, -13], neck: [66, 72] },
  ines:      { eyes: [61, 51, 80, 48], crown: [68, 34, 71, -7], neck: [69, 83] },
  diego:     { eyes: [52, 52, 72, 48], crown: [59, 32, 64, -9], neck: [53, 84], beard: [55, 67, .75, .56, -12] },
  amara:     { eyes: [65, 33, 82, 32], crown: [64, 18, 71, -5], neck: [62, 63] },
  tomas:     { eyes: [57, 36, 73, 32], crown: [59, 20, 70, -10], neck: [67, 66] },
  valentina: { eyes: [51, 54, 70, 49], crown: [59, 34, 84, -9], neck: [69, 88] },
  kai:       { eyes: [42, 43, 57, 39], crown: [47, 29, 72, -8], neck: [59, 68] },
  omar:      { eyes: [56, 36, 72, 32], crown: [56, 20, 69, -13], neck: [64, 66] },
  rafa:      { eyes: [45, 28, 60, 23], crown: [55, 13, 76, -11], neck: [63, 56] },
  sofia:     { eyes: [75, 45, 89, 41], crown: [70, 31, 77, -11], neck: [84, 75] },
  alma:      { eyes: [63, 56, 80, 51], crown: [64, 38, 83, -8], neck: [73, 84] },
  lucas:     { crown: [66, 19, 72, -11], neck: [75, 65] },
  noor:      { eyes: [58, 28, 72, 27], crown: [54, 13, 66, -5], neck: [59, 61] },
  inesa:     { eyes: [41, 56, 59, 52], crown: [58, 41, 81, -8], neck: [55, 88] },
  michi:     { eyes: [59, 78, 85, 71] },
  kiwi:      { eyes: [67, 44, 93, 52] },
  bruno:     { eyes: [50, 51, 74, 44], neck: [60, 92] },
  zorro:     { eyes: [63, 43, 89, 36] },
};

export const AVATAR_CHARACTER_ACCESSORY_FIT = Object.freeze(Object.fromEntries(
  Object.entries(PORTRAIT_LANDMARKS).map(([id, { eyes, crown, neck, beard }]) => {
    const fit = {};
    if (eyes) {
      const [leftX, leftY, rightX, rightY] = eyes;
      const dx = rightX - leftX;
      const dy = rightY - leftY;
      const span = Math.hypot(dx, dy);
      fit.eyewear = {
        targetX: (leftX + rightX) / 2, targetY: (leftY + rightY) / 2,
        scaleX: span / 25, scaleY: Math.max(.67, Math.min(1, span / 24)),
        rotation: Math.atan2(dy, dx) * 180 / Math.PI,
      };
    }
    if (crown) {
      const [targetX, targetY, width, rotation] = crown;
      fit.headwear = { targetX, targetY, width, rotation };
    }
    if (neck) {
      const [targetX, targetY] = neck;
      fit.scarf = { targetX, targetY, scaleX: id === 'bruno' ? 1.28 : .86, scaleY: .8 };
    }
    if (beard) {
      const [targetX, targetY, scaleX, scaleY, rotation] = beard;
      fit['beard-full'] = { targetX, targetY, scaleX, scaleY, rotation };
    }
    return [id, fit];
  }),
));
export const AVATAR_CHARACTER_ANCHORS = Object.freeze(Object.fromEntries(AVATAR_CATALOG.map(({ id }) => {
  const tuning = AVATAR_ARTWORKS[id] ? {
    ...DEFAULT_PORTRAIT_TUNING,
    ...PORTRAIT_ANCHOR_TUNING[id],
  } : {};
  return [id, Object.freeze(Object.fromEntries(Object.entries(ANCHOR_POINTS).map(([key, point]) => {
    const [dx, dy] = tuning[key] || [0, 0];
    return [key, Object.freeze({ x: point.x + dx, y: point.y + dy })];
  })))];
})));
const ACCESSORY_SOURCE_ANCHORS = {
  headwear: { x: 64, y: 42 }, hair: { x: 64, y: 45 }, 'hair-clip': { x: 84, y: 38 },
  eyewear: { x: 64, y: 60 }, 'face-cover': { x: 64, y: 64 }, beard: { x: 64, y: 83 }, moustache: { x: 64, y: 77 },
  'nose-jewelry': { x: 64, y: 70 }, 'lip-jewelry': { x: 64, y: 79 }, freckles: { x: 64, y: 74 },
  'beauty-mark': { x: 80, y: 73 }, 'cheek-art': { x: 64, y: 72 }, earrings: { x: 64, y: 74 },
  audio: { x: 64, y: 62 }, neckwear: { x: 64, y: 94 }, necklace: { x: 64, y: 99 },
  backpack: { x: 64, y: 104 }, pin: { x: 88, y: 43 }, medal: { x: 64, y: 107 }, patch: { x: 43, y: 105 },
  wings: { x: 64, y: 78 }, 'magic-aura': { x: 64, y: 64 }, 'sparkle-orbit': { x: 64, y: 64 },
};

export const AVATAR_ACCESSORIES = ACCESSORY_DATA.map((item) => ({
  ...item,
  anchorKey: ACCESSORY_ANCHOR_OVERRIDES[item.id] || SLOT_ANCHORS[item.slot] || 'center',
  anchor: ACCESSORY_SOURCE_ANCHORS[item.slot] || ANCHOR_POINTS.center,
  position: item.position || { x: 0, y: 0 },
  scale: item.slot === 'headwear'
    ? Math.min(item.scale ?? 1, 0.78)
    : item.slot === 'eyewear' ? Math.min(item.scale ?? 1, 0.92) : item.scale ?? 1,
  rotation: item.rotation || 0,
  layer: SLOT_RENDER_LAYERS[item.slot] ?? RENDER_LAYERS[item.category] ?? 80,
  renderStage: item.category === 'body' || item.id === 'wings' || item.id === 'magic-aura' || item.id === 'sparkle-orbit' ? 'behind' : 'front',
}));

// El editor ofrece piezas con ajustes calibrados. Las demás siguen disponibles para avatares guardados.
export const AVATAR_ACCESSORY_CATALOG_IDS = [
  'glasses', 'round-glasses', 'cap', 'beanie', 'hat', 'beard-full', 'scarf',
];
export const AVATAR_ACCESSORY_CATALOG = AVATAR_ACCESSORY_CATALOG_IDS
  .map((id) => AVATAR_ACCESSORIES.find((item) => item.id === id))
  .filter(Boolean);

export const AVATAR_ACCESSORY_CATEGORIES = [
  ['headwear', 'Cabeza'], ['hair', 'Cabello'], ['face', 'Rostro'], ['beard', 'Barba'],
  ['ears', 'Orejas y audio'], ['neck', 'Cuello'], ['decor', 'Detalles'], ['special', 'Especiales'],
];

export const AVATAR_ACCESSORY_IDS = AVATAR_ACCESSORIES.map(({ id }) => id);

// El selector presenta un catálogo con mayoría de personas y conserva el resto
// de las ilustraciones para seguir representando avatares previamente guardados.
const PICKER_CHARACTER_IDS = new Set([
  'luna', 'mateo', 'zoe', 'ines', 'diego', 'amara', 'tomas', 'valentina',
  'kai', 'omar', 'rafa', 'sofia', 'alma', 'lucas', 'noor', 'inesa',
  'michi', 'kiwi', 'bruno', 'zorro',
]);
export const AVATAR_PICKER_PRESETS = AVATAR_CATALOG
  .filter(({ id }) => PICKER_CHARACTER_IDS.has(id))
  .map((preset) => ({
    ...preset,
    avatar: {
      ...preset.avatar,
      character: preset.id,
      accessories: [],
      accessory: 'none',
    },
  }));

const EYE_OCCLUSION_ACCESSORIES = new Set(['eye-patch', 'masquerade-mask', 'domino-mask', 'robot-visor', 'gas-mask']);
const MASK_ACCESSORIES = new Set(['mask', 'masquerade-mask', 'domino-mask', 'eye-patch', 'robot-visor', 'gas-mask']);
const BEARD_ACCESSORIES = new Set(['beard-stubble', 'beard-short', 'beard-full', 'beard-goatee', 'beard-viking', 'beard-long', 'beard-braided', 'beard-shadow']);
const MOUSTACHE_ACCESSORIES = new Set(['moustache', 'moustache-curly', 'moustache-handlebar', 'moustache-pencil', 'moustache-walrus']);
const HEADWEAR_ACCESSORIES = new Set(AVATAR_ACCESSORIES.filter(({ slot }) => slot === 'headwear').map(({ id }) => id));
const HAIR_CLIP_ACCESSORIES = new Set(AVATAR_ACCESSORIES.filter(({ slot }) => slot === 'hair-clip').map(({ id }) => id));
const PAIR_CONFLICTS = new Set([
  'beard-full|moustache', 'beard-long|moustache', 'beard-braided|moustache', 'beard-viking|moustache',
  'beard-full|moustache-curly', 'beard-long|moustache-curly', 'beard-braided|moustache-curly', 'beard-viking|moustache-curly',
  'beard-full|moustache-handlebar', 'beard-long|moustache-handlebar', 'beard-braided|moustache-handlebar', 'beard-viking|moustache-handlebar',
  'beard-full|moustache-pencil', 'beard-long|moustache-pencil', 'beard-braided|moustache-pencil', 'beard-viking|moustache-pencil',
  'beard-full|moustache-walrus', 'beard-long|moustache-walrus', 'beard-braided|moustache-walrus', 'beard-viking|moustache-walrus',
]);
const pairKey = (left, right) => [left, right].sort().join('|');

export function accessoryConflict(accessoryId, selectedIds = []) {
  return accessoryConflicts(accessoryId, selectedIds)[0] || null;
}

export function accessoryConflicts(accessoryId, selectedIds = []) {
  const item = AVATAR_ACCESSORIES.find(({ id }) => id === accessoryId);
  if (!item) return [];
  return selectedIds.map((id) => AVATAR_ACCESSORIES.find((entry) => entry.id === id))
    .filter((selected) => selected && selected.id !== accessoryId && (
      selected.slot === item.slot
      || (selected.slot === 'eyewear' && EYE_OCCLUSION_ACCESSORIES.has(accessoryId))
      || (item.slot === 'eyewear' && EYE_OCCLUSION_ACCESSORIES.has(selected.id))
      || ((MASK_ACCESSORIES.has(selected.id) && (BEARD_ACCESSORIES.has(accessoryId) || MOUSTACHE_ACCESSORIES.has(accessoryId)))
        || (MASK_ACCESSORIES.has(accessoryId) && (BEARD_ACCESSORIES.has(selected.id) || MOUSTACHE_ACCESSORIES.has(selected.id))))
      || ((HEADWEAR_ACCESSORIES.has(selected.id) && HAIR_CLIP_ACCESSORIES.has(accessoryId))
        || (HEADWEAR_ACCESSORIES.has(accessoryId) && HAIR_CLIP_ACCESSORIES.has(selected.id)))
      || ((selected.slot === 'audio' && item.slot === 'earrings') || (item.slot === 'audio' && selected.slot === 'earrings'))
      || ((selected.slot === 'neckwear' && item.slot === 'necklace') || (item.slot === 'neckwear' && selected.slot === 'necklace'))
      || PAIR_CONFLICTS.has(pairKey(selected.id, accessoryId))
    ));
}

export function canEditAppearance(characterId) {
  return AVATAR_CATALOG.some(({ id, kind }) => id === characterId && kind === 'human');
}

export function canUseAccessory(item, avatar) {
  if (!isAccessoryCompatible(item.id, avatar.character)) return false;
  if (avatar.style === 'custom') return true;
  if (avatar.character === 'lucas' && item.slot === 'eyewear') return false;
  const fit = AVATAR_CHARACTER_ACCESSORY_FIT[avatar.character];
  if (item.id === 'beard-full') return Boolean(fit?.[item.id]);
  return Boolean(fit?.[item.id] || fit?.[item.slot]);
}

export function compatibleAccessories(accessoryIds, characterId) {
  const accepted = [];
  for (const id of accessoryIds) {
    if (isAccessoryCompatible(id, characterId) && !accessoryConflict(id, accepted.map((item) => item.id))) accepted.push(AVATAR_ACCESSORIES.find(({ id: itemId }) => itemId === id));
  }
  return accepted.map(({ id }) => id);
}

export function accessoryCompatibilityMessage(accessoryId, characterId, selectedIds = []) {
  if (!isAccessoryCompatible(accessoryId, characterId)) {
    const item = AVATAR_ACCESSORIES.find(({ id }) => id === accessoryId);
    const reasons = {
      humanoid: 'requiere un personaje humanoide.', rounded: 'no tiene un diseño para esta silueta.',
      ears: 'requiere orejas compatibles.', audio: 'requiere espacio para audio en la cabeza.',
      wearer: 'no tiene un punto de ajuste para este personaje.', head: 'requiere una forma de cabeza compatible.',
      antenna: 'solo funciona con personajes de antena.', mermaid: 'solo funciona con la sirena.',
    };
    return `No compatible: ${reasons[item?.compatibility] || 'no está diseñado para este personaje.'}`;
  }
  const conflict = accessoryConflict(accessoryId, selectedIds);
  return conflict ? `Reemplazará ${conflict.name} para evitar superposición.` : '';
}

const KINDS = {
  humanoid: new Set(['human', 'wizard', 'vampire', 'pirate', 'chef', 'ninja', 'explorer', 'hero', 'astronaut', 'alien', 'robot', 'fairy', 'mermaid', 'phoenix']),
  rounded: new Set(['human', 'wizard', 'vampire', 'pirate', 'chef', 'ninja', 'explorer', 'hero', 'astronaut', 'alien', 'robot', 'fairy', 'mermaid', 'phoenix', 'cat', 'fox', 'rabbit', 'panda', 'frog', 'owl', 'tiger', 'dog', 'raccoon', 'koala', 'lion', 'turtle', 'bird', 'bear', 'dragon', 'unicorn', 'deer', 'shark', 'hedgehog', 'axolotl', 'moth', 'golem', 'mushroom', 'cloud']),
  ears: new Set(['human', 'wizard', 'vampire', 'pirate', 'chef', 'ninja', 'explorer', 'hero', 'astronaut', 'alien', 'fairy', 'mermaid', 'cat', 'fox', 'rabbit', 'panda', 'dog', 'raccoon', 'koala', 'tiger', 'lion', 'bear', 'deer', 'hedgehog', 'axolotl', 'moth']),
  audio: new Set(['human', 'wizard', 'vampire', 'pirate', 'chef', 'ninja', 'explorer', 'hero', 'astronaut', 'alien', 'robot', 'fairy', 'mermaid', 'cat', 'fox', 'rabbit', 'panda', 'dog', 'raccoon', 'koala', 'tiger', 'lion', 'bear', 'penguin', 'deer', 'shark', 'hedgehog', 'axolotl', 'moth', 'golem', 'cloud']),
  wearer: new Set(['human', 'wizard', 'vampire', 'pirate', 'chef', 'ninja', 'explorer', 'hero', 'astronaut', 'alien', 'robot', 'fairy', 'mermaid', 'phoenix', 'cat', 'fox', 'rabbit', 'panda', 'frog', 'owl', 'tiger', 'dog', 'raccoon', 'koala', 'lion', 'turtle', 'bird', 'bear', 'dragon', 'unicorn', 'penguin', 'deer', 'shark', 'hedgehog', 'axolotl', 'moth', 'golem', 'mushroom', 'cloud']),
  head: new Set(['human', 'wizard', 'vampire', 'pirate', 'chef', 'ninja', 'explorer', 'hero', 'astronaut', 'alien', 'robot', 'fairy', 'mermaid', 'phoenix', 'cat', 'fox', 'panda', 'frog', 'owl', 'tiger', 'dog', 'raccoon', 'koala', 'lion', 'turtle', 'bird', 'bear', 'dragon', 'unicorn', 'penguin', 'deer', 'shark', 'hedgehog', 'axolotl', 'moth', 'golem', 'mushroom', 'cloud']),
};

export function isAccessoryCompatible(accessoryId, characterId) {
  const item = AVATAR_ACCESSORIES.find(({ id }) => id === accessoryId);
  const character = AVATAR_CATALOG.find(({ id }) => id === characterId);
  if (!item || !character) return false;
  if (item.compatibility === 'humanoid') return KINDS.humanoid.has(character.kind);
  if (item.compatibility === 'rounded') return KINDS.rounded.has(character.kind);
  if (item.compatibility === 'ears') return KINDS.ears.has(character.kind);
  if (item.compatibility === 'audio') return KINDS.audio.has(character.kind);
  if (item.compatibility === 'wearer') return KINDS.wearer.has(character.kind);
  if (item.compatibility === 'head') return KINDS.head.has(character.kind);
  if (item.compatibility === 'antenna') return ['alien', 'robot'].includes(character.kind);
  if (item.compatibility === 'mermaid') return character.kind === 'mermaid';
  return false;
}
