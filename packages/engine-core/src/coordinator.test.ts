import { describe, expect, it } from 'vitest';
import type { CalculationRequest, DesignDocument } from '@ste/schema';
import { calculate } from './index.js';

function f01Doc(): DesignDocument {
  return {
    schema_version: '1.0.0',
    calculation_engine_version: '1.0.0',
    design_id: 'design_f01',
    revision: 1,
    metadata: {
      name: '30 mm Prototype',
      design_type: 'custom',
      locked: false,
      created_at: '2026-07-14T00:00:00Z',
      modified_at: '2026-07-14T00:00:00Z',
    },
    scenario: {
      mode: 'direct_horizontal_session',
      session: { start_time_utc: '2026-07-14T03:00:00Z', duration_s: 3600 },
      direct_horizontal: { altitude_deg: 45, azimuth_deg: 180 },
      conditions: { seeing_fwhm_arcsec: 2.5 },
    },
    target: {
      selection_type: 'custom',
      custom_target: {
        target_id: 't1',
        name: 'Demo',
        coordinates: { right_ascension_deg: null, declination_deg: null, epoch: 'j2000' },
        geometry: { shape: 'ellipse', width_arcmin: 120, height_arcmin: 80, position_angle_deg: 0 },
        classification: { target_type: 'emission_nebula' },
      },
    },
    optics: {
      aperture_mm: 30,
      native_focal_length_mm: 160,
      reducer_multiplier: 1,
      extender_multiplier: 1,
      optical_blur: { representation: 'quality_preset', preset_class: 'typical_inexpensive_lens' },
    },
    camera: {
      sensor: {
        sensor_width_mm: 11.136,
        sensor_height_mm: 6.264,
        horizontal_pixels: 3840,
        vertical_pixels: 2160,
        pixel_pitch_x_um: 2.9,
        pixel_pitch_y_um: 2.9,
      },
    },
    filter: { filter_type: 'none' },
    mount: { architecture: 'alt_azimuth' },
    tracking: { enabled: false },
    capture: { exposure_s: 10 },
    constraints: [],
    extensions: {},
  };
}

function request(
  design: DesignDocument,
  groups: CalculationRequest['requested_groups'],
): CalculationRequest {
  return {
    message_type: 'calculate_design',
    request_id: 'req-1',
    design_id: design.design_id,
    design_revision: design.revision,
    engine_version: '1.0.0',
    calculation_mode: 'normal',
    requested_groups: groups,
    design,
  };
}

describe('coordinator orchestration', () => {
  it('expands "all" to the supported R0 groups and completes on a valid design', () => {
    const res = calculate(request(f01Doc(), ['all']));
    expect(res.status).toBe('complete');
    expect(res.calculated_groups).toEqual(
      expect.arrayContaining(['validation', 'static_geometry', 'target_framing', 'sampling']),
    );
    expect(res.message_type).toBe('calculation_result');
  });

  it('pulls in static_geometry as a prerequisite of sampling', () => {
    const res = calculate(request(f01Doc(), ['sampling']));
    // sampling is produced; static geometry ran but was not explicitly requested.
    expect(res.results.sampling).toBeDefined();
    expect(res.calculated_groups).toContain('sampling');
    expect(res.calculated_groups).not.toContain('static_geometry');
  });

  it('is deterministic for identical inputs (v0.4 §47)', () => {
    const a = calculate(request(f01Doc(), ['all']));
    const b = calculate(request(f01Doc(), ['all']));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe('F01 static geometry values', () => {
  const res = calculate(request(f01Doc(), ['static_geometry']));
  const g = res.results.static_geometry!;

  it('effective focal length 160 mm, focal ratio ~5.33', () => {
    expect(g.effective_focal_length_mm.value).toBeCloseTo(160, 6);
    expect(g.focal_ratio.value).toBeCloseTo(5.333, 3);
  });

  it('image scale ~3.74 arcsec/px, FOV ~3.99 x 2.24 deg', () => {
    expect(g.image_scale_x_arcsec_per_px.value).toBeCloseTo(3.7386, 3);
    expect(g.field_of_view_x_deg.value).toBeCloseTo(3.986, 2);
    expect(g.field_of_view_y_deg.value).toBeCloseTo(2.243, 2);
  });

  it('diffraction ~3.89 arcsec with a wavelength assumption and high geometry confidence', () => {
    expect(g.diffraction_fwhm_arcsec.value).toBeCloseTo(3.887, 2);
    expect(g.diffraction_fwhm_arcsec.confidence?.level).toBe('high');
    expect(res.assumptions.map((a) => a.assumption_id)).toContain(
      'assume.reference_wavelength_550nm',
    );
  });

  it('frame size 16,588,800 bytes at the default 16-bit depth', () => {
    expect(g.frame_size_bytes.value).toBe(16_588_800);
  });

  it('leaves effective area unavailable when transmission is unknown (unknown != fabricated)', () => {
    expect(g.effective_aperture_area_mm2.status).toBe('unavailable');
    expect(g.effective_aperture_area_mm2.value).toBeNull();
  });

  it('attaches formula records to derived results', () => {
    expect(g.effective_focal_length_mm.formula_id).toBe('optics.effective_focal_length');
    expect(res.formulas?.some((f) => f.formula_id === 'camera.image_scale')).toBe(true);
  });
});

describe('F01 sampling values', () => {
  const res = calculate(request(f01Doc(), ['sampling']));
  const s = res.results.sampling!;

  it('combines to ~5.04 arcsec base FWHM and ~1.35 px/FWHM, moderately undersampled', () => {
    expect(s.base_fwhm_arcsec.value).toBeCloseTo(5.04, 1);
    expect(s.pixels_per_fwhm.value).toBeCloseTo(1.35, 1);
    expect(s.classification.value).toBe('moderately_undersampled');
  });

  it('optical FWHM is an assumed 2.0 arcsec with low confidence', () => {
    expect(s.optical_fwhm_arcsec.value).toBe(2.0);
    expect(s.optical_fwhm_arcsec.confidence?.level).toBe('low');
    expect(res.assumptions.some((a) => a.assumption_id.startsWith('assume.optical_quality'))).toBe(
      true,
    );
  });

  it('base FWHM confidence is limited by the weakest input (the assumed optical quality)', () => {
    expect(s.base_fwhm_arcsec.confidence?.level).toBe('low');
  });
});

describe('partial and failed responses (v0.8 §21)', () => {
  it('returns partial with unavailable geometry when the aperture is missing', () => {
    const doc = f01Doc();
    doc.optics.aperture_mm = null;
    const res = calculate(request(doc, ['static_geometry']));
    expect(res.status).toBe('partial');
    expect(res.validation?.ok).toBe(false);
    expect(res.results.static_geometry?.focal_ratio.status).toBe('unavailable');
    // Independent results still computed.
    expect(res.results.static_geometry?.effective_focal_length_mm.value).toBeCloseTo(160, 6);
  });
});
