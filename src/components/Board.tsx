import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Cell } from './Cell';
import { Grid, Puzzle } from '../logic/puzzle';
import { colors, regionColors } from '../theme';

interface BoardProps {
  puzzle: Puzzle;
  grid: Grid;
  conflicts: Set<string>;
  hint: { row: number; col: number } | null;
  solved: boolean;
  boardSize: number;
  onCellPress: (row: number, col: number) => void;
  onCellLongPress: (row: number, col: number) => void;
}

export function Board(props: BoardProps) {
  const { puzzle, grid, conflicts, hint, solved, boardSize, onCellPress, onCellLongPress } = props;
  const n = puzzle.size;
  const cellSize = Math.floor(boardSize / n);

  const edges = useMemo(() => {
    const out: Array<Array<{ top: boolean; left: boolean; right: boolean; bottom: boolean }>> = [];
    for (let r = 0; r < n; r++) {
      const row = [];
      for (let c = 0; c < n; c++) {
        const id = puzzle.regions[r][c];
        row.push({
          top: r === 0 || puzzle.regions[r - 1][c] !== id,
          left: c === 0 || puzzle.regions[r][c - 1] !== id,
          right: c === n - 1,
          bottom: r === n - 1,
        });
      }
      out.push(row);
    }
    return out;
  }, [puzzle, n]);

  return (
    <View style={[styles.frame, { width: cellSize * n + 16 }]}>
      <View style={styles.grid}>
        {grid.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((state, c) => (
              <Cell
                key={c}
                row={r}
                col={c}
                size={cellSize}
                color={regionColors[puzzle.regions[r][c] % regionColors.length]}
                state={state}
                conflict={conflicts.has(`${r},${c}`)}
                hinted={hint !== null && hint.row === r && hint.col === c}
                solved={solved}
                edges={edges[r][c]}
                onPress={onCellPress}
                onLongPress={onCellLongPress}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    padding: 8,
    backgroundColor: colors.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  grid: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
});
