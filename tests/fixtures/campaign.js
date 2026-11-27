import assert from 'node:assert/strict';
import {game,advance,ui,go,fight,develop,storyRoute} from './rpg.js';
export async function settle(page){for(let i=0;i<5;i++){for(const e of (await game(page)).enemies.filter(e=>e.aggro&&!e.dead))await fight(page,e.id);await advance(page,5100);if(!(await game(page)).enemies.some(e=>e.aggro&&!e.dead))return;}}
export async function interact(page,id,choice){
 let s=await game(page),n=[...s.nodes,...s.npcs].find(n=>n.id===id);assert.ok(n,`landmark ${id} in ${s.zone}`);
 await go(page,n);s=await game(page);
 if(n.guard){await fight(page,n.guard);await go(page,n);s=await game(page);}
 if(n.kind==='rest'||n.kind==='portal')await settle(page);
 const v=s.camera;await page.locator('#world').click({position:{x:(n.x-v.cx)*v.scale+v.w/2,y:(n.y-v.cy)*v.scale+v.h/2}});
 if(choice)await ui(page,'choice:'+choice);
 else if((await game(page)).dialogue?.startsWith('lore:'))await ui(page,'choice:close');
}
async function npc(page,id,position,choice){await go(page,position);await interact(page,id,choice);}
export async function equipBest(page,build='steel'){
 await develop(page,build);let s=await game(page);await ui(page,'character');
 for(const id of [build==='fire'?'focus':'forged','ironbound','moonveil',build==='fire'?'focus':'remembrance','accord']){s=await game(page);if(s.bag.includes(id)&&!Object.values(s.gear).includes(id))await ui(page,'equip:'+id);}
 await ui(page,'close');
}
export async function campaignRoute(page,route='accord',capture=async()=>{}){
 const good=route==='accord',build=good?'steel':'fire';
 await storyRoute(page,good?'oath':'defy');await ui(page,'choice:continue-forge');assert.equal((await game(page)).zone,'forge');
 await capture('forge-arrival');await interact(page,'kargan','forge-begin');
 if(good)await npc(page,'garen',{x:1470,y:1320},'oryn-begin');
 for(const id of ['crate-a','vent-west','ore-b','vent-east','crate-c','ore-c','vent-south','crate-b','ore-a'])await interact(page,id);
 await settle(page);await ui(page,'map');await ui(page,'travel:forge-hearth');await interact(page,'edda','temper-'+(good?'forged':'focus'));await interact(page,'anja','supplies-reward');await equipBest(page,build);
 if(good){await go(page,{x:2120,y:1350});await fight(page,'red-captain');await interact(page,'oryn-banner');await npc(page,'garen',{x:1470,y:1320},'oryn-mercy');}
 await interact(page,'forge-letter');await interact(page,'forge-waystone');await capture('forge-works');
 await go(page,{x:2140,y:820});await fight(page,'bailiff');await settle(page);await ui(page,'map');await ui(page,'travel:forge-hearth');
 await interact(page,'kargan','forge-'+(good?'workers':'house'));await capture('forge-complete');await equipBest(page,build);
 await interact(page,'forge-fen');assert.equal((await game(page)).zone,'fen');await capture('fen-arrival');await interact(page,'torin','fen-begin');
 for(const id of ['record-a','record-b'])await interact(page,id);
 if(good){for(const id of ['bell-low','bell-high','bell-mid','fen-reliquary'])await interact(page,id);}
 await interact(page,'record-c');await interact(page,'fen-waystone');await capture('fen-archive');
 if(good){await npc(page,'elara',{x:1540,y:1290},'syla-begin');for(const id of ['moon-c','moon-b','moon-a','fen-memory'])await interact(page,id);await npc(page,'elara',{x:1540,y:1290},'syla-reward');await settle(page);await ui(page,'map');await ui(page,'travel:fen-hearth');await interact(page,'iona-fen','medicine-reward');}
 await equipBest(page,build);await interact(page,'fen-waystone');await go(page,{x:2150,y:820});await fight(page,'archivist');await settle(page);await ui(page,'map');await ui(page,'travel:fen-hearth');await interact(page,'torin','archive-'+(good?'publish':'conceal'));await capture('fen-complete');
 await interact(page,'fen-citadel');assert.equal((await game(page)).zone,'citadel');await interact(page,'rook-citadel','close');await page.keyboard.press('Digit6');assert.ok((await game(page)).player.shield>0);await capture('citadel-arrival');
 for(const id of ['beacon-iron','beacon-oath','citadel-letter','beacon-moon'])await interact(page,id);
 await interact(page,'citadel-waystone');await equipBest(page,build);await capture('citadel-before-judge');
 await go(page,{x:2180,y:850});await fight(page,'first-judge');await interact(page,'throne');await capture('final-choice');await ui(page,'choice:ending-'+route);await capture('epilogue');
 const end=await game(page);assert.ok(end.campaign.finale);assert.equal(end.campaign.ending,route);await ui(page,'choice:close');await advance(page,1000);await page.reload();await ui(page,'continue');const restored=await game(page);assert.equal(restored.campaign.ending,route);assert.equal(restored.zone,'citadel');assert.deepEqual(restored.gear,end.gear);return restored;
}
