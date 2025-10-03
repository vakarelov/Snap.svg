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
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    var mmax = Math.max,
        mmin = Math.min;

    /**
     * Set object constructor - creates a collection of Snap elements
     * @class Set
     * @param {Array} [items] - array of initial items to add to the set
     */
    var Set = function (items) {
            this.items = [];
            this.bindings = {};
            this.length = 0;
            this.type = "set";
            if (items) {
                for (var i = 0, ii = items.length; i < ii; ++i) {
                    if (items[i]) {
                        // this[this.items.length] = this.items[this.items.length] = items[i];
                        // this.length++;
                        this.push(items[i])
                    }
                }
            }
        },
        setproto = Set.prototype;
    /**
     * Adds each argument to the current set
     * @method Set.push
     * @returns {Set} original set for chaining
     */
    setproto.push = function () {
        var item,
            len;
        for (var i = 0, ii = arguments.length; i < ii; ++i) {
            item = arguments[i];
            if (item) {
                len = this.items.length;
                this[len] = this.items[len] = item;
                this.length++;
            }
        }
        return this;
    };
    /**
     * Removes last element and returns it
     * @method Set.pop
     * @returns {Element} element that was removed
     */
    setproto.pop = function () {
        this.length && delete this[this.length--];
        return this.items.pop();
    };
    /**
     * Executes given function for each element in the set
     * 
     * If the function returns `false`, the loop stops running.
     * @method Set.forEach
     * @param {Function} callback - function to run
     * @param {Object} thisArg - context object for the callback
     * @returns {Set} Set object for chaining
     */
    setproto.forEach = function (callback, thisArg) {
        for (var i = 0, ii = this.items.length; i < ii; ++i) {
            if (callback.call(thisArg, this.items[i], i) === false) {
                return this;
            }
        }
        return this;
    };
    /**
     * Animates each element in set in sync.
     * 
     * @method Set.animate
     * @param {Object|Array} attrs - key-value pairs of destination attributes or array of animation parameters
     * @param {Number} [duration] - duration of the animation in milliseconds
     * @param {Function} [easing] - easing function from mina or custom
     * @param {Function} [callback] - callback function that executes when the animation ends
     * @returns {Set} the current set for chaining
     * 
     * @example
     * // animate all elements in set to radius 10
     * set.animate({r: 10}, 500, mina.easein);
     * 
     * @example
     * // animate first element to radius 10, but second to radius 20 and in different time
     * set.animate([{r: 10}, 500, mina.easein], [{r: 20}, 1500, mina.easein]);
     */
    setproto.animate = function (attrs, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        if (attrs instanceof Snap._.Animation) {
            callback = attrs.callback;
            easing = attrs.easing;
            ms = easing.dur;
            attrs = attrs.attr;
        }
        var args = arguments;
        if (Snap.is(attrs, "array") && Snap.is(args[args.length - 1], "array")) {
            var each = true;
        }
        var begin,
            handler = function () {
                if (begin) {
                    this.b = begin;
                } else {
                    begin = this.b;
                }
            },
            cb = 0,
            set = this,
            callbacker = callback && function () {
                if (++cb == set.length) {
                    callback.call(this);
                }
            };
        return this.forEach(function (el, i) {
            eve.once("snap.animcreated." + el.id, handler);
            if (each) {
                args[i] && el.animate.apply(el, args[i]);
            } else {
                el.animate(attrs, ms, easing, callbacker);
            }
        });
    };
    /**
     * Removes all children of the set.
     * @method Set.remove
     * @returns {Set} Set object for chaining
     */
    setproto.remove = function () {
        while (this.length) {
            this.pop().remove();
        }
        return this;
    };
    /**
     * Specifies how to handle a specific attribute when applied to a set.
     * @method Set.bind
     * @param {String} attr - attribute name
     * @param {Function|Element} a - function to run or element to bind to
     * @param {String} [b] - attribute on the element to bind the attribute to
     * @returns {Set} Set object for chaining
     */
    setproto.bind = function (attr, a, b) {
        var data = {};
        if (typeof a == "function") {
            this.bindings[attr] = a;
        } else {
            var aname = b || attr;
            this.bindings[attr] = function (v) {
                data[aname] = v;
                a.attr(data);
            };
        }
        return this;
    };
    /**
     * Equivalent of Element.attr - sets or gets attributes for all elements in the set.
     * @method Set.attr
     * @param {Object} value - key-value pairs of attributes to set
     * @returns {Set} Set object for chaining
     */
    setproto.attr = function (value) {
        var unbound = {};
        for (var k in value) {
            if (this.bindings[k]) {
                this.bindings[k](value[k]);
            } else {
                unbound[k] = value[k];
            }
        }
        for (var i = 0, ii = this.items.length; i < ii; ++i) {
            this.items[i].attr(unbound);
        }
        return this;
    };
    /**
     * Removes all elements from the set
     * @method Set.clear
     */
    setproto.clear = function () {
        while (this.length) {
            this.pop();
        }
    };
    /**
     * Removes range of elements from the set
     * @method Set.splice
     * @param {Number} index - position of the deletion
     * @param {Number} count - number of element to remove
     * @param {...any} insertion - optional elements to insert
     * @returns {Set} set elements that were deleted
     */
    setproto.splice = function (index, count, insertion) {
        index = index < 0 ? mmax(this.length + index, 0) : index;
        count = mmax(0, mmin(this.length - index, count));
        var tail = [],
            todel = [],
            args = [],
            i;
        for (i = 2; i < arguments.length; ++i) {
            args.push(arguments[i]);
        }
        for (i = 0; i < count; ++i) {
            todel.push(this[index + i]);
        }
        for (; i < this.length - index; ++i) {
            tail.push(this[index + i]);
        }
        var arglen = args.length;
        for (i = 0; i < arglen + tail.length; ++i) {
            this.items[index + i] = this[index + i] = i < arglen ? args[i] : tail[i - arglen];
        }
        i = this.items.length = this.length -= count - arglen;
        while (this[i]) {
            delete this[i++];
        }
        return new Set(todel);
    };
    /**
     * Removes given element from the set
     * @method Set.exclude
     * @param {Element} element - element to remove
     * @returns {Boolean} true if element was found and removed, false otherwise
     */
    setproto.exclude = function (el) {
        for (var i = 0, ii = this.length; i < ii; ++i) if (this[i] == el) {
            this.splice(i, 1);
            return true;
        }
        return false;
    };
    /**
     * Inserts set elements after given element.
     * @method Set.insertAfter
     * @param {Element} element - set will be inserted after this element
     * @returns {Set} Set object for chaining
     */
    setproto.insertAfter = function (el) {
        var i = this.items.length;
        while (i--) {
            this.items[i].insertAfter(el);
        }
        return this;
    };
    /**
     * Union of all bboxes of the set. See Element.getBBox.
     * @method Set.getBBox
     * @returns {BBox} bounding box descriptor. See Element.getBBox.
     */
    setproto.getBBox = function () {
        var x = [],
            y = [],
            x2 = [],
            y2 = [];
        let box;
        for (var i = this.items.length; i--;) if (!this.items[i].removed) {
            if (box){
                box = box.union(this.items[i].getBBox());
            } else {
                box = this.items[i].getBBox().clone();
            }
        }
        return box;
    };

    /**
     * Creates a new set with items that pass the test implemented by the provided function.
     * @method Set.filter
     * @param {Function} callback - function to test each element
     * @param {Object} [thisArg] - value to use as this when executing callback
     * @returns {Array} filtered array of items
     */
    setproto.filter = function (callback, thisArg) {
        return this.items.filter(callback, thisArg)
    };

    /**
     * Creates a new array with the results of calling a provided function on every element.
     * @method Set.map
     * @param {Function} callback - function that produces an element of the new array
     * @param {Object} [thisArg] - value to use as this when executing callback
     * @returns {Array} new array with each element being the result of the callback function
     */
    setproto.map = function (callback, thisArg) {
        return this.items.map(callback, thisArg)
    };

    /**
     * Returns array of all values in the set.
     * @method Set.values
     * @returns {Array} array of values
     */
    setproto.values = function () {
        return this.items.filter(values)
    };

    /**
     * Determines whether a set includes a certain element, returning true or false.
     * @method Set.includes
     * @param {*} valueToFind - the value to search for
     * @param {Number} [fromIndex] - the position in this set at which to begin searching
     * @returns {Boolean} true if the value was found, false otherwise
     */
    setproto.includes = function (valueToFind, fromIndex) {
        return this.items.includes(valueToFind, fromIndex);
    };

    /**
     * Creates a clone of the set.
     * @method Set.clone
     * @returns {Set} New Set object
     */
    setproto.clone = function (s) {
        s = new Set;
        for (var i = 0, ii = this.items.length; i < ii; ++i) {
            s.push(this.items[i].clone());
        }
        return s;
    };
    
    /**
     * Returns string representation of the set.
     * @method Set.toString
     * @returns {String} string representation
     */
    setproto.toString = function () {
        return "Snap\u2018s set";
    };
    setproto.type = "set";
    // export
    /**
     * Set constructor.
     * @class Snap.Set
     * @param {Array} [items] - array of initial items
     */
    Snap.Set = Set;
    /**
     * Creates a set and fills it with list of arguments.
     * @method Snap.set
     * @param {...any} arguments - elements to add to the set
     * @returns {Set} New Set object
     * @example
     * var r = paper.rect(0, 0, 10, 10),
     *     s1 = Snap.set(), // empty set
     *     s2 = Snap.set(r, paper.circle(100, 100, 20)); // prefilled set
     */
    Snap.set = function () {
        var set = new Set;
        if (arguments.length) {
            set.push.apply(set, Array.prototype.slice.call(arguments, 0));
        }
        return set;
    };
});
