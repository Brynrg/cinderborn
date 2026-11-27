import assert from 'node:assert/strict';
import {clearance,inDanger} from '../../src/rpg/telegraphs.js';
import {blocked} from '../../src/rpg/world.js';
export const game=page=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
export const advance=(page,ms)=>page.evaluate(ms=>window.advanceTime(ms),ms);
export const ui=(page,id)=>page.locator(`[data-ui="${id}"]`).first().click();
export async function mapWalk(page,to){
 const s=await game(page);if(s.screen!=='map')await ui(page,'map');
 const point=await page.locator('#world-map').evaluate((el,to)=>{const p=new DOMPoint(to.x,to.y).matrixTransform(el.getScreenCTM());return {x:p.x,y:p.y};},to);
 await page.mouse.click(point.x,point.y);
}
export async function fight(page,id){
 let s=await game(page),e=s.enemies.find(e=>e.id===id);if(!e||e.dead)return;
 const {cx,cy,w,h,scale}=s.camera,x=(e.x-cx)*scale+w/2,y=(e.y-cy)*scale+h/2;
 await page.locator('#world').click({position:{x,y}});
 s=await game(page);e=s.enemies.find(e=>e.id===id);if(e?.dead)return;assert.equal(s.target,id,`target ${id}`);
 for(let i=0;i<240;i++){
  s=await game(page);e=s.enemies.find(e=>e.id===id);if(!e||e.dead)return;
  assert.notEqual(s.mode,'fallen',`fell fighting ${id}`);
  if(s.player.hp<s.player.maxHp*.65)await page.keyboard.press('Digit3');
  if(s.player.hp<s.player.maxHp*.35)await page.keyboard.press('KeyQ');
  if(s.zone!=='march'&&s.campaign?.archiveChoice&&e.mark&&s.player.hp<s.player.maxHp*.5&&!s.cooldowns.aegis&&s.player.energy>=28)await page.keyboard.press('Digit6');
  const boss=e.kind==='boss'||['warden','commander'].includes(e.type);if(boss&&page.captureCombat)await page.captureCombat(s,e);
  if(boss&&e.mark&&inDanger(s.player,e.mark,20)){
   const options=[['KeyD',1,0],['KeyA',-1,0],['KeyS',0,1],['KeyW',0,-1]].map(([key,dx,dy])=>{let score=-Infinity;for(let d=8;d<=160;d+=8){const p={x:s.player.x+dx*d,y:s.player.y+dy*d};if(blocked(p.x,p.y,14,s.zone))break;score=Math.max(score,clearance(p,e.mark,20));}return {key,score};}).sort((a,b)=>b.score-a.score),key=options[0].key;
   await page.keyboard.down(key);if(e.mark.shape!=='ring'&&!s.cooldowns.dash&&s.player.energy>=12)await page.keyboard.press('Digit4');await advance(page,250);await page.keyboard.up(key);continue;
  }
  if(!s.auto&&!e.mark){const v=s.camera;await page.locator('#world').click({position:{x:(e.x-v.cx)*v.scale+v.w/2,y:(e.y-v.cy)*v.scale+v.h/2}});}
  if(s.campaign?.forgeChoice&&!s.cooldowns.nova&&s.player.energy>=55&&Math.hypot(e.x-s.player.x,e.y-s.player.y)<200&&(boss?e.recovery>0:s.enemies.filter(a=>!a.dead&&Math.hypot(a.x-s.player.x,a.y-s.player.y)<220).length>=2))await page.keyboard.press('Digit5');
  if(!s.cooldowns.fire&&s.player.energy>=18&&(!boss||e.recovery>0))await page.keyboard.press('Digit2');
  await advance(page,300);
 }
 throw new Error(`Combat stalled on ${id}: ${JSON.stringify(await game(page))}`);
}
export async function go(page,to,{combat=true}={}){
 await mapWalk(page,to);
 for(let i=0;i<200;i++){
  const s=await game(page);assert.equal(s.mode,'playing');
  if(Math.hypot(s.player.x-to.x,s.player.y-to.y)<48)return;
  const e=s.enemies.filter(e=>!e.dead&&e.aggro&&Math.hypot(e.x-s.player.x,e.y-s.player.y)<220).sort((a,b)=>Math.hypot(a.x-s.player.x,a.y-s.player.y)-Math.hypot(b.x-s.player.x,b.y-s.player.y))[0];
  if(combat&&e){await fight(page,e.id);await mapWalk(page,to);}else await advance(page,300);
 }
 throw new Error(`Travel stalled to ${JSON.stringify(to)}: ${JSON.stringify(await game(page))}`);
}
export async function speak(page,id,choice){
 const s=await game(page),n=s.npcs.find(n=>n.id===id);assert.ok(n,`visible NPC ${id}`);
 await go(page,n);await page.keyboard.press('KeyE');assert.equal((await game(page)).dialogue,id);
 await ui(page,'choice:'+choice);
}
export async function develop(page,build='steel'){
 let s=await game(page);if(!s.points&&!s.bag.some(id=>['iron','aegis','ranger','cinder'].includes(id)))return;
 await ui(page,'character');
 for(const id of ['iron','ranger','aegis','cinder']){s=await game(page);if(s.bag.includes(id)&&!Object.values(s.gear).includes(id))await ui(page,'equip:'+id);}
 while((await game(page)).points){s=await game(page);const id=(build==='fire'?['flame','resolve','steel']:['steel','resolve','flame']).find(k=>s.talents[k]<(s.zone==='march'?3:7));if(!id)break;await ui(page,'talent:'+id);}
 await ui(page,'close');
}
export async function storyRoute(page,route='oath',capture=async()=>{}){
 await speak(page,'rook','begin');await speak(page,'rook','bounty');await speak(page,'iona','herbs');
 for(const n of [{x:670,y:1070},{x:850,y:990},{x:740,y:1230}]){await go(page,n);await page.keyboard.press('KeyE');}
 await speak(page,'iona','herbs-reward');let s=await game(page);
 if(s.quests.bountyKills>=3)await speak(page,'rook','bounty-reward');
 if((await game(page)).player.coins>=30)await speak(page,'sable','buy-iron');await develop(page);await capture('camp');
 await go(page,{x:1450,y:890});await page.keyboard.press('KeyE');
 await go(page,{x:1460,y:730});await page.keyboard.press('KeyE');await capture('bargain');await ui(page,'choice:'+(route==='oath'?'oath':'defy'));await capture('choice');
 if(route==='oath'){
  await go(page,{x:1420,y:340});await fight(page,'north-jailer');await speak(page,'mara','free-mara');await develop(page);
  await go(page,{x:1810,y:1280});await fight(page,'south-jailer');await speak(page,'brann','free-brann');
 }else{await go(page,{x:2120,y:410});await fight(page,'seal-warden');await go(page,{x:2120,y:310});await page.keyboard.press('KeyE');}
 await develop(page);await capture('progression');
 await go(page,{x:1450,y:890});await page.keyboard.press('KeyE');
 await go(page,{x:2260,y:890});await fight(page,'arbiter');await go(page,{x:2410,y:900});await page.keyboard.press('KeyE');
 s=await game(page);assert.equal(s.quests.complete,true);assert.equal(s.dialogue,'ending');await capture('ending');return s;
}
