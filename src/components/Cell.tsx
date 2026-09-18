import React, { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { FoxFace } from './FoxFace';
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
  const pop = useRef(new Animated.Value(state === FOX ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;

  // Fox pops in with a little overshoot; marks fade in.
  useEffect(() => {
    if (state === FOX) {
      pop.setValue(0.4);
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 14 }).start();
    } else {
      pop.setValue(0);
    }
  }, [state, pop]);

  return (
    <Pressable
      onPress={() => onPress(row, col)}
      onLongPress={() => onLongPress(row, col)}
      onPressIn={() =>
        Animated.timing(press, { toValue: 0.9, duration: 60, useNativeDriver: true }).start()
      }
      onPressOut={() =>
        Animated.spring(press, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 8 }).start()
      }
      delayLongPress={250}
      accessibilityRole="button"
      accessibilityLabel={`Row ${row + 1} column ${col + 1}, ${
        state === FOX ? 'fox' : state === MARK ? 'marked' : 'empty'
      }`}
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderTopWidth: edges.top ? THICK : THIN,
          borderLeftWidth: edges.left ? THICK : THIN,
          borderRightWidth: edges.right ? THICK : 0,
          borderBottomWidth: edges.bottom ? THICK : 0,
        },
      ]}
    >
      <Animated.View style={[styles.content, { transform: [{ scale: press }] }]}>
        {state === MARK && (
          <Text style={[styles.mark, { fontSize: size * 0.5 }]} selectable={false}>
            ✕
          </Text>
        )}
        {state === FOX && (
          <Animated.View style={{ transform: [{ scale: pop }] }}>
            <FoxFace size={size * 0.78} />
          </Animated.View>
        )}
      </Animated.View>
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowRadius: 2,
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
