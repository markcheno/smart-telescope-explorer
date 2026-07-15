/**
 * @ste/exposure — exposure candidate sweep and recommendation (spec v0.4 §26).
 *
 * Pure and engine-agnostic: the engine supplies per-candidate metrics (tracking
 * blur, rotation, duty cycle, acceptance, a preliminary relative score) and this
 * package generates candidates and applies the recommendation algorithm. The
 * fixed-session score is explicitly PRELIMINARY until the R3 stack/noise model.
 */

/** Suggested exposure range (seconds) for the default candidate set (v0.4 §26). */
export const MIN_EXPOSURE_S = 0.5;
export const MAX_EXPOSURE_S = 120;
/** Default near-optimal fraction for the recommended range (v0.8 §16). */
export const DEFAULT_NEAR_OPTIMAL_FRACTION = 0.98;

const COMMON_SHORT_S = [1, 2, 3, 5, 8, 10, 15, 20, 30, 45, 60, 90, 120];

export type CandidateMode = 'default_candidates' | 'logarithmic' | 'linear' | 'explicit';

export interface CandidateOptions {
  userValueS?: number | null;
  minimumS?: number | null;
  maximumS?: number | null;
  mode?: CandidateMode;
  explicitS?: number[];
  sampleCount?: number | null;
}

/** Generate deduplicated, sorted exposure candidates within [min, max] (v0.4 §26). */
export function generateCandidates(options: CandidateOptions): number[] {
  const min = options.minimumS ?? MIN_EXPOSURE_S;
  const max = options.maximumS ?? MAX_EXPOSURE_S;
  const count = Math.max(2, options.sampleCount ?? 12);
  const set = new Set<number>();

  const add = (v: number): void => {
    if (!Number.isFinite(v)) return;
    // Round first so floating-point endpoints (e.g. exp(ln max)) aren't dropped.
    const r = Math.round(v * 1000) / 1000;
    if (r >= min && r <= max) set.add(r);
  };

  switch (options.mode) {
    case 'explicit':
      for (const v of options.explicitS ?? []) add(v);
      break;
    case 'logarithmic': {
      const lnMin = Math.log(min);
      const lnMax = Math.log(max);
      for (let i = 0; i < count; i++) add(Math.exp(lnMin + ((lnMax - lnMin) * i) / (count - 1)));
      break;
    }
    case 'linear':
      for (let i = 0; i < count; i++) add(min + ((max - min) * i) / (count - 1));
      break;
    case 'default_candidates':
    default:
      for (const v of COMMON_SHORT_S) add(v);
      break;
  }
  if (options.userValueS != null) add(options.userValueS);
  return [...set].sort((a, b) => a - b);
}

export interface CandidateEval {
  exposureS: number;
  motionPx: number;
  rotationPx: number;
  dutyCycle: number;
  /** Fraction of frames expected to pass the quality thresholds (0..1). */
  acceptance: number;
  /** Preliminary fixed-session relative score (higher is better). */
  relativeScore: number;
  /** True when a hard threshold is exceeded (candidate is infeasible). */
  hardFail: boolean;
  hardFailReason?: string;
}

export interface ExposureRecommendation {
  candidates: CandidateEval[];
  bestExposureS: number | null;
  recommendedMinS: number | null;
  recommendedMaxS: number | null;
  shortestPracticalS: number | null;
  longestAcceptableS: number | null;
  hardLimitS: number | null;
  hardLimitReason: string | null;
  boundaryOptimum: boolean;
  plateau: boolean;
}

/**
 * The v0.4 §26 recommendation algorithm: exclude hard failures, find the maximum
 * fixed-session score, take the shortest exposure within `nearOptimalFraction`
 * of it (preferring shorter on a plateau), warn on a boundary optimum, and
 * return the near-optimal range.
 */
export function recommendExposure(
  candidates: CandidateEval[],
  nearOptimalFraction: number = DEFAULT_NEAR_OPTIMAL_FRACTION,
): ExposureRecommendation {
  const empty: ExposureRecommendation = {
    candidates,
    bestExposureS: null,
    recommendedMinS: null,
    recommendedMaxS: null,
    shortestPracticalS: null,
    longestAcceptableS: null,
    hardLimitS: null,
    hardLimitReason: null,
    boundaryOptimum: false,
    plateau: false,
  };
  if (candidates.length === 0) return empty;

  const feasible = candidates.filter((c) => !c.hardFail && c.relativeScore > 0);

  // Earliest hard threshold (smallest exposure that hard-fails).
  const hardFails = candidates.filter((c) => c.hardFail).sort((a, b) => a.exposureS - b.exposureS);
  const hardLimit = hardFails[0] ?? null;

  if (feasible.length === 0) {
    return {
      ...empty,
      hardLimitS: hardLimit?.exposureS ?? null,
      hardLimitReason: hardLimit?.hardFailReason ?? null,
    };
  }

  const maxScore = feasible.reduce((m, c) => Math.max(m, c.relativeScore), 0);
  const threshold = maxScore * nearOptimalFraction;
  const nearOptimal = feasible
    .filter((c) => c.relativeScore >= threshold)
    .sort((a, b) => a.exposureS - b.exposureS);

  const recommendedMinS = nearOptimal[0]!.exposureS;
  const recommendedMaxS = nearOptimal[nearOptimal.length - 1]!.exposureS;
  // Prefer the shortest near-optimal exposure.
  const bestExposureS = recommendedMinS;

  const sortedFeasible = [...feasible].sort((a, b) => a.exposureS - b.exposureS);
  const shortestPracticalS = sortedFeasible[0]!.exposureS;
  const longestAcceptableS = sortedFeasible[sortedFeasible.length - 1]!.exposureS;

  const boundaryOptimum =
    bestExposureS === shortestPracticalS || bestExposureS === longestAcceptableS;
  const plateau = recommendedMaxS / recommendedMinS >= 1.5;

  return {
    candidates,
    bestExposureS,
    recommendedMinS,
    recommendedMaxS,
    shortestPracticalS,
    longestAcceptableS,
    hardLimitS: hardLimit?.exposureS ?? null,
    hardLimitReason: hardLimit?.hardFailReason ?? null,
    boundaryOptimum,
    plateau,
  };
}
