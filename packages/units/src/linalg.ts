/**
 * @ste/units/linalg — small 2D vector and symmetric-2×2 covariance utilities.
 *
 * The building blocks for R2 blur and field-rotation math (spec v0.4 §19): star
 * paths are sequences of {@link Vec2} positions in the tangent plane; motion,
 * pixel, and rotation blur are symmetric 2×2 covariance matrices ({@link Mat2})
 * summed and eigen-decomposed into a blur ellipse. Values are plain numbers in a
 * caller-chosen consistent unit (arcseconds throughout the blur pipeline).
 */

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export const vec2 = (x: number, y: number): Vec2 => ({ x, y });

export const add2 = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub2 = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale2 = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });
export const dot2 = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const mag2 = (a: Vec2): number => Math.hypot(a.x, a.y);

/** Rotate a vector counter-clockwise by `angleRad`. */
export const rotate2 = (a: Vec2, angleRad: number): Vec2 => {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
};

/** Arithmetic mean of a non-empty list of points. */
export const mean2 = (points: readonly Vec2[]): Vec2 => {
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  const n = points.length || 1;
  return { x: sx / n, y: sy / n };
};

/**
 * Symmetric 2×2 matrix, stored by its three independent entries
 * (`xx`, `xy`, `yy`). Used only for covariances, which are symmetric.
 */
export interface Mat2 {
  readonly xx: number;
  readonly xy: number;
  readonly yy: number;
}

export const mat2 = (xx: number, xy: number, yy: number): Mat2 => ({ xx, xy, yy });
export const MAT2_ZERO: Mat2 = { xx: 0, xy: 0, yy: 0 };

export const matAdd2 = (a: Mat2, b: Mat2): Mat2 => ({
  xx: a.xx + b.xx,
  xy: a.xy + b.xy,
  yy: a.yy + b.yy,
});

export const matScale2 = (a: Mat2, k: number): Mat2 => ({
  xx: a.xx * k,
  xy: a.xy * k,
  yy: a.yy * k,
});

/** Sum a list of covariance matrices (e.g. base + motion + rotation + pixel). */
export const matSum2 = (mats: readonly Mat2[]): Mat2 => mats.reduce(matAdd2, MAT2_ZERO);

/**
 * Population covariance (1/n) of a point set about its mean (spec v0.4 §19:
 * C = (1/n) Σ (rᵢ − r̄)(rᵢ − r̄)ᵀ). Returns the zero matrix for fewer than two
 * points (no spread).
 */
export const covarianceOf = (points: readonly Vec2[]): Mat2 => {
  if (points.length < 2) return MAT2_ZERO;
  const m = mean2(points);
  let xx = 0;
  let xy = 0;
  let yy = 0;
  for (const p of points) {
    const dx = p.x - m.x;
    const dy = p.y - m.y;
    xx += dx * dx;
    xy += dx * dy;
    yy += dy * dy;
  }
  const n = points.length;
  return { xx: xx / n, xy: xy / n, yy: yy / n };
};

export interface Eigen2 {
  /** Larger eigenvalue (major-axis variance), clamped to ≥ 0. */
  readonly major: number;
  /** Smaller eigenvalue (minor-axis variance), clamped to ≥ 0. */
  readonly minor: number;
  /** Orientation of the major axis, radians in (−π/2, π/2]. */
  readonly angleRad: number;
}

/**
 * Eigen-decomposition of a symmetric 2×2 covariance matrix, closed form.
 * Eigenvalues are the variances along the principal axes; `angleRad` is the
 * major-axis orientation. Handles the degenerate isotropic case (angle 0)
 * without producing NaN.
 */
export const eigen2 = (m: Mat2): Eigen2 => {
  const halfTrace = (m.xx + m.yy) / 2;
  const halfDiff = (m.xx - m.yy) / 2;
  const disc = Math.sqrt(halfDiff * halfDiff + m.xy * m.xy);
  const major = Math.max(halfTrace + disc, 0);
  const minor = Math.max(halfTrace - disc, 0);
  // Isotropic (or zero) covariance has no defined orientation → angle 0.
  const angleRad = disc < 1e-12 ? 0 : 0.5 * Math.atan2(2 * m.xy, m.xx - m.yy);
  return { major, minor, angleRad };
};
