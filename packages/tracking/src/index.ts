/**
 * @ste/tracking — during-exposure star motion (spec v0.4 §17–18; v0.9 §25).
 *
 * Models the deterministic sky-frame error (drift + periodic) as a path of
 * tangent-plane offsets over the exposure, from which the blur package forms a
 * motion covariance. Random jitter/vibration are treated analytically as an
 * added isotropic variance (v0.4 §18: "high-frequency jitter may be analytic").
 *
 * Basic mode (R2): error components are already on-sky angular quantities in the
 * `TrackingErrorModel`; no mount Jacobian is needed. Peak-to-peak periodic
 * amplitude is never silently treated as RMS (v0.4 §3.1).
 */

import { covarianceOf, mag2, vec2, type Mat2, type Vec2 } from '@ste/units';
import type { AngularDirection, TrackingErrorModel } from '@ste/schema';

/** Minimum path samples across an exposure (v0.4 §18). */
export const MIN_EXPOSURE_SAMPLES = 128;
/** Deterministic phase samples when the periodic phase is unknown (v0.4 §18). */
export const NORMAL_PHASE_COUNT = 24;
export const DETAILED_PHASE_COUNT = 72;

/** Map an angular-error direction to a tangent-plane unit vector (x=RA/az, y=Dec/alt). */
export function directionToUnitVec(direction: AngularDirection | undefined): Vec2 {
  switch (direction) {
    case 'declination':
    case 'axis_2':
    case 'altitude':
    case 'image_y':
      return vec2(0, 1);
    case 'right_ascension':
    case 'axis_1':
    case 'azimuth':
    case 'image_x':
    default:
      return vec2(1, 0);
  }
}

export interface TrackingComponents {
  /** Drift velocity vector (arcsec per second) in the tangent plane. */
  driftArcsecPerSec: Vec2;
  /** Periodic-error peak amplitude vector (arcsec). */
  periodicPeakArcsec: Vec2;
  periodicPeriodS: number | null;
  /** Known phase in radians, or `null` when unknown (→ sample phases). */
  periodicPhaseRad: number | null;
  /** Combined random jitter+vibration RMS (arcsec), added isotropically. */
  jitterRmsArcsec: number;
}

/** Extract normalized on-sky tracking components from the schema error model. */
export function extractComponents(model: TrackingErrorModel | undefined): TrackingComponents {
  const drift = model?.drift_rate;
  const driftPerSec = drift?.value_arcsec_per_min != null ? drift.value_arcsec_per_min / 60 : 0;
  const driftDir = directionToUnitVec(drift?.direction);

  const pe = model?.periodic_error;
  let peakArcsec = 0;
  if (pe?.amplitude_arcsec != null) {
    peakArcsec =
      pe.amplitude_statistic === 'peak_to_peak' ? pe.amplitude_arcsec / 2 : pe.amplitude_arcsec;
  }
  const peDir = directionToUnitVec(pe?.direction);
  const periodicPhaseRad = pe?.phase_deg != null ? (pe.phase_deg * Math.PI) / 180 : null;

  const jitter = model?.tracking_jitter?.value ?? 0;
  const vibration = model?.vibration?.rms_arcsec ?? 0;
  const jitterRmsArcsec = Math.sqrt(jitter * jitter + vibration * vibration);

  return {
    driftArcsecPerSec: vec2(driftDir.x * driftPerSec, driftDir.y * driftPerSec),
    periodicPeakArcsec: vec2(peDir.x * peakArcsec, peDir.y * peakArcsec),
    periodicPeriodS: pe?.period_s ?? null,
    periodicPhaseRad,
    jitterRmsArcsec,
  };
}

export interface DuringExposureResult {
  /** Tangent-plane path (arcsec), starting at the origin (ideal position). */
  path: Vec2[];
  /** Motion covariance about the path centroid (arcsec²). */
  motionCovariance: Mat2;
  /** Maximum excursion from the ideal position (arcsec). */
  maxDisplacementArcsec: number;
  /** RMS excursion from the ideal position (arcsec). */
  rmsDisplacementArcsec: number;
}

/**
 * Simulate the deterministic star path across one exposure at a given periodic
 * phase (v0.4 §18). The path starts at the origin (the ideal tracked position).
 */
export function simulateDuringExposure(
  c: TrackingComponents,
  exposureS: number,
  phaseRad: number,
  sampleCount: number = MIN_EXPOSURE_SAMPLES,
): DuringExposureResult {
  const n = Math.max(2, sampleCount);
  const path: Vec2[] = [];
  const hasPeriodic = c.periodicPeriodS != null && c.periodicPeriodS > 0;
  const omega = hasPeriodic ? (2 * Math.PI) / (c.periodicPeriodS as number) : 0;
  // Reference the periodic term to t=0 so the path starts at the ideal position.
  const periodic0 = hasPeriodic ? Math.sin(phaseRad) : 0;

  let maxDisp = 0;
  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    const t = (i * exposureS) / (n - 1);
    const driftX = c.driftArcsecPerSec.x * t;
    const driftY = c.driftArcsecPerSec.y * t;
    const s = hasPeriodic ? Math.sin(omega * t + phaseRad) - periodic0 : 0;
    const r = vec2(driftX + c.periodicPeakArcsec.x * s, driftY + c.periodicPeakArcsec.y * s);
    path.push(r);
    const d = mag2(r);
    if (d > maxDisp) maxDisp = d;
    sumSq += d * d;
  }
  return {
    path,
    motionCovariance: covarianceOf(path),
    maxDisplacementArcsec: maxDisp,
    rmsDisplacementArcsec: Math.sqrt(sumSq / n),
  };
}

export interface PhaseSweepResult {
  /** Number of phases sampled (1 when the phase is known). */
  phaseCount: number;
  median: DuringExposureResult;
  percentile95: DuringExposureResult;
  worst: DuringExposureResult;
}

function pick(results: DuringExposureResult[], fraction: number): DuringExposureResult {
  const sorted = [...results].sort((a, b) => a.maxDisplacementArcsec - b.maxDisplacementArcsec);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round(fraction * (sorted.length - 1))));
  return sorted[idx]!;
}

/**
 * Evaluate the exposure across periodic phases (v0.4 §18). When the phase is
 * known (or there is no periodic term) a single evaluation is used; otherwise
 * `phaseCount` phases are swept and the median / 95th / worst by max displacement
 * are returned.
 */
export function sweepPhases(
  c: TrackingComponents,
  exposureS: number,
  options: { phaseCount?: number; sampleCount?: number } = {},
): PhaseSweepResult {
  const hasPeriodic = c.periodicPeriodS != null && c.periodicPeriodS > 0;
  if (!hasPeriodic || c.periodicPhaseRad != null) {
    const single = simulateDuringExposure(
      c,
      exposureS,
      c.periodicPhaseRad ?? 0,
      options.sampleCount,
    );
    return { phaseCount: 1, median: single, percentile95: single, worst: single };
  }

  const phaseCount = options.phaseCount ?? NORMAL_PHASE_COUNT;
  const results: DuringExposureResult[] = [];
  for (let i = 0; i < phaseCount; i++) {
    const phase = (2 * Math.PI * i) / phaseCount;
    results.push(simulateDuringExposure(c, exposureS, phase, options.sampleCount));
  }
  return {
    phaseCount,
    median: pick(results, 0.5),
    percentile95: pick(results, 0.95),
    worst: pick(results, 1),
  };
}

/** Isotropic variance (arcsec²) contributed by random jitter + vibration. */
export function jitterVarianceArcsec2(c: TrackingComponents): number {
  return c.jitterRmsArcsec * c.jitterRmsArcsec;
}

/**
 * Fraction of periodic phases whose maximum during-exposure displacement stays
 * within `thresholdArcsec` — a preliminary frame-acceptance estimate driven by
 * periodic phase (v0.4 §28). With a known phase (or no periodic term) the result
 * is 0 or 1.
 */
export function acceptanceFraction(
  c: TrackingComponents,
  exposureS: number,
  thresholdArcsec: number,
  options: { phaseCount?: number } = {},
): number {
  const hasPeriodic = c.periodicPeriodS != null && c.periodicPeriodS > 0;
  if (!hasPeriodic || c.periodicPhaseRad != null) {
    const r = simulateDuringExposure(c, exposureS, c.periodicPhaseRad ?? 0);
    return r.maxDisplacementArcsec <= thresholdArcsec ? 1 : 0;
  }
  const phaseCount = options.phaseCount ?? NORMAL_PHASE_COUNT;
  let pass = 0;
  for (let i = 0; i < phaseCount; i++) {
    const phase = (2 * Math.PI * i) / phaseCount;
    if (simulateDuringExposure(c, exposureS, phase).maxDisplacementArcsec <= thresholdArcsec) {
      pass++;
    }
  }
  return pass / phaseCount;
}

export type { Mat2, Vec2 };
