import { useRef, useCallback, useState } from 'react';
import { COLS, ROWS, CELL_SIZE } from './game/constants.js';
import { TOWER_TYPES } from './game/towers.js';
import { MAPS } from './game/maps.js';
import { useGameLoop } from './hooks/useGameLoop.js';
import MathChallenge from './components/MathChallenge.jsx';
import TitleScreen from './components/TitleScreen.jsx';
import './App.css';

const CANVAS_WIDTH = COLS * CELL_SIZE;
const CANVAS_HEIGHT = ROWS * CELL_SIZE;

const TOWER_LIST = ['shooter', 'slow', 'splash', 'money', 'water'];

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

  const {
    gold, lives, wave, waveActive, gameOver,
    showMathChallenge,
    selectedTowerId, setSelectedTowerId,
    setHoverCell,
    placeTower, startWave, addGold, restart,
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

  const handleCanvasMouseMove = useCallback((e) => {
    const cell = getCellFromEvent(e);
    setHoverCell(cell);
  }, [getCellFromEvent, setHoverCell]);

  const handleCanvasMouseLeave = useCallback(() => {
    setHoverCell(null);
  }, [setHoverCell]);

  // Filter tower list: only show water tower if map has water
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
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
          />
        </div>

        <div className="side-panel">
          <h2>Towers</h2>
          {visibleTowers.map((id) => {
            const def = TOWER_TYPES[id];
            const canAfford = gold >= def.cost;
            return (
              <div
                key={id}
                className={`tower-option ${selectedTowerId === id ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}`}
                onClick={() => canAfford && setSelectedTowerId(selectedTowerId === id ? null : id)}
              >
                <div
                  className="tower-icon"
                  style={{ background: def.color }}
                />
                <span className="tower-name">{def.name}</span>
                <span className="tower-cost">{def.cost}g</span>
                <span className="tower-desc">{def.desc}</span>
              </div>
            );
          })}

          <button
            className="wave-button"
            onClick={startWave}
            disabled={waveActive || gameOver || showMathChallenge}
          >
            {waveActive
              ? `Wave ${wave} in progress...`
              : showMathChallenge
                ? 'Complete math first!'
                : `Start Wave ${wave + 1}`}
          </button>
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
