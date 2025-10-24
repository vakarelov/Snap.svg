# Snap.svg ES6 Refactoring Strategy

## Current Structure Analysis

The `svg.js` file (~2,445 lines) is a monolithic file that contains:

1. **Main Snap Factory Function** - Entry point and namespace (line ~37)
2. **Utility Functions** - Math, color conversion, type checking (lines ~400-1300)
3. **Element Class** - SVG element wrapper (line ~1783)
4. **Fragment Class** - Document fragment wrapper (line ~1981)
5. **Paper Class** - SVG canvas/paper (line ~2028)
6. **Helper Functions** - wrap(), make(), etc.
7. **Global State** - hub, glob, constants

### Current Plugin Architecture
- Files are concatenated via Grunt (`Gruntfile.js`)
- Uses `Snap.plugin()` function to extend prototypes
- IIFE pattern wrapping everything
- Shared global state through closure

## Proposed ES6 Module Structure

### Phase 1: Core Architecture Refactoring

```
src/
├── core/
│   ├── index.js              # Main Snap factory & exports
│   ├── constants.js          # SVG tags, CSS attrs, regex patterns
│   ├── globals.js            # Global state (hub, glob)
│   └── types.js              # Type registration system
│
├── classes/
│   ├── Element.js            # Element class
│   ├── Paper.js              # Paper class
│   ├── Fragment.js           # Fragment class
│   └── index.js              # Re-exports all classes
│
├── utils/
│   ├── dom.js                # DOM manipulation ($, make, wrap)
│   ├── math.js               # Math utilities (angle, len, etc.)
│   ├── color.js              # Color conversion functions
│   ├── string.js             # String formatting
│   ├── type-checking.js      # Type checking (is, cacher, etc.)
│   └── index.js              # Re-exports utilities
│
├── parsers/
│   ├── path.js               # Path parsing
│   ├── transform.js          # Transform parsing
│   └── index.js
│
└── svg.js                    # Legacy compatibility wrapper
```

### Phase 2: Class Conversion Strategy

#### Element Class (`classes/Element.js`)
```javascript
// Convert from:
function Element(el) { ... }
Element.prototype.method = function() { ... }

// To:
export class Element {
    constructor(el) { ... }
    method() { ... }
}
```

**Key Considerations:**
- Keep backward compatibility with hub registry
- Maintain prototype extension mechanism for plugins
- Extract attr() method logic to separate file
- Preserve existing API surface

#### Paper Class (`classes/Paper.js`)
```javascript
export class Paper extends Element {
    constructor(w, h) { ... }
    
    // Drawing methods
    rect(x, y, w, h, rx, ry, attr) { ... }
    circle(cx, cy, r, attr) { ... }
    // etc.
}
```

**Key Considerations:**
- Inherits some Element behaviors
- Contains factory methods for creating elements
- Manages defs and root SVG

#### Fragment Class (`classes/Fragment.js`)
```javascript
export class Fragment {
    constructor(frag) {
        this.node = frag;
    }
}
```

**Key Considerations:**
- Simplest class to convert
- Minimal dependencies

### Phase 3: Dependency Management

#### Critical Dependencies to Track:
1. **Element → Paper**: Element constructor creates Paper instances
2. **Paper → Element**: Paper creates Elements via wrap()
3. **Both → hub**: Global element registry
4. **Both → $**: DOM utility function
5. **All → constants**: Shared regex, tags, attributes

#### Circular Dependency Resolution:
```javascript
// core/globals.js
export const hub = {};
export const glob = { win: window, doc: document };

// classes/Element.js
import { hub, glob } from '../core/globals.js';
import { $ } from '../utils/dom.js';

export class Element {
    constructor(el) {
        // Break circular dep by late-binding Paper
        if (!Element._Paper) {
            Element._Paper = require('./Paper.js').Paper;
        }
    }
}

// Alternative: Use dependency injection
export class Element {
    constructor(el, PaperClass = null) {
        this._PaperClass = PaperClass;
    }
}
```

### Phase 4: Plugin System Migration

Current plugin system:
```javascript
Snap.plugin(function(Snap, Element, Paper, glob, Fragment, eve) {
    Element.prototype.myMethod = function() { ... };
});
```

New ES6 approach:
```javascript
// core/plugin-system.js
export class PluginManager {
    static register(plugin) {
        plugin(Snap, Element, Paper, glob, Fragment, eve);
    }
}

// Backward compatibility
export function plugin(fn) {
    PluginManager.register(fn);
}
```

**Migration Strategy:**
- Keep existing plugin API intact
- Provide new class-based extension method
- Document both approaches

### Phase 5: Build System Updates

#### Rollup Configuration
```javascript
// rollup.config.js
export default {
    input: 'src/core/index.js',
    output: [
        {
            file: 'dist/snap.svg.js',
            format: 'umd',
            name: 'Snap',
            globals: { 'eve': 'eve_ia' }
        },
        {
            file: 'dist/snap.svg.esm.js',
            format: 'esm'
        }
    ],
    plugins: [
        resolve(),
        commonjs(),
        babel({ 
            presets: ['@babel/preset-env'] 
        })
    ]
};
```

#### Webpack Configuration (Alternative)
```javascript
// webpack.config.js
module.exports = {
    entry: './src/core/index.js',
    output: {
        filename: 'snap.svg.js',
        library: 'Snap',
        libraryTarget: 'umd'
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: ['babel-loader']
        }]
    }
};
```

## Implementation Phases

### Phase 1: Preparation (No Breaking Changes)
**Goal:** Set up infrastructure without breaking existing code

1. ✅ Create new directory structure
2. ✅ Set up ES6 build pipeline (Rollup/Webpack)
3. ✅ Extract constants to `constants.js`
4. ✅ Extract utility functions to `utils/*`
5. ✅ Create unit tests for extracted utilities
6. ✅ Ensure original build still works

**Deliverables:**
- New folder structure
- Rollup/Webpack config
- Constants module
- Utils modules with tests
- Both build systems working in parallel

### Phase 2: Class Extraction (Maintain Compatibility)
**Goal:** Extract classes while maintaining backward compatibility

1. ✅ Create `Element.js` with ES6 class
2. ✅ Create `Paper.js` with ES6 class
3. ✅ Create `Fragment.js` with ES6 class
4. ✅ Maintain prototype-based API in `svg.js` as wrapper
5. ✅ Update tests to verify both APIs work
6. ✅ Run full test suite

**Deliverables:**
- Three ES6 class files
- Legacy wrapper maintaining old API
- Tests passing with both old and new code
- Documentation of both APIs

### Phase 3: Plugin Migration
**Goal:** Migrate existing plugins to work with new structure

1. ✅ Create plugin compatibility layer
2. ✅ Migrate core plugins (`element.js`, `paper.js`, etc.)
3. ✅ Update plugin documentation
4. ✅ Test all plugins work with new classes
5. ✅ Deprecate old plugin API (with warnings)

**Deliverables:**
- PluginManager class
- Migrated core plugins
- Updated plugin docs
- Deprecation warnings in place

### Phase 4: Build System Transition
**Goal:** Replace Grunt with modern build system

1. ✅ Configure Rollup/Webpack for all build targets
2. ✅ Generate UMD, ESM, and CommonJS outputs
3. ✅ Set up minification
4. ✅ Configure source maps
5. ✅ Update package.json scripts
6. ✅ Remove Grunt (optional, for clean cut)

**Deliverables:**
- Complete Rollup/Webpack config
- Multiple output formats
- Updated npm scripts
- Build documentation

### Phase 5: Documentation & Migration Guide
**Goal:** Help users migrate to new API

1. ✅ Write migration guide
2. ✅ Update API documentation
3. ✅ Create examples for both APIs
4. ✅ Add deprecation warnings to old API
5. ✅ Publish migration timeline

**Deliverables:**
- MIGRATION.md guide
- Updated API docs
- Code examples
- Deprecation schedule

## Technical Challenges & Solutions

### Challenge 1: Circular Dependencies (Element ↔ Paper)
**Problem:** Element needs Paper, Paper needs Element

**Solutions:**
1. **Late Binding** - Import only when needed
2. **Dependency Injection** - Pass classes as parameters
3. **Separate Interface** - Extract shared interface
4. **Factory Pattern** - Use factory functions instead of direct imports

**Recommended:** Late binding with lazy loading

### Challenge 2: Global State (hub, glob)
**Problem:** Shared mutable state across modules

**Solutions:**
1. **Keep as Module** - Export from `globals.js`
2. **Singleton Pattern** - Create singleton manager
3. **Context Object** - Pass context through calls

**Recommended:** Export from globals.js, keep simple

### Challenge 3: Plugin Compatibility
**Problem:** Existing plugins modify prototypes directly

**Solutions:**
1. **Compatibility Layer** - Wrapper that provides old API
2. **Proxy Pattern** - Intercept prototype modifications
3. **Documentation** - Provide migration guide

**Recommended:** Compatibility layer + migration guide

### Challenge 4: Build Output Compatibility
**Problem:** Need UMD, ESM, and legacy formats

**Solutions:**
1. **Rollup** - Best for libraries, multiple outputs
2. **Webpack** - More complex, but very flexible
3. **Babel** - Transpile ES6 to ES5 if needed

**Recommended:** Rollup for library builds

## File Size & Performance Considerations

### Current Bundle
- Full build: ~250KB (unminified)
- Minified: ~120KB
- Single monolithic file

### Expected After Refactoring
- Core modules: ~200KB (more modular)
- Tree-shakeable ESM: Variable (based on usage)
- Better code splitting potential
- Slightly larger due to module boilerplate (~5-10%)

### Mitigation Strategies
1. Use Rollup for optimal tree-shaking
2. Configure terser/uglify properly
3. Keep hot paths optimized
4. Benchmark critical operations

## Backward Compatibility Strategy

### Version Strategy
- **v2.0**: Full ES6 refactor, maintains compatibility layer
- **v2.5**: Deprecate old API (with warnings)
- **v3.0**: Remove compatibility layer

### Maintaining Old API
```javascript
// src/svg.js (legacy wrapper)
import { Snap as SnapCore } from './core/index.js';
import { Element, Paper, Fragment } from './classes/index.js';

// Expose old function-based API
function Snap(w, h) {
    return new SnapCore(w, h);
}

// Add prototype methods to maintain old API
Element.prototype.myMethod = function() { ... };

export default Snap;
```

## Testing Strategy

### Unit Tests
- Extract and test utilities independently
- Test each class in isolation
- Mock dependencies where needed

### Integration Tests
- Test class interactions
- Test plugin system
- Test DOM operations

### Regression Tests
- Run existing test suite
- Ensure old API still works
- Performance benchmarks

### Test Coverage Goals
- Utils: 90%+ coverage
- Classes: 85%+ coverage
- Integration: Key workflows covered

## Timeline Estimate

### Conservative Timeline (Thorough Testing)
- **Phase 1**: 2-3 weeks (infrastructure)
- **Phase 2**: 3-4 weeks (class extraction)
- **Phase 3**: 2-3 weeks (plugin migration)
- **Phase 4**: 1-2 weeks (build system)
- **Phase 5**: 1-2 weeks (documentation)
- **Total**: 9-14 weeks

### Aggressive Timeline (Minimal Testing)
- **Phase 1**: 1 week
- **Phase 2**: 2 weeks
- **Phase 3**: 1 week
- **Phase 4**: 1 week
- **Phase 5**: 1 week
- **Total**: 6 weeks

## Risks & Mitigation

### Risk 1: Breaking Existing Users
**Mitigation:** 
- Maintain compatibility layer
- Comprehensive testing
- Clear deprecation timeline
- Migration guide

### Risk 2: Performance Regression
**Mitigation:**
- Benchmark before/after
- Profile hot paths
- Optimize critical code
- Keep hot paths monomorphic

### Risk 3: Plugin Ecosystem Breaks
**Mitigation:**
- Plugin compatibility layer
- Test popular plugins
- Contact plugin authors
- Provide migration guide

### Risk 4: Build Complexity
**Mitigation:**
- Start simple (Rollup)
- Document build process
- Provide multiple outputs
- Keep Grunt as fallback initially

## Next Steps

1. **Review & Approve Strategy** - Get team consensus
2. **Set Up Branch** - Create `feature/es6-refactor` branch
3. **Phase 1 Kickoff** - Start with infrastructure
4. **Regular Reviews** - Weekly progress reviews
5. **Community Feedback** - Share RFC with users

## Conclusion

This refactoring will:
- ✅ Modernize codebase to ES6 standards
- ✅ Improve maintainability through separation of concerns
- ✅ Enable tree-shaking for smaller bundles
- ✅ Maintain backward compatibility
- ✅ Set foundation for future improvements

The key to success is **incremental migration** with **continuous testing** and **backward compatibility** at each step.
