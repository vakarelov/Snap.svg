# Quick Start: Phase 1 Implementation

This guide provides step-by-step instructions to start Phase 1 of the ES6 refactoring.

## Prerequisites

- Node.js and npm installed
- Git repository initialized
- Current Grunt build working
- Basic understanding of ES6 modules

## Step 1: Create Feature Branch

```bash
git checkout -b feature/es6-refactor
git push -u origin feature/es6-refactor
```

## Step 2: Install Build Tools

```bash
# Install Rollup and plugins
npm install --save-dev rollup
npm install --save-dev @rollup/plugin-node-resolve
npm install --save-dev @rollup/plugin-commonjs
npm install --save-dev @rollup/plugin-babel
npm install --save-dev rollup-plugin-terser
npm install --save-dev @babel/core
npm install --save-dev @babel/preset-env

# Install testing tools (if not already installed)
npm install --save-dev jest
npm install --save-dev @babel/plugin-transform-modules-commonjs
```

## Step 3: Create Directory Structure

```bash
# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path src\core
New-Item -ItemType Directory -Force -Path src\classes
New-Item -ItemType Directory -Force -Path src\utils
New-Item -ItemType Directory -Force -Path src\parsers
New-Item -ItemType Directory -Force -Path tests\core
New-Item -ItemType Directory -Force -Path tests\classes
New-Item -ItemType Directory -Force -Path tests\utils
New-Item -ItemType Directory -Force -Path tests\parsers

# Or manually create folders:
src/
  core/
  classes/
  utils/
  parsers/
tests/
  core/
  classes/
  utils/
  parsers/
```

## Step 4: Create Rollup Configuration

Create `rollup.config.js` in the project root:

```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

const banner = `// Snap.svg v2.0.0
// Copyright (c) 2013 - 2024 Adobe Systems Incorporated. All rights reserved.
// Licensed under the Apache License, Version 2.0`;

export default [
    // UMD build (browser)
    {
        input: 'src/core/index.js',
        output: {
            file: 'dist/snap.svg.js',
            format: 'umd',
            name: 'Snap',
            banner,
            globals: {
                'eve': 'eve_ia'
            }
        },
        external: ['eve'],
        plugins: [
            resolve(),
            commonjs(),
            babel({
                babelHelpers: 'bundled',
                presets: ['@babel/preset-env'],
                exclude: 'node_modules/**'
            })
        ]
    },
    
    // ESM build (modern bundlers)
    {
        input: 'src/core/index.js',
        output: {
            file: 'dist/snap.svg.esm.js',
            format: 'esm',
            banner
        },
        external: ['eve'],
        plugins: [
            resolve(),
            commonjs()
        ]
    },
    
    // Minified UMD build
    {
        input: 'src/core/index.js',
        output: {
            file: 'dist/snap.svg-min.js',
            format: 'umd',
            name: 'Snap',
            banner,
            globals: {
                'eve': 'eve_ia'
            }
        },
        external: ['eve'],
        plugins: [
            resolve(),
            commonjs(),
            babel({
                babelHelpers: 'bundled',
                presets: ['@babel/preset-env'],
                exclude: 'node_modules/**'
            }),
            terser({
                output: {
                    preamble: banner
                }
            })
        ]
    }
];
```

## Step 5: Update package.json

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "build:grunt": "grunt",
    "build:rollup": "rollup -c",
    "build": "npm run build:grunt && npm run build:rollup",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "module": "dist/snap.svg.esm.js",
  "main": "dist/snap.svg.js"
}
```

## Step 6: Create Constants Module

Create `src/core/constants.js`:

```javascript
// src/core/constants.js

/**
 * SVG element tags that Snap.svg supports
 */
export const svgTags = {
    svg: 0, circle: 0, rect: 0, ellipse: 0, line: 0,
    polyline: 0, polygon: 0, path: 0, g: 0, defs: 0,
    marker: 0, text: 0, tspan: 0, use: 0, image: 0, clippath: 0,
    pattern: 0, mask: 0, symbol: 0, lineargradient: 0, radialgradient: 0,
    stop: 0, filter: 0, feblend: 0, fecolormatrix: 0, fecomponenttransfer: 0,
    fecomposite: 0, feconvolvematrix: 0, fediffuselighting: 0, fedisplacementmap: 0,
    feflood: 0, fegaussianblur: 0, feimage: 0, femerge: 0, femergenode: 0,
    femorphology: 0, feoffset: 0, fespecularlighting: 0, fetile: 0, feturbulence: 0,
    foreignobject: 0, desc: 0, title: 0, metadata: 0, switch: 0, style: 0, script: 0,
    animate: 0, animatemotion: 0, animatetransform: 0, mpath: 0, set: 0,
    view: 0, cursor: 0, font: 0, fontface: 0, glyph: 0, missingglyph: 0
};

/**
 * CSS attributes that can be set via style or attribute
 */
export const cssAttr = {
    "alignment-baseline": 0,
    "baseline-shift": 0,
    "clip": 0,
    "clip-path": 0,
    "clip-rule": 0,
    "color": 0,
    "color-interpolation": 0,
    "color-interpolation-filters": 0,
    "color-profile": 0,
    "color-rendering": 0,
    "cursor": 0,
    "direction": 0,
    "display": 0,
    "dominant-baseline": 0,
    "enable-background": 0,
    "fill": 0,
    "fill-opacity": 0,
    "fill-rule": 0,
    "filter": 0,
    "flood-color": 0,
    "flood-opacity": 0,
    "font": 0,
    "font-family": 0,
    "font-size": 0,
    "font-size-adjust": 0,
    "font-stretch": 0,
    "font-style": 0,
    "font-variant": 0,
    "font-weight": 0,
    "glyph-orientation-horizontal": 0,
    "glyph-orientation-vertical": 0,
    "image-rendering": 0,
    "kerning": 0,
    "letter-spacing": 0,
    "lighting-color": 0,
    "marker": 0,
    "marker-end": 0,
    "marker-mid": 0,
    "marker-start": 0,
    "mask": 0,
    "opacity": 0,
    "overflow": 0,
    "pointer-events": 0,
    "shape-rendering": 0,
    "stop-color": 0,
    "stop-opacity": 0,
    "stroke": 0,
    "stroke-dasharray": 0,
    "stroke-dashoffset": 0,
    "stroke-linecap": 0,
    "stroke-linejoin": 0,
    "stroke-miterlimit": 0,
    "stroke-opacity": 0,
    "stroke-width": 0,
    "text-anchor": 0,
    "text-decoration": 0,
    "text-rendering": 0,
    "unicode-bidi": 0,
    "visibility": 0,
    "word-spacing": 0,
    "writing-mode": 0,
};

/**
 * Geometric attributes
 */
export const geomAttr = {
    "x": 0,
    "y": 0,
    "width": 0,
    "height": 0,
    "r": 0,
    "rx": 0,
    "ry": 0,
    "x1": 0,
    "y1": 0,
    "x2": 0,
    "y2": 0,
    "points": 0,
    "d": 0,
    "dx": 0,
    "dy": 0,
};

/**
 * Regular expressions
 */
export const colourRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\))\s*$/i;
export const separator = /[,\s]+/;
export const commaSpaces = /[\s]*,[\s]*/;
export const hsrg = {hs: 1, rg: 1};
export const pathCommand = /([a-z])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/ig;
export const tCommand = /([rstm])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/ig;
export const pathValues = /(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\s]*,?[\s]*/ig;
export const tSrtToRemove = /atrix|ranslate|cale|otate|kewX|kewY|\(|\)/ig;

/**
 * XML namespaces
 */
export const xlink = "http://www.w3.org/1999/xlink";
export const xmlns = "http://www.w3.org/2000/svg";

/**
 * ID prefix for generated IDs
 */
export const idprefix = "S" + (+new Date).toString(36);

/**
 * Property checking
 */
export const has = "hasOwnProperty";
```

## Step 7: Create Globals Module

Create `src/core/globals.js`:

```javascript
// src/core/globals.js

/**
 * Global window and document references
 */
export const glob = {
    win: typeof window !== "undefined" ? window : {},
    doc: typeof window !== "undefined" && window.document ? window.document : {},
};

/**
 * Element registry hub
 * Maps element IDs to Snap.Element instances
 */
export const hub = {};

/**
 * Hub removal registry (for cleanup)
 */
export const hub_rem = {};

/**
 * ID generator counter
 */
export let idgen = 0;

/**
 * Increments and returns the next ID
 */
export function nextId() {
    return idgen++;
}

/**
 * Sets the window reference (for testing or different contexts)
 */
export function setWindow(newWindow) {
    glob.win = newWindow;
    glob.doc = newWindow.document;
}
```

## Step 8: Create Test for Constants

Create `tests/core/constants.test.js`:

```javascript
// tests/core/constants.test.js
import { svgTags, cssAttr, geomAttr, xlink, xmlns } from '../../src/core/constants';

describe('Constants', () => {
    test('svgTags contains common SVG elements', () => {
        expect('svg' in svgTags).toBe(true);
        expect('circle' in svgTags).toBe(true);
        expect('rect' in svgTags).toBe(true);
        expect('path' in svgTags).toBe(true);
    });
    
    test('cssAttr contains common CSS properties', () => {
        expect('fill' in cssAttr).toBe(true);
        expect('stroke' in cssAttr).toBe(true);
        expect('opacity' in cssAttr).toBe(true);
    });
    
    test('geomAttr contains geometric attributes', () => {
        expect('x' in geomAttr).toBe(true);
        expect('y' in geomAttr).toBe(true);
        expect('width' in geomAttr).toBe(true);
        expect('height' in geomAttr).toBe(true);
    });
    
    test('XML namespaces are defined', () => {
        expect(xlink).toBe("http://www.w3.org/1999/xlink");
        expect(xmlns).toBe("http://www.w3.org/2000/svg");
    });
});
```

## Step 9: Create Test for Globals

Create `tests/core/globals.test.js`:

```javascript
// tests/core/globals.test.js
import { glob, hub, hub_rem, nextId } from '../../src/core/globals';

describe('Globals', () => {
    test('glob contains window and doc references', () => {
        expect(glob).toHaveProperty('win');
        expect(glob).toHaveProperty('doc');
    });
    
    test('hub is an empty object initially', () => {
        expect(typeof hub).toBe('object');
    });
    
    test('nextId increments', () => {
        const id1 = nextId();
        const id2 = nextId();
        expect(id2).toBe(id1 + 1);
    });
});
```

## Step 10: Configure Jest

Create `jest.config.js`:

```javascript
// jest.config.js
module.exports = {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.js$': ['babel-jest', { 
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-modules-commonjs']
        }]
    },
    moduleFileExtensions: ['js'],
    testMatch: ['**/tests/**/*.test.js'],
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js'
    ]
};
```

## Step 11: Run Tests

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Step 12: Create Temporary Index (For Testing)

Create `src/core/index.js` (minimal version):

```javascript
// src/core/index.js (temporary, minimal version)
import * as constants from './constants.js';
import * as globals from './globals.js';

// Temporary Snap function (will be expanded later)
export function Snap() {
    console.log('Snap ES6 - Phase 1');
}

// Export version
Snap.version = "2.0.0-alpha.1";

// Export constants for testing
Snap._ = {
    constants,
    globals
};

export default Snap;
```

## Step 13: Build with Rollup

```bash
# Build all formats
npm run build:rollup

# Check output files
# dist/snap.svg.js (UMD)
# dist/snap.svg.esm.js (ESM)
# dist/snap.svg-min.js (minified)
```

## Step 14: Test UMD Build in Browser

Create `test.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Snap.svg ES6 Test</title>
</head>
<body>
    <div id="svg"></div>
    
    <script src="dist/snap.svg.js"></script>
    <script>
        console.log('Snap loaded:', typeof Snap);
        console.log('Version:', Snap.version);
        console.log('Constants:', Snap._);
    </script>
</body>
</html>
```

Open `test.html` in a browser and check the console.

## Step 15: Commit Phase 1 Changes

```bash
git add .
git commit -m "Phase 1: Infrastructure setup

- Created ES6 module structure
- Set up Rollup build pipeline
- Extracted constants module
- Extracted globals module
- Added Jest testing
- Both Grunt and Rollup builds working"

git push origin feature/es6-refactor
```

## Next Steps

After completing Phase 1:

1. Extract utility functions (math, color, DOM, etc.)
2. Write comprehensive tests for each utility
3. Convert Element, Paper, Fragment to ES6 classes
4. Migrate plugin methods to classes
5. Update documentation

## Troubleshooting

### Issue: Rollup fails to resolve modules
**Solution**: Make sure all imports use `.js` extension:
```javascript
// Good
import { hub } from './globals.js';

// Bad
import { hub } from './globals';
```

### Issue: Jest can't find modules
**Solution**: Check `jest.config.js` has correct transform settings

### Issue: Browser can't load UMD bundle
**Solution**: Check Rollup output format is `umd` and `name` is set

### Issue: Module not found in tests
**Solution**: Use relative paths: `../../src/core/constants.js`

## Verification Checklist

✅ Directory structure created  
✅ Rollup installed and configured  
✅ Jest installed and configured  
✅ Constants module created and tested  
✅ Globals module created and tested  
✅ Rollup builds successfully  
✅ UMD bundle loads in browser  
✅ ESM bundle has correct exports  
✅ Tests pass  
✅ Grunt build still works  
✅ Changes committed to git  

## Success Criteria

You've successfully completed Phase 1 when:

1. ✅ Both Grunt and Rollup builds work
2. ✅ Constants and globals are in separate modules
3. ✅ Tests are passing
4. ✅ UMD bundle loads in browser
5. ✅ ESM bundle can be imported
6. ✅ No existing functionality is broken

Congratulations! You're ready for Phase 2: Utility Extraction.
