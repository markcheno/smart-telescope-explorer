# DIY Smart Telescope Design Explorer
## Low-Fidelity Wireframes and R0–R2 Repository Backlog v0.9

## 1. Purpose

This specification defines the final pre-code structure for the first three releases:

- **R0 — Engineering kernel**
- **R1 — Optical design explorer**
- **R2 — Smart-telescope feasibility calculator**

It includes:

- Desktop workspace wireframes
- Laptop and tablet adaptations
- Core panel behavior
- Analysis-view wireframes
- Modal and drawer layouts
- Repository and package organization
- Package dependency rules
- Issue-level implementation backlog
- Story dependencies
- Release sequencing
- Testing requirements
- Completion gates

## 2. R0–R2 functional boundary

### R0: Engineering kernel

- Canonical quantities
- Version 1 schema
- Validation
- Static optics and sensor calculations
- Target framing
- Sampling
- Astronomy primitives
- Test fixtures
- Deterministic APIs
- Minimal development harness

### R1: Optical design explorer

- Create/name design
- Select target
- Enter scenario
- Select/enter optics and camera
- View framing
- View image scale/sampling
- Local save
- JSON import/export

### R2: Smart-telescope feasibility calculator

- Alt-az and equatorial geometry
- Basic tracking-error inputs
- During-exposure motion
- Field rotation
- Blur covariance
- Exposure sweeps
- Recommended exposure range
- Tracking/rotation analysis

## 3. Desktop workspace wireframe

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Smart Telescope Explorer   Design: 30 mm Prototype        Saved      Basic ▾ │
│ New  Open  Duplicate  Save  Compare  Sweep  Report                  Help  ⋮  │
├──────────────────────┬─────────────────────────────────┬─────────────────────┤
│ INPUTS               │ ANALYSIS                        │ RESULTS             │
│ ▾ Scenario       ✓   │ Overview Framing Sampling       │ DESIGN STATUS       │
│ ▸ Target         ✓   │ Tracking Rotation Exposure      │ Uses assumptions    │
│ ▾ Optics         !   │                                 │ TARGET FIT Good     │
│ ▸ Camera         ✓   │ Primary visualization           │ IMAGE SCALE         │
│ ▸ Filter         —   │                                 │ 3.74 arcsec/px      │
│ ▸ Mount          !   │                                 │ FIELD OF VIEW       │
│ ▸ Tracking       !   │                                 │ 3.99° × 2.24°       │
│ ▸ Capture        ✓   │                                 │ FINAL BLUR unknown  │
│ ▸ Constraints    —   │                                 │ RECOMMENDATION      │
├──────────────────────┴─────────────────────────────────┴─────────────────────┤
│ COMPARISON TRAY   0 pinned designs                              Open compare │
└──────────────────────────────────────────────────────────────────────────────┘
```

Suggested widths:

- Left 300–340 px
- Right 280–320 px
- Center flexible
- Comparison tray 44–56 px collapsed

Panel sizes persist as UI preferences, not design data.

## 4. Application bar

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◉ Smart Telescope Explorer                                                   │
│ 30 mm Prototype ▾   ● Saved     New Open Duplicate Save Compare Sweep Report │
│                         Fast ▾ Basic ◉━━○ Advanced Units ▾ Help ⋮            │
└──────────────────────────────────────────────────────────────────────────────┘
```

Design states:

- Locked reference
- Saved
- Unsaved
- Imported unsaved
- Calculating
- Invalid

At narrower widths, collapse Report, Sweep, Compare, Duplicate, and Open before New/Save.

## 5. Input navigator

```text
┌────────────────────────────────┐
│ INPUTS                         │
│ Search parameters…             │
├────────────────────────────────┤
│ ▾ Scenario                  ✓  │
│   Location [Schererville]      │
│   Date [Jul 13, 2026]          │
│   Start [10:00 PM] [60 min]    │
│   Seeing [Average: 2.5″]       │
│   Sky [Bright suburban]        │
│   Advanced conditions ▸        │
├────────────────────────────────┤
│ ▸ Target                    ✓  │
│ ▸ Optics                   !2  │
│ ▸ Camera                    ✓  │
│ ▸ Filter                    —  │
│ ▸ Mount                     !1 │
│ ▸ Tracking                  !2 │
│ ▸ Capture                   ✓  │
│ ▸ Constraints               —  │
└────────────────────────────────┘
```

Indicators:

- `✓` complete
- `!` warning
- `×` invalid
- `—` optional/unconfigured
- `A` assumption-based
- `M` measured

Each section supports reset, restore preset, assumptions, affected results, advanced expansion, and collapse.

Field example:

```text
Focal length                                      ?
[ 160.0                 ] [ mm ▾ ]
Published · High confidence                 Reset ↶
Source details ▸
```

Invalid values are preserved and explained.

## 6. Results rail

Cards:

- Design status
- Target fit
- Image scale
- FOV
- Base/final blur
- Exposure
- Assumptions
- Top recommendation

Expanded cards show formula, inputs, confidence, interpretation, comparison, and navigation.

## 7. Overview view

Contains:

- Target-framing thumbnail
- Design-balance summary
- Primary limitation
- Key values
- Next action

Unavailable metrics are not fabricated.

## 8. Framing view

```text
┌─────────────────────────────────────────────────────────────────────┐
│ FRAMING             Start ○ Mid ● End ○     Show image circle ☑    │
├─────────────────────────────────────────────────────────────────────┤
│                  ╭────────────────╮                                 │
│              ┌───┼────────────────┼───┐ SENSOR                      │
│              │   │   ╭──────────╮ │   │                             │
│              │   │   │ TARGET   │ │   │                             │
│              │   │   ╰──────────╯ │   │                             │
│              └───┼────────────────┼───┘                             │
│                  ╰────────────────╯                                 │
├─────────────────────────────────────────────────────────────────────┤
│ Target fit: Good · Minimum margin: 9%                               │
│ [Center] [Rotate camera] [Pixel grid]                               │
└─────────────────────────────────────────────────────────────────────┘
```

R1 requires sensor, target, core/halo, position angle, image circle, zoom, and text summary.

Rotation/dither/crop arrive later.

## 9. Sampling view

```text
┌─────────────────────────────────────────────────────────────────────┐
│ SAMPLING                         Center field ▾ Arcsec ○ Pixels ●   │
├────────────────────────────────┬────────────────────────────────────┤
│ Pixel-grid star profile        │ Seeing          2.50″              │
│                                │ Diffraction      3.89″             │
│                                │ Optical quality  2.00″ assumed     │
│                                │ Combined base    5.02″             │
│                                │ Image scale      3.74″/px          │
│                                │ Pixels/FWHM      1.34              │
│                                │ MODERATELY UNDERSAMPLED            │
└────────────────────────────────┴────────────────────────────────────┘
```

The star is diagnostic, not photorealistic.

## 10. R2 Tracking view

```text
┌─────────────────────────────────────────────────────────────────────┐
│ TRACKING       Exposure [15 s] Result: 95th percentile ▾           │
├────────────────────────────────┬────────────────────────────────────┤
│ STAR PATH                      │ Max displacement   0.92 px         │
│                                │ RMS displacement   0.31 px         │
│                                │ Motion FWHM        0.54 px         │
│                                │ Elongation         1.16            │
│                                │ Dominant: periodic error           │
├────────────────────────────────┴────────────────────────────────────┤
│ X/Y ERROR OVER TIME                                                │
├─────────────────────────────────────────────────────────────────────┤
│ Correctable between frames: accumulated pointing offset            │
│ Not correctable: motion recorded during exposure                   │
└─────────────────────────────────────────────────────────────────────┘
```

Controls:

- Exposure
- Median/95th/worst
- Arcseconds/pixels
- Combined/components
- Drift/periodic/vibration/rotation overlays
- Retain path samples

## 11. R2 Field Rotation view

```text
┌─────────────────────────────────────────────────────────────────────┐
│ FIELD ROTATION        Exposure [20 s] Time [11:30 PM]              │
├────────────────────────────────┬────────────────────────────────────┤
│ Corner vectors around sensor   │ Rotation during frame 0.036°      │
│ Center point has zero motion   │ Center 0.00 px · Corner 0.82 px   │
│                                │ Limit now 24 s · Session min 11 s  │
├────────────────────────────────┴────────────────────────────────────┤
│ EXPOSURE LIMIT OVER SESSION                                        │
│ Drops sharply near zenith                                          │
├─────────────────────────────────────────────────────────────────────┤
│ [Schedule earlier] [Schedule later] [Compare equatorial]            │
└─────────────────────────────────────────────────────────────────────┘
```

## 12. R2 Blur view

Contributions:

- Seeing
- Diffraction
- Optical quality
- Tracking
- Rotation
- Pixel response

Show:

- Values in arcsec/pixels
- Confidence
- Final ellipse
- Major/minor FWHM
- Elongation
- Dominant source

Selecting a contribution locates the related input.

## 13. R2 Exposure view

```text
┌─────────────────────────────────────────────────────────────────────┐
│ EXPOSURE ANALYSIS       Metric: Fixed-session performance ▾        │
├─────────────────────────────────────────────────────────────────────┤
│ Performance curve with recommended 8–14 s band                     │
├─────────────────────────────────────────────────────────────────────┤
│ Exposure │ Acceptance │ Motion │ Rotation │ Duty │ Relative result │
│ 5 s      │ 96%        │ 0.3 px │ 0.2 px   │ 71%  │ 0.88            │
│ 10 s     │ 92%        │ 0.6 px │ 0.4 px   │ 83%  │ 1.00            │
│ 15 s     │ 84%        │ 0.9 px │ 0.6 px   │ 88%  │ 0.99            │
│ 20 s     │ 68%        │ 1.3 px │ 0.8 px   │ 91%  │ 0.87            │
├─────────────────────────────────────────────────────────────────────┤
│ Shorter: overhead matters. Longer: rejection rises.                 │
│ [Apply 10 s] [Preview 12 s] [Add constraint]                       │
└─────────────────────────────────────────────────────────────────────┘
```

R2 fixed-session performance is explicitly preliminary until the R3 stack/noise model.

## 14. New-design dialog

Options:

- Guided
- Blank
- Commercial reference
- Generic 30/35/50 mm starting points

R1 may ship blank/generic first.

## 15. Target browser

Two-pane layout:

- Search/filter result list
- Preview, fit, visibility, spectral class, select action

Search names/IDs; filter type, size, spectrum, and fit.

## 16. Assumptions drawer

Lists assumption, confidence, affected calculations, and edit action.

Examples:

- Typical inexpensive optical quality
- 2.5″ seeing
- Uniformly sampled periodic phase

## 17. Tablet landscape

- Input navigator becomes left drawer
- Results rail becomes right drawer/bottom sheet
- Center full width
- Comparison collapsible
- Touch-sized controls
- Full-screen chart option
- Portrait remains usable with landscape suggestion for dense views

## 18. Accessibility and keyboard

Focus order:

1. App bar
2. Input sections/fields
3. Analysis toolbar/controls
4. Results
5. Comparison

Dialogs trap and restore focus.

Keyboard input produces the same design commands as pointer input.

## 19. Repository structure

```text
smart-telescope-explorer/
├── apps/
│   ├── web/
│   └── engine-harness/
├── packages/
│   ├── schema/
│   ├── units/
│   ├── validation/
│   ├── engine-core/
│   ├── astronomy/
│   ├── optics/
│   ├── camera/
│   ├── targets/
│   ├── kinematics/
│   ├── tracking/
│   ├── blur/
│   ├── exposure/
│   ├── recommendations/
│   ├── worker-protocol/
│   ├── persistence/
│   ├── catalogs/
│   ├── test-fixtures/
│   ├── ui-components/
│   └── charts/
├── catalogs/
│   ├── targets/
│   ├── sensors/
│   ├── optics/
│   ├── mounts/
│   └── references/
├── docs/
│   ├── specifications/
│   ├── architecture-decisions/
│   ├── formulas/
│   └── validation/
├── scripts/
├── tests/
└── tooling/
```

## 20. Package responsibilities

### schema

V1 documents, catalogs, requests/responses, recommendations, workers, migrations. No UI or calculation dependencies.

### units

Quantity types and conversions. No UI/domain formulas.

### validation

Document/cross-field/catalog validation and issues. Depends on schema/units only.

### engine-core

Coordinator, dependency graph, confidence, result/formula registry. No React or persistence.

### astronomy

Time, sidereal time, coordinates, airmass, path, tangent plane, orientation.

### optics

Focal geometry, collecting area, diffraction, optical blur, image circle/vignetting.

### camera

Sensor validation, binning/ROI, image scale, FOV, data size.

### targets

Catalog resolution, geometry, outlines, framing and fit.

### kinematics

Alt-az, German/fork equatorial, limits, rates, orientation, zenith/meridian.

### tracking

Error components, phase sampling, star paths.

### blur

FWHM/sigma, covariance, pixel/rotation/motion, ellipse.

### exposure

Candidates, feasibility, preliminary acceptance, limits, plateau and range.

### worker-protocol

Requests, responses, progress, cancellation, generation/revision guards.

### persistence

IndexedDB, autosave, recovery, import/export, conflicts.

### catalogs

Loading, resolution, version checks, lazy search, provisional records.

### ui-components

Inputs, badges, cards, issues, assumptions, dialogs/drawers. No formulas.

### charts

Framing, pixel grid, blur, path, rotation, exposure. Consume results only.

## 21. Dependency direction

```text
schema
  ↑
units
  ↑
validation
  ↑
domain calculations
  ↑
engine-core
  ↑
worker
  ↑
application state
  ↑
UI
```

Prohibited:

- Engine imports React
- Schema imports UI
- Charts calculate authoritative values
- Persistence mutates results
- UI bypasses design commands

## 22. Web application organization

```text
apps/web/src/
├── app/
├── state/
├── features/
│   ├── scenario/
│   ├── targets/
│   ├── optics/
│   ├── camera/
│   ├── mount/
│   ├── tracking/
│   ├── exposure/
│   └── assumptions/
├── analysis/
│   ├── OverviewView
│   ├── FramingView
│   ├── SamplingView
│   ├── TrackingView
│   ├── BlurView
│   ├── FieldRotationView
│   └── ExposureView
└── dialogs/
```

## 23. R0 backlog

### R0-001 Repository/workspace

Monorepo, TypeScript, lint/format/test, build graph, CI, circular-dependency enforcement.

### R0-002 Architecture decision records

TypeScript/React, client-only, units, JSON docs, pure engine, worker boundary, IndexedDB, catalogs.

### R0-003 Schema primitives

Source, confidence, scalar, uncertainty, angular error, preset, issues.

### R0-004 V1 design types

Metadata, scenario, target, optics, camera, filter, mount, tracking, capture, constraints, extensions.

### R0-005 Calculation API types

Requests, responses, results, formulas, assumptions, recommendations, worker messages.

### R0-006 Units

Angle, length, time, fractions, bytes. Round-trip tests. No ad hoc constants.

### R0-007 Base validation

Registry, field-path issues, severity, dependencies, required/range checks.

### R0-008 Cross-field validation

Sensor geometry, obstruction, reducer/extender, binning/ROI, scenario, mount, exposure/session.

### R0-009 Optics calculations

Effective focal length, ratio, area, diffraction, spot conversion, formulas.

### R0-010 Sensor calculations

Binning, active dimensions, exact FOV, image scale, frame size.

### R0-011 Target framing

Target pixels/margins/fit, core/halo, image-circle coverage.

### R0-012 Sampling

Seeing/diffraction/optical, combined FWHM, pixels/FWHM, classification.

### R0-013 Result/confidence helpers

Constructors, propagation, assumptions, precision.

### R0-014 Formula registry

Optics, camera, framing, sampling formulas.

### R0-015 Engine coordinator

Requested groups, prerequisites, partial response, timing, assembly.

### R0-016 F01/F02 fixtures

Canonical documents, expected values, tolerances, invariant variants.

### R0-017 Property/invariant tests

Scale, FOV, obstruction, no NaN, physical bounds.

### R0-018 Development harness

Load fixture, raw JSON, run groups, inspect results/issues/formulas.

R1 does not begin until F01/F02 pass.

## 24. R1 backlog

### R1-001 Application shell

App bar, input, analysis, results, comparison placeholder; collapse and keyboard access.

### R1-002 Document state store

Current design, revision, save state, commands, undo interface; results separate.

### R1-003 Quantity input

Draft/commit, units, provenance, reset, validation, keyboard.

### R1-004 Source/confidence editor

Edit provenance/confidence/notes via commands.

### R1-005 Input section component

Completion, warning count, reset, related analysis, accessibility.

### R1-006 Scenario section

Modes, location/time, duration, direct alt/az, seeing.

### R1-007 Target catalog loader

Versioned JSON, alias search, lazy loading, provisional status, no silent upgrade.

### R1-008 Provisional target seed

At least 15: Andromeda, Orion, Pleiades, Triangulum, Whirlpool, Pinwheel, Bode/Cigar, Hercules, Ring, Dumbbell, Rosette, North America, Veil, Lagoon, Horsehead/Flame.

### R1-009 Target browser

Search/filter/preview/select/custom.

### R1-010 Custom target editor

Name, coordinates, dimensions, angle, type, spectrum.

### R1-011 Optics section

Aperture, focal length, modifiers, obstruction, quality, image circle; inline derived values.

### R1-012 Sensor preset loader

IMX585/678/662 and generic 2.9/2.0 µm records.

### R1-013 Camera section

Preset, dimensions, resolution, pitch, color, binning, bit depth, readout placeholder.

### R1-014 Filter shell

None, UV/IR, broadband, dual-band, custom; qualitative target compatibility only.

### R1-015 App calculation coordinator

Committed edits, stale state, revision guarding, error handling.

### R1-016 Results rail

Status, fit, image scale, FOV, blur, sampling, assumptions, next action.

### R1-017 Overview

Framing thumbnail, balance, values, missing-data action, limitation.

### R1-018 Framing view

Sensor, target, core/halo, position, image circle, fit, scale, text.

### R1-019 Sampling view

Pixel grid, base PSF, contributors, pixels/FWHM, interpretation.

### R1-020 Assumptions drawer

Filter, field/result links, editing.

### R1-021 IndexedDB design storage

Save/load/list/revision; preserve prior version.

### R1-022 Autosave/recovery

Save committed edits independent of calculation; interrupted recovery.

### R1-023 JSON export

Valid V1, no UI state, optional location disclosure.

### R1-024 JSON import

Validate, open new, reject unsupported, recalculate, preserve extensions.

### R1-025 Desktop responsive

Laptop widths, collapsing, readability.

### R1-026 Tablet landscape shell

Drawers, touch controls, portrait guidance.

### R1-027 Browser tests

Create/select/configure/view/save/reload/export/import.

R1 gate: a new user can answer target fit, image scale, and sampling without fabricated tracking data.

## 25. R2 backlog

### R2-001 Time primitives

UTC, Julian date, sidereal time, rollover.

### R2-002 Equatorial-to-horizontal

Verified transforms and conventions.

### R2-003 Airmass

Supported altitude range and low-altitude warning.

### R2-004 Session path

Adaptive samples, altitude/azimuth/airmass/visibility.

### R2-005 Tangent-plane projection

Stable small-angle local coordinates and documented axes.

### R2-006 Field orientation

Numerical celestial-north orientation and angle unwrapping.

### R2-007 Alt-az kinematics

Positions, rates, acceleration, range, zenith risk, wrap behavior.

### R2-008 Equatorial kinematics

German/fork positions, hour angle, meridian, orientation.

### R2-009 Mount section

Architecture, limits, zenith, meridian, pointing/settling.

### R2-010 Tracking section

RMS, drift, periodic amplitude/period/phase, vibration, thresholds; correctable vs uncorrectable.

### R2-011 Periodic-error signal

Peak/peak-to-peak, known/sampled deterministic phase.

### R2-012 Drift and jitter

Linear scaling, isotropic/directional representation, deterministic analytic handling.

### R2-013 During-exposure path

Ideal axes plus errors transformed to sky; median/95th/worst; optional retained path.

### R2-014 Covariance utilities

2D covariance, matrix addition, eigenvalues/orientation, degenerate cases.

### R2-015 Motion covariance

Path → covariance; maximum/RMS; dominant source.

### R2-016 Pixel covariance

Top-hat variance, X/Y scales, optional pure-optical exclusion.

### R2-017 Total blur

Static + motion + pixel; major/minor FWHM, elongation, orientation, dominant.

### R2-018 Field rotation

Start/mid/end orientation; center/mid/corners/target; zero center; exposure limit.

### R2-019 Rotation covariance

Field-point rotational path and covariance.

### R2-020 Exposure candidates

Default/linear/log/explicit; include current; deduplicate.

### R2-021 Candidate evaluation

Tracking, elongation, rotation, duty, thresholds, failure reason.

### R2-022 Preliminary fixed-session metric

Duty + threshold acceptance + accepted exposure; label preliminary; reproduce F05/F06 directionally.

### R2-023 Hard exposure limit

Earliest hard threshold and reason.

### R2-024 Recommended range

Exclude failures; near-optimal region; 98%; prefer shorter plateau; boundary warning.

### R2-025 Calculation worker

Off-main-thread, IDs/revisions, cancellation, progress, supersession protection.

### R2-026 Tracking view

Path, X/Y time, phase, metrics, correction explanation, text summary.

### R2-027 Blur view

Contributions, confidence, ellipse, FWHM/elongation, input linking.

### R2-028 Rotation view

Sensor vectors, rate timeline, exposure limit, zenith, equatorial comparison.

### R2-029 Exposure view

Chart, range, table, apply, hard-limit explanation, preliminary label.

### R2-030 Overview/results update

Mount, final blur, elongation, limits, exposure, active limitation.

### R2-031 Simplified recommendation rules

Missing tracking, fit, oversampling, tracking/periodic/drift, rotation, zenith, overhead, yield, plateau. No motor/encoder advice before R4.

### R2-032–036 Fixtures

F03 tracking, F04 rotation, F05 overhead, F06 rejection, F07 framing.

### R2-037 Astronomy vectors

Equator, northern/southern latitude, meridian, horizon, zenith, circumpolar, midnight crossing; independent verification.

### R2-038 Browser test

Configure tracking, inspect path/rotation, sweep, apply recommendation, verify changed blur, restore.

Do not build polished charts before vectors and F03/F04 pass.

## 26. Cross-release tests

| Capability | R0 | R1 | R2 | Browser |
|---|---|---|---|---|
| Schema | Unit | Import/export | Worker | Required |
| Units | Unit | Display | Motion display | Optional |
| FOV | Unit | Framing | Input | Required |
| Image scale | Unit | Sampling | Pixels | Required |
| Target fit | Unit | Framing | Recommendation | Required |
| Sampling | Unit | View | Blur baseline | Required |
| Coordinates | — | Input | Required | Required |
| Tracking | — | — | Required | Required |
| Rotation | — | — | Required | Required |
| Exposure | — | — | Required | Required |
| Persistence | — | Required | Revision safety | Required |
| Worker supersession | — | Coordinator | Required | Required |

## 27. Risks

- UI before calculation stability → fixtures/vectors gate
- Too many provisional values → badges, confidence, no hidden noise
- Tracking RMS oversimplification → separate drift/periodic/jitter/vibration
- Rotation misunderstanding → visual center/corner and repeated intra-frame explanation
- R2 exposure overclaim → preliminary label, range, included/excluded effects

## 28. R2 release gate

The user can:

1. Select target/session.
2. Configure optics/camera.
3. Select alt-az/equatorial.
4. Enter RMS/drift/periodic.
5. See star path.
6. See major/minor blur.
7. See corner rotation.
8. See exposure limits through session.
9. Run sweep.
10. Understand short-exposure overhead.
11. Understand long-exposure rejection.
12. Apply recommendation.
13. See updated result.
14. Explain what stacking can/cannot repair.

F01–F07 pass in CI.

## 29. Issue labels

Types, releases, domains, priority, and status labels:

- `type:feature`, `type:calculation`, `type:ui`, `type:data`, `type:test`, `type:architecture`, `type:documentation`, `type:bug`
- `release:r0` through `release:future`
- `domain:schema`, `units`, `optics`, `camera`, `targets`, `astronomy`, `mount`, `tracking`, `blur`, `exposure`, `persistence`, `accessibility`
- `priority:p0` through `priority:p3`
- `status:blocked`, `needs-data`, `needs-validation`, `ready`, `in-progress`

## 30. Pull-request checklist

Calculation PR:

- Canonical units
- No unqualified physical numbers
- Validation
- Confidence
- Formula
- Unit/invariant tests
- No UI/browser dependency
- Fixture impact
- Determinism

UI PR:

- Keyboard and screen reader
- No duplicate calculation
- Empty/invalid/unknown states
- Tablet behavior
- Text chart summary
- Command-based edit
- Undo boundary

## 31. Ready-to-code checkpoint

Implementation begins when:

1. Repository structure accepted.
2. R0 issues created.
3. F01/F02 finalized.
4. Unit and angle conventions documented.
5. Minimal V1 document under schema tests.
6. Desktop shell accepted.
7. Provisional target list accepted.
8. Independent astronomy verification selected.
9. No unresolved decision changes V1 meaning.

The first production code should be schema primitives or canonical units, not the visual shell.
