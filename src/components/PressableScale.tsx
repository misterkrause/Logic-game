import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import * as haptics from '../haptics';

interface Props extends Omit<PressableProps, 'style'> {
  /** Visual style of the animated surface (background, padding, border). */
  style?: StyleProp<ViewStyle>;
  /** Layout style of the outer pressable (flex, alignSelf, margins). */
  containerStyle?: StyleProp<ViewStyle>;
  /** Scale while pressed. */
  pressedScale?: number;
  /** Selection haptic on press-in (respects the user's haptics setting). */
  haptic?: boolean;
  children?: React.ReactNode;
}

/**
 * Pressable with the iOS-style "squish": scales down and dims slightly while
 * pressed, springs back on release, and gives a light selection haptic.
 */
export function PressableScale({
  style,
  containerStyle,
  pressedScale = 0.95,
  haptic = true,
  onPressIn,
  onPressOut,
  disabled,
  children,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const animateTo = (s: number, o: number) => {
    Animated.parallel([
      Animated.spring(scale, { toValue: s, useNativeDriver: true, speed: 40, bounciness: 6 }),
      Animated.timing(opacity, { toValue: o, duration: 90, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable
      disabled={disabled}
      style={containerStyle}
      onPressIn={(e) => {
        if (haptic) haptics.select();
        animateTo(pressedScale, 0.85);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animateTo(1, 1);
        onPressOut?.(e);
      }}
      {...rest}
    >
      <Animated.View
        style={[styles.fill, style, { transform: [{ scale }], opacity }, disabled && { opacity: 0.45 }]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Let the animated surface fill whatever size the outer pressable is given.
  fill: {
    flexGrow: 1,
  },
});
