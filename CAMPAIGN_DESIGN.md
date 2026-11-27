# Cinderborn campaign expansion — 0.6.0-campaign.1

The opening RPG had one regional arc and ended at the road to the Conclave.
The expansion turns that destination into a playable conclusion while keeping
Ash, the dead noble's crest, forbidden fire, exiles and the five houses.

## Story and choices

Auren Vale is the noble whose signet Ash carries. His investigation connects
Cinderreach's furnace levy to the Attainted Roll: the houses take names from the
exiles and burn the belonging those names represent. Torin's archive and Iona's
family give the political crime a personal consequence. Vesper admits her role
in Auren's failed escape. Rook returns at the Citadel to ask Ash to choose a name
of their own.

Furnace ownership, Oryn's debt, the archive and the moonwell have distinct local
outcomes. Freeing both prisoners, backing the workers, forgiving Oryn's deserters,
healing Syla and publishing the census each provide one independent ally. Three
allies unlock the covenant ending. Crown and freedom remain available to every
completed route. Final epilogues reflect the chosen ending and earlier deeds.
The freedom ending accepts disruption; the crown preserves order and concentrates
responsibility; the covenant relies on witnesses and shared power.

## Play structure

Four independently cached 2600×1700 regions retain local enemy state across
travel and reload. Main quests progress through three geographically separated
objectives, a boss and a consequential conversation. Side activities share those
roads: crafting and supplies in the foundry, records and healing in the fen,
beacons and a testament in the citadel. Discovered hearths reduce return trips.

The forge grants an area attack; the archive grants a short damage shield.
Edda offers an exclusive steel or flame weapon choice; the hidden relic rewards
exploration without making either starting craft mandatory. New armor supports
late-game survival. Expansion XP is reduced from the first prototype to preserve
levels for later chapters. Level 20 and seven ranks per talent leave room for
build choices rather than unused points after maxing three short trees.

Bosses retain readable ground telegraphs and recovery windows. Pressure valves,
records and beacons explicitly disable their wards; approaching early produces
an actionable instruction. The First Judge enrages below half health. Its
postgame echo starts enraged and preserves the chosen ending.

## Persistence and verification

The existing cinderborn-rpg-v1 slot is migrated in place when loaded. Old chapter
completion, equipment, damage and choices carry forward. New saves include the
region, inactive enemy caches, campaign flags, puzzle progress and abilities.
Validation bounds every cached enemy against its regional spawn definition.
Death returns to the correct hearth, clears pursuers and preserves progress.

Automated browser routes use normal keyboard, canvas and map controls with the
same deterministic simulation clock as the game. Two complete routes cover
steel/worker/covenant and flame/house/crown decisions, crafting, side quests,
optional encounters, ending/reload, return travel and the echo. Rule tests cover
all three endings, gates, old-save migration, rewards, navigation and abilities.
Procedural terrain and UI screenshots are inspected separately from state checks.
