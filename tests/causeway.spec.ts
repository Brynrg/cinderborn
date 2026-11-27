import { test, expect, type Page } from '@playwright/test';
import { oathRoute, fireRoute } from './fixtures/routes.js';
const URL='http://localhost:4173/';
const game=(page:Page)=>page.evaluate(()=>JSON.parse((window as any).render_game_to_text()));
const action=(page:Page,id:string)=>page.locator(`[data-action="${id}"]`).click();
const hex=(page:Page,q:number,r:number)=>page.locator(`[data-hex="${q},${r}"]`).click();
async function start(page:Page){await page.goto(URL);await action(page,'begin');}
async function step(page:Page,a:any){
  if(a.unitId)await page.locator(`[data-unit="${a.unitId}"]`).click();
  if(a.type==='move')await hex(page,a.to.q,a.to.r);
  else if(a.type==='guard')await action(page,'guard');
  else if(a.type==='end')await page.locator('#end-round').click();
  else if(a.type==='interact')await action(page,`interact:${a.kind}`);
  else if(a.type==='choose')await action(page,`choose:${a.choice}`);
  else if(['attack','magic','bandage'].includes(a.type)){
    const s=await game(page),target=a.target==='gate'?{q:0,r:0}:s.units.find((u:any)=>u.id===a.target);
    if(a.type!=='attack')await action(page,`mode:${a.kind||a.type}`);
    await hex(page,target.q,target.r);
    if(a.type==='attack'){await expect(page.locator('.combat-preview')).toBeVisible();await action(page,'attack');}
  }
  await expect(page.locator('#notice')).not.toHaveClass(/error/);
}
async function resume(page:Page){await page.reload();await action(page,'continue');}

test('bargain route saves open decisions, escorts both prisoners, and persists its ending',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await start(page);
  for(let i=0;i<oathRoute.length;i++){
    await step(page,oathRoute[i]);
    if(oathRoute[i].type==='interact'&&['gate','bargain'].includes(oathRoute[i].kind)){
      const before=await game(page);await resume(page);
      expect((await game(page)).pending).toEqual(before.pending);
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('e');expect((await game(page)).round).toBe(before.round);
    }
    if(oathRoute[i].choice==='oath'){await resume(page);expect((await game(page)).oath).toBe(true);expect((await game(page)).inspectionRound).toBe(4);}
    if(i===11){await expect(page.locator('.roster-unit')).toHaveCount(6);await page.screenshot({path:info.outputPath('six-allies.png')});}
    if(i===20){expect((await game(page)).inspectionArrived).toBe(true);await page.screenshot({path:info.outputPath('oath-inspection.png')});}
  }
  const ending=await game(page);expect(ending.phase).toBe('won');expect(ending.result).toMatchObject({round:5,freed:2,safe:2,survivors:6,route:'Oathkeeper'});
  await expect(page.getByRole('dialog')).toContainText('TRIAL COMPLETE');
  await page.screenshot({path:info.outputPath('oath-ending.png')});
  await resume(page);expect((await game(page)).result).toEqual(ending.result);
  expect(errors).toEqual([]);
});

test('fire route survives combat reloads, uses bandage, meets inspection, and extracts',async({page},info)=>{
  test.setTimeout(60_000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
  for(let i=0;i<fireRoute.length;i++){
    await step(page,fireRoute[i]);
    if(i===1){await resume(page);const s=await game(page);expect(s.embers).toBe(3);expect(s.powerUsed).toBe(true);await expect(page.locator('[data-action="mode:firebrand"]')).toBeDisabled();}
    if(i===3){await expect(page.locator('#cover-label')).toHaveText('EXPOSED');await page.screenshot({path:info.outputPath('combat.png')});}
    if(fireRoute[i].type==='end'&&(await game(page)).round===4){const s=await game(page);expect(s.inspectionArrived).toBe(true);expect(s.units.filter((u:any)=>u.side==='arbiter')).toHaveLength(2);await page.screenshot({path:info.outputPath('inspection.png')});await resume(page);}
  }
  expect((await game(page)).result).toMatchObject({won:true,round:9,freed:2,survivors:6,route:'Unmasked'});expect(errors).toEqual([]);
});

test('keyboard selection, undo, focus, help, sound, fullscreen and restart work',async({page})=>{
  await start(page);await hex(page,-1,1);expect((await game(page)).undo).not.toBeNull();
  await page.keyboard.press('z');expect((await game(page)).units[0]).toMatchObject({q:-3,r:2,moved:false});
  await page.keyboard.press('2');expect((await game(page)).selected).toBe('rook');
  await page.locator('[data-unit="ash"]').focus();await page.keyboard.press('Enter');await expect(page.locator('[data-unit="ash"]')).toBeFocused();
  await page.locator('[data-hex="-3,2"]').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('[data-hex="-2,2"]')).toBeFocused();
  await page.locator('#help-button').click();await expect(page.getByRole('dialog')).toContainText('Read. Decide. Act.');
  await page.keyboard.press('e');expect((await game(page)).round).toBe(1);
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toBeHidden();await expect(page.locator('#help-button')).toBeFocused();
  await page.locator('#sound').click();await expect(page.locator('#sound')).toHaveAttribute('aria-pressed','true');
  await page.keyboard.press('f');await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true);
  await page.keyboard.press('f');await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(false);
  await page.keyboard.press('e');expect((await game(page)).round).toBe(2);
  await page.locator('#menu-button').click();await action(page,'restart');await action(page,'close');expect((await game(page)).round).toBe(2);
  await page.locator('#menu-button').click();await action(page,'restart');await action(page,'restart-confirm');expect((await game(page)).round).toBe(1);
  await resume(page);expect((await game(page)).round).toBe(1);
});

test('desktop board, six portraits and end-round stay inside resized viewports',async({page},info)=>{
  await start(page);for(const a of oathRoute.slice(0,12))await step(page,a);await page.locator('[data-unit="ash"]').click();
  for(const viewport of [{width:1440,height:900},{width:1280,height:800},{width:1024,height:768},{width:1280,height:720}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(80);
    for(const selector of ['#board','#roster','#end-round','#cover-meter','[data-action="mode:firebrand"]']){
      const b=await page.locator(selector).boundingBox();expect(b).not.toBeNull();expect(b!.x).toBeGreaterThanOrEqual(0);expect(b!.y).toBeGreaterThanOrEqual(0);
      expect(b!.x+b!.width).toBeLessThanOrEqual(viewport.width+1);expect(b!.y+b!.height).toBeLessThanOrEqual(viewport.height+1);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    const first=await page.locator('#board').boundingBox();await page.waitForTimeout(120);expect(await page.locator('#board').boundingBox()).toEqual(first);
    await page.screenshot({path:info.outputPath(`layout-${viewport.width}-${viewport.height}.png`)});
  }
});

test('narrow layout retains controls without horizontal overflow',async({page},info)=>{
  await page.setViewportSize({width:390,height:844});await start(page);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const roster=await page.locator('#roster').boundingBox();
  for(const portrait of await page.locator('.roster-unit').all()){
    const b=await portrait.boundingBox();expect(b!.y+b!.height).toBeLessThanOrEqual(roster!.y+roster!.height);
  }
  await action(page,'commands');await expect(page.locator('[data-action="mode:firebrand"]')).toBeInViewport();
  await action(page,'map');await expect(page.locator('#board')).toBeInViewport();
  await page.locator('#end-round').click();expect((await game(page)).round).toBe(2);
  await page.screenshot({path:info.outputPath('narrow.png'),fullPage:true});
});

for(const bad of ['{broken',JSON.stringify({version:1,scenario:'ashen-causeway',units:[{role:'alien'}]})])test(`invalid save recovers to a new trial (${bad.slice(0,10)})`,async({page})=>{
  await page.goto(URL);await page.evaluate(value=>{localStorage.setItem('cinderborn-causeway-v3',value);localStorage.setItem('cinderborn-save-v3','original-save-marker');},bad);
  await page.reload();await action(page,'begin');expect((await game(page)).round).toBe(1);
  expect(await page.evaluate(()=>localStorage.getItem('cinderborn-save-v3'))).toBe('original-save-marker');
});

test('storage denial still permits play and visibly reports that saving failed',async({page})=>{
  await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('storage denied');};});
  await start(page);await expect(page.locator('#save-status')).toContainText('Save unavailable');
  await page.locator('#end-round').click();expect((await game(page)).round).toBe(2);
});

test('objective guidance, map inspection, ready selection and specific move errors teach the loop',async({page})=>{
  await start(page);await expect(page.locator('#mission')).toContainText('Secure the seal');
  await action(page,'focus:vesper');await expect(page.locator('#inspector')).toContainText('Vesper');
  await expect(page.locator('#notice')).toContainText('within 2 hexes');
  await hex(page,0,0);await expect(page.locator('#notice')).toContainText('Closed gate');
  await hex(page,-1,-2);await expect(page.locator('#notice')).toContainText('Mara');
  await hex(page,3,-2);await expect(page.locator('#inspector')).toContainText('Seal warden');
  await hex(page,-4,1);await expect(page.locator('#notice')).toContainText('Cliffs');
  await action(page,'guard');await expect(page.locator('.activation-state')).toContainText('Action spent');
  await page.keyboard.press('n');expect((await game(page)).selected).toBe('rook');
  await expect(page.locator('#remaining-actions')).toContainText('3 allies');
});

test('a previous-version save resumes its open choice and retains the original backup',async({page})=>{
  await start(page);await hex(page,-1,1);await action(page,'interact:gate');
  const original=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('cinderborn-causeway-v3')!);s.version=1;s.inspectionRound=6;
    const text=JSON.stringify(s);localStorage.setItem('cinderborn-causeway-v1',text);localStorage.removeItem('cinderborn-causeway-v3');return text;
  });
  await page.reload();await expect(page.getByRole('dialog')).toContainText('band and choices are preserved');
  await action(page,'continue');await expect(page.getByRole('dialog')).toContainText('borrowed name');
  await action(page,'choose:signet');const s=await game(page);
  expect(s).toMatchObject({version:3,gateOpen:true,inspectionRound:4,suspicion:10});
  expect(await page.evaluate(()=>localStorage.getItem('cinderborn-causeway-v1'))).toBe(original);
  await resume(page);expect((await game(page)).gateOpen).toBe(true);
});

test('deadline loss persists and can start a fresh run',async({page})=>{
  await start(page);for(let i=0;i<12;i++){if((await game(page)).phase!=='playing')break;await page.locator('#end-round').click();}
  const s=await game(page);expect(s.phase).toBe('lost');await expect(page.getByRole('dialog')).toContainText('THE JUDGES PREVAIL');
  await resume(page);expect((await game(page)).result).toEqual(s.result);await action(page,'restart-confirm');expect((await game(page)).phase).toBe('playing');
});
