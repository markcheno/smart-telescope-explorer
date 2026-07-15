# ADR 0002 — Canonical units and the standard result envelope

Status: accepted (R0)

## Context

The domain mixes millimetres, micrometres, degrees, radians, and arcseconds. Silent unit mixing is
the most likely source of wrong-but-plausible output. The spec (v0.4 §3, v0.8 §22) also requires
every result to carry provenance, confidence, and traceability rather than a bare number.

## Decision

- **Canonical internal units** (persisted, v0.8 §2.2): mm for optical/sensor dimensions, µm for pixel
  pitch, degrees for stored positions, arcseconds for angular error, seconds, °C, fractions, kg, W, Wh.
- **Branded quantity types** in `packages/units`. Conversions happen only at input/import/display
  boundaries. The constant `206265` (arcsec per radian) and deg↔rad live *only* in `units`.
- **Standard result envelope** (`ResultValue`): every engine output carries `status`, `value`,
  `unit`, `confidence`, `dependencies`, `assumption_ids`, and `formula_id`. Failures localize to the
  dependent result group; independent groups still return.
- `null` means *unknown*; `0` means *actual zero*; an omitted field is *not part of the object*.
  Unknown inputs must never be silently rendered as a fabricated number.

## Consequences

- Calc functions accept/return branded quantities, not raw `number`, at package boundaries.
- The UI reads confidence/assumptions/formulas straight off results — it never recomputes them.
