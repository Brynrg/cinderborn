import "./styles.css";

/* Cinderborn — The Conclave Trials (v0.2)
   Turn-based hex strategy. Vanilla JS + canvas, no dependencies.
   All names, text, and art original to this project. */

/* ---------------- config ---------------- */

const R = 8;                 // map radius in hexes
const SQ3 = Math.sqrt(3);

const TYPES = {
  blade:  { name: "Blade",  glyph: "B", hp: 12, atk: 4, rng: 1, mv: 3, cost: 6,
            desc: "Cheap line infantry." },
  archer: { name: "Archer", glyph: "A", hp: 8,  atk: 3, rng: 2, mv: 2, cost: 8,
            desc: "Strikes from two hexes." },
  lancer: { name: "Lancer", glyph: "L", hp: 10, atk: 3, rng: 1, mv: 4, cost: 8,
            desc: "Fast. +2 damage after charging 3+ hexes." },
  herald: { name: "Herald", glyph: "H", hp: 9,  atk: 1, rng: 1, mv: 3, cost: 7,
            desc: "Heals adjacent allies 3 each turn." },
  warden: { name: "Warden", glyph: "W", hp: 18, atk: 3, rng: 1, mv: 2, cost: 10,
            desc: "Slow, hard to kill." },
  enforcer: { name: "Enforcer", glyph: "E", hp: 18, atk: 4, rng: 1, mv: 3, cost: 0,
            desc: "Arbiter steel. Hunts you." },
  avatar: { name: "Ash, the Cinder", glyph: "✦", hp: 16, atk: 4, rng: 1, mv: 3, cost: 0,
            desc: "You. Regenerates 2/turn. If Ash falls, the lie unravels." },
};

const CHAMPS = {
  1: { name: "Kargan Ironheart",    cry: "Break their bones, claim their sky.",
       hp: 26, atk: 5, rng: 1, mv: 2 },
  2: { name: "Vespera Nightwhisper", cry: "Shadows bite deeper than steel.",
       hp: 16, atk: 4, rng: 1, mv: 4 },
  3: { name: "Torin Stoneveil",     cry: "We endure, we outlast, we remain.",
       hp: 14, atk: 3, rng: 3, mv: 2 },
  4: { name: "Garen Bloodsworn",    cry: "Loyalty is the only true armor.",
       hp: 18, atk: 4, rng: 1, mv: 3, lifesteal: 4 },
  5: { name: "Elara Moonhunger",    cry: "Feed the light, starve the weak.",
       hp: 16, atk: 3, rng: 1, mv: 3, duelist: 2 },
};

const FALL_MISSIVES = {
  1: "Our iron rusts, but our rage remains eternal. You have broken the shield, not the spirit.",
  2: "The dark hides what you cannot see. We fade into the night, waiting for your undoing.",
  3: "Silence is our weapon, and you are deaf to it. The stone remembers every footstep you took.",
  4: "Blood calls to blood, and yours is now ours. Betrayal tastes sweet on the tongue of victory.",
  5: "The light consumes all, even those who wield it. You were merely fuel for our ascension.",
};

/* ---- heraldry: The Attainted Roll ----
   Petra Sancta hatching stands in for color. Six canonical tinctures, each a
   flat pigment paired with the one true hatch pattern that identifies it —
   this IS the fog-of-war/claim system, not decoration bolted on top. Ash
   (the player) is Sable, outside the six, with a bend-sinister charge baked
   in from turn one. One reserved alarm tone exists ONLY for the momentary
   exposure flash — it never appears as ambient chrome or a house color. */
const INK = "#2a1e16";
const VELLUM = "#e9dfc7";
const ALARM = "#b23a1f"; // reserved: exposure-flash VFX only.

// the "metal" flag mirrors heraldry's real rule of tincture: a metal (Or,
// Argent — pale) field takes an ink charge; a colour (dark) field takes a
// vellum charge. Ash's Sable and the fog-hatch background both key off this
// same rule so the charge is never lost against its own field.
const TINCTURE = {
  gules:   { color: "#a83226", hatch: "vertical",   metal: false },
  azure:   { color: "#2c4f7c", hatch: "horizontal", metal: false },
  vert:    { color: "#3f6b4f", hatch: "diagonal",   metal: false },
  or:      { color: "#c99a2e", hatch: "dots",       metal: true  },
  purpure: { color: "#5b3a63", hatch: "crosshatch", metal: false },
  argent:  { color: "#c9c3b0", hatch: "blank",      metal: true  },
  sable:   { color: "#1c1712", hatch: "crosshatch", metal: false },
};

// each type's heraldic charge (silhouette-first, six distinct shapes)
const CHARGE = {
  blade: "lion", archer: "eagle", warden: "tower", lancer: "horse",
  herald: "dove", enforcer: "serpent", avatar: "lion",
};

const HOUSE_DEFS = [
  { id: 0, name: "You — the Cinder",  motto: "Wearing stolen light.",                    color: TINCTURE.sable.color,   tinct: "sable",   sigil: "lion",    player: true,  keep: [0, 7] },
  { id: 1, name: "House Vorthos", motto: "Iron wills temper the soul.",             color: TINCTURE.azure.color,   tinct: "azure",   sigil: "lion",    keep: [7, 0],  persona: "aggressive" },
  { id: 2, name: "House Kaelen",  motto: "Shadows dance where light dares not.",    color: TINCTURE.purpure.color, tinct: "purpure", sigil: "serpent", keep: [7, -7], persona: "expansionist" },
  { id: 3, name: "House Mirex",   motto: "Silence is the sharpest blade.",          color: TINCTURE.vert.color,    tinct: "vert",    sigil: "tower",   keep: [0, -7], persona: "defensive" },
  { id: 4, name: "House Oryn",    motto: "Blood binds tighter than golden chains.", color: TINCTURE.gules.color,   tinct: "gules",   sigil: "eagle",   keep: [-7, 0], persona: "aggressive" },
  { id: 5, name: "House Syla",    motto: "Grace is the mask of a hungry heart.",    color: TINCTURE.or.color,      tinct: "or",      sigil: "dove",    keep: [-7, 7], persona: "expansionist" },
];
const ARB = 99; // arbiter house id
const ARB_TINCT = "argent";

const POWERS = {
  firebrand: { name: "Firebrand", cost: 5, susp: 10,
    desc: "+3 attack this turn", needs: u => true },
  mend:      { name: "Mend",      cost: 4, susp: 8,
    desc: "heal 8", needs: u => u.hp < u.maxhp },
  veilstep:  { name: "Veilstep",  cost: 7, susp: 14,
    desc: "act again", needs: u => u.moved || u.attacked },
};

const DIFFS = {
  ember: { label: "Ember", startBonus: 6, suspDecay: 5, enforcerAtk: 3, aiIncome: 0 },
  trial: { label: "Trial", startBonus: 0, suspDecay: 3, enforcerAtk: 4, aiIncome: 0 },
  pyre:  { label: "Pyre",  startBonus: 0, suspDecay: 2, enforcerAtk: 5, aiIncome: 1 },
};

const SAVE_KEY = "cinderborn-save-v3";

const DIRS = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];

/* ---------------- state ---------------- */

let tiles, units, shackled, houses, turn, renown, defeated, playerFalls, selected;
let spireUnlocked, arbStage, uidSeq, gameOver, busy;
let susp, probed, exposedTurns, powerUsed, freedCount;
let firstBlood, firstFree;
let pacts, brokenPacts, offeredPacts, usedEvents, avatarBusyNext;
let diffKey = "trial";
let reachCache = null; // {unitId, moves:Map(key->cost), targets:Set(unitId)}
let storyQueue = [];
const diff = () => DIFFS[diffKey];

const canvas = document.getElementById("board");
let ctx = canvas.getContext("2d"); // reassigned briefly during renderStaticLayer() to target the offscreen cache
let view = { s: 26, ox: 0, oy: 0 }; // hex size + pixel offset

/* ---- heraldic render state (the roll-of-arms layer) ----
   revealedUnits: which enemy units have been "emblazoned" (seen in true
   tincture) this game — the unblazoned/fog treatment for units.
   claimFx / revealFx / deathFx: short tweens for the crossfade/degrade
   effects; alarmFlash: the single reserved-tone exposure pulse.
   staticDirty gates the offscreen terrain+claim cache (guardrail: redraw
   only on state change, never per frame). */
let revealedUnits, claimFx, revealFx, deathFx, alarmFlash;
let staticDirty = true;
let rafHandle = null;

/* ---------------- helpers ---------------- */

const key = (q, r) => q + "," + r;
const hexDist = (a, b) =>
  (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
const tileAt = (q, r) => tiles.get(key(q, r));
const unitAt = (q, r) => units.find(u => u.q === q && u.r === r && u.hp > 0);
const shackleAt = (q, r) => shackled.find(s => s.q === q && s.r === r);
const houseById = id => houses.find(h => h.id === id);
const rnd = n => Math.floor(Math.random() * n);
const unitName = u => u.champ ? u.champ.name : TYPES[u.type].name;

function toPixel(q, r) {
  return { x: view.ox + view.s * SQ3 * (q + r / 2), y: view.oy + view.s * 1.5 * r };
}
function fromPixel(x, y) {
  const q = ((x - view.ox) * SQ3 / 3 - (y - view.oy) / 3) / view.s;
  const r = (y - view.oy) * 2 / 3 / view.s;
  let rq = Math.round(q), rr = Math.round(r), rs = Math.round(-q - r);
  const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs + q + r);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return { q: rq, r: rr };
}

/* ---------------- map generation ---------------- */

function generateMap() {
  tiles = new Map();
  for (let q = -R; q <= R; q++)
    for (let r = Math.max(-R, -q - R); r <= Math.min(R, -q + R); r++) {
      const roll = Math.random();
      let terrain = "plains";
      if (roll < 0.12) terrain = "forest";
      else if (roll < 0.19) terrain = "mountain";
      else if (roll < 0.24) terrain = "water";
      else if (roll < 0.29) terrain = "ruins";
      // vellum mottle: a low-frequency per-tile brightness jitter, baked once
      // at generation (not recomputed per frame) — ±4% of the ground tone.
      const mottle = (Math.random() - 0.5) * 0.08;
      tiles.set(key(q, r), { q, r, terrain, camp: false, campOwner: null,
                             keep: null, keepRuin: false, spire: false, looted: false, mottle });
    }

  // spire at center, clear approach
  for (const t of tiles.values())
    if (hexDist(t, { q: 0, r: 0 }) <= 1) t.terrain = "plains";
  tileAt(0, 0).spire = true;

  // keeps: clear a pocket around each
  for (const h of HOUSE_DEFS) {
    const [q, r] = h.keep;
    for (const t of tiles.values())
      if (hexDist(t, { q, r }) <= 1) t.terrain = "plains";
    tileAt(q, r).keep = h.id;
  }

  // carve passable lines keep -> center so nothing is walled off
  for (const h of HOUSE_DEFS) {
    let [q, r] = h.keep;
    while (q !== 0 || r !== 0) {
      let best = null, bd = Infinity;
      for (const [dq, dr] of DIRS) {
        const d = hexDist({ q: q + dq, r: r + dr }, { q: 0, r: 0 });
        if (d < bd) { bd = d; best = [q + dq, r + dr]; }
      }
      [q, r] = best;
      const t = tileAt(q, r);
      if (t && (t.terrain === "mountain" || t.terrain === "water")) t.terrain = "plains";
    }
  }

  // supply camps: 14, on open ground, away from keeps and spire
  const open = [...tiles.values()].filter(t =>
    t.terrain === "plains" && !t.keep && !t.spire &&
    hexDist(t, { q: 0, r: 0 }) >= 3 &&
    HOUSE_DEFS.every(h => hexDist(t, { q: h.keep[0], r: h.keep[1] }) >= 3));
  for (let i = 0; i < 14 && open.length; i++) {
    const t = open.splice(rnd(open.length), 1)[0];
    t.camp = true;
  }
}

/* ---------------- setup ---------------- */

function newGame() {
  generateMap();
  houses = HOUSE_DEFS.map(h => ({ ...h, alive: true, supply: 10 }));
  houses[0].supply += diff().startBonus;
  units = []; shackled = []; uidSeq = 1;
  turn = 1; renown = 0; defeated = 0; playerFalls = 0; selected = null;
  spireUnlocked = false; arbStage = 0; gameOver = false; busy = false;
  susp = 0; probed = false; exposedTurns = 0; powerUsed = false; freedCount = 0;
  firstBlood = false; firstFree = false;
  pacts = new Set(); brokenPacts = new Set(); offeredPacts = new Set();
  usedEvents = new Set(); avatarBusyNext = false;
  reachCache = null; storyQueue = [];
  revealedUnits = new Set(); claimFx = new Map(); revealFx = new Map();
  deathFx = []; alarmFlash = null; staticDirty = true;

  for (const h of houses) {
    const spots = freeNeighbors(h.keep[0], h.keep[1]);
    spawnUnit(h.id, "blade", ...spots[0]);
    spawnUnit(h.id, "blade", ...spots[1]);
    spawnUnit(h.id, "archer", ...spots[2]);
    if (h.player) {
      spawnUnit(0, "avatar", ...spots[3]);
      if (spots[4]) spawnUnit(0, "warden", ...spots[4]);
    } else if (CHAMPS[h.id]) {
      spawnUnit(h.id, "blade", ...spots[3], CHAMPS[h.id]);
    }
  }
  units.forEach(u => { u.moved = false; u.attacked = false; });

  log("The gates open; the trial of light begins.", "hot");
  log("Fell three houses and the Spire will unlock.");
  layoutView();
  render(); updatePanel();
}

function freeNeighbors(q, r) {
  const out = [];
  for (const [dq, dr] of DIRS) {
    const t = tileAt(q + dq, r + dr);
    if (t && passableTerrain(t) && !t.spire && !unitAt(t.q, t.r) && !shackleAt(t.q, t.r))
      out.push([t.q, t.r]);
  }
  return out;
}

function spawnUnit(house, type, q, r, champ) {
  const src = champ || TYPES[type];
  const u = {
    id: uidSeq++, house, type, q, r,
    hp: src.hp, maxhp: src.hp, atk: src.atk, rng: src.rng, mv: src.mv,
    champ: champ || null, tempAtk: 0, movedDist: 0, kills: 0, vet: false,
    moved: true, attacked: true, freed: false, facing: house === 0 ? 1 : -1,
  };
  if (type === "enforcer") u.atk = diff().enforcerAtk;
  units.push(u);
  return u;
}

function passableTerrain(t) {
  if (!t) return false;
  if (t.terrain === "mountain" || t.terrain === "water") return false;
  if (t.spire && !spireUnlocked) return false;
  return true;
}

/* ---------------- movement / combat ---------------- */

// BFS reachable tiles for a unit. Enemies block; allies can be passed, not landed on.
function reachable(u) {
  const dist = new Map([[key(u.q, u.r), 0]]);
  const frontier = [{ q: u.q, r: u.r, d: 0 }];
  while (frontier.length) {
    const cur = frontier.shift();
    if (cur.d >= u.mv) continue;
    for (const [dq, dr] of DIRS) {
      const q = cur.q + dq, r = cur.r + dr, k = key(q, r);
      if (dist.has(k)) continue;
      const t = tileAt(q, r);
      if (!passableTerrain(t)) continue;
      const occ = unitAt(q, r);
      if (occ && occ.house !== u.house) continue;         // enemies block
      dist.set(k, cur.d + 1);
      frontier.push({ q, r, d: cur.d + 1 });
    }
  }
  const moves = new Map();
  for (const [k, d] of dist) {
    const [q, r] = k.split(",").map(Number);
    if (q === u.q && r === u.r) continue;
    if (unitAt(q, r)) continue;
    moves.set(k, d);
  }
  return moves;
}

function attackableFrom(u) {
  const out = [];
  for (const e of units)
    if (e.hp > 0 && e.house !== u.house && hexDist(u, e) <= u.rng) out.push(e);
  return out;
}

function computeReach(u) {
  reachCache = {
    unitId: u.id,
    moves: u.moved ? new Map() : reachable(u),
    targets: new Set(u.attacked ? [] : attackableFrom(u).map(e => e.id)),
  };
}

function doMove(u, q, r, dist) {
  u.movedDist = dist ?? hexDist(u, { q, r });
  const from = toPixel(u.q, u.r), to = toPixel(q, r);
  if (Math.abs(to.x - from.x) > 0.5) u.facing = to.x >= from.x ? 1 : -1;
  u.q = q; u.r = r; u.moved = true;
  if (u.house === 0) sfx("move");
  const t = tileAt(q, r);

  // liberate a shackled captive
  const sh = shackleAt(q, r);
  if (sh && u.house === 0) {
    shackled = shackled.filter(s => s !== sh);
    const spots = freeNeighbors(q, r);
    if (spots.length) {
      const src = sh.champ || TYPES[sh.type];
      const nu = spawnUnit(0, sh.type, spots[0][0], spots[0][1], sh.champ);
      nu.hp = Math.max(1, Math.ceil(src.hp * 0.6));
      nu.freed = true;
      freedCount++;
      renown += sh.champ ? 3 : 1;
      sfx("liberate");
      if (sh.champ) {
        story("A CHAMPION UNCHAINED", sh.champ.name,
          `"${sh.champ.cry}" — the words ring different, spoken for you. A champion of the highborn kneels to a Cinder, and means it.`);
        log(`${sh.champ.name} joins you.`, "gold");
      } else if (!firstFree) {
        firstFree = true;
        story("MISSIVE", "The First Unchained",
          "The chains fall, and the captive's eyes hold more fear than gratitude. Freedom is a heavy burden — and now it is yours to carry together.");
        log("Chains break; the forgotten rise to fight again.", "gold");
      } else {
        log("Chains break; the forgotten rise to fight again.", "gold");
      }
    } else log("No room to unshackle the captive here.");
  }

  // loot ruins
  if (t.terrain === "ruins" && !t.looted) {
    t.looted = true;
    staticDirty = true;
    if (u.house === 0) {
      houses[0].supply += 4;
      log("You scavenge the ruins. +4 supply.");
    } else if (u.house !== ARB) {
      houseById(u.house).supply += 4;
    }
  }

  if (t.camp && t.campOwner !== u.house) {
    t.campOwner = u.house;
    markClaim(q, r);
    if (u.house === 0) log("Supply camp seized. +2 supply per turn.");
  }
  if (t.keep !== null && t.keep !== u.house) captureKeep(u, t);
  if (t.spire && spireUnlocked && u.house === 0) return win();
  afterAction();
}

function doAttack(u, e) {
  u.attacked = true; u.moved = true; // attacking ends the unit's activation
  if (u.house === 0 && pacts.has(e.house)) breakPact(e.house);
  revealUnit(u); revealUnit(e);
  sfx("strike");
  strike(u, e);
  if (e.hp > 0 && hexDist(u, e) <= e.rng) strike(e, u, true);
  afterAction();
}

function breakPact(houseId) {
  pacts.delete(houseId);
  brokenPacts.add(houseId);
  addSusp(15);
  const h = houseById(houseId);
  story("OATH BROKEN", h.name,
    `You swore, and you struck anyway. ${h.name} will not kneel twice — and the Arbiters make note of nobles who lie. +15 suspicion.`);
  log(`Pact with ${h.name} broken. They remember.`, "hot");
}

function strike(a, d, isCounter) {
  const t = tileAt(d.q, d.r);
  let dmg = a.atk + (a.tempAtk || 0) + rnd(2);
  if (a.type === "lancer" && !isCounter && a.movedDist >= 3) dmg += 2;
  if (isCounter && a.champ?.duelist) dmg += a.champ.duelist;
  if (t.terrain === "forest" || t.terrain === "ruins") dmg -= 1;
  if (t.keep !== null && t.keep === d.house) dmg -= 2; // walls of home
  dmg = Math.max(1, dmg);
  d.hp -= dmg;
  if (d.hp <= 0) {
    kill(a, d);
    if (a.champ?.lifesteal) a.hp = Math.min(a.maxhp, a.hp + a.champ.lifesteal);
  } else if (!isCounter && a.house === 0) {
    log(`${unitName(a)} strikes for ${dmg}.`);
  }
}

function kill(killer, dead) {
  dead.hp = 0;
  pushDeathFx(dead);
  const deadHouse = houseById(dead.house);
  if (dead.type === "avatar") {
    units = units.filter(u => u.hp > 0);
    return lose("Your form crumbles into cold dust. The light fades, and with it, your stolen legacy.");
  }
  killer.kills = (killer.kills || 0) + 1;
  if (killer.kills >= 2 && !killer.vet) {
    killer.vet = true;
    killer.atk += 1; killer.maxhp += 3; killer.hp += 3;
    if (killer.house === 0) log(`${unitName(killer)} is hardened by the trial. +1 ATK, +3 HP.`, "gold");
  }
  sfx("kill");
  if (!firstBlood && killer.house === 0) {
    firstBlood = true;
    story("MISSIVE", "First Blood",
      "A single drop of ash stains the pristine marble. The game has truly begun, imposter.");
    log("First blood stains the pristine ground.", "hot");
  }
  // the fallen are shackled where they stood — unless they were Arbiter steel
  if (dead.house !== ARB) {
    shackled.push({ q: dead.q, r: dead.r, type: dead.type, from: dead.house, champ: dead.champ });
    if (dead.champ) log(`${dead.champ.name} falls, shackled with the rest.`, "hot");
  } else {
    log("An Arbiter enforcer falls. The judges felt that.", "gold");
  }
  units = units.filter(u => u.hp > 0);
  if (deadHouse && deadHouse.alive && !deadHouse.player &&
      !units.some(u => u.house === dead.house) &&
      deadHouse.supply < cheapestCost()) {
    fellHouse(deadHouse, killer.house);
  }
}

function cheapestCost() { return TYPES.blade.cost; }

function captureKeep(u, t) {
  const h = houseById(t.keep);
  if (!h || !h.alive) { t.keep = null; t.keepRuin = true; staticDirty = true; return; }
  if (u.house === 0 && pacts.has(h.id)) breakPact(h.id);
  fellHouse(h, u.house);
  t.keep = null; t.keepRuin = true;
  staticDirty = true;
}

function fellHouse(h, byHouse) {
  h.alive = false;
  pacts.delete(h.id);
  defeated++;
  if (byHouse === 0) playerFalls++;
  for (const u of units)
    if (u.house === h.id) {
      shackled.push({ q: u.q, r: u.r, type: u.type, from: h.id, champ: u.champ });
      u.hp = 0;
      pushDeathFx(u);
    }
  units = units.filter(u => u.hp > 0);
  for (const t of tiles.values())
    if (t.campOwner === h.id) { t.campOwner = byHouse === ARB ? null : byHouse; markClaim(t.q, t.r); }
  log(`${h.name}'s banner burns in the ash.`, "hot");
  if (!h.player && FALL_MISSIVES[h.id])
    story(`${h.name.toUpperCase()} FALLS`, CHAMPS[h.id]?.name ?? h.name, FALL_MISSIVES[h.id]);
  if (byHouse === 0) renown += 3;
  // survivors consolidate — the trial narrows and hardens
  for (const s of houses)
    if (s.alive && !s.player && s.id !== byHouse) s.supply += 10;
  arbiterCheck();
  if (h.player) return lose("Your keep has fallen. The trial devours another Cinder.");
  updatePanel();
}

/* ---------------- suspicion / embercraft ---------------- */

function addSusp(n) {
  susp = Math.min(100, susp + n);
  if (susp >= 100) {
    susp = 40;
    exposedTurns = 5;
    spawnEnforcers(2);
    triggerExposureFlash();
    story("EXPOSED", "Your Mask Is Ash",
      "Your mask is ash, your name is a lie. The Conclave knows you are nothing but stolen fire — and every house turns its blades your way.");
    log("You are EXPOSED. The houses hunt you.", "hot");
  } else if (susp >= 50 && !probed) {
    probed = true;
    spawnEnforcers(1);
    story("THE JUDGES PROBE", "Eyes on Your Shadow",
      "The Arbiters' gaze lingers too long on your shadow. Speak carefully, Cinder — from here, even silence is suspicion.");
    log("An Arbiter probe takes the field.", "hot");
  }
  updatePanel();
}

function usePower(id) {
  if (gameOver || busy || powerUsed) return;
  const P = POWERS[id];
  const me = houses[0];
  const u = selected ? units.find(x => x.id === selected) : null;
  const avatar = units.find(x => x.type === "avatar");
  if (!u || u.house !== 0 || !avatar || me.supply < P.cost || !P.needs(u)) return;
  me.supply -= P.cost;
  powerUsed = true;
  if (id === "firebrand") { u.tempAtk += 3; log(`Embercraft: ${unitName(u)} burns bright. +3 attack.`, "gold"); }
  if (id === "mend")      { u.hp = Math.min(u.maxhp, u.hp + 8); log(`Embercraft: ${unitName(u)} is mended.`, "gold"); }
  if (id === "veilstep")  { u.moved = false; u.attacked = false; u.movedDist = 0; log(`Embercraft: ${unitName(u)} slips the judges' sight and acts again.`, "gold"); }
  addSusp(P.susp);
  computeReach(u);
  render(); updatePanel(); showNextStory();
}

/* ---------------- arbiters: the rigged game ---------------- */

function arbiterCheck() {
  if (playerFalls >= 1 && arbStage < 1) {
    arbStage = 1;
    log("The judges watch; your secret breathes heavy.", "hot");
  }
  if ((playerFalls >= 2 || defeated >= 4) && arbStage < 2) {
    arbStage = 2;
    spawnEnforcers(2);
    log("Cold steel steps echo — Arbiter enforcers take the field.", "hot");
    log("The trial was never fair. It is even less fair now.");
  }
  if (defeated >= 3 && arbStage < 3) {
    arbStage = 3;
    spireUnlocked = true;
    spawnEnforcers(3);
    story("THE SPIRE OPENS", "The Heart of Vael",
      "The ancient gears grind open, revealing the heart of Vael. Power flows to whoever dares climb — but the Arbiters' own steel guards the stair.");
    log("The core hums; the path to the Spire ascends.", "gold");
    log("End a unit's move on the Spire to end the trial.", "gold");
  }
}

function spawnEnforcers(n) {
  let placed = 0, ring = 2;
  while (placed < n && ring <= R) {
    const cand = [...tiles.values()].filter(t =>
      hexDist(t, { q: 0, r: 0 }) === ring && passableTerrain(t) &&
      !t.spire && !unitAt(t.q, t.r) && !shackleAt(t.q, t.r));
    while (placed < n && cand.length) {
      const t = cand.splice(rnd(cand.length), 1)[0];
      spawnUnit(ARB, "enforcer", t.q, t.r);
      placed++;
    }
    ring++;
  }
}

/* ---------------- AI ---------------- */

function healPhase(houseId) {
  for (const h of units.filter(u => u.house === houseId && u.type === "herald" && u.hp > 0))
    for (const ally of units)
      if (ally.house === houseId && ally !== h && ally.hp > 0 &&
          ally.hp < ally.maxhp && hexDist(h, ally) === 1)
        ally.hp = Math.min(ally.maxhp, ally.hp + 3);
}

// while the player's cover holds, no house dares strike the "noble" Ash;
// vassal houses never strike the player at all
function houseTargets(list, h) {
  let out = list;
  if (h && pacts.has(h.id)) out = out.filter(e => e.house !== 0);
  if (!(exposedTurns > 0 || turn >= 10)) out = out.filter(e => e.type !== "avatar");
  return out;
}

// a cornered house may sue for peace — once, and only to a player it hasn't fought a pact over
function maybeOfferPact(h) {
  if (turn < 6 || pacts.has(h.id) || brokenPacts.has(h.id) || offeredPacts.has(h.id)) return;
  const keepT = [...tiles.values()].find(t => t.keep === h.id);
  const weak = units.filter(u => u.house === h.id).length <= 2;
  const threatened = keepT &&
    units.some(e => e.house !== h.id && e.house !== ARB && e.hp > 0 && hexDist(e, keepT) <= 2);
  if (!weak && !threatened) return;
  offeredPacts.add(h.id);
  storyChoice("AN ENVOY ARRIVES", h.name,
    `An envoy in ${h.name}'s colors kneels before you, eyes down. "My house is bleeding, scion. Accept our fealty: three supply each turn, and no blade of ours will ever seek yours." A pact, from the highborn, to you.`,
    [
      { label: "Accept their fealty (+3 supply/turn, they spare you)", apply: () => {
          pacts.add(h.id);
          log(`${h.name} kneels. Tribute flows.`, "gold");
        } },
      { label: "Send the envoy home (no pact)", apply: () => {
          log(`${h.name}'s envoy leaves empty-handed.`);
        } },
    ]);
}

function aiHouseTurn(h) {
  healPhase(h.id);
  maybeOfferPact(h);
  const keepT = [...tiles.values()].find(t => t.keep === h.id);
  const myUnits = () => units.filter(u => u.house === h.id);
  if (keepT) {
    while (myUnits().length < 8) {
      const picks = h.persona === "aggressive" ? ["blade", "blade", "lancer", "archer", "warden"]
                  : h.persona === "defensive"  ? ["warden", "archer", "herald", "blade"]
                  : ["blade", "archer", "lancer", "herald", "warden"];
      const type = picks[rnd(picks.length)];
      if (h.supply < TYPES[type].cost) break;
      const spots = freeNeighbors(keepT.q, keepT.r);
      if (!spots.length) break;
      h.supply -= TYPES[type].cost;
      spawnUnit(h.id, type, ...spots[0]);
    }
  }

  // the unit nearest home holds the keep
  let guard = null;
  if (keepT) {
    const mine = myUnits().filter(u => !u.champ);
    if (mine.length)
      guard = mine.reduce((a, b) => hexDist(a, keepT) <= hexDist(b, keepT) ? a : b);
  }

  for (const u of myUnits()) {
    if (u.hp <= 0) continue;
    u.moved = false; u.attacked = false; u.movedDist = 0;

    // guard duty: stay by the keep unless intruders are close
    if (u === guard && keepT) {
      const intruder = units.some(e => e.house !== h.id && e.hp > 0 && hexDist(e, keepT) <= 3);
      if (!intruder) {
        if (hexDist(u, keepT) > 1) stepToward(u, keepT);
        const near = houseTargets(attackableFrom(u), h);
        if (near.length) doAttackAI(u, near.sort((a, b) => a.hp - b.hp)[0]);
        u.moved = true; u.attacked = true;
        continue;
      }
    }

    // wounded units fall back toward home
    if (keepT && u.hp / u.maxhp < 0.35 &&
        units.some(e => e.house !== h.id && e.hp > 0 && hexDist(e, u) === 1)) {
      stepToward(u, keepT);
      u.moved = true; u.attacked = true;
      continue;
    }

    let targets = houseTargets(attackableFrom(u), h);
    if (targets.length) {
      targets.sort((a, b) => a.hp - b.hp);
      doAttackAI(u, targets[0]);
      continue;
    }

    const goal = pickGoal(u, h);
    if (!goal) continue;
    const landed = stepToward(u, goal);
    if (landed) {
      const t = tileAt(u.q, u.r);
      const sh = shackleAt(u.q, u.r);
      if (sh) { // enslave the fallen
        shackled = shackled.filter(s => s !== sh);
        h.supply += sh.champ ? 4 : 2;
      }
      if (t.terrain === "ruins" && !t.looted) { t.looted = true; h.supply += 4; staticDirty = true; }
      if (t.camp && t.campOwner !== h.id) { t.campOwner = h.id; markClaim(t.q, t.r); }
      if (t.keep !== null && t.keep !== h.id) captureKeep(u, t);
      if (gameOver) return;
      targets = houseTargets(attackableFrom(u), h);
      if (targets.length) {
        targets.sort((a, b) => a.hp - b.hp);
        doAttackAI(u, targets[0]);
      }
    }
    u.moved = true; u.attacked = true;
  }
}

function stepToward(u, goal) {
  const moves = reachable(u);
  let best = null, bd = hexDist(u, goal);
  for (const [k, d] of moves) {
    const [q, r] = k.split(",").map(Number);
    const dist = hexDist({ q, r }, goal);
    if (dist < bd) { bd = dist; best = { q, r, d }; }
  }
  if (best) {
    const from = toPixel(u.q, u.r), to = toPixel(best.q, best.r);
    if (Math.abs(to.x - from.x) > 0.5) u.facing = to.x >= from.x ? 1 : -1;
    u.q = best.q; u.r = best.r; u.movedDist = best.d;
    return true;
  }
  return false;
}

function doAttackAI(u, e) {
  revealUnit(u); revealUnit(e);
  strike(u, e);
  if (gameOver) return;
  if (e.hp > 0 && hexDist(u, e) <= e.rng) strike(e, u, true);
  u.moved = true; u.attacked = true;
}

function pickGoal(u, h) {
  const goals = [];
  const exposed = exposedTurns > 0;
  const sworn = pacts.has(h.id); // vassals leave the player alone entirely
  for (const e of units)
    if (e.house !== h.id && e.hp > 0) {
      if (e.house === 0 && sworn) continue;
      // while your cover holds, no house marches on a noble scion
      if (e.type === "avatar" && !exposed && turn < 10) continue;
      let w = 1;
      if (e.house === 0 && h.persona === "aggressive") w = 0.8;
      if (e.house === 0 && exposed) w = 0.4; // the houses smell blood
      goals.push({ q: e.q, r: e.r, w });
    }
  const earlyGame = turn < 8 ? 2.2 : 1; // expand before conquering
  for (const t of tiles.values()) {
    if (t.keep !== null && t.keep !== h.id && houseById(t.keep)?.alive &&
        !(sworn && t.keep === 0))
      goals.push({ q: t.q, r: t.r, w: (h.persona === "aggressive" ? 0.8 : 1.2) * earlyGame });
    if (t.camp && t.campOwner !== h.id && !(sworn && t.campOwner === 0))
      goals.push({ q: t.q, r: t.r, w: h.persona === "expansionist" ? 0.5 : 1.0 });
    if (t.terrain === "ruins" && !t.looted)
      goals.push({ q: t.q, r: t.r, w: 0.9 });
  }
  for (const s of shackled) goals.push({ q: s.q, r: s.r, w: 0.9 });
  if (!goals.length) return null;
  goals.sort((a, b) => hexDist(u, a) * a.w - hexDist(u, b) * b.w);
  return goals[0];
}

function aiArbiterTurn() {
  for (const u of units.filter(x => x.house === ARB)) {
    if (u.hp <= 0) continue;
    const prey = units.filter(e => e.house === 0 && e.hp > 0);
    if (!prey.length) return;
    let targets = attackableFrom(u).filter(e => e.house === 0);
    if (!targets.length) {
      prey.sort((a, b) => hexDist(u, a) - hexDist(u, b));
      stepToward(u, prey[0]);
      targets = attackableFrom(u).filter(e => e.house === 0);
    }
    if (targets.length) {
      targets.sort((a, b) => a.hp - b.hp);
      strike(u, targets[0]);
      if (gameOver) return;
      if (targets[0].hp > 0 && hexDist(u, targets[0]) <= targets[0].rng)
        strike(targets[0], u, true);
    }
  }
}

/* ---------------- turn flow ---------------- */

function endTurn() {
  if (gameOver || busy || storyOpen()) return;
  busy = true; selected = null; reachCache = null;
  document.getElementById("endturn").disabled = true;
  render();

  setTimeout(() => {
    for (const h of houses) {
      if (gameOver) break;
      if (!h.player && h.alive) aiHouseTurn(h);
    }
    if (!gameOver) aiArbiterTurn();
    if (!gameOver) {
      for (const h of houses) {
        if (!h.alive) continue;
        let camps = 0;
        for (const t of tiles.values()) if (t.campOwner === h.id) camps++;
        h.supply += 3 + camps * 2 + (h.player ? 0 : diff().aiIncome);
      }
      // vassal tribute
      for (const id of pacts) {
        const v = houseById(id);
        if (!v?.alive) continue;
        const pay = Math.min(3, v.supply);
        v.supply -= pay;
        houses[0].supply += pay;
      }
      turn++;
      susp = Math.max(0, susp - diff().suspDecay);
      if (susp < 50) probed = false;
      if (exposedTurns > 0) exposedTurns--;
      powerUsed = false;
      healPhase(0);
      const avatar = units.find(u => u.type === "avatar");
      if (avatar) avatar.hp = Math.min(avatar.maxhp, avatar.hp + 2);
      for (const u of units) if (u.house === 0) {
        u.moved = false; u.attacked = false; u.tempAtk = 0; u.movedDist = 0;
      }
      if (avatarBusyNext && avatar) {
        avatarBusyNext = false;
        avatar.moved = true; avatar.attacked = true;
        log("Ash spends the day at court, playing the noble.");
      }
      maybeFireEvent();
      checkPlayerAlive();
      saveGame();
    }
    busy = false;
    document.getElementById("endturn").disabled = false;
    render(); updatePanel(); showNextStory();
  }, 120);
}

function checkPlayerAlive() {
  const me = houses[0];
  if (!me.alive || gameOver) return;
  const hasUnits = units.some(u => u.house === 0);
  if (!hasUnits && me.supply < cheapestCost())
    lose("No soldiers remain to fight your war. The silence of the battlefield is your final epitaph.");
}

function win() {
  if (gameOver) return;
  gameOver = true;
  saveGame(); // clears the save
  sfx("win");
  log("You stand alone in the blinding truth.", "gold");
  const vassals = [...pacts].filter(id => houseById(id)?.alive).length;
  if (freedCount >= 8) {
    showEnd("DAWN OVER VAEL",
      `You shattered the chains and freed the shackled — ${freedCount} souls marched beside you at the end. Vael rises from the ashes, not as a prison, but as a beacon. Turn ${turn}, renown ${renown}. The trial is over; the dawn has only begun.`);
  } else if (vassals >= 2) {
    showEnd("THE QUIET CORONATION",
      `No final slaughter, no burning sky — just ${vassals} great houses kneeling by treaty to a Cinder they believe is one of their own. You climbed the Spire on a staircase of signatures. Turn ${turn}, renown ${renown}. Now comes the harder game: ruling the people who made you.`);
  } else {
    showEnd("THE SPIRE IS YOURS",
      `You crushed every banner beneath your heel and climbed the Spire alone. Vael kneels — not out of love, but out of sheer, terrifying necessity. Turn ${turn}, renown ${renown}. A Cinder sits the judges' seat. What burns next is up to you.`);
  }
}

function lose(text) {
  if (gameOver) return;
  gameOver = true;
  houses[0].alive = false;
  saveGame(); // clears the save
  sfx("lose");
  showEnd("THE TRIAL CONSUMES YOU", text);
}

function showEnd(title, text) {
  document.getElementById("end-title").textContent = title;
  document.getElementById("end-text").textContent = text;
  document.getElementById("end").classList.remove("hidden");
}

/* ---------------- choice events ---------------- */

const EVENTS = [
  {
    id: "workgang",
    cond: () => true,
    kicker: "IN THE NIGHT", title: "The Work-Gang",
    text: "A gang of Cinder laborers is caught tunneling beneath your camp — runaways from the under-forges, half-starved, all eyes on you. Your officers await an order.",
    choices: [
      { label: "Shelter them (+1 Blade, +10 suspicion)", apply: () => {
          const keepT = [...tiles.values()].find(t => t.keep === 0);
          const spots = keepT ? freeNeighbors(keepT.q, keepT.r) : [];
          if (spots.length) spawnUnit(0, "blade", ...spots[0]);
          addSusp(10);
          log("The runaways take up arms under your banner.", "gold");
        } },
      { label: "Turn them over (−15 suspicion, −2 renown)", apply: () => {
          susp = Math.max(0, susp - 15);
          renown = Math.max(0, renown - 2);
          log("The Arbiters commend your vigilance. The Cinders remember it differently.", "hot");
        } },
    ],
  },
  {
    id: "banquet",
    cond: () => units.some(u => u.type === "avatar"),
    kicker: "AN INVITATION", title: "A Lumen Banquet",
    text: "Gilt-edged card, radiant seal: the surviving houses dine tonight, and your absence would be noticed. A night of wine and lies — or a night of war.",
    choices: [
      { label: "Attend (−12 suspicion, Ash loses next turn)", apply: () => {
          susp = Math.max(0, susp - 12);
          avatarBusyNext = true;
          log("You smile, toast, and lie beautifully.");
        } },
      { label: "Send regrets (+5 suspicion)", apply: () => {
          addSusp(5);
          log("An empty chair says more than you hoped.");
        } },
    ],
  },
  {
    id: "ledger",
    cond: () => true,
    kicker: "A QUIET OFFER", title: "The Quartermaster's Ledger",
    text: "A Lumen quartermaster with gambling debts offers you crates of 'misplaced' steel — no questions, no records. Probably.",
    choices: [
      { label: "Buy the steel (+8 supply, +8 suspicion)", apply: () => {
          houses[0].supply += 8; addSusp(8);
          log("The crates arrive under moonlight.");
        } },
      { label: "Report him (+2 renown)", apply: () => {
          renown += 2;
          log("The quartermaster is dragged away praising your honor.");
        } },
    ],
  },
  {
    id: "whispers",
    cond: () => units.some(u => u.house === 0 && u.freed),
    kicker: "AROUND THE FIRE", title: "Whispers in the Ranks",
    text: "The soldiers you freed talk when they think you cannot hear. They say your accent slips. They say you fight like a miner, not a scion. Tonight, one of them asks you outright.",
    choices: [
      { label: "Tell them the truth (+15 suspicion, freed units +1 ATK)", apply: () => {
          addSusp(15);
          for (const u of units) if (u.house === 0 && u.freed) u.atk += 1;
          log("Silence. Then, one by one, they kneel — to a Cinder.", "gold");
        } },
      { label: "Lie to them (one freed soldier deserts)", apply: () => {
          const f = units.find(u => u.house === 0 && u.freed && u.type !== "avatar");
          if (f) { f.hp = 0; units = units.filter(x => x.hp > 0); }
          log("The one who asked is gone by morning.", "hot");
        } },
    ],
  },
  {
    id: "lineage",
    cond: () => true,
    kicker: "A COLD INTERVIEW", title: "The Arbiter's Question",
    text: "An Arbiter reads your forged lineage aloud, slowly, watching your face. 'Your grandmother's estate — the one by the glass cliffs. Describe the view.' There was no estate. There are no cliffs.",
    choices: [
      { label: "Bribe the clerk (−6 supply, −10 suspicion)", apply: () => {
          houses[0].supply = Math.max(0, houses[0].supply - 6);
          susp = Math.max(0, susp - 10);
          log("The ledger acquires a new page, and you a new grandmother.");
        } },
      { label: "Bluff (coin flip: −8 or +15 suspicion)", apply: () => {
          if (rnd(2) === 0) { susp = Math.max(0, susp - 8); log("You describe cliffs you have never seen. The Arbiter nods, satisfied.", "gold"); }
          else { addSusp(15); log("A pause, one heartbeat too long. The Arbiter writes something down.", "hot"); }
        } },
    ],
  },
  {
    id: "emberkin",
    cond: () => true,
    kicker: "A SIGN IN SOOT", title: "The Emberkin",
    text: "A soot-mark on your tent flap — the sign of the Emberkin, the hidden hands who carved you into a noble. They ask for grain and steel for the under-city. They do not ask twice.",
    choices: [
      { label: "Send supplies (−5 supply, +3 renown)", apply: () => {
          houses[0].supply = Math.max(0, houses[0].supply - 5);
          renown += 3;
          log("The mark is gone by dawn. Somewhere below, someone eats.", "gold");
        } },
      { label: "Ignore the sign", apply: () => {
          log("You scrub the soot away yourself, before anyone sees.");
        } },
    ],
  },
  {
    id: "duel",
    cond: () => units.some(u => u.type === "avatar"),
    kicker: "BEFORE THE HOUSES", title: "A Champion's Regard",
    text: "A rival champion halts the day's skirmish to salute you across the field — then offers a formal duel of honor, blades blunted, pride sharp. The houses are watching.",
    choices: [
      { label: "Accept the duel (Ash +2 ATK, +5 suspicion)", apply: () => {
          const av = units.find(u => u.type === "avatar");
          if (av) av.atk += 2;
          addSusp(5);
          log("You win ugly — pit-fighting, not fencing. They cheer anyway.", "gold");
        } },
      { label: "Decline with grace (−5 suspicion)", apply: () => {
          susp = Math.max(0, susp - 5);
          log("A perfect courtly bow. Your fencing master would have wept — if you'd ever had one.");
        } },
    ],
  },
  {
    id: "grainfire",
    cond: () => true,
    kicker: "SMOKE AT DAWN", title: "Grain Fire",
    text: "Fire in the supply tents — accident, or a rival's coin at work. Your soldiers can save the grain, but not for free.",
    choices: [
      { label: "Fight the fire (a random unit starts next turn spent)", apply: () => {
          const pool = units.filter(u => u.house === 0 && u.type !== "avatar");
          if (pool.length) { const u = pool[rnd(pool.length)]; u.moved = true; u.attacked = true; log(`${unitName(u)} spends the night hauling water.`); }
        } },
      { label: "Let it burn (−4 supply)", apply: () => {
          houses[0].supply = Math.max(0, houses[0].supply - 4);
          log("You watch it burn and think of the under-forges.");
        } },
    ],
  },
];

function maybeFireEvent() {
  if (gameOver || turn < 4 || turn % 4 !== 0) return;
  const pool = EVENTS.filter(e => !usedEvents.has(e.id) && e.cond());
  if (!pool.length) return;
  const e = pool[rnd(pool.length)];
  usedEvents.add(e.id);
  storyChoice(e.kicker, e.title, e.text, e.choices);
}

/* ---------------- story missives ---------------- */

function story(kicker, title, text) {
  storyQueue.push({ kicker, title, text });
}

function storyChoice(kicker, title, text, choices) {
  storyQueue.push({ kicker, title, text, choices });
}

function storyOpen() {
  return !document.getElementById("story").classList.contains("hidden");
}

let pendingChoices = null;

function showNextStory() {
  if (gameOver || storyOpen() || !storyQueue.length) return;
  const s = storyQueue.shift();
  document.getElementById("story-kicker").textContent = s.kicker;
  document.getElementById("story-title").textContent = s.title;
  document.getElementById("story-text").textContent = s.text;
  const okBtn = document.getElementById("story-ok");
  const chDiv = document.getElementById("story-choices");
  if (s.choices) {
    pendingChoices = s.choices;
    okBtn.classList.add("hidden");
    chDiv.classList.remove("hidden");
    document.getElementById("choice-a").textContent = s.choices[0].label;
    document.getElementById("choice-b").textContent = s.choices[1].label;
  } else {
    pendingChoices = null;
    okBtn.classList.remove("hidden");
    chDiv.classList.add("hidden");
  }
  sfx("story");
  document.getElementById("story").classList.remove("hidden");
}

function resolveChoice(i) {
  const c = pendingChoices?.[i];
  pendingChoices = null;
  document.getElementById("story").classList.add("hidden");
  if (c) c.apply();
  render(); updatePanel();
  showNextStory();
}

document.getElementById("story-ok").addEventListener("click", () => {
  document.getElementById("story").classList.add("hidden");
  showNextStory();
});
document.getElementById("choice-a").addEventListener("click", () => resolveChoice(0));
document.getElementById("choice-b").addEventListener("click", () => resolveChoice(1));

function afterAction() {
  if (selected) {
    const u = units.find(x => x.id === selected);
    if (!u || (u.moved && u.attacked)) { selected = null; reachCache = null; }
    else computeReach(u);
  }
  render(); updatePanel(); showNextStory();
}

/* ---------------- sound (tiny synth, no assets) ---------------- */

let audioCtx = null;
let muted = localStorage.getItem("cinderborn-muted") === "1";

function tone(freq, dur, type = "square", vol = 0.05, delay = 0) {
  if (muted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const t0 = audioCtx.currentTime + delay;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(t0); o.stop(t0 + dur);
  } catch { /* audio unavailable — play silent */ }
}

function sfx(kind) {
  if (kind === "select")   tone(520, 0.06, "sine", 0.04);
  if (kind === "move")     tone(300, 0.08, "sine", 0.04);
  if (kind === "strike") { tone(180, 0.1, "square", 0.05); tone(140, 0.12, "square", 0.04, 0.04); }
  if (kind === "kill")     tone(90, 0.25, "sawtooth", 0.06);
  if (kind === "liberate"){ tone(440, 0.1, "sine", 0.05); tone(660, 0.12, "sine", 0.05, 0.09); }
  if (kind === "story")    tone(700, 0.15, "sine", 0.035);
  if (kind === "win")    { tone(440, 0.2, "sine", 0.06); tone(550, 0.2, "sine", 0.06, 0.15); tone(660, 0.35, "sine", 0.06, 0.3); }
  if (kind === "lose")   { tone(220, 0.3, "sawtooth", 0.05); tone(160, 0.5, "sawtooth", 0.05, 0.25); }
}

const muteBtn = document.getElementById("mute");
function paintMute() {
  muteBtn.textContent = muted ? "🔇" : "🔊";
  muteBtn.classList.toggle("muted", muted);
}
muteBtn.addEventListener("click", () => {
  muted = !muted;
  localStorage.setItem("cinderborn-muted", muted ? "1" : "0");
  paintMute();
});
paintMute();

/* ---------------- save / load ---------------- */

function saveGame() {
  if (gameOver) { localStorage.removeItem(SAVE_KEY); return; }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      v: 3, diffKey, turn, renown, defeated, playerFalls, spireUnlocked, arbStage,
      uidSeq, susp, probed, exposedTurns, freedCount, firstBlood, firstFree,
      avatarBusyNext,
      pacts: [...pacts], brokenPacts: [...brokenPacts],
      offeredPacts: [...offeredPacts], usedEvents: [...usedEvents],
      houses, units, shackled, tiles: [...tiles.values()],
    }));
  } catch { /* storage full/blocked — play on without saves */ }
}

function hasSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY))?.v === 3; }
  catch { return false; }
}

function loadGame() {
  let s;
  try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return false; }
  if (!s || s.v !== 3) return false;
  diffKey = s.diffKey;
  turn = s.turn; renown = s.renown; defeated = s.defeated; playerFalls = s.playerFalls;
  spireUnlocked = s.spireUnlocked; arbStage = s.arbStage; uidSeq = s.uidSeq;
  susp = s.susp; probed = s.probed; exposedTurns = s.exposedTurns;
  freedCount = s.freedCount; firstBlood = s.firstBlood; firstFree = s.firstFree;
  avatarBusyNext = s.avatarBusyNext;
  pacts = new Set(s.pacts); brokenPacts = new Set(s.brokenPacts);
  offeredPacts = new Set(s.offeredPacts); usedEvents = new Set(s.usedEvents);
  houses = s.houses; units = s.units; shackled = s.shackled;
  tiles = new Map(s.tiles.map(t => [key(t.q, t.r), t]));
  selected = null; reachCache = null; storyQueue = []; pendingChoices = null;
  gameOver = false; busy = false; powerUsed = false;
  // fog/claim/fx state isn't persisted (cosmetic only) — a resumed trial
  // re-fogs enemy houses until the player makes contact again.
  revealedUnits = new Set(); claimFx = new Map(); revealFx = new Map();
  deathFx = []; alarmFlash = null; staticDirty = true;
  layoutView(); render(); updatePanel();
  log("You take the field again where you left it.");
  return true;
}

/* ---------------- input ---------------- */

canvas.addEventListener("click", ev => {
  if (gameOver || busy || storyOpen()) return;
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
  const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
  const { q, r } = fromPixel(x, y);
  const t = tileAt(q, r);
  if (!t) { selected = null; reachCache = null; render(); updatePanel(); return; }

  const clickedUnit = unitAt(q, r);
  const sel = selected ? units.find(u => u.id === selected) : null;

  if (sel && clickedUnit && reachCache?.targets.has(clickedUnit.id)) {
    doAttack(sel, clickedUnit);
    return;
  }
  if (sel && !clickedUnit && reachCache?.moves.has(key(q, r))) {
    doMove(sel, q, r, reachCache.moves.get(key(q, r)));
    return;
  }
  if (clickedUnit && clickedUnit.house === 0) {
    selected = clickedUnit.id;
    computeReach(clickedUnit);
    sfx("select");
  } else {
    selected = null; reachCache = null;
  }
  render(); updatePanel();
});

function cycleUnit() {
  const ready = units.filter(u => u.house === 0 && (!u.moved || !u.attacked));
  if (!ready.length) return;
  const idx = selected ? ready.findIndex(u => u.id === selected) : -1;
  const next = ready[(idx + 1) % ready.length];
  selected = next.id;
  computeReach(next);
  render(); updatePanel();
}

window.addEventListener("keydown", ev => {
  if (storyOpen()) {
    if (!pendingChoices && (ev.key === "Enter" || ev.key === " "))
      document.getElementById("story-ok").click();
    return;
  }
  if (ev.key === "e" || ev.key === "E") endTurn();
  if (ev.key === "Tab") { ev.preventDefault(); cycleUnit(); }
  if (ev.key === "Escape") { selected = null; reachCache = null; render(); updatePanel(); }
});

document.getElementById("endturn").addEventListener("click", endTurn);

for (const btn of document.querySelectorAll("#diffrow .diff")) {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#diffrow .diff").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    diffKey = btn.dataset.diff;
    sfx("select");
  });
}

document.getElementById("begin").addEventListener("click", () => {
  document.getElementById("title").classList.add("hidden");
  document.getElementById("log").innerHTML = "";
  newGame();  // start fresh on the chosen difficulty
  sfx("story");
});
document.getElementById("continue").addEventListener("click", () => {
  if (loadGame()) {
    document.getElementById("title").classList.add("hidden");
    sfx("story");
  }
});
if (hasSave()) document.getElementById("continue").classList.remove("hidden");

document.getElementById("again").addEventListener("click", () => {
  document.getElementById("end").classList.add("hidden");
  document.getElementById("log").innerHTML = "";
  newGame();
});

for (const type of ["blade", "archer", "lancer", "herald", "warden"]) {
  const btn = document.getElementById("r-" + type);
  btn.addEventListener("click", () => {
    if (gameOver || busy) return;
    const me = houses[0], T = TYPES[type];
    if (me.supply < T.cost) return;
    const keepT = [...tiles.values()].find(t => t.keep === 0);
    if (!keepT) return;
    const spots = freeNeighbors(keepT.q, keepT.r);
    if (!spots.length) { log("No open ground beside your keep."); return; }
    me.supply -= T.cost;
    spawnUnit(0, type, ...spots[0]);
    log(`${T.name} takes the field. Ready next turn.`);
    render(); updatePanel();
  });
}

for (const id of Object.keys(POWERS)) {
  document.getElementById("p-" + id).addEventListener("click", () => usePower(id));
}

/* ---------------- rendering: The Attainted Roll ----------------
   A roll-of-arms on vellum. Flat pigment, iron-gall ink linework, Petra
   Sancta hatching standing in for color. No gradients, no particles — every
   effect below is a transform/stroke-count/opacity tween.

   Layering:
     1. static board layer (terrain + camp/keep claim state) — offscreen,
        cached, redrawn only when `staticDirty` is set by a state change.
     2. move/attack overlays, shackles, in-flight claim/death/reveal tweens,
        units — all cheap, redrawn every render() call (small N).
     3. the one reserved alarm-tone exposure flash, always last, always brief.
*/

const REVEAL_MS = 180;  // "emblazoned" snap — hatch → flat tincture
const CLAIM_MS  = 200;  // a camp changing hands
const DEATH_MS  = 230;  // degradation of arms
const ALARM_MS  = 550;  // exposure flash — the ONLY use of ALARM

let hatchPatterns = null;
const staticCanvas = document.createElement("canvas");
const staticCtx = staticCanvas.getContext("2d");

function shiftLight(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = c => Math.max(0, Math.min(255, Math.round(c + 255 * amt)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

// pre-render each Petra Sancta hatch as a small tiling bitmap ONCE at load —
// applied via fillStyle pattern from then on, never stroked per-hex/per-frame.
function buildHatchPatterns() {
  const T = 15;
  const mk = draw => {
    const c = document.createElement("canvas");
    c.width = T; c.height = T;
    draw(c.getContext("2d"), T);
    return ctx.createPattern(c, "repeat");
  };
  hatchPatterns = {
    horizontal: mk((g, t) => {
      g.strokeStyle = INK; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(0, t * 0.5); g.lineTo(t, t * 0.5); g.stroke();
    }),
    vertical: mk((g, t) => {
      g.strokeStyle = INK; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(t * 0.5, 0); g.lineTo(t * 0.5, t); g.stroke();
    }),
    diagonal: mk((g, t) => {
      g.strokeStyle = INK; g.lineWidth = 1.1;
      for (const [x0, y0, x1, y1] of [[0, t, t, 0], [-t * 0.5, t * 0.5, t * 0.5, -t * 0.5], [t * 0.5, t * 1.5, t * 1.5, t * 0.5]]) {
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      }
    }),
    dots: mk((g, t) => {
      g.fillStyle = INK;
      for (const [dx, dy] of [[0.25, 0.25], [0.75, 0.75], [0.75, 0.25], [0.25, 0.75]]) {
        g.beginPath(); g.arc(t * dx, t * dy, t * 0.1, 0, Math.PI * 2); g.fill();
      }
    }),
    crosshatch: mk((g, t) => {
      g.strokeStyle = INK; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(t * 0.5, 0); g.lineTo(t * 0.5, t); g.stroke();
      g.beginPath(); g.moveTo(0, t * 0.5); g.lineTo(t, t * 0.5); g.stroke();
    }),
    blank: null,
  };
}

// fills the CURRENT path (caller already built it) with a tincture's hatch,
// crossfading toward the flat pigment as revealP goes 0 -> 1. This one
// function IS the "unblazoned -> emblazoned" fog-of-war/claim mechanic.
function blazonFill(tinctKey, revealP) {
  const t = TINCTURE[tinctKey] || TINCTURE.argent;
  ctx.fillStyle = t.hatch === "blank" ? VELLUM : hatchPatterns[t.hatch];
  ctx.fill();
  if (revealP > 0) {
    ctx.save();
    ctx.globalAlpha = revealP;
    ctx.fillStyle = t.color;
    ctx.fill();
    ctx.restore();
  }
  return chargeColorFor(tinctKey, revealP);
}

// the rule of tincture, applied to a field that's part hatch (pale, mostly
// vellum) and part flat pigment (revealP): pick whichever of ink/vellum
// reads clearly against that blend, so a charge is never lost on its own
// field — this is what saves Ash's lion from vanishing into Sable.
function chargeColorFor(tinctKey, revealP) {
  const t = TINCTURE[tinctKey] || TINCTURE.argent;
  const fieldIsMetal = revealP >= 0.5 ? t.metal : true; // hatch phase reads as pale vellum
  return fieldIsMetal ? INK : VELLUM;
}

/* ---- tween-driving state: markClaim / revealUnit / pushDeathFx / triggerExposureFlash ---- */

function ensureRaf() {
  if (rafHandle == null) rafHandle = requestAnimationFrame(() => { rafHandle = null; render(); });
}
function markClaim(q, r) {
  claimFx.set(key(q, r), { start: performance.now() });
  ensureRaf();
}
function revealUnit(u) {
  if (!u || u.house === 0 || u.house === ARB || revealedUnits.has(u.id)) return;
  revealedUnits.add(u.id);
  revealFx.set(u.id, { start: performance.now() });
  ensureRaf();
}
function pushDeathFx(u) {
  deathFx.push({
    q: u.q, r: u.r, house: u.house, type: u.type, champ: u.champ,
    facing: u.facing || 1, start: performance.now(),
  });
  ensureRaf();
}
function triggerExposureFlash() {
  alarmFlash = { start: performance.now() };
  ensureRaf();
}

function layoutView() {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  staticCanvas.width = canvas.width;
  staticCanvas.height = canvas.height;
  const w = canvas.width, hgt = canvas.height;
  view.s = Math.min(w / ((2 * R + 2) * SQ3), hgt / ((2 * R + 2) * 1.5)) * 0.98;
  view.ox = w / 2; view.oy = hgt / 2;
  staticDirty = true;
}
window.addEventListener("resize", () => { layoutView(); render(); });
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) { layoutView(); render(); }
});
// if we loaded in a hidden/zero-sized tab, retry layout until the canvas has size
(function ensureLaidOut() {
  if (canvas.clientWidth === 0) return requestAnimationFrame(ensureLaidOut);
  if (view.s === 0 || canvas.width === 0) { layoutView(); render(); }
})();

function hexPath(x, y, s) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i - 30);
    const px = x + s * Math.cos(a), py = y + s * Math.sin(a);
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
}

/* ---- static board layer: terrain + claim state, baked once per change ---- */

function renderStaticLayer() {
  buildHatchPatterns.built || (buildHatchPatterns(), (buildHatchPatterns.built = true));
  const g = staticCtx;
  g.clearRect(0, 0, staticCanvas.width, staticCanvas.height);
  const s = view.s;
  const savedCtx = ctx;
  // the terrain/claim painters below all use the module-level `ctx` — swap
  // it to the offscreen context for this pass, then restore.
  ctxSwap(g);
  for (const t of tiles.values()) {
    const { x, y } = toPixel(t.q, t.r);
    hexPath(x, y, s * 0.96);
    ctx.fillStyle = shiftLight(VELLUM, t.mottle);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (t.terrain === "forest") drawForestTile(x, y, s);
    if (t.terrain === "mountain") drawMountainTile(x, y, s);
    if (t.terrain === "water") drawWaterTile(x, y, s);
    if (t.terrain === "ruins") drawRuinsTile(x, y, s, t.looted);
    if (t.camp && !claimFx.has(key(t.q, t.r))) drawCampMarker(x, y, s, t.campOwner, 1);
    if (t.keep !== null) drawKeepMarker(x, y, s, houseById(t.keep));
    if (t.keepRuin) drawKeepRuinMarker(x, y, s);
    if (t.spire) drawSpireMarker(x, y, s);
  }
  ctxSwap(savedCtx);
}
// tiny helper so the terrain painters (written once) work against either the
// live canvas or the offscreen static cache without duplicating them — every
// draw* function below reads the module-level `ctx` at call time.
function ctxSwap(g) { ctx = g; }

function render() {
  if (staticDirty) { renderStaticLayer(); staticDirty = false; }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(staticCanvas, 0, 0);
  const s = view.s;
  const now = performance.now();

  // camps mid-claim: overpaint just that hex with the live crossfade
  for (const [k, fx] of [...claimFx]) {
    const [q, r] = k.split(",").map(Number);
    const t = tileAt(q, r);
    if (!t) { claimFx.delete(k); continue; }
    const p = Math.min(1, (now - fx.start) / CLAIM_MS);
    const { x, y } = toPixel(q, r);
    drawCampMarker(x, y, s, t.campOwner, p);
    if (p >= 1) { claimFx.delete(k); staticDirty = true; } else ensureRaf();
  }

  if (reachCache) {
    for (const k of reachCache.moves.keys()) {
      const [q, r] = k.split(",").map(Number);
      const { x, y } = toPixel(q, r);
      hexPath(x, y, s * 0.96);
      ctx.fillStyle = "rgba(44, 79, 124, .20)"; // azure wash, flat — an available move
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    for (const id of reachCache.targets) {
      const e = units.find(u => u.id === id);
      if (!e) continue;
      const { x, y } = toPixel(e.q, e.r);
      ctx.beginPath();
      ctx.arc(x, y, s * 0.78, 0, Math.PI * 2);
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = TINCTURE.or.color; // one gold accent for "actionable" — never the alarm tone
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  for (const sh of shackled) drawShackle(sh);

  for (const d of [...deathFx]) {
    const p = Math.min(1, (now - d.start) / DEATH_MS);
    const { x, y } = toPixel(d.q, d.r);
    const tinctKey = d.house === 0 ? "sable" : d.house === ARB ? ARB_TINCT : houseById(d.house)?.tinct || "argent";
    drawBlazon(x, y, s * 0.56, tinctKey, 1, CHARGE[d.type] || "lion", d.facing, p);
    if (p >= 1) deathFx.splice(deathFx.indexOf(d), 1); else ensureRaf();
  }

  for (const u of units) drawUnit(u);

  if (alarmFlash) {
    const p = Math.min(1, (now - alarmFlash.start) / ALARM_MS);
    ctx.fillStyle = ALARM;
    ctx.globalAlpha = Math.sin(p * Math.PI) * 0.3;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    if (p >= 1) alarmFlash = null; else ensureRaf();
  }
}

/* ---- terrain: flat / single-hatch / cross-hatch — exactly three tiers ---- */

function drawForestTile(x, y, s) {
  ctx.fillStyle = "rgba(63, 107, 79, .12)"; // faint vert wash — accessibility backstop
  hexPath(x, y, s * 0.9); ctx.fill();
  for (const [dx, dy, r] of [[-0.28, 0.08, 0.22], [0.24, -0.06, 0.19], [0, 0.3, 0.2]]) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
    ctx.fillStyle = hatchPatterns.dots; // single-hatch tier: stippled canopy
    ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
  }
}
function drawMountainTile(x, y, s) {
  ctx.fillStyle = "rgba(91, 58, 99, .10)"; // faint purpure-grey wash
  hexPath(x, y, s * 0.9); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.45, y + s * 0.35);
  ctx.lineTo(x - s * 0.1, y - s * 0.38);
  ctx.lineTo(x + 0.18 * s, y + 0.05 * s);
  ctx.lineTo(x + 0.32 * s, y - 0.18 * s);
  ctx.lineTo(x + 0.55 * s, y + 0.35 * s);
  ctx.closePath();
  ctx.fillStyle = hatchPatterns.crosshatch; // cross-hatch tier: relief hachures
  ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
}
function drawWaterTile(x, y, s) {
  ctx.fillStyle = "rgba(44, 79, 124, .12)"; // faint azure wash
  hexPath(x, y, s * 0.9); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.3; // single-hatch tier: engraved wave-arcs
  for (const dy of [-0.22, 0, 0.22]) {
    ctx.beginPath();
    ctx.moveTo(x - s * 0.42, y + dy * s);
    ctx.quadraticCurveTo(x - s * 0.16, y + (dy - 0.13) * s, x, y + dy * s);
    ctx.quadraticCurveTo(x + s * 0.16, y + (dy + 0.13) * s, x + s * 0.42, y + dy * s);
    ctx.stroke();
  }
}
function drawRuinsTile(x, y, s, looted) {
  ctx.fillStyle = "rgba(91, 58, 99, .10)";
  hexPath(x, y, s * 0.9); ctx.fill();
  for (const [cx, top, h] of [[-0.27, -0.12, 0.42], [0, -0.3, 0.58], [0.26, -0.02, 0.32]]) {
    const w = s * 0.14, bx = x + cx * s, by = y + top * s;
    ctx.beginPath(); // jagged broken top edge instead of a clean rect
    ctx.moveTo(bx - w / 2, by + h * s);
    ctx.lineTo(bx - w / 2, by + s * 0.08);
    ctx.lineTo(bx - w * 0.15, by);
    ctx.lineTo(bx + w * 0.1, by + s * 0.1);
    ctx.lineTo(bx + w / 2, by + s * 0.02);
    ctx.lineTo(bx + w / 2, by + h * s);
    ctx.closePath();
    ctx.fillStyle = hatchPatterns.crosshatch; // cross-hatch tier: stone coursing
    ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
  }
  if (!looted) {
    ctx.beginPath();
    ctx.arc(x + s * 0.05, y + s * 0.38, s * 0.07, 0, Math.PI * 2);
    ctx.fillStyle = TINCTURE.or.color;
    ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
  }
}

/* ---- map furniture: camps / keeps / spire — same hatch/flat claim logic ---- */

function drawCampMarker(x, y, s, owner, revealP) {
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.34);
  ctx.lineTo(x - s * 0.3, y + s * 0.26);
  ctx.lineTo(x + s * 0.3, y + s * 0.26);
  ctx.closePath();
  if (owner == null) {
    ctx.fillStyle = VELLUM; ctx.fill(); // uncontested — blank/unblazoned pennant
  } else {
    const tinct = owner === 0 ? "sable" : owner === ARB ? ARB_TINCT : houseById(owner)?.tinct || "argent";
    blazonFill(tinct, revealP);
  }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.05);
  ctx.lineTo(x - s * 0.1, y + s * 0.26);
  ctx.lineTo(x + s * 0.1, y + s * 0.26);
  ctx.closePath();
  ctx.fillStyle = INK; ctx.fill();
}
function drawKeepMarker(x, y, s, h) {
  const tinct = h ? h.tinct : "argent";
  ctx.beginPath();
  ctx.rect(x - s * 0.32, y - s * 0.28, s * 0.64, s * 0.56);
  ctx.rect(x - s * 0.42, y - s * 0.5, s * 0.2, s * 0.3);
  ctx.rect(x + s * 0.22, y - s * 0.5, s * 0.2, s * 0.3);
  blazonFill(tinct, 1); // keeps always belong to someone — never fogged
  ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fillRect(x - s * 0.1, y - s * 0.02, s * 0.2, s * 0.3);
}
function drawKeepRuinMarker(x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x - s * 0.32, y + s * 0.28);
  ctx.lineTo(x - s * 0.1, y - s * 0.1);
  ctx.lineTo(x + s * 0.06, y + s * 0.06);
  ctx.lineTo(x + s * 0.32, y - s * 0.28);
  ctx.lineTo(x + s * 0.2, y + s * 0.3);
  ctx.lineTo(x - s * 0.18, y + s * 0.32);
  ctx.closePath();
  ctx.fillStyle = hatchPatterns.crosshatch;
  ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
}
function drawSpireMarker(x, y, s) {
  const lit = spireUnlocked;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.72);
  ctx.lineTo(x - s * 0.22, y + s * 0.4);
  ctx.lineTo(x + s * 0.22, y + s * 0.4);
  ctx.closePath();
  ctx.fillStyle = lit ? TINCTURE.or.color : VELLUM;
  ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.stroke();
  if (lit) {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.arc(x, y, s * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
function drawShackle(sh) {
  const { x, y } = toPixel(sh.q, sh.r);
  const s = view.s;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x - s * 0.14, y, s * 0.16, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + s * 0.14, y, s * 0.16, 0, Math.PI * 2); ctx.stroke();
  ctx.save();
  ctx.translate(x, y + s * 0.02);
  ctx.scale(0.55, 0.55);
  drawCharge(ctx, CHARGE[sh.type] || "lion", s * 0.5, INK);
  ctx.restore();
  if (sh.champ) {
    drawMullet(x + s * 0.24, y - s * 0.3, s * 0.12, TINCTURE.or.color);
  }
}

/* ---- heraldic charges: silhouette-first, six distinct shapes, local coords ---- */

function shieldPath(rad) {
  const w = rad * 1.28, h = rad * 1.6;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2, -h / 2);
  ctx.lineTo(w / 2, h * 0.06);
  ctx.quadraticCurveTo(w / 2, h * 0.4, 0, h / 2);
  ctx.quadraticCurveTo(-w / 2, h * 0.4, -w / 2, h * 0.06);
  ctx.closePath();
}

function drawLion(g, s) {
  g.beginPath();
  g.moveTo(-s * 0.05, s * 0.32);
  g.lineTo(-s * 0.22, s * 0.3);
  g.lineTo(-s * 0.28, s * 0.05);
  g.lineTo(-s * 0.18, -s * 0.1);
  g.lineTo(-s * 0.24, -s * 0.3);
  g.lineTo(-s * 0.12, -s * 0.34);
  g.lineTo(-s * 0.14, -s * 0.14);
  g.lineTo(0, -s * 0.02);
  g.lineTo(s * 0.1, -s * 0.24);
  g.lineTo(s * 0.22, -s * 0.3);
  g.lineTo(s * 0.16, -s * 0.08);
  g.lineTo(s * 0.22, s * 0.08);
  g.lineTo(s * 0.3, s * 0.3);
  g.lineTo(s * 0.16, s * 0.28);
  g.lineTo(s * 0.08, s * 0.34);
  g.closePath();
  g.fill();
  g.beginPath();
  g.arc(-s * 0.02, -s * 0.4, s * 0.14, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = s * 0.05;
  g.beginPath();
  g.moveTo(s * 0.28, s * 0.2);
  g.quadraticCurveTo(s * 0.44, s * 0.1, s * 0.4, -s * 0.1);
  g.quadraticCurveTo(s * 0.38, -s * 0.2, s * 0.3, -s * 0.16);
  g.stroke();
}
function drawEagle(g, s) {
  g.beginPath();
  g.moveTo(0, -s * 0.3); g.lineTo(-s * 0.08, s * 0.1); g.lineTo(0, s * 0.34); g.lineTo(s * 0.08, s * 0.1);
  g.closePath(); g.fill();
  g.beginPath(); g.arc(0, -s * 0.36, s * 0.09, 0, Math.PI * 2); g.fill();
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(side * s * 0.06, -s * 0.08);
    g.lineTo(side * s * 0.4, -s * 0.28);
    g.lineTo(side * s * 0.34, -s * 0.1);
    g.lineTo(side * s * 0.46, s * 0.02);
    g.lineTo(side * s * 0.3, s * 0.06);
    g.lineTo(side * s * 0.36, s * 0.2);
    g.lineTo(side * s * 0.16, s * 0.14);
    g.closePath();
    g.fill();
  }
}
function drawTower(g, s) {
  g.fillRect(-s * 0.22, -s * 0.08, s * 0.44, s * 0.42);
  g.fillRect(-s * 0.3, -s * 0.24, s * 0.14, s * 0.2);
  g.fillRect(s * 0.16, -s * 0.24, s * 0.14, s * 0.2);
  g.fillRect(-s * 0.06, -s * 0.24, s * 0.12, s * 0.16);
}
function drawHorse(g, s) {
  g.beginPath();
  g.moveTo(-s * 0.34, s * 0.3); g.lineTo(-s * 0.3, -s * 0.02); g.lineTo(-s * 0.2, -s * 0.1);
  g.lineTo(-s * 0.2, -s * 0.24); g.lineTo(-s * 0.06, -s * 0.38); g.lineTo(s * 0.1, -s * 0.36);
  g.lineTo(s * 0.06, -s * 0.26); g.lineTo(s * 0.18, -s * 0.2); g.lineTo(s * 0.3, -s * 0.06);
  g.lineTo(s * 0.28, s * 0.1); g.lineTo(s * 0.34, s * 0.3); g.lineTo(s * 0.2, s * 0.28);
  g.lineTo(s * 0.16, s * 0.06); g.lineTo(s * 0.02, s * 0.1); g.lineTo(-s * 0.06, s * 0.28);
  g.lineTo(-s * 0.2, s * 0.3);
  g.closePath();
  g.fill();
  g.lineWidth = s * 0.04;
  g.beginPath();
  g.moveTo(-s * 0.08, -s * 0.36); g.lineTo(-s * 0.02, -s * 0.22); g.lineTo(-s * 0.1, -s * 0.14);
  g.stroke();
}
function drawSerpent(g, s) {
  g.lineWidth = s * 0.13; g.lineCap = "round";
  g.beginPath();
  g.moveTo(-s * 0.28, s * 0.3);
  g.quadraticCurveTo(-s * 0.34, 0, -s * 0.06, -s * 0.02);
  g.quadraticCurveTo(s * 0.22, -s * 0.04, s * 0.16, -s * 0.24);
  g.quadraticCurveTo(s * 0.1, -s * 0.4, -s * 0.02, -s * 0.32);
  g.stroke();
  g.beginPath();
  g.moveTo(-s * 0.02, -s * 0.32); g.lineTo(s * 0.12, -s * 0.36); g.lineTo(s * 0.02, -s * 0.24);
  g.closePath(); g.fill();
  g.lineCap = "butt";
}
function drawDove(g, s) {
  g.beginPath();
  g.moveTo(-s * 0.28, s * 0.08);
  g.quadraticCurveTo(-s * 0.1, -s * 0.1, s * 0.06, -s * 0.02);
  g.quadraticCurveTo(s * 0.22, -s * 0.08, s * 0.34, -s * 0.24);
  g.quadraticCurveTo(s * 0.2, -s * 0.04, s * 0.1, s * 0.02);
  g.quadraticCurveTo(s * 0.18, s * 0.14, s * 0.1, s * 0.24);
  g.quadraticCurveTo(-s * 0.02, s * 0.1, -s * 0.16, s * 0.14);
  g.quadraticCurveTo(-s * 0.26, s * 0.16, -s * 0.28, s * 0.08);
  g.closePath();
  g.fill();
}
const CHARGE_DRAW = { lion: drawLion, eagle: drawEagle, tower: drawTower, horse: drawHorse, serpent: drawSerpent, dove: drawDove };
function drawCharge(g, kind, size, color) {
  g.fillStyle = color; g.strokeStyle = color;
  (CHARGE_DRAW[kind] || drawLion)(g, size);
}
function drawMullet(x, y, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const a2 = a + Math.PI / 5;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    ctx.lineTo(x + Math.cos(a2) * r * 0.42, y + Math.sin(a2) * r * 0.42);
  }
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.stroke();
}

/* ---- HUD chrome: house badges + the wax-seal turn stamp share the exact
   same shield/hatch/tincture/charge painters as the board — reskinned as a
   copperplate book-plate panel, not a competing widget. ---- */

function paintHouseBadge(canvasEl, h) {
  const g = canvasEl.getContext("2d");
  const saved = ctx;
  ctxSwap(g);
  const size = canvasEl.width;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  const rad = size * 0.42;
  shieldPath(rad);
  const chargeColor = blazonFill(h.tinct, 1);
  ctx.lineWidth = 1.4; ctx.strokeStyle = INK; ctx.stroke();
  if (h.tinct === "sable") {
    ctx.save(); shieldPath(rad); ctx.clip();
    ctx.strokeStyle = "#4a3a2c"; ctx.lineWidth = rad * 0.22;
    ctx.beginPath(); ctx.moveTo(-rad, -rad); ctx.lineTo(rad, rad); ctx.stroke();
    ctx.restore();
  }
  drawCharge(ctx, h.sigil || "lion", rad * 0.62, chargeColor);
  ctx.restore();
  ctxSwap(saved);
}

// a small ink wax-seal, stamped with the turn number — the phase indicator.
function paintSeal(canvasEl, turnNo, phase) {
  const g = canvasEl.getContext("2d");
  const saved = ctx;
  ctxSwap(g);
  const size = canvasEl.width, cx = size / 2, cy = size / 2, r = size * 0.44;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(cx, cy);
  // a wax seal's edge is never a clean circle — small irregular bumps
  ctx.beginPath();
  const bumps = 14;
  for (let i = 0; i <= bumps; i++) {
    const a = (i / bumps) * Math.PI * 2;
    const rr = r * (0.94 + 0.06 * Math.sin(a * 5 + turnNo));
    const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = phase === "enemy" ? "rgba(42,30,22,.12)" : VELLUM;
  ctx.fill();
  ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.lineWidth = 1; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = `700 ${Math.round(r * 0.7)}px Georgia, "Iowan Old Style", serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(String(turnNo), 0, r * 0.05);
  ctx.restore();
  ctxSwap(saved);
}

// deterministic PRNG so a wounded unit's crack pattern doesn't jitter every render
function seededRnd(seed) {
  let n = (seed % 2147483647) || 1;
  if (n < 0) n += 2147483646;
  return () => (n = (n * 16807) % 2147483647) / 2147483647;
}
// the "wounded"/Suspicion primitive: 2-4 procedural jagged ink crack-strokes,
// drawn in LOCAL coords over the charge already on the shield.
function drawCracks(rad, count, seed, color = INK) {
  const rnd2 = seededRnd(seed);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, rad * 0.08);
  for (let i = 0; i < count; i++) {
    const a0 = rnd2() * Math.PI * 2;
    let cx = Math.cos(a0) * rad * 0.25, cy = Math.sin(a0) * rad * 0.25;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    let ang = a0 + Math.PI * (0.5 + rnd2() * 0.5);
    const segs = 2 + Math.floor(rnd2() * 2);
    for (let j = 0; j < segs; j++) {
      ang += (rnd2() - 0.5) * 1.7;
      cx += Math.cos(ang) * rad * 0.32;
      cy += Math.sin(ang) * rad * 0.32;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }
}

// the single composed painter for a heraldic unit — used for live units,
// the death-fx "degradation of arms" tween, and Ash's persistent exposed
// state. flipP 0 = normal; flipP 1 = fully reversed (a real 2D emulation of
// a vertical flip via scaleY, plus a diagonal strike-through ink bar).
function drawBlazon(x, y, rad, tinctKey, revealP, chargeKind, facing, flipP = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing < 0 ? -1 : 1, flipP ? Math.cos(flipP * Math.PI) : 1);
  shieldPath(rad);
  const chargeColor = blazonFill(tinctKey, revealP);
  ctx.lineWidth = tinctKey === "sable" ? 2.4 : 1.8;
  ctx.strokeStyle = INK;
  ctx.stroke();
  if (tinctKey === "sable") { // bend-sinister baked into every Ash charge, turn one —
    ctx.save();                // a dark umber bar, not a bright slash, so the whole
    shieldPath(rad); ctx.clip(); // field stays "colour" and one charge tone still reads.
    ctx.strokeStyle = "#4a3a2c";
    ctx.lineWidth = rad * 0.22;
    ctx.beginPath(); ctx.moveTo(-rad, -rad); ctx.lineTo(rad, rad); ctx.stroke();
    ctx.restore();
  }
  drawCharge(ctx, chargeKind, rad * 0.62, chargeColor);
  if (flipP > 0) {
    ctx.strokeStyle = chargeColor;
    ctx.lineWidth = rad * 0.28 * Math.min(1, flipP * 2.4);
    ctx.beginPath();
    ctx.moveTo(-rad * 1.05 * flipP, -rad * 0.7 * flipP);
    ctx.lineTo(rad * 1.05 * flipP, rad * 0.7 * flipP);
    ctx.stroke();
  }
  ctx.restore();
}

function drawUnit(u) {
  const { x, y } = toPixel(u.q, u.r);
  const s = view.s;
  const rad = s * 0.56;
  const isPlayer = u.house === 0;
  const isArb = u.house === ARB;
  const tinctKey = isPlayer ? "sable" : isArb ? ARB_TINCT : houseById(u.house).tinct;
  const facing = u.facing || (isPlayer ? 1 : -1);

  let revealP = 1;
  if (!isPlayer && !isArb) {
    const fx = revealFx.get(u.id);
    if (fx) {
      revealP = Math.min(1, (performance.now() - fx.start) / REVEAL_MS);
      if (revealP >= 1) revealFx.delete(u.id); else ensureRaf();
    } else revealP = revealedUnits.has(u.id) ? 1 : 0;
  }

  if (selected === u.id) {
    ctx.save();
    ctx.translate(x, y);
    shieldPath(rad + 5);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.setLineDash([3, 2]); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // Suspicion is Ash's own mark, not the whole household's — everyone else
  // (including Ash's own troops) reads wounds off plain HP instead.
  const isAsh = u.type === "avatar";
  const exposed = isAsh && exposedTurns > 0;
  drawBlazon(x, y, rad, tinctKey, revealP, CHARGE[u.type] || "lion", facing, exposed ? 1 : 0);

  if (u.champ) drawMullet(x + rad * 0.68, y - rad * 0.68, rad * 0.24, TINCTURE.or.color);

  if (u.vet) {
    ctx.save(); ctx.translate(x, y); shieldPath(rad - 3);
    ctx.strokeStyle = TINCTURE.or.color; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  }

  // the Suspicion meter IS the art: escalating crack-strokes on Ash's own
  // charge; every other unit (allied or enemy) reads wounds off raw HP.
  ctx.save(); ctx.translate(x, y);
  const crackColor = chargeColorFor(tinctKey, revealP);
  if (isAsh) {
    if (!exposed) {
      const tier = susp >= 75 ? 3 : susp >= 50 ? 2 : susp >= 25 ? 1 : 0;
      if (tier) drawCracks(rad, tier + 1, u.id * 7 + 3, crackColor);
    }
  } else {
    const frac = u.hp / u.maxhp;
    const tier = frac <= 0.15 ? 4 : frac <= 0.4 ? 3 : frac <= 0.66 ? 2 : 0;
    if (tier) drawCracks(rad, tier, u.id * 13 + 1, crackColor);
  }
  ctx.restore();

  const w = s * 0.9;
  ctx.fillStyle = "rgba(233, 223, 199, .95)";
  ctx.fillRect(x - w / 2, y + rad + 4, w, 4);
  ctx.fillStyle = INK;
  ctx.fillRect(x - w / 2, y + rad + 4, w * Math.max(0, u.hp / u.maxhp), 4);
  ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.strokeRect(x - w / 2, y + rad + 4, w, 4);

  if (isPlayer && u.moved && u.attacked && !busy) {
    ctx.save(); ctx.translate(x, y); shieldPath(rad);
    ctx.fillStyle = "rgba(42, 30, 22, .38)"; ctx.fill();
    ctx.restore();
  }
}

/* ---------------- panel / log ---------------- */

function updatePanel() {
  document.getElementById("s-turn").textContent = turn;
  document.getElementById("s-supply").textContent = houses[0].supply;
  document.getElementById("s-renown").textContent = renown;
  document.getElementById("susp-num").textContent =
    exposedTurns > 0 ? `${susp} · EXPOSED ${exposedTurns}` : susp;
  document.getElementById("suspfill").style.width = susp + "%";

  const sealEl = document.getElementById("seal");
  if (sealEl) paintSeal(sealEl, turn, busy ? "enemy" : "player");

  const hDiv = document.getElementById("houses");
  hDiv.innerHTML = "";
  for (const h of houses) {
    const row = document.createElement("div");
    row.className = "hrow" + (h.alive ? "" : " dead");
    const badge = document.createElement("canvas");
    badge.className = "hbadge"; badge.width = 22; badge.height = 22;
    const label = document.createElement("span");
    const tag = pacts.has(h.id) ? " · vassal"
              : brokenPacts.has(h.id) && h.alive ? " · betrayed" : "";
    label.innerHTML = `${h.name}<span class="tag${tag ? (tag.includes("vassal") ? " gold" : " broken") : ""}">${tag}</span>`;
    const motto = document.createElement("span");
    motto.className = "motto";
    motto.textContent = h.player ? "" : h.motto;
    row.append(badge, label, motto);
    hDiv.appendChild(row);
    paintHouseBadge(badge, h);
  }

  const sel = selected ? units.find(u => u.id === selected) : null;
  const si = document.getElementById("selinfo");
  if (sel) {
    const extra = sel.champ?.lifesteal ? " Heals on kill." :
                  sel.champ?.duelist ? " Brutal counterattacks." : "";
    si.innerHTML = `<b>${unitName(sel)}${sel.freed ? " (freed)" : ""}${sel.vet ? " ⌃ veteran" : ""}</b> — ` +
      `HP ${sel.hp}/${sel.maxhp} · ATK ${sel.atk}${sel.tempAtk ? "+" + sel.tempAtk : ""} · RNG ${sel.rng} · MOVE ${sel.mv}<br>` +
      `<span style="color:var(--dim)">${sel.champ ? `"${sel.champ.cry}"${extra}` : TYPES[sel.type].desc} ` +
      `${sel.moved ? "" : "Can move. "}${sel.attacked ? "" : "Can attack."}</span>`;
  } else si.textContent = "Select a unit.";

  for (const type of ["blade", "archer", "lancer", "herald", "warden"]) {
    const T = TYPES[type];
    const btn = document.getElementById("r-" + type);
    btn.textContent = `${T.name} — ${T.cost}  (HP ${T.hp} · ATK ${T.atk} · RNG ${T.rng} · MV ${T.mv})`;
    btn.title = T.desc;
    btn.disabled = gameOver || houses[0].supply < T.cost || !houses[0].alive;
  }

  const avatarAlive = units.some(u => u.type === "avatar");
  for (const [id, P] of Object.entries(POWERS)) {
    const btn = document.getElementById("p-" + id);
    btn.textContent = `${P.name} — ${P.cost} supply, +${P.susp} susp (${P.desc})`;
    btn.disabled = gameOver || busy || powerUsed || !avatarAlive || !sel ||
      sel.house !== 0 || houses[0].supply < P.cost || !P.needs(sel);
  }

  const ready = units.filter(u => u.house === 0 && (!u.moved || !u.attacked)).length;
  document.getElementById("endturn").innerHTML =
    `END TURN${ready ? ` (${ready} ready)` : ""} <span class="key">E</span>`;
}

function log(msg, cls) {
  const el = document.getElementById("log");
  const d = document.createElement("div");
  if (cls) d.className = cls;
  d.textContent = `T${turn ?? 1} — ${msg}`;
  el.prepend(d);
  while (el.children.length > 60) el.removeChild(el.lastChild);
}

/* ---------------- go ---------------- */

newGame();

// debug/test handle (module scope hides internals; tests and tuning need a window)
window.__cb = {
  get units() { return units; }, set units(v) { units = v; },
  get tiles() { return tiles; },
  get houses() { return houses; },
  get shackled() { return shackled; }, set shackled(v) { shackled = v; },
  get turn() { return turn; },
  get susp() { return susp; },
  get renown() { return renown; },
  get freedCount() { return freedCount; },
  get defeated() { return defeated; }, set defeated(v) { defeated = v; },
  get playerFalls() { return playerFalls; },
  get arbStage() { return arbStage; },
  get spireUnlocked() { return spireUnlocked; },
  get exposedTurns() { return exposedTurns; },
  get gameOver() { return gameOver; },
  get storyQueue() { return storyQueue; }, set storyQueue(v) { storyQueue = v; },
  get pacts() { return pacts; },
  get brokenPacts() { return brokenPacts; },
  get usedEvents() { return usedEvents; }, set usedEvents(v) { usedEvents = v; },
  get diffKey() { return diffKey; }, set diffKey(v) { diffKey = v; },
  get pendingChoices() { return pendingChoices; },
  EVENTS,
  endTurn, doMove, doAttack, reachable, freeNeighbors, unitAt, tileAt,
  addSusp, usePower, spawnUnit, arbiterCheck, computeReach, newGame,
  maybeOfferPact, maybeFireEvent, storyChoice, resolveChoice, breakPact,
  saveGame, loadGame, hasSave,
};
