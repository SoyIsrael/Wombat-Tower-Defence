// Map definitions — each map is pure data

export const MAPS = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'A straight shot across the field.',
    spawns: [{ col: 0, row: 6 }],
    goal: { col: 19, row: 6 },
    water: [],
    walls: [],
  },
  lakeside: {
    id: 'lakeside',
    name: 'Lakeside',
    description: 'A lake in the center creates two chokepoints.',
    spawns: [{ col: 0, row: 6 }],
    goal: { col: 19, row: 6 },
    water: [
      { col: 8, row: 4 }, { col: 9, row: 4 }, { col: 10, row: 4 }, { col: 11, row: 4 },
      { col: 8, row: 5 }, { col: 9, row: 5 }, { col: 10, row: 5 }, { col: 11, row: 5 },
      { col: 8, row: 6 }, { col: 9, row: 6 }, { col: 10, row: 6 }, { col: 11, row: 6 },
      { col: 8, row: 7 }, { col: 9, row: 7 }, { col: 10, row: 7 }, { col: 11, row: 7 },
    ],
    walls: [],
  },
  winding: {
    id: 'winding',
    name: 'Winding',
    description: 'Walls force a winding S-shaped path.',
    spawns: [{ col: 0, row: 1 }],
    goal: { col: 19, row: 10 },
    water: [],
    walls: [
      // First horizontal wall (blocks top-right)
      ...range(4, 18).map(c => ({ col: c, row: 3 })),
      // Second horizontal wall (blocks bottom-left)
      ...range(1, 15).map(c => ({ col: c, row: 7 })),
      // Third horizontal wall (blocks bottom-right again)
      ...range(6, 18).map(c => ({ col: c, row: 10 })),
    ],
  },
  convergence: {
    id: 'convergence',
    name: 'Convergence',
    description: 'Two spawn points converge on the burrow.',
    spawns: [{ col: 0, row: 2 }, { col: 0, row: 9 }],
    goal: { col: 19, row: 6 },
    water: [],
    walls: [
      // Central divider that forces separate lanes initially
      ...range(2, 12).map(c => ({ col: c, row: 6 })),
    ],
  },
  archipelago: {
    id: 'archipelago',
    name: 'Archipelago',
    description: 'Two spawns, scattered water islands.',
    spawns: [{ col: 0, row: 2 }, { col: 0, row: 9 }],
    goal: { col: 19, row: 6 },
    water: [
      // Island 1
      { col: 5, row: 3 }, { col: 5, row: 4 }, { col: 6, row: 3 }, { col: 6, row: 4 },
      // Island 2
      { col: 10, row: 7 }, { col: 10, row: 8 }, { col: 11, row: 7 }, { col: 11, row: 8 },
      // Island 3
      { col: 14, row: 2 }, { col: 14, row: 3 }, { col: 15, row: 2 }, { col: 15, row: 3 },
      // Island 4
      { col: 13, row: 9 }, { col: 13, row: 10 }, { col: 14, row: 9 }, { col: 14, row: 10 },
    ],
    walls: [],
  },
  twinrivers: {
    id: 'twinrivers',
    name: 'Twin Rivers',
    description: 'Two rivers with gaps split the field into lanes.',
    spawns: [{ col: 0, row: 6 }],
    goal: { col: 19, row: 6 },
    water: [
      // Left river (vertical, gap at row 2 and 9)
      ...range(0, 11).filter(r => r !== 2 && r !== 9).map(r => ({ col: 7, row: r })),
      // Right river (vertical, gap at row 4 and 7)
      ...range(0, 11).filter(r => r !== 4 && r !== 7).map(r => ({ col: 13, row: r })),
    ],
    walls: [],
  },
};

export const MAP_LIST = ['classic', 'lakeside', 'winding', 'convergence', 'archipelago', 'twinrivers'];

export function getWaterSet(map) {
  return new Set(map.water.map(t => `${t.col},${t.row}`));
}

export function getWallSet(map) {
  return new Set(map.walls.map(t => `${t.col},${t.row}`));
}

export function getMapBlockedSet(map) {
  const set = new Set();
  for (const t of map.water) set.add(`${t.col},${t.row}`);
  for (const t of map.walls) set.add(`${t.col},${t.row}`);
  return set;
}

// Helper: inclusive range
function range(start, end) {
  const arr = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}
