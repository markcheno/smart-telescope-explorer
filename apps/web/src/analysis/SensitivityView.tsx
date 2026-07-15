/**
 * Sensitivity view (spec v0.9 §24 R3; v0.4 §23).
 *
 * Relative throughput factors + the fixed-session stacked-SNR score, plus the
 * session yield (accepted frames, effective integration) and stack retention.
 * Values are RELATIVE — their ratios compare designs; absolute SNR is shown only
 * when photometric data is adequate (currently never in v1).
 */

import { MetricRow } from './MetricRow.js';
import { useDesign } from '../state/store.js';

export function SensitivityView(): JSX.Element {
  const { results } = useDesign();
  const s = results.results.sensitivity;
  const sess = results.results.session;
  const stack = results.results.stack_geometry;

  return (
    <div className="view">
      <h2 className="view__title">Sensitivity</h2>
      {s == null ? (
        <p className="view__empty">Configure optics and camera to see relative sensitivity.</p>
      ) : (
        <div className="sampling">
          <div className="sampling__table">
            <div className="sampling__group-title">Throughput (relative)</div>
            <MetricRow label="Effective aperture area" rv={s.effective_area_mm2} />
            <MetricRow label="Effective QE" rv={s.effective_qe} />
            <MetricRow label="Pixel solid angle" rv={s.pixel_solid_angle_arcsec2} />
            <MetricRow label="Atmospheric throughput" rv={s.atmospheric_throughput} />
            <MetricRow label="Point-source throughput" rv={s.point_source_throughput} />
            <MetricRow label="Extended per-pixel" rv={s.extended_per_pixel_throughput} />
            <div className="sampling__divider" />
            <MetricRow label="Relative stacked-SNR score" rv={s.relative_stack_score} />
          </div>
          <div className="sampling__table">
            <div className="sampling__group-title">Session yield</div>
            <MetricRow label="Frames attempted" rv={sess?.frames_attempted} />
            <MetricRow label="Frames accepted" rv={sess?.frames_accepted} />
            <MetricRow label="Acceptance" rv={sess?.acceptance_fraction} />
            <MetricRow label="Effective integration" rv={sess?.effective_integration_s} />
            <MetricRow label="Duty cycle" rv={sess?.duty_cycle} />
            <div className="sampling__divider" />
            <div className="sampling__group-title">Stack geometry</div>
            <MetricRow label="Common coverage" rv={stack?.common_coverage_fraction} />
            <MetricRow label="Target retention" rv={stack?.target_retention_fraction} />
          </div>
        </div>
      )}
      <p className="view__summary">
        Throughput and stacked-SNR are relative figures — their ratios compare designs. Absolute SNR
        needs target brightness data.
      </p>
    </div>
  );
}
