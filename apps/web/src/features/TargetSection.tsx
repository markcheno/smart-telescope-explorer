/**
 * Target section — the target browser (spec v0.7 §8 E02; v0.9 §24).
 *
 * Search the seed catalog by name/id, filter by object type, and select a
 * catalog target — or switch to a custom target and enter geometry directly.
 * Selecting a catalog record snapshots it into `custom_target` (what the engine
 * reads) and records a `catalog_reference` for provenance; the derived fit
 * status is read straight from the framing results.
 */

import { useMemo, useState } from 'react';
import type { CustomTarget } from '@ste/schema';
import { TARGET_CATALOG, TARGET_CATALOG_VERSION } from '@ste/catalogs';
import { InputSection } from '../components/InputSection.js';
import { QuantityInput } from '../components/QuantityInput.js';
import { formatResult, prettifyEnum } from '../components/format.js';
import { useDesign } from '../state/store.js';

/** Object types present in the seed catalog, for the filter dropdown. */
const TYPES_IN_CATALOG = [
  ...new Set(TARGET_CATALOG.map((t) => t.classification.target_type)),
].sort();

function matches(t: CustomTarget, query: string, type: string): boolean {
  if (type !== 'all' && t.classification.target_type !== type) return false;
  if (query === '') return true;
  const q = query.toLowerCase();
  return (
    t.name.toLowerCase().includes(q) ||
    t.target_id.toLowerCase().includes(q) ||
    (t.aliases ?? []).some((a) => a.toLowerCase().includes(q))
  );
}

export function TargetSection(): JSX.Element {
  const { design, edit, results } = useDesign();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');

  const sel = design.target;
  const active = sel.custom_target;
  const isCatalog = sel.selection_type === 'catalog';
  const fit = results.results.target_framing?.fit_status;

  const found = useMemo(() => TARGET_CATALOG.filter((t) => matches(t, query, type)), [query, type]);

  function selectCatalog(t: CustomTarget): void {
    edit((d) => {
      d.target = {
        selection_type: 'catalog',
        catalog_reference: {
          target_id: t.target_id,
          target_version: TARGET_CATALOG_VERSION,
          catalog_version: TARGET_CATALOG_VERSION,
          display_name_snapshot: t.name,
        },
        custom_target: structuredClone(t),
      };
    });
  }

  function switchToCustom(): void {
    edit((d) => {
      const base: CustomTarget = d.target.custom_target
        ? structuredClone(d.target.custom_target)
        : {
            target_id: 'custom',
            name: 'Custom target',
            coordinates: { right_ascension_deg: null, declination_deg: null, epoch: 'j2000' },
            geometry: {
              shape: 'ellipse',
              width_arcmin: 30,
              height_arcmin: 20,
              position_angle_deg: 0,
            },
            classification: { target_type: 'custom' },
          };
      d.target = { selection_type: 'custom', custom_target: base };
    });
  }

  const status = active?.geometry.width_arcmin == null ? 'warning' : 'complete';

  return (
    <InputSection title="Target" status={status} defaultOpen>
      <div className="target__current">
        <span className="target__name">{active?.name ?? 'No target'}</span>
        {isCatalog && <span className="target__badge">catalog</span>}
        {fit != null && fit.status !== 'unavailable' && (
          <span className={`target__fit target__fit--${String(fit.value)}`}>
            {prettifyEnum(String(fit.value))}
          </span>
        )}
      </div>

      <label className="quantity">
        <span className="quantity__label">Search</span>
        <input
          className="quantity__input"
          type="search"
          placeholder="Name or catalog id (e.g. M31)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <label className="quantity">
        <span className="quantity__label">Type</span>
        <select className="quantity__select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All types</option>
          {TYPES_IN_CATALOG.map((t) => (
            <option key={t} value={t}>
              {prettifyEnum(t)}
            </option>
          ))}
        </select>
      </label>

      <ul className="target__list" aria-label="Catalog targets">
        {found.length === 0 && <li className="target__empty">No matches</li>}
        {found.map((t) => {
          const selected = isCatalog && sel.catalog_reference?.target_id === t.target_id;
          return (
            <li key={t.target_id}>
              <button
                type="button"
                className={`target__item ${selected ? 'target__item--selected' : ''}`}
                aria-pressed={selected}
                onClick={() => selectCatalog(t)}
              >
                <span className="target__item-name">{t.name}</span>
                <span className="target__item-meta">
                  {prettifyEnum(t.classification.target_type)} ·{' '}
                  {Math.round(t.geometry.width_arcmin ?? 0)}′×
                  {Math.round(t.geometry.height_arcmin ?? 0)}′
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="target__custom">
        <button type="button" className="target__custom-toggle" onClick={switchToCustom}>
          {isCatalog ? 'Edit as custom target' : 'Custom target'}
        </button>
        {active != null && (
          <>
            <QuantityInput
              label="Width"
              value={active.geometry.width_arcmin ?? null}
              unit="′"
              step={1}
              min={0}
              onCommit={(v) =>
                edit((d) => {
                  if (d.target.custom_target) d.target.custom_target.geometry.width_arcmin = v;
                  d.target.selection_type = 'custom';
                  delete d.target.catalog_reference;
                })
              }
            />
            <QuantityInput
              label="Height"
              value={active.geometry.height_arcmin ?? null}
              unit="′"
              step={1}
              min={0}
              onCommit={(v) =>
                edit((d) => {
                  if (d.target.custom_target) d.target.custom_target.geometry.height_arcmin = v;
                  d.target.selection_type = 'custom';
                  delete d.target.catalog_reference;
                })
              }
            />
            <QuantityInput
              label="Position angle"
              value={active.geometry.position_angle_deg ?? null}
              unit="°"
              step={1}
              onCommit={(v) =>
                edit((d) => {
                  if (d.target.custom_target)
                    d.target.custom_target.geometry.position_angle_deg = v;
                  d.target.selection_type = 'custom';
                  delete d.target.catalog_reference;
                })
              }
            />
          </>
        )}
      </div>

      <dl className="derived">
        <div>
          <dt>Target size (px)</dt>
          <dd>
            {formatResult(results.results.target_framing?.target_width_px)} ×{' '}
            {formatResult(results.results.target_framing?.target_height_px)}
          </dd>
        </div>
      </dl>
    </InputSection>
  );
}
