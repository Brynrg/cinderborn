import { createTrial, makeUnit, log } from './scenario.js';
import { planEnemies } from './tactics.js';

export const CONTRACTS={
  causeway:{name:'The Ashen Causeway',tag:'BARGAIN OR BURN',brief:'The full trial. A stolen signet, two prisoners, and a choice between your word and your fire.',rule:'4 allies · inspection round 4 · 12 rounds',par:5},
  lastlight:{name:'The Last Light',tag:'ESCORT UNDER PRESSURE',brief:'The bargain is already sworn. Six allies, two inspectors, and no quiet opening. Bring both prisoners home.',rule:'6 allies · inspection already here · 6 rounds',par:3},
  ashfall:{name:'Ashfall',tag:'BREAK THE WARDEN',brief:'The checkpoint is broken and your disguise is ash. Win the seal in open battle; decide how much to risk for the prisoners.',rule:'4 allies · cover broken · inspection round 3 · 10 rounds',par:9},
};
export const contractFor=s=>CONTRACTS[s.contract]||CONTRACTS.causeway;
export const deadline=s=>s.deadline||12;
export function createRun(id='causeway') {
  const s=createTrial();s.contract=Object.hasOwn(CONTRACTS,id)?id:'causeway';
  if(id==='lastlight'){
    s.deadline=6;s.seal=true;s.oath=true;s.bargain='sworn';s.gateOpen=true;s.suspicion=10;
    const positions={ash:[1,0],rook:[-2,-1],sable:[2,1],iona:[1,2]};
    for(const [unitId,[q,r]] of Object.entries(positions))Object.assign(s.units.find(u=>u.id===unitId),{q,r});
    for(const c of s.captives){c.freed=true;s.units.push(makeUnit(c.id,c.name,c.role,'ally',c.q,c.r));}
    s.inspectionRound=1;s.inspectionArrived=true;
    s.units.push(makeUnit('arbiter-0','Arbiter 1','arbiter','arbiter',1,-2),makeUnit('arbiter-1','Arbiter 2','arbiter','arbiter',4,0));
    log(s,'The promise is made. Inspection is here. Get Ash and both prisoners to the exit before the sixth bell.');
  }
  if(id==='ashfall'){
    s.deadline=10;s.hostile=true;s.exposed=true;s.suspicion=55;s.gateOpen=true;s.inspectionRound=3;
    const positions={ash:[-1,2],rook:[-2,0],sable:[-2,2],iona:[-1,1],'north-jailer':[-3,0],'south-jailer':[0,0],vesper:[2,1]};
    for(const [unitId,[q,r]] of Object.entries(positions))Object.assign(s.units.find(u=>u.id===unitId),{q,r});
    s.units.find(u=>u.id==='checkpoint').hp=0;
    log(s,'The checkpoint has fallen. The house is hunting you. Break the warden, take the seal, and decide who comes home.');
  }
  planEnemies(s);return s;
}
