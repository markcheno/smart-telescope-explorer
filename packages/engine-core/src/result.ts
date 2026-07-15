/**
 * Result and confidence helpers (spec v0.9 §23 R0-013; v0.4 §39).
 *
 * Constructors for the standard {@link ResultValue} envelope plus confidence
 * propagation. Confidence is a trust label, not a probability (v0.4 §4); result
 * confidence is limited by its weakest indispensable input (v0.4 §39).
 */

import type {
  ConfidenceLevel,
  DisplayPrecision,
  ResultConfidence,
  ResultStatus,
  ResultValue,
} from '@ste/schema';

/** Internal numeric mapping used only to order confidence labels (v0.4 §39). */
export const CONFIDENCE_SCORES: Record<ConfidenceLevel, number> = {
  high: 0.95,
  moderate: 0.75,
  low: 0.45,
  unknown: 0,
};

/** The weakest (lowest-scored) of the given confidence levels; `high` if none given. */
export function weakestConfidence(...levels: ConfidenceLevel[]): ConfidenceLevel {
  let weakest: ConfidenceLevel = 'high';
  for (const level of levels) {
    if (CONFIDENCE_SCORES[level] < CONFIDENCE_SCORES[weakest]) weakest = level;
  }
  return weakest;
}

export function confidence(
  level: ConfidenceLevel,
  opts: { limitingDependency?: string; sensitivityWarning?: boolean } = {},
): ResultConfidence {
  return {
    level,
    internal_score: CONFIDENCE_SCORES[level],
    ...(opts.limitingDependency != null ? { limiting_dependency: opts.limitingDependency } : {}),
    ...(opts.sensitivityWarning != null ? { sensitivity_warning: opts.sensitivityWarning } : {}),
  };
}

export interface ResultValueParams<V> {
  status: ResultStatus;
  value: V | null;
  unit?: string;
  displayPrecision?: DisplayPrecision;
  confidence?: ResultConfidence;
  dependencies?: string[];
  assumptionIds?: string[];
  issueIds?: string[];
  formulaId?: string;
}

/** Build a {@link ResultValue}, omitting absent optional fields (exactOptionalPropertyTypes). */
export function resultValue<V>(params: ResultValueParams<V>): ResultValue<V> {
  return {
    status: params.status,
    value: params.value,
    ...(params.unit != null ? { unit: params.unit } : {}),
    ...(params.displayPrecision != null ? { display_precision: params.displayPrecision } : {}),
    ...(params.confidence != null ? { confidence: params.confidence } : {}),
    ...(params.dependencies != null ? { dependencies: params.dependencies } : {}),
    ...(params.assumptionIds != null ? { assumption_ids: params.assumptionIds } : {}),
    ...(params.issueIds != null ? { issue_ids: params.issueIds } : {}),
    ...(params.formulaId != null ? { formula_id: params.formulaId } : {}),
  };
}

/** A valid numeric result with a unit and (optional) confidence/dependencies. */
export function valid<V>(
  value: V,
  unit: string,
  opts: Omit<ResultValueParams<V>, 'status' | 'value' | 'unit'> = {},
): ResultValue<V> {
  return resultValue({ status: 'valid', value, unit, ...opts });
}

/**
 * An unavailable result: the value is unknown because an input was missing or
 * invalid. Defaults to a numeric result value; pass an explicit type argument
 * for categorical results (e.g. `unavailable<FitStatus>('')`).
 */
export function unavailable<V = number>(
  unit: string,
  opts: Omit<ResultValueParams<V>, 'status' | 'value' | 'unit'> = {},
): ResultValue<V> {
  return resultValue<V>({ status: 'unavailable', value: null, unit, ...opts });
}

/** Fixed-decimal display precision. */
export function decimals(digits: number): DisplayPrecision {
  return { mode: 'decimal_places', digits };
}

/** Integer display precision. */
export const INTEGER_PRECISION: DisplayPrecision = { mode: 'integer' };
