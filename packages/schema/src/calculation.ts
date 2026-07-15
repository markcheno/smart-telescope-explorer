/**
 * Calculation request and response (spec v0.8 §20–§21).
 *
 * The engine calculates only the requested groups, resolving prerequisites, and
 * returns a partial response that preserves valid independent groups when some
 * fail (v0.8 §21, §48.9). Old responses can never overwrite newer state — the
 * response carries design id, revision, engine and schema versions for matching
 * (v0.8 §48.8, §30).
 */

import type { DesignDocument } from './document.js';
import type { CalculationAssumption, CalculationIssue, FormulaRecord } from './diagnostics.js';
import type { Recommendation } from './recommendations.js';
import type { ResultGroups } from './results.js';
import type { SemVer } from './version.js';

export const CALCULATION_MODES = ['fast', 'normal', 'detailed'] as const;
export type CalculationMode = (typeof CALCULATION_MODES)[number];

export const CALCULATION_GROUPS = [
  'validation',
  'static_geometry',
  'target_framing',
  'sampling',
  'scenario_geometry',
  'mount_kinematics',
  'tracking',
  'blur',
  'field_rotation',
  'sensitivity',
  'exposure_sweep',
  'session',
  'stack_geometry',
  'constraints',
  'recommendations',
  'all',
] as const;
export type CalculationGroup = (typeof CALCULATION_GROUPS)[number];

export const CONSERVATIVE_POLICIES = [
  'median',
  'percentile_95',
  'worst_case',
  'design_threshold_setting',
] as const;
export type ConservativePolicy = (typeof CONSERVATIVE_POLICIES)[number];

export interface CalculationOptions {
  include_formula_records?: boolean;
  include_dependency_paths?: boolean;
  include_diagnostics?: boolean;
  retain_sample_paths?: boolean;
  phase_sample_count?: number | null;
  session_sample_interval_s?: number | null;
  conservative_policy?: ConservativePolicy;
}

/** Minimal context identifying a peer design during comparison calculations. */
export interface ComparisonContext {
  baseline_design_id?: string;
  normalization?: string;
}

export interface CalculationRequest {
  message_type: 'calculate_design';
  request_id: string;
  design_id: string;
  design_revision: number;
  engine_version: SemVer;
  calculation_mode: CalculationMode;
  requested_groups: CalculationGroup[];
  design: DesignDocument;
  comparison_context?: ComparisonContext;
  options?: CalculationOptions;
}

export const CALCULATION_RESPONSE_STATUSES = [
  'complete',
  'partial',
  'failed',
  'cancelled',
  'superseded',
] as const;
export type CalculationResponseStatus = (typeof CALCULATION_RESPONSE_STATUSES)[number];

/** Result of the validation group when requested (v0.8 §21). */
export interface ValidationSummary {
  ok: boolean;
  issue_ids: string[];
}

export interface CalculationResponse {
  message_type: 'calculation_result';
  request_id: string;
  design_id: string;
  design_revision: number;
  engine_version: SemVer;
  schema_version: SemVer;
  status: CalculationResponseStatus;
  /** ISO 8601 timestamps. */
  started_at: string;
  completed_at: string;
  calculated_groups: CalculationGroup[];
  stale_groups?: CalculationGroup[];
  validation?: ValidationSummary;
  results: ResultGroups;
  issues: CalculationIssue[];
  assumptions: CalculationAssumption[];
  formulas?: FormulaRecord[];
  recommendations?: Recommendation[];
  diagnostics?: Record<string, unknown>;
}
