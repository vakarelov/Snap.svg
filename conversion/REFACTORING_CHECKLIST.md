# ES6 Refactoring Checklist

A practical checklist for implementing the Snap.svg ES6 refactoring.

## Phase 1: Infrastructure Setup ⬜

### 1.1 Project Setup
- [ ] Create `feature/es6-refactor` branch
- [ ] Back up current codebase
- [ ] Document current test coverage baseline
- [ ] Set up separate build directory

### 1.2 Directory Structure
- [ ] Create `src/core/` directory
- [ ] Create `src/classes/` directory
- [ ] Create `src/utils/` directory
- [ ] Create `src/parsers/` directory
- [ ] Keep `src/svg.js` as compatibility wrapper

### 1.3 Build System
- [ ] Install Rollup: `npm install --save-dev rollup`
- [ ] Install Rollup plugins:
  - [ ] `@rollup/plugin-node-resolve`
  - [ ] `@rollup/plugin-commonjs`
  - [ ] `@rollup/plugin-babel`
  - [ ] `rollup-plugin-terser`
- [ ] Create `rollup.config.js`
- [ ] Add npm scripts in `package.json`:
  - [ ] `build:rollup` - Build with Rollup
  - [ ] `build:grunt` - Keep old build working
  - [ ] `build` - Run both builds
- [ ] Test that both builds produce working output

### 1.4 Extract Constants
- [ ] Create `src/core/constants.js`
- [ ] Move `svgTags` object
- [ ] Move `cssAttr` object
- [ ] Move `geomAttr` object
- [ ] Move regex patterns:
  - [ ] `colourRegExp`
  - [ ] `separator`
  - [ ] `commaSpaces`
  - [ ] `pathCommand`
  - [ ] `tCommand`
  - [ ] `pathValues`
  - [ ] `tSrtToRemove`
- [ ] Move `xlink`, `xmlns` constants
- [ ] Export all constants
- [ ] Test that constants are accessible

### 1.5 Extract Globals
- [ ] Create `src/core/globals.js`
- [ ] Move `hub` object
- [ ] Move `hub_rem` object
- [ ] Move `glob` object (window, document)
- [ ] Export all globals
- [ ] Test global state management

### 1.6 Testing Infrastructure
- [ ] Set up Jest (if not already using)
- [ ] Create test structure mirroring src:
  - [ ] `tests/core/`
  - [ ] `tests/classes/`
  - [ ] `tests/utils/`
- [ ] Write tests for constants
- [ ] Write tests for globals
- [ ] Ensure all tests pass

## Phase 2: Utility Extraction ⬜

### 2.1 Type Checking Utilities
- [ ] Create `src/utils/type-checking.js`
- [ ] Extract `is(o, type)` function
- [ ] Extract `clone(obj)` function
- [ ] Extract `cacher(f, scope, postprocessor)` function
- [ ] Extract `snapTo(values, value, tolerance)` function
- [ ] Write unit tests for each function
- [ ] Export all functions

### 2.2 Math Utilities
- [ ] Create `src/utils/math.js`
- [ ] Extract `rad(deg)` function
- [ ] Extract `deg(rad)` function
- [ ] Extract `angle(x1, y1, x2, y2, x3, y3)` function
- [ ] Extract `len(x1, y1, x2, y2)` function
- [ ] Extract `len2(x1, y1, x2, y2)` function
- [ ] Extract `closestPoint(path, x, y)` function
- [ ] Extract trig functions (`sin`, `cos`, `tan`, `cot`)
- [ ] Extract inverse trig (`asin`, `acos`, `atan`, `atan2`)
- [ ] Write unit tests for all math functions
- [ ] Export all functions

### 2.3 Color Utilities
- [ ] Create `src/utils/color.js`
- [ ] Extract `getRGB(colour)` function
- [ ] Extract `hsb(h, s, b)` function
- [ ] Extract `hsl(h, s, l)` function
- [ ] Extract `rgb(r, g, b, o)` function
- [ ] Extract `color(clr)` function
- [ ] Extract `hsb2rgb(h, s, v, o)` function
- [ ] Extract `hsl2rgb(h, s, l, o)` function
- [ ] Extract `rgb2hsb(r, g, b)` function
- [ ] Extract `rgb2hsl(r, g, b)` function
- [ ] Extract helper functions (`toHex`, `rgbtoString`, etc.)
- [ ] Write unit tests for color conversion
- [ ] Export all functions

### 2.4 String Utilities
- [ ] Create `src/utils/string.js`
- [ ] Extract `format(str, ...args)` function
- [ ] Extract URL utilities (`URL`, `fixUrl`)
- [ ] Write unit tests
- [ ] Export all functions

### 2.5 DOM Utilities
- [ ] Create `src/utils/dom.js`
- [ ] Extract `$(el, attr)` function
- [ ] Extract `make(name, parent)` function
- [ ] Extract `wrap(dom)` function
- [ ] Extract `ID(el)` function
- [ ] Write unit tests (may need jsdom)
- [ ] Export all functions

### 2.6 Utils Index
- [ ] Create `src/utils/index.js`
- [ ] Re-export all utility modules
- [ ] Test that all utilities are accessible

## Phase 3: Parser Extraction ⬜

### 3.1 Path Parser
- [ ] Create `src/parsers/path.js`
- [ ] Extract `parsePathString(pathString)` function
- [ ] Extract related path parsing functions
- [ ] Write unit tests with various path formats
- [ ] Export parser functions

### 3.2 Transform Parser
- [ ] Create `src/parsers/transform.js`
- [ ] Extract `svgTransform2string(tstr)` function
- [ ] Extract `transform2matrix(tdata)` function
- [ ] Extract transform parsing logic
- [ ] Write unit tests
- [ ] Export parser functions

### 3.3 Parsers Index
- [ ] Create `src/parsers/index.js`
- [ ] Re-export all parsers
- [ ] Test parser accessibility

## Phase 4: Class Conversion ⬜

### 4.1 Fragment Class
- [ ] Create `src/classes/Fragment.js`
- [ ] Convert `Fragment` function to ES6 class
- [ ] Import necessary dependencies
- [ ] Test Fragment creation
- [ ] Test Fragment operations
- [ ] Export Fragment class

### 4.2 Element Class (Most Complex)
- [ ] Create `src/classes/Element.js`
- [ ] Convert `Element` function to ES6 class:
  - [ ] Move constructor logic
  - [ ] Move `this.node` setup
  - [ ] Move `this.type` setup
  - [ ] Move `this.id` setup
  - [ ] Move hub registration
- [ ] Import dependencies:
  - [ ] `hub`, `glob` from `../core/globals.js`
  - [ ] `ID` from `../utils/dom.js`
- [ ] Add basic methods from element.js plugin:
  - [ ] `attr(params, value)`
  - [ ] `getBBox(settings)` (if in svg.js)
- [ ] Set up Paper lazy loading (for circular dep)
- [ ] Write comprehensive tests:
  - [ ] Element creation
  - [ ] Attribute getting/setting
  - [ ] Hub registration
  - [ ] Type detection
- [ ] Export Element class

### 4.3 Paper Class
- [ ] Create `src/classes/Paper.js`
- [ ] Import Element: `import { Element } from './Element.js'`
- [ ] Convert `Paper` function to ES6 class extending Element
- [ ] Move constructor logic:
  - [ ] Handle existing SVG case
  - [ ] Handle new SVG creation case
  - [ ] Set up defs
- [ ] Add shape creation methods from paper.js plugin:
  - [ ] `rect(x, y, w, h, rx, ry, attr)`
  - [ ] `circle(cx, cy, r, attr)`
  - [ ] `ellipse(cx, cy, rx, ry, attr)`
  - [ ] `path(pathString, attr)`
  - [ ] `line(x1, y1, x2, y2, attr)`
  - [ ] `polyline(points, attr)`
  - [ ] `polygon(points, attr)`
  - [ ] `image(src, x, y, width, height, attr)`
  - [ ] `text(x, y, text, attr)`
  - [ ] `g(...elements)` / `def_group(...elements)`
  - [ ] `svg(x, y, width, height, vbx, vby, vbw, vbh)`
  - [ ] `mask(...elements)`
  - [ ] `ptrn(x, y, width, height, vx, vy, vw, vh, attr)`
  - [ ] `use(id, attr)`
  - [ ] `symbol(vbx, vby, vbw, vbh, attr)`
- [ ] Add helper method:
  - [ ] `el(name, attr)` - creates and returns element
- [ ] Write comprehensive tests:
  - [ ] Paper creation (new)
  - [ ] Paper creation (from existing SVG)
  - [ ] Each shape creation method
  - [ ] Group creation
  - [ ] Defs management
- [ ] Export Paper class

### 4.4 Classes Index
- [ ] Create `src/classes/index.js`
- [ ] Re-export Element, Paper, Fragment
- [ ] Test all classes are accessible

### 4.5 Set Paper Reference on Element
- [ ] In classes/index.js or Element.js:
  - [ ] `Element._Paper = Paper` (break circular dep)

## Phase 5: Core Entry Point ⬜

### 5.1 Type Registration System
- [ ] Create `src/core/types.js`
- [ ] Implement type registration system
- [ ] Export `registerType`, `getClass`

### 5.2 Main Snap Factory
- [ ] Create `src/core/index.js`
- [ ] Import all classes
- [ ] Import all utilities
- [ ] Import globals
- [ ] Implement Snap factory function:
  - [ ] Handle DOM node wrapping
  - [ ] Handle array -> Set
  - [ ] Handle already-wrapped elements
  - [ ] Handle element creation strings
  - [ ] Handle selectors
  - [ ] Handle new Paper creation
- [ ] Attach utilities to Snap namespace:
  - [ ] `Snap.rad`, `Snap.deg`, etc.
  - [ ] `Snap.getRGB`, `Snap.hsb`, etc.
  - [ ] `Snap.is`, `Snap.clone`, etc.
- [ ] Set version: `Snap.version = "2.0.0"`
- [ ] Export default Snap function
- [ ] Export named exports (Element, Paper, etc.)
- [ ] Test Snap factory with various inputs

### 5.3 Plugin System
- [ ] Implement `Snap.plugin(fn)` for backward compatibility
- [ ] Document new plugin patterns
- [ ] Test old plugins still work

## Phase 6: Rollup Configuration ⬜

### 6.1 UMD Build (Browser Compatible)
- [ ] Configure Rollup for UMD output:
  ```javascript
  {
    input: 'src/core/index.js',
    output: {
      file: 'dist/snap.svg.js',
      format: 'umd',
      name: 'Snap'
    }
  }
  ```
- [ ] Test in browser with `<script>` tag
- [ ] Verify `window.Snap` is available

### 6.2 ESM Build (Modern Bundlers)
- [ ] Configure Rollup for ESM output:
  ```javascript
  {
    file: 'dist/snap.svg.esm.js',
    format: 'esm'
  }
  ```
- [ ] Test with `import Snap from 'snap.svg'`

### 6.3 CommonJS Build (Node.js)
- [ ] Configure Rollup for CJS output:
  ```javascript
  {
    file: 'dist/snap.svg.cjs.js',
    format: 'cjs'
  }
  ```
- [ ] Test with `const Snap = require('snap.svg')`

### 6.4 Minification
- [ ] Add Terser plugin to Rollup
- [ ] Configure minified output
- [ ] Compare file size with current build
- [ ] Ensure < 10% size increase

### 6.5 Source Maps
- [ ] Enable source maps in Rollup config
- [ ] Test debugging with source maps

## Phase 7: Plugin Migration ⬜

### 7.1 Core Plugins
- [ ] Migrate `src/element.js` plugin:
  - [ ] Move methods to Element class
  - [ ] Or keep as separate plugin file
  - [ ] Test all Element methods work
- [ ] Migrate `src/paper.js` plugin:
  - [ ] Move methods to Paper class
  - [ ] Test all Paper methods work
- [ ] Migrate other core plugins:
  - [ ] `animation.js`
  - [ ] `matrix.js`
  - [ ] `attr.js`
  - [ ] `bbox.js`
  - [ ] `path.js`
  - [ ] etc.

### 7.2 Plugin Documentation
- [ ] Document how to write ES6 plugins
- [ ] Document backward compatibility layer
- [ ] Provide migration examples

## Phase 8: Testing ⬜

### 8.1 Unit Tests
- [ ] Run all existing tests with new build
- [ ] Write new tests for:
  - [ ] Each utility module
  - [ ] Each class
  - [ ] Core entry point
  - [ ] Plugin system
- [ ] Achieve 80%+ code coverage

### 8.2 Integration Tests
- [ ] Test complete workflows:
  - [ ] Create paper, add shapes, manipulate
  - [ ] Load existing SVG
  - [ ] Plugin usage
- [ ] Test in multiple environments:
  - [ ] Browser (modern)
  - [ ] Browser (IE11 if needed)
  - [ ] Node.js
  - [ ] Webpack build
  - [ ] Rollup build

### 8.3 Performance Testing
- [ ] Benchmark critical operations
- [ ] Compare with old implementation
- [ ] Ensure no significant regressions
- [ ] Document any performance differences

### 8.4 Compatibility Testing
- [ ] Test with existing demos
- [ ] Test with popular plugins
- [ ] Test backward compatibility layer
- [ ] Test tree-shaking with webpack

## Phase 9: Documentation ⬜

### 9.1 API Documentation
- [ ] Update API docs for ES6 classes
- [ ] Document import/export patterns
- [ ] Add examples for each class
- [ ] Add examples for utilities

### 9.2 Migration Guide
- [ ] Write `MIGRATION_GUIDE.md`
- [ ] Document breaking changes (if any)
- [ ] Provide code examples for migration
- [ ] Document plugin migration

### 9.3 Build Documentation
- [ ] Document new build process
- [ ] Document npm scripts
- [ ] Document Rollup configuration
- [ ] Document how to add new modules

### 9.4 Examples
- [ ] Update existing examples
- [ ] Create ES6 module examples
- [ ] Create tree-shaking examples

## Phase 10: Release Preparation ⬜

### 10.1 Package Configuration
- [ ] Update `package.json`:
  - [ ] Set version to `2.0.0-beta.1`
  - [ ] Add `"module": "dist/snap.svg.esm.js"`
  - [ ] Update `"main": "dist/snap.svg.js"`
  - [ ] Update scripts
- [ ] Test npm package locally
- [ ] Test installation in separate project

### 10.2 Deprecation Warnings
- [ ] Add deprecation warnings to old patterns (if any)
- [ ] Document deprecation timeline
- [ ] Provide migration paths

### 10.3 Changelog
- [ ] Create `CHANGELOG.md` for v2.0
- [ ] Document all changes
- [ ] Document breaking changes
- [ ] Document new features

### 10.4 Beta Release
- [ ] Tag beta release: `2.0.0-beta.1`
- [ ] Publish to npm with `beta` tag
- [ ] Announce to community
- [ ] Gather feedback
- [ ] Address issues

### 10.5 Stable Release
- [ ] Tag stable release: `2.0.0`
- [ ] Publish to npm as `latest`
- [ ] Update website
- [ ] Announce release
- [ ] Monitor for issues

## Ongoing Maintenance ⬜

### Monitoring
- [ ] Monitor GitHub issues for bug reports
- [ ] Monitor npm downloads
- [ ] Track bundle size over time
- [ ] Watch for breaking changes in dependencies

### Community Support
- [ ] Answer questions on GitHub
- [ ] Help plugin authors migrate
- [ ] Update documentation based on feedback

### Future Improvements
- [ ] TypeScript definitions
- [ ] Further modularization
- [ ] Performance optimizations
- [ ] New features using ES6 capabilities

## Notes

### Key Decision Points
- **Build Tool**: Rollup (recommended) vs Webpack
- **Class Methods**: Move to class vs keep as plugins
- **Circular Dependencies**: Late binding vs dependency injection
- **Testing**: Jest vs Mocha vs other
- **Compatibility**: How long to maintain old API

### Success Metrics
- ✅ All existing tests pass
- ✅ Bundle size within 10% of current
- ✅ No performance regressions
- ✅ Documentation complete
- ✅ Popular plugins still work
- ✅ Community feedback positive

### Timeline
- **Optimistic**: 6 weeks
- **Realistic**: 9-14 weeks
- **Conservative**: 12-16 weeks

### Team
- Lead developer: [Name]
- Code reviewers: [Names]
- Testing: [Names]
- Documentation: [Names]
