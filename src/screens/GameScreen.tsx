import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Board } from '../components/Board';
import { FoxFace } from '../components/FoxFace';
import { BackIcon, ClockIcon, GearIcon } from '../components/Icons';
import { Button, Chip, Pill, RoundButton } from '../components/ui';
import { difficultyLabel, formatTime } from '../format';
import * as haptics from '../haptics';
import { puzzleForLevel } from '../logic/levels';
import {
  cloneGrid,
  countFoxes,
  EMPTY,
  emptyGrid,
  findConflicts,
  FOX,
  Grid,
  isSolved,
  MARK,
  pickHint,
  touches,
} from '../logic/puzzle';
import { Settings } from '../storage';
import { colors, font } from '../theme';

interface Props {
  level: number;
  settings: Settings;
  onBack: () => void;
  onOpenSettings: () => void;
  onComplete: (level: number, seconds: number) => void;
  onNext: () => void;
}

export function GameScreen({ level, settings, onBack, onOpenSettings, onComplete, onNext }: Props) {
  const puzzle = useMemo(() => puzzleForLevel(level), [level]);
  const [grid, setGrid] = useState<Grid>(() => emptyGrid(puzzle.size));
  const [history, setHistory] = useState<Grid[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [hint, setHint] = useState<{ row: number; col: number } | null>(null);
  const [showWin, setShowWin] = useState(false);
  // The elapsed time is mirrored in a ref so the win effect can read it
  // without depending on it. Depending on `seconds` let a timer tick that
  // landed right after the solving tap cancel the pending win sheet.
  const secondsRef = useRef(0);
  secondsRef.current = seconds;

  const { width, height } = useWindowDimensions();
  const boardSize = Math.min(width - 40, height * 0.52, 520);

  // Warm the next level's puzzle while the player is busy with this one.
  useEffect(() => {
    const t = setTimeout(() => puzzleForLevel(level + 1), 1500);
    return () => clearTimeout(t);
  }, [level]);

  const solved = useMemo(() => isSolved(puzzle, grid), [puzzle, grid]);
  const conflicts = useMemo(
    () => new Set(findConflicts(puzzle, grid).map((c) => `${c.row},${c.col}`)),
    [puzzle, grid],
  );
  const placed = countFoxes(grid);

  // Timer.
  useEffect(() => {
    if (solved) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [solved]);

  // Win handling. Runs exactly once per solve; the screen is keyed by level
  // so a new level always mounts fresh.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  useEffect(() => {
    if (!solved) return;
    haptics.success(settings.haptics);
    onCompleteRef.current(level, secondsRef.current);
    const t = setTimeout(() => setShowWin(true), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved]);

  const commit = useCallback(
    (next: Grid) => {
      setHistory((h) => [...h.slice(-99), grid]);
      setGrid(next);
      setHint(null);
    },
    [grid],
  );

  const autoMark = useCallback(
    (g: Grid, fr: number, fc: number) => {
      for (let r = 0; r < puzzle.size; r++) {
        for (let c = 0; c < puzzle.size; c++) {
          if (r === fr && c === fc) continue;
          if (g[r][c] !== EMPTY) continue;
          if (
            r === fr ||
            c === fc ||
            puzzle.regions[r][c] === puzzle.regions[fr][fc] ||
            touches(fr, fc, r, c)
          ) {
            g[r][c] = MARK;
          }
        }
      }
    },
    [puzzle],
  );

  const onCellPress = useCallback(
    (r: number, c: number) => {
      if (solved) return;
      haptics.tap(settings.haptics);
      const next = cloneGrid(grid);
      const cur = next[r][c];
      next[r][c] = cur === EMPTY ? MARK : cur === MARK ? FOX : EMPTY;
      if (next[r][c] === FOX && settings.autoMark) autoMark(next, r, c);
      commit(next);
    },
    [grid, solved, settings, autoMark, commit],
  );

  const onCellLongPress = useCallback(
    (r: number, c: number) => {
      if (solved) return;
      haptics.tap(settings.haptics);
      const next = cloneGrid(grid);
      next[r][c] = grid[r][c] === FOX ? EMPTY : FOX;
      if (next[r][c] === FOX && settings.autoMark) autoMark(next, r, c);
      commit(next);
    },
    [grid, solved, settings, autoMark, commit],
  );

  const undo = () => {
    if (history.length === 0 || solved) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setGrid(prev);
    setHint(null);
  };

  const clear = () => {
    if (solved) return;
    commit(emptyGrid(puzzle.size));
  };

  const giveHint = () => {
    if (solved) return;
    const h = pickHint(puzzle, grid);
    if (!h) return;
    haptics.warn(settings.haptics);
    const next = cloneGrid(grid);
    next[h.row][h.col] = h.kind === 'remove' ? EMPTY : FOX;
    if (h.kind === 'place' && settings.autoMark) autoMark(next, h.row, h.col);
    commit(next);
    setHint({ row: h.row, col: h.col });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <RoundButton onPress={onBack} accessibilityLabel="Back to levels">
          <BackIcon />
        </RoundButton>
        <View style={styles.headerCenter}>
          <Text style={styles.levelTitle}>Level {level}</Text>
          <Text style={styles.levelSub}>
            {puzzle.size}×{puzzle.size} · {difficultyLabel(puzzle.difficulty)}
          </Text>
        </View>
        <RoundButton onPress={onOpenSettings} accessibilityLabel="Settings">
          <GearIcon />
        </RoundButton>
      </View>

      <View style={styles.status}>
        <Pill>
          <FoxFace size={22} />
          <Text style={styles.pillText}>
            <Text style={{ color: placed === puzzle.size ? colors.success : colors.accentDark }}>
              {placed}
            </Text>
            /{puzzle.size}
          </Text>
        </Pill>
        <Pill>
          <ClockIcon size={20} />
          <Text style={styles.pillText}>{formatTime(seconds)}</Text>
        </Pill>
      </View>

      <View style={styles.rules}>
        <Chip label={'1 fox per\ncolour'} />
        <Chip label={'1 fox per\nrow & column'} />
        <Chip label={"Foxes can't\ntouch"} />
      </View>

      <View style={styles.boardWrap}>
        <Board
          puzzle={puzzle}
          grid={grid}
          conflicts={conflicts}
          hint={hint}
          solved={solved}
          boardSize={boardSize}
          onCellPress={onCellPress}
          onCellLongPress={onCellLongPress}
        />
      </View>

      <View style={styles.actions}>
        <Button label="Undo" variant="secondary" onPress={undo} disabled={history.length === 0 || solved} />
        <Button label="Hint" variant="secondary" onPress={giveHint} disabled={solved} />
        <Button label="Clear" variant="secondary" onPress={clear} disabled={placed === 0 && history.length === 0} />
      </View>

      <Modal visible={showWin} transparent animationType="fade" onRequestClose={() => setShowWin(false)}>
        <View style={styles.winBackdrop}>
          <View style={styles.winCard}>
            <FoxFace size={72} />
            <Text style={styles.winTitle}>All foxes home!</Text>
            <Text style={styles.winBody}>
              Level {level} solved in {formatTime(seconds)}.
            </Text>
            <Button label="Next level" onPress={onNext} style={styles.winButton} />
            <Button label="Back to levels" variant="ghost" onPress={onBack} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerCenter: {
    alignItems: 'center',
  },
  levelTitle: {
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.text,
  },
  levelSub: {
    fontSize: font.small,
    color: colors.textMuted,
  },
  status: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  pillText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  rules: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.card,
    padding: 8,
    borderRadius: 14,
    marginBottom: 16,
  },
  boardWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  winBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  winCard: {
    backgroundColor: colors.bg,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    gap: 8,
  },
  winTitle: {
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.text,
  },
  winBody: {
    fontSize: font.body,
    color: colors.textMuted,
    marginBottom: 8,
  },
  winButton: {
    alignSelf: 'stretch',
  },
});
