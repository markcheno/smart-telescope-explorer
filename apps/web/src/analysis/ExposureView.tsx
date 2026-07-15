/**
 * Exposure view (spec v0.9 §13, §24 R2-029).
 *
 * The candidate table (exposure / acceptance / motion / rotation / duty /
 * relative), the recommended range, and an Apply button. Fixed-session
 * performance is explicitly PRELIMINARY until the R3 stack/noise model.
 */

import { formatResult } from '../components/format.js';
import { MetricRow } from './MetricRow.js';
import { useDesign } from '../state/store.js';

const pct = (v: number): string => `${Math.round(v * 100)}%`;

export function ExposureView(): JSX.Element {
  const { results, edit } = useDesign();
  const e = results.results.exposure_sweep;
  const best = e?.best_exposure_s.value;

  return (
    <div className="view">
      <h2 className="view__title">
        Exposure <span className="view__tag">preliminary</span>
      </h2>
      {e == null || e.candidates.length === 0 ? (
        <p className="view__empty">Configure tracking and a session to sweep exposures.</p>
      ) : (
        <>
          <div className="exposure__summary">
            <span>
              Recommended {formatResult(e.recommended_min_s)}–{formatResult(e.recommended_max_s)}
            </span>
            {typeof best === 'number' && (
              <button
                type="button"
                className="appbar__primary"
                onClick={() =>
                  edit((d) => {
                    d.capture.exposure_s = best;
                  })
                }
              >
                Apply {best} s
              </button>
            )}
          </div>
          <div className="table-scroll">
            <table className="exposure-table">
              <thead>
                <tr>
                  <th>Exp (s)</th>
                  <th>Accept</th>
                  <th>Motion (px)</th>
                  <th>Rotation (px)</th>
                  <th>Duty</th>
                  <th>Relative</th>
                </tr>
              </thead>
              <tbody>
                {e.candidates.map((row) => (
                  <tr
                    key={row.exposure_s}
                    className={row.feasible ? '' : 'exposure-table__infeasible'}
                  >
                    <td>{row.exposure_s}</td>
                    <td>{pct(row.acceptance)}</td>
                    <td>{row.motion_px.toFixed(2)}</td>
                    <td>{row.rotation_px.toFixed(2)}</td>
                    <td>{pct(row.duty_cycle)}</td>
                    <td>{row.relative_score.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="sampling__table">
            <MetricRow label="Shortest practical" rv={e.shortest_practical_s} />
            <MetricRow label="Longest acceptable" rv={e.longest_acceptable_s} />
            <MetricRow label="Hard limit" rv={e.hard_limit_s} />
          </div>
          <p className="view__summary">
            Shorter: overhead matters. Longer: rejection rises. Fixed-session performance is
            preliminary until the stack/noise model.
          </p>
        </>
      )}
    </div>
  );
}
