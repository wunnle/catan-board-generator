// =====================================
// Catan Board Constants
// =====================================

// Colors (accessible, higher contrast)
export const COLORS = {
  wood: "#256D2B",   // Forest (wood)
  sheep: "#A5D6A7",  // Pasture (sheep)
  wheat: "#FFD700",  // Field (wheat)
  brick: "#FF7043",  // Hill (brick/clay)
  ore: "#546E7A",    // Mountain (ore)
  desert: "#FFFFFF", // Desert (tile uses stripes pattern)
};

// Catan base (4 wood, 4 sheep, 4 wheat, 3 brick, 3 ore, 1 desert)
export const RESOURCE_BAG = [
  ...Array(4).fill("wood"),
  ...Array(4).fill("sheep"),
  ...Array(4).fill("wheat"),
  ...Array(3).fill("brick"),
  ...Array(3).fill("ore"),
  "desert",
];

// Standard number tokens (no 7)
export const TOKENS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

// Axial neighbor directions
export const DIRS = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

export const HOT = new Set([6, 8]);

// Static port placements
// Port positioned between two corner coordinates
export const PORTS = [
  { corner1: "0,4", corner2: "0.9,3.5", type: "wheat" }
];
