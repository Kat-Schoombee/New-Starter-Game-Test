// Office map data — traced from the reference office map design.
// Pure data + palette. Loaded by game.js in the browser and by tools/check-reachability.js in node.

const OFFICE_MAP = {
  width: 1024,
  height: 672,

  palette: {
    water: '#3a86c8',
    waterDark: '#2f74b0',
    waterLight: '#59a0dc',
    grass: '#6ec24a',
    grassDark: '#5aad39',
    grassLight: '#84d15e',
    sand: '#e6d5a7',
    sandDark: '#d8c390',
    stone: '#a9a9a9',
    stoneLight: '#c2c2c2',
    stoneDark: '#7b7b7b',
    pink: '#e2478e',
    pinkDark: '#c53878',
    rose: '#e04a72',
    roseDark: '#c23a5e',
    yellow: '#f2c62e',
    yellowDark: '#d5a81c',
    blue: '#4c9fd6',
    blueDark: '#3a83b6',
    grey: '#8d939b',
    greyDark: '#6b7178',
    greyLight: '#a8aeb5',
    pool: '#3f97dd',
    poolDark: '#3182c4',
    bush: '#4e9e3e',
    bushDark: '#3c8130',
    bushLight: '#69b556',
    wood: '#8b5a2b',
    woodDark: '#6d4520',
    trunk: '#6b4a2a',
    ink: '#0a1b19',
    cream: '#eaf8dd',
  },

  // The grass island. Everything outside of it is water (solid).
  island: { x: 28, y: 12, w: 972, h: 634 },

  // Outer building wall: a frame with a doorway gap at the bottom centre.
  building: { x: 68, y: 84, w: 936, h: 408, thickness: 14 },
  buildingDoor: { x: 492, w: 64 }, // gap in the bottom wall

  // Coloured workspace floors. Walkable — drawn with a decorative trim, no collision.
  rooms: [
    // Left block — Workspace 1
    { x: 84, y: 100, w: 74, h: 190, c: 'pink', brick: true },
    { x: 162, y: 196, w: 96, h: 68, c: 'pink' },
    { x: 162, y: 268, w: 96, h: 68, c: 'pink' },
    { x: 84, y: 296, w: 74, h: 158, c: 'pink', brick: true },
    { x: 162, y: 452, w: 96, h: 36, c: 'pink' },
    { x: 262, y: 100, w: 94, h: 70, c: 'pink', brick: true },
    // Top strip — meeting rooms
    { x: 364, y: 100, w: 54, h: 82, c: 'yellow' },
    { x: 422, y: 100, w: 54, h: 82, c: 'yellow' },
    { x: 480, y: 100, w: 54, h: 82, c: 'yellow' },
    { x: 568, y: 100, w: 90, h: 82, c: 'blue' },
    { x: 660, y: 100, w: 86, h: 82, c: 'blue' },
    // Right block — Workspace 2
    { x: 760, y: 100, w: 130, h: 62, c: 'pink' },
    { x: 744, y: 174, w: 60, h: 46, c: 'blue' },
    { x: 744, y: 226, w: 86, h: 70, c: 'rose' },
    { x: 834, y: 226, w: 86, h: 70, c: 'rose' },
    { x: 744, y: 302, w: 86, h: 54, c: 'blue' },
    { x: 834, y: 302, w: 58, h: 42, c: 'blue' },
    { x: 924, y: 286, w: 72, h: 130, c: 'pink' },
    { x: 822, y: 374, w: 106, h: 90, c: 'pink', brick: true },
    { x: 896, y: 420, w: 100, h: 68, c: 'pink', brick: true },
  ],

  // Server room floor (walkable) with a solid console inside.
  serverRoom: { x: 536, y: 232, w: 146, h: 130 },

  // Solid scenery.
  solids: [
    { x: 548, y: 368, w: 134, h: 78, kind: 'pool' },
    { x: 556, y: 246, w: 110, h: 44, kind: 'console' },
    { x: 264, y: 208, w: 96, h: 54, kind: 'bush' },
    // kept clear of the dining tables so the walkway between them stays wider
    // than the player — otherwise the cafeteria coin is only reachable by a squeeze
    { x: 384, y: 366, w: 70, h: 76, kind: 'bush' },
    { x: 292, y: 428, w: 118, h: 42, kind: 'bush' },
    { x: 280, y: 286, w: 68, h: 38, kind: 'table' },
    { x: 280, y: 366, w: 68, h: 38, kind: 'table' },
    { x: 44, y: 536, w: 244, h: 62, kind: 'sign' },
    // Interior partition walls — all open-ended, so nothing can be sealed off.
    { x: 396, y: 236, w: 128, h: 12, kind: 'wall' },
    { x: 396, y: 236, w: 12, h: 54, kind: 'wall' },
    { x: 464, y: 300, w: 12, h: 108, kind: 'wall' },
  ],

  // Decorative trees on the lawn (also solid).
  trees: [
    { x: 70, y: 30 }, { x: 140, y: 24 }, { x: 410, y: 34 }, { x: 700, y: 44 },
    { x: 940, y: 20 }, { x: 960, y: 130 }, { x: 690, y: 500 }, { x: 800, y: 512 },
    { x: 930, y: 560 }, { x: 380, y: 570 },
  ],

  path: { x: 496, y: 492, w: 56, h: 154 },

  // Just inside the entrance — clear of the bottom wall band so all four
  // directions are free on the very first keypress.
  spawn: { x: 508, y: 434 },

  coins: [
    { x: 120, y: 380, area: 'Workspace 1' },
    { x: 877, y: 262, area: 'Workspace 2' },
    { x: 318, y: 345, area: 'Lunch Cafeteria' },
  ],
};

// Axis-aligned collision rectangles, derived from the data above.
function buildColliders(map) {
  const c = [];
  const push = (x, y, w, h) => c.push({ x, y, w, h });

  // Water: four slabs around the island.
  const i = map.island;
  push(0, 0, map.width, i.y);
  push(0, i.y + i.h, map.width, map.height - (i.y + i.h));
  push(0, i.y, i.x, i.h);
  push(i.x + i.w, i.y, map.width - (i.x + i.w), i.h);

  // Building wall frame with a doorway in the bottom run.
  const b = map.building, t = b.thickness, d = map.buildingDoor;
  push(b.x, b.y, b.w, t);                       // top
  push(b.x, b.y, t, b.h);                       // left
  push(b.x + b.w - t, b.y, t, b.h);             // right
  push(b.x, b.y + b.h - t, d.x - b.x, t);       // bottom, left of door
  push(d.x + d.w, b.y + b.h - t, b.x + b.w - (d.x + d.w), t); // bottom, right of door

  for (const s of map.solids) push(s.x, s.y, s.w, s.h);
  for (const tr of map.trees) push(tr.x + 6, tr.y + 20, 28, 22);

  return c;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OFFICE_MAP, buildColliders };
}
