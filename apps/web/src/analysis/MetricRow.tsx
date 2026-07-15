/**
 * Shared metric row for the R2 analysis views: label, value, and a confidence
 * chip read straight off the result (never recomputed).
 */

import type { ResultValue } from '@ste/schema';
import { CONFIDENCE_LABEL, confidenceLevel, formatResult } from '../components/format.js';

export function MetricRow({
  label,
  rv,
}: {
  label: string;
  rv: ResultValue<unknown> | undefined;
}): JSX.Element {
  const level = confidenceLevel(rv);
  return (
    <div className="sampling__row">
      <span className="sampling__label">{label}</span>
      <span className="sampling__value">{formatResult(rv)}</span>
      {level != null && (
        <span className={`chip chip--${level}`} title={CONFIDENCE_LABEL[level]}>
          {level}
        </span>
      )}
    </div>
  );
}
