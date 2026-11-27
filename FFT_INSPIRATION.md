# Final Fantasy Tactics inspiration

Research and adaptation, 2026-11-26.

Square Enix describes Final Fantasy Tactics as positional, turn-based combat
with a broad job roster and combinations of learned abilities. Its enhanced
edition emphasizes readable unit order and a tactical battlefield view.

Sources:
- [Official gameplay and customization overview](https://final-fantasy-tactics-the-ivalice-chronicles.square-enix-games.com/en-us)
- [Official announcement: jobs, terrain, tactical view and unit order](https://na.finalfantasy.com/en/news/1002750/)

Cinderborn adapts those principles to its short authored hex encounters:

| Principle | Implementation | Decision it creates |
|---|---|---|
| Distinct jobs | Wardens have Bulwark, archers have Pinning shot, heralds have Field dressing; two technique uses per unit/run | Protect, interrupt or heal instead of spending every activation on damage |
| Visible resolution order | Numbered enemy queue linked to the inspector and fixed target hexes | Which threat must be handled before ending the round? |
| Position matters | Marked high ground adds one ranged damage against lower targets; forecasts include it | Take the ridge, keep cover, or remain close enough to support an ally |
| Preparation matters | Three contract cards explain starting conditions and deadlines before play | Learn the full trial, start in an escort crisis, or commit to open battle |
| Repeat runs have a purpose | Persistent best rounds and cumulative honors per contract | Improve speed, rescue everyone, avoid losses, preserve cover or save an ember |

The underlying turn model remains team rounds with a deterministic enemy phase.
The queue displays that phase's real order. Existing original characters, dialogue,
procedural artwork and hex geometry remain the game's visual identity.

Critical replay evidence: the published oath route completed in five rounds,
with three predominantly movement rounds before the confrontation. Last Light
starts after the bargain with inspectors already present. Ashfall starts after
the checkpoint fight with cover broken. Both reuse the causeway in different
states so a repeat attempt gets to its central decisions sooner.

Validation must include complete normal-input journeys, technique targeting and
costs, pinning versus movement/attack intent, high-ground forecasts, record
reload/deduplication, old-save migration, and the published portal mount.
