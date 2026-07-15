import { describe, expect, it } from 'vitest';
import {
  CALCULATION_GROUPS,
  CONFIDENCE_LEVELS,
  MOUNT_ARCHITECTURES,
  RESULT_STATUSES,
  SCHEMA_VERSION,
  SOURCE_TYPES,
  TARGET_TYPES,
  type DesignDocument,
} from './index.js';

/**
 * The canonical minimal static-geometry document from spec v0.8 §19 (the F01
 * fixture inputs). Building it purely from schema types is the R0 acceptance
 * check that the schema can represent a minimal valid v1 document (v0.8 §48.2)
 * without any UI state (v0.8 §48.1).
 */
const F01_MINIMAL_DOCUMENT: DesignDocument = {
  schema_version: SCHEMA_VERSION,
  calculation_engine_version: SCHEMA_VERSION,
  design_id: 'design_f01_30mm_prototype',
  revision: 1,
  metadata: {
    name: '30 mm Prototype',
    design_type: 'custom',
    locked: false,
    created_at: '2026-07-14T00:00:00Z',
    modified_at: '2026-07-14T00:00:00Z',
  },
  scenario: {
    mode: 'direct_horizontal_session',
    session: {
      start_time_utc: '2026-07-14T03:00:00Z',
      duration_s: 3600,
    },
    direct_horizontal: {
      altitude_deg: 45,
      azimuth_deg: 180,
    },
    conditions: {
      seeing_fwhm_arcsec: 2.5,
    },
  },
  target: {
    selection_type: 'custom',
    custom_target: {
      target_id: 'target_custom_demo',
      name: 'Demo Nebula',
      coordinates: { right_ascension_deg: null, declination_deg: null, epoch: 'j2000' },
      geometry: { shape: 'ellipse', width_arcmin: 90, height_arcmin: 60, position_angle_deg: 35 },
      classification: { target_type: 'emission_nebula', spectral_class: 'emission_line' },
    },
  },
  optics: {
    aperture_mm: 30,
    native_focal_length_mm: 160,
    reducer_multiplier: 1,
    extender_multiplier: 1,
    optical_blur: {
      representation: 'quality_preset',
      preset_class: 'typical_inexpensive_lens',
      field_position: 'field_average',
    },
  },
  camera: {
    sensor: {
      sensor_width_mm: 11.136,
      sensor_height_mm: 6.264,
      horizontal_pixels: 3840,
      vertical_pixels: 2160,
      pixel_pitch_x_um: 2.9,
      pixel_pitch_y_um: 2.9,
      color_mode: 'color',
    },
  },
  filter: {
    filter_type: 'none',
  },
  mount: {
    architecture: 'alt_azimuth',
  },
  tracking: {
    enabled: false,
  },
  capture: {
    exposure_s: 10,
  },
  constraints: [],
  extensions: {},
};

describe('minimal v1 document (F01, spec v0.8 §19)', () => {
  it('is representable by the schema types with only stable inputs', () => {
    expect(F01_MINIMAL_DOCUMENT.optics.aperture_mm).toBe(30);
    expect(F01_MINIMAL_DOCUMENT.optics.native_focal_length_mm).toBe(160);
    expect(F01_MINIMAL_DOCUMENT.camera.sensor.pixel_pitch_x_um).toBe(2.9);
    expect(F01_MINIMAL_DOCUMENT.scenario.conditions.seeing_fwhm_arcsec).toBe(2.5);
  });

  it('carries no result snapshot as an authoritative input (v0.8 §2.5)', () => {
    expect(F01_MINIMAL_DOCUMENT.result_snapshot).toBeUndefined();
  });

  it('distinguishes unknown (null) from an omitted field (v0.8 §2.4)', () => {
    const coords = F01_MINIMAL_DOCUMENT.target.custom_target?.coordinates;
    // RA is present-but-unknown for a direct alt/az design.
    expect(coords?.right_ascension_deg).toBeNull();
    // No obstruction field was supplied at all.
    expect('central_obstruction_mm' in F01_MINIMAL_DOCUMENT.optics).toBe(false);
  });
});

describe('enum tuples are runtime-iterable and unique', () => {
  const tuples: Record<string, readonly string[]> = {
    SOURCE_TYPES,
    CONFIDENCE_LEVELS,
    MOUNT_ARCHITECTURES,
    TARGET_TYPES,
    RESULT_STATUSES,
    CALCULATION_GROUPS,
  };

  for (const [name, values] of Object.entries(tuples)) {
    it(`${name} has no duplicate members`, () => {
      expect(new Set(values).size).toBe(values.length);
    });
  }

  it('includes the spec-critical members', () => {
    expect(CONFIDENCE_LEVELS).toContain('unknown');
    expect(MOUNT_ARCHITECTURES).toContain('alt_azimuth');
    expect(CALCULATION_GROUPS).toContain('static_geometry');
    expect(RESULT_STATUSES).toContain('unavailable');
  });
});
