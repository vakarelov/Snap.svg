# Pragmatic Refactoring Strategy for Snap.svg

## Goal
Refactor `svg.js` into separate files while:
- **Preserving the plugin architecture** (Snap_ia.plugin pattern)
- **Keeping source code similar to browser code** (no ES6 imports/exports)
- **Maintaining backward compatibility**
- **Improving maintainability** through better file organization

## Philosophy

**Keep it Simple**: Files should be concatenated in order, just like they are now with Grunt. The source code structure should mirror the final bundled code, making debugging easier.

## Current Structure

```
svg.js (~2,445 lines)
├── IIFE wrapper start
├── Snap factory function
├── Constants & utilities
├── Element constructor
├── Fragment constructor
├── Paper constructor
├── Helper functions (wrap, make, $)
└── IIFE wrapper end + export
```

## Proposed Structure

```
src/
├── snap-header.js          # IIFE start, Snap factory, globals setup
├── Snap.js                 # Main Snap namespace and utilities
├── Fragment.js             # Fragment class
├── element.js              # Element class (ALREADY EXISTS as plugin)
├── paper.js                # Paper class (ALREADY EXISTS as plugin)
└── snap-footer.js          # IIFE end, exports, plugin system
```

**Build Process**: Concatenate in order (same as now)

## Detailed File Breakdown

### File 1: `snap-header.js` (~300 lines)
**Purpose**: IIFE start, Snap factory function, global setup

**Contents**:
```javascript
// Copyright headers...

(function (root) {
    Snap.version = "1.1";
    const eve = eve_ia;
    
    // Snap factory function
    function Snap(w, h) {
        if (w) {
            if (w.nodeType || (Snap._.glob.win.jQuery && w instanceof jQuery)) {
                return wrap(w);
            }
            // ... rest of factory logic
        }
        w = w == null ? "100%" : w;
        h = h == null ? "100%" : h;
        return new Paper(w, h);
    }
    
    // Global state
    Snap._ = {};
    var glob = {
        win: root.window || {},
        doc: (root.window && root.window.document) ? root.window.document : {},
    };
    Snap._.glob = glob;
    
    // Utility functions for global access
    Snap.setWindow = function (newWindow) { ... };
    Snap.getProto = function (proto_name) { ... };
    Snap.enableDataEvents = function (off) { ... };
    
    // Constants
    const has = "hasOwnProperty";
    const Str = String;
    const toFloat = parseFloat;
    // ... other constants
    
    const svgTags = { svg: 0, circle: 0, ... };
    const cssAttr = { "fill": 0, "stroke": 0, ... };
    const geomAttr = { "x": 0, "y": 0, ... };
    
    const xlink = "http://www.w3.org/1999/xlink";
    const xmlns = "http://www.w3.org/2000/svg";
    const hub = {};
    const hub_rem = {};
```

### File 2: `Snap.js` (~1,100 lines)
**Purpose**: Snap namespace utilities (math, color, parsing, etc.)

**Contents**:
```javascript
    // All utility functions that are currently in svg.js
    
    // String utilities
    Snap.format = function (token, json) { ... };
    Snap._.clone = function (obj) { ... };
    
    // Math utilities
    function rad(deg) { ... }
    function deg(rad) { ... }
    function angle(x1, y1, x2, y2, x3, y3) { ... }
    
    Snap.rad = rad;
    Snap.deg = deg;
    Snap.angle = angle;
    Snap.len = function (x1, y1, x2, y2) { ... };
    Snap.len2 = function (x1, y1, x2, y2) { ... };
    Snap.closestPoint = function (path, x, y) { ... };
    
    // Trig functions
    Snap.sin = function (angle) { ... };
    Snap.cos = function (angle) { ... };
    Snap.tan = function (angle) { ... };
    // ... etc
    
    // Type checking
    Snap.is = is;
    Snap.registerType = function (type, type_constr) { ... };
    Snap.snapTo = function (values, value, tolerance) { ... };
    
    // Color utilities
    Snap.getRGB = cacher(function (colour) { ... });
    Snap.hsb = cacher(function (h, s, b) { ... });
    Snap.hsl = cacher(function (h, s, l) { ... });
    Snap.rgb = cacher(function (r, g, b, o) { ... });
    Snap.color = function (clr) { ... };
    Snap.hsb2rgb = function (h, s, v, o) { ... };
    Snap.hsl2rgb = function (h, s, l, o) { ... };
    Snap.rgb2hsb = function (r, g, b) { ... };
    Snap.rgb2hsl = function (r, g, b) { ... };
    
    // Path parsing
    Snap.parsePathString = function (pathString) { ... };
    Snap._.svgTransform2string = svgTransform2string;
    Snap._.transform2matrix = transform2matrix;
    
    // DOM utilities (internal)
    const URL = Snap.url = function (url) { ... };
    Snap.fixUrl = function (url) { ... };
    Snap.elementFormId = function (id) { ... };
    
    function $(el, attr) { ... }
    Snap._.$ = $;
    Snap._.id = ID;
    
    // Fragment creation
    Snap.fragment = function () { ... };
    
    // Helper functions (used by Element and Paper)
    function make(name, parent) { ... }
    function wrap(dom) { ... }
    
    Snap._.make = make;
    Snap._.wrap = wrap;
    
    // Measurement utilities
    Snap.measureTextClientRect = function (text_el) { ... };
```

### File 3: `Fragment.js` (~50 lines)
**Purpose**: Fragment constructor and methods

**Contents**:
```javascript
    /**
     * Fragment constructor
     * @class Snap.Fragment
     * @param {DocumentFragment} frag DOM fragment
     */
    function Fragment(frag) {
        this.node = frag;
    }
    
    // Fragment could have prototype methods here if needed
    // Fragment.prototype.someMethod = function() { ... };
```

### File 4: `element.js` (ALREADY EXISTS - just move Element constructor)
**Current Status**: This file already exists as a plugin. We'll move the Element constructor from `svg.js` into it.

**Modification Strategy**:
```javascript
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    // ADD at the beginning of this file:
    
    /**
     * Element constructor
     * @class Snap.Element
     * @param {SVGElement} el Underlying DOM node
     */
    function Element(el) {
        if (el.snap in hub) {
            return hub[el.snap];
        }
        let svg;
        try {
            svg = el.ownerSVGElement;
        } catch (e) {}
        
        this.node = el;
        if (svg) {
            this.paper = new Paper(svg);
        }
        this.type = (el.tagName || el.nodeName || 
                     ((Snap._.glob.win.jQuery && el instanceof jQuery) ? "jquery" : null));
        if (this.type) this.type = this.type.toLowerCase();
        
        const id = this.id = ID(this);
        this.anims = {};
        this._ = {
            transform: [],
        };
        el.snap = id;
        hub[id] = this;
    }
    
    // THEN all the existing prototype methods follow:
    // Element.prototype.attr = function() { ... };
    // Element.prototype.getBBox = function() { ... };
    // ... etc (all existing code remains)
});
```

### File 5: `paper.js` (ALREADY EXISTS - just move Paper constructor)
**Current Status**: This file already exists as a plugin. We'll move the Paper constructor from `svg.js` into it.

**Modification Strategy**:
```javascript
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    // ADD at the beginning of this file:
    
    /**
     * Paper constructor
     * @class Snap.Paper
     * @param {number|string|SVGElement} w Width or existing SVG element
     * @param {number|string} [h] Height
     */
    function Paper(w, h) {
        let res, defs;
        const proto = Paper.prototype;
        
        if (w && w.tagName && w.tagName.toLowerCase() === "svg") {
            if (w.snap in hub) {
                return hub[w.snap];
            }
            const doc = w.ownerDocument;
            res = new Element(w);
            defs = w.getElementsByTagName("defs")[0];
            if (!defs) {
                defs = $("defs");
                res.node.appendChild(defs);
            }
            res.defs = defs;
            for (let key in proto) if (proto[has](key)) {
                res[key] = proto[key];
            }
            res.paper = res.root = res;
        } else {
            res = make("svg", glob.doc.body);
            $(res.node, {
                height: h,
                version: 1.1,
                width: w,
                xmlns: xmlns,
            });
        }
        return res;
    }
    
    // THEN all the existing prototype methods follow:
    // Paper.prototype.rect = function() { ... };
    // Paper.prototype.circle = function() { ... };
    // ... etc (all existing code remains)
});
```

### File 6: `snap-footer.js` (~50 lines)
**Purpose**: IIFE end, plugin system, exports

**Contents**:
```javascript
    /**
     * Plugin registration system
     * @function Snap.plugin
     * @param {Function} f Plugin callback receiving (Snap, Element, Paper, glob, Fragment, eve)
     */
    Snap.plugin = function (f) {
        f(Snap, Element, Paper, glob, Fragment, eve);
    };
    
    // Export to global
    root.Snap_ia = Snap;
    root.Snap = root.Snap || Snap;
    
    return Snap;
}(typeof window !== "undefined" ? window : global));
```

## Migration Steps

### Step 1: Create New Files (No Breaking Changes)
1. Create `src/snap-header.js`
2. Create `src/Snap.js`
3. Create `src/Fragment.js`
4. Create `src/snap-footer.js`
5. **Keep `src/svg.js` unchanged for now**

### Step 2: Extract Code to New Files

#### 2.1 Extract to `snap-header.js`
From `svg.js` lines 1-300 approximately:
- Copyright headers
- IIFE start: `(function (root) {`
- Snap factory function
- Global setup (glob, hub, hub_rem)
- Constants (svgTags, cssAttr, geomAttr, regex patterns)
- Helper function declarations that need to be in scope

#### 2.2 Extract to `Snap.js`
From `svg.js` lines ~300-1780:
- All utility functions
- Math functions (rad, deg, angle, len, etc.)
- Color functions (getRGB, hsb, hsl, rgb, etc.)
- Parsing functions (parsePathString, transform2matrix, etc.)
- String utilities (format, clone, etc.)
- Type checking (is, snapTo, etc.)
- DOM utilities ($, make, wrap)
- Fragment factory (Snap.fragment)
- Measurement utilities

#### 2.3 Extract to `Fragment.js`
From `svg.js` lines ~1981-2010:
- Fragment constructor
- Any Fragment prototype methods

#### 2.4 Move Element constructor to `element.js`
From `svg.js` lines ~1783-1850:
- Move Element constructor to the **beginning** of existing `src/element.js`
- Place it inside the existing `Snap_ia.plugin()` call
- All existing Element.prototype methods remain unchanged

#### 2.5 Move Paper constructor to `paper.js`
From `svg.js` lines ~2028-2075:
- Move Paper constructor to the **beginning** of existing `src/paper.js`
- Place it inside the existing `Snap_ia.plugin()` call
- All existing Paper.prototype methods remain unchanged

#### 2.6 Extract to `snap-footer.js`
From `svg.js` lines ~2430-2445:
- Plugin system (Snap.plugin function)
- IIFE close and exports

### Step 3: Update Gruntfile.js

Modify the `core` array in `Gruntfile.js`:

```javascript
const core = [
    './src/mina.js',
    './src/snap-header.js',    // NEW: IIFE start, Snap factory, globals
    './src/Snap.js',            // NEW: Utilities
    './src/Fragment.js',        // NEW: Fragment class
    './src/element.js',         // EXISTING: Now includes Element constructor
    './src/animation.js',
    './src/matrix.js',
    './src/attr.js',
    './src/class.js',
    './src/attradd.js',
    './src/paper.js',           // EXISTING: Now includes Paper constructor
    './src/bbox.js',
    './src/path.js',
    './src/set.js',
    './src/equal.js',
    './src/mouse.js',
    './src/filter.js',
    './src/align.js',
    './src/colors.js',
    './src/snap-footer.js',     // NEW: IIFE end, plugin system
];
```

**Key Change**: Replace `'./src/svg.js'` with the new files in the correct order.

### Step 4: Test Build
```bash
grunt
```

This should produce the exact same output as before.

### Step 5: Verify Functionality
1. Run existing test suite
2. Test demos
3. Verify plugins still work
4. Check that minified version works

### Step 6: Remove svg.js (Optional)
Once everything works:
```bash
git rm src/svg.js
git commit -m "Refactor: Split svg.js into modular files

- snap-header.js: IIFE start, Snap factory, globals
- Snap.js: Utilities (math, color, parsing)
- Fragment.js: Fragment class
- element.js: Now includes Element constructor
- paper.js: Now includes Paper constructor
- snap-footer.js: IIFE end, plugin system

No functional changes. Output is identical."
```

## Benefits of This Approach

### 1. Source ≈ Browser Code
The concatenated files look almost identical to the source files. No module transformation magic.

### 2. Preserves Plugin Architecture
The `Snap_ia.plugin()` system remains exactly as it is. All existing plugins work without modification.

### 3. Easy Debugging
When debugging in the browser, the code structure matches what you see in your editor.

### 4. Gradual Refactoring
Files can be split further if needed. For example, `Snap.js` could be split into:
- `snap-math.js`
- `snap-color.js`
- `snap-parsing.js`
- `snap-dom.js`

### 5. No Build System Changes
Grunt continues to work the same way - just concatenating files in order.

### 6. Backward Compatible
No API changes. No breaking changes. Output is identical.

## File Organization Logic

### What Goes Where?

**snap-header.js**:
- Things that must be defined first (Snap factory, globals)
- Constants used everywhere
- IIFE start

**Snap.js**:
- Utilities attached to Snap namespace
- Pure functions
- Helper functions used by multiple files

**Fragment.js**:
- Fragment class only
- Minimal dependencies

**element.js** (existing plugin file):
- Element constructor (moved from svg.js)
- Element prototype methods (already there)
- Element-specific logic

**paper.js** (existing plugin file):
- Paper constructor (moved from svg.js)
- Paper prototype methods (already there)
- Shape creation methods

**snap-footer.js**:
- Plugin system
- IIFE close
- Exports

## Addressing Circular Dependencies

The current code has potential circular dependencies:
- Element constructor creates Paper instances
- Paper constructor creates Element instances

**Current Solution** (already in svg.js):
Both constructors are defined before any plugins run, so they can reference each other. The plugin files only add prototype methods.

**Maintained Solution**:
Keep Element and Paper constructors close together in the concatenation order:
1. snap-header.js defines globals
2. Snap.js defines utilities
3. Fragment.js defines Fragment
4. element.js defines Element constructor first, then adds methods via plugin
5. paper.js defines Paper constructor first, then adds methods via plugin

This maintains the same resolution order as the current code.

## Testing Strategy

### 1. Extract and Test Each File
- Create the new file
- Build with Grunt
- Run tests
- If tests pass, commit

### 2. Regression Testing
- All existing unit tests must pass
- All demos must work
- Check minified version
- Check in different browsers

### 3. Size Check
Compare bundle sizes:
```bash
# Before refactoring
ls -lh dist/snap.svg.js
ls -lh dist/snap.svg-min.js

# After refactoring
ls -lh dist/snap.svg.js
ls -lh dist/snap.svg-min.js
```

Should be identical or very close.

## Common Pitfalls to Avoid

### 1. Variable Scope
Variables declared in one file won't be available in another unless they're:
- Attached to `Snap` namespace
- Attached to `Snap._` (internal utilities)
- Declared in snap-header.js (shared scope)

**Solution**: Variables used across files should be in snap-header.js or attached to Snap namespace.

### 2. Forward References
A function in file A can't call a function in file B if B comes later in concatenation order.

**Solution**: Order files correctly in Gruntfile.js.

### 3. Plugin Load Order
Plugins might depend on each other. The current order in Gruntfile.js is correct and should be preserved.

**Solution**: Keep the same file order.

### 4. Minification Issues
Some variables might need to be in the shared IIFE scope for minification to work correctly.

**Solution**: Test minified version after each change.

## Timeline

### Conservative Estimate
- **Week 1**: Create new files, extract snap-header.js and snap-footer.js, test
- **Week 2**: Extract Snap.js (utilities), test
- **Week 3**: Extract Fragment.js, move constructors to element.js and paper.js, test
- **Week 4**: Final testing, documentation, cleanup

### Aggressive Estimate
- **Day 1-2**: Create all new files
- **Day 3-4**: Test and fix issues
- **Day 5**: Documentation and cleanup

## Success Criteria

✅ Grunt build produces identical output  
✅ All existing tests pass  
✅ All demos work  
✅ Minified version works  
✅ File sizes are similar  
✅ Plugin system still works  
✅ Code is more maintainable  
✅ Source code mirrors browser code  

## Next Steps

1. **Review this strategy** with the team
2. **Create a feature branch**: `git checkout -b refactor/split-svg-js`
3. **Start with snap-header.js**: Extract just the header, test, commit
4. **Continue incrementally**: One file at a time
5. **Test continuously**: After each change
6. **Document changes**: Update README if needed

## Conclusion

This approach:
- ✅ Keeps source code similar to browser code (no import/export)
- ✅ Preserves the plugin architecture completely
- ✅ Maintains backward compatibility
- ✅ Improves code organization
- ✅ Makes files more manageable
- ✅ Uses existing build system (Grunt)
- ✅ Minimizes risk through incremental changes

The key insight is that we're not changing *how* the code works, just *where* it lives. The concatenated output remains the same, but the source files are better organized.
