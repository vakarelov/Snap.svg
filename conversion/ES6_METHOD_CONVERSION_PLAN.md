# ES6 Class Method Conversion Plan

## Challenge

The current code has this structure:
```javascript
class Element {
    constructor(el) {
        // constructor code
    }
}

// Then 100+ methods defined as:
elproto.method1 = function() { }
elproto.method2 = function() { }
// etc.
```

We need to convert to:
```javascript
class Element {
    constructor(el) {
        // constructor code  
    }
    
    method1() { }
    method2() { }
    // etc - all methods inside the class
}
```

## Files to Convert

1. **element-class.js** - ~100+ methods
2. **paper-class.js** - ~50+ methods  
3. **fragment-class.js** - minimal (mostly done)

## Conversion Strategy

### Step 1: Identify Method Patterns

**Pattern A: Simple methods**
```javascript
// Before:
elproto.methodName = function(param1, param2) {
    // body
};

// After (inside class):
methodName(param1, param2) {
    // body
}
```

**Pattern B: Method aliases**
```javascript
// Before:
elproto.css = elproto.attr;
elproto.add = elproto.append;

// After (keep outside class as prototype assignments):
Element.prototype.css = Element.prototype.attr;
Element.prototype.add = Element.prototype.append;
```

**Pattern C: Chained assignments**
```javascript
// Before:
elproto.append = elproto.add = function(el) { }

// After:
append(el) { } // inside class
// Then outside:
Element.prototype.add = Element.prototype.append;
```

### Step 2: Handle Special Cases

1. **Methods using `elproto` reference internally** - no change needed, they use `this`
2. **Methods with JSDoc** - keep JSDoc above the method
3. **Methods accessing private variables** - they stay in closure scope

### Step 3: Preserve Structure

- Keep helper functions outside the class (like `clip_path_box_helper`)
- Keep utility functions on Snap namespace (like `Snap.joinBBoxes`)
- Move only prototype methods inside the class

## Implementation Options

### Option 1: Manual Conversion (Recommended for accuracy)
Convert each file methodically, testing after each major section.

### Option 2: Semi-automated
Create a script to do 80% of the work, manually fix edge cases.

### Option 3: Fully Manual with Examples
I provide converted examples of first 10-20 methods, you review pattern, then I continue.

## Estimated Scope

- **element-class.js**: ~100 methods (~2000 lines to refactor)
- **paper-class.js**: ~50 methods (~800 lines to refactor) 
- **fragment-class.js**: ~2 methods (minimal)

Total: ~150 methods to convert

## Recommendation

Given the scope, I recommend **Option 1 with chunked approach**:

1. I'll convert element-class.js in sections of ~20 methods each
2. You review and we test build after each section
3. Then do paper-class.js similarly
4. Fragment-class.js is trivial

This ensures quality and allows iterative testing.

Would you like me to proceed with this approach?
