/**
 * Simplified recommendation rules (spec v0.9 §25 R2-031; v0.4 §41; v0.3 §5).
 *
 * Reads the computed result groups and emits prioritised {@link Recommendation}s
 * describing required *characteristics* before products (v0.3 §1). Priority order
 * (v0.3 §5): impossible conditions → intra-frame damage → lost integration →
 * practicality → optional. No motor/encoder advice before R4 (R2-031).
 *
 * Invariants (v0.4 §48): do not recommend a longer exposure when rotation/motion
 * already fails; do not recommend a larger aperture when target fit is the hard
 * limit (we recommend a shorter focal length instead).
 */

import type {
  DesignDocument,
  Recommendation,
  RecommendationSeverity,
  ResultGroups,
  ResultValue,
} from '@ste/schema';

const SEVERITY_RANK: Record<RecommendationSeverity, number> = {
  critical: 0,
  high_value: 1,
  optional: 2,
  low_value: 3,
  counterproductive_warning: 4,
};

const num = (rv: ResultValue<unknown> | undefined): number | null =>
  typeof rv?.value === 'number' ? rv.value : null;
const str = (rv: ResultValue<unknown> | undefined): string | null =>
  typeof rv?.value === 'string' ? rv.value : null;
const bool = (rv: ResultValue<unknown> | undefined): boolean => rv?.value === true;

interface RuleOutput {
  rule_id: string;
  category: Recommendation['category'];
  severity: RecommendationSeverity;
  title: string;
  problem: string;
  proposed_changes?: Recommendation['proposed_changes'];
  next_bottleneck?: string;
}

function toRecommendation(o: RuleOutput): Recommendation {
  return {
    recommendation_id: o.rule_id,
    rule_id: o.rule_id,
    category: o.category,
    severity: o.severity,
    status: 'active',
    title: o.title,
    problem: o.problem,
    confidence: 'moderate',
    ...(o.proposed_changes ? { proposed_changes: o.proposed_changes } : {}),
    ...(o.next_bottleneck != null ? { next_bottleneck: o.next_bottleneck } : {}),
  };
}

/** Generate prioritised recommendations from the computed results (v0.9 §25). */
export function generateRecommendations(
  doc: DesignDocument,
  results: ResultGroups,
): Recommendation[] {
  const out: RuleOutput[] = [];
  const framing = results.target_framing;
  const sampling = results.sampling;
  const blur = results.blur;
  const rotation = results.field_rotation;
  const mount = results.mount_kinematics;
  const exposure = results.exposure_sweep;

  const motionFailing =
    blur?.dominant_contribution?.value === 'motion' &&
    (blur.quality?.value === 'poor' || blur.quality?.value === 'marginal');
  const rotationFailing =
    rotation?.quality?.value === 'poor' ||
    (blur?.dominant_contribution?.value === 'rotation' && blur.quality?.value !== 'good');

  // 1. Impossible: target does not fit (hard framing limit) → shorter focal length.
  if (str(framing?.fit_status) === 'does_not_fit') {
    const fl = doc.optics.native_focal_length_mm;
    out.push({
      rule_id: 'framing.target_does_not_fit',
      category: 'framing',
      severity: 'critical',
      title: 'Target does not fit the sensor',
      problem:
        'The target is larger than the field of view. Exposure changes cannot fix framing; ' +
        'reduce the focal length or use a larger sensor (if the image circle supports it).',
      proposed_changes:
        fl != null
          ? [
              {
                kind: 'replace',
                field_path: '/optics/native_focal_length_mm',
                current_value: fl,
                proposed_value: Math.round(fl * 0.7),
                unit: 'mm',
              },
            ]
          : undefined,
      next_bottleneck: 'sampling',
    });
  }

  // 2. Missing tracking data — results assume no tracking error.
  if (doc.tracking.enabled && doc.tracking.error_model == null) {
    out.push({
      rule_id: 'tracking.missing_data',
      category: 'tracking',
      severity: 'high_value',
      title: 'No tracking error entered',
      problem:
        'Tracking is enabled but no drift/periodic/jitter data was provided, so blur assumes ' +
        'perfect tracking. Enter measured or estimated tracking error for realistic results.',
    });
  }

  // 3. Intra-frame damage: motion-dominated elongation → shorter exposure / less error.
  if (motionFailing) {
    const dominant = str(results.tracking?.dominant_component) ?? 'tracking';
    out.push({
      rule_id: 'tracking.motion_dominates',
      category: 'tracking',
      severity: 'high_value',
      title: 'Tracking motion is elongating stars',
      problem:
        `Intra-frame ${dominant.replace('_', ' ')} dominates the blur ellipse. A shorter ` +
        'exposure reduces trailing; registration cannot repair intra-frame motion.',
      proposed_changes:
        doc.capture.exposure_s != null
          ? [
              {
                kind: 'replace',
                field_path: '/capture/exposure_s',
                current_value: doc.capture.exposure_s,
                proposed_value: Math.max(1, Math.round(doc.capture.exposure_s / 2)),
                unit: 's',
              },
            ]
          : undefined,
      next_bottleneck: 'sampling',
    });
  }

  // 4. Rotation-limited (alt-az) → equatorial / schedule away from zenith / shorter exposure.
  if (rotationFailing) {
    out.push({
      rule_id: 'rotation.field_rotation_limits_exposure',
      category: 'rotation',
      severity: 'high_value',
      title: 'Field rotation is limiting the exposure',
      problem:
        'Field rotation smears the frame corners (an equatorial mount removes it; scheduling ' +
        'away from the zenith reduces it). Registration cannot repair intra-frame rotation.',
    });
  }

  // 5. Zenith risk (alt-az keyhole).
  if (bool(mount?.zenith_risk)) {
    out.push({
      rule_id: 'mount.zenith_keyhole',
      category: 'mount',
      severity: 'high_value',
      title: 'Target passes through the zenith keyhole',
      problem:
        'Near the zenith an alt-azimuth mount needs very fast azimuth motion and field rotation ' +
        'peaks. Schedule the target away from the zenith or use an equatorial mount.',
    });
  }

  // 6. Lost integration: overhead-limited → longer exposure (SUPPRESSED if motion/rotation fails).
  const best = num(exposure?.best_exposure_s);
  const current = doc.capture.exposure_s;
  if (
    best != null &&
    current != null &&
    best > current * 1.5 &&
    !motionFailing &&
    !rotationFailing
  ) {
    out.push({
      rule_id: 'exposure.readout_overhead',
      category: 'exposure',
      severity: 'high_value',
      title: 'Readout overhead is wasting session time',
      problem:
        `A longer exposure (~${best} s) raises the duty cycle without exceeding the tracking ` +
        'limit, capturing more light per session.',
      proposed_changes: [
        {
          kind: 'replace',
          field_path: '/capture/exposure_s',
          current_value: current,
          proposed_value: best,
          unit: 's',
        },
      ],
      next_bottleneck: 'tracking',
    });
  }

  // 7. Oversampling → coarser sampling (optional).
  const cls = str(sampling?.classification);
  if (cls === 'oversampled' || cls === 'severely_oversampled') {
    out.push({
      rule_id: 'sampling.oversampled',
      category: 'sampling',
      severity: 'optional',
      title: 'The system is oversampled',
      problem:
        'Pixels are finer than the star profile needs. Binning or a shorter focal length would ' +
        'improve signal per pixel with little resolution loss.',
    });
  }

  return out
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    .map(toRecommendation);
}
