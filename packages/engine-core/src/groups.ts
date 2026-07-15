/**
 * Result-group builders (spec v0.9 §23 R0-009..012; v0.4 §8–9, §22, §49).
 *
 * Each builder reads plain-number inputs from the {@link DesignDocument}, wraps
 * them in branded `@ste/units` quantities, calls the pure domain packages, and
 * assembles {@link ResultValue}s with confidence, dependencies, formula ids, and
 * assumption ids. Unknown inputs yield `unavailable` results — never fabricated
 * numbers (v0.8 §2.4).
 */

import {
  arcsec,
  mm,
  mm2,
  nm,
  raw,
  um,
  type Arcseconds,
  type Fraction,
  type Millimeters,
} from '@ste/units';
import {
  DEFAULT_REFERENCE_WAVELENGTH_NM,
  clearApertureArea,
  diffractionFwhm,
  effectiveApertureArea,
  effectiveFocalLength,
  focalRatio,
  resolveOpticalFwhm,
} from '@ste/optics';
import {
  DEFAULT_STORED_BIT_DEPTH,
  activeSensorDimensions,
  effectivePixelCounts,
  effectivePixelPitch,
  fieldOfView,
  frameSizeBytes,
  imageScale,
  resolveBinning,
} from '@ste/camera';
import { computeFraming, imageCircleCoverage } from '@ste/targets';
import { baseFwhm, classifySampling, meanImageScale, pixelsPerFwhm } from './sampling.js';
import type {
  CalculationAssumption,
  ConfidenceLevel,
  DesignDocument,
  FitStatus,
  FormulaRecord,
  SamplingResults,
  StaticGeometryResults,
  TargetFramingResults,
  TargetGeometry,
} from '@ste/schema';
import { FORMULA_IDS, buildFormula } from './formulas.js';
import {
  confidence,
  decimals,
  valid,
  weakestConfidence,
  INTEGER_PRECISION,
  unavailable,
} from './result.js';

// --- small readers --------------------------------------------------------

const pos = (v: number | null | undefined): number | null =>
  v != null && Number.isFinite(v) && v > 0 ? v : null;
const nonNeg = (v: number | null | undefined): number | null =>
  v != null && Number.isFinite(v) && v >= 0 ? v : null;

/** Accumulates deduplicated assumptions and formula records during a calculation. */
export class CalcContext {
  readonly assumptions = new Map<string, CalculationAssumption>();
  readonly formulas: FormulaRecord[] = [];

  addAssumption(a: CalculationAssumption): string {
    if (!this.assumptions.has(a.assumption_id)) this.assumptions.set(a.assumption_id, a);
    return a.assumption_id;
  }

  addFormula(f: FormulaRecord): string {
    this.formulas.push(f);
    return f.formula_id;
  }
}

// --- derived geometry shared across groups --------------------------------

export interface DerivedGeometry {
  effectiveFocalLengthMm: Millimeters | null;
  imageScaleXArcsec: Arcseconds | null;
  imageScaleYArcsec: Arcseconds | null;
  diffractionArcsec: Arcseconds | null;
  activeWidthMm: Millimeters | null;
  activeHeightMm: Millimeters | null;
  effectiveHorizontalPixels: number | null;
  effectiveVerticalPixels: number | null;
}

// --- static geometry (R0-009/010) ----------------------------------------

export function computeStaticGeometry(
  doc: DesignDocument,
  ctx: CalcContext,
): { results: StaticGeometryResults; derived: DerivedGeometry } {
  const o = doc.optics;
  const sensor = doc.camera.sensor;
  const mode = doc.camera.operating_mode;

  const aperture = pos(o.aperture_mm);
  const nativeFl = pos(o.native_focal_length_mm);
  const reducer = pos(o.reducer_multiplier) ?? 1;
  const extender = pos(o.extender_multiplier) ?? 1;

  const geomConf = confidence('high');

  // Effective focal length
  let fEff: Millimeters | null = null;
  let fEffResult: StaticGeometryResults['effective_focal_length_mm'];
  if (nativeFl != null) {
    fEff = effectiveFocalLength(mm(nativeFl), reducer, extender);
    fEffResult = valid(raw(fEff), 'mm', {
      confidence: geomConf,
      displayPrecision: decimals(1),
      dependencies: [
        '/optics/native_focal_length_mm',
        '/optics/reducer_multiplier',
        '/optics/extender_multiplier',
      ],
      formulaId: ctx.addFormula(
        buildFormula(FORMULA_IDS.EFFECTIVE_FOCAL_LENGTH, {
          substituted: `${nativeFl} × ${reducer} × ${extender}`,
          result: raw(fEff),
          dependencyPaths: ['/optics/native_focal_length_mm'],
        }),
      ),
    });
  } else {
    fEffResult = unavailable('mm', {
      dependencies: ['/optics/native_focal_length_mm'],
    });
  }

  // Focal ratio
  const focalRatioResult =
    fEff != null && aperture != null
      ? valid(focalRatio(fEff, mm(aperture)), '', {
          confidence: geomConf,
          displayPrecision: decimals(2),
          dependencies: ['/optics/aperture_mm'],
          formulaId: ctx.addFormula(
            buildFormula(FORMULA_IDS.FOCAL_RATIO, {
              substituted: `${raw(fEff)} / ${aperture}`,
              result: focalRatio(fEff, mm(aperture)),
            }),
          ),
        })
      : unavailable('', { dependencies: ['/optics/aperture_mm'] });

  // Clear + effective collecting area
  const obstruction = nonNeg(o.central_obstruction_mm) ?? 0;
  let clearAreaResult: StaticGeometryResults['clear_aperture_area_mm2'];
  let clearArea: number | null = null;
  if (aperture != null && obstruction < aperture) {
    const area = clearApertureArea(mm(aperture), mm(obstruction));
    clearArea = raw(area);
    clearAreaResult = valid(clearArea, 'mm²', {
      confidence: geomConf,
      displayPrecision: decimals(1),
      dependencies: ['/optics/aperture_mm', '/optics/central_obstruction_mm'],
      formulaId: ctx.addFormula(
        buildFormula(FORMULA_IDS.CLEAR_AREA, {
          substituted: `(π/4)(${aperture}² − ${obstruction}²)`,
          result: clearArea,
        }),
      ),
    });
  } else {
    clearAreaResult = unavailable('mm²', { dependencies: ['/optics/aperture_mm'] });
  }

  const transmission = o.optical_transmission_fraction;
  const effectiveAreaResult =
    clearArea != null && transmission != null && transmission >= 0 && transmission <= 1
      ? valid(raw(effectiveApertureArea(mm2(clearArea), transmission as Fraction)), 'mm²', {
          confidence: geomConf,
          displayPrecision: decimals(1),
          dependencies: ['/optics/optical_transmission_fraction'],
          formulaId: ctx.addFormula(
            buildFormula(FORMULA_IDS.EFFECTIVE_AREA, {
              substituted: `${clearArea.toFixed(1)} × ${transmission}`,
              result: clearArea * transmission,
            }),
          ),
        })
      : unavailable('mm²', {
          dependencies: ['/optics/optical_transmission_fraction'],
          issueIds: [],
        });

  // Diffraction FWHM
  const wavelength = pos(o.reference_wavelength_nm);
  let diffractionArcsec: Arcseconds | null = null;
  let diffractionResult: StaticGeometryResults['diffraction_fwhm_arcsec'];
  if (aperture != null) {
    const assumptionIds: string[] = [];
    if (wavelength == null) {
      assumptionIds.push(
        ctx.addAssumption({
          assumption_id: 'assume.reference_wavelength_550nm',
          title: 'Reference wavelength 550 nm',
          description:
            'No reference wavelength was given; 550 nm (visual band) is assumed for diffraction.',
          field_paths: ['/optics/reference_wavelength_nm'],
          default_value: DEFAULT_REFERENCE_WAVELENGTH_NM,
          unit: 'nm',
          confidence: 'moderate',
          affects_groups: ['static_geometry', 'sampling'],
          user_can_override: true,
        }),
      );
    }
    diffractionArcsec = diffractionFwhm(
      mm(aperture),
      nm(wavelength ?? DEFAULT_REFERENCE_WAVELENGTH_NM),
    );
    diffractionResult = valid(raw(diffractionArcsec), 'arcsec', {
      confidence: geomConf,
      displayPrecision: decimals(2),
      dependencies: ['/optics/aperture_mm', '/optics/reference_wavelength_nm'],
      assumptionIds,
      formulaId: ctx.addFormula(
        buildFormula(FORMULA_IDS.DIFFRACTION_FWHM, {
          substituted: `1.028 × ${wavelength ?? DEFAULT_REFERENCE_WAVELENGTH_NM}nm / ${aperture}mm`,
          result: raw(diffractionArcsec),
          assumptions: assumptionIds,
        }),
      ),
    });
  } else {
    diffractionResult = unavailable('arcsec', { dependencies: ['/optics/aperture_mm'] });
  }

  // Image scale (x/y) using effective (binned) pitch
  const binning = resolveBinning(mode);
  const pitchX = pos(sensor.pixel_pitch_x_um);
  const pitchY = pos(sensor.pixel_pitch_y_um);
  let imageScaleXArcsec: Arcseconds | null = null;
  let imageScaleYArcsec: Arcseconds | null = null;

  const scaleResult = (
    pitch: number | null,
    axis: 'x' | 'y',
    bin: number,
  ): { result: StaticGeometryResults['image_scale_x_arcsec_per_px']; value: Arcseconds | null } => {
    if (fEff == null || pitch == null) {
      return {
        result: unavailable('arcsec/px', {
          dependencies: [`/camera/sensor/pixel_pitch_${axis}_um`],
        }),
        value: null,
      };
    }
    const effPitch = effectivePixelPitch(um(pitch), bin);
    const scale = imageScale(effPitch, fEff);
    return {
      value: scale,
      result: valid(raw(scale), 'arcsec/px', {
        confidence: geomConf,
        displayPrecision: decimals(2),
        dependencies: [`/camera/sensor/pixel_pitch_${axis}_um`],
        formulaId: ctx.addFormula(
          buildFormula(FORMULA_IDS.IMAGE_SCALE, {
            substituted: `206.265 × ${(pitch * bin).toFixed(3)}µm / ${raw(fEff)}mm`,
            result: raw(scale),
          }),
        ),
      }),
    };
  };
  const sx = scaleResult(pitchX, 'x', binning.x);
  const sy = scaleResult(pitchY, 'y', binning.y);
  imageScaleXArcsec = sx.value;
  imageScaleYArcsec = sy.value;

  // Field of view (x/y)
  const active = activeSensorDimensions(sensor, mode);
  const fovResult = (
    dim: Millimeters | null,
    axis: 'x' | 'y',
    field: string,
  ): StaticGeometryResults['field_of_view_x_deg'] => {
    if (fEff == null || dim == null) {
      return unavailable('deg', { dependencies: [field] });
    }
    const fov = fieldOfView(dim, fEff);
    return valid(raw(fov), 'deg', {
      confidence: geomConf,
      displayPrecision: decimals(2),
      dependencies: [field],
      formulaId: ctx.addFormula(
        buildFormula(FORMULA_IDS.FIELD_OF_VIEW, {
          substituted: `2 · arctan(${raw(dim).toFixed(3)}mm / (2 × ${raw(fEff)}mm))`,
          result: raw(fov),
        }),
      ),
    });
  };

  // Active sensor dimensions
  const activeDimResult = (dim: Millimeters | null, field: string) =>
    dim == null
      ? unavailable('mm', { dependencies: [field] })
      : valid(raw(dim), 'mm', {
          confidence: geomConf,
          displayPrecision: decimals(3),
          dependencies: [field],
        });

  // Frame size
  const counts = effectivePixelCounts(sensor, mode);
  const storedBits = pos(doc.camera.readout?.stored_bit_depth) ?? DEFAULT_STORED_BIT_DEPTH;
  const frameSizeResult =
    counts.total == null
      ? unavailable('bytes', { dependencies: ['/camera/sensor/horizontal_pixels'] })
      : valid(raw(frameSizeBytes(counts.total, storedBits)), 'bytes', {
          confidence: geomConf,
          displayPrecision: INTEGER_PRECISION,
          dependencies: ['/camera/sensor/horizontal_pixels', '/camera/sensor/vertical_pixels'],
          formulaId: ctx.addFormula(
            buildFormula(FORMULA_IDS.FRAME_SIZE, {
              substituted: `${counts.total} × ${storedBits} / 8`,
              result: counts.total * (storedBits / 8),
            }),
          ),
        });

  const results: StaticGeometryResults = {
    effective_focal_length_mm: fEffResult,
    focal_ratio: focalRatioResult,
    clear_aperture_area_mm2: clearAreaResult,
    effective_aperture_area_mm2: effectiveAreaResult,
    diffraction_fwhm_arcsec: diffractionResult,
    image_scale_x_arcsec_per_px: sx.result,
    image_scale_y_arcsec_per_px: sy.result,
    field_of_view_x_deg: fovResult(active.widthMm, 'x', '/camera/sensor/sensor_width_mm'),
    field_of_view_y_deg: fovResult(active.heightMm, 'y', '/camera/sensor/sensor_height_mm'),
    active_sensor_width_mm: activeDimResult(active.widthMm, '/camera/sensor/sensor_width_mm'),
    active_sensor_height_mm: activeDimResult(active.heightMm, '/camera/sensor/sensor_height_mm'),
    frame_size_bytes: frameSizeResult,
  };

  return {
    results,
    derived: {
      effectiveFocalLengthMm: fEff,
      imageScaleXArcsec,
      imageScaleYArcsec,
      diffractionArcsec,
      activeWidthMm: active.widthMm,
      activeHeightMm: active.heightMm,
      effectiveHorizontalPixels: counts.horizontal,
      effectiveVerticalPixels: counts.vertical,
    },
  };
}

// --- resolve target geometry (catalog or custom) --------------------------

function resolveTargetGeometry(doc: DesignDocument): TargetGeometry | null {
  const sel = doc.target;
  const base = sel.custom_target?.geometry ?? null;
  if (base == null) return null;
  return sel.overrides?.geometry ? { ...base, ...sel.overrides.geometry } : base;
}

// --- target framing (R0-011) ---------------------------------------------

export function computeTargetFraming(
  doc: DesignDocument,
  derived: DerivedGeometry,
): TargetFramingResults {
  const geometry = resolveTargetGeometry(doc);
  const width = pos(geometry?.width_arcmin);
  const height = pos(geometry?.height_arcmin);
  const sx = derived.imageScaleXArcsec;
  const sy = derived.imageScaleYArcsec;
  const px = derived.effectiveHorizontalPixels;
  const py = derived.effectiveVerticalPixels;

  const framingConf = confidence('high');

  if (width == null || height == null || sx == null || sy == null || px == null || py == null) {
    const dep = ['/target/custom_target/geometry'];
    return {
      target_width_px: unavailable('px', { dependencies: dep }),
      target_height_px: unavailable('px', { dependencies: dep }),
      margin_x_fraction: unavailable('fraction', { dependencies: dep }),
      margin_y_fraction: unavailable('fraction', { dependencies: dep }),
      minimum_margin_fraction: unavailable('fraction', { dependencies: dep }),
      fit_status: unavailable<FitStatus>('', { dependencies: dep }),
      image_circle_coverage_fraction: coverageResult(doc, derived),
      core_fit_status: unavailable<FitStatus>('', { dependencies: dep }),
      halo_fit_status: unavailable<FitStatus>('', { dependencies: dep }),
    };
  }

  const framing = computeFraming({
    widthArcmin: width,
    heightArcmin: height,
    positionAngleDeg: geometry?.position_angle_deg ?? 0,
    imageScaleXArcsecPerPx: sx,
    imageScaleYArcsecPerPx: sy,
    sensorWidthPx: px,
    sensorHeightPx: py,
    recommendedMarginFraction: geometry?.recommended_margin_fraction ?? null,
  });

  const coreFit = subRegionFit(
    geometry?.bright_core_width_arcmin,
    geometry?.bright_core_height_arcmin,
    geometry,
    derived,
    px,
    py,
  );
  const haloFit = subRegionFit(
    geometry?.halo_width_arcmin,
    geometry?.halo_height_arcmin,
    geometry,
    derived,
    px,
    py,
  );

  return {
    target_width_px: valid(framing.targetWidthPx, 'px', {
      confidence: framingConf,
      displayPrecision: INTEGER_PRECISION,
      formulaId: FORMULA_IDS.TARGET_PIXELS,
    }),
    target_height_px: valid(framing.targetHeightPx, 'px', {
      confidence: framingConf,
      displayPrecision: INTEGER_PRECISION,
      formulaId: FORMULA_IDS.TARGET_PIXELS,
    }),
    margin_x_fraction: valid(framing.marginXFraction, 'fraction', {
      confidence: framingConf,
      displayPrecision: decimals(3),
    }),
    margin_y_fraction: valid(framing.marginYFraction, 'fraction', {
      confidence: framingConf,
      displayPrecision: decimals(3),
    }),
    minimum_margin_fraction: valid(framing.minimumMarginFraction, 'fraction', {
      confidence: framingConf,
      displayPrecision: decimals(3),
    }),
    fit_status: valid(framing.fitStatus, '', { confidence: framingConf }),
    image_circle_coverage_fraction: coverageResult(doc, derived),
    core_fit_status: coreFit,
    halo_fit_status: haloFit,
  };
}

function subRegionFit(
  wArcmin: number | null | undefined,
  hArcmin: number | null | undefined,
  geometry: TargetGeometry | null,
  derived: DerivedGeometry,
  px: number,
  py: number,
): TargetFramingResults['core_fit_status'] {
  const w = pos(wArcmin);
  const h = pos(hArcmin);
  if (
    w == null ||
    h == null ||
    derived.imageScaleXArcsec == null ||
    derived.imageScaleYArcsec == null
  ) {
    return unavailable<FitStatus>('', { dependencies: ['/target/custom_target/geometry'] });
  }
  const framing = computeFraming({
    widthArcmin: w,
    heightArcmin: h,
    positionAngleDeg: geometry?.position_angle_deg ?? 0,
    imageScaleXArcsecPerPx: derived.imageScaleXArcsec,
    imageScaleYArcsecPerPx: derived.imageScaleYArcsec,
    sensorWidthPx: px,
    sensorHeightPx: py,
  });
  return valid(framing.fitStatus, '', { confidence: confidence('high') });
}

function coverageResult(
  doc: DesignDocument,
  derived: DerivedGeometry,
): TargetFramingResults['image_circle_coverage_fraction'] {
  const coverage = imageCircleCoverage(
    doc.optics.image_circle_diameter_mm == null ? null : mm(doc.optics.image_circle_diameter_mm),
    derived.activeWidthMm,
    derived.activeHeightMm,
  );
  return coverage == null
    ? unavailable('fraction', { dependencies: ['/optics/image_circle_diameter_mm'] })
    : valid(coverage, 'fraction', {
        confidence: confidence('high'),
        displayPrecision: decimals(2),
      });
}

// --- sampling (R0-012) ---------------------------------------------------

export function computeSampling(
  doc: DesignDocument,
  derived: DerivedGeometry,
  ctx: CalcContext,
): SamplingResults {
  const seeing = nonNeg(doc.scenario.conditions.seeing_fwhm_arcsec);
  const seeingArcsec = seeing == null ? null : arcsec(seeing);
  const diffractionArcsec = derived.diffractionArcsec;

  // Optical FWHM via the optics blur resolver.
  const blur = resolveOpticalFwhm(doc.optics.optical_blur, derived.effectiveFocalLengthMm);
  const opticalArcsec = blur.fwhmArcsec;
  const opticalAssumptionIds: string[] = [];
  if (blur.assumed && opticalArcsec != null) {
    opticalAssumptionIds.push(
      ctx.addAssumption({
        assumption_id: `assume.optical_quality_${doc.optics.optical_blur.preset_class ?? 'preset'}`,
        title: 'Assumed optical quality',
        description: `Optical quality preset "${doc.optics.optical_blur.preset_class}" maps to an assumed star FWHM of ${raw(opticalArcsec)}″.`,
        field_paths: ['/optics/optical_blur'],
        default_value: raw(opticalArcsec),
        unit: 'arcsec',
        confidence: 'low',
        affects_groups: ['sampling'],
        user_can_override: true,
      }),
    );
  }

  const seeingConf: ConfidenceLevel = seeingArcsec == null ? 'unknown' : 'moderate';
  const diffractionConf: ConfidenceLevel = diffractionArcsec == null ? 'unknown' : 'high';
  const opticalConf: ConfidenceLevel =
    opticalArcsec == null ? 'unknown' : blur.assumed ? 'low' : 'moderate';

  const base = baseFwhm({ seeingArcsec, diffractionArcsec, opticalArcsec });
  const scale =
    derived.imageScaleXArcsec != null && derived.imageScaleYArcsec != null
      ? meanImageScale(derived.imageScaleXArcsec, derived.imageScaleYArcsec)
      : null;

  const seeingResult =
    seeingArcsec == null
      ? unavailable('arcsec', { dependencies: ['/scenario/conditions/seeing_fwhm_arcsec'] })
      : valid(raw(seeingArcsec), 'arcsec', {
          confidence: confidence('moderate'),
          displayPrecision: decimals(2),
          dependencies: ['/scenario/conditions/seeing_fwhm_arcsec'],
        });

  const diffractionResult =
    diffractionArcsec == null
      ? unavailable('arcsec', { dependencies: ['/optics/aperture_mm'] })
      : valid(raw(diffractionArcsec), 'arcsec', {
          confidence: confidence('high'),
          displayPrecision: decimals(2),
        });

  const opticalResult =
    opticalArcsec == null
      ? unavailable('arcsec', {
          dependencies: ['/optics/optical_blur'],
          assumptionIds: opticalAssumptionIds,
        })
      : valid(raw(opticalArcsec), 'arcsec', {
          confidence: confidence(opticalConf),
          displayPrecision: decimals(2),
          dependencies: ['/optics/optical_blur'],
          assumptionIds: opticalAssumptionIds,
        });

  if (base == null || scale == null) {
    return {
      seeing_fwhm_arcsec: seeingResult,
      diffraction_fwhm_arcsec: diffractionResult,
      optical_fwhm_arcsec: opticalResult,
      base_fwhm_arcsec: unavailable('arcsec'),
      base_fwhm_px: unavailable('px'),
      pixels_per_fwhm: unavailable('px'),
      classification: valid(classifySampling(null), ''),
    };
  }

  const baseConf = weakestConfidence(seeingConf, diffractionConf, opticalConf);
  const ppf = pixelsPerFwhm(base, scale);
  const baseFwhmPx = raw(base) / raw(scale);
  const allAssumptions = [...opticalAssumptionIds];

  return {
    seeing_fwhm_arcsec: seeingResult,
    diffraction_fwhm_arcsec: diffractionResult,
    optical_fwhm_arcsec: opticalResult,
    base_fwhm_arcsec: valid(raw(base), 'arcsec', {
      confidence: confidence(baseConf),
      displayPrecision: decimals(2),
      assumptionIds: allAssumptions,
      formulaId: ctx.addFormula(
        buildFormula(FORMULA_IDS.BASE_FWHM, {
          substituted: `√(${seeing ?? 0}² + ${diffractionArcsec ? raw(diffractionArcsec).toFixed(2) : 0}² + ${opticalArcsec ? raw(opticalArcsec) : 0}²)`,
          result: raw(base),
          assumptions: allAssumptions,
        }),
      ),
    }),
    base_fwhm_px: valid(baseFwhmPx, 'px', {
      confidence: confidence(baseConf),
      displayPrecision: decimals(2),
      assumptionIds: allAssumptions,
    }),
    pixels_per_fwhm: valid(ppf, 'px', {
      confidence: confidence(baseConf),
      displayPrecision: decimals(2),
      assumptionIds: allAssumptions,
      formulaId: ctx.addFormula(
        buildFormula(FORMULA_IDS.PIXELS_PER_FWHM, {
          substituted: `${raw(base).toFixed(2)}″ / ${raw(scale).toFixed(2)}″/px`,
          result: ppf,
        }),
      ),
    }),
    classification: valid(classifySampling(ppf), '', {
      confidence: confidence(baseConf),
      assumptionIds: allAssumptions,
    }),
  };
}
