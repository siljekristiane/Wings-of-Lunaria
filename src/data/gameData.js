// ---- Wings of Lunaria — original game data (no third-party IP) ----

export const SKIN_TONES = ['#ffe0c2', '#f3c99e', '#d9a066', '#b0743f', '#7a4a2b', '#4f3020'];
export const HAIR_COLORS = ['#3a2a20', '#6b4226', '#a8672b', '#d9b45c', '#e8e3d9', '#7a5ea8', '#4a7fae', '#c96b8a'];
export const EYE_COLORS = ['#4a7fae', '#5ea87d', '#a8672b', '#7a5ea8', '#3a2a20', '#c9a13b'];
export const FACE_SHAPES = ['Myk oval', 'Rund', 'Hjerteformet', 'Smal'];
export const HAIR_STYLES = ['Langt og bølgete', 'Kort bob', 'Flettet krone', 'Høy hestehale', 'Krøllete løs'];

export const CLOTHING_CATALOG = {
  top: [
    { id: 'top_starter_tunic', name: 'Reisetunika', color: '#8fb3c9', cost: 0, owned: true },
    { id: 'top_lavender_wrap', name: 'Lavendelkåpe', color: '#a89bd9', cost: 40 },
    { id: 'top_gold_vest', name: 'Gyllen vest', color: '#d9b45c', cost: 60 },
    { id: 'top_moon_blouse', name: 'Måneskinnsbluse', color: '#eef0f7', cost: 55 },
    { id: 'top_forest_cloak', name: 'Skogkappe', color: '#5e8f6f', cost: 50 },
  ],
  bottom: [
    { id: 'bottom_starter_pants', name: 'Reisebukser', color: '#6b5b4a', cost: 0, owned: true },
    { id: 'bottom_flow_skirt', name: 'Flytende skjørt', color: '#7a5ea8', cost: 45 },
    { id: 'bottom_dusk_trousers', name: 'Skumringsbukser', color: '#3f4a6b', cost: 45 },
    { id: 'bottom_petal_shorts', name: 'Kronbladshorts', color: '#d98fa3', cost: 35 },
  ],
  shoes: [
    { id: 'shoes_starter_boots', name: 'Vandrestøvler', color: '#5a4632', cost: 0, owned: true },
    { id: 'shoes_star_sandals', name: 'Stjernesandaler', color: '#d9b45c', cost: 30 },
    { id: 'shoes_moss_shoes', name: 'Mosesko', color: '#5e8f6f', cost: 30 },
  ],
  accessory: [
    { id: 'acc_none', name: 'Ingen', color: 'transparent', cost: 0, owned: true },
    { id: 'acc_star_pin', name: 'Stjernenål', color: '#d9b45c', cost: 25 },
    { id: 'acc_moon_circlet', name: 'Månediadem', color: '#eef0f7', cost: 70 },
    { id: 'acc_scarf', name: 'Tåkeskjerf', color: '#a89bd9', cost: 35 },
    // quest reward, not purchasable
    { id: 'acc_starcharter_brooch', name: 'Stjernekartists brosje', color: '#9fd9e0', cost: null, questReward: true },
  ],
};

export const COMPANION_TYPES = [
  {
    id: 'lysrev',
    name: 'Lysrev',
    desc: 'Store ører, myk hale og en varm lysglød.',
    baseColor: '#e8a15c',
    movement: 'walk',
  },
  {
    id: 'skykatt',
    name: 'Skykatt',
    desc: 'Rundere kropp, katteansikt og skyaktige detaljer.',
    baseColor: '#cfd8e8',
    movement: 'float',
  },
  {
    id: 'maaneulv',
    name: 'Måneulv',
    desc: 'Tykk pels, ulveører og en diskret måneglød.',
    baseColor: '#7d8ba3',
    movement: 'walk',
  },
  {
    id: 'stjernedrage',
    name: 'Liten stjernedrage',
    desc: 'Små vinger, skjell og en stjerneglød.',
    baseColor: '#8fb3c9',
    movement: 'float',
  },
];

export const COMPANION_COLORS = ['#e8a15c', '#cfd8e8', '#7d8ba3', '#8fb3c9', '#d9b45c', '#a89bd9', '#d98fa3', '#eef0f7'];
export const COMPANION_GLOWS = ['#fff3c9', '#c9e8ff', '#e0c9ff', '#c9ffe0'];
export const COMPANION_ACCESSORIES = ['Ingen', 'Liten sløyfe', 'Stjerneanheng', 'Blomsterkrans', 'Skjerf'];

// World scene: 'vale' | 'academyHall' | 'room'
export const WORLD_BOUNDS = { minX: -2400, maxX: 2400, minY: -2400, maxY: 2400 };

// Fixed landmarks & colliders in Asterwyn Vale (world coordinates, 0,0 = spawn near academy courtyard)
export const VALE_LANDMARKS = {
  academyDoor: { x: 0, y: -420, w: 140, h: 40 },
  academyBuilding: { x: -260, y: -760, w: 520, h: 380 },
  friendshipSquare: { x: 420, y: 120, r: 160 },
  river: { points: [[-2400, 420], [-600, 380], [0, 460], [600, 400], [2400, 460]], width: 120 },
  bridge: { x: -20, y: 430, w: 160, h: 130 },
  whisperwoodPath: { x: -900, y: 700 },
  moonmerePortal: { x: 1050, y: -300 },
};

export const TREES = (() => {
  // deterministic scattered trees using seeded pseudo-random, avoiding landmark zones
  const trees = [];
  let seed = 1337;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 140; i++) {
    const x = (rand() - 0.5) * 4600;
    const y = (rand() - 0.5) * 4600;
    // keep clear of courtyard & square & bridge
    if (Math.abs(x) < 340 && y < -300 && y > -800) continue;
    if (Math.hypot(x - 420, y - 120) < 210) continue;
    if (Math.abs(x) < 260 && y > 330 && y < 520) continue;
    trees.push({ x, y, scale: 0.75 + rand() * 0.6, sway: rand() * Math.PI * 2, kind: rand() > 0.5 ? 'round' : 'tall' });
  }
  return trees;
})();

export const ROCKS = (() => {
  const rocks = [];
  let seed = 4242;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 60; i++) {
    const x = (rand() - 0.5) * 4400;
    const y = (rand() - 0.5) * 4400;
    if (Math.abs(x) < 300 && y < -300 && y > -800) continue;
    rocks.push({ x, y, scale: 0.5 + rand() * 0.8 });
  }
  return rocks;
})();

export const FLOWER_PATCHES = (() => {
  const patches = [];
  let seed = 777;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 90; i++) {
    const x = (rand() - 0.5) * 4400;
    const y = (rand() - 0.5) * 4400;
    patches.push({ x, y, hue: Math.floor(rand() * 6) });
  }
  return patches;
})();

// Dirt paths connecting landmarks: densified centerlines with jittered edges
// and stable (seeded, precomputed) stone/grass decoration along the sides —
// generated once so the unevenness never flickers frame to frame.
function buildPath(rawPoints, width, seedStart) {
  let seed = seedStart;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const dense = [];
  const stepsPerSeg = 14;
  for (let i = 0; i < rawPoints.length - 1; i++) {
    const [x1, y1] = rawPoints[i];
    const [x2, y2] = rawPoints[i + 1];
    for (let s = 0; s < stepsPerSeg; s++) {
      const t = s / stepsPerSeg;
      dense.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    }
  }
  dense.push(rawPoints[rawPoints.length - 1]);

  const left = [];
  const right = [];
  const decor = [];
  for (let i = 0; i < dense.length; i++) {
    const [x, y] = dense[i];
    const [nx, ny] = dense[Math.min(i + 1, dense.length - 1)];
    const dx = nx - x, dy = ny - y;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len, py = dx / len;
    const jitter = (rand() - 0.5) * 16;
    const w = width / 2 + jitter;
    left.push([x + px * w, y + py * w]);
    right.push([x - px * w, y - py * w]);
    if (rand() < 0.4) {
      const side = rand() < 0.5 ? 1 : -1;
      const edgeW = w + 5 + rand() * 12;
      decor.push({ x: x + px * side * edgeW, y: y + py * side * edgeW, kind: rand() < 0.45 ? 'stone' : 'grass', scale: 0.5 + rand() * 0.6, seed: rand() * 10 });
    }
  }
  return { left, right, decor };
}

export const PATHS = [
  buildPath([[0, -380], [-10, -100], [-20, 150], [-20, 430]], 46, 5001), // courtyard to bridge
  buildPath([[0, -380], [150, -200], [300, -50], [420, 120]], 40, 5002), // courtyard to friendship square
  buildPath([[-20, 430], [-300, 550], [-600, 620], [-900, 700]], 40, 5003), // bridge to Whisperwood path
];

// Stones and reeds along the riverbank (kept clear of the bridge)
export const RIVERBANK_PROPS = (() => {
  const props = [];
  let seed = 8080;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const pts = VALE_LANDMARKS.river.points;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const steps = 12;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      if (Math.abs(x - VALE_LANDMARKS.bridge.x) < VALE_LANDMARKS.bridge.w / 2 + 50) continue;
      if (rand() < 0.55) {
        const side = rand() < 0.5 ? 1 : -1;
        const offset = VALE_LANDMARKS.river.width / 2 + 8 + rand() * 24;
        props.push({ x, y: y + side * offset, kind: rand() < 0.4 ? 'rock' : 'reed', scale: 0.5 + rand() * 0.7, sway: rand() * Math.PI * 2 });
      }
    }
  }
  return props;
})();

// A few small creatures wandering near flower patches for ambient life
export const BUTTERFLIES = (() => {
  const list = [];
  let seed = 2024;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 6; i++) {
    const patch = FLOWER_PATCHES[Math.floor(rand() * FLOWER_PATCHES.length)];
    list.push({
      baseX: patch.x + (rand() - 0.5) * 40,
      baseY: patch.y + (rand() - 0.5) * 40,
      hue: ['#e8a15c', '#d98fa3', '#eef0f7', '#a89bd9'][Math.floor(rand() * 4)],
      phase: rand() * Math.PI * 2,
      radius: 30 + rand() * 30,
      speed: 0.3 + rand() * 0.25,
    });
  }
  return list;
})();

export const CRYSTALS = [
  { x: 260, y: -180, id: 'crystal_1' },
  { x: -540, y: 260, id: 'crystal_2' },
  { x: 780, y: 480, id: 'crystal_3' },
];

export const LANTERNS = [
  { x: -120, y: -350 }, { x: 120, y: -350 },
  { x: 380, y: 60 }, { x: 460, y: 200 },
  { x: -40, y: 380 }, { x: -60, y: 480 },
];

// Generic collectibles (non-quest) placed physically in the world, for the collection book
export const COLLECTIBLES = [
  { id: 'col_glimmerdust_1', name: 'Glimmerstøv', x: 300, y: -60, kind: 'dust' },
  { id: 'col_glimmerdust_2', name: 'Glimmerstøv', x: -700, y: 120, kind: 'dust' },
  { id: 'col_moonshell', name: 'Måneskjell', x: -30, y: 470, kind: 'shell' },
  { id: 'col_windflower', name: 'Vindblomst', x: 900, y: -180, kind: 'flower' },
  { id: 'col_glowberry', name: 'Glødebær', x: -1100, y: -120, kind: 'berry' },
];

export const STAR_FRAGMENTS = [
  { id: 'frag_1', x: -260, y: 40 },
  { id: 'frag_2', x: 640, y: -240 },
  { id: 'frag_3', x: -160, y: 640 },
];

export const NPCS = [
  {
    id: 'elowen',
    name: 'Headkeeper Elowen',
    x: 40, y: -470,
    color: '#7a5ea8',
    role: 'quest',
  },
  {
    id: 'mira',
    name: 'Mira Vale',
    x: 460, y: 140,
    color: '#d98fa3',
    role: 'friend',
  },
  {
    id: 'rowan',
    name: 'Rowan Thale',
    x: -870, y: 660,
    color: '#5e8f6f',
    role: 'clue',
  },
];

export const INTERIORS = {
  academyHall: {
    bounds: { minX: -360, maxX: 360, minY: -240, maxY: 240 },
    colliders: [
      { x: -150, y: -40, w: 60, h: 120 },
      { x: 150, y: -40, w: 60, h: 120 },
      { x: 0, y: -170, w: 220, h: 40 },
    ],
    exitToVale: { x: 0, y: 235, w: 120, h: 30 },
    toRoom: { x: 300, y: -190, w: 70, h: 60 },
  },
  room: {
    bounds: { minX: -300, maxX: 300, minY: -200, maxY: 200 },
    colliders: [
      { x: -220, y: -130, w: 110, h: 60 }, // bed
      { x: 200, y: -140, w: 80, h: 50 }, // desk
      { x: 220, y: 60, w: 60, h: 90 }, // wardrobe
      { x: -230, y: 120, w: 70, h: 55 }, // chest
    ],
    mirror: { x: 80, y: -175, r: 40 },
    wardrobe: { x: 220, y: 60, r: 55 },
    exitToHall: { x: -260, y: 180, w: 90, h: 30 },
  },
};

export const AREAS = [
  { id: 'asterwyn_vale', name: 'Asterwyn Vale', hint: 'Dalen rundt akademiet.' },
  { id: 'asterwyn_academy', name: 'Asterwyn Academy', hint: 'Det store akademiet.' },
  { id: 'friendship_square', name: 'Vennskapstorget', hint: 'Der reisende møtes.' },
  { id: 'whisperwood_path', name: 'Stien mot Whisperwood', hint: 'En sti inn i skogen... (kommer senere)' },
  { id: 'moonmere_portal', name: 'Portalen til Moonmere', hint: 'Låst. Åpnes i et senere kapittel.' },
];

export const CAMERA_MODES = [
  { id: 1, name: 'Standard tredjeperson', baseZoom: 1.05 },
  { id: 2, name: 'Bred tredjeperson', baseZoom: 0.8 },
  { id: 3, name: 'Høy oversikt', baseZoom: 0.55 },
  { id: 4, name: 'Nær følgemodus', baseZoom: 1.4 },
];

export const QUEST_MAIN = {
  id: 'faded_starmap',
  title: 'Det falmede stjernekartet',
  giver: 'Headkeeper Elowen',
  description:
    'Elowens gamle stjernekart har mistet energien sin. Tre stjernefragmenter er spredt rundt i Asterwyn Vale. Finn dem og bring dem tilbake.',
  rewardStardust: 80,
  rewardXp: 50,
  rewardItem: 'acc_starcharter_brooch',
};
