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
            mmax = Math.max,
            mmin = Math.min,
            abs = Math.abs,
            pow = Math.pow,
            PI = Math.PI,
            round = Math.round,
            E = "";
        let S = " ";
        const objectToString = Object.prototype.toString;
        // const ISURL = /^url\(['"]?([^\)]+?)['"]?\)$/i;
        const colourRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?%?)\s*\))\s*$/i;
        // const bezierrg = /^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/;
        const separator = Snap._.separator = /[,\s]+/;
        // const whitespace = /[\s]/g;
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
                } else if ("text" in attr) {
                    el.nodeValue = attr.text;
                }
            } else {
                const tag = el.toLowerCase();
                if (svgTags[has](tag)) {
                    el = glob.doc.createElementNS(xmlns, el);
                } else {
                    el = glob.doc.createElement(el);
                }
            }
            return el;
        }

        Snap._.$ = $;
        Snap._.id = ID;

        /**
         * Extracts all attributes from a DOM element
         * @function getAttrs
         * @private
         * @param {Element} el - DOM element to extract attributes from
         * @returns {Object} Object containing all attributes as key-value pairs
         */
        function getAttrs(el) {
            const attrs = el.attributes;
            let name;
            const out = {};
            for (let i = 0; i < attrs.length; ++i) {
                if (attrs[i].namespaceURI === xlink) {
                    name = "xlink:";
                } else {
                    name = "";
                }
                name += attrs[i].name;
                out[name] = attrs[i].textContent;
            }
            return out;
        }

        let available_types = {
            "element": Element,
            "paper": Paper,
            "fragment": Fragment
        };
        if (root.mina) available_types.animation = root.mina.Animation;

        /**
         * Type checking utility function
         * @function is
         * @private
         * @param {*} o - Object to check type of
         * @param {string} type - Type to check against ('finite', 'array', 'object', etc.)
         * @returns {boolean} True if object is of specified type
         */
        function is(o, type) {
            type = Str.prototype.toLowerCase.call(type);
            if (type === "finite") {
                return isFinite(o);
            }
            if (type === "array" &&
                (o instanceof Array || Array.isArray && Array.isArray(o))) {
                return true;
            }
            if (type === "svgelement") {
                const name = o.constructor && o.constructor.name;
                return o instanceof SVGElement ||
                    (name && name.startsWith("SVG") && name.endsWith("Element"));
            }
            return type === "null" && o == null ||
                type === typeof o && o !== null ||
                type === "object" && o === Object(o) ||
                available_types.hasOwnProperty(type) && o instanceof available_types[type] ||
                objectToString.call(o).slice(8, -1).toLowerCase() === type;
        }

        /**
         * Performs simple token replacement on strings using `{token}` placeholders.
         *
         * @function Snap.format
         * @memberof Snap
         * @param {string} token Template string containing `{name}` placeholders.
         * @param {Object} json Object whose properties are used as replacements.
         * @returns {string} Formatted string.
         * @example
         * const path = Snap.format("M{x},{y}h{width}v{height}h{negWidth}z", {
         *   x: 10,
         *   y: 20,
         *   width: 40,
         *   height: 50,
         *   negWidth: -40
         * });
         */
        Snap.format = (function () {
            const tokenRegex = /\{([^\}]+)\}/g,
                objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g, // matches .xxxxx or ["xxxxx"] to run over object properties
                replacer = function (all, key, obj) {
                    let res = obj;
                    key.replace(objNotationRegex,
                        function (all, name, quote, quotedName, isFunc) {
                            name = name || quotedName;
                            if (res) {
                                if (name in res) {
                                    res = res[name];
                                }
                                typeof res === "function" && isFunc && (res = res());
                            }
                        });
                    res = (res == null || res === obj ? all : res) + "";
                    return res;
                };
            return function (str, obj) {
                return Str(str).replace(tokenRegex, function (all, key) {
                    return replacer(all, key, obj);
                });
            };
        })();

        /**
         * Deep clone utility function for objects
         * @function clone
         * @private
         * @param {*} obj - Object to clone
         * @returns {*} Deep clone of the input object
         */
        function clone(obj) {
            if (typeof obj === "function" || Object(obj) !== obj) {
                return obj;
            }
            const res = new obj.constructor;
            for (let key in obj) if (obj[has](key)) {
                res[key] = clone(obj[key]);
            }
            return res;
        }

        Snap._.clone = clone;

        /**
         * Removes an item from array and pushes it to the end
         * @function repush
         * @private
         * @param {Array} array - Array to manipulate
         * @param {*} item - Item to move to end
         * @returns {*} The moved item
         */
        function repush(array, item) {
            let i = 0;
            const ii = array.length;
            for (; i < ii; ++i) if (array[i] === item) {
                return array.push(array.splice(i, 1)[0]);
            }
        }

        /**
         * Creates a caching wrapper for function results
         * @function cacher
         * @private
         * @param {Function} f - Function to cache results for
         * @param {Object} scope - Scope to apply to function
         * @param {Function} postprocessor - Optional postprocessing function
         * @returns {Function} Cached version of the function
         */
        function cacher(f, scope, postprocessor) {
            function newf() {
                const arg = Array.prototype.slice.call(arguments, 0),
                    args = arg.join("\u2400"),
                    cache = newf.cache = newf.cache || {},
                    count = newf.count = newf.count || [];
                if (cache[has](args)) {
                    repush(count, args);
                    return postprocessor ? postprocessor(cache[args]) : cache[args];
                }
                count.length >= 1e3 && delete cache[count.shift()];
                count.push(args);
                cache[args] = f.apply(scope, arg);
                return postprocessor ? postprocessor(cache[args]) : cache[args];
            }

            return newf;
        }

        Snap._.cacher = cacher;

        /**
         * Calculates angle between three points or vectors
         * @function angle
         * @private
         * @param {number|Object} x1 - X coordinate of first point or point object
         * @param {number|Object} y1 - Y coordinate of first point or point object
         * @param {number} x2 - X coordinate of second point
         * @param {number} y2 - Y coordinate of second point
         * @param {number} x3 - X coordinate of third point
         * @param {number} y3 - Y coordinate of third point
         * @returns {number} Angle in degrees
         */
        function angle(x1, y1, x2, y2, x3, y3) {
            if (typeof x2 === "object") {
                x3 = x2.x || x2[0] || 0;
                y3 = x2.y || x2[1] || 0;
            }
            if (typeof y1 === "object") {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == "object") {
                y1 = x1.y || x1[1] || 0;
                x1 = x1.x || x1[0] || 0;
            }
            if (x2 == null) {
                x2 = y2 = 0;
            }
            if (x3 == null) {
                const x = x1 - x2,
                    y = y1 - y2;
                if (!x && !y) {
                    return 0;
                }
                return (180 + Math.atan2(-y, -x) * 180 / PI + 360) % 360;
            } else {
                return angle(x1, y1, x3, y3) - angle(x2, y2, x3, y3);
            }
        }

        /**
         * Converts degrees to radians
         * @function rad
         * @private
         * @param {number} deg - Degrees to convert
         * @returns {number} Radians
         */
        function rad(deg) {
            return deg % 360 * PI / 180;
        }

        /**
         * Converts radians to degrees
         * @function deg
         * @private
         * @param {number} rad - Radians to convert
         * @returns {number} Degrees
         */
        function deg(rad) {
            return rad * 180 / PI % 360;
        }

        /**
         * Returns string representation of x,y coordinates
         * @function x_y
         * @private
         * @returns {string} "x y" coordinate string
         */
        function x_y() {
            return this.x + S + this.y;
        }

        /**
         * Returns string representation of x,y,width,height
         * @function x_y_w_h
         * @private
         * @returns {string} "x y width × height" string
         */
        function x_y_w_h() {
            return this.x + S + this.y + S + this.width + " \xd7 " + this.height;
        }

        /**
         * Converts degrees to radians.
         *
         * @function Snap.rad
         * @memberof Snap
         * @param {number} deg Angle in degrees.
         * @returns {number} Angle in radians.
         */
        Snap.rad = rad;
        /**
         * Converts radians to degrees.
         *
         * @function Snap.deg
         * @memberof Snap
         * @param {number} rad Angle in radians.
         * @returns {number} Angle in degrees.
         */
        Snap.deg = deg;
        /**
         * Calculates the sine of an angle specified in degrees.
         *
         * @function Snap.sin
         * @memberof Snap
         * @param {number} angle Angle in degrees.
         * @returns {number} Sine of the angle.
         */
        Snap.sin = function (angle) {
            return Math.sin(Snap.rad(angle));
        };
        /**
         * Calculates the tangent of an angle specified in degrees.
         *
         * @function Snap.tan
         * @memberof Snap
         * @param {number} angle Angle in degrees.
         * @returns {number} Tangent of the angle.
         */
        Snap.tan = function (angle) {
            return Math.tan(Snap.rad(angle));
        };
        /**
         * Calculates the cotangent of an angle specified in degrees.
         *
         * @function Snap.cot
         * @memberof Snap
         * @param {number} angle Angle in degrees.
         * @returns {number} Cotangent of the angle.
         */
        Snap.cot = function (angle) {
            return 1 / Snap.tan(angle);
        };
        /**
         * Calculates the cosine of an angle specified in degrees.
         *
         * @function Snap.cos
         * @memberof Snap
         * @param {number} angle Angle in degrees.
         * @returns {number} Cosine of the angle.
         */
        Snap.cos = function (angle) {
            return Math.cos(Snap.rad(angle));
        };
        /**
         * Snap.asin @method
         *
         * Equivalent to `Math.asin()` only works with degrees, not radians.
         * @param {number} num - value
         * @returns {number} asin in degrees
         */
        Snap.asin = function (num) {
            return Snap.deg(Math.asin(num));
        };
        /**
         * Snap.acos @method
         *
         * Equivalent to `Math.acos()` only works with degrees, not radians.
         * @param {number} num - value
         * @returns {number} acos in degrees
         */
        Snap.acos = function (num) {
            return Snap.deg(Math.acos(num));
        };
        /**
         * Snap.atan @method
         *
         * Equivalent to `Math.atan()` only works with degrees, not radians.
         * @param {number} num - value
         * @returns {number} atan in degrees
         */
        Snap.atan = function (num) {
            return Snap.deg(Math.atan(num));
        };
        /**
         * Snap.atan2 @method
         *
         * Equivalent to `Math.atan2()` only works with degrees, not radians.
         * @param {number} num - value
         * @returns {number} atan2 in degrees
         */
        Snap.atan2 = function (num) {
            return Snap.deg(Math.atan2(num));
        };
        /**
         * Snap.angle @method
         *
         * Returns an angle between two or three points
         * @param {number} x1 - x coord of first point
         * @param {number} y1 - y coord of first point
         * @param {number} x2 - x coord of second point
         * @param {number} y2 - y coord of second point
         * @param {number} x3 - #optional x coord of third point
         * @param {number} y3 - #optional y coord of third point
         * @returns {number} angle in degrees
         */
        Snap.angle = angle;
        /**
         * Snap.len @method
         *
         * Returns distance between two points
         * @param {number} x1 - x coord of first point
         * @param {number} y1 - y coord of first point
         * @param {number} x2 - x coord of second point
         * @param {number} y2 - y coord of second point
         * @returns {number} distance
         */
        Snap.len = function (x1, y1, x2, y2) {
            return Math.sqrt(Snap.len2(x1, y1, x2, y2));
        };
        /**
         * Snap.len2 @method
         *
         * Returns squared distance between two points
         * @param {number} x1 - x coord of first point
         * @param {number} y1 - y coord of first point
         * @param {number} x2 - x coord of second point
         * @param {number} y2 - y coord of second point
         * @returns {number} distance
         */
        Snap.len2 = function (x1, y1, x2, y2) {
            if (typeof y1 === "object") {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == "object") {
                y1 = x1.y || x1[1] || 0;
                x1 = x1.x || x1[0] || 0;
            }
            x2 = x2 || 0;
            y2 = y2 || 0;
            return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
        };
        /**
         * Snap.closestPoint @method
         *
         * Returns closest point to a given one on a given path.
         * @param {Element} path - path element
         * @param {number} x - x coord of a point
         * @param {number} y - y coord of a point
         * @returns {object} in format
         {
         x (number) x coord of the point on the path
         y (number) y coord of the point on the path
         length (number) length of the path to the point
         distance (number) distance from the given point to the path
         }
         */
// Copied from http://bl.ocks.org/mbostock/8027637
        Snap.closestPoint = function (path, x, y) {
            function distance2(p) {
                const dx = p.x - x,
                    dy = p.y - y;
                return dx * dx + dy * dy;
            }

            const pathNode = path.node,
                pathLength = pathNode.getTotalLength(),
                numSegments = path.getNumberPathSegments();
            let precision = pathLength / numSegments * .125,
                best,
                bestLength,
                bestDistance = Infinity;

            // linear scan for coarse approximation
            let scan, scanLength = 0, scanDistance;
            for (; scanLength <=
                   pathLength; scanLength += precision) {
                if ((scanDistance = distance2(
                    scan = pathNode.getPointAtLength(scanLength))) < bestDistance) {
                    best = scan;
                    bestLength = scanLength;
                    bestDistance = scanDistance;
                }
            }

            // binary search for precise estimate
            precision *= .5;
            while (precision > .5) {
                let before,
                    after,
                    beforeLength,
                    afterLength,
                    beforeDistance,
                    afterDistance;
                if ((beforeLength = bestLength - precision) >= 0 &&
                    (beforeDistance = distance2(
                        before = pathNode.getPointAtLength(beforeLength))) <
                    bestDistance) {
                    best = before;
                    bestLength = beforeLength;
                    bestDistance = beforeDistance;
                } else if ((afterLength = bestLength + precision) <= pathLength &&
                    (afterDistance = distance2(
                        after = pathNode.getPointAtLength(afterLength))) <
                    bestDistance) {
                    best = after;
                    bestLength = afterLength;
                    bestDistance = afterDistance;
                } else {
                    precision *= .5;
                }
            }

            best = {
                x: best.x,
                y: best.y,
                length: bestLength,
                distance: Math.sqrt(bestDistance),
            };
            return best;
        };
        /**
         * Snap.is @method
         *
         * Handy replacement for the `typeof` operator
         * @param {...any} o - any object or primitive
         * @param {string} type - name of the type, e.g., `string`, `function`, `number`, etc.
         * @returns {boolean} `true` if given value is of given type
         */
        Snap.is = is;


        Snap.registerType = function (type, type_constr) {
            type = type.toLowerCase();
            available_types[type] = type_constr;
        }

        Snap.registerClass = Snap.registerType;

        Snap.getClass = function (type) {
            return available_types[type.toLowerCase()]
        }

        /**
         * Snap.snapTo @method
         *
         * Snaps given value to given grid
         * @param {array|number} values - given array of values or step of the grid
         * @param {number} value - value to adjust
         * @param {number} tolerance - #optional maximum distance to the target value that would trigger the snap. Default is `10`.
         * @returns {number} adjusted value
         */
        Snap.snapTo = function (values, value, tolerance) {
            tolerance = is(tolerance, "finite") ? tolerance : 10;
            if (is(values, "array")) {
                let i = values.length;
                while (i--) if (abs(values[i] - value) <= tolerance) {
                    return values[i];
                }
            } else {
                values = +values;
                const rem = value % values;
                if (rem < tolerance) {
                    return value - rem;
                }
                if (rem > values - tolerance) {
                    return value - rem + values;
                }
            }
            return value;
        };
// Colour
        /**
         * Snap.getRGB @method
         *
         * Parses color string as RGB object
         * @param {string} color - color string in one of the following formats:
         # <ul>
         #     <li>Color name (<code>red</code>, <code>green</code>, <code>cornflowerblue</code>, etc)</li>
         #     <li>#••• — shortened HTML color: (<code>#000</code>, <code>#fc0</code>, etc.)</li>
         #     <li>#•••••• — full length HTML color: (<code>#000000</code>, <code>#bd2300</code>)</li>
         #     <li>rgb(•••, •••, •••) — red, green and blue channels values: (<code>rgb(200,&nbsp;100,&nbsp;0)</code>)</li>
         #     <li>rgba(•••, •••, •••, •••) — also with opacity</li>
         #     <li>rgb(•••%, •••%, •••%) — same as above, but in %: (<code>rgb(100%,&nbsp;175%,&nbsp;0%)</code>)</li>
         #     <li>rgba(•••%, •••%, •••%, •••%) — also with opacity</li>
         #     <li>hsb(•••, •••, •••) — hue, saturation and brightness values: (<code>hsb(0.5,&nbsp;0.25,&nbsp;1)</code>)</li>
         #     <li>hsba(•••, •••, •••, •••) — also with opacity</li>
         #     <li>hsb(•••%, •••%, •••%) — same as above, but in %</li>
         #     <li>hsba(•••%, •••%, •••%, •••%) — also with opacity</li>
         #     <li>hsl(•••, •••, •••) — hue, saturation and luminosity values: (<code>hsb(0.5,&nbsp;0.25,&nbsp;0.5)</code>)</li>
         #     <li>hsla(•••, •••, •••, •••) — also with opacity</li>
         #     <li>hsl(•••%, •••%, •••%) — same as above, but in %</li>
         #     <li>hsla(•••%, •••%, •••%, •••%) — also with opacity</li>
         # </ul>
         * Note that `%` can be used any time: `rgb(20%, 255, 50%)`.
         * @returns {object} RGB object in the following format:
         o {
         o     r (number) red,
         o     g (number) green,
         o     b (number) blue,
         o     hex (string) color in HTML/CSS format: #••••••,
         o     error (boolean) true if string can't be parsed
         o }
         */
        Snap.getRGB = cacher(function (colour) {
            if (!colour || !!((colour = Str(colour)).indexOf("-") + 1)) {
                return {
                    r: -1,
                    g: -1,
                    b: -1,
                    hex: "none",
                    error: 1,
                    toString: rgbtoString,
                };
            }
            if (colour === "none") {
                return {r: -1, g: -1, b: -1, hex: "none", toString: rgbtoString};
            }
            !(hsrg[has](colour.toLowerCase().substring(0, 2)) || colour.charAt() ===
                "#") && (colour = toHex(colour));
            if (!colour) {
                return {
                    r: -1,
                    g: -1,
                    b: -1,
                    hex: "none",
                    error: 1,
                    toString: rgbtoString,
                };
            }
            let res,
                red,
                green,
                blue,
                opacity,
                t,
                values,
                rgb = colour.match(colourRegExp);
            if (rgb) {
                if (rgb[2]) {
                    blue = toInt(rgb[2].substring(5), 16);
                    green = toInt(rgb[2].substring(3, 5), 16);
                    red = toInt(rgb[2].substring(1, 3), 16);
                }
                if (rgb[3]) {
                    blue = toInt((t = rgb[3].charAt(3)) + t, 16);
                    green = toInt((t = rgb[3].charAt(2)) + t, 16);
                    red = toInt((t = rgb[3].charAt(1)) + t, 16);
                }
                if (rgb[4]) {
                    values = rgb[4].split(commaSpaces);
                    red = toFloat(values[0]);
                    values[0].slice(-1) === "%" && (red *= 2.55);
                    green = toFloat(values[1]);
                    values[1].slice(-1) === "%" && (green *= 2.55);
                    blue = toFloat(values[2]);
                    values[2].slice(-1) === "%" && (blue *= 2.55);
                    rgb[1].toLowerCase().slice(0, 4) === "rgba" &&
                    (opacity = toFloat(values[3]));
                    values[3] && values[3].slice(-1) === "%" && (opacity /= 100);
                }
                if (rgb[5]) {
                    values = rgb[5].split(commaSpaces);
                    red = toFloat(values[0]);
                    values[0].slice(-1) === "%" && (red /= 100);
                    green = toFloat(values[1]);
                    values[1].slice(-1) === "%" && (green /= 100);
                    blue = toFloat(values[2]);
                    values[2].slice(-1) === "%" && (blue /= 100);
                    (values[0].slice(-3) === "deg" || values[0].slice(-1) === "\xb0") &&
                    (red /= 360);
                    rgb[1].toLowerCase().slice(0, 4) === "hsba" &&
                    (opacity = toFloat(values[3]));
                    values[3] && values[3].slice(-1) === "%" && (opacity /= 100);
                    return Snap.hsb2rgb(red, green, blue, opacity);
                }
                if (rgb[6]) {
                    values = rgb[6].split(commaSpaces);
                    red = toFloat(values[0]);
                    values[0].slice(-1) === "%" && (red /= 100);
                    green = toFloat(values[1]);
                    values[1].slice(-1) === "%" && (green /= 100);
                    blue = toFloat(values[2]);
                    values[2].slice(-1) === "%" && (blue /= 100);
                    (values[0].slice(-3) === "deg" || values[0].slice(-1) === "\xb0") &&
                    (red /= 360);
                    rgb[1].toLowerCase().slice(0, 4) === "hsla" &&
                    (opacity = toFloat(values[3]));
                    values[3] && values[3].slice(-1) === "%" && (opacity /= 100);
                    return Snap.hsl2rgb(red, green, blue, opacity);
                }
                red = mmin(Math.round(red), 255);
                green = mmin(Math.round(green), 255);
                blue = mmin(Math.round(blue), 255);
                opacity = mmin(mmax(opacity, 0), 1);
                rgb = {r: red, g: green, b: blue, toString: rgbtoString};
                rgb.hex = "#" +
                    (16777216 | blue | green << 8 | red << 16).toString(16).slice(1);
                rgb.opacity = is(opacity, "finite") ? opacity : 1;
                return rgb;
            }
            return {
                r: -1,
                g: -1,
                b: -1,
                hex: "none",
                error: 1,
                toString: rgbtoString,
            };
        }, Snap);
        /**
         * Snap.hsb @method
         *
         * Converts HSB values to a hex representation of the color
         * @param {number} h - hue
         * @param {number} s - saturation
         * @param {number} b - value or brightness
         * @returns {string} hex representation of the color
         */
        Snap.hsb = cacher(function (h, s, b) {
            return Snap.hsb2rgb(h, s, b).hex;
        });
        /**
         * Snap.hsl @method
         *
         * Converts HSL values to a hex representation of the color
         * @param {number} h - hue
         * @param {number} s - saturation
         * @param {number} l - luminosity
         * @returns {string} hex representation of the color
         */
        Snap.hsl = cacher(function (h, s, l) {
            return Snap.hsl2rgb(h, s, l).hex;
        });
        /**
         * Snap.rgb @method
         *
         * Converts RGB values to a hex representation of the color
         * @param {number} r - red
         * @param {number} g - green
         * @param {number} b - blue
         * @returns {string} hex representation of the color
         */
        Snap.rgb = cacher(function (r, g, b, o) {
            if (is(o, "finite")) {
                const round = Math.round;
                return "rgba(" + [round(r), round(g), round(b), +o.toFixed(2)] + ")";
            }
            return "#" + (16777216 | b | g << 8 | r << 16).toString(16).slice(1);
        });
        var toHex = function (color) {
                const i = glob.doc.getElementsByTagName("head")[0] ||
                        glob.doc.getElementsByTagName("svg")[0],
                    red = "rgb(255, 0, 0)";
                toHex = cacher(function (color) {
                    if (color.toLowerCase() === "red") {
                        return red;
                    }
                    i.style.color = red;
                    i.style.color = color;
                    const out = glob.doc.defaultView.getComputedStyle(i, E).getPropertyValue("color");
                    return out === red ? null : out;
                });
                return toHex(color);
            },
            hsbtoString = function () {
                return "hsb(" + [this.h, this.s, this.b] + ")";
            },
            hsltoString = function () {
                return "hsl(" + [this.h, this.s, this.l] + ")";
            },
            rgbtoString = function () {
                return this.opacity === 1 || this.opacity == null ?
                    this.hex :
                    "rgba(" + [this.r, this.g, this.b, this.opacity] + ")";
            },
            prepareRGB = function (r, g, b) {
                if (g == null && is(r, "object") && "r" in r && "g" in r && "b" in
                    r) {
                    b = r.b;
                    g = r.g;
                    r = r.r;
                }
                if (g == null && is(r, string)) {
                    const clr = Snap.getRGB(r);
                    r = clr.r;
                    g = clr.g;
                    b = clr.b;
                }
                if (r > 1 || g > 1 || b > 1) {
                    r /= 255;
                    g /= 255;
                    b /= 255;
                }

                return [r, g, b];
            },
            packageRGB = function (r, g, b, o) {
                r = Math.round(r * 255);
                g = Math.round(g * 255);
                b = Math.round(b * 255);
                const rgb = {
                    r: r,
                    g: g,
                    b: b,
                    opacity: is(o, "finite") ? o : 1,
                    hex: Snap.rgb(r, g, b),
                    toString: rgbtoString,
                };
                is(o, "finite") && (rgb.opacity = o);
                return rgb;
            };
        /**
         * Snap.color @method
         *
         * Parses the color string and returns an object featuring the color's component values
         * @param {string} clr - color string in one of the supported formats (see @Snap.getRGB)
         * @returns {object} Combined RGB/HSB object in the following format:
         o {
         o     r (number) red,
         o     g (number) green,
         o     b (number) blue,
         o     hex (string) color in HTML/CSS format: #••••••,
         o     error (boolean) `true` if string can't be parsed,
         o     h (number) hue,
         o     s (number) saturation,
         o     v (number) value (brightness),
         o     l (number) lightness
         o }
         */
        Snap.color = function (clr) {
            let rgb;
            if (is(clr, "object") && "h" in clr && "s" in clr && "b" in clr) {
                rgb = Snap.hsb2rgb(clr);
                clr.r = rgb.r;
                clr.g = rgb.g;
                clr.b = rgb.b;
                clr.opacity = 1;
                clr.hex = rgb.hex;
            } else if (is(clr, "object") && "h" in clr && "s" in clr && "l" in
                clr) {
                rgb = Snap.hsl2rgb(clr);
                clr.r = rgb.r;
                clr.g = rgb.g;
                clr.b = rgb.b;
                clr.opacity = 1;
                clr.hex = rgb.hex;
            } else {
                if (is(clr, "string")) {
                    clr = Snap.getRGB(clr);
                }
                if (is(clr, "object") && "r" in clr && "g" in clr && "b" in clr &&
                    !("error" in clr)) {
                    rgb = Snap.rgb2hsl(clr);
                    clr.h = rgb.h;
                    clr.s = rgb.s;
                    clr.l = rgb.l;
                    rgb = Snap.rgb2hsb(clr);
                    clr.v = rgb.b;
                    clr.sv = rgb.s;
                } else {
                    clr = {hex: "none"};
                    clr.r = clr.g = clr.b = clr.h = clr.s = clr.v = clr.l = clr.sv = -1;
                    clr.error = 1;
                }
            }
            clr.toString = rgbtoString;
            return clr;
        };
        /**
         * Snap.hsb2rgb @method
         *
         * Converts HSB values to an RGB object
         * @param {number} h - hue
         * @param {number} s - saturation
         * @param {number} v - value or brightness
         * @returns {object} RGB object in the following format:
         o {
         o     r (number) red,
         o     g (number) green,
         o     b (number) blue,
         o     hex (string) color in HTML/CSS format: #••••••
         o }
         */
        Snap.hsb2rgb = function (h, s, v, o) {
            if (is(h, "object") && "h" in h && "s" in h && "b" in h) {
                v = h.b;
                s = h.s;
                o = h.o;
                h = h.h;
            }
            h *= 360;
            let R, G, B, X, C;
            h = h % 360 / 60;
            C = v * s;
            X = C * (1 - abs(h % 2 - 1));
            R = G = B = v - C;

            h = ~~h;
            R += [C, X, 0, 0, X, C][h];
            G += [X, C, C, X, 0, 0][h];
            B += [0, 0, X, C, C, X][h];
            return packageRGB(R, G, B, o);
        };
        /**
         * Snap.hsl2rgb @method
         *
         * Converts HSL values to an RGB object
         * @param {number} h - hue
         * @param {number} s - saturation
         * @param {number} l - luminosity
         * @returns {object} RGB object in the following format:
         o {
         o     r (number) red,
         o     g (number) green,
         o     b (number) blue,
         o     hex (string) color in HTML/CSS format: #••••••
         o }
         */
        Snap.hsl2rgb = function (h, s, l, o) {
            if (is(h, "object") && "h" in h && "s" in h && "l" in h) {
                l = h.l;
                s = h.s;
                h = h.h;
            }
            if (h > 1) h /= 360;
            if (s > 1) s /= 100;
            if (l > 1) l /= 100;
            h *= 360;
            let R, G, B, X, C;
            h = h % 360 / 60;
            C = 2 * s * (l < .5 ? l : 1 - l);
            X = C * (1 - abs(h % 2 - 1));
            R = G = B = l - C / 2;

            h = ~~h;
            R += [C, X, 0, 0, X, C][h];
            G += [X, C, C, X, 0, 0][h];
            B += [0, 0, X, C, C, X][h];
            return packageRGB(R, G, B, o);
        };
        /**
         * Snap.rgb2hsb @method
         *
         * Converts RGB values to an HSB object
         * @param {number} r - red
         * @param {number} g - green
         * @param {number} b - blue
         * @returns {object} HSB object in the following format:
         o {
         o     h (number) hue,
         o     s (number) saturation,
         o     b (number) brightness
         o }
         */
        Snap.rgb2hsb = function (r, g, b) {
            b = prepareRGB(r, g, b);
            r = b[0];
            g = b[1];
            b = b[2];

            let H, S, V, C;
            V = mmax(r, g, b);
            C = V - mmin(r, g, b);
            H = C === 0 ? null :
                V === r ? (g - b) / C :
                    V === g ? (b - r) / C + 2 :
                        (r - g) / C + 4;
            H = (H + 360) % 6 * 60 / 360;
            S = C === 0 ? 0 : C / V;
            return {h: H, s: S, b: V, toString: hsbtoString};
        };
        /**
         * Snap.rgb2hsl @method
         *
         * Converts RGB values to an HSL object
         * @param {number} r - red
         * @param {number} g - green
         * @param {number} b - blue
         * @returns {object} HSL object in the following format:
         o {
         o     h (number) hue,
         o     s (number) saturation,
         o     l (number) luminosity
         o }
         */
        Snap.rgb2hsl = function (r, g, b) {
            b = prepareRGB(r, g, b);
            r = b[0];
            g = b[1];
            b = b[2];

            let H, S, L, M, m, C;
            M = mmax(r, g, b);
            m = mmin(r, g, b);
            C = M - m;
            H = C === 0 ? null :
                M === r ? (g - b) / C :
                    M === g ? (b - r) / C + 2 :
                        (r - g) / C + 4;
            H = (H + 360) % 6 * 60 / 360;
            L = (M + m) / 2;
            S = C === 0 ? 0 :
                L < .5 ? C / (2 * L) :
                    C / (2 - 2 * L);
            return {h: H, s: S, l: L, toString: hsltoString};
        };

// Transformations
        /**
         * Snap.parsePathString @method
         *
         * Utility method
         *
         * Parses given path string into an array of arrays of path segments
         * @param {string|array} pathString - path string or array of segments (in the last case it is returned straight away)
         * @returns {array} array of segments
         */
        Snap.parsePathString = function (pathString) {
            if (!pathString) {
                return null;
            }
            const pth = Snap.path(pathString);
            if (pth.arr) {
                return Snap.path.clone(pth.arr);
            }

            const paramCounts = {
                a: 7,
                c: 6,
                o: 2,
                h: 1,
                l: 2,
                m: 2,
                r: 4,
                q: 4,
                s: 4,
                t: 2,
                v: 1,
                u: 3,
                z: 0,
            };
            let data = [];
            if (is(pathString, "array") && is(pathString[0], "array")) { // rough assumption
                data = Snap.path.clone(pathString);
            }
            if (!data.length) {
                Str(pathString).replace(pathCommand, function (a, b, c) {
                    const params = [];
                    let name = b.toLowerCase();
                    c.replace(pathValues, function (a, b) {
                        b && params.push(+b);
                    });
                    if (name === "m" && params.length > 2) {
                        data.push([b].concat(params.splice(0, 2)));
                        name = "l";
                        b = b === "m" ? "l" : "L";
                    }
                    if (name === "o" && params.length === 1) {
                        data.push([b, params[0]]);
                    }
                    if (name === "r") {
                        data.push([b].concat(params));
                    } else while (params.length >= paramCounts[name]) {
                        data.push([b].concat(params.splice(0, paramCounts[name])));
                        if (!paramCounts[name]) {
                            break;
                        }
                    }
                });
            }
            data.toString = Snap.path.toString;
            pth.arr = Snap.path.clone(data);
            return data;
        };
        /**
         * Snap.parseTransformString @method
         *
         * Utility method
         *
         * Parses given transform string into an array of transformations
         * @param {string|array} TString - transform string or array of transformations (in the last case it is returned straight away)
         * @returns {array} array of transformations
         */
        const parseTransformString = Snap.parseTransformString = function (TString) {
            if (!TString) {
                return null;
            }
            const paramCounts = {r: 3, s: 4, t: 2, m: 6};
            let data = [];
            if (is(TString, "array") && is(TString[0], "array")) { // rough assumption
                data = Snap.path.clone(TString);
            }
            if (!data.length) {
                Str(TString).replace(tSrtToRemove, "").replace(tCommand, function (a, b, c) {
                    const params = [],
                        name = b.toLowerCase();
                    c.replace(pathValues, function (a, b) {
                        b && params.push(+b);
                    });
                    data.push([b].concat(params));
                });
            }
            data.toString = Snap.path.toString;
            return data;
        };

        /**
         * Converts SVG transform string to normalized string format
         * @function svgTransform2string
         * @private
         * @param {string} tstr - SVG transform string
         * @returns {string} Normalized transform string
         */
        function svgTransform2string(tstr) {
            const res = [];
            tstr = tstr.replace(/(?:^|\s)(\w+)\(([^)]+)\)/g,
                function (all, name, params) {
                    params = params.split(/\s*,\s*|\s+/);
                    if (name === "rotate" && params.length === 1) {
                        params.push(0, 0);
                    }
                    if (name === "scale") {
                        if (params.length > 2) {
                            params = params.slice(0, 2);
                        } else if (params.length === 2) {
                            params.push(0, 0);
                        }
                        if (params.length === 1) {
                            params.push(params[0], 0, 0);
                        }
                    }
                    if (name === "skewX") {
                        res.push(["m", 1, 0, Math.tan(rad(params[0])), 1, 0, 0]);
                    } else if (name === "skewY") {
                        res.push(["m", 1, Math.tan(rad(params[0])), 0, 1, 0, 0]);
                    } else {
                        res.push([name.charAt(0)].concat(params));
                    }
                    return all;
                });
            return res;
        }

        Snap._.svgTransform2string = svgTransform2string;
        Snap._.rgTransform = /^[a-z][\s]*-?\.?\d/i;

        /**
         * Converts transform string to transformation matrix
         * @function transform2matrix
         * @private
         * @param {string} tstr - Transform string
         * @param {Element} el - Element being transformed
         * @param {boolean} without_transform - Whether to exclude current transform
         * @returns {Snap.Matrix} Transformation matrix
         */
        function transform2matrix(tstr, el, without_transform) {
            const tdata = parseTransformString(tstr),
                m = new Snap.Matrix;
            if (tdata) {
                let x1,
                    y1,
                    x2,
                    y2,
                    bb;
                if (typeof el === "object" && !(el instanceof Element)) {
                    bb = el;
                }
                let i = 0;
                const ii = tdata.length;
                for (; i < ii; ++i) {
                    let t = tdata[i],
                        tlen = t.length,
                        command = Str(t[0]).toLowerCase(),
                        absolute = t[0] !== command,
                        inver = absolute ? m.invert() : 0;
                    if (command === "t" && tlen === 2) {
                        m.translate(t[1], 0);
                    } else if (command === "t" && tlen === 3) {
                        if (absolute) {
                            x1 = inver.x(0, 0);
                            y1 = inver.y(0, 0);
                            x2 = inver.x(t[1], t[2]);
                            y2 = inver.y(t[1], t[2]);
                            m.translate(x2 - x1, y2 - y1);
                        } else {
                            m.translate(t[1], t[2]);
                        }
                    } else if (command === "r") {
                        if (tlen === 2) {
                            bb = bb || el.getBBoxExact(without_transform);
                            m.rotate(t[1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                        } else if (tlen === 4) {
                            if (absolute) {
                                x2 = inver.x(t[2], t[3]);
                                y2 = inver.y(t[2], t[3]);
                                m.rotate(t[1], x2, y2);
                            } else {
                                m.rotate(t[1], t[2], t[3]);
                            }
                        }
                    } else if (command === "s") {
                        if (tlen === 2 || tlen === 3) {
                            bb = bb || el.getBBoxExact(without_transform);
                            m.scale(t[1], t[tlen - 1], bb.x + bb.width / 2,
                                bb.y + bb.height / 2);
                        } else if (tlen === 4) {
                            if (absolute) {
                                x2 = inver.x(t[2], t[3]);
                                y2 = inver.y(t[2], t[3]);
                                m.scale(t[1], t[1], x2, y2);
                            } else {
                                m.scale(t[1], t[1], t[2], t[3]);
                            }
                        } else if (tlen === 5) {
                            if (absolute) {
                                x2 = inver.x(t[3], t[4]);
                                y2 = inver.y(t[3], t[4]);
                                m.scale(t[1], t[2], x2, y2);
                            } else {
                                m.scale(t[1], t[2], t[3], t[4]);
                            }
                        }
                    } else if (command === "m" && tlen === 7) {
                        m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
                    }
                }
            }
            return m;
        }

        Snap._.transform2matrix = transform2matrix;
        Snap._unit2px = unit2px;
        const contains = glob.doc.contains || glob.doc.compareDocumentPosition ?
            function (a, b) {
                const adown = a.nodeType === 9 ? a.documentElement : a,
                    bup = b && b.parentNode;
                return a === bup || !!(bup && bup.nodeType === 1 && (
                    adown.contains ?
                        adown.contains(bup) :
                        a.compareDocumentPosition &&
                        a.compareDocumentPosition(bup) & 16
                ));
            } :
            function (a, b) {
                if (b) {
                    while (b) {
                        b = b.parentNode;
                        if (b === a) {
                            return true;
                        }
                    }
                }
                return false;
            };

        /**
         * Gets or creates a defs element for the given element
         * @function getSomeDefs
         * @private
         * @param {Element} el - Element to get defs for
         * @returns {SVGDefsElement} Defs element
         */
        function getSomeDefs(el) {
            const p = el.type === "svg" && el ||
                    el.node.ownerSVGElement && wrap(el.node.ownerSVGElement) ||
                    el.node.parentNode && wrap(el.node.parentNode) ||
                    Snap.select("svg") ||
                    Snap(0, 0),
                pdefs = p.select("defs");
            let defs = pdefs == null ? false : pdefs.node;
            if (!defs) {
                defs = make("defs", p.node).node;
            }
            return defs;
        }

        /**
         * Gets the root SVG element for the given element
         * @function getSomeSVG
         * @private
         * @param {Element} el - Element to get SVG root for
         * @returns {Element} Root SVG element
         */
        function getSomeSVG(el) {
            return el.node.ownerSVGElement && wrap(el.node.ownerSVGElement) ||
                Snap.select("svg");
        }

        Snap._.getSomeDefs = getSomeDefs;
        Snap._.getSomeSVG = getSomeSVG;

        /**
         * Converts unit values to pixels
         * @function unit2px
         * @private
         * @param {Element} el - Element context
         * @param {string} name - Attribute name
         * @param {*} value - Value to convert
         * @returns {number} Value in pixels
         */
        function unit2px(el, name, value) {
            const svg = getSomeSVG(el).node;
            let out = {},
                mgr = svg.querySelector(".svg---mgr");
            if (!mgr) {
                mgr = $("rect");
                $(mgr, {
                    x: -9e9,
                    y: -9e9,
                    width: 10,
                    height: 10,
                    "class": "svg---mgr",
                    fill: "none",
                });
                svg.appendChild(mgr);
            }

            function getW(val) {
                if (val == null) {
                    return E;
                }
                if (val == +val) {
                    return val;
                }
                $(mgr, {width: val});
                try {
                    return mgr.getBBox().width;
                } catch (e) {
                    return 0;
                }
            }

            function getH(val) {
                if (val == null) {
                    return E;
                }
                if (val == +val) {
                    return val;
                }
                $(mgr, {height: val});
                try {
                    return mgr.getBBox().height;
                } catch (e) {
                    return 0;
                }
            }

            function set(nam, f) {
                if (name == null) {
                    out[nam] = f(el.attr(nam) || 0);
                } else if (nam == name) {
                    out = f(value == null ? el.attr(nam) || 0 : value);
                }
            }

            switch (el.type) {
                case "rect":
                    set("rx", getW);
                    set("ry", getH);
                case "image":
                case "foreignObject":
                    set("width", getW);
                    set("height", getH);
                case "text":
                    set("x", getW);
                    set("y", getH);
                    break;
                case "circle":
                    set("cx", getW);
                    set("cy", getH);
                    set("r", getW);
                    break;
                case "ellipse":
                    set("cx", getW);
                    set("cy", getH);
                    set("rx", getW);
                    set("ry", getH);
                    break;
                case "line":
                    set("x1", getW);
                    set("x2", getW);
                    set("y1", getH);
                    set("y2", getH);
                    break;
                case "marker":
                    set("refX", getW);
                    set("markerWidth", getW);
                    set("refY", getH);
                    set("markerHeight", getH);
                    break;
                case "radialGradient":
                    set("fx", getW);
                    set("fy", getH);
                    break;
                case "tspan":
                    set("dx", getW);
                    set("dy", getH);
                    break;
                default:
                    set(name, getW);
            }
            svg.removeChild(mgr);
            return out;
        }

        /**
         * Snap.select @method
         *
         * Wraps a DOM element specified by CSS selector as @Element
         * @param {string} query - CSS selector of the element
         * @returns {Element} the current element
         */
        Snap.select = function (query) {
            query = Str(query).replace(/([^\\]):/g, "$1\\:");
            return wrap(glob.doc.querySelector(query));
        };
        /**
         * Snap.selectAll @method
         *
         * Wraps DOM elements specified by CSS selector as set or array of @Element
         * @param {string} query - CSS selector of the element
         * @returns {Element} the current element
         */
        Snap.selectAll = function (query) {
            const nodelist = glob.doc.querySelectorAll(query),
                set = (Snap.set || Array)();
            for (let i = 0; i < nodelist.length; ++i) {
                set.push(wrap(nodelist[i]));
            }
            return set;
        };

        function add2group(list) {
            if (!is(list, "array")) {
                list = Array.prototype.slice.call(arguments, 0);
            }
            let i = 0,
                j = 0;
            const node = this.node;
            while (this[i]) delete this[i++];
            for (i = 0; i < list.length; ++i) {
                if (list[i].type === "set") {
                    list[i].forEach(function (el) {
                        node.appendChild(el.node);
                    });
                } else {
                    node.appendChild(list[i].node);
                }
            }
            const children = node.childNodes;
            for (i = 0; i < children.length; ++i) {
                this[j++] = wrap(children[i]);
            }
            return this;
        }

// Hub garbage collector every 10s
        const gurbage_collect = function () {
            const collect = function () {
                for (let key in hub) {
                    if (hub.hasOwnProperty(key)) {
                        const el = hub[key],
                            node = el.node;
                        // let old_cond = (el.type !== 'svg' && !node.ownerSVGElement) ||
                        //     (el.type === 'svg' && (!node.parentNode ||
                        //         ('ownerSVGElement' in node.parentNode && !node.ownerSVGElement)));
                        if (!node.isConnected) {
                            el.cleanupAfterRemove();
                            delete hub[key];
                        }
                    }
                }
            };

            if (glob.win.requestIdleCallback) {
                return function () {
                    glob.win.requestIdleCallback(collect);
                };
            }

            return collect;
        }();
        setInterval(gurbage_collect, 1e4);

        // function paperMetForNonGroups(el, fun_name, paper) {
        //     return function () {
        //         const result = paper[fun_name].apply(paper, arguments);
        //         el.after(result);
        //         return result;
        //     }
        // }

        /**
         * Wrapper around native SVG DOM nodes providing Snap.svg convenience helpers.
         *
         * @class Snap.Element
         * @param {SVGElement} el Underlying DOM node.
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
                // console.trace();
            }
            hub[id] = this;

            // if (this.type === 'g') {
            //     this.add = add2group;
            // }

            // for (var method in Paper.prototype) if (Paper.prototype[has](method)) {
            //     if (!Paper.prototype @method.skip) {
            //         if (this.type in {g: 1, mask: 1, pattern: 1, symbol: 1, clipPath: 1}) {
            //             this @method = Paper.prototype @method;
            //         } else {
            //             this @method = paperMetForNonGroups(this, method, this.paper)
            //         }
            //     }
            // }
        }

        /**
         * Element.attr @method
         *
         * Gets or sets given attributes of the element.
         *
         * @param {object} params - contains key-value pairs of attributes you want to set
         * or
         * @param {string} param - name of the attribute
         * @returns {Element} the current element
         * or
         * @returns {string} value of attribute
         > Usage
         | el.attr({
         |     fill: "#fc0",
         |     stroke: "#000",
         |     strokeWidth: 2, // CamelCase...
         |     "fill-opacity": 0.5, // or dash-separated names
         |     width: "*=2" // prefixed values
         | });
         | console.log(el.attr("fill")); // #fc0
         * Prefixed values in format `"+=10"` supported. All four operations
         * (`+`, `-`, `*` and `/`) could be used. Optionally you can use units for `+`
         * and `-`: `"+=2em"`.
         */
        Element.prototype.attr = function (params, value) {
            const el = this,
                node = el.node;
            if (!params) {
                if (node.nodeType !== 1) {
                    return {
                        text: node.nodeValue,
                    };
                }
                const attr = node.attributes,
                    out = {};
                let i = 0;
                const ii = attr.length;
                for (; i < ii; ++i) {
                    out[attr[i].nodeName] = attr[i].nodeValue;
                }
                return out;
            }
            if (is(params, "string")) {
                if (arguments.length > 1) {
                    const json = {};
                    json[params] = value;
                    params = json;
                } else {
                    return eve(["snap", "util", "getattr", params], el).firstDefined();
                }
            }
            for (let att in params) {
                if (params[has](att)) {
                    eve(["snap", "util", "attr", att], el, params[att]);
                }
            }
            return el;
        };

        Element.prototype.css = Element.prototype.attr;

        Element.prototype.registerRemoveFunction = function (fun) {
            // if (typeof fun !== "function") return;
            // let reg_fun = this.data("_registered_remove_functions");
            // if (!reg_fun) {
            //     reg_fun = [];
            //     this.data("_registered_remove_functions", reg_fun);
            // }
            // reg_fun.push(fun)
            // this.addClass("IA_Designer_Remove_Function");
            if (this.id in hub_rem) {
                hub_rem[this.id].push(fun);
            } else {
                hub_rem[this.id] = [fun];
            }
        }

        Element.prototype.cleanupAfterRemove = function () {
            let reg_fun = hub_rem[this.id];
            if (reg_fun) {
                for (let i = 0; i < reg_fun.length; i++) {
                    reg_fun[i](this);
                }
                delete hub_rem[this.id];
            }
        };

        function sanitize(svg) {
            const script_filter = /<script[\s\S]*\/script>/gmi;
            svg = svg.replace(script_filter, "");
            svg = svg.replace(/\r?\n|\r/g, " ");
            return svg;
        }

        function fixHref(svg) {
            return svg.replace(/xlink:href\s*=/gmi, "href=");
        }

        /**
         * Snap.parse @method
         *
         * Parses SVG fragment and converts it into a @Fragment
         *
         * @param {string} svg - SVG string
         * @returns {Fragment} the @Fragment
         */
        Snap.parse = function (svg, filter_event) {
            let f = glob.doc.createDocumentFragment(),
                full = true;
            const div = glob.doc.createElement("div");
            svg = fixHref(sanitize(Str(svg)));

            if (!svg.match(/^\s*<\s*svg(?:\s|>)/)) {
                svg = "<svg>" + svg + "</svg>";
                full = false;
            }
            if (filter_event) svg = eve.filter(filter_event, svg);
            div.innerHTML = svg;
            svg = div.getElementsByTagName("svg")[0];
            if (svg) {
                if (full) {
                    f = svg;
                } else {
                    while (svg.firstChild) {
                        f.appendChild(svg.firstChild);
                    }
                }
            }
            return new Fragment(f);
        };

        /**
         * Lightweight container representing detached SVG content that can be inserted elsewhere.
         *
         * @class Snap.Fragment
         * @param {DocumentFragment} frag Native document fragment produced by Snap.
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

        /**
         * Wrapper around an `<svg>` root node providing element creation helpers and utilities.
         * Instances are created through {@link Snap} and mirror the behaviour of Snap.svg papers.
         *
         * @class Snap.Paper
         * @param {(number|string|SVGElement)} w Width of the surface or an existing SVG element.
         * @param {(number|string)} [h] Height of the surface when `w` is a numeric or string size.
         */
        function Paper(w, h) {
            let res,
                // desc,
                defs;
            const proto = Paper.prototype;
            if (w && w.tagName && w.tagName.toLowerCase() === "svg") {
                if (w.snap in hub) {
                    return hub[w.snap];
                }
                const doc = w.ownerDocument;
                res = new Element(w);
                // desc = w.getElementsByTagName('desc')[0];
                defs = w.getElementsByTagName("defs")[0];
                // if (!desc) {
                //     desc = $('desc');
                //     desc.appendChild(doc.createTextNode('Created with Snap'));
                //     res.node.appendChild(desc);
                // }
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


        //MeasureText
        Snap.measureTextClientRect = function (text_el) {
            if (!Snap._.measureSVG) {
                Snap._.measureSVG = Snap(100, 100).attr("style", "position:absolute;left:-9999px;top:-9999px; pointer-events:none");
            }
            let temp_clone = text_el.node.cloneNode(true);
            temp_clone.removeAttribute("transform");
            Snap._.measureSVG.node.appendChild(temp_clone);
            const rect = temp_clone.getBoundingClientRect();
            const parent_rect = Snap._.measureSVG.node.getBoundingClientRect();
            temp_clone.remove();
            return {
                left: rect.left - parent_rect.left, top: rect.top - parent_rect.top,
                width: rect.width, height: rect.height
            };

        }

        /**
         * Paper.el @method
         *
         * Creates an element on paper with a given name and no attributes
         *
         * @param {string} name - tag name
         * @param {object} attr - attributes
         * @returns {Element} the current element
         > Usage
         | var c = paper.circle(10, 10, 10); // is the same as...
         | var c = paper.el("circle").attr({
         |     cx: 10,
         |     cy: 10,
         |     r: 10
         | });
         | // and the same as
         | var c = paper.el("circle", {
         |     cx: 10,
         |     cy: 10,
         |     r: 10
         | });
         */
        Paper.prototype.el = function (name, attr) {
            const el = make(name, this.node);
            attr && el.attr(attr);
            return el;
        };
        /**
         * Returns all child elements wrapped as Snap elements.
         *
         * @function Snap.Element#children
         * @returns {Array.<Snap.Element>} Array of child elements.
         */
        Element.prototype.children = function () {
            const out = [],
                ch = this.node.childNodes;
            let i = 0;
            const ii = ch.length;
            for (; i < ii; ++i) {
                out[i] = Snap(ch[i]);
            }
            return out;
        };

        function jsonFiller(root, o) {
            let i = 0;
            const ii = root.length;
            for (; i < ii; ++i) {
                const item = {
                        type: root[i].type,
                        attr: root[i].attr(),
                    },
                    children = root[i].children();
                o.push(item);
                if (children.length) {
                    jsonFiller(children, item.childNodes = []);
                }
            }
        }

        /**
         * Serialises the element and its descendants into a plain object tree.
         *
         * @function Snap.Element#toJSON
         * @returns {Object} Element descriptor containing type, attributes, and child nodes.
         */
        Element.prototype.toJSON = function () {
            const out = [];
            jsonFiller([this], out);
            return out[0];
        };
// default
        eve.on("snap.util.getattr", function () {
            let att = eve.nt();
            att = att.substring(att.lastIndexOf(".") + 1);
            const css = att.replace(/[A-Z]/g, function (letter) {
                return "-" + letter.toLowerCase();
            });
            if (cssAttr[has](css)) {
                const propertyValue = (this.type === "jquery") ?
                    this.node.css(css) :
                    this.node.ownerDocument.defaultView.getComputedStyle(this.node,
                        null).getPropertyValue(css);
                return propertyValue;
            } else {
                const attr = (this.type === "jquery") ?
                    this.node.attr(att) :
                    $(this.node, att);
                return attr;
            }
        });


        eve.on("snap.util.attr", function (value) {
            let att = eve.nt();
            const attr = {};
            att = att.substring(att.lastIndexOf(".") + 1);
            value = value == null ? E : value;
            attr[att] = value;
            const style = att.replace(/-(\w)/gi, function (all, letter) {
                    return letter.toUpperCase();
                }),
                css = att.replace(/[A-Z]/g, function (letter) {
                    return "-" + letter.toLowerCase();
                });
            if (cssAttr[has](css)) {
                attr[att] = "";
                $(this.node, attr);
                if (this.type === "jquery") { //we don't use jquery anymore. Just for backwords compatibility
                    this.node.css(style, value);
                } else {
                    this.node.style[style] = value;
                }
            } else if (css === "transform" && !(is(this.node, "SVGElement"))) {
                this.node.style[style] = value;
            } else {
                $(this.node, attr);
                if (this.type === "jquery") {
                    this.node.attr(attr);
                }
                if (geomAttr[has](att)) this.clearCHull() //.c_hull = undefined;
            }
            this.attrMonitor(att)
        });
        (function (proto) {
        }(Paper.prototype));

// simple ajax
        /**
         * Snap.ajax @method
         *
         * Simple implementation of Ajax
         *
         * @param {string} url - URL
         * @param {object|string} postData - data for post request
         * @param {function} callback - callback
         * @param {object} scope - #optional scope of callback
         * or
         * @param {string} url - URL
         * @param {function} callback - callback
         * @param {object} scope - #optional scope of callback
         * @returns {XMLHttpRequest} the XMLHttpRequest object, just in case
         */
        Snap.ajax = function (
            url, postData, callback, scope, fail_callback, fail_scope) {
            const req = new XMLHttpRequest,
                id = ID();
            if (req) {
                if (is(postData, "function")) {
                    fail_scope = fail_callback;
                    fail_callback = scope;
                    scope = callback;
                    callback = postData;
                    postData = null;
                } else if (is(postData, "object")) {
                    const pd = [];
                    for (let key in postData) if (postData.hasOwnProperty(key)) {
                        pd.push(encodeURIComponent(key) + "=" +
                            encodeURIComponent(postData[key]));
                    }
                    postData = pd.join("&");
                }

                if (is(scope, "function")) {
                    fail_scope = fail_callback;
                    fail_callback = scope;
                }

                req.open(postData ? "POST" : "GET", Snap.fixUrl(url), true);
                if (postData) {
                    req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                    req.setRequestHeader("Content-type",
                        "application/x-www-form-urlencoded");
                }
                if (callback) {
                    eve.once("snap.ajax." + id + ".success", callback);
                }
                if (fail_callback && fail_scope) {
                    fail_callback = fail_callback.bind(fail_scope);
                }
                if (fail_callback) {
                    eve.once("snap.ajax." + id + ".fail", fail_callback);
                }
                req.onreadystatechange = function () {
                    // if (req.readyState !== 4) return;
                    // if (req.status === 200 || req.status === 304 || req.status === 0) {
                    //     eve(['snap', 'ajax', id, 'success'], scope, req);
                    //     eve.unbind('snap.ajax.' + id + '.fail', fail_callback);
                    // } else {
                    //     eve(['snap', 'ajax', id, 'fail'], fail_scope, req);
                    //     eve.unbind('snap.ajax.' + id + '.success', callback);
                    // }
                    if (this.readyState !== 4) return;
                    if (this.status === 200 || this.status === 304 || this.status === 0) {
                        eve(["snap", "ajax", id, "success"], scope, this);
                        eve.unbind("snap.ajax." + id + ".fail", fail_callback);
                    } else {
                        eve(["snap", "ajax", id, "fail"], fail_scope, this);
                        eve.unbind("snap.ajax." + id + ".success", callback);
                    }
                };
                if (req.readyState === 4) {
                    return req;
                }
                req.send(postData);
                return req;
            }
        };

// Snap.ajax = function (url, postData, callback, scope){
//     var req = new XMLHttpRequest,
//         id = ID();
//     if (req) {
//         if (is(postData, "function")) {
//             scope = callback;
//             callback = postData;
//             postData = null;
//         } else if (is(postData, "object")) {
//             var pd = [];
//             for (var key in postData) if (postData.hasOwnProperty(key)) {
//                 pd.push(encodeURIComponent(key) + "=" + encodeURIComponent(postData[key]));
//             }
//             postData = pd.join("&");
//         }
//         req.open(postData ? "POST" : "GET", url, true);
//         if (postData) {
//             req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
//             req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
//         }
//         if (callback) {
//             eve.once("snap.ajax." + id + ".0", callback);
//             eve.once("snap.ajax." + id + ".200", callback);
//             eve.once("snap.ajax." + id + ".304", callback);
//         }
//         req.onreadystatechange = function() {
//             if (req.readyState != 4) return;
//             eve(["snap","ajax",id,req.status], scope, req);
//         };
//         if (req.readyState == 4) {
//             return req;
//         }
//         req.send(postData);
//         return req;
//     }
// };
        /**
         * Snap.load @method
         *
         * Loads external SVG file as a @Fragment (see @Snap.ajax for more advanced AJAX)
         *
         * @param {string|arra} url - URL or [URL, post-data]
         * @param {function} callback - callback
         * @param {object} scope - #optional scope of callback
         - data {svg string} allows for inclusion of cached data, and avoids the network call
         */
        Snap.load = function (
            url, callback, scope, data, filter_event, failcallback) {
            if (data) {
                //already processed
                var f = Snap.parse(data, filter_event);
                scope ? callback.call(scope, f) : callback(f);
            } else {
                const process = function (req) {
                    const f = Snap.parse(req.responseText, filter_event);
                    scope ? callback.call(scope, f) : callback(f);
                };
                if (isArray(url)) {
                    Snap.ajax(url[0], url[1], process, undefined, failcallback);
                } else {
                    Snap.ajax(url, process, undefined, failcallback);
                }
            }
        };


        const getOffset = function (elem) {
            const box = elem.getBoundingClientRect(),
                doc = elem.ownerDocument,
                body = doc.body,
                docElem = doc.documentElement,
                clientTop = docElem.clientTop || body.clientTop || 0,
                clientLeft = docElem.clientLeft || body.clientLeft || 0,
                top = box.top +
                    (g.win.pageYOffset || docElem.scrollTop || body.scrollTop) -
                    clientTop,
                left = box.left +
                    (g.win.pageXOffset || docElem.scrollLeft || body.scrollLeft) -
                    clientLeft;
            return {
                y: top,
                x: left,
            };
        };
        /**
         * Returns the topmost element under the given window coordinates.
         *
         * @function Snap.getElementByPoint
         * @memberof Snap
         * @param {number} x X coordinate relative to the top-left corner of the viewport.
         * @param {number} y Y coordinate relative to the top-left corner of the viewport.
         * @returns {(Snap.Element|null)} Snap element wrapper or `null` when nothing is found.
         */
        Snap.getElementByPoint = function (x, y) {
            const paper = this,
                svg = paper.canvas;
            let target = glob.doc.elementFromPoint(x, y);
            if (glob.win.opera && target.tagName === "svg") {
                const so = getOffset(target),
                    sr = target.createSVGRect();
                sr.x = x - so.x;
                sr.y = y - so.y;
                sr.width = sr.height = 1;
                const hits = target.getIntersectionList(sr, null);
                if (hits.length) {
                    target = hits[hits.length - 1];
                }
            }
            if (!target) {
                return null;
            }
            return wrap(target);
        };
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
