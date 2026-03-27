export const ENEMY_TYPES = {
  ant: {
    id: "ant",
    name: "Ant",
    baseHp: 40,
    baseSpeed: 1.8,
    color: "#884422",
    minWave: 1,
    armor: 0,
    bounty: 2,
  },
  beetle: {
    id: "beetle",
    name: "Beetle",
    baseHp: 120,
    baseSpeed: 1.0,
    color: "#336633",
    minWave: 3,
    armor: 0,
    bounty: 4,
  },
  spider: {
    id: "spider",
    name: "Spider",
    baseHp: 50,
    baseSpeed: 2.5,
    color: "#444444",
    minWave: 5,
    armor: 0,
    bounty: 3,
  },
  firefly: {
    id: "firefly",
    name: "Firefly",
    baseHp: 35,
    baseSpeed: 2.8,
    color: "#ccaa00",
    minWave: 6,
    armor: 0,
    baseType: "firefly",
    evasionChance: 0.25,
    bounty: 2,
  },
  armored_ant: {
    id: "armored_ant",
    name: "Armored Ant",
    baseHp: 70,
    baseSpeed: 1.5,
    color: "#884422",
    minWave: 7,
    armor: 8,
    baseType: "ant",
    bounty: 3,
  },
  brood_spider: {
    id: "brood_spider",
    name: "Brood Spider",
    baseHp: 90,
    baseSpeed: 0.7,
    color: "#553344",
    minWave: 8,
    armor: 3,
    baseType: "brood_spider",
    spawnsOnDeath: { typeId: "spiderling", count: [3, 4] },
    bounty: 5,
  },
  spiderling: {
    id: "spiderling",
    name: "Spiderling",
    baseHp: 15,
    baseSpeed: 3.5,
    color: "#999988",
    minWave: 99, // never spawned directly
    armor: 0,
    baseType: "spiderling",
    bounty: 1,
  },
  armored_beetle: {
    id: "armored_beetle",
    name: "Armored Beetle",
    baseHp: 200,
    baseSpeed: 0.8,
    color: "#336633",
    minWave: 9,
    armor: 15,
    baseType: "beetle",
    bounty: 6,
  },
  centipede: {
    id: "centipede",
    name: "Centipede",
    baseHp: 60,
    baseSpeed: 1.4,
    color: "#995522",
    minWave: 10,
    armor: 2,
    baseType: "centipede",
    segmentCount: 5,
    bounty: 3,
  },
  armored_spider: {
    id: "armored_spider",
    name: "Armored Spider",
    baseHp: 130,
    baseSpeed: 1.8,
    color: "#444444",
    minWave: 11,
    armor: 10,
    baseType: "spider",
    bounty: 4,
  },
};

export function getEnemyTypesForWave(wave) {
  return Object.values(ENEMY_TYPES).filter((t) => wave >= t.minWave);
}

export function createEnemy(wave, path, typeId = "ant") {
  const type = ENEMY_TYPES[typeId] || ENEMY_TYPES.ant;
  const hpScale = 1 + wave * 0.43;
  const speedScale = 1 + wave * 0.075;
  const hp = Math.round(type.baseHp * hpScale);

  return {
    id: `enemy-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    typeId,
    baseType: type.baseType || typeId,
    armored: (type.armor || 0) > 0,
    armor: type.armor || 0,
    x: path[0].col + 0.5,
    y: path[0].row + 0.5,
    hp,
    maxHp: hp,
    speed: type.baseSpeed * speedScale,
    baseSpeed: type.baseSpeed * speedScale,
    pathIndex: 0,
    path,
    slowUntil: 0,
    animPhase: Math.random() * Math.PI * 2,
    evasionChance: type.evasionChance || 0,
    spawnsOnDeath: type.spawnsOnDeath || null,
    bounty: type.bounty || 2,
  };
}

// Create a centipede as an array of linked segment enemies
export function createCentipede(wave, path) {
  const type = ENEMY_TYPES.centipede;
  const count = type.segmentCount || 5;
  const groupId = `centi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const segments = [];

  for (let i = 0; i < count; i++) {
    const enemy = createEnemy(wave, path, "centipede");
    enemy.centipedeGroupId = groupId;
    enemy.segmentIndex = i;
    enemy.isSegment = i > 0;
    segments.push(enemy);
  }

  return segments;
}

export function getEnemyCountForWave(wave) {
  return wave <= 5 ? 4 + wave * 3 : 6 + wave * 4;
}

export function getSpawnInterval(wave) {
  return Math.max(300, 800 - wave * 30);
}
