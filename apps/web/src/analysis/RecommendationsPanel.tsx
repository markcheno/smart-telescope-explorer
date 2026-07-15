/**
 * Recommendations panel (spec v0.9 §24 R2-030/031, §39; v0.8 §28).
 *
 * Lists prioritised recommendations. Preview clones the design, recomputes, and
 * shows the before→after of each affected metric plus the next bottleneck,
 * without committing; Apply edits the design and recomputes (gate items 12–13).
 */

import { useState } from 'react';
import { previewRecommendation } from '@ste/engine-core';
import type { PreviewMetricChange, RecommendationPreview } from '@ste/schema';
import { prettifyEnum } from '../components/format.js';
import { useDesign } from '../state/store.js';

function changeText(m: PreviewMetricChange): string {
  const fmt = (v: number | string | null): string =>
    v == null
      ? '—'
      : typeof v === 'number'
        ? Number.isInteger(v)
          ? String(v)
          : v.toFixed(2)
        : prettifyEnum(v);
  return `${m.label}: ${fmt(m.before)} → ${fmt(m.after)}`;
}

function PreviewBlock({ preview }: { preview: RecommendationPreview }): JSX.Element {
  return (
    <div className={`recs__preview recs__preview--${preview.status}`}>
      <div className="recs__preview-status">{prettifyEnum(preview.status)}</div>
      {preview.benefits.map((b) => (
        <div key={b.metric} className="recs__preview-benefit">
          ▲ {changeText(b)}
        </div>
      ))}
      {preview.regressions.map((r) => (
        <div key={r.metric} className="recs__preview-regression">
          ▼ {changeText(r)}
        </div>
      ))}
      {preview.violated_constraints.length > 0 && (
        <div className="recs__preview-regression">
          Breaks constraint: {preview.violated_constraints.join(', ')}
        </div>
      )}
      {preview.next_bottleneck != null && (
        <div className="recs__preview-next">Next bottleneck: {preview.next_bottleneck}</div>
      )}
    </div>
  );
}

export function RecommendationsPanel(): JSX.Element {
  const { design, results, applyRecommendation } = useDesign();
  const recs = results.recommendations ?? [];
  const [previews, setPreviews] = useState<Record<string, RecommendationPreview>>({});

  if (recs.length === 0) {
    return <p className="view__summary">No recommendations — the design looks balanced.</p>;
  }

  return (
    <ul className="recs">
      {recs.map((rec) => {
        const hasChange = rec.proposed_changes != null && rec.proposed_changes.length > 0;
        const preview = previews[rec.recommendation_id];
        return (
          <li key={rec.recommendation_id} className={`recs__item recs__item--${rec.severity}`}>
            <div className="recs__head">
              <span className="recs__severity">{prettifyEnum(rec.severity)}</span>
              <span className="recs__title">{rec.title}</span>
            </div>
            <p className="recs__problem">{rec.problem}</p>
            {preview != null && <PreviewBlock preview={preview} />}
            {hasChange && (
              <div className="recs__actions">
                <button
                  type="button"
                  className="recs__preview-btn"
                  onClick={() =>
                    setPreviews((prev) => ({
                      ...prev,
                      [rec.recommendation_id]: previewRecommendation(design, rec),
                    }))
                  }
                >
                  Preview
                </button>
                <button
                  type="button"
                  className="recs__apply"
                  onClick={() => applyRecommendation(rec)}
                >
                  Apply
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
