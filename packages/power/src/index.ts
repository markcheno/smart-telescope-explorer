/**
 * @ste/power — battery runtime (spec v0.4 §33).
 *
 * Pure arithmetic over plain numbers: average power is the duty-weighted sum of
 * loads; usable energy derates the nominal capacity for depth-of-discharge,
 * conversion efficiency, temperature, and aging; runtime is usable energy over
 * average power. The 20% default reserve is applied by the caller when judging
 * whether the runtime covers a session.
 */

export interface Load {
  power_w: number;
  /** Fraction of the session active; defaults to 1. */
  duty_fraction?: number | null;
}

/** Duty-weighted average power, P_average = Σ Pᵢ·dᵢ (W). */
export function averagePower(loads: readonly Load[]): number {
  let total = 0;
  for (const l of loads) {
    if (!Number.isFinite(l.power_w) || l.power_w < 0) continue;
    const duty = l.duty_fraction == null ? 1 : clamp01(l.duty_fraction);
    total += l.power_w * duty;
  }
  return total;
}

export interface EnergyDerates {
  depth_of_discharge_fraction?: number | null;
  conversion_efficiency_fraction?: number | null;
  temperature_derate_fraction?: number | null;
  aging_derate_fraction?: number | null;
}

/**
 * Usable energy (Wh):
 *   E_usable = E_nominal · DOD · η_conversion · F_temperature · F_aging.
 */
export function usableEnergy(nominalWh: number, derates: EnergyDerates): number {
  const dod = frac(derates.depth_of_discharge_fraction, 0.8);
  const eta = frac(derates.conversion_efficiency_fraction, 0.9);
  const fTemp = frac(derates.temperature_derate_fraction, 1);
  const fAge = frac(derates.aging_derate_fraction, 1);
  return nominalWh * dod * eta * fTemp * fAge;
}

/** Runtime (seconds) = usable energy (Wh) / average power (W) × 3600. */
export function runtimeSeconds(usableWh: number, averagePowerW: number): number | null {
  if (averagePowerW <= 0) return null;
  return (usableWh / averagePowerW) * 3600;
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

function frac(v: number | null | undefined, fallback: number): number {
  return v == null || !Number.isFinite(v) ? fallback : clamp01(v);
}
