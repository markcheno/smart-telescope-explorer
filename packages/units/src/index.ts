/**
 * @ste/units — canonical quantity types and conversions.
 *
 * This package is the ONLY place that may hold physical conversion constants
 * (e.g. arcseconds-per-radian, degrees<->radians, mm<->um). Domain packages
 * must accept and return branded quantities so that a millimetre value can
 * never be silently used where micrometres or radians are expected.
 *
 * Canonical internal units (spec v0.4 §3, v0.8 §2.2):
 *   optical/sensor dimensions -> millimetres
 *   pixel pitch               -> micrometres
 *   stored sky positions      -> degrees
 *   angular error             -> arcseconds
 *   wavelength                -> nanometres
 *   time                      -> seconds
 *   transmission/probability  -> fraction (0..1)
 *   data size                 -> bytes
 */

// --- branding -------------------------------------------------------------

declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

export type Millimeters = Brand<number, 'Millimeters'>;
export type SquareMillimeters = Brand<number, 'SquareMillimeters'>;
export type Micrometers = Brand<number, 'Micrometers'>;
export type Nanometers = Brand<number, 'Nanometers'>;
export type Radians = Brand<number, 'Radians'>;
export type Degrees = Brand<number, 'Degrees'>;
export type Arcminutes = Brand<number, 'Arcminutes'>;
export type Arcseconds = Brand<number, 'Arcseconds'>;
export type Seconds = Brand<number, 'Seconds'>;
export type Fraction = Brand<number, 'Fraction'>;
export type Bytes = Brand<number, 'Bytes'>;

// --- constructors ---------------------------------------------------------

export const mm = (v: number): Millimeters => v as Millimeters;
export const mm2 = (v: number): SquareMillimeters => v as SquareMillimeters;
export const um = (v: number): Micrometers => v as Micrometers;
export const nm = (v: number): Nanometers => v as Nanometers;
export const rad = (v: number): Radians => v as Radians;
export const deg = (v: number): Degrees => v as Degrees;
export const arcmin = (v: number): Arcminutes => v as Arcminutes;
export const arcsec = (v: number): Arcseconds => v as Arcseconds;
export const seconds = (v: number): Seconds => v as Seconds;
export const bytes = (v: number): Bytes => v as Bytes;

/** Clamp-free fraction constructor. Callers should validate range separately. */
export const fraction = (v: number): Fraction => v as Fraction;

/** Unwrap a branded quantity to a plain number (use only at display/serialisation edges). */
export const raw = (v: number): number => v as number;

// --- constants (the only physical constants in the codebase) --------------

/** Arcseconds per radian = (180 * 3600) / π = 206264.806…  */
export const ARCSEC_PER_RADIAN = (180 * 3600) / Math.PI;
/** Degrees per radian. */
export const DEG_PER_RADIAN = 180 / Math.PI;
/** Arcseconds per degree. */
export const ARCSEC_PER_DEGREE = 3600;
/** Arcseconds per arcminute. */
export const ARCSEC_PER_ARCMINUTE = 60;
/** Micrometres per millimetre. */
export const UM_PER_MM = 1000;

// --- angle conversions ----------------------------------------------------

export const degToRad = (d: Degrees): Radians => rad((d as number) / DEG_PER_RADIAN);
export const radToDeg = (r: Radians): Degrees => deg((r as number) * DEG_PER_RADIAN);
export const radToArcsec = (r: Radians): Arcseconds => arcsec((r as number) * ARCSEC_PER_RADIAN);
export const arcsecToRad = (a: Arcseconds): Radians => rad((a as number) / ARCSEC_PER_RADIAN);
export const degToArcsec = (d: Degrees): Arcseconds => arcsec((d as number) * ARCSEC_PER_DEGREE);
export const arcsecToDeg = (a: Arcseconds): Degrees => deg((a as number) / ARCSEC_PER_DEGREE);
export const arcminToArcsec = (a: Arcminutes): Arcseconds =>
  arcsec((a as number) * ARCSEC_PER_ARCMINUTE);
export const arcsecToArcmin = (a: Arcseconds): Arcminutes =>
  arcmin((a as number) / ARCSEC_PER_ARCMINUTE);
export const arcminToDeg = (a: Arcminutes): Degrees => deg((a as number) / 60);

// --- length conversions ---------------------------------------------------

export const umToMm = (u: Micrometers): Millimeters => mm((u as number) / UM_PER_MM);
export const mmToUm = (m: Millimeters): Micrometers => um((m as number) * UM_PER_MM);
export const nmToMm = (n: Nanometers): Millimeters => mm((n as number) / 1_000_000);

// --- arithmetic helpers (keep brands; callers stay in one unit) -----------

export const addArcsec = (a: Arcseconds, b: Arcseconds): Arcseconds =>
  arcsec((a as number) + (b as number));

/** Root-sum-square of same-unit quantities (e.g. combining FWHM contributions). */
export const rssArcsec = (...values: Arcseconds[]): Arcseconds =>
  arcsec(Math.sqrt(values.reduce((acc, v) => acc + (v as number) * (v as number), 0)));

// --- angular rates (R2) ---------------------------------------------------

export type ArcsecPerSecond = Brand<number, 'ArcsecPerSecond'>;
export type ArcsecPerMinute = Brand<number, 'ArcsecPerMinute'>;
export type DegPerHour = Brand<number, 'DegPerHour'>;
export type DegPerSecond = Brand<number, 'DegPerSecond'>;
export type RadPerSecond = Brand<number, 'RadPerSecond'>;
export type Hertz = Brand<number, 'Hertz'>;

export const arcsecPerSec = (v: number): ArcsecPerSecond => v as ArcsecPerSecond;
export const arcsecPerMin = (v: number): ArcsecPerMinute => v as ArcsecPerMinute;
export const degPerHour = (v: number): DegPerHour => v as DegPerHour;
export const degPerSec = (v: number): DegPerSecond => v as DegPerSecond;
export const radPerSec = (v: number): RadPerSecond => v as RadPerSecond;
export const hertz = (v: number): Hertz => v as Hertz;

/** Sidereal tracking rate: the sky moves 15.041″ per second (360.9856°/day). */
export const SIDEREAL_RATE_ARCSEC_PER_SEC = 15.041_066_9;

/** Seconds per minute (for rate conversions; not a physical constant of the domain). */
const SECONDS_PER_MINUTE = 60;

// 1°/hr == 1″/s exactly (3600″/deg ÷ 3600 s/hr), so deg/hr <-> arcsec/s is identity in magnitude.
export const degPerHourToArcsecPerSec = (r: DegPerHour): ArcsecPerSecond =>
  arcsecPerSec(r as number);
export const arcsecPerSecToDegPerHour = (r: ArcsecPerSecond): DegPerHour => degPerHour(r as number);
export const arcsecPerMinToArcsecPerSec = (r: ArcsecPerMinute): ArcsecPerSecond =>
  arcsecPerSec((r as number) / SECONDS_PER_MINUTE);
export const arcsecPerSecToArcsecPerMin = (r: ArcsecPerSecond): ArcsecPerMinute =>
  arcsecPerMin((r as number) * SECONDS_PER_MINUTE);
export const degPerSecToArcsecPerSec = (r: DegPerSecond): ArcsecPerSecond =>
  arcsecPerSec((r as number) * ARCSEC_PER_DEGREE);
export const degPerSecToRadPerSec = (r: DegPerSecond): RadPerSecond =>
  radPerSec((r as number) / DEG_PER_RADIAN);
export const radPerSecToArcsecPerSec = (r: RadPerSecond): ArcsecPerSecond =>
  arcsecPerSec((r as number) * ARCSEC_PER_RADIAN);

/** Convert an oscillation period (s) to frequency (Hz) and back. */
export const periodToFrequency = (period: Seconds): Hertz => hertz(1 / (period as number));
export const frequencyToPeriod = (f: Hertz): Seconds => seconds(1 / (f as number));

// --- Gaussian FWHM <-> sigma ---------------------------------------------

/** FWHM = 2√(2 ln 2) · σ ≈ 2.3548 σ for a Gaussian profile. */
export const FWHM_PER_SIGMA = 2 * Math.sqrt(2 * Math.LN2);

export const fwhmToSigma = (fwhm: Arcseconds): Arcseconds =>
  arcsec((fwhm as number) / FWHM_PER_SIGMA);
export const sigmaToFwhm = (sigma: Arcseconds): Arcseconds =>
  arcsec((sigma as number) * FWHM_PER_SIGMA);

// --- 2D vector / covariance utilities (R2 blur & rotation) ----------------

export * from './linalg.js';
