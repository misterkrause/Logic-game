import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { EraserIcon } from './Icons';
import { FoxFace } from './FoxFace';
import { PressableScale } from './PressableScale';
import { colors, font, radius } from '../theme';

export type Tool = 'fox' | 'mark' | 'erase';

interface Props {
  selected: Tool;
  onSelect: (tool: Tool) => void;
  disabled?: boolean;
}

/**
 * Segmented palette under the board. Pick what a tap puts in a cell instead
 * of cycling through states, so a stray tap never drops a fox by accident.
 */
export function ToolPalette({ selected, onSelect, disabled }: Props) {
  const tools: Array<{ id: Tool; label: string; icon: React.ReactNode }> = [
    { id: 'fox', label: 'Fox', icon: <FoxFace size={30} /> },
    { id: 'mark', label: 'Mark', icon: <Text style={styles.markGlyph}>✕</Text> },
    { id: 'erase', label: 'Erase', icon: <EraserIcon size={26} /> },
  ];
  return (
    <View style={styles.palette} accessibilityRole="tablist">
      {tools.map((t) => {
        const active = t.id === selected;
        return (
          <PressableScale
            key={t.id}
            onPress={() => onSelect(t.id)}
            disabled={disabled}
            pressedScale={0.94}
            accessibilityRole="tab"
            accessibilityState={{ selected: active, disabled: !!disabled }}
            accessibilityLabel={`${t.label} tool`}
            containerStyle={styles.toolSlot}
            style={[styles.tool, active && styles.toolActive]}
          >
            <View style={styles.icon}>{t.icon}</View>
            <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  palette: {
    flexDirection: 'row',
    gap: 8,
    padding: 6,
    backgroundColor: colors.card,
    borderRadius: radius.md + 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  toolSlot: {
    flex: 1,
  },
  tool: {
    minHeight: 64,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.cardAlt,
  },
  toolActive: {
    borderColor: colors.accent,
    backgroundColor: '#FFF1E3',
  },
  icon: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markGlyph: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 30,
  },
  label: {
    fontSize: font.small,
    fontWeight: '700',
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.accentDark,
  },
});
