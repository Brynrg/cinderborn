import { CONTRACTS, contractFor } from './contracts.js';
import { living, unitAt } from './scenario.js';
import { inRange } from './tactics.js';
import { escape } from './view.js';

export function contractCards(selected,records){
  return `<div class="contract-cards" role="group" aria-label="Choose a contract">${Object.entries(CONTRACTS).map(([id,c])=>{
    const r=records.contracts[id];
    return `<button data-action="contract:${id}" aria-pressed="${id===selected}" class="contract-card ${id===selected?'selected':''}"><span>${c.tag}</span><b>${c.name}</b><p>${c.brief}</p><small>${c.rule}</small><em>${r?`${r.wins} ${r.wins===1?'win':'wins'} · best ${r.bestRound} rounds · ${r.honors.length}/4 honors`:'Uncleared · target '+c.par+' rounds'}</em></button>`;
  }).join('')}</div>`;
}
export function enemyQueue(s){
  const intents=s.intents.filter(i=>living(s).some(u=>u.id===i.id));
  return `<div class="queue-heading"><b>AFTER YOUR BAND</b><span>${intents.length?'Enemy resolution order':s.inspectionArrived?'No active enemy orders':`Inspection in round ${s.inspectionRound}`}</span></div><div class="queue-items">${intents.length?intents.map((i,n)=>{
    const u=living(s).find(u=>u.id===i.id),target=i.target&&unitAt(s,i.target);
    const outcome=target?.side==='ally'?(inRange(s,{...u,...i.to},target)?`→ ${target.name}`:'Out of reach'):i.target?'→ marked hex':i.path.length?'Advances':'Holds';
    return `<button data-action="inspect:${u.id}" aria-label="Enemy ${n+1}: ${escape(u.name)}, ${escape(outcome)}"><b>${n+1}</b><span>${escape(u.name)}<small>${escape(outcome)}${u.pinned?' · PINNED':''}</small></span></button>`;
  }).join(''):s.hostile||s.inspectionArrived?'<p>No enemy actions planned. Advance toward your objectives.</p>':'<p>House guards are neutral. Use this time to position, bargain, or commit to fire.</p>'}</div>`;
}
export function recordSummary(s,records){
  const r=records.contracts[s.contract||'causeway'];
  return `<p class="record-summary">${contractFor(s).name}${r?` · Best: ${r.bestRound} rounds · ${r.wins} ${r.wins===1?'win':'wins'} · ${r.honors.length}/4 honors`:' · This contract has no recorded win yet.'}</p>`;
}
