import { describe, expect, it } from 'vitest';
import { mag2 } from '@ste/units';
import type { TrackingErrorModel } from '@ste/schema';
import {
  extractComponents,
  jitterVarianceArcsec2,
  simulateDuringExposure,
  sweepPhases,
} from './index.js';

describe('component extraction (v0.4 §3.1, §17)', () => {
  it('halves peak-to-peak periodic amplitude to a peak and converts drift to /s', () => {
    const model: TrackingErrorModel = {
      drift_rate: { value_arcsec_per_min: 6, direction: 'right_ascension' },
      periodic_error: {
        amplitude_arcsec: 15,
        amplitude_statistic: 'peak_to_peak',
        period_s: 60,
        direction: 'right_ascension',
      },
      tracking_jitter: { value: 3, statistic: 'rms', direction: 'isotropic' },
      vibration: { rms_arcsec: 4, direction: 'isotropic' },
    };
    const c = extractComponents(model);
    expect(c.driftArcsecPerSec.x).toBeCloseTo(0.1, 9); // 6/min = 0.1/s
    expect(mag2(c.periodicPeakArcsec)).toBeCloseTo(7.5, 9); // 15 p2p -> 7.5 peak
    expect(c.jitterRmsArcsec).toBeCloseTo(5, 9); // sqrt(3^2 + 4^2)
  });
});

describe('during-exposure path (R2-013, invariants v0.4 §48)', () => {
  const driftOnly = extractComponents({
    drift_rate: { value_arcsec_per_min: 4, direction: 'right_ascension' },
  });

  it('constant-drift displacement doubles with exposure', () => {
    const d20 = simulateDuringExposure(driftOnly, 20, 0).maxDisplacementArcsec;
    const d40 = simulateDuringExposure(driftOnly, 40, 0).maxDisplacementArcsec;
    // 4 arcsec/min = 0.0667 arcsec/s; over 20 s -> ~1.333 arcsec.
    expect(d20).toBeCloseTo((4 / 60) * 20, 3);
    expect(d40).toBeCloseTo(2 * d20, 6);
  });

  it('drift produces a covariance elongated along the drift axis', () => {
    const r = simulateDuringExposure(driftOnly, 30, 0);
    expect(r.motionCovariance.xx).toBeGreaterThan(0);
    expect(r.motionCovariance.yy).toBeCloseTo(0, 12);
  });

  it('periodic error stays bounded near its peak-to-peak excursion', () => {
    const c = extractComponents({
      periodic_error: {
        amplitude_arcsec: 10,
        amplitude_statistic: 'peak',
        period_s: 60,
        direction: 'right_ascension',
      },
    });
    const r = simulateDuringExposure(c, 60, 0);
    expect(r.maxDisplacementArcsec).toBeLessThanOrEqual(20.001); // <= 2 * peak
    expect(r.maxDisplacementArcsec).toBeGreaterThan(0);
  });
});

describe('phase sweep (R2-013, v0.4 §18)', () => {
  const c = extractComponents({
    periodic_error: {
      amplitude_arcsec: 15,
      amplitude_statistic: 'peak_to_peak',
      period_s: 30,
      direction: 'right_ascension',
    },
  });

  it('sweeps 24 phases when the phase is unknown; worst >= p95 >= median', () => {
    const s = sweepPhases(c, 20);
    expect(s.phaseCount).toBe(24);
    expect(s.worst.maxDisplacementArcsec).toBeGreaterThanOrEqual(
      s.percentile95.maxDisplacementArcsec,
    );
    expect(s.percentile95.maxDisplacementArcsec).toBeGreaterThanOrEqual(
      s.median.maxDisplacementArcsec,
    );
  });

  it('uses a single evaluation when the phase is known', () => {
    const known = extractComponents({
      periodic_error: {
        amplitude_arcsec: 15,
        amplitude_statistic: 'peak_to_peak',
        period_s: 30,
        direction: 'right_ascension',
        phase_deg: 90,
      },
    });
    expect(sweepPhases(known, 20).phaseCount).toBe(1);
  });
});

describe('jitter variance', () => {
  it('is the square of the combined jitter RMS', () => {
    const c = extractComponents({
      tracking_jitter: { value: 3, statistic: 'rms', direction: 'isotropic' },
      vibration: { rms_arcsec: 4, direction: 'isotropic' },
    });
    expect(jitterVarianceArcsec2(c)).toBeCloseTo(25, 9);
  });
});
