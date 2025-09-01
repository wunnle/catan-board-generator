import React, { useMemo, useState } from "react";
import { COLORS, HOT } from './constants.js';
import { pipValue } from './utils.js';
import { COORDS, axialToPixel, hexPolygonPoints, hexCorner } from './hexGrid.js';
import { generateResources, generateNumbers } from './boardGenerator.js';
export default function CatanBoardGenerator() {
  const [resourceSeed, setResourceSeed] = useState(() => Math.random());
  const [numberSeed, setNumberSeed] = useState(() => Math.random());
  const [showCornerScores, setShowCornerScores] = useState(false);
  const [noSameNeighbors, setNoSameNeighbors] = useState(true);
  const [preventSameResources, setPreventSameResources] = useState(false);
  const [keepDesertCenter, setKeepDesertCenter] = useState(false);

  const [pipMin, setPipMin] = useState(2);
  const [pipMax, setPipMax] = useState(13);

  // Layered recompute: resources first, then numbers
  const resLayer = useMemo(
    () => generateResources({ preventSameResources, keepDesertCenter }),
    [resourceSeed, preventSameResources, keepDesertCenter]
  );

  const numsLayer = useMemo(
    () => generateNumbers({
      desertIndex: resLayer.desertIndex,
      pipMin,
      pipMax,
      noSameNeighbors,
    }),
    [numberSeed, resLayer.desertIndex, pipMin, pipMax, noSameNeighbors]
  );

  const board = useMemo(() => {
    const placements = Array(19).fill(null).map(() => ({ resource: "", number: null }));
    for (let i = 0; i < 19; i++) {
      placements[i].resource = resLayer.resources[i];
      placements[i].number = numsLayer.numbers[i];
    }
    const breakdown = {
      hotAdj: numsLayer.bd.hotAdj,
      sameNumAdj: numsLayer.bd.sameNumAdj,
      sameResAdj: resLayer.resViolations,
      pipBelow: numsLayer.bd.pipBelow,
      pipAbove: numsLayer.bd.pipAbove,
      total: numsLayer.bd.hotAdj + numsLayer.bd.sameNumAdj + resLayer.resViolations + numsLayer.bd.pipBelow + numsLayer.bd.pipAbove,
    };
    return {
      tiles: placements,
      desertIndex: resLayer.desertIndex,
      breakdown,
      hotTiles: numsLayer.hotTiles,
      sameNumTiles: numsLayer.sameNumTiles,
      sameResTiles: resLayer.sameResTiles,
      pipBelowKeys: numsLayer.pipBelowKeys,
      pipAboveKeys: numsLayer.pipAboveKeys,
    };
  }, [resLayer, numsLayer]);

  const size = 50;
  const centers = COORDS.map(({ q, r }) => axialToPixel(q, r, size));

  // Normalize viewBox
  const xs = centers.map((c) => c.x);
  const ys = centers.map((c) => c.y);
  const minX = Math.min(...xs) - size * 1.2;
  const maxX = Math.max(...xs) + size * 1.2;
  const minY = Math.min(...ys) - size * 1.2;
  const maxY = Math.max(...ys) + size * 1.2;
  const width = maxX - minX;
  const height = maxY - minY;

  function regenerateAll() {
    setResourceSeed(Math.random());
    setNumberSeed(Math.random());
  }

  // Corner scores for rendering
  const vertexMap = new Map();
  centers.forEach(({ x, y }, i) => {
    const n = board.tiles[i].number;
    const val = pipValue(n);
    for (let k = 0; k < 6; k++) {
      const v = hexCorner(x, y, size, k);
      const key = `${Math.round((v.x/size) * 10) / 10},${Math.round((v.y/size) * 10) / 10}`;
      const prev = vertexMap.get(key) || { x: v.x, y: v.y, score: 0, tiles: 0 };
      vertexMap.set(key, { x: prev.x, y: prev.y, score: prev.score + val, tiles: prev.tiles + 1 });
    }
  });

  return (
    <>
      <div className="container">
        <header className="header">
          <h1 className="title">Catan Board Generator</h1>
          <div className="button-group">
            <button
              className="btn"
              onClick={regenerateAll}
              title="Shuffle resources and numbers"
            >
              Regenerate
            </button>
          </div>
        </header>
        <div className="controls">
          <label className="checkbox-label">
            <input type="checkbox" checked={noSameNeighbors} onChange={(e) => setNoSameNeighbors(e.target.checked)} />
            Prevent identical neighboring numbers
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={preventSameResources} onChange={(e) => setPreventSameResources(e.target.checked)} />
            Prevent neighboring resources
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={keepDesertCenter} onChange={(e) => setKeepDesertCenter(e.target.checked)} />
            Keep desert in the center
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={showCornerScores} onChange={(e) => setShowCornerScores(e.target.checked)} />
            Show corner scores
          </label>

          <div className="pip-bounds">
            <div className="input-group">
              <button 
                className="input-btn" 
                onClick={() => setPipMin(Math.max(2, pipMin - 1))}
                disabled={pipMin <= 2}
              >
                −
              </button>
              <input
                type="number"
                min={2}
                max={6}
                value={pipMin}
                onChange={(e) => {
                  const v = Math.max(2, Math.min(pipMax, Number(e.target.value)));
                  setPipMin(v);
                }}
                className="number-input"
              />
              <button 
                className="input-btn" 
                onClick={() => setPipMin(Math.min(pipMax, pipMin + 1))}
                disabled={pipMin >= pipMax}
              >
                +
              </button>
            </div>
            <span>≤ corner scores ≤</span>
            <div className="input-group">
              <button 
                className="input-btn" 
                onClick={() => setPipMax(Math.max(pipMin, pipMax - 1))}
                disabled={pipMax <= pipMin}
              >
                −
              </button>
              <input
                type="number"
                min={6}
                max={13}
                value={pipMax}
                onChange={(e) => {
                  const v = Math.max(pipMin, Math.min(13, Number(e.target.value)));
                  setPipMax(v);
                }}
                className="number-input"
              />
              <button 
                className="input-btn" 
                onClick={() => setPipMax(Math.min(13, pipMax + 1))}
                disabled={pipMax >= 13}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
        <svg
          viewBox={`${minX} ${minY} ${width} ${height}`}
          className="board"
        >
          <defs>
            <pattern id="desertPattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
              <rect width="8" height="8" fill="#ffffff" />
              <line x1="0" y1="0" x2="0" y2="8" stroke="#e0e0e0" strokeWidth="2" />
            </pattern>
          </defs>

          <rect x={minX} y={minY} width={width} height={height} fill="#f5f5f5" rx={12} />

          {board.tiles.map((tile, i) => {
            const { x, y } = centers[i];
            const poly = hexPolygonPoints(x, y, size);
            const baseFill = COLORS[tile.resource] ?? "#ccc";
            let fill = baseFill;
            if (tile.resource === "desert") fill = "url(#desertPattern)";

            // Determine violation styling for tiles
            const hotBad = board.hotTiles.has(i);
            const sameNumBad = board.sameNumTiles.has(i);
            const sameResBad = board.sameResTiles.has(i);

            // Violation styling priority: hot (red) > same number (orange) > same resource (purple dashed)
            let stroke = "#333";
            let strokeWidth = 1.5;
            let dash = undefined;
            if (sameResBad) { stroke = "#7B1FA2"; strokeWidth = 2.5; dash = "6 4"; }
            if (sameNumBad) { stroke = "#EF6C00"; strokeWidth = 3; dash = undefined; }
            if (hotBad)      { stroke = "#C62828"; strokeWidth = 3.5; dash = undefined; }

            return (
              <g key={i}>
                <polygon points={poly} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash} />
                {tile.resource !== "desert" && (
                  <g>
                    <circle cx={x} cy={y} r={18} fill="#fff" stroke="#222" strokeWidth={1} />
                    <text
                      x={x}
                      y={y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="tile-number"
                      style={{ fill: HOT.has(tile.number ?? -1) ? "#b71c1c" : "#111" }}
                    >
                      {tile.number}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {Array.from(vertexMap.entries()).map(([key, v], idx) => {
            const below = board.pipBelowKeys.has(key);
            const above = board.pipAboveKeys.has(key);
            const isViolation = below || above;

            // When scores hidden, render ONLY violation pips
            if (!showCornerScores && !isViolation) return null;

            const fillBg = above ? "#C62828" : (below ? "#1565C0" : "#ffffffcc");
            const stroke = isViolation ? "#ffffff" : "#222";
            const strokeWidth = isViolation ? 2 : 0.8;
            const radius = showCornerScores ? 11 : 9;

            return (
              <g key={idx}>
                <circle cx={v.x} cy={v.y} r={radius} fill={fillBg} stroke={stroke} strokeWidth={strokeWidth} />
                {showCornerScores && (
                  <text
                    x={v.x}
                    y={v.y + 0.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="corner-score"
                    style={{ fill: isViolation ? '#fff' : '#111' }}
                  >
                    {v.score}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      <div className="container">
        <div className="resource-legend">
          {Object.entries(COLORS).map(([res, color]) => (
            <div key={res} className="resource-item">
              {res === 'desert' ? (
                <svg width="16" height="16">
                  <defs>
                    <pattern id="desertLegend" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                      <rect width="8" height="8" fill="#ffffff" />
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#e0e0e0" strokeWidth="2" />
                    </pattern>
                  </defs>
                  <rect width="16" height="16" fill="url(#desertLegend)" stroke="#333" />
                </svg>
              ) : (
                <span className="resource-color" style={{ background: color }} />
              )}
              <span className="resource-name">
                {res === 'wood' ? 'Wood' :
                 res === 'sheep' ? 'Sheep' :
                 res === 'wheat' ? 'Wheat' :
                 res === 'brick' ? 'Brick' :
                 res === 'ore' ? 'Ore' :
                 'Desert'}
              </span>
            </div>
          ))}
        </div>

        <details className="breakdown">
          <summary>Violations: {board.breakdown.total}</summary>
          {board.breakdown.total === 0 ? (
            <div className="breakdown-content">No violations 🎉</div>
          ) : (
            <ul className="breakdown-list">
              <li>Hot tiles (6/8) adjacent: {board.breakdown.hotAdj}</li>
              <li>Identical numbers adjacent: {board.breakdown.sameNumAdj}</li>
              <li>Identical resources adjacent: {board.breakdown.sameResAdj}</li>
              <li>Pip below min: {board.breakdown.pipBelow}</li>
              <li>Pip above max: {board.breakdown.pipAbove}</li>
            </ul>
          )}

          <div className="legend-grid">
            <div className="legend-item">
              <span className="legend-color" style={{ background: "#C62828" }} /> Hot adjacency (6/8)
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: "#EF6C00" }} /> Same number neighbors
            </div>
            <div className="legend-item">
              <span className="legend-line" style={{ borderColor: "#7B1FA2" }} /> Same resource neighbors (dashed)
            </div>
            <div className="legend-item">
              <span className="legend-circle" style={{ background: "#1565C0" }} /> Pip below min (blue background)
            </div>
            <div className="legend-item">
              <span className="legend-circle" style={{ background: "#C62828" }} /> Pip above max (red background)
            </div>
          </div>
        </details>
      </div>

    </>
  );
}

export { COLORS } from './constants.js';
