import { test, expect } from '@playwright/test';
import pages from './pages.en.ts';

for (const entry of pages) {
  test(`screenshot ${entry.name}`, async ({ page: p }, testInfo) => {
    await p.goto(entry.route, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const suffix = testInfo.project.name;
    await expect(p).toHaveScreenshot(`${entry.name}-${suffix}.png`, { fullPage: true });
  });
}
