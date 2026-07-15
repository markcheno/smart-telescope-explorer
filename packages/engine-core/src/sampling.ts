/**
 * Sampling calculation (spec v0.9 §23 R0-012; v0.4 §22).
 *
 * Combines the seeing, diffraction, optical, and focus FWHM contributions in
 * quadrature into a base star FWHM, then classifies how well the pixel scale
 * samples it. Focus blur is out of scope until a later release and defaults to
 * absent (treated as zero when the others are known).
 */

import { arcsec, rssArcsec, type Arcseconds } from '@ste/units';
import type { SamplingClassification } from '@ste/schema';

export interface SamplingContributions {
  seeingArcsec: Arcseconds | null;
  diffractionArcsec: Arcseconds | null;
  opticalArcsec: Arcseconds | null;
  focusArcsec?: Arcseconds | null;
}

/**
 * Base star FWHM = √(Σ FWHM_i²) over the known contributions (v0.4 §22).
 * Returns `null` when no contribution is known. Absent contributions are treated
 * as zero, but the result confidence should reflect what was missing.
 */
export function baseFwhm(contributions: SamplingContributions): Arcseconds | null {
  const parts = [
    contributions.seeingArcsec,
    contributions.diffractionArcsec,
    contributions.opticalArcsec,
    contributions.focusArcsec ?? null,
  ].filter((v): v is Arcseconds => v != null);
  if (parts.length === 0) return null;
  return rssArcsec(...parts);
}

/** Pixels across the base FWHM: P = FWHM / image_scale (v0.4 §22). */
export function pixelsPerFwhm(
  baseFwhmArcsec: Arcseconds,
  imageScaleArcsecPerPx: Arcseconds,
): number {
  return (baseFwhmArcsec as number) / (imageScaleArcsecPerPx as number);
}

/** Sampling-classification boundaries (pixels/FWHM), per the v0.4 §22 table. */
export const SAMPLING_BOUNDARIES = {
  strongUnder: 1.0,
  moderateUnder: 1.5,
  well: 3.0,
  over: 5.0,
} as const;

/** Classify a pixels/FWHM ratio into the spec's sampling bands (v0.4 §22). */
export function classifySampling(pixelsPerFwhmValue: number | null): SamplingClassification {
  if (pixelsPerFwhmValue == null || !Number.isFinite(pixelsPerFwhmValue)) return 'unknown';
  if (pixelsPerFwhmValue < SAMPLING_BOUNDARIES.strongUnder) return 'severely_undersampled';
  if (pixelsPerFwhmValue < SAMPLING_BOUNDARIES.moderateUnder) return 'moderately_undersampled';
  if (pixelsPerFwhmValue < SAMPLING_BOUNDARIES.well) return 'well_sampled';
  if (pixelsPerFwhmValue < SAMPLING_BOUNDARIES.over) return 'oversampled';
  return 'severely_oversampled';
}

/** Convenience: the average of x/y image scales as a single sampling scale. */
export function meanImageScale(scaleXArcsec: Arcseconds, scaleYArcsec: Arcseconds): Arcseconds {
  return arcsec(((scaleXArcsec as number) + (scaleYArcsec as number)) / 2);
}
