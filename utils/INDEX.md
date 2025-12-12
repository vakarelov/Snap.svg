# Snap.svg Utilities

This folder contains reusable utility libraries for working with Snap.svg.

## Available Utilities

### Snap.svg Introspection Library

A modular, reusable library for extracting and analyzing Snap.svg's API structure.

**Files:**
- `snap-introspection.js` - Core introspection and data extraction
- `snap-introspection-renderer.js` - HTML rendering utilities
- `README.md` - Complete API documentation and usage guide

**Features:**
- Extract methods from Snap, eve, mina, and all classes
- Detect easing functions and method relationships
- Export data as JSON or plain objects
- Optional HTML rendering
- Framework agnostic (Browser, Node.js, AMD, CommonJS)

**Quick Example:**
```javascript
// Extract all API data
const data = SnapIntrospection.extractAll({ Snap, eve, mina });

// Export as JSON
const json = SnapIntrospection.toJSON(data);

// Or render to HTML
SnapIntrospectionRenderer.renderToElement('#app', data);
```

**Documentation:** See `README.md` for complete API reference.

**Demos:** See `../demos/methods/` for usage examples.

---

## Usage in Your Projects

### Browser
```html
<script src="path/to/utils/snap-introspection.js"></script>
<script src="path/to/utils/snap-introspection-renderer.js"></script>
```

### Node.js
```javascript
const SnapIntrospection = require('./utils/snap-introspection.js');
```

### AMD/RequireJS
```javascript
require(['utils/snap-introspection'], function(SnapIntrospection) {
    // Use library
});
```

---

## Adding New Utilities

When adding new utilities to this folder:

1. Create well-documented, reusable code
2. Support multiple module formats (UMD pattern)
3. Include comprehensive README
4. Add examples in `demos/` folder
5. Follow the existing code style

---

## License

Same as Snap.svg - Apache 2.0

