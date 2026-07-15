/**
 * Design commands (spec v0.8 §29).
 *
 * Every edit — from the UI, a recommendation, a sweep, or a preset — is a
 * DesignCommand whose operations follow JSON Patch add/remove/replace. A
 * successful command increments the design revision (v0.8 §29, §43). Drafts and
 * previews do not (v0.8 §43).
 */

export const COMMAND_TYPES = [
  'field_edit',
  'preset_apply',
  'section_reset',
  'recommendation_apply',
  'sweep_candidate_apply',
  'constraint_edit',
  'import_merge',
] as const;
export type CommandType = (typeof COMMAND_TYPES)[number];

export const COMMAND_SOURCES = [
  'user',
  'recommendation',
  'sweep',
  'preset',
  'migration',
  'system',
] as const;
export type CommandSource = (typeof COMMAND_SOURCES)[number];

export const PATCH_OPS = ['add', 'remove', 'replace'] as const;
export type PatchOp = (typeof PATCH_OPS)[number];

/** A JSON Patch operation (RFC 6902 subset: add/remove/replace) (v0.8 §29). */
export interface PatchOperation {
  op: PatchOp;
  /** JSON Pointer path. */
  path: string;
  /** Absent for `remove`. */
  value?: unknown;
}

export interface DesignCommand {
  command_id: string;
  command_type: CommandType;
  design_id: string;
  /** Revision this command was authored against; used for conflict detection. */
  base_revision: number;
  label?: string;
  operations: PatchOperation[];
  /** ISO 8601 timestamp. */
  created_at: string;
  source: CommandSource;
}
