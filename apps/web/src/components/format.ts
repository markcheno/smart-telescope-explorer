/**
 * Display formatting for results (spec v0.9 §5–6, v0.4 §44).
 *
 * Renders a {@link ResultValue} per its display precision, and never fabricates a
 * number for an unknown value — unknown/unavailable render as "unknown".
 */

import type { ConfidenceLevel, ResultValue } from '@ste/schema';

export function formatNumber(
  value: number,
  precision?: { mode: string; digits?: number | null },
): string {
  if (!Number.isFinite(value)) return '—';
  if (precision?.mode === 'integer') return Math.round(value).toLocaleString();
  const digits = precision?.digits;
  if (precision?.mode === 'decimal_places' && digits != null) return value.toFixed(digits);
  if (precision?.mode === 'significant_figures' && digits != null) return value.toPrecision(digits);
  return String(Math.round(value * 100) / 100);
}

/** Format a result's value + unit for inline display. */
export function formatResult(rv: ResultValue<unknown> | undefined): string {
  if (rv == null || rv.value == null || rv.status === 'unavailable') return 'unknown';
  const unit = rv.unit ? ` ${rv.unit}` : '';
  if (typeof rv.value === 'number') return `${formatNumber(rv.value, rv.display_precision)}${unit}`;
  return prettifyEnum(String(rv.value));
}

/** Turn a snake_case enum value into a Title Case label. */
export function prettifyEnum(value: string): string {
  return value
    .split('_')
    .map((w) => (w.length > 0 ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  high: 'High confidence',
  moderate: 'Moderate confidence',
  low: 'Low confidence',
  unknown: 'Unknown',
};

export function confidenceLevel(rv: ResultValue<unknown> | undefined): ConfidenceLevel | null {
  return rv?.confidence?.level ?? null;
}
