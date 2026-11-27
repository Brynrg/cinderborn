import {test,expect} from '@playwright/test';
import {game,ui,advance} from './fixtures/rpg.js';
import {interact} from './fixtures/campaign.js';
test('local artwork loads, movement animates, portraits and credits render',async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/art/')&&r.status()>=400)errors.push(String(r.status()));});
 await page.goto('http://localhost:4173/');await expect.poll(async()=>(await game(page)).art.ready).toBe(true);expect((await game(page)).art).toMatchObject({loaded:54,total:54,failed:[]});
 await page.screenshot({path:info.outputPath('title.png')});await ui(page,'new');await advance(page,0);
 await page.keyboard.down('ArrowRight');await advance(page,150);const a=(await game(page)).animation;await advance(page,150);const b=(await game(page)).animation;await page.keyboard.up('ArrowRight');expect(a.action).toBe('walk');expect(b.action).toBe('walk');expect(a.frame).not.toBe(b.frame);
 await page.screenshot({path:info.outputPath('walking.png')});await advance(page,30);expect((await game(page)).animation.action).toBe('idle');
 await interact(page,'rook');await expect(page.locator('.sprite-portrait img')).toBeVisible();expect(await page.locator('.sprite-portrait img').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);await page.screenshot({path:info.outputPath('portrait.png')});
 await ui(page,'choice:close');await ui(page,'pause');await expect(page.getByRole('link',{name:'Art credits'})).toBeVisible();await page.goto('http://localhost:4173/art/credits.html');await expect(page.locator('main')).toContainText('Pixel Frog');expect(errors).toEqual([]);
});
test('reduced motion freezes decorative frames without losing controls',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('http://localhost:4173/');await ui(page,'new');await advance(page,500);const before=await game(page);expect(before.animation).toMatchObject({reducedMotion:true,action:'idle',frame:0});
 await page.keyboard.down('ArrowRight');await advance(page,150);await page.keyboard.up('ArrowRight');const after=await game(page);expect(after.player.x).toBeGreaterThan(before.player.x);expect(after.animation.frame).toBe(0);
});
