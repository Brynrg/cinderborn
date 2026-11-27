import {dist} from './data.js';
// Positive clearance is safe. Padding accounts for Ash's body, not just its center.
export function clearance(p,m,pad=12){
 if(!m)return Infinity;
 if(m.shape==='lane'){
  const dx=Math.cos(m.angle)*m.length,dy=Math.sin(m.angle)*m.length,t=Math.max(0,Math.min(1,((p.x-m.x)*dx+(p.y-m.y)*dy)/(dx*dx+dy*dy)));
  return Math.hypot(p.x-m.x-t*dx,p.y-m.y-t*dy)-m.r-pad;
 }
 const d=dist(p,m);return m.shape==='ring'?Math.max(m.inner-pad-d,d-m.r-pad):d-m.r-pad;
}
export const inDanger=(p,m,pad=12)=>clearance(p,m,pad)<0;
export function validMark(m){
 const n=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
 return !m||(n(m.x,0,2600)&&n(m.y,0,1700)&&n(m.r,0,240)&&[undefined,'circle','lane','ring'].includes(m.shape)&&(m.shape!=='lane'||n(m.length,1,650)&&n(m.angle,-Math.PI,Math.PI))&&(m.shape!=='ring'||n(m.inner,1,m.r)));
}
