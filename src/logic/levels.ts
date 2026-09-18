import { generatePuzzle, Puzzle } from './puzzle';
import { hashString } from './rng';

const GAME_SALT = 'fox-fields-v1';

export interface LevelSpec {
  size: number;
  requireLogical: boolean;
  minDifficulty: number;
}

/** Grid size and constraints ramp up with the level number. Levels are endless. */
export function levelSpec(level: number): LevelSpec {
  if (level <= 4) return { size: 5, requireLogical: true, minDifficulty: 0 };
  if (level <= 10) return { size: 6, requireLogical: true, minDifficulty: 0 };
  if (level <= 20) return { size: 7, requireLogical: true, minDifficulty: 1 };
  if (level <= 35) return { size: 8, requireLogical: true, minDifficulty: 1 };
  if (level <= 60) return { size: 9, requireLogical: true, minDifficulty: 1 };
  // Beyond 60 alternate between 9 and 10, and occasionally allow
  // puzzles that need a little trial and error.
  const size = level % 3 === 0 ? 10 : 9;
  return { size, requireLogical: level % 5 !== 0, minDifficulty: 1 };
}

export function levelSeed(level: number): number {
  return hashString(`${GAME_SALT}:${level}`);
}

const cache = new Map<number, Puzzle>();

export function puzzleForLevel(level: number): Puzzle {
  const cached = cache.get(level);
  if (cached) return cached;
  const spec = levelSpec(level);
  const puzzle = generatePuzzle({
    size: spec.size,
    seed: levelSeed(level),
    requireLogical: spec.requireLogical,
    minDifficulty: spec.minDifficulty,
  });
  cache.set(level, puzzle);
  return puzzle;
}
