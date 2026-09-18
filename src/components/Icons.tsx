import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

interface IconProps {
  size?: number;
  color?: string;
}

/** Chevron-style back arrow, matching the iOS navigation bar glyph. */
export function BackIcon({ size = 22, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      <Path
        d="M15 5 L8 12 L15 19"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function GearIcon({ size = 22, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      <Path
        d="M12 2.5 l1.6 2.6 3-.6 .8 3 2.9 1 -1 2.9 2 2.3 -2.3 2 .6 3 -3 .6 -1.3 2.8 -2.7 -1.4 -2.7 1.4 -1.3 -2.8 -3 -.6 .6 -3 -2.3 -2 2 -2.3 -1 -2.9 2.9 -1 .8 -3 3 .6 Z"
        fill={color}
      />
      <Circle cx="12" cy="12" r="3.4" fill={colors.card} />
    </Svg>
  );
}

export function ClockIcon({ size = 18, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2.4} fill="none" />
      <Path d="M12 7 V12 L15.5 14" stroke={color} strokeWidth={2.4} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export function LockIcon({ size = 14, color = colors.textMuted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      <Path d="M7 11 V8 a5 5 0 0 1 10 0 v3" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Path d="M5 11 h14 v10 h-14 Z" fill={color} />
    </Svg>
  );
}
