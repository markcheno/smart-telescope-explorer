/**
 * Constraint evaluation (spec v0.4 §37; v0.8 §17, §23).
 *
 * Resolves each enabled {@link DesignConstraint}'s metric to a computed value,
 * applies the operator against the threshold, and returns a
 * {@link ConstraintEvaluation} (pass / marginal / fail / unknown). A hard
 * constraint that is not satisfied fails; a soft one is marginal. Feeds the
 * results rail and the recommendation engine.
 */

import type {
  ConstraintEvaluation,
  ConstraintOperator,
  ConstraintStatus,
  DesignConstraint,
  DesignDocument,
  ResultGroups,
  ResultValue,
} from '@ste/schema';

/** Within this fraction of the boundary, a satisfied numeric constraint is marginal. */
const MARGINAL_FRACTION = 0.05;

const numAt = (results: ResultGroups, group: keyof ResultGroups, key: string): number | null => {
  const g = results[group] as Record<string, ResultValue<unknown>> | undefined;
  const v = g?.[key]?.value;
  return typeof v === 'number' ? v : null;
};
const strAt = (results: ResultGroups, group: keyof ResultGroups, key: string): string | null => {
  const g = results[group] as Record<string, ResultValue<unknown>> | undefined;
  const v = g?.[key]?.value;
  return typeof v === 'string' ? v : null;
};

/** Map a stable constraint metric id to its computed value (v0.8 §17 metrics). */
function resolveMetric(
  metric: string,
  doc: DesignDocument,
  results: ResultGroups,
): number | string | null {
  switch (metric) {
    case 'maximum_tracking_motion':
      return numAt(results, 'tracking', 'motion_max_displacement_px');
    case 'maximum_elongation':
      return numAt(results, 'blur', 'elongation');
    case 'maximum_corner_rotation':
      return numAt(results, 'field_rotation', 'corner_motion_px');
    case 'minimum_acceptance':
      return numAt(results, 'session', 'acceptance_fraction');
    case 'minimum_integration':
      return numAt(results, 'session', 'effective_integration_s');
    case 'minimum_target_margin':
      return numAt(results, 'target_framing', 'minimum_margin_fraction');
    case 'maximum_exposure':
    case 'minimum_exposure':
      return doc.capture.exposure_s;
    case 'target_must_fit':
      return strAt(results, 'target_framing', 'fit_status');
    case 'mount_architecture':
      return doc.mount.architecture;
    default:
      return null;
  }
}

function compareNumeric(
  actual: number,
  operator: ConstraintOperator,
  threshold: DesignConstraint['threshold'],
): { satisfied: boolean; boundary: number | null } | null {
  if (operator === 'between') {
    if (!Array.isArray(threshold)) return null;
    const [min, max] = threshold;
    const nearest = Math.abs(actual - min) < Math.abs(actual - max) ? min : max;
    return { satisfied: actual >= min && actual <= max, boundary: nearest };
  }
  if (typeof threshold !== 'number') return null;
  switch (operator) {
    case 'less_than':
      return { satisfied: actual < threshold, boundary: threshold };
    case 'less_than_or_equal':
      return { satisfied: actual <= threshold, boundary: threshold };
    case 'greater_than':
      return { satisfied: actual > threshold, boundary: threshold };
    case 'greater_than_or_equal':
      return { satisfied: actual >= threshold, boundary: threshold };
    case 'equal':
      return { satisfied: actual === threshold, boundary: threshold };
    default:
      return null;
  }
}

function statusFor(
  satisfied: boolean,
  severity: DesignConstraint['severity'],
  marginal: boolean,
): ConstraintStatus {
  if (!satisfied) return severity === 'soft' ? 'marginal' : 'fail';
  return marginal ? 'marginal' : 'pass';
}

function evaluateOne(
  constraint: DesignConstraint,
  doc: DesignDocument,
  results: ResultGroups,
): ConstraintEvaluation {
  const actual = resolveMetric(constraint.metric, doc, results);
  const base: ConstraintEvaluation = {
    constraint_id: constraint.constraint_id,
    status: 'unknown',
    actual,
    threshold: constraint.threshold,
    ...(constraint.unit != null ? { unit: constraint.unit } : {}),
  };
  if (actual == null || constraint.threshold == null) return base;

  // Categorical constraints (fit, architecture).
  if (typeof actual === 'string') {
    let satisfied: boolean;
    if (constraint.operator === 'fits') {
      satisfied = actual !== 'does_not_fit';
    } else if (constraint.operator === 'equal' || constraint.operator === 'contains') {
      satisfied = String(constraint.threshold) === actual;
    } else {
      return base;
    }
    return { ...base, status: statusFor(satisfied, constraint.severity, false) };
  }

  const cmp = compareNumeric(actual, constraint.operator, constraint.threshold);
  if (cmp == null) return base;
  const marginal =
    cmp.boundary != null &&
    cmp.boundary !== 0 &&
    Math.abs(actual - cmp.boundary) / Math.abs(cmp.boundary) <= MARGINAL_FRACTION;
  return {
    ...base,
    status: statusFor(cmp.satisfied, constraint.severity, marginal),
    ...(cmp.boundary != null ? { difference: actual - cmp.boundary } : {}),
  };
}

/** Evaluate every enabled constraint against the computed results (v0.4 §37). */
export function evaluateConstraints(
  doc: DesignDocument,
  results: ResultGroups,
): ConstraintEvaluation[] {
  return doc.constraints.filter((c) => c.enabled).map((c) => evaluateOne(c, doc, results));
}
