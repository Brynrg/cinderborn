import {FOES,dist} from './data.js';
import {sheet,npcArt,heroArt} from './art.js';
import {observeActor,actorPose} from './animation.js';
let source,actors=new Map(),heroView={},lastCooldowns={},spellSerial=0;
export const animationStatus=()=>({...heroView});
export function observeWorld(s){
 if(source!==s){source=s;actors=new Map();lastCooldowns={...s.cooldowns};spellSerial=0;}
 if(['fire','mend','nova','aegis'].some(id=>s.cooldowns[id]>(lastCooldowns[id]||0)+.05))spellSerial++;lastCooldowns={...s.cooldowns};
 const player={...s.player,dead:s.mode==='fallen'};
 actors.set('ash',observeActor(actors.get('ash'),player,s.time,{attack:s.cooldowns.slash,cast:spellSerial}));
 for(const e of s.enemies){const key=s.zone+e.id;actors.set(key,observeActor(actors.get(key),{...e,face:e.aggro?Math.atan2(s.player.y-e.y,s.player.x-e.x):0},s.time));}
}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function wolf(c,e,v,t){
 const k=['hound','ashhound','stalker'].includes(e.type)?1.3:1,step=v.moving?Math.sin(t*18)*6:0,face=Math.cos(v.face)<0?-1:1;
 const dark=e.type==='ashhound'?'#593f43':'#313f46',fur=e.type==='stalker'?'#72948b':e.type==='ashhound'?'#a76b54':'#92a7a3',light=e.type==='ashhound'?'#e5a16a':'#d6d6bd';
 c.save();c.translate(e.x,e.y);c.scale(face*k,k);ellipse(c,0,4,27,8,'#0b172a65');
 c.strokeStyle=dark;c.lineWidth=7;c.lineCap='square';for(const [x,dir] of [[-17,1],[-9,-1],[12,-1],[20,1]]){c.beginPath();c.moveTo(x,-9);c.lineTo(x+step*dir,3);c.lineTo(x+step*dir+5,4);c.stroke();}
 c.fillStyle=dark;c.beginPath();c.moveTo(-23,-11);c.lineTo(-35,-19-step/2);c.lineTo(-39,-35);c.lineTo(-27,-25);c.lineTo(-14,-20);c.fill();
 c.fillStyle=fur;c.beginPath();c.moveTo(-24,-11);c.lineTo(-22,-26);c.lineTo(-8,-29);c.lineTo(11,-25);c.lineTo(20,-38);c.lineTo(24,-28);c.lineTo(33,-29);c.lineTo(40,-19);c.lineTo(39,-14);c.lineTo(27,-12);c.lineTo(17,-7);c.lineTo(-13,-8);c.closePath();c.fill();c.strokeStyle=dark;c.lineWidth=2;c.stroke();
 c.fillStyle=light;c.beginPath();c.moveTo(-16,-25);c.lineTo(-7,-23);c.lineTo(0,-26);c.lineTo(7,-21);c.lineTo(15,-22);c.lineTo(10,-17);c.lineTo(-12,-19);c.fill();
 c.fillRect(-15,-18,4,3);c.fillRect(-7,-15,5,3);c.fillRect(3,-19,4,3);c.fillRect(28,-17,9,3);c.fillStyle=dark;c.fillRect(34,-23,6,4);c.fillRect(23,-28,4,4);c.fillStyle='#ffd480';c.fillRect(25,-26,2,2);c.fillStyle='#f2e5c5';c.fillRect(31,-14,3,4);c.restore();
}
const wolves=new Map();
function wolfSprite(c,e,v,t){
 const frame=v.moving?Math.floor(t*12)%6:6,key=e.type+':'+frame;let image=wolves.get(key);
 if(!image){image=document.createElement('canvas');image.width=64;image.height=48;const ctx=image.getContext('2d');ctx.scale(.5,.5);wolf(ctx,{...e,x:64,y:64},{...v,face:0},frame===6?0:frame*Math.PI/9);wolves.set(key,image);}
 c.save();c.imageSmoothingEnabled=false;c.translate(e.x,e.y);if(Math.cos(v.face)<0)c.scale(-1,1);c.drawImage(image,-64,-64,128,96);c.restore();
}
function wisp(c,e,t){
 const color=e.type==='shade'?'#ba9ff7':'#a7ecde',bob=Math.sin(t*3)*5;
 glow(c,e.x,e.y-22,52,color+'24');ellipse(c,e.x,e.y,22,7,'#10253555');
 c.save();c.translate(e.x,e.y-24+bob);c.fillStyle=color+'bb';c.beginPath();c.moveTo(0,-27);c.bezierCurveTo(27,-18,19,0,13,18);c.lineTo(4,12);c.lineTo(-3,22);c.lineTo(-14,12);c.bezierCurveTo(-22,-3,-13,-15,0,-27);c.fill();c.fillStyle='#eefdef';c.fillRect(-8,-5,5,7);c.fillRect(4,-5,5,7);c.restore();
 for(let i=0;i<4;i++){const a=t+i*1.7;ellipse(c,e.x+Math.cos(a)*26,e.y-22+Math.sin(a)*18,2,2,color+'99');}
}
const enemyArt=e=>e.type==='archivist'?'archer-purple':e.type==='marksman'?'archer-red':e.type==='judge'?'warrior-purple':e.type==='warden'?'warrior-blue':'warrior-red';
export function drawNpc(c,n,s,reduced){
 const key=npcArt(n.id),col=reduced?0:Math.floor(s.time*5+n.x)%6;
 if(!sheet(c,key,n.x,n.y,{col,scale:key.startsWith('pawn')?1.05:.78}))ellipse(c,n.x,n.y-20,12,24,n.color);
}
export function drawActor(c,u,s,{hero=false,reduced=false}={}){
 const v=actors.get(hero?'ash':s.zone+u.id);if(!v)return;
 const t=reduced?0:s.time,boss=!hero&&FOES[u.type].kind==='boss';
 if(v.dead){if(s.time-v.deathAt<.7)sheet(c,'death',u.x,u.y,{cell:128,col:Math.min(6,Math.floor((s.time-v.deathAt)*10)),scale:boss?1.3:.85,foot:92});return;}
 const key=hero?heroArt(s):enemyArt(u),pose=actorPose(v,s.time,{kind:key.split('-')[0],windup:u.windup,duration:u.mark?.duration||.65,reduced});
 if(hero)heroView={asset:key,action:pose.action,frame:pose.col,direction:pose.flip?'left':'right',reducedMotion:reduced};
 c.save();if(s.time-v.hitAt<.16)c.filter='brightness(1.8)';
 if(!hero&&FOES[u.type].kind==='beast')wolfSprite(c,u,v,t);
 else if(!hero&&FOES[u.type].kind==='spirit')wisp(c,u,t);
 else {
  const scale=hero?(key.startsWith('pawn')?1.12:.85):boss?1.18:.8;
  if(hero){ellipse(c,u.x,u.y+2,25,10,'#f6c97528');c.strokeStyle='#f1d08b88';c.lineWidth=1;c.beginPath();c.ellipse(u.x,u.y+2,25,10,0,0,Math.PI*2);c.stroke();}
  if(hero&&u.dash>0&&!reduced){for(let i=3;i>0;i--)sheet(c,key,u.x-Math.cos(u.face)*i*17,u.y-Math.sin(u.face)*i*17,{...pose,scale,alpha:.12*(4-i)});}
  if(!sheet(c,key,u.x,u.y,{...pose,scale,filter:s.time-v.hitAt<.16?'brightness(1.8)':'none'}))ellipse(c,u.x,u.y-23,15,26,hero?'#dca265':FOES[u.type].color);
  if(boss){const color=u.type==='archivist'?'#c4a4ff':u.type==='judge'?'#f6d486':'#f59c64';glow(c,u.x,u.y-39,62,color+'20');c.strokeStyle=color+'88';c.lineWidth=2;c.beginPath();c.ellipse(u.x,u.y+4,35,13,0,0,Math.PI*2);c.stroke();
   if(u.type==='judge'){c.fillStyle='#e7bc60';c.beginPath();c.moveTo(u.x-17,u.y-88);c.lineTo(u.x-17,u.y-102);c.lineTo(u.x-8,u.y-94);c.lineTo(u.x,u.y-107);c.lineTo(u.x+8,u.y-94);c.lineTo(u.x+17,u.y-102);c.lineTo(u.x+17,u.y-88);c.closePath();c.fill();}
   if(u.type==='archivist')for(let i=0;i<3;i++){const a=t*1.5+i*Math.PI*2/3;c.save();c.translate(u.x+Math.cos(a)*43,u.y-42+Math.sin(a)*14);c.rotate(Math.sin(a)*.2);c.fillStyle='#dfd5b9';c.fillRect(-5,-8,10,16);c.fillStyle='#79828a';c.fillRect(-3,-4,6,2);c.fillRect(-3,0,6,2);c.restore();}
  }
 }
 if(hero&&u.shield>0){c.strokeStyle='#b6e8f4bb';c.lineWidth=2;c.beginPath();c.ellipse(u.x,u.y-28,36,49,0,0,Math.PI*2);c.stroke();glow(c,u.x,u.y-22,55,'#a7e4ff20');}
 if(hero&&s.time-v.castAt<.6){const a=(s.time-v.castAt)/.6;c.strokeStyle='#f4bb6899';c.lineWidth=3;c.beginPath();c.ellipse(u.x,u.y+2,20+a*35,8+a*15,0,0,Math.PI*2);c.stroke();}
 c.restore();
}
export const visibleDeath=(s,e)=>e.dead&&s.time-(actors.get(s.zone+e.id)?.deathAt??-100)<.7;
