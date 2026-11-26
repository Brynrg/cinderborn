const move=(unitId,q,r)=>({type:'move',unitId,to:{q,r}});
const interact=(unitId,kind)=>({type:'interact',unitId,kind});
const hit=(unitId,target)=>({type:'attack',unitId,target});
const end={type:'end'};
// Complete legal routes through the public action model, mirrored by browser clicks.
export const oathRoute=[
 move('ash',-1,1),interact('ash','gate'),{type:'choose',choice:'signet'},move('rook',-2,-1),move('iona',1,2),move('sable',-1,2),end,
 move('ash',1,0),interact('ash','bargain'),{type:'choose',choice:'oath'},interact('rook','mara'),interact('iona','brann'),move('sable',2,1),end,
 move('ash',3,0),move('sable',3,-1),move('brann',2,1),move('iona',3,1),move('rook',-1,-1),move('mara',-1,1),end,
 hit('sable','arbiter-1'),move('brann',4,-1),hit('brann','arbiter-1'),hit('ash','arbiter-1'),hit('iona','arbiter-1'),move('rook',0,0),move('mara',1,0),end,
 move('iona',4,0),move('ash',3,1),move('mara',3,0),move('brann',2,1),interact('ash','exit')
];
export const fireRoute=[
 move('ash',-1,2),{type:'magic',kind:'firebrand',unitId:'ash',target:'gate'},
 move('rook',-2,0),hit('rook','checkpoint'),hit('sable','checkpoint'),move('iona',-1,1),hit('iona','checkpoint'),end,
 move('rook',-2,-1),hit('rook','north-jailer'),move('sable',-1,0),hit('sable','north-jailer'),move('ash',-2,1),{type:'magic',kind:'firebrand',unitId:'ash',target:'north-jailer'},move('iona',-2,0),{type:'bandage',unitId:'iona',target:'sable'},end,
 interact('rook','mara'),move('ash',-1,2),{type:'magic',kind:'firebrand',unitId:'ash',target:'vesper'},move('sable',-2,2),hit('sable','vesper'),move('iona',-2,1),{type:'bandage',unitId:'iona',target:'sable'},end,
 move('sable',-1,0),hit('sable','vesper'),move('mara',-1,1),hit('mara','vesper'),hit('ash','vesper'),move('iona',-2,2),{type:'bandage',unitId:'iona',target:'iona'},{type:'guard',unitId:'rook'},end,
 move('sable',-2,0),hit('sable','south-jailer'),move('rook',-1,0),hit('rook','south-jailer'),move('mara',-2,1),hit('mara','south-jailer'),move('ash',-1,1),hit('ash','south-jailer'),move('iona',1,2),interact('iona','brann'),end,
 move('rook',1,0),hit('rook','lookout'),move('sable',0,0),hit('sable','lookout'),move('ash',0,2),{type:'magic',kind:'firebrand',unitId:'ash',target:'sealguard'},move('mara',-1,1),hit('mara','lookout'),move('iona',1,1),{type:'bandage',unitId:'iona',target:'rook'},move('brann',1,2),hit('brann','sealguard'),end,
 hit('sable','sealguard'),move('mara',-1,2),hit('mara','sealguard'),hit('brann','sealguard'),hit('iona','sealguard'),move('ash',3,1),{type:'guard',unitId:'ash'},move('rook',2,1),{type:'guard',unitId:'rook'},end,
 move('ash',3,-1),interact('ash','seal'),move('iona',3,0),{type:'bandage',unitId:'iona',target:'ash'},move('sable',1,1),hit('sable','arbiter-1'),move('mara',0,2),hit('mara','arbiter-1'),hit('rook','arbiter-1'),move('brann',1,0),hit('brann','arbiter-1'),end,
 move('rook',4,0),move('iona',1,2),{type:'bandage',unitId:'iona',target:'sable'},move('mara',3,0),move('brann',2,1),move('ash',3,1),interact('ash','exit'),
];
