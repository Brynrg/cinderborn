import {NPCS,NODES,enemyById,dist,stats} from './data.js';
import {gainXP,giveItem,notice} from './state.js';
export function people(s){return NPCS.map(n=>s.quests[n.id]?{...n,x:n.id==='mara'?445:230,y:1170,title:'Safe at Emberrest'}:n);}
export function nearby(s){return [...people(s),...NODES.filter(n=>!s.collected.includes(n.id))].filter(n=>dist(n,s.player)<95).sort((a,b)=>dist(a,s.player)-dist(b,s.player))[0]||null;}
export function objective(s){
 const q=s.quests;
 if(!q.metRook)return {title:'A borrowed name',text:'Speak to Rook at Emberrest Camp.',target:NPCS[0]};
 if(!q.oath&&!q.defiant)return {title:'The champion’s bargain',text:'Find Vesper across the Ashen Causeway.',target:NPCS.find(n=>n.id==='vesper')};
 if(q.oath&&!q.mara)return {title:'Keep your word',text:'Defeat the north jailer, then free Mara.',target:enemyById(s,'north-jailer').dead?NPCS.find(n=>n.id==='mara'):enemyById(s,'north-jailer')};
 if(q.oath&&!q.brann)return {title:'The bridgewright',text:'Defeat the south jailer, then free Brann.',target:enemyById(s,'south-jailer').dead?NPCS.find(n=>n.id==='brann'):enemyById(s,'south-jailer')};
 if(!q.seal)return {title:'A seal taken by fire',text:enemyById(s,'seal-warden').dead?'Claim the seal at the northern shrine.':'Defeat the Seal Warden in the northern ruins.',target:enemyById(s,'seal-warden').dead?NODES.find(n=>n.id==='shrine'):enemyById(s,'seal-warden')};
 if(!enemyById(s,'arbiter').dead)return {title:'The judges will not yield',text:'Defeat the Arbiter guarding the eastern road.',target:enemyById(s,'arbiter')};
 if(!q.complete)return {title:'Beyond the causeway',text:'Reach the Conclave road and complete the chapter.',target:NODES.find(n=>n.id==='exit')};
 return {title:'A name of your own',text:'Explore, improve your equipment, or take another road bounty from Rook.',target:NPCS[0]};
}
export function talk(s,id){
 const n=[...people(s),...NODES].find(n=>n.id===id);if(!n||dist(n,s.player)>100){notice(s,'Move closer to interact.');return false;}
 if(n.kind){
  if(n.kind==='rest'){
   if(s.combat>0){notice(s,'Lose your pursuers before resting.');return false;}
   s.player.hp=stats(s).maxHp;s.player.energy=80;s.player.potions=Math.max(s.player.potions,3);s.checkpoint=n.id;
   if(!s.waystones.includes(n.id)){s.waystones.push(n.id);gainXP(s,20);}notice(s,'Rested · health, focus and three potions restored.');return true;
  }
  if(s.collected.includes(id))return false;
  if(n.kind==='herb'){s.collected.push(id);notice(s,`Silverleaf gathered (${s.collected.filter(k=>k.startsWith('herb')).length}/3).`);return true;}
  if(n.kind==='chest'){if(!enemyById(s,'hollowfang').dead){notice(s,'Hollowfang guards this cache.');return false;}s.collected.push(id);s.player.coins+=30;giveItem(s,'ranger');gainXP(s,30);return true;}
  if(n.kind==='seal'){if(!enemyById(s,'seal-warden').dead){notice(s,'The Seal Warden still binds this shrine.');return false;}if(!s.quests.seal){s.quests.seal=true;if(!s.quests.oath)s.quests.defiant=true;gainXP(s,45);notice(s,'Trial seal acquired. The road to the Conclave awaits.','gold');}return true;}
  if(n.kind==='exit'){
   if(!s.quests.metRook){notice(s,'Speak to Rook before leaving your people behind.');return false;}
   if(!s.quests.seal){notice(s,'You need a trial seal. Vesper or the northern shrine holds the answer.');return false;}
   if(s.quests.oath&&(!s.quests.mara||!s.quests.brann)){notice(s,'You swore to save both prisoners. Your promise still binds you.');return false;}
   if(!enemyById(s,'arbiter').dead){notice(s,'The Arbiter still bars the Conclave road.');return false;}
   if(!s.quests.complete){s.quests.complete=true;gainXP(s,100);s.player.coins+=60;giveItem(s,'cinder');}s.dialogue='ending';return true;
  }
 }
 s.dialogue=id;s.auto=false;s.path=[];return true;
}
const choice=(id,label,note='')=>({id,label,note});
export function dialogue(s,id){const q=s.quests;
 if(id==='rook')return !q.metRook?{speaker:'Rook',role:'Warden of the exiles',title:'A dead noble’s name. A living cause.',text:'That signet will get you past the houses, Ash. But the Conclave demands a trial seal. Vesper holds the eastern causeway. Find her. Iona can mend your wounds, and Sable will trade for better steel. Your people need you alive.',choices:[choice('begin','I’ll find Vesper.','Accept the main quest · 15 XP'),choice('bounty','What threatens the road?','Optional: defeat three road beasts'),choice('close','Not yet.')]}
 :{speaker:'Rook',role:'Warden of the exiles',title:q.complete?'You came back with your own name.':'Keep the road open.',text:q.complete?'The houses have heard of the Cinder. Rest, explore the ruins, and prepare for what comes after the causeway. Our people still need a safe road.':'The five houses only see the crest. I see who carries it. Find Vesper, and choose what your word is worth.',choices:[...(q.bounty&&q.bountyKills>=3?[choice('bounty-reward','Collect the road bounty.','40 XP · 25 crowns')]:!q.bounty?[choice('bounty','Take a road bounty.','Defeat three wolves or reavers')]:[]),choice('close','Back to the road.')]};
 if(id==='iona')return {speaker:'Iona',role:'Herald & healer',title:'Fire can close a wound, too.',text:q.herbsDone?'Silverleaf and a steady hand. Your Mend is stronger now. Rest at a hearth or waystone to replenish your potions.':'Three silverleaf sprigs grow beside the western road. Bring them to me and I’ll show you how to make your flame heal. You can gather them while you explore.',choices:[...(q.herbsDone?[]:s.collected.filter(k=>k.startsWith('herb')).length>=3?[choice('herbs-reward','Deliver the silverleaf.','40 XP · Mend heals 10 more')]:[choice('herbs','I’ll look for silverleaf.','Track this optional quest')]),choice('close','Thank you, Iona.')]};
 if(id==='sable')return {speaker:'Sable',role:'Scout & outfitter',title:'An honest edge for a borrowed name.',text:'A wolf’s pelt buys more than a fine promise. The old caravan north of the road had a good mantle, if you can get past Hollowfang. I have steel and supplies here. You carry '+s.player.coins+' crowns.',choices:[...(!s.bag.includes('iron')?[choice('buy-iron','Buy Roadwarden steel.','30 crowns · +4 sword damage')]:[]),choice('buy-potion','Buy a healing draught.','8 crowns · restores 50 health'),choice('close','I’ll be back.')]};
 if(id==='vesper')return {speaker:'Vesper',role:'Champion of House Kaelen',title:q.oath?'A promise is heavier than a seal.':q.defiant?'Then let your deeds speak.':'I know what burns beneath that crest.',text:q.oath?'The judges took Mara north and Brann to the quarry. Their jailers answer to the Conclave, not my house. Free them. Keep your promise.':q.defiant?'The northern shrine holds a second trial seal. Its warden will not give it willingly. You may still free the prisoners, should your conscience stir.':'Take my seal, Cinder—but save Mara and Brann. They built this crossing, and the judges put them in chains. Swear to free them and I will open your road. Refuse, and you must take the northern seal by force.',choices:!q.oath&&!q.defiant?[choice('oath','Swear to save them both.','Receive Vesper’s seal · rescue both prisoners'),choice('defy','I’ll win my own seal.','Fight the Seal Warden · rescues remain optional'),choice('close','I need time.')]:[choice('close','We understand each other.')]};
 if((id==='mara'||id==='brann')&&q[id])return {speaker:id==='mara'?'Mara':'Brann',role:'Safe at Emberrest',title:'You kept the road open for us.',text:'We made it. Rook has a place by the fire, and Iona says the camp is growing. Whatever name the houses call you, we will remember yours.',choices:[choice('close','Stay safe.')]};
 if(id==='mara'||id==='brann'){const jailer=enemyById(s,id==='mara'?'north-jailer':'south-jailer');return {speaker:id==='mara'?'Mara':'Brann',role:'Prisoner of the Conclave',title:jailer.dead?'You came back for us.':'The jailer has the key.',text:jailer.dead?'I know a path back to Emberrest. We can reach the camp while you draw the judges east. Tell Vesper her promise was kept.':'Defeat the jailer nearby. Then we can get these chains off.',choices:jailer.dead?[choice('free-'+id,'Unlock the chains.','50 XP · prisoner returns safely to camp')]:[choice('close','Stay low. I’ll get the key.')]};}
 if(id==='ending')return {speaker:'The Cinder',role:'Chapter one complete',title:q.oath?'A name kept. A promise honored.':'Beyond the borrowed name.',text:`The Arbiter falls, and the Conclave road opens. ${q.mara&&q.brann?'Mara and Brann are safe at Emberrest.':q.mara||q.brann?'One prisoner made it back. The other remains in chains.':'Two prisoners remain behind. Victory has a cost.'} The five houses will hear of you. Your journey in this region continues—explore its secrets, finish side quests, and strengthen Ash.`,choices:[choice('close','Return to the world.','Cindersteel acquired · 100 XP · 60 crowns')]};
 return {speaker:'The road',title:'A moment to breathe.',text:'',choices:[choice('close','Continue.')]};
}
export function choose(s,id){
 const q=s.quests,who=s.dialogue;if(!who)return false;
 const allowed=dialogue(s,who).choices.some(c=>c.id===id);if(!allowed)return false;
 if(id==='begin'&&!q.metRook){q.metRook=true;gainXP(s,15);notice(s,'Quest accepted · The champion’s bargain','gold');}
 if(id==='bounty'){q.bounty=true;q.bountyKills=0;notice(s,'Road bounty · defeat three wolves or reavers.');}
 if(id==='bounty-reward'&&q.bounty&&q.bountyKills>=3){q.bounty=false;q.bountyRuns++;s.player.coins+=25;gainXP(s,40);notice(s,'Road bounty complete · 25 crowns','gold');}
 if(id==='herbs')q.herbs=true;
 if(id==='herbs-reward'&&!q.herbsDone){q.herbsDone=true;q.herbs=false;gainXP(s,40);notice(s,'Mend strengthened · +10 healing','gold');}
 if(id==='buy-iron'||id==='buy-potion'){
  const price=id==='buy-iron'?30:8;if(s.player.coins<price){notice(s,'Not enough crowns.');return false;}
  if(id==='buy-potion'&&s.player.potions>=99)return false;
  s.player.coins-=price;if(id==='buy-iron')giveItem(s,'iron');else s.player.potions++;
 }
 if(id==='oath'){q.oath=true;q.seal=true;gainXP(s,20);notice(s,'Vesper’s seal is yours. Now keep your word.','gold');}
 if(id==='defy'){q.defiant=true;gainXP(s,20);notice(s,'The northern shrine holds your trial seal.');}
 if(id.startsWith('free-')){const captive=id.slice(5);if(!q[captive]){q[captive]=true;gainXP(s,50);notice(s,`${captive==='mara'?'Mara':'Brann'} is safe. They know the way to camp.`,'gold');}}
 s.dialogue=null;return true;
}
