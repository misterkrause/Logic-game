export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function difficultyLabel(d: number): string {
  if (d < 0) return 'Expert';
  if (d === 0) return 'Easy';
  if (d === 1) return 'Medium';
  if (d === 2) return 'Hard';
  return 'Very hard';
}
