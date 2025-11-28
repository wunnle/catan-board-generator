import React, { useMemo, useState, useRef, useEffect } from "react";
import { COLORS, HOT, PORTS, DIRS } from './constants.js';
import { pipValue } from './utils.js';
import { COORDS, axialToPixel, hexPolygonPoints, hexCorner, getSharedVertex, neighborsOf, INDEX_BY_COORD } from './hexGrid.js';
import { generateResources, generateNumbers } from './boardGenerator.js';
import { Analytics } from "@vercel/analytics/react"
import grainSvg from './images/grain.svg';

// URL encoding/decoding helpers
function encodeStateToURL(state) {
  const params = new URLSearchParams();
  
  // Always encode seeds
  params.set('rs', state.resourceSeed.toString());
  params.set('ns', state.numberSeed.toString());
  
  // Only encode non-defaults
  if (state.noSameNeighbors === false) params.set('nsn', '0');
  if (state.preventSameResources === true) params.set('psr', '1');
  if (state.keepDesertCenter === true) params.set('kdc', '1');
  if (state.pipMin !== 2) params.set('pmin', state.pipMin.toString());
  if (state.pipMax !== 13) params.set('pmax', state.pipMax.toString());
  
  return params.toString();
}

function decodeURLToState() {
  const params = new URLSearchParams(window.location.search);
  
  // Parse seeds with fallback to random
  const resourceSeed = params.has('rs') ? parseFloat(params.get('rs')) : Math.random();
  const numberSeed = params.has('ns') ? parseFloat(params.get('ns')) : Math.random();
  
  // Parse booleans from "0"/"1" with defaults
  const noSameNeighbors = params.has('nsn') ? params.get('nsn') === '1' : true;
  const preventSameResources = params.has('psr') ? params.get('psr') === '1' : false;
  const keepDesertCenter = params.has('kdc') ? params.get('kdc') === '1' : false;
  
  // Parse pip bounds with defaults
  const pipMin = params.has('pmin') ? parseInt(params.get('pmin'), 10) : 2;
  const pipMax = params.has('pmax') ? parseInt(params.get('pmax'), 10) : 13;
  
  // Validate and return with fallbacks for invalid values
  return {
    resourceSeed: isNaN(resourceSeed) ? Math.random() : resourceSeed,
    numberSeed: isNaN(numberSeed) ? Math.random() : numberSeed,
    noSameNeighbors,
    preventSameResources,
    keepDesertCenter,
    pipMin: isNaN(pipMin) ? 2 : Math.max(2, Math.min(6, pipMin)),
    pipMax: isNaN(pipMax) ? 13 : Math.max(6, Math.min(13, pipMax)),
  };
}

export default function CatanBoardGenerator() {
  const urlState = decodeURLToState();
  
  const [resourceSeed, setResourceSeed] = useState(urlState.resourceSeed);
  const [numberSeed, setNumberSeed] = useState(urlState.numberSeed);
  const [showCornerScores, setShowCornerScores] = useState(false);
  const [noSameNeighbors, setNoSameNeighbors] = useState(urlState.noSameNeighbors);
  const [preventSameResources, setPreventSameResources] = useState(urlState.preventSameResources);
  const [keepDesertCenter, setKeepDesertCenter] = useState(urlState.keepDesertCenter);
  const [copied, setCopied] = useState(false);

  const [pipMin, setPipMin] = useState(urlState.pipMin);
  const [pipMax, setPipMax] = useState(urlState.pipMax);

  // Update URL when state changes
  useEffect(() => {
    const newUrl = encodeStateToURL({
      resourceSeed,
      numberSeed,
      noSameNeighbors,
      preventSameResources,
      keepDesertCenter,
      pipMin,
      pipMax,
    });
    window.history.replaceState(null, '', `?${newUrl}`);
  }, [resourceSeed, numberSeed, noSameNeighbors, preventSameResources, keepDesertCenter, pipMin, pipMax]);

  // Layered recompute: resources first, then numbers
  const resLayer = useMemo(
    () => generateResources({ preventSameResources, keepDesertCenter, seed: resourceSeed }),
    [resourceSeed, preventSameResources, keepDesertCenter]
  );

  const numsLayer = useMemo(
    () => generateNumbers({
      desertIndex: resLayer.desertIndex,
      pipMin,
      pipMax,
      noSameNeighbors,
      seed: numberSeed,
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
  const minX = Math.min(...xs) - size * 1.1;
  const maxX = Math.max(...xs) + size * 1.1;
  const minY = Math.min(...ys) - size * 1.5;
  const maxY = Math.max(...ys) + size * 1.4;
  const width = maxX - minX;
  const height = maxY - minY + 12;

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
      <Analytics />
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
      <div>
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

          <rect x={minX} y={minY} width={width} height={height} fill="#ffffff" rx={12} />

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

          {/* Draw rounded outer border */}
          {(() => {
            const outerEdges = [];
            board.tiles.forEach((tile, i) => {
              const neighbors = neighborsOf(i);
              if (neighbors.length < 6) {
                const { x, y } = centers[i];
                for (let edgeIdx = 0; edgeIdx < 6; edgeIdx++) {
                  const corner1 = hexCorner(x, y, size, edgeIdx);
                  const corner2 = hexCorner(x, y, size, (edgeIdx + 1) % 6);
                  const midX = (corner1.x + corner2.x) / 2;
                  const midY = (corner1.y + corner2.y) / 2;
                  
                  let isSharedEdge = false;
                  for (const nIdx of neighbors) {
                    const nc = centers[nIdx];
                    const dist = Math.sqrt((midX - nc.x) ** 2 + (midY - nc.y) ** 2);
                    if (dist < size * 1.2) {
                      isSharedEdge = true;
                      break;
                    }
                  }
                  
                  if (!isSharedEdge) {
                    outerEdges.push({ x1: corner1.x, y1: corner1.y, x2: corner2.x, y2: corner2.y });
                  }
                }
              }
            });
            
            return outerEdges.map((edge, idx) => (
              <line
                key={idx}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke="#333"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ));
          })()}

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

          {/* Render Ports */}
          {!showCornerScores && PORTS.map((port, idx) => {
            const v1 = vertexMap.get(port.corner1);
            const v2 = vertexMap.get(port.corner2);
            
            if (!v1 || !v2) return null;
            
            const portX = v1.x;
            const portY = v1.y;
            const portColor = COLORS[port.type];
            const portBorder = "#333";
            
            return (
              <g key={`port-${idx}`}>
                {/* Connector line from corner2 to port */}
                <line
                  x1={v2.x}
                  y1={v2.y + 2}
                  x2={portX}
                  y2={portY + 2}
                  stroke={portColor}
                  strokeWidth={3}
                />
                {/* Port circle */}
                <circle 
                  cx={portX} 
                  cy={portY} 
                  r={15} 
                  fill={portColor} 
                  stroke={portBorder} 
                  strokeWidth={2}
                />
                {/* Port icon */}
                <image
                  x={portX - 15}
                  y={portY - 15}
                  width={30}
                  height={30}
                  href={grainSvg}
                />
                {/* Connection point marker */}
                <circle 
                  cx={v2.x} 
                  cy={v2.y + 2} 
                  r={5} 
                  fill={portColor} 
                  stroke={portBorder} 
                  strokeWidth={1}
                />
              </g>
            );
          })}

          {/* Debug: Show tile coordinates */}
          {false && COORDS.map((coord, i) => {
            const center = axialToPixel(coord.q, coord.r, size);
            return (
              <text
                key={`coord-${i}`}
                x={center.x}
                y={center.y - 20}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: '8px', fill: '#666', fontWeight: 'bold' }}
              >
                ({coord.q},{coord.r})
              </text>
            );
          })}

          {/* Debug: Show corner coordinates */}
          {false && Array.from(vertexMap.entries()).map(([key, v], idx) => {
            return (
              <text
                key={`corner-${idx}`}
                x={v.x + 8}
                y={v.y + 3}
                textAnchor="start"
                dominantBaseline="middle"
                style={{ fontSize: '6px', fill: '#e74c3c', fontWeight: 'bold' }}
              >
                {key}
              </text>
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

        <footer className="footer">
          <div className="footer-content">
            {/* Logo */}
            <div className="footer-divider">
              <div className="footer-line"></div>
              <div className="footer-logo">
                <svg width="32" height="14" viewBox="0 0 48 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="footer-svg">
                  <path d="M24 12L32 11.7L24 0.4V12Z" fill="#0D79BE" />
                  <path d="M24 12L16 11.7L24 0.4V12Z" fill="#3790BB" />
                  <path d="M24 12L0.7 0L7 21L18 17L24 12Z" fill="#F69226" />
                  <path d="M24 12L47.3 0L41 21L30 17L24 12Z" fill="#D06A29" />
                  <path d="M24 12L41 21H7L24 12Z" fill="#ED7723" />
                </svg>
              </div>
              <div className="footer-line"></div>
            </div>
            <div className="footer-links">
              <div className="footer-made-by">
                <span>made with ♥ by wunnle</span>
              </div>
              <span className="footer-separator"></span>
              <div className="footer-nav">
                <a
                  href="https://github.com/wunnle/catan-board-generator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link-item"
                >
                  view on GitHub
                </a>
                <span className="footer-dot">•</span>
                <a
                  href="https://kafagoz.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link-item"
                >
                  kafagoz.com
                </a>
                <span className="footer-dot">•</span>
                <a
                  href="https://wunnle.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link-item"
                >
                  wunnle.dev
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

    </>
  );
}

export { COLORS } from './constants.js';
