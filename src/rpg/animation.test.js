import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {observeActor,actorPose} from './animation.js';
import {ART_FILES} from './art.js';

test('pack files match the pinned CC0 archive and sprite frame bounds',()=>{
 const root=new URL('../../',import.meta.url),manifest=JSON.parse(readFileSync(new URL('public/art/tiny-swords/provenance.json',root)));
 assert.equal(manifest.uploadId,'9428013');assert.equal(manifest.license,'CC0-1.0');assert.equal(manifest.files.length,ART_FILES.length);
 for(const key of ART_FILES){const f=manifest.files.find(f=>f.file===key+'.png');assert.ok(f,key);const data=readFileSync(new URL('public/art/tiny-swords/'+f.file,root));assert.equal(createHash('sha256').update(data).digest('hex'),f.sha256);assert.equal(data.readUInt32BE(16),f.width);assert.equal(data.readUInt32BE(20),f.height);if(/^(warrior|archer|pawn)-/.test(key)){assert.ok(f.width>=6*192);assert.ok(f.height>=(key.startsWith('warrior')?8:6)*192);}}
});
test('walk starts, faces movement, stops, and decorative idle freezes for reduced motion',()=>{
 let v=observeActor(null,{x:50,y:50,hp:100},0);v=observeActor(v,{x:30,y:50,hp:100},.1);assert.equal(actorPose(v,.1).action,'walk');assert.equal(actorPose(v,.1).flip,true);
 v=observeActor(v,{x:30,y:50,hp:100},.2);assert.equal(actorPose(v,.2).action,'idle');assert.equal(actorPose(v,5,{reduced:true}).col,0);
});
test('player attacks and enemy windups transition into strike frames then recover',()=>{
 let v=observeActor(null,{x:0,y:0,hp:100},0);v=observeActor(v,{x:0,y:0,hp:100},.1,{attack:.6});assert.equal(actorPose(v,.1).action,'attack');assert.equal(actorPose(v,.25).col,4);assert.equal(actorPose(v,.5).action,'idle');
 v=observeActor(v,{x:0,y:0,hp:100,windup:.2},.6);assert.equal(actorPose(v,.6,{windup:.2,duration:1.25}).action,'windup');v=observeActor(v,{x:0,y:0,hp:100,windup:0},.8);assert.equal(actorPose(v,.8).action,'attack');
});
test('damage and death are presentation events; loading an old dead enemy does not replay death',()=>{
 const u={x:0,y:0,hp:100};let v=observeActor(null,u,0);v=observeActor(v,{...u,hp:80},1);assert.equal(v.hitAt,1);assert.equal(u.hp,100);
 v=observeActor(v,{...u,hp:0,dead:true},2);assert.equal(actorPose(v,2).action,'death');assert.equal(actorPose(v,2.35).col,3);assert.equal(v.deathAt,2);
 assert.equal(observeActor(null,{...u,hp:0,dead:true},20).deathAt,-100);
});
