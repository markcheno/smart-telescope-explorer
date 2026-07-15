/**
 * Recommendation preview (spec v0.8 §28; v0.9 §39).
 *
 * Applies a recommendation's proposed changes to a CLONE, recomputes, and diffs
 * the key metrics — surfacing benefits, regressions, newly-violated constraints,
 * and the next bottleneck — without touching the live design (v0.8 §48.7). This
 * is how the recommendation engine "estimates benefit by cloning the design,
 * applying the change, recalculating, and comparing" (v0.4 §41).
 */

import type {
  CalculationRequest,
  DesignDocument,
  MetricDirection,
  PreviewMetricChange,
  PreviewStatus,
  Recommendation,
  RecommendationPreview,
  ResultGroups,
  ResultValue,
} from '@ste/schema';
import { calculate } from './coordinator.js';
import { generateRecommendations } from './recommendations.js';

const PREVIEW_GROUPS: CalculationRequest['requested_groups'] = [
  'target_framing',
  'blur',
  'session',
  'sensitivity',
  'exposure_sweep',
  'constraints',
];

interface PreviewMetricSpec {
  metric: string;
  label: string;
  group: keyof ResultGroups;
  key: string;
  unit?: string;
  direction: MetricDirection;
}

const METRICS: PreviewMetricSpec[] = [
  {
    metric: 'target_fit',
    label: 'Target fit',
    group: 'target_framing',
    key: 'fit_status',
    direction: 'neutral',
  },
  {
    metric: 'major_fwhm',
    label: 'Final blur (major)',
    group: 'blur',
    key: 'major_fwhm_arcsec',
    unit: 'arcsec',
    direction: 'lower_better',
  },
  {
    metric: 'elongation',
    label: 'Elongation',
    group: 'blur',
    key: 'elongation',
    direction: 'lower_better',
  },
  {
    metric: 'acceptance',
    label: 'Frame acceptance',
    group: 'session',
    key: 'acceptance_fraction',
    unit: 'fraction',
    direction: 'higher_better',
  },
  {
    metric: 'effective_integration',
    label: 'Effective integration',
    group: 'session',
    key: 'effective_integration_s',
    unit: 's',
    direction: 'higher_better',
  },
  {
    metric: 'relative_stack_snr',
    label: 'Relative stacked SNR',
    group: 'sensitivity',
    key: 'relative_stack_score',
    direction: 'higher_better',
  },
  {
    metric: 'recommended_exposure',
    label: 'Recommended exposure',
    group: 'exposure_sweep',
    key: 'best_exposure_s',
    unit: 's',
    direction: 'neutral',
  },
];

function value(results: ResultGroups, spec: PreviewMetricSpec): number | string | null {
  const group = results[spec.group] as Record<string, ResultValue<unknown>> | undefined;
  const rv = group?.[spec.key];
  if (rv == null || rv.status === 'unavailable') return null;
  const v = rv.value;
  return typeof v === 'number' || typeof v === 'string' ? v : null;
}

/** Set a JSON-Pointer path to a value on a design draft (RFC 6902 replace/add). */
function applyPointer(draft: DesignDocument, pointer: string, patch: unknown): void {
  const parts = pointer.split('/').filter(Boolean);
  if (parts.length === 0) return;
  let node = draft as unknown as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    if (typeof node[key] !== 'object' || node[key] == null) node[key] = {};
    node = node[key] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]!] = patch;
}

/** Apply a recommendation's proposed replace changes to a clone of the design. */
export function applyProposedChanges(doc: DesignDocument, rec: Recommendation): DesignDocument {
  const draft = structuredClone(doc);
  for (const change of rec.proposed_changes ?? []) {
    if (change.kind === 'replace' && change.proposed_value != null) {
      applyPointer(draft, change.field_path, change.proposed_value);
    }
  }
  return draft;
}

function toRequest(design: DesignDocument): CalculationRequest {
  return {
    message_type: 'calculate_design',
    request_id: `preview_${design.design_id}`,
    design_id: design.design_id,
    design_revision: design.revision,
    engine_version: design.calculation_engine_version,
    calculation_mode: 'normal',
    requested_groups: PREVIEW_GROUPS,
    design,
  };
}

function improvedBy(
  direction: MetricDirection,
  before: number | string | null,
  after: number | string | null,
): boolean {
  if (before == null || after == null) return false;
  if (typeof before === 'string' || typeof after === 'string') {
    // Target fit is the only categorical metric: improving means it now fits.
    return before === 'does_not_fit' && after !== 'does_not_fit';
  }
  if (direction === 'higher_better') return after > before;
  if (direction === 'lower_better') return after < before;
  return false;
}

function changed(before: number | string | null, after: number | string | null): boolean {
  if (typeof before === 'number' && typeof after === 'number') {
    return Math.abs(after - before) > 1e-9 * (Math.abs(before) + 1);
  }
  return before !== after;
}

function failingIds(results: ResultGroups): Set<string> {
  const ids = new Set<string>();
  for (const c of results.constraints ?? []) {
    if (c.status === 'fail') ids.add(c.constraint_id);
  }
  return ids;
}

/** Preview the effect of applying a recommendation (spec v0.8 §28). */
export function previewRecommendation(
  doc: DesignDocument,
  rec: Recommendation,
): RecommendationPreview {
  const changes = rec.proposed_changes ?? [];
  const empty: RecommendationPreview = {
    recommendation_id: rec.recommendation_id,
    status: 'no_change',
    changes,
    metric_changes: [],
    benefits: [],
    regressions: [],
    violated_constraints: [],
    next_bottleneck: null,
  };
  if (changes.length === 0) return empty;

  const patched = applyProposedChanges(doc, rec);
  const before = calculate(toRequest(doc));
  const after = calculate(toRequest(patched));

  const metricChanges: PreviewMetricChange[] = [];
  for (const spec of METRICS) {
    const b = value(before.results, spec);
    const a = value(after.results, spec);
    if (!changed(b, a)) continue;
    const numeric = typeof b === 'number' && typeof a === 'number';
    metricChanges.push({
      metric: spec.metric,
      label: spec.label,
      ...(spec.unit != null ? { unit: spec.unit } : {}),
      before: b,
      after: a,
      ...(numeric ? { absolute_change: (a as number) - (b as number) } : {}),
      ...(numeric && (b as number) !== 0
        ? { percentage_change: ((a as number) - (b as number)) / Math.abs(b as number) }
        : {}),
      improved: improvedBy(spec.direction, b, a),
    });
  }

  const benefits = metricChanges.filter((m) => m.improved);
  const regressions = metricChanges.filter(
    (m) => !m.improved && METRICS.find((s) => s.metric === m.metric)?.direction !== 'neutral',
  );

  const beforeFailing = failingIds(before.results);
  const violated = [...failingIds(after.results)].filter((id) => !beforeFailing.has(id));

  const nextRec = generateRecommendations(patched, after.results).find(
    (r) => r.rule_id !== rec.rule_id,
  );

  let status: PreviewStatus;
  if (violated.length > 0) status = 'constraint_conflict';
  else if (benefits.length === 0 && regressions.length === 0) status = 'no_change';
  else if (benefits.length === 0) status = 'worse_overall';
  else status = 'valid';

  return {
    recommendation_id: rec.recommendation_id,
    status,
    changes,
    metric_changes: metricChanges,
    benefits,
    regressions,
    violated_constraints: violated,
    next_bottleneck: nextRec?.title ?? null,
  };
}
