import { GATE, SEAL, EXIT, distance, same, living, unitAt, tileAt, safeCaptives, freed } from './scenario.js';
import { sealWarden, exitBlockers, lineClear } from './tactics.js';

export function mission(s) {
  if(!s.seal&&!sealWarden(s))return {title:'1 · Claim the unwarded seal',text:'Bring Ash within 1 hex of the northern shrine and use Take the trial seal.',targets:['shrine']};
  if(!s.seal)return {title:'1 · Secure the seal',text:s.hostile?'Defeat the Seal warden, then bring Ash beside the northern shrine.':'Bring Ash within 2 hexes of Vesper to bargain, or defeat the Seal warden and claim the shrine.',targets:s.hostile?['sealguard']:['vesper','sealguard']};
  if(s.oath&&safeCaptives(s).length<2)return {title:'2 · Keep your promise',text:`${freed(s)}/2 freed · ${safeCaptives(s).length}/2 beside the exit. ${freed(s)===2?'Move Mara and Brann within 1 hex of the exit.':'Any ally can free a prisoner from an adjacent hex.'} Both must survive.`,targets:s.captives.filter(c=>!c.freed||!safeCaptives(s).some(x=>x.id===c.id)).map(c=>c.id)};
  const blockers=exitBlockers(s);
  return {title:blockers.length?'3 · Clear the exit':'3 · Make your escape',text:blockers.length?`${blockers.map(u=>u.name).join(' and ')} contests the exit. Defeat or draw away every hostile within 1 hex.`:'Bring Ash and the seal onto the exit, then Extract. Keep your survivors alive for a stronger ending.',targets:blockers.length?blockers.map(u=>u.id):['exit']};
}
export function actionError(s,a) {
  const u=living(s).find(u=>u.id===a.unitId),target=living(s).find(u=>u.id===a.target);
  if(a.type==='undo')return 'Only your most recent move can be undone, before another action.';
  if(!u)return 'Select a living ally from the band below the map.';
  if(u.acted)return `${u.name} has finished this round. Choose another ally with Next ready · N, or end the round.`;
  if(a.type==='move'){
    if(u.moved)return `${u.name} has already moved. An action is still available; Z undoes this move.`;
    const tile=tileAt(s,a.to);
    if(!tile)return 'That destination is outside the causeway.';
    if(tile.terrain==='water'||tile.terrain==='rock')return `${tile.terrain==='water'?'The river':'Cliffs'} blocks movement. Use a crossing.`;
    if(same(a.to,GATE)&&!s.gateOpen)return 'The gate is closed. Ash can present the signet from an adjacent hex, or burn it from within 2.';
    if(unitAt(s,a.to))return 'That hex is occupied. Choose an empty blue destination.';
    return `${u.name} can move ${u.move} hexes along an open path. Choose a blue hex; hostile units block the route.`;
  }
  if(a.type==='attack')return target&&!lineClear(s,u,target)?'Cliffs block this shot. Move to a clear line of sight.':`${u.name}'s attack reaches ${u.range} hex${u.range===1?'':'es'}. Move closer before committing.`;
  if(a.type==='magic'){
    if(u.id!=='ash')return 'Only Ash can use Embercraft.';
    if(s.powerUsed)return 'Ash has already cast this round. End the round to cast again.';
    if(!s.embers)return 'No embers remain. Use steel, Guard, or Iona’s Bandage.';
    if(a.kind==='mend'&&target?.hp>=target?.maxHp)return `${target.name} is already at full health.`;
    return a.kind==='firebrand'?'Choose a living enemy or closed gate within 2 hexes.':'Choose a wounded ally within 3 hexes.';
  }
  if(a.type==='bandage')return target?.hp>=target?.maxHp?`${target.name} is already at full health.`:'Iona can bandage a wounded ally within 1 hex.';
  if(a.type==='interact'){
    if(a.kind==='seal')return sealWarden(s)?'The Seal warden still holds the shrine. Defeat the warden, or secure Vesper’s oath.':'Ash must be within 1 hex of the shrine and still have an action.';
    if(a.kind==='exit'){
      if(!s.seal)return 'You need the seal: bargain with Vesper or defeat the Seal warden.';
      if(s.oath&&safeCaptives(s).length<2)return 'Both sworn prisoners must be alive and within 1 hex of the exit.';
      if(exitBlockers(s).length)return 'The exit is contested. Defeat or draw away hostiles within 1 hex.';
      return 'Ash must stand on the exit and still have an action to extract.';
    }
    const c=s.captives.find(c=>c.id===a.kind);
    if(c)return c.freed?`${c.name} is already free.`:distance(u,c)>1?`Move ${u.name} within 1 hex of ${c.name}.`:'Defeat this prisoner’s jailer, or have Ash swear Vesper’s oath.';
    return 'Ash must be near the speaker, have an action left, and keep the house neutral.';
  }
  return 'Choose a highlighted destination or an available action.';
}
