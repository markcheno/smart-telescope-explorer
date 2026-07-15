/**
 * Observing scenario (spec v0.8 §9).
 *
 * Describes where/when the design is observed and the atmospheric conditions.
 * Only seeing is required for MVP geometry/sampling (v0.8 §9 ScenarioConditions).
 */

export const SCENARIO_MODES = [
  'ephemeris_session',
  'direct_horizontal_static',
  'direct_horizontal_session',
] as const;
export type ScenarioMode = (typeof SCENARIO_MODES)[number];

export const PRIVACY_PRECISIONS = [
  'exact',
  'rounded_1_degree',
  'latitude_only',
  'removed',
] as const;
export type PrivacyPrecision = (typeof PRIVACY_PRECISIONS)[number];

export interface ScenarioLocation {
  latitude_deg: number | null;
  longitude_deg: number | null;
  elevation_m?: number | null;
  /** IANA timezone identifier, e.g. `"America/Chicago"`. */
  timezone?: string | null;
  display_name?: string;
  privacy_precision?: PrivacyPrecision;
}

export interface ScenarioSession {
  /** ISO 8601 UTC start instant. */
  start_time_utc: string | null;
  duration_s: number | null;
  sample_interval_s?: number | null;
  minimum_altitude_deg?: number | null;
}

/**
 * Direct altitude/azimuth pointing. Static mode without rates supports only
 * single-position calculations (v0.8 §9 DirectHorizontalInput).
 */
export interface DirectHorizontalInput {
  altitude_deg: number | null;
  azimuth_deg: number | null;
  altitude_rate_deg_per_hour?: number | null;
  azimuth_rate_deg_per_hour?: number | null;
  field_rotation_rate_deg_per_hour?: number | null;
}

export interface ScenarioConditions {
  /** Required for MVP geometry/sampling. */
  seeing_fwhm_arcsec: number | null;
  sky_brightness_mag_arcsec2?: number | null;
  transparency_fraction?: number | null;
  extinction_mag_per_airmass?: number | null;
  moon_brightness_adjustment_mag?: number | null;
  temperature_start_c?: number | null;
  temperature_end_c?: number | null;
  relative_humidity_fraction?: number | null;
  wind_speed_m_s?: number | null;
  environmental_frame_loss_fraction?: number | null;
  horizon_obstruction_loss_fraction?: number | null;
}

export interface ScenarioInput {
  mode: ScenarioMode;
  location?: ScenarioLocation;
  session?: ScenarioSession;
  direct_horizontal?: DirectHorizontalInput;
  conditions: ScenarioConditions;
}
