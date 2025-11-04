// Copyright (c) 2016 Adobe Systems Incorporated. All rights reserved.
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
Snap.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    const elproto = Element.prototype,
        is = Snap.is,
        Str = String,
        has = "hasOwnProperty";

    function slice(from, to, f) {
        return function (arr) {
            let res = arr.slice(from, to);
            if (res.length == 1) {
                res = res[0];
            }
            return f ? f(res) : res;
        };
    }

    const Animation = function (attr, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        this.attr = attr;
        this.dur = ms;
        easing && (this.easing = easing);
        callback && (this.callback = callback);
    };
    Snap._.Animation = Animation;
    /**
     * Snap.animation @method
 *
     * Creates an animation object
 *
 * @param {object} attr - attributes of final destination
 * @param {number} duration - duration of the animation, in milliseconds
 * @param {function} easing - #optional one of easing functions of @mina or custom one
 * @param {function} callback - #optional callback function that fires when animation ends
 * @returns {object} animation object
    */
    Snap.animation = function (attr, ms, easing, callback) {
        return new Animation(attr, ms, easing, callback);
    };
    /**
     * Element.inAnim @method
 *
     * Returns a set of animations that may be able to manipulate the current element
 *
 * @returns {object} in format:
     o {
     o     anim (object) animation object,
     o     mina (object) @mina object,
     o     curStatus (number) 0..1 — status of the animation: 0 — just started, 1 — just finished,
     o     status (function) gets or sets the status of the animation,
     o     stop (function) stops the animation
     o }
    */
    elproto.inAnim = function () {
        const el = this,
            res = [];
        for (let id in el.anims) if (el.anims[has](id)) {
            (function (a) {
                res.push({
                    anim: new Animation(a._attrs, a.dur, a.easing, a._callback),
                    mina: a,
                    curStatus: a.status(),
                    status: function (val) {
                        return a.status(val);
                    },
                    stop: function () {
                        a.stop();
                    }
                });
            }(el.anims[id]));
        }
        return res;
    };
    /**
     * Snap.animate @method
 *
     * Runs generic animation of one number into another with a caring function
 *
 * @param {number|array} from - number or array of numbers
 * @param {number|array} to - number or array of numbers
 * @param {function} setter - caring function that accepts one number argument
 * @param {number} duration - duration, in milliseconds
 * @param {function} easing - #optional easing function from @mina or custom
 * @param {function} callback - #optional callback function to execute when animation ends
 * @returns {object} animation object in @mina format
     o {
     o     id (string) animation id, consider it read-only,
     o     duration (function) gets or sets the duration of the animation,
     o     easing (function) easing,
     o     speed (function) gets or sets the speed of the animation,
     o     status (function) gets or sets the status of the animation,
     o     stop (function) stops the animation
     o }
     | var rect = Snap().rect(0, 0, 10, 10);
     | Snap.animate(0, 10, function (val) {
     |     rect.attr({
     |         x: val
     |     });
     | }, 1000);
     | // in given context is equivalent to
     | rect.animate({x: 10}, 1000);
    */
    Snap.animate = function (from, to, setter, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        const now = mina.time(),
            anim = mina(from, to, now, now + ms, mina.time, setter, easing);
        callback && eve.once("snap.mina.finish." + anim.id, callback);
        return anim;
    };
    /**
     * Element.stop @method
 *
     * Stops all the animations for the current element
 *
 * @returns {Element} the current element
    */
    elproto.stop = function () {
        const anims = this.inAnim();
        let i = 0;
        const ii = anims.length;
        for (; i < ii; ++i) {
            anims[i].stop();
        }
        return this;
    };
    /**
     * Element.animate @method
 *
     * Animates the given attributes of the element
 *
 * @param {object} attrs - key-value pairs of destination attributes
 * @param {number} ms - duration of the animation in milliseconds
 * @param {function} easing - #optional easing function from @mina or custom
 * @param {function} callback - #optional callback function that executes when the animation ends
 * @returns {Element} the current element
    */
    elproto.animate = function (attrs, ms, easing, callback) {
        if (typeof easing == "function" && !easing.length) {
            callback = easing;
            easing = mina.linear;
        }
        if (attrs instanceof Animation) {
            callback = attrs.callback;
            easing = attrs.easing;
            ms = attrs.dur;
            attrs = attrs.attr;
        }
        let fkeys = [], tkeys = [];
        const keys = {};
        let from, to, f, eq;
        const el = this;
        for (let key in attrs) if (attrs[has](key)) {
            if (el.equal) {
                eq = el.equal(key, Str(attrs[key]));
                from = eq.from;
                to = eq.to;
                f = eq.f;
            } else {
                from = +el.attr(key);
                to = +attrs[key];
            }
            const len = is(from, "array") ? from.length : 1;
            keys[key] = slice(fkeys.length, fkeys.length + len, f);
            fkeys = fkeys.concat(from);
            tkeys = tkeys.concat(to);
        }
        const now = mina.time();
        const anim = mina(fkeys, tkeys, now, now + ms, mina.time, function (val) {
            const attr = {};
            for (let key in keys) if (keys[has](key)) {
                attr[key] = keys[key](val);
            }
            el.attr(attr);
        }, easing);
        el.anims[anim.id] = anim;
        anim._attrs = attrs;
        anim._callback = callback;
        eve.once("snap.mina.finish." + anim.id, function () {
            eve.off("snap.mina.*." + anim.id);
            delete el.anims[anim.id];
            callback && callback.call(el);
        });
        eve.once("snap.mina.stop." + anim.id, function () {
            eve.off("snap.mina.*." + anim.id);
            delete el.anims[anim.id];
        });
        eve(["snap", "animcreated", el.id], anim);
        return anim;
    };
});
