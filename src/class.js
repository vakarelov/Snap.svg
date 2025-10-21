// Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
        var rgNotSpace = /\S+/g,
            rgBadSpace = /[\t\r\n\f]/g,
            rgTrim = /(^\s+|\s+$)/g,
            Str = String,
            elproto = Element.prototype;
        /**
         * Element.addClass @method
 *
         * Adds given class name or list of class names to the element.
 * @param {string} value - class name or space separated list of class names
 *
 * @returns {Element} original element.
        */
        elproto.addClass = function (value) {
            var classes = (Array.isArray(value)) ? value : Str(value || "").match(rgNotSpace) || [],
                elem = this.node,
                isSvg = typeof elem.className === "object", //.hasOwnProperty("baseVal"),
                className = isSvg ? elem.className.baseVal : elem.className,
                curClasses = className.match(rgNotSpace) || [],
                j,
                pos,
                clazz,
                finalValue;

            if (classes.length) {
                j = 0;
                while (clazz = classes[j++]) {
                    pos = curClasses.indexOf(clazz);
                    if (!~pos) {
                        curClasses.push(clazz);
                    }
                }

                finalValue = curClasses.join(" ");
                if (className != finalValue) {
                    if (isSvg) {
                        elem.className.baseVal = finalValue;
                    } else {
                        elem.className = finalValue;
                    }

                    if (this.div) {
                        if (typeof this.div.node.className === "object") {
                            this.div.node.className.baseVal = finalValue;
                        } else {
                            this.div.node.className = finalValue;
                        }
                    }
                }
                return this;
            }
            return this;
        };
        /**
             * Element.removeClass @method
 *
             * Removes given class name or list of class names from the element.
 * @param {string} value - class name or space separated list of class names
 * @param {boolean} prefix - if true, removes all classes that start with the given class name
 *
 * @returns {Element} original element.
            */
        elproto.removeClass = function (value, prefix = false) {
            if (Array.isArray(value)) {
                value.forEach((v) => this.removeClass(v))
            }
            var classes = Str(value || "").match(rgNotSpace) || [],
                elem = this.node,
                isSVG = typeof elem.className === "object", // elem.className.hasOwnProperty("baseVal"),
                className = isSVG ? elem.className.baseVal : elem.className,
                curClasses = className.match(rgNotSpace) || [],
                j,
                pos,
                clazz,
                finalValue;
            if (curClasses.length) {
                j = 0;
                while (clazz = classes[j++]) {
                    if (!prefix) {
                        pos = curClasses.indexOf(clazz);
                        if (~pos) {
                            curClasses.splice(pos, 1);
                        }
                    } else {
                        // remove all classes that start with the given clazz
                        curClasses = curClasses.filter((c) => !c.startsWith(clazz))
                    }
                }

                finalValue = curClasses.join(" ");
                if (className != finalValue) {
                    if (isSVG) {
                        elem.className.baseVal = finalValue;
                    } else {
                        elem.className = finalValue;
                    }
                }

            }
        }
        /**
         * Element.hasClass @method
 *
         * Checks if the element has a given class name in the list of class names applied to it.
         * @param {string} value - class name
         *
         * @param {boolean} conjunctive - if true, checks if all classes are present; if false, checks if any are present
         * @returns {boolean} `true` if the element has given class
         */
        elproto.hasClass = function (value, conjunctive = false) {
            var elem = this.node,
                className = (typeof elem.className === "object") ? elem.className.baseVal : elem.className,
                curClasses = className.match(rgNotSpace) || [];
            if (Array.isArray(value)) {
                if (conjunctive) {
                    return value.every(v => curClasses.indexOf(v) !== -1);
                } else {
                    return value.some(v => curClasses.indexOf(v) !== -1);
                }
            }
            return curClasses.indexOf(value) !== -1;
        };

        elproto.matchClass = function (regex) {
            var elem = this.node,
                className = (typeof elem.className === "object") ? elem.className.baseVal : elem.className,
                curClasses = className.match(rgNotSpace) || [];
            //loop over all classes and check if any of them match the regex and get an array of all matching classes
            return curClasses.filter((c) => regex.test(c));
        };
        elproto.classesStartWith = function (value) {
            return this.matchClass(new RegExp("^" + value));
        }
        /**
         * Element.toggleClass @method
 *
         * Add or remove one or more classes from the element, depending on either
         * the class’s presence or the value of the `flag` argument.
 * @param {string} value - class name or space separated list of class names
 * @param {boolean} flag - value to determine whether the class should be added or removed
 *
 * @returns {Element} original element.
        */
        elproto.toggleClass = function (value, flag) {
            if (flag != null) {
                if (flag) {
                    return this.addClass(value);
                } else {
                    return this.removeClass(value);
                }
            }
            var classes = (value || "").match(rgNotSpace) || [],
                elem = this.node,
                className = (typeof elem.className === "object") ? elem.className.baseVal : elem.className,
                curClasses = className.match(rgNotSpace) || [],
                j,
                pos,
                clazz,
                finalValue;
            j = 0;
            while (clazz = classes[j++]) {
                pos = curClasses.indexOf(clazz);
                if (~pos) {
                    curClasses.splice(pos, 1);
                } else {
                    curClasses.push(clazz);
                }
            }

            finalValue = curClasses.join(" ");
            if (className != finalValue) {
                if (typeof elem.className === "object") {
                    elem.className.baseVal = finalValue;
                } else {
                    elem.className = finalValue;
                }

            }
            return this;
        };
    }
)
;
