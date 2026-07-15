/**
 * Optics (spec v0.8 §11).
 *
 * Required for a minimal document: aperture, native focal length,
 * reducer/extender multipliers, and an optical-blur representation (v0.8 §11).
 */

import type { PresetReference } from './primitives.js';

export const OPTICAL_BLUR_REPRESENTATIONS = [
  'fwhm_arcsec',
  'spot_diameter_um',
  'quality_preset',
  'unknown',
] as const;
export type OpticalBlurRepresentation = (typeof OPTICAL_BLUR_REPRESENTATIONS)[number];

export const OPTICAL_BLUR_STATISTICS = [
  'fwhm',
  'rms_radius',
  'rms_diameter',
  'geometric_diameter',
  'unknown',
] as const;
export type OpticalBlurStatistic = (typeof OPTICAL_BLUR_STATISTICS)[number];

export const OPTICAL_QUALITY_PRESETS = [
  'excellent',
  'good',
  'typical_inexpensive_lens',
  'poor_edge_performance',
  'unknown',
] as const;
export type OpticalQualityPreset = (typeof OPTICAL_QUALITY_PRESETS)[number];

export const FIELD_POSITIONS = [
  'center',
  'mid_field',
  'corner',
  'field_average',
  'unknown',
] as const;
export type FieldPosition = (typeof FIELD_POSITIONS)[number];

export const VIGNETTING_MODELS = [
  'none',
  'center_corner_linear',
  'radial_samples',
  'unknown',
] as const;
export type VignettingModel = (typeof VIGNETTING_MODELS)[number];

/**
 * Optical blur representation (v0.8 §11 OpticalBlurInput). `value` is
 * interpreted per `representation`: arcsec (fwhm_arcsec) or µm (spot_diameter_um);
 * for `quality_preset` the `preset_class` carries the meaning and `value` is null.
 */
export interface OpticalBlurInput {
  representation: OpticalBlurRepresentation;
  value?: number | null;
  statistic?: OpticalBlurStatistic;
  preset_class?: OpticalQualityPreset;
  field_position?: FieldPosition;
}

export interface VignettingInput {
  model: VignettingModel;
  center_transmission_fraction?: number | null;
  corner_transmission_fraction?: number | null;
  /** [radius_fraction, transmission_fraction] pairs for the radial model. */
  radial_samples?: ReadonlyArray<readonly [number, number]>;
}

export interface OpticsInput {
  preset_reference?: PresetReference;
  aperture_mm: number | null;
  native_focal_length_mm: number | null;
  reducer_multiplier: number | null;
  extender_multiplier: number | null;
  central_obstruction_mm?: number | null;
  optical_transmission_fraction?: number | null;
  image_circle_diameter_mm?: number | null;
  reference_wavelength_nm?: number | null;
  optical_blur: OpticalBlurInput;
  vignetting?: VignettingInput;
}
