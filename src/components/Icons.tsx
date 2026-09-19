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

export function StarIcon({
  size = 18,
  filled = true,
  color = '#F5B63A',
  outline = colors.textMuted,
}: IconProps & { filled?: boolean; outline?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      <Path
        d="M12 2.5 l2.9 6.1 6.6 .8 -4.9 4.6 1.3 6.6 L12 17.3 6.1 20.6 l1.3 -6.6 L2.5 9.4 l6.6 -.8 Z"
        fill={filled ? color : 'none'}
        stroke={filled ? color : outline}
        strokeWidth={filled ? 1 : 1.8}
        strokeLinejoin="round"
        opacity={filled ? 1 : 0.6}
      />
    </Svg>
  );
}

export function EraserIcon({ size = 24, color = colors.text }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" pointerEvents="none">
      <Path
        d="M4 15.5 L13.5 6 a2.2 2.2 0 0 1 3.1 0 L20 9.4 a2.2 2.2 0 0 1 0 3.1 L12 20.5 H8.5 L4 16 Z"
        stroke={color}
        strokeWidth={2.2}
        strokeLinejoin="round"
        fill="none"
      />
      <Path d="M8.5 11 L15 17.5" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M4 20.5 H20" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}
