# Snap.svg Introspection Library

A comprehensive set of utilities for extracting and analyzing Snap.svg class hierarchies, methods, and metadata.

## Files

### Core Libraries

- **snap-introspection.js** - Core introspection library (UMD module)
  - Extract methods from Snap, eve, and mina
  - Class hierarchy analysis
  - Navigation structure generation
  - Works in browser and Node.js

- **snap-introspection-renderer.js** - HTML rendering utilities (UMD module)
  - Convert introspection data to HTML
  - Customizable rendering options
  - Separated from core logic for reusability

- **snap-docs-reader.js** - JSDoc documentation reader (UMD module)
  - Read and query documentation.json
  - Find classes, methods, and documentation
  - Extract signatures, parameters, return values
  - Works in browser and Node.js

- **get_methods.js** - Node.js CLI tool
  - Extract methods to JSON file
  - Command-line interface
  - Uses core introspection library

- **query-docs.js** - Documentation query CLI tool
  - Query JSDoc documentation from command line
  - Search classes, methods, and descriptions
  - Display signatures and parameters

## Usage

### Browser Usage

```html
<script src="snap.svg.js"></script>
<script src="snap-introspection.js"></script>
<script src="snap-introspection-renderer.js"></script>

<script>
  // Extract all data
  const data = SnapIntrospection.extractAll({
    Snap: Snap,
    eve: eve,
    mina: mina
  });

  // Render to page
  SnapIntrospectionRenderer.renderToElement('#output', data);
</script>
```

### Node.js Usage

```javascript
const SnapIntrospection = require('./snap-introspection.js');

// Load Snap.svg properly (see get_methods.js for full example)
const Snap = loadSnap();

// Extract data
const data = SnapIntrospection.extractAll({
  Snap: Snap,
  eve: Snap.eve,
  mina: Snap.mina
});

// Use the data
console.log('Snap methods:', data.snap.methods);
console.log('Classes:', data.classes.classNames);
```

### CLI Tool

```bash
# Extract to default location (snap-methods.json)
node get_methods.js

# Extract to custom location
node get_methods.js output/api-data.json
```

## API Reference

### SnapIntrospection

#### Low-level Functions

- `getAllMethods(obj)` - Get all methods from prototype chain
- `getObjectMethods(obj)` - Get function properties from object
- `extractSnapMethods(Snap)` - Extract Snap object methods
- `extractEveMethods(eve)` - Extract eve methods
- `extractMinaMethods(mina)` - Extract mina methods with easing detection
- `extractClasses(Snap)` - Extract all classes and their methods
- `extractNavigation(Snap, options)` - Extract navigation items

#### High-level Functions

- `extractAll(context)` - Extract complete introspection data
  ```javascript
  const data = SnapIntrospection.extractAll({
    Snap: Snap,
    eve: eve,
    mina: mina
  });
  ```

- `toJSON(data)` - Convert data to JSON string
- `toObject(context)` - Extract as plain object

### SnapIntrospectionRenderer

#### Rendering Functions

- `renderNavigation(navigationItems)` - Render navigation menu
- `renderSnapMethods(snapData)` - Render Snap methods section
- `renderEveMethods(eveData)` - Render eve methods section
- `renderMinaMethods(minaData, options)` - Render mina methods section
- `renderClass(classData, options)` - Render single class section
- `renderClasses(classesData, options)` - Render all classes
- `renderAll(data, options)` - Render complete HTML
- `renderToElement(target, data, options)` - Render to DOM element
- `renderError(error)` - Render error message

#### Options

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

```javascript
{
  snap: {
    methods: ['method1', 'method2', ...],
    count: 42
  },
  eve: {
    methods: ['on', 'off', ...],
    count: 10
  },
  mina: {
    methods: ['linear', 'easeIn', ...],
    methodDetails: [{name: 'linear', isEasing: true, hasWithParams: false}, ...],
    easingMethods: ['linear', 'easeIn', ...],
    count: 20,
    easingCount: 15
  },
  classes: {
    classes: {
      element: {
        name: 'element',
        displayName: 'Element',
        methods: ['attr', 'animate', ...],
        methodDetails: [{name: 'attr', isFromPaper: false}, ...],
        count: 50,
        hasPrototype: true
      },
      // ... more classes
    },
    classNames: ['element', 'fragment', 'paper'],
    paperMethods: ['circle', 'rect', ...]
  },
  navigation: [
    {id: 'snap', name: 'Snap', isGlobal: false},
    {id: 'eve', name: 'eve', isGlobal: true},
    // ... more items
  ],
  timestamp: '2025-12-10T...'
}
```

## Architecture

The library is designed with separation of concerns:

1. **snap-introspection.js** - Pure data extraction
   - No DOM dependencies
   - Works in Node.js and browser
   - UMD module format

2. **snap-introspection-renderer.js** - HTML generation
   - Separated from core logic
   - Reusable in different projects
   - Can be replaced with other renderers (React, Vue, etc.)

3. **snap-docs-reader.js** - Documentation querying
   - Reads JSDoc documentation.json
   - Fast indexed lookups
   - Signature and parameter extraction
   - Works in Node.js and browser

4. **get_methods.js** - Node.js CLI
   - Uses core library
   - Demonstrates Node.js integration
   - Outputs to JSON files

5. **query-docs.js** - Documentation CLI
   - Command-line documentation browser
   - Search and filter capabilities
   - Display formatted documentation

### SnapDocsReader

**NEW:** Documentation reader for JSDoc documentation.json

#### Setup

First, generate documentation.json:
```bash
grunt docs:json
```

#### Browser Usage

```html
<script src="snap-docs-reader.js"></script>
<script>
  // Load documentation
  SnapDocsReader.load('../../doc/json/documentation.json')
    .then(() => {
      // Find class
      const elementClass = SnapDocsReader.findClass('Element');
      
      // Find method
      const attrMethod = SnapDocsReader.findMethod('Element', 'attr');
      
      // Get signature
      console.log(SnapDocsReader.getSignature(attrMethod));
      
      // Get parameters
      const params = SnapDocsReader.getParams(attrMethod);
    });
</script>
```

#### Node.js Usage

```javascript
const SnapDocsReader = require('./snap-docs-reader.js');
const fs = require('fs');

// Load docs
const docsData = JSON.parse(fs.readFileSync('../../doc/json/documentation.json'));
SnapDocsReader.load(docsData);

// Query
const method = SnapDocsReader.findMethod('Element', 'attr');
console.log(SnapDocsReader.getSignature(method));
```

#### CLI Tool

```bash
# Find class documentation
node query-docs.js --class Element

# Find specific method
node query-docs.js --class Element --method attr

# Search documentation
node query-docs.js --search "animate"

# List all classes
node query-docs.js --list-classes

# List methods of a class
node query-docs.js --class Element --list-methods

# Verbose output
node query-docs.js --class Element --method attr --verbose
```

#### API Functions

**Loading:**
- `load(dataOrUrl)` - Load documentation from JSON data or URL

**Finding:**
- `findByLongname(longname)` - Find by exact longname (e.g., "Element#attr")
- `findByName(name)` - Find all items with this name
- `findClass(className)` - Find class documentation
- `findMethod(className, methodName)` - Find method documentation
- `findClassMembers(className)` - Get all class members
- `findClassMethods(className)` - Get all class methods (documented only)

**Extracting:**
- `getSignature(doc)` - Get method signature string
- `getComment(doc)` - Get full JSDoc comment
- `getDescription(doc)` - Get description text
- `getParams(doc)` - Get parameters array
- `getReturns(doc)` - Get return information

**Searching:**
- `search(query)` - Search all documentation
- `getAllClasses()` - Get all documented classes

**Utility:**
- `isLoaded()` - Check if documentation is loaded
- `getRawData()` - Get raw documentation array

## Examples

### Introspection Examples

See `../../demos/introspection/` for live examples:
- **show_methods.html** - Basic method listing
- **show_methods_with_docs.html** - Interactive API reference with JSDoc documentation
- **example-json-export.html** - JSON export
- **example-custom-rendering.html** - Custom formats

### Node.js Examples

See `../../demos/introspection/example-nodejs.js` for comprehensive examples including:
- Documentation generation (JSON, Markdown, CSV)
- Version comparison
- API validation
- TypeScript definition generation

## License

Same as Snap.svg (Apache License 2.0)

