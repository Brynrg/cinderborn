import {test,expect} from '@playwright/test';
import {game,advance,ui,go,speak,storyRoute,fight,develop,mapWalk} from './fixtures/rpg.js';
const url='http://localhost:4173/';
for(const route of ['oath','defiant'])test(`RPG: ${route} journey through quests, equipment, combat and chapter completion`,async({page},info)=>{
 test.setTimeout(150_000);await page.setViewportSize({width:1440,height:900});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);await ui(page,'new');const s=await storyRoute(page,route,async(stage:string)=>page.screenshot({path:info.outputPath(`${route}-${stage}.png`)}));
 expect(s.player.level).toBeGreaterThan(2);expect(s.bag).toContain('cinder');expect(s.quests.herbsDone).toBe(true);expect(s.quests.mara).toBe(route==='oath');
 await ui(page,'choice:close');await page.reload();await ui(page,'continue');const reloaded=await game(page);expect(reloaded.quests).toEqual(s.quests);expect(reloaded.gear).toEqual(s.gear);expect(reloaded.player.level).toBe(s.player.level);expect(errors).toEqual([]);
});
test('RPG: movement, interaction, pause, equipment layout and corrupt save recovery',async({page},info)=>{
 await page.goto(url);await ui(page,'new');const start=await game(page);await page.keyboard.down('ArrowRight');await advance(page,250);await page.keyboard.up('ArrowRight');expect((await game(page)).player.x).toBeGreaterThan(start.player.x+30);
 await speak(page,'rook','begin');await ui(page,'character');const hp=(await game(page)).player.hp;await advance(page,4000);expect((await game(page)).player.hp).toBe(hp);await page.screenshot({path:info.outputPath('character.png')});await ui(page,'close');
 await page.setViewportSize({width:390,height:844});await ui(page,'map');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);await page.screenshot({path:info.outputPath('narrow-map.png')});await ui(page,'close');
 await page.addInitScript(()=>localStorage.setItem('cinderborn-rpg-v1','{bad'));await page.reload();await expect(page.locator('[data-ui="new"]')).toBeVisible();
});
test('RPG: saving unavailable is visible and does not block a new journey',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('blocked');};});await page.goto(url);await ui(page,'new');await expect(page.locator('#save-status')).toContainText('Saving unavailable');await speak(page,'rook','begin');expect((await game(page)).quests.metRook).toBe(true);
});

test('RPG: discover Hollowfang loot, equip it, rest and fast travel',async({page},info)=>{
 test.setTimeout(90_000);await page.goto(url);await ui(page,'new');await speak(page,'rook','begin');
 await go(page,{x:840,y:410});await fight(page,'hollowfang');await go(page,{x:840,y:410});await page.keyboard.press('KeyE');
 expect((await game(page)).bag).toContain('ranger');await develop(page);expect((await game(page)).gear.armor).toBe('ranger');
 await go(page,{x:1450,y:890});await advance(page,300);for(const e of (await game(page)).enemies.filter(e=>e.aggro&&!e.dead))await fight(page,e.id);await go(page,{x:1450,y:890});await advance(page,5000);await page.keyboard.press('KeyE');expect((await game(page)).checkpoint).toBe('waystone');
 await ui(page,'map');await ui(page,'travel:campfire');expect((await game(page)).player.x).toBe(360);await page.keyboard.press('KeyE');expect((await game(page)).player.potions).toBeGreaterThanOrEqual(3);
 await ui(page,'map');await ui(page,'travel:waystone');expect((await game(page)).player.x).toBe(1450);await page.screenshot({path:info.outputPath('waystone.png')});
});
test('RPG: telegraphs, dodge, falling, reload and recovery retain progress',async({page},info)=>{
 await page.goto(url);await ui(page,'new');await speak(page,'rook','begin');await mapWalk(page,{x:720,y:820});
 for(let i=0;i<100;i++){await advance(page,100);if((await game(page)).enemies.some(e=>e.mark))break;}
 expect((await game(page)).enemies.some(e=>e.mark)).toBe(true);await page.screenshot({path:info.outputPath('telegraph.png')});
 await page.keyboard.down('KeyD');await page.keyboard.press('Digit4');await advance(page,220);await page.keyboard.up('KeyD');expect((await game(page)).cooldowns.dash).toBeGreaterThan(0);
 await advance(page,40000);expect((await game(page)).mode).toBe('fallen');await page.screenshot({path:info.outputPath('fallen.png')});
 await page.reload();await ui(page,'continue');expect((await game(page)).mode).toBe('fallen');await ui(page,'revive');const s=await game(page);expect(s.quests.metRook).toBe(true);expect(s.player.hp).toBe(s.player.maxHp);expect(s.deaths).toBe(1);expect(s.player.x).toBe(360);
});
