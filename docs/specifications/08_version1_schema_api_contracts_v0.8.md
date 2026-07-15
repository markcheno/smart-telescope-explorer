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
