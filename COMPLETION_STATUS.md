# Cinderborn status

Updated 2026-11-26. Local version 0.4.0-trial.1, based on d29d745.
This is Cinderborn, not the inherited template described by the old status file.

- **Pass:** a complete local Ashen Causeway trial at the default entry, with
  four starting allies, two rescues, a champion bargain, cover/Embercraft,
  announced inspection, exact combat forecasts, fixed target intentions,
  a seal objective, extraction and loss states.
- **Pass:** independent validated trial saves, pending-choice and result
  continuation, used-action retention, restart confirmation and storage-error feedback.
- **Pass:** original campaign retained at `conclave.html`; pending/resolved
  event and used-power save regressions pass. Its board sizing and persistent
  End Turn control pass repeated desktop resizing.
- **Pass:** 16 rule/persistence tests and the current browser journey suite,
  including both complete routes through normal UI controls. See progress.md
  for the final check receipt.
- **Not Proven:** owner enjoyment, route balance, actual-phone usability,
  other browser engines. Publication through the standard GitHub pipeline was
  authorized on 2026-11-26; verify its resulting workflow and live build.

## Structure

Vanilla JavaScript, HTML and CSS, built with the locked Vite 5 toolchain.
Two HTML entries, relative Vite base, no runtime SDK or external assets.
New trial rules/state are separated from canvas/DOM; original code remains
in src/main.js. Tests use Node's built-in runner and the existing Playwright
package. The historically named typecheck command checks JavaScript syntax.

## Known constraints

One small authored scenario; deterministic enemies; no progression or
campaign integration. The clean bargain route can finish before inspection;
owner feedback should decide if it needs more pressure. Storage is local to
browser/origin and is not cloud synced. Invalid saves recover with a fresh run.
The dependency audit findings present during npm ci were not addressed in
this gameplay change. See IMPROVEMENT_PLAN.md for bounded next steps.
