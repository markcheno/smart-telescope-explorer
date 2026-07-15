import { describe, expect, it } from 'vitest';
import { arcsec, mm, raw } from '@ste/units';
import { computeFraming, imageCircleCoverage, rotatedBoundingBox } from './index.js';

describe('rotated bounding box', () => {
  it('is unchanged at 0 degrees', () => {
    const box = rotatedBoundingBox(arcsec(100), arcsec(50), 0);
    expect(raw(box.halfXArcsec)).toBeCloseTo(100, 9);
    expect(raw(box.halfYArcsec)).toBeCloseTo(50, 9);
  });

  it('swaps extents at 90 degrees', () => {
    const box = rotatedBoundingBox(arcsec(100), arcsec(50), 90);
    expect(raw(box.halfXArcsec)).toBeCloseTo(50, 9);
    expect(raw(box.halfYArcsec)).toBeCloseTo(100, 9);
  });

  it('grows the box for a rotated elongated target', () => {
    const box = rotatedBoundingBox(arcsec(100), arcsec(50), 45);
    expect(raw(box.halfXArcsec)).toBeGreaterThan(50);
    expect(raw(box.halfXArcsec)).toBeLessThan(100);
  });
});

describe('framing fit classification', () => {
  const base = {
    imageScaleXArcsecPerPx: arcsec(3.7386),
    imageScaleYArcsecPerPx: arcsec(3.7386),
    sensorWidthPx: 3840,
    sensorHeightPx: 2160,
    positionAngleDeg: 0,
  };

  it('reports does_not_fit when the target overflows the sensor', () => {
    // 5-degree target = 300 arcmin, far larger than the ~4-degree frame.
    const r = computeFraming({ ...base, widthArcmin: 300, heightArcmin: 40 });
    expect(r.fitStatus).toBe('does_not_fit');
    expect(r.marginXFraction).toBeLessThan(0);
  });

  it('reports good for a well-framed target', () => {
    // ~2 x 1.3 deg target inside a ~4 x 2.2 deg frame.
    const r = computeFraming({ ...base, widthArcmin: 120, heightArcmin: 80 });
    expect(r.fitStatus).toBe('good');
    expect(r.minimumMarginFraction).toBeGreaterThan(0);
  });

  it('reports excess_field for a tiny target', () => {
    const r = computeFraming({ ...base, widthArcmin: 10, heightArcmin: 8 });
    expect(r.fitStatus).toBe('excess_field');
  });

  it('reports tight when margins are thin', () => {
    // Target nearly as wide as the ~4-degree frame.
    const r = computeFraming({ ...base, widthArcmin: 225, heightArcmin: 40 });
    expect(r.fitStatus).toBe('tight');
  });

  it('target pixel width scales with angular size', () => {
    const small = computeFraming({ ...base, widthArcmin: 60, heightArcmin: 60 });
    const big = computeFraming({ ...base, widthArcmin: 120, heightArcmin: 60 });
    expect(big.targetWidthPx).toBeCloseTo(2 * small.targetWidthPx, 6);
  });
});

describe('image-circle coverage', () => {
  it('is 1.0 when the circle covers the sensor diagonal', () => {
    // sensor 11.136 x 6.264 -> diagonal ~12.777 mm
    expect(imageCircleCoverage(mm(20), mm(11.136), mm(6.264))).toBe(1);
  });

  it('is below 1.0 when the circle is smaller than the diagonal', () => {
    const c = imageCircleCoverage(mm(10), mm(11.136), mm(6.264));
    expect(c).not.toBeNull();
    expect(c as number).toBeLessThan(1);
    expect(c as number).toBeCloseTo(10 / Math.hypot(11.136, 6.264), 9);
  });

  it('is null when inputs are unknown', () => {
    expect(imageCircleCoverage(null, mm(11), mm(6))).toBeNull();
  });
});
