import { describe, expect, it } from 'vitest';
import type { CalculationRequest, DesignDocument } from '@ste/schema';
import { calculate } from './coordinator.js';
import { buildReport } from './report.js';

function doc(): DesignDocument {
  return {
    schema_version: '1.0.0',
    calculation_engine_version: '1.0.0',
    design_id: 'design_rep',
    revision: 3,
    metadata: {
      name: 'Report Design',
      design_type: 'custom',
      locked: false,
      created_at: '2026-07-15T00:00:00Z',
      modified_at: '2026-07-15T00:00:00Z',
    },
    scenario: {
      mode: 'direct_horizontal_session',
      session: { start_time_utc: null, duration_s: 3600 },
      direct_horizontal: { altitude_deg: 60, azimuth_deg: 180 },
      conditions: { seeing_fwhm_arcsec: 2.5, sky_brightness_mag_arcsec2: 19.5 },
    },
    target: {
      selection_type: 'catalog',
      custom_target: {
        target_id: 'cat_m31',
        name: 'Andromeda Galaxy',
        coordinates: { right_ascension_deg: 10.685, declination_deg: 41.269, epoch: 'j2000' },
        geometry: { shape: 'ellipse', width_arcmin: 60, height_arcmin: 30, position_angle_deg: 35 },
        classification: { target_type: 'galaxy' },
      },
    },
    optics: {
      aperture_mm: 60,
      native_focal_length_mm: 300,
      reducer_multiplier: 1,
      extender_multiplier: 1,
      optical_transmission_fraction: 0.9,
      optical_blur: { representation: 'fwhm_arcsec', value: 2 },
    },
    camera: {
      sensor: {
        sensor_width_mm: 7.68,
        sensor_height_mm: 4.32,
        horizontal_pixels: 3840,
        vertical_pixels: 2160,
        pixel_pitch_x_um: 2.0,
        pixel_pitch_y_um: 2.0,
      },
      noise: { effective_quantum_efficiency_fraction: 0.8, read_noise_e_rms: 2 },
      readout: { readout_time_s: 1 },
    },
    filter: { filter_type: 'none' },
    mount: { architecture: 'german_equatorial' },
    tracking: { enabled: true, error_model: {} },
    capture: {
      exposure_s: 20,
      exposure_sweep: { enabled: true, minimum_exposure_s: 1, maximum_exposure_s: 60 },
    },
    constraints: [],
    extensions: {},
  };
}

const req = (d: DesignDocument): CalculationRequest => ({
  message_type: 'calculate_design',
  request_id: 'r',
  design_id: d.design_id,
  design_revision: d.revision,
  engine_version: '1.0.0',
  calculation_mode: 'normal',
  requested_groups: ['all'],
  design: d,
});

describe('report builder (v0.8 §44)', () => {
  it('assembles cover, sections, and versions without recalculating', () => {
    const d = doc();
    const response = calculate(req(d));
    const report = buildReport(d, response, { generated_at: '2026-07-15T12:00:00Z' });

    expect(report.template_version).toBe('1.0.0');
    expect(report.cover.name).toBe('Report Design');
    expect(report.cover.target).toBe('Andromeda Galaxy');
    expect(report.cover.generated_at).toBe('2026-07-15T12:00:00Z');
    expect(report.versions.engine).toBe(response.engine_version);
    // The spec's report sections are present and ordered.
    const ids = report.sections.map((s) => s.id);
    expect(ids).toEqual(['system', 'framing', 'blur', 'exposure', 'sensitivity']);
  });

  it('honours location privacy modes', () => {
    const d = doc();
    const response = calculate(req(d));
    const coordRow = (mode: 'exact' | 'rounded' | 'removed'): string => {
      const r = buildReport(d, response, { privacy: { location_mode: mode } });
      const framing = r.sections.find((s) => s.id === 'framing')!;
      return framing.rows.find((x) => x.label === 'Coordinates')!.value as string;
    };
    expect(coordRow('exact')).toContain('10.685');
    expect(coordRow('rounded')).toContain('RA 11°');
    expect(coordRow('rounded')).not.toContain('10.685');
    expect(coordRow('removed')).toBe('withheld');
  });

  it('derives an executive summary from the verdicts', () => {
    const d = doc();
    const report = buildReport(d, calculate(req(d)));
    // v1 has no absolute photometry, so this limitation always appears.
    expect(report.summary.limitations.some((l) => /relative/i.test(l))).toBe(true);
    // recommended exposure / yield / integration are ResultValues (or null).
    expect(report.summary).toHaveProperty('recommended_exposure');
    expect(report.summary).toHaveProperty('effective_integration');
  });
});
