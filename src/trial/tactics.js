import { DIRS, GATE, same, distance, key, tileAt, unitAt, living, log } from './scenario.js';

export function walkable(s, t) {
  const tile=tileAt(s,t);
  return !!tile && tile.terrain!=='water' && tile.terrain!=='rock' && (!same(t,GATE)||s.gateOpen);
}
export function paths(s,u,budget=u.move) {
  const found=new Map([[key(u),[]]]), queue=[{q:u.q,r:u.r}];
  while(queue.length) {
    const p=queue.shift(), path=found.get(key(p));
    if(path.length>=budget) continue;
    for(const [dq,dr] of DIRS) {
      const t={q:p.q+dq,r:p.r+dr};
      if(found.has(key(t))||!walkable(s,t)) continue;
      const occupant=unitAt(s,t);
      if(occupant && (u.side!=='ally' || (occupant.side!=='ally' && !(occupant.side==='house'&&!s.hostile)))) continue;
      found.set(key(t),[...path,t]); queue.push(t);
    }
  }
  for(const [k,path] of found) if(path.length && unitAt(s,path.at(-1))) found.delete(k);
  found.delete(key(u));
  return found;
}
export function lineClear(s,a,b) {
  const n=distance(a,b);
  for(let i=1;i<n;i++) {
    const f=i/n, fq=a.q+(b.q-a.q)*f, fr=a.r+(b.r-a.r)*f;
    let q=Math.round(fq),r=Math.round(fr),z=Math.round(-fq-fr);
    const dq=Math.abs(q-fq),dr=Math.abs(r-fr),dz=Math.abs(z+fq+fr);
    if(dq>dr && dq>dz) q=-r-z; else if(dr>dz) r=-q-z;
    if(tileAt(s,{q,r})?.terrain==='rock') return false;
  }
  return true;
}
export const inRange = (s,a,b) => distance(a,b)<=a.range && lineClear(s,a,b);
export function damage(s,a,b,bonus=0) {
  const cover=tileAt(s,b)?.terrain==='forest' ? 1 : 0;
  return Math.max(1,a.atk+bonus-cover-(b.guarding?2:0));
}
export function forecast(s,a,b) {
  if(!a||!b||a.side===b.side||!inRange(s,a,b)) return null;
  const hit=damage(s,a,b), counter=b.hp>hit && inRange(s,b,a) ? damage(s,b,a) : 0;
  return {hit,counter,lethal:hit>=b.hp};
}
export function attack(s,a,b) {
  const f=forecast(s,a,b);
  if(!f) return false;
  b.hp=Math.max(0,b.hp-f.hit); a.hp=Math.max(0,a.hp-f.counter);
  a.moved=true; a.acted=true;
  log(s,`${a.name} → ${b.name}: ${f.hit} damage${f.counter?`, ${f.counter} in return`:''}.${b.hp===0?` ${b.name} falls.`:''}${a.hp===0?` ${a.name} falls.`:''}`);
  return true;
}
export function enemies(s) { return living(s).filter(u => u.side==='arbiter'||(u.side==='house'&&s.hostile)); }

// Intent targets a tile, not a homing unit. Moving away can evade a telegraphed strike.
export function planEnemies(s) {
  const allies=living(s).filter(u=>u.side==='ally');
  s.intents=[];
  for(const u of enemies(s)) {
    const target=[...allies].sort((a,b)=>distance(u,a)-distance(u,b)||a.hp-b.hp||a.id.localeCompare(b.id))[0];
    if(!target) continue;
    let to={q:u.q,r:u.r}, path=[];
    if(!inRange(s,u,target)) {
      const candidates=[...paths(s,u)].map(([,p])=>({p,t:p.at(-1)}));
      // A full distance field avoids getting stuck behind a detour.
      const field=new Map([[key(target),0]]), queue=[{q:target.q,r:target.r}];
      while(queue.length) {
        const t=queue.shift();
        for(const [dq,dr] of DIRS) {
          const n={q:t.q+dq,r:t.r+dr};
          if(field.has(key(n))||!walkable(s,n)) continue;
          field.set(key(n),field.get(key(t))+1); queue.push(n);
        }
      }
      candidates.sort((a,b)=>(field.get(key(a.t))??999)-(field.get(key(b.t))??999)||a.p.length-b.p.length);
      if(candidates[0]) {to=candidates[0].t;path=candidates[0].p;}
    }
    const projected={...u,...to};
    s.intents.push({id:u.id,from:{q:u.q,r:u.r},to,path,target:inRange(s,projected,target)?{q:target.q,r:target.r}:null});
  }
}
export function enemyPhase(s) {
  for(const intent of s.intents) {
    const u=living(s).find(x=>x.id===intent.id);
    if(!u) continue;
    for(const t of intent.path) {
      if(!walkable(s,t)||unitAt(s,t)) break;
      u.q=t.q;u.r=t.r;
    }
    const target=intent.target && unitAt(s,intent.target);
    if(target?.side==='ally' && inRange(s,u,target)) attack(s,u,target);
    else if(intent.target) log(s,`${u.name}'s strike finds an empty position.`);
    if(!living(s).some(x=>x.id==='ash')) break;
  }
}
