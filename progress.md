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
