/**
 * @ste/session — session timeline accounting, frame yield, and stack geometry
 * (spec v0.4 §27, §28, §29).
 *
 * Pure and unit-agnostic (seconds, fractions, pixels). Turns an exposure + frame
 * overhead + session duration into frames attempted, a wall-time split, and the
 * duty cycle; combines quality acceptance with independent environmental losses
 * into accepted frames and effective integration; and estimates the stack crop
 * from field rotation and drift.
 */

export interface SessionInputs {
  exposureS: number;
  /** Per-frame overhead: readout + transfer + solve + recenter + dither + settle. */
  overheadS: number;
  sessionDurationS: number;
  /** Fraction of frames passing the quality thresholds (0..1). */
  qualityAcceptance: number;
  /** Independent environmental loss probabilities (cloud, horizon, wind, …). */
  environmentalLossFractions?: number[];
}

export interface SessionResult {
  framesAttempted: number;
  framesAccepted: number;
  acceptanceFraction: number;
  /** Total accepted on-target integration (s). */
  effectiveIntegrationS: number;
  dutyCycle: number;
  exposureTimeS: number;
  overheadTimeS: number;
  /** Environmental acceptance Π(1−pᵢ). */
  environmentalAcceptance: number;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * Simulate a fixed-duration session (spec v0.4 §27/§28). Frames attempted fill
 * the wall clock; accepted = attempted × quality × Π(1−pᵢ_environment); effective
 * integration = accepted × exposure.
 */
export function simulateSession(inp: SessionInputs): SessionResult {
  const frameLength = inp.exposureS + Math.max(inp.overheadS, 0);
  const framesAttempted =
    frameLength > 0 && inp.sessionDurationS > 0
      ? Math.floor(inp.sessionDurationS / frameLength)
      : 0;

  const environmentalAcceptance = (inp.environmentalLossFractions ?? []).reduce(
    (acc, p) => acc * (1 - clamp01(p)),
    1,
  );
  const acceptanceFraction = clamp01(inp.qualityAcceptance) * environmentalAcceptance;
  const framesAccepted = framesAttempted * acceptanceFraction;
  const exposureTimeS = framesAttempted * inp.exposureS;
  const overheadTimeS = framesAttempted * Math.max(inp.overheadS, 0);

  return {
    framesAttempted,
    framesAccepted,
    acceptanceFraction,
    effectiveIntegrationS: framesAccepted * inp.exposureS,
    dutyCycle: frameLength > 0 ? inp.exposureS / frameLength : 0,
    exposureTimeS,
    overheadTimeS,
    environmentalAcceptance,
  };
}

// --- registration & stack geometry (spec v0.4 §29) -----------------------

export interface StackGeometryInputs {
  /** Total field rotation across the session (degrees). */
  sessionRotationDeg: number;
  /** Total translational drift across the session (pixels). */
  driftPx: number;
  sensorWidthPx: number;
  sensorHeightPx: number;
  /** Target extent (pixels) to measure target retention against. */
  targetWidthPx?: number;
  targetHeightPx?: number;
}

export interface StackGeometryResult {
  /** Fraction of the frame area retained in the common intersection (0..1). */
  commonCoverageFraction: number;
  /** Fraction of each axis lost to crop. */
  cropFraction: number;
  /** Fraction of the target still fully covered after crop (0..1). */
  targetRetentionFraction: number;
}

/**
 * Estimate the stack crop from rotation + drift (spec v0.4 §29). Rotating a frame
 * by Δθ sweeps its corners inward by ≈ (diagonal/2)·|Δθ|; combined with drift, the
 * common intersection shrinks by that margin on each axis.
 */
export function stackGeometry(inp: StackGeometryInputs): StackGeometryResult {
  const halfDiag = 0.5 * Math.hypot(inp.sensorWidthPx, inp.sensorHeightPx);
  const rotationMarginPx = halfDiag * Math.abs((inp.sessionRotationDeg * Math.PI) / 180);
  const marginPx = rotationMarginPx + Math.abs(inp.driftPx);

  const lossX = clamp01((2 * marginPx) / inp.sensorWidthPx);
  const lossY = clamp01((2 * marginPx) / inp.sensorHeightPx);
  const commonCoverageFraction = clamp01((1 - lossX) * (1 - lossY));
  const cropFraction = 1 - Math.min(1 - lossX, 1 - lossY);

  const retainedWidthPx = inp.sensorWidthPx * (1 - lossX);
  const retainedHeightPx = inp.sensorHeightPx * (1 - lossY);
  const targetRetentionFraction =
    inp.targetWidthPx != null && inp.targetHeightPx != null
      ? clamp01(
          Math.min(retainedWidthPx / inp.targetWidthPx, 1) *
            Math.min(retainedHeightPx / inp.targetHeightPx, 1),
        )
      : commonCoverageFraction;

  return { commonCoverageFraction, cropFraction, targetRetentionFraction };
}
