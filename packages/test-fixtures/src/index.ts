/**
 * @ste/test-fixtures — canonical design documents and expected values
 * (spec v0.9 §23 R0-016).
 *
 * F01 is the spec's worked 30 mm example (v0.8 §19, v0.9 §9). F02 is a second,
 * deliberately-different design (larger refractor, reducer, provided
 * transmission and wavelength, direct optical FWHM) that exercises the code
 * paths F01 leaves unused and gives the invariant tests a second anchor. These
 * documents are pure `@ste/schema` records with no engine dependency.
 */

import type { CalculationGroup, CalculationRequest, DesignDocument } from '@ste/schema';

// --- F01: 30 mm prototype (spec v0.8 §19) --------------------------------

export const F01_DOCUMENT: DesignDocument = {
  schema_version: '1.0.0',
  calculation_engine_version: '1.0.0',
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
    session: { start_time_utc: '2026-07-14T03:00:00Z', duration_s: 3600 },
    direct_horizontal: { altitude_deg: 45, azimuth_deg: 180 },
    conditions: { seeing_fwhm_arcsec: 2.5 },
  },
  target: {
    selection_type: 'custom',
    custom_target: {
      target_id: 'target_f01_demo',
      name: 'Framing Demo',
      coordinates: { right_ascension_deg: null, declination_deg: null, epoch: 'j2000' },
      geometry: { shape: 'ellipse', width_arcmin: 120, height_arcmin: 80, position_angle_deg: 0 },
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
  filter: { filter_type: 'none' },
  mount: { architecture: 'alt_azimuth' },
  tracking: { enabled: false },
  capture: { exposure_s: 10 },
  constraints: [],
  extensions: {},
};

// --- F02: 80 mm reduced refractor ----------------------------------------

export const F02_DOCUMENT: DesignDocument = {
  schema_version: '1.0.0',
  calculation_engine_version: '1.0.0',
  design_id: 'design_f02_80mm_refractor',
  revision: 1,
  metadata: {
    name: '80 mm Refractor',
    design_type: 'custom',
    locked: false,
    created_at: '2026-07-14T00:00:00Z',
    modified_at: '2026-07-14T00:00:00Z',
  },
  scenario: {
    mode: 'direct_horizontal_session',
    session: { start_time_utc: '2026-07-14T03:00:00Z', duration_s: 7200 },
    direct_horizontal: { altitude_deg: 60, azimuth_deg: 150 },
    conditions: { seeing_fwhm_arcsec: 2.0 },
  },
  target: {
    selection_type: 'custom',
    custom_target: {
      target_id: 'target_f02_demo',
      name: 'Small Galaxy',
      coordinates: { right_ascension_deg: 148.9, declination_deg: 69.07, epoch: 'j2000' },
      geometry: { shape: 'ellipse', width_arcmin: 40, height_arcmin: 20, position_angle_deg: 30 },
      classification: { target_type: 'galaxy', spectral_class: 'broadband' },
    },
  },
  optics: {
    aperture_mm: 80,
    native_focal_length_mm: 480,
    reducer_multiplier: 0.8,
    extender_multiplier: 1,
    optical_transmission_fraction: 0.9,
    reference_wavelength_nm: 550,
    image_circle_diameter_mm: 22,
    optical_blur: { representation: 'fwhm_arcsec', value: 1.5, statistic: 'fwhm' },
  },
  camera: {
    sensor: {
      sensor_width_mm: 7.68,
      sensor_height_mm: 4.32,
      horizontal_pixels: 3840,
      vertical_pixels: 2160,
      pixel_pitch_x_um: 2.0,
      pixel_pitch_y_um: 2.0,
      color_mode: 'color',
    },
    readout: { stored_bit_depth: 16 },
  },
  filter: { filter_type: 'uv_ir_cut' },
  mount: { architecture: 'german_equatorial' },
  tracking: { enabled: true },
  capture: { exposure_s: 30 },
  constraints: [],
  extensions: {},
};

// --- expected values (with tolerances) -----------------------------------

export interface ExpectedValue {
  value: number | string;
  /** Decimal places to compare to for numeric values; omitted for exact/string. */
  precision?: number;
}

export interface FixtureExpectations {
  staticGeometry: Record<string, ExpectedValue>;
  sampling: Record<string, ExpectedValue>;
}

export const F01_EXPECTED: FixtureExpectations = {
  staticGeometry: {
    effective_focal_length_mm: { value: 160, precision: 6 },
    focal_ratio: { value: 5.333, precision: 3 },
    diffraction_fwhm_arcsec: { value: 3.887, precision: 2 },
    image_scale_x_arcsec_per_px: { value: 3.7386, precision: 3 },
    field_of_view_x_deg: { value: 3.986, precision: 2 },
    field_of_view_y_deg: { value: 2.243, precision: 2 },
    frame_size_bytes: { value: 16_588_800 },
  },
  sampling: {
    base_fwhm_arcsec: { value: 5.04, precision: 1 },
    pixels_per_fwhm: { value: 1.35, precision: 1 },
    classification: { value: 'moderately_undersampled' },
  },
};

export const F02_EXPECTED: FixtureExpectations = {
  staticGeometry: {
    effective_focal_length_mm: { value: 384, precision: 6 },
    focal_ratio: { value: 4.8, precision: 3 },
    diffraction_fwhm_arcsec: { value: 1.458, precision: 2 },
    image_scale_x_arcsec_per_px: { value: 1.0743, precision: 3 },
    field_of_view_x_deg: { value: 1.146, precision: 2 },
    field_of_view_y_deg: { value: 0.644, precision: 2 },
    effective_aperture_area_mm2: { value: 4523.9, precision: 0 },
    frame_size_bytes: { value: 16_588_800 },
  },
  sampling: {
    base_fwhm_arcsec: { value: 2.894, precision: 2 },
    pixels_per_fwhm: { value: 2.694, precision: 2 },
    classification: { value: 'well_sampled' },
  },
};

// --- helpers --------------------------------------------------------------

/** Build a normal-mode calculation request for a fixture document. */
export function fixtureRequest(
  design: DesignDocument,
  groups: CalculationGroup[] = ['all'],
): CalculationRequest {
  return {
    message_type: 'calculate_design',
    request_id: `req_${design.design_id}`,
    design_id: design.design_id,
    design_revision: design.revision,
    engine_version: design.calculation_engine_version,
    calculation_mode: 'normal',
    requested_groups: groups,
    design,
  };
}

export const FIXTURES = [
  { name: 'F01', document: F01_DOCUMENT, expected: F01_EXPECTED },
  { name: 'F02', document: F02_DOCUMENT, expected: F02_EXPECTED },
] as const;

// --- R2 fixtures F03–F07 (spec v0.7 §22; assertions are directional) -----

/** A compact R2 base design; overrides tailor it to each fixture. */
function r2Base(id: string, name: string): DesignDocument {
  return {
    schema_version: '1.0.0',
    calculation_engine_version: '1.0.0',
    design_id: id,
    revision: 1,
    metadata: {
      name,
      design_type: 'custom',
      locked: false,
      created_at: '2026-07-14T00:00:00Z',
      modified_at: '2026-07-14T00:00:00Z',
    },
    scenario: {
      mode: 'direct_horizontal_static',
      direct_horizontal: { altitude_deg: 60, azimuth_deg: 180 },
      conditions: { seeing_fwhm_arcsec: 2.5 },
    },
    target: {
      selection_type: 'custom',
      custom_target: {
        target_id: `${id}_target`,
        name: 'Target',
        coordinates: { right_ascension_deg: null, declination_deg: null, epoch: 'j2000' },
        geometry: { shape: 'ellipse', width_arcmin: 20, height_arcmin: 15, position_angle_deg: 0 },
        classification: { target_type: 'galaxy' },
      },
    },
    optics: {
      aperture_mm: 50,
      native_focal_length_mm: 250,
      reducer_multiplier: 1,
      extender_multiplier: 1,
      optical_blur: { representation: 'fwhm_arcsec', value: 2.0 },
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
    tracking: { enabled: true },
    capture: { exposure_s: 20 },
    constraints: [],
    extensions: {},
  };
}

/** F03 — tracking-limited (15″ p-p periodic @ 60 s + 4″ jitter, 20 s). */
export const F03_DOCUMENT: DesignDocument = (() => {
  const d = r2Base('design_f03_tracking', 'F03 Tracking-limited');
  d.tracking = {
    enabled: true,
    error_model: {
      periodic_error: {
        amplitude_arcsec: 15,
        amplitude_statistic: 'peak_to_peak',
        period_s: 60,
        direction: 'right_ascension',
      },
      tracking_jitter: { value: 4, statistic: 'rms', direction: 'isotropic' },
    },
    quality_thresholds: { maximum_motion_pixels: 1 },
  };
  return d;
})();

/** F04 — rotation-limited (alt-az, near zenith, low tracking error, 30 s). */
export const F04_DOCUMENT: DesignDocument = (() => {
  const d = r2Base('design_f04_rotation', 'F04 Rotation-limited');
  d.scenario = {
    mode: 'ephemeris_session',
    location: { latitude_deg: 41.5, longitude_deg: -87.5 },
    session: {
      start_time_utc: '2026-07-14T06:00:00Z',
      duration_s: 3600,
      sample_interval_s: 120,
      minimum_altitude_deg: 0,
    },
    conditions: { seeing_fwhm_arcsec: 2.0 },
  };
  d.target.custom_target!.coordinates = {
    right_ascension_deg: 90,
    declination_deg: 41.5,
    epoch: 'j2000',
  };
  d.mount = { architecture: 'alt_azimuth' };
  d.capture.exposure_s = 30;
  return d;
})();

/** F05 — readout-overhead limited (1 s exposure, 2 s overhead, 60 min). */
export const F05_DOCUMENT: DesignDocument = (() => {
  const d = r2Base('design_f05_overhead', 'F05 Overhead-limited');
  d.scenario.session = { start_time_utc: null, duration_s: 3600 };
  d.camera.readout = { readout_time_s: 2, transfer_time_s: 0 };
  d.tracking = { enabled: true, error_model: {} };
  d.capture = {
    exposure_s: 1,
    exposure_sweep: { enabled: true, minimum_exposure_s: 1, maximum_exposure_s: 60 },
  };
  return d;
})();

/** F06 — rejection-limited (30 s, high periodic sensitivity, low overhead). */
export const F06_DOCUMENT: DesignDocument = (() => {
  const d = r2Base('design_f06_rejection', 'F06 Rejection-limited');
  d.camera.readout = { readout_time_s: 0.1, transfer_time_s: 0 };
  d.tracking = {
    enabled: true,
    error_model: {
      periodic_error: {
        amplitude_arcsec: 12,
        amplitude_statistic: 'peak_to_peak',
        period_s: 40,
        direction: 'right_ascension',
      },
    },
    quality_thresholds: { maximum_motion_pixels: 1 },
  };
  d.capture = {
    exposure_s: 30,
    exposure_sweep: { enabled: true, minimum_exposure_s: 2, maximum_exposure_s: 60 },
  };
  return d;
})();

/** F07 — large-target framing failure (small sensor, long focal length). */
export const F07_DOCUMENT: DesignDocument = (() => {
  const d = r2Base('design_f07_framing', 'F07 Framing failure');
  d.optics.native_focal_length_mm = 2000;
  d.optics.image_circle_diameter_mm = 22;
  d.target.custom_target!.geometry = {
    shape: 'ellipse',
    width_arcmin: 180,
    height_arcmin: 120,
    position_angle_deg: 0,
  };
  return d;
})();

export const R2_FIXTURES = [
  F03_DOCUMENT,
  F04_DOCUMENT,
  F05_DOCUMENT,
  F06_DOCUMENT,
  F07_DOCUMENT,
] as const;

/** F08 — sensitivity / frame-yield (R3): full noise + session data so the
 * relative stacked-SNR and effective integration are real, not preliminary. */
export const F08_DOCUMENT: DesignDocument = (() => {
  const d = r2Base('design_f08_sensitivity', 'F08 Sensitivity');
  d.scenario.conditions = {
    seeing_fwhm_arcsec: 2.5,
    sky_brightness_mag_arcsec2: 19.5,
    extinction_mag_per_airmass: 0.15,
  };
  d.scenario.session = { start_time_utc: null, duration_s: 3600 };
  d.optics.aperture_mm = 60;
  d.optics.native_focal_length_mm = 300;
  d.optics.optical_transmission_fraction = 0.9;
  d.camera.noise = {
    effective_quantum_efficiency_fraction: 0.8,
    read_noise_e_rms: 2,
    dark_current_e_per_px_s: 0.02,
  };
  d.camera.readout = { readout_time_s: 1, transfer_time_s: 0 };
  d.tracking = {
    enabled: true,
    error_model: { drift_rate: { value_arcsec_per_min: 1, direction: 'right_ascension' } },
    quality_thresholds: { maximum_motion_pixels: 1 },
  };
  d.capture = {
    exposure_s: 20,
    stack_efficiency_fraction: 0.9,
    exposure_sweep: { enabled: true, minimum_exposure_s: 1, maximum_exposure_s: 60 },
  };
  return d;
})();
