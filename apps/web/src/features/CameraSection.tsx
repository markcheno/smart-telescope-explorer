/**
 * Camera section (spec v0.9 §24 R1-012, R1-013).
 *
 * Sensor presets (IMX585/678/662 and generic pitches) plus editable dimensions,
 * resolution, and pixel pitch. Derived image scale and FOV are read from results.
 */

import { SENSOR_PRESETS, matchSensorPreset } from '@ste/catalogs';
import { InputSection } from '../components/InputSection.js';
import { QuantityInput } from '../components/QuantityInput.js';
import { formatResult } from '../components/format.js';
import { useDesign } from '../state/store.js';

export function CameraSection(): JSX.Element {
  const { design, edit, results } = useDesign();
  const s = design.camera.sensor;
  const geometry = results.results.static_geometry;

  const status =
    s.sensor_width_mm == null || s.horizontal_pixels == null || s.pixel_pitch_x_um == null
      ? 'invalid'
      : 'complete';

  return (
    <InputSection title="Camera" status={status} defaultOpen>
      <label className="quantity">
        <span className="quantity__label">Sensor preset</span>
        <select
          className="quantity__select"
          value={matchSensorPreset(s)}
          onChange={(e) => {
            const preset = SENSOR_PRESETS.find((p) => p.id === e.target.value);
            if (preset != null)
              edit((d) => {
                d.camera.sensor = structuredClone(preset.sensor);
              });
          }}
        >
          {SENSOR_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </label>

      <QuantityInput
        label="Pixel pitch"
        value={s.pixel_pitch_x_um}
        unit="µm"
        step={0.1}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            d.camera.sensor.pixel_pitch_x_um = v;
            d.camera.sensor.pixel_pitch_y_um = v;
          })
        }
      />
      <QuantityInput
        label="Horizontal pixels"
        value={s.horizontal_pixels}
        step={1}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            d.camera.sensor.horizontal_pixels = v;
          })
        }
      />
      <QuantityInput
        label="Vertical pixels"
        value={s.vertical_pixels}
        step={1}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            d.camera.sensor.vertical_pixels = v;
          })
        }
      />
      <QuantityInput
        label="Sensor width"
        value={s.sensor_width_mm}
        unit="mm"
        step={0.1}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            d.camera.sensor.sensor_width_mm = v;
          })
        }
      />
      <QuantityInput
        label="Sensor height"
        value={s.sensor_height_mm}
        unit="mm"
        step={0.1}
        min={0}
        onCommit={(v) =>
          edit((d) => {
            d.camera.sensor.sensor_height_mm = v;
          })
        }
      />

      <dl className="derived">
        <div>
          <dt>Image scale</dt>
          <dd>{formatResult(geometry?.image_scale_x_arcsec_per_px)}</dd>
        </div>
        <div>
          <dt>Field of view</dt>
          <dd>
            {formatResult(geometry?.field_of_view_x_deg)} ×{' '}
            {formatResult(geometry?.field_of_view_y_deg)}
          </dd>
        </div>
      </dl>
    </InputSection>
  );
}
