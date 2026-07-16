/**
 * Power and battery inputs (spec v0.4 §33).
 *
 * A list of electrical loads (each with an average draw and a duty fraction) and
 * a battery whose usable energy derates for depth-of-discharge, conversion
 * efficiency, temperature, and aging. All fields are optional so the subsystem
 * is only evaluated when the user provides data (v0.8 §2 — unknown ≠ zero).
 */

export interface PowerLoad {
  label: string;
  /** Average power drawn while active (W). */
  power_w: number;
  /** Fraction of the session this load is active; defaults to 1. */
  duty_fraction?: number | null;
}

export interface BatteryInput {
  /** Nominal capacity (Wh). */
  nominal_energy_wh?: number | null;
  /** Usable fraction before cutoff; defaults to 0.8. */
  depth_of_discharge_fraction?: number | null;
  /** DC/DC + regulator efficiency; defaults to 0.9. */
  conversion_efficiency_fraction?: number | null;
  /** Cold-weather capacity derate (F_temperature); defaults to 1. */
  temperature_derate_fraction?: number | null;
  /** Aging capacity derate (F_aging); defaults to 1. */
  aging_derate_fraction?: number | null;
  /** Reserve kept in hand; defaults to 0.2 (spec §33 "default reserve 20%"). */
  reserve_fraction?: number | null;
}

export interface PowerInput {
  loads?: PowerLoad[];
  battery?: BatteryInput;
}
