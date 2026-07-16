/**
 * Engine coordinator (spec v0.9 §23 R0-015; v0.4 §38; v0.8 §20–21).
 *
 * Resolves the requested result groups and their prerequisites, runs validation
 * and the group builders in dependency order (v0.4 §38), and assembles a
 * {@link CalculationResponse}. Independent groups still return when others fail
 * (partial responses, v0.8 §21). The engine is pure: timestamps are supplied by
 * the caller so identical inputs yield identical output (v0.4 §47).
 */

import { validateDesign } from '@ste/validation';
import {
  CalcContext,
  computeSampling,
  computeStaticGeometry,
  computeTargetFraming,
  type DerivedGeometry,
} from './groups.js';
import {
  computeBlur,
  computeExposureSweep,
  computeFieldRotation,
  computeMountKinematics,
  computeScenarioGeometry,
  computeTracking,
  deriveKinematics,
  type DerivedKinematics,
  type DerivedTracking,
} from './groups-r2.js';
import {
  computeSensitivity,
  computeSession,
  computeStackGeometry,
  deriveSnrContext,
} from './groups-r3.js';
import { computeFocus, computePower } from './groups-r4.js';
import { generateRecommendations } from './recommendations.js';
import { evaluateConstraints } from './constraints.js';
import type { Mat2 } from '@ste/units';
import type {
  CalculationGroup,
  CalculationRequest,
  CalculationResponse,
  CalculationResponseStatus,
  ResultGroups,
} from '@ste/schema';

/** Groups the engine can currently calculate. Others are recognised but not yet produced. */
export const SUPPORTED_GROUPS: readonly CalculationGroup[] = [
  'validation',
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
  'power',
  'focus',
  'constraints',
  'recommendations',
];

/** Groups the recommendation rules read; requesting recommendations pulls them in. */
const RECOMMENDATION_PREREQS: readonly CalculationGroup[] = [
  'target_framing',
  'sampling',
  'mount_kinematics',
  'tracking',
  'field_rotation',
  'blur',
  'exposure_sweep',
];

/** Groups a constraint may reference; requesting constraints pulls them in. */
const CONSTRAINT_PREREQS: readonly CalculationGroup[] = [
  'target_framing',
  'tracking',
  'blur',
  'field_rotation',
  'session',
];

/** A placeholder timestamp so the pure engine never reads a clock itself. */
const EPOCH = '1970-01-01T00:00:00.000Z';

/**
 * The explicitly-requested, supported groups (expanding `all`). Prerequisites
 * are computed internally when needed but are only exposed in the response when
 * the caller asked for them — so requesting only `sampling` returns just sampling.
 */
function expandRequestedGroups(requested: CalculationGroup[]): Set<CalculationGroup> {
  const wanted = new Set<CalculationGroup>();
  for (const g of requested) {
    if (g === 'all') {
      for (const s of SUPPORTED_GROUPS) wanted.add(s);
    } else if (SUPPORTED_GROUPS.includes(g)) {
      wanted.add(g);
    }
  }
  // Recommendations + constraints read many groups; pull their prerequisites in.
  if (wanted.has('constraints')) {
    for (const g of CONSTRAINT_PREREQS) wanted.add(g);
  }
  if (wanted.has('recommendations')) {
    for (const g of RECOMMENDATION_PREREQS) wanted.add(g);
  }
  return wanted;
}

export interface CalculateContext {
  startedAt?: string;
  completedAt?: string;
}

/** Run a calculation request and return a full or partial response (v0.8 §20–21). */
export function calculate(
  request: CalculationRequest,
  context: CalculateContext = {},
): CalculationResponse {
  const doc = request.design;
  const wanted = expandRequestedGroups(
    request.requested_groups.length > 0 ? request.requested_groups : ['all'],
  );

  const ctx = new CalcContext();
  const results: ResultGroups = {};
  const calculatedGroups: CalculationGroup[] = [];

  // 1. Validation (always run; cheap and informs downstream confidence).
  const validation = validateDesign(doc);
  if (wanted.has('validation')) {
    calculatedGroups.push('validation');
  }

  // 2. Static geometry (prerequisite for framing, sampling, and tracking px).
  let derived: DerivedGeometry | null = null;
  const needStatic =
    wanted.has('static_geometry') ||
    wanted.has('target_framing') ||
    wanted.has('sampling') ||
    wanted.has('tracking') ||
    wanted.has('blur') ||
    wanted.has('field_rotation') ||
    wanted.has('exposure_sweep') ||
    wanted.has('session') ||
    wanted.has('sensitivity') ||
    wanted.has('stack_geometry') ||
    wanted.has('focus');
  if (needStatic) {
    const geometry = computeStaticGeometry(doc, ctx);
    derived = geometry.derived;
    if (wanted.has('static_geometry')) {
      results.static_geometry = geometry.results;
      calculatedGroups.push('static_geometry');
    }
  }

  // 3. Target framing.
  if (wanted.has('target_framing') && derived != null) {
    results.target_framing = computeTargetFraming(doc, derived);
    calculatedGroups.push('target_framing');
  }

  // 4. Sampling.
  if (wanted.has('sampling') && derived != null) {
    results.sampling = computeSampling(doc, derived, ctx);
    calculatedGroups.push('sampling');
  }

  // 5. Scenario geometry + mount kinematics + field rotation share the session
  //    path; blur also needs the field-rotation covariance, so compute the
  //    kinematics whenever any of these (or blur) is requested.
  let kinematics: DerivedKinematics | null = null;
  const needKinematics =
    wanted.has('scenario_geometry') ||
    wanted.has('mount_kinematics') ||
    wanted.has('field_rotation') ||
    wanted.has('blur') ||
    wanted.has('exposure_sweep') ||
    wanted.has('session') ||
    wanted.has('sensitivity') ||
    wanted.has('stack_geometry');
  if (needKinematics) {
    kinematics = deriveKinematics(doc);
    if (wanted.has('scenario_geometry')) {
      results.scenario_geometry = computeScenarioGeometry(kinematics, ctx);
      calculatedGroups.push('scenario_geometry');
    }
    if (wanted.has('mount_kinematics')) {
      results.mount_kinematics = computeMountKinematics(kinematics, ctx);
      calculatedGroups.push('mount_kinematics');
    }
  }

  // 6. Tracking (during-exposure motion; needs static geometry for px).
  //    Compute once when tracking or blur is requested; blur consumes the
  //    motion covariance from the tracking-derived struct.
  let trackingDerived: DerivedTracking | null = null;
  if ((wanted.has('tracking') || wanted.has('blur')) && derived != null) {
    const tracking = computeTracking(doc, derived, ctx);
    trackingDerived = tracking.derived;
    if (wanted.has('tracking')) {
      results.tracking = tracking.results;
      calculatedGroups.push('tracking');
    }
  }

  // 7. Field rotation (needs kinematics + geometry). Blur consumes its
  //    rotation covariance, so compute it when field_rotation or blur is asked.
  let rotationCovariance: Mat2 | null = null;
  if (
    (wanted.has('field_rotation') || wanted.has('blur')) &&
    derived != null &&
    kinematics != null
  ) {
    const rotation = computeFieldRotation(doc, derived, kinematics, ctx);
    rotationCovariance = rotation.rotationCovariance;
    if (wanted.has('field_rotation')) {
      results.field_rotation = rotation.results;
      calculatedGroups.push('field_rotation');
    }
  }

  // 8. Blur (base + motion + rotation + pixel covariance -> ellipse).
  if (wanted.has('blur') && derived != null) {
    results.blur = computeBlur(doc, derived, trackingDerived, rotationCovariance, ctx);
    calculatedGroups.push('blur');
  }

  // The read-noise time constant (from the SNR context) drives both the exposure
  // sweep score and sensitivity, so compute it once when either is requested.
  const snrContext =
    (wanted.has('exposure_sweep') || wanted.has('sensitivity')) && derived != null
      ? deriveSnrContext(doc, derived, kinematics)
      : null;

  // 9. Exposure sweep (relative fixed-session stacked-SNR across candidates).
  if (wanted.has('exposure_sweep') && derived != null && kinematics != null && snrContext != null) {
    results.exposure_sweep = computeExposureSweep(
      doc,
      derived,
      kinematics,
      snrContext.readNoiseTimeConstantS,
      ctx,
    );
    calculatedGroups.push('exposure_sweep');
  }

  // 10. Session simulation + sensitivity + stack geometry (R3, §23/§27–29).
  if ((wanted.has('session') || wanted.has('sensitivity')) && derived != null) {
    const session = computeSession(doc, derived, kinematics, ctx);
    if (wanted.has('session')) {
      results.session = session.results;
      calculatedGroups.push('session');
    }
    if (wanted.has('sensitivity') && snrContext != null) {
      results.sensitivity = computeSensitivity(
        doc,
        snrContext,
        session.derived.framesAccepted,
        ctx,
      );
      calculatedGroups.push('sensitivity');
    }
  }
  if (wanted.has('stack_geometry') && derived != null) {
    results.stack_geometry = computeStackGeometry(doc, derived, kinematics, trackingDerived, ctx);
    calculatedGroups.push('stack_geometry');
  }

  // 11. Power + focus (R4 optional subsystems; v0.4 §33, §11).
  if (wanted.has('power')) {
    results.power = computePower(doc);
    calculatedGroups.push('power');
  }
  if (wanted.has('focus')) {
    results.focus = computeFocus(doc, derived);
    calculatedGroups.push('focus');
  }

  // 12. Constraints (evaluate against the computed result groups; v0.4 §37).
  if (wanted.has('constraints')) {
    results.constraints = evaluateConstraints(doc, results);
    calculatedGroups.push('constraints');
  }

  // 12. Recommendations (read the computed result groups; v0.9 §25 R2-031).
  let recommendations: CalculationResponse['recommendations'];
  if (wanted.has('recommendations')) {
    recommendations = generateRecommendations(doc, results);
    calculatedGroups.push('recommendations');
  }

  const status = deriveStatus(wanted, calculatedGroups, validation.ok);

  return {
    message_type: 'calculation_result',
    request_id: request.request_id,
    design_id: request.design_id,
    design_revision: request.design_revision,
    engine_version: request.engine_version,
    schema_version: doc.schema_version,
    status,
    started_at: context.startedAt ?? EPOCH,
    completed_at: context.completedAt ?? EPOCH,
    calculated_groups: calculatedGroups,
    validation: { ok: validation.ok, issue_ids: validation.issues.map((i) => i.issue_id) },
    results,
    issues: validation.issues,
    assumptions: [...ctx.assumptions.values()],
    formulas: ctx.formulas,
    ...(recommendations != null ? { recommendations } : {}),
  };
}

function deriveStatus(
  wanted: Set<CalculationGroup>,
  calculated: CalculationGroup[],
  validationOk: boolean,
): CalculationResponseStatus {
  const requestedCount = wanted.size;
  const producedCount = calculated.length;
  if (producedCount === 0) return 'failed';
  if (!validationOk || producedCount < requestedCount) return 'partial';
  return 'complete';
}
