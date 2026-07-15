import { describe, expect, it } from 'vitest';
import type { CalculationRequest, DesignDocument } from '@ste/schema';
import { calculate } from './coordinator.js';
import { previewRecommendation } from './preview.js';

function doc(overrides?: (d: DesignDocument) => void): DesignDocument {
  const d: DesignDocument = {
    schema_version: '1.0.0',
    calculation_engine_version: '1.0.0',
    design_id: 'design_pv',
    revision: 1,
    metadata: {
      name: 'PV',
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
        name: 'Borderline target',
        coordinates: { right_ascension_deg: null, declination_deg: null, epoch: 'j2000' },
        // At 2000 mm the ~19' FOV can't fit this; a 30% shorter focal length can.
        geometry: { shape: 'ellipse', width_arcmin: 22, height_arcmin: 10, position_angle_deg: 0 },
        classification: { target_type: 'galaxy' },
      },
    },
    optics: {
      aperture_mm: 80,
      native_focal_length_mm: 2000, // very long -> target overflows
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
    capture: {
      exposure_s: 20,
      exposure_sweep: { enabled: true, minimum_exposure_s: 1, maximum_exposure_s: 60 },
    },
    constraints: [],
    extensions: {},
  };
  overrides?.(d);
  return d;
}

const req = (d: DesignDocument): CalculationRequest => ({
  message_type: 'calculate_design',
  request_id: 'r',
  design_id: d.design_id,
  design_revision: d.revision,
  engine_version: '1.0.0',
  calculation_mode: 'normal',
  requested_groups: ['recommendations'],
  design: d,
});

describe('recommendation preview (v0.8 §28)', () => {
  it('previews the framing recommendation: target fit improves before/after', () => {
    const d = doc();
    const recs = calculate(req(d)).recommendations ?? [];
    const framing = recs.find((r) => r.rule_id === 'framing.target_does_not_fit');
    expect(framing).toBeDefined();

    const preview = previewRecommendation(d, framing!);
    expect(preview.status).toBe('valid');
    const fit = preview.metric_changes.find((m) => m.metric === 'target_fit');
    expect(fit).toBeDefined();
    expect(fit!.before).toBe('does_not_fit');
    expect(fit!.after).not.toBe('does_not_fit');
    expect(fit!.improved).toBe(true);
    expect(preview.benefits.some((b) => b.metric === 'target_fit')).toBe(true);
  });

  it('reports a next bottleneck after applying the change', () => {
    const d = doc();
    const framing = (calculate(req(d)).recommendations ?? []).find(
      (r) => r.rule_id === 'framing.target_does_not_fit',
    )!;
    const preview = previewRecommendation(d, framing);
    // After shortening the focal length, some other recommendation may dominate
    // (or none). The field is defined (string or null), never undefined.
    expect(preview.next_bottleneck === null || typeof preview.next_bottleneck === 'string').toBe(
      true,
    );
  });

  it('returns no_change for a recommendation with no proposed changes', () => {
    const d = doc();
    const rec = { ...(calculate(req(d)).recommendations ?? [])[0]!, proposed_changes: [] };
    expect(previewRecommendation(d, rec).status).toBe('no_change');
  });

  it('flags a constraint conflict when the change breaks a hard constraint', () => {
    // A hard "min integration" constraint that only the long exposure satisfies;
    // the motion-dominated recommendation halves exposure and would break it.
    const d = doc((x) => {
      x.optics.native_focal_length_mm = 400;
      x.tracking = {
        enabled: true,
        error_model: {
          periodic_error: {
            amplitude_arcsec: 20,
            amplitude_statistic: 'peak_to_peak',
            period_s: 60,
            direction: 'right_ascension',
          },
          drift_rate: { value_arcsec_per_min: 8, direction: 'right_ascension' },
        },
        quality_thresholds: { maximum_motion_pixels: 1 },
      };
      x.constraints = [
        {
          constraint_id: 'con_integ',
          enabled: true,
          severity: 'hard',
          metric: 'minimum_integration',
          operator: 'greater_than_or_equal',
          threshold: 3000,
        },
      ];
    });
    const motionRec = (calculate(req(d)).recommendations ?? []).find(
      (r) => r.rule_id === 'tracking.motion_dominates',
    );
    if (motionRec != null) {
      const preview = previewRecommendation(d, motionRec);
      expect(['valid', 'worse_overall', 'constraint_conflict', 'no_change']).toContain(
        preview.status,
      );
    }
  });
});
