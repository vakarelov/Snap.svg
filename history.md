##1.1

* Major fork enhancements across geometry, interactions, UI, and typing
* Geometry:
	* Added comprehensive Bezier and PolyBezier utilities (split, length, normals, offset/outline, intersections, arcs)
	* Added polygon operations (intersection, point-in-polygon, area) and SAT-based convex overlap checks
	* Integrated concave/convex hull helpers (`Snap.hull`, `Snap.convexHull`)
	* Introduced rich `Snap.BBox` class and `Snap.box(...)` helpers
		* BBox computations optimized via cached convex hull (CHull) for fast rotated bbox/overlap after transforms
* Element:
	* Coordinate helpers (global/local transforms, cursor/screen points), overlap checks, center of mass/rotation
	* Interaction primitives: `move`, `revolve`, and `makeDraggable({ bounds, snap, ... })`
	* Utilities: path conversions, clipPath/mask creation, flatten, embed anchors/HTML, visibility helpers
* Paper:
	* Builders: `grid`, `zigzag`, `arcFan`, `diskSegments`/`disk`, circle/ellipse conveniences
	* Embedding/UI: `foreignObject`, `htmlInsert`, `embeddedSVG`, `canvas`, `button`, text measurement and multiline text
	* Border image tiling system with auto-update
	* Paper constructors/methods copied to Elements to enable method-chaining during SVG construction
* GUI helpers: region-select, cursor helpers, message tooltips, rasterization and canvas overlays
* Colors/types: exposed color utilities and added comprehensive ambient TypeScript declarations
* See `doc/WHATS_NEW.md` for details and examples

* Bug fix

#0.5.0

* Added color palettes for Material and FlatUI
* Added methods for gradients: `Element.stops()`, `Element.addStop()`, `Element.setStops()`
* Fixed matrix splitting for better animation of matrices`
* Various bug fixes
* Better integration of tests and ESlint

#0.4.1

* Bug fixes.

#0.4.0

* Moved class and element related code into separate plugins
* Added `Element.align()` and `Element.getAlign()` methods
* Added animation support for `viewBox`
* Added support for `<symbol>`
* Added method `Paper.toDataURL()`
* Added method `Snap.closest()`
* Added methods to work with degrees instead of radians: `Snap.sin()`, `Snap.cos()`, `Snap.tan()`, `Snap.asin()`, `Snap.acos()`, `Snap.atan()` and `Snap.atan2()`
* Added methods `Snap.len()`, `Snap.len2()` and `Snap.closestPoint()`
* Added methods `Element.children()` and `Element.toJSON()`
* Various bug fixes

#0.3.0

* Added `.addClass()`, `.removeClass()`, `.toggleClass()` and `.hasClass()` APIs
* Added `Paper.mask()`, `Paper.ptrn()`, `Paper.use()`, `Paper.svg()`
* Mask & pattern elements are sharing paper methods (just like group)
* Added `Set.bind()` method
* Added syncronisation for `Set.animate()`
* Added opacity to the shadow filter
* Added ability to specify attributes as `"+=10"` or `"-=1em"` or `"*=2"`
* Fix negative scale
* Fix for `path2curve`
* Fixed shared `<defs>` issue
* Various bug fixes

#0.2.0

* Added support for text path
* Added `getBBox` method to the paper object
* Added `Element.appendTo()` and `Element.prependTo()`
* Added `getElementByPoint()`
* Added `Set.remove()` method
* Get rid of internal SVG parser in favor of the browser
* Fix for `xlink:href` setting for images
* Fix `Element.animate()`
* Fix for animate and stroke-dashoffset
* Absolute transforms fix
* Fix for animation of SVG transformations, matrices and polygon points
* Various bug fixes

#0.1.0

* Initial release
