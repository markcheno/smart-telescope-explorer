import { describe, expect, it } from 'vitest';
import type { DesignDocument } from '@ste/schema';
import { ISSUE_CODES, validateDesign } from './index.js';

function validDoc(): DesignDocument {
  return {
    schema_version: '1.0.0',
    calculation_engine_version: '1.0.0',
    design_id: 'design_test',
    revision: 1,
    metadata: {
      name: 'Test',
      design_type: 'custom',
      locked: false,
      created_at: '2026-07-14T00:00:00Z',
      modified_at: '2026-07-14T00:00:00Z',
    },
    scenario: {
      mode: 'direct_horizontal_session',
      session: { start_time_utc: '2026-07-14T03:00:00Z', duration_s: 3600 },
      direct_horizontal: { altitude_deg: 45, azimuth_deg: 180 },
      conditions: { seeing_fwhm_arcsec: 2.5 },
    },
    target: {
      selection_type: 'custom',
      custom_target: {
        target_id: 't1',
        name: 'T',
        coordinates: { right_ascension_deg: 10, declination_deg: 41, epoch: 'j2000' },
        geometry: { shape: 'ellipse', width_arcmin: 90, height_arcmin: 60 },
        classification: { target_type: 'galaxy' },
      },
    },
    optics: {
      aperture_mm: 30,
      native_focal_length_mm: 160,
      reducer_multiplier: 1,
      extender_multiplier: 1,
      optical_blur: { representation: 'quality_preset', preset_class: 'typical_inexpensive_lens' },
    },
    camera: {
      sensor: {
        sensor_width_mm: 11.136,
        sensor_height_mm: 6.264,
        horizontal_pixels: 3840,
        vertical_pixels: 2160,
        pixel_pitch_x_um: 2.9,
        pixel_pitch_y_um: 2.9,
      },
    },
    filter: { filter_type: 'none' },
    mount: { architecture: 'alt_azimuth' },
    tracking: { enabled: false },
    capture: { exposure_s: 10 },
    constraints: [],
    extensions: {},
  };
}

const codes = (doc: DesignDocument): string[] => validateDesign(doc).issues.map((i) => i.code);

describe('valid F01 document', () => {
  it('passes with no errors', () => {
    const result = validateDesign(validDoc());
    expect(result.ok).toBe(true);
    expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('produces deterministic issue ids', () => {
    const bad = validDoc();
    bad.optics.aperture_mm = -5;
    const a = validateDesign(bad).issues;
    const b = validateDesign(bad).issues;
    expect(a.map((i) => i.issue_id)).toEqual(b.map((i) => i.issue_id));
  });
});

describe('field-level checks (R0-007)', () => {
  it('flags missing and non-positive aperture', () => {
    const missing = validDoc();
    missing.optics.aperture_mm = null;
    expect(codes(missing)).toContain(ISSUE_CODES.APERTURE_MISSING);

    const negative = validDoc();
    negative.optics.aperture_mm = -1;
    expect(codes(negative)).toContain(ISSUE_CODES.APERTURE_INVALID);
  });

  it('flags non-positive focal length and exposure', () => {
    const doc = validDoc();
    doc.optics.native_focal_length_mm = 0;
    doc.capture.exposure_s = -3;
    const c = codes(doc);
    expect(c).toContain(ISSUE_CODES.FOCAL_LENGTH_INVALID);
    expect(c).toContain(ISSUE_CODES.EXPOSURE_INVALID);
  });

  it('flags transmission and QE out of range', () => {
    const doc = validDoc();
    doc.optics.optical_transmission_fraction = 1.5;
    doc.camera.noise = { effective_quantum_efficiency_fraction: -0.1 };
    const c = codes(doc);
    expect(c).toContain(ISSUE_CODES.TRANSMISSION_RANGE);
    expect(c).toContain(ISSUE_CODES.QE_RANGE);
  });

  it('flags obstruction >= aperture', () => {
    const doc = validDoc();
    doc.optics.central_obstruction_mm = 35;
    expect(codes(doc)).toContain(ISSUE_CODES.OBSTRUCTION_EXCEEDS_APERTURE);
  });

  it('flags out-of-range coordinates', () => {
    const doc = validDoc();
    doc.target.custom_target!.coordinates.declination_deg = 120;
    expect(codes(doc)).toContain(ISSUE_CODES.COORDINATES_INVALID);
  });

  it('advises when optical blur is unknown (not an error)', () => {
    const doc = validDoc();
    doc.optics.optical_blur = { representation: 'unknown' };
    const result = validateDesign(doc);
    expect(result.ok).toBe(true);
    expect(result.issues.map((i) => i.code)).toContain(ISSUE_CODES.OPTICAL_BLUR_UNKNOWN);
  });
});

describe('cross-field checks (R0-008)', () => {
  it('warns on inconsistent sensor geometry but does not error', () => {
    const doc = validDoc();
    doc.camera.sensor.sensor_width_mm = 20; // 3840 * 2.9um = 11.136mm, so 20 is inconsistent
    const result = validateDesign(doc);
    expect(result.ok).toBe(true);
    expect(result.issues.map((i) => i.code)).toContain(ISSUE_CODES.SENSOR_GEOMETRY_MISMATCH);
  });

  it('accepts consistent sensor geometry within tolerance', () => {
    expect(codes(validDoc())).not.toContain(ISSUE_CODES.SENSOR_GEOMETRY_MISMATCH);
  });

  it('warns when a single exposure exceeds the session', () => {
    const doc = validDoc();
    doc.capture.exposure_s = 7200;
    expect(codes(doc)).toContain(ISSUE_CODES.EXPOSURE_EXCEEDS_SESSION);
  });
});
