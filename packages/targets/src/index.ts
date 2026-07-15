/**
 * @ste/targets — target framing and fit (spec v0.4 §7, §49; v0.9 §8).
 *
 * Projects a target's angular geometry onto the sensor to produce pixel
 * dimensions, margins, a fit classification, and image-circle coverage. The
 * target's position angle is applied as a rotation between the target's own axes
 * and the sensor axes; for R0 the sensor Y axis is assumed aligned with the
 * axis the position angle is measured from (camera roll = 0), an assumption the
 * engine surfaces. Scenario-driven field orientation arrives in R2.
 */

import {
  arcminToArcsec,
  arcsec,
  type Arcminutes,
  type Arcseconds,
  type Millimeters,
} from '@ste/units';
import type { FitStatus } from '@ste/schema';

/** Below this per-side margin the framing is `tight` (10% of the sensor edge). */
export const TIGHT_MARGIN_FRACTION = 0.1;

/** When the target spans less than this of BOTH sensor axes, the field is in excess. */
export const EXCESS_FIELD_FRACTION = 0.25;

/**
 * Axis-aligned bounding half-extents (arcsec) of an elliptical/rectangular
 * target of half-width `a` and half-height `b` (its own axes) rotated by
 * `positionAngleDeg` relative to the sensor. Uses the ellipse bounding-box
 * form; a rectangle's box is never smaller, so this is a slight under-estimate
 * for rectangles (acceptable for a framing estimate).
 */
export function rotatedBoundingBox(
  halfWidth: Arcseconds,
  halfHeight: Arcseconds,
  positionAngleDeg: number,
): { halfXArcsec: Arcseconds; halfYArcsec: Arcseconds } {
  const a = halfWidth as number;
  const b = halfHeight as number;
  const t = (positionAngleDeg * Math.PI) / 180;
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  const halfX = Math.hypot(a * cos, b * sin);
  const halfY = Math.hypot(a * sin, b * cos);
  return { halfXArcsec: arcsec(halfX), halfYArcsec: arcsec(halfY) };
}

/** Angular size (arcsec) → pixels at the given image scale (arcsec/px). */
export function angularToPixels(angular: Arcseconds, imageScale: Arcseconds): number {
  return (angular as number) / (imageScale as number);
}

export interface FramingInputs {
  widthArcmin: number;
  heightArcmin: number;
  positionAngleDeg: number;
  imageScaleXArcsecPerPx: Arcseconds;
  imageScaleYArcsecPerPx: Arcseconds;
  sensorWidthPx: number;
  sensorHeightPx: number;
  /** Recommended empty margin per side; defaults to `TIGHT_MARGIN_FRACTION`. */
  recommendedMarginFraction?: number | null;
}

export interface FramingResult {
  targetWidthPx: number;
  targetHeightPx: number;
  /** Fraction of the sensor width NOT covered by the target (both sides summed). */
  marginXFraction: number;
  marginYFraction: number;
  /** Smaller per-side margin across the two axes; negative when the target overflows. */
  minimumMarginFraction: number;
  fitStatus: FitStatus;
}

/** Compute target pixel dimensions, margins, and fit classification. */
export function computeFraming(inputs: FramingInputs): FramingResult {
  const halfW = arcminToArcsec((inputs.widthArcmin / 2) as Arcminutes);
  const halfH = arcminToArcsec((inputs.heightArcmin / 2) as Arcminutes);
  const box = rotatedBoundingBox(halfW, halfH, inputs.positionAngleDeg);

  const targetWidthPx = 2 * angularToPixels(box.halfXArcsec, inputs.imageScaleXArcsecPerPx);
  const targetHeightPx = 2 * angularToPixels(box.halfYArcsec, inputs.imageScaleYArcsecPerPx);

  const marginXFraction = (inputs.sensorWidthPx - targetWidthPx) / inputs.sensorWidthPx;
  const marginYFraction = (inputs.sensorHeightPx - targetHeightPx) / inputs.sensorHeightPx;
  // Per-side margin is half the total empty fraction on that axis.
  const minimumMarginFraction = Math.min(marginXFraction, marginYFraction) / 2;

  const recommended = inputs.recommendedMarginFraction ?? TIGHT_MARGIN_FRACTION;
  const fitStatus = classifyFit(
    marginXFraction,
    marginYFraction,
    targetWidthPx / inputs.sensorWidthPx,
    targetHeightPx / inputs.sensorHeightPx,
    recommended,
  );

  return {
    targetWidthPx,
    targetHeightPx,
    marginXFraction,
    marginYFraction,
    minimumMarginFraction,
    fitStatus,
  };
}

function classifyFit(
  marginX: number,
  marginY: number,
  fillX: number,
  fillY: number,
  recommendedPerSide: number,
): FitStatus {
  if (marginX < 0 || marginY < 0) return 'does_not_fit';
  const minPerSide = Math.min(marginX, marginY) / 2;
  if (minPerSide < recommendedPerSide) return 'tight';
  if (fillX < EXCESS_FIELD_FRACTION && fillY < EXCESS_FIELD_FRACTION) return 'excess_field';
  return 'good';
}

/**
 * Image-circle coverage: the fraction of the sensor diagonal reached by the
 * optics' image circle. 1.0 means the circle fully covers the sensor corners;
 * below 1.0 the corners fall outside the well-illuminated field.
 */
export function imageCircleCoverage(
  imageCircleDiameterMm: Millimeters | null,
  sensorWidthMm: Millimeters | null,
  sensorHeightMm: Millimeters | null,
): number | null {
  if (imageCircleDiameterMm == null || sensorWidthMm == null || sensorHeightMm == null) {
    return null;
  }
  const diagonal = Math.hypot(sensorWidthMm as number, sensorHeightMm as number);
  if (diagonal === 0) return null;
  return Math.min(1, (imageCircleDiameterMm as number) / diagonal);
}
