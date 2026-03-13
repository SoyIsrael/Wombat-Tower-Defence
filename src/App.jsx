import { useRef, useCallback, useState } from 'react';
import { COLS, ROWS, CELL_SIZE } from './game/constants.js';
import { TOWER_TYPES, SELL_REFUND } from './game/towers.js';
import { MAPS } from './game/maps.js';
import { useGameLoop } from './hooks/useGameLoop.js';
import MathChallenge from './components/MathChallenge.jsx';
import TitleScreen from './components/TitleScreen.jsx';
import './App.css';

const CANVAS_WIDTH = COLS * CELL_SIZE;
const CANVAS_HEIGHT = ROWS * CELL_SIZE;

const TOWER_LIST = [
  'shooter', 'slow', 'splash', 'poison', 'chain', 'sniper',
  'money', 'water',
  'laser', 'fortress', 'tesla',
];

const DEFAULT_SETTINGS = {
  timerDuration: 60,
  difficulty: 'medium',
  operations: {
    add: true,
    subtract: true,
    multiply: false,
    divide: false,
  },
  background: 'classic',
  mapId: 'classic',
};

function App() {
  const [screen, setScreen] = useState('title');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameKey, setGameKey] = useState(0);

  function handleStart() {
    setGameKey(k => k + 1);
    setScreen('playing');
  }

  function handleReturnToTitle() {
    setScreen('title');
  }

  if (screen === 'title') {
    return (
      <TitleScreen
        settings={settings}
        onSettingsChange={setSettings}
        onStart={handleStart}
      />
    );
  }

  return (
    <GameView
      key={gameKey}
      settings={settings}
      onReturnToTitle={handleReturnToTitle}
    />
  );
}

function GameView({ settings, onReturnToTitle }) {
  const canvasRef = useRef(null);
  const map = MAPS[settings.mapId] || MAPS.classic;
  const hasWater = map.water.length > 0;
  const [hoveredTower, setHoveredTower] = useState(null);

  const {
    gold, lives, wave, waveActive, gameOver,
    showMathChallenge,
    selectedTowerId, setSelectedTowerId,
    setHoverCell,
    placeTower, sellTower, startWave, addGold, restart,
  } = useGameLoop(canvasRef, settings);

  const getCellFromEvent = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const col = Math.floor((e.clientX - rect.left) * scaleX / CELL_SIZE);
    const row = Math.floor((e.clientY - rect.top) * scaleY / CELL_SIZE);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    return { col, row };
  }, []);

  const handleCanvasClick = useCallback((e) => {
    const cell = getCellFromEvent(e);
    if (cell) placeTower(cell.col, cell.row);
  }, [getCellFromEvent, placeTower]);

  const handleCanvasRightClick = useCallback((e) => {
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (cell) sellTower(cell.col, cell.row);
  }, [getCellFromEvent, sellTower]);

  const handleCanvasMouseMove = useCallback((e) => {
    const cell = getCellFromEvent(e);
    setHoverCell(cell);
  }, [getCellFromEvent, setHoverCell]);

  const handleCanvasMouseLeave = useCallback(() => {
    setHoverCell(null);
  }, [setHoverCell]);

  const visibleTowers = TOWER_LIST.filter(id =>
    id !== 'water' || hasWater
  );

  return (
    <div className="game-container">
      <div className="top-bar">
        <h1>Wombat Tower Defence</h1>
        <div className="stats">
          <div className="stat stat-gold">Gold: {gold}</div>
          <div className="stat stat-lives">Lives: {lives}</div>
          <div className="stat stat-wave">Wave: {wave}</div>
        </div>
        <button
          className="wave-button"
          onClick={startWave}
          disabled={waveActive || gameOver || showMathChallenge}
        >
          {waveActive
            ? `Wave ${wave}...`
            : showMathChallenge
              ? 'Solve math!'
              : `Start Wave ${wave + 1}`}
        </button>
      </div>

      <div className="main-area">
        <div className="game-board-wrapper">
          <canvas
            ref={canvasRef}
            className="game-canvas"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
            }}
            onClick={handleCanvasClick}
            onContextMenu={handleCanvasRightClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
          />
        </div>

        <div className="side-panel">
          <h2>Towers</h2>
          <div className="tower-grid">
            {visibleTowers.map((id) => {
              const def = TOWER_TYPES[id];
              const canAfford = gold >= def.cost;
              return (
                <div
                  key={id}
                  className={`tower-cell ${selectedTowerId === id ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}`}
                  onClick={() => canAfford && setSelectedTowerId(selectedTowerId === id ? null : id)}
                  onMouseEnter={() => setHoveredTower(id)}
                  onMouseLeave={() => setHoveredTower(null)}
                >
                  <div className="tower-cell-icon" style={{ background: def.color }}>
                    {def.waterOnly && <span className="tower-badge water-badge">~</span>}
                  </div>
                  <span className="tower-cell-cost">{def.cost}</span>
                </div>
              );
            })}
          </div>

          {/* Hover tooltip */}
          {hoveredTower && (
            <div className="tower-tooltip">
              <div className="tt-name">{TOWER_TYPES[hoveredTower].name}</div>
              <div className="tt-cost">{TOWER_TYPES[hoveredTower].cost}g</div>
              <div className="tt-desc">{TOWER_TYPES[hoveredTower].desc}</div>
              {TOWER_TYPES[hoveredTower].range > 0 && (
                <div className="tt-stat">Range: {TOWER_TYPES[hoveredTower].range}</div>
              )}
              {TOWER_TYPES[hoveredTower].damage > 0 && (
                <div className="tt-stat">Dmg: {TOWER_TYPES[hoveredTower].damage}</div>
              )}
            </div>
          )}

          <div className="sell-hint">Right-click tower to sell ({Math.round(SELL_REFUND * 100)}%)</div>
        </div>
      </div>

      {showMathChallenge && (
        <MathChallenge wave={wave} onComplete={addGold} settings={settings} />
      )}

      {gameOver && (
        <div className="game-over-overlay">
          <div className="game-over-box">
            <h2>Game Over</h2>
            <p>You survived {wave} wave{wave !== 1 ? 's' : ''}!</p>
            <div className="game-over-buttons">
              <button onClick={onReturnToTitle}>Main Menu</button>
              <button onClick={restart}>Quick Restart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
