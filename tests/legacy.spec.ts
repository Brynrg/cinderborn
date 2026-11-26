import { test, expect } from '@playwright/test';

const URL = 'http://localhost:4173/conclave.html';
async function dismissReports(page: import('@playwright/test').Page) {
  for(let i=0;i<12 && await page.locator('#story').isVisible() && await page.locator('#story-ok').isVisible();i++) await page.locator('#story-ok').click();
}
test('Conclave saves a pending decision and its resolution', async ({ page }) => {
  await page.goto(URL);
  await page.locator('#begin').click();
  await page.evaluate(() => {
    const g = (window as any).__cb;
    g.usedEvents = new Set(g.EVENTS.filter((e: any) => e.id !== 'emberkin').map((e: any) => e.id));
  });
  for (let turn = 2; turn <= 4; turn++) {
    await page.locator('#endturn').click();
    await expect(page.locator('#s-turn')).toHaveText(String(turn));
    await dismissReports(page);
  }
  await expect(page.locator('#story-title')).toHaveText('The Emberkin');
  await page.reload();
  await page.locator('#continue').click();
  await expect(page.locator('#story-title')).toHaveText('The Emberkin');
  await expect(page.locator('#story')).toBeVisible();
  const before = Number(await page.locator('#s-supply').textContent());
  await page.locator('#choice-a').click();
  await dismissReports(page);
  await expect(page.locator('#s-renown')).toHaveText('3');
  await page.reload();
  await page.locator('#continue').click();
  await expect(page.locator('#s-renown')).toHaveText('3');
  await expect(page.locator('#s-supply')).toHaveText(String(before - 5));
  await expect(page.locator('#story')).toBeHidden();
});

test('Conclave saves immediately and retains the used power', async ({ page }) => {
  await page.goto(URL);
  await page.locator('#begin').click();
  await page.reload();
  await page.locator('#continue').click();
  await page.keyboard.press('Tab');
  await page.locator('#p-firebrand').click();
  await page.reload();
  await page.locator('#continue').click();
  await page.keyboard.press('Tab');
  await expect(page.locator('#p-firebrand')).toBeDisabled();
  await expect(page.locator('#s-supply')).toHaveText('5');
});

test('Conclave keeps the board and turn button visible through laptop resizing', async ({ page }) => {
  await page.goto(URL);
  await page.locator('#begin').click();
  for (const viewport of [{width:1280,height:800}, {width:1600,height:1000}, {width:1024,height:768}, {width:1280,height:800}]) {
    await page.setViewportSize(viewport);
    for (const id of ['board','endturn','suspwrap']) {
      const b = await page.locator(`#${id}`).boundingBox();
      expect(b).not.toBeNull();
      expect(b!.x).toBeGreaterThanOrEqual(0);
      expect(b!.y).toBeGreaterThanOrEqual(0);
      expect(b!.x + b!.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(b!.y + b!.height).toBeLessThanOrEqual(viewport.height + 1);
    }
  }
});
