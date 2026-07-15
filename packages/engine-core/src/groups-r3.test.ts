import { describe, expect, it } from 'vitest';
import type { CalculationRequest, DesignDocument } from '@ste/schema';
import { calculate } from './index.js';

function doc(overrides?: (d: DesignDocument) => void): DesignDocument {
  const d: DesignDocument = {
    schema_version: '1.0.0',
    calculation_engine_version: '1.0.0',
    design_id: 'design_r3',
    revision: 1,
    metadata: {
      name: 'R3',
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
      selection_type: 'custom',
      custom_target: {
        target_id: 't',
        name: 'T',
        coordinates: { right_ascension_deg: null, declination_deg: null, epoch: 'j2000' },
        geometry: { shape: 'ellipse', width_arcmin: 30, height_arcmin: 20, position_angle_deg: 0 },
        classification: { target_type: 'galaxy' },
      },
    },
    optics: {
      aperture_mm: 60,
      native_focal_length_mm: 300,
      reducer_multiplier: 1,
      extender_multiplier: 1,
      optical_transmission_fraction: 0.9,
      optical_blur: { representation: 'fwhm_arcsec', value: 1.5 },
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
      noise: { effective_quantum_efficiency_fraction: 0.8, read_noise_e_rms: 2 },
      readout: { readout_time_s: 1 },
    },
    filter: { filter_type: 'none' },
    mount: { architecture: 'german_equatorial' },
    tracking: { enabled: true, error_model: {} },
    capture: { exposure_s: 20 },
    constraints: [],
    extensions: {},
  };
  overrides?.(d);
  return d;
}

const req = (
  d: DesignDocument,
  groups: CalculationRequest['requested_groups'],
): CalculationRequest => ({
  message_type: 'calculate_design',
  request_id: 'r',
  design_id: d.design_id,
  design_revision: d.revision,
  engine_version: '1.0.0',
  calculation_mode: 'normal',
  requested_groups: groups,
  design: d,
});

describe('session group (R3, §27/§28)', () => {
  it('accounts frames, acceptance, and effective integration', () => {
    const s = calculate(req(doc(), ['session'])).results.session!;
    // 20 s exposure + 1 s overhead over a 3600 s session -> ~171 frames.
    expect(s.frames_attempted.value as number).toBe(Math.floor(3600 / 21));
    expect(s.effective_integration_s.value as number).toBeGreaterThan(0);
    expect(s.duty_cycle.value as number).toBeCloseTo(20 / 21, 3);
  });

  it('environmental losses reduce acceptance', () => {
    const withLoss = calculate(
      req(
        doc((d) => {
          d.scenario.conditions.environmental_frame_loss_fraction = 0.2;
        }),
        ['session'],
      ),
    ).results.session!;
    expect(withLoss.environmental_acceptance.value as number).toBeCloseTo(0.8, 6);
  });
});

describe('sensitivity group (R3, §23)', () => {
  it('reports throughput factors and a relative stack score', () => {
    const s = calculate(req(doc(), ['sensitivity'])).results.sensitivity!;
    expect(s.effective_area_mm2.value as number).toBeGreaterThan(0);
    expect(s.point_source_throughput.value as number).toBeGreaterThan(0);
    expect(s.relative_stack_score.value as number).toBeGreaterThan(0);
    expect(s.photometric_available.value).toBe(false);
  });

  it('larger aperture raises point-source throughput (ratio, invariant §48)', () => {
    const small = calculate(req(doc(), ['sensitivity'])).results.sensitivity!
      .point_source_throughput.value as number;
    const big = calculate(
      req(
        doc((d) => {
          d.optics.aperture_mm = 120;
        }),
        ['sensitivity'],
      ),
    ).results.sensitivity!.point_source_throughput.value as number;
    expect(big).toBeGreaterThan(small);
  });
});

describe('stack geometry group (R3, §29)', () => {
  it('equatorial mount keeps near-full coverage (no field rotation)', () => {
    const g = calculate(req(doc(), ['stack_geometry'])).results.stack_geometry!;
    expect(g.common_coverage_fraction.value as number).toBeCloseTo(1, 2);
  });
});
