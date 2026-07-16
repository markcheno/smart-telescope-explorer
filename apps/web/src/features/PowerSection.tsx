/**
 * Power section (spec v0.4 §33; v0.7 §21 E15+).
 *
 * Electrical loads (average draw × duty) and a battery, driving the runtime
 * estimate. Optional subsystem — collapsed and unconfigured until the user adds
 * a load. Derived average power / usable energy / runtime / session coverage are
 * read straight from the engine results.
 */

import type { PowerInput, PowerLoad } from '@ste/schema';
import { InputSection } from '../components/InputSection.js';
import { QuantityInput } from '../components/QuantityInput.js';
import { formatResult } from '../components/format.js';
import { useDesign } from '../state/store.js';

function ensurePower(d: { power?: PowerInput }): PowerInput {
  d.power ??= {};
  d.power.loads ??= [];
  d.power.battery ??= {};
  return d.power;
}

export function PowerSection(): JSX.Element {
  const { design, edit, results } = useDesign();
  const power = design.power;
  const loads = power?.loads ?? [];
  const p = results.results.power;

  const status = loads.length === 0 ? 'optional' : 'complete';

  return (
    <InputSection title="Power" status={status}>
      <ul className="loads">
        {loads.map((load, i) => (
          <li key={i} className="loads__row">
            <input
              className="quantity__input loads__label"
              aria-label={`Load ${i + 1} name`}
              value={load.label}
              onChange={(e) =>
                edit((d) => {
                  ensurePower(d).loads![i]!.label = e.target.value;
                })
              }
            />
            <input
              className="quantity__input loads__watts"
              aria-label={`Load ${i + 1} watts`}
              type="number"
              step={0.5}
              min={0}
              value={load.power_w}
              onChange={(e) =>
                edit((d) => {
                  ensurePower(d).loads![i]!.power_w = Number(e.target.value);
                })
              }
            />
            <span className="loads__unit">W</span>
            <button
              type="button"
              className="loads__remove"
              aria-label={`Remove load ${i + 1}`}
              onClick={() =>
                edit((d) => {
                  ensurePower(d).loads!.splice(i, 1);
                })
              }
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="target__custom-toggle"
        onClick={() =>
          edit((d) => {
            const newLoad: PowerLoad = { label: 'Load', power_w: 5 };
            ensurePower(d).loads!.push(newLoad);
          })
        }
      >
        Add load
      </button>

      <QuantityInput
        label="Battery capacity"
        value={power?.battery?.nominal_energy_wh ?? null}
        unit="Wh"
        step={5}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            ensurePower(d).battery!.nominal_energy_wh = v;
          })
        }
      />
      <QuantityInput
        label="Reserve"
        value={power?.battery?.reserve_fraction ?? null}
        unit="fraction"
        step={0.05}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            ensurePower(d).battery!.reserve_fraction = v;
          })
        }
      />

      <dl className="derived">
        <div>
          <dt>Average power</dt>
          <dd>{formatResult(p?.average_power_w)}</dd>
        </div>
        <div>
          <dt>Usable energy</dt>
          <dd>{formatResult(p?.usable_energy_wh)}</dd>
        </div>
        <div>
          <dt>Runtime</dt>
          <dd>{formatResult(p?.runtime_hr)}</dd>
        </div>
        <div>
          <dt>Covers session</dt>
          <dd>{formatResult(p?.session_covered)}</dd>
        </div>
      </dl>
    </InputSection>
  );
}
