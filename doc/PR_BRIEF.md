# PR Brief: Enhanced Geometry, Interaction, and UI Extensions for Snap.svg

## Title

feat: Geometry, interaction, UI, and typing extensions for Snap.svg (Bezier/PolyBezier, polygons, hulls, BBox, Element/Paper helpers)

## Summary

This PR adds a comprehensive set of geometry utilities, interaction primitives, UI-building helpers, and TypeScript types on top of Snap.svg. It retains compatibility with the core API while enabling advanced tasks such as Bezier editing, polygon/hull analysis, draggable and constrained movement, border image tiling, HTML embedding via foreignObject, rasterization, and more.

## Motivation

- Provide modern vector-geometry primitives within Snap.svg, minimizing external dependencies during prototyping and production.
- Improve developer ergonomics with high-level Element/Paper helpers for transforms, interactions, and composition.
- Offer reliable types for better IDE support and safer code.

## Scope of Changes

### New/extended modules (src/)

- `bezier.js`: Full Bezier and PolyBezier engine (split, length, normals, offset/outline, intersections, arcs, PolyBezier aggregation).
- `polygons.js`: Polygon operations (intersection, point-in-polygon, area, distance/alignment helpers).
- `convex_overlap.js`: SAT-based convex polygon overlap checks; exposed under `Snap.polygons.sat`.
- `hull.js`: Concave hull integration (hull.js) plus convex hull wrapper.
- `bbox.js`: BBox class and `Snap.box` helpers with rich geometry API and rotating bbox.
- `element_extensions.js`: Element prototype enhancements (IDs/refs, coordinate transforms, overlaps, center of mass/rotation, path conversion, clip/mask, interaction: move/revolve/draggable, transforms and utilities).
- `paper_extensions.js`: Paper prototype enhancements (grid/zigzag/arcFan/disk segments/circle/ellipse builders; `foreignObject`/`htmlInsert`; `embeddedSVG`; `canvas`; `button`; text helpers; border image tiling; extension processor; `Snap.FORCE_AFTER`).
- `paper_extensions.js`: Paper prototype enhancements (grid/zigzag/arcFan/disk segments/circle/ellipse builders; `foreignObject`/`htmlInsert`; `embeddedSVG`; `canvas`; `button`; text helpers; border image tiling; extension processor; `Snap.FORCE_AFTER`); plus Paper constructors/methods copied onto Element to enable method chaining during SVG construction.
- `colors.js`: Material UI and Flat UI palettes; `Snap.importMUIColors`; `Snap.getIndexColor`.
- `jsdoc-types.js`: Central typedefs for points, ranges, bbox-like, polar, etc.

### Types

- `types/snap.svg.d.ts`: Ambient declarations for the above APIs plus core Snap types (Paper, Element, Mina, path helpers, etc.).

### Demos/docs

- Existing demos remain available in `demos/`; new features are exercised via code snippets in `doc/WHATS_NEW.md`.

## Breaking Changes

- None intentionally. Additions are primarily additive to `Element.prototype`, `Paper.prototype`, and `Snap`.
- Note: `Element.remove()` is enhanced to also clean linked clipPaths/masks/refs. This is stricter behavior but should be non-breaking for typical workflows.

## Performance Considerations

- Geometry operations (Bezier outline/offset, polygon intersection, hull) are computational; avoid running them per-frame on large datasets.
- Border image auto-update uses mutation observers; impact should be negligible for typical attribute changes, but avoid excessive mutation churn.
- BBox computations use a cached convex hull (CHull) to keep rotated bbox and overlap queries fast even after transforms.

## Migration and Usage Notes

- Prefer helpers:
  - `el.globalToLocal(p)`, `el.getCursorPoint(evt)` for coordinate math.
  - `el.makeDraggable({ bounds, snap, onstart, onmove, onend })` for drag.
  - `paper.htmlInsert()` for HTML overlays via `foreignObject`.
  - `Snap.hull(points, concavity)` and `Snap.polygons.intersect(a, b)` for polygon tasks.
  - `Snap.box(...)`/`new Snap.BBox(...)` for bbox operations.
  - Paper methods on Element enable method-chaining construction, e.g., `el.rect(...).circle(...).path(...)` (appended with `Snap.FORCE_AFTER`).
- If you previously cleaned clip/mask links manually on removal, this is now automatic.

## Testing

- No new automated tests added in this PR. Existing test suite remains available in `test/`.
- Manual verification performed via demos and targeted usage of new helpers.
- Follow-ups: add focused unit tests for BBox math, SAT overlap, and Bezier outline reduce cases.

## Documentation

- New document: `doc/WHATS_NEW.md` (highlights, APIs, examples, migration).
- Types: `types/snap.svg.d.ts` aligns with runtime surface.


## Checklist

- [x] New APIs documented (`doc/WHATS_NEW.md`)
- [x] Type definitions updated (`types/`)
- [x] Demos verified where applicable
- [ ] Unit tests for new math-heavy paths (planned follow-up)

## Screenshots / Demos (optional)

- See `demos/` and try examples from `doc/WHATS_NEW.md`.
