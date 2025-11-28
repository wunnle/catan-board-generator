// =====================================
// Utility Functions
// =====================================

/**
 * Seeded random number generator
 */
export function seededRandom(seed) {
  let state = seed * 2147483647;
  return function() {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/**
 * Shuffle an array using Fisher-Yates algorithm with a seed
 */
export function seededShuffle(arr, seed) {
  const rng = seededRandom(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Get pip value for a number token
 */
export function pipValue(n) {
  if (!n) return 0;
  const table = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };
  return table[n] ?? 0;
}
