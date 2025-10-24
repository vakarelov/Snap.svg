# ES6 Conversion Examples

This document shows concrete examples of how to convert the current code to ES6 modules.

## Example 1: Element Class Conversion

### Before (Current - svg.js)
```javascript
// Inside IIFE, around line 1783
function Element(el) {
    if (el.snap in hub) {
        return hub[el.snap];
    }
    let svg;
    try {
        svg = el.ownerSVGElement;
    } catch (e) {}
    
    this.node = el;
    if (svg) {
        this.paper = new Paper(svg);
    }
    this.type = (el.tagName || el.nodeName || 
                 ((Snap._.glob.win.jQuery && el instanceof jQuery) ? "jquery" : null));
    if (this.type) this.type = this.type.toLowerCase();
    
    const id = this.id = ID(this);
    this.anims = {};
    this._ = {
        transform: [],
    };
    el.snap = id;
    hub[id] = this;
}

// Methods added via prototype (in element.js plugin)
Element.prototype.attr = function(params) {
    // ... implementation
};

Element.prototype.getBBox = function(settings) {
    // ... implementation
};
```

### After (ES6 - classes/Element.js)
```javascript
// classes/Element.js
import { hub, glob } from '../core/globals.js';
import { ID } from '../utils/dom.js';
import { Snap } from '../core/index.js';

export class Element {
    constructor(el) {
        // Return cached element if it exists
        if (el.snap in hub) {
            return hub[el.snap];
        }
        
        // Get owner SVG element
        let svg;
        try {
            svg = el.ownerSVGElement;
        } catch (e) {}
        
        // Set instance properties
        this.node = el;
        
        // Lazy-load Paper to avoid circular dependency
        if (svg) {
            const Paper = Element._Paper || (Element._Paper = require('./Paper.js').Paper);
            this.paper = new Paper(svg);
        }
        
        // Determine element type
        this.type = this._determineType(el);
        if (this.type) {
            this.type = this.type.toLowerCase();
        }
        
        // Initialize element tracking
        const id = this.id = ID(this);
        this.anims = {};
        this._ = {
            transform: [],
        };
        
        // Register in hub
        el.snap = id;
        hub[id] = this;
    }
    
    _determineType(el) {
        return el.tagName || 
               el.nodeName || 
               ((glob.win.jQuery && el instanceof jQuery) ? "jquery" : null);
    }
    
    /**
     * Gets or sets element attributes
     * @param {Object|string} params - Attribute name or object with key-value pairs
     * @param {*} value - Attribute value (when params is a string)
     * @returns {Element|*} Element for chaining or attribute value
     */
    attr(params, value) {
        // Implementation moved from element.js plugin
        if (params == null) {
            return this;
        }
        
        if (typeof params === "string") {
            if (arguments.length === 1) {
                // Getter
                return this._getAttr(params);
            }
            // Setter
            const obj = {};
            obj[params] = value;
            params = obj;
        }
        
        // Set multiple attributes
        for (let key in params) {
            if (params.hasOwnProperty(key)) {
                this._setAttr(key, params[key]);
            }
        }
        
        return this;
    }
    
    _getAttr(name) {
        // Implementation details...
        return this.node.getAttribute(name);
    }
    
    _setAttr(name, value) {
        // Implementation details...
        this.node.setAttribute(name, value);
    }
    
    /**
     * Gets bounding box of the element
     * @param {boolean|Object} settings - Configuration options
     * @returns {Object} Bounding box with x, y, width, height, etc.
     */
    getBBox(settings) {
        // Implementation moved from element.js plugin
        // ... (full implementation)
    }
}

// Static property to break circular dependency
Element._Paper = null;
```

## Example 2: Paper Class Conversion

### Before (Current - svg.js + paper.js)
```javascript
// In svg.js around line 2028
function Paper(w, h) {
    let res, defs;
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

// In paper.js plugin
proto.rect = function(x, y, w, h, rx, ry, attr) {
    // ... implementation
};
```

### After (ES6 - classes/Paper.js)
```javascript
// classes/Paper.js
import { Element } from './Element.js';
import { hub, glob } from '../core/globals.js';
import { $, make } from '../utils/dom.js';
import { xmlns } from '../core/constants.js';

export class Paper extends Element {
    constructor(w, h) {
        // Handle existing SVG element
        if (w && w.tagName && w.tagName.toLowerCase() === "svg") {
            // Check cache
            if (w.snap in hub) {
                return hub[w.snap];
            }
            
            // Initialize as Element
            super(w);
            
            // Set up defs
            let defs = w.getElementsByTagName("defs")[0];
            if (!defs) {
                defs = $("defs");
                this.node.appendChild(defs);
            }
            this.defs = defs;
            
            // Set paper references
            this.paper = this;
            this.root = this;
            
            return this;
        }
        
        // Create new SVG element
        const svgNode = make("svg", glob.doc.body);
        $(svgNode, {
            height: h,
            version: 1.1,
            width: w,
            xmlns: xmlns,
        });
        
        // Initialize as Element
        super(svgNode);
        
        // Set up defs
        const defs = $("defs");
        this.node.appendChild(defs);
        this.defs = defs;
        
        // Set paper references
        this.paper = this;
        this.root = this;
    }
    
    /**
     * Draws a rectangle
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} w - Width
     * @param {number} h - Height
     * @param {number} [rx] - Horizontal radius for rounded corners
     * @param {number} [ry] - Vertical radius for rounded corners
     * @param {Object} [attr] - Additional attributes
     * @returns {Element} The rectangle element
     */
    rect(x, y, w, h, rx, ry, attr) {
        // Handle various parameter formats
        if (typeof rx === "object" && !Array.isArray(rx)) {
            attr = rx;
            rx = ry = undefined;
        }
        if (typeof ry === "object") {
            attr = ry;
            ry = undefined;
        }
        if (ry == null) {
            ry = rx;
        }
        
        attr = attr || {};
        
        if (typeof x === "object" && x === "[object Object]") {
            attr = x;
        } else {
            if (x != null) attr.x = x;
            if (y != null) attr.y = y;
            if (w != null) attr.width = w;
            if (h != null) attr.height = h;
            if (rx != null) attr.rx = rx;
            if (ry != null) attr.ry = ry;
        }
        
        return this.el("rect", attr);
    }
    
    /**
     * Draws a circle
     * @param {number} cx - Center X coordinate
     * @param {number} cy - Center Y coordinate
     * @param {number} r - Radius
     * @param {Object} [attr] - Additional attributes
     * @returns {Element} The circle element
     */
    circle(cx, cy, r, attr) {
        attr = attr || {};
        
        if (typeof cx === "object" && cx === "[object Object]") {
            attr = cx;
        } else {
            if (cx != null) attr.cx = cx;
            if (cy != null) attr.cy = cy;
            if (r != null) attr.r = r;
        }
        
        return this.el("circle", attr);
    }
    
    /**
     * Creates a path element
     * @param {string|Object} [pathString] - SVG path string or attributes
     * @returns {Element} The path element
     */
    path(pathString, attr) {
        attr = attr || {};
        
        if (typeof pathString === "object" && !Array.isArray(pathString)) {
            attr = pathString;
        } else if (pathString) {
            attr.d = pathString;
        }
        
        return this.el("path", attr);
    }
    
    /**
     * Creates an SVG element and appends it to the paper
     * @param {string} name - Element tag name
     * @param {Object} [attr] - Attributes to set
     * @returns {Element} Wrapped element
     */
    el(name, attr) {
        const el = make(name, this.node);
        if (attr) {
            el.attr(attr);
        }
        return el;
    }
}
```

## Example 3: Utility Module Conversion

### Before (Current - svg.js)
```javascript
// Inside IIFE
const has = "hasOwnProperty";
const toFloat = parseFloat;
const toInt = parseInt;
const math = Math;
const abs = math.abs;

function rad(deg) {
    return deg % 360 * PI / 180;
}

function deg(rad) {
    return rad * 180 / PI % 360;
}

function angle(x1, y1, x2, y2, x3, y3) {
    if (x3 == null) {
        const x = x1 - x2,
            y = y1 - y2;
        if (!x && !y) {
            return 0;
        }
        return (180 + math.atan2(-y, -x) * 180 / PI + 360) % 360;
    } else {
        return angle(x1, y1, x3, y3) - angle(x2, y2, x3, y3);
    }
}

// Exposed on Snap
Snap.rad = rad;
Snap.deg = deg;
Snap.angle = angle;
```

### After (ES6 - utils/math.js)
```javascript
// utils/math.js
const PI = Math.PI;
const abs = Math.abs;
const atan2 = Math.atan2;
const sqrt = Math.sqrt;
const pow = Math.pow;

/**
 * Converts degrees to radians
 * @param {number} deg - Angle in degrees
 * @returns {number} Angle in radians
 */
export function rad(deg) {
    return deg % 360 * PI / 180;
}

/**
 * Converts radians to degrees
 * @param {number} rad - Angle in radians
 * @returns {number} Angle in degrees
 */
export function deg(rad) {
    return rad * 180 / PI % 360;
}

/**
 * Calculates angle between points
 * @param {number} x1 - First point X (or first point X for angle from third point)
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @param {number} [x3] - Optional third point X (center of angle)
 * @param {number} [y3] - Optional third point Y (center of angle)
 * @returns {number} Angle in degrees
 */
export function angle(x1, y1, x2, y2, x3, y3) {
    if (x3 == null) {
        // Two-point angle from origin
        const x = x1 - x2;
        const y = y1 - y2;
        
        if (!x && !y) {
            return 0;
        }
        
        return (180 + atan2(-y, -x) * 180 / PI + 360) % 360;
    } else {
        // Angle between two rays from a common point
        return angle(x1, y1, x3, y3) - angle(x2, y2, x3, y3);
    }
}

/**
 * Calculates distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance
 */
export function len(x1, y1, x2, y2) {
    return sqrt(len2(x1, y1, x2, y2));
}

/**
 * Calculates squared distance between two points (faster than len)
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Squared distance
 */
export function len2(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
}

/**
 * Trigonometric sine (accepts degrees or radians)
 * @param {number} angle - Angle (interpreted based on magnitude)
 * @returns {number} Sine value
 */
export function sin(angle) {
    return Math.sin(angle > 1 || angle < -1 ? rad(angle) : angle);
}

/**
 * Trigonometric cosine (accepts degrees or radians)
 * @param {number} angle - Angle (interpreted based on magnitude)
 * @returns {number} Cosine value
 */
export function cos(angle) {
    return Math.cos(angle > 1 || angle < -1 ? rad(angle) : angle);
}

/**
 * Trigonometric tangent (accepts degrees or radians)
 * @param {number} angle - Angle (interpreted based on magnitude)
 * @returns {number} Tangent value
 */
export function tan(angle) {
    return Math.tan(angle > 1 || angle < -1 ? rad(angle) : angle);
}

/**
 * Trigonometric cotangent (accepts degrees or radians)
 * @param {number} angle - Angle (interpreted based on magnitude)
 * @returns {number} Cotangent value
 */
export function cot(angle) {
    return 1 / tan(angle);
}

/**
 * Inverse sine (returns radians)
 * @param {number} num - Value between -1 and 1
 * @returns {number} Angle in radians
 */
export function asin(num) {
    return Math.asin(num);
}

/**
 * Inverse cosine (returns radians)
 * @param {number} num - Value between -1 and 1
 * @returns {number} Angle in radians
 */
export function acos(num) {
    return Math.acos(num);
}

/**
 * Inverse tangent (returns radians)
 * @param {number} num - Tangent value
 * @returns {number} Angle in radians
 */
export function atan(num) {
    return Math.atan(num);
}

/**
 * Two-argument inverse tangent (returns radians)
 * @param {number} y - Y coordinate
 * @param {number} x - X coordinate
 * @returns {number} Angle in radians
 */
export function atan2(y, x) {
    return Math.atan2(y, x);
}
```

## Example 4: Main Entry Point

### After (ES6 - core/index.js)
```javascript
// core/index.js
import { Element } from '../classes/Element.js';
import { Paper } from '../classes/Paper.js';
import { Fragment } from '../classes/Fragment.js';
import { wrap } from '../utils/dom.js';
import { glob } from './globals.js';
import * as mathUtils from '../utils/math.js';
import * as colorUtils from '../utils/color.js';
import * as typeUtils from '../utils/type-checking.js';

// Set Paper reference on Element to break circular dependency
Element._Paper = Paper;

/**
 * Main Snap.svg factory function
 * @param {*} w - Width, element, or selector
 * @param {*} h - Height or attributes
 * @returns {Element|Paper|Set|null}
 */
export function Snap(w, h) {
    if (w) {
        // Handle DOM nodes
        if (w.nodeType || (glob.win.jQuery && w instanceof glob.win.jQuery)) {
            return wrap(w);
        }
        
        // Handle arrays -> Set
        if (typeUtils.is(w, "array") && Snap.set) {
            return Snap.set.apply(Snap, w);
        }
        
        // Already wrapped
        if (w instanceof Element) {
            return w;
        }
        
        // Handle element creation strings
        if (typeof w === "string") {
            const match = w.trim().match(/^<((?!xml)[A-Za-z_][A-Za-z0-9-_.]*)\s*\/?>$/i);
            if (match && match[1]) {
                const el = wrap(glob.doc.createElement(match[1]));
                if (typeof h === "object") {
                    el.attr(h);
                }
                return el;
            }
        }
        
        // Handle selector
        if (h == null) {
            try {
                w = glob.doc.querySelector(String(w));
                return w ? wrap(w) : null;
            } catch (e) {
                return null;
            }
        }
    }
    
    // Create new Paper
    w = w == null ? "100%" : w;
    h = h == null ? "100%" : h;
    return new Paper(w, h);
}

// Version
Snap.version = "2.0.0";

// Export classes
Snap.Element = Element;
Snap.Paper = Paper;
Snap.Fragment = Fragment;

// Export utilities
Object.assign(Snap, mathUtils, colorUtils, typeUtils);

// Export main function as default
export default Snap;

// Named exports for tree-shaking
export { Element, Paper, Fragment };
export { mathUtils as math };
export { colorUtils as color };
export { typeUtils as utils };
```

## Example 5: Usage Comparison

### Before (Current)
```javascript
// Load via script tag
<script src="snap.svg.js"></script>
<script>
    var paper = Snap(800, 600);
    var circle = paper.circle(50, 50, 40);
    circle.attr({ fill: "#f00" });
</script>
```

### After (ES6 - UMD)
```javascript
// Still works the same way!
<script src="snap.svg.js"></script>
<script>
    var paper = Snap(800, 600);
    var circle = paper.circle(50, 50, 40);
    circle.attr({ fill: "#f00" });
</script>
```

### After (ES6 - Module Import)
```javascript
// Import everything
import Snap from 'snap.svg';
const paper = Snap(800, 600);
const circle = paper.circle(50, 50, 40);
circle.attr({ fill: "#f00" });

// Or import just what you need (tree-shaking!)
import { Paper, Element } from 'snap.svg';
const paper = new Paper(800, 600);
const circle = paper.circle(50, 50, 40);

// Or import utilities separately
import { rad, deg, angle } from 'snap.svg/math';
const angleInRad = rad(45);
```

## Example 6: Plugin System Migration

### Before (Current)
```javascript
Snap.plugin(function(Snap, Element, Paper, glob, Fragment, eve) {
    Element.prototype.highlight = function() {
        return this.attr({ fill: "yellow" });
    };
    
    Paper.prototype.square = function(x, y, size, attr) {
        return this.rect(x, y, size, size, attr);
    };
});
```

### After (ES6 - Option 1: Direct Extension)
```javascript
import { Element, Paper } from 'snap.svg';

Element.prototype.highlight = function() {
    return this.attr({ fill: "yellow" });
};

Paper.prototype.square = function(x, y, size, attr) {
    return this.rect(x, y, size, size, attr);
};
```

### After (ES6 - Option 2: ES6 Class Extension)
```javascript
import { Element as BaseElement, Paper as BasePaper } from 'snap.svg';

export class Element extends BaseElement {
    highlight() {
        return this.attr({ fill: "yellow" });
    }
}

export class Paper extends BasePaper {
    square(x, y, size, attr) {
        return this.rect(x, y, size, size, attr);
    }
}
```

### After (ES6 - Option 3: Backward Compatible)
```javascript
import Snap from 'snap.svg';

// Old plugin API still works!
Snap.plugin(function(Snap, Element, Paper, glob, Fragment, eve) {
    Element.prototype.highlight = function() {
        return this.attr({ fill: "yellow" });
    };
});
```
