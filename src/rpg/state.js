import {CAMP,SPAWNS,FOES,ITEMS,stats,levelCost,clamp,WORLD} from './data.js';
export const SAVE_KEY='cinderborn-rpg-v1';
export function createGame(){return {
 version:1,mode:'playing',time:0,player:{...CAMP,hp:100,energy:80,level:1,xp:0,coins:0,potions:3,face:0,dash:0},
 gear:{weapon:'worn',armor:'cloak'},bag:['worn','cloak'],talents:{steel:0,flame:0,resolve:0},points:0,
 quests:{metRook:false,herbs:false,herbsDone:false,bounty:false,bountyKills:0,bountyRuns:0,oath:false,defiant:false,mara:false,brann:false,seal:false,complete:false},
 collected:[],waystones:['campfire'],checkpoint:'campfire',heat:0,heatSpawned:false,cooldowns:{slash:0,fire:0,mend:0,dash:0,potion:0},
 enemies:SPAWNS.map(([id,type,x,y])=>({id,type,x,y,homeX:x,homeY:y,hp:FOES[type].hp,dead:false,respawn:0,windup:0,wait:1,mark:null,aggro:false})),
 target:null,path:[],auto:false,effects:[],notices:[],dialogue:null,kills:0,deaths:0,combat:0,
};}
export function notice(s,text,tone='info'){s.notices.unshift({text,tone,until:s.time+5});s.notices=s.notices.slice(0,4);}
export function effect(s,x,y,text,color='#f5d28a'){s.effects.push({x,y,text,color,life:1.2,total:1.2});}
export function gainXP(s,amount){
 s.player.xp+=amount;
 while(s.player.level<20&&s.player.xp>=levelCost(s.player.level)){
  s.player.xp-=levelCost(s.player.level);s.player.level++;s.points++;s.player.hp=stats(s).maxHp;s.player.energy=80;
  notice(s,`Level ${s.player.level} · a talent point is ready. Open Character (C).`,'gold');effect(s,s.player.x,s.player.y-45,'LEVEL UP','#ffdc86');
 }
}
export function giveItem(s,id){if(!s.bag.includes(id)){s.bag.push(id);notice(s,`${ITEMS[id].name} acquired · equip it in Character (C).`,'gold');}}
export function equip(s,id){if(!s.bag.includes(id)||!ITEMS[id])return false;s.gear[ITEMS[id].slot]=id;s.player.hp=Math.min(s.player.hp,stats(s).maxHp);return true;}
export function talent(s,id){if(!Object.hasOwn(s.talents,id)||!s.points||s.talents[id]>=3)return false;s.talents[id]++;s.points--;if(id==='resolve')s.player.hp+=15;return true;}
export function revive(s){
 const at=s.checkpoint==='waystone'?{x:1450,y:890}:CAMP;s.player.x=at.x;s.player.y=at.y;s.player.hp=stats(s).maxHp;s.player.energy=80;
 s.player.coins=Math.floor(s.player.coins*.9);s.player.dash=0;s.mode='playing';s.target=null;s.auto=false;s.path=[];s.combat=0;s.heat=0;s.deaths++;
 for(const e of s.enemies){e.aggro=false;e.windup=0;e.mark=null;if(!e.dead){e.x=e.homeX;e.y=e.homeY;e.hp=FOES[e.type].hp;}}
 notice(s,'Iona pulls you back from the brink. Your quests and equipment are safe.');
}
export function snapshot(s){const out=structuredClone(s);out.path=[];out.auto=false;out.effects=[];out.notices=[];return out;}
export function save(storage,s){try{storage.setItem(SAVE_KEY,JSON.stringify(snapshot(s)));return true;}catch{return false;}}
const number=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
export function validSave(s){
 if(!s||s.version!==1||!['playing','fallen'].includes(s.mode)||!s.player||!s.quests||!s.gear||!s.talents||!s.cooldowns)return false;
 const p=s.player,b=createGame();
 if(!number(p.x,0,WORLD.width)||!number(p.y,0,WORLD.height)||!number(p.hp,0,1000)||!number(p.energy,0,80)||!Number.isInteger(p.level)||!number(p.level,1,20)||!number(p.xp,0,1e6)||!number(p.coins,0,1e8)||!Number.isInteger(p.potions)||!number(p.potions,0,99)||!number(p.face,-100,100)||!number(p.dash,0,.3))return false;
 if(!Array.isArray(s.bag)||s.bag.some(id=>!Object.hasOwn(ITEMS,id))||!s.bag.includes(s.gear.weapon)||!s.bag.includes(s.gear.armor)||ITEMS[s.gear.weapon]?.slot!=='weapon'||ITEMS[s.gear.armor]?.slot!=='armor')return false;
 if(!Object.keys(b.talents).every(k=>Number.isInteger(s.talents[k])&&number(s.talents[k],0,3))||!Number.isInteger(s.points)||!number(s.points,0,50))return false;
 if(!Object.keys(b.quests).every(k=>typeof s.quests[k]===typeof b.quests[k]&&(typeof s.quests[k]!=='number'||number(s.quests[k],0,1e7))))return false;
 if(!['time','heat','kills','deaths','combat'].every(k=>number(s[k],0,1e9))||!Object.keys(b.cooldowns).every(k=>number(s.cooldowns[k],0,15)))return false;
 if(!Array.isArray(s.collected)||s.collected.some(k=>!['herb-a','herb-b','herb-c','cache'].includes(k))||!Array.isArray(s.waystones)||s.waystones.some(k=>!['campfire','waystone'].includes(k))||!s.waystones.includes(s.checkpoint))return false;
 if(!Array.isArray(s.enemies)||s.enemies.length!==SPAWNS.length||!SPAWNS.every(([id,type])=>s.enemies.filter(e=>e?.id===id&&e.type===type).length===1))return false;
 if(!s.enemies.every(e=>number(e.x,0,WORLD.width)&&number(e.y,0,WORLD.height)&&number(e.hp,0,FOES[e.type].hp)&&typeof e.dead==='boolean'&&number(e.windup,0,2)&&number(e.wait,0,10)&&number(e.respawn,0,1e9)&&(!e.mark||(number(e.mark.x,0,WORLD.width)&&number(e.mark.y,0,WORLD.height)&&number(e.mark.r,0,200)))))return false;
 return true;
}
export function load(storage){try{const s=JSON.parse(storage.getItem(SAVE_KEY));if(!validSave(s))return null;
 const base=createGame();s.path=[];s.auto=false;s.target=null;s.effects=[];s.notices=[];s.dialogue=null;
 for(const e of s.enemies){const original=base.enemies.find(a=>a.id===e.id);e.homeX=original.homeX;e.homeY=original.homeY;}
 s.player.hp=clamp(s.player.hp,0,stats(s).maxHp);return s;
}catch{return null;}}
