/**
 * Input section (spec v0.9 §24 R1-005, §5).
 *
 * A collapsible group of inputs with a completion/warning indicator. The
 * indicator mirrors the input navigator legend (v0.9 §5): complete, warning,
 * invalid, or optional/unconfigured.
 */

import { useState, type ReactNode } from 'react';

export type SectionStatus = 'complete' | 'warning' | 'invalid' | 'optional';

const STATUS_GLYPH: Record<SectionStatus, string> = {
  complete: '✓',
  warning: '!',
  invalid: '×',
  optional: '—',
};

interface InputSectionProps {
  title: string;
  status: SectionStatus;
  warningCount?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function InputSection({
  title,
  status,
  warningCount,
  defaultOpen = false,
  children,
}: InputSectionProps): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`section section--${status}`}>
      <h3 className="section__header">
        <button
          type="button"
          className="section__toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="section__caret" aria-hidden="true">
            {open ? '▾' : '▸'}
          </span>
          <span className="section__title">{title}</span>
          <span className={`section__status section__status--${status}`} aria-label={status}>
            {STATUS_GLYPH[status]}
            {warningCount != null && warningCount > 0 ? warningCount : ''}
          </span>
        </button>
      </h3>
      {open && <div className="section__body">{children}</div>}
    </section>
  );
}
