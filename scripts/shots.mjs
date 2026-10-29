// Screenshot every topic (or the slugs passed as args) at the review widths in both
// themes, and fail if anything scrolls sideways. Uses the last `pnpm build`.
//
//   pnpm shots                                   all topics
//   pnpm shots github/copilot-usage-billing      one topic
//   pnpm shots --out shots/before                custom output folder

import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { hydrate, root, startPreview, topicSlugs } from './lib/preview.mjs';

const WIDTHS = [375, 650, 1440];
const THEMES = ['dark', 'light'];

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const outDir = path.resolve(root, outIndex >= 0 ? args.splice(outIndex, 2)[1] : 'shots');
const slugs = args.length ? args : await topicSlugs();

const { base: BASE, stop } = await startPreview();
const problems = [];
let browser;

try {
  browser = await chromium.launch();
  for (const slug of slugs) {
    const folder = path.join(outDir, slug.replaceAll('/', '__'));
    await mkdir(folder, { recursive: true });

    for (const theme of THEMES) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
      await context.addInitScript((t) => localStorage.setItem('theme', t), theme);
      const page = await context.newPage();

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        const response = await page.goto(BASE + slug + '/', { waitUntil: 'networkidle' });
        if (!response?.ok()) {
          problems.push(`${slug}: HTTP ${response?.status()}`);
          break;
        }

        await hydrate(page);

        const overflow = await page.evaluate(() => {
          const { scrollWidth, clientWidth: limit } = document.documentElement;
          if (scrollWidth <= limit) return [];
          const culprits = [...document.querySelectorAll('main *')]
            .filter((el) => el.getBoundingClientRect().right > limit + 1)
            .filter((el) => !el.parentElement || el.parentElement.getBoundingClientRect().right <= limit + 1)
            .slice(0, 5)
            .map((el) => `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).trim().split(/\s+/).join('.') : ''}`);
          return culprits.length ? culprits : [`document (scrollWidth ${scrollWidth} > clientWidth ${limit})`];
        });
        if (overflow.length) problems.push(`${slug} @ ${width}px ${theme}: horizontal scroll from ${overflow.join(', ')}`);

        const file = path.join(folder, `${width}-${theme}.png`);
        await page.screenshot({ path: file, fullPage: true });
        console.log(path.relative(root, file));
      }
      await context.close();
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
console.log(`\nNo horizontal scroll at ${WIDTHS.join(', ')}px in ${THEMES.join(' and ')} themes.`);
