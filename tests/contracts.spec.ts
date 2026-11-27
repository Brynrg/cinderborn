import {test,expect,type Page} from '@playwright/test';
import {lastLightRoute,ashfallRoute} from './fixtures/contracts.js';
const state=(page:Page)=>page.evaluate(()=>JSON.parse((window as any).render_game_to_text()));
const action=(page:Page,id:string)=>page.locator(`[data-action="${id}"]`).click();
async function begin(page:Page,id:string){await page.goto('http://localhost:4173/trial.html');await action(page,'contracts');await action(page,`contract:${id}`);await action(page,'deploy-contract');}
async function step(page:Page,a:any){
  if(a.unitId)await page.locator(`[data-unit="${a.unitId}"]`).click();
  if(a.type==='move')await page.locator(`[data-hex="${a.to.q},${a.to.r}"]`).click();
  else if(a.type==='end')await page.locator('#end-round').click();
  else if(a.type==='guard')await action(page,'guard');
  else if(a.type==='interact')await action(page,`interact:${a.kind}`);
  else if(a.type==='technique'){
    await action(page,'mode:technique');
    if(a.target){const t=(await state(page)).units.find((u:any)=>u.id===a.target);await page.locator(`[data-hex="${t.q},${t.r}"]`).click();}
    await expect(page.locator('.technique-preview')).toBeVisible();await action(page,'technique');
  }else if(['attack','magic','bandage'].includes(a.type)){
    const s=await state(page),t=s.units.find((u:any)=>u.id===a.target);
    if(a.type!=='attack')await action(page,`mode:${a.kind||a.type}`);
    await page.locator(`[data-hex="${t.q},${t.r}"]`).click();if(a.type==='attack')await action(page,'attack');
  }
  await expect(page.locator('#notice')).not.toHaveClass(/error/);
}
for(const [id,route,round] of [['lastlight',lastLightRoute,3],['ashfall',ashfallRoute,9]] as const)test(`${id}: complete the contract with class techniques and retain its record`,async({page},info)=>{
  test.setTimeout(60_000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await begin(page,id);
  await expect(page.locator('#enemy-queue .queue-items button')).toHaveCount(id==='lastlight'?2:5);
  await page.screenshot({path:info.outputPath(`${id}-opening.png`)});
  for(const a of route){await step(page,a);if(a.type==='technique'){const before=await state(page);await page.reload();await action(page,'continue');expect((await state(page)).units).toEqual(before.units);}}
  const s=await state(page);expect(s.result).toMatchObject({won:true,round,safe:2,survivors:6});expect(s.records.contracts[id]).toMatchObject({wins:1,bestRound:round});
  await page.reload();await action(page,'continue');expect((await state(page)).records.contracts[id].wins).toBe(1);
  await page.screenshot({path:info.outputPath(`${id}-ending.png`)});await action(page,'contracts');
  await expect(page.locator(`[data-action="contract:${id}"]`)).toContainText('4/4 honors');await page.screenshot({path:info.outputPath('contract-board.png')});expect(errors).toEqual([]);
});
test('Pinning shot previews its exact cost and changes the visible queue without losing cover',async({page},info)=>{
  await begin(page,'lastlight');await page.locator('[data-unit="sable"]').click();await page.locator('[data-hex="3,-1"]').click();
  await action(page,'mode:technique');await page.locator('[data-hex="1,-2"]').click();
  await expect(page.locator('.technique-preview')).toContainText('3 damage · no return · movement stopped');
  expect((await state(page)).units.find((u:any)=>u.id==='sable').charges).toBe(2);
  await expect(page.locator('[data-action="technique"]')).toBeInViewport();await page.screenshot({path:info.outputPath('pin-preview.png')});await action(page,'technique');
  await expect(page.locator('#enemy-queue')).toContainText('PINNED');const s=await state(page);expect(s.hostile).toBe(false);expect(s.units.find((u:any)=>u.id==='sable').charges).toBe(1);
  await action(page,'inspect:arbiter-0');await expect(page.locator('#inspector')).toContainText('Movement pinned');
  await page.locator('#end-round').click();expect((await state(page)).units.find((u:any)=>u.id==='arbiter-0')).toMatchObject({q:1,r:-2,pinned:false});
});
test('contracts and the enemy queue stay usable on a narrow screen',async({page},info)=>{
  await page.setViewportSize({width:390,height:844});await begin(page,'lastlight');
  await expect(page.locator('.roster-unit')).toHaveCount(6);expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await action(page,'inspect:arbiter-1');await expect(page.locator('#inspector')).toContainText('Arbiter 2');
  await page.screenshot({path:info.outputPath('narrow-contract.png'),fullPage:true});
});
