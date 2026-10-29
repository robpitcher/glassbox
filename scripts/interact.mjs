// Drive every diagram island by keyboard and fail if the interaction rules in AGENTS.md break.
// For each `.visual` section and each toggle state, it focuses every selectable button, presses
// Enter, and checks that the button is pressed and the info bar changes, then presses Esc and
// checks that the selection and info bar reset. Uses the last `pnpm build`.
//
//   pnpm interact                         all topics
//   pnpm interact github/copilot-access   one topic
//
// Writes one screenshot per section and toggle state to shots/<slug>/interact-*.png.

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { hydrate, root, startPreview, topicSlugs } from './lib/preview.mjs';

const args = process.argv.slice(2);
const slugs = args.length ? args : await topicSlugs();

const { base, stop } = await startPreview();
const problems = [];
let browser;

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));

  for (const slug of slugs) {
    const folder = path.join(root, 'shots', slug.replaceAll('/', '__'));
    await mkdir(folder, { recursive: true });
    await page.goto(base + slug + '/', { waitUntil: 'networkidle' });
    await hydrate(page);

    const sections = page.locator('section.visual');
    const sectionCount = await sections.count();
    if (!sectionCount) console.log(`${slug}: no .visual sections`);

    for (let s = 0; s < sectionCount; s++) {
      const section = sections.nth(s);
      const name = (await section.locator('h2').first().innerText().catch(() => `section ${s + 1}`)).trim();
      const info = section.locator('.info').last();
      const toggles = section.locator('.segmented button');
      const items = section.locator('button[aria-pressed]:not(.segmented button)');
      const states = Math.max(1, await toggles.count());

      for (let t = 0; t < states; t++) {
        let state = 'default';
        if (await toggles.count()) {
          await toggles.nth(t).click();
          state = (await toggles.nth(t).innerText()).trim();
          if ((await toggles.nth(t).getAttribute('aria-pressed')) !== 'true') {
            problems.push(`${slug} › ${name} › ${state}: toggle not pressed after click`);
          }
        }
        const where = `${slug} › ${name} › ${state}`;
        await page.keyboard.press('Escape');
        const total = await items.count();
        const defaultInfo = (await info.count()) ? await info.innerText() : null;
        if (defaultInfo === null && total) problems.push(`${where}: selectable items but no .info bar`);

        let checked = 0;
        for (let i = 0; i < total; i++) {
          const item = items.nth(i);
          if (!(await item.isVisible())) continue;
          const label = ((await item.getAttribute('aria-label')) || (await item.innerText())).split(/[\n:,]/)[0].trim();
          await item.focus();
          await page.keyboard.press('Enter');
          if ((await item.getAttribute('aria-pressed')) !== 'true') problems.push(`${where} › ${label}: Enter didn't set aria-pressed`);
          if (defaultInfo !== null && (await info.innerText()) === defaultInfo) {
            problems.push(`${where} › ${label}: info bar didn't change`);
          }
          await page.keyboard.press('Escape');
          if ((await section.locator('button[aria-pressed="true"]:not(.segmented button)').count()) > 0) {
            problems.push(`${where} › ${label}: Esc didn't clear the selection`);
          }
          if (defaultInfo !== null && (await info.innerText()) !== defaultInfo) {
            problems.push(`${where} › ${label}: info bar didn't reset after Esc`);
          }
          checked++;
        }

        const file = path.join(folder, `interact-${s + 1}-${slugify(state)}.png`);
        await section.screenshot({ path: file });
        console.log(`${where}: ${checked} items · ${path.relative(root, file)}`);
      }
    }
  }
} finally {
  await browser?.close();
  stop();
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('\nEvery item selects with Enter, updates the info bar, and clears with Esc.');
