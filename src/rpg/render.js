import {WORLD,FOES,dist} from './data.js';
import {terrainFor} from './world.js';
import {people} from './story.js';
import {trackedObjective,questMark} from './guidance.js';
import {nodes} from './regions.js';
import {sheet} from './art.js';
import {drawObject} from './objects.js';
import {terrain,drawScenery,drawBuilding,worldAtmosphere} from './scenery.js';
import {observeWorld,drawActor,drawNpc,visibleDeath} from './actors.js';
const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const visualTime=s=>reduced()?0:s.time;
const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function label(c,text,x,y,color='#eee5c7',size=12){c.font=`600 ${size}px system-ui`;c.textAlign='center';c.lineWidth=3;c.strokeStyle='#15212e';c.strokeText(text,x,y);c.fillStyle=color;c.fillText(text,x,y);}
function node(c,n,s){
 if(s.collected.includes(n.id)||(n.kind==='seal'&&s.quests.seal))return;
 drawObject(c,n,s,visualTime(s));if(dist(s.player,n)<160)label(c,n.name,n.x,n.y+30,'#eadcba',11);
}
function telegraph(c,m){
 c.save();c.fillStyle='#d95d4940';c.strokeStyle='#ffad77';c.lineWidth=3;
 if(m.shape==='lane'){c.lineCap='round';c.beginPath();c.moveTo(m.x,m.y);c.lineTo(m.x+Math.cos(m.angle)*m.length,m.y+Math.sin(m.angle)*m.length);c.lineWidth=m.r*2+5;c.stroke();c.lineWidth=m.r*2;c.strokeStyle='#923f36c9';c.stroke();}
 else {c.beginPath();c.arc(m.x,m.y,m.r,0,Math.PI*2);if(m.shape==='ring'){c.moveTo(m.x+m.inner,m.y);c.arc(m.x,m.y,m.inner,0,Math.PI*2,true);}c.fill('evenodd');c.stroke();if(m.shape==='ring'){c.strokeStyle='#b9e0b3';c.beginPath();c.arc(m.x,m.y,m.inner-3,0,Math.PI*2);c.stroke();}}
 c.fillStyle='#f5c5a0';c.font='bold 18px Georgia';c.textAlign='center';if(m.shape!=='ring')c.fillText('!',m.x,m.y+6);c.restore();
}

function drawEffects(c,s){
 for(const f of s.effects){
  const life=f.life/f.total,age=1-life;c.save();c.globalAlpha=life;
  if(f.kind==='beam'){
   c.strokeStyle='#e66f36';c.lineWidth=9;c.beginPath();c.moveTo(f.x,f.y-20);c.lineTo(f.tx,f.ty-20);c.stroke();c.strokeStyle='#fff0b9';c.lineWidth=3;c.stroke();
   glow(c,f.tx,f.ty-15,65,'#ffba7040');sheet(c,'explosion',f.tx,f.ty,{cell:192,col:Math.min(8,Math.floor(age*9)),foot:128,scale:.65});
   for(let i=0;i<9;i++){const a=i*.698+age*2,r=12+age*35;c.fillStyle=i%2?'#ffbd70':'#ffe5a1';c.fillRect(f.tx+Math.cos(a)*r,f.ty-20+Math.sin(a)*r,3,3);}
  }else if(f.kind==='slash'){
   c.strokeStyle='#ffe7a2';c.lineWidth=4;c.beginPath();c.arc(f.x,f.y-20,45,f.angle-.9+age*.8,f.angle+.7+age*.8);c.stroke();
  }else if(f.kind==='impact'){
   if(['lane','ring'].includes(f.shape))telegraph(c,f);
   else{c.strokeStyle='#ffbf7b';c.lineWidth=5*(1-age)+1;c.beginPath();c.arc(f.x,f.y,Math.max(4,f.r*(.7+age*.3)),0,Math.PI*2);c.stroke();glow(c,f.x,f.y,f.r,'#e87f482b');}
   const count=f.r>100?20:9;for(let i=0;i<count;i++){const a=i/count*Math.PI*2,r=(f.r||45)*(.6+age*.5);c.fillStyle='#ffd48b';c.fillRect(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r-age*14,3,3);}
  }else{label(c,f.text,f.x,f.y-age*42,f.color,16);if(f.text?.startsWith('+')&&!f.text.includes('XP')){glow(c,f.x,f.y,50,'#a8e6b522');for(let i=0;i<4;i++){c.fillStyle='#c8f3c4';c.fillRect(f.x-20+i*13,f.y+20-age*35,3,6);}}}
  c.restore();
 }
}
export function draw(canvas,s,ui){
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=rect.width,h=rect.height;
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
 const scale=Math.max(.7,Math.min(1.15,w/1280)),cx=Math.max(w/scale/2,Math.min(WORLD.width-w/scale/2,s.player.x)),cy=Math.max(h/scale/2,Math.min(WORLD.height-h/scale/2,s.player.y));
 const view={cx,cy,scale,w,h},quiet=reduced();observeWorld(s);
 c.save();c.translate(w/2-cx*scale,h/2-cy*scale);c.scale(scale,scale);c.drawImage(terrain(s.zone),0,0);
 const {scenery:SCENERY,buildings:BUILDINGS}=terrainFor(s.zone),folks=people(s),visible=o=>Math.abs(o.x-cx)<w/scale/2+140&&Math.abs(o.y-cy)<h/scale/2+210;
 // Ground decoration is below readable combat markers, labels and characters.
 worldAtmosphere(c,s,view,quiet);
 const goal=trackedObjective(s,ui.quest).target;
 if(ui.track&&goal){c.strokeStyle='#f2d28c66';c.setLineDash([3,13]);c.lineWidth=2;c.beginPath();c.moveTo(s.player.x,s.player.y);c.lineTo(goal.x,goal.y);c.stroke();c.setLineDash([]);oval(c,goal.x,goal.y,40+Math.sin(visualTime(s)*3)*3,20,'#efd18d22');}
 if(s.path.length){const p=s.path.at(-1);c.strokeStyle='#f4dba1';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y,14,8,0,0,Math.PI*2);c.stroke();}
 for(const e of s.enemies.filter(e=>!e.dead&&e.mark))telegraph(c,e.mark);
 nodes(s).filter(visible).forEach(n=>node(c,n,s));
 const things=[...SCENERY.filter(visible).map(o=>({...o,draw:()=>{c.globalAlpha=[s.player,...folks].some(n=>Math.abs(o.x-n.x)<o.size&&n.y<o.y&&n.y>o.y-o.size*2)?.32:1;drawScenery(c,o,s,quiet);c.globalAlpha=1;}})),...BUILDINGS.map((b,i)=>({...b,y:b.y+b.h,draw:()=>{c.save();if(s.player.x>b.x-25&&s.player.x<b.x+b.w+25&&s.player.y<b.y+b.h&&s.player.y>b.y-170)c.globalAlpha=.38;drawBuilding(c,b,s.zone,i);c.restore();}})).filter(visible)];
 for(const n of folks.filter(visible))things.push({...n,draw:()=>drawNpc(c,n,s,quiet)});
 for(const e of s.enemies.filter(e=>(!e.dead||visibleDeath(s,e))&&visible(e)))things.push({...e,draw:()=>{
  if(s.target===e.id&&!e.dead){c.strokeStyle='#efc97b';c.lineWidth=2;c.beginPath();c.ellipse(e.x,e.y+4,FOES[e.type].kind==='boss'?39:27,13,0,0,Math.PI*2);c.stroke();}
  drawActor(c,e,s,{reduced:quiet});
 }});
 things.push({...s.player,draw:()=>drawActor(c,s.player,s,{hero:true,reduced:quiet})});things.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
 drawEffects(c,s);
 // Nameplates remain above foreground foliage, rather than being hidden by it.
 for(const n of folks.filter(visible)){label(c,n.name,n.x,n.y-69,'#f0e2bd',12);label(c,questMark(s,n.id),n.x,n.y-91,'#ffd879',22);}
 for(const e of s.enemies.filter(e=>!e.dead&&visible(e)&&(dist(e,s.player)<350||s.target===e.id))){const boss=FOES[e.type].kind==='boss',by=e.y-(boss?114:62);label(c,FOES[e.type].name,e.x,by,'#f0c9b0',11);c.fillStyle='#182431';c.fillRect(e.x-26,by+7,52,5);c.fillStyle='#d48368';c.fillRect(e.x-26,by+7,52*Math.max(0,e.hp)/FOES[e.type].hp,5);}
 label(c,'Ash',s.player.x,s.player.y-73,'#ffe6a4',13);
 c.restore();const shade=c.createRadialGradient(w*.5,h*.48,h*.25,w*.5,h*.5,w*.8);shade.addColorStop(0,'#07171600');shade.addColorStop(1,'#0b172b55');c.fillStyle=shade;c.fillRect(0,0,w,h);
 return view;
}
