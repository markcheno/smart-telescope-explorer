/**
 * @ste/engine-core — the calculation coordinator and its supporting registries.
 *
 * Depends on the domain packages (optics, camera, targets) plus validation and
 * assembles their pure outputs into the standard result/response envelope. It
 * imports neither React nor persistence (v0.9 §20) and stays deterministic
 * (v0.4 §47).
 */

export * from './result.js';
export * from './formulas.js';
export * from './sampling.js';
export * from './groups.js';
export * from './groups-r2.js';
export * from './recommendations.js';
export * from './coordinator.js';
