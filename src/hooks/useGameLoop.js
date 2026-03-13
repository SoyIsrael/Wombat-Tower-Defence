import { useRef, useCallback, useEffect, useState } from 'react';
import { COLS, ROWS, CELL_SIZE, STARTING_GOLD, STARTING_LIVES } from '../game/constants.js';
import { TOWER_TYPES, createTower } from '../game/towers.js';
import { createEnemy, getEnemyCountForWave, getSpawnInterval, getEnemyTypesForWave } from '../game/enemies.js';
import { computePaths, wouldBlockPath, tracePathFrom } from '../game/pathfinding.js';
import { updateEnemies, updateTowers, updateProjectiles } from '../game/gameLogic.js';
import { render } from '../game/renderer.js';
import { MAPS, getMapBlockedSet, getWaterSet, getWallSet } from '../game/maps.js';

export function useGameLoop(canvasRef, settings) {
  const [gold, setGold] = useState(STARTING_GOLD);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [wave, setWave] = useState(0);
  const [waveActive, setWaveActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showMathChallenge, setShowMathChallenge] = useState(false);
  const [selectedTowerId, setSelectedTowerId] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);

  const settingsRef = useRef(settings);
  const map = MAPS[settings.mapId] || MAPS.classic;
  const mapBlockedSet = useRef(getMapBlockedSet(map)).current;
  const waterSet = useRef(getWaterSet(map)).current;
  const wallSet = useRef(getWallSet(map)).current;

  const stateRef = useRef({
    gold: STARTING_GOLD,
    lives: STARTING_LIVES,
    wave: 0,
    towers: [],
    enemies: [],
    projectiles: [],
    towerBlockedSet: new Set(),
    paths: null,
    prevGrid: null,
    pathSet: new Set(),
    waveActive: false,
    waveEnemiesLeft: 0,
    lastSpawn: 0,
    spawnInterval: 800,
    gameOver: false,
    selectedTowerId: null,
    hoverCell: null,
  });

  const animRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Build the full blocked set (map tiles + player towers)
  function getFullBlockedSet() {
    const set = new Set(mapBlockedSet);
    for (const key of stateRef.current.towerBlockedSet) set.add(key);
    return set;
  }

  // Recompute paths and store results
  function recomputePaths() {
    const s = stateRef.current;
    const fullBlocked = getFullBlockedSet();
    const result = computePaths(fullBlocked, map.spawns, map.goal);
    if (result) {
      s.paths = result.paths;
      s.prevGrid = result.prevGrid;
      // Build pathSet as union of all paths
      const pathSet = new Set();
      for (const path of result.paths.values()) {
        for (const p of path) pathSet.add(`${p.col},${p.row}`);
      }
      s.pathSet = pathSet;
    }
    return result;
  }

  // Initialize paths
  useEffect(() => {
    recomputePaths();
  }, []);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { stateRef.current.selectedTowerId = selectedTowerId; }, [selectedTowerId]);
  useEffect(() => { stateRef.current.hoverCell = hoverCell; }, [hoverCell]);

  const placeTower = useCallback((col, row) => {
    const s = stateRef.current;
    if (s.gameOver) return;
    if (!s.selectedTowerId) return;

    const def = TOWER_TYPES[s.selectedTowerId];
    if (s.gold < def.cost) return;

    const key = `${col},${row}`;

    // Can't place on existing towers
    if (s.towerBlockedSet.has(key)) return;

    // Can't place on spawn or goal
    if (map.spawns.some(sp => sp.col === col && sp.row === row)) return;
    if (col === map.goal.col && row === map.goal.row) return;

    // Water placement rules
    const isWater = waterSet.has(key);
    const isWall = wallSet.has(key);

    if (def.waterOnly) {
      if (!isWater) return; // water tower must go on water
    } else {
      if (isWater || isWall) return; // land tower can't go on water or walls
      // Check path blocking
      const fullBlocked = getFullBlockedSet();
      if (wouldBlockPath(fullBlocked, col, row, map.spawns, map.goal)) return;
    }

    const tower = createTower(s.selectedTowerId, col, row);
    s.towers.push(tower);

    // Water towers don't block land pathfinding (water tiles already blocked)
    if (!def.waterOnly) {
      s.towerBlockedSet.add(key);
      // Recalculate paths
      const result = recomputePaths();
      if (result) {
        // Re-path all enemies
        for (const enemy of s.enemies) {
          const enemyCell = {
            col: Math.floor(enemy.x),
            row: Math.floor(enemy.y),
          };
          const newPath = tracePathFrom(enemyCell, result.prevGrid);
          if (newPath && newPath.length > 1) {
            enemy.path = newPath;
            enemy.pathIndex = 0;
          }
        }
      }
    }

    s.gold -= def.cost;
    setGold(s.gold);
  }, [map, mapBlockedSet, waterSet, wallSet]);

  const startWave = useCallback(() => {
    const s = stateRef.current;
    if (s.waveActive || s.gameOver) return;
    s.wave++;
    s.waveActive = true;
    s.waveEnemiesLeft = getEnemyCountForWave(s.wave);
    s.spawnInterval = getSpawnInterval(s.wave);
    s.lastSpawn = 0;
    setWave(s.wave);
    setWaveActive(true);
  }, []);

  const addGold = useCallback((amount) => {
    const s = stateRef.current;
    s.gold += amount;
    setGold(s.gold);
    setShowMathChallenge(false);
  }, []);

  const restart = useCallback(() => {
    const s = stateRef.current;
    s.gold = STARTING_GOLD;
    s.lives = STARTING_LIVES;
    s.wave = 0;
    s.towers = [];
    s.enemies = [];
    s.projectiles = [];
    s.towerBlockedSet = new Set();
    s.waveActive = false;
    s.waveEnemiesLeft = 0;
    s.gameOver = false;
    s.selectedTowerId = null;
    recomputePaths();
    setGold(STARTING_GOLD);
    setLives(STARTING_LIVES);
    setWave(0);
    setWaveActive(false);
    setGameOver(false);
    setShowMathChallenge(false);
    setSelectedTowerId(null);
  }, []);

  // Game loop
  useEffect(() => {
    const loop = (timestamp) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;
      const s = stateRef.current;
      const now = performance.now();

      if (!s.gameOver) {
        // Spawn enemies
        if (s.waveActive && s.waveEnemiesLeft > 0 && now - s.lastSpawn >= s.spawnInterval) {
          const spawnIndex = s.waveEnemiesLeft % map.spawns.length;
          const spawn = map.spawns[spawnIndex];
          const pathKey = `${spawn.col},${spawn.row}`;
          const path = s.paths?.get(pathKey);
          if (path) {
            const types = getEnemyTypesForWave(s.wave);
            const type = types[Math.floor(Math.random() * types.length)];
            const enemy = createEnemy(s.wave, [...path], type.id);
            s.enemies.push(enemy);
            s.waveEnemiesLeft--;
            s.lastSpawn = now;
          }
        }

        // Check wave complete
        if (s.waveActive && s.waveEnemiesLeft === 0 && s.enemies.length === 0) {
          s.waveActive = false;
          setWaveActive(false);
          setShowMathChallenge(true);
        }

        // Update enemies
        const { alive, reached } = updateEnemies(s.enemies, dt);
        s.enemies = alive;
        if (reached.length > 0) {
          s.lives -= reached.length;
          setLives(s.lives);
          if (s.lives <= 0) {
            s.lives = 0;
            s.gameOver = true;
            setGameOver(true);
            setLives(0);
          }
        }

        // Update towers
        const goldEarned = updateTowers(s.towers, s.enemies, s.projectiles, now);
        if (goldEarned > 0) {
          s.gold += goldEarned;
          setGold(s.gold);
        }

        // Update projectiles
        const projResult = updateProjectiles(s.projectiles, s.enemies, dt);
        s.projectiles = projResult.alive;
        if (projResult.kills.length > 0) {
          for (const killed of projResult.kills) {
            s.enemies = s.enemies.filter(e => e.id !== killed.id);
          }
        }
      }

      // Render
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const selectedTower = s.selectedTowerId ? TOWER_TYPES[s.selectedTowerId] : null;
        const hover = s.hoverCell;
        let wouldBlockVal = false;
        let canAfford = true;
        if (hover && selectedTower) {
          canAfford = s.gold >= selectedTower.cost;
          const key = `${hover.col},${hover.row}`;
          if (!selectedTower.waterOnly &&
              !s.towerBlockedSet.has(key) &&
              !waterSet.has(key) &&
              !wallSet.has(key) &&
              !map.spawns.some(sp => sp.col === hover.col && sp.row === hover.row) &&
              !(hover.col === map.goal.col && hover.row === map.goal.row)) {
            const fullBlocked = getFullBlockedSet();
            wouldBlockVal = wouldBlockPath(fullBlocked, hover.col, hover.row, map.spawns, map.goal);
          }
        }
        render(ctx, {
          towers: s.towers,
          enemies: s.enemies,
          projectiles: s.projectiles,
          paths: s.paths,
          pathSet: s.pathSet,
          blockedSet: s.towerBlockedSet,
          waterSet,
          wallSet,
          spawns: map.spawns,
          goal: map.goal,
          hoverCell: hover,
          selectedTower,
          canAfford,
          wouldBlock: wouldBlockVal,
          background: settingsRef.current.background,
        });
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [canvasRef, map, mapBlockedSet, waterSet, wallSet]);

  return {
    gold, lives, wave, waveActive, gameOver,
    showMathChallenge,
    selectedTowerId, setSelectedTowerId,
    hoverCell, setHoverCell,
    placeTower, startWave, addGold, restart,
    stateRef,
  };
}
