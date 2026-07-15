/**
 * R3 result-group builders (spec v0.4 §23, §25, §27–29; v0.9 §25 R3).
 *
 * Sensitivity, session simulation, and stack geometry — the pieces that turn the
 * exposure metric from preliminary into a real relative stacked-SNR. Shared
 * helpers (`deriveSnrContext`, `qualityAcceptanceAt`, `sessionAt`) are reused by
 * the upgraded exposure sweep so the sweep and the session group stay consistent.
 */

import { airmass } from '@ste/astronomy';
import { clearApertureArea } from '@ste/optics';
import {
  atmosphericThroughput,
  readNoiseTimeConstantS,
  relativeStackScore,
  skyElectronRatePerPixel,
  throughputFactors,
} from '@ste/sensitivity';
import { simulateSession, stackGeometry, type SessionResult } from '@ste/session';
import {
  acceptanceFraction,
  extractComponents,
  sweepPhases,
  type TrackingComponents,
} from '@ste/tracking';
import { mm, raw } from '@ste/units';
import type {
  DesignDocument,
  SensitivityResults,
  SessionResults,
  StackGeometryResults,
} from '@ste/schema';
import { CalcContext, type DerivedGeometry } from './groups.js';
import type { DerivedKinematics, DerivedTracking } from './groups-r2.js';
import { confidence, decimals, INTEGER_PRECISION, unavailable, valid } from './result.js';

const finite = (v: number | null | undefined): number | null =>
  v != null && Number.isFinite(v) ? v : null;
const pos = (v: number | null | undefined): number | null =>
  v != null && Number.isFinite(v) && v > 0 ? v : null;
const nonNeg = (v: number | null | undefined): number | null =>
  v != null && Number.isFinite(v) && v >= 0 ? v : null;

const DEFAULT_EXTINCTION = 0.15;
const DEFAULT_TRANSMISSION = 0.9;
const DEFAULT_QE = 0.7;
/** Assumed read-noise time constant when sky rate / read noise are unknown (s). */
const DEFAULT_TRN_S = 15;
const DEG_TO_RAD = Math.PI / 180;

// --- shared SNR context ---------------------------------------------------

export interface SnrContext {
  effectiveAreaMm2: number | null;
  effectiveQe: number | null;
  pixelSolidAngleArcsec2: number | null;
  atmosphericThroughput: number;
  pointSourceThroughput: number | null;
  extendedPerPixelThroughput: number | null;
  /** Read-noise time constant (s) driving the exposure shape. */
  readNoiseTimeConstantS: number;
  readNoiseTimeConstantAssumed: boolean;
}

/** Effective collecting area × transmission (transmission assumed when unknown). */
function effectiveArea(doc: DesignDocument): number | null {
  const aperture = pos(doc.optics.aperture_mm);
  if (aperture == null) return null;
  const obstruction = nonNeg(doc.optics.central_obstruction_mm) ?? 0;
  if (obstruction >= aperture) return null;
  const clear = raw(clearApertureArea(mm(aperture), mm(obstruction)));
  const transmission = finite(doc.optics.optical_transmission_fraction) ?? DEFAULT_TRANSMISSION;
  return clear * transmission;
}

/** Derive the throughput factors and read-noise time constant for SNR/exposure. */
export function deriveSnrContext(
  doc: DesignDocument,
  geometry: DerivedGeometry,
  kinematics: DerivedKinematics | null,
): SnrContext {
  const area = effectiveArea(doc);
  const qe = finite(doc.camera.noise?.effective_quantum_efficiency_fraction) ?? DEFAULT_QE;
  const scaleX = geometry.imageScaleXArcsec;
  const scaleY = geometry.imageScaleYArcsec;
  const pixelSolidAngle = scaleX != null && scaleY != null ? raw(scaleX) * raw(scaleY) : null;

  const extinction =
    finite(doc.scenario.conditions.extinction_mag_per_airmass) ?? DEFAULT_EXTINCTION;
  const refAlt = kinematics?.referenceAltitudeDeg ?? null;
  const refAirmass = refAlt != null && refAlt > 0 ? (airmass(refAlt) ?? 1) : 1;
  const atm = atmosphericThroughput(extinction, refAirmass);

  const filterTarget = finite(doc.filter.broadband_transmission_fraction) ?? 1;
  const factors =
    area != null && pixelSolidAngle != null
      ? throughputFactors({
          effectiveAreaMm2: area,
          effectiveQe: qe,
          filterTargetTransmission: filterTarget,
          pixelSolidAngleArcsec2: pixelSolidAngle,
        })
      : null;

  // Read-noise time constant from sky electron rate + read noise, else assumed.
  const skyMag = finite(doc.scenario.conditions.sky_brightness_mag_arcsec2);
  const readNoise = pos(doc.camera.noise?.read_noise_e_rms);
  let tRn = DEFAULT_TRN_S;
  let tRnAssumed = true;
  if (skyMag != null && readNoise != null && area != null && pixelSolidAngle != null) {
    const skyRate = skyElectronRatePerPixel({
      skyBrightnessMagArcsec2: skyMag,
      effectiveAreaMm2: area,
      pixelSolidAngleArcsec2: pixelSolidAngle,
      effectiveQe: qe,
      filterSkyTransmission: finite(doc.filter.sky_transmission_fraction) ?? 1,
      atmosphericThroughput: atm,
    });
    const darkRate = nonNeg(doc.camera.noise?.dark_current_e_per_px_s) ?? 0;
    const computed = readNoiseTimeConstantS(readNoise, skyRate + darkRate);
    if (computed != null) {
      tRn = computed;
      tRnAssumed = false;
    }
  }

  return {
    effectiveAreaMm2: area,
    effectiveQe: qe,
    pixelSolidAngleArcsec2: pixelSolidAngle,
    atmosphericThroughput: atm,
    pointSourceThroughput: factors?.pointSource ?? null,
    extendedPerPixelThroughput: factors?.extendedPerPixel ?? null,
    readNoiseTimeConstantS: tRn,
    readNoiseTimeConstantAssumed: tRnAssumed,
  };
}

// --- shared quality acceptance + session at an exposure -------------------

/** Corner radius (px) and mean image scale (arcsec/px) for motion/rotation → px. */
function frameScale(
  geometry: DerivedGeometry,
): { cornerRadiusPx: number; meanScale: number } | null {
  const px = geometry.effectiveHorizontalPixels;
  const py = geometry.effectiveVerticalPixels;
  const scaleX = geometry.imageScaleXArcsec;
  const scaleY = geometry.imageScaleYArcsec;
  if (px == null || py == null || scaleX == null || scaleY == null) return null;
  return {
    cornerRadiusPx: 0.5 * Math.hypot(px, py),
    meanScale: (raw(scaleX) + raw(scaleY)) / 2,
  };
}

export interface QualityAt {
  acceptance: number;
  motionPx: number;
  rotationPx: number;
}

/** Fraction of frames passing motion + rotation thresholds at an exposure. */
export function qualityAcceptanceAt(
  doc: DesignDocument,
  components: TrackingComponents,
  geometry: DerivedGeometry,
  kinematics: DerivedKinematics | null,
  exposureS: number,
): QualityAt {
  const fs = frameScale(geometry);
  if (fs == null) return { acceptance: 1, motionPx: 0, rotationPx: 0 };

  const motionThresholdPx = pos(doc.tracking.quality_thresholds?.maximum_motion_pixels) ?? 1;
  const rotationThresholdPx =
    pos(doc.tracking.quality_thresholds?.maximum_corner_rotation_pixels) ?? 1;

  const motionArcsec = sweepPhases(components, exposureS).percentile95.maxDisplacementArcsec;
  const motionPx = motionArcsec / fs.meanScale;

  const isAltAz = kinematics?.architecture === 'alt_azimuth';
  const rotationRateRadPerS = isAltAz
    ? Math.abs(kinematics?.parallacticRateDegPerS ?? 0) * DEG_TO_RAD
    : 0;
  const rotationPx = rotationRateRadPerS * exposureS * fs.cornerRadiusPx;

  const trackingAcceptance = acceptanceFraction(
    components,
    exposureS,
    motionThresholdPx * fs.meanScale,
  );
  const rotationAcceptance = Math.min(
    1,
    Math.max(0, 1 - Math.max(0, (rotationPx - rotationThresholdPx) / rotationThresholdPx)),
  );
  return { acceptance: trackingAcceptance * rotationAcceptance, motionPx, rotationPx };
}

/** Frame overhead (s): readout + transfer between exposures. */
export function frameOverheadS(doc: DesignDocument): number {
  return (
    (nonNeg(doc.camera.readout?.readout_time_s) ?? 0) +
    (nonNeg(doc.camera.readout?.transfer_time_s) ?? 0)
  );
}

/** Environmental frame-loss probabilities from the scenario conditions. */
function environmentalLosses(doc: DesignDocument): number[] {
  const c = doc.scenario.conditions;
  const losses: number[] = [];
  const env = nonNeg(c.environmental_frame_loss_fraction);
  const horizon = nonNeg(c.horizon_obstruction_loss_fraction);
  if (env != null) losses.push(env);
  if (horizon != null) losses.push(horizon);
  return losses;
}

/** Run the session simulation at an exposure (shared by the session group + sweep). */
export function sessionAt(
  doc: DesignDocument,
  qualityAcceptance: number,
  exposureS: number,
): SessionResult {
  const sessionDuration =
    pos(doc.scenario.session?.duration_s) ?? pos(doc.capture.total_session_override_s) ?? 3600;
  return simulateSession({
    exposureS,
    overheadS: frameOverheadS(doc),
    sessionDurationS: sessionDuration,
    qualityAcceptance,
    environmentalLossFractions: environmentalLosses(doc),
  });
}

// --- session group (R3, §27/§28) -----------------------------------------

export function computeSession(
  doc: DesignDocument,
  geometry: DerivedGeometry,
  kinematics: DerivedKinematics | null,
  ctx: CalcContext,
): { results: SessionResults; derived: { effectiveIntegrationS: number; framesAccepted: number } } {
  void ctx;
  const conf = confidence('low');
  const exposure = pos(doc.capture.exposure_s);
  if (exposure == null) {
    const dep = ['/capture/exposure_s'];
    const na = (u: string) => unavailable(u, { dependencies: dep });
    return {
      results: {
        frames_attempted: na('count'),
        frames_accepted: na('count'),
        acceptance_fraction: na('fraction'),
        effective_integration_s: na('s'),
        duty_cycle: na('fraction'),
        exposure_time_s: na('s'),
        overhead_time_s: na('s'),
        environmental_acceptance: na('fraction'),
      },
      derived: { effectiveIntegrationS: 0, framesAccepted: 0 },
    };
  }

  const components = extractComponents(doc.tracking.error_model);
  const quality = qualityAcceptanceAt(doc, components, geometry, kinematics, exposure);
  const s = sessionAt(doc, quality.acceptance, exposure);

  return {
    results: {
      frames_attempted: valid(s.framesAttempted, 'count', {
        confidence: conf,
        displayPrecision: INTEGER_PRECISION,
      }),
      frames_accepted: valid(s.framesAccepted, 'count', {
        confidence: conf,
        displayPrecision: decimals(0),
      }),
      acceptance_fraction: valid(s.acceptanceFraction, 'fraction', {
        confidence: conf,
        displayPrecision: decimals(2),
      }),
      effective_integration_s: valid(s.effectiveIntegrationS, 's', {
        confidence: conf,
        displayPrecision: INTEGER_PRECISION,
      }),
      duty_cycle: valid(s.dutyCycle, 'fraction', {
        confidence: conf,
        displayPrecision: decimals(2),
      }),
      exposure_time_s: valid(s.exposureTimeS, 's', {
        confidence: conf,
        displayPrecision: INTEGER_PRECISION,
      }),
      overhead_time_s: valid(s.overheadTimeS, 's', {
        confidence: conf,
        displayPrecision: INTEGER_PRECISION,
      }),
      environmental_acceptance: valid(s.environmentalAcceptance, 'fraction', {
        confidence: conf,
        displayPrecision: decimals(2),
      }),
    },
    derived: { effectiveIntegrationS: s.effectiveIntegrationS, framesAccepted: s.framesAccepted },
  };
}

// --- sensitivity group (R3, §23) -----------------------------------------

export function computeSensitivity(
  doc: DesignDocument,
  snr: SnrContext,
  framesAccepted: number,
  ctx: CalcContext,
): SensitivityResults {
  const conf = confidence('moderate');
  const relConf = confidence('low');
  const exposure = pos(doc.capture.exposure_s);
  const stackEff = finite(doc.capture.stack_efficiency_fraction) ?? 1;

  const assumptionIds: string[] = [];
  if (snr.readNoiseTimeConstantAssumed) {
    assumptionIds.push(
      ctx.addAssumption({
        assumption_id: 'assume.read_noise_time_constant',
        title: 'Assumed read-noise crossover',
        description:
          'Sky brightness and/or read noise were not provided; a default read-noise time ' +
          `constant of ${DEFAULT_TRN_S}s is assumed for the exposure trade-off.`,
        field_paths: [
          '/scenario/conditions/sky_brightness_mag_arcsec2',
          '/camera/noise/read_noise_e_rms',
        ],
        default_value: DEFAULT_TRN_S,
        unit: 's',
        confidence: 'low',
        affects_groups: ['sensitivity', 'exposure_sweep'],
        user_can_override: true,
      }),
    );
  }

  const score =
    exposure != null
      ? relativeStackScore(exposure, framesAccepted, snr.readNoiseTimeConstantS, stackEff)
      : null;

  const numOrNa = (v: number | null, unit: string, prec: number) =>
    v == null
      ? unavailable(unit, { dependencies: ['/optics', '/camera'] })
      : valid(v, unit, { confidence: conf, displayPrecision: decimals(prec) });

  return {
    effective_area_mm2: numOrNa(snr.effectiveAreaMm2, 'mm²', 0),
    effective_qe: numOrNa(snr.effectiveQe, 'fraction', 2),
    pixel_solid_angle_arcsec2: numOrNa(snr.pixelSolidAngleArcsec2, 'arcsec²', 2),
    atmospheric_throughput: valid(snr.atmosphericThroughput, 'fraction', {
      confidence: conf,
      displayPrecision: decimals(3),
    }),
    point_source_throughput: numOrNa(snr.pointSourceThroughput, '', 1),
    extended_per_pixel_throughput: numOrNa(snr.extendedPerPixelThroughput, '', 1),
    relative_stack_score:
      score == null
        ? unavailable('', { dependencies: ['/capture/exposure_s'] })
        : valid(score, '', { confidence: relConf, displayPrecision: decimals(2), assumptionIds }),
    photometric_available: valid<boolean>(false, ''),
  };
}

// --- stack geometry group (R3, §29) --------------------------------------

export function computeStackGeometry(
  doc: DesignDocument,
  geometry: DerivedGeometry,
  kinematics: DerivedKinematics | null,
  tracking: DerivedTracking | null,
  ctx: CalcContext,
): StackGeometryResults {
  void ctx;
  void tracking;
  const conf = confidence('low');
  const px = geometry.effectiveHorizontalPixels;
  const py = geometry.effectiveVerticalPixels;
  if (px == null || py == null) {
    const dep = ['/camera/sensor'];
    return {
      common_coverage_fraction: unavailable('fraction', { dependencies: dep }),
      crop_fraction: unavailable('fraction', { dependencies: dep }),
      target_retention_fraction: unavailable('fraction', { dependencies: dep }),
    };
  }

  // Session field rotation: parallactic rate × session duration (alt-az only).
  const isAltAz = kinematics?.architecture === 'alt_azimuth';
  const sessionDuration = pos(doc.scenario.session?.duration_s) ?? 0;
  const sessionRotationDeg = isAltAz
    ? Math.abs(kinematics?.parallacticRateDegPerS ?? 0) * sessionDuration
    : 0;

  const g = stackGeometry({
    sessionRotationDeg,
    driftPx: 0,
    sensorWidthPx: px,
    sensorHeightPx: py,
  });

  return {
    common_coverage_fraction: valid(g.commonCoverageFraction, 'fraction', {
      confidence: conf,
      displayPrecision: decimals(2),
    }),
    crop_fraction: valid(g.cropFraction, 'fraction', {
      confidence: conf,
      displayPrecision: decimals(2),
    }),
    target_retention_fraction: valid(g.targetRetentionFraction, 'fraction', {
      confidence: conf,
      displayPrecision: decimals(2),
    }),
  };
}
