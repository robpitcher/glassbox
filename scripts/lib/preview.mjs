// Serve this checkout's last `pnpm build` on a free port, so another worktree's preview on 4321 can't leak in.

import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Starts `astro preview` and resolves once it answers. Call `stop()` when done. */
export async function startPreview() {
  const port = await new Promise((resolve) => {
    const probe = createServer().listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
  const base = `http://127.0.0.1:${port}/visual/`;
  const astro = path.join(root, 'node_modules/astro/bin/astro.mjs');
  // --ignore-lock keeps astro in the foreground (it backgrounds itself under agents) so kill() stops it.
  const server = spawn(process.execPath, [astro, 'preview', '--ignore-lock', '--host', '127.0.0.1', '--port', String(port)], {
    cwd: root,
    stdio: 'ignore',
  });

  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) return { base, stop: () => server.kill() };
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  server.kill();
  throw new Error('astro preview did not start. Run `pnpm build` first.');
}

/** Lists topic slugs such as `github/copilot-access` from src/content/topics. */
export async function topicSlugs(dir = path.join(root, 'src/content/topics'), prefix = '') {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) found.push(...(await topicSlugs(path.join(dir, entry.name), `${prefix}${entry.name}/`)));
    else if (/\.mdx?$/.test(entry.name)) found.push(prefix + entry.name.replace(/\.mdx?$/, ''));
  }
  return found;
}

/** Scrolls through the page so client:visible islands hydrate. */
export async function hydrate(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
}
