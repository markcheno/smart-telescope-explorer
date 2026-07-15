/**
 * Tracking view (spec v0.9 §10, §24 R2-026).
 *
 * Shows the during-exposure motion metrics (max/RMS displacement, motion FWHM),
 * the phase-sweep policy result, and the dominant component. A schematic motion
 * indicator sizes to the max displacement; unknowns render as "unknown".
 */

import { prettifyEnum } from '../components/format.js';
import { MetricRow } from './MetricRow.js';
import { useDesign } from '../state/store.js';

export function TrackingView(): JSX.Element {
  const { results } = useDesign();
  const t = results.results.tracking;
  const maxPx = t?.motion_max_displacement_px.value;
  const dominant = t?.dominant_component.value;

  const size = 200;
  const c = size / 2;
  // Scale the schematic so a 1 px motion fills ~40% of the box.
  const lengthPx = typeof maxPx === 'number' ? Math.min(maxPx, 5) : 0;
  const half = (lengthPx / 5) * (size * 0.4);

  return (
    <div className="view">
      <h2 className="view__title">Tracking</h2>
      {t == null || t.motion_max_displacement_arcsec.status === 'unavailable' ? (
        <p className="view__empty">Enter tracking error and an exposure to see star motion.</p>
      ) : (
        <div className="sampling">
          <div className="sampling__grid-wrap">
            <svg
              className="sampling-svg"
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label="Star motion schematic"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <g key={i}>
                  <line
                    x1={(i * size) / 4}
                    y1={0}
                    x2={(i * size) / 4}
                    y2={size}
                    className="sampling-svg__grid"
                  />
                  <line
                    x1={0}
                    y1={(i * size) / 4}
                    x2={size}
                    y2={(i * size) / 4}
                    className="sampling-svg__grid"
                  />
                </g>
              ))}
              <line
                x1={c - half}
                y1={c}
                x2={c + half}
                y2={c}
                stroke="var(--accent)"
                strokeWidth={3}
                strokeLinecap="round"
              />
              <circle cx={c - half} cy={c} r={3} fill="var(--star-core)" />
            </svg>
            <p className="view__caption">
              Motion path (dominant: {dominant != null ? prettifyEnum(String(dominant)) : 'unknown'}
              )
            </p>
          </div>
          <div className="sampling__table">
            <MetricRow label="Exposure" rv={t.exposure_s} />
            <MetricRow label="Max displacement" rv={t.motion_max_displacement_px} />
            <MetricRow label="RMS displacement" rv={t.motion_rms_displacement_arcsec} />
            <MetricRow label="Motion FWHM" rv={t.motion_fwhm_arcsec} />
            <div className="sampling__divider" />
            <MetricRow label="Median (24 phases)" rv={t.median_max_displacement_arcsec} />
            <MetricRow label="95th percentile" rv={t.p95_max_displacement_arcsec} />
            <MetricRow label="Worst" rv={t.worst_max_displacement_arcsec} />
            <MetricRow label="Quality" rv={t.quality} />
          </div>
        </div>
      )}
      <p className="view__summary">
        Correctable between frames: accumulated pointing offset. Not correctable: motion recorded
        during the exposure.
      </p>
    </div>
  );
}
