/**
 * Field rotation view (spec v0.9 §11, §24 R2-028).
 *
 * Corner vectors around the sensor (center has zero motion), the rotation rate,
 * and the exposure limit now vs the session worst case. An equatorial mount
 * shows zero rotation.
 */

import { MetricRow } from './MetricRow.js';
import { useDesign } from '../state/store.js';

export function FieldRotationView(): JSX.Element {
  const { results } = useDesign();
  const r = results.results.field_rotation;
  const cornerPx = r?.corner_motion_px.value;

  const size = 200;
  const c = size / 2;
  const half = 60;
  // Corner vector length scales with corner motion (capped for display).
  const vlen = typeof cornerPx === 'number' ? Math.min(cornerPx, 3) * 8 : 0;
  const corners = [
    [c - half, c - half, -1, -1],
    [c + half, c - half, 1, -1],
    [c + half, c + half, 1, 1],
    [c - half, c + half, -1, 1],
  ] as const;

  return (
    <div className="view">
      <h2 className="view__title">Field Rotation</h2>
      {r == null || r.corner_motion_px.status === 'unavailable' ? (
        <p className="view__empty">Configure a session and mount to see field rotation.</p>
      ) : (
        <div className="sampling">
          <div className="sampling__grid-wrap">
            <svg
              className="sampling-svg"
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label="Corner rotation vectors"
            >
              <rect
                x={c - half}
                y={c - half}
                width={half * 2}
                height={half * 2}
                className="framing-svg__sensor"
              />
              <circle cx={c} cy={c} r={2} fill="var(--muted)" />
              {corners.map(([x, y, sx, sy], i) => (
                <line
                  key={i}
                  x1={x}
                  y1={y}
                  x2={x - sy * vlen}
                  y2={y + sx * vlen}
                  stroke="var(--good)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              ))}
            </svg>
            <p className="view__caption">Center is fixed; corners rotate.</p>
          </div>
          <div className="sampling__table">
            <MetricRow label="Rotation rate" rv={r.rotation_rate_deg_per_hr} />
            <MetricRow label="Δ rotation / frame" rv={r.delta_rotation_deg} />
            <MetricRow label="Center motion" rv={r.center_motion_px} />
            <MetricRow label="Corner motion" rv={r.corner_motion_px} />
            <div className="sampling__divider" />
            <MetricRow label="Exposure limit (now)" rv={r.rotation_exposure_limit_s} />
            <MetricRow label="Session min limit" rv={r.session_min_exposure_limit_s} />
            <MetricRow label="Quality" rv={r.quality} />
          </div>
        </div>
      )}
      <p className="view__summary">
        An equatorial mount removes alt-azimuth field rotation. Registration cannot repair
        intra-frame rotation. Corner smear grows toward the zenith.
      </p>
    </div>
  );
}
