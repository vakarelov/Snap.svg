# Snap.svg Introspection Library

A modular, reusable library for extracting and displaying class hierarchies, methods, and metadata from Snap.svg and related libraries (eve, mina).

## Features

- **Modular Design**: Separate introspection logic from HTML rendering
- **Reusable**: Use in any project that needs to analyze Snap.svg structure
- **Multiple Output Formats**: JSON, plain objects, or HTML
- **Comprehensive**: Extracts methods from Snap, eve, mina, and all Snap classes
- **Smart Detection**: Identifies easing functions, Paper methods, and more
- **Framework Agnostic**: Works in browser or Node.js (with appropriate context)

## Files

- **snap-introspection.js** - Core introspection library (extracts data)
- **snap-introspection-renderer.js** - HTML rendering utilities (generates HTML)
- **show_methods.html** - Example implementation

## Usage

### Basic Usage (Browser)

```html
<!DOCTYPE html>
<html>
<head>
    <script src="snap.svg.js"></script>
    <script src="snap-introspection.js"></script>
    <script src="snap-introspection-renderer.js"></script>
</head>
<body>
    <div id="content"></div>
    
    <script>
        // Extract all data
        const data = SnapIntrospection.extractAll({
            Snap: Snap,
            eve: eve,
            mina: mina
        });
        
        // Render to page
        SnapIntrospectionRenderer.renderToElement('#content', data);
    </script>
</body>
</html>
```

### Extract Specific Data

```javascript
// Extract only Snap methods
const snapMethods = SnapIntrospection.extractSnapMethods(Snap);
console.log(snapMethods);
// Output: { methods: ['animate', 'arc', ...], count: 42 }

// Extract only classes
const classes = SnapIntrospection.extractClasses(Snap);
console.log(classes.classNames); // ['element', 'fragment', 'matrix', 'paper', 'set']

// Extract mina with easing detection
const mina = SnapIntrospection.extractMinaMethods(window.mina);
console.log(mina.easingMethods); // ['backin', 'backout', 'bounce', ...]
```

### Export as JSON

```javascript
const data = SnapIntrospection.extractAll({ Snap, eve, mina });
const json = SnapIntrospection.toJSON(data);

// Save to file or send to server
console.log(json);
```

### Custom Rendering

```javascript
// Extract data
const data = SnapIntrospection.extractAll({ Snap, eve, mina });

// Render only specific sections
let html = '';
html += SnapIntrospectionRenderer.renderNavigation(data.navigation);
html += SnapIntrospectionRenderer.renderSnapMethods(data.snap);
html += SnapIntrospectionRenderer.renderClasses(data.classes);

document.getElementById('content').innerHTML = html;
```

### Custom Options

```javascript
const data = SnapIntrospection.extractAll({ Snap, eve, mina });

// Render with custom options
SnapIntrospectionRenderer.renderToElement('#content', data, {
    showNavigation: true,
    showSnap: true,
    showEve: false,        // Hide eve methods
    showMina: true,
    showClasses: true,
    highlightFromPaper: true,
    highlightEasing: false  // Don't highlight easing functions
});
```

## API Reference

### SnapIntrospection

#### Core Methods

- **`extractAll(context)`** - Extract all introspection data
  - `context`: Object with `Snap`, `eve`, `mina` properties
  - Returns: Complete introspection data object

- **`extractSnapMethods(Snap)`** - Extract Snap object methods
  - Returns: `{ methods: Array, count: Number }`

- **`extractEveMethods(eve)`** - Extract eve methods
  - Returns: `{ methods: Array, count: Number }`

- **`extractMinaMethods(mina)`** - Extract mina methods with easing detection
  - Returns: `{ methods: Array, methodDetails: Array, easingMethods: Array, count: Number, easingCount: Number }`

- **`extractClasses(Snap)`** - Extract all classes and their methods
  - Returns: `{ classes: Object, classNames: Array, paperMethods: Array }`

- **`extractNavigation(Snap, options)`** - Extract navigation items
  - `options`: `{ includeSnap, includeEve, includeMina }`
  - Returns: Array of navigation items

#### Utility Methods

- **`getAllMethods(obj)`** - Get all methods from prototype chain
- **`getObjectMethods(obj)`** - Get function properties from object
- **`toJSON(data)`** - Convert data to JSON string
- **`toObject(context)`** - Alias for `extractAll`

### SnapIntrospectionRenderer

#### Rendering Methods

- **`renderAll(data, options)`** - Render complete HTML
  - `data`: Introspection data from `extractAll()`
  - `options`: Rendering options object
  - Returns: HTML string

- **`renderToElement(target, data, options)`** - Render directly to DOM element
  - `target`: Element or selector string
  - `data`: Introspection data
  - `options`: Rendering options

- **`renderNavigation(navigationItems)`** - Render navigation menu
- **`renderSnapMethods(snapData)`** - Render Snap methods section
- **`renderEveMethods(eveData)`** - Render eve methods section
- **`renderMinaMethods(minaData, options)`** - Render mina methods section
- **`renderClass(classData, options)`** - Render single class section
- **`renderClasses(classesData, options)`** - Render all classes
- **`renderError(error)`** - Render error message

#### Default Options

```javascript
{
    showNavigation: true,
    showSnap: true,
    showEve: true,
    showMina: true,
    showClasses: true,
    highlightFromPaper: true,
    highlightEasing: true
}
```

## Data Structure

### Complete Data Object

```javascript
{
    snap: {
        methods: ['animate', 'arc', 'attr', ...],
        count: 42
    },
    eve: {
        methods: ['on', 'once', 'off', ...],
        count: 8
    },
    mina: {
        methods: ['backin', 'backout', 'bounce', ...],
        methodDetails: [
            { name: 'backin', isEasing: true, hasWithParams: true },
            ...
        ],
        easingMethods: ['backin', 'backout', ...],
        count: 20,
        easingCount: 15
    },
    classes: {
        classes: {
            element: {
                name: 'element',
                displayName: 'Element',
                methods: ['animate_el', 'attr', 'click', ...],
                methodDetails: [
                    { name: 'animate_el', isFromPaper: false, isElementSpecific: true, note: '...' },
                    ...
                ],
                count: 85,
                hasPrototype: true
            },
            ...
        },
        classNames: ['element', 'fragment', 'matrix', 'paper', 'set'],
        paperMethods: ['animate', 'circle', 'rect', ...]
    },
    navigation: [
        { id: 'snap', name: 'Snap', isGlobal: false },
        { id: 'eve', name: 'eve', isGlobal: true },
        ...
    ],
    timestamp: '2025-12-10T...'
}
```

## Use Cases

### 1. Documentation Generation
Extract all methods and generate documentation automatically.

### 2. API Explorer
Create interactive API explorers for Snap.svg.

### 3. Testing
Verify that all expected methods are present in a Snap.svg build.

### 4. Comparison
Compare different versions of Snap.svg to see what changed.

### 5. IDE Integration
Generate autocomplete data or type definitions.

## Example: Export to JSON File

```javascript
// In browser with download capability
const data = SnapIntrospection.extractAll({ Snap, eve, mina });
const json = SnapIntrospection.toJSON(data);

const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'snap-introspection.json';
a.click();
```

## Example: Custom Renderer

```javascript
// Create your own renderer for a different output format
const data = SnapIntrospection.extractAll({ Snap, eve, mina });

// Generate Markdown
let markdown = '# Snap.svg API\n\n';
markdown += `## Snap Methods (${data.snap.count})\n\n`;
data.snap.methods.forEach(method => {
    markdown += `- Snap.${method}()\n`;
});

// Generate CSV
let csv = 'Type,Class,Method\n';
data.snap.methods.forEach(m => csv += `Snap,,${m}\n`);
data.classes.classNames.forEach(className => {
    const cls = data.classes.classes[className];
    cls.methods.forEach(m => csv += `Class,${className},${m}\n`);
});
```

## Browser Compatibility

- Modern browsers (ES6+)
- IE11+ (with polyfills for `Object.assign`, `Array.includes`)

## Module Formats

Both libraries support:
- **AMD** (RequireJS)
- **CommonJS** (Node.js)
- **Browser globals** (window)

## License

Same as Snap.svg

## Version

1.0.0

