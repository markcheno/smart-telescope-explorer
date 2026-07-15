/**
 * Results rail (spec v0.9 §6, §24 R1-016).
 *
 * Persistent cards for the key R1 answers: design status, target fit, image
 * scale, FOV, sampling, and assumptions. Each card reads confidence off the
 * result; unavailable values render as "unknown" rather than a fabricated number.
 */

import type { ResultValue } from '@ste/schema';
import { CONFIDENCE_LABEL, confidenceLevel, formatResult } from './format.js';
import { useDesign } from '../state/store.js';

function ResultCard({
  title,
  rv,
  hint,
}: {
  title: string;
  rv: ResultValue<unknown> | undefined;
  hint?: string;
}): JSX.Element {
  const level = confidenceLevel(rv);
  return (
    <div className="card">
      <div className="card__title">{title}</div>
      <div className="card__value">{formatResult(rv)}</div>
      {level != null && (
        <div className={`card__confidence card__confidence--${level}`}>
          {CONFIDENCE_LABEL[level]}
        </div>
      )}
      {hint != null && <div className="card__hint">{hint}</div>}
    </div>
  );
}

export function ResultsRail(): JSX.Element {
  const { results } = useDesign();
  const g = results.results.static_geometry;
  const framing = results.results.target_framing;
  const sampling = results.results.sampling;
  const errorCount = results.issues.filter(
    (i) => i.severity === 'error' || i.severity === 'fatal',
  ).length;

  return (
    <aside className="rail" aria-label="Results">
      <div className="rail__status">
        <div className="rail__status-title">Design status</div>
        <div className="rail__status-value">
          {errorCount > 0 ? `${errorCount} error${errorCount > 1 ? 's' : ''}` : 'OK'}
          {results.assumptions.length > 0 && ` · uses ${results.assumptions.length} assumptions`}
        </div>
      </div>

      <ResultCard title="Target fit" rv={framing?.fit_status} />
      <ResultCard title="Image scale" rv={g?.image_scale_x_arcsec_per_px} />
      <ResultCard
        title="Field of view"
        rv={g?.field_of_view_x_deg}
        hint={`× ${formatResult(g?.field_of_view_y_deg)}`}
      />
      <ResultCard
        title="Sampling"
        rv={sampling?.classification}
        hint={`${formatResult(sampling?.pixels_per_fwhm)} px/FWHM`}
      />
      <ResultCard title="Base star FWHM" rv={sampling?.base_fwhm_arcsec} />
    </aside>
  );
}
