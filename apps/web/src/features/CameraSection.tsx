/**
 * Camera section (spec v0.9 §24 R1-012, R1-013).
 *
 * Sensor presets (IMX585/678/662 and generic pitches) plus editable dimensions,
 * resolution, and pixel pitch. Derived image scale and FOV are read from results.
 */

import type { SensorInput } from '@ste/schema';
import { InputSection } from '../components/InputSection.js';
import { QuantityInput } from '../components/QuantityInput.js';
import { formatResult } from '../components/format.js';
import { useDesign } from '../state/store.js';

interface SensorPreset {
  id: string;
  label: string;
  sensor: SensorInput;
}

/** R1 seed sensor presets (v0.9 §24 R1-012). */
const SENSOR_PRESETS: SensorPreset[] = [
  {
    id: 'imx585',
    label: 'Sony IMX585 (3840×2160, 2.9 µm)',
    sensor: sensor(11.136, 6.264, 3840, 2160, 2.9),
  },
  {
    id: 'imx678',
    label: 'Sony IMX678 (3840×2160, 2.0 µm)',
    sensor: sensor(7.68, 4.32, 3840, 2160, 2.0),
  },
  {
    id: 'imx662',
    label: 'Sony IMX662 (1920×1080, 2.9 µm)',
    sensor: sensor(5.568, 3.132, 1920, 1080, 2.9),
  },
];

function sensor(w: number, h: number, px: number, py: number, pitch: number): SensorInput {
  return {
    sensor_width_mm: w,
    sensor_height_mm: h,
    horizontal_pixels: px,
    vertical_pixels: py,
    pixel_pitch_x_um: pitch,
    pixel_pitch_y_um: pitch,
    color_mode: 'color',
  };
}

function matchPreset(s: SensorInput): string {
  const found = SENSOR_PRESETS.find(
    (p) =>
      p.sensor.horizontal_pixels === s.horizontal_pixels &&
      p.sensor.pixel_pitch_x_um === s.pixel_pitch_x_um,
  );
  return found?.id ?? 'custom';
}

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
          value={matchPreset(s)}
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
