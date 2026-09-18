/**
 * Core puzzle model: an N×N grid partitioned into N connected colored
 * regions. The player must place exactly N "foxes" so that there is one per
 * row, one per column, one per region, and no two foxes touch (including
 * diagonally).
 *
 * Everything in this file is pure TypeScript with no React Native imports so
 * it can be unit tested in Node and reused on any platform.
 */
import { Rng, hashString } from './rng';

export type CellState = 0 | 1 | 2; // 0 empty, 1 marked (X), 2 fox
export const EMPTY: CellState = 0;
export const MARK: CellState = 1;
export const FOX: CellState = 2;

export interface Puzzle {
  size: number;
  /** regions[row][col] = region id in [0, size). */
  regions: number[][];
  /** solution[row] = column of the fox in that row. */
  solution: number[];
  seed: number;
  /** 0 = only basic deductions, higher = needed deeper reasoning / guessing. */
  difficulty: number;
}

export type Grid = CellState[][];

export function emptyGrid(size: number): Grid {
  return Array.from({ length: size }, () => Array<CellState>(size).fill(EMPTY));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => row.slice());
}

/** Two cells touch if they are within 1 step in both axes (8-neighbourhood). */
export function touches(r1: number, c1: number, r2: number, c2: number): boolean {
  return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && !(r1 === r2 && c1 === c2);
}

// ---------------------------------------------------------------------------
// Solution placement
// ---------------------------------------------------------------------------

/**
 * Generate a random placement of N foxes satisfying row/column uniqueness and
 * the no-touch rule. Regions are grown around it afterwards, so any such
 * placement is a valid basis.
 */
function randomPlacement(size: number, rng: Rng): number[] | null {
  const cols: number[] = [];
  const usedCol = new Array<boolean>(size).fill(false);

  const place = (row: number): boolean => {
    if (row === size) return true;
    const candidates = rng.shuffle(Array.from({ length: size }, (_, i) => i));
    for (const c of candidates) {
      if (usedCol[c]) continue;
      if (row > 0 && Math.abs(cols[row - 1] - c) <= 1) continue;
      usedCol[c] = true;
      cols[row] = c;
      if (place(row + 1)) return true;
      usedCol[c] = false;
    }
    return false;
  };

  return place(0) ? cols : null;
}

// ---------------------------------------------------------------------------
// Region growth
// ---------------------------------------------------------------------------

const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * Grow N connected regions, one seeded on each fox. Each region gets a random
 * appetite so sizes end up lopsided (a few large sprawling regions and a few
 * tiny ones), which is what makes these puzzles constrain well.
 */
function growRegions(size: number, solution: number[], rng: Rng): number[][] {
  const regions: number[][] = Array.from({ length: size }, () => Array<number>(size).fill(-1));
  for (let r = 0; r < size; r++) regions[r][solution[r]] = r;
  const appetite = Array.from({ length: size }, () => 0.12 + Math.pow(rng.next(), 2));

  let remaining = size * size - size;
  while (remaining > 0) {
    const frontier: Array<[number, number, number]> = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const id = regions[r][c];
        if (id < 0) continue;
        for (const [dr, dc] of DIRS) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
          if (regions[nr][nc] === -1) frontier.push([id, nr, nc]);
        }
      }
    }
    let total = 0;
    for (const [id] of frontier) total += appetite[id];
    let pick = rng.next() * total;
    let chosen = frontier[frontier.length - 1];
    for (const f of frontier) {
      pick -= appetite[f[0]];
      if (pick <= 0) {
        chosen = f;
        break;
      }
    }
    const [id, r, c] = chosen;
    regions[r][c] = id;
    remaining--;
  }
  return regions;
}

/** True if region `id` stays 4-connected when `regions[sr][sc]` is ignored. */
function regionConnectedWithout(regions: number[][], id: number, sr: number, sc: number): boolean {
  const size = regions.length;
  let start: [number, number] | null = null;
  let total = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regions[r][c] === id && !(r === sr && c === sc)) {
        total++;
        if (!start) start = [r, c];
      }
    }
  }
  if (!start) return false;
  const seen = new Set<number>([start[0] * size + start[1]]);
  const stack: Array<[number, number]> = [start];
  while (stack.length) {
    const [r, c] = stack.pop()!;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
      if (nr === sr && nc === sc) continue;
      if (regions[nr][nc] !== id) continue;
      const k = nr * size + nc;
      if (!seen.has(k)) {
        seen.add(k);
        stack.push([nr, nc]);
      }
    }
  }
  return seen.size === total;
}

/**
 * Hill-climb towards uniqueness: while alternate solutions exist, take a cell
 * where an alternate solution puts a fox and hand it to a neighbouring region
 * (keeping every region connected and every true fox inside its own region).
 * A move is kept if it does not increase the solution count.
 */
function repairUniqueness(
  regions: number[][],
  solution: number[],
  rng: Rng,
  maxSteps: number,
): boolean {
  const size = regions.length;
  const LIMIT = 40;
  let { count, all } = enumerateSolutions(regions, LIMIT);
  for (let step = 0; step < maxSteps && count > 1; step++) {
    const alt = all.find((s) => s.some((c, r) => c !== solution[r]));
    if (!alt) break;
    const rows = rng.shuffle(
      Array.from({ length: size }, (_, r) => r).filter((r) => alt[r] !== solution[r]),
    );
    let moved = false;
    for (const r of rows) {
      const c = alt[r];
      const from = regions[r][c];
      const neighbours = rng.shuffle(
        DIRS.map(([dr, dc]) => [r + dr, c + dc])
          .filter(([nr, nc]) => nr >= 0 && nc >= 0 && nr < size && nc < size)
          .map(([nr, nc]) => regions[nr][nc])
          .filter((id) => id !== from),
      );
      for (const to of neighbours) {
        // The true fox of `from` must stay in `from`.
        if (solution[r] === c) continue;
        if (!regionConnectedWithout(regions, from, r, c)) continue;
        regions[r][c] = to;
        const next = enumerateSolutions(regions, LIMIT);
        if (next.count <= count) {
          count = next.count;
          all = next.all;
          moved = true;
          break;
        }
        regions[r][c] = from;
      }
      if (moved) break;
    }
    if (!moved) return false;
  }
  return count === 1;
}

// ---------------------------------------------------------------------------
// Brute-force solver (used for uniqueness checks and hints)
// ---------------------------------------------------------------------------

/**
 * Count solutions up to `limit`. Returns the number found (≤ limit) and the
 * first solution if any.
 */
export function countSolutions(
  regions: number[][],
  limit = 2,
): { count: number; first: number[] | null } {
  const { count, all } = enumerateSolutions(regions, limit);
  return { count, first: all[0] ?? null };
}

/** Enumerate solutions up to `limit`. */
export function enumerateSolutions(
  regions: number[][],
  limit: number,
): { count: number; all: number[][] } {
  const size = regions.length;
  const cols: number[] = [];
  const usedCol = new Array<boolean>(size).fill(false);
  const usedRegion = new Array<boolean>(size).fill(false);
  let count = 0;
  const all: number[][] = [];

  const go = (row: number): boolean => {
    if (row === size) {
      count++;
      all.push(cols.slice());
      return count >= limit;
    }
    for (let c = 0; c < size; c++) {
      if (usedCol[c]) continue;
      const reg = regions[row][c];
      if (usedRegion[reg]) continue;
      if (row > 0 && Math.abs(cols[row - 1] - c) <= 1) continue;
      usedCol[c] = true;
      usedRegion[reg] = true;
      cols[row] = c;
      const stop = go(row + 1);
      usedCol[c] = false;
      usedRegion[reg] = false;
      if (stop) return true;
    }
    return false;
  };

  go(0);
  return { count, all };
}

// ---------------------------------------------------------------------------
// Deductive solver (rates how "human" a puzzle is)
// ---------------------------------------------------------------------------

/**
 * Attempts to solve using only logical deductions a person would make:
 *  L0  eliminate cells seen by a placed fox; place forced singles
 *  L1  a region's candidates all in one row/col → clear rest of that row/col
 *      a row/col's candidates all in one region → clear rest of that region
 *  L2  two regions confined to two rows/cols (or two rows/cols to two regions)
 *  L3  the same with larger sets
 * Returns the highest level needed, or -1 if deductions alone do not solve it.
 */
export function rateDifficulty(regions: number[][]): number {
  const size = regions.length;
  // cand[r][c] true if fox still possible there.
  const cand: boolean[][] = Array.from({ length: size }, () => Array(size).fill(true));
  const foxes: Array<[number, number]> = [];
  let maxLevel = 0;

  const eliminateForFox = (fr: number, fc: number) => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (r === fr && c === fc) continue;
        if (r === fr || c === fc || regions[r][c] === regions[fr][fc] || touches(fr, fc, r, c)) {
          cand[r][c] = false;
        }
      }
    }
  };

  const placeFox = (r: number, c: number) => {
    foxes.push([r, c]);
    eliminateForFox(r, c);
  };

  const unitCells = (kind: 'row' | 'col' | 'reg', idx: number): Array<[number, number]> => {
    const out: Array<[number, number]> = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!cand[r][c]) continue;
        if (kind === 'row' && r === idx) out.push([r, c]);
        else if (kind === 'col' && c === idx) out.push([r, c]);
        else if (kind === 'reg' && regions[r][c] === idx) out.push([r, c]);
      }
    }
    return out;
  };

  const hasFox = (kind: 'row' | 'col' | 'reg', idx: number) =>
    foxes.some(([r, c]) =>
      kind === 'row' ? r === idx : kind === 'col' ? c === idx : regions[r][c] === idx,
    );

  const kinds: Array<'row' | 'col' | 'reg'> = ['row', 'col', 'reg'];

  for (let guard = 0; guard < size * size * 4; guard++) {
    if (foxes.length === size) return maxLevel;
    let progressed = false;

    // L0: singles.
    for (const kind of kinds) {
      for (let i = 0; i < size; i++) {
        if (hasFox(kind, i)) continue;
        const cells = unitCells(kind, i);
        if (cells.length === 0) return -1; // contradiction: should not happen
        if (cells.length === 1) {
          placeFox(cells[0][0], cells[0][1]);
          progressed = true;
        }
      }
    }
    if (progressed) continue;

    // L1: confinement.
    for (let reg = 0; reg < size; reg++) {
      if (hasFox('reg', reg)) continue;
      const cells = unitCells('reg', reg);
      const rows = new Set(cells.map(([r]) => r));
      const colsSet = new Set(cells.map(([, c]) => c));
      if (rows.size === 1) {
        const row = cells[0][0];
        for (let c = 0; c < size; c++) {
          if (cand[row][c] && regions[row][c] !== reg) {
            cand[row][c] = false;
            progressed = true;
          }
        }
      }
      if (colsSet.size === 1) {
        const col = cells[0][1];
        for (let r = 0; r < size; r++) {
          if (cand[r][col] && regions[r][col] !== reg) {
            cand[r][col] = false;
            progressed = true;
          }
        }
      }
    }
    for (const kind of ['row', 'col'] as const) {
      for (let i = 0; i < size; i++) {
        if (hasFox(kind, i)) continue;
        const cells = unitCells(kind, i);
        const regs = new Set(cells.map(([r, c]) => regions[r][c]));
        if (regs.size === 1) {
          const reg = cells[0] ? regions[cells[0][0]][cells[0][1]] : -1;
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              const inUnit = kind === 'row' ? r === i : c === i;
              if (cand[r][c] && regions[r][c] === reg && !inUnit) {
                cand[r][c] = false;
                progressed = true;
              }
            }
          }
        }
      }
    }
    if (progressed) {
      maxLevel = Math.max(maxLevel, 1);
      continue;
    }

    // L2+: a set of k regions whose candidates all lie within k rows (or
    // columns) must own those rows, so every other region is cleared from
    // them. The dual holds too: k rows whose candidates lie within k regions
    // clear the rest of those regions. Level = 2 for pairs, 3 for larger sets.
    let subsetLevel = 0;
    const openRegs = Array.from({ length: size }, (_, i) => i).filter((i) => !hasFox('reg', i));
    const lineSets = (axis: 'row' | 'col') =>
      openRegs.map((reg) => new Set(unitCells('reg', reg).map(([r, c]) => (axis === 'row' ? r : c))));

    for (const axis of ['row', 'col'] as const) {
      if (progressed) break;
      const sets = lineSets(axis);
      const m = openRegs.length;
      // Enumerate subsets of open regions (m ≤ 10 → ≤ 1024 subsets).
      for (let mask = 1; mask < 1 << m && !progressed; mask++) {
        const members: number[] = [];
        const union = new Set<number>();
        for (let i = 0; i < m; i++) {
          if (mask & (1 << i)) {
            members.push(openRegs[i]);
            for (const l of sets[i]) union.add(l);
          }
        }
        if (members.length < 2 || members.length === m) continue;
        if (union.size !== members.length) continue;
        const memberSet = new Set(members);
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const line = axis === 'row' ? r : c;
            if (union.has(line) && cand[r][c] && !memberSet.has(regions[r][c])) {
              cand[r][c] = false;
              progressed = true;
            }
          }
        }
        if (progressed) subsetLevel = members.length === 2 ? 2 : 3;
      }
    }
    // Dual: k open rows (or columns) whose candidates sit in exactly k regions.
    for (const axis of ['row', 'col'] as const) {
      if (progressed) break;
      const openLines = Array.from({ length: size }, (_, i) => i).filter((i) => !hasFox(axis, i));
      const regSets = openLines.map(
        (line) => new Set(unitCells(axis, line).map(([r, c]) => regions[r][c])),
      );
      const m = openLines.length;
      for (let mask = 1; mask < 1 << m && !progressed; mask++) {
        const members: number[] = [];
        const union = new Set<number>();
        for (let i = 0; i < m; i++) {
          if (mask & (1 << i)) {
            members.push(openLines[i]);
            for (const g of regSets[i]) union.add(g);
          }
        }
        if (members.length < 2 || members.length === m) continue;
        if (union.size !== members.length) continue;
        const memberSet = new Set(members);
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const line = axis === 'row' ? r : c;
            if (union.has(regions[r][c]) && cand[r][c] && !memberSet.has(line)) {
              cand[r][c] = false;
              progressed = true;
            }
          }
        }
        if (progressed) subsetLevel = members.length === 2 ? 2 : 3;
      }
    }
    if (progressed) {
      maxLevel = Math.max(maxLevel, subsetLevel);
      continue;
    }

    return -1; // stuck: would need trial and error
  }
  return foxes.length === size ? maxLevel : -1;
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

export interface GenerateOptions {
  size: number;
  seed: number;
  /** Reject puzzles that need trial and error. */
  requireLogical?: boolean;
  /** Reject puzzles below this deductive level (0-2). */
  minDifficulty?: number;
  maxAttempts?: number;
}

/**
 * Single-cell regions are instant giveaways. Allow at most one of them and at
 * most two regions of size ≤ 2 so bigger boards keep some bite.
 */
function tooManyTinyRegions(regions: number[][]): boolean {
  const size = regions.length;
  const counts = new Array<number>(size).fill(0);
  for (const row of regions) for (const id of row) counts[id]++;
  const singles = counts.filter((n) => n === 1).length;
  const tiny = counts.filter((n) => n <= 2).length;
  return singles > 1 || tiny > 2;
}

export function generatePuzzle(opts: GenerateOptions): Puzzle {
  const { size, seed, requireLogical = true, minDifficulty = 0, maxAttempts = 250 } = opts;
  const rng = new Rng(seed);
  let fallback: Puzzle | null = null; // unique but not meeting difficulty wishes
  let lastResort: Puzzle | null = null; // unique but with too many tiny regions

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = randomPlacement(size, rng);
    if (!solution) continue;
    const regions = growRegions(size, solution, rng);
    const tinyBefore = tooManyTinyRegions(regions);
    if (tinyBefore && lastResort) continue; // don't waste repair effort
    if (!repairUniqueness(regions, solution, rng, size * 6)) continue;
    const difficulty = rateDifficulty(regions);
    const puzzle: Puzzle = { size, regions, solution, seed, difficulty };
    if (tooManyTinyRegions(regions)) {
      if (!lastResort) lastResort = puzzle;
      continue;
    }
    if (requireLogical && difficulty < 0) {
      if (!fallback) fallback = puzzle;
      continue;
    }
    if (difficulty >= 0 && difficulty < minDifficulty) {
      if (!fallback) fallback = puzzle;
      continue;
    }
    return puzzle;
  }
  if (fallback) return fallback;
  if (lastResort) return lastResort;
  throw new Error(`Could not generate a unique ${size}×${size} puzzle for seed ${seed}`);
}

// ---------------------------------------------------------------------------
// Board evaluation
// ---------------------------------------------------------------------------

export interface Conflict {
  row: number;
  col: number;
}

/**
 * Returns the set of fox cells that currently break a rule. Used to tint
 * cells red without revealing the solution.
 */
export function findConflicts(puzzle: Puzzle, grid: Grid): Conflict[] {
  const foxes: Array<[number, number]> = [];
  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      if (grid[r][c] === FOX) foxes.push([r, c]);
    }
  }
  const bad = new Set<string>();
  for (let i = 0; i < foxes.length; i++) {
    for (let j = i + 1; j < foxes.length; j++) {
      const [r1, c1] = foxes[i];
      const [r2, c2] = foxes[j];
      const sameRegion = puzzle.regions[r1][c1] === puzzle.regions[r2][c2];
      if (r1 === r2 || c1 === c2 || sameRegion || touches(r1, c1, r2, c2)) {
        bad.add(`${r1},${c1}`);
        bad.add(`${r2},${c2}`);
      }
    }
  }
  return [...bad].map((k) => {
    const [row, col] = k.split(',').map(Number);
    return { row, col };
  });
}

export function countFoxes(grid: Grid): number {
  let n = 0;
  for (const row of grid) for (const v of row) if (v === FOX) n++;
  return n;
}

/** Solved when every row has its fox in the solution column and nothing else is a fox. */
export function isSolved(puzzle: Puzzle, grid: Grid): boolean {
  if (countFoxes(grid) !== puzzle.size) return false;
  for (let r = 0; r < puzzle.size; r++) {
    if (grid[r][puzzle.solution[r]] !== FOX) return false;
  }
  return true;
}

/**
 * Pick a hint: prefer fixing a wrongly placed fox, otherwise reveal a fox in
 * a row that has none yet. Returns null when the board is already solved.
 */
export function pickHint(
  puzzle: Puzzle,
  grid: Grid,
): { row: number; col: number; kind: 'remove' | 'place' } | null {
  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      if (grid[r][c] === FOX && puzzle.solution[r] !== c) return { row: r, col: c, kind: 'remove' };
    }
  }
  const rows = Array.from({ length: puzzle.size }, (_, i) => i).filter(
    (r) => grid[r][puzzle.solution[r]] !== FOX,
  );
  if (rows.length === 0) return null;
  // Deterministic but varied pick so repeated hints don't always start at row 0.
  const r = rows[hashString(`${puzzle.seed}:${rows.length}`) % rows.length];
  return { row: r, col: puzzle.solution[r], kind: 'place' };
}
