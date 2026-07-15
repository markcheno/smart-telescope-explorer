/**
 * Optics section (spec v0.9 §24 R1-011).
 *
 * Aperture, focal length, reducer/extender, obstruction, transmission, and the
 * optical-quality preset. The derived focal ratio and effective focal length are
 * shown inline, read straight off the engine results (never recomputed here).
 */

import type { OpticalQualityPreset } from '@ste/schema';
import { OPTICAL_QUALITY_PRESETS } from '@ste/schema';
import { OPTIC_PRESETS, matchOpticPreset } from '@ste/catalogs';
import { InputSection } from '../components/InputSection.js';
import { QuantityInput } from '../components/QuantityInput.js';
import { formatResult, prettifyEnum } from '../components/format.js';
import { useDesign } from '../state/store.js';

export function OpticsSection(): JSX.Element {
  const { design, edit, results } = useDesign();
  const optics = design.optics;
  const geometry = results.results.static_geometry;

  const status =
    optics.aperture_mm == null || optics.native_focal_length_mm == null ? 'invalid' : 'complete';

  const preset =
    optics.optical_blur.representation === 'quality_preset'
      ? (optics.optical_blur.preset_class ?? 'unknown')
      : 'unknown';

  return (
    <InputSection title="Optics" status={status} defaultOpen>
      <label className="quantity">
        <span className="quantity__label">Objective preset</span>
        <select
          className="quantity__select"
          value={matchOpticPreset(optics.aperture_mm, optics.native_focal_length_mm)}
          onChange={(e) => {
            const p = OPTIC_PRESETS.find((o) => o.id === e.target.value);
            if (p != null)
              edit((d) => {
                d.optics.aperture_mm = p.aperture_mm;
                d.optics.native_focal_length_mm = p.focal_length_mm;
              });
          }}
        >
          {OPTIC_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </label>
      <QuantityInput
        label="Aperture"
        value={optics.aperture_mm}
        unit="mm"
        step={1}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            d.optics.aperture_mm = v;
          })
        }
      />
      <QuantityInput
        label="Focal length"
        value={optics.native_focal_length_mm}
        unit="mm"
        step={1}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            d.optics.native_focal_length_mm = v;
          })
        }
      />
      <QuantityInput
        label="Reducer ×"
        value={optics.reducer_multiplier}
        step={0.05}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            d.optics.reducer_multiplier = v ?? 1;
          })
        }
      />
      <QuantityInput
        label="Extender ×"
        value={optics.extender_multiplier}
        step={0.5}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            d.optics.extender_multiplier = v ?? 1;
          })
        }
      />
      <label className="quantity">
        <span className="quantity__label">Optical quality</span>
        <select
          className="quantity__select"
          value={preset}
          onChange={(e) =>
            edit((d) => {
              d.optics.optical_blur = {
                representation: 'quality_preset',
                preset_class: e.target.value as OpticalQualityPreset,
                field_position: 'field_average',
              };
            })
          }
        >
          {OPTICAL_QUALITY_PRESETS.map((p) => (
            <option key={p} value={p}>
              {prettifyEnum(p)}
            </option>
          ))}
        </select>
      </label>

      <dl className="derived">
        <div>
          <dt>Effective focal length</dt>
          <dd>{formatResult(geometry?.effective_focal_length_mm)}</dd>
        </div>
        <div>
          <dt>Focal ratio</dt>
          <dd>f/{formatResult(geometry?.focal_ratio)}</dd>
        </div>
      </dl>
    </InputSection>
  );
}
