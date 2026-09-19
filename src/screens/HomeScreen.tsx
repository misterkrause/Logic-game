import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FoxFace } from '../components/FoxFace';
import { LockIcon } from '../components/Icons';
import { PressableScale } from '../components/PressableScale';
import { Stars } from '../components/Stars';
import { Button } from '../components/ui';
import { formatTime } from '../format';
import { levelSpec } from '../logic/levels';
import { Progress } from '../storage';
import { colors, font, radius } from '../theme';

interface Props {
  progress: Progress;
  onPlay: (level: number) => void;
  onOpenSettings: () => void;
}

export function HomeScreen({ progress, onPlay, onOpenSettings }: Props) {
  const next = progress.highestUnlocked;
  const levels = Array.from({ length: Math.max(next, 12) }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.mascot}>
          <FoxFace size={96} />
        </View>
        <Text style={styles.title}>Fox Fields</Text>
        <Text style={styles.subtitle}>Tuck one fox into every field. No ads, no lives, no timers you can't ignore.</Text>
      </View>

      <Button label={`Play level ${next}`} onPress={() => onPlay(next)} style={styles.play} />

      <View style={styles.levelsHeader}>
        <Text style={styles.sectionTitle}>Levels</Text>
        <PressableScale onPress={onOpenSettings} accessibilityRole="button" accessibilityLabel="Settings" hitSlop={10}>
          <Text style={styles.link}>Settings</Text>
        </PressableScale>
      </View>
      <ScrollView contentContainerStyle={styles.levelGrid} showsVerticalScrollIndicator={false}>
        {levels.map((lvl) => {
          const unlocked = lvl <= next;
          const best = progress.best[lvl];
          const stars = progress.stars[lvl] ?? (best !== undefined ? 1 : 0);
          return (
            <PressableScale
              key={lvl}
              disabled={!unlocked}
              onPress={() => onPlay(lvl)}
              accessibilityRole="button"
              accessibilityLabel={`Level ${lvl}${unlocked ? '' : ', locked'}`}
              pressedScale={0.92}
              style={[
                styles.levelTile,
                !unlocked && styles.levelLocked,
                best !== undefined && styles.levelDone,
              ]}
            >
              <Text style={[styles.levelNumber, !unlocked && styles.levelNumberLocked]}>{lvl}</Text>
              {!unlocked ? (
                <LockIcon />
              ) : best !== undefined ? (
                <>
                  <Stars lit={[stars >= 1, stars >= 2, stars >= 3]} size={12} gap={1} />
                  <Text style={styles.levelBest}>{formatTime(best)}</Text>
                </>
              ) : (
                <Text style={styles.levelMeta}>
                  {levelSpec(lvl).size}×{levelSpec(lvl).size}
                </Text>
              )}
            </PressableScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mascot: {
    marginBottom: 8,
  },
  title: {
    fontSize: font.title,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: font.body,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
  play: {
    alignSelf: 'center',
    minWidth: 220,
    marginBottom: 24,
  },
  levelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: font.heading,
    fontWeight: '700',
    color: colors.text,
  },
  link: {
    color: colors.accentDark,
    fontWeight: '700',
    fontSize: font.body,
  },
  levelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 40,
  },
  levelTile: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  levelLocked: {
    backgroundColor: colors.cardAlt,
    borderColor: 'transparent',
  },
  levelDone: {
    borderColor: '#F5B63A',
  },
  levelNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  levelNumberLocked: {
    color: colors.textMuted,
  },
  levelMeta: {
    fontSize: 11,
    color: colors.textMuted,
  },
  levelBest: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
  },
});
