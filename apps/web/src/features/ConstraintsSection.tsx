/**
 * Constraints section (spec v0.9 §24 R3; v0.4 §37).
 *
 * A small set of common requirements the user can toggle on and evaluate:
 * elongation, frame acceptance, tracking motion, and target-must-fit. Each shows
 * a live pass / marginal / fail status from the engine.
 */

import type { ConstraintStatus, DesignConstraint } from '@ste/schema';
import { InputSection } from '../components/InputSection.js';
import { QuantityInput } from '../components/QuantityInput.js';
import { prettifyEnum } from '../components/format.js';
import { useDesign } from '../state/store.js';

interface Preset {
  id: string;
  label: string;
  numeric: boolean;
  unit?: string;
  step?: number;
  make: (threshold: number) => DesignConstraint;
}

const PRESETS: Preset[] = [
  {
    id: 'con_elongation',
    label: 'Max elongation',
    numeric: true,
    step: 0.05,
    make: (t) => ({
      constraint_id: 'con_elongation',
      enabled: true,
      severity: 'soft',
      metric: 'maximum_elongation',
      operator: 'less_than_or_equal',
      threshold: t,
    }),
  },
  {
    id: 'con_acceptance',
    label: 'Min frame acceptance',
    numeric: true,
    step: 0.05,
    make: (t) => ({
      constraint_id: 'con_acceptance',
      enabled: true,
      severity: 'soft',
      metric: 'minimum_acceptance',
      operator: 'greater_than_or_equal',
      threshold: t,
    }),
  },
  {
    id: 'con_motion',
    label: 'Max tracking motion',
    numeric: true,
    unit: 'px',
    step: 0.1,
    make: (t) => ({
      constraint_id: 'con_motion',
      enabled: true,
      severity: 'hard',
      metric: 'maximum_tracking_motion',
      operator: 'less_than_or_equal',
      threshold: t,
    }),
  },
  {
    id: 'con_fit',
    label: 'Target must fit',
    numeric: false,
    make: () => ({
      constraint_id: 'con_fit',
      enabled: true,
      severity: 'hard',
      metric: 'target_must_fit',
      operator: 'fits',
      threshold: 'fits',
    }),
  },
];

const DEFAULT_THRESHOLD: Record<string, number> = {
  con_elongation: 1.2,
  con_acceptance: 0.8,
  con_motion: 1,
};

const STATUS_CLASS: Record<ConstraintStatus, string> = {
  pass: 'good',
  marginal: 'moderate',
  fail: 'low',
  unknown: 'unknown',
};

export function ConstraintsSection(): JSX.Element {
  const { design, edit, results } = useDesign();
  const constraints = design.constraints;
  const evals = results.results.constraints ?? [];
  const statusOf = (id: string): ConstraintStatus | null =>
    evals.find((e) => e.constraint_id === id)?.status ?? null;

  const activeCount = constraints.length;

  return (
    <InputSection title="Constraints" status={activeCount > 0 ? 'complete' : 'optional'}>
      {PRESETS.map((preset) => {
        const active = constraints.find((c) => c.constraint_id === preset.id);
        const status = active ? statusOf(preset.id) : null;
        return (
          <div key={preset.id} className="constraint">
            <label className="quantity quantity--row">
              <input
                type="checkbox"
                checked={active != null}
                onChange={(e) =>
                  edit((d) => {
                    if (e.target.checked) {
                      d.constraints = [
                        ...d.constraints.filter((c) => c.constraint_id !== preset.id),
                        preset.make(DEFAULT_THRESHOLD[preset.id] ?? 1),
                      ];
                    } else {
                      d.constraints = d.constraints.filter((c) => c.constraint_id !== preset.id);
                    }
                  })
                }
              />
              <span className="quantity__label">{preset.label}</span>
              {status != null && (
                <span className={`chip chip--${STATUS_CLASS[status]}`}>{prettifyEnum(status)}</span>
              )}
            </label>
            {active != null && preset.numeric && (
              <QuantityInput
                label="Threshold"
                value={typeof active.threshold === 'number' ? active.threshold : null}
                {...(preset.unit != null ? { unit: preset.unit } : {})}
                {...(preset.step != null ? { step: preset.step } : {})}
                min={0}
                onCommit={(v) =>
                  edit((d) => {
                    const c = d.constraints.find((x) => x.constraint_id === preset.id);
                    if (c != null && v != null) c.threshold = v;
                  })
                }
              />
            )}
          </div>
        );
      })}
    </InputSection>
  );
}
