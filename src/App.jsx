import { useRef, useCallback, useState, useEffect } from "react";
import { COLS, ROWS, CELL_SIZE } from "./game/constants.js";
import { TOWER_TYPES, SELL_REFUND } from "./game/towers.js";
import { MAPS } from "./game/maps.js";
import { useGameLoop } from "./hooks/useGameLoop.js";
import { drawTowerPreview } from "./game/renderer.js";
import { TOWER_UPGRADES, canUpgradePath, getUpgradeCost, getUpgradeTier } from "./game/upgrades.js";
import MathChallenge from "./components/MathChallenge.jsx";
import TitleScreen from "./components/TitleScreen.jsx";

const CANVAS_WIDTH = COLS * CELL_SIZE;
const CANVAS_HEIGHT = ROWS * CELL_SIZE;

const TOWER_LIST = [
  "shooter", "slow", "splash", "poison", "chain", "sniper",
  "money", "water", "laser", "fortress", "tesla",
];

const PATH_LABELS = ["Top", "Middle", "Bottom"];
const PATH_KEYS = ["top", "middle", "bottom"];
const PATH_COLORS = ["#ff6b6b", "#8ecae6", "#4aff4a"];

const DEFAULT_SETTINGS = {
  timerDuration: 60,
  difficulty: "medium",
  operations: { add: true, subtract: true, multiply: false, divide: false },
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
      onReturnToTitle={() => setScreen("title")}
    />
  );
}

function GameView({ settings, onReturnToTitle }) {
  const canvasRef = useRef(null);
  const map = MAPS[settings.mapId] || MAPS.classic;
  const hasWater = map.water.length > 0;
  const [hoveredTower, setHoveredTower] = useState(null);
  const [inspectedTowerId, setInspectedTowerId] = useState(null);
  const [, forceUpdate] = useState(0);
  const [draggingTowerId, setDraggingTowerId] = useState(null);
  const [dragPos, setDragPos] = useState(null);

  const {
    gold, lives, wave, waveActive, gameOver,
    showMathChallenge,
    selectedTowerId, setSelectedTowerId,
    setHoverCell,
    placeTower, sellTower, upgradeTower, startWave, addGold, restart,
    stateRef,
  } = useGameLoop(canvasRef, settings);

  // Sync inspected tower to render state
  useEffect(() => {
    stateRef.current.inspectedTowerId = inspectedTowerId;
  }, [inspectedTowerId, stateRef]);

  // Find the inspected tower instance
  const inspectedTower = inspectedTowerId
    ? stateRef.current.towers.find((t) => t.id === inspectedTowerId)
    : null;

  // Clear inspection if tower was sold
  useEffect(() => {
    if (inspectedTowerId && !stateRef.current.towers.find((t) => t.id === inspectedTowerId)) {
      setInspectedTowerId(null);
    }
  });

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
      if (!cell) return;

      // Check if clicking on a placed tower to inspect it
      const tower = stateRef.current.towers.find(
        (t) => t.col === cell.col && t.row === cell.row
      );
      if (tower) {
        setInspectedTowerId(tower.id);
        setSelectedTowerId(null);
      } else {
        setInspectedTowerId(null);
      }
    },
    [getCellFromEvent, setSelectedTowerId, stateRef],
  );

  // Drag-and-drop: track pointer globally while dragging
  useEffect(() => {
    if (!draggingTowerId) return;

    function onPointerMove(e) {
      setDragPos({ x: e.clientX, y: e.clientY });
      // Update hover cell if over canvas
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const col = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
      const row = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);
      if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
        setHoverCell({ col, row });
      } else {
        setHoverCell(null);
      }
    }

    function onPointerUp(e) {
      // Try to place on canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;
        const col = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
        const row = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);
        if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
          // Temporarily set selected tower for placeTower to use
          stateRef.current.selectedTowerId = draggingTowerId;
          placeTower(col, row);
          stateRef.current.selectedTowerId = null;
        }
      }
      setDraggingTowerId(null);
      setDragPos(null);
      setHoverCell(null);
      setSelectedTowerId(null);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [draggingTowerId, placeTower, setHoverCell, setSelectedTowerId, stateRef]);

  const handleCanvasRightClick = useCallback(
    (e) => {
      e.preventDefault();
      const cell = getCellFromEvent(e);
      if (cell) {
        sellTower(cell.col, cell.row);
        setInspectedTowerId(null);
      }
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

  function handleUpgrade(pathIndex) {
    if (!inspectedTower) return;
    upgradeTower(inspectedTower.id, pathIndex);
    forceUpdate((n) => n + 1);
  }

  function handleSellInspected() {
    if (!inspectedTower) return;
    sellTower(inspectedTower.col, inspectedTower.row);
    setInspectedTowerId(null);
  }

  const handleDragStart = useCallback((towerId, e) => {
    const def = TOWER_TYPES[towerId];
    if (stateRef.current.gold < def.cost) return;
    setDraggingTowerId(towerId);
    setSelectedTowerId(towerId);
    setInspectedTowerId(null);
    setDragPos({ x: e.clientX, y: e.clientY });
  }, [setSelectedTowerId, stateRef]);

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
      <div className="flex flex-1 min-h-0 overflow-auto max-md:flex-col max-md:overflow-hidden">
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
        <div className="w-[210px] shrink-0 bg-brown-medium border-l-2 border-brown-border p-2 flex flex-col gap-1.5 max-md:w-full max-md:border-l-0 max-md:border-t-2 max-md:px-3 max-md:py-2">
          {inspectedTower ? (
            <UpgradePanel
              tower={inspectedTower}
              gold={gold}
              onUpgrade={handleUpgrade}
              onSell={handleSellInspected}
              onClose={() => setInspectedTowerId(null)}
            />
          ) : (
            <ShopPanel
              visibleTowers={visibleTowers}
              gold={gold}
              hoveredTower={hoveredTower}
              setHoveredTower={setHoveredTower}
              onDragStart={handleDragStart}
            />
          )}
        </div>
      </div>

      {showMathChallenge && (
        <MathChallenge wave={wave} onComplete={addGold} settings={settings} />
      )}

      {draggingTowerId && dragPos && (
        <div
          className="fixed pointer-events-none z-[200]"
          style={{ left: dragPos.x - 24, top: dragPos.y - 24 }}
        >
          <TowerIcon typeId={draggingTowerId} />
        </div>
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

// ─── Shop Panel ───

function ShopPanel({ visibleTowers, gold, hoveredTower, setHoveredTower, onDragStart }) {
  return (
    <>
      <h2 className="text-[13px] font-bold text-gold-text text-center shrink-0">Towers</h2>
      <div className="overflow-y-auto min-h-0 flex-1 max-md:overflow-x-auto max-md:overflow-y-hidden">
        <div className="grid grid-cols-2 gap-1 max-md:grid-cols-4 max-[480px]:grid-cols-3">
          {visibleTowers.map((id) => {
            const def = TOWER_TYPES[id];
            const canAfford = gold >= def.cost;
            return (
              <div
                key={id}
                className={`flex flex-col items-center gap-0.5 py-1 px-1 border-2 rounded-md transition-all duration-[120ms] select-none
                  border-brown-border bg-brown-dark hover:border-gold-border hover:bg-hover
                  ${canAfford ? "cursor-grab active:cursor-grabbing" : "opacity-35 !cursor-not-allowed"}`}
                onPointerDown={(e) => {
                  if (canAfford) {
                    e.preventDefault();
                    onDragStart(id, e);
                  }
                }}
                onMouseEnter={() => setHoveredTower(id)}
                onMouseLeave={() => setHoveredTower(null)}
                draggable={false}
              >
                <TowerIcon typeId={id} />
                <span className="text-[10px] font-semibold text-gold-text leading-tight">{def.name}</span>
                <span className="text-[9px] font-bold text-gold">{def.cost}g</span>
              </div>
            );
          })}
        </div>
      </div>

      {hoveredTower && (
        <div className="bg-brown-dark border-2 border-gold-border rounded-md py-1.5 px-2 mt-0.5 shrink-0 max-md:hidden">
          <div className="text-xs font-bold text-gold-text">{TOWER_TYPES[hoveredTower].name}</div>
          <div className="text-[10px] text-gold mb-0.5">{TOWER_TYPES[hoveredTower].cost}g</div>
          <div className="text-[10px] text-text-muted leading-tight">{TOWER_TYPES[hoveredTower].desc}</div>
          {TOWER_TYPES[hoveredTower].range > 0 && (
            <div className="text-[9px] text-blue mt-px">Range: {TOWER_TYPES[hoveredTower].range}</div>
          )}
          {TOWER_TYPES[hoveredTower].damage > 0 && (
            <div className="text-[9px] text-blue mt-px">Dmg: {TOWER_TYPES[hoveredTower].damage}</div>
          )}
        </div>
      )}

      <div className="text-[9px] text-text-hint text-center shrink-0">
        Drag tower onto the board to place
      </div>
    </>
  );
}

// ─── Upgrade Panel ───

function UpgradePanel({ tower, gold, onUpgrade, onSell, onClose }) {
  const upgradeDef = TOWER_UPGRADES[tower.typeId];
  if (!upgradeDef) return null;

  const refund = Math.floor(tower.totalSpent * SELL_REFUND);

  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto min-h-0 flex-1">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <TowerIcon typeId={tower.typeId} />
          <div>
            <div className="text-xs font-bold text-gold-text">{tower.name}</div>
            <div className="text-[9px] text-text-muted">
              Invested: {tower.totalSpent}g
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[10px] text-text-muted hover:text-text cursor-pointer px-1"
        >
          Back
        </button>
      </div>

      {/* Current stats */}
      <div className="text-[9px] text-text-muted bg-brown-dark rounded px-1.5 py-1 shrink-0">
        {tower.damage > 0 && <span className="mr-2">Dmg: {tower.damage}</span>}
        {tower.range > 0 && <span className="mr-2">Rng: {tower.range}</span>}
        {tower.cooldown > 0 && <span>CD: {tower.cooldown}ms</span>}
      </div>

      {/* 3 Upgrade paths */}
      {PATH_KEYS.map((pathKey, pathIndex) => {
        const pathDef = upgradeDef[pathKey];
        const level = tower.upgrades[pathIndex];
        const canUpgrade = canUpgradePath(tower, pathIndex);
        const nextTier = level < 4 ? pathDef[level] : null;
        const cost = nextTier ? nextTier.cost : 0;
        const canAfford = gold >= cost;

        // Is this path locked? (third path when 2 others are used)
        const upgradedPaths = tower.upgrades.filter((l) => l > 0).length;
        const isThirdPathLocked = level === 0 && upgradedPaths >= 2 &&
          !tower.upgrades.some((l, i) => i === pathIndex && l > 0);

        // Is this path capped at 2? (another path is >2)
        const otherAbove2 = tower.upgrades.some((l, i) => i !== pathIndex && l > 2);
        const isCapped = otherAbove2 && level >= 2;

        return (
          <div key={pathKey} className="border border-brown-border rounded-md p-1.5 bg-brown-dark shrink-0">
            {/* Path label */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold" style={{ color: PATH_COLORS[pathIndex] }}>
                {PATH_LABELS[pathIndex]}
              </span>
              <span className="text-[9px] text-text-muted">Lv {level}/4</span>
            </div>

            {/* Tier pips */}
            <div className="flex gap-[3px] mb-1">
              {[0, 1, 2, 3].map((tier) => {
                const tierDef = pathDef[tier];
                const purchased = tier < level;
                const isNext = tier === level && canUpgrade && !isThirdPathLocked && !isCapped;
                return (
                  <div
                    key={tier}
                    className={`flex-1 h-[6px] rounded-sm ${
                      purchased
                        ? ""
                        : isNext
                          ? "border border-dashed border-gold-border"
                          : "bg-[#1a1208]"
                    }`}
                    style={purchased ? { backgroundColor: PATH_COLORS[pathIndex] } : undefined}
                    title={tierDef.name}
                  />
                );
              })}
            </div>

            {/* Next upgrade info or status */}
            {isThirdPathLocked ? (
              <div className="text-[9px] text-[#666] italic">Locked (2 paths max)</div>
            ) : isCapped ? (
              <div className="text-[9px] text-[#666] italic">Capped at Lv 2</div>
            ) : level >= 4 ? (
              <div className="text-[9px] text-green-bright font-bold">MAX</div>
            ) : nextTier ? (
              <button
                className={`w-full text-left py-0.5 px-1 rounded text-[9px] transition-colors cursor-pointer ${
                  canAfford && canUpgrade
                    ? "bg-green-btn/30 hover:bg-green-btn/50 text-text"
                    : "bg-[#1a1208] text-[#666] !cursor-not-allowed"
                }`}
                onClick={() => canAfford && canUpgrade && onUpgrade(pathIndex)}
                disabled={!canAfford || !canUpgrade}
              >
                <div className="font-bold text-gold-text">{nextTier.name}</div>
                <div className="text-text-muted">{nextTier.desc}</div>
                <div className={`font-bold ${canAfford ? "text-gold" : "text-red"}`}>
                  {cost}g
                </div>
              </button>
            ) : null}
          </div>
        );
      })}

      {/* Sell button */}
      <button
        className="mt-auto shrink-0 py-1 px-2 border border-red/50 rounded-md bg-red/10 text-red text-[11px] font-bold cursor-pointer hover:bg-red/20 transition-colors"
        onClick={onSell}
      >
        Sell ({refund}g)
      </button>
    </div>
  );
}

// ─── Tower Icon ───

const ICON_SIZE = 48;

function TowerIcon({ typeId }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const def = TOWER_TYPES[typeId];
    if (!def) return;
    drawTowerPreview(ctx, typeId, def, ICON_SIZE);
  }, [typeId]);

  return (
    <canvas
      ref={canvasRef}
      width={ICON_SIZE}
      height={ICON_SIZE}
      className="w-9 h-9"
    />
  );
}

export default App;
