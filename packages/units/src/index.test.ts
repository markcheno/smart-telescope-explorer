import { describe, expect, it } from 'vitest';
import {
  ARCSEC_PER_RADIAN,
  arcmin,
  arcminToArcsec,
  arcsec,
  arcsecToArcmin,
  arcsecToRad,
  deg,
  degToRad,
  mm,
  mmToUm,
  radToArcsec,
  radToDeg,
  raw,
  rssArcsec,
  um,
  umToMm,
} from './index.js';

describe('angle conversions round-trip', () => {
  it('deg <-> rad', () => {
    for (const d of [0, 1, 45, 90, 179.9, 360]) {
      expect(raw(radToDeg(degToRad(deg(d))))).toBeCloseTo(d, 10);
    }
  });

  it('arcsec <-> rad', () => {
    for (const a of [0.5, 2.5, 206265, 1e-3]) {
      expect(raw(radToArcsec(arcsecToRad(arcsec(a))))).toBeCloseTo(a, 8);
    }
  });

  it('arcmin <-> arcsec', () => {
    expect(raw(arcminToArcsec(arcmin(1)))).toBeCloseTo(60, 12);
    expect(raw(arcsecToArcmin(arcsec(120)))).toBeCloseTo(2, 12);
  });

  it('ARCSEC_PER_RADIAN matches 648000/π', () => {
    expect(ARCSEC_PER_RADIAN).toBeCloseTo(648000 / Math.PI, 9);
    expect(ARCSEC_PER_RADIAN).toBeCloseTo(206264.806, 3);
  });
});

describe('length conversions round-trip', () => {
  it('mm <-> um', () => {
    for (const m of [0.0029, 11.136, 160]) {
      expect(raw(umToMm(mmToUm(mm(m))))).toBeCloseTo(m, 12);
    }
  });

  it('1 mm is 1000 um', () => {
    expect(raw(mmToUm(mm(1)))).toBe(1000);
    expect(raw(umToMm(um(2900)))).toBeCloseTo(2.9, 12);
  });
});

describe('rss', () => {
  it('combines contributions in quadrature', () => {
    // 3-4-5 triangle
    expect(raw(rssArcsec(arcsec(3), arcsec(4)))).toBeCloseTo(5, 12);
  });

  it('is order independent', () => {
    const a = raw(rssArcsec(arcsec(2.5), arcsec(3.89), arcsec(2.0)));
    const b = raw(rssArcsec(arcsec(2.0), arcsec(2.5), arcsec(3.89)));
    expect(a).toBeCloseTo(b, 12);
    // F01 combined base FWHM ~= 5.02"
    expect(a).toBeCloseTo(5.02, 1);
  });
});
