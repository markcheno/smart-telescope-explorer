import { describe, expect, it } from 'vitest';
import type { CalculationRequest, DesignDocument } from '@ste/schema';
import { calculate } from './coordinator.js';

function doc(overrides?: (d: DesignDocument) => void): DesignDocument {
  const d: DesignDocument = {
    schema_version: '1.0.0',
    calculation_engine_version: '1.0.0',
    design_id: 'design_r4',
    revision: 1,
    metadata: {
      name: 'R4',
      design_type: 'custom',
      locked: false,
      created_at: '2026-07-15T00:00:00Z',
      modified_at: '2026-07-15T00:00:00Z',
    },
    scenario: {
      mode: 'direct_horizontal_session',
      session: { start_time_utc: null, duration_s: 3600 },
      direct_horizontal: { altitude_deg: 60, azimuth_deg: 180 },
      conditions: {
        seeing_fwhm_arcsec: 2.5,
        sky_brightness_mag_arcsec2: 19.5,
        temperature_start_c: 0,
      },
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
    capture: { exposure_s: 20 },
    focus: {
      motorized: true,
      travel_per_revolution_um: 400,
      motor_steps_per_revolution: 200,
      microsteps: 16,
      reduction_ratio: 1,
      repeatability_um: 1,
      temperature_coefficient_um_per_c: 5,
      focus_temperature_c: 10,
      autofocus_interval_s: 600,
      autofocus_duration_s: 15,
    },
    power: {
      loads: [
        { label: 'Compute', power_w: 6 },
        { label: 'Motors', power_w: 4, duty_fraction: 0.5 },
      ],
      battery: { nominal_energy_wh: 100 },
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
  requested_groups: ['power', 'focus'],
  design: d,
});

describe('power group (v0.4 §33)', () => {
  it('computes average power, usable energy, and runtime', () => {
    const power = calculate(req(doc())).results.power!;
    // 6 + 4·0.5 = 8 W average.
    expect(power.average_power_w.value).toBeCloseTo(8, 6);
    // 100 · 0.8 · 0.9 = 72 Wh usable.
    expect(power.usable_energy_wh.value).toBeCloseTo(72, 6);
    // 72 Wh / 8 W = 9 h = 32400 s.
    expect(power.runtime_s.value).toBeCloseTo(32400, 3);
    // 9 h runtime vs 1 h session + 20% reserve → covered.
    expect(power.session_covered.value).toBe(true);
  });

  it('does not cover the session when the battery is small', () => {
    const power = calculate(req(doc((d) => (d.power!.battery!.nominal_energy_wh = 2)))).results
      .power!;
    expect(power.session_covered.value).toBe(false);
  });

  it('reports unavailable with no loads', () => {
    const power = calculate(req(doc((d) => (d.power = {})))).results.power!;
    expect(power.average_power_w.status).toBe('unavailable');
    expect(power.runtime_s.status).toBe('unavailable');
  });
});

describe('focus group (v0.4 §11)', () => {
  it('computes step resolution, CFZ, and adequacy', () => {
    const focus = calculate(req(doc())).results.focus!;
    // 400 / (200·16) = 0.125 µm step.
    expect(focus.step_resolution_um.value).toBeCloseTo(0.125, 6);
    // f/5 at 60 mm/300 mm → CFZ half = 2·0.55·25 = 27.5 µm.
    expect(focus.critical_focus_zone_half_um.value).toBeCloseTo(27.5, 6);
    // Finest move (1 µm repeatability) ≤ 27.5/3 → adequate.
    expect(focus.resolution_adequate.value).toBe(true);
  });

  it('turns temperature drift into an on-sky defocus FWHM', () => {
    const focus = calculate(req(doc())).results.focus!;
    // K_T·(0 − 10) = −50 µm drift.
    expect(focus.temperature_drift_um.value).toBeCloseTo(-50, 6);
    // c = 50/5 = 10 µm; FWHM = 5.9 µm at 300 mm ≈ 4.06 arcsec.
    expect(focus.defocus_fwhm_arcsec.value as number).toBeCloseTo(4.056, 2);
    // 15 s / 600 s = 0.025 autofocus overhead.
    expect(focus.autofocus_overhead_fraction.value).toBeCloseTo(0.025, 6);
  });

  it('reports unavailable temperature drift when the reference temp is unknown', () => {
    const focus = calculate(req(doc((d) => (d.focus!.focus_temperature_c = null)))).results.focus!;
    expect(focus.temperature_drift_um.status).toBe('unavailable');
    expect(focus.defocus_fwhm_arcsec.status).toBe('unavailable');
    // CFZ and step resolution still resolve (they don't need temperature).
    expect(focus.critical_focus_zone_half_um.status).toBe('valid');
  });
});
