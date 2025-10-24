# Pragmatic Refactoring: Summary & Quick Reference

## What We're Doing

**Goal**: Split the monolithic `svg.js` (2,445 lines) into smaller, organized files while:
- ✅ Keeping the same concatenation-based build (no ES6 imports)
- ✅ Preserving the plugin architecture (Snap_ia.plugin)
- ✅ Maintaining identical output and behavior
- ✅ Making source code structure match browser code

## The Plan in 3 Sentences

1. **Split `svg.js` into 6 logical files**: header (globals/factory), utilities, Fragment, footer
2. **Move Element and Paper constructors** into their existing plugin files (element.js, paper.js)
3. **Update Gruntfile.js** to concatenate in the right order

Result: Same output, better organization, no import/export complexity.

## File Structure

### New Files (6 total)

| File | Lines | Purpose |
|------|-------|---------|
| `snap-header.js` | ~300 | IIFE start, Snap factory, globals, constants |
| `Snap.js` | ~1,100 | Utilities (math, color, parsing, type checking) |
| `Fragment.js` | ~50 | Fragment class, make(), wrap() |
| `snap-footer.js` | ~50 | Plugin system, IIFE close, exports |
| `element.js` | ~500 | Element constructor + methods (modified) |
| `paper.js` | ~400 | Paper constructor + methods (modified) |

### Build Order (Gruntfile.js)

```javascript
const core = [
    './src/mina.js',           // 1. Animation easing (unchanged)
    './src/snap-header.js',    // 2. NEW: IIFE start, Snap factory
    './src/Snap.js',            // 3. NEW: Utilities
    './src/Fragment.js',        // 4. NEW: Fragment, make, wrap
    './src/element.js',         // 5. MODIFIED: + Element constructor
    './src/animation.js',       // 6. Plugin (unchanged)
    './src/matrix.js',          // 7. Plugin (unchanged)
    './src/attr.js',            // 8. Plugin (unchanged)
    './src/class.js',           // 9. Plugin (unchanged)
    './src/attradd.js',         // 10. Plugin (unchanged)
    './src/paper.js',           // 11. MODIFIED: + Paper constructor
    './src/bbox.js',            // 12. Plugin (unchanged)
    './src/path.js',            // 13. Plugin (unchanged)
    './src/set.js',             // 14. Plugin (unchanged)
    './src/equal.js',           // 15. Plugin (unchanged)
    './src/mouse.js',           // 16. Plugin (unchanged)
    './src/filter.js',          // 17. Plugin (unchanged)
    './src/align.js',           // 18. Plugin (unchanged)
    './src/colors.js',          // 19. Plugin (unchanged)
    './src/snap-footer.js',     // 20. NEW: Close IIFE, exports
];
```

Remove: `'./src/svg.js'`

## What Goes Where

### snap-header.js
```javascript
(function (root) {
    // Snap factory function
    function Snap(w, h) { ... }
    
    // Globals
    const glob = { win: window, doc: document };
    const hub = {};
    const hub_rem = {};
    
    // Constants
    const svgTags = { svg: 0, circle: 0, ... };
    const cssAttr = { fill: 0, stroke: 0, ... };
    const geomAttr = { x: 0, y: 0, ... };
    
    // Helper functions
    function $(el, attr) { ... }
    const ID = function(el) { ... };
```

### Snap.js
```javascript
    // Math utilities
    Snap.rad = function(deg) { ... };
    Snap.deg = function(rad) { ... };
    Snap.angle = function(x1, y1, x2, y2) { ... };
    Snap.len = function(x1, y1, x2, y2) { ... };
    
    // Color utilities
    Snap.getRGB = function(colour) { ... };
    Snap.hsb = function(h, s, b) { ... };
    Snap.hsl = function(h, s, l) { ... };
    Snap.rgb = function(r, g, b, o) { ... };
    
    // Path parsing
    Snap.parsePathString = function(pathString) { ... };
    
    // Type checking
    Snap.is = function(o, type) { ... };
    Snap.snapTo = function(values, value, tolerance) { ... };
```

### Fragment.js
```javascript
    // Fragment constructor
    function Fragment(frag) {
        this.node = frag;
    }
    
    // Fragment factory
    Snap.fragment = function() { ... };
    
    // Helper functions
    function make(name, parent) { ... }
    function wrap(dom) { ... }
    
    Snap._.make = make;
    Snap._.wrap = wrap;
```

### element.js (add at top of plugin)
```javascript
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    // ADD THIS:
    function Element(el) {
        // Constructor code from svg.js lines 1783-1850
    }
    
    // Get references from shared scope
    const hub = Snap._.hub;
    const ID = Snap._.id;
    
    // EXISTING CODE CONTINUES:
    const elproto = Element.prototype;
    // ... all existing prototype methods
});
```

### paper.js (add at top of plugin)
```javascript
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    // ADD THIS:
    function Paper(w, h) {
        // Constructor code from svg.js lines 2028-2100
    }
    
    // Get references from shared scope
    const hub = Snap._.hub;
    const $ = Snap._.$;
    const make = Snap._.make;
    
    // EXISTING CODE CONTINUES:
    const proto = Paper.prototype;
    // ... all existing prototype methods
});
```

### snap-footer.js
```javascript
    // Plugin system
    Snap.plugin = function (f) {
        f(Snap, Element, Paper, glob, Fragment, eve);
    };
    
    // Exports
    root.Snap_ia = Snap;
    root.Snap = root.Snap || Snap;
    return Snap;
}(typeof window !== "undefined" ? window : global));
```

## Step-by-Step Process

### Phase 1: Create New Files (Day 1)
1. Create `src/snap-header.js` - copy lines 1-323 from svg.js
2. Create `src/Snap.js` - copy lines 324-1779 from svg.js
3. Create `src/Fragment.js` - copy lines 1981-2027 + make/wrap from svg.js
4. Create `src/snap-footer.js` - copy lines 2435-2445 from svg.js
5. Test: Keep svg.js unchanged, verify new files compile

### Phase 2: Modify Existing Files (Day 2)
1. Open `src/element.js`
   - Add Element constructor at the beginning of Snap_ia.plugin()
   - Add: `const hub = Snap._.hub; const ID = Snap._.id;`
2. Open `src/paper.js`
   - Add Paper constructor at the beginning of Snap_ia.plugin()
   - Add: `const hub = Snap._.hub; const $ = Snap._.$; const make = Snap._.make;`

### Phase 3: Update Build (Day 2)
1. Open `Gruntfile.js`
2. Replace `'./src/svg.js'` with new files in correct order
3. Run: `grunt`
4. Verify output is identical

### Phase 4: Test (Day 3)
1. Run test suite: `npm test`
2. Test demos in browser
3. Check minified version works
4. Verify plugins still work

### Phase 5: Cleanup (Day 4)
1. Remove `src/svg.js` (backup first!)
2. Update documentation
3. Commit changes

## Quick Verification

After building, check these:

```bash
# File should exist and be ~250KB
ls -lh dist/snap.svg.js

# Should have 4 occurrences (mina, snap-header, element, paper)
grep -c "function Snap" dist/snap.svg.js

# Should have the copyright
head -n 5 dist/snap.svg.js

# Should end with }(window)
tail -n 5 dist/snap.svg.js

# Run tests
npm test
```

## Common Issues

### Issue: "hub is not defined"
**Solution**: Add to element.js or paper.js:
```javascript
const hub = Snap._.hub;
```

### Issue: "make is not defined"
**Solution**: Ensure Fragment.js comes before paper.js in Gruntfile.js

### Issue: "Element is not a constructor"
**Solution**: Element constructor must be in element.js before prototype methods

### Issue: Output file size changed dramatically
**Solution**: Check that all files are included in Gruntfile.js

### Issue: Plugins don't work
**Solution**: Ensure snap-footer.js is last and includes Snap.plugin()

## Why This Approach?

### ✅ Advantages
1. **No import/export complexity** - just concatenation
2. **Source matches browser** - easy debugging
3. **Plugin system preserved** - no changes needed
4. **Backward compatible** - identical output
5. **Incremental migration** - can split further if needed
6. **Uses existing tooling** - Grunt continues to work

### ❌ We're NOT doing
1. ES6 imports/exports
2. Module bundlers (Webpack/Rollup)
3. Changing the API
4. Breaking plugins
5. Rewriting in TypeScript
6. Changing build system

## Documentation Files

Reference these for details:

1. **PRAGMATIC_REFACTORING_STRATEGY.md** - Overall strategy
2. **EXTRACTION_GUIDE.md** - Line-by-line extraction guide
3. **FILE_CONCATENATION_FLOW.md** - Visual diagrams
4. **This file** - Quick reference

## Success Criteria

You're done when:

- ✅ `grunt` runs without errors
- ✅ `dist/snap.svg.js` is generated
- ✅ File size is similar to before (~250KB)
- ✅ All tests pass
- ✅ Demos work in browser
- ✅ Plugins still work
- ✅ Minified version works
- ✅ Source code is more maintainable

## Next Steps After Refactoring

Once this is complete, you could:

1. **Split Snap.js further**:
   - `snap-math.js` (math utilities)
   - `snap-color.js` (color utilities)
   - `snap-parsing.js` (path/transform parsing)

2. **Extract more from element.js**:
   - `element-attr.js` (attribute methods)
   - `element-transform.js` (transform methods)
   - `element-animation.js` (animation methods)

3. **Extract more from paper.js**:
   - `paper-shapes.js` (shape creation)
   - `paper-groups.js` (grouping methods)

But only if needed! The current plan is a good stopping point.

## Timeline Estimate

- **Conservative**: 1 week (careful testing)
- **Realistic**: 3-4 days
- **Aggressive**: 2 days (risky)

## Getting Started

```bash
# 1. Create feature branch
git checkout -b refactor/split-svg-js

# 2. Backup svg.js
cp src/svg.js src/svg.js.backup

# 3. Create snap-header.js
# (copy lines 1-323 from svg.js)

# 4. Test build
grunt

# 5. Continue with other files...
```

## Final Checklist

- [ ] Created snap-header.js
- [ ] Created Snap.js
- [ ] Created Fragment.js
- [ ] Created snap-footer.js
- [ ] Modified element.js (added constructor)
- [ ] Modified paper.js (added constructor)
- [ ] Updated Gruntfile.js
- [ ] Removed svg.js from Gruntfile.js
- [ ] Build succeeds (grunt)
- [ ] Tests pass (npm test)
- [ ] Demos work
- [ ] File size similar
- [ ] Minified version works
- [ ] Committed changes
- [ ] Updated README (if needed)

## Help

If you run into issues:
1. Check FILE_CONCATENATION_FLOW.md for scope/order issues
2. Check EXTRACTION_GUIDE.md for exact line numbers
3. Compare your output with original svg.js output
4. Test one file at a time

Good luck! 🚀
