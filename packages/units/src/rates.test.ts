import { describe, expect, it } from 'vitest';
import {
  SIDEREAL_RATE_ARCSEC_PER_SEC,
  arcsecPerMin,
  arcsecPerSec,
  arcsecPerSecToArcsecPerMin,
  arcsecPerMinToArcsecPerSec,
  arcsecToRad,
  degPerHour,
  degPerHourToArcsecPerSec,
  degPerSec,
  degPerSecToArcsecPerSec,
  degPerSecToRadPerSec,
  frequencyToPeriod,
  fwhmToSigma,
  hertz,
  periodToFrequency,
  radPerSec,
  radPerSecToArcsecPerSec,
  raw,
  seconds,
  sigmaToFwhm,
  arcsec,
} from './index.js';

describe('angular-rate conversions', () => {
  it('1 deg/hr equals 1 arcsec/s', () => {
    expect(raw(degPerHourToArcsecPerSec(degPerHour(1)))).toBeCloseTo(1, 12);
  });

  it('arcsec/min <-> arcsec/s scales by 60', () => {
    expect(raw(arcsecPerMinToArcsecPerSec(arcsecPerMin(60)))).toBeCloseTo(1, 12);
    expect(raw(arcsecPerSecToArcsecPerMin(arcsecPerSec(1)))).toBeCloseTo(60, 12);
  });

  it('deg/s converts to arcsec/s by 3600', () => {
    expect(raw(degPerSecToArcsecPerSec(degPerSec(1)))).toBeCloseTo(3600, 9);
  });

  it('rad/s round-trips through arcsec/s consistently with deg/s', () => {
    const viaRad = raw(radPerSecToArcsecPerSec(degPerSecToRadPerSec(degPerSec(1))));
    expect(viaRad).toBeCloseTo(3600, 6);
  });

  it('sidereal rate is ~15.04 arcsec/s and matches 15.041 deg/hr in arcsec/s', () => {
    expect(SIDEREAL_RATE_ARCSEC_PER_SEC).toBeCloseTo(15.041, 3);
  });
});

describe('period <-> frequency', () => {
  it('round-trips a 60 s period', () => {
    const f = periodToFrequency(seconds(60));
    expect(raw(f)).toBeCloseTo(1 / 60, 12);
    expect(raw(frequencyToPeriod(hertz(raw(f))))).toBeCloseTo(60, 9);
  });
});

describe('FWHM <-> sigma', () => {
  it('round-trips and matches the 2.3548 factor', () => {
    expect(raw(sigmaToFwhm(fwhmToSigma(arcsec(5))))).toBeCloseTo(5, 12);
    expect(raw(fwhmToSigma(arcsec(2.3548)))).toBeCloseTo(1, 3);
  });
});

describe('rate sanity vs existing angle conversions', () => {
  it('radPerSec->arcsecPerSec agrees with arcsec<->rad', () => {
    // 1 rad/s should be arcsecToRad^-1(1 rad) worth of arcsec per second.
    const asPerSec = raw(radPerSecToArcsecPerSec(radPerSec(1)));
    expect(raw(arcsecToRad(arcsec(asPerSec)))).toBeCloseTo(1, 9);
  });
});
