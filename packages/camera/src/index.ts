/**
 * @ste/camera — sensor geometry, image scale, field of view, frame size
 * (spec v0.4 §9, §48).
 *
 * Pure functions over branded quantities. Image scale and FOV use the SAME
 * arcsec/radian and mm/µm conversions as the rest of the engine (via
 * `@ste/units`); no ad-hoc 206.265 literal appears here. FOV depends on physical
 * sensor size and focal length only — never on pixel count or binning
 * (invariant v0.4 §48).
 */

import {
  bytes,
  mm,
  radToDeg,
  rad,
  radToArcsec,
  um,
  umToMm,
  type Arcseconds,
  type Bytes,
  type Degrees,
  type Micrometers,
  type Millimeters,
} from '@ste/units';
import type { CameraOperatingMode, SensorInput } from '@ste/schema';

// --- binning & effective geometry ----------------------------------------

/** Resolve binning factors, defaulting each axis to 1 when unset (spec v0.4 §9). */
export function resolveBinning(mode: CameraOperatingMode | undefined): { x: number; y: number } {
  const x = mode?.binning_x;
  const y = mode?.binning_y;
  return {
    x: x != null && x >= 1 ? x : 1,
    y: y != null && y >= 1 ? y : 1,
  };
}

/** Effective pixel pitch after binning: pitch × binning (spec v0.4 §48). */
export function effectivePixelPitch(pitchUm: Micrometers, binning: number): Micrometers {
  return um((pitchUm as number) * binning);
}

/**
 * Effective (post-binning, post-ROI) pixel counts. ROI width/height are in
 * unbinned pixels; when absent the full sensor is used.
 */
export function effectivePixelCounts(
  sensor: SensorInput,
  mode: CameraOperatingMode | undefined,
): { horizontal: number | null; vertical: number | null; total: number | null } {
  const binning = resolveBinning(mode);
  const baseH = mode?.roi_width ?? sensor.horizontal_pixels;
  const baseV = mode?.roi_height ?? sensor.vertical_pixels;
  const horizontal = baseH == null ? null : Math.floor(baseH / binning.x);
  const vertical = baseV == null ? null : Math.floor(baseV / binning.y);
  const total = horizontal == null || vertical == null ? null : horizontal * vertical;
  return { horizontal, vertical, total };
}

/**
 * Active imaging dimensions in mm. With an ROI set, the dimension is the ROI
 * pixel span times the (unbinned) pixel pitch; otherwise the full physical
 * sensor dimension.
 */
export function activeSensorDimensions(
  sensor: SensorInput,
  mode: CameraOperatingMode | undefined,
): { widthMm: Millimeters | null; heightMm: Millimeters | null } {
  const widthMm =
    mode?.roi_width != null && sensor.pixel_pitch_x_um != null
      ? umToMm(um(mode.roi_width * sensor.pixel_pitch_x_um))
      : sensor.sensor_width_mm == null
        ? null
        : mm(sensor.sensor_width_mm);
  const heightMm =
    mode?.roi_height != null && sensor.pixel_pitch_y_um != null
      ? umToMm(um(mode.roi_height * sensor.pixel_pitch_y_um))
      : sensor.sensor_height_mm == null
        ? null
        : mm(sensor.sensor_height_mm);
  return { widthMm, heightMm };
}

// --- image scale & FOV ----------------------------------------------------

/**
 * Image scale (arcsec per pixel): s = pitch / f as a small angle
 * (spec v0.4 §9: s = 206.265 · p_µm / f_mm). Pass the EFFECTIVE (binned) pitch
 * to reflect binning.
 */
export function imageScale(effectivePitchUm: Micrometers, focalLengthMm: Millimeters): Arcseconds {
  const pitchMm = umToMm(effectivePitchUm) as number;
  return radToArcsec(rad(pitchMm / (focalLengthMm as number)));
}

/**
 * Exact field of view along one axis: FOV = 2·arctan(dimension / 2f)
 * (spec v0.4 §9). Uses the physical (or active) sensor dimension.
 */
export function fieldOfView(sensorDimMm: Millimeters, focalLengthMm: Millimeters): Degrees {
  const halfAngle = Math.atan((sensorDimMm as number) / (2 * (focalLengthMm as number)));
  return radToDeg(rad(2 * halfAngle));
}

// --- frame size -----------------------------------------------------------

/** Default stored bit depth when a sensor/readout doesn't specify one. */
export const DEFAULT_STORED_BIT_DEPTH = 16;

/** Frame size in bytes: N_pixels × storedBits / 8 (spec v0.4 §9). */
export function frameSizeBytes(totalPixels: number, storedBitDepth: number): Bytes {
  return bytes(totalPixels * (storedBitDepth / 8));
}

/** Convenience: full effective FOV for a sensor + focal length. */
export function sensorFieldOfView(
  sensor: SensorInput,
  mode: CameraOperatingMode | undefined,
  focalLengthMm: Millimeters,
): { fovXDeg: Degrees | null; fovYDeg: Degrees | null } {
  const active = activeSensorDimensions(sensor, mode);
  return {
    fovXDeg: active.widthMm == null ? null : fieldOfView(active.widthMm, focalLengthMm),
    fovYDeg: active.heightMm == null ? null : fieldOfView(active.heightMm, focalLengthMm),
  };
}
