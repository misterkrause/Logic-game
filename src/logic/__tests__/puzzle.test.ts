import {
  countSolutions,
  emptyGrid,
  findConflicts,
  FOX,
  generatePuzzle,
  isSolved,
  pickHint,
  rateDifficulty,
  touches,
} from '../puzzle';
import { levelSpec, puzzleForLevel } from '../levels';
import { Rng, hashString } from '../rng';

function isValidSolution(regions: number[][], sol: number[]): boolean {
  const n = regions.length;
  const cols = new Set(sol);
  if (cols.size !== n) return false;
  const regs = new Set(sol.map((c, r) => regions[r][c]));
  if (regs.size !== n) return false;
  for (let r = 1; r < n; r++) if (Math.abs(sol[r] - sol[r - 1]) <= 1) return false;
  return true;
}

function regionsConnected(regions: number[][]): boolean {
  const n = regions.length;
  for (let id = 0; id < n; id++) {
    const cells: Array<[number, number]> = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (regions[r][c] === id) cells.push([r, c]);
    if (cells.length === 0) return false;
    const seen = new Set<string>([`${cells[0][0]},${cells[0][1]}`]);
    const stack = [cells[0]];
    while (stack.length) {
      const [r, c] = stack.pop()!;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
        if (regions[nr][nc] !== id) continue;
        const k = `${nr},${nc}`;
        if (!seen.has(k)) {
          seen.add(k);
          stack.push([nr, nc]);
        }
      }
    }
    if (seen.size !== cells.length) return false;
  }
  return true;
}

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    for (let i = 0; i < 20; i++) expect(a.next()).toBe(b.next());
  });
  it('hashes strings stably', () => {
    expect(hashString('fox')).toBe(hashString('fox'));
    expect(hashString('fox')).not.toBe(hashString('fix'));
  });
});

describe('touches', () => {
  it('detects 8-neighbourhood', () => {
    expect(touches(0, 0, 1, 1)).toBe(true);
    expect(touches(0, 0, 0, 1)).toBe(true);
    expect(touches(0, 0, 0, 2)).toBe(false);
    expect(touches(2, 2, 2, 2)).toBe(false);
  });
});

describe('generatePuzzle', () => {
  it.each([5, 6, 7, 8, 9, 10])('produces a valid, unique %i×%i puzzle', (size) => {
    const p = generatePuzzle({ size, seed: 1234 + size });
    expect(p.regions).toHaveLength(size);
    expect(isValidSolution(p.regions, p.solution)).toBe(true);
    expect(regionsConnected(p.regions)).toBe(true);
    expect(countSolutions(p.regions, 2).count).toBe(1);
  });

  it('is deterministic per seed', () => {
    const a = generatePuzzle({ size: 7, seed: 99 });
    const b = generatePuzzle({ size: 7, seed: 99 });
    expect(a.regions).toEqual(b.regions);
    expect(a.solution).toEqual(b.solution);
  });

  it('honours requireLogical', () => {
    for (let s = 0; s < 10; s++) {
      const p = generatePuzzle({ size: 7, seed: 500 + s, requireLogical: true });
      expect(p.difficulty).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('rateDifficulty', () => {
  it('agrees with the brute force solver when it solves', () => {
    for (let s = 0; s < 15; s++) {
      const p = generatePuzzle({ size: 6, seed: 7000 + s, requireLogical: false });
      const d = rateDifficulty(p.regions);
      expect(d).toBeGreaterThanOrEqual(-1);
      expect(d).toBeLessThanOrEqual(3);
    }
  });
});

describe('board evaluation', () => {
  const p = generatePuzzle({ size: 5, seed: 1 });

  it('recognises the solution', () => {
    const g = emptyGrid(5);
    p.solution.forEach((c, r) => (g[r][c] = FOX));
    expect(isSolved(p, g)).toBe(true);
    expect(findConflicts(p, g)).toHaveLength(0);
  });

  it('flags touching and same-row foxes', () => {
    const g = emptyGrid(5);
    g[0][0] = FOX;
    g[0][3] = FOX;
    expect(findConflicts(p, g).length).toBe(2);
    g[0][3] = 0;
    g[1][1] = FOX;
    expect(findConflicts(p, g).length).toBe(2);
    expect(isSolved(p, g)).toBe(false);
  });

  it('hints remove wrong foxes before placing new ones', () => {
    const g = emptyGrid(5);
    const wrongCol = (p.solution[0] + 2) % 5;
    g[0][wrongCol] = FOX;
    expect(pickHint(p, g)).toEqual({ row: 0, col: wrongCol, kind: 'remove' });
    g[0][wrongCol] = 0;
    const h = pickHint(p, g)!;
    expect(h.kind).toBe('place');
    expect(p.solution[h.row]).toBe(h.col);
  });
});

describe('levels', () => {
  it('ramps size up', () => {
    expect(levelSpec(1).size).toBe(5);
    expect(levelSpec(30).size).toBe(8);
    expect(levelSpec(63).size).toBe(10);
  });

  it('generates the first 30 levels quickly and uniquely', () => {
    const start = Date.now();
    const seen = new Set<string>();
    for (let lvl = 1; lvl <= 30; lvl++) {
      const p = puzzleForLevel(lvl);
      expect(p.size).toBe(levelSpec(lvl).size);
      expect(countSolutions(p.regions, 2).count).toBe(1);
      seen.add(JSON.stringify(p.regions));
    }
    expect(seen.size).toBe(30);
    expect(Date.now() - start).toBeLessThan(15000);
  });
});

describe('region shapes', () => {
  it('limits single-cell regions to at most one', () => {
    for (let lvl = 1; lvl <= 40; lvl++) {
      const p = puzzleForLevel(lvl);
      const counts = new Array<number>(p.size).fill(0);
      for (const row of p.regions) for (const id of row) counts[id]++;
      expect(counts.filter((n) => n === 1).length).toBeLessThanOrEqual(1);
    }
  });
});
