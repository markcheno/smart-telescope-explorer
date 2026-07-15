import { describe, expect, it } from 'vitest';
import {
  JD_J2000,
  airmass,
  equatorialToHorizontal,
  greenwichMeanSiderealTimeDeg,
  hourAngleDeg,
  julianDateFromIso,
  julianDateFromUnixMillis,
  localSiderealTimeDeg,
  normalize180,
  parallacticAngleDeg,
  projectToTangentPlane,
  sessionPath,
  unwrapDegrees,
} from './index.js';

// Local sidereal time is chosen so that hour angle H = LST - RA.
// For a target at RA = 0, LST (deg) == H (deg), which makes the vector cases below exact.

describe('time (R2-001)', () => {
  it('J2000 epoch: 2000-01-01T12:00:00Z is JD 2451545.0', () => {
    const jd = julianDateFromIso('2000-01-01T12:00:00Z');
    expect(jd).not.toBeNull();
    expect(jd as number).toBeCloseTo(JD_J2000, 6);
    expect(julianDateFromUnixMillis(946_728_000_000)).toBeCloseTo(JD_J2000, 9);
  });

  it('GMST at J2000 is ~280.46 degrees', () => {
    expect(greenwichMeanSiderealTimeDeg(JD_J2000)).toBeCloseTo(280.46, 1);
  });

  it('LST adds east longitude; hour angle wraps to (-180, 180]', () => {
    expect(localSiderealTimeDeg(JD_J2000, 90)).toBeCloseTo((280.46061837 + 90) % 360, 3);
    expect(hourAngleDeg(10, 5)).toBe(normalize180(-5));
  });
});

describe('equatorial -> horizontal vectors (R2-002, R2-037)', () => {
  it('celestial pole sits due north at altitude = latitude (northern)', () => {
    const h = equatorialToHorizontal(0, 90, 40, 0);
    expect(h.altitudeDeg).toBeCloseTo(40, 6);
    expect(h.azimuthDeg).toBeCloseTo(0, 6);
  });

  it('equator on the meridian culminates due south at alt = 90 - lat (northern)', () => {
    const h = equatorialToHorizontal(0, 0, 40, 0); // RA=0, LST=0 -> H=0
    expect(h.altitudeDeg).toBeCloseTo(50, 6);
    expect(h.azimuthDeg).toBeCloseTo(180, 6);
  });

  it('a star at dec = lat culminates at the zenith', () => {
    const h = equatorialToHorizontal(0, 40, 40, 0);
    expect(h.altitudeDeg).toBeCloseTo(90, 4);
  });

  it('equator star rises due east and sets due west (lat 40, dec 0)', () => {
    const rising = equatorialToHorizontal(0, 0, 40, -90); // H = -90 (east)
    expect(rising.altitudeDeg).toBeCloseTo(0, 4);
    expect(rising.azimuthDeg).toBeCloseTo(90, 4);
    const setting = equatorialToHorizontal(0, 0, 40, 90); // H = +90 (west)
    expect(setting.altitudeDeg).toBeCloseTo(0, 4);
    expect(setting.azimuthDeg).toBeCloseTo(270, 4);
  });

  it('southern hemisphere: equator on meridian culminates due NORTH', () => {
    const h = equatorialToHorizontal(0, 0, -30, 0);
    expect(h.altitudeDeg).toBeCloseTo(60, 6);
    expect(h.azimuthDeg).toBeCloseTo(0, 6);
  });

  it('a star west of the meridian has azimuth in the western half (>180, northern)', () => {
    const h = equatorialToHorizontal(0, 0, 40, 30); // H = +30 (west)
    expect(h.azimuthDeg).toBeGreaterThan(180);
    expect(h.azimuthDeg).toBeLessThan(270);
  });
});

describe('airmass (R2-003)', () => {
  it('is 1 at the zenith, 2 at 30 degrees, null below the horizon', () => {
    expect(airmass(90)).toBeCloseTo(1, 9);
    expect(airmass(30)).toBeCloseTo(2, 9);
    expect(airmass(0)).toBeNull();
    expect(airmass(-5)).toBeNull();
  });
});

describe('parallactic angle & unwrap (R2-006)', () => {
  it('is zero on the meridian and flips sign east vs west', () => {
    expect(parallacticAngleDeg(0, 10, 40)).toBeCloseTo(0, 9);
    const west = parallacticAngleDeg(30, 10, 40);
    const east = parallacticAngleDeg(-30, 10, 40);
    expect(west).toBeGreaterThan(0);
    expect(east).toBeLessThan(0);
    expect(west).toBeCloseTo(-east, 6);
  });

  it('unwraps a wrapping series', () => {
    expect(unwrapDegrees([350, 10, 20, 5])).toEqual([350, 370, 380, 365]);
  });
});

describe('tangent-plane projection (R2-005)', () => {
  it('maps the centre to the origin', () => {
    const p = projectToTangentPlane(45, 180, 45, 180);
    expect(p).not.toBeNull();
    expect(p!.xRad).toBeCloseTo(0, 12);
    expect(p!.yRad).toBeCloseTo(0, 12);
  });

  it('+x is increasing azimuth, +y is increasing altitude', () => {
    const east = projectToTangentPlane(45, 181, 45, 180)!;
    expect(east.xRad).toBeGreaterThan(0);
    expect(Math.abs(east.yRad)).toBeLessThan(Math.abs(east.xRad));
    const up = projectToTangentPlane(46, 180, 45, 180)!;
    expect(up.yRad).toBeGreaterThan(0);
    expect(Math.abs(up.xRad)).toBeLessThan(1e-9);
  });

  it('rejects points more than 90 degrees away', () => {
    expect(projectToTangentPlane(45, 0, 45, 180)).toBeNull();
  });
});

describe('session path (R2-004, R2-037 midnight crossing)', () => {
  it('samples altitude/airmass/visibility across a session and caps sample count', () => {
    const samples = sessionPath({
      startUnixMillis: Date.parse('2026-07-14T03:00:00Z'),
      durationS: 3600,
      sampleIntervalS: 60,
      latitudeDeg: 41.5,
      longitudeEastDeg: -87.5,
      rightAscensionDeg: 10.68, // Andromeda
      declinationDeg: 41.27,
      minimumAltitudeDeg: 20,
    });
    expect(samples.length).toBeGreaterThan(2);
    expect(samples[0]!.timeOffsetS).toBe(0);
    for (const s of samples) {
      if (s.altitudeDeg > 0) expect(s.airmass).not.toBeNull();
      expect(s.visible).toBe(s.altitudeDeg >= 20);
    }
  });

  it('a circumpolar target (dec > 90 - lat) never drops below the pole altitude', () => {
    const samples = sessionPath({
      startUnixMillis: Date.parse('2026-07-14T00:00:00Z'),
      durationS: 12 * 3600,
      sampleIntervalS: 600,
      latitudeDeg: 60,
      longitudeEastDeg: 0,
      rightAscensionDeg: 0,
      declinationDeg: 80, // 80 > 90 - 60 = 30, circumpolar
      minimumAltitudeDeg: 20,
    });
    for (const s of samples) expect(s.altitudeDeg).toBeGreaterThan(20);
  });
});
