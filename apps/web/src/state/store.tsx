/**
 * Design store (spec v0.9 §24 R1-002, R1-015).
 *
 * Holds the single R1 design, its revision, and save state. Every edit is a
 * command that clones the design, applies a mutation, bumps the revision, marks
 * the design unsaved, and autosaves (v0.8 §29, §43). Results are DERIVED from the
 * design via the engine and are never stored as authoritative inputs (v0.8 §2.5)
 * — they recompute whenever the design changes.
 */

import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { calculate } from '@ste/engine-core';
import { F01_DOCUMENT } from '@ste/test-fixtures';
import type {
  CalculationRequest,
  CalculationResponse,
  CameraInput,
  DesignDocument,
  OpticsInput,
  Recommendation,
  ScenarioInput,
} from '@ste/schema';
import { loadCurrentDesign, saveCurrentDesign } from './persistence.js';

type SaveState = 'saved' | 'unsaved';

interface StoreState {
  design: DesignDocument;
  saveState: SaveState;
}

type Action =
  | { type: 'edit'; mutate: (draft: DesignDocument) => void }
  | { type: 'replace'; design: DesignDocument }
  | { type: 'markSaved' };

function nowIso(): string {
  return new Date().toISOString();
}

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case 'edit': {
      const draft = structuredClone(state.design);
      action.mutate(draft);
      draft.revision += 1;
      draft.metadata.modified_at = nowIso();
      saveCurrentDesign(draft);
      return { design: draft, saveState: 'unsaved' };
    }
    case 'replace': {
      saveCurrentDesign(action.design);
      return { design: action.design, saveState: 'unsaved' };
    }
    case 'markSaved':
      saveCurrentDesign(state.design);
      return { ...state, saveState: 'saved' };
    default:
      return state;
  }
}

/** The default starting design for R1 (the canonical 30 mm example, v0.9 §14). */
function seedDesign(): DesignDocument {
  return loadCurrentDesign() ?? structuredClone(F01_DOCUMENT);
}

function buildRequest(design: DesignDocument): CalculationRequest {
  return {
    message_type: 'calculate_design',
    request_id: `req_${design.design_id}_r${design.revision}`,
    design_id: design.design_id,
    design_revision: design.revision,
    engine_version: design.calculation_engine_version,
    calculation_mode: 'normal',
    requested_groups: [
      'static_geometry',
      'target_framing',
      'sampling',
      'scenario_geometry',
      'mount_kinematics',
      'tracking',
      'blur',
      'field_rotation',
      'exposure_sweep',
      'session',
      'sensitivity',
      'stack_geometry',
      'recommendations',
    ],
    design,
  };
}

/** Apply a JSON-Pointer patch value onto a design draft (R2 recommendation apply). */
function applyPointer(draft: DesignDocument, pointer: string, value: unknown): void {
  const parts = pointer.split('/').filter(Boolean);
  if (parts.length === 0) return;
  let node: Record<string, unknown> = draft as unknown as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    if (typeof node[key] !== 'object' || node[key] == null) node[key] = {};
    node = node[key] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]!] = value;
}

export interface DesignStore {
  design: DesignDocument;
  results: CalculationResponse;
  saveState: SaveState;
  updateScenario: (partial: Partial<ScenarioInput>) => void;
  updateOptics: (partial: Partial<OpticsInput>) => void;
  updateCamera: (partial: Partial<CameraInput>) => void;
  setName: (name: string) => void;
  edit: (mutate: (draft: DesignDocument) => void) => void;
  replaceDesign: (design: DesignDocument) => void;
  applyRecommendation: (rec: Recommendation) => void;
  save: () => void;
}

const DesignContext = createContext<DesignStore | null>(null);

export function DesignProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    design: seedDesign(),
    saveState: 'saved' as SaveState,
  }));

  const edit = useCallback((mutate: (draft: DesignDocument) => void) => {
    dispatch({ type: 'edit', mutate });
  }, []);

  const results = useMemo<CalculationResponse>(() => {
    const at = nowIso();
    return calculate(buildRequest(state.design), { startedAt: at, completedAt: at });
  }, [state.design]);

  const store = useMemo<DesignStore>(
    () => ({
      design: state.design,
      results,
      saveState: state.saveState,
      edit,
      updateScenario: (partial) =>
        edit((d) => {
          d.scenario = { ...d.scenario, ...partial };
        }),
      updateOptics: (partial) =>
        edit((d) => {
          d.optics = { ...d.optics, ...partial };
        }),
      updateCamera: (partial) =>
        edit((d) => {
          d.camera = { ...d.camera, ...partial };
        }),
      setName: (name) =>
        edit((d) => {
          d.metadata.name = name;
        }),
      replaceDesign: (design) => dispatch({ type: 'replace', design }),
      applyRecommendation: (rec: Recommendation) =>
        edit((d) => {
          for (const change of rec.proposed_changes ?? []) {
            if (change.kind === 'replace' && change.proposed_value != null) {
              applyPointer(d, change.field_path, change.proposed_value);
            }
          }
        }),
      save: () => dispatch({ type: 'markSaved' }),
    }),
    [state.design, state.saveState, results, edit],
  );

  return <DesignContext.Provider value={store}>{children}</DesignContext.Provider>;
}

export function useDesign(): DesignStore {
  const store = useContext(DesignContext);
  if (store == null) throw new Error('useDesign must be used within a DesignProvider');
  return store;
}
