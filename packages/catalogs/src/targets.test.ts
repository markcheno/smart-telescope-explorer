import { describe, expect, it } from 'vitest';
import { computeFraming } from '@ste/targets';
import { arcsec, type Arcseconds } from '@ste/units';
import { TARGET_CATALOG, findCatalogTarget } from './targets.js';

describe('seed target catalog (v0.7 §23)', () => {
  it('holds ~30 objects with unique ids', () => {
    expect(TARGET_CATALOG.length).toBeGreaterThanOrEqual(28);
    const ids = new Set(TARGET_CATALOG.map((t) => t.target_id));
    expect(ids.size).toBe(TARGET_CATALOG.length);
  });

  it('every record has verified-range coordinates and positive dimensions', () => {
    for (const t of TARGET_CATALOG) {
      const { right_ascension_deg: ra, declination_deg: dec } = t.coordinates;
      expect(ra).not.toBeNull();
      expect(ra!).toBeGreaterThanOrEqual(0);
      expect(ra!).toBeLessThan(360);
      expect(dec!).toBeGreaterThanOrEqual(-90);
      expect(dec!).toBeLessThanOrEqual(90);
      expect(t.geometry.width_arcmin!).toBeGreaterThan(0);
      expect(t.geometry.height_arcmin!).toBeGreaterThan(0);
      // Major axis is width by convention.
      expect(t.geometry.width_arcmin!).toBeGreaterThanOrEqual(t.geometry.height_arcmin!);
      expect(t.source?.confidence).toBeDefined();
    }
  });

  it('finds a target by id', () => {
    expect(findCatalogTarget('cat_m31')?.name).toBe('Andromeda Galaxy');
    expect(findCatalogTarget('nope')).toBeUndefined();
  });

  it('a catalog record projects onto a sensor for framing', () => {
    const m31 = findCatalogTarget('cat_m31')!;
    const scale: Arcseconds = arcsec(2.5); // ~ a small smart-scope image scale
    const framing = computeFraming({
      widthArcmin: m31.geometry.width_arcmin!,
      heightArcmin: m31.geometry.height_arcmin!,
      positionAngleDeg: m31.geometry.position_angle_deg ?? 0,
      imageScaleXArcsecPerPx: scale,
      imageScaleYArcsecPerPx: scale,
      sensorWidthPx: 1920,
      sensorHeightPx: 1080,
    });
    // M31 spans ~190' — far larger than a 1920 px × 2.5"/px (~80') field.
    expect(framing.fitStatus).toBe('does_not_fit');
  });
});
