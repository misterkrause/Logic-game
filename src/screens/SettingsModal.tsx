import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '../components/ui';
import { Settings } from '../storage';
import { colors, font, radius } from '../theme';

interface Props {
  visible: boolean;
  settings: Settings;
  onChange: (s: Settings) => void;
  onClose: () => void;
}

export function SettingsModal({ visible, settings, onChange, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <ScrollView>
            <Text style={styles.title}>How to play</Text>
            <Text style={styles.body}>
              Place exactly one 🦊 in every row, every column and every coloured field. Foxes can't
              touch each other, not even diagonally.
            </Text>
            <Text style={styles.body}>
              Pick a tool under the board, then tap cells: Mark puts a ✕ where a fox can't go, Fox
              places a fox (tap it again to remove it), Erase clears a cell. Long press any cell to
              drop a fox no matter which tool is selected. Every level has exactly one answer, so
              no guessing is ever required.
            </Text>
            <Text style={styles.title}>Stars</Text>
            <Text style={styles.body}>
              ★ Solve the level.{'\n'}★★ Solve it with no hints and no mistakes. A mistake is placing
              a fox that breaks a rule with the foxes already on the board.{'\n'}★★★ Also finish
              under the par time shown in the header.
            </Text>

            <Text style={styles.title}>Settings</Text>
            <Row
              label="Auto-mark ✕"
              hint="When you place a fox, mark every cell it rules out."
              value={settings.autoMark}
              onChange={(v) => onChange({ ...settings, autoMark: v })}
            />
            <Row
              label="Haptics"
              hint="Small vibrations on taps and wins."
              value={settings.haptics}
              onChange={(v) => onChange({ ...settings, haptics: v })}
            />
            <Button label="Done" onPress={onClose} style={styles.done} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row(props: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{props.label}</Text>
        <Text style={styles.rowHint}>{props.hint}</Text>
      </View>
      <Switch
        value={props.value}
        onValueChange={props.onChange}
        trackColor={{ true: colors.accent, false: colors.border }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 24,
    maxHeight: '85%',
  },
  title: {
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  body: {
    fontSize: font.body,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.text,
  },
  rowHint: {
    fontSize: font.small,
    color: colors.textMuted,
  },
  done: {
    marginTop: 16,
  },
});
