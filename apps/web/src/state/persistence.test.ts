import { describe, expect, it } from 'vitest';
import { F01_DOCUMENT } from '@ste/test-fixtures';
import { exportDesignJson, parseImportedDesign } from './persistence.js';

describe('JSON import/export (v0.9 §24 R1-023/024)', () => {
  it('round-trips a design through export and import', () => {
    const json = exportDesignJson(F01_DOCUMENT);
    const result = parseImportedDesign(json);
    expect(result.ok).toBe(true);
    expect(result.design?.design_id).toBe(F01_DOCUMENT.design_id);
    expect(result.design?.optics.aperture_mm).toBe(30);
  });

  it('rejects non-JSON input', () => {
    const result = parseImportedDesign('not json {');
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/JSON/);
  });

  it('rejects JSON that is not a design document', () => {
    expect(parseImportedDesign('{"hello":1}').ok).toBe(false);
    expect(parseImportedDesign('[]').ok).toBe(false);
    expect(parseImportedDesign('42').ok).toBe(false);
  });

  it('exports pretty-printed JSON with no functions or UI state', () => {
    const json = exportDesignJson(F01_DOCUMENT);
    expect(json).toContain('\n');
    expect(json).not.toContain('function');
  });
});
