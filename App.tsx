import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as haptics from './src/haptics';
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
  return (
    <SafeAreaProvider>
      <Root />
    </SafeAreaProvider>
  );
}

function Root() {
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [progress, setProgress] = useState<Progress>(defaultProgress);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadProgress().then(setProgress);
    loadSettings().then((s) => {
      setSettings(s);
      haptics.setEnabled(s.haptics);
    });
  }, []);

  const updateSettings = (s: Settings) => {
    setSettings(s);
    haptics.setEnabled(s.haptics);
    saveSettings(s);
  };

  const onComplete = useCallback((level: number, seconds: number, stars: number) => {
    setProgress((p) => {
      const best = p.best[level];
      const next: Progress = {
        highestUnlocked: Math.max(p.highestUnlocked, level + 1),
        best: { ...p.best, [level]: best === undefined ? seconds : Math.min(best, seconds) },
        stars: { ...p.stars, [level]: Math.max(p.stars[level] ?? 0, stars) },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <StatusBar style="dark" />
      {screen.name === 'home' ? (
        <HomeScreen
          progress={progress}
          onPlay={(level) => setScreen({ name: 'game', level })}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : (
        <GameScreen
          key={screen.level}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
