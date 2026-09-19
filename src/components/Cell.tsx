import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { FoxFace, FoxMood } from './FoxFace';
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
  const wiggle = useRef(new Animated.Value(0)).current; // -1..1 → rotation
  const hop = useRef(new Animated.Value(0)).current; // 0..1 → lift
  const shake = useRef(new Animated.Value(0)).current; // 0..1 → side-to-side
  const sparkle = useRef(new Animated.Value(0)).current; // 0..1 → rise + fade
  const press = useRef(new Animated.Value(1)).current;
  const [joy, setJoy] = useState(false);
  const wasFox = useRef(state === FOX);

  // Happy arrival: pop in, hop, wiggle, close eyes into a smile, sparkles.
  useEffect(() => {
    const arrived = state === FOX && !wasFox.current;
    wasFox.current = state === FOX;
    if (!arrived) {
      if (state !== FOX) {
        pop.setValue(0);
        setJoy(false);
      }
      return;
    }
    pop.setValue(0.3);
    wiggle.setValue(0);
    hop.setValue(0);
    sparkle.setValue(0);
    setJoy(true);
    Animated.parallel([
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, speed: 26, bounciness: 16 }),
      Animated.sequence([
        Animated.timing(hop, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(hop, { toValue: 0, duration: 200, easing: Easing.bounce, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(80),
        Animated.timing(wiggle, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: -1, duration: 130, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0.5, duration: 110, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0, duration: 90, useNativeDriver: true }),
      ]),
      Animated.timing(sparkle, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => setJoy(false), 900);
    return () => clearTimeout(t);
  }, [state, pop, wiggle, hop, sparkle]);

  // Unhappy: shake when this fox starts breaking a rule.
  useEffect(() => {
    if (!(conflict && state === FOX)) return;
    shake.setValue(0);
    Animated.timing(shake, { toValue: 1, duration: 380, easing: Easing.linear, useNativeDriver: true }).start();
  }, [conflict, state, shake]);

  const mood: FoxMood = conflict && state === FOX ? 'sad' : joy ? 'joy' : 'normal';
  const rotate = wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-12deg', '12deg'] });
  const translateY = hop.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.14] });
  const translateX = shake.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -size * 0.09, size * 0.09, -size * 0.06, size * 0.04, 0],
  });
  const sparkleY = sparkle.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.45] });
  const sparkleOpacity = sparkle.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 0.8, 0] });

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
        state === FOX ? (conflict ? 'fox breaking a rule' : 'fox') : state === MARK ? 'marked' : 'empty'
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
          <Animated.View
            style={{ transform: [{ translateX }, { translateY }, { scale: pop }, { rotate }] }}
          >
            <FoxFace size={size * 0.78} mood={mood} />
          </Animated.View>
        )}
      </Animated.View>
      {state === FOX && (
        <>
          <Animated.Text
            pointerEvents="none"
            style={[
              styles.sparkle,
              { left: size * 0.08, top: size * 0.18, fontSize: size * 0.22 },
              { opacity: sparkleOpacity, transform: [{ translateY: sparkleY }] },
            ]}
          >
            ✦
          </Animated.Text>
          <Animated.Text
            pointerEvents="none"
            style={[
              styles.sparkle,
              { right: size * 0.08, top: size * 0.1, fontSize: size * 0.18 },
              { opacity: sparkleOpacity, transform: [{ translateY: sparkleY }] },
            ]}
          >
            ✦
          </Animated.Text>
        </>
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
    overflow: 'visible',
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
  sparkle: {
    position: 'absolute',
    color: '#FFD84D',
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
