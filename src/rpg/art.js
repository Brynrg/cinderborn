// Pixel Frog's original Tiny Swords CC0 release. See public/art/credits.html.
const colors=['blue','red','purple','yellow'];
export const ART_FILES=[...['warrior','pawn','archer','house','tower','castle'].flatMap(role=>colors.map(color=>`${role}-${color}`)),'tree','grass','elevation','water','foam','bridge','fire','explosion','death','gold','wood','mine',...Array.from({length:18},(_,i)=>`deco-${String(i+1).padStart(2,'0')}`)];
const images=new Map(),failed=[];let started=false,loaded=0;
const treatments=new Map();
export const artStatus=()=>({ready:loaded+failed.length===ART_FILES.length,loaded,total:ART_FILES.length,failed:[...failed]});
export function loadArt(){
 if(started)return;started=true;
 for(const key of ART_FILES){const img=new Image();images.set(key,img);img.onload=()=>loaded++;img.onerror=()=>failed.push(key);img.src=new URL(`./art/tiny-swords/${key}.png`,document.baseURI).href;}
}
export function artImage(key){const img=images.get(key);return img?.complete&&img.naturalWidth?img:null;}
function treated(key,img,filter,col=0,row=0,cell=0){
 const id=`${key}:${filter}:${col}:${row}:${cell}`;if(treatments.has(id))return treatments.get(id);
 const canvas=document.createElement('canvas');canvas.width=cell||img.width;canvas.height=cell||img.height;
 const ctx=canvas.getContext('2d');ctx.filter=filter;ctx.drawImage(img,col*cell,row*cell,canvas.width,canvas.height,0,0,canvas.width,canvas.height);treatments.set(id,canvas);return canvas;
}
export function sheet(c,key,x,y,{cell=192,col=0,row=0,scale=1,foot=128,flip=false,alpha=1,filter='none'}={}){
 const img=artImage(key);if(!img)return false;
 const source=filter==='none'?img:treated(key,img,filter,col,row,cell);
 c.save();c.imageSmoothingEnabled=false;c.globalAlpha*=alpha;c.translate(Math.round(x),Math.round(y));if(flip)c.scale(-1,1);
 c.drawImage(source,filter==='none'?col*cell:0,filter==='none'?row*cell:0,cell,cell,Math.round(-cell/2*scale),Math.round(-foot*scale),Math.round(cell*scale),Math.round(cell*scale));c.restore();return true;
}
export function prop(c,key,x,y,width,{foot=1,alpha=1,filter='none'}={}){
 const img=artImage(key);if(!img)return false;const h=width*img.height/img.width;
 const source=filter==='none'?img:treated(key,img,filter);
 c.save();c.imageSmoothingEnabled=false;c.globalAlpha*=alpha;c.drawImage(source,Math.round(x-width/2),Math.round(y-h*foot),Math.round(width),Math.round(h));c.restore();return true;
}
export const npcArt=id=>({rook:'warrior-blue','rook-citadel':'warrior-blue',sable:'archer-yellow','sable-citadel':'archer-yellow',iona:'pawn-blue','iona-fen':'pawn-blue',vesper:'archer-purple','vesper-fen':'archer-purple',mara:'archer-red',brann:'pawn-yellow',anja:'pawn-red',edda:'pawn-yellow',kargan:'warrior-red',garen:'warrior-purple',torin:'archer-blue',elara:'pawn-purple',herald:'pawn-yellow'}[id]||'pawn-blue');
export const heroArt=s=>s.gear.weapon==='worn'?'pawn-red':'warrior-yellow';
