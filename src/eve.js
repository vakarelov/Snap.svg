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
