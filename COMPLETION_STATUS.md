# Cinderborn status

Updated 2026-11-26. Version 0.6.0-campaign.1; four-chapter campaign expansion.

- **Pass:** four connected regions: Ashen March, Cinderreach, Veiled Fen and
  Crownless Citadel. Main quests, house champions, three new main bosses,
  the optional Red Captain, regional side quests and a playable finale.
- **Pass:** normal-input browser journeys complete both a steel/worker/ally
  route to the covenant and a flame/house route to the crown, retaining their
  progression and endings on reload. Both complete without deaths using active
  defense, equipment and healing; this is not an exhaustive balance result.
- **Pass:** six new equipment rewards, mutually exclusive crafted weapons,
  Cinderwake and Nameward, seven talent ranks, Iona's family quest, moonwell
  healing, Oryn's banner, the covenant bell puzzle and recovered journal records.
- **Pass:** three ending rules and reactive epilogues. Covenant requires three
  independent allies. Postgame exploration and the enraged First Judge echo.
- **Pass:** existing RPG save migration, regional enemy persistence, cross-region
  return travel, correct-hearth revival, quest gates and reward deduplication.
- **Pass:** 66 rule/persistence tests and 29 built-browser tests; syntax check of
  33 JavaScript files, production build, relative-path lint and diff check.
- **Pass:** procedural world, chapter HUD, boss warnings, choices, journal and
  endings inspected at desktop sizes; 390px map/HUD and seven-slot ability bar
  checked for horizontal overflow. Bundled web-game client checked separately.
- **Pass:** tactical trial and original Conclave remain at trial.html and
  conclave.html with their existing saves and checks.
- **Not Proven:** owner enjoyment, exhaustive balance, actual-phone usability,
  Safari/Firefox. Mobile support remains false in the manifest.

## Playtest fixes

The first expansion route reached high levels too early; new quest and encounter
XP was reduced to preserve growth through the later chapters. Actual movement
checks caught path edges clipping scenery between clear grid centers. A pursuer
could block revival after regional travel was added; recovery now clears pursuit
before returning to the correct hearth. Chapter transitions ignore a harmless
combat cooldown when no enemy remains, while active pursuit still blocks travel.
Completed side quests fall back to the main objective; ready rewards use question
marks. Forbidden-fire suspicion also attracts unwarded new sentinels.

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
