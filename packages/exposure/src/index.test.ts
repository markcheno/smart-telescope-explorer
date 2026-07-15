import { describe, expect, it } from 'vitest';
import { generateCandidates, recommendExposure, type CandidateEval } from './index.js';

describe('candidate generation (v0.4 §26)', () => {
  it('produces the common short set within range, including the user value', () => {
    const c = generateCandidates({ userValueS: 12, minimumS: 0.5, maximumS: 120 });
    expect(c).toContain(12);
    expect(c[0]).toBeGreaterThanOrEqual(0.5);
    expect(c[c.length - 1]).toBeLessThanOrEqual(120);
    expect([...new Set(c)].length).toBe(c.length); // deduped
    expect(c).toEqual([...c].sort((a, b) => a - b)); // sorted
  });

  it('honours logarithmic and explicit modes', () => {
    const log = generateCandidates({
      mode: 'logarithmic',
      minimumS: 1,
      maximumS: 100,
      sampleCount: 3,
    });
    expect(log).toEqual([1, 10, 100]);
    const ex = generateCandidates({ mode: 'explicit', explicitS: [3, 7, 200], maximumS: 120 });
    expect(ex).toEqual([3, 7]); // 200 out of range dropped
  });
});

function evalAt(
  exposureS: number,
  acceptance: number,
  dutyCycle: number,
  hardFail = false,
): CandidateEval {
  return {
    exposureS,
    motionPx: 0,
    rotationPx: 0,
    dutyCycle,
    acceptance,
    relativeScore: acceptance * dutyCycle,
    hardFail,
  };
}

describe('recommendation algorithm (v0.4 §26)', () => {
  it('prefers longer exposure when overhead dominates (F05 shape)', () => {
    // High acceptance throughout; duty rises with exposure -> longer wins.
    const candidates = [
      evalAt(1, 1.0, 1 / 3),
      evalAt(5, 1.0, 5 / 7),
      evalAt(10, 1.0, 10 / 12),
      evalAt(30, 1.0, 30 / 32),
    ];
    const rec = recommendExposure(candidates);
    expect(rec.bestExposureS).toBeGreaterThanOrEqual(10);
  });

  it('prefers shorter exposure when rejection dominates (F06 shape)', () => {
    // Duty ~1; acceptance falls with exposure -> shorter wins.
    const candidates = [
      evalAt(5, 0.95, 0.98),
      evalAt(10, 0.8, 0.99),
      evalAt(20, 0.5, 0.995),
      evalAt(30, 0.3, 0.997),
    ];
    const rec = recommendExposure(candidates);
    expect(rec.bestExposureS).toBeLessThanOrEqual(10);
  });

  it('reports the hard limit and excludes infeasible candidates', () => {
    const candidates = [
      evalAt(5, 1, 0.7),
      evalAt(10, 1, 0.83),
      evalAt(20, 0, 0.9, true), // hard fail
    ];
    const rec = recommendExposure(candidates);
    expect(rec.hardLimitS).toBe(20);
    expect(rec.longestAcceptableS).toBe(10);
  });

  it('returns a range and flags a plateau', () => {
    const candidates = [evalAt(5, 1, 0.9), evalAt(10, 1, 0.9), evalAt(20, 1, 0.9)];
    const rec = recommendExposure(candidates);
    expect(rec.recommendedMinS).toBe(5);
    expect(rec.recommendedMaxS).toBe(20);
    expect(rec.plateau).toBe(true);
  });
});
