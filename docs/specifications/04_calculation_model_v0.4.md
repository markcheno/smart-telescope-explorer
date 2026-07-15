# DIY Smart Telescope Design Explorer
## Calculation Model and Data Specification v0.4

## 1. Purpose

This document defines:

- Canonical units
- Core data objects
- Input and output fields
- Preset behavior
- Calculation order
- Mathematical models
- Confidence propagation
- Validation rules
- Recommendation-engine inputs
- Parameter-sweep behavior
- Technical acceptance tests

The calculation engine should remain independent of the user interface. A design loaded from JSON, entered through the interface, or duplicated from a reference preset must produce the same calculated results.

## 2. Model boundaries

The application is an engineering estimator.

It will model:

- Optical geometry
- Sensor sampling
- Approximate optical resolution
- Target framing
- Atmospheric effects
- Standard and predefined two-axis mount kinematics
- Motor and drivetrain resolution
- Encoder resolution and placement
- Tracking errors during exposures
- Field rotation
- Capture overhead
- Frame acceptance
- Live-stack integration
- Relative sensitivity
- Approximate photometric performance when enough data exists
- Focusing
- Dew risk
- Compute and storage load
- Electrical power
- Cost, weight, and build complexity

It will not model:

- Full optical ray tracing
- Detailed structural deformation
- Exact wind loading
- Exact motor-controller dynamics
- Proprietary image-processing quality
- Exact finished-image appearance
- Precise component manufacturing tolerances unless supplied by the user
- Arbitrary user-written mount kinematics

## 3. Canonical unit system

| Quantity | Internal unit |
|---|---|
| Linear optical dimensions | millimeters |
| Pixel dimensions | micrometers |
| Physical mechanism dimensions | millimeters |
| Angular position | radians |
| User-facing sky angle | degrees or arcseconds |
| Angular velocity | radians per second |
| Angular error | arcseconds |
| Time | seconds |
| Exposure | seconds |
| Mass | kilograms |
| Torque | newton-meters |
| Moment of inertia | kilogram-meter² |
| Power | watts |
| Energy | watt-hours |
| Voltage | volts |
| Current | amperes |
| Temperature | degrees Celsius |
| Wavelength | nanometers |
| Data size | bytes |
| Sky brightness | magnitudes per square arcsecond |
| Read noise | electrons RMS |
| Dark current | electrons per pixel per second |
| Full well | electrons |
| Quantum efficiency | fraction |
| Optical transmission | fraction |
| Probability | fraction |
| Cost | amount plus currency code |

### 3.1 Explicit error statistics

Supported forms:

- RMS
- One-sigma
- Peak
- Peak-to-peak
- Maximum absolute
- Median
- 95th percentile
- Deterministic rate

The app must not silently interpret peak-to-peak periodic error as RMS.

### 3.2 Angle conventions

- Azimuth clockwise from true north
- Altitude upward from horizon
- Position angle from celestial north toward east
- Hour angle positive west of meridian
- Sensor X rightward
- Sensor Y upward in the model

## 4. Common value metadata

Each important input should contain:

- Value
- Unit
- Source type
- Confidence
- Optional uncertainty
- Source note
- User override flag
- Last modified timestamp

Source types:

- Published
- Measured
- Estimated
- Assumed
- Derived

Confidence is a trust label, not a statistical probability.

## 5. Top-level data model

A design contains:

- Schema version
- Design ID
- Name and metadata
- Origin reference
- Scenario
- Target
- Optics
- Camera
- Filter
- Mount
- Tracking
- Focus
- Capture
- Calibration
- Compute
- Power
- Construction
- Reliability
- Constraints
- Notes

Calculated results are regenerated rather than stored as authoritative inputs.

## 6. Scenario data model

Modes:

1. Location/date/time plus celestial target
2. Latitude plus direct altitude/azimuth
3. Generic fixed target position
4. Session start/end simulation

Fields:

| Field | Default |
|---|---|
| Session duration | 60 minutes |
| Minimum altitude | 20° |
| Seeing | 2.5 arcsec |
| Transparency | 0.85 |
| Temperature | 10°C |
| Relative humidity | 60% |
| Wind | 1 m/s |
| Environmental frame loss | 0 |

Atmospheric throughput:

\[
T_{\text{atmosphere}}
=
10^{-0.4k(X-1)}
\]

where \(k\) is extinction and \(X\) is airmass.

## 7. Target data model

Identity:

- Target ID
- Common name
- Catalog aliases
- Type
- RA/Dec
- Coordinate epoch
- Position angle
- Confidence

Geometry supports:

- Point
- Circle
- Ellipse
- Rectangle
- Polygon
- Multiple regions

Fields:

- Angular width and height
- Position angle
- Recommended margin
- Bright-core dimensions
- Extended-halo dimensions

Brightness may include:

- Integrated magnitude
- Average surface brightness
- Peak surface brightness
- Broadband class
- H-alpha class
- OIII class
- Continuum/line fractions

Target classifications:

- Large, medium, or small extended
- Point-source dominated
- High or low surface brightness
- Broadband
- Emission-line
- Mixed

## 8. Optical-system model

Core fields:

- Clear aperture
- Native focal length
- Central obstruction
- Optical transmission
- Image circle
- Reference wavelength
- Optical blur representation
- Chromatic blur
- Edge blur
- Distortion
- Reducer and extender

Effective focal length:

\[
f_{\text{effective}}
=
f_{\text{native}}
\times
M_{\text{reducer}}
\times
M_{\text{extender}}
\]

Clear collecting area:

\[
A_{\text{clear}}
=
\frac{\pi}{4}
\left(
D^2-d_{\text{obstruction}}^2
\right)
\]

Effective collecting area:

\[
A_{\text{effective}}
=
A_{\text{clear}}
\times
T_{\text{optics}}
\]

Focal ratio:

\[
N =
\frac{f_{\text{effective}}}{D}
\]

Airy first-minimum angular radius:

\[
\theta_{\text{Airy radius}}
=
1.22\frac{\lambda}{D}
\]

Approximate diffraction FWHM:

\[
\theta_{\text{diffraction FWHM}}
\approx
1.028\frac{\lambda}{D}
\]

Spot diameter conversion:

\[
\theta_{\text{spot}}
=
206.265
\frac{s_{\mu m}}{f_{mm}}
\]

Vignetting models:

- None
- Linear falloff
- Radial polynomial
- Center/corner transmission
- Sampled radial table

## 9. Camera and sensor model

Geometry:

- Sensor width/height
- Horizontal/vertical pixels
- Pixel pitch X/Y
- Active fraction
- Color/mono
- Bayer pattern
- Binning
- ROI

Performance:

- QE
- Read noise
- Dark current
- Full well
- ADC depth
- Conversion gain
- Temperature
- Readout
- Transfer overhead
- Fixed-pattern noise
- Hot-pixel rate

Image scale:

\[
s_x =
206.265
\frac{p_x}{f}
\]

\[
s_y =
206.265
\frac{p_y}{f}
\]

Exact FOV:

\[
FOV_x
=
2\arctan
\left(
\frac{w}{2f}
\right)
\]

\[
FOV_y
=
2\arctan
\left(
\frac{h}{2f}
\right)
\]

Frame size:

\[
B_{\text{frame}}
=
N_{\text{pixels}}
\times
\frac{\text{stored bits per pixel}}{8}
\]

## 10. Filter and passband model

Each passband contains:

- Center wavelength
- Effective width
- Peak and average transmission
- Target spectral weight
- Sky spectral weight

Combined response:

\[
R_i
=
T_{\text{optics},i}
\times
T_{\text{filter},i}
\times
QE_i
\times
T_{\text{atmosphere},i}
\]

Target and sky responses are calculated separately.

## 11. Focus model

Fields:

- Manual/motorized
- Travel
- Steps/revolution
- Microsteps
- Travel/revolution
- Reduction
- Backlash
- Repeatability
- Temperature coefficient
- Initial offset
- Autofocus interval
- Temperature threshold
- Autofocus duration
- Measurement error

Movement resolution:

\[
\Delta z_{\text{step}}
=
\frac{\text{travel per revolution}}
{\text{motor steps}
\times
\text{microsteps}
\times
\text{reduction}}
\]

Critical focus-zone half-width:

\[
CFZ_{\text{half}}
\approx
2\lambda N^2
\]

Recommended repeatable movement:

\[
\Delta z_{\text{repeatable}}
\leq
\frac{CFZ_{\text{half}}}{3}
\]

Approximate defocus circle:

\[
c
\approx
\frac{|\Delta z|}{N}
\]

Equivalent Gaussian FWHM:

\[
FWHM_{\text{defocus}}
\approx
0.59c
\]

Temperature drift:

\[
\Delta z_{\text{temperature}}
=
K_T
\left(
T_{\text{current}}-T_{\text{focus}}
\right)
\]

## 12. Mount data model

A mount contains:

- Architecture
- Coordinate transform
- Camera-roll model
- Axis records
- Payload
- Balance model
- Mechanical limits
- Home position
- Zenith avoidance
- Meridian behavior
- Basic/advanced detail level

Each axis contains:

- Name and role
- Range
- Speed and acceleration
- Motor
- Drivetrain
- Encoder
- Bearing error
- Compliance
- Friction
- Backlash
- Periodic error
- Balance offset
- Inertia
- Cable drag
- Control settings

## 13. Motor and drivetrain calculations

Motor fields:

- Type
- Steps/revolution
- Step angle
- Microsteps
- Holding torque
- Dynamic torque
- Maximum speed
- Rotor inertia
- Power
- Driver efficiency

Drivetrain stage:

- Type
- Tooth/pulley counts or explicit ratio
- Efficiency
- Backlash
- Periodic error
- Eccentricity
- Compliance
- Reversal behavior

Total ratio:

\[
R_{\text{total}}
=
\prod_i R_i
\]

Total efficiency:

\[
\eta_{\text{total}}
=
\prod_i \eta_i
\]

Full-step output increment:

\[
\theta_{\text{full step}}
=
\frac{360^\circ}
{N_{\text{steps}}R_{\text{total}}}
\]

Theoretical microstep increment:

\[
\theta_{\text{microstep}}
=
\frac{\theta_{\text{full step}}}
{N_{\text{microsteps}}}
\]

Required motor rate:

\[
RPM_{\text{motor}}
=
\frac{\omega_{\text{axis}}R_{\text{total}}}
{2\pi}
\times 60
\]

Axis torque:

\[
\tau_{\text{axis}}
=
\tau_{\text{gravity}}
+
\tau_{\text{acceleration}}
+
\tau_{\text{friction}}
+
\tau_{\text{cable}}
\]

Gravity term:

\[
\tau_{\text{gravity}}
=
mgr\sin\phi
\]

Acceleration term:

\[
\tau_{\text{acceleration}}
=
I\alpha
\]

Motor torque:

\[
\tau_{\text{motor}}
=
\frac{\tau_{\text{axis}}}
{R_{\text{total}}\eta_{\text{total}}}
\times
S_F
\]

Default safety factor: 2.0.

## 14. Encoder model

Fields:

- Type
- Resolution bits/counts
- Placement
- Interpolation
- Noise
- Update rate
- Latency
- Absolute accuracy
- Repeatability
- Dropout rate
- Downstream stages

Nominal increment:

\[
\theta_{\text{encoder}}
=
\frac{360^\circ}{2^b}
\]

Upstream encoder output increment:

\[
\theta_{\text{output}}
=
\frac{\theta_{\text{encoder}}}{R_{\text{downstream}}}
\]

Nominal and effective precision must be displayed separately.

## 15. Predefined mount kinematics

Each mechanism supplies:

- Sky-to-axis transform
- Axis-to-sky transform
- Camera orientation
- Axis-rate and acceleration calculation
- Range checks
- Singularity checks

Numerical rate:

\[
\dot q
\approx
\frac{q(t+\Delta t)-q(t-\Delta t)}
{2\Delta t}
\]

Numerical acceleration:

\[
\ddot q
\approx
\frac{q(t+\Delta t)-2q(t)+q(t-\Delta t)}
{\Delta t^2}
\]

Local error relationship:

\[
\delta s
=
J\delta q
\]

Outputs:

- Sky movement per axis increment
- Mechanical advantage
- Required precision
- Condition number
- Singularity warning

## 16. Generic calibrated two-axis mechanism

Calibration samples contain:

- Axis 1/2 positions
- Altitude/azimuth
- Optional roll angle
- Optional local resolution
- Validity
- Confidence

The engine must:

- Interpolate only within supported regions
- Reject extrapolation
- Detect sparse/inconsistent samples
- Calculate local derivatives
- Mark poorly covered regions low confidence

## 17. Tracking-error model

Components:

- Constant drift
- Periodic error
- Step quantization
- Encoder quantization
- Controller deadband
- Oscillation
- Random jitter
- Vibration
- Eccentricity
- Backlash
- Flexure
- Wind
- Cable drag
- Recenter residual
- Alignment error

Each component declares whether it is deterministic, periodic, random, position-dependent, speed-dependent, or direction-dependent.

Basic mode accepts aggregate tracking quantities. Advanced mode derives them.

## 18. During-exposure motion simulation

The engine models star movement in a local tangent plane.

Sampling:

- Enough samples for fastest periodic component
- Minimum 128 or 256 samples
- Browser-performance cap
- High-frequency jitter may be analytic

Unknown periodic phase:

- 24 phases in normal mode
- 72 in detailed mode

Report:

- Median
- 95th percentile
- Worst sampled result

For each time sample:

1. Calculate ideal axis position.
2. Add axis errors.
3. Transform through local Jacobian.
4. Add sky-frame errors.
5. Record tangent-plane position.

## 19. Blur and elongation model

Convert FWHM to sigma:

\[
\sigma
=
\frac{FWHM}{2.355}
\]

Base isotropic variance:

\[
\sigma_{\text{base}}^2
=
\sum_i \sigma_i^2
\]

Motion covariance:

\[
C_{\text{motion}}
=
\frac{1}{n}
\sum_i
(r_i-\bar r)(r_i-\bar r)^T
\]

Pixel variance:

\[
\sigma_{\text{pixel}}^2
=
\frac{s^2}{12}
\]

Total covariance:

\[
C_{\text{total}}
=
C_{\text{base}}
+
C_{\text{motion}}
+
C_{\text{field rotation}}
+
C_{\text{pixel}}
\]

Major/minor FWHM:

\[
FWHM_{\text{major}}
=
2.355\sqrt{\lambda_{\text{major}}}
\]

\[
FWHM_{\text{minor}}
=
2.355\sqrt{\lambda_{\text{minor}}}
\]

Elongation:

\[
E =
\frac{FWHM_{\text{major}}}
{FWHM_{\text{minor}}}
\]

Suggested initial thresholds:

| Result | Good | Marginal | Poor |
|---|---|---|---|
| Motion | <0.5 px | 0.5–1 px | >1 px |
| Elongation | <1.10 | 1.10–1.25 | >1.25 |
| Tracking contribution | <25% of base FWHM | 25–60% | >60% |
| Corner rotation | <0.5 px | 0.5–1 px | >1 px |

## 20. Field rotation

At each time:

1. Calculate target center in horizontal coordinates.
2. Calculate a nearby point toward celestial north.
3. Project both into the tangent plane.
4. Measure celestial north relative to camera vertical.
5. Unwrap angle over time.

Exposure rotation:

\[
\Delta\theta
=
\theta(t_{\text{end}})
-
\theta(t_{\text{start}})
\]

For field position \(r\):

\[
r_{\text{rotated}}(t)
=
R(\theta(t))r
\]

\[
\Delta r(t)
=
r_{\text{rotated}}(t)-r
\]

Evaluate center, mid-field, corners, target centroid, and selected point.

Stack crop is calculated by intersecting transformed frame polygons.

## 21. Equatorial tracking

Inputs:

- Polar-axis altitude/azimuth error
- RA periodic error
- Declination backlash
- Declination drift
- Cone error
- Flexure
- Meridian limit
- Flip duration and settle
- Recenter accuracy

Advanced polar-alignment drift should be calculated numerically from a misaligned mount coordinate frame.

## 22. Sampling classification

Reference PSF:

\[
FWHM_{\text{reference}}
=
\sqrt{
FWHM_{\text{seeing}}^2
+
FWHM_{\text{diffraction}}^2
+
FWHM_{\text{optics}}^2
+
FWHM_{\text{focus}}^2
}
\]

Pixels across FWHM:

\[
P =
\frac{FWHM_{\text{reference}}}
{\text{image scale}}
\]

| Pixels/FWHM | Classification |
|---|---|
| <1.0 | Strongly undersampled |
| 1.0–1.5 | Moderately undersampled |
| 1.5–3.0 | Well matched |
| 3.0–5.0 | Oversampled |
| >5.0 | Strongly oversampled |

## 23. Relative sensitivity

Point-source throughput:

\[
Q_{\text{point}}
\propto
A_{\text{effective}}
\times
QE_{\text{effective}}
\times
T_{\text{filter,target}}
\]

Extended-object signal per pixel:

\[
Q_{\text{extended,pixel}}
\propto
A_{\text{effective}}
\times
\Omega_{\text{pixel}}
\times
QE_{\text{effective}}
\times
T_{\text{filter,target}}
\]

where:

\[
\Omega_{\text{pixel}}
=
s_xs_y
\]

Also calculate signal per resolution element.

Comparison outputs:

- Point-source throughput ratio
- Extended-object per-pixel ratio
- Extended-object per-resolution-element ratio
- Accepted-integration ratio
- Final stack ratio

## 24. Approximate photometric model

Optional when sufficient data exists.

For AB magnitude \(m\):

\[
F_\nu
=
3631\ \text{Jy}
\times
10^{-0.4m}
\]

Estimate photons from collecting area, passband, transmission, atmosphere, and QE.

For extended targets, use surface brightness per square arcsecond and the pixel/extraction angular area.

Absolute SNR should be disabled when brightness data are inadequate.

## 25. Per-frame noise and SNR

Point source:

\[
S =
r_{\text{target}}t
\]

\[
B =
r_{\text{sky,pixel}}
n_{\text{pixels}}t
\]

\[
D =
r_{\text{dark}}
n_{\text{pixels}}t
\]

\[
R^2 =
n_{\text{pixels}}
\sigma_{\text{read}}^2
\]

\[
SNR_{\text{frame}}
=
\frac{S}
{\sqrt{S+B+D+R^2}}
\]

Stack:

\[
SNR_{\text{stack}}
=
\frac{NS}
{\sqrt{
N(S+B+D+R^2)
}}
\times
\eta_{\text{stack}}
\]

## 26. Exposure-duration analysis

Candidate sweep includes:

- User value
- Common short exposures
- Logarithmic candidates
- Configurable minimum/maximum

Suggested range: 0.5–120 seconds.

For every candidate:

- Tracking blur
- Rotation blur
- Focus drift
- Saturation
- Read-noise and sky fractions
- Frames/session
- Duty cycle
- Acceptance
- Effective integration
- Final SNR or relative score
- Storage
- Compute
- Correction overhead

Recommendation algorithm:

1. Exclude hard failures.
2. Calculate final fixed-session performance.
3. Find maximum.
4. Find shortest exposure within 98% of maximum.
5. Prefer shorter when nearly equal.
6. Warn when optimum is at boundary.
7. Return a range.

## 27. Session simulation

Timeline events:

- Exposure
- Readout
- Transfer
- Calibration
- Registration
- Stack update
- Plate solve
- Recenter
- Dither
- Settle
- Autofocus
- Meridian flip
- Recovery

At each frame update:

- Alt/az
- Airmass
- Atmosphere
- Field rotation
- Axis rates
- Kinematic conditioning
- Temperature/focus
- Visibility
- Mount limits

## 28. Frame-yield model

Rejection reasons:

- Major-axis blur
- Elongation
- Field rotation
- Focus
- Wind/vibration
- Cloud/obstruction
- Plate-solve failure
- Recenter
- Mount limit
- Compute backlog
- User quality threshold

Environmental acceptance:

\[
P_{\text{environment accept}}
=
\prod_i (1-p_i)
\]

Expected accepted frames:

\[
N_{\text{accepted}}
=
\sum_j P_{\text{accept},j}
\]

## 29. Registration and stack geometry

Correctable between frames:

- Translation
- Rotation
- Optional scale
- Optional mild distortion

Registration residual contributes to final stack blur.

Crop accounts for:

- Rotation
- Drift
- Recenter
- Dither
- Orientation changes
- Meridian flip

Outputs:

- Union
- Common intersection
- Coverage heat map
- Recommended crop
- Target coverage

## 30. Calibration model

| Calibration | Main modeled effect |
|---|---|
| Dark library | Reduces hot pixels and dark pattern |
| Session darks | Adds overhead |
| Bias/offset | Supports calibration |
| Flats | Corrects vignetting/dust |
| Bad-pixel map | Reduces defective-pixel impact |
| Background extraction | Reduces gradients |

The app must not imply calibration removes photon shot noise.

## 31. Dew model

Estimate dew point from temperature and humidity.

Suggested risk:

| Optic margin over dew point | Risk |
|---|---|
| >5°C | Low |
| 2–5°C | Moderate |
| 0–2°C | High |
| ≤0°C | Severe |

Heater model outputs adequacy, power, battery impact, and focus warning.

## 32. Compute model

Preset fields:

- Calibration throughput
- Registration throughput
- Stack-update throughput
- Plate-solve baseline
- Memory
- Write throughput
- Average/peak power
- Acceleration

Pipeline keeps pace when:

\[
t_{\text{processing average}}
\leq
t_{\text{capture interval}}
\]

Outputs:

- Utilization
- Queue growth
- Sustainable frame rate
- Live-stack feasibility
- Memory
- Plate-solving feasibility

## 33. Power and battery

Average power:

\[
P_{\text{average}}
=
\sum_i
P_i d_i
\]

Usable energy:

\[
E_{\text{usable}}
=
E_{\text{nominal}}
\times
DOD
\times
\eta_{\text{conversion}}
\times
F_{\text{temperature}}
\times
F_{\text{aging}}
\]

Runtime:

\[
t_{\text{runtime}}
=
\frac{E_{\text{usable}}}
{P_{\text{average}}}
\]

Default reserve: 20%.

## 34. Cost, mass, and envelope

Per component:

- Category
- Quantity
- Cost
- Currency
- Mass
- Dimensions
- Moving/fixed
- Fabrication type
- Power
- Notes
- Confidence

Outputs:

- Purchased total
- Fabrication estimate
- Tooling
- Consumables
- Battery
- Compute
- Contingency
- Total cost
- Total and moving mass
- Bounding box
- Rotating radius
- Cable clearance
- Collision warning

## 35. Build complexity

Inputs:

- Motors
- Gear stages
- Encoders
- Bearings
- Precision alignments
- PCBs
- Firmware
- Printed/machined parts
- Calibration operations
- Cable difficulty
- Polar alignment
- Sealing
- Focus complexity

Output:

- Low
- Moderate
- High
- Very high

Contributing factors must be visible.

## 36. Reliability

Fields:

- Plate-solve success
- Tracking recovery
- Motor stall
- Encoder dropout
- Camera disconnect
- Storage-full handling
- Low-battery behavior
- Network/internet dependency
- Safe home
- Watchdog
- Unattended duration

Display reliability as robust, acceptable, fragile, high risk, or unknown.

## 37. User constraints

Supported:

- Maximum cost
- Maximum total/moving mass
- Maximum dimensions
- Minimum runtime
- Maximum power
- Maximum tracking blur
- Maximum elongation
- Minimum acceptance
- Minimum framing margin
- Minimum integration
- Maximum complexity/setup time/focal length
- Required target list
- Required mount architecture

Results:

- Pass
- Marginal
- Fail
- Unknown

## 38. Calculation dependency order

1. Normalize and validate
2. Static geometry
3. Scenario geometry
4. Mount kinematics
5. Mechanical capability
6. Static blur
7. Exposure simulation
8. Sensitivity and noise
9. Session timeline
10. Practicality
11. Recommendations

## 39. Confidence propagation

Internal mapping may use:

| Label | Score |
|---|---|
| High | 0.95 |
| Moderate | 0.75 |
| Low | 0.45 |
| Unknown | 0 |

Result confidence considers:

- Model confidence
- Critical inputs
- Number of assumptions
- Sensitivity
- Extrapolation
- Weakest indispensable input

## 40. Recommendation data model

Each recommendation includes:

- Stable ID
- Category
- Severity
- Problem
- Evidence
- Proposed change
- Suggested range
- Expected benefit
- Tradeoff
- Next bottleneck
- Confidence
- Affected constraints
- Comparison impact

## 41. Recommendation rules

Categories:

- Invalid design
- Tracking
- Optical
- Sensor
- Session efficiency
- Practicality

Recommendations are suppressed when improvement is negligible, another bottleneck dominates, a hard constraint is violated, or confidence is too low.

Benefits are estimated by cloning the design, applying the proposed change, recalculating, and comparing.

## 42. Parameter sweeps

One-variable examples:

- Exposure
- Focal length
- Aperture
- Pixel pitch
- Gear ratio
- Encoder bits
- Plate-solving interval
- Battery
- Target altitude

Two-variable examples:

- Focal length vs exposure
- Gear ratio vs motor speed
- Aperture vs cost
- Pixel pitch vs focal length
- Sensor size vs crop
- Exposure vs altitude

Each sample records validity, constraints, blur, sensitivity, integration, acceptance, cost, weight, power, and bottleneck.

## 43. Validation rules

General:

- No negative dimensions
- Transmission/efficiency 0–1
- Probabilities 0–1
- Focal length >0
- Pixel dimensions >0
- Valid dates/coordinates
- Exposure >0
- Gear ratio >0
- Encoder bits ≥1
- Battery energy ≥0

Cross-field:

- Sensor dimensions vs pitch/count
- Focal ratio vs aperture/focal length
- Drivetrain total vs stages
- Step angle vs steps/rev
- Session longer than one frame
- Autofocus shorter than session
- Encoder placement and downstream stages
- Positive filter bandwidth

No silent correction.

## 44. Result precision

Examples:

- High-confidence FOV: 4.26°
- Moderate runtime: approximately 4.3 h
- Low frame acceptance: roughly 55–75%
- Unknown tracking: insufficient information

## 45. Preset schema

Preset types:

- Reference telescope
- Component
- Observing condition
- Target
- Mount architecture
- Motor
- Drivetrain
- Encoder
- Camera
- Optic
- Filter
- Compute
- Battery

Each preset has ID, version, display name, review date, sources, confidence, deprecation, and replacement.

## 46. JSON import/export

Serialized design contains:

- Schema version
- Inputs
- Preset IDs/versions
- Overrides
- Provenance
- Constraints
- Notes
- Optional cached display results

It excludes UI layout and temporary chart state.

Import:

1. Validate
2. Migrate
3. Resolve presets
4. Preserve unknown fields
5. Report missing/deprecated data
6. Recalculate

## 47. Performance requirements

Calculation levels:

### Fast

- Single target position
- Reduced phase sampling
- Approximate session

### Normal

- Full session
- Standard phase sampling
- Normal recommendation analysis

### Detailed

- More phase and target samples
- Larger sweeps
- More accurate crop

Sweeps must be cancelable.

## 48. Technical acceptance tests

Optical invariants:

- Doubling focal length halves image scale.
- Doubling pixel pitch doubles image scale.
- Larger sensor increases FOV.
- Increasing aperture at fixed focal length lowers focal ratio.
- Obstruction reduces area.

Sensor invariants:

- Same physical sensor size yields same FOV regardless of pixel count.
- More pixels reduce arcseconds/pixel.
- Binning increases scale and lowers resolution.

Mount invariants:

- Doubling reduction halves output step.
- Doubling reduction doubles motor speed.
- Output encoder sees downstream error.
- One additional encoder bit halves increment.

Tracking invariants:

- Constant drift displacement doubles with exposure.
- Rotation displacement scales with field radius.
- Center rotation displacement is zero.
- Registration cannot reduce intra-frame trailing.
- Shorter focal length reduces motion in pixels.

Stacking invariants:

- Background-limited SNR approaches square-root scaling.
- More overhead lowers integration.
- More rejection lowers integration.
- Longer frames reduce read-noise repetitions but may lower yield.

Power invariants:

- Doubling power halves runtime.
- Reserve reduces usable runtime.
- Heater increases battery need.

Recommendation invariants:

- Do not recommend more encoder bits when mechanics dominate.
- Do not recommend longer exposure when rotation already fails.
- Do not recommend larger aperture when target fit is a hard constraint.
- Identify changed bottlenecks after a recommendation.

## 49. Minimum outputs

Geometry:

- Effective focal length
- Focal ratio
- Areas
- Image scale
- FOV
- Target pixels
- Margin
- Vignetting

Resolution:

- Seeing, diffraction, optical, focus FWHM
- Base and final FWHM
- Elongation
- Sampling

Mount:

- Axis positions/rates/accelerations
- Motor rates
- Torque
- Step and encoder increments
- Mechanical resolution
- Singularity/range

Exposure:

- Tracking and rotation displacement
- Maximum and recommended exposure
- Saturation
- Acceptance

Stack:

- Frames
- Integration
- Duty cycle
- Relative SNR
- Crop
- Storage

Practicality:

- Cost
- Mass
- Power
- Runtime
- Compute
- Complexity
- Reliability
- Dew risk

Guidance:

- Bottleneck
- Warning
- Recommendation
- Expected effect
- Next bottleneck

## 50. Deferred extensions

- Guiding logs
- Periodic-error curves
- Encoder residuals
- Measured PSFs
- Full QE/filter curves
- Horizon profiles
- Light-pollution maps
- Complete catalogs
- Mosaic optimization
- Field derotation
- Atmospheric dispersion
- Measured flexure
- Plate-solve star density
- Automatic component matching
- Monte Carlo simulation
- Physical image simulation
- Telescope control
