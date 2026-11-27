import {test,expect} from '@playwright/test';
import {campaignRoute} from './fixtures/campaign.js';
import {game,advance,ui,go,fight} from './fixtures/rpg.js';
for(const route of ['accord','crown'])test(`four-chapter campaign: ${route} route, equipment, finale and reload`,async({page},testInfo)=>{
 test.setTimeout(240000);await page.setViewportSize({width:1440,height:900});const errors=[];const seen=new Set();page.captureCombat=async(s,e)=>{if(e.mark&&!seen.has(e.id)){seen.add(e.id);await page.screenshot({path:testInfo.outputPath('boss-'+e.id+'.png')});}};page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:4173/');await ui(page,'new');await advance(page,0);
 const state=await campaignRoute(page,route,async name=>{await page.screenshot({path:testInfo.outputPath(`${name}.png`)});if(name==='fen-arrival'){await ui(page,'map');await page.screenshot({path:testInfo.outputPath('fen-map.png')});await page.setViewportSize({width:390,height:844});await page.screenshot({path:testInfo.outputPath('fen-map-narrow.png')});await ui(page,'close');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);const bar=await page.locator('#hotbar').boundingBox();expect(bar.x).toBeGreaterThanOrEqual(0);expect(bar.x+bar.width).toBeLessThanOrEqual(390);await page.screenshot({path:testInfo.outputPath('fen-hud-narrow.png')});await page.setViewportSize({width:1440,height:900});}});
 expect(state.deaths).toBe(0);expect(state.campaign.finale).toBe(true);expect(errors).toEqual([]);await ui(page,'journal');await expect(page.locator('#panel')).toContainText('Recovered records');await page.screenshot({path:testInfo.outputPath('journal.png')});await ui(page,'close');
 if(route==='accord'){
  await advance(page,5100);await ui(page,'map');await ui(page,'travel:campfire');expect((await game(page)).zone).toBe('march');expect((await game(page)).quests.mara).toBe(true);
  await ui(page,'map');await ui(page,'travel:citadel-hearth');await go(page,{x:590,y:590});await page.keyboard.press('KeyE');await ui(page,'choice:echo-begin');await go(page,{x:2180,y:850});await fight(page,'first-judge');expect((await game(page)).campaign.echoes).toBe(1);
 }
});
