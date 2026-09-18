import React from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

/**
 * The game's fox mascot, drawn as vector art so it looks identical on iOS,
 * Android and the web (emoji differ per platform). Source of truth for the
 * shapes is art/fox.svg; keep the two in sync.
 */
export function FoxFace({ size = 32 }: { size?: number }) {
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
      <Ellipse cx="36" cy="51" rx="4.6" ry="5.6" fill="#2E1F1A" />
      <Ellipse cx="64" cy="51" rx="4.6" ry="5.6" fill="#2E1F1A" />
      <Circle cx="37.6" cy="48.8" r="1.6" fill="#FFFFFF" />
      <Circle cx="65.6" cy="48.8" r="1.6" fill="#FFFFFF" />
      <Path d="M44 67 L56 67 L50 74 Z" fill="#2E1F1A" />
      <Path
        d="M50 74 C50 78 47 79 45 78"
        stroke="#2E1F1A"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M50 74 C50 78 53 79 55 78"
        stroke="#2E1F1A"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}
