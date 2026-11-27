import {WORLD,CAMP,NPCS,NODES,SPAWNS,dist} from './data.js';
export const ROADS=[[[210,960],[560,960],[900,810],[1140,810],[1460,760],[1780,830],[2420,900]],[[650,960],[740,1230],[1140,1320],[1880,1280]],[[1460,760],[1490,340]],[[1780,830],[2120,410],[2120,310]],[[740,820],[840,330]]];
const segmentDistance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a[0]-t*dx,p.y-a[1]-t*dy);};
export const nearRoad=(p,margin=68)=>ROADS.some(road=>road.slice(1).some((b,i)=>segmentDistance(p,road[i],b)<margin));
export function water(x,y,r=0){return x+r>1070&&x-r<1190&&!((y-r>725&&y+r<895)||(y-r>1260&&y+r<1380));}
let seed=137;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
export const SCENERY=[];
for(let i=0;i<420;i++){
 const x=50+random()*2500,y=55+random()*1590,p={x,y};
 if(water(x,y,45)||nearRoad(p)||dist(p,CAMP)<185||[...NPCS,...NODES,...SPAWNS.map(([, ,x,y])=>({x,y}))].some(o=>dist(p,o)<90))continue;
 SCENERY.push({x,y,r:16+random()*11,size:32+random()*24,kind:x>1900&&random()>.4?'rock':'tree',shade:random()});
}
export const BUILDINGS=[{x:230,y:840,w:116,h:82,roof:'#755858'},{x:420,y:1020,w:105,h:70,roof:'#596f78'},{x:1400,y:620,w:140,h:85,roof:'#67577b'}];
export function blocked(x,y,r=14){return x<r+20||y<r+20||x>WORLD.width-r-20||y>WORLD.height-r-20||water(x,y,r)||SCENERY.some(o=>Math.hypot(o.x-x,o.y-y)<o.r+r)||BUILDINGS.some(b=>x+r>b.x&&x-r<b.x+b.w&&y+r>b.y&&y-r<b.y+b.h);}
export function move(entity,dx,dy,r=14){if(!blocked(entity.x+dx,entity.y,r))entity.x+=dx;if(!blocked(entity.x,entity.y+dy,r))entity.y+=dy;}
export function pathTo(start,end){
 const size=40,cols=65,rows=43,toCell=p=>[Math.floor(p.x/size),Math.floor(p.y/size)],key=(x,y)=>y*cols+x;
 const [sx,sy]=toCell(start),[ex,ey]=toCell(end);if(blocked(end.x,end.y))return [];
 const clear=(a,b)=>{const n=Math.ceil(dist(a,b)/8);for(let i=0;i<=n;i++)if(blocked(a.x+(b.x-a.x)*i/Math.max(1,n),a.y+(b.y-a.y)*i/Math.max(1,n),15))return false;return true;};
 const candidates=[];for(let x=ex-1;x<=ex+1;x++)for(let y=ey-1;y<=ey+1;y++){const p={x:x*size+20,y:y*size+20};if(x>=0&&x<cols&&y>=0&&y<rows&&!blocked(p.x,p.y,16)&&clear(p,end))candidates.push({x,y,d:dist(p,end)});}
 candidates.sort((a,b)=>a.d-b.d);if(!candidates.length)return [];const {x:tx,y:ty}=candidates[0];
 const queue=[[sx,sy]],seen=new Map([[key(sx,sy),null]]);let found=null;
 for(let index=0;index<queue.length;index++){
  const [x,y]=queue[index];if(x===tx&&y===ty){found=key(x,y);break;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const a=x+dx,b=y+dy,k=key(a,b);if(a<0||a>=cols||b<0||b>=rows||seen.has(k)||blocked(a*size+20,b*size+20,16))continue;
   seen.set(k,key(x,y));queue.push([a,b]);
  }
 }
 if(found===null)return [];
 const out=[];for(let k=found;seen.get(k)!==null;k=seen.get(k))out.push({x:(k%cols)*size+20,y:Math.floor(k/cols)*size+20});
 out.reverse();out.push({x:end.x,y:end.y});return out;
}
export function region(p){return dist(p,CAMP)<260?'Emberrest Camp':p.x<1070?(p.y<580?'The Hollowwood':'Mistwood Road'):p.x>1980?'The Conclave Approach':p.y<530?'Northwatch Cells':p.y>1120?'The Broken Quarry':'The Ashen Causeway';}
