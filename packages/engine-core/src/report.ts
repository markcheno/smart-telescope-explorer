/**
 * Report builder (spec v0.8 §44; v0.5 §44).
 *
 * Assembles a presentation-agnostic {@link Report} from a design and its
 * calculation response — a PURE renderer that NEVER recalculates (v0.8 §44,
 * acceptance criterion 14). It reads result values as-is, derives an executive
 * summary (strengths / limitations / top recommendations) from the verdicts
 * already computed, and applies the requested location-privacy mode to the
 * target's coordinates (criterion 15). The UI/exporter formats each row.
 */

import type {
  CalculationResponse,
  ComparisonResponse,
  DesignDocument,
  Report,
  ReportAssumptionLine,
  ReportOptions,
  ReportRow,
  ReportSection,
  ReportSummary,
  ResultGroups,
  ResultValue,
} from '@ste/schema';
import { REPORT_TEMPLATE_VERSION } from '@ste/schema';

type Groups = ResultGroups;

function rv(groups: Groups, group: keyof Groups, key: string): ResultValue<unknown> | null {
  const g = groups[group] as Record<string, ResultValue<unknown>> | undefined;
  const v = g?.[key];
  return v ?? null;
}

/** A result value's plain scalar payload, or null when unavailable. */
function raw(v: ResultValue<unknown> | null): number | string | boolean | null {
  if (v == null || v.status === 'unavailable' || v.value == null) return null;
  const t = typeof v.value;
  return t === 'number' || t === 'string' || t === 'boolean'
    ? (v.value as number | string | boolean)
    : null;
}

function row(label: string, value: ReportRow['value'], note?: string): ReportRow {
  return note != null ? { label, value, note } : { label, value };
}

// --- location privacy -----------------------------------------------------

function coordinateRow(doc: DesignDocument, options: ReportOptions | undefined): ReportRow {
  const mode = options?.privacy?.location_mode ?? 'exact';
  const coords = doc.target.custom_target?.coordinates;
  if (mode === 'removed') return row('Coordinates', 'withheld');
  if (coords == null || coords.right_ascension_deg == null || coords.declination_deg == null) {
    return row('Coordinates', 'unknown');
  }
  const ra = coords.right_ascension_deg;
  const dec = coords.declination_deg;
  const digits = mode === 'rounded' ? 0 : 3;
  const sign = dec >= 0 ? '+' : '−';
  return row(
    'Coordinates',
    `RA ${ra.toFixed(digits)}° / Dec ${sign}${Math.abs(dec).toFixed(digits)}° (${coords.epoch})`,
    mode === 'rounded' ? 'Rounded for sharing' : undefined,
  );
}

// --- executive summary ----------------------------------------------------

function summary(groups: Groups, response: CalculationResponse): ReportSummary {
  const strengths: string[] = [];
  const limitations: string[] = [];

  const fit = raw(rv(groups, 'target_framing', 'fit_status'));
  if (fit === 'good') strengths.push('Target frames well within the field.');
  else if (fit === 'does_not_fit') limitations.push('Target does not fit the field of view.');
  else if (fit === 'tight') limitations.push('Target framing is tight — little margin.');
  else if (fit === 'excess_field') limitations.push('Target fills only a small part of the field.');

  const sampling = raw(rv(groups, 'sampling', 'classification'));
  if (sampling === 'well_sampled') strengths.push('Sampling is well matched to the seeing.');
  else if (typeof sampling === 'string' && sampling.includes('undersampled'))
    limitations.push('Optics undersample the seeing (detail is pixel-limited).');
  else if (typeof sampling === 'string' && sampling.includes('oversampled'))
    limitations.push('Optics oversample (empty magnification, dimmer pixels).');

  const elong = raw(rv(groups, 'blur', 'elongation'));
  if (typeof elong === 'number' && elong <= 1.15)
    strengths.push('Stars are round (low elongation).');
  else if (typeof elong === 'number' && elong > 1.3)
    limitations.push('Stars are elongated by tracking or field rotation.');

  const acceptance = raw(rv(groups, 'session', 'acceptance_fraction'));
  if (typeof acceptance === 'number' && acceptance >= 0.8)
    strengths.push('Most frames are expected to pass quality gating.');
  else if (typeof acceptance === 'number' && acceptance < 0.5)
    limitations.push('A large fraction of frames are expected to be rejected.');

  const photometric = raw(rv(groups, 'sensitivity', 'photometric_available'));
  if (photometric !== true)
    limitations.push('Signal-to-noise is relative (no absolute photometry in v1).');

  const top = (response.recommendations ?? []).slice(0, 3).map((r) => r.title);

  return {
    recommended_exposure: rv(groups, 'exposure_sweep', 'best_exposure_s'),
    frame_yield: rv(groups, 'session', 'frames_accepted'),
    effective_integration: rv(groups, 'session', 'effective_integration_s'),
    strengths,
    limitations,
    top_recommendations: top,
  };
}

// --- sections -------------------------------------------------------------

function sections(doc: DesignDocument, groups: Groups, options?: ReportOptions): ReportSection[] {
  const out: ReportSection[] = [];

  out.push({
    id: 'system',
    title: 'System overview',
    rows: [
      row('Aperture', `${doc.optics.aperture_mm ?? '—'} mm`),
      row('Effective focal length', rv(groups, 'static_geometry', 'effective_focal_length_mm')),
      row('Focal ratio', rv(groups, 'static_geometry', 'focal_ratio')),
      row('Image scale', rv(groups, 'static_geometry', 'image_scale_x_arcsec_per_px')),
      row('Field of view (x)', rv(groups, 'static_geometry', 'field_of_view_x_deg')),
      row('Field of view (y)', rv(groups, 'static_geometry', 'field_of_view_y_deg')),
      row('Mount', doc.mount.architecture ?? 'unknown'),
    ],
  });

  out.push({
    id: 'framing',
    title: 'Framing & sampling',
    rows: [
      row('Target', doc.target.custom_target?.name ?? 'unknown'),
      coordinateRow(doc, options),
      row('Fit', rv(groups, 'target_framing', 'fit_status')),
      row(
        'Target size',
        combineSize(groups, 'target_framing', 'target_width_px', 'target_height_px'),
      ),
      row('Image-circle coverage', rv(groups, 'target_framing', 'image_circle_coverage_fraction')),
      row('Sampling', rv(groups, 'sampling', 'classification')),
      row('Base FWHM', rv(groups, 'sampling', 'base_fwhm_arcsec')),
      row('Pixels per FWHM', rv(groups, 'sampling', 'pixels_per_fwhm')),
    ],
  });

  out.push({
    id: 'blur',
    title: 'Blur & rotation',
    rows: [
      row('Final blur (major)', rv(groups, 'blur', 'major_fwhm_arcsec')),
      row('Final blur (minor)', rv(groups, 'blur', 'minor_fwhm_arcsec')),
      row('Elongation', rv(groups, 'blur', 'elongation')),
      row('Dominant contribution', rv(groups, 'blur', 'dominant_contribution')),
      row('Tracking quality', rv(groups, 'tracking', 'quality')),
      row('Field rotation rate', rv(groups, 'field_rotation', 'rotation_rate_deg_per_hr')),
    ],
  });

  out.push({
    id: 'exposure',
    title: 'Exposure & session',
    rows: [
      row('Recommended exposure', rv(groups, 'exposure_sweep', 'best_exposure_s')),
      row('Frames attempted', rv(groups, 'session', 'frames_attempted')),
      row('Frames accepted', rv(groups, 'session', 'frames_accepted')),
      row('Acceptance', rv(groups, 'session', 'acceptance_fraction')),
      row('Effective integration', rv(groups, 'session', 'effective_integration_s')),
      row('Duty cycle', rv(groups, 'session', 'duty_cycle')),
      row('Stack crop', rv(groups, 'stack_geometry', 'crop_fraction')),
    ],
  });

  out.push({
    id: 'sensitivity',
    title: 'Sensitivity',
    rows: [
      row('Atmospheric throughput', rv(groups, 'sensitivity', 'atmospheric_throughput')),
      row('Point-source throughput', rv(groups, 'sensitivity', 'point_source_throughput')),
      row('Relative stacked SNR', rv(groups, 'sensitivity', 'relative_stack_score')),
      row('Absolute photometry', rv(groups, 'sensitivity', 'photometric_available')),
    ],
  });

  if (doc.power != null && (doc.power.loads?.length ?? 0) > 0) {
    out.push({
      id: 'power',
      title: 'Power',
      rows: [
        row('Average power', rv(groups, 'power', 'average_power_w')),
        row('Usable energy', rv(groups, 'power', 'usable_energy_wh')),
        row('Runtime', rv(groups, 'power', 'runtime_hr')),
        row('Covers session', rv(groups, 'power', 'session_covered')),
      ],
    });
  }

  if (doc.focus != null) {
    out.push({
      id: 'focus',
      title: 'Focus',
      rows: [
        row('Step resolution', rv(groups, 'focus', 'step_resolution_um')),
        row('Critical focus zone (half)', rv(groups, 'focus', 'critical_focus_zone_half_um')),
        row('Recommended step', rv(groups, 'focus', 'recommended_repeatable_um')),
        row('Resolution adequate', rv(groups, 'focus', 'resolution_adequate')),
        row('Defocus FWHM (temp drift)', rv(groups, 'focus', 'defocus_fwhm_arcsec')),
      ],
    });
  }

  const constraints = groups.constraints ?? [];
  if (constraints.length > 0) {
    out.push({
      id: 'constraints',
      title: 'Constraints',
      rows: constraints.map((c) =>
        row(
          c.constraint_id,
          `${c.status}${c.actual != null ? ` (actual ${String(c.actual)})` : ''}`,
        ),
      ),
    });
  }

  return out;
}

function combineSize(groups: Groups, group: keyof Groups, wKey: string, hKey: string): string {
  const w = raw(rv(groups, group, wKey));
  const h = raw(rv(groups, group, hKey));
  if (typeof w !== 'number' || typeof h !== 'number') return 'unknown';
  return `${Math.round(w)} × ${Math.round(h)} px`;
}

// --- assumptions ----------------------------------------------------------

function assumptions(response: CalculationResponse): ReportAssumptionLine[] {
  return response.assumptions.map((a) => ({
    label: a.title,
    detail: a.description,
    confidence: a.confidence,
  }));
}

/**
 * Build a report from a design + its calculation response (spec v0.8 §44).
 * Pure: the caller supplies `generated_at`; nothing is recalculated.
 */
export function buildReport(
  doc: DesignDocument,
  response: CalculationResponse,
  options?: ReportOptions,
  _comparison?: ComparisonResponse | null,
): Report {
  const groups = response.results;
  const scenario =
    doc.scenario.direct_horizontal != null
      ? `Alt ${doc.scenario.direct_horizontal.altitude_deg ?? '—'}°, ${doc.scenario.session?.duration_s ?? '—'} s`
      : `${doc.scenario.mode}`;

  return {
    report_id: `report_${doc.design_id}_r${doc.revision}`,
    template_version: REPORT_TEMPLATE_VERSION,
    cover: {
      name: doc.metadata.name,
      target: doc.target.custom_target?.name ?? 'unknown',
      scenario,
      status: response.status,
      generated_at: options?.generated_at ?? null,
    },
    summary: summary(groups, response),
    sections: sections(doc, groups, options),
    recommendations: (response.recommendations ?? []).map((r) => ({
      severity: r.severity,
      title: r.title,
      problem: r.problem,
    })),
    assumptions: assumptions(response),
    versions: {
      schema: response.schema_version,
      engine: response.engine_version,
      report_template: REPORT_TEMPLATE_VERSION,
    },
  };
}
