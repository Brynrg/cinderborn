# Cinderborn — The Conclave Trials

A browser strategy game. Turn-based hex tactics: you are Ash, a lowcaste Cinder
remade to pass as one of the ruling Lumen, thrown into the Conclave Trials — a
proving-ground war between six noble houses and their champions. Conquer rival
keeps, free the shackled captives of fallen houses to swell your ranks, guard
the secret of what you are, and when the Arbiters rig the trial against you,
storm their Spire.

Live at <https://speedrungames.net/games/cinderborn/>.

## Run it

```bash
npm install
npm run dev       # local dev server
npm test          # build + Playwright smoke test
```

Every push to `main` auto-deploys to the portal.

## How to play

- **Click** a unit to select it; blue hexes = movement, red rings = attack
  targets. **Tab** cycles ready units. **E** ends the turn. **Esc** deselects.
- Walk onto a **shackled marker** (chain icon) to free that unit — it joins
  you. Freeing 8+ captives changes the ending. Gold-chained markers are fallen
  **champions**; free one and it fights for you, name and all.
- **Ash (✦) is you.** Ash regenerates 2 HP/turn — but if Ash dies, you lose.
  While your cover holds, no house dares strike a "noble scion"; once you are
  exposed (or the trial drags past turn 10), that protection is gone.
- **Embercraft** (one power per turn, costs supply, raises **Suspicion**):
  Firebrand (+3 attack), Mend (heal 8), Veilstep (a unit acts again).
  At 50 suspicion the Arbiters send a probe; at 100 you are **exposed** — every
  house hunts you for 5 turns.
- Loot **ruins** (gold-flecked columns) for +4 supply. Hold **camps** for
  income. **Heralds** heal adjacent allies; **Lancers** hit harder after
  charging 3+ hexes.
- Defeat houses by taking their keep. When 3 houses have fallen the central
  **Spire** unlocks (and its guard wakes). End a unit's move on the Spire to
  win — as liberator or conqueror, depending on how you played.

## Design & IP notes

This game is *loosely inspired by* the themes of caste-dystopia fiction
(a lowborn infiltrator; an academy war-game; victory through liberating the
conquered). Those are **ideas and mechanics**, which copyright does not
protect. Everything expressive here is original to this project:

- Original world (city-state of Vael, Lumen/Cinder castes, the Conclave,
  Arbiters, the Spire), original characters (Ash; the champions Kargan
  Ironheart, Vespera Nightwhisper, Torin Stoneveil, Garen Bloodsworn, Elara
  Moonhunger) — no names, characters, dialogue, or text are taken from any
  novel.
- No trademarks or trade dress of any franchise are used.
- All art is procedural canvas drawing; all text was written for this game.

Do not add franchise names, character names, or quoted text when extending it.
