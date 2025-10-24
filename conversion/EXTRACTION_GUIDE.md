# Step-by-Step Extraction Guide for svg.js Refactoring

This guide provides exact line numbers and instructions for extracting code from `svg.js` into the new file structure.

## File: svg.js Structure Analysis

Current `svg.js` has 2,445 lines. Here's the breakdown:

```
Lines 1-17:       Copyright header
Lines 18:         IIFE start: (function (root) {
Lines 19-72:      Snap factory function
Lines 73-323:     Global setup, constants, utilities ($, ID)
Lines 324-1779:   Snap utilities (math, color, parsing, etc.)
Lines 1780-1850:  Element constructor
Lines 1851-1980:  [Element methods moved to element.js in previous refactor]
Lines 1981-2027:  Fragment constructor
Lines 2028-2100:  Paper constructor
Lines 2101-2408:  [Paper methods moved to paper.js in previous refactor]
Lines 2409-2434:  Helper functions (getElementByPoint)
Lines 2435-2445:  Plugin system, IIFE close, exports
```

## Step 1: Create snap-header.js

### Contents: Lines 1-323 from svg.js

Create `src/snap-header.js`:

```javascript
// Copyright (c) 2013 - 2017 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//Modifications copyright (C) 2019 <Orlin Vakarelov>

// var Snap_ia = (window || this).Snap_ia ||
(function (root) {
        Snap.version = "1.1";

        const eve = eve_ia;

        /**
         * Main Snap.svg factory function and namespace entry point.
         * Creates a drawing surface, wraps existing SVG content, or returns utility objects
         * depending on the argument type.
         *
         * @constructor
         * @param {(number|string|SVGElement|Array.<Element>|string)} [width] Width of the new surface,
         *        an existing SVG DOM node, an array of elements, or a CSS selector when combined with
         *        the `height` parameter being `null` or `undefined`.
         * @param {(number|string|Object)} [height] Height of the new surface or attribute map applied
         *        when the first argument is an element creation string.
         * @returns {(Snap.Element|Snap.Paper|Snap.Set|null)} Wrapped element, drawing paper, set of
         *          elements, or `null` when a selector matches nothing.
         */
        function Snap(w, h) {
            if (w) {
                if (w.nodeType || (Snap._.glob.win.jQuery && w instanceof jQuery)) {
                    return wrap(w);
                }
                if (is(w, "array") && Snap.set) {
                    return Snap.set.apply(Snap, w);
                }
                if (w instanceof Element) {
                    return w;
                }
                if (typeof w === "string") {
                    const match = w.trim().match(/^<((?!xml)[A-Za-z_][A-Za-z0-9-_.]*)\s*\/?>$/i);
                    if (match && match[1]) {
                        const el = wrap(glob.doc.createElement(match[1]));
                        if (typeof h === "object") {
                            el.attr(h);
                        }
                        return el
                    }
                }
                if (h == null) {
                    try {
                        w = glob.doc.querySelector(String(w));
                        return w ? wrap(w) : null;
                    } catch (e) {
                        return null;
                    }
                }
            }
            w = w == null ? "100%" : w;
            h = h == null ? "100%" : h;
            return new Paper(w, h);
        }

        Snap.toString = function () {
            return "Snap v" + this.version;
        };
        Snap._ = {};
        var glob = {
            win: root.window || {},
            doc: (root.window && root.window.document) ? root.window.document : {},
        };
        Snap._.glob = glob;

        Snap.window = function () {
            return glob.win;
        };

        Snap.document = function (snp) {
            return (snp) ? Snap(glob.doc) : glob.doc;
        }

        Snap.setWindow = function (newWindow) {
            glob.win = newWindow;
            glob.doc = newWindow.document;
        }

        Snap.getProto = function (proto_name) {
            switch (proto_name.toLowerCase()) {
                case "element":
                    return Element.prototype;
                case "paper":
                    return Paper.prototype;
                case "fragment":
                    return Fragment.prototype;
            }
        };

        Snap._dataEvents = false;
        Snap.enableDataEvents = function (off) {
            Snap._dataEvents = !off;
        }

        const has = "hasOwnProperty",
            Str = String,
            toFloat = parseFloat,
            toInt = parseInt,
            math = Math,
            mmax = math.max,
            mmin = math.min,
            abs = math.abs,
            pow = math.pow,
            PI = math.PI,
            round = math.round,
            E = "";
        let S = " ";
        const objectToString = Object.prototype.toString;
        const colourRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\))\s*$/i;
        const separator = Snap._.separator = /[,\s]+/;
        const commaSpaces = /[\s]*,[\s]*/;
        const hsrg = {hs: 1, rg: 1};
        const pathCommand = /([a-z])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/ig;
        const tCommand = /([rstm])[\s,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\s]*,?[\s]*)+)/ig;
        const pathValues = /(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\s]*,?[\s]*/ig;
        const tSrtToRemove = /atrix|ranslate|cale|otate|kewX|kewY|\(|\)/ig;
        let idgen = 0;
        const svgTags = {
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
        const cssAttr = {
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
        const geomAttr = {
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
        const idprefix = "S" + (+new Date).toString(36);
        const ID = function (el) {
            return (el && el.type ? el.type : E) + idprefix +
                (idgen++).toString(36);
        };
        const xlink = "http://www.w3.org/1999/xlink";
        const xmlns = "http://www.w3.org/2000/svg";
        const hub = {};
        const hub_rem = {};
        /**
         * Wraps an ID in a `url(#...)` reference.
         *
         * @function Snap.url
         * @memberof Snap
         * @param {string} value Fragment identifier.
         * @returns {string} URL reference string.
         */
        const URL = Snap.url = function (url) {
            return "url(#" + url + ")";
        };

        Snap.fixUrl = function (url) {
            return url.replace(/&amp;/g, "&")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&quot;/g, "\"")
                .replace(/&#39;/g, "'")
                .replace("\\x27", "'")
                .replace("\\x26", "&");
        };

        Snap._.hub = hub;

        Snap.elementFormId = function (id) {
            if (is(id, "element")) return id;
            return hub[id];
        }

        function $(el, attr) {
            if (attr) {
                if (el === "#text") {
                    el = glob.doc.createTextNode(attr.text || attr["#text"] || "");
                }
                if (el === "#comment") {
                    el = glob.doc.createComment(attr.text || attr["#text"] || "");
                }
                if (typeof el === "string") {
                    el = $(el);
                }
                if (typeof attr === "string") {
                    if (el.nodeType === 1) {
                        if (attr.substring(0, 6) === "xlink:") {
                            return el.getAttributeNS(xlink, attr.substring(6));
                        }
                        if (attr.substring(0, 4) === "xml:") {
                            return el.getAttributeNS(xmlns, attr.substring(4));
                        }
                        return el.getAttribute(attr);
                    } else if (attr === "text") {
                        return el.nodeValue;
                    } else {
                        return null;
                    }
                }
                if (el.nodeType === 1) {
                    for (let key in attr) if (attr[has](key)) {
                        const val = Str(attr[key]);
                        if (val) {
                            if (key.substring(0, 6) === "xlink:") {
                                el.setAttributeNS(xlink, key.substring(6), val);
                            } else if (key.substring(0, 4) === "xml:") {
                                el.setAttributeNS(xmlns, key.substring(4), val);
                            } else {
                                el.setAttribute(key, val);
                            }
                        } else {
                            el.removeAttribute(key);
                        }
                    }
                } else if (attr === "text") {
                    el.nodeValue = attr.text;
                } else {
                    el = $(attr.text || attr["#text"] || "");
                }
            } else {
                el = glob.doc.createElementNS(xmlns, el);
            }
            return el;
        }
        Snap._.$ = $;
        Snap._.id = ID;
```

### What to extract:
- **Lines 1-17**: Copyright
- **Line 18**: IIFE start
- **Lines 19-72**: Snap factory function
- **Lines 73-105**: Snap.toString, Snap._, glob, utility functions
- **Lines 106-323**: Constants, regex, $() function, ID() function

## Step 2: Create Snap.js

### Contents: Lines 324-1779 from svg.js

This file contains all the utility functions. Extract these sections:

**Section 1: String and Object Utilities (lines ~324-491)**
- Snap.format
- clone function
- cacher function

**Section 2: Math Utilities (lines ~492-813)**
- rad, deg
- angle, len, len2
- closestPoint
- Trig functions (sin, cos, tan, cot, asin, acos, atan, atan2)

**Section 3: Type Checking (lines ~814-887)**
- Snap.is
- Snap.registerType
- Snap.snapTo

**Section 4: Color Utilities (lines ~888-1301)**
- Snap.getRGB
- Snap.hsb, Snap.hsl, Snap.rgb
- Snap.color
- Snap.hsb2rgb, Snap.hsl2rgb
- Snap.rgb2hsb, Snap.rgb2hsl
- Helper functions (toHex, rgbtoString, etc.)

**Section 5: Path Parsing (lines ~1302-1514)**
- Snap.parsePathString
- svgTransform2string
- transform2matrix
- Path manipulation functions

**Section 6: DOM Utilities (lines ~1515-1779)**
- make function
- wrap function
- Snap.fragment
- Snap.measureTextClientRect
- Snap.parse
- Snap.select, Snap.selectAll

Create `src/Snap.js` with all these sections.

## Step 3: Create Fragment.js

### Contents: Lines 1981-2027 from svg.js

Create `src/Fragment.js`:

```javascript
        /**
         * Fragment constructor
         * Wraps a DocumentFragment for manipulation
         * 
         * @class Snap.Fragment
         * @param {DocumentFragment} frag DOM fragment
         */
        function Fragment(frag) {
            this.node = frag;
        }

        /**
         * Snap.fragment @method
         *
         * Creates a DOM fragment from a given list of elements or strings
         *
         * @param {...any} varargs - SVG string
         * @returns {Fragment} the @Fragment
         */
        Snap.fragment = function () {
            const args = Array.prototype.slice.call(arguments, 0),
                f = glob.doc.createDocumentFragment();
            let i = 0;
            const ii = args.length;
            for (; i < ii; ++i) {
                const item = args[i];
                if (item.node && item.node.nodeType) {
                    f.appendChild(item.node);
                }
                if (item.nodeType) {
                    f.appendChild(item);
                }
                if (typeof item === "string") {
                    f.appendChild(Snap.parse(item).node);
                }
            }
            return new Fragment(f);
        };

        function make(name, parent) {
            const res = $(name);
            parent.appendChild(res);
            const el = wrap(res);
            return el;
        }

        function wrap(dom) {
            if (!dom) {
                return dom;
            }
            if (dom instanceof Element || dom instanceof Fragment) {
                return dom;
            }
            if (dom.tagName && dom.tagName.toLowerCase() === "svg") {
                return new Paper(dom);
            }
            if (dom.tagName && dom.tagName.toLowerCase() === "object" &&
                dom.type === "image/svg+xml") {
                return new Paper(dom.contentDocument.getElementsByTagName("svg")[0]);
            }
            return new Element(dom);
        }

        Snap._.make = make;
        Snap._.wrap = wrap;
```

## Step 4: Modify element.js

### Add Element constructor at the beginning

Open `src/element.js` and add this INSIDE the existing `Snap_ia.plugin()` call, at the very beginning:

```javascript
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    // ADD THIS BLOCK AT THE BEGINNING:
    
    /**
     * Element constructor
     * Wraps an SVG element with Snap methods
     * 
     * @class Snap.Element
     * @param {SVGElement} el Underlying DOM node
     */
    function Element(el) {
        if (el.snap in hub) {
            return hub[el.snap];
        }
        let svg;
        try {
            svg = el.ownerSVGElement;
        } catch (e) {
        }
        /**
         * Element.node
         [ property (object) ]
         *
         * Gives you a reference to the DOM object, so you can assign event handlers or just mess around.
         > Usage
         | // draw a circle at coordinate 10,10 with radius of 10
         | var c = paper.circle(10, 10, 10);
         | c.node.onclick = function () {
         |     c.attr("fill", "red");
         | };
         */
        this.node = el;
        if (svg) {
            this.paper = new Paper(svg);
        }
        /**
         * Element.type
         [ property (string) ]
         *
         * SVG tag name of the given element.
         */
        this.type = (el.tagName || el.nodeName
            || ((Snap._.glob.win.jQuery && el instanceof jQuery) ? "jquery" : null));
        if (this.type) this.type = this.type.toLowerCase();
        const id = this.id = ID(this);
        this.anims = {};
        this._ = {
            transform: [],
        };
        el.snap = id;
        if (this.type === "div") {
            console.log(id, this.node);
        }
        hub[id] = this;
    }
    
    // IMPORTANT: Need to access these from snap-header.js scope
    const hub = Snap._.hub;
    const ID = Snap._.id;
    
    // ALL THE EXISTING CODE FOLLOWS HERE:
    const elproto = Element.prototype,
        proto = Paper.prototype,
        is = Snap.is,
        Str = String,
        // ... etc
```

## Step 5: Modify paper.js

### Add Paper constructor at the beginning

Open `src/paper.js` and add this INSIDE the existing `Snap_ia.plugin()` call, at the very beginning:

```javascript
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    // ADD THIS BLOCK AT THE BEGINNING:
    
    /**
     * Paper constructor
     * Wrapper around an `<svg>` root node providing element creation helpers and utilities.
     * 
     * @class Snap.Paper
     * @param {(number|string|SVGElement)} w Width of the surface or an existing SVG element.
     * @param {(number|string)} [h] Height of the surface when `w` is a numeric or string size.
     */
    function Paper(w, h) {
        let res,
            defs;
        const proto = Paper.prototype;
        if (w && w.tagName && w.tagName.toLowerCase() === "svg") {
            if (w.snap in hub) {
                return hub[w.snap];
            }
            const doc = w.ownerDocument;
            res = new Element(w);
            defs = w.getElementsByTagName("defs")[0];
            if (!defs) {
                defs = $("defs");
                res.node.appendChild(defs);
            }
            res.defs = defs;
            for (let key in proto) if (proto[has](key)) {
                res[key] = proto[key];
            }
            res.paper = res.root = res;
        } else {
            res = make("svg", glob.doc.body);
            $(res.node, {
                height: h,
                version: 1.1,
                width: w,
                xmlns: xmlns,
            });
        }
        return res;
    }
    
    // IMPORTANT: Need to access these from snap-header.js scope
    const hub = Snap._.hub;
    const $ = Snap._.$;
    const make = Snap._.make;
    const has = "hasOwnProperty";
    const xmlns = "http://www.w3.org/2000/svg";
    
    // ALL THE EXISTING CODE FOLLOWS HERE:
    var proto = Paper.prototype,
        is = Snap.is;
    /**
     * Draws a rectangle on the paper.
     * // ... etc
```

## Step 6: Create snap-footer.js

### Contents: Lines 2435-2445 from svg.js

Create `src/snap-footer.js`:

```javascript
        /**
         * Registers a plugin function that receives the Snap namespace and key prototypes.
         *
         * @function Snap.plugin
         * @memberof Snap
         * @param {function(Snap, Snap.Element, Snap.Paper, Window, Snap.Fragment, Function)} f Plugin callback.
         */
        Snap.plugin = function (f) {
            f(Snap, Element, Paper, glob, Fragment, eve);
        };
        root.Snap_ia = Snap;
        root.Snap = root.Snap || Snap;
        return Snap;
    }

    (typeof window !== "undefined" ? window : global)
);
```

## Step 7: Update Gruntfile.js

Modify the `core` array:

```javascript
const core = [
    './src/mina.js',
    './src/snap-header.js',    // NEW: was part of svg.js
    './src/Snap.js',            // NEW: was part of svg.js
    './src/Fragment.js',        // NEW: was part of svg.js
    './src/element.js',         // MODIFIED: now includes Element constructor
    './src/animation.js',
    './src/matrix.js',
    './src/attr.js',
    './src/class.js',
    './src/attradd.js',
    './src/paper.js',           // MODIFIED: now includes Paper constructor
    './src/bbox.js',
    './src/path.js',
    './src/set.js',
    './src/equal.js',
    './src/mouse.js',
    './src/filter.js',
    './src/align.js',
    './src/colors.js',
    './src/snap-footer.js',     // NEW: was part of svg.js
];
```

**Remove** `'./src/svg.js'` from the array.

## Step 8: Testing Checklist

After making changes:

```bash
# 1. Build
grunt

# 2. Check that files are generated
ls dist/snap.svg.js
ls dist/snap.svg-min.js

# 3. Check file sizes (should be similar to before)
# Before refactor:
# dist/snap.svg.js: ~250KB
# dist/snap.svg-min.js: ~120KB

# 4. Run tests
npm test

# 5. Test in browser
# Open demos in browser and verify they work
```

## Common Issues and Solutions

### Issue 1: "hub is not defined"
**Cause**: Element or Paper constructor can't find `hub`  
**Solution**: Make sure Element and Paper access hub via:
```javascript
const hub = Snap._.hub;
```

### Issue 2: "make is not defined"
**Cause**: Paper constructor can't find `make` function  
**Solution**: Make sure `make` is defined in snap-header.js or Fragment.js before paper.js

### Issue 3: "wrap is not defined"
**Cause**: Snap factory can't find `wrap` function  
**Solution**: Define `wrap` in Fragment.js or snap-header.js

### Issue 4: Build succeeds but functions don't work
**Cause**: File order in Gruntfile.js is wrong  
**Solution**: Ensure this order:
1. snap-header.js (defines globals)
2. Snap.js (defines utilities)
3. Fragment.js (defines Fragment, make, wrap)
4. element.js (defines Element, uses make/wrap)
5. paper.js (defines Paper, uses Element)
6. Other plugins
7. snap-footer.js (plugin system, close IIFE)

## Verification Script

Create `verify-refactor.sh`:

```bash
#!/bin/bash

echo "Building with Grunt..."
grunt

echo "Checking file sizes..."
ls -lh dist/snap.svg.js
ls -lh dist/snap.svg-min.js

echo "Checking for syntax errors..."
node -c dist/snap.svg.js

echo "Running tests..."
npm test

echo "Done!"
```

Make it executable and run:
```bash
chmod +x verify-refactor.sh
./verify-refactor.sh
```

## Summary

1. Create 4 new files: snap-header.js, Snap.js, Fragment.js, snap-footer.js
2. Modify 2 existing files: element.js, paper.js (add constructors)
3. Update Gruntfile.js to use new file order
4. Remove svg.js
5. Test thoroughly

The result: Same functionality, better organization, preserved plugin system.
