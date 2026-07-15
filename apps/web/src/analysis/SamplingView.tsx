/**
 * Sampling view (spec v0.9 §9, §24 R1-019).
 *
 * Shows the PSF contributions (seeing, diffraction, optical), the combined base
 * FWHM, the sampling ratio and classification, and a diagnostic pixel-grid star
 * whose blur radius reflects base FWHM in pixels. The star is diagnostic, not
 * photorealistic (v0.9 §9).
 */

import type { ResultValue } from '@ste/schema';
import { CONFIDENCE_LABEL, confidenceLevel, formatResult } from '../components/format.js';
import { useDesign } from '../state/store.js';

const GRID = 7; // pixels across the diagnostic grid
const CELL = 26;

function Row({ label, rv }: { label: string; rv: ResultValue<unknown> | undefined }): JSX.Element {
  const level = confidenceLevel(rv);
  return (
    <div className="sampling__row">
      <span className="sampling__label">{label}</span>
      <span className="sampling__value">{formatResult(rv)}</span>
      {level != null && (
        <span className={`chip chip--${level}`} title={CONFIDENCE_LABEL[level]}>
          {level}
        </span>
      )}
    </div>
  );
}

export function SamplingView(): JSX.Element {
  const { results } = useDesign();
  const s = results.results.sampling;
  const fwhmPx = s?.base_fwhm_px.value ?? null;

  const size = GRID * CELL;
  const center = size / 2;
  // sigma in pixels from FWHM (px); scale to grid cells for the visual.
  const sigmaCells = fwhmPx != null ? fwhmPx / 2.355 : null;
  const rVisual = sigmaCells != null ? Math.max(sigmaCells * CELL, 3) : null;

  return (
    <div className="view">
      <h2 className="view__title">Sampling</h2>
      <div className="sampling">
        <div className="sampling__grid-wrap">
          <svg
            className="sampling-svg"
            viewBox={`0 0 ${size} ${size}`}
            role="img"
            aria-label="Diagnostic pixel-grid star profile"
          >
            <defs>
              <radialGradient id="star" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--star-core)" />
                <stop offset="100%" stopColor="var(--star-edge)" />
              </radialGradient>
            </defs>
            {Array.from({ length: GRID + 1 }, (_, i) => (
              <g key={i}>
                <line x1={i * CELL} y1={0} x2={i * CELL} y2={size} className="sampling-svg__grid" />
                <line x1={0} y1={i * CELL} x2={size} y2={i * CELL} className="sampling-svg__grid" />
              </g>
            ))}
            {rVisual != null && (
              <circle cx={center} cy={center} r={Math.min(rVisual, size / 2)} fill="url(#star)" />
            )}
          </svg>
          <p className="view__caption">Diagnostic star (blur ≈ {formatResult(s?.base_fwhm_px)})</p>
        </div>
        <div className="sampling__table">
          <Row label="Seeing" rv={s?.seeing_fwhm_arcsec} />
          <Row label="Diffraction" rv={s?.diffraction_fwhm_arcsec} />
          <Row label="Optical quality" rv={s?.optical_fwhm_arcsec} />
          <div className="sampling__divider" />
          <Row label="Combined base" rv={s?.base_fwhm_arcsec} />
          <Row label="Pixels / FWHM" rv={s?.pixels_per_fwhm} />
          <Row label="Classification" rv={s?.classification} />
        </div>
      </div>
    </div>
  );
}
