# DIY Smart Telescope Design Explorer
## Application Architecture and Implementation Plan v0.6

## 1. Architectural objective

Implement a client-first, offline-capable browser application with a deterministic engineering calculation engine.

The architecture must support:

- Immediate feedback
- Heavy calculations without freezing
- Reproducible results
- Versioned presets and references
- Local-first saving
- Shareable designs
- Comparisons
- Sweeps
- Printable reports
- Future measured-data import
- Future expansion without rewriting the core

The calculation engine should run independently from the UI and be reusable by future CLI, server, or native applications.

## 2. Primary decisions

### 2.1 Client-only MVP

The browser handles:

- Editing
- Calculations
- Catalogs
- Local persistence
- Comparisons
- Sweeps
- Reports
- Import/export
- Encoded share links

Benefits:

- Offline after load
- No account
- No infrastructure cost
- Location privacy
- Easier deployment

A future backend may add short links, cloud sync, shared catalogs, tracking logs, collaboration, and prices.

### 2.2 Recommended stack

- TypeScript
- React
- Modern browser build system
- Application-owned CSS variables/components
- Generic charting plus custom SVG
- IndexedDB
- PWA/offline assets

TypeScript should make units and error statistics explicit.

## 3. High-level system structure

```text
Browser application
├── User interface
├── Application state and command layer
├── Calculation coordinator
├── Calculation worker
├── Sweep worker
├── Pure domain calculation modules
└── IndexedDB and versioned catalogs
```

## 4. Separation of application data

### 4.1 Design document

Authoritative engineering inputs.

### 4.2 Derived results

Generated values. Cached but never authoritative unless copied into a measured override.

### 4.3 Interface state

Open panels, chart selections, hover state, previews, drawer state, and similar temporary UI details.

## 5. Domain model organization

```text
DesignDocument
├── metadata
├── scenario
├── target
├── optics
├── camera
├── filter
├── mount
├── tracking
├── focus
├── capture
├── calibration
├── compute
├── power
├── construction
├── reliability
├── constraints
└── notes
```

Each object has stable fields, canonical units, provenance, validation, defaults, and migration behavior.

## 6. Quantity and unit architecture

Do not use ambiguous numbers at module boundaries.

Conceptual types:

- Millimeters
- Micrometers
- Radians
- Degrees
- Arcseconds
- Seconds
- Hertz
- Kilograms
- Newton-meters
- Watts
- Watt-hours
- Electrons
- Fractions

Conversions occur at input, import, and display boundaries.

Angular errors include statistic, direction, provenance, and confidence.

## 7. Calculation-engine principles

- Pure functions
- Deterministic outputs
- No global state
- No browser access
- No UI logic
- Semantic status only

## 8. Calculation-module boundaries

### Units

Definitions, conversions, normalization, formatting metadata.

### Validation

Required/range/cross-field checks, contradiction detection, invalid propagation.

### Astronomy

Time, sidereal time, coordinates, hour angle, airmass, tangent plane, orientation, rotation.

### Targets

Geometry, outlines, framing, classification, visibility.

### Optics

Focal length/ratio, areas, diffraction, blur conversion, image circle, vignetting, sampling reference.

### Camera

Geometry, pixel validation, image scale, FOV, binning, ROI, data size, noise, saturation.

### Filters

Passbands, target and sky response, effective QE, compatibility.

### Focus

Step size, repeatability, CFZ, temperature drift, defocus, autofocus scheduling.

### Kinematics

Mount transforms, positions, rates, acceleration, range, Jacobian, condition, singularity, orientation.

### Mechanics

Stages, reduction, efficiency, motor speed, torque, steps, encoder, backlash, periodic error, resolution floor.

### Tracking

Ideal path, error signals, phase sampling, axis-to-sky transform, drift, periodic error, jitter, recenter residual.

### Blur

Gaussian blur, covariance, directional motion, pixel response, rotation, FWHM, elongation.

### Sensitivity

Relative throughput, point/extended metrics, photon model, per-frame noise, stack SNR.

### Capture

Exposure candidates, cadence, solve/recenter/dither schedules, calibration overhead.

### Session

Timeline, frame events, target evolution, autofocus/meridian, acceptance, integration.

### Stack geometry

Translation, rotation, dithers, polygons, coverage, crop.

### Compute

Demand, throughput, queue, memory, storage, plate solving, latency.

### Power

Power states, duty cycles, battery derating, runtime, reserve.

### Construction

Cost, mass, envelope, counts, fabrication, complexity.

### Reliability

Recovery, dependencies, risk, safe state, margins.

### Recommendations

Rules, priority, proposed changes, preview, benefit, suppression, next bottleneck.

## 9. Standard result envelope

Every major calculation returns:

- Status
- Value
- Display guidance
- Confidence
- Uncertainty
- Assumptions
- Warnings
- Errors
- Input dependencies
- Calculation ID

Statuses:

- Valid
- Marginal
- Invalid
- Unavailable
- Stale

Dependencies enable input highlighting, formulas, recommendations, incremental calculation, and testing.

## 10. Calculation dependency graph

A focal-length change affects:

- Image scale
- FOV
- Framing
- Diffraction projection
- Spot conversion
- Sampling
- Tracking in pixels
- Rotation in pixels
- Sensitivity/pixel
- Exposure
- Crop
- Recommendations

A battery change should not trigger optical calculations.

## 11. Recalculation tiers

### Tier 1: Immediate

- Focal ratio
- Areas
- Image scale
- FOV
- Sensor dimensions
- Gear ratio
- Step/encoder increments
- Basic power/cost

### Tier 2: Debounced

- Target path
- Kinematics
- Rotation
- Blur
- Exposure
- Basic recommendations

### Tier 3: Worker

- Exposure path simulation
- Phase evaluation
- Session timeline
- Polygon intersection
- Detailed recommendations
- Comparison

### Tier 4: Long-running worker

- One/two-variable sweeps
- Multi-design detailed analysis
- Dense coverage
- Large time sweeps

Long jobs are cancelable and progressive.

## 12. Worker strategy

### Calculation worker

- Normal design recalculation
- Session
- Tracking
- Exposure
- Recommendations

Only the latest matching design revision may update the UI.

Each request includes:

- Request ID
- Design revision
- Mode
- Requested groups
- Generation/cancellation identifier

### Sweep worker

Separate worker prevents sweeps from delaying interactive calculations.

Messages use serializable plain data only.

WebAssembly is a future optimization for dense transforms, polygons, sweeps, covariance, and Monte Carlo.

## 13. Application state

### Document state

Current/saved designs, comparison IDs, baseline, snapshots, presets, overrides, undo.

### Derived state

Results, revision, stale indicators, comparisons, sweeps, previews, validation.

### View state

Sections, views, pin state, dialogs, rails, chart settings, tablet drawers.

### Command-based editing

Commands include:

- Change focal length
- Apply camera preset
- Add drivetrain stage
- Move encoder
- Change exposure
- Apply recommendation
- Restore defaults
- Duplicate
- Apply sweep candidate

Benefits: undo, audit trail, testing, autosave boundaries, consistent previews.

## 14. Undo and redo

Transactions group:

- Pointer interaction
- Text commit
- Preset apply
- Recommendation
- Sweep
- Reset

Store command, timestamp, before/after, revision, description.

Results are recalculated, not stored in undo.

## 15. Temporary preview architecture

Preview state:

- Base revision
- Temporary commands
- Preview design
- Preview results
- Differences

Actions:

- Apply
- Duplicate and apply
- Pin
- Discard

## 16. Preset and catalog architecture

Versioned static JSON assets:

- References
- Optics
- Cameras/sensors
- Filters
- Motors
- Gearboxes
- Encoders
- Compute
- Batteries
- Mounts
- Conditions
- Targets

Load on demand.

Record fields:

- Stable ID/version
- Display name/category/search terms
- Values
- Sources
- Confidence
- Review date
- Deprecation/replacement

User presets stored separately.

Saved comparisons retain exact reference versions.

## 17. Initial target catalog architecture

Curated records contain:

- Names/aliases
- Coordinates/epoch
- Type
- Dimensions
- Position angle
- Core/halo
- Brightness class
- Spectral class
- H-alpha/OIII relevance
- Margin
- Confidence

Outlines may be ellipse, rectangle, circle, multi-region, or low-resolution polygon.

## 18. Mount plug-in pattern

Each architecture implements:

- Sky-to-axis
- Axis-to-sky
- Camera orientation
- Validation
- Limits
- Derivatives
- Singularities
- Setup requirements

Architectures:

- Alt-az
- German equatorial
- Fork
- Pan-tilt/gimbal
- Cartesian-derived
- Generic calibrated

Adding a mount should not change optics, camera, sensitivity, power, or generic tracking modules.

## 19. Recommendation architecture

Declarative rules contain:

- Triggers
- Required inputs
- Severity
- Proposed change/range
- Conflicts
- Benefit metrics
- Tradeoffs
- Suppression
- Explanation template

Evaluation stages:

1. Hard invalidity
2. Image damage
3. Efficiency
4. Practicality
5. Optional improvement

Preview:

1. Clone
2. Apply command
3. Recalculate
4. Compare
5. Find regressions
6. Find new bottleneck
7. Calculate confidence

Suppress when irrelevant, negligible, constraint-breaking, duplicate, low confidence, or harmful.

## 20. Comparison architecture

Each design remains independent.

A temporary common scenario overlay may normalize:

- Target
- Location
- Duration
- Recommended exposure
- Cost/weight ceilings

Normalization is visible.

## 21. Parameter-sweep architecture

Sweep contains:

- Base revision
- One/two variable paths
- Range/samples
- Scale
- Constraints
- Metrics
- Mode

Each sample is isolated and compact.

MVP uses uniform sampling; future adaptive refinement may focus on feasible/promising regions.

## 22. Caching

Cache key uses:

- Engine version
- Input dependency hash
- Calculation mode
- Preset versions

Good candidates:

- Target path
- Jacobians
- Static geometry
- Exposure candidates
- Reference results
- Target outlines

Invalidate on engine/schema/dependency/preset/mode/convention changes.

## 23. Persistence

IndexedDB stores:

- Designs
- Snapshots
- User presets
- Comparison sets
- Sweep definitions
- Settings
- Catalog versions
- Migration history
- Optional cache

Autosave saves the design before calculations and preserves last valid version.

Crash recovery offers working copy restoration.

JSON export is the durable backup.

## 24. Serialization and migration

Every design has schema version.

Migration:

1. Parse
2. Identify version
3. Validate
4. Apply sequential migrations
5. Resolve presets
6. Preserve provenance
7. Report loss
8. Recalculate

Unknown fields are preserved when practical. Newer unsupported documents fail clearly.

## 25. Shareable URLs

No-backend MVP may encode compressed design inputs in the URL fragment.

Include:

- Inputs
- Preset IDs/versions
- Overrides
- Target
- Optional baseline

Exclude:

- Cache
- Undo
- Large catalogs/tables
- Notes unless selected

Warn on location; support exact, rounded, latitude-only, generic, or removed.

## 26. Reporting architecture

Report consumes design, results, recommendations, assumptions, and comparisons.

It does not recalculate.

Print behavior:

- Remove navigation
- Expand important details
- Avoid table splits
- Grayscale readable
- Include confidence/sources
- Include versions

Report header:

- Design ID/revision
- Schema
- Engine
- Presets
- Date
- Detail level

## 27. Formula inspection

Every result links to a record with:

- Name
- Formula description
- Substituted values
- Unit conversions
- Intermediates
- Result
- Assumptions
- Confidence
- Limitations

## 28. Errors and warnings

Severity:

- Fatal
- Error
- Warning
- Advisory
- Information

Invalidity is localized to dependent results.

Each issue identifies field, section, results, corrective action, and source.

## 29. Confidence architecture

Confidence depends on:

- Source
- Input confidence
- Model
- Sensitivity
- Extrapolation
- Missing values

The app identifies the most valuable uncertain input to improve.

## 30. UI component architecture

Engineering inputs:

- Quantity
- Range
- Percentage
- Angle
- Coordinates
- Date/time
- Preset selector
- Confidence editor
- Error-statistic selector
- Component table
- Drivetrain editor
- Constraint editor

Results:

- Result card
- Status/confidence badges
- Assumptions
- Comparison delta
- Formula viewer
- Recommendation
- Constraint status
- Empty state

Visualizations:

- Line/heat/timeline
- Sensor canvas
- Blur ellipse
- Vector field
- Coverage
- Resolution ladder
- Drivetrain
- Power chart

## 31. Form editing

Draft text is separate from committed values.

Calculations use the last valid committed value until a new value is complete.

Sliders update lightweight previews and commit on release.

Preset overrides retain original and current values with restore action.

## 32. Performance budgets

- Static calculations perceptually immediate
- Standard recalculation preserves editing flow
- Session work non-blocking and supersedable
- Sweeps progressive and cancelable
- Startup lazy-loads catalogs, reports, and detailed analysis

## 33. Testing strategy

### Unit tests

Every core formula.

### Invariant tests

Mathematical relationships.

### Property-based tests

Valid ranges, no NaN/negative output, monotonicity, angle continuity, coordinate round trip, valid polygons.

### Golden fixtures

- Generic 30 mm alt-az
- Generic 50 mm equatorial
- Undersampled
- Oversampled
- Poor tracking
- Encoder placement
- Battery limited
- Compute limited
- Near-zenith

### Independent cross-checks

- Coordinates
- Airmass
- Rotation
- Image scale
- FOV
- Diffraction
- Photometry

### Recommendation tests

Trigger, non-trigger, suppression, preview, constraint conflict, next bottleneck.

### UI tests

Create, select target, presets, mount, sweep, recommendation, undo, compare, report, import/export.

### Migration tests

Upgrade, override preservation, source preservation, deprecated presets, unsupported failure.

## 34. Development diagnostics

Development-only:

- Revision
- Request ID
- Worker status
- Timings
- Cache hits
- Recalculated modules
- Dependency graph
- Assumptions/issues
- Confidence
- Worker log

## 35. Privacy and security

- Exact locations local by default
- Warn before sharing
- No coordinates in analytics
- Validate imported JSON
- Limit file/array/table sizes
- Render notes as text
- No arbitrary formulas in MVP

## 36. Offline behavior

PWA assets include:

- Core app
- Engine
- Basic target/component catalogs
- References
- Core help

Manual coordinate entry works offline.

## 37. Deployment

Static HTTPS hosting with:

- Correct MIME
- Compression/cache
- Web Worker support
- SPA fallback

No server required.

## 38. Versioning

Track separately:

- Application
- Schema
- Engine
- Catalog
- Individual preset
- Report template

## 39. Telemetry

Optional only, privacy preserving, and excludes exact location, design contents, and notes.

## 40. Implementation milestones

### Milestone 1: Calculation foundation

Units, types, validation, result envelope, schema, formula tests, static calculations.

### Milestone 2: Static workspace

Shell, editing, scenario/target/optics/camera, results rail, framing, local save, import/export.

### Milestone 3: Astronomy/session geometry

Coordinates, path, airmass, orientation, field rotation, target catalog.

### Milestone 4: Basic mount/tracking

Alt-az/equatorial, basic tracking, motion, blur, elongation, exposure limits, analysis views.

### Milestone 5: Capture/stacking

Exposure sweep, solve/recenter/dither, rejection, integration, crop, stack performance, timeline.

### Milestone 6: Advanced mechanics

Motor, stages, encoder, torque, rates, pan-tilt/gimbal, generic calibrated mechanism.

### Milestone 7: Practicality

Focus, dew, calibration, compute, storage, power, battery, cost, weight, complexity, reliability.

### Milestone 8: Recommendations/comparison

Rules, previews, undo, references, four-design comparison, one-variable sweeps.

### Milestone 9: Full MVP

Two-variable sweeps, report, share URLs, tablet, accessibility, offline, performance, tests, docs.

## 41. Recommended first vertical slice

1. Select target.
2. Enter aperture/focal length.
3. Select camera.
4. Select alt-az/equatorial.
5. Enter tracking error.
6. Enter exposure/session.
7. Calculate framing.
8. Calculate image scale.
9. Calculate rotation.
10. Calculate tracking blur.
11. Estimate acceptance.
12. Recommend exposure.
13. Compare one reference.

## 42. Major risks and controls

- False precision → confidence, assumptions, rounding, sensitivity
- Calculation cost → dependency graph, workers, cancellation, caching
- State complexity → state separation, commands, revisions
- Contradictory recommendations → priority, constraints, preview, suppression
- Inaccurate presets → provenance, confidence, overrides, version locks
- Custom mount complexity → predefined transforms and calibration tables
- Photometric overreach → relative-first, absolute only with sufficient data

## 43. Architecture acceptance criteria

1. Engine runs without UI.
2. Results deterministic.
3. Heavy calculations do not block.
4. Old responses cannot overwrite.
5. Inputs persist independently of results.
6. Presets reproducible.
7. References immutable.
8. Previews do not alter design.
9. Undo restores inputs.
10. Invalidity localized.
11. Sweeps cancelable.
12. Coordinates local unless shared.
13. Reports identify versions.
14. New mounts fit a common interface.
15. First vertical slice precedes advanced subsystems.

## 44. Conceptual source structure

```text
application/
├── app-shell/
├── design-editor/
├── analysis-views/
├── comparison/
├── recommendations/
├── reports/
├── presets/
├── persistence/
├── workers/
├── state/
└── shared-ui/

engine/
├── units/
├── validation/
├── astronomy/
├── targets/
├── optics/
├── camera/
├── filters/
├── focus/
├── kinematics/
├── mechanics/
├── tracking/
├── blur/
├── sensitivity/
├── capture/
├── session/
├── stack-geometry/
├── compute/
├── power/
├── construction/
├── reliability/
├── recommendations/
└── testing-fixtures/

catalogs/
├── targets/
├── references/
├── optics/
├── cameras/
├── filters/
├── motors/
├── drivetrains/
├── encoders/
├── batteries/
└── compute-platforms/
```

The engine must not import from the application.
