// Screenshot every topic (or the slugs passed as args) at the review widths in both
// themes, and fail if anything scrolls sideways. Uses the last `pnpm build`.
//
//   pnpm shots                                   all topics
//   pnpm shots github/copilot-usage-billing      one topic
//   pnpm shots --out shots/before                custom output folder

import { spawn } from 'node:child_process';
import { mkdir, readdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WIDTHS = [375, 650, 1440];
const THEMES = ['dark', 'light'];

// Always serve this checkout's dist on a free port, so another worktree's preview on 4321 can't leak in.
const PORT = await new Promise((resolve) => {
  const probe = createServer().listen(0, '127.0.0.1', () => {
    const { port } = probe.address();
    probe.close(() => resolve(port));
  });
});
const BASE = `http://127.0.0.1:${PORT}/visual/`;

const args = process.argv.slice(2);
const outIndex = args.indexOf('--out');
const outDir = path.resolve(root, outIndex >= 0 ? args.splice(outIndex, 2)[1] : 'shots');
const slugs = args.length ? args : await topicSlugs();

async function topicSlugs(dir = path.join(root, 'src/content/topics'), prefix = '') {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) found.push(...(await topicSlugs(path.join(dir, entry.name), `${prefix}${entry.name}/`)));
    else if (/\.mdx?$/.test(entry.name)) found.push(prefix + entry.name.replace(/\.mdx?$/, ''));
  }
  return found;
}

async function reachable() {
  try {
    return (await fetch(BASE)).ok;
  } catch {
    return false;
  }
}

async function startPreview() {
  const astro = path.join(root, 'node_modules/astro/bin/astro.mjs');
  const server = spawn(process.execPath, [astro, 'preview', '--host', '127.0.0.1', '--port', String(PORT)], {
    cwd: root,
    stdio: 'ignore',
  });
  for (let i = 0; i < 60; i++) {
    if (await reachable()) return server;
    await new Promise((r) => setTimeout(r, 500));
  }
  server.kill();
  throw new Error('astro preview did not start. Run `pnpm build` first.');
}

const server = await startPreview();
const browser = await chromium.launch();
const problems = [];

try {
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

        // Scroll through so client:visible islands hydrate before the capture.
        await page.evaluate(async () => {
          for (let y = 0; y < document.body.scrollHeight; y += 600) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 60));
          }
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(300);

        const overflow = await page.evaluate(() => {
          const limit = document.documentElement.clientWidth;
          if (document.documentElement.scrollWidth <= limit) return [];
          return [...document.querySelectorAll('main *')]
            .filter((el) => el.getBoundingClientRect().right > limit + 1)
            .filter((el) => !el.parentElement || el.parentElement.getBoundingClientRect().right <= limit + 1)
            .slice(0, 5)
            .map((el) => `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).trim().split(/\s+/).join('.') : ''}`);
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
  await browser.close();
  server.kill();
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`\nNo horizontal scroll at ${WIDTHS.join(', ')}px in ${THEMES.join(' and ')} themes.`);
