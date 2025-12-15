# Shadow DOM Support in Snap.svg

## Overview

Snap.svg has a `Snap.setDocument()` method that allows you to override the default document context. This can theoretically enable Snap to work within Shadow DOM contexts.

## Usage

```javascript
// Get your shadow root
const shadowRoot = element.attachShadow({ mode: 'open' });

// Tell Snap to use the shadow root as its document context
Snap.setDocument(shadowRoot);

// Now Snap will query within the shadow root
const svg = Snap('#mySvg'); // Will search within shadowRoot
```

## What Works

When you call `Snap.setDocument(shadowRoot)`, the following operations will correctly scope to the shadow root:

1. **Element Selection**: `querySelector()` and `querySelectorAll()` work on shadow roots
2. **Element Creation**: SVG elements created will belong to the shadow root's document context
3. **Basic Operations**: Most element manipulation methods will work

## Current Limitations

There are some limitations due to differences between `Document` and `ShadowRoot` objects:

### 1. defaultView Issue

**Location**: Lines 1070-1081, 1963

**Problem**: Shadow roots don't have a `defaultView` property, which is used for:
- Color name to RGB conversion (e.g., "red" → "rgb(255, 0, 0)")
- Getting computed styles of elements

**Code affected**:
```javascript
// In toHex function
const out = glob.doc.defaultView.getComputedStyle(i, E).getPropertyValue("color");

// In attr getter
this.node.ownerDocument.defaultView.getComputedStyle(this.node, null)
```

**Impact**: 
- Named colors (like "red", "blue") may not convert properly
- Getting computed CSS properties may fail

### 2. getElementsByTagName Issues

**Location**: Line 1070-1071

**Problem**: Shadow roots have `getElementsByTagName()` but it may behave differently than document-level queries.

**Code affected**:
```javascript
const i = glob.doc.getElementsByTagName("head")[0] ||
        glob.doc.getElementsByTagName("svg")[0];
```

**Impact**: Color conversion initialization may fail or behave unexpectedly

### 3. ownerDocument References

**Location**: Lines 1963, 2160

**Problem**: Elements created within a shadow root still have their `ownerDocument` pointing to the main document, not the shadow root.

**Code affected**:
```javascript
const doc = elem.ownerDocument;
// This will be the main document, not the shadow root
```

**Impact**: Offset calculations and some computed style queries may use wrong context

## Recommended Solutions

### Solution 1: Enhanced Document Wrapper

Create a wrapper object that provides document-like methods while handling shadow root specifics:

```javascript
function createDocumentProxy(shadowRoot) {
    const mainDoc = shadowRoot.ownerDocument || document;
    
    return {
        // Forward element creation to the actual document
        createElement: (...args) => mainDoc.createElement(...args),
        createElementNS: (...args) => mainDoc.createElementNS(...args),
        createTextNode: (...args) => mainDoc.createTextNode(...args),
        createComment: (...args) => mainDoc.createComment(...args),
        
        // Use shadow root for queries
        querySelector: (...args) => shadowRoot.querySelector(...args),
        querySelectorAll: (...args) => shadowRoot.querySelectorAll(...args),
        getElementsByTagName: (...args) => shadowRoot.querySelectorAll(args[0]),
        
        // Provide defaultView from main document
        get defaultView() {
            return mainDoc.defaultView || window;
        }
    };
}

// Usage
const proxy = createDocumentProxy(shadowRoot);
Snap.setDocument(proxy);
```

### Solution 2: Extend setDocument to Handle Shadow Roots

Modify Snap's `setDocument` method to automatically detect shadow roots and create appropriate wrappers:

```javascript
Snap.setDocument = function (doc) {
    // Check if this is a shadow root
    if (doc instanceof ShadowRoot) {
        const mainDoc = doc.ownerDocument || document;
        glob.doc = {
            createElement: (...args) => mainDoc.createElement(...args),
            createElementNS: (...args) => mainDoc.createElementNS(...args),
            createTextNode: (...args) => mainDoc.createTextNode(...args),
            createComment: (...args) => mainDoc.createComment(...args),
            querySelector: (...args) => doc.querySelector(...args),
            querySelectorAll: (...args) => doc.querySelectorAll(...args),
            getElementsByTagName: (tag) => doc.querySelectorAll(tag),
            get defaultView() {
                return mainDoc.defaultView || window;
            }
        };
    } else {
        glob.doc = doc;
    }
}
```

### Solution 3: Context-Aware Helper

Add a method to create a Snap instance bound to a specific shadow root:

```javascript
Snap.inShadowRoot = function(shadowRoot, selector) {
    const oldDoc = glob.doc;
    
    try {
        // Temporarily set document context
        Snap.setDocument(createDocumentProxy(shadowRoot));
        return Snap(selector);
    } finally {
        // Restore original context
        glob.doc = oldDoc;
    }
};

// Usage
const svg = Snap.inShadowRoot(shadowRoot, '#mySvg');
```

## Testing Shadow DOM Support

```javascript
// Create shadow DOM
const container = document.createElement('div');
document.body.appendChild(container);
const shadowRoot = container.attachShadow({ mode: 'open' });

// Create proxy
const proxy = createDocumentProxy(shadowRoot);
Snap.setDocument(proxy);

// Create SVG in shadow DOM
const svg = Snap(800, 600);
shadowRoot.appendChild(svg.node);

// Test operations
const circle = svg.circle(100, 100, 50);
circle.attr({ fill: "red" }); // Test named color
const computedFill = circle.attr("fill"); // Test computed style

// Verify selection
const found = Snap.select('circle');
console.log('Found element:', found);
```

## Conclusion

While `Snap.setDocument()` provides a foundation for Shadow DOM support, additional wrapper logic is needed to fully bridge the differences between `Document` and `ShadowRoot` objects. The recommended approach is to implement Solution 2, which automatically handles shadow roots when they're passed to `setDocument()`.

