/**
 * Design comparison engine (spec v0.8 §32; v0.9 §24 R3).
 *
 * Normalises every design onto the baseline's target + scenario (so the hardware
 * is judged on the same sky), calculates each, and assembles metric rows with a
 * baseline delta and best/worst marking. A metric that is unavailable for a
 * design yields a null cell; a row with fewer than two comparable values is
 * flagged not-comparable (v0.8 §48.10).
 */

import type {
  CalculationGroup,
  CalculationRequest,
  ComparisonMetricCell,
  ComparisonMetricRow,
  ComparisonRequest,
  ComparisonResponse,
  DesignDocument,
  MetricDirection,
  NormalizationMode,
  ResultGroups,
  ResultValue,
} from '@ste/schema';
import { MAX_COMPARISON_DESIGNS } from '@ste/schema';
import { calculate } from './coordinator.js';

const COMPARISON_GROUPS: CalculationGroup[] = [
  'static_geometry',
  'target_framing',
  'sampling',
  'blur',
  'field_rotation',
  'exposure_sweep',
  'session',
  'sensitivity',
];

interface MetricSpec {
  metric: string;
  label: string;
  group: keyof ResultGroups;
  key: string;
  unit?: string;
  direction: MetricDirection;
}

/** The comparable metric set (v0.8 §32; v0.9 §40 comparison views). */
const METRICS: MetricSpec[] = [
  {
    metric: 'image_scale',
    label: 'Image scale',
    group: 'static_geometry',
    key: 'image_scale_x_arcsec_per_px',
    unit: 'arcsec/px',
    direction: 'neutral',
  },
  {
    metric: 'field_of_view',
    label: 'Field of view',
    group: 'static_geometry',
    key: 'field_of_view_x_deg',
    unit: 'deg',
    direction: 'neutral',
  },
  {
    metric: 'focal_ratio',
    label: 'Focal ratio',
    group: 'static_geometry',
    key: 'focal_ratio',
    direction: 'lower_better',
  },
  {
    metric: 'target_fit',
    label: 'Target fit',
    group: 'target_framing',
    key: 'fit_status',
    direction: 'neutral',
  },
  {
    metric: 'sampling',
    label: 'Sampling',
    group: 'sampling',
    key: 'classification',
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
    metric: 'recommended_exposure',
    label: 'Recommended exposure',
    group: 'exposure_sweep',
    key: 'best_exposure_s',
    unit: 's',
    direction: 'neutral',
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
    metric: 'point_source_throughput',
    label: 'Point-source throughput',
    group: 'sensitivity',
    key: 'point_source_throughput',
    direction: 'higher_better',
  },
  {
    metric: 'relative_stack_snr',
    label: 'Relative stacked SNR',
    group: 'sensitivity',
    key: 'relative_stack_score',
    direction: 'higher_better',
  },
];

/** Apply the baseline's target/scenario/exposure to a design per the mode. */
function normalizeDesign(
  design: DesignDocument,
  baseline: DesignDocument,
  mode: NormalizationMode,
): DesignDocument {
  const d = structuredClone(design);
  if (mode === 'same_target' || mode === 'same_target_and_scenario') {
    d.target = structuredClone(baseline.target);
  }
  if (mode === 'same_scenario' || mode === 'same_target_and_scenario') {
    d.scenario = structuredClone(baseline.scenario);
  }
  if (mode === 'same_exposure' && baseline.capture.exposure_s != null) {
    d.capture = { ...d.capture, exposure_s: baseline.capture.exposure_s };
  }
  return d;
}

function toRequest(design: DesignDocument): CalculationRequest {
  return {
    message_type: 'calculate_design',
    request_id: `cmp_${design.design_id}`,
    design_id: design.design_id,
    design_revision: design.revision,
    engine_version: design.calculation_engine_version,
    calculation_mode: 'normal',
    requested_groups: COMPARISON_GROUPS,
    design,
  };
}

function cellValue(results: ResultGroups, spec: MetricSpec): number | string | null {
  const group = results[spec.group] as Record<string, ResultValue<unknown>> | undefined;
  const rv = group?.[spec.key];
  if (rv == null || rv.status === 'unavailable') return null;
  const v = rv.value;
  return typeof v === 'number' || typeof v === 'string' ? v : null;
}

function markBestWorst(cells: ComparisonMetricCell[], direction: MetricDirection): void {
  if (direction === 'neutral') return;
  const numeric = cells.filter(
    (c): c is ComparisonMetricCell & { value: number } => typeof c.value === 'number',
  );
  if (numeric.length < 2) return;
  const values = numeric.map((c) => c.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const bestValue = direction === 'higher_better' ? max : min;
  const worstValue = direction === 'higher_better' ? min : max;
  for (const c of numeric) {
    if (c.value === bestValue) c.is_best = true;
    if (c.value === worstValue) c.is_worst = true;
  }
}

/** Compare up to four designs and return metric rows (v0.8 §32). */
export function compareDesigns(request: ComparisonRequest): ComparisonResponse {
  const mode = request.normalization ?? 'same_target_and_scenario';
  const entries = request.designs.slice(0, MAX_COMPARISON_DESIGNS);
  const baselineIndex = Math.min(Math.max(request.baseline_index, 0), entries.length - 1);
  const baseline = entries[baselineIndex]!.design;

  const perDesign = entries.map((entry, i) => {
    const design =
      i === baselineIndex ? entry.design : normalizeDesign(entry.design, baseline, mode);
    return calculate(toRequest(design));
  });

  const designLabels = entries.map(
    (entry, i) => entry.label ?? entry.design.metadata.name ?? `Design ${i + 1}`,
  );

  const rows: ComparisonMetricRow[] = METRICS.map((spec) => {
    const cells: ComparisonMetricCell[] = perDesign.map((res, i) => ({
      design_index: i,
      value: cellValue(res.results, spec),
    }));

    const baselineCell = cells[baselineIndex]!;
    if (typeof baselineCell.value === 'number') {
      for (const c of cells) {
        c.baseline_delta = typeof c.value === 'number' ? c.value - baselineCell.value : null;
      }
    }
    markBestWorst(cells, spec.direction);

    const comparableCount = cells.filter((c) => c.value != null).length;
    return {
      metric: spec.metric,
      label: spec.label,
      ...(spec.unit != null ? { unit: spec.unit } : {}),
      direction: spec.direction,
      cells,
      comparison_valid: comparableCount >= 2,
    };
  });

  const issues = perDesign.flatMap((res) => res.issues.filter((iss) => iss.severity === 'error'));
  const anyProduced = perDesign.some((res) => res.calculated_groups.length > 0);

  return {
    message_type: 'comparison_result',
    request_id: request.request_id,
    status: anyProduced ? (issues.length > 0 ? 'partial' : 'complete') : 'failed',
    baseline_index: baselineIndex,
    normalization: mode,
    design_labels: designLabels,
    rows,
    issues,
  };
}
