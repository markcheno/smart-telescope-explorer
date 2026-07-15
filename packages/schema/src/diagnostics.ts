/**
 * Issues, assumptions, and formula records (spec v0.8 §24–§26).
 *
 * Expected engineering problems surface as structured issues, never thrown
 * exceptions (v0.8 §46). Assumptions and formula records make every result
 * explainable and overridable (v0.8 §48.16). Formula records are explanatory,
 * never executable (v0.8 §26).
 */

import type { ConfidenceLevel } from './primitives.js';

// --- issues (v0.8 §24) ----------------------------------------------------

export const ISSUE_SEVERITIES = ['fatal', 'error', 'warning', 'advisory', 'information'] as const;
export type IssueSeverity = (typeof ISSUE_SEVERITIES)[number];

export const ISSUE_SOURCES = [
  'user_input',
  'preset',
  'catalog',
  'calculation',
  'migration',
  'worker',
  'unknown',
] as const;
export type IssueSource = (typeof ISSUE_SOURCES)[number];

export interface CalculationIssue {
  issue_id: string;
  /** Stable diagnostic code (v0.8 §24), e.g. `optics.aperture_missing`. */
  code: string;
  severity: IssueSeverity;
  title: string;
  message: string;
  /** JSON Pointer paths to the offending inputs. */
  field_paths?: string[];
  affected_result_groups?: string[];
  suggested_action?: string;
  source: IssueSource;
  dismissible?: boolean;
}

// --- assumptions (v0.8 §25) -----------------------------------------------

export interface CalculationAssumption {
  assumption_id: string;
  title: string;
  description: string;
  field_paths?: string[];
  default_value?: number | string | boolean | null;
  unit?: string | null;
  confidence: ConfidenceLevel;
  affects_groups?: string[];
  user_can_override: boolean;
}

// --- formula records (v0.8 §26) -------------------------------------------

/** A named intermediate value inside a formula record's derivation. */
export interface FormulaIntermediateValue {
  symbol: string;
  value: number | null;
  unit?: string | null;
}

/** Explanatory only — never evaluated (v0.8 §26). */
export interface FormulaRecord {
  formula_id: string;
  name: string;
  description?: string;
  /** e.g. `f_eff = f_native * reducer * extender`. */
  symbolic_expression: string;
  /** The expression with input values substituted in. */
  substituted_expression?: string;
  intermediate_values?: FormulaIntermediateValue[];
  result_value: number | null;
  unit?: string | null;
  assumptions?: string[];
  limitations?: string[];
  dependency_paths?: string[];
}
