import { describe, expect, it } from 'vitest';
import { calculate } from '@ste/engine-core';
import type { ResultValue } from '@ste/schema';
import { F01_DOCUMENT, FIXTURES, fixtureRequest, type ExpectedValue } from './index.js';

function num(rv: ResultValue<number> | undefined): number {
  expect(rv).toBeDefined();
  expect(rv!.value).not.toBeNull();
  return rv!.value as number;
}

function assertExpected(
  group: Record<string, ResultValue<unknown>> | undefined,
  expectations: Record<string, ExpectedValue>,
): void {
  expect(group).toBeDefined();
  for (const [key, expected] of Object.entries(expectations)) {
    const rv = group![key];
    expect(rv, `missing result "${key}"`).toBeDefined();
    if (typeof expected.value === 'string') {
      expect(rv!.value, key).toBe(expected.value);
    } else if (expected.precision != null) {
      expect(rv!.value as number, key).toBeCloseTo(expected.value, expected.precision);
    } else {
      expect(rv!.value, key).toBe(expected.value);
    }
  }
}

// --- R0-016: fixture expected values -------------------------------------

describe.each(FIXTURES)('$name fixture matches expected values', ({ document, expected }) => {
  const res = calculate(fixtureRequest(document, ['static_geometry', 'sampling']));

  it('completes without validation errors', () => {
    expect(res.validation?.ok).toBe(true);
    expect(res.status).toBe('complete');
  });

  it('matches expected static geometry', () => {
    assertExpected(
      res.results.static_geometry as unknown as Record<string, ResultValue<unknown>>,
      expected.staticGeometry,
    );
  });

  it('matches expected sampling', () => {
    assertExpected(
      res.results.sampling as unknown as Record<string, ResultValue<unknown>>,
      expected.sampling,
    );
  });
});

// --- R0-017: property / invariant tests (spec v0.4 §48) ------------------

describe('optical and sensor invariants (spec v0.4 §48)', () => {
  const base = () => structuredClone(F01_DOCUMENT);
  const geom = (doc = base()) =>
    calculate(fixtureRequest(doc, ['static_geometry'])).results.static_geometry!;

  it('doubling focal length halves image scale', () => {
    const single = num(geom().image_scale_x_arcsec_per_px);
    const d = base();
    d.optics.native_focal_length_mm = 320;
    expect(num(geom(d).image_scale_x_arcsec_per_px)).toBeCloseTo(single / 2, 6);
  });

  it('doubling pixel pitch doubles image scale', () => {
    const single = num(geom().image_scale_x_arcsec_per_px);
    const d = base();
    d.camera.sensor.pixel_pitch_x_um = 5.8;
    expect(num(geom(d).image_scale_x_arcsec_per_px)).toBeCloseTo(single * 2, 6);
  });

  it('larger sensor increases field of view', () => {
    const single = num(geom().field_of_view_x_deg);
    const d = base();
    d.camera.sensor.sensor_width_mm = 22.272;
    d.camera.sensor.horizontal_pixels = 7680; // keep geometry consistent
    expect(num(geom(d).field_of_view_x_deg)).toBeGreaterThan(single);
  });

  it('increasing aperture at fixed focal length lowers focal ratio', () => {
    const single = num(geom().focal_ratio);
    const d = base();
    d.optics.aperture_mm = 60;
    expect(num(geom(d).focal_ratio)).toBeLessThan(single);
  });

  it('a central obstruction reduces the clear collecting area', () => {
    const open = num(geom().clear_aperture_area_mm2);
    const d = base();
    d.optics.central_obstruction_mm = 10;
    expect(num(geom(d).clear_aperture_area_mm2)).toBeLessThan(open);
  });

  it('same physical sensor size yields same FOV regardless of pixel count', () => {
    const single = num(geom().field_of_view_x_deg);
    const d = base();
    d.camera.sensor.horizontal_pixels = 1920;
    d.camera.sensor.pixel_pitch_x_um = 5.8; // 1920 * 5.8um = 11.136mm, unchanged size
    expect(num(geom(d).field_of_view_x_deg)).toBeCloseTo(single, 9);
  });

  it('more pixels (finer pitch) reduce arcseconds per pixel', () => {
    const coarse = num(geom().image_scale_x_arcsec_per_px);
    const d = base();
    d.camera.sensor.pixel_pitch_x_um = 1.45;
    d.camera.sensor.horizontal_pixels = 7680; // keep size consistent
    expect(num(geom(d).image_scale_x_arcsec_per_px)).toBeLessThan(coarse);
  });
});

describe('no NaN and physical bounds', () => {
  it.each(FIXTURES)('$name produces finite, physically-bounded results', ({ document }) => {
    const res = calculate(
      fixtureRequest(document, ['static_geometry', 'sampling', 'target_framing']),
    );
    const groups = [res.results.static_geometry, res.results.sampling, res.results.target_framing];
    for (const group of groups) {
      for (const rv of Object.values(group ?? {}) as ResultValue<unknown>[]) {
        if (typeof rv.value === 'number') {
          expect(Number.isFinite(rv.value)).toBe(true);
        }
      }
    }
    const g = res.results.static_geometry!;
    expect(num(g.image_scale_x_arcsec_per_px)).toBeGreaterThan(0);
    expect(num(g.focal_ratio)).toBeGreaterThan(0);
    const fov = num(g.field_of_view_x_deg);
    expect(fov).toBeGreaterThan(0);
    expect(fov).toBeLessThan(180);
  });
});
