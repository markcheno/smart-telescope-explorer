# DIY Smart Telescope Design Explorer
## MVP Backlog, Seed Catalogs, Rules, and Release Contract v0.7

## 1. Purpose

This specification defines the exact work required to move from architecture into implementation.

It includes:

- MVP definition
- Prioritized backlog
- User stories
- Acceptance criteria
- Initial calculation fixtures
- Initial target catalog
- Commercial reference records
- Component-preset scope
- Recommendation-rule catalog
- Release phases
- Release gates
- Explicit exclusions
- Feature traceability

## 2. Product-level MVP definition

The MVP is complete when a DIY builder can:

1. Select a common deep-sky target.
2. Enter or select an observing scenario.
3. Configure an optical system and camera.
4. Select an alt-azimuth or equatorial mount.
5. Enter a basic measured or estimated tracking model.
6. Calculate field of view and image scale.
7. Calculate sampling and a basic blur budget.
8. Calculate intra-frame tracking motion.
9. Calculate alt-azimuth field rotation.
10. Sweep practical exposure durations.
11. Estimate frame acceptance and effective integration.
12. Compare relative stacked performance.
13. Receive an explainable exposure recommendation.
14. Compare against a locked reference design.
15. Save, export, and restore the design locally.

The MVP does not require the complete advanced mechanical model.

## 3. Prioritization

- **P0:** Required for first useful release
- **P1:** Required for full MVP
- **P2:** Post-MVP priority
- **P3:** Deferred expansion

## 4. Release structure

### R0 — Engineering kernel

- Units
- Schema
- Validation
- Static calculations
- Test infrastructure
- Repeatability

### R1 — Optical design explorer

- Target, optics, camera
- Framing and sampling
- Save/restore

### R2 — Smart-telescope feasibility calculator

- Mount
- Tracking
- Field rotation
- Exposure
- Basic stacking performance

### R3 — Full MVP

- Session simulation
- Recommendations
- Locked references
- Comparison
- Reports and sharing

### R4 — Advanced mount engineering

- Motors
- Drivetrains
- Encoders
- Nonstandard mechanisms
- Torque and resolution

### R5 — Practical system engineering

- Focus
- Power
- Compute
- Cost
- Mass
- Construction
- Dew
- Reliability

## 5. Epic backlog

| Epic | Name | Priority | Release |
|---|---|---|---|
| E00 | Calculation foundation | P0 | R0 |
| E01 | Design documents and persistence | P0 | R1 |
| E02 | Scenario and target selection | P0 | R1 |
| E03 | Optics and sensor geometry | P0 | R1 |
| E04 | Framing and sampling workspace | P0 | R1 |
| E05 | Astronomy and session geometry | P0 | R2 |
| E06 | Basic mount and tracking | P0 | R2 |
| E07 | Blur and field rotation | P0 | R2 |
| E08 | Exposure analysis | P0 | R2 |
| E09 | Capture and stack | P1 | R3 |
| E10 | Recommendation engine | P1 | R3 |
| E11 | References and comparison | P1 | R3 |
| E12 | Reporting and sharing | P1 | R3 |
| E13 | Advanced mechanics | P2 | R4 |
| E14 | Predefined custom mechanisms | P2 | R4 |
| E15 | Focus and calibration | P2 | R5 |
| E16 | Compute and storage | P2 | R5 |
| E17 | Power and battery | P2 | R5 |
| E18 | Cost, weight, construction | P2 | R5 |
| E19 | Reliability and environment | P2 | R5 |
| E20 | Accessibility, offline, polish | P1 | R3 |

## 6. E00 — Calculation foundation

### E00-S01: Canonical quantity types

Required families:

- Distance
- Pixel pitch
- Angle
- Angular error
- Time
- Angular velocity
- Mass
- Torque
- Power
- Energy
- Temperature
- Probability
- Electrons and rates
- Data size
- Cost

Acceptance:

- No ambiguous physical numbers at core boundaries.
- Degrees/radians and mm/µm require conversion.
- Error statistics are explicit.
- Imported values normalize before calculation.

### E00-S02: Standard calculation result

Every result returns:

- Value
- Unit
- Status
- Confidence
- Warnings
- Errors
- Assumptions
- Dependencies
- Calculation ID

Failure is localized to dependent groups.

### E00-S03: Validation framework

Supports:

- Required fields
- Range checks
- Cross-field checks
- Contradictions
- Missing recommended data
- Dependency-specific invalidation

No silent correction.

### E00-S04: Calculation test harness

- Engine runs without UI.
- Full design fixtures load.
- Tolerances supported.
- Golden outputs stored.
- Engine version included.

## 7. E01 — Design documents and persistence

### Create and edit

Design contains metadata, scenario, target, optics, camera, mount, tracking, capture, constraints, notes.

### Autosave

- Committed changes save locally.
- Save status visible.
- Save independent of calculation.
- Prior version preserved on failure.
- Interrupted working copy recoverable.

### Import/export

- Versioned JSON
- Preset IDs/versions
- Validation
- Recalculation
- Unsupported future versions fail
- Unknown fields preserved when practical

### Undo/redo

Supports field changes, presets, recommendations, resets, and sweeps. Slider drag is one transaction.

## 8. E02 — Scenario and target

### Scenario entry

Basic:

- Latitude
- Date
- Start
- Duration
- Seeing
- Sky preset

Advanced:

- Longitude
- Elevation
- Time zone
- Transparency
- Extinction
- Temperature
- Humidity
- Wind
- Minimum altitude
- Environmental loss

Support location/time and direct alt/az.

### Target browser

- Search common name/ID
- Filter type/size/spectrum
- Select catalog target
- Enter custom target

### Visibility

Calculate start/mid/end altitude, min/max altitude, time below minimum, and airmass.

## 9. E03 — Optics and sensor geometry

### Optical inputs

- Aperture
- Focal length
- Obstruction
- Transmission
- Image circle
- Quality/blur

Calculate effective focal length, focal ratio, areas, diffraction, and optical blur.

### Camera inputs

- Sensor dimensions
- Pixel count/pitch
- Color/mono
- Binning
- Stored bit depth

Calculate image scale, exact FOV, and frame size.

### Consistency checks

Check physical dimensions against pixel pitch/count. Allow authority selection and distinguish preset-data problems.

## 10. E04 — Framing and sampling

### Framing

Display sensor, target, orientation, image circle, core/halo, and margins.

Classify:

- Does not fit
- Tight
- Good
- Excess field

### Sampling

Calculate seeing, diffraction, optical contribution, combined FWHM, and pixels/FWHM.

Classify undersampled/well matched/oversampled while treating moderate undersampling as acceptable for compact live stacking.

## 11. E05 — Astronomy and session geometry

### Coordinate conversion

- Equatorial ↔ horizontal
- Correct sign conventions
- Angle wrapping
- Sessions crossing midnight

### Session path

- Altitude
- Azimuth
- Airmass
- Field orientation
- Visibility
- Mount limits

## 12. E06 — Basic mount and tracking

MVP mount types:

- Alt-azimuth
- German equatorial
- Fork equatorial

Each provides positions, rates, ranges, orientation, and special-condition status.

Basic tracking inputs:

- Tracking RMS
- Drift
- Periodic amplitude/period
- Vibration
- Backlash
- Settling
- Solve accuracy
- Recenter residual

During-exposure path:

- Ideal tracking
- Drift
- Periodic error
- Jitter
- Axis-to-sky transform
- Median/95th/worst phase results

## 13. E07 — Blur and field rotation

Static blur:

- Seeing
- Diffraction
- Optical quality
- Focus placeholder
- Pixel response

Motion covariance:

- Major/minor FWHM
- Elongation
- Orientation
- Maximum/RMS displacement

Field rotation:

- Start/mid/end orientation
- Center/mid/corners/target edge
- Center displacement zero
- Zenith warning

## 14. E08 — Exposure analysis

Default candidates:

- 1, 2, 5, 8, 10, 15, 20, 30, 45, 60 seconds
- Additional logarithmic candidates

For each:

- Tracking motion/elongation
- Rotation
- Frames/session
- Readout overhead
- Duty cycle
- Preliminary acceptance

Hard limit:

- Motion
- Elongation
- Corner rotation
- Mount rate/acceleration
- Saturation
- User maximum

Recommendation returns:

- Shortest practical
- Recommended range
- Conservative
- Longest acceptable

It explains why shorter or longer values are worse.

## 15. E09 — Capture and live stacking

Capture cadence inputs:

- Exposure
- Readout/transfer
- Registration/stack
- Solve/recenter
- Dither/settle

Outputs:

- Frame interval
- Frames
- Duty cycle
- Overhead allocation

Frame rejection reasons:

- Tracking
- Elongation
- Rotation
- Focus
- Environment
- Solve/recenter
- Compute

Effective integration:

\[
\text{Effective integration} = \sum \text{accepted exposure time}
\]

Relative stack metrics remain separate:

- Point-source throughput
- Extended signal/pixel
- Signal/resolution element
- Accepted integration
- Stack-performance index

Basic crop accounts for rotation, dither, recenter, and drift.

## 16. E10 — Recommendation engine

Declarative rules have stable IDs, required inputs, suppression, evidence, severity, and expected benefit.

Preview:

- Does not alter design
- Shows before/after
- Shows tradeoff
- Shows next bottleneck
- Shows confidence

Apply:

- One undo transaction
- Recalculate
- Preserve prior value
- Update/remove resolved recommendation

## 17. E11 — References and comparison

Locked reference:

- Immutable
- Sources/review date
- Field confidence
- Duplicable
- Baseline selectable
- Version retained

Compare up to four:

- FOV
- Image scale
- Sampling
- Blur
- Rotation
- Exposure
- Acceptance
- Integration
- Relative stack
- Weight/runtime when available

Normalization:

- Same target
- Same scenario
- Same wall time
- Same exposure
- Recommended exposure each
- Same accepted integration

## 18. E12 — Reporting and sharing

Printable report:

- Design and scenario
- Optics/camera
- Mount assumptions
- Framing
- Sampling
- Blur
- Rotation
- Exposure
- Stack
- Assumptions
- Confidence
- Recommendations
- Versions

Share link:

- Encodes small designs
- Requires approval for exact coordinates
- Supports rounding/removal
- Falls back to file for large designs
- Opens shared design as copy

## 19. E13 — Advanced mechanics

Motor:

- Steps
- Microsteps
- Dynamic torque
- Speed
- Inertia
- Power

Drivetrain:

- Belt
- Spur
- Worm
- Planetary
- Friction
- Lead screw
- Custom

Encoder placement:

- Motor
- Intermediate
- Output

Mechanical resolution ladder compares pixel scale, required precision, steps, encoder, mechanics, and predicted tracking.

## 20. E14 — Nonstandard mechanisms

- Pan-tilt/gimbal
- One defined Cartesian-derived geometry
- Generic calibrated two-axis mechanism

All include local Jacobian, rates, limits, and singularity detection.

## 21. E15–E19 post-MVP

### Focus/calibration

CFZ, focuser resolution, temperature drift, autofocus, dark/bias/flat/bad-pixel.

### Compute/storage

Processing throughput, solve time, queue, memory, bandwidth, storage.

### Power/battery

States, average/peak, derating, runtime, reserve.

### Cost/weight/construction

Inventory, cost, mass, moving mass, envelope, fabrication, complexity.

### Reliability/environment

Dew, heater, wind, cables, recovery, watchdog, low battery, offline operation.

## 22. Initial calculation fixtures

### F01 — Generic 30 mm wide-field

Inputs:

- Aperture 30 mm
- Focal length 160 mm
- Pixel pitch 2.9 µm
- 3840×2160
- Seeing 2.5″
- Optical blur 2.0″
- Alt-az
- Tracking RMS 4″
- Exposure 10 s
- Session 60 min

Expected:

- f/5.33
- Sensor 11.136×6.264 mm
- 3.74″/px
- FOV about 3.99°×2.24°, diagonal 4.57°

Behavior:

- Double focal length halves image scale.
- 2× binning doubles scale.
- Tracking affects blur, not FOV.
- Ideal equatorial removes alt-az rotation, not tracking error.

### F02 — Generic 35 mm compact

Inputs:

- 35 mm
- 150 mm
- 2.0 µm
- 3840×2160
- Seeing 2.5″
- Optical blur 2.0″
- Alt-az
- 10 s

Expected:

- f/4.29
- Sensor 7.68×4.32 mm
- 2.75″/px
- FOV about 2.93°×1.65°, diagonal 3.36°

Behavior:

- Finer sampling
- Narrower field
- Same angular tracking error is more pixels
- Smaller angular pixel area affects extended-object signal/pixel

### F03 — Tracking-limited

- 50 mm, 250 mm, 2.9 µm
- 15″ peak-to-peak periodic error, 60 s period
- 4″ RMS jitter
- 20 s exposure

Expected:

- Tracking dominates directional blur
- Shorter exposure helps
- Aperture alone does not repair elongation
- Exposure recommendation precedes aperture
- No encoder recommendation without advanced mechanics

### F04 — Rotation-limited

- Alt-az
- Wide sensor
- Near zenith
- Low tracking error
- 30 s

Expected:

- Center rotation zero
- Corners worse
- Exposure limit changes during session
- Zenith warning
- Equatorial removes alt-az rotation
- Registration does not repair intra-frame rotation

### F05 — Readout-overhead limited

- 1 s exposure
- 2 s readout/processing
- 60 min
- High acceptance

Expected:

- Duty cycle below 34%
- Longer exposure improves integration
- Overhead is first recommendation
- Recommended exposure remains under tracking limit

### F06 — Rejection limited

- 30 s
- High phase sensitivity
- 50% acceptance
- Low overhead

Expected:

- Nominal integration exceeds effective
- Shorter frames can outperform
- Recommendation uses fixed-session accepted result

### F07 — Large-target framing failure

- Small sensor
- Long focal length
- Large target
- Target fit hard constraint

Expected:

- Target fails
- Exposure is not a framing fix
- Shorter focal length recommendation
- Larger sensor alternative when image circle supports it
- Preview shows margin

### F08 — Reference comparison

- Custom design
- Seestar S30 Pro
- DWARF 3
- Same target and 60-minute session

Expected:

- Published fields compare
- Unknown tracking remains unknown
- No invented tracking data
- Optional assumptions separated and labeled

## 23. Initial target catalog

Approximately 30 curated objects.

Large:

- Andromeda
- North America
- California
- Heart
- Soul
- Veil complex
- Rosette
- Pleiades
- Double Cluster
- Rho Ophiuchi

Medium:

- Orion
- Lagoon
- Eagle
- Trifid
- Triangulum
- Pinwheel
- Bode/Cigar pair
- Leo Triplet
- Markarian’s Chain
- Horsehead/Flame

Small:

- Whirlpool
- Sunflower
- Black Eye
- Sombrero
- Hercules
- Ring
- Dumbbell
- Crescent
- Bubble
- Crab

Production record requirements:

- Stable ID
- Names
- RA/Dec/epoch
- Type
- Dimensions
- Position angle
- Core/halo
- Spectral class
- Line relevance
- Brightness class
- Margin
- Sources
- Confidence

Catalog gate requires verified coordinates, dimensions, angle convention, core/halo distinction, classification, and source notes.

## 24. Commercial references

Commercial references separate published facts from engineering assumptions.

### Published-only profile

Only sourced values; unknown remains unknown.

### Engineering-assumption profile

Explicit assumptions for blur, tracking, solve cadence, stack efficiency, readout, and rejection.

#### Seestar S30 Pro reference

Published fields to retain in locked record:

- IMX585
- 2160×3840
- Published 4.6° FOV
- 30 mm
- 160 mm
- f/5.3
- Four-element ED apochromatic lens
- 128 GB eMMC
- 6000 mAh
- Manufacturer battery-life claim
- Alt-az with equatorial mode
- 1.65 kg
- 210×140×80 mm
- UV/IR and light-pollution filters
- OIII/H-alpha bands

Unknown:

- Transmission
- Optical FWHM
- Image circle
- Tracking RMS
- Periodic error
- Backlash
- Solve cadence
- Recenter threshold
- Operating read noise
- Stack efficiency
- Frame rejection
- Motors/gears/encoders

#### DWARF 3 reference

Published fields:

- IMX678
- 3840×2160
- 35 mm
- 150 mm
- Published 3° FOV
- 128 GB eMMC
- 10,000 mAh
- Published tracking runtime
- 60 s maximum in equatorial mode
- Approximately 1.35 kg
- Visible/astro/dual-band filters
- OIII and H-alpha bands
- 340° horizontal and 240° vertical travel

Manufacturer sensor-performance claims are stored as manufacturer claims rather than independent measurements.

Unknown tracking, optical, mechanical, and stack fields remain unknown.

## 25. Reference comparison rules

- No hidden assumptions
- Geometry confidence high/moderate
- Tracking/final-stack unavailable without assumption profile
- Price is volatile and time-stamped or excluded

## 26. Initial component presets

### Sensors P0

- IMX585
- IMX678
- IMX662
- Generic 1/1.2-inch 2.9 µm
- Generic 1/1.8-inch 2.0 µm
- Generic 1/2.8-inch 2.9 µm

P1:

- IMX462
- IMX533
- IMX290
- IMX571
- Raspberry Pi HQ
- Generic phone-class 1.4 µm

### Optics

- 30 mm f/4 and f/5
- 35 mm f/4.3
- 40 mm f/4
- 50 mm f/4 and f/5
- 60 mm f/4, f/5, f/6
- 90 mm f/13.9 Maksutov

### Mounts

P0:

- Ideal alt-az
- Low-cost alt-az
- Closed-loop alt-az
- Ideal equatorial
- Low-cost equatorial

P2:

- Pan-tilt
- Gimbal
- Cartesian
- Equatorial platform
- Generic calibrated

### Motors

- NEMA 8
- NEMA 11
- NEMA 14
- NEMA 17
- Small geared stepper
- Small closed-loop servo
- Custom

### Drivetrains

- 3:1, 5:1, 10:1 belt
- 20:1, 50:1, 100:1 planetary
- 144:1, 180:1, 360:1 worm
- Friction
- Lead screw
- Custom

### Encoders

- 12, 14, 16, 18, 21-bit absolute
- 4096/8192-count incremental
- Custom

Generic presets define resolution, not accuracy or noise.

## 27. Initial recommendation rules

### R-INV-001 Missing optical geometry

Critical; requests minimum missing input.

### R-FRM-001 Target does not fit

Suggest shorter focal length, larger supported sensor, or future mosaic. Suppress larger sensor if image circle is inadequate.

### R-FRM-002 Stack crop clips target

Suggest more margin, shorter session, less dither, or reframing.

### R-SMP-001 Strong oversampling

Suggest shorter focal length, larger pixels, or binning when tracking cannot support the scale.

### R-SMP-002 Severe undersampling

Advisory; suggest longer focal length, smaller pixels, or drizzle, but use gentle wording for wide-field live stacking.

### R-TRK-001 Tracking blur too high

Suggest shorter exposure, better tracking, or shorter focal length.

### R-TRK-002 Periodic error dominates

Suggest shorter exposure, drivetrain improvement, output feedback, or future PEC. Do not recommend bits alone if placement cannot see the error.

### R-TRK-003 Drift dominates

Suggest alignment, recenter cadence, tracking model, or closed loop.

### R-ROT-001 Rotation limits exposure

Suggest shorter exposure, different time, equatorial mode, or smaller field/crop. State registration cannot repair intra-frame rotation.

### R-ZEN-001 Zenith risk

Suggest schedule changes, avoidance, equatorial mode, or reduced correction aggressiveness.

### R-EXP-001 Exposure too short for overhead

Suggest increasing into near-optimal region.

### R-EXP-002 Exposure too long for yield

Suggest shortest exposure within 98% of maximum fixed-session performance.

### R-EXP-003 Broad plateau

Recommend a range and prefer the shorter value.

### R-STK-001 Excessive plate-solving overhead

Suggest lower cadence, larger threshold, or predicted-drift trigger.

### R-STK-002 Excessive dither overhead

Suggest less frequent dither or shorter settle.

### R-STK-003 Low effective integration

Identify the largest lost-time category.

### R-SEN-001 Read-noise-limited frames

Suggest longer exposure when tracking allows.

### R-SEN-002 Mount blocks sensitivity

Explain that mount performance is the active limit.

R4 mechanics rules:

- Insufficient motor speed
- Insufficient torque
- Excessive full-step angle
- Encoder resolution too low
- Encoder in wrong location
- Encoder upgrade has little benefit

## 28. Recommendation ordering

1. Invalid geometry
2. Safety/mechanical failure
3. Framing
4. Intra-frame damage
5. Rejection
6. Lost efficiency
7. Constraint failure
8. Practicality
9. Optional improvement

## 29. Release gates

### R0

Units, result envelope, validation, static optical/sensor calculations, gear/encoder primitives, tests, F01/F02.

### R1

Single-page shell, editing, local save, import/export, target browser, optics, camera, framing, sampling, results rail, 15 provisional targets.

### R2

Target path, alt-az/equatorial, tracking, motion, covariance, rotation, exposure sweep/recommendation, F03–F07.

### R3

Session, acceptance, integration, relative stack, crop, recommendations, locked references, comparison, report, sharing, accessibility, tablet, offline, F08.

### R4

Motors, stages, encoders, torque, mechanics, pan-tilt/gimbal/Cartesian/calibrated mechanism.

### R5

Focus, calibration, compute, storage, power, battery, cost, mass, construction, dew, reliability, full-system report.

## 30. Explicit MVP exclusions

Must not delay R3:

- Full torque curves
- Arbitrary kinematics
- Guiding/periodic log import
- Ray tracing
- Finished-image simulation
- Telescope control
- Shopping/live pricing
- Complete catalogs
- Cloud accounts/sync
- Collaboration/marketplace
- CAD
- Detailed structural/wind simulation
- Monte Carlo weather
- Exact proprietary stacking
- Phone advanced editing
- Native apps

## 31. Traceability matrix

| Capability | Modules | View | Fixtures | Release |
|---|---|---|---|---|
| Focal ratio | Optics | Optics | F01/F02 | R1 |
| Image scale | Camera/optics | Sampling | F01/F02 | R1 |
| FOV | Camera/optics | Framing | F01/F02 | R1 |
| Target fit | Target | Framing | F07 | R1 |
| Sampling | Optics/blur | Sampling | F01/F02 | R1 |
| Target altitude | Astronomy | Scenario/timeline | F04 | R2 |
| Axis rates | Kinematics | Mount | F04 | R2 |
| Tracking path | Tracking | Tracking | F03 | R2 |
| Motion covariance | Blur | Blur | F03 | R2 |
| Rotation | Astronomy/blur | Rotation | F04 | R2 |
| Exposure limit | Exposure/tracking | Exposure | F03/F04 | R2 |
| Duty cycle | Capture | Stack/exposure | F05 | R3 |
| Acceptance | Capture/tracking | Stack | F06 | R3 |
| Integration | Session | Stack/overview | F05/F06 | R3 |
| Relative performance | Sensitivity | Sensitivity | F01/F02/F08 | R3 |
| Recommendations | Rules | Recommendation | F03–F07 | R3 |
| Commercial comparison | Comparison | Comparison | F08 | R3 |
| Motor/torque/encoder | Mechanics | Mount | Future | R4 |
| Focus/compute/power | Respective | Respective | Future | R5 |

## 32. Definition of done

Every story includes:

1. Domain types
2. Validation
3. Calculation
4. Confidence
5. Errors/warnings
6. Formula inspection
7. Unit tests
8. Invariant test
9. UI behavior
10. Accessible text
11. Import/export when persistent
12. Report support when significant
13. Assumption documentation
14. Appropriate numeric precision

## 33. Initial implementation order

1. Units
2. Schema
3. Validation
4. Static optics
5. Sensor geometry
6. Framing
7. Sampling
8. Time/coordinates
9. Target path
10. Alt-az
11. Equatorial
12. Basic tracking
13. Tangent plane
14. Covariance
15. Orientation
16. Rotation
17. Exposure sweep
18. Recommendation
19. Results rail
20. Fixture verification

## 34. Product checkpoints

After R1: Is framing/sampling understandable?

During R2: Is intra-frame vs inter-frame correction clear?

Before R3: Does exposure maximize useful fixed-session output rather than simply favoring longer frames?

Before R4: Is the basic tracking model already useful?

Before R5: Do practical fields influence decisions rather than add form burden?

## 35. Final MVP acceptance scenario

1. Create design.
2. Select Orion.
3. Set suburban scenario.
4. Choose 30 mm/160 mm.
5. Choose IMX585-class sensor.
6. Select alt-az.
7. Enter tracking.
8. Select 20 s.
9. Review framing.
10. Review tracking/rotation.
11. Run sweep.
12. Preview recommendation.
13. Apply it.
14. See integration improve.
15. Compare Seestar and DWARF.
16. Inspect published vs unknown.
17. Export.
18. Reload.
19. Restore.
20. Generate report.

The user must be able to explain fit, exposure limit, what stacking can/cannot fix, why the recommendation is better, and which result depends most on assumptions.
