import { GATE, SEAL, EXIT, ENTRIES, same, key, living, ROLES } from './scenario.js';
import { paths } from './tactics.js';

const C={ink:'#263c3b',paper:'#e6dfc7',edge:'#afa98f',water:'#6d9d9e',forest:'#82927a',gold:'#c69246',red:'#ad4b35',ally:'#274d4c'};
export function geometry(w,h) {
  const s=Math.min(w/(Math.sqrt(3)*10.2),h/15.4);
  return {s,x:w/2,y:h/2+4};
}
export function point(v,t) {return {x:v.x+v.s*Math.sqrt(3)*(t.q+t.r/2),y:v.y+v.s*1.5*t.r};}
function hex(g,x,y,s) {
  g.beginPath();for(let i=0;i<6;i++){const a=(i*60-30)*Math.PI/180;const px=x+Math.cos(a)*s,py=y+Math.sin(a)*s;i?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();
}
function line(g,x,y,x2,y2,color=C.ink,width=1) {g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.stroke();}
function circle(g,x,y,r,fill,stroke) {g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=1;g.stroke();}}
function text(g,str,x,y,size,color=C.ink,font='Georgia') {g.fillStyle=color;g.font=`${size}px ${font}`;g.textAlign='center';g.fillText(str,x,y);}

function terrain(g,t,p,s) {
  const {x,y}=p;
  hex(g,x,y+4,s*.96);g.fillStyle='#9e9e86';g.fill();
  hex(g,x,y,s*.96);g.fillStyle=t.terrain==='water'?C.water:t.terrain==='forest'?'#c6ceaf':C.paper;
  g.fill();g.strokeStyle='#bbb69e';g.lineWidth=.8;g.stroke();
  if(t.terrain==='water') {
    for(let r=-2;r<=2;r++) {g.beginPath();g.moveTo(x-s*.55,y+r*s*.23);g.quadraticCurveTo(x,y+r*s*.23-5,x+s*.55,y+r*s*.23);g.strokeStyle='#bad0c3';g.stroke();}
  } else if(t.terrain==='forest') {
    for(const [dx,dy,k] of [[-.3,.14,.8],[.27,.1,.9],[0,-.2,1]]) {
      line(g,x+dx*s,y+dy*s,x+dx*s,y+dy*s+s*.35,'#5c6550',2);
      for(let j=0;j<3;j++){g.beginPath();g.moveTo(x+dx*s,y+dy*s-s*.35*k+j*5);g.lineTo(x+dx*s-s*.2*k,y+dy*s+j*5);g.lineTo(x+dx*s+s*.2*k,y+dy*s+j*5);g.closePath();g.fillStyle=j%2?'#617961':'#73866a';g.fill();}
    }
  } else if(t.terrain==='rock') {
    for(const [dx,dy,k] of [[-.18,.1,1],[.28,.22,.7]]) {g.beginPath();g.moveTo(x+s*dx-s*.34*k,y+s*dy+s*.3);g.lineTo(x+s*dx,y+s*dy-s*.45*k);g.lineTo(x+s*dx+s*.35*k,y+s*dy+s*.3);g.closePath();g.fillStyle='#999e91';g.fill();line(g,x+s*dx,y+s*dy-s*.45*k,x+s*dx+s*.12,y+s*dy+s*.3,'#bcc0ac');}
  } else {
    // Fixed, subtle ground marks; drawing never advances gameplay randomness.
    const n=Math.abs(t.q*31+t.r*17);
    for(let i=0;i<3;i++){const dx=((n+i*11)%19-9)*s/19,dy=((n+i*7)%17-8)*s/20;line(g,x+dx,y+dy,x+dx+2,y+dy,'#c3bea6');}
  }
}
function bridge(g,p,s,open) {
  const {x,y}=p;g.fillStyle='#a99b7e';g.fillRect(x-s*.65,y-s*.3,s*1.3,s*.6);
  for(let i=-3;i<=3;i++)line(g,x+i*s*.18,y-s*.3,x+i*s*.18,y+s*.3,'#d5c9a9',2);
  for(const dy of [-.4,.4])line(g,x-s*.7,y+s*dy,x+s*.7,y+s*dy,'#6f705f',3);
  if(!open){for(const dx of [-.28,0,.28])line(g,x+s*dx,y-s*.55,x+s*dx,y+s*.5,C.gold,3);line(g,x-s*.4,y-s*.4,x+s*.4,y-s*.4,C.gold,3);}
}
function furniture(g,s,v) {
  bridge(g,point(v,GATE),v.s,s.gateOpen);bridge(g,point(v,{q:0,r:2}),v.s,true);
  let p=point(v,SEAL);
  g.fillStyle='#9d9c8a';g.fillRect(p.x-13,p.y+1,26,13);g.fillStyle='#ebe5d3';g.fillRect(p.x-11,p.y-4,22,6);
  if(!s.seal){circle(g,p.x,p.y-10,9,C.gold,'#f8e9ba');text(g,'✦',p.x,p.y-6,13,'#fff4cc');}
  text(g,'SEAL',p.x,p.y+v.s*.69,8,'#6b654d','system-ui');
  p=point(v,EXIT);circle(g,p.x,p.y,v.s*.65,'#b3c7a6','#688367');
  for(const dx of [-.36,.36]) {line(g,p.x+v.s*dx,p.y-15,p.x+v.s*dx,p.y+12,C.ink,2);g.fillStyle='#50766a';g.beginPath();g.moveTo(p.x+v.s*dx,p.y-15);g.lineTo(p.x+v.s*dx+10,p.y-11);g.lineTo(p.x+v.s*dx,p.y-6);g.fill();}
  text(g,'EXIT',p.x,p.y+v.s*.67,8,C.ink,'system-ui');
  for(const c of s.captives.filter(c=>!c.freed)) {
    p=point(v,c);g.fillStyle='#ba9c74';g.fillRect(p.x-13,p.y-13,26,24);g.strokeStyle='#78634c';g.strokeRect(p.x-13,p.y-13,26,24);
    for(let dx=-8;dx<=8;dx+=8)line(g,p.x+dx,p.y-13,p.x+dx,p.y+11,'#584e3e',2);
    circle(g,p.x,p.y-3,4,'#d9b393');text(g,c.name.toUpperCase(),p.x,p.y+v.s*.72,8,C.ink,'system-ui');
  }
  if(!s.inspectionArrived) for(const t of ENTRIES) {
    p=point(v,t);g.save();g.setLineDash([3,3]);circle(g,p.x,p.y,v.s*.65,'#bba98d',C.red);g.restore();
    text(g,String(s.inspectionRound),p.x,p.y+5,17,C.red);text(g,'INSPECTION',p.x,p.y+v.s*.73,6.5,C.red,'system-ui');
  }
}
function piece(g,u,p,s,selected,targeted) {
  const {x,y}=p,r=Math.min(21,s*.51),ally=u.side==='ally',color=ally?C.ally:u.side==='arbiter'?'#374850':'#985542';
  g.save();
  circle(g,x,y+3,r+2,'#00000024');
  if(selected)circle(g,x,y,r+6,'#c6924628',C.gold);
  if(targeted)circle(g,x,y,r+4,'#ad4b3520',C.red);
  circle(g,x,y,r,ally?'#214542':u.side==='arbiter'?'#283c47':'#6a3e32','#eee4c8');
  if(u.acted&&ally)g.globalAlpha=.5;
  // Illustrated busts: distinct headgear, silhouette and equipment by role.
  g.fillStyle=u.role==='ash'?'#c96b45':ally?'#79a99b':u.role==='champion'?'#c39b57':'#b48d69';
  g.beginPath();g.moveTo(x-r*.8,y+r*.65);g.quadraticCurveTo(x,y-r*.7,x+r*.8,y+r*.65);g.fill();
  circle(g,x,y-4,r*.32,'#dec29c');
  g.fillStyle=u.role==='ash'?'#302b26':'#646c64';g.beginPath();g.arc(x,y-7,r*.37,Math.PI,Math.PI*2);g.fill();
  if(u.role==='ash'){g.fillStyle='#e8b468';g.beginPath();g.moveTo(x+9,y+5);g.lineTo(x+14,y-5);g.lineTo(x+17,y+7);g.fill();}
  if(u.role==='shield'){g.fillStyle='#d4d4b6';g.beginPath();g.moveTo(x+3,y);g.lineTo(x+13,y);g.lineTo(x+12,y+10);g.lineTo(x+8,y+14);g.lineTo(x+3,y+10);g.fill();}
  if(u.role==='bow'){g.strokeStyle='#e4c38b';g.lineWidth=2;g.beginPath();g.arc(x+8,y+1,10,-1,1);g.stroke();line(g,x+13,y-7,x+13,y+9,'#d2c4a4');}
  if(u.role==='healer'){line(g,x+10,y-2,x+10,y+10,'#e6dec2',3);line(g,x+5,y+4,x+15,y+4,'#e6dec2',3);}
  if(u.role==='champion'){text(g,'♛',x,y-r*.4,r*.9,'#e8c477');}
  if(u.role==='arbiter'){g.fillStyle='#c8cbb9';g.fillRect(x-5,y-8,10,12);line(g,x-3,y-3,x+3,y-3,'#293b40',2);}
  g.globalAlpha=1;
  const hw=r*1.8;g.fillStyle='#f5edda';g.fillRect(x-hw/2,y+r+3,hw,4);g.fillStyle=ally?'#497e6b':C.red;g.fillRect(x-hw/2,y+r+3,hw*u.hp/u.maxHp,4);
  text(g,u.name.length>11?u.name.split(' ').at(-1):u.name,x,y-r-7,Math.max(8,Math.min(11,s*.29)),C.ink,'system-ui');
  if(u.guarding)text(g,'◆',x-r,y+4,10,C.gold);
  if(ally&&!u.acted)circle(g,x+r-1,y-r+2,3.5,'#e9bf67',C.ink);
  g.restore();
}
export function drawBoard(canvas,state,{hover=null,targetId=null,showThreats=true}={}) {
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(rect.width*dpr)||canvas.height!==Math.round(rect.height*dpr)){canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);}
  const g=canvas.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);
  const w=rect.width,h=rect.height,v=geometry(w,h);g.fillStyle='#d9d9bf';g.fillRect(0,0,w,h);
  // Map margins, compass and understated survey marks.
  g.strokeStyle='#b4b99e';g.lineWidth=1;g.strokeRect(16,16,w-32,h-32);
  text(g,'N',w-36,42,10,'#6e7f6e');line(g,w-36,48,w-36,66,'#6e7f6e');
  text(g,'VAEL  /  EASTERN CROSSING',w/2,31,9,'#758171','system-ui');
  for(const t of state.tiles)terrain(g,t,point(v,t),v.s);
  furniture(g,state,v);
  const u=living(state).find(u=>u.id===state.selected),moves=u?.side==='ally'&&!u.moved&&!u.acted?paths(state,u):new Map();
  for(const [k] of moves) {const [q,r]=k.split(',').map(Number),p=point(v,{q,r});hex(g,p.x,p.y,v.s*.88);g.fillStyle='#417b7a30';g.fill();}
  if(hover && moves.has(key(hover))) {
    const path=[u,...moves.get(key(hover))];g.save();g.setLineDash([4,4]);for(let i=1;i<path.length;i++){const a=point(v,path[i-1]),b=point(v,path[i]);line(g,a.x,a.y,b.x,b.y,'#386b67',2);}g.restore();
  }
  if(showThreats)for(const intent of state.intents) {
    if(!living(state).some(u=>u.id===intent.id))continue;
    const a=point(v,intent.from),b=point(v,intent.to),t=intent.target&&point(v,intent.target);
    g.save();g.setLineDash([3,5]);line(g,a.x,a.y,b.x,b.y,'#ad4b3577',1.6);g.restore();
    if(t){line(g,b.x,b.y,t.x,t.y,'#ad4b35aa',1.5);circle(g,t.x,t.y,v.s*.72,'#ad4b3510','#ad4b35');}
  }
  if(hover){const p=point(v,hover);hex(g,p.x,p.y,v.s*.94);g.strokeStyle=C.gold;g.lineWidth=2;g.stroke();}
  for(const unit of living(state))piece(g,unit,point(v,unit),v.s,unit.id===state.selected,unit.id===targetId);
  text(g,'THE ASHEN CAUSEWAY',w/2,h-22,10,'#6e7f6e','Georgia');
  return v;
}
