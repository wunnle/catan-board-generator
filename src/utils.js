// =====================================
// Utility Functions
// =====================================

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
