import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { StarIcon } from './Icons';

interface Props {
  /** Which of the three stars are lit, in order: solved, clean, fast. */
  lit: [boolean, boolean, boolean];
  size?: number;
  /** Pop each lit star in with a stagger (win sheet). */
  animate?: boolean;
  gap?: number;
}

export function Stars({ lit, size = 16, animate = false, gap = 2 }: Props) {
  const scales = useRef(lit.map(() => new Animated.Value(animate ? 0 : 1))).current;

  useEffect(() => {
    if (!animate) return;
    Animated.stagger(
      160,
      scales.map((s) =>
        Animated.spring(s, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 14 }),
      ),
    ).start();
  }, [animate, scales]);

  return (
    <View style={[styles.row, { gap }]} accessibilityLabel={`${lit.filter(Boolean).length} of 3 stars`}>
      {lit.map((on, i) => (
        <Animated.View key={i} style={{ transform: [{ scale: scales[i] }] }}>
          <StarIcon size={size} filled={on} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
