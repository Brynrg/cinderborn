import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun} from './contracts.js';
import {createTrial,makeUnit,tileAt} from './scenario.js';
import {dispatch} from './actions.js';
import {planEnemies,damage} from './tactics.js';
import {techniquePreview} from './abilities.js';
import {emptyRecords,recordResult,readRecords,saveRecords} from './records.js';
import {load,save,SAVE_KEY,PREVIOUS_SAVE_KEY} from './storage.js';
import {lastLightRoute,ashfallRoute} from '../../tests/fixtures/contracts.js';
const unit=(s,id)=>s.units.find(u=>u.id===id);
const apply=(s,a)=>{const r=dispatch(s,a);assert.equal(r.error,null,JSON.stringify(a));return r.state;};
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};};
for(const [id,route,round] of [['lastlight',lastLightRoute,3],['ashfall',ashfallRoute,9]])test(`${id} completes, keeps its deadline, and round-trips every action`,()=>{
  let s=createRun(id);const storage=memory();s.runId=id;
  for(const a of route){s=apply(s,a);assert.ok(save(storage,s));assert.deepEqual(load(storage),s);}
  assert.equal(s.phase,'won');assert.equal(s.round,round);assert.equal(s.result.safe,2);assert.equal(s.result.survivors,6);assert.equal(s.result.honors.length,4);
});
test('pinning costs a charge, deals less damage without a counter, and cancels movement without retargeting',()=>{
  let s=createRun('lastlight');Object.assign(unit(s,'sable'),{q:3,r:-1});
  const original=structuredClone(s.intents.find(i=>i.id==='arbiter-0'));
  assert.ok(original.path.length);const preview=techniquePreview(s,unit(s,'sable'),unit(s,'arbiter-0'));
  s=apply(s,{type:'technique',unitId:'sable',target:'arbiter-0'});
  assert.equal(unit(s,'arbiter-0').hp,12-preview.hit);assert.equal(unit(s,'sable').hp,10);assert.equal(unit(s,'sable').charges,1);
  assert.equal(s.hostile,false);assert.equal(s.suspicion,10);
  const intent=s.intents.find(i=>i.id==='arbiter-0');assert.deepEqual(intent.target,original.target);assert.deepEqual(intent.path,[]);
  const storage=memory();save(storage,s);s=load(storage);assert.equal(unit(s,'arbiter-0').pinned,true);
  s=apply(s,{type:'end'});assert.deepEqual([unit(s,'arbiter-0').q,unit(s,'arbiter-0').r],[1,-2]);assert.equal(unit(s,'arbiter-0').pinned,false);
});
test('pinning a house guard raises the alarm but still prevents its first planned move',()=>{
  let s=createTrial();Object.assign(unit(s,'sable'),{q:-2,r:0});
  s=apply(s,{type:'technique',unitId:'sable',target:'north-jailer'});assert.equal(s.hostile,true);assert.equal(s.suspicion,15);
  assert.deepEqual(s.intents.find(i=>i.id==='north-jailer').path,[]);
});
test('Bulwark protects adjacent allies through enemy resolution and expires next round',()=>{
  let s=createTrial();Object.assign(unit(s,'rook'),{q:-2,r:0});Object.assign(unit(s,'ash'),{q:-2,r:1});
  for(const u of s.units)if(!['rook','ash','checkpoint'].includes(u.id))u.hp=0;
  s.hostile=true;planEnemies(s);
  s=apply(s,{type:'technique',unitId:'rook'});assert.equal(unit(s,'rook').guarding,true);assert.equal(unit(s,'ash').guarding,true);
  const before=unit(s,'ash').hp;s=apply(s,{type:'end'});assert.equal(unit(s,'ash').hp,before-1);assert.equal(unit(s,'ash').guarding,false);
});
test('Field dressing reaches distant wounds, respects full health, and has only two uses',()=>{
  let s=createTrial();Object.assign(unit(s,'ash'),{q:-1,r:1,hp:1});const a={type:'technique',unitId:'iona',target:'ash'};
  s=apply(s,a);assert.equal(unit(s,'ash').hp,5);assert.equal(s.embers,4);assert.equal(s.suspicion,0);
  s=apply(s,{type:'end'});s=apply(s,a);assert.equal(unit(s,'ash').hp,9);
  s=apply(s,{type:'end'});assert.match(dispatch(s,a).error,/No technique uses/);assert.equal(unit(s,'iona').charges,0);
});
test('high ground adds exactly one ranged damage, never a melee or same-height bonus',()=>{
  const s=createTrial(),bow=unit(s,'sable'),ash=unit(s,'ash'),target=unit(s,'checkpoint');
  Object.assign(bow,{q:3,r:-1});Object.assign(target,{q:4,r:0});assert.equal(damage(s,bow,target),4);
  tileAt(s,target).height=1;assert.equal(damage(s,bow,target),3);
  Object.assign(ash,{q:3,r:-1});tileAt(s,target).height=0;assert.equal(damage(s,ash,target),4);
});
test('each contract enforces its advertised final round',()=>{
  for(const id of ['causeway','lastlight','ashfall']){let s=createRun(id);s.round=s.deadline;s.intents=[];s=apply(s,{type:'end'});assert.equal(s.phase,'lost');assert.match(s.result.reason,/final bell/);}
});
test('v2 saves retain their exact encounter and gain techniques without rewriting the old slot',()=>{
  const storage=memory();const s=createTrial();s.version=2;s.round=3;delete s.contract;delete s.deadline;
  for(const u of s.units){delete u.charges;delete u.pinned;}for(const t of s.tiles)delete t.height;
  s.pending={kind:'gate',unitId:'ash'};s.embers=1;unit(s,'ash').hp=7;
  const old=JSON.stringify(s);storage.setItem(PREVIOUS_SAVE_KEY,old);const migrated=load(storage);
  assert.equal(migrated.version,3);assert.equal(migrated.round,3);assert.equal(migrated.inspectionRound,4);assert.equal(migrated.embers,1);assert.deepEqual(migrated.pending,s.pending);
  assert.equal(unit(migrated,'ash').hp,7);assert.equal(unit(migrated,'sable').charges,2);assert.ok(migrated.tiles.every(t=>t.height===0));
  save(storage,migrated);assert.equal(storage.getItem(PREVIOUS_SAVE_KEY),old);
  unit(migrated,'sable').charges=-1;storage.setItem(SAVE_KEY,JSON.stringify(migrated));assert.equal(load(storage),null);
});
test('records deduplicate reloads, keep best rounds and honor unions, and reject corrupt data',()=>{
  let s=createRun('lastlight');s.runId='run-one';for(const a of lastLightRoute)s=apply(s,a);
  let records=recordResult(emptyRecords(),s);assert.equal(records.contracts.lastlight.wins,1);
  assert.deepEqual(recordResult(records,s),records);const storage=memory();assert.ok(saveRecords(storage,records));assert.deepEqual(readRecords(storage),records);
  s.runId='run-two';s.round=4;s.result.honors=['No allies lost'];records=recordResult(records,s);
  assert.equal(records.contracts.lastlight.bestRound,3);assert.equal(records.contracts.lastlight.wins,2);assert.equal(records.contracts.lastlight.honors.length,4);
  records.contracts.lastlight.bestRound='bad';saveRecords(storage,records);assert.deepEqual(readRecords(storage),emptyRecords());
});
