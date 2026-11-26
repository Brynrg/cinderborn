const move=(unitId,q,r)=>({type:'move',unitId,to:{q,r}});
const interact=(unitId,kind)=>({type:'interact',unitId,kind});
const attack=(unitId,target)=>({type:'attack',unitId,target});
const end={type:'end'};
export const oathRoute=[
  move('ash',-1,1),interact('ash','gate'),{type:'choose',choice:'signet'},
  move('rook',-2,-1),move('iona',1,2),end,
  move('ash',1,0),interact('ash','bargain'),{type:'choose',choice:'oath'},
  interact('rook','mara'),interact('iona','brann'),end,
  move('ash',3,1),move('brann',2,1),move('mara',-1,1),end,
  move('mara',1,0),end,
  move('mara',3,0),interact('ash','exit'),
];
export const fireRoute=[
  move('ash',-1,2),{type:'magic',kind:'firebrand',unitId:'ash',target:'gate'},
  move('rook',-2,0),attack('rook','checkpoint'),attack('sable','checkpoint'),
  move('iona',-1,1),attack('iona','checkpoint'),end,
  attack('rook','north-jailer'),{type:'bandage',unitId:'iona',target:'ash'},end,
  move('ash',1,3),end,move('ash',3,0),end,
  move('ash',3,-1),interact('ash','seal'),end,
  move('ash',3,1),interact('ash','exit'),
];
