/**
 * @ste/astronomy — time, coordinates, airmass, session path, tangent-plane
 * projection, and field orientation (spec v0.9 §20 astronomy; v0.4 §3.2, §20).
 *
 * Angles are plain numbers in DEGREES at the API boundary (names carry the unit,
 * matching the schema's convention) — spherical trig is far clearer without
 * branding every intermediate. The single mathematical constant π/180 is derived
 * from `@ste/units` `DEG_PER_RADIAN` so no conversion factor is duplicated.
 *
 * Conventions (v0.4 §3.2): azimuth clockwise from true north (N=0°, E=90°),
 * altitude up from the horizon, hour angle positive west of the meridian,
 * position/parallactic angle from celestial north toward east.
 */

import { DEG_PER_RADIAN } from '@ste/units';

const D2R = 1 / DEG_PER_RADIAN;
const R2D = DEG_PER_RADIAN;

/** Normalize an angle to [0, 360). */
export function normalize360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Normalize an angle to (−180, 180]. */
export function normalize180(deg: number): number {
  const n = normalize360(deg);
  return n > 180 ? n - 360 : n;
}

// --- time (R2-001) --------------------------------------------------------

/** Julian Date at the J2000.0 epoch (2000-01-01T12:00:00Z). */
export const JD_J2000 = 2451545.0;
const UNIX_EPOCH_JD = 2440587.5;
const MS_PER_DAY = 86_400_000;

/** Julian Date from a Unix timestamp in milliseconds. */
export function julianDateFromUnixMillis(unixMillis: number): number {
  return unixMillis / MS_PER_DAY + UNIX_EPOCH_JD;
}

/** Julian Date from an ISO 8601 UTC string, or `null` if unparseable. */
export function julianDateFromIso(iso: string): number | null {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : julianDateFromUnixMillis(ms);
}

/**
 * Greenwich Mean Sidereal Time in degrees for a given Julian Date
 * (IAU 1982 series, sufficient for engineering geometry).
 */
export function greenwichMeanSiderealTimeDeg(julianDate: number): number {
  const d = julianDate - JD_J2000;
  const t = d / 36525;
  const gmst = 280.46061837 + 360.98564736629 * d + 0.000387933 * t * t - (t * t * t) / 38_710_000;
  return normalize360(gmst);
}

/** Local (apparent mean) Sidereal Time in degrees at a given east longitude. */
export function localSiderealTimeDeg(julianDate: number, longitudeEastDeg: number): number {
  return normalize360(greenwichMeanSiderealTimeDeg(julianDate) + longitudeEastDeg);
}

/** Local hour angle (degrees, positive west) of a target at a given LST. */
export function hourAngleDeg(rightAscensionDeg: number, localSiderealTimeDegValue: number): number {
  return normalize180(localSiderealTimeDegValue - rightAscensionDeg);
}

// --- equatorial -> horizontal (R2-002) -----------------------------------

export interface HorizontalCoordinates {
  altitudeDeg: number;
  azimuthDeg: number;
}

/**
 * Convert equatorial (RA/Dec) to horizontal (alt/az) for an observer at
 * `latitudeDeg` and local sidereal time `lstDeg`. Azimuth is measured clockwise
 * from north (v0.4 §3.2).
 */
export function equatorialToHorizontal(
  rightAscensionDeg: number,
  declinationDeg: number,
  latitudeDeg: number,
  lstDeg: number,
): HorizontalCoordinates {
  const h = hourAngleDeg(rightAscensionDeg, lstDeg) * D2R;
  const dec = declinationDeg * D2R;
  const lat = latitudeDeg * D2R;

  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(h);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

  const y = -Math.cos(dec) * Math.sin(h);
  const x = Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(h);
  const azimuth = normalize360(Math.atan2(y, x) * R2D);

  return { altitudeDeg: altitude * R2D, azimuthDeg: azimuth };
}

// --- airmass (R2-003) -----------------------------------------------------

/** Below this altitude, airmass estimates carry a low-altitude warning. */
export const LOW_ALTITUDE_DEG = 15;

/**
 * Plane-parallel airmass X = sec(z) = 1/sin(alt). Returns `null` when the target
 * is at or below the horizon (no meaningful airmass).
 */
export function airmass(altitudeDeg: number): number | null {
  if (altitudeDeg <= 0) return null;
  return 1 / Math.sin(altitudeDeg * D2R);
}

// --- parallactic angle / field orientation (R2-006) ----------------------

/**
 * Parallactic angle (degrees): the angle at the target between the direction to
 * the celestial pole and the direction to the zenith. Its rate of change is what
 * rotates the field for an alt-az mount (v0.4 §20). Sign follows N→E (v0.4 §3.2).
 */
export function parallacticAngleDeg(
  hourAngleDegValue: number,
  declinationDeg: number,
  latitudeDeg: number,
): number {
  const h = hourAngleDegValue * D2R;
  const dec = declinationDeg * D2R;
  const lat = latitudeDeg * D2R;
  const y = Math.sin(h);
  const x = Math.tan(lat) * Math.cos(dec) - Math.sin(dec) * Math.cos(h);
  return Math.atan2(y, x) * R2D;
}

/** Unwrap a sequence of angles (degrees) so successive steps never jump > 180°. */
export function unwrapDegrees(series: readonly number[]): number[] {
  const out: number[] = [];
  let offset = 0;
  let prev: number | null = null;
  for (const raw of series) {
    if (prev != null) {
      let delta = raw + offset - prev;
      while (delta > 180) {
        offset -= 360;
        delta -= 360;
      }
      while (delta < -180) {
        offset += 360;
        delta += 360;
      }
    }
    const value = raw + offset;
    out.push(value);
    prev = value;
  }
  return out;
}

// --- tangent-plane projection (R2-005) -----------------------------------

export interface TangentPoint {
  /** Radians east/rightward (increasing azimuth) from the projection centre. */
  xRad: number;
  /** Radians up (increasing altitude) from the projection centre. */
  yRad: number;
}

/**
 * Gnomonic (tangent-plane) projection of a horizontal position about a centre
 * (alt0/az0). Produces stable small-angle local coordinates with X rightward
 * (increasing azimuth) and Y up (increasing altitude), per the sensor model
 * (v0.4 §3.2). Returns `null` if the point is more than 90° from the centre.
 */
export function projectToTangentPlane(
  altitudeDeg: number,
  azimuthDeg: number,
  centerAltitudeDeg: number,
  centerAzimuthDeg: number,
): TangentPoint | null {
  const alt = altitudeDeg * D2R;
  const az = azimuthDeg * D2R;
  const alt0 = centerAltitudeDeg * D2R;
  const az0 = centerAzimuthDeg * D2R;
  const dAz = az - az0;

  const cosC = Math.sin(alt0) * Math.sin(alt) + Math.cos(alt0) * Math.cos(alt) * Math.cos(dAz);
  if (cosC <= 0) return null;

  const xRad = (Math.cos(alt) * Math.sin(dAz)) / cosC;
  const yRad =
    (Math.cos(alt0) * Math.sin(alt) - Math.sin(alt0) * Math.cos(alt) * Math.cos(dAz)) / cosC;
  return { xRad, yRad };
}

// --- session path (R2-004) -----------------------------------------------

export interface SessionSample {
  /** Seconds elapsed from the session start. */
  timeOffsetS: number;
  /** Julian Date at this sample. */
  julianDate: number;
  altitudeDeg: number;
  azimuthDeg: number;
  hourAngleDeg: number;
  /** `null` below the horizon. */
  airmass: number | null;
  /** Parallactic angle (degrees) at this sample. */
  parallacticAngleDeg: number;
  /** True when above the minimum altitude. */
  visible: boolean;
}

export interface SessionPathParams {
  startUnixMillis: number;
  durationS: number;
  sampleIntervalS: number;
  latitudeDeg: number;
  longitudeEastDeg: number;
  rightAscensionDeg: number;
  declinationDeg: number;
  minimumAltitudeDeg: number;
}

/** Maximum number of samples in a session path (browser-performance cap, v0.4 §18). */
export const MAX_SESSION_SAMPLES = 512;

/**
 * Sample the target's alt/az/airmass/visibility across the session (R2-004).
 * The interval is widened if needed to stay within {@link MAX_SESSION_SAMPLES}.
 */
export function sessionPath(params: SessionPathParams): SessionSample[] {
  const requested = Math.max(1, Math.floor(params.durationS / Math.max(1, params.sampleIntervalS)));
  const steps = Math.min(requested, MAX_SESSION_SAMPLES);
  const dt = params.durationS / steps;
  const samples: SessionSample[] = [];
  for (let i = 0; i <= steps; i++) {
    const timeOffsetS = i * dt;
    const jd = julianDateFromUnixMillis(params.startUnixMillis + timeOffsetS * 1000);
    const lst = localSiderealTimeDeg(jd, params.longitudeEastDeg);
    const ha = hourAngleDeg(params.rightAscensionDeg, lst);
    const { altitudeDeg, azimuthDeg } = equatorialToHorizontal(
      params.rightAscensionDeg,
      params.declinationDeg,
      params.latitudeDeg,
      lst,
    );
    samples.push({
      timeOffsetS,
      julianDate: jd,
      altitudeDeg,
      azimuthDeg,
      hourAngleDeg: ha,
      airmass: airmass(altitudeDeg),
      parallacticAngleDeg: parallacticAngleDeg(ha, params.declinationDeg, params.latitudeDeg),
      visible: altitudeDeg >= params.minimumAltitudeDeg,
    });
  }
  return samples;
}
