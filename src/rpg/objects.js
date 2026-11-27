import {sheet,prop} from './art.js';
const ellipse=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
export function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function crystal(c,x,y,color){c.fillStyle=color;c.beginPath();c.moveTo(x,y-33);c.lineTo(x+10,y-18);c.lineTo(x,y+2);c.lineTo(x-10,y-18);c.closePath();c.fill();c.fillStyle='#ffffff55';c.beginPath();c.moveTo(x,y-33);c.lineTo(x,y+2);c.lineTo(x-10,y-18);c.fill();}
function crate(c,x,y){c.fillStyle='#29323c';c.fillRect(x-25,y-27,50,35);c.fillStyle='#8e6346';c.fillRect(x-22,y-24,44,29);c.fillStyle='#c19461';c.fillRect(x-22,y-24,44,6);c.fillStyle='#b08052';c.fillRect(x-20,y-17,5,20);c.fillRect(x+15,y-17,5,20);c.strokeStyle='#634a3e';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.moveTo(x-14+i*10,y-17);c.lineTo(x-14+i*10,y+3);c.stroke();}c.fillStyle='#dbb982';c.fillRect(x-3,y-15,6,8);}
export function drawObject(c,n,s,time){
 const {x,y}=n;ellipse(c,x,y+4,23,8,'#14223545');
 if(n.kind==='rest'){
  glow(c,x,y-10,95,'#edb35e20');
  if(n.id==='campfire'||n.id.endsWith('-hearth')){
   for(let i=0;i<8;i++){const a=i*Math.PI/4;ellipse(c,x+Math.cos(a)*20,y+Math.sin(a)*10,6,4,'#7d8c88');}
   sheet(c,'fire',x,y,{cell:128,col:Math.floor(time*10)%7,foot:99,scale:.57});
   for(let i=0;i<4;i++){const life=(time*.6+i*.23)%1;c.fillStyle='#ffd58c';c.globalAlpha=1-life;c.fillRect(x+Math.sin(i*8+time)*14,y-20-life*42,2,3);}c.globalAlpha=1;
  }else{c.fillStyle='#263b45';c.beginPath();c.moveTo(x-16,y);c.lineTo(x-13,y-43);c.lineTo(x,y-53);c.lineTo(x+15,y-40);c.lineTo(x+18,y);c.fill();c.fillStyle='#798f91';c.fillRect(x-10,y-40,15,38);crystal(c,x,y-6,s.waystones.includes(n.id)?'#97e9d0':'#c9c8a0');}
 }else if(['herb','moonflower'].includes(n.kind)){
  const moon=n.kind==='moonflower';if(moon)glow(c,x,y-16,35,'#bcabf92b');
  for(let i=-1;i<=1;i++){const dx=i*9,dy=Math.abs(i)*5;c.strokeStyle='#587a61';c.lineWidth=3;c.beginPath();c.moveTo(x,y);c.lineTo(x+dx,y-22+dy);c.stroke();ellipse(c,x+dx-4,y-11+dy,5,2,'#a3c896');for(let j=0;j<5;j++){const a=j*Math.PI*2/5;ellipse(c,x+dx+Math.cos(a)*4,y-24+dy+Math.sin(a)*3,3,2,moon?'#d8c7f2':'#f6e8bd');}ellipse(c,x+dx,y-24+dy,2,2,'#ebbd68');}
 }else if(['chest','supplies','reliquary'].includes(n.kind)){crate(c,x,y);if(n.kind==='reliquary'){glow(c,x,y-15,38,'#b8a4e733');crystal(c,x,y-12,'#ccabe9');}}
 else if(n.kind==='ore'){prop(c,'gold',x,y,75,{foot:.65});glow(c,x,y-8,35,'#edb46e22');}
 else if(n.kind==='vent'){
  c.fillStyle='#333d46';c.fillRect(x-30,y-15,60,19);c.fillStyle='#77878b';c.fillRect(x-27,y-15,54,5);c.fillRect(x-5,y-36,10,31);c.strokeStyle='#c48b58';c.lineWidth=5;c.beginPath();c.arc(x,y-36,17,0,Math.PI*2);c.moveTo(x-14,y-36);c.lineTo(x+14,y-36);c.moveTo(x,y-50);c.lineTo(x,y-22);c.stroke();glow(c,x,y,50,'#f0a25c30');
 }else if(n.kind==='beacon'){
  c.fillStyle='#5c6873';c.fillRect(x-20,y-11,40,17);c.fillStyle='#b4b4a4';c.fillRect(x-24,y-14,48,7);c.fillRect(x-10,y-45,20,31);glow(c,x,y-40,70,'#e9ba8340');sheet(c,'fire',x,y-34,{cell:128,col:Math.floor(time*10)%7,foot:99,scale:.4});
 }else if(['record','lore','throne'].includes(n.kind)){
  const big=n.kind==='throne';c.save();c.translate(x,y);if(big)c.scale(1.35,1.35);
  c.fillStyle='#46525c';c.fillRect(-18,-10,36,15);c.fillStyle='#9ca89f';c.fillRect(-21,-14,42,7);c.fillStyle='#b69b6f';c.fillRect(-15,-40,30,27);c.fillStyle='#e5d8b2';c.fillRect(-12,-39,24,27);c.fillStyle='#8d8070';for(let i=0;i<4;i++)c.fillRect(-7,-33+i*5,14-i%2*4,2);c.fillStyle='#ac624e';ellipse(c,5,-16,4,4,'#ae6451');if(big){c.strokeStyle='#f1ce83';c.lineWidth=2;c.strokeRect(-17,-43,34,32);glow(c,0,-30,70,'#e9ca7b25');}c.restore();
 }else if(n.kind==='banner'){
  c.strokeStyle='#3e3a3c';c.lineWidth=5;c.beginPath();c.moveTo(x,y+3);c.lineTo(x,y-65);c.stroke();c.fillStyle='#dbb675';c.fillRect(x-2,y-68,4,5);c.fillStyle='#a14f55';c.beginPath();c.moveTo(x+3,y-61);c.lineTo(x+31,y-58+Math.sin(time*3)*3);c.lineTo(x+27,y-27);c.lineTo(x+3,y-31);c.fill();c.strokeStyle='#e2c08e';c.lineWidth=2;c.beginPath();c.moveTo(x+11,y-52);c.lineTo(x+23,y-38);c.moveTo(x+23,y-52);c.lineTo(x+11,y-38);c.stroke();
 }else if(n.kind==='bell'){
  c.strokeStyle='#5f554d';c.lineWidth=5;c.beginPath();c.moveTo(x-20,y);c.lineTo(x-20,y-55);c.lineTo(x+20,y-55);c.lineTo(x+20,y);c.stroke();c.fillStyle='#c9a671';c.beginPath();c.moveTo(x-6,y-43);c.quadraticCurveTo(x-14,y-40,x-14,y-24);c.lineTo(x-20,y-19);c.lineTo(x+20,y-19);c.lineTo(x+14,y-24);c.quadraticCurveTo(x+14,y-40,x+6,y-43);c.fill();ellipse(c,x,y-17,4,5,'#7f6a50');c.fillStyle='#f3d49b';c.fillRect(x-8,y-38,3,14);
 }else if(n.kind==='arena'){
  glow(c,x,y-25,75,'#acb2ed2a');c.strokeStyle='#9da7b0';c.lineWidth=11;c.beginPath();c.moveTo(x-27,y);c.lineTo(x-27,y-53);c.quadraticCurveTo(x,y-83,x+27,y-53);c.lineTo(x+27,y);c.stroke();c.strokeStyle='#e2ce9b';c.lineWidth=2;c.beginPath();c.ellipse(x,y-30,15+Math.sin(time)*2,26,0,0,Math.PI*2);c.stroke();
 }else if(n.kind==='seal'){glow(c,x,y-20,60,'#d9bb6c30');crystal(c,x,y-5,'#e8bd71');}
 else if(['portal','exit'].includes(n.kind)){
  c.strokeStyle='#d5bf88';c.lineWidth=3;for(let i=0;i<3;i++){const dx=(n.to==='march'||n.id.endsWith('return')?-1:1)*(i*12-12);c.beginPath();c.moveTo(x+dx-4,y-9);c.lineTo(x+dx+4,y-4);c.lineTo(x+dx-4,y+1);c.stroke();}glow(c,x,y,55,'#a2d1c82a');
 }
}
