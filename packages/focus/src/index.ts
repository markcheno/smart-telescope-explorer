/**
 * @ste/focus — focuser resolution and defocus blur (spec v0.4 §11).
 *
 * Pure arithmetic. Lengths are micrometres (µm), wavelength micrometres, and the
 * f-number is dimensionless. The critical focus zone sets how finely the focuser
 * must move; the defocus circle and its Gaussian-equivalent FWHM turn a focus
 * error (e.g. from temperature drift) into an on-sky blur.
 */

/** Default reference wavelength (µm) — 550 nm, matching the geometry model. */
export const DEFAULT_WAVELENGTH_UM = 0.55;
/** Arcseconds per radian. */
const ARCSEC_PER_RAD = 206265;

/**
 * Finest commanded movement (µm):
 *   Δz_step = travel_per_revolution / (motor_steps · microsteps · reduction).
 */
export function stepResolutionUm(
  travelPerRevUm: number,
  motorSteps: number,
  microsteps: number,
  reduction: number,
): number | null {
  const divisor = motorSteps * microsteps * reduction;
  if (divisor <= 0 || travelPerRevUm <= 0) return null;
  return travelPerRevUm / divisor;
}

/** Critical focus-zone half-width (µm): CFZ_half ≈ 2·λ·N². */
export function criticalFocusZoneHalfUm(
  fNumber: number,
  wavelengthUm = DEFAULT_WAVELENGTH_UM,
): number | null {
  if (fNumber <= 0) return null;
  return 2 * wavelengthUm * fNumber * fNumber;
}

/** Recommended repeatable movement (µm): Δz_repeatable ≤ CFZ_half / 3. */
export function recommendedRepeatableUm(cfzHalfUm: number): number {
  return cfzHalfUm / 3;
}

/** Defocus blur-circle diameter (µm): c ≈ |Δz| / N. */
export function defocusCircleUm(defocusUm: number, fNumber: number): number | null {
  if (fNumber <= 0) return null;
  return Math.abs(defocusUm) / fNumber;
}

/** Gaussian-equivalent defocus FWHM (µm): FWHM ≈ 0.59·c. */
export function defocusFwhmUm(circleUm: number): number {
  return 0.59 * circleUm;
}

/** Convert a linear blur (µm) at the focal plane to an angle (arcsec). */
export function linearToArcsec(lengthUm: number, focalLengthMm: number): number | null {
  if (focalLengthMm <= 0) return null;
  // length(mm) / focalLength(mm) = radians.
  return (lengthUm / 1000 / focalLengthMm) * ARCSEC_PER_RAD;
}

/** Focus shift from temperature drift (µm): Δz = K_T · (T_current − T_focus). */
export function temperatureDriftUm(
  coefficientUmPerC: number,
  currentC: number,
  focusC: number,
): number {
  return coefficientUmPerC * (currentC - focusC);
}
