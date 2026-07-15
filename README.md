# Smart Telescope Explorer

An engineering estimator for DIY smart-telescope designs. Enter a target,
scenario, optics, camera, mount, and tracking, and it computes framing,
sampling, tracking blur, field rotation, an exposure recommendation, and
prioritised design recommendations — every result carrying its unit,
confidence, dependencies, and formula, and never fabricating a number for an
unknown input.

Implements the specification in [`docs/specifications/`](docs/specifications/)
(v0.1–v0.9). Architecture decisions are in
[`docs/architecture-decisions/`](docs/architecture-decisions/).

## Status

- **R0 — engineering kernel** ✅ Canonical units, v1 schema, validation, static
  optics/sensor/framing/sampling, deterministic engine, F01/F02 fixtures.
- **R1 — optical design explorer** ✅ React web app: framing, image scale, and
  sampling from a live design, with local save and JSON import/export.
- **R2 — feasibility calculator** ✅ Astronomy + alt-az/equatorial kinematics,
  tracking motion, blur covariance, field rotation, exposure sweep, and a
  simplified recommendation engine, with Tracking/Blur/Rotation/Exposure views.
  Fixtures **F01–F07 pass in CI**.

The Web Worker (off-main-thread calculation) and the R3 stack/noise model are
not yet built; the exposure "fixed-session performance" is explicitly
preliminary until R3.

## Layout

A pnpm-workspace monorepo. Packages follow the dependency direction
`schema → units → validation → domain → engine-core → app-state → UI`
(circular dependencies fail CI).

```
packages/
  units          branded quantities + conversions (only home of physical constants)
  schema         v1 JSON design + calculation-API types (zero deps)
  validation     document + cross-field validation → structured issues
  optics camera targets           static-geometry / framing domain math
  astronomy kinematics            time, coordinates, mount axis motion
  tracking blur exposure          during-exposure motion, blur ellipse, sweeps
  engine-core    coordinator that assembles result groups + recommendations
  test-fixtures  canonical designs F01–F07 + expected values
apps/
  web            React + Vite explorer (app-owned CSS, custom SVG)
  engine-harness CLI to run the engine over a fixture or JSON design
```

## Prerequisites

- Node ≥ 20
- pnpm 11 (`corepack enable`)
- [`just`](https://github.com/casey/just) (optional — every recipe maps to a
  `pnpm` command)

## Common commands

| Task               | just               | pnpm                                                      |
| ------------------ | ------------------ | --------------------------------------------------------- |
| Install            | `just install`     | `pnpm install`                                            |
| Web dev server     | `just dev`         | `pnpm --filter @ste/web dev`                              |
| Build all          | `just build`       | `pnpm build && pnpm --filter @ste/web build`              |
| Type-check         | `just typecheck`   | `pnpm typecheck`                                          |
| Lint               | `just lint`        | `pnpm lint`                                               |
| Circular-dep check | `just cycles`      | `pnpm cycles`                                             |
| Test               | `just test`        | `pnpm test`                                               |
| Format             | `just fmt`         | `pnpm format`                                             |
| Full CI gate       | `just check`       | `pnpm typecheck && pnpm lint && pnpm cycles && pnpm test` |
| Run a fixture      | `just harness F03` | `pnpm harness F03 --formulas`                             |

## Running it

Web explorer:

```sh
pnpm install
pnpm --filter @ste/web dev      # http://localhost:5173
```

Engine harness (prints results, issues, assumptions, and formula traces):

```sh
pnpm harness F01 --formulas
pnpm harness F04 --groups field_rotation,blur
pnpm harness --file my-design.json
```

## CI

`.github/workflows/ci.yml` runs on every push and pull request:
`pnpm install --frozen-lockfile`, then `typecheck`, `lint`, `cycles`, `test`.
The engine is pure and deterministic — identical inputs produce identical
results — so fixtures F01–F07 are the regression backbone.
