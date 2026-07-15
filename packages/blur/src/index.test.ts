import { describe, expect, it } from 'vitest';
import { arcsec, mat2 } from '@ste/units';
import {
  classifyElongation,
  contributionFwhmArcsec,
  isotropicCovariance,
  pixelCovariance,
  totalBlur,
} from './index.js';

describe('isotropic covariance', () => {
  it('round-trips a FWHM through the ellipse (isotropic stays isotropic)', () => {
    const e = totalBlur([isotropicCovariance(arcsec(5))]);
    expect(e.majorFwhmArcsec).toBeCloseTo(5, 9);
    expect(e.minorFwhmArcsec).toBeCloseTo(5, 9);
    expect(e.elongation).toBeCloseTo(1, 9);
  });
});

describe('total blur (spec v0.4 §19)', () => {
  it('adds contributions in quadrature when aligned isotropic', () => {
    // Two isotropic 3" and 4" FWHM -> 5" combined (quadrature).
    const e = totalBlur([isotropicCovariance(arcsec(3)), isotropicCovariance(arcsec(4))]);
    expect(e.majorFwhmArcsec).toBeCloseTo(5, 6);
    expect(e.elongation).toBeCloseTo(1, 6);
  });

  it('directional motion elongates the ellipse along its axis', () => {
    // Base 2" isotropic + strong motion variance along x.
    const base = isotropicCovariance(arcsec(2));
    const motion = mat2(9, 0, 0); // 3" sigma along x only
    const e = totalBlur([base, motion]);
    expect(e.majorFwhmArcsec).toBeGreaterThan(e.minorFwhmArcsec);
    expect(e.elongation).toBeGreaterThan(1.1);
    expect(Math.abs(e.axisAngleDeg)).toBeLessThan(1); // major axis along x
  });

  it('pixel covariance adds the top-hat variance s^2/12', () => {
    const cov = pixelCovariance(arcsec(3.74), arcsec(3.74));
    expect(cov.xx).toBeCloseTo((3.74 * 3.74) / 12, 9);
    expect(cov.yy).toBeCloseTo((3.74 * 3.74) / 12, 9);
  });
});

describe('elongation classification (spec v0.4 §19)', () => {
  it('bands good/marginal/poor', () => {
    expect(classifyElongation(1.05)).toBe('good');
    expect(classifyElongation(1.2)).toBe('marginal');
    expect(classifyElongation(1.4)).toBe('poor');
    expect(classifyElongation(null)).toBe('unknown');
  });
});

describe('per-contribution FWHM', () => {
  it('reads the major-axis FWHM of a single covariance', () => {
    const fwhm = contributionFwhmArcsec(isotropicCovariance(arcsec(2)));
    expect(fwhm).toBeCloseTo(2, 9);
  });
});
