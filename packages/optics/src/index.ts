/**
 * @ste/optics — optical geometry and blur (spec v0.4 §8, §22).
 *
 * Pure functions over branded quantities (`@ste/units`); no physical constants
 * live here beyond the domain-specific ones the spec fixes for this package (the
 * diffraction FWHM coefficient and the default reference wavelength). Unit
 * conversions defer to `@ste/units`, which owns arcsec/radian and mm/µm factors.
 */

import {
  arcsec,
  mm,
  mm2,
  nmToMm,
  nm,
  rad,
  radToArcsec,
  um,
  umToMm,
  type Arcseconds,
  type Fraction,
  type Micrometers,
  type Millimeters,
  type Nanometers,
  type SquareMillimeters,
} from '@ste/units';
import type { OpticalBlurInput, OpticalQualityPreset } from '@ste/schema';

/**
 * Coefficient relating the diffraction FWHM to λ/D for a circular aperture
 * (spec v0.4 §8: θ_diffraction_FWHM ≈ 1.028 λ/D). Distinct from the Airy
 * first-minimum coefficient 1.22.
 */
export const DIFFRACTION_FWHM_COEFFICIENT = 1.028;

/** Default reference wavelength for diffraction when none is supplied (550 nm, visual band). */
export const DEFAULT_REFERENCE_WAVELENGTH_NM = 550;

// --- focal geometry -------------------------------------------------------

/** Effective focal length: f_native × reducer × extender (spec v0.4 §8). */
export function effectiveFocalLength(
  nativeFocalLength: Millimeters,
  reducerMultiplier: number,
  extenderMultiplier: number,
): Millimeters {
  return mm((nativeFocalLength as number) * reducerMultiplier * extenderMultiplier);
}

/** Focal ratio N = f_effective / D (dimensionless) (spec v0.4 §8). */
export function focalRatio(effectiveFocalLengthMm: Millimeters, apertureMm: Millimeters): number {
  return (effectiveFocalLengthMm as number) / (apertureMm as number);
}

/**
 * Clear collecting area A = (π/4)(D² − d_obstruction²) (spec v0.4 §8).
 * Obstruction defaults to zero when unknown.
 */
export function clearApertureArea(
  apertureMm: Millimeters,
  obstructionMm: Millimeters = mm(0),
): SquareMillimeters {
  const d = apertureMm as number;
  const o = obstructionMm as number;
  return mm2((Math.PI / 4) * (d * d - o * o));
}

/** Effective collecting area A_effective = A_clear × T_optics (spec v0.4 §8). */
export function effectiveApertureArea(
  clearAreaMm2: SquareMillimeters,
  transmission: Fraction,
): SquareMillimeters {
  return mm2((clearAreaMm2 as number) * (transmission as number));
}

// --- diffraction & spot ---------------------------------------------------

/**
 * Approximate diffraction FWHM ≈ 1.028 λ/D, returned in arcseconds
 * (spec v0.4 §8). λ and D are converted to a common unit before forming the
 * dimensionless ratio, which is the small-angle value in radians.
 */
export function diffractionFwhm(
  apertureMm: Millimeters,
  wavelengthNm: Nanometers = nm(DEFAULT_REFERENCE_WAVELENGTH_NM),
): Arcseconds {
  const lambdaMm = nmToMm(wavelengthNm) as number;
  const ratio = DIFFRACTION_FWHM_COEFFICIENT * (lambdaMm / (apertureMm as number));
  return radToArcsec(rad(ratio));
}

/**
 * Spot-diameter → on-sky angle: θ = s / f (small angle), with the spot in µm and
 * focal length in mm (spec v0.4 §8: θ_spot = 206.265 · s_µm / f_mm). The 206.265
 * factor is the arcsec-per-radian constant scaled for µm/mm, applied via unit
 * conversions rather than as a literal here.
 */
export function spotDiameterToArcsec(
  spotDiameterUm: Micrometers,
  focalLengthMm: Millimeters,
): Arcseconds {
  const spotMm = umToMm(spotDiameterUm) as number;
  return radToArcsec(rad(spotMm / (focalLengthMm as number)));
}

// --- optical blur resolution ----------------------------------------------

/**
 * Assumed optical-quality FWHM (arcsec) for each quality preset. Only
 * `typical_inexpensive_lens` = 2.0″ is anchored by the spec's worked F01 example
 * (v0.9 §9); the others are reasonable engineering placeholders and MUST be
 * surfaced as low/moderate-confidence assumptions by the engine.
 */
export const QUALITY_PRESET_FWHM_ARCSEC: Record<
  Exclude<OpticalQualityPreset, 'unknown'>,
  number
> = {
  excellent: 1.0,
  good: 1.5,
  typical_inexpensive_lens: 2.0,
  poor_edge_performance: 3.5,
};

/**
 * Resolve an optical-blur input to an on-sky FWHM in arcseconds, or `null` when
 * it cannot be determined (representation/preset unknown). `focalLengthMm` is
 * required only for the `spot_diameter_um` representation.
 *
 * Returns the FWHM plus whether it rests on an assumption (quality preset), so
 * the engine can attach the right confidence and assumption record.
 */
export function resolveOpticalFwhm(
  blur: OpticalBlurInput,
  focalLengthMm: Millimeters | null,
): { fwhmArcsec: Arcseconds | null; assumed: boolean } {
  switch (blur.representation) {
    case 'fwhm_arcsec':
      return blur.value == null
        ? { fwhmArcsec: null, assumed: false }
        : { fwhmArcsec: arcsec(blur.value), assumed: false };
    case 'spot_diameter_um':
      if (blur.value == null || focalLengthMm == null) {
        return { fwhmArcsec: null, assumed: false };
      }
      return {
        fwhmArcsec: spotDiameterToArcsec(um(blur.value), focalLengthMm),
        assumed: false,
      };
    case 'quality_preset': {
      const preset = blur.preset_class;
      if (preset == null || preset === 'unknown') return { fwhmArcsec: null, assumed: true };
      return { fwhmArcsec: arcsec(QUALITY_PRESET_FWHM_ARCSEC[preset]), assumed: true };
    }
    case 'unknown':
    default:
      return { fwhmArcsec: null, assumed: false };
  }
}
