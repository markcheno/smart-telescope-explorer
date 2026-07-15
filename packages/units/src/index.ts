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
