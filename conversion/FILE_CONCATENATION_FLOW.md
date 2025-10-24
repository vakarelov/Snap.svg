# File Concatenation Flow

This diagram shows how the source files concatenate to form the final bundle.

## Current Structure (svg.js only)

```
┌─────────────────────────────────────────────────────────────┐
│                       svg.js (2,445 lines)                  │
│─────────────────────────────────────────────────────────────│
│ (function (root) {                                          │
│   // Snap factory                                           │
│   // Constants & globals                                    │
│   // Utilities (math, color, etc.)                          │
│   // Element constructor                                    │
│   // Fragment constructor                                   │
│   // Paper constructor                                      │
│   // Plugin system                                          │
│   return Snap;                                              │
│ }(window));                                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
                  Concatenate with:
                  - mina.js
                  - element.js (plugin methods)
                  - paper.js (plugin methods)
                  - other plugins
                           ↓
              ┌───────────────────────┐
              │  dist/snap.svg.js     │
              └───────────────────────┘
```

## Proposed Structure (Modular)

```
Build Order (Gruntfile.js):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. mina.js
   ├─ Animation easing library
   └─ Independent module

2. snap-header.js (NEW)
   ├─ Copyright headers
   ├─ IIFE start: (function (root) {
   ├─ Snap factory function
   ├─ Global setup: glob, hub, hub_rem
   ├─ Constants: svgTags, cssAttr, geomAttr
   ├─ Regex patterns
   └─ Helper functions: $, ID

3. Snap.js (NEW)
   ├─ String utilities: format, clone
   ├─ Math utilities: rad, deg, angle, len, sin, cos, etc.
   ├─ Color utilities: getRGB, hsb, hsl, rgb, color conversions
   ├─ Type checking: is, snapTo, cacher
   ├─ Path parsing: parsePathString, transform2matrix
   └─ DOM utilities: Snap.parse, Snap.select

4. Fragment.js (NEW)
   ├─ Fragment constructor
   ├─ Snap.fragment factory
   ├─ make() function
   └─ wrap() function

5. element.js (MODIFIED)
   ├─ Element constructor (ADDED)
   └─ Element.prototype methods (EXISTING)
       ├─ getBBox()
       ├─ attr()
       ├─ transform()
       └─ ... all other methods

6. animation.js
   ├─ Element.prototype.animate()
   └─ Animation methods

7. matrix.js
   ├─ Matrix class
   └─ Transform methods

8. attr.js
   ├─ Attribute setters/getters
   └─ Snap._.unit2px

9. class.js
   ├─ Element.prototype.addClass()
   └─ Class manipulation methods

10. attradd.js
    └─ Additional attribute handlers

11. paper.js (MODIFIED)
    ├─ Paper constructor (ADDED)
    └─ Paper.prototype methods (EXISTING)
        ├─ rect()
        ├─ circle()
        ├─ path()
        └─ ... all shape methods

12. bbox.js
    └─ BBox utilities

13. path.js
    └─ Path manipulation

14. set.js
    └─ Set class and methods

15. equal.js
    └─ Snap.equal()

16. mouse.js
    └─ Mouse event handlers

17. filter.js
    └─ SVG filters

18. align.js
    └─ Alignment utilities

19. colors.js
    └─ Additional color utilities

20. snap-footer.js (NEW)
    ├─ Snap.plugin() function
    ├─ IIFE close: }
    └─ Export: (window));

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                          ↓
                Grunt Concatenation
                          ↓
              ┌───────────────────────┐
              │  dist/snap.svg.js     │
              │  (identical output)   │
              └───────────────────────┘
```

## Visual File Structure

```
src/
│
├─── mina.js ────────────────────────────────────────┐
│    (Animation easing)                              │
│                                                     │
├─── snap-header.js ─────────────────────────────────┤
│    ┌─────────────────────────────────────┐        │
│    │ (function (root) {                  │        │
│    │   const Snap = function(w, h) {...} │        │
│    │   const glob = {...};               │        │
│    │   const hub = {};                   │        │
│    │   const svgTags = {...};            │        │
│    │   function $(el, attr) {...}        │        │
│    └─────────────────────────────────────┘        │
│                                                     │
├─── Snap.js ────────────────────────────────────────┤
│    ┌─────────────────────────────────────┐        │
│    │   Snap.format = ...                 │        │
│    │   Snap.rad = ...                    │        │
│    │   Snap.deg = ...                    │        │
│    │   Snap.getRGB = ...                 │        │
│    │   Snap.hsb = ...                    │        │
│    │   Snap.parsePathString = ...        │        │
│    └─────────────────────────────────────┘        │
│                                                     │
├─── Fragment.js ────────────────────────────────────┤
│    ┌─────────────────────────────────────┐        │  Concatenate
│    │   function Fragment(frag) {...}     │        │      ↓
│    │   Snap.fragment = ...               │        │  ┌─────────┐
│    │   function make(name, parent) {...} │        │  │ Bundle  │
│    │   function wrap(dom) {...}          │        │  │ (IIFE)  │
│    └─────────────────────────────────────┘        ├─→│         │
│                                                     │  │ Same    │
├─── element.js ─────────────────────────────────────┤  │ Scope   │
│    ┌─────────────────────────────────────┐        │  │         │
│    │ Snap_ia.plugin(function(...) {      │        │  │ All     │
│    │   function Element(el) {...}        │        │  │ vars    │
│    │   Element.prototype.attr = ...      │        │  │ shared  │
│    │   Element.prototype.getBBox = ...   │        │  │         │
│    │ });                                 │        │  └─────────┘
│    └─────────────────────────────────────┘        │
│                                                     │
├─── [other plugins: animation.js, matrix.js, etc]──┤
│                                                     │
├─── paper.js ───────────────────────────────────────┤
│    ┌─────────────────────────────────────┐        │
│    │ Snap_ia.plugin(function(...) {      │        │
│    │   function Paper(w, h) {...}        │        │
│    │   Paper.prototype.rect = ...        │        │
│    │   Paper.prototype.circle = ...      │        │
│    │ });                                 │        │
│    └─────────────────────────────────────┘        │
│                                                     │
├─── [more plugins: bbox.js, path.js, etc] ─────────┤
│                                                     │
└─── snap-footer.js ─────────────────────────────────┘
     ┌─────────────────────────────────────┐
     │   Snap.plugin = function(f) {...}   │
     │   root.Snap = Snap;                 │
     │   return Snap;                      │
     │ }(window));                         │
     └─────────────────────────────────────┘
```

## Scope Hierarchy

```
┌───────────────────────────────────────────────────────────┐
│ IIFE Scope (shared by all files)                         │
│                                                           │
│  snap-header.js defines:                                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │ const Snap = function(w, h) { ... }             │    │
│  │ const glob = { win: ..., doc: ... }             │    │
│  │ const hub = {}                                  │    │
│  │ const svgTags = { ... }                         │    │
│  │ const cssAttr = { ... }                         │    │
│  │ function $(el, attr) { ... }                    │    │
│  │ const ID = function(el) { ... }                 │    │
│  └─────────────────────────────────────────────────┘    │
│         ↓ available to ↓                                 │
│                                                           │
│  Snap.js uses:                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Snap.rad = function(deg) { ... }                │    │
│  │ Snap.getRGB = function(color) {                 │    │
│  │   // uses glob, hub from snap-header.js         │    │
│  │ }                                                │    │
│  └─────────────────────────────────────────────────┘    │
│         ↓ available to ↓                                 │
│                                                           │
│  Fragment.js uses:                                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │ function Fragment(frag) { ... }                 │    │
│  │ function make(name, parent) {                   │    │
│  │   const res = $(name);  // uses $ from header   │    │
│  │   return wrap(res);                             │    │
│  │ }                                                │    │
│  │ function wrap(dom) {                            │    │
│  │   // uses Element, Paper (forward references)   │    │
│  │ }                                                │    │
│  └─────────────────────────────────────────────────┘    │
│         ↓ available to ↓                                 │
│                                                           │
│  element.js plugin:                                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Snap_ia.plugin(function(Snap, Element, Paper,   │    │
│  │                         glob, Fragment, eve) {  │    │
│  │   // Element, Paper are parameters              │    │
│  │   function Element(el) {                        │    │
│  │     const hub = Snap._.hub;  // from header     │    │
│  │     const id = ID(this);     // from header     │    │
│  │     hub[id] = this;                             │    │
│  │   }                                              │    │
│  │   Element.prototype.attr = function() {...}     │    │
│  │ });                                              │    │
│  └─────────────────────────────────────────────────┘    │
│         ↓ available to ↓                                 │
│                                                           │
│  paper.js plugin:                                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Snap_ia.plugin(function(Snap, Element, Paper,   │    │
│  │                         glob, Fragment, eve) {  │    │
│  │   function Paper(w, h) {                        │    │
│  │     const res = make("svg", glob.doc.body);     │    │
│  │     // uses make from Fragment.js               │    │
│  │     // uses Element constructor                 │    │
│  │   }                                              │    │
│  │   Paper.prototype.rect = function() {...}       │    │
│  │ });                                              │    │
│  └─────────────────────────────────────────────────┘    │
│         ↓ available to ↓                                 │
│                                                           │
│  snap-footer.js:                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Snap.plugin = function(f) {                     │    │
│  │   f(Snap, Element, Paper, glob, Fragment, eve); │    │
│  │ }                                                │    │
│  │ return Snap;                                     │    │
│  │ }(window));  // Close IIFE                      │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## Key Points

1. **Single IIFE Scope**: All files share the same function scope after concatenation

2. **Order Matters**: 
   - snap-header.js must come first (defines Snap, glob, hub)
   - Snap.js comes second (adds utilities to Snap)
   - Fragment.js defines make/wrap used by Element/Paper
   - element.js and paper.js can access everything defined before them
   - snap-footer.js closes the IIFE

3. **No Import/Export**: Files don't use import/export - they just add to the shared scope

4. **Plugin System**: 
   - Element and Paper constructors are defined early
   - Plugins extend their prototypes
   - snap-footer.js provides Snap.plugin() for user plugins

5. **Forward References**: 
   - wrap() can reference Element and Paper even though they're defined later
   - This works because wrap() is called at runtime, after all files are loaded

6. **Browser Code = Source Code**: 
   - The concatenated bundle has the same structure as source files
   - Debugging shows original file structure
   - No module transformation confusion

## Comparison: Before vs After

### Before (1 file)
```
svg.js (2,445 lines)
  ↓ concat with plugins
dist/snap.svg.js
```

### After (6 new files)
```
snap-header.js (300 lines)
Snap.js (1,100 lines)
Fragment.js (50 lines)
element.js (500 lines) ← modified
paper.js (400 lines) ← modified
snap-footer.js (50 lines)
  ↓ concat with other plugins
dist/snap.svg.js (identical output)
```

### Benefits
- ✅ Same output, better organization
- ✅ Easier to find code
- ✅ Smaller files to edit
- ✅ Maintains all existing behavior
- ✅ No new dependencies
- ✅ Plugin system unchanged
