import {WORLD,CAMP,NPCS,NODES,FOES,dist,stats} from './data.js';
import {terrainFor} from './world.js';
import {people} from './story.js';
import {trackedObjective,questMark} from './guidance.js';
import {regionData,nodes} from './regions.js';
const terrainCache=new Map();
const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
function label(c,text,x,y,color='#eee5c7',size=12){c.font=`600 ${size}px system-ui`;c.textAlign='center';c.lineWidth=3;c.strokeStyle='#182a26';c.strokeText(text,x,y);c.fillStyle=color;c.fillText(text,x,y);}
function terrainLayer(zone){
 const r=regionData(zone),ROADS=r.roads,NPCS=r.npcs;
 const cv=document.createElement('canvas');cv.width=WORLD.width;cv.height=WORLD.height;const c=cv.getContext('2d');
 c.fillStyle='#5b7352';c.fillRect(0,0,cv.width,cv.height);
 const g=c.createLinearGradient(500,0,2450,1400);g.addColorStop(0,r.colors[0]);g.addColorStop(.4,r.colors[1]);g.addColorStop(1,r.colors[2]);c.fillStyle=g;c.fillRect(0,0,cv.width,cv.height);
 for(let i=0;i<9000;i++){const x=(i*137.53)%2600,y=(i*73.91)%1700;c.fillStyle=i%4?'#c4c78d0b':'#142e2520';c.fillRect(x,y,3+i%7,2);}
 for(const road of ROADS){c.lineJoin='round';c.lineCap='round';for(const [width,color] of [[96,'#40523c55'],[70,'#9e9473'],[52,'#b3a583']]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();road.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}}
 if(zone==='march'){
 c.fillStyle='#253e3d';c.fillRect(1050,0,160,1700);c.fillStyle='#437472';c.fillRect(1070,0,120,1700);
 for(let y=0;y<1700;y+=19){c.strokeStyle=y%2?'#89af9e50':'#acd0b030';c.lineWidth=2;c.beginPath();c.moveTo(1080,y);c.quadraticCurveTo(1125,y+8,1180,y+1);c.stroke();}
 for(const [y,h] of [[725,170],[1260,120]]){c.fillStyle='#403e31';c.fillRect(1045,y-9,170,h+18);c.fillStyle='#a99a78';c.fillRect(1050,y,160,h);for(let x=1056;x<1210;x+=18){c.fillStyle='#6c664d';c.fillRect(x,y,3,h);}c.fillStyle='#d2c29a';c.fillRect(1040,y-10,180,9);c.fillRect(1040,y+h,180,9);}
 oval(c,360,960,178,145,'#9f9375');oval(c,360,960,160,130,'#afa080');
 for(let i=0;i<20;i++){const a=i/20*Math.PI*2;oval(c,360+Math.cos(a)*168,960+Math.sin(a)*135,10,7,'#737969');}
 c.fillStyle='#8b8f7c';c.fillRect(2020,230,210,300);for(let x=2030;x<2230;x+=34)for(let y=240;y<530;y+=34){c.strokeStyle='#626c5e';c.strokeRect(x,y,31,31);}
 for(const x of [2045,2200])for(const y of [260,470]){c.fillStyle='#bac1aa';c.fillRect(x,y,22,35);c.fillStyle='#d5d4b8';c.fillRect(x-4,y-5,30,10);}
 c.fillStyle='#596965';c.fillRect(2390,790,64,210);c.fillStyle='#b6bda6';c.fillRect(2370,760,35,260);c.fillRect(2450,760,35,260);c.fillStyle='#d2c9a1';c.fillRect(2360,750,135,32);
 for(const n of NPCS.filter(n=>['mara','brann'].includes(n.id))){c.fillStyle='#363b3580';c.fillRect(n.x-34,n.y-36,68,65);c.strokeStyle='#a7b0a4';c.lineWidth=4;for(let i=-32;i<=32;i+=16){c.beginPath();c.moveTo(n.x+i,n.y-38);c.lineTo(n.x+i,n.y+30);c.stroke();}}
 }else{
 oval(c,r.camp.x,r.camp.y,180,145,r.biome==='fen'?'#70878a':'#9c8b71');
 if(zone==='forge'){for(const [x,y] of [[1060,220],[1730,230],[1770,1400]]){c.fillStyle='#302d2b';c.fillRect(x-65,y-50,130,100);oval(c,x,y,42,25,'#cf682f');oval(c,x,y,23,14,'#ffc170');for(let i=0;i<4;i++)oval(c,x+Math.sin(i)*20,y-35-i*21,18+i*6,14,'#2b303047');}c.strokeStyle='#292d2b';c.lineWidth=9;for(const y of [690,720]){c.beginPath();c.moveTo(800,y);c.lineTo(2160,y);c.stroke();}}
 if(zone==='fen'){for(const [x,y] of [[700,620],[1190,1070],[1640,620],[2200,1400]]){oval(c,x,y,130,60,'#203c4b');oval(c,x,y,110,45,'#4b7d8866');for(let i=0;i<7;i++)oval(c,x-75+i*24,y+Math.sin(i)*20,8,3,'#b5cbb477');}for(const n of r.nodes.filter(n=>n.kind==='record')){c.fillStyle='#829996';c.fillRect(n.x-46,n.y-48,92,65);c.strokeStyle='#c4cebc';c.strokeRect(n.x-46,n.y-48,92,65);}}
 if(zone==='citadel'){c.fillStyle='#a5a393';c.fillRect(2000,650,480,400);for(let x=2020;x<2480;x+=48)for(let y=665;y<1050;y+=48){c.strokeStyle='#727b78';c.strokeRect(x,y,43,43);}for(const x of [2025,2440])for(const y of [650,1020]){c.fillStyle='#d2cfb9';c.fillRect(x,y,26,70);c.fillRect(x-8,y-8,42,15);}}
 }
 return cv;
}
function tree(c,o){
 oval(c,o.x+10,o.y+5,o.size*.7,20,'#122b2355');c.fillStyle='#514e36';c.fillRect(o.x-7,o.y-27,14,34);
 if(o.kind==='pillar'){c.fillStyle='#879094';c.fillRect(o.x-13,o.y-o.size*1.2,26,o.size*1.2);c.fillStyle='#c0bfae';c.fillRect(o.x-19,o.y-o.size*1.2,38,10);c.fillRect(o.x-18,o.y,36,8);return;}
 if(o.kind==='rock'||o.kind==='slag'){c.fillStyle=o.kind==='slag'?'#745a4c':'#7b8978';c.beginPath();c.moveTo(o.x-o.size*.7,o.y);c.lineTo(o.x-o.size*.5,o.y-o.size*.55);c.lineTo(o.x+o.size*.15,o.y-o.size*.8);c.lineTo(o.x+o.size*.65,o.y-15);c.lineTo(o.x+o.size*.4,o.y+10);c.closePath();c.fill();c.strokeStyle='#b2b4a080';c.stroke();return;}
 const palette=o.kind==='willow'?['#385b60','#54777b','#7b9b94']:o.shade>.5?['#244b3c','#34634a','#477554']:['#284e45','#38695a','#538373'];
 for(let i=0;i<3;i++){const yy=o.y-o.size*.4-i*o.size*.38,rx=o.size*(.85-i*.18);c.fillStyle=palette[i];c.beginPath();c.moveTo(o.x,yy-o.size*.85);c.quadraticCurveTo(o.x+rx*.6,yy-o.size*.25,o.x+rx,yy+8);c.quadraticCurveTo(o.x,yy+24,o.x-rx,yy+8);c.quadraticCurveTo(o.x-rx*.6,yy-o.size*.25,o.x,yy-o.size*.85);c.fill();}
}
function building(c,b){
 c.fillStyle='#192b2455';c.fillRect(b.x+15,b.y+20,b.w,b.h);c.fillStyle='#b3a686';c.fillRect(b.x,b.y,b.w,b.h);c.fillStyle='#493d31';c.fillRect(b.x+b.w*.4,b.y+b.h-30,24,30);
 c.fillStyle=b.roof;c.beginPath();c.moveTo(b.x-10,b.y+20);c.lineTo(b.x+b.w/2,b.y-35);c.lineTo(b.x+b.w+10,b.y+20);c.lineTo(b.x+b.w+10,b.y+45);c.lineTo(b.x-10,b.y+45);c.closePath();c.fill();
 c.strokeStyle='#d5b99066';c.lineWidth=3;c.beginPath();c.moveTo(b.x-10,b.y+20);c.lineTo(b.x+b.w/2,b.y-35);c.lineTo(b.x+b.w+10,b.y+20);c.stroke();
 c.fillStyle='#f2bc7280';c.fillRect(b.x+12,b.y+45,17,17);
}
function humanoid(c,u,color,face=0,boss=false,time=0,walking=false){
 const k=boss?1.45:1;c.save();c.translate(u.x,u.y);c.scale(k,k);oval(c,0,5,17,8,'#17251f70');
 const bob=walking?Math.sin(time*12)*2:Math.sin(time*2)*.7;
 c.strokeStyle='#34382e';c.lineWidth=6;c.beginPath();c.moveTo(-6,0);c.lineTo(-7+Math.sin(time*12)*(walking?3:0),9);c.moveTo(6,0);c.lineTo(7-Math.sin(time*12)*(walking?3:0),9);c.stroke();
 c.fillStyle=color;c.beginPath();c.moveTo(0,-31+bob);c.lineTo(17,3);c.quadraticCurveTo(0,13,-17,3);c.closePath();c.fill();
 c.fillStyle='#d6c9a1';c.fillRect(-11,-17+bob,22,4);oval(c,0,-30+bob,8,9,'#d8b690');oval(c,0,-35+bob,9,5,'#3f3934');
 c.strokeStyle='#ddd8c0';c.lineWidth=3;c.beginPath();c.moveTo(Math.cos(face)*13,Math.sin(face)*9-9);c.lineTo(Math.cos(face)*30,Math.sin(face)*25-9);c.stroke();c.restore();
}
function spirit(c,e,time){oval(c,e.x,e.y,28,12,'#acdeec22');oval(c,e.x,e.y-22+Math.sin(time*3)*5,14,23,FOES[e.type].color+'88');oval(c,e.x,e.y-25,5,7,'#e2f7f0');}
function beast(c,e,time){oval(c,e.x,e.y+5,24,9,'#152c2460');const color=FOES[e.type].color;oval(c,e.x,e.y-10,23,13,color);oval(c,e.x+19,e.y-17,11,11,color);c.fillStyle='#37453c';c.beginPath();c.moveTo(e.x+12,e.y-23);c.lineTo(e.x+15,e.y-36);c.lineTo(e.x+23,e.y-24);c.fill();c.strokeStyle=color;c.lineWidth=6;c.beginPath();c.moveTo(e.x-16,e.y-10);c.lineTo(e.x-31,e.y-22+Math.sin(time*3)*3);c.stroke();c.fillStyle='#edc77e';c.fillRect(e.x+22,e.y-19,3,3);}
function node(c,n,s){
 if(s.collected.includes(n.id)||(n.kind==='seal'&&s.quests.seal))return;
 if(n.kind==='rest'){
  oval(c,n.x,n.y,40,22,'#e4a85418');if(n.id==='campfire'||n.id.endsWith('-hearth')){for(let i=0;i<8;i++){const a=i*Math.PI/4;oval(c,n.x+Math.cos(a)*21,n.y+Math.sin(a)*12,7,5,'#5b6054');}c.fillStyle='#e78b43';c.beginPath();c.moveTo(n.x-12,n.y);c.quadraticCurveTo(n.x+7,n.y-18,n.x,n.y-38-Math.sin(s.time*5)*4);c.quadraticCurveTo(n.x+28,n.y-7,n.x+12,n.y);c.fill();oval(c,n.x,n.y-8,7,12,'#f9d18c');}
  else {c.fillStyle='#839c96';c.fillRect(n.x-12,n.y-40,24,45);c.fillStyle=s.waystones.includes(n.id)?'#9ee3ca':'#d1d2a2';c.fillRect(n.x-3,n.y-30,6,23);}
 }else if(['herb','moonflower'].includes(n.kind)){c.strokeStyle='#b4d8a0';c.lineWidth=3;for(let i=-1;i<2;i++){c.beginPath();c.moveTo(n.x,n.y);c.lineTo(n.x+i*10,n.y-16);c.stroke();oval(c,n.x+i*10,n.y-16,5,3,'#e3e1b7');}}
 else if(n.kind==='chest'){c.fillStyle='#836343';c.fillRect(n.x-22,n.y-20,44,27);c.strokeStyle='#d3b46e';c.lineWidth=4;c.strokeRect(n.x-22,n.y-20,44,27);c.fillStyle='#f2cf77';c.fillRect(n.x-4,n.y-14,8,11);}
 else if(n.kind==='portal'||n.kind==='exit'){oval(c,n.x,n.y,40,22,'#a9c8bb55');label(c,'➜',n.x,n.y-15,'#f4d48b',36);}
 else if(['vent','beacon','ore','record','supplies','banner','bell','reliquary','lore','throne','arena'].includes(n.kind)){const icons={vent:'⚙',beacon:'✦',ore:'◆',record:'▤',supplies:'▣',banner:'⚑',bell:'♧',reliquary:'◇',lore:'▤',throne:'♜',arena:'⚔'};oval(c,n.x,n.y,26,14,n.kind==='vent'?'#d7874855':'#a0bbce44');label(c,icons[n.kind],n.x,n.y-10,['record','lore','bell'].includes(n.kind)?'#bdd7e2':'#efca83',32);}
 else if(n.kind==='seal'&&!s.quests.seal){oval(c,n.x,n.y,35,18,'#d9b66a55');c.fillStyle='#dec080';c.beginPath();c.moveTo(n.x,n.y-38);c.lineTo(n.x+13,n.y-20);c.lineTo(n.x,n.y-2);c.lineTo(n.x-13,n.y-20);c.fill();}
 if(dist(s.player,n)<160)label(c,n.name,n.x,n.y+30,'#e4d5af',11);
}
export function draw(canvas,s,ui){
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=rect.width,h=rect.height;
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
 const scale=Math.max(.7,Math.min(1.15,w/1280)),cx=Math.max(w/scale/2,Math.min(WORLD.width-w/scale/2,s.player.x)),cy=Math.max(h/scale/2,Math.min(WORLD.height-h/scale/2,s.player.y));
 const view={cx,cy,scale,w,h};c.save();c.translate(w/2-cx*scale,h/2-cy*scale);c.scale(scale,scale);if(!terrainCache.has(s.zone))terrainCache.set(s.zone,terrainLayer(s.zone));c.drawImage(terrainCache.get(s.zone),0,0);const {scenery:SCENERY,buildings:BUILDINGS}=terrainFor(s.zone);
 const visible=o=>Math.abs(o.x-cx)<w/scale/2+100&&Math.abs(o.y-cy)<h/scale/2+130;
 const goal=trackedObjective(s,ui.quest).target;
 if(ui.track&&goal){c.strokeStyle='#f2d28c50';c.setLineDash([5,12]);c.lineWidth=2;c.beginPath();c.moveTo(s.player.x,s.player.y);c.lineTo(goal.x,goal.y);c.stroke();c.setLineDash([]);oval(c,goal.x,goal.y,40+Math.sin(s.time*3)*3,20,'#efd18d22');}
 if(s.path.length){const p=s.path.at(-1);c.strokeStyle='#f4dba1';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y,14,8,0,0,Math.PI*2);c.stroke();}
 for(const e of s.enemies.filter(e=>!e.dead&&e.mark)){c.fillStyle='#d95d4940';c.strokeStyle='#ffad77';c.lineWidth=3;c.beginPath();c.arc(e.mark.x,e.mark.y,e.mark.r,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#f5c5a0';c.font='bold 18px Georgia';c.textAlign='center';c.fillText('!',e.mark.x,e.mark.y+6);}
 nodes(s).filter(visible).forEach(n=>node(c,n,s));
 const things=[...SCENERY.filter(visible).map(o=>({...o,draw:()=>{c.globalAlpha=[s.player,...people(s)].some(n=>Math.abs(o.x-n.x)<o.size&&n.y<o.y&&n.y>o.y-o.size*2)? .35:1;tree(c,o);c.globalAlpha=1;}})),...BUILDINGS.filter(visible).map(b=>({...b,y:b.y+b.h,draw:()=>building(c,b)}))];
 for(const n of people(s).filter(visible))things.push({...n,draw:()=>{humanoid(c,n,n.color,1,false,s.time);label(c,n.name,n.x,n.y-53,'#ece4c5',13);const mark=questMark(s,n.id);label(c,mark,n.x,n.y-76,'#ffd97b',23);}});
 for(const e of s.enemies.filter(e=>!e.dead&&visible(e))){const def=FOES[e.type];things.push({...e,draw:()=>{if(s.target===e.id){c.strokeStyle='#efd085';c.lineWidth=2;c.beginPath();c.ellipse(e.x,e.y+4,def.kind==='boss'?35:25,13,0,0,Math.PI*2);c.stroke();}def.kind==='spirit'?spirit(c,e,s.time):def.kind==='beast'?beast(c,e,s.time):humanoid(c,e,def.color,Math.atan2(s.player.y-e.y,s.player.x-e.x),def.kind==='boss',s.time,e.aggro);if(dist(e,s.player)<350||s.target===e.id){const by=e.y-(def.kind==='boss'?72:54);label(c,def.name,e.x,by,'#edd2bb',11);c.fillStyle='#28332e';c.fillRect(e.x-26,by+7,52,5);c.fillStyle='#bf7058';c.fillRect(e.x-26,by+7,52*Math.max(0,e.hp)/def.hp,5);}}});}
 things.push({...s.player,draw:()=>{if(s.player.shield>0){c.strokeStyle='#bae6f7';c.lineWidth=3;c.beginPath();c.ellipse(s.player.x,s.player.y-15,29,42,0,0,Math.PI*2);c.stroke();}if(s.player.dash>0)oval(c,s.player.x,s.player.y,30,20,'#f7b76c55');humanoid(c,s.player,'#c98454',s.player.face,false,s.time,s.path.length>0||ui.walking);label(c,'Ash',s.player.x,s.player.y-56,'#f6dfa8',13);}});
 things.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
 for(const f of s.effects){c.globalAlpha=f.life/f.total;if(f.kind==='beam'){c.strokeStyle='#ffbd75';c.lineWidth=7;c.shadowBlur=15;c.shadowColor='#e6974c';c.beginPath();c.moveTo(f.x,f.y-15);c.lineTo(f.tx,f.ty-15);c.stroke();c.shadowBlur=0;}else if(f.kind==='slash'){c.strokeStyle='#fbe3ac';c.lineWidth=5;c.beginPath();c.arc(f.x,f.y,50,f.angle-.8,f.angle+.8);c.stroke();}else if(f.kind==='impact'){c.fillStyle='#d7815444';c.beginPath();c.arc(f.x,f.y,f.r,0,Math.PI*2);c.fill();}else label(c,f.text,f.x,f.y-(1-f.life/f.total)*32,f.color,17);}c.globalAlpha=1;
 c.restore();const shade=c.createRadialGradient(w*.5,h*.48,h*.15,w*.5,h*.5,w*.75);shade.addColorStop(0,'#07171600');shade.addColorStop(1,'#07171666');c.fillStyle=shade;c.fillRect(0,0,w,h);
 return view;
}
