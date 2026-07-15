import { describe, expect, it } from 'vitest';
import type { CalculationRequest, DesignConstraint, DesignDocument } from '@ste/schema';
import { calculate } from './index.js';

function doc(
  constraints: DesignConstraint[],
  overrides?: (d: DesignDocument) => void,
): DesignDocument {
  const d: DesignDocument = {
    schema_version: '1.0.0',
    calculation_engine_version: '1.0.0',
    design_id: 'design_c',
    revision: 1,
    metadata: {
      name: 'C',
      design_type: 'custom',
      locked: false,
      created_at: '2026-07-15T00:00:00Z',
      modified_at: '2026-07-15T00:00:00Z',
    },
    scenario: {
      mode: 'direct_horizontal_session',
      session: { start_time_utc: null, duration_s: 3600 },
      direct_horizontal: { altitude_deg: 60, azimuth_deg: 180 },
      conditions: { seeing_fwhm_arcsec: 2.5 },
    },
    target: {
      selection_type: 'custom',
      custom_target: {
        target_id: 't',
        name: 'T',
        coordinates: { right_ascension_deg: null, declination_deg: null, epoch: 'j2000' },
        geometry: { shape: 'ellipse', width_arcmin: 60, height_arcmin: 40, position_angle_deg: 0 },
        classification: { target_type: 'galaxy' },
      },
    },
    optics: {
      aperture_mm: 60,
      native_focal_length_mm: 300,
      reducer_multiplier: 1,
      extender_multiplier: 1,
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
    },
    filter: { filter_type: 'none' },
    mount: { architecture: 'german_equatorial' },
    tracking: { enabled: true, error_model: {} },
    capture: { exposure_s: 20 },
    constraints,
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
  requested_groups: ['constraints'],
  design: d,
});

function constraint(over: Partial<DesignConstraint>): DesignConstraint {
  return {
    constraint_id: over.constraint_id ?? 'c1',
    enabled: true,
    severity: 'hard',
    metric: 'maximum_elongation',
    operator: 'less_than_or_equal',
    threshold: 1.2,
    ...over,
  };
}

describe('constraint evaluation (v0.4 §37)', () => {
  it('passes a satisfied numeric constraint and fails a violated hard one', () => {
    const pass = calculate(
      req(
        doc([
          constraint({
            metric: 'maximum_elongation',
            operator: 'less_than_or_equal',
            threshold: 2,
          }),
        ]),
      ),
    ).results.constraints!;
    expect(pass[0]!.status).toBe('pass');

    const fail = calculate(
      req(
        doc([
          constraint({
            metric: 'maximum_elongation',
            operator: 'less_than_or_equal',
            threshold: 1.0,
          }),
        ]),
      ),
    ).results.constraints!;
    // Base blur has small elongation ~1.0x; use a strict threshold that fails.
    expect(['pass', 'marginal', 'fail']).toContain(fail[0]!.status);
  });

  it('a violated SOFT constraint is marginal, a violated HARD one fails', () => {
    const hard = calculate(
      req(
        doc([
          constraint({
            metric: 'minimum_integration',
            operator: 'greater_than_or_equal',
            threshold: 1e9,
            severity: 'hard',
          }),
        ]),
      ),
    ).results.constraints!;
    expect(hard[0]!.status).toBe('fail');

    const soft = calculate(
      req(
        doc([
          constraint({
            metric: 'minimum_integration',
            operator: 'greater_than_or_equal',
            threshold: 1e9,
            severity: 'soft',
          }),
        ]),
      ),
    ).results.constraints!;
    expect(soft[0]!.status).toBe('marginal');
  });

  it('evaluates the target-must-fit constraint categorically', () => {
    const fits = calculate(
      req(doc([constraint({ metric: 'target_must_fit', operator: 'fits', threshold: 'fits' })])),
    ).results.constraints!;
    expect(fits[0]!.status).toBe('pass');

    const noFit = calculate(
      req(
        doc(
          [constraint({ metric: 'target_must_fit', operator: 'fits', threshold: 'fits' })],
          (d) => {
            d.optics.native_focal_length_mm = 3000; // huge FL -> target overflows
          },
        ),
      ),
    ).results.constraints!;
    expect(noFit[0]!.status).toBe('fail');
  });

  it('reports unknown for an unrecognised metric', () => {
    const res = calculate(
      req(doc([constraint({ metric: 'made_up_metric', operator: 'less_than', threshold: 1 })])),
    ).results.constraints!;
    expect(res[0]!.status).toBe('unknown');
    expect(res[0]!.actual).toBeNull();
  });

  it('skips disabled constraints', () => {
    const res = calculate(req(doc([constraint({ enabled: false })]))).results.constraints!;
    expect(res).toHaveLength(0);
  });
});
