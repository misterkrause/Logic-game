import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Fire-and-forget haptics that are safe on web and in tests. */
export function tap(enabled: boolean) {
  if (!enabled || Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function success(enabled: boolean) {
  if (!enabled || Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function warn(enabled: boolean) {
  if (!enabled || Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
