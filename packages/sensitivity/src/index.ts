/**
 * @ste/sensitivity — relative throughput and stacked-SNR (spec v0.4 §6, §23, §25).
 *
 * v1 emphasises RELATIVE performance (v0.3 §1): throughput factors are unnormalised
 * figures whose ratios compare designs; absolute SNR is optional and only valid
 * with adequate brightness data (v0.4 §24). The stacked-SNR score used to rank
 * exposures is relative — the target signal is normalised out and the exposure
 * shape is set by the read-noise time constant (read-noise-limited short subs →
 * background-limited long subs) and the accepted-frame count.
 */

/** Atmospheric throughput T = 10^(-0.4·k·(X−1)) (spec v0.4 §6). */
export function atmosphericThroughput(extinctionMagPerAirmass: number, airmass: number): number {
  return Math.pow(10, -0.4 * extinctionMagPerAirmass * (airmass - 1));
}

export interface ThroughputInputs {
  effectiveAreaMm2: number;
  effectiveQe: number;
  filterTargetTransmission: number;
  /** Pixel solid angle Ω = sx·sy in arcsec² (spec v0.4 §23). */
  pixelSolidAngleArcsec2: number;
}

export interface ThroughputFactors {
  /** Q_point ∝ A_eff · QE · T_filter (relative). */
  pointSource: number;
  /** Q_extended,pixel ∝ A_eff · Ω_pixel · QE · T_filter (relative). */
  extendedPerPixel: number;
}

/** Relative throughput factors (spec v0.4 §23); unnormalised, for ratio comparison. */
export function throughputFactors(inp: ThroughputInputs): ThroughputFactors {
  const point = inp.effectiveAreaMm2 * inp.effectiveQe * inp.filterTargetTransmission;
  return { pointSource: point, extendedPerPixel: point * inp.pixelSolidAngleArcsec2 };
}

// --- CCD-equation SNR (spec v0.4 §25) ------------------------------------

export interface FrameSignalInputs {
  /** Target signal electrons per second. */
  targetRateEPerS: number;
  /** Sky electrons per pixel per second. */
  skyRateEPerPxPerS: number;
  /** Dark electrons per pixel per second. */
  darkRateEPerPxPerS: number;
  /** Read noise, electrons RMS. */
  readNoiseE: number;
  /** Pixels integrated over the source. */
  nPixels: number;
  exposureS: number;
}

/** Per-frame SNR = S/√(S+B+D+R²) (spec v0.4 §25). */
export function snrFrame(inp: FrameSignalInputs): number {
  const s = inp.targetRateEPerS * inp.exposureS;
  const b = inp.skyRateEPerPxPerS * inp.nPixels * inp.exposureS;
  const d = inp.darkRateEPerPxPerS * inp.nPixels * inp.exposureS;
  const r2 = inp.nPixels * inp.readNoiseE * inp.readNoiseE;
  const noise = Math.sqrt(s + b + d + r2);
  return noise > 0 ? s / noise : 0;
}

/** Stacked SNR = √N · SNR_frame · η_stack (spec v0.4 §25). */
export function snrStack(
  snrFrameValue: number,
  nAccepted: number,
  stackEfficiency: number,
): number {
  return Math.sqrt(Math.max(nAccepted, 0)) * snrFrameValue * stackEfficiency;
}

// --- relative exposure score ---------------------------------------------

/**
 * Read-noise time constant: the exposure at which background shot noise equals
 * read-noise variance, `t_rn = σ_read² / r_background`. Below t_rn a sub-exposure
 * is read-noise-limited; above it, background-limited. Returns `null` when the
 * background rate is unknown (caller supplies an assumed default).
 */
export function readNoiseTimeConstantS(
  readNoiseE: number,
  backgroundRateEPerPxPerS: number,
): number | null {
  if (!(backgroundRateEPerPxPerS > 0)) return null;
  return (readNoiseE * readNoiseE) / backgroundRateEPerPxPerS;
}

/**
 * Relative per-frame SNR shape with the target normalised out:
 * `t / √(t + t_rn)` — linear (read-noise-limited) below t_rn, √t above.
 */
export function relativeFrameSnr(exposureS: number, readNoiseTimeConstantSeconds: number): number {
  return exposureS / Math.sqrt(exposureS + readNoiseTimeConstantSeconds);
}

/**
 * Relative stacked-SNR score for a fixed session (spec v0.4 §26 "final
 * fixed-session performance"): `√N_accepted · relativeFrameSnr(t)`. Higher is
 * better; used to rank exposure candidates and compare designs.
 */
export function relativeStackScore(
  exposureS: number,
  nAccepted: number,
  readNoiseTimeConstantSeconds: number,
  stackEfficiency = 1,
): number {
  return (
    Math.sqrt(Math.max(nAccepted, 0)) *
    relativeFrameSnr(exposureS, readNoiseTimeConstantSeconds) *
    stackEfficiency
  );
}

// --- approximate sky electron rate ---------------------------------------

/**
 * Approximate broadband photon zero-point: photons·s⁻¹·mm⁻²·arcsec⁻² from a
 * surface brightness of 0 mag/arcsec². Order-of-magnitude only — it sets the
 * read-noise crossover, not an absolute calibration, and is flagged as an
 * assumption by the engine. (~1.0e4 photons/s/cm²/arcsec² at mag 0 → per mm².)
 */
export const SKY_PHOTON_ZEROPOINT_PER_MM2_ARCSEC2 = 100;

/**
 * Approximate sky electrons per pixel per second from sky surface brightness
 * (mag/arcsec²), the effective collecting area, pixel solid angle, QE, filter,
 * and atmospheric throughput. Approximate — for the read-noise crossover only.
 */
export function skyElectronRatePerPixel(params: {
  skyBrightnessMagArcsec2: number;
  effectiveAreaMm2: number;
  pixelSolidAngleArcsec2: number;
  effectiveQe: number;
  filterSkyTransmission: number;
  atmosphericThroughput: number;
}): number {
  const photonFlux =
    SKY_PHOTON_ZEROPOINT_PER_MM2_ARCSEC2 * Math.pow(10, -0.4 * params.skyBrightnessMagArcsec2);
  return (
    photonFlux *
    params.effectiveAreaMm2 *
    params.pixelSolidAngleArcsec2 *
    params.effectiveQe *
    params.filterSkyTransmission *
    params.atmosphericThroughput
  );
}
