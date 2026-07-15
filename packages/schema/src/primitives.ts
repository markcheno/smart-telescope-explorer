/**
 * @ste/schema — common primitive records (spec v0.8 §5).
 *
 * These are the reusable building blocks referenced throughout the design
 * document and calculation contracts: provenance, confidence, scalar values,
 * uncertainty, angular errors, and preset references.
 *
 * Persistence rules (v0.8 §2):
 *   - JSON-compatible only: no classes, functions, Dates, maps/sets, cycles.
 *   - The field NAME defines the unit (v0.8 §5 ScalarValue). Values are plain
 *     numbers in the canonical persisted unit (mm, µm, deg, arcsec, s, …).
 *   - Nullability is explicit (v0.8 §2.4): a field may be omitted (not part of
 *     the object), `null` (unknown), or `0` (an actual zero). Optional `?`
 *     encodes "may be omitted"; `| null` encodes "may be unknown".
 *
 * Enums are declared as `const` tuples so downstream validation can iterate the
 * allowed values at runtime, with the string-literal union derived from them.
 */

// --- provenance & confidence ---------------------------------------------

export const SOURCE_TYPES = [
  'published',
  'measured',
  'estimated',
  'assumed',
  'derived',
  'user_entered',
  'catalog',
  'manufacturer_claim',
  'unknown',
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const CONFIDENCE_LEVELS = ['high', 'moderate', 'low', 'unknown'] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

/** v0.8 §5 SourceMetadata — provenance carried alongside a value or record. */
export interface SourceMetadata {
  source_type: SourceType;
  confidence: ConfidenceLevel;
  source_label?: string;
  source_url?: string;
  source_note?: string;
  /** ISO 8601 timestamp; `null` if never reviewed. */
  reviewed_at?: string | null;
  user_overridden?: boolean;
  /** Links this value to a returned CalculationAssumption. */
  assumption_id?: string | null;
}

// --- uncertainty ----------------------------------------------------------

export const UNCERTAINTY_KINDS = [
  'absolute',
  'range',
  'percentage',
  'standard_deviation',
  'unknown',
] as const;
export type UncertaintyKind = (typeof UNCERTAINTY_KINDS)[number];

/** v0.8 §5 Uncertainty. Units follow the value the uncertainty is attached to. */
export interface Uncertainty {
  kind: UncertaintyKind;
  plus_minus?: number | null;
  minimum?: number | null;
  maximum?: number | null;
  /** e.g. 0.95 for a 95% interval. */
  confidence_interval?: number | null;
}

// --- scalar value ---------------------------------------------------------

/**
 * v0.8 §5 ScalarValue. The field name that holds a ScalarValue defines the unit
 * (e.g. `focal_length_mm`), so no unit is stored on the record itself.
 */
export interface ScalarValue {
  /** `null` means unknown (v0.8 §2.4). */
  value: number | null;
  source?: SourceMetadata;
  uncertainty?: Uncertainty;
}

// --- angular error --------------------------------------------------------

export const ANGULAR_ERROR_STATISTICS = [
  'rms',
  'one_sigma',
  'peak',
  'peak_to_peak',
  'maximum_absolute',
  'median',
  'percentile_95',
  'rate',
  'unknown',
] as const;
export type AngularErrorStatistic = (typeof ANGULAR_ERROR_STATISTICS)[number];

export const ANGULAR_DIRECTIONS = [
  'isotropic',
  'axis_1',
  'axis_2',
  'right_ascension',
  'declination',
  'altitude',
  'azimuth',
  'image_x',
  'image_y',
  'custom',
  'unknown',
] as const;
export type AngularDirection = (typeof ANGULAR_DIRECTIONS)[number];

/**
 * v0.8 §5 AngularErrorValue. Angular errors must always specify their statistic
 * (acceptance criterion §48.4) so an RMS is never confused with a peak.
 * `value` is in arcseconds (or arcsec/min when `statistic` is `rate`).
 */
export interface AngularErrorValue {
  value: number | null;
  statistic: AngularErrorStatistic;
  direction: AngularDirection;
  source?: SourceMetadata;
  uncertainty?: Uncertainty;
}

// --- preset reference -----------------------------------------------------

/** v0.8 §5 PresetReference — links a section to the catalog record it came from. */
export interface PresetReference {
  preset_id: string;
  preset_version: string;
  catalog_version: string;
  /** ISO 8601 timestamp of when the preset was applied. */
  applied_at: string;
}
