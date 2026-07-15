/**
 * R2 result-group builders (spec v0.9 §25; v0.4 §15, §20).
 *
 * Turns the design's scenario + mount into scenario-geometry and mount-kinematics
 * results, and derives the shared session path / kinematics that the tracking,
 * blur, and field-rotation builders consume. Follows the `groups.ts` template:
 * read → wrap → call domain fn → emit `ResultValue`s.
 *
 * Two scenario sources (v0.8 §9): `ephemeris_session` runs the full astronomy
 * session path; `direct_horizontal_*` synthesizes a path from the given alt/az
 * and optional rates.
 */

import { airmass, sessionPath, unwrapDegrees, type SessionSample } from '@ste/astronomy';
import {
  computeAltAzKinematics,
  computeEquatorialKinematics,
  numericalDerivatives,
  type AltAzKinematics,
  type EquatorialKinematics,
} from '@ste/kinematics';
import {
  extractComponents,
  jitterVarianceArcsec2,
  sweepPhases,
  type DuringExposureResult,
} from '@ste/tracking';
import { arcsec, eigen2, mag2, mat2, matAdd2, raw, sigmaToFwhm, type Mat2 } from '@ste/units';
import type {
  DesignDocument,
  MountArchitecture,
  MountKinematicResults,
  ScenarioGeometryResults,
  TrackingQuality,
  TrackingResults,
} from '@ste/schema';
import { CalcContext, type DerivedGeometry } from './groups.js';
import { confidence, decimals, INTEGER_PRECISION, unavailable, valid } from './result.js';

/** Reader that accepts any finite number (including negatives and zero). */
const finite = (v: number | null | undefined): number | null =>
  v != null && Number.isFinite(v) ? v : null;
const pos = (v: number | null | undefined): number | null =>
  v != null && Number.isFinite(v) && v > 0 ? v : null;

const DEFAULT_SAMPLE_INTERVAL_S = 300;
const SECONDS_PER_HOUR = 3600;

// --- shared session path + kinematics -------------------------------------

export interface DerivedKinematics {
  samples: SessionSample[];
  architecture: MountArchitecture;
  isEphemeris: boolean;
  /** Index of the reference (midpoint) sample, or -1 when there are no samples. */
  referenceIndex: number;
  referenceAltitudeDeg: number | null;
  /** Field-rotation (parallactic) rate at the reference sample, deg/s. */
  parallacticRateDegPerS: number | null;
  altAz: AltAzKinematics | null;
  equatorial: EquatorialKinematics | null;
  zenithRisk: boolean;
}

/** Derive the session-sample path from the scenario (ephemeris or direct). */
export function deriveSessionSamples(doc: DesignDocument): {
  samples: SessionSample[];
  isEphemeris: boolean;
} {
  const sc = doc.scenario;

  if (sc.mode === 'ephemeris_session') {
    const lat = finite(sc.location?.latitude_deg);
    const lon = finite(sc.location?.longitude_deg);
    const start = sc.session?.start_time_utc ?? null;
    const dur = pos(sc.session?.duration_s);
    const coords = doc.target.custom_target?.coordinates;
    const ra = finite(coords?.right_ascension_deg);
    const dec = finite(coords?.declination_deg);
    if (lat != null && lon != null && start != null && dur != null && ra != null && dec != null) {
      const startMs = Date.parse(start);
      if (!Number.isNaN(startMs)) {
        return {
          samples: sessionPath({
            startUnixMillis: startMs,
            durationS: dur,
            sampleIntervalS: pos(sc.session?.sample_interval_s) ?? DEFAULT_SAMPLE_INTERVAL_S,
            latitudeDeg: lat,
            longitudeEastDeg: lon,
            rightAscensionDeg: ra,
            declinationDeg: dec,
            minimumAltitudeDeg: finite(sc.session?.minimum_altitude_deg) ?? 0,
          }),
          isEphemeris: true,
        };
      }
    }
    return { samples: [], isEphemeris: true };
  }

  // Direct horizontal: synthesize from alt/az (+ optional rates in deg/hr).
  const dh = sc.direct_horizontal;
  const alt0 = finite(dh?.altitude_deg);
  const az0 = finite(dh?.azimuth_deg);
  if (alt0 == null || az0 == null) return { samples: [], isEphemeris: false };

  const dur = sc.mode === 'direct_horizontal_session' ? (pos(sc.session?.duration_s) ?? 0) : 0;
  const altRate = finite(dh?.altitude_rate_deg_per_hour) ?? 0;
  const azRate = finite(dh?.azimuth_rate_deg_per_hour) ?? 0;
  const frRate = finite(dh?.field_rotation_rate_deg_per_hour) ?? 0;
  const minAlt = finite(sc.session?.minimum_altitude_deg) ?? 0;
  const steps =
    dur > 0
      ? Math.min(Math.max(2, Math.floor(dur / (pos(sc.session?.sample_interval_s) ?? 60))), 512)
      : 0;

  const samples: SessionSample[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = steps > 0 ? (i * dur) / steps : 0;
    const hr = t / SECONDS_PER_HOUR;
    const altitudeDeg = alt0 + altRate * hr;
    const azimuthDeg = az0 + azRate * hr;
    samples.push({
      timeOffsetS: t,
      julianDate: 0,
      altitudeDeg,
      azimuthDeg,
      hourAngleDeg: 0,
      airmass: airmass(altitudeDeg),
      parallacticAngleDeg: frRate * hr,
      visible: altitudeDeg >= minAlt,
    });
    if (steps === 0) break;
  }
  return { samples, isEphemeris: false };
}

/** Run the shared kinematics once for the tracking/blur/rotation groups. */
export function deriveKinematics(doc: DesignDocument): DerivedKinematics {
  const { samples, isEphemeris } = deriveSessionSamples(doc);
  const architecture = doc.mount.architecture;
  const referenceIndex = samples.length > 0 ? Math.floor((samples.length - 1) / 2) : -1;
  const referenceAltitudeDeg = referenceIndex >= 0 ? samples[referenceIndex]!.altitudeDeg : null;

  let altAz: AltAzKinematics | null = null;
  let equatorial: EquatorialKinematics | null = null;
  let zenithRisk = false;

  if (samples.length >= 1) {
    if (architecture === 'alt_azimuth') {
      altAz = computeAltAzKinematics(
        samples,
        finite(doc.mount.alt_azimuth?.zenith_avoidance_radius_deg) ?? undefined,
      );
      zenithRisk = altAz.zenithRisk;
    } else {
      const dec = finite(doc.target.custom_target?.coordinates?.declination_deg);
      if (dec != null) equatorial = computeEquatorialKinematics(samples, dec);
    }
  }

  // Field-rotation (parallactic) rate at the reference sample.
  let parallacticRateDegPerS: number | null = null;
  if (samples.length >= 2) {
    const times = samples.map((s) => s.timeOffsetS);
    const q = unwrapDegrees(samples.map((s) => s.parallacticAngleDeg));
    const { rates } = numericalDerivatives(times, q);
    parallacticRateDegPerS = referenceIndex >= 0 ? rates[referenceIndex]! : null;
  }

  return {
    samples,
    architecture,
    isEphemeris,
    referenceIndex,
    referenceAltitudeDeg,
    parallacticRateDegPerS,
    altAz,
    equatorial,
    zenithRisk,
  };
}

// --- scenario geometry group ---------------------------------------------

export function computeScenarioGeometry(
  derived: DerivedKinematics,
  _ctx: CalcContext,
): ScenarioGeometryResults {
  const { samples } = derived;
  if (samples.length === 0) {
    const dep = ['/scenario'];
    return {
      sample_count: valid(0, 'count', { confidence: confidence('high') }),
      reference_altitude_deg: unavailable('deg', { dependencies: dep }),
      max_altitude_deg: unavailable('deg', { dependencies: dep }),
      min_altitude_deg: unavailable('deg', { dependencies: dep }),
      reference_airmass: unavailable('', { dependencies: dep }),
      visible_duration_s: unavailable('s', { dependencies: dep }),
      below_minimum_duration_s: unavailable('s', { dependencies: dep }),
    };
  }

  const alts = samples.map((s) => s.altitudeDeg);
  const refAlt = derived.referenceAltitudeDeg ?? alts[0]!;
  const totalDuration = samples[samples.length - 1]!.timeOffsetS - samples[0]!.timeOffsetS;
  const visibleCount = samples.filter((s) => s.visible).length;
  const visibleFraction = visibleCount / samples.length;
  const visibleDuration = totalDuration * visibleFraction;

  const geomConf = confidence('high');
  const refAirmass = airmass(refAlt);

  return {
    sample_count: valid(samples.length, 'count', {
      confidence: geomConf,
      displayPrecision: INTEGER_PRECISION,
    }),
    reference_altitude_deg: valid(refAlt, 'deg', {
      confidence: geomConf,
      displayPrecision: decimals(1),
    }),
    max_altitude_deg: valid(Math.max(...alts), 'deg', {
      confidence: geomConf,
      displayPrecision: decimals(1),
    }),
    min_altitude_deg: valid(Math.min(...alts), 'deg', {
      confidence: geomConf,
      displayPrecision: decimals(1),
    }),
    reference_airmass:
      refAirmass == null
        ? unavailable('', { dependencies: ['/scenario'] })
        : valid(refAirmass, '', {
            confidence: confidence('moderate'),
            displayPrecision: decimals(2),
          }),
    visible_duration_s: valid(visibleDuration, 's', {
      confidence: geomConf,
      displayPrecision: INTEGER_PRECISION,
    }),
    below_minimum_duration_s: valid(totalDuration - visibleDuration, 's', {
      confidence: geomConf,
      displayPrecision: INTEGER_PRECISION,
    }),
  };
}

// --- mount kinematics group ----------------------------------------------

export function computeMountKinematics(
  derived: DerivedKinematics,
  _ctx: CalcContext,
): MountKinematicResults {
  const architectureResult = valid<MountArchitecture>(derived.architecture, '', {
    confidence: confidence('high'),
  });

  const k = derived.altAz ?? derived.equatorial;
  if (k == null) {
    const dep = ['/mount/architecture', '/scenario'];
    return {
      architecture: architectureResult,
      max_axis1_rate_deg_per_s: unavailable('deg/s', { dependencies: dep }),
      max_axis2_rate_deg_per_s: unavailable('deg/s', { dependencies: dep }),
      max_axis1_accel_deg_per_s2: unavailable('deg/s²', { dependencies: dep }),
      max_axis2_accel_deg_per_s2: unavailable('deg/s²', { dependencies: dep }),
      zenith_risk: valid<boolean>(derived.zenithRisk, '', { confidence: confidence('moderate') }),
      meridian_crossing_s: unavailable('s', { dependencies: dep }),
      max_condition_number: unavailable('', { dependencies: dep }),
    };
  }

  const conf = confidence('moderate');
  const meridian = derived.equatorial?.meridianCrossingS ?? null;

  return {
    architecture: architectureResult,
    max_axis1_rate_deg_per_s: valid(k.maxAxis1RateDegPerS, 'deg/s', {
      confidence: conf,
      displayPrecision: decimals(4),
    }),
    max_axis2_rate_deg_per_s: valid(k.maxAxis2RateDegPerS, 'deg/s', {
      confidence: conf,
      displayPrecision: decimals(4),
    }),
    max_axis1_accel_deg_per_s2: valid(k.maxAxis1AccelDegPerS2, 'deg/s²', {
      confidence: conf,
      displayPrecision: decimals(6),
    }),
    max_axis2_accel_deg_per_s2: valid(k.maxAxis2AccelDegPerS2, 'deg/s²', {
      confidence: conf,
      displayPrecision: decimals(6),
    }),
    zenith_risk: valid<boolean>(derived.zenithRisk, '', { confidence: confidence('moderate') }),
    meridian_crossing_s:
      meridian == null
        ? unavailable('s', { dependencies: ['/mount/architecture'] })
        : valid(meridian, 's', { confidence: conf, displayPrecision: INTEGER_PRECISION }),
    max_condition_number: valid(derived.altAz?.maxConditionNumber ?? 1, '', {
      confidence: conf,
      displayPrecision: decimals(2),
    }),
  };
}

// --- tracking group (R2-010..013) ----------------------------------------

/** Deterministic motion covariance + isotropic jitter for the blur phase. */
export interface DerivedTracking {
  motionCovarianceArcsec2: Mat2 | null;
  jitterVarianceArcsec2: number;
}

/** Blur ellipse FWHM (major axis, arcsec) of a covariance plus isotropic variance. */
function covToMajorFwhmArcsec(cov: Mat2, isotropicVar: number): number {
  const withIso = matAdd2(cov, mat2(isotropicVar, 0, isotropicVar));
  const { major } = eigen2(withIso);
  return raw(sigmaToFwhm(arcsec(Math.sqrt(major))));
}

function trackingQuality(motionPx: number | null): TrackingQuality {
  if (motionPx == null || !Number.isFinite(motionPx)) return 'unknown';
  if (motionPx < 0.5) return 'good';
  if (motionPx <= 1) return 'marginal';
  return 'poor';
}

export function computeTracking(
  doc: DesignDocument,
  geometry: DerivedGeometry,
  _ctx: CalcContext,
): { results: TrackingResults; derived: DerivedTracking } {
  const exposure = pos(doc.capture.exposure_s);
  const model = doc.tracking.error_model;
  const conf = confidence('low');
  const scale =
    geometry.imageScaleXArcsec != null && geometry.imageScaleYArcsec != null
      ? (raw(geometry.imageScaleXArcsec) + raw(geometry.imageScaleYArcsec)) / 2
      : null;

  if (exposure == null || model == null || doc.tracking.enabled === false) {
    const dep = ['/tracking/error_model', '/capture/exposure_s'];
    const na = () => unavailable('arcsec', { dependencies: dep });
    return {
      results: {
        exposure_s:
          exposure == null
            ? unavailable('s', { dependencies: ['/capture/exposure_s'] })
            : valid(exposure, 's', { confidence: conf }),
        phase_count: valid(0, 'count', { confidence: conf }),
        motion_max_displacement_arcsec: na(),
        motion_rms_displacement_arcsec: na(),
        motion_max_displacement_px: unavailable('px', { dependencies: dep }),
        motion_fwhm_arcsec: na(),
        median_max_displacement_arcsec: na(),
        p95_max_displacement_arcsec: na(),
        worst_max_displacement_arcsec: na(),
        dominant_component: unavailable('', { dependencies: dep }),
        quality: valid<TrackingQuality>('unknown', ''),
      },
      derived: { motionCovarianceArcsec2: null, jitterVarianceArcsec2: 0 },
    };
  }

  const components = extractComponents(model);
  const phaseCount = doc.tracking.error_model?.phase_policy === 'worst_case' ? 72 : 24;
  const sweep = sweepPhases(components, exposure, { phaseCount });

  // Selected policy result (v0.8 §22 conservative policy; default 95th percentile).
  const policy = model.phase_policy ?? 'conservative';
  const selected: DuringExposureResult =
    policy === 'known_phase'
      ? sweep.median
      : policy === 'worst_case'
        ? sweep.worst
        : sweep.percentile95;

  const jitterVar = jitterVarianceArcsec2(components);
  const motionFwhm = covToMajorFwhmArcsec(selected.motionCovariance, jitterVar);
  const maxPx = scale == null ? null : selected.maxDisplacementArcsec / scale;

  // Dominant component by magnitude over the exposure.
  const driftTotal = mag2(components.driftArcsecPerSec) * exposure;
  const periodicPeak = mag2(components.periodicPeakArcsec);
  const jitterRms = components.jitterRmsArcsec;
  const dominant =
    driftTotal >= periodicPeak && driftTotal >= jitterRms
      ? 'drift'
      : periodicPeak >= jitterRms
        ? 'periodic_error'
        : 'jitter';

  const as = (v: number) => valid(v, 'arcsec', { confidence: conf, displayPrecision: decimals(2) });

  return {
    results: {
      exposure_s: valid(exposure, 's', { confidence: conf }),
      phase_count: valid(sweep.phaseCount, 'count', {
        confidence: conf,
        displayPrecision: INTEGER_PRECISION,
      }),
      motion_max_displacement_arcsec: as(selected.maxDisplacementArcsec),
      motion_rms_displacement_arcsec: as(selected.rmsDisplacementArcsec),
      motion_max_displacement_px:
        maxPx == null
          ? unavailable('px', { dependencies: ['/camera/sensor/pixel_pitch_x_um'] })
          : valid(maxPx, 'px', { confidence: conf, displayPrecision: decimals(2) }),
      motion_fwhm_arcsec: as(motionFwhm),
      median_max_displacement_arcsec: as(sweep.median.maxDisplacementArcsec),
      p95_max_displacement_arcsec: as(sweep.percentile95.maxDisplacementArcsec),
      worst_max_displacement_arcsec: as(sweep.worst.maxDisplacementArcsec),
      dominant_component: valid<string>(dominant, '', { confidence: conf }),
      quality: valid<TrackingQuality>(trackingQuality(maxPx), '', { confidence: conf }),
    },
    derived: {
      motionCovarianceArcsec2: selected.motionCovariance,
      jitterVarianceArcsec2: jitterVar,
    },
  };
}
