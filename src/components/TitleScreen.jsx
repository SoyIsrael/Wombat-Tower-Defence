import { useRef, useEffect } from 'react';
import { THEMES } from '../game/renderer.js';
import { MAPS, MAP_LIST } from '../game/maps.js';
import { COLS, ROWS, CELL_SIZE } from '../game/constants.js';

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
    <div className="fixed inset-0 bg-brown-dark flex items-start justify-center z-[200] overflow-auto p-5">
      <div className="bg-brown-medium border-[3px] border-gold-border rounded-2xl py-6 px-7 max-w-[540px] w-full m-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div>
            <div className="relative w-[60px] h-[60px] mx-auto">
              <div className="absolute w-[18px] h-[24px] bg-wombat rounded-[50%_50%_40%_40%] top-0 left-[6px]" />
              <div className="absolute w-[18px] h-[24px] bg-wombat rounded-[50%_50%_40%_40%] top-0 right-[6px]" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[52px] h-[44px] bg-wombat rounded-full flex items-center justify-center flex-wrap">
                <div className="w-2 h-2 bg-[#222] rounded-full absolute top-[14px] left-3" />
                <div className="w-2 h-2 bg-[#222] rounded-full absolute top-[14px] right-3" />
                <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 w-3 h-2 bg-wombat-nose rounded-full" />
              </div>
            </div>
          </div>
          <h1 className="text-[28px] font-bold text-gold-text mt-2 mb-1.5 tracking-wide">Wombat Tower Defence</h1>
          <p className="text-[15px] text-text-muted">Defend the burrow! Solve fractions to earn gold!</p>
        </div>

        <div className="flex flex-col gap-3.5 mb-5">
          {/* Map */}
          <div>
            <h3 className="text-sm font-bold text-gold-text mb-2 uppercase tracking-[0.5px]">Map</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {MAP_LIST.map((mapId) => {
                const m = MAPS[mapId];
                const isActive = settings.mapId === mapId;
                return (
                  <button
                    key={mapId}
                    className={`flex flex-col items-center gap-1 py-2 px-1.5 border-2 rounded-md bg-brown-dark cursor-pointer transition-all duration-150 ${
                      isActive
                        ? 'border-gold shadow-[0_0_8px_rgba(255,215,0,0.3)]'
                        : 'border-brown-border hover:border-gold-border'
                    }`}
                    onClick={() => update('mapId', mapId)}
                  >
                    <MapPreview map={m} background={settings.background} />
                    <span className={`text-[11px] font-semibold ${isActive ? 'text-gold' : 'text-text-muted'}`}>
                      {m.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timer */}
          <div>
            <h3 className="text-sm font-bold text-gold-text mb-2 uppercase tracking-[0.5px]">Math Timer</h3>
            <div className="flex gap-1.5">
              {TIMER_PRESETS.map((t) => {
                const isActive = settings.timerDuration === t;
                return (
                  <button
                    key={t}
                    className={`flex-1 py-2 px-1 border-2 rounded-md text-sm font-semibold cursor-pointer transition-all duration-150 ${
                      isActive
                        ? 'border-gold bg-selected text-gold'
                        : 'border-brown-border bg-brown-dark text-text-muted hover:border-gold-border hover:text-text'
                    }`}
                    onClick={() => update('timerDuration', t)}
                  >
                    {t === 0 ? 'None' : `${t}s`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <h3 className="text-sm font-bold text-gold-text mb-2 uppercase tracking-[0.5px]">Difficulty</h3>
            <div className="flex gap-1.5">
              {DIFFICULTIES.map((d) => {
                const isActive = settings.difficulty === d;
                return (
                  <button
                    key={d}
                    className={`flex-1 py-2 px-1 border-2 rounded-md text-sm font-semibold cursor-pointer transition-all duration-150 ${
                      isActive
                        ? 'border-gold bg-selected text-gold'
                        : 'border-brown-border bg-brown-dark text-text-muted hover:border-gold-border hover:text-text'
                    }`}
                    onClick={() => update('difficulty', d)}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-text-hint mt-1">
              {settings.difficulty === 'easy' && 'Small denominators (2-6)'}
              {settings.difficulty === 'medium' && 'Medium denominators (2-12)'}
              {settings.difficulty === 'hard' && 'Large denominators (2-20)'}
            </p>
          </div>

          {/* Operations */}
          <div>
            <h3 className="text-sm font-bold text-gold-text mb-2 uppercase tracking-[0.5px]">Operations</h3>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.entries(OP_LABELS).map(([key, { symbol, label }]) => {
                const enabled = settings.operations[key];
                const enabledCount = Object.values(settings.operations).filter(Boolean).length;
                const isLast = enabled && enabledCount <= 1;
                return (
                  <button
                    key={key}
                    className={`flex flex-col items-center gap-1 py-2.5 px-1 border-2 rounded-md cursor-pointer transition-all duration-150 ${
                      enabled
                        ? 'border-gold bg-selected text-text'
                        : 'border-brown-border bg-brown-dark text-text-placeholder hover:border-gold-border'
                    } ${isLast ? '!cursor-not-allowed opacity-70' : ''}`}
                    onClick={() => toggleOp(key)}
                    title={isLast ? 'At least one operation required' : label}
                  >
                    <span className="text-[22px] font-bold">{symbol}</span>
                    <span className="text-[10px]">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background */}
          <div>
            <h3 className="text-sm font-bold text-gold-text mb-2 uppercase tracking-[0.5px]">Background</h3>
            <div className="grid grid-cols-5 gap-1.5">
              {Object.entries(THEMES).map(([key, theme]) => {
                const isActive = settings.background === key;
                return (
                  <button
                    key={key}
                    className={`flex flex-col items-center gap-1 py-2 px-1 border-2 rounded-md bg-brown-dark cursor-pointer transition-all duration-150 ${
                      isActive
                        ? 'border-gold shadow-[0_0_8px_rgba(255,215,0,0.3)]'
                        : 'border-brown-border hover:border-gold-border'
                    }`}
                    onClick={() => update('background', key)}
                  >
                    <div className="flex w-full h-6 rounded-sm overflow-hidden">
                      <div className="flex-1" style={{ background: theme.preview[0] }} />
                      <div className="flex-1" style={{ background: theme.preview[1] }} />
                    </div>
                    <span className={`text-[11px] ${isActive ? 'text-gold' : 'text-text-muted'}`}>
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          className="block w-full py-3.5 border-2 border-gold-border rounded-lg bg-green-btn text-gold-text text-xl font-bold cursor-pointer transition-all duration-150 tracking-wide hover:bg-green-btn-hover hover:border-gold"
          onClick={onStart}
        >
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
      className="w-full h-auto rounded-sm [image-rendering:pixelated]"
    />
  );
}
