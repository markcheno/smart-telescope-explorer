/**
 * Report contract (spec v0.8 §44; v0.5 §44; v0.7 §18 E12).
 *
 * A report is a PURE rendering of an existing design + calculation response (and
 * optional comparison) — the renderer never recalculates (v0.8 §44). The builder
 * assembles a presentation-agnostic structure (cover, executive summary, ordered
 * sections, assumptions, versions); a UI or exporter turns it into HTML/print.
 * Privacy controls let a shared report round or remove exact coordinates
 * (v0.8 §44 "location privacy"; acceptance criterion 15).
 */

import type { ConfidenceLevel } from './primitives.js';
import type { ResultValue } from './results.js';

export const REPORT_TEMPLATE_VERSION = '1.0.0';

export const LOCATION_PRIVACY_MODES = ['exact', 'rounded', 'removed'] as const;
export type LocationPrivacyMode = (typeof LOCATION_PRIVACY_MODES)[number];

export interface ReportPrivacy {
  /** How to disclose the target's exact coordinates (v0.8 §44). */
  location_mode: LocationPrivacyMode;
  /** Include catalog/source URLs and notes in the appendix. */
  include_sources?: boolean;
}

export interface ReportOptions {
  privacy?: ReportPrivacy;
  /** ISO 8601 generation timestamp supplied by the caller (keeps the builder pure). */
  generated_at?: string | null;
}

/**
 * A single labelled line. `value` is either a {@link ResultValue} (rendered with
 * its own unit/precision/confidence) or a pre-formatted string (inputs, verdicts,
 * privacy-adjusted coordinates); `null` is unknown.
 */
export interface ReportRow {
  label: string;
  value: ResultValue<unknown> | string | null;
  note?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  rows: ReportRow[];
}

export interface ReportCover {
  name: string;
  target: string;
  scenario: string;
  /** Overall response status ("complete" / "partial" / …). */
  status: string;
  generated_at: string | null;
}

export interface ReportSummary {
  recommended_exposure: ResultValue<unknown> | null;
  frame_yield: ResultValue<unknown> | null;
  effective_integration: ResultValue<unknown> | null;
  strengths: string[];
  limitations: string[];
  top_recommendations: string[];
}

export interface ReportRecommendationLine {
  severity: string;
  title: string;
  problem: string;
}

export interface ReportAssumptionLine {
  label: string;
  detail: string;
  confidence?: ConfidenceLevel;
}

export interface Report {
  report_id: string;
  template_version: string;
  cover: ReportCover;
  summary: ReportSummary;
  sections: ReportSection[];
  recommendations: ReportRecommendationLine[];
  assumptions: ReportAssumptionLine[];
  versions: { schema: string; engine: string; report_template: string };
}
