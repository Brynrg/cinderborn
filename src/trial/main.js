import './styles.css';
import { createTrial, living, unitAt, GATE, same, key } from './scenario.js';
import { dispatch } from './actions.js';
import { load, save } from './storage.js';
import { drawBoard, point } from './board.js';
import { renderPanel, renderDecision, renderTileHint, escape } from './view.js';

const $=id=>document.getElementById(id),canvas=$('board');
let storage;
try {storage=window.localStorage;}catch {/* Browser storage may be unavailable. */}
const stored=load(storage);
let state=stored||createTrial();
let ui={targetId:null,mode:null,hover:null,showThreats:true,notice:'',saveFailed:false,error:false};
let screen='intro',view=null,audio=null,sound=false,focusedHex=key(state.units[0]);
let lastFocus=null,lastModal='';
const controls=new Map();
for(const tile of state.tiles) {
  const b=document.createElement('button');b.className='hex-control';b.dataset.hex=key(tile);b.tabIndex=-1;
  b.addEventListener('click',()=>clickTile(tile));
  b.addEventListener('pointerenter',()=>{ui.hover=tile;draw();renderTileHint(state,ui);});
  b.addEventListener('focus',()=>{focusedHex=key(tile);ui.hover=tile;for(const [k,b] of controls)b.tabIndex=k===focusedHex?0:-1;draw();renderTileHint(state,ui);});
  b.addEventListener('keydown',e=>{
    const d={ArrowRight:[1,0],ArrowLeft:[-1,0],ArrowUp:[0,-1],ArrowDown:[0,1],q:[-1,1],w:[1,-1]}[e.key];
    if(d){e.preventDefault();controls.get(`${tile.q+d[0]},${tile.r+d[1]}`)?.focus();}
  });
  controls.set(key(tile),b);$('hex-controls').append(b);
}
function persist() {ui.saveFailed=!save(storage,state);}
function soundEffect(ok=true) {
  if(!sound)return;
  try{audio??=new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=ok?420:150;o.type='sine';g.gain.setValueAtTime(.04,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.16);}catch{/* silent fallback */}
}
function apply(action) {
  if(screen)return;
  const result=dispatch(state,action);ui.notice=result.error||'';ui.error=!!result.error;
  if(!result.error){state=result.state;ui.notice=action.type==='move'?`${state.units.find(u=>u.id===action.unitId).name} moved. Choose an action, or undo with Z.`:state.log[0]?.text||'';ui.mode=null;ui.targetId=null;persist();soundEffect();}
  else soundEffect(false);
  render();
}
function select(id) {
  state.selected=id;ui.targetId=null;ui.mode=null;ui.notice='';ui.error=false;
  focusedHex=key(state.units.find(u=>u.id===id));persist();render();
}
function clickTile(tile) {
  if(screen||state.pending||state.phase!=='playing')return;
  const target=unitAt(state,tile),unitId=state.selected;
  if(ui.mode==='firebrand')return apply({type:'magic',kind:'firebrand',unitId,target:target?.id||(same(tile,GATE)?'gate':null)});
  if(ui.mode==='mend')return apply({type:'magic',kind:'mend',unitId,target:target?.id});
  if(ui.mode==='bandage')return apply({type:'bandage',unitId,target:target?.id});
  if(target?.side==='ally')select(target.id);
  else if(target){ui.targetId=target.id;ui.notice='Inspect the forecast before committing an attack.';ui.error=false;render();}
  else apply({type:'move',unitId,to:{q:tile.q,r:tile.r}});
}
function act(id) {
  const [type,value]=id.split(':');
  if(type==='choose')return apply({type:'choose',choice:value});
  if(type==='interact')return apply({type:'interact',unitId:state.selected,kind:value});
  if(type==='mode'){ui.mode=ui.mode===value?null:value;ui.notice='';return render();}
  if(id==='cancel-mode'||id==='clear-target'){ui.mode=null;ui.targetId=null;ui.notice='';return render();}
  if(id==='attack')return apply({type:'attack',unitId:state.selected,target:ui.targetId});
  if(id==='guard')return apply({type:'guard',unitId:state.selected});
  if(id==='begin'||id==='restart-confirm'){state=createTrial();focusedHex=key(state.units[0]);ui={...ui,targetId:null,mode:null,notice:'',error:false};screen='';persist();return render();}
  if(id==='continue'){screen='';return render();}
  if(id==='close'){screen='';return render();}
  if(id==='restart'){screen='restart';return render();}
}
document.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button)return;
  if(button.dataset.action)act(button.dataset.action);
  if(button.dataset.unit&&!screen&&!state.pending)select(button.dataset.unit);
});
$('end-round').onclick=()=>apply({type:'end'});
$('undo').onclick=()=>apply({type:'undo'});
$('help-button').onclick=()=>{screen='help';render();};
$('menu-button').onclick=()=>{screen='menu';render();};
$('enemy-toggle').onclick=()=>{ui.showThreats=!ui.showThreats;render();};
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));soundEffect();};
async function fullscreen() {try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{ui.notice='Fullscreen is unavailable in this browser.';render();}}
document.addEventListener('keydown',e=>{
  if(e.key==='Tab'&&!$('modal').hidden){
    const buttons=[...$('modal').querySelectorAll('button,a')].filter(b=>!b.disabled),first=buttons[0],last=buttons.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}return;
  }
  if(e.key==='Escape'){if(screen&&screen!=='intro')screen='';else{ui.mode=null;ui.targetId=null;}render();return;}
  if(e.key.toLowerCase()==='f'){e.preventDefault();fullscreen();return;}
  if(screen||state.pending||state.phase!=='playing'||e.repeat)return;
  if(e.key.toLowerCase()==='e'){e.preventDefault();apply({type:'end'});}
  if(e.key.toLowerCase()==='z'){e.preventDefault();apply({type:'undo'});}
  const n=Number(e.key);if(n>=1&&n<=6){const u=living(state).filter(u=>u.side==='ally')[n-1];if(u){e.preventDefault();select(u.id);}}
});
function modalContent() {
  if(screen==='intro')return `<div class="title-seal">✦</div><p class="eyebrow">CINDERBORN · TRIAL I</p><h2 id="modal-heading">The Ashen<br><em>Causeway</em></h2><p>A stolen name. A guarded crossing.<br>Two people the judges meant to leave behind.</p><div class="intro-steps"><span><b>01</b>Secure the seal</span><span><b>02</b>Choose who to save</span><span><b>03</b>Get Ash out alive</span></div><p class="intro-note">Command four survivors. Read enemy intentions. Bargain with a champion—or let your fire speak. The roads close after round 12.</p>${stored?'<button class="primary" data-action="continue">Continue your trial</button><button data-action="restart">Start a new trial</button>':'<button class="primary" data-action="begin">Enter the causeway <span>→</span></button>'}<a class="classic-link" href="./conclave.html">Original Conclave mode</a>`;
  if(screen==='help')return `<p class="eyebrow">FIELD GUIDE</p><h2 id="modal-heading">Read. Decide. Act.</h2><ul class="help-list"><li><b>Move, then act.</b> Select a portrait or figure. Blue hexes show reachable ground. An attack or Guard ends that unit's activation.</li><li><b>Inspect before striking.</b> Click an enemy to see health, range, and exact damage/retaliation. Red lines show their next intended target tile; move away to evade.</li><li><b>Keep your word—or break cover.</b> Ash can speak to Vesper within two hexes. Her seal requires freeing both prisoners and escorting them beside the exit. Losing either breaks the oath. Without her oath, defeat each jailer to free their captive.</li><li><b>Forbidden fire.</b> Firebrand hits enemies or burns the gate within two hexes; it always alarms the guards. Embercraft passes over cliffs. Mend heals within three. One spell per round, four embers total. Any attack or seal theft also alarms the guards. At 50 suspicion, your disguise breaks and Firebrand rises from 5 to 7 damage.</li><li><b>Leave in time.</b> Bring Ash and the seal onto the eastern exit, then Extract. Ash's death or ending round 12 before extraction loses the trial.</li><li><b>Keys.</b> 1–6 select allies · E end round · Z undo a move · F fullscreen. Tab reaches controls. Arrow keys navigate hexes; Q/W cover diagonals; Enter selects.</li></ul><button data-action="close" class="primary">Back to the field</button>`;
  if(screen==='menu')return `<p class="eyebrow">TRIAL PAUSED</p><h2 id="modal-heading">A moment in the mist.</h2><p>Your actions and open decisions save locally. Return to this browser to continue.</p><button class="primary" data-action="close">Resume trial</button><button data-action="restart">Start a new trial</button><a class="classic-link" href="./conclave.html">Original Conclave mode</a>`;
  if(screen==='restart')return `<p class="eyebrow">NEW TRIAL</p><h2 id="modal-heading">Begin again?</h2><p>This replaces the Causeway run saved in this browser. Your original Conclave save is separate.</p><button class="primary" data-action="restart-confirm">Begin a new trial</button><button data-action="close">Keep this trial</button>`;
  if(state.pending)return renderDecision(state).replace('<h2>','<h2 id="modal-heading">');
  if(state.phase!=='playing')return `<div class="title-seal ${state.phase==='lost'?'broken':''}">${state.phase==='won'?'✦':'◇'}</div><p class="eyebrow">${state.phase==='won'?'TRIAL COMPLETE':'THE JUDGES PREVAIL'}</p><h2 id="modal-heading">${state.phase==='won'?'Beyond the<br><em>causeway.</em>':'The road<br><em>ends here.</em>'}</h2><p>${escape(state.result.reason)}</p><div class="result-stats"><span><b>${state.round}</b>Rounds</span><span><b>${state.result.freed}/2</b>Freed</span><span><b>${state.result.route}</b>Path</span></div><button class="primary" data-action="restart-confirm">Try another path</button><p class="intro-note">A single complete trial. Your choices are the story.</p>`;
  return '';
}
function draw() {view=drawBoard(canvas,state,ui);}
function render() {
  const active=document.activeElement;
  const focusSelector=active?.dataset.unit?`[data-unit="${active.dataset.unit}"]`:active?.dataset.action?`[data-action="${active.dataset.action}"]`:null;
  renderPanel(state,ui);draw();
  if(focusSelector&&!active.isConnected)document.querySelector(focusSelector)?.focus({preventScroll:true});
  for(const tile of state.tiles){const b=controls.get(key(tile)),p=point(view,tile),u=unitAt(state,tile);b.style.cssText=`left:${p.x-view.s*.85}px;top:${p.y-view.s}px;width:${view.s*1.7}px;height:${view.s*2}px;`;b.tabIndex=key(tile)===focusedHex?0:-1;b.setAttribute('aria-label',`Hex ${tile.q}, ${tile.r}: ${u?u.name+', '+u.hp+' HP':tile.terrain}`);}
  const content=modalContent(),modal=$('modal');
  if(content!==lastModal){
    if(content){if(modal.hidden)lastFocus=document.activeElement;$('modal-content').innerHTML=content;modal.hidden=false;$('game-shell').inert=true;queueMicrotask(()=>modal.querySelector('button')?.focus());}
    else{modal.hidden=true;$('game-shell').inert=false;lastFocus?.isConnected&&lastFocus.focus();}
    lastModal=content;
  }
}
new ResizeObserver(()=>render()).observe($('map-frame'));
window.render_game_to_text=()=>JSON.stringify({coordinateSystem:'axial hexes: q right, r down-right; origin at checkpoint',...state,tiles:state.tiles.filter(t=>t.terrain!=='ground'),log:state.log.slice(0,4),screen,mode:ui.mode});
window.advanceTime=()=>draw(); // Turn-based: time advances only with End Round.
render();
