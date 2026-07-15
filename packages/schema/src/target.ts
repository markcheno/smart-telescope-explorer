/**
 * Target selection and definition (spec v0.8 §10).
 *
 * A design either references a catalog target (by stable id + version) or holds
 * a fully custom target. `overrides` lets a catalog target be locally adjusted
 * without mutating the catalog record.
 */

import type { SourceMetadata } from './primitives.js';

export const TARGET_SELECTION_TYPES = ['catalog', 'custom'] as const;
export type TargetSelectionType = (typeof TARGET_SELECTION_TYPES)[number];

export const TARGET_EPOCHS = ['j2000', 'jnow', 'custom'] as const;
export type TargetEpoch = (typeof TARGET_EPOCHS)[number];

export const TARGET_SHAPES = [
  'point',
  'circle',
  'ellipse',
  'rectangle',
  'polygon',
  'multi_region',
] as const;
export type TargetShape = (typeof TARGET_SHAPES)[number];

export const TARGET_TYPES = [
  'galaxy',
  'emission_nebula',
  'reflection_nebula',
  'planetary_nebula',
  'supernova_remnant',
  'globular_cluster',
  'open_cluster',
  'star_field',
  'mixed_region',
  'point_source',
  'custom',
] as const;
export type TargetType = (typeof TARGET_TYPES)[number];

export const ANGULAR_SIZE_CLASSES = [
  'very_large',
  'large',
  'medium',
  'small',
  'very_small',
  'unknown',
] as const;
export type AngularSizeClass = (typeof ANGULAR_SIZE_CLASSES)[number];

export const SURFACE_BRIGHTNESS_CLASSES = [
  'high',
  'moderate',
  'low',
  'very_low',
  'unknown',
] as const;
export type SurfaceBrightnessClass = (typeof SURFACE_BRIGHTNESS_CLASSES)[number];

export const SPECTRAL_CLASSES = [
  'broadband',
  'emission_line',
  'mixed',
  'stellar',
  'unknown',
] as const;
export type SpectralClass = (typeof SPECTRAL_CLASSES)[number];

export const LINE_RELEVANCES = ['strong', 'moderate', 'weak', 'none', 'unknown'] as const;
export type LineRelevance = (typeof LINE_RELEVANCES)[number];

export interface TargetCoordinates {
  right_ascension_deg: number | null;
  declination_deg: number | null;
  epoch: TargetEpoch;
}

/** A single [ra_deg, dec_deg] vertex for polygon/outline geometry. */
export type OutlineVertex = readonly [number, number];

export interface TargetGeometry {
  shape: TargetShape;
  width_arcmin?: number | null;
  height_arcmin?: number | null;
  position_angle_deg?: number | null;
  bright_core_width_arcmin?: number | null;
  bright_core_height_arcmin?: number | null;
  halo_width_arcmin?: number | null;
  halo_height_arcmin?: number | null;
  recommended_margin_fraction?: number | null;
  outline?: OutlineVertex[];
}

export interface TargetClassification {
  target_type: TargetType;
  angular_size_class?: AngularSizeClass;
  surface_brightness_class?: SurfaceBrightnessClass;
  spectral_class?: SpectralClass;
  h_alpha_relevance?: LineRelevance;
  oiii_relevance?: LineRelevance;
}

export interface TargetBrightness {
  integrated_magnitude?: number | null;
  surface_brightness_mag_arcsec2?: number | null;
  h_alpha_flux?: number | null;
  oiii_flux?: number | null;
  photometric_model_enabled?: boolean;
}

export interface CustomTarget {
  target_id: string;
  name: string;
  aliases?: string[];
  coordinates: TargetCoordinates;
  geometry: TargetGeometry;
  classification: TargetClassification;
  brightness?: TargetBrightness;
  source?: SourceMetadata;
}

export interface TargetCatalogReference {
  target_id: string;
  target_version: string;
  catalog_version: string;
  display_name_snapshot?: string;
}

/**
 * Local, non-destructive adjustments to a catalog target (e.g. reframing). Only
 * the fields a user changed are present.
 */
export interface TargetOverrides {
  geometry?: Partial<TargetGeometry>;
  classification?: Partial<TargetClassification>;
  brightness?: Partial<TargetBrightness>;
}

export interface TargetSelection {
  selection_type: TargetSelectionType;
  catalog_reference?: TargetCatalogReference;
  custom_target?: CustomTarget;
  overrides?: TargetOverrides;
}
