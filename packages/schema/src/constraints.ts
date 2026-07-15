/**
 * Design constraints (spec v0.8 §17).
 *
 * User-defined pass/fail conditions evaluated against results. The constraints
 * array is required (may be empty) for a minimal document (v0.8 §19).
 */

export const CONSTRAINT_SEVERITIES = ['hard', 'soft'] as const;
export type ConstraintSeverity = (typeof CONSTRAINT_SEVERITIES)[number];

export const CONSTRAINT_OPERATORS = [
  'less_than',
  'less_than_or_equal',
  'greater_than',
  'greater_than_or_equal',
  'equal',
  'between',
  'contains',
  'fits',
] as const;
export type ConstraintOperator = (typeof CONSTRAINT_OPERATORS)[number];

export const CONSTRAINT_SCOPES = [
  'current_target',
  'all_targets',
  'current_session',
  'design_general',
] as const;
export type ConstraintScope = (typeof CONSTRAINT_SCOPES)[number];

/**
 * `threshold` is a single value for most operators; for `between` it is a
 * [min, max] tuple; for `contains`/`fits`/enum-style metrics it may be a string.
 */
export type ConstraintThreshold = number | string | readonly [number, number];

export interface DesignConstraint {
  constraint_id: string;
  enabled: boolean;
  severity: ConstraintSeverity;
  /** Stable metric identifier (e.g. `maximum_tracking_motion`, `target_must_fit`). */
  metric: string;
  operator: ConstraintOperator;
  threshold: ConstraintThreshold | null;
  unit?: string | null;
  scope?: ConstraintScope;
  note?: string;
}
