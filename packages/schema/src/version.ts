/**
 * Schema and calculation-engine versions (spec v0.8 §4).
 *
 * - `schema_version` — major changes alter meaning or require migration; minor
 *   is additive; patch is clarification.
 * - `calculation_engine_version` — changes when calculation behaviour changes
 *   without a schema change.
 */

export const SCHEMA_VERSION = '1.0.0';
export const CALCULATION_ENGINE_VERSION = '1.0.0';

/** Semantic version string, e.g. `"1.0.0"`. */
export type SemVer = string;
