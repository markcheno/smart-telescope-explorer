/**
 * Recommendations (spec v0.8 §27).
 *
 * Recommendations specify required characteristics before specific products
 * (v0.3 §1) and are prioritised: impossible conditions, then intra-frame damage,
 * then lost integration, then practicality, then optional improvements (v0.3 §5).
 * Material recommendation assumptions must be returned (v0.8 §25).
 */

import type { ConfidenceLevel } from './primitives.js';

export const RECOMMENDATION_CATEGORIES = [
  'framing',
  'sampling',
  'tracking',
  'rotation',
  'exposure',
  'stacking',
  'sensitivity',
  'mount',
  'camera',
  'filter',
  'session',
  'practicality',
] as const;
export type RecommendationCategory = (typeof RECOMMENDATION_CATEGORIES)[number];

export const RECOMMENDATION_SEVERITIES = [
  'critical',
  'high_value',
  'optional',
  'low_value',
  'counterproductive_warning',
] as const;
export type RecommendationSeverity = (typeof RECOMMENDATION_SEVERITIES)[number];

export const RECOMMENDATION_STATUSES = [
  'active',
  'previewed',
  'applied',
  'dismissed',
  'suppressed',
] as const;
export type RecommendationStatus = (typeof RECOMMENDATION_STATUSES)[number];

export const PROPOSED_CHANGE_KINDS = [
  'replace',
  'add',
  'remove',
  'select_preset',
  'set_range',
  'change_mode',
] as const;
export type ProposedChangeKind = (typeof PROPOSED_CHANGE_KINDS)[number];

export interface RecommendationEvidence {
  metric: string;
  current: number | string | null;
  threshold?: number | string | readonly [number, number] | null;
  unit?: string | null;
  result_path?: string;
  explanation?: string;
}

export interface ProposedChange {
  kind: ProposedChangeKind;
  /** JSON Pointer to the field the change targets. */
  field_path: string;
  current_value?: number | string | boolean | null;
  proposed_value?: number | string | boolean | readonly [number, number] | null;
  unit?: string | null;
}

export interface ExpectedBenefit {
  metric: string;
  before: number | string | null;
  after: number | string | null;
  absolute_change?: number | null;
  percentage_change?: number | null;
  unit?: string | null;
  confidence?: ConfidenceLevel;
}

export interface Recommendation {
  recommendation_id: string;
  rule_id: string;
  category: RecommendationCategory;
  severity: RecommendationSeverity;
  status: RecommendationStatus;
  title: string;
  problem: string;
  evidence?: RecommendationEvidence[];
  proposed_changes?: ProposedChange[];
  expected_benefits?: ExpectedBenefit[];
  tradeoffs?: string[];
  next_bottleneck?: string | null;
  confidence?: ConfidenceLevel;
  affected_constraints?: string[];
  assumption_ids?: string[];
  suppression_reason?: string | null;
}
