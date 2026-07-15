/**
 * @ste/validation — document and cross-field validation (spec v0.4 §43; v0.9
 * §23 R0-007/008).
 *
 * Produces structured {@link CalculationIssue}s; it never mutates or silently
 * corrects the design ("No silent correction", v0.4 §43). Invalid values are
 * preserved and explained (v0.9 §5). Issue ids are deterministic (code + first
 * field path) so identical inputs yield identical output (v0.4 §47).
 */

import { UM_PER_MM } from '@ste/units';
import type { CalculationIssue, DesignDocument, IssueSeverity } from '@ste/schema';

// --- issue construction ---------------------------------------------------

/** Stable issue codes emitted by this package. */
export const ISSUE_CODES = {
  APERTURE_INVALID: 'optics.aperture_invalid',
  APERTURE_MISSING: 'optics.aperture_missing',
  FOCAL_LENGTH_INVALID: 'optics.focal_length_invalid',
  FOCAL_LENGTH_MISSING: 'optics.focal_length_missing',
  MULTIPLIER_INVALID: 'optics.multiplier_invalid',
  TRANSMISSION_RANGE: 'optics.transmission_out_of_range',
  OBSTRUCTION_NEGATIVE: 'optics.obstruction_negative',
  OBSTRUCTION_EXCEEDS_APERTURE: 'optics.obstruction_exceeds_aperture',
  OPTICAL_BLUR_UNKNOWN: 'optics.optical_blur_unknown',
  SENSOR_DIMENSION_INVALID: 'camera.sensor_dimension_invalid',
  SENSOR_DIMENSION_MISSING: 'camera.sensor_dimension_missing',
  PIXEL_COUNT_INVALID: 'camera.pixel_count_invalid',
  PIXEL_PITCH_INVALID: 'camera.pixel_pitch_invalid',
  SENSOR_GEOMETRY_MISMATCH: 'camera.sensor_geometry_mismatch',
  QE_RANGE: 'camera.qe_out_of_range',
  SEEING_INVALID: 'scenario.seeing_invalid',
  EXPOSURE_INVALID: 'capture.exposure_invalid',
  EXPOSURE_EXCEEDS_SESSION: 'capture.exposure_exceeds_session',
  COORDINATES_INVALID: 'target.coordinates_invalid',
  FILTER_BANDWIDTH_INVALID: 'filter.bandwidth_invalid',
} as const;

export type IssueCode = (typeof ISSUE_CODES)[keyof typeof ISSUE_CODES];

interface IssueSpec {
  code: string;
  severity: IssueSeverity;
  title: string;
  message: string;
  field_paths?: string[];
  affected_result_groups?: string[];
  suggested_action?: string;
}

function makeIssue(spec: IssueSpec): CalculationIssue {
  const anchor = spec.field_paths?.[0] ?? 'design';
  return {
    issue_id: `${spec.code}@${anchor}`,
    code: spec.code,
    severity: spec.severity,
    title: spec.title,
    message: spec.message,
    ...(spec.field_paths ? { field_paths: spec.field_paths } : {}),
    ...(spec.affected_result_groups ? { affected_result_groups: spec.affected_result_groups } : {}),
    ...(spec.suggested_action ? { suggested_action: spec.suggested_action } : {}),
    source: 'user_input',
    dismissible: spec.severity === 'advisory' || spec.severity === 'information',
  };
}

// --- range predicates -----------------------------------------------------

const isPositive = (v: number | null | undefined): v is number => v != null && v > 0;
const inUnitInterval = (v: number | null | undefined): boolean => v == null || (v >= 0 && v <= 1);

/** Fraction tolerance for the sensor width ≈ pixels × pitch consistency check. */
export const SENSOR_GEOMETRY_TOLERANCE = 0.02;

// --- field-level validation (R0-007) -------------------------------------

function validateOptics(doc: DesignDocument, issues: CalculationIssue[]): void {
  const o = doc.optics;
  if (o.aperture_mm == null) {
    issues.push(
      makeIssue({
        code: ISSUE_CODES.APERTURE_MISSING,
        severity: 'error',
        title: 'Aperture required',
        message: 'Aperture is required for optical geometry.',
        field_paths: ['/optics/aperture_mm'],
        affected_result_groups: ['static_geometry'],
      }),
    );
  } else if (!isPositive(o.aperture_mm)) {
    issues.push(
      makeIssue({
        code: ISSUE_CODES.APERTURE_INVALID,
        severity: 'error',
        title: 'Aperture must be positive',
        message: `Aperture must be greater than zero (got ${o.aperture_mm} mm).`,
        field_paths: ['/optics/aperture_mm'],
        affected_result_groups: ['static_geometry'],
      }),
    );
  }

  if (o.native_focal_length_mm == null) {
    issues.push(
      makeIssue({
        code: ISSUE_CODES.FOCAL_LENGTH_MISSING,
        severity: 'error',
        title: 'Focal length required',
        message: 'Native focal length is required for optical geometry.',
        field_paths: ['/optics/native_focal_length_mm'],
        affected_result_groups: ['static_geometry'],
      }),
    );
  } else if (!isPositive(o.native_focal_length_mm)) {
    issues.push(
      makeIssue({
        code: ISSUE_CODES.FOCAL_LENGTH_INVALID,
        severity: 'error',
        title: 'Focal length must be positive',
        message: `Focal length must be greater than zero (got ${o.native_focal_length_mm} mm).`,
        field_paths: ['/optics/native_focal_length_mm'],
        affected_result_groups: ['static_geometry'],
      }),
    );
  }

  for (const [key, value] of [
    ['reducer_multiplier', o.reducer_multiplier],
    ['extender_multiplier', o.extender_multiplier],
  ] as const) {
    if (value != null && !isPositive(value)) {
      issues.push(
        makeIssue({
          code: ISSUE_CODES.MULTIPLIER_INVALID,
          severity: 'error',
          title: 'Reducer/extender must be positive',
          message: `${key} must be greater than zero (got ${value}).`,
          field_paths: [`/optics/${key}`],
          affected_result_groups: ['static_geometry'],
        }),
      );
    }
  }

  if (!inUnitInterval(o.optical_transmission_fraction)) {
    issues.push(
      makeIssue({
        code: ISSUE_CODES.TRANSMISSION_RANGE,
        severity: 'error',
        title: 'Transmission out of range',
        message: 'Optical transmission must be between 0 and 1.',
        field_paths: ['/optics/optical_transmission_fraction'],
      }),
    );
  }

  if (o.central_obstruction_mm != null) {
    if (o.central_obstruction_mm < 0) {
      issues.push(
        makeIssue({
          code: ISSUE_CODES.OBSTRUCTION_NEGATIVE,
          severity: 'error',
          title: 'Obstruction cannot be negative',
          message: 'Central obstruction must be zero or positive.',
          field_paths: ['/optics/central_obstruction_mm'],
        }),
      );
    } else if (o.aperture_mm != null && o.central_obstruction_mm >= o.aperture_mm) {
      issues.push(
        makeIssue({
          code: ISSUE_CODES.OBSTRUCTION_EXCEEDS_APERTURE,
          severity: 'error',
          title: 'Obstruction exceeds aperture',
          message: 'Central obstruction must be smaller than the aperture.',
          field_paths: ['/optics/central_obstruction_mm', '/optics/aperture_mm'],
          affected_result_groups: ['static_geometry'],
        }),
      );
    }
  }

  const blur = o.optical_blur;
  const blurKnown =
    (blur.representation === 'fwhm_arcsec' && blur.value != null) ||
    (blur.representation === 'spot_diameter_um' && blur.value != null) ||
    (blur.representation === 'quality_preset' &&
      blur.preset_class != null &&
      blur.preset_class !== 'unknown');
  if (!blurKnown) {
    issues.push(
      makeIssue({
        code: ISSUE_CODES.OPTICAL_BLUR_UNKNOWN,
        severity: 'advisory',
        title: 'Optical quality unknown',
        message: 'Optical blur is unspecified; sampling results will have reduced confidence.',
        field_paths: ['/optics/optical_blur'],
        affected_result_groups: ['sampling'],
        suggested_action: 'Choose an optical quality preset or enter a star FWHM.',
      }),
    );
  }
}

function validateCamera(doc: DesignDocument, issues: CalculationIssue[]): void {
  const s = doc.camera.sensor;
  const dims: Array<[string, number | null, string]> = [
    ['sensor_width_mm', s.sensor_width_mm, 'Sensor width'],
    ['sensor_height_mm', s.sensor_height_mm, 'Sensor height'],
  ];
  for (const [field, value, label] of dims) {
    if (value == null) {
      issues.push(
        makeIssue({
          code: ISSUE_CODES.SENSOR_DIMENSION_MISSING,
          severity: 'error',
          title: `${label} required`,
          message: `${label} is required for framing and field of view.`,
          field_paths: [`/camera/sensor/${field}`],
          affected_result_groups: ['static_geometry', 'target_framing'],
        }),
      );
    } else if (value <= 0) {
      issues.push(
        makeIssue({
          code: ISSUE_CODES.SENSOR_DIMENSION_INVALID,
          severity: 'error',
          title: `${label} must be positive`,
          message: `${label} must be greater than zero (got ${value} mm).`,
          field_paths: [`/camera/sensor/${field}`],
          affected_result_groups: ['static_geometry', 'target_framing'],
        }),
      );
    }
  }

  for (const [field, value, label] of [
    ['horizontal_pixels', s.horizontal_pixels, 'Horizontal pixels'],
    ['vertical_pixels', s.vertical_pixels, 'Vertical pixels'],
  ] as const) {
    if (value != null && (!Number.isFinite(value) || value <= 0)) {
      issues.push(
        makeIssue({
          code: ISSUE_CODES.PIXEL_COUNT_INVALID,
          severity: 'error',
          title: `${label} must be positive`,
          message: `${label} must be a positive integer (got ${value}).`,
          field_paths: [`/camera/sensor/${field}`],
        }),
      );
    }
  }

  for (const [field, value, label] of [
    ['pixel_pitch_x_um', s.pixel_pitch_x_um, 'Horizontal pixel pitch'],
    ['pixel_pitch_y_um', s.pixel_pitch_y_um, 'Vertical pixel pitch'],
  ] as const) {
    if (value != null && value <= 0) {
      issues.push(
        makeIssue({
          code: ISSUE_CODES.PIXEL_PITCH_INVALID,
          severity: 'error',
          title: `${label} must be positive`,
          message: `${label} must be greater than zero (got ${value} µm).`,
          field_paths: [`/camera/sensor/${field}`],
          affected_result_groups: ['static_geometry'],
        }),
      );
    }
  }

  if (!inUnitInterval(doc.camera.noise?.effective_quantum_efficiency_fraction)) {
    issues.push(
      makeIssue({
        code: ISSUE_CODES.QE_RANGE,
        severity: 'error',
        title: 'Quantum efficiency out of range',
        message: 'Effective QE must be between 0 and 1.',
        field_paths: ['/camera/noise/effective_quantum_efficiency_fraction'],
      }),
    );
  }
}

function validateScenarioAndCapture(doc: DesignDocument, issues: CalculationIssue[]): void {
  const seeing = doc.scenario.conditions.seeing_fwhm_arcsec;
  if (seeing != null && seeing < 0) {
    issues.push(
      makeIssue({
        code: ISSUE_CODES.SEEING_INVALID,
        severity: 'error',
        title: 'Seeing cannot be negative',
        message: 'Seeing FWHM must be zero or positive.',
        field_paths: ['/scenario/conditions/seeing_fwhm_arcsec'],
        affected_result_groups: ['sampling'],
      }),
    );
  }

  const exposure = doc.capture.exposure_s;
  if (exposure != null && !isPositive(exposure)) {
    issues.push(
      makeIssue({
        code: ISSUE_CODES.EXPOSURE_INVALID,
        severity: 'error',
        title: 'Exposure must be positive',
        message: `Exposure must be greater than zero (got ${exposure} s).`,
        field_paths: ['/capture/exposure_s'],
      }),
    );
  }

  const target = doc.target.custom_target;
  if (target != null) {
    const { right_ascension_deg: ra, declination_deg: dec } = target.coordinates;
    const raBad = ra != null && (ra < 0 || ra >= 360);
    const decBad = dec != null && (dec < -90 || dec > 90);
    if (raBad || decBad) {
      issues.push(
        makeIssue({
          code: ISSUE_CODES.COORDINATES_INVALID,
          severity: 'error',
          title: 'Coordinates out of range',
          message: 'Right ascension must be in [0, 360) and declination in [-90, 90].',
          field_paths: [
            '/target/custom_target/coordinates/right_ascension_deg',
            '/target/custom_target/coordinates/declination_deg',
          ],
        }),
      );
    }
  }

  for (const passband of doc.filter.passbands ?? []) {
    if (passband.bandwidth_nm != null && passband.bandwidth_nm <= 0) {
      issues.push(
        makeIssue({
          code: ISSUE_CODES.FILTER_BANDWIDTH_INVALID,
          severity: 'error',
          title: 'Filter bandwidth must be positive',
          message: 'Each filter passband must have a positive bandwidth.',
          field_paths: ['/filter/passbands'],
        }),
      );
    }
  }
}

// --- cross-field validation (R0-008) -------------------------------------

function validateCrossField(doc: DesignDocument, issues: CalculationIssue[]): void {
  const s = doc.camera.sensor;

  const checkGeometry = (
    dimMm: number | null,
    pixels: number | null,
    pitchUm: number | null,
    dimField: string,
    axis: 'width' | 'height',
  ): void => {
    if (isPositive(dimMm) && isPositive(pixels) && isPositive(pitchUm)) {
      const derivedMm = (pixels * pitchUm) / UM_PER_MM;
      const relError = Math.abs(derivedMm - dimMm) / dimMm;
      if (relError > SENSOR_GEOMETRY_TOLERANCE) {
        issues.push(
          makeIssue({
            code: ISSUE_CODES.SENSOR_GEOMETRY_MISMATCH,
            severity: 'warning',
            title: 'Sensor geometry inconsistent',
            message:
              `Sensor ${axis} (${dimMm} mm) disagrees with pixels × pitch ` +
              `(${derivedMm.toFixed(3)} mm) by ${(relError * 100).toFixed(1)}%.`,
            field_paths: [`/camera/sensor/${dimField}`],
            affected_result_groups: ['static_geometry'],
            suggested_action: 'Check sensor dimensions, pixel count, and pixel pitch.',
          }),
        );
      }
    }
  };

  checkGeometry(
    s.sensor_width_mm,
    s.horizontal_pixels,
    s.pixel_pitch_x_um,
    'sensor_width_mm',
    'width',
  );
  checkGeometry(
    s.sensor_height_mm,
    s.vertical_pixels,
    s.pixel_pitch_y_um,
    'sensor_height_mm',
    'height',
  );

  const exposure = doc.capture.exposure_s;
  const sessionDuration = doc.scenario.session?.duration_s ?? doc.capture.total_session_override_s;
  if (isPositive(exposure) && isPositive(sessionDuration) && exposure > sessionDuration) {
    issues.push(
      makeIssue({
        code: ISSUE_CODES.EXPOSURE_EXCEEDS_SESSION,
        severity: 'warning',
        title: 'Exposure longer than session',
        message: `A single ${exposure} s exposure is longer than the ${sessionDuration} s session.`,
        field_paths: ['/capture/exposure_s', '/scenario/session/duration_s'],
      }),
    );
  }
}

// --- entry point ----------------------------------------------------------

export interface ValidationResult {
  issues: CalculationIssue[];
  /** True when no fatal or error issues are present. */
  ok: boolean;
}

/** Run all field-level and cross-field checks over a design (v0.4 §43). */
export function validateDesign(doc: DesignDocument): ValidationResult {
  const issues: CalculationIssue[] = [];
  validateOptics(doc, issues);
  validateCamera(doc, issues);
  validateScenarioAndCapture(doc, issues);
  validateCrossField(doc, issues);
  const ok = !issues.some((i) => i.severity === 'fatal' || i.severity === 'error');
  return { issues, ok };
}
