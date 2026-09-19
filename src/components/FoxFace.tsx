import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

export type FoxMood = 'normal' | 'joy' | 'sad';

/**
 * The game's fox mascot, drawn as vector art so it looks identical on iOS,
 * Android and the web (emoji differ per platform). Source of truth for the
 * base shapes is art/fox.svg; keep the two in sync.
 *
 * Moods: `joy` closes the eyes into happy arcs (used right after placing a
 * fox), `sad` adds worried brows, a frown and a sweat drop (used while the
 * fox is breaking a rule).
 */
export function FoxFace({ size = 32, mood = 'normal' }: { size?: number; mood?: FoxMood }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
      <Path d="M13 46 L20 8 L46 30 Z" fill="#E9782F" />
      <Path d="M87 46 L80 8 L54 30 Z" fill="#E9782F" />
      <Path d="M20 41 L24 18 L40 32 Z" fill="#FBD3BA" />
      <Path d="M80 41 L76 18 L60 32 Z" fill="#FBD3BA" />
      <Path
        d="M11 42 C11 26 24 24 40 27 L60 27 C76 24 89 26 89 42 C89 66 74 86 50 93 C26 86 11 66 11 42 Z"
        fill="#F08A3C"
      />
      <Path
        d="M22 58 C34 52 66 52 78 58 C78 76 66 88 50 92 C34 88 22 76 22 58 Z"
        fill="#FFF8EF"
      />
      <Circle cx="21" cy="62" r="4.5" fill="#F5A19A" opacity={0.7} />
      <Circle cx="79" cy="62" r="4.5" fill="#F5A19A" opacity={0.7} />

      {mood === 'joy' ? (
        <>
          <Path d="M30 53 Q36 45 42 53" stroke="#2E1F1A" strokeWidth={3} fill="none" strokeLinecap="round" />
          <Path d="M58 53 Q64 45 70 53" stroke="#2E1F1A" strokeWidth={3} fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <Ellipse cx="36" cy="51" rx="4.6" ry="5.6" fill="#2E1F1A" />
          <Ellipse cx="64" cy="51" rx="4.6" ry="5.6" fill="#2E1F1A" />
          <Circle cx="37.6" cy="48.8" r="1.6" fill="#FFFFFF" />
          <Circle cx="65.6" cy="48.8" r="1.6" fill="#FFFFFF" />
        </>
      )}

      {mood === 'sad' && (
        <>
          <Path d="M30 41 L41 45" stroke="#2E1F1A" strokeWidth={2.6} strokeLinecap="round" />
          <Path d="M70 41 L59 45" stroke="#2E1F1A" strokeWidth={2.6} strokeLinecap="round" />
          <Path d="M84 46 C84 42 87 38 87 38 C87 38 90 42 90 46 A3 3 0 0 1 84 46 Z" fill="#8BC8F0" />
        </>
      )}

      <Path d="M44 67 L56 67 L50 74 Z" fill="#2E1F1A" />
      {mood === 'sad' ? (
        <Path d="M44 81 Q50 75 56 81" stroke="#2E1F1A" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      ) : (
        <>
          <Path d="M50 74 C50 78 47 79 45 78" stroke="#2E1F1A" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          <Path d="M50 74 C50 78 53 79 55 78" stroke="#2E1F1A" strokeWidth={1.8} fill="none" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
