/**
 * Scenario section (spec v0.9 §24 R1-006).
 *
 * R1 exposes the geometry-relevant scenario inputs: direct altitude/azimuth,
 * session duration, and seeing (the one condition required for sampling, v0.8 §9).
 */

import { InputSection } from '../components/InputSection.js';
import { QuantityInput } from '../components/QuantityInput.js';
import { useDesign } from '../state/store.js';

export function ScenarioSection(): JSX.Element {
  const { design, edit } = useDesign();
  const scenario = design.scenario;
  const seeing = scenario.conditions.seeing_fwhm_arcsec;

  return (
    <InputSection title="Scenario" status={seeing == null ? 'warning' : 'complete'} defaultOpen>
      <QuantityInput
        label="Seeing (FWHM)"
        value={seeing}
        unit="arcsec"
        step={0.1}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            d.scenario.conditions.seeing_fwhm_arcsec = v;
          })
        }
      />
      <QuantityInput
        label="Altitude"
        value={scenario.direct_horizontal?.altitude_deg ?? null}
        unit="°"
        step={1}
        onCommit={(v) =>
          edit((d) => {
            d.scenario.direct_horizontal ??= { altitude_deg: null, azimuth_deg: null };
            d.scenario.direct_horizontal.altitude_deg = v;
          })
        }
      />
      <QuantityInput
        label="Session duration"
        value={scenario.session?.duration_s ?? null}
        unit="s"
        step={60}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            d.scenario.session ??= { start_time_utc: null, duration_s: null };
            d.scenario.session.duration_s = v;
          })
        }
      />
    </InputSection>
  );
}
