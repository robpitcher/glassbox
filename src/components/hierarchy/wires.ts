/*
  Orthogonal router for the IdP group wires.
  It lays a fine grid over the stage and runs A* from each group chip to its team pill. Crossing text or
  controls is very expensive, running along a box border is costly, crossing one is cheap, and every bend
  costs extra, so wires take short, clean paths through the diagram's open space instead of its edges.
*/

export interface WireLeg {
  id: string;
  from: Element;
  to: Element;
}

export interface WirePath {
  id: string;
  d: string;
  head: string;
}

interface Rect {
  l: number;
  t: number;
  r: number;
  b: number;
}

/** 0 right, 1 down, 2 left, 3 up. Even directions are horizontal. */
type Dir = 0 | 1 | 2 | 3;
const DX = [1, 0, -1, 0];
const DY = [0, 1, 0, -1];

interface End {
  x: number;
  y: number;
  dir: Dir;
  cell: number;
  extra: number;
}

const CELL = 4;
/** Clearance kept around text and controls. */
const PAD = 3;
/** Soft clearance beyond PAD, so wires prefer the middle of a gap. */
const HALO = 8;
/** How close to a box border counts as being on it. */
const BAND = 7;
const COST = { block: 400, near: 2, along: 14, cross: 3, shared: 40, bend: 48, side: 24 };
const RADIUS = 6;
/** Space between an arrowhead and its pill. */
const GAP = 2;

// The name buttons stretch across their box, so only their visible tag and name count.
const OBSTACLES = [
  '.enterprise-name > *',
  '.org-name > *',
  '.visual-label',
  '.person',
  '.repo',
  '.team',
  '.group',
  '.idp',
  '.connector span',
  '.connector svg',
].join(',');
const BORDERS = ['.enterprise', '.org', '.accounts.inside', '.own', '.idp-box'].join(',');

class Heap {
  private f: number[] = [];
  private s: number[] = [];

  get size() {
    return this.f.length;
  }

  push(f: number, s: number) {
    let i = this.f.length;
    this.f.push(f);
    this.s.push(s);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.f[p] <= f) break;
      this.f[i] = this.f[p];
      this.s[i] = this.s[p];
      i = p;
    }
    this.f[i] = f;
    this.s[i] = s;
  }

  pop(): [number, number] {
    const top: [number, number] = [this.f[0], this.s[0]];
    const f = this.f.pop()!;
    const s = this.s.pop()!;
    const n = this.f.length;
    if (n) {
      let i = 0;
      for (;;) {
        let c = 2 * i + 1;
        if (c >= n) break;
        if (c + 1 < n && this.f[c + 1] < this.f[c]) c++;
        if (this.f[c] >= f) break;
        this.f[i] = this.f[c];
        this.s[i] = this.s[c];
        i = c;
      }
      this.f[i] = f;
      this.s[i] = s;
    }
    return top;
  }
}

const round = (n: number) => Math.round(n * 10) / 10;

export function routeWires(stage: HTMLElement, legs: WireLeg[]): WirePath[] {
  const o = stage.getBoundingClientRect();
  const cols = Math.max(1, Math.ceil(o.width / CELL));
  const rows = Math.max(1, Math.ceil(o.height / CELL));
  const n = cols * rows;
  const base = new Float32Array(n);
  const hBand = new Uint8Array(n);
  const vBand = new Uint8Array(n);
  const used = new Uint8Array(n);

  const rel = (el: Element): Rect => {
    const b = el.getBoundingClientRect();
    return { l: b.left - o.left, t: b.top - o.top, r: b.right - o.left, b: b.bottom - o.top };
  };
  const grow = (r: Rect, by: number): Rect => ({ l: r.l - by, t: r.t - by, r: r.r + by, b: r.b + by });
  // Visit every cell whose center falls inside r.
  const fill = (r: Rect, fn: (c: number) => void) => {
    const i0 = Math.max(0, Math.ceil(r.l / CELL - 0.5));
    const i1 = Math.min(cols - 1, Math.floor(r.r / CELL - 0.5));
    const j0 = Math.max(0, Math.ceil(r.t / CELL - 0.5));
    const j1 = Math.min(rows - 1, Math.floor(r.b / CELL - 0.5));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) fn(j * cols + i);
  };
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < o.width && y < o.height;
  const cellAt = (x: number, y: number) => Math.floor(y / CELL) * cols + Math.floor(x / CELL);
  const centerX = (c: number) => ((c % cols) + 0.5) * CELL;
  const centerY = (c: number) => (Math.floor(c / cols) + 0.5) * CELL;

  for (const el of stage.querySelectorAll(OBSTACLES)) {
    const r = rel(el);
    if (r.r - r.l < 1 || r.b - r.t < 1) continue;
    fill(grow(r, PAD + HALO), (c) => (base[c] = Math.max(base[c], COST.near)));
    fill(grow(r, PAD), (c) => (base[c] = COST.block));
  }
  for (const el of stage.querySelectorAll(BORDERS)) {
    const r = rel(el);
    fill({ l: r.l, r: r.r, t: r.t - BAND, b: r.t + BAND }, (c) => (hBand[c] = 1));
    fill({ l: r.l, r: r.r, t: r.b - BAND, b: r.b + BAND }, (c) => (hBand[c] = 1));
    fill({ l: r.l - BAND, r: r.l + BAND, t: r.t, b: r.b }, (c) => (vBand[c] = 1));
    fill({ l: r.r - BAND, r: r.r + BAND, t: r.t, b: r.b }, (c) => (vBand[c] = 1));
  }

  const end = (x: number, y: number, dir: Dir, cx: number, cy: number, extra: number): End | null =>
    inside(cx, cy) ? { x, y, dir, cell: cellAt(cx, cy), extra } : null;
  const off = PAD + CELL;

  // Wires leave a chip from its side or bottom, and arrive on a pill from above or, at a cost, from its side.
  const starts = (r: Rect) => {
    const cx = (r.l + r.r) / 2;
    const cy = (r.t + r.b) / 2;
    return [
      end(r.l, cy, 2, r.l - off, cy, 0),
      end(r.r, cy, 0, r.r + off, cy, 0),
      end(cx, r.b, 1, cx, r.b + off, 0),
    ].filter((e): e is End => e !== null);
  };
  const targets = (r: Rect) => {
    const cx = (r.l + r.r) / 2;
    const cy = (r.t + r.b) / 2;
    return [
      end(cx, r.t - GAP, 1, cx, r.t - off, 0),
      end(r.l - GAP, cy, 0, r.l - off, cy, COST.side),
      end(r.r + GAP, cy, 2, r.r + off, cy, COST.side),
    ].filter((e): e is End => e !== null);
  };

  function search(S: End[], T: End[]) {
    const g = new Float64Array(n * 4).fill(Number.POSITIVE_INFINITY);
    const prev = new Int32Array(n * 4).fill(-1);
    const heap = new Heap();
    const goals = T.map((t) => [t.cell % cols, Math.floor(t.cell / cols)]);
    const h = (c: number) => {
      const i = c % cols;
      const j = Math.floor(c / cols);
      let m = Number.POSITIVE_INFINITY;
      for (const [ti, tj] of goals) m = Math.min(m, Math.abs(i - ti) + Math.abs(j - tj));
      return m * CELL;
    };

    for (const s of S) {
      const st = s.cell * 4 + s.dir;
      if (s.extra < g[st]) {
        g[st] = s.extra;
        heap.push(s.extra + h(s.cell), st);
      }
    }

    let best = Number.POSITIVE_INFINITY;
    let bestState = -1;
    let bestEnd: End | null = null;
    while (heap.size) {
      const [f, st] = heap.pop();
      if (f >= best) break;
      const c = st >> 2;
      const d = st & 3;
      const gs = g[st];
      if (f > gs + h(c) + 1e-6) continue;
      for (const t of T) {
        if (t.cell === c && t.dir === d && gs + t.extra < best) {
          best = gs + t.extra;
          bestState = st;
          bestEnd = t;
        }
      }
      const i = c % cols;
      const j = Math.floor(c / cols);
      for (let nd = 0; nd < 4; nd++) {
        if (nd === ((d + 2) & 3)) continue;
        const ni = i + DX[nd];
        const nj = j + DY[nd];
        if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue;
        const nc = nj * cols + ni;
        const horizontal = nd % 2 === 0;
        let step = CELL + base[nc] + (used[nc] ? COST.shared : 0);
        if (hBand[nc]) step += horizontal ? COST.along : COST.cross;
        if (vBand[nc]) step += horizontal ? COST.cross : COST.along;
        if (nd !== d) step += COST.bend;
        const ns = nc * 4 + nd;
        const ng = gs + step;
        if (ng < g[ns]) {
          g[ns] = ng;
          prev[ns] = st;
          heap.push(ng + h(nc), ns);
        }
      }
    }
    if (bestState < 0 || !bestEnd) return null;

    const states: number[] = [];
    for (let s = bestState; s >= 0; s = prev[s]) states.push(s);
    states.reverse();
    const start = S.find((s) => s.cell * 4 + s.dir === states[0])!;
    return { start, finish: bestEnd, states };
  }

  // Turn the cell path into corner points. The first run lines up with the chip's center and the last
  // with the pill's, so wires meet both squarely.
  function corners(start: End, finish: End, states: number[]) {
    const fixed = (dir: Dir, x: number, y: number) => (dir % 2 === 0 ? y : x);
    const runs: { dir: Dir; at: number }[] = [{ dir: start.dir, at: fixed(start.dir, start.x, start.y) }];
    for (let k = 1; k < states.length; k++) {
      const d = (states[k] & 3) as Dir;
      if (d === runs[runs.length - 1].dir) continue;
      const c = states[k - 1] >> 2;
      runs.push({ dir: d, at: fixed(d, centerX(c), centerY(c)) });
    }

    const pts: [number, number][] = [[start.x, start.y]];
    const last = fixed(finish.dir, finish.x, finish.y);
    if (runs.length === 1) {
      // A straight run between offset ends needs a small jog halfway.
      if (Math.abs(runs[0].at - last) > 0.5) {
        if (start.dir % 2 === 0) {
          const mx = (start.x + finish.x) / 2;
          pts.push([mx, start.y], [mx, finish.y]);
        } else {
          const my = (start.y + finish.y) / 2;
          pts.push([start.x, my], [finish.x, my]);
        }
      }
    } else {
      runs[runs.length - 1].at = last;
      for (let k = 1; k < runs.length; k++) {
        const a = runs[k - 1];
        const b = runs[k];
        pts.push(a.dir % 2 === 0 ? [b.at, a.at] : [a.at, b.at]);
      }
    }
    pts.push([finish.x, finish.y]);
    return pts;
  }

  function draw(pts: [number, number][], dir: Dir) {
    let d = `M${round(pts[0][0])} ${round(pts[0][1])}`;
    for (let k = 1; k < pts.length - 1; k++) {
      const [px, py] = pts[k - 1];
      const [x, y] = pts[k];
      const [nx, ny] = pts[k + 1];
      const lin = Math.hypot(x - px, y - py);
      const lout = Math.hypot(nx - x, ny - y);
      const r = Math.min(RADIUS, lin / 2, lout / 2);
      if (r < 0.5) {
        d += `L${round(x)} ${round(y)}`;
        continue;
      }
      const ax = x - ((x - px) / lin) * r;
      const ay = y - ((y - py) / lin) * r;
      const bx = x + ((nx - x) / lout) * r;
      const by = y + ((ny - y) / lout) * r;
      d += `L${round(ax)} ${round(ay)}Q${round(x)} ${round(y)} ${round(bx)} ${round(by)}`;
    }
    const [ex, ey] = pts[pts.length - 1];
    d += `L${round(ex)} ${round(ey)}`;

    const ux = DX[dir];
    const uy = DY[dir];
    const bx = ex - ux * 4.5;
    const by = ey - uy * 4.5;
    const head = `M${round(bx - uy * 3.5)} ${round(by + ux * 3.5)}L${round(ex)} ${round(ey)}L${round(bx + uy * 3.5)} ${round(by - ux * 3.5)}`;
    return { d, head };
  }

  const out: WirePath[] = [];
  for (const leg of legs) {
    const S = starts(rel(leg.from));
    const T = targets(rel(leg.to));
    if (!S.length || !T.length) continue;
    const found = search(S, T);
    if (!found) continue;
    out.push({ id: leg.id, ...draw(corners(found.start, found.finish, found.states), found.finish.dir) });
    // Later wires pay to share cells with earlier ones, so they don't run on top of each other.
    for (const st of found.states) {
      const c = st >> 2;
      used[c] = 1;
      const i = c % cols;
      if (i > 0) used[c - 1] = 1;
      if (i < cols - 1) used[c + 1] = 1;
      if (c >= cols) used[c - cols] = 1;
      if (c + cols < n) used[c + cols] = 1;
    }
  }
  return out;
}
