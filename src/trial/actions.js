import { GATE, SEAL, EXIT, ENTRIES, DIRS, makeUnit, key, same, distance, living, unitAt, freed, safeCaptives, log } from './scenario.js';
import { useTechnique } from './abilities.js';
import { contractFor, deadline } from './contracts.js';
import { actionError } from './guidance.js';
import { paths, forecast, attack, walkable, enemyPhase, planEnemies, sealWarden, exitBlockers } from './tactics.js';

function pressure(s,n) {
  s.suspicion=Math.min(100,s.suspicion+n);
  if(s.suspicion>=50 && !s.exposed) {
    s.exposed=true;s.hostile=true;
    log(s,'Your mask breaks. House guards turn hostile; Embercraft now strikes for 7.');
  }
}
function finish(s,won,reason) {
  s.phase=won?'won':'lost';s.pending=null;s.undo=null;
  s.result={won,reason,round:s.round,freed:freed(s),safe:safeCaptives(s).length,survivors:living(s).filter(u=>u.side==='ally').length,
    route:s.exposed?'Unmasked':s.oath?'Oathkeeper':'Seal breaker',
    fallen:s.units.filter(u=>u.side==='ally'&&u.hp<=0).map(u=>u.name),
    honors:won?[...(safeCaptives(s).length===2?['Both prisoners safe']:[]),...(s.contract==='ashfall'?(s.embers>0?['Embers to spare']:[]):(!s.hostile?['Cover intact']:[])),...(s.round<=contractFor(s).par?['Swift escape']:[]),...(s.units.filter(u=>u.side==='ally'&&u.hp>0).length===4+freed(s)?['No allies lost']:[])]:[]};
  log(s,reason);
}
export function checkOutcome(s) {
  if(s.phase!=='playing') return;
  if(!living(s).some(u=>u.id==='ash')) finish(s,false,'Ash has fallen. The stolen name dies on the causeway.');
  else if(s.oath && s.captives.some(c=>c.freed&&s.units.some(u=>u.id===c.id&&u.hp<=0))) finish(s,false,'A prisoner died under your protection. The oath is broken; Vesper revokes your seal.');
}
function spend(u) {u.acted=true;u.moved=true;}
function rescue(s,u,c) {
  if(!c||c.freed||distance(u,c)>1) return false;
  if(!s.oath && living(s).some(e=>e.id===c.jailer)) return false;
  const spot=[c,...DIRS.map(([q,r])=>({q:c.q+q,r:c.r+r}))].find(t=>walkable(s,t)&&!unitAt(s,t));
  const nu=makeUnit(c.id,c.name,c.role,'ally',spot?.q??c.q,spot?.r??c.r);
  nu.reserve=!spot || living(s).filter(x=>x.side==='ally').length>=6;
  nu.moved=true;nu.acted=true;s.units.push(nu);c.freed=true;spend(u);
  log(s,`${c.name} is free.${nu.reserve?' Safely in reserve.':' Joins the band next round.'}`);
  if(!s.oath) pressure(s,10);
  return true;
}
function interact(s,u,kind) {
  if(kind==='gate' && u.id==='ash' && distance(u,GATE)<=1 && !s.gateOpen && !s.exposed && !s.hostile) {
    s.pending={kind:'gate',unitId:u.id};return true;
  }
  const champ=living(s).find(x=>x.id==='vesper');
  if(kind==='bargain' && u.id==='ash' && champ && distance(u,champ)<=2 && !s.hostile && s.bargain==='none') {
    s.pending={kind:'bargain',unitId:u.id};return true;
  }
  if(kind==='seal' && u.id==='ash' && distance(u,SEAL)<=1 && !s.seal && !sealWarden(s)) {
    s.seal=true;s.hostile=true;pressure(s,25);spend(u);
    log(s,'The trial seal is yours. The house calls its guards. Reach the eastern exit.');return true;
  }
  if(kind==='exit' && u.id==='ash' && same(u,EXIT) && s.seal && exitBlockers(s).length===0 && (!s.oath || safeCaptives(s).length===2)) {
    spend(u);finish(s,true,s.oath?'The seal, the prisoners, and your word intact. Vesper watches your band vanish into the mist.'
      :`Ash escapes with the seal. ${freed(s)} of the two prisoners freed. The judges will remember this.`);return true;
  }
  return rescue(s,u,s.captives.find(c=>c.id===kind));
}
function choose(s,id) {
  const p=s.pending,u=s.units.find(x=>x.id===p?.unitId);
  if(!p||!u) return false;
  if(id==='cancel') {s.pending=null;return true;}
  if(p.kind==='gate' && id==='signet') {
    s.gateOpen=true;pressure(s,10);spend(u);log(s,'The stolen signet holds. The causeway opens. (+10 suspicion)');
  } else if(p.kind==='bargain' && id==='oath') {
    s.oath=true;s.bargain='sworn';s.seal=true;s.gateOpen=true;spend(u);
    log(s,'Vesper gives you the seal. Her guards stand aside; the Arbiters will not. Escort Mara and Brann beside the exit, then clear a road out.');
  } else if(p.kind==='bargain' && id==='decline') {
    s.bargain='declined';log(s,'You promise nothing. The seal remains at the northern shrine.');
  } else return false;
  s.pending=null;return true;
}
function magic(s,u,a) {
  if(u.id!=='ash'||u.acted||s.powerUsed||s.embers<=0) return false;
  const target=living(s).find(x=>x.id===a.target);
  if(a.kind==='mend') {
    if(!target||target.side!=='ally'||distance(u,target)>3||target.hp>=target.maxHp) return false;
    target.hp=Math.min(target.maxHp,target.hp+7);pressure(s,15);log(s,`${target.name} is mended for up to 7 HP. (+15 suspicion)`);
  } else if(a.kind==='firebrand') {
    if(a.target==='gate') {
      if(s.gateOpen||distance(u,GATE)>2) return false;
      s.gateOpen=true;log(s,'The gate burns. The quiet road is gone.');
    } else {
      if(!target||target.side==='ally'||distance(u,target)>2) return false;
      const hit=s.exposed?7:5;target.hp=Math.max(0,target.hp-hit);log(s,`Embercraft strikes ${target.name} for ${hit}. No retaliation.`);
    }
    s.hostile=true;pressure(s,40);
  } else return false;
  s.embers--;s.powerUsed=true;spend(u);return true;
}
function endRound(s) {
  const before=living(s).filter(u=>u.side==='ally').map(u=>({id:u.id,name:u.name,hp:u.hp}));
  const losses=()=>before.map(u=>{const after=s.units.find(x=>x.id===u.id);return after.hp<=0?`${u.name} fell`:after.hp<u.hp?`${u.name} −${u.hp-after.hp} HP`:null;}).filter(Boolean);
  let arrival=false;
  enemyPhase(s);checkOutcome(s);if(s.phase!=='playing')return;
  if(s.round>=deadline(s)) {finish(s,false,'The final bell sounds. The judges seal every road out.');return;}
  s.round++;s.powerUsed=false;for(const u of s.units)u.pinned=false;
  for(const u of living(s).filter(u=>u.side==='ally')) {u.moved=false;u.acted=false;u.guarding=false;}
  if(!s.inspectionArrived && s.round>=s.inspectionRound) {
    s.inspectionArrived=true;arrival=true;
    for(let i=0;i<ENTRIES.length;i++) {
      const spawn=[...s.tiles].filter(t=>walkable(s,t)&&!unitAt(s,t)).sort((a,b)=>distance(a,ENTRIES[i])-distance(b,ENTRIES[i]))[0];
      if(spawn)s.units.push(makeUnit(`arbiter-${i}`,'Arbiter '+(i+1),'arbiter','arbiter',spawn.q,spawn.r));
    }
    log(s,'Inspection arrives at the marked beacons. The Arbiters block the eastern escape.');
  }
  planEnemies(s);
  const report=losses();
  log(s,`Round ${s.round}. ${arrival?'Inspection has arrived! ':''}${report.length?report.join(' · ')+'. ':'No allies hurt. '}Read the next enemy strikes.`);
}

// All successful actions are plain-data transactions; the UI saves the returned state.
export function dispatch(state,a) {
  if(state.phase!=='playing')return {state,error:'This trial has ended.'};
  if(state.pending && a.type!=='choose')return {state,error:'Resolve the open decision first.'};
  const wasHostile=state.hostile;
  const s=structuredClone(state),u=s.units.find(x=>x.id===a.unitId);
  let ok=false,keepUndo=false;
  if(a.type==='choose')ok=choose(s,a.choice);
  else if(a.type==='end') {endRound(s);ok=true;}
  else if(a.type==='undo' && s.undo) {
    const moved=s.units.find(x=>x.id===s.undo.id);
    Object.assign(moved,s.undo.from);s.undo=null;ok=true;log(s,'Movement undone.');
  } else if(u && u.hp>0 && u.side==='ally' && !u.reserve) {
    if(a.type==='move' && !u.moved && !u.acted && paths(s,u).has(key(a.to))) {
      s.undo={id:u.id,from:{q:u.q,r:u.r,moved:u.moved}};
      Object.assign(u,a.to);u.moved=true;ok=true;keepUndo=true;
    } else if(a.type==='attack' && !u.acted) {
      const e=living(s).find(x=>x.id===a.target);
      if(e&&forecast(s,u,e)) {if(e.side==='house'){s.hostile=true;pressure(s,15);}ok=attack(s,u,e);}
    } else if(a.type==='technique'&&!u.acted){
      const target=living(s).find(x=>x.id===a.target);
      ok=useTechnique(s,u,target);
      if(ok&&u.role==='bow'&&target?.side==='house'){s.hostile=true;pressure(s,15);}
    } else if(a.type==='guard' && !u.acted) {u.guarding=true;spend(u);log(s,`${u.name} guards: −2 incoming damage until next round.`);ok=true;}
    else if(a.type==='bandage' && u.role==='healer' && !u.acted) {
      const ally=living(s).find(x=>x.id===a.target);
      if(ally?.side==='ally' && distance(u,ally)<=1 && ally.hp<ally.maxHp) {ally.hp=Math.min(ally.maxHp,ally.hp+5);spend(u);log(s,`${u.name} bandages ${ally.name} for up to 5 HP.`);ok=true;}
    } else if(a.type==='interact'&&!u.acted)ok=interact(s,u,a.kind);
    else if(a.type==='magic')ok=magic(s,u,a);
  }
  if(!ok)return {state,error:actionError(state,a)};
  if(!wasHostile && s.hostile){planEnemies(s,state.intents);for(const i of s.intents){const e=s.units.find(u=>u.id===i.id);if(e.pinned){i.path=[];i.to={q:e.q,r:e.r};}}}
  if(!keepUndo)s.undo=null;
  s.actions++;checkOutcome(s);
  return {state:s,error:null};
}
