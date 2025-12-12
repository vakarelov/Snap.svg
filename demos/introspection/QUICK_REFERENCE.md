# Quick Reference Card

## 🚀 Quick Start

### Include Libraries
```html
<script src="snap.svg.js"></script>
<script src="snap-introspection.js"></script>
<script src="snap-introspection-renderer.js"></script>
```

### Extract and Render (3 lines!)
```javascript
const data = SnapIntrospection.extractAll({ Snap, eve, mina });
SnapIntrospectionRenderer.renderToElement('#app', data);
console.log(data); // See extracted data
```

---

## 📦 SnapIntrospection API

### Main Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `extractAll(context)` | Extract everything | Complete data object |
| `extractSnapMethods(Snap)` | Snap methods only | `{ methods[], count }` |
| `extractEveMethods(eve)` | Eve methods only | `{ methods[], count }` |
| `extractMinaMethods(mina)` | Mina + easing detection | `{ methods[], easingMethods[], count, easingCount }` |
| `extractClasses(Snap)` | All classes | `{ classes{}, classNames[] }` |
| `toJSON(data)` | Convert to JSON string | JSON string |

### Extract All Example
```javascript
const data = SnapIntrospection.extractAll({
    Snap: Snap,
    eve: eve,      // optional
    mina: mina     // optional
});

// Returns:
{
    snap: { methods: [...], count: 42 },
    eve: { methods: [...], count: 8 },
    mina: { methods: [...], easingMethods: [...], count: 20, easingCount: 15 },
    classes: {
        classes: {
            element: { name, displayName, methods: [...], count: 85 },
            paper: { ... },
            // ... more classes
        },
        classNames: ['element', 'paper', 'set', ...]
    },
    navigation: [...],
    timestamp: '2025-12-10T...'
}
```

### Extract Specific Data
```javascript
// Just Snap methods
const snap = SnapIntrospection.extractSnapMethods(Snap);
console.log(snap.methods); // ['animate', 'arc', 'attr', ...]

// Just classes
const classes = SnapIntrospection.extractClasses(Snap);
console.log(classes.classNames); // ['element', 'paper', ...]

// Just mina with easing detection
const mina = SnapIntrospection.extractMinaMethods(window.mina);
console.log(mina.easingMethods); // ['backin', 'backout', 'bounce', ...]
```

---

## 🎨 SnapIntrospectionRenderer API

### Main Functions

| Function | Purpose |
|----------|---------|
| `renderAll(data, options)` | Render complete HTML string |
| `renderToElement(target, data, options)` | Render directly to DOM |
| `renderNavigation(items)` | Render navigation menu |
| `renderSnapMethods(data)` | Render Snap section |
| `renderEveMethods(data)` | Render eve section |
| `renderMinaMethods(data)` | Render mina section |
| `renderClass(classData)` | Render single class |
| `renderClasses(classesData)` | Render all classes |
| `renderError(error)` | Render error message |

### Rendering Options
```javascript
{
    showNavigation: true,     // Show quick nav menu
    showSnap: true,           // Show Snap methods
    showEve: true,            // Show eve methods
    showMina: true,           // Show mina methods
    showClasses: true,        // Show class methods
    highlightFromPaper: true, // Highlight methods from Paper in Element
    highlightEasing: true     // Highlight easing functions
}
```

### Render to DOM
```javascript
// Extract data
const data = SnapIntrospection.extractAll({ Snap, eve, mina });

// Render with all options
SnapIntrospectionRenderer.renderToElement('#content', data, {
    showNavigation: true,
    showSnap: true,
    showEve: true,
    showMina: true,
    showClasses: true,
    highlightFromPaper: true,
    highlightEasing: true
});
```

### Render to String
```javascript
const data = SnapIntrospection.extractAll({ Snap, eve, mina });
const html = SnapIntrospectionRenderer.renderAll(data);
document.body.innerHTML = html;
```

### Custom Rendering
```javascript
const data = SnapIntrospection.extractAll({ Snap, eve, mina });

// Build custom HTML
let html = '';
html += SnapIntrospectionRenderer.renderNavigation(data.navigation);
html += SnapIntrospectionRenderer.renderSnapMethods(data.snap);
html += SnapIntrospectionRenderer.renderClasses(data.classes);

document.getElementById('app').innerHTML = html;
```

---

## 💡 Common Use Cases

### 1. Display All APIs
```javascript
const data = SnapIntrospection.extractAll({ Snap, eve, mina });
SnapIntrospectionRenderer.renderToElement('#app', data);
```

### 2. Export to JSON
```javascript
const data = SnapIntrospection.extractAll({ Snap, eve, mina });
const json = SnapIntrospection.toJSON(data);
const blob = new Blob([json], { type: 'application/json' });
// Download or save blob
```

### 3. Generate Markdown
```javascript
const data = SnapIntrospection.extractAll({ Snap, eve, mina });
let md = '# Snap.svg API\n\n';
md += `## Snap Methods (${data.snap.count})\n\n`;
data.snap.methods.forEach(m => md += `- \`Snap.${m}()\`\n`);
```

### 4. Check for Methods
```javascript
const data = SnapIntrospection.extractAll({ Snap, eve, mina });

// Check if method exists
const hasAnimate = data.snap.methods.includes('animate');

// Check if class exists
const hasElement = data.classes.classNames.includes('element');

// Count methods in Element
const elementMethods = data.classes.classes.element.count;
```

### 5. Compare Versions
```javascript
// Version 1
const data1 = SnapIntrospection.extractAll({ Snap: Snap1, eve, mina });
const json1 = SnapIntrospection.toJSON(data1);

// Version 2
const data2 = SnapIntrospection.extractAll({ Snap: Snap2, eve, mina });
const json2 = SnapIntrospection.toJSON(data2);

// Compare
const removed = data1.snap.methods.filter(m => !data2.snap.methods.includes(m));
const added = data2.snap.methods.filter(m => !data1.snap.methods.includes(m));
```

### 6. Generate TypeScript Definitions
```javascript
const data = SnapIntrospection.extractAll({ Snap, eve, mina });
let dts = 'declare namespace Snap {\n';
data.snap.methods.forEach(m => {
    dts += `  function ${m}(...args: any[]): any;\n`;
});
dts += '}\n';
```

---

## 📁 File Reference

### Library Files (in ../../utils/)
| File | Type | Purpose |
|------|------|---------|
| `utils/snap-introspection.js` | Library | Core data extraction |
| `utils/snap-introspection-renderer.js` | Library | HTML rendering |
| `utils/README.md` | Docs | Complete library documentation |

### Demo Files (in demos/methods/)
| File | Type | Purpose |
|------|------|---------|
| `show_methods.html` | Demo | Main demonstration |
| `example-json-export.html` | Example | JSON export demo |
| `example-custom-rendering.html` | Example | Custom formats demo |
| `example-nodejs.js` | Example | Node.js usage |
| `index.html` | Index | Navigation page |
| `README.md` | Docs | Demo overview |
| `ARCHITECTURE.md` | Docs | Architecture overview |
| `REFACTORING_SUMMARY.md` | Docs | Change summary |
| `QUICK_REFERENCE.md` | Docs | This file |

---

## 🔧 Module Formats

Both libraries support multiple module formats:

### Browser Global
```html
<script src="../../utils/snap-introspection.js"></script>
<script>
    const data = SnapIntrospection.extractAll({ Snap, eve, mina });
</script>
```

### CommonJS (Node.js)
```javascript
const SnapIntrospection = require('../../utils/snap-introspection.js');
const data = SnapIntrospection.extractAll({ Snap, eve, mina });
```

### AMD (RequireJS)
```javascript
require(['snap-introspection'], function(SnapIntrospection) {
    const data = SnapIntrospection.extractAll({ Snap, eve, mina });
});
```

---

## ⚡ Performance Tips

1. **Cache extracted data** - Don't extract repeatedly
2. **Use specific extractors** - Extract only what you need
3. **Render once** - Don't re-render unnecessarily
4. **Use options** - Hide sections you don't need

```javascript
// Good: Extract once, use multiple times
const data = SnapIntrospection.extractAll({ Snap, eve, mina });
const json = SnapIntrospection.toJSON(data);
SnapIntrospectionRenderer.renderToElement('#app', data);

// Good: Extract only what you need
const snapMethods = SnapIntrospection.extractSnapMethods(Snap);

// Good: Hide unnecessary sections
SnapIntrospectionRenderer.renderToElement('#app', data, {
    showEve: false,  // Don't render eve
    showMina: false  // Don't render mina
});
```

---

## 🐛 Debugging

### Check extracted data
```javascript
const data = SnapIntrospection.extractAll({ Snap, eve, mina });
console.log('Snap methods:', data.snap.count);
console.log('Classes:', data.classes.classNames.length);
console.log('Full data:', data);
```

### Test rendering
```javascript
const data = SnapIntrospection.extractAll({ Snap, eve, mina });

// Test individual sections
console.log(SnapIntrospectionRenderer.renderSnapMethods(data.snap));
console.log(SnapIntrospectionRenderer.renderNavigation(data.navigation));
```

### Handle errors
```javascript
try {
    const data = SnapIntrospection.extractAll({ Snap, eve, mina });
    SnapIntrospectionRenderer.renderToElement('#app', data);
} catch (error) {
    document.getElementById('app').innerHTML = 
        SnapIntrospectionRenderer.renderError(error);
    console.error('Error:', error);
}
```

---

## 📊 Data Structure Quick Reference

```javascript
{
    snap: {
        methods: string[],      // Array of method names
        count: number          // Total count
    },
    eve: {
        methods: string[],
        count: number
    },
    mina: {
        methods: string[],
        methodDetails: [{       // Detailed info per method
            name: string,
            isEasing: boolean,
            hasWithParams: boolean
        }],
        easingMethods: string[],
        count: number,
        easingCount: number
    },
    classes: {
        classes: {
            [className]: {
                name: string,
                displayName: string,
                methods: string[],
                methodDetails: [{
                    name: string,
                    isFromPaper: boolean,
                    isElementSpecific: boolean,
                    note?: string
                }],
                count: number,
                hasPrototype: boolean
            }
        },
        classNames: string[],
        paperMethods: string[]
    },
    navigation: [{
        id: string,
        name: string,
        isGlobal: boolean,
        isClass?: boolean
    }],
    timestamp: string          // ISO 8601 timestamp
}
```

---

## 📝 License

Same as Snap.svg - Apache 2.0

---

**Version:** 1.0.0  
**Updated:** December 2025

