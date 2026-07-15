/**
 * Quantity input (spec v0.9 §24 R1-003, §5).
 *
 * A labelled numeric field with draft/commit semantics: the user types freely
 * and the value is committed on blur or Enter. An empty field commits `null`
 * (unknown), which is distinct from 0 (v0.8 §2.4). Invalid text is preserved
 * until corrected rather than silently reset.
 */

import { useEffect, useState } from 'react';

interface QuantityInputProps {
  label: string;
  value: number | null;
  unit?: string;
  onCommit: (value: number | null) => void;
  step?: number;
  min?: number;
  id?: string;
}

export function QuantityInput({
  label,
  value,
  unit,
  onCommit,
  step,
  min,
  id,
}: QuantityInputProps): JSX.Element {
  const [draft, setDraft] = useState<string>(value == null ? '' : String(value));

  // Re-sync when the committed value changes from elsewhere (import, reset).
  useEffect(() => {
    setDraft(value == null ? '' : String(value));
  }, [value]);

  const commit = (): void => {
    const trimmed = draft.trim();
    if (trimmed === '') {
      onCommit(null);
      return;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) onCommit(parsed);
  };

  const inputId = id ?? `q_${label.replace(/\s+/g, '_').toLowerCase()}`;

  return (
    <label className="quantity" htmlFor={inputId}>
      <span className="quantity__label">{label}</span>
      <span className="quantity__field">
        <input
          id={inputId}
          className="quantity__input"
          type="number"
          inputMode="decimal"
          value={draft}
          step={step}
          min={min}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit();
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        {unit != null && <span className="quantity__unit">{unit}</span>}
      </span>
    </label>
  );
}
