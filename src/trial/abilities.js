import { living, distance, log } from './scenario.js';
import { inRange, damage } from './tactics.js';

export const TECHNIQUES={
  shield:{id:'bulwark',name:'Bulwark',detail:'Guard yourself and adjacent allies: −2 damage until next round.',range:1},
  bow:{id:'pin',name:'Pinning shot',detail:'Deal 1 less damage, no retaliation. Cancel the target’s movement this round; its declared strike remains.',range:3},
  healer:{id:'fieldaid',name:'Field dressing',detail:'Heal an ally for 4 HP from up to 3 hexes. Save Bandage for close wounds.',range:3},
};
export function techniquePreview(s,u,target) {
  const skill=TECHNIQUES[u?.role];if(!skill||u.acted||!u.charges)return null;
  if(skill.id==='bulwark')return {text:'Guard the marked allies · −2 incoming damage',targets:living(s).filter(t=>t.side==='ally'&&distance(u,t)<=1).map(t=>t.id)};
  if(!target)return null;
  if(skill.id==='pin'&&target.side!=='ally'&&inRange(s,u,target)){
    const hit=Math.min(target.hp,Math.max(1,damage(s,u,target)-1));
    return {hit,text:`${hit} damage · no return · movement stopped`,targets:[target.id]};
  }
  if(skill.id==='fieldaid'&&target.side==='ally'&&distance(u,target)<=3&&target.hp<target.maxHp){
    const heal=Math.min(4,target.maxHp-target.hp);return {heal,text:`Heal ${heal} HP · ${target.hp} → ${target.hp+heal}`,targets:[target.id]};
  }
  return null;
}
export function useTechnique(s,u,target) {
  const preview=techniquePreview(s,u,target);if(!preview)return false;
  const skill=TECHNIQUES[u.role];
  if(skill.id==='bulwark')for(const ally of living(s).filter(t=>preview.targets.includes(t.id)))ally.guarding=true;
  if(skill.id==='pin'){
    target.hp-=preview.hit;
    const intent=s.intents.find(i=>i.id===target.id);
    if(intent){intent.path=[];intent.to={q:target.q,r:target.r};}
    target.pinned=true;
  }
  if(skill.id==='fieldaid')target.hp+=preview.heal;
  u.charges--;u.moved=true;u.acted=true;
  log(s,`${u.name} · ${skill.name}: ${preview.text}. ${u.charges} uses remain.`);
  return true;
}
