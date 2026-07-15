# DIY Smart Telescope Design Explorer
## Product Specification v0.2

## 1. Product summary

The DIY Smart Telescope Design Explorer is a browser-based single-page application for designing and comparing compact, low-cost smart telescopes.

It is intended for DIY builders ranging from beginners to experienced telescope and electronics hobbyists. The app should explain results in approachable language while still exposing the calculations and assumptions needed for serious engineering work.

The application will model the complete imaging system:

- Observing conditions and target
- Optical system
- Camera and sensor
- Mount geometry
- Motors, gear reductions, and encoders
- Tracking and correction behavior
- Exposure strategy
- Plate solving and recentering
- Frame registration and live stacking
- Compute, storage, power, weight, and cost
- Expected performance bottlenecks
- Recommended design changes

The primary goal is to help a builder answer:

> Can this proposed combination of optics, sensor, mount, and capture strategy produce useful deep-sky images using short exposures and live stacking?

The app should support designs comparable in philosophy to compact commercial smart telescopes, without attempting to duplicate proprietary image-processing pipelines.

## 2. Product principles

### 2.1 Understandable without oversimplifying

Every major result should include:

- The calculated value
- A plain-language interpretation
- The inputs responsible for it
- A confidence or uncertainty indicator
- A recommendation when the result is problematic

Example:

> **Tracking during exposure: Marginal**  
> Estimated star motion is 1.8 pixels during a 20-second exposure. Reducing exposure time to approximately 11 seconds should keep motion below 1 pixel.

### 2.2 Progressive complexity

The application will provide two interfaces over the same underlying model.

#### Basic mode

Designed for builders who want rapid answers using common parameters and presets.

#### Advanced mode

Exposes optical quality, noise, mechanical errors, control parameters, mount kinematics, and stacking assumptions.

Switching modes must not discard entered values.

### 2.3 Transparent calculations

Recommendations must be rules-based and explainable. The app should not produce unexplained AI-generated design advice.

Each recommendation should state:

- What should change
- Why it should change
- How much improvement is expected
- Whether another bottleneck would then become dominant

### 2.4 Approximate rather than falsely precise

This application is an engineering estimator, not a complete physical simulator.

Results should use ranges or confidence levels when inputs are uncertain. The interface must distinguish among:

- Manufacturer specification
- User-measured value
- Estimated value
- Default assumption
- Derived result

### 2.5 Relative comparison is primary

The first version will emphasize comparison between designs rather than promising exact finished-image quality.

Examples:

- Design B collects usable extended-object signal approximately 1.7 times faster than Design A.
- Design A permits longer alt-azimuth exposures at the selected target position.
- The larger sensor in Design C improves framing but increases corner field-rotation blur.
- Increasing aperture will provide little benefit until tracking accuracy is improved.

## 3. Important operating model

### 3.1 Tracking during each exposure

The mount must move during the sub-exposure to approximately follow the sky.

Errors occurring during a sub-exposure can create:

- Linear star trailing
- Oscillation or double stars
- Field-rotation trails
- Vibration blur
- Variable star shapes across the frame

Stacking cannot remove blur that has already occurred inside an individual exposure.

### 3.2 Corrections between exposures

Between frames, the system may:

- Plate solve
- Recenter the target
- Correct accumulated pointing drift
- Dither
- Reject bad frames
- Rotate and translate frames during registration
- Crop invalid edges from the accumulated stack

The app must clearly distinguish errors that can be corrected between exposures from errors that damage an individual exposure.

## 4. Intended users

### Primary users

- DIY telescope builders
- Electronics and robotics hobbyists
- Amateur astrophotographers
- 3D-printing and maker communities
- Students exploring telescope design
- Builders comparing inexpensive components

### User knowledge assumptions

The app should not assume that the user understands:

- Image scale
- Read noise
- Field rotation
- Periodic error
- Nyquist sampling
- Plate-solving accuracy
- Gear backlash
- Encoder placement
- Sky brightness units

Technical terms should include short definitions or contextual help.

## 5. Application structure

The product will be one browser application with no traditional multi-page navigation.

It may contain:

- Scrollable sections
- Collapsible input groups
- Tabs within analysis panels
- Drawers or dialogs for component selection
- A persistent results summary
- A comparison workspace

The application should be desktop-first but responsive enough for tablets. Phone support may provide viewing and light editing but does not need to expose the complete engineering workspace comfortably.

## 6. Primary workflow

1. Start from a blank design, guided beginner design, reference preset, generic design, saved design, or imported design.
2. Select an observing scenario.
3. Configure optics.
4. Configure the camera.
5. Configure the mount.
6. Configure capture behavior.
7. Review results and recommendations.
8. Compare designs under the same scenario.

## 7. Major input sections

### 7.1 Observing scenario

Location modes:

- Latitude and longitude
- City or postal-code lookup
- Saved location
- Direct latitude
- Direct target altitude and azimuth

Time inputs:

- Date and local time
- Beginning and ending time
- Mid-session time
- Generic target position

Environment inputs:

- Seeing
- Sky brightness
- Transparency
- Moon brightness
- Wind
- Temperature
- Temperature change
- Obstruction or cloud loss

### 7.2 Common target catalog

The first version will include a curated catalog of common deep-sky targets and support manual entry.

Each target entry should contain:

- Common name
- Catalog identifier
- Right ascension and declination
- Angular width and height
- Category
- Surface-brightness class
- Broadband or emission-line classification
- Recommended framing margin
- Optional outline or preview

Suggested initial targets:

- Andromeda Galaxy
- Orion Nebula
- Pleiades
- Triangulum Galaxy
- Whirlpool Galaxy
- Pinwheel Galaxy
- Bode’s Galaxy and Cigar Galaxy
- Hercules Globular Cluster
- Ring Nebula
- Dumbbell Nebula
- Rosette Nebula
- North America Nebula
- Veil Nebula
- Lagoon Nebula
- Trifid Nebula
- Eagle Nebula
- Heart Nebula
- Soul Nebula
- California Nebula
- Horsehead and Flame region

### 7.3 Optical system

Required inputs:

- Clear aperture
- Focal length
- Optical transmission
- Image-circle diameter
- Optical-quality blur
- Focus error allowance
- Filter selection

Optional advanced inputs:

- Central obstruction
- Vignetting
- Chromatic blur
- Field curvature
- Distortion
- Reducer or extender
- Wavelength band
- Temperature-related focus drift

Derived results:

- Focal ratio
- Light-collecting area
- Diffraction limit
- Airy-disk size
- FOV
- Image scale
- Estimated optical blur
- Vignetting
- Illuminated sensor area
- Sampling classification

Optical quality may be entered as:

- Estimated star FWHM
- Spot diameter
- Quality preset
- Unknown

### 7.4 Camera and sensor

Inputs:

- Sensor dimensions
- Pixel resolution
- Pixel pitch
- Color or monochrome
- Quantum efficiency
- Read noise
- Dark current
- Full well
- ADC depth
- Gain
- Sensor temperature
- Binning
- Readout time
- Processing overhead
- Region of interest

Derived results:

- FOV
- Image scale
- Sensor area
- Pixel count
- Dynamic range
- Relative sensitivity
- Sky-background accumulation
- Saturation risk
- Storage per frame/session
- Processing load

### 7.5 Filters

Initial filters:

- None
- UV/IR cut
- Broadband light pollution
- Dual-band
- H-alpha
- OIII
- Custom simplified filter

Outputs:

- Relative target-signal change
- Relative sky-background change
- Exposure implication
- Target suitability warning

### 7.6 Mount architecture

Built-in architectures:

- Alt-azimuth
- German equatorial
- Fork equatorial
- Equatorial platform
- Pan-tilt
- Gimbal
- Cartesian-derived two-axis
- Custom two-axis

Two modeling levels:

#### Basic mount model

Directly entered:

- Tracking RMS
- Slow drift
- Periodic error
- Backlash
- Settling time
- Maximum slew speed
- Vibration
- Open-loop or closed-loop

#### Advanced mount model

Derives performance from:

- Motors
- Gear train
- Encoder
- Mechanical errors
- Controller behavior
- Payload
- Axis geometry

Generic custom mechanisms define:

- Axis names and ranges
- Axis-to-sky mapping
- Position-dependent resolution and rates
- Singular regions
- Speed and acceleration limits
- Reversal behavior
- Optional calibration table

### 7.7 Motor and drivetrain model

Per-axis inputs:

- Motor type
- Steps per revolution
- Microstepping
- Torque
- Maximum speed
- Reduction stages
- Gear efficiency
- Backlash
- Compliance
- Eccentricity
- Periodic error
- Bearing runout
- Friction
- Payload inertia
- Center-of-mass offset

Per-axis outputs:

- Total reduction
- Full-step and microstep sky angle
- Required motor speed
- Required torque
- Torque margin
- Backlash on sky
- Periodic error
- Reversal delay
- Settling time
- Mechanical-resolution floor

### 7.8 Encoder and feedback model

Inputs:

- No encoder
- Motor-shaft encoder
- Intermediate-stage encoder
- Output-axis encoder
- Absolute or incremental
- Bit depth
- Interpolation
- Measurement noise
- Update rate
- Deadband
- Control response

Outputs:

- Encoder resolution
- Detectable sky motion
- Unobservable gearbox error
- Correction latency
- Quantization contribution
- Whether placement can detect backlash or periodic error

### 7.9 Tracking and correction model

During-exposure inputs:

- Tracking update frequency
- Tracking RMS
- Drift
- Periodic error
- Wind
- Vibration
- Alignment error
- Flexure
- Focus drift

Between-exposure inputs:

- Plate-solving interval
- Plate-solve accuracy and duration
- Recenter threshold
- Recenter accuracy and duration
- Dither interval and distance
- Settling time
- Failure rate

Derived outputs:

- Motion during one exposure
- Motion between exposures
- Correctable drift
- Uncorrectable blur
- Time lost to corrections
- Recenter frequency
- Duty cycle
- Recommended and hard exposure limits

### 7.10 Capture and live stacking

Inputs:

- Exposure length
- Gain
- Total session duration
- Calibration
- Frame rejection
- Dithering
- Plate-solving cadence
- Stack method
- Rotation correction
- Drizzle
- Environmental loss

Outputs:

- Frames attempted/accepted/rejected
- Effective integration
- Duty cycle
- Relative stack depth
- Relative SNR improvement
- Crop loss
- Storage
- Processing requirement
- Time until recognizable preview
- Time until diminishing returns

### 7.11 Compute model

Inputs:

- Processor class
- CPU cores
- GPU or neural accelerator
- Memory
- Storage speed
- Plate solver
- Image dimensions
- Stack algorithm level

Outputs:

- Processing budget
- Plate-solving feasibility
- Stack memory
- Storage bandwidth
- Ability to keep pace
- Estimated power draw

### 7.12 Cost, weight, power, and build practicality

Per-component:

- Quantity
- Cost
- Weight
- Average and peak power
- Dimensions
- Fabrication requirement
- Source confidence

System outputs:

- Total cost and mass
- Moving mass
- Peak and average power
- Required battery
- Runtime
- Storage
- Envelope
- Setup complexity
- Calibration complexity
- Build-complexity rating
- Portability rating

## 8. Core calculations

- Optical geometry
- Sampling analysis
- Blur budget
- Mount resolution
- Alt-az field rotation
- Equatorial tracking
- Generic two-axis kinematics
- Relative sensitivity
- Frame yield
- Power and runtime

## 9. Recommendation engine

Recommendations should be deterministic and traceable.

Categories:

- Exposure
- Focal length
- Aperture
- Pixel size
- Sensor dimensions
- Gear reduction
- Motor selection
- Encoder resolution and placement
- Mount architecture
- Control update rate
- Plate-solving cadence
- Dither
- Filter
- Battery
- Compute platform

Each recommendation includes:

1. Problem
2. Recommended change
3. Expected benefit
4. Tradeoff
5. Next bottleneck

Priority levels:

- Critical
- High value
- Optional
- Little expected benefit
- Counterproductive

## 10. Main visualizations

- Target framing
- Blur budget
- Tracking timeline
- Field rotation
- Exposure sweep
- Integration-time comparison
- Mount requirement chart
- Cost and practicality comparison

## 11. Results dashboard

- Field of view
- Image scale
- Target fit
- Sampling quality
- Relative sensitivity
- Estimated final blur
- Recommended exposure
- Rotation limit
- Tracking limit
- Frame acceptance
- Effective integration
- Relative stack quality
- Cost
- Mass
- Power
- Runtime
- Dominant bottleneck
- Highest-value recommendation

## 12. Component presets

Initial categories:

- Sensors and cameras
- Lenses and guide scopes
- Small refractors and reflectors
- Stepper and servo motors
- Gearboxes
- Belt drives
- Worm gears
- Encoders
- Motor controllers
- SBCs
- Batteries

Every preset value remains editable and carries source and confidence metadata.

## 13. Design comparison

Compare up to four designs.

Controls:

- Pin
- Duplicate
- Rename
- Change one parameter across designs
- Lock scenario, target, budget, weight, exposure, or mount
- Set baseline

Outputs:

- Difference table
- Percentage changes
- Side-by-side charts
- Advantages and disadvantages
- Bottleneck changes
- Recommendation differences

## 14. Parameter sweeps

Examples:

- Focal length vs exposure
- Gear ratio vs precision
- Pixel size vs focal length
- Aperture vs cost
- Exposure vs frame yield
- Encoder resolution vs gearbox error
- Sensor size vs field rotation
- Battery capacity vs runtime

The app should identify feasible regions that satisfy selected constraints.

## 15. Saving and export

Required:

- Automatic local save
- Named designs
- Duplication
- JSON import/export
- Shareable URL
- Reset section
- Restore defaults
- Detailed report
- CSV export
- Chart image export

## 16. Validation and warnings

Detect:

- Impossible focal ratio
- Sensor larger than image circle
- Invalid gear ratio
- Motor speed beyond limit
- Insufficient torque
- Inadequate encoder resolution
- Excessive field rotation
- Excessive star motion
- Saturation
- Compute backlog
- Insufficient battery
- Target outside range
- Kinematic singularity
- Missing material values

## 17. First-version scope

Include:

- Single-page browser app
- Beginner and advanced modes
- Common target catalog
- Manual target entry
- Location/date and direct alt/az
- Optics and FOV
- Editable optical quality
- Camera presets
- Relative sensitivity
- Alt-az and equatorial tracking
- Generic two-axis support
- Basic and advanced mount models
- Plate solving and recentering
- Live-stack efficiency
- Frame-yield estimate
- Recommendations
- Cost, weight, power, battery, compute, and storage
- Comparison
- Parameter sweeps
- Local saving and export

Defer:

- Full ray tracing
- Detailed lens design
- FEA
- Full controller simulation
- Photorealistic image prediction
- Complete catalog
- Live pricing
- Cloud accounts
- Collaboration
- ML recommendations
- Full Monte Carlo simulation
- CAD generation

## 18. Success criteria

The user can:

1. Select a target and location.
2. Choose optics and camera.
3. Describe the mount with measured tracking or components.
4. Determine target fit.
5. Determine sampling.
6. Estimate tracking and rotation blur.
7. Find a practical exposure.
8. Estimate relative stacked performance.
9. Determine motor, gearing, and encoder suitability.
10. Identify the dominant bottleneck.
11. Receive explainable recommendations.
12. Compare designs.
13. Estimate cost, weight, power, runtime, storage, and compute.
14. Understand confidence and assumptions.
