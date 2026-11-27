# Cinderborn status

Updated 2026-11-26. Version 0.7.0-art.1; illustrated world and animation revision.

- **Pass:** four connected regions: Ashen March, Cinderreach, Veiled Fen and
  Crownless Citadel. Main quests, house champions, three new main bosses,
  the optional Red Captain, regional side quests and a playable finale.
- **Pass:** normal-input browser journeys complete both a steel/worker/ally
  route to the covenant and a flame/house route to the crown, retaining their
  progression and endings on reload. Both complete without deaths using active
  defense and upgraded equipment; this is not an exhaustive balance result.
- **Pass:** six equipment rewards, an initial crafted-weapon choice and paid second craft,
  Cinderwake and Nameward, seven talent ranks, Iona's family quest, moonwell
  healing, Oryn's banner, the covenant bell puzzle and recovered journal records.
- **Pass:** three ending rules and reactive epilogues. Covenant requires three
  independent allies. Postgame exploration, three rotating First Judge echo patterns and paid talent retraining.
- **Pass:** existing RPG save migration, regional enemy persistence, cross-region
  return travel, correct-hearth revival, quest gates and reward deduplication.
- **Pass:** 78 rule/persistence/art tests and 31 built-browser tests; syntax check of
  42 JavaScript files, production build, relative-path lint and diff check.
- **Pass:** procedural world, chapter HUD, boss warnings, choices, journal and
  endings inspected at desktop sizes; 390px map/HUD and seven-slot ability bar
  checked for horizontal overflow. Bundled web-game client checked separately.
- **Pass:** tactical trial and original Conclave remain at trial.html and
  conclave.html with their existing saves and checks.
- **Not Proven:** owner enjoyment, exhaustive balance, actual-phone usability,
  Safari/Firefox. Mobile support remains false in the manifest.

## Art and animation

Pixel Frog's original CC0 Tiny Swords release supplies 54 unchanged PNGs under
1 MB, with exact source filenames and hashes. Later differently licensed packs
are excluded. Original creature drawings, object illustrations, spell effects,
ability emblems and region treatments complete the presentation.

Frame animation covers idle, walking, attacks, casts, hit reactions and death.
Decorative motion respects reduced-motion preferences. Presentation does not
enter saves or change gameplay collision. UI portraits and art credits are
linked into the game. Cached color treatments avoid per-frame filter cost.

## Playtest fixes

Two complete baseline campaigns exposed repeated boss patterns and very short
later fights. Fully geared steel could beat the echo without defending. The
Bailiff now marks lanes, the Archivist uses hollow rings, and the Judge chains
two attacks before an opening. New-region bosses can threaten ranged attackers.
Their increased health is migrated proportionally in old saves, including cached
regions. All three echo patterns reject a passive level-20 steel strategy.

Two revised active campaigns finish without deaths, while both passive echo
attempts lose. The final Judge lasts about 17–20 seconds in the tested strategies,
up from 10–12 seconds. This is bounded play evidence, not exhaustive balance.
Browser coverage also switches to the second crafted weapon, redistributes
talents, completes all three echoes and retains the build/record on reload.

Kargan and Torin join their cleared boss areas for chapter decisions. Banner and
flower deliveries work even if collected before accepting the optional quest.
Warnings, rings, lanes, chapter handoffs and trial briefings are visually checked.

## Publication

Owner authorized iterative testing and republication through GitHub. Publish
main through the existing shared workflow and canonical portal ingest. Verify
source CI, the merged portal PR, the live manifest and asset hashes, then complete
the two full campaign routes on production. The live receipt is recorded
separately after deployment so writing it does not trigger another publication.

## Structure and limits

Vanilla JavaScript, HTML and CSS on the locked Vite toolchain. Three entries,
relative assets, procedural artwork and no new runtime dependencies. Solo play,
local saves, no accounts or multiplayer backend. See CAMPAIGN_DESIGN.md for the
new arc and RPG_DESIGN.md for the opening region's design. Existing dependency
audit findings remain outside this gameplay change.
