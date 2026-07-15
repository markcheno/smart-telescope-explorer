/**
 * Design comparison contract (spec v0.8 §32; v0.9 §24 R3).
 *
 * Compares up to four designs on a normalised footing (typically the baseline's
 * target + scenario applied to every design, so the hardware is judged on the
 * same sky). Produces metric rows with a baseline delta and best/worst marking.
 * Locked commercial references (v0.8 §38) participate as designs with role
 * `reference`.
 */

import type { CalculationIssue } from './diagnostics.js';
import type { DesignDocument } from './document.js';

export const COMPARISON_ROLES = ['baseline', 'candidate', 'reference'] as const;
export type ComparisonRole = (typeof COMPARISON_ROLES)[number];

export const NORMALIZATION_MODES = [
  'none',
  'same_target',
  'same_scenario',
  'same_target_and_scenario',
  'same_exposure',
] as const;
export type NormalizationMode = (typeof NORMALIZATION_MODES)[number];

/** Maximum designs in a single comparison (v0.3 §K). */
export const MAX_COMPARISON_DESIGNS = 4;

export interface ComparisonDesignEntry {
  design: DesignDocument;
  role: ComparisonRole;
  label?: string;
}

export interface ComparisonRequest {
  message_type: 'compare_designs';
  request_id: string;
  designs: ComparisonDesignEntry[];
  /** Index into `designs` treated as the baseline for deltas. */
  baseline_index: number;
  normalization?: NormalizationMode;
}

/** Whether a higher or lower value is better, for best/worst marking. */
export const METRIC_DIRECTIONS = ['higher_better', 'lower_better', 'neutral'] as const;
export type MetricDirection = (typeof METRIC_DIRECTIONS)[number];

export interface ComparisonMetricCell {
  design_index: number;
  value: number | string | null;
  /** Delta versus the baseline cell (numeric metrics only). */
  baseline_delta?: number | null;
  is_best?: boolean;
  is_worst?: boolean;
}

export interface ComparisonMetricRow {
  metric: string;
  label: string;
  unit?: string;
  direction: MetricDirection;
  cells: ComparisonMetricCell[];
  /** False when the metric is not comparable across these designs (v0.8 §48.10). */
  comparison_valid: boolean;
}

export const COMPARISON_STATUSES = ['complete', 'partial', 'failed'] as const;
export type ComparisonStatus = (typeof COMPARISON_STATUSES)[number];

export interface ComparisonResponse {
  message_type: 'comparison_result';
  request_id: string;
  status: ComparisonStatus;
  baseline_index: number;
  normalization: NormalizationMode;
  design_labels: string[];
  rows: ComparisonMetricRow[];
  issues: CalculationIssue[];
}
