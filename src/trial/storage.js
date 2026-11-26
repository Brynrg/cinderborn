import { createTrial, ROLES, key } from './scenario.js';
export const SAVE_KEY='cinderborn-causeway-v1';
const base=createTrial(), terrain=new Map(base.tiles.map(t=>[key(t),t.terrain]));
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const coord=t=>!!t&&integer(t.q,-4,4)&&integer(t.r,-4,4)&&terrain.has(key(t));
const text=t=>typeof t==='string'&&t.length<=1000;
const bools=(obj,keys)=>keys.every(k=>typeof obj[k]==='boolean');
const ids=new Set([...base.units.map(u=>u.id),'mara','brann','arbiter-0','arbiter-1']);
export function validSave(s) {
  if(!s || s.version!==1 || s.scenario!=='ashen-causeway' || !['playing','won','lost'].includes(s.phase))return false;
  if(!integer(s.round,1,12)||!integer(s.embers,0,4)||!integer(s.suspicion,0,100)||!integer(s.actions,0,10000))return false;
  if(!bools(s,['hostile','exposed','gateOpen','seal','powerUsed','oath','inspectionArrived'])||![6,8].includes(s.inspectionRound)||!['none','sworn','declined'].includes(s.bargain))return false;
  if(!Array.isArray(s.units)||s.units.length<10||s.units.length>14||!s.units.some(u=>u?.id==='ash'))return false;
  if(new Set(s.units.map(u=>u?.id)).size!==s.units.length||!s.units.some(u=>u.id===s.selected))return false;
  if(!s.units.every(u=>u&&ids.has(u.id)&&text(u.name)&&ROLES[u.role]&&['ally','house','arbiter'].includes(u.side)&&coord(u)
    &&integer(u.maxHp,1,30)&&integer(u.hp,0,u.maxHp)&&integer(u.atk,1,10)&&integer(u.range,1,3)&&integer(u.move,1,3)
    &&bools(u,['moved','acted','guarding','reserve'])))return false;
  if(!Array.isArray(s.tiles)||s.tiles.length!==61||new Set(s.tiles.map(t=>t&&key(t))).size!==61||!s.tiles.every(t=>coord(t)&&terrain.get(key(t))===t.terrain))return false;
  if(!Array.isArray(s.captives)||s.captives.length!==2||!base.captives.every(c=>s.captives.some(x=>x&&x.id===c.id&&x.name===c.name&&x.role===c.role&&x.jailer===c.jailer&&x.q===c.q&&x.r===c.r&&typeof x.freed==='boolean'&&(!x.freed||s.units.some(u=>u.id===x.id)))))return false;
  if(!Array.isArray(s.log)||s.log.length>24||!s.log.every(e=>e&&integer(e.round,1,12)&&text(e.text)))return false;
  if(!Array.isArray(s.intents)||s.intents.length>8||!s.intents.every(i=>i&&ids.has(i.id)&&coord(i.from)&&coord(i.to)&&Array.isArray(i.path)&&i.path.length<=3&&i.path.every(coord)&&(i.target===null||coord(i.target))))return false;
  if(s.pending!==null&&(!s.pending||!['gate','bargain'].includes(s.pending.kind)||s.pending.unitId!=='ash'||s.phase!=='playing'))return false;
  if(s.undo!==null&&(!s.undo||!ids.has(s.undo.id)||!coord(s.undo.from)||typeof s.undo.from.moved!=='boolean'))return false;
  if(s.phase==='playing')return s.result===null;
  return s.pending===null&&!!s.result&&s.result.won===(s.phase==='won')&&text(s.result.reason)&&text(s.result.route)
    &&integer(s.result.round,1,12)&&integer(s.result.freed,0,2)&&integer(s.result.safe,0,2)&&integer(s.result.survivors,0,6);
}
export function load(storage) {
  try {const s=JSON.parse(storage.getItem(SAVE_KEY));return validSave(s)?s:null;}
  catch {return null;}
}
export function save(storage,state) {
  try {storage.setItem(SAVE_KEY,JSON.stringify(state));return true;}catch{return false;}
}
