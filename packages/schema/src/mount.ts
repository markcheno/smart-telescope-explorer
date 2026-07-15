/**
 * Mount (spec v0.8 §14).
 *
 * Tracking errors live in the tracking schema, not here (v0.8 §14). A minimal
 * document requires only the architecture (v0.8 §19).
 */

import type { PresetReference, SourceMetadata } from './primitives.js';

export const MOUNT_ARCHITECTURES = ['alt_azimuth', 'german_equatorial', 'fork_equatorial'] as const;
export type MountArchitecture = (typeof MOUNT_ARCHITECTURES)[number];

export const MOUNT_MODEL_LEVELS = ['ideal', 'basic_performance'] as const;
export type MountModelLevel = (typeof MOUNT_MODEL_LEVELS)[number];

export const AZIMUTH_WRAP_MODES = ['continuous', 'limited', 'rewind_required', 'unknown'] as const;
export type AzimuthWrapMode = (typeof AZIMUTH_WRAP_MODES)[number];

export const MERIDIAN_BEHAVIORS = [
  'flip_required',
  'no_flip_required',
  'stop_tracking',
  'unknown',
] as const;
export type MeridianBehavior = (typeof MERIDIAN_BEHAVIORS)[number];

/** Null rate/acceleration means unknown, not unlimited (v0.8 §14 MountAxisLimits). */
export interface MountAxisLimits {
  axis_1_minimum_deg?: number | null;
  axis_1_maximum_deg?: number | null;
  axis_2_minimum_deg?: number | null;
  axis_2_maximum_deg?: number | null;
  axis_1_maximum_rate_deg_per_s?: number | null;
  axis_2_maximum_rate_deg_per_s?: number | null;
  axis_1_maximum_acceleration_deg_per_s2?: number | null;
  axis_2_maximum_acceleration_deg_per_s2?: number | null;
}

export interface AltAzMountConfiguration {
  minimum_altitude_deg?: number | null;
  maximum_altitude_deg?: number | null;
  zenith_avoidance_radius_deg?: number | null;
  azimuth_wrap_mode?: AzimuthWrapMode;
  camera_rotation_offset_deg?: number | null;
}

export interface EquatorialMountConfiguration {
  polar_alignment_altitude_error_arcmin?: number | null;
  polar_alignment_azimuth_error_arcmin?: number | null;
  meridian_limit_minutes?: number | null;
  meridian_behavior?: MeridianBehavior;
  flip_duration_s?: number | null;
  post_flip_settle_s?: number | null;
  camera_rotation_offset_deg?: number | null;
}

export interface BasicMountPerformance {
  pointing_accuracy_arcsec?: number | null;
  settling_time_s?: number | null;
  backlash_arcsec?: number | null;
  source?: SourceMetadata;
}

export interface MountInput {
  preset_reference?: PresetReference;
  architecture: MountArchitecture;
  model_level?: MountModelLevel;
  axis_limits?: MountAxisLimits;
  alt_azimuth?: AltAzMountConfiguration;
  equatorial?: EquatorialMountConfiguration;
  basic_performance?: BasicMountPerformance;
}
