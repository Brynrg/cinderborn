Original prompt: Go ahead and build the smaller trial you described. Fix the save and layout issues first, then implement and test the new gameplay loop so I can play it locally before we deploy.

## Scope and sequence

- Authorized: implementation, tests, and a local playable server. No deployment or Git publication.
- Baseline: clean main at d29d745; source checkout the existing Cinderborn checkout.
- First repair original Conclave persistence and layout, then preserve it as conclave.html.
- New default: The Ashen Causeway, a complete small tactical encounter with Ash + three allies, two captives, a champion bargain, cover/Embercraft routes, an announced Arbiter arrival, a seal and extraction.
- Keep game rules independent of DOM; use serializable pending decisions and deterministic enemy plans.

## QA inventory

- Original: pending/resolved event reload, power-use reload, fresh save, repeated laptop resize, End Turn visible.
- Trial: start/continue/restart, movement/path/undo, inspect both sides, attack forecast/counterattack, guard, Mend, Firebrand, cover/checkpoint, champion bargain, both captive rescues, arrival warning and enforcers, seal/extraction, Ash defeat and round limit.
- Persistence: every successful action and pending decision, invalid save fallback, separate legacy namespace, reload during choices and after terminal states.
- Layout: 1440x900, 1280x800, 1024x768 and narrow fallback; board/roster/selected action/End Turn; long logs and overlays.
- Accessibility and controls: focusable controls, keyboard movement/selection, help/menu, mute, fullscreen, reduced motion.
- Validation: built browser journeys using normal input, unit rules tests, path lint and syntax checks, develop-web-game client, screenshot inspection and console check.

## Updates

- Installed locked repository dependencies with npm ci. Existing dependency audit reports 5 findings; no dependency upgrade included in this gameplay change.

- Original repairs verified: 3 browser regressions pass (pending/resolved decisions, immediate save/power use, repeated layout resize). Skill client ran successfully and its board capture was inspected. Original mode retained as conclave.html.

- Implemented The Ashen Causeway as the default entry; original retained at conclave.html. Modules separate authored scenario, rules/actions, persistence, canvas, panels and input. No runtime dependencies added.
- State transitions are deterministic and immediately serialized. Validated save schema rejects corrupt/incompatible data; storage denial is visible and does not stop play. Pending gate/bargain decisions and terminal outcomes restore correctly.
- The oath now requires actual living escorts beside the exit, not only unlocked cages. Rescues preserve overflow in reserve. Ash death, a sworn captive's death and the round-12 deadline end the trial.
- Inspection is announced at the beacons for round 6 (8 with the bargain). Fixed enemy target tiles allow evasion. Found and fixed mid-turn retargeting after spells, and prevented enemy forecast paths through stationary friendly units.
- Added normal-input browser routes through both endings. The oath route completes in round 5 with six survivors; the fire route completes in round 6 with two survivors. Scripted examples are not difficulty or enjoyment proof.
- Browser QA also covers choice and combat reloads, restart cancellation/confirmation, used spell retention, corrupt saves, unavailable storage, keyboard focus/hex navigation, help, sound toggle, fullscreen, loss continuation, four desktop viewports and a narrow fallback.
- Fixed a regression-test assumption: random legacy house reports may precede the selected event. The test now dismisses informational reports through the UI before checking the decision.
- Final verification (2026-11-26): Pass — 16 Node rule/persistence tests, 13 Playwright tests, JavaScript syntax check (12 files), production build, relative path lint and git diff --check. Actual temporary static mount at /games/cinderborn/ loaded both entries and their relative link. No runtime errors in final local capture.
- Develop-web-game client rerun on final trial; state capture and canvas image inspected. Full screenshots inspected for desktop, six-member roster, combat and narrow fallback. Output previews: cinderborn-trial-title.png and cinderborn-trial-board.png in the chat outputs folder.
- README, manifest/version, completion status and backlog now describe this trial instead of the stale template. Existing dependency resolutions unchanged.
- Local server remains available at http://127.0.0.1:5178/. No commit, push or deployment. Owner enjoyment/balance, real-phone touch play and other browser engines remain Not Proven.

## Next playtest

Observe objective comprehension, move/action clarity, value of preserving cover,
prisoner attachment, readable enemy intent and whether inspection pressure is
strong enough. The clean oath route currently finishes before inspection.
Do not expand into a campaign or publish before the owner's playtest feedback.

## Publication authorized — 2026-11-26

The owner requested deployment through the normal GitHub path and clarified
that testing and republishing can follow. This supersedes the earlier local-only
scope. Publish the tested trial by pushing this repository to main, follow the
shared deploy workflow and portal PR, then verify the hosted gameplay. No manual
portal artifact copy or direct hosting deploy.

- First publication: e003fa5 pushed to main; deploy workflow 45906784417 succeeded
  and opened the canonical portal PR #235. Game CI built and linted successfully
  but could not install Chromium because ubuntu-latest selected Ubuntu 26.04,
  unsupported by locked Playwright 1.60.0. Pin the game CI runner to Ubuntu 24.04;
  keep dependency versions and the shared deployment path unchanged.

## Critical play and revision — 2026-11-26

Owner requested a critical playthrough, improvements to confusing/easy/boring
parts, tests, and republication through GitHub. Starting from clean 8482b34.

- Live UI playthrough: Ash alone crossed the lower bridge, took the seal beside
  its living warden, then extracted in round 4 with 3 HP. No other ally moved,
  no attack or spell was used, and the inspection never affected play.
- The narrow live viewport also separated the board from commands by a long
  scroll; empty objective hexes offered generic movement errors, and a unit's
  spent action state did not suggest selecting another ready ally.
- Revision: protect the shrine until its warden is defeated (Vesper's bargain
  still bypasses it); move inspection to round 4 and position it to contest
  the escape; require a clear exit. Steel against Arbiters preserves house
  neutrality, so the bargain route gains a tactical finish without forcing fire.
- Preserve old trial saves via migration into a separate v2 slot; never erase
  the original trial or Conclave slot. Existing runs get advance warning of
  any earlier inspection, and terminal saves retain their ending.

- Fixed enemy destination conflicts using projected occupancy; preserve existing
  Arbiter intent when house hostility is first triggered. Clear paths now advance
  while player movement can still deliberately block or evade a declared strike.
- Added objective Find links, contextual map inspection, specific failure reasons,
  explicit move/action budgets, N / Next ready, exact resulting HP in forecasts,
  spell target highlights, floating damage/healing, round damage summaries and
  ending honors. No additional pop-up tutorial or forced end-round confirmation.
- Moved mission guidance above the map so spell actions fit on laptop screens.
  Fixed a narrow-screen portrait row clipping under the cover panel; commands/map
  navigation links and a normal-flow End round avoid overlapping controls.
- Normal-control browser journeys complete oath in round 5 (cover intact, both
  prisoners safe, six survivors) and fire in round 9 (four embers used, both safe,
  six survivors). The latter includes rescue combat, healing and warden defeat.
- Release checks: Pass — 21 Node tests, 15 Playwright tests, 13-file syntax check,
  production build, relative-path lint. Regressions cover the old solo exploit,
  contested extraction, steel preserving cover, locked enemy intents, distinct
  enemy destinations, v1 pending/terminal migration and corrupt new ending fields.
- Visually inspected desktop, 1280x720 six-member roster, inspection threats,
  combat feedback, ending honors and corrected 390px narrow layout. Skill client
  used during iterations and on the release candidate. No browser errors.
- Version 0.4.0-trial.2. Publication authorized; follow the canonical GitHub
  pipeline and confirm both routes on the resulting production build. Owner
  enjoyment and actual-device usability remain open playtest questions.

## FFT-inspired pacing and replay revision — 2026-11-26

Owner requested another playthrough, improvements to pacing/choices/replayability,
testing and GitHub republication; then asked to research Final Fantasy Tactics
and use its gameplay/UI as inspiration. A fresh live oath playthrough again won
in round 5: three mostly movement rounds, one coordinated confrontation, extraction.
The structure is legible but repeat starts and class choices need more variety.

Implementing: three authored contracts with different opening states/deadlines;
limited class techniques (Bulwark, Pinning shot, Field dressing); high ground with
exact ranged damage forecasts; numbered enemy resolution queue; local records,
best rounds and cumulative honors. Keep original characters/artwork and hex rules.
Research: official Square Enix product site and release article describe job/ability
combinations, terrain strategy, turn-order visibility and tactical view. See
FFT_INSPIRATION.md for the adaptation and source links. Tests/play balance pending.

- Implemented three authored contracts, class techniques, high ground, enemy
  action order, local wins/best rounds/honors, and v1/v2-to-v3 save migration.
- UI playthroughs complete Last Light in round 3 and Ashfall in round 9, both
  with six survivors, both prisoners safe and all four contract honors. Last
  Light uses Pinning shot to cancel an approach, then a coordinated finish;
  Ashfall uses Bulwark to reduce incoming damage. Ordinary attacks, healing,
  spell timing, hostage rescue and extraction remain meaningful choices.
- Replayed both full-trial routes through normal controls: oath round 5 and
  fire round 9. Tests reload after techniques/decisions/endings, check exact
  costs and damage, and ensure reloads do not double-count wins.
- Fixed a clipped technique confirmation by using a compact targeting inspector;
  arranged contract cards across desktop so Begin stays visible. Inspected
  1280x720 screenshots, six-member rosters, 390px narrow layout, high-ground
  markers, enemy queue, previews and ending/record screens. Skill client ran
  against the final local game; no runtime errors were reported.
- Release checks: Pass — 31 rule/persistence tests and 19 browser tests,
  18-file syntax check, production build, relative-path lint and diff check.
  Version 0.4.0-trial.3. Publication remains the canonical GitHub pipeline;
  final production identity and four live journeys will be recorded separately.
- Limits: deterministic encounters on one map; no campaign/job advancement yet.
  Owner enjoyment, exhaustive balance and physical-phone testing remain Not Proven.

## Genre rebuild — solo MMORPG feel — 2026-11-26

Owner rejected tactical gameplay and requested a whole-game rethink while keeping
story/world. Clarified: MMORPG feel first, solo exploration/combat/quests/progression.
Implementing a real-time top-down RPG with direct Ash control, open region, NPC
quest chains, equipment, XP/levels/talents, cooldown skills, bosses, discovery and
persistent saves. Existing tactical and Conclave entries/saves remain separate.
Main play should feel like adventuring through the world, not commanding a board.

- Implemented the new RPG entry with real-time movement/targeting, sword/fire/heal/
  dodge skills, telegraphed enemy attacks, boss phase, camp/roads/ruins/river,
  NPC conversations, two main-story branches, side quests, XP/levels/talents,
  equipment, shop, loot, rest/checkpoints/fast travel, death recovery and saves.
- Both normal-input browser journeys reached chapter completion: Vesper's oath
  with both rescues, and the defiant Seal Warden path with optional rescues skipped.
  Gathering, bounty turn-in, shopping, equipment and talent choices occur en route.
- Found/fixed navigation to clear points inside partially blocked grid cells
  (notably beside Sable's building); added a regression. Added rescued NPCs to
  the camp so the story outcome changes the world. Shop shows available crowns
  and disables unaffordable purchases. New save is isolated from all old modes.
- Visually inspected the entry, world HUD, progression scene, ending, character
  panel and 390px map. The skill client exercises continuous movement and combat.
  Complete release checks and live verification pending.
- Final review caught a floating-point enemy windup below zero, which invalidated
  combat saves; clamped it and added a frame-by-frame combat/death save regression.
- Release checks: Pass — 46 rule/persistence tests, 25 browser tests, 27-file
  syntax check, production build, relative-path lint and diff check. Both new
  story routes, optional Hollowfang/loot/equipment, rest/fast travel, telegraphs,
  dodge, death/reload/revival and all legacy browser journeys pass. The final
  skill-client screenshot/state has no errors; inspected full HUD and panels.
- Version 0.5.0-rpg.1. Canonical GitHub publication and live verification follow.
  Scope remains a solo opening region; owner enjoyment and phone/Safari/Firefox
  acceptance are Not Proven.
- Linux CI found a journey assertion race: a weak selected enemy can die from
  the first automatic steel strike before the selection assertion runs. The
  journey now accepts the observed dead enemy as the expected combat outcome;
  living enemies must still be correctly targeted. Rechecking before final receipt.
- Live verification caught rescued Mara's new camp position overlapping scenery.
  Moved both return positions inside the camp clearing and extended the oath
  browser journey to return and speak to both rescued people after reload.
- Version 0.5.0-rpg.2: all 46 rule/save tests and 25 browser tests pass again,
  including the new post-ending camp visit. Final skill-client camp traversal
  screenshot/state inspected; no errors. Publication uses the same GitHub route.
- Root cause of the Linux targeting failure was the test clock resuming live
  animation 120 ms after each controlled step. Reproduced 74 px of unintended
  movement during a 500 ms gap. advanceTime now takes persistent clock control;
  resumeTime explicitly restores real-time play. Normal play never invokes the
  hook. Added a slow-input/resume regression; release is 0.5.0-rpg.3.
- Final clock correction: all 46 rule/save tests and 26 browser tests pass;
  syntax, build and relative-path checks also pass. The new regression proves
  that delayed inputs do not advance the world and explicit resume restores it.
