/**
 * Comparison tray (spec v0.9 §3/§40).
 *
 * A collapsed footer that pins the current design and commercial references, then
 * expands into the side-by-side comparison table. Up to four designs (current +
 * three pinned).
 */

import { useState } from 'react';
import { ComparisonTable } from '../analysis/ComparisonTable.js';
import { useDesign } from '../state/store.js';

export function ComparisonTray(): JSX.Element {
  const { pinnedDesigns, referenceDesigns, comparison, pinCurrent, pinDesign, unpinDesign } =
    useDesign();
  const [open, setOpen] = useState(false);
  const canPin = pinnedDesigns.length < 3;

  return (
    <footer className="tray" aria-label="Comparison tray">
      <div className="tray__bar">
        <button
          type="button"
          className="tray__toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          disabled={comparison == null}
        >
          {open ? '▾' : '▸'} Comparison · {pinnedDesigns.length} pinned
        </button>
        <button type="button" onClick={pinCurrent} disabled={!canPin}>
          Pin current
        </button>
        {referenceDesigns.map((ref) => (
          <button
            key={ref.design_id}
            type="button"
            onClick={() => pinDesign(ref, ref.metadata.name)}
            disabled={!canPin}
          >
            + {ref.metadata.name}
          </button>
        ))}
        <div className="tray__chips">
          {pinnedDesigns.map((p, i) => (
            <span key={i} className="tray__chip">
              {p.label}
              <button
                type="button"
                aria-label={`Remove ${p.label}`}
                onClick={() => unpinDesign(i)}
                className="tray__chip-remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      {open && comparison != null && (
        <div className="tray__panel">
          <ComparisonTable comparison={comparison} />
        </div>
      )}
    </footer>
  );
}
