# Architecture Overview

## Module Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Your Project                          │
│  (Web Page, Node.js Script, Build Tool, etc.)           │
└─────────────────────────────────────────────────────────┘
                           │
                           ├──────────────────────┐
                           ▼                      ▼
        ┌──────────────────────────┐  ┌──────────────────────────┐
        │  snap-introspection.js   │  │ snap-introspection-      │
        │  (Core Library)          │  │ renderer.js              │
        │                          │  │ (HTML Renderer)          │
        │  ✓ Extract methods       │  │                          │
        │  ✓ Extract classes       │  │  ✓ Generate HTML         │
        │  ✓ Analyze metadata      │  │  ✓ Format output         │
        │  ✓ Export JSON           │  │  ✓ Render to DOM         │
        │  ✓ Pure data operations  │  │  ✓ Custom styling        │
        └──────────────────────────┘  └──────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────────┐
        │         Snap.svg / eve / mina        │
        │         (Target Libraries)           │
        └──────────────────────────────────────┘
```

## Data Flow

```
┌──────────┐
│  Snap.js │───┐
└──────────┘   │
               │
┌──────────┐   │    ┌─────────────────────┐
│  eve.js  │───┼───▶│ SnapIntrospection   │
└──────────┘   │    │ .extractAll()       │
               │    └─────────────────────┘
┌──────────┐   │              │
│ mina.js  │───┘              │
└──────────┘                  ▼
                    ┌──────────────────┐
                    │  Data Object     │
                    │  {               │
                    │    snap: {...},  │
                    │    eve: {...},   │
                    │    mina: {...},  │
                    │    classes: {...}│
                    │  }               │
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │   Export JSON    │  │  Render HTML     │
        │                  │  │                  │
        │  • Save to file  │  │  • renderAll()   │
        │  • Send to API   │  │  • render*()     │
        │  • Store in DB   │  │  • Custom format │
        └──────────────────┘  └──────────────────┘
```

## Separation of Concerns

```
┌────────────────────────────────────────────────────────────┐
│                     BEFORE (Monolithic)                    │
├────────────────────────────────────────────────────────────┤
│  show_methods.html                                         │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  <script>                                            │ │
│  │    function getAllMethods() { ... }                 │ │
│  │    function getSnapMethods() { ... }                │ │
│  │    function displayClassesAndMethods() {            │ │
│  │      // Data extraction mixed with HTML generation  │ │
│  │      let html = '<div>...';                         │ │
│  │      // Business logic mixed with presentation      │ │
│  │    }                                                 │ │
│  │  </script>                                           │ │
│  └──────────────────────────────────────────────────────┘ │
│  • Hard to reuse                                           │
│  • Hard to test                                            │
│  • Hard to maintain                                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                    AFTER (Modular)                         │
├────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐       │
│  │  snap-introspection.js (Data Layer)            │       │
│  │  • Pure functions                              │       │
│  │  • No HTML generation                          │       │
│  │  • Framework agnostic                          │       │
│  │  • Testable                                    │       │
│  │  • Reusable                                    │       │
│  └────────────────────────────────────────────────┘       │
│                        │                                   │
│                        ▼                                   │
│  ┌────────────────────────────────────────────────┐       │
│  │  snap-introspection-renderer.js (View Layer)   │       │
│  │  • HTML generation only                        │       │
│  │  • Works with data objects                     │       │
│  │  • Customizable                                │       │
│  │  • Optional (use your own renderer)            │       │
│  └────────────────────────────────────────────────┘       │
│                        │                                   │
│                        ▼                                   │
│  ┌────────────────────────────────────────────────┐       │
│  │  show_methods.html (Application)               │       │
│  │  • Lightweight                                 │       │
│  │  • Just configuration                          │       │
│  │  • Easy to customize                           │       │
│  └────────────────────────────────────────────────┘       │
│  ✓ Easy to reuse                                           │
│  ✓ Easy to test                                            │
│  ✓ Easy to maintain                                        │
└────────────────────────────────────────────────────────────┘
```

## Usage Patterns

### Pattern 1: Full Stack (Web Page)
```javascript
// Use both libraries together
<script src="snap-introspection.js"></script>
<script src="snap-introspection-renderer.js"></script>

const data = SnapIntrospection.extractAll({ Snap, eve, mina });
SnapIntrospectionRenderer.renderToElement('#app', data);
```

### Pattern 2: Data Only (API/Export)
```javascript
// Use introspection only
<script src="snap-introspection.js"></script>

const data = SnapIntrospection.extractAll({ Snap, eve, mina });
fetch('/api/save', { method: 'POST', body: JSON.stringify(data) });
```

### Pattern 3: Custom Rendering
```javascript
// Extract data, render your own way
<script src="snap-introspection.js"></script>

const data = SnapIntrospection.extractAll({ Snap, eve, mina });
const markdown = generateMarkdown(data); // Your function
const pdf = generatePDF(data);           // Your function
```

### Pattern 4: Node.js Processing
```javascript
// Server-side usage
const SnapIntrospection = require('./snap-introspection.js');

// Load Snap.svg in jsdom/puppeteer
const data = SnapIntrospection.extractAll({ Snap, eve, mina });

// Generate documentation
fs.writeFileSync('api.json', JSON.stringify(data));
fs.writeFileSync('api.md', generateMarkdown(data));
```

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Lines of Code** | 315 in one file | 330 + 340 + 150 (modular) |
| **Reusability** | ❌ Tied to HTML | ✅ Used anywhere |
| **Testability** | ❌ DOM required | ✅ Pure functions |
| **Maintainability** | ❌ Mixed concerns | ✅ Clear separation |
| **Output Formats** | HTML only | HTML, JSON, custom |
| **Dependencies** | Tightly coupled | Loosely coupled |
| **Use Cases** | 1 (display) | 10+ (display, export, test, etc.) |

## Integration Examples

### Web Application
```html
<!DOCTYPE html>
<html>
<head>
    <script src="snap.svg.js"></script>
    <script src="snap-introspection.js"></script>
    <script src="snap-introspection-renderer.js"></script>
</head>
<body>
    <div id="app"></div>
    <script>
        const data = SnapIntrospection.extractAll({ Snap, eve, mina });
        SnapIntrospectionRenderer.renderToElement('#app', data);
    </script>
</body>
</html>
```

### React Component
```javascript
import SnapIntrospection from './snap-introspection.js';

function SnapAPIViewer() {
    const [data, setData] = useState(null);
    
    useEffect(() => {
        const apiData = SnapIntrospection.extractAll({ Snap, eve, mina });
        setData(apiData);
    }, []);
    
    return (
        <div>
            {data && data.snap.methods.map(m => <div key={m}>{m}</div>)}
        </div>
    );
}
```

### Build Tool
```javascript
// gulpfile.js
const SnapIntrospection = require('./snap-introspection.js');

gulp.task('generate-docs', () => {
    // Load Snap.svg in jsdom
    const data = SnapIntrospection.extractAll({ Snap, eve, mina });
    
    // Generate various outputs
    generateJSON(data);
    generateMarkdown(data);
    generateHTML(data);
    generateTypeScript(data);
});
```

### Testing
```javascript
// test/api.test.js
const SnapIntrospection = require('./snap-introspection.js');

describe('Snap.svg API', () => {
    let data;
    
    before(() => {
        data = SnapIntrospection.extractAll({ Snap, eve, mina });
    });
    
    it('should have all expected Snap methods', () => {
        const expected = ['animate', 'arc', 'circle', 'rect'];
        expected.forEach(method => {
            expect(data.snap.methods).to.include(method);
        });
    });
    
    it('should have Element class', () => {
        expect(data.classes.classNames).to.include('element');
    });
});
```

This architecture provides maximum flexibility while maintaining clean separation of concerns!

