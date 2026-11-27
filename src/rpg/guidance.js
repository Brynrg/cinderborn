import {NPCS,NODES,dist} from './data.js';
import {objective} from './story.js';
const nearest=(s,list)=>[...list].sort((a,b)=>dist(a,s.player)-dist(b,s.player))[0];
export function trackedObjective(s,track='story'){
 if(track==='herbs'&&!s.quests.herbsDone){const herbs=NODES.filter(n=>n.kind==='herb'&&!s.collected.includes(n.id));return {title:'Silverleaf for Iona',text:herbs.length?'Gather silverleaf along the western road.':'Return to Iona for stronger healing.',target:nearest(s,herbs)||NPCS.find(n=>n.id==='iona')};}
 if(track==='bounty'&&s.quests.bounty){const done=s.quests.bountyKills>=3,foe=nearest(s,s.enemies.filter(e=>!e.dead&&['wolf','raider'].includes(e.type)));return {title:'Keep the road open',text:done?'Return to Rook for your reward.':`Defeat road beasts or reavers · ${s.quests.bountyKills}/3.`,target:done||!foe?NPCS[0]:foe};}
 if(track==='cache'&&!s.collected.includes('cache'))return {title:'The lost caravan',text:'Defeat Hollowfang and open the northern cache for a mantle.',target:NODES.find(n=>n.id==='cache')};
 return objective(s);
}
export function questMark(s,id){
 const q=s.quests;
 if(id==='iona')return q.herbsDone?'✓':s.collected.filter(k=>k.startsWith('herb')).length===3?'?':q.herbs?'◇':'!';
 if(id==='rook')return !q.metRook?'!':q.bounty&&q.bountyKills>=3?'?':q.bounty?'◇':'!';
 if(id==='vesper')return q.oath||q.defiant?'✓':'!';
 return q[id]?'✓':'◇';
}
