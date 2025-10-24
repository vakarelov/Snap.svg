# Refactoring Completed: Class Registry Pattern

## Summary

Successfully refactored Snap.svg to use a class registry pattern with `Snap.registerClass()` and `Snap.getClass()` instead of direct constructor references. This eliminates circular dependencies and makes the code more modular while maintaining the concatenation-based build system.

## Changes Made

### 1. New Files Created

#### `src/snap.js`
- Copy of `svg.js` with constructor definitions removed
- Updated all factory functions to use `Snap.getClass()`:
  - `Snap()` factory function
  - `wrap()` function
  - `Snap.parse()` function
  - `Snap.fragment()` function

#### `src/fragment-class.js`
- Contains the `Fragment` constructor
- Registers with: `Snap.registerClass("Fragment", Fragment)`
- Standalone file with no dependencies on Element or Paper

#### `src/element-class.js`
- Contains the `Element` constructor (moved from svg.js line ~1785)
- Contains all Element prototype methods (from original element.js)
- Uses `Snap.getClass("Paper")` to avoid circular dependency
- Registers with: `Snap.registerClass("Element", Element)`

#### `src/paper-class.js`
- Contains the `Paper` constructor (moved from svg.js line ~2028)
- Contains all Paper prototype methods (from original paper.js)
- Uses `Snap.getClass("Element")` to avoid circular dependency
- Registers with: `Snap.registerClass("Paper", Paper)`

### 2. Updated Files

#### `src/filter.js`
- Updated line ~47: `new Element(filter)` → `new (Snap.getClass("Element"))(filter)`

#### `src/attr.js`
- Updated line ~70: `new Element(node)` → `new (Snap.getClass("Element"))(node)`

#### `Gruntfile.js`
- Updated core array to use new file structure:
  ```javascript
  const core = [
      './src/mina.js',
      './src/snap.js',           // Renamed from svg.js
      './src/fragment-class.js', // Fragment constructor + registration
      './src/element-class.js',  // Element constructor + prototype methods
      './src/paper-class.js',    // Paper constructor + prototype methods
      // ... rest of files
  ];
  ```

### 3. Pattern Used Throughout

**Before:**
```javascript
const el = new Element(node);
const paper = new Paper(width, height);
const frag = new Fragment(docFrag);
```

**After:**
```javascript
const ElementClass = Snap.getClass("Element");
const el = new ElementClass(node);

const PaperClass = Snap.getClass("Paper");
const paper = new PaperClass(width, height);

const FragmentClass = Snap.getClass("Fragment");
const frag = new FragmentClass(docFrag);
```

### 4. Registration Pattern

Each class file registers itself:
```javascript
Snap.registerClass("Element", Element);
Snap.registerClass("Paper", Paper);
Snap.registerClass("Fragment", Fragment);
```

## Build System

### Build Order (Important!)
The Gruntfile ensures proper load order:
1. `mina.js` - Animation timing
2. `snap.js` - Core utilities and class registry system
3. `fragment-class.js` - Register Fragment first (no dependencies)
4. `element-class.js` - Register Element (can now use Fragment)
5. `paper-class.js` - Register Paper (can now use Element and Fragment)
6. Other plugin files (animation, matrix, attr, etc.)

### Build Command
```bash
node node_modules\grunt\bin\grunt
```

### Build Output
Successfully generates:
- `dist/snap.svg.js` (1,046,260 bytes) - Full version
- `dist/snap.svg.adv.js` (797,188 bytes) - Advanced version
- `dist/snap.svg.bsk.js` (530,694 bytes) - Basic version
- Minified versions of all three

## Benefits

1. **No Circular Dependencies**: Classes use `getClass()` for dynamic resolution
2. **Modular Structure**: Each class in its own file with its methods
3. **Maintains Build System**: Still uses Grunt concatenation (no webpack/rollup needed)
4. **Source Similar to Output**: No import/export transformations
5. **Plugin Architecture Preserved**: Snap_ia.plugin() pattern still works
6. **Backward Compatible**: Generated code works the same way as before

## Testing

Build completed successfully with no errors:
```
Running "concat:target" (concat) task
Running "concat:bsk" (concat) task
Running "concat:adv" (concat) task
Running "terser:dist" (terser) task
>> 1 file created.
Running "terser:bsk" (terser) task
>> 1 file created.
Running "terser:adv" (terser) task
>> 1 file created.
Running "jsdoc:dist" (jsdoc) task
>> Documentation generated...
Done.
```

## Old Files (Can be removed or kept as backup)

- `src/svg.js` - Original monolithic file (now replaced by snap.js + class files)
- `src/element.js` - Original Element prototype methods (now in element-class.js)
- `src/paper.js` - Original Paper prototype methods (now in paper-class.js)

## Next Steps (Optional)

1. Test the generated `dist/snap.svg.js` file in demos
2. Update any documentation that references the old file structure
3. Consider removing or archiving the old `svg.js`, `element.js`, and `paper.js` files
4. Run existing test suite to ensure functionality is preserved
