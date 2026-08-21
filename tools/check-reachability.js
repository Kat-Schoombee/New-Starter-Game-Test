// Flood-fills the walkable area from the spawn and confirms every coin is reachable.
// Runs twice: once with the real hitbox, once with a padded one. The padded pass
// catches coins that are technically reachable but only through a tight squeeze.
const { OFFICE_MAP: M, buildColliders } = require('../map.js');
const C = buildColliders(M);
const BOX = { ox: 6, oy: 18, w: 20, h: 14 };
const STEP = 4;

function reachable(pad) {
  const box = { ox: BOX.ox - pad, oy: BOX.oy - pad, w: BOX.w + pad * 2, h: BOX.h + pad * 2 };
  const blocked = (x, y) => {
    const r = { x: x + box.ox, y: y + box.oy, w: box.w, h: box.h };
    return C.some(c => r.x < c.x + c.w && r.x + r.w > c.x && r.y < c.y + c.h && r.y + r.h > c.y);
  };
  const key = (x, y) => `${x},${y}`;
  const start = [Math.round(M.spawn.x / STEP) * STEP, Math.round(M.spawn.y / STEP) * STEP];
  if (blocked(...start)) return null;
  const seen = new Set([key(...start)]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[STEP, 0], [-STEP, 0], [0, STEP], [0, -STEP]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx > M.width || ny > M.height) continue;
      const k = key(nx, ny);
      if (seen.has(k) || blocked(nx, ny)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}

// the coin is picked up when the sprite's body centre comes within 24px
const canReach = (cells, coin) => [...cells].some((k) => {
  const [x, y] = k.split(',').map(Number);
  return Math.hypot(x + 16 - coin.x, y + 18 - coin.y) < 24;
});

const strict = reachable(0);
if (!strict) { console.error('FAIL: spawn is inside a collider'); process.exit(1); }
const comfy = reachable(4) || new Set();

console.log(`walkable cells from spawn: ${strict.size} (${comfy.size} with 4px clearance)\n`);

let ok = true;
for (const coin of M.coins) {
  const r = canReach(strict, coin);
  const c = canReach(comfy, coin);
  const status = !r ? 'FAIL' : !c ? 'TIGHT' : 'OK   ';
  console.log(`${status} ${coin.area} @ (${coin.x}, ${coin.y})${!c && r ? '  — reachable only through a squeeze' : ''}`);
  if (!r) ok = false;
}
process.exit(ok ? 0 : 1);
