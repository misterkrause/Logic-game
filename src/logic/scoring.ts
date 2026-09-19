/**
 * Star ratings.
 *  ★    solved
 *  ★★   solved with no hints and no mistakes
 *  ★★★  additionally finished within the par time for the board
 *
 * A "mistake" is placing a fox that breaks a rule against foxes already on
 * the board (same row/column/colour or touching). It is visible to the player
 * the moment it happens, so counting it reveals nothing about the solution.
 */

const PAR_BY_SIZE: Record<number, number> = {
  5: 60,
  6: 90,
  7: 150,
  8: 240,
  9: 330,
  10: 450,
};

/** Par time in seconds for a board of `size` and deductive `difficulty`. */
export function parSeconds(size: number, difficulty: number): number {
  const base = PAR_BY_SIZE[size] ?? Math.round(size * size * 4.5);
  const mult = difficulty < 0 ? 1.6 : difficulty >= 2 ? 1.3 : 1;
  return Math.round(base * mult);
}

export interface RunStats {
  hints: number;
  mistakes: number;
  seconds: number;
  par: number;
}

export interface StarBreakdown {
  solved: true;
  clean: boolean;
  fast: boolean;
  count: 1 | 2 | 3;
}

export function rateRun(stats: RunStats): StarBreakdown {
  const clean = stats.hints === 0 && stats.mistakes === 0;
  const fast = stats.seconds <= stats.par;
  const count = (1 + (clean ? 1 : 0) + (fast ? 1 : 0)) as 1 | 2 | 3;
  return { solved: true, clean, fast, count };
}
