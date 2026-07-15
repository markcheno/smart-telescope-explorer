# DIY Smart Telescope Design Explorer
## Complete Specification Set v0.1–v0.9

This document concatenates the complete numbered specification sequence. Each section begins with its original file name.

---

<!-- Source file: 01_product_spec_v0.1.md -->

# DIY Smart Telescope Design Explorer
## Working Product Specification v0.1

## 1. Purpose

Create a browser-based single-page engineering application for exploring practical smart-telescope designs.

The application should answer questions such as:

- What field of view and image scale will this optic and sensor produce?
- Is the system limited by diffraction, seeing, optical quality, pixel sampling, or mount tracking?
- How accurately must the mount track for a chosen sub-exposure?
- Is an inexpensive motor, gearbox, encoder, and mechanical structure adequate?
- How much field rotation will occur in an alt-azimuth configuration?
- What percentage of frames are likely to be usable?
- How much integration time is needed to reach a useful signal-to-noise ratio?
- Would changing the aperture, focal length, camera, mount ratio, or exposure time materially improve the result?
- How does the proposed design compare with reference smart telescopes?

The application should be a design-space explorer, not a promise that a particular system will produce an exact image.

## 2. Operating model

The calculator must model two separate control loops.

### 2.1 Intra-frame tracking

The mount must track the sky during each sub-exposure. Errors within an exposure create star trailing and blur that later registration cannot remove.

### 2.2 Inter-frame correction

Between exposures, the telescope may plate solve, recenter, dither, reject bad frames, rotate and translate frames, and crop invalid stack edges.

Stacking and plate solving can correct displacement between frames. They cannot undo blur already recorded inside one frame.

## 3. Core design philosophy

The calculator should avoid reducing the design to a single misleading score. Performance should be divided into distinct dimensions.

| Dimension | Primary question |
|---|---|
| Framing | Does the target fit on the sensor? |
| Sampling | Are the optics and seeing appropriately sampled? |
| Sensitivity | How quickly can useful signal be collected? |
| Tracking | Will stars remain acceptably round during each exposure? |
| Stacking | How efficiently can frames be registered and combined? |
| Practicality | Is the system affordable, compact, stable, and buildable? |

A summary score may be added later, but the app should always expose the underlying limitations.

## 4. Main application workflow

### Step 1: Select a starting point

- Blank custom design
- Commercial smart-telescope reference preset
- Generic 30 mm smart telescope
- Generic 50 mm smart telescope
- Previously saved design

### Step 2: Choose an observing scenario

- Target type
- Target coordinates or generic sky position
- Observer latitude
- Sky brightness
- Seeing
- Exposure length
- Total imaging time

### Step 3: Adjust system parameters

Changes should update all applicable results immediately.

### Step 4: Review bottlenecks

The application should identify the limiting factor and explain why a proposed upgrade may not help until a more important limitation is fixed.

### Step 5: Compare alternatives

The user should be able to pin two to four designs and compare them side by side.

## 5. Proposed single-page layout

Single-page means one browser application route with no disruptive page navigation. The app may scroll and use collapsible sections.

### Top bar

- Design name
- New, duplicate, save, import, export
- Reference preset selector
- Compare mode
- Simple/advanced mode
- Units and display settings

### Left panel: inputs

1. Observing conditions
2. Target
3. Optics
4. Camera
5. Mount and mechanics
6. Tracking and plate solving
7. Capture and stacking
8. Practical constraints

### Center workspace: visual analysis

- Target framing preview
- Image scale and sampling visualization
- Star blur visualization
- Field-rotation visualization
- Signal-to-noise chart
- Exposure feasibility chart
- Tracking-error budget

### Right panel: results

- Field of view
- Image scale
- Effective resolution
- Maximum recommended sub-exposure
- Expected star elongation
- Field rotation at sensor edge
- Accepted-frame estimate
- Effective integration time
- Estimated signal-to-noise ratio
- Dominant bottleneck
- Mount requirements
- Practicality summary

## 6. Inputs

### 6.1 Observing conditions

- Observer latitude
- Target altitude and azimuth, or right ascension and declination plus date/time
- Seeing
- Sky brightness
- Atmospheric transparency
- Moon contribution
- Wind
- Temperature
- Temperature change

Useful presets:

- Dark rural sky
- Suburban sky
- Bright suburban sky
- Urban sky
- Excellent, average, and poor seeing

### 6.2 Target model

Target categories:

- Point source
- Star cluster
- Galaxy
- Reflection nebula
- Emission nebula
- Planetary nebula
- Generic extended object

Target inputs:

- Angular width and height
- Integrated magnitude
- Surface brightness
- Optional catalog identifier
- Optional orientation
- Emission-line characteristics

### 6.3 Optics

Inputs:

- Clear aperture
- Focal length
- Focal ratio
- Central obstruction
- Optical transmission
- Image-circle diameter
- Vignetting model
- Optical spot size
- Chromatic blur estimate
- Field curvature estimate
- Distortion
- Wavelength or filter band
- Focus error
- Focus drift
- Optional reducer or extender

Derived values:

- Focal ratio
- Diffraction limit
- Airy-disk diameter
- Light-gathering area
- Approximate point-source resolution
- Approximate extended-object imaging speed
- Illuminated sensor area
- Vignetting across the frame

### 6.4 Camera and sensor

Inputs:

- Sensor width and height
- Pixel width and height
- Pixel pitch
- Resolution
- Monochrome or color
- Bayer pattern
- Quantum efficiency
- Read noise
- Dark current
- Full-well capacity
- ADC bit depth
- Gain
- Conversion gain
- Cooling
- Sensor temperature
- Binning
- Region of interest
- Readout time
- Download and processing overhead
- Fixed-pattern-noise penalty

Derived values:

- Field of view
- Image scale
- Dynamic range
- Saturation time
- Data per frame
- Session storage requirement
- Read-noise contribution
- Dark-current contribution
- Sampling relative to seeing and diffraction

Image scale:

\[
\text{Image scale} =
206.265 \times
\frac{\text{pixel size in µm}}{\text{focal length in mm}}
\]

Field of view should use the exact angular calculation.

### 6.5 Filters

- No filter
- UV/IR cut
- Broadband light-pollution filter
- Dual-band
- Narrowband
- Custom simplified bandpass

The filter model should separately affect target signal and sky-background signal and should distinguish emission-line targets from broadband galaxies and clusters.

### 6.6 Mount architecture

Initial choices:

- Alt-azimuth
- Equatorial
- Equatorial platform
- Pan-tilt or gimbal
- Custom two-axis mount

Per-axis inputs:

- Motor step angle
- Microstepping
- Gear or belt reduction
- Encoder resolution
- Encoder location
- Open-loop or closed-loop
- Backlash
- Periodic error
- Gear eccentricity
- Friction
- Structural compliance
- Bearing runout
- Maximum slew speed
- Maximum acceleration
- Control update frequency
- Correction deadband
- Payload
- Center-of-mass offset
- Axis inertia
- Torque margin
- Settling time

Nominal axis increment:

\[
\theta_{\text{step}} =
\frac{360^\circ}
{\text{motor steps per revolution}
\times \text{microsteps}
\times \text{total reduction}}
\]

The app must warn that microstep size is not guaranteed mechanical positioning accuracy.

### 6.7 Tracking and control

Inputs:

- Sidereal tracking
- Tracking update interval
- Open-loop tracking error
- Closed-loop bandwidth
- Encoder measurement error
- Alignment error
- Leveling error
- Initial pointing error
- Plate-solve accuracy
- Plate-solve interval
- Recenter threshold
- Recenter duration
- Dither interval
- Dither distance
- Guiding enabled or disabled
- Maximum accepted elongation
- Maximum accepted displacement

The model should distinguish continuous errors within a frame from correctable errors between frames.

### 6.8 Capture and stacking

Inputs:

- Sub-exposure time
- Number of exposures or total duration
- Gain
- Frame overhead
- Plate-solving overhead
- Recenter overhead
- Dither overhead
- Calibration use
- Frame-rejection threshold
- Environmental loss
- Stack type
- Drizzle
- Rotation correction
- Mosaic mode

Derived values:

- Frames attempted
- Frames accepted
- Effective integration time
- Duty cycle
- Expected stack SNR
- Cropped usable area
- Storage use
- Processing workload
- Time until visible target
- Time until selected SNR threshold

## 7. Core performance calculations

### 7.1 Resolution and blur budget

Contributors:

- Diffraction
- Seeing
- Optical spot size
- Chromatic error
- Focus error
- Pixel sampling
- Tracking error
- Field rotation
- Vibration

Outputs:

- Total estimated star FWHM
- Total blur in arcseconds
- Total blur in pixels
- Star elongation ratio
- Dominant blur source
- Sampling classification

### 7.2 Alt-azimuth field rotation

Inputs:

- Observer latitude
- Target declination
- Hour angle
- Exposure start time
- Exposure duration
- Sensor dimensions
- Image scale

Outputs:

- Rotation during one exposure
- Motion at center and corners
- Maximum exposure for the selected blur threshold
- Expected crop after a long stack
- Zenith warning

### 7.3 Mount-limited exposure time

Estimate the maximum useful exposure allowed by:

- Tracking RMS
- Drift
- Periodic error
- Field rotation
- Wind
- Alignment error
- Star-elongation threshold

Report both recommended and hard maximum exposure.

### 7.4 Signal-to-noise model

Conceptually:

\[
\text{SNR} =
\frac{S}
{\sqrt{S+B+D+n_{\text{pixels}}R^2}}
\]

For a stack, include accepted frame count, read noise per frame, total target signal, total sky signal, calibration penalty, stack efficiency, and rejection losses.

### 7.5 Frame-yield model

Estimate frame acceptance from:

- Tracking error distribution
- Wind
- Periodic error phase
- Recenter events
- Field rotation
- Obstructions
- Plate-solving failures
- Environmental loss

## 8. Visualizations

- Target framing preview
- Blur-budget chart
- SNR versus integration time
- Exposure feasibility chart
- Mount-resolution chart
- Bottleneck summary

## 9. Practical design constraints

- Component cost
- Total mass
- Moving mass
- Dimensions
- Battery capacity
- Runtime
- Peak and average power
- Storage
- Compute requirement
- Build complexity
- Custom-machined part count
- Printed-part count
- Portability
- Setup time
- Polar-alignment requirement
- Calibration effort

## 10. Presets and references

The app should support a small editable library of:

- Common Sony astronomy sensors
- Generic lenses and guide scopes
- Stepper motors
- Encoders
- Belt reductions
- Worm drives
- Spur and planetary gearboxes

Every value should record source and confidence.

## 11. Simple and advanced modes

### Simple mode

Inputs:

- Aperture
- Focal length
- Camera preset
- Mount type
- Tracking accuracy
- Exposure
- Total time
- Sky condition
- Target

Outputs:

- FOV
- Image scale
- Estimated SNR or relative performance
- Recommended exposure
- Field rotation
- Mount pass/fail
- Bottleneck

### Advanced mode

Exposes full sensor, mechanical, control, optical, and environmental models.

## 12. Saving and comparison

Required:

- Automatic local save
- Named designs
- Duplicate design
- JSON import/export
- Shareable URL
- Side-by-side comparison
- Reset individual sections
- Show differences between designs
- Lock shared parameters during comparison

## 13. Recommended first-version boundaries

### Include

- Optics and sensor geometry
- Sampling and resolution
- Basic SNR or relative sensitivity
- Alt-az and equatorial tracking
- Field rotation
- Motor, reduction, and encoder resolution
- Tracking-error budget
- Plate-solving and recenter overhead
- Live-stack efficiency
- Reference presets
- Target framing
- Design comparison
- Cost, weight, and power summary
- Parameter sweeps

### Defer

- Full optical ray tracing
- Detailed finite-element structural analysis
- Wind simulation
- Exact plate-solver runtime prediction
- Photorealistic finished-image simulation
- Full control-loop simulation
- Complete sky catalog
- Automatic parts shopping
- Global numerical optimization
- Machine-learned quality prediction

## 14. Acceptance criteria

A useful first release should:

1. Reproduce reference FOV and image scale within reasonable tolerance.
2. Explain why tracking is required during a sub-exposure.
3. Calculate target-position effects on alt-az field rotation.
4. Derive a maximum recommended exposure from a selected trailing tolerance.
5. Determine whether mount resolution is adequate.
6. Estimate final relative or approximate SNR while accounting for read noise, sky background, and rejected frames.
7. Explain the dominant limitation.
8. Compare at least three designs.
9. Mark assumed or uncertain inputs.
10. Avoid displaying precision beyond the input model.

---

<!-- Source file: 02_product_spec_v0.2.md -->

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

---

<!-- Source file: 03_mvp_definition_v0.3.md -->

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

---

<!-- Source file: 04_calculation_model_v0.4.md -->

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

---

<!-- Source file: 05_interface_interaction_v0.5.md -->

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

---

<!-- Source file: 06_application_architecture_v0.6.md -->

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

---

<!-- Source file: 07_mvp_backlog_seed_catalogs_v0.7.md -->

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

---

<!-- Source file: 08_version1_schema_api_contracts_v0.8.md -->

# DIY Smart Telescope Design Explorer
## Version 1 Data Schema and Calculation API Contracts v0.8

## 1. Purpose

This specification defines:

- Persistent design-document structure
- Stable field names
- Required and optional fields
- Enumerations
- Provenance and confidence
- Validation messages
- Calculation requests/responses
- Worker messages
- Recommendation previews
- Comparison and sweep requests
- Catalog records
- Locked references
- Migration boundaries
- Compatibility rules

## 2. Contract principles

### 2.1 JSON-compatible records

No class prototypes, functions, browser objects, Date instances, maps/sets, circular references, or executable expressions.

### 2.2 Canonical persisted units

Persisted units:

- mm for optical and sensor dimensions
- µm for pixel pitch
- degrees for stored positions
- arcseconds for angular errors
- seconds for duration
- °C for temperature
- fractions for transmission/probability
- kg, W, Wh
- amount plus ISO currency

Display preferences do not change exported values.

### 2.3 Stable identifiers

Examples:

- `design_...`
- `target_m042`
- `sensor_sony_imx585`
- `reference_seestar_s30_pro`
- `constraint_max_tracking_motion`
- `recommendation_tracking_exposure_reduce`

Display-name changes do not change IDs.

### 2.4 Explicit nullability

- Omitted: not part of object
- `null`: unknown
- `0`: actual zero

### 2.5 Inputs and results separate

Derived values are not authoritative persistent inputs.

## 3. Naming conventions

- JSON fields: `snake_case`
- Enums: lowercase `snake_case`
- JSON Pointer dependency paths

Examples:

- `/optics/focal_length_mm/value`
- `/camera/sensor/pixel_pitch_x_um/value`
- `/capture/exposure_s/value`

## 4. Versions

Every design contains:

```json
{
  "schema_version": "1.0.0",
  "calculation_engine_version": "1.0.0"
}
```

Schema major changes alter meaning or require migration; minor is additive; patch is clarification.

Engine version changes when calculation behavior changes without schema changes.

## 5. Common primitive records

### SourceMetadata

Fields:

- `source_type`
- `confidence`
- `source_label`
- `source_url`
- `source_note`
- `reviewed_at`
- `user_overridden`
- `assumption_id`

`source_type`:

- `published`
- `measured`
- `estimated`
- `assumed`
- `derived`
- `user_entered`
- `catalog`
- `manufacturer_claim`
- `unknown`

`confidence`:

- `high`
- `moderate`
- `low`
- `unknown`

### ScalarValue

```text
ScalarValue
├── value
├── source
└── uncertainty
```

The field name defines the unit.

### Uncertainty

Fields:

- `kind`
- `plus_minus`
- `minimum`
- `maximum`
- `confidence_interval`

Kinds:

- `absolute`
- `range`
- `percentage`
- `standard_deviation`
- `unknown`

### AngularErrorValue

Fields:

- `value`
- `statistic`
- `direction`
- `source`
- `uncertainty`

Statistics:

- `rms`
- `one_sigma`
- `peak`
- `peak_to_peak`
- `maximum_absolute`
- `median`
- `percentile_95`
- `rate`
- `unknown`

Directions:

- `isotropic`
- `axis_1`
- `axis_2`
- `right_ascension`
- `declination`
- `altitude`
- `azimuth`
- `image_x`
- `image_y`
- `custom`
- `unknown`

### PresetReference

- `preset_id`
- `preset_version`
- `catalog_version`
- `applied_at`

## 6. Top-level DesignDocument

```text
DesignDocument
├── schema_version
├── calculation_engine_version
├── design_id
├── revision
├── metadata
├── preset_origin
├── scenario
├── target
├── optics
├── camera
├── filter
├── mount
├── tracking
├── capture
├── constraints
├── notes
├── extensions
└── result_snapshot
```

`extensions` defaults to `{}`.

`result_snapshot` is informational and recalculated after loading.

## 7. DesignMetadata

Fields:

- `name`
- `design_type`
- `locked`
- `created_at`
- `modified_at`
- `description`
- `tags`
- `currency_code`
- `author_label`

Design types:

- `custom`
- `reference`
- `reference_duplicate`
- `template`
- `imported`

Locked references reject edit commands. Duplicating creates a new ID and editable reference duplicate.

## 8. PresetOrigin

- `reference_id`
- `reference_version`
- `assumption_profile_id`
- `duplicated_at`

## 9. Scenario schema

### ScenarioInput

- `mode`
- `location`
- `session`
- `direct_horizontal`
- `conditions`

Modes:

- `ephemeris_session`
- `direct_horizontal_static`
- `direct_horizontal_session`

### ScenarioLocation

- `latitude_deg`
- `longitude_deg`
- `elevation_m`
- `timezone`
- `display_name`
- `privacy_precision`

Privacy precision:

- `exact`
- `rounded_1_degree`
- `latitude_only`
- `removed`

### ScenarioSession

- `start_time_utc`
- `duration_s`
- `sample_interval_s`
- `minimum_altitude_deg`

### DirectHorizontalInput

- `altitude_deg`
- `azimuth_deg`
- `altitude_rate_deg_per_hour`
- `azimuth_rate_deg_per_hour`
- `field_rotation_rate_deg_per_hour`

Static mode without rates supports only single-position calculations.

### ScenarioConditions

- `seeing_fwhm_arcsec`
- `sky_brightness_mag_arcsec2`
- `transparency_fraction`
- `extinction_mag_per_airmass`
- `moon_brightness_adjustment_mag`
- `temperature_start_c`
- `temperature_end_c`
- `relative_humidity_fraction`
- `wind_speed_m_s`
- `environmental_frame_loss_fraction`
- `horizon_obstruction_loss_fraction`

Only seeing is required for MVP geometry/sampling.

## 10. Target schema

### TargetSelection

- `selection_type`
- `catalog_reference`
- `custom_target`
- `overrides`

Selection type:

- `catalog`
- `custom`

### TargetCatalogReference

- `target_id`
- `target_version`
- `catalog_version`
- `display_name_snapshot`

### CustomTarget

- `target_id`
- `name`
- `aliases`
- `coordinates`
- `geometry`
- `classification`
- `brightness`
- `source`

### TargetCoordinates

- `right_ascension_deg`
- `declination_deg`
- `epoch`

Epoch:

- `j2000`
- `jnow`
- `custom`

### TargetGeometry

- `shape`
- `width_arcmin`
- `height_arcmin`
- `position_angle_deg`
- `bright_core_width_arcmin`
- `bright_core_height_arcmin`
- `halo_width_arcmin`
- `halo_height_arcmin`
- `recommended_margin_fraction`
- `outline`

Shapes:

- `point`
- `circle`
- `ellipse`
- `rectangle`
- `polygon`
- `multi_region`

### TargetClassification

- `target_type`
- `angular_size_class`
- `surface_brightness_class`
- `spectral_class`
- `h_alpha_relevance`
- `oiii_relevance`

Target types:

- `galaxy`
- `emission_nebula`
- `reflection_nebula`
- `planetary_nebula`
- `supernova_remnant`
- `globular_cluster`
- `open_cluster`
- `star_field`
- `mixed_region`
- `point_source`
- `custom`

Size class:

- `very_large`
- `large`
- `medium`
- `small`
- `very_small`
- `unknown`

Brightness class:

- `high`
- `moderate`
- `low`
- `very_low`
- `unknown`

Spectral class:

- `broadband`
- `emission_line`
- `mixed`
- `stellar`
- `unknown`

Line relevance:

- `strong`
- `moderate`
- `weak`
- `none`
- `unknown`

### TargetBrightness

- `integrated_magnitude`
- `surface_brightness_mag_arcsec2`
- `h_alpha_flux`
- `oiii_flux`
- `photometric_model_enabled`

## 11. Optics schema

### OpticsInput

- `preset_reference`
- `aperture_mm`
- `native_focal_length_mm`
- `reducer_multiplier`
- `extender_multiplier`
- `central_obstruction_mm`
- `optical_transmission_fraction`
- `image_circle_diameter_mm`
- `reference_wavelength_nm`
- `optical_blur`
- `vignetting`

Required:

- Aperture
- Native focal length
- Reducer/extender multipliers
- Optical blur representation

### OpticalBlurInput

- `representation`
- `value`
- `statistic`
- `preset_class`
- `field_position`

Representation:

- `fwhm_arcsec`
- `spot_diameter_um`
- `quality_preset`
- `unknown`

Statistic:

- `fwhm`
- `rms_radius`
- `rms_diameter`
- `geometric_diameter`
- `unknown`

Preset class:

- `excellent`
- `good`
- `typical_inexpensive_lens`
- `poor_edge_performance`
- `unknown`

Field position:

- `center`
- `mid_field`
- `corner`
- `field_average`
- `unknown`

### VignettingInput

- `model`
- `center_transmission_fraction`
- `corner_transmission_fraction`
- `radial_samples`

Models:

- `none`
- `center_corner_linear`
- `radial_samples`
- `unknown`

## 12. Camera schema

### CameraInput

- `preset_reference`
- `camera_name`
- `sensor`
- `noise`
- `readout`
- `operating_mode`

### SensorInput

- `sensor_width_mm`
- `sensor_height_mm`
- `horizontal_pixels`
- `vertical_pixels`
- `pixel_pitch_x_um`
- `pixel_pitch_y_um`
- `color_mode`
- `bayer_pattern`
- `active_area_fraction`

Color:

- `color`
- `monochrome`
- `unknown`

Bayer:

- `rggb`
- `bggr`
- `grbg`
- `gbrg`
- `none`
- `unknown`

### SensorNoiseInput

- `effective_quantum_efficiency_fraction`
- `read_noise_e_rms`
- `dark_current_e_per_px_s`
- `full_well_e`
- `adc_bit_depth`
- `conversion_gain_e_per_adu`
- `fixed_pattern_noise_fraction`
- `sensor_temperature_c`

All optional for geometry-only calculations.

### CameraReadoutInput

- `stored_bit_depth`
- `readout_time_s`
- `transfer_time_s`
- `raw_frame_retained`
- `compression_ratio`

### CameraOperatingMode

- `binning_x`
- `binning_y`
- `roi_x`
- `roi_y`
- `roi_width`
- `roi_height`
- `gain_mode`
- `gain_value`

Gain modes:

- `low`
- `medium`
- `high`
- `custom`
- `unknown`

## 13. Filter schema

### FilterInput

- `preset_reference`
- `filter_type`
- `name`
- `passbands`
- `broadband_transmission_fraction`
- `emission_transmission_fraction`
- `sky_transmission_fraction`

Filter types:

- `none`
- `uv_ir_cut`
- `broadband_light_pollution`
- `dual_band`
- `h_alpha`
- `oiii`
- `custom`
- `unknown`

### FilterPassband

- `center_wavelength_nm`
- `bandwidth_nm`
- `peak_transmission_fraction`
- `average_transmission_fraction`
- `target_weight_fraction`
- `sky_weight_fraction`

## 14. Mount schema

### MountInput

- `preset_reference`
- `architecture`
- `model_level`
- `axis_limits`
- `alt_azimuth`
- `equatorial`
- `basic_performance`

Architectures:

- `alt_azimuth`
- `german_equatorial`
- `fork_equatorial`

Model levels:

- `ideal`
- `basic_performance`

### MountAxisLimits

- Axis 1/2 minimum/maximum degrees
- Axis 1/2 maximum rate
- Axis 1/2 maximum acceleration

Null rate/acceleration means unknown, not unlimited.

### AltAzMountConfiguration

- `minimum_altitude_deg`
- `maximum_altitude_deg`
- `zenith_avoidance_radius_deg`
- `azimuth_wrap_mode`
- `camera_rotation_offset_deg`

Wrap modes:

- `continuous`
- `limited`
- `rewind_required`
- `unknown`

### EquatorialMountConfiguration

- `polar_alignment_altitude_error_arcmin`
- `polar_alignment_azimuth_error_arcmin`
- `meridian_limit_minutes`
- `meridian_behavior`
- `flip_duration_s`
- `post_flip_settle_s`
- `camera_rotation_offset_deg`

Meridian:

- `flip_required`
- `no_flip_required`
- `stop_tracking`
- `unknown`

### BasicMountPerformance

- `pointing_accuracy_arcsec`
- `settling_time_s`
- `backlash_arcsec`
- `source`

Tracking errors live in tracking schema.

## 15. Tracking schema

### TrackingInput

- `enabled`
- `error_model`
- `plate_solving`
- `recentering`
- `dithering`
- `quality_thresholds`

### TrackingErrorModel

- `tracking_jitter`
- `drift_rate`
- `periodic_error`
- `vibration`
- `registration_residual`
- `phase_policy`

Phase policy:

- `known_phase`
- `sample_phases`
- `conservative`
- `worst_case`

### AngularRateError

- `value_arcsec_per_min`
- `direction`
- `source`
- `uncertainty`

### PeriodicErrorInput

- `amplitude_arcsec`
- `amplitude_statistic`
- `period_s`
- `direction`
- `phase_deg`
- `source`

Amplitude normally `peak` or `peak_to_peak`.

### VibrationInput

- `rms_arcsec`
- `dominant_frequency_hz`
- `direction`
- `source`

### PlateSolvingInput

- `enabled`
- `trigger_mode`
- `interval_frames`
- `interval_s`
- `solve_duration_s`
- `accuracy_arcsec`
- `failure_probability`
- `initial_solve_required`

Trigger modes:

- `initial_only`
- `fixed_frames`
- `fixed_time`
- `predicted_drift`
- `after_recenter`
- `custom`
- `disabled`

### RecenteringInput

- `enabled`
- `threshold_mode`
- `threshold_arcsec`
- `threshold_pixels`
- `duration_s`
- `residual_error_arcsec`
- `settle_time_s`
- `failure_probability`

Threshold modes:

- `arcseconds`
- `pixels`
- `predicted_drift`
- `disabled`

### DitheringInput

- `enabled`
- `interval_frames`
- `distance_arcsec`
- `distance_pixels`
- `pattern`
- `move_duration_s`
- `settle_time_s`

Patterns:

- `random`
- `spiral`
- `fixed_sequence`
- `unknown`

### TrackingQualityThresholds

- `maximum_motion_pixels`
- `maximum_elongation_ratio`
- `maximum_corner_rotation_pixels`
- `maximum_final_fwhm_pixels`
- `evaluation_percentile`

Percentile:

- `median`
- `percentile_95`
- `worst_case`

## 16. Capture schema

### CaptureInput

- `exposure_s`
- `stack_method`
- `total_session_override_s`
- `frame_rejection`
- `registration`
- `stack_efficiency_fraction`
- `exposure_sweep`
- `output`

Stack methods:

- `mean`
- `weighted_mean`
- `median`
- `sigma_clipped_mean`
- `simplified_live_stack`

### FrameRejectionInput

- `enabled`
- `mode`
- `use_tracking_thresholds`
- `environmental_loss_enabled`
- `manual_rejection_fraction`

Modes:

- `quality_model`
- `manual_fraction`
- `none`

### RegistrationInput

- `translation_enabled`
- `rotation_enabled`
- `scale_enabled`
- `residual_error_arcsec`
- `interpolation_efficiency_fraction`
- `crop_mode`

Crop:

- `common_intersection`
- `maximum_rectangle`
- `target_preserving`
- `none`

### ExposureSweepInput

- `enabled`
- `minimum_exposure_s`
- `maximum_exposure_s`
- `candidate_mode`
- `explicit_candidates_s`
- `sample_count`
- `near_optimal_fraction`
- `prefer_shorter_exposure`

Candidate modes:

- `default_candidates`
- `logarithmic`
- `linear`
- `explicit`

Default near-optimal: 0.98.

### CaptureOutputInput

- `retain_raw_frames`
- `retain_calibrated_frames`
- `preview_interval_frames`
- `stored_stack_bit_depth`

## 17. Constraint schema

### DesignConstraint

- `constraint_id`
- `enabled`
- `severity`
- `metric`
- `operator`
- `threshold`
- `unit`
- `scope`
- `note`

Severity:

- `hard`
- `soft`

Operators:

- `less_than`
- `less_than_or_equal`
- `greater_than`
- `greater_than_or_equal`
- `equal`
- `between`
- `contains`
- `fits`

Initial metrics:

- Maximum tracking motion
- Maximum elongation
- Maximum corner rotation
- Minimum acceptance
- Minimum integration
- Minimum target margin
- Min/max exposure
- Target must fit
- Mount architecture
- Maximum cost/mass
- Minimum runtime

Scopes:

- `current_target`
- `all_targets`
- `current_session`
- `design_general`

## 18. Extensions

Top-level extensions are namespaced, preserved when practical, ignored by core v1 calculations, and cannot override core fields.

## 19. Minimal valid v1 document

A minimal static-geometry document requires:

- Version and ID/revision
- Metadata
- Scenario mode with latitude/direct alt-az or ephemeris data
- A target with geometry
- Aperture/focal length
- Optical blur representation
- Sensor width/height/pixels/pitch
- Filter selection
- Mount architecture
- Tracking object
- Exposure and capture settings
- Constraints array
- Notes and extensions

The complete example in the original specification used:

- 30 mm aperture
- 160 mm focal length
- 11.136×6.264 mm sensor
- 3840×2160 at 2.9 µm
- Alt-az
- 10 s exposure
- 60-minute session
- Direct altitude 45°, azimuth 180°
- Average seeing 2.5″

## 20. Calculation request

### CalculationRequest

- `message_type: calculate_design`
- `request_id`
- `design_id`
- `design_revision`
- `engine_version`
- `calculation_mode`
- `requested_groups`
- `design`
- `comparison_context`
- `options`

Modes:

- `fast`
- `normal`
- `detailed`

Groups:

- `validation`
- `static_geometry`
- `target_framing`
- `scenario_geometry`
- `mount_kinematics`
- `tracking`
- `blur`
- `field_rotation`
- `sensitivity`
- `exposure_sweep`
- `session`
- `stack_geometry`
- `constraints`
- `recommendations`
- `all`

### CalculationOptions

- `include_formula_records`
- `include_dependency_paths`
- `include_diagnostics`
- `retain_sample_paths`
- `phase_sample_count`
- `session_sample_interval_s`
- `conservative_policy`

Conservative policy:

- `median`
- `percentile_95`
- `worst_case`
- `design_threshold_setting`

## 21. Calculation response

### CalculationResponse

- `message_type: calculation_result`
- `request_id`
- `design_id`
- `design_revision`
- `engine_version`
- `schema_version`
- `status`
- `started_at`
- `completed_at`
- `calculated_groups`
- `stale_groups`
- `validation`
- `results`
- `issues`
- `assumptions`
- `formulas`
- `diagnostics`

Status:

- `complete`
- `partial`
- `failed`
- `cancelled`
- `superseded`

Partial responses retain valid independent groups.

## 22. Standard result value

### ResultValue

- `status`
- `value`
- `unit`
- `display_precision`
- `confidence`
- `uncertainty`
- `dependencies`
- `assumption_ids`
- `issue_ids`
- `formula_id`

Status:

- `valid`
- `marginal`
- `poor`
- `invalid`
- `unavailable`
- `stale`

Display precision modes:

- `decimal_places`
- `significant_figures`
- `range`
- `approximate`
- `integer`

Confidence record:

- `level`
- `internal_score`
- `limiting_dependency`
- `sensitivity_warning`

## 23. Result groups

### StaticGeometryResults

- Effective focal length
- Focal ratio
- Clear/effective area
- Diffraction
- Image scales
- FOVs
- Active sensor dimensions
- Frame size

### TargetFramingResults

- Target pixel dimensions
- Margins
- Fit status
- Image-circle coverage
- Core/halo fit
- Geometry

Fit:

- `does_not_fit`
- `tight`
- `good`
- `excess_field`
- `unknown`

### SamplingResults

- Seeing
- Diffraction
- Optical FWHM
- Base FWHM arcsec/pixels
- Pixels/FWHM
- Classification

### ScenarioGeometryResults

- Session samples
- Altitudes
- Airmasses
- Visible duration
- Below-minimum duration

### MountKinematicResults

- Architecture
- Axis samples
- Maximum rates/accelerations
- Range status
- Zenith risk
- Meridian event
- Condition status

### TrackingResults

- Exposure
- Phase results
- Median
- 95th percentile
- Worst
- Selected policy result

### BlurResults

- Contributions
- Base/motion/rotation/pixel/total covariance
- Major/minor FWHM arcsec/pixels
- Elongation
- Axis angle
- Dominant contribution

### FieldRotationResults

- Start/end/delta rotation
- Rotation rate
- Center/mid/corner/target motion
- Session samples
- Rotation exposure limit

### SensitivityResults

- Throughput factors
- Baseline ID
- Relative ratios
- Photometric availability
- SNR results

### ExposureSweepResults

- Candidates
- Shortest practical
- Recommended min/max
- Conservative
- Longest acceptable
- Hard limit/reason
- Plateau
- Boundary optimum

### SessionResults

- Wall/exposure/readout/solve/recenter/dither/settle/other time
- Attempted/accepted/rejected frames
- Acceptance
- Effective integration
- Primary rejection
- Timeline

### StackGeometryResults

- Common/union coverage
- Crop
- Target/core/halo retention
- Geometry

### ConstraintEvaluation

- ID
- Status
- Actual/threshold
- Unit
- Difference
- Issue

Constraint status:

- `pass`
- `marginal`
- `fail`
- `unknown`

## 24. Issue contract

### CalculationIssue

- `issue_id`
- `code`
- `severity`
- `title`
- `message`
- `field_paths`
- `affected_result_groups`
- `suggested_action`
- `source`
- `dismissible`

Severity:

- `fatal`
- `error`
- `warning`
- `advisory`
- `information`

Source:

- `user_input`
- `preset`
- `catalog`
- `calculation`
- `migration`
- `worker`
- `unknown`

Initial stable codes include document/schema, scenario, target, optics, camera, mount/tracking, capture, and stack categories.

## 25. Assumption contract

### CalculationAssumption

- `assumption_id`
- `title`
- `description`
- `field_paths`
- `default_value`
- `unit`
- `confidence`
- `affects_groups`
- `user_can_override`

Material recommendation assumptions must be returned.

## 26. Formula record

### FormulaRecord

- `formula_id`
- `name`
- `description`
- `symbolic_expression`
- `substituted_expression`
- `intermediate_values`
- `result_value`
- `unit`
- `assumptions`
- `limitations`
- `dependency_paths`

Formula records are explanatory, never executable.

## 27. Recommendation contract

### Recommendation

- `recommendation_id`
- `rule_id`
- `category`
- `severity`
- `status`
- `title`
- `problem`
- `evidence`
- `proposed_changes`
- `expected_benefits`
- `tradeoffs`
- `next_bottleneck`
- `confidence`
- `affected_constraints`
- `assumption_ids`
- `suppression_reason`

Categories:

- Framing
- Sampling
- Tracking
- Rotation
- Exposure
- Stacking
- Sensitivity
- Mount
- Camera
- Filter
- Session
- Practicality

Severity:

- `critical`
- `high_value`
- `optional`
- `low_value`
- `counterproductive_warning`

Status:

- `active`
- `previewed`
- `applied`
- `dismissed`
- `suppressed`

Evidence:

- Metric
- Current/threshold
- Unit
- Result path
- Explanation

Proposed change:

- `replace`
- `add`
- `remove`
- `select_preset`
- `set_range`
- `change_mode`

Expected benefit includes before/after, absolute/percentage change, unit, confidence.

## 28. Recommendation preview

Request:

- `message_type: preview_recommendation`
- IDs/revision
- Recommendation ID
- Proposed changes
- Mode
- Comparison metrics

Response:

- Base revision
- Status
- Changes
- Before/after
- Benefits
- Regressions
- Violated constraints
- Next bottleneck
- Issues

Status:

- `valid`
- `invalid`
- `worse_overall`
- `constraint_conflict`
- `insufficient_confidence`

## 29. Design commands

### DesignCommand

- `command_id`
- `command_type`
- `design_id`
- `base_revision`
- `label`
- `operations`
- `created_at`
- `source`

Command types:

- `field_edit`
- `preset_apply`
- `section_reset`
- `recommendation_apply`
- `sweep_candidate_apply`
- `constraint_edit`
- `import_merge`

Sources:

- `user`
- `recommendation`
- `sweep`
- `preset`
- `migration`
- `system`

Operations follow JSON Patch add/remove/replace.

Successful command increments revision.

## 30. Worker protocol

Common:

- `message_type`
- `request_id`
- `worker_generation`
- `sent_at`

App → worker:

- `initialize_worker`
- `calculate_design`
- `preview_recommendation`
- `cancel_request`
- `clear_cache`
- `ping`

Worker → app:

- `worker_ready`
- `calculation_progress`
- `calculation_result`
- `recommendation_preview_result`
- `request_cancelled`
- `worker_error`
- `pong`

Progress phases:

- Validating
- Static geometry
- Scenario geometry
- Kinematics
- Tracking
- Blur
- Exposure sweep
- Session
- Recommendations
- Finalizing

A response is accepted only when design ID, revision, generation, and active request match.

## 31. Sweep contract

### SweepRequest

- `message_type: start_sweep`
- IDs/revision
- Base design
- Variables
- Mode
- Requested metrics
- Constraints
- Optimization
- Options

Variable:

- Field path
- Linear/log/explicit
- Min/max
- Samples
- Explicit values
- Unit

Optimization:

- Primary metric
- Maximize/minimize/target range
- Near-optimal fraction
- Prefer lower complexity
- Prefer shorter exposure

Initial metrics:

- Relative stack
- Integration
- Acceptance
- Major FWHM
- Tracking motion
- Target margin

### SweepResult

- Status
- Variables
- Samples
- Feasible region
- Recommended region
- Selected candidates
- Issues
- Diagnostics

Each sample stores inputs, validity, requested metrics, constraints, bottleneck, confidence.

## 32. Comparison contract

### ComparisonRequest

- IDs
- Designs
- Baseline
- Normalization
- Shared overrides
- Metrics
- Mode

Normalization:

- Same target
- Same scenario
- Same wall time
- Same exposure
- Recommended exposure each
- Same accepted integration

Design entry:

- Design
- Role
- Assumption profile
- Temporary overrides

Role:

- Baseline
- Candidate
- Reference

### ComparisonResponse

- Status
- Normalization
- Design results
- Metric rows
- Advantages/disadvantages
- Confidence notes
- Issues

Metric rows show values, baseline delta, confidence, best/worst, and comparison validity.

## 33. Catalog base

### CatalogRecord

- `catalog_id`
- `catalog_version`
- `record_id`
- `record_version`
- `record_type`
- `display_name`
- `aliases`
- `status`
- `reviewed_at`
- `source_notes`
- `tags`
- `extensions`

Record types:

- Target
- Sensor
- Camera
- Optic
- Filter
- Mount
- Reference telescope
- Assumption profile

Status:

- Active
- Provisional
- Deprecated
- Archived

## 34. Target catalog record

- Base record
- Coordinates
- Geometry
- Classification
- Brightness
- Framing notes
- Source metadata

Production requires coordinates, width/height, type, spectral class, and sources.

## 35. Sensor catalog record

- Manufacturer/model
- Geometry
- Noise profiles
- Spectral response
- Sources

Noise profile:

- ID/name
- Gain description
- Read noise
- Full well
- Conversion gain
- ADC
- Effective QE
- Source metadata

## 36. Optic catalog record

- Manufacturer/model
- Class
- Aperture
- Focal length
- Obstruction
- Transmission
- Image circle
- Optical blur
- Sources

Classes:

- Camera lens
- Guide scope
- Refractor
- Reflector
- Catadioptric
- Generic
- Custom

## 37. Mount preset record

- Architecture
- Detail level
- Limits
- Basic performance
- Setup requirements
- Sources

Qualitative setup metadata never overrides calculated values.

## 38. Commercial reference record

### ReferenceTelescopeRecord

- Base record
- Manufacturer/product
- Published design
- Assumption profiles
- Immutable fields
- Volatile fields
- Sources

Published design uses DesignDocument section shapes; unknowns stay null.

Assumption profile:

- ID/version/name
- Description
- Design patch operations
- Confidence
- Assumption IDs
- Review date

Immutable fields are JSON Pointer paths.

Volatile fields such as price carry observation date, region, currency, and source.

## 39. Preset application

Request:

- Preset reference
- Target section
- Mode
- Preserve overrides
- Preview only

Modes:

- Replace section
- Fill empty
- Merge known
- Duplicate and apply

Preview lists changed/replaced/missing fields, assumptions, and warnings.

## 40. Import contract

Request:

- Raw document
- Mode
- Preserve unknown fields
- Resolve presets
- Allow lossy migration

Modes:

- Open as new
- Replace current
- Merge
- Inspect only

Response:

- Status
- Original/result schema
- Migrated document
- Migration steps
- Preset resolution
- Warnings/errors
- Lossy changes

Status:

- Ready
- Ready with warnings
- Migration required
- Unsupported
- Invalid

## 41. Migration boundaries

Version 1 supports older v1 minor/patch versions, not necessarily v2.

Migrations apply sequentially and record:

- ID
- From/to
- Timestamp
- Changed paths
- Inserted assumptions
- Warnings
- Lossy flag

Lossy migration requires approval and preserves original.

Missing preset version resolution order:

1. Exact
2. Archived bundled
3. Explicit replacement
4. Offer current
5. Preserve embedded snapshot
6. Detach if needed

No silent substitution.

## 42. Cache contract

Cache entry:

- Key
- Engine/schema version
- Dependency hash
- Mode
- Result group
- Timestamp
- Result

Invalid on version, dependency, mode, or preset change.

## 43. Revision and concurrency

- Revision increments per committed command.
- Drafts/previews do not.
- Autosave stores full inputs.
- Multiple tabs detect revision conflicts.
- User chooses duplicate, overwrite, or inspect.

## 44. Report contract

Report request:

- Report ID/template version
- Design
- Calculation response
- Comparison response
- Sections
- Privacy
- Display options

Privacy:

- Exact/rounded/removed location
- Notes
- Source URLs
- Volatile prices

Renderer does not recalculate.

## 45. Version 1 API operations

- Validate design
- Calculate static geometry
- Calculate scenario geometry
- Calculate tracking
- Calculate field rotation
- Calculate blur
- Evaluate exposure sweep
- Simulate session
- Evaluate recommendations
- Compare designs

## 46. API error behavior

Expected engineering problems return structured issues, not unhandled exceptions.

Unhandled errors are limited to programming defects, corrupt internal state, worker failure, resource exhaustion, or unsupported operations.

Worker errors include request ID, safe code/message, diagnostic ID, and retryability.

## 47. Determinism

Identical design/schema/engine/presets/mode/phase settings produce identical values within tolerance.

Future stochastic models require algorithm ID, seed, and sample count.

## 48. Contract acceptance criteria

1. Complete design has no UI state.
2. Static geometry works from minimal document.
3. Unknown differs from zero.
4. Angular errors specify statistics.
5. References preserve unknowns.
6. Assumption profiles are visibly separate.
7. Previews use temporary operations.
8. Old responses cannot overwrite.
9. Partial failures preserve other results.
10. Comparison identifies invalid metrics.
11. Sweeps do not mutate base.
12. Migration sequential.
13. Missing preset versions not silently updated.
14. Reports identify versions.
15. Location privacy supported.
16. Results expose confidence/dependencies/assumptions/formulas.
17. F01–F08 fit core schema.
18. Future advanced mechanics can be added without altering v1 meaning.

## 49. Deferred schema

- Motor curves
- Multi-stage drivetrain
- Encoder placement
- Advanced kinematics
- Tracking/guiding logs
- Focus mechanics
- Detailed calibration
- Compute/power/construction/reliability
- Full spectral curves
- Horizon profiles
- Mosaic definitions

---

<!-- Source file: 09_wireframes_repository_backlog_v0.9.md -->

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
