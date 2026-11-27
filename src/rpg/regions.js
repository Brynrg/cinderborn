import {NPCS,NODES,SPAWNS,CAMP,FOES} from './data.js';
const npc=(id,name,title,x,y,color)=>({id,name,title,x,y,color});
const node=(id,name,kind,x,y,extra={})=>({id,name,kind,x,y,...extra});
export const REGIONS={
 march:{id:'march',name:'The Ashen March',chapter:'I · A Borrowed Name',level:'Levels 1–6',camp:CAMP,hearth:'campfire',seed:137,biome:'forest',colors:['#284b40','#597257','#827e61'],npcs:NPCS,nodes:NODES,spawns:SPAWNS,
 roads:[[[210,960],[560,960],[900,810],[1140,810],[1460,760],[1780,830],[2420,900]],[[650,960],[740,1230],[1140,1320],[1880,1280]],[[1460,760],[1490,340]],[[1780,830],[2120,410],[2120,310]],[[740,820],[840,330]]],
 buildings:[{x:230,y:840,w:116,h:82,roof:'#755858'},{x:420,y:1020,w:105,h:70,roof:'#596f78'},{x:1400,y:620,w:140,h:85,roof:'#67577b'}],river:{x:1070,w:120,bridges:[[725,170],[1260,120]]}},
 forge:{id:'forge',name:'Cinderreach',chapter:'II · The Price of Iron',level:'Levels 6–11',camp:{x:390,y:900},hearth:'forge-hearth',seed:823,biome:'forge',colors:['#534d41','#79674e','#564841'],
 npcs:[npc('anja','Anja','Voice of the furnace workers',300,1010,'#b99378'),npc('edda','Edda','Exiled master smith',530,1010,'#c68d57'),npc('kargan','Kargan Ironheart','Champion of House Vorthos',640,790,'#ba8a58'),npc('garen','Garen Bloodsworn','Champion of House Oryn',1470,1320,'#a16e73')],
 nodes:[node('forge-hearth','Cinderreach hearth','rest',390,900),node('forge-return','Road to Emberrest','portal',160,900,{to:'march'}),node('forge-fen','The Pilgrim Road','portal',2410,840,{to:'fen'}),node('forge-waystone','Foundry waystone','rest',1360,830),
 node('vent-west','Western pressure valve','vent',1050,390,{guard:'forge-watch-a'}),node('vent-east','Eastern pressure valve','vent',1770,430,{guard:'forge-watch-b'}),node('vent-south','Southern pressure valve','vent',1700,1190,{guard:'forge-watch-c'}),
 node('ore-a','Cinder ore','ore',850,1210),node('ore-b','Cinder ore','ore',1360,540),node('ore-c','Cinder ore','ore',2000,1240),
 node('crate-a','Workers’ supplies','supplies',800,420),node('crate-b','Workers’ supplies','supplies',1180,1250),node('crate-c','Workers’ supplies','supplies',1970,580),
 node('oryn-banner','The lost Oryn banner','banner',2180,1350,{guard:'red-captain'}),node('forge-letter','A letter never sent','lore',830,1470,{lore:'letter'})],
 spawns:[['forge-watch-a','enforcer',1000,460],['forge-watch-b','enforcer',1720,500],['forge-watch-c','enforcer',1640,1140],['slag-a','ashhound',870,610],['slag-b','ashhound',1010,1100],['bolt-a','marksman',1900,670],['bailiff','bailiff',2140,820],['red-captain','captain',2120,1350]],
 roads:[[[160,900],[640,900],[1360,830],[2410,840]],[[640,900],[820,420],[1050,390],[1770,430],[1970,580],[2140,820]],[[640,900],[850,1210],[1180,1250],[1470,1320],[1700,1190],[2180,1350]],[[1360,830],[1360,540]]],
 buildings:[{x:240,y:730,w:115,h:90,roof:'#835e42'},{x:420,y:1070,w:130,h:90,roof:'#645347'},{x:640,y:650,w:150,h:90,roof:'#8e5340'},{x:1160,y:350,w:200,h:125,roof:'#5a514a'},{x:1860,y:920,w:170,h:140,roof:'#66584b'}]},
 fen:{id:'fen',name:'The Veiled Fen',chapter:'III · The Names Beneath',level:'Levels 10–15',camp:{x:390,y:900},hearth:'fen-hearth',seed:609,biome:'fen',colors:['#223e49','#476568','#596b65'],
 npcs:[npc('torin','Torin Stoneveil','Keeper of House Mirex',510,790,'#8b9fa2'),npc('elara','Elara Moonhunger','Champion of House Syla',1540,1290,'#b9a0c3'),npc('vesper-fen','Vesper','A shadow without a house',300,1010,'#a899c4'),npc('iona-fen','Iona','Following the missing names',580,1000,'#9db8a9')],
 nodes:[node('fen-hearth','Pilgrim sanctuary','rest',390,900),node('fen-return','Road to Cinderreach','portal',160,900,{to:'forge'}),node('fen-citadel','The Crown Stair','portal',2410,820,{to:'citadel'}),node('fen-waystone','Archive waystone','rest',1450,810),
 node('record-a','The Census of Ash','record',820,390,{guard:'archive-watch-a',lore:'census'}),node('record-b','The Judge’s Confession','record',1480,380,{guard:'archive-watch-b',lore:'confession'}),node('record-c','The First Covenant','record',2040,1210,{guard:'archive-watch-c',lore:'covenant'}),
 node('moon-a','Moonwell flower','moonflower',810,1240),node('moon-b','Moonwell flower','moonflower',1210,1340),node('moon-c','Moonwell flower','moonflower',1780,1320),
 node('bell-low','Bell of the living','bell',1780,480,{note:1}),node('bell-mid','Bell of the lost','bell',1930,480,{note:2}),node('bell-high','Bell of the unnamed','bell',2080,480,{note:3}),node('fen-reliquary','The quiet reliquary','reliquary',1930,320),
 node('fen-memory','Iona’s childhood cairn','lore',640,1310,{lore:'iona'})],
 spawns:[['archive-watch-a','shade',820,470],['archive-watch-b','marksman',1430,440],['archive-watch-c','shade',1980,1180],['fen-wisp-a','wisp',980,800],['fen-wisp-b','wisp',1590,1040],['fen-stalker','stalker',1080,1290],['archivist','archivist',2150,820]],
 roads:[[[160,900],[580,900],[980,810],[1450,810],[2410,820]],[[580,900],[820,390],[1480,380],[1930,480],[1930,320]],[[580,900],[810,1240],[1210,1340],[1540,1290],[2040,1210],[2150,820]]],
 buildings:[{x:280,y:710,w:120,h:100,roof:'#66677d'},{x:470,y:1090,w:135,h:85,roof:'#596b72'},{x:1410,y:1370,w:150,h:100,roof:'#857390'},{x:2000,y:600,w:160,h:120,roof:'#727b84'}]},
 citadel:{id:'citadel',name:'The Crownless Citadel',chapter:'IV · A Name of Your Own',level:'Levels 14–20',camp:{x:390,y:900},hearth:'citadel-hearth',seed:194,biome:'citadel',colors:['#3c4550','#737c7e','#9b9680'],
 npcs:[npc('rook-citadel','Rook','At the end of the borrowed road',300,1000,'#899fa6'),npc('sable-citadel','Sable','The last honest trader',540,1000,'#c3a075'),npc('herald','The Unnamed Herald','A witness to every coronation',1380,850,'#c9c4a4')],
 nodes:[node('citadel-hearth','The last campfire','rest',390,900),node('citadel-return','Road to the Fen','portal',160,900,{to:'fen'}),node('citadel-waystone','Hall of names hearth','rest',1300,1000),
 node('beacon-iron','Vorthos beacon','beacon',930,390,{guard:'crown-iron'}),node('beacon-moon','Syla beacon','beacon',950,1310,{guard:'crown-moon'}),node('beacon-oath','Oryn beacon','beacon',1690,390,{guard:'crown-oath'}),
 node('throne','The Attainted Roll','throne',2380,850),node('citadel-letter','The noble’s last testament','lore',1590,1280,{lore:'testament'}),node('arena','The Hall of Echoes','arena',590,590)],
 spawns:[['crown-iron','champion',930,480],['crown-moon','shade',950,1230],['crown-oath','champion',1690,480],['crown-patrol-a','marksman',1080,810],['crown-patrol-b','enforcer',1700,1030],['first-judge','judge',2180,850]],
 roads:[[[160,900],[590,900],[1080,810],[1380,850],[2380,850]],[[590,900],[930,390],[1690,390],[2180,850]],[[590,900],[950,1310],[1590,1280],[2180,850]],[[590,900],[590,590]],[[1380,850],[1300,1000]]],
 buildings:[{x:260,y:710,w:115,h:90,roof:'#6f7783'},{x:430,y:1080,w:135,h:80,roof:'#787e84'},{x:1120,y:420,w:210,h:150,roof:'#8c8b83'},{x:1730,y:1260,w:180,h:120,roof:'#797f87'}]}
};
export const regionData=(id='march')=>REGIONS[id]||REGIONS.march;
export const nodes=s=>regionData(s.zone).nodes;
export const allNodes=()=>Object.values(REGIONS).flatMap(r=>r.nodes.map(n=>({...n,zone:r.id})));
export function newEnemies(zone='march'){return regionData(zone).spawns.map(([id,type,x,y])=>({id,type,x,y,homeX:x,homeY:y,hp:FOES[type].hp,dead:false,respawn:0,windup:0,wait:1,mark:null,aggro:false,recovery:0,attackIndex:0}));}
export const campaignDefaults=()=>({forgeAccepted:false,forgeChoice:'',temper:'',supplies:false,orynStarted:false,oryn:'',fenAccepted:false,archiveChoice:'',sylaStarted:false,syla:false,medicine:false,bellStep:0,bellSolved:false,finale:false,ending:'',echoes:0,echoActive:false});
export function unlocked(s,id){return id==='march'||id==='forge'&&s.quests.complete||id==='fen'&&!!s.campaign?.forgeChoice||id==='citadel'&&!!s.campaign?.archiveChoice;}
export function destination(s,zone,target){if((s.zone||'march')===zone)return target;const order=['march','forge','fen','citadel'],toward=order[order.indexOf(s.zone||'march')+(order.indexOf(zone)>order.indexOf(s.zone||'march')?1:-1)];return nodes(s).find(n=>n.to===toward)||NODES.find(n=>n.id==='exit');}

export function regionalPeople(s,zone=s.zone){
 const enemies=zone===s.zone?s.enemies:s.regions[zone]?.enemies||[];
 return regionData(zone).npcs.map(n=>n.id==='kargan'&&enemies.some(e=>e.id==='bailiff'&&e.dead)?{...n,x:2270,y:820,title:'At the freed foundry'}:n.id==='torin'&&enemies.some(e=>e.id==='archivist'&&e.dead)?{...n,x:2290,y:820,title:'At the recovered archive'}:n);
}
