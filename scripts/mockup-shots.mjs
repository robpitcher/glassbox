// Screenshot HTML mockups in dark and light so the user can compare ideas before any Svelte is written.
//
//   pnpm mockup-shots mockups/seat-toggle.html "mockups/seat-toggle.html?m=b&sel=ray"
//
// Each argument is a file path with an optional query string. PNGs land next to the HTML,
// named after the file and query, for example mockups/seat-toggle--m-b-sel-ray-light.png.

import { access } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { root } from './lib/preview.mjs';

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: pnpm mockup-shots mockups/<name>.html["?query"] ...');
  process.exit(1);
}

const problems = [];
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (e) => problems.push(e.message));

  for (const arg of args) {
    const [file, query = ''] = arg.split('?');
    const abs = path.resolve(root, file);
    try {
      await access(abs);
    } catch {
      problems.push(`${file}: not found`);
      continue;
    }
    const stem = abs.replace(/\.html?$/, '') + (query ? '--' + query.replace(/[^a-z0-9]+/gi, '-').toLowerCase() : '');

    for (const theme of ['dark', 'light']) {
      await page.goto(pathToFileURL(abs).href + (query ? `?${query}` : ''));
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      await page.waitForTimeout(300);
      const out = `${stem}-${theme}.png`;
      await page.screenshot({ path: out, fullPage: true });
      console.log(path.relative(root, out));
    }
  }
} finally {
  await browser.close();
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
