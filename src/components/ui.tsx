import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, font, radius } from '../theme';

export function RoundButton(props: {
  label: string;
  onPress: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? props.label}
      style={({ pressed }) => [styles.round, props.style, pressed && styles.pressed]}
    >
      <Text style={styles.roundLabel}>{props.label}</Text>
    </Pressable>
  );
}

export function Chip(props: { label: string; active?: boolean }) {
  return (
    <View style={[styles.chip, props.active && styles.chipActive]}>
      <Text style={styles.chipText}>{props.label}</Text>
    </View>
  );
}

export function Pill(props: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.pill, props.style]}>{props.children}</View>;
}

export function Button(props: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const variant = props.variant ?? 'primary';
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        props.disabled && styles.buttonDisabled,
        pressed && styles.pressed,
        props.style,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          variant === 'primary' ? styles.buttonLabelPrimary : styles.buttonLabelSecondary,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  roundLabel: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.cardAlt,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: colors.text,
  },
  chipText: {
    color: colors.text,
    fontSize: font.small,
    fontWeight: '600',
    textAlign: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
  },
  buttonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonLabel: {
    fontSize: font.body,
    fontWeight: '700',
  },
  buttonLabelPrimary: {
    color: '#FFFFFF',
  },
  buttonLabelSecondary: {
    color: colors.text,
  },
});
