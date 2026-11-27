export const WORLD={width:2600,height:1700};
export const CAMP={x:360,y:960};
export const NPCS=[
 {id:'rook',name:'Rook',title:'Warden of the exiles',x:435,y:870,color:'#77989e'},
 {id:'iona',name:'Iona',title:'Herald & healer',x:270,y:1040,color:'#99baa2'},
 {id:'sable',name:'Sable',title:'Scout & outfitter',x:560,y:1060,color:'#bf9b6d'},
 {id:'vesper',name:'Vesper',title:'Champion of House Kaelen',x:1460,y:730,color:'#b39ac4'},
 {id:'mara',name:'Mara',title:'Imprisoned wayfinder',x:1490,y:340,color:'#c6ac77'},
 {id:'brann',name:'Brann',title:'Imprisoned bridgewright',x:1890,y:1280,color:'#88a2b4'},
];
export const NODES=[
 {id:'campfire',name:'Refugee hearth',kind:'rest',x:360,y:960},
 {id:'waystone',name:'Causeway waystone',kind:'rest',x:1450,y:890},
 {id:'herb-a',name:'Silverleaf',kind:'herb',x:670,y:1070},
 {id:'herb-b',name:'Silverleaf',kind:'herb',x:850,y:990},
 {id:'herb-c',name:'Silverleaf',kind:'herb',x:740,y:1230},
 {id:'cache',name:'Lost caravan chest',kind:'chest',x:840,y:410},
 {id:'shrine',name:'The trial seal',kind:'seal',x:2120,y:310},
 {id:'exit',name:'Road to the Conclave',kind:'exit',x:2410,y:900},
];
export const FOES={
 wolf:{name:'Ash wolf',hp:30,atk:8,speed:105,range:55,xp:18,coins:7,color:'#b6ab96',kind:'beast'},
 raider:{name:'Road reaver',hp:46,atk:10,speed:90,range:60,xp:24,coins:10,color:'#9d6656',kind:'blade'},
 jailer:{name:'Conclave jailer',hp:80,atk:12,speed:80,range:66,xp:45,coins:18,color:'#9a9f9e',kind:'warden'},
 warden:{name:'The Seal Warden',hp:165,atk:19,speed:75,range:115,xp:85,coins:30,color:'#ae8a56',kind:'boss'},
 commander:{name:'Arbiter of the Crossing',hp:235,atk:22,speed:85,range:125,xp:120,coins:45,color:'#bfc6cb',kind:'boss'},
 hound:{name:'Hollowfang',hp:115,atk:15,speed:120,range:85,xp:65,coins:22,color:'#6d9da0',kind:'beast'},
};
export const SPAWNS=[
 ['wolf-a','wolf',730,820],['wolf-b','wolf',870,920],['wolf-c','wolf',740,1150],
 ['reaver-a','raider',1330,1030],['reaver-b','raider',1690,930],['reaver-c','raider',1770,580],
 ['north-jailer','jailer',1420,340],['south-jailer','jailer',1810,1280],
 ['seal-warden','warden',2120,410],['arbiter','commander',2260,890],['hollowfang','hound',840,330],
];
export const ITEMS={
 worn:{name:'Worn exile blade',slot:'weapon',atk:0,rarity:'Common',description:'A serviceable edge. A long way from home.'},
 iron:{name:'Roadwarden steel',slot:'weapon',atk:4,rarity:'Fine',description:'+4 weapon damage. Forged for the long road.'},
 cinder:{name:'Cindersteel',slot:'weapon',atk:8,rarity:'Rare',description:'+8 weapon damage. The flame finally has a name.'},
 cloak:{name:'Traveller’s cloak',slot:'armor',hp:0,rarity:'Common',description:'A stolen crest stitched into the lining.'},
 ranger:{name:'Mistwood mantle',slot:'armor',hp:22,rarity:'Fine',description:'+22 maximum health. The forest keeps its own.'},
 aegis:{name:'Warden’s coat',slot:'armor',hp:38,rarity:'Rare',description:'+38 maximum health. Taken from the Conclave’s sentinel.'},
};
export const SKILLS=[
 {id:'slash',key:'1',name:'Steel',icon:'⚔',cost:0,cd:.6,detail:'Strike a nearby enemy. Hold Space to keep attacking.'},
 {id:'fire',key:'2',name:'Firebrand',icon:'✦',cost:18,cd:3,detail:'A ranged burst of forbidden flame. Raises suspicion.'},
 {id:'mend',key:'3',name:'Mend',icon:'✚',cost:25,cd:10,detail:'Restore health with Embercraft.'},
 {id:'dash',key:'4',name:'Veilstep',icon:'➜',cost:12,cd:3.5,detail:'Dash in your movement direction. Evade attacks during the dash.'},
];
export const TALENTS={steel:{name:'Tempered steel',detail:'+2 sword damage per rank.'},flame:{name:'Living flame',detail:'+5 Firebrand damage per rank.'},resolve:{name:'Unbroken',detail:'+15 maximum health per rank.'}};
export const LORE=[
 ['The Cinder','You are Ash, an exile wearing a dead noble’s signet. The Conclave accepts bloodlines, not refugees. Your forbidden fire could expose the lie—or keep your people alive.'],
 ['House Vorthos','Kargan Ironheart. “Iron wills temper the soul.” Their champions prize strength and conquest.'],
 ['House Kaelen','Vespera Nightwhisper, called Vesper on the road. “Shadows dance where light dares not.” Her bargain may be the first honest promise in a kingdom of stolen names.'],
 ['House Mirex','Torin Stoneveil. “Silence is the sharpest blade.” The stone remembers every footstep.'],
 ['House Oryn','Garen Bloodsworn. “Blood binds tighter than golden chains.” Loyalty is their armor; betrayal, their oldest weapon.'],
 ['House Syla','Elara Moonhunger. “Grace is the mask of a hungry heart.” Bright banners hide a hungry court.'],
 ['The Arbiters','The judges answer to no house. They guard the roads to the Conclave and hunt the unregistered flame.'],
];
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const levelCost=level=>35+level*20;
export const enemyById=(s,id)=>s.enemies.find(e=>e.id===id);
export function stats(s){return {maxHp:100+(s.player.level-1)*12+s.talents.resolve*15+(ITEMS[s.gear.armor]?.hp||0),atk:10+(s.player.level-1)*2+s.talents.steel*2+(ITEMS[s.gear.weapon]?.atk||0),fire:26+(s.player.level-1)*3+s.talents.flame*5};}
