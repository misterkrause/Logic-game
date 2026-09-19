import { parSeconds, rateRun } from '../scoring';

describe('parSeconds', () => {
  it('grows with board size', () => {
    expect(parSeconds(5, 0)).toBeLessThan(parSeconds(6, 0));
    expect(parSeconds(8, 0)).toBeLessThan(parSeconds(10, 0));
  });
  it('gives harder boards more time', () => {
    expect(parSeconds(8, 2)).toBeGreaterThan(parSeconds(8, 1));
    expect(parSeconds(8, -1)).toBeGreaterThan(parSeconds(8, 2));
  });
});

describe('rateRun', () => {
  it('always awards at least one star', () => {
    expect(rateRun({ hints: 3, mistakes: 2, seconds: 999, par: 60 }).count).toBe(1);
  });
  it('awards the clean star only with zero hints and zero mistakes', () => {
    expect(rateRun({ hints: 0, mistakes: 0, seconds: 999, par: 60 })).toMatchObject({ clean: true, fast: false, count: 2 });
    expect(rateRun({ hints: 1, mistakes: 0, seconds: 999, par: 60 }).clean).toBe(false);
    expect(rateRun({ hints: 0, mistakes: 1, seconds: 999, par: 60 }).clean).toBe(false);
  });
  it('awards the speed star at or under par', () => {
    expect(rateRun({ hints: 0, mistakes: 0, seconds: 60, par: 60 }).count).toBe(3);
    expect(rateRun({ hints: 1, mistakes: 0, seconds: 30, par: 60 })).toMatchObject({ fast: true, count: 2 });
  });
});
