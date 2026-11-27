import {FOES,dist} from './data.js';
import {bossBound} from './campaign-story.js';
export const isBoss=e=>FOES[e.type].kind==='boss';
export function damageMultiplier(e){return isBoss(e)?e.recovery>0?1.5:.4:1;}
export function attackPlan(e,p,echo=false){
 const sweep=(e.attackIndex||0)%2===0,arbiter=e.type==='commander'||e.type==='judge',def=FOES[e.type];
 return {x:sweep?e.x:p.x,y:sweep?e.y:p.y,r:sweep?(arbiter?150:130):(arbiter?90:75),
  name:sweep?(def.sweep||(arbiter?'Iron sweep':'Wardbreak')):(def.blast||(arbiter?'Judgment':'Cinder eruption')),
  hint:sweep?'Back away from the boss':'Leave the marked ground',duration:echo?.85:arbiter&&e.hp<def.hp/2?(e.type==='judge'?.85:1):1.25};
}
export function combatReadout(s,e){
 if(!e||e.dead)return null;
 const ward=bossBound(s,e);if(ward)return {tone:'guarded',title:'Bound to the houses',text:ward,progress:0};
 if(e.windup>0&&e.mark)return {tone:'danger',title:e.mark.name||'Incoming strike',text:`${FOES[e.type].name} · ${dist(s.player,e.mark)<e.mark.r+12?(e.mark.hint||'Leave the red circle'):'You are clear'} · ${e.windup.toFixed(1)}s`,progress:e.windup/(e.mark.duration||.65)};
 if(isBoss(e)&&e.recovery>0)return {tone:'opening',title:'Opening — strike now',text:`${FOES[e.type].name} · +50% damage · ${e.recovery.toFixed(1)}s`,progress:e.recovery/2.4};
 if(isBoss(e))return {tone:'guarded',title:(e.type==='commander'||e.type==='judge')&&(e.hp<FOES[e.type].hp/2||s.campaign?.echoActive)?'Enraged · quicker attacks':'Guard raised',text:`${FOES[e.type].name} · Evade, then attack the opening.`,progress:0};
 return null;
}
export function threat(s){
 const priority=e=>e.mark&&dist(s.player,e.mark)<e.mark.r+12?0:e.id===s.target?1:2;
 return s.enemies.filter(e=>!e.dead&&e.aggro&&(isBoss(e)||e.windup>0)&&dist(e,s.player)<450).sort((a,b)=>priority(a)-priority(b)||(priority(a)===0?a.windup-b.windup:dist(a,s.player)-dist(b,s.player)))[0];
}
