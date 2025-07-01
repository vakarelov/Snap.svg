// Snap.svg 0.5.1
//
// Copyright (c) 2013 – 2017 Adobe Systems Incorporated. All rights reserved.
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
//
// build: 2025-07-01

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
// ┌────────────────────────────────────────────────────────────┐ \\
// │ Eve 0.5.4 - JavaScript Events Library                      │ \\
// ├────────────────────────────────────────────────────────────┤ \\
// │ Author Dmitry Baranovskiy (http://dmitry.baranovskiy.com/) │ \\
// └────────────────────────────────────────────────────────────┘ \\

//Modifications copyright (C) 2019 <Orlin Vakarelov>

(function (glob) {
    const version = "1.0.0",
        has = "hasOwnProperty";
    let separator = ".";
    const // /[\.\/]/,
        comaseparator = /\s*,\s*/,
        wildcard = "*",
        numsort = function (a, b) {
            return a - b;
        },
        function_sort = function (a, b) {
            return +a.zIndex - +b.zIndex;
        };
    let current_event,
        stop;
    //snap, drag and ia events are global
    const global_event = {
        n: {
            snap: {n: {}},
            drag: {n: {}},
            ia: {n: {}},
            global: {n: {}},
        },

    };
    //table of local events
    const event_groups = {default: {n: {}}}; //default group allows adding listeners to local (grouped) events in the global context

    let events = event_groups.default;
    const getNext = function (event_list, name, group, skip_global) {
        if (event_list === undefined) {
            if (!skip_global && global_event.n.hasOwnProperty(name)) {
                return global_event.n;
            }
            if (group) {
                return event_groups[group].n;
            } else {
                return events.n;
            }
        }

        return event_list.n;
    };
    const firstDefined = function () {
        let i = 0;
        const ii = this.length;
        for (; i < ii; ++i) {
            if (typeof this[i] != "undefined") {
                return this[i];
            }
        }
    };
    let xIndex_cur = 0;
    const lastDefined = function () {
            let i = this.length;
            while (--i) {
                if (typeof this[i] != "undefined") {
                    return this[i];
                }
            }
        },
        objtos = Object.prototype.toString,
        Str = String,
        isArray = Array.isArray || function (ar) {
            return ar instanceof Array || objtos.call(ar) == "[object Array]";
        },
        /*\
         * eve
         [ method ]

         * Fires event with given `name`, given scope and other parameters.

         - name (string) name of the *event*, dot (`.`) or slash (`/`) separated
         - scope (object) context for the event handlers
         - varargs (...) the rest of arguments will be sent to event handlers

         = (object) array of returned values from the listeners. Array has two methods `.firstDefined()` and `.lastDefined()` to get first or last not `undefined` value.
        \*/
        eve = function (group, name, scope) {
            let args;
            if (Array.isArray(group) || typeof group === "string") {
                args = Array.prototype.slice.call(arguments, 2)
                scope = name;
                name = group;
                group = undefined;
            } else {
                group = group.id;
            }
            args = args || Array.prototype.slice.call(arguments, 3)
            const oldstop = stop,
                listeners = eve.listeners(name, group),
                z = 0;
            let l;
            const indexed = [],
                queue = {},
                out = [],
                ce = current_event;

            if (typeof scope !== "undefined" && typeof scope !== "object") {
                args.unshift(scope);
                scope = undefined;
            }

            out.firstDefined = firstDefined;
            out.lastDefined = lastDefined;
            current_event = name;
            stop = 0;
            // for (var i = 0, ii = listeners.length; i < ii; ++i) if ("zIndex" in listeners[i]) {
            //     indexed.push(listeners[i].zIndex);
            //     if (listeners[i].zIndex < 0) {
            //         queue[listeners[i].zIndex] = listeners[i];
            //     }
            // }

            listeners.sort(function_sort);

            for (let i = 0, lim = listeners.length; i < lim; ++i) {
                l = listeners[i];
                try {
                    out.push(l.apply(scope, args));
                } catch (e) {
                    console.error(e.message, e, args, l);
                    eve("global.error", undefined, e, l, args);
                }
                if (stop) {
                    break;
                }
            }

            // indexed.sort(numsort);
            // while (indexed[z] < 0) {
            //     l = queue[indexed[z++]];
            //     out.push(l.apply(scope, args));
            //     if (stop) {
            //         stop = oldstop;
            //         return out;
            //     }
            // }
            // for (i = 0; i < ii; ++i) {
            //     l = listeners[i];
            //     if ("zIndex" in l) {
            //         if (l.zIndex == indexed[z]) {
            //             out.push(l.apply(scope, args));
            //             if (stop) {
            //                 break;
            //             }
            //             do {
            //                 z++;
            //                 l = queue[indexed[z]];
            //                 l && out.push(l.apply(scope, args));
            //                 if (stop) {
            //                     break;
            //                 }
            //             } while (l)
            //         } else {
            //             queue[l.zIndex] = l;
            //         }
            //     } else {
            //         out.push(l.apply(scope, args));
            //         if (stop) {
            //             break;
            //         }
            //     }
            // }

            stop = oldstop;
            current_event = ce;

            if (eve._log) {
                if (!group) group = "global";
                if (!eve._log[group]) {
                    eve._log[group] = {};
                }
                name = (isArray(name)) ? name.join(separator) : name;
                if (!eve._log[group][name]) {
                    eve._log[group][name] = [1, listeners.length];
                } else {
                    eve._log[group][name][0]++;
                    eve._log[group][name][1] = Math.max(eve._log[group][name][1], listeners.length);
                }
            }

            return out;
        };

    eve.isEve = true;

    eve.localEve = function (group_id) {
        eve.setGroup(group_id);
        const ret_eve = function (name, scope) {
            let args = [{id: group_id}, ...Array.prototype.slice.call(arguments)];
            return eve.apply(undefined, args);
        }

        ret_eve.group = group_id;

        ret_eve.on = function (name, f) {
            return eve.on(name, f, group_id);
        }

        ret_eve.once = function (name, f) {
            return eve.once(name, f, group_id);
        }

        ret_eve.filter = function (name, data) {
            return eve.filter({id: group_id}, name, data);
        }

        ret_eve.off = ret_eve.unbind = function (name, f) {
            return eve.unbind(name, f, group_id);
        }

        ret_eve.f = function (name) {
            const attrs = [].slice.call(arguments, 1);
            return function () {
                eve.apply(null, [{id: group_id}, name, null].concat(attrs).concat([].slice.call(arguments, 0)));
            };
        }

        for (let f in eve) if (eve.hasOwnProperty(f) && !ret_eve[f]) {
            ret_eve[f] = eve[f];
        }

        return ret_eve;
    }
    eve.logEvents = function (off) {
        if (off) {
            delete eve._log;
        } else {
            eve._log = {};
        }
    }
    // Undocumented. Debug only.
    eve._events = events.n;
    eve._all_events = event_groups;
    eve._snap_events = global_event.n;

    eve.group = undefined;
    /*\
     * eve.listeners
     [ method ]

     * Internal method which gives you array of all event handlers that will be triggered by the given `name`.

     - name (string) name of the event, dot (`.`) or slash (`/`) separated

     = (array) array of event handlers
    \*/
    eve.listeners = function (name, group, skip_global) {
        const names = isArray(name) ? name : name.split(separator);
        let e = undefined,
            item,
            items,
            k,
            i,
            ii,
            j,
            jj,
            nes,
            es = [undefined],
            out = [];
        for (i = 0, ii = names.length; i < ii; ++i) {
            nes = [];
            for (j = 0, jj = es.length; j < jj; j++) {
                e = getNext(es[j], names[i], group, skip_global);  //es[j].n;
                for (k = 0; k < 2; k++) {
                    item = [e[names[i]], e[wildcard]][k];
                    if (item) {
                        nes.push(item);
                        out = out.concat(item.f || []);
                    }
                }
            }
            es = nes;
        }
        if (group && group !== 'default') out = out.concat(eve.listeners(name, 'default', true)); //add default events last
        return out;
    };
    /*\
     * eve.separator
     [ method ]

     * If for some reasons you don’t like default separators (`.` or `/`) you can specify yours
     * here. Be aware that if you pass a string longer than one character it will be treated as
     * a list of characters.

     - separator (string) new separator. Empty string resets to default: `.` or `/`.
    \*/
    eve.separator = function (sep) {
        if (sep) {
            sep = Str(sep).replace(/(?=[\.\^\]\[\-])/g, "\\");
            sep = "[" + sep + "]";
            separator = new RegExp(sep);
        } else {
            separator = /[\.\/]/;
        }
    };

    eve.setGroup = function (group) {
        // if (!group) throw new Error("group must be defined");

        if (!group) {
            events = event_groups.default;
            if (eve.hasOwnProperty("_events")) eve._events = events.n;
            return;
        }
        if (!event_groups.hasOwnProperty(group)) {
            event_groups[group] = {n: {}};
        }

        events = event_groups[group];
        if (eve.hasOwnProperty("_events")) eve._events = events.n;
    };

    eve.fireInGroup = function (group) {
        const args = Array.from(arguments).slice(1);
        if (!event_groups.hasOwnProperty(group)) {
            return eve.apply(undefined, args);
        }
        const old_eve = events;
        events = event_groups[group];
        const ret = eve.apply(undefined, args);
        events = old_eve;
        return ret;
    };

    /*\
        * eve.addGlobalEventType
        * Adds a global event type to the global event list.
        * Be aware that this will not add the event to the local event list. Adding a global type may prevent local events
        * starting with the same name from being triggered.
     */
    eve.addGlobalEventType = function (name) {
        if (!global_event.n.hasOwnProperty(name)) {
            global_event.n[name] = {n: {}};
        }
    }

    /*\
     * eve.on
     [ method ]
     **
     * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
     | eve.on("*.under.*", f);
     | eve("mouse.under.floor"); // triggers f
     * Use @eve to trigger the listener.
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     - name (array) if you don’t want to use separators, you can use array of strings
     - f (function) event handler function
     **
     = (function) returned function accepts a single numeric parameter that represents z-index of the handler. It is an optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment.
     > Example:
     | eve.on("mouse", eatIt)(2);
     | eve.on("mouse", scream);
     | eve.on("mouse", catchIt)(1);
     * This will ensure that `catchIt` function will be called before `eatIt`.
     *
     * If you want to put your handler before non-indexed handlers, specify a negative value.
     * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
    \*/
    eve.on = function (name, f, group) {
        if (typeof f != "function") {
            return function () {
            };
        }

        if (group && !event_groups.hasOwnProperty(group)) {
            event_groups[group] = {n: {}};
        }

        const names = isArray(name) ? isArray(name[0]) ? name : [name] : Str(name).split(comaseparator);
        f.zIndex = xIndex_cur;
        xIndex_cur += 1e-12;
        const process_name = function (name) {
            const names = isArray(name) ? name : Str(name).split(separator);
            let e, exist, n;
            for (var i = 0, ii = names.length; i < ii; ++i) {
                n = names[i];
                e = getNext(e, n, group);
                e = e.hasOwnProperty(n) && e[n] || (e[n] = {n: {}});
            }
            e.f = e.f || [];
            for (i = 0, ii = e.f.length; i < ii; ++i) if (e.f[i] === f) {
                exist = true;
                break;
            }
            !exist && e.f.push(f);
        };
        for (var i = 0, ii = names.length; i < ii; ++i) {
            (process_name(names[i]));
        }
        return function (zIndex) {
            if (+zIndex == +zIndex) {
                f.zIndex = +zIndex;
            }
        };
    };
    /*\
     * eve.f
     [ method ]
     **
     * Returns function that will fire given event with optional arguments.
     * Arguments that will be passed to the result function will be also
     * concated to the list of final arguments.
     | el.onclick = eve.f("click", 1, 2);
     | eve.on("click", function (a, b, c) {
     |     console.log(a, b, c); // 1, 2, [event object]
     | });
     - event (string) event name
     - varargs (…) and any other arguments
     = (function) possible event handler function
    \*/
    eve.f = function (event) {
        const attrs = [].slice.call(arguments, 1);
        return function () {
            eve.apply(null, [event, null].concat(attrs).concat([].slice.call(arguments, 0)));
        };
    };
    /*\
     * eve.stop
     [ method ]
     **
     * Is used inside an event handler to stop the event, preventing any subsequent listeners from firing.
    \*/
    eve.stop = function () {
        stop = 1;
    };
    /*\
     * eve.nt
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     - subname (string) #optional subname of the event
     **
     = (string) name of the event, if `subname` is not specified
     * or
     = (boolean) `true`, if current event’s name contains `subname`
    \*/
    eve.nt = function (subname) {
        const cur = isArray(current_event) ? current_event.join(".") : current_event;
        if (subname) {
            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(cur);
        }
        return cur;
    };
    /*\
     * eve.nts
     [ method ]
     **
     * Could be used inside event handler to figure out actual name of the event.
     **
     **
     = (array) names of the event
    \*/
    eve.nts = function () {
        return isArray(current_event) ? current_event : current_event.split(separator);
    };
    /*\
     * eve.off
     [ method ]
     **
     * Removes given function from the list of event listeners assigned to given name.
     * If no arguments specified all the events will be cleared.
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
    \*/
    /*\
     * eve.unbind
     [ method ]
     **
     * See @eve.off
    \*/
    eve.off = eve.unbind = function (name, f, group) {
        if (!name) {
            events = {n: {}};
            if (eve.hasOwnProperty("_events")) eve._events = events.n;
            return;
        }
        let names = isArray(name) ? isArray(name[0]) ? name : [name] : Str(name).split(comaseparator);
        if (names.length > 1) {
            for (var i = 0, ii = names.length; i < ii; ++i) {
                eve.off(names[i], f, group);
            }
            return;
        }
        names = isArray(name) ? name : Str(name).split(separator);
        var e,
            key,
            splice,
            i, ii, j, jj,
            inodes = [],
            events_here = (group) ? event_groups[group] : events;
        events_here = events_here || events;
        const cur = [events_here, global_event];

        for (i = 0, ii = names.length; i < ii; ++i) {
            for (j = 0; j < cur.length; j += splice.length - 2) {
                splice = [j, 1];
                e = cur[j].n;
                if (names[i] != wildcard) {
                    if (e[names[i]]) {
                        splice.push(e[names[i]]);
                        inodes.unshift({
                            n: e,
                            name: names[i]
                        });
                    }
                } else {
                    for (key in e) if (e[has](key)) {
                        splice.push(e[key]);
                        inodes.unshift({
                            n: e,
                            name: key
                        });
                    }
                }
                cur.splice.apply(cur, splice);
            }
        }
        for (i = 0, ii = cur.length; i < ii; ++i) {
            e = cur[i];
            while (e.n) {
                if (f) {
                    if (e.f) {
                        for (j = 0, jj = e.f.length; j < jj; j++) if (e.f[j] == f) {
                            e.f.splice(j, 1);
                            break;
                        }
                        !e.f.length && delete e.f;
                    }
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        const funcs = e.n[key].f;
                        for (j = 0, jj = funcs.length; j < jj; j++) if (funcs[j] == f) {
                            funcs.splice(j, 1);
                            break;
                        }
                        !funcs.length && delete e.n[key].f;
                    }
                } else {
                    delete e.f;
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        delete e.n[key].f;
                    }
                }
                e = e.n;
            }
        }
        // prune inner nodes in path
        prune: for (i = 0, ii = inodes.length; i < ii; ++i) {
            e = inodes[i];
            for (key in e.n[e.name].f) {
                // not empty (has listeners)
                continue prune;
            }
            for (key in e.n[e.name].n) {
                // not empty (has children)
                continue prune;
            }
            // is empty
            delete e.n[e.name];
        }
    };

    /**
     * eve.is
     * [ method ]
     * Checks if the given event is registered with the given function.
     * @type {(function(*, *, *): (boolean))|*}
     */
    eve.is = function (name, f, group) {
        if (!name || typeof f !== 'function') {
            return false;
        }

        let names = Array.isArray(name) ? (Array.isArray(name[0]) ? name : [name]) : String(name).split(comaseparator);
        if (names.length > 1) {
            for (let i = 0, ii = names.length; i < ii; ++i) {
                if (eve.is(names[i], f, group)) {
                    return true;
                }
            }
            return false;
        }

        names = Array.isArray(name) ? name : String(name).split(separator);
        let e,
            key,
            i, ii, j, jj,
            events_here = (group) ? event_groups[group] : events;
        events_here = events_here || events;
        const cur = [events_here, global_event];

        for (i = 0, ii = names.length; i < ii; ++i) {
            for (j = 0; j < cur.length; j++) {
                e = cur[j].n;
                if (names[i] != wildcard) {
                    if (e[names[i]]) {
                        e = e[names[i]];
                    } else {
                        return false;
                    }
                } else {
                    for (key in e) if (e.hasOwnProperty(key)) {
                        if (isRegistered(key, f, group)) {
                            return true;
                        }
                    }
                    return false;
                }
            }
        }

        while (e.n) {
            if (e.f) {
                for (j = 0, jj = e.f.length; j < jj; j++) {
                    if (e.f[j] === f) {
                        return true;
                    }
                }
            }
            e = e.n;
        }

        return false;
    }


    /*\
     * eve.once
     [ method ]
     **
     * Binds given event handler with a given name to only run once then unbind itself.
     | eve.once("login", f);
     | eve("login"); // triggers f
     | eve("login"); // no listeners
     * Use @eve to trigger the listener.
     **
     - name (string) name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
     - f (function) event handler function
     **
     = (function) same return function as @eve.on
    \*/
    eve.once = function (name, f, group) {
        const f2 = function () {
            eve.off(name, f2, group);
            let apply;
            try {
                apply = f.apply(this, arguments);
            } catch (e) {
                console.error("error:", e, arguments, f);
            }
            return apply;
        };
        return eve.on(name, f2, group);
    };

    /**
     * Fires an event for filter functions. By setting up a context around an eve call.
     *
     * All filter functions will have a 'this' object with a field this.data containing the input data for the filter.
     * The filter functions need not return any values, but should modify the this.data instead, to be passed to the next
     * filter. All additional arguments to eve.filter will be passed to all filter functions.
     *
     * The this object also contains the boolean this.isFilter to allow verification that the function is called in the
     * filter context. The same event may be called directly with eve, so it is recommended to check for proper this and isFilter.
     *
     * All filter functions should be registered as listeners to the event in the normal way with eve.on (or eve.once)
     * and ordered in the usual way. It is up to the developer to decide which events are normal and which are filters.
     *
     * @param name the name of the event
     * @param data the initial data to be filtered
     * @return {*} the final data after the filtering.
     */
    eve.filter = function (group, name, data) {
        let argumentsArray;
        if (Array.isArray(group) || typeof group === "string") {
            argumentsArray = Array.prototype.slice.call(arguments, 2)
            data = name;
            name = group;
            group = {id: undefined};
        }
        if (typeof group === "object" && group.eve) {
            data = name;
            name = group.eve
        }
        const container = {
            data: data,
            isFilter: true
        };
        argumentsArray = argumentsArray || Array.from(arguments).slice(3);
        eve.apply(undefined, [group, name, container, ...argumentsArray]);
        return container.data;
    };

    /*\
     * eve.version
     [ property (string) ]
     **
     * Current version of the library.
    \*/
    eve.version = version;
    eve.toString = function () {
        return "You are running Eve " + version;
    };

    if (!glob.eve_ia) {
        glob.eve_ia = eve;
        typeof module != "undefined" && module.exports ? module.exports = eve : typeof define === "function" && define.amd ? define("eve_ia", [], function () {
            return eve;
        }) : glob.eve_ia = eve;
    }

    glob.eve = glob.eve || eve;

})(typeof window !== "undefined" ? window : (global || this));

(function (glob, factory) {
    // AMD support
    if (typeof define == "function" && define.amd) {
        // Define as an anonymous module
        define(["eve_ia"], function (eve) {
            return factory(glob, eve);
        });
    } else if (typeof exports != "undefined") {
        // Next for Node.js or CommonJS
        var eve = require("eve_ia");
        var mina = require("mina_ia");
        module.exports = factory(glob, eve, mina);
    } else {
        // Browser globals (glob is window)
        // Snap adds itself to window
        factory(glob, glob.eve_ia, glob.mina);
    }
}(typeof window !== "undefined" ? window : (global || this), function (window, eve, mina) {
//amd-Banner
    "use strict";

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

    function ID() {
        return idprefix + (idgen++).toString(36);
    }

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

    function sta(val) {
        if (val == null) {
            return this.s;
        }
        const ds = this.s - val;
        this.b += this.dur * ds;
        this.B += this.dur * ds;
        this.s = val;
    }

    function speed(val) {
        if (val == null) {
            return this.spd;
        }
        this.spd = val;
    }

    function duration(val) {
        if (val == null) {
            return this.dur;
        }
        this.s = this.s * val / this.dur;
        this.dur = val;
    }

    function stopit() {
        delete animations[this.id];
        this.update();
        eve(["snap", "mina", "stop", this.id], this);
    }

    function pause() {
        if (this.pdif) {
            return;
        }
        delete animations[this.id];
        this.update();
        this.pdif = this.get() - this.b;
    }

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

    function reverse(fast) {
        this.rev = !this.rev;
        this.rev_fast = !!fast;
    }

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

    /*\
 * mina
 [ method ]
 **
 * Generic animation of numbers
 **
 - a (number) start _slave_ number
 - A (number) end _slave_ number
 - b (number) start _master_ number (start time in general case)
 - B (number) end _master_ number (end time in general case)
 - get (function) getter of _master_ number (see @mina.time)
 - set (function) setter of _slave_ number
 - easing (function) #optional easing function, default is @mina.linear
 = (object) animation descriptor
 o {
 o         id (string) animation id,
 o         start (number) start _slave_ number,
 o         end (number) end _slave_ number,
 o         b (number) start _master_ number,
 o         s (number) animation status (0..1),
 o         dur (number) animation duration,
 o         spd (number) animation speed,
 o         get (function) getter of _master_ number (see @mina.time),
 o         set (function) setter of _slave_ number,
 o         easing (function) easing function, default is @mina.linear,
 o         status (function) status getter/setter,
 o         speed (function) speed getter/setter,
 o         duration (function) duration getter/setter,
 o         stop (function) animation stopper
 o         pause (function) pauses the animation
 o         resume (function) resumes the animation
 o         update (function) calles setter with the right value of the animation
 o }
\*/
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
            this.done = function () {
                return this.status() === 1
            };
        }
    }

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

    mina.Animation = Animation;

    /*\
     * mina.time
     [ method ]
     **
     * Returns the current time. Equivalent to:
     | function () {
     |     return (new Date).getTime();
     | }
    \*/
    mina.time = timer;
    /*\
     * mina.getById
     [ method ]
     **
     * Returns an animation by its id
     - id (string) animation's id
     = (object) See @mina
    \*/
    mina.getById = function (id) {
        return animations[id] || null;
    };

    /*\
     * mina.linear
     [ method ]
     **
     * Default linear easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.linear = function (n) {
        return n;
    };
    /*\
     * mina.easeout
     [ method ]
     **
     * Easeout easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.easeout = function (n) {
        return Math.pow(n, 1.7);
    };
    /*\
     * mina.easein
     [ method ]
     **
     * Easein easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.easein = function (n) {
        return Math.pow(n, .48);
    };
    /*\
     * mina.easeinout
     [ method ]
     **
     * Easeinout easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
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
    /*\
     * mina.backin
     [ method ]
     **
     * Backin easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.backin = function (n) {
        if (n == 1) {
            return 1;
        }
        const s = 1.70158;
        return n * n * ((s + 1) * n - s);
    };
    /*\
     * mina.backout
     [ method ]
     **
     * Backout easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
    mina.backout = function (n) {
        if (n == 0) {
            return 0;
        }
        n = n - 1;
        const s = 1.70158;
        return n * n * ((s + 1) * n + s) + 1;
    };
    /*\
     * mina.elastic
     [ method ]
     **
     * Elastic easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
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
    mina.elastic.withParams = function (amp, per) {
        return mina.elastic.bind(undefined, amp, per);
    };

    /*\
     * mina.bounce
     [ method ]
     **
     * Bounce easing
     - n (number) input 0..1
     = (number) output 0..1
    \*/
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
    mina.isEasing = function (name) {
        return mina.hasOwnProperty(name) && !non_easing_functions[name]
    };

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

    mina.setSkip = function (skip) {
        global_skip = Math.floor(+skip);
        Object.values(animations).forEach(function (anim) {
            anim.skip = global_skip;
        });
    }

    mina.setTimeout = function (callback, deley, ...args) {
        deley *= global_speed
        return setTimeout(callback, deley, ...args);
    }

    mina.setTimeoutNow = function (callback, deley, ...args) {
        deley *= global_speed
        return (deley) ? setTimeout(callback, deley, ...args) : callback(...args);
    }

    mina.setInterval = function (callback, interval, ...args) {
        interval *= global_speed;
        return setInterval(callback, interval, ...args);
    };

    mina.trakSkippedFrames = function (frame_time) {
        expectedFrameDuration = (frame_time === undefined) ? 18 // a bit longer than 60fps frame
            : +(frame_time || 0)
    }

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
        Snap.version = '1.1';

        const eve = eve_ia;

        /*\
         * Snap
         [ method ]
         **
         * Creates a drawing surface or wraps existing SVG element.
         **
         - width (number|string) width of surface
         - height (number|string) height of surface
         * or
         - DOM (SVGElement) element to be wrapped into Snap structure
         * or
         - array (array) array of elements (will return set of elements)
         * or
         - query (string) CSS query selector
         = (object) @Element
        \*/
        function Snap(w, h) {
            if (w) {
                if (w.nodeType || (Snap._.glob.win.jQuery && w instanceof jQuery)) {
                    return wrap(w);
                }
                if (is(w, 'array') && Snap.set) {
                    return Snap.set.apply(Snap, w);
                }
                if (w instanceof Element) {
                    return w;
                }
                if (typeof w === "string") {
                    const match = w.trim().match(/^<((?!xml)[A-Za-z_][A-Za-z0-9-_.]*)\s*\/?>$/i);
                    if (match && match[1]) {
                        const el = wrap(glob.doc.createElement(match[1]));
                        if (typeof h === 'object') {
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
            w = w == null ? '100%' : w;
            h = h == null ? '100%' : h;
            return new Paper(w, h);
        }

        Snap.toString = function () {
            return 'Snap v' + this.version;
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
                case 'element':
                    return Element.prototype;
                case 'paper':
                    return Paper.prototype;
                case 'fragment':
                    return Fragment.prototype;
            }
        };

        Snap._dataEvents = false;
        Snap.enableDataEvents = function (off) {
            Snap._dataEvents = !off;
        }

        const has = 'hasOwnProperty',
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
            E = '';
        let S = ' ';
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
            'alignment-baseline': 0,
            'baseline-shift': 0,
            'clip': 0,
            'clip-path': 0,
            'clip-rule': 0,
            'color': 0,
            'color-interpolation': 0,
            'color-interpolation-filters': 0,
            'color-profile': 0,
            'color-rendering': 0,
            'cursor': 0,
            'direction': 0,
            'display': 0,
            'dominant-baseline': 0,
            'enable-background': 0,
            'fill': 0,
            'fill-opacity': 0,
            'fill-rule': 0,
            'filter': 0,
            'flood-color': 0,
            'flood-opacity': 0,
            'font': 0,
            'font-family': 0,
            'font-size': 0,
            'font-size-adjust': 0,
            'font-stretch': 0,
            'font-style': 0,
            'font-variant': 0,
            'font-weight': 0,
            'glyph-orientation-horizontal': 0,
            'glyph-orientation-vertical': 0,
            'image-rendering': 0,
            'kerning': 0,
            'letter-spacing': 0,
            'lighting-color': 0,
            'marker': 0,
            'marker-end': 0,
            'marker-mid': 0,
            'marker-start': 0,
            'mask': 0,
            'opacity': 0,
            'overflow': 0,
            'pointer-events': 0,
            'shape-rendering': 0,
            'stop-color': 0,
            'stop-opacity': 0,
            'stroke': 0,
            'stroke-dasharray': 0,
            'stroke-dashoffset': 0,
            'stroke-linecap': 0,
            'stroke-linejoin': 0,
            'stroke-miterlimit': 0,
            'stroke-opacity': 0,
            'stroke-width': 0,
            'text-anchor': 0,
            'text-decoration': 0,
            'text-rendering': 0,
            'unicode-bidi': 0,
            'visibility': 0,
            'word-spacing': 0,
            'writing-mode': 0,
        };
        const geomAttr = {
            'x': 0,
            'y': 0,
            'width': 0,
            'height': 0,
            'r': 0,
            'rx': 0,
            'ry': 0,
            'x1': 0,
            'y1': 0,
            'x2': 0,
            'y2': 0,
            'points': 0,
            'd': 0,
            'dx': 0,
            'dy': 0,
        };
        const idprefix = 'S' + (+new Date).toString(36);
        const ID = function (el) {
            return (el && el.type ? el.type : E) + idprefix +
                (idgen++).toString(36);
        };
        const xlink = 'http://www.w3.org/1999/xlink';
        const xmlns = 'http://www.w3.org/2000/svg';
        const hub = {};
        const hub_rem = {};
        /*\
     * Snap.url
     [ method ]
     **
     * Wraps path into `"url('<path>')"`.
     - value (string) path
     = (string) wrapped path
    \*/
        const URL = Snap.url = function (url) {
            return 'url(#' + url + ')';
        };

        Snap.fixUrl = function (url) {
            return url.replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace('\\x27', "'")
                .replace('\\x26', '&');
        };

        Snap._.hub = hub;

        Snap.elementFormId = function (id) {
            if (is(id, 'element')) return id;
            return hub[id];
        }

        function $(el, attr) {
            if (attr) {
                if (el === '#text') {
                    el = glob.doc.createTextNode(attr.text || attr['#text'] || '');
                }
                if (el === '#comment') {
                    el = glob.doc.createComment(attr.text || attr['#text'] || '');
                }
                if (typeof el === 'string') {
                    el = $(el);
                }
                if (typeof attr === 'string') {
                    if (el.nodeType === 1) {
                        if (attr.substring(0, 6) === 'xlink:') {
                            return el.getAttributeNS(xlink, attr.substring(6));
                        }
                        if (attr.substring(0, 4) === 'xml:') {
                            return el.getAttributeNS(xmlns, attr.substring(4));
                        }
                        return el.getAttribute(attr);
                    } else if (attr === 'text') {
                        return el.nodeValue;
                    } else {
                        return null;
                    }
                }
                if (el.nodeType === 1) {
                    for (let key in attr) if (attr[has](key)) {
                        const val = Str(attr[key]);
                        if (val) {
                            if (key.substring(0, 6) === 'xlink:') {
                                el.setAttributeNS(xlink, key.substring(6), val);
                            } else if (key.substring(0, 4) === 'xml:') {
                                el.setAttributeNS(xmlns, key.substring(4), val);
                            } else {
                                el.setAttribute(key, val);
                            }
                        } else {
                            el.removeAttribute(key);
                        }
                    }
                } else if ('text' in attr) {
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

        function getAttrs(el) {
            const attrs = el.attributes;
            let name;
            const out = {};
            for (let i = 0; i < attrs.length; ++i) {
                if (attrs[i].namespaceURI === xlink) {
                    name = 'xlink:';
                } else {
                    name = '';
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

        function is(o, type) {
            type = Str.prototype.toLowerCase.call(type);
            if (type === 'finite') {
                return isFinite(o);
            }
            if (type === 'array' &&
                (o instanceof Array || Array.isArray && Array.isArray(o))) {
                return true;
            }
            if (type === "svgelement") {
                const name = o.constructor && o.constructor.name;
                return o instanceof SVGElement ||
                    (name && name.startsWith("SVG") && name.endsWith("Element"));
            }
            return type === 'null' && o == null ||
                type === typeof o && o !== null ||
                type === 'object' && o === Object(o) ||
                available_types.hasOwnProperty(type) && o instanceof available_types[type] ||
                objectToString.call(o).slice(8, -1).toLowerCase() === type;
        }

        /*\
         * Snap.format
         [ method ]
         **
         * Replaces construction of type `{<name>}` to the corresponding argument
         **
         - token (string) string to format
         - json (object) object which properties are used as a replacement
         = (string) formatted string
         > Usage
         | // this draws a rectangular shape equivalent to "M10,20h40v50h-40z"
         | paper.path(Snap.format("M{x},{y}h{dim.width}v{dim.height}h{dim['negative width']}z", {
         |     x: 10,
         |     y: 20,
         |     dim: {
         |         width: 40,
         |         height: 50,
         |         "negative width": -40
         |     }
         | }));
        \*/
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
                                typeof res === 'function' && isFunc && (res = res());
                            }
                        });
                    res = (res == null || res === obj ? all : res) + '';
                    return res;
                };
            return function (str, obj) {
                return Str(str).replace(tokenRegex, function (all, key) {
                    return replacer(all, key, obj);
                });
            };
        })();

        function clone(obj) {
            if (typeof obj === 'function' || Object(obj) !== obj) {
                return obj;
            }
            const res = new obj.constructor;
            for (let key in obj) if (obj[has](key)) {
                res[key] = clone(obj[key]);
            }
            return res;
        }

        Snap._.clone = clone;

        function repush(array, item) {
            let i = 0;
            const ii = array.length;
            for (; i < ii; ++i) if (array[i] === item) {
                return array.push(array.splice(i, 1)[0]);
            }
        }

        function cacher(f, scope, postprocessor) {
            function newf() {
                const arg = Array.prototype.slice.call(arguments, 0),
                    args = arg.join('\u2400'),
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

        function angle(x1, y1, x2, y2, x3, y3) {
            if (typeof x2 === 'object') {
                x3 = x2.x || x2[0] || 0;
                y3 = x2.y || x2[1] || 0;
            }
            if (typeof y1 === 'object') {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == 'object') {
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
                return (180 + math.atan2(-y, -x) * 180 / PI + 360) % 360;
            } else {
                return angle(x1, y1, x3, y3) - angle(x2, y2, x3, y3);
            }
        }

        function rad(deg) {
            return deg % 360 * PI / 180;
        }

        function deg(rad) {
            return rad * 180 / PI % 360;
        }

        function x_y() {
            return this.x + S + this.y;
        }

        function x_y_w_h() {
            return this.x + S + this.y + S + this.width + ' \xd7 ' + this.height;
        }

        /*\
         * Snap.rad
         [ method ]
         **
         * Transform angle to radians
         - deg (number) angle in degrees
         = (number) angle in radians
        \*/
        Snap.rad = rad;
        /*\
         * Snap.deg
         [ method ]
         **
         * Transform angle to degrees
         - rad (number) angle in radians
         = (number) angle in degrees
        \*/
        Snap.deg = deg;
        /*\
         * Snap.sin
         [ method ]
         **
         * Equivalent to `Math.sin()` only works with degrees, not radians.
         - angle (number) angle in degrees
         = (number) sin
        \*/
        Snap.sin = function (angle) {
            return math.sin(Snap.rad(angle));
        };
        /*\
         * Snap.tan
         [ method ]
         **
         * Equivalent to `Math.tan()` only works with degrees, not radians.
         - angle (number) angle in degrees
         = (number) tan
        \*/
        Snap.tan = function (angle) {
            return math.tan(Snap.rad(angle));
        };
        /*\
         * Snap.cotan
         [ method ]
         **
         * Evaluates cotangent of angle.
         - angle (number) angle in degrees
         = (number) tan
        \*/
        Snap.cot = function (angle) {
            return 1 / Snap.tan(angle);
        };

        /*\
         * Snap.cos
         [ method ]
         **
         * Equivalent to `Math.cos()` only works with degrees, not radians.
         - angle (number) angle in degrees
         = (number) cos
        \*/
        Snap.cos = function (angle) {
            return math.cos(Snap.rad(angle));
        };
        /*\
         * Snap.asin
         [ method ]
         **
         * Equivalent to `Math.asin()` only works with degrees, not radians.
         - num (number) value
         = (number) asin in degrees
        \*/
        Snap.asin = function (num) {
            return Snap.deg(math.asin(num));
        };
        /*\
         * Snap.acos
         [ method ]
         **
         * Equivalent to `Math.acos()` only works with degrees, not radians.
         - num (number) value
         = (number) acos in degrees
        \*/
        Snap.acos = function (num) {
            return Snap.deg(math.acos(num));
        };
        /*\
         * Snap.atan
         [ method ]
         **
         * Equivalent to `Math.atan()` only works with degrees, not radians.
         - num (number) value
         = (number) atan in degrees
        \*/
        Snap.atan = function (num) {
            return Snap.deg(math.atan(num));
        };
        /*\
         * Snap.atan2
         [ method ]
         **
         * Equivalent to `Math.atan2()` only works with degrees, not radians.
         - num (number) value
         = (number) atan2 in degrees
        \*/
        Snap.atan2 = function (num) {
            return Snap.deg(math.atan2(num));
        };
        /*\
         * Snap.angle
         [ method ]
         **
         * Returns an angle between two or three points
         - x1 (number) x coord of first point
         - y1 (number) y coord of first point
         - x2 (number) x coord of second point
         - y2 (number) y coord of second point
         - x3 (number) #optional x coord of third point
         - y3 (number) #optional y coord of third point
         = (number) angle in degrees
        \*/
        Snap.angle = angle;
        /*\
         * Snap.len
         [ method ]
         **
         * Returns distance between two points
         - x1 (number) x coord of first point
         - y1 (number) y coord of first point
         - x2 (number) x coord of second point
         - y2 (number) y coord of second point
         = (number) distance
        \*/
        Snap.len = function (x1, y1, x2, y2) {
            return Math.sqrt(Snap.len2(x1, y1, x2, y2));
        };
        /*\
         * Snap.len2
         [ method ]
         **
         * Returns squared distance between two points
         - x1 (number) x coord of first point
         - y1 (number) y coord of first point
         - x2 (number) x coord of second point
         - y2 (number) y coord of second point
         = (number) distance
        \*/
        Snap.len2 = function (x1, y1, x2, y2) {
            if (typeof y1 === 'object') {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == 'object') {
                y1 = x1.y || x1[1] || 0;
                x1 = x1.x || x1[0] || 0;
            }
            x2 = x2 || 0;
            y2 = y2 || 0;
            return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
        };
        /*\
         * Snap.closestPoint
         [ method ]
         **
         * Returns closest point to a given one on a given path.
         - path (Element) path element
         - x (number) x coord of a point
         - y (number) y coord of a point
         = (object) in format
         {
            x (number) x coord of the point on the path
            y (number) y coord of the point on the path
            length (number) length of the path to the point
            distance (number) distance from the given point to the path
         }
        \*/
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
        /*\
         * Snap.is
         [ method ]
         **
         * Handy replacement for the `typeof` operator
         - o (…) any object or primitive
         - type (string) name of the type, e.g., `string`, `function`, `number`, etc.
         = (boolean) `true` if given value is of given type
        \*/
        Snap.is = is;


        Snap.registerType = function (type, type_constr) {
            type = type.toLowerCase();
            available_types[type] = type_constr;
        }

        Snap.registerClass = Snap.registerType;

        Snap.getClass = function (type) {
            return available_types[type.toLowerCase()]
        }

        /*\
         * Snap.snapTo
         [ method ]
         **
         * Snaps given value to given grid
         - values (array|number) given array of values or step of the grid
         - value (number) value to adjust
         - tolerance (number) #optional maximum distance to the target value that would trigger the snap. Default is `10`.
         = (number) adjusted value
        \*/
        Snap.snapTo = function (values, value, tolerance) {
            tolerance = is(tolerance, 'finite') ? tolerance : 10;
            if (is(values, 'array')) {
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
        /*\
         * Snap.getRGB
         [ method ]
         **
         * Parses color string as RGB object
         - color (string) color string in one of the following formats:
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
         = (object) RGB object in the following format:
         o {
         o     r (number) red,
         o     g (number) green,
         o     b (number) blue,
         o     hex (string) color in HTML/CSS format: #••••••,
         o     error (boolean) true if string can't be parsed
         o }
        \*/
        Snap.getRGB = cacher(function (colour) {
            if (!colour || !!((colour = Str(colour)).indexOf('-') + 1)) {
                return {
                    r: -1,
                    g: -1,
                    b: -1,
                    hex: 'none',
                    error: 1,
                    toString: rgbtoString,
                };
            }
            if (colour === 'none') {
                return {r: -1, g: -1, b: -1, hex: 'none', toString: rgbtoString};
            }
            !(hsrg[has](colour.toLowerCase().substring(0, 2)) || colour.charAt() ===
                '#') && (colour = toHex(colour));
            if (!colour) {
                return {
                    r: -1,
                    g: -1,
                    b: -1,
                    hex: 'none',
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
                    values[0].slice(-1) === '%' && (red *= 2.55);
                    green = toFloat(values[1]);
                    values[1].slice(-1) === '%' && (green *= 2.55);
                    blue = toFloat(values[2]);
                    values[2].slice(-1) === '%' && (blue *= 2.55);
                    rgb[1].toLowerCase().slice(0, 4) === 'rgba' &&
                    (opacity = toFloat(values[3]));
                    values[3] && values[3].slice(-1) === '%' && (opacity /= 100);
                }
                if (rgb[5]) {
                    values = rgb[5].split(commaSpaces);
                    red = toFloat(values[0]);
                    values[0].slice(-1) === '%' && (red /= 100);
                    green = toFloat(values[1]);
                    values[1].slice(-1) === '%' && (green /= 100);
                    blue = toFloat(values[2]);
                    values[2].slice(-1) === '%' && (blue /= 100);
                    (values[0].slice(-3) === 'deg' || values[0].slice(-1) === '\xb0') &&
                    (red /= 360);
                    rgb[1].toLowerCase().slice(0, 4) === 'hsba' &&
                    (opacity = toFloat(values[3]));
                    values[3] && values[3].slice(-1) === '%' && (opacity /= 100);
                    return Snap.hsb2rgb(red, green, blue, opacity);
                }
                if (rgb[6]) {
                    values = rgb[6].split(commaSpaces);
                    red = toFloat(values[0]);
                    values[0].slice(-1) === '%' && (red /= 100);
                    green = toFloat(values[1]);
                    values[1].slice(-1) === '%' && (green /= 100);
                    blue = toFloat(values[2]);
                    values[2].slice(-1) === '%' && (blue /= 100);
                    (values[0].slice(-3) === 'deg' || values[0].slice(-1) === '\xb0') &&
                    (red /= 360);
                    rgb[1].toLowerCase().slice(0, 4) === 'hsla' &&
                    (opacity = toFloat(values[3]));
                    values[3] && values[3].slice(-1) === '%' && (opacity /= 100);
                    return Snap.hsl2rgb(red, green, blue, opacity);
                }
                red = mmin(math.round(red), 255);
                green = mmin(math.round(green), 255);
                blue = mmin(math.round(blue), 255);
                opacity = mmin(mmax(opacity, 0), 1);
                rgb = {r: red, g: green, b: blue, toString: rgbtoString};
                rgb.hex = '#' +
                    (16777216 | blue | green << 8 | red << 16).toString(16).slice(1);
                rgb.opacity = is(opacity, 'finite') ? opacity : 1;
                return rgb;
            }
            return {
                r: -1,
                g: -1,
                b: -1,
                hex: 'none',
                error: 1,
                toString: rgbtoString,
            };
        }, Snap);
        /*\
         * Snap.hsb
         [ method ]
         **
         * Converts HSB values to a hex representation of the color
         - h (number) hue
         - s (number) saturation
         - b (number) value or brightness
         = (string) hex representation of the color
        \*/
        Snap.hsb = cacher(function (h, s, b) {
            return Snap.hsb2rgb(h, s, b).hex;
        });
        /*\
         * Snap.hsl
         [ method ]
         **
         * Converts HSL values to a hex representation of the color
         - h (number) hue
         - s (number) saturation
         - l (number) luminosity
         = (string) hex representation of the color
        \*/
        Snap.hsl = cacher(function (h, s, l) {
            return Snap.hsl2rgb(h, s, l).hex;
        });
        /*\
         * Snap.rgb
         [ method ]
         **
         * Converts RGB values to a hex representation of the color
         - r (number) red
         - g (number) green
         - b (number) blue
         = (string) hex representation of the color
        \*/
        Snap.rgb = cacher(function (r, g, b, o) {
            if (is(o, 'finite')) {
                const round = math.round;
                return 'rgba(' + [round(r), round(g), round(b), +o.toFixed(2)] + ')';
            }
            return '#' + (16777216 | b | g << 8 | r << 16).toString(16).slice(1);
        });
        var toHex = function (color) {
                const i = glob.doc.getElementsByTagName('head')[0] ||
                        glob.doc.getElementsByTagName('svg')[0],
                    red = 'rgb(255, 0, 0)';
                toHex = cacher(function (color) {
                    if (color.toLowerCase() === 'red') {
                        return red;
                    }
                    i.style.color = red;
                    i.style.color = color;
                    const out = glob.doc.defaultView.getComputedStyle(i, E).getPropertyValue('color');
                    return out === red ? null : out;
                });
                return toHex(color);
            },
            hsbtoString = function () {
                return 'hsb(' + [this.h, this.s, this.b] + ')';
            },
            hsltoString = function () {
                return 'hsl(' + [this.h, this.s, this.l] + ')';
            },
            rgbtoString = function () {
                return this.opacity === 1 || this.opacity == null ?
                    this.hex :
                    'rgba(' + [this.r, this.g, this.b, this.opacity] + ')';
            },
            prepareRGB = function (r, g, b) {
                if (g == null && is(r, 'object') && 'r' in r && 'g' in r && 'b' in
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
                r = math.round(r * 255);
                g = math.round(g * 255);
                b = math.round(b * 255);
                const rgb = {
                    r: r,
                    g: g,
                    b: b,
                    opacity: is(o, 'finite') ? o : 1,
                    hex: Snap.rgb(r, g, b),
                    toString: rgbtoString,
                };
                is(o, 'finite') && (rgb.opacity = o);
                return rgb;
            };
        /*\
         * Snap.color
         [ method ]
         **
         * Parses the color string and returns an object featuring the color's component values
         - clr (string) color string in one of the supported formats (see @Snap.getRGB)
         = (object) Combined RGB/HSB object in the following format:
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
        \*/
        Snap.color = function (clr) {
            let rgb;
            if (is(clr, 'object') && 'h' in clr && 's' in clr && 'b' in clr) {
                rgb = Snap.hsb2rgb(clr);
                clr.r = rgb.r;
                clr.g = rgb.g;
                clr.b = rgb.b;
                clr.opacity = 1;
                clr.hex = rgb.hex;
            } else if (is(clr, 'object') && 'h' in clr && 's' in clr && 'l' in
                clr) {
                rgb = Snap.hsl2rgb(clr);
                clr.r = rgb.r;
                clr.g = rgb.g;
                clr.b = rgb.b;
                clr.opacity = 1;
                clr.hex = rgb.hex;
            } else {
                if (is(clr, 'string')) {
                    clr = Snap.getRGB(clr);
                }
                if (is(clr, 'object') && 'r' in clr && 'g' in clr && 'b' in clr &&
                    !('error' in clr)) {
                    rgb = Snap.rgb2hsl(clr);
                    clr.h = rgb.h;
                    clr.s = rgb.s;
                    clr.l = rgb.l;
                    rgb = Snap.rgb2hsb(clr);
                    clr.v = rgb.b;
                    clr.sv = rgb.s;
                } else {
                    clr = {hex: 'none'};
                    clr.r = clr.g = clr.b = clr.h = clr.s = clr.v = clr.l = clr.sv = -1;
                    clr.error = 1;
                }
            }
            clr.toString = rgbtoString;
            return clr;
        };
        /*\
         * Snap.hsb2rgb
         [ method ]
         **
         * Converts HSB values to an RGB object
         - h (number) hue
         - s (number) saturation
         - v (number) value or brightness
         = (object) RGB object in the following format:
         o {
         o     r (number) red,
         o     g (number) green,
         o     b (number) blue,
         o     hex (string) color in HTML/CSS format: #••••••
         o }
        \*/
        Snap.hsb2rgb = function (h, s, v, o) {
            if (is(h, 'object') && 'h' in h && 's' in h && 'b' in h) {
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
        /*\
         * Snap.hsl2rgb
         [ method ]
         **
         * Converts HSL values to an RGB object
         - h (number) hue
         - s (number) saturation
         - l (number) luminosity
         = (object) RGB object in the following format:
         o {
         o     r (number) red,
         o     g (number) green,
         o     b (number) blue,
         o     hex (string) color in HTML/CSS format: #••••••
         o }
        \*/
        Snap.hsl2rgb = function (h, s, l, o) {
            if (is(h, 'object') && 'h' in h && 's' in h && 'l' in h) {
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
        /*\
         * Snap.rgb2hsb
         [ method ]
         **
         * Converts RGB values to an HSB object
         - r (number) red
         - g (number) green
         - b (number) blue
         = (object) HSB object in the following format:
         o {
         o     h (number) hue,
         o     s (number) saturation,
         o     b (number) brightness
         o }
        \*/
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
        /*\
         * Snap.rgb2hsl
         [ method ]
         **
         * Converts RGB values to an HSL object
         - r (number) red
         - g (number) green
         - b (number) blue
         = (object) HSL object in the following format:
         o {
         o     h (number) hue,
         o     s (number) saturation,
         o     l (number) luminosity
         o }
        \*/
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
        /*\
         * Snap.parsePathString
         [ method ]
         **
         * Utility method
         **
         * Parses given path string into an array of arrays of path segments
         - pathString (string|array) path string or array of segments (in the last case it is returned straight away)
         = (array) array of segments
        \*/
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
            if (is(pathString, 'array') && is(pathString[0], 'array')) { // rough assumption
                data = Snap.path.clone(pathString);
            }
            if (!data.length) {
                Str(pathString).replace(pathCommand, function (a, b, c) {
                    const params = [];
                    let name = b.toLowerCase();
                    c.replace(pathValues, function (a, b) {
                        b && params.push(+b);
                    });
                    if (name === 'm' && params.length > 2) {
                        data.push([b].concat(params.splice(0, 2)));
                        name = 'l';
                        b = b === 'm' ? 'l' : 'L';
                    }
                    if (name === 'o' && params.length === 1) {
                        data.push([b, params[0]]);
                    }
                    if (name === 'r') {
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
        /*\
         * Snap.parseTransformString
         [ method ]
         **
         * Utility method
         **
         * Parses given transform string into an array of transformations
         - TString (string|array) transform string or array of transformations (in the last case it is returned straight away)
         = (array) array of transformations
        \*/
        const parseTransformString = Snap.parseTransformString = function (TString) {
            if (!TString) {
                return null;
            }
            const paramCounts = {r: 3, s: 4, t: 2, m: 6};
            let data = [];
            if (is(TString, 'array') && is(TString[0], 'array')) { // rough assumption
                data = Snap.path.clone(TString);
            }
            if (!data.length) {
                Str(TString).replace(tSrtToRemove, '').replace(tCommand, function (a, b, c) {
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

        function svgTransform2string(tstr) {
            const res = [];
            tstr = tstr.replace(/(?:^|\s)(\w+)\(([^)]+)\)/g,
                function (all, name, params) {
                    params = params.split(/\s*,\s*|\s+/);
                    if (name === 'rotate' && params.length === 1) {
                        params.push(0, 0);
                    }
                    if (name === 'scale') {
                        if (params.length > 2) {
                            params = params.slice(0, 2);
                        } else if (params.length === 2) {
                            params.push(0, 0);
                        }
                        if (params.length === 1) {
                            params.push(params[0], 0, 0);
                        }
                    }
                    if (name === 'skewX') {
                        res.push(['m', 1, 0, math.tan(rad(params[0])), 1, 0, 0]);
                    } else if (name === 'skewY') {
                        res.push(['m', 1, math.tan(rad(params[0])), 0, 1, 0, 0]);
                    } else {
                        res.push([name.charAt(0)].concat(params));
                    }
                    return all;
                });
            return res;
        }

        Snap._.svgTransform2string = svgTransform2string;
        Snap._.rgTransform = /^[a-z][\s]*-?\.?\d/i;

        function transform2matrix(tstr, el, without_transform) {
            const tdata = parseTransformString(tstr),
                m = new Snap.Matrix;
            if (tdata) {
                let x1,
                    y1,
                    x2,
                    y2,
                    bb;
                if (typeof el === 'object' && !(el instanceof Element)) {
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
                    if (command === 't' && tlen === 2) {
                        m.translate(t[1], 0);
                    } else if (command === 't' && tlen === 3) {
                        if (absolute) {
                            x1 = inver.x(0, 0);
                            y1 = inver.y(0, 0);
                            x2 = inver.x(t[1], t[2]);
                            y2 = inver.y(t[1], t[2]);
                            m.translate(x2 - x1, y2 - y1);
                        } else {
                            m.translate(t[1], t[2]);
                        }
                    } else if (command === 'r') {
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
                    } else if (command === 's') {
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
                    } else if (command === 'm' && tlen === 7) {
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

        function getSomeDefs(el) {
            const p = el.type === "svg" && el ||
                    el.node.ownerSVGElement && wrap(el.node.ownerSVGElement) ||
                    el.node.parentNode && wrap(el.node.parentNode) ||
                    Snap.select('svg') ||
                    Snap(0, 0),
                pdefs = p.select('defs');
            let defs = pdefs == null ? false : pdefs.node;
            if (!defs) {
                defs = make('defs', p.node).node;
            }
            return defs;
        }

        function getSomeSVG(el) {
            return el.node.ownerSVGElement && wrap(el.node.ownerSVGElement) ||
                Snap.select('svg');
        }

        Snap._.getSomeDefs = getSomeDefs;
        Snap._.getSomeSVG = getSomeSVG;

        function unit2px(el, name, value) {
            const svg = getSomeSVG(el).node;
            let out = {},
                mgr = svg.querySelector('.svg---mgr');
            if (!mgr) {
                mgr = $('rect');
                $(mgr, {
                    x: -9e9,
                    y: -9e9,
                    width: 10,
                    height: 10,
                    'class': 'svg---mgr',
                    fill: 'none',
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
                case 'rect':
                    set('rx', getW);
                    set('ry', getH);
                case 'image':
                case 'foreignObject':
                    set('width', getW);
                    set('height', getH);
                case 'text':
                    set('x', getW);
                    set('y', getH);
                    break;
                case 'circle':
                    set('cx', getW);
                    set('cy', getH);
                    set('r', getW);
                    break;
                case 'ellipse':
                    set('cx', getW);
                    set('cy', getH);
                    set('rx', getW);
                    set('ry', getH);
                    break;
                case 'line':
                    set('x1', getW);
                    set('x2', getW);
                    set('y1', getH);
                    set('y2', getH);
                    break;
                case 'marker':
                    set('refX', getW);
                    set('markerWidth', getW);
                    set('refY', getH);
                    set('markerHeight', getH);
                    break;
                case 'radialGradient':
                    set('fx', getW);
                    set('fy', getH);
                    break;
                case 'tspan':
                    set('dx', getW);
                    set('dy', getH);
                    break;
                default:
                    set(name, getW);
            }
            svg.removeChild(mgr);
            return out;
        }

        /*\
         * Snap.select
         [ method ]
         **
         * Wraps a DOM element specified by CSS selector as @Element
         - query (string) CSS selector of the element
         = (Element) the current element
        \*/
        Snap.select = function (query) {
            query = Str(query).replace(/([^\\]):/g, '$1\\:');
            return wrap(glob.doc.querySelector(query));
        };
        /*\
         * Snap.selectAll
         [ method ]
         **
         * Wraps DOM elements specified by CSS selector as set or array of @Element
         - query (string) CSS selector of the element
         = (Element) the current element
        \*/
        Snap.selectAll = function (query) {
            const nodelist = glob.doc.querySelectorAll(query),
                set = (Snap.set || Array)();
            for (let i = 0; i < nodelist.length; ++i) {
                set.push(wrap(nodelist[i]));
            }
            return set;
        };

        function add2group(list) {
            if (!is(list, 'array')) {
                list = Array.prototype.slice.call(arguments, 0);
            }
            let i = 0,
                j = 0;
            const node = this.node;
            while (this[i]) delete this[i++];
            for (i = 0; i < list.length; ++i) {
                if (list[i].type === 'set') {
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

        function Element(el) {
            if (el.snap in hub) {
                return hub[el.snap];
            }
            let svg;
            try {
                svg = el.ownerSVGElement;
            } catch (e) {
            }
            /*\
             * Element.node
             [ property (object) ]
             **
             * Gives you a reference to the DOM object, so you can assign event handlers or just mess around.
             > Usage
             | // draw a circle at coordinate 10,10 with radius of 10
             | var c = paper.circle(10, 10, 10);
             | c.node.onclick = function () {
             |     c.attr("fill", "red");
             | };
            \*/
            this.node = el;
            if (svg) {
                this.paper = new Paper(svg);
            }
            /*\
             * Element.type
             [ property (string) ]
             **
             * SVG tag name of the given element.
            \*/
            this.type = (el.tagName || el.nodeName
                || ((Snap._.glob.win.jQuery && el instanceof jQuery) ? 'jquery' : null));
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
            //     if (!Paper.prototype[method].skip) {
            //         if (this.type in {g: 1, mask: 1, pattern: 1, symbol: 1, clipPath: 1}) {
            //             this[method] = Paper.prototype[method];
            //         } else {
            //             this[method] = paperMetForNonGroups(this, method, this.paper)
            //         }
            //     }
            // }
        }

        /*\
          * Element.attr
          [ method ]
          **
          * Gets or sets given attributes of the element.
          **
          - params (object) contains key-value pairs of attributes you want to set
          * or
          - param (string) name of the attribute
          = (Element) the current element
          * or
          = (string) value of attribute
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
         \*/
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
            if (is(params, 'string')) {
                if (arguments.length > 1) {
                    const json = {};
                    json[params] = value;
                    params = json;
                } else {
                    return eve(['snap', 'util', 'getattr', params], el).firstDefined();
                }
            }
            for (let att in params) {
                if (params[has](att)) {
                    eve(['snap', 'util', 'attr', att], el, params[att]);
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
            svg = svg.replace(script_filter, '');
            svg = svg.replace(/\r?\n|\r/g, ' ');
            return svg;
        }

        function fixHref(svg) {
            return svg.replace(/xlink:href\s*=/gmi, 'href=');
        }

        /*\
         * Snap.parse
         [ method ]
         **
         * Parses SVG fragment and converts it into a @Fragment
         **
         - svg (string) SVG string
         = (Fragment) the @Fragment
        \*/
        Snap.parse = function (svg, filter_event) {
            let f = glob.doc.createDocumentFragment(),
                full = true;
            const div = glob.doc.createElement('div');
            svg = fixHref(sanitize(Str(svg)));

            if (!svg.match(/^\s*<\s*svg(?:\s|>)/)) {
                svg = '<svg>' + svg + '</svg>';
                full = false;
            }
            if (filter_event) svg = eve.filter(filter_event, svg);
            div.innerHTML = svg;
            svg = div.getElementsByTagName('svg')[0];
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

        function Fragment(frag) {
            this.node = frag;
        }

        /*\
         * Snap.fragment
         [ method ]
         **
         * Creates a DOM fragment from a given list of elements or strings
         **
         - varargs (…) SVG string
         = (Fragment) the @Fragment
        \*/
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
                if (typeof item === 'string') {
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

        function Paper(w, h) {
            let res,
                // desc,
                defs;
            const proto = Paper.prototype;
            if (w && w.tagName && w.tagName.toLowerCase() === 'svg') {
                if (w.snap in hub) {
                    return hub[w.snap];
                }
                const doc = w.ownerDocument;
                res = new Element(w);
                // desc = w.getElementsByTagName('desc')[0];
                defs = w.getElementsByTagName('defs')[0];
                // if (!desc) {
                //     desc = $('desc');
                //     desc.appendChild(doc.createTextNode('Created with Snap'));
                //     res.node.appendChild(desc);
                // }
                if (!defs) {
                    defs = $('defs');
                    res.node.appendChild(defs);
                }
                res.defs = defs;
                for (let key in proto) if (proto[has](key)) {
                    res[key] = proto[key];
                }
                res.paper = res.root = res;
            } else {
                res = make('svg', glob.doc.body);
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
            if (dom.tagName && dom.tagName.toLowerCase() === 'svg') {
                return new Paper(dom);
            }
            if (dom.tagName && dom.tagName.toLowerCase() === 'object' &&
                dom.type === 'image/svg+xml') {
                return new Paper(dom.contentDocument.getElementsByTagName('svg')[0]);
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
            temp_clone.removeAttribute('transform');
            Snap._.measureSVG.node.appendChild(temp_clone);
            const rect = temp_clone.getBoundingClientRect();
            const parent_rect = Snap._.measureSVG.node.getBoundingClientRect();
            temp_clone.remove();
            return {
                left: rect.left - parent_rect.left, top: rect.top - parent_rect.top,
                width: rect.width, height: rect.height
            };

        }

        /*\
         * Paper.el
         [ method ]
         **
         * Creates an element on paper with a given name and no attributes
         **
         - name (string) tag name
         - attr (object) attributes
         = (Element) the current element
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
        \*/
        Paper.prototype.el = function (name, attr) {
            const el = make(name, this.node);
            attr && el.attr(attr);
            return el;
        };
        /*\
         * Element.children
         [ method ]
         **
         * Returns array of all the children of the element.
         = (array) array of Elements
        \*/
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

        /*\
         * Element.toJSON
         [ method ]
         **
         * Returns object representation of the given element and all its children.
         = (object) in format
         o {
         o     type (string) this.type,
         o     attr (object) attributes map,
         o     childNodes (array) optional array of children in the same format
         o }
        \*/
        Element.prototype.toJSON = function () {
            const out = [];
            jsonFiller([this], out);
            return out[0];
        };
// default
        eve.on('snap.util.getattr', function () {
            let att = eve.nt();
            att = att.substring(att.lastIndexOf('.') + 1);
            const css = att.replace(/[A-Z]/g, function (letter) {
                return '-' + letter.toLowerCase();
            });
            if (cssAttr[has](css)) {
                const propertyValue = (this.type === 'jquery') ?
                    this.node.css(css) :
                    this.node.ownerDocument.defaultView.getComputedStyle(this.node,
                        null).getPropertyValue(css);
                return propertyValue;
            } else {
                const attr = (this.type === 'jquery') ?
                    this.node.attr(att) :
                    $(this.node, att);
                return attr;
            }
        });


        eve.on('snap.util.attr', function (value) {
            let att = eve.nt();
            const attr = {};
            att = att.substring(att.lastIndexOf('.') + 1);
            value = value == null ? E : value;
            attr[att] = value;
            const style = att.replace(/-(\w)/gi, function (all, letter) {
                    return letter.toUpperCase();
                }),
                css = att.replace(/[A-Z]/g, function (letter) {
                    return '-' + letter.toLowerCase();
                });
            if (cssAttr[has](css)) {
                attr[att] = '';
                $(this.node, attr);
                if (this.type === 'jquery') {
                    this.node.css(style, value);
                } else {
                    this.node.style[style] = value;
                }
            } else if (css === 'transform' && !(is(this.node, "SVGElement"))) {
                this.node.style[style] = value;
            } else {
                $(this.node, attr);
                if (this.type === 'jquery') {
                    this.node.attr(attr);
                }
                if (geomAttr[has](att)) this.clearCHull() //.c_hull = undefined;
            }
        });
        (function (proto) {
        }(Paper.prototype));

// simple ajax
        /*\
         * Snap.ajax
         [ method ]
         **
         * Simple implementation of Ajax
         **
         - url (string) URL
         - postData (object|string) data for post request
         - callback (function) callback
         - scope (object) #optional scope of callback
         * or
         - url (string) URL
         - callback (function) callback
         - scope (object) #optional scope of callback
         = (XMLHttpRequest) the XMLHttpRequest object, just in case
        \*/
        Snap.ajax = function (
            url, postData, callback, scope, fail_callback, fail_scope) {
            const req = new XMLHttpRequest,
                id = ID();
            if (req) {
                if (is(postData, 'function')) {
                    fail_scope = fail_callback;
                    fail_callback = scope;
                    scope = callback;
                    callback = postData;
                    postData = null;
                } else if (is(postData, 'object')) {
                    const pd = [];
                    for (let key in postData) if (postData.hasOwnProperty(key)) {
                        pd.push(encodeURIComponent(key) + '=' +
                            encodeURIComponent(postData[key]));
                    }
                    postData = pd.join('&');
                }

                if (is(scope, 'function')) {
                    fail_scope = fail_callback;
                    fail_callback = scope;
                }

                req.open(postData ? 'POST' : 'GET', Snap.fixUrl(url), true);
                if (postData) {
                    req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                    req.setRequestHeader('Content-type',
                        'application/x-www-form-urlencoded');
                }
                if (callback) {
                    eve.once('snap.ajax.' + id + '.success', callback);
                }
                if (fail_callback && fail_scope) {
                    fail_callback = fail_callback.bind(fail_scope);
                }
                if (fail_callback) {
                    eve.once('snap.ajax.' + id + '.fail', fail_callback);
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
                        eve(['snap', 'ajax', id, 'success'], scope, this);
                        eve.unbind('snap.ajax.' + id + '.fail', fail_callback);
                    } else {
                        eve(['snap', 'ajax', id, 'fail'], fail_scope, this);
                        eve.unbind('snap.ajax.' + id + '.success', callback);
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
        /*\
         * Snap.load
         [ method ]
         **
         * Loads external SVG file as a @Fragment (see @Snap.ajax for more advanced AJAX)
         **
         - url (string|arra) URL or [URL, post-data]
         - callback (function) callback
         - scope (object) #optional scope of callback
         - data {svg string} allows for inclusion of cached data, and avoids the network call
        \*/
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
        /*\
         * Snap.getElementByPoint
         [ method ]
         **
         * Returns you topmost element under given point.
         **
         = (object) Snap element object
         - x (number) x coordinate from the top left corner of the window
         - y (number) y coordinate from the top left corner of the window
         > Usage
         | Snap.getElementByPoint(mouseX, mouseY).attr({stroke: "#f00"});
        \*/
        Snap.getElementByPoint = function (x, y) {
            const paper = this,
                svg = paper.canvas;
            let target = glob.doc.elementFromPoint(x, y);
            if (glob.win.opera && target.tagName === 'svg') {
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
        /*\
         * Snap.plugin
         [ method ]
         **
         * Let you write plugins. You pass in a function with five arguments, like this:
         | Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {
         |     Snap.newmethod = function () {};
         |     Element.prototype.newmethod = function () {};
         |     Paper.prototype.newmethod = function () {};
         | });
         * Inside the function you have access to all main objects (and their
         * prototypes). This allow you to extend anything you want.
         **
         - f (function) your plugin body
        \*/
        Snap.plugin = function (f) {
            f(Snap, Element, Paper, glob, Fragment, eve);
        };
        root.Snap_ia = Snap;
        root.Snap = root.Snap || Snap;
        return Snap;
    }

    (typeof window !== "undefined" ? window : global)
);

/*
 * Copyright (c) 2018.  Orlin Vakarelov
 */
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
        const elproto = Element.prototype,
            proto = Paper.prototype,
            is = Snap.is,
            Str = String,
            unit2px = Snap._unit2px,
            $ = Snap._.$,
            make = Snap._.make,
            getSomeDefs = Snap._.getSomeDefs,
            has = 'hasOwnProperty',
            wrap = Snap._.wrap,
            min = Math.min,
            max = Math.max,
            INITIAL_BBOX = 'initial_bbox';

        Snap.joinBBoxes = function (bboxes) {
            const len = bboxes.length;
            if (len == 1) return bboxes[0];
            if (!Snap.path) return;
            const box = {};
            if (len) {
                box.x = bboxes[0].x;
                box.y = bboxes[0].y;
                box.x2 = bboxes[0].x2;
                box.y2 = bboxes[0].y2;
            } else {
                return;
            }
            for (let i = 1; i < len; ++i) {
                box.x = min(bboxes[i].x, box.x);
                box.y = min(bboxes[i].y, box.y);
                box.x2 = max(bboxes[i].x2, box.x2);
                box.y2 = max(bboxes[i].y2, box.y2);
            }
            return Snap.box(box);
        };

        Snap.bBoxFromPoints = boxFromPoints;

        const clip_path_box_helper = function (box, clip_path, matrix) {
            if (box && clip_path) {
                if (matrix && !matrix.isIdentity()) {
                    const old_trans = clip_path.attr('transform');
                    clip_path.attr({transform: matrix.toString()});
                    box = box.intersect(clip_path.getBBox());
                    clip_path.attr({transform: old_trans});
                } else {
                    box = box.intersect(clip_path.getBBox());
                }
            }
            return box;
        };

        elproto.getPoints = function (use_local_transform, skip_hidden) {
            let result = [];
            let rx, ry, matrix;
            switch (this.type) {
                case 'polyline':
                case 'polygon':
                    const points = this.attr('points');
                    for (let i = 0, l = Math.floor(points.length / 2) * 2; i < l; i = i +
                        2) {
                        result.push({x: +points[i], y: +points[i + 1]});
                    }
                    break;
                case 'rect':
                    const x = +this.attr('x'), y = +this.attr('y'), w = +this.attr('width'),
                        h = +this.attr('height');
                    result = [
                        {x: x, y: y},
                        {x: x + w, y: y},
                        {x: x + w, y: y + h},
                        {x: x, y: y + h},
                    ];
                    break;
                case 'path':
                    result = this.getPointSample();
                    break;
                case 'line':
                    result = [
                        {x: this.attr('x1'), y: this.attr('y1')},
                        {x: this.attr('x2'), y: this.attr('y2')},
                    ];
                    break;
                case 'circle':
                    rx = +this.attr('r');
                    ry = rx;
                case 'ellipse':
                    rx = rx || +this.attr('rx');
                    ry = ry || +this.attr('ry');
                    let cx = +this.attr('cx');
                    let cy = +this.attr('cy');
                    let inc = Math.PI / 10;
                    let angles = [...Array(20).keys()].map((i) => i * inc);
                    result = angles.map((a) => {
                        return {
                            x: rx * Math.cos(a) + cx,
                            y: ry * Math.sin(a) + cy,
                        };
                    });
                    break;
                case 'g':
                case 'symbol':
                    result = [];
                    let children = this.getChildren(true), ch;
                    for (let i = 0, l = children.length; i < l; ++i) {
                        if (skip_hidden && (children[i].node.style.display === 'none' || children[i].attr("display") === "none")) continue;
                        const pts = children[i].getPoints(true, skip_hidden);
                        if (window.now && children[i].type === "use") console.log(children[i], Snap.convexHull(pts));
                        pts && pts.length && (result = [...result, ...pts]);
                    }
                    break;
                // matrix = (this.getCoordMatrix) ? this.getCoordMatrix(true) : this.transform().diffMatrix;
                // matrix = this.getLocalMatrix();
                case 'use': //todo:
                    let targ = this.getUseTarget();
                    if (targ) {
                        let x = this.attr('x') || 0,
                            y = this.attr('y') || 0;
                        // matrix = Snap.matrix().add(this.getLocalMatrix().translate(this.attr('x') || 0, this.attr('y') || 0));
                        result = targ.getPoints(true);
                        if (x || y) {
                            const trans_m = Snap.matrix().translate(x, y);
                            result = result.map((p) => trans_m.apply(p));
                        }
                        if (targ.type === 'symbol') {
                            let height = +this.attr('height'),
                                width = +this.attr('width');
                            //todo: implement viewbox
                        }
                    }
                    break;
                case 'text':
                case 'tspan':
                case 'image':
                case 'foreignObject':
                default:
                    let bb = this.getBBox({approx: false, without_transform: true});
                    result = [
                        {x: bb.x, y: bb.y},
                        {x: bb.x2, y: bb.y},
                        {x: bb.x2, y: bb.y2},
                        {x: bb.x, y: bb.y2},
                    ];

            }
            if (result.length && use_local_transform) {
                matrix = matrix || this.getLocalMatrix();
                if (!matrix.isIdentity()) result = result.map(matrix.apply.bind(matrix));
            }
            // if (window.hasOwnProperty("go")) {
            //     let max = -Infinity;
            //     result.forEach((p) => max = Math.max(max, p.x));
            //     console.log(this.type, this.getId(), max);
            // }
            return result;
        };

        elproto.getCHull = function (with_transform, skip_hidden) {

            let el = this.getUseTarget();
            if (!el) return null;
            const is_use = this.type === 'use';

            if (!with_transform && el.c_hull && (el.type !== "g" || !skip_hidden)) return el.c_hull;

            let m;

            if (is_use &&
                (this.node.hasAttribute('x') || this.node.hasAttribute('y'))) {
                const x = +this.attr('x')
                const y = +this.attr('y');
                if (x || y) {
                    m = Snap.matrix().translate(x, y);
                }
            }

            if (with_transform) {
                const localMatrix = this.getLocalMatrix();
                m = (m) ? m.multLeft(m) : localMatrix;

                if (!m.isIdentity()) {
                    let el = this.getUseTarget();
                    let chull = el.getCHull();
                    return chull.map((p) => m.apply(p));
                }
            }

            let points = el.getPoints(is_use, skip_hidden);
            points = Snap.convexHull(points);
            if (m && !m.isIdentity()) {
                points = points.map((p) => m.apply(p));
            }
            if ((el.type !== "g" || !skip_hidden)) this.c_hull = points;
            return points;
        };

        elproto.getUseTarget = function () {
            if (this.type !== 'use') return this;
            if (this.use_target) {
                return this.use_target;
            } else {
                const href = this.attr('xlink:href') || this.attr('href');
                if (href) {
                    const elementId = href.substring(href.indexOf('#') + 1);
                    return this.use_target = Snap.elementFormId(elementId) ||
                        this.paper.select('#' + elementId) ||
                        wrap(this.node.ownerDocument.getElementById(elementId));
                }
            }
            return null;
        };

        elproto.saveMatrix = function (m) {
            this.matrix = m;
            if (this.type === 'image' && m.f) {
                // console.log("saving matrix", this.getId(), m.toString())
            }
        }

        function boxFromPoints(points, matrix) {
            let min_x = Infinity, max_x = -Infinity, min_y = Infinity,
                max_y = -Infinity;
            if (matrix && !matrix.isIdentity()) {
                points = points.map((p) => matrix.apply(p));
            }
            points.forEach((p) => {
                min_x = Math.min(min_x, p.x);
                max_x = Math.max(max_x, p.x);
                min_y = Math.min(min_y, p.y);
                max_y = Math.max(max_y, p.y);
            });
            // console.log("Approx bbox", points.length);
            return Snap.box(min_x, min_y, max_x - min_x, max_y - min_y);
        }

        /*\
                 * Element.getBBox
                 [ method ]
                 **
                 * Returns the bounding box descriptor for the given element
                 **
                 = (object) bounding box descriptor:
                 o {
                 o     cx: (number) x of the center,
                 o     cy: (number) x of the center,
                 o     h: (number) height,
                 o     height: (number) height,
                 o     path: (string) path command for the box,
                 o     r0: (number) radius of a circle that fully encloses the box,
                 o     r1: (number) radius of the smallest circle that can be enclosed,
                 o     r2: (number) radius of the largest circle that can be enclosed,
                 o     vb: (string) box as a viewbox command,
                 o     w: (number) width,
                 o     width: (number) width,
                 o     x2: (number) x of the right side,
                 o     x: (number) x of the left side,
                 o     y2: (number) y of the bottom edge,
                 o     y: (number) y of the top edge
                 o }
                 \*/
        elproto.getBBox = function (settings) {
            if (!this.paper) {
                // console.log("No paper", this.getId());
            }
            let isWithoutTransform, cache_bbox, include_clip_path, relative_parent,
                matrix, approx = true, skip_hidden = false;
            if (typeof settings === 'boolean') {
                isWithoutTransform = settings;
            } else if (typeof settings === 'object') {
                if (settings instanceof Element) {
                    if (this.isChildOf && this.isChildOf(settings)) {
                        relative_parent = settings;
                    }
                } else if (settings.isMatrix) {
                    matrix = settings;
                } else {
                    isWithoutTransform = settings.without_transform;
                    cache_bbox = settings.cache_bbox;
                    include_clip_path = settings.include_clip_path;
                    approx = settings.approx;
                    skip_hidden = settings.skip_hidden;

                    if (settings.relative_parent && this.isChildOf &&
                        this.isChildOf(relative_parent)) {
                        relative_parent = settings.relative_parent;
                    }

                    if (settings.relative_coord) {
                        matrix = (this.getCoordMatrix) ?
                            this.getCoordMatrix(undefined, true) :
                            undefined;
                    }

                    matrix = matrix || settings.matrix;
                }
            }

            if (!matrix && relative_parent) {
                matrix = Snap.matrix();
                let p = this;
                //get the transform between this and the relative_parent
                while ((p = p.parent()) && p !== relative_parent && p.type !== 'svg') {
                    matrix.multLeft(p.getLocalMatrix());
                }
            }

            if (approx) {
                if (!isWithoutTransform) matrix = matrix || this.getLocalMatrix();
                let points = this.getCHull(undefined, skip_hidden);
                if (points) {
                    return boxFromPoints(points, matrix);
                }
            }

            let clip_path;
            if (include_clip_path) {
                //todo: fix this
                clip_path = this.attr('clip-path');
                if (clip_path === 'none') clip_path = undefined;
                if (clip_path) {
                    clip_path = clip_path.trim().slice(4, -1);
                    clip_path = this.paper.select(clip_path);
                }
            }

            let saved_bb = this.attr('bbox');
            if (saved_bb) { //todo
                saved_bb = saved_bb.split(' ');
                //todo make sure this works with realative parent
                if (!include_clip_path || saved_bb[4] === 'cp') return Snap.box(saved_bb);
            }

            if (!Snap.Matrix || !Snap.path) {
                return this.node.getBBox();
            }
            let el = this,
                matrix_for_x_y_attrs = new Snap.Matrix;
            if (false && el.removed) {
                return Snap.box();
            }

            if (this.type === 'tspan' || this.type === 'text') {
                let clientRect = Snap.measureTextClientRect(this);

                let p = {x: +clientRect.left, y: clientRect.top};
                this.c_hull = [
                    p, {x: p.x + clientRect.width, y: p.y},
                    {x: p.x + clientRect.width, y: p.y + clientRect.height},
                    {x: p.x, y: p.y + clientRect.height}];
                settings = Object.assign({}, settings);
                settings.approx = true;
                const bBox1 = this.getBBox(settings);
                return bBox1;
            }

            while (el.type === 'use') {
                if (!isWithoutTransform) {
                    matrix_for_x_y_attrs = matrix_for_x_y_attrs.add(el.getLocalMatrix().translate(el.attr('x') || 0, el.attr('y') || 0));
                }

                el = this.getUseTarget();

                if (!el) return null;
            }

            if (el.type === 'g') {
                el.saveMatrix(el.getLocalMatrix(true));

                let protected_region = el.attr('protected');
                if (!!protected_region) {
                    const region = el.select('[region="1"]'); //todo: optimize and rework this
                    if (region) {
                        const clone = region.clone(true, undefined, true);
                        var box = clone.addTransform(el.matrix).getBBox(isWithoutTransform);
                        clone.remove();
                        if (cache_bbox) {
                            this.attr('bbox',
                                box.x + ' ' + box.y + ' ' + box.width + ' ' + box.height +
                                ((clip_path) ? ' cp' : ''));
                            this.data(INITIAL_BBOX,
                                {bbox: box, matrix: this.getLocalMatrix(true)});
                        }
                        return clip_path_box_helper(box, clip_path, el.matrix);
                    }
                }

                const children = el.getChildren();
                let bboxes = children.map(function (elm) {
                    // console.log(el.id + " - " + elm.id + ": " + (Date.now() - timer));
                    // timer = Date.now();
                    if (skip_hidden && (elm.node.style.display === 'none' || elm.attr("display") === "none")) {
                        console.log("In empty");
                        return null;
                    }
                    let box;
                    if (elm.hasOwnProperty('getBBox')) {
                        let m = el.matrix;
                        if (matrix) m = m.clone().multLeft(matrix);
                        box = elm.getBBox(m);
                    } else {
                        let elm_cl = elm.clone(true, undefined, true);
                        elm_cl.addTransform(el.matrix);
                        if (matrix) elm_cl.addTransform(matrix);
                        box = elm_cl.getBBox(isWithoutTransform);
                        if (+cache_bbox === 1) {
                            elm.attr('bbox',
                                box.x + ' ' + box.y + ' ' + box.width + ' ' + box.height +
                                ((clip_path) ? ' cp' : ''));
                            elm.data(INITIAL_BBOX, {bbox: box, matrix: elm.getLocalMatrix(true)});
                        }
                        elm_cl.remove(true, true);
                    }
                    return box;
                });

                bboxes = bboxes.filter(function (n) {
                    return n !== null && (n.width || n.height) && !isNaN(n.width) &&
                        !isNaN(n.height);
                });

                if (bboxes.length) {
                    var box = Snap.joinBBoxes(bboxes);
                    box.translate(matrix_for_x_y_attrs);
                    if (cache_bbox) {
                        this.attr('bbox',
                            box.x + ' ' + box.y + ' ' + box.width + ' ' + box.height +
                            ((clip_path) ? ' cp' : ''));
                        this.data(INITIAL_BBOX,
                            {bbox: box, matrix: this.getLocalMatrix(true)});
                    }
                    return clip_path_box_helper(box, clip_path, el.matrix);
                    //this only works in Strict mode
                    const p1 = el.matrix.apply({x: box.x, y: box.y}),
                        p2 = el.matrix.apply({x: box.x2, y: box.y2});
                    var box = Snap.box({x: p1.x, y: p1.y, x2: p2.x, y2: p2.y});
                    if (cache_bbox) {
                        this.attr('bbox',
                            box.x + ' ' + box.y + ' ' + box.width + ' ' + box.height +
                            ((clip_path) ? ' cp' : ''));
                        this.data(INITIAL_BBOX,
                            {bbox: box, matrix: this.getLocalMatrix(true)});
                    }
                    return clip_path_box_helper(box, clip_path, el.matrix);
                } else {
                    try {
                        let box;
                        if (matrix && !matrix.isIdentity()) {
                            const t = el.attr('transform');
                            el.addTransform(matrix);
                            box = el.node.getBBox();
                            el.attr('transform', t);
                        } else {
                            box = el.node.getBBox();
                        }

                        if (cache_bbox) {
                            this.attr('bbox',
                                box.x + ' ' + box.y + ' ' + box.width + ' ' + box.height +
                                ((clip_path) ? ' cp' : ''));
                            this.data(INITIAL_BBOX,
                                {bbox: box, matrix: this.getLocalMatrix(true)});
                        }
                        box = Snap.box(box.x, box.y, box.width, box.height);
                        return clip_path_box_helper(box, clip_path, el.matrix);

                    } catch (e) {
                        //Display:none is set and an exception is called.
                        this.attr('bbox', '');
                        this.removeData(INITIAL_BBOX);
                        return null;
                    }
                }
            }

            const _ = el._,
                pathfinder = Snap.path.get[el.type] || Snap.path.get.deflt;
            try {
                if (isWithoutTransform) {
                    _.bboxwt = pathfinder ?
                        Snap.path.getBBox(el.realPath = pathfinder(el)) :
                        Snap.box(el.node.getBBox());
                    return Snap.box(_.bboxwt);
                } else {
                    el.realPath = pathfinder(el);
                    el.saveMatrix(el.transform().localMatrix);
                    // el.matrix = el.transform().globalMatrix;
                    matrix_for_x_y_attrs.add(el.matrix);
                    if (matrix) matrix_for_x_y_attrs.multLeft(matrix);
                    _.bbox = Snap.path.getBBox(
                        Snap.path.map(el.realPath, matrix_for_x_y_attrs));
                    let box = Snap.box(_.bbox);
                    if (cache_bbox) this.attr('bbox',
                        box.x + ' ' + box.y + ' ' + box.width + ' ' + box.height);
                    return clip_path_box_helper(box, clip_path, el.matrix);
                }
            } catch (e) {
                // Firefox doesn’t give you bbox of hidden element
                return Snap.box();
            }
        };

        elproto.getBBoxApprox = function (setting) {
            setting = setting || {};
            setting.approx = true;
            return this.getBBox(setting);
        };
        elproto.getBBoxExact = function (settigns) {
            if (settigns && typeof settigns === 'object' && settigns.isMatrix) {
                return this.getBBox({approx: false, matrix: settigns});
            }
            if (typeof settigns === 'boolean') settigns = {without_transform: settigns};
            settigns = settigns || {};
            settigns.approx = false;
            return this.getBBox(settigns);
        };

        elproto.attrMonitor = function (attr, callback_val) {
            if (typeof callback_val === 'function') {
                if (!this._attr_monitor) {
                    this._attr_monitor = {};
                }
                this._attr_monitor[attr] = this._attr_monitor[attr] || [];
                this._attr_monitor[attr].push(callback_val);
                return this;
            }
            if (Array.isArray(attr)) {
                attr.forEach((a) => this.attrMonitor(a));
            } else if (this._attr_monitor && this._attr_monitor[attr]) {
                this._attr_monitor[attr].forEach((callback) => callback.call(this, this.attr(attr)));
            }
            return this
        }

        const propString = function () {
            return this.string;
        };

        function extractTransform(el, tstr) {
            if (tstr == null) {
                var doReturn = true;
                if (el.type == 'linearGradient' || el.type == 'radialGradient') {
                    tstr = el.node.getAttribute('gradientTransform');
                } else if (el.type == 'pattern') {
                    tstr = el.node.getAttribute('patternTransform');
                } else {
                    if (!el.node.getAttribute) {
                        console.log('node problem');
                    } else {
                        tstr = el.node.getAttribute('transform') || el.node.style.transform;
                    }

                }
                if (!tstr) {
                    return new Snap.Matrix;
                }
                tstr = Snap._.svgTransform2string(tstr);
            } else {
                if (!Snap._.rgTransform.test(tstr)) {
                    tstr = Snap._.svgTransform2string(tstr);
                } else {
                    tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || '');
                }
                if (is(tstr, 'array')) {
                    tstr = Snap.path ? Snap.path.toString.call(tstr) : Str(tstr);
                }
                el._.transform = tstr;
            }
            const command = Str(tstr[0]).toLowerCase()[0];
            let m;
            if (!tstr || command == 'm') {
                m = Snap._.transform2matrix(tstr);
            } else {
                m = Snap._.transform2matrix(tstr, el.getBBoxExact(true));
            }

            el.saveMatrix(m);
            if (doReturn) {
                return m;
            }
        }

        function extractTransformStrict(el, tstr) {
            if (tstr == null) {
                var doReturn = true;
                if (el.type == 'linearGradient' || el.type == 'radialGradient') {
                    tstr = el.node.getAttribute('gradientTransform');
                } else if (el.type == 'pattern') {
                    tstr = el.node.getAttribute('patternTransform');
                } else {
                    tstr = el.node.getAttribute('transform');
                }
                if (!tstr) {
                    return new Snap.Matrix;
                }
            } else {
                if (!Snap._.rgTransform.test(tstr)) {
                    tstr = Snap._.svgTransform2string(tstr);
                    tstr = Snap._.svgTransform2string(tstr);
                } else {
                    tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || '');
                }
                if (is(tstr, 'array')) {
                    tstr = Snap.path ? Snap.path.toString.call(tstr) : Str(tstr);
                }
                el._.transform = tstr;
            }
            const m = Snap._.transform2matrixStrict(tstr);
            el.saveMatrix(m);
            if (doReturn) {
                return m;
            }
        }

        function clearParentCHull(el, efficient) {
            let parent = el.parent();
            while (parent && parent.type !== 'svg') {
                if (parent.c_hull) {
                    parent.c_hull = undefined;
                } else if (efficient) {
                    break;
                }
                parent = parent.parent();
            }
        }

        elproto.clearCHull = function (force_top) {
            force_top = true;
            this.c_hull = undefined;
            clearParentCHull(this, !force_top);
        }

        /*\
         * Element.transform
         [ method ]
         **
         * Gets or sets transformation of the element
         **
         - tstr (string) transform string in Snap or SVG format
         = (Element) the current element
         * or
         = (object) transformation descriptor:
         o {
         o     string (string) transform string,
         o     globalMatrix (Matrix) matrix of all transformations applied to element or its parents,
         o     localMatrix (Matrix) matrix of transformations applied only to the element,
         o     diffMatrix (Matrix) matrix of difference between global and local transformations,
         o     global (string) global transformation as string,
         o     local (string) local transformation as string,
         o     toString (function) returns `string` property
         o }
         \*/
        elproto.transform = function (tstr, do_update, matrix, apply) {
            if (typeof matrix === 'boolean') {
                apply = matrix;
                matrix = undefined;
            }

            const _ = this._;
            if (tstr == null) {
                let papa = this;
                const global = this.getGlobalMatrix()
                const local = extractTransform(this);
                const ms = [local];
                const m = new Snap.Matrix;
                let i;
                const localString = local.toTransformString(),
                    string = Str(local) == Str(this.matrix) ?
                        Str(_.transform) : localString;
                while ((papa.type != 'svg' && papa.type != 'body') && (papa = papa.parent())) {
                    ms.push(extractTransform(papa));
                }
                i = ms.length;
                while (i--) {
                    m.add(ms[i]);
                }
                return {
                    string: string,
                    globalMatrix: global,
                    totalMatrix: m,
                    localMatrix: local,
                    diffGlobalMatrix: global.clone().add(local.invert()),
                    diffMatrix: m.clone().add(local.invert()),
                    global: global.toTransformString(),
                    total: m.toTransformString(),
                    local: localString,
                    toString: propString,
                };
            }
            if (tstr instanceof Snap.Matrix) {
                this.saveMatrix(tstr);
                this._.transform = tstr.toTransformString();
            } else {
                extractTransform(this, tstr);
            }

            if (this.node) {
                if (this.type == 'linearGradient' || this.type == 'radialGradient') {
                    $(this.node, {gradientTransform: this.matrix});
                } else if (this.type == 'pattern') {
                    $(this.node, {patternTransform: this.matrix});
                } else {
                    if (do_update) this.updateBBoxCache(undefined, apply);

                    // clearParentCHull(this);

                    this.clearCHull();
                    try {
                        if (!(Snap.is(this.node, "SVGElement"))) {
                            let toTransformString = this.matrix.toString();
                            // this.node.setAttribute("transform", toTransformString);
                            this.node.style.transform = toTransformString;

                        } else {
                            $(this.node, {transform: this.matrix});
                        }
                        this.attrMonitor("transform");
                        var dom_partner = this._dom_partner;
                        if (dom_partner) {
                            let tars_str;
                            for (let i = 0, l = dom_partner.length, dom; i < l; ++i) {
                                dom = dom_partner[i];
                                const top_matrix = dom._top_matrix;
                                if (top_matrix) {
                                    tars_str = top_matrix.clone().add(this.getLocalMatrix()).toString();
                                } else {
                                    tars_str = this.node.getAttribute('transform');
                                }
                                if (dom.css) {
                                    dom.css({transform: tars_str});
                                } else if (glob.jQuery) {
                                    dom = jQuery(dom);
                                    dom.css({transform: tars_str});
                                }
                            }

                        }
                        var element_partner = this._element_partner;
                        if (element_partner && element_partner.length) {
                            for (let i = 0, l = element_partner.length; i < l; ++i) {
                                let elementPartnerElement = element_partner[i];
                                if (Snap.is(elementPartnerElement.node, "SVGElement")) {
                                    $(elementPartnerElement.node, {transform: this.matrix});
                                } else {
                                    elementPartnerElement.setStyle({transform: this.matrix});
                                }

                            }
                        }

                    } catch (e) {
                        console.log(e);
                    }
                }
            }

            if (this._partner_childern) {
                this._partner_childern.forEach((id) =>
                    this._propagateTransToPartnersChild(Snap.elementFormId(id), Snap.Matrix()));
            }

            return this;
        };

        function transform2matrix(tdata) {
            let m = new Snap.Matrix;
            if (tdata) {
                for (var i = 0, l = tdata.length; i < l; ++i) {
                    let t = tdata[i],
                        tlen = t.length,
                        command = Str(t[0]).toLowerCase();
                    if (command === 't' && tlen === 2) {
                        m.translate(t[1], 0);
                    } else if (command === 't' && tlen === 3) {
                        m.translate(t[1], t[2]);
                    } else if (command === 'r') {
                        m.rotate(t[1], t[2], t[3]);
                    } else if (command === 's') {
                        m.scale(t[1], t[2], t[3], t[4]);
                    } else if (command === 'm' && tlen === 7) {
                        m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
                    }
                }
            }
            return m;
        }

        elproto.transToMatrix = function () {
            let tstr = "";
            if (this.type === 'linearGradient' || this.type === 'radialGradient') {
                tstr = this.node.getAttribute('gradientTransform') || "";
            } else if (this.type === 'pattern') {
                tstr = this.node.getAttribute('patternTransform') || "";
            } else {
                tstr = this.node.getAttribute('transform') || "";
            }

            tstr = tstr.trim().toLowerCase();
            if (tstr &&
                !(tstr.startsWith('matrix(') && tstr.indexOf(')') === tstr.length -
                    1)) {
                let tarr = Snap._.svgTransform2string(tstr);
                const matrix = transform2matrix(tarr);
                let m = matrix.toString();

                // console.log("Fixing transform for", this.getId(), tstr, "to", m);
                if (this.type === 'linearGradient' || this.type === 'radialGradient') {
                    this.node.setAttribute('gradientTransform', m); //getAttribute("gradientTransform");
                } else if (this.type === 'pattern') {
                    this.node.setAttribute('patternTransform', m);
                } else {
                    // this.node.setAttribute('transform', m);
                    this.transform(m)
                }
                this.saveMatrix(matrix);
            }
        };

        elproto.updateBBoxCache = function (matrix, apply, _skip_parent) {
            //if apply is negative, erase all bbox catches
            if (apply === -1) {
                this.eraseBBoxCache();
                return;
            }

            const old_bbox_data = this.data(INITIAL_BBOX);
            if (!old_bbox_data) return;

            const current_matrix = matrix || this.getLocalMatrix(true);
            // matrix = matrix.multLeft(old_bbox_data.matrix.invert());

            matrix = old_bbox_data.matrix.invert().multLeft(current_matrix);

            if (matrix.isIdentity()) return;

            console.log(matrix.e, matrix.f);

            // const transform = this.transform();

            // let saved_bb = this.attr("bbox");

            let old_bbox = old_bbox_data.bbox;

            // saved_bb = saved_bb.split(" ");
            // const old_bbox = Snap.box(saved_bb);

            if (!apply && !matrix.split().noRotation) {
                this.eraseBBoxCache();
                const parent = this.parent();
                if (!parent) return;
                let parent_bbox = parent.data(INITIAL_BBOX);
                if (!parent_bbox) return;

                const new_c = matrix.apply({x: old_bbox.cx, y: old_bbox.cy});
                const new_x = matrix.apply({x: old_bbox.x, y: old_bbox.y});
                const new_x2 = matrix.apply({x: old_bbox.x2, y: old_bbox.y});
                const r = max(Snap.len(new_c.x, new_c.y, new_x.x, new_x.y),
                    Snap.len(new_c.x, new_c.y, new_x2.x, new_x2.y));

                this.eraseParentBBoxCache({x: new_c.x - r, y: new_c.y - r, r: r});
                this.eraseBBoxCache();
                return;
            }

            let p1 = matrix.apply({x: +old_bbox.x, y: old_bbox.y});
            let p2 = matrix.apply({x: +old_bbox.x2, y: old_bbox.y2});

            const new_bbox = Snap.box(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y),
                Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));
            this.attr({
                bbox: new_bbox.x + ' ' + new_bbox.y + ' ' + new_bbox.width + ' ' +
                    new_bbox.height,
            });

            this.data(INITIAL_BBOX, {bbox: new_bbox, matrix: current_matrix});

            if (this.isGroupLike()) {
                this.getChildren().forEach(function (el) {
                    el.updateBBoxCache(matrix, true, true);
                });
            }

            if (!_skip_parent) {

                this.expandParenBBoxCatch(new_bbox);
            }

        };

        elproto.expandParenBBoxCatch = function (bbox_circ, is_circle) {
            const parent = this.parent();
            if (!parent) return;
            let saved_bb = parent.attr('bbox');
            if (!saved_bb) return;
            saved_bb = saved_bb.split(' ');
            const p_bbox = Snap.box(saved_bb);

            if (is_circle) {
                if (!p_bbox.contains(bbox_circ)) {
                    const new_parent_bbox = Snap.joinBBoxes([
                        p_bbox,
                        Snap.box(bbox_circ.x - bbox_circ.r, bbox_circ.y - bbox_circ.r,
                            2 * bbox_circ.r, 2 * bbox_circ.r)]);
                    parent.attr({bbox: new_parent_bbox.vb()});
                    parent.expandParenBBoxCatch(new_parent_bbox);
                }
                return;
            }

            if (!p_bbox.contains(bbox_circ)) {
                const new_parent_bbox = Snap.joinBBoxes([p_bbox, bbox_circ]);
                parent.attr({bbox: new_parent_bbox.vb()});
                parent.expandParenBBoxCatch(new_parent_bbox);
            }
        };

        /**
         * Erases the parent (and higher) cached bboxes, because the element has been transformed in way that its bbox cannot
         * be computed fast.
         * @param bbox_circle a bbox or a circle region that contains the element. If provided, parent (and higher) bboxes
         * are erased only if region extrudes from the parent bbox. Otherwise, there is no need to remove.
         */
        elproto.eraseParentBBoxCache = function (bbox_circle) {
            const parent = this.parent();
            if (!parent) return;
            let parent_bb = parent.attr('bbox');
            if (!parent_bb) return;

            if (bbox_circle) {
                const parent_bbox = Snap.box(parent_bb.split(' '));
                //circle is provided
                if (typeof bbox_circle.r === 'number') {
                    if (!parent_bbox.containsCircle(bbox_circle)) {
                        parent.attr({bbox: ''}); //erase
                        parent.removeData(INITIAL_BBOX);
                        const expanded_bb = Snap.joinBBoxes([
                            parent_bbox,
                            Snap.box(bbox_circle.x - bbox_circle.r,
                                bbox_circle.y - bbox_circle.r, 2 * bbox_circle.r,
                                2 * bbox_circle.r)]);
                        parent.eraseParentBBoxCache(expanded_bb);
                    }
                } else {
                    if (!parent_bbox.contains(bbox_circle)) {
                        parent.attr({bbox: ''}); //erase
                        parent.removeData(INITIAL_BBOX);
                        const expanded_bb = Snap.joinBBoxes([parent_bbox, bbox_circle]);
                        parent.eraseParentBBoxCache(expanded_bb);
                    }
                }

                return;
            }

            parent.attr({bbox: ''}); //erase
            parent.removeData(INITIAL_BBOX);
            parent.eraseParentBBoxCache();

        };

        elproto.eraseBBoxCache = function () {
            this.attr({bbox: ''});
            this.removeData(INITIAL_BBOX);
            if (this.isGroupLike()) {
                this.getChildren().forEach(function (el) {
                    el.eraseBBoxCache();
                });
            }
        };

        elproto.getLocalMatrix = function (strict) {
            if (this.matrix) return this.matrix;
            if (strict) {
                return extractTransformStrict(this);
            } else {
                return extractTransform(this);
            }
        };

        elproto.getGlobalMatrix = function () {
            const ctm = this.node.getCTM ? this.node.getCTM() : null;
            let matrix = new Snap.Matrix(ctm);
            return matrix;
        }

        elproto.setPartner = function (el_dom, strict) {
            if (el_dom.paper || el_dom instanceof Element) {
                const el_part = this._element_partner || [];

                if (!el_part.includes(el_dom)) {
                    el_part.push(el_dom);
                }
                this._element_partner = el_part;
            } else if (el_dom instanceof HTMLElement || el_dom.css) {
                const dom_part = this._dom_partner || [];
                if (el_dom instanceof HTMLElement) el_dom = Snap(el_dom);
                if (!dom_part.includes(el_dom)) {
                    dom_part.push(el_dom);
                }
                this._dom_partner = dom_part;
            }

            if (this.paper) {
                this.paper._partner_map = this.paper._partner_map || {};
                this.paper._partner_map[this.id] = this;
            }

            // if (strict) {
            //
            // }
        };

        elproto._updatePartnerChild = function (el, remove) {
            if (this.type === 'svg' || this.type === 'defs') return;

            if (remove) {
                if (this._partner_childern && this._partner_childern.length) {
                    const index = this._partner_childern.findIndex((id) => id === el.id);
                    if (index >= 0) {
                        this._partner_childern.splice(index, 1);
                        if (!this._partner_childern.length) {
                            delete this._partner_childern;
                            // console.log("Removing partner child", el.id, "from", this.id);
                            let parent = this.parent();
                            parent && parent._updatePartnerChild(this, true);
                        }
                    }
                }
                return this;
            }

            this._partner_childern = this._partner_childern || [];
            if (!this._partner_childern.includes(el.id)) {
                this._partner_childern.push(el.id);
                // this._partner_childern.push(el); //temp
                // console.log("Adding partner child", el.id, "to", this.id);
                let parent = this.parent();
                parent && parent._updatePartnerChild(this);
            }
        }

        elproto._propagateTransToPartnersChild = function (el, trans) {
            if (!el) return;
            if (trans) {
                let matrix = trans.clone().add(this.getLocalMatrix(true));
                el._applyToPartner(matrix);
            } else {
                el._applyToPartner(this.getGlobalMatrix());
            }
        };

        elproto._applyToPartner = function (matrix) {
            const partners = this.getPartners();
            if (partners) {
                const loc = this.getLocalMatrix();
                const m = matrix.clone().add(loc).toString();
                for (let i = 0, l = partners.length, dom; i < l; ++i) {
                    dom = partners[i];
                    dom._top_matrix = matrix.clone();
                    if (dom.css) {
                        dom.css({transform: m});
                    } else if (glob.jQuery) {
                        dom = jQuery(dom);
                        dom.css({transform: m});
                    }
                }
            }

            if (this._partner_childern) {
                this._partner_childern.forEach((id) => this._propagateTransToPartnersChild(Snap.elementFormId(id), matrix));
            }
        }


        elproto.removePartner = function (el_type, remove_elements) {

            if (typeof el_type === 'boolean') {
                remove_elements = el_type;
                el_type = undefined;
            }
            if (!el_type) {
                this.removePartner('dom', remove_elements);
                this.removePartner('element', remove_elements);

            } else if (el_type === 'dom') {
                remove_elements && this._dom_partner &&
                this._dom_partner.forEach((el) => el.remove());
                this.removeData('dom_partner');
            } else if (el_type === 'element') {
                remove_elements && this._element_partner &&
                this._element_partner.forEach((el) => el.remove());
                this.removeData('element_partner');
            } else if (el_type instanceof Element) {
                let dom_parts = this._dom_partner;
                if (dom_parts) {
                    const jq_el = Snap(el_type);
                    const index = dom_parts.findIndex((el) => el === jq_el);
                    if (index >= 0) {
                        remove_elements && dom_parts[index].remove();
                        dom_parts.splice(index, 1);
                        if (!dom_parts.length) {
                            this.removeData('dom_partner');
                        }
                    }
                }
            } else if (el_type.paper || el_type.remove) {
                let element_partner = this._element_partner;
                if (element_partner) {
                    const index = element_partner.findIndex((el) => el === el_type);
                    if (index >= 0) {
                        remove_elements && element_partner[index].remove();
                        element_partner.splice(index, 1);
                        if (!element_partner.length) {
                            this.removeData('element_partner');
                        }
                    }
                }
            } else {
                return;
            }

            if (this.paper && !this.hasPartner()) {
                this.paper._partner_map && delete this.paper._partner_map[this.id];
            }
        };

        elproto.hasPartner = function () {
            return !!(this._dom_partner || this._element_partner);
        };

        elproto.getPartners = function (el_type) {
            if (!el_type) {
                return this._dom_partner || this._element_partner;
            } else if (el_type === 'dom') {
                return this._dom_partner;
            } else if (el_type === 'element') {
                return this._element_partner;
            } else if (el_type === "both") {
                return {dom: this._dom_partner, element: this._element_partner};
            }
        }

        elproto.setPartnerStyle = function (style_obj) {
            let obj = {};
            if (style_obj.hasOwnProperty(
                'opacity')) obj.opacity = style_obj.opacity;
            if (style_obj.hasOwnProperty(
                'display')) obj.display = style_obj.display;
            let dom = this._dom_partner;
            dom && dom.forEach((e) => e.css(obj));
            let el = this._element_partner;
            el && el.forEach((e) => e.attr(obj));
        };

        /*\
         * Element.parent
         [ method ]
         **
         * Returns the element's parent
         **
         = (Element) the parent element
         \*/
        elproto.parent = function () {
            return wrap(this.node.parentNode);
        };

        /*\
         * Element.setPaper
         [ method ]
         **
         * Sets the elements paper.
         **
         = (Element) this
         \*/
        elproto.setPaper = function (paper, force) {
            if (!paper instanceof Paper ||
                (!force && this.paper === paper)) return this;

            this.paper = paper;
            this.getChildren().forEach((ch) => ch.setPaper(paper, force));
            return this;
        };

        /*\
         * Element.append
         [ method ]
         **
         * Appends the given element to current one
         **
         - el (Element|Set) element to append
         = (Element) the parent element
         \*/
        /*\
         * Element.add
         [ method ]
         **
         * See @Element.append
         \*/
        elproto.append = elproto.add = function (el) {

            if (el) {
                clearParentCHull(this);
                if (el.type === 'set' || Array.isArray(el)) {
                    const it = this;
                    el.forEach(function (el) {
                        it.add(el);
                    });
                    return this;
                }

                // el = Snap(wrap(el));
                el = wrap(el);
                if ((el.hasPartner && el.hasPartner()) || el._partner_childern) {
                    let parent = el.parent();
                    if (parent !== this) parent._updatePartnerChild(el, "remove");
                    this._updatePartnerChild(el);
                    this._propagateTransToPartnersChild(el);
                }
                const node = (this.div) ? this.div.node : this.node;
                node.appendChild(el.node);

                // if (this.sub_children && this.sub_children.length > 0) {
                //     this.sub_children.push(el);
                // } else {
                //     this.sub_children = [el];
                // }
                if (el.setPaper && this.paper && el.type !== 'svg' && el.paper !== this.paper) {
                    el.setPaper(this.paper);
                }

                if (el.domChangeReact && el.domChangeReact instanceof "function") {
                    el.domChangeReact();
                }
            }
            return this;
        };
        /*\
         * Element.appendTo
         [ method ]
         **
         * Appends the current element to the given one
         **
         - el (Element) parent element to append to
         = (Element) the child element
         \*/
        elproto.appendTo = function (el) {
            if (el) {
                clearParentCHull(this);
                el = wrap(el);
                el.append(this);
            }
            return this;
        };
        /*\
         * Element.prepend
         [ method ]
         **
         * Prepends the given element to the current one
         **
         - el (Element) element to prepend
         = (Element) the parent element
         \*/
        elproto.prepend = function (el) {
            if (el) {
                clearParentCHull(this);
                if (el.type == 'set') {
                    const it = this;
                    let first;
                    el.forEach(function (el) {
                        if (first) {
                            first.after(el);
                        } else {
                            it.prepend(el);
                        }
                        first = el;
                    });
                    return this;
                }
                el = wrap(el);
                const parent = el.parent();
                this.node.insertBefore(el.node, this.node.firstChild);
                this.add && this.add();
                el.paper = this.paper;
                this.parent() && this.parent().add();
                parent && parent.add();
            }
            return this;
        };
        /*\
         * Element.prependTo
         [ method ]
         **
         * Prepends the current element to the given one
         **
         - el (Element) parent element to prepend to
         = (Element) the child element
         \*/
        elproto.prependTo = function (el) {
            el = wrap(el);
            el.prepend(this);
            return this;
        };
        /*\
         * Element.before
         [ method ]
         **
         * Inserts given element before the current one
         **
         - el (Element) element to insert
         = (Element) the parent element
         \*/
        elproto.before = function (el) {
            clearParentCHull(this);
            if (el.type == 'set') {
                const it = this;
                el.forEach(function (el) {
                    const parent = el.parent();
                    it.node.parentNode.insertBefore(el.node, it.node);
                    parent && parent.add();
                });
                this.parent().add();
                return this;
            }
            el = wrap(el);
            var parent = el.parent();
            this.node.parentNode.insertBefore(el.node, this.node);
            this.parent() && this.parent().add();
            parent && parent.add();
            el.paper = this.paper;
            return this;
        };
        /*\
         * Element.after
         [ method ]
         **
         * Inserts given element after the current one
         **
         - el (Element) element to insert
         = (Element) the parent element
         \*/
        elproto.after = function (el) {
            el = wrap(el);
            clearParentCHull(this);
            const parent = el.parent();
            if (this.node.nextSibling) {
                this.node.parentNode.insertBefore(el.node, this.node.nextSibling);
            } else {
                if (this.node.parentNode) {
                    this.node.parentNode.appendChild(el.node);
                } else {
                    parent.add(el);
                }

            }
            this.parent() && this.parent().add();
            parent && parent.add();
            el.paper = this.paper;
            return this;
        };
        /*\
         * Element.insertBefore
         [ method ]
         **
         * Inserts the element after the given one
         **
         - el (Element) element next to whom insert to
         = (Element) the parent element
         \*/
        elproto.insertBefore = function (el) {
            el = wrap(el);
            clearParentCHull(el);
            const parent = this.parent();
            el.node.parentNode.insertBefore(this.node, el.node);
            this.paper = el.paper;
            parent && parent.add();
            el.parent() && el.parent().add();
            return this;
        };
        /*\
         * Element.insertAfter
         [ method ]
         **
         * Inserts the element after the given one
         **
         - el (Element) element next to whom insert to
         = (Element) the parent element
         \*/
        elproto.insertAfter = function (el) {
            el = wrap(el);
            clearParentCHull(el);
            const parent = this.parent();
            el.node.parentNode.insertBefore(this.node, el.node.nextSibling);
            this.paper = el.paper;
            parent && parent.add();
            el.parent() && el.parent().add();
            return this;
        };
        /*\
         * Element.remove
         [ method ]
         **
         * Removes element from the DOM
         = (Element) the detached element
         \*/
        elproto.remove = function () {
            clearParentCHull(this);
            const parent = this.parent();
            if (parent) parent._updatePartnerChild(this, true);
            this.undrag();
            if (this.removePartner) this.removePartner(true);

            this.node.parentNode && this.node.parentNode.removeChild(this.node);
            // if (parent.sub_children) {
            //     var index = parent.sub_children.indexOf(this);
            //     if (index > -1) parent.sub_children.splice(index, 1);
            // }
            delete this.paper;
            this.removed = true;

            delete eldata[this.id];
            // parent && parent.add();
            return this.getChildren();
        };
        /*\
         * Element.removeChildren
         [ method ]
         **
         * Removes all children element from the DOM
         \*/
        elproto.removeChildren = function () {
            this.getChildren().forEach(function (el) {
                el.remove();
            });
            if (this.hasOwnProperty('sub_children')) this.sub_children = [];

            return this;
        };

        /*
         * Element.getChildren
         * [ method ]
         *
         * Returns an array of the children of the element, filtering out non-geometric elements. It shoulc be called
         * for the groups or the topmost svg element.
         * */
        elproto.getChildren = function (visible, include_text) {
            if (this.sub_children) return this.sub_children;

            // if (this.type !== "g" && this.type !== "text" && this.type !== "svg" && this.type !== "clipPath" && this.type !== "defs") {
            //     return [];
            // }
            let children = this.children();
            const that = this;
            children = children.filter(
                function (el) {
                    if (include_text && el.node.nodeType === 3) return true;

                    if (el._ghost_element) return false;

                    el.paper = that.paper;
                    if (typeof visible === 'string') return (visible === el.type);

                    if (visible) {
                        return (el.type === 'circle' || el.type === 'ellipse' || el.type ===
                            'line' || el.type === 'g' || el.type === 'path' || el.type ===
                            'polygon' || el.type === 'polyline' || el.type === 'rect' ||
                            el.type === 'text' || el.type === 'tspan' || el.type ===
                            'use' || el.type === 'image');
                    } else {
                        return !(el.node.nodeType > 1 ||
                            el.type === 'defs' ||
                            el.type === 'desc');
                    }
                },
            );

            return children;

            // return children.map(function (el) {
            //     // if (el.nodeType > 1) return el;
            //     // let snap = Snap(el);
            //     // if (!snap.paper) {
            //          //This shouldn't be needed.
            //     // }
            //     // return snap;
            // });
        };

        elproto.hasChildren = function () {
            if (this.type !== 'g' || this.type !== 'svg' || this.type !== 'clipPath') {
                return false;
            }
            const children = this.children();
            let i = 0, el;
            for (; i < children.length; ++i) {
                el = children[i];
                if (!(el.type === '#text' ||
                    el.type === '#comment' ||
                    el.type === 'defs' ||
                    el.type === 'desc')) {
                    return true;
                }
            }
            return false;
        };

        /*\
         * Element.select
         [ method ]
         **
         * Gathers the nested @Element matching the given set of CSS selectors
         **
         - query (string) CSS svg_selector
         = (Element) result of query selection
         \*/
        elproto.select = function (query) {
            query = replaceNumericIdSelectors(query);
            return wrap(this.node.querySelector(query));
        };
        /*\
         * Element.selectAll
         [ method ]
         **
         * Gathers nested @Element objects matching the given set of CSS selectors
         **
         - query (string) CSS svg_selector
         = (Set|array) result of query selection
         \*/
        elproto.selectAll = function (query) {
            query = replaceNumericIdSelectors(query);
            const nodelist = this.node.querySelectorAll(query),
                set = (Snap.set || Array)();
            for (let i = 0; i < nodelist.length; ++i) {
                set.push(wrap(nodelist[i]));
            }
            return set;
        };

        function replaceNumericIdSelectors(cssQuery) {
            // Regular expression to match ID selectors starting with a number
            const regex = /#(\d[\w-]*)/g;

            // Replace each matched ID selector
            const modifiedQuery = cssQuery.replace(regex, (_, id) => `[id="${id}"]`);

            return modifiedQuery;
        }

        /*\
         * Element.asPX
         [ method ]
         **
         * Returns given attribute of the element as a `px` value (not %, em, etc.)
         **
         - attr (string) attribute name
         - value (string) #optional attribute value
         = (Element) result of query selection
         \*/
        elproto.asPX = function (attr, value) {
            if (value == null) {
                value = this.attr(attr);
            }
            return +unit2px(this, attr, value);
        };
// SIERRA Element.use(): I suggest adding a note about how to access the original element the returned <use> instantiates. It's a part of SVG with which ordinary web developers may be least familiar.
        /*\
         * Element.use
         [ method ]
         **
         * Creates a `<use>` element linked to the current element, or if css_ref is provided, creates a '<use>' element
         * from it, and adds it to the current element. In the second case, the current element must have meaningful children.
         **
         = (Element) the `<use>` element
         \*/
        elproto.addUse = function (css_ref, x, y) {
            let use,
                id = this.node.id;

            if (css_ref !== undefined && typeof css_ref === 'string') {
                var select = this.paper.select(css_ref);
                if (select) {
                    use = select.use();
                    if (typeof x == 'number' && typeof y == 'number') {
                        use.attr({x: x, y: y});
                    }
                    this.append(use);
                }
                return use;
            }

            if (!id) {
                id = this.id;
                $(this.node, {
                    id: id,
                });
            }
            if (this.type === 'linearGradient' || this.type === 'radialGradient' ||
                this.type === 'pattern') {
                use = make(this.type, this.node.parentNode);
            }
            if (this.type === 'svg') {
                use = make('use', this.node);
            } else {
                use = make('use', this.node.parentNode);
            }
            $(use.node, {
                'href': '#' + id,
            });
            use.use_target = this;
            return use;
        };

        elproto.use = elproto.addUse;

        function fixids(el, id_rename_callback) {
            const els = el.selectAll('*');
            let it;
            const url = /^\s*url\(("|'|)(.*)\1\)\s*$/,
                ids = [],
                uses = {};

            function urltest(it, name) {
                let val = $(it.node, name);
                val = val && val.match(url);
                val = val && val[2];
                if (val && val.charAt() == '#') {
                    val = val.substring(1);
                } else {
                    return;
                }
                if (val) {
                    uses[val] = (uses[val] || []).concat(function (id) {
                        const attr = {};
                        attr[name] = Snap.url(id);
                        $(it.node, attr);
                    });
                }
            }

            function linktest(it) {
                let val = $(it.node, 'href');
                if (val && val.charAt() == '#') {
                    val = val.substring(1);
                } else {
                    return;
                }
                if (val) {
                    uses[val] = (uses[val] || []).concat(function (id) {
                        it.attr('href', '#' + id);
                    });
                }
            }

            for (var i = 0, ii = els.length; i < ii; ++i) {
                it = els[i];
                urltest(it, 'fill');
                urltest(it, 'stroke');
                urltest(it, 'filter');
                urltest(it, 'mask');
                urltest(it, 'clip-path');
                linktest(it);
                const oldid = $(it.node, 'id');
                if (oldid) {
                    const new_id = (id_rename_callback) ? id_rename_callback(oldid) : it.id;
                    $(it.node, {id: new_id});
                    ids.push({
                        old: oldid,
                        id: new_id,
                    });
                }
            }
            for (i = 0, ii = ids.length; i < ii; ++i) {
                const fs = uses[ids[i].old];
                if (fs) {
                    let j = 0;
                    const jj = fs.length;
                    for (; j < jj; j++) {
                        fs[j](ids[i].id);
                    }
                }
            }
        }

        /*\
         * Element.clone
         [ method ]
         **
         * Creates a clone of the element and inserts it after the element
         **
         = (Element) the clone
         \*/
        elproto.clone = function (hidden, id_rename_callback, deep_copy) {
            if (typeof hidden === 'function') {
                id_rename_callback = hidden;
                hidden = undefined;
            }
            const id = this.attr('id');
            const clone = wrap(this.node.cloneNode(true));
            if (!hidden) clone.insertAfter(this);
            if ($(clone.node, 'id')) {
                const new_id = (id_rename_callback) ?
                    id_rename_callback($(clone.node, 'id')) :
                    clone.id;
                $(clone.node, {id: new_id});
            }
            fixids(clone, id_rename_callback);
            clone.paper = this.paper;
            if (id && !id_rename_callback) clone.attr('id', id);
            if (deep_copy) clone.removeUses();
            return clone;
        };

        const groupLikeTest = {
            //svg tags
           g: true,
           mask: true,
           pattern: true,
           symbol: true,
           clippath: true,
           defs: true,
           svg: true,
            //html tags now
           body: true,
           head: true,
           div: true,
           p: true,
           span: true,
           ul: true,
           ol: true,
           li: true,
           table: true,
           tbody: true,
           thead: true,
           tfoot: true,
           tr: true,
           td: true,
           th: true,
           section: true,
           article: true,
           aside: true,
           nav: true,
           main: true,
           form: true,
           fieldset: true,
           legend: true,
           label: true
        };
        elproto.isGroupLike = function () {
            return !!groupLikeTest[this.type];
        };

        elproto.removeUses = function () {
            if (this.isGroupLike()) {
                this.getChildren().forEach(function (el) {
                    el.removeUses();
                });
                return;
            }

            if (this.type === 'use') {
                let matrix = this.getLocalMatrix(true);
                const x = +this.attr('x');
                const y = +this.attr('y');
                matrix = matrix.multLeft(Snap.matrix().translate(x, y));
                if (!this.use_target) {
                    const href = this.attr('xlink:href') || this.attr('href');
                    if (href) {
                        const elementId = href.substring(href.indexOf('#') + 1);
                        this.use_target = Snap.elementFormId(elementId) ||
                            wrap(this.node.ownerDocument.getElementById(elementId));
                        if (!this.use_target) {
                            console.log('Cannot fine use');
                        }
                    } else {
                        return;
                    }
                }
                let clone;
                if (this.use_target.type === 'symbol') {
                    clone = this.paper.g();
                    clone.add(this.getChildren());
                } else {
                    clone = this.use_target.clone();
                }

                this.after(clone);
                clone.removeUses();
                clone.addTransform(matrix);
                clone.attr('id', this.getId());
                this.remove();
            }
        };

        /*\
         * Element.toDefs
         [ method ]
         **
         * Moves element to the shared `<defs>` area
         **
         = (Element) the element
         \*/
        elproto.toDefs = function () {
            const defs = getSomeDefs(this);
            defs.appendChild(this.node);
            return this;
        };
        /*\
         * Element.toPattern
         [ method ]
         **
         * Creates a `<pattern>` element from the current element
         **
         * To create a pattern you have to specify the pattern rect:
         - x (string|number)
         - y (string|number)
         - width (string|number)
         - height (string|number)
         = (Element) the `<pattern>` element
         * You can use pattern later on as an argument for `fill` attribute:
         | var p = paper.path("M10-5-10,15M15,0,0,15M0-5-20,15").attr({
         |         fill: "none",
         |         stroke: "#bada55",
         |         strokeWidth: 5
         |     }).pattern(0, 0, 10, 10),
         |     c = paper.circle(200, 200, 100);
         | c.attr({
         |     fill: p
         | });
         \*/
        elproto.pattern = elproto.toPattern = function (x, y, width, height) {
            const p = make('pattern', getSomeDefs(this));
            if (x == null) {
                x = this.getBBox();
            }
            if (is(x, 'object') && 'x' in x) {
                y = x.y;
                width = x.width;
                height = x.height;
                x = x.x;
            }
            $(p.node, {
                x: x,
                y: y,
                width: width,
                height: height,
                patternUnits: 'userSpaceOnUse',
                id: p.id,
                viewBox: [x, y, width, height].join(' '),
            });
            p.node.appendChild(this.node);
            return p;
        };
// SIERRA Element.marker(): clarify what a reference point is. E.g., helps you offset the object from its edge such as when centering it over a path.
// SIERRA Element.marker(): I suggest the method should accept default reference point values.  Perhaps centered with (refX = width/2) and (refY = height/2)? Also, couldn't it assume the element's current _width_ and _height_? And please specify what _x_ and _y_ mean: offsets? If so, from where?  Couldn't they also be assigned default values?
        /*\
         * Element.marker
         [ method ]
         **
         * Creates a `<marker>` element from the current element
         **
         * To create a marker you have to specify the bounding rect and reference point:
         - x (number)
         - y (number)
         - width (number)
         - height (number)
         - refX (number)
         - refY (number)
         = (Element) the `<marker>` element
         * You can specify the marker later as an argument for `marker-start`, `marker-end`, `marker-mid`, and `marker` attributes. The `marker` attribute places the marker at every point along the path, and `marker-mid` places them at every point except the start and end.
         \*/
// TODO add usage for markers
        elproto.marker = function (x, y, width, height, refX, refY) {
            const p = make('marker', getSomeDefs(this));
            if (x == null) {
                x = this.getBBox();
            }
            if (is(x, 'object') && 'x' in x) {
                y = x.y;
                width = x.width;
                height = x.height;
                refX = x.refX || x.cx;
                refY = x.refY || x.cy;
                x = x.x;
            }
            $(p.node, {
                viewBox: [x, y, width, height].join(' '),
                markerWidth: width,
                markerHeight: height,
                orient: 'auto',
                refX: refX || 0,
                refY: refY || 0,
                id: p.id,
            });
            p.node.appendChild(this.node);
            return p;
        };
        const eldata = {};
        /*\
         * Element.data
         [ method ]
         **
         * Adds or retrieves given value associated with given key. (Don’t confuse
         * with `data-` attributes)
         *
         * See also @Element.removeData
         - key (string) key to store data
         - value (any) #optional value to store
         = (object) @Element
         * or, if value is not specified:
         = (any) value
         > Usage
         | for (var i = 0, i < 5, i++) {
         |     paper.circle(10 + 15 * i, 10, 10)
         |          .attr({fill: "#000"})
         |          .data("i", i)
         |          .click(function () {
         |             alert(this.data("i"));
         |          });
         | }
         \*/
        elproto.data = function (key, value) {
            const data = eldata[this.id] = eldata[this.id] || {};
            if (arguments.length == 0) {
                Snap._dataEvents && eve(['snap', 'data', 'get', this.id], this, data, null);
                return data;
            }
            if (arguments.length == 1) {
                if (Snap.is(key, 'object')) {
                    for (let i in key) if (key[has](i)) {
                        this.data(i, key[i]);
                    }
                    return this;
                }
                Snap._dataEvents && eve(['snap', 'data', 'get', this.id], this, data[key], key);
                return data[key];
            }
            data[key] = value;
            Snap._dataEvents && eve(['snap', 'data', 'set', this.id], this, value, key);
            return this;
        };
        /*\
         * Element.removeData
         [ method ]
         **
         * Removes value associated with an element by given key.
         * If key is not provided, removes all the data of the element.
         - key (string) #optional key
         = (object) @Element
         \*/
        elproto.removeData = function (key) {
            if (key == null) {
                eldata[this.id] = {};
            } else {
                eldata[this.id] && delete eldata[this.id][key];
            }
            return this;
        };
        /*\
         * Element.outerSVG
         [ method ]
         **
         * Returns SVG code for the element, equivalent to HTML's `outerHTML`.
         *
         * See also @Element.innerSVG
         = (string) SVG code for the element
         \*/
        /*\
         * Element.toString
         [ method ]
         **
         * See @Element.outerSVG
         \*/
        elproto.outerSVG = elproto.toString = toString(1);
        /*\
         * Element.innerSVG
         [ method ]
         **
         * Returns SVG code for the element's contents, equivalent to HTML's `innerHTML`
         = (string) SVG code for the element
         \*/
        elproto.innerSVG = toString();

        function toString(type) {
            return function () {
                let res = type ? '<' + this.type : '';
                const attr = this.node.attributes,
                    chld = this.node.childNodes;

                // var comp_style = window.getComputedStyle(this.node);
                //
                // if (comp_style.hasOwnProperty("cursor") && comp_style.cursor !== "auto" ){
                //  console.log(comp_style.cursor);
                // }

                if (type) {
                    let quote_rep;
                    for (var i = 0, ii = attr.length; i < ii; ++i) {
                        quote_rep = (attr[i].name === 'style') ? '\'' : '\\"';
                        res += ' ' + attr[i].name + '="' +
                            attr[i].value.replace(/"/g, quote_rep) + '"';
                    }
                }
                if (chld.length) {
                    type && (res += '>');
                    for (i = 0, ii = chld.length; i < ii; ++i) {
                        if (chld[i].nodeType == 3) {
                            res += chld[i].nodeValue;
                        } else if (chld[i].nodeType == 1) {
                            res += wrap(chld[i]).toString();
                        }
                    }
                    type && (res += '</' + this.type + '>');
                } else {
                    type && (res += '/>');
                }
                return res;
            };
        }

        elproto.toDataURL = function () {
            if (window && window.btoa) {
                const bb = this.getBBox(),
                    svg = Snap.format(
                        '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="{x} {y} {width} {height}">{contents}</svg>',
                        {
                            x: +bb.x.toFixed(3),
                            y: +bb.y.toFixed(3),
                            width: +bb.width.toFixed(3),
                            height: +bb.height.toFixed(3),
                            contents: this.outerSVG(),
                        });
                return 'data:image/svg+xml;base64,' +
                    btoa(unescape(encodeURIComponent(svg)));
            }
        };
        /*\
         * Fragment.select
         [ method ]
         **
         * See @Element.select
         \*/
        Fragment.prototype.select = elproto.select;
        /*\
         * Fragment.selectAll
         [ method ]
         **
         * See @Element.selectAll
         \*/
        Fragment.prototype.selectAll = elproto.selectAll;
    }
)
;

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
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
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
    /*\
     * Snap.animation
     [ method ]
     **
     * Creates an animation object
     **
     - attr (object) attributes of final destination
     - duration (number) duration of the animation, in milliseconds
     - easing (function) #optional one of easing functions of @mina or custom one
     - callback (function) #optional callback function that fires when animation ends
     = (object) animation object
    \*/
    Snap.animation = function (attr, ms, easing, callback) {
        return new Animation(attr, ms, easing, callback);
    };
    /*\
     * Element.inAnim
     [ method ]
     **
     * Returns a set of animations that may be able to manipulate the current element
     **
     = (object) in format:
     o {
     o     anim (object) animation object,
     o     mina (object) @mina object,
     o     curStatus (number) 0..1 — status of the animation: 0 — just started, 1 — just finished,
     o     status (function) gets or sets the status of the animation,
     o     stop (function) stops the animation
     o }
    \*/
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
    /*\
     * Snap.animate
     [ method ]
     **
     * Runs generic animation of one number into another with a caring function
     **
     - from (number|array) number or array of numbers
     - to (number|array) number or array of numbers
     - setter (function) caring function that accepts one number argument
     - duration (number) duration, in milliseconds
     - easing (function) #optional easing function from @mina or custom
     - callback (function) #optional callback function to execute when animation ends
     = (object) animation object in @mina format
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
    \*/
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
    /*\
     * Element.stop
     [ method ]
     **
     * Stops all the animations for the current element
     **
     = (Element) the current element
    \*/
    elproto.stop = function () {
        const anims = this.inAnim();
        let i = 0;
        const ii = anims.length;
        for (; i < ii; ++i) {
            anims[i].stop();
        }
        return this;
    };
    /*\
     * Element.animate
     [ method ]
     **
     * Animates the given attributes of the element
     **
     - attrs (object) key-value pairs of destination attributes
     - duration (number) duration of the animation in milliseconds
     - easing (function) #optional easing function from @mina or custom
     - callback (function) #optional callback function that executes when the animation ends
     = (Element) the current element
    \*/
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
    var objectToString = Object.prototype.toString,
        Str = String,
        math = Math,
        E = "";

    function Matrix(a, b, c, d, e, f) {
        if (b == null && objectToString.call(a) == "[object SVGMatrix]") {
            this.a = a.a;
            this.b = a.b;
            this.c = a.c;
            this.d = a.d;
            this.e = a.e;
            this.f = a.f;
            return;
        }
        if (b == null && typeof a === "string") {
            a = a.replace("matrix(", "").replace("(", "").replace(")", "");
            a = a.split(",");
            this.a = +a[0] || 0;
            this.b = +a[1] || 0;
            this.c = +a[2] || 0;
            this.d = +a[3] || 0;
            this.e = +a[4] || 0;
            this.f = +a[5] || 0;
            return;
        }
        if (a != null) {
            this.a = +a;
            this.b = +b;
            this.c = +c;
            this.d = +d;
            this.e = +e;
            this.f = +f;
        } else {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
        }
    }

    Snap.registerType("matrix", Matrix);

    (function (matrixproto) {
        /*\
         * Matrix.add
         [ method ]
         **
         * Adds, in the sense of multiplying to the right the given matrix to existing one. This is not matrix addition
         - a (number)
         - b (number)
         - c (number)
         - d (number)
         - e (number)
         - f (number)
         * or
         - matrix (object) @Matrix
        \*/
        matrixproto.add = function (a, b, c, d, e, f) {
            if (a && a instanceof Matrix) {
                return this.add(a.a, a.b, a.c, a.d, a.e, a.f);
            }
            var aNew = a * this.a + b * this.c,
                bNew = a * this.b + b * this.d;
            this.e += e * this.a + f * this.c;
            this.f += e * this.b + f * this.d;
            this.c = c * this.a + d * this.c;
            this.d = c * this.b + d * this.d;

            this.a = aNew;
            this.b = bNew;
            return this;
        };

        matrixproto.multRight = matrixproto.add;

        matrixproto.plus = function (a, b, c, d, e, f) {
            if (a && a instanceof Matrix) {
                return this.plus(a.a, a.b, a.c, a.d, a.e, a.f);
            }

            return this.clone().add(a, b, c, d, e, f);
        };
        matrixproto.scMult = function (c) {
            this.a *= c;
            this.b *= c;
            this.c *= c;
            this.d *= c;
            this.f *= c;
            this.e *= c;
            return this;
        };
        matrixproto.timesSc = function (c) {
            return this.clone().scMult(c);
        };
        /*\
         * Matrix.multLeft
         [ method ]
         **
         * Multiplies a passed affine transform to the left: M * this.
         - a (number)
         - b (number)
         - c (number)
         - d (number)
         - e (number)
         - f (number)
         * or
         - matrix (object) @Matrix
        \*/
        Matrix.prototype.multLeft = function (a, b, c, d, e, f) {
            if (Array.isArray(a)) {
                if (a[0] instanceof Matrix) {
                    for (let i = a.length - 1; i > -1; --i) {
                        this.multLeft(a[i])
                    }
                    return this;
                }
                if (typeof a[0] === "number") {
                    return this.multLeft(a[0] || 0, a[1] || 0,
                        a[2] || 0, a[3] || 0, a[4] || 0, a[5] || 0);
                }
                return this;
            }

            if (a && a instanceof Matrix) {
                return this.multLeft(a.a, a.b, a.c, a.d, a.e, a.f);
            }
            var aNew = a * this.a + c * this.b,
                cNew = a * this.c + c * this.d,
                eNew = a * this.e + c * this.f + e;
            this.b = b * this.a + d * this.b;
            this.d = b * this.c + d * this.d;
            this.f = b * this.e + d * this.f + f;

            this.a = aNew;
            this.c = cNew;
            this.e = eNew;
            return this;
        };
        /*\
         * Matrix.invert
         [ method ]
         **
         * Returns an inverted version of the matrix
         = (object) @Matrix
        \*/
        matrixproto.invert = function () {
            var me = this,
                x = me.a * me.d - me.b * me.c;
            return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
        };
        /*\
         * Matrix.clone
         [ method ]
         **
         * Returns a copy of the matrix
         = (object) @Matrix
        \*/
        matrixproto.clone = function () {
            return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
        };
        /*\
         * Matrix.translate
         [ method ]
         **
         * Translate the matrix
         - x (number) horizontal offset distance
         - y (number) vertical offset distance
        \*/
        matrixproto.translate = function (x, y) {
            this.e += x * this.a + y * this.c;
            this.f += x * this.b + y * this.d;
            return this;
        };
        /*\
         * Matrix.scale
         [ method ]
         **
         * Scales the matrix
         - x (number) amount to be scaled, with `1` resulting in no change
         - y (number) #optional amount to scale along the vertical axis. (Otherwise `x` applies to both axes.)
         - cx (number) #optional horizontal origin point from which to scale
         - cy (number) #optional vertical origin point from which to scale
         * Default cx, cy is the middle point of the element.
        \*/
        matrixproto.scale = function (x, y, cx, cy) {
            y == null && (y = x);
            (cx || cy) && this.translate(cx, cy);
            this.a *= x;
            this.b *= x;
            this.c *= y;
            this.d *= y;
            (cx || cy) && this.translate(-cx, -cy);
            return this;
        };
        /*\
         * Matrix.rotate
         [ method ]
         **
         * Rotates the matrix
         - a (number) angle of rotation, in degrees
         - x (number) horizontal origin point from which to rotate
         - y (number) vertical origin point from which to rotate
        \*/
        matrixproto.rotate = function (a, x, y) {
            a = Snap.rad(a);
            x = x || 0;
            y = y || 0;
            var cos = +math.cos(a).toFixed(9),
                sin = +math.sin(a).toFixed(9);
            this.add(cos, sin, -sin, cos, x, y);
            return this.add(1, 0, 0, 1, -x, -y);
        };
        /*\
         * Matrix.skewX
         [ method ]
         **
         * Skews the matrix along the x-axis
         - x (number) Angle to skew along the x-axis (in degrees).
        \*/
        matrixproto.skewX = function (x) {
            return this.skew(x, 0);
        };
        /*\
         * Matrix.skewY
         [ method ]
         **
         * Skews the matrix along the y-axis
         - y (number) Angle to skew along the y-axis (in degrees).
        \*/
        matrixproto.skewY = function (y) {
            return this.skew(0, y);
        };
        /*\
         * Matrix.skew
         [ method ]
         **
         * Skews the matrix
         - y (number) Angle to skew along the y-axis (in degrees).
         - x (number) Angle to skew along the x-axis (in degrees).
        \*/
        matrixproto.skew = function (x, y) {
            x = x || 0;
            y = y || 0;
            x = Snap.rad(x);
            y = Snap.rad(y);
            var c = math.tan(x).toFixed(9);
            var b = math.tan(y).toFixed(9);
            return this.add(1, b, c, 1, 0, 0);
        };
        /*\
         * Matrix.x
         [ method ]
         **
         * Returns x coordinate for given point after transformation described by the matrix. See also @Matrix.y
         - x (number)
         - y (number)
         = (number) x
        \*/
        matrixproto.x = function (x, y) {
            return x * this.a + y * this.c + this.e;
        };
        /*\
         * Matrix.y
         [ method ]
         **
         * Returns y coordinate for given point after transformation described by the matrix. See also @Matrix.x
         - x (number)
         - y (number)
         = (number) y
        \*/
        matrixproto.y = function (x, y) {
            return x * this.b + y * this.d + this.f;
        };

        matrixproto.randomTrans = function (cx, cy, positive, distance, diff_scale, skip_rotation, skip_scale) {
            distance = distance || 300;
            cx = cx || 0;
            cy = cy || 0;
            let angle = (skip_rotation) ? 0 : 360 * Math.random();
            let scalex = (Math.random() < .5) ? .5 + .5 * Math.random() : 1 + 3 * Math.random();
            let scaley = (diff_scale) ? (Math.random() < .5) ? .5 + .5 * Math.random() : 1 + 3 * Math.random() : scalex;

            if (skip_scale) {
                scalex = 1;
                scaley = 1;
            }

            let dx = (positive) ? distance * Math.random() : distance * (Math.random() - .5),
                dy = (positive) ? distance * Math.random() : distance * (Math.random() - .5);

            return this.translate(dx, dy).rotate(angle, cx + dx, cy + dy).scale(scalex, scaley, cx + dx, cy + dy);
        };

        matrixproto.get = function (i) {
            return +this[Str.fromCharCode(97 + i)].toFixed(9);
        };
        matrixproto.toString = function () {
            return "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")";
        };
        matrixproto.offset = function () {
            return [this.e.toFixed(9), this.f.toFixed(9)];
        };

        matrixproto.equals = function (m, error) {
            if (!m) return false;
            if (error == null) {
                return this.a === m.a && this.b === m.b && this.c === m.c && this.d === m.d && this.e === m.e && this.f === m.f;
            }
            return Math.abs(this.a - m.a) <= error &&
                Math.abs(this.b - m.b) <= error &&
                Math.abs(this.c - m.c) <= error &&
                Math.abs(this.d - m.d) <= error &&
                Math.abs(this.e - m.e) <= error &&
                Math.abs(this.f - m.f) <= error;
        }
        matrixproto.isIdentity = function () {
            return this.a === 1 && !this.b && !this.c && this.d === 1 &&
                !this.e && !this.f;
        };

        matrixproto.toArray = function () {
            return [this.a, this.b, this.c, this.d, this.e, this.f];
        };

        function norm(a) {
            return a[0] * a[0] + a[1] * a[1];
        }

        function normalize(a) {
            var mag = math.sqrt(norm(a));
            a[0] && (a[0] /= mag);
            a[1] && (a[1] /= mag);
        }

        /*\
         * Matrix.determinant
         [ method ]
         **
         * Finds determinant of the given matrix.
         = (number) determinant
        \*/
        matrixproto.determinant = function () {
            return this.a * this.d - this.b * this.c;
        };
        /*\
         * Matrix.split
         [ method ]
         **
         * Splits matrix into primitive transformations
         = (object) in format:
         o dx (number) translation by x
         o dy (number) translation by y
         o scalex (number) scale by x
         o scaley (number) scale by y
         o shear (number) shear
         o rotate (number) rotation in deg
         o isSimple (boolean) could it be represented via simple transformations
        \*/
        matrixproto.split = function (add_pre_translation) {
            var out = {};
            // translation
            out.dx = this.e;
            out.dy = this.f;

            //pre-translation
            if (add_pre_translation) {
                let m = this.clone();
                m.e -= this.e;
                m.f -= this.f;
                let inv = m.invert();

                m = this.clone();
                m.multLeft(inv);
                out.px = m.e;
                out.py = m.f;
            }


            // scale and shear
            var row = [[this.a, this.b], [this.c, this.d]];
            out.scalex = math.sqrt(norm(row[0]));
            normalize(row[0]);

            out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
            row[1] = [row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear];

            out.scaley = math.sqrt(norm(row[1]));
            normalize(row[1]);
            out.shear /= out.scaley;

            if (this.determinant() < 0) {
                out.scalex = -out.scalex;
            }

            // rotation
            var sin = row[0][1],
                cos = row[1][1];
            if (cos < 0) {
                out.rotate = Snap.deg(math.acos(cos));
                if (sin < 0) {
                    out.rotate = 360 - out.rotate;
                }
            } else {
                out.rotate = Snap.deg(math.asin(sin));
            }

            out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
            out.isSuperSimple = !+out.shear.toFixed(9) && out.scalex.toFixed(9) == out.scaley.toFixed(9) && !out.rotate;
            out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
            return out;
        };

        matrixproto.split2 = function getTransform() {
            let a = this.a,
                b = this.b,
                c = this.c,
                d = this.d,
                e = this.e,
                f = this.f;

            const dx = e;
            const dy = f;
            const r = Math.atan2(b, a);
            const scx = Math.sqrt(a * a + b * b);
            const scy = (a * d - b * c) / scx;

            return {dx: dx, dy: dy, r: Snap.deg(r), scalex: scx, scaley: scy};
        }

        /*\
         * Matrix.toTransformString
         [ method ]
         **
         * Returns transform string that represents given matrix
         = (string) transform string
        \*/
        matrixproto.toTransformString = function (shorter) {
            var s = shorter || this.split();
            if (!+s.shear.toFixed(9)) {
                s.scalex = +s.scalex.toFixed(9);
                s.scaley = +s.scaley.toFixed(9);
                s.rotate = +s.rotate.toFixed(9);
                return (s.dx || s.dy ? "t" + [+s.dx.toFixed(9), +s.dy.toFixed(9)] : E) +
                    (s.rotate ? "r" + [+s.rotate.toFixed(9), 0, 0] : E) +
                    (s.scalex != 1 || s.scaley != 1 ? "s" + [s.scalex, s.scaley, 0, 0] : E);
            } else {
                return "m" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)];
            }
        };

        matrixproto.isMatrix = function () {
            return true;
        }

        matrixproto.twoPointTransformMatrix = function (x1, y1, x1Prime, y1Prime, x2, y2, x2Prime, y2Prime) {
            // Calculate distances before and after transformation
            const distanceBefore = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const distanceAfter = Math.sqrt(Math.pow(x2Prime - x1Prime, 2) + Math.pow(y2Prime - y1Prime, 2));

            // Scale factor
            const s = distanceAfter / distanceBefore;

            // Calculate rotation angle theta
            const dotProduct = (x2Prime - x1Prime) * (x2 - x1) + (y2Prime - y1Prime) * (y2 - y1);
            const determinant = (x2Prime - x1Prime) * (y2 - y1) - (y2Prime - y1Prime) * (x2 - x1);
            const theta = Math.atan2(determinant, dotProduct);

            // Calculate components of the transformation matrix
            const a = s * Math.cos(theta);
            const b = s * Math.sin(theta);
            const c = -s * Math.sin(theta);
            const d = s * Math.cos(theta);

            // Calculate translation components
            const e = x1Prime - (a * x1 + c * y1);
            const f = y1Prime - (b * x1 + d * y1);

            // Return the transformation matrix
            return new Snap.Matrix(a, b, c, d, e, f);
        }

        function rightLeftFlipMatrix(m, base) {
            let inv = base.clone().invert();
            return base.clone().multRight(m).multRight(inv);
        }

        function rotScaleSplit(m) {
            m = m || this;
            const split = m.split();
            const tm = new Matrix().translate(split.dx, split.dy);
            const rm = new Matrix().rotate(split.rotate);
            const scm = new Matrix().scale(split.scalex, split.scaley);
            const shm = new Matrix().skew(split.shear);

            const rot_shear = rightLeftFlipMatrix(rm.multRight(shm), tm);
            const trans_scale = scm.multLeft(tm);

            return {
                0: trans_scale,
                1: rot_shear,
                trans_scale: trans_scale,
                rot_shear: rot_shear,
                scalex: split.scalex,
                scaley: split.scaley,
                rotate: split.rotate,
                shear: split.shear,
                dx: split.dx,
                dy: split.dy
            };
        }

        matrixproto.rotScaleSplit = rotScaleSplit;

    })(Matrix.prototype);
    /*\
     * Snap.Matrix
     [ method ]
     **
     * Matrix constructor, extend on your own risk.
     * To create matrices use @Snap.matrix.
    \*/
    Snap.Matrix = Matrix;
    /*\
     * Snap.matrix
     [ method ]
     **
     * Utility method
     **
     * Returns a matrix based on the given parameters
     - a (number)
     - b (number)
     - c (number)
     - d (number)
     - e (number)
     - f (number)
     * or
     - svgMatrix (SVGMatrix)
     = (object) @Matrix
    \*/
    Snap.matrix = function (a, b, c, d, e, f) {
        return new Matrix(a, b, c, d, e, f);
    };
});

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
    var has = "hasOwnProperty",
        make = Snap._.make,
        wrap = Snap._.wrap,
        is = Snap.is,
        getSomeDefs = Snap._.getSomeDefs,
        reURLValue = /^url\((['"]?)([^)]+)\1\)$/,
        $ = Snap._.$,
        URL = Snap.url,
        Str = String,
        separator = Snap._.separator,
        E = "";
    /*\
     * Snap.deurl
     [ method ]
     **
     * Unwraps path from `"url(<path>)"`.
     - value (string) url path
     = (string) unwrapped path
    \*/
    Snap.deurl = function (value) {
        var res = String(value).match(reURLValue);
        return res ? res[2] : value;
    }
    // Attributes event handlers
    eve.on("snap.util.attr.mask", function (value) {
        if (value instanceof Element || value instanceof Fragment) {
            eve.stop();
            if (value instanceof Fragment && value.node.childNodes.length == 1) {
                value = value.node.firstChild;
                getSomeDefs(this).appendChild(value);
                value = wrap(value);
            }
            if (value.type == "mask") {
                var mask = value;
            } else {
                mask = make("mask", getSomeDefs(this));
                mask.node.appendChild(value.node);
            }
            !mask.node.id && $(mask.node, {
                id: mask.id
            });
            mask.attrMonitor("id");
            $(this.node, {
                mask: URL(mask.id)
            });
            this.attrMonitor("mask");
        }
    });
    (function (clipIt) {
        eve.on("snap.util.attr.clip", clipIt);
        eve.on("snap.util.attr.clip-path", clipIt);
        eve.on("snap.util.attr.clipPath", clipIt);
    }(function (value) {
        if (value instanceof Element || value instanceof Fragment) {
            eve.stop();
            var clip,
                node = value.node;
            while (node) {
                if (node.nodeName === "clipPath") {
                    clip = new Element(node);
                    break;
                }
                if (node.nodeName === "svg") {
                    clip = undefined;
                    break;
                }
                node = node.parentNode;
            }
            if (!clip) {
                clip = make("clipPath", getSomeDefs(this));
                clip.node.appendChild(value.node);
                !clip.node.id && $(clip.node, {
                    id: clip.id
                });
            }
            $(this.node, {
                "clip-path": URL(clip.node.id || clip.id)
            });
            this.attrMonitor("clip-path");
            this.clearCHull();
        }
    }));

    function fillStroke(name) {
        return function (value) {
            eve.stop();
            if (value instanceof Fragment && value.node.childNodes.length == 1 &&
                (value.node.firstChild.tagName == "radialGradient" ||
                    value.node.firstChild.tagName == "linearGradient" ||
                    value.node.firstChild.tagName == "pattern")) {
                value = value.node.firstChild;
                getSomeDefs(this).appendChild(value);
                value = wrap(value);
            }
            if (value instanceof Element) {
                if (value.type == "radialGradient" || value.type == "linearGradient"
                    || value.type == "pattern") {
                    if (!value.node.id) {
                        $(value.node, {
                            id: value.id
                        });
                    }
                    var fill = URL(value.node.id);
                } else {
                    fill = value.attr(name);
                }
            } else {
                fill = Snap.color(value);
                if (fill.error) {
                    var grad = Snap(getSomeDefs(this).ownerSVGElement).gradient(value);
                    if (grad) {
                        if (!grad.node.id) {
                            $(grad.node, {
                                id: grad.id
                            });
                        }
                        fill = URL(grad.node.id);
                    } else {
                        fill = value;
                    }
                } else {
                    fill = Str(fill);
                }
            }
            var attrs = {};
            attrs[name] = fill;
            $(this.node, attrs);
            this.node.style[name] = E;
            this.attrMonitor(name);
        };
    }

    eve.on("snap.util.attr.fill", fillStroke("fill"));
    eve.on("snap.util.attr.stroke", fillStroke("stroke"));
    var gradrg = /^([lr])(?:\(([^)]*)\))?(.*)$/i;
    eve.on("snap.util.grad.parse", function parseGrad(string) {
        string = Str(string);
        var tokens = string.match(gradrg);
        if (!tokens) {
            return null;
        }
        var type = tokens[1],
            params = tokens[2],
            stops = tokens[3];
        params = params.split(/\s*,\s*/).map(function (el) {
            return +el == el ? +el : el;
        });
        if (params.length == 1 && params[0] == 0) {
            params = [];
        }
        stops = stops.split("-");
        stops = stops.map(function (el) {
            el = el.split(":");
            var out = {
                color: el[0]
            };
            if (el[1]) {
                out.offset = parseFloat(el[1]);
            }
            return out;
        });
        var len = stops.length,
            start = 0,
            j = 0;

        function seed(i, end) {
            var step = (end - start) / (i - j);
            for (var k = j; k < i; k++) {
                stops[k].offset = +(+start + step * (k - j)).toFixed(2);
            }
            j = i;
            start = end;
        }

        len--;
        for (var i = 0; i < len; ++i) if ("offset" in stops[i]) {
            seed(i, stops[i].offset);
        }
        stops[len].offset = stops[len].offset || 100;
        seed(len, stops[len].offset);
        return {
            type: type,
            params: params,
            stops: stops
        };
    });

    eve.on("snap.util.attr.d", function (value) {
        eve.stop();
        if (is(value, "array") && is(value[0], "array")) {
            value = Snap.path.toString.call(value);
        }
        value = Str(value);
        if (value.match(/[ruo]/i)) {
            value = Snap.path.toAbsolute(value);
        }
        this.clearCHull();
        $(this.node, {d: value});
    })(-1);
    eve.on("snap.util.attr.points", function (value) {
        if (Array.isArray(value)) {
            if (Array.isArray(value[0])) {
                eve.stop();
                let points = [];
                value.forEach((p) => {
                    points.push(p[0]);
                    points.push(p[1]);
                });
                this.attr("points", points);
            } else if (typeof value[0] === "object" && value[0].hasOwnProperty("x")) {
                eve.stop();
                let points = [];
                value.forEach((p) => {
                    points.push(p.x);
                    points.push(p.y);
                });
                this.attr("points", points);
            }
        }
        this.clearCHull();
    })(-1);
    eve.on("snap.util.attr.#text", function (value) {
        eve.stop();
        value = Str(value);
        var txt = glob.doc.createTextNode(value);
        while (this.node.firstChild) {
            this.node.removeChild(this.node.firstChild);
        }
        this.node.appendChild(txt);
        this.clearCHull();
    })(-1);
    eve.on("snap.util.attr.path", function (value) {
        eve.stop();
        this.attr({d: value});
    })(-1);
    eve.on("snap.util.attr.class", function (value) {
        eve.stop();
        if (typeof this.node.className === "object") {
            this.node.className.baseVal = value;
        } else {
            this.node.className = value;
        }
        this.attrMonitor("class");

    })(-1);
    eve.on("snap.util.attr.viewBox", function (value) {
        var vb;
        if (is(value, "object") && "x" in value) {
            vb = [value.x, value.y, value.width, value.height].join(" ");
        } else if (is(value, "array")) {
            vb = value.join(" ");
        } else {
            vb = value;
        }
        $(this.node, {
            viewBox: vb
        });
        this.attrMonitor("viewBox");
        eve.stop();
    })(-1);
    eve.on("snap.util.attr.transform", function (value) {
        this.transform(value);
        eve.stop();
    })(-1);
    eve.on("snap.util.attr.r", function (value) {
        if (this.type == "rect") {
            eve.stop();
            $(this.node, {
                rx: value,
                ry: value
            });
            this.attrMonitor("rx").attrMonitor("ry");

            this.clearCHull();
        }
    })(-1);
    eve.on("snap.util.attr.textpath", function (value) {
        eve.stop();
        if (this.type == "text") {
            var id, tp, node;
            if (!value && this.textPath) {
                tp = this.textPath;
                while (tp.node.firstChild) {
                    this.node.appendChild(tp.node.firstChild);
                }
                tp.remove();
                delete this.textPath;
                return;
            }
            if (is(value, "string")) {
                var defs = getSomeDefs(this),
                    path = wrap(defs.parentNode).path(value),
                    textpath_group = defs.querySelector("#text-paths");
                defs = textpath_group || defs;
                defs.appendChild(path.node);
                id = path.id;
                path.attr({id: id});
            } else {
                value = wrap(value);
                if (value instanceof Element) {
                    id = value.attr("id");
                    if (!id) {
                        id = value.id;
                        value.attr({id: id});
                    }
                }
            }
            if (id) {
                tp = this.textPath;
                node = this.node;
                if (tp) {
                    tp.attr({"xlink:href": "#" + id});
                } else {
                    tp = $("textPath", {
                        "xlink:href": "#" + id
                    });
                    while (node.firstChild) {
                        tp.appendChild(node.firstChild);
                    }
                    node.appendChild(tp);
                    this.textPath = wrap(tp);
                }
            }
            this.clearCHull();
        }
    })(-1);
    eve.on("snap.util.attr.text", function (value) {
        if (this.type == "text") {
            var i = 0,
                node = this.node,
                tuner = function (chunk) {
                    var out = $("tspan");
                    if (is(chunk, "array")) {
                        for (var i = 0; i < chunk.length; ++i) {
                            const newChild = tuner(chunk[i]);
                            out.appendChild(newChild);
                        }
                    } else {
                        out.appendChild(glob.doc.createTextNode(chunk));
                    }
                    out.normalize && out.normalize();
                    return out;
                };
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
            var tuned = tuner(value);
            while (tuned.firstChild) {
                node.appendChild(tuned.firstChild);
            }
            this.clearCHull();
        }
        eve.stop();
    })(-1);

    eve.on("snap.util.attr.href", function (value) {
        if (this.type === "use" && this.use_target) this.use_target = undefined;
        this.clearCHull();
        value = Snap.fixUrl(value);
        if (value) {
            $(this.node, {href: value});
        } else {
            this.node.removeAttribute("href");
        }
        this.attrMonitor("href");
    });

    eve.on("snap.util.attr.src", function (value) {
        value = Snap.fixUrl(value);
        if (value) {
            $(this.node, {src: value});
        } else {
            this.node.removeAttribute("src");
        }
        this.attrMonitor("src");
    });

    function setFontSize(value) {
        eve.stop();
        if (value == +value) {
            value += "px";
        }
        this.node.style.fontSize = value;
        this.attrMonitor(["font-size", "fontSize"]);
        this.clearCHull();
    }

    eve.on("snap.util.attr.fontSize", setFontSize)(-1);
    eve.on("snap.util.attr.font-size", setFontSize)(-1);

    function fontClearBox(value) {
        this.clearCHull();
    }
    //Attributs
    eve.on("snap.util.attr.fontFamily", fontClearBox)(-1);
    eve.on("snap.util.attr.font-family", fontClearBox)(-1);
    eve.on("snap.util.attr.fontWeight", fontClearBox)(-1);
    eve.on("snap.util.attr.font-weight", fontClearBox)(-1);
    eve.on("snap.util.attr.fontStyle", fontClearBox)(-1);
    eve.on("snap.util.attr.font-style", fontClearBox)(-1);
    eve.on("snap.util.attr.letterSpacing", fontClearBox)(-1);
    eve.on("snap.util.attr.letter-spacing", fontClearBox)(-1);
    eve.on("snap.util.attr.wordSpacing", fontClearBox)(-1);
    eve.on("snap.util.attr.word-spacing", fontClearBox)(-1);
    eve.on("snap.util.attr.textAnchor", fontClearBox)(-1);
    eve.on("snap.util.attr.text-anchor", fontClearBox)(-1);

    eve.on("snap.util.getattr.transform", function () {
        eve.stop();
        return this.transform();
    })(-1);
    eve.on("snap.util.getattr.textpath", function () {
        eve.stop();
        return this.textPath;
    })(-1);
    // Markers
    (function () {
        function getter(end) {
            return function () {
                eve.stop();
                var style = glob.doc.defaultView.getComputedStyle(this.node, null).getPropertyValue("marker-" + end);
                if (style == "none") {
                    return style;
                } else {
                    return Snap(glob.doc.getElementById(style.match(reURLValue)[1]));
                }
            };
        }

        function setter(end) {
            return function (value) {
                eve.stop();
                var name = "marker" + end.charAt(0).toUpperCase() + end.substring(1);
                if (value == "" || !value) {
                    this.node.style[name] = "none";
                    this.attrMonitor(name);
                    return;
                }
                if (value.type == "marker") {
                    var id = value.node.id;
                    if (!id) {
                        $(value.node, {id: value.id});
                        value.attrMonitor("id");
                    }
                    this.node.style[name] = URL(id);
                    this.attrMonitor(name);
                    return;
                }
            };
        }

        eve.on("snap.util.getattr.marker-end", getter("end"))(-1);
        eve.on("snap.util.getattr.markerEnd", getter("end"))(-1);
        eve.on("snap.util.getattr.marker-start", getter("start"))(-1);
        eve.on("snap.util.getattr.markerStart", getter("start"))(-1);
        eve.on("snap.util.getattr.marker-mid", getter("mid"))(-1);
        eve.on("snap.util.getattr.markerMid", getter("mid"))(-1);
        eve.on("snap.util.attr.marker-end", setter("end"))(-1);
        eve.on("snap.util.attr.markerEnd", setter("end"))(-1);
        eve.on("snap.util.attr.marker-start", setter("start"))(-1);
        eve.on("snap.util.attr.markerStart", setter("start"))(-1);
        eve.on("snap.util.attr.marker-mid", setter("mid"))(-1);
        eve.on("snap.util.attr.markerMid", setter("mid"))(-1);
    }());
    eve.on("snap.util.getattr.r", function () {
        if (this.type == "rect" && $(this.node, "rx") == $(this.node, "ry")) {
            eve.stop();
            return $(this.node, "rx");
        }
    })(-1);

    function textExtract(node) {
        var out = [];
        var children = node.childNodes;
        for (var i = 0, ii = children.length; i < ii; ++i) {
            var chi = children[i];
            if (chi.nodeType == 3) {
                out.push(chi.nodeValue);
            }
            if (chi.tagName == "tspan") {
                if (chi.childNodes.length == 1 && chi.firstChild.nodeType == 3) {
                    out.push(chi.firstChild.nodeValue);
                } else {
                    out.push(textExtract(chi));
                }
            }
        }
        return out;
    }

    eve.on("snap.util.getattr.text", function () {
        if (this.type == "text" || this.type == "tspan") {
            eve.stop();
            var out = textExtract(this.node);
            return out.length == 1 ? out[0] : out;
        }
    })(-1);
    eve.on("snap.util.getattr.#text", function () {
        return this.node.textContent;
    })(-1);
    eve.on("snap.util.getattr.fill", function (internal) {
        if (internal) {
            return;
        }
        eve.stop();
        var value = eve(["snap", "util", "getattr", "fill"], this, true).firstDefined();
        return Snap(Snap.deurl(value)) || value;
    })(-1);
    eve.on("snap.util.getattr.stroke", function (internal) {
        if (internal) {
            return;
        }
        eve.stop();
        var value = eve(["snap", "util", "getattr", "stroke"], this, true).firstDefined();
        return Snap(Snap.deurl(value)) || value;
    })(-1);
    eve.on("snap.util.getattr.viewBox", function () {
        eve.stop();
        var vb = $(this.node, "viewBox").trim();
        if (vb) {
            vb = vb.split(separator);
            return Snap.box(+vb[0], +vb[1], +vb[2], +vb[3]);
        } else {
            return;
        }
    })(-1);
    eve.on("snap.util.getattr.points", function () {
        var p = $(this.node, "points").trim();
        eve.stop();
        if (p) {

            return p.split(separator);
        } else {
            return;
        }
    })(-1);
    eve.on("snap.util.getattr.path", function () {
        var p = $(this.node, "d").trim();
        eve.stop();
        return p;
    })(-1);
    eve.on("snap.util.getattr.class", function () {
        return (typeof this.node.className === "string") ? this.node.className : this.node.className.baseVal;
    })(-1);

    function getFontSize() {
        eve.stop();
        return this.node.style.fontSize;
    }

    eve.on("snap.util.getattr.fontSize", getFontSize)(-1);
    eve.on("snap.util.getattr.font-size", getFontSize)(-1);
});

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
        /*\
         * Element.addClass
         [ method ]
         **
         * Adds given class name or list of class names to the element.
         - value (string) class name or space separated list of class names
         **
         = (Element) original element.
        \*/
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
        /*\
             * Element.removeClass
             [ method ]
             **
             * Removes given class name or list of class names from the element.
             - value (string) class name or space separated list of class names
             - prefix (boolean) if true, removes all classes that start with the given class name
             **
             = (Element) original element.
            \*/
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
        /*\
         * Element.hasClass
         [ method ]
         **
         * Checks if the element has a given class name in the list of class names applied to it.
         - value (string) class name
         **
         = (boolean) `true` if the element has given class
        \*/
        elproto.hasClass = function (value) {
            var elem = this.node,
                className = (typeof elem.className === "object") ? elem.className.baseVal : elem.className,
                curClasses = className.match(rgNotSpace) || [];
            return !!~curClasses.indexOf(value);
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
        /*\
         * Element.toggleClass
         [ method ]
         **
         * Add or remove one or more classes from the element, depending on either
         * the class’s presence or the value of the `flag` argument.
         - value (string) class name or space separated list of class names
         - flag (boolean) value to determine whether the class should be added or removed
         **
         = (Element) original element.
        \*/
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
    var operators = {
            "+": function (x, y) {
                    return x + y;
                },
            "-": function (x, y) {
                    return x - y;
                },
            "/": function (x, y) {
                    return x / y;
                },
            "*": function (x, y) {
                    return x * y;
                }
        },
        Str = String,
        reUnit = /[a-z]+$/i,
        reAddon = /^\s*([+\-\/*])\s*=\s*([\d.eE+\-]+)\s*([^\d\s]+)?\s*$/;
    function getNumber(val) {
        return val;
    }
    function getUnit(unit) {
        return function (val) {
            return +val.toFixed(3) + unit;
        };
    }
    eve.on("snap.util.attr", function (val) {
        var plus = Str(val).match(reAddon);
        if (plus) {
            var evnt = eve.nt(),
                name = evnt.substring(evnt.lastIndexOf(".") + 1),
                a = this.attr(name),
                atr = {};
            eve.stop();
            var unit = plus[3] || "",
                aUnit = a.match(reUnit),
                op = operators[plus[1]];
            if (aUnit && aUnit == unit) {
                val = op(parseFloat(a), +plus[2]);
            } else {
                a = this.asPX(name);
                val = op(this.asPX(name), this.asPX(name, plus[2] + unit));
            }
            if (isNaN(a) || isNaN(val)) {
                return;
            }
            atr[name] = val;
            this.attr(atr);
        }
    })(-10);
    eve.on("snap.util.equal", function (name, b) {
        var A, B, a = Str(this.attr(name) || ""),
            el = this,
            bplus = Str(b).match(reAddon);
        if (bplus) {
            eve.stop();
            var unit = bplus[3] || "",
                aUnit = a.match(reUnit),
                op = operators[bplus[1]];
            if (aUnit && aUnit == unit) {
                return {
                    from: parseFloat(a),
                    to: op(parseFloat(a), +bplus[2]),
                    f: getUnit(aUnit)
                };
            } else {
                a = this.asPX(name);
                return {
                    from: a,
                    to: op(a, this.asPX(name, bplus[2] + unit)),
                    f: getNumber
                };
            }
        }
    })(-10);
});

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
    var proto = Paper.prototype,
        is = Snap.is;
    /*\
     * Paper.rect
     [ method ]
     *
     * Draws a rectangle
     **
     - x (number) x coordinate of the top left corner
     - y (number) y coordinate of the top left corner
     - width (number) width
     - height (number) height
     - rx (number) #optional horizontal radius for rounded corners, default is 0
     - ry (number) #optional vertical radius for rounded corners, default is rx or 0
     = (object) the `rect` element
     **
     > Usage
     | // regular rectangle
     | var c = paper.rect(10, 10, 50, 50);
     | // rectangle with rounded corners
     | var c = paper.rect(40, 40, 50, 50, 10);
    \*/
    proto.rect = function (x, y, w, h, rx, ry, attr) {
        if (is(rx, "object") && !Array.isArray(rx)) {
            attr = rx;
            rx = ry = undefined
        }
        if (is(ry, "object")) {
            attr = ry;
            ry = undefined
        }
        if (ry == null) {
            ry = rx;
        }
        attr = attr || {};
        if (is(x, "object") && x == "[object Object]") {
            attr = x;
        } else if (x != null) {
            attr = Object.assign(attr, {
                x: x,
                y: y,
                width: w,
                height: h
            });
            if (rx != null) {
                if (Array.isArray(rx)) {
                    ry = rx[1];
                    rx = rx[0];
                }
                attr.rx = rx;
                attr.ry = ry;
            }
        }
        return this.el("rect", attr);
    };
    /*\
     * Paper.circle
     [ method ]
     **
     * Draws a circle
     **
     - x (number) x coordinate of the centre
     - y (number) y coordinate of the centre
     - r (number) radius
     = (object) the `circle` element
     **
     > Usage
     | var c = paper.circle(50, 50, 40);
    \*/
    proto.circle = function (cx, cy, r, attr) {
        if (is(cx, "object") && cx == "[object Object]") {
            attr = cx;
        } else if (cx != null) {
            attr = attr || {};
            attr = Object.assign(attr, {
                cx: cx,
                cy: cy,
                r: r
            });
        }
        return this.el("circle", attr);
    };

    var preload = (function () {
        function onerror() {
            this.parentNode.removeChild(this);
        }

        return function (src, f) {
            var img = glob.doc.createElement("img"),
                body = glob.doc.body;
            img.style.cssText = "position:absolute;left:-9999em;top:-9999em";
            img.onload = function () {
                f.call(img);
                img.onload = img.onerror = null;
                body.removeChild(img);
            };
            img.onerror = onerror;
            body.appendChild(img);
            img.src = src;
        };
    }());

    /*\
     * Paper.image
     [ method ]
     **
     * Places an image on the surface
     **
     - src (string) URI of the source image
     - x (number) x offset position
     - y (number) y offset position
     - width (number) width of the image
     - height (number) height of the image
     = (object) the `image` element
     * or
     = (object) Snap element object with type `image`
     **
     > Usage
     | var c = paper.image("apple.png", 10, 10, 80, 80);
    \*/
    proto.image = function (src, x, y, width, height, attr) {
        var el = this.el("image");
        if (is(src, "object") && "src" in src) {
            el.attr(src);
        } else if (src != null) {
            var set = {
                "xlink:href": src,
                preserveAspectRatio: "none"
            };
            if (x != null && y != null) {
                set.x = x;
                set.y = y;
            }
            if (width != null && height != null) {
                set.width = width;
                set.height = height;
            } else {
                preload(src, function () {
                    Snap._.$(el.node, {
                        width: this.offsetWidth,
                        height: this.offsetHeight
                    });
                });
            }
            Snap._.$(el.node, set);
            if (attr) el.attr(attr);
        }

        return el;
    };
    /*\
     * Paper.ellipse
     [ method ]
     **
     * Draws an ellipse
     **
     - x (number) x coordinate of the centre
     - y (number) y coordinate of the centre
     - rx (number) horizontal radius
     - ry (number) vertical radius
     = (object) the `ellipse` element
     **
     > Usage
     | var c = paper.ellipse(50, 50, 40, 20);
    \*/
    proto.ellipse = function (cx, cy, rx, ry, attr) {
        if (is(cx, "object") && cx == "[object Object]") {
            attr = cx;
        } else if (cx != null) {
            attr = attr || {};
            attr = Object.assign(attr, {
                cx: cx,
                cy: cy,
                rx: rx,
                ry: ry
            });
        }
        return this.el("ellipse", attr);
    };
// SIERRA Paper.path(): Unclear from the link what a Catmull-Rom curveto is, and why it would make life any easier.
    /*\
     * Paper.path
     [ method ]
     **
     * Creates a `<path>` element using the given string as the path's definition
     - pathString (string) #optional path string in SVG format
     * Path string consists of one-letter commands, followed by comma seprarated arguments in numerical form. Example:
     | "M10,20L30,40"
     * This example features two commands: `M`, with arguments `(10, 20)` and `L` with arguments `(30, 40)`. Uppercase letter commands express coordinates in absolute terms, while lowercase commands express them in relative terms from the most recently declared coordinates.
     *
     # <p>Here is short list of commands available, for more details see <a href="http://www.w3.org/TR/SVG/paths.html#PathData" title="Details of a path's data attribute's format are described in the SVG specification.">SVG path string format</a> or <a href="https://developer.mozilla.org/en/SVG/Tutorial/Paths">article about path strings at MDN</a>.</p>
     # <table><thead><tr><th>Command</th><th>Name</th><th>Parameters</th></tr></thead><tbody>
     # <tr><td>M</td><td>moveto</td><td>(x y)+</td></tr>
     # <tr><td>Z</td><td>closepath</td><td>(none)</td></tr>
     # <tr><td>L</td><td>lineto</td><td>(x y)+</td></tr>
     # <tr><td>H</td><td>horizontal lineto</td><td>x+</td></tr>
     # <tr><td>V</td><td>vertical lineto</td><td>y+</td></tr>
     # <tr><td>C</td><td>curveto</td><td>(x1 y1 x2 y2 x y)+</td></tr>
     # <tr><td>S</td><td>smooth curveto</td><td>(x2 y2 x y)+</td></tr>
     # <tr><td>Q</td><td>quadratic Bézier curveto</td><td>(x1 y1 x y)+</td></tr>
     # <tr><td>T</td><td>smooth quadratic Bézier curveto</td><td>(x y)+</td></tr>
     # <tr><td>A</td><td>elliptical arc</td><td>(rx ry x-axis-rotation large-arc-flag sweep-flag x y)+</td></tr>
     # <tr><td>R</td><td><a href="http://en.wikipedia.org/wiki/Catmull–Rom_spline#Catmull.E2.80.93Rom_spline">Catmull-Rom curveto</a>*</td><td>x1 y1 (x y)+</td></tr></tbody></table>
     * * _Catmull-Rom curveto_ is a not standard SVG command and added to make life easier.
     * Note: there is a special case when a path consists of only three commands: `M10,10R…z`. In this case the path connects back to its starting point.
     > Usage
     | var c = paper.path("M10 10L90 90");
     | // draw a diagonal line:
     | // move to 10,10, line to 90,90
    \*/
    proto.path = function (d, attr) {
        attr = attr || {};
        if (is(d, "object") && !is(d, "array")) {
            attr = Object.assign(attr, d);
        } else if (d) {
            attr['d'] = d;
        }
        return this.el("path", attr);
    };
    /*\
     * Paper.g
     [ method ]
     **
     * Creates a def_group element
     **
     - varargs (…) #optional elements to nest within the def_group
     = (object) the `g` element
     **
     > Usage
     | var c1 = paper.circle(),
     |     c2 = paper.rect(),
     |     g = paper.g(c2, c1); // note that the order of elements is different
     * or
     | var c1 = paper.circle(),
     |     c2 = paper.rect(),
     |     g = paper.g();
     | g.add(c2, c1);
    \*/
    /*\
     * Paper.def_group
     [ method ]
     **
     * See @Paper.g
    \*/
    proto.def_group = proto.g = function () {
        var attr,
            el = this.el("g");

        var last = (arguments.length) ? arguments[arguments.length - 1] : undefined;
        if (last && is(last, "object") && !last.type && !last.paper) {
            attr = last
        }

        if (arguments.length) {
            var end = (attr) ? -1 : undefined;
            el.add(Array.prototype.slice.call(arguments, 0, end));
        }

        if (attr) el.attr(attr);

        return el;
    };
    /*\
     * Paper.svg
     [ method ]
     **
     * Creates a nested SVG element.
     - x (number) @optional X of the element
     - y (number) @optional Y of the element
     - width (number) @optional width of the element
     - height (number) @optional height of the element
     - vbx (number) @optional viewbox X
     - vby (number) @optional viewbox Y
     - vbw (number) @optional viewbox width
     - vbh (number) @optional viewbox height
     **
     = (object) the `svg` element
     **
    \*/
    proto.svg = function (x, y, width, height, vbx, vby, vbw, vbh) {
        var attrs = {};
        if (is(x, "object") && y == null) {
            attrs = x;
        } else {
            if (x != null) {
                attrs.x = x;
            }
            if (y != null) {
                attrs.y = y;
            }
            if (width != null) {
                attrs.width = width;
            }
            if (height != null) {
                attrs.height = height;
            }
            if (vbx != null && vby != null && vbw != null && vbh != null) {
                attrs.viewBox = [vbx, vby, vbw, vbh];
            }
        }
        return this.el("svg", attrs);
    };
    proto.svg.skip = true;
    /*\
     * Paper.mask
     [ method ]
     **
     * Equivalent in behaviour to @Paper.g, except it’s a mask.
     **
     = (object) the `mask` element
     **
    \*/
    proto.mask = function (first) {
        var attr,
            el = this.el("mask");
        if (arguments.length == 1 && first && !first.type) {
            el.attr(first);
        } else if (arguments.length) {
            el.add(Array.prototype.slice.call(arguments, 0));
        }
        return el;
    };
    /*\
     * Paper.ptrn
     [ method ]
     **
     * Equivalent in behaviour to @Paper.g, except it’s a pattern.
     - x (number) @optional X of the element
     - y (number) @optional Y of the element
     - width (number) @optional width of the element
     - height (number) @optional height of the element
     - vbx (number) @optional viewbox X
     - vby (number) @optional viewbox Y
     - vbw (number) @optional viewbox width
     - vbh (number) @optional viewbox height
     **
     = (object) the `pattern` element
     **
    \*/
    proto.ptrn = function (x, y, width, height, vx, vy, vw, vh, attr) {
        attr = arguments(arguments.length - 1);
        if (!is(attr, "object")) attr = {};
        if (is(x, "object")) {
            attr = x;
        } else {
            attr.patternUnits = "userSpaceOnUse";
            if (x) {
                attr.x = x;
            }
            if (y) {
                attr.y = y;
            }
            if (width != null) {
                attr.width = width;
            }
            if (height != null) {
                attr.height = height;
            }
            if (vx != null && vy != null && vw != null && vh != null) {
                attr.viewBox = [vx, vy, vw, vh];
            } else {
                attr.viewBox = [x || 0, y || 0, width || 0, height || 0];
            }
        }
        return this.el("pattern", attr);
    };
    /*\
     * Paper.use
     [ method ]
     **
     * Creates a <use> element.
     - id (string) @optional id of element to link
     * or
     - id (Element) @optional element to link
     **
     = (object) the `use` element
     **
    \*/
    proto.use = function (id, attr) {
        if (id != null) {
            if (id instanceof Element) {
                if (!id.attr("id")) {
                    id.attr({id: Snap._.id(id)});
                }
                id = id.attr("id");
            } else if (is(id, "object")) {
                attr = id;
                id = attr.id;
            }
            if (String(id).charAt() == "#") {
                id = id.substring(1);
            }
            attr = attr || {};

            attr["href"] = "#" + id;
            return this.el("use", attr);
        } else {
            return Element.prototype.use.call(this);
        }
    };
    proto.use.skip = true;

    /*\
     * Paper.symbol
     [ method ]
     **
     * Creates a <symbol> element.
     - vbx (number) @optional viewbox X
     - vby (number) @optional viewbox Y
     - vbw (number) @optional viewbox width
     - vbh (number) @optional viewbox height
     = (object) the `symbol` element
     **
    \*/
    proto.symbol = function (vx, vy, vw, vh, attr) {
        attr = attr || {};
        if (vx != null && vy != null && vw != null && vh != null) {
            attr.viewBox = [vx, vy, vw, vh];
        }

        return this.el("symbol", attr);
    };
    /*\
     * Paper.text
     [ method ]
     **
     * Draws a text string
     **
     - x (number) x coordinate position
     - y (number) y coordinate position
     - text (string|array) The text string to draw or array of strings to nest within separate `<tspan>` elements
     = (object) the `text` element
     **
     > Usage
     | var t1 = paper.text(50, 50, "Snap");
     | var t2 = paper.text(50, 50, ["S","n","a","p"]);
     | // Text path usage
     | t1.attr({textpath: "M10,10L100,100"});
     | // or
     | var pth = paper.path("M10,10L100,100");
     | t1.attr({textpath: pth});
    \*/
    proto.text = function (x, y, text, attr) {
        attr = attr || {};
        if (is(x, "object")) {
            attr = x;
        } else if (x != null) {
            attr = Object.assign(attr, {
                x: x,
                y: y,
                text: text || ""
            });
        }
        return this.el("text", attr);
    };
    /*\
     * Paper.line
     [ method ]
     **
     * Draws a line
     **
     - x1 (number) x coordinate position of the start
     - y1 (number) y coordinate position of the start
     - x2 (number) x coordinate position of the end
     - y2 (number) y coordinate position of the end
     = (object) the `line` element
     **
     > Usage
     | var t1 = paper.line(50, 50, 100, 100);
    \*/
    proto.line = function (x1, y1, x2, y2, attr) {
        attr = attr || {};
        if (is(x1, "object")) {
            attr = x1;
        } else if (x1 != null) {
            attr = Object.assign(attr, {
                x1: x1,
                x2: x2,
                y1: y1,
                y2: y2
            });
        }
        return this.el("line", attr);
    };

    function point_args(args) {
        let points, attr;
        if (args.length) {
            points = Array.prototype.slice.call(args, 0);
            const last = points[points.length - 1];
            if (is(last, "object") && !Array.isArray(last)) {
                attr = points.pop();
            } else {
                attr = {};
            }
            if (points.length === 1 && Array.isArray(points[0])) {
                points = points[0];
            }
        }

        if (points != null) {
            attr = attr || {};
            attr.points = points;
        }
        return attr;
    }

    /*\
     * Paper.polyline
     [ method ]
     **
     * Draws a polyline
     **
     - points (array) array of points
     * or
     - varargs (…) points
     = (object) the `polyline` element
     **
     > Usage
     | var p1 = paper.polyline([10, 10, 100, 100]);
     | var p2 = paper.polyline(10, 10, 100, 100);
    \*/
    proto.polyline = function (points, attr) {
        attr = point_args(Array.from(arguments));
        return this.el("polyline", attr);
    };


    /*\
         * Paper.polygon
         [ method ]
         **
         * Draws a polygon. See @Paper.polyline
        \*/
    proto.polygon = function (points, attr) {
        attr = point_args(Array.from(arguments));
        return this.el("polygon", attr);
    };
// gradients
    (function () {
        var $ = Snap._.$;
        // gradients' helpers
        /*\
         * Element.stops
         [ method ]
         **
         * Only for gradients!
         * Returns array of gradient stops elements.
         = (array) the stops array.
        \*/
        function Gstops() {
            return this.selectAll("stop");
        }

        /*\
         * Element.addStop
         [ method ]
         **
         * Only for gradients!
         * Adds another stop to the gradient.
         - color (string) stops color
         - offset (number) stops offset 0..100
         = (object) gradient element
        \*/
        function GaddStop(color, offset) {
            var stop = $("stop"),
                attr = {
                    offset: +offset + "%"
                };
            color = Snap.color(color);
            attr["stop-color"] = color.hex;
            if (color.opacity < 1) {
                attr["stop-opacity"] = color.opacity;
            }
            $(stop, attr);
            var stops = this.stops(),
                inserted;
            for (var i = 0; i < stops.length; ++i) {
                var stopOffset = parseFloat(stops[i].attr("offset"));
                if (stopOffset > offset) {
                    this.node.insertBefore(stop, stops[i].node);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                this.node.appendChild(stop);
            }
            return this;
        }

        function GgetBBox() {
            if (this.type == "linearGradient") {
                var x1 = $(this.node, "x1") || 0,
                    x2 = $(this.node, "x2") || 1,
                    y1 = $(this.node, "y1") || 0,
                    y2 = $(this.node, "y2") || 0;
                return Snap.box(x1, y1, math.abs(x2 - x1), math.abs(y2 - y1));
            } else {
                var cx = this.node.cx || .5,
                    cy = this.node.cy || .5,
                    r = this.node.r || 0;
                return Snap.box(cx - r, cy - r, r * 2, r * 2);
            }
        }

        /*\
         * Element.setStops
         [ method ]
         **
         * Only for gradients!
         * Updates stops of the gradient based on passed gradient descriptor. See @Ppaer.gradient
         - str (string) gradient descriptor part after `()`.
         = (object) gradient element
         | var g = paper.gradient("l(0, 0, 1, 1)#000-#f00-#fff");
         | g.setStops("#fff-#000-#f00-#fc0");
        \*/
        function GsetStops(str) {
            var grad = str,
                stops = this.stops();
            if (typeof str == "string") {
                grad = eve(["snap", "util", "grad", "parse"], null, "l(0,0,0,1)" + str).firstDefined().stops;
            }
            if (!Snap.is(grad, "array")) {
                return;
            }
            for (var i = 0; i < stops.length; ++i) {
                if (grad[i]) {
                    var color = Snap.color(grad[i].color),
                        attr = {"offset": grad[i].offset + "%"};
                    attr["stop-color"] = color.hex;
                    if (color.opacity < 1) {
                        attr["stop-opacity"] = color.opacity;
                    }
                    stops[i].attr(attr);
                } else {
                    stops[i].remove();
                }
            }
            for (i = stops.length; i < grad.length; ++i) {
                this.addStop(grad[i].color, grad[i].offset);
            }
            return this;
        }

        function gradient(defs, str) {
            var grad = eve(["snap", "util", "grad", "parse"], null, str).firstDefined(),
                el;
            if (!grad) {
                return null;
            }
            grad.params.unshift(defs);
            if (grad.type.toLowerCase() == "l") {
                el = gradientLinear.apply(0, grad.params);
            } else {
                el = gradientRadial.apply(0, grad.params);
            }
            if (grad.type != grad.type.toLowerCase()) {
                $(el.node, {
                    gradientUnits: "userSpaceOnUse"
                });
            }
            var stops = grad.stops,
                len = stops.length;
            for (var i = 0; i < len; ++i) {
                var stop = stops[i];
                el.addStop(stop.color, stop.offset);
            }
            return el;
        }

        function gradientLinear(defs, x1, y1, x2, y2) {
            var el = Snap._.make("linearGradient", defs);
            el.stops = Gstops;
            el.addStop = GaddStop;
            el.getBBox = GgetBBox;
            el.setStops = GsetStops;
            if (x1 != null) {
                $(el.node, {
                    x1: x1,
                    y1: y1,
                    x2: x2,
                    y2: y2
                });
            }
            return el;
        }

        function gradientRadial(defs, cx, cy, r, fx, fy) {
            var el = Snap._.make("radialGradient", defs);
            el.stops = Gstops;
            el.addStop = GaddStop;
            el.getBBox = GgetBBox;
            if (cx != null) {
                $(el.node, {
                    cx: cx,
                    cy: cy,
                    r: r
                });
            }
            if (fx != null && fy != null) {
                $(el.node, {
                    fx: fx,
                    fy: fy
                });
            }
            return el;
        }

        /*\
         * Paper.gradient
         [ method ]
         **
         * Creates a gradient element
         **
         - gradient (string) gradient descriptor
         > Gradient Descriptor
         * The gradient descriptor is an expression formatted as
         * follows: `<type>(<coords>)<colors>`.  The `<type>` can be
         * either linear or radial.  The uppercase `L` or `R` letters
         * indicate absolute coordinates offset from the SVG surface.
         * Lowercase `l` or `r` letters indicate coordinates
         * calculated relative to the element to which the gradient is
         * applied.  Coordinates specify a linear gradient vector as
         * `x1`, `y1`, `x2`, `y2`, or a radial gradient as `cx`, `cy`,
         * `r` and optional `fx`, `fy` specifying a focal point away
         * from the center of the circle. Specify `<colors>` as a list
         * of dash-separated CSS color values.  Each color may be
         * followed by a custom offset value, separated with a colon
         * character.
         > Examples
         * Linear gradient, relative from top-left corner to bottom-right
         * corner, from black through red to white:
         | var g = paper.gradient("l(0, 0, 1, 1)#000-#f00-#fff");
         * Linear gradient, absolute from (0, 0) to (100, 100), from black
         * through red at 25% to white:
         | var g = paper.gradient("L(0, 0, 100, 100)#000-#f00:25-#fff");
         * Radial gradient, relative from the center of the element with radius
         * half the width, from black to white:
         | var g = paper.gradient("r(0.5, 0.5, 0.5)#000-#fff");
         * To apply the gradient:
         | paper.circle(50, 50, 40).attr({
         |     fill: g
         | });
         = (object) the `gradient` element
        \*/
        proto.gradient = function (str) {
            return gradient(this.defs, str);
        };
        proto.gradientLinear = function (x1, y1, x2, y2) {
            return gradientLinear(this.defs, x1, y1, x2, y2);
        };
        proto.gradientRadial = function (cx, cy, r, fx, fy) {
            return gradientRadial(this.defs, cx, cy, r, fx, fy);
        };
        /*\
         * Paper.toString
         [ method ]
         **
         * Returns SVG code for the @Paper
         = (string) SVG code for the @Paper
        \*/
        proto.toString = function () {
            var doc = this.node.ownerDocument,
                f = doc.createDocumentFragment(),
                d = doc.createElement("div"),
                svg = this.node.cloneNode(true),
                res;
            f.appendChild(d);
            d.appendChild(svg);
            Snap._.$(svg, {xmlns: "http://www.w3.org/2000/svg"});
            res = d.innerHTML;
            f.removeChild(f.firstChild);
            return res;
        };
        proto.toString.skip = true;
        /*\
         * Paper.toDataURL
         [ method ]
         **
         * Returns SVG code for the @Paper as Data URI string.
         = (string) Data URI string
        \*/
        proto.toDataURL = function () {
            if (window && window.btoa) {
                return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(this)));
            }
        };
        proto.toDataURL.skip = true;
        /*\
         * Paper.clear
         [ method ]
         **
         * Removes all child nodes of the paper, except <defs>.
        \*/
        proto.clear = function () {
            var node = this.node.firstChild,
                next;
            while (node) {
                next = node.nextSibling;
                if (node.tagName != "defs") {
                    node.parentNode.removeChild(node);
                } else {
                    proto.clear.call({node: node});
                }
                node = next;
            }
        };
        proto.clear.skip = true;
    }());
})
;

/*
 * Copyright (c) 2018.  Orlin Vakarelov
 */
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {

    const ERROR = 1e-12;

    function BBox(x, y, width, height) {
        if (x === null) {
            x = y = width = height = 0;
        }
        if (Array.isArray(x)) {
            this.y = +x[1] || 0;
            this.width = +x[2] || 0;
            this.height = +x[3] || 0;
            this.x = +x[0] || 0;
        } else if (typeof x === 'object' && typeof x.x === 'object') {  //bezeir bbox
            this.x = x.x.min || 0;
            this.y = x.y.min || 0;
            this.width = x.x.size || 0;
            this.height = x.y.size || 0;
        } else if (typeof x === 'object'
            && (typeof x.x === 'number' || typeof x.cx === 'number' || typeof x.x2 === 'number')
            && (typeof x.y === 'number' || typeof x.cy === 'number' || typeof x.y2 === 'number')) {
            this.width = +x.width || abs(+x.x - +x.x2) || 0;
            this.height = +x.height || abs(+x.y - +x.y2) || 0;
            if (typeof x.x === 'number') {
                this.x = x.x;
            } else if (typeof x.cx === 'number') {
                this.x = x.cx - this.width / 2
            } else {
                this.x = x.x2 - this.width
            }
            if (typeof x.y === 'number') {
                this.y = x.y;
            } else if (typeof x.cy === 'number') {
                this.y = x.cy - this.height / 2
            } else {
                this.y = x.y2 - this.height
            }
        } else { //ZERO box
            this.x = +x || 0;
            this.y = +y || 0;
            this.width = +width || 0;
            this.height = +height || 0;
        }

        this.h = this.height;
        this.w = this.width;

        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;
        this.cx = this.x + this.width / 2;
        this.cy = this.y + this.height / 2;
    }

    BBox.prototype.clone = function () {
        return new BBox(this.x, this.y, this.width, this.height);
    };

    BBox.prototype.r1 = function () {
        return Math.min(this.width, this.height) / 2;
    };

    BBox.prototype.r2 = function () {
        return Math.max(this.width, this.height) / 2;
    };

    BBox.prototype.r0 = function () {
        return Math.sqrt(this.width * this.width + this.height * this.height) / 2;
    };

    BBox.prototype.diag = function () {
        return Math.sqrt(this.width * this.width + this.height * this.height);
    };

    BBox.prototype.addBorder = function (border, get_new) {
        if (get_new) {
            const bbox = this.clone();
            return bbox.addBorder(border);
        }
        if (!border) {
            border = {x: 0, y: 0, x2: 0, y2: 0};
        } else {
            if (!isNaN(border)) {
                border = {x: border, y: border, x2: border, y2: border};
            }
            if (Array.isArray(border)) {
                if (border.length === 1) border[1] = border[0];
                border = {
                    x: border[0], y: border[1],
                    x2: (border[2] == null) ? border[0] : border[2],
                    y2: (border[3] == null) ? border[1] : border[3]
                };
            }
        }
        this.x -= border.x;
        this.y -= border.y;
        this.width += border.x + border.x2;
        this.w = this.width;
        this.height += border.y + border.y2;
        this.h = this.height;
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;
        this.cx = this.x + this.width / 2;
        this.cy = this.y + this.height / 2;

        return this;
    }

    BBox.prototype.path = function () {
        return rectPath(this.x, this.y, this.width, this.height);
    };

    BBox.prototype.rect = function (paper, radius, border) {
        let rx, ry;
        if (radius) {
            if (!isNaN(radius)) {
                rx = ry = radius;
            } else {
                rx = radius.rx || radius[0] || 0;
                ry = radius.ry || radius[1] || rx;
            }

        }
        const bb = (border) ? this.addBorder(border, true) : this;
        return paper.rect(bb.x, bb.y, bb.width, bb.height, rx, ry);
    };

    BBox.prototype.vb = function () {
        return [this.x, this.y, this.width, this.height].join(' ');
    };

    BBox.prototype.ration = function () {
        return this.width / this.height;
    };

    BBox.prototype.contains = function (bbox_or_point, clearance) {
        clearance = clearance || 0;
        const x = bbox_or_point.x || bbox_or_point[0],
            y = bbox_or_point.y || bbox_or_point[1],
            x2 = (bbox_or_point.hasOwnProperty('x2')) ? bbox_or_point.x2 : x,
            y2 = (bbox_or_point.hasOwnProperty('y2')) ? bbox_or_point.y2 : y;

        const is_in = x >= this.x - clearance && x2 <= this.x2 + clearance
            && y >= this.y - clearance && y2 <= this.y2 + clearance;
        return is_in;
    };

    BBox.prototype.containsCircle = function (circle) {
        return this.x <= circle.x - circle.r && this.y <= circle.y - circle.r &&
            this.x2 >= circle.x + circle.r && this.y2 >= circle.y + circle.r;
    };

    BBox.prototype.center = function () {
        return {x: this.cx, y: this.cy};
    };

    BBox.prototype.corner = function (count) {
        count = count || 0;
        switch (count) {
            case 0:
                return {x: this.x, y: this.y};
            case 1:
                return {x: this.x2, y: this.y};
            case 2:
                return {x: this.x2, y: this.y2};
            case 3:
                return {x: this.x, y: this.y2};
        }
    }

    BBox.prototype.pointFromName = function (name) {
        name = name.toLowerCase();
        switch (name) {
            case 'c':
                return this.center();
            case 'tl':
                return this.corner(0);
            case 'tr':
                return this.corner(1);
            case 'br':
                return this.corner(2);
            case 'bl':
                return this.corner(3);
            case 't':
            case 'tc':
                return {x: this.cx, y: this.y2};
            case 'l':
            case 'lc':
                return {x: this.x, y: this.cy};
            case 'r':
            case 'rc':
                return {x: this.x2, y: this.cy};
            case 'b':
            case 'bc':
                return {x: this.cx, y: this.y2}
        }
        return null;
    };

    BBox.prototype.intersect = function (box) {
        if (!box) return null;

        const x = Math.max(this.x, box.x),
            y = Math.max(this.y, box.y),
            x2 = Math.min(this.x2, box.x2),
            y2 = Math.min(this.y2, box.y2);

        if (x >= x2 || y >= y2) {
            return new BBox(Math.min(x, x2), Math.min(y, y2), 0, 0);
        }

        return new BBox(x, y, x2 - x, y2 - y);
    };

    BBox.prototype.isOverlap = function (box) {
        if (!box) return false;

        const x = Math.max(this.x, box.x),
            y = Math.max(this.y, box.y),
            x2 = Math.min(this.x2, box.x2),
            y2 = Math.min(this.y2, box.y2);

        return x < x2 && y < y2;

    }

    BBox.prototype.union = function (box) {
        if (!box) return this;
        const x = Math.min(this.x, box.x),
            y = Math.min(this.y, box.y),
            x2 = Math.max(this.x2, box.x2),
            y2 = Math.max(this.y2, box.y2);

        return new BBox(x, y, x2 - x, y2 - y);
    };

    BBox.prototype.setCorner = function (x, y) {
        this.x = x;
        this.y = y;
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;
        this.cx = x + this.width / 2;
        this.cy = y + this.height / 2;
        return this;
    };

    /**
     * Translates the box by x and y units
     * @param  x an number or matrix. If matrix, only the f and e values are used
     * @param  y
     */
    BBox.prototype.translate = function (x, y) {
        if (typeof x === 'object' && x.hasOwnProperty('e') &&
            x.hasOwnProperty('f')) {
            y = x.f;
            x = x.e;
        }

        this.x += x;
        this.x2 += x;
        this.cx += x;
        this.y += y;
        this.y2 += y;
        this.cy += y;

        return this;
    };

    /**
     * Scales the box by sx and sy factors arpound center (cx,cy).
     * @param sx
     * @param sy
     * @param cx
     * @param cy
     */
    BBox.prototype.scale = function (sx, sy, cx, cy) {
        if (sy == null) sy = sx;
        if (cx == null) cx = sx;
        if (cy == null) cy = sy;
        this.w = this.width *= sx;
        this.h = this.height *= sy;

        this.x = cx - (cx - this.x) * sx;
        this.y = cy - (cy - this.y) * sy;
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;
        this.cx = this.x + this.width / 2;
        this.cy = this.y + this.height / 2;
    }

    BBox.prototype.getBBox = function () {
        return this;
    };

    /**
     * Returns a new bbox with the same first corner, that contains the rotation of this bbox at a given angle.
     * A property "old_corner" is added to the new bbox, giving the coord of the first corner of the rotates bbox.
     * @param angle
     * @return {BBox}
     */
    BBox.prototype.getBBoxRot = function (angle) {
        const rotation = Snap.matrix().rotate(angle);
        let min_x = 0, max_x = -Infinity, min_y = 0, max_y = -Infinity;
        [
            {x: this.width, y: 0}, {x: 0, y: this.height},
            {
                x: this.width,
                y: this.height,
            }].forEach((p) => {
            p = rotation.apply(p);
            min_x = Math.min(min_x, p.x);
            min_y = Math.min(min_y, p.y);
            max_x = Math.max(max_x, p.x);
            max_y = Math.max(max_y, p.y);
        });

        const bbox = new BBox(this.x, this.y, max_x - min_x, max_y - min_y);
        bbox.old_corner = {x: this.x - min_x, y: this.y - min_y};
        return bbox;
    };

    BBox.prototype.getBBox = function () {
        return this;
    };

//Snap begins here
    Snap._.transform2matrixStrict = function transform2matrixStrict(tstr) {
        const tdata = Snap.parseTransformString(tstr),
            m = new Snap.Matrix;
        if (tdata) {
            let i = 0;
            const ii = tdata.length;
            for (; i < ii; ++i) {
                const t = tdata[i],
                    tlen = t.length,
                    command = String(t[0]).toLowerCase(),
                    absolute = t[0] != command,
                    inver = absolute ? m.invert() : 0;
                // x1,
                // y1,
                // x2,
                // y2,
                // bb;
                // if (command == "t" && tlen == 2) {
                //     m.translate(t[1], 0);
                // } else if (command == "t" && tlen == 3) {
                //     if (absolute) {
                //         x1 = inver.x(0, 0);
                //         y1 = inver.y(0, 0);
                //         x2 = inver.x(t[1], t[2]);
                //         y2 = inver.y(t[1], t[2]);
                //         m.translate(x2 - x1, y2 - y1);
                //     } else {
                //         m.translate(t[1], t[2]);
                //     }
                // } else if (command == "r") {
                //     if (tlen == 2) {
                //         bb = bb || bbox;
                //         m.rotate(t[1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                //     } else if (tlen == 4) {
                //         if (absolute) {
                //             x2 = inver.x(t[2], t[3]);
                //             y2 = inver.y(t[2], t[3]);
                //             m.rotate(t[1], x2, y2);
                //         } else {
                //             m.rotate(t[1], t[2], t[3]);
                //         }
                //     }
                // } else if (command == "s") {
                //     if (tlen == 2 || tlen == 3) {
                //         bb = bb || bbox;
                //         m.scale(t[1], t[tlen - 1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                //     } else if (tlen == 4) {
                //         if (absolute) {
                //             x2 = inver.x(t[2], t[3]);
                //             y2 = inver.y(t[2], t[3]);
                //             m.scale(t[1], t[1], x2, y2);
                //         } else {
                //             m.scale(t[1], t[1], t[2], t[3]);
                //         }
                //     } else if (tlen == 5) {
                //         if (absolute) {
                //             x2 = inver.x(t[3], t[4]);
                //             y2 = inver.y(t[3], t[4]);
                //             m.scale(t[1], t[2], x2, y2);
                //         } else {
                //             m.scale(t[1], t[2], t[3], t[4]);
                //         }
                //     }
                // } else
                if (command == 'm' && tlen == 7) {
                    m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
                }
            }
        }
        return m;
    };

    const elproto = Element.prototype,
        is = Snap.is,
        clone = Snap._.clone,
        has = 'hasOwnProperty',
        p2s = /,?([a-z]),?/gi,
        toFloat = parseFloat,
        PI = Math.PI,
        mmin = Math.min,
        mmax = Math.max,
        pow = Math.pow,
        abs = Math.abs,
        STRICT_MODE = true;

    function paths(ps) {
        // return;
        const p = paths.ps = paths.ps || {};
        if (p[ps]) {
            p[ps].sleep = 100;
        } else {
            p[ps] = {
                sleep: 100,
            };
        }
        mina.setTimeout(function () {
            for (let key in p) if (p[has](key) && key != ps) {
                p[key].sleep--;
                !p[key].sleep && delete p[key];
            }
        });
        return p[ps];
    }

    function box(x, y, width, height) {
        if (x instanceof BBox) {
            return x;
        }
        if (Array.isArray(x) && x.length === 4) {
            return new BBox(+x[0], +x[1], +x[2], +x[3]);
        }
        if (typeof x === 'object') {
            return new BBox(x);
        }
        return new BBox(+x, +y, +width, +height);
    }

    function toString(path) {
        path = path || this;
        return path.join(',').replace(p2s, '$1');
    }

    function pathClone(pathArray) {
        const res = clone(pathArray);
        res.toString = toString;
        return res;
    }

    function getPointAtSegmentLength(
        p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length) {
        if (length == null) {
            return bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
        } else {
            return findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y,
                getTotLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length));
        }
    }

    function getLengthFactory(istotal, subpath) {
        function O(val) {
            return +(+val).toFixed(3);
        }

        return Snap._.cacher(function (path, length, onlystart) {
            if (path instanceof Element) {
                path = getPath[path.type](path);
            }
            path = path2curve(path);
            let x, y, p, l, sp = '';
            const subpaths = {};
            let point,
                len = 0;
            let i = 0;
            const ii = path.length;
            for (; i < ii; ++i) {
                p = path[i];
                if (p[0] == 'M') {
                    x = +p[1];
                    y = +p[2];
                } else {
                    l = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                    if (len + l > length) {
                        if (subpath && !subpaths.start) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4],
                                p[5], p[6], length - len);
                            sp += [
                                'C' + O(point.start.x),
                                O(point.start.y),
                                O(point.m.x),
                                O(point.m.y),
                                O(point.x),
                                O(point.y),
                            ];
                            if (onlystart) {
                                return sp;
                            }
                            subpaths.start = sp;
                            sp = [
                                'M' + O(point.x),
                                O(point.y) + 'C' + O(point.n.x),
                                O(point.n.y),
                                O(point.end.x),
                                O(point.end.y),
                                O(p[5]),
                                O(p[6]),
                            ].join();
                            len += l;
                            x = +p[5];
                            y = +p[6];
                            continue;
                        }
                        if (!istotal && !subpath) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4],
                                p[5], p[6], length - len);
                            return point;
                        }
                    }
                    len += l;
                    x = +p[5];
                    y = +p[6];
                }
                sp += p.shift() + p;
            }
            subpaths.end = sp;
            point = istotal ?
                len :
                subpath ?
                    subpaths :
                    findDotsAtSegment(x, y, p[0], p[1], p[2], p[3], p[4], p[5], 1);
            return point;
        }, null, Snap._.clone);
    }

    const getTotalLength = getLengthFactory(1),
        getPointAtLength = getLengthFactory(),
        getSubpathsAtLength = getLengthFactory(0, 1);

    function findDotsAtSegment(
        p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t, point_only) {
        const t1 = 1 - t,
            t13 = pow(t1, 3),
            t12 = pow(t1, 2),
            t2 = t * t,
            t3 = t2 * t,
            x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x,
            y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y;
        if (point_only) return {x: x, y: y};
        const mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x),
            my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y),
            nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x),
            ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y),
            ax = t1 * p1x + t * c1x,
            ay = t1 * p1y + t * c1y,
            cx = t1 * c2x + t * p2x,
            cy = t1 * c2y + t * p2y,
            alpha = 90 - Math.atan2(mx - nx, my - ny) * 180 / PI;
        // (mx > nx || my < ny) && (alpha += 180);
        return {
            x: x,
            y: y,
            m: {x: mx, y: my},
            n: {x: nx, y: ny},
            start: {x: ax, y: ay},
            end: {x: cx, y: cy},
            alpha: alpha,
        };
    }

    function bezierBBox(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
        if (!Snap.is(p1x, 'array')) {
            p1x = [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y];
        }
        const bbox = curveDim.apply(null, p1x);
        return box(
            bbox.min.x,
            bbox.min.y,
            bbox.max.x - bbox.min.x,
            bbox.max.y - bbox.min.y,
        );
    }

    function isPointInsideBBox(bbox, x, y) {
        return x >= bbox.x &&
            x <= bbox.x + bbox.width &&
            y >= bbox.y &&
            y <= bbox.y + bbox.height;
    }

    function isBBoxIntersect(bbox1, bbox2) {
        bbox1 = box(bbox1);
        bbox2 = box(bbox2);

        const number = abs(bbox1.cx - bbox2.cx);
        const number2 = (bbox1.width + bbox2.width) / 2;
        if (number >= number2) return false;
        return abs(bbox1.cy - bbox2.cy) < (bbox1.height + bbox2.height) / 2;

        // return isPointInsideBBox(bbox2, bbox1.x, bbox1.y)
        //     || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y)
        //     || isPointInsideBBox(bbox2, bbox1.x, bbox1.y2)
        //     || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y2)
        //     || isPointInsideBBox(bbox1, bbox2.x, bbox2.y)
        //     || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y)
        //     || isPointInsideBBox(bbox1, bbox2.x, bbox2.y2)
        //     || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y2)
        //     || (bbox1.x < bbox2.x2 && bbox1.x > bbox2.x
        //     || bbox2.x < bbox1.x2 && bbox2.x > bbox1.x)
        //     && (bbox1.y < bbox2.y2 && bbox1.y > bbox2.y
        //     || bbox2.y < bbox1.y2 && bbox2.y > bbox1.y);
    }

    function base3(t, p1, p2, p3, p4) {
        const t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
            t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
        return t * t2 - 3 * p1 + 3 * p2;
    }

    function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z) {
        if (z == null) {
            z = 1;
        }
        z = z > 1 ? 1 : z < 0 ? 0 : z;
        const z2 = z / 2,
            n = 12,
            Tvalues = [
                -.1252,
                .1252,
                -.3678,
                .3678,
                -.5873,
                .5873,
                -.7699,
                .7699,
                -.9041,
                .9041,
                -.9816,
                .9816],
            Cvalues = [
                0.2491,
                0.2491,
                0.2335,
                0.2335,
                0.2032,
                0.2032,
                0.1601,
                0.1601,
                0.1069,
                0.1069,
                0.0472,
                0.0472];
        let sum = 0;
        for (let i = 0; i < n; ++i) {
            const ct = z2 * Tvalues[i] + z2,
                xbase = base3(ct, x1, x2, x3, x4),
                ybase = base3(ct, y1, y2, y3, y4),
                comb = xbase * xbase + ybase * ybase;
            sum += Cvalues[i] * Math.sqrt(comb);
        }
        return z2 * sum;
    }

    function getTotLen(x1, y1, x2, y2, x3, y3, x4, y4, ll) {
        if (ll < 0 || bezlen(x1, y1, x2, y2, x3, y3, x4, y4) < ll) {
            return;
        }
        const t = 1;
        let step = t / 2,
            t2 = t - step,
            l;
        const e = .01;
        l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        while (abs(l - ll) > e) {
            step /= 2;
            t2 += (l < ll ? 1 : -1) * step;
            l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        }
        return t2;
    }

    function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        if (
            mmax(x1, x2) < mmin(x3, x4) ||
            mmin(x1, x2) > mmax(x3, x4) ||
            mmax(y1, y2) < mmin(y3, y4) ||
            mmin(y1, y2) > mmax(y3, y4)
        ) {
            return;
        }
        const nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) *
                (x3 * y4 - y3 * x4),
            ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
        let denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (!denominator) {
            return;
        }
        const px = nx / denominator,
            py = ny / denominator,
            px2 = +px.toFixed(2),
            py2 = +py.toFixed(2);
        if (
            px2 < +mmin(x1, x2).toFixed(2) ||
            px2 > +mmax(x1, x2).toFixed(2) ||
            px2 < +mmin(x3, x4).toFixed(2) ||
            px2 > +mmax(x3, x4).toFixed(2) ||
            py2 < +mmin(y1, y2).toFixed(2) ||
            py2 > +mmax(y1, y2).toFixed(2) ||
            py2 < +mmin(y3, y4).toFixed(2) ||
            py2 > +mmax(y3, y4).toFixed(2)
        ) {
            return;
        }
        return {x: px, y: py};
    }

    function inter(bez1, bez2) {
        return interHelper(bez1, bez2);
    }

    function interCount(bez1, bez2) {
        return interHelper(bez1, bez2, 1);
    }

    function interHelper(bez1, bez2, justCount) {
        const bbox1 = bezierBBox(bez1),
            bbox2 = bezierBBox(bez2);
        if (!isBBoxIntersect(bbox1, bbox2)) {
            return justCount ? 0 : [];
        }
        const l1 = bezlen.apply(0, bez1),
            l2 = bezlen.apply(0, bez2),
            n1 = ~~(l1 / 8),
            n2 = ~~(l2 / 8),
            dots1 = [],
            dots2 = [],
            xy = {};
        let res = justCount ? 0 : [];
        for (var i = 0; i < n1 + 1; ++i) {
            var p = findDotsAtSegment.apply(0, bez1.concat(i / n1));
            dots1.push({x: p.x, y: p.y, t: i / n1});
        }
        for (i = 0; i < n2 + 1; ++i) {
            p = findDotsAtSegment.apply(0, bez2.concat(i / n2));
            dots2.push({x: p.x, y: p.y, t: i / n2});
        }
        for (i = 0; i < n1; ++i) {
            for (let j = 0; j < n2; j++) {
                const di = dots1[i],
                    di1 = dots1[i + 1],
                    dj = dots2[j],
                    dj1 = dots2[j + 1],
                    ci = abs(di1.x - di.x) < .001 ? 'y' : 'x',
                    cj = abs(dj1.x - dj.x) < .001 ? 'y' : 'x',
                    is = intersect(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y);
                if (is) {
                    if (xy[is.x.toFixed(4)] == is.y.toFixed(4)) {
                        continue;
                    }
                    xy[is.x.toFixed(4)] = is.y.toFixed(4);
                    const t1 = di.t + abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) *
                            (di1.t - di.t),
                        t2 = dj.t + abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) *
                            (dj1.t - dj.t);
                    if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
                        if (justCount) {
                            res++;
                        } else {
                            res.push({
                                x: is.x,
                                y: is.y,
                                t1: t1,
                                t2: t2,
                            });
                        }
                    }
                }
            }
        }
        return res;
    }

    function isPathOverlapRect(path, rect) {
        const path_bbox = path.getBBox();
        const rect_bbox = rect.getBBox();
        if (!isBBoxIntersect(path_bbox, rect_bbox)) return false;

        //Check if the path box in completely inside the rect box

        if (rect_bbox.x <= path_bbox.x && path_bbox.x2 <= rect_bbox.x2 &&
            rect_bbox.y <= path_bbox.y && path_bbox.y2 <= rect_bbox.y2) {
            return true;
        }

        return pathIntersectionNumber(getPath[path.type](path),
            rectPath(rect_bbox.x, rect_bbox.y, rect_bbox.w, rect_bbox.h)) > 0;

    }

    function pathIntersection(path1, path2) {
        return interPathHelper(path1, path2);
    }

    function pathIntersectionNumber(path1, path2) {
        return interPathHelper(path1, path2, 1);
    }

    function interPathHelper(path1, path2, justCount) {
        path1 = path2curve(path1);
        path2 = path2curve(path2);
        let x1, y1, x2, y2, x1m, y1m, x2m, y2m, bez1, bez2,
            res = justCount ? 0 : [];
        let i = 0;
        const ii = path1.length;
        for (; i < ii; ++i) {
            const pi = path1[i];
            if (pi[0] == 'M') {
                x1 = x1m = pi[1];
                y1 = y1m = pi[2];
            } else {
                if (pi[0] == 'C') {
                    bez1 = [x1, y1].concat(pi.slice(1));
                    x1 = bez1[6];
                    y1 = bez1[7];
                } else {
                    bez1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
                    x1 = x1m;
                    y1 = y1m;
                }
                let j = 0;
                const jj = path2.length;
                for (; j < jj; j++) {
                    const pj = path2[j];
                    if (pj[0] == 'M') {
                        x2 = x2m = pj[1];
                        y2 = y2m = pj[2];
                    } else {
                        if (pj[0] == 'C') {
                            bez2 = [x2, y2].concat(pj.slice(1));
                            x2 = bez2[6];
                            y2 = bez2[7];
                        } else {
                            bez2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
                            x2 = x2m;
                            y2 = y2m;
                        }
                        const intr = interHelper(bez1, bez2, justCount);
                        if (justCount) {
                            res += intr;
                        } else {
                            let k = 0;
                            const kk = intr.length;
                            for (; k < kk; k++) {
                                intr[k].segment1 = i;
                                intr[k].segment2 = j;
                                intr[k].bez1 = bez1;
                                intr[k].bez2 = bez2;
                            }
                            res = res.concat(intr);
                        }
                    }
                }
            }
        }
        return res;
    }

    function isPointInsidePath(path, x, y) {
        const bbox = pathBBox(path);
        return isPointInsideBBox(bbox, x, y) &&
            interPathHelper(path, [['M', x, y], ['H', bbox.x2 + 10]], 1) % 2 == 1;
    }

    function pathBBox(path) {
        // console.log("Path BBox");
        // console.trace();
        const pth = paths(path);
        if (pth.bbox) {
            return clone(pth.bbox);
        }
        if (!path) {
            return box();
        }
        path = path2curve(path);
        let x = 0,
            y = 0,
            X = [],
            Y = [],
            p;
        let i = 0;
        const ii = path.length;
        for (; i < ii; ++i) {
            p = path[i];
            if (p[0] == 'M') {
                x = p[1];
                y = p[2];
                X.push(x);
                Y.push(y);
            } else {
                const dim = curveDim(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                X = X.concat(dim.min.x, dim.max.x);
                Y = Y.concat(dim.min.y, dim.max.y);
                x = p[5];
                y = p[6];
            }
        }
        const xmin = mmin.apply(0, X),
            ymin = mmin.apply(0, Y),
            xmax = mmax.apply(0, X),
            ymax = mmax.apply(0, Y),
            bb = box(xmin, ymin, xmax - xmin, ymax - ymin);
        pth.bbox = clone(bb);
        return bb;
    }

    function rectPath(x, y, w, h, rx, ry) {
        if (rx) {
            if (!ry) ry = rx;
            return [
                ['M', +x + +rx, y],
                ['l', w - rx * 2, 0],
                ['a', rx, ry, 0, 0, 1, rx, ry],
                ['l', 0, h - ry * 2],
                ['a', rx, ry, 0, 0, 1, -rx, ry],
                ['l', rx * 2 - w, 0],
                ['a', rx, ry, 0, 0, 1, -rx, -ry],
                ['l', 0, ry * 2 - h],
                ['a', rx, ry, 0, 0, 1, rx, -ry],
                ['z'],
            ];
        }
        const res = [['M', x, y], ['l', w, 0], ['l', 0, h], ['l', -w, 0], ['z']];
        res.toString = toString;
        return res;
    }

    function ellipsePath(x, y, rx, ry, a) {
        if (a == null && ry == null) {
            ry = rx;
        }
        x = +x;
        y = +y;
        rx = +rx;
        ry = +ry;
        if (a != null) {
            var rad = Math.PI / 180,
                x1 = x + rx * Math.cos(-ry * rad),
                x2 = x + rx * Math.cos(-a * rad),
                y1 = y + rx * Math.sin(-ry * rad),
                y2 = y + rx * Math.sin(-a * rad),
                res = [['M', x1, y1], ['A', rx, rx, 0, +(a - ry > 180), 0, x2, y2]];
        } else {
            res = [
                ['M', x, y],
                ['m', 0, -ry],
                ['a', rx, ry, 0, 1, 1, 0, 2 * ry],
                ['a', rx, ry, 0, 1, 1, 0, -2 * ry],
                ['z'],
            ];
        }
        res.toString = toString;
        return res;
    }

    function groupPathStrict(el) {
        const children = el.getChildren();
        let comp_path = [],
            comp_path_string = '',
            pathfinder,
            child,
            path,
            m = new Snap.Matrix;

        for (var i = 0, max = children.length; i < max; ++i) {
            child = children[i];

            while (child.type == 'use') { //process any use tags
                m = m.add(el.getLocalMatrix(STRICT_MODE).translate(el.attr('x') || 0, el.attr('y') || 0));
                if (child.original) {
                    child = child.original;
                } else {
                    const href = el.attr('xlink:href');
                    child = child.original = child.node.ownerDocument.getElementById(
                        href.substring(href.indexOf('#') + 1));
                }
            }

            pathfinder = Snap.path.get[child.type] || Snap.path.get.deflt;
            path = pathfinder(child); //convert the element ot path
            path = Snap.path.map(path, m.add(child.getLocalMatrix(STRICT_MODE)));
            comp_path = comp_path.concat(path);
        }

        for (var i = 0, max = comp_path.length, command; i < max; ++i) {
            command = comp_path[i];
            comp_path_string += command.shift();
            comp_path_string += command.toString();
        }

        return comp_path_string;
    }

    var unit2px = Snap._unit2px,
        getPath = {
            path: function (el) {
                return el.attr('d');
            },
            circle: function (el) {
                const attr = unit2px(el);
                return ellipsePath(attr.cx, attr.cy, attr.r);
            },
            ellipse: function (el) {
                const attr = unit2px(el);
                return ellipsePath(attr.cx || 0, attr.cy || 0, attr.rx, attr.ry);
            },
            rect: function (el) {
                const attr = unit2px(el);
                return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height,
                    attr.rx, attr.ry);
            },
            image: function (el) {
                const attr = unit2px(el);
                return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height);
            },
            line: function (el) {
                return 'M' + [
                    el.attr('x1') || 0,
                    el.attr('y1') || 0,
                    el.attr('x2'),
                    el.attr('y2')];
            },
            polyline: function (el) {
                return 'M' + el.attr('points');
            },
            polygon: function (el) {
                return 'M' + el.attr('points') + 'z';
            },
            foreignObject: function (el) {
                var attr = unit2px(el);
                return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height);
            },
            g: function (el) {
                if (STRICT_MODE) {
                    return groupPathStrict(el);
                } else {
                    const bbox = el.node.getBBox();
                    return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
                }
            },
            deflt: function (el) {
                const bbox = el.node.getBBox();
                return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
            },
        };
    getPath['clipPath'] = getPath['g'];

    function pathToRelative(pathArray) {
        const pth = paths(pathArray),
            lowerCase = String.prototype.toLowerCase;
        if (pth.rel) {
            return pathClone(pth.rel);
        }
        if (!Snap.is(pathArray, 'array') ||
            !Snap.is(pathArray && pathArray[0], 'array')) {
            pathArray = Snap.parsePathString(pathArray);
        }
        const res = [];
        let x = 0,
            y = 0,
            mx = 0,
            my = 0,
            start = 0;
        if (pathArray[0][0] == 'M') {
            x = pathArray[0][1];
            y = pathArray[0][2];
            mx = x;
            my = y;
            start++;
            res.push(['M', x, y]);
        }
        let i = start;
        const ii = pathArray.length;
        for (; i < ii; ++i) {
            let r = res[i] = [];
            const pa = pathArray[i];
            if (pa[0] != lowerCase.call(pa[0])) {
                r[0] = lowerCase.call(pa[0]);
                switch (r[0]) {
                    case 'a':
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +(pa[6] - x).toFixed(3);
                        r[7] = +(pa[7] - y).toFixed(3);
                        break;
                    case 'v':
                        r[1] = +(pa[1] - y).toFixed(3);
                        break;
                    case 'm':
                        mx = pa[1];
                        my = pa[2];
                    default:
                        let j = 1;
                        const jj = pa.length;
                        for (; j < jj; j++) {
                            r[j] = +(pa[j] - (j % 2 ? x : y)).toFixed(3);
                        }
                }
            } else {
                r = res[i] = [];
                if (pa[0] == 'm') {
                    mx = pa[1] + x;
                    my = pa[2] + y;
                }
                let k = 0;
                const kk = pa.length;
                for (; k < kk; k++) {
                    res[i][k] = pa[k];
                }
            }
            const len = res[i].length;
            switch (res[i][0]) {
                case 'z':
                    x = mx;
                    y = my;
                    break;
                case 'h':
                    x += +res[i][len - 1];
                    break;
                case 'v':
                    y += +res[i][len - 1];
                    break;
                default:
                    x += +res[i][len - 2];
                    y += +res[i][len - 1];
            }
        }
        res.toString = toString;
        pth.rel = pathClone(res);
        return res;
    }

    function pathToAbsolute(pathArray) {
        const pth = paths(pathArray);
        if (pth.abs) {
            return pathClone(pth.abs);
        }
        if (!is(pathArray, 'array') || !is(pathArray && pathArray[0], 'array')) { // rough assumption
            if (is(pathArray, 'object') && pathArray.type) {
                pathArray = getPath[pathArray.type](pathArray);
            }
            pathArray = Snap.parsePathString(pathArray);
        }
        if (!pathArray || !pathArray.length) {
            return [['M', 0, 0]];
        }
        let res = [],
            x = 0,
            y = 0,
            mx = 0,
            my = 0,
            start = 0,
            pa0;
        if (pathArray[0][0] == 'M') {
            x = +pathArray[0][1];
            y = +pathArray[0][2];
            mx = x;
            my = y;
            start++;
            res[0] = ['M', x, y];
        }
        const crz = pathArray.length == 3 &&
            pathArray[0][0] == 'M' &&
            pathArray[1][0].toUpperCase() == 'R' &&
            pathArray[2][0].toUpperCase() == 'Z';
        let r, pa, i = start;
        const ii = pathArray.length;
        for (; i < ii; ++i) {
            res.push(r = []);
            pa = pathArray[i];
            pa0 = pa[0];
            if (pa0 != pa0.toUpperCase()) {
                r[0] = pa0.toUpperCase();
                switch (r[0]) {
                    case 'A':
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +pa[6] + x;
                        r[7] = +pa[7] + y;
                        break;
                    case 'V':
                        r[1] = +pa[1] + y;
                        break;
                    case 'H':
                        r[1] = +pa[1] + x;
                        break;
                    case 'R':
                        var dots = [x, y].concat(pa.slice(1));
                        for (var j = 2, jj = dots.length; j < jj; j++) {
                            dots[j] = +dots[j] + x;
                            dots[++j] = +dots[j] + y;
                        }
                        res.pop();
                        res = res.concat(catmullRom2bezier(dots, crz));
                        break;
                    case 'O':
                        res.pop();
                        dots = ellipsePath(x, y, pa[1], pa[2]);
                        dots.push(dots[0]);
                        res = res.concat(dots);
                        break;
                    case 'U':
                        res.pop();
                        res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                        r = ['U'].concat(res[res.length - 1].slice(-2));
                        break;
                    case 'M':
                        mx = +pa[1] + x;
                        my = +pa[2] + y;
                    default:
                        for (j = 1, jj = pa.length; j < jj; j++) {
                            r[j] = +pa[j] + (j % 2 ? x : y);
                        }
                }
            } else if (pa0 == 'R') {
                dots = [x, y].concat(pa.slice(1));
                res.pop();
                res = res.concat(catmullRom2bezier(dots, crz));
                r = ['R'].concat(pa.slice(-2));
            } else if (pa0 == 'O') {
                res.pop();
                dots = ellipsePath(x, y, pa[1], pa[2]);
                dots.push(dots[0]);
                res = res.concat(dots);
            } else if (pa0 == 'U') {
                res.pop();
                res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                r = ['U'].concat(res[res.length - 1].slice(-2));
            } else {
                let k = 0;
                const kk = pa.length;
                for (; k < kk; k++) {
                    r[k] = pa[k];
                }
            }
            pa0 = pa0.toUpperCase();
            if (pa0 != 'O') {
                switch (r[0]) {
                    case 'Z':
                        x = +mx;
                        y = +my;
                        break;
                    case 'H':
                        x = r[1];
                        break;
                    case 'V':
                        y = r[1];
                        break;
                    case 'M':
                        mx = r[r.length - 2];
                        my = r[r.length - 1];
                    default:
                        x = r[r.length - 2];
                        y = r[r.length - 1];
                }
            }
        }
        res.toString = toString;
        pth.abs = pathClone(res);
        return res;
    }

    function l2c(x1, y1, x2, y2) {
        return [x1 + (x2 - x1) / 3, y1 + (y2 - y1) / 3,
            x1 + 2 * (x2 - x1) / 3, y1 + 2 * (y2 - y1) / 3,
            x2, y2];
    }

    function q2c(x1, y1, ax, ay, x2, y2) {
        const _13 = 1 / 3,
            _23 = 2 / 3;
        return [
            _13 * x1 + _23 * ax,
            _13 * y1 + _23 * ay,
            _13 * x2 + _23 * ax,
            _13 * y2 + _23 * ay,
            x2,
            y2,
        ];
    }

    function a2c(
        x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
        // for more information of where this Math came from visit:
        // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
        const _120 = PI * 120 / 180;
        let rad = PI / 180 * (+angle || 0),
            res = [],
            xy;
        const rotate = Snap._.cacher(function (x, y, rad) {
            const X = x * Math.cos(rad) - y * Math.sin(rad),
                Y = x * Math.sin(rad) + y * Math.cos(rad);
            return {x: X, y: Y};
        });
        if (!rx || !ry) {
            return [x1, y1, x2, y2, x2, y2];
        }
        if (!recursive) {
            xy = rotate(x1, y1, -rad);
            x1 = xy.x;
            y1 = xy.y;
            xy = rotate(x2, y2, -rad);
            x2 = xy.x;
            y2 = xy.y;
            var cos = Math.cos(PI / 180 * angle),
                sin = Math.sin(PI / 180 * angle),
                x = (x1 - x2) / 2,
                y = (y1 - y2) / 2;
            let h = x * x / (rx * rx) + y * y / (ry * ry);
            if (h > 1) {
                h = Math.sqrt(h);
                rx = h * rx;
                ry = h * ry;
            }
            var rx2 = rx * rx,
                ry2 = ry * ry,
                k = (large_arc_flag == sweep_flag ? -1 : 1) *
                    Math.sqrt(abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) /
                        (rx2 * y * y + ry2 * x * x))),
                cx = k * rx * y / ry + (x1 + x2) / 2,
                cy = k * -ry * x / rx + (y1 + y2) / 2,
                f1 = Math.asin(((y1 - cy) / ry).toFixed(9)),
                f2 = Math.asin(((y2 - cy) / ry).toFixed(9));

            f1 = x1 < cx ? PI - f1 : f1;
            f2 = x2 < cx ? PI - f2 : f2;
            f1 < 0 && (f1 = PI * 2 + f1);
            f2 < 0 && (f2 = PI * 2 + f2);
            if (sweep_flag && f1 > f2) {
                f1 = f1 - PI * 2;
            }
            if (!sweep_flag && f2 > f1) {
                f2 = f2 - PI * 2;
            }
        } else {
            f1 = recursive[0];
            f2 = recursive[1];
            cx = recursive[2];
            cy = recursive[3];
        }
        let df = f2 - f1;
        if (abs(df) > _120) {
            const f2old = f2,
                x2old = x2,
                y2old = y2;
            f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
            x2 = cx + rx * Math.cos(f2);
            y2 = cy + ry * Math.sin(f2);
            res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old,
                [f2, f2old, cx, cy]);
        }
        df = f2 - f1;
        const c1 = Math.cos(f1),
            s1 = Math.sin(f1),
            c2 = Math.cos(f2),
            s2 = Math.sin(f2),
            t = Math.tan(df / 4),
            hx = 4 / 3 * rx * t,
            hy = 4 / 3 * ry * t,
            m1 = [x1, y1],
            m2 = [x1 + hx * s1, y1 - hy * c1],
            m3 = [x2 + hx * s2, y2 - hy * c2],
            m4 = [x2, y2];
        m2[0] = 2 * m1[0] - m2[0];
        m2[1] = 2 * m1[1] - m2[1];
        if (recursive) {
            return [m2, m3, m4].concat(res);
        } else {
            res = [m2, m3, m4].concat(res).join().split(',');
            const newres = [];
            let i = 0;
            const ii = res.length;
            for (; i < ii; ++i) {
                newres[i] = i % 2 ?
                    rotate(res[i - 1], res[i], rad).y :
                    rotate(res[i], res[i + 1], rad).x;
            }
            return newres;
        }
    }

    function findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
        const t1 = 1 - t;
        return {
            x: pow(t1, 3) * p1x + pow(t1, 2) * 3 * t * c1x + t1 * 3 * t * t * c2x +
                pow(t, 3) * p2x,
            y: pow(t1, 3) * p1y + pow(t1, 2) * 3 * t * c1y + t1 * 3 * t * t * c2y +
                pow(t, 3) * p2y,
        };
    }

// Returns bounding box of cubic bezier curve.
// Source: http://blog.hackers-cafe.net/2009/06/how-to-calculate-bezier-curves-bounding.html
// Original version: NISHIO Hirokazu
// Modifications: https://github.com/timo22345
    function curveDim(x0, y0, x1, y1, x2, y2, x3, y3) {
        const tvalues = [],
            bounds = [[], []];
        let a, b, c, t, t1, t2, b2ac, sqrtb2ac;
        for (let i = 0; i < 2; ++i) {
            if (i == 0) {
                b = 6 * x0 - 12 * x1 + 6 * x2;
                a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
                c = 3 * x1 - 3 * x0;
            } else {
                b = 6 * y0 - 12 * y1 + 6 * y2;
                a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
                c = 3 * y1 - 3 * y0;
            }
            if (abs(a) < ERROR) {
                if (abs(b) < ERROR) {
                    continue;
                }
                t = -c / b;
                if (0 < t && t < 1) {
                    tvalues.push(t);
                }
                continue;
            }
            b2ac = b * b - 4 * c * a;
            sqrtb2ac = Math.sqrt(b2ac);
            if (b2ac < 0) {
                continue;
            }
            t1 = (-b + sqrtb2ac) / (2 * a);
            if (0 < t1 && t1 < 1) {
                tvalues.push(t1);
            }
            t2 = (-b - sqrtb2ac) / (2 * a);
            if (0 < t2 && t2 < 1) {
                tvalues.push(t2);
            }
        }

        let x, y, j = tvalues.length;
        const jlen = j;
        let mt;
        while (j--) {
            t = tvalues[j];
            mt = 1 - t;
            bounds[0][j] = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t *
                x2 + t * t * t * x3;
            bounds[1][j] = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t *
                y2 + t * t * t * y3;
        }

        bounds[0][jlen] = x0;
        bounds[1][jlen] = y0;
        bounds[0][jlen + 1] = x3;
        bounds[1][jlen + 1] = y3;
        bounds[0].length = bounds[1].length = jlen + 2;

        return {
            min: {x: mmin.apply(0, bounds[0]), y: mmin.apply(0, bounds[1])},
            max: {x: mmax.apply(0, bounds[0]), y: mmax.apply(0, bounds[1])},
        };
    }

    function path2curve(path, path2, expand_only, process_arc) {
        if (typeof path2 === 'boolean' || typeof path2 === 'number') {
            process_arc = expand_only;
            expand_only = path2;
            path2 = undefined;
        }
        const pth = !path2 && paths(path);
        if (!path2 && !expand_only && pth.curve) {
            return pathClone(pth.curve);
        }
        if (!path2 && expand_only && pth.curve_exp) {
            return pathClone(pth.curve_exp);
        }
        var p = pathToAbsolute(path),
            p2 = path2 && pathToAbsolute(path2),
            attrs = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
            attrs2 = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
            processPath = function (path, d, pcom) {
                let nx, ny;
                if (!path) {
                    return ['C', d.x, d.y, d.x, d.y, d.x, d.y];
                }
                !(path[0] in {T: 1, Q: 1}) && (d.qx = d.qy = null);
                switch (path[0]) {
                    case 'M':
                        d.X = path[1];
                        d.Y = path[2];
                        break;
                    case 'A':
                        if (!expand_only || process_arc) path = ['C'].concat(
                            a2c.apply(0, [d.x, d.y].concat(path.slice(1))));
                        break;
                    case 'S':
                        if (pcom == 'C' || pcom == 'S') { // In "S" case we have to take into account, if the previous command is C/S.
                            nx = d.x * 2 - d.bx;          // And reflect the previous
                            ny = d.y * 2 - d.by;          // command's control point relative to the current point.
                        } else {                            // or some else or nothing
                            nx = d.x;
                            ny = d.y;
                        }
                        path = ['C', nx, ny].concat(path.slice(1));
                        break;
                    case 'T':

                        if (pcom == 'Q' || pcom == 'T') { // In "T" case we have to take into account, if the previous command is Q/T.
                            d.qx = d.x * 2 - d.qx;        // And make a reflection similar
                            d.qy = d.y * 2 - d.qy;        // to case "S".
                        } else {                            // or something else or nothing
                            d.qx = d.x;
                            d.qy = d.y;
                        }

                        if (expand_only) {
                            path = ['Q', d.qx, d.qy, path[1], path[2]];
                        } else {
                            path = ['C'].concat(
                                q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
                        }

                        break;
                    case 'Q':
                        if (!expand_only) {
                            d.qx = path[1];
                            d.qy = path[2];
                            path = ['C'].concat(
                                q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
                        }
                        break;
                    case 'L':
                        if (!expand_only) path = ['C'].concat(
                            l2c(d.x, d.y, path[1], path[2]));
                        break;
                    case 'H':
                        if (expand_only) {
                            path = ['L', path[1], d.y];
                        } else {
                            path = ['C'].concat(l2c(d.x, d.y, path[1], d.y));
                        }

                        break;
                    case 'V':
                        if (expand_only) {
                            path = ['L', d.x, path[1]];
                        } else {
                            path = ['C'].concat(l2c(d.x, d.y, d.x, path[1]));
                        }

                        break;
                    case 'Z':
                        if (Math.abs(d.x - d.X) > ERROR
                            || Math.abs(d.y - d.Y) > ERROR) {
                            if (expand_only) {
                                path = ['L', d.X, d.Y];
                            } else {
                                path = ['C'].concat(l2c(d.x, d.y, d.X, d.Y));
                            }
                        } else {
                            path = null;
                        }

                        break;
                }
                return path;
            }

            ,
            fixArc = function (pp, i) {
                if (pp[i] && pp[i].length > 7) {
                    pp[i].shift();
                    const pi = pp[i];
                    while (pi.length) {
                        pcoms1[i] = 'A'; // if created multiple C:s, their original seg is saved
                        p2 && (pcoms2[i] = 'A'); // the same as above
                        pp.splice(i++, 0, ['C'].concat(pi.splice(0, 6)));
                    }
                    pp.splice(i, 1);
                    ii = mmax(p.length, p2 && p2.length || 0);
                }
            },
            fixM = function (path1, path2, a1, a2, i) {
                if (path1 && path2 && path1[i][0] == 'M' && path2[i][0] != 'M') {
                    path2.splice(i, 0, ['M', a2.x, a2.y]);
                    a1.bx = 0;
                    a1.by = 0;
                    a1.x = path1[i][1];
                    a1.y = path1[i][2];
                    ii = mmax(p.length, p2 && p2.length || 0);
                }
            },
            toIncr = function (attr, seg) {
                let segleng = seg.length;
                switch (seg[0]) {
                    case 'C':
                    case 'Q':
                        attr.x = seg[segleng - 2];
                        attr.y = seg[segleng - 1];
                        attr.bx = toFloat(seg[segleng - 4]) || attr.x;
                        attr.by = toFloat(seg[segleng - 3]) || attr.y;
                        break;
                    default:
                        attr.x = seg[segleng - 2];
                        attr.y = seg[segleng - 1];
                        attr.bx = attr.x;
                        attr.by = attr.y;
                        break;
                }
            },
            pcoms1 = [], // path commands of original path p
            pcoms2 = [], // path commands of original path p2
            pfirst = '', // temporary holder for original path command
            pcom = ''; // holder for previous path command of original path
        let filter = false, filter2 = false;
        for (var i = 0, ii = mmax(p.length, p2 && p2.length || 0); i < ii; ++i) {
            p[i] && (pfirst = p[i][0]); // save current path command

            if (pfirst != 'C') // C is not saved yet, because it may be result of conversion
            {
                pcoms1[i] = pfirst; // Save current path command
                i && (pcom = pcoms1[i - 1]); // Get previous path command pcom
            }

            p[i] = processPath(p[i], attrs, pcom); // Previous path command is inputted to processPath

            if (!p[i]) {
                filter = true;
            }

            if (!expand_only) {
                if (pcoms1[i] != 'A' && pfirst == 'C') pcoms1[i] = 'C'; // A is the only command
                // which may produce multiple C:s
                // so we have to make sure that C is also C in original path

                fixArc(p, i); // fixArc adds also the right amount of A:s to pcoms1
            }

            if (p2) { // the same procedures is done to p2
                p2[i] && (pfirst = p2[i][0]);
                if (pfirst != 'C') {
                    pcoms2[i] = pfirst;
                    i && (pcom = pcoms2[i - 1]);
                }
                p2[i] = processPath(p2[i], attrs2, pcom);
                if (!p2[i]) {
                    filter2 = true;
                }
                if (!expand_only) {
                    if (pcoms2[i] != 'A' && pfirst == 'C') {
                        pcoms2[i] = 'C';
                    }

                    fixArc(p2, i);
                }
            }
            fixM(p, p2, attrs, attrs2, i);
            fixM(p2, p, attrs2, attrs, i);

            // if (true) {
            p[i] && toIncr(attrs, p[i]);
            p2 && p2[i] && toIncr(attrs2, p2[i]);
            // }else {
            //     attrs.x = seg[seglen - 2];
            //     attrs.y = seg[seglen - 1];
            //     attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
            //     attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
            //     attrs2.bx = p2 && (toFloat(seg2[seg2len - 4]) || attrs2.x);
            //     attrs2.by = p2 && (toFloat(seg2[seg2len - 3]) || attrs2.y);
            //     attrs2.x = p2 && seg2[seg2len - 2];
            //     attrs2.y = p2 && seg2[seg2len - 1];
            // }

        }
        if (filter) p = p.filter(Boolean);
        if (filter2) p2 = p2.filter(Boolean);

        if (!p2) {
            if (!expand_only) {
                pth.curve = pathClone(p);
            } else {
                pth.curve_exp = pathClone(p);
            }

        }
        return p2 ? [p, p2] : p;
    }

    elproto.toPathArray = function (expand_only, process_arc) {
        if (this.type !== "path") return [];
        return path2curve(this, undefined, expand_only, process_arc);
    }

    elproto.getNumberPathSegments = function () {
        let path_str = getPath[this.type](this);

        let c_segs = path2curve(path_str, false, true);
        c_segs = removeRedundantCSegs(c_segs);
        return c_segs.length;
    }

    function removeRedundantCSegs(curves) {
        const result = [];
        let last = [];
        for (let i = 0, l = curves.length, crv; i < l; ++i) {
            crv = curves[i];
            if (!last.length || crv[0] !== "C"
                || last[0] !== crv[1] || last[0] !== crv[3] || last[0] !== crv[5]
                || last[1] !== crv[2] || last[1] !== crv[4] || last[1] !== crv[6]) {
                result.push(crv);
                last[0] = crv[crv.length - 2];
                last[1] = crv[crv.length - 1];
            }
        }
        return result;
    }


    function getControlPoints(path, segment_points, skip_same_last) {
        if (path === undefined || typeof path === 'boolean') {
            skip_same_last = segment_points;
            segment_points = path;
            path = this;
        }

        path = path2curve(path, undefined, true, !segment_points);

        const result = [];
        let last_start = 0;
        for (let i = 0, l = path.length, command; i < l; ++i) {
            command = path[i];
            switch (command[0]) {
                case 'M':
                    if (skip_same_last && result.length) {
                        let s = result[last_start], e = result[result.length - 1];
                        if (Math.abs(s[0] - e[0]) < ERROR && Math.abs(s[1] - e[1]) <
                            ERROR) { //points are the same
                            result.pop();
                        }
                    }
                    result.push([+command[1], +command[2]]);
                    last_start = result.length - 1;
                    break;
                case 'L':
                    result.push([+command[1], +command[2]]);
                    break;
                case 'Q':
                    if (!segment_points) {
                        result.push([+command[1], +command[2]]);
                    }
                    result.push([+command[3], +command[4]]);
                    break;
                case 'C':
                    if (!segment_points) {
                        result.push([+command[1], +command[2]]);
                        result.push([+command[3], +command[4]]);
                    }
                    result.push([+command[5], +command[6]]);
                    break;
                case 'A':
                    result.push([+command[6], +command[7]]);
                    break;

            }
        }

        if (skip_same_last && result.length) {
            let s = result[last_start], e = result[result.length - 1];
            if (Math.abs(s[0] - e[0]) < ERROR && Math.abs(s[1] - e[1]) < ERROR) { //points are the same
                result.pop();
            }
        }

        return result;
    }

    function isPolygon(path) {
        path = path || this;
        if (path.type === 'polygon' || path.type === 'polyline' || path.type === 'line') return true;
        if (path.type !== 'path') return false;

        if (isCompound(path)) return false;
        let path_instr = path2curve(path, undefined, true);
        const coms = ['m', 'l', 'z'];
        for (let i = 0; i < path_instr.length; i++) {
            if (coms.indexOf(path_instr[i][0].toLowerCase()) === -1) return false;
        }
        return true;
    }

    function near(p1, p2) {
        return Math.abs(p1.x - p2.x) < 1e-8 && Math.abs(p1.y - p2.y) < 1e-8;
    }

    function getPointSample(path, sample) {
        if (!path || typeof path === 'number') {
            sample = path;
            path = this;
        }
        if (path.type !== 'path') return null;

        sample = Math.max((sample || 10), 2);

        let bazrs = path.toBeziers();
        let points = [];
        let inc = 1 / (sample - 1);
        let t_s = [...Array(sample - 2).keys()].map((_, i) => (i + 1) * inc);
        for (let i = 0, l = bazrs.length; i < l; ++i) {
            let bez = bazrs[i];
            let p = bez.points[0];
            if (!i || !near(p, points[points.length - 1])) {
                points.push(p);
            }
            if (bez.points.length > 2) t_s.forEach((t) => points.push(bez.get(t)));
            p = bez.points[bez.points.length - 1];
            if (!near(p, points[0])) {
                points.push(p);
            }
        }

        return points;
    }

    elproto.getPointSample = getPointSample;

    function mapPath(path, matrix) {
        if (!matrix) {
            return path;
        }
        let x, y, i, j, ii, jj, pathi;
        path = path2curve(path);
        for (i = 0, ii = path.length; i < ii; ++i) {
            pathi = path[i];
            for (j = 1, jj = pathi.length; j < jj; j += 2) {
                x = matrix.x(pathi[j], pathi[j + 1]);
                y = matrix.y(pathi[j], pathi[j + 1]);
                pathi[j] = x;
                pathi[j + 1] = y;
            }
        }
        return path;
    }

// http://schepers.cc/getting-to-the-point
    function catmullRom2bezier(crp, z) {
        const d = [];
        let i = 0;
        const iLen = crp.length;
        for (; iLen - 2 * !z > i; i += 2) {
            const p = [
                {x: +crp[i - 2], y: +crp[i - 1]},
                {x: +crp[i], y: +crp[i + 1]},
                {x: +crp[i + 2], y: +crp[i + 3]},
                {x: +crp[i + 4], y: +crp[i + 5]},
            ];
            if (z) {
                if (!i) {
                    p[0] = {x: +crp[iLen - 2], y: +crp[iLen - 1]};
                } else if (iLen - 4 == i) {
                    p[3] = {x: +crp[0], y: +crp[1]};
                } else if (iLen - 2 == i) {
                    p[2] = {x: +crp[0], y: +crp[1]};
                    p[3] = {x: +crp[2], y: +crp[3]};
                }
            } else {
                if (iLen - 4 == i) {
                    p[3] = p[2];
                }
                if (!i) {
                    p[0] = {x: +crp[i], y: +crp[i + 1]};
                }
            }
            d.push([
                'C',
                (-p[0].x + 6 * p[1].x + p[2].x) / 6,
                (-p[0].y + 6 * p[1].y + p[2].y) / 6,
                (p[1].x + 6 * p[2].x - p[3].x) / 6,
                (p[1].y + 6 * p[2].y - p[3].y) / 6,
                p[2].x,
                p[2].y,
            ]);
        }

        return d;
    }

// export
    Snap.path = paths;

    /*\
     * Snap.path.getTotalLength
     [ method ]
     **
     * Returns the length of the given path in pixels
     **
     - path (string) SVG path string
     **
     = (number) length
     \*/
    Snap.path.getTotalLength = getTotalLength;
    /*\
     * Snap.path.getPointAtLength
     [ method ]
     **
     * Returns the coordinates of the point located at the given length along the given path
     **
     - path (string) SVG path string
     - length (number) length, in pixels, from the start of the path, excluding non-rendering jumps
     **
     = (object) representation of the point:
     o {
     o     x: (number) x coordinate,
     o     y: (number) y coordinate,
     o     alpha: (number) angle of derivative
     o }
     \*/
    Snap.path.getPointAtLength = getPointAtLength;
    /*\
     * Snap.path.getSubpath
     [ method ]
     **
     * Returns the subpath of a given path between given start and end lengths
     **
     - path (string) SVG path string
     - from (number) length, in pixels, from the start of the path to the start of the segment
     - to (number) length, in pixels, from the start of the path to the end of the segment
     **
     = (string) path string definition for the segment
     \*/
    Snap.path.getSubpath = function (path, from, to) {
        if (this.getTotalLength(path) - to < 1e-6) {
            return getSubpathsAtLength(path, from).end;
        }
        const a = getSubpathsAtLength(path, to, 1);
        return from ? getSubpathsAtLength(a, from).end : a;
    };

    Snap.path.toPath = function (el, string_only) {
        const type = el.type;
        if (type === 'path') return (string_only) ? el.attr('d') : el;
        if (!getPath.hasOwnProperty(type)) return null;

        const d = getPath[type](el);

        if (string_only) return d;

        const path = el.paper.path(d);
        el.after(path);

        if (el.getGeometryAttr) {
            //This assumes iaDesigner
            const attrs = el.attrs(el.getGeometryAttr(), true); //Copy all attributes except the geometry ones
            attrs.id = el.getId() + '_path';
            path.attr(attrs);
        }

        return path;
    };

    function isCompound(path) {
        if (!path) path = this;
        if (typeof path === 'object' && path.type && path.type ===
            'path') path = path.attr('d');
        if (typeof path !== 'string' && !Array.isArray(path)) return false;
        let segs = Array.isArray(path) ? path : pathToAbsolute(path);
        segs = segs.filter(function (instr) {
            return instr[0] == 'M' || instr[0] == 'm';
        });
        return segs.length > 1;
    }

    Snap.path.isCompound = isCompound;

    /**
     * Checks if the eleme if compoubt
     * @type {isCompound}
     */
    elproto.isCompound = isCompound;

    elproto.getControlPoints = getControlPoints;
    Snap.path.getControlPoints = getControlPoints;

    elproto.isPolygon = isPolygon;
    Snap.path.isPolygon = isPolygon;

    function getPathCompoundSegments(path) {
        if (!path) path = this;
        let ret_type = (typeof path === 'string') ? 'string' : 'array';
        if (typeof path === 'object' && path.type && path.type ===
            'path') path = path.attr('d');
        if (typeof path !== 'string' && !Array.isArray(path)) return null;
        let segs = Array.isArray(path) ? path : pathToAbsolute(path);

        const result = [];
        try {
            for (let i = 0, l = segs.length, instr, part; i < l; ++i) {
                instr = segs[i];
                if (instr[0] == 'M' || instr[0] == 'm') {
                    path = [instr];
                    result.push(path);
                } else {
                    path.push(instr);
                }
            }
        } catch (e) {
            return null;
        }

        if (ret_type === 'string') {
            return result.map(function (path) {
                return toString(path);
            });
        }

        return result;
    }

    Snap.path.getCompoundSegments = getPathCompoundSegments;
    elproto.getCompoundSegments = getPathCompoundSegments;

    function polygonLength(el, close, matrix) {

        let points = (Array.isArray(el)) ? el : el.attr('points');

        matrix = matrix || (el.getLocalMatrix && el.getLocalMatrix());
        let to_tarns = matrix && !matrix.isIdentity();
        let length = 0;
        let prev = {x: +points[0], y: +points[1]}, next;
        if (to_tarns) prev = matrix.apply(prev);
        for (let i = 2, l = points.length; i < l; i += 2) {
            next = {x: +points[i], y: +points[i + 1]};
            if (to_tarns) next = matrix.apply(next);
            length += Snap.len(prev.x, prev.y, next.x, next.y);
            prev = next;
        }

        if (close) {
            next = {x: +points[0], y: +points[1]};
            if (to_tarns) next = matrix.apply(next);
            length += Snap.len(prev.x, prev.y, next.x, next.y);
        }

        return length;
    }

    /*\
     * Element.getTotalLength
     [ method ]
     **
     * Returns the length of the path in pixels (only works for `path` elements)
     = (number) length
     \*/
    elproto.getTotalLength = function () {
        if (this.type === 'path' && this.node.getTotalLength) {
            return this.node.getTotalLength();
        }

        if (this.type === 'polyline') {
            return polygonLength(this);
        }

        if (this.type === 'polygon') {
            return polygonLength(this, true);
        }

        if (this.type === 'rect') {
            const x = this.attr('x'),
                y = this.attr('y'),
                w = this.attr('width'),
                h = this.attr('height');

            return polygonLength([x, y, x + w, y, x + w, y + h, x, y + h], true,
                this.getLocalMatrix());
        }

        if (this.type === 'line') {
            let x1 = +this.attr('x1'),
                y1 = +this.attr('y1'),
                x2 = +this.attr('x2'),
                y2 = +this.attr('y2');

            let m = this.getLocalMatrix();
            if (!m.isIdentity()) {
                const p1 = m.apply([x1, y1]);
                const p2 = m.apply([x2, y2]);

                x1 = p1.x;
                y1 = p1.y;
                x2 = p2.x;
                y2 = p2.y;
            }

            return Snap.len(x1, y1, x2, y2);
        }

        //no full affine transforms supported
        if (this.type === 'ellipse') {
            //using Ramanujan approximation
            let rx = +this.attr('rx'),
                ry = +this.attr('ry');

            const h = (rx - ry) ** 2 / (rx + ry) ** 2;

            return Math.PI * (rx + ry) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h)));

        }

        if (this.type === 'cirle') {
            let r = +this.attr('r');

            return 2 * Math.PI * r;
        }

    };
// SIERRA Element.getPointAtLength()/Element.getTotalLength(): If a <path> is broken into different segments, is the jump distance to the new coordinates set by the _M_ or _m_ commands calculated as part of the path's total length?
    /*\
     * Element.getPointAtLength
     [ method ]
     **
     * Returns coordinates of the point located at the given length on the given path (only works for `path` elements)
     **
     - length (number) length, in pixels, from the start of the path, excluding non-rendering jumps
     **
     = (object) representation of the point:
     o {
     o     x: (number) x coordinate,
     o     y: (number) y coordinate,
     o     alpha: (number) angle of derivative
     o }
     \*/
    elproto.getPointAtLength = function (length) {
        {
            let path_str = getPath[this.type](this);
            return getPointAtLength(path_str, length);
        }
    };

    /**
     * Gets the point at a parametric value
     * @param t an number in [0,1].
     */
    elproto.getPointAt = function (t) {
        t = Math.max(Math.min(1, t), 0);
        return this.getPointAtLength(t * this.getTotalLength());
    };

    function reverse_seg(seg) {
        function last(com) {
            return com.splice(-2)
        }

        function appd(seg, p) {
            p.forEach((v) => seg.push(v))
        }

        function to_points(vals) {
            const res = [];
            for (let i = 0; i < vals.length - 1; i += 2) {
                res.push([vals[i], vals[i + 1]])
            }
            return res;
        }

        const cop = seg.slice().reverse();

        let point;
        cop.forEach((com, i) => {
            if (!i) seg[i] = ["M"];
            point = last(com);
            appd(seg[i], point);
            let points = com.splice(1);
            if (com[0] === "M") return;
            seg[i + 1] = com;
            if (com[0] === "A") {
                appd(com, [points[0], points[1], points[2], points[3],
                    (+points[4]) ? "0" : "1"]);
            } else {
                points = to_points(points);
                points.reverse();
                points.forEach((p) => appd(com, p))
            }
        })
    }

    elproto.reverse = function () {
        const type = this.type;
        if (type !== "path" && type !== "polygon" && type !== "polyline") {
            return this;
        }

        if (type === "path") {
            let coms = path2curve(this, true);
            console.log(coms.toString());
            const segs = [];
            {
                let seg;
                coms.forEach((com) => {
                    if (com[0] === "M") {
                        seg = [com];
                        segs.push(seg);
                    } else {
                        seg.push(com);
                    }
                })
            }
            segs.reverse();
            segs.forEach(reverse_seg);

            console.log(segs.toString())

            this.attr({d: segs})
        } else {
            let points = this.attr("points");
            points = points.map((v, i) =>
                (i % 2 === 0) ? [v, points[i + 1]] : undefined
            ).filter(Boolean);
            points.reverse();
            this.attr({points: points});
        }
        return this;
    }

// SIERRA Element.getSubpath(): Similar to the problem for Element.getPointAtLength(). Unclear how this would work for a segmented path. Overall, the concept of _subpath_ and what I'm calling a _segment_ (series of non-_M_ or _Z_ commands) is unclear.
    /*\
     * Element.getSubpath
     [ method ]
     **
     * Returns subpath of a given element from given start and end lengths (only works for `path` elements)
     **
     - from (number) length, in pixels, from the start of the path to the start of the segment
     - to (number) length, in pixels, from the start of the path to the end of the segment
     **
     = (string) path string definition for the segment
     \*/
    elproto.getSubpath = function (from, to) {
        return Snap.path.getSubpath(this.attr('d'), from, to);
    };

    PathPoint.MIDDLE = 'mid';//0;
    PathPoint.END = 'end'; //1;
    PathPoint.START = 'start'; //2;
    PathPoint.START_END = 'start_end'; //3;

    PathPoint.CORNER = 'corner'; //1;
    PathPoint.SMOOTH = 'smooth'; //2;
    PathPoint.SYMMETRIC = 'symmetric'; //3;

    function PathPoint(center, before, after, ending) {
        let type, bezier;
        if (center instanceof PathPoint) {
            ending = center.ending;
            before = (center.b) ? Object.assign({}, center.b) : undefined;
            after = (center.a) ? Object.assign({}, center.a) : undefined;
            type = center.type;
            bezier = center.bezier;
            center = Object.assign({}, center.c);
        }
        this.c = center;
        this.a = after;
        this.b = before;
        this.ending = ending;
        this.bezeir = undefined;
        this.type = undefined;
    }

    Snap.registerClass("PathPoint", PathPoint);

    function getPointType(c, a, b) {
        const angle = Math.abs(
            Snap.angle(a.x, a.y, b.x, b.y, c.x, c.y));
        if (Math.abs(angle - 180) < 1) {
            if (Math.abs(Snap.len2(b.x, b.y, c.y, c.y) -
                Snap.len2(a.x, a.y, c.y, c.y)) < 1e-5) {
                return PathPoint.SYMMETRIC;
            }
            return PathPoint.SMOOTH;
        }
        return PathPoint.CORNER;
    }

    Snap.path.getPointType = getPointType;

    PathPoint.prototype.clone = function () {
        return new PathPoint(this);
    }

    PathPoint.prototype.getType = function () {
        if (this.type) return this.type;
        if (!this.a || !this.b) return undefined;
        this.type = getPointType(this.c, this.a, this.b);

        return this.type;
    }

    PathPoint.prototype.isCorner = function () {
        return this.getType() === PathPoint.CORNER;
    }

    PathPoint.prototype.isSmooth = function (not_symmetric) {
        return this.getType() === PathPoint.SMOOTH || (!not_symmetric && this.getType() === PathPoint.SYMMETRIC);
    }

    PathPoint.prototype.isSymmetric = function () {
        return this.getType() === PathPoint.SYMMETRIC;
    }

    PathPoint.prototype.addMeasurements = function (pathPoints, beziers, close, data) {
        beziers = beziers || Snap.path.toBeziers(pathPoints);
        const total_length = beziers.reduce((len, bz) => len + bz.length(), 0);
        let temp_rel_l = 0, temp_l = 0;
        pathPoints.forEach((p, i) => {
            if (i) {
                const length = beziers[i - 1].length();
                temp_l += length;
                p.length_from_prev = length;
                p.tot_length = temp_l;

                const rel_length = length / total_length; //normalize
                temp_rel_l += rel_length;
                p.rel_length_from_prev = rel_length;
                p.tot_rel_length = temp_rel_l; /*At portion of total length 0-1*/
                p.bezeir = beziers[i - 1];
            } else {
                p.length_from_prev = 0;
                p.tot_length = 0;
                p.rel_length_from_prev = 0;
                p.tot_rel_length = 0;
            }
            if (data) {
                for (let key in data) if (data.hasOwnProperty(key)) {
                    p[key] = data[key];
                }
            }
        });

        if (close) {
            let end_p = new PathPoint(pathPoints[0]);
            //normalize

            const length = beziers[beziers.length - 1].length();
            end_p.length_from_prev = length;
            end_p.tot_length = total_length;

            end_p.rel_length_from_prev = length / total_length;
            end_p.tot_rel_length = 1;
            end_p.bezeir = beziers[beziers.length - 1];
            if (data) {
                for (let key in data) if (data.hasOwnProperty(key)) {
                    end_p[key] = data[key];
                }
            }

            pathPoints.push(end_p);
        }
    }

    /**
     * Computes new bezier tangent control points around a point to make the curve
     * @param center the main point.
     * @param after the after control point
     * @param before the before control point
     * @param symmetric whether to make the control tangents points symmetric
     * @param modify_points if true, the before and after points objects are modified, instead of new points being returned.
     * @returns {undefined|*[]} If modify_points is true, nothing is returend, otherwise, array [new_after, new_before]
     * is returned.
     * TODO: implement auto-smooth, as in: https://stackoverflow.com/questions/61564459/algorithm-behind-inkscapes-auto-smooth-nodes
     */
    Snap.path.smoothCorner = function (center, after, before, symmetric, modify_points) {
        const type = Snap.path.getPointType(center, after, before);
        if ((symmetric && type === PathPoint.SYMMETRIC)
            || (!symmetric && type === PathPoint.SMOOTH)) return (modify_points) ? undefined : [after, before];

        let angle = Snap.angle(after.x, after.y, before.x, before.y, center.x, center.y);

        angle = (angle + 180) % 360 - 180;

        const sign = (angle < 0) ? -1 : 1;
        let dif = sign * (180 - Math.abs(angle)) / 2;
        // console.log(angle, dif);
        const matrix_b = Snap.matrix().rotate(-dif, center.x, center.y);
        const matrix_a = Snap.matrix().rotate(dif, center.x, center.y);

        const new_before = matrix_b.apply(before);
        const new_after = matrix_a.apply(after);

        if (symmetric) {
            const b_l = Snap.len(center.x, center.y, new_before.x, new_before.y);
            const a_l = Snap.len(center.x, center.y, new_after.x, new_after.y);

            const l = (a_l + b_l) / 2;

            new_after.x = center.x + (new_after.x - center.x) * (l / a_l);
            new_after.y = center.y + (new_after.y - center.y) * (l / a_l);

            new_before.x = center.x + (new_before.x - center.x) * (l / b_l);
            new_before.y = center.y + (new_before.y - center.y) * (l / b_l);
        }

        if (modify_points) {
            after.x = new_after.x;
            after.y = new_after.y;
            before.x = new_before.x;
            before.y = new_before.y;
        }
        return (modify_points) ? undefined : [new_after, new_before]
    }


    function seg_find_segments(anals) {
        anals = anals || this;

        let segments = [];

        let indxs = anals.map((s, i) => (s.ending === PathPoint.START
            || s.ending === PathPoint.START_END) ? i : undefined).filter(Boolean);

        for (let i = 0, l = indxs.length + 1, start = 0; i < l; ++i) {
            segments.push(anals.slice(start, indxs[i]));
            start = indxs[i];
        }

        // if (!segments.length) segments.push(anals); //add the whole part if no segments
        return segments;
    }

    function bezeirs(anals) {
        anals = anals || this;

        let result = [];
        let prev, to_close;
        for (let i = 0, l = anals.length; i < l; ++i) {
            let next = anals[i];
            if (!prev) {
                prev = next;
                if (prev.ending === PathPoint.START_END) {
                    to_close = prev;
                }
                continue;
            }

            if (prev.a && next.b) {
                const bz = Snap.bezier(prev.c.x, prev.c.y, prev.a.x, prev.a.y, next.b.x,
                    next.b.y, next.c.x, next.c.y);
                if (prev.ending === PathPoint.START || prev.ending === PathPoint.START_END) {
                    bz.start = true;
                }
                result.push(bz);
            }

            if (next.ending === PathPoint.END || i === l - 1) {
                if (to_close) {
                    const bz = Snap.bezier(next.c.x, next.c.y, next.a.x, next.a.y, to_close.b.x,
                        to_close.b.y, to_close.c.x, to_close.c.y);
                    result.push(bz);
                    to_close = undefined;
                }
                prev = undefined;
            } else if (next.ending === PathPoint.START || next.ending === PathPoint.START_END) {
                if (to_close && prev) {
                    const bz = Snap.bezier(prev.c.x, prev.c.y, prev.a.x, prev.a.y, to_close.b.x,
                        to_close.b.y, to_close.c.x, to_close.c.y);
                    result.push(bz);
                }

                to_close = (next.ending === PathPoint.START_END) ? next : undefined;

                prev = next;
            } else {
                prev = next;
            }

        }

        return result;
    }

    elproto.getSegmentAnalysis = function () {
        let path_str = getPath[this.type](this);

        let c_segs = path2curve(path_str, false, true);
        c_segs = removeRedundantCSegs(c_segs);

        let prev, joins = [], segments = [];
        for (let i = 0, l = c_segs.length, seg, last; i < l; ++i) {
            seg = c_segs[i];

            if (i) last = joins[joins.length - 1];

            if (seg[0] === 'M') {
                if (i) { //this is a later segment
                    if (last.c.x === seg[1] && last.c.y === seg[2]) {
                        //check for connection with previous
                        break; //redundant point
                    }

                    //check for previous closed segment
                    let start_seg = joins[segments[segments.length - 1]];
                    if (start_seg.c.x === last.c.x && start_seg.c.y === last.c.y) {
                        start_seg.ending = PathPoint.START_END;
                        start_seg.b = last.b;
                        joins.pop();
                    } else {
                        last.ending = PathPoint.END;
                    }
                }
                segments.push(joins.length);

                joins.push(new PathPoint({
                    x: seg[1],
                    y: seg[2]
                }, undefined, undefined, PathPoint.START));

                continue;
            }

            //This is Curve
            let a = {x: seg[1], y: seg[2]},
                b = {x: seg[3], y: seg[4]},
                c = {x: seg[5], y: seg[6]};

            last.a = a;
            joins.push(new PathPoint(c, b, undefined, undefined));
        }

        //Check for closed segment
        let start_seg = joins[segments[segments.length - 1]];
        let last = joins[joins.length - 1];
        if (Math.abs(start_seg.c.x - last.c.x) < ERROR && Math.abs(start_seg.c.y - last.c.y) < ERROR) {
            start_seg.ending = PathPoint.START_END;
            start_seg.b = last.b;
            joins.pop();
        } else {
            last.ending = PathPoint.END;
        }

        joins.forEach((pp) => pp.getType());
        joins.segments = seg_find_segments.bind(joins);

        return joins;
    };

    function toBeziers(anals, segmented) {
        if (anals && !Array.isArray(anals) && !anals.getSegmentAnalysis) {
            segmented = anals;
            anals = undefined;
        }
        anals = anals || ((this.getSegmentAnalysis) ? this.getSegmentAnalysis() : undefined);
        if (anals.getSegmentAnalysis) anals = anals.getSegmentAnalysis();

        if (!anals) return undefined;

        let bezs = bezeirs(anals);
        if (segmented) {
            const res = [[]];
            let cur = res[0];
            bezs.forEach((bz, i) => {
                if (i && bz.start) {
                    cur = [bz];
                    res.push(cur);
                } else {
                    cur.push(bz);
                }
            });
            bezs = res;
        }

        return bezs;
    }

    elproto.toBeziers = toBeziers;
    Snap.path.toBeziers = toBeziers

    elproto.toPolyBezier = function () {
        return Snap.polyBezier(this.toBeziers());
    };

    function cubicFromThirdPoints(p1, p2, p3, p4) {
        let m = [
            [1, 0, 0, 0],
            [-0.83333333333333, 3, -1.5, 0.3333333333333],
            [0.333333333333333, -1.5, 3, -0.8333333333333],
            [0, 0, 0, 1],
        ];

        let x = [[p1.x], [p2.x], [p3.x], [p4.x]],
            y = [[p1.y], [p2.y], [p3.y], [p4.y]];

        let new_x, new_y;
        if (math.matrix) {
            m = math.matrix(m);
            new_x = math.multiply(m, x).toArray(); //math.matrix(x).toArray();
            new_y = math.multiply(m, y).toArray(); // math.matrix(y).toArray();
        } else {
            new_x = math.multiply(m, x);
            new_y = math.multiply(m, y);
        }

        return [
            p1,
            {x: new_x[1][0], y: new_y[1][0]},
            {x: new_x[2][0], y: new_y[2][0]},
            p4];
    }

    Snap.path.cubicFromThirdPoints = cubicFromThirdPoints;

    Snap._.box = box; //for backward compatibility
    Snap.box = box;

    Snap.registerType("bbox", BBox)

    /*\
     * Snap.path.findDotsAtSegment
     [ method ]
     **
     * Utility method
     **
     * Finds dot coordinates on the given cubic beziér curve at the given t
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     - t (number) position on the curve (0..1)
     = (object) point information in format:
     o {
     o     x: (number) x coordinate of the point,
     o     y: (number) y coordinate of the point,
     o     m: {
     o         x: (number) x coordinate of the left anchor,
     o         y: (number) y coordinate of the left anchor
     o     },
     o     n: {
     o         x: (number) x coordinate of the right anchor,
     o         y: (number) y coordinate of the right anchor
     o     },
     o     start: {
     o         x: (number) x coordinate of the start of the curve,
     o         y: (number) y coordinate of the start of the curve
     o     },
     o     end: {
     o         x: (number) x coordinate of the end of the curve,
     o         y: (number) y coordinate of the end of the curve
     o     },
     o     alpha: (number) angle of the curve derivative at the point
     o }
     \*/
    Snap.path.findDotsAtSegment = findDotsAtSegment;
    /*\
     * Snap.path.bezierBBox
     [ method ]
     **
     * Utility method
     **
     * Returns the bounding box of a given cubic beziér curve
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     * or
     - bez (array) array of six points for beziér curve
     = (object) bounding box
     o {
     o     x: (number) x coordinate of the left top point of the box,
     o     y: (number) y coordinate of the left top point of the box,
     o     x2: (number) x coordinate of the right bottom point of the box,
     o     y2: (number) y coordinate of the right bottom point of the box,
     o     width: (number) width of the box,
     o     height: (number) height of the box
     o }
     \*/
    Snap.path.bezierBBox = bezierBBox;
    /*\
     * Snap.path.isPointInsideBBox
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if given point is inside bounding box
     - bbox (string) bounding box
     - x (string) x coordinate of the point
     - y (string) y coordinate of the point
     = (boolean) `true` if point is inside
     \*/
    Snap.path.isPointInsideBBox = isPointInsideBBox;
    Snap.closest = function (x, y, X, Y) {
        let r = 100,
            b = box(x - r / 2, y - r / 2, r, r);
        const inside = [],
            getter = X[0].hasOwnProperty('x') ? function (i) {
                return {
                    x: X[i].x,
                    y: X[i].y,
                };
            } : function (i) {
                return {
                    x: X[i],
                    y: Y[i],
                };
            };
        let found = 0;
        while (r <= 1e6 && !found) {
            for (var i = 0, ii = X.length; i < ii; ++i) {
                const xy = getter(i);
                if (isPointInsideBBox(b, xy.x, xy.y)) {
                    found++;
                    inside.push(xy);
                    break;
                }
            }
            if (!found) {
                r *= 2;
                b = box(x - r / 2, y - r / 2, r, r);
            }
        }
        if (r == 1e6) {
            return;
        }
        let len = Infinity,
            res;
        for (i = 0, ii = inside.length; i < ii; ++i) {
            const l = Snap.len(x, y, inside[i].x, inside[i].y);
            if (len > l) {
                len = l;
                inside[i].len = l;
                res = inside[i];
            }
        }
        return res;
    };
    /*\
     * Snap.path.isBBoxIntersect
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if two bounding boxes intersect
     - bbox1 (string) first bounding box
     - bbox2 (string) second bounding box
     = (boolean) `true` if bounding boxes intersect
     \*/
    Snap.path.isBBoxIntersect = isBBoxIntersect;
    /*\
     * Snap.path.intersection
     [ method ]
     **
     * Utility method
     **
     * Finds intersections of two paths
     - path1 (string) path string
     - path2 (string) path string
     = (array) dots of intersection
     o [
     o     {
     o         x: (number) x coordinate of the point,
     o         y: (number) y coordinate of the point,
     o         t1: (number) t value for segment of path1,
     o         t2: (number) t value for segment of path2,
     o         segment1: (number) order number for segment of path1,
     o         segment2: (number) order number for segment of path2,
     o         bez1: (array) eight coordinates representing beziér curve for the segment of path1,
     o         bez2: (array) eight coordinates representing beziér curve for the segment of path2
     o     }
     o ]
     \*/
    Snap.path.intersection = pathIntersection;
    Snap.path.intersectionNumber = pathIntersectionNumber;
    Snap.path.isPathOverlapRect = isPathOverlapRect;
    /*\
     * Snap.path.isPointInside
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if given point is inside a given closed path.
     *
     * Note: fill mode doesn’t affect the result of this method.
     - path (string) path string
     - x (number) x of the point
     - y (number) y of the point
     = (boolean) `true` if point is inside the path
     \*/
    Snap.path.isPointInside = isPointInsidePath;
    /*\
     * Snap.path.getBBox
     [ method ]
     **
     * Utility method
     **
     * Returns the bounding box of a given path
     - path (string) path string
     = (object) bounding box
     o {
     o     x: (number) x coordinate of the left top point of the box,
     o     y: (number) y coordinate of the left top point of the box,
     o     x2: (number) x coordinate of the right bottom point of the box,
     o     y2: (number) y coordinate of the right bottom point of the box,
     o     width: (number) width of the box,
     o     height: (number) height of the box
     o }
     \*/
    Snap.path.getBBox = pathBBox;
    Snap.path.get = getPath;
    /*\
     * Snap.path.toRelative
     [ method ]
     **
     * Utility method
     **
     * Converts path coordinates into relative values
     - path (string) path string
     = (array) path string
     \*/
    Snap.path.toRelative = pathToRelative;
    /*\
     * Snap.path.toAbsolute
     [ method ]
     **
     * Utility method
     **
     * Converts path coordinates into absolute values
     - path (string) path string
     = (array) path string
     \*/
    Snap.path.toAbsolute = pathToAbsolute;
    /*\
     * Snap.path.toCubic
     [ method ]
     **
     * Utility method
     **
     * Converts path to a new path where all segments are cubic beziér curves
     - pathString (string|array) path string or array of segments
     = (array) array of segments
     \*/
    Snap.path.toCubic = path2curve;
    /*\
     * Snap.path.map
     [ method ]
     **
     * Transform the path string with the given matrix
     - path (string) path string
     - matrix (object) see @Matrix
     = (string) transformed path string
     \*/
    Snap.path.map = mapPath;
    Snap.path.toString = toString;
    Snap.path.clone = pathClone;

    Snap.path.getPointSample = getPointSample;
})
;

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

    // Set
    var Set = function (items) {
            this.items = [];
            this.bindings = {};
            this.length = 0;
            this.type = "set";
            if (items) {
                for (var i = 0, ii = items.length; i < ii; ++i) {
                    if (items[i]) {
                        this[this.items.length] = this.items[this.items.length] = items[i];
                        this.length++;
                    }
                }
            }
        },
        setproto = Set.prototype;
    /*\
     * Set.push
     [ method ]
     **
     * Adds each argument to the current set
     = (object) original element
    \*/
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
    /*\
     * Set.pop
     [ method ]
     **
     * Removes last element and returns it
     = (object) element
    \*/
    setproto.pop = function () {
        this.length && delete this[this.length--];
        return this.items.pop();
    };
    /*\
     * Set.forEach
     [ method ]
     **
     * Executes given function for each element in the set
     *
     * If the function returns `false`, the loop stops running.
     **
     - callback (function) function to run
     - thisArg (object) context object for the callback
     = (object) Set object
    \*/
    setproto.forEach = function (callback, thisArg) {
        for (var i = 0, ii = this.items.length; i < ii; ++i) {
            if (callback.call(thisArg, this.items[i], i) === false) {
                return this;
            }
        }
        return this;
    };
    /*\
     * Set.animate
     [ method ]
     **
     * Animates each element in set in sync.
     *
     **
     - attrs (object) key-value pairs of destination attributes
     - duration (number) duration of the animation in milliseconds
     - easing (function) #optional easing function from @mina or custom
     - callback (function) #optional callback function that executes when the animation ends
     * or
     - animation (array) array of animation parameter for each element in set in format `[attrs, duration, easing, callback]`
     > Usage
     | // animate all elements in set to radius 10
     | set.animate({r: 10}, 500, mina.easein);
     | // or
     | // animate first element to radius 10, but second to radius 20 and in different time
     | set.animate([{r: 10}, 500, mina.easein], [{r: 20}, 1500, mina.easein]);
     = (Element) the current element
    \*/
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
    /*\
     * Set.remove
     [ method ]
     **
     * Removes all children of the set.
     *
     = (object) Set object
    \*/
    setproto.remove = function () {
        while (this.length) {
            this.pop().remove();
        }
        return this;
    };
    /*\
     * Set.bind
     [ method ]
     **
     * Specifies how to handle a specific attribute when applied
     * to a set.
     *
     **
     - attr (string) attribute name
     - callback (function) function to run
     * or
     - attr (string) attribute name
     - element (Element) specific element in the set to apply the attribute to
     * or
     - attr (string) attribute name
     - element (Element) specific element in the set to apply the attribute to
     - eattr (string) attribute on the element to bind the attribute to
     = (object) Set object
    \*/
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
    /*\
     * Set.attr
     [ method ]
     **
     * Equivalent of @Element.attr.
     = (object) Set object
    \*/
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
    /*\
     * Set.clear
     [ method ]
     **
     * Removes all elements from the set
    \*/
    setproto.clear = function () {
        while (this.length) {
            this.pop();
        }
    };
    /*\
     * Set.splice
     [ method ]
     **
     * Removes range of elements from the set
     **
     - index (number) position of the deletion
     - count (number) number of element to remove
     - insertion… (object) #optional elements to insert
     = (object) set elements that were deleted
    \*/
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
    /*\
     * Set.exclude
     [ method ]
     **
     * Removes given element from the set
     **
     - element (object) element to remove
     = (boolean) `true` if object was found and removed from the set
    \*/
    setproto.exclude = function (el) {
        for (var i = 0, ii = this.length; i < ii; ++i) if (this[i] == el) {
            this.splice(i, 1);
            return true;
        }
        return false;
    };
    /*\
     * Set.insertAfter
     [ method ]
     **
     * Inserts set elements after given element.
     **
     - element (object) set will be inserted after this element
     = (object) Set object
    \*/
    setproto.insertAfter = function (el) {
        var i = this.items.length;
        while (i--) {
            this.items[i].insertAfter(el);
        }
        return this;
    };
    /*\
     * Set.getBBox
     [ method ]
     **
     * Union of all bboxes of the set. See @Element.getBBox.
     = (object) bounding box descriptor. See @Element.getBBox.
    \*/
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

    setproto.filter = function (callback, thisArg) {
        return this.items.filter(callback, thisArg)
    };

    setproto.map = function (callback, thisArg) {
        return this.items.map(callback, thisArg)
    };

    setproto.values = function () {
        return this.items.filter(values)
    };

    setproto.includes = function (valueToFind, fromIndex) {
        return this.items.includes(valueToFind, fromIndex);
    };

    /*\
     * Set.insertAfter
     [ method ]
     **
     * Creates a clone of the set.
     **
     = (object) New Set object
    \*/
    setproto.clone = function (s) {
        s = new Set;
        for (var i = 0, ii = this.items.length; i < ii; ++i) {
            s.push(this.items[i].clone());
        }
        return s;
    };
    setproto.toString = function () {
        return "Snap\u2018s set";
    };
    setproto.type = "set";
    // export
    /*\
     * Snap.Set
     [ property ]
     **
     * Set constructor.
    \*/
    Snap.Set = Set;
    /*\
     * Snap.set
     [ method ]
     **
     * Creates a set and fills it with list of arguments.
     **
     = (object) New Set object
     | var r = paper.rect(0, 0, 10, 10),
     |     s1 = Snap.set(), // empty set
     |     s2 = Snap.set(r, paper.circle(100, 100, 20)); // prefilled set
    \*/
    Snap.set = function () {
        var set = new Set;
        if (arguments.length) {
            set.push.apply(set, Array.prototype.slice.call(arguments, 0));
        }
        return set;
    };
});

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
    var names = {},
        reUnit = /[%a-z]+$/i,
        Str = String;
    names.stroke = names.fill = "colour";
    function getEmpty(item) {
        var l = item[0];
        switch (l.toLowerCase()) {
            case "t": return [l, 0, 0];
            case "m": return [l, 1, 0, 0, 1, 0, 0];
            case "r": if (item.length == 4) {
                return [l, 0, item[2], item[3]];
            } else {
                return [l, 0];
            }
            case "s": if (item.length == 5) {
                return [l, 1, 1, item[3], item[4]];
            } else if (item.length == 3) {
                return [l, 1, 1];
            } else {
                return [l, 1];
            }
        }
    }
    function equaliseTransform(t1, t2, getBBox) {
        t1 = t1 || new Snap.Matrix;
        t2 = t2 || new Snap.Matrix;
        t1 = Snap.parseTransformString(t1.toTransformString()) || [];
        t2 = Snap.parseTransformString(t2.toTransformString()) || [];
        var maxlength = Math.max(t1.length, t2.length),
            from = [],
            to = [],
            i = 0, j, jj,
            tt1, tt2;
        for (; i < maxlength; ++i) {
            tt1 = t1[i] || getEmpty(t2[i]);
            tt2 = t2[i] || getEmpty(tt1);
            if (tt1[0] != tt2[0] ||
                tt1[0].toLowerCase() == "r" && (tt1[2] != tt2[2] || tt1[3] != tt2[3]) ||
                tt1[0].toLowerCase() == "s" && (tt1[3] != tt2[3] || tt1[4] != tt2[4])
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
    function getNumber(val) {
        return val;
    }
    function getUnit(unit) {
        return function (val) {
            return +val.toFixed(3) + unit;
        };
    }
    function getViewBox(val) {
        return val.join(" ");
    }
    function getColour(clr) {
        return Snap.rgb(clr[0], clr[1], clr[2], clr[3]);
    }
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
        return Function("val", "return IA_Designer.Snap.path.toString.call([" + b + "])");
    }
    function path2array(path) {
        var out = [];
        for (var i = 0, ii = path.length; i < ii; ++i) {
            for (var j = 1, jj = path[i].length; j < jj; j++) {
                out.push(path[i][j]);
            }
        }
        return out;
    }
    function isNumeric(obj) {
        return isFinite(obj);
    }
    function arrayEqual(arr1, arr2) {
        if (!Snap.is(arr1, "array") || !Snap.is(arr2, "array")) {
            return false;
        }
        return arr1.toString() == arr2.toString();
    }
    Element.prototype.equal = function (name, b) {
        return eve(["snap","util","equal"], this, name, b).firstDefined();
    };
    eve.on("snap.util.equal", function (name, b) {
        var A, B, a = Str(this.attr(name) || ""),
            el = this;
        if (names[name] == "colour") {
            A = Snap.color(a);
            B = Snap.color(b);
            return {
                from: [A.r, A.g, A.b, A.opacity],
                to: [B.r, B.g, B.b, B.opacity],
                f: getColour
            };
        }
        if (name == "viewBox") {
            A = this.attr(name).vb().split(" ").map(Number);
            B = b.split(" ").map(Number);
            return {
                from: A,
                to: B,
                f: getViewBox
            };
        }
        if (name == "transform" || name == "gradientTransform" || name == "patternTransform") {
            if (typeof b == "string") {
                b = Str(b).replace(/\.{3}|\u2026/g, a);
            }
            a = this.matrix;
            if (!Snap._.rgTransform.test(b)) {
                b = Snap._.transform2matrix(Snap._.svgTransform2string(b), this);
            } else {
                b = Snap._.transform2matrix(b, this);
            }
            return equaliseTransform(a, b, function () {
                return el.getBBox(true);
            });
        }
        if (name == "d" || name == "path") {
            A = Snap.path.toCubic(a, b);
            return {
                from: path2array(A[0]),
                to: path2array(A[1]),
                f: getPath(A[0])
            };
        }
        if (name == "points") {
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
    const elproto = Element.prototype,
        has = "hasOwnProperty";
    // const supportsTouch = matchMedia('(hover: none)').matches;

    const supportsTouch = 'ontouchstart' in glob.win || (glob.win.navigator && navigator.maxTouchPoints > 0);

    const supportsPointer = false && !!glob.win.PointerEvent;
    Snap.supportsTouch = supportsTouch;
    Snap.poinertSupport = supportsPointer;
    const events = [
            "click", "dblclick", "mousedown", "mousemove", "mouseout", "mouseleave",
            "mouseover", "mouseenter", "mouseup", "touchstart", "touchmove", "touchend",
            "touchcancel"
        ],
        touchMap = {
            mousedown: "touchstart",
            mousemove: "touchmove",
            mouseup: "touchend"
        },
        pointerMap = {
            mousedown: 'pointerdown',
            mousemove: 'pointermove',
            mouseup: 'pointerup',
            mouseout: 'pointerout',
            mouseover: 'pointerover',
            mouseenter: 'pointerenter',
            mouseleave: 'pointerleave',
        },
        getScroll = function (xy, el) {
            const name = xy == "y" ? "scrollTop" : "scrollLeft",
                doc = el && el.node ? el.node.ownerDocument : Snap.document();
            return doc[name in doc.documentElement ? "documentElement" : "body"][name];
        },
        preventDefault = function () {
            this.returnValue = false;
        },
        preventTouch = function () {
            console.log("prevent touch");
            return this.originalEvent.preventDefault();
        },
        stopPropagation = function () {
            this.cancelBubble = true;
        },
        stopTouch = function () {
            return this.originalEvent.stopPropagation();
        },
        addEvent = function (obj, type, fn, element) {
            let realName = (supportsPointer && pointerMap[type])
                ? pointerMap[type] : (supportsTouch && touchMap[type] ? touchMap[type] : type);
            const snap = Snap(element);
            // console.log("add event", type, realName, snap && snap.id);
            const f = function (e) {
                // console.log(type, e.currentTarget.id);
                const scrollY = getScroll("y", element),
                    scrollX = getScroll("x", element);
                // if (supportsPointer && pointerMap[has](type)){
                //     //todo
                // }
                if (supportsTouch && touchMap[has](type)) {
                    for (let i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; ++i) {
                        if (e.targetTouches[i].target === obj || obj.contains(e.targetTouches[i].target)) {
                            const olde = e;
                            e = e.targetTouches[i];
                            e.originalEvent = olde;
                            e.preventDefault = preventTouch;
                            e.stopPropagation = stopTouch;
                            break;
                        }
                    }
                }
                const x = e.clientX + scrollX,
                    y = e.clientY + scrollY;
                const resutl = fn.call(element, e, x, y);
                // e.preventDefault();
                return resutl;
            };


            if (type !== realName) {
                const f_touch = function (e) {
                    // console.log(type, realName, e.currentTarget.id);
                    const scrollY = getScroll("y", element),
                        scrollX = getScroll("x", element);
                    for (let i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; ++i) {
                        if (e.targetTouches[i].target === obj || obj.contains(e.targetTouches[i].target)) {
                            const olde = e;
                            e = e.targetTouches[i];
                            e.originalEvent = olde;
                            e.preventDefault = preventTouch;
                            e.stopPropagation = stopTouch;
                            break;
                        }
                    }
                    const x = e.clientX + scrollX,
                        y = e.clientY + scrollY;
                    const result = fn.call(element, e, x, y);
                    // e.preventDefault();
                    return result;
                }
                // obj.addEventListener(type, f, false);
                obj.addEventListener(type, f_touch, false);
                // console.log("add touch event", type, realName);
            }

            obj.addEventListener(realName, f, false);

            return function () {
                // console.log("remove event", type, realName, snap && snap.id);

                if (type !== realName) {
                    obj.removeEventListener(type, f, false);
                }

                obj.removeEventListener(realName, f, false);

                return true;
            };
        };
    let drag = [];
    const dragMove = function (e) {
            let x = e.clientX,
                y = e.clientY;
            const scrollY = getScroll("y"),
                scrollX = getScroll("x");
            let dragi,
                j = drag.length;
            while (j--) {
                dragi = drag[j];
                if (supportsTouch) {
                    let i = e.touches && e.touches.length,
                        touch;
                    while (i--) {
                        touch = e.touches[i];
                        if (touch.identifier == dragi.el._drag.id || dragi.el.node.contains(touch.target)) {
                            x = touch.clientX;
                            y = touch.clientY;
                            (e.originalEvent ? e.originalEvent : e).preventDefault();
                            break;
                        }
                    }
                } else {
                    e.preventDefault();
                }
                const node = dragi.el.node;
                // let o;
                // const next = node.nextSibling,
                //     parent = node.parentNode,
                //     display = node.style.display;
                // glob.win.opera && parent.removeChild(node);
                // node.style.display = "none";
                // o = dragi.el.paper.getElementByPoint(x, y);
                // node.style.display = display;
                // glob.win.opera && (next ? parent.insertBefore(node, next) : parent.appendChild(node));
                // o && eve(["snap","drag","over",dragi.el.id], dragi.el, o);
                x += scrollX;
                y += scrollY;
                eve(["snap", "drag", "move", dragi.el.id], dragi.move_scope || dragi.el, x - dragi.el._drag.x, y - dragi.el._drag.y, x, y, e);
                // console.log("drag move", dragi.el.id, x, y);
            }
        },
        dragUp = function (e) {
            Snap.unmousemove(dragMove).unmouseup(dragUp);
            let i = drag.length,
                dragi;
            while (i--) {
                dragi = drag[i];
                dragi.el._drag = {};
                eve(["snap", "drag", "end", dragi.el.id], dragi.end_scope || dragi.start_scope || dragi.move_scope || dragi.el, e);
                eve.off("snap.drag.*." + dragi.el.id);
            }
            drag = [];
        };
    /*\
     * Element.click
     [ method ]
     **
     * Adds a click event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unclick
     [ method ]
     **
     * Removes a click event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.dblclick
     [ method ]
     **
     * Adds a double click event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.undblclick
     [ method ]
     **
     * Removes a double click event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mousedown
     [ method ]
     **
     * Adds a mousedown event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmousedown
     [ method ]
     **
     * Removes a mousedown event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mousemove
     [ method ]
     **
     * Adds a mousemove event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmousemove
     [ method ]
     **
     * Removes a mousemove event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mouseout
     [ method ]
     **
     * Adds a mouseout event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseout
     [ method ]
     **
     * Removes a mouseout event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mouseover
     [ method ]
     **
     * Adds a mouseover event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseover
     [ method ]
     **
     * Removes a mouseover event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.mouseup
     [ method ]
     **
     * Adds a mouseup event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.unmouseup
     [ method ]
     **
     * Removes a mouseup event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchstart
     [ method ]
     **
     * Adds a touchstart event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchstart
     [ method ]
     **
     * Removes a touchstart event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchmove
     [ method ]
     **
     * Adds a touchmove event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchmove
     [ method ]
     **
     * Removes a touchmove event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchend
     [ method ]
     **
     * Adds a touchend event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchend
     [ method ]
     **
     * Removes a touchend event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/

    /*\
     * Element.touchcancel
     [ method ]
     **
     * Adds a touchcancel event handler to the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    /*\
     * Element.untouchcancel
     [ method ]
     **
     * Removes a touchcancel event handler from the element
     - handler (function) handler for the event
     = (object) @Element
    \*/
    for (var i = events.length; i--;) {
        (function (eventName) {
            Snap[eventName] = elproto[eventName] = function (fn, scope, data) {
                if (Snap.is(fn, "function")) {
                    this.events = this.events || [];
                    const remove_event_fun = addEvent(this.node || Snap.document(), eventName, fn, scope || this);
                    this.events.push({
                        name: eventName,
                        f: fn,
                        unbind: remove_event_fun,
                        scope: scope,
                        data: data
                    });
                } else {
                    let i = 0;
                    const ii = this.events.length;
                    for (; i < ii; ++i) if (this.events[i].name == eventName) {
                        try {
                            this.events[i].f.call(this);
                        } catch (e) {
                            eve("global.error", undefined, e, this.events[i].f);
                        }
                    }
                }
                return this;
            };
            Snap["un" + eventName] =
                elproto["un" + eventName] = function (fn) {
                    const events = this.events || [];
                    let l = events.length;
                    while (l--) if (events[l].name == eventName &&
                        (events[l].f == fn || !fn)) {
                        events[l].unbind();
                        events.splice(l, 1);
                        !events.length && delete this.events;
                        return this;
                    }
                    return this;
                };
        })(events[i]);
    }
    /*\
     * Element.hover
     [ method ]
     **
     * Adds hover event handlers to the element
     - f_in (function) handler for hover in
     - f_out (function) handler for hover out
     - icontext (object) #optional context for hover in handler
     - ocontext (object) #optional context for hover out handler
     = (object) @Element
    \*/
    elproto.hover = function (f_in, f_out, scope_in, scope_out) {
        return this.mouseover(f_in, scope_in).mouseout(f_out, scope_out || scope_in);
    };
    /*\
     * Element.unhover
     [ method ]
     **
     * Removes hover event handlers from the element
     - f_in (function) handler for hover in
     - f_out (function) handler for hover out
     = (object) @Element
    \*/
    elproto.unhover = function (f_in, f_out) {
        return this.unmouseover(f_in).unmouseout(f_out);
    };
    const draggable = [];
    // SIERRA unclear what _context_ refers to for starting, ending, moving the drag gesture.
    // SIERRA Element.drag(): _x position of the mouse_: Where are the x/y values offset from?
    // SIERRA Element.drag(): much of this member's doc appears to be duplicated for some reason.
    // SIERRA Unclear about this sentence: _Additionally following drag events will be triggered: drag.start.<id> on start, drag.end.<id> on end and drag.move.<id> on every move._ Is there a global _drag_ object to which you can assign handlers keyed by an element's ID?
    /*\
     * Element.drag
     [ method ]
     **
     * Adds event handlers for an element's drag gesture
     **
     - onmove (function) handler for moving
     - onstart (function) handler for drag start
     - onend (function) handler for drag end
     - mcontext (object) #optional context for moving handler
     - scontext (object) #optional context for drag start handler
     - econtext (object) #optional context for drag end handler
     * Additionaly following `drag` events are triggered: `drag.start.<id>` on start, 
     * `drag.end.<id>` on end and `drag.move.<id>` on every move. When element is dragged over another element 
     * `drag.over.<id>` fires as well.
     *
     * Start event and start handler are called in specified context or in context of the element with following parameters:
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * Move event and move handler are called in specified context or in context of the element with following parameters:
     o dx (number) shift by x from the start point
     o dy (number) shift by y from the start point
     o x (number) x position of the mouse
     o y (number) y position of the mouse
     o event (object) DOM event object
     * End event and end handler are called in specified context or in context of the element with following parameters:
     o event (object) DOM event object
     = (object) @Element
    \*/
    elproto.drag = function (onmove, onstart, onend, move_scope, start_scope, end_scope) {
        const el = this;
        if (!arguments.length) {
            let origTransform;
            return el.drag(function (dx, dy) {
                this.attr({
                    transform: origTransform + (origTransform ? "T" : "t") + [dx, dy]
                });
            }, function () {
                origTransform = this.transform().local;
            });
        }

        function start(e, x, y) {
            // (e.originalEvent || e).preventDefault();

            el._drag.x = x;
            el._drag.y = y;
            el._drag.id = e.identifier;
            !drag.length && Snap.mousemove(dragMove)
                .mouseup(dragUp);
            drag.push({el: el, move_scope: move_scope, start_scope: start_scope, end_scope: end_scope});
            onstart && eve.on("snap.drag.start." + el.id, onstart);
            onmove && eve.on("snap.drag.move." + el.id, onmove);
            onend && eve.on("snap.drag.end." + el.id, onend);
            eve(["snap", "drag", "start", el.id], start_scope || move_scope || el, x, y, e);
        }

       function init(e, x, y) {
            // Prevent execution if more than one button or finger is pressed
            if ((e.touches && e.touches.length > 1) || (e.buttons && e.buttons > 1)) {
                return;
            }
            eve(["drag", "init", el.id], el, e, x, y);
        }

        eve.on(["drag", "init", el.id], start);
        el._drag = {};
        draggable.push({el: el, start: start, init: init});
        el.mousedown(init, undefined, {
            type: "drag",
            params: [onmove, onstart, onend, move_scope, start_scope, end_scope]
        });
        return el;
    };
    /*
     * Element.onDragOver
     [ method ]
     **
     * Shortcut to assign event handler for `drag.over.<id>` event, where `id` is the element's `id` (see @Element.id)
     - f (function) handler for event, first argument would be the element you are dragging over
    \*/
    // elproto.onDragOver = function (f) {
    //     f ? eve.on("snap.drag.over." + this.id, f) : eve.unbind("snap.drag.over." + this.id);
    // };
    /*\
     * Element.undrag
     [ method ]
     **
     * Removes all drag event handlers from the given element
    \*/
    elproto.undrag = function () {
        let i = draggable.length;
        while (i--) if (draggable[i].el == this) {
            this.unmousedown(draggable[i].init);
            draggable.splice(i, 1);
            eve.unbind("drag.*." + this.id);
            eve.unbind("drag.init." + this.id);
        }
        !draggable.length && Snap.unmousemove(dragMove).unmouseup(dragUp);
        return this;
    };

    elproto.removeAllMouseListeners = function () {
        const events = this.events || [];
        let l = events.length;
        while (l--) {
            const event = events[l];
            this["un" + event.name] && this["un" + event.name](event.f)
        }

        this.undrag();
        this.unhover();
    }

    elproto.copyListeners = function (el, preserveScopes, skip_drag) {
        if (!el.events) return this;

        el.events.forEach((ev) => {
            if (ev.data && ev.data.type === "drag") {
                if (!skip_drag) this.drag.apply(this, ev.data.params)
            } else {
                this[ev.name](ev.f, (preserveScopes) ? ev.scope : undefined);
            }
        })
    }
});

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
Snap_ia.plugin(function(Snap, Element, Paper, glob, Fragment, eve) {
  var elproto = Element.prototype,
      pproto = Paper.prototype,
      rgurl = /^\s*url\((.+)\)/,
      Str = String,
      $ = Snap._.$;
  Snap.filter = {};
  /*\
   * Paper.filter
   [ method ]
   **
   * Creates a `<filter>` element
   **
   - filstr (string) SVG fragment of filter provided as a string
   = (object) @Element
   * Note: It is recommended to use filters embedded into the page inside an empty SVG element.
   > Usage
   | var f = paper.filter('<feGaussianBlur stdDeviation="2"/>'),
   |     c = paper.circle(10, 10, 10).attr({
   |         filter: f
   |     });
  \*/
  pproto.filter = function(filstr, local) {
    var paper = this;
    if (paper.type != 'svg') {
      paper = paper.paper;
    }
    var f = Snap.parse(Str(filstr)),
        id = Snap._.id(),
        width = paper.node.offsetWidth,
        height = paper.node.offsetHeight,
        filter = $('filter');
    $(filter, {
      id: id,
      filterUnits: (local) ? 'objectBoundingBox' : 'userSpaceOnUse',
    });
    filter.appendChild(f.node);
    paper.defs.appendChild(filter);
    const element = new Element(filter);
    let deffun = filter.querySelector('[deffun]');
    if (deffun) {
      let type = deffun.getAttribute('deffun');
      if (updates.hasOwnProperty(type)) element.update = updates[type].bind(
          element);
    }
    return element;
  };

  const updates = {};

  eve.on('snap.util.getattr.filter', function() {
    eve.stop();
    var p = $(this.node, 'filter');
    if (p) {
      var match = Str(p).match(rgurl);
      return match && Snap.select(match[1]);
    }
  })(-1);
  eve.on('snap.util.attr.filter', function(value) {
    if (value instanceof Element && value.type == 'filter') {
      eve.stop();
      var id = value.node.id;
      if (!id) {
        $(value.node, {id: value.id});
        id = value.id;
      }
      $(this.node, {
        filter: Snap.url(id),
      });
    }
    if (!value || value == 'none') {
      eve.stop();
      this.node.removeAttribute('filter');
    }
  })(-1);
  /*\
   * Snap.filter.blur
   [ method ]
   **
   * Returns an SVG markup string for the blur filter
   **
   - x (number) amount of horizontal blur, in pixels
   - y (number) #optional amount of vertical blur, in pixels
   = (string) filter representation
   > Usage
   | var f = paper.filter(Snap.filter.blur(5, 10)),
   |     c = paper.circle(10, 10, 10).attr({
   |         filter: f
   |     });
  \*/
  Snap.filter.blur = function(x, y) {
    if (x == null) {
      x = 2;
    }
    var def = y == null ? x : [x, y];
    const filter_str = Snap.format(
        '\<feGaussianBlur deffun="blur" stdDeviation="{def}"/>', {
          def: def,
        });

    return filter_str;
  };
  Snap.filter.blur.toString = function() {
    return this();
  };
  updates.blur = function blur_update(x, y) {
    if (x == null) {
      x = 2;
    }
    var def = y == null ? x : [x, y];
    let feGaussianBlur = this.select('feGaussianBlur');
    feGaussianBlur.node.setAttribute('stdDeviation',
        Snap.format('{def}', {def: def}));
  };
  /*\
   * Snap.filter.shadow
   [ method ]
   **
   * Returns an SVG markup string for the shadow filter
   **
   - dx (number) #optional horizontal shift of the shadow, in pixels
   - dy (number) #optional vertical shift of the shadow, in pixels
   - blur (number) #optional amount of blur
   - color (string) #optional color of the shadow
   - opacity (number) #optional `0..1` opacity of the shadow
   * or
   - dx (number) #optional horizontal shift of the shadow, in pixels
   - dy (number) #optional vertical shift of the shadow, in pixels
   - color (string) #optional color of the shadow
   - opacity (number) #optional `0..1` opacity of the shadow
   * which makes blur default to `4`. Or
   - dx (number) #optional horizontal shift of the shadow, in pixels
   - dy (number) #optional vertical shift of the shadow, in pixels
   - opacity (number) #optional `0..1` opacity of the shadow
   = (string) filter representation
   > Usage
   | var f = paper.filter(Snap.filter.shadow(0, 2, .3)),
   |     c = paper.circle(10, 10, 10).attr({
   |         filter: f
   |     });
  \*/
  Snap.filter.shadow = function(dx, dy, blur, color, opacity) {
    if (opacity == null) {
      if (color == null) {
        opacity = blur;
        blur = 4;
        color = '#000';
      } else {
        opacity = color;
        color = blur;
        blur = 4;
      }
    }
    if (blur == null) {
      blur = 4;
    }
    if (opacity == null) {
      opacity = 1;
    }
    if (dx == null) {
      dx = 0;
      dy = 2;
    }
    if (dy == null) {
      dy = dx;
    }
    color = Snap.color(color);
    return Snap.format(
        '<feGaussianBlur deffun="shadow" in="SourceAlpha" stdDeviation="{blur}"/><feOffset dx="{dx}" dy="{dy}" result="offsetblur"/><feFlood flood-color="{color}"/><feComposite in2="offsetblur" operator="in"/><feComponentTransfer><feFuncA type="linear" slope="{opacity}"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>',
        {
          color: color,
          dx: dx,
          dy: dy,
          blur: blur,
          opacity: opacity,
        });
  };
  Snap.filter.shadow.toString = function() {
    return this();
  };
  /*\
   * Snap.filter.grayscale
   [ method ]
   **
   * Returns an SVG markup string for the grayscale filter
   **
   - amount (number) amount of filter (`0..1`)
   = (string) filter representation
  \*/
  Snap.filter.grayscale = function(amount) {
    if (amount == null) {
      amount = 1;
    }
    return Snap.format(
        '<feColorMatrix deffun="grayscale" type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {b} {h} 0 0 0 0 0 1 0"/>',
        {
          a: 0.2126 + 0.7874 * (1 - amount),
          b: 0.7152 - 0.7152 * (1 - amount),
          c: 0.0722 - 0.0722 * (1 - amount),
          d: 0.2126 - 0.2126 * (1 - amount),
          e: 0.7152 + 0.2848 * (1 - amount),
          f: 0.0722 - 0.0722 * (1 - amount),
          g: 0.2126 - 0.2126 * (1 - amount),
          h: 0.0722 + 0.9278 * (1 - amount),
        });
  };
  Snap.filter.grayscale.toString = function() {
    return this();
  };
  /*\
   * Snap.filter.sepia
   [ method ]
   **
   * Returns an SVG markup string for the sepia filter
   **
   - amount (number) amount of filter (`0..1`)
   = (string) filter representation
  \*/
  Snap.filter.sepia = function(amount) {
    if (amount == null) {
      amount = 1;
    }
    return Snap.format(
        '<feColorMatrix deffun="sepia" type="matrix" values="{a} {b} {c} 0 0 {d} {e} {f} 0 0 {g} {h} {i} 0 0 0 0 0 1 0"/>',
        {
          a: 0.393 + 0.607 * (1 - amount),
          b: 0.769 - 0.769 * (1 - amount),
          c: 0.189 - 0.189 * (1 - amount),
          d: 0.349 - 0.349 * (1 - amount),
          e: 0.686 + 0.314 * (1 - amount),
          f: 0.168 - 0.168 * (1 - amount),
          g: 0.272 - 0.272 * (1 - amount),
          h: 0.534 - 0.534 * (1 - amount),
          i: 0.131 + 0.869 * (1 - amount),
        });
  };
  Snap.filter.sepia.toString = function() {
    return this();
  };
  /*\
   * Snap.filter.saturate
   [ method ]
   **
   * Returns an SVG markup string for the saturate filter
   **
   - amount (number) amount of filter (`0..1`)
   = (string) filter representation
  \*/
  Snap.filter.saturate = function(amount) {
    if (amount == null) {
      amount = 1;
    }
    return Snap.format('<feColorMatrix type="saturate" values="{amount}"/>', {
      amount: 1 - amount,
    });
  };
  Snap.filter.saturate.toString = function() {
    return this();
  };
  /*\
   * Snap.filter.hueRotate
   [ method ]
   **
   * Returns an SVG markup string for the hue-rotate filter
   **
   - angle (number) angle of rotation
   = (string) filter representation
  \*/
  Snap.filter.hueRotate = function(angle) {
    angle = angle || 0;
    return Snap.format(
        '<feColorMatrix deffun="hueRotate" type="hueRotate" values="{angle}"/>',
        {
          angle: angle,
        });
  };
  Snap.filter.hueRotate.toString = function() {
    return this();
  };
  /*\
   * Snap.filter.invert
   [ method ]
   **
   * Returns an SVG markup string for the invert filter
   **
   - amount (number) amount of filter (`0..1`)
   = (string) filter representation
  \*/
  Snap.filter.invert = function(amount) {
    if (amount == null) {
      amount = 1;
    }
//        <feColorMatrix type="matrix" values="-1 0 0 0 1  0 -1 0 0 1  0 0 -1 0 1  0 0 0 1 0" color-interpolation-filters="sRGB"/>
    return Snap.format(
        '<feComponentTransfer deffun="invert"><feFuncR type="table" tableValues="{amount} {amount2}"/><feFuncG type="table" tableValues="{amount} {amount2}"/><feFuncB type="table" tableValues="{amount} {amount2}"/></feComponentTransfer>',
        {
          amount: amount,
          amount2: 1 - amount,
        });
  };
  Snap.filter.invert.toString = function() {
    return this();
  };
  /*\
   * Snap.filter.brightness
   [ method ]
   **
   * Returns an SVG markup string for the brightness filter
   **
   - amount (number) amount of filter (`0..1`)
   = (string) filter representation
  \*/
  Snap.filter.brightness = function(amount) {
    if (amount == null) {
      amount = 1;
    }
    return Snap.format(
        '<feComponentTransfer deffun="brightness"><feFuncR type="linear" slope="{amount}"/><feFuncG type="linear" slope="{amount}"/><feFuncB type="linear" slope="{amount}"/></feComponentTransfer>',
        {
          amount: amount,
        });
  };
  Snap.filter.brightness.toString = function() {
    return this();
  };
  /*\
   * Snap.filter.contrast
   [ method ]
   **
   * Returns an SVG markup string for the contrast filter
   **
   - amount (number) amount of filter (`0..1`)
   = (string) filter representation
  \*/
  Snap.filter.contrast = function(amount) {
    if (amount == null) {
      amount = 1;
    }
    return Snap.format(
        '<feComponentTransfer deffun="contrast"><feFuncR type="linear" slope="{amount}" intercept="{amount2}"/><feFuncG type="linear" slope="{amount}" intercept="{amount2}"/><feFuncB type="linear" slope="{amount}" intercept="{amount2}"/></feComponentTransfer>',
        {
          amount: amount,
          amount2: .5 - amount / 2,
        });
  };
  Snap.filter.contrast.toString = function() {
    return this();
  };
});


Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    var box = Snap.box,
        is = Snap.is,
        firstLetter = /^[^a-z]*([tbmlrc])/i,
        toString = function () {
            return "T" + this.dx + "," + this.dy;
        };
    /*\
     * Element.getAlign
     [ method ]
     **
     * Returns shift needed to align the element relatively to given element.
     * If no elements specified, parent `<svg>` container will be used.
     - el (object) @optional alignment element
     - way (string) one of six values: `"top"`, `"middle"`, `"bottom"`, `"left"`, `"center"`, `"right"`
     = (object|string) Object in format `{dx: , dy: }` also has a string representation as a transformation string
     > Usage
     | el.transform(el.getAlign(el2, "top"));
     * or
     | var dy = el.getAlign(el2, "top").dy;
    \*/
    Element.prototype.getAlign = function (el, way) {
        if (way == null && is(el, "string")) {
            way = el;
            el = null;
        }
        el = el || this.paper;
        var bx = el.getBBox ? el.getBBox() : box(el),
            bb = this.getBBox(),
            out = {};
        way = way && way.match(firstLetter);
        way = way ? way[1].toLowerCase() : "c";
        switch (way) {
            case "t":
                out.dx = 0;
                out.dy = bx.y - bb.y;
            break;
            case "b":
                out.dx = 0;
                out.dy = bx.y2 - bb.y2;
            break;
            case "m":
                out.dx = 0;
                out.dy = bx.cy - bb.cy;
            break;
            case "l":
                out.dx = bx.x - bb.x;
                out.dy = 0;
            break;
            case "r":
                out.dx = bx.x2 - bb.x2;
                out.dy = 0;
            break;
            default:
                out.dx = bx.cx - bb.cx;
                out.dy = 0;
            break;
        }
        out.toString = toString;
        return out;
    };
    /*\
     * Element.align
     [ method ]
     **
     * Aligns the element relatively to given one via transformation.
     * If no elements specified, parent `<svg>` container will be used.
     - el (object) @optional alignment element
     - way (string) one of six values: `"top"`, `"middle"`, `"bottom"`, `"left"`, `"center"`, `"right"`
     = (object) this element
     > Usage
     | el.align(el2, "top");
     * or
     | el.align("middle");
    \*/
    Element.prototype.align = function (el, way) {
        return this.transform("..." + this.getAlign(el, way));
    };
});

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
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    // Colours are from https://www.materialui.co
    var red = "#ffebee#ffcdd2#ef9a9a#e57373#ef5350#f44336#e53935#d32f2f#c62828#b71c1c#ff8a80#ff5252#ff1744#d50000",
        pink = "#FCE4EC#F8BBD0#F48FB1#F06292#EC407A#E91E63#D81B60#C2185B#AD1457#880E4F#FF80AB#FF4081#F50057#C51162",
        purple = "#F3E5F5#E1BEE7#CE93D8#BA68C8#AB47BC#9C27B0#8E24AA#7B1FA2#6A1B9A#4A148C#EA80FC#E040FB#D500F9#AA00FF",
        deeppurple = "#EDE7F6#D1C4E9#B39DDB#9575CD#7E57C2#673AB7#5E35B1#512DA8#4527A0#311B92#B388FF#7C4DFF#651FFF#6200EA",
        indigo = "#E8EAF6#C5CAE9#9FA8DA#7986CB#5C6BC0#3F51B5#3949AB#303F9F#283593#1A237E#8C9EFF#536DFE#3D5AFE#304FFE",
        blue = "#E3F2FD#BBDEFB#90CAF9#64B5F6#64B5F6#2196F3#1E88E5#1976D2#1565C0#0D47A1#82B1FF#448AFF#2979FF#2962FF",
        lightblue = "#E1F5FE#B3E5FC#81D4FA#4FC3F7#29B6F6#03A9F4#039BE5#0288D1#0277BD#01579B#80D8FF#40C4FF#00B0FF#0091EA",
        cyan = "#E0F7FA#B2EBF2#80DEEA#4DD0E1#26C6DA#00BCD4#00ACC1#0097A7#00838F#006064#84FFFF#18FFFF#00E5FF#00B8D4",
        teal = "#E0F2F1#B2DFDB#80CBC4#4DB6AC#26A69A#009688#00897B#00796B#00695C#004D40#A7FFEB#64FFDA#1DE9B6#00BFA5",
        green = "#E8F5E9#C8E6C9#A5D6A7#81C784#66BB6A#4CAF50#43A047#388E3C#2E7D32#1B5E20#B9F6CA#69F0AE#00E676#00C853",
        lightgreen = "#F1F8E9#DCEDC8#C5E1A5#AED581#9CCC65#8BC34A#7CB342#689F38#558B2F#33691E#CCFF90#B2FF59#76FF03#64DD17",
        lime = "#F9FBE7#F0F4C3#E6EE9C#DCE775#D4E157#CDDC39#C0CA33#AFB42B#9E9D24#827717#F4FF81#EEFF41#C6FF00#AEEA00",
        yellow = "#FFFDE7#FFF9C4#FFF59D#FFF176#FFEE58#FFEB3B#FDD835#FBC02D#F9A825#F57F17#FFFF8D#FFFF00#FFEA00#FFD600",
        amber = "#FFF8E1#FFECB3#FFE082#FFD54F#FFCA28#FFC107#FFB300#FFA000#FF8F00#FF6F00#FFE57F#FFD740#FFC400#FFAB00",
        orange = "#FFF3E0#FFE0B2#FFCC80#FFB74D#FFA726#FF9800#FB8C00#F57C00#EF6C00#E65100#FFD180#FFAB40#FF9100#FF6D00",
        deeporange = "#FBE9E7#FFCCBC#FFAB91#FF8A65#FF7043#FF5722#F4511E#E64A19#D84315#BF360C#FF9E80#FF6E40#FF3D00#DD2C00",
        brown = "#EFEBE9#D7CCC8#BCAAA4#A1887F#8D6E63#795548#6D4C41#5D4037#4E342E#3E2723",
        grey = "#FAFAFA#F5F5F5#EEEEEE#E0E0E0#BDBDBD#9E9E9E#757575#616161#424242#212121",
        bluegrey = "#ECEFF1#CFD8DC#B0BEC5#90A4AE#78909C#607D8B#546E7A#455A64#37474F#263238";
    /*\
     * Snap.mui
     [ property ]
     **
     * Contain Material UI colours.
     | Snap().rect(0, 0, 10, 10).attr({fill: Snap.mui.deeppurple, stroke: Snap.mui.amber[600]});
     # For colour reference: <a href="https://www.materialui.co">https://www.materialui.co</a>.
    \*/
    Snap.mui = {};
    /*\
     * Snap.flat
     [ property ]
     **
     * Contain Flat UI colours.
     | Snap().rect(0, 0, 10, 10).attr({fill: Snap.flat.carrot, stroke: Snap.flat.wetasphalt});
     # For colour reference: <a href="https://www.materialui.co">https://www.materialui.co</a>.
    \*/
    Snap.flat = {};
    let levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

    function saveColor(colors) {
        colors = colors.split(/(?=#)/);
        var color = new String(colors[5]);
        color[50] = colors[0];
        color[100] = colors[1];
        color[200] = colors[2];
        color[300] = colors[3];
        color[400] = colors[4];
        color[500] = colors[5];
        color[600] = colors[6];
        color[700] = colors[7];
        color[800] = colors[8];
        color[900] = colors[9];
        if (colors[10]) {
            color.A100 = colors[10];
            color.A200 = colors[11];
            color.A400 = colors[12];
            color.A700 = colors[13];
        }
        return color;
    }

    Snap.mui.red = saveColor(red);
    Snap.mui.pink = saveColor(pink);
    Snap.mui.purple = saveColor(purple);
    Snap.mui.deeppurple = saveColor(deeppurple);
    Snap.mui.indigo = saveColor(indigo);
    Snap.mui.blue = saveColor(blue);
    Snap.mui.lightblue = saveColor(lightblue);
    Snap.mui.cyan = saveColor(cyan);
    Snap.mui.teal = saveColor(teal);
    Snap.mui.green = saveColor(green);
    Snap.mui.lightgreen = saveColor(lightgreen);
    Snap.mui.lime = saveColor(lime);
    Snap.mui.yellow = saveColor(yellow);
    Snap.mui.amber = saveColor(amber);
    Snap.mui.orange = saveColor(orange);
    Snap.mui.deeporange = saveColor(deeporange);
    Snap.mui.brown = saveColor(brown);
    Snap.mui.grey = saveColor(grey);
    Snap.mui.bluegrey = saveColor(bluegrey);
    Snap.flat.turquoise = "#1abc9c";
    Snap.flat.greensea = "#16a085";
    Snap.flat.sunflower = "#f1c40f";
    Snap.flat.orange = "#f39c12";
    Snap.flat.emerland = "#2ecc71";
    Snap.flat.nephritis = "#27ae60";
    Snap.flat.carrot = "#e67e22";
    Snap.flat.pumpkin = "#d35400";
    Snap.flat.peterriver = "#3498db";
    Snap.flat.belizehole = "#2980b9";
    Snap.flat.alizarin = "#e74c3c";
    Snap.flat.pomegranate = "#c0392b";
    Snap.flat.amethyst = "#9b59b6";
    Snap.flat.wisteria = "#8e44ad";
    Snap.flat.clouds = "#ecf0f1";
    Snap.flat.silver = "#bdc3c7";
    Snap.flat.wetasphalt = "#34495e";
    Snap.flat.midnightblue = "#2c3e50";
    Snap.flat.concrete = "#95a5a6";
    Snap.flat.asbestos = "#7f8c8d";
    /*\
     * Snap.importMUIColors
     [ method ]
     **
     * Imports Material UI colours into global object.
     | Snap.importMUIColors();
     | Snap().rect(0, 0, 10, 10).attr({fill: deeppurple, stroke: amber[600]});
     # For colour reference: <a href="https://www.materialui.co">https://www.materialui.co</a>.
    \*/
    Snap.importMUIColors = function () {
        for (var color in Snap.mui) {
            if (Snap.mui.hasOwnProperty(color)) {
                window[color] = Snap.mui[color];
            }
        }
    };

    const flat_names = Object.keys(Snap.flat);
    const mui_names = Object.keys(Snap.mui);
    Snap.getIndexColor = function (i) {
        const num_flats = flat_names.length;
        const num_mui = mui_names.length;

        i = i % (num_flats + num_mui * (levels.length + 1))

        if (i < num_flats) return Snap.flat[flat_names[i]];

        i -= num_flats;


        if (i < num_mui) return Snap.mui[mui_names[i]];

        let level = Math.floor(i / num_mui);
        i = i % num_mui;
        return Snap.mui[mui_names[i]][levels[level]];
    }
});

Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {

    ///////////////// Bezier Library

    /**
     * Bezier curve constructor. The constructor argument can be one of three things:
     *
     * 1. array/4 of {x:..., y:..., z:...}, z optional
     * 2. numerical array/8 ordered x1,y1,x2,y2,x3,y3,x4,y4
     * 3. numerical array/12 ordered x1,y1,z1,x2,y2,z2,x3,y3,z3,x4,y4,z4
     *
     */
    const Bezier = function (coords) {
        this.id = String.rand(4);
        let args = (coords && coords.forEach) ? coords : [].slice.call(arguments);
        let coordlen = false;
        if (typeof args[0] === 'object') {
            coordlen = args.length;
            const newargs = [];
            args.forEach(function (point) {
                if (Array.isArray(point)) {
                    point.forEach((c) => newargs.push(c));
                } else {
                    ['x', 'y', 'z'].forEach(function (d) {
                        if (typeof point[d] !== 'undefined') {
                            newargs.push(point[d]);
                        }
                    });
                }
            });
            args = newargs;
        }
        let higher = false;
        const len = args.length;
        if (coordlen) {
            if (coordlen > 4) {
                if (arguments.length !== 1) {
                    throw new Error(
                        'Only new Bezier(point[]) is accepted for 4th and higher order curves');
                }
                higher = true;
            }
        } else {
            if (len !== 6 && len !== 8 && len !== 9 && len !== 12) {
                if (arguments.length !== 1) {
                    throw new Error(
                        'Only new Bezier(point[]) is accepted for 4th and higher order curves');
                }
            }
        }
        const _3d = (!higher && (len === 9 || len === 12)) ||
            (coords && coords[0] &&
                (typeof coords[0].z !== 'undefined'
                    || (Array.isArray(coords[0]) && coords[0].length === 3)
                )
            );
        this._3d = _3d;
        const points = [];
        let idx = 0;
        const step = (_3d ? 3 : 2);
        for (; idx < len; idx += step) {
            let point;

            point = {
                x: args[idx],
                y: args[idx + 1],
            };
            if (_3d) {
                point.z = args[idx + 2];
            }

            points.push(point);
        }
        this.order = points.length - 1;
        this.points = points;
        const dims = ['x', 'y'];
        if (_3d) dims.push('z');
        this.dims = dims;
        this.dimlen = dims.length;
        (function (curve) {
            const a = utils.align(points, {p1: points[0], p2: points[curve.order]});
            for (let i = 0; i < a.length; ++i) {
                if (abs(a[i].y) > 0.0001) {
                    curve._linear = false;
                    return;
                }
            }
            curve._linear = true;
        }(this));
        this._t1 = 0;
        this._t2 = 1;
        this.update();
    };

    Bezier.fromSVG = function (svgString) {
        let list = svgString.match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g).map(parseFloat);
        const relative = /[cq]/.test(svgString);
        if (!relative) return new Bezier(list);
        list = list.map(function (v, i) {
            return i < 2 ? v : v + list[i % 2];
        });
        return new Bezier(list);
    };

    function getABC(n, S, B, E, t) {
        if (typeof t === 'undefined') {
            t = 0.5;
        }
        const u = utils.projectionratio(t, n),
            um = 1 - u,
            C = {
                x: u * S.x + um * E.x,
                y: u * S.y + um * E.y,
            },
            s = utils.abcratio(t, n),
            A = {
                x: B.x + (B.x - C.x) / s,
                y: B.y + (B.y - C.y) / s,
            };
        return {A: A, B: B, C: C};
    }

    Bezier.quadraticFromPoints = function (p1, p2, p3, t) {
        if (typeof t === 'undefined') {
            t = 0.5;
        }
        // shortcuts, although they're really dumb
        if (t === 0) {
            return new Bezier(p2, p2, p3);
        }
        if (t === 1) {
            return new Bezier(p1, p2, p2);
        }
        // real fitting.
        const abc = getABC(2, p1, p2, p3, t);
        return new Bezier(p1, abc.A, p3);
    };

    Bezier.cubicFromPoints = function (S, B, E, t, d1) {
        if (typeof t === 'undefined') {
            t = 0.5;
        }
        const abc = getABC(3, S, B, E, t);
        if (typeof d1 === 'undefined') {
            d1 = utils.dist(B, abc.C);
        }
        const d2 = d1 * (1 - t) / t;

        const selen = utils.dist(S, E),
            lx = (E.x - S.x) / selen,
            ly = (E.y - S.y) / selen,
            bx1 = d1 * lx,
            by1 = d1 * ly,
            bx2 = d2 * lx,
            by2 = d2 * ly;
        // derivation of new hull coordinates
        const e1 = {x: B.x - bx1, y: B.y - by1},
            e2 = {x: B.x + bx2, y: B.y + by2},
            A = abc.A,
            v1 = {x: A.x + (e1.x - A.x) / (1 - t), y: A.y + (e1.y - A.y) / (1 - t)},
            v2 = {x: A.x + (e2.x - A.x) / (t), y: A.y + (e2.y - A.y) / (t)},
            nc1 = {x: S.x + (v1.x - S.x) / (t), y: S.y + (v1.y - S.y) / (t)},
            nc2 = {
                x: E.x + (v2.x - E.x) / (1 - t),
                y: E.y + (v2.y - E.y) / (1 - t),
            };
        // ...done
        return new Bezier(S, nc1, nc2, E);
    };

    const getUtils = function () {
        return utils;
    };

    Bezier.getUtils = getUtils;

    Bezier.prototype = {
        getUtils: getUtils,
        valueOf: function () {
            return this.toString();
        },
        toString: function (point_sep) {
            return utils.pointsToString(this.points, point_sep);
        },
        clone: function () {
            return new Bezier(this.points.slice());
        },
        toSVG: function (relative) {
            if (this._3d) return false;
            const p = this.points,
                x = p[0].x,
                y = p[0].y,
                s = ['M', x, y, (this.order === 2 ? 'Q' : 'C')];
            let i = 1;
            const last = p.length;
            for (; i < last; ++i) {
                s.push(p[i].x);
                s.push(p[i].y);
            }
            return s.join(' ');
        },

        update: function () {
            // one-time pointAt derivative coordinates
            this.dpoints = [];
            let p = this.points, d = p.length, c = d - 1;
            for (; d > 1; d--, c--) {
                const list = [];
                let j = 0, dpt;
                for (; j < c; j++) {
                    dpt = {
                        x: c * (p[j + 1].x - p[j].x),
                        y: c * (p[j + 1].y - p[j].y),
                    };
                    if (this._3d) {
                        dpt.z = c * (p[j + 1].z - p[j].z);
                    }
                    list.push(dpt);
                }
                this.dpoints.push(list);
                p = list;
            }
            this.computedirection();
        },

        computedirection: function () {
            const points = this.points;
            const angle = utils.angle(points[0], points[this.order], points[1]);
            this.clockwise = angle > 0;
        },

        length: function () {
            if (this.order === 1) {
                let sum = (this.points[0].x - this.points[1].x) ** 2
                    + (this.points[0].y - this.points[1].y) ** 2;

                if (this._3d) sum += (this.points[0].z - this.points[1].z) ** 2;

                return Math.sqrt(sum);
            }

            return utils.length(this.derivative.bind(this));
        },
        _lut: [],
        getLUT: function (steps) {
            steps = steps || 100;
            if (this._lut.length === steps) {
                return this._lut;
            }
            this._lut = [];
            for (let t = 0; t <= steps; t++) {
                this._lut.push(this.compute(t / steps));
            }
            return this._lut;
        },
        on: function (point, error) {
            error = error || 5;
            const lut = this.getLUT(), hits = [];
            let c, t = 0;
            for (let i = 0; i < lut.length; ++i) {
                c = lut[i];
                if (utils.dist(c, point) < error) {
                    hits.push(c);
                    t += i / lut.length;
                }
            }
            if (!hits.length) return false;
            return t /= hits.length;
        },

        project: function (point) {
            // step 1: coarse check
            const LUT = this.getLUT(),
                l = LUT.length - 1,
                closest = utils.closest(LUT, point);
            let mdist = closest.mdist;
            const mpos = closest.mpos;

            if (mpos === 0 || mpos === l) {
                var t = mpos / l, pt = this.compute(t);
                pt.t = t;
                pt.d = mdist;
                return pt;
            }

            // step 2: fine check
            var ft, t, p, d,
                t1 = (mpos - 1) / l,
                t2 = (mpos + 1) / l,
                step = 0.1 / l;
            mdist += 1;
            for (t = t1, ft = t; t < t2 + step; t += step) {
                p = this.compute(t);
                d = utils.dist(point, p);
                if (d < mdist) {
                    mdist = d;
                    ft = t;
                }
            }
            p = this.compute(ft);
            p.t = ft;
            p.d = mdist;
            return p;
        },

        get: function (t) {
            return this.compute(t);
        },
        point: function (idx) {
            return this.points[idx];
        },
        first: function () {
            return this.points[0];
        },
        last: function () {
            return this.points[this.points.length - 1];
        },
        lastTarget: function () {
            return this.points[this.points.length - 2]
        },
        firstTarget: function () {
            return this.points[1]
        },
        compute: function (t) {
            // shortcuts
            if (t === 0) {
                return this.points[0];
            }
            if (t === 1) {
                return this.points[this.order];
            }

            let p = this.points;
            const mt = 1 - t;

            // linear?
            if (this.order === 1) {
                ret = {
                    x: mt * p[0].x + t * p[1].x,
                    y: mt * p[0].y + t * p[1].y,
                };
                if (this._3d) {
                    ret.z = mt * p[0].z + t * p[1].z;
                }
                return ret;
            }

            // quadratic/cubic curve?
            if (this.order < 4) {
                const mt2 = mt * mt,
                    t2 = t * t;
                let a, b, c, d = 0;
                if (this.order === 2) {
                    p = [p[0], p[1], p[2], ZERO];
                    a = mt2;
                    b = mt * t * 2;
                    c = t2;
                } else if (this.order === 3) {
                    a = mt2 * mt;
                    b = mt2 * t * 3;
                    c = mt * t2 * 3;
                    d = t * t2;
                }
                var ret = {
                    x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x,
                    y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y,
                };
                if (this._3d) {
                    ret.z = a * p[0].z + b * p[1].z + c * p[2].z + d * p[3].z;
                }
                return ret;
            }

            // higher order curves: use de Casteljau's computation
            const dCpts = JSON.parse(JSON.stringify(this.points));
            while (dCpts.length > 1) {
                for (let i = 0; i < dCpts.length - 1; ++i) {
                    dCpts[i] = {
                        x: dCpts[i].x + (dCpts[i + 1].x - dCpts[i].x) * t,
                        y: dCpts[i].y + (dCpts[i + 1].y - dCpts[i].y) * t,
                    };
                    if (typeof dCpts[i].z !== 'undefined') {
                        dCpts[i] = dCpts[i].z + (dCpts[i + 1].z - dCpts[i].z) * t;
                    }
                }
                dCpts.splice(dCpts.length - 1, 1);
            }
            return dCpts[0];
        },
        tAtLength: function (length, precision, tot_length) {
            precision = precision || 1;
            tot_length = tot_length || this.length();

            //Linear case
            if (this.order === 1) {
                return length / tot_length;
            }

            let t = .5;
            let lev = 2;
            let more = 100;
            while (more--) {
                let spl = this.split(t);
                let l = spl.left.length();
                if (utils.approximately(l, length, precision)) {
                    return t;
                }
                if (l < length) {
                    t += 1 / 2 ** lev;
                } else {
                    t -= 1 / 2 ** lev;
                }
                ++lev;
            }
            return t;
        },
        getPointAtLength(length, precision) {
            let t = this.tAtLength(length, precision);
            let p = this.compute(t);
            let der = this.derivative(t);
            p.alpha = 180 + 90 - Math.atan2(der.x, der.y) * 180 / Math.PI;
            return p;
        },
        raise: function () {
            var p = this.points, np = [p[0]], i, k = p.length, pi, pim;
            for (var i = 1; i < k; ++i) {
                pi = p[i];
                pim = p[i - 1];
                np[i] = {
                    x: (k - i) / k * pi.x + i / k * pim.x,
                    y: (k - i) / k * pi.y + i / k * pim.y,
                };
            }
            np[k] = p[k - 1];
            return new Bezier(np);
        },
        derivative: function (t) {
            const mt = 1 - t;
            let a, b, c = 0,
                p = this.dpoints[0];
            if (this.order === 1) {
                p = [p[0], ZERO, ZERO];
                a = 1;
            }
            if (this.order === 2) {
                p = [p[0], p[1], ZERO];
                a = mt;
                b = t;
            }
            if (this.order === 3) {
                a = mt * mt;
                b = mt * t * 2;
                c = t * t;
            }
            const ret = {
                x: a * p[0].x + b * p[1].x + c * p[2].x,
                y: a * p[0].y + b * p[1].y + c * p[2].y,
            };
            if (this._3d) {
                ret.z = a * p[0].z + b * p[1].z + c * p[2].z;
            }
            return ret;
        },
        inflections: function () {
            return utils.inflections(this.points);
        },
        normal: function (t) {
            return this._3d ? this.__normal3(t) : this.__normal2(t);
        },
        __normal2: function (t) {
            const d = this.derivative(t);
            const q = sqrt(d.x * d.x + d.y * d.y);
            return {x: -d.y / q, y: d.x / q};
        },
        __normal3: function () {
            // see http://stackoverflow.com/questions/25453159
            const r1 = this.derivative(t),
                r2 = this.derivative(t + 0.01),
                q1 = sqrt(r1.x * r1.x + r1.y * r1.y + r1.z * r1.z),
                q2 = sqrt(r2.x * r2.x + r2.y * r2.y + r2.z * r2.z);
            r1.x /= q1;
            r1.y /= q1;
            r1.z /= q1;
            r2.x /= q2;
            r2.y /= q2;
            r2.z /= q2;
            // cross product
            const c = {
                x: r2.y * r1.z - r2.z * r1.y,
                y: r2.z * r1.x - r2.x * r1.z,
                z: r2.x * r1.y - r2.y * r1.x,
            };
            const m = sqrt(c.x * c.x + c.y * c.y + c.z * c.z);
            c.x /= m;
            c.y /= m;
            c.z /= m;
            // rotation matrix
            const R = [
                c.x * c.x, c.x * c.y - c.z, c.x * c.z + c.y,
                c.x * c.y + c.z, c.y * c.y, c.y * c.z - c.x,
                c.x * c.z - c.y, c.y * c.z + c.x, c.z * c.z];
            // normal vector:
            const n = {
                x: R[0] * r1.x + R[1] * r1.y + R[2] * r1.z,
                y: R[3] * r1.x + R[4] * r1.y + R[5] * r1.z,
                z: R[6] * r1.x + R[7] * r1.y + R[8] * r1.z,
            };
            return n;
        },
        hull: function (t) {
            let p = this.points,
                _p = [],
                pt;
            const q = [];
            let idx = 0,
                i = 0,
                l = 0;
            q[idx++] = p[0];
            q[idx++] = p[1];
            q[idx++] = p[2];
            if (this.order === 3) {
                q[idx++] = p[3];
            }
            // we lerp between all points at each iteration, until we have 1 point left.
            while (p.length > 1) {
                _p = [];
                for (i = 0, l = p.length - 1; i < l; ++i) {
                    pt = utils.lerp(t, p[i], p[i + 1]);
                    q[idx++] = pt;
                    _p.push(pt);
                }
                p = _p;
            }
            return q;
        },
        split: function (t1, t2) {
            // shortcuts
            if (t1 === 0 && !!t2) {
                return this.split(t2).left;
            }
            if (t2 === 1) {
                return this.split(t1).right;
            }

            if (this.order === 0) {
                const p1 = this.points[0],
                    p2 = this.points[2];
                const at_t1 = {
                    x: p1.x + t1 * (p2.x - p1.x),
                    y: p1.y + t1 * (p2.y - p1.y),
                };
                if (this._3d) at_t1.z = p1.z + t1 * (p2.z - p1.z);
                const result = {
                    left: new Bezier([p1, at_t1]),
                    right: new Bezier([at_t1, p2]),
                };

            }
            if (this.order > 1) {
                const q = this.hull(t1);
                var result = {
                    left: this.order === 2 ?
                        new Bezier([q[0], q[3], q[5]]) :
                        new Bezier([q[0], q[4], q[7], q[9]]),
                    right: this.order === 2 ?
                        new Bezier([q[5], q[4], q[2]]) :
                        new Bezier([q[9], q[8], q[6], q[3]]),
                    // span: q,
                };
            }
            // make sure we bind _t1/_t2 information!
            result.left._t1 = utils.map(0, 0, 1, this._t1, this._t2);
            result.left._t2 = utils.map(t1, 0, 1, this._t1, this._t2);
            result.right._t1 = utils.map(t1, 0, 1, this._t1, this._t2);
            result.right._t2 = utils.map(1, 0, 1, this._t1, this._t2);

            // no shortcut: use "de Casteljau" iteration.

            // if we have no t2, we're done
            if (!t2) {
                return result;
            }

            // if we have a t2, split again:
            t2 = utils.map(t2, t1, 1, 0, 1);
            const subsplit = result.right.split(t2);
            return subsplit.left;
        },

        extrema: function () {
            const dims = this.dims,
                result = {};
            let roots = [],
                p, mfn;
            dims.forEach(function (dim) {

                mfn = function (v) {
                    return v[dim];
                };

                p = this.dpoints[0].map(mfn);

                result[dim] = utils.droots(p);
                if (this.order === 3) {
                    p = this.dpoints[1].map(mfn);
                    result[dim] = result[dim].concat(utils.droots(p));
                }
                result[dim] = result[dim].filter(function (t) {
                    return (t >= 0 && t <= 1);
                });
                roots = roots.concat(result[dim].sort());
            }.bind(this));
            roots.sort();
            result.values = roots;
            return result;
        },

        bbox: function () {
            const extrema = this.extrema(), result = {};
            this.dims.forEach(function (d) {
                result[d] = utils.getminmax(this, d, extrema[d]);
            }.bind(this));
            return result;
        },

        overlaps: function (curve) {
            const lbbox = this.bbox(),
                tbbox = curve.bbox();
            return utils.bboxoverlap(lbbox, tbbox);
        },

        offset: function (t, d) {
            if (typeof d !== 'undefined') {
                const c = this.get(t);
                const n = this.normal(t);
                const ret = {
                    c: c,
                    n: n,
                    x: c.x + n.x * d,
                    y: c.y + n.y * d,
                };
                if (this._3d) {
                    ret.z = c.z + n.z * d;
                }
                ;
                return ret;
            }

            if (this._linear) {
                const nv = this.normal(0);
                const coords = this.points.map(function (p) {
                    const ret = {
                        x: p.x + t * nv.x,
                        y: p.y + t * nv.y,
                    };
                    if (p.z && n.z) {
                        ret.z = p.z + t * nv.z;
                    }
                    return ret;
                });
                return [new Bezier(coords)];
            }
            const reduced = this.reduce();
            return reduced.map(function (s) {
                return s.scale(t);
            });
        },

        simple: function () {
            if (this.order === 3) {
                const a1 = utils.angle(this.points[0], this.points[3], this.points[1]);
                const a2 = utils.angle(this.points[0], this.points[3], this.points[2]);
                if (a1 > 0 && a2 < 0 || a1 < 0 && a2 > 0) return false;
            }
            const n1 = this.normal(0);
            const n2 = this.normal(1);
            let s = n1.x * n2.x + n1.y * n2.y;
            if (this._3d) {
                s += n1.z * n2.z;
            }
            const angle = abs(acos(s));
            return angle < pi / 3;
        },

        reduce: function () {
            let i, t1 = 0, t2 = 0;
            const step = 0.01;
            let segment;
            const pass1 = [], pass2 = [];
            // first pass: split on extrema
            let extrema = this.extrema().values;
            if (extrema.indexOf(0) === -1) {
                extrema = [0].coancat(extrema);
            }
            if (extrema.indexOf(1) === -1) {
                extrema.push(1);
            }

            for (t1 = extrema[0], i = 1; i < extrema.length; ++i) {
                t2 = extrema[i];
                segment = this.split(t1, t2);
                segment._t1 = t1;
                segment._t2 = t2;
                pass1.push(segment);
                t1 = t2;
            }

            // second pass: further reduce these segments to simple segments
            pass1.forEach(function (p1) {
                t1 = 0;
                t2 = 0;
                while (t2 <= 1) {
                    for (t2 = t1 + step; t2 <= 1 + step; t2 += step) {
                        segment = p1.split(t1, t2);
                        if (!segment.simple()) {
                            t2 -= step;
                            if (abs(t1 - t2) < step) {
                                // we can never form a reduction
                                return [];
                            }
                            segment = p1.split(t1, t2);
                            segment._t1 = utils.map(t1, 0, 1, p1._t1, p1._t2);
                            segment._t2 = utils.map(t2, 0, 1, p1._t1, p1._t2);
                            pass2.push(segment);
                            t1 = t2;
                            break;
                        }
                    }
                } //end while

                if (t1 < 1) {
                    segment = p1.split(t1, 1);
                    segment._t1 = utils.map(t1, 0, 1, p1._t1, p1._t2);
                    segment._t2 = p1._t2;
                    pass2.push(segment);
                }
            });
            return pass2;
        },

        reverse: function () {
            this.points.reverse();
            this.update();
            if (this._lut && this._lut.length > 0) this._lut = this._lut.reverse();
        },

        scale: function (d) {
            const order = this.order;
            let distanceFn = false;
            if (typeof d === 'function') {
                distanceFn = d;
            }
            if (distanceFn && order === 2) {
                return this.raise().scale(distanceFn);
            }

            // TODO: add special handling for degenerate (=linear) curves.
            const clockwise = this.clockwise;
            const r1 = distanceFn ? distanceFn(0) : d;
            const r2 = distanceFn ? distanceFn(1) : d;
            const v = [this.offset(0, 10), this.offset(1, 10)];
            const o = utils.lli4(v[0], v[0].c, v[1], v[1].c);
            if (!o) {
                throw new Error('cannot scale this curve. Try reducing it first.');
            }
            // move all points by distance 'd' wrt the origin 'o'
            const points = this.points, np = [];

            // move end points by fixed distance along normal.
            [0, 1].forEach(function (t) {
                const p = np[t * order] = utils.copy(points[t * order]);
                p.x += (t ? r2 : r1) * v[t].n.x;
                p.y += (t ? r2 : r1) * v[t].n.y;
            }.bind(this));

            if (!distanceFn) {
                // move control points to lie on the intersection of the offset
                // derivative vector, and the origin-through-control vector
                [0, 1].forEach(function (t) {
                    if (this.order === 2 && !!t) return;
                    const p = np[t * order];
                    const d = this.derivative(t);
                    const p2 = {x: p.x + d.x, y: p.y + d.y};
                    np[t + 1] = utils.lli4(p, p2, o, points[t + 1]);
                }.bind(this));
                return new Bezier(np);
            }

            // move control points by "however much necessary to
            // ensure the correct tangent to endpoint".
            [0, 1].forEach(function (t) {
                if (this.order === 2 && !!t) return;
                const p = points[t + 1];
                const ov = {
                    x: p.x - o.x,
                    y: p.y - o.y,
                };
                let rc = distanceFn ? distanceFn((t + 1) / order) : d;
                if (distanceFn && !clockwise) rc = -rc;
                const m = sqrt(ov.x * ov.x + ov.y * ov.y);
                ov.x /= m;
                ov.y /= m;
                np[t + 1] = {
                    x: p.x + rc * ov.x,
                    y: p.y + rc * ov.y,
                };
            }.bind(this));
            return new Bezier(np);
        },

        outline: function (d1, d2, d3, d4) {
            d2 = (typeof d2 === 'undefined') ? d1 : d2;
            const reduced = this.reduce(),
                len = reduced.length,
                fcurves = [];
            let bcurves = [],
                p,
                alen = 0;
            const tlen = this.length();

            const graduated = (typeof d3 !== 'undefined' && typeof d4 !== 'undefined');

            function linearDistanceFunction(s, e, tlen, alen, slen) {
                return function (v) {
                    const f1 = alen / tlen, f2 = (alen + slen) / tlen, d = e - s;
                    return utils.map(v, 0, 1, s + f1 * d, s + f2 * d);
                };
            };

            // form curve oulines
            reduced.forEach(function (segment) {
                slen = segment.length();
                if (graduated) {
                    fcurves.push(
                        segment.scale(linearDistanceFunction(d1, d3, tlen, alen, slen)));
                    bcurves.push(segment.scale(
                        linearDistanceFunction(-d2, -d4, tlen, alen, slen)));
                } else {
                    fcurves.push(segment.scale(d1));
                    bcurves.push(segment.scale(-d2));
                }
                alen += slen;
            });

            // reverse the "return" outline
            bcurves = bcurves.map(function (s) {
                p = s.points;
                if (p[3]) {
                    s.points = [p[3], p[2], p[1], p[0]];
                } else {
                    s.points = [p[2], p[1], p[0]];
                }
                return s;
            }).reverse();

            // form the endcaps as lines
            var fs = fcurves[0].points[0],
                fe = fcurves[len - 1].points[fcurves[len - 1].points.length - 1],
                bs = bcurves[len - 1].points[bcurves[len - 1].points.length - 1],
                be = bcurves[0].points[0],
                ls = utils.makeline(bs, fs),
                le = utils.makeline(fe, be),
                segments = [ls].concat(fcurves).concat([le]).concat(bcurves),
                slen = segments.length;

            return new PolyBezier(segments);
        },
        outlineshapes: function (d1, d2) {
            d2 = d2 || d1;
            const outline = this.outline(d1, d2).curves;
            const shapes = [];
            let i = 1;
            const len = outline.length;
            for (; i < len / 2; ++i) {
                const shape = utils.makeshape(outline[i], outline[len - i]);
                shape.startcap.virtual = (i > 1);
                shape.endcap.virtual = (i < len / 2 - 1);
                shapes.push(shape);
            }
            return shapes;
        },

        intersects: function (curve) {
            if (!curve) return this.selfintersects();
            if (curve.points.length === 2) {
                return this.lineIntersects(curve);
            }
            if (curve instanceof Bezier) {
                curve = curve.reduce();
            }
            return this.curveintersects(this.reduce(), curve);
        },

        lineIntersects: function (line) {

            if (Array.isArray(line)) line = {p1: line[0], p2: line[1]};

            const p1 = line.p1 || line.points[0];
            const p2 = line.p2 || line.points[1];
            const mx = Math.min(p1.x, p2.x),
                my = Math.min(p1.y, p2.y),
                MX = Math.max(p1.x, p2.x),
                MY = Math.max(p1.y, p2.y),
                self = this;

            return utils.roots(this.points, line).filter(function (t) {
                const p = self.get(t);
                return utils.between(p.x, mx, MX) && utils.between(p.y, my, MY);
            });
        },

        selfintersects: function () {
            const reduced = this.reduce();
            // "simple" curves cannot intersect with their direct
            // neighbour, so for each segment X we check whether
            // it intersects [0:x-2][x+2:last].
            let i;
            const len = reduced.length - 2;
            let results = [], result, left, right;
            for (i = 0; i < len; ++i) {
                left = reduced.slice(i, i + 1);
                right = reduced.slice(i + 2);
                result = this.curveintersects(left, right);
                results = results.concat(result);
            }
            return results;
        },

        curveintersects: function (c1, c2) {
            const pairs = [];
            // step 1: pair off any overlapping segments
            c1.forEach(function (l) {
                c2.forEach(function (r) {
                    if (l.overlaps(r)) {
                        pairs.push({left: l, right: r});
                    }
                });
            });
            // step 2: for each pairing, run through the convergence algorithm.
            let intersections = [];
            pairs.forEach(function (pair) {
                const result = utils.pairiteration(pair.left, pair.right);
                if (result.length > 0) {
                    intersections = intersections.concat(result);
                }
            });
            return intersections;
        },

        arcs: function (errorThreshold) {
            errorThreshold = errorThreshold || 0.5;
            const circles = [];
            return this._iterate(errorThreshold, circles);
        },
        _error: function (pc, np1, s, e) {
            const q = (e - s) / 4,
                c1 = this.get(s + q),
                c2 = this.get(e - q),
                ref = utils.dist(pc, np1),
                d1 = utils.dist(pc, c1),
                d2 = utils.dist(pc, c2);
            return abs(d1 - ref) + abs(d2 - ref);
        },
        _iterate: function (errorThreshold, circles) {
            let s = 0, e = 1, safety;
            // we do a binary search to find the "good `t` closest to no-longer-good"
            do {
                safety = 0;

                // step 1: start with the maximum possible arc
                e = 1;

                // points:
                const np1 = this.get(s);
                let np2, np3, arc, prev_arc;

                // booleans:
                let curr_good = false, prev_good = false, done;

                // numbers:
                let m = e, prev_e = 1, step = 0;

                // step 2: find the best possible arc
                do {
                    prev_good = curr_good;
                    prev_arc = arc;
                    m = (s + e) / 2;
                    step++;

                    np2 = this.get(m);
                    np3 = this.get(e);

                    arc = utils.getccenter(np1, np2, np3);
                    const error = this._error(arc, np1, s, e);
                    curr_good = (error <= errorThreshold);

                    done = prev_good && !curr_good;
                    if (!done) prev_e = e;

                    // this arc is fine: we can move 'e' up to see if we can find a wider arc
                    if (curr_good) {
                        // if e is already at max, then we're done for this arc.
                        if (e >= 1) {
                            prev_e = 1;
                            prev_arc = arc;
                            break;
                        }
                        // if not, move it up by half the iteration distance
                        e = e + (e - s) / 2;
                    }

                    // this is a bad arc: we need to move 'e' down to find a good arc
                    else {
                        e = m;
                    }
                }
                while (!done && safety++ < 100);

                if (safety >= 100) {
                    console.error('arc abstraction somehow failed...');
                    break;
                }

                // console.log("[F] arc found", s, prev_e, prev_arc.x, prev_arc.y, prev_arc.s, prev_arc.e);

                prev_arc = (prev_arc ? prev_arc : arc);
                circles.push(prev_arc);
                s = prev_e;
            }
            while (e < 1);
            return circles;
        },
    };

    /**
     * Poly Bezier
     * @param {[type]} curves [description]
     */
    var PolyBezier = function (curves) {
        this.curves = [];
        this._3d = false;
        if (!!curves) {
            this.curves = curves.map((bz) => {
                if (Snap.is(bz, "bezier")) {
                    return bz;
                } else {
                    return new Bezier(bz);
                }
            });
            this._3d = this.curves[0]._3d;
        }
    };

    PolyBezier.prototype = {
        valueOf: function () {
            return this.toString();
        },
        toString: function () {
            const res = this.curves.map((c) => c.toString());
            return res.join(' ');
        },
        clone: function () {
            return new PolyBezier(this.curves.map((bz) => bz.clone()));
        },
        toSVG: function () {
            const deg_to_command = [undefined, 'L', 'Q', 'C'];
            let res = '';
            let prev, c, last_p, points;
            for (let i = 0, l = this.curves.length; i < l; ++i) {
                c = this.curves[i];
                points = c.points;
                if (prev) {
                    last_p = prev[prev.length - 1];
                    let prefix = ' ';
                    const same_degree = points.length === prev.length;
                    if (!c.start && utils.approximately(last_p.x, points[0].x)
                        && utils.approximately(last_p.y, points[0].y)) {
                        prefix = ((same_degree) ?
                            ' '
                            :
                            ' ' + deg_to_command[points.length - 1] + points[0].x + ',' +
                            points[0].y);
                    } else {
                        !c.start && console.log(i, prev, points);
                        // prev();
                        prefix = '     M' + points[0].x + ',' + points[0].y;
                    }
                    res += ' ' + prefix + ' ' +
                        utils.pointsToString(points.slice(1), ', ', ' ', true);
                } else {
                    res += ' M' + points[0].x + ',' + points[0].y;
                    res += ' ' + deg_to_command[points.length - 1]
                        + utils.pointsToString(points.slice(1), ', ', ' ', true);

                }
                prev = points;
            }
            return res;
        },
        getPoints: function () {
            return this.curves.map((bz) => bz.points);
        },
        getFirstPoint: function () {
            return this.curves[0].points[0];
        },
        getLastPoint: function () {
            let c = this.curves[this.curves.length - 1];
            return c.points[c.order];
        },
        addCurve: function (curve) {
            this.curves.push(curve);
            this._3d = this._3d || curve._3d;
        },
        length: function () {
            return this.curves.map(function (v) {
                return v.length();
            }).reduce(function (a, b) {
                return a + b;
            });
        },
        getPointAtLength(length, precision) {
            let inc = 0;
            this.lengths = this.lengths || this.curves.map((c) => {
                inc += c.length();
                return inc;
            });
            const i = this.lengths.findIndex((l) => length <= l + 1e-10);
            if (i === -1) {
                return null;
            }

            length = (i) ? length - this.lengths[i - 1] : length;
            length = Math.max(0, length);
            return this.curves[i].getPointAtLength(length, precision);
        },
        curve: function (idx) {
            return this.curves[idx];
        },
        bbox: function () {
            const c = this.curves;
            const bbox = c[0].bbox();
            for (let i = 1; i < c.length; ++i) {
                utils.expandbox(bbox, c[i].bbox());
            }
            return bbox;
        },
        offset: function (d) {
            let offset = [];
            this.curves.forEach(function (v) {
                offset = offset.concat(v.offset(d));
            });
            return new PolyBezier(offset);
        },
        lineIntersects: function (line) {
            let intersections = [];
            this.curves.forEach(function (c, i) {
                const items = c.lineIntersects(line);
                if (items && items.length) {
                    intersections = intersections.concat(items.map((t_val) => {
                        return {curve: c, t: t_val, i: i};
                    }));
                }

            });
            return intersections;
        },
        intersect: function (curve) {
            let intersections = [];
            this.curves.forEach(function (c, i) {
                const items = c.intersect(curve);
                intersections = intersections.concat(items.map((t_val) => {
                    return {curve: c, t: t_val, i: i};
                }));
            });

            return intersections;
        },
        reverse: function () {
            let p1 = this.curves[0].first();
            this.curves.reverse();
            // console.log(this.getPoints());
            this.curves.forEach((bz) => bz.reverse());
            // console.log(this.getPoints());
            let p2 = this.curves[this.curves.length - 1].last();
            if (p2 !== p2) {
                console.log('Wrong', p1, p2);
            }
        },
        toPolyBezier: function () {
            return this;
        },
        toBeziers: function () {
            return this.curves;
        },
    };

    PolyBezier.prototype.getBBox = PolyBezier.bbox;
    PolyBezier.prototype.getControlPoints = PolyBezier.prototype.getPoints;

    //UTILITY Functions

    // math-inlining.
    var abs = Math.abs,
        cos = Math.cos,
        sin = Math.sin,
        acos = Math.acos,
        atan2 = Math.atan2,
        sqrt = Math.sqrt,
        pow = Math.pow,
        // cube root function yielding real bezier_roots
        crt = function (v) {
            return (v < 0) ? -pow(-v, 1 / 3) : pow(v, 1 / 3);
        },
        // trig constants
        pi = Math.PI,
        tau = 2 * pi,
        quart = pi / 2,
        // float precision significant decimal
        epsilon = 0.00001;

    // a zero coordinate, which is surprisingly useful
    var ZERO = {x: 0, y: 0, z: 0};

    // Bezier utility functions
    var utils = {
        // Legendre-Gauss abscissae with n=24 (x_i values, defined at i=n as the bezier_roots of the nth order Legendre polynomial Pn(x))
        Tvalues: [
            -0.0640568928626056260850430826247450385909,
            0.0640568928626056260850430826247450385909,
            -0.1911188674736163091586398207570696318404,
            0.1911188674736163091586398207570696318404,
            -0.3150426796961633743867932913198102407864,
            0.3150426796961633743867932913198102407864,
            -0.4337935076260451384870842319133497124524,
            0.4337935076260451384870842319133497124524,
            -0.5454214713888395356583756172183723700107,
            0.5454214713888395356583756172183723700107,
            -0.6480936519369755692524957869107476266696,
            0.6480936519369755692524957869107476266696,
            -0.7401241915785543642438281030999784255232,
            0.7401241915785543642438281030999784255232,
            -0.8200019859739029219539498726697452080761,
            0.8200019859739029219539498726697452080761,
            -0.8864155270044010342131543419821967550873,
            0.8864155270044010342131543419821967550873,
            -0.9382745520027327585236490017087214496548,
            0.9382745520027327585236490017087214496548,
            -0.9747285559713094981983919930081690617411,
            0.9747285559713094981983919930081690617411,
            -0.9951872199970213601799974097007368118745,
            0.9951872199970213601799974097007368118745,
        ],

        // Legendre-Gauss weights with n=24 (w_i values, defined by a function linked to in the Bezier primer article)
        Cvalues: [
            0.1279381953467521569740561652246953718517,
            0.1279381953467521569740561652246953718517,
            0.1258374563468282961213753825111836887264,
            0.1258374563468282961213753825111836887264,
            0.1216704729278033912044631534762624256070,
            0.1216704729278033912044631534762624256070,
            0.1155056680537256013533444839067835598622,
            0.1155056680537256013533444839067835598622,
            0.1074442701159656347825773424466062227946,
            0.1074442701159656347825773424466062227946,
            0.0976186521041138882698806644642471544279,
            0.0976186521041138882698806644642471544279,
            0.0861901615319532759171852029837426671850,
            0.0861901615319532759171852029837426671850,
            0.0733464814110803057340336152531165181193,
            0.0733464814110803057340336152531165181193,
            0.0592985849154367807463677585001085845412,
            0.0592985849154367807463677585001085845412,
            0.0442774388174198061686027482113382288593,
            0.0442774388174198061686027482113382288593,
            0.0285313886289336631813078159518782864491,
            0.0285313886289336631813078159518782864491,
            0.0123412297999871995468056670700372915759,
            0.0123412297999871995468056670700372915759,
        ],

        arcfn: function (t, derivativeFn) {
            const d = derivativeFn(t);
            let l = d.x * d.x + d.y * d.y;
            if (typeof d.z !== 'undefined') {
                l += d.z * d.z;
            }
            return sqrt(l);
        },

        between: function (v, m, M) {
            return (m <= v && v <= M) || utils.approximately(v, m) ||
                utils.approximately(v, M);
        },

        approximately: function (a, b, precision) {
            return abs(a - b) <= (precision || epsilon);
        },

        length: function (derivativeFn) {
            const z = 0.5;
            let sum = 0;
            const len = utils.Tvalues.length;
            let i, t;
            for (i = 0; i < len; ++i) {
                t = z * utils.Tvalues[i] + z;
                sum += utils.Cvalues[i] * utils.arcfn(t, derivativeFn);
            }
            return z * sum;
        },

        map: function (v, ds, de, ts, te) {
            const d1 = de - ds, d2 = te - ts, v2 = v - ds, r = v2 / d1;
            return ts + d2 * r;
        },

        lerp: function (r, v1, v2) {
            const ret = {
                x: v1.x + r * (v2.x - v1.x),
                y: v1.y + r * (v2.y - v1.y),
            };
            if (!!v1.z && !!v2.z) {
                ret.z = v1.z + r * (v2.z - v1.z);
            }
            return ret;
        },

        pointToString: function (sep, p) {
            let s = p.x + sep + p.y;
            if (typeof p.z !== 'undefined') {
                s += sep + p.z;
            }
            return s;
        },

        pointsToString: function (points, point_coord_sep, points_sep, skip_parent) {
            let f = utils.pointToString.bind(undefined, (point_coord_sep || ' '));
            points_sep = points_sep || ', ';
            const join = points.map(f).join(points_sep);
            return ((skip_parent) ? '' : '[') + join + ((skip_parent) ? '' : ']');
        },

        copy: function (obj) {
            return JSON.parse(JSON.stringify(obj));
        },

        angle: function (o, v1, v2) {
            let dx1 = v1.x - o.x,
                dy1 = v1.y - o.y,
                dx2 = v2.x - o.x,
                dy2 = v2.y - o.y;
            const cross = dx1 * dy2 - dy1 * dx2,
                m1 = sqrt(dx1 * dx1 + dy1 * dy1),
                m2 = sqrt(dx2 * dx2 + dy2 * dy2);
            let dot;
            dx1 /= m1;
            dy1 /= m1;
            dx2 /= m2;
            dy2 /= m2;
            dot = dx1 * dx2 + dy1 * dy2;
            return atan2(cross, dot);
        },

        // round as string, to avoid rounding errors
        round: function (v, d) {
            const s = '' + v;
            const pos = s.indexOf('.');
            return parseFloat(s.substring(0, pos + 1 + d));
        },

        dist: function (p1, p2) {
            const dx = p1.x - p2.x,
                dy = p1.y - p2.y;
            return sqrt(dx * dx + dy * dy);
        },

        closest: function (LUT, point) {
            let mdist = pow(2, 63), mpos, d;
            LUT.forEach(function (p, idx) {
                d = utils.dist(point, p);
                if (d < mdist) {
                    mdist = d;
                    mpos = idx;
                }
            });
            return {mdist: mdist, mpos: mpos};
        },

        abcratio: function (t, n) {
            // see ratio(t) note on http://pomax.github.io/bezierinfo/#abc
            if (n !== 2 && n !== 3) {
                return false;
            }
            if (typeof t === 'undefined') {
                t = 0.5;
            } else if (t === 0 || t === 1) {
                return t;
            }
            const bottom = pow(t, n) + pow(1 - t, n), top = bottom - 1;
            return abs(top / bottom);
        },

        projectionratio: function (t, n) {
            // see u(t) note on http://pomax.github.io/bezierinfo/#abc
            if (n !== 2 && n !== 3) {
                return false;
            }
            if (typeof t === 'undefined') {
                t = 0.5;
            } else if (t === 0 || t === 1) {
                return t;
            }
            const top = pow(1 - t, n), bottom = pow(t, n) + top;
            return top / bottom;
        },

        lli8: function (x1, y1, x2, y2, x3, y3, x4, y4) {
            const nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) *
                    (x3 * y4 - y3 * x4),
                ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) *
                    (x3 * y4 - y3 * x4),
                d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (d == 0) {
                return false;
            }
            return {x: nx / d, y: ny / d};
        },

        lli4: function (p1, p2, p3, p4) {
            const x1 = p1.x, y1 = p1.y,
                x2 = p2.x, y2 = p2.y,
                x3 = p3.x, y3 = p3.y,
                x4 = p4.x, y4 = p4.y;
            return utils.lli8(x1, y1, x2, y2, x3, y3, x4, y4);
        },

        lli: function (v1, v2) {
            return utils.lli4(v1, v1.c, v2, v2.c);
        },

        makeline: function (p1, p2) {

            const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y, dx = (x2 - x1) / 3,
                dy = (y2 - y1) / 3;
            return new Bezier(x1, y1, x1 + dx, y1 + dy, x1 + 2 * dx, y1 + 2 * dy, x2,
                y2);
        },

        findbbox: function (sections) {
            let mx = 99999999, my = mx, MX = -mx, MY = MX;
            sections.forEach(function (s) {
                const bbox = s.bbox();
                if (mx > bbox.x.min) mx = bbox.x.min;
                if (my > bbox.y.min) my = bbox.y.min;
                if (MX < bbox.x.max) MX = bbox.x.max;
                if (MY < bbox.y.max) MY = bbox.y.max;
            });
            return {
                x: {min: mx, mid: (mx + MX) / 2, max: MX, size: MX - mx},
                y: {min: my, mid: (my + MY) / 2, max: MY, size: MY - my},
            };
        },

        shapeintersections: function (s1, bbox1, s2, bbox2) {
            if (!utils.bboxoverlap(bbox1, bbox2)) return [];
            const intersections = [];
            const a1 = [s1.startcap, s1.forward, s1.back, s1.endcap];
            const a2 = [s2.startcap, s2.forward, s2.back, s2.endcap];
            a1.forEach(function (l1) {
                if (l1.virtual) return;
                a2.forEach(function (l2) {
                    if (l2.virtual) return;
                    const iss = l1.intersects(l2);
                    if (iss.length > 0) {
                        iss.c1 = l1;
                        iss.c2 = l2;
                        iss.s1 = s1;
                        iss.s2 = s2;
                        intersections.push(iss);
                    }
                });
            });
            return intersections;
        },

        makeshape: function (forward, back) {
            const bpl = back.points.length;
            const fpl = forward.points.length;
            const start = utils.makeline(back.points[bpl - 1], forward.points[0]);
            const end = utils.makeline(forward.points[fpl - 1], back.points[0]);
            const shape = {
                startcap: start,
                forward: forward,
                back: back,
                endcap: end,
                bbox: utils.findbbox([start, forward, back, end]),
            };
            const self = utils;
            shape.intersections = function (s2) {
                return self.shapeintersections(shape, shape.bbox, s2, s2.bbox);
            };
            return shape;
        },

        getminmax: function (curve, d, list) {
            if (!list) return {min: 0, max: 0};
            let min = 0xFFFFFFFFFFFFFFFF, max = -min, t, c;
            if (list.indexOf(0) === -1) {
                list = [0].concat(list);
            }
            if (list.indexOf(1) === -1) {
                list.push(1);
            }
            let i = 0;
            const len = list.length;
            for (; i < len; ++i) {
                t = list[i];
                c = curve.get(t);
                if (c[d] < min) {
                    min = c[d];
                }
                if (c[d] > max) {
                    max = c[d];
                }
            }
            return {min: min, mid: (min + max) / 2, max: max, size: max - min};
        },

        arePointsBetween: function (p1, p2, points) {
            // Calculate the direction vector of the line formed by the reference points
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;

            // Normalize the direction vector
            const length = Math.sqrt(dx * dx + dy * dy);
            const normalizedDx = dx / length;
            const normalizedDy = dy / length;

            // Calculate the dot product of the normalized direction vector and each point
            const dotProducts = points.map(point => {
                const delta_x = point.x - p1.x;
                const delta_y = point.y - p1.y;
                return delta_x * normalizedDx + delta_y * normalizedDy;
            });

            // Check if all dot products are within the range [0, length]
            return dotProducts.every(dotProduct => dotProduct >= 0 && dotProduct <= length);
        },

        // Define a function to test if points are collinear within a given epsilon
        arePointsCollinear: function (points, epsilon) {
            epsilon = epsilon || 1e-10;

            if (points.length < 3) {
                // Collinearity requires at least 3 points
                return false;
            }

            // Calculate the slope between the first two points
            const x0 = points[0].x;
            const y0 = points[0].y;
            const x1 = points[1].x;
            const y1 = points[1].y;

            const initialSlope = (x1 - x0) !== 0 ? (y1 - y0) / (x1 - x0) : Infinity;

            // Check if the remaining points have approximately the same slope
            for (let i = 2; i < points.length; i++) {
                const xi = points[i].x;
                const yi = points[i].y;

                const currentSlope = (xi - x0) !== 0 ? (yi - y0) / (xi - x0) : Infinity;

                // Compare the current slope with the initial slope
                if (Math.abs(currentSlope - initialSlope) > epsilon) {
                    return false; // Points are not collinear within epsilon
                }
            }

            return true; // Points are collinear within epsilon
        },

        align: function (points, line) {
            const p1 = line.p1 || line.points[0];
            const p2 = line.p2 || line.points[1];
            const tx = p1.x,
                ty = p1.y,
                a = -atan2(p2.y - ty, p2.x - tx),
                d = function (v) {
                    return {
                        x: (v.x - tx) * cos(a) - (v.y - ty) * sin(a),
                        y: (v.x - tx) * sin(a) + (v.y - ty) * cos(a),
                    };
                };
            return points.map(d);
        },

        allSameSideOfZero: function (arr) {
            if (arr.length === 0) {
                // If the array is empty, you can consider it as all on the same side of zero.
                return true;
            }

            const referenceSign = Math.sign(arr[0]);

            for (let i = 1; i < arr.length; i++) {
                if (!arr[i] || Math.sign(arr[i]) !== referenceSign) {
                    return false;
                }
            }

            return true;
        },

        roots: function (points, line) {
            line = line || {p1: {x: 0, y: 0}, p2: {x: 1, y: 0}};
            let order = points.length - 1;

            if (utils.arePointsCollinear(points) &&
                utils.arePointsBetween(points[0], points[points.length - 1], points.slice(1, -1))) {
                order = 1;
                points = [points[0], points[points.length - 1]];
            }

            const p_aligned = utils.align(points, line);

            if (utils.allSameSideOfZero(p_aligned.map((p)=>p.y))){
                return [];
            }
            const reduce = function (t) {
                return 0 <= t && t <= 1;
            };

            if (order === 1) {
                const p1 = line.p1 || line.points[0];
                const p2 = line.p2 || line.points[1];
                const l_line = utils.dist(p1, p2);
                const l_curve = utils.dist(points[0], points[1]);

                if (p_aligned[0].y * p_aligned[1].y <= 0) {

                    if (p_aligned[1].x === p_aligned[0].x) {
                        return (p_aligned[0].x >= 0 && p_aligned[0].x < l_line) ? [
                            abs(
                                p_aligned[0].y) / l_curve] : [];
                    } else {
                        let a = (p_aligned[1].y - p_aligned[0].y) /
                            (p_aligned[1].x - p_aligned[0].x);
                        let b = p_aligned[0].y - a * p_aligned[0].x;
                        let root = -b / a;
                        if (root < l_line) {
                            const d_root = utils.dist(p_aligned[0], {x: root, y: 0});
                            return [d_root / l_curve];
                        } else {
                            return [];
                        }
                    }
                }
                return [];
            }

            const epsilon = 1e-10; // A small epsilon value for comparison
            // see http://www.trans4mind.com/personal_development/mathematics/polynomials/cubicAlgebra.htm
            if (order === 3) {
                let pa = p_aligned[0].y,
                    pb = p_aligned[1].y,
                    pc = p_aligned[2].y,
                    pd = p_aligned[3].y,
                    d = (-pa + 3 * pb - 3 * pc + pd);

                //ChatGPT generated. TODO: does it work always
                if (Math.abs(d) < epsilon) {
                    // Handle the special case when 'd' is close to zero
                    // Treat it as a quadratic Bezier curve and compute the intersection points

                    order = 2;
                    //reverse of the equation pb = q0 + 2/3(q1 - q0)
                    p_aligned[1].y = (3 / 2) * (pb - pa / 3);
                    p_aligned[2].y = p_aligned[3].y;

                    //let order 2 to take over.

                } else {
                    let a = (3 * pa - 6 * pb + 3 * pc) / d,
                        b = (-3 * pa + 3 * pb) / d,
                        c = pa / d,

                        p = (3 * b - a * a) / 3,
                        p3 = p / 3,
                        q = (2 * a * a * a - 9 * a * b + 27 * c) / 27,
                        q2 = q / 2,
                        discriminant = q2 * q2 + p3 * p3 * p3,
                        u1, v1, x1, x2, x3;
                    if (discriminant < 0) {
                        var mp3 = -p / 3,
                            mp33 = mp3 * mp3 * mp3,
                            r = sqrt(mp33),
                            t = -q / (2 * r),
                            cosphi = t < -1 ? -1 : t > 1 ? 1 : t,
                            phi = acos(cosphi),
                            crtr = crt(r),
                            t1 = 2 * crtr;
                        x1 = t1 * cos(phi / 3) - a / 3;
                        x2 = t1 * cos((phi + tau) / 3) - a / 3;
                        x3 = t1 * cos((phi + 2 * tau) / 3) - a / 3;
                        return [x1, x2, x3].filter(reduce);
                    } else if (discriminant === 0) {
                        u1 = q2 < 0 ? crt(-q2) : -crt(q2);
                        x1 = 2 * u1 - a / 3;
                        x2 = -u1 - a / 3;
                        return [x1, x2].filter(reduce);
                    } else {
                        const sd = sqrt(discriminant);
                        u1 = crt(-q2 + sd);
                        v1 = crt(q2 + sd);
                        return [u1 - v1 - a / 3].filter(reduce);
                    }
                }
            }

            if (order === 2) {
                let a = p_aligned[0].y,
                    b = p_aligned[1].y,
                    c = p_aligned[2].y,
                    d = a - 2 * b + c;
                if (Math.abs(d) > epsilon) {
                    let m1 = -sqrt(b * b - a * c),
                        m2 = -a + b,
                        v1 = -(m1 + m2) / d,
                        v2 = -(-m1 + m2) / d;
                    return [v1, v2].filter(reduce);
                } else if (b !== c && Math.abs(d) <= epsilon) {
                    let v = (2 * b - c) / 2 * (b - c);
                    return [v].filter(reduce);
                }
                return [];
            }


        },

        droots: function (p) {
            // quadratic bezier_roots are easy
            if (p.length === 3) {
                var a = p[0],
                    b = p[1],
                    c = p[2],
                    d = a - 2 * b + c;
                if (d !== 0) {
                    const m1 = -sqrt(b * b - a * c),
                        m2 = -a + b,
                        v1 = -(m1 + m2) / d,
                        v2 = -(-m1 + m2) / d;
                    return [v1, v2];
                } else if (b !== c && d === 0) {
                    return [(2 * b - c) / (2 * (b - c))];
                }
                return [];
            }

            // linear bezier_roots are even easier
            if (p.length === 2) {
                var a = p[0], b = p[1];
                if (a !== b) {
                    return [a / (a - b)];
                }
                return [];
            }
        },

        inflections: function (points) {
            var p = utils.align(points, {p1: points[0], p2: points[3]}),
                a = p[2].x * p[1].y,
                b = p[3].x * p[1].y,
                c = p[1].x * p[2].y,
                d = p[3].x * p[2].y,
                v1 = 18 * (-3 * a + 2 * b + 3 * c - d),
                v2 = 18 * (3 * a - b - 3 * c),
                v3 = 18 * (c - a);

            if (utils.approximately(v1, 0)) return [];

            var trm = v2 * v2 - 4 * v1 * v3,
                sq = Math.sqrt(trm),
                d = 2 * v1;

            if (utils.approximately(d, 0)) return [];

            return [(sq - v2) / d, -(v2 + sq) / d].filter(function (r) {
                return (0 <= r && r <= 1);
            });
        },

        bboxoverlap: function (b1, b2) {
            const dims = ['x', 'y'], len = dims.length;
            let i, dim, l, t, d;
            for (i = 0; i < len; ++i) {
                dim = dims[i];
                l = b1[dim].mid;
                t = b2[dim].mid;
                d = (b1[dim].size + b2[dim].size) / 2;
                if (abs(l - t) >= d) return false;
            }
            return true;
        },

        expandbox: function (bbox, _bbox) {
            if (_bbox.x.min < bbox.x.min) {
                bbox.x.min = _bbox.x.min;
            }
            if (_bbox.y.min < bbox.y.min) {
                bbox.y.min = _bbox.y.min;
            }
            if (_bbox.z && _bbox.z.min < bbox.z.min) {
                bbox.z.min = _bbox.z.min;
            }
            if (_bbox.x.max > bbox.x.max) {
                bbox.x.max = _bbox.x.max;
            }
            if (_bbox.y.max > bbox.y.max) {
                bbox.y.max = _bbox.y.max;
            }
            if (_bbox.z && _bbox.z.max > bbox.z.max) {
                bbox.z.max = _bbox.z.max;
            }
            bbox.x.mid = (bbox.x.min + bbox.x.max) / 2;
            bbox.y.mid = (bbox.y.min + bbox.y.max) / 2;
            if (bbox.z) {
                bbox.z.mid = (bbox.z.min + bbox.z.max) / 2;
            }
            bbox.x.size = bbox.x.max - bbox.x.min;
            bbox.y.size = bbox.y.max - bbox.y.min;
            if (bbox.z) {
                bbox.z.size = bbox.z.max - bbox.z.min;
            }
        },

        pairiteration: function (c1, c2) {
            const c1b = c1.bbox(),
                c2b = c2.bbox(),
                r = 100000,
                threshold = 0.5;
            if (c1b.x.size + c1b.y.size < threshold && c2b.x.size + c2b.y.size <
                threshold) {
                return [
                    ((r * (c1._t1 + c1._t2) / 2) | 0) / r + '/' +
                    ((r * (c2._t1 + c2._t2) / 2) | 0) / r];
            }
            const cc1 = c1.split(0.5),
                cc2 = c2.split(0.5);
            let pairs = [
                {left: cc1.left, right: cc2.left},
                {left: cc1.left, right: cc2.right},
                {left: cc1.right, right: cc2.right},
                {left: cc1.right, right: cc2.left}];
            pairs = pairs.filter(function (pair) {
                return utils.bboxoverlap(pair.left.bbox(), pair.right.bbox());
            });
            let results = [];
            if (pairs.length === 0) return results;
            pairs.forEach(function (pair) {
                results = results.concat(
                    utils.pairiteration(pair.left, pair.right),
                );
            });
            results = results.filter(function (v, i) {
                return results.indexOf(v) === i;
            });
            return results;
        },

        getccenter: function (p1, p2, p3) {
            const dx1 = (p2.x - p1.x),
                dy1 = (p2.y - p1.y),
                dx2 = (p3.x - p2.x),
                dy2 = (p3.y - p2.y);
            const dx1p = dx1 * cos(quart) - dy1 * sin(quart),
                dy1p = dx1 * sin(quart) + dy1 * cos(quart),
                dx2p = dx2 * cos(quart) - dy2 * sin(quart),
                dy2p = dx2 * sin(quart) + dy2 * cos(quart);
            // chord midpoints
            const mx1 = (p1.x + p2.x) / 2,
                my1 = (p1.y + p2.y) / 2,
                mx2 = (p2.x + p3.x) / 2,
                my2 = (p2.y + p3.y) / 2;
            // midpoint offsets
            const mx1n = mx1 + dx1p,
                my1n = my1 + dy1p,
                mx2n = mx2 + dx2p,
                my2n = my2 + dy2p;
            // intersection of these lines:
            const arc = utils.lli8(mx1, my1, mx1n, my1n, mx2, my2, mx2n, my2n),
                r = utils.dist(arc, p1);
            let // arc start/end values, over mid point:
                s = atan2(p1.y - arc.y, p1.x - arc.x);
            const m = atan2(p2.y - arc.y, p2.x - arc.x);
            let e = atan2(p3.y - arc.y, p3.x - arc.x),
                _;
            // determine arc direction (cw_third/ccw_third correction)
            if (s < e) {
                // if s<m<e, arc(s, e)
                // if m<s<e, arc(e, s + tau)
                // if s<e<m, arc(e, s + tau)
                if (s > m || m > e) {
                    s += tau;
                }
                if (s > e) {
                    _ = e;
                    e = s;
                    s = _;
                }
            } else {
                // if e<m<s, arc(e, s)
                // if m<e<s, arc(s, e + tau)
                // if e<s<m, arc(s, e + tau)
                if (e < m && m < s) {
                    _ = e;
                    e = s;
                    s = _;
                } else {
                    e += tau;
                }
            }
            // assign and done.
            arc.s = s;
            arc.e = e;
            arc.r = r;
            return arc;
        },
    };

    Snap.bUtils = utils;
    //Define bezier factory

    Snap.registerType('Bezier', Bezier);
    Snap.registerType('PolyBezier', PolyBezier);

    Snap.bezier = function () {
        return new (Bezier.bind.apply(Bezier,
            [undefined, ...Array.prototype.slice.call(arguments)]))();
    };

    for (let fun in Bezier) if (Bezier.hasOwnProperty(fun)) {
        Snap.bezier[fun] = Bezier[fun];
    }

    Snap.polyBezier = function () {
        return new (PolyBezier.bind.apply(PolyBezier,
            [undefined, ...Array.prototype.slice.call(arguments)]))();
    };

    for (let fun in PolyBezier) if (PolyBezier.hasOwnProperty(fun)) {
        Snap.PolyBezier[fun] = PolyBezier[fun];
    }

});

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function _cross(o, a, b) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

function _upperTangent(pointset) {
    const lower = [];
    for (let l = 0; l < pointset.length; l++) {
        while (lower.length >= 2 && (_cross(lower[lower.length - 2], lower[lower.length - 1], pointset[l]) <= 0)) {
            lower.pop();
        }
        lower.push(pointset[l]);
    }
    lower.pop();
    return lower;
}

function _lowerTangent(pointset) {
    const reversed = pointset.reverse(),
        upper = [];
    for (let u = 0; u < reversed.length; u++) {
        while (upper.length >= 2 && (_cross(upper[upper.length - 2], upper[upper.length - 1], reversed[u]) <= 0)) {
            upper.pop();
        }
        upper.push(reversed[u]);
    }
    upper.pop();
    return upper;
}

// pointset has to be sorted by X
function convex(pointset) {
    const upper = _upperTangent(pointset),
          lower = _lowerTangent(pointset);
    const convex = lower.concat(upper);
    convex.push(pointset[0]);  
    return convex;  
}

module.exports = convex;

},{}],2:[function(require,module,exports){
module.exports = {

    toXy: function(pointset, format) {
        if (format === undefined) {
            return pointset.slice();
        }
        return pointset.map(function(pt) {
            /*jslint evil: true */
            const _getXY = new Function('pt', 'return [pt' + format[0] + ',' + 'pt' + format[1] + '];');
            return _getXY(pt);
        });
    },

    fromXy: function(pointset, format) {
        if (format === undefined) {
            return pointset.slice();
        }
        return pointset.map(function(pt) {
            /*jslint evil: true */
            const _getObj = new Function('pt', 'const o = {}; o' + format[0] + '= pt[0]; o' + format[1] + '= pt[1]; return o;');
            return _getObj(pt);
        });
    }

}
},{}],3:[function(require,module,exports){
function Grid(points, cellSize) {
    this._cells = [];
    this._cellSize = cellSize;
    this._reverseCellSize = 1 / cellSize;

    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const x = this.coordToCellNum(point[0]);
        const y = this.coordToCellNum(point[1]);
        if (!this._cells[x]) {
            const array = [];
            array[y] = [point];
            this._cells[x] = array;
        } else if (!this._cells[x][y]) {
            this._cells[x][y] = [point];
        } else {
            this._cells[x][y].push(point);
        }
    }
}

Grid.prototype = {
    cellPoints: function(x, y) { // (Number, Number) -> Array
        return (this._cells[x] !== undefined && this._cells[x][y] !== undefined) ? this._cells[x][y] : [];
    },

    rangePoints: function(bbox) { // (Array) -> Array
        const tlCellX = this.coordToCellNum(bbox[0]);
        const tlCellY = this.coordToCellNum(bbox[1]);
        const brCellX = this.coordToCellNum(bbox[2]);
        const brCellY = this.coordToCellNum(bbox[3]);
        const points = [];

        for (let x = tlCellX; x <= brCellX; x++) {
            for (let y = tlCellY; y <= brCellY; y++) {
                // replaced Array.prototype.push.apply to avoid hitting stack size limit on larger arrays.
                for (let i = 0; i < this.cellPoints(x, y).length; i++) {
                    points.push(this.cellPoints(x, y)[i]);
                }
            }
        }

        return points;
    },

    removePoint: function(point) { // (Array) -> Array
        const cellX = this.coordToCellNum(point[0]);
        const cellY = this.coordToCellNum(point[1]);
        const cell = this._cells[cellX][cellY];
        let pointIdxInCell;

        for (let i = 0; i < cell.length; i++) {
            if (cell[i][0] === point[0] && cell[i][1] === point[1]) {
                pointIdxInCell = i;
                break;
            }
        }

        cell.splice(pointIdxInCell, 1);

        return cell;
    },

    trunc: Math.trunc || function(val) { // (number) -> number
        return val - val % 1;
    },

    coordToCellNum: function(x) { // (number) -> number
        return this.trunc(x * this._reverseCellSize);
    },

    extendBbox: function(bbox, scaleFactor) { // (Array, Number) -> Array
        return [
            bbox[0] - (scaleFactor * this._cellSize),
            bbox[1] - (scaleFactor * this._cellSize),
            bbox[2] + (scaleFactor * this._cellSize),
            bbox[3] + (scaleFactor * this._cellSize)
        ];
    }
};

function grid(points, cellSize) {
    return new Grid(points, cellSize);
}

module.exports = grid;
},{}],4:[function(require,module,exports){
/*
 (c) 2014-2020, Andrii Heonia
 Hull.js, a JavaScript library for concave hull generation by set of points.
 https://github.com/AndriiHeonia/hull
*/

'use strict';

const intersect = require('./intersect.js');
const grid = require('./grid.js');
const formatUtil = require('./format.js');
const convexHull = require('./convex.js');

function _filterDuplicates(pointset) {
    const unique = [pointset[0]];
    let lastPoint = pointset[0];
    for (let i = 1; i < pointset.length; i++) {
        const currentPoint = pointset[i];
        if (lastPoint[0] !== currentPoint[0] || lastPoint[1] !== currentPoint[1]) {
            unique.push(currentPoint);
        }
        lastPoint = currentPoint;
    }
    return unique;
}

function _sortByX(pointset) {
    return pointset.sort(function(a, b) {
        return (a[0] - b[0]) || (a[1] - b[1]);
    });
}

function _sqLength(a, b) {
    return Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2);
}

function _cos(o, a, b) {
    const aShifted = [a[0] - o[0], a[1] - o[1]],
        bShifted = [b[0] - o[0], b[1] - o[1]],
        sqALen = _sqLength(o, a),
        sqBLen = _sqLength(o, b),
        dot = aShifted[0] * bShifted[0] + aShifted[1] * bShifted[1];

    return dot / Math.sqrt(sqALen * sqBLen);
}

function _intersect(segment, pointset) {
    for (let i = 0; i < pointset.length - 1; i++) {
        const seg = [pointset[i], pointset[i + 1]];
        if (segment[0][0] === seg[0][0] && segment[0][1] === seg[0][1] ||
            segment[0][0] === seg[1][0] && segment[0][1] === seg[1][1]) {
            continue;
        }
        if (intersect(segment, seg)) {
            return true;
        }
    }
    return false;
}

function _occupiedArea(pointset) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = pointset.length - 1; i >= 0; i--) {
        if (pointset[i][0] < minX) {
            minX = pointset[i][0];
        }
        if (pointset[i][1] < minY) {
            minY = pointset[i][1];
        }
        if (pointset[i][0] > maxX) {
            maxX = pointset[i][0];
        }
        if (pointset[i][1] > maxY) {
            maxY = pointset[i][1];
        }
    }

    return [
        maxX - minX, // width
        maxY - minY  // height
    ];
}

function _bBoxAround(edge) {
    return [
        Math.min(edge[0][0], edge[1][0]), // left
        Math.min(edge[0][1], edge[1][1]), // top
        Math.max(edge[0][0], edge[1][0]), // right
        Math.max(edge[0][1], edge[1][1])  // bottom
    ];
}

function _midPoint(edge, innerPoints, convex) {
    let point = null,
        angle1Cos = MAX_CONCAVE_ANGLE_COS,
        angle2Cos = MAX_CONCAVE_ANGLE_COS,
        a1Cos, a2Cos;

    for (let i = 0; i < innerPoints.length; i++) {
        a1Cos = _cos(edge[0], edge[1], innerPoints[i]);
        a2Cos = _cos(edge[1], edge[0], innerPoints[i]);

        if (a1Cos > angle1Cos && a2Cos > angle2Cos &&
            !_intersect([edge[0], innerPoints[i]], convex) &&
            !_intersect([edge[1], innerPoints[i]], convex)) {

            angle1Cos = a1Cos;
            angle2Cos = a2Cos;
            point = innerPoints[i];
        }
    }

    return point;
}

function _concave(convex, maxSqEdgeLen, maxSearchArea, grid, edgeSkipList) {
    let midPointInserted = false;

    for (let i = 0; i < convex.length - 1; i++) {
        const edge = [convex[i], convex[i + 1]];
        // generate a key in the format X0,Y0,X1,Y1
        const keyInSkipList = edge[0][0] + ',' + edge[0][1] + ',' + edge[1][0] + ',' + edge[1][1];

        if (_sqLength(edge[0], edge[1]) < maxSqEdgeLen ||
            edgeSkipList.has(keyInSkipList)) { continue; }

        let scaleFactor = 0;
        let bBoxAround = _bBoxAround(edge);
        let bBoxWidth;
        let bBoxHeight;
        let midPoint;
        do {
            bBoxAround = grid.extendBbox(bBoxAround, scaleFactor);
            bBoxWidth = bBoxAround[2] - bBoxAround[0];
            bBoxHeight = bBoxAround[3] - bBoxAround[1];

            midPoint = _midPoint(edge, grid.rangePoints(bBoxAround), convex);
            scaleFactor++;
        }  while (midPoint === null && (maxSearchArea[0] > bBoxWidth || maxSearchArea[1] > bBoxHeight));

        if (bBoxWidth >= maxSearchArea[0] && bBoxHeight >= maxSearchArea[1]) {
            edgeSkipList.add(keyInSkipList);
        }

        if (midPoint !== null) {
            convex.splice(i + 1, 0, midPoint);
            grid.removePoint(midPoint);
            midPointInserted = true;
        }
    }

    if (midPointInserted) {
        return _concave(convex, maxSqEdgeLen, maxSearchArea, grid, edgeSkipList);
    }

    return convex;
}

function hull(pointset, concavity, format) {
    let maxEdgeLen = concavity || 20;

    const points = _filterDuplicates(_sortByX(formatUtil.toXy(pointset, format)));

    if (points.length < 4) {
        return points.concat([points[0]]);
    }

    const occupiedArea = _occupiedArea(points);
    const maxSearchArea = [
        occupiedArea[0] * MAX_SEARCH_BBOX_SIZE_PERCENT,
        occupiedArea[1] * MAX_SEARCH_BBOX_SIZE_PERCENT
    ];

    const convex = convexHull(points);
    const innerPoints = points.filter(function(pt) {
        return convex.indexOf(pt) < 0;
    });

    const cellSize = Math.ceil(1 / (points.length / (occupiedArea[0] * occupiedArea[1])));

    const concave = _concave(
        convex, Math.pow(maxEdgeLen, 2),
        maxSearchArea, grid(innerPoints, cellSize), new Set());

    if (format) {
        return formatUtil.fromXy(concave, format);
    } else {
        return concave;
    }
}

const MAX_CONCAVE_ANGLE_COS = Math.cos(90 / (180 / Math.PI)); // angle = 90 deg
const MAX_SEARCH_BBOX_SIZE_PERCENT = 0.6;

module.exports = hull;

},{"./convex.js":1,"./format.js":2,"./grid.js":3,"./intersect.js":5}],5:[function(require,module,exports){
function ccw(x1, y1, x2, y2, x3, y3) {           
    const cw = ((y3 - y1) * (x2 - x1)) - ((y2 - y1) * (x3 - x1));
    return cw > 0 ? true : cw < 0 ? false : true; // colinear
}

function intersect(seg1, seg2) {
  const x1 = seg1[0][0], y1 = seg1[0][1],
      x2 = seg1[1][0], y2 = seg1[1][1],
      x3 = seg2[0][0], y3 = seg2[0][1],
      x4 = seg2[1][0], y4 = seg2[1][1];

    return ccw(x1, y1, x3, y3, x4, y4) !== ccw(x2, y2, x3, y3, x4, y4) && ccw(x1, y1, x2, y2, x3, y3) !== ccw(x1, y1, x2, y2, x4, y4);
}

module.exports = intersect;
},{}],6:[function(require,module,exports){
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    const _hull = require("hull.js");
    Snap.hull = function (points, concavity, format) {
        //filter incorrect pionts;
        points = points.filter(function (p){
            return (!isNaN(p[0]) && !isNaN(p[1]))
                ||  (!isNaN(p["x"]) && !isNaN(p["y"]))
        })

        if (Array.isArray(points[0])) {
            return _hull(points, concavity, format);
        }
        if (!isNaN(points[0]) && points.length % 2 === 0) {
            let pts = [];
            for (let i = 0, l = points.length; i < l; i += 2) {
                pts.push([+points[i], +points[i + 1]]);
            }
            return _hull(pts, concavity, format);
        }
        if (typeof points[0] === "object" && points[0].hasOwnProperty("x") && points[0].hasOwnProperty("y")) {
            points = points.map((p) => [+p.x, +p.y]);
            return _hull(points, concavity, format).map((p) => {
                return {x: p[0], y: p[1]}
            });
        }

        return null;
    };

    Snap.convexHull = function (points, format) {
        const hull = Snap.hull(points, Infinity, format);
        hull && hull.pop();
        return hull
    }

});
},{"hull.js":4}]},{},[6]);


//code based on https://github.com/vrd/js-intersect

Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    Snap.polygons = Snap.polygons || {}
    function intersect(fig1, fig2) {
        let fig2a = alignPolygon(fig2, fig1);
        if (!checkPolygons(fig1, fig2a)) {
            return false;
        }
        const edges = edgify(fig1, fig2a);
        const polygons = polygonate(edges);
        const filteredPolygons = filterPolygons(polygons, fig1, fig2a, "intersect");
        return filteredPolygons;
    }

    Snap.polygons.intersect = intersect;

    function alignPolygon(polygon, points) {
        for (let i = 0; i < polygon.length; i++) {
            for (let j = 0; j < points.length; j++) {
                if (distance(polygon[i], points[j]) < 0.00000001)
                    polygon[i] = points[j];
            }
        }
        return polygon;
    }

    function distance(p1, p2) {
        const dx = Math.abs(p1.x - p2.x);
        const dy = Math.abs(p1.y - p2.y);
        return Math.sqrt(dx*dx + dy*dy);
    }

//check polygons for correctness
    function checkPolygons(fig1, fig2) {
        const figs = [fig1, fig2];
        for (let i = 0; i < figs.length; i++) {
            if (figs[i].length < 3) {
                console.error("Polygon " + (i+1) + " is invalid!");
                return false;
            }
        }
        return true;
    }

//create array of edges of all polygons
    function edgify(fig1, fig2) {
        //create primary array from all edges
        const primEdges = getEdges(fig1).concat(getEdges(fig2));
        const secEdges = [];
        //check every edge
        for(let i = 0; i < primEdges.length; i++) {
            let points = [];
            //for intersection with every edge except itself
            for(let j = 0; j < primEdges.length; j++) {
                if (i != j) {
                    const interPoints = findEdgeIntersection(primEdges[i], primEdges[j]);
                    addNewPoints(interPoints, points);
                }
            }
            //add start and end points to intersection points
            startPoint = primEdges[i][0];
            startPoint.t = 0;
            endPoint = primEdges[i][1];
            endPoint.t = 1;
            addNewPoints([startPoint, endPoint], points);
            //sort all points by position on edge
            points = sortPoints(points);
            //break edge to parts
            for (let k = 0; k < points.length - 1; k++) {
                const edge = [
                    {x: points[k].x, y: points[k].y},
                    {x: points[k + 1].x, y: points[k + 1].y}
                ];
                // check for existanse in sec.array
                if (!edgeExists(edge, secEdges)) {
                    //push if not exists
                    secEdges.push(edge);
                }
            }
        }
        return secEdges;
    }

    function addNewPoints(newPoints, points) {
        if (newPoints.length > 0) {
            //check for uniqueness
            for (let k = 0; k < newPoints.length; k++) {
                if (!pointExists(newPoints[k], points)) {
                    points.push(newPoints[k]);
                }
            }
        }
    }

    function sortPoints(points) {
        const p = points;
        p.sort((a,b) => {
            if (a.t > b.t) return 1;
            if (a.t < b.t) return -1;
        });
        return p;
    }

    function getEdges(fig) {
        const edges = [];
        const len = fig.length;
        for (let i = 0; i < len; i++) {
            edges.push([
                {x: fig[(i % len)].x, y: fig[(i % len)].y},
                {x: fig[((i+1) % len)].x, y: fig[((i+1) % len)].y}
            ]);
        }
        return edges;
    }

    function findEdgeIntersection(edge1, edge2) {
        const x1 = edge1[0].x;
        const x2 = edge1[1].x;
        const x3 = edge2[0].x;
        const x4 = edge2[1].x;
        const y1 = edge1[0].y;
        const y2 = edge1[1].y;
        const y3 = edge2[0].y;
        const y4 = edge2[1].y;
        const nom1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
        const nom2 = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);
        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        const t1 = nom1 / denom;
        const t2 = nom2 / denom;
        const interPoints = [];
        //1. lines are parallel or edges don't intersect
        if (((denom === 0) && (nom1 !== 0)) || (t1 <= 0) || (t1 >= 1) || (t2 < 0 ) || (t2 > 1)) {
            return interPoints;
        }
        //2. lines are collinear
        else if ((nom1 === 0) && (denom === 0)) {
            //check if endpoints of edge2 lies on edge1
            for (var i = 0; i < 2; i++) {
                var classify = classifyPoint(edge2[i], edge1);
                //find position of this endpoints relatively to edge1
                if (classify.loc == "ORIGIN" || classify.loc == "DESTINATION") {
                    interPoints.push({x: edge2[i].x, y: edge2[i].y, t: classify.t});
                }
                else if (classify.loc == "BETWEEN") {
                    x = +((x1 + classify.t*(x2 - x1)).toPrecision(10));
                    y = +((y1 + classify.t*(y2 - y1)).toPrecision(10));
                    interPoints.push({x: x, y: y, t: classify.t});
                }
            }
            return interPoints;
        }
        //3. edges intersect
        else {
            for (var i = 0; i < 2; i++) {
                var classify = classifyPoint(edge2[i], edge1);
                if (classify.loc == "ORIGIN" || classify.loc == "DESTINATION") {
                    interPoints.push({x: edge2[i].x, y: edge2[i].y, t: classify.t});
                }
            }
            if (interPoints.length > 0) {
                return interPoints;
            }
            var x = +((x1 + t1*(x2 - x1)).toPrecision(10));
            var y = +((y1 + t1*(y2 - y1)).toPrecision(10));
            interPoints.push({x: x, y: y, t: t1});
            return interPoints;
        }
        return interPoints;
    }

    function classifyPoint(p, edge) {
        const ax = edge[1].x - edge[0].x;
        const ay = edge[1].y - edge[0].y;
        const bx = p.x - edge[0].x;
        const by = p.y - edge[0].y;
        const sa = ax * by - bx * ay;
        if ((p.x === edge[0].x) && (p.y === edge[0].y)) {
            return {loc: "ORIGIN", t: 0};
        }
        if ((p.x === edge[1].x) && (p.y === edge[1].y)) {
            return {loc: "DESTINATION", t: 1};
        }
        let theta = (polarAngle([edge[1], edge[0]]) -
            polarAngle([{x: edge[1].x, y: edge[1].y}, {x: p.x, y: p.y}])) % 360;
        if (theta < 0) {
            theta = theta + 360;
        }
        if (sa < -0.0000000001) {
            return {loc: "LEFT", theta: theta};
        }
        if (sa > 0.00000000001) {
            return {loc: "RIGHT", theta: theta};
        }
        if (((ax * bx) < 0) || ((ay * by) < 0)) {
            return {loc: "BEHIND", theta: 0};
        }
        if ((Math.sqrt(ax * ax + ay * ay)) < (Math.sqrt(bx * bx + by * by))) {
            return {loc: "BEYOND", theta: 180};
        }
        let t;
        if (ax !== 0) {
            t = bx/ax;
        } else {
            t = by/ay;
        }
        return {loc: "BETWEEN", t: t};
    }

    function polarAngle(edge) {
        const dx = edge[1].x - edge[0].x;
        const dy = edge[1].y - edge[0].y;
        if ((dx === 0) && (dy === 0)) {
            //console.error("Edge has zero length.");
            return false;
        }
        if (dx === 0) {
            return ((dy > 0) ? 90 : 270);
        }
        if (dy === 0) {
            return ((dx > 0) ? 0 : 180);
        }
        const theta = Math.atan(dy / dx) * 360 / (2 * Math.PI);
        if (dx > 0) {
            return ((dy >= 0) ? theta : theta + 360);
        } else {
            return (theta + 180);
        }
    }

    function pointExists(p, points) {
        if (points.length === 0) {
            return false;
        }
        for (let i = 0; i < points.length; i++) {
            if ((p.x === points[i].x) && (p.y === points[i].y)) {
                return true;
            }
        }
        return false;
    }

    function edgeExists(e, edges) {
        if (edges.length === 0) {
            return false;
        }
        for (let i = 0; i < edges.length; i++) {
            if (equalEdges(e, edges[i]))
                return true;
        }
        return false;
    }

    function equalEdges(edge1, edge2) {
        if (((edge1[0].x === edge2[0].x) &&
            (edge1[0].y === edge2[0].y) &&
            (edge1[1].x === edge2[1].x) &&
            (edge1[1].y === edge2[1].y)) || (
            (edge1[0].x === edge2[1].x) &&
            (edge1[0].y === edge2[1].y) &&
            (edge1[1].x === edge2[0].x) &&
            (edge1[1].y === edge2[0].y))) {
            return true;
        } else {
            return false;
        }
    }

    function polygonate(edges) {
        const polygons = [];
        let polygon = [];
        const len = edges.length;
        const midpoints = getMidpoints(edges);
        //start from every edge and create non-selfintersecting polygons
        for (let i = 0; i < len - 2; i++) {
            const org = {x: edges[i][0].x, y: edges[i][0].y};
            const dest = {x: edges[i][1].x, y: edges[i][1].y};
            let currentEdge = i;
            let point;
            let p;
            let direction;
            let stop;
            //while we havn't come to the starting edge again
            for (direction = 0; direction < 2; direction++) {
                polygon = [];
                stop = false;
                while ((polygon.length === 0) || (!stop)) {
                    //add point to polygon
                    polygon.push({x: org.x, y: org.y});
                    point = undefined;
                    //look for edge connected with end of current edge
                    for (let j = 0; j < len; j++) {
                        p = undefined;
                        //except itself
                        if (!equalEdges(edges[j], edges[currentEdge])) {
                            //if some edge is connected to current edge in one endpoint
                            if ((edges[j][0].x === dest.x) && (edges[j][0].y === dest.y)) {
                                p = edges[j][1];
                            }
                            if ((edges[j][1].x === dest.x) && (edges[j][1].y === dest.y)) {
                                p = edges[j][0];
                            }
                            //compare it with last found connected edge for minimum angle between itself and current edge
                            if (p) {
                                const classify = classifyPoint(p, [org, dest]);
                                //if this edge has smaller theta then last found edge update data of next edge of polygon
                                if (!point ||
                                    ((classify.theta < point.theta) && (direction === 0)) ||
                                    ((classify.theta > point.theta) && (direction === 1))) {
                                    point = {x: p.x, y: p.y, theta: classify.theta, edge: j};
                                }
                            }
                        }
                    }
                    //change current edge to next edge
                    org.x = dest.x;
                    org.y = dest.y;
                    dest.x = point.x;
                    dest.y = point.y;
                    currentEdge = point.edge;
                    //if we reach start edge
                    if ((org.x == edges[i][0].x) &&
                        (org.y == edges[i][0].y) &&
                        (dest.x == edges[i][1].x) &&
                        (dest.y == edges[i][1].y)) {
                        stop = true;
                        //check polygon for correctness
                        /*for (var k = 0; k < allPoints.length; k++) {
                          //if some point is inside polygon it is incorrect
                          if ((!pointExists(allPoints[k], polygon)) && (findPointInsidePolygon(allPoints[k], polygon))) {
                            polygon = false;
                          }
                        }*/
                        for (k = 0; k < midpoints.length; k++) {
                            //if some midpoint is inside polygon (edge inside polygon) it is incorrect
                            if (findPointInsidePolygon(midpoints[k], polygon)) {
                                polygon = false;
                            }
                        }
                    }
                }
                //add created polygon if it is correct and was not found before
                if (polygon && !polygonExists(polygon, polygons)) {
                    polygons.push(polygon);
                }
            }
        }
        //console.log("polygonate: " + JSON.stringify(polygons));
        return polygons;
    }

    function polygonExists(polygon, polygons) {
        //if array is empty element doesn't exist in it
        if (polygons.length === 0) return false;
        //check every polygon in array
        for (let i = 0; i < polygons.length; i++) {
            //if lengths are not same go to next element
            if (polygon.length !== polygons[i].length) continue;
            //if length are same need to check
            else {
                //if all the points are same
                for (let j = 0; j < polygon.length; j++) {
                    //if point is not found break forloop and go to next element
                    if (!pointExists(polygon[j], polygons[i])) break;
                    //if point found
                    else {
                        //and it is last point in polygon we found polygon in array!
                        if (j === polygon.length - 1) return true;
                    }
                }
            }
        }
        return false;
    }

    function filterPolygons(polygons, fig1, fig2, mode) {
        const filtered = [];
        let c1, c2;
        let point;
        const bigPolygons = removeSmallPolygons(polygons, 0.0001);
        for(let i = 0; i < bigPolygons.length; i++) {
            point = getPointInsidePolygon(bigPolygons[i]);
            c1 = findPointInsidePolygon(point, fig1);
            c2 = findPointInsidePolygon(point, fig2);
            if (
                ((mode === "intersect") && c1 && c2) || //intersection
                ((mode === "cut1") && c1 && !c2) ||     //fig1 - fig2
                ((mode === "cut2") && !c1 && c2) ||     //fig2 - fig2
                ((mode === "sum") && (c1 || c2))) {     //fig1 + fig2
                filtered.push(bigPolygons[i]);
            }
        }
        //console.log("filtered: " + JSON.stringify(filtered));
        return filtered;
    }

    function removeSmallPolygons(polygons, minSize) {
        const big = [];
        for (let i = 0; i < polygons.length; i++) {
            if (polygonArea(polygons[i]) >= minSize) {
                big.push(polygons[i]);
            }
        }
        return big;
    }

    function polygonArea(p) {
        const len = p.length;
        let s = 0;
        for (let i = 0; i < len; i++) {
            s += Math.abs((p[i % len].x * p[(i + 1) % len].y) - (p[i % len].y *
                p[(i + 1) % len].x));
        }
        return s/2;
    }

    Snap.polygons.polygonArea = polygonArea;

    function getPointInsidePolygon(polygon) {
        let point;
        const size = getSize(polygon);
        const edges = getEdges(polygon);
        let y = size.y.min + (size.y.max - size.y.min) / Math.PI;
        const dy = (size.y.max - size.y.min) / 13;
        let line = [];
        let points;
        let interPoints = [];
        let pointsOK = false;
        while (!pointsOK) {
            line = [{x: (size.x.min - 1), y: y},{x: (size.x.max + 1), y: y}];
            //find intersections with all polygon edges
            for (var i = 0; i < edges.length; i++) {
                points = findEdgeIntersection(line, edges[i]);
                //if edge doesn't lie inside line
                if (points && (points.length === 1)) {
                    interPoints.push(points[0]);
                }
            }
            interPoints = sortPoints(interPoints);
            //find two correct interpoints
            for (var i = 0; i < interPoints.length - 1; i++) {
                if (interPoints[i].t !== interPoints[i+1].t) {
                    //enable exit from loop and calculate point coordinates
                    pointsOK = true;
                    point = {x: ((interPoints[i].x + interPoints[i+1].x) / 2), y: y};
                }
            }
            //all points are incorrect, need to change line parameters
            y = y + dy;
            if (((y > size.y.max) || (y < size.y.min)) && (pointsOK === false)) {
                pointsOK = true;
                point = undefined;
            }
        }
        return point;
    }

    function getSize(polygon) {
        const size = {
            x: {
                min: polygon[0].x,
                max: polygon[0].x
            },
            y: {
                min: polygon[0].y,
                max: polygon[0].y
            }
        };
        for (let i = 1; i < polygon.length; i++) {
            if (polygon[i].x < size.x.min) size.x.min = polygon[i].x;
            if (polygon[i].x > size.x.max) size.x.max = polygon[i].x;
            if (polygon[i].y < size.y.min) size.y.min = polygon[i].y;
            if (polygon[i].y > size.y.max) size.y.max = polygon[i].y;
        }
        return size;
    }

    function findPointInsidePolygon(point, polygon, count_side) {
        if (Array.isArray(point)) point = {x:point[0], y:point[1]};

        let cross = 0;
        const edges = getEdges(polygon);
        let classify;
        let org, dest;
        for (let i = 0; i < edges.length; i++) {
            [org, dest] = edges[i];
            classify = classifyPoint(point, [org, dest]);
            if (  (
                    (classify.loc === "RIGHT") &&
                    (org.y < point.y) &&
                    (dest.y >= point.y)
                ) ||
                (
                    (classify.loc === "LEFT") &&
                    (org.y >= point.y) &&
                    (dest.y < point.y)
                )
            ) {
                cross++;
            }
            if (classify.loc === "BETWEEN") return !!count_side;
        }
        if (cross % 2) {
            return true;
        } else {
            return false;
        }
    }

    Snap.polygons.pointInPolygon = findPointInsidePolygon;

    function getMidpoints(edges) {
        const midpoints = [];
        let x, y;
        for (let i = 0; i < edges.length; i++) {
            x = (edges[i][0].x + edges[i][1].x) / 2;
            y = (edges[i][0].y + edges[i][1].y) / 2;
            midpoints.push({x: x, y: y});
        }
        return midpoints;
    }

    function log(obj) {
        console.log(JSON.stringify(obj));
    }

});
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {

    function Polygon(vertices, edges) {
        if (!edges) {
            let l = vertices.length;
            edges = vertices.map((v, i) => {
                return {
                    x: vertices[(i + 1) % l].x - v.x,
                    y: vertices[(i + 1) % l].y - v.y
                }
            })
        }
        this.vertex = vertices;
        this.edge = edges;
    }

//include appropriate test case code.
    function sat(polygonA, polygonB) {
        if (!(polygonA instanceof Polygon)) polygonA = new Polygon(polygonA);
        if (!(polygonB instanceof Polygon)) polygonB = new Polygon(polygonB);
        let perpendicularLine = null;
        let dot = 0;
        const perpendicularStack = [];
        let amin = null;
        let amax = null;
        let bmin = null;
        let bmax = null;
        for (let i = 0; i < polygonA.edge.length; i++) {
            perpendicularLine = {
                x: -polygonA.edge[i].y,
                y: polygonA.edge[i].x
            };
            perpendicularStack.push(perpendicularLine);
        }
        for (let i = 0; i < polygonB.edge.length; i++) {
            perpendicularLine = {
                x: -polygonB.edge[i].y,
                y: polygonB.edge[i].x
            };
            perpendicularStack.push(perpendicularLine);
        }
        for (let i = 0; i < perpendicularStack.length; i++) {
            amin = null;
            amax = null;
            bmin = null;
            bmax = null;
            for (let j = 0; j < polygonA.vertex.length; j++) {
                dot = polygonA.vertex[j].x *
                    perpendicularStack[i].x +
                    polygonA.vertex[j].y *
                    perpendicularStack[i].y;
                if (amax === null || dot > amax) {
                    amax = dot;
                }
                if (amin === null || dot < amin) {
                    amin = dot;
                }
            }
            for (var j = 0; j < polygonB.vertex.length; j++) {
                dot = polygonB.vertex[j].x *
                    perpendicularStack[i].x +
                    polygonB.vertex[j].y *
                    perpendicularStack[i].y;
                if (bmax === null || dot > bmax) {
                    bmax = dot;
                }
                if (bmin === null || dot < bmin) {
                    bmin = dot;
                }
            }
            if ((amin <= bmax && amin >= bmin) ||
                (bmin <= amax && bmin >= amin)) {
                continue;
            } else {
                return false;
            }
        }
        return true;
    }

    Snap.polygons = Snap.polygons || {}

    Snap.polygons.con_overlap = function (shape1, shape2) {
        return Snap.polygons.pointInPolygon(shape1[0], shape2, true) ||
            Snap.polygons.pointInPolygon(shape2[0], shape1, true) ||
            sat(shape1, shape2);
    }

    Snap.polygons.sat = sat;

})
(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/**
 * Bit twiddling hacks for JavaScript.
 *
 * Author: Mikola Lysenko
 *
 * Ported from Stanford bit twiddling hack library:
 *    http://graphics.stanford.edu/~seander/bithacks.html
 */

"use strict"; "use restrict";

//Number of bits in an integer
var INT_BITS = 32;

//Constants
exports.INT_BITS  = INT_BITS;
exports.INT_MAX   =  0x7fffffff;
exports.INT_MIN   = -1<<(INT_BITS-1);

//Returns -1, 0, +1 depending on sign of x
exports.sign = function(v) {
  return (v > 0) - (v < 0);
}

//Computes absolute value of integer
exports.abs = function(v) {
  var mask = v >> (INT_BITS-1);
  return (v ^ mask) - mask;
}

//Computes minimum of integers x and y
exports.min = function(x, y) {
  return y ^ ((x ^ y) & -(x < y));
}

//Computes maximum of integers x and y
exports.max = function(x, y) {
  return x ^ ((x ^ y) & -(x < y));
}

//Checks if a number is a power of two
exports.isPow2 = function(v) {
  return !(v & (v-1)) && (!!v);
}

//Computes log base 2 of v
exports.log2 = function(v) {
  var r, shift;
  r =     (v > 0xFFFF) << 4; v >>>= r;
  shift = (v > 0xFF  ) << 3; v >>>= shift; r |= shift;
  shift = (v > 0xF   ) << 2; v >>>= shift; r |= shift;
  shift = (v > 0x3   ) << 1; v >>>= shift; r |= shift;
  return r | (v >> 1);
}

//Computes log base 10 of v
exports.log10 = function(v) {
  return  (v >= 1000000000) ? 9 : (v >= 100000000) ? 8 : (v >= 10000000) ? 7 :
          (v >= 1000000) ? 6 : (v >= 100000) ? 5 : (v >= 10000) ? 4 :
          (v >= 1000) ? 3 : (v >= 100) ? 2 : (v >= 10) ? 1 : 0;
}

//Counts number of bits
exports.popCount = function(v) {
  v = v - ((v >>> 1) & 0x55555555);
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  return ((v + (v >>> 4) & 0xF0F0F0F) * 0x1010101) >>> 24;
}

//Counts number of trailing zeros
function countTrailingZeros(v) {
  var c = 32;
  v &= -v;
  if (v) c--;
  if (v & 0x0000FFFF) c -= 16;
  if (v & 0x00FF00FF) c -= 8;
  if (v & 0x0F0F0F0F) c -= 4;
  if (v & 0x33333333) c -= 2;
  if (v & 0x55555555) c -= 1;
  return c;
}
exports.countTrailingZeros = countTrailingZeros;

//Rounds to next power of 2
exports.nextPow2 = function(v) {
  v += v === 0;
  --v;
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v + 1;
}

//Rounds down to previous power of 2
exports.prevPow2 = function(v) {
  v |= v >>> 1;
  v |= v >>> 2;
  v |= v >>> 4;
  v |= v >>> 8;
  v |= v >>> 16;
  return v - (v>>>1);
}

//Computes parity of word
exports.parity = function(v) {
  v ^= v >>> 16;
  v ^= v >>> 8;
  v ^= v >>> 4;
  v &= 0xf;
  return (0x6996 >>> v) & 1;
}

var REVERSE_TABLE = new Array(256);

(function(tab) {
  for(var i=0; i<256; ++i) {
    var v = i, r = i, s = 7;
    for (v >>>= 1; v; v >>>= 1) {
      r <<= 1;
      r |= v & 1;
      --s;
    }
    tab[i] = (r << s) & 0xff;
  }
})(REVERSE_TABLE);

//Reverse bits in a 32 bit word
exports.reverse = function(v) {
  return  (REVERSE_TABLE[ v         & 0xff] << 24) |
          (REVERSE_TABLE[(v >>> 8)  & 0xff] << 16) |
          (REVERSE_TABLE[(v >>> 16) & 0xff] << 8)  |
           REVERSE_TABLE[(v >>> 24) & 0xff];
}

//Interleave bits of 2 coordinates with 16 bits.  Useful for fast quadtree codes
exports.interleave2 = function(x, y) {
  x &= 0xFFFF;
  x = (x | (x << 8)) & 0x00FF00FF;
  x = (x | (x << 4)) & 0x0F0F0F0F;
  x = (x | (x << 2)) & 0x33333333;
  x = (x | (x << 1)) & 0x55555555;

  y &= 0xFFFF;
  y = (y | (y << 8)) & 0x00FF00FF;
  y = (y | (y << 4)) & 0x0F0F0F0F;
  y = (y | (y << 2)) & 0x33333333;
  y = (y | (y << 1)) & 0x55555555;

  return x | (y << 1);
}

//Extracts the nth interleaved component
exports.deinterleave2 = function(v, n) {
  v = (v >>> n) & 0x55555555;
  v = (v | (v >>> 1))  & 0x33333333;
  v = (v | (v >>> 2))  & 0x0F0F0F0F;
  v = (v | (v >>> 4))  & 0x00FF00FF;
  v = (v | (v >>> 16)) & 0x000FFFF;
  return (v << 16) >> 16;
}


//Interleave bits of 3 coordinates, each with 10 bits.  Useful for fast octree codes
exports.interleave3 = function(x, y, z) {
  x &= 0x3FF;
  x  = (x | (x<<16)) & 4278190335;
  x  = (x | (x<<8))  & 251719695;
  x  = (x | (x<<4))  & 3272356035;
  x  = (x | (x<<2))  & 1227133513;

  y &= 0x3FF;
  y  = (y | (y<<16)) & 4278190335;
  y  = (y | (y<<8))  & 251719695;
  y  = (y | (y<<4))  & 3272356035;
  y  = (y | (y<<2))  & 1227133513;
  x |= (y << 1);
  
  z &= 0x3FF;
  z  = (z | (z<<16)) & 4278190335;
  z  = (z | (z<<8))  & 251719695;
  z  = (z | (z<<4))  & 3272356035;
  z  = (z | (z<<2))  & 1227133513;
  
  return x | (z << 2);
}

//Extracts nth interleaved component of a 3-tuple
exports.deinterleave3 = function(v, n) {
  v = (v >>> n)       & 1227133513;
  v = (v | (v>>>2))   & 3272356035;
  v = (v | (v>>>4))   & 251719695;
  v = (v | (v>>>8))   & 4278190335;
  v = (v | (v>>>16))  & 0x3FF;
  return (v<<22)>>22;
}

//Computes next combination in colexicographic order (this is mistakenly called nextPermutation on the bit twiddling hacks page)
exports.nextCombination = function(v) {
  var t = v | (v - 1);
  return (t + 1) | (((~t & -~t) - 1) >>> (countTrailingZeros(v) + 1));
}


},{}],2:[function(require,module,exports){
"use strict"

var dup = require("dup")
var solve = require("robust-linear-solve")

function dot(a, b) {
  var s = 0.0
  var d = a.length
  for(var i=0; i<d; ++i) {
    s += a[i] * b[i]
  }
  return s
}

function barycentricCircumcenter(points) {
  var N = points.length
  if(N === 0) {
    return []
  }
  
  var D = points[0].length
  var A = dup([points.length+1, points.length+1], 1.0)
  var b = dup([points.length+1], 1.0)
  A[N][N] = 0.0
  for(var i=0; i<N; ++i) {
    for(var j=0; j<=i; ++j) {
      A[j][i] = A[i][j] = 2.0 * dot(points[i], points[j])
    }
    b[i] = dot(points[i], points[i])
  }
  var x = solve(A, b)

  var denom = 0.0
  var h = x[N+1]
  for(var i=0; i<h.length; ++i) {
    denom += h[i]
  }

  var y = new Array(N)
  for(var i=0; i<N; ++i) {
    var h = x[i]
    var numer = 0.0
    for(var j=0; j<h.length; ++j) {
      numer += h[j]
    }
    y[i] =  numer / denom
  }

  return y
}

function circumcenter(points) {
  if(points.length === 0) {
    return []
  }
  var D = points[0].length
  var result = dup([D])
  var weights = barycentricCircumcenter(points)
  for(var i=0; i<points.length; ++i) {
    for(var j=0; j<D; ++j) {
      result[j] += points[i][j] * weights[i]
    }
  }
  return result
}

circumcenter.barycenetric = barycentricCircumcenter
module.exports = circumcenter
},{"dup":4,"robust-linear-solve":16}],3:[function(require,module,exports){
"use strict"

var ch = require("incremental-convex-hull")
var uniq = require("uniq")

module.exports = triangulate

function LiftedPoint(p, i) {
  this.point = p
  this.index = i
}

function compareLifted(a, b) {
  var ap = a.point
  var bp = b.point
  var d = ap.length
  for(var i=0; i<d; ++i) {
    var s = bp[i] - ap[i]
    if(s) {
      return s
    }
  }
  return 0
}

function triangulate1D(n, points, includePointAtInfinity) {
  if(n === 1) {
    if(includePointAtInfinity) {
      return [ [-1, 0] ]
    } else {
      return []
    }
  }
  var lifted = points.map(function(p, i) {
    return [ p[0], i ]
  })
  lifted.sort(function(a,b) {
    return a[0] - b[0]
  })
  var cells = new Array(n - 1)
  for(var i=1; i<n; ++i) {
    var a = lifted[i-1]
    var b = lifted[i]
    cells[i-1] = [ a[1], b[1] ]
  }
  if(includePointAtInfinity) {
    cells.push(
      [ -1, cells[0][1], ],
      [ cells[n-1][1], -1 ])
  }
  return cells
}

function triangulate(points, includePointAtInfinity) {
  var n = points.length
  if(n === 0) {
    return []
  }
  
  var d = points[0].length
  if(d < 1) {
    return []
  }

  //Special case:  For 1D we can just sort the points
  if(d === 1) {
    return triangulate1D(n, points, includePointAtInfinity)
  }
  
  //Lift points, sort
  var lifted = new Array(n)
  var upper = 1.0
  for(var i=0; i<n; ++i) {
    var p = points[i]
    var x = new Array(d+1)
    var l = 0.0
    for(var j=0; j<d; ++j) {
      var v = p[j]
      x[j] = v
      l += v * v
    }
    x[d] = l
    lifted[i] = new LiftedPoint(x, i)
    upper = Math.max(l, upper)
  }
  uniq(lifted, compareLifted)
  
  //Double points
  n = lifted.length

  //Create new list of points
  var dpoints = new Array(n + d + 1)
  var dindex = new Array(n + d + 1)

  //Add steiner points at top
  var u = (d+1) * (d+1) * upper
  var y = new Array(d+1)
  for(var i=0; i<=d; ++i) {
    y[i] = 0.0
  }
  y[d] = u

  dpoints[0] = y.slice()
  dindex[0] = -1

  for(var i=0; i<=d; ++i) {
    var x = y.slice()
    x[i] = 1
    dpoints[i+1] = x
    dindex[i+1] = -1
  }

  //Copy rest of the points over
  for(var i=0; i<n; ++i) {
    var h = lifted[i]
    dpoints[i + d + 1] = h.point
    dindex[i + d + 1] =  h.index
  }

  //Construct convex hull
  var hull = ch(dpoints, false)
  if(includePointAtInfinity) {
    hull = hull.filter(function(cell) {
      var count = 0
      for(var j=0; j<=d; ++j) {
        var v = dindex[cell[j]]
        if(v < 0) {
          if(++count >= 2) {
            return false
          }
        }
        cell[j] = v
      }
      return true
    })
  } else {
    hull = hull.filter(function(cell) {
      for(var i=0; i<=d; ++i) {
        var v = dindex[cell[i]]
        if(v < 0) {
          return false
        }
        cell[i] = v
      }
      return true
    })
  }

  if(d & 1) {
    for(var i=0; i<hull.length; ++i) {
      var h = hull[i]
      var x = h[0]
      h[0] = h[1]
      h[1] = x
    }
  }

  return hull
}
},{"incremental-convex-hull":5,"uniq":25}],4:[function(require,module,exports){
"use strict"

function dupe_array(count, value, i) {
  var c = count[i]|0
  if(c <= 0) {
    return []
  }
  var result = new Array(c), j
  if(i === count.length-1) {
    for(j=0; j<c; ++j) {
      result[j] = value
    }
  } else {
    for(j=0; j<c; ++j) {
      result[j] = dupe_array(count, value, i+1)
    }
  }
  return result
}

function dupe_number(count, value) {
  var result, i
  result = new Array(count)
  for(i=0; i<count; ++i) {
    result[i] = value
  }
  return result
}

function dupe(count, value) {
  if(typeof value === "undefined") {
    value = 0
  }
  switch(typeof count) {
    case "number":
      if(count > 0) {
        return dupe_number(count|0, value)
      }
    break
    case "object":
      if(typeof (count.length) === "number") {
        return dupe_array(count, value, 0)
      }
    break
  }
  return []
}

module.exports = dupe
},{}],5:[function(require,module,exports){
"use strict"

//High level idea:
// 1. Use Clarkson's incremental construction to find convex hull
// 2. Point location in triangulation by jump and walk

module.exports = incrementalConvexHull

var orient = require("robust-orientation")
var compareCell = require("simplicial-complex").compareCells

function compareInt(a, b) {
  return a - b
}

function Simplex(vertices, adjacent, boundary) {
  this.vertices = vertices
  this.adjacent = adjacent
  this.boundary = boundary
  this.lastVisited = -1
}

Simplex.prototype.flip = function() {
  var t = this.vertices[0]
  this.vertices[0] = this.vertices[1]
  this.vertices[1] = t
  var u = this.adjacent[0]
  this.adjacent[0] = this.adjacent[1]
  this.adjacent[1] = u
}

function GlueFacet(vertices, cell, index) {
  this.vertices = vertices
  this.cell = cell
  this.index = index
}

function compareGlue(a, b) {
  return compareCell(a.vertices, b.vertices)
}

function bakeOrient(d) {
  var code = ["function orient(){var tuple=this.tuple;return test("]
  for(var i=0; i<=d; ++i) {
    if(i > 0) {
      code.push(",")
    }
    code.push("tuple[", i, "]")
  }
  code.push(")}return orient")
  var proc = new Function("test", code.join(""))
  var test = orient[d+1]
  if(!test) {
    test = orient
  }
  return proc(test)
}

var BAKED = []

function Triangulation(dimension, vertices, simplices) {
  this.dimension = dimension
  this.vertices = vertices
  this.simplices = simplices
  this.interior = simplices.filter(function(c) {
    return !c.boundary
  })

  this.tuple = new Array(dimension+1)
  for(var i=0; i<=dimension; ++i) {
    this.tuple[i] = this.vertices[i]
  }

  var o = BAKED[dimension]
  if(!o) {
    o = BAKED[dimension] = bakeOrient(dimension)
  }
  this.orient = o
}

var proto = Triangulation.prototype

//Degenerate situation where we are on boundary, but coplanar to face
proto.handleBoundaryDegeneracy = function(cell, point) {
  var d = this.dimension
  var n = this.vertices.length - 1
  var tuple = this.tuple
  var verts = this.vertices

  //Dumb solution: Just do dfs from boundary cell until we find any peak, or terminate
  var toVisit = [ cell ]
  cell.lastVisited = -n
  while(toVisit.length > 0) {
    cell = toVisit.pop()
    var cellVerts = cell.vertices
    var cellAdj = cell.adjacent
    for(var i=0; i<=d; ++i) {
      var neighbor = cellAdj[i]
      if(!neighbor.boundary || neighbor.lastVisited <= -n) {
        continue
      }
      var nv = neighbor.vertices
      for(var j=0; j<=d; ++j) {
        var vv = nv[j]
        if(vv < 0) {
          tuple[j] = point
        } else {
          tuple[j] = verts[vv]
        }
      }
      var o = this.orient()
      if(o > 0) {
        return neighbor
      }
      neighbor.lastVisited = -n
      if(o === 0) {
        toVisit.push(neighbor)
      }
    }
  }
  return null
}

proto.walk = function(point, random) {
  //Alias local properties
  var n = this.vertices.length - 1
  var d = this.dimension
  var verts = this.vertices
  var tuple = this.tuple

  //Compute initial jump cell
  var initIndex = random ? (this.interior.length * Math.random())|0 : (this.interior.length-1)
  var cell = this.interior[ initIndex ]

  //Start walking
outerLoop:
  while(!cell.boundary) {
    var cellVerts = cell.vertices
    var cellAdj = cell.adjacent

    for(var i=0; i<=d; ++i) {
      tuple[i] = verts[cellVerts[i]]
    }
    cell.lastVisited = n

    //Find farthest adjacent cell
    for(var i=0; i<=d; ++i) {
      var neighbor = cellAdj[i]
      if(neighbor.lastVisited >= n) {
        continue
      }
      var prev = tuple[i]
      tuple[i] = point
      var o = this.orient()
      tuple[i] = prev
      if(o < 0) {
        cell = neighbor
        continue outerLoop
      } else {
        if(!neighbor.boundary) {
          neighbor.lastVisited = n
        } else {
          neighbor.lastVisited = -n
        }
      }
    }
    return
  }

  return cell
}

proto.addPeaks = function(point, cell) {
  var n = this.vertices.length - 1
  var d = this.dimension
  var verts = this.vertices
  var tuple = this.tuple
  var interior = this.interior
  var simplices = this.simplices

  //Walking finished at boundary, time to add peaks
  var tovisit = [ cell ]

  //Stretch initial boundary cell into a peak
  cell.lastVisited = n
  cell.vertices[cell.vertices.indexOf(-1)] = n
  cell.boundary = false
  interior.push(cell)

  //Record a list of all new boundaries created by added peaks so we can glue them together when we are all done
  var glueFacets = []

  //Do a traversal of the boundary walking outward from starting peak
  while(tovisit.length > 0) {
    //Pop off peak and walk over adjacent cells
    var cell = tovisit.pop()
    var cellVerts = cell.vertices
    var cellAdj = cell.adjacent
    var indexOfN = cellVerts.indexOf(n)
    if(indexOfN < 0) {
      continue
    }

    for(var i=0; i<=d; ++i) {
      if(i === indexOfN) {
        continue
      }

      //For each boundary neighbor of the cell
      var neighbor = cellAdj[i]
      if(!neighbor.boundary || neighbor.lastVisited >= n) {
        continue
      }

      var nv = neighbor.vertices

      //Test if neighbor is a peak
      if(neighbor.lastVisited !== -n) {      
        //Compute orientation of p relative to each boundary peak
        var indexOfNeg1 = 0
        for(var j=0; j<=d; ++j) {
          if(nv[j] < 0) {
            indexOfNeg1 = j
            tuple[j] = point
          } else {
            tuple[j] = verts[nv[j]]
          }
        }
        var o = this.orient()

        //Test if neighbor cell is also a peak
        if(o > 0) {
          nv[indexOfNeg1] = n
          neighbor.boundary = false
          interior.push(neighbor)
          tovisit.push(neighbor)
          neighbor.lastVisited = n
          continue
        } else {
          neighbor.lastVisited = -n
        }
      }

      var na = neighbor.adjacent

      //Otherwise, replace neighbor with new face
      var vverts = cellVerts.slice()
      var vadj = cellAdj.slice()
      var ncell = new Simplex(vverts, vadj, true)
      simplices.push(ncell)

      //Connect to neighbor
      var opposite = na.indexOf(cell)
      if(opposite < 0) {
        continue
      }
      na[opposite] = ncell
      vadj[indexOfN] = neighbor

      //Connect to cell
      vverts[i] = -1
      vadj[i] = cell
      cellAdj[i] = ncell

      //Flip facet
      ncell.flip()

      //Add to glue list
      for(var j=0; j<=d; ++j) {
        var uu = vverts[j]
        if(uu < 0 || uu === n) {
          continue
        }
        var nface = new Array(d-1)
        var nptr = 0
        for(var k=0; k<=d; ++k) {
          var vv = vverts[k]
          if(vv < 0 || k === j) {
            continue
          }
          nface[nptr++] = vv
        }
        glueFacets.push(new GlueFacet(nface, ncell, j))
      }
    }
  }

  //Glue boundary facets together
  glueFacets.sort(compareGlue)

  for(var i=0; i+1<glueFacets.length; i+=2) {
    var a = glueFacets[i]
    var b = glueFacets[i+1]
    var ai = a.index
    var bi = b.index
    if(ai < 0 || bi < 0) {
      continue
    }
    a.cell.adjacent[a.index] = b.cell
    b.cell.adjacent[b.index] = a.cell
  }
}

proto.insert = function(point, random) {
  //Add point
  var verts = this.vertices
  verts.push(point)

  var cell = this.walk(point, random)
  if(!cell) {
    return
  }

  //Alias local properties
  var d = this.dimension
  var tuple = this.tuple

  //Degenerate case: If point is coplanar to cell, then walk until we find a non-degenerate boundary
  for(var i=0; i<=d; ++i) {
    var vv = cell.vertices[i]
    if(vv < 0) {
      tuple[i] = point
    } else {
      tuple[i] = verts[vv]
    }
  }
  var o = this.orient(tuple)
  if(o < 0) {
    return
  } else if(o === 0) {
    cell = this.handleBoundaryDegeneracy(cell, point)
    if(!cell) {
      return
    }
  }

  //Add peaks
  this.addPeaks(point, cell)
}

//Extract all boundary cells
proto.boundary = function() {
  var d = this.dimension
  var boundary = []
  var cells = this.simplices
  var nc = cells.length
  for(var i=0; i<nc; ++i) {
    var c = cells[i]
    if(c.boundary) {
      var bcell = new Array(d)
      var cv = c.vertices
      var ptr = 0
      var parity = 0
      for(var j=0; j<=d; ++j) {
        if(cv[j] >= 0) {
          bcell[ptr++] = cv[j]
        } else {
          parity = j&1
        }
      }
      if(parity === (d&1)) {
        var t = bcell[0]
        bcell[0] = bcell[1]
        bcell[1] = t
      }
      boundary.push(bcell)
    }
  }
  return boundary
}

function incrementalConvexHull(points, randomSearch) {
  var n = points.length
  if(n === 0) {
    throw new Error("Must have at least d+1 points")
  }
  var d = points[0].length
  if(n <= d) {
    throw new Error("Must input at least d+1 points")
  }

  //FIXME: This could be degenerate, but need to select d+1 non-coplanar points to bootstrap process
  var initialSimplex = points.slice(0, d+1)

  //Make sure initial simplex is positively oriented
  var o = orient.apply(void 0, initialSimplex)
  if(o === 0) {
    throw new Error("Input not in general position")
  }
  var initialCoords = new Array(d+1)
  for(var i=0; i<=d; ++i) {
    initialCoords[i] = i
  }
  if(o < 0) {
    initialCoords[0] = 1
    initialCoords[1] = 0
  }

  //Create initial topological index, glue pointers together (kind of messy)
  var initialCell = new Simplex(initialCoords, new Array(d+1), false)
  var boundary = initialCell.adjacent
  var list = new Array(d+2)
  for(var i=0; i<=d; ++i) {
    var verts = initialCoords.slice()
    for(var j=0; j<=d; ++j) {
      if(j === i) {
        verts[j] = -1
      }
    }
    var t = verts[0]
    verts[0] = verts[1]
    verts[1] = t
    var cell = new Simplex(verts, new Array(d+1), true)
    boundary[i] = cell
    list[i] = cell
  }
  list[d+1] = initialCell
  for(var i=0; i<=d; ++i) {
    var verts = boundary[i].vertices
    var adj = boundary[i].adjacent
    for(var j=0; j<=d; ++j) {
      var v = verts[j]
      if(v < 0) {
        adj[j] = initialCell
        continue
      }
      for(var k=0; k<=d; ++k) {
        if(boundary[k].vertices.indexOf(v) < 0) {
          adj[j] = boundary[k]
        }
      }
    }
  }

  //Initialize triangles
  var triangles = new Triangulation(d, initialSimplex, list)

  //Insert remaining points
  var useRandom = !!randomSearch
  for(var i=d+1; i<n; ++i) {
    triangles.insert(points[i], useRandom)
  }
  
  //Extract boundary cells
  return triangles.boundary()
}
},{"robust-orientation":17,"simplicial-complex":21}],6:[function(require,module,exports){
/**
 * Mnemonist Fixed Reverse Heap
 * =============================
 *
 * Static heap implementation with fixed capacity. It's a "reverse" heap
 * because it stores the elements in reverse so we can replace the worst
 * item in logarithmic time. As such, one cannot pop this heap but can only
 * consume it at the end. This structure is very efficient when trying to
 * find the n smallest/largest items from a larger query (k nearest neigbors
 * for instance).
 */
var comparators = require('./utils/comparators.js'),
    Heap = require('./heap.js');

var DEFAULT_COMPARATOR = comparators.DEFAULT_COMPARATOR,
    reverseComparator = comparators.reverseComparator;

/**
 * Helper functions.
 */

/**
 * Function used to sift up.
 *
 * @param {function} compare - Comparison function.
 * @param {array}    heap    - Array storing the heap's data.
 * @param {number}   size    - Heap's true size.
 * @param {number}   i       - Index.
 */
function siftUp(compare, heap, size, i) {
  var endIndex = size,
      startIndex = i,
      item = heap[i],
      childIndex = 2 * i + 1,
      rightIndex;

  while (childIndex < endIndex) {
    rightIndex = childIndex + 1;

    if (
      rightIndex < endIndex &&
      compare(heap[childIndex], heap[rightIndex]) >= 0
    ) {
      childIndex = rightIndex;
    }

    heap[i] = heap[childIndex];
    i = childIndex;
    childIndex = 2 * i + 1;
  }

  heap[i] = item;
  Heap.siftDown(compare, heap, startIndex, i);
}

/**
 * Fully consumes the given heap.
 *
 * @param  {function} ArrayClass - Array class to use.
 * @param  {function} compare    - Comparison function.
 * @param  {array}    heap       - Array storing the heap's data.
 * @param  {number}   size       - True size of the heap.
 * @return {array}
 */
function consume(ArrayClass, compare, heap, size) {
  var l = size,
      i = l;

  var array = new ArrayClass(size),
      lastItem,
      item;

  while (i > 0) {
    lastItem = heap[--i];

    if (i !== 0) {
      item = heap[0];
      heap[0] = lastItem;
      siftUp(compare, heap, --size, 0);
      lastItem = item;
    }

    array[i] = lastItem;
  }

  return array;
}

/**
 * Binary Minimum FixedReverseHeap.
 *
 * @constructor
 * @param {function} ArrayClass - The class of array to use.
 * @param {function} comparator - Comparator function.
 * @param {number}   capacity   - Maximum number of items to keep.
 */
function FixedReverseHeap(ArrayClass, comparator, capacity) {

  // Comparator can be omitted
  if (arguments.length === 2) {
    capacity = comparator;
    comparator = null;
  }

  this.ArrayClass = ArrayClass;
  this.capacity = capacity;

  this.items = new ArrayClass(capacity);
  this.clear();
  this.comparator = comparator || DEFAULT_COMPARATOR;

  if (typeof capacity !== 'number' && capacity <= 0)
    throw new Error('mnemonist/FixedReverseHeap.constructor: capacity should be a number > 0.');

  if (typeof this.comparator !== 'function')
    throw new Error('mnemonist/FixedReverseHeap.constructor: given comparator should be a function.');

  this.comparator = reverseComparator(this.comparator);
}

/**
 * Method used to clear the heap.
 *
 * @return {undefined}
 */
FixedReverseHeap.prototype.clear = function() {

  // Properties
  this.size = 0;
};

/**
 * Method used to push an item into the heap.
 *
 * @param  {any}    item - Item to push.
 * @return {number}
 */
FixedReverseHeap.prototype.push = function(item) {

  // Still some place
  if (this.size < this.capacity) {
    this.items[this.size] = item;
    Heap.siftDown(this.comparator, this.items, 0, this.size);
    this.size++;
  }

  // Heap is full, we need to replace worst item
  else {

    if (this.comparator(item, this.items[0]) > 0)
      Heap.replace(this.comparator, this.items, item);
  }

  return this.size;
};

/**
 * Method used to peek the worst item in the heap.
 *
 * @return {any}
 */
FixedReverseHeap.prototype.peek = function() {
  return this.items[0];
};

/**
 * Method used to consume the heap fully and return its items as a sorted array.
 *
 * @return {array}
 */
FixedReverseHeap.prototype.consume = function() {
  var items = consume(this.ArrayClass, this.comparator, this.items, this.size);
  this.size = 0;

  return items;
};

/**
 * Method used to convert the heap to an array. Note that it basically clone
 * the heap and consumes it completely. This is hardly performant.
 *
 * @return {array}
 */
FixedReverseHeap.prototype.toArray = function() {
  return consume(this.ArrayClass, this.comparator, this.items.slice(0, this.size), this.size);
};

/**
 * Convenience known methods.
 */
FixedReverseHeap.prototype.inspect = function() {
  var proxy = this.toArray();

  // Trick so that node displays the name of the constructor
  Object.defineProperty(proxy, 'constructor', {
    value: FixedReverseHeap,
    enumerable: false
  });

  return proxy;
};

if (typeof Symbol !== 'undefined')
  FixedReverseHeap.prototype[Symbol.for('nodejs.util.inspect.custom')] = FixedReverseHeap.prototype.inspect;

/**
 * Exporting.
 */
module.exports = FixedReverseHeap;

},{"./heap.js":7,"./utils/comparators.js":10}],7:[function(require,module,exports){
/**
 * Mnemonist Binary Heap
 * ======================
 *
 * Binary heap implementation.
 */
var forEach = require('obliterator/foreach'),
    comparators = require('./utils/comparators.js'),
    iterables = require('./utils/iterables.js');

var DEFAULT_COMPARATOR = comparators.DEFAULT_COMPARATOR,
    reverseComparator = comparators.reverseComparator;

/**
 * Heap helper functions.
 */

/**
 * Function used to sift down.
 *
 * @param {function} compare    - Comparison function.
 * @param {array}    heap       - Array storing the heap's data.
 * @param {number}   startIndex - Starting index.
 * @param {number}   i          - Index.
 */
function siftDown(compare, heap, startIndex, i) {
  var item = heap[i],
      parentIndex,
      parent;

  while (i > startIndex) {
    parentIndex = (i - 1) >> 1;
    parent = heap[parentIndex];

    if (compare(item, parent) < 0) {
      heap[i] = parent;
      i = parentIndex;
      continue;
    }

    break;
  }

  heap[i] = item;
}

/**
 * Function used to sift up.
 *
 * @param {function} compare - Comparison function.
 * @param {array}    heap    - Array storing the heap's data.
 * @param {number}   i       - Index.
 */
function siftUp(compare, heap, i) {
  var endIndex = heap.length,
      startIndex = i,
      item = heap[i],
      childIndex = 2 * i + 1,
      rightIndex;

  while (childIndex < endIndex) {
    rightIndex = childIndex + 1;

    if (
      rightIndex < endIndex &&
      compare(heap[childIndex], heap[rightIndex]) >= 0
    ) {
      childIndex = rightIndex;
    }

    heap[i] = heap[childIndex];
    i = childIndex;
    childIndex = 2 * i + 1;
  }

  heap[i] = item;
  siftDown(compare, heap, startIndex, i);
}

/**
 * Function used to push an item into a heap represented by a raw array.
 *
 * @param {function} compare - Comparison function.
 * @param {array}    heap    - Array storing the heap's data.
 * @param {any}      item    - Item to push.
 */
function push(compare, heap, item) {
  heap.push(item);
  siftDown(compare, heap, 0, heap.length - 1);
}

/**
 * Function used to pop an item from a heap represented by a raw array.
 *
 * @param  {function} compare - Comparison function.
 * @param  {array}    heap    - Array storing the heap's data.
 * @return {any}
 */
function pop(compare, heap) {
  var lastItem = heap.pop();

  if (heap.length !== 0) {
    var item = heap[0];
    heap[0] = lastItem;
    siftUp(compare, heap, 0);

    return item;
  }

  return lastItem;
}

/**
 * Function used to pop the heap then push a new value into it, thus "replacing"
 * it.
 *
 * @param  {function} compare - Comparison function.
 * @param  {array}    heap    - Array storing the heap's data.
 * @param  {any}      item    - The item to push.
 * @return {any}
 */
function replace(compare, heap, item) {
  if (heap.length === 0)
    throw new Error('mnemonist/heap.replace: cannot pop an empty heap.');

  var popped = heap[0];
  heap[0] = item;
  siftUp(compare, heap, 0);

  return popped;
}

/**
 * Function used to push an item in the heap then pop the heap and return the
 * popped value.
 *
 * @param  {function} compare - Comparison function.
 * @param  {array}    heap    - Array storing the heap's data.
 * @param  {any}      item    - The item to push.
 * @return {any}
 */
function pushpop(compare, heap, item) {
  var tmp;

  if (heap.length !== 0 && compare(heap[0], item) < 0) {
    tmp = heap[0];
    heap[0] = item;
    item = tmp;
    siftUp(compare, heap, 0);
  }

  return item;
}

/**
 * Converts and array into an abstract heap in linear time.
 *
 * @param {function} compare - Comparison function.
 * @param {array}    array   - Target array.
 */
function heapify(compare, array) {
  var n = array.length,
      l = n >> 1,
      i = l;

  while (--i >= 0)
    siftUp(compare, array, i);
}

/**
 * Fully consumes the given heap.
 *
 * @param  {function} compare - Comparison function.
 * @param  {array}    heap    - Array storing the heap's data.
 * @return {array}
 */
function consume(compare, heap) {
  var l = heap.length,
      i = 0;

  var array = new Array(l);

  while (i < l)
    array[i++] = pop(compare, heap);

  return array;
}

/**
 * Function used to retrieve the n smallest items from the given iterable.
 *
 * @param {function} compare  - Comparison function.
 * @param {number}   n        - Number of top items to retrieve.
 * @param {any}      iterable - Arbitrary iterable.
 * @param {array}
 */
function nsmallest(compare, n, iterable) {
  if (arguments.length === 2) {
    iterable = n;
    n = compare;
    compare = DEFAULT_COMPARATOR;
  }

  var reverseCompare = reverseComparator(compare);

  var i, l, v;

  var min = Infinity;

  var result;

  // If n is equal to 1, it's just a matter of finding the minimum
  if (n === 1) {
    if (iterables.isArrayLike(iterable)) {
      for (i = 0, l = iterable.length; i < l; i++) {
        v = iterable[i];

        if (min === Infinity || compare(v, min) < 0)
          min = v;
      }

      result = new iterable.constructor(1);
      result[0] = min;

      return result;
    }

    forEach(iterable, function(value) {
      if (min === Infinity || compare(value, min) < 0)
        min = value;
    });

    return [min];
  }

  if (iterables.isArrayLike(iterable)) {

    // If n > iterable length, we just clone and sort
    if (n >= iterable.length)
      return iterable.slice().sort(compare);

    result = iterable.slice(0, n);
    heapify(reverseCompare, result);

    for (i = n, l = iterable.length; i < l; i++)
      if (reverseCompare(iterable[i], result[0]) > 0)
        replace(reverseCompare, result, iterable[i]);

    // NOTE: if n is over some number, it becomes faster to consume the heap
    return result.sort(compare);
  }

  // Correct for size
  var size = iterables.guessLength(iterable);

  if (size !== null && size < n)
    n = size;

  result = new Array(n);
  i = 0;

  forEach(iterable, function(value) {
    if (i < n) {
      result[i] = value;
    }
    else {
      if (i === n)
        heapify(reverseCompare, result);

      if (reverseCompare(value, result[0]) > 0)
        replace(reverseCompare, result, value);
    }

    i++;
  });

  if (result.length > i)
    result.length = i;

  // NOTE: if n is over some number, it becomes faster to consume the heap
  return result.sort(compare);
}

/**
 * Function used to retrieve the n largest items from the given iterable.
 *
 * @param {function} compare  - Comparison function.
 * @param {number}   n        - Number of top items to retrieve.
 * @param {any}      iterable - Arbitrary iterable.
 * @param {array}
 */
function nlargest(compare, n, iterable) {
  if (arguments.length === 2) {
    iterable = n;
    n = compare;
    compare = DEFAULT_COMPARATOR;
  }

  var reverseCompare = reverseComparator(compare);

  var i, l, v;

  var max = -Infinity;

  var result;

  // If n is equal to 1, it's just a matter of finding the maximum
  if (n === 1) {
    if (iterables.isArrayLike(iterable)) {
      for (i = 0, l = iterable.length; i < l; i++) {
        v = iterable[i];

        if (max === -Infinity || compare(v, max) > 0)
          max = v;
      }

      result = new iterable.constructor(1);
      result[0] = max;

      return result;
    }

    forEach(iterable, function(value) {
      if (max === -Infinity || compare(value, max) > 0)
        max = value;
    });

    return [max];
  }

  if (iterables.isArrayLike(iterable)) {

    // If n > iterable length, we just clone and sort
    if (n >= iterable.length)
      return iterable.slice().sort(reverseCompare);

    result = iterable.slice(0, n);
    heapify(compare, result);

    for (i = n, l = iterable.length; i < l; i++)
      if (compare(iterable[i], result[0]) > 0)
        replace(compare, result, iterable[i]);

    // NOTE: if n is over some number, it becomes faster to consume the heap
    return result.sort(reverseCompare);
  }

  // Correct for size
  var size = iterables.guessLength(iterable);

  if (size !== null && size < n)
    n = size;

  result = new Array(n);
  i = 0;

  forEach(iterable, function(value) {
    if (i < n) {
      result[i] = value;
    }
    else {
      if (i === n)
        heapify(compare, result);

      if (compare(value, result[0]) > 0)
        replace(compare, result, value);
    }

    i++;
  });

  if (result.length > i)
    result.length = i;

  // NOTE: if n is over some number, it becomes faster to consume the heap
  return result.sort(reverseCompare);
}

/**
 * Binary Minimum Heap.
 *
 * @constructor
 * @param {function} comparator - Comparator function to use.
 */
function Heap(comparator) {
  this.clear();
  this.comparator = comparator || DEFAULT_COMPARATOR;

  if (typeof this.comparator !== 'function')
    throw new Error('mnemonist/Heap.constructor: given comparator should be a function.');
}

/**
 * Method used to clear the heap.
 *
 * @return {undefined}
 */
Heap.prototype.clear = function() {

  // Properties
  this.items = [];
  this.size = 0;
};

/**
 * Method used to push an item into the heap.
 *
 * @param  {any}    item - Item to push.
 * @return {number}
 */
Heap.prototype.push = function(item) {
  push(this.comparator, this.items, item);
  return ++this.size;
};

/**
 * Method used to retrieve the "first" item of the heap.
 *
 * @return {any}
 */
Heap.prototype.peek = function() {
  return this.items[0];
};

/**
 * Method used to retrieve & remove the "first" item of the heap.
 *
 * @return {any}
 */
Heap.prototype.pop = function() {
  if (this.size !== 0)
    this.size--;

  return pop(this.comparator, this.items);
};

/**
 * Method used to pop the heap, then push an item and return the popped
 * item.
 *
 * @param  {any} item - Item to push into the heap.
 * @return {any}
 */
Heap.prototype.replace = function(item) {
  return replace(this.comparator, this.items, item);
};

/**
 * Method used to push the heap, the pop it and return the pooped item.
 *
 * @param  {any} item - Item to push into the heap.
 * @return {any}
 */
Heap.prototype.pushpop = function(item) {
  return pushpop(this.comparator, this.items, item);
};

/**
 * Method used to consume the heap fully and return its items as a sorted array.
 *
 * @return {array}
 */
Heap.prototype.consume = function() {
  this.size = 0;
  return consume(this.comparator, this.items);
};

/**
 * Method used to convert the heap to an array. Note that it basically clone
 * the heap and consumes it completely. This is hardly performant.
 *
 * @return {array}
 */
Heap.prototype.toArray = function() {
  return consume(this.comparator, this.items.slice());
};

/**
 * Convenience known methods.
 */
Heap.prototype.inspect = function() {
  var proxy = this.toArray();

  // Trick so that node displays the name of the constructor
  Object.defineProperty(proxy, 'constructor', {
    value: Heap,
    enumerable: false
  });

  return proxy;
};

if (typeof Symbol !== 'undefined')
  Heap.prototype[Symbol.for('nodejs.util.inspect.custom')] = Heap.prototype.inspect;

/**
 * Binary Maximum Heap.
 *
 * @constructor
 * @param {function} comparator - Comparator function to use.
 */
function MaxHeap(comparator) {
  this.clear();
  this.comparator = comparator || DEFAULT_COMPARATOR;

  if (typeof this.comparator !== 'function')
    throw new Error('mnemonist/MaxHeap.constructor: given comparator should be a function.');

  this.comparator = reverseComparator(this.comparator);
}

MaxHeap.prototype = Heap.prototype;

/**
 * Static @.from function taking an arbitrary iterable & converting it into
 * a heap.
 *
 * @param  {Iterable} iterable   - Target iterable.
 * @param  {function} comparator - Custom comparator function.
 * @return {Heap}
 */
Heap.from = function(iterable, comparator) {
  var heap = new Heap(comparator);

  var items;

  // If iterable is an array, we can be clever about it
  if (iterables.isArrayLike(iterable))
    items = iterable.slice();
  else
    items = iterables.toArray(iterable);

  heapify(heap.comparator, items);
  heap.items = items;
  heap.size = items.length;

  return heap;
};

MaxHeap.from = function(iterable, comparator) {
  var heap = new MaxHeap(comparator);

  var items;

  // If iterable is an array, we can be clever about it
  if (iterables.isArrayLike(iterable))
    items = iterable.slice();
  else
    items = iterables.toArray(iterable);

  heapify(heap.comparator, items);
  heap.items = items;
  heap.size = items.length;

  return heap;
};

/**
 * Exporting.
 */
Heap.siftUp = siftUp;
Heap.siftDown = siftDown;
Heap.push = push;
Heap.pop = pop;
Heap.replace = replace;
Heap.pushpop = pushpop;
Heap.heapify = heapify;
Heap.consume = consume;

Heap.nsmallest = nsmallest;
Heap.nlargest = nlargest;

Heap.MinHeap = Heap;
Heap.MaxHeap = MaxHeap;

module.exports = Heap;

},{"./utils/comparators.js":10,"./utils/iterables.js":11,"obliterator/foreach":13}],8:[function(require,module,exports){
/**
 * Mnemonist KDTree
 * =================
 *
 * Low-level JavaScript implementation of a k-dimensional tree.
 */
var iterables = require('./utils/iterables.js');
var typed = require('./utils/typed-arrays.js');
var createTupleComparator = require('./utils/comparators.js').createTupleComparator;
var FixedReverseHeap = require('./fixed-reverse-heap.js');
var inplaceQuickSortIndices = require('./sort/quick.js').inplaceQuickSortIndices;

/**
 * Helper function used to compute the squared distance between a query point
 * and an indexed points whose values are stored in a tree's axes.
 *
 * Note that squared distance is used instead of euclidean to avoid
 * costly sqrt computations.
 *
 * @param  {number} dimensions - Number of dimensions.
 * @param  {array}  axes       - Axes data.
 * @param  {number} pivot      - Pivot.
 * @param  {array}  point      - Query point.
 * @return {number}
 */
function squaredDistanceAxes(dimensions, axes, pivot, b) {
  var d;

  var dist = 0,
      step;

  for (d = 0; d < dimensions; d++) {
    step = axes[d][pivot] - b[d];
    dist += step * step;
  }

  return dist;
}

/**
 * Helper function used to reshape input data into low-level axes data.
 *
 * @param  {number} dimensions - Number of dimensions.
 * @param  {array}  data       - Data in the shape [label, [x, y, z...]]
 * @return {object}
 */
function reshapeIntoAxes(dimensions, data) {
  var l = data.length;

  var axes = new Array(dimensions),
      labels = new Array(l),
      axis;

  var PointerArray = typed.getPointerArray(l);

  var ids = new PointerArray(l);

  var d, i, row;

  var f = true;

  for (d = 0; d < dimensions; d++) {
    axis = new Float64Array(l);

    for (i = 0; i < l; i++) {
      row = data[i];
      axis[i] = row[1][d];

      if (f) {
        labels[i] = row[0];
        ids[i] = i;
      }
    }

    f = false;
    axes[d] = axis;
  }

  return {axes: axes, ids: ids, labels: labels};
}

/**
 * Helper function used to build a kd-tree from axes data.
 *
 * @param  {number} dimensions - Number of dimensions.
 * @param  {array}  axes       - Axes.
 * @param  {array}  ids        - Indices to sort.
 * @param  {array}  labels     - Point labels.
 * @return {object}
 */
function buildTree(dimensions, axes, ids, labels) {
  var l = labels.length;

  // NOTE: +1 because we need to keep 0 as null pointer
  var PointerArray = typed.getPointerArray(l + 1);

  // Building the tree
  var pivots = new PointerArray(l),
      lefts = new PointerArray(l),
      rights = new PointerArray(l);

  var stack = [[0, 0, ids.length, -1, 0]],
      step,
      parent,
      direction,
      median,
      pivot,
      lo,
      hi;

  var d, i = 0;

  while (stack.length !== 0) {
    step = stack.pop();

    d = step[0];
    lo = step[1];
    hi = step[2];
    parent = step[3];
    direction = step[4];

    inplaceQuickSortIndices(axes[d], ids, lo, hi);

    l = hi - lo;
    median = lo + (l >>> 1); // Fancy floor(l / 2)
    pivot = ids[median];
    pivots[i] = pivot;

    if (parent > -1) {
      if (direction === 0)
        lefts[parent] = i + 1;
      else
        rights[parent] = i + 1;
    }

    d = (d + 1) % dimensions;

    // Right
    if (median !== lo && median !== hi - 1) {
      stack.push([d, median + 1, hi, i, 1]);
    }

    // Left
    if (median !== lo) {
      stack.push([d, lo, median, i, 0]);
    }

    i++;
  }

  return {
    axes: axes,
    labels: labels,
    pivots: pivots,
    lefts: lefts,
    rights: rights
  };
}

/**
 * KDTree.
 *
 * @constructor
 */
function KDTree(dimensions, build) {
  this.dimensions = dimensions;
  this.visited = 0;

  this.axes = build.axes;
  this.labels = build.labels;

  this.pivots = build.pivots;
  this.lefts = build.lefts;
  this.rights = build.rights;

  this.size = this.labels.length;
}

/**
 * Method returning the query's nearest neighbor.
 *
 * @param  {array}  query - Query point.
 * @return {any}
 */
KDTree.prototype.nearestNeighbor = function(query) {
  var bestDistance = Infinity,
      best = null;

  var dimensions = this.dimensions,
      axes = this.axes,
      pivots = this.pivots,
      lefts = this.lefts,
      rights = this.rights;

  var visited = 0;

  function recurse(d, node) {
    visited++;

    var left = lefts[node],
        right = rights[node],
        pivot = pivots[node];

    var dist = squaredDistanceAxes(
      dimensions,
      axes,
      pivot,
      query
    );

    if (dist < bestDistance) {
      best = pivot;
      bestDistance = dist;

      if (dist === 0)
        return;
    }

    var dx = axes[d][pivot] - query[d];

    d = (d + 1) % dimensions;

    // Going the correct way?
    if (dx > 0) {
      if (left !== 0)
        recurse(d, left - 1);
    }
    else {
      if (right !== 0)
        recurse(d, right - 1);
    }

    // Going the other way?
    if (dx * dx < bestDistance) {
      if (dx > 0) {
        if (right !== 0)
          recurse(d, right - 1);
      }
      else {
        if (left !== 0)
          recurse(d, left - 1);
      }
    }
  }

  recurse(0, 0);

  this.visited = visited;
  return this.labels[best];
};

var KNN_HEAP_COMPARATOR_3 = createTupleComparator(3);
var KNN_HEAP_COMPARATOR_2 = createTupleComparator(2);

/**
 * Method returning the query's k nearest neighbors.
 *
 * @param  {number} k     - Number of nearest neighbor to retrieve.
 * @param  {array}  query - Query point.
 * @return {array}
 */

// TODO: can do better by improving upon static-kdtree here
KDTree.prototype.kNearestNeighbors = function(k, query) {
  if (k <= 0)
    throw new Error('mnemonist/kd-tree.kNearestNeighbors: k should be a positive number.');

  k = Math.min(k, this.size);

  if (k === 1)
    return [this.nearestNeighbor(query)];

  var heap = new FixedReverseHeap(Array, KNN_HEAP_COMPARATOR_3, k);

  var dimensions = this.dimensions,
      axes = this.axes,
      pivots = this.pivots,
      lefts = this.lefts,
      rights = this.rights;

  var visited = 0;

  function recurse(d, node) {
    var left = lefts[node],
        right = rights[node],
        pivot = pivots[node];

    var dist = squaredDistanceAxes(
      dimensions,
      axes,
      pivot,
      query
    );

    heap.push([dist, visited++, pivot]);

    var point = query[d],
        split = axes[d][pivot],
        dx = point - split;

    d = (d + 1) % dimensions;

    // Going the correct way?
    if (point < split) {
      if (left !== 0) {
        recurse(d, left - 1);
      }
    }
    else {
      if (right !== 0) {
        recurse(d, right - 1);
      }
    }

    // Going the other way?
    if (dx * dx < heap.peek()[0] || heap.size < k) {
      if (point < split) {
        if (right !== 0) {
          recurse(d, right - 1);
        }
      }
      else {
        if (left !== 0) {
          recurse(d, left - 1);
        }
      }
    }
  }

  recurse(0, 0);

  this.visited = visited;

  var best = heap.consume();

  for (var i = 0; i < best.length; i++)
    best[i] = this.labels[best[i][2]];

  return best;
};

/**
 * Method returning the query's k nearest neighbors by linear search.
 *
 * @param  {number} k     - Number of nearest neighbor to retrieve.
 * @param  {array}  query - Query point.
 * @return {array}
 */
KDTree.prototype.linearKNearestNeighbors = function(k, query) {
  if (k <= 0)
    throw new Error('mnemonist/kd-tree.kNearestNeighbors: k should be a positive number.');

  k = Math.min(k, this.size);

  var heap = new FixedReverseHeap(Array, KNN_HEAP_COMPARATOR_2, k);

  var i, l, dist;

  for (i = 0, l = this.size; i < l; i++) {
    dist = squaredDistanceAxes(
      this.dimensions,
      this.axes,
      this.pivots[i],
      query
    );

    heap.push([dist, i]);
  }

  var best = heap.consume();

  for (i = 0; i < best.length; i++)
    best[i] = this.labels[this.pivots[best[i][1]]];

  return best;
};

/**
 * Convenience known methods.
 */
KDTree.prototype.inspect = function() {
  var dummy = new Map();

  dummy.dimensions = this.dimensions;

  Object.defineProperty(dummy, 'constructor', {
    value: KDTree,
    enumerable: false
  });

  var i, j, point;

  for (i = 0; i < this.size; i++) {
    point = new Array(this.dimensions);

    for (j = 0; j < this.dimensions; j++)
      point[j] = this.axes[j][i];

    dummy.set(this.labels[i], point);
  }

  return dummy;
};

if (typeof Symbol !== 'undefined')
  KDTree.prototype[Symbol.for('nodejs.util.inspect.custom')] = KDTree.prototype.inspect;

/**
 * Static @.from function taking an arbitrary iterable & converting it into
 * a structure.
 *
 * @param  {Iterable} iterable   - Target iterable.
 * @param  {number}   dimensions - Space dimensions.
 * @return {KDTree}
 */
KDTree.from = function(iterable, dimensions) {
  var data = iterables.toArray(iterable);

  var reshaped = reshapeIntoAxes(dimensions, data);

  var result = buildTree(dimensions, reshaped.axes, reshaped.ids, reshaped.labels);

  return new KDTree(dimensions, result);
};

/**
 * Static @.from function building a KDTree from given axes.
 *
 * @param  {Iterable} iterable   - Target iterable.
 * @param  {number}   dimensions - Space dimensions.
 * @return {KDTree}
 */
KDTree.fromAxes = function(axes, labels) {
  if (!labels)
    labels = typed.indices(axes[0].length);

  var dimensions = axes.length;

  var result = buildTree(axes.length, axes, typed.indices(labels.length), labels);

  return new KDTree(dimensions, result);
};

/**
 * Exporting.
 */
module.exports = KDTree;

},{"./fixed-reverse-heap.js":6,"./sort/quick.js":9,"./utils/comparators.js":10,"./utils/iterables.js":11,"./utils/typed-arrays.js":12}],9:[function(require,module,exports){
/**
 * Mnemonist Quick Sort
 * =====================
 *
 * Quick sort related functions.
 * Adapted from: https://alienryderflex.com/quicksort/
 */
var LOS = new Float64Array(64),
    HIS = new Float64Array(64);

function inplaceQuickSort(array, lo, hi) {
  var p, i, l, r, swap;

  LOS[0] = lo;
  HIS[0] = hi;
  i = 0;

  while (i >= 0) {
    l = LOS[i];
    r = HIS[i] - 1;

    if (l < r) {
      p = array[l];

      while (l < r) {
        while (array[r] >= p && l < r)
          r--;

        if (l < r)
          array[l++] = array[r];

        while (array[l] <= p && l < r)
          l++;

        if (l < r)
          array[r--] = array[l];
      }

      array[l] = p;
      LOS[i + 1] = l + 1;
      HIS[i + 1] = HIS[i];
      HIS[i++] = l;

      if (HIS[i] - LOS[i] > HIS[i - 1] - LOS[i - 1]) {
        swap = LOS[i];
        LOS[i] = LOS[i - 1];
        LOS[i - 1] = swap;

        swap = HIS[i];
        HIS[i] = HIS[i - 1];
        HIS[i - 1] = swap;
      }
    }
    else {
      i--;
    }
  }

  return array;
}

exports.inplaceQuickSort = inplaceQuickSort;

function inplaceQuickSortIndices(array, indices, lo, hi) {
  var p, i, l, r, t, swap;

  LOS[0] = lo;
  HIS[0] = hi;
  i = 0;

  while (i >= 0) {
    l = LOS[i];
    r = HIS[i] - 1;

    if (l < r) {
      t = indices[l];
      p = array[t];

      while (l < r) {
        while (array[indices[r]] >= p && l < r)
          r--;

        if (l < r)
          indices[l++] = indices[r];

        while (array[indices[l]] <= p && l < r)
          l++;

        if (l < r)
          indices[r--] = indices[l];
      }

      indices[l] = t;
      LOS[i + 1] = l + 1;
      HIS[i + 1] = HIS[i];
      HIS[i++] = l;

      if (HIS[i] - LOS[i] > HIS[i - 1] - LOS[i - 1]) {
        swap = LOS[i];
        LOS[i] = LOS[i - 1];
        LOS[i - 1] = swap;

        swap = HIS[i];
        HIS[i] = HIS[i - 1];
        HIS[i - 1] = swap;
      }
    }
    else {
      i--;
    }
  }

  return indices;
}

exports.inplaceQuickSortIndices = inplaceQuickSortIndices;

},{}],10:[function(require,module,exports){
/**
 * Mnemonist Heap Comparators
 * ===========================
 *
 * Default comparators & functions dealing with comparators reversing etc.
 */
var DEFAULT_COMPARATOR = function(a, b) {
  if (a < b)
    return -1;
  if (a > b)
    return 1;

  return 0;
};

var DEFAULT_REVERSE_COMPARATOR = function(a, b) {
  if (a < b)
    return 1;
  if (a > b)
    return -1;

  return 0;
};

/**
 * Function used to reverse a comparator.
 */
function reverseComparator(comparator) {
  return function(a, b) {
    return comparator(b, a);
  };
}

/**
 * Function returning a tuple comparator.
 */
function createTupleComparator(size) {
  if (size === 2) {
    return function(a, b) {
      if (a[0] < b[0])
        return -1;

      if (a[0] > b[0])
        return 1;

      if (a[1] < b[1])
        return -1;

      if (a[1] > b[1])
        return 1;

      return 0;
    };
  }

  return function(a, b) {
    var i = 0;

    while (i < size) {
      if (a[i] < b[i])
        return -1;

      if (a[i] > b[i])
        return 1;

      i++;
    }

    return 0;
  };
}

/**
 * Exporting.
 */
exports.DEFAULT_COMPARATOR = DEFAULT_COMPARATOR;
exports.DEFAULT_REVERSE_COMPARATOR = DEFAULT_REVERSE_COMPARATOR;
exports.reverseComparator = reverseComparator;
exports.createTupleComparator = createTupleComparator;

},{}],11:[function(require,module,exports){
/**
 * Mnemonist Iterable Function
 * ============================
 *
 * Harmonized iteration helpers over mixed iterable targets.
 */
var forEach = require('obliterator/foreach');

var typed = require('./typed-arrays.js');

/**
 * Function used to determine whether the given object supports array-like
 * random access.
 *
 * @param  {any} target - Target object.
 * @return {boolean}
 */
function isArrayLike(target) {
  return Array.isArray(target) || typed.isTypedArray(target);
}

/**
 * Function used to guess the length of the structure over which we are going
 * to iterate.
 *
 * @param  {any} target - Target object.
 * @return {number|undefined}
 */
function guessLength(target) {
  if (typeof target.length === 'number')
    return target.length;

  if (typeof target.size === 'number')
    return target.size;

  return;
}

/**
 * Function used to convert an iterable to an array.
 *
 * @param  {any}   target - Iteration target.
 * @return {array}
 */
function toArray(target) {
  var l = guessLength(target);

  var array = typeof l === 'number' ? new Array(l) : [];

  var i = 0;

  // TODO: we could optimize when given target is array like
  forEach(target, function(value) {
    array[i++] = value;
  });

  return array;
}

/**
 * Same as above but returns a supplementary indices array.
 *
 * @param  {any}   target - Iteration target.
 * @return {array}
 */
function toArrayWithIndices(target) {
  var l = guessLength(target);

  var IndexArray = typeof l === 'number' ?
    typed.getPointerArray(l) :
    Array;

  var array = typeof l === 'number' ? new Array(l) : [];
  var indices = typeof l === 'number' ? new IndexArray(l) : [];

  var i = 0;

  // TODO: we could optimize when given target is array like
  forEach(target, function(value) {
    array[i] = value;
    indices[i] = i++;
  });

  return [array, indices];
}

/**
 * Exporting.
 */
exports.isArrayLike = isArrayLike;
exports.guessLength = guessLength;
exports.toArray = toArray;
exports.toArrayWithIndices = toArrayWithIndices;

},{"./typed-arrays.js":12,"obliterator/foreach":13}],12:[function(require,module,exports){
/**
 * Mnemonist Typed Array Helpers
 * ==============================
 *
 * Miscellaneous helpers related to typed arrays.
 */

/**
 * When using an unsigned integer array to store pointers, one might want to
 * choose the optimal word size in regards to the actual numbers of pointers
 * to store.
 *
 * This helpers does just that.
 *
 * @param  {number} size - Expected size of the array to map.
 * @return {TypedArray}
 */
var MAX_8BIT_INTEGER = Math.pow(2, 8) - 1,
    MAX_16BIT_INTEGER = Math.pow(2, 16) - 1,
    MAX_32BIT_INTEGER = Math.pow(2, 32) - 1;

var MAX_SIGNED_8BIT_INTEGER = Math.pow(2, 7) - 1,
    MAX_SIGNED_16BIT_INTEGER = Math.pow(2, 15) - 1,
    MAX_SIGNED_32BIT_INTEGER = Math.pow(2, 31) - 1;

exports.getPointerArray = function(size) {
  var maxIndex = size - 1;

  if (maxIndex <= MAX_8BIT_INTEGER)
    return Uint8Array;

  if (maxIndex <= MAX_16BIT_INTEGER)
    return Uint16Array;

  if (maxIndex <= MAX_32BIT_INTEGER)
    return Uint32Array;

  throw new Error('mnemonist: Pointer Array of size > 4294967295 is not supported.');
};

exports.getSignedPointerArray = function(size) {
  var maxIndex = size - 1;

  if (maxIndex <= MAX_SIGNED_8BIT_INTEGER)
    return Int8Array;

  if (maxIndex <= MAX_SIGNED_16BIT_INTEGER)
    return Int16Array;

  if (maxIndex <= MAX_SIGNED_32BIT_INTEGER)
    return Int32Array;

  return Float64Array;
};

/**
 * Function returning the minimal type able to represent the given number.
 *
 * @param  {number} value - Value to test.
 * @return {TypedArrayClass}
 */
exports.getNumberType = function(value) {

  // <= 32 bits itnteger?
  if (value === (value | 0)) {

    // Negative
    if (Math.sign(value) === -1) {
      if (value <= 127 && value >= -128)
        return Int8Array;

      if (value <= 32767 && value >= -32768)
        return Int16Array;

      return Int32Array;
    }
    else {

      if (value <= 255)
        return Uint8Array;

      if (value <= 65535)
        return Uint16Array;

      return Uint32Array;
    }
  }

  // 53 bits integer & floats
  // NOTE: it's kinda hard to tell whether we could use 32bits or not...
  return Float64Array;
};

/**
 * Function returning the minimal type able to represent the given array
 * of JavaScript numbers.
 *
 * @param  {array}    array  - Array to represent.
 * @param  {function} getter - Optional getter.
 * @return {TypedArrayClass}
 */
var TYPE_PRIORITY = {
  Uint8Array: 1,
  Int8Array: 2,
  Uint16Array: 3,
  Int16Array: 4,
  Uint32Array: 5,
  Int32Array: 6,
  Float32Array: 7,
  Float64Array: 8
};

// TODO: make this a one-shot for one value
exports.getMinimalRepresentation = function(array, getter) {
  var maxType = null,
      maxPriority = 0,
      p,
      t,
      v,
      i,
      l;

  for (i = 0, l = array.length; i < l; i++) {
    v = getter ? getter(array[i]) : array[i];
    t = exports.getNumberType(v);
    p = TYPE_PRIORITY[t.name];

    if (p > maxPriority) {
      maxPriority = p;
      maxType = t;
    }
  }

  return maxType;
};

/**
 * Function returning whether the given value is a typed array.
 *
 * @param  {any} value - Value to test.
 * @return {boolean}
 */
exports.isTypedArray = function(value) {
  return typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(value);
};

/**
 * Function used to concat byte arrays.
 *
 * @param  {...ByteArray}
 * @return {ByteArray}
 */
exports.concat = function() {
  var length = 0,
      i,
      o,
      l;

  for (i = 0, l = arguments.length; i < l; i++)
    length += arguments[i].length;

  var array = new (arguments[0].constructor)(length);

  for (i = 0, o = 0; i < l; i++) {
    array.set(arguments[i], o);
    o += arguments[i].length;
  }

  return array;
};

/**
 * Function used to initialize a byte array of indices.
 *
 * @param  {number}    length - Length of target.
 * @return {ByteArray}
 */
exports.indices = function(length) {
  var PointerArray = exports.getPointerArray(length);

  var array = new PointerArray(length);

  for (var i = 0; i < length; i++)
    array[i] = i;

  return array;
};

},{}],13:[function(require,module,exports){
/**
 * Obliterator ForEach Function
 * =============================
 *
 * Helper function used to easily iterate over mixed values.
 */

/**
 * Constants.
 */
var ARRAY_BUFFER_SUPPORT = typeof ArrayBuffer !== 'undefined',
    SYMBOL_SUPPORT = typeof Symbol !== 'undefined';

/**
 * Function able to iterate over almost any iterable JS value.
 *
 * @param  {any}      iterable - Iterable value.
 * @param  {function} callback - Callback function.
 */
function forEach(iterable, callback) {
  var iterator, k, i, l, s;

  if (!iterable)
    throw new Error('obliterator/forEach: invalid iterable.');

  if (typeof callback !== 'function')
    throw new Error('obliterator/forEach: expecting a callback.');

  // The target is an array or a string or function arguments
  if (
    Array.isArray(iterable) ||
    (ARRAY_BUFFER_SUPPORT && ArrayBuffer.isView(iterable)) ||
    typeof iterable === 'string' ||
    iterable.toString() === '[object Arguments]'
  ) {
    for (i = 0, l = iterable.length; i < l; i++)
      callback(iterable[i], i);
    return;
  }

  // The target has a #.forEach method
  if (typeof iterable.forEach === 'function') {
    iterable.forEach(callback);
    return;
  }

  // The target is iterable
  if (
    SYMBOL_SUPPORT &&
    Symbol.iterator in iterable &&
    typeof iterable.next !== 'function'
  ) {
    iterable = iterable[Symbol.iterator]();
  }

  // The target is an iterator
  if (typeof iterable.next === 'function') {
    iterator = iterable;
    i = 0;

    while ((s = iterator.next(), s.done !== true)) {
      callback(s.value, i);
      i++;
    }

    return;
  }

  // The target is a plain object
  for (k in iterable) {
    if (iterable.hasOwnProperty(k)) {
      callback(iterable[k], k);
    }
  }

  return;
}

/**
 * Same function as the above `forEach` but will yield `null` when the target
 * does not have keys.
 *
 * @param  {any}      iterable - Iterable value.
 * @param  {function} callback - Callback function.
 */
forEach.forEachWithNullKeys = function(iterable, callback) {
  var iterator, k, i, l, s;

  if (!iterable)
    throw new Error('obliterator/forEachWithNullKeys: invalid iterable.');

  if (typeof callback !== 'function')
    throw new Error('obliterator/forEachWithNullKeys: expecting a callback.');

  // The target is an array or a string or function arguments
  if (
    Array.isArray(iterable) ||
    (ARRAY_BUFFER_SUPPORT && ArrayBuffer.isView(iterable)) ||
    typeof iterable === 'string' ||
    iterable.toString() === '[object Arguments]'
  ) {
    for (i = 0, l = iterable.length; i < l; i++)
      callback(iterable[i], null);
    return;
  }

  // The target is a Set
  if (iterable instanceof Set) {
    iterable.forEach(function(value) {
      callback(value, null);
    });
    return;
  }

  // The target has a #.forEach method
  if (typeof iterable.forEach === 'function') {
    iterable.forEach(callback);
    return;
  }

  // The target is iterable
  if (
    SYMBOL_SUPPORT &&
    Symbol.iterator in iterable &&
    typeof iterable.next !== 'function'
  ) {
    iterable = iterable[Symbol.iterator]();
  }

  // The target is an iterator
  if (typeof iterable.next === 'function') {
    iterator = iterable;
    i = 0;

    while ((s = iterator.next(), s.done !== true)) {
      callback(s.value, null);
      i++;
    }

    return;
  }

  // The target is a plain object
  for (k in iterable) {
    if (iterable.hasOwnProperty(k)) {
      callback(iterable[k], k);
    }
  }

  return;
};

/**
 * Exporting.
 */
module.exports = forEach;

},{}],14:[function(require,module,exports){
"use strict"

module.exports = compressExpansion

function compressExpansion(e) {
  var m = e.length
  var Q = e[e.length-1]
  var bottom = m
  for(var i=m-2; i>=0; --i) {
    var a = Q
    var b = e[i]
    Q = a + b
    var bv = Q - a
    var q = b - bv
    if(q) {
      e[--bottom] = Q
      Q = q
    }
  }
  var top = 0
  for(var i=bottom; i<m; ++i) {
    var a = e[i]
    var b = Q
    Q = a + b
    var bv = Q - a
    var q = b - bv
    if(q) {
      e[top++] = q
    }
  }
  e[top++] = Q
  e.length = top
  return e
}
},{}],15:[function(require,module,exports){
"use strict"

var twoProduct = require("two-product")
var robustSum = require("robust-sum")
var robustScale = require("robust-scale")
var compress = require("robust-compress")

var NUM_EXPANDED = 6

function cofactor(m, c) {
  var result = new Array(m.length-1)
  for(var i=1; i<m.length; ++i) {
    var r = result[i-1] = new Array(m.length-1)
    for(var j=0,k=0; j<m.length; ++j) {
      if(j === c) {
        continue
      }
      r[k++] = m[i][j]
    }
  }
  return result
}

function matrix(n) {
  var result = new Array(n)
  for(var i=0; i<n; ++i) {
    result[i] = new Array(n)
    for(var j=0; j<n; ++j) {
      result[i][j] = ["m[", i, "][", j, "]"].join("")
    }
  }
  return result
}

function sign(n) {
  if(n & 1) {
    return "-"
  }
  return ""
}

function generateSum(expr) {
  if(expr.length === 1) {
    return expr[0]
  } else if(expr.length === 2) {
    return ["sum(", expr[0], ",", expr[1], ")"].join("")
  } else {
    var m = expr.length>>1
    return ["sum(", generateSum(expr.slice(0, m)), ",", generateSum(expr.slice(m)), ")"].join("")
  }
}

function determinant(m) {
  if(m.length === 2) {
    return ["sum(prod(", m[0][0], ",", m[1][1], "),prod(-", m[0][1], ",", m[1][0], "))"].join("")
  } else {
    var expr = []
    for(var i=0; i<m.length; ++i) {
      expr.push(["scale(", determinant(cofactor(m, i)), ",", sign(i), m[0][i], ")"].join(""))
    }
    return generateSum(expr)
  }
}

function compileDeterminant(n) {
  var proc = new Function("sum", "scale", "prod", "compress", [
    "function robustDeterminant",n, "(m){return compress(", 
      determinant(matrix(n)),
    ")};return robustDeterminant", n].join(""))
  return proc(robustSum, robustScale, twoProduct, compress)
}

var CACHE = [
  function robustDeterminant0() { return [0] },
  function robustDeterminant1(m) { return [m[0][0]] }
]

function generateDispatch() {
  while(CACHE.length < NUM_EXPANDED) {
    CACHE.push(compileDeterminant(CACHE.length))
  }
  var procArgs = []
  var code = ["function robustDeterminant(m){switch(m.length){"]
  for(var i=0; i<NUM_EXPANDED; ++i) {
    procArgs.push("det" + i)
    code.push("case ", i, ":return det", i, "(m);")
  }
  code.push("}\
var det=CACHE[m.length];\
if(!det)\
det=CACHE[m.length]=gen(m.length);\
return det(m);\
}\
return robustDeterminant")
  procArgs.push("CACHE", "gen", code.join(""))
  var proc = Function.apply(undefined, procArgs)
  module.exports = proc.apply(undefined, CACHE.concat([CACHE, compileDeterminant]))
  for(var i=0; i<CACHE.length; ++i) {
    module.exports[i] = CACHE[i]
  }
}

generateDispatch()
},{"robust-compress":14,"robust-scale":18,"robust-sum":20,"two-product":22}],16:[function(require,module,exports){
"use strict"

var determinant = require("robust-determinant")

var NUM_EXPAND = 6

function generateSolver(n) {
  var funcName = "robustLinearSolve" + n + "d"
  var code = ["function ", funcName, "(A,b){return ["]
  for(var i=0; i<n; ++i) {
    code.push("det([")
    for(var j=0; j<n; ++j) {
      if(j > 0) {
        code.push(",")
      }
      code.push("[")
      for(var k=0; k<n; ++k) {
        if(k > 0) {
          code.push(",")
        }
        if(k === i) {
          code.push("+b[", j, "]")
        } else {
          code.push("+A[", j, "][", k, "]")
        }
      }
      code.push("]")
    }
    code.push("]),")
  }
  code.push("det(A)]}return ", funcName)
  var proc = new Function("det", code.join(""))
  if(n < 6) {
    return proc(determinant[n])
  }
  return proc(determinant)
}

function robustLinearSolve0d() {
  return [ 0 ]
}

function robustLinearSolve1d(A, b) {
  return [ [ b[0] ], [ A[0][0] ] ]
}

var CACHE = [
  robustLinearSolve0d,
  robustLinearSolve1d
]

function generateDispatch() {
  while(CACHE.length < NUM_EXPAND) {
    CACHE.push(generateSolver(CACHE.length))
  }
  var procArgs = []
  var code = ["function dispatchLinearSolve(A,b){switch(A.length){"]
  for(var i=0; i<NUM_EXPAND; ++i) {
    procArgs.push("s" + i)
    code.push("case ", i, ":return s", i, "(A,b);")
  }
  code.push("}var s=CACHE[A.length];if(!s)s=CACHE[A.length]=g(A.length);return s(A,b)}return dispatchLinearSolve")
  procArgs.push("CACHE", "g", code.join(""))
  var proc = Function.apply(undefined, procArgs)
  module.exports = proc.apply(undefined, CACHE.concat([CACHE, generateSolver]))
  for(var i=0; i<NUM_EXPAND; ++i) {
    module.exports[i] = CACHE[i]
  }
}

generateDispatch()
},{"robust-determinant":15}],17:[function(require,module,exports){
"use strict"

var twoProduct = require("two-product")
var robustSum = require("robust-sum")
var robustScale = require("robust-scale")
var robustSubtract = require("robust-subtract")

var NUM_EXPAND = 5

var EPSILON     = 1.1102230246251565e-16
var ERRBOUND3   = (3.0 + 16.0 * EPSILON) * EPSILON
var ERRBOUND4   = (7.0 + 56.0 * EPSILON) * EPSILON

function orientation_3(sum, prod, scale, sub) {
  return function orientation3Exact(m0, m1, m2) {
    var p = sum(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])))
    var n = sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0]))
    var d = sub(p, n)
    return d[d.length - 1]
  }
}

function orientation_4(sum, prod, scale, sub) {
  return function orientation4Exact(m0, m1, m2, m3) {
    var p = sum(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m3[2]))), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m3[2]))))
    var n = sum(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m3[2]))), sum(scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m2[2]))))
    var d = sub(p, n)
    return d[d.length - 1]
  }
}

function orientation_5(sum, prod, scale, sub) {
  return function orientation5Exact(m0, m1, m2, m3, m4) {
    var p = sum(sum(sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m2[2]), sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), -m3[2]), scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m4[2]))), m1[3]), sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m3[2]), scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m4[2]))), -m2[3]), scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m4[2]))), m3[3]))), sum(scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m3[2]))), -m4[3]), sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m3[2]), scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m4[2]))), m0[3]), scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m3[2]), scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), m4[2]))), -m1[3])))), sum(sum(scale(sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m4[2]))), m3[3]), sum(scale(sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m3[2]))), -m4[3]), scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m3[2]))), m0[3]))), sum(scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m3[2]))), -m1[3]), sum(scale(sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m3[2]))), m2[3]), scale(sum(scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m2[2]))), -m3[3])))))
    var n = sum(sum(sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m2[2]), sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), -m3[2]), scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m4[2]))), m0[3]), scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m3[2]), scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), m4[2]))), -m2[3])), sum(scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m4[2]))), m3[3]), scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m3[2]))), -m4[3]))), sum(sum(scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m4[2]))), m0[3]), scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m4[2]))), -m1[3])), sum(scale(sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m4[2]))), m2[3]), scale(sum(scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m2[2]))), -m4[3]))))
    var d = sub(p, n)
    return d[d.length - 1]
  }
}

function orientation(n) {
  var fn =
    n === 3 ? orientation_3 :
    n === 4 ? orientation_4 : orientation_5

  return fn(robustSum, twoProduct, robustScale, robustSubtract)
}

var orientation3Exact = orientation(3)
var orientation4Exact = orientation(4)

var CACHED = [
  function orientation0() { return 0 },
  function orientation1() { return 0 },
  function orientation2(a, b) {
    return b[0] - a[0]
  },
  function orientation3(a, b, c) {
    var l = (a[1] - c[1]) * (b[0] - c[0])
    var r = (a[0] - c[0]) * (b[1] - c[1])
    var det = l - r
    var s
    if(l > 0) {
      if(r <= 0) {
        return det
      } else {
        s = l + r
      }
    } else if(l < 0) {
      if(r >= 0) {
        return det
      } else {
        s = -(l + r)
      }
    } else {
      return det
    }
    var tol = ERRBOUND3 * s
    if(det >= tol || det <= -tol) {
      return det
    }
    return orientation3Exact(a, b, c)
  },
  function orientation4(a,b,c,d) {
    var adx = a[0] - d[0]
    var bdx = b[0] - d[0]
    var cdx = c[0] - d[0]
    var ady = a[1] - d[1]
    var bdy = b[1] - d[1]
    var cdy = c[1] - d[1]
    var adz = a[2] - d[2]
    var bdz = b[2] - d[2]
    var cdz = c[2] - d[2]
    var bdxcdy = bdx * cdy
    var cdxbdy = cdx * bdy
    var cdxady = cdx * ady
    var adxcdy = adx * cdy
    var adxbdy = adx * bdy
    var bdxady = bdx * ady
    var det = adz * (bdxcdy - cdxbdy)
            + bdz * (cdxady - adxcdy)
            + cdz * (adxbdy - bdxady)
    var permanent = (Math.abs(bdxcdy) + Math.abs(cdxbdy)) * Math.abs(adz)
                  + (Math.abs(cdxady) + Math.abs(adxcdy)) * Math.abs(bdz)
                  + (Math.abs(adxbdy) + Math.abs(bdxady)) * Math.abs(cdz)
    var tol = ERRBOUND4 * permanent
    if ((det > tol) || (-det > tol)) {
      return det
    }
    return orientation4Exact(a,b,c,d)
  }
]

function slowOrient(args) {
  var proc = CACHED[args.length]
  if(!proc) {
    proc = CACHED[args.length] = orientation(args.length)
  }
  return proc.apply(undefined, args)
}

function proc (slow, o0, o1, o2, o3, o4, o5) {
  return function getOrientation(a0, a1, a2, a3, a4) {
    switch (arguments.length) {
      case 0:
      case 1:
        return 0;
      case 2:
        return o2(a0, a1)
      case 3:
        return o3(a0, a1, a2)
      case 4:
        return o4(a0, a1, a2, a3)
      case 5:
        return o5(a0, a1, a2, a3, a4)
    }

    var s = new Array(arguments.length)
    for (var i = 0; i < arguments.length; ++i) {
      s[i] = arguments[i]
    }
    return slow(s)
  }
}

function generateOrientationProc() {
  while(CACHED.length <= NUM_EXPAND) {
    CACHED.push(orientation(CACHED.length))
  }
  module.exports = proc.apply(undefined, [slowOrient].concat(CACHED))
  for(var i=0; i<=NUM_EXPAND; ++i) {
    module.exports[i] = CACHED[i]
  }
}

generateOrientationProc()
},{"robust-scale":18,"robust-subtract":19,"robust-sum":20,"two-product":22}],18:[function(require,module,exports){
"use strict"

var twoProduct = require("two-product")
var twoSum = require("two-sum")

module.exports = scaleLinearExpansion

function scaleLinearExpansion(e, scale) {
  var n = e.length
  if(n === 1) {
    var ts = twoProduct(e[0], scale)
    if(ts[0]) {
      return ts
    }
    return [ ts[1] ]
  }
  var g = new Array(2 * n)
  var q = [0.1, 0.1]
  var t = [0.1, 0.1]
  var count = 0
  twoProduct(e[0], scale, q)
  if(q[0]) {
    g[count++] = q[0]
  }
  for(var i=1; i<n; ++i) {
    twoProduct(e[i], scale, t)
    var pq = q[1]
    twoSum(pq, t[0], q)
    if(q[0]) {
      g[count++] = q[0]
    }
    var a = t[1]
    var b = q[1]
    var x = a + b
    var bv = x - a
    var y = b - bv
    q[1] = x
    if(y) {
      g[count++] = y
    }
  }
  if(q[1]) {
    g[count++] = q[1]
  }
  if(count === 0) {
    g[count++] = 0.0
  }
  g.length = count
  return g
}
},{"two-product":22,"two-sum":23}],19:[function(require,module,exports){
"use strict"

module.exports = robustSubtract

//Easy case: Add two scalars
function scalarScalar(a, b) {
  var x = a + b
  var bv = x - a
  var av = x - bv
  var br = b - bv
  var ar = a - av
  var y = ar + br
  if(y) {
    return [y, x]
  }
  return [x]
}

function robustSubtract(e, f) {
  var ne = e.length|0
  var nf = f.length|0
  if(ne === 1 && nf === 1) {
    return scalarScalar(e[0], -f[0])
  }
  var n = ne + nf
  var g = new Array(n)
  var count = 0
  var eptr = 0
  var fptr = 0
  var abs = Math.abs
  var ei = e[eptr]
  var ea = abs(ei)
  var fi = -f[fptr]
  var fa = abs(fi)
  var a, b
  if(ea < fa) {
    b = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    b = fi
    fptr += 1
    if(fptr < nf) {
      fi = -f[fptr]
      fa = abs(fi)
    }
  }
  if((eptr < ne && ea < fa) || (fptr >= nf)) {
    a = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    a = fi
    fptr += 1
    if(fptr < nf) {
      fi = -f[fptr]
      fa = abs(fi)
    }
  }
  var x = a + b
  var bv = x - a
  var y = b - bv
  var q0 = y
  var q1 = x
  var _x, _bv, _av, _br, _ar
  while(eptr < ne && fptr < nf) {
    if(ea < fa) {
      a = ei
      eptr += 1
      if(eptr < ne) {
        ei = e[eptr]
        ea = abs(ei)
      }
    } else {
      a = fi
      fptr += 1
      if(fptr < nf) {
        fi = -f[fptr]
        fa = abs(fi)
      }
    }
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
  }
  while(eptr < ne) {
    a = ei
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
    }
  }
  while(fptr < nf) {
    a = fi
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    } 
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    fptr += 1
    if(fptr < nf) {
      fi = -f[fptr]
    }
  }
  if(q0) {
    g[count++] = q0
  }
  if(q1) {
    g[count++] = q1
  }
  if(!count) {
    g[count++] = 0.0  
  }
  g.length = count
  return g
}
},{}],20:[function(require,module,exports){
"use strict"

module.exports = linearExpansionSum

//Easy case: Add two scalars
function scalarScalar(a, b) {
  var x = a + b
  var bv = x - a
  var av = x - bv
  var br = b - bv
  var ar = a - av
  var y = ar + br
  if(y) {
    return [y, x]
  }
  return [x]
}

function linearExpansionSum(e, f) {
  var ne = e.length|0
  var nf = f.length|0
  if(ne === 1 && nf === 1) {
    return scalarScalar(e[0], f[0])
  }
  var n = ne + nf
  var g = new Array(n)
  var count = 0
  var eptr = 0
  var fptr = 0
  var abs = Math.abs
  var ei = e[eptr]
  var ea = abs(ei)
  var fi = f[fptr]
  var fa = abs(fi)
  var a, b
  if(ea < fa) {
    b = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    b = fi
    fptr += 1
    if(fptr < nf) {
      fi = f[fptr]
      fa = abs(fi)
    }
  }
  if((eptr < ne && ea < fa) || (fptr >= nf)) {
    a = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    a = fi
    fptr += 1
    if(fptr < nf) {
      fi = f[fptr]
      fa = abs(fi)
    }
  }
  var x = a + b
  var bv = x - a
  var y = b - bv
  var q0 = y
  var q1 = x
  var _x, _bv, _av, _br, _ar
  while(eptr < ne && fptr < nf) {
    if(ea < fa) {
      a = ei
      eptr += 1
      if(eptr < ne) {
        ei = e[eptr]
        ea = abs(ei)
      }
    } else {
      a = fi
      fptr += 1
      if(fptr < nf) {
        fi = f[fptr]
        fa = abs(fi)
      }
    }
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
  }
  while(eptr < ne) {
    a = ei
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
    }
  }
  while(fptr < nf) {
    a = fi
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    } 
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    fptr += 1
    if(fptr < nf) {
      fi = f[fptr]
    }
  }
  if(q0) {
    g[count++] = q0
  }
  if(q1) {
    g[count++] = q1
  }
  if(!count) {
    g[count++] = 0.0  
  }
  g.length = count
  return g
}
},{}],21:[function(require,module,exports){
"use strict"; "use restrict";

var bits      = require("bit-twiddle")
  , UnionFind = require("union-find")

//Returns the dimension of a cell complex
function dimension(cells) {
  var d = 0
    , max = Math.max
  for(var i=0, il=cells.length; i<il; ++i) {
    d = max(d, cells[i].length)
  }
  return d-1
}
exports.dimension = dimension

//Counts the number of vertices in faces
function countVertices(cells) {
  var vc = -1
    , max = Math.max
  for(var i=0, il=cells.length; i<il; ++i) {
    var c = cells[i]
    for(var j=0, jl=c.length; j<jl; ++j) {
      vc = max(vc, c[j])
    }
  }
  return vc+1
}
exports.countVertices = countVertices

//Returns a deep copy of cells
function cloneCells(cells) {
  var ncells = new Array(cells.length)
  for(var i=0, il=cells.length; i<il; ++i) {
    ncells[i] = cells[i].slice(0)
  }
  return ncells
}
exports.cloneCells = cloneCells

//Ranks a pair of cells up to permutation
function compareCells(a, b) {
  var n = a.length
    , t = a.length - b.length
    , min = Math.min
  if(t) {
    return t
  }
  switch(n) {
    case 0:
      return 0;
    case 1:
      return a[0] - b[0];
    case 2:
      var d = a[0]+a[1]-b[0]-b[1]
      if(d) {
        return d
      }
      return min(a[0],a[1]) - min(b[0],b[1])
    case 3:
      var l1 = a[0]+a[1]
        , m1 = b[0]+b[1]
      d = l1+a[2] - (m1+b[2])
      if(d) {
        return d
      }
      var l0 = min(a[0], a[1])
        , m0 = min(b[0], b[1])
        , d  = min(l0, a[2]) - min(m0, b[2])
      if(d) {
        return d
      }
      return min(l0+a[2], l1) - min(m0+b[2], m1)
    
    //TODO: Maybe optimize n=4 as well?
    
    default:
      var as = a.slice(0)
      as.sort()
      var bs = b.slice(0)
      bs.sort()
      for(var i=0; i<n; ++i) {
        t = as[i] - bs[i]
        if(t) {
          return t
        }
      }
      return 0
  }
}
exports.compareCells = compareCells

function compareZipped(a, b) {
  return compareCells(a[0], b[0])
}

//Puts a cell complex into normal order for the purposes of findCell queries
function normalize(cells, attr) {
  if(attr) {
    var len = cells.length
    var zipped = new Array(len)
    for(var i=0; i<len; ++i) {
      zipped[i] = [cells[i], attr[i]]
    }
    zipped.sort(compareZipped)
    for(var i=0; i<len; ++i) {
      cells[i] = zipped[i][0]
      attr[i] = zipped[i][1]
    }
    return cells
  } else {
    cells.sort(compareCells)
    return cells
  }
}
exports.normalize = normalize

//Removes all duplicate cells in the complex
function unique(cells) {
  if(cells.length === 0) {
    return []
  }
  var ptr = 1
    , len = cells.length
  for(var i=1; i<len; ++i) {
    var a = cells[i]
    if(compareCells(a, cells[i-1])) {
      if(i === ptr) {
        ptr++
        continue
      }
      cells[ptr++] = a
    }
  }
  cells.length = ptr
  return cells
}
exports.unique = unique;

//Finds a cell in a normalized cell complex
function findCell(cells, c) {
  var lo = 0
    , hi = cells.length-1
    , r  = -1
  while (lo <= hi) {
    var mid = (lo + hi) >> 1
      , s   = compareCells(cells[mid], c)
    if(s <= 0) {
      if(s === 0) {
        r = mid
      }
      lo = mid + 1
    } else if(s > 0) {
      hi = mid - 1
    }
  }
  return r
}
exports.findCell = findCell;

//Builds an index for an n-cell.  This is more general than dual, but less efficient
function incidence(from_cells, to_cells) {
  var index = new Array(from_cells.length)
  for(var i=0, il=index.length; i<il; ++i) {
    index[i] = []
  }
  var b = []
  for(var i=0, n=to_cells.length; i<n; ++i) {
    var c = to_cells[i]
    var cl = c.length
    for(var k=1, kn=(1<<cl); k<kn; ++k) {
      b.length = bits.popCount(k)
      var l = 0
      for(var j=0; j<cl; ++j) {
        if(k & (1<<j)) {
          b[l++] = c[j]
        }
      }
      var idx=findCell(from_cells, b)
      if(idx < 0) {
        continue
      }
      while(true) {
        index[idx++].push(i)
        if(idx >= from_cells.length || compareCells(from_cells[idx], b) !== 0) {
          break
        }
      }
    }
  }
  return index
}
exports.incidence = incidence

//Computes the dual of the mesh.  This is basically an optimized version of buildIndex for the situation where from_cells is just the list of vertices
function dual(cells, vertex_count) {
  if(!vertex_count) {
    return incidence(unique(skeleton(cells, 0)), cells, 0)
  }
  var res = new Array(vertex_count)
  for(var i=0; i<vertex_count; ++i) {
    res[i] = []
  }
  for(var i=0, len=cells.length; i<len; ++i) {
    var c = cells[i]
    for(var j=0, cl=c.length; j<cl; ++j) {
      res[c[j]].push(i)
    }
  }
  return res
}
exports.dual = dual

//Enumerates all cells in the complex
function explode(cells) {
  var result = []
  for(var i=0, il=cells.length; i<il; ++i) {
    var c = cells[i]
      , cl = c.length|0
    for(var j=1, jl=(1<<cl); j<jl; ++j) {
      var b = []
      for(var k=0; k<cl; ++k) {
        if((j >>> k) & 1) {
          b.push(c[k])
        }
      }
      result.push(b)
    }
  }
  return normalize(result)
}
exports.explode = explode

//Enumerates all of the n-cells of a cell complex
function skeleton(cells, n) {
  if(n < 0) {
    return []
  }
  var result = []
    , k0     = (1<<(n+1))-1
  for(var i=0; i<cells.length; ++i) {
    var c = cells[i]
    for(var k=k0; k<(1<<c.length); k=bits.nextCombination(k)) {
      var b = new Array(n+1)
        , l = 0
      for(var j=0; j<c.length; ++j) {
        if(k & (1<<j)) {
          b[l++] = c[j]
        }
      }
      result.push(b)
    }
  }
  return normalize(result)
}
exports.skeleton = skeleton;

//Computes the boundary of all cells, does not remove duplicates
function boundary(cells) {
  var res = []
  for(var i=0,il=cells.length; i<il; ++i) {
    var c = cells[i]
    for(var j=0,cl=c.length; j<cl; ++j) {
      var b = new Array(c.length-1)
      for(var k=0, l=0; k<cl; ++k) {
        if(k !== j) {
          b[l++] = c[k]
        }
      }
      res.push(b)
    }
  }
  return normalize(res)
}
exports.boundary = boundary;

//Computes connected components for a dense cell complex
function connectedComponents_dense(cells, vertex_count) {
  var labels = new UnionFind(vertex_count)
  for(var i=0; i<cells.length; ++i) {
    var c = cells[i]
    for(var j=0; j<c.length; ++j) {
      for(var k=j+1; k<c.length; ++k) {
        labels.link(c[j], c[k])
      }
    }
  }
  var components = []
    , component_labels = labels.ranks
  for(var i=0; i<component_labels.length; ++i) {
    component_labels[i] = -1
  }
  for(var i=0; i<cells.length; ++i) {
    var l = labels.find(cells[i][0])
    if(component_labels[l] < 0) {
      component_labels[l] = components.length
      components.push([cells[i].slice(0)])
    } else {
      components[component_labels[l]].push(cells[i].slice(0))
    }
  }
  return components
}

//Computes connected components for a sparse graph
function connectedComponents_sparse(cells) {
  var vertices  = unique(normalize(skeleton(cells, 0)))
    , labels    = new UnionFind(vertices.length)
  for(var i=0; i<cells.length; ++i) {
    var c = cells[i]
    for(var j=0; j<c.length; ++j) {
      var vj = findCell(vertices, [c[j]])
      for(var k=j+1; k<c.length; ++k) {
        labels.link(vj, findCell(vertices, [c[k]]))
      }
    }
  }
  var components        = []
    , component_labels  = labels.ranks
  for(var i=0; i<component_labels.length; ++i) {
    component_labels[i] = -1
  }
  for(var i=0; i<cells.length; ++i) {
    var l = labels.find(findCell(vertices, [cells[i][0]]));
    if(component_labels[l] < 0) {
      component_labels[l] = components.length
      components.push([cells[i].slice(0)])
    } else {
      components[component_labels[l]].push(cells[i].slice(0))
    }
  }
  return components
}

//Computes connected components for a cell complex
function connectedComponents(cells, vertex_count) {
  if(vertex_count) {
    return connectedComponents_dense(cells, vertex_count)
  }
  return connectedComponents_sparse(cells)
}
exports.connectedComponents = connectedComponents

},{"bit-twiddle":1,"union-find":24}],22:[function(require,module,exports){
"use strict"

module.exports = twoProduct

var SPLITTER = +(Math.pow(2, 27) + 1.0)

function twoProduct(a, b, result) {
  var x = a * b

  var c = SPLITTER * a
  var abig = c - a
  var ahi = c - abig
  var alo = a - ahi

  var d = SPLITTER * b
  var bbig = d - b
  var bhi = d - bbig
  var blo = b - bhi

  var err1 = x - (ahi * bhi)
  var err2 = err1 - (alo * bhi)
  var err3 = err2 - (ahi * blo)

  var y = alo * blo - err3

  if(result) {
    result[0] = y
    result[1] = x
    return result
  }

  return [ y, x ]
}
},{}],23:[function(require,module,exports){
"use strict"

module.exports = fastTwoSum

function fastTwoSum(a, b, result) {
	var x = a + b
	var bv = x - a
	var av = x - bv
	var br = b - bv
	var ar = a - av
	if(result) {
		result[0] = ar + br
		result[1] = x
		return result
	}
	return [ar+br, x]
}
},{}],24:[function(require,module,exports){
"use strict"; "use restrict";

module.exports = UnionFind;

function UnionFind(count) {
  this.roots = new Array(count);
  this.ranks = new Array(count);
  
  for(var i=0; i<count; ++i) {
    this.roots[i] = i;
    this.ranks[i] = 0;
  }
}

var proto = UnionFind.prototype

Object.defineProperty(proto, "length", {
  "get": function() {
    return this.roots.length
  }
})

proto.makeSet = function() {
  var n = this.roots.length;
  this.roots.push(n);
  this.ranks.push(0);
  return n;
}

proto.find = function(x) {
  var x0 = x
  var roots = this.roots;
  while(roots[x] !== x) {
    x = roots[x]
  }
  while(roots[x0] !== x) {
    var y = roots[x0]
    roots[x0] = x
    x0 = y
  }
  return x;
}

proto.link = function(x, y) {
  var xr = this.find(x)
    , yr = this.find(y);
  if(xr === yr) {
    return;
  }
  var ranks = this.ranks
    , roots = this.roots
    , xd    = ranks[xr]
    , yd    = ranks[yr];
  if(xd < yd) {
    roots[xr] = yr;
  } else if(yd < xd) {
    roots[yr] = xr;
  } else {
    roots[yr] = xr;
    ++ranks[xr];
  }
}
},{}],25:[function(require,module,exports){
"use strict"

function unique_pred(list, compare) {
  var ptr = 1
    , len = list.length
    , a=list[0], b=list[0]
  for(var i=1; i<len; ++i) {
    b = a
    a = list[i]
    if(compare(a, b)) {
      if(i === ptr) {
        ptr++
        continue
      }
      list[ptr++] = a
    }
  }
  list.length = ptr
  return list
}

function unique_eq(list) {
  var ptr = 1
    , len = list.length
    , a=list[0], b = list[0]
  for(var i=1; i<len; ++i, b=a) {
    b = a
    a = list[i]
    if(a !== b) {
      if(i === ptr) {
        ptr++
        continue
      }
      list[ptr++] = a
    }
  }
  list.length = ptr
  return list
}

function unique(list, compare, sorted) {
  if(list.length === 0) {
    return list
  }
  if(compare) {
    if(!sorted) {
      list.sort(compare)
    }
    return unique_pred(list, compare)
  }
  if(!sorted) {
    list.sort()
  }
  return unique_eq(list)
}

module.exports = unique

},{}],26:[function(require,module,exports){
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    const _voronoi = require("./voronoi.js");
    const KDTree = require('mnemonist/kd-tree');

    function Voronoi(points, cells, positions, triangles) {
        this.cells = cells;
        this.positions = positions;
        this.triangles = triangles;
        this.points = points;
        this.length = cells.length;
    }

    Voronoi.prototype.getPolygon = function (index) {

        if (index >= this.length) return;
        let cell = this.cells[index];
        cell = cell.filter((v) => v !== -1)
        const map = cell.map((p_inx) => {
            return this.positions[p_inx]
        });
        return map;
    }

    Snap.registerClass("Voronoi", Voronoi);

    Snap.voronoi = function (points) {
        const is_objPoint = points[0].hasOwnProperty("x");
        if (is_objPoint) points = toArrayPoints(points);
        const vor = _voronoi(points);
        if (is_objPoint) vor.positions = toObjPoints(vor.positions);
        return new Voronoi(points, vor.cells, vor.positions, vor.triangles);
    };

    function mergeSort(points, comp) {
        if (points.length < 2) return points;

        const n = points.length;
        let i = 0,
            j = 0;
        const leftN = Math.floor(n / 2),
            rightN = leftN;


        const leftPart = mergeSort(points.slice(0, leftN), comp),
            rightPart = mergeSort(points.slice(rightN), comp);

        const sortedPart = [];

        while ((i < leftPart.length) && (j < rightPart.length)) {
            if (comp(leftPart[i], rightPart[j]) < 0) {
                sortedPart.push(leftPart[i]);
                i += 1;
            } else {
                sortedPart.push(rightPart[j]);
                j += 1;
            }
        }
        while (i < leftPart.length) {
            sortedPart.push(leftPart[i]);
            i += 1;
        }
        while (j < rightPart.length) {
            sortedPart.push(rightPart[j]);
            j += 1;
        }
        return sortedPart;
    }

    function toObjPoints(point_arrray) {
        return point_arrray.map((p) => {
            return {x: p[0], y: p[1]}
        })
    }

    function toArrayPoints(point_arrray) {
        return point_arrray.map((p) => {
            return [p.x, p.y];
        })
    }

    function _closestPair(Px, Py) {
        let d;
        if (Px.length < 2) return {distance: Infinity, pair: [{x: 0, y: 0}, {x: 0, y: 0}]};
        if (Px.length < 3) {
            //find euclid distance
            d = Math.sqrt(Math.pow(Math.abs(Px[1].x - Px[0].x), 2) + Math.pow(Math.abs(Px[1].y - Px[0].y), 2));
            return {
                distance: d,
                pair: [Px[0], Px[1]]
            };
        }

        const n = Px.length,
            leftN = Math.floor(n / 2),
            rightN = leftN;

        const Xl = Px.slice(0, leftN),
            Xr = Px.slice(rightN),
            Xm = Xl[leftN - 1],
            Yl = [],
            Yr = [];
        //separate Py
        for (var i = 0; i < Py.length; i += 1) {
            if (Py[i].x <= Xm.x)
                Yl.push(Py[i]);
            else
                Yr.push(Py[i]);
        }

        const dLeft = _closestPair(Xl, Yl),
            dRight = _closestPair(Xr, Yr);

        let minDelta = dLeft.distance,
            clPair = dLeft.pair;
        if (dLeft.distance > dRight.distance) {
            minDelta = dRight.distance;
            clPair = dRight.pair;
        }


        //filter points around Xm within delta (minDelta)
        const closeY = [];
        for (i = 0; i < Py.length; i += 1) {
            if (Math.abs(Py[i].x - Xm.x) < minDelta) closeY.push(Py[i]);
        }
        //find min within delta. 8 steps max
        for (i = 0; i < closeY.length; i += 1) {
            for (let j = i + 1; j < Math.min((i + 8), closeY.length); j += 1) {
                d = Math.sqrt(Math.pow(Math.abs(closeY[j].x - closeY[i].x), 2) + Math.pow(Math.abs(closeY[j].y - closeY[i].y), 2));
                if (d < minDelta) {
                    minDelta = d;
                    clPair = [closeY[i], closeY[j]]
                }
            }
        }

        return {
            distance: minDelta,
            pair: clPair
        };
    }

    Snap.closestPair = function (points) {
        if (Array.isArray(points[0])) points = toObjPoints(Px);
        const sortX = function (a, b) {
            return (a.x < b.x) ? -1 : ((a.x > b.x) ? 1 : 0);
        };
        const sortY = function (a, b) {
            return (a.y < b.y) ? -1 : ((a.y > b.y) ? 1 : 0);
        };
        const Px = mergeSort(points, sortX);
        const Py = mergeSort(points, sortY);

        return _closestPair(Px, Py);
    };


    // function Node(obj, dimension, parent) {
    //     this.obj = obj;
    //     this.left = null;
    //     this.right = null;
    //     this.parent = parent;
    //     this.dimension = dimension;
    // }
    //
    // function KD_Tree(points, metric, dimensions) {
    //     if (Array.isArray(points[0])) points = toObjPoints(points);
    //     metric = metric || function (a, b) {
    //         return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
    //     }
    //     dimensions = dimensions || ["x", "y"]
    //
    //     var self = this;
    //
    //     function buildTree(points, depth, parent) {
    //         var dim = depth % dimensions.length,
    //             median,
    //             node;
    //
    //         if (points.length === 0) {
    //             return null;
    //         }
    //         if (points.length === 1) {
    //             return new Node(points[0], dim, parent);
    //         }
    //
    //         points.sort(function (a, b) {
    //             return a[dimensions[dim]] - b[dimensions[dim]];
    //         });
    //
    //         median = Math.floor(points.length / 2);
    //         node = new Node(points[median], dim, parent);
    //         node.left = buildTree(points.slice(0, median), depth + 1, node);
    //         node.right = buildTree(points.slice(median + 1), depth + 1, node);
    //
    //         return node;
    //     }
    //
    //     // Reloads a serialied tree
    //     function loadTree(data) {
    //         // Just need to restore the `parent` parameter
    //         self.root = data;
    //
    //         function restoreParent(root) {
    //             if (root.left) {
    //                 root.left.parent = root;
    //                 restoreParent(root.left);
    //             }
    //
    //             if (root.right) {
    //                 root.right.parent = root;
    //                 restoreParent(root.right);
    //             }
    //         }
    //
    //         restoreParent(self.root);
    //     }
    //
    //     // If points is not an array, assume we're loading a pre-built tree
    //     if (!Array.isArray(points)) loadTree(points, metric, dimensions);
    //     else this.root = buildTree(points, 0, null);
    //
    //     // Convert to a JSON serializable structure; this just requires removing
    //     // the `parent` property
    //     this.toJSON = function (src) {
    //         if (!src) src = this.root;
    //         var dest = new Node(src.obj, src.dimension, null);
    //         if (src.left) dest.left = self.toJSON(src.left);
    //         if (src.right) dest.right = self.toJSON(src.right);
    //         return dest;
    //     };
    //
    //     this.insert = function (point) {
    //         function innerSearch(node, parent) {
    //
    //             if (node === null) {
    //                 return parent;
    //             }
    //
    //             var dimension = dimensions[node.dimension];
    //             if (point[dimension] < node.obj[dimension]) {
    //                 return innerSearch(node.left, node);
    //             } else {
    //                 return innerSearch(node.right, node);
    //             }
    //         }
    //
    //         var insertPosition = innerSearch(this.root, null),
    //             newNode,
    //             dimension;
    //
    //         if (insertPosition === null) {
    //             this.root = new Node(point, 0, null);
    //             return;
    //         }
    //
    //         newNode = new Node(point, (insertPosition.dimension + 1) % dimensions.length, insertPosition);
    //         dimension = dimensions[insertPosition.dimension];
    //
    //         if (point[dimension] < insertPosition.obj[dimension]) {
    //             insertPosition.left = newNode;
    //         } else {
    //             insertPosition.right = newNode;
    //         }
    //     };
    //
    //     this.remove = function (point) {
    //         var node;
    //
    //         function nodeSearch(node) {
    //             if (node === null) {
    //                 return null;
    //             }
    //
    //             if (node.obj === point) {
    //                 return node;
    //             }
    //
    //             var dimension = dimensions[node.dimension];
    //
    //             if (point[dimension] < node.obj[dimension]) {
    //                 return nodeSearch(node.left, node);
    //             } else {
    //                 return nodeSearch(node.right, node);
    //             }
    //         }
    //
    //         function removeNode(node) {
    //             var nextNode,
    //                 nextObj,
    //                 pDimension;
    //
    //             function findMin(node, dim) {
    //                 var dimension,
    //                     own,
    //                     left,
    //                     right,
    //                     min;
    //
    //                 if (node === null) {
    //                     return null;
    //                 }
    //
    //                 dimension = dimensions[dim];
    //
    //                 if (node.dimension === dim) {
    //                     if (node.left !== null) {
    //                         return findMin(node.left, dim);
    //                     }
    //                     return node;
    //                 }
    //
    //                 own = node.obj[dimension];
    //                 left = findMin(node.left, dim);
    //                 right = findMin(node.right, dim);
    //                 min = node;
    //
    //                 if (left !== null && left.obj[dimension] < own) {
    //                     min = left;
    //                 }
    //                 if (right !== null && right.obj[dimension] < min.obj[dimension]) {
    //                     min = right;
    //                 }
    //                 return min;
    //             }
    //
    //             if (node.left === null && node.right === null) {
    //                 if (node.parent === null) {
    //                     self.root = null;
    //                     return;
    //                 }
    //
    //                 pDimension = dimensions[node.parent.dimension];
    //
    //                 if (node.obj[pDimension] < node.parent.obj[pDimension]) {
    //                     node.parent.left = null;
    //                 } else {
    //                     node.parent.right = null;
    //                 }
    //                 return;
    //             }
    //
    //             // If the right subtree is not empty, swap with the minimum element on the
    //             // node's dimension. If it is empty, we swap the left and right subtrees and
    //             // do the same.
    //             if (node.right !== null) {
    //                 nextNode = findMin(node.right, node.dimension);
    //                 nextObj = nextNode.obj;
    //                 removeNode(nextNode);
    //                 node.obj = nextObj;
    //             } else {
    //                 nextNode = findMin(node.left, node.dimension);
    //                 nextObj = nextNode.obj;
    //                 removeNode(nextNode);
    //                 node.right = node.left;
    //                 node.left = null;
    //                 node.obj = nextObj;
    //             }
    //
    //         }
    //
    //         node = nodeSearch(self.root);
    //
    //         if (node === null) {
    //             return;
    //         }
    //
    //         removeNode(node);
    //     };
    //
    //     this.nearest = function (point, maxNodes, maxDistance) {
    //         maxNodes = maxNodes || 1;
    //         if (Array.isArray(point)){
    //             let _p = point;
    //             point = {};
    //             _p.forEach((v,i)=>{
    //                 point[dimensions[i]] = v;
    //             })
    //         }
    //         var i,
    //             result,
    //             bestNodes;
    //
    //         bestNodes = new BinaryHeap(
    //             function (e) {
    //                 return -e[1];
    //             }
    //         );
    //
    //         function nearestSearch(node) {
    //             var bestChild,
    //                 dimension = dimensions[node.dimension],
    //                 ownDistance = metric(point, node.obj),
    //                 linearPoint = {},
    //                 linearDistance,
    //                 otherChild,
    //                 i;
    //
    //             function saveNode(node, distance) {
    //                 bestNodes.push([node, distance]);
    //                 if (bestNodes.size() > maxNodes) {
    //                     bestNodes.pop();
    //                 }
    //             }
    //
    //             for (i = 0; i < dimensions.length; i += 1) {
    //                 if (i === node.dimension) {
    //                     linearPoint[dimensions[i]] = point[dimensions[i]];
    //                 } else {
    //                     linearPoint[dimensions[i]] = node.obj[dimensions[i]];
    //                 }
    //             }
    //
    //             linearDistance = metric(linearPoint, node.obj);
    //
    //             if (node.right === null && node.left === null) {
    //                 if (bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[1]) {
    //                     saveNode(node, ownDistance);
    //                 }
    //                 return;
    //             }
    //
    //             if (node.right === null) {
    //                 bestChild = node.left;
    //             } else if (node.left === null) {
    //                 bestChild = node.right;
    //             } else {
    //                 if (point[dimension] < node.obj[dimension]) {
    //                     bestChild = node.left;
    //                 } else {
    //                     bestChild = node.right;
    //                 }
    //             }
    //
    //             nearestSearch(bestChild);
    //
    //             if (bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[1]) {
    //                 saveNode(node, ownDistance);
    //             }
    //
    //             if (bestNodes.size() < maxNodes || Math.abs(linearDistance) < bestNodes.peek()[1]) {
    //                 if (bestChild === node.left) {
    //                     otherChild = node.right;
    //                 } else {
    //                     otherChild = node.left;
    //                 }
    //                 if (otherChild !== null) {
    //                     nearestSearch(otherChild);
    //                 }
    //             }
    //         }
    //
    //         if (maxDistance) {
    //             for (i = 0; i < maxNodes; i += 1) {
    //                 bestNodes.push([null, maxDistance]);
    //             }
    //         }
    //
    //         if (self.root)
    //             nearestSearch(self.root);
    //
    //         result = [];
    //
    //         for (i = 0; i < Math.min(maxNodes, bestNodes.content.length); i += 1) {
    //             if (bestNodes.content[i][0]) {
    //                 result.push([bestNodes.content[i][0].obj, bestNodes.content[i][1]]);
    //             }
    //         }
    //         return result;
    //     };
    //
    //     this.balanceFactor = function () {
    //         function height(node) {
    //             if (node === null) {
    //                 return 0;
    //             }
    //             return Math.max(height(node.left), height(node.right)) + 1;
    //         }
    //
    //         function count(node) {
    //             if (node === null) {
    //                 return 0;
    //             }
    //             return count(node.left) + count(node.right) + 1;
    //         }
    //
    //         return height(self.root) / (Math.log(count(self.root)) / Math.log(2));
    //     };
    // }

    KDTree.prototype.attachPoints = function (points) {
        this.points = points;
    }

    KDTree.prototype.nearest = function (point, num) {
        num = Math.floor(num || 1);

        if (point.hasOwnProperty("x")) point = [point.x, point.y];

        let res;
        if (num > 1) {
            res = this.kNearestNeighbors(num, point);
            res = res.map((i) => this.points[i]);
        } else {
            res = this.nearestNeighbor(point);
            res = this.points[res];
        }

        return res;
    }

    function dist(p1, p2, sq) {
        if (sq){
            return Snap.len2(
                p1.x || p1[0] || 0,
                p1.y || p1[1] || 0,
                p2.x || p2[0] || 0,
                p2.y || p2[1] || 0,
            )
        } else {
            return Snap.len(
                p1.x || p1[0] || 0,
                p1.y || p1[1] || 0,
                p2.x || p2[0] || 0,
                p2.y || p2[1] || 0,
            )
        }

    }

    KDTree.prototype.nearest_dist = function (point, num, sqere_dist) {
        num = Math.floor(num || 1);
        let points = this.nearest(point, num);

        if (num > 1) {
            return points.map((p) => [p, dist(point, p)])
        } else {
            return [points, dist(point, points, sqere_dist)]
        }
    }

    Snap.kdTree = function (points) {
        const xs = points.map((p) => (p.hasOwnProperty("x") ? p.x : p[0]));
        const ys = points.map((p) => (p.hasOwnProperty("y") ? p.y : p[1]));

        let kd = KDTree.fromAxes([xs, ys])
        kd.attachPoints(points);

        return kd;
    }

    // Binary heap implementation from:
    // http://eloquentjavascript.net/appendix2.html

    function BinaryHeap(scoreFunction) {
        this.content = [];
        this.scoreFunction = scoreFunction;
    }

    BinaryHeap.prototype = {
        push: function (element) {
            // Add the new element to the end of the array.
            this.content.push(element);
            // Allow it to bubble up.
            this.bubbleUp(this.content.length - 1);
        },

        pop: function () {
            // Store the first element so we can return it later.
            var result = this.content[0];
            // Get the element at the end of the array.
            var end = this.content.pop();
            // If there are any elements left, put the end element at the
            // start, and let it sink down.
            if (this.content.length > 0) {
                this.content[0] = end;
                this.sinkDown(0);
            }
            return result;
        },

        peek: function () {
            return this.content[0];
        },

        remove: function (node) {
            var len = this.content.length;
            // To remove a value, we must search through the array to find
            // it.
            for (var i = 0; i < len; i++) {
                if (this.content[i] == node) {
                    // When it is found, the process seen in 'pop' is repeated
                    // to fill up the hole.
                    var end = this.content.pop();
                    if (i != len - 1) {
                        this.content[i] = end;
                        if (this.scoreFunction(end) < this.scoreFunction(node))
                            this.bubbleUp(i);
                        else
                            this.sinkDown(i);
                    }
                    return;
                }
            }
            throw new Error("Node not found.");
        },

        size: function () {
            return this.content.length;
        },

        bubbleUp: function (n) {
            // Fetch the element that has to be moved.
            var element = this.content[n];
            // When at 0, an element can not go up any further.
            while (n > 0) {
                // Compute the parent element's index, and fetch it.
                var parentN = Math.floor((n + 1) / 2) - 1,
                    parent = this.content[parentN];
                // Swap the elements if the parent is greater.
                if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                    this.content[parentN] = element;
                    this.content[n] = parent;
                    // Update 'n' to continue at the new position.
                    n = parentN;
                }
                // Found a parent that is less, no need to move it further.
                else {
                    break;
                }
            }
        },

        sinkDown: function (n) {
            // Look up the target element and its score.
            var length = this.content.length,
                element = this.content[n],
                elemScore = this.scoreFunction(element);

            while (true) {
                // Compute the indices of the child elements.
                var child2N = (n + 1) * 2, child1N = child2N - 1;
                // This is used to store the new position of the element,
                // if any.
                var swap = null;
                // If the first child exists (is inside the array)...
                if (child1N < length) {
                    // Look it up and compute its score.
                    var child1 = this.content[child1N],
                        child1Score = this.scoreFunction(child1);
                    // If the score is less than our element's, we need to swap.
                    if (child1Score < elemScore)
                        swap = child1N;
                }
                // Do the same checks for the other child.
                if (child2N < length) {
                    var child2 = this.content[child2N],
                        child2Score = this.scoreFunction(child2);
                    if (child2Score < (swap == null ? elemScore : child1Score)) {
                        swap = child2N;
                    }
                }

                // If the element needs to be moved, swap it, and continue.
                if (swap != null) {
                    this.content[n] = this.content[swap];
                    this.content[swap] = element;
                    n = swap;
                }
                // Otherwise, we are done.
                else {
                    break;
                }
            }
        }
    };

    Snap.binaryHeap = function (score) {
        return new BinaryHeap(score);
    }

    Snap.randomPoints = function (num, x_dim, y_dim) {
        if (typeof x_dim === "number") x_dim = [0, x_dim];
        if (typeof y_dim === "number") y_dim = [0, y_dim];
        const res = [];
        const min_x = x_dim[0];
        const max_x = x_dim[1];
        const min_y = y_dim[0];
        const max_y = y_dim[1];
        for (let i = 0; i < num; ++i) {
            res.push({
                x: min_x + Math.random() * (max_x - min_x),
                y: min_y + Math.random() * (max_y - min_y),
            })
        }
        return res;
    }


    function clPairs_BF(ps1, ps2) {
        let d = Infinity,
            p1, p2;
        ps1.forEach((p) => {
            ps2.forEach((q) => {
                const dis = Snap.len2(p.x, p.y, q.x, q.y);
                if (dis < d) {
                    d = dis;
                    p1 = p;
                    p2 = q;
                }
            })
        })

        return {d: Math.sqrt(d), pair: [p1, p2]};
    }

    function clPairs_KD(ps1, ps2) {
        let swap = false
        if (ps2.length > ps1.length) {
            [ps2, ps1] = [ps1, ps2];
            swap = true;
        }

        let d = Infinity,
            p1, p2;
        let kd = Snap.kdTree(ps1);
        for (let i = 0, l = ps2.length, nr; i < l; ++i) {
            nr = kd.nearest_dist(ps2[i], 1, true);
            if (nr[1] < d) {
                d = nr[1];
                p1 = nr[0];
                p2 = ps2[i];
            }
        }

        return {d: Math.sqrt(d), pair: (swap) ? [p2, p1] : [p1, p2]};
    }

    Snap.nearPairs = function (set1, set2) {
        if (set1.length * set2.length < 25000) {
            return clPairs_BF(set1, set2);
        } else {
            return clPairs_KD(set1,set2);
        }
    }
});
},{"./voronoi.js":27,"mnemonist/kd-tree":8}],27:[function(require,module,exports){
"use strict"

const triangulate = require("delaunay-triangulate");
const circumcenter = require("circumcenter");
const uniq = require("uniq");

module.exports = voronoi

function compareInt(a, b) {
  return a - b
}

function voronoi1D(points) {
  if(points.length === 1) {
    return {
      cells: [ [-1] ],
      positions: []
    }
  }
  const tagged = points.map(function (p, i) {
    return [p[0], i]
  });
  tagged.sort(function(a,b) {
    return a-b
  })
  const cells = new Array(points.length);
  for(var i=0; i<cells.length; ++i) {
    cells[i] = [-1,-1]
  }
  const dualPoints = [];
  for(let j=1; j<tagged.length; ++j) {
    var a = tagged[j-1]
    var b = tagged[j]
    const center = 0.5 * (a[0] + b[0]);
    const n = dualPoints.length;
    dualPoints.push([center])
    cells[a[1]][1] = n
    cells[b[1]][0] = n
  }
  cells[tagged[0][1]][1] = 0
  cells[tagged[tagged.length-1][1]][0] = dualPoints.length-1
  return {
    cells: cells,
    positions: dualPoints
  }
}



function voronoi(points) {
  const n = points.length;
  if(n === 0) {
    return { cells: [], positions: [] }
  }
  const d = points[0].length;
  if(d < 1) {
    return { cells: [], positions: [] }
  }
  if(d === 1) {
    return voronoi1D(points)
  }

  //First delaunay triangulate all points including point at infinity
  const cells = triangulate(points, true);

  //Construct dual points
  const stars = new Array(n);
  for(var i=0; i<n; ++i) {
    stars[i] = []
  }
  const nc = cells.length;
  const tuple = new Array(d + 1);
  const cellIndex = new Array(nc);
  const dualPoints = [];
  for(var i=0; i<nc; ++i) {
    const verts = cells[i];
    let skip = false;
    for(var j=0; j<=d; ++j) {
      const v = verts[j];
      if(v < 0) {
        cellIndex[i] = -1
        skip = true
      } else {
        stars[v].push(i)
        tuple[j] = points[v]
      }
    }
    if(skip) {
      continue
    }
    cellIndex[i] = dualPoints.length
    dualPoints.push(circumcenter(tuple))
  }

  //Build dual cells
  let dualCells;
  if(d === 2) {
    dualCells = new Array(n)
    for(var i=0; i<n; ++i) {
      const dual = stars[i];
      const c = [cellIndex[dual[0]]];
      var s = cells[dual[0]][(cells[dual[0]].indexOf(i)+1) % 3]
      for(var j=1; j<dual.length; ++j) {
        for(let k=1; k<dual.length; ++k) {
          const x = (cells[dual[k]].indexOf(i) + 2) % 3;
          if(cells[dual[k]][x] === s) {
            c.push(cellIndex[dual[k]])
            s = cells[dual[k]][(x+2)%3]
            break
          }
        }
      }
      dualCells[i] = c
    }
  } else {
    for(var i=0; i<n; ++i) {
      var s = stars[i]
      for(var j=0; j<s.length; ++j) {
        s[j] = cellIndex[s[j]]
      }
      uniq(s, compareInt)
    }
    dualCells = stars
  }

  //Return the resulting cells
  return {
    cells: dualCells,
    positions: dualPoints,
    triangles: cells
  }
}
},{"circumcenter":2,"delaunay-triangulate":3,"uniq":25}]},{},[26]);

(function (root) {
    let Snap_ia = root.Snap_ia || root.Snap;

    //Global Snap Plugin
    Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {

        const STRICT_MODE = true;
        //Snap Constants
        /**
         * If placed as the first argument for an element constructor function called on a element, the new element is
         * placed after current. This overrides the behaviour where the new element will be added inside of grouplike elements.
         * @type {string}
         */
        Snap.FORCE_AFTER = '__force_after';

        /**
         * Returns a bitmap position indicator of two element. As follows:
         * Bits    Number    Meaning
         000000    0    Elements are identical.
         000001    1    The nodes are in different documents (or one is outside of a document).
         000010    2    Node B precedes Node A.
         000100    4    Node A precedes Node B.
         001000    8    Node B contains Node A.
         010000    16    Node A contains Node B.
         Based on code from: Compare Position - MIT Licensed, John Resig
         * @param a the first element
         * @param b the second element (or this element)
         * @return {number}
         */
        Snap._compareDomPosition = function (a, b) {
            a = a.node || a;
            b = b.node || b;

            return a.compareDocumentPosition ?
                a.compareDocumentPosition(b) :
                a.contains ?
                    (a != b && a.contains(b) && 16) +
                    (a != b && b.contains(a) && 8) +
                    (a.sourceIndex >= 0 && b.sourceIndex >= 0 ?
                        (a.sourceIndex < b.sourceIndex && 4) +
                        (a.sourceIndex > b.sourceIndex && 2) :
                        1)
                    + 0 : 0;
        };

        /**
         * Compares the observable position of two elements (above or below). Note that the observable position is opposite to the DOM order.
         * Care should be used when comparing an element to any parent group, because any element will be counted as
         * below the group.
         * @param a The first element
         * @param b the second
         * @return {number} -1 if a is below b, 1 if a is above b, and 0 if the same.
         */
        Snap.positionComparator = function (a, b) {
            const comp = Snap._compareDomPosition(a, b);
            // console.log("A: " + a.getId(), "B: " + b.getId(), comp, "B<A " + (comp & 2), "A<B " + (comp & 4), "BcA " + (comp & 8), "AcB " + (comp & 16));
            if (comp & 8) {
                return -1;
            }
            if (comp & 16) {
                return 1;
            }
            return (comp & 4) ? -1 :
                (comp & 2) ? 1 : 0;
        };

        Snap.positionComparator.inverse = function (a, b) {
            return Snap.positionComparator(b, a);
        };

        Snap.fromPolar = function (r, phi) {
            return {x: r * Math.cos(phi), y: r * Math.sin(phi)};
        };

        Snap.toPolar = function (x, y) {
            return {
                phi: (Math.atan2(y, x) + 2 * Math.PI) % 2 * Math.PI,
                r: Snap.len(x, y, 0, 0),
            };
        };

        Snap.fromPolar_deg = function (r, phi) {
            let rad = Snap.rad(phi);
            return {x: r * Math.cos(rad), y: r * Math.sin(rad)};
        };

        Snap.toPolar_deg = function (x, y) {
            return {
                phi: Snap.deg(((Math.atan2(y, x) + 2 * Math.PI) % 2 * Math.PI)),
                r: Snap.len(x, y, 0, 0),
            };
        };

        Snap.normalize = function (x, y) {
            if (typeof x === 'object' && x.hasOwnProperty('x')) {
                y = x.y;
                x = x.x;
            }

            const l = Snap.len(x, y, 0, 0);
            if (l === 0) return Snap.zero();

            return {x: x / l, y: y / l};

        };

        Snap.orthogonal = function (x, y, lefthand) {
            if (typeof x === 'object' && x.hasOwnProperty('x')) {
                y = x.y;
                x = x.x;
            }
            if (lefthand) {
                return {x: y, y: -x};
            } else {
                return {x: -y, y: x};
            }
        };

        Snap.v_c_mult = function (c, x, y) {
            if (typeof x == 'object') {
                y = x.y || x[1] || 0;
                x = x.x || x[0] || 0;
            }
            return {x: c * x, y: c * y};
        }

        Snap.v_add = function (x1, y1, x2, y2) {
            if (typeof y1 === 'object') {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == 'object') {
                y1 = x1.y || x1[1] || 0;
                x1 = x1.x || x1[0] || 0;
            }
            return {x: x1 + x2, y: y1 + y2};
        }

        Snap.v_subtract = function (x1, y1, x2, y2) {
            if (typeof y1 === 'object') {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == 'object') {
                y1 = x1.y || x1[1] || 0;
                x1 = x1.x || x1[0] || 0;
            }
            return {x: x1 - x2, y: y1 - y2};
        }

        Snap.v_mid = function (x1, y1, x2, y2) {
            if (typeof y1 === 'object') {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == 'object') {
                y1 = x1.y || x1[1] || 0;
                x1 = x1.x || x1[0] || 0;
            }
            return {x: (x1 + x2) / 2, y: (y1 + y2) / 2};
        }

        Snap.dot = function (x1, y1, x2, y2) {
            if (typeof y1 === 'object') {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == 'object') {
                y1 = x1.y || x1[1] || 0;
                x1 = x1.x || x1[0] || 0;
            }
            return x1 * x2 + y1 * y2;
        }

        Snap.cross = function (x1, y1, x2, y2) {
            if (typeof y1 === 'object') {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == 'object') {
                y1 = x1.y || x1[1] || 0;
                x1 = x1.x || x1[0] || 0;
            }
            return x1 * y2 - x2 * y1;
        }

        Snap.project = function (x1, y1, x2, y2) {
            if (typeof y1 === 'object') {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == 'object') {
                y1 = x1.y || x1[1] || 0;
                x1 = x1.x || x1[0] || 0;
            }
            let dotProduct = Snap.dot(x1, y1, x2, y2);
            let lengthSquared = Snap.len2(x2, y2);
            let scalar = dotProduct ? dotProduct / lengthSquared : 0;
            return {x: scalar * x2, y: scalar * y2};
        }
        Snap.zero = function () {
            return {x: 0, y: 0};
        }

        Snap.vectorPointToLine = function (p, lp1, lp2, normalize, sq_error) {
            sq_error = sq_error || 1e-5;
            if (Snap.len2(lp1.x, lp1.y, lp2.x, lp2.x) < sq_error) {
                const ret = {x: lp1.x - p.x, y: lp1.y - p.y};
                if (normalize) {

                }
            }
            let x0 = p.x || +p[0] || 0, y0 = p.y || +p[1] || 0,
                x1 = lp1.x || +lp1[0] || 0, y1 = lp1.y || +lp1[1] || 0,
                x2 = lp2.x || +lp2[0] || 0, y2 = lp2.y || +lp2[1] || 0;

            let num = Math.abs(
                (y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1);
            let denum = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

            let distance = num / denum;

            const orthogonal = Snap.orthogonal({x: x2 - x1, y: y2 - y1});
            let norm = Snap.normalize(orthogonal);

            const distance_vector = {
                x: x0 + distance * norm.x,
                y: y0 + distance * norm.y,
            };

            if (Snap.len2(x1, y1, distance_vector.x, distance_vector.y) <
                Snap.len2(x1, y1, x0, y0)) {
                return (normalize) ?
                    norm :
                    {x: distance * norm.x, y: distance * norm.y};  //in this case the norm vector is towards the line
            } else {
                return (normalize) ? {x: -norm.x, y: -norm.y} : {
                    x: -distance * norm.x,
                    y: -distance * norm.y,
                }; // in this case the norm vector is way from the line.
            }
        };

        /**
         * Checks if an angle is between to other angles, where an angle is
         * between when it is withing the smaller segment of the other angles.
         * @param a1 reference angle 1
         * @param a2 reference angle 2
         * @param target the target angle to check
         * @returns {boolean}
         */
        Snap.angle_between = function (a1, a2, target) {
            let dif_1_2 = (Math.abs(a1 - a2) + 360) % 360;
            dif_1_2 > 180 && (dif_1_2 = 360 - dif_1_2);
            let dif_1_t = (Math.abs(a1 - target) + 360) % 360;
            dif_1_t > 180 && (dif_1_t = 360 - dif_1_t);
            let dif_2_t = (Math.abs(a2 - target) + 360) % 360;
            dif_2_t > 180 && (dif_2_t = 360 - dif_2_t);

            return (dif_1_t + dif_2_t) <= dif_1_2 + 1e-12;
        };

        Snap.angle_normalize = function (angle, bwn_neg_pos, rad) {
            if (rad) {
                if (bwn_neg_pos) {
                    angle = (angle + Math.PI) % (2 * Math.PI) - Math.PI;
                    return (angle > -Math.PI) ? angle : -angle;
                } else {
                    return angle - Math.floor(angle / (2 * Math.PI)) * 2 * Math.PI;
                }
            } else {
                if (bwn_neg_pos) {
                    angle = (angle + 180 + 360) % 360 - 180;
                    return angle > -180 ? angle : -angle;
                } else {
                    return (angle >= 0 ? angle : (360 - ((-angle) % 360))) % 360
                }
            }
        }

        Snap.getSafeDistance = function (ct, el, top) {
            // if (top === undefined) top = false;
            const bbox = el.getBBox();
            if (ct.x < bbox.x || ct.x > bbox.x2 || ct.y < bbox.y || ct.y >
                bbox.y2) return 0;
            if (top) return ct.y - bbox.y;
            return Math.max(Snap.len(ct.x, ct.y, bbox.x, bbox.y),
                Snap.len(ct.x, ct.y, bbox.x2, bbox.y),
                Snap.len(ct.x, ct.y, bbox.x, bbox.y2),
                Snap.len(ct.x, ct.y, bbox.x2, bbox.y2));
        };

        Snap.groupToGroupChangeOfBase = function (from, to) {
            const fromMatrix = from.transform().totalMatrix;
            const toMatrix_inv = to.transform().totalMatrix.invert();
            return toMatrix_inv.multLeft(fromMatrix);
        }

        /**
         * Helper function to determine whether there is an intersection between the two polygons described
         * by the lists of vertices. Uses the Separating Axis Theorem
         *
         * @param a an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
         * @param b an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
         * @return true if there is any intersection between the 2 polygons, false otherwise
         */
        Snap.polygonsIntersectConcave = function (a, b) {
            //todo use points
            const polygons = [a, b];
            let minA, maxA, projected, i, i1, j, minB, maxB;

            for (i = 0; i < polygons.length; i++) {

                // for each polygon, look at each edge of the polygon, and determine if it separates
                // the two shapes
                const polygon = polygons[i];
                for (i1 = 0; i1 < polygon.length; i1++) {

                    // grab 2 vertices to create an edge
                    const i2 = (i1 + 1) % polygon.length;
                    const p1 = polygon[i1];
                    const p2 = polygon[i2];

                    // find the line perpendicular to this edge
                    const normal = {x: p2.y - p1.y, y: p1.x - p2.x};

                    minA = maxA = undefined;
                    // for each vertex in the first shape, project it onto the line perpendicular to the edge
                    // and keep track of the min and max of these values
                    for (j = 0; j < a.length; j++) {
                        projected = normal.x * a[j].x + normal.y * a[j].y;
                        if (minA === undefined || projected < minA) {
                            minA = projected;
                        }
                        if (maxA === undefined || projected > maxA) {
                            maxA = projected;
                        }
                    }

                    // for each vertex in the second shape, project it onto the line perpendicular to the edge
                    // and keep track of the min and max of these values
                    minB = maxB = undefined;
                    for (j = 0; j < b.length; j++) {
                        projected = normal.x * b[j].x + normal.y * b[j].y;
                        if (minB === undefined || projected < minB) {
                            minB = projected;
                        }
                        if (maxB === undefined || projected > maxB) {
                            maxB = projected;
                        }
                    }

                    // if there is no overlap between the projects, the edge we are looking at separates the two
                    // polygons, and we know there is no overlap
                    if (maxA < minB || maxB < minA) {
                        // CONSOLE("polygons don't intersect!");
                        return false;
                    }
                }
            }
            return true;
        };

        Snap.polygonExpand = function (points, distance) {
            const expandedPoints = [];
            const numPoints = points.length;

            // Compute the centroid of the polygon
            let centroid = {x: 0, y: 0};
            for (let i = 0; i < numPoints; i++) {
                centroid.x += points[i].x;
                centroid.y += points[i].y;
            }
            centroid.x /= numPoints;
            centroid.y /= numPoints;

            for (let i = 0; i < numPoints; i++) {
                const current = points[i];
                const prev = points[(i - 1 + numPoints) % numPoints];
                const next = points[(i + 1) % numPoints];

                // Calculate normalized direction vectors
                const prevDir = Snap.normalize({x: current.x - prev.x, y: current.y - prev.y});
                const nextDir = Snap.normalize({x: next.x - current.x, y: next.y - current.y});

                // Calculate outward normal vectors by rotating direction vectors 90 degrees
                const prevNormal = {x: -prevDir.y, y: prevDir.x};
                const nextNormal = {x: -nextDir.y, y: nextDir.x};

                // Average the normals to maintain the original angles better
                const offsetDir = Snap.normalize({
                    x: prevNormal.x + nextNormal.x,
                    y: prevNormal.y + nextNormal.y
                });

                // Determine the direction of expansion based on the centroid
                const directionToCentroid = Snap.normalize({
                    x: centroid.x - current.x,
                    y: centroid.y - current.y
                });

                // Ensure the offset direction is outward
                const dotProduct = Snap.dot(offsetDir, directionToCentroid);
                const outwardDir = dotProduct > 0 ? {x: -offsetDir.x, y: -offsetDir.y} : offsetDir;

                // Offset the current point by the distance along the computed direction
                expandedPoints.push({
                    x: current.x + outwardDir.x * distance,
                    y: current.y + outwardDir.y * distance
                });
            }

            return expandedPoints;
        }
        Snap.load = function (url, callback, scope, data, filter, fail, fail_scope, _eve) {
            if (typeof scope === 'function') {
                if (scope.isEve) {
                    _eve = scope;
                    scope = undefined;
                } else {
                    _eve = fail_scope;
                    fail_scope = data;
                    fail = scope;
                    data = undefined;
                    filter = undefined;
                }
            }

            if (typeof data === 'function') {
                if (data.isEve) {
                    _eve = data;
                    data = undefined;
                } else {
                    _eve = fail;
                    fail_scope = filter;
                    fail = data;
                    data = undefined;
                    filter = undefined;
                }
            }

            if (typeof fail_scope === 'function' && fail_scope.isEve) {
                _eve = fail_scope;
                scope = fail_scope;
            }

            if (data) {
                //already processed
                var f = Snap.parse(data, filter);
                scope ? callback.call(scope, f) : callback(f);
            } else {
                let post_data = undefined;
                if (Array.isArray(url)) {
                    post_data = url[1];
                    url = url[0];
                }
                _eve = _eve || eve;
                _eve(['com', 'load'], undefined, url);
                Snap.ajax(url, post_data, function (req) {
                    let data = undefined;
                    if (req.responseText.startsWith('Base64:')) {
                        data = atob(req.responseText.slice(7));
                    }
                    if (req.responseText.startsWith('LZBase64:')) {
                        if (window.LZString !== undefined) {
                            data = LZString.decompressFromBase64(req.responseText.slice(9));
                        } else {
                            fail.call(fail_scope, 'LZString is not loaded');
                            return;
                        }
                    }
                    const f = Snap.parse(data || req.responseText, filter);
                    scope ?
                        callback.call(scope, f, data || req.responseText) :
                        callback(f, data || req.responseText);
                }, undefined, fail, fail_scope);
            }
        };


        function decode_json(json, decript = undefined, map = undefined, system = undefined) {
            let attr = (system && (system.attr || system.attributes)) || "A";
            let type = (system && system.type) || "T";
            let children = (system && system.children) || "C";

            if (typeof json === "string") {
                try {
                    json = JSON.parse(json);
                } catch (e) {
                    return "";
                }
            }

            let xmlStr = "";

            if (!map && json['_']) {
                map = json['_'];
            }

            if (!map || typeof map !== "object") {
                throw new Error("No map provided");
            }

            if (decript && typeof decript === "function") {
                map = decript(map);
            }

            const typeName = map[json[type]] || json[type];

            if (typeName === 'svg') {
                xmlStr += "<svg";
            } else {
                xmlStr += "<" + typeName;
            }

            if (json[attr]) {
                for (const [key, value] of Object.entries(json[attr])) {
                    let attribute = map[key] || key;
                    if (typeof value === "object") {
                        let valueStr = "";
                        for (const [styleKey, styleValue] of Object.entries(value)) {
                            let styleAttr = map[styleKey] || styleKey;
                            if (typeof styleValue === "object") {
                                let styleValueStr = "";
                                for (const [styleKey2, styleValue2] of Object.entries(styleValue)) {
                                    let styleAttr2 = map[styleKey2] || styleKey2;
                                    styleValueStr += `${styleAttr2}:${styleValue2};`;
                                }
                                valueStr += `${styleAttr}:${styleValueStr}`;
                            } else {
                                valueStr += `${styleAttr}:${styleValue};`;
                            }
                        }
                        xmlStr += ` ${attribute}="${valueStr}"`;
                    } else {
                        xmlStr += ` ${attribute}="${value}"`;
                    }
                }
            }

            if (json[children]) {
                xmlStr += ">";
                let text_added = false;
                for (const child of json[children]) {
                    if (typeof child === "string") {
                        xmlStr += (text_added ? '\n' : "") + child;
                        text_added = true;
                    } else {
                        xmlStr += decode_json(child, decript, map, system);
                        text_added = false;
                    }
                }
                xmlStr += `</${typeName}>`;
            } else {
                xmlStr += "/>";
            }

            return xmlStr;
        }

        Snap.jsonToSvg = decode_json;

        Snap.rgb2cmyk = function (r, g, b) {
            let computedC = 0;
            let computedM = 0;
            let computedY = 0;
            let computedK = 0;

            if (r == null || g == null || b == null ||
                isNaN(r) || isNaN(g) || isNaN(b)) {
                // alert ('Please enter numeric RGB values!');
                return {c: 0, m: 0, y: 0, k: 0};
            }
            if (r < 0 || g < 0 || b < 0 || r > 1 || g > 1 || b > 1) {
                // alert ('RGB values must be in the range 0 to 255.');
                return {c: 0, m: 0, y: 0, k: 0};
            }

            // BLACK
            if (r === 0 && g === 0 && b === 0) {
                computedK = 1;
                return {c: 0, m: 0, y: 0, k: 1};
            }

            computedC = 1 - (r);
            computedM = 1 - (g);
            computedY = 1 - (b);

            const minCMY = Math.min(computedC,
                Math.min(computedM, computedY));
            computedC = (computedC - minCMY) / (1 - minCMY);
            computedM = (computedM - minCMY) / (1 - minCMY);
            computedY = (computedY - minCMY) / (1 - minCMY);
            computedK = minCMY;

            return {c: computedC, m: computedM, y: computedY, k: computedK};
        };

        Snap.cmykToRgb = function (c, m, y, k) {

            let result = {r: 0, g: 0, b: 0};

            result.r = round((1 - c) * (1 - k) * 255);
            result.g = round((1 - m) * (1 - k) * 255);
            result.b = round((1 - y) * (1 - k) * 255);

            return result;
        };

        /**
         * Changes the format of style from string to object and vice versa
         * @param {String | Object} style a string or object presentation of a style
         * @return {String | Object} returns an object or string presentation of the style respectively
         */
        Snap.convertStyleFormat = function (style) {
            let result;
            if (!style) return {};
            if (typeof style === 'string') {
                result = {};
                const coms = style.split(';');
                let i = 0, com;
                for (; i < coms.length; ++i) {
                    com = coms[i].split(':');
                    if (com.length === 2) result[com[0].replace(/\s/g,
                        '')] = com[1].replace(/\s/g, '');
                }
                return result;
            } else if (typeof style === 'object') {
                result = [];
                for (let stl in style) {
                    if (style.hasOwnProperty(stl)) {
                        result.push(stl + ':' + style[stl]);
                    }
                }
                return result.join(';');
            }

        };

        Snap.camelToHyphen = function (str) {
            return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
        }

        Snap.toCamelCase = function (str) {
            return str.replace(/[-_]+([a-z])/gi, function ($1, letter) {
                return letter.toUpperCase();
            });
        }

        Snap.waitFor = function (condition, callback, timelimit, fail_callback) {
            timelimit = timelimit || 1000;
            let step = 10;
            if (Array.isArray(timelimit)) {
                step = (typeof timelimit[1] === 'number') ? timelimit[1] : step;
                timelimit = (typeof timelimit[0] === 'number') ?
                    timelimit[0] :
                    1000;
            }
            const start_time = Date.now();
            let timer = setInterval(function () {
                if (condition()) {
                    clearInterval(timer);
                    // console.log("Success waiting");
                    callback();
                } else if (Date.now() - start_time > timelimit) {
                    clearInterval(timer);
                    if (fail_callback) fail_callback();
                }
            }, step);
        };


        /**
         * Validate url format
         * @param url_string the url string
         * @param relative whether to validate a relative string
         * @return {boolean} true iff a valid url
         */

        Snap.isUrl = function (url_string, relative) {
            if (relative) {
                const pattern = /^(?!www\.|(?:http|ftp)s?:\/\/|[A-Za-z]:\\|\/\/)[^\s]*$/;
                return pattern.test(url_string);
            } else {
                try {
                    new URL(url_string);
                    return true;
                } catch (_) {
                    return false;
                }
            }
        }

        Snap.isEmptyObject = function (obj) {
            for (var prop in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                    return false;
                }
            }
            return true;
        }

        const htmlEntities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&#38;': '&',
            '&#60;': '<',
            '&#62;': '>'
            // '&quot;': '"',
            // '&#39;': "'"
        };
        Snap.AI_name_fix = function (str) {
            if (!str) return '';
            const result = str.replace(/_(x[0-9A-F]{2})_/g, function (_, b) {
                return String.fromCharCode('0' + b);
            }).replace(/(.+)(_\d+_)$/, function (_, id) {
                return id;
            }).replace(/&[a-zA-Z0-9#]+;/g, function (match) {
                return htmlEntities[match] || match;
            });
            return result.replace(/ /g, '_');

        };

        Snap.dimFromElement = function (el, dim) {
            if (!Snap.is(el, 'Element')) return el;
            return el.getBBox()[dim];
        }

        Snap.varDimension = function (str, space, negative) {

            if (typeof str === "number") return str;

            let max = Infinity, min = 0;
            if (Array.isArray(str)) {
                min = str[1] || 0;
                max = str[2] || Infinity;
                str = str[0];
            }

            const repls_percent = function (a, b) {
                b = b.replace('%', '');
                return String(space * b / 100);
            };
            const reg_percent = /(\d*\.?\d*%)/g;
            str = str.replace(reg_percent, repls_percent);

            try {
                if (typeof max === 'string') max = math.evaluate(
                    max.replace(reg_percent, repls_percent));
            } catch (e) {
                max = Infinity;
            }

            try {
                if (typeof min === 'string') min = math.evaluate(
                    min.replace(reg_percent, repls_percent));
            } catch (e) {
                min = 0;
            }

            try {
                str = math.evaluate(str);
            } catch (e) {
                str = space;
            }

            if (negative) {
                return Math.min(Math.max(str, -max), max);
            }
            return Math.min(Math.max(str, min), max);
        }

    });


    //Matrix functions
    Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {
        //Matrix Extentions

        Snap.Matrix.prototype.apply = function (point, node) {
            let ret = {};
            ret.x = this.x(point.x || point[0] || 0, point.y || +point[1] || 0);
            ret.y = this.y(point.x || point[0] || 0, point.y || point[1] || 0);
            return ret;
        };


        Snap.Matrix.prototype.twoPointTransform = function (
            p1_x, p1_y, p2_x, p2_y, toP1_x, toP1_y, toP2_x, toP2_y) {
            const l1 = [p2_x - p1_x, p2_y - p1_y],
                l2 = [toP2_x - toP1_x, toP2_y - toP1_y];

            const scale = (Snap.len(l2[0], l2[1]) /
                (Snap.len(l1[0], l1[1]) || 1e-12));
            let angle = Snap.angle(l1[0], l1[1], l2[0], l2[1], 0, 0);

            const eq_matrix = [
                [p1_x, -p1_y, 1, 0],
                [p1_y, p1_x, 0, 1],
                [p2_x, -p2_y, 1, 0],
                [p2_y, p2_x, 0, 1],
            ];
            let solution;
            try {
                solution = math.lusolve(eq_matrix,
                    [toP1_x, toP1_y, toP2_x, toP2_y]).map((c) => c[0]);
            } catch (e) {
                return null;
            }

            this.a = solution[0];
            this.b = solution[1];
            this.c = -solution[1];
            this.d = solution[0];
            this.e = solution[2];
            this.f = solution[3];

            return this;
        };
    })

}(typeof window !== "undefined" ? window : (global)))
(function (root) {

    let Snap_ia = root.Snap_ia || root.Snap;
//Element Extansions
    Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {

        //ELEMENT Functions

        let _ = {};

        Element.prototype.getId = function () {
            let id = this.attr('id');
            if (!id) {
                id = this.id;
                this.attr('id', id);
            }
            return id;
        };

        /**
         * Sets the id of the element and adjusts any references of the object.
         *
         * @param {String | undefined} id the new id, if undefined a unique
         * variation if the id is created.
         * @param {Element | undefined} from_group a limiting group where to
         * look for references. This is useful if the elements of the group have
         * been added form another file and we need to change ids to avoid
         * conflicts
         * @return {Element} this
         */
        Element.prototype.setIdFollowRefs = function (id, from_group) {
            if (id instanceof Element) {
                from_group = id;
                id = undefined;
            }
            let orig = this.getId();

            if (!id) {
                let rand = String.rand || function () {
                    let inc = 1;
                    return () => {
                        return String(inc++);
                    };
                }();

                id = orig + '_' + rand(4);
                while (this.paper.selectAll('#' + id).length) {
                    id = orig + '_' + rand(4);
                }
            }

            const references = this.getReferringToMe(from_group);
            this.attr('id', id);
            const type = this.type;
            references.forEach((ref) => {
                switch (type) {
                    case 'clipPath': {
                        const attr = 'url("#' + orig + '")';
                        const new_attr = 'url("#' + id + '")';
                        const cp = ref.attr('clip-path');
                        if (cp === attr) {
                            ref.attr('clip-path', new_attr);
                        }
                        if (ref.node.style.clipPath === attr) {
                            ref.node.style.clipPath = new_attr;
                        }
                        break;
                    }
                    case 'mask': {
                        const attr = 'url("#' + orig + '")';
                        const new_attr = 'url("#' + id + '")';
                        if (ref.attr('mask') === attr) {
                            ref.attr('mask', new_attr);
                        }
                        if (ref.node.style.mask === attr) {
                            ref.node.style.mask = new_attr;
                        }
                        break;
                    }
                    case 'pattern':
                    case 'linearGradient':
                    case 'lineargradient':
                    case 'radialGradient':
                    case 'radialgradient': {
                        const attr = 'url("#' + orig + '")';
                        const new_attr = 'url("#' + id + '")';
                        let attr1 = ref.attr('fill');
                        if (Snap.is(attr1, "Element")) {
                            attr1 = 'url("#' + attr1.attr("id") + '")';
                        }
                        if (attr1 === attr) {
                            ref.attr('fill', new_attr);
                        }
                        if (ref.node.style.fill === attr) {
                            ref.node.style.fill = new_attr;
                        }
                        let stroke = ref.attr('stroke');
                        if (stroke && Snap.is(stroke, "Element")) {
                            stroke = 'url("#' + stroke.attr("id") + '")';
                        }
                        if (stroke === attr) {
                            ref.attr('stroke', new_attr);
                        }
                        if (ref.node.style.stroke === attr) {
                            ref.node.style.stroke = new_attr;
                        }
                        if (ref.attr('href') === "#" + orig) {
                            ref.attr('href', '#' + id);
                        }
                        break;
                    }
                    case 'symbol':
                    default: {
                        const attr = '#' + orig;
                        const new_attr = '#' + id;
                        if (ref.attr('href') === attr) {
                            ref.attr('href', new_attr);
                        }
                        if (ref.attr('xlink:href') === attr) {
                            ref.attr('xlink:href', new_attr);
                        }
                    }
                }

            });

            return this;
        };

        Element.prototype.getTopSVG = function () {
            return Snap(this.paper.node);
        };

        /**
         * Gets all elements that use the five element as a reference.
         * This is useful mainly for clipPath, mask, pattern, gradients or symbol element,
         * however, it can be used with any other element for a <use> tag.
         * @param {Element | undefined} in_group optional group where to search
         * for reference.
         * @returns {Iterable} The element having the reference.
         */
        Element.prototype.getReferringToMe = function (in_group) {
            in_group = in_group || this.paper;
            const id = this.getId();
            switch (this.type) {
                case 'clippath': {
                    const css = '[clip-path="url(#' + id + ')"]';
                    // + ','+ '[style*="clip-path: url(#' + id + ')"]'
                    // + ','+ '[style*="clip-path:url(#' + id + ')"]';
                    let found = in_group.selectAll(css);
                    if (found.length === 0) {
                        found = in_group.selectAll('[style*="clip-path:"]');
                        found = found.filter((el) => {
                            let cp_val = el.node.style.clipPath;
                            if (cp_val) cp_val = cp_val.replace('url("#', '').replace('")', '');
                            return cp_val === id;
                        });
                    }
                    return found;
                }
                case 'mask': {
                    let found = in_group.selectAll(
                        '[mask="url(#' + id + ')"]',
                        // + ',' + '[style*="mask: url(#' + id + ')"]' + ',',
                        // + '[style*="mask:url(#' + id + ')"]',
                    );
                    if (found.length === 0) {
                        found = in_group.selectAll('[style*="mask:"]');
                        found = found.filter((el) => {
                            let cp_val = el.node.style.mask;
                            if (cp_val) cp_val = cp_val.replace('url("#', '').replace('")', '');
                            return cp_val === id;
                        });
                    }
                    return found;
                }
                case 'pattern':
                case 'linearGradient':
                case 'lineargradient':
                case 'radialGradient':
                case 'radialgradient': {
                    let found = in_group.selectAll(
                        '[fill="url(#' + id + ')"]'
                        + ',' + '[href="url(#' + id + ')"]'
                        + ',' + '[href="#' + id + '"]'
                        + ',' + '[style*="fill: url(#' + id + ')"]'
                        + ',' + '[style*="fill:url(#' + id + ')"]'
                        + ',' + '[stroke="url(#' + id + ')"]'
                        + ',' + '[style*="stroke: url(#' + id + ')"]'
                        + ',' + '[style*="stroke:url(#' + id + ')"]',
                    );
                    return found;
                }
                case 'symbol':
                default: {
                    const css = 'use[*|href="#' + id + '"]';
                    let found = in_group.selectAll(css);
                    return found;
                }
            }

        };

        Element.prototype.repositionInGroup = function (group) {
            if (!group.isGroupLike() && group.type !== 'svg') return;
            if (this.parent() === group) return;
            const diffMatrix = this.transform().diffMatrix;
            const gr_Matrix = group.transform().totalMatrix;
            const new_trans = diffMatrix.multLeft(gr_Matrix.invert());
            group.add(this);
            this.addTransform(new_trans);
        };

        Element.prototype.globalToLocal = function (globalPoint, coordTarget) {

            let ctm = coordTarget.node.getCTM();
            const globalToLocal = ctm ? ctm.inverse().multiply(this.node.getCTM()) : this.node.getCTM();
            globalToLocal.e = globalToLocal.f = 0;
            return globalPoint.matrixTransform(globalToLocal);
        };

        Element.prototype.getCursorPoint = function (x, y, coordTarget) {
            const pt = this.paper.node.createSVGPoint();
            coordTarget = coordTarget || this;

            pt.x = x;
            pt.y = y;

            // Adjust the coordinates for the scroll position
            pt.x = x - Snap.window().scrollX;
            pt.y = y - Snap.window().scrollY;


            let screenCTM = coordTarget.node.getScreenCTM();
            // console.log(screenCTM, this.paper.screenCTM_compensation_matrix)

            if (this.paper.screenCTM_compensation_matrix) {
                screenCTM = new DOMMatrix([
                    screenCTM.a,
                    screenCTM.b,
                    screenCTM.c,
                    screenCTM.d,
                    screenCTM.e,
                    screenCTM.f
                ])
                // screenCTM = screenCTM_new.multiply(this.paper.screenCTM_compensation_matrix);

                screenCTM = this.paper.screenCTM_compensation_matrix.multiply(screenCTM);
            }

            const matrix = screenCTM.inverse();
            const domPoint = pt.matrixTransform(matrix);
            // console.log(pt, domPoint, screenCTM, matrix);
            return domPoint;
        };

        /**
         * Converts a screen distance to a distance in the local coord system of this element
         * @param {number} d the distance
         * @return {number}
         */
        function fromScreenDistance(d) {
            if (this.type !== 'svg' && this.type !== 'g') return this.parent().getFromScreenDistance(d);
            let pt = this.paper.node.createSVGPoint();

            pt.x = d;
            pt.y = 0;

            const matrix = this.node.getScreenCTM().inverse();
            matrix.e = 0;
            matrix.f = 0;

            pt = pt.matrixTransform(matrix);
            return (pt.y) ? Math.sqrt(pt.x * pt.x + pt.y * pt.y) : Math.abs(pt.x);
        }

        Element.prototype.getFromScreenDistance = fromScreenDistance;

        Element.prototype.getClientWidth = function (skip_style) {
            if (this.node.clientWidth) return this.node.clientWidth;
            if (!skip_style) {
                let width = Snap.window().getComputedStyle(this.node).width;
                if (width.endsWith('px')) {
                    width = parseInt(width);
                } else if (width.endsWith('%')) {
                    width = parseInt(width) / 100 * this.parent().getClientWidth();
                } else if (width === 'auto' || width === 'inherit') {
                    width = this.parent().getClientWidth();
                }
                return +width;
            }
            const parent = this.parent();
            if (parent) {
                return parent.getClientWidth();
            } else {
                return 0;
            }
        }

        Element.prototype.getClientHeight = function (skip_style) {
            if (this.node.clientHeight) return this.node.clientHeight;
            if (!skip_style) {
                let height = Snap.window().getComputedStyle(this.node).height;
                if (height.endsWith('px')) {
                    height = parseInt(height);
                } else if (height.endsWith('%')) {
                    height = parseInt(height) / 100 * this.parent().getClientHeight();
                } else if (height === 'auto' || height === 'inherit') {
                    height = this.parent().getClientHeight();
                }
                return +height;
            }
            const parent = this.parent();
            if (parent) {
                return parent.getClientHeight();
            } else {
                return 0;
            }
        }

        Element.prototype.isInRect = function (rect) {
            // var box = rect.node.getBBox(); //get a proper SVGRect element
            if (this.type == 'g') {
                const children = this.getChildren();
                let i = 0;
                const max = children.length;
                for (; i < max; ++i) {
                    if (children[i].isInRect(rect)) return true;
                }
                return false;
            } else {
                // var node = el.paper.node;
                // var checkEnclosure = node.checkEnclosure(el.node, box);
                // var checkIntersection = node.checkIntersection(el.node, box);
                return this.isOverlapRect(rect);
            }
        };

        Element.prototype.getDirectionLine = function (sample, gui) {
            if (!root.ss) return null;
            sample = sample || 100;
            let el = this;
            let line_slope_intersect = null;
            switch (this.type) {
                case 'polygon':
                case 'polyline':
                case 'path':
                    const l = el.getTotalLength();
                    const inc = l / sample;
                    const points = [];
                    for (let i = 0, d = 0, p; i < sample; ++i, d += inc) {
                        p = el.getPointAtLength(d);
                        let c = gui.svgRoot.circle(p.x, p.y, .3).attr({id: 'c' + i, fill: 'red'});
                        points.push([p.x, p.y]);
                    }

                    line_slope_intersect = ss.linearRegression(points);

                    if (isNaN(line_slope_intersect.m)
                        || Math.abs(line_slope_intersect.m) === Infinity) {
                        line_slope_intersect.m = 90;
                        break;
                    }

                    line_slope_intersect.m = Snap.deg(
                        Math.atan(line_slope_intersect.m));
                    line_slope_intersect = [
                        line_slope_intersect.m,
                        line_slope_intersect.b];
                    break;
                case 'ellipse':
                    //todo
                    break;
                case 'rect':
                //todo
                case 'g':
            }

            return line_slope_intersect;
        };

        Element.prototype.setCursor = function (cursorStyle, apply_to_children) {
            //todo: allow url.
            if (!cursorStyle) {
                cursorStyle = 'default';
            }

            if (cursorStyle.startsWith("url(")) {
                // Direct style assignment for URL-based cursors
                this.node.style.cursor = cursorStyle;
                this.removeClass("IA_Designer_Cursor", true);
            } else if (!this.hasClass("IA_Designer_Cursor_" + cursorStyle)) {
                // Class-based cursor styling for standard cursors
                this.node.style.cursor = "inherit";
                this.removeClass("IA_Designer_Cursor", true);
                this.addClass("IA_Designer_Cursor_" + cursorStyle);
            }

            // if (cursorStyle === 'inherit') {
            //     const parent = this.parent();
            //     if (parent)
            //         return this.setCursor(parent.node.style.cursor);
            // }
            //
            // if (cursorStyle) {
            //     this.node.style.cursor = cursorStyle;
            // } else {
            //     this.node.style.cursor = 'default';
            // }

            if (apply_to_children) {
                const children = this.getChildren();

                for (let i = 0; i < children.length; ++i) {
                    children[i].setCursor(cursorStyle);
                }
            }

            return this;
        };

        Element.prototype.centerOfMass = function () {
            const cm = this.paper.node.createSVGPoint();
            if (this.attr('center_mass_x') !== null &&
                this.attr('center_mass_y') !== null) {
                cm.x = Number(this.attr('center_mass_x'));
                cm.y = Number(this.attr('center_mass_y'));
                // return cm;
                return this.getLocalMatrix(STRICT_MODE).apply(cm);
                // return this.data("center_mass");
            }
            const bBox = this.getBBox();
            cm.x = bBox.cx;
            cm.y = bBox.cy;

            // this.attr("center_mass_x", cm.x);
            // this.attr("center_mass_y", cm.y);
            //This is temporary, it should get the center from the object attributes and apply transform to it.
            return cm;
        };

        Element.prototype.centerRotation = function () {
            //todo: fix this
            return this.centerOfMass();
        };


        let old_remove = Element.prototype.remove;

        Element.prototype.remove = function (skip_linked, skip_reg_fun_childern) {
            if (!skip_linked && IA_Designer &&
                IA_Designer.class_defs.LINKED_RESOURCE) {
                let recourse_class = this.data(
                    IA_Designer.class_defs.LINKED_RESOURCE) || [];
                if (!Array.isArray(
                    recourse_class)) recourse_class = [recourse_class];

                if (this.isGroupLike()) {
                    this.selectAll('.' + IA_Designer.class_defs.HAS_LINKED_RESOURCE).forEach(
                        (el) => recourse_class.push(
                            el.data(IA_Designer.class_defs.LINKED_RESOURCE)),
                    );
                }
                if (recourse_class.length) {
                    recourse_class.forEach(
                        (class_name) => {
                            if (class_name) {
                                let linked = this.paper.selectAll('.' + recourse_class);
                                if (linked.length) {
                                    linked.forEach((el) => el.remove());
                                }
                            }
                        },
                    );
                }
            }

            if (this.paper && this.paper._partner_map) {
                let partners_of_desendents = Object.values(this.paper._partner_map).filter((el) => {
                    return this.isParentOf(el);
                });
                partners_of_desendents.forEach((el) => {
                    el.removePartner(true);
                });
            }

            this.cleanupAfterRemove();

            return old_remove.bind(this)();
        };

        Element.prototype.hide = function () {
            this.setStyle("display", "none");
        }

        Element.prototype.show = function () {
            this.setStyle("display", "");
        }

        Element.prototype.removeSlowly = function (time) {
            if (time === undefined) time = 500;
            this.animate({opacity: 0}, time, undefined, () => this.remove());
        }

        Element.prototype.hideSlowly = function (time, after) {
            if (time === undefined) time = 500;
            this.animate({opacity: 0}, time, undefined, () => {
                this.setStyle("display", "none")
                typeof after === "function" && after();
            });
        }

        Element.prototype.showSlowly = function (time, after) {
            if (time === undefined) time = 500;
            let opacity = +this.attr("opacity") || 1;
            this.setStyle({"display": "", opacity: 0});
            this.animate({opacity: opacity}, time, undefined, () => {
                    typeof after === "function" && after()
                }
            );
        }


        Element.prototype.flatten = function (process_css) {
            if (!this.isGroupLike()) return this;
            const children = this.getChildren();
            let after_el = this;
            let trans = this.getLocalMatrix();
            let cl, style;
            if (process_css) {
                cl = this.attr("class");
                style = this.getStyle();
            }

            if (trans.isIdentity()) trans = undefined;
            for (let i = 0, l = children.length; i < l; ++i) {
                const child = children[i];
                if (trans) child.addTransform(trans);
                if (process_css) {
                    if (cl) child.addClass(cl);
                    if (style) {
                        const ch_style = child.getStyle();
                        const new_style = Object.assign(
                            Object.assign({}, style), ch_style);
                        child.setStyle(new_style)
                    }
                }
                after_el.after(child);
                after_el = child;
            }
            this.remove();
        }

        Element.prototype.anchorEmbed = function (href, target) {
            let a = this.paper.a(href, target);
            this.after(a);
            a.add(this);
        };

        /**
         *
         * Records changes to the element.
         *
         */
        /**
         * Records a change to the element, using a bit code. Used to updating the state of the server
         *
         * @param exclude_attribute  (only relevant if to_leafs is true) excludes element that have a give
         * system attribute set to true. For example, to exclude protected element
         * @param to_leafs weather to apply the changes only to the leafs (non-group elements) of a group.
         *
         * The arguments (after above system arguments) are passed as string tokens: "transform", "points", "style", "new", "reorder", "attribute", "effect", "clip"
         */
        Element.prototype.recordChange = function (exclude_attribute, to_leafs, f) {

            // if (this.isLocal()) return;

            if (typeof to_leafs === 'boolean' && to_leafs && this.type === 'g' &&
                !(exclude_attribute && this.attr(exclude_attribute))) {
                const args = arguments;
                this.getChildren(true).forEach(function (el) {
                    el.recordChange.apply(el, args);
                });
            }

            const arg_start = (typeof to_leafs === 'boolean') ? 2 :
                (typeof exclude_attribute === 'boolean') ? 1 : 0;
            let changes = +this.attr('changes') || 0;
            for (let i = arg_start, l = arguments.length; i < l; ++i) {
                if (typeof arguments[i] === 'function') {
                    f = arguments[i];
                }
                switch (arguments[i]) {
                    case 'transform':
                        changes |= 1;
                        break;
                    case 'points':
                        changes |= 2;
                        break;
                    case 'style':
                        changes |= 4;
                        break;
                    case 'new':
                        changes |= 8;
                        break;
                    case 'reorder':
                        changes |= 16;
                        break;
                    case 'attribute':
                        changes |= 32;
                        break;
                    case 'effect':
                        changes |= 64;
                        break;
                    case 'delete':
                        changes |= 128;
                        break;
                    case 'clip':
                        changes |= 256;
                }
            }

            this.data('changes', changes || '');
            // _eve(['gui', 'change'], undefined, this);
            if (f && typeof f === 'function') f(this);
        };

        /**
         * Returns changes to the element
         * @return {Array} of the following, in this order:
         * "delete", "new", "points", "transform", "reorder", "style", "attribute", "effect", "clip"
         */
        Element.prototype.readChanges = function () {
            let changes = [], cur_changes;
            if (cur_changes = +this.data('changes')) {
                if (cur_changes & 128) changes.push('delete');
                if (cur_changes & 8) changes.push('new');
                if (cur_changes & 2) changes.push('points');
                if (cur_changes & 1) changes.push('transform');
                if (cur_changes & 16) changes.push('reorder');
                if (cur_changes & 4) changes.push('style');
                if (cur_changes & 32) changes.push('attribute');
                if (cur_changes & 64) changes.push('effect');
                if (cur_changes & 256) changes.push('clip');

            }
            return changes;
        };

        Element.prototype.localOnly = function (reverse) {
            this.attr({local: (reverse) ? '' : 1});
            return this;
        };

        Element.prototype.isLocal = function (node) {
            if (node) {
                if (node.tagName.toLowerCase() === 'svg') return false;
                return node.hasAttribute('local') ||
                    (node.parentElement && this.isLocal(node.parentElement));
            }

            return this.node.hasAttribute('local') ||
                this.isLocal(this.node.parentElement);
        };

        Element.prototype.pathFirstPoint = function (x, y) { //Avoid setting the first point of a poly object
            const type = this.type;

            if (type !== 'path' && type !== 'polycurve' && type !==
                'polyline') return this;
            let points, regex, isPath, m, path;
            regex = /(M?\s*(-?\d*\.?\d+)[,|\s]+(-?\d*\.?\d+))(.+)/;
            isPath = (type == 'path');
            points = (isPath) ? this.attr('path') : this.attr('points');
            if ((m = regex.exec(points)) !== null) {
                if (x == undefined && y == undefined) { // A getter method.
                    return {
                        x: Number(m[2]),
                        y: Number(m[3]),
                    };
                } else { //set the first point
                    if (typeof x == 'object') {
                        y = x.y || x[1] || undefined;
                        x = x.x || x[0] || undefined;
                    }

                    if (isPath) {
                        path = 'M ' + x + ' ' + y + ' ' + m[4];
                        this.attr('path', path);
                    } else {
                        path = x + ', ' + y + ' ' + m[4];
                        this.attr('points', path);
                    }
                }
            }
            return this;
        };

        Element.prototype.makePath = function () {
            if (this.isGroupLike() || this.type === 'path') return this;

            let path_str = Snap.path.toPath(this, true);

            const geom = this.getGeometryAttr(true);
            let attr_obj = {};
            geom.forEach((attr) => attr_obj[attr] = '');
            this.attr(attr_obj);
            this.attr({path: path_str});

            this.node.outerHTML = this.node.outerHTML.replace(this.type,
                'path data-temp="temp"');

            let node = document.querySelector('[data-temp="temp"]');

            this.node = node;
            this.attr('data-temp', '');

            this.type = 'path';

            return this;
        };

        Element.prototype.createClipPath = function (path, id) {
            const clipPath = this.clipPath();
            if (id) {
                clipPath.attr({id: id});
            } else {
                id = clipPath.getId();
            }
            this.before(clipPath);
            clipPath.add(path);
            this.attr('clip-path', 'url(#' + id + ')');
            return clipPath;
        };

        Element.prototype.createMask = function (path, id) {
            const mask = this.mask();
            if (id) {
                mask.attr({id: id});
            } else {
                id = mask.getId();
            }
            this.before(mask);
            mask.add(path);
            this.attr('mask', 'url(#' + id + ')');
            return mask;
        };

        Element.prototype.linkedElementLocalise = function () {
            if (this.type !== "clipPath" && this.type !== "mask") return;
            let old_id = this.getId();
            let new_id = old_id + "_" + this.paper.id;
            let attr = (this.type === "mask") ? "mask" : "clip-path";
            let url = 'url("#' + old_id + '")';
            let selector = `[${attr}*=\'${url}\'], [style*=\'${url}\']`;
            let linked = this.paper.selectAll(selector);

            linked.forEach((el) => {
                let attr_obj = {};
                attr_obj[attr] = 'url("#' + new_id + '")';
                linked.attr(attr_obj);
            })
            this.attr('id', new_id);
        }


        Element.prototype.toPolyBezier = function () {
            return Snap.polyBezier(this.toBeziers());
        };

        Element.prototype.correctScale = function (center_x, center_y, gui) {
            // return this;
            let scale = 1;
            if (center_x === undefined) center_x = 0;
            if (center_y === undefined) center_y = 0;
            if (gui && gui.layers.getCurrentNavLayer() &&
                (scale = 1 / Number(gui.layers.getZoom())) && !isNaN(scale) &&
                !(scale === 1)) {
                this.scale(scale, scale, center_x, center_y, 'id');
            }
            return this;
        };

        Element.prototype.getFirstPoint = function (use_local_transform) {
            const type = this.type;
            let point;
            if (type === 'path' || type === 'polycurve' || type === 'polyline') {
                point = _.svgPoint(this.pathFirstPoint(), this);
            } else if (this.node.attributes.hasOwnProperty('x') &&
                this.node.attributes.hasOwnProperty('y')) {
                point = _.svgPoint(Number(this.attr('x')), Number(this.attr('y')),
                    this);
            } else if (type === 'g') {
                const children = this.getChildren;
                const first = children()[0];
                let second;
                if (first.node.covpoly && children.length > 1 &&
                    (second = children[1]).type === 'polygon') {
                    point = second.getFirstPoint();
                } else {
                    point = (first).getFirstPoint();
                }

            } else {
                const bBox = this.getBBox();
                point = _.svgPoint(bBox);
            }

            if (use_local_transform) {
                point = this.getLocalMatrix(STRICT_MODE).apply(point);
            }

            return point;
        };

        Element.prototype.setFirstPoint = function (x, y) {
            if (typeof x == 'object') {
                y = x.y || x[1] || undefined;
                x = x.x || x[0] || undefined;
            }

            if (this.type == 'path') { //If the path is not defined in relative coordinates the operation will modify the geometry
                this.pathFirstPoint(x, y);
            }

            if (this.node.attributes.hasOwnProperty('x') &&
                this.node.attributes.hasOwnProperty('y')) {
                this.attr({x: x, y: y});
            }

            if (this.node.attributes.hasOwnProperty('cx') &&
                this.node.attributes.hasOwnProperty('cy')) {
                this.attr({cx: x, cy: y});
            }

            return this;
        };

        Element.prototype.getLastPoint = function (use_local_transform) {
            let points = this.getControlPoints();
            let point = points[points.length - 1];
            if (use_local_transform) {
                point = this.getLocalMatrix(STRICT_MODE).apply(point);
            }
            point = _.svgPoint(point.x || point[0], point.y || point[1]);

            return point;
        };

        /**
         * Returns a map of the values of the list of attribute names
         * @param  attributes [array] the list of attribute names
         * @param  inverse [boolean] if true, it returns all attributes except the ones in the attribute list
         */
        Element.prototype.attrs = function (attributes, inverse) {
            const result = {};
            const handler = (attr) => {
                const value = this.attr(attr);
                if (value !== undefined) result[attr] = value;
            };
            if (!inverse) {
                if (attributes.forEach) {
                    attributes.forEach(handler);
                } else {
                    Object.keys(attributes).forEach(handler);
                }
            }
            if (inverse) {
                Array.from(this.node.attributes).forEach(function (attr) {
                    attr = attr.nodeName;
                    if ((attributes.indexOf && attributes.indexOf(attr) === -1) || !attributes.hasOwnProperty(attr)) {
                        handler(attr);
                    }
                });
            }

            return result;
        };

        Element.prototype.getGeometryAttr = function (names_only) {
            const el = this;

            let attributes;
            switch (this.type) {
                case 'rect':
                    attributes = ['x', 'y', 'width', 'height', 'rx', 'ry'];
                    return names_only ? attributes : this.attrs(attributes);
                case 'ellipse':
                    attributes = ['cx', 'cy', 'rx', 'ry'];
                    return names_only ? attributes : this.attrs(attributes);
                case 'circle':
                    attributes = ['cx', 'cy', 'r'];
                    return names_only ? attributes : this.attrs(attributes);
                case 'line':
                    attributes = ['x1', 'y1', 'x2', 'y2'];
                    return names_only ? attributes : this.attrs(attributes);
                case 'path':
                    attributes = ['d'];
                    return names_only ? attributes : this.attrs(attributes);
                case 'polygon':
                case 'polyline':
                    attributes = ['points'];
                    return names_only ? attributes : this.attrs(attributes);
                case 'image':
                case 'use':
                    attributes = ['x', 'y', 'width', 'height'];
                    return names_only ? attributes : this.attrs(attributes);
                case 'text':
                case 'tspan':
                    attributes = ['x', 'y', 'dx', 'dy'];
                    return names_only ? attributes : this.attrs(attributes);
            }
            return [];
        };

        Element.prototype.getAttributes = function () {
            const ret = {};
            const attrMap = this.node.attributes;
            for (let i = 0, l = attrMap.length, name; i < l; ++i) {
                name = attrMap[i].name;
                ret[name] = (name !== 'style') ?
                    attrMap[i].nodeValue :
                    Snap.convertStyleFormat(attrMap[i].nodeValue);
            }

            return ret;
        };

        Element.prototype.transparentToMouse = function (remove = false, type) {
            if (remove) {
                this.attr('pointer-events', type || '');
            } else {
                this.attr('pointer-events', 'none');
            }
            return this;
        };

        Element.prototype.isOverlapRect = function (rect) {
            return Snap.path.isPathOverlapRect(this, rect);
        };

        Element.prototype.isOverlap = function (el) {
            let points;
            if (Array.isArray(el)) {
                points = el;
            } else if (typeof el === "object" && el.getCHull) {
                points = el.getCHull(true);
            } else {
                return false;
            }
            let cHull = this.getCHull(true);
            if (cHull && points) {
                return Snap.polygons.con_overlap(cHull, points);
            }
            return false;
        }


        //Actions
        Element.prototype.move = function (
            select, el, mcontext, scontext, econtext) {
            if (el == undefined) {
                el = this;
            }
            let coordTarget;
            if (mcontext) {
                if (mcontext.limits) {
                    if (!scontext) scontext = {};
                    scontext.limits = mcontext.limits;
                }
                if (mcontext.coordTarget) {
                    coordTarget = mcontext.coordTarget;
                }
                if (mcontext.use_cache) {
                    econtext = econtext || {};
                    econtext.use_cache = true;
                }
            } else if (select) {
                coordTarget = select.gui.layers.getCurrentNavLayer();
            } else {
                coordTarget = el.paper;
            }

            const mv = _.move.bind(mcontext || {});
            const smv = _.startMove.bind(scontext || {});
            const emv = _.endMove.bind(econtext || {});

            return this.drag(function (dx, dy, x, y, ev) {
                    ev.stopPropagation();
                    mv(dx, dy, x, y, el, coordTarget);
                }, function (x, y, ev) {
                    ev.stopPropagation();
                    smv(x, y, ev, el, select, coordTarget);
                }, function (ev) {
                    ev.stopPropagation();
                    emv(ev, el, select);
                }, mcontext, scontext, econtext,
            );
        };

        Element.prototype.revolve = function (
            center, coordTarget, mcontext, scontext, econtext) {

            if (center === undefined) {
                let bbox = el.getBBox();
                center = {x: bbox.cx, y: bbox.cy};
            }
            let limits,
                initial_angle = 0;
            if (mcontext) {
                if (mcontext.limits) {
                    limits = mcontext.limits;
                }
                if (mcontext.coordTarget) {
                    coordTarget = mcontext.coordTarget;
                }
                if (mcontext.initial) {
                    if (!scontext) scontext = {};
                    scontext.initial = mcontext.initial;
                }
            }
            coordTarget = coordTarget || el.paper;

            const el = this;

            const rev = _.revolve.bind(mcontext || {});
            const srev = _.startRevolve.bind(scontext || {});
            const erev = _.endRevolve.bind(econtext || {});

            return this.drag(function (dx, dy, x, y, ev) {
                    ev.stopPropagation();
                    rev(dx, dy, x, y, el, center, coordTarget);
                }, function (x, y, ev) {
                    ev.stopPropagation();
                    srev(x, y, ev, el, center, coordTarget, coordTarget);
                }, function (ev) {
                    ev.stopPropagation();
                    erev(ev, el, center, coordTarget);
                }, mcontext, scontext, econtext,
            );
        };

        Element.prototype.regionSelect = function (gui, rect_style, end_event, move_event, target_group, send_click) {
            // if (this.paper !== this) return;

            let container = target_group;
            let that = this;
            if (!container) {
                if (gui && gui.handlerGroup) {
                    container = gui.handlerGroup;
                } else {
                    container = this.paper;
                }
            }

            let select, start_point, start_t, append;

            function make_rect(el, cursorPoint, rectStyle) {
                const dash_size = (gui && gui.layers.getZoom()) ?
                    5 / gui.layers.getZoom() :
                    5;
                const stroke_width = (gui && gui.layers.getZoom()) ?
                    .5 / gui.layers.getZoom() :
                    .5;
                rectStyle = Object.assign({
                    fill: 'none',
                    stroke: 'red',
                    strokeWidth: stroke_width,
                    strokeDasharray: dash_size + ', ' + dash_size,
                }, rectStyle || {});
                return el.rect(cursorPoint.x, cursorPoint.y, 0, 0, {id: "select_rect"}).setStyle(rectStyle);
            }

            const startRegionSelect = function (x, y, ev, el, gui) {
                if (el.data('active')) return;
                eve(['drag', 'regionSelect', 'start']);
                // console.log("StartRotDrag in");
                el.data('active', true);
                start_t = Date.now();

                start_point = el.getCursorPoint(x, y,
                    // gui.layers.getCurrentNavLayer()
                );

                // console.log("Init Select", container);
                // console.log("dash: " + dash_size);

                append = ev.shiftKey || ev.ctrlKey;

            };

            const regionSelMove = function (dx, dy, x, y, el, gui) {
                const cursorPoint = el.getCursorPoint(x, y,
                    // gui.layers.getCurrentNavLayer()
                );
                // var pt = el.paper.node.createSVGPoint();

                dx = Math.abs(cursorPoint.x - start_point.x);
                dy = Math.abs(cursorPoint.y - start_point.y);

                if (Date.now() - start_t > 200 && dx > 5 && dy > 5) {
                    if (!select) {
                        select = make_rect(el, start_point, rect_style);
                    }
                }
                // console.log(x, y, cursorPoint.x, cursorPoint.y);
                if (select) {

                    const select_def = {
                        x: Math.min(start_point.x, cursorPoint.x),
                        y: Math.min(start_point.y, cursorPoint.y),
                        width: dx,
                        height: dy,
                    };
                    select.attr(select_def);

                    if (move_event) {
                        gui.eve(move_event, this, select_def)
                    }
                }
            };

            let endRegionSelect = function (ev, el) {
                console.log(select);
                if (select) {
                    const appendElements = append || ev.shiftKey || ev.ctrlKey;

                    gui.eve(end_event || ['drag', 'regionSelect', 'end'], el, select,
                        appendElements);
                    select.remove();
                    select = undefined;
                } else {
                    // if (send_click) {
                    //     const event = new Event('click');
                    //     that.node.dispatchEvent(event)
                    // }
                }
                el.data('active', false);
                gui.eve(['drag', 'regionSelect', 'done'], el);
            };

            return this.drag(
                function (dx, dy, x, y) {
                    regionSelMove(dx, dy, x, y, container, gui);
                },
                function (x, y, ev) {
                    startRegionSelect(x, y, ev, container, gui);
                },
                function (ev) {
                    endRegionSelect(ev, container);
                },
            );
        };


        Element.prototype.makeDraggable = function (drop_target, animate, end_event, move_event, data, local_eve, alt_element) {

            local_eve = local_eve || eve;

            let el = alt_element || this;
            let original_trans;
            let start_point;
            let original_opacity;

            const params = {
                localPoint: undefined,
                globalPoint: undefined,
                clone: undefined,
                data: data,
                target: drop_target
            }

            //Start
            const smv = (x, y) => {
                original_opacity = this.attr("opacity") || 1;
                params.clone = el.clone();
                params.clone.attr({opacity: original_opacity * .5})
                el.attr({opacity: original_opacity / 3});
                params.clone.repositionInGroup(params.clone.getTopSVG());
                original_trans = params.clone.getLocalMatrix(STRICT_MODE);
                start_point = params.clone.getCursorPoint(x, y, params.clone.paper)
                // console.log("start", x, y, original_trans, start_point)
                local_eve(['drag', 'make_draggable', 'start', this.id], this, drop_target);
            };

            //move
            const mv = (dx, dy, ax, ay) => {

                if (dx == null || dy == null) return;

                params.clone.translate_glob(dx, dy, original_trans);

                // console.log("run", dx, dy, ax, ay)
                params.localPoint = {x: dx, y: dy};
                params.globalPoint = {x: ax, y: ay};


                if (move_event) {
                    local_eve(move_event, this, params)
                } else {
                    local_eve(['drag', 'make_draggable', 'ongoing', this.id], this, params);
                }

            };

            //End
            const emv = () => {
                const recover = () => {
                    el.attr({opacity: original_opacity});
                    params.clone && params.clone.remove();
                }
                if (!params.localPoint) return recover();

                if (end_event) {
                    local_eve(end_event, this, params);
                } else {
                    local_eve(['drag', 'make_draggable', 'end', this.id], this, params);
                }
                // console.log("end", localPt.x, localPt.y)
                if (animate) {
                    params.clone.animateTransform(original_trans, animate, mina.easeinout, recover)
                } else {
                    params.clone.transform(original_trans);
                    recover();
                }
            };

            return this.drag((dx, dy, x, y, ev) => {
                    ev.stopPropagation();
                    mv(dx, dy, x, y, this,);
                }, function (x, y, ev) {
                    // console.log(ev.target);
                    ev.stopPropagation();
                    smv(x, y, ev);
                }, function (ev) {
                    ev.stopPropagation();
                    // console.log(ev);
                    emv();
                },
            );
        }

        //Helper Functions

        _.move = function (xxdx, xxdy, ax, ay, el, coordTarget) {
            // var tdx, tdy;
            if (coordTarget === undefined) {
                coordTarget = el.paper;
            }
            const cursorPoint = el.getCursorPoint(ax, ay, coordTarget);
            const pt = el.paper.node.createSVGPoint();

            pt.x = cursorPoint.x - el.data('op').x;
            pt.y = cursorPoint.y - el.data('op').y;

            const localPt = el.globalToLocal(pt, coordTarget),
                lim = el.data('relative_limit');

            if (lim) {
                if (lim.dim) {
                    if (lim.dim == 'x') {
                        localPt.y = 0;
                    } else if (lim.dim == 'y') {
                        localPt.x = 0;
                    }
                }

                let dist, dist_lim_min, dist_lim_max;

                if (lim.max_y != undefined) {
                    dist_lim_max = (typeof lim.max_y === "function") ?
                        lim.max_y() :
                        lim.max_y;
                    localPt.y = Math.min(localPt.y, dist_lim_max);
                }

                if (lim.min_y != undefined) {
                    dist_lim_min = (typeof lim.min_y === "function") ?
                        lim.min_y() :
                        lim.min_y;
                    localPt.y = Math.max(localPt.y, dist_lim_min);
                }

                if (lim.min_x != undefined) {
                    dist_lim_min = (typeof lim.min_x === "function") ?
                        lim.min_x() :
                        lim.min_x;
                    localPt.x = Math.max(localPt.x, dist_lim_min);
                }

                if (lim.max_x != undefined) {
                    dist_lim_max = (typeof lim.max_x === "function") ?
                        lim.max_x() :
                        lim.max_x;
                    localPt.x = Math.min(localPt.x, dist_lim_max);
                }

                // console.log("Local point: ", localPt.x, localPt.y, pt, dist_lim_min, dist_lim_max, coordTarget);
            }

            // el.transform(el.data('ot').toTransformString() + "t" + [localPt.x, localPt.y]);
            if (el.data('change_xy_attributes')) {
                const ox = el.data('ox');
                el.attr({
                    x: localPt.x + ox,
                    y: localPt.y + el.data('oy'),
                });
            } else {
                el.translate_glob(localPt.x, localPt.y, el.data('ot'));
                // el.rotate(.2*(Date.now() - el.data("t")), localPt.x + el.data('op').x, localPt.y + el.data('op').y)
            }

            eve(['drag', 'move', 'ongoing', el.id], el);
        };

        _.startMove = function (x, y, ev, el, select, coordTarget) {
            if (el.data('active')) return;
            // console.log("StartRotDrag in");
            el.data('active', true);
            el.data('s', true);
            el.data('t', Date.now());

            // el.data('ibb', el.getBBox());
            el.data('op', el.getCursorPoint(x, y, coordTarget));
            const localMatrix = el.getLocalMatrix(STRICT_MODE);
            el.data('ot', localMatrix);
            if (select) {
                eve(['drag', 'move', 'select', 'start'], el, [localMatrix]);
            } else {
                eve(['drag', 'move', 'start', el.id], el);
            }

            const limits = this.limits;
            if (limits) {
                let bbox;

                if (select) {
                    bbox = select.getBBox();
                } else {
                    bbox = el.getBBox();
                }

                const relative_limit = {};

                if (limits.min_x !== undefined) {
                    let x_offset = (limits.center) ? bbox.cx : bbox.x;
                    relative_limit.min_x = (typeof limits.min_x === 'function') ?
                        limits.min_x() - x_offset : limits.min_x - x_offset;
                }

                if (limits.max_x !== undefined) {
                    let x2_offset = (limits.center) ? bbox.cx : bbox.x2;
                    relative_limit.max_x = (typeof limits.max_x === 'function') ?
                        limits.max_x() - x2_offset : limits.max_x - x2_offset;
                }

                if (limits.min_y !== undefined) {
                    let y_offset = (limits.center) ? bbox.cy : bbox.y;
                    relative_limit.min_y = (typeof limits.min_y === 'function') ?
                        limits.min_y() - y_offset : limits.min_y - y_offset;
                }

                if (limits.max_y !== undefined) {
                    let y2_offset = (limits.center) ? bbox.cy : bbox.y2;
                    relative_limit.max_y = (typeof limits.max_y === 'function') ?
                        limits.max_y() - y2_offset : limits.max_y - y2_offset;
                }

                // console.log("Rel Limits: ", relative_limit.min_x, relative_limit.max_x);

                relative_limit.dim = limits.dim;
                relative_limit.snap_y = relative_limit.snap_y = function (val) {
                    return val;
                };
                if (limits.snap) {
                    if (Array.isArray(limits.snap)) {
                        relative_limit.snap_y = relative_limit.snap_y = function (val) {
                            return Snap.snapTo(limits.snap, val);
                        };
                    } else if (typeof limits.snap === 'object') {
                        if (Array.isArray(limits.snap.x)) {
                            relative_limit.snap_x = function (val) {
                                return Snap.snapTo(limits.snap.x, val);
                            };
                        }
                        if (Array.isArray(limits.snap.y)) {
                            relative_limit.snap_y = function (val) {
                                return Snap.snapTo(limits.snap.y, val);
                            };
                        }
                    }
                }

                el.data('relative_limit', relative_limit);
            }

            if (el.data('change_xy_attributes')) {
                el.data('ox', Number(el.attr('x')));
                el.data('oy', Number(el.attr('y')));
            }
            el.data('s', false);
        };

        _.endMove = function (ev, el, select) {
            if (el.data('active')) {
                while (el.data('s') || (Date.now() - el.data('t') < 200)) {
                }
                if (this.use_cache) el.updateBBoxCache(undefined, true);
                if (select) {
                    const cur_matrix = el.getLocalMatrix(STRICT_MODE);
                    const old_matrix = el.data('ot');
                    // el.updateBBoxCache(old_matrix.invert().multLeft(cur_matrix), true);
                    eve(['drag', 'move', 'select', 'end'], el,
                        [cur_matrix, old_matrix]);
                } else {
                    eve(['drag', 'move', 'end', el.id], el);
                }
                el.data('active', false);
            }
        };

        _.revolve = function (dx, dy, ax, ay, el, center, coordTarget) {

            const limits = this.limits;
            const newPoint = el.getCursorPoint(ax, ay, coordTarget);
            const tcr = el.data('tcr');
            let d_angle = (Snap.angle(tcr.x, tcr.y, newPoint.x, newPoint.y) -
                90) - el.data('pointer_angle');
            const abs_angle = el.data('angle');
            let abs_angle_new = (abs_angle + d_angle === 360) ?
                360 :
                (abs_angle + d_angle + 360) % 360;
            let adjusted_new = abs_angle_new;
            if (limits) {
                let dist, angle_lim_min, angle_lim_max;
                angle_lim_min = (limits.min instanceof Function) ?
                    limits.min() :
                    limits.min;
                angle_lim_max = (limits.max instanceof Function) ?
                    limits.max() :
                    limits.max;

                const barrier = angle_lim_min + 360 === angle_lim_max;
                const rel_angle = (abs_angle_new - angle_lim_min === 360) ?
                    360 :
                    (abs_angle_new - angle_lim_min + 360) % 360;

                if (abs_angle_new > angle_lim_max ||
                    (abs_angle_new < angle_lim_min && abs_angle_new + 360 >
                        angle_lim_max)) {
                    if (abs_angle_new > angle_lim_max) {
                        // console.log("lim: ", abs_angle_new, angle_lim_max);
                        abs_angle_new = (abs_angle_new - angle_lim_max < angle_lim_min -
                            (abs_angle_new - 360)) ? angle_lim_max : angle_lim_min;

                    } else {
                        abs_angle_new = (angle_lim_min - abs_angle_new > abs_angle_new +
                            360 - angle_lim_max) ? angle_lim_max : angle_lim_min;
                        // console.log("lim2: ", abs_angle_new)
                    }
                    adjusted_new = rel_angle;
                } else if (barrier) {
                    const last_rel = (el.data('last_angle')[0] - angle_lim_min ===
                        360) ?
                        360 :
                        (el.data('last_angle')[0] - angle_lim_min + 360) % 360;
                    // let diff = abs_angle_new - last;
                    // if (diff > 180) {
                    //     diff -= 360
                    // } else if (diff < -180) {
                    //     diff += 360
                    // }

                    // const decreasing = diff <= 0;
                    // console.log(rel_angle, last_rel);
                    if (rel_angle > 180 && last_rel < 10) {
                        abs_angle_new = angle_lim_min;
                        adjusted_new = 0;
                    } else if (rel_angle < 180 && last_rel > 350) {
                        abs_angle_new = angle_lim_max;
                        adjusted_new = 360;
                    } else {
                        adjusted_new = rel_angle;
                    }
                }

                d_angle = abs_angle_new - abs_angle;

            }

            el.rotate(d_angle, tcr.x, tcr.y, el.data('tot'));

            el.data('last_angle', [abs_angle_new, adjusted_new]);
            eve(['drag', 'revolve', 'ongoing', el.id], el, abs_angle_new, adjusted_new, newPoint);
        };

        _.startRevolve = function (x, y, ev, el, center, coordTarget) {

            if (el.data('active')) return;
            // console.log("StartRotDrag in");
            el.data('active', true);
            el.data('s', true);
            el.data('t', Date.now());

            el.data('tcr', center);
            const op = el.getCursorPoint(x, y, coordTarget);

            el.data('op', op);
            const localMatrix = el.getLocalMatrix(STRICT_MODE);
            el.data('tot', localMatrix);
            const initial_angle = this.initial || 0;
            const angle_measure = round(
                localMatrix.split().rotate + initial_angle, 2); //Rounding to avoid numerical instability
            el.data('angle', (angle_measure + 360) % 360);
            el.data('last_angle', [(angle_measure + 360) % 360, undefined]);
            // const el_fp = el.getFirstPoint();
            const angle = Snap.angle(center.x, center.y, op.x, op.y) - 90;
            el.data('pointer_angle', angle);

            el.data('s', false);

            eve(['drag', 'revolve', 'start', el.id], el);

        };

        _.endRevolve = function (ev, el, center) {

            if (el.data('active')) {
                while (el.data('s') || (Date.now() - el.data('t') < 200)) {
                }
                el.data('active', false);
                eve(['drag', 'revolve', 'end', el.id], el, el.data('last_angle')[0],
                    el.data('last_angle')[1]);
            }
        };

        _.svgPoint = function (x, y, node) {
            if (arguments.length === 1 && typeof x === 'object' &&
                x.hasOwnProperty('paper')) {
                node = x;
                x = undefined;
            }
            if (x === undefined && y === undefined) {
                x = y = 0;
            }
            if (typeof x == 'object') {
                y = x.y;
                x = x.x;
            }
            let pt = {};
            if (node) {
                pt = node.paper.node.createSVGPoint();
            }

            pt.x = x;
            pt.y = y;
            return pt;
        };

        //copy _ to Snap._
        Object.assign(Snap._, _);


        const STRICT_MODE = true;

        Element.prototype.scale = function (
            x, y, cx, cy, prev_trans, use_cache) {
            if (typeof prev_trans === 'boolean') {
                use_cache = prev_trans;
                prev_trans = undefined;
            }
            if (prev_trans === undefined) {
                prev_trans = this.getLocalMatrix(STRICT_MODE);
            }
            if (prev_trans === 'id' || prev_trans === true) {
                prev_trans = Snap.matrix();
            }
            //TODO processes input.

            const scale_matrix = Snap.matrix().scale(x, y, cx, cy);

            const matrix = prev_trans.clone().multLeft(scale_matrix);
            this.transform(matrix, use_cache, true);
            // if (this.data("center_mass")) this.data("center_mass", matrix.apply(this.data("center_mass")));
            return this;

        };

        Element.prototype.translate = function (
            x, y, prev_trans, cx, cy, use_bbox_cache) {

            if (typeof cx === 'boolean') {
                use_bbox_cache = cx;
                cx = 0;
                cy = 0;
            } else if (isNaN(cx) || isNaN(cy)) {
                cx = 0;
                cy = 0;
            }
            // if (this.data("change_xy_attributes")) {
            //     this.attr({x: Number(this.attr('x')) + (x - cx),
            //     y: Number(this.attr('y')) + (y - cy)});
            //     return this;
            // }

            if (prev_trans === undefined) {
                prev_trans = this.getLocalMatrix(STRICT_MODE);
            }
            if (prev_trans === 'id' || prev_trans === true) {
                prev_trans = Snap.matrix();
            }
            let trans_matrix;
            trans_matrix = Snap.matrix().translate(x - cx, y - cy);

            // const matrix = trans_matrix.multLeft(prev_trans);
            const matrix = prev_trans.clone().multLeft(trans_matrix);

            this.transform(matrix, use_bbox_cache, true); //The last parameter forces change of cache

            // if (this.data("center_mass")) this.data("center_mass", matrix.apply(this.data("center_mass")))
            return this;

        };

        Element.prototype.translateAnimate = function (duration,
                                                       x, y, prev_trans, cx, cy, use_bbox_cache) {

            let easing = mina.easeinout;
            if (Array.isArray(duration)) {
                easing = duration[1];
                duration = duration[0];
            }

            if (typeof cx === 'boolean') {
                use_bbox_cache = cx;
                cx = 0;
                cy = 0;
            } else if (isNaN(cx) || isNaN(cy)) {
                cx = 0;
                cy = 0;
            }

            if (prev_trans === undefined) {
                prev_trans = this.getLocalMatrix(STRICT_MODE);
            }
            if (prev_trans === 'id' || prev_trans === true) {
                prev_trans = Snap.matrix();
            }
            let trans_matrix;
            trans_matrix = Snap.matrix().translate(x - cx, y - cy);

            // const matrix = trans_matrix.multLeft(prev_trans);
            const matrix = prev_trans.clone().multLeft(trans_matrix);

            let cache_function;
            if (use_bbox_cache) cache_function = () => this.transform(matrix, use_bbox_cache, true); //The last parameter forces change of cache

            return this.animateTransform(matrix, duration, easing, cache_function);

            // if (this.data("center_mass")) this.data("center_mass", matrix.apply(this.data("center_mass")))
            return this;

        };

        Element.prototype.translate_glob = function (
            x, y, prev_trans, cx, cy, use_cache) {

            if (typeof cx === 'boolean') {
                use_cache = cx;
                cx = 0;
                cy = 0;
            } else if (isNaN(cx) || isNaN(cy)) {
                cx = 0;
                cy = 0;
            }
            // if (this.data("change_xy_attributes")) {
            //     this.attr({x: Number(this.attr('x')) + (x - cx),
            //     y: Number(this.attr('y')) + (y - cy)});
            //     return this;
            // }

            if (prev_trans === undefined) {
                prev_trans = this.getLocalMatrix(STRICT_MODE);
            }
            if (prev_trans === 'id' || prev_trans === true) {
                prev_trans = Snap.matrix();
            }
            let trans_matrix;
            trans_matrix = Snap.matrix().translate(x - cx, y - cy);

            const matrix = trans_matrix.multLeft(prev_trans);
            // const matrix = prev_trans.clone().multLeft(trans_matrix);

            this.transform(matrix, use_cache, true);
            // if (this.data("center_mass")) this.data("center_mass", matrix.apply(this.data("center_mass")))
            return this;

        };

        Element.prototype.rotate = function (
            ang, cx, cy, prev_trans, use_cache) {
            if (typeof prev_trans === 'boolean') {
                use_cache = prev_trans;
                prev_trans = undefined;
            }
            if (prev_trans === undefined) {
                prev_trans = this.getLocalMatrix(STRICT_MODE);
            }

            if (prev_trans === 'id' || prev_trans === true) {
                prev_trans = Snap.matrix();
            }
            // console.log("Mathrix 2: " + prev_trans.toString());
            const rot_matrix = Snap.matrix().rotate(ang, cx, cy);

            // const matrix = prev_trans.clone().multLeft(rot_matrix);
            const matrix = rot_matrix.add(prev_trans);

            this.transform(matrix, use_cache);
            // if (this.data("center_mass")) this.data("center_mass", matrix.apply(this.data("center_mass")))
            return this;
        };

        Element.prototype.reflect = function (
            direction, cx, cy, prev_trans, use_catch) {
            if (typeof prev_trans === 'boolean') {
                use_catch = prev_trans;
                prev_trans = undefined;
            }

            let bbox;
            if (cx == null) {
                bbox = this.getBBox();
                cx = bbox.cx;
            }
            if (cy == null) {
                bbox = bbox || this.getBBox();
                cy = bbox.cy;
            }

            if (direction === 'x' || direction === 'vertical') {
                return this.scale(1, -1, cx, cy, prev_trans, use_catch);
            }
            if (direction === 'y' || direction === 'horizontal') {
                return this.scale(-1, 1, cx, cy, prev_trans, use_catch);
            }
            if (typeof direction === 'number') { //angle
                return this.rotate(-direction, cx, cy, prev_trans, use_catch).reflect('x', cx, cy, use_catch).rotate(direction, cx, cy, use_catch);
            }
            if (typeof direction === 'object' && direction.type === 'line') {
                const line = direction;
                const x1 = Number(line.attr('x1'));
                const y1 = Number(line.attr('y1'));
                const x2 = Number(line.attr('x2'));
                const y2 = Number(line.attr('y2'));
                return this.reflect(Snap.angle(x1, y1, x2, y2), x1, x2, prev_trans,
                    use_catch);
            }
        };

        Element.prototype.addTransform = function (matrix, prev_trans) {
            if (prev_trans === undefined) {
                prev_trans = this.getLocalMatrix(); // this.getLocalMatrix(STRICT_MODE);
            }

            matrix = prev_trans.clone().multLeft(matrix);
            this.transform(matrix);
            return this;
        };

        if (false) { //todo: finish conversion
            Element.prototype.ellipseTransform = function (m) {
                this.addTransform(m);
                m = this.getLocalMatrix();

                let new_center, m_noTrans, cosrot, sinrot, A, a_m_noTrans,
                    determinant, angle, V, rx, ry, coeff, Q,
                    invm,
                    temp_val;

                // Drop the translation component of the transformation.

                //It remains to figure out what the new angle and radii must be.

                let split = m.split();

                m.translate(-split.dx, -split.dy);

                angle = Snap.rad(split.rotation);

                // Check the degenerate case where the transformation colapses the ellipse to line

                cosrot = Math.cos(this.angle);
                sinrot = Math.sin(this.angle);

                rx = +this.attr('rx');
                ry = +this.attr('ry');

                A = Snap.matrix( //moves the coord-system to match the ellipse dimensions and angle.

                    rx * cosrot,  // The invere of this will map the ellipese (at origine) to the unit circle

                    ry * sinrot,
                    -ry * sinrot,
                    ry * cosrot,
                    0,
                    0,
                );
                a_m_noTrans = A.multLeft(m);

                determinant = a_m_noTrans.determinant();
                //non-invertible transformation. Collapses the ellipse to a line

                if (Math.sqrt(Math.abs(determinant)) < 1e-5) {
                    if (a_m_noTrans.a != 0) {
                        angle = Math.atan2(a_m_noTrans[2], a_m_noTrans[0]);  //angle between x-axis and (a,c)

                    } else {
                        if (a_m_noTrans.get6V(1) != 0) {
                            angle = atan2(a_m_noTrans.get6V(3), a_m_noTrans.get6V(1)); //angle between x-axis and (b,d)

                        } else {
                            angle = M_PI_2;
                        }
                    }
                    V = new Point(Math.cos(angle), Math.sin(angle));
                    a_m_noTrans.transform(V);
                    rx = V.length();
                    angle = atan2(V.y, V.x);

                    this.center = new_center;
                    this.radius_x = rx;
                    this.radius_y = 0;
                    this.setAngle(angle);
                    return this;
                }

                //Now lets do the work for the non-degenerate case.

                //Move the to implicit form: Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0

                // We only care about A, B and C because they are the non-translational coefficients.

                coeff = this.implicitFormCoefficients();

                Q = new AffineTransformation([
                    coeff[0],
                    coeff[1] / 2,
                    coeff[1] / 2,
                    coeff[2],
                    0,
                    0,
                ]);

                //Get the inverse of the transformation. The new ellipse will be such that if its points are taken back (by the inverse)

                //the will fall on the original ellipse, i.e. they will satisfy the original equation.

                invm = m_noTrans.inverse();
                //C++ code        Q = invm * Q;

                Q = AffineTransformation.composeTransformations([Q, invm]);

                //C++ code:          swap(invm[1], invm[2]);

                temp_val = invm.get6V(1);
                invm.set6V(1, invm.get6V(2));
                invm.set6V(2, temp_val);
                Q = AffineTransformation.composeTransformations([invm, Q]);
                //C++ code           Ellipse e(Q[0], 2 * Q[1], Q[3], 0, 0, -1);

                this.setFromEquation(Q.get6V(0), 2 * Q.get6V(1), Q.get6V(3), 0, 0,
                    -1);
                this.setCenter(new_center);

                return this;
            };
        }

        /**
         * Creates an array of all leafs in the dom tree of the element.
         * @param invisible if invisible elements should be included
         * @param {Array|undefined} _arr for the recursive process, but it can be used to pass an array where to store the element
         * @return {*|Array} an array of the element
         */
        Element.prototype.getLeafs = function (invisible, _arr) {
            _arr = _arr || [];
            if (this.type !== 'g') {
                _arr.push(this);
                return _arr;
            }

            this.getChildren(!invisible).forEach((ch) => ch.getLeafs(invisible, _arr));

            return _arr;
        };

        /**
         * Gets the chain of element parents, ending with this, but not including the top SVG element.
         * @param callback is callback provided, taking an element and the order from below as arguments (el,i),
         *  it will return the result of the collback, as in array.map.
         * @param include_top_sag if true, adds the top svg element as well
         * @return {*[]}
         */
        Element.prototype.getParentChain = function (
            callback, skip_current, toCoord, include_top_svg) {
            if (typeof callback !== 'function') {
                include_top_svg = toCoord;
                toCoord = skip_current;
                skip_current = callback;
                callback = undefined;
            }
            let parent = (skip_current && this.type !== 'svg') ?
                this.parent() :
                this;
            let i = 0;
            let ret = [];
            while (parent) {
                if (toCoord && parent.coordRoot) break;

                if (parent.type === 'svg' && !include_top_svg) break;

                if (callback) {
                    ret.push(callback(parent, i));
                } else {
                    ret.push(parent);
                }

                if (parent.type === 'svg') break;

                parent = parent.parent();
                ++i;

            }
            return ret.reverse();
        };

        Element.prototype.getCoordMatrix = function (strict, full) {
            strict = strict || STRICT_MODE;
            let parent_matrixes = this.getParentChain(
                (el) => el.getLocalMatrix(true), !full, true);
            parent_matrixes = parent_matrixes.filter((m) => !m.isIdentity());
            return Snap.matrix().multLeft(parent_matrixes);
        };

        Element.prototype.getRealBBox = function () {
            return this.getBBoxApprox({relative_coord: true});
        };

        Element.prototype.getRealBBoxExact = function () {
            return this.getBBoxExact({relative_coord: true});
        };

        /**
         * Pushes all transforms to the leafes of the group tree
         * @param exclude_attribute
         * @param _transform
         * @param full propagates the transform inside lines, paths, polygons and polylines
         */
        Element.prototype.propagateTransform = function (
            exclude_attribute, _transform, full) {
            if (typeof exclude_attribute === 'boolean') {
                full = exclude_attribute;
                exclude_attribute = undefined;
            }
            if (_transform) this.addTransform(_transform);
            //The transform should not be propagated if a clip or a mask is defined.
            // Otherwise, it will not be applied correctly.
            if (this.attr('clip-path') !== 'none' || this.attr('mask') !==
                'none') {
                let cp = this.attr('clip-path'), mk = this.attr('mask');
                return;
            }
            if (exclude_attribute && this.attr(exclude_attribute)) return;
            const local_transform = this.getLocalMatrix();
            const is_identity = local_transform.isIdentity();
            if (this.isGroupLike()) {
                if (!is_identity) {
                    const units = this.data('units') ||
                        {x: {x: 1, y: 0}, y: {x: 0, y: 1}};
                    const u_x = local_transform.apply(units.x);
                    const u_y = local_transform.apply(units.y);
                    const origin = local_transform.apply(Snap.zero());

                    units.x = {x: u_x.x - origin.x, y: u_x.y - origin.y};
                    units.y = {x: u_y.x - origin.x, y: u_y.y - origin.y};
                    this.data('units', units);
                }
                if (!is_identity || full) {
                    this.getChildren(/*true*/).forEach(function (el) {
                        el.propagateTransform(exclude_attribute, local_transform, full);
                    });
                }
                this.attr('transform', '');
            } else if (full && !is_identity) {
                if (this.type === 'path') {
                    const original = this.attr('d');
                    const d = Snap.path.map(original, local_transform);
                    this.attr({'d': d, 'transform': ''});
                    // console.log("Fixing", original, d, local_transform.toString());
                } else if (this.type === 'polygone' || this.type === 'polyline') {
                    let points = this.attr('points');
                    for (let i = 0, l = points.length(); i < l; ++i) {
                        if (i % 2) {
                            points[i / 2] = [+points[i]];
                        } else {
                            points[(i - 1) / 2].push(+points[i]);
                        }
                    }
                    points.splice(Math.floor(points.length / 2));
                    points = points.map((p) => local_transform.apply(p));
                    this.attr({points: points});
                    this.transform(Snap.matrix());

                } else if (this.type === 'line') {
                    let p1 = local_transform.apply(
                            {x: +this.attr('x1'), y: +this.attr('y1')}),
                        p2 = local_transform.apply(
                            {x: +this.attr('x2'), y: +this.attr('y2')});
                    this.attr(
                        {x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, transform: ''});
                    this.transform(Snap.matrix());
                }
            }
            return this;
        };

        /**
         * Normalizes the transformation of all `foreignObject` elements within the current element.
         *
         * This function adjusts the transformation of `foreignObject` elements to ensure they are correctly
         * positioned and scaled relative to the current element. It does this by computing the appropriate
         * transformation matrices and applying them to each `foreignObject`.
         *
         * Steps:
         * 1. Check if the current element is a group-like element. If not, the function returns immediately.
         * 2. Select all `foreignObject` elements within the current element.
         * 3. Retrieve the transformation information of the current element.
         * 4. Invert the transformation matrix of the current element.
         * 5. Iterate over each `foreignObject` element and performs the following:
         *    - Retrieve the transformation information of the `foreignObject`.
         *    - Compute the transformation matrix from the current element to the `foreignObject`.
         *    - Split the transformation matrix into rotation, shear, and scale components.
         *    - Compute the new local transformation matrix for the `foreignObject`.
         *    - Applie the new transformation matrix to the `foreignObject`.
         *    - Compute and update the new attributes (`x`, `y`, `width`, `height`) of the `foreignObject`.
         *
         * @returns {void}
         */
        Element.prototype.foreignObjectNormalize = function () {
            if (!this.isGroupLike) return;
            let fos = this.selectAll('foreignObject');
            const transform_info = this.transform();
            const trans_above_inv = transform_info.diffMatrix.invert();
            fos.forEach((fo) => {

                const fo_trans_info = fo.transform();
                //matrix from this to above fo
                const above = fo_trans_info.diffMatrix.clone().multLeft(trans_above_inv);
                //matrix from this to fo
                const relative_global = fo_trans_info.totalMatrix.multLeft(trans_above_inv);
                const rot_scale_split = relative_global.rotScaleSplit();

                const loc_matrix_new = rot_scale_split.rot_shear.multLeft(above.invert());

                fo.transform(loc_matrix_new);

                //Compute new attributes
                let x = (+fo.attr("x")) || 0, y = (+fo.attr("y")) || 0;
                let w = +fo.attr("width") || 0, h = +fo.attr("height") || 0;
                const p_new = rot_scale_split.trans_scale.apply([x, y]);
                const w_new = rot_scale_split.scalex * w;
                const h_new = rot_scale_split.scaley * h;
                fo.attr({
                    x: p_new.x,
                    y: p_new.y,
                    width: w_new,
                    height: h_new
                });
                // console.log("FO:", "x:", x, y, "w:", w, h, "x_n:", p_new.x, p_new.y, "w_new:", w_new, "h_new:", h_new, loc_matrix_new.toString());
            })
        }

        /**
         * Fits the element inside the bouding box.
         * @param {Element | Object} external_bBox The bounding box to fit. Must have width, height, cx and cy as properties. Or, it must be an element with getBBox method.
         * @param {boolean | string} preserve_proportions if boolean
         * the object is centered in the smaller dimension. If a string, it is assumed to be an alignment,
         * in which case it can be 'top', 'bottom', 'left', or 'right'.
         * @param {boolean} scale_down if true, only reduces the size of the object to fit in the box.
         * If the object is smaller, it is not scaled up. The object will still be centered in the box.
         */
        Element.prototype.fitInBox = function (
            external_bBox, preserve_proportions, scale_down, matrix_only) {

            let al; //alignment
            if (typeof preserve_proportions === "string") {
                al = preserve_proportions;
                preserve_proportions = true;
            }

            if (al) {
                al = al.charAt(0).toLowerCase();
                if (!['t', 'b', 'l', 'r'].includes(al)) al = undefined;
            }

            if (external_bBox.paper) {
                // var matrix = external_bBox.getLocalMatrix();
                external_bBox = external_bBox.getBBox();
            }

            if (Array.isArray(external_bBox)) {
                external_bBox = {
                    width: external_bBox[0],
                    height: external_bBox[1],
                    cx: external_bBox[2],
                    cy: external_bBox[3]
                }
            }

            if (!external_bBox.hasOwnProperty("cx") || al) {
                external_bBox = Snap.box(external_bBox);
            }

            let m = this.getLocalMatrix();
            if (external_bBox.height && external_bBox.width) {
                let bBox = this.getBBox();

                let x_scale = external_bBox.width / bBox.width;
                let y_scale = external_bBox.height / bBox.height;

                if (preserve_proportions) {
                    x_scale = y_scale = Math.min(x_scale, y_scale);
                }

                if (scale_down) {
                    x_scale = Math.min(x_scale, 1);
                    y_scale = Math.min(y_scale, 1);
                }
                let p_x, p_y;
                switch (al) {
                    case 'l':
                        p_x = 'x';
                        p_y = 'cy';
                        break;
                    case 't':
                        p_x = 'cx';
                        p_y = 'y';
                        break;
                    case 'r':
                        p_x = 'x2';
                        p_y = 'cy';
                        break;
                    case 'b':
                        p_x = 'cx';
                        p_y = 'y2';
                        break;
                    default:
                        p_x = 'cx';
                        p_y = 'cy';
                        break;
                }

                // m.scale(x_scale, y_scale, bBox[p_x], bBox[p_y]);
                m.multLeft(Snap.matrix().translate(-bBox[p_x], -bBox[p_y]))
                    .multLeft(Snap.matrix().scale(x_scale, y_scale))
                    .multLeft(Snap.matrix().translate(bBox[p_x], bBox[p_y]));

                // const cm = m.clone();
                // this.translate( bBox.cx, bBox.cy, undefined, external_bBox.cx, external_bBox.cy);
                let px = (external_bBox[p_x] != null) ? external_bBox[p_x] : bBox[p_x];
                let py = (external_bBox[p_y] != null) ? external_bBox[p_y] : bBox[p_y];
                if (px !== bBox[p_x] || py !== bBox[p_y]) {
                    const dx = px - bBox[p_x];
                    const dy = py - bBox[p_y];
                    // m.translate(dx, dy);
                    let trasn = Snap.matrix().translate(dx, dy);
                    m.multLeft(trasn);
                    // m = trasn.multLeft(m);
                }

                // const _bbox = this.getBBox();
                // console.log(this.getId(), this, _bbox);
            }
            if (matrix_only) return m.clone();
            // this.attr("transform", m);
            this.transform(m);
            return this;
        };

        /**
         * Fills the element inside the bounding box, making it sufficiently large to fill the entire. The element
         * may stick out of the box.
         * @param {Element | Object} external_bBox The bounding box to fit. Must have width, height, cx and cy as properties. Or, it must be an element with getBBox method.
         * @param {boolean} scale_up if true, only increase the size of the object to fit in the box.
         * If the object is bigger, it is not scaled up. The object will still be centered in the box.
         */
        Element.prototype.fillInBox = function (external_bBox, scale_up) {
            if (external_bBox.paper) {
                // var matrix = external_bBox.getLocalMatrix();
                external_bBox = external_bBox.getBBox();
            }

            if (external_bBox.height && external_bBox.width) {
                let bBox = this.getBBox();

                let x_scale = external_bBox.width / bBox.width;
                let y_scale = external_bBox.height / bBox.height;

                x_scale = y_scale = Math.max(x_scale, y_scale);

                if (scale_up) {
                    x_scale = Math.max(x_scale, 1);
                    y_scale = Math.max(y_scale, 1);
                }

                this.scale(x_scale, y_scale, bBox.cx, bBox.cy);
                // this.translate( bBox.cx, bBox.cy, undefined, external_bBox.cx, external_bBox.cy);
                this.translate((external_bBox.cx - bBox.cx),
                    (external_bBox.cy - bBox.cy));
            }
        };

        /**
         * Emulates an image fill of an element (that supports a fill attribute) by creating a group surrogate for the
         * object and overimposing it on a clipped image.
         * This overcomes some limitations is using a pattern as a fill.
         * @param image the image element, or an id of an image. The image can be used for only one fill. If the same
         * image must be used in multiple fills, use a patters instead, or clone.
         * @param fit_element whether to rescale the image to fit the element.
         * @param preserve_proportons whether to preserve proportions when fitting
         * @return {Element} returns the element surrogate group.
         */
        Element.prototype.fillImage = function (
            image, fit_element, preserve_proportons) {
            if (this.type === 'g') return this;

            //process image
            if (typeof image === 'string') {
                let topSVG = this.getTopSVG();
                const temp_im = topSVG.select('#' + image);
                if (!temp_im) return this;

                image = temp_im;
            }

            //create surrogate

            let id = this.getId();
            const group_placement = this.paper.g().attr({
                id: id,
                target_id: '_' + id,
                surrogate: 1,
                transform: this.getLocalMatrix(),
            });
            this.attr({id: '_' + id, transform: '', fill: 'none'});
            this.after(group_placement);

            const clip = this.paper.clipPath().attr({id: id + '_clip'});
            clip.add(this.clone());

            group_placement.add(clip);

            const clip_group = group_placement.g();
            clip_group.add(image);

            clip_group.attr({clipPath: 'url(#' + clip.getId() + ')'});

            if (fit_element) {
                if (preserve_proportons) {
                    image.fillInBox(this.getBBox(true));
                } else {
                    mage.fitInBox(this.getBBox(true));
                }

            }

            group_placement.add(this);
            return group_placement;

        };

        Element.prototype.isClockwise = function (other_points) {
            const points = other_points || this.getControlPoints();
            let sum = 0, nx, ny, px, py;
            for (let i = 0, l = points.length, p, n; i < l; ++i) {
                p = points[i];
                n = points[(i + 1) % l];
                nx = n[0] || n.x || 0;
                ny = n[1] || n.y || 0;
                px = p[0] || p.x || 0;
                py = p[1] || p.y || 0;
                sum += (nx - px) * (ny + py);
            }
            return sum >= 0;
        };

        Element.prototype.distanceTo = function (x, y) {
            if (typeof x === 'object' && x.x !== undefined && x.y !== undefined) {
                y = x.y;
                x = x.x;
            }

            switch (this.type) {
                case 'line':
                    const x1 = this.attr('x1');
                    const y1 = this.attr('y1');
                    const x2 = this.attr('x2');
                    const y2 = this.attr('y2');

                    if ((x1 - x1) === 0 && (y1 - y2) === 0) {
                        return Snap.len(x, y, x1, y1);
                    }

                    let angle = Math.abs(Snap.angle(x, y, x1, y1, x2, y2));
                    angle = (angle < 180) ? angle : (360 - angle);
                    if (angle > 90) {
                        return Snap.len(x, y, x1, y1);
                    }

                    angle = Math.abs(Snap.angle(x, y, x2, y2, x1, y1));
                    angle = (angle < 180) ? angle : (360 - angle);
                    if (angle > 90) {
                        return Snap.len(x, y, x2, y2);
                    }

                    const num = Math.abs(
                        (y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1);
                    const denum = Math.sqrt(
                        Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

                    return num / denum;

                //TODO: other cases
            }

            return null;

        };

        const style_reforamt = function (style, val) {
            switch (style) {
                case 'opacity':
                    val = String(val);
                    if (val.charAt(val.length - 1) === '%') {
                        val = Number(val.substring(0, val.length - 1)) / 100;
                    }
                    break;
            }
            return val;
        };

        Element.prototype.setStyle = function (style, value) {
            if (!style) return this;
            let that = this; //we may need change the object to a surrogate;
            if (typeof style === 'string') {
                const isStyleAttribute = style.indexOf(':') === -1;
                if (isStyleAttribute) {
                    const obj = {};
                    obj[style] = value;
                    style = obj;
                }

                if (!isStyleAttribute) {
                    style = Snap.convertStyleFormat(style);
                }
            }

            if (typeof style === 'object') {
                for (let style_name in style) {
                    if (style.hasOwnProperty(style_name)) {
                        if (style_name === 'imageFill') {
                            if (typeof style[style_name] === 'string') {
                                that = that.fillImage(style[style_name], true, true);
                            } else {
                                const im_id = style[style_name]['id'];
                                const fit = style[style_name]['fit'];
                                const aspect = style[style_name]['preserveAspectRatio'];
                                that = that.fillImage(im_id, fit, aspect);
                            }
                            continue;
                        }
                        // if (style[style_name] === "" || style[style_name] === undefined) {
                        //     delete that.node.style[style];
                        // } else
                        {
                            if (style_name === 'class') {
                                const class_name = style[style_name];
                                if (/-?[_a-zA-Z]+[_a-zA-Z0-9-]*/gm.test(class_name)) {
                                    //is string is passed that does not generate a style, we assume that this is a class name instead
                                    this.addClass(class_name);
                                }
                            } else {
                                const stl = style_reforamt(style_name, style[style_name]) ||
                                    '';
                                that.node.style[style_name] = stl;

                            }
                        }

                    }
                }
                if (that.hasPartner()) that.setPartnerStyle(style);
            }

            return that;
        };

        Element.prototype.getStyle = function (properties) {
            /*Explicit list of properties we get from computed style*/
            if (properties) {
                if (typeof properties === 'object' && !Array.isArray(properties)) {
                    properties = Object.keys(properties);
                }
                let ret = {};
                const node = this.node;
                const comp_style = root.getComputedStyle(node);
                for (let i = 0, style, val; i < properties.length; ++i) {
                    style = properties[i];
                    val = comp_style[style];
                    if (val !== undefined) {
                        ret[style] = val;
                    }
                }
                return ret;
            }

            let style = this.attr('style');
            let ret = {};

            if (style) {
                style = style.split(';');
                style.forEach((st) => {
                    if (st) {
                        let pair = st.split(':', 2);
                        ret[[pair[0].trim()]] = (pair[1]) ? pair[1].trim() : '';
                    }
                });
            }

            return ret;
        };

        const styles = {
            'alignment-baseline': true,
            'baseline-shift': true,
            'clip-path': true,
            'clip-rule': true,
            'color': true,
            'color-interpolation': true,
            'color-interpolation-filters': true,
            'color-rendering': true,
            'cursor': true,
            'direction': true,
            'display': true,
            'dominant-baseline': true,
            'fill': true,
            'fill-opacity': true,
            'fill-rule': true,
            'filter': true,
            'flood-color': true,
            'flood-opacity': true,
            'font-family': true,
            'font-size': true,
            'font-size-adjust': true,
            'font-stretch': true,
            'font-style': true,
            'font-variant': true,
            'font-weight': true,
            'glyph-orientation-horizontal': true,
            'glyph-orientation-vertical': true,
            'image-rendering': true,
            'letter-spacing': true,
            'lighting-color': true,
            'marker-end': true,
            'marker-mid': true,
            'marker-start': true,
            'mask': true,
            'opacity': true,
            'overflow': true,
            'paint-order': true,
            'pointer-events': true,
            'shape-rendering': true,
            'stop-color': true,
            'stop-opacity': true,
            'stroke': true,
            'stroke-dasharray': true,
            'stroke-dashoffset': true,
            'stroke-linecap': true,
            'stroke-linejoin': true,
            'stroke-miterlimit': true,
            'stroke-opacity': true,
            'stroke-width': true,
            'text-anchor': true,
            'text-decoration': true,
            'text-rendering': true,
            'unicode-bidi': true,
            'vector-effect': true,
            'visibility': true,
            'word-spacing': true,
            'writing-mode': true,
        };
        Element.prototype.moveAttrToStyle = function (recursive, f) {
            if (typeof recursive === 'function') {
                f = recursive;
                recursive = false;
            }
            const attrs = this.getAttributes();
            let found = false;
            for (let attr in attrs) if (attrs.hasOwnProperty(attr)) {
                if (styles[attr]) {
                    found = true;
                    if (!attrs.style) {
                        attrs.style = {};
                    }
                    attrs.style[attr] = attrs[attr];

                    attrs[attr] = '';
                }
            }
            if (found) {
                const style = attrs.style;
                delete attrs.style;
                this.attr(attrs);
                this.setStyle(style);
                // const st = this.attr('style');
                this.recordChange('style', 'attributes', f);
            }

            if (recursive && this.isGroupLike()) {
                this.getChildren().forEach((ch) => ch.moveAttrToStyle(recursive));
            }

            return this;
        };

        /**
         * May not change the attribute string. Should be used only for display
         * @param source
         */
        Element.prototype.copyComStyle = function (source) {
            const styles = root.getComputedStyle(source.node);
            if (styles.cssText !== '') {
                this.node.style.cssText = styles.cssText;
            } else {
                const cssText = Array.from(styles).reduce(
                    (css, propertyName) =>
                        `${css}${propertyName}:${styles.getPropertyValue(
                            propertyName,
                        )};`,
                );

                this.node.style.cssText = cssText;
            }
            return this;
        };

        /**
         * Adds a click event to the element
         *
         * @param {string} type one of:
         *      'click': processed when element is clicked,
         *      'press': processed when element is given mousedown or touchdown event,
         *      'hold': similar to press but assumes a function with an interval, whose return value is the timeout
         *  which will be canceled at the end of the hold.
         *      'longpress': processed aftre a long press
         *
         * @param {function | Object |string} action_description a function to be called or an object of the following format
         *
         * * Object may have the following structure:
         * {
         *  eve:  an string for an eve event.
         *  function: an array of strings linking to a function accessible from the gui object
         *     e.g.['layers", "addLayer'] will call gui.layers.addLayer()
         *     one cannot access "privet" objects which start with '_' - all leading "_" are removed. This may lead
         *     to unexpected results if another method without leading "_" exists.
         *     Some methods may have a .protected property set. Such methods also cannot be called.
         *  operation: a string defining a function defined in the fuctionManager/buttonManager of gui,
         *      or an eve event string.
         *
         *  this: an array of strings linking to an object accessible from the gui object, as above. The link must be an
         *     object. Otherwise, undefined is used. To use gui itself, set to "gui"
         *  context:  see this:
         *
         * params: an array of parameters to pass to the function. The special key word "target" is preserved to pass
         *     the target of the Element (snap format) that contained the event.
         *     If a parameter param is an object with a key "object", i.e. param['object'], the value must be an array
         *     linking to an object, as in this.
         *
         * timer: if the event will be called with a timeout. Processing must return a timer to allow cancellation.
         *
         * interval: if the event will be called periodically with an interval. Processing must return a timer to allow cancellation.
         *
         * timer takes priority
         * }
         *
         * If both "eve" and "function" are set, eve takes priority.
         * @param {Object} other_params allows passing other keys and values to the description. Useful mainly when adding
         * and internal function. Otherwise, the params can be passed direlcy in the description.
         */
        Element.prototype.addInteractionEvent = function (
            type, action_description, other_params, replace, gui) {

            if (other_params && other_params.eve) {
                gui = other_params;
                other_params = undefined;
            }
            if (typeof replace === "object" && replace.eve) {
                gui = replace;
                replace = undefined;
            }

            if (Array.isArray(action_description)) {
                for (let i = 0; i < action_description.length; ++i) {
                    this.addInteractionEvent(type, action_description[i]);
                }
                return;
            }

            let index = undefined;
            if (typeof action_description === 'function') {
                const other_stored_functions = this.data('stored-function') || [];
                other_stored_functions.push(action_description);
                this.data('stored-function', other_stored_functions);
                action_description = {
                    'stored-function': other_stored_functions.length - 1,
                };
            }

            if (typeof action_description === "string") {
                action_description = {'operation': action_description}
            }

            if (action_description && action_description['message'] && gui) {

                this.addMessage(action_description['message'], gui.eve);

                delete action_description['message'];
            }

            if (other_params) {
                for (let key in other_params) if (other_params.hasOwnProperty(
                    key)) {
                    action_description[key] = other_params[key];
                }
            }

            const event = type + '-event';
            if (this.data(event)) {
                if (replace) {
                    if (action_description) {
                        this.data(event, [action_description]);
                    } else {
                        this.removeData(event);
                    }
                } else {
                    let actions = this.data(event);
                    actions.push(action_description);
                    this.data(event, actions);
                }
            } else {
                this.data(event, [action_description]);
            }

        };

        Element.prototype.addClickEvent = function (
            action_description, other_params, replace, gui) {
            this.setCursor('pointer');
            return this.addInteractionEvent('click', action_description,
                other_params, replace);
        };

        Element.prototype.addPressEvent = function (
            action_description, other_params, replace, gui) {
            return this.addInteractionEvent('press', action_description,
                other_params, replace);
        };

        Element.prototype.addHoldEvent = function (
            action_description, other_params, replace, gui) {
            return this.addInteractionEvent('hold', action_description,
                other_params, replace);
        };

        Element.prototype.addLongpressEvent = function (
            action_description, other_params, gui) {
            return this.addInteractionEvent('longpress', action_description,
                other_params, replace);
        };

        //This function needs a listener to display the message. Intended for use with IA Designer
        Element.prototype.addMessage = function (message, eve) {
            let in_fun = () => {
                eve(["gui", "message"], undefined, message);
            };
            this.mouseover(in_fun);

            let out_fun = () => {
                eve(["gui", "tooltip", "clear"])
            };
            this.mouseout(out_fun);

            this.data("_message_helper_funs", [in_fun, out_fun])
        }

        Element.prototype.removeMessage = function () {
            const funs = this.data("_message_helper_funs");
            if (funs) {
                this.unmouseover(funs[0]);
                this.unmouseout(funs[1]);
                this.removeData("_message_helper_funs");
            }
        }

        Element.prototype.getBitmap = function (
            width, border, gui, callback, base64) {
            let height;
            let bbox;
            border = border || 0;
            if (width) {
                if (!isNaN(width)) {
                    width = Math.min(width, gui.panelWidth * 2);
                    bbox = this.getBBoxApprox();
                    height = (bbox.height + 2 * border) *
                        (width / (bbox.width + 2 * border));
                }
                if (Array.isArray(width)) {
                    let x = width[2] || 0;
                    let y = width[3] || 0;
                    height = width[1];
                    width = width[0];
                    bbox = {x, y, width, height};
                }
                // console.log("ratios", width / height, bbox.width / bbox.height);
            }
            let disp = this.attr('display');
            this.attr({display: ''});
            let svg_data = gui._.svgEncapsulateBox(this, border, width, height,
                bbox);
            this.attr({display: disp});

            let canvas = document.createElement('canvas');

            // canvas_div.append(canvas);
            // canvas = canvas[0];
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');

            const img = new Image();

            let svg = new Blob([svg_data], {type: 'image/svg+xml'});
            const DOMURL = root.URL || root.webkitURL || root;
            const url = DOMURL.createObjectURL(svg);

            let time = performance.now();

            const that = this;
            img.addEventListener('load', function () {
                context.drawImage(img, 0, 0, width, height, 0, 0, width, height);
                // that.temp_image_canvas = canvas;
                DOMURL.revokeObjectURL(url);
                // console.log(performance.now() - time);
                let ret = (base64) ? canvas.toDataURL() :
                    context.getImageData(0, 0, width, height);
                callback(ret);
                canvas.remove();
            });

            img.onerror = function () {
                console.log('problem with svg');
                console.log(svg_data);
                callback(null);
                canvas.remove();
            };

            img.src = url;

        };

        Element.prototype.getCanvasOverly = function (
            scale, width_pix, height_pix) {
            let scalex, scaley;
            scale = scale || 1;
            if (Array.isArray(scale) && scale.length === 2) {
                scalex = scale[0];
                scaley = scale[1];
            } else {
                scalex = scaley = scale;
            }

            // let bbox = this.getBBoxRot(this.transform().totalMatrix.split().rotate);
            let bbox = this.getBBox();
            // console.log("co", bbox, width_pix, height_pix, bbox.width / bbox.height, width_pix / height_pix);
            // this.after(bbox.rect(this.paper).attr({fill: "none", stroke: "black"}));
            width_pix = width_pix || bbox.width;
            height_pix = height_pix || bbox.height;

            const html = '<canvas id="' + this.getId() + '_canvas" ' +
                'width="' + width_pix + '" ' +
                'height="' + height_pix + '"></canvas>';
            const fo = this.htmlInsert(Snap.FORCE_AFTER, 0, 0, width_pix,
                height_pix, html);

            fo.fitInBox({
                width: bbox.width * scalex,
                height: bbox.height * scaley,
                cx: bbox.cx,
                cy: bbox.cy,
            }, true);

            let canvas = fo.select('canvas');
            canvas = canvas.node;

            return {container: fo, canvas: canvas};
        };

        /**
         * Creates a rastezied image of the element and places it in front ot the element.
         * @param gui
         * @param scale
         * @param border
         * @param remove
         * @returns {Promise<Element>} When created, the new image will be returned by the promise
         */
        Element.prototype.rasterize = function (gui, scale, border, remove) {
            scale = scale || 1;

            let that = this;
            border = border || 0;
            let bbox = this.getBBox();
            if (typeof border === 'string' &&
                border.endsWith('%')) border = Math.ceil(
                bbox.r2() * (+border.replace('%', '')) / 100);
            const promise = new Promise((resolve, reject) => {
                let make = function (base64) {
                    let img = that.image(Snap.FORCE_AFTER, base64, bbox.x - border,
                        bbox.y - border,
                        bbox.width + 2 * border, bbox.height + 2 * border);
                    img.attr({id: that.getId() + '_raster'});
                    console.log(bbox, img.getBBox());
                    if (remove) that.remove();
                    resolve(img);
                };

                this.getBitmap(bbox.width * scale, border, gui, make, true);
            });

            return promise;
        };


        Element.prototype.isAbove = function (el) {
            return Snap.positionComparator(this, el) > 0;
        };

        Element.prototype.isBelow = function (el) {
            return Snap.positionComparator(el, this) > 0;
        };

        Element.prototype.isParentOf = function (el) {
            return !!(Snap._compareDomPosition(this, el) & 16);
        };

        Element.prototype.isChildOf = function (el) {
            return !!(Snap._compareDomPosition(this, el) & 8);
        };

        Element.prototype.selectParent = function (css_select, outside_svg) {
            if ((!outside_svg && this.type === 'svg') || this.node === Snap.window().document) return null;

            if (typeof css_select === 'function') {
                if (css_select(this)) return this;
            } else {
                if (this.node.matches(css_select)) return this;
            }

            return this.parent().selectParent(css_select, outside_svg);
        };

        Element.prototype.closest = function (css_select, outside_svg) {
            if (this.node.matches(css_select)) return this;

            return this.selectParent(css_select, outside_svg);
        }

        Element.prototype.getBBoxRot = function (angle, cx, cy, aprox, settings) {
            if (typeof cx === 'boolean') {
                aprox = cx;
                cx = undefined;
                settings = cy;
                cy = undefined;
            }
            angle = (angle + 360) % 180;
            if (angle < 1e-5) return (aprox) ?
                this.getBBoxApprox() :
                this.getBBoxExact();

            let bbox;
            if (cx == undefined) {
                bbox = this.getBBox();
                cx = bbox.cx;
                cy = bbox.cy;
            }
            if (typeof cx === 'object' && cx.x != undefined && cx.y !=
                undefined) {
                cy = cx.y;
                cx = cx.y;
            }

            const old_transform = this.getLocalMatrix(STRICT_MODE);
            this.rotate(-angle, cx, cy);
            bbox = (aprox) ? this.getBBoxApprox() : this.getBBoxExact();
            this.attr({transform: old_transform});

            return bbox;
        };

//             Element.prototype.animateTransform_old = function (
//                 matrix, duration, easing, after_callback, easing_direct_matrix,
//                 procesor) {
//
//                 if (typeof after_callback === 'boolean') {
//                     procesor = easing_direct_matrix;
//                     easing_direct_matrix = after_callback;
//                     after_callback = undefined;
//                 }
//
//                 const dom_partner = this._dom_partner;
//                 const element_partner = this._element_partner;
//
//                 if (easing_direct_matrix) {
//                     console.log(easing_direct_matrix);
//                 }
//
//                 easing_direct_matrix = easing && easing_direct_matrix;
//
//                 // const fps = (IA_Designer && IA_Designer.is_safari) ? 24 : 30; //12
//                 // const ts = 1000 / fps; //time step;
//                 const loc = this.getLocalMatrix(true);
//                 const dif = {
//                     a: matrix.a - loc.a,
//                     b: matrix.b - loc.b,
//                     c: matrix.c - loc.c,
//                     d: matrix.d - loc.d,
//                     e: matrix.e - loc.e,
//                     f: matrix.f - loc.f,
//                 };
//
//                 if (easing_direct_matrix) {
//                     easing = easing(loc, matrix);
//                 }
//
//                 if (!duration) {
//                     console.log('Zero duration');
//                 }
//
//                 // const steps = Math.ceil(duration / ts) || 1;
//
//                 // let cur = 0;
//                 const that = this;
//                 let init_time;
//                 // let id = this.getId();
//
//                 let stop = false
//                 const handler = function (time) {
//
//                     if (stop) return;
//
//                     if (init_time === undefined) init_time = time;
//
//                     let t = time - init_time;
//
//                     let done = false;
//                     if (t >= duration - 30) {
//                         t = duration || 1;
//                         done = true;
//                     }
//
//                     t /= (duration || 1);
//
//                     let step_matrix;
//
//                     if (!done) {
//                         if (easing_direct_matrix) {
//                             step_matrix = easing(t).toString();
//                             // console.log(id, done, t, step_matrix);
//                         } else {
//                             if (easing) t = easing(t, loc, matrix);
//                             step_matrix = 'matrix('
//                                 + (loc.a + dif.a * t) + ','
//                                 + (loc.b + dif.b * t) + ','
//                                 + (loc.c + dif.c * t) + ','
//                                 + (loc.d + dif.d * t) + ','
//                                 + (loc.e + dif.e * t) + ','
//                                 + (loc.f + dif.f * t) + ')';
//                             // console.log(id, done, t, step_matrix);
//                         }
//                     } else {
//                         step_matrix = matrix.toString();
//                         // console.log(id, done, t, step_matrix);
//                     }
//
//                     if (isNaN(loc.a + dif.a * t)) {
//                         // console.log("problem", loc, dif, t);
//                     }
//
//                     if (procesor) {
//                         let processed_matrix = procesor(step_matrix);
//                         if (processed_matrix) {
//                             step_matrix = processed_matrix;
//                         }
//                     }
//
//                     if (done) {
//                         that.transform(matrix)
//                     } else {
//                         // that.node.setAttribute('transform', step_matrix);
//                         that.transform(step_matrix)
//                         // console.log(step_matrix);
//                         that.saveMatrix(undefined);
//                     }
//                     // console.log("anim", count, t, time, call_number, that.getId(), that.node);
//
//                     if (dom_partner) dom_partner.forEach(
//                         (dom) => dom.css('transform', step_matrix));
//                     if (element_partner) element_partner.forEach((el) => {
//                         // el.node.setAttribute("transform", step_matrix);
//                         // el.node.style.transform = step_matrix;
//                         if (done) {
//                             that.transform(matrix)
//                         } else {
//                             // if (el.node instanceof SVGElement) {
//                             if (Snap.is(el.node, "SVGElement")) {
//                                 // el.node.setAttribute('transform', step_matrix);
//                                 el.transform(step_matrix)
//                             } else {
//                                 el.node.style['transform'] = step_matrix;
//                                 // el.transform(step_matrix)
//                             }
//                             that.saveMatrix(undefined);
//                         }
//                     });
//
//                     if (done) {
//                         if (after_callback && typeof after_callback === 'function') {
//                             after_callback(that);
//                         }
//                     } else {
//                         requestAnimationFrame(handler);
//                     }
//
// // console.log(new_time - time, ts);
// // time = new_time;
//                 };
//                 // handler();
//                 //
//                 // let timer = setInterval(handler, ts);
//
//                 requestAnimationFrame(handler);
//
//                 // this.data("on_move", timer);
//
//                 return {
//                     stop: () => {
//                         stop = true;
//                     },
//                     pause: () => {
//                         stop = performance.now();
//                     },
//                     resume: () => {
//                         if (typeof stop === 'number') {
//                             init_time += performance.now() - stop;
//                             requestAnimationFrame(handler);
//                         }
//                     }
//                 }
//             };

        Element.prototype.animateTransform = function (
            matrix, duration, easing, after_callback, easing_direct_matrix, processor) {


            if (typeof after_callback === 'boolean') {
                processor = easing_direct_matrix;
                easing_direct_matrix = after_callback;
                after_callback = undefined;
            }

            const dom_partner = this._dom_partner;
            const element_partner = this._element_partner;

            const loc = this.getLocalMatrix(true);
            const dif = {
                a: matrix.a - loc.a,
                b: matrix.b - loc.b,
                c: matrix.c - loc.c,
                d: matrix.d - loc.d,
                e: matrix.e - loc.e,
                f: matrix.f - loc.f,
            };

            if (easing_direct_matrix) {
                easing = easing(loc, matrix);
            }

            if (!duration) {
                console.log('Zero duration');
            }

            const el = this;
            const start = mina.time();
            const end = start + duration;

            const set = function (res) {
                let step_matrix;
                let t = res[0];
                const done = t >= .99999;
                if (!done) {
                    if (easing_direct_matrix) {
                        step_matrix = easing(t).toString();
                    } else {
                        step_matrix = 'matrix('
                            + (loc.a + dif.a * t) + ','
                            + (loc.b + dif.b * t) + ','
                            + (loc.c + dif.c * t) + ','
                            + (loc.d + dif.d * t) + ','
                            + (loc.e + dif.e * t) + ','
                            + (loc.f + dif.f * t) + ')';
                    }
                } else {
                    step_matrix = matrix.toString();
                }

                if (processor) {
                    let processed_matrix = processor(step_matrix);
                    if (processed_matrix) {
                        step_matrix = processed_matrix;
                    }
                }

                if (!done) {
                    el.transform(step_matrix);
                    el.saveMatrix(undefined);
                } else {
                    el.transform(matrix)
                }

                if (dom_partner) dom_partner.forEach(
                    (dom) => dom.css('transform', step_matrix));
                if (element_partner) element_partner.forEach((el) => {
                    // el.node.setAttribute("transform", step_matrix);
                    // el.node.style.transform = step_matrix;
                    if (done) {
                        el.transform(matrix)
                    } else {
                        // if (el.node instanceof SVGElement) {
                        if (Snap.is(el.node, "SVGElement")) {
                            // el.node.setAttribute('transform', step_matrix);
                            el.transform(step_matrix)
                        } else {
                            el.node.style['transform'] = step_matrix;
                            // el.transform(step_matrix)
                        }
                        el.saveMatrix(undefined);
                    }
                });

                if (done) {
                    // if (after_callback && typeof after_callback === 'function') {
                    //     after_callback(el);
                    // }
                }
            };

            const anim = mina(
                [0],
                [1],
                start,
                end,
                mina.time,
                set,
                (easing_direct_matrix) ? mina.linear : (easing || mina.linear)
            );

            el.anims[anim.id] = anim;
            // anim._attrs = attrs;
            anim._callback = after_callback;
            eve.once("snap.mina.finish." + anim.id, function () {
                eve.off("snap.mina.*." + anim.id);
                delete el.anims[anim.id];
                after_callback && (typeof after_callback === 'function') && after_callback.call(el);
            });
            eve.once("snap.mina.stop." + anim.id, function () {
                eve.off("snap.mina.*." + anim.id);
                delete el.anims[anim.id];
            });
            eve(["snap", "animcreated", el.id], anim);

            return anim;
        };

        function val_generator(path, default_val) {
            let length, factor = 1, as_function = false;
            if (Array.isArray(path)) {
                factor = path[1] || 1;
                as_function = path[2] || false;
                path = path[0];
            }

            if (as_function) {
                const scp0 = path.getFirstPoint();
                const scp1 = path.getLastPoint();
                length = Math.abs(scp1.x - scp0.x);
                path = path.toPolyBezier();
            } else {
                length = (path.getTotalLength) ?
                    path.getTotalLength() :
                    path.length();
            }

            let fun = function (t) {
                let val = default_val;
                if (as_function) {
                    const p0 = path.getFirstPoint();
                    let x = p0.x + t * length;
                    const interset = path.lineIntersects(
                        [{x: x, y: -100000}, {x: x, y: 100000}]);
                    if (interset.length) {
                        let int_p = interset[0].curve.compute(interset[0].t);
                        val = factor * int_p.y;
                    } else {
                        // if there if no intersect, nudge x a bit.
                        let x_eps = (t === 0) ? x + 1e-5 : x - 1e-5;
                        const interset = path.lineIntersects(
                            [{x: x_eps, y: -100000}, {x: x_eps, y: 100000}]);
                        if (interset.length) {
                            let int_p = interset[0].curve.compute(interset[0].t);
                            val = factor * int_p.y;
                        }
                    }
                } else {
                    let p = path.getPointAtLength(length * t);
                    val = factor * p.y;
                }
                return val;
            };

            return fun;
        }

        // let _animateOnPath_old = function (el, absolute, path, duration, scale_path,
        //                                    rot_path,
        //                                    easing, after_callback, during_callback) {
        //     if (typeof scale_path === 'function') {
        //         after_callback = easing;
        //         easing = scale_path;
        //         scale_path = undefined;
        //     }
        //     if (easing == null) {
        //         easing = mina.linear;
        //     }
        //     let init_time;
        //     // let id = el.getId();
        //     const p_length = (path.getTotalLength) ? path.getTotalLength() :
        //         path.length();
        //     const p0 = path.getFirstPoint(true);
        //     let p_last;
        //
        //     let scale_fun, rot_fun;
        //
        //     const bbox = el.getBBox();
        //     const initial_matrix = el.getLocalMatrix();
        //
        //     // console.log("Start", el.getId(), bbox, el.getBBox());
        //
        //     if (scale_path) {
        //         if (absolute) {
        //             const split = initial_matrix.split();
        //
        //             initial_matrix.multLeft(Snap.matrix().scale(1 / split.scalex, 1 / split.scaley, bbox.cx, bbox.cy));
        //         }
        //         scale_fun = (typeof scale_path === 'function') ?
        //             scale_path :
        //             val_generator(scale_path, 1);
        //     }
        //
        //     // console.log("Start", el.getId(), initial_matrix);
        //
        //     if (rot_path) {
        //         if (absolute) {
        //             const split = initial_matrix.split();
        //
        //             initial_matrix.multLeft(
        //                 Snap.matrix().rotate(-split.rotate, bbox.cx, bbox.cy));
        //         }
        //         if (rot_path === true || !isNaN(rot_path)) {
        //             const angle_inc = (rot_path === true) ? 0 : rot_path;
        //             rot_fun = function (t, p, length) {
        //                 if (p && Snap.is(p, 'Element')) {
        //                     p = p.getPointAtLength(t * length);
        //                 }
        //                 if (p && p.hasOwnProperty('alpha')) {
        //                     return p.alpha + 180 + angle_inc;
        //                 }
        //                 if (p && Snap.is(p, 'PolyBezier')) {
        //
        //                 }
        //
        //             };
        //         } else {
        //             rot_fun = (typeof rot_path === 'function') ?
        //                 rot_path :
        //                 val_generator(rot_path, 0);
        //         }
        //     }
        //
        //     if (absolute) initial_matrix.multLeft(
        //         Snap.matrix().translate(p0.x - bbox.cx, p0.y - bbox.cy));
        //
        //     // console.log("Start_m", el.getId(), initial_matrix.a, initial_matrix.e);
        //
        //     const center = (absolute) ? p0 : el.getBBox().center();
        //
        //     const dom_partner = el._dom_partner;
        //     const element_partner = el._element_partner;
        //
        //     let stop;
        //     const handler = function (time) {
        //         // console.log("anim", cur);
        //
        //         if (stop) return;
        //
        //         if (init_time === undefined) init_time = time;
        //
        //         let t = time - init_time;
        //
        //         let done = false;
        //         if (t >= duration - 30) {
        //             t = duration || 1;
        //             done = true;
        //         }
        //
        //         t /= (duration || 1);
        //
        //         t = easing(t);
        //         let extra = 0;
        //         if (t > 1) {
        //             extra = 1;
        //             t = 2 - t;// 1 - (t - 1)
        //         } else if (t < 0) {
        //             extra = -1;
        //             t = -t;
        //         }
        //
        //         let pt = path.getPointAtLength(p_length * t);
        //
        //         if (extra > 0) {
        //             p_last = p_last || path.getLastPoint(true);
        //             pt = {
        //                 x: 2 * p_last.x - pt.x,
        //                 y: 2 * p_last.y - pt.y,
        //                 alpha: pt.alpha,
        //             };
        //         }
        //
        //         if (extra < 0) {
        //             pt = {
        //                 x: 2 * p0.x - pt.x,
        //                 y: 2 * p0.y - pt.y,
        //                 alpha: pt.alpha,
        //             };
        //         }
        //
        //
        //         let transl = Snap.matrix().translate(pt.x - p0.x, pt.y - p0.y);
        //
        //         // console.log(el.getId(), pt.x, t, transl.e);
        //
        //         let scale;
        //         if (scale_fun) {
        //             scale = scale_fun(t);
        //
        //             if (scale !== 1) {
        //                 const new_c = transl.apply(center);
        //                 const trans_scl = Snap.matrix().scale(scale, scale, new_c.x, new_c.y);
        //
        //                 transl.multLeft(trans_scl);
        //             }
        //             // console.log(el.getId() + "t_s", transl.a, transl.e, scale);
        //         }
        //
        //
        //         let angle;
        //         if (rot_fun) {
        //             angle = rot_fun(t, pt);
        //             const new_c = transl.apply(center);
        //             if (angle !== 0) {
        //                 const trans_rot = Snap.matrix().rotate(angle, new_c.x, new_c.y);
        //
        //                 transl.multLeft(trans_rot);
        //             }
        //         }
        //
        //         const step_matrix = initial_matrix.clone().multLeft(transl);
        //
        //         // console.log(el.getId() + "m", step_matrix.a, step_matrix.e,
        //         //     initial_matrix, initial_matrix.clone().multLeft(transl))
        //
        //         if (done) {
        //             el.transform(step_matrix)
        //         } else {
        //             // el.node.setAttribute('transform', step_matrix);
        //             el.transform(step_matrix)
        //             el.saveMatrix(undefined);
        //         }
        //
        //
        //         if (dom_partner) dom_partner.forEach(
        //             (dom) => dom.css('transform', step_matrix));
        //         if (element_partner) element_partner.forEach((el) => {
        //             if (done) {
        //                 el.transform(step_matrix)
        //             } else {
        //                 // el.node.setAttribute('transform', step_matrix);
        //                 el.transform(step_matrix)
        //                 el.saveMatrix(undefined);
        //             }
        //         });
        //
        //         during_callback && during_callback(t, el, scale, angle);
        //
        //         if (done) {
        //             if (after_callback && typeof after_callback === 'function') {
        //                 after_callback(el);
        //             }
        //         } else {
        //             requestAnimationFrame(handler);
        //         }
        //
        //     };
        //
        //     requestAnimationFrame(handler);
        //
        //     return {
        //         stop: () => {
        //             stop = true;
        //         },
        //         pause: () => {
        //             stop = performance.now();
        //         },
        //         resume: () => {
        //             if (typeof stop === 'number') {
        //                 init_time += performance.now() - stop;
        //                 requestAnimationFrame(handler);
        //             }
        //         }
        //     }
        //
        // };


        let _animateOnPath = function (el, absolute, path, duration,
                                       scale_path,
                                       rot_path,
                                       easing, after_callback, during_callback) {
            if (typeof scale_path === 'function') {
                after_callback = easing;
                easing = scale_path;
                scale_path = undefined;
            }
            if (easing == null) {
                easing = mina.linear;
            }
            let init_time;
            // let id = el.getId();
            const p_length = (path.getTotalLength) ? path.getTotalLength() :
                path.length();
            const p0 = path.getFirstPoint(true);
            let p_last;

            let scale_fun, rot_fun;

            const bbox = el.getBBox();
            const initial_matrix = el.getLocalMatrix();

            // console.log("Start", el.getId(), bbox, el.getBBox());

            if (scale_path) {
                if (absolute) {
                    const split = initial_matrix.split();

                    initial_matrix.multLeft(Snap.matrix().scale(1 / split.scalex, 1 / split.scaley, bbox.cx, bbox.cy));
                }
                scale_fun = (typeof scale_path === 'function') ?
                    scale_path :
                    val_generator(scale_path, 1);
            }

            // console.log("Start", el.getId(), initial_matrix);

            if (rot_path) {
                if (absolute) {
                    const split = initial_matrix.split();

                    initial_matrix.multLeft(
                        Snap.matrix().rotate(-split.rotate, bbox.cx, bbox.cy));
                }
                if (rot_path === true || !isNaN(rot_path)) {
                    const angle_inc = (rot_path === true) ? 0 : rot_path;
                    rot_fun = function (t, p, length) {
                        if (p && Snap.is(p, 'Element')) {
                            p = p.getPointAtLength(t * length);
                        }
                        if (p && p.hasOwnProperty('alpha')) {
                            return p.alpha + 180 + angle_inc;
                        }
                        if (p && Snap.is(p, 'PolyBezier')) {

                        }

                    };
                } else {
                    rot_fun = (typeof rot_path === 'function') ?
                        rot_path :
                        val_generator(rot_path, 0);
                }
            }

            if (absolute) initial_matrix.multLeft(
                Snap.matrix().translate(p0.x - bbox.cx, p0.y - bbox.cy));

            // console.log("Start_m", el.getId(), initial_matrix.a, initial_matrix.e);

            const center = (absolute) ? p0 : el.getBBox().center();

            const dom_partner = el._dom_partner;
            const element_partner = el._element_partner;

            const set = function (res) {
                // console.log("anim", cur);

                let t = res[0];

                let done = t >= .99999;

                t = easing(t);
                let extra = 0;
                if (t > 1) {
                    extra = 1;
                    t = 2 - t;// 1 - (t - 1)
                } else if (t < 0) {
                    extra = -1;
                    t = -t;
                }

                let pt = path.getPointAtLength(p_length * t);

                if (extra > 0) {
                    p_last = p_last || path.getLastPoint(true);
                    pt = {
                        x: 2 * p_last.x - pt.x,
                        y: 2 * p_last.y - pt.y,
                        alpha: pt.alpha,
                    };
                }

                if (extra < 0) {
                    pt = {
                        x: 2 * p0.x - pt.x,
                        y: 2 * p0.y - pt.y,
                        alpha: pt.alpha,
                    };
                }

                let transl = Snap.matrix().translate(pt.x - p0.x, pt.y - p0.y);

                // console.log(el.getId(), pt.x, t, transl.e);

                let scale;
                if (scale_fun) {
                    scale = scale_fun(t);

                    if (scale !== 1) {
                        const new_c = transl.apply(center);
                        const trans_scl = Snap.matrix().scale(scale, scale, new_c.x, new_c.y);

                        transl.multLeft(trans_scl);
                    }
                    // console.log(el.getId() + "t_s", transl.a, transl.e, scale);
                }


                let angle;
                if (rot_fun) {
                    angle = rot_fun(t, pt);
                    const new_c = transl.apply(center);
                    if (angle !== 0) {
                        const trans_rot = Snap.matrix().rotate(angle, new_c.x, new_c.y);

                        transl.multLeft(trans_rot);
                    }
                }

                const step_matrix = initial_matrix.clone().multLeft(transl);

                // console.log(el.getId() + "m", step_matrix.a, step_matrix.e,
                //     initial_matrix, initial_matrix.clone().multLeft(transl))

                if (done) {
                    el.transform(step_matrix)
                } else {
                    // el.node.setAttribute('transform', step_matrix);
                    el.transform(step_matrix)
                    el.saveMatrix(undefined);
                }

                if (dom_partner) dom_partner.forEach(
                    (dom) => dom.css('transform', step_matrix));
                if (element_partner) element_partner.forEach((el) => {
                    if (done) {
                        el.transform(step_matrix)
                    } else {
                        // el.node.setAttribute('transform', step_matrix);
                        el.transform(step_matrix)
                        el.saveMatrix(undefined);
                    }
                });

                during_callback && during_callback(t, el, scale, angle);

                // if (done) {
                // if (after_callback && typeof after_callback === 'function') {
                //     after_callback(el);
                // }
                // }

            };

            const start = mina.time();
            const end = start + duration;
            const anim = mina([0], [1], start, end, mina.time, set)

            el.anims[anim.id] = anim;
            // anim._attrs = attrs;
            anim._callback = after_callback;
            eve.once("snap.mina.finish." + anim.id, function () {
                eve.off("snap.mina.*." + anim.id);
                delete el.anims[anim.id];
                after_callback && (typeof after_callback === 'function') && after_callback.call(el);
            });
            eve.once("snap.mina.stop." + anim.id, function () {
                eve.off("snap.mina.*." + anim.id);
                delete el.anims[anim.id];
            });
            eve(["snap", "animcreated", el.id], anim);

            return anim;
        };

        Element.prototype.animateOnPath = function (path, duration, scale_path,
                                                    rot_path,
                                                    easing, after_callback, during_callback) {
            return _animateOnPath(this, false, path, duration, scale_path,
                rot_path,
                easing, after_callback, during_callback);
        };

        Element.prototype.animateOnPathAbsolute = function (path, duration,
                                                            scale_path,
                                                            rot_path,
                                                            easing,
                                                            after_callback, during_callback) {
            return _animateOnPath(this, true, path, duration, scale_path,
                rot_path,
                easing, after_callback, during_callback);
        };

        Element.prototype.jiggle = function (zoom_factor) {
            return;

            zoom_factor = zoom_factor || 1;
            // var save_tras = this.attr("transform") || "";
            const el = this;
            if (this.data('jig')) return;
            this.data('jig', true);
            const old_trans = el.getLocalMatrix(STRICT_MODE);
            const jig = old_trans.clone();

            const x_disp = 1 / zoom_factor;
            const y_disp = 3 / zoom_factor;

            jig.e = old_trans.e - x_disp;
            jig.f = old_trans.f - y_disp;

            el.animate({transform: jig}, 50, mina.linear,
                function () {
                    el.animate({transform: old_trans}, 50, mina.linear
                        , function () {
                            el.data('jig', '');
                        },
                    );
                });

        };

        Element.prototype.forEach = function (callback, apply_to_root) {
            if (apply_to_root) callback(this);
            const children = this.getChildren();
            for (let i = 0, l = children.length; i < l; ++i) {
                children[i].forEach(callback, true);
            }
        };

        Element.prototype.g_a = function () {
            let args = Array.from(arguments);
            args.unshift(Snap.FORCE_AFTER);
            return this.g.apply(this, args);
        };

        Element.prototype.group = function (attr) {
            let g = this.g_a();
            g.add(this);
            if (attr) g.attr(attr);
            return g;
        };

        Element.prototype.ungroup = Element.prototype.flatten;


    });
}(window || this))
(function (root) {
        let Snap_ia = root.Snap_ia || root.Snap;

        //Paper functions, require snap_extensions and element_extensions
        Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {

            Paper.prototype.clipPath = function (first) {
                let attr;
                const el = this.el('clipPath');
                if (first && !first.paper) {
                    el.attr(first);
                } else if (first && first.paper) {
                    el.add(first);
                }
                return el;
            };

            Paper.prototype.a = function (href, target) {
                const el = this.el('a');
                if (href || target) {
                    const attr = {};
                    href && (attr.href = href);
                    target && (attr.target = target);
                    el.attr(attr);
                }
                return el;
            };

            Paper.prototype.foreignObject = function (x, y, width, height, html) {
                if (typeof width === 'string' && height === undefined && html ===
                    undefined) {
                    html = width;
                    width = undefined;
                    height = undefined;
                }
                let attr = {};
                if (Snap.is(x, 'object')) {
                    attr = x;
                } else if (x != null) {
                    attr = {
                        x: x,
                        y: y,
                        width: width || '',
                        height: height || '',
                    };
                }
                const el = this.el('foreignObject', attr);
                el.node.innerHTML = html || '';
                return el;
            };

            Paper.prototype.htmlInsert = function (
                x, y, width, height, html, style) {
                const div = '<div xmlns="http://www.w3.org/1999/xhtml" class="IA_Designer_html"></div>';
                const el = this.foreignObject(x, y, width, height, div);
                el.div = Snap(el.node.firstChild);
                if (html) {
                    const type = typeof html;
                    if (type === 'string') {
                        el.div.node.innerHTML = html;
                    } else if (type === 'object' && html.paper || Array.isArray(html)) {
                        el.div.add(html);
                    } else if (type === 'object' && html instanceof jQuery) {
                        el.div.add(html.toArray());
                    }
                }
                if (style) el.div.setStyle(style);
                return el;
            };

            Paper.prototype.embeddedSVG = function (
                x, y, width, height, element, viewBox) {
                if (viewBox && viewBox.getBBox) {
                    let bb = viewBox.getBBox;
                    viewBox = [bb.x, bb.y, bb.width, bb.height];
                }
                !viewBox && (viewBox = [0, 0, width, height]);

                let el = this.htmlInsert(x, y, width, height);
                let embedded_svg = Snap(width, height);
                embedded_svg.attr({id: this.getId() + '_innersvg'});
                el.div.append(embedded_svg.node);
                el.embeddedSvg = embedded_svg;
                embedded_svg.embedded = true;
                if (element) {
                    embedded_svg.add(element);
                    element.paper = embedded_svg.paper;
                }

                return el;
            };

            Paper.prototype.canvas = function (x, y, width, height, id) {
                id = id || String.rand(8, 'alpha');
                const html = '<canvas id="' + id + '_canvas" ' +
                    'width="' + width + '" ' +
                    'height="' + height + '"></canvas>';
                const fo = this.foreignObject(0, 0, width, height, html);
                fo.attr({id: id});
                fo.canvas = fo.select('canvas').node;
                return fo;
            };

            const textInputBox = function (id, x, y, width, height) {
                const html = '<div id ="' + id +
                    '" xmlns="http://www.w3.org/1999/xhtml">' +
                    '<form>' +
                    '<input type="text" value="test">' +
                    '</form>' +
                    '</div>';
                return this.foreignObject(x, y, width, height, html);
            };
            // textInputBox.skip = true;
            Paper.prototype.textInputBox = textInputBox;

            Paper.prototype.point = function (
                group, x, y, color, size, label, label_style) {
                if (typeof group !== 'object' || !group.paper) {
                    label_style = label;
                    label = size;
                    size = color;
                    color = y;
                    y = x;
                    x = group;
                    group = this;
                }
                if (typeof x === 'object') {
                    label_style = label;
                    label = size;
                    size = color;
                    color = y;
                    y = x[1] || x.y;
                    x = x[0] || x.x;
                }
                if (typeof color === 'number') {
                    label_style = label;
                    label = size;
                    size = color;
                    color = undefined;
                }
                size = size || 1;
                const r = group.getFromScreenDistance(size);
                let pt = this.circle(x, y, r);
                pt.attr({
                    stroke: 'white',
                    fill: color || 'black',
                    strokeWidth: size / 2 || 1,
                    is_point: 1,
                    'vector-effect': 'non-scaling-stroke',
                    class: 'IA_Designer_point',
                });

                if (label !== null) {
                    const pt_gr = pt.g();
                    pt_gr.add(pt);
                    let dx = 5;
                    let dy = 5;
                    if (label_style) {
                        dx = label_style.dx || 5;
                        dy = label_style.dy || 5;
                    }
                    let lb = pt_gr.text(x + dx, y + dy, label);
                    if (label_style) lb.setStyle(label_style);
                    pt = pt_gr;
                }

                group.add(pt);
                return pt;
            };


            /**
             * Overwrite all circles to be ellipses for geometric simplicity
             * @param x
             * @param y
             * @param r
             * @param attr
             * @return {*}
             */
            Paper.prototype.circle = function (x, y, r, attr) {
                return this.ellipse(x, y, r, r, attr);
            };

            const measureText = function (text, font_style, group) {
                const text_el = this.text(0, 0, text);
                if (font_style) text_el.attr(font_style);
                if (group) group.add(text_el);
                const box = text_el.getBBox();
                text_el.remove();
                return box;
            };
            measureText.skip = true; //Do not transfer to Element
            Paper.prototype.measureText = measureText;

            Paper.prototype.multilineText = function (
                x, y, text, attr, linespace, first_tab) {
                linespace = linespace || 1.2;
                first_tab = first_tab || 0;
                if (typeof text === 'string') text = text.split(/\\n/g);
                let text_tab = this.text(x, y, text, attr);
                let tspans = text_tab.getChildren(true);
                for (let i = 0, l = tspans.length; i < l; ++i) {
                    tspans[i].attr({
                        x: x + ((i) ? 0 : first_tab),
                        dy: (i) ? (linespace + 'em') : '.6em',
                    });
                }

                return text_tab;
            };

        });

        //Shape builders
        Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {

                /*Creates a circle from a center and a point on it*/
                Paper.prototype.circleCentPoint = function (x1, y1, x2, y2) {
                    if (typeof y1 === "object" && y1.hasOwnProperty("x")) {
                        x2 = y1.x;
                        y2 = y1.y;
                    }

                    if (typeof x1 === "object" && y1.hasOwnProperty("x")) {
                        y1 = x1.y;
                        x1 = x1.x;
                    }


                    return this.circle(x1, y1, Snap.len(x1, y1, x2, y2));
                };


                Paper.prototype.circleTwoPoints = function (x1, y1, x2, y2) {
                    if (typeof y1 === "object" && y1.hasOwnProperty("x")) {
                        x2 = y1.x;
                        y2 = y1.y;
                    }

                    if (typeof x1 === "object" && y1.hasOwnProperty("x")) {
                        y1 = x1.y;
                        x1 = x1.x;
                    }


                    return this.circle((x1 + x2) / 2, (y1 + y2) / 2, Snap.len(x1, y1, x2, y2) / 2);
                };

                Paper.prototype.circleThreePoints = function (x1, y1, x2, y2, x3, y3) {

                    if (typeof x2 === "object" && x2.hasOwnProperty("x")) {
                        x3 = x2.x;
                        y3 = x2.y;
                    }

                    if (typeof y1 === "object" && y1.hasOwnProperty("x")) {
                        x2 = y1.x;
                        y2 = y1.y;
                    }

                    if (typeof x1 === "object" && y1.hasOwnProperty("x")) {
                        y1 = x1.y;
                        x1 = x1.x;
                    }

                    const yDelta_a = y2 - y1;
                    const xDelta_a = x2 - x1;
                    const yDelta_b = y3 - y2;
                    const xDelta_b = x3 - x2;

                    const aSlope = yDelta_a / xDelta_a;
                    const bSlope = yDelta_b / xDelta_b;

                    const c_x = (aSlope * bSlope * (y1 - y3) + bSlope * (x1 + x2) - aSlope * (x2 + x3)) / (2 * (bSlope - aSlope));
                    const c_y = -1 * (c_x - (x1 + x2) / 2) / aSlope + (y1 + y2) / 2;

                    if (c_x === Infinity || c_y === Infinity) return null;

                    const r = Snap.len(c_x, c_y, x1, y1);

                    if (r > 100000) return null;

                    return this.circle(c_x, c_y, r)
                };


                Paper.prototype.ellipseFromEquation = function (A, B, C, D, E, F, properties_only) {
                    if (typeof F === "boolean") {
                        properties_only = F;
                        F = -1
                    }

                    if (F === undefined) F = -1;

                    let den = 4 * A * C - B * B;
                    if (den == 0) {
                        return null;
                    }
                    let cx = (B * E - 2 * C * D) / den;
                    let cy = (B * D - 2 * A * E) / den;

                    // evaluate the a coefficient of the ellipse equation in normal form
                    // E(x,y) = a*(x-cx)^2 + b*(x-cx)*(y-cy) + c*(y-cy)^2 = 1
                    // where b = a*B , c = a*C, (cx,cy) == centre
                    let num = A * cx * cx
                        + B * cx * cy
                        + C * cy * cy
                        - F;


                    //evaluate ellipse rotation angle
                    let rot = Math.atan2(-B, -(A - C)) / 2;
//      cerr << "rot = " << rot << endl;
                    let swap_axes = false;
                    if (Math.abs(rot - 0) < 1e-6) {
                        rot = 0;
                    }
                    if (Math.abs(rot - Math.PI / 2) < 1e-12 || rot < 0) {
                        swap_axes = true;
                    }

                    // evaluate the length of the ellipse rays
                    const cosrot = Math.cos(rot);
                    const sinrot = Math.sin(rot);
                    const cos2 = cosrot * cosrot;
                    const sin2 = sinrot * sinrot;
                    const cossin = cosrot * sinrot;

                    den = A * cos2 + B * cossin + C * sin2;

//
//        rx2 = num/roots[0];
//        ry2 = num/roots[1];

                    if (den === 0) {
                        return null
                    }
                    const rx2 = num / den;
                    if (rx2 < 0) {
                        return null;
                    }
                    let rx = Math.sqrt(rx2);

                    den = C * cos2 - B * cossin + A * sin2;
                    if (den === 0) {
                        return null;
                    }
                    const ry2 = num / den;
                    if (ry2 < 0) {
                        return null;
                    }

                    let ry = Math.sqrt(ry2);

                    // the solution is not unique so we choose always the ellipse
                    // with a rotation angle between 0 and PI/2
                    if (swap_axes) {
                        //swap(rx, ry);
                        const temp = rx;
                        rx = ry;
                        ry = temp;
                    }
                    if (Math.abs(rot - Math.PI / 2) < 1e-6
                        || Math.abs(rot - Math.PI / 2) < 1e-6
                        || Math.abs(rx - ry) < 1e-12
                    ) {
                        rot = 0;
                    } else {
                        if (rot < 0) {
                            rot += Math.PI / 2;
                        }
                    }

                    if (properties_only) {
                        return {
                            x: cx,
                            y: cy,
                            rx: rx,
                            ry: ry,
                            angle: Snap.deg(rot)
                        }
                    } else {
                        return this.ellipse(cx, cy, rx, ry).rotate(Snap.deg(rot), cx, cy)
                    }
                };

                Paper.prototype.diskSegments = function (num_segments, angle, start_angle, inner_rad, outer_rad, style, id, group, class_name) {
                    if (!group && num_segments > 1) {
                        group = this.g()
                    }

                    if (!id && group) id = group.getId();

                    if (!angle) angle = 2 * Math.PI / num_segments;

                    let d, p1, p2, p3, p4, c, angle_step, insc_rad, path, place;
                    for (let i = 0; i < num_segments; ++i) {
                        angle_step = angle * i + start_angle; //Adding Pi to reposition upwards.
                        p1 = Snap.fromPolar(inner_rad, angle_step - angle / 2);
                        p2 = Snap.fromPolar(outer_rad, angle_step - angle / 2);
                        p3 = Snap.fromPolar(outer_rad, angle_step + angle / 2);
                        p4 = Snap.fromPolar(inner_rad, angle_step + angle / 2);

                        d = "M " + p1.x + "," + p1.y +
                            " L " + p2.x + "," + p2.y +
                            " A " + outer_rad + "," + outer_rad + ",0,0,1," + p3.x + "," + p3.y +
                            " L " + p4.x + "," + p4.y +
                            " A " + (inner_rad) + "," + (inner_rad) + ",0,0,0," + p1.x + "," + p1.y;

                        path = this.paper.path(d);
                        if (id) path.attr("id", id + "_" + i);
                        if (style) {
                            if (Array.isArray(style)) {
                                path.attr("style", style[i]);
                            } else if (typeof style === "function") {
                                style(path, group, i, inner_rad, outer_rad, angle_step, angle, [p1, p2, p3, p4]);
                            } else {
                                path.setStyle(style);
                            }
                        }

                        if (class_name) {
                            path.addClass(class_name);
                        }

                        if (group) group.add(path);
                    }

                    return (group) ? group : path;
                };

                Paper.prototype.disk = function (cx, cy, our_rad, inner_rad) {
                    const outer = this.circle(cx, cy, our_rad).toDefs();
                    const inner = this.circle(cx, cy, inner_rad).toDefs();

                    const d = Snap.path.toPath(outer, true) + " " + Snap.path.toPath(inner, true);

                    outer.remove();
                    inner.remove();

                    return this.path(d).attr({fillRule: "evenodd"});
                };

                Paper.prototype.arcFan = function (rad, angle, step, symbol, style, id, group) {
                    if (!group) {
                        group = this.g()
                    }

                    if (!id) id = group.getId();

                    let processor;

                    const that = this;
                    if (symbol.paper) {
                        const box = symbol.getBBox();
                        processor = function (p, angle, id) {
                            const copy = symbol.clone().attr("id", id);
                            copy.translate(p.x, p.y, undefined, box.cx, box.y2);
                            copy.rotate(angle, p.x, p.y);
                            return copy;
                        }
                    } else if (symbol.type === "line") {
                        processor = function (p, angle, id) {
                            const p2 = {
                                x: p.x + symbol.l * Math.cos(angle * Math.PI * 2 / 360),
                                y: p.y + symbol.l * Math.sin(angle * Math.PI * 2 / 360)
                            };
                            return that.line(p.x, p.y, p2.x, p2.y).attr("id", id);
                        }
                    } else if (symbol.type === "circle") {
                        processor = function (p, angle, id) {
                            return that.circle(p.x, p.y, symbol.r).attr("id", id);
                        }
                    } else {
                        return undefined;
                    }

                    for (let a = -angle / 2, i = 0, inc = angle / (step - 1); i < step; ++i, a += inc) {
                        const p = Snap.fromPolar(rad, Snap.rad(a));
                        const el = processor(p, a, id + "_" + i);
                        if (style) {
                            if (Array.isArray(style)) {
                                el.attr("style", style[i]);
                            } else if (typeof style === "function") {
                                style(el, group, i, a, p);
                            } else {
                                el.setStyle(style);
                            }
                        }
                        group.add(el);
                    }

                    return group;
                };

                /**
                 * Creates a rectangular grid.
                 *
                 * @param {number} width
                 * @param {number} height
                 * @param {number} rows
                 * @param {number} cols
                 * @param {function, object} style
                 * @param {string} id
                 * @param {Element} group
                 * @return {*}
                 */
                Paper.prototype.grid = function (width, height, rows, cols, style, id, group) {
                    if (!group) {
                        group = this.g()
                    }

                    if (!id) id = group.getId();

                    let style_fun;
                    if (typeof style !== "function") {
                        style_fun = function (rect) {
                            rect.setStyle(style)
                        }
                    } else {
                        style_fun = style;
                    }

                    const rect_w = width / cols;
                    const rect_h = height / rows;

                    for (let i = 0, j, rect; i < cols; ++i) {
                        for (j = 0; j < rows; j++) {
                            rect = this.rect(i * rect_w, j * rect_h, rect_w, rect_h).attr({
                                id: id + "_" + i + "_" + j,
                                position: i + ", " + j
                            });

                            style_fun(rect, i, j);
                            group.add(rect);
                        }
                    }

                    return group;
                };

                Paper.prototype.zigzag = function (p1, p2_width, period, amplitude, reverice) {
                    const p2 = (typeof p2_width === "number") ? {x: p1.x + p2_width, y: p1.y} : p2_width;

                    const length = (typeof p2_width === "number") ? p2_width : Snap.len(p1.x, p1.y, p2.x, p2.y);

                    const num_periods = round(length / period);
                    period = length / num_periods;

                    amplitude = (reverice) ? -amplitude : amplitude;

                    const v = {x: period / 2 * (p2.x - p1.x) / length, y: period / 2 * (p2.y - p1.y) / length};
                    const norm = {x: -amplitude * (p2.y - p1.y) / length, y: amplitude * (p2.x - p1.x) / length};

                    const points = [p1.x, p1.y];
                    for (let i = 1, px, py, amp_dir; i < 2 * num_periods; ++i) {
                        amp_dir = (-1) * (i % 2);
                        px = (i * v.x + p1.x) + (norm.x) * amp_dir;
                        py = (i * v.y + p1.y) + (norm.y) * amp_dir;
                        points.push(px);
                        points.push(py);
                    }
                    points.push(p2.x);
                    points.push(p2.y);

                    return this.polyline(points);
                }
            }
        );

        Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {
            //Add paper functions to elements


            /**
             * If placed as the first argument for an element constructor function called on a element, the new element is
             * placed after current. This overrides the behaviour where the new element will be added inside group-like elements.
             * @type {string}
             */
            Snap.FORCE_AFTER = Snap.FORCE_AFTER || '__force_after';

            /*
            * Functions that should not be transferred to element should have a property "skip" set to true.
            * */

            //Add paper functions to elements

            function paperMetForEl(method) {
                return function () {
                    let force_after = false;
                    if (arguments[0] === Snap.FORCE_AFTER) {
                        force_after = true;
                        Array.prototype.shift.apply(arguments);
                    }
                    const result = method.apply(this, arguments);
                    if (!force_after && this.isGroupLike()) {
                        return result;
                    } else {
                        this.after(result);
                        return result;
                    }

                };
            }

            Paper.paperMetForEl = paperMetForEl;

            //make all paper construction methods work for Elements
            for (var method in Paper.prototype) if (Paper.prototype.hasOwnProperty(
                method)) {
                if (!Paper.prototype[method].skip) {
                    Element.prototype[method] = Element.prototype[method] ||
                        paperMetForEl(Paper.prototype[method]);
                }
            }
        })


    }(typeof window !== "undefined" ? window : (global))
)
;
return Snap_ia;
}));
;
