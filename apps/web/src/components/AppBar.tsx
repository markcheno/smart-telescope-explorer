/**
 * Application bar (spec v0.9 §4, §24 R1-001, R1-023/024).
 *
 * Design name, save state, and the R1 actions: New (reset to the generic
 * starting design), Import/Export JSON, and Save. Import validates before
 * loading; export produces a pure v1 document.
 */

import { useRef } from 'react';
import { F01_DOCUMENT } from '@ste/test-fixtures';
import { downloadJson, parseImportedDesign } from '../state/persistence.js';
import { buildShareUrl, hasExactCoordinates } from '../state/share.js';
import { useDesign } from '../state/store.js';

export function AppBar(): JSX.Element {
  const { design, saveState, setName, replaceDesign, save } = useDesign();
  const fileInput = useRef<HTMLInputElement>(null);

  const onImport = async (file: File): Promise<void> => {
    const text = await file.text();
    const result = parseImportedDesign(text);
    if (result.ok && result.design != null) {
      replaceDesign(result.design);
    } else {
      window.alert(`Import failed: ${result.error ?? 'unknown error'}`);
    }
  };

  const onShare = async (): Promise<void> => {
    // Warn before sharing exact coordinates; Cancel rounds them (spec §43).
    const exact =
      !hasExactCoordinates(design) ||
      window.confirm(
        'Share exact target coordinates?\n\nOK = share exact position. Cancel = round coordinates for privacy.',
      );
    const url = buildShareUrl(design, { privacy: exact ? 'exact' : 'rounded' });
    if (url == null) {
      window.alert('This design is too large to share as a link. Use Export to share a file.');
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      window.alert('Share link copied to clipboard.');
    } catch {
      window.prompt('Copy this share link:', url);
    }
  };

  return (
    <header className="appbar">
      <div className="appbar__brand">◉ Smart Telescope Explorer</div>
      <input
        className="appbar__name"
        aria-label="Design name"
        value={design.metadata.name}
        onChange={(e) => setName(e.target.value)}
      />
      <span className={`appbar__savestate appbar__savestate--${saveState}`}>
        {saveState === 'saved' ? '● Saved' : '○ Unsaved'}
      </span>
      <nav className="appbar__actions">
        <button type="button" onClick={() => replaceDesign(structuredClone(F01_DOCUMENT))}>
          New
        </button>
        <button type="button" onClick={() => fileInput.current?.click()}>
          Import
        </button>
        <button type="button" onClick={() => downloadJson(design)}>
          Export
        </button>
        <button type="button" onClick={() => void onShare()}>
          Share
        </button>
        <button
          type="button"
          className="appbar__primary"
          onClick={save}
          disabled={saveState === 'saved'}
        >
          Save
        </button>
      </nav>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file != null) void onImport(file);
          e.target.value = '';
        }}
      />
    </header>
  );
}
