// =====================================
// Board Generation Logic
// =====================================

import { RESOURCE_BAG, TOKENS, HOT } from './constants.js';
import { shuffle, seededShuffle, pipValue } from './utils.js';
import { COORDS, CENTER_INDEX, neighborsOf, axialToPixel, hexCorner } from './hexGrid.js';

/**
 * Layer A: Resources (optionally avoid identical neighboring resources; optionally keep desert center)
 */
export function generateResources({ preventSameResources = false, keepDesertCenter = false, seed }) {
  let best = null;
  let safety = 20000;
  while (safety-- > 0) {
    const resources = shuffle(RESOURCE_BAG);

    // If keeping desert at center, swap desert into center index (q=0,r=0)
    if (keepDesertCenter && CENTER_INDEX !== undefined) {
      const d = resources.indexOf("desert");
      if (d !== -1 && d !== CENTER_INDEX) {
        const tmp = resources[CENTER_INDEX];
        resources[CENTER_INDEX] = "desert";
        resources[d] = tmp;
      }
    }

    let v = 0;
    const sameResTiles = new Set();
    if (preventSameResources) {
      for (let i = 0; i < 19; i++) {
        const r = resources[i];
        for (const j of neighborsOf(i)) {
          if (resources[j] === r) { v++; sameResTiles.add(i); sameResTiles.add(j); break; }
        }
      }
    }
    if (!best || v < best.violations) {
      best = { resources, violations: v, sameResTiles };
      if (v === 0) break;
    }
  }
  if (!best) best = { resources: [...RESOURCE_BAG], violations: 0, sameResTiles: new Set() };
  const desertIndex = keepDesertCenter && CENTER_INDEX !== undefined
    ? CENTER_INDEX
    : best.resources.findIndex((r) => r === "desert");
  return { resources: best.resources, desertIndex, resViolations: best.violations, sameResTiles: best.sameResTiles };
}

/**
 * Layer B: Numbers (we minimize 6/8 adjacency; optional: noSameNeighbors; pip bounds inclusive)
 */
export function generateNumbers({ desertIndex, pipMin, pipMax, noSameNeighbors, seed }) {
  const tokenable = COORDS.map((_, i) => i).filter((i) => i !== desertIndex);
  const centersUnit = COORDS.map(({ q, r }) => axialToPixel(q, r, 1));

  function pipBreakdown(numbersAt) {
    const bd = { hotAdj: 0, sameNumAdj: 0, pipBelow: 0, pipAbove: 0, total: 0 };
    const hotTiles = new Set();
    const sameNumTiles = new Set();
    const pipBelowKeys = new Set();
    const pipAboveKeys = new Set();

    // A) Adjacency checks for numbers
    for (const i of tokenable) {
      const n = numbersAt[i];
      if (!n) continue;
      if (HOT.has(n)) {
        if (neighborsOf(i).some((j) => HOT.has(numbersAt[j] ?? -1))) { bd.hotAdj++; hotTiles.add(i); }
      }
      if (noSameNeighbors) {
        if (neighborsOf(i).some((j) => numbersAt[j] === n)) { bd.sameNumAdj++; sameNumTiles.add(i); }
      }
    }

    // B) Interior pip bounds (inclusive)
    const vertexMap = new Map();
    centersUnit.forEach(({ x, y }, i) => {
      const n = numbersAt[i];
      const val = pipValue(n);
      for (let k = 0; k < 6; k++) {
        const c = hexCorner(x, y, 1, k);
        const key = `${Math.round(c.x * 10) / 10},${Math.round(c.y * 10) / 10}`;
        const prev = vertexMap.get(key) || { score: 0, tiles: 0 };
        vertexMap.set(key, { score: prev.score + val, tiles: prev.tiles + 1 });
      }
    });
    vertexMap.forEach(({ score, tiles }, key) => {
      if (tiles === 3) {
        if (score < pipMin) { bd.pipBelow++; pipBelowKeys.add(key); }
        else if (score > pipMax) { bd.pipAbove++; pipAboveKeys.add(key); }
      }
    });

    bd.total = bd.hotAdj + bd.sameNumAdj + bd.pipBelow + bd.pipAbove;
    return { bd, hotTiles, sameNumTiles, pipBelowKeys, pipAboveKeys };
  }

  let best = null;
  let safety = 7000;
  let bag = shuffle(TOKENS);
  while (safety-- > 0) {
    const numbersAt = Array(19).fill(null);
    let t = 0;
    for (let i = 0; i < 19; i++) {
      if (i === desertIndex) continue;
      numbersAt[i] = bag[t++];
    }
    const res = pipBreakdown(numbersAt);
    if (!best || res.bd.total < best.bd.total) {
      best = { numbers: numbersAt, ...res };
      if (res.bd.total === 0) break;
    }
    bag = shuffle(bag);
  }
  if (!best) {
    const empty = { hotTiles: new Set(), sameNumTiles: new Set(), pipBelowKeys: new Set(), pipAboveKeys: new Set(), bd: { hotAdj: 0, sameNumAdj: 0, pipBelow: 0, pipAbove: 0, total: 0 } };
    return { numbers: Array(19).fill(null), ...empty };
  }
  return best;
}
