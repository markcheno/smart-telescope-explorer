/**
 * Report view (spec v0.7 §18 E12; v0.5 §44; v0.8 §44).
 *
 * Renders the pure report built from the current design + results — cover,
 * executive summary, ordered sections, recommendations, assumptions, versions.
 * The renderer never recalculates; it only formats the values the engine already
 * produced. A location-privacy selector controls coordinate disclosure and a
 * Print action produces the printable report.
 */

import { useState } from 'react';
import { buildReport } from '@ste/engine-core';
import type { LocationPrivacyMode, ReportRow, ResultValue } from '@ste/schema';
import { LOCATION_PRIVACY_MODES } from '@ste/schema';
import { formatResult, prettifyEnum } from '../components/format.js';
import { useDesign } from '../state/store.js';

function isResultValue(v: ReportRow['value']): v is ResultValue<unknown> {
  return typeof v === 'object' && v !== null && 'status' in v;
}

function RowValue({ value }: { value: ReportRow['value'] }): JSX.Element {
  if (value == null) return <span className="report__unknown">unknown</span>;
  if (isResultValue(value)) {
    const conf = value.confidence?.level;
    return (
      <span>
        {formatResult(value)}
        {conf != null && conf !== 'high' && (
          <span className={`report__conf report__conf--${conf}`}>{conf}</span>
        )}
      </span>
    );
  }
  return <span>{value}</span>;
}

export function ReportView(): JSX.Element {
  const { design, results } = useDesign();
  const [privacy, setPrivacy] = useState<LocationPrivacyMode>('exact');

  // Renderer only — a fixed generated_at keeps re-renders stable within a view.
  const report = buildReport(design, results, {
    privacy: { location_mode: privacy },
    generated_at: results.completed_at,
  });

  return (
    <div className="report">
      <div className="report__toolbar no-print">
        <label className="quantity quantity--inline">
          <span className="quantity__label">Coordinates</span>
          <select
            className="quantity__select"
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value as LocationPrivacyMode)}
          >
            {LOCATION_PRIVACY_MODES.map((m) => (
              <option key={m} value={m}>
                {prettifyEnum(m)}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => window.print()}>
          Print / Save PDF
        </button>
      </div>

      <header className="report__cover">
        <h1 className="report__title">{report.cover.name}</h1>
        <dl className="report__cover-grid">
          <div>
            <dt>Target</dt>
            <dd>{report.cover.target}</dd>
          </div>
          <div>
            <dt>Scenario</dt>
            <dd>{report.cover.scenario}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{prettifyEnum(report.cover.status)}</dd>
          </div>
          <div>
            <dt>Generated</dt>
            <dd>{report.cover.generated_at ?? '—'}</dd>
          </div>
        </dl>
      </header>

      <section className="report__summary">
        <h2>Executive summary</h2>
        <dl className="report__metrics">
          <div>
            <dt>Recommended exposure</dt>
            <dd>
              <RowValue value={report.summary.recommended_exposure} />
            </dd>
          </div>
          <div>
            <dt>Frames accepted</dt>
            <dd>
              <RowValue value={report.summary.frame_yield} />
            </dd>
          </div>
          <div>
            <dt>Effective integration</dt>
            <dd>
              <RowValue value={report.summary.effective_integration} />
            </dd>
          </div>
        </dl>
        {report.summary.strengths.length > 0 && (
          <>
            <h3 className="report__good">Strengths</h3>
            <ul>
              {report.summary.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </>
        )}
        {report.summary.limitations.length > 0 && (
          <>
            <h3 className="report__bad">Limitations</h3>
            <ul>
              {report.summary.limitations.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </>
        )}
        {report.summary.top_recommendations.length > 0 && (
          <>
            <h3>Top recommendations</h3>
            <ol>
              {report.summary.top_recommendations.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </>
        )}
      </section>

      {report.sections.map((section) => (
        <section key={section.id} className="report__section">
          <h2>{section.title}</h2>
          <dl className="report__rows">
            {section.rows.map((r) => (
              <div key={r.label}>
                <dt>{r.label}</dt>
                <dd>
                  <RowValue value={r.value} />
                  {r.note != null && <span className="report__note"> — {r.note}</span>}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {report.assumptions.length > 0 && (
        <section className="report__section">
          <h2>Assumptions & confidence</h2>
          <ul className="report__assumptions">
            {report.assumptions.map((a) => (
              <li key={a.label}>
                <strong>{a.label}</strong>
                {a.confidence != null && (
                  <span className={`report__conf report__conf--${a.confidence}`}>
                    {a.confidence}
                  </span>
                )}
                {a.detail !== '' && <div className="report__note">{a.detail}</div>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="report__versions">
        Schema {report.versions.schema} · Engine {report.versions.engine} · Template{' '}
        {report.versions.report_template}
      </footer>
    </div>
  );
}
