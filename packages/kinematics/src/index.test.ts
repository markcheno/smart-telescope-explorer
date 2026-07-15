import { describe, expect, it } from 'vitest';
import { sessionPath, type SessionSample } from '@ste/astronomy';
import {
  computeAltAzKinematics,
  computeEquatorialKinematics,
  numericalDerivatives,
} from './index.js';

describe('numerical derivatives (v0.4 §15)', () => {
  const times = [0, 1, 2, 3, 4];

  it('linear values give constant rate and ~zero acceleration', () => {
    const { rates, accelerations } = numericalDerivatives(
      times,
      times.map((t) => 3 * t + 2),
    );
    for (const r of rates) expect(r).toBeCloseTo(3, 9);
    for (const a of accelerations) expect(a).toBeCloseTo(0, 9);
  });

  it('quadratic values give linear rate and constant acceleration', () => {
    const { rates, accelerations } = numericalDerivatives(
      times,
      times.map((t) => t * t),
    );
    expect(rates[2]).toBeCloseTo(4, 9); // d/dt t^2 = 2t = 4 at t=2
    for (let i = 1; i < 4; i++) expect(accelerations[i]).toBeCloseTo(2, 9);
  });
});

function mkSample(timeOffsetS: number, altitudeDeg: number, azimuthDeg: number): SessionSample {
  return {
    timeOffsetS,
    julianDate: 0,
    altitudeDeg,
    azimuthDeg,
    hourAngleDeg: 0,
    airmass: null,
    parallacticAngleDeg: 0,
    visible: true,
  };
}

describe('alt-az kinematics (R2-007)', () => {
  it('flags zenith risk and a large condition number near the zenith', () => {
    // Target sweeping through altitude ~89.5° with rapidly changing azimuth.
    const path = [mkSample(0, 88, 120), mkSample(60, 89.5, 180), mkSample(120, 88, 240)];
    const k = computeAltAzKinematics(path, 5);
    expect(k.maxAltitudeDeg).toBeCloseTo(89.5, 6);
    expect(k.zenithRisk).toBe(true);
    expect(k.maxConditionNumber).toBeGreaterThan(50);
  });

  it('no zenith risk for a low-altitude pass', () => {
    const path = [mkSample(0, 40, 90), mkSample(60, 45, 100), mkSample(120, 48, 110)];
    const k = computeAltAzKinematics(path, 5);
    expect(k.zenithRisk).toBe(false);
    expect(k.axis1).toBe('azimuth');
    expect(k.maxAxis2RateDegPerS).toBeGreaterThan(0);
  });
});

describe('equatorial kinematics (R2-008)', () => {
  const path = sessionPath({
    startUnixMillis: Date.parse('2026-07-14T02:00:00Z'),
    durationS: 7200,
    sampleIntervalS: 300,
    latitudeDeg: 41.5,
    longitudeEastDeg: -87.5,
    rightAscensionDeg: 60,
    declinationDeg: 20,
    minimumAltitudeDeg: 0,
  });

  it('tracks the RA axis at the sidereal rate (~15.04 deg/hr) with a nearly still dec axis', () => {
    const k = computeEquatorialKinematics(path, 20);
    // 15.041 deg/hr = 0.004178 deg/s
    expect(k.maxAxis1RateDegPerS).toBeCloseTo(15.041 / 3600, 5);
    expect(k.maxAxis2RateDegPerS).toBeCloseTo(0, 9);
    expect(k.axis1).toBe('hour_angle');
  });

  it('detects the meridian crossing when the hour angle passes through zero', () => {
    // Build a path straddling the meridian: HA goes negative -> positive.
    const straddle: SessionSample[] = [
      { ...mkSample(0, 60, 180), hourAngleDeg: -0.5 },
      { ...mkSample(300, 60, 180), hourAngleDeg: 0.5 },
      { ...mkSample(600, 59, 181), hourAngleDeg: 1.5 },
    ];
    const k = computeEquatorialKinematics(straddle, 20);
    expect(k.meridianCrossingS).toBe(300);
  });
});
