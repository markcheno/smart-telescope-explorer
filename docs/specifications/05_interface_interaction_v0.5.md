# DIY Smart Telescope Design Explorer
## Interface and Interaction Specification v0.5

## 1. Purpose

This specification defines:

- Single-page workspace layout
- Navigation
- Input controls
- Basic and advanced modes
- Analysis views
- Recommendations
- Comparisons
- Parameter sweeps
- Presets
- Saving and sharing
- Responsive behavior
- Accessibility
- Report layout
- Empty, loading, warning, and error states

## 2. Experience goals

The application should feel like an interactive engineering workbench rather than a long form.

A user should be able to:

1. Start from a known telescope or blank design.
2. Select target and scenario.
3. Adjust optics, camera, mount, and exposure.
4. See results update.
5. Understand success or failure.
6. Receive specific recommendations.
7. Compare alternatives.
8. Produce a printable report.

Exploratory work should be safe and undoable.

## 3. Overall single-page structure

Five persistent regions:

1. Top application bar
2. Left input navigator
3. Central analysis workspace
4. Right results rail
5. Bottom comparison tray

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Application bar                                                            │
├──────────────────┬──────────────────────────────────┬──────────────────────┤
│ Input navigator  │ Analysis workspace               │ Results rail         │
├──────────────────┴──────────────────────────────────┴──────────────────────┤
│ Comparison tray                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

Editing, analysis, comparison, and reporting remain within one application route.

## 4. Top application bar

Left:

- App name/logo
- Current design name
- Save/lock/calculating/invalid status

Center:

- New
- Open
- Duplicate
- Save
- Compare
- Sweep
- Report

Overflow:

- Import/export
- Reset
- Assumptions
- Calculation log

Right:

- Basic/advanced
- Fast/normal/detailed
- Units
- Help
- Settings

## 5. New-design experience

Options:

### Guided design

1. Target
2. Location or altitude
3. Budget
4. Portability
5. Optic or desired FOV
6. Camera
7. Mount
8. Create

### Blank design

Starts with minimum safe defaults and visible assumptions.

### Generic preset

- 30 mm wide-field
- 40 mm
- 50 mm
- Small refractor
- Camera lens
- Experimental two-axis

### Commercial reference

- Open locked
- Compare
- Duplicate to edit

Preview:

- FOV
- Cost category
- Mount
- Intended targets
- Major assumptions

## 6. Left input navigator

Sections:

1. Scenario
2. Target
3. Optics
4. Camera
5. Filter
6. Mount
7. Tracking
8. Focus
9. Capture and stacking
10. Calibration
11. Compute
12. Power
13. Construction
14. Reliability
15. Constraints

Each header shows:

- Completion
- Warning count
- Preset modification
- Reset menu

States:

- Complete
- Uses assumptions
- Missing recommended data
- Invalid
- Not applicable

Opening a section may switch the analysis workspace to the related view unless the view is pinned.

## 7. Input field anatomy

Each engineering input supports:

- Label
- Value or selection
- Unit
- Source/confidence
- Reset
- Help
- Advanced disclosure
- Validation
- Optional uncertainty

Source popover:

- Published
- Measured
- Estimated
- Assumed
- Note
- Confidence
- Uncertainty

## 8. Basic and advanced modes

### Basic mode

- Presets
- Plain-language choices
- Combined error estimates
- Collapsed assumptions
- Recommended defaults

### Advanced mode

- Individual blur sources
- Full sensor characteristics
- Motors/drivetrain
- Encoder placement
- Kinematics
- Error statistics
- Power states
- Calibration
- Provenance

Switching modes preserves all values.

## 9. Scenario section

Basic:

- Location
- Date
- Start
- Duration
- Sky preset
- Seeing
- Wind
- Temperature
- Humidity

Location modes:

- City/postal search
- Coordinates
- Latitude
- Direct alt/az

Advanced:

- Longitude
- Elevation
- Time zone
- Extinction
- Sky brightness
- Transparency
- Moon
- End temperature
- Minimum altitude
- Environmental loss
- Horizon obstruction

Summary:

- Visible duration
- Altitude range
- Airmass range
- Rotation risk

## 10. Target section

Target browser filters:

- Class
- Angular size
- Brightness
- Broadband/emission
- Fits FOV
- Visible
- Recommended

Search:

- Common name
- Catalog ID
- Category

Target cards:

- Name
- ID
- Type
- Dimensions
- Relative brightness
- Spectral class
- Fit
- Visibility

Manual target:

- Name
- RA/Dec
- Width/height
- Position angle
- Type
- Brightness class
- Spectral class

## 11. Optics section

Basic:

- Preset
- Aperture
- Focal length
- Quality preset
- Image circle
- Reducer/extender
- Obstruction

Inline derived:

- Focal ratio
- Effective focal length
- Collecting area

Advanced:

- Transmission
- Reference wavelength
- FWHM
- Spot diameter
- Chromatic blur
- Edge blur
- Vignetting
- Distortion
- Field-curvature note
- Focus coefficient

Conceptual diagram:

- Aperture
- Focal length
- Sensor plane
- Image circle
- Sensor
- Vignetting

## 12. Camera section

Basic:

- Camera/sensor preset
- Dimensions
- Resolution
- Pixel pitch
- Color/mono
- Binning
- Gain preset

Advanced:

- QE
- Read noise
- Dark current
- Full well
- ADC
- Conversion gain
- Temperature
- Readout
- Transfer
- Fixed-pattern noise
- ROI
- Stored bit depth

Preview:

- Sensor
- Pixel grid
- Image circle
- Vignetting
- Target outline

## 13. Filter section

Basic choices:

- None
- UV/IR
- Broadband
- Dual-band
- H-alpha
- OIII
- Custom

Show contextual target suitability.

Advanced:

- Passbands
- Center wavelengths
- Widths
- Transmission
- Target and sky weighting
- Optional passband chart

## 14. Mount section

Architecture cards:

- Alt-az
- German equatorial
- Fork
- Equatorial platform
- Pan-tilt
- Gimbal
- Cartesian-derived
- Generic calibrated

Each card shows setup complexity, polar alignment, rotation behavior, mechanical difficulty, and target suitability.

### Basic mount model

- Tracking RMS
- Periodic error
- Drift
- Backlash
- Settling
- Maximum slew
- Open/closed loop
- Pointing accuracy

### Advanced axis editor

Tabs:

- Axis 1
- Axis 2
- Payload
- Geometry
- Calibration

Each axis:

1. Motor
2. Drivetrain
3. Encoder
4. Mechanics
5. Control

Drivetrain chain:

```text
Motor
  ↓
Stage 1: Belt 16T → 80T   5:1
  ↓
Stage 2: Planetary       20:1
  ↓
Output axis
```

Encoder placement visually shows observable and unobservable errors.

Kinematic status:

- Axis positions
- Tracking rates
- Maximum rates
- Accelerations
- Distance to limits
- Condition
- Singularity risk

## 15. Tracking section

Basic:

- Tracking enabled
- Error model
- Plate-solving interval
- Recenter threshold/duration
- Dithering
- Motion/elongation limits

Advanced:

- Control and encoder update
- Deadband
- Oscillation
- Jitter
- Wind
- Flexure
- Alignment
- Solve accuracy/failure
- Recenter residual
- Recovery

Visually separate:

### During exposure

- Drift
- Periodic error
- Vibration
- Rotation
- Focus

### Between exposures

- Pointing drift
- Recenter
- Dither
- Translation
- Rotation

## 16. Focus section

Basic:

- Manual/motorized
- Focus quality
- Temperature drift preset
- Autofocus
- Interval

Advanced:

- Travel
- Lead
- Steps
- Microsteps
- Reduction
- Backlash
- Repeatability
- Temperature coefficient
- Accuracy
- Duration
- Temperature threshold

Summary:

- Critical focus zone
- Repeatable movement
- Drift
- Blur
- Overhead

## 17. Capture and stacking

Basic:

- Exposure
- Total session
- Gain
- Stack method
- Dither
- Rejection preset

Advanced:

- Frame count
- Readout
- Registration
- Rotation
- Drizzle
- Rejection threshold
- Stack efficiency
- Solve/recenter/dither cadence
- Crop preference

Exposure control:

- Numeric
- Log slider
- Common buttons
- Apply recommendation
- Open sweep

Display recommended range and why.

## 18. Calibration

Options:

- Dark library
- Session darks
- Flats
- Bias/offset
- Bad-pixel map
- Background extraction

Each shows:

- Capture time
- Storage
- Benefit
- Live-stack effect

## 19. Compute

Basic:

- Platform preset
- Memory
- Storage
- Acceleration
- Plate-solving mode

Advanced:

- Throughput
- Plate-solve baseline
- Storage speed
- Average/peak power

Summary:

- Capture interval
- Processing/frame
- Utilization
- Queue
- Memory
- Feasibility

## 20. Power

Basic:

- Battery
- Capacity
- Voltage
- Reserve
- Heater

Advanced:

Per-device power-state table.

Summary:

- Average
- Peak
- Usable energy
- Runtime
- Required capacity
- Parking reserve
- Peak current

## 21. Construction

Component table:

- Component
- Quantity
- Cost
- Mass
- Moving/fixed
- Power
- Fabrication
- Confidence

Summary:

- Cost
- Contingency
- Mass
- Printed/machined parts
- Complexity

Envelope:

- Width/depth/height
- Stored dimensions
- Rotating radius
- Footprint

## 22. Reliability

Controls:

- Solve success
- Recovery
- Stall handling
- Encoder dropout
- Camera disconnect
- Storage full
- Low battery
- Internet dependency
- Local operation
- Safe home
- Watchdog

## 23. Constraints

Constraint cards include:

- Metric
- Threshold
- Hard/soft
- Enable/disable
- Add to sweeps

Status is visible in results.

## 24. Central analysis workspace

Toolbar views:

- Overview
- Framing
- Sampling
- Blur
- Tracking
- Field rotation
- Exposure
- Sensitivity
- Stack
- Mount mechanics
- Session timeline
- Power
- Practicality
- Comparison

The active view may be pinned.

View controls:

- Target time
- Exposure
- Field location
- Conservative/median/worst
- Arcseconds/pixels
- Baseline
- Export image
- Formula
- Assumptions

## 25. Overview

Includes:

- Framing thumbnail
- Balance summary
- Bottleneck
- Recommended exposure
- Blur composition
- Yield
- Reference comparison
- Practicality
- Top recommendations

## 26. Framing view

Canvas:

- Sensor
- Image circle
- Target core/halo
- Orientation
- Margin
- Dither
- Rotation
- Common stack area
- Crop
- Mosaic

Controls:

- Start/mid/end
- Core/halo
- Image circle
- Crop
- Rotation path
- Pixel grid
- Camera rotation
- Center
- Apply framing recommendation

## 27. Sampling view

Show:

- Predicted star profile
- Pixel grid
- Seeing disk
- Diffraction
- Optical blur
- Final sampled profile
- Pixels/FWHM

Controls:

- Center/edge
- Base/final blur
- Exposure
- Binning
- Compare

## 28. Blur-budget view

Horizontal contributions:

- Seeing
- Diffraction
- Optical
- Focus
- Tracking
- Vibration
- Rotation
- Registration
- Pixel response

Show star ellipse with major/minor FWHM and orientation.

Selecting a contribution highlights related inputs and improvement potential.

## 29. Tracking view

- Star path
- X/Y error vs time
- Ideal and component overlays
- Median/95th/worst phase
- Maximum/RMS displacement
- Path length
- Major/minor blur
- Dominant component

## 30. Field-rotation view

- Sensor vectors at center/mid/corners/target
- Exposure duration
- Session time
- Target altitude
- Animation
- Rotation rate over session
- Corner motion over session
- Exposure limit over session
- Zenith/singularity warning

## 31. Exposure analysis

Chart x-axis: exposure.

Selectable y metrics:

- Final stack quality
- Integration
- Acceptance
- Tracking blur
- Rotation
- Read-noise fraction
- Saturation
- Duty cycle

Highlight:

- Hard failure
- Marginal
- Recommended
- Diminishing returns
- Current exposure

Candidate table and apply actions.

## 32. Sensitivity view

Compare:

- Point-source throughput
- Extended signal/pixel
- Signal/resolution element
- Accepted integration
- Final stack

Show absolute SNR only when data is sufficient.

Optional filter overlays.

## 33. Stack view

- Attempted/accepted frames
- Integration
- Rejection causes
- Crop
- Coverage
- SNR growth
- Preview time
- Diminishing returns
- Wall-clock allocation

## 34. Mount mechanics

Per axis:

- Position/rate/acceleration
- Full step
- Microstep
- Encoder
- Mechanical accuracy
- Torque margin
- Backlash
- Periodic error

Resolution ladder and drivetrain diagram.

## 35. Session timeline

Events:

- Exposures
- Readout
- Solve/recenter
- Dither
- Autofocus
- Meridian flip
- Rejection
- Recovery

Secondary plots:

- Altitude
- Airmass
- Rotation
- Focus
- Battery
- Storage

## 36. Power view

- Power by device/state
- Battery over time
- Average/peak
- Heater contribution
- Required capacity with reserve and parking

## 37. Practicality view

Compare:

- Cost
- Mass
- Moving mass
- Runtime
- Volume
- Setup
- Build
- Calibration
- Reliability

Primary display uses labeled values, not an opaque radar score.

## 38. Persistent results rail

Cards:

1. Design status
2. Target fit
3. Image scale
4. Relative sensitivity
5. Final blur
6. Recommended exposure
7. Acceptance
8. Integration
9. Crop
10. Cost
11. Weight
12. Runtime
13. Bottleneck
14. Recommendation

Statuses:

- Good
- Marginal
- Poor
- Invalid
- Unknown

Cards expand to explanation, formula, inputs, confidence, comparison, recommendation, and analysis view.

## 39. Recommendation panel

Card contains:

- Severity
- Problem
- Suggested change/range
- Improvement
- Tradeoff
- Next bottleneck
- Confidence

Actions:

- Preview
- Apply
- Duplicate and apply
- Sweep
- Dismiss
- Accept intentionally
- Add spec to constraints

Preview compares current and proposed design without modification.

## 40. Comparison tray

Collapsed:

- Pinned count
- Baseline
- Open action

Expanded cards:

- Name
- Identifier
- Reference/custom
- Primary metric
- Remove
- Duplicate
- Set baseline

Maximum: four.

Shared locks:

- Scenario
- Target
- Duration
- Exposure
- Budget
- Weight
- Mount
- Filter

Comparison views:

- Summary
- Geometry
- Blur
- Exposure
- Sensitivity
- Mount
- Power
- Cost
- Recommendations

## 41. Parameter-sweep workflow

Setup:

- One/two variables
- Min/max
- Samples/step
- Linear/log
- Constraints
- Optimization metric
- Detail

Metrics:

- Stack quality
- Integration
- Blur
- Cost
- Mass
- Acceptance
- Runtime
- Balanced feasible region

Execution:

- Progress
- Cancel
- Continue inspecting current design
- Preserve partial results

Results:

- Line chart or heat map
- Constraint boundaries
- Invalid regions
- Recommended region
- Current point
- Candidate point

Apply:

- Preview
- Apply
- Duplicate
- Pin

## 42. Saving and version history

- Autosave
- Saving/saved/error status
- Undo/redo
- Meaningful transaction grouping
- Optional named snapshots

Results are recalculated after undo.

## 43. Import, export, and share

JSON:

- Complete design
- Comparison set
- Without cache
- With source notes

CSV:

- Summary
- Exposure sweep
- Session frames
- Comparison
- Components
- Power

Share URL:

- Inputs
- Preset versions
- Baseline
- Optional selected view

Warn before sharing exact coordinates. Allow rounding/removal.

## 44. Detailed report

Cover:

- Name
- Version
- Date
- Target
- Scenario
- Baseline
- Status

Executive summary:

- Intended use
- Strengths
- Limitations
- Recommended exposure
- Yield
- Integration
- Top recommendations

Sections:

- System overview
- Performance
- Mount engineering
- Practicality
- Assumptions/confidence
- Recommendations
- Full input/component/formula appendix

## 45. Responsive behavior

### Large desktop

Fixed left, center, right, bottom.

### Laptop

Narrow side panels; collapsible results/input.

### Tablet landscape

Input and results drawers; full-width center; collapsible comparison.

### Tablet portrait

Center-first; tabs/drawers; stacked charts; landscape suggestion for advanced mount.

### Phone

View/open, overview, report, common values, recommendation, comparison summary.

No full drivetrain editor or dense sweeps.

## 46. Accessibility

- Keyboard navigation
- Focus indicators
- Screen-reader labels
- High contrast
- Reduced motion
- Non-color status
- Scalable text
- Large touch targets
- Text summaries and data tables for charts

## 47. Keyboard behavior

Suggested shortcuts:

- Cmd/Ctrl+S save
- Cmd/Ctrl+Z undo
- Cmd/Ctrl+Shift+Z redo
- Cmd/Ctrl+D duplicate
- Cmd/Ctrl+K command search
- F framing
- B blur
- T tracking
- E exposure
- C comparison
- R recommendations
- ? help

## 48. Command search

Commands and parameters:

- Open section/view
- Change target
- Select preset
- Run sweep
- Compare reference
- Apply exposure
- Export report
- Find parameter
- Show invalid inputs

## 49. Help system

Inline help plus expanded side panel:

- Plain explanation
- Formula
- Diagram
- Typical values
- Common mistakes
- Related inputs
- Recommendations

Formula inspector shows formula, substituted values, result, unit conversion, assumptions, and confidence.

## 50. Warning and error behavior

Validation errors:

- Mark field/section/result
- Explain correction
- Never silently replace

Engineering warnings are non-blocking.

Global banner only for major failures.

## 51. Loading and calculation states

Static geometry updates immediately.

Detailed calculations are debounced and keep prior results visible as stale.

Long sweeps show progress, support cancel, and preserve partial results.

## 52. Empty states

Examples:

- No target
- No mount
- No comparison
- Absolute SNR unavailable

Each empty state includes a direct action.

## 53. Preset interactions

Selector supports:

- Search
- Category
- Key spec
- Recent
- Favorites

Preview changes, overrides, missing data, confidence, and compatibility.

Apply modes:

- Replace section
- Fill empty
- Duplicate and apply
- Cancel

Modified presets remain linked to origin and list changed fields.

## 54. Locked references

- Read-only badge
- Disabled editing
- Formula/source inspection
- Comparison
- Duplication

## 55. Calculation transparency

Global assumptions drawer lists:

- Defaults
- Low-confidence inputs
- Derived estimates
- Missing recommended values
- Disabled models
- Simplifications

Filter by subsystem.

## 56. Design-quality indicators

Independent ratings:

- Framing
- Sampling
- Tracking
- Stack efficiency
- Target suitability
- Power
- Compute
- Practicality
- Reliability

Each is expandable. No single overall score.

## 57. Onboarding

Optional walkthrough:

1. Select target
2. Choose optics/camera
3. Choose mount or tracking
4. Adjust exposure
5. Review bottleneck
6. Compare reference

## 58. Interface acceptance criteria

A first-time builder can:

1. Create a design without advanced knowledge.
2. Determine target fit.
3. Understand image scale.
4. See why exposure is too long.
5. Distinguish intra-frame vs inter-frame correction.
6. Evaluate motor/gearing.
7. Understand encoder placement.
8. See overhead cost.
9. Compare a reference.
10. Apply a recommendation and understand tradeoff.
11. Undo.
12. Generate a readable report.

An expert can inspect all assumptions, formulas, provenance, confidence, error components, session timeline, and sweeps.
