# DIY Smart Telescope Design Explorer
## Specification Addendum and MVP Definition v0.3

## 1. Finalized product decisions

### Intended audience

The application will be understandable to general DIY telescope builders, including users without a strong astrophotography or motion-control background.

Every major result must include:

- Plain-language interpretation
- Warning thresholds
- Explanation of the limiting factor
- Suggested corrective action
- Access to formula and assumptions

### Mount modeling

Two levels:

#### Basic mount model

Users may directly enter:

- Tracking RMS
- Periodic error
- Backlash
- Drift
- Settling time
- Maximum slew rate
- Vibration
- Plate-solving accuracy

#### Advanced mount model

Users may define:

- Motors
- Gear stages
- Belt or worm reductions
- Encoders
- Payload
- Axis inertia
- Mechanical errors
- Controller behavior
- Tracking update rate

### Mount architectures

Version 1 will use predefined two-axis mechanisms rather than arbitrary formulas.

Initial types:

- Alt-azimuth
- German equatorial
- Fork equatorial
- Equatorial platform
- Pan-tilt
- Gimbal
- Cartesian-derived two-axis
- Generic calibrated two-axis

The generic calibrated mechanism uses position tables with:

- Axis positions
- Sky coordinates
- Local resolution
- Required rates
- Singular or invalid regions

### Target support

- Curated catalog of common targets
- Manual target entry
- Location/date/time or direct altitude/azimuth

### Sensitivity

The first version emphasizes relative performance:

- Relative signal collection
- Relative extended-object imaging speed
- Relative point-source sensitivity
- Relative final stacked SNR
- Time for one design to match another
- Relative frame yield

### Practical design analysis

Include:

- Cost
- Weight
- Moving mass
- Physical size
- Average and peak power
- Battery capacity and runtime
- Compute
- Storage
- Build complexity
- Setup complexity
- Calibration complexity
- Portability

### Optical quality

Initial representations:

- Star FWHM
- Spot diameter
- Optical quality preset
- Unknown with reduced confidence

### Recommendations

Recommendations will specify required characteristics before specific products.

Examples:

- Output-axis encoder with at least 15-bit effective resolution
- Focal length around 160–190 mm
- Motor with at least 0.35 N·m after margin
- Exposure below 14 seconds
- Battery at least 80 Wh
- Encoder moved downstream of gearbox

### Commercial reference designs

References are locked. Users may view, compare, and duplicate them. A duplicate becomes editable while preserving the original reference.

### Reporting

The first report is a detailed print-friendly browser report containing:

- Design summary
- Scenario
- Inputs
- Assumptions
- Confidence
- Results
- Tracking and blur budgets
- Charts
- Warnings
- Recommendations
- Cost, power, weight, and runtime
- Reference comparison

### Supported devices

Full editor:

- Desktop
- Laptop
- Tablet landscape

Phones:

- Open shared designs
- View summaries and reports
- Make simple changes

### Measured tracking data

Tracking-log and measured-axis-error import are deferred.

## 2. Additional practical subsystems

### 2.1 Focusing system

Inputs:

- Manual or motorized focus
- Focuser travel
- Motor step size
- Reduction
- Backlash
- Repeatability
- Temperature coefficient
- Initial focus error
- Autofocus interval and duration
- Focus-star requirement

Outputs:

- Critical focus tolerance
- Focus resolution
- Adequacy
- Blur from focus error
- Drift during session
- Autofocus overhead
- Recommended cadence
- Backlash warning

### 2.2 Dew and thermal control

Inputs:

- Ambient temperature
- Relative humidity
- Dew point
- Optic temperature
- Dew shield
- Heater
- Heater power and duty cycle
- Airflow
- Electronics heat

Outputs:

- Dew risk
- Recommended heater power
- Battery impact
- Focus impact
- Condensation warning
- Thermal warning

### 2.3 Calibration frames and sensor corrections

Supported:

- None
- Dark library
- Session darks
- Bias/offset
- Flats
- Bad-pixel map
- Hot-pixel rejection
- Background extraction
- Vignetting correction

Outputs:

- Setup overhead
- Storage overhead
- Relative benefit
- Calibration recommendation
- Remaining fixed-pattern-noise penalty
- Processing impact

### 2.4 Initial alignment and commissioning

Inputs:

- Optical-axis alignment
- Camera rotation and tilt
- Mount orthogonality
- Axis-zero calibration
- Leveling
- Home repeatability
- Encoder index
- Backlash calibration
- Plate-solve model

Outputs:

- Initial pointing uncertainty
- Plate-solve search area
- Expected centering attempts
- Calibration difficulty
- Tracking-model error
- Alignment bottleneck warning
- Derived commissioning checklist

### 2.5 Reliability and failure handling

Inputs:

- Plate-solve success rate
- Frame-transfer failure
- Motor-stall risk
- Encoder dropout handling
- Lost-tracking recovery
- Battery reserve
- Storage reserve
- Network dependency
- Remote-control dependency
- Unattended duration

Outputs:

- Interrupted-session risk
- Recovery capability
- Required margins
- Single points of failure
- Fail-safe recommendations

### 2.6 Cable management

Inputs:

- Number of moving cables
- Cable stiffness
- Routing
- Slip ring
- Axis rotation
- Cable-loop radius
- Camera cable attachment

Outputs:

- Cable-drag risk
- Axis-wrap risk
- Travel limits
- Torque penalty
- Routing recommendation

### 2.7 Wind and structural stability

Consider:

- Tripod stiffness
- Mount stiffness
- OTA stiffness
- Focuser and camera attachment stiffness
- Center of gravity
- Wind area
- Damping time

Outputs:

- Wind sensitivity
- Settling time
- Exposure risk
- Structural bottleneck
- Payload or wind limit

## 3. Final MVP feature groups

### Group A: Observing scenario

- Location/date/time
- Direct altitude/azimuth
- Seeing
- Sky brightness
- Transparency
- Moonlight
- Temperature
- Humidity
- Wind
- Session duration

### Group B: Target

- Curated catalog
- Manual entry
- Angular dimensions
- Type
- Coordinates
- Position angle
- Spectral class

### Group C: Optics

- Aperture
- Focal length and ratio
- Transmission
- Obstruction
- Image circle
- Vignetting
- Optical quality
- Filter
- Focus
- Dew control

### Group D: Camera

- Sensor dimensions
- Resolution
- Pixel pitch
- QE
- Read noise
- Dark current
- Full well
- Gain
- ADC depth
- Readout
- Sensor temperature
- Calibration

### Group E: Mount

- Predefined architectures
- Generic calibrated mechanism
- Basic measured-error model
- Advanced motor/gear/encoder model
- Payload and balance
- Cable drag
- Structural stability

### Group F: Tracking and automation

- Tracking during exposure
- Plate solving
- Recenter
- Dither
- Settle
- Rejection
- Recovery
- Commissioning

### Group G: Capture and stacking

- Exposure
- Gain
- Frame count
- Total session
- Stack method
- Registration
- Rotation correction
- Crop
- Yield
- Calibration overhead

### Group H: Practicality

- Cost
- Weight
- Dimensions
- Power
- Battery
- Storage
- Compute
- Thermal management
- Complexity
- Reliability
- Portability

### Group I: Analysis

- Framing
- Sampling
- Blur
- Tracking
- Field rotation
- Mount resolution
- Relative sensitivity
- Frame yield
- Stack efficiency
- Power
- Cost
- Bottlenecks

### Group J: Recommendations

- Prioritized changes
- Expected benefit
- Tradeoff
- Next bottleneck
- Required specifications
- Low-value changes
- Counterproductive warnings

### Group K: Comparison and reporting

- Up to four designs
- Locked scenario
- Locked references
- Sweeps
- Difference table
- Printable report
- JSON/CSV export
- Shareable URL

## 4. Recommended application organization

### 4.1 Design header

- Name
- New
- Duplicate
- Save
- Import
- Export
- Reference selector
- Basic/advanced
- Compare
- Report

### 4.2 Input navigator

1. Scenario
2. Target
3. Optics
4. Camera
5. Mount
6. Tracking
7. Capture
8. Compute and power
9. Cost and construction

### 4.3 Analysis workspace

- Framing
- Sampling
- Blur
- Tracking
- Field rotation
- Sensitivity
- Exposure
- Stack
- Mount mechanics
- Power
- Practicality

### 4.4 Persistent result rail

- Target fit
- FOV
- Image scale
- Relative sensitivity
- Blur
- Recommended exposure
- Frame acceptance
- Effective integration
- Cost
- Weight
- Runtime
- Bottleneck
- Recommendation

### 4.5 Comparison tray

- Select baseline
- Lock shared parameters
- Side-by-side comparison
- Remove
- Duplicate
- Apply parameter change

## 5. Recommendation-engine rules

Priority order:

1. Invalid or impossible conditions
2. Intra-frame image damage
3. Lost integration efficiency
4. Practicality limitations
5. Optional improvements

The app should resolve higher-priority limitations before suggesting lower-priority upgrades.

## 6. Confidence model

Every important result receives:

- High
- Moderate
- Low
- Unknown

High-confidence examples:

- FOV
- Image scale
- Nominal gear ratio
- Data storage

Moderate examples:

- Relative sensitivity
- Battery runtime
- Focus drift
- Compute feasibility

Low examples:

- Frame acceptance
- Wind performance
- Settling time
- Actual tracking RMS

## 7. Locked reference behavior

References have:

- Version
- Source notes
- Known and estimated specifications
- Confidence indicators
- Review date
- Immutable baseline values

A duplicate becomes editable and records its origin.

## 8. Explicit non-goals for version 1

Version 1 will not:

- Predict exact finished images
- Replace optical-design software
- Replace FEA
- Simulate a complete control loop
- Guarantee tracking performance
- Support arbitrary formulas
- Import tracking logs
- Retrieve live pricing
- Generate CAD
- Control a telescope
- Require cloud accounts
- Require internet after assets are loaded

## 9. MVP completion criteria

The user can:

1. Select a target and scenario.
2. Select or define optics and camera.
3. Select a standard or predefined custom mount.
4. Use basic or advanced tracking.
5. Calculate framing and sampling.
6. Estimate optical, tracking, and rotation blur.
7. Compare exposures.
8. Estimate relative stacked performance.
9. Estimate frame rejection and integration.
10. Evaluate motor, gearing, and encoder suitability.
11. Evaluate focus, dew, power, compute, storage, and structure.
12. Receive prioritized recommendations.
13. Compare with locked commercial references.
14. Compare up to four custom designs.
15. Save, share, import, and export.
16. Produce a detailed report.
