import { TECHNIQUES, techniquePreview } from './abilities.js';
import { deadline, contractFor } from './contracts.js';
import { ROLES, GATE, SEAL, EXIT, living, freed, safeCaptives, distance, same, tileAt, unitAt } from './scenario.js';
import { forecast, sealWarden, exitBlockers } from './tactics.js';
import { mission } from './guidance.js';

const $=id=>document.getElementById(id);
export const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function portrait(u,large=false) {
  return `<span class="portrait ${u.role} ${large?'large':''}" aria-hidden="true"><span>${ROLES[u.role].glyph}</span></span>`;
}
const button=(id,label,disabled=false,cls='')=>`<button data-action="${id}" ${disabled?'disabled':''} class="${cls}">${label}</button>`;
function inspector(s,subject,compact=false) {
  if(!subject)return '<h2>Select a survivor</h2><p>Choose a portrait or figure.</p>';
  const intent=s.intents.find(i=>i.id===subject.id),victim=intent?.target&&unitAt(s,intent.target);
  const detail=subject.id==='sealguard'?'The shrine is warded while this warden lives. Defeat the warden to take its seal—or bargain with Vesper.':ROLES[subject.role].detail;
  const plan=intent?intent.target?`Strikes ${victim?.side==='ally'?victim.name:'the marked hex'} after this round. Move away from that hex to evade.`:intent.path.length?'Advances along the dashed route after this round.':'Holds position this round.':s.hostile?'Holding position.':'Neutral. Attacking a house unit alarms all house guards.';
  return `<div class="inspect-heading">${portrait(subject,true)}<div><p class="eyebrow">${subject.side==='ally'?'YOUR BAND':subject.side==='arbiter'?'THE JUDGES':'HOUSE KAELEN'}</p><h2>${escape(subject.name)}</h2><p>${ROLES[subject.role].label}${compact?' · '+subject.hp+'/'+subject.maxHp+' HP':''}</p></div></div>
    <div class="unit-stats"><span><b>${subject.hp}<small>/${subject.maxHp}</small></b>Health</span><span><b>${subject.atk}</b>Attack</span><span><b>${subject.range}</b>Range</span><span><b>${subject.move}</b>Move</span></div>
    <p class="unit-desc">${escape(detail)}${subject.pinned?' Movement pinned this round.':''}</p>${subject.side!=='ally'?`<p class="intent-note">${escape(plan)}</p>`:''}`;
}
function actions(s,u,target,ui) {
  if(!u)return button('next','Select a ready ally',false,'primary');
  const idle=u.acted||s.phase!=='playing',options=[],skill=TECHNIQUES[u.role];
  options.push(`<div class="activation-state"><b>${escape(u.name)}</b><span class="${u.moved?'used':''}">${u.moved?'Move spent':`Move ${u.move} ready`}</span><span class="${u.acted?'used':''}">${u.acted?'Action spent':'Action ready'}</span></div>`);
  if(ui.mode==='technique'&&skill){
    const subject=living(s).find(t=>t.id===ui.techTarget),preview=techniquePreview(s,u,subject);
    options.push(`<div class="technique-preview"><h3>${skill.name} · ${u.charges}/2 uses</h3><p>${skill.detail}</p><strong>${preview?escape(preview.text):'Choose a marked target on the map.'}</strong>${preview?.hit?`<small>${escape(subject.name)}: ${subject.hp} → ${subject.hp-preview.hit} HP</small>`:''}<div class="action-pair">${button('technique','Commit '+skill.name,!preview,'primary')}${button('cancel-mode','Cancel')}</div></div>`);
    return options.join('');
  }
  if(u.acted)options.push(`<p class="spent-hint">${escape(u.name)} has finished. ${button('next','Next ready ally · N',!living(s).some(x=>x.side==='ally'&&!x.acted))}</p>`);
  if(target&&ui.mode!=='technique'){
    const f=forecast(s,u,target);
    options.push(`<div class="combat-preview"><span>${escape(u.name)} → ${escape(target.name)}</span><strong>${f?`${f.hit} damage · ${f.counter} return`:'Out of range or blocked'}</strong>
      ${f?`<small>${u.range>1&&(tileAt(s,u)?.height||0)>(tileAt(s,target)?.height||0)?'High ground +1 · ':''}${escape(target.name)}: ${target.hp} → ${Math.max(0,target.hp-f.hit)} HP · ${escape(u.name)}: ${u.hp} → ${Math.max(0,u.hp-f.counter)} HP</small>`:''}
      ${!s.hostile?`<small class="${target.side==='house'?'alarm-warning':''}">${target.side==='house'?'Attacking alarms every house guard.':'Steel against Arbiters preserves your cover.'}</small>`:''}</div>`);
    options.push(button('attack','Commit attack',idle||!f,'primary'));
  }
  if(u.id==='ash'){
    if(!s.gateOpen&&distance(u,GATE)<=1&&!s.hostile)options.push(button('interact:gate','Present the stolen signet',idle,'primary'));
    const champ=living(s).find(x=>x.id==='vesper');
    if(champ&&distance(u,champ)<=2&&!s.hostile&&s.bargain==='none')options.push(button('interact:bargain','Speak to Vesper',idle,'primary'));
    if(distance(u,SEAL)<=1&&!s.seal)options.push(button('interact:seal',sealWarden(s)?'Shrine warded · defeat Seal warden':'Take the trial seal',idle||!!sealWarden(s),'primary'));
    if(same(u,EXIT)){
      const missing=!s.seal?'You need the seal':s.oath&&safeCaptives(s).length<2?'Escort both prisoners beside the exit':exitBlockers(s).length?'Exit contested · clear nearby hostiles':null;
      options.push(button('interact:exit',missing||'Extract with the seal',idle||!!missing,'primary'));
    }
  }
  for(const c of s.captives.filter(c=>!c.freed&&distance(u,c)<=1)){
    const guarded=!s.oath&&living(s).some(e=>e.id===c.jailer);
    options.push(button(`interact:${c.id}`,guarded?`${c.name}: defeat jailer or swear oath`:`Free ${c.name}`,idle||guarded,'primary'));
  }
  if(skill)options.push(button('mode:technique',`${skill.name} <small>${u.charges} / 2 uses · ${skill.id==='bulwark'?'protect nearby allies':skill.id==='pin'?'damage + stop movement':'heal 4 · range 3'}</small>`,idle||!u.charges,ui.mode==='technique'?'armed':'class-technique'));
  options.push(`<div class="action-pair">${button('guard','Guard · −2 damage',idle)}${u.role==='healer'?button('mode:bandage','Bandage · heal 5',idle,ui.mode==='bandage'?'armed':''):button('clear-target','Inspect / move')}</div>`);
  if(u.id==='ash')options.push(`<p class="eyebrow magic-label">EMBERCRAFT · ${s.embers} EMBERS · ONE SPELL / ROUND</p><div class="action-pair">${button('mode:firebrand',`Firebrand <small>${s.exposed?'7':'5'} damage · +40 suspicion</small>`,idle||s.powerUsed||!s.embers,ui.mode==='firebrand'?'armed':'')}${button('mode:mend','Mend <small>heal 7 · +15 suspicion</small>',idle||s.powerUsed||!s.embers,ui.mode==='mend'?'armed':'')}</div>`);
  if(ui.mode&&ui.mode!=='technique')options.push(`<p class="mode-hint">${ui.mode==='firebrand'?`Choose a marked enemy or closed gate within 2 hexes. ${!s.hostile?'Fire alarms the house. ':''}${!s.exposed&&s.suspicion>=10?'This spell will expose Ash.':''}`:ui.mode==='mend'?'Choose a marked wounded ally within 3 hexes.':'Choose a marked wounded adjacent ally.'} ${button('cancel-mode','Cancel')}</p>`);
  return options.join('');
}
export function renderPanel(s,ui) {
  const u=living(s).find(x=>x.id===s.selected),target=living(s).find(x=>x.id===ui.targetId),goal=mission(s);
  document.querySelector('.chapter h1').textContent=contractFor(s).name;
  $('round-number').textContent=String(s.round).padStart(2,'0');$('round-limit').textContent=`/ ${deadline(s)}`;
  $('seal-status').textContent=s.seal?'Seal secured':sealWarden(s)?'Seal warded':'Seal unguarded';
  $('seal-status').classList.toggle('complete',s.seal);
  $('rescue-status').textContent=`${freed(s)} / 2 free${s.oath?' · '+safeCaptives(s).length+' at exit':''}`;
  const arrives=s.inspectionRound-s.round;
  $('inspection-status').textContent=s.inspectionArrived?'Inspection on the field':arrives===1?'Inspection next round!':`Inspection · round ${s.inspectionRound}`;
  $('inspection-status').classList.toggle('urgent',s.inspectionArrived||arrives<=1);
  $('cover-label').textContent=s.exposed?'EXPOSED':s.hostile?'HOUSE HOSTILE':s.suspicion>=30?'UNDER SCRUTINY':'COVER INTACT';
  $('cover-value').textContent=s.exposed?`${s.suspicion} SUSPICION`:`${s.suspicion} / 50`;
  $('cover-fill').style.width=`${Math.min(100,s.suspicion*2)}%`;$('cover-meter').classList.toggle('exposed',s.exposed||s.hostile);
  $('embers').textContent=String(s.embers);$('save-status').textContent=ui.saveFailed?'Save unavailable · keep this tab open':'Saved locally';
  $('mission').innerHTML=`<h3>${goal.title}</h3><p>${escape(goal.text)}</p><div class="goal-links">${goal.targets.map(id=>button(`focus:${id}`,`Find ${escape(s.units.find(u=>u.id===id)?.name||s.captives.find(c=>c.id===id)?.name||(id==='shrine'?'shrine':'exit'))}`)).join('')}</div>`;
  $('notice').textContent=ui.notice||(u?.acted?'This ally has finished. Select Next ready · N to keep your band moving.':'Move, then act. An action ends that ally’s activation.');
  $('notice').classList.toggle('error',!!ui.error);
  const roster=living(s).filter(x=>x.side==='ally'),ready=roster.filter(x=>!x.acted).length;
  $('roster').innerHTML=roster.map(x=>`<button class="roster-unit ${x.id===s.selected?'selected':''} ${x.acted?'spent':''}" data-unit="${x.id}" aria-pressed="${x.id===s.selected}">${portrait(x)}<span><b>${escape(x.name)}</b><small>${x.hp}/${x.maxHp} HP · ${x.acted?'Spent':x.moved?'Action ready':'Ready'}</small><span class="mini-health"><i style="width:${x.hp/x.maxHp*100}%"></i></span></span></button>`).join('');
  $('ready-count').textContent=`${ready} ready`;
  $('next-ready').disabled=!ready||!!s.pending||s.phase!=='playing';
  $('remaining-actions').textContent=ready?`${ready} ${ready===1?'ally can':'allies can'} still act`:'All allies have acted';
  $('end-round').disabled=s.phase!=='playing'||!!s.pending;
  $('undo').disabled=!s.undo||!!s.pending||s.phase!=='playing';
  $('enemy-toggle').setAttribute('aria-pressed',String(ui.showThreats));$('enemy-toggle').textContent=ui.showThreats?'Intentions on':'Intentions off';
  $('inspector').classList.toggle('compact',ui.mode==='technique');$('inspector').innerHTML=inspector(s,target||u,ui.mode==='technique');$('actions').innerHTML=actions(s,u,target,ui);
  renderTileHint(s,ui);
  $('turn-log').innerHTML=s.log.slice(0,8).map(e=>`<p><span>${String(e.round).padStart(2,'0')}</span>${escape(e.text)}</p>`).join('');
}
export function tileLabel(s,tile) {
  const unit=unitAt(s,tile);if(unit)return `${unit.name}, ${unit.hp} HP${tile.height?' · high ground':''}`;
  const captive=s.captives.find(c=>!c.freed&&same(c,tile));if(captive)return `${captive.name} · captive`;
  if(same(tile,GATE))return s.gateOpen?'Open causeway':'Closed gate · signet or fire';
  if(same(tile,EXIT))return exitBlockers(s).length?'Exit · contested':'Exit · Ash + seal';
  if(same(tile,SEAL))return s.seal?'Empty shrine':sealWarden(s)?'Shrine · warded by Seal warden':'Shrine · take the seal';
  return tile.height?'High ground · ranged damage +1 against lower targets':tile.terrain==='forest'?'Grove · −1 damage':tile.terrain==='rock'?'Cliffs · block movement and shots':tile.terrain==='water'?'River · impassable':'Open ground';
}
export function renderTileHint(s,ui) {
  const tile=ui.hover&&tileAt(s,ui.hover);
  $('tile-hint').textContent=tile?`${tile.q}, ${tile.r} · ${tileLabel(s,tile)}`:'Blue hexes: move · red marks: next enemy strikes';
}
export function renderDecision(s) {
  if(!s.pending)return '';
  return s.pending.kind==='gate'?`<p class="eyebrow">AT THE CHECKPOINT</p><h2>A borrowed name.</h2><p>The gatekeeper studies your signet. A dead noble's crest, still bright enough to command a road.</p><p class="choice-effect">Open the gate. +10 suspicion. Uses Ash's action. The lower footbridge is also open.</p>${button('choose:signet','Let the signet speak',false,'primary')}${button('choose:cancel','Step away')}`:
    `<p class="eyebrow">VESPER'S BARGAIN</p><h2>Two lives.<br>One promise.</h2><p>“Mara and Brann built this causeway. Take my seal, Cinder—but take them with you. My guards will stand aside. The judges will not.”</p><p class="choice-effect">Gain the seal and permission to free both prisoners. Escort both beside the exit; losing either breaks the oath. Inspection still arrives in round ${s.inspectionRound}. Steel against Arbiters keeps the house neutral. Fire does not.</p>${button('choose:oath','Swear to bring them home',false,'primary')}${button('choose:decline','Make no promise · fight for the seal')}`;
}
export function resultDetails(s) {
  const honors=s.result.honors||[],goals=['Both prisoners safe',s.contract==='ashfall'?'Embers to spare':'Cover intact','No allies lost','Swift escape'];
  const missing=goals.find(h=>!honors.includes(h));
  const next=s.phase==='lost'?'Try another approach: coordinate your band, inspect enemy targets, and keep a healing action in reserve.':missing?`Next challenge: ${missing}${missing==='Swift escape'?' — escape by round '+contractFor(s).par:''}.`:s.contract==='ashfall'?'A clean break. Try The Last Light and protect your cover.':s.contract==='lastlight'?'Everyone home. Try Ashfall for a battle with no disguise to fall back on.':'A clean escape. Try winning the seal without Vesper’s oath.';
  return `<p class="survivor-result">${s.result.survivors} surviving allies${s.result.fallen?.length?' · Lost: '+s.result.fallen.map(escape).join(', '):''}</p>${honors.length?`<ul class="honors">${honors.map(h=>`<li>✦ ${escape(h)}</li>`).join('')}</ul>`:''}<p class="intro-note">${escape(next)}</p>`;
}
