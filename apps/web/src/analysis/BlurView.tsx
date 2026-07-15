/**
 * Blur view (spec v0.9 §12, §24 R2-027).
 *
 * Lists the blur contributions (base, motion, rotation, pixel), draws the final
 * star ellipse from the major/minor FWHM and axis angle, and shows elongation
 * and the dominant source. Everything reads off the blur result group.
 */

import { formatResult, prettifyEnum } from '../components/format.js';
import { MetricRow } from './MetricRow.js';
import { useDesign } from '../state/store.js';

export function BlurView(): JSX.Element {
  const { results } = useDesign();
  const b = results.results.blur;
  const major = b?.major_fwhm_arcsec.value;
  const minor = b?.minor_fwhm_arcsec.value;
  const angle = b?.axis_angle_deg.value;

  const size = 200;
  const c = size / 2;
  let rx = 30;
  let ry = 30;
  if (typeof major === 'number' && typeof minor === 'number' && major > 0) {
    const scale = (size * 0.4) / major;
    rx = Math.max(major * scale, 2);
    ry = Math.max(minor * scale, 2);
  }

  return (
    <div className="view">
      <h2 className="view__title">Blur</h2>
      {b == null || b.major_fwhm_arcsec.status === 'unavailable' ? (
        <p className="view__empty">
          Configure optics, camera, and tracking to see the blur ellipse.
        </p>
      ) : (
        <div className="sampling">
          <div className="sampling__grid-wrap">
            <svg
              className="sampling-svg"
              viewBox={`0 0 ${size} ${size}`}
              role="img"
              aria-label="Final star ellipse"
            >
              <ellipse
                cx={c}
                cy={c}
                rx={rx}
                ry={ry}
                transform={`rotate(${typeof angle === 'number' ? -angle : 0} ${c} ${c})`}
                fill="url(#blurStar)"
                stroke="var(--accent)"
                strokeWidth={1.5}
              />
              <defs>
                <radialGradient id="blurStar" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--star-core)" />
                  <stop offset="100%" stopColor="var(--star-edge)" />
                </radialGradient>
              </defs>
            </svg>
            <p className="view__caption">
              Elongation {formatResult(b.elongation)} · dominant{' '}
              {b.dominant_contribution.value != null
                ? prettifyEnum(String(b.dominant_contribution.value))
                : 'unknown'}
            </p>
          </div>
          <div className="sampling__table">
            <MetricRow label="Base (seeing/optics)" rv={b.base_fwhm_arcsec} />
            <MetricRow label="Motion" rv={b.motion_fwhm_arcsec} />
            <MetricRow label="Rotation" rv={b.rotation_fwhm_arcsec} />
            <MetricRow label="Pixel" rv={b.pixel_fwhm_arcsec} />
            <div className="sampling__divider" />
            <MetricRow label="Major FWHM" rv={b.major_fwhm_arcsec} />
            <MetricRow label="Minor FWHM" rv={b.minor_fwhm_arcsec} />
            <MetricRow label="Elongation" rv={b.elongation} />
            <MetricRow label="Quality" rv={b.quality} />
          </div>
        </div>
      )}
    </div>
  );
}
