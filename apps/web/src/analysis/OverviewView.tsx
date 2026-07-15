/**
 * Overview view (spec v0.9 §7, §24 R1-017).
 *
 * A compact summary: the primary answers plus the top issue/limitation. Missing
 * metrics are shown as unknown, never fabricated (v0.9 §7).
 */

import { formatResult } from '../components/format.js';
import { RecommendationsPanel } from './RecommendationsPanel.js';
import { useDesign } from '../state/store.js';

export function OverviewView(): JSX.Element {
  const { results } = useDesign();
  const g = results.results.static_geometry;
  const framing = results.results.target_framing;
  const sampling = results.results.sampling;
  const blur = results.results.blur;
  const exposure = results.results.exposure_sweep;
  const sensitivity = results.results.sensitivity;
  const session = results.results.session;
  const topIssue = results.issues.find((i) => i.severity === 'error' || i.severity === 'warning');

  return (
    <div className="view">
      <h2 className="view__title">Overview</h2>
      <div className="overview__grid">
        <Metric label="Target fit" value={formatResult(framing?.fit_status)} />
        <Metric label="Image scale" value={formatResult(g?.image_scale_x_arcsec_per_px)} />
        <Metric
          label="Field of view"
          value={`${formatResult(g?.field_of_view_x_deg)} × ${formatResult(g?.field_of_view_y_deg)}`}
        />
        <Metric label="Sampling" value={formatResult(sampling?.classification)} />
        <Metric label="Final blur (major)" value={formatResult(blur?.major_fwhm_arcsec)} />
        <Metric label="Elongation" value={formatResult(blur?.elongation)} />
        <Metric label="Recommended exposure" value={formatResult(exposure?.best_exposure_s)} />
        <Metric
          label="Effective integration"
          value={formatResult(session?.effective_integration_s)}
        />
        <Metric
          label="Relative SNR score"
          value={formatResult(sensitivity?.relative_stack_score)}
        />
      </div>
      <div className="overview__limitation">
        <span className="overview__limitation-label">Primary limitation</span>
        <span>{topIssue != null ? topIssue.message : 'No blocking issues detected.'}</span>
      </div>
      <h3 className="overview__subtitle">Recommendations</h3>
      <RecommendationsPanel />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="metric">
      <div className="metric__label">{label}</div>
      <div className="metric__value">{value}</div>
    </div>
  );
}
