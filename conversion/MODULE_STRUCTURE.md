# Snap.svg ES6 Module Structure

## Current Structure (Monolithic)
```
┌─────────────────────────────────────────────┐
│                                             │
│              svg.js (2445 lines)            │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Snap Factory Function                │ │
│  │  - Element creation                   │ │
│  │  - Selector handling                  │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Constants & Globals                  │ │
│  │  - svgTags, cssAttr, geomAttr        │ │
│  │  - hub (element registry)             │ │
│  │  - glob (window, document)            │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Utility Functions (~900 lines)       │ │
│  │  - Math (angle, len, rad, deg)        │ │
│  │  - Color (getRGB, hsb, hsl, rgb)      │ │
│  │  - Type checking (is, cacher)         │ │
│  │  - String formatting                  │ │
│  │  - DOM helpers ($, make, wrap)        │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Element Class (~200 lines)           │ │
│  │  function Element(el) { ... }         │ │
│  │  Element.prototype.attr = ...         │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Fragment Class (~50 lines)           │ │
│  │  function Fragment(frag) { ... }      │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Paper Class (~400 lines)             │ │
│  │  function Paper(w, h) { ... }         │ │
│  │  Paper.prototype.rect = ...           │ │
│  │  Paper.prototype.circle = ...         │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │  Plugin System                        │ │
│  │  Snap.plugin(fn)                      │ │
│  └───────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

## Proposed Structure (Modular ES6)
```
src/
├── core/
│   ├── index.js                    # Main entry point
│   │   ├── Snap factory function
│   │   ├── Re-exports all classes
│   │   └── Re-exports utilities
│   │
│   ├── constants.js                # ~150 lines
│   │   ├── svgTags
│   │   ├── cssAttr
│   │   ├── geomAttr
│   │   ├── Regex patterns
│   │   └── xlink, xmlns
│   │
│   ├── globals.js                  # ~50 lines
│   │   ├── hub (element registry)
│   │   ├── glob (window, doc)
│   │   └── hub_rem
│   │
│   └── types.js                    # ~50 lines
│       ├── Type registration
│       └── available_types map
│
├── classes/
│   ├── Element.js                  # ~300 lines
│   │   └── export class Element {
│   │       ├── constructor(el)
│   │       ├── attr(params)
│   │       └── other methods moved from plugins
│   │       }
│   │
│   ├── Paper.js                    # ~500 lines
│   │   └── export class Paper extends Element {
│   │       ├── constructor(w, h)
│   │       ├── rect(...)
│   │       ├── circle(...)
│   │       ├── path(...)
│   │       └── other shape methods
│   │       }
│   │
│   ├── Fragment.js                 # ~30 lines
│   │   └── export class Fragment {
│   │       └── constructor(frag)
│   │       }
│   │
│   └── index.js                    # Re-exports
│       └── export { Element, Paper, Fragment }
│
├── utils/
│   ├── dom.js                      # ~200 lines
│   │   ├── $(el, attr) - DOM manipulation
│   │   ├── make(name, parent)
│   │   ├── wrap(dom)
│   │   └── ID generation
│   │
│   ├── math.js                     # ~200 lines
│   │   ├── rad(deg)
│   │   ├── deg(rad)
│   │   ├── angle(x1, y1, x2, y2)
│   │   ├── len(x1, y1, x2, y2)
│   │   ├── len2() - squared distance
│   │   ├── closestPoint()
│   │   └── Trig functions
│   │
│   ├── color.js                    # ~400 lines
│   │   ├── getRGB(colour)
│   │   ├── hsb(h, s, b)
│   │   ├── hsl(h, s, l)
│   │   ├── rgb(r, g, b, o)
│   │   ├── hsb2rgb()
│   │   ├── hsl2rgb()
│   │   ├── rgb2hsb()
│   │   ├── rgb2hsl()
│   │   └── color(clr) - parser
│   │
│   ├── string.js                   # ~100 lines
│   │   ├── format(str, args)
│   │   └── String utilities
│   │
│   ├── type-checking.js            # ~150 lines
│   │   ├── is(o, type)
│   │   ├── clone(obj)
│   │   ├── cacher(fn)
│   │   └── snapTo(values, value)
│   │
│   └── index.js                    # Re-exports
│       └── export { dom, math, color, ... }
│
├── parsers/
│   ├── path.js                     # ~300 lines
│   │   ├── parsePathString(str)
│   │   └── Path parsing logic
│   │
│   ├── transform.js                # ~200 lines
│   │   ├── svgTransform2string()
│   │   ├── transform2matrix()
│   │   └── Transform parsing
│   │
│   └── index.js                    # Re-exports
│
└── svg.js                          # Compatibility wrapper
    └── Backward-compatible API wrapping new modules
```

## Dependency Graph
```
                    ┌──────────────┐
                    │  core/index  │
                    │   (Snap)     │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐    ┌────▼────┐    ┌─────▼─────┐
    │  classes  │    │  utils  │    │  parsers  │
    └─────┬─────┘    └────┬────┘    └─────┬─────┘
          │               │                │
    ┌─────┼─────────┐     │                │
    │     │         │     │                │
┌───▼──┐ ┌▼──┐ ┌───▼───┐ │                │
│Element Paper Fragment│ │                │
└───┬──┘ └┬──┘ └───────┘ │                │
    │     │              │                │
    │     └──────┬───────┘                │
    │            │                        │
    └────────────┼────────────────────────┘
                 │
         ┌───────▼────────┐
         │  core/globals  │
         │  core/constants│
         └────────────────┘
```

## Class Relationships
```
                    ┌────────────────┐
                    │   Snap()       │
                    │   Factory      │
                    └───────┬────────┘
                            │ creates
              ┌─────────────┼─────────────┐
              │                           │
      ┌───────▼────────┐          ┌──────▼──────┐
      │    Element     │          │   Fragment  │
      │                │          │             │
      │  - node        │          │  - node     │
      │  - type        │          └─────────────┘
      │  - id          │
      │  - paper       │
      └───────▲────────┘
              │
              │ extends
              │
      ┌───────┴────────┐
      │     Paper      │
      │                │
      │  - defs        │
      │  - root        │
      │  + rect()      │
      │  + circle()    │
      │  + path()      │
      │  + ...         │
      └────────────────┘
```

## Module Import/Export Flow
```
// core/index.js
import { Element } from '../classes/Element.js';
import { Paper } from '../classes/Paper.js';
import { Fragment } from '../classes/Fragment.js';
import * as utils from '../utils/index.js';
import { hub, glob } from './globals.js';
import { svgTags, cssAttr } from './constants.js';

export function Snap(w, h) { ... }
export { Element, Paper, Fragment };
export { utils };

// classes/Element.js
import { hub, glob } from '../core/globals.js';
import { $, wrap } from '../utils/dom.js';
import { svgTags } from '../core/constants.js';

export class Element {
    constructor(el) { ... }
}

// classes/Paper.js
import { Element } from './Element.js';
import { make, $ } from '../utils/dom.js';
import { xmlns } from '../core/constants.js';

export class Paper extends Element {
    constructor(w, h) { ... }
}

// utils/color.js
import { is } from './type-checking.js';
import { cacher } from './type-checking.js';

export function getRGB(colour) { ... }
export function hsb(h, s, b) { ... }
```

## Build Pipeline
```
┌──────────────┐
│  Source ES6  │
│   Modules    │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌─────────────────────┐
│   Rollup/    │────▶│  UMD Bundle         │
│   Webpack    │     │  (snap.svg.js)      │
└──────┬───────┘     └─────────────────────┘
       │
       ├────────────▶┌─────────────────────┐
       │             │  ESM Bundle         │
       │             │  (snap.svg.esm.js)  │
       │             └─────────────────────┘
       │
       ├────────────▶┌─────────────────────┐
       │             │  CommonJS Bundle    │
       │             │  (snap.svg.cjs.js)  │
       │             └─────────────────────┘
       │
       └────────────▶┌─────────────────────┐
                     │  Minified           │
                     │  (snap.svg-min.js)  │
                     └─────────────────────┘
```

## Plugin System Architecture
```
Current (svg.js):
┌──────────────────────────────────────┐
│  Snap.plugin(function(Snap, Element, │
│    Paper, glob, Fragment, eve) {     │
│      Element.prototype.myMethod = …  │
│  });                                  │
└──────────────────────────────────────┘

New (ES6):
┌──────────────────────────────────────┐
│  // Option 1: Direct class extension │
│  import { Element } from 'snap.svg'; │
│  Element.prototype.myMethod = …      │
│                                       │
│  // Option 2: Plugin manager         │
│  import { PluginManager } from '…';  │
│  PluginManager.register(plugin);     │
│                                       │
│  // Option 3: Backward compat        │
│  Snap.plugin(function(...) { … });   │
└──────────────────────────────────────┘
```

## File Size Comparison
```
Current Structure:
├── svg.js (2445 lines / ~80KB)
└── Total: ~80KB source

Proposed Structure:
├── core/
│   ├── index.js (~200 lines / ~6KB)
│   ├── constants.js (~150 lines / ~5KB)
│   ├── globals.js (~50 lines / ~2KB)
│   └── types.js (~50 lines / ~2KB)
├── classes/
│   ├── Element.js (~300 lines / ~10KB)
│   ├── Paper.js (~500 lines / ~15KB)
│   ├── Fragment.js (~30 lines / ~1KB)
│   └── index.js (~10 lines / ~0.3KB)
├── utils/
│   ├── dom.js (~200 lines / ~6KB)
│   ├── math.js (~200 lines / ~6KB)
│   ├── color.js (~400 lines / ~12KB)
│   ├── string.js (~100 lines / ~3KB)
│   ├── type-checking.js (~150 lines / ~5KB)
│   └── index.js (~20 lines / ~0.5KB)
├── parsers/
│   ├── path.js (~300 lines / ~10KB)
│   ├── transform.js (~200 lines / ~6KB)
│   └── index.js (~10 lines / ~0.3KB)
└── Total: ~90KB source (10% overhead from module boilerplate)

Bundled Output:
├── UMD: ~85KB (similar to current after tree-shaking)
├── ESM: Variable (user's bundler tree-shakes)
└── Minified: ~40-50KB (similar to current)
```
