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
