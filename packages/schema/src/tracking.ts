/**
 * Tracking and automation (spec v0.8 §15).
 *
 * Separates the error components (jitter, drift, periodic, vibration) rather
 * than collapsing them into a single RMS — this is an explicit design risk
 * mitigation (v0.9 §27). A minimal document requires the tracking object to
 * exist, even if disabled (v0.8 §19).
 */

import type {
  AngularDirection,
  AngularErrorStatistic,
  AngularErrorValue,
  SourceMetadata,
  Uncertainty,
} from './primitives.js';

export const PHASE_POLICIES = [
  'known_phase',
  'sample_phases',
  'conservative',
  'worst_case',
] as const;
export type PhasePolicy = (typeof PHASE_POLICIES)[number];

export const PLATE_SOLVE_TRIGGER_MODES = [
  'initial_only',
  'fixed_frames',
  'fixed_time',
  'predicted_drift',
  'after_recenter',
  'custom',
  'disabled',
] as const;
export type PlateSolveTriggerMode = (typeof PLATE_SOLVE_TRIGGER_MODES)[number];

export const RECENTER_THRESHOLD_MODES = [
  'arcseconds',
  'pixels',
  'predicted_drift',
  'disabled',
] as const;
export type RecenterThresholdMode = (typeof RECENTER_THRESHOLD_MODES)[number];

export const DITHER_PATTERNS = ['random', 'spiral', 'fixed_sequence', 'unknown'] as const;
export type DitherPattern = (typeof DITHER_PATTERNS)[number];

export const EVALUATION_PERCENTILES = ['median', 'percentile_95', 'worst_case'] as const;
export type EvaluationPercentile = (typeof EVALUATION_PERCENTILES)[number];

/** v0.8 §15 AngularRateError — a linear rate such as drift (arcsec/min). */
export interface AngularRateError {
  value_arcsec_per_min: number | null;
  direction: AngularDirection;
  source?: SourceMetadata;
  uncertainty?: Uncertainty;
}

/** Amplitude is normally `peak` or `peak_to_peak` (v0.8 §15). */
export interface PeriodicErrorInput {
  amplitude_arcsec: number | null;
  amplitude_statistic: AngularErrorStatistic;
  period_s: number | null;
  direction: AngularDirection;
  phase_deg?: number | null;
  source?: SourceMetadata;
}

export interface VibrationInput {
  rms_arcsec: number | null;
  dominant_frequency_hz?: number | null;
  direction: AngularDirection;
  source?: SourceMetadata;
}

export interface TrackingErrorModel {
  tracking_jitter?: AngularErrorValue;
  drift_rate?: AngularRateError;
  periodic_error?: PeriodicErrorInput;
  vibration?: VibrationInput;
  registration_residual?: AngularErrorValue;
  phase_policy?: PhasePolicy;
}

export interface PlateSolvingInput {
  enabled: boolean;
  trigger_mode?: PlateSolveTriggerMode;
  interval_frames?: number | null;
  interval_s?: number | null;
  solve_duration_s?: number | null;
  accuracy_arcsec?: number | null;
  failure_probability?: number | null;
  initial_solve_required?: boolean;
}

export interface RecenteringInput {
  enabled: boolean;
  threshold_mode?: RecenterThresholdMode;
  threshold_arcsec?: number | null;
  threshold_pixels?: number | null;
  duration_s?: number | null;
  residual_error_arcsec?: number | null;
  settle_time_s?: number | null;
  failure_probability?: number | null;
}

export interface DitheringInput {
  enabled: boolean;
  interval_frames?: number | null;
  distance_arcsec?: number | null;
  distance_pixels?: number | null;
  pattern?: DitherPattern;
  move_duration_s?: number | null;
  settle_time_s?: number | null;
}

export interface TrackingQualityThresholds {
  maximum_motion_pixels?: number | null;
  maximum_elongation_ratio?: number | null;
  maximum_corner_rotation_pixels?: number | null;
  maximum_final_fwhm_pixels?: number | null;
  evaluation_percentile?: EvaluationPercentile;
}

export interface TrackingInput {
  enabled: boolean;
  error_model?: TrackingErrorModel;
  plate_solving?: PlateSolvingInput;
  recentering?: RecenteringInput;
  dithering?: DitheringInput;
  quality_thresholds?: TrackingQualityThresholds;
}
