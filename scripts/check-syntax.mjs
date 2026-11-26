import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
let checked=0;
function walk(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    const path=join(dir,entry.name);
    if(entry.isDirectory())walk(path);
    else if(/\.m?js$/.test(path)){
      const result=spawnSync(process.execPath,['--check',path],{stdio:'inherit'});
      if(result.status!==0)process.exit(result.status||1);
      checked++;
    }
  }
}
walk('src');walk('scripts');
console.log(`JavaScript syntax checked: ${checked} files.`);
