/**
 * Standard result value and result groups (spec v0.8 §22–§23).
 *
 * Every engine output is a ResultValue carrying not just a number but its
 * status, unit, confidence, dependencies, assumptions, and formula id
 * (v0.8 §48.16). The UI reads these straight off the result and never
 * recomputes them (ADR 0002).
 *
 * Result-group shapes for R0 static geometry, target framing, and sampling
 * (the F01/F02 fixtures) are concrete; groups first exercised in R2+ (tracking,
 * blur, rotation, sensitivity, exposure, session, stack) are shaped to the spec
 * but expected to gain detail as those calculations land.
 */

import type { MountArchitecture } from './mount.js';
import type { ConfidenceLevel } from './primitives.js';
import type { SemVer } from './version.js';

// --- result envelope ------------------------------------------------------

export const RESULT_STATUSES = [
  'valid',
  'marginal',
  'poor',
  'invalid',
  'unavailable',
  'stale',
] as const;
export type ResultStatus = (typeof RESULT_STATUSES)[number];

export const DISPLAY_PRECISION_MODES = [
  'decimal_places',
  'significant_figures',
  'range',
  'approximate',
  'integer',
] as const;
export type DisplayPrecisionMode = (typeof DISPLAY_PRECISION_MODES)[number];

export interface DisplayPrecision {
  mode: DisplayPrecisionMode;
  /** Number of decimal places or significant figures, where applicable. */
  digits?: number | null;
}

export interface ResultConfidence {
  level: ConfidenceLevel;
  /** Optional 0..1 internal score behind `level`. */
  internal_score?: number | null;
  /** JSON Pointer to the dependency that limits confidence. */
  limiting_dependency?: string | null;
  sensitivity_warning?: boolean;
}

export interface ResultUncertainty {
  minimum?: number | null;
  maximum?: number | null;
  plus_minus?: number | null;
  confidence_interval?: number | null;
}

/**
 * v0.8 §22 ResultValue. `value` is `null` when unknown/unavailable (v0.8 §2.4);
 * `V` widens to `string`/`boolean` for categorical results (fit status,
 * classification). The unit is named explicitly rather than by field name because
 * results are addressed generically by the UI.
 */
export interface ResultValue<V = number> {
  status: ResultStatus;
  value: V | null;
  unit?: string | null;
  display_precision?: DisplayPrecision;
  confidence?: ResultConfidence;
  uncertainty?: ResultUncertainty;
  /** JSON Pointer input paths this result depends on (v0.8 §3). */
  dependencies?: string[];
  assumption_ids?: string[];
  issue_ids?: string[];
  formula_id?: string | null;
}

// --- result groups (v0.8 §23) --------------------------------------------

export interface StaticGeometryResults {
  effective_focal_length_mm: ResultValue;
  focal_ratio: ResultValue;
  clear_aperture_area_mm2: ResultValue;
  effective_aperture_area_mm2: ResultValue;
  diffraction_fwhm_arcsec: ResultValue;
  image_scale_x_arcsec_per_px: ResultValue;
  image_scale_y_arcsec_per_px: ResultValue;
  field_of_view_x_deg: ResultValue;
  field_of_view_y_deg: ResultValue;
  active_sensor_width_mm: ResultValue;
  active_sensor_height_mm: ResultValue;
  frame_size_bytes: ResultValue;
}

export const FIT_STATUSES = ['does_not_fit', 'tight', 'good', 'excess_field', 'unknown'] as const;
export type FitStatus = (typeof FIT_STATUSES)[number];

export interface TargetFramingResults {
  target_width_px: ResultValue;
  target_height_px: ResultValue;
  margin_x_fraction: ResultValue;
  margin_y_fraction: ResultValue;
  minimum_margin_fraction: ResultValue;
  fit_status: ResultValue<FitStatus>;
  image_circle_coverage_fraction: ResultValue;
  core_fit_status: ResultValue<FitStatus>;
  halo_fit_status: ResultValue<FitStatus>;
}

export const SAMPLING_CLASSIFICATIONS = [
  'severely_undersampled',
  'moderately_undersampled',
  'well_sampled',
  'oversampled',
  'severely_oversampled',
  'unknown',
] as const;
export type SamplingClassification = (typeof SAMPLING_CLASSIFICATIONS)[number];

export interface SamplingResults {
  seeing_fwhm_arcsec: ResultValue;
  diffraction_fwhm_arcsec: ResultValue;
  optical_fwhm_arcsec: ResultValue;
  base_fwhm_arcsec: ResultValue;
  base_fwhm_px: ResultValue;
  pixels_per_fwhm: ResultValue;
  classification: ResultValue<SamplingClassification>;
}

// --- scenario geometry (R2, v0.8 §23) ------------------------------------

export interface ScenarioGeometryResults {
  sample_count: ResultValue;
  /** Altitude at the session reference sample (midpoint), or the direct altitude. */
  reference_altitude_deg: ResultValue;
  max_altitude_deg: ResultValue;
  min_altitude_deg: ResultValue;
  reference_airmass: ResultValue;
  visible_duration_s: ResultValue;
  below_minimum_duration_s: ResultValue;
}

// --- mount kinematics (R2, v0.8 §23) -------------------------------------

export interface MountKinematicResults {
  architecture: ResultValue<MountArchitecture>;
  max_axis1_rate_deg_per_s: ResultValue;
  max_axis2_rate_deg_per_s: ResultValue;
  max_axis1_accel_deg_per_s2: ResultValue;
  max_axis2_accel_deg_per_s2: ResultValue;
  zenith_risk: ResultValue<boolean>;
  /** Time offset (s) of the meridian crossing for equatorial mounts. */
  meridian_crossing_s: ResultValue;
  max_condition_number: ResultValue;
}

// --- tracking (R2, v0.8 §23) ---------------------------------------------

export const TRACKING_QUALITIES = ['good', 'marginal', 'poor', 'unknown'] as const;
export type TrackingQuality = (typeof TRACKING_QUALITIES)[number];

export interface TrackingResults {
  exposure_s: ResultValue;
  /** Number of periodic phases evaluated (1 when the phase is known). */
  phase_count: ResultValue;
  /** Selected-policy maximum on-sky excursion during the exposure. */
  motion_max_displacement_arcsec: ResultValue;
  motion_rms_displacement_arcsec: ResultValue;
  motion_max_displacement_px: ResultValue;
  motion_fwhm_arcsec: ResultValue;
  median_max_displacement_arcsec: ResultValue;
  p95_max_displacement_arcsec: ResultValue;
  worst_max_displacement_arcsec: ResultValue;
  dominant_component: ResultValue<string>;
  quality: ResultValue<TrackingQuality>;
}

// --- blur (R2, v0.8 §23) -------------------------------------------------

export const BLUR_QUALITIES = ['good', 'marginal', 'poor', 'unknown'] as const;
export type BlurQuality = (typeof BLUR_QUALITIES)[number];

export interface BlurResults {
  base_fwhm_arcsec: ResultValue;
  motion_fwhm_arcsec: ResultValue;
  rotation_fwhm_arcsec: ResultValue;
  pixel_fwhm_arcsec: ResultValue;
  major_fwhm_arcsec: ResultValue;
  minor_fwhm_arcsec: ResultValue;
  major_fwhm_px: ResultValue;
  minor_fwhm_px: ResultValue;
  elongation: ResultValue;
  axis_angle_deg: ResultValue;
  dominant_contribution: ResultValue<string>;
  quality: ResultValue<BlurQuality>;
}

// --- field rotation (R2, v0.8 §23) ---------------------------------------

export interface FieldRotationResults {
  rotation_rate_deg_per_hr: ResultValue;
  /** Field rotation across a single exposure. */
  delta_rotation_deg: ResultValue;
  /** Center motion is always zero for pure field rotation (v0.4 §20). */
  center_motion_px: ResultValue;
  corner_motion_px: ResultValue;
  corner_motion_arcsec: ResultValue;
  /** Exposure (s) at which corner rotation reaches the threshold, at the reference. */
  rotation_exposure_limit_s: ResultValue;
  /** Worst-case exposure limit across the session (fastest rotation). */
  session_min_exposure_limit_s: ResultValue;
  quality: ResultValue<BlurQuality>;
}

// Groups below gain field-level detail as their calculations land. They are
// keyed generically so partial responses and the results map stay typed.
export interface SensitivityResults {
  [key: string]: ResultValue | ResultValue[] | undefined;
}
export interface ExposureSweepResults {
  [key: string]: ResultValue | ResultValue[] | undefined;
}
export interface SessionResults {
  [key: string]: ResultValue | ResultValue[] | undefined;
}
export interface StackGeometryResults {
  [key: string]: ResultValue | ResultValue[] | undefined;
}

export const CONSTRAINT_STATUSES = ['pass', 'marginal', 'fail', 'unknown'] as const;
export type ConstraintStatus = (typeof CONSTRAINT_STATUSES)[number];

export interface ConstraintEvaluation {
  constraint_id: string;
  status: ConstraintStatus;
  actual: number | string | null;
  threshold: number | string | readonly [number, number] | null;
  unit?: string | null;
  difference?: number | null;
  issue_id?: string | null;
}

/**
 * The addressable set of calculated groups. Each is optional so a partial
 * response can carry only the groups that succeeded (v0.8 §21).
 */
export interface ResultGroups {
  static_geometry?: StaticGeometryResults;
  target_framing?: TargetFramingResults;
  sampling?: SamplingResults;
  scenario_geometry?: ScenarioGeometryResults;
  mount_kinematics?: MountKinematicResults;
  tracking?: TrackingResults;
  blur?: BlurResults;
  field_rotation?: FieldRotationResults;
  sensitivity?: SensitivityResults;
  exposure_sweep?: ExposureSweepResults;
  session?: SessionResults;
  stack_geometry?: StackGeometryResults;
  constraints?: ConstraintEvaluation[];
}

/**
 * Informational, non-authoritative copy of results embedded in a saved document
 * (v0.8 §6). Recalculated after loading; never trusted as input.
 */
export interface ResultSnapshot {
  engine_version: SemVer;
  schema_version: SemVer;
  /** ISO 8601 timestamp of when the snapshot was taken. */
  calculated_at: string;
  design_revision: number;
  results?: ResultGroups;
}
