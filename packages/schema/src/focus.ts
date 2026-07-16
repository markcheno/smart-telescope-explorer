/**
 * Focuser inputs (spec v0.4 §11).
 *
 * Enough of the focus model to answer "how tight must my focuser be" and "will
 * temperature drift push me out of focus": the drivetrain resolution, the
 * repeatability, and the temperature coefficient. All optional (unknown ≠ zero).
 */

export interface FocusInput {
  motorized?: boolean;
  /** Focuser travel per motor revolution (µm). */
  travel_per_revolution_um?: number | null;
  /** Full motor steps per revolution. */
  motor_steps_per_revolution?: number | null;
  /** Microstep subdivision per full step; defaults to 1. */
  microsteps?: number | null;
  /** Gear reduction between motor and focuser; defaults to 1. */
  reduction_ratio?: number | null;
  /** Mechanical repeatability of a commanded move (µm). */
  repeatability_um?: number | null;
  /** Focus shift per degree of temperature change, K_T (µm/°C). */
  temperature_coefficient_um_per_c?: number | null;
  /** Temperature at which focus was set (°C); drift is measured from here. */
  focus_temperature_c?: number | null;
  /** Seconds between autofocus runs. */
  autofocus_interval_s?: number | null;
  /** Duration of one autofocus run (s). */
  autofocus_duration_s?: number | null;
}
