import { describe, expect, it } from 'vitest';
import { simulateSession, stackGeometry } from './index.js';

describe('session accounting (§27/§28)', () => {
  it('fills the wall clock with frames of exposure + overhead', () => {
    const r = simulateSession({
      exposureS: 10,
      overheadS: 2,
      sessionDurationS: 3600,
      qualityAcceptance: 1,
    });
    expect(r.framesAttempted).toBe(Math.floor(3600 / 12)); // 300
    expect(r.dutyCycle).toBeCloseTo(10 / 12, 9);
    expect(r.exposureTimeS + r.overheadTimeS).toBe(3600);
  });

  it('combines quality acceptance and environmental losses (Π(1−p))', () => {
    const r = simulateSession({
      exposureS: 30,
      overheadS: 0,
      sessionDurationS: 3600,
      qualityAcceptance: 0.8,
      environmentalLossFractions: [0.1, 0.05],
    });
    expect(r.environmentalAcceptance).toBeCloseTo(0.9 * 0.95, 9);
    expect(r.acceptanceFraction).toBeCloseTo(0.8 * 0.9 * 0.95, 9);
    expect(r.framesAccepted).toBeCloseTo(120 * 0.8 * 0.9 * 0.95, 6);
    expect(r.effectiveIntegrationS).toBeCloseTo(r.framesAccepted * 30, 6);
  });

  it('more overhead lowers effective integration (invariant §48)', () => {
    const low = simulateSession({
      exposureS: 10,
      overheadS: 1,
      sessionDurationS: 3600,
      qualityAcceptance: 1,
    });
    const high = simulateSession({
      exposureS: 10,
      overheadS: 5,
      sessionDurationS: 3600,
      qualityAcceptance: 1,
    });
    expect(high.effectiveIntegrationS).toBeLessThan(low.effectiveIntegrationS);
  });

  it('more rejection lowers integration (invariant §48)', () => {
    const good = simulateSession({
      exposureS: 10,
      overheadS: 1,
      sessionDurationS: 3600,
      qualityAcceptance: 0.9,
    });
    const bad = simulateSession({
      exposureS: 10,
      overheadS: 1,
      sessionDurationS: 3600,
      qualityAcceptance: 0.5,
    });
    expect(bad.effectiveIntegrationS).toBeLessThan(good.effectiveIntegrationS);
  });
});

describe('stack geometry (§29)', () => {
  it('no rotation or drift retains the full frame', () => {
    const g = stackGeometry({
      sessionRotationDeg: 0,
      driftPx: 0,
      sensorWidthPx: 3840,
      sensorHeightPx: 2160,
    });
    expect(g.commonCoverageFraction).toBeCloseTo(1, 9);
    expect(g.cropFraction).toBeCloseTo(0, 9);
  });

  it('rotation and drift shrink the common coverage', () => {
    const g = stackGeometry({
      sessionRotationDeg: 5,
      driftPx: 50,
      sensorWidthPx: 3840,
      sensorHeightPx: 2160,
    });
    expect(g.commonCoverageFraction).toBeLessThan(1);
    expect(g.cropFraction).toBeGreaterThan(0);
  });

  it('a small centered target is retained even with modest crop', () => {
    const g = stackGeometry({
      sessionRotationDeg: 2,
      driftPx: 20,
      sensorWidthPx: 3840,
      sensorHeightPx: 2160,
      targetWidthPx: 400,
      targetHeightPx: 300,
    });
    expect(g.targetRetentionFraction).toBeGreaterThan(0.9);
  });
});
