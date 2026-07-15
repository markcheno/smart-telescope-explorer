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
