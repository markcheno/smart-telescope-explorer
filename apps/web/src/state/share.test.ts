import { describe, expect, it } from 'vitest';
import { F01_DOCUMENT } from '@ste/test-fixtures';
import type { DesignDocument } from '@ste/schema';
import { buildShareUrl, hasExactCoordinates, readSharedFromLocation } from './share.js';

function withCoords(): DesignDocument {
  const d = structuredClone(F01_DOCUMENT);
  d.target.custom_target = {
    target_id: 'cat_m31',
    name: 'Andromeda Galaxy',
    coordinates: { right_ascension_deg: 10.685, declination_deg: 41.269, epoch: 'j2000' },
    geometry: { shape: 'ellipse', width_arcmin: 60, height_arcmin: 30, position_angle_deg: 35 },
    classification: { target_type: 'galaxy' },
  };
  return d;
}

function hashOf(url: string): string {
  return url.slice(url.indexOf('#'));
}

describe('share links (v0.5 §43)', () => {
  it('round-trips a design through encode/decode as a copy', () => {
    const d = withCoords();
    const url = buildShareUrl(d, { privacy: 'exact' })!;
    expect(url).toContain('#share=');
    const shared = readSharedFromLocation(hashOf(url))!;
    expect(shared.design.optics.native_focal_length_mm).toBe(d.optics.native_focal_length_mm);
    // Opened as an independent copy.
    expect(shared.design.design_id).not.toBe(d.design_id);
    expect(shared.design.revision).toBe(1);
    expect(shared.design.metadata.name).toMatch(/shared copy/i);
    expect(shared.design.metadata.locked).toBe(false);
  });

  it('exact mode preserves coordinates', () => {
    const url = buildShareUrl(withCoords(), { privacy: 'exact' })!;
    const c = readSharedFromLocation(hashOf(url))!.design.target.custom_target!.coordinates;
    expect(c.right_ascension_deg).toBeCloseTo(10.685, 3);
  });

  it('rounded mode rounds coordinates', () => {
    const url = buildShareUrl(withCoords(), { privacy: 'rounded' })!;
    const c = readSharedFromLocation(hashOf(url))!.design.target.custom_target!.coordinates;
    expect(c.right_ascension_deg).toBe(11);
    expect(c.declination_deg).toBe(41);
  });

  it('removed mode strips coordinates', () => {
    const url = buildShareUrl(withCoords(), { privacy: 'removed' })!;
    const c = readSharedFromLocation(hashOf(url))!.design.target.custom_target!.coordinates;
    expect(c.right_ascension_deg).toBeNull();
    expect(c.declination_deg).toBeNull();
  });

  it('detects exact coordinates', () => {
    expect(hasExactCoordinates(withCoords())).toBe(true);
    const d = structuredClone(F01_DOCUMENT);
    if (d.target.custom_target != null) {
      d.target.custom_target.coordinates = {
        right_ascension_deg: null,
        declination_deg: null,
        epoch: 'j2000',
      };
    }
    expect(hasExactCoordinates(d)).toBe(false);
  });

  it('ignores a non-share hash', () => {
    expect(readSharedFromLocation('#exposure')).toBeNull();
    expect(readSharedFromLocation('')).toBeNull();
  });
});
