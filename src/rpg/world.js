import {WORLD,CAMP,dist} from './data.js';
import {regionData} from './regions.js';
export const ROADS=regionData().roads,BUILDINGS=regionData().buildings;
const segmentDistance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a[0]-t*dx,p.y-a[1]-t*dy);};
export const nearRoad=(p,margin=68,zone='march')=>regionData(zone).roads.some(road=>road.slice(1).some((b,i)=>segmentDistance(p,road[i],b)<margin));
export function water(x,y,r=0,zone='march'){const river=regionData(zone).river;return !!river&&x+r>river.x&&x-r<river.x+river.w&&!river.bridges.some(([y0,h])=>y-r>y0&&y+r<y0+h);}
const sceneryCache=new Map();
export function terrainFor(zone='march'){
 if(sceneryCache.has(zone))return sceneryCache.get(zone);
 const r=regionData(zone);let seed=r.seed;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;},scenery=[];
 for(let i=0;i<420;i++){const x=50+random()*2500,y=55+random()*1590,p={x,y};
  if(water(x,y,45,zone)||nearRoad(p,68,zone)||dist(p,r.camp)<185||[...r.npcs,...r.nodes,...r.spawns.map(([, ,x,y])=>({x,y}))].some(o=>dist(p,o)<90))continue;
  scenery.push({x,y,r:16+random()*11,size:32+random()*24,kind:zone==='march'?(x>1900&&random()>.4?'rock':'tree'):zone==='fen'?'willow':zone==='forge'?'slag':'pillar',shade:random()});
 }
 const result={scenery,buildings:r.buildings,roads:r.roads};sceneryCache.set(zone,result);return result;
}
export const SCENERY=terrainFor().scenery;
export function blocked(x,y,r=14,zone='march'){return x<r+20||y<r+20||x>WORLD.width-r-20||y>WORLD.height-r-20||water(x,y,r,zone)||terrainFor(zone).scenery.some(o=>Math.hypot(o.x-x,o.y-y)<o.r+r)||regionData(zone).buildings.some(b=>x+r>b.x&&x-r<b.x+b.w&&y+r>b.y&&y-r<b.y+b.h);}
export function move(entity,dx,dy,r=14,zone='march'){if(!blocked(entity.x+dx,entity.y,r,zone))entity.x+=dx;if(!blocked(entity.x,entity.y+dy,r,zone))entity.y+=dy;}
const isBlocked=blocked;
export function pathTo(start,end,zone='march'){
 const blocked=(x,y,r=14)=>isBlocked(x,y,r,zone);
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
   if(!clear(x===sx&&y===sy?start:{x:x*size+20,y:y*size+20},{x:a*size+20,y:b*size+20}))continue;
   seen.set(k,key(x,y));queue.push([a,b]);
  }
 }
 if(found===null)return [];
 const out=[];for(let k=found;seen.get(k)!==null;k=seen.get(k))out.push({x:(k%cols)*size+20,y:Math.floor(k/cols)*size+20});
 out.reverse();out.push({x:end.x,y:end.y});return out;
}
export function region(p,zone='march'){if(zone!=='march')return dist(p,regionData(zone).camp)<260?regionData(zone).nodes.find(n=>n.id===regionData(zone).hearth).name:regionData(zone).name;return dist(p,CAMP)<260?'Emberrest Camp':p.x<1070?(p.y<580?'The Hollowwood':'Mistwood Road'):p.x>1980?'The Conclave Approach':p.y<530?'Northwatch Cells':p.y>1120?'The Broken Quarry':'The Ashen Causeway';}
