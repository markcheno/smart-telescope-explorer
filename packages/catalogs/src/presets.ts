/**
 * @ste/catalogs — component presets (spec v0.7 §26).
 *
 * P0 sensor and optic presets so a builder can start from a known part instead
 * of typing dimensions. Sensor records are published die/pixel geometry; the
 * "generic" entries are nominal format sizes. Optic presets are aperture +
 * focal-length pairs (the common DIY smart-scope objective sizes). Presets
 * define GEOMETRY only — not QE, read noise, or optical quality, which stay the
 * user's to set (spec §26: "generic presets define resolution, not accuracy").
 */

import type { SensorInput } from '@ste/schema';

export interface SensorPreset {
  id: string;
  label: string;
  sensor: SensorInput;
}

function sensor(w: number, h: number, px: number, py: number, pitch: number): SensorInput {
  return {
    sensor_width_mm: w,
    sensor_height_mm: h,
    horizontal_pixels: px,
    vertical_pixels: py,
    pixel_pitch_x_um: pitch,
    pixel_pitch_y_um: pitch,
    color_mode: 'color',
  };
}

/** P0 sensors (spec §26). Dimensions are published die geometry. */
export const SENSOR_PRESETS: readonly SensorPreset[] = [
  {
    id: 'imx585',
    label: 'Sony IMX585 (3840×2160, 2.9 µm)',
    sensor: sensor(11.136, 6.264, 3840, 2160, 2.9),
  },
  {
    id: 'imx678',
    label: 'Sony IMX678 (3840×2160, 2.0 µm)',
    sensor: sensor(7.68, 4.32, 3840, 2160, 2.0),
  },
  {
    id: 'imx662',
    label: 'Sony IMX662 (1920×1080, 2.9 µm)',
    sensor: sensor(5.568, 3.132, 1920, 1080, 2.9),
  },
  {
    id: 'generic_1_1p2',
    label: 'Generic 1/1.2″ (2.9 µm)',
    sensor: sensor(11.136, 6.264, 3840, 2160, 2.9),
  },
  {
    id: 'generic_1_1p8',
    label: 'Generic 1/1.8″ (2.0 µm)',
    sensor: sensor(7.68, 4.32, 3840, 2160, 2.0),
  },
  {
    id: 'generic_1_2p8',
    label: 'Generic 1/2.8″ (2.9 µm)',
    sensor: sensor(5.568, 3.132, 1920, 1080, 2.9),
  },
];

/** Match a sensor to a preset by resolution + pixel pitch; 'custom' if none. */
export function matchSensorPreset(s: SensorInput): string {
  const found = SENSOR_PRESETS.find(
    (p) =>
      p.sensor.horizontal_pixels === s.horizontal_pixels &&
      p.sensor.pixel_pitch_x_um === s.pixel_pitch_x_um,
  );
  return found?.id ?? 'custom';
}

export interface OpticPreset {
  id: string;
  label: string;
  aperture_mm: number;
  focal_length_mm: number;
}

/** P0 objective presets — aperture + focal length (spec §26). */
export const OPTIC_PRESETS: readonly OpticPreset[] = [
  { id: 'apo_30_f4', label: '30 mm f/4 (120 mm)', aperture_mm: 30, focal_length_mm: 120 },
  { id: 'apo_30_f5', label: '30 mm f/5 (150 mm)', aperture_mm: 30, focal_length_mm: 150 },
  { id: 'apo_35_f43', label: '35 mm f/4.3 (150 mm)', aperture_mm: 35, focal_length_mm: 150 },
  { id: 'apo_40_f4', label: '40 mm f/4 (160 mm)', aperture_mm: 40, focal_length_mm: 160 },
  { id: 'apo_50_f4', label: '50 mm f/4 (200 mm)', aperture_mm: 50, focal_length_mm: 200 },
  { id: 'apo_50_f5', label: '50 mm f/5 (250 mm)', aperture_mm: 50, focal_length_mm: 250 },
  { id: 'apo_60_f4', label: '60 mm f/4 (240 mm)', aperture_mm: 60, focal_length_mm: 240 },
  { id: 'apo_60_f5', label: '60 mm f/5 (300 mm)', aperture_mm: 60, focal_length_mm: 300 },
  { id: 'apo_60_f6', label: '60 mm f/6 (360 mm)', aperture_mm: 60, focal_length_mm: 360 },
  {
    id: 'mak_90',
    label: '90 mm f/13.9 Maksutov (1250 mm)',
    aperture_mm: 90,
    focal_length_mm: 1250,
  },
];

/** Match optics to a preset by aperture + native focal length; 'custom' if none. */
export function matchOpticPreset(apertureMm: number | null, focalMm: number | null): string {
  if (apertureMm == null || focalMm == null) return 'custom';
  const found = OPTIC_PRESETS.find(
    (p) => p.aperture_mm === apertureMm && p.focal_length_mm === focalMm,
  );
  return found?.id ?? 'custom';
}
