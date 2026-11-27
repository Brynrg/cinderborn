import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrial, makeUnit, living, safeCaptives, GATE, key } from './scenario.js';
import { dispatch } from './actions.js';
import { paths, forecast, planEnemies, enemyPhase } from './tactics.js';
import { load, save, SAVE_KEY, PREVIOUS_SAVE_KEY } from './storage.js';
import { oathRoute, fireRoute } from '../../tests/fixtures/routes.js';
const unit=(s,id)=>s.units.find(u=>u.id===id);
function apply(s,a){const r=dispatch(s,a);assert.equal(r.error,null,JSON.stringify(a));return r.state;}
function memory(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};}

for(const [name,route,round,freed] of [['oath',oathRoute,5,2],['fire',fireRoute,9,2]])test(`${name} route finishes and every transaction survives a save round trip`,()=>{
  let s=createTrial();const storage=memory();
  for(const a of route){s=apply(s,a);assert.ok(save(storage,s));assert.deepEqual(load(storage),s);s=load(storage);}
  assert.equal(s.phase,'won');assert.equal(s.result.round,round);assert.equal(s.result.freed,freed);
  if(name==='oath'){assert.equal(s.result.safe,2);assert.equal(s.result.survivors,6);assert.equal(s.hostile,false);}
  else{assert.equal(s.inspectionArrived,true);assert.equal(s.exposed,true);}
});

test('movement respects the closed crossing, cliffs, occupancy and one move; undo restores the activation',()=>{
  let s=createTrial();const ash=unit(s,'ash');
  const reachable=paths(s,ash);assert.ok(reachable.has('-1,1'));assert.ok(!reachable.has(key(GATE)));assert.ok(!reachable.has('-4,1'));assert.ok(!reachable.has('-2,2'));
  s=apply(s,{type:'move',unitId:'ash',to:{q:-1,r:1}});
  const before=structuredClone(s);assert.ok(dispatch(s,{type:'move',unitId:'ash',to:{q:-2,r:1}}).error);assert.deepEqual(s,before);
  s=apply(s,{type:'undo'});assert.equal(unit(s,'ash').q,-3);assert.equal(unit(s,'ash').moved,false);
  s=apply(s,{type:'guard',unitId:'ash'});assert.equal(s.undo,null);assert.ok(dispatch(s,{type:'move',unitId:'ash',to:{q:-1,r:1}}).error);
});

test('combat preview includes grove cover, guard and retaliation; lethal strikes prevent the counter',()=>{
  const s=createTrial(),ash=unit(s,'ash'),guard=unit(s,'checkpoint');
  Object.assign(ash,{q:-2,r:0});Object.assign(guard,{q:-2,r:-1,guarding:true});
  assert.deepEqual(forecast(s,ash,guard),{hit:1,counter:3,lethal:false});
  guard.hp=1;assert.deepEqual(forecast(s,ash,guard),{hit:1,counter:0,lethal:true});
  const next=apply(s,{type:'attack',unitId:'ash',target:guard.id});assert.equal(unit(next,guard.id).hp,0);assert.equal(unit(next,'ash').hp,16);
});

test('ranged attacks cannot shoot through cliffs',()=>{
  const s=createTrial(),bow=unit(s,'sable'),guard=unit(s,'sealguard');
  Object.assign(bow,{q:1,r:0});Object.assign(guard,{q:1,r:-2});assert.equal(forecast(s,bow,guard),null);
});

test('Firebrand alarms guards, spends one ember and activation, and reload cannot reset it',()=>{
  let s=createTrial();Object.assign(unit(s,'ash'),{q:-1,r:1});
  s=apply(s,{type:'magic',kind:'firebrand',unitId:'ash',target:'gate'});
  assert.equal(s.embers,3);assert.equal(s.suspicion,40);assert.equal(s.hostile,true);assert.equal(s.exposed,false);assert.equal(s.gateOpen,true);
  assert.ok(unit(s,'ash').acted);assert.ok(s.intents.length);
  const storage=memory();save(storage,s);s=load(storage);
  assert.ok(dispatch(s,{type:'magic',kind:'mend',unitId:'ash',target:'ash'}).error);assert.equal(s.embers,3);
});

test('Mend and bandage have different costs; crossing 50 exposes the band and improves fire',()=>{
  let s=createTrial();s.suspicion=40;unit(s,'ash').hp=5;
  s=apply(s,{type:'magic',kind:'mend',unitId:'ash',target:'ash'});
  assert.equal(unit(s,'ash').hp,12);assert.equal(s.embers,3);assert.equal(s.suspicion,55);assert.equal(s.exposed,true);assert.ok(s.intents.length);
  s=apply(s,{type:'move',unitId:'iona',to:{q:-3,r:3}});
  s=apply(s,{type:'bandage',unitId:'iona',target:'ash'});assert.equal(unit(s,'ash').hp,16);assert.equal(s.embers,3);assert.equal(s.suspicion,55);
  // Isolate the next activation to verify the exposed damage rule.
  s.powerUsed=false;Object.assign(unit(s,'ash'),{acted:false,moved:false,q:-2,r:0});
  const before=unit(s,'checkpoint').hp;
  s=apply(s,{type:'magic',kind:'firebrand',unitId:'ash',target:'checkpoint'});assert.equal(before-unit(s,'checkpoint').hp,7);
});

test('intents hold their target tiles through player actions, so stepping aside evades',()=>{
  let s=createTrial();s.hostile=true;s.units.forEach(u=>{if(!['ash','checkpoint'].includes(u.id))u.hp=0;});
  Object.assign(unit(s,'ash'),{q:-2,r:0});planEnemies(s);
  assert.deepEqual(s.intents[0].target,{q:-2,r:0});const intents=structuredClone(s.intents);
  s=apply(s,{type:'move',unitId:'ash',to:{q:-3,r:2}});assert.deepEqual(s.intents,intents);
  s=apply(s,{type:'magic',kind:'firebrand',unitId:'ash',target:'checkpoint'});assert.deepEqual(s.intents,intents);
  const hp=unit(s,'ash').hp;s=apply(s,{type:'end'});assert.equal(unit(s,'ash').hp,hp);
});

test('a forecasted path does not pass through a stationary friendly guard',()=>{
  const s=createTrial();s.hostile=true;const checkpoint=unit(s,'checkpoint');
  for(const [,path] of paths(s,checkpoint))for(const step of path)assert.ok(!living(s).some(u=>u.id!==checkpoint.id&&u.q===step.q&&u.r===step.r));
});

test('pending decisions block gameplay and cancel cleanly; declining leaves the seal at the shrine',()=>{
  let s=createTrial();Object.assign(unit(s,'ash'),{q:-1,r:1});
  s=apply(s,{type:'interact',unitId:'ash',kind:'gate'});assert.ok(dispatch(s,{type:'end'}).error);
  s=apply(s,{type:'choose',choice:'cancel'});assert.equal(s.pending,null);assert.equal(unit(s,'ash').acted,false);
  Object.assign(unit(s,'ash'),{q:1,r:0});s=apply(s,{type:'interact',unitId:'ash',kind:'bargain'});
  s=apply(s,{type:'choose',choice:'decline'});assert.equal(s.bargain,'declined');assert.equal(s.seal,false);assert.equal(s.inspectionRound,4);
});

test('the oath requires both living captives at the exit, not merely unlocked cages',()=>{
  let s=createTrial();for(const a of oathRoute.slice(0,12))s=apply(s,a);
  assert.equal(s.captives.filter(c=>c.freed).length,2);assert.equal(safeCaptives(s).length,0);
  assert.ok(dispatch(s,{type:'interact',unitId:'ash',kind:'exit'}).error);
  unit(s,'mara').hp=0;s=apply(s,{type:'guard',unitId:'sable'});assert.equal(s.phase,'lost');assert.match(s.result.reason,/oath is broken/);
});

test('a full band keeps the rescued captive safely in reserve',()=>{
  let s=createTrial();s.oath=true;s.seal=true;s.bargain='sworn';
  unit(s,'checkpoint').side='ally';unit(s,'lookout').side='ally';Object.assign(unit(s,'iona'),{q:1,r:2});
  s=apply(s,{type:'interact',unitId:'iona',kind:'brann'});
  assert.equal(unit(s,'brann').reserve,true);assert.equal(safeCaptives(s).length,1);assert.equal(living(s).filter(u=>u.side==='ally').length,6);
});

test('guarded captives cannot be freed without either permission or defeating the jailer',()=>{
  let s=createTrial();Object.assign(unit(s,'rook'),{q:-2,r:-1});
  assert.ok(dispatch(s,{type:'interact',unitId:'rook',kind:'mara'}).error);
  unit(s,'north-jailer').hp=0;s=apply(s,{type:'interact',unitId:'rook',kind:'mara'});assert.equal(s.captives[0].freed,true);assert.equal(s.suspicion,10);
});

test('inspection spawns at the announced round, including migrated games',()=>{
  for(const arrival of [4,8]){let s=createTrial();s.inspectionRound=arrival;s.round=arrival-1;
    s=apply(s,{type:'end'});assert.equal(s.round,arrival);assert.equal(s.inspectionArrived,true);
    assert.equal(living(s).filter(u=>u.side==='arbiter').length,2);assert.equal(s.intents.length,2);
    assert.equal(s.hostile,false);assert.equal(s.powerUsed,false);
  }
});

test('Ash death and the deadline end the trial and prohibit additional actions',()=>{
  for(const cause of ['death','deadline']){let s=createTrial();if(cause==='death')unit(s,'ash').hp=0;else s.round=12;
    s=apply(s,{type:'end'});assert.equal(s.phase,'lost');assert.ok(dispatch(s,{type:'end'}).error);
  }
});

test('corrupt or incompatible saves and unavailable storage fail safely',()=>{
  const storage=memory();const broken=[null,{}, {version:99}, 'not json'];
  for(const value of broken){storage.setItem(SAVE_KEY,typeof value==='string'?value:JSON.stringify(value));assert.equal(load(storage),null);}
  for(const mutate of [s=>s.units[0].role='unknown',s=>s.intents=[null],s=>s.tiles[0]=null,s=>s.pending={kind:'alien'},s=>s.units[0].hp=NaN,s=>s.captives[0].freed=true,s=>s.phase='won']){
    const s=createTrial();mutate(s);storage.setItem(SAVE_KEY,JSON.stringify(s));assert.equal(load(storage),null);
  }
  assert.equal(save({setItem(){throw new Error('full');}},createTrial()),false);
  assert.equal(load({getItem(){throw new Error('blocked');}}),null);
});

test('the old solo shortcut cannot steal a warded seal or ignore a contested exit',()=>{
  let s=createTrial();
  for(const a of [{type:'move',unitId:'ash',to:{q:-1,r:2}},{type:'end'},
    {type:'move',unitId:'ash',to:{q:2,r:1}},{type:'end'},
    {type:'move',unitId:'ash',to:{q:3,r:-1}}])s=apply(s,a);
  assert.match(dispatch(s,{type:'interact',unitId:'ash',kind:'seal'}).error,/warden/);
  unit(s,'sealguard').hp=0;s=apply(s,{type:'interact',unitId:'ash',kind:'seal'});
  assert.equal(s.seal,true);
  Object.assign(unit(s,'ash'),{q:3,r:1,acted:false});
  s.units.push(makeUnit('arbiter-1','Arbiter 2','arbiter','arbiter',4,0));
  assert.match(dispatch(s,{type:'interact',unitId:'ash',kind:'exit'}).error,/contested/);
  for(const u of s.units)if(u.side!=='ally')u.hp=0;
  s=apply(s,{type:'interact',unitId:'ash',kind:'exit'});assert.equal(s.phase,'won');
});

test('steel against an Arbiter preserves cover and existing threats survive the house alarm',()=>{
  let s=createTrial();s.gateOpen=true;
  Object.assign(unit(s,'ash'),{q:1,r:0});
  s.units.push(makeUnit('arbiter-0','Arbiter 1','arbiter','arbiter',1,2));
  planEnemies(s);const locked=structuredClone(s.intents);
  s=apply(s,{type:'attack',unitId:'sable',target:'arbiter-0'});
  assert.equal(s.hostile,false);assert.equal(s.suspicion,0);assert.deepEqual(s.intents,locked);
  s=apply(s,{type:'magic',kind:'firebrand',unitId:'ash',target:'south-jailer'});
  assert.equal(s.hostile,true);assert.deepEqual(s.intents.find(i=>i.id==='arbiter-0'),locked[0]);
});

test('enemy plans reserve distinct destinations and advance when their paths remain clear',()=>{
  const s=createTrial();s.hostile=true;s.gateOpen=true;
  for(const u of s.units)if(!['ash','checkpoint','north-jailer'].includes(u.id))u.hp=0;
  Object.assign(unit(s,'ash'),{q:3,r:1});
  Object.assign(unit(s,'checkpoint'),{q:0,r:0});
  Object.assign(unit(s,'north-jailer'),{q:-1,r:1});
  planEnemies(s);
  assert.equal(new Set(s.intents.map(i=>key(i.to))).size,s.intents.length);
  assert.ok(s.intents.every(i=>i.path.length>0));
  const plans=structuredClone(s.intents);enemyPhase(s);
  for(const i of plans)assert.equal(key(unit(s,i.id)),key(i.to));
});

test('v1 saves migrate pending choices without rewriting the old slot or spawning an immediate inspection',()=>{
  const storage=memory();let s=createTrial();s.version=1;s.round=7;s.inspectionRound=8;
  s.pending={kind:'bargain',unitId:'ash'};s.embers=2;unit(s,'ash').hp=8;
  const old=JSON.stringify(s);storage.setItem(PREVIOUS_SAVE_KEY,old);
  const migrated=load(storage);
  assert.equal(migrated.version,3);assert.equal(migrated.inspectionRound,8);
  assert.deepEqual(migrated.pending,s.pending);assert.deepEqual(migrated.units,s.units);
  assert.equal(migrated.embers,2);assert.match(migrated.migrationNotice,/preserved/);
  assert.ok(save(storage,migrated));assert.equal(storage.getItem(PREVIOUS_SAVE_KEY),old);
  storage.setItem(SAVE_KEY,'broken');assert.equal(load(storage),null);
});

test('completed v1 games retain their ending on migration',()=>{
  const storage=memory();let s=createTrial();for(const a of oathRoute)s=apply(s,a);
  s.version=1;delete s.result.honors;delete s.result.fallen;
  storage.setItem(PREVIOUS_SAVE_KEY,JSON.stringify(s));const migrated=load(storage);
  assert.equal(migrated.version,3);assert.deepEqual(migrated.result,s.result);
  assert.equal(migrated.migrationNotice,undefined);
  s.result.honors='broken';storage.setItem(SAVE_KEY,JSON.stringify(s));assert.equal(load(storage),null);
});
