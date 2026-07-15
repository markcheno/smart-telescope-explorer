/**
 * Tracking section (spec v0.9 §24 R2-010).
 *
 * Basic tracking-error inputs (gate item 4): drift rate, periodic amplitude +
 * period, and random jitter. Correctable-vs-uncorrectable is explained inline:
 * accumulated pointing offset is corrected between frames; motion recorded
 * during an exposure is not.
 */

import { InputSection } from '../components/InputSection.js';
import { QuantityInput } from '../components/QuantityInput.js';
import { formatResult } from '../components/format.js';
import { useDesign } from '../state/store.js';

export function TrackingSection(): JSX.Element {
  const { design, edit, results } = useDesign();
  const tracking = design.tracking;
  const model = tracking.error_model;
  const t = results.results.tracking;

  const editModel = (fn: (m: NonNullable<typeof model>) => void): void =>
    edit((d) => {
      d.tracking.enabled = true;
      d.tracking.error_model ??= {};
      fn(d.tracking.error_model);
    });

  return (
    <InputSection title="Tracking" status={tracking.enabled ? 'complete' : 'optional'}>
      <label className="quantity quantity--row">
        <input
          type="checkbox"
          checked={tracking.enabled}
          onChange={(e) =>
            edit((d) => {
              d.tracking.enabled = e.target.checked;
            })
          }
        />
        <span className="quantity__label">Tracking enabled</span>
      </label>

      <QuantityInput
        label="Drift rate"
        value={model?.drift_rate?.value_arcsec_per_min ?? null}
        unit="″/min"
        step={0.5}
        min={0}
        onCommit={(v) =>
          editModel((m) => {
            m.drift_rate = { value_arcsec_per_min: v, direction: 'right_ascension' };
          })
        }
      />
      <QuantityInput
        label="Periodic amplitude"
        value={model?.periodic_error?.amplitude_arcsec ?? null}
        unit="″ p-p"
        step={1}
        min={0}
        onCommit={(v) =>
          editModel((m) => {
            m.periodic_error = {
              amplitude_arcsec: v,
              amplitude_statistic: 'peak_to_peak',
              period_s: m.periodic_error?.period_s ?? 60,
              direction: 'right_ascension',
            };
          })
        }
      />
      <QuantityInput
        label="Periodic period"
        value={model?.periodic_error?.period_s ?? null}
        unit="s"
        step={5}
        min={0}
        onCommit={(v) =>
          editModel((m) => {
            m.periodic_error = {
              amplitude_arcsec: m.periodic_error?.amplitude_arcsec ?? null,
              amplitude_statistic: 'peak_to_peak',
              period_s: v,
              direction: 'right_ascension',
            };
          })
        }
      />
      <QuantityInput
        label="Random jitter"
        value={model?.tracking_jitter?.value ?? null}
        unit="″ rms"
        step={0.5}
        min={0}
        onCommit={(v) =>
          editModel((m) => {
            m.tracking_jitter = { value: v, statistic: 'rms', direction: 'isotropic' };
          })
        }
      />

      <dl className="derived">
        <div>
          <dt>Motion FWHM</dt>
          <dd>{formatResult(t?.motion_fwhm_arcsec)}</dd>
        </div>
        <div>
          <dt>Max displacement</dt>
          <dd>{formatResult(t?.motion_max_displacement_px)}</dd>
        </div>
      </dl>
      <p className="section__note">
        Between frames the accumulated pointing offset is corrected; motion recorded during an
        exposure is not.
      </p>
    </InputSection>
  );
}
