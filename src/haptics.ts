import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Fire-and-forget haptics. A module-level switch mirrors the user's setting so
 * leaf components (buttons, cells) don't need it threaded through props.
 */
let enabled = true;

export function setEnabled(value: boolean) {
  enabled = value;
}

function canVibrate(override?: boolean) {
  return (override ?? enabled) && Platform.OS !== 'web';
}

/** Light tick for taps on buttons and tiles. */
export function select(override?: boolean) {
  if (!canVibrate(override)) return;
  Haptics.selectionAsync().catch(() => {});
}

/** Slightly firmer impact for board interactions. */
export function tap(override?: boolean) {
  if (!canVibrate(override)) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function success(override?: boolean) {
  if (!canVibrate(override)) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function warn(override?: boolean) {
  if (!canVibrate(override)) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}
