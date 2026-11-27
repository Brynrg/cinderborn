import './styles.css';
import {CAMP,NPCS,NODES,FOES,SKILLS,dist,enemyById,stats,WORLD} from './data.js';
import {createGame,load,save,equip,talent,revive,notice} from './state.js';
import {tick,cast,navigate,selectTarget,cycleTarget,alive} from './engine.js';
import {nearby,talk,choose,objective,people} from './story.js';
import {draw} from './render.js';
import {$,initUI,paintUI} from './ui.js';
let storage;try{storage=window.localStorage;}catch{/* Play remains available without storage. */}
let stored=load(storage),state=stored||createGame();
let ui={screen:'entry',track:true,sound:false,saveFailed:false,lastModal:null,walking:false,approach:null};
const canvas=$('world'),keys=new Set();let view,lastTime=performance.now(),lastPaint=0,lastSave=0,manualUntil=0,audio;
const paused=()=>!!ui.screen||!!state.dialogue||state.mode!=='playing';
function persist(){ui.saveFailed=!save(storage,state);stored=state;}
function clearInput(){keys.clear();ui.walking=false;}
function focusWorld(){canvas.focus({preventScroll:true});}
function sound(id){if(!ui.sound)return;try{audio??=new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type=id==='fire'?'sawtooth':'sine';o.frequency.value=id==='mend'?560:id==='slash'?140:320;g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.15);}catch{/* Silent fallback. */}}
function skill(id){if(paused())return;if(cast(state,id)){sound(id);persist();}paint();}
function interact(){if(paused())return;const n=nearby(state);if(n){talk(state,n.id);clearInput();persist();}else notice(state,'Move near a person, plant, chest or hearth.');paint();}
function act(id){
 const [kind,value]=id.split(':');
 if(id==='new'){state=createGame();ui.screen=null;ui.approach=null;clearInput();persist();focusWorld();}
 else if(id==='continue'){ui.screen=null;focusWorld();}
 else if(id==='close'){ui.screen=null;state.dialogue=null;clearInput();persist();focusWorld();}
 else if(id==='revive'){revive(state);ui.screen=null;persist();focusWorld();}
 else if(id==='interact')return interact();
 else if(id==='track')ui.track=!ui.track;
 else if(id==='sound')ui.sound=!ui.sound;
 else if(kind==='choice'){choose(state,value);persist();clearInput();if(!state.dialogue)focusWorld();}
 else if(kind==='equip'){equip(state,value);persist();}
 else if(kind==='talent'){talent(state,value);persist();}
 else if(kind==='travel'){
  if(state.combat>0||!state.waystones.includes(value))return;
  const p=value==='campfire'?CAMP:NODES.find(n=>n.id==='waystone');state.player.x=p.x;state.player.y=p.y;state.path=[];state.auto=false;state.target=null;ui.approach=null;ui.screen=null;persist();focusWorld();
 }
 else if(['character','journal','map','pause','restart'].includes(id)){if(state.mode!=='playing'||state.dialogue)return;ui.screen=ui.screen===id?null:id;clearInput();state.auto=false;}
 paint();
}
function paint(){paintUI(state,ui,!!stored);view=draw(canvas,state,ui);}
initUI();
document.addEventListener('click',event=>{
 const b=event.target.closest('button');if(b?.dataset.ui){act(b.dataset.ui);return;}if(b?.dataset.skill){skill(b.dataset.skill);return;}
 const map=event.target.closest('#world-map');if(map){const p=new DOMPoint(event.clientX,event.clientY).matrixTransform(map.getScreenCTM().inverse());navigate(state,{x:p.x,y:p.y});ui.screen=null;ui.approach=null;focusWorld();paint();}
});
canvas.addEventListener('pointerdown',event=>{
 if(paused()||!view)return;
 const rect=canvas.getBoundingClientRect(),p={x:(event.clientX-rect.left-view.w/2)/view.scale+view.cx,y:(event.clientY-rect.top-view.h/2)/view.scale+view.cy};focusWorld();
 const e=alive(state).filter(e=>dist(e,p)<(FOES[e.type].kind==='boss'?40:32)).sort((a,b)=>dist(a,p)-dist(b,p))[0];
 if(e){selectTarget(state,e.id);ui.approach=null;return;}
 const n=[...people(state),...NODES.filter(n=>!state.collected.includes(n.id))].find(n=>dist(n,p)<36);
 if(n){if(dist(n,state.player)<95){talk(state,n.id);clearInput();persist();}else{navigate(state,n);ui.approach=n.id;}}
 else{navigate(state,p);ui.approach=null;}
 paint();
});
const movement=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','Space']);
document.addEventListener('keydown',event=>{
 if(event.code==='Escape'){event.preventDefault();if(state.mode==='fallen')return;if(state.dialogue){state.dialogue=null;persist();}else ui.screen=ui.screen?null:'pause';clearInput();paint();return;}
 if(event.code==='KeyF'&&!event.repeat){event.preventDefault();(document.fullscreenElement?document.exitFullscreen():$('rpg').requestFullscreen()).catch(()=>{});return;}
 if(ui.screen==='entry'||state.dialogue||state.mode==='fallen')return;
 if(['KeyC','KeyI','KeyJ','KeyM'].includes(event.code)&&!event.repeat){event.preventDefault();act(event.code==='KeyJ'?'journal':event.code==='KeyM'?'map':'character');return;}
 if(paused())return;
 if(movement.has(event.code)){event.preventDefault();keys.add(event.code);ui.approach=null;}
 if(event.repeat)return;
 if(event.code==='KeyE'){event.preventDefault();interact();}
 if(event.code==='Tab'){event.preventDefault();cycleTarget(state);paint();}
 const k=SKILLS.find(k=>'Digit'+k.key===event.code);if(k){event.preventDefault();skill(k.id);}
 if(event.code==='KeyQ'){event.preventDefault();skill('potion');}
});
document.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{clearInput();if(!ui.screen&&!state.dialogue)ui.screen='pause';persist();paint();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();persist();if(!ui.screen)ui.screen='pause';}});
window.addEventListener('pagehide',persist);
function advance(dt){
 if(paused())return;
 const input={up:keys.has('KeyW')||keys.has('ArrowUp'),down:keys.has('KeyS')||keys.has('ArrowDown'),left:keys.has('KeyA')||keys.has('ArrowLeft'),right:keys.has('KeyD')||keys.has('ArrowRight'),attack:keys.has('Space')};
 ui.walking=input.up||input.down||input.left||input.right;tick(state,dt,input);
 if(ui.approach){const n=[...people(state),...NODES].find(n=>n.id===ui.approach);if(n&&dist(n,state.player)<90){state.path=[];talk(state,n.id);ui.approach=null;clearInput();persist();}}
}
function frame(now){const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;if(now>manualUntil)advance(dt);view=draw(canvas,state,ui);if(now-lastPaint>100){paintUI(state,ui,!!stored);lastPaint=now;}if(now-lastSave>1000&&ui.screen!=='entry'){persist();lastSave=now;}requestAnimationFrame(frame);}
window.advanceTime=ms=>{manualUntil=performance.now()+120;for(let t=0;t<ms;t+=1000/60)advance(Math.min(1000/60,ms-t)/1000);persist();paint();};
window.render_game_to_text=()=>JSON.stringify({mode:state.mode,screen:ui.screen,dialogue:state.dialogue,coordinateSystem:'World pixels. Origin northwest; x east, y south. WASD and click-to-move. Real-time combat.',world:WORLD,camera:view,player:{...state.player,maxHp:stats(state).maxHp},gear:state.gear,bag:state.bag,talents:state.talents,points:state.points,cooldowns:state.cooldowns,quests:state.quests,objective:objective(state),collected:state.collected,checkpoint:state.checkpoint,waystones:state.waystones,heat:state.heat,target:state.target,auto:state.auto,pathEnd:state.path.at(-1)||null,nearby:nearby(state),enemies:state.enemies.filter(e=>dist(e,state.player)<750).map(e=>({id:e.id,type:e.type,name:FOES[e.type].name,x:e.x,y:e.y,hp:e.hp,dead:e.dead,aggro:e.aggro,windup:e.windup,mark:e.mark})),npcs:people(state).filter(n=>dist(n,state.player)<750),notices:state.notices.map(n=>n.text),kills:state.kills,deaths:state.deaths,saveFailed:ui.saveFailed});
new ResizeObserver(paint).observe($('rpg'));paint();requestAnimationFrame(frame);
