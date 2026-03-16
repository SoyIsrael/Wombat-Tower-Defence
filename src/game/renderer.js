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
  drawProjectiles(ctx, state.projectiles, state.enemies);
  drawInspectedHighlight(ctx, state);
  drawHoverCell(ctx, state);
}

function drawInspectedHighlight(ctx, state) {
  if (!state.inspectedTowerId) return;
  const tower = state.towers.find(t => t.id === state.inspectedTowerId);
  if (!tower) return;

  const x = tower.col * CELL_SIZE;
  const y = tower.row * CELL_SIZE;
  const cx = x + CELL_SIZE / 2;
  const cy = y + CELL_SIZE / 2;

  // Highlight border
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);

  // Range circle
  if (tower.range > 0) {
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, tower.range * CELL_SIZE, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 215, 0, 0.05)';
    ctx.beginPath();
    ctx.arc(cx, cy, tower.range * CELL_SIZE, 0, Math.PI * 2);
    ctx.fill();
  }
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
  const now = performance.now();
  for (const tower of towers) {
    const cx = (tower.col + 0.5) * CELL_SIZE;
    const cy = (tower.row + 0.5) * CELL_SIZE;
    const x = tower.col * CELL_SIZE;
    const y = tower.row * CELL_SIZE;
    const r = CELL_SIZE * 0.35;

    // Base tile
    ctx.fillStyle = tower.waterOnly ? theme.waterLight : theme.towerBase;
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

    // Dispatch per tower type for unique visuals
    switch (tower.typeId) {
      case 'shooter': drawShooterWombat(ctx, cx, cy, r, tower, now); break;
      case 'slow': drawFreezerWombat(ctx, cx, cy, r, tower, now); break;
      case 'splash': drawSplashWombat(ctx, cx, cy, r, tower, now); break;
      case 'sniper': drawSniperWombat(ctx, cx, cy, r, tower, now); break;
      case 'chain': drawChainWombat(ctx, cx, cy, r, tower, now); break;
      case 'poison': drawPoisonWombat(ctx, cx, cy, r, tower, now); break;
      case 'money': drawMinerWombat(ctx, cx, cy, r, tower, now); break;
      case 'water': drawWaterWombat(ctx, cx, cy, r, tower, now); break;
      case 'laser': drawLaserWombat(ctx, cx, cy, r, tower, now); break;
      case 'fortress': drawFortressWombat(ctx, cx, cy, r, tower, now); break;
      case 'tesla': drawTeslaWombat(ctx, cx, cy, r, tower, now); break;
      default: drawBaseWombat(ctx, cx, cy, r, tower.color, tower.accent); break;
    }

    // Upgrade level pips (3 small bars at bottom of cell)
    if (tower.upgrades) {
      const pipColors = ['#ff6b6b', '#8ecae6', '#4aff4a'];
      const pipY = y + CELL_SIZE - 5;
      const pipW = (CELL_SIZE - 8) / 3;
      for (let p = 0; p < 3; p++) {
        const level = tower.upgrades[p];
        if (level === 0) continue;
        const px = x + 3 + p * (pipW + 1);
        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(px, pipY, pipW, 3);
        // Fill based on level (1-4)
        ctx.fillStyle = pipColors[p];
        ctx.fillRect(px, pipY, pipW * (level / 4), 3);
      }
    }

    // High-tier glow effect (T3+ on any path)
    if (tower.upgrades) {
      const maxLevel = Math.max(...tower.upgrades);
      if (maxLevel >= 3) {
        const glowAlpha = maxLevel >= 4 ? 0.2 : 0.1;
        const glowSize = maxLevel >= 4 ? 6 : 3;
        ctx.fillStyle = `rgba(255, 215, 0, ${glowAlpha})`;
        ctx.beginPath();
        ctx.arc(cx, cy, r + glowSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (tower.showRange && tower.range > 0) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, tower.range * CELL_SIZE, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// --- Shared wombat base ---
function drawBaseWombat(ctx, cx, cy, r, color, accent) {
  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Ears
  ctx.fillStyle = accent || color;
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.6, cy - r * 0.75, r * 0.3, r * 0.45, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.6, cy - r * 0.75, r * 0.3, r * 0.45, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 2, 3.5, 0, Math.PI * 2);
  ctx.arc(cx + 5, cy - 2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 2, 2, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy - 2, 2, 0, Math.PI * 2);
  ctx.fill();
  // Nose
  ctx.fillStyle = '#4a3020';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5, 4, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
}

// --- Per-tower-type wombats ---

function drawShooterWombat(ctx, cx, cy, r, tower, now) {
  drawBaseWombat(ctx, cx, cy, r, tower.color, tower.accent);
  // Crosshair on forehead
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 1.5;
  const hx = cx, hy = cy - r * 0.55;
  ctx.beginPath();
  ctx.arc(hx, hy, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hx - 6, hy); ctx.lineTo(hx + 6, hy);
  ctx.moveTo(hx, hy - 6); ctx.lineTo(hx, hy + 6);
  ctx.stroke();
}

function drawFreezerWombat(ctx, cx, cy, r, tower, now) {
  drawBaseWombat(ctx, cx, cy, r, tower.color, tower.accent);
  // Snowflake sparkles around
  ctx.fillStyle = '#ccedff';
  const sparklePhase = (now / 600) % (Math.PI * 2);
  for (let i = 0; i < 4; i++) {
    const angle = sparklePhase + (i * Math.PI / 2);
    const sx = cx + Math.cos(angle) * (r + 4);
    const sy = cy + Math.sin(angle) * (r + 4);
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Ice crystal on forehead
  ctx.strokeStyle = '#88ccff';
  ctx.lineWidth = 1.5;
  const ix = cx, iy = cy - r * 0.5;
  ctx.beginPath();
  ctx.moveTo(ix, iy - 5); ctx.lineTo(ix, iy + 5);
  ctx.moveTo(ix - 4, iy - 2.5); ctx.lineTo(ix + 4, iy + 2.5);
  ctx.moveTo(ix - 4, iy + 2.5); ctx.lineTo(ix + 4, iy - 2.5);
  ctx.stroke();
}

function drawSplashWombat(ctx, cx, cy, r, tower, now) {
  drawBaseWombat(ctx, cx, cy, r, tower.color, tower.accent);
  // Explosion star on forehead
  ctx.fillStyle = '#ff8844';
  const sx = cx, sy = cy - r * 0.45;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const pr = i % 2 === 0 ? 6 : 3;
    const px = sx + Math.cos(angle) * pr;
    const py = sy + Math.sin(angle) * pr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  // Angry brows
  ctx.strokeStyle = '#661100';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - 6); ctx.lineTo(cx - 3, cy - 4);
  ctx.moveTo(cx + 8, cy - 6); ctx.lineTo(cx + 3, cy - 4);
  ctx.stroke();
}

function drawSniperWombat(ctx, cx, cy, r, tower, now) {
  drawBaseWombat(ctx, cx, cy, r, tower.color, tower.accent);
  // Scope / monocle on one eye
  ctx.strokeStyle = '#aabbcc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx + 5, cy - 2, 5.5, 0, Math.PI * 2);
  ctx.stroke();
  // Scope arm
  ctx.beginPath();
  ctx.moveTo(cx + 10, cy - 2);
  ctx.lineTo(cx + r + 2, cy - 2);
  ctx.stroke();
  // Hat/beret
  ctx.fillStyle = '#445566';
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.7, r * 0.8, r * 0.3, -0.15, 0, Math.PI * 2);
  ctx.fill();
}

function drawChainWombat(ctx, cx, cy, r, tower, now) {
  drawBaseWombat(ctx, cx, cy, r, tower.color, tower.accent);
  // Lightning bolt on forehead
  ctx.fillStyle = '#ffdd00';
  const bx = cx, by = cy - r * 0.5;
  ctx.beginPath();
  ctx.moveTo(bx - 2, by - 6);
  ctx.lineTo(bx + 3, by - 1);
  ctx.lineTo(bx, by - 1);
  ctx.lineTo(bx + 2, by + 6);
  ctx.lineTo(bx - 3, by + 1);
  ctx.lineTo(bx, by + 1);
  ctx.closePath();
  ctx.fill();
  // Electric sparks
  ctx.strokeStyle = '#cc88ff';
  ctx.lineWidth = 1;
  const sparkPhase = (now / 400) % (Math.PI * 2);
  for (let i = 0; i < 3; i++) {
    const angle = sparkPhase + (i * Math.PI * 2 / 3);
    const sx1 = cx + Math.cos(angle) * r;
    const sy1 = cy + Math.sin(angle) * r;
    const sx2 = cx + Math.cos(angle) * (r + 6);
    const sy2 = cy + Math.sin(angle) * (r + 6);
    ctx.beginPath();
    ctx.moveTo(sx1, sy1);
    ctx.lineTo((sx1 + sx2) / 2 + 3, (sy1 + sy2) / 2);
    ctx.lineTo(sx2, sy2);
    ctx.stroke();
  }
}

function drawPoisonWombat(ctx, cx, cy, r, tower, now) {
  drawBaseWombat(ctx, cx, cy, r, tower.color, tower.accent);
  // Skull/crossbones on forehead
  ctx.fillStyle = '#ddff88';
  const sx = cx, sy = cy - r * 0.5;
  ctx.beginPath();
  ctx.arc(sx, sy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a5510';
  ctx.beginPath();
  ctx.arc(sx - 1.5, sy - 1, 1, 0, Math.PI * 2);
  ctx.arc(sx + 1.5, sy - 1, 1, 0, Math.PI * 2);
  ctx.fill();
  // Drip bubbles
  ctx.fillStyle = 'rgba(136, 221, 68, 0.6)';
  const dripPhase = (now / 800) % 1;
  ctx.beginPath();
  ctx.arc(cx - 6, cy + r + 2 + dripPhase * 6, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 5, cy + r + 4 + ((dripPhase + 0.5) % 1) * 6, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawMinerWombat(ctx, cx, cy, r, tower, now) {
  drawBaseWombat(ctx, cx, cy, r, tower.color, tower.accent);
  // Hard hat
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.55, r * 0.75, r * 0.25, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ee9900';
  ctx.fillRect(cx - r * 0.85, cy - r * 0.55, r * 1.7, 3);
  // Pickaxe
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.3, cy + r * 0.8);
  ctx.lineTo(cx + r + 4, cy - r * 0.2);
  ctx.stroke();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx + r + 4, cy - r * 0.2);
  ctx.lineTo(cx + r + 8, cy - r * 0.5);
  ctx.stroke();
  // Gold sparkle
  ctx.fillStyle = '#ffd700';
  const sparkle = Math.sin(now / 500) * 0.5 + 0.5;
  ctx.globalAlpha = sparkle;
  ctx.beginPath();
  ctx.arc(cx - r * 0.5, cy + r * 0.5, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawWaterWombat(ctx, cx, cy, r, tower, now) {
  drawBaseWombat(ctx, cx, cy, r, tower.color, tower.accent);
  // Snorkel
  ctx.strokeStyle = '#ff6644';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.3, cy + 2);
  ctx.lineTo(cx + r + 2, cy + 2);
  ctx.lineTo(cx + r + 2, cy - r - 2);
  ctx.stroke();
  // Snorkel tip
  ctx.fillStyle = '#ff6644';
  ctx.beginPath();
  ctx.arc(cx + r + 2, cy - r - 2, 3, 0, Math.PI * 2);
  ctx.fill();
  // Water ripples
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  const ripplePhase = (now / 1000) % 1;
  const rippleR = r * 0.8 + ripplePhase * r * 0.6;
  ctx.globalAlpha = 1 - ripplePhase;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.3, rippleR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawLaserWombat(ctx, cx, cy, r, tower, now) {
  drawBaseWombat(ctx, cx, cy, r, tower.color, tower.accent);
  // Visor / laser goggles
  ctx.fillStyle = '#ff3377';
  ctx.globalAlpha = 0.7;
  ctx.fillRect(cx - 8, cy - 5, 16, 4);
  ctx.globalAlpha = 1;
  // Lens flare
  const flare = Math.sin(now / 150) * 0.4 + 0.6;
  ctx.fillStyle = `rgba(255, 51, 119, ${flare})`;
  ctx.beginPath();
  ctx.arc(cx - 5, cy - 3, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + 5, cy - 3, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Rapid-fire lines radiating
  ctx.strokeStyle = '#ff66aa';
  ctx.lineWidth = 1;
  const phase = (now / 100) % (Math.PI * 2);
  for (let i = 0; i < 6; i++) {
    const angle = phase + (i * Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * (r + 1), cy + Math.sin(angle) * (r + 1));
    ctx.lineTo(cx + Math.cos(angle) * (r + 5), cy + Math.sin(angle) * (r + 5));
    ctx.stroke();
  }
}

function drawFortressWombat(ctx, cx, cy, r, tower, now) {
  // Draw a slightly bigger body for the fortress
  drawBaseWombat(ctx, cx, cy, r * 1.1, tower.color, tower.accent);
  // Helmet with crest
  ctx.fillStyle = '#998855';
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.6, r * 0.9, r * 0.35, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // Helmet crest
  ctx.fillStyle = '#bbaa66';
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 1.1);
  ctx.lineTo(cx - 3, cy - r * 0.6);
  ctx.lineTo(cx + 3, cy - r * 0.6);
  ctx.closePath();
  ctx.fill();
  // Shield emblem on body
  ctx.strokeStyle = '#ccaa44';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy + 1);
  ctx.lineTo(cx, cy + 8);
  ctx.lineTo(cx + 5, cy + 1);
  ctx.lineTo(cx + 5, cy - 3);
  ctx.lineTo(cx - 5, cy - 3);
  ctx.closePath();
  ctx.stroke();
}

function drawTeslaWombat(ctx, cx, cy, r, tower, now) {
  drawBaseWombat(ctx, cx, cy, r, tower.color, tower.accent);
  // Tesla coil on head
  ctx.strokeStyle = '#88aaff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.3);
  ctx.lineTo(cx, cy - r - 6);
  ctx.stroke();
  // Coil top sphere
  ctx.fillStyle = '#6688ff';
  ctx.beginPath();
  ctx.arc(cx, cy - r - 6, 4, 0, Math.PI * 2);
  ctx.fill();
  // Electric arcs from coil
  ctx.strokeStyle = '#aaccff';
  ctx.lineWidth = 1;
  const arcPhase = (now / 250) % (Math.PI * 2);
  for (let i = 0; i < 5; i++) {
    const angle = arcPhase + (i * Math.PI * 2 / 5);
    const ax = cx + Math.cos(angle) * 7;
    const ay = (cy - r - 6) + Math.sin(angle) * 7;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r - 6);
    ctx.lineTo(ax + (Math.random() - 0.5) * 3, ay + (Math.random() - 0.5) * 3);
    ctx.stroke();
  }
  // Body glow
  ctx.fillStyle = 'rgba(100, 136, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemies(ctx, enemies) {
  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;
    const ex = enemy.x * CELL_SIZE;
    const ey = enemy.y * CELL_SIZE;
    const now = performance.now();
    const isSlow = enemy.slowUntil > now;
    const isPoisoned = enemy.poisonUntil && enemy.poisonUntil > now;

    const drawType = enemy.baseType || enemy.typeId;
    switch (drawType) {
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

    // Armor overlay
    if (enemy.armored) {
      drawArmorOverlay(ctx, ex, ey, drawType);
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

    // Armor indicator
    if (enemy.armored) {
      ctx.fillStyle = '#aab0bb';
      ctx.strokeStyle = '#667';
      ctx.lineWidth = 1;
      const ax = barX - 8;
      const ay = barY - 1;
      // Tiny shield icon
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + 5, ay);
      ctx.lineTo(ax + 5, ay + 4);
      ctx.lineTo(ax + 2.5, ay + 6);
      ctx.lineTo(ax, ay + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Poison indicator
    if (isPoisoned) {
      ctx.fillStyle = 'rgba(100, 220, 50, 0.5)';
      ctx.beginPath();
      ctx.arc(ex + barW / 2 + 4, barY + 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawArmorOverlay(ctx, ex, ey, baseType) {
  ctx.strokeStyle = '#c0c8d4';
  ctx.lineWidth = 1.5;

  if (baseType === 'ant') {
    const r = CELL_SIZE * 0.22;
    // Metallic plates on body segments
    ctx.fillStyle = 'rgba(180, 190, 210, 0.45)';
    ctx.beginPath();
    ctx.ellipse(ex, ey + 4, r * 0.9, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Head plate
    ctx.beginPath();
    ctx.arc(ex, ey - 4, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Rivet dots
    ctx.fillStyle = '#dde';
    ctx.beginPath();
    ctx.arc(ex - 4, ey + 4, 1.2, 0, Math.PI * 2);
    ctx.arc(ex + 4, ey + 4, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (baseType === 'beetle') {
    const r = CELL_SIZE * 0.3;
    // Heavy shell plating
    ctx.fillStyle = 'rgba(180, 190, 210, 0.4)';
    ctx.beginPath();
    ctx.ellipse(ex, ey, r * 0.85, r * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Cross brace
    ctx.strokeStyle = '#99a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ex, ey - r * 0.7);
    ctx.lineTo(ex, ey + r * 0.7);
    ctx.moveTo(ex - r * 0.6, ey);
    ctx.lineTo(ex + r * 0.6, ey);
    ctx.stroke();
    // Corner rivets
    ctx.fillStyle = '#dde';
    for (const [dx, dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
      ctx.beginPath();
      ctx.arc(ex + dx * r * 0.5, ey + dy * r * 0.5, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (baseType === 'spider') {
    const r = CELL_SIZE * 0.2;
    // Head plate
    ctx.fillStyle = 'rgba(180, 190, 210, 0.45)';
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Abdomen plate
    ctx.beginPath();
    ctx.ellipse(ex, ey + r * 1.2, r * 0.95, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Rivets
    ctx.fillStyle = '#dde';
    ctx.beginPath();
    ctx.arc(ex, ey + r * 1.2, 1.2, 0, Math.PI * 2);
    ctx.fill();
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

function drawProjectiles(ctx, projectiles, enemies) {
  for (const proj of projectiles) {
    if (proj.isChainArc) {
      // Chain lightning arc — draw as a flickering jagged line to target
      const target = enemies.find(e => e.id === proj.targetId && e.hp > 0);
      if (!target) continue;
      const tx = target.x * CELL_SIZE;
      const ty = target.y * CELL_SIZE;
      ctx.strokeStyle = proj.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(proj.x, proj.y);
      // Jagged midpoints for lightning effect
      const segments = 3;
      for (let s = 1; s < segments; s++) {
        const frac = s / segments;
        const mx = proj.x + (tx - proj.x) * frac + (Math.random() - 0.5) * 12;
        const my = proj.y + (ty - proj.y) * frac + (Math.random() - 0.5) * 12;
        ctx.lineTo(mx, my);
      }
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.globalAlpha = 1;
      continue;
    }

    // Glow effect for special projectiles
    if (proj.tower.typeId === 'sniper') {
      // Sniper tracer — elongated
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(proj.x, proj.y, 6, 2, Math.atan2(proj.y, proj.x), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.tower.typeId === 'poison') {
      // Poison glob
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
      ctx.fill();
      // Trail drip
      ctx.fillStyle = 'rgba(136, 221, 68, 0.3)';
      ctx.beginPath();
      ctx.arc(proj.x - 3, proj.y + 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.tower.typeId === 'chain') {
      // Electric orb
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(204, 136, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.tower.typeId === 'water') {
      // Tidal wave projectile
      ctx.fillStyle = 'rgba(68, 221, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#44ddff';
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
      ctx.fill();
      // Wave crest lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 5, -0.8, 0.8);
      ctx.stroke();
    } else {
      // Default projectile
      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
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

// --- Tower preview for shop icons ---
export function drawTowerPreview(ctx, typeId, towerDef, size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const now = performance.now();
  const tower = { ...towerDef, typeId };

  ctx.clearRect(0, 0, size, size);

  switch (typeId) {
    case 'shooter': drawShooterWombat(ctx, cx, cy, r, tower, now); break;
    case 'slow': drawFreezerWombat(ctx, cx, cy, r, tower, now); break;
    case 'splash': drawSplashWombat(ctx, cx, cy, r, tower, now); break;
    case 'sniper': drawSniperWombat(ctx, cx, cy, r, tower, now); break;
    case 'chain': drawChainWombat(ctx, cx, cy, r, tower, now); break;
    case 'poison': drawPoisonWombat(ctx, cx, cy, r, tower, now); break;
    case 'money': drawMinerWombat(ctx, cx, cy, r, tower, now); break;
    case 'water': drawWaterWombat(ctx, cx, cy, r, tower, now); break;
    case 'laser': drawLaserWombat(ctx, cx, cy, r, tower, now); break;
    case 'fortress': drawFortressWombat(ctx, cx, cy, r, tower, now); break;
    case 'tesla': drawTeslaWombat(ctx, cx, cy, r, tower, now); break;
    default: drawBaseWombat(ctx, cx, cy, r, towerDef.color, towerDef.accent); break;
  }
}
