/**
 * Comparison table (spec v0.9 §40; v0.8 §32).
 *
 * Metric rows × design columns, baseline first, with best (▲) / worst (▼)
 * marks and a baseline delta. Every design is normalised onto the baseline's
 * target + scenario, so the hardware is judged on the same sky.
 */

import type { ComparisonMetricCell, ComparisonResponse } from '@ste/schema';
import { prettifyEnum } from '../components/format.js';

function cellText(cell: ComparisonMetricCell): string {
  if (cell.value == null) return 'unknown';
  if (typeof cell.value === 'string') return prettifyEnum(cell.value);
  const v = cell.value;
  return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2);
}

function deltaText(cell: ComparisonMetricCell, baseline: boolean): string {
  if (baseline || cell.baseline_delta == null || cell.baseline_delta === 0) return '';
  const d = cell.baseline_delta;
  return ` (${d > 0 ? '+' : ''}${Math.abs(d) < 1 ? d.toFixed(2) : d.toFixed(1)})`;
}

export function ComparisonTable({ comparison }: { comparison: ComparisonResponse }): JSX.Element {
  const { design_labels: labels, baseline_index: baseIdx, rows } = comparison;
  return (
    <div className="table-scroll">
      <table className="compare-table">
        <thead>
          <tr>
            <th />
            {labels.map((label, i) => (
              <th key={i} className={i === baseIdx ? 'compare-table__baseline' : ''}>
                {label}
                {i === baseIdx ? ' ★' : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.metric}>
              <th scope="row" className="compare-table__label">
                {row.label}
                {row.unit != null ? ` (${row.unit})` : ''}
              </th>
              {row.cells.map((cell, i) => (
                <td
                  key={i}
                  className={`${cell.is_best ? 'compare-table__best' : ''} ${
                    cell.is_worst ? 'compare-table__worst' : ''
                  }`}
                >
                  {cellText(cell)}
                  <span className="compare-table__delta">{deltaText(cell, i === baseIdx)}</span>
                  {cell.is_best ? ' ▲' : cell.is_worst ? ' ▼' : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
