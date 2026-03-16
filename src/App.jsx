import { useRef, useCallback, useState } from "react";
import { COLS, ROWS, CELL_SIZE } from "./game/constants.js";
import { TOWER_TYPES, SELL_REFUND } from "./game/towers.js";
import { MAPS } from "./game/maps.js";
import { useGameLoop } from "./hooks/useGameLoop.js";
import MathChallenge from "./components/MathChallenge.jsx";
import TitleScreen from "./components/TitleScreen.jsx";

const CANVAS_WIDTH = COLS * CELL_SIZE;
const CANVAS_HEIGHT = ROWS * CELL_SIZE;

const TOWER_LIST = [
  "shooter",
  "slow",
  "splash",
  "poison",
  "chain",
  "sniper",
  "money",
  "water",
  "laser",
  "fortress",
  "tesla",
];

const DEFAULT_SETTINGS = {
  timerDuration: 60,
  difficulty: "medium",
  operations: {
    add: true,
    subtract: true,
    multiply: false,
    divide: false,
  },
  background: "classic",
  mapId: "classic",
};

function App() {
  const [screen, setScreen] = useState("title");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [gameKey, setGameKey] = useState(0);

  function handleStart() {
    setGameKey((k) => k + 1);
    setScreen("playing");
  }

  function handleReturnToTitle() {
    setScreen("title");
  }

  if (screen === "title") {
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
    gold,
    lives,
    wave,
    waveActive,
    gameOver,
    showMathChallenge,
    selectedTowerId,
    setSelectedTowerId,
    setHoverCell,
    placeTower,
    sellTower,
    startWave,
    addGold,
    restart,
  } = useGameLoop(canvasRef, settings);

  const getCellFromEvent = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const col = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
    const row = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    return { col, row };
  }, []);

  const handleCanvasClick = useCallback(
    (e) => {
      const cell = getCellFromEvent(e);
      if (cell) placeTower(cell.col, cell.row);
    },
    [getCellFromEvent, placeTower],
  );

  const handleCanvasRightClick = useCallback(
    (e) => {
      e.preventDefault();
      const cell = getCellFromEvent(e);
      if (cell) sellTower(cell.col, cell.row);
    },
    [getCellFromEvent, sellTower],
  );

  const handleCanvasMouseMove = useCallback(
    (e) => {
      const cell = getCellFromEvent(e);
      setHoverCell(cell);
    },
    [getCellFromEvent, setHoverCell],
  );

  const handleCanvasMouseLeave = useCallback(() => {
    setHoverCell(null);
  }, [setHoverCell]);

  const visibleTowers = TOWER_LIST.filter((id) => id !== "water" || hasWater);

  return (
    <div className="flex flex-col w-full h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-brown-medium border-b-2 border-brown-border min-h-[40px] shrink-0 max-md:px-2 max-md:py-1 max-md:min-h-[36px]">
        <h1 className="text-lg font-bold text-gold-text tracking-wide max-md:text-sm">
          Wombat Tower Defence
        </h1>
        <div className="flex gap-3.5 text-sm font-semibold max-md:gap-2 max-md:text-xs">
          <div className="flex items-center gap-1 text-gold">Gold: {gold}</div>
          <div className="flex items-center gap-1 text-red">Lives: {lives}</div>
          <div className="flex items-center gap-1 text-blue">Wave: {wave}</div>
        </div>
        <button
          className="py-1.5 px-4 border-2 border-brown-border rounded-md bg-green-btn text-text text-[13px] font-bold cursor-pointer transition-all duration-150 shrink-0 whitespace-nowrap hover:bg-green-btn-hover hover:border-gold-border disabled:bg-disabled-bg disabled:text-[#666] disabled:cursor-not-allowed"
          onClick={startWave}
          disabled={waveActive || gameOver || showMathChallenge}
        >
          {waveActive
            ? `Wave ${wave}...`
            : showMathChallenge
              ? "Solve math!"
              : `Start Wave ${wave + 1}`}
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0 overflow-auto max-md:flex-col">
        {/* Game board */}
        <div className="flex-1 flex items-center justify-center p-2 min-w-0 max-md:flex-none max-md:p-1">
          <canvas
            ref={canvasRef}
            className="border-2 border-brown-border rounded cursor-pointer [image-rendering:pixelated]"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
            }}
            onClick={handleCanvasClick}
            onContextMenu={handleCanvasRightClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
          />
        </div>

        {/* Side panel */}
        <div className="w-[180px] shrink-0 bg-brown-medium border-l-2 border-brown-border p-2 flex flex-col gap-1.5 max-md:w-full max-md:border-l-0 max-md:border-t-2 max-md:px-3 max-md:py-2">
          <h2 className="text-[13px] font-bold text-gold-text text-center mb-0.5">
            Towers
          </h2>
          <div className="grid grid-cols-4 gap-1 max-md:grid-cols-6 max-[480px]:grid-cols-4">
            {visibleTowers.map((id) => {
              const def = TOWER_TYPES[id];
              const canAfford = gold >= def.cost;
              const isSelected = selectedTowerId === id;
              return (
                <div
                  key={id}
                  className={`flex flex-col items-center gap-0.5 py-[3px] px-[2px] border-2 rounded-md cursor-pointer transition-all duration-[120ms]
                    ${
                      isSelected
                        ? "border-gold bg-selected shadow-[0_0_6px_rgba(255,215,0,0.35)]"
                        : "border-brown-border bg-brown-dark hover:border-gold-border hover:bg-hover"
                    }
                    ${!canAfford ? "opacity-35 !cursor-not-allowed" : ""}`}
                  onClick={() =>
                    canAfford && setSelectedTowerId(isSelected ? null : id)
                  }
                  onMouseEnter={() => setHoveredTower(id)}
                  onMouseLeave={() => setHoveredTower(null)}
                >
                  <div
                    className="w-6 h-6 rounded-full relative"
                    style={{ background: def.color }}
                  >
                    {def.waterOnly && (
                      <span className="absolute -bottom-0.5 -right-1 text-[10px] font-bold leading-none text-water">
                        ~
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-gold">
                    {def.cost}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hover tooltip */}
          {hoveredTower && (
            <div className="bg-brown-dark border-2 border-gold-border rounded-md py-1.5 px-2 mt-0.5 max-md:hidden">
              <div className="text-xs font-bold text-gold-text">
                {TOWER_TYPES[hoveredTower].name}
              </div>
              <div className="text-[10px] text-gold mb-0.5">
                {TOWER_TYPES[hoveredTower].cost}g
              </div>
              <div className="text-[10px] text-text-muted leading-tight">
                {TOWER_TYPES[hoveredTower].desc}
              </div>
              {TOWER_TYPES[hoveredTower].range > 0 && (
                <div className="text-[9px] text-blue mt-px">
                  Range: {TOWER_TYPES[hoveredTower].range}
                </div>
              )}
              {TOWER_TYPES[hoveredTower].damage > 0 && (
                <div className="text-[9px] text-blue mt-px">
                  Dmg: {TOWER_TYPES[hoveredTower].damage}
                </div>
              )}
            </div>
          )}

          <div className="text-[9px] text-text-hint text-center">
            Right-click tower to sell ({Math.round(SELL_REFUND * 100)}%)
          </div>
        </div>
      </div>

      {showMathChallenge && (
        <MathChallenge wave={wave} onComplete={addGold} settings={settings} />
      )}

      {gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
          <div className="bg-brown-medium border-[3px] border-gold-border rounded-xl py-6 px-9 text-center">
            <h2 className="text-[28px] font-bold text-red mb-2.5">Game Over</h2>
            <p className="text-base text-text mb-5">
              You survived {wave} wave{wave !== 1 ? "s" : ""}!
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="py-2.5 px-6 border-2 border-gold-border rounded-md bg-green-btn text-text text-[15px] font-bold cursor-pointer hover:bg-green-btn-hover"
                onClick={onReturnToTitle}
              >
                Main Menu
              </button>
              <button
                className="py-2.5 px-6 border-2 border-gold-border rounded-md bg-green-btn text-text text-[15px] font-bold cursor-pointer hover:bg-green-btn-hover"
                onClick={restart}
              >
                Quick Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
