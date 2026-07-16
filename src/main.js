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

const HOUSE_DEFS = [
  { id: 0, name: "You — the Cinder",  motto: "Wearing stolen light.",                    color: "#e8642c", player: true,  keep: [0, 7] },
  { id: 1, name: "House Vorthos", motto: "Iron wills temper the soul.",             color: "#4f8fd4", keep: [7, 0],  persona: "aggressive" },
  { id: 2, name: "House Kaelen",  motto: "Shadows dance where light dares not.",    color: "#8a5fd6", keep: [7, -7], persona: "expansionist" },
  { id: 3, name: "House Mirex",   motto: "Silence is the sharpest blade.",          color: "#3fb58a", keep: [0, -7], persona: "defensive" },
  { id: 4, name: "House Oryn",    motto: "Blood binds tighter than golden chains.", color: "#c94f6d", keep: [-7, 0], persona: "aggressive" },
  { id: 5, name: "House Syla",    motto: "Grace is the mask of a hungry heart.",    color: "#d4a53f", keep: [-7, 7], persona: "expansionist" },
];
const ARB = 99; // arbiter house id
const ARB_COLOR = "#cfd6e4";

const POWERS = {
  firebrand: { name: "Firebrand", cost: 5, susp: 10,
    desc: "+3 attack this turn", needs: u => true },
  mend:      { name: "Mend",      cost: 4, susp: 8,
    desc: "heal 8", needs: u => u.hp < u.maxhp },
  veilstep:  { name: "Veilstep",  cost: 7, susp: 14,
    desc: "act again", needs: u => u.moved || u.attacked },
};

const DIRS = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];

/* ---------------- state ---------------- */

let tiles, units, shackled, houses, turn, renown, defeated, playerFalls, selected;
let spireUnlocked, arbStage, uidSeq, gameOver, busy;
let susp, probed, exposedTurns, powerUsed, freedCount;
let firstBlood, firstFree;
let reachCache = null; // {unitId, moves:Map(key->cost), targets:Set(unitId)}
let storyQueue = [];

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
let view = { s: 26, ox: 0, oy: 0 }; // hex size + pixel offset

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
      tiles.set(key(q, r), { q, r, terrain, camp: false, campOwner: null,
                             keep: null, keepRuin: false, spire: false, looted: false });
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
  units = []; shackled = []; uidSeq = 1;
  turn = 1; renown = 0; defeated = 0; playerFalls = 0; selected = null;
  spireUnlocked = false; arbStage = 0; gameOver = false; busy = false;
  susp = 0; probed = false; exposedTurns = 0; powerUsed = false; freedCount = 0;
  firstBlood = false; firstFree = false;
  reachCache = null; storyQueue = [];

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
    champ: champ || null, tempAtk: 0, movedDist: 0,
    moved: true, attacked: true, freed: false,
  };
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
  u.q = q; u.r = r; u.moved = true;
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
    if (u.house === 0) {
      houses[0].supply += 4;
      log("You scavenge the ruins. +4 supply.");
    } else if (u.house !== ARB) {
      houseById(u.house).supply += 4;
    }
  }

  if (t.camp && t.campOwner !== u.house) {
    t.campOwner = u.house;
    if (u.house === 0) log("Supply camp seized. +2 supply per turn.");
  }
  if (t.keep !== null && t.keep !== u.house) captureKeep(u, t);
  if (t.spire && spireUnlocked && u.house === 0) return win();
  afterAction();
}

function doAttack(u, e) {
  u.attacked = true; u.moved = true; // attacking ends the unit's activation
  strike(u, e);
  if (e.hp > 0 && hexDist(u, e) <= e.rng) strike(e, u, true);
  afterAction();
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
  const deadHouse = houseById(dead.house);
  if (dead.type === "avatar") {
    units = units.filter(u => u.hp > 0);
    return lose("Your form crumbles into cold dust. The light fades, and with it, your stolen legacy.");
  }
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
  if (!h || !h.alive) { t.keep = null; t.keepRuin = true; return; }
  fellHouse(h, u.house);
  t.keep = null; t.keepRuin = true;
}

function fellHouse(h, byHouse) {
  h.alive = false;
  defeated++;
  if (byHouse === 0) playerFalls++;
  for (const u of units)
    if (u.house === h.id) {
      shackled.push({ q: u.q, r: u.r, type: u.type, from: h.id, champ: u.champ });
      u.hp = 0;
    }
  units = units.filter(u => u.hp > 0);
  for (const t of tiles.values())
    if (t.campOwner === h.id) t.campOwner = byHouse === ARB ? null : byHouse;
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

// while the player's cover holds, no house dares strike the "noble" Ash
function houseTargets(list) {
  if (exposedTurns > 0 || turn >= 10) return list;
  return list.filter(e => e.type !== "avatar");
}

function aiHouseTurn(h) {
  healPhase(h.id);
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
        const near = houseTargets(attackableFrom(u));
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

    let targets = houseTargets(attackableFrom(u));
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
      if (t.terrain === "ruins" && !t.looted) { t.looted = true; h.supply += 4; }
      if (t.camp && t.campOwner !== h.id) t.campOwner = h.id;
      if (t.keep !== null && t.keep !== h.id) captureKeep(u, t);
      if (gameOver) return;
      targets = houseTargets(attackableFrom(u));
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
  if (best) { u.q = best.q; u.r = best.r; u.movedDist = best.d; return true; }
  return false;
}

function doAttackAI(u, e) {
  strike(u, e);
  if (gameOver) return;
  if (e.hp > 0 && hexDist(u, e) <= e.rng) strike(e, u, true);
  u.moved = true; u.attacked = true;
}

function pickGoal(u, h) {
  const goals = [];
  const exposed = exposedTurns > 0;
  for (const e of units)
    if (e.house !== h.id && e.hp > 0) {
      // while your cover holds, no house marches on a noble scion
      if (e.type === "avatar" && !exposed && turn < 10) continue;
      let w = 1;
      if (e.house === 0 && h.persona === "aggressive") w = 0.8;
      if (e.house === 0 && exposed) w = 0.4; // the houses smell blood
      goals.push({ q: e.q, r: e.r, w });
    }
  const earlyGame = turn < 8 ? 2.2 : 1; // expand before conquering
  for (const t of tiles.values()) {
    if (t.keep !== null && t.keep !== h.id && houseById(t.keep)?.alive)
      goals.push({ q: t.q, r: t.r, w: (h.persona === "aggressive" ? 0.8 : 1.2) * earlyGame });
    if (t.camp && t.campOwner !== h.id)
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
        h.supply += 3 + camps * 2;
      }
      turn++;
      susp = Math.max(0, susp - 3);
      if (susp < 50) probed = false;
      if (exposedTurns > 0) exposedTurns--;
      powerUsed = false;
      healPhase(0);
      const avatar = units.find(u => u.type === "avatar");
      if (avatar) avatar.hp = Math.min(avatar.maxhp, avatar.hp + 2);
      for (const u of units) if (u.house === 0) {
        u.moved = false; u.attacked = false; u.tempAtk = 0; u.movedDist = 0;
      }
      checkPlayerAlive();
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
  log("You stand alone in the blinding truth.", "gold");
  const liberator = freedCount >= 8;
  showEnd(
    liberator ? "DAWN OVER VAEL" : "THE SPIRE IS YOURS",
    liberator
      ? `You shattered the chains and freed the shackled — ${freedCount} souls marched beside you at the end. Vael rises from the ashes, not as a prison, but as a beacon. Turn ${turn}, renown ${renown}. The trial is over; the dawn has only begun.`
      : `You crushed every banner beneath your heel and climbed the Spire alone. Vael kneels — not out of love, but out of sheer, terrifying necessity. Turn ${turn}, renown ${renown}. A Cinder sits the judges' seat. What burns next is up to you.`,
  );
}

function lose(text) {
  if (gameOver) return;
  gameOver = true;
  houses[0].alive = false;
  showEnd("THE TRIAL CONSUMES YOU", text);
}

function showEnd(title, text) {
  document.getElementById("end-title").textContent = title;
  document.getElementById("end-text").textContent = text;
  document.getElementById("end").classList.remove("hidden");
}

/* ---------------- story missives ---------------- */

function story(kicker, title, text) {
  storyQueue.push({ kicker, title, text });
}

function storyOpen() {
  return !document.getElementById("story").classList.contains("hidden");
}

function showNextStory() {
  if (gameOver || storyOpen() || !storyQueue.length) return;
  const s = storyQueue.shift();
  document.getElementById("story-kicker").textContent = s.kicker;
  document.getElementById("story-title").textContent = s.title;
  document.getElementById("story-text").textContent = s.text;
  document.getElementById("story").classList.remove("hidden");
}

document.getElementById("story-ok").addEventListener("click", () => {
  document.getElementById("story").classList.add("hidden");
  showNextStory();
});

function afterAction() {
  if (selected) {
    const u = units.find(x => x.id === selected);
    if (!u || (u.moved && u.attacked)) { selected = null; reachCache = null; }
    else computeReach(u);
  }
  render(); updatePanel(); showNextStory();
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
    if (ev.key === "Enter" || ev.key === " ") document.getElementById("story-ok").click();
    return;
  }
  if (ev.key === "e" || ev.key === "E") endTurn();
  if (ev.key === "Tab") { ev.preventDefault(); cycleUnit(); }
  if (ev.key === "Escape") { selected = null; reachCache = null; render(); updatePanel(); }
});

document.getElementById("endturn").addEventListener("click", endTurn);
document.getElementById("begin").addEventListener("click", () => {
  document.getElementById("title").classList.add("hidden");
});
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

/* ---------------- rendering ---------------- */

const TERRAIN_FILL = {
  plains: "#241f30", forest: "#1e2b26", mountain: "#332e3d",
  water: "#16202f", ruins: "#2a2333",
};

function layoutView() {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  const w = canvas.width, hgt = canvas.height;
  view.s = Math.min(w / ((2 * R + 2) * SQ3), hgt / ((2 * R + 2) * 1.5)) * 0.98;
  view.ox = w / 2; view.oy = hgt / 2;
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

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const s = view.s;

  for (const t of tiles.values()) {
    const { x, y } = toPixel(t.q, t.r);
    hexPath(x, y, s * 0.96);
    ctx.fillStyle = TERRAIN_FILL[t.terrain];
    ctx.fill();
    ctx.strokeStyle = "#0d0b10";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (t.terrain === "forest") drawForest(x, y, s);
    if (t.terrain === "mountain") drawMountain(x, y, s);
    if (t.terrain === "water") drawWater(x, y, s);
    if (t.terrain === "ruins") drawRuins(x, y, s, t.looted);
    if (t.camp) drawCamp(x, y, s, t.campOwner);
    if (t.keep !== null) drawKeep(x, y, s, houseById(t.keep));
    if (t.keepRuin) drawKeepRuin(x, y, s);
    if (t.spire) drawSpire(x, y, s);
  }

  if (reachCache) {
    for (const k of reachCache.moves.keys()) {
      const [q, r] = k.split(",").map(Number);
      const { x, y } = toPixel(q, r);
      hexPath(x, y, s * 0.96);
      ctx.fillStyle = "rgba(90, 150, 255, .22)";
      ctx.fill();
      ctx.strokeStyle = "rgba(120, 170, 255, .5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    for (const id of reachCache.targets) {
      const e = units.find(u => u.id === id);
      if (!e) continue;
      const { x, y } = toPixel(e.q, e.r);
      ctx.beginPath();
      ctx.arc(x, y, s * 0.75, 0, Math.PI * 2);
      ctx.strokeStyle = "#ff5544";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  for (const sh of shackled) drawShackle(sh);
  for (const u of units) drawUnit(u);
}

function drawForest(x, y, s) {
  ctx.fillStyle = "#2f4a3c";
  for (const [dx, dy] of [[-0.3, 0.1], [0.25, -0.05], [0, 0.32]]) {
    ctx.beginPath();
    ctx.moveTo(x + dx * s, y + dy * s - s * 0.32);
    ctx.lineTo(x + dx * s - s * 0.2, y + dy * s + s * 0.12);
    ctx.lineTo(x + dx * s + s * 0.2, y + dy * s + s * 0.12);
    ctx.closePath();
    ctx.fill();
  }
}
function drawMountain(x, y, s) {
  ctx.fillStyle = "#4a4356";
  ctx.beginPath();
  ctx.moveTo(x - s * 0.45, y + s * 0.35);
  ctx.lineTo(x - s * 0.1, y - s * 0.38);
  ctx.lineTo(x + 0.18 * s, y + 0.05 * s);
  ctx.lineTo(x + 0.32 * s, y - 0.18 * s);
  ctx.lineTo(x + 0.55 * s, y + 0.35 * s);
  ctx.closePath();
  ctx.fill();
}
function drawWater(x, y, s) {
  ctx.strokeStyle = "#3a5a80";
  ctx.lineWidth = 1.5;
  for (const dy of [-0.15, 0.15]) {
    ctx.beginPath();
    ctx.moveTo(x - s * 0.4, y + dy * s);
    ctx.quadraticCurveTo(x - s * 0.15, y + (dy - 0.14) * s, x, y + dy * s);
    ctx.quadraticCurveTo(x + s * 0.15, y + (dy + 0.14) * s, x + s * 0.4, y + dy * s);
    ctx.stroke();
  }
}
function drawRuins(x, y, s, looted) {
  ctx.fillStyle = looted ? "#3a3344" : "#57496b";
  ctx.fillRect(x - s * 0.34, y - s * 0.1, s * 0.14, s * 0.4);
  ctx.fillRect(x - s * 0.06, y - s * 0.28, s * 0.14, s * 0.58);
  ctx.fillRect(x + s * 0.22, y - s * 0.02, s * 0.14, s * 0.32);
  if (!looted) {
    ctx.fillStyle = "#d9b45b";
    ctx.beginPath();
    ctx.arc(x + s * 0.05, y + s * 0.38, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
}
function drawCamp(x, y, s, owner) {
  ctx.fillStyle = owner !== null ? houseById(owner)?.color ?? "#777" : "#6b6377";
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.34);
  ctx.lineTo(x - s * 0.3, y + s * 0.26);
  ctx.lineTo(x + s * 0.3, y + s * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0d0b10";
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.05);
  ctx.lineTo(x - s * 0.1, y + s * 0.26);
  ctx.lineTo(x + s * 0.1, y + s * 0.26);
  ctx.closePath();
  ctx.fill();
}
function drawKeep(x, y, s, h) {
  ctx.fillStyle = h ? h.color : "#777";
  ctx.fillRect(x - s * 0.32, y - s * 0.28, s * 0.64, s * 0.56);
  ctx.fillRect(x - s * 0.42, y - s * 0.5, s * 0.2, s * 0.3);
  ctx.fillRect(x + s * 0.22, y - s * 0.5, s * 0.2, s * 0.3);
  ctx.fillStyle = "#0d0b10";
  ctx.fillRect(x - s * 0.1, y - s * 0.02, s * 0.2, s * 0.3);
}
function drawKeepRuin(x, y, s) {
  ctx.strokeStyle = "#5a5264";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.3, y + s * 0.25); ctx.lineTo(x + s * 0.3, y - s * 0.25);
  ctx.moveTo(x + s * 0.3, y + s * 0.25); ctx.lineTo(x - s * 0.3, y - s * 0.25);
  ctx.stroke();
}
function drawSpire(x, y, s) {
  const lit = spireUnlocked;
  ctx.fillStyle = lit ? "#ffe9b0" : "#5d5870";
  ctx.beginPath();
  ctx.moveTo(x, y - s * 0.72);
  ctx.lineTo(x - s * 0.22, y + s * 0.4);
  ctx.lineTo(x + s * 0.22, y + s * 0.4);
  ctx.closePath();
  ctx.fill();
  if (lit) {
    ctx.strokeStyle = "rgba(255, 220, 140, .8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.85, 0, Math.PI * 2);
    ctx.stroke();
  }
}
function drawShackle(sh) {
  const { x, y } = toPixel(sh.q, sh.r);
  const s = view.s;
  ctx.strokeStyle = sh.champ ? "#d9b45b" : "#9a93a8";
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(x - s * 0.14, y, s * 0.16, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + s * 0.14, y, s * 0.16, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = sh.champ ? "#d9b45b" : "#9a93a8";
  ctx.font = `${Math.round(s * 0.34)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(sh.champ ? "★" : TYPES[sh.type].glyph, x, y + s * 0.55);
}
function drawUnit(u) {
  const { x, y } = toPixel(u.q, u.r);
  const s = view.s;
  const h = u.house === ARB ? { color: ARB_COLOR } : houseById(u.house);
  const rad = s * 0.52;

  if (selected === u.id) {
    ctx.beginPath(); ctx.arc(x, y, rad + 5, 0, Math.PI * 2);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2);
  ctx.fillStyle = h.color; ctx.fill();
  ctx.strokeStyle = u.type === "avatar" ? "#ffe9b0" : "#0d0b10";
  ctx.lineWidth = u.type === "avatar" ? 3 : 2;
  ctx.stroke();

  // champion crest
  if (u.champ) {
    ctx.fillStyle = "#d9b45b";
    ctx.beginPath();
    ctx.moveTo(x, y - rad - 7);
    ctx.lineTo(x - 5, y - rad - 1);
    ctx.lineTo(x + 5, y - rad - 1);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = u.house === ARB ? "#1a1f2c" : "#0d0b10";
  ctx.font = `bold ${Math.round(s * 0.5)}px sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(u.champ ? "★" : TYPES[u.type].glyph, x, y + 1);
  ctx.textBaseline = "alphabetic";

  const w = s * 1.0;
  ctx.fillStyle = "#0d0b10";
  ctx.fillRect(x - w / 2, y + rad + 3, w, 5);
  ctx.fillStyle = u.hp / u.maxhp > 0.5 ? "#5fce7a" : u.hp / u.maxhp > 0.25 ? "#d9b45b" : "#e85555";
  ctx.fillRect(x - w / 2, y + rad + 3, w * (u.hp / u.maxhp), 5);

  if (u.house === 0 && u.moved && u.attacked && !busy) {
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(13, 11, 16, .45)"; ctx.fill();
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

  const hDiv = document.getElementById("houses");
  hDiv.innerHTML = "";
  for (const h of houses) {
    const row = document.createElement("div");
    row.className = "hrow" + (h.alive ? "" : " dead");
    row.innerHTML = `<span class="hdot" style="background:${h.color}"></span>` +
      `<span>${h.name}</span><span class="motto">${h.player ? "" : h.motto}</span>`;
    hDiv.appendChild(row);
  }

  const sel = selected ? units.find(u => u.id === selected) : null;
  const si = document.getElementById("selinfo");
  if (sel) {
    const extra = sel.champ?.lifesteal ? " Heals on kill." :
                  sel.champ?.duelist ? " Brutal counterattacks." : "";
    si.innerHTML = `<b>${unitName(sel)}${sel.freed ? " (freed)" : ""}</b> — ` +
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
  endTurn, doMove, doAttack, reachable, freeNeighbors, unitAt, tileAt,
  addSusp, usePower, spawnUnit, arbiterCheck, computeReach, newGame,
};
