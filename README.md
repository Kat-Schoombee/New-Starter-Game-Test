# Office Onboarding — playable prototype

A lightweight desktop prototype of a gamified office-navigation experience for new starters.
Walk the office with the arrow keys, find three coins, complete the mission.

## Run it

```bash
python3 -m http.server 4321 --directory /Users/katerinaschoombee/office-game
```

Then open <http://localhost:4321>. (A plain `file://` open works too, but a server is tidier.)

**Controls:** arrow keys (WASD also works).

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page shell + the UI overlay (mission panel, coin counter, completion state) |
| `map.js` | All map data — room rectangles, scenery, coin positions, spawn, palette — plus `buildColliders()` |
| `game.js` | Game loop: input, collision, camera, coin pickup, rendering |
| `tools/check-reachability.js` | Flood-fills the walkable area from the spawn and asserts every coin is reachable |

```bash
node tools/check-reachability.js
```

Run that after moving a coin or adding scenery. It reports `OK`, `TIGHT` (reachable, but only
through a gap barely wider than the player) or `FAIL` (walled off entirely).

## How it works

- **Map** — drawn once to an offscreen canvas from the rectangles in `map.js`, then blitted each
  frame. Editing the map means editing data, not drawing code.
- **Character** — the 16×16 pixel cow is ported directly from the `Pixel Cow Sprite` asset
  (its `IDLE` / `BLINK` pixel rows and its cream/ink colours), baked to a 32×32 canvas at load,
  and flipped horizontally for facing. It keeps the asset's blink and walk-bob; nothing new added.
- **Collision** — one list of axis-aligned rectangles (water, the building wall, scenery,
  partition walls). Movement resolves one axis at a time so the player slides along walls.
  Coloured room floors are *walkable*; only scenery and walls block, which is what keeps every
  area reachable.
- **Camera** — the canvas is a 800×528 viewport onto the 1024×672 world at 2× zoom, so you see
  roughly 400×264 map pixels of office around the cow rather than the whole floorplan. It eases
  toward the cow with `1 - exp(-8 * dt)` (frame-rate independent, so no snapping), starts already
  centred on the spawn, and clamps to the world bounds so the view never runs past the shoreline.
  The camera lands on whole screen pixels to keep the pixel art from shimmering while panning.
- **Coins** — three, one per objective area. Picked up within 24px of the sprite's body centre.

`window.__game` exposes `{ player, coins, colliders }` for poking at things in the console.

## A note on the map art

The office map was supplied as a chat attachment rather than a file, so the environment here is a
tile-drawn recreation that follows the reference layout, palette and pixel style (pink workspaces
left and right, yellow and blue meeting rooms along the top, grey server room, pool, garden
tables and planting, the AREA KEY sign, grass and water border). Drawing it from data also gives
exact collision geometry.

To use the original PNG instead: drop it in as `map.png`, draw it as the background in
`renderMap()` in `game.js`, and keep the collider rectangles in `map.js` (adjusting any that
don't line up).
