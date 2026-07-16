import { describe, expect, it } from 'vitest';
import { averagePower, runtimeSeconds, usableEnergy } from './index.js';

describe('power (v0.4 §33)', () => {
  it('duty-weights loads into an average power', () => {
    // 5 W always on + 10 W at 50% duty = 5 + 5 = 10 W.
    expect(averagePower([{ power_w: 5 }, { power_w: 10, duty_fraction: 0.5 }])).toBe(10);
  });

  it('ignores negative or non-finite loads', () => {
    expect(averagePower([{ power_w: -3 }, { power_w: 4 }])).toBe(4);
  });

  it('derates nominal energy by DOD, efficiency, temp, and aging', () => {
    // 100 Wh · 0.8 · 0.9 · 1 · 1 = 72 Wh.
    expect(usableEnergy(100, {})).toBeCloseTo(72, 6);
    // Explicit derates multiply through: 100 · 0.5 · 1 · 0.9 · 0.8 = 36.
    expect(
      usableEnergy(100, {
        depth_of_discharge_fraction: 0.5,
        conversion_efficiency_fraction: 1,
        temperature_derate_fraction: 0.9,
        aging_derate_fraction: 0.8,
      }),
    ).toBeCloseTo(36, 6);
  });

  it('computes runtime in seconds and guards zero draw', () => {
    // 72 Wh / 12 W = 6 h = 21600 s.
    expect(runtimeSeconds(72, 12)).toBeCloseTo(21600, 3);
    expect(runtimeSeconds(72, 0)).toBeNull();
  });
});
