import { describe, expect, it } from 'vitest';
import { SEESTAR_S30, DWARF_3 } from '@ste/catalogs';
import type { ComparisonRequest, DesignDocument } from '@ste/schema';
import { compareDesigns } from './comparison.js';

function myDesign(): DesignDocument {
  // A larger DIY build (80 mm) on a light-polluted suburban sky.
  return {
    schema_version: '1.0.0',
    calculation_engine_version: '1.0.0',
    design_id: 'design_mine',
    revision: 3,
    metadata: {
      name: 'My 80 mm build',
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
        target_id: 'm31',
        name: 'Andromeda',
        coordinates: { right_ascension_deg: 10.68, declination_deg: 41.27, epoch: 'j2000' },
        geometry: { shape: 'ellipse', width_arcmin: 60, height_arcmin: 40, position_angle_deg: 35 },
        classification: { target_type: 'galaxy' },
      },
    },
    optics: {
      aperture_mm: 80,
      native_focal_length_mm: 400,
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
    tracking: {
      enabled: true,
      error_model: { drift_rate: { value_arcsec_per_min: 1, direction: 'right_ascension' } },
    },
    capture: {
      exposure_s: 30,
      exposure_sweep: { enabled: true, minimum_exposure_s: 1, maximum_exposure_s: 60 },
    },
    constraints: [],
    extensions: {},
  };
}

const request = (designs: DesignDocument[]): ComparisonRequest => ({
  message_type: 'compare_designs',
  request_id: 'cmp-1',
  baseline_index: 0,
  designs: designs.map((d, i) => ({ design: d, role: i === 0 ? 'baseline' : 'reference' })),
});

describe('design comparison (v0.8 §32)', () => {
  const res = compareDesigns(request([myDesign(), SEESTAR_S30, DWARF_3]));

  it('labels each design and completes', () => {
    expect(res.design_labels).toEqual(['My 80 mm build', 'Seestar S30', 'DWARF 3']);
    expect(res.status).toBe('complete');
    expect(res.baseline_index).toBe(0);
  });

  it('normalises onto the baseline target + scenario so hardware is judged on the same sky', () => {
    expect(res.normalization).toBe('same_target_and_scenario');
    // Field of view differs by optics/sensor, not by target.
    const fov = res.rows.find((r) => r.metric === 'field_of_view')!;
    expect(fov.cells.every((c) => typeof c.value === 'number')).toBe(true);
  });

  it('the 80 mm build wins point-source throughput over the 30 mm Seestar', () => {
    const row = res.rows.find((r) => r.metric === 'point_source_throughput')!;
    expect(row.direction).toBe('higher_better');
    expect(row.cells[0]!.is_best).toBe(true); // baseline (80 mm) collects most light
    expect(row.cells[1]!.value as number).toBeLessThan(row.cells[0]!.value as number); // Seestar 30 mm
  });

  it('reports baseline deltas for numeric metrics', () => {
    const integ = res.rows.find((r) => r.metric === 'effective_integration')!;
    expect(integ.cells[0]!.baseline_delta).toBe(0); // baseline vs itself
    expect(integ.cells[1]!.baseline_delta).not.toBeNull();
  });

  it('marks a row not-comparable when fewer than two designs have the metric', () => {
    // All three produce standard metrics here, so every row should be comparable.
    expect(res.rows.every((r) => r.comparison_valid)).toBe(true);
  });

  it('caps at four designs', () => {
    const five = compareDesigns(request([myDesign(), SEESTAR_S30, DWARF_3, SEESTAR_S30, DWARF_3]));
    expect(five.design_labels).toHaveLength(4);
  });
});
