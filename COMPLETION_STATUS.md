# Cinderborn status

Updated 2026-11-26. Version 0.4.0-trial.3; FFT-inspired contracts and class techniques.

- **Pass:** three contracts with distinct starts, deadlines and speed targets;
  limited class techniques, high-ground damage/forecasts, numbered enemy order,
  and persistent wins/best rounds/honors. Last Light completes in 3 rounds;
  Ashfall in 9, both with all six allies alive and both prisoners safe.
- **Pass:** the solo round-4 shortcut is closed. The shrine requires defeating
  its warden or gaining Vesper’s seal. In the full trial, inspection arrives in round 4 and nearby
  hostiles prevent extraction. Steel against Arbiters keeps house cover intact.
- **Pass:** enemy plans reserve destinations and follow reachable paths; their
  declared target tiles remain fixed throughout the player’s turn.
- **Pass:** objective links, explicit activation budgets, Next ready selection,
  contextual explanations, exact health forecasts, damage/heal feedback,
  survivor honors, desktop layout and a scrollable narrow layout.
- **Pass:** v1/v2 saves migrate into v3 without modifying the original slot.
  Pending choices, used actions, damaged units and completed endings persist.
  Original Conclave remains available at `conclave.html` with separate saves.
- **Pass:** 31 rule/persistence tests and 19 browser tests, syntax validation,
  production build and relative-path lint. Normal-control journeys complete the
  oath route in round 5 and the combat route in round 9, each with six survivors
  and both prisoners rescued. These are demonstrated solutions, not minimums.
- **Not Proven:** owner enjoyment, exhaustive balance, actual-phone usability,
  Safari/Firefox. Mobile support remains false in the manifest.

## Publication

Owner authorized testing and republication through GitHub. Push this release
once to main, then verify source CI, the shared deploy workflow, auto-merging
portal PR and live manifest/assets. Never hand-copy artifacts into the portal.
The final live receipt is recorded separately after deployment so that writing
it does not trigger another publication.

## Structure and limits

Vanilla JavaScript, HTML and CSS on the locked Vite toolchain. Two entries,
relative asset paths, no runtime packages or external artwork. Deterministic,
three-contract tactics on one map with six active allies maximum and browser-local saves.
The existing dependency audit findings remain outside this gameplay change.
