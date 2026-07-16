/**
 * Share links (spec v0.5 §43; v0.7 §18 E12).
 *
 * Encodes a design's inputs + preset/engine versions into a URL fragment so a
 * build can be swapped with the hobbyist community. Small designs travel in the
 * link; oversized ones fall back to file export (the caller handles that when
 * this returns null). Exact coordinates are only shared with explicit consent —
 * the privacy mode rounds or removes them (spec §43 "warn before sharing exact
 * coordinates"). A shared design always opens as a COPY, never overwriting the
 * recipient's own work.
 */

import type { DesignDocument, LocationPrivacyMode } from '@ste/schema';

const SHARE_PREFIX = 'share=';
/** URLs beyond this length are unreliable across clients — fall back to file. */
const MAX_URL_LENGTH = 8000;

/** UTF-8-safe base64url encode. */
function b64encode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** UTF-8-safe base64url decode. */
function b64decode(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** True when the design carries exact (unrounded, present) target coordinates. */
export function hasExactCoordinates(design: DesignDocument): boolean {
  const c = design.target.custom_target?.coordinates;
  return c != null && c.right_ascension_deg != null && c.declination_deg != null;
}

/** Apply the location-privacy mode to a design clone's coordinates. */
function applyPrivacy(design: DesignDocument, mode: LocationPrivacyMode): DesignDocument {
  const clone = structuredClone(design);
  const c = clone.target.custom_target?.coordinates;
  if (c == null) return clone;
  if (mode === 'removed') {
    c.right_ascension_deg = null;
    c.declination_deg = null;
  } else if (mode === 'rounded') {
    if (c.right_ascension_deg != null) c.right_ascension_deg = Math.round(c.right_ascension_deg);
    if (c.declination_deg != null) c.declination_deg = Math.round(c.declination_deg);
  }
  return clone;
}

export interface ShareOptions {
  privacy: LocationPrivacyMode;
  /** Optional analysis view to open (e.g. "exposure"). */
  view?: string;
}

/**
 * Build a shareable URL for a design, or null when it is too large for a link
 * (the caller should offer file export instead).
 */
export function buildShareUrl(design: DesignDocument, options: ShareOptions): string | null {
  const shared = applyPrivacy(design, options.privacy);
  const payload = { d: shared, v: options.view ?? null };
  const encoded = b64encode(JSON.stringify(payload));
  const base =
    typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const url = `${base}#${SHARE_PREFIX}${encoded}`;
  return url.length > MAX_URL_LENGTH ? null : url;
}

export interface SharedDesign {
  design: DesignDocument;
  view: string | null;
}

/**
 * Read a shared design from the current URL fragment, opened as an independent
 * copy (fresh id, reset revision, name marked as a shared copy). Returns null
 * when no share fragment is present or it cannot be decoded.
 */
export function readSharedFromLocation(hash: string): SharedDesign | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw.startsWith(SHARE_PREFIX)) return null;
  try {
    const payload = JSON.parse(b64decode(raw.slice(SHARE_PREFIX.length))) as {
      d: DesignDocument;
      v?: string | null;
    };
    if (payload.d?.schema_version == null || payload.d.optics == null) return null;
    const copy = structuredClone(payload.d);
    copy.design_id = `${copy.design_id || 'design'}_shared`;
    copy.revision = 1;
    copy.metadata = {
      ...copy.metadata,
      name: `${copy.metadata?.name ?? 'Shared design'} (shared copy)`,
      locked: false,
      design_type: 'custom',
    };
    return { design: copy, view: payload.v ?? null };
  } catch {
    return null;
  }
}
