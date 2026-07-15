/**
 * @ste/catalogs — locked commercial reference designs (spec v0.8 §38; v0.7 §24).
 *
 * References separate PUBLISHED facts (aperture, focal length, sensor, mount)
 * from ENGINEERING ASSUMPTIONS for unknowns (tracking error, QE, read noise) —
 * consumer smart telescopes don't publish tracking specs, so those are estimated
 * and clearly commented. References are locked (`design_type: 'reference'`,
 * `locked: true`); a user duplicates one to edit it.
 *
 * The scenario and target here are placeholders — the comparison engine
 * normalises every design onto the user's target + scenario before computing, so
 * the hardware is judged on the same sky.
 */

import type { DesignDocument } from '@ste/schema';

/** A neutral scenario/target used only until the comparison normalises them. */
function referenceBase(
  id: string,
  name: string,
): Omit<DesignDocument, 'optics' | 'camera' | 'mount' | 'tracking' | 'capture'> {
  return {
    schema_version: '1.0.0',
    calculation_engine_version: '1.0.0',
    design_id: id,
    revision: 1,
    metadata: {
      name,
      design_type: 'reference',
      locked: true,
      created_at: '2026-07-15T00:00:00Z',
      modified_at: '2026-07-15T00:00:00Z',
      description:
        'Published specifications; tracking, QE, and read noise are engineering estimates.',
    },
    scenario: {
      mode: 'direct_horizontal_static',
      direct_horizontal: { altitude_deg: 60, azimuth_deg: 180 },
      conditions: { seeing_fwhm_arcsec: 2.5, sky_brightness_mag_arcsec2: 19.5 },
    },
    target: {
      selection_type: 'custom',
      custom_target: {
        target_id: `${id}_placeholder`,
        name: 'Placeholder',
        coordinates: { right_ascension_deg: null, declination_deg: null, epoch: 'j2000' },
        geometry: { shape: 'ellipse', width_arcmin: 60, height_arcmin: 40, position_angle_deg: 0 },
        classification: { target_type: 'galaxy' },
      },
    },
    filter: { filter_type: 'uv_ir_cut' },
    constraints: [],
    extensions: {},
  };
}

/**
 * ZWO Seestar S30 — 30 mm f/5 triplet, Sony IMX662 (1920×1080, 2.9 µm), alt-az.
 * Tracking / QE / read noise are estimates for a consumer alt-az smart scope.
 */
export const SEESTAR_S30: DesignDocument = {
  ...referenceBase('reference_seestar_s30', 'Seestar S30'),
  optics: {
    aperture_mm: 30,
    native_focal_length_mm: 150,
    reducer_multiplier: 1,
    extender_multiplier: 1,
    optical_transmission_fraction: 0.85,
    image_circle_diameter_mm: 8,
    optical_blur: { representation: 'quality_preset', preset_class: 'good' },
  },
  camera: {
    camera_name: 'Sony IMX662',
    sensor: {
      sensor_width_mm: 5.568,
      sensor_height_mm: 3.132,
      horizontal_pixels: 1920,
      vertical_pixels: 1080,
      pixel_pitch_x_um: 2.9,
      pixel_pitch_y_um: 2.9,
      color_mode: 'color',
    },
    // Estimated noise profile (not published).
    noise: {
      effective_quantum_efficiency_fraction: 0.8,
      read_noise_e_rms: 1.0,
      dark_current_e_per_px_s: 0.05,
    },
    readout: { readout_time_s: 0.5 },
  },
  mount: { architecture: 'alt_azimuth', model_level: 'basic_performance' },
  // Estimated tracking error for a small alt-az consumer mount.
  tracking: {
    enabled: true,
    error_model: {
      periodic_error: {
        amplitude_arcsec: 8,
        amplitude_statistic: 'peak_to_peak',
        period_s: 120,
        direction: 'right_ascension',
      },
      tracking_jitter: { value: 2, statistic: 'rms', direction: 'isotropic' },
    },
    quality_thresholds: { maximum_motion_pixels: 1, maximum_corner_rotation_pixels: 1 },
  },
  capture: {
    exposure_s: 10,
    stack_efficiency_fraction: 0.9,
    exposure_sweep: { enabled: true, minimum_exposure_s: 1, maximum_exposure_s: 30 },
  },
};

/**
 * DWARF 3 (tele) — 35 mm f/4.3, Sony IMX678 (3840×2160, 2.0 µm), alt-az.
 * Tracking / QE / read noise are estimates.
 */
export const DWARF_3: DesignDocument = {
  ...referenceBase('reference_dwarf_3', 'DWARF 3'),
  optics: {
    aperture_mm: 35,
    native_focal_length_mm: 150,
    reducer_multiplier: 1,
    extender_multiplier: 1,
    optical_transmission_fraction: 0.85,
    image_circle_diameter_mm: 9,
    optical_blur: { representation: 'quality_preset', preset_class: 'good' },
  },
  camera: {
    camera_name: 'Sony IMX678',
    sensor: {
      sensor_width_mm: 7.68,
      sensor_height_mm: 4.32,
      horizontal_pixels: 3840,
      vertical_pixels: 2160,
      pixel_pitch_x_um: 2.0,
      pixel_pitch_y_um: 2.0,
      color_mode: 'color',
    },
    noise: {
      effective_quantum_efficiency_fraction: 0.8,
      read_noise_e_rms: 1.2,
      dark_current_e_per_px_s: 0.05,
    },
    readout: { readout_time_s: 0.5 },
  },
  mount: { architecture: 'alt_azimuth', model_level: 'basic_performance' },
  tracking: {
    enabled: true,
    error_model: {
      periodic_error: {
        amplitude_arcsec: 8,
        amplitude_statistic: 'peak_to_peak',
        period_s: 120,
        direction: 'right_ascension',
      },
      tracking_jitter: { value: 2, statistic: 'rms', direction: 'isotropic' },
    },
    quality_thresholds: { maximum_motion_pixels: 1, maximum_corner_rotation_pixels: 1 },
  },
  capture: {
    exposure_s: 15,
    stack_efficiency_fraction: 0.9,
    exposure_sweep: { enabled: true, minimum_exposure_s: 1, maximum_exposure_s: 30 },
  },
};

/** All locked reference designs available for comparison. */
export const REFERENCE_DESIGNS: readonly DesignDocument[] = [SEESTAR_S30, DWARF_3];
