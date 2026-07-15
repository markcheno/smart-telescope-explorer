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
  computeMountKinematics,
  computeScenarioGeometry,
  deriveKinematics,
  type DerivedKinematics,
} from './groups-r2.js';
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

  // 2. Static geometry (prerequisite for framing + sampling).
  let derived: DerivedGeometry | null = null;
  const needStatic =
    wanted.has('static_geometry') || wanted.has('target_framing') || wanted.has('sampling');
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

  // 5. Scenario geometry + mount kinematics (shared session path).
  let kinematics: DerivedKinematics | null = null;
  const needKinematics = wanted.has('scenario_geometry') || wanted.has('mount_kinematics');
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
