import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, StatusBar as RNStatusBar, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GameScreen } from './src/screens/GameScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsModal } from './src/screens/SettingsModal';
import {
  defaultProgress,
  defaultSettings,
  loadProgress,
  loadSettings,
  Progress,
  saveProgress,
  saveSettings,
  Settings,
} from './src/storage';
import { colors } from './src/theme';

type Screen = { name: 'home' } | { name: 'game'; level: number };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [progress, setProgress] = useState<Progress>(defaultProgress);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadProgress().then(setProgress);
    loadSettings().then(setSettings);
  }, []);

  const updateSettings = (s: Settings) => {
    setSettings(s);
    saveSettings(s);
  };

  const onComplete = useCallback((level: number, seconds: number) => {
    setProgress((p) => {
      const best = p.best[level];
      const next: Progress = {
        highestUnlocked: Math.max(p.highestUnlocked, level + 1),
        best: { ...p.best, [level]: best === undefined ? seconds : Math.min(best, seconds) },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      {screen.name === 'home' ? (
        <HomeScreen
          progress={progress}
          onPlay={(level) => setScreen({ name: 'game', level })}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : (
        <GameScreen
          level={screen.level}
          settings={settings}
          onBack={() => setScreen({ name: 'home' })}
          onOpenSettings={() => setSettingsOpen(true)}
          onComplete={onComplete}
          onNext={() => setScreen({ name: 'game', level: screen.level + 1 })}
        />
      )}
      <SettingsModal
        visible={settingsOpen}
        settings={settings}
        onChange={updateSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 0 : 0,
  },
});
