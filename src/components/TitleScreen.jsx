import { useRef, useEffect } from 'react';
import { THEMES } from '../game/renderer.js';
import { MAPS, MAP_LIST } from '../game/maps.js';
import { COLS, ROWS, CELL_SIZE } from '../game/constants.js';
import './TitleScreen.css';

const TIMER_PRESETS = [30, 60, 90, 120, 0];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const OP_LABELS = {
  add: { symbol: '+', label: 'Addition' },
  subtract: { symbol: '-', label: 'Subtraction' },
  multiply: { symbol: '\u00d7', label: 'Multiplication' },
  divide: { symbol: '\u00f7', label: 'Division' },
};

export default function TitleScreen({ settings, onSettingsChange, onStart }) {
  function update(key, value) {
    onSettingsChange({ ...settings, [key]: value });
  }

  function toggleOp(op) {
    const ops = { ...settings.operations };
    const enabledCount = Object.values(ops).filter(Boolean).length;
    if (ops[op] && enabledCount <= 1) return;
    ops[op] = !ops[op];
    update('operations', ops);
  }

  return (
    <div className="title-overlay">
      <div className="title-box">
        <div className="title-header">
          <div className="title-wombat">
            <div className="wombat-face">
              <div className="wombat-ear left" />
              <div className="wombat-ear right" />
              <div className="wombat-head">
                <div className="wombat-eye left" />
                <div className="wombat-eye right" />
                <div className="wombat-nose" />
              </div>
            </div>
          </div>
          <h1>Wombat Tower Defence</h1>
          <p className="title-subtitle">Defend the burrow! Solve fractions to earn gold!</p>
        </div>

        <div className="settings-grid">
          {/* Map */}
          <div className="setting-group">
            <h3>Map</h3>
            <div className="map-row">
              {MAP_LIST.map((mapId) => {
                const m = MAPS[mapId];
                return (
                  <button
                    key={mapId}
                    className={`map-btn ${settings.mapId === mapId ? 'active' : ''}`}
                    onClick={() => update('mapId', mapId)}
                  >
                    <MapPreview map={m} background={settings.background} />
                    <span className="map-name">{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timer */}
          <div className="setting-group">
            <h3>Math Timer</h3>
            <div className="preset-row">
              {TIMER_PRESETS.map((t) => (
                <button
                  key={t}
                  className={`preset-btn ${settings.timerDuration === t ? 'active' : ''}`}
                  onClick={() => update('timerDuration', t)}
                >
                  {t === 0 ? 'None' : `${t}s`}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="setting-group">
            <h3>Difficulty</h3>
            <div className="preset-row">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  className={`preset-btn ${settings.difficulty === d ? 'active' : ''}`}
                  onClick={() => update('difficulty', d)}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
            <p className="setting-hint">
              {settings.difficulty === 'easy' && 'Small denominators (2-6)'}
              {settings.difficulty === 'medium' && 'Medium denominators (2-12)'}
              {settings.difficulty === 'hard' && 'Large denominators (2-20)'}
            </p>
          </div>

          {/* Operations */}
          <div className="setting-group">
            <h3>Operations</h3>
            <div className="ops-row">
              {Object.entries(OP_LABELS).map(([key, { symbol, label }]) => {
                const enabled = settings.operations[key];
                const enabledCount = Object.values(settings.operations).filter(Boolean).length;
                const isLast = enabled && enabledCount <= 1;
                return (
                  <button
                    key={key}
                    className={`op-btn ${enabled ? 'active' : ''} ${isLast ? 'last-op' : ''}`}
                    onClick={() => toggleOp(key)}
                    title={isLast ? 'At least one operation required' : label}
                  >
                    <span className="op-symbol">{symbol}</span>
                    <span className="op-label">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background */}
          <div className="setting-group">
            <h3>Background</h3>
            <div className="bg-row">
              {Object.entries(THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  className={`bg-btn ${settings.background === key ? 'active' : ''}`}
                  onClick={() => update('background', key)}
                >
                  <div className="bg-preview">
                    <div className="bg-swatch" style={{ background: theme.preview[0] }} />
                    <div className="bg-swatch" style={{ background: theme.preview[1] }} />
                  </div>
                  <span className="bg-label">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className="start-btn" onClick={onStart}>
          Start Game
        </button>
      </div>
    </div>
  );
}

// Mini canvas preview of a map
function MapPreview({ map, background }) {
  const canvasRef = useRef(null);
  const theme = THEMES[background] || THEMES.classic;
  const scale = 4; // pixels per cell
  const w = COLS * scale;
  const h = ROWS * scale;

  const waterSet = new Set(map.water.map(t => `${t.col},${t.row}`));
  const wallSet = new Set(map.walls.map(t => `${t.col},${t.row}`));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const key = `${c},${r}`;
        if (waterSet.has(key)) {
          ctx.fillStyle = theme.water;
        } else if (wallSet.has(key)) {
          ctx.fillStyle = theme.wall;
        } else {
          ctx.fillStyle = theme.grass[0];
        }
        ctx.fillRect(c * scale, r * scale, scale, scale);
      }
    }

    // Spawns
    ctx.fillStyle = '#cc4422';
    for (const s of map.spawns) {
      ctx.fillRect(s.col * scale, s.row * scale, scale, scale);
    }

    // Goal
    ctx.fillStyle = '#6B4226';
    ctx.fillRect(map.goal.col * scale, map.goal.row * scale, scale, scale);
  }, [map, background, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      className="map-preview-canvas"
    />
  );
}
