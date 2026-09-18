import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CellState, FOX, MARK } from '../logic/puzzle';
import { colors } from '../theme';

export interface CellProps {
  row: number;
  col: number;
  size: number;
  color: string;
  state: CellState;
  conflict: boolean;
  hinted: boolean;
  solved: boolean;
  /** Which sides border a different region (or the board edge). */
  edges: { top: boolean; left: boolean; right: boolean; bottom: boolean };
  onPress: (row: number, col: number) => void;
  onLongPress: (row: number, col: number) => void;
}

const THICK = 3;
const THIN = StyleSheet.hairlineWidth * 2;

function CellImpl(props: CellProps) {
  const { row, col, size, color, state, conflict, hinted, solved, edges, onPress, onLongPress } =
    props;
  const emoji = size * 0.62;
  return (
    <Pressable
      onPress={() => onPress(row, col)}
      onLongPress={() => onLongPress(row, col)}
      delayLongPress={250}
      accessibilityRole="button"
      accessibilityLabel={`Row ${row + 1} column ${col + 1}, ${
        state === FOX ? 'fox' : state === MARK ? 'marked' : 'empty'
      }`}
      style={({ pressed }) => [
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderTopWidth: edges.top ? THICK : THIN,
          borderLeftWidth: edges.left ? THICK : THIN,
          borderRightWidth: edges.right ? THICK : 0,
          borderBottomWidth: edges.bottom ? THICK : 0,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      {state === MARK && (
        <Text style={[styles.mark, { fontSize: size * 0.5 }]} selectable={false}>
          ✕
        </Text>
      )}
      {state === FOX && (
        <Text style={[styles.fox, { fontSize: emoji }]} selectable={false}>
          🦊
        </Text>
      )}
      {conflict && <View pointerEvents="none" style={[styles.conflict, { borderRadius: size * 0.18 }]} />}
      {hinted && <View pointerEvents="none" style={[styles.hint, { borderRadius: size * 0.18 }]} />}
      {solved && state === FOX && <View pointerEvents="none" style={styles.glow} />}
    </Pressable>
  );
}

export const Cell = memo(CellImpl);

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.gridLine,
  },
  mark: {
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowRadius: 2,
  },
  fox: {
    textAlign: 'center',
  },
  conflict: {
    ...StyleSheet.absoluteFill,
    margin: 3,
    borderWidth: 3,
    borderColor: colors.danger,
    backgroundColor: 'rgba(224, 82, 79, 0.25)',
  },
  hint: {
    ...StyleSheet.absoluteFill,
    margin: 3,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  glow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 240, 150, 0.35)',
  },
});
