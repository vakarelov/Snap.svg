// Copyright (c) 2017 Adobe Systems Incorporated. All rights reserved.
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

(function (glob, factory) {
    // AMD support
    if (typeof define == "function" && define.amd) {
        // Define as an anonymous module
        define(["mina"], function (mina) {
            return factory(glob, mina);
        });
    } else if (typeof exports != "undefined") {
        // Next for Node.js or CommonJS
        const eve = require("eve_ia");
        module.exports = factory(glob, eve);
    } else {
        // Browser globals (glob is window)
        // Snap adds itself to window
        factory(glob, glob.eve_ia || glob.eve);
    }
}(typeof window !== "undefined" ? window : (global || this), function (window, eve) {
    "use strict";
    let requestID;
    const isArray = Array.isArray || function (a) {
        return a instanceof Array || Object.prototype.toString.call(a) == "[object Array]";
    };
    let idgen = 0;
    const idprefix = "M" + (+new Date).toString(36);
    const _2PI = Math.PI * 2;
    const animations = {};
    let last = undefined;
    let global_speed = 1;
    let global_skip = 0;
    let expectedFrameDuration = 0;
    const requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
        setTimeout(callback, 16, new Date().getTime());
        return true;
    };
    let lastTimeStamp;

    /**
     * @typedef {(number|number[])} AnimationValue
     * @description Numeric value (or array of numeric values) animated by mina.
     */

    /**
     * @callback MinaGetter
     * @returns {number} Current master value that drives the animation timeline.
     */

    /**
     * @callback MinaSetter
     * @param {AnimationValue} value The interpolated value to apply.
     * @returns {void}
     */

    /**
     * @callback MinaEasing
     * @param {number} t Normalized progress in the `[0, 1]` range.
     * @returns {number} Eased progress value in the `[0, 1]` range.
     */

    /**
     * Drives the global animation loop and updates all registered animations.
     *
     * @param {number} [timeStamp] High-resolution timestamp provided by `requestAnimationFrame`.
     * @returns {void}
     */
    function frame(timeStamp) {
        // Manual invokation?
        if (!timeStamp) {
            // Frame loop stopped?
            if (!requestID) {
                // Start frame loop...
                requestID = requestAnimFrame(frame);
                lastTimeStamp = 0;
            }
            return;
        }


        if (expectedFrameDuration) { // Detect skipped frames
            const lapsed = timeStamp - lastTimeStamp;
            if (lastTimeStamp && lapsed > expectedFrameDuration) {
                console.warn("Skipped frames detected", lapsed);
            }
            lastTimeStamp = timeStamp;
        }

        let len = 0;
        for (const i in animations) if (animations.hasOwnProperty(i)) {
            const a = animations[i], b = a.get();
            len++;
            const d = a.dur / a.spd;
            a.s = (b - a.b) / d;
            if (a.s >= 1) {
                delete animations[i];
                if (last === a) last = undefined;
                a.s = 1;
                len--;
                (function (a) {
                    setTimeout(function () {
                        eve(["snap", "mina", "finish", a.id], a);
                    });
                }(a));
                if (a._finish) {
                    a._finish.forEach((f) => f(a));
                    a._finish = undefined;
                }
            } else if (a.skip) {
                a._skip_step = a._skip_step || 0;
                if (a._skip_step) {
                    a._skip_step--;
                    continue;
                }
                a._skip_step = a.skip;
            }
            a.update();
        }
        requestID = len ? requestAnimFrame(frame) : false;
    }

    /**
     * Generates a unique animation identifier.
     *
     * @returns {string}
     */
    function ID() {
        return idprefix + (idgen++).toString(36);
    }

    /**
     * Computes a linear interpolation function for the supplied values.
     *
     * @param {AnimationValue} a Start value(s).
     * @param {number} b Start timestamp.
     * @param {AnimationValue} A End value(s).
     * @param {number} B End timestamp.
    * @returns {function(number): AnimationValue}
     */
    function diff(a, b, A, B) {
        if (isArray(a)) {
            const res = [];
            let i = 0;
            const ii = a.length;
            for (; i < ii; ++i) {
                res[i] = diff(a[i], b, A[i], B);
            }
            return res;
        }
        const dif = (A - a) / (B - b);
        return function (bb) {
            return a + dif * (bb - b);
        };
    }

    const timer = Date.now || function () {
        return +new Date;
    };

    /**
     * Gets or sets the current status of an animation.
     *
     * @this {Animation}
     * @param {number} [val] New normalized progress in the `[0, 1]` range.
     * @returns {number|void}
     */
    function sta(val) {
        if (val == null) {
            return this.s;
        }
        const ds = this.s - val;
        this.b += this.dur * ds;
        this.B += this.dur * ds;
        this.s = val;
    }

    /**
     * Gets or sets the playback speed of an animation.
     *
     * @this {Animation}
     * @param {number} [val] New speed multiplier.
     * @returns {number|void}
     */
    function speed(val) {
        if (val == null) {
            return this.spd;
        }
        this.spd = val;
    }

    /**
     * Gets or sets the duration of an animation.
     *
     * @this {Animation}
     * @param {number} [val] New duration in timeline units.
     * @returns {number|void}
     */
    function duration(val) {
        if (val == null) {
            return this.dur;
        }
        this.s = this.s * val / this.dur;
        this.dur = val;
    }

    /**
     * Stops the animation immediately and emits the appropriate event.
     *
     * @this {Animation}
     * @returns {void}
     */
    function stopit() {
        delete animations[this.id];
        this.update();
        eve(["snap", "mina", "stop", this.id], this);
    }

    /**
     * Pauses the animation, preserving the current timeline offset.
     *
     * @this {Animation}
     * @returns {void}
     */
    function pause() {
        if (this.pdif) {
            return;
        }
        delete animations[this.id];
        this.update();
        this.pdif = this.get() - this.b;
    }

    /**
     * Resumes a paused animation from its preserved timeline offset.
     *
     * @this {Animation}
     * @returns {void}
     */
    function resume() {
        if (!this.pdif) {
            return;
        }
        this.b = this.get() - this.pdif;
        delete this.pdif;
        animations[this.id] = this;
        (Array.isArray(last)) ? last.push(this) : last = this;
        frame();
    }

    // const update = function () {
    //     let res;
    //     if (isArray(this.start)) {
    //         res = [];
    //         let j = 0;
    //         const jj = this.start.length;
    //         for (; j < jj; j++) {
    //             res[j] = this.rev
    //                 ? +this.end[j] + (this.start[j] - this.end[j]) * this.easing(1 - this.s)
    //                 : +this.start[j] + (this.end[j] - this.start[j]) * this.easing(this.s);
    //         }
    //     } else {
    //         res = this.rev
    //             ? +this.end + (this.start - this.end) * this.easing(1 - this.s)
    //             : +this.start + (this.end - this.start) * this.easing(this.s);
    //     }
    //     this.set(res);
    // };

    /**
     * Applies the easing function and updates the animated value.
     *
     * @this {Animation}
     * @returns {void}
     */
    function update() {
        let chng = false;
        if (this._lastRev !== undefined && this._lastRev !== this.rev) {
            chng = true;
            if (this.rev_fast && 1 - this.s > this.s) this.status(1 - this.s);
            this._s = this.s;
        }
        let t = this._s ? (this.s - this._s) / (1 - this._s) : this.s;
        const is_arr = isArray(this.start);
        const start = is_arr ? this.start : [this.start];
        const end = is_arr ? this.end : [this.end];
        let res = [];

        for (let j = 0; j < start.length; j++) {
            if (chng) {
                this._tmpStart = this._tmpStart || [];
                this._tmpEnd = this._tmpEnd || [];
                this._tmpStart[j] = this._lastRes[j];
                if (this.rev) {
                    this._tmpEnd[j] = +start[j];
                } else {
                    this._tmpEnd[j] = +end[j];
                }
            }

            let s = (this._tmpStart) ? this._tmpStart[j] : +start[j];
            let e = (this._tmpEnd) ? this._tmpEnd[j] : +end[j];

            res[j] = s + (e - s) * this.easing(t);
        }

        this.set(is_arr ? res : res[0]);
        this._lastRes = res;
        this._lastRev = this.rev;

        if (!is_arr) {
            this.start = start[0];
            this.end = end[0];
        }
    }

    /**
     * Toggles the playback direction of the animation.
     *
     * @this {Animation}
     * @param {boolean} [fast=false] When `true`, the animation attempts to reuse the current eased position for a smoother reversal.
     * @returns {void}
     */
    function reverse(fast) {
        this.rev = !this.rev;
        this.rev_fast = !!fast;
    }

    /**
     * Registers a callback that resolves once the animation reaches completion.
     *
     * @this {Animation}
    * @param {function(Animation): void} [callback] Invoked with the animation when it finishes.
     * @returns {Promise<void>} Promise that resolves when the animation finishes.
     */
    function then(callback) {
        return new Promise((resolve, reject) => {
            if (typeof callback === "function") {
                if (!this._finish) {
                    this._finish = [];
                }
                this._finish.push((a) => {
                    callback(a);
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Descriptor returned by {@link mina} that encapsulates an active animation.
     *
     * @class Animation
     * @param {AnimationValue} a Starting value(s).
     * @param {AnimationValue} A Ending value(s).
     * @param {number} b Starting master value (typically, start time).
     * @param {number} B Ending master value (typically, end time).
     * @param {MinaGetter} get Retrieves the current master value.
     * @param {MinaSetter} set Applies the interpolated slave value.
     * @param {MinaEasing} [easing=mina.linear] Easing function that transforms progress.
     */
    class Animation {
        constructor(a, A, b, B, get, set, easing) {
            this.id = ID();
            this.start = a;
            this.end = A;
            this.b = b;
            this.s = 0;
            this.dur = B - b;
            this.get = get;
            this.set = set;
            this.easing = easing || mina.linear;
            this.spd = global_speed;
            this.skip = global_skip;
            this.rev = false;
            this.status = sta;
            this.speed = speed;
            this.duration = duration;
            this.stop = stopit;
            this.pause = pause;
            this.resume = resume;
            this.update = update;
            this.reverse = reverse;
            this.then = then;
            /**
             * Indicates whether the animation has finished.
             *
             * @returns {boolean}
             */
            this.done = function () {
                return this.status() === 1
            };
        }
    }

    /**
     * Creates a new animation descriptor and schedules it on the shared timeline.
     *
     * @param {AnimationValue} a Starting value(s).
     * @param {AnimationValue} A Ending value(s).
     * @param {number} b Start time or master value.
     * @param {number} B End time or master value.
     * @param {MinaGetter} get Getter invoked to retrieve the current master value.
     * @param {MinaSetter} set Setter invoked with the interpolated value during updates.
     * @param {MinaEasing} [easing=mina.linear] Optional easing function.
     * @returns {Animation}
     */
    function mina(a, A, b, B, get, set, easing) {
        const anim = new Animation(a, A, b, B, get, set, easing);
        animations[anim.id] = anim;
        (Array.isArray(last)) ? last.push(anim) : last = anim;
        let len = 0;
        for (const key of Object.keys(animations)) {
            len++;
            if (len === 2) {
                break;
            }
        }
        if (len === 1) {
            frame();
        }
        return anim;
    }

    /**
     * Exposes the `Animation` constructor for advanced use cases.
    * @type {Function}
     */
    mina.Animation = Animation;

    /**
     * Returns the current timestamp in milliseconds.
     * Mirrors `Date.now()` and is primarily used as the default master getter.
     *
     * @returns {number}
     */
    mina.time = timer;
    /**
     * Retrieves an animation descriptor by its identifier.
     *
     * @param {string} id Animation identifier generated by {@link mina}.
     * @returns {Animation|null} Registered animation or `null` if not found.
     */
    mina.getById = function (id) {
        return animations[id] || null;
    };

    /**
     * Default linear easing.
     *
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.linear = function (n) {
        return n;
    };
    /**
     * Exponential ease-out easing.
     *
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.easeout = function (n) {
        return Math.pow(n, 1.7);
    };
    /**
     * Exponential ease-in easing.
     *
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.easein = function (n) {
        return Math.pow(n, .48);
    };
    /**
     * Smooth ease-in-out easing.
     *
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.easeinout = function (n) {
        if (n == 1) {
            return 1;
        }
        if (n == 0) {
            return 0;
        }
        const q = .48 - n / 1.04, Q = Math.sqrt(.1734 + q * q), x = Q - q,
            X = Math.pow(Math.abs(x), 1 / 3) * (x < 0 ? -1 : 1), y = -Q - q,
            Y = Math.pow(Math.abs(y), 1 / 3) * (y < 0 ? -1 : 1), t = X + Y + .5;
        return (1 - t) * 3 * t * t + t * t * t;
    };
    /**
     * Back-in easing that overshoots slightly before accelerating.
     *
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.backin = function (n) {
        if (n == 1) {
            return 1;
        }
        const s = 1.70158;
        return n * n * ((s + 1) * n - s);
    };
    /**
     * Back-out easing that overshoots the end value before settling.
     *
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.backout = function (n) {
        if (n == 0) {
            return 0;
        }
        n = n - 1;
        const s = 1.70158;
        return n * n * ((s + 1) * n + s) + 1;
    };
    /**
     * Elastic easing with optional amplitude and period customization.
     *
     * @param {number} [amp=1] Amplitude of the overshoot.
     * @param {number} [per=0.3] Period of oscillation.
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.elastic = function (amp, per, n) {
        if (per === undefined) {
            n = amp;
            amp = 1;
        }

        if (n === undefined) {
            n = per;
            per = undefined;
        }

        if (n === !!n) {
            return n;
        }

        amp = amp || 1;

        const a = (amp >= 1) ? amp : 1;
        per = (per || .3) / (amp < 1 ? amp : 1);
        const f = per / _2PI * (Math.asin(1 / a) || 0);

        return a * (2 ** (-10 * n)) * Math.sin((n - f) * (_2PI / per)) + 1;

        // var k = _2PI / .3;
        // var ret = amp * Math.pow(2, -10 * n) * Math.sin((n - .075) * k) + 1;
    };
    /**
     * Creates a reusable elastic easing function with predefined parameters.
     *
     * @param {number} amp Amplitude passed to {@link mina.elastic}.
     * @param {number} per Period passed to {@link mina.elastic}.
     * @returns {MinaEasing}
     */
    mina.elastic.withParams = function (amp, per) {
        return mina.elastic.bind(undefined, amp, per);
    };

    /**
     * Bounce easing that simulates a ball dropping and settling.
     *
     * @param {number} n Normalized progress in the `[0, 1]` range.
     * @returns {number}
     */
    mina.bounce = function (n) {
        const s = 7.5625, p = 2.75;
        let l;
        const or = n;
        if (n < 1 / p) {
            l = s * n * n;
            // console.log(1, n, l, or)
        } else {
            if (n < 2 / p) {
                n -= 1.5 / p;
                l = s * n * n + .75;
                // console.log(2, n, l, or)
            } else {
                if (n < 2.5 / p) {
                    n -= 2.25 / p;
                    l = s * n * n + .9375;
                    // console.log(3, n, l, or)
                } else {
                    n -= 2.625 / p;
                    l = s * n * n + .984375;
                    // console.log(4, n, l, or)
                }
            }
        }
        return l;
    };

    // mina.bounce2 = function(b, h, t){
    //
    // }

    /**
     * Flags functions that are not easing helpers so they are excluded from {@link mina.isEasing} checks.
     * @type {Record<string, boolean>}
     */
    const non_easing_functions = {
        Animation: true,
        getById: true,
        isEasing: true,
        anim: true,
        time: true,
        setSpeed: true,
        setSkip: true,
        setTimeout: true,
        setTimeoutNow: true,
        setInterval: true,
        trakSkippedFrames: true,
    };
    /**
     * Determines whether the provided key refers to a registered easing function.
     *
     * @param {string} name Property name on the mina namespace.
     * @returns {boolean}
     */
    mina.isEasing = function (name) {
        return mina.hasOwnProperty(name) && !non_easing_functions[name]
    };

    /**
     * Updates the global speed multiplier applied to all running animations.
     *
     * @param {number} [speed=1] Speed multiplier; values greater than `1` speed up animations.
     * @param {number} [skip] Optional skip interval forwarded to {@link mina.setSkip}.
     * @returns {void}
     */
    mina.setSpeed = function (speed, skip) {
        if (speed) {
            global_speed = speed;
        } else {
            global_speed = 1;
        }
        Object.values(animations).forEach(function (anim) {
            anim.speed(speed);
        });
        if (skip) this.setSkip(skip);
    };

    /**
     * Sets the global step-skipping interval for all animations.
     *
     * @param {number} skip Number of frames to skip between updates.
     * @returns {void}
     */
    mina.setSkip = function (skip) {
        global_skip = Math.floor(+skip);
        Object.values(animations).forEach(function (anim) {
            anim.skip = global_skip;
        });
    }

    /**
     * Schedules a timeout that respects the global mina speed multiplier.
     *
     * @param {Function} callback Handler to invoke.
     * @param {number} deley Delay in milliseconds (affected by `setSpeed`).
     * @param {...*} args Optional arguments forwarded to the callback.
     * @returns {number}
     */
    mina.setTimeout = function (callback, deley, ...args) {
        deley *= global_speed
        return setTimeout(callback, deley, ...args);
    }

    /**
     * Schedules an immediate or delayed callback aligned with the global speed multiplier.
     *
     * @param {Function} callback Handler to invoke.
     * @param {number} deley Delay in milliseconds before execution.
     * @param {...*} args Optional arguments forwarded to the callback.
     * @returns {number|void}
     */
    mina.setTimeoutNow = function (callback, deley, ...args) {
        deley *= global_speed
        return (deley) ? setTimeout(callback, deley, ...args) : callback(...args);
    }

    /**
     * Registers an interval timer that honors the global speed multiplier.
     *
     * @param {Function} callback Handler to invoke on each tick.
     * @param {number} interval Interval duration in milliseconds.
     * @param {...*} args Optional arguments forwarded to the callback.
     * @returns {number}
     */
    mina.setInterval = function (callback, interval, ...args) {
        interval *= global_speed;
        return setInterval(callback, interval, ...args);
    };

    /**
     * Enables detection of skipped frames by providing an expected frame duration.
     *
     * @param {number} [frame_time=18] Expected duration of each frame in milliseconds.
     * @returns {void}
     */
    mina.trakSkippedFrames = function (frame_time) {
        expectedFrameDuration = (frame_time === undefined) ? 18 // a bit longer than 60fps frame
            : +(frame_time || 0)
    }

    /**
     * Returns the last animation(s) registered or starts collecting the next batch.
     *
     * @param {boolean} [start_collecting=false] When `true`, clears the stored reference and begins collecting anew.
     * @returns {Animation|Animation[]|undefined}
     */
    mina.getLast = function (start_collecting) {
        if (start_collecting) {
            last = [];
            return;
        }
        if (Array.isArray(last)){
            let l = last;
            last = undefined;
            return l;
        }
        return last;
    }

    window.mina = mina;
    return mina;
}));
// ((typeof window.eve == "undefined" && window.eve_ia == "undefined")
//     ? function () {}
// : window.eve || window.eve_ia);
