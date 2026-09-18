import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Progress {
  /** Highest level the player may start. */
  highestUnlocked: number;
  /** level → best time in seconds. */
  best: Record<number, number>;
}

export interface Settings {
  autoMark: boolean;
  haptics: boolean;
}

const PROGRESS_KEY = 'fox-fields/progress/v1';
const SETTINGS_KEY = 'fox-fields/settings/v1';

export const defaultProgress: Progress = { highestUnlocked: 1, best: {} };
export const defaultSettings: Settings = { autoMark: false, haptics: true };

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage failures are non-fatal; the game still plays.
  }
}

export const loadProgress = () => readJson(PROGRESS_KEY, defaultProgress);
export const saveProgress = (p: Progress) => writeJson(PROGRESS_KEY, p);
export const loadSettings = () => readJson(SETTINGS_KEY, defaultSettings);
export const saveSettings = (s: Settings) => writeJson(SETTINGS_KEY, s);
