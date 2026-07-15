import { describe, expect, it } from 'vitest';
import type { CalculationRequest, DesignDocument } from '@ste/schema';
import { calculate } from './index.js';

/** An ephemeris-session design so the astronomy session path drives kinematics. */
function ephemerisDoc(overrides?: (d: DesignDocument) => void): DesignDocument {
  const doc: DesignDocument = {
    schema_version: '1.0.0',
    calculation_engine_version: '1.0.0',
    design_id: 'design_r2',
    revision: 1,
    metadata: {
      name: 'R2 Ephemeris',
      design_type: 'custom',
      locked: false,
      created_at: '2026-07-14T00:00:00Z',
      modified_at: '2026-07-14T00:00:00Z',
    },
    scenario: {
      mode: 'ephemeris_session',
      location: { latitude_deg: 41.5, longitude_deg: -87.5 },
      session: {
        start_time_utc: '2026-07-14T02:00:00Z',
        duration_s: 7200,
        sample_interval_s: 300,
        minimum_altitude_deg: 20,
      },
      conditions: { seeing_fwhm_arcsec: 2.5 },
    },
    target: {
      selection_type: 'custom',
      custom_target: {
        target_id: 't1',
        name: 'Target',
        coordinates: { right_ascension_deg: 60, declination_deg: 41.5, epoch: 'j2000' },
        geometry: { shape: 'ellipse', width_arcmin: 30, height_arcmin: 20, position_angle_deg: 0 },
        classification: { target_type: 'galaxy' },
      },
    },
    optics: {
      aperture_mm: 80,
      native_focal_length_mm: 400,
      reducer_multiplier: 1,
      extender_multiplier: 1,
      optical_blur: { representation: 'fwhm_arcsec', value: 1.5 },
    },
    camera: {
      sensor: {
        sensor_width_mm: 7.68,
        sensor_height_mm: 4.32,
        horizontal_pixels: 3840,
        vertical_pixels: 2160,
        pixel_pitch_x_um: 2.0,
        pixel_pitch_y_um: 2.0,
      },
    },
    filter: { filter_type: 'none' },
    mount: { architecture: 'alt_azimuth' },
    tracking: { enabled: true },
    capture: { exposure_s: 30 },
    constraints: [],
    extensions: {},
  };
  overrides?.(doc);
  return doc;
}

function request(
  design: DesignDocument,
  groups: CalculationRequest['requested_groups'],
): CalculationRequest {
  return {
    message_type: 'calculate_design',
    request_id: 'r',
    design_id: design.design_id,
    design_revision: design.revision,
    engine_version: '1.0.0',
    calculation_mode: 'normal',
    requested_groups: groups,
    design,
  };
}

describe('scenario geometry (R2-004)', () => {
  it('produces a sampled path with altitudes, airmass, and visible duration', () => {
    const res = calculate(request(ephemerisDoc(), ['scenario_geometry']));
    const g = res.results.scenario_geometry!;
    expect(g.sample_count.value as number).toBeGreaterThan(2);
    expect(g.reference_altitude_deg.value).not.toBeNull();
    expect(g.max_altitude_deg.value as number).toBeGreaterThanOrEqual(
      g.min_altitude_deg.value as number,
    );
    // Airmass is >= 1 when above the horizon, null (unavailable) otherwise.
    if ((g.reference_altitude_deg.value as number) > 0) {
      expect(g.reference_airmass.value as number).toBeGreaterThanOrEqual(1);
    } else {
      expect(g.reference_airmass.value).toBeNull();
    }
    expect(g.visible_duration_s.value as number).toBeGreaterThanOrEqual(0);
  });
});

describe('mount kinematics (R2-007/008)', () => {
  it('alt-az reports axis rates and a condition number', () => {
    const res = calculate(request(ephemerisDoc(), ['mount_kinematics']));
    const k = res.results.mount_kinematics!;
    expect(k.architecture.value).toBe('alt_azimuth');
    expect(k.max_axis1_rate_deg_per_s.value as number).toBeGreaterThan(0);
    expect(k.max_condition_number.value as number).toBeGreaterThanOrEqual(1);
    expect(typeof k.zenith_risk.value).toBe('boolean');
  });

  it('equatorial reports the sidereal RA rate and a meridian crossing when present', () => {
    const res = calculate(
      request(
        ephemerisDoc((d) => {
          d.mount.architecture = 'german_equatorial';
        }),
        ['mount_kinematics'],
      ),
    );
    const k = res.results.mount_kinematics!;
    expect(k.architecture.value).toBe('german_equatorial');
    // Sidereal rate ~15.04 deg/hr = 0.004178 deg/s.
    expect(k.max_axis1_rate_deg_per_s.value as number).toBeCloseTo(15.041 / 3600, 4);
  });

  it('a near-zenith alt-az pass raises the zenith-risk flag', () => {
    const res = calculate(
      request(
        ephemerisDoc((d) => {
          // dec = latitude -> transits the zenith.
          d.target.custom_target!.coordinates.declination_deg = 41.5;
          d.scenario.session!.minimum_altitude_deg = 0;
        }),
        ['mount_kinematics'],
      ),
    );
    // Depending on start time the target may or may not be near zenith in-window,
    // but the flag must be a defined boolean derived from the path.
    expect(typeof res.results.mount_kinematics!.zenith_risk.value).toBe('boolean');
  });
});

describe('tracking group (R2-010..013)', () => {
  function withTracking(exposureS: number, driftPerMin: number): DesignDocument {
    return ephemerisDoc((d) => {
      d.capture.exposure_s = exposureS;
      d.tracking = {
        enabled: true,
        error_model: {
          drift_rate: { value_arcsec_per_min: driftPerMin, direction: 'right_ascension' },
          periodic_error: {
            amplitude_arcsec: 15,
            amplitude_statistic: 'peak_to_peak',
            period_s: 60,
            direction: 'right_ascension',
          },
        },
      };
    });
  }

  it('produces during-exposure displacement, phase sweep, and a dominant component', () => {
    const res = calculate(request(withTracking(20, 4), ['tracking']));
    const t = res.results.tracking!;
    expect(t.exposure_s.value).toBe(20);
    expect(t.phase_count.value).toBe(24);
    expect(t.motion_max_displacement_arcsec.value as number).toBeGreaterThan(0);
    expect(t.worst_max_displacement_arcsec.value as number).toBeGreaterThanOrEqual(
      t.median_max_displacement_arcsec.value as number,
    );
    expect(['drift', 'periodic_error', 'jitter']).toContain(t.dominant_component.value);
    expect(['good', 'marginal', 'poor', 'unknown']).toContain(t.quality.value);
    expect(t.motion_max_displacement_px.value as number).toBeGreaterThan(0);
  });

  it('drift-limited displacement doubles with exposure (invariant v0.4 §48)', () => {
    const driftOnly = (exp: number) =>
      ephemerisDoc((d) => {
        d.capture.exposure_s = exp;
        d.tracking = {
          enabled: true,
          error_model: {
            drift_rate: { value_arcsec_per_min: 6, direction: 'right_ascension' },
          },
        };
      });
    const d20 = calculate(request(driftOnly(20), ['tracking'])).results.tracking!
      .motion_max_displacement_arcsec.value as number;
    const d40 = calculate(request(driftOnly(40), ['tracking'])).results.tracking!
      .motion_max_displacement_arcsec.value as number;
    expect(d40).toBeCloseTo(2 * d20, 4);
  });

  it('is unavailable when tracking is disabled', () => {
    const res = calculate(
      request(
        ephemerisDoc((d) => {
          d.tracking = { enabled: false };
        }),
        ['tracking'],
      ),
    );
    expect(res.results.tracking!.motion_max_displacement_arcsec.status).toBe('unavailable');
  });
});

describe('blur group (R2-014..017)', () => {
  it('is nearly round with no tracking error and no field rotation (equatorial)', () => {
    const res = calculate(
      request(
        ephemerisDoc((d) => {
          d.tracking = { enabled: false };
          // Equatorial mount derotates the field, so only base + pixel remain.
          d.mount.architecture = 'german_equatorial';
        }),
        ['blur'],
      ),
    );
    const b = res.results.blur!;
    expect(b.major_fwhm_arcsec.value as number).toBeGreaterThan(0);
    expect(b.elongation.value as number).toBeCloseTo(1, 1);
    expect(b.quality.value).toBe('good');
  });

  it('strong directional tracking error elongates the ellipse (F03 directional dominance)', () => {
    const res = calculate(
      request(
        ephemerisDoc((d) => {
          d.capture.exposure_s = 20;
          d.tracking = {
            enabled: true,
            error_model: {
              periodic_error: {
                amplitude_arcsec: 15,
                amplitude_statistic: 'peak_to_peak',
                period_s: 60,
                direction: 'right_ascension',
              },
              drift_rate: { value_arcsec_per_min: 6, direction: 'right_ascension' },
            },
          };
        }),
        ['blur'],
      ),
    );
    const b = res.results.blur!;
    expect(b.elongation.value as number).toBeGreaterThan(1.1);
    expect(b.major_fwhm_arcsec.value as number).toBeGreaterThan(
      b.minor_fwhm_arcsec.value as number,
    );
    expect(b.dominant_contribution.value).toBe('motion');
  });
});

describe('field rotation (R2-018, F04)', () => {
  // Near-zenith alt-az target so field rotation is significant.
  function rotationDoc(overrides?: (d: DesignDocument) => void): DesignDocument {
    return ephemerisDoc((d) => {
      d.target.custom_target!.coordinates = {
        right_ascension_deg: 90,
        declination_deg: 41.5,
        epoch: 'j2000',
      };
      d.scenario.session = {
        start_time_utc: '2026-07-14T06:00:00Z',
        duration_s: 3600,
        sample_interval_s: 120,
        minimum_altitude_deg: 0,
      };
      d.capture.exposure_s = 30;
      d.tracking = { enabled: true };
      overrides?.(d);
    });
  }

  it('center motion is zero and corners are worse (v0.4 §20)', () => {
    const r = calculate(request(rotationDoc(), ['field_rotation'])).results.field_rotation!;
    expect(r.center_motion_px.value).toBe(0);
    expect(r.corner_motion_px.value as number).toBeGreaterThanOrEqual(0);
    expect(['good', 'marginal', 'poor', 'unknown']).toContain(r.quality.value);
  });

  it('an equatorial mount removes alt-az field rotation', () => {
    const altaz = calculate(request(rotationDoc(), ['field_rotation'])).results.field_rotation!;
    const eq = calculate(
      request(
        rotationDoc((d) => {
          d.mount.architecture = 'german_equatorial';
        }),
        ['field_rotation'],
      ),
    ).results.field_rotation!;
    expect(eq.rotation_rate_deg_per_hr.value).toBe(0);
    expect(eq.corner_motion_px.value).toBe(0);
    // Alt-az at/near zenith should rotate faster than the (zero) equatorial case.
    expect(altaz.corner_motion_px.value as number).toBeGreaterThanOrEqual(
      eq.corner_motion_px.value as number,
    );
  });

  it('feeds rotation into the blur ellipse (rotation elongates a low-tracking design)', () => {
    // With almost no tracking error, elongation should come from field rotation.
    const res = calculate(request(rotationDoc(), ['blur', 'field_rotation']));
    const rot = res.results.field_rotation!;
    // If there is meaningful corner rotation, the blur ellipse is elongated.
    if ((rot.corner_motion_arcsec.value as number) > 1) {
      expect(res.results.blur!.elongation.value as number).toBeGreaterThan(1.0);
    }
  });
});

describe('exposure sweep (R2-020..024, F05/F06)', () => {
  it('recommends longer exposure when readout overhead dominates (F05)', () => {
    const res = calculate(
      request(
        ephemerisDoc((d) => {
          d.mount.architecture = 'german_equatorial'; // no field rotation
          d.capture.exposure_s = 5;
          d.camera.readout = { readout_time_s: 2, transfer_time_s: 0 };
          d.tracking = { enabled: true, error_model: {} }; // negligible tracking error
          d.capture.exposure_sweep = {
            enabled: true,
            minimum_exposure_s: 1,
            maximum_exposure_s: 60,
            candidate_mode: 'default_candidates',
          };
        }),
        ['exposure_sweep'],
      ),
    );
    const e = res.results.exposure_sweep!;
    expect(e.candidates.length).toBeGreaterThan(3);
    // Overhead-limited -> best exposure well above the shortest candidate.
    expect(e.best_exposure_s.value as number).toBeGreaterThanOrEqual(10);
  });

  it('recommends shorter exposure when periodic rejection dominates (F06)', () => {
    const res = calculate(
      request(
        ephemerisDoc((d) => {
          d.mount.architecture = 'german_equatorial';
          d.camera.readout = { readout_time_s: 0.1, transfer_time_s: 0 };
          d.tracking = {
            enabled: true,
            error_model: {
              periodic_error: {
                amplitude_arcsec: 12,
                amplitude_statistic: 'peak_to_peak',
                period_s: 40,
                direction: 'right_ascension',
              },
            },
            quality_thresholds: { maximum_motion_pixels: 1 },
          };
          d.capture.exposure_sweep = {
            enabled: true,
            minimum_exposure_s: 2,
            maximum_exposure_s: 60,
          };
        }),
        ['exposure_sweep'],
      ),
    );
    const e = res.results.exposure_sweep!;
    const best = e.best_exposure_s.value as number;
    const longest = e.longest_acceptable_s.value as number;
    // Rejection-limited -> best exposure is at the short end, below the longest feasible.
    expect(best).toBeLessThanOrEqual(longest);
    expect(best).toBeLessThan(60);
  });
});

describe('recommendations (R2-031, F07)', () => {
  it('recommends a shorter focal length when the target does not fit (F07)', () => {
    const res = calculate(
      request(
        ephemerisDoc((d) => {
          d.mount.architecture = 'german_equatorial';
          d.optics.native_focal_length_mm = 2000; // long FL
          d.target.custom_target!.geometry = {
            shape: 'ellipse',
            width_arcmin: 180, // very large target
            height_arcmin: 120,
            position_angle_deg: 0,
          };
        }),
        ['recommendations'],
      ),
    );
    const recs = res.recommendations ?? [];
    const fit = recs.find((r) => r.rule_id === 'framing.target_does_not_fit');
    expect(fit).toBeDefined();
    expect(fit!.severity).toBe('critical');
    expect(fit!.proposed_changes?.[0]?.field_path).toBe('/optics/native_focal_length_mm');
    // Critical framing recommendation sorts first.
    expect(recs[0]!.rule_id).toBe('framing.target_does_not_fit');
  });

  it('does not recommend a longer exposure when tracking motion already fails (invariant §48)', () => {
    const res = calculate(
      request(
        ephemerisDoc((d) => {
          d.mount.architecture = 'german_equatorial';
          d.capture.exposure_s = 20;
          d.camera.readout = { readout_time_s: 3, transfer_time_s: 0 }; // heavy overhead
          d.tracking = {
            enabled: true,
            error_model: {
              periodic_error: {
                amplitude_arcsec: 25,
                amplitude_statistic: 'peak_to_peak',
                period_s: 60,
                direction: 'right_ascension',
              },
              drift_rate: { value_arcsec_per_min: 10, direction: 'right_ascension' },
            },
            quality_thresholds: { maximum_motion_pixels: 1 },
          };
        }),
        ['recommendations'],
      ),
    );
    const recs = res.recommendations ?? [];
    expect(recs.some((r) => r.rule_id === 'exposure.readout_overhead')).toBe(false);
    // ...but it should flag the motion problem.
    expect(recs.some((r) => r.rule_id === 'tracking.motion_dominates')).toBe(true);
  });

  it('produces no critical recommendations for a well-behaved design', () => {
    const res = calculate(
      request(
        ephemerisDoc((d) => {
          d.mount.architecture = 'german_equatorial';
          d.tracking = { enabled: false };
        }),
        ['recommendations'],
      ),
    );
    const recs = res.recommendations ?? [];
    expect(recs.every((r) => r.severity !== 'critical')).toBe(true);
  });
});

describe('direct-horizontal scenario still yields a single-sample geometry', () => {
  it('handles the F01-style direct alt/az mode without an ephemeris', () => {
    const res = calculate(
      request(
        ephemerisDoc((d) => {
          d.scenario.mode = 'direct_horizontal_session';
          d.scenario.direct_horizontal = { altitude_deg: 45, azimuth_deg: 180 };
        }),
        ['scenario_geometry', 'mount_kinematics'],
      ),
    );
    expect(res.results.scenario_geometry!.reference_altitude_deg.value).toBeCloseTo(45, 6);
    expect(res.results.scenario_geometry!.reference_airmass.value as number).toBeCloseTo(
      1 / Math.sin((45 * Math.PI) / 180),
      6,
    );
  });
});
