import { COLS, ROWS } from './constants.js';

const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];

// BFS from goal. Returns { prevGrid, paths } or null if any spawn unreachable.
// paths is a Map<"col,row", pathArray>
export function computePaths(blockedSet, spawns, goal) {
  const dist = Array.from({ length: ROWS }, () => new Array(COLS).fill(-1));
  const prev = Array.from({ length: ROWS }, () => new Array(COLS).fill(null));

  const queue = [{ col: goal.col, row: goal.row }];
  dist[goal.row][goal.col] = 0;

  let head = 0;
  while (head < queue.length) {
    const { col, row } = queue[head++];
    for (const [dc, dr] of DIRS) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      if (dist[nr][nc] !== -1) continue;
      if (blockedSet.has(`${nc},${nr}`)) continue;
      dist[nr][nc] = dist[row][col] + 1;
      prev[nr][nc] = { col, row };
      queue.push({ col: nc, row: nr });
    }
  }

  // Build path for each spawn
  const paths = new Map();
  for (const spawn of spawns) {
    if (dist[spawn.row][spawn.col] === -1) return null; // unreachable
    const path = tracePathFrom(spawn, prev);
    paths.set(`${spawn.col},${spawn.row}`, path);
  }

  return { prevGrid: prev, paths };
}

// Trace a path from start to goal using a prevGrid
export function tracePathFrom(start, prevGrid) {
  const path = [];
  let cur = { col: start.col, row: start.row };
  while (cur) {
    path.push(cur);
    cur = prevGrid[cur.row]?.[cur.col] ?? null;
  }
  return path;
}

// Check if placing a tower at (col,row) would block any spawn→goal path
export function wouldBlockPath(blockedSet, col, row, spawns, goal) {
  const testSet = new Set(blockedSet);
  testSet.add(`${col},${row}`);
  return computePaths(testSet, spawns, goal) === null;
}
