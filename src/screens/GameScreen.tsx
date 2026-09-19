import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Board } from '../components/Board';
import { FoxFace } from '../components/FoxFace';
import { BackIcon, ClockIcon, GearIcon, StarIcon } from '../components/Icons';
import { PressableScale } from '../components/PressableScale';
import { Stars } from '../components/Stars';
import { Tool, ToolPalette } from '../components/ToolPalette';
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
import { parSeconds, rateRun, StarBreakdown } from '../logic/scoring';
import { Settings } from '../storage';
import { colors, font } from '../theme';

interface Props {
  level: number;
  settings: Settings;
  onBack: () => void;
  onOpenSettings: () => void;
  onComplete: (level: number, seconds: number, stars: number) => void;
  onNext: () => void;
}

export function GameScreen({ level, settings, onBack, onOpenSettings, onComplete, onNext }: Props) {
  const puzzle = useMemo(() => puzzleForLevel(level), [level]);
  const par = useMemo(() => parSeconds(puzzle.size, puzzle.difficulty), [puzzle]);
  const [grid, setGrid] = useState<Grid>(() => emptyGrid(puzzle.size));
  const [history, setHistory] = useState<Grid[]>([]);
  const [tool, setTool] = useState<Tool>('mark');
  const [seconds, setSeconds] = useState(0);
  const [hints, setHints] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState<{ row: number; col: number } | null>(null);
  const [result, setResult] = useState<StarBreakdown | null>(null);
  const [showWin, setShowWin] = useState(false);
  // Mirrors of live counters so the win effect can read them without
  // depending on them (a timer tick must never cancel the pending sheet).
  const statsRef = useRef({ seconds: 0, hints: 0, mistakes: 0 });
  statsRef.current = { seconds, hints, mistakes };

  const { width, height } = useWindowDimensions();
  const boardSize = Math.min(width - 40, height * 0.47, 520);

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

  // Win handling. Runs once per solve; the screen is keyed by level.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  useEffect(() => {
    if (!solved) return;
    const stats = statsRef.current;
    const stars = rateRun({ ...stats, par });
    setResult(stars);
    haptics.success(settings.haptics);
    onCompleteRef.current(level, stats.seconds, stars.count);
    const t = setTimeout(() => setShowWin(true), 700);
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

  /** Put a fox down, counting it as a mistake if it visibly breaks a rule. */
  const placeFox = useCallback(
    (g: Grid, r: number, c: number) => {
      g[r][c] = FOX;
      if (settings.autoMark) autoMark(g, r, c);
      const broken = findConflicts(puzzle, g).some((x) => x.row === r && x.col === c);
      if (broken) {
        setMistakes((m) => m + 1);
        haptics.warn(settings.haptics);
      } else {
        haptics.tap(settings.haptics);
      }
    },
    [puzzle, settings, autoMark],
  );

  const setCell = useCallback(
    (r: number, c: number, value: typeof EMPTY | typeof MARK | typeof FOX) => {
      if (solved || grid[r][c] === value) return;
      const next = cloneGrid(grid);
      if (value === FOX) {
        placeFox(next, r, c);
      } else {
        next[r][c] = value;
        haptics.tap(settings.haptics);
      }
      commit(next);
    },
    [grid, solved, placeFox, commit, settings.haptics],
  );

  const onCellPress = useCallback(
    (r: number, c: number) => {
      const cur = grid[r][c];
      if (tool === 'fox') setCell(r, c, cur === FOX ? EMPTY : FOX);
      else if (tool === 'mark') setCell(r, c, cur === MARK ? EMPTY : MARK);
      else setCell(r, c, EMPTY);
    },
    [grid, tool, setCell],
  );

  // Long press always toggles a fox, whatever tool is selected.
  const onCellLongPress = useCallback(
    (r: number, c: number) => setCell(r, c, grid[r][c] === FOX ? EMPTY : FOX),
    [grid, setCell],
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
    setHints((n) => n + 1);
    const next = cloneGrid(grid);
    next[h.row][h.col] = h.kind === 'remove' ? EMPTY : FOX;
    if (h.kind === 'place' && settings.autoMark) autoMark(next, h.row, h.col);
    commit(next);
    setHint({ row: h.row, col: h.col });
  };

  const clean = hints === 0 && mistakes === 0;
  const fast = seconds <= par;
  const liveStars: [boolean, boolean, boolean] = [solved, clean, fast];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <RoundButton onPress={onBack} accessibilityLabel="Back to levels">
          <BackIcon />
        </RoundButton>
        <View style={styles.headerCenter}>
          <Text style={styles.levelTitle}>Level {level}</Text>
          <Text style={styles.levelSub}>
            {puzzle.size}×{puzzle.size} · {difficultyLabel(puzzle.difficulty)} · par {formatTime(par)}
          </Text>
        </View>
        <RoundButton onPress={onOpenSettings} accessibilityLabel="Settings">
          <GearIcon />
        </RoundButton>
      </View>

      <View style={styles.status}>
        <Pill style={styles.pill}>
          <FoxFace size={22} />
          <Text style={styles.pillText}>
            <Text style={{ color: placed === puzzle.size ? colors.success : colors.accentDark }}>
              {placed}
            </Text>
            /{puzzle.size}
          </Text>
        </Pill>
        <Pill style={styles.pill}>
          <ClockIcon size={20} color={fast ? colors.text : colors.textMuted} />
          <Text style={[styles.pillText, !fast && styles.pillMuted]}>{formatTime(seconds)}</Text>
        </Pill>
        <Pill style={styles.pill}>
          <Stars lit={liveStars} size={18} />
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

      <View style={styles.bottom}>
        <ToolPalette selected={tool} onSelect={setTool} disabled={solved} />
        <View style={styles.actions}>
          <TextButton label="Undo" onPress={undo} disabled={history.length === 0 || solved} />
          <TextButton label={hints > 0 ? `Hint (${hints})` : 'Hint'} onPress={giveHint} disabled={solved} />
          <TextButton label="Clear" onPress={clear} disabled={(placed === 0 && history.length === 0) || solved} />
        </View>
      </View>

      <Modal visible={showWin} transparent animationType="fade" onRequestClose={() => setShowWin(false)}>
        <View style={styles.winBackdrop}>
          <View style={styles.winCard}>
            <FoxFace size={72} mood="joy" />
            <Text style={styles.winTitle}>
              {result?.count === 3 ? 'Perfect!' : result?.count === 2 ? 'Lovely!' : 'All foxes home!'}
            </Text>
            <Text style={styles.winBody}>Level {level} solved in {formatTime(seconds)}.</Text>
            {result && (
              <View style={styles.starRow}>
                <StarTile lit index={0} label="Solved" />
                <StarTile
                  lit={result.clean}
                  index={1}
                  label={
                    result.clean
                      ? 'No hints,\nno mistakes'
                      : `${hints} hint${hints === 1 ? '' : 's'},\n${mistakes} mistake${mistakes === 1 ? '' : 's'}`
                  }
                />
                <StarTile
                  lit={result.fast}
                  index={2}
                  label={result.fast ? `Under par\n${formatTime(par)}` : `Over par\n${formatTime(par)}`}
                />
              </View>
            )}
            <Button label="Next level" onPress={onNext} style={styles.winButton} />
            <Button label="Back to levels" variant="ghost" onPress={onBack} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TextButton(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <PressableScale
      onPress={props.onPress}
      disabled={props.disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!props.disabled }}
      hitSlop={8}
      style={styles.textButton}
    >
      <Text style={styles.textButtonLabel}>{props.label}</Text>
    </PressableScale>
  );
}

function StarTile({ lit, index, label }: { lit: boolean; index: number; label: string }) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.delay(250 + index * 220),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 16 }),
    ]).start();
  }, [index, scale]);
  return (
    <View style={styles.starTile}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <StarIcon size={44} filled={lit} />
      </Animated.View>
      <Text style={[styles.starLabel, !lit && styles.starLabelMuted]}>{label}</Text>
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
    marginBottom: 10,
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
    gap: 8,
    marginBottom: 10,
  },
  pill: {
    paddingHorizontal: 12,
  },
  pillText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  pillMuted: {
    color: colors.textMuted,
  },
  rules: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.card,
    padding: 6,
    borderRadius: 14,
    marginBottom: 12,
  },
  boardWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    paddingTop: 10,
    paddingBottom: 8,
    gap: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  textButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  textButtonLabel: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.accentDark,
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
    padding: 24,
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
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginVertical: 8,
  },
  starTile: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  starLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  starLabelMuted: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  winButton: {
    alignSelf: 'stretch',
    marginTop: 4,
  },
});
