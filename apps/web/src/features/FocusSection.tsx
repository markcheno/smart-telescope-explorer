/**
 * Focus section (spec v0.4 §11).
 *
 * Focuser drivetrain (travel/steps/microsteps/reduction), repeatability, and the
 * temperature coefficient — enough to judge whether the focuser resolves the
 * critical focus zone and how much temperature drift blurs the stars. Optional
 * subsystem; derived CFZ / adequacy / defocus FWHM come from the engine.
 */

import type { FocusInput } from '@ste/schema';
import { InputSection } from '../components/InputSection.js';
import { QuantityInput } from '../components/QuantityInput.js';
import { formatResult } from '../components/format.js';
import { useDesign } from '../state/store.js';

function ensureFocus(d: { focus?: FocusInput }): FocusInput {
  d.focus ??= {};
  return d.focus;
}

export function FocusSection(): JSX.Element {
  const { design, edit, results } = useDesign();
  const focus = design.focus;
  const f = results.results.focus;

  const status = focus == null ? 'optional' : 'complete';

  return (
    <InputSection title="Focus" status={status}>
      <QuantityInput
        label="Travel / revolution"
        value={focus?.travel_per_revolution_um ?? null}
        unit="µm"
        step={10}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            ensureFocus(d).travel_per_revolution_um = v;
          })
        }
      />
      <QuantityInput
        label="Motor steps / rev"
        value={focus?.motor_steps_per_revolution ?? null}
        step={1}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            ensureFocus(d).motor_steps_per_revolution = v;
          })
        }
      />
      <QuantityInput
        label="Microsteps"
        value={focus?.microsteps ?? null}
        step={1}
        min={1}
        onCommit={(v) =>
          edit((d) => {
            ensureFocus(d).microsteps = v;
          })
        }
      />
      <QuantityInput
        label="Reduction"
        value={focus?.reduction_ratio ?? null}
        step={0.5}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            ensureFocus(d).reduction_ratio = v;
          })
        }
      />
      <QuantityInput
        label="Repeatability"
        value={focus?.repeatability_um ?? null}
        unit="µm"
        step={0.5}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            ensureFocus(d).repeatability_um = v;
          })
        }
      />
      <QuantityInput
        label="Temp coefficient"
        value={focus?.temperature_coefficient_um_per_c ?? null}
        unit="µm/°C"
        step={0.5}
        onCommit={(v) =>
          edit((d) => {
            ensureFocus(d).temperature_coefficient_um_per_c = v;
          })
        }
      />
      <QuantityInput
        label="Focus set temp"
        value={focus?.focus_temperature_c ?? null}
        unit="°C"
        step={1}
        onCommit={(v) =>
          edit((d) => {
            ensureFocus(d).focus_temperature_c = v;
          })
        }
      />

      <dl className="derived">
        <div>
          <dt>Step resolution</dt>
          <dd>{formatResult(f?.step_resolution_um)}</dd>
        </div>
        <div>
          <dt>Critical focus zone (½)</dt>
          <dd>{formatResult(f?.critical_focus_zone_half_um)}</dd>
        </div>
        <div>
          <dt>Resolution adequate</dt>
          <dd>{formatResult(f?.resolution_adequate)}</dd>
        </div>
        <div>
          <dt>Defocus FWHM (drift)</dt>
          <dd>{formatResult(f?.defocus_fwhm_arcsec)}</dd>
        </div>
      </dl>
    </InputSection>
  );
}
