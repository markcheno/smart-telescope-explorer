/**
 * Camera and sensor (spec v0.8 §12).
 *
 * Noise fields are all optional for geometry-only calculations (v0.8 §12
 * SensorNoiseInput). Sensor width/height/pixels/pitch are required for a minimal
 * document (v0.8 §19).
 */

import type { PresetReference } from './primitives.js';

export const COLOR_MODES = ['color', 'monochrome', 'unknown'] as const;
export type ColorMode = (typeof COLOR_MODES)[number];

export const BAYER_PATTERNS = ['rggb', 'bggr', 'grbg', 'gbrg', 'none', 'unknown'] as const;
export type BayerPattern = (typeof BAYER_PATTERNS)[number];

export const GAIN_MODES = ['low', 'medium', 'high', 'custom', 'unknown'] as const;
export type GainMode = (typeof GAIN_MODES)[number];

export interface SensorInput {
  sensor_width_mm: number | null;
  sensor_height_mm: number | null;
  horizontal_pixels: number | null;
  vertical_pixels: number | null;
  pixel_pitch_x_um: number | null;
  pixel_pitch_y_um: number | null;
  color_mode?: ColorMode;
  bayer_pattern?: BayerPattern;
  active_area_fraction?: number | null;
}

/** All fields optional — only needed for sensitivity, not geometry (v0.8 §12). */
export interface SensorNoiseInput {
  effective_quantum_efficiency_fraction?: number | null;
  read_noise_e_rms?: number | null;
  dark_current_e_per_px_s?: number | null;
  full_well_e?: number | null;
  adc_bit_depth?: number | null;
  conversion_gain_e_per_adu?: number | null;
  fixed_pattern_noise_fraction?: number | null;
  sensor_temperature_c?: number | null;
}

export interface CameraReadoutInput {
  stored_bit_depth?: number | null;
  readout_time_s?: number | null;
  transfer_time_s?: number | null;
  raw_frame_retained?: boolean;
  compression_ratio?: number | null;
}

export interface CameraOperatingMode {
  binning_x?: number | null;
  binning_y?: number | null;
  roi_x?: number | null;
  roi_y?: number | null;
  roi_width?: number | null;
  roi_height?: number | null;
  gain_mode?: GainMode;
  gain_value?: number | null;
}

export interface CameraInput {
  preset_reference?: PresetReference;
  camera_name?: string;
  sensor: SensorInput;
  noise?: SensorNoiseInput;
  readout?: CameraReadoutInput;
  operating_mode?: CameraOperatingMode;
}
