/**
 * Capture and stacking (spec v0.8 §16).
 *
 * Exposure and capture settings are required for a minimal document (v0.8 §19).
 * The default near-optimal fraction for exposure sweeps is 0.98 (v0.8 §16).
 */

export const STACK_METHODS = [
  'mean',
  'weighted_mean',
  'median',
  'sigma_clipped_mean',
  'simplified_live_stack',
] as const;
export type StackMethod = (typeof STACK_METHODS)[number];

export const FRAME_REJECTION_MODES = ['quality_model', 'manual_fraction', 'none'] as const;
export type FrameRejectionMode = (typeof FRAME_REJECTION_MODES)[number];

export const REGISTRATION_CROP_MODES = [
  'common_intersection',
  'maximum_rectangle',
  'target_preserving',
  'none',
] as const;
export type RegistrationCropMode = (typeof REGISTRATION_CROP_MODES)[number];

export const SWEEP_CANDIDATE_MODES = [
  'default_candidates',
  'logarithmic',
  'linear',
  'explicit',
] as const;
export type SweepCandidateMode = (typeof SWEEP_CANDIDATE_MODES)[number];

/** Default near-optimal fraction for an exposure sweep (v0.8 §16). */
export const DEFAULT_NEAR_OPTIMAL_FRACTION = 0.98;

export interface FrameRejectionInput {
  enabled: boolean;
  mode?: FrameRejectionMode;
  use_tracking_thresholds?: boolean;
  environmental_loss_enabled?: boolean;
  manual_rejection_fraction?: number | null;
}

export interface RegistrationInput {
  translation_enabled?: boolean;
  rotation_enabled?: boolean;
  scale_enabled?: boolean;
  residual_error_arcsec?: number | null;
  interpolation_efficiency_fraction?: number | null;
  crop_mode?: RegistrationCropMode;
}

export interface ExposureSweepInput {
  enabled: boolean;
  minimum_exposure_s?: number | null;
  maximum_exposure_s?: number | null;
  candidate_mode?: SweepCandidateMode;
  explicit_candidates_s?: number[];
  sample_count?: number | null;
  near_optimal_fraction?: number | null;
  prefer_shorter_exposure?: boolean;
}

export interface CaptureOutputInput {
  retain_raw_frames?: boolean;
  retain_calibrated_frames?: boolean;
  preview_interval_frames?: number | null;
  stored_stack_bit_depth?: number | null;
}

export interface CaptureInput {
  exposure_s: number | null;
  stack_method?: StackMethod;
  total_session_override_s?: number | null;
  frame_rejection?: FrameRejectionInput;
  registration?: RegistrationInput;
  stack_efficiency_fraction?: number | null;
  exposure_sweep?: ExposureSweepInput;
  output?: CaptureOutputInput;
}
