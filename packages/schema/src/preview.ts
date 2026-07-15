/**
 * Recommendation preview contract (spec v0.8 §28; v0.9 §39).
 *
 * A preview applies a recommendation's proposed changes to a clone, recomputes,
 * and reports the before/after of each key metric — its benefits, any
 * regressions, newly-violated constraints, and the next bottleneck — WITHOUT
 * committing to the design (v0.8 §48.7: previews use temporary operations).
 */

import type { ProposedChange } from './recommendations.js';

export const PREVIEW_STATUSES = [
  'valid',
  'no_change',
  'worse_overall',
  'constraint_conflict',
  'insufficient_confidence',
] as const;
export type PreviewStatus = (typeof PREVIEW_STATUSES)[number];

export interface PreviewMetricChange {
  metric: string;
  label: string;
  unit?: string;
  before: number | string | null;
  after: number | string | null;
  absolute_change?: number | null;
  percentage_change?: number | null;
  /** True when the change moves the metric in the beneficial direction. */
  improved: boolean;
}

export interface RecommendationPreview {
  recommendation_id: string;
  status: PreviewStatus;
  changes: ProposedChange[];
  /** Every compared metric that changed (benefits + regressions). */
  metric_changes: PreviewMetricChange[];
  benefits: PreviewMetricChange[];
  regressions: PreviewMetricChange[];
  /** Constraint ids that pass now fail after applying the change. */
  violated_constraints: string[];
  /** The dominant limitation after applying the change (a rule id / title), if any. */
  next_bottleneck: string | null;
}
