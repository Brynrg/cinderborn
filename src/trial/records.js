import { CONTRACTS } from './contracts.js';
export const RECORD_KEY='cinderborn-records-v1';
export const emptyRecords=()=>({version:1,seen:[],contracts:{}});
export function readRecords(storage){
  try{
    const r=JSON.parse(storage.getItem(RECORD_KEY));
    if(!r||r.version!==1||!Array.isArray(r.seen)||r.seen.some(x=>typeof x!=='string')||!r.contracts||typeof r.contracts!=='object'||Array.isArray(r.contracts))return emptyRecords();
    for(const [id,v] of Object.entries(r.contracts))if(!Object.hasOwn(CONTRACTS,id)||!v||!Number.isInteger(v.wins)||v.wins<1||!Number.isInteger(v.bestRound)||v.bestRound<1||v.bestRound>12||!Array.isArray(v.honors)||v.honors.some(x=>!['Both prisoners safe','Cover intact','No allies lost','Swift escape','Embers to spare'].includes(x)))return emptyRecords();
    return r;
  }catch{return emptyRecords();}
}
export function recordResult(records,s){
  if(!s.runId||s.phase!=='won'||records.seen.includes(s.runId))return records;
  const r=structuredClone(records),id=s.contract||'causeway',prior=r.contracts[id];
  r.seen=[...r.seen,s.runId].slice(-100);
  r.contracts[id]={wins:(prior?.wins||0)+1,bestRound:Math.min(prior?.bestRound||99,s.round),honors:[...new Set([...(prior?.honors||[]),...(s.result.honors||[])])]};
  return r;
}
export function saveRecords(storage,records){try{storage.setItem(RECORD_KEY,JSON.stringify(records));return true;}catch{return false;}}
