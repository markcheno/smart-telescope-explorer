/**
 * Local-first persistence for R1 (spec v0.9 §24 R1-021..024).
 *
 * R1 uses localStorage for autosave and the saved design; the ADR's IndexedDB
 * target and multi-design storage arrive with the persistence package. JSON
 * import/export is the durable, backend-free backup (ADR 0001). Exported JSON is
 * a pure v1 document with no UI state (v0.8 §46).
 */

import type { DesignDocument } from '@ste/schema';

const CURRENT_KEY = 'ste.currentDesign.v1';

export function saveCurrentDesign(design: DesignDocument): void {
  try {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(design));
  } catch {
    // Storage may be unavailable (private mode, quota); autosave is best-effort.
  }
}

export function loadCurrentDesign(): DesignDocument | null {
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    return raw == null ? null : (JSON.parse(raw) as DesignDocument);
  } catch {
    return null;
  }
}

/** Serialize a design to pretty JSON for download/export (no UI state). */
export function exportDesignJson(design: DesignDocument): string {
  return JSON.stringify(design, null, 2);
}

export interface ImportResult {
  ok: boolean;
  design?: DesignDocument;
  error?: string;
}

/**
 * Parse and lightly validate an imported design. Full schema migration/validation
 * is the import contract's job (v0.8 §40); here we reject only clearly-unusable
 * input so the editor never loads a non-document.
 */
export function parseImportedDesign(text: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }
  if (parsed == null || typeof parsed !== 'object') {
    return { ok: false, error: 'File does not contain a design document.' };
  }
  const doc = parsed as Partial<DesignDocument>;
  if (doc.schema_version == null || doc.optics == null || doc.camera == null) {
    return { ok: false, error: 'Missing required design fields (schema_version, optics, camera).' };
  }
  return { ok: true, design: parsed as DesignDocument };
}

/** Trigger a browser download of the exported JSON. */
export function downloadJson(design: DesignDocument): void {
  const blob = new Blob([exportDesignJson(design)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${design.design_id || 'design'}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
