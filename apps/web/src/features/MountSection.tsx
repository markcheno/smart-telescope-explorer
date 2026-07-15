/**
 * Mount section (spec v0.9 §24 R2-009).
 *
 * R2 exposes the architecture (alt-az vs equatorial — gate item 3) plus the
 * zenith-avoidance radius. Derived axis rate and zenith risk read from results.
 */

import type { MountArchitecture } from '@ste/schema';
import { MOUNT_ARCHITECTURES } from '@ste/schema';
import { InputSection } from '../components/InputSection.js';
import { QuantityInput } from '../components/QuantityInput.js';
import { formatResult, prettifyEnum } from '../components/format.js';
import { useDesign } from '../state/store.js';

export function MountSection(): JSX.Element {
  const { design, edit, results } = useDesign();
  const mount = design.mount;
  const kin = results.results.mount_kinematics;

  return (
    <InputSection title="Mount" status="complete">
      <label className="quantity">
        <span className="quantity__label">Architecture</span>
        <select
          className="quantity__select"
          value={mount.architecture}
          onChange={(e) =>
            edit((d) => {
              d.mount.architecture = e.target.value as MountArchitecture;
            })
          }
        >
          {MOUNT_ARCHITECTURES.map((a) => (
            <option key={a} value={a}>
              {prettifyEnum(a)}
            </option>
          ))}
        </select>
      </label>
      <QuantityInput
        label="Zenith avoidance"
        value={mount.alt_azimuth?.zenith_avoidance_radius_deg ?? null}
        unit="°"
        step={1}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            d.mount.alt_azimuth = {
              ...(d.mount.alt_azimuth ?? {}),
              zenith_avoidance_radius_deg: v,
            };
          })
        }
      />

      <dl className="derived">
        <div>
          <dt>Max axis-1 rate</dt>
          <dd>{formatResult(kin?.max_axis1_rate_deg_per_s)}</dd>
        </div>
        <div>
          <dt>Zenith risk</dt>
          <dd>{kin?.zenith_risk.value === true ? 'Yes' : 'No'}</dd>
        </div>
      </dl>
    </InputSection>
  );
}
