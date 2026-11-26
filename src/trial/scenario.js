export const RADIUS = 4;
export const MAX_ROUND = 12;
export const GATE = { q: 0, r: 0 };
export const SEAL = { q: 3, r: -2 };
export const EXIT = { q: 3, r: 1 };
export const ENTRIES = [{ q: 1, r: -2 }, { q: 4, r: 0 }];
export const DIRS = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
export const key = t => `${t.q},${t.r}`;
export const distance = (a, b) => (Math.abs(a.q-b.q)+Math.abs(a.r-b.r)+Math.abs(a.q+a.r-b.q-b.r))/2;
export const same = (a, b) => a && b && a.q === b.q && a.r === b.r;

export const ROLES = {
  ash: { hp: 16, atk: 4, range: 1, move: 3, label: 'Cinder', glyph: '✦', detail: 'Your stolen name opens doors. Your fire closes them.' },
  shield: { hp: 18, atk: 3, range: 1, move: 2, label: 'Warden', glyph: '▰', detail: 'Hold a crossing. Guard reduces incoming damage by 2.' },
  bow: { hp: 10, atk: 3, range: 3, move: 3, label: 'Archer', glyph: '➶', detail: 'Attack from three hexes. Retaliation only reaches within enemy range.' },
  healer: { hp: 12, atk: 2, range: 1, move: 3, label: 'Herald', glyph: '✚', detail: 'Bandage an adjacent ally for 5 HP. No suspicion, no ember cost.' },
  guard: { hp: 10, atk: 3, range: 1, move: 2, label: 'House guard', glyph: '◆', detail: 'House guards stay neutral until you attack their house or reveal forbidden fire.' },
  champion: { hp: 20, atk: 4, range: 1, move: 2, label: 'Champion', glyph: '♜', detail: 'Ash can speak within 2 hexes. Her seal binds you to escort both prisoners out alive.' },
  arbiter: { hp: 12, atk: 4, range: 1, move: 2, label: 'Arbiter', glyph: '♟', detail: 'Blocks the escape. Steel against Arbiters does not alarm the house. Forbidden fire does.' },
};
export function makeUnit(id, name, role, side, q, r) {
  const def = ROLES[role];
  return { id, name, role, side, q, r, hp:def.hp, maxHp:def.hp, atk:def.atk,
    range:def.range, move:def.move, moved:false, acted:false, guarding:false, reserve:false };
}
export function createTrial() {
  const forest = new Set(['-3,0','-2,-1','-3,3','1,-3','2,1','2,-3']);
  const rocks = new Set(['-4,1','-1,-3','1,-1','2,2']);
  const tiles = [];
  for (let q=-RADIUS;q<=RADIUS;q++) for(let r=Math.max(-RADIUS,-q-RADIUS);r<=Math.min(RADIUS,-q+RADIUS);r++) {
    const k = `${q},${r}`;
    tiles.push({q,r,terrain:q===0 && r!==0 && r!==2 ? 'water' : rocks.has(k) ? 'rock' : forest.has(k) ? 'forest' : 'ground'});
  }
  const units = [
    makeUnit('ash','Ash','ash','ally',-3,2), makeUnit('rook','Rook','shield','ally',-3,1),
    makeUnit('sable','Sable','bow','ally',-2,2), makeUnit('iona','Iona','healer','ally',-2,3),
    makeUnit('checkpoint','Gatekeeper','guard','house',-1,0),
    makeUnit('north-jailer','North jailer','guard','house',-2,-2),
    makeUnit('south-jailer','South jailer','guard','house',2,0),
    makeUnit('lookout','Causeway bow','bow','house',1,1),
    makeUnit('vesper','Vesper','champion','house',2,-1),
    makeUnit('sealguard','Seal warden','shield','house',3,-3),
  ];
  return { version:2, scenario:'ashen-causeway', phase:'playing', round:1, selected:'ash', tiles, units,
    suspicion:0, hostile:false, exposed:false, gateOpen:false, seal:false, embers:4, powerUsed:false,
    oath:false, bargain:'none', pending:null, inspectionRound:4, inspectionArrived:false, intents:[],
    captives:[{id:'mara',name:'Mara',role:'bow',q:-1,r:-2,jailer:'north-jailer',freed:false},
      {id:'brann',name:'Brann',role:'shield',q:1,r:3,jailer:'south-jailer',freed:false}],
    log:[{round:1,text:'The judges close the causeway after round 12. Take the seal and get Ash to the eastern exit.'}],
    undo:null, result:null, actions:0 };
}
export function log(s, text) { s.log.unshift({round:s.round,text}); s.log = s.log.slice(0,24); }
export const living = s => s.units.filter(u => u.hp > 0 && !u.reserve);
export const unitAt = (s,t) => living(s).find(u => same(u,t));
export const tileAt = (s,t) => s.tiles.find(x => same(x,t));
export const freed = s => s.captives.filter(c => c.freed).length;

export const safeCaptives = s => s.captives.filter(c=>c.freed && s.units.some(u=>u.id===c.id && u.hp>0 && (u.reserve || distance(u,EXIT)<=1)));
