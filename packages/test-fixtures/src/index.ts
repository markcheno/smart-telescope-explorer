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
