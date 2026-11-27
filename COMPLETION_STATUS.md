# Cinderborn status

Updated 2026-11-26. Version 0.5.0-rpg.1; solo RPG genre rebuild.

- **Pass:** the default game is a continuous, real-time action RPG with direct
  Ash control, NPC quests, sword/fire/healing/dodge abilities, enemy telegraphs,
  levels, talents, equipment, shopping, loot, rest and fast travel.
- **Pass:** normal-input browser journeys complete both the oath/rescue route
  and the defiant Seal Warden route, defeat the Arbiter and retain their ending
  and progression on reload. Freed prisoners appear back at Emberrest.
- **Pass:** optional Hollowfang encounter, mantle discovery/equipment, hearth
  recovery, unlocked fast travel, telegraphs, dodge, death/reload/revival,
  unavailable storage and corrupt-save recovery.
- **Pass:** combat saves remain valid through every simulated frame including
  enemy windup completion and death. New RPG saves are independent of old modes.
- **Pass:** 46 rule/persistence tests, 25 browser tests, syntax validation of
  27 JavaScript files, production build, relative-path lint and diff check.
  The bundled web-game client also exercised movement/combat with no errors.
- **Pass:** visual inspection of the entry, world HUD, attack telegraph, character
  panel, map, progression and endings at desktop sizes; 390px map has no overflow.
- **Pass:** the tactical trial and original Conclave remain available at
  `trial.html` and `conclave.html`; their prior browser and rule tests still pass.
- **Not Proven:** owner enjoyment, exhaustive balance, actual-phone usability,
  Safari/Firefox. Mobile support remains false in the manifest.

## Publication

Owner authorized iterative testing and republication through GitHub. Push this
release to main, verify source CI and the shared deploy workflow, the auto-merging
portal PR and the live manifest/assets. Never hand-copy artifacts into the portal.
The final live receipt is recorded separately after deployment so that writing
it does not trigger another publication.

## Structure and limits

Vanilla JavaScript, HTML and CSS on the locked Vite toolchain. Three entries,
relative assets, original procedural artwork and no new runtime dependencies.
One solo opening region with two story branches and continued exploration after
completion. No multiplayer backend or accounts. Browser-local saves only.
The existing dependency audit findings remain outside this gameplay change.
