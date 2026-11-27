# Cinderborn — A Borrowed Name

A solo action RPG about Ash, an exile carrying a dead noble's signet and a
forbidden flame. Explore a continuous world, fight in real time, complete quests,
find equipment, gain levels and carry your promises through a four-chapter campaign.

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
- **5:** Cinderwake after Chapter II. **6:** Nameward after Chapter III.
- **E:** interact. **Q:** healing draught. **Tab:** cycle nearby targets.
- **C / I:** character and inventory. **J:** journal. **M:** world map.
- **Escape:** pause/close menu. **F:** fullscreen. Sound defaults off.

Begin at Emberrest, speak to Rook, then explore. Iona and Sable provide useful
side activities. Vesper offers her seal in exchange for rescuing two prisoners;
refusing requires defeating the Seal Warden. Both paths lead to the Arbiter
and the Conclave road. Continue east to Cinderreach, the Veiled Fen and the
Crownless Citadel. Earlier regions remain accessible through roads and discovered
hearths; existing RPG characters can continue from the causeway ending.

Levels grant talent points. Equip weapons and armor in Character. Read enemy
red attack areas, move or Veilstep out before impact, and manage regenerating
focus and cooldowns. Bosses brace for reduced damage, then expose a 2.4-second
opening after each attack that takes 50% extra damage. Their marked sweeps and
eruptions alternate; the Arbiter speeds up below half health.

Click a side quest in the tracker or journal to follow its next objective and
turn-in. Rescuing Mara improves Veilstep to 8 focus and a 2.6-second cooldown;
Brann improves draughts to 65 healing. Vesper previews these rewards before the
choice. Finished conversations show check marks. Rest at a hearth to restore health and three draughts.
Discovered hearths unlock fast travel outside combat. Defeat preserves progress.

## The expanded campaign

- **I — A Borrowed Name:** Emberrest, Vesper's bargain, the prisoners and the
  causeway. Keep your word or take a seal by force.
- **II — The Price of Iron:** free Cinderreach's furnaces from the Brass Bailiff.
  Choose workers' control or Vorthos patronage. Help Anja, craft Edda's sword or
  flame lantern, and decide whether Oryn's deserters deserve mercy.
- **III — The Names Beneath:** recover the stolen census in the Veiled Fen,
  confront the Drowned Archivist, and publish the truth or bargain with it.
  Heal Syla's people, uncover Iona's family history, and solve the covenant bells.
- **IV — A Name of Your Own:** break the house beacons, face the First Judge,
  then burn the Roll, claim its crown or rewrite the covenant. The third ending
  requires three independent allies; the journal and Herald explain the sources.

Recovered records remain readable in the journal. Six new equipment rewards,
Cinderwake's area attack, Nameward's five-second shield, and seven ranks per
combat talent extend build progression. Chapters carry their decisions into a
personalized epilogue. After the ending, finish old promises or challenge the
First Judge's enraged echo repeatedly. The original story choice stays saved.

## Persistence and scope

`cinderborn-rpg-v1` saves position, health, levels, XP, equipment, talents, quests,
collectibles, enemies and cooldowns. It saves every second, after transactions
and when leaving the page. Reload does not award completed quests twice. Invalid
saves recover to a new journey; unavailable storage is visibly reported.

This is a four-region solo campaign with MMORPG-inspired exploration, questing and
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
`regions.js` regional landmarks, `campaign-story.js` later quests and epilogues,
`state.js` saves/progression, `story.js` opening quests/dialogue, `engine.js` real-time
simulation, `render.js` canvas artwork, `ui.js` panels, and `main.js` input/loop.
`render_game_to_text` exposes observable state and `advanceTime(ms)` steps the same
simulation for controlled tests. Calling `advanceTime` pauses the wall clock until
`resumeTime()` is called, so slow automation cannot move targets between inputs.
No runtime dependencies were added.
