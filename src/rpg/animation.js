// Presentation-only state: never written into the player's save.
export function observeActor(previous,u,time,{attack=0,cast=0}={}){
 if(!previous)return {x:u.x,y:u.y,hp:u.hp,dead:!!u.dead,time,attack,cast,windup:u.windup||0,face:u.face||0,moving:false,hitAt:-100,attackAt:-100,castAt:-100,deathAt:-100};
 if(previous.time===time&&previous.hp===u.hp&&previous.attack===attack&&previous.cast===cast)return previous;
 const moved=Math.hypot(u.x-previous.x,u.y-previous.y)>.1;
 return {...previous,x:u.x,y:u.y,hp:u.hp,dead:!!u.dead,time,attack,cast,windup:u.windup||0,
  face:moved?Math.atan2(u.y-previous.y,u.x-previous.x):(u.face??previous.face),moving:moved,
  hitAt:u.hp<previous.hp?time:previous.hitAt,
  attackAt:attack>previous.attack+.05||previous.windup>0&&!u.windup?time:previous.attackAt,
  castAt:cast>previous.cast+.05?time:previous.castAt,
  deathAt:u.dead&&!previous.dead?time:previous.deathAt};
}
export function actorPose(v,time,{kind='warrior',windup=0,duration=1.25,reduced=false}={}){
 const flip=Math.cos(v.face)<-.1,clock=reduced?0:time;
 if(v.dead)return {action:'death',col:Math.min(6,Math.floor((time-v.deathAt)*10)),row:0,flip,cell:128};
 if(windup>0)return {action:'windup',col:Math.min(2,Math.floor((1-windup/duration)*3)),row:kind==='archer'?2:2,flip};
 if(time-v.attackAt<.3)return {action:'attack',col:3+Math.min(2,Math.floor((time-v.attackAt)*10)),row:kind==='archer'?2:kind==='pawn'?2:Math.sin(v.face)>.6?4:Math.sin(v.face)<-.6?6:2,flip};
 if(time-v.castAt<.6)return {action:'cast',col:Math.min(5,Math.floor((time-v.castAt)*10)),row:kind==='pawn'?4:kind==='archer'?2:0,flip};
 return {action:v.moving?'walk':'idle',col:Math.floor(clock*(v.moving?10:5))%6,row:v.moving?1:0,flip};
}
