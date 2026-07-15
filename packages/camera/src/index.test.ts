import { describe, expect, it } from 'vitest';
import { mm, raw, um } from '@ste/units';
import type { SensorInput } from '@ste/schema';
import {
  activeSensorDimensions,
  effectivePixelCounts,
  effectivePixelPitch,
  fieldOfView,
  frameSizeBytes,
  imageScale,
  resolveBinning,
  sensorFieldOfView,
} from './index.js';

// F01 sensor: 11.136 x 6.264 mm, 3840 x 2160, 2.9 um.
const F01_SENSOR: SensorInput = {
  sensor_width_mm: 11.136,
  sensor_height_mm: 6.264,
  horizontal_pixels: 3840,
  vertical_pixels: 2160,
  pixel_pitch_x_um: 2.9,
  pixel_pitch_y_um: 2.9,
  color_mode: 'color',
};

describe('image scale (F01: 2.9 um at 160 mm)', () => {
  it('is about 3.74 arcsec/px', () => {
    expect(raw(imageScale(um(2.9), mm(160)))).toBeCloseTo(3.7386, 3);
  });

  it('doubling pixel pitch doubles image scale (invariant §48)', () => {
    expect(raw(imageScale(um(5.8), mm(160)))).toBeCloseTo(2 * raw(imageScale(um(2.9), mm(160))), 9);
  });

  it('doubling focal length halves image scale (invariant §48)', () => {
    expect(raw(imageScale(um(2.9), mm(320)))).toBeCloseTo(raw(imageScale(um(2.9), mm(160))) / 2, 9);
  });
});

describe('field of view (F01)', () => {
  it('x FOV is about 3.99 deg, y FOV about 2.24 deg', () => {
    expect(raw(fieldOfView(mm(11.136), mm(160)))).toBeCloseTo(3.986, 2);
    expect(raw(fieldOfView(mm(6.264), mm(160)))).toBeCloseTo(2.243, 2);
  });

  it('larger sensor increases FOV (invariant §48)', () => {
    expect(raw(fieldOfView(mm(22), mm(160)))).toBeGreaterThan(
      raw(fieldOfView(mm(11.136), mm(160))),
    );
  });

  it('same physical size yields same FOV regardless of pixel count (invariant §48)', () => {
    const coarse: SensorInput = { ...F01_SENSOR, horizontal_pixels: 1920, pixel_pitch_x_um: 5.8 };
    const a = sensorFieldOfView(F01_SENSOR, undefined, mm(160)).fovXDeg;
    const b = sensorFieldOfView(coarse, undefined, mm(160)).fovXDeg;
    expect(a && raw(a)).toBeCloseTo((b && raw(b)) as number, 9);
  });
});

describe('binning (invariant §48)', () => {
  it('defaults each axis to 1', () => {
    expect(resolveBinning(undefined)).toEqual({ x: 1, y: 1 });
    expect(resolveBinning({ binning_x: 2 })).toEqual({ x: 2, y: 1 });
  });

  it('increases image scale and lowers resolution', () => {
    const binned = effectivePixelPitch(um(2.9), 2);
    expect(raw(imageScale(binned, mm(160)))).toBeCloseTo(2 * raw(imageScale(um(2.9), mm(160))), 9);
    const counts = effectivePixelCounts(F01_SENSOR, { binning_x: 2, binning_y: 2 });
    expect(counts.horizontal).toBe(1920);
    expect(counts.vertical).toBe(1080);
  });
});

describe('active dimensions and frame size', () => {
  it('uses the full sensor when no ROI is set', () => {
    const active = activeSensorDimensions(F01_SENSOR, undefined);
    expect(active.widthMm && raw(active.widthMm)).toBe(11.136);
  });

  it('uses the ROI span when set', () => {
    const active = activeSensorDimensions(F01_SENSOR, { roi_width: 1920, roi_height: 1080 });
    // 1920 px * 2.9 um = 5568 um = 5.568 mm
    expect(active.widthMm && raw(active.widthMm)).toBeCloseTo(5.568, 9);
  });

  it('frame size is pixels * bytes-per-pixel', () => {
    // 3840*2160 = 8_294_400 px, 16-bit -> 2 bytes -> 16_588_800 bytes
    expect(raw(frameSizeBytes(3840 * 2160, 16))).toBe(16_588_800);
  });
});
