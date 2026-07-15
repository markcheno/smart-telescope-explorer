/**
 * Recommendations panel (spec v0.9 §24 R2-030/031).
 *
 * Lists the prioritised recommendations with their problem statement and, when a
 * change is proposed, an Apply button that edits the design and recomputes
 * (gate items 12–13).
 */

import { prettifyEnum } from '../components/format.js';
import { useDesign } from '../state/store.js';

export function RecommendationsPanel(): JSX.Element {
  const { results, applyRecommendation } = useDesign();
  const recs = results.recommendations ?? [];

  if (recs.length === 0) {
    return <p className="view__summary">No recommendations — the design looks balanced.</p>;
  }

  return (
    <ul className="recs">
      {recs.map((rec) => (
        <li key={rec.recommendation_id} className={`recs__item recs__item--${rec.severity}`}>
          <div className="recs__head">
            <span className="recs__severity">{prettifyEnum(rec.severity)}</span>
            <span className="recs__title">{rec.title}</span>
          </div>
          <p className="recs__problem">{rec.problem}</p>
          {rec.proposed_changes != null && rec.proposed_changes.length > 0 && (
            <button type="button" className="recs__apply" onClick={() => applyRecommendation(rec)}>
              Apply
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
