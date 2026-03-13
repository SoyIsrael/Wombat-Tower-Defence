import { COLS, ROWS, CELL_SIZE } from './constants.js';

export const THEMES = {
  classic: {
    name: 'Classic',
    grass: ['#4a6b2a', '#3d5e22', '#527a30'],
    path: '#c4a265',
    grid: 'rgba(0,0,0,0.15)',
    towerBase: '#5a3d1a',
    water: '#2277aa',
    waterLight: '#3399bb',
    wall: '#665544',
    wallDark: '#554433',
    preview: ['#4a6b2a', '#c4a265'],
  },
  desert: {
    name: 'Desert',
    grass: ['#c2a55a', '#b89848', '#d4b86a'],
    path: '#a08040',
    grid: 'rgba(0,0,0,0.1)',
    towerBase: '#8a6830',
    water: '#2288aa',
    waterLight: '#33aacc',
    wall: '#8a7a60',
    wallDark: '#7a6a50',
    preview: ['#c2a55a', '#a08040'],
  },
  snow: {
    name: 'Snow',
    grass: ['#d8e8f0', '#c8dce8', '#e0eef4'],
    path: '#a0a8b0',
    grid: 'rgba(0,0,0,0.08)',
    towerBase: '#7788a0',
    water: '#3366aa',
    waterLight: '#4488cc',
    wall: '#8899aa',
    wallDark: '#778899',
    preview: ['#d8e8f0', '#a0a8b0'],
  },
  dark: {
    name: 'Dark',
    grass: ['#2a2a3a', '#222233', '#32324a'],
    path: '#555566',
    grid: 'rgba(255,255,255,0.08)',
    towerBase: '#3a3a4a',
    water: '#1a3355',
    waterLight: '#224466',
    wall: '#444455',
    wallDark: '#333344',
    preview: ['#2a2a3a', '#555566'],
  },
  swamp: {
    name: 'Swamp',
    grass: ['#2d4a2a', '#1f3d1a', '#355530'],
    path: '#6b7a50',
    grid: 'rgba(0,0,0,0.12)',
    towerBase: '#3a4a2a',
    water: '#2a5544',
    waterLight: '#337755',
    wall: '#4a4a3a',
    wallDark: '#3a3a2a',
    preview: ['#2d4a2a', '#6b7a50'],
  },
};

export function render(ctx, state) {
  const w = COLS * CELL_SIZE;
  const h = ROWS * CELL_SIZE;
  ctx.clearRect(0, 0, w, h);

  const theme = THEMES[state.background] || THEMES.classic;

  drawGrid(ctx, state.pathSet, state.blockedSet, state.waterSet, state.wallSet, theme);
  drawPath(ctx, state.paths);
  drawSpawnsAndGoal(ctx, state.spawns, state.goal);
  drawTowers(ctx, state.towers, theme);
  drawEnemies(ctx, state.enemies);
  drawProjectiles(ctx, state.projectiles);
  drawHoverCell(ctx, state);
}

function drawGrid(ctx, pathSet, blockedSet, waterSet, wallSet, theme) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = `${c},${r}`;
      const x = c * CELL_SIZE;
      const y = r * CELL_SIZE;

      if (waterSet.has(key)) {
        // Water tile
        ctx.fillStyle = (r + c) % 2 === 0 ? theme.water : theme.waterLight;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        // Wave lines
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const wy = y + 12 + i * 12;
          ctx.beginPath();
          ctx.moveTo(x + 4, wy);
          ctx.quadraticCurveTo(x + CELL_SIZE * 0.25, wy - 4, x + CELL_SIZE * 0.5, wy);
          ctx.quadraticCurveTo(x + CELL_SIZE * 0.75, wy + 4, x + CELL_SIZE - 4, wy);
          ctx.stroke();
        }
      } else if (wallSet.has(key)) {
        // Wall tile
        ctx.fillStyle = theme.wall;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        // Brick pattern
        ctx.strokeStyle = theme.wallDark;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, CELL_SIZE / 2 - 3, CELL_SIZE / 2 - 3);
        ctx.strokeRect(x + CELL_SIZE / 2 + 1, y + 2, CELL_SIZE / 2 - 3, CELL_SIZE / 2 - 3);
        ctx.strokeRect(x + CELL_SIZE / 4, y + CELL_SIZE / 2 + 1, CELL_SIZE / 2 - 2, CELL_SIZE / 2 - 3);
      } else if (blockedSet.has(key)) {
        continue; // towers draw themselves
      } else if (pathSet.has(key)) {
        ctx.fillStyle = theme.path;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      } else {
        ctx.fillStyle = theme.grass[(r + c) % theme.grass.length];
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  // Grid lines
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * CELL_SIZE);
    ctx.lineTo(COLS * CELL_SIZE, r * CELL_SIZE);
    ctx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * CELL_SIZE, 0);
    ctx.lineTo(c * CELL_SIZE, ROWS * CELL_SIZE);
    ctx.stroke();
  }
}

function drawPath(ctx, paths) {
  if (!paths) return;
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  for (const path of paths.values()) {
    if (path.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo((path[0].col + 0.5) * CELL_SIZE, (path[0].row + 0.5) * CELL_SIZE);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo((path[i].col + 0.5) * CELL_SIZE, (path[i].row + 0.5) * CELL_SIZE);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawSpawnsAndGoal(ctx, spawns, goal) {
  // Spawn markers
  for (let i = 0; i < spawns.length; i++) {
    const spawn = spawns[i];
    const sx = (spawn.col + 0.5) * CELL_SIZE;
    const sy = (spawn.row + 0.5) * CELL_SIZE;
    ctx.fillStyle = '#cc4422';
    ctx.beginPath();
    ctx.arc(sx, sy, CELL_SIZE * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${CELL_SIZE * 0.28}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(spawns.length > 1 ? `S${i + 1}` : 'S', sx, sy);
  }

  // Goal (burrow)
  const gx = (goal.col + 0.5) * CELL_SIZE;
  const gy = (goal.row + 0.5) * CELL_SIZE;
  ctx.fillStyle = '#6B4226';
  ctx.beginPath();
  ctx.arc(gx, gy, CELL_SIZE * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3d1f0a';
  ctx.beginPath();
  ctx.ellipse(gx, gy, CELL_SIZE * 0.25, CELL_SIZE * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0d9a0';
  ctx.font = `bold ${CELL_SIZE * 0.22}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Burrow', gx, gy + CELL_SIZE * 0.35);
}

function drawTowers(ctx, towers, theme) {
  for (const tower of towers) {
    const cx = (tower.col + 0.5) * CELL_SIZE;
    const cy = (tower.row + 0.5) * CELL_SIZE;

    // Base — water towers get a different base
    if (tower.waterOnly) {
      ctx.fillStyle = theme.waterLight;
    } else {
      ctx.fillStyle = theme.towerBase;
    }
    ctx.fillRect(tower.col * CELL_SIZE, tower.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);

    // Tower body
    ctx.fillStyle = tower.color;
    ctx.beginPath();
    ctx.arc(cx, cy, CELL_SIZE * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Wombat face
    ctx.fillStyle = '#2d1f0e';
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 3, 3, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a3020';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 3, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (tower.showRange && tower.range > 0) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, tower.range * CELL_SIZE, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawEnemies(ctx, enemies) {
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const ex = enemy.x * CELL_SIZE;
    const ey = enemy.y * CELL_SIZE;
    const isSlow = enemy.slowUntil > performance.now();

    switch (enemy.typeId) {
      case 'beetle':
        drawBeetle(ctx, ex, ey, isSlow);
        break;
      case 'spider':
        drawSpider(ctx, ex, ey, isSlow);
        break;
      case 'ant':
      default:
        drawAnt(ctx, ex, ey, isSlow);
        break;
    }

    // HP bar
    const r = CELL_SIZE * 0.3;
    const hpPct = enemy.hp / enemy.maxHp;
    const barW = CELL_SIZE * 0.5;
    const barH = 4;
    const barX = ex - barW / 2;
    const barY = ey - r - 8;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = hpPct > 0.5 ? '#4a6b2a' : hpPct > 0.25 ? '#cc8822' : '#cc2222';
    ctx.fillRect(barX, barY, barW * hpPct, barH);
  }
}

function drawAnt(ctx, ex, ey, isSlow) {
  const color = isSlow ? '#6688bb' : '#884422';
  const r = CELL_SIZE * 0.22;

  // Body segments
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(ex, ey + 4, r * 1.1, r * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ex, ey - 4, r * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Antennae
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ex - 3, ey - 8);
  ctx.lineTo(ex - 8, ey - 14);
  ctx.moveTo(ex + 3, ey - 8);
  ctx.lineTo(ex + 8, ey - 14);
  ctx.stroke();

  // Legs
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    const ly = ey + 2 + i * 5;
    ctx.beginPath();
    ctx.moveTo(ex - r, ly);
    ctx.lineTo(ex - r - 5, ly + 3);
    ctx.moveTo(ex + r, ly);
    ctx.lineTo(ex + r + 5, ly + 3);
    ctx.stroke();
  }

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ex - 3, ey - 5, 2, 0, Math.PI * 2);
  ctx.arc(ex + 3, ey - 5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(ex - 3, ey - 5, 1, 0, Math.PI * 2);
  ctx.arc(ex + 3, ey - 5, 1, 0, Math.PI * 2);
  ctx.fill();
}

function drawBeetle(ctx, ex, ey, isSlow) {
  const color = isSlow ? '#6688bb' : '#336633';
  const r = CELL_SIZE * 0.3;

  // Shell
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(ex, ey, r, r * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing line
  ctx.strokeStyle = isSlow ? '#5577aa' : '#224422';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ex, ey - r * 0.9);
  ctx.lineTo(ex, ey + r * 0.9);
  ctx.stroke();

  // Head
  ctx.fillStyle = isSlow ? '#556699' : '#2a4a2a';
  ctx.beginPath();
  ctx.arc(ex, ey - r * 0.9, r * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Antennae
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ex - 3, ey - r - 2);
  ctx.lineTo(ex - 6, ey - r - 8);
  ctx.moveTo(ex + 3, ey - r - 2);
  ctx.lineTo(ex + 6, ey - r - 8);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ex - 3, ey - r * 0.9, 2, 0, Math.PI * 2);
  ctx.arc(ex + 3, ey - r * 0.9, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawSpider(ctx, ex, ey, isSlow) {
  const color = isSlow ? '#6688bb' : '#444444';
  const r = CELL_SIZE * 0.2;

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(ex, ey, r, 0, Math.PI * 2);
  ctx.fill();

  // Abdomen
  ctx.beginPath();
  ctx.ellipse(ex, ey + r * 1.2, r * 1.2, r * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();

  // 8 Legs
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  const legAngles = [-0.8, -0.4, 0.4, 0.8];
  for (const angle of legAngles) {
    const lx = Math.cos(angle) * (r + 8);
    const ly = Math.sin(angle) * 4;
    // Left legs
    ctx.beginPath();
    ctx.moveTo(ex - r * 0.5, ey + ly);
    ctx.lineTo(ex - lx, ey + ly - 4);
    ctx.lineTo(ex - lx - 2, ey + ly + 4);
    ctx.stroke();
    // Right legs
    ctx.beginPath();
    ctx.moveTo(ex + r * 0.5, ey + ly);
    ctx.lineTo(ex + lx, ey + ly - 4);
    ctx.lineTo(ex + lx + 2, ey + ly + 4);
    ctx.stroke();
  }

  // Eyes (red for spider)
  ctx.fillStyle = isSlow ? '#aaccff' : '#cc2222';
  ctx.beginPath();
  ctx.arc(ex - 3, ey - 2, 2, 0, Math.PI * 2);
  ctx.arc(ex + 3, ey - 2, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawProjectiles(ctx, projectiles) {
  for (const proj of projectiles) {
    ctx.fillStyle = proj.color;
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHoverCell(ctx, state) {
  const { hoverCell, selectedTower, blockedSet, waterSet, wallSet, canAfford, wouldBlock, spawns, goal } = state;
  if (!hoverCell || !selectedTower) return;
  const { col, row } = hoverCell;
  const key = `${col},${row}`;

  const isBlocked = blockedSet.has(key);
  const isWater = waterSet.has(key);
  const isWall = wallSet.has(key);
  const isSpawnOrGoal =
    spawns.some(s => s.col === col && s.row === row) ||
    (col === goal.col && row === goal.row);

  // Placement rules
  let invalid;
  if (selectedTower.waterOnly) {
    // Water tower: must be on water, not already occupied
    invalid = !isWater || isBlocked || isSpawnOrGoal || !canAfford;
  } else {
    // Land tower: can't go on water, walls, existing towers, or spawn/goal
    invalid = isWater || isWall || isBlocked || isSpawnOrGoal || !canAfford || wouldBlock;
  }

  ctx.fillStyle = invalid
    ? 'rgba(200, 50, 50, 0.3)'
    : 'rgba(50, 200, 50, 0.3)';
  ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);

  ctx.strokeStyle = invalid ? '#cc3333' : '#33cc33';
  ctx.lineWidth = 2;
  ctx.strokeRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);

  if (!invalid && selectedTower.range > 0) {
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(
      (col + 0.5) * CELL_SIZE,
      (row + 0.5) * CELL_SIZE,
      selectedTower.range * CELL_SIZE,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
}
