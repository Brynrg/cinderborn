# Cinderborn — A Borrowed Name

A solo action RPG about Ash, an exile carrying a dead noble's signet and a
forbidden flame. Explore a continuous world, fight in real time, complete quests,
find equipment, gain levels and decide what your promise to Vesper is worth.

## Play

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5178 --strictPort
```

Open http://127.0.0.1:5178/ in a desktop browser. The default entry is the RPG.
`trial.html` retains the hex tactical trial; `conclave.html` retains the original
Conclave campaign. Each uses its own save namespace.

- **WASD / arrows:** move. **Click ground:** walk there. **Click enemy:** engage.
- **Space / 1:** steel. **2:** Firebrand. **3:** Mend. **4:** Veilstep dodge.
- **E:** interact. **Q:** healing draught. **Tab:** cycle nearby targets.
- **C / I:** character and inventory. **J:** journal. **M:** world map.
- **Escape:** pause/close menu. **F:** fullscreen. Sound defaults off.

Begin at Emberrest, speak to Rook, then explore. Iona and Sable provide useful
side activities. Vesper offers her seal in exchange for rescuing two prisoners;
refusing requires defeating the Seal Warden. Both paths lead to the Arbiter
and the Conclave road. The region stays playable after the chapter's ending.

Levels grant talent points. Equip weapons and armor in Character. Read enemy
red attack areas, move or Veilstep out before impact, and manage regenerating
focus and cooldowns. Rest at a hearth to restore health and three draughts.
Discovered hearths unlock fast travel outside combat. Defeat preserves progress.

## Persistence and scope

`cinderborn-rpg-v1` saves position, health, levels, XP, equipment, talents, quests,
collectibles, enemies and cooldowns. It saves every second, after transactions
and when leaving the page. Reload does not award completed quests twice. Invalid
saves recover to a new journey; unavailable storage is visibly reported.

This is a solo opening region with MMORPG-inspired exploration, questing and
progression. It has no live multiplayer, accounts or server dependency. Desktop
Chromium is the verified target; narrow layouts are checked, but mobile support
is not claimed. See `RPG_DESIGN.md` for the gameplay decisions and story mapping.
Earlier tactical design and controls are documented in `TACTICAL_TRIAL.md`.

## Check and publish

```sh
npm run typecheck
npm run build
npm run lint:paths
npm test
```

The historical `typecheck` script validates JavaScript syntax. Rule tests cover
combat, movement, navigation, progression, story requirements and persistence.
Built-browser journeys exercise both story routes through normal game inputs,
as well as legacy modes. The bundled web-game client provides additional
movement/combat screenshots and state inspection.

Push to `main` to publish through the existing shared GitHub deployment workflow.
It builds all three entries, runs canonical portal ingest and opens an auto-merging
portal PR. Verify the resulting manifest/assets and production journey. Never
copy `dist` directly into the portal. Vite `base: "./"` remains required.

## Code

`src/rpg/data.js` defines characters/items, `world.js` terrain and navigation,
`state.js` saves/progression, `story.js` quests/dialogue, `engine.js` real-time
simulation, `render.js` canvas artwork, `ui.js` panels, and `main.js` input/loop.
`render_game_to_text` exposes observable state and `advanceTime(ms)` steps the same
simulation for controlled tests. Calling `advanceTime` pauses the wall clock until
`resumeTime()` is called, so slow automation cannot move targets between inputs.
No runtime dependencies were added.
