import { ROLES, GATE, SEAL, EXIT, MAX_ROUND, living, freed, safeCaptives, distance, same, tileAt } from './scenario.js';
import { forecast } from './tactics.js';

const $=id=>document.getElementById(id);
export const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function portrait(u,large=false) {
  return `<span class="portrait ${u.role} ${large?'large':''}" aria-hidden="true"><span>${ROLES[u.role].glyph}</span></span>`;
}
function button(id,label,disabled=false,cls='') {return `<button data-action="${id}" ${disabled?'disabled':''} class="${cls}">${label}</button>`;}
export function renderPanel(s,ui) {
  const u=living(s).find(x=>x.id===s.selected),target=living(s).find(x=>x.id===ui.targetId),subject=target||u;
  $('round-number').textContent=String(s.round).padStart(2,'0');$('round-limit').textContent=`/ ${MAX_ROUND}`;
  $('seal-status').textContent=s.seal?'Seal secured':'Secure the trial seal';
  $('seal-status').classList.toggle('complete',s.seal);
  $('rescue-status').textContent=`${freed(s)} / 2 prisoners free${s.oath?' · '+safeCaptives(s).length+' at exit':''}`;
  $('inspection-status').textContent=s.inspectionArrived?'Arbiters on the field':`Inspection in ${s.inspectionRound-s.round} rounds`;
  $('inspection-status').classList.toggle('urgent',s.inspectionArrived||s.inspectionRound-s.round<=2);
  $('cover-label').textContent=s.exposed?'EXPOSED':s.hostile?'HOUSE HOSTILE':s.suspicion>=30?'UNDER SCRUTINY':'COVER INTACT';
  $('cover-value').textContent=s.exposed?`${s.suspicion} SUSPICION`:`${s.suspicion} / 50`;$('cover-fill').style.width=`${Math.min(100,s.suspicion*2)}%`;
  $('cover-meter').classList.toggle('exposed',s.exposed||s.hostile);
  $('embers').textContent=String(s.embers);$('save-status').textContent=ui.saveFailed?'Save unavailable · keep this tab open':'Saved locally';
  $('notice').textContent=ui.notice || (s.oath?'Your promise: escort both prisoners beside the exit, then extract Ash with the seal.':s.seal?'Bring Ash to the eastern exit. Rescue the prisoners if you can.':'Reach Vesper for a bargain, or take the seal from the northern shrine.');
  $('notice').classList.toggle('error',!!ui.error);
  const roster=living(s).filter(x=>x.side==='ally');
  $('roster').innerHTML=roster.map(x=>`<button class="roster-unit ${x.id===s.selected?'selected':''} ${x.acted?'spent':''}" data-unit="${x.id}" aria-pressed="${x.id===s.selected}">${portrait(x)}<span><b>${escape(x.name)}</b><small>${x.hp}/${x.maxHp} HP · ${x.acted?'Spent':x.moved?'Action ready':'Ready'}</small><span class="mini-health"><i style="width:${x.hp/x.maxHp*100}%"></i></span></span></button>`).join('');
  $('ready-count').textContent=`${roster.filter(x=>!x.acted).length} ready`;
  $('end-round').disabled=s.phase!=='playing'||!!s.pending;
  $('undo').disabled=!s.undo||!!s.pending||s.phase!=='playing';
  $('enemy-toggle').setAttribute('aria-pressed',String(ui.showThreats));
  $('enemy-toggle').textContent=ui.showThreats?'Intentions on':'Intentions off';
  if(subject) {
    const intent=s.intents.find(x=>x.id===subject.id);
    $('inspector').innerHTML=`<div class="inspect-heading">${portrait(subject,true)}<div><p class="eyebrow">${subject.side==='ally'?'YOUR BAND':subject.side==='arbiter'?'THE JUDGES':'HOUSE KAELEN'}</p><h2>${escape(subject.name)}</h2><p>${ROLES[subject.role].label}</p></div></div><div class="unit-stats"><span><b>${subject.hp}<small>/${subject.maxHp}</small></b>Health</span><span><b>${subject.atk}</b>Attack</span><span><b>${subject.range}</b>Range</span><span><b>${subject.move}</b>Move</span></div><p class="unit-desc">${escape(ROLES[subject.role].detail)}</p>${subject.side!=='ally'?`<p class="intent-note">${intent?intent.target?`Intends to strike hex ${intent.target.q}, ${intent.target.r}. Move away to evade.`:'Advancing toward your band.':s.hostile?'Holding position.':'Watching. Will not attack while your cover holds.'}</p>`:''}`;
  } else $('inspector').innerHTML='<h2>Select a survivor</h2><p>Click a portrait or a figure on the map.</p>';
  const idle=!u||u.side!=='ally'||u.acted||s.phase!=='playing',options=[];
  if(target&&u) {
    const f=forecast(s,u,target);
    options.push(`<div class="combat-preview"><span>${escape(u.name)} → ${escape(target.name)}</span><strong>${f?`${f.hit} damage · ${f.counter} return`:'Out of range or blocked'}</strong>${f?.lethal?'<small>Defeats this enemy · no retaliation</small>':''}</div>`);
    options.push(button('attack','Commit attack',idle||!f,'primary'));
  }
  if(u?.id==='ash') {
    if(!s.gateOpen&&distance(u,GATE)<=1&&!s.hostile&&!s.exposed)options.push(button('interact:gate','Present the stolen signet',idle,'primary'));
    const champ=living(s).find(x=>x.id==='vesper');
    if(champ&&distance(u,champ)<=2&&!s.hostile&&s.bargain==='none')options.push(button('interact:bargain','Speak to Vesper',idle,'primary'));
    if(distance(u,SEAL)<=1&&!s.seal)options.push(button('interact:seal','Take the trial seal · alarms guards',idle,'primary'));
    if(same(u,EXIT))options.push(button('interact:exit',!s.seal?'You need the seal':s.oath&&safeCaptives(s).length<2?'Escort both prisoners beside the exit':'Extract with the seal',idle||!s.seal||(s.oath&&safeCaptives(s).length<2),'primary'));
  }
  if(u) for(const c of s.captives.filter(c=>!c.freed&&distance(u,c)<=1)) {
    const guarded=!s.oath&&living(s).some(e=>e.id===c.jailer);
    options.push(button(`interact:${c.id}`,guarded?`${c.name}: defeat jailer or swear oath`:`Free ${c.name}`,idle||guarded,'primary'));
  }
  if(u){
    options.push(`<div class="action-pair">${button('guard','Guard · −2 damage',idle)}${u.role==='healer'?button('mode:bandage','Bandage · heal 5',idle,ui.mode==='bandage'?'armed':''):button('clear-target','Inspect / move',false)}</div>`);
    if(u.id==='ash')options.push(`<p class="eyebrow magic-label">EMBERCRAFT · ${s.embers} EMBERS</p><div class="action-pair">${button('mode:firebrand',`Firebrand <small>${s.exposed?'7':'5'} damage · +40 suspicion</small>`,idle||s.powerUsed||!s.embers,ui.mode==='firebrand'?'armed':'')}${button('mode:mend','Mend <small>heal 7 · +15 suspicion</small>',idle||s.powerUsed||!s.embers,ui.mode==='mend'?'armed':'')}</div>`);
  }
  if(ui.mode)options.push(`<p class="mode-hint">${ui.mode==='firebrand'?'Choose an enemy or the closed gate within 2 hexes.':ui.mode==='mend'?'Choose a wounded ally within 3 hexes.':'Choose a wounded adjacent ally.'} ${button('cancel-mode','Cancel')}</p>`);
  $('actions').innerHTML=options.join('');
  renderTileHint(s,ui);
  $('turn-log').innerHTML=s.log.slice(0,8).map(e=>`<p><span>${String(e.round).padStart(2,'0')}</span>${escape(e.text)}</p>`).join('');
}
export function renderTileHint(s,ui) {
  const tile=ui.hover&&tileAt(s,ui.hover);
  $('tile-hint').textContent=tile?`${tile.q}, ${tile.r} · ${tile.terrain==='forest'?'Grove: −1 incoming damage':tile.terrain==='rock'?'Cliffs: blocks movement and shots':tile.terrain==='water'?'River: impassable':same(tile,GATE)?s.gateOpen?'Open causeway':'Closed gate':same(tile,EXIT)?'Extraction: Ash + seal':same(tile,SEAL)?'Trial seal':'Open ground'}`:'Click an ally. Hover a destination to see its path.';
}
export function renderDecision(s) {
  const p=s.pending;
  if(!p)return '';
  return p.kind==='gate'?`<p class="eyebrow">AT THE CHECKPOINT</p><h2>A borrowed name.</h2><p>The gatekeeper studies your signet. A dead noble's crest, still bright enough to command a road.</p><p class="choice-effect">Open the gate. +10 suspicion. Uses Ash's action.</p>${button('choose:signet','Let the signet speak','', 'primary')}${button('choose:cancel','Step away')}`:
    `<p class="eyebrow">VESPER'S BARGAIN</p><h2>Two lives.<br>One promise.</h2><p>“Mara and Brann built this causeway. The judges chained them to it. Take my seal, Cinder—but take them with you.”</p><p class="choice-effect">Gain the seal and permission to free both prisoners. Inspection delayed to round 8. Escort both prisoners to a hex beside the exit before Ash extracts. Losing either breaks the oath.</p>${button('choose:oath','Swear to free them',false,'primary')}${button('choose:decline','Make no promise · find another way')}`;
}
