/**
 * Framing view (spec v0.9 §8, §24 R1-018).
 *
 * Custom SVG showing the sensor rectangle, the target (ellipse, rotated by its
 * position angle), and the image circle when known. All geometry comes from the
 * engine's framing results; nothing is recomputed here. Unavailable data shows a
 * prompt rather than a fabricated frame (v0.9 §7).
 */

import { formatResult, prettifyEnum } from '../components/format.js';
import { useDesign } from '../state/store.js';

const VIEW_W = 360;
const VIEW_H = 240;
const MARGIN = 20;

export function FramingView(): JSX.Element {
  const { design, results } = useDesign();
  const framing = results.results.target_framing;
  const sensor = design.camera.sensor;
  const geometry = resolveGeometry(design);

  const sensorPxW = sensor.horizontal_pixels;
  const sensorPxH = sensor.vertical_pixels;
  const targetW = framing?.target_width_px.value ?? null;
  const targetH = framing?.target_height_px.value ?? null;

  if (sensorPxW == null || sensorPxH == null || targetW == null || targetH == null) {
    return (
      <div className="view">
        <h2 className="view__title">Framing</h2>
        <p className="view__empty">Enter sensor dimensions and a target to see framing.</p>
      </div>
    );
  }

  // Fit the sensor rectangle into the drawing area, preserving aspect ratio.
  const aspect = sensorPxW / sensorPxH;
  const availW = VIEW_W - 2 * MARGIN;
  const availH = VIEW_H - 2 * MARGIN;
  const drawW = aspect > availW / availH ? availW : availH * aspect;
  const drawH = drawW / aspect;
  const x0 = (VIEW_W - drawW) / 2;
  const y0 = (VIEW_H - drawH) / 2;
  const cx = VIEW_W / 2;
  const cy = VIEW_H / 2;

  const rx = Math.min((targetW / sensorPxW) * drawW * 0.5, drawW);
  const ry = Math.min((targetH / sensorPxH) * drawH * 0.5, drawH);
  const pa = geometry?.position_angle_deg ?? 0;

  const fit = framing?.fit_status.value;
  const minMargin = framing?.minimum_margin_fraction.value;

  return (
    <div className="view">
      <h2 className="view__title">Framing</h2>
      <svg
        className="framing-svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={`Target framing: ${fit != null ? prettifyEnum(String(fit)) : 'unknown'}`}
      >
        <rect x={x0} y={y0} width={drawW} height={drawH} className="framing-svg__sensor" rx={2} />
        <ellipse
          cx={cx}
          cy={cy}
          rx={Math.max(rx, 1)}
          ry={Math.max(ry, 1)}
          className="framing-svg__target"
          transform={`rotate(${-pa} ${cx} ${cy})`}
        />
        <line x1={cx - 6} y1={cy} x2={cx + 6} y2={cy} className="framing-svg__crosshair" />
        <line x1={cx} y1={cy - 6} x2={cx} y2={cy + 6} className="framing-svg__crosshair" />
      </svg>
      <p className="view__summary">
        Target fit: <strong>{fit != null ? prettifyEnum(String(fit)) : 'unknown'}</strong>
        {minMargin != null && ` · minimum margin ${(minMargin * 100).toFixed(0)}%`}
        {' · '}
        target {formatResult(framing?.target_width_px)} × {formatResult(framing?.target_height_px)}{' '}
        px
      </p>
    </div>
  );
}

function resolveGeometry(design: ReturnType<typeof useDesign>['design']) {
  const base = design.target.custom_target?.geometry ?? null;
  if (base == null) return null;
  return design.target.overrides?.geometry
    ? { ...base, ...design.target.overrides.geometry }
    : base;
}
