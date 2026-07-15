/**
 * Filter (spec v0.8 §13).
 *
 * R1 treats filters qualitatively (target compatibility only, v0.9 §24 R1-014);
 * passband detail supports later sensitivity work.
 */

import type { PresetReference } from './primitives.js';

export const FILTER_TYPES = [
  'none',
  'uv_ir_cut',
  'broadband_light_pollution',
  'dual_band',
  'h_alpha',
  'oiii',
  'custom',
  'unknown',
] as const;
export type FilterType = (typeof FILTER_TYPES)[number];

export interface FilterPassband {
  center_wavelength_nm: number | null;
  bandwidth_nm: number | null;
  peak_transmission_fraction?: number | null;
  average_transmission_fraction?: number | null;
  target_weight_fraction?: number | null;
  sky_weight_fraction?: number | null;
}

export interface FilterInput {
  preset_reference?: PresetReference;
  filter_type: FilterType;
  name?: string;
  passbands?: FilterPassband[];
  broadband_transmission_fraction?: number | null;
  emission_transmission_fraction?: number | null;
  sky_transmission_fraction?: number | null;
}
