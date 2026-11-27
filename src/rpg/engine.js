import {FOES,SKILLS,CAMP,dist,stats,clamp,enemyById,skillCost,skillCooldown,potionHeal} from './data.js';
import {isBoss,damageMultiplier,attackPlan} from './encounters.js';
import {move,pathTo} from './world.js';
import {gainXP,giveItem,notice,effect} from './state.js';
export const alive=s=>s.enemies.filter(e=>!e.dead);
export function selectTarget(s,id){const e=enemyById(s,id);if(!e||e.dead)return;s.target=id;s.auto=true;s.path=[];}
export function navigate(s,p){s.path=pathTo(s.player,p);s.auto=false;if(!s.path.length)notice(s,'That ground cannot be reached. Try the road or a bridge.');}
export function nearestEnemy(s,range=440){return alive(s).filter(e=>dist(e,s.player)<range).sort((a,b)=>dist(a,s.player)-dist(b,s.player))[0];}
export function cycleTarget(s){const near=alive(s).filter(e=>dist(e,s.player)<500).sort((a,b)=>dist(a,s.player)-dist(b,s.player));if(near.length){s.target=near[(near.findIndex(e=>e.id===s.target)+1)%near.length].id;s.auto=false;}}
function kill(s,e){
 e.dead=true;e.hp=0;e.recovery=0;e.aggro=false;e.windup=0;e.mark=null;e.respawn=s.time+45;s.kills++;
 const def=FOES[e.type];s.player.coins+=def.coins;gainXP(s,def.xp);effect(s,e.x,e.y-15,`+${def.xp} XP · ${def.coins} crowns`,'#e8ce82');
 if(s.target===e.id){s.target=null;s.auto=false;s.path=[];}
 if(s.quests.bounty&&['wolf','raider'].includes(e.type))s.quests.bountyKills=Math.min(3,s.quests.bountyKills+1);
 if(e.id==='seal-warden'){giveItem(s,'aegis');notice(s,'The northern seal is unwarded.','gold');}
 if(e.id==='arbiter')notice(s,'The Conclave road is open.','gold');
 if(e.id==='hollowfang')notice(s,'Hollowfang falls. The caravan cache is unguarded.','gold');
}
function hitEnemy(s,e,amount,fire=false){if(!e||e.dead)return;amount=Math.round(amount*damageMultiplier(e));e.hp-=amount;e.aggro=true;s.combat=4;effect(s,e.x,e.y-35,String(amount),fire?'#ffac63':'#fff0cb');if(e.hp<=0)kill(s,e);}
function hurt(s,amount){if(s.player.dash>0)return;s.player.hp=Math.max(0,s.player.hp-amount);s.combat=5;effect(s,s.player.x,s.player.y-35,`−${amount}`,'#ff8c7c');if(s.player.hp<=0){s.mode='fallen';s.auto=false;s.path=[];notice(s,'Ash has fallen. Iona can bring you back to the last hearth.');}}
export function cast(s,id){
 if(s.mode!=='playing'||s.dialogue)return false;
 const p=s.player;if(s.cooldowns[id]>0)return false;
 if(id==='potion'){
  if(!p.potions||p.hp>=stats(s).maxHp)return false;p.potions--;p.hp=Math.min(stats(s).maxHp,p.hp+potionHeal(s));s.cooldowns.potion=8;effect(s,p.x,p.y-35,`+${potionHeal(s)}`,'#bde0ad');return true;
 }
 const skill=SKILLS.find(k=>k.id===id);if(!skill||p.energy<skillCost(s,id)){notice(s,'Not enough focus. It regenerates while you fight.');return false;}
 let e=enemyById(s,s.target);if(!e||e.dead||(id==='slash'&&dist(p,e)>90))e=nearestEnemy(s,id==='slash'?90:440);
 if(id==='slash'||id==='fire'){
  const range=id==='slash'?90:440;
  if(!e||dist(p,e)>range){if(id==='fire')notice(s,'Select an enemy within Firebrand range.');return false;}
  p.face=Math.atan2(e.y-p.y,e.x-p.x);s.target=e.id;
  if(id==='fire'){s.heat=Math.min(100,s.heat+18);s.effects.push({kind:'beam',x:p.x,y:p.y,tx:e.x,ty:e.y,life:.25,total:.25});}
  else s.effects.push({kind:'slash',x:p.x,y:p.y,angle:p.face,life:.18,total:.18});
  hitEnemy(s,e,id==='fire'?stats(s).fire:stats(s).atk,id==='fire');
 }
 if(id==='mend'){if(p.hp>=stats(s).maxHp)return false;const n=38+(s.quests.herbsDone?10:0);p.hp=Math.min(stats(s).maxHp,p.hp+n);effect(s,p.x,p.y-35,`+${n}`,'#bde0ad');}
 if(id==='dash'){p.dash=.24;s.path=[];s.auto=false;}
 p.energy-=skillCost(s,id);s.cooldowns[id]=skillCooldown(s,id);return true;
}
function toward(u,p,speed,dt){const d=dist(u,p);if(d<3)return true;const n=Math.min(speed*dt,d);move(u,(p.x-u.x)/d*n,(p.y-u.y)/d*n);return d<speed*dt+3;}
function updateEnemy(s,e,dt){
 const def=FOES[e.type],p=s.player;
 if(e.dead){if(['wolf','raider'].includes(e.type)&&s.time>e.respawn&&dist(p,{x:e.homeX,y:e.homeY})>550){e.dead=false;e.hp=def.hp;e.x=e.homeX;e.y=e.homeY;e.wait=1;}return;}
 e.wait=Math.max(0,e.wait-dt);e.recovery=Math.max(0,(e.recovery||0)-dt);
 if(dist(e,p)<(def.kind==='boss'?260:210)&&dist(p,CAMP)>240)e.aggro=true;
 if(!e.aggro)return;
 if(dist(p,{x:e.homeX,y:e.homeY})>470||dist(p,CAMP)<230){e.aggro=false;e.windup=0;e.mark=null;e.recovery=0;e.attackIndex=0;e.hp=def.hp;e.x=e.homeX;e.y=e.homeY;return;}
 s.combat=Math.max(s.combat,1);
 if(e.windup>0){
  e.windup=Math.max(0,e.windup-dt);if(e.windup<=0){if(e.mark&&dist(p,e.mark)<e.mark.r+12)hurt(s,def.atk+(e.type==='commander'&&e.hp<def.hp/2?14:0));s.effects.push({kind:'impact',...e.mark,life:.3,total:.3});e.mark=null;e.recovery=isBoss(e)?2.4:0;e.wait=isBoss(e)?2.4:1.25;}return;
 }
 if(e.recovery>0)return;
 const range=def.range;
 if(dist(e,p)>range*.8)toward(e,p,def.speed*(e.type==='commander'&&e.hp<def.hp/2?1.3:1),dt);
 if(dist(e,p)<=range&&!e.wait){
  const boss=isBoss(e);e.mark=boss?attackPlan(e,p):{x:p.x,y:p.y,r:48};e.windup=boss?e.mark.duration:.65;e.attackIndex=(e.attackIndex||0)+1;
 }
}
export function tick(s,dt,input={}){
 if(s.mode!=='playing'||s.dialogue)return;
 dt=Math.min(.05,dt);s.time+=dt;const p=s.player;
 for(const k of Object.keys(s.cooldowns))s.cooldowns[k]=Math.max(0,s.cooldowns[k]-dt);
 s.combat=Math.max(0,s.combat-dt);p.energy=Math.min(80,p.energy+dt*7);
 if(!s.combat){p.hp=Math.min(stats(s).maxHp,p.hp+dt*3);s.heat=Math.max(0,s.heat-dt*3);}
 if(s.heat>=60&&!s.heatSpawned){s.heatSpawned=true;notice(s,'Your fire is exposed. Nearby judges sense you from farther away.','danger');}
 if(s.heat<30)s.heatSpawned=false;
 const dx=(input.right?1:0)-(input.left?1:0),dy=(input.down?1:0)-(input.up?1:0);
 if(dx||dy){p.face=Math.atan2(dy,dx);s.path=[];s.auto=false;}
 if(p.dash>0){move(p,Math.cos(p.face)*670*dt,Math.sin(p.face)*670*dt);p.dash=Math.max(0,p.dash-dt);}
 else if(dx||dy){const n=Math.hypot(dx,dy);move(p,dx/n*190*dt,dy/n*190*dt);}
 else if(s.auto){const e=enemyById(s,s.target);if(e&&!e.dead){p.face=Math.atan2(e.y-p.y,e.x-p.x);if(dist(p,e)>77){if(!s.path.length)s.path=pathTo(p,e);if(s.path[0]&&toward(p,s.path[0],190,dt))s.path.shift();}else{s.path=[];cast(s,'slash');}}}
 else if(s.path.length){const next=s.path[0];p.face=Math.atan2(next.y-p.y,next.x-p.x);if(toward(p,next,190,dt))s.path.shift();}
 if(input.attack)cast(s,'slash');
 for(const e of s.enemies){if(s.heat>=60&&['jailer','commander','warden'].includes(e.type)&&dist(e,p)<360)e.aggro=true;updateEnemy(s,e,dt);if(s.mode==='fallen')break;}
 for(const f of s.effects)f.life-=dt;s.effects=s.effects.filter(f=>f.life>0);s.notices=s.notices.filter(n=>n.until>s.time);
}
