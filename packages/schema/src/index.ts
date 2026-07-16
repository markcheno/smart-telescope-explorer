/**
 * @ste/schema — Version 1 data schema and calculation API contracts.
 *
 * Pure JSON-compatible type definitions plus runtime enum tuples (spec v0.8).
 * This package sits at the foundation of the dependency graph (v0.9 §21): it has
 * no UI or calculation dependencies and does not import `@ste/units` — persisted
 * values are plain numbers whose unit is fixed by the field name (v0.8 §2.2).
 *
 * Each enum is exported as a `const` tuple (e.g. `SOURCE_TYPES`) with its
 * string-literal union derived from it, so validation can iterate the allowed
 * values at runtime.
 */

export * from './version.js';
export * from './primitives.js';

// Design document sections (v0.8 §6–§19)
export * from './scenario.js';
export * from './target.js';
export * from './optics.js';
export * from './camera.js';
export * from './filter.js';
export * from './mount.js';
export * from './tracking.js';
export * from './capture.js';
export * from './constraints.js';
export * from './document.js';

// Calculation API (v0.8 §20–§30)
export * from './results.js';
export * from './diagnostics.js';
export * from './recommendations.js';
export * from './preview.js';
export * from './calculation.js';
export * from './comparison.js';
export * from './report.js';
export * from './power.js';
export * from './focus.js';
export * from './commands.js';
export * from './worker.js';
