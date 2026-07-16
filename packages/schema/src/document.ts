/**
 * Top-level design document (spec v0.8 §6–§8, §18–§19).
 *
 * A DesignDocument is a pure JSON record: stable inputs only, never UI state and
 * never authoritative derived values (v0.8 §2.5, §48.1). `result_snapshot` is
 * informational and recalculated after loading (v0.8 §6).
 */

import type { CaptureInput } from './capture.js';
import type { CameraInput } from './camera.js';
import type { DesignConstraint } from './constraints.js';
import type { FilterInput } from './filter.js';
import type { FocusInput } from './focus.js';
import type { MountInput } from './mount.js';
import type { OpticsInput } from './optics.js';
import type { PowerInput } from './power.js';
import type { ResultSnapshot } from './results.js';
import type { ScenarioInput } from './scenario.js';
import type { TargetSelection } from './target.js';
import type { TrackingInput } from './tracking.js';
import type { SemVer } from './version.js';

export const DESIGN_TYPES = [
  'custom',
  'reference',
  'reference_duplicate',
  'template',
  'imported',
] as const;
export type DesignType = (typeof DESIGN_TYPES)[number];

export interface DesignMetadata {
  name: string;
  design_type: DesignType;
  /** Locked references reject edit commands (v0.8 §7). */
  locked: boolean;
  /** ISO 8601 timestamps. */
  created_at: string;
  modified_at: string;
  description?: string;
  tags?: string[];
  /** ISO 4217 currency code, e.g. `"USD"`. */
  currency_code?: string;
  author_label?: string;
}

/** Provenance for a design duplicated from a locked reference (v0.8 §8). */
export interface PresetOrigin {
  reference_id: string;
  reference_version: string;
  assumption_profile_id?: string | null;
  /** ISO 8601 timestamp. */
  duplicated_at: string;
}

/**
 * Namespaced, non-core data. Preserved when practical, ignored by core v1
 * calculations, and cannot override core fields (v0.8 §18). Defaults to `{}`.
 */
export type Extensions = Record<string, unknown>;

export interface DesignDocument {
  schema_version: SemVer;
  calculation_engine_version: SemVer;
  design_id: string;
  /** Increments per committed design command (v0.8 §43). */
  revision: number;
  metadata: DesignMetadata;
  preset_origin?: PresetOrigin;
  scenario: ScenarioInput;
  target: TargetSelection;
  optics: OpticsInput;
  camera: CameraInput;
  filter: FilterInput;
  mount: MountInput;
  tracking: TrackingInput;
  capture: CaptureInput;
  focus?: FocusInput;
  power?: PowerInput;
  constraints: DesignConstraint[];
  notes?: string;
  extensions: Extensions;
  /** Informational only; recalculated after loading (v0.8 §6). */
  result_snapshot?: ResultSnapshot;
}
