import { describe, expect, it } from 'vitest';
import { covarianceOf, eigen2, mag2, mat2, matSum2, rotate2, vec2, type Vec2 } from './linalg.js';

describe('vector helpers', () => {
  it('magnitude and rotation', () => {
    expect(mag2(vec2(3, 4))).toBe(5);
    const r = rotate2(vec2(1, 0), Math.PI / 2);
    expect(r.x).toBeCloseTo(0, 12);
    expect(r.y).toBeCloseTo(1, 12);
  });
});

describe('covariance', () => {
  it('is zero for fewer than two points', () => {
    expect(covarianceOf([])).toEqual({ xx: 0, xy: 0, yy: 0 });
    expect(covarianceOf([vec2(1, 1)])).toEqual({ xx: 0, xy: 0, yy: 0 });
  });

  it('captures spread along x for a horizontal line of points', () => {
    const pts: Vec2[] = [vec2(-2, 0), vec2(-1, 0), vec2(0, 0), vec2(1, 0), vec2(2, 0)];
    const c = covarianceOf(pts);
    expect(c.xx).toBeGreaterThan(0);
    expect(c.yy).toBe(0);
    expect(c.xy).toBe(0);
  });
});

describe('eigen2', () => {
  it('is isotropic for a scaled identity (equal eigenvalues, angle 0)', () => {
    const e = eigen2(mat2(4, 0, 4));
    expect(e.major).toBeCloseTo(4, 12);
    expect(e.minor).toBeCloseTo(4, 12);
    expect(e.angleRad).toBe(0);
  });

  it('recovers axis-aligned eigenvalues from a diagonal matrix', () => {
    const e = eigen2(mat2(9, 0, 1));
    expect(e.major).toBeCloseTo(9, 12);
    expect(e.minor).toBeCloseTo(1, 12);
    expect(e.angleRad).toBeCloseTo(0, 12);
  });

  it('orients the major axis at 45° for equal-diagonal, positive off-diagonal', () => {
    const e = eigen2(mat2(2, 1, 2));
    expect(e.major).toBeCloseTo(3, 12);
    expect(e.minor).toBeCloseTo(1, 12);
    expect(e.angleRad).toBeCloseTo(Math.PI / 4, 12);
  });

  it('never yields negative eigenvalues from a valid covariance', () => {
    const c = covarianceOf([vec2(0, 0), vec2(1, 1), vec2(2, 2)]);
    const e = eigen2(c);
    expect(e.major).toBeGreaterThanOrEqual(0);
    expect(e.minor).toBeGreaterThanOrEqual(0);
  });

  it('matSum2 adds covariance contributions', () => {
    const total = matSum2([mat2(1, 0, 1), mat2(2, 0, 0), mat2(0, 0, 3)]);
    expect(total).toEqual({ xx: 3, xy: 0, yy: 4 });
  });
});
