import {FOES,dist} from './data.js';
export const isBoss=e=>FOES[e.type].kind==='boss';
export function damageMultiplier(e){return isBoss(e)?e.recovery>0?1.5:.4:1;}
export function attackPlan(e,p){
 const sweep=(e.attackIndex||0)%2===0,arbiter=e.type==='commander';
 return {x:sweep?e.x:p.x,y:sweep?e.y:p.y,r:sweep?(arbiter?150:130):(arbiter?90:75),
  name:sweep?(arbiter?'Iron sweep':'Wardbreak'):(arbiter?'Judgment':'Cinder eruption'),
  hint:sweep?'Back away from the boss':'Leave the marked ground',duration:arbiter&&e.hp<FOES[e.type].hp/2?1:1.25};
}
export function combatReadout(s,e){
 if(!e||e.dead)return null;
 if(e.windup>0&&e.mark)return {tone:'danger',title:e.mark.name||'Incoming strike',text:`${e.mark.hint||'Leave the red circle'} · ${e.windup.toFixed(1)}s`,progress:e.windup/(e.mark.duration||.65)};
 if(isBoss(e)&&e.recovery>0)return {tone:'opening',title:'Opening — strike now',text:`+50% damage · ${e.recovery.toFixed(1)}s`,progress:e.recovery/2.4};
 if(isBoss(e))return {tone:'guarded',title:e.type==='commander'&&e.hp<FOES[e.type].hp/2?'Enraged · quicker attacks':'Guard raised',text:'Reduced damage. Evade the attack, then punish the opening.',progress:0};
 return null;
}
export function threat(s){return s.enemies.filter(e=>!e.dead&&e.aggro&&(isBoss(e)||e.windup>0)&&dist(e,s.player)<450).sort((a,b)=>(a.windup>0?-1:0)-(b.windup>0?-1:0)||dist(a,s.player)-dist(b,s.player))[0];}
