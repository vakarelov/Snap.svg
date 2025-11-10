// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
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


/**
 * Snap.svg Equal Plugin
 *
 * Prepares SVG element attributes for animation by normalizing them into comparable from/to value pairs.
 * Handles multiple attribute types: colors, viewBox, transforms, paths, points, and numeric values.
 *
 * Entry Points:
 * 1. Element.prototype.equal(name, b) - Direct method on SVG elements
 * 2. eve(["snap","util","equal"], element, name, b) - Event-based access via eve event system
 */
Snap.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    var names = {},
        reUnit = /[%a-z]+$/i,
        Str = String;
    names.stroke = names.fill = "colour";

    /**
     * Returns default/empty transform values based on transform type
     * Used to pad missing transforms when comparing two transform arrays
     *
     * @param {Array} item - Transform array where item[0] is the transform type
     * @returns {Array} Default transform array with identity values:
     *   - "t" (translate): [t, 0, 0]
     *   - "m" (matrix): [m, 1, 0, 0, 1, 0, 0]
     *   - "r" (rotate): [r, 0, cx, cy] or [r, 0]
     *   - "s" (scale): [s, 1, 1, cx, cy] or [s, 1, 1] or [s, 1]
     */
    function getEmpty(item) {
        var l = item[0];
        switch (l.toLowerCase()) {
            case "t": return [l, 0, 0];
            case "m": return [l, 1, 0, 0, 1, 0, 0];
            case "r": if (item.length === 4) {
                return [l, 0, item[2], item[3]];
            } else {
                return [l, 0];
            }
            case "s": if (item.length === 5) {
                return [l, 1, 1, item[3], item[4]];
            } else if (item.length === 3) {
                return [l, 1, 1];
            } else {
                return [l, 1];
            }
        }
    }

    /**
     * Normalizes two transform strings into comparable from/to arrays
     * Converts incompatible transform types to matrix form for smooth animation
     *
     * @param {string|Array} t1 - First transform (string or parsed array)
     * @param {string|Array} t2 - Second transform (string or parsed array)
     * @param {Function} getBBox - Function to get element bounding box for transform context
     * @returns {Object} {from: Array, to: Array, f: Function}
     *   - from: Flattened numeric array of starting transform values
     *   - to: Flattened numeric array of ending transform values
     *   - f: Function to reconstruct transform string from animated values
     */
    function equaliseTransformString(t1, t2, getBBox) {
        t1 = typeof t1 == "string" && Snap.parseTransformString(t1) || [];
        t2 = typeof t2 == "string" && Snap.parseTransformString(t2) || [];
        var maxlength = Math.max(t1.length, t2.length),
            from = [],
            to = [],
            i = 0, j, jj,
            tt1, tt2;
        for (; i < maxlength; ++i) {
            tt1 = t1[i] || getEmpty(t2[i]);
            tt2 = t2[i] || getEmpty(tt1);
            if (tt1[0] !== tt2[0] ||
                tt1[0].toLowerCase() === "r" && (tt1[2] !== tt2[2] || tt1[3] !== tt2[3]) ||
                tt1[0].toLowerCase() === "s" && (tt1[3] !== tt2[3] || tt1[4] !== tt2[4])
                ) {
                    t1 = Snap._.transform2matrix(t1, getBBox());
                    t2 = Snap._.transform2matrix(t2, getBBox());
                    from = [["m", t1.a, t1.b, t1.c, t1.d, t1.e, t1.f]];
                    to = [["m", t2.a, t2.b, t2.c, t2.d, t2.e, t2.f]];
                    break;
            }
            from[i] = [];
            to[i] = [];
            for (j = 0, jj = Math.max(tt1.length, tt2.length); j < jj; j++) {
                j in tt1 && (from[i][j] = tt1[j]);
                j in tt2 && (to[i][j] = tt2[j]);
            }
        }
        return {
            from: path2array(from),
            to: path2array(to),
            f: getPath(from)
        };
    }

    /**
     * Equalizes two transform matrices, falling back to string-based equalization if needed
     *
     * @param {Snap.Matrix} t1 - First transform matrix
     * @param {Snap.Matrix} t2 - Second transform matrix
     * @param {Snap.Matrix} t1Matrix - First matrix representation
     * @param {Snap.Matrix} t2Matrix - Second matrix representation
     * @param {Function} getBBox - Function to get element bounding box
     * @returns {Object} {from: Array, to: Array, f: Function} Normalized transforms and reconstruction function
     */
    function equaliseTransform(t1, t2, t1Matrix, t2Matrix, getBBox) {
        t1 = t1 || new Snap.Matrix;
        t2 = t2 || new Snap.Matrix;
        var stringRes = equaliseTransformString(t1, t2, getBBox),
            matrixRes;
        if (stringRes.f([]).charAt() === "m") {
            matrixRes = equaliseTransformString(t1Matrix.toTransformString(), t2Matrix.toTransformString(), getBBox);
        }
        return matrixRes || stringRes;
    }

    /**
     * Returns numeric value as-is (identity formatter)
     * @param {number} val - Numeric value
     * @returns {number} The same value
     */
    function getNumber(val) {
        return val;
    }

    /**
     * Creates a formatter function for values with units
     * Formats numeric values with a unit suffix and fixed decimal places
     *
     * @param {string} unit - Unit suffix (e.g., "px", "%", "em")
     * @returns {Function} Function that formats numeric value with unit suffix to 3 decimal places
     */
    function getUnit(unit) {
        return function (val) {
            return +val.toFixed(3) + unit;
        };
    }

    /**
     * Formats viewBox array as space-separated string
     *
     * @param {Array} val - ViewBox array [x, y, width, height]
     * @returns {string} Space-separated viewBox string
     */
    function getViewBox(val) {
        return val.join(" ");
    }

    /**
     * Converts RGB/RGBA array to Snap color string
     *
     * @param {Array} clr - Color array [r, g, b, opacity]
     * @returns {string} Snap color string representation
     */
    function getColour(clr) {
        return Snap.rgb(clr[0], clr[1], clr[2], clr[3]);
    }

    /**
     * Generates a function that reconstructs transform/path strings from animated values
     * Creates a dynamic function that rebuilds the original structure from flattened value arrays
     *
     * @param {Array} path - Transform or path array structure
     * @returns {Function} Function that takes value array and returns reconstructed string
     */
    function getPath(path) {
        var k = 0, i, ii, j, jj, out, a, b = [];
        for (i = 0, ii = path.length; i < ii; ++i) {
            out = "[";
            a = ['"' + path[i][0] + '"'];
            for (j = 1, jj = path[i].length; j < jj; j++) {
                a[j] = "val[" + k++ + "]";
            }
            out += a + "]";
            b[i] = out;
        }
        return Function("val", "return Snap.path.toString.call([" + b + "])");
    }

    /**
     * Flattens nested transform/path arrays into single value array
     * Extracts all numeric values from nested command arrays, skipping command letters
     *
     * @param {Array} path - Nested transform or path array
     * @returns {Array} Flattened array of all numeric values (skips command letters at index 0)
     */
    function path2array(path) {
        var out = [];
        for (var i = 0, ii = path.length; i < ii; ++i) {
            for (var j = 1, jj = path[i].length; j < jj; j++) {
                out.push(path[i][j]);
            }
        }
        return out;
    }

    /**
     * Checks if value is a finite number
     *
     * @param {*} obj - Value to check
     * @returns {boolean} True if value is a finite number
     */
    function isNumeric(obj) {
        return isFinite(obj);
    }

    /**
     * Compares two arrays for equality
     *
     * @param {Array} arr1 - First array
     * @param {Array} arr2 - Second array
     * @returns {boolean} True if both are arrays and have identical string representations
     */
    function arrayEqual(arr1, arr2) {
        if (!Snap.is(arr1, "array") || !Snap.is(arr2, "array")) {
            return false;
        }
        return arr1.toString() === arr2.toString();
    }

    /**
     * Element.prototype.equal - Direct method entry point
     * Prepares an SVG element attribute for animation by delegating to the eve event system
     *
     * @param {string} name - Attribute name (e.g., "fill", "transform", "d")
     * @param {*} b - Target value for animation
     * @returns {Object} Animation data {from: Array, to: Array, f: Function}
     */
    Element.prototype.equal = function (name, b) {
        return eve(["snap","util","equal"], this, name, b).firstDefined();
    };

    /**
     * Event handler: snap.util.equal
     *
     * Main entry point via eve event system. Normalizes various SVG attribute types for animation.
     * Analyzes the attribute type and returns appropriate from/to values and formatter function.
     *
     * Supported attribute types:
     * - "fill", "stroke": Color values (RGB/RGBA)
     * - "viewBox": ViewBox coordinates
     * - "transform", "gradientTransform", "patternTransform": Transform matrices/strings
     * - "d", "path": SVG path data
     * - "points": Polygon/polyline points
     * - Numeric values: Direct numeric attributes
     * - Unit values: Values with units (px, %, em, etc.)
     *
     * @event snap.util.equal
     * @param {string} name - Attribute name to animate
     * @param {*} b - Target value
     * @returns {Object} {from: Array, to: Array, f: Function}
     *   - from: Starting values as array
     *   - to: Ending values as array
     *   - f: Formatter function to reconstruct attribute string from animated values
     */
    eve.on("snap.util.equal", function (name, b) {
        var A, B, a = Str(this.attr(name) || ""),
            el = this;
        if (names[name] === "colour") {
            A = Snap.color(a);
            B = Snap.color(b);
            return {
                from: [A.r, A.g, A.b, A.opacity],
                to: [B.r, B.g, B.b, B.opacity],
                f: getColour
            };
        }
        if (name === "viewBox") {
            A = this.attr(name).vb().split(" ").map(Number);
            B = b.split(" ").map(Number);
            return {
                from: A,
                to: B,
                f: getViewBox
            };
        }
        if (name === "transform" || name === "gradientTransform" || name === "patternTransform") {
            if (typeof b == "string") {
                b = Str(b).replace(/\.{3}|\u2026/g, a);
            }
            let bMatrix;
            if (!Snap._.rgTransform.test(b)) {
                bMatrix = Snap._.transform2matrix(Snap._.svgTransform2string(b), this.getBBox());
            } else {
                bMatrix = Snap._.transform2matrix(b, this.getBBox());
            }
            return equaliseTransform(a, b, this.matrix || Snap.matrix(), bMatrix, function () {
                return el.getBBox(true);
            });
        }
        if (name === "d" || name === "path") {
            A = Snap.path.toCubic(a, b);
            return {
                from: path2array(A[0]),
                to: path2array(A[1]),
                f: getPath(A[0])
            };
        }
        if (name === "points") {
            A = Str(a).split(Snap._.separator);
            B = Str(b).split(Snap._.separator);
            return {
                from: A,
                to: B,
                f: function (val) { return val; }
            };
        }
        if (isNumeric(a) && isNumeric(b)) {
            return {
                from: parseFloat(a),
                to: parseFloat(b),
                f: getNumber
            };
        }
        var aUnit = a.match(reUnit),
            bUnit = Str(b).match(reUnit);
        if (aUnit && arrayEqual(aUnit, bUnit)) {
            return {
                from: parseFloat(a),
                to: parseFloat(b),
                f: getUnit(aUnit)
            };
        } else {
            return {
                from: this.asPX(name),
                to: this.asPX(name, b),
                f: getNumber
            };
        }
    });
});
