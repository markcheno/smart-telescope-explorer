import { describe, expect, it } from 'vitest';
import {
  criticalFocusZoneHalfUm,
  defocusCircleUm,
  defocusFwhmUm,
  linearToArcsec,
  recommendedRepeatableUm,
  stepResolutionUm,
  temperatureDriftUm,
} from './index.js';

describe('focus (v0.4 §11)', () => {
  it('computes the finest commanded movement', () => {
    // 400 µm/rev / (200 steps · 16 microsteps · 1) = 0.125 µm.
    expect(stepResolutionUm(400, 200, 16, 1)).toBeCloseTo(0.125, 6);
    expect(stepResolutionUm(400, 0, 16, 1)).toBeNull();
  });

  it('computes the critical focus zone and recommended step', () => {
    // 2 · 0.55 · 5² = 27.5 µm half-width.
    const cfz = criticalFocusZoneHalfUm(5)!;
    expect(cfz).toBeCloseTo(27.5, 6);
    expect(recommendedRepeatableUm(cfz)).toBeCloseTo(27.5 / 3, 6);
  });

  it('turns a defocus into a blur circle and Gaussian FWHM', () => {
    // c = |Δz|/N = 30/5 = 6 µm; FWHM = 0.59·6 = 3.54 µm.
    const c = defocusCircleUm(30, 5)!;
    expect(c).toBeCloseTo(6, 6);
    expect(defocusFwhmUm(c)).toBeCloseTo(3.54, 6);
  });

  it('converts a linear blur to arcsec via focal length', () => {
    // 6 µm at 300 mm FL = (0.006/300)·206265 ≈ 4.125 arcsec.
    expect(linearToArcsec(6, 300)).toBeCloseTo(4.1253, 3);
  });

  it('computes temperature drift', () => {
    // 5 µm/°C · (0 − 10) = −50 µm.
    expect(temperatureDriftUm(5, 0, 10)).toBe(-50);
  });
});
