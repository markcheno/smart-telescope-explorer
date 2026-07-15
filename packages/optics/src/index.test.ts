import { describe, expect, it } from 'vitest';
import { arcsec, mm, raw, um, type Fraction } from '@ste/units';
import {
  clearApertureArea,
  diffractionFwhm,
  effectiveApertureArea,
  effectiveFocalLength,
  focalRatio,
  resolveOpticalFwhm,
  spotDiameterToArcsec,
} from './index.js';

describe('focal geometry (F01: 30 mm f/160)', () => {
  it('effective focal length applies reducer and extender', () => {
    expect(raw(effectiveFocalLength(mm(160), 1, 1))).toBe(160);
    expect(raw(effectiveFocalLength(mm(160), 0.75, 1))).toBeCloseTo(120, 10);
    expect(raw(effectiveFocalLength(mm(160), 1, 2))).toBe(320);
  });

  it('focal ratio is f_eff / D', () => {
    expect(focalRatio(mm(160), mm(30))).toBeCloseTo(5.333, 3);
  });
});

describe('optical invariants (spec v0.4 §48)', () => {
  it('increasing aperture at fixed focal length lowers focal ratio', () => {
    expect(focalRatio(mm(160), mm(60))).toBeLessThan(focalRatio(mm(160), mm(30)));
  });

  it('obstruction reduces collecting area', () => {
    const clear = raw(clearApertureArea(mm(30)));
    const obstructed = raw(clearApertureArea(mm(30), mm(10)));
    expect(obstructed).toBeLessThan(clear);
  });

  it('clear area matches (pi/4) D^2 for an unobstructed aperture', () => {
    expect(raw(clearApertureArea(mm(30)))).toBeCloseTo((Math.PI / 4) * 900, 9);
  });

  it('transmission scales effective area linearly', () => {
    const clear = clearApertureArea(mm(30));
    expect(raw(effectiveApertureArea(clear, 0.9 as Fraction))).toBeCloseTo(raw(clear) * 0.9, 9);
  });
});

describe('diffraction (F01 value)', () => {
  it('30 mm aperture at 550 nm is about 3.89 arcsec FWHM', () => {
    expect(raw(diffractionFwhm(mm(30)))).toBeCloseTo(3.887, 2);
  });

  it('larger aperture gives a tighter diffraction FWHM', () => {
    expect(raw(diffractionFwhm(mm(60)))).toBeLessThan(raw(diffractionFwhm(mm(30))));
  });

  it('scales inversely with aperture', () => {
    expect(raw(diffractionFwhm(mm(30))) / raw(diffractionFwhm(mm(60)))).toBeCloseTo(2, 9);
  });
});

describe('spot diameter conversion', () => {
  it('matches 206.265 * s_um / f_mm', () => {
    // 10 um spot at 160 mm focal length
    expect(raw(spotDiameterToArcsec(um(10), mm(160)))).toBeCloseTo((206.265 * 10) / 160, 3);
  });
});

describe('optical blur resolution', () => {
  it('reads a direct arcsec FWHM without assuming', () => {
    const r = resolveOpticalFwhm({ representation: 'fwhm_arcsec', value: 1.8 }, mm(160));
    expect(r.assumed).toBe(false);
    expect(r.fwhmArcsec && raw(r.fwhmArcsec)).toBe(1.8);
  });

  it('maps the typical inexpensive lens preset to an assumed 2.0 arcsec (F01)', () => {
    const r = resolveOpticalFwhm(
      { representation: 'quality_preset', preset_class: 'typical_inexpensive_lens' },
      mm(160),
    );
    expect(r.assumed).toBe(true);
    expect(r.fwhmArcsec && raw(r.fwhmArcsec)).toBe(2.0);
  });

  it('returns null (unknown) when a preset is unknown or missing', () => {
    expect(resolveOpticalFwhm({ representation: 'quality_preset' }, mm(160)).fwhmArcsec).toBeNull();
    expect(resolveOpticalFwhm({ representation: 'unknown' }, mm(160)).fwhmArcsec).toBeNull();
  });

  it('converts a spot-diameter representation via the focal length', () => {
    const r = resolveOpticalFwhm({ representation: 'spot_diameter_um', value: 10 }, mm(160));
    expect(r.assumed).toBe(false);
    expect(r.fwhmArcsec && raw(r.fwhmArcsec)).toBeCloseTo(raw(arcsec((206.265 * 10) / 160)), 3);
  });
});
