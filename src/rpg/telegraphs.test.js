import test from 'node:test';import assert from 'node:assert/strict';
import {inDanger,clearance,validMark} from './telegraphs.js';
import {attackPlan,combatReadout} from './encounters.js';
import {createGame,travel,save,load,validSave} from './state.js';
import {FOES,enemyById,stats} from './data.js';
import {regionData} from './regions.js';
import {tick,selectTarget} from './engine.js';
import {people,objective,talk,choose,dialogue} from './story.js';
import {blocked,pathTo} from './world.js';
const late=(zone='citadel')=>{const s=createGame();Object.assign(s.quests,{complete:true,metRook:true,seal:true});Object.assign(s.campaign,{forgeAccepted:true,forgeChoice:'workers',fenAccepted:true,archiveChoice:'publish'});travel(s,zone);for(const n of regionData(zone).nodes.filter(n=>['vent','record','beacon'].includes(n.kind)))s.collected.push(n.id);return s;};
const memory=()=>{let value;return {getItem:()=>value,setItem:(k,v)=>value=v};};
test('lane, ring and circle warnings include the body edge and have real safe spaces',()=>{
 const lane={x:500,y:500,r:30,length:520,angle:0,shape:'lane'};assert.ok(inDanger({x:800,y:530},lane));assert.equal(inDanger({x:800,y:545},lane),false);assert.equal(inDanger({x:450,y:500},lane),false);assert.ok(inDanger({x:1030,y:500},lane));assert.equal(inDanger({x:1070,y:500},lane),false);
 const ring={x:500,y:500,r:210,inner:62,shape:'ring'};assert.equal(inDanger({x:500,y:500},ring),false);assert.equal(inDanger({x:548,y:500},ring),false);assert.ok(inDanger({x:554,y:500},ring));assert.ok(inDanger({x:700,y:500},ring));assert.equal(inDanger({x:725,y:500},ring),false);assert.ok(clearance({x:500,y:500},ring)>0);
 assert.ok(validMark(lane));assert.ok(validMark(ring));assert.equal(validMark({...lane,angle:NaN}),false);assert.equal(validMark({...ring,inner:220}),false);
});
test('campaign bosses have different attacks and can pressure a ranged caster',()=>{
 const s=late('forge'),e=enemyById(s,'bailiff');Object.assign(s.player,{x:e.x-350,y:e.y});e.aggro=true;e.wait=0;tick(s,.05);assert.equal(e.mark.shape,'lane');assert.ok(inDanger(s.player,e.mark));assert.equal(s.player.hp,stats(s).maxHp);
 const a=attackPlan({type:'archivist',x:500,y:500,hp:1600,attackIndex:0},{x:577,y:500});assert.equal(a.shape,'ring');assert.match(a.hint,/inside/);
 const j={type:'judge',x:500,y:500,hp:2200,attackIndex:0};assert.equal(attackPlan(j,{x:577,y:500},true,1).shape,'ring');assert.equal(attackPlan(j,{x:577,y:500},true,2).shape,'lane');
});
test('Judge exposes its opening only after both strikes, including a save during the gap',()=>{
 const s=late(),e=enemyById(s,'first-judge');Object.assign(s.player,{x:e.x-80,y:e.y,level:20,hp:328});e.aggro=true;e.wait=0;tick(s,.05);assert.equal(e.attackIndex,1);for(let i=0;i<26;i++)tick(s,.05);assert.equal(e.recovery,0);assert.match(combatReadout(s,e).title,/Second strike/);
 const m=memory();save(m,s);const restored=load(m);assert.ok(restored);const j=enemyById(restored,'first-judge');for(let i=0;i<10;i++)tick(restored,.05);assert.equal(j.attackIndex,2);assert.equal(j.mark.shape,'lane');for(let i=0;i<30;i++)tick(restored,.05);assert.ok(j.recovery>1.5);assert.ok(validSave(restored));
});
test('old active and cached campaign enemies keep their damage proportions on upgrade',()=>{
 const s=late('forge');enemyById(s,'bailiff').hp=370;travel(s,'fen');enemyById(s,'archivist').hp=530;enemyById(s,'archive-watch-a').dead=true;enemyById(s,'archive-watch-a').hp=0;s.encounterVersion=2;const m=memory();save(m,s);const restored=load(m);assert.ok(restored);assert.equal(restored.encounterVersion,3);assert.equal(enemyById(restored,'archivist').hp,800);assert.equal(restored.regions.forge.enemies.find(e=>e.id==='bailiff').hp,550);assert.ok(enemyById(restored,'archive-watch-a').dead);assert.ok(validSave(restored));
});
test('fully upgraded passive steel cannot defeat any of the three rotating echoes',()=>{
 for(let trial=0;trial<3;trial++){const s=late(),e=enemyById(s,'first-judge');s.player.level=20;s.talents={steel:7,resolve:7,flame:5};s.bag.push('remembrance','accord');s.gear={weapon:'remembrance',armor:'accord'};s.campaign.echoActive=true;s.campaign.echoes=trial;s.player.hp=stats(s).maxHp;Object.assign(s.player,{x:e.x-77,y:e.y});selectTarget(s,e.id);for(let i=0;i<2400&&s.mode==='playing'&&!e.dead;i++)tick(s,.05);assert.equal(s.mode,'fallen',`trial ${trial}`);assert.equal(e.dead,false);}
});
test('Kargan and Torin move to reachable chapter exits and the objective follows them',()=>{
 for(const [zone,boss,id] of [['forge','bailiff','kargan'],['fen','archivist','torin']]){const s=late(zone);s.campaign[zone==='forge'?'forgeChoice':'archiveChoice']='';const e=enemyById(s,boss);e.dead=true;e.hp=0;const n=people(s).find(n=>n.id===id);assert.ok(n.x>2200);assert.equal(blocked(n.x,n.y,14,zone),false);assert.ok(pathTo(e,n,zone).length);assert.equal(objective(s).target.x,n.x);Object.assign(s.player,{x:n.x,y:n.y});assert.ok(talk(s,id));assert.ok(dialogue(s,id).choices.some(c=>c.id=== (zone==='forge'?'forge-workers':'archive-publish')));}
});
test('retraining refunds spent talents once and a second weapon is bought once',()=>{
 const s=late();s.talents={steel:7,resolve:6,flame:1};s.player.coins=140;const npc=people(s).find(n=>n.id==='sable-citadel');Object.assign(s.player,{x:npc.x,y:npc.y});talk(s,npc.id);assert.ok(choose(s,'retrain'));assert.equal(s.points,14);assert.equal(s.player.coins,100);assert.deepEqual(s.talents,{steel:0,resolve:0,flame:0});talk(s,npc.id);assert.equal(choose(s,'retrain'),false);s.dialogue=null;travel(s,'forge');s.campaign.temper='forged';s.bag.push('forged');const edda=people(s).find(n=>n.id==='edda');Object.assign(s.player,{x:edda.x,y:edda.y});talk(s,'edda');assert.ok(choose(s,'forge-second'));assert.ok(s.bag.includes('focus'));assert.equal(s.player.coins,0);talk(s,'edda');assert.equal(choose(s,'forge-second'),false);assert.ok(validSave(s));
});

test('explorers can deliver a recovered banner or flowers on the first conversation',()=>{const s=late('forge');const captain=enemyById(s,'red-captain');captain.dead=true;captain.hp=0;s.collected.push('oryn-banner');let n=people(s).find(n=>n.id==='garen');Object.assign(s.player,{x:n.x,y:n.y});talk(s,'garen');assert.ok(choose(s,'oryn-mercy'));assert.ok(s.campaign.orynStarted);assert.equal(s.campaign.oryn,'mercy');travel(s,'fen');s.collected.push('moon-a','moon-b','moon-c');n=people(s).find(n=>n.id==='elara');Object.assign(s.player,{x:n.x,y:n.y});talk(s,'elara');assert.ok(choose(s,'syla-reward'));assert.ok(s.campaign.sylaStarted);assert.ok(s.bag.includes('moonveil'));assert.ok(validSave(s));});
