/**
 * R4 result-group builders — power and focus (spec v0.4 §33, §11).
 *
 * Both are optional subsystems: they produce results only when the user supplies
 * the relevant inputs, and otherwise return unavailable values (unknown ≠ zero).
 * Power answers "will my battery last the session"; focus answers "how tight must
 * my focuser be" and "how much does temperature drift blur the stars".
 */

import {
  criticalFocusZoneHalfUm,
  defocusCircleUm,
  defocusFwhmUm,
  linearToArcsec,
  recommendedRepeatableUm,
  stepResolutionUm,
  temperatureDriftUm,
} from '@ste/focus';
import { averagePower, runtimeSeconds, usableEnergy, type Load } from '@ste/power';
import type { DesignDocument, FocusResults, PowerResults } from '@ste/schema';
import type { DerivedGeometry } from './groups.js';
import { confidence, decimals, INTEGER_PRECISION, unavailable, valid } from './result.js';

const pos = (v: number | null | undefined): number | null =>
  v != null && Number.isFinite(v) && v > 0 ? v : null;
const finite = (v: number | null | undefined): number | null =>
  v != null && Number.isFinite(v) ? v : null;

/** Default reserve kept in hand before the session is judged "covered" (§33). */
const DEFAULT_RESERVE = 0.2;

// --- power ----------------------------------------------------------------

export function computePower(doc: DesignDocument): PowerResults {
  const power = doc.power;
  const loads = (power?.loads ?? []).map<Load>((l) => ({
    power_w: l.power_w,
    ...(l.duty_fraction != null ? { duty_fraction: l.duty_fraction } : {}),
  }));
  const nominal = pos(power?.battery?.nominal_energy_wh);

  const est = confidence('moderate');
  const noLoads = loads.length === 0;

  const avg = noLoads ? null : averagePower(loads);
  const usable = nominal != null ? usableEnergy(nominal, power?.battery ?? {}) : null;
  const runtimeS = avg != null && avg > 0 && usable != null ? runtimeSeconds(usable, avg) : null;

  const reserve = finite(power?.battery?.reserve_fraction) ?? DEFAULT_RESERVE;
  const sessionS = pos(doc.scenario.session?.duration_s);
  // The battery must outlast the session plus the reserve fraction.
  const covered =
    runtimeS != null && sessionS != null ? runtimeS >= sessionS * (1 + reserve) : null;

  const depNone = ['/power'];
  return {
    average_power_w:
      avg != null
        ? valid(avg, 'W', { confidence: est, displayPrecision: decimals(1) })
        : unavailable('W', { dependencies: depNone }),
    usable_energy_wh:
      usable != null
        ? valid(usable, 'Wh', { confidence: est, displayPrecision: decimals(1) })
        : unavailable('Wh', { dependencies: ['/power/battery/nominal_energy_wh'] }),
    runtime_s:
      runtimeS != null
        ? valid(runtimeS, 's', { confidence: est, displayPrecision: INTEGER_PRECISION })
        : unavailable('s', { dependencies: depNone }),
    runtime_hr:
      runtimeS != null
        ? valid(runtimeS / 3600, 'hr', { confidence: est, displayPrecision: decimals(1) })
        : unavailable('hr', { dependencies: depNone }),
    reserve_fraction: valid(reserve, 'fraction', { displayPrecision: decimals(2) }),
    session_covered:
      covered != null
        ? valid<boolean>(covered, '', { confidence: est })
        : unavailable<boolean>('', { dependencies: ['/power', '/scenario/session/duration_s'] }),
  };
}

// --- focus ----------------------------------------------------------------

export function computeFocus(doc: DesignDocument, derived: DerivedGeometry | null): FocusResults {
  const f = doc.focus;
  const aperture = pos(doc.optics.aperture_mm);
  const fl = derived != null ? finite(derived.effectiveFocalLengthMm) : null;
  const fNumber = fl != null && aperture != null && aperture > 0 ? fl / aperture : null;

  const est = confidence('moderate');
  const geomDep = ['/optics/aperture_mm', '/optics/native_focal_length_mm'];

  // Drivetrain step resolution.
  const stepUm =
    f != null
      ? stepResolutionUm(
          pos(f.travel_per_revolution_um) ?? 0,
          pos(f.motor_steps_per_revolution) ?? 0,
          pos(f.microsteps) ?? 1,
          pos(f.reduction_ratio) ?? 1,
        )
      : null;

  // Critical focus zone + recommended step (need the f-number only).
  const cfzHalf = fNumber != null ? criticalFocusZoneHalfUm(fNumber) : null;
  const recommended = cfzHalf != null ? recommendedRepeatableUm(cfzHalf) : null;
  // Adequate if the finest achievable move (step or repeatability) fits the CFZ/3.
  const finest = smallestDefined(stepUm, pos(f?.repeatability_um));
  const adequate = recommended != null && finest != null ? finest <= recommended : null;

  // Temperature drift → defocus → on-sky FWHM.
  const kT = finite(f?.temperature_coefficient_um_per_c);
  const focusT = finite(f?.focus_temperature_c);
  const currentT = finite(
    doc.scenario.conditions.temperature_start_c ?? doc.scenario.conditions.temperature_end_c,
  );
  const driftUm =
    kT != null && focusT != null && currentT != null
      ? temperatureDriftUm(kT, currentT, focusT)
      : null;
  const circle = driftUm != null && fNumber != null ? defocusCircleUm(driftUm, fNumber) : null;
  const defocusFwhmArcsec =
    circle != null && fl != null ? linearToArcsec(defocusFwhmUm(circle), fl) : null;

  const overhead =
    pos(f?.autofocus_duration_s) != null && pos(f?.autofocus_interval_s) != null
      ? pos(f!.autofocus_duration_s)! / pos(f!.autofocus_interval_s)!
      : null;

  return {
    step_resolution_um:
      stepUm != null
        ? valid(stepUm, 'µm', { confidence: est, displayPrecision: decimals(3) })
        : unavailable('µm', { dependencies: ['/focus/travel_per_revolution_um'] }),
    critical_focus_zone_half_um:
      cfzHalf != null
        ? valid(cfzHalf, 'µm', { confidence: est, displayPrecision: decimals(1) })
        : unavailable('µm', { dependencies: geomDep }),
    recommended_repeatable_um:
      recommended != null
        ? valid(recommended, 'µm', { confidence: est, displayPrecision: decimals(1) })
        : unavailable('µm', { dependencies: geomDep }),
    resolution_adequate:
      adequate != null
        ? valid<boolean>(adequate, '', { confidence: est })
        : unavailable<boolean>('', { dependencies: ['/focus', ...geomDep] }),
    temperature_drift_um:
      driftUm != null
        ? valid(driftUm, 'µm', { confidence: est, displayPrecision: decimals(1) })
        : unavailable('µm', {
            dependencies: ['/focus/temperature_coefficient_um_per_c', '/focus/focus_temperature_c'],
          }),
    defocus_fwhm_arcsec:
      defocusFwhmArcsec != null
        ? valid(defocusFwhmArcsec, 'arcsec', { confidence: est, displayPrecision: decimals(2) })
        : unavailable('arcsec', { dependencies: ['/focus'] }),
    autofocus_overhead_fraction:
      overhead != null
        ? valid(overhead, 'fraction', { confidence: est, displayPrecision: decimals(3) })
        : unavailable('fraction', { dependencies: ['/focus/autofocus_interval_s'] }),
  };
}

/** Smallest of the defined positive values, or null when none are defined. */
function smallestDefined(...values: (number | null)[]): number | null {
  const defined = values.filter((v): v is number => v != null);
  return defined.length === 0 ? null : Math.min(...defined);
}
