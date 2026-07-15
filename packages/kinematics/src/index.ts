/**
 * @ste/kinematics — predefined two-axis mount kinematics (spec v0.9 §20; v0.4 §15).
 *
 * Turns a target's session path (from `@ste/astronomy`) into per-axis positions,
 * rates, and accelerations for alt-az and equatorial mounts, plus zenith/meridian
 * conditions and the local mechanical-advantage / condition number. Rates and
 * accelerations use central differences (v0.4 §15). Pure functions; angles are
 * degrees at the boundary.
 */

import { unwrapDegrees, type SessionSample } from '@ste/astronomy';
import { DEG_PER_RADIAN } from '@ste/units';

const D2R = 1 / DEG_PER_RADIAN;

export interface Derivatives {
  /** First derivative per sample (value units per second). */
  rates: number[];
  /** Second derivative per sample (value units per second²). */
  accelerations: number[];
}

/**
 * Central-difference first and second derivatives of `values` sampled at `times`
 * (seconds). Endpoints fall back to one-sided differences / nearest interior
 * acceleration (v0.4 §15). Assumes ≥ 2 samples.
 */
export function numericalDerivatives(
  times: readonly number[],
  values: readonly number[],
): Derivatives {
  const n = values.length;
  const rates = new Array<number>(n).fill(0);
  const accelerations = new Array<number>(n).fill(0);
  if (n < 2) return { rates, accelerations };

  for (let i = 0; i < n; i++) {
    if (i === 0) {
      rates[i] = (values[1]! - values[0]!) / (times[1]! - times[0]!);
    } else if (i === n - 1) {
      rates[i] = (values[n - 1]! - values[n - 2]!) / (times[n - 1]! - times[n - 2]!);
    } else {
      rates[i] = (values[i + 1]! - values[i - 1]!) / (times[i + 1]! - times[i - 1]!);
    }
  }
  for (let i = 1; i < n - 1; i++) {
    const dtPrev = times[i]! - times[i - 1]!;
    const dtNext = times[i + 1]! - times[i]!;
    const dt = (dtPrev + dtNext) / 2;
    accelerations[i] = (values[i + 1]! - 2 * values[i]! + values[i - 1]!) / (dt * dt);
  }
  if (n >= 3) {
    accelerations[0] = accelerations[1]!;
    accelerations[n - 1] = accelerations[n - 2]!;
  }
  return { rates, accelerations };
}

export interface AxisSample {
  timeOffsetS: number;
  axis1Deg: number;
  axis2Deg: number;
  axis1RateDegPerS: number;
  axis2RateDegPerS: number;
  axis1AccelDegPerS2: number;
  axis2AccelDegPerS2: number;
}

export interface AxisKinematics {
  /** Axis-1 role label (e.g. `azimuth`, `hour_angle`). */
  axis1: string;
  /** Axis-2 role label (e.g. `altitude`, `declination`). */
  axis2: string;
  samples: AxisSample[];
  maxAxis1RateDegPerS: number;
  maxAxis2RateDegPerS: number;
  maxAxis1AccelDegPerS2: number;
  maxAxis2AccelDegPerS2: number;
}

function assemble(
  axis1Label: string,
  axis2Label: string,
  times: number[],
  axis1: number[],
  axis2: number[],
): AxisKinematics {
  const d1 = numericalDerivatives(times, axis1);
  const d2 = numericalDerivatives(times, axis2);
  const samples: AxisSample[] = times.map((t, i) => ({
    timeOffsetS: t,
    axis1Deg: axis1[i]!,
    axis2Deg: axis2[i]!,
    axis1RateDegPerS: d1.rates[i]!,
    axis2RateDegPerS: d2.rates[i]!,
    axis1AccelDegPerS2: d1.accelerations[i]!,
    axis2AccelDegPerS2: d2.accelerations[i]!,
  }));
  const maxAbs = (xs: number[]): number => xs.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  return {
    axis1: axis1Label,
    axis2: axis2Label,
    samples,
    maxAxis1RateDegPerS: maxAbs(d1.rates),
    maxAxis2RateDegPerS: maxAbs(d2.rates),
    maxAxis1AccelDegPerS2: maxAbs(d1.accelerations),
    maxAxis2AccelDegPerS2: maxAbs(d2.accelerations),
  };
}

// --- alt-az (R2-007) ------------------------------------------------------

export interface AltAzKinematics extends AxisKinematics {
  maxAltitudeDeg: number;
  /** True when the target passes inside the zenith-avoidance keyhole. */
  zenithRisk: boolean;
  /**
   * Worst mechanical-advantage condition number (1/cos(alt)); diverges toward
   * the zenith where a small azimuth move produces almost no on-sky motion.
   */
  maxConditionNumber: number;
}

/** Default zenith-avoidance keyhole radius (degrees) when the mount doesn't specify one. */
export const DEFAULT_ZENITH_AVOIDANCE_DEG = 5;

export function computeAltAzKinematics(
  path: readonly SessionSample[],
  zenithAvoidanceRadiusDeg: number = DEFAULT_ZENITH_AVOIDANCE_DEG,
): AltAzKinematics {
  const times = path.map((s) => s.timeOffsetS);
  // Azimuth wraps through 360°; unwrap before differentiating.
  const az = unwrapDegrees(path.map((s) => s.azimuthDeg));
  const alt = path.map((s) => s.altitudeDeg);
  const base = assemble('azimuth', 'altitude', times, az, alt);

  const maxAltitudeDeg = alt.reduce((m, v) => Math.max(m, v), -90);
  const zenithLimit = 90 - zenithAvoidanceRadiusDeg;
  const zenithRisk = maxAltitudeDeg > zenithLimit;
  const maxConditionNumber = path.reduce((m, s) => {
    if (s.altitudeDeg <= 0) return m;
    return Math.max(m, 1 / Math.max(Math.cos(s.altitudeDeg * D2R), 1e-6));
  }, 1);

  return { ...base, maxAltitudeDeg, zenithRisk, maxConditionNumber };
}

// --- equatorial (R2-008) --------------------------------------------------

export interface EquatorialKinematics extends AxisKinematics {
  /** Time offset (s) at which the target crosses the meridian (HA=0), or null. */
  meridianCrossingS: number | null;
}

export function computeEquatorialKinematics(
  path: readonly SessionSample[],
  declinationDeg: number,
): EquatorialKinematics {
  const times = path.map((s) => s.timeOffsetS);
  // Hour angle is the RA axis; unwrap so meridian crossing (±180 wrap) is smooth.
  const ha = unwrapDegrees(path.map((s) => s.hourAngleDeg));
  // Declination is fixed for a target, so the dec axis is (nearly) stationary.
  const dec = path.map(() => declinationDeg);
  const base = assemble('hour_angle', 'declination', times, ha, dec);

  let meridianCrossingS: number | null = null;
  for (let i = 1; i < path.length; i++) {
    const prev = path[i - 1]!.hourAngleDeg;
    const cur = path[i]!.hourAngleDeg;
    // Sign change through zero, ignoring the ±180 wrap.
    if (prev < 0 && cur >= 0 && Math.abs(prev) < 90 && Math.abs(cur) < 90) {
      meridianCrossingS = path[i]!.timeOffsetS;
      break;
    }
  }
  return { ...base, meridianCrossingS };
}
