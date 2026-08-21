/* Office onboarding prototype — arrow keys to walk, collect 3 coins. */
(() => {
  const M = OFFICE_MAP;
  const P = M.palette;
  const COLLIDERS = buildColliders(M);

  // ---------------------------------------------------------------- cow sprite
  // 16x16 pixel map ported straight from the Pixel Cow Sprite asset.
  const IDLE = [
    '..KK........KK..',
    '..KWK......KWK..',
    '...KWKKKKKKWK...',
    'KKKKKWWWWWWKKKKK',
    'KWWKWWWWWWWWKWWK',
    'KWWKWWWWWWWWKWWK',
    '.KKWWKWWWWKWWKK.',
    '..KWWKWWWWKWWK..',
    '..KWWWWKWWWWWK..',
    '..KWWKKKKKKWWK..',
    '..KKWWWWWWWWKK..',
    '...KWWKWWKWWK...',
    '..KWKWWWWWWKWK..',
    '..KWWKKKKKKWWK..',
    '...KWWKKKKWWK...',
    '...KKKK..KKKK...',
  ];
  const withRows = (base, patch) => {
    const out = base.slice();
    for (const k in patch) out[+k] = patch[k];
    return out;
  };
  const BLINK = withRows(IDLE, {
    6: '.KKWWWWWWWWWWKK.',
    7: '..KWWKWWWWKWWK..',
  });

  const SPRITE_SCALE = 2; // 32x32 on the map
  function bakeSprite(rows, flip) {
    const cv = document.createElement('canvas');
    cv.width = 16 * SPRITE_SCALE;
    cv.height = 16 * SPRITE_SCALE;
    const ctx = cv.getContext('2d');
    for (let y = 0; y < rows.length; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x];
        if (ch === '.') continue;
        ctx.fillStyle = ch === 'K' ? P.ink : P.cream;
        const px = flip ? 15 - x : x;
        ctx.fillRect(px * SPRITE_SCALE, y * SPRITE_SCALE, SPRITE_SCALE, SPRITE_SCALE);
      }
    }
    return cv;
  }
  const SPRITES = {
    idle: [bakeSprite(IDLE, false), bakeSprite(IDLE, true)],
    blink: [bakeSprite(BLINK, false), bakeSprite(BLINK, true)],
  };

  // ---------------------------------------------------------------- map render
  const bg = document.createElement('canvas');
  bg.width = M.width;
  bg.height = M.height;
  const b = bg.getContext('2d');

  // Deterministic scatter so the texture is stable across redraws.
  let seed = 1337;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const px = (x, y, w, h, col) => { b.fillStyle = col; b.fillRect(x | 0, y | 0, w, h); };

  function drawWater() {
    px(0, 0, M.width, M.height, P.water);
    for (let y = 0; y < M.height; y += 8) {
      for (let x = ((y / 8) % 2) * 8; x < M.width; x += 16) {
        px(x, y, 6, 2, P.waterDark);
        px(x + 2, y + 4, 4, 2, P.waterLight);
      }
    }
  }

  function drawGrass() {
    const i = M.island;
    px(i.x, i.y, i.w, i.h, P.grass);
    // soft shoreline notches
    for (let x = i.x; x < i.x + i.w; x += 12) {
      if (rnd() > 0.6) px(x, i.y, 8, 4, P.water);
      if (rnd() > 0.6) px(x, i.y + i.h - 4, 8, 4, P.water);
    }
    for (let y = i.y; y < i.y + i.h; y += 12) {
      if (rnd() > 0.6) px(i.x, y, 4, 8, P.water);
      if (rnd() > 0.6) px(i.x + i.w - 4, y, 4, 8, P.water);
    }
    // grass tufts + dirt patches
    for (let n = 0; n < 340; n++) {
      const x = i.x + rnd() * i.w, y = i.y + rnd() * i.h;
      px(x, y, 4, 2, rnd() > 0.5 ? P.grassDark : P.grassLight);
    }
  }

  function drawFloor(x, y, w, h) {
    px(x, y, w, h, P.sand);
    for (let n = 0; n < (w * h) / 900; n++) {
      px(x + rnd() * (w - 4), y + rnd() * (h - 4), 4, 2, P.sandDark);
    }
  }

  function stoneRun(x, y, w, h) {
    px(x, y, w, h, P.stone);
    px(x, y, w, 3, P.stoneLight);
    px(x, y + h - 3, w, 3, P.stoneDark);
    if (w > h) { for (let sx = x; sx < x + w; sx += 16) px(sx, y + 3, 2, h - 6, P.stoneDark); }
    else { for (let sy = y; sy < y + h; sy += 16) px(x + 2, sy, w - 4, 2, P.stoneDark); }
  }

  function drawBuilding() {
    const bd = M.building, t = bd.thickness, d = M.buildingDoor;
    drawFloor(bd.x, bd.y, bd.w, bd.h);
    stoneRun(bd.x, bd.y, bd.w, t);
    stoneRun(bd.x, bd.y, t, bd.h);
    stoneRun(bd.x + bd.w - t, bd.y, t, bd.h);
    stoneRun(bd.x, bd.y + bd.h - t, d.x - bd.x, t);
    stoneRun(d.x + d.w, bd.y + bd.h - t, bd.x + bd.w - (d.x + d.w), t);
  }

  function drawRoom(r) {
    const fill = P[r.c], dark = P[r.c + 'Dark'];
    px(r.x, r.y, r.w, r.h, fill);
    if (r.brick) {
      for (let y = r.y; y < r.y + r.h; y += 10) {
        px(r.x, y, r.w, 2, dark);
        for (let x = r.x + ((y / 10) % 2 ? 0 : 14); x < r.x + r.w; x += 28) px(x, y, 2, 10, dark);
      }
    } else {
      for (let y = r.y + 8; y < r.y + r.h - 4; y += 14) px(r.x + 4, y, r.w - 8, 2, dark);
    }
    // stone trim so each area reads as its own room
    px(r.x, r.y, r.w, 3, P.stoneLight);
    px(r.x, r.y + r.h - 3, r.w, 3, P.stoneDark);
    px(r.x, r.y, 3, r.h, P.stoneLight);
    px(r.x + r.w - 3, r.y, 3, r.h, P.stoneDark);
  }

  function drawServerRoom() {
    const s = M.serverRoom;
    px(s.x, s.y, s.w, s.h, P.grey);
    for (let y = s.y + 6; y < s.y + s.h; y += 12) px(s.x + 3, y, s.w - 6, 2, P.greyLight);
    px(s.x, s.y, s.w, 3, P.greyLight);
    px(s.x, s.y + s.h - 3, s.w, 3, P.greyDark);
  }

  function drawSolid(s) {
    if (s.kind === 'pool') {
      px(s.x, s.y, s.w, s.h, P.pool);
      px(s.x, s.y, s.w, 4, P.poolDark);
      for (let y = s.y + 10; y < s.y + s.h - 4; y += 12) {
        for (let x = s.x + 8; x < s.x + s.w - 8; x += 18) px(x, y, 8, 2, P.poolDark);
      }
      stoneRun(s.x - 6, s.y - 6, s.w + 12, 6);
      stoneRun(s.x - 6, s.y + s.h, s.w + 12, 6);
      stoneRun(s.x - 6, s.y, 6, s.h);
      stoneRun(s.x + s.w, s.y, 6, s.h);
    } else if (s.kind === 'console') {
      px(s.x, s.y, s.w, s.h, P.greyDark);
      px(s.x, s.y, s.w, 3, P.greyLight);
      px(s.x + 8, s.y + 10, 30, 16, '#2b3138');
      px(s.x + 12, s.y + 14, 8, 3, '#7dd85f');
      px(s.x + 12, s.y + 20, 14, 3, '#7dd85f');
      px(s.x + 52, s.y + 12, 10, 10, '#e0453f');
      px(s.x + 68, s.y + 12, 10, 10, '#f2c62e');
      px(s.x + 86, s.y + 14, 14, 20, '#2b3138');
    } else if (s.kind === 'bush') {
      for (let y = s.y; y < s.y + s.h; y += 14) {
        for (let x = s.x; x < s.x + s.w; x += 14) {
          px(x, y, 13, 13, rnd() > 0.5 ? P.bush : P.bushDark);
          px(x + 3, y + 3, 5, 4, P.bushLight);
          if (rnd() > 0.85) px(x + 6, y + 7, 3, 3, '#f26d9a');
        }
      }
    } else if (s.kind === 'table') {
      px(s.x + 6, s.y - 12, 14, 12, P.woodDark);      // chair (top)
      px(s.x + 46, s.y + s.h, 14, 12, P.woodDark);    // chair (bottom)
      px(s.x, s.y, s.w, s.h, P.wood);
      px(s.x, s.y, s.w, 3, '#a97040');
      for (let x = s.x + 6; x < s.x + s.w; x += 12) px(x, s.y + 4, 2, s.h - 8, P.woodDark);
    } else if (s.kind === 'sign') {
      px(s.x, s.y, s.w, s.h, P.woodDark);
      px(s.x + 4, s.y + 4, s.w - 8, s.h - 8, '#f2e4c0');
      px(s.x + 10, s.y + s.h - 4, 8, 14, P.woodDark);
      px(s.x + s.w - 18, s.y + s.h - 4, 8, 14, P.woodDark);
      b.fillStyle = P.ink;
      b.font = 'bold 15px "Courier New", monospace';
      b.fillText('AREA KEY', s.x + 24, s.y + 38);
    } else if (s.kind === 'wall') {
      stoneRun(s.x, s.y, s.w, s.h);
    }
  }

  function drawTree(t) {
    px(t.x + 14, t.y + 30, 12, 14, P.trunk);
    for (let y = 0; y < 30; y += 10) {
      const inset = y / 3;
      px(t.x + inset, t.y + y, 40 - inset * 2, 11, y === 0 ? P.bushDark : P.bush);
      px(t.x + inset + 6, t.y + y + 2, 10, 4, P.bushLight);
    }
  }

  function drawPath() {
    const p = M.path;
    px(p.x, p.y, p.w, p.h, '#c9a978');
    for (let y = p.y; y < p.y + p.h; y += 14) {
      px(p.x, y, p.w, 3, '#a8874f');
      px(p.x + 4, y + 4, p.w - 8, 6, '#d8bb8c');
    }
  }

  function renderMap() {
    drawWater();
    drawGrass();
    drawPath();
    drawBuilding();
    for (const r of M.rooms) drawRoom(r);
    drawServerRoom();
    for (const s of M.solids) drawSolid(s);
    for (const t of M.trees) drawTree(t);
  }
  renderMap();

  // ---------------------------------------------------------------- game state
  // Viewport shows a zoomed-in slice of the map rather than the whole thing.
  const VIEW = { w: 800, h: 528 };
  const ZOOM = 2;
  const VIS = { w: VIEW.w / ZOOM, h: VIEW.h / ZOOM }; // map area visible at once

  const view = document.getElementById('view');
  const vctx = view.getContext('2d');
  view.width = VIEW.w;
  view.height = VIEW.h;

  const player = { x: M.spawn.x, y: M.spawn.y, facing: 0 }; // top-left of 32x32 sprite
  const BOX = { ox: 6, oy: 18, w: 20, h: 14 };              // feet hitbox
  const SPEED = 132;                                         // px per second

  const coins = M.coins.map((c) => ({ ...c, got: false, seed: rnd() * 6.28 }));
  let collected = 0;
  let done = false;

  // Small inspection hook — handy when tuning coin placement.
  window.__game = { player, coins, colliders: COLLIDERS };

  const keys = new Set();
  const KEYMAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
  };
  addEventListener('keydown', (e) => {
    const k = KEYMAP[e.key] || KEYMAP[e.key.toLowerCase()];
    if (k) { keys.add(k); e.preventDefault(); }
  });
  addEventListener('keyup', (e) => {
    const k = KEYMAP[e.key] || KEYMAP[e.key.toLowerCase()];
    if (k) keys.delete(k);
  });
  addEventListener('blur', () => keys.clear());

  // ---------------------------------------------------------------- camera
  // Follows the cow, easing toward it so there are no snaps, and clamped to the
  // map bounds so the view never runs off the edge of the world.
  const FOLLOW = 8; // higher tracks tighter; the easing stays frame-rate independent
  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  function camTarget() {
    return {
      x: clamp(player.x + 16 - VIS.w / 2, 0, Math.max(0, M.width - VIS.w)),
      y: clamp(player.y + 16 - VIS.h / 2, 0, Math.max(0, M.height - VIS.h)),
    };
  }
  const cam = camTarget(); // start already centred, so there's no pan-in on load
  window.__game.cam = cam;
  window.__game.view = { ...VIEW, zoom: ZOOM, visible: VIS };

  function updateCamera(dt) {
    const t = camTarget();
    const k = 1 - Math.exp(-FOLLOW * dt);
    cam.x += (t.x - cam.x) * k;
    cam.y += (t.y - cam.y) * k;
  }

  function blocked(x, y) {
    const r = { x: x + BOX.ox, y: y + BOX.oy, w: BOX.w, h: BOX.h };
    for (const c of COLLIDERS) {
      if (r.x < c.x + c.w && r.x + r.w > c.x && r.y < c.y + c.h && r.y + r.h > c.y) return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- objective UI
  const els = {
    count: document.getElementById('count'),
    items: [...document.querySelectorAll('.obj-item')],
    complete: document.getElementById('complete'),
    hint: document.getElementById('hint'),
  };
  function refreshUI() {
    els.count.textContent = `${collected}/${coins.length}`;
    coins.forEach((c, i) => els.items[i].classList.toggle('done', c.got));
    if (done) els.complete.classList.add('show');
  }
  refreshUI();

  // ---------------------------------------------------------------- main loop
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    let dx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    let dy = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
    if (dx && dy) { const n = Math.SQRT1_2; dx *= n; dy *= n; }
    const moving = !!(dx || dy);
    if (dx) player.facing = dx < 0 ? 1 : 0;

    // Axis-separated movement so walls slide instead of sticking.
    const nx = player.x + dx * SPEED * dt;
    if (!blocked(nx, player.y)) player.x = nx;
    const ny = player.y + dy * SPEED * dt;
    if (!blocked(player.x, ny)) player.y = ny;

    if (moving && els.hint) els.hint.classList.add('faded');

    // Coin pickup
    const cx = player.x + 16, cy = player.y + 18; // body centre, so overlap reads as a pickup
    for (const c of coins) {
      if (c.got) continue;
      if (Math.hypot(cx - c.x, cy - c.y) < 24) {
        c.got = true;
        collected++;
        if (collected === coins.length) done = true;
        refreshUI();
      }
    }

    updateCamera(dt);

    // Draw — one transform in map space, so the map stays continuous as we pan.
    // The camera lands on whole screen pixels to stop the pixel art shimmering.
    const camX = Math.round(cam.x * ZOOM) / ZOOM;
    const camY = Math.round(cam.y * ZOOM) / ZOOM;
    vctx.setTransform(1, 0, 0, 1, 0, 0);
    vctx.imageSmoothingEnabled = false;
    vctx.clearRect(0, 0, VIEW.w, VIEW.h);
    vctx.setTransform(ZOOM, 0, 0, ZOOM, -camX * ZOOM, -camY * ZOOM);
    vctx.drawImage(bg, 0, 0);

    for (const c of coins) {
      if (c.got) continue;
      const bobY = Math.sin(now / 320 + c.seed) * 3;
      const x = c.x - 8, y = c.y - 8 + bobY;
      vctx.fillStyle = '#b8860b';
      vctx.fillRect(x, y, 16, 16);
      vctx.fillStyle = '#f2c62e';
      vctx.fillRect(x + 2, y + 2, 12, 12);
      vctx.fillStyle = '#fff2b0';
      vctx.fillRect(x + 4, y + 4, 4, 6);
      vctx.fillStyle = '#b8860b';
      vctx.fillRect(x + 7, y + 5, 3, 8);
    }

    const blinking = now % 4600 < 140;
    const bob = moving && Math.floor(now / 130) % 2 ? 2 : 0;
    vctx.drawImage((blinking ? SPRITES.blink : SPRITES.idle)[player.facing],
      Math.round(player.x), Math.round(player.y) - bob);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
