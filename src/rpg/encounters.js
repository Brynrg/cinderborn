import {FOES,dist,ECHO_TRIALS} from './data.js';
import {bossBound} from './campaign-story.js';
import {inDanger} from './telegraphs.js';
export const isBoss=e=>FOES[e.type].kind==='boss';
export const isCampaignBoss=e=>['bailiff','captain','archivist','judge'].includes(e.type);
export function damageMultiplier(e){return isBoss(e)?e.recovery>0?1.5:.4:1;}
export function attackPlan(e,p,echo=false,echoes=0){
 const sweep=(e.attackIndex||0)%2===0,arbiter=e.type==='commander'||e.type==='judge',def=FOES[e.type],range=dist(e,p);
 const mark={x:sweep&&range<220?e.x:p.x,y:sweep&&range<220?e.y:p.y,r:sweep?(arbiter?150:130):(arbiter?90:75),shape:'circle',
  name:sweep?(def.sweep||(arbiter?'Iron sweep':'Wardbreak')):(def.blast||(arbiter?'Judgment':'Cinder eruption')),
  hint:sweep&&range<220?'Back away from the boss':'Leave the marked ground',duration:echo||arbiter&&e.hp<def.hp/2?1:1.25};
 const lane=()=>Object.assign(mark,{x:e.x,y:e.y,r:30,length:520,angle:Math.atan2(p.y-e.y,p.x-e.x),shape:'lane',hint:'Sidestep the marked lane'});
 const ring=()=>Object.assign(mark,{x:e.x,y:e.y,r:210,inner:62,shape:'ring',hint:'Step close to the boss, inside the ring',duration:1.4});
 if(e.type==='bailiff'&&sweep){lane();mark.name='Furnace surge';}
 if(e.type==='archivist'&&sweep&&range<260){ring();mark.name='Hollow tide';}
 if(e.type==='judge'){
  const shape=echo?ECHO_TRIALS[echoes%3].pattern[sweep?0:1]:sweep?'circle':'lane';
  if(shape==='lane')lane();if(shape==='ring')ring();
  mark.name=`${shape==='ring'?'Hollow crown':shape==='lane'?'Sentence of fire':'Crownfall'} · ${sweep?'1':'2'}/2`;
  if(sweep)mark.hint+=' · a second strike follows';
 }
 return mark;
}
export function combatReadout(s,e){
 if(!e||e.dead)return null;
 const ward=bossBound(s,e);if(ward)return {tone:'guarded',title:'Bound to the houses',text:ward,progress:0};
 if(e.windup>0&&e.mark)return {tone:'danger',title:e.mark.name||'Incoming strike',text:`${FOES[e.type].name} · ${inDanger(s.player,e.mark)?(e.mark.hint||'Leave the red circle'):'You are clear'} · ${e.windup.toFixed(1)}s`,progress:e.windup/(e.mark.duration||.65)};
 if(isBoss(e)&&e.recovery>0)return {tone:'opening',title:'Opening — strike now',text:`${FOES[e.type].name} · +50% damage · ${e.recovery.toFixed(1)}s`,progress:e.recovery/2.4};
 if(e.type==='judge'&&(e.attackIndex||0)%2===1)return {tone:'danger',title:'Second strike coming',text:'Keep moving. The opening comes after both strikes.',progress:0};
 if(isBoss(e))return {tone:'guarded',title:(e.type==='commander'||e.type==='judge')&&(e.hp<FOES[e.type].hp/2||s.campaign?.echoActive)?'Enraged · quicker attacks':'Guard raised',text:`${FOES[e.type].name} · ${e.type==='judge'?'Evade both strikes, then punish the opening.':'Evade, then attack the opening.'}`,progress:0};
 return null;
}
export function threat(s){
 const priority=e=>e.mark&&inDanger(s.player,e.mark)?0:e.id===s.target?1:2;
 return s.enemies.filter(e=>!e.dead&&e.aggro&&(isBoss(e)||e.windup>0)&&dist(e,s.player)<550).sort((a,b)=>priority(a)-priority(b)||(priority(a)===0?a.windup-b.windup:dist(a,s.player)-dist(b,s.player)))[0];
}
