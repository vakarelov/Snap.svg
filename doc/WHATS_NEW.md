# What’s New in this Snap.svg fork

Date: 2025-10-24

This fork extends Snap.svg with powerful geometry, interaction, and UI-building utilities while keeping the original API intact. It adds Bezier/PolyBezier tooling, polygon operations (including concave/convex hulls and SAT overlap), robust BBox helpers, rich Element and Paper extensions, GUI interactions, color palettes, and comprehensive TypeScript types.

## Highlights

- Geometry powerhouse:
  - Bezier and PolyBezier utilities (split, length, normals, offsets/outlines, intersections, arcs approximation).
  - Polygon ops: intersection, point-in-polygon, area, concave hull (hull.js), convex overlap (SAT).
  - Rich BBox class with contains, union, intersect, scaling, rotating bbox, and path/rect helpers.
- Element upgrades:
  - Coordinate transforms (global/local), cursor/screen points, rect overlaps, center of mass/rotation.
  - Interaction primitives: move, revolve (rotate around center), and makeDraggable with constraints/snap.
  - Utilities: show/hide variants, flatten, embed anchors/HTML, clipPath/mask creators, path conversions.
  - Geometry accessors: attrs getter, geometry attr helpers, PolyBezier conversion and point editing.
- Paper helpers and UI:
  - Builders: grid, zigzag, arc-fan, disk segments/disk, circles from 2–3 points, ellipse from equation.
  - foreignObject/html insert, nested SVGs, canvas overlays, buttons, text measurement/multiline text.
  - Border image tiling with auto-update via mutation observers.
- Interaction & GUI extras:
  - Region-select rectangle, cursor helpers, tooltip-style messages, canvas rasterization and overlays.
- Colors and types:
  - Material UI and Flat UI palettes, indexed color helper; extensive ambient TypeScript declarations.

## New and Extended APIs

### Snap.Element additions (selected)

- Identity/refs: `getId()`, `setIdFollowRefs()`, `getReferringToMe()`
- Coordinates: `globalToLocal(p)`, `getCursorPoint(evt)`, `getFromScreenDistance(dx,dy)`
- Size/overlap: `getClientWidth()`, `getClientHeight()`, `isInRect(rect)`, `isOverlapRect(rect)`
- Centers: `centerOfMass()`, `centerRotation()`
- Visibility: `showInline()`, `hideInline()`, `show()`, `hide()`
- Lifecycle: overridden `remove()` cleans linked clipPath/mask/refs
- Geometry conversions: `makePath()`, `pathFirstPoint()`, `toPolyBezier()`, `getFirstPoint()`/`getLastPoint()`/`setFirstPoint()`
- Effects: `createClipPath()`, `createMask()`, `transparentToMouse(flag)`
- Attributes: `attrs()` merged getter, `getGeometryAttr()`, `getAttributes()`
- Interaction:
  - `move(dx, dy, opts)`, `revolve(angle, opts)`
  - `makeDraggable({bounds, snap, onstart, onmove, onend})`
- Transforms: `scale`, `translate`, `translateAnimate`, `translate_glob` (global-aware)

### Snap.Paper additions (selected)

- Builders/graphics: `grid`, `zigzag`, `arcFan`, `diskSegments`/`disk`, `circleCentPoint`, `circleTwoPoints`, `circleThreePoints`, `ellipseFromEquation`
- UI/embedding: `foreignObject`, `htmlInsert`, `embeddedSVG`, `canvas`, `button`, `textInputBox`, `multilineText`, `measureText`
- Effects: `clipPath`
- Utilities: `addExtension`, `processExtensions`; promotion of Paper constructors to Element with `Snap.FORCE_AFTER`
- Border image system: `borderImage` with compute/crop/update and auto-observe

### Snap namespace

- Geometry: `Snap.Bezier`, `Snap.PolyBezier` (full-featured classes and helpers)
- Polygons: `Snap.polygons` with `intersect`, `pointInPolygon`, `polygonArea`, and `sat`/`con_overlap`
- Hulls: `Snap.hull(points, concavity, format)`, `Snap.convexHull(points, format)`
- Boxes: `Snap.BBox` class and `Snap.box(...)` helpers
- Colors: `Snap.mui`, `Snap.flat`, `Snap.importMUIColors()`, `Snap.getIndexColor(i, palette)`

### Types

- `types/snap.svg.d.ts` models core Snap APIs plus all extensions above: BBox, Bezier/PolyBezier, extended Element/Paper methods, Polygon helpers, and more.
- Central JSDoc typedefs in `src/jsdoc-types.js` keep docs consistent across modules.

## Compatibility and Behavior Notes

- Additive by design: core Snap APIs remain available. Extensions live on `Element.prototype`, `Paper.prototype`, and `Snap`.
- `Element.remove()` is overridden to also clean up related clipPaths/masks/links, reducing leaks; behavior is stricter but should be non-breaking.
- Some GUI helpers expect a browser DOM with `screenCTM`, `DOMPoint`, and `SVGMatrix` support.
- Interaction utilities emit/consume events via `eve`; ensure the event bus is available if you rely on those hooks.

## Demos and Examples

- Explore `demos/` for usage patterns: animated map, mascot, tutorial, and more.
- Quick ideas:
  - Concave hull selection: use `Snap.hull(points, concavity)` to outline scattered points.
  - Draggable with bounds and snap: `el.makeDraggable({ bounds: {x:0,y:0,w:800,h:600}, snap: 10 })`.
  - Border image tiling: `paper.borderImage(img, targetRect, opts)` with auto-update when attributes change.

## Migration Tips

- Prefer new helpers for clarity:
  - Use `element.globalToLocal(p)` instead of manual `matrix.invert()` math.
  - Use `paper.htmlInsert()` for HTML overlays via `foreignObject`.
  - Use `Snap.box()` methods for bbox math instead of ad-hoc calculations.
- If you previously cleaned up clipPaths/masks manually on removal, you can now rely on the enhanced `remove()`.

## Where to Look in the Code

- Element helpers: `src/element_extensions.js`
- Paper helpers/UI: `src/paper_extensions.js`
- Bezier/PolyBezier: `src/bezier.js`
- Polygons/SAT: `src/polygons.js`, `src/convex_overlap.js`
- Hulls: `src/hull.js`
- BBox: `src/bbox.js`
- GUI interactions and rasterization: `src/gui_interactions.js`
- Types: `types/snap.svg.d.ts`

---

Questions or gaps? Open an issue or ping in the PR—happy to add examples or fill in missing docs.
