import { describe, expect, it } from 'vitest';
import {
  atmosphericThroughput,
  readNoiseTimeConstantS,
  relativeFrameSnr,
  relativeStackScore,
  skyElectronRatePerPixel,
  snrFrame,
  snrStack,
  throughputFactors,
} from './index.js';

describe('atmospheric throughput (§6)', () => {
  it('is 1 at the zenith (airmass 1) and falls with airmass', () => {
    expect(atmosphericThroughput(0.15, 1)).toBeCloseTo(1, 9);
    expect(atmosphericThroughput(0.15, 2)).toBeLessThan(1);
    expect(atmosphericThroughput(0.15, 2)).toBeCloseTo(Math.pow(10, -0.4 * 0.15), 9);
  });
});

describe('relative throughput factors (§23)', () => {
  it('point source scales with area, QE and filter; per-pixel adds solid angle', () => {
    const f = throughputFactors({
      effectiveAreaMm2: 700,
      effectiveQe: 0.8,
      filterTargetTransmission: 0.9,
      pixelSolidAngleArcsec2: 14,
    });
    expect(f.pointSource).toBeCloseTo(700 * 0.8 * 0.9, 6);
    expect(f.extendedPerPixel).toBeCloseTo(f.pointSource * 14, 6);
  });

  it('doubling aperture area doubles point-source throughput (ratio)', () => {
    const a = throughputFactors({
      effectiveAreaMm2: 700,
      effectiveQe: 0.8,
      filterTargetTransmission: 1,
      pixelSolidAngleArcsec2: 1,
    });
    const b = throughputFactors({
      effectiveAreaMm2: 1400,
      effectiveQe: 0.8,
      filterTargetTransmission: 1,
      pixelSolidAngleArcsec2: 1,
    });
    expect(b.pointSource / a.pointSource).toBeCloseTo(2, 9);
  });
});

describe('CCD-equation SNR (§25)', () => {
  it('background-limited SNR approaches √t scaling (invariant §48)', () => {
    const base = {
      targetRateEPerS: 100,
      skyRateEPerPxPerS: 50,
      darkRateEPerPxPerS: 1,
      readNoiseE: 2,
      nPixels: 9,
    };
    const s1 = snrFrame({ ...base, exposureS: 100 });
    const s4 = snrFrame({ ...base, exposureS: 400 });
    // With large signal+sky (background limited), 4x time ~ 2x SNR.
    expect(s4 / s1).toBeCloseTo(2, 1);
  });

  it('stacked SNR grows as √N', () => {
    expect(snrStack(5, 100, 1) / snrStack(5, 25, 1)).toBeCloseTo(2, 9);
  });

  it('read noise dominates and penalises very short exposures', () => {
    const base = {
      targetRateEPerS: 10,
      skyRateEPerPxPerS: 0.1,
      darkRateEPerPxPerS: 0,
      readNoiseE: 5,
      nPixels: 9,
    };
    const short = snrFrame({ ...base, exposureS: 0.5 });
    const long = snrFrame({ ...base, exposureS: 50 });
    // Per-frame SNR is far higher for the long sub (read-noise floor).
    expect(long).toBeGreaterThan(short * 5);
  });
});

describe('relative exposure score', () => {
  it('read-noise time constant is σ²/background rate', () => {
    expect(readNoiseTimeConstantS(4, 2)).toBeCloseTo(8, 9);
    expect(readNoiseTimeConstantS(4, 0)).toBeNull();
  });

  it('relative frame SNR is read-noise-limited below t_rn and √t above', () => {
    const tRn = 10;
    // Below t_rn: closer to linear in t.
    const belowRatio = relativeFrameSnr(2, tRn) / relativeFrameSnr(1, tRn);
    // Above t_rn: closer to √2.
    const aboveRatio = relativeFrameSnr(200, tRn) / relativeFrameSnr(100, tRn);
    expect(belowRatio).toBeGreaterThan(aboveRatio);
    expect(aboveRatio).toBeCloseTo(Math.SQRT2, 1);
  });

  it('relativeStackScore combines √N and the frame shape', () => {
    const s = relativeStackScore(10, 100, 10, 1);
    expect(s).toBeCloseTo(Math.sqrt(100) * relativeFrameSnr(10, 10), 9);
  });
});

describe('approximate sky rate', () => {
  it('darker sky yields a lower electron rate', () => {
    const common = {
      effectiveAreaMm2: 700,
      pixelSolidAngleArcsec2: 14,
      effectiveQe: 0.8,
      filterSkyTransmission: 1,
      atmosphericThroughput: 1,
    };
    const bright = skyElectronRatePerPixel({ ...common, skyBrightnessMagArcsec2: 18 });
    const dark = skyElectronRatePerPixel({ ...common, skyBrightnessMagArcsec2: 21 });
    expect(dark).toBeLessThan(bright);
    expect(dark).toBeGreaterThan(0);
  });
});
