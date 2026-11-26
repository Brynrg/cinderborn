# Cinderborn — The Ashen Causeway

A small, complete tactical trial about a stolen noble identity, forbidden fire,
and the cost of getting people out alive. The default entry is the Ashen
Causeway prototype. The original Conclave campaign remains at `conclave.html`, with its
existing save separate from the trial.

## Play locally

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5178 --strictPort
```

Open http://127.0.0.1:5178/ in a desktop browser. Saves belong to that browser
and origin: keep using the same hostname and port to continue a run.

Publication uses the standard GitHub path: a push to `main` triggers the shared
deploy workflow, canonical portal ingest and an auto-merging portal PR. Verify
its checks and the live game page after publishing. Never copy build files into
the portal by hand.

## The trial

- Command Ash, Rook, Sable and Iona on a 61-hex map. Each can move once and
  take one action each round. An action ends the unit's activation.
- Secure the trial seal and extract Ash at the eastern exit before ending
  round 12. Ash's death loses immediately.
- Keep cover: present the stolen signet at the checkpoint, then speak to
  Vesper within two hexes. Her bargain gives you the seal, permission to free
  both captives and an inspection delay, but binds you to escort Mara and
  Brann beside the exit. A captive's death breaks the oath.
- Break cover: Firebrand burns the gate or hits an enemy within two hexes.
  Taking the shrine's seal, attacking, or using Firebrand alarms the guards.
  At 50 suspicion, Ash is exposed and Firebrand damage rises from 5 to 7.
- Embercraft costs one of four embers; only one spell per round. Mend heals
  7 within three hexes and adds 15 suspicion; Firebrand adds 40 suspicion.
  Iona's adjacent Bandage heals 5 without spending embers or raising suspicion.
- Captives can also be freed after their jailer falls. Rescued allies act
  next round. A full band preserves a rescue in reserve instead of discarding it.
- Arbiters arrive at marked beacons in round 6, or round 8 after the bargain.
  They hunt your band even with intact cover. Occupied beacons use the nearest
  free tile. Their first attack follows their displayed intent next round.
- Enemy intentions target fixed hexes. Move away to evade. Forest absorbs
  1 damage, Guard absorbs 2, cliffs block normal shots. Surviving defenders
  retaliate if they can reach the attacker. Inspect the exact forecast first.

Click portraits or figures to select. Click an enemy to inspect, then Commit
attack. Contextual interaction buttons appear near gates, captives, Vesper,
the seal and exit. Blue tiles show reachable ground. Action outcomes appear
above End round, with the recent history in Field journal.

Keys: **1–6** select allies, **E** end round, **Z** undo the latest uncommitted
move, **F** fullscreen, **Escape** cancel targeting or close help/menu.
Tab navigates controls; arrows plus Q/W navigate hexes; Enter selects.
Sound defaults off. Play is entirely turn based; no timers run while deciding.

## Save behavior

The trial uses `cinderborn-causeway-v1`. Every successful action, pending
choice and result is serialized. Continue restores the same open decision,
action availability and enemy intents. Starting a new trial asks before
replacing an existing trial. Corrupt saves fall back to a new trial; blocked
storage shows a visible warning. Original Conclave saves are not converted.

The original campaign's repaired save retains pending/queued events and
pacts, resolved choice effects, used powers, actions and discovered heraldry.
Its canvas has a bounded grid cell and its End Turn control stays outside
the scrolling panel.

## Development and checks

```sh
npm run typecheck   # Syntax checks all authored JS (historical script name)
npm run build      # Builds both trial and original campaign
npm run lint:paths # Relative asset path check
npm test           # Pure rules tests, then real built-browser journeys
```

Install the Playwright Chromium browser once if needed:
`npx playwright install chromium`. The browser suite starts a built preview
on port 4173; keep that port free so it tests this checkout's build.

`src/trial/scenario.js` owns the authored encounter and unit definitions;
`tactics.js` owns movement, forecasts and intent execution; `actions.js` owns
plain-data state transitions; `storage.js` validates persistence; `board.js`
paints the map; `view.js` renders panels; `main.js` connects input and state.
`src/main.js` and `src/styles.css` retain the original campaign.

No runtime packages, external media or network game services were added.
`base: "./"` remains required for the portal's `/games/cinderborn/` mount.
Both entries use relative assets and can be served statically.

## Playtest boundary

The automated routes prove completion and persistence, not enjoyment or
balanced difficulty. This is one authored encounter, with two spell types,
six active allies maximum, no campaign progression and simple optional sound.
Desktop Chromium has automated journey coverage; narrow layout is checked,
but a phone touch playthrough and other browser engines are not yet proven.
See `IMPROVEMENT_PLAN.md` for what to decide after playing.

All world names, dialogue and procedural artwork are original to this project.
