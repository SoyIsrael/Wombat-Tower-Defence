export const ENEMY_TYPES = {
  ant: {
    id: 'ant',
    name: 'Ant',
    baseHp: 40,
    baseSpeed: 1.8,
    color: '#884422',
    minWave: 1,
    armor: 0,
  },
  beetle: {
    id: 'beetle',
    name: 'Beetle',
    baseHp: 120,
    baseSpeed: 1.0,
    color: '#336633',
    minWave: 3,
    armor: 0,
  },
  spider: {
    id: 'spider',
    name: 'Spider',
    baseHp: 50,
    baseSpeed: 2.5,
    color: '#444444',
    minWave: 5,
    armor: 0,
  },
  armored_ant: {
    id: 'armored_ant',
    name: 'Armored Ant',
    baseHp: 70,
    baseSpeed: 1.5,
    color: '#884422',
    minWave: 7,
    armor: 8,
    baseType: 'ant',
  },
  armored_beetle: {
    id: 'armored_beetle',
    name: 'Armored Beetle',
    baseHp: 200,
    baseSpeed: 0.8,
    color: '#336633',
    minWave: 9,
    armor: 15,
    baseType: 'beetle',
  },
  armored_spider: {
    id: 'armored_spider',
    name: 'Armored Spider',
    baseHp: 90,
    baseSpeed: 2.1,
    color: '#444444',
    minWave: 11,
    armor: 10,
    baseType: 'spider',
  },
};

export function getEnemyTypesForWave(wave) {
  return Object.values(ENEMY_TYPES).filter(t => wave >= t.minWave);
}

export function createEnemy(wave, path, typeId = 'ant') {
  const type = ENEMY_TYPES[typeId] || ENEMY_TYPES.ant;
  const hpScale = 1 + wave * 0.35;
  const speedScale = 1 + wave * 0.05;
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
  };
}

export function getEnemyCountForWave(wave) {
  return 5 + wave * 3;
}

export function getSpawnInterval(wave) {
  return Math.max(300, 800 - wave * 30);
}
