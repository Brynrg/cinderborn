import {CAMP,SPAWNS,FOES,ITEMS,stats,levelCost,clamp,WORLD,TALENT_CAP} from './data.js';
import {REGIONS,regionData,allNodes,newEnemies,campaignDefaults,unlocked} from './regions.js';
import {validMark} from './telegraphs.js';
const savedMaxHp=(type,version)=>version===3?FOES[type].hp:version===2?({bailiff:740,archivist:1060,judge:1600}[type]||FOES[type].hp):({warden:165,commander:235}[type]||FOES[type].hp);
export const SAVE_KEY='cinderborn-rpg-v1';
export function createGame(){return {
 version:1,encounterVersion:3,zone:'march',regions:{},campaign:campaignDefaults(),mode:'playing',time:0,player:{...CAMP,hp:100,energy:80,level:1,xp:0,coins:0,potions:3,face:0,dash:0,shield:0},
 gear:{weapon:'worn',armor:'cloak'},bag:['worn','cloak'],talents:{steel:0,flame:0,resolve:0},points:0,
 quests:{metRook:false,herbs:false,herbsDone:false,bounty:false,bountyKills:0,bountyRuns:0,oath:false,defiant:false,mara:false,brann:false,seal:false,complete:false},
 collected:[],waystones:['campfire'],checkpoint:'campfire',heat:0,heatSpawned:false,cooldowns:{slash:0,fire:0,mend:0,dash:0,potion:0,nova:0,aegis:0},
 enemies:newEnemies(),
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
export function talent(s,id){if(!Object.hasOwn(s.talents,id)||!s.points||s.talents[id]>=TALENT_CAP)return false;s.talents[id]++;s.points--;if(id==='resolve')s.player.hp+=15;return true;}
export function travel(s,zone,restId){
 if(!unlocked(s,zone)||s.enemies.some(e=>e.aggro&&!e.dead))return false;
 if(zone!==s.zone){s.regions[s.zone]={enemies:s.enemies};s.enemies=s.regions[zone]?.enemies||newEnemies(zone);delete s.regions[zone];s.zone=zone;}
 const r=regionData(zone),at=r.nodes.find(n=>n.id===(restId||r.hearth)&&n.kind==='rest')||r.camp;
 Object.assign(s.player,{x:at.x,y:at.y,dash:0,shield:0});s.path=[];s.target=null;s.auto=false;s.dialogue=null;s.effects=[];s.heat=0;s.heatSpawned=false;
 s.checkpoint=at.id||r.hearth;if(!s.waystones.includes(s.checkpoint))s.waystones.push(s.checkpoint);
 s.player.hp=stats(s).maxHp;s.player.energy=80;s.player.potions=Math.max(3,s.player.potions);
 for(const e of s.enemies){e.aggro=false;e.windup=0;e.mark=null;e.recovery=0;if(!e.dead){e.x=e.homeX;e.y=e.homeY;}}
 notice(s,`${r.chapter} · ${r.name}`,'gold');return true;
}
export function revive(s){
 const at=allNodes().find(n=>n.id===s.checkpoint);s.combat=0;for(const e of s.enemies)e.aggro=false;travel(s,at?.zone||'march',at?.id);
 s.player.coins=Math.floor(s.player.coins*.9);s.mode='playing';s.heat=0;s.deaths++;
 for(const e of s.enemies){e.attackIndex=0;if(!e.dead)e.hp=FOES[e.type].hp;}
 notice(s,'Iona pulls you back from the brink. Your quests and equipment are safe.');
}
export function snapshot(s){const out=structuredClone(s);out.path=[];out.auto=false;out.effects=[];out.notices=[];return out;}
export function save(storage,s){try{storage.setItem(SAVE_KEY,JSON.stringify(snapshot(s)));return true;}catch{return false;}}
const number=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
export function validSave(s){
 if(!s||![undefined,2,3].includes(s.encounterVersion)||s.version!==1||!['playing','fallen'].includes(s.mode)||!s.player||!s.quests||!s.gear||!s.talents||!s.cooldowns)return false;
 const p=s.player,b=createGame();
 if(!number(p.x,0,WORLD.width)||!number(p.y,0,WORLD.height)||!number(p.hp,0,1000)||!number(p.energy,0,80)||!Number.isInteger(p.level)||!number(p.level,1,20)||!number(p.xp,0,1e6)||!number(p.coins,0,1e8)||!Number.isInteger(p.potions)||!number(p.potions,0,99)||!number(p.face,-100,100)||!number(p.dash,0,.3))return false;
 if(!Array.isArray(s.bag)||s.bag.some(id=>!Object.hasOwn(ITEMS,id))||!s.bag.includes(s.gear.weapon)||!s.bag.includes(s.gear.armor)||ITEMS[s.gear.weapon]?.slot!=='weapon'||ITEMS[s.gear.armor]?.slot!=='armor')return false;
 if(!Object.keys(b.talents).every(k=>Number.isInteger(s.talents[k])&&number(s.talents[k],0,TALENT_CAP))||!Number.isInteger(s.points)||!number(s.points,0,50))return false;
 if(!Object.keys(b.quests).every(k=>typeof s.quests[k]===typeof b.quests[k]&&(typeof s.quests[k]!=='number'||number(s.quests[k],0,1e7))))return false;
 if(!['time','heat','kills','deaths','combat'].every(k=>number(s[k],0,1e9))||!Object.keys(b.cooldowns).every(k=>number(s.cooldowns[k]??(k==='nova'||k==='aegis'?0:undefined),0,15)))return false;
 const zone=s.zone||'march',c=s.campaign||campaignDefaults(),known=allNodes();
 if(!Object.hasOwn(REGIONS,zone)||!unlocked({...s,campaign:c},zone)||!number(p.shield??0,0,5))return false;
 if(!Array.isArray(s.collected)||s.collected.some(k=>!known.some(n=>n.id===k))||!Array.isArray(s.waystones)||s.waystones.some(k=>!known.some(n=>n.id===k&&n.kind==='rest'))||!s.waystones.includes(s.checkpoint))return false;
 if(!Object.entries(campaignDefaults()).every(([k,v])=>typeof c[k]===typeof v))return false;
 if(!['','workers','house'].includes(c.forgeChoice)||!['','forged','focus'].includes(c.temper)||!['','mercy','debt'].includes(c.oryn)||!['','publish','conceal'].includes(c.archiveChoice)||!['','free','crown','accord'].includes(c.ending)||!Number.isInteger(c.bellStep)||!number(c.bellStep,0,2)||!Number.isInteger(c.echoes)||!number(c.echoes,0,1e6))return false;
 const validEnemies=(enemies,id)=>Array.isArray(enemies)&&enemies.length===regionData(id).spawns.length&&regionData(id).spawns.every(([key,type])=>enemies.filter(e=>e?.id===key&&e.type===type).length===1)&&enemies.every(e=>(e.recovery===undefined||number(e.recovery,0,2.4))&&(e.attackIndex===undefined||(Number.isInteger(e.attackIndex)&&number(e.attackIndex,0,1e7)))&&number(e.x,0,WORLD.width)&&number(e.y,0,WORLD.height)&&number(e.hp,0,savedMaxHp(e.type,s.encounterVersion))&&typeof e.dead==='boolean'&&number(e.windup,0,2)&&number(e.wait,0,10)&&number(e.respawn,0,1e9)&&validMark(e.mark));
 if(!validEnemies(s.enemies,zone))return false;
 if(s.regions!==undefined&&(!s.regions||Array.isArray(s.regions)||!Object.entries(s.regions).every(([id,r])=>Object.hasOwn(REGIONS,id)&&id!==zone&&unlocked({...s,campaign:c},id)&&validEnemies(r?.enemies,id))))return false;

 return true;
}
export function load(storage){try{const s=JSON.parse(storage.getItem(SAVE_KEY));if(!validSave(s))return null;
 s.zone??='march';s.regions??={};s.campaign??=campaignDefaults();s.player.shield??=0;s.cooldowns.nova??=0;s.cooldowns.aegis??=0;if(s.encounterVersion!==3){for(const enemies of [s.enemies,...Object.values(s.regions).map(r=>r.enemies)])for(const e of enemies){if(!e.dead)e.hp=Math.round(e.hp/savedMaxHp(e.type,s.encounterVersion)*FOES[e.type].hp);}s.encounterVersion=3;}s.path=[];s.auto=false;s.target=null;s.effects=[];s.notices=[];s.dialogue=null;
 for(const [zone,enemies] of [[s.zone,s.enemies],...Object.entries(s.regions).map(([id,r])=>[id,r.enemies])])for(const e of enemies){const original=newEnemies(zone).find(a=>a.id===e.id);e.recovery=Number.isFinite(e.recovery)?clamp(e.recovery,0,2.4):0;e.attackIndex=Number.isInteger(e.attackIndex)?Math.max(0,e.attackIndex):0;e.homeX=original.homeX;e.homeY=original.homeY;}
 s.player.hp=clamp(s.player.hp,0,stats(s).maxHp);return s;
}catch{return null;}}
