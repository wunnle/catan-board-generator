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
