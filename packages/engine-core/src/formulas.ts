/**
 * Formula registry (spec v0.9 §23 R0-014; v0.8 §26).
 *
 * Explanatory records for every derived value — symbolic form, substituted form,
 * intermediates, result, and dependency paths. Records are data, never executed
 * (v0.8 §26). Stable `formula_id`s let a {@link ResultValue} reference its
 * derivation.
 */

import type { FormulaIntermediateValue, FormulaRecord } from '@ste/schema';

export const FORMULA_IDS = {
  EFFECTIVE_FOCAL_LENGTH: 'optics.effective_focal_length',
  FOCAL_RATIO: 'optics.focal_ratio',
  CLEAR_AREA: 'optics.clear_aperture_area',
  EFFECTIVE_AREA: 'optics.effective_aperture_area',
  DIFFRACTION_FWHM: 'optics.diffraction_fwhm',
  IMAGE_SCALE: 'camera.image_scale',
  FIELD_OF_VIEW: 'camera.field_of_view',
  FRAME_SIZE: 'camera.frame_size',
  BASE_FWHM: 'sampling.base_fwhm',
  PIXELS_PER_FWHM: 'sampling.pixels_per_fwhm',
  TARGET_PIXELS: 'framing.target_pixels',
} as const;

export type FormulaId = (typeof FORMULA_IDS)[keyof typeof FORMULA_IDS];

interface FormulaDefinition {
  name: string;
  description: string;
  symbolic_expression: string;
  unit?: string;
  limitations?: string[];
}

/** Static metadata for each formula; the substituted values are filled per calculation. */
export const FORMULA_DEFINITIONS: Record<FormulaId, FormulaDefinition> = {
  [FORMULA_IDS.EFFECTIVE_FOCAL_LENGTH]: {
    name: 'Effective focal length',
    description: 'Native focal length scaled by reducer and extender.',
    symbolic_expression: 'f_eff = f_native × M_reducer × M_extender',
    unit: 'mm',
  },
  [FORMULA_IDS.FOCAL_RATIO]: {
    name: 'Focal ratio',
    description: 'Effective focal length divided by aperture.',
    symbolic_expression: 'N = f_eff / D',
  },
  [FORMULA_IDS.CLEAR_AREA]: {
    name: 'Clear collecting area',
    description: 'Annular area of the aperture minus the central obstruction.',
    symbolic_expression: 'A_clear = (π/4)(D² − d_obstruction²)',
    unit: 'mm²',
  },
  [FORMULA_IDS.EFFECTIVE_AREA]: {
    name: 'Effective collecting area',
    description: 'Clear area reduced by optical transmission.',
    symbolic_expression: 'A_eff = A_clear × T_optics',
    unit: 'mm²',
  },
  [FORMULA_IDS.DIFFRACTION_FWHM]: {
    name: 'Diffraction FWHM',
    description: 'Approximate diffraction-limited FWHM for a circular aperture.',
    symbolic_expression: 'θ_diff ≈ 1.028 λ / D',
    unit: 'arcsec',
    limitations: ['Assumes an unobstructed circular aperture at the reference wavelength.'],
  },
  [FORMULA_IDS.IMAGE_SCALE]: {
    name: 'Image scale',
    description: 'On-sky angle subtended by one pixel (small-angle approximation).',
    symbolic_expression: 's = 206.265 × p_µm / f_mm',
    unit: 'arcsec/px',
  },
  [FORMULA_IDS.FIELD_OF_VIEW]: {
    name: 'Field of view',
    description: 'Exact angular extent of a sensor dimension.',
    symbolic_expression: 'FOV = 2 · arctan(dimension / 2f)',
    unit: 'deg',
  },
  [FORMULA_IDS.FRAME_SIZE]: {
    name: 'Frame size',
    description: 'Uncompressed size of one frame.',
    symbolic_expression: 'B = N_pixels × stored_bits / 8',
    unit: 'bytes',
  },
  [FORMULA_IDS.BASE_FWHM]: {
    name: 'Base star FWHM',
    description: 'Quadrature sum of seeing, diffraction, optical, and focus FWHM.',
    symbolic_expression: 'FWHM_base = √(FWHM_seeing² + FWHM_diff² + FWHM_optics² + FWHM_focus²)',
    unit: 'arcsec',
  },
  [FORMULA_IDS.PIXELS_PER_FWHM]: {
    name: 'Pixels per FWHM',
    description: 'Sampling ratio of the base FWHM to the image scale.',
    symbolic_expression: 'P = FWHM_base / s',
    unit: 'px',
  },
  [FORMULA_IDS.TARGET_PIXELS]: {
    name: 'Target pixel size',
    description: 'Angular target extent divided by image scale.',
    symbolic_expression: 'px = θ_target / s',
    unit: 'px',
  },
};

export interface BuildFormulaInput {
  substituted?: string;
  intermediates?: FormulaIntermediateValue[];
  result: number | null;
  dependencyPaths?: string[];
  assumptions?: string[];
}

/** Build a substituted {@link FormulaRecord} for a formula id. */
export function buildFormula(id: FormulaId, input: BuildFormulaInput): FormulaRecord {
  const def = FORMULA_DEFINITIONS[id];
  return {
    formula_id: id,
    name: def.name,
    description: def.description,
    symbolic_expression: def.symbolic_expression,
    ...(input.substituted != null ? { substituted_expression: input.substituted } : {}),
    ...(input.intermediates != null ? { intermediate_values: input.intermediates } : {}),
    result_value: input.result,
    ...(def.unit != null ? { unit: def.unit } : {}),
    ...(input.assumptions != null ? { assumptions: input.assumptions } : {}),
    ...(def.limitations != null ? { limitations: def.limitations } : {}),
    ...(input.dependencyPaths != null ? { dependency_paths: input.dependencyPaths } : {}),
  };
}
