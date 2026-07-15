/**
 * @ste/blur — blur covariance and the final star ellipse (spec v0.4 §19).
 *
 * The total blur is the convolution of the static PSF with the intra-frame
 * motion, field-rotation smear, and pixel response — i.e. the sum of their 2×2
 * covariances (variances add under convolution). Eigen-decomposing the total
 * gives the major/minor FWHM and elongation. All covariances are in arcsec².
 */

import {
  arcsec,
  eigen2,
  fwhmToSigma,
  mat2,
  matSum2,
  raw,
  sigmaToFwhm,
  type Arcseconds,
  type Mat2,
} from '@ste/units';

/** Isotropic covariance σ²·I from a FWHM (arcsec): the static PSF contribution. */
export function isotropicCovariance(fwhmArcsec: Arcseconds): Mat2 {
  const sigma = raw(fwhmToSigma(fwhmArcsec));
  const v = sigma * sigma;
  return mat2(v, 0, v);
}

/**
 * Pixel-response covariance: a top-hat of width = image scale contributes
 * variance s²/12 per axis (spec v0.4 §19).
 */
export function pixelCovariance(scaleXArcsec: Arcseconds, scaleYArcsec: Arcseconds): Mat2 {
  const sx = raw(scaleXArcsec);
  const sy = raw(scaleYArcsec);
  return mat2((sx * sx) / 12, 0, (sy * sy) / 12);
}

export interface BlurEllipse {
  majorFwhmArcsec: number;
  minorFwhmArcsec: number;
  elongation: number;
  /** Major-axis orientation, degrees. */
  axisAngleDeg: number;
}

/**
 * Combine covariance contributions into the total blur ellipse (spec v0.4 §19).
 * Major/minor FWHM = 2.355·√λ of the summed covariance; elongation = major/minor.
 */
export function totalBlur(contributions: readonly Mat2[]): BlurEllipse {
  const total = matSum2(contributions);
  const { major, minor, angleRad } = eigen2(total);
  const majorFwhm = raw(sigmaToFwhm(arcsec(Math.sqrt(major))));
  const minorFwhm = raw(sigmaToFwhm(arcsec(Math.sqrt(minor))));
  const elongation = minorFwhm > 0 ? majorFwhm / minorFwhm : 1;
  return {
    majorFwhmArcsec: majorFwhm,
    minorFwhmArcsec: minorFwhm,
    elongation,
    axisAngleDeg: (angleRad * 180) / Math.PI,
  };
}

/** FWHM (arcsec) implied by a single covariance's larger axis — for per-contribution display. */
export function contributionFwhmArcsec(cov: Mat2): number {
  const { major } = eigen2(cov);
  return raw(sigmaToFwhm(arcsec(Math.sqrt(major))));
}

/** Elongation-quality bands (spec v0.4 §19). */
export const ELONGATION_GOOD = 1.1;
export const ELONGATION_MARGINAL = 1.25;

export type ElongationQuality = 'good' | 'marginal' | 'poor' | 'unknown';

export function classifyElongation(elongation: number | null): ElongationQuality {
  if (elongation == null || !Number.isFinite(elongation)) return 'unknown';
  if (elongation < ELONGATION_GOOD) return 'good';
  if (elongation <= ELONGATION_MARGINAL) return 'marginal';
  return 'poor';
}
