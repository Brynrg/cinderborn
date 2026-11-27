import {WORLD,dist} from './data.js';
import {regionData} from './regions.js';
import {nearRoad,water} from './world.js';
import {artImage,artStatus,sheet,prop} from './art.js';
const cache=new Map();let textured=false;
const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
function terrainLayer(zone){
 const r=regionData(zone),ROADS=r.roads,NPCS=r.npcs;
 const cv=document.createElement('canvas');cv.width=WORLD.width;cv.height=WORLD.height;const c=cv.getContext('2d');
 c.fillStyle='#5b7352';c.fillRect(0,0,cv.width,cv.height);
 const g=c.createLinearGradient(500,0,2450,1400);g.addColorStop(0,r.colors[0]);g.addColorStop(.4,r.colors[1]);g.addColorStop(1,r.colors[2]);c.fillStyle=g;c.fillRect(0,0,cv.width,cv.height);
 const texture=artImage('grass');if(texture){const tile=document.createElement('canvas');tile.width=tile.height=64;const tc=tile.getContext('2d');tc.filter=zone==='forge'||zone==='citadel'?'saturate(.15)':'none';tc.drawImage(texture,zone==='forge'||zone==='citadel'?384:64,64,64,64,0,0,64,64);c.save();c.globalAlpha=zone==='march'?.4:.17;c.fillStyle=c.createPattern(tile,'repeat');c.fillRect(0,0,WORLD.width,WORLD.height);c.restore();}
 for(let i=0;i<9000;i++){const x=(i*137.53)%2600,y=(i*73.91)%1700;c.fillStyle=i%4?'#c4c78d0b':'#142e2520';c.fillRect(x,y,3+i%7,2);}
 for(const road of ROADS){c.lineJoin='round';c.lineCap='round';for(const [width,color] of [[96,'#40523c55'],[70,'#9e9473'],[52,'#b3a583']]){c.strokeStyle=color;c.lineWidth=width;c.beginPath();road.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}}
 if(zone==='march'){
 c.fillStyle='#253e3d';c.fillRect(1050,0,160,1700);c.fillStyle='#437472';c.fillRect(1070,0,120,1700);
 for(let y=0;y<1700;y+=19){c.strokeStyle=y%2?'#89af9e50':'#acd0b030';c.lineWidth=2;c.beginPath();c.moveTo(1080,y);c.quadraticCurveTo(1125,y+8,1180,y+1);c.stroke();}
 for(const [y,h] of [[725,170],[1260,120]]){c.fillStyle='#403e31';c.fillRect(1045,y-9,170,h+18);c.fillStyle='#a99a78';c.fillRect(1050,y,160,h);for(let x=1056;x<1210;x+=18){c.fillStyle='#6c664d';c.fillRect(x,y,3,h);}c.fillStyle='#d2c29a';c.fillRect(1040,y-10,180,9);c.fillRect(1040,y+h,180,9);}
 const bridge=artImage('bridge');if(bridge){c.save();c.imageSmoothingEnabled=false;for(const [y,h] of [[725,170],[1260,120]])c.drawImage(bridge,0,0,192,64,1038,y-12,184,h+24);c.restore();}
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
 // Sparse ground details stay away from roads and interactable objects.
 for(let i=0;i<380;i++){const x=(i*137.53+71)%2540+30,y=(i*271.91+31)%1640+30;if(nearRoad({x,y},48,zone)||water(x,y,18,zone)||r.nodes.some(n=>Math.hypot(x-n.x,y-n.y)<70))continue;const key=zone==='forge'?'deco-'+(i%2?'04':'14'):zone==='citadel'?'deco-'+(i%2?'05':'15'):'deco-'+(['01','02','07','10','11'][i%5]);prop(c,key,x,y,40+i%18,{foot:.8,alpha:.78,filter:zone==='fen'?'hue-rotate(28deg) saturate(.65)':'none'});}
 for(let i=0;i<500;i++){const x=(i*193.91)%2560+20,y=(i*97.17)%1660+20;if(!nearRoad({x,y},24,zone)||water(x,y,12,zone))continue;c.fillStyle=i%2?'#f8dfac20':'#3e453b25';c.fillRect(x,y,3+i%6,2+i%3);}
 return cv;
}
function oldTree(c,o){
 oval(c,o.x+10,o.y+5,o.size*.7,20,'#122b2355');c.fillStyle='#514e36';c.fillRect(o.x-7,o.y-27,14,34);
 if(o.kind==='pillar'){c.fillStyle='#879094';c.fillRect(o.x-13,o.y-o.size*1.2,26,o.size*1.2);c.fillStyle='#c0bfae';c.fillRect(o.x-19,o.y-o.size*1.2,38,10);c.fillRect(o.x-18,o.y,36,8);return;}
 if(o.kind==='rock'||o.kind==='slag'){c.fillStyle=o.kind==='slag'?'#745a4c':'#7b8978';c.beginPath();c.moveTo(o.x-o.size*.7,o.y);c.lineTo(o.x-o.size*.5,o.y-o.size*.55);c.lineTo(o.x+o.size*.15,o.y-o.size*.8);c.lineTo(o.x+o.size*.65,o.y-15);c.lineTo(o.x+o.size*.4,o.y+10);c.closePath();c.fill();c.strokeStyle='#b2b4a080';c.stroke();return;}
 const palette=o.kind==='willow'?['#385b60','#54777b','#7b9b94']:o.shade>.5?['#244b3c','#34634a','#477554']:['#284e45','#38695a','#538373'];
 for(let i=0;i<3;i++){const yy=o.y-o.size*.4-i*o.size*.38,rx=o.size*(.85-i*.18);c.fillStyle=palette[i];c.beginPath();c.moveTo(o.x,yy-o.size*.85);c.quadraticCurveTo(o.x+rx*.6,yy-o.size*.25,o.x+rx,yy+8);c.quadraticCurveTo(o.x,yy+24,o.x-rx,yy+8);c.quadraticCurveTo(o.x-rx*.6,yy-o.size*.25,o.x,yy-o.size*.85);c.fill();}
}
function oldBuilding(c,b){
 c.fillStyle='#192b2455';c.fillRect(b.x+15,b.y+20,b.w,b.h);c.fillStyle='#b3a686';c.fillRect(b.x,b.y,b.w,b.h);c.fillStyle='#493d31';c.fillRect(b.x+b.w*.4,b.y+b.h-30,24,30);
 c.fillStyle=b.roof;c.beginPath();c.moveTo(b.x-10,b.y+20);c.lineTo(b.x+b.w/2,b.y-35);c.lineTo(b.x+b.w+10,b.y+20);c.lineTo(b.x+b.w+10,b.y+45);c.lineTo(b.x-10,b.y+45);c.closePath();c.fill();
 c.strokeStyle='#d5b99066';c.lineWidth=3;c.beginPath();c.moveTo(b.x-10,b.y+20);c.lineTo(b.x+b.w/2,b.y-35);c.lineTo(b.x+b.w+10,b.y+20);c.stroke();
 c.fillStyle='#f2bc7280';c.fillRect(b.x+12,b.y+45,17,17);
}

export function terrain(zone){if(artStatus().ready&&!textured){cache.clear();textured=true;}if(!cache.has(zone))cache.set(zone,terrainLayer(zone));return cache.get(zone);}
export function drawScenery(c,o,s,reduced){
 if(o.kind==='tree'||o.kind==='willow'){
  const filter=o.kind==='willow'?'hue-rotate(27deg) saturate(.58) brightness(.88)':o.shade>.55?'saturate(.8) brightness(.85)':'saturate(.82)';
  const frame=reduced?0:Math.floor(s.time*7+o.x)%6;
  if(sheet(c,'tree',o.x,o.y,{col:frame%4,row:Math.floor(frame/4),foot:170,scale:o.size/70,filter})){
   if(o.kind==='willow'){c.strokeStyle='#95b8a247';c.lineWidth=2;for(let i=0;i<4;i++){c.beginPath();const x=o.x-20+i*13;c.moveTo(x,o.y-52);c.quadraticCurveTo(x+5,o.y-30,x+Math.sin((reduced?0:s.time)+i)*3,o.y-14);c.stroke();}}
   return;
  }
 }
 if(['rock','slag'].includes(o.kind)&&prop(c,'deco-06',o.x,o.y,o.size*1.8,{foot:.72,filter:o.kind==='slag'?'sepia(.7) saturate(.7) brightness(.75)':'none'}))return;
 if(o.kind==='pillar'){
  if(o.shade<.25&&prop(c,'deco-06',o.x,o.y,o.size*1.7,{foot:.72,filter:'saturate(.35)'}))return;const h=o.size*1.35;c.fillStyle='#17253455';c.beginPath();c.ellipse(o.x+10,o.y+3,26,11,0,0,Math.PI*2);c.fill();c.fillStyle='#555c69';c.fillRect(o.x-18,o.y-6,36,11);c.fillStyle='#9b9c96';c.fillRect(o.x-13,o.y-h,26,h);c.fillStyle='#c7c4ad';c.fillRect(o.x-13,o.y-h,7,h);c.fillStyle='#777d80';c.fillRect(o.x+8,o.y-h,5,h);c.fillStyle='#d6cfb4';c.fillRect(o.x-21,o.y-h-9,42,11);c.fillRect(o.x-22,o.y-6,44,7);c.fillStyle='#7c8583';for(let i=0;i<4;i++){c.fillRect(o.x-12,o.y-12-i*16,24,2);c.fillRect(o.x-10,o.y-17-i*16,3,3);}c.fillStyle='#4b6361';c.fillRect(o.x-20,o.y-4,11,3);c.fillRect(o.x+10,o.y-6,8,3);c.strokeStyle='#5c6570';c.lineWidth=2;c.beginPath();c.moveTo(o.x+3,o.y-h);c.lineTo(o.x-2,o.y-h+16);c.lineTo(o.x+4,o.y-h+22);c.stroke();return;
 }
 oldTree(c,o);
}
export function drawBuilding(c,b,zone,index=0){
 const color=zone==='march'?(index%2?'blue':'red'):zone==='forge'?'red':zone==='fen'?'purple':'yellow';
 const key=zone==='forge'&&b.w>160?'mine':b.w>=180?'castle-'+color:b.w>=145?'tower-'+color:'house-'+color;
 if(!prop(c,key,b.x+b.w/2,b.y+b.h,b.w+(key.startsWith('castle')?70:35),{foot:key==='mine'?.88:key.startsWith('castle')?.85:.9,filter:zone==='forge'?'saturate(.65) brightness(.83)':zone==='fen'?'saturate(.65)':'saturate(.8)'}))oldBuilding(c,b);
}
export function worldAtmosphere(c,s,view,reduced){
 const t=reduced?0:s.time,zone=s.zone;
 if(zone==='march'){
  c.save();c.beginPath();c.rect(1070,0,120,725);c.rect(1070,895,120,365);c.rect(1070,1380,120,320);c.clip();
  const img=artImage('water');if(img){c.fillStyle=c.createPattern(img,'repeat');c.fillRect(1070,0,120,1700);}
  for(let i=0;i<42;i++){const y=(i*47+t*12)%1700;c.strokeStyle='#b2e5d160';c.lineWidth=2;c.beginPath();c.moveTo(1080+Math.sin(i)*15,y);c.quadraticCurveTo(1120,y+6,1180+Math.sin(i+1)*9,y);c.stroke();}c.restore();
 }
 if(zone==='forge'){for(const [x,y] of [[1060,220],[1730,230],[1770,1400]]){sheet(c,'fire',x,y,{cell:128,col:Math.floor(t*10)%7,foot:99,scale:.65});}}
 const count=zone==='fen'?24:zone==='forge'?36:18;
 for(let i=0;i<count;i++){
  const x=(i*173.7+t*(zone==='forge'?7:3))%2600,y=(i*231.3-t*(zone==='forge'?20:5)+17000)%1700;
  if(Math.abs(x-view.cx)>view.w/view.scale/2+30||Math.abs(y-view.cy)>view.h/view.scale/2+30)continue;
  c.globalAlpha=reduced?.25:.2+(Math.sin(t*1.3+i)+1)*.2;c.fillStyle=zone==='forge'?'#ffc078':zone==='fen'?'#a9efe3':'#e9dbaa';c.fillRect(x,y,zone==='forge'?3:2,zone==='forge'?4:2);
 }c.globalAlpha=1;
 if(zone==='fen'){for(let i=0;i<4;i++){const x=(i*730+t*9)%3300-350,y=380+i*390;const g=c.createRadialGradient(x,y,10,x,y,260);g.addColorStop(0,'#b0d8db0b');g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-260,y-260,520,520);}}
}
