// =====================================
// Hexagonal Grid System
// =====================================

import { DIRS } from './constants.js';

/**
 * Build the canonical 19-hex axial grid for rows: 3-4-5-4-3 (radius 2)
 */
function buildAxialLayout() {
  const coords = [];
  let idx = 0;
  for (let r = -2; r <= 2; r++) {
    const qMin = Math.max(-2, -r - 2);
    const qMax = Math.min(2, -r + 2);
    for (let q = qMin; q <= qMax; q++) coords.push({ q, r, i: idx++ });
  }
  return coords;
}

export const COORDS = buildAxialLayout();
export const INDEX_BY_COORD = new Map(COORDS.map((c) => [`${c.q},${c.r}`, c.i]));
export const CENTER_INDEX = INDEX_BY_COORD.get("0,0");

/**
 * Get neighboring tile indices for a given tile index
 */
export function neighborsOf(index) {
  const tile = COORDS[index];
  const res = [];
  for (const [dq, dr] of DIRS) {
    const key = `${tile.q + dq},${tile.r + dr}`;
    const ni = INDEX_BY_COORD.get(key);
    if (ni !== undefined) res.push(ni);
  }
  return res;
}

/**
 * Convert axial coordinates to pixel coordinates
 */
export function axialToPixel(q, r, size) {
  // Flat-topped axial → pixel
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * (1.5 * r);
  return { x, y };
}

/**
 * Generate polygon points for a hexagon
 */
export function hexPolygonPoints(cx, cy, size) {
  const pts = [];
  for (let k = 0; k < 6; k++) {
    const angle = (Math.PI / 180) * (60 * k + 30); // flat-top vertices
    pts.push([cx + size * Math.cos(angle), cy + size * Math.sin(angle)]);
  }
  return pts.map(([x, y]) => `${x},${y}`).join(" ");
}

/**
 * Get a specific corner point of a hexagon
 */
export function hexCorner(cx, cy, size, k) {
  const angle = (Math.PI / 180) * (60 * k + 30);
  return { x: cx + size * Math.cos(angle), y: cy + size * Math.sin(angle) };
}

/**
 * Get the midpoint between two adjacent hex centers
 */
export function getMidpoint(x1, y1, x2, y2) {
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
}

/**
 * Find the shared vertex (corner) between two adjacent hexagons
 * Returns the vertex position that both hexes share
 */
export function getSharedVertex(center1, center2, size) {
  // Get all corners of both hexes
  const corners1 = [];
  const corners2 = [];
  
  for (let k = 0; k < 6; k++) {
    corners1.push(hexCorner(center1.x, center1.y, size, k));
    corners2.push(hexCorner(center2.x, center2.y, size, k));
  }
  
  // Find the two corners that are closest between the two hexes (they share 2 vertices)
  // We'll take the one that's furthest from both centers (outer vertex)
  let maxDistSum = -1;
  let outerVertex = null;
  
  for (const c1 of corners1) {
    for (const c2 of corners2) {
      const dist = Math.sqrt((c1.x - c2.x) ** 2 + (c1.y - c2.y) ** 2);
      if (dist < 1) { // Same vertex (within tolerance)
        // Calculate distance from both centers
        const d1 = Math.sqrt((c1.x - center1.x) ** 2 + (c1.y - center1.y) ** 2);
        const d2 = Math.sqrt((c1.x - center2.x) ** 2 + (c1.y - center2.y) ** 2);
        const distSum = d1 + d2;
        
        if (distSum > maxDistSum) {
          maxDistSum = distSum;
          outerVertex = c1;
        }
      }
    }
  }
  
  return outerVertex;
}
