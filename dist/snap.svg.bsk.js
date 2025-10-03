// Snap.svg 1.0,1
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
// build: 2025-10-03

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

    // Global alias mappings for namespace translation
    let namespace_aliases = undefined;

    /**
     * translateNamespaceAlias @method *
     * Internal function to translate namespace aliases in event names.
     * Translates the top-level namespace (first part before separator) if an alias exists. * * @param {string|array} name - event name or array of event name parts * * @returns {array|string} translated event name as array (or may return string if no aliases defind)
    */
    const translateNamespaceAlias = function(name) {
        if (!namespace_aliases) return name;
        if (isArray(name)) {
            // Handle array format
            if (name.length > 0 && namespace_aliases.hasOwnProperty(name[0])) {
                const translated = name.slice(); // Create a copy
                translated[0] = namespace_aliases[name[0]];
                return translated;
            }
            return name;
        } else {
            // Handle string format
            const nameParts = String(name).split(separator);
            if (nameParts.length > 0 && namespace_aliases.hasOwnProperty(nameParts[0])) {
                nameParts[0] = namespace_aliases[nameParts[0]];
                return nameParts;
            }
            return nameParts;
        }
    };

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
        /**
         * eve @method

         * Fires event with given `name`, given scope and other parameters. * @param {string} name - name of the *event*, dot (`.`) or slash (`/`) separated * @param {object} scope - context for the event handlers * @param {...any} varargs - the rest of arguments will be sent to event handlers * @returns {object} array of returned values from the listeners. Array has two methods `.firstDefined()` and `.lastDefined()` to get first or last not `undefined` value.
        */
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

            // Apply namespace alias translation
            name = translateNamespaceAlias(name);

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

    /**
     * eve.a @method

     * Async version of eve that returns an array of promises from all listeners.
     * All listener functions are wrapped to ensure they return promises. * @param {string} name - name of the *event*, dot (`.`) or slash (`/`) separated * @param {object} scope - context for the event handlers * @param {...any} varargs - the rest of arguments will be sent to event handlers * @returns {array} array of promises from the listeners
    */
    eve.a = function (group, name, scope) {
        let args;
        if (Array.isArray(group) || typeof group === "string") {
            args = Array.prototype.slice.call(arguments, 2)
            scope = name;
            name = group;
            group = undefined;
        } else {
            group = group.id;
        }

        // Apply namespace alias translation
        name = translateNamespaceAlias(name);

        args = args || Array.prototype.slice.call(arguments, 3)

        const oldstop = stop,
            listeners = eve.listeners(name, group),
            promises = [],
            ce = current_event;

        promises.firstDefined = firstDefined;
        promises.lastDefined = lastDefined;

        if (typeof scope !== "undefined" && typeof scope !== "object") {
            args.unshift(scope);
            scope = undefined;
        }

        current_event = name;
        stop = 0;

        // Sort listeners by zIndex
        listeners.sort(function_sort);

        for (let i = 0, lim = listeners.length; i < lim; ++i) {
            const l = listeners[i];
            try {
                // Universal wrapper to ensure all returns are promises
                const result = l.apply(scope, args);
                promises.push(Promise.resolve(result));
            } catch (e) {
                console.error(e.message, e, args, l);
                eve("global.error", undefined, e, l, args);
                promises.push(Promise.reject(e));
            }
            if (stop) {
                break;
            }
        }

        stop = oldstop;
        current_event = ce;

        // Log if enabled
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

        return promises;
    };

    /**
     * eve.all @method

     * Async version that returns a single promise resolving to an array of all listener results.
     * Waits for all promises to resolve before returning the results array. * @param {string} name - name of the *event*, dot (`.`) or slash (`/`) separated * @param {object} scope - context for the event handlers * @param {...any} varargs - the rest of arguments will be sent to event handlers * @returns {Promise} promise that resolves to array of results from all listeners
    */
    eve.all = function (group, name, scope) {
        const promises = eve.a.apply(this, arguments);

        return Promise.all(promises).then(results => {
            results.firstDefined = firstDefined;
            results.lastDefined = lastDefined;
            return results;
        });
    };

    /**
     * eve.localEve @method *
     * Creates a local eve instance that operates within a specific event group.
     * All events fired through this instance will be scoped to the specified group. * * @param {string} group_id - identifier for the event group * * @returns {function} local eve instance with all eve methods scoped to the group
    */
    eve.localEve = function (group_id) {
        eve.setGroup(group_id);
        const ret_eve = function (name, scope) {
            let args = [{id: group_id}, ...Array.prototype.slice.call(arguments)];
            return eve.apply(undefined, args);
        }

        ret_eve.group = group_id;

        // Add this inside the eve.localEve function, after the existing methods
        ret_eve.a = function (name, scope) {
            let args = [{id: group_id}, ...Array.prototype.slice.call(arguments)];
            return eve.a.apply(undefined, args);
        }

        // Add this inside the eve.localEve function
        ret_eve.all = function (name, scope) {
            let args = [{id: group_id}, ...Array.prototype.slice.call(arguments)];
            return eve.all.apply(undefined, args);
        }

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

    /**
     * eve.logEvents @method *
     * Enables or disables event logging for debugging purposes.
     * When enabled, tracks event firing statistics including call count and listener count. * * @param {boolean} off - if true, disables logging; if false or undefined, enables logging
    */
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
    /**
     * eve.listeners @method

     * Internal method which gives you array of all event handlers that will be triggered by the given `name`. * @param {string} name - name of the event, dot (`.`) or slash (`/`) separated * @returns {array} array of event handlers
    */
    eve.listeners = function (name, group, skip_global) {
        // Apply namespace alias translation
        name = translateNamespaceAlias(name);

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
    /**
     * eve.separator @method

     * If for some reasons you don’t like default separators (`.` or `/`) you can specify yours
     * here. Be aware that if you pass a string longer than one character it will be treated as
     * a list of characters. * @param {string} separator - new separator. Empty string resets to default: `.` or `/`.
    */
    eve.separator = function (sep) {
        if (sep) {
            sep = Str(sep).replace(/(?=[\.\^\]\[\-])/g, "\\");
            sep = "[" + sep + "]";
            separator = new RegExp(sep);
        } else {
            separator = /[\.\/]/;
        }
    };

    /**
     * eve.setGroup @method *
     * Sets the current active event group for subsequent event operations.
     * If no group is specified, resets to the default group. * * @param {string} group - #optional name of the event group to set as active
    */
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

    /**
     * eve.fireInGroup @method *
     * Fires an event within a specific event group context.
     * Temporarily switches to the specified group, fires the event, then restores the previous group. * * @param {string} group - name of the event group to fire the event in * @param {...any} varargs - event arguments to pass to eve() * * @returns {array} array of returned values from the listeners
    */
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

    /**
     * eve.addGlobalEventType @method *
     * Adds a global event type to the global event list.
     * Be aware that this will not add the event to the local event list. Adding a global type may prevent local events
     * starting with the same name from being triggered. * * @param {string} name - name of the global event type to add
    */
    eve.addGlobalEventType = function (name) {
        if (!global_event.n.hasOwnProperty(name)) {
            global_event.n[name] = {n: {}};
        }
    }

    /**
     * eve.on @method *
     * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
     | eve.on("*.under.*", f);
     | eve("mouse.under.floor"); // triggers f
     * Use @eve to trigger the listener. * * @param {string} name - name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards * @param {function} f - event handler function * * @param {array} name - if you don’t want to use separators, you can use array of strings * @param {function} f - event handler function * * @returns {function} returned function accepts a single numeric parameter that represents z-index of the handler. It is an optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment.
     > Example:
     | eve.on("mouse", eatIt)(2);
     | eve.on("mouse", scream);
     | eve.on("mouse", catchIt)(1);
     * This will ensure that `catchIt` function will be called before `eatIt`.
     *
     * If you want to put your handler before non-indexed handlers, specify a negative value.
     * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
    */
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
            // Apply namespace alias translation for each name
            name = translateNamespaceAlias(name);

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
    /**
     * eve.f @method *
     * Returns function that will fire given event with optional arguments.
     * Arguments that will be passed to the result function will be also
     * concated to the list of final arguments.
     | el.onclick = eve.f("click", 1, 2);
     | eve.on("click", function (a, b, c) {
     |     console.log(a, b, c); // 1, 2, [event object]
     | }); * @param {string} event - event name * @param {...any} varargs - and any other arguments * @returns {function} possible event handler function
    */
    eve.f = function (event) {
        const attrs = [].slice.call(arguments, 1);
        return function () {
            eve.apply(null, [event, null].concat(attrs).concat([].slice.call(arguments, 0)));
        };
    };
    /**
     * eve.stop @method *
     * Is used inside an event handler to stop the event, preventing any subsequent listeners from firing.
    */
    eve.stop = function () {
        stop = 1;
    };
    /**
     * eve.nt @method *
     * Could be used inside event handler to figure out actual name of the event. * * @param {string} subname - #optional subname of the event * * @returns {string} name of the event, if `subname` is not specified
     * or * @returns {boolean} `true`, if current event’s name contains `subname`
    */
    eve.nt = function (subname) {
        const cur = isArray(current_event) ? current_event.join(".") : current_event;
        if (subname) {
            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(cur);
        }
        return cur;
    };
    /**
     * eve.nts @method *
     * Could be used inside event handler to figure out actual name of the event. * * * @returns {array} names of the event
    */
    eve.nts = function () {
        return isArray(current_event) ? current_event : current_event.split(separator);
    };
    /**
     * eve.off @method *
     * Removes given function from the list of event listeners assigned to given name.
     * If no arguments specified all the events will be cleared. * * @param {string} name - name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards * @param {function} f - event handler function
    */
    /**
     * eve.unbind @method *
     * See @eve.off
    */
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

        // Apply namespace alias translation
        name = translateNamespaceAlias(name);

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
     * eve.alias @method *
     * Sets up namespace alias mappings for backward compatibility.
     * Allows translating top-level event namespaces from one name to another.
     * When an event is fired, registered, or removed with an aliased namespace,
     * it will be automatically translated to the target namespace. * * @param {object} aliases - object containing key-value pairs where keys are alias names
     *   and values are the target namespace names they should be translated to *
     > Examples:
     | // Set up aliases
     | eve.alias({
     |     "OLD_NAMESPACE": "new_namespace",
     |     "LEGACY": "modern"
     | });
     |
     | // These will be equivalent:
     | eve.on("OLD_NAMESPACE.event.name", handler);
     | eve.on("new_namespace.event.name", handler);
     |
     | eve("OLD_NAMESPACE.event.name", data);
     | eve("new_namespace.event.name", data);
    */
    eve.alias = function(aliases) {
        if (typeof aliases === 'object' && aliases !== null) {
            namespace_aliases = namespace_aliases || {};
            for (const aliasName in aliases) {
                if (aliases.hasOwnProperty(aliasName)) {
                    namespace_aliases[aliasName] = aliases[aliasName];
                }
            }
        }
    };

    /**
     * eve.clearAliases @method *
     * Clears all namespace alias mappings. *
    */
    eve.clearAliases = function() {
        for (const key in namespace_aliases) {
            if (namespace_aliases.hasOwnProperty(key)) {
                delete namespace_aliases[key];
            }
        }
    };

    /**
     * eve.getAliases @method *
     * Returns a copy of the current namespace alias mappings. * * @returns {object} copy of current alias mappings
    */
    eve.getAliases = function() {
        const aliases = {};
        if (namespace_aliases) for (const key in namespace_aliases) {
            if (namespace_aliases.hasOwnProperty(key)) {
                aliases[key] = namespace_aliases[key];
            }
        }
        return aliases;
    };

    /**
     * eve.is
     * @method
    * Checks if the given event is registered with the given function.
    * @type {function(*, *, *): boolean}
     */
    eve.is = function (name, f, group) {
        if (!name || typeof f !== 'function') {
            return false;
        }

        // Apply namespace alias translation
        name = translateNamespaceAlias(name);

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
                        if (eve.is(key, f, group)) {
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
    };

    /**
     * eve.once @method *
     * Binds given event handler with a given name to only run once then unbind itself.
     | eve.once("login", f);
     | eve("login"); // triggers f
     | eve("login"); // no listeners
     * Use @eve to trigger the listener. * * @param {string} name - name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards * @param {function} f - event handler function * * @returns {function} same return function as @eve.on
    */
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

        // Apply namespace alias translation
        name = translateNamespaceAlias(name);

        const container = {
            data: data,
            isFilter: true
        };
        argumentsArray = argumentsArray || Array.from(arguments).slice(3);
        eve.apply(undefined, [group, name, container, ...argumentsArray]);
        return container.data;
    };

    /**
     * eve.version
     [ property (string) ] *
     * Current version of the library.
    */
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
     * @param {...any} args Optional arguments forwarded to the callback.
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
     * @param {...any} args Optional arguments forwarded to the callback.
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
     * @param {...any} args Optional arguments forwarded to the callback.
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
                if (is(w, "Element")) {
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
            const PaperClass = Snap.getClass("Paper");
            return new PaperClass(w, h);
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
                    return Snap.getClass("Element").prototype;
                case "paper":
                    return Snap.getClass("Paper").prototype;
                case "fragment":
                    return Snap.getClass("Fragment").prototype;
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

        let available_types = {};
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
                return (180 + math.atan2(-y, -x) * 180 / PI + 360) % 360;
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
            return math.sin(Snap.rad(angle));
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
            return math.tan(Snap.rad(angle));
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
            return math.cos(Snap.rad(angle));
        };
        /**
         * Snap.asin @method
         *
         * Equivalent to `Math.asin()` only works with degrees, not radians.
         * @param {number} num - value
         * @returns {number} asin in degrees
         */
        Snap.asin = function (num) {
            return Snap.deg(math.asin(num));
        };
        /**
         * Snap.acos @method
         *
         * Equivalent to `Math.acos()` only works with degrees, not radians.
         * @param {number} num - value
         * @returns {number} acos in degrees
         */
        Snap.acos = function (num) {
            return Snap.deg(math.acos(num));
        };
        /**
         * Snap.atan @method
         *
         * Equivalent to `Math.atan()` only works with degrees, not radians.
         * @param {number} num - value
         * @returns {number} atan in degrees
         */
        Snap.atan = function (num) {
            return Snap.deg(math.atan(num));
        };
        /**
         * Snap.atan2 @method
         *
         * Equivalent to `Math.atan2()` only works with degrees, not radians.
         * @param {number} num - value
         * @returns {number} atan2 in degrees
         */
        Snap.atan2 = function (num) {
            return Snap.deg(math.atan2(num));
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
                red = mmin(math.round(red), 255);
                green = mmin(math.round(green), 255);
                blue = mmin(math.round(blue), 255);
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
                const round = math.round;
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
                r = math.round(r * 255);
                g = math.round(g * 255);
                b = math.round(b * 255);
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
                        res.push(["m", 1, 0, math.tan(rad(params[0])), 1, 0, 0]);
                    } else if (name === "skewY") {
                        res.push(["m", 1, math.tan(rad(params[0])), 0, 1, 0, 0]);
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

        // Note: Element, Paper, and Fragment constructors are now defined in their respective class files:
        // - element-class.js defines Element and registers it with Snap.registerClass("Element", Element)
        // - paper-class.js defines Paper and registers it with Snap.registerClass("Paper", Paper)
        // - fragment-class.js defines Fragment and registers it with Snap.registerClass("Fragment", Fragment)
        
        // Note: Element.prototype methods (attr, css, registerRemoveFunction, cleanupAfterRemove, children, toJSON)
        // are now defined in element-class.js
        
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
            const FragmentClass = Snap.getClass("Fragment");
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
            return new FragmentClass(f);
        };

        // Note: Fragment constructor now defined in fragment-class.js
        // and registered with Snap.registerClass("Fragment", Fragment)

        /**
         * Snap.fragment @method
         *
         * Creates a DOM fragment from a given list of elements or strings
         *
         * @param {...any} varargs - SVG string
         * @returns {Fragment} the @Fragment
         */
        Snap.fragment = function () {
            const FragmentClass = Snap.getClass("Fragment");
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
            return new FragmentClass(f);
        };

        function make(name, parent) {
            const res = $(name);
            parent.appendChild(res);
            const el = wrap(res);
            return el;
        }

        // Note: Paper constructor now defined in paper-class.js
        // and registered with Snap.registerClass("Paper", Paper)

        function wrap(dom) {
            if (!dom) {
                return dom;
            }
            const ElementClass = Snap.getClass("Element");
            const FragmentClass = Snap.getClass("Fragment");
            const PaperClass = Snap.getClass("Paper");

            if (dom instanceof ElementClass || dom instanceof FragmentClass) {
                return dom;
            }
            if (dom.tagName && dom.tagName.toLowerCase() === "svg") {
                return new PaperClass(dom);
            }
            if (dom.tagName && dom.tagName.toLowerCase() === "object" &&
                dom.type === "image/svg+xml") {
                return new PaperClass(dom.contentDocument.getElementsByTagName("svg")[0]);
            }
            return new ElementClass(dom);
        }


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

        // Note: Paper.prototype.el method is now defined in paper-class.js
        // Note: Element.prototype.children and toJSON methods (and jsonFiller helper) are now defined in element-class.js

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
           f(Snap, Snap.getClass("Element"), Snap.getClass("Paper"), glob, Snap.getClass("Fragment"), eve);
        };
        root.Snap_ia = Snap;
        root.Snap = root.Snap || Snap;
        return Snap;
    }

    (typeof window !== "undefined" ? window : global)
);

/*
 * Copyright (c) 2013 - 2017 Adobe Systems Incorporated. All rights reserved.
 * Modifications copyright (C) 2019 <Orlin Vakarelov>
 */
Snap_ia.plugin(function (Snap, _Element_, _Paper_, glob, _future_me_, eve) {
    /**
     * Lightweight container representing detached SVG content that can be inserted elsewhere.
     *
     * @class Snap.Fragment
     * @param {DocumentFragment} frag Native document fragment produced by Snap.
     */
    function Fragment(frag) {
        this.node = frag;
    }

    // Register the Fragment class with Snap
    Snap.registerClass("Fragment", Fragment);

    /**
     * Snap.fragment @method
     *
     * Creates a DOM fragment from a given list of elements or strings
     *
     * @param {...any} varargs - SVG string
     * @returns {Fragment} the @Fragment
     */
    Snap.fragment = function () {
        const FragmentClass = Snap.getClass("Fragment");
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
        return new FragmentClass(f);
    };
});

/*
 * Copyright (c) 2018.  Orlin Vakarelov
 */
Snap_ia.plugin(function (Snap, _future_me_, Paper, glob, Fragment, eve) {
        const hub = Snap._.hub;
        const ID = Snap._.id;
        const $ = Snap._.$;
        const has = 'hasOwnProperty';

        /**
         * Element constructor
         * Wraps an SVG element with Snap methods
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
                const PaperClass = Snap.getClass("Paper");
                this.paper = new PaperClass(svg);
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

        // Register the Element class with Snap
        Snap.registerClass("Element", Element);

        const hub_rem = Snap._.hub_rem;
        const elproto = Element.prototype,
            is = Snap.is,
            Str = String,
            unit2px = Snap._unit2px,
            make = Snap._.make,
            getSomeDefs = Snap._.getSomeDefs,
            wrap = Snap._.wrap,
            min = Math.min,
            max = Math.max,
            INITIAL_BBOX = 'initial_bbox';

    /**
     * Computes the minimal bounding box that encloses every box from the provided collection.
     * @param {Snap.BBox[]} bboxes Collection of bounding boxes to merge.
     * @returns {Snap.BBox|undefined} A Snap-ified bounding box describing the union of all input boxes, or
     * `undefined` when no input boxes are provided.
     */
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

    /**
     * Converts a list of points into an axis-aligned bounding box in the current coordinate system.
     * @function
     * @name Snap.bBoxFromPoints
    * @param {Point2DList} points Points that should be enclosed in the resulting bounding box.
     * @param {Snap.Matrix} [matrix] Optional matrix to apply to every point before evaluating the box.
     * @returns {Snap.BBox} Bounding box that contains the transformed point cloud.
     */
    Snap.bBoxFromPoints = boxFromPoints;

    /**
     * Intersects a bounding box with a clip-path region, optionally applying an additional matrix to the clip-path.
     * @param {Snap.BBox|null} box Bounding box to adjust by the clip-path.
     * @param {Element|null} clip_path Clip-path element that constrains the box.
     * @param {Snap.Matrix} [matrix] Transformation applied to the clip-path before the intersection is computed.
     * @returns {Snap.BBox|null} Intersected bounding box or `null` when no box is supplied.
     */
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

    /**
     * Collects representative points for the element's geometry.
     * @param {boolean} [use_local_transform=false] When true, applies the element's local matrix to the returned points.
     * @param {boolean} [skip_hidden=false] When true, ignores children with `display: none`.
    * @returns {Point2DList} Array of points that describe the element footprint.
     */
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

    /**
     * Builds the convex hull for an element, optionally applying its current transform.
     * @param {boolean} [with_transform=false] When true, returns the hull in global coordinates.
     * @param {boolean} [skip_hidden=false] When true, excludes hidden descendants while computing the hull.
    * @returns {(Point2DList|null)} Array of hull vertices ordered clockwise, or `null` for unresolved targets.
     */
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

    /**
     * Resolves the underlying element referenced by a `<use>` node.
     * @returns {Element|null} Resolved target element or `null` when no referenced node is available.
     */
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

    /**
     * Persists the provided matrix on the element instance for subsequent lookups.
     * @param {Snap.Matrix} m Matrix to assign as the element's current transform cache.
     */
    elproto.saveMatrix = function (m) {
            this.matrix = m;
            if (this.type === 'image' && m.f) {
                // console.log("saving matrix", this.getId(), m.toString())
            }
        }

    /**
    * Generates a bounding box from a set of points, optionally applying a matrix prior to evaluation.
    * @param {Point2DList} points Collection of 2D points to enclose.
     * @param {Snap.Matrix} [matrix] Matrix used to transform the points before computing the bounds.
     * @returns {Snap.BBox} Bounding box covering the (transformed) points.
     */
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

    /**
     * Returns the bounding-box descriptor for the current element with optional control over caching, transforms, and
     * clip-path intersection.
     * The returned descriptor exposes the canonical {@link Snap.BBox} API enriched with helper fields such as `cx`,
     * `cy`, `path`, `vb`, and circle radii (`r0`, `r1`, `r2`).
     * @param {boolean|Element|Snap.Matrix|Object} [settings] When `true`, omits the local transform from the answer. A
     * {@link Element} scopes the result relative to an ancestor. A {@link Snap.Matrix} explicitly defines the applied
     * transform. An options object may contain `without_transform`, `cache_bbox`, `include_clip_path`, `approx`,
     * `skip_hidden`, `relative_parent`, `relative_coord`, or `matrix` flags for fine-grained control.
     * @returns {Snap.BBox|null} Bounding-box descriptor or `null` if it can't be resolved (e.g. hidden `<use>` target).
     */
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
                matrix = this.getLocalMatrix();
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

    /**
     * Convenience wrapper around {@link Element#getBBox} that enforces approximate convex-hull evaluation.
     * @param {Object} [setting={}] Optional settings forwarded to {@link Element#getBBox}.
     * @returns {Snap.BBox|null} Approximate bounding box or `null` on failure.
     */
    elproto.getBBoxApprox = function (setting) {
            setting = setting || {};
            setting.approx = true;
            return this.getBBox(setting);
        };
    /**
     * Forces precise bounding-box computation for the element, ignoring cached approximations.
     * @param {boolean|Object|Snap.Matrix} [settigns] Options forwarded to {@link Element#getBBox}.
     * @returns {Snap.BBox|null} Exact bounding box or `null` on failure.
     */
    elproto.getBBoxExact = function (settigns) {
            if (settigns && typeof settigns === 'object' && settigns.isMatrix) {
                return this.getBBox({approx: false, matrix: settigns});
            }
            if (typeof settigns === 'boolean') settigns = {without_transform: settigns};
            settigns = settigns || {};
            settigns.approx = false;
            return this.getBBox(settigns);
        };

    /**
     * Registers or triggers attribute change monitors on the element.
     * @param {string|string[]} attr Attribute name or list of names to monitor.
     * @param {Function} [callback_val] Callback invoked with the attribute's current value when changes occur. When
     * omitted, previously registered callbacks for `attr` are executed immediately.
     * @returns {Element} The current element for chaining.
     */
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

    /**
     * Parses the transform attribute of an element, caching and returning the corresponding matrix.
     * @param {Element} el Element whose transform should be extracted.
     * @param {string|Array|Snap.Matrix} [tstr] Optional transform override in string, array, or matrix form.
     * @returns {Snap.Matrix|undefined} Parsed matrix when no explicit transform is supplied.
     */
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

    /**
     * Strict transform parser that bypasses compatibility heuristics used by {@link extractTransform}.
     * @param {Element} el Element whose transform should be parsed.
     * @param {string|Array|Snap.Matrix} [tstr] Optional transform override.
     * @returns {Snap.Matrix|undefined} Parsed matrix when reading from the DOM.
     */
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

    /**
     * Clears cached convex hull data for the element's ancestors.
     * @param {Element} el Element whose parents should be invalidated.
     * @param {boolean} [efficient=false] When true, stops once an ancestor without cached hull data is found.
     */
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

    /**
     * Clears cached convex hull data for the element and optionally its ancestors.
     * @param {boolean} [force_top=true] Forces invalidation up to the root when truthy.
     */
    elproto.clearCHull = function (force_top) {
            force_top = true;
            this.c_hull = undefined;
            clearParentCHull(this, !force_top);
        }

        /**
         * Element.transform @method
 *
         * Gets or sets transformation of the element
 *
 * @param {string} tstr - transform string in Snap or SVG format
 * @returns {Element} the current element
         * or
 * @returns {object} transformation descriptor:
         o {
         o     string (string) transform string,
         o     globalMatrix (Matrix) matrix of all transformations applied to element or its parents,
         o     localMatrix (Matrix) matrix of transformations applied only to the element,
         o     diffMatrix (Matrix) matrix of difference between global and local transformations,
         o     global (string) global transformation as string,
         o     local (string) local transformation as string,
         o     toString (function) returns `string` property
         o }
         */
    /**
     * Gets or sets the element transform.
     * @param {string|Snap.Matrix} [tstr] Transform string or matrix to apply. When omitted, returns a descriptor with
     * the current transform matrices.
     * @param {boolean} [do_update=false] When true, refreshes cached bounding boxes after applying the transform.
     * @param {Snap.Matrix|boolean} [matrix] Optional matrix used for cache updates or a boolean forwarded as the
     * `apply` flag.
     * @param {boolean} [apply] Internal flag controlling partner propagation.
     * @returns {Element|Object} Element for chaining when setting transforms, or an object with aggregate matrices when
     * querying.
     */
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

    /**
     * Translates a parsed transform token array into a {@link Snap.Matrix} instance.
     * @param {Array} tdata Result from {@link Snap._.svgTransform2string} parsing.
     * @returns {Snap.Matrix} Matrix representing the combined transform.
     */
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

    /**
     * Normalises the element's current transform attribute and saves it as a matrix.
     */
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
                    this.attrMonitor('gradientTransform')
                } else if (this.type === 'pattern') {
                    this.node.setAttribute('patternTransform', m);
                    this.attrMonitor('patternTransform')
                } else {
                    // this.node.setAttribute('transform', m);
                    this.transform(m)
                }
                this.saveMatrix(matrix);
            }
        };

    /**
     * Updates the cached bounding box after a transformation or clears it when the new transform is incompatible.
     * @param {Snap.Matrix} [matrix] Matrix describing the current transformation.
     * @param {boolean|number} [apply] When `-1`, clears the cache entirely. Otherwise controls whether child caches are
     * updated.
     * @param {boolean} [_skip_parent=false] Skips parent cache updates when truthy.
     */
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

    /**
     * Expands cached bounding boxes up the parent chain when the current element grows in size.
     * @param {Snap.BBox|{x:number,y:number,r:number}} bbox_circ Bounding region describing the new extent.
     * @param {boolean} [is_circle=false] Indicates that `bbox_circ` represents a circle definition.
     */
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
    /**
     * Invalidates cached bounding boxes stored on parent elements.
     * @param {Snap.BBox|{x:number,y:number,r:number}} [bbox_circle] Bounding region used to decide whether the parent
     * caches still contain the element.
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

    /**
     * Removes the cached bounding box from the element and, recursively, its children.
     */
    elproto.eraseBBoxCache = function () {
            this.attr({bbox: ''});
            this.removeData(INITIAL_BBOX);
            if (this.isGroupLike()) {
                this.getChildren().forEach(function (el) {
                    el.eraseBBoxCache();
                });
            }
        };

    /**
     * Retrieves the element's local matrix, parsing it from the DOM when not cached.
     * @param {boolean} [strict=false] Enforces strict parsing semantics for the transform attribute.
     * @returns {Snap.Matrix} Local transformation matrix.
     */
    elproto.getLocalMatrix = function (strict) {
            if (this.matrix) return this.matrix;
            if (strict) {
                return extractTransformStrict(this);
            } else {
                return extractTransform(this);
            }
        };

    /**
     * Returns the element's current global transformation matrix using the DOM CTM API.
     * @returns {Snap.Matrix} Global matrix representing the element's absolute transform.
     */
    elproto.getGlobalMatrix = function () {
            const ctm = this.node.getCTM ? this.node.getCTM() : null;
            let matrix = new Snap.Matrix(ctm);
            return matrix;
        }

    /**
     * Registers a DOM or Snap partner that should mirror this element's transformations and style updates.
     * @param {Element|HTMLElement|Object} el_dom Partner reference (Snap element, DOM node, or jQuery-like wrapper).
     * @param {boolean} [strict] Reserved flag for stricter partner synchronisation.
     */
    elproto.setPartner = function (el_dom, strict) {
            if (el_dom.paper && this.paper === el_dom.paper
                // || el_dom instanceof Element
            ) {
                const el_part = this._element_partner || [];

                if (!el_part.includes(el_dom)) {
                    el_part.push(el_dom);
                }
                this._element_partner = el_part;
            } else
                // if (el_dom instanceof HTMLElement || el_dom.css)
                {
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

    /**
     * Updates the registry of partner children when elements are added or removed.
     * @param {Element} el Child element that was added or removed.
     * @param {boolean} [remove=false] Indicates whether the child should be removed from the registry.
     * @returns {Element} Current element for chaining.
     */
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

    /**
     * Propagates transformation updates to partner children.
     * @param {Element} el Partner child receiving the propagated transform.
     * @param {Snap.Matrix} [trans] Matrix to apply; defaults to the current element's global matrix.
     */
    elproto._propagateTransToPartnersChild = function (el, trans) {
            if (!el) return;
            if (trans) {
                let matrix = trans.clone().add(this.getLocalMatrix(true));
                el._applyToPartner(matrix);
            } else {
                el._applyToPartner(this.getGlobalMatrix());
            }
        };

    /**
     * Applies the provided matrix to each registered partner, keeping their transforms aligned.
     * @param {Snap.Matrix} matrix Matrix to propagate.
     */
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


    /**
     * Removes partner associations or optionally deletes the partner nodes themselves.
     * @param {'dom'|'element'|Element|HTMLElement|Snap|boolean} [el_type] Partner type or specific partner reference.
     * @param {boolean} [remove_elements=false] When true, removes the partner elements from the DOM/SVG tree.
     */
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

    /**
     * Determines whether any partners are currently registered with the element.
     * @returns {boolean} True when at least one DOM or Snap partner exists.
     */
    elproto.hasPartner = function () {
            return !!(this._dom_partner || this._element_partner);
        };

    /**
     * Returns registered partners filtered by type.
     * @param {'dom'|'element'|'both'} [el_type] Desired partner category.
     * @returns {Array|Object|undefined} Matching partners or `undefined` when none exist.
     */
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

    /**
     * Applies style updates to registered partners, mirroring key display-related properties.
     * @param {Object} style_obj Style object whose `opacity` and `display` values are forwarded to partners.
     */
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

        /**
         * Returns the element's parent element.
         * @returns {Element} Parent element wrapper.
         */
        elproto.parent = function () {
            return wrap(this.node.parentNode);
        };

        /**
         * Assigns a new paper instance to the element and all of its descendants.
         * @param {Paper} paper Target paper instance.
         * @param {boolean} [force=false] When true, reassigns even if the paper is unchanged.
         * @returns {Element} Current element for chaining.
         */
        elproto.setPaper = function (paper, force) {
            if (!paper instanceof Paper ||
                (!force && this.paper === paper)) return this;

            this.paper = paper;
            this.getChildren().forEach((ch) => ch.setPaper(paper, force));
            return this;
        };

        /**
         * Appends the provided element (or set) to the current element.
         * @param {Element|Set|Array<Element>} el Element, set, or array to append.
         * @returns {Element} Parent element for chaining.
         */
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
    /**
     * Appends the current element to the specified parent.
     * @param {Element} el Parent element that will receive this node.
     * @returns {Element} Child element for chaining.
     */
        elproto.appendTo = function (el) {
            if (el) {
                clearParentCHull(this);
                el = wrap(el);
                el.append(this);
            }
            return this;
        };
    /**
     * Prepends the specified element (or set) to the current element.
     * @param {Element|Set} el Element to prepend.
     * @returns {Element} Parent element for chaining.
     */
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
    /**
     * Prepends this element to the specified parent.
     * @param {Element} el Parent element to receive this node.
     * @returns {Element} Child element for chaining.
     */
        elproto.prependTo = function (el) {
            el = wrap(el);
            el.prepend(this);
            return this;
        };
    /**
     * Inserts the provided element before the current element.
     * @param {Element|Set} el Element to insert.
     * @returns {Element} Parent element for chaining.
     */
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
    /**
     * Inserts the provided element after the current element.
     * @param {Element} el Element to insert.
     * @returns {Element} Parent element for chaining.
     */
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
    /**
     * Inserts the current element before the provided sibling.
     * @param {Element} el Sibling element used as insertion point.
     * @returns {Element} Parent element for chaining.
     */
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
    /**
     * Inserts the current element after the provided sibling.
     * @param {Element} el Sibling element used as insertion reference.
     * @returns {Element} Parent element for chaining.
     */
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
    /**
     * Removes the element from the DOM and detaches partner associations.
     * @returns {Array<Element>} Collection of child elements that were detached alongside this element.
     */
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
    /**
     * Removes all child elements from the DOM.
     */
        elproto.removeChildren = function () {
            this.getChildren().forEach(function (el) {
                el.remove();
            });
            if (this.hasOwnProperty('sub_children')) this.sub_children = [];

            return this;
        };

        /*
         * Element.getChildren
         * @method
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

    /**
     * Determines whether the element contains any non-meta child nodes.
     * @returns {boolean} True when at least one meaningful child exists.
     */
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

        /**
         * Returns the first descendant matching the provided CSS selector.
         * @param {string} query CSS selector compatible with SVG.
         * @returns {Element|null} Wrapped element or `null` when not found.
         */
        elproto.select = function (query) {
            query = replaceNumericIdSelectors(query);
            return wrap(this.node.querySelector(query));
        };
        /**
         * Returns all descendants matching the provided CSS selector.
         * @param {string} query CSS selector compatible with SVG.
         * @returns {Array<Element>|Set} Collection containing all matches.
         */
        elproto.selectAll = function (query) {
            query = replaceNumericIdSelectors(query);
            const nodelist = this.node.querySelectorAll(query),
                set = (Snap.set || Array)();
            for (let i = 0; i < nodelist.length; ++i) {
                set.push(wrap(nodelist[i]));
            }
            return set;
        };

    /**
     * Transforms numeric ID selectors into attribute selectors for SVG compatibility.
     * @param {string} cssQuery Raw CSS selector string.
     * @returns {string} Selector with numeric ID references translated.
     */
    function replaceNumericIdSelectors(cssQuery) {
            // Regular expression to match ID selectors starting with a number
            const regex = /#(\d[\w-]*)/g;

            // Replace each matched ID selector
            const modifiedQuery = cssQuery.replace(regex, (_, id) => `[id="${id}"]`);

            return modifiedQuery;
        }

    /**
     * Resolves an attribute value into pixels.
     * @param {string} attr Attribute name.
     * @param {string|number} [value] Optional raw value; defaults to the current attribute.
     * @returns {number} Attribute value converted to pixels.
     */
        elproto.asPX = function (attr, value) {
            if (value == null) {
                value = this.attr(attr);
            }
            return +unit2px(this, attr, value);
        };
// SIERRA Element.use(): I suggest adding a note about how to access the original element the returned <use> instantiates. It's a part of SVG with which ordinary web developers may be least familiar.
    /**
     * Creates a `<use>` element referencing this element or one matched by the provided selector and appends it.
     * @param {string} [css_ref] CSS reference resolving to an element to clone.
     * @param {number} [x] Optional x-offset applied to the generated `<use>`.
     * @param {number} [y] Optional y-offset applied to the generated `<use>`.
     * @returns {Element|undefined} The newly created `<use>` element, or `undefined` when the selector fails.
     */
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

    /**
     * Normalises IDs within a cloned subtree to avoid collisions.
     * @param {Element} el Root element containing cloned nodes.
     * @param {Function} [id_rename_callback] Callback returning the new ID for a given current ID.
     */
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

    /**
     * Clones the element, optionally hiding it, renaming IDs, or performing a deep `use` expansion.
     * @param {boolean} [hidden] When true, skips inserting the clone into the DOM.
     * @param {Function} [id_rename_callback] Callback used to generate unique IDs for the clone and descendants.
     * @param {boolean} [deep_copy=false] When true, expands `<use>` references into actual nodes.
     * @returns {Element} Cloned element.
     */
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
        /**
         * Determines whether the element behaves like a grouping container.
         * @returns {boolean} True for group-like elements.
         */
        elproto.isGroupLike = function () {
            return !!groupLikeTest[this.type];
        };

        /**
         * Recursively expands `<use>` elements into standalone clones.
         */
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

    /**
     * Moves the element into the shared `<defs>` section.
     * @returns {Element} Current element for chaining.
     */
        elproto.toDefs = function () {
            const defs = getSomeDefs(this);
            defs.appendChild(this.node);
            return this;
        };
    /**
     * Converts the current element into a reusable `<pattern>` definition.
     * @param {number|Object} [x] X coordinate or bounding-box object.
     * @param {number} [y]
     * @param {number} [width]
     * @param {number} [height]
     * @returns {Element} Pattern element that now owns the node.
     */
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

        /**
         * Converts the current element into a `<marker>` definition.
         * @param {number|Object} [x] X coordinate or bounding-box-like descriptor containing marker data.
         * @param {number} [y]
         * @param {number} [width]
         * @param {number} [height]
         * @param {number} [refX]
         * @param {number} [refY]
         * @returns {Element} Marker element referencing the current node.
         */
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
        /**
         * Element.data @method
 *
         * Adds or retrieves given value associated with given key. (Don’t confuse
         * with `data-` attributes)
         *
         * See also @Element.removeData
 * @param {string} key - key to store data
 * @param {any} value - #optional value to store
 * @returns {object} @Element
         * or, if value is not specified:
 * @returns {any} value
         > Usage
         | for (var i = 0, i < 5, i++) {
         |     paper.circle(10 + 15 * i, 10, 10)
         |          .attr({fill: "#000"})
         |          .data("i", i)
         |          .click(function () {
         |             alert(this.data("i"));
         |          });
         | }
         */
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
        /**
         * Element.removeData @method
 *
         * Removes value associated with an element by given key.
         * If key is not provided, removes all the data of the element.
 * @param {string} key - #optional key
 * @returns {object} @Element
         */
        elproto.removeData = function (key) {
            if (key == null) {
                eldata[this.id] = {};
            } else {
                eldata[this.id] && delete eldata[this.id][key];
            }
            return this;
        };
        /**
         * Element.outerSVG @method
 *
         * Returns SVG code for the element, equivalent to HTML's `outerHTML`.
         *
         * See also @Element.innerSVG
 * @returns {string} SVG code for the element
         */
        /**
         * Element.toString @method
 *
         * See @Element.outerSVG
         */
        elproto.outerSVG = elproto.toString = toString(1);
        /**
         * Element.innerSVG @method
 *
         * Returns SVG code for the element's contents, equivalent to HTML's `innerHTML`
 * @returns {string} SVG code for the element
         */
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
        elproto.attr = function (params, value) {
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

        elproto.css = elproto.attr;

        elproto.registerRemoveFunction = function (fun) {
            if (this.id in hub_rem) {
                hub_rem[this.id].push(fun);
            } else {
                hub_rem[this.id] = [fun];
            }
        };

        elproto.cleanupAfterRemove = function () {
            let reg_fun = hub_rem[this.id];
            if (reg_fun) {
                for (let i = 0; i < reg_fun.length; i++) {
                    reg_fun[i](this);
                }
                delete hub_rem[this.id];
            }
        };

        /**
         * Returns all child elements wrapped as Snap elements.
         *
         * @function Snap.Element#children
         * @returns {Array.<Snap.Element>} Array of child elements.
         */
        elproto.children = function () {
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
        elproto.toJSON = function () {
            const out = [];
            jsonFiller([this], out);
            return out[0];
        };

        /**
         * Fragment.select @method
 *
         * See @Element.select
         */
        Fragment.prototype.select = elproto.select;
        /**
         * Fragment.selectAll @method
 *
         * See @Element.selectAll
         */
        Fragment.prototype.selectAll = elproto.selectAll;
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
Snap_ia.plugin(function (Snap, _Element_, _future_me_, glob, _Fragment_, eve) {
    const hub = Snap._.hub;
    const $ = Snap._.$;
    const make = Snap._.make;
    const has = "hasOwnProperty";
    const xmlns = "http://www.w3.org/2000/svg";

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
            defs;
        const proto = Paper.prototype;
        if (w && w.tagName && w.tagName.toLowerCase() === "svg") {
            if (w.snap in hub) {
                return hub[w.snap];
            }
            const doc = w.ownerDocument;
            const ElementClass = Snap.getClass("Element");
            res = new ElementClass(w);
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

    // Register the Paper class with Snap
    Snap.registerClass("Paper", Paper);

    var proto = Paper.prototype,
        is = Snap.is;
    /**
     * Draws a rectangle on the paper.
     *
     * @function Snap.Paper#rect
     * @param {number} x X coordinate of the top-left corner.
     * @param {number} y Y coordinate of the top-left corner.
     * @param {number} width Rectangle width.
     * @param {number} height Rectangle height.
     * @param {number|Array.<number>} [rx] Horizontal radius for rounded corners, or an `[rx, ry]` pair.
     * @param {number} [ry] Vertical radius for rounded corners; defaults to `rx` when omitted.
     * @param {Object} [attr] Attribute map applied to the created element.
     * @returns {Snap.Element} The rectangle element.
     * @example
     * // Regular rectangle
     * paper.rect(10, 10, 50, 50);
     *
     * // Rectangle with rounded corners
     * paper.rect(40, 40, 50, 50, 10);
     */
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

    /**
     * Draws a circle.
     *
     * @function Snap.Paper#circle
     * @param {number} x X coordinate of the centre.
     * @param {number} y Y coordinate of the centre.
     * @param {number} r Circle radius.
     * @param {Object} [attr] Attribute map for the circle element.
     * @returns {Snap.Element} The circle element.
     * @example
     * paper.circle(50, 50, 40);
     */
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

    /**
     * Places an image on the surface.
     *
     * @function Snap.Paper#image
     * @param {string|Object} src Image URL or attribute map containing at least a `src` property.
     * @param {number} [x] Horizontal offset on the paper.
     * @param {number} [y] Vertical offset on the paper.
     * @param {number} [width] Image width.
     * @param {number} [height] Image height.
     * @param {Object} [attr] Additional attributes applied to the element.
     * @returns {Snap.Element} The image element.
     * @example
     * paper.image("apple.png", 10, 10, 80, 80);
     */
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
    /**
     * Draws an ellipse.
     *
     * @function Snap.Paper#ellipse
     * @param {number} x X coordinate of the centre.
     * @param {number} y Y coordinate of the centre.
     * @param {number} rx Horizontal radius.
     * @param {number} ry Vertical radius.
     * @param {Object} [attr] Attribute map for the element.
     * @returns {Snap.Element} The ellipse element.
     * @example
     * paper.ellipse(50, 50, 40, 20);
     */
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
    /**
     * Creates a `<path>` element using the provided SVG path data string.
     * The path data follows standard SVG syntax where single-letter commands are followed by
     * comma- or space-separated numeric arguments (for example, `"M10,20L30,40"`).
     *
     * @function Snap.Paper#path
     * @param {(string|Array|Object)} [pathString] SVG path string, an array of segments, or an
     *        attribute map applied to the created element.
     * @returns {Snap.Element} The resulting path element.
     * @see <a href="http://www.w3.org/TR/SVG/paths.html#PathData">SVG path specification</a>
     * @see <a href="https://developer.mozilla.org/en/SVG/Tutorial/Paths">MDN path tutorial</a>
     * @example
     * // Draw a diagonal line
     * paper.path("M10 10L90 90");
     */
    proto.path = function (d, attr) {
        attr = attr || {};
        if (is(d, "object") && !is(d, "array")) {
            attr = Object.assign(attr, d);
        } else if (d) {
            attr['d'] = d;
        }
        return this.el("path", attr);
    };
    /**
     * Creates an SVG `<g>` element on the paper and optionally nests the supplied elements within it.
     * The last argument may be an attribute map applied to the created group.
     *
     * @function Snap.Paper#g
     * @alias Snap.Paper#def_group
     * @param {...any} elements Elements to append to the group. When the final argument
     *        is a plain object without `type` or `paper` properties, it is treated as the attribute map.
     * @returns {Snap.Element} The group element.
     * @example
     * const circle = paper.circle(10, 10, 5);
     * const rect = paper.rect(0, 0, 20, 20);
     * paper.g(circle, rect);
     */
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
    /**
     * Creates a nested `<svg>` element.
     *
     * @function Snap.Paper#svg
     * @param {number} [x] X coordinate of the embedded SVG.
     * @param {number} [y] Y coordinate of the embedded SVG.
     * @param {number|string} [width] Viewport width.
     * @param {number|string} [height] Viewport height.
     * @param {number} [vbx] ViewBox x origin.
     * @param {number} [vby] ViewBox y origin.
     * @param {number} [vbw] ViewBox width.
     * @param {number} [vbh] ViewBox height.
     * @returns {Snap.Element} The nested SVG element.
     */
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
    /**
     * Creates an SVG `<mask>` element, mirroring the behaviour of {@link Snap.Paper#g}.
     * When a single plain object is supplied, it is treated as the attribute map; otherwise all
     * parameters are added to the mask as children.
     *
     * @function Snap.Paper#mask
     * @param {...any} nodes Elements to include in the mask or a terminating attribute map.
     * @returns {Snap.Element} The mask element.
     */
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
    /**
     * Creates an SVG `<pattern>` element, optionally configuring its position, size, and viewBox.
     *
     * @function Snap.Paper#ptrn
     * @param {number} [x] X coordinate of the pattern.
     * @param {number} [y] Y coordinate of the pattern.
     * @param {number} [width] Width of the pattern tile.
     * @param {number} [height] Height of the pattern tile.
     * @param {number} [vx] ViewBox x origin.
     * @param {number} [vy] ViewBox y origin.
     * @param {number} [vw] ViewBox width.
     * @param {number} [vh] ViewBox height.
     * @param {Object} [attr] Attribute map applied to the pattern.
     * @returns {Snap.Element} The pattern element.
     */
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
    /**
     * Creates an SVG `<use>` element referencing an existing symbol or node.
     *
     * @function Snap.Paper#use
     * @param {(string|Snap.Element|Object)} [id] ID of the element to reference, the element itself,
     *        or an attribute map containing an `id` property. When omitted the method defers to the
     *        {@link Snap.Element#use} behaviour.
     * @param {Object} [attr] Additional attributes applied to the `<use>` element.
     * @returns {Snap.Element} The `<use>` element.
     */
    proto.use = function (id, attr) {
        if (id != null) {
            if (Snap.is(id, "Element")) {
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
            let Element = Snap.getClass("Element");
            return Element && Element.prototype.use.call(this);
        }
    };
    proto.use.skip = true;

    /**
     * Creates an SVG `<symbol>` element.
     *
     * @function Snap.Paper#symbol
     * @param {number} [vbx] ViewBox x origin.
     * @param {number} [vby] ViewBox y origin.
     * @param {number} [vbw] ViewBox width.
     * @param {number} [vbh] ViewBox height.
     * @param {Object} [attr] Additional attributes applied to the symbol.
     * @returns {Snap.Element} The symbol element.
     */
    proto.symbol = function (vx, vy, vw, vh, attr) {
        attr = attr || {};
        if (vx != null && vy != null && vw != null && vh != null) {
            attr.viewBox = [vx, vy, vw, vh];
        }

        return this.el("symbol", attr);
    };
    /**
     * Draws a text string.
     *
     * @function Snap.Paper#text
     * @param {number} x X coordinate of the baseline origin.
     * @param {number} y Y coordinate of the baseline origin.
     * @param {(string|Array.<string>)} text Text content or an array of strings that become nested `<tspan>` elements.
     * @param {Object} [attr] Attribute map for the text element.
     * @returns {Snap.Element} The text element.
     * @example
     * const label = paper.text(50, 50, "Snap");
     * label.attr({textpath: "M10,10L100,100"});
     */
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
    /**
     * Draws a line segment between two points.
     *
     * @function Snap.Paper#line
     * @param {number} x1 Start point X coordinate.
     * @param {number} y1 Start point Y coordinate.
     * @param {number} x2 End point X coordinate.
     * @param {number} y2 End point Y coordinate.
     * @param {Object} [attr] Attribute map for the line element.
     * @returns {Snap.Element} The line element.
     */
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

    /**
     * Draws a polyline through a list of coordinates.
     *
     * @function Snap.Paper#polyline
     * @param {(Array.<number>|...number)} points Coordinate list. Provide either a flat array or individual arguments.
     * @param {Object} [attr] Attribute map applied to the element.
     * @returns {Snap.Element} The polyline element.
     */
    proto.polyline = function (points, attr) {
        attr = point_args(Array.from(arguments));
        return this.el("polyline", attr);
    };


    /**
     * Draws a closed polygon by joining supplied coordinates.
     *
     * @function Snap.Paper#polygon
     * @see Snap.Paper#polyline
     * @param {(Array.<number>|...number)} points Coordinate list as an array or individual numbers.
     * @param {Object} [attr] Attribute map for the polygon element.
     * @returns {Snap.Element} The polygon element.
     */
    proto.polygon = function (points, attr) {
        attr = point_args(Array.from(arguments));
        return this.el("polygon", attr);
    };
// gradients
    (function () {
        var $ = Snap._.$;
        // gradients' helpers
        /**
         * Returns all gradient stop elements.
         *
         * @function Snap.Element#stops
         * @memberof Snap.Element
         * @returns {Snap.Set} Collection of `<stop>` elements.
         */
        function Gstops() {
            return this.selectAll("stop");
        }

        /**
         * Adds a stop to the gradient.
         *
         * @function Snap.Element#addStop
         * @memberof Snap.Element
         * @param {string} color Stop colour.
         * @param {number} offset Stop offset from `0` to `100`.
         * @returns {Snap.Element} The gradient element.
         */
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

    /**
     * Updates gradient stops based on a descriptor string or parsed structure.
     *
     * @function Snap.Element#setStops
     * @memberof Snap.Element
     * @param {(string|Array)} str Gradient descriptor (after the `()` portion) or parsed stops array.
     * @returns {Snap.Element} The gradient element.
     * @example
     * const grad = paper.gradient("l(0, 0, 1, 1)#000-#f00-#fff");
     * grad.setStops("#fff-#000-#f00-#fc0");
     */
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

        /**
         * Creates an SVG gradient element from a descriptor string.
         * The descriptor has the format `<type>(<coords>)<stops>` where `type` is one of `l`, `L`,
         * `r`, or `R` (lowercase for relative coordinates, uppercase for absolute). Coordinates define
         * the gradient line or circle and stops are dash-separated colour values with optional
         * `:offset` suffixes.
         *
         * @function Snap.Paper#gradient
         * @param {string} str Gradient descriptor.
         * @returns {Snap.Element} The gradient element.
         * @example
         * const grad = paper.gradient("l(0, 0, 1, 1)#000-#f00-#fff");
         * paper.circle(50, 50, 40).attr({fill: grad});
         */
        proto.gradient = function (str) {
            return gradient(this.defs, str);
        };
        /**
         * Creates a linear gradient with the given bounding coordinates.
         * @function Snap.Paper#gradientLinear
         * @param {number} x1 Start x coordinate.
         * @param {number} y1 Start y coordinate.
         * @param {number} x2 End x coordinate.
         * @param {number} y2 End y coordinate.
         * @returns {Snap.Element} The linear gradient element.
         */
        proto.gradientLinear = function (x1, y1, x2, y2) {
            return gradientLinear(this.defs, x1, y1, x2, y2);
        };
        /**
         * Creates a radial gradient centred at the supplied coordinates.
         * @function Snap.Paper#gradientRadial
         * @param {number} cx Centre x coordinate.
         * @param {number} cy Centre y coordinate.
         * @param {number} r Radius of the gradient.
         * @param {number} [fx] Optional focal x coordinate.
         * @param {number} [fy] Optional focal y coordinate.
         * @returns {Snap.Element} The radial gradient element.
         */
        proto.gradientRadial = function (cx, cy, r, fx, fy) {
            return gradientRadial(this.defs, cx, cy, r, fx, fy);
        };
    /**
     * Serialises the paper to SVG markup.
     *
     * @function Snap.Paper#toString
     * @returns {string} SVG markup representing the paper.
     */
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
    /**
     * Serialises the paper to a Data URI containing SVG markup.
     *
     * @function Snap.Paper#toDataURL
     * @returns {string} Data URI string for the paper's SVG content.
     */
        proto.toDataURL = function () {
            if (window && window.btoa) {
                return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(this)));
            }
        };
        proto.toDataURL.skip = true;
    /**
     * Removes all child nodes of the paper except its `<defs>` block.
     *
     * @function Snap.Paper#clear
     */
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
    proto.el = function (name, attr) {
        const el = make(name, this.node);
        attr && el.attr(attr);
        return el;
    };

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
})
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
    /**
     * Snap.animation @method *
     * Creates an animation object * * @param {object} attr - attributes of final destination * @param {number} duration - duration of the animation, in milliseconds * @param {function} easing - #optional one of easing functions of @mina or custom one * @param {function} callback - #optional callback function that fires when animation ends * @returns {object} animation object
    */
    Snap.animation = function (attr, ms, easing, callback) {
        return new Animation(attr, ms, easing, callback);
    };
    /**
     * Element.inAnim @method *
     * Returns a set of animations that may be able to manipulate the current element * * @returns {object} in format:
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
     * Snap.animate @method *
     * Runs generic animation of one number into another with a caring function * * @param {number|array} from - number or array of numbers * @param {number|array} to - number or array of numbers * @param {function} setter - caring function that accepts one number argument * @param {number} duration - duration, in milliseconds * @param {function} easing - #optional easing function from @mina or custom * @param {function} callback - #optional callback function to execute when animation ends * @returns {object} animation object in @mina format
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
     * Element.stop @method *
     * Stops all the animations for the current element * * @returns {Element} the current element
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
     * Element.animate @method *
     * Animates the given attributes of the element * * @param {object} attrs - key-value pairs of destination attributes * @param {number} duration - duration of the animation in milliseconds * @param {function} easing - #optional easing function from @mina or custom * @param {function} callback - #optional callback function that executes when the animation ends * @returns {Element} the current element
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

    /**
     * Represents a 2D affine transformation matrix with six coefficients.
     * Accepts individual numeric coefficients, an `SVGMatrix`-like object, a matrix string, or another `Matrix` instance.
     * When invoked without arguments, an identity matrix is produced.
     *
     * @class
     * @alias Snap.Matrix
     * @param {number|SVGMatrix|string|Matrix} [a=1] - Either an existing matrix representation or the `a` component.
     * @param {number} [b=0] - The `b` coefficient when numeric values are provided.
     * @param {number} [c=0] - The `c` coefficient when numeric values are provided.
     * @param {number} [d=1] - The `d` coefficient when numeric values are provided.
     * @param {number} [e=0] - The `e` translation component when numeric values are provided.
     * @param {number} [f=0] - The `f` translation component when numeric values are provided.
     */
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
    /**
     * Multiplies the current matrix on the right by the supplied affine transform.
     * If another {@link Matrix} instance is provided, its coefficients will be applied directly.
     *
     * @param {number|Matrix} a - Either another matrix or the `a` coefficient of the multiplier.
     * @param {number} [b] - The `b` coefficient of the multiplier.
     * @param {number} [c] - The `c` coefficient of the multiplier.
     * @param {number} [d] - The `d` coefficient of the multiplier.
     * @param {number} [e] - The `e` translation component of the multiplier.
     * @param {number} [f] - The `f` translation component of the multiplier.
     * @returns {Matrix} The matrix instance for chaining.
     */
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

    /**
     * Returns a clone of the current matrix multiplied on the right by the supplied transform.
     *
     * @param {number|Matrix} a - Either another matrix or the `a` coefficient of the multiplier.
     * @param {number} [b] - The `b` coefficient of the multiplier.
     * @param {number} [c] - The `c` coefficient of the multiplier.
     * @param {number} [d] - The `d` coefficient of the multiplier.
     * @param {number} [e] - The `e` translation component of the multiplier.
     * @param {number} [f] - The `f` translation component of the multiplier.
     * @returns {Matrix} A new matrix containing the multiplied result.
     */
    matrixproto.plus = function (a, b, c, d, e, f) {
            if (a && a instanceof Matrix) {
                return this.plus(a.a, a.b, a.c, a.d, a.e, a.f);
            }

            return this.clone().add(a, b, c, d, e, f);
        };
    /**
     * Multiplies all affine coefficients by a scalar.
     *
     * @param {number} c - Scalar value applied to each coefficient.
     * @returns {Matrix} The matrix instance for chaining.
     */
    matrixproto.scMult = function (c) {
            this.a *= c;
            this.b *= c;
            this.c *= c;
            this.d *= c;
            this.f *= c;
            this.e *= c;
            return this;
        };
    /**
     * Returns a clone of the matrix scaled by the supplied scalar.
     *
     * @param {number} c - Scalar value applied to each coefficient.
     * @returns {Matrix} A new matrix instance with scaled coefficients.
     */
    matrixproto.timesSc = function (c) {
            return this.clone().scMult(c);
        };
    /**
     * Multiplies the current matrix on the left by the supplied affine transform (pre-multiplication).
     * Accepts a single matrix, an array of matrices, or individual coefficients.
     *
     * @param {number|Matrix|Array<number|Matrix>} a - Matrix, array of matrices, or the `a` coefficient of the multiplier.
     * @param {number} [b] - The `b` coefficient when numeric values are provided.
     * @param {number} [c] - The `c` coefficient when numeric values are provided.
     * @param {number} [d] - The `d` coefficient when numeric values are provided.
     * @param {number} [e] - The `e` translation component when numeric values are provided.
     * @param {number} [f] - The `f` translation component when numeric values are provided.
     * @returns {Matrix} The matrix instance for chaining.
     */
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
        /**
         * Computes the inverse of the affine matrix.
         *
         * @returns {Matrix} A new matrix representing the inverse transform.
         */
        matrixproto.invert = function () {
            var me = this,
                x = me.a * me.d - me.b * me.c;
            return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
        };
        /**
         * Creates an exact copy of the matrix.
         *
         * @returns {Matrix} A new matrix with identical coefficients.
         */
        matrixproto.clone = function () {
            return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
        };
        /**
         * Applies a translation to the matrix.
         *
         * @param {number} x - Horizontal translation distance.
         * @param {number} y - Vertical translation distance.
         * @returns {Matrix} The matrix instance for chaining.
         */
        matrixproto.translate = function (x, y) {
            this.e += x * this.a + y * this.c;
            this.f += x * this.b + y * this.d;
            return this;
        };
        /**
         * Applies a scale transformation to the matrix.
         *
         * @param {number} x - Horizontal scale factor; `1` leaves the axis unchanged.
         * @param {number} [y=x] - Vertical scale factor; defaults to {@link x} when omitted.
         * @param {number} [cx] - Optional horizontal origin around which to scale.
         * @param {number} [cy] - Optional vertical origin around which to scale.
         * @returns {Matrix} The matrix instance for chaining.
         */
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
        /**
         * Applies a rotation to the matrix.
         *
         * @param {number} a - Rotation angle in degrees.
         * @param {number} [x=0] - Horizontal origin around which to rotate.
         * @param {number} [y=0] - Vertical origin around which to rotate.
         * @returns {Matrix} The matrix instance for chaining.
         */
        matrixproto.rotate = function (a, x, y) {
            a = Snap.rad(a);
            x = x || 0;
            y = y || 0;
            var cos = +math.cos(a).toFixed(9),
                sin = +math.sin(a).toFixed(9);
            this.add(cos, sin, -sin, cos, x, y);
            return this.add(1, 0, 0, 1, -x, -y);
        };
        /**
         * Skews the matrix along the x-axis.
         *
         * @param {number} x - Angle, in degrees, to skew along the x-axis.
         * @returns {Matrix} The matrix instance for chaining.
         */
        matrixproto.skewX = function (x) {
            return this.skew(x, 0);
        };
        /**
         * Skews the matrix along the y-axis.
         *
         * @param {number} y - Angle, in degrees, to skew along the y-axis.
         * @returns {Matrix} The matrix instance for chaining.
         */
        matrixproto.skewY = function (y) {
            return this.skew(0, y);
        };
        /**
         * Applies a simultaneous skew transform on both axes.
         *
         * @param {number} [x=0] - Angle, in degrees, to skew along the x-axis.
         * @param {number} [y=0] - Angle, in degrees, to skew along the y-axis.
         * @returns {Matrix} The matrix instance for chaining.
         */
        matrixproto.skew = function (x, y) {
            x = x || 0;
            y = y || 0;
            x = Snap.rad(x);
            y = Snap.rad(y);
            var c = math.tan(x).toFixed(9);
            var b = math.tan(y).toFixed(9);
            return this.add(1, b, c, 1, 0, 0);
        };
        /**
         * Transforms a point and returns its x-coordinate.
         *
         * @param {number} x - Original x-coordinate.
         * @param {number} y - Original y-coordinate.
         * @returns {number} The transformed x-coordinate.
         */
        matrixproto.x = function (x, y) {
            return x * this.a + y * this.c + this.e;
        };
        /**
         * Transforms a point and returns its y-coordinate.
         *
         * @param {number} x - Original x-coordinate.
         * @param {number} y - Original y-coordinate.
         * @returns {number} The transformed y-coordinate.
         */
        matrixproto.y = function (x, y) {
            return x * this.b + y * this.d + this.f;
        };

    /**
     * Applies a pseudo-random translation, rotation, and scaling around an optional origin.
     * Useful for generating varied transforms for effects or automated testing.
     *
     * @param {number} [cx=0] - Horizontal origin for rotation and scaling.
     * @param {number} [cy=0] - Vertical origin for rotation and scaling.
     * @param {boolean} [positive=false] - When `true`, restricts translations to positive offsets.
     * @param {number} [distance=300] - Maximum translation distance along each axis.
     * @param {boolean} [diff_scale=false] - When `true`, allows non-uniform (x/y) scaling.
     * @param {boolean} [skip_rotation=false] - When `true`, prevents random rotation.
     * @param {boolean} [skip_scale=false] - When `true`, prevents random scaling.
     * @returns {Matrix} The matrix instance for chaining.
     */
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

        /**
         * Returns a coefficient of the matrix by index (`0 → a`, `5 → f`).
         *
         * @param {number} i - Index of the coefficient (0-5).
         * @returns {number} The coefficient rounded to nine decimal places.
         */
        matrixproto.get = function (i) {
            return +this[Str.fromCharCode(97 + i)].toFixed(9);
        };
        /**
         * Serialises the matrix into an SVG `matrix(a,b,c,d,e,f)` transform string.
         *
         * @returns {string} SVG transform string representing the matrix.
         */
        matrixproto.toString = function () {
            return "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")";
        };
        /**
         * Returns the translation components (`e`, `f`) rounded to nine decimal places.
         *
         * @returns {number[]} A two-item array `[e, f]`.
         */
        matrixproto.offset = function () {
            return [this.e.toFixed(9), this.f.toFixed(9)];
        };

        /**
         * Compares the matrix with another instance within an optional tolerance.
         *
         * @param {Matrix} m - Matrix to compare against.
         * @param {number} [error] - Optional absolute tolerance per coefficient.
         * @returns {boolean} `true` if all coefficients match within the tolerance.
         */
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
        /**
         * Checks whether the matrix equals the identity transform.
         *
         * @returns {boolean} `true` when all non-identity coefficients are zero.
         */
        matrixproto.isIdentity = function () {
            return this.a === 1 && !this.b && !this.c && this.d === 1 &&
                !this.e && !this.f;
        };

        /**
         * Returns the matrix coefficients as an array `[a, b, c, d, e, f]`.
         *
         * @returns {number[]} Array of the six coefficients.
         */
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

        /**
         * Computes the determinant of the affine matrix.
         *
         * @returns {number} Determinant value (`a * d - b * c`).
         */
        matrixproto.determinant = function () {
            return this.a * this.d - this.b * this.c;
        };
    /**
     * Decomposes the matrix into intuitive primitives (translation, rotation, scale, shear).
     * Optionally records any pre-translation that occurred before the core linear transform.
     *
     * @param {boolean} [add_pre_translation=false] - When `true`, include the pre-translation offset (`px`, `py`).
     * @returns {object} Parts describing the transform.
     * @returns {number} return.dx - Final translation along the x-axis.
     * @returns {number} return.dy - Final translation along the y-axis.
     * @returns {number} [return.px] - Optional pre-translation along the x-axis (only when `add_pre_translation` is `true`).
     * @returns {number} [return.py] - Optional pre-translation along the y-axis (only when `add_pre_translation` is `true`).
     * @returns {number} return.scalex - Scale factor applied along the x-axis. Negative when the matrix mirrors across an axis.
     * @returns {number} return.scaley - Scale factor applied along the y-axis.
     * @returns {number} return.shear - Shear factor that skews the y-axis relative to the x-axis.
     * @returns {number} return.rotate - Rotation in degrees, measured after the scale/shear decomposition.
     * @returns {boolean} return.isSimple - `true` when the matrix can be expressed as translate → rotate → uniform scale (or no rotation).
     * @returns {boolean} return.isSuperSimple - `true` when the matrix is only translate → uniform scale (no rotation or shear).
     * @returns {boolean} return.noRotation - `true` when the matrix has neither rotation nor shear.
     */
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

    /**
     * Provides a lightweight decomposition returning translation, rotation, and scale components.
     *
     * @returns {{dx:number, dy:number, r:number, scalex:number, scaley:number}} Simplified transform description.
     */
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

        /**
         * Serialises the matrix into Snap's short transform string format.
         *
         * @param {object} [shorter] - Optional decomposition result to reuse.
         * @returns {string} A transform string compatible with Snap.svg syntax.
         */
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

        /**
         * Identifies the object as a matrix instance.
         *
         * @returns {boolean} Always returns `true` for matrix instances.
         */
        matrixproto.isMatrix = function () {
            return true;
        }

    /**
     * Computes an affine transform mapping two source points to two destination points.
     *
     * @param {number} x1 - X-coordinate of the first source point.
     * @param {number} y1 - Y-coordinate of the first source point.
     * @param {number} x1Prime - X-coordinate of the first destination point.
     * @param {number} y1Prime - Y-coordinate of the first destination point.
     * @param {number} x2 - X-coordinate of the second source point.
     * @param {number} y2 - Y-coordinate of the second source point.
     * @param {number} x2Prime - X-coordinate of the second destination point.
     * @param {number} y2Prime - Y-coordinate of the second destination point.
     * @returns {Matrix} A new matrix performing the inferred transform.
     */
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

        /**
         * Conjugates an affine transform by a base matrix (`base * m * base^{-1}`).
         *
         * @param {Matrix} m - Matrix to conjugate.
         * @param {Matrix} base - Base matrix providing the reference frame.
         * @returns {Matrix} The conjugated matrix.
         * @private
         */
        function rightLeftFlipMatrix(m, base) {
            let inv = base.clone().invert();
            return base.clone().multRight(m).multRight(inv);
        }

        /**
         * Splits a matrix into translation/scale and rotation/shear factors.
         *
         * @param {Matrix} [m=this] - Matrix to decompose.
         * @returns {{0:Matrix, 1:Matrix, trans_scale:Matrix, rot_shear:Matrix, scalex:number, scaley:number, rotate:number, shear:number, dx:number, dy:number}} Matrices and scalars describing the decomposition.
         */
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
    /**
     * Exposes the {@link Matrix} constructor on the `Snap` namespace.
     *
    * @type {Function}
     */
    Snap.Matrix = Matrix;
    /**
     * Factory helper mirroring the {@link Matrix} constructor signature.
     *
     * @param {number|SVGMatrix|string|Matrix} [a] - Either an existing matrix representation or the `a` coefficient.
     * @param {number} [b] - The `b` coefficient when numeric values are provided.
     * @param {number} [c] - The `c` coefficient when numeric values are provided.
     * @param {number} [d] - The `d` coefficient when numeric values are provided.
     * @param {number} [e] - The `e` translation component when numeric values are provided.
     * @param {number} [f] - The `f` translation component when numeric values are provided.
     * @returns {Matrix} A new matrix instance.
     */
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
    /**
     * Snap.deurl @method
 *
     * Unwraps path from `"url(<path>)"`.
 * @param {string} value - url path
 * @returns {string} unwrapped path
    */
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
            const ElementClass = Snap.getClass("Element");
            var clip,
                node = value.node;
            while (node) {
                if (node.nodeName === "clipPath") {
                    clip = new ElementClass(node);
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
        /**
         * Element.addClass @method *
         * Adds given class name or list of class names to the element. * @param {string} value - class name or space separated list of class names * * @returns {Element} original element.
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
             * Element.removeClass @method *
             * Removes given class name or list of class names from the element. * @param {string} value - class name or space separated list of class names * @param {boolean} prefix - if true, removes all classes that start with the given class name * * @returns {Element} original element.
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
         * Element.hasClass @method *
         * Checks if the element has a given class name in the list of class names applied to it. * @param {string} value - class name * * @returns {boolean} `true` if the element has given class
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
         * Element.toggleClass @method *
         * Add or remove one or more classes from the element, depending on either
         * the class’s presence or the value of the `flag` argument. * @param {string} value - class name or space separated list of class names * @param {boolean} flag - value to determine whether the class should be added or removed * * @returns {Element} original element.
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

/*
 * Copyright (c) 2018.  Orlin Vakarelov
 */
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {

    /**
     * Snap.svg plugin augmenting the library with a {@link BBox} helper type and
     * related geometry utilities for working with rectangular bounds.
     *
     * @namespace Snap.bbox
     */

    const abs = Math.abs;
    const p2s = /,?([a-z]),?/gi;

    /**
     * Converts an array-based path representation into a compact string.
     *
     * @param {Array} [path=this]
     *        Sequence of path commands (as produced by Snap.svg helpers).
     * @returns {string}
     *          SVG path data string.
     */
    function toString(path) {
        path = path || this;
        return path.join(',').replace(p2s, '$1');
    }

    /**
     * Generates the path command array describing a rectangle.
     *
     * @param {number} x The rectangle's top-left x coordinate.
     * @param {number} y The rectangle's top-left y coordinate.
     * @param {number} w The rectangle's width.
     * @param {number} h The rectangle's height.
     * @param {number} [rx]
     *        Optional corner radius on the x axis for rounded corners.
     * @param {number} [ry=rx]
     *        Optional corner radius on the y axis when different from `rx`.
     * @returns {Array}
     *          Snap-compatible path command list describing the rectangle.
     */
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

    /**
     * Represents an axis-aligned bounding box and offers utility methods to
     * interrogate and transform it.
     *
     * @class
     * @param {(number|Array|Object|null)} x
     *        Top-left x coordinate, array form `[x, y, width, height]`, an object
     *        with positional fields, or `null` to produce an empty box.
     * @param {number} [y]
     *        Top-left y coordinate when `x` is numeric.
     * @param {number} [width]
     *        Width when `x` is numeric.
     * @param {number} [height]
     *        Height when `x` is numeric.
     */
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

    /**
     * Creates a shallow copy of the bounding box.
     *
     * @returns {BBox}
     *          New instance with identical coordinates and dimensions.
     */
    BBox.prototype.clone = function () {
        return new BBox(this.x, this.y, this.width, this.height);
    };

    /**
     * Returns the radius of the largest circle that fits inside the box.
     *
     * @returns {number}
     *          Half of the shortest side length.
     */
    BBox.prototype.r1 = function () {
        return Math.min(this.width, this.height) / 2;
    };

    /**
     * Returns the radius of the smallest circle that fully contains the box.
     *
     * @returns {number}
     *          Half of the longest side length.
     */
    BBox.prototype.r2 = function () {
        return Math.max(this.width, this.height) / 2;
    };

    /**
     * Returns the radius of the circle covering the box's diagonal.
     *
     * @returns {number}
     *          Half the diagonal length.
     */
    BBox.prototype.r0 = function () {
        return Math.sqrt(this.width * this.width + this.height * this.height) / 2;
    };

    /**
     * Computes the full diagonal length of the box.
     *
     * @returns {number}
     *          Distance between the top-left and bottom-right corners.
     */
    BBox.prototype.diag = function () {
        return Math.sqrt(this.width * this.width + this.height * this.height);
    };

    /**
     * Expands the box by the supplied border amounts.
     *
     * @param {(number|Array|Object)} [border=0]
     *        Uniform numeric padding, tuple `[x, y, x2, y2]`, or object literal
     *        with per-side offsets.
     * @param {boolean} [get_new=false]
     *        When `true`, a new expanded {@link BBox} is returned.
     * @returns {BBox}
     *          The mutated box or the newly created instance.
     */
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

    /**
     * Produces a rectangle path description matching the bounds.
     *
     * @returns {Array}
     *          Array of Snap path commands outlining the box.
     */
    BBox.prototype.path = function () {
        return rectPath(this.x, this.y, this.width, this.height);
    };

    /**
     * Draws the bounding box on the supplied paper instance.
     *
     * @param {Snap.Paper} paper Destination paper to receive the rectangle.
     * @param {(number|Object|Array)} [radius]
     *        Corner radius or `{rx, ry}`/array form for rounded corners.
     * @param {(number|Array|Object)} [border]
     *        Optional expansion applied before drawing.
     * @returns {Snap.Element}
     *          The created rectangle element.
     */
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

    /**
     * Serialises the box to an SVG viewBox string.
     *
     * @returns {string}
     *          Space separated `x y width height` representation.
     */
    BBox.prototype.vb = function () {
        return [this.x, this.y, this.width, this.height].join(' ');
    };

    /**
     * Returns the aspect ratio of the box.
     *
     * @returns {number}
     *          Width divided by height.
     */
    BBox.prototype.ration = function () {
        return this.width / this.height;
    };

    /**
     * Tests whether the box fully contains another box or point.
     *
    * @param {(BBox|BoundsLike|Array.<number>)} bbox_or_point
     *        Target bounds or point to evaluate.
     * @param {number} [clearance=0]
     *        Optional tolerance applied to the container box.
     * @returns {boolean}
     *          `true` when the target lies completely inside the bounds.
     */
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

    /**
     * Tests whether the box completely contains a circle.
     *
    * @param {Circle} circle Circle descriptor.
     * @returns {boolean}
     *          `true` when the circle fits within the bounds.
     */
    BBox.prototype.containsCircle = function (circle) {
        return this.x <= circle.x - circle.r && this.y <= circle.y - circle.r &&
            this.x2 >= circle.x + circle.r && this.y2 >= circle.y + circle.r;
    };

    /**
     * Returns the geometric centre of the box.
     *
    * @returns {Point2D}
     *          Center point coordinates.
     */
    BBox.prototype.center = function () {
        return {x: this.cx, y: this.cy};
    };

    /**
     * Retrieves a corner point by index.
     *
     * @param {number} [count=0]
     *        Corner index where 0=top-left, 1=top-right, 2=bottom-right, 3=bottom-left.
    * @returns {Point2D}
     *          The requested corner coordinates.
     */
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

    /**
     * Looks up a named anchor point on the box.
     *
     * @param {string} name Named location (e.g. `c`, `tl`, `rc`).
    * @returns {(Point2D|null)}
     *          The resolved point or `null` when unknown.
     */
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

    /**
     * Computes the overlapping region between this box and another.
     *
     * @param {BBox|Object} box Other box-like descriptor.
     * @returns {BBox|null}
     *          Intersection bounds, empty box, or `null` when input is falsy.
     */
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

    /**
     * Checks whether another box overlaps the current bounds.
     *
     * @param {BBox|Object} box Other box-like descriptor.
     * @returns {boolean}
     *          `true` when the two boxes share any overlapping area.
     */
    BBox.prototype.isOverlap = function (box) {
        if (!box) return false;

        const x = Math.max(this.x, box.x),
            y = Math.max(this.y, box.y),
            x2 = Math.min(this.x2, box.x2),
            y2 = Math.min(this.y2, box.y2);

        return x < x2 && y < y2;

    }

    /**
     * Computes the smallest box that contains both this and another box.
     *
     * @param {BBox|Object} box Other box-like descriptor.
     * @returns {BBox}
     *          Bounding box covering both inputs.
     */
    BBox.prototype.union = function (box) {
        if (!box) return this;
        const x = Math.min(this.x, box.x),
            y = Math.min(this.y, box.y),
            x2 = Math.max(this.x2, box.x2),
            y2 = Math.max(this.y2, box.y2);

        return new BBox(x, y, x2 - x, y2 - y);
    };

    /**
     * Moves the box so that its top-left corner is at the provided coordinates.
     *
     * @param {number} x New top-left x coordinate.
     * @param {number} y New top-left y coordinate.
     * @returns {BBox}
     *          The mutated box instance.
     */
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
     * Translates the box by the supplied offsets.
     *
     * @param {(number|Snap.Matrix)} x X offset or matrix whose translation
     *        components will be applied.
     * @param {number} [y]
     *        Y offset when `x` is numeric.
     * @returns {BBox}
     *          The mutated box instance.
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
     * Scales the box around an anchor point.
     *
     * @param {number} sx Scale factor along the x axis.
     * @param {number} [sy=sx] Scale factor along the y axis.
     * @param {number} [cx=this.x]
     *        X coordinate of the pivot point.
     * @param {number} [cy=this.y]
     *        Y coordinate of the pivot point.
     * @returns {BBox}
     *          The mutated box instance.
     */
    BBox.prototype.scale = function (sx, sy, cx, cy) {
        if (sy == null) sy = sx;
        if (cx == null) cx = this.x;
        if (cy == null) cy = this.y;
        this.w = this.width *= sx;
        this.h = this.height *= sy;

        this.x = cx - (cx - this.x) * sx;
        this.y = cy - (cy - this.y) * sy;
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;
        this.cx = this.x + this.width / 2;
        this.cy = this.y + this.height / 2;

        return this;
    }

    /**
     * Returns the bounding box itself (Snap.svg compatibility helper).
     *
     * @returns {BBox}
     *          The current instance.
     */
    BBox.prototype.getBBox = function () {
        return this;
    };

    /**
     * Computes the bounds required to contain the box rotated by the given angle.
     *
     * @param {number} angle Rotation angle in degrees.
     * @returns {BBox}
     *          New box covering the rotated area. Includes `old_corner`
     *          metadata describing the original top-left location.
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

    /**
     * Normalises input values into a {@link BBox} instance.
     *
     * @param {(BBox|Array|Object|number)} x
     *        Either an existing {@link BBox}, tuple, bounds object or x coordinate.
     * @param {number} [y]
     *        Y coordinate when numeric values are provided.
     * @param {number} [width]
     *        Width when numeric values are provided.
     * @param {number} [height]
     *        Height when numeric values are provided.
     * @returns {BBox}
     *          Prepared bounding box instance.
     */
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

    Snap._.box = box; //for backward compatibility
    Snap.box = box;
    Snap.BBox = BBox;
    Snap._.BBox = BBox;
    Snap.registerType('bbox', BBox);

});

/**
 * @fileoverview SVG Path manipulation and analysis library
 * Copyright (c) 2018. Orlin Vakarelov
 * 
 * This module provides comprehensive SVG path manipulation, analysis, and geometric operations.
 * It includes functions for path parsing, transformation, intersection detection, length calculations,
 * point sampling, and various path-related geometric computations.
 * 
 * @typedef {Object} PathSegment
 * @property {String} type - Segment type (M, L, C, Q, A, Z, etc.)
 * @property {Array<Number>} args - Segment arguments/coordinates
 * 
 * @typedef {Array<PathSegment>} PathArray
 * Array representation of an SVG path
 * 
 * @typedef {Object} PointOnPath
 * @property {Number} x - X coordinate
 * @property {Number} y - Y coordinate
 * @property {Number} [alpha] - Tangent angle at point
 * @property {Number} [t] - Parametric position (0-1)
 */

/*
 * Copyright (c) 2018.  Orlin Vakarelov
 */
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {

    const ERROR = 1e-12;

    const BBox = Snap.BBox || Snap._.BBox;
    const box = Snap.box || Snap._.box;

    if (!BBox || !box) {
        throw new Error('Snap BBox extension must be loaded before the path extension.');
    }

//Snap begins here
    /**
     * Converts transform string to matrix with strict parsing (only matrix transforms)
     * @function Snap._.transform2matrixStrict
     * @param {String} tstr - Transform string
     * @returns {Snap.Matrix} Matrix representation of the transform
     */
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

    /**
     * Caches path parsing results for performance
     * @function paths
     * @private
     * @param {String} ps - Path string to cache
     * @returns {Object} Cache object for the path
     */
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

    /**
     * Converts path array to string representation
     * @function toString
     * @private
     * @param {PathArray} path - Path array to convert
     * @returns {String} String representation of the path
     */
    function toString(path) {
        path = path || this;
        return path.join(',').replace(p2s, '$1');
    }

    /**
     * Creates a deep clone of a path array with toString method
     * @function pathClone
     * @private
     * @param {PathArray} pathArray - Path array to clone
     * @returns {PathArray} Cloned path array
     */
    function pathClone(pathArray) {
        const res = clone(pathArray);
        res.toString = toString;
        return res;
    }

    /**
     * Gets point at specified length along a Bézier curve segment or calculates segment length
     * @function getPointAtSegmentLength
     * @private
     * @param {Number} p1x - Start point x coordinate
     * @param {Number} p1y - Start point y coordinate  
     * @param {Number} c1x - First control point x coordinate
     * @param {Number} c1y - First control point y coordinate
     * @param {Number} c2x - Second control point x coordinate
     * @param {Number} c2y - Second control point y coordinate
     * @param {Number} p2x - End point x coordinate
     * @param {Number} p2y - End point y coordinate
     * @param {Number} [length] - Length along curve. If null, returns total length
     * @returns {Number|PointOnPath} Length or point at specified length
     */
    function getPointAtSegmentLength(
        p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length) {
        if (length == null) {
            return bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
        } else {
            return findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y,
                getTotLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length));
        }
    }

    /**
     * Factory function for creating length calculation functions
     * @function getLengthFactory
     * @param {Boolean} istotal - Whether to calculate total length
     * @param {Boolean} subpath - Whether to handle subpaths
     * @returns {Function} Length calculation function
     */
    function getLengthFactory(istotal, subpath) {
        /**
         * Rounds a value to 3 decimal places
         * @function O
         * @param {Number} val - Value to round
         * @returns {Number} Rounded value
         */
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

    /**
     * Calculates point and tangent information at parameter t on a Bézier curve
     * @function findDotsAtSegment
     * @private
     * @param {Number} p1x - Start point x coordinate
     * @param {Number} p1y - Start point y coordinate
     * @param {Number} c1x - First control point x coordinate
     * @param {Number} c1y - First control point y coordinate
     * @param {Number} c2x - Second control point x coordinate
     * @param {Number} c2y - Second control point y coordinate
     * @param {Number} p2x - End point x coordinate
     * @param {Number} p2y - End point y coordinate
     * @param {Number} t - Parameter value (0-1)
     * @param {Boolean} [point_only] - If true, returns only x,y coordinates
     * @returns {PointOnPath} Point with coordinates, control points, and tangent angle
     */
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

    /**
     * Calculates bounding box of a Bézier curve
     * @function bezierBBox
     * @private
     * @param {Number} p1x - Start point x coordinate
     * @param {Number} p1y - Start point y coordinate
     * @param {Number} c1x - First control point x coordinate
     * @param {Number} c1y - First control point y coordinate
     * @param {Number} c2x - Second control point x coordinate
     * @param {Number} c2y - Second control point y coordinate
     * @param {Number} p2x - End point x coordinate
     * @param {Number} p2y - End point y coordinate
     * @returns {BBox} Bounding box of the curve
     */
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

    /**
     * Tests if a point is inside a bounding box
     * @function isPointInsideBBox
     * @private
     * @param {BBox} bbox - Bounding box to test
     * @param {Number} x - Point x coordinate
     * @param {Number} y - Point y coordinate
     * @returns {Boolean} True if point is inside the bounding box
     */
    function isPointInsideBBox(bbox, x, y) {
        return x >= bbox.x &&
            x <= bbox.x + bbox.width &&
            y >= bbox.y &&
            y <= bbox.y + bbox.height;
    }

    /**
     * Tests if two bounding boxes intersect
     * @function isBBoxIntersect
     * @private
     * @param {BBox} bbox1 - First bounding box
     * @param {BBox} bbox2 - Second bounding box
     * @returns {Boolean} True if bounding boxes intersect
     */
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

    /**
     * Calculates cubic Bézier curve derivative at parameter t
     * @function base3
     * @private
     * @param {Number} t - Parameter value (0-1)
     * @param {Number} p1 - First control value
     * @param {Number} p2 - Second control value
     * @param {Number} p3 - Third control value
     * @param {Number} p4 - Fourth control value
     * @returns {Number} Derivative value at parameter t
     */
    function base3(t, p1, p2, p3, p4) {
        const t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
            t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
        return t * t2 - 3 * p1 + 3 * p2;
    }

    /**
     * Calculates length of a Bézier curve from start to parameter z
     * @function bezlen
     * @private
     * @param {Number} x1 - Start point x coordinate
     * @param {Number} y1 - Start point y coordinate
     * @param {Number} x2 - First control point x coordinate
     * @param {Number} y2 - First control point y coordinate
     * @param {Number} x3 - Second control point x coordinate
     * @param {Number} y3 - Second control point y coordinate
     * @param {Number} x4 - End point x coordinate
     * @param {Number} y4 - End point y coordinate
     * @param {Number} [z=1] - Parameter value (0-1)
     * @returns {Number} Length of curve segment
     */
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

    /**
     * Converts path element to array representation with optional curve expansion
     * @method Element.toPathArray
     * @param {Boolean} [expand_only] - If true, only expands arcs and curves without converting to absolute
     * @param {Boolean} [process_arc] - If true, processes arc segments
     * @returns {PathArray} Array representation of the path
     */
    elproto.toPathArray = function (expand_only, process_arc) {
        if (this.type !== "path") return [];
        return path2curve(this, undefined, expand_only, process_arc);
    }

    /**
     * Gets the number of path segments after curve conversion
     * @method Element.getNumberPathSegments
     * @returns {Number} Number of path segments
     */
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

    /**
     * Returns the length of the given path in pixels
     * @method getTotalLength
     * @memberof Snap.path
     * @param {string} path - SVG path string
     * @returns {number} length
     */
    Snap.path.getTotalLength = getTotalLength;
    /**
     * Returns the coordinates of the point located at the given length along the given path
     * @method getPointAtLength
     * @memberof Snap.path
     * @param {string} path - SVG path string
     * @param {number} length - length, in pixels, from the start of the path, excluding non-rendering jumps
     * @returns {object} representation of the point:
     * @returns {number} returns.x - x coordinate
     * @returns {number} returns.y - y coordinate
     * @returns {number} returns.alpha - angle of derivative
     */
    Snap.path.getPointAtLength = getPointAtLength;
    /**
     * Returns the subpath of a given path between given start and end lengths
     * @method getSubpath
     * @memberof Snap.path
     * @param {string} path - SVG path string
     * @param {number} from - length, in pixels, from the start of the path to the start of the segment
     * @param {number} to - length, in pixels, from the start of the path to the end of the segment
     * @returns {string} path string definition for the segment
     */
    Snap.path.getSubpath = function (path, from, to) {
        if (this.getTotalLength(path) - to < 1e-6) {
            return getSubpathsAtLength(path, from).end;
        }
        const a = getSubpathsAtLength(path, to, 1);
        return from ? getSubpathsAtLength(a, from).end : a;
    };

    /**
     * Converts an element to a path representation
     * @method toPath
     * @memberof Snap.path
     * @param {Element} el - Element to convert to path
     * @param {boolean} string_only - If true, returns only the path string, otherwise returns a path element
     * @returns {string|Element} Path string or path element depending on string_only parameter
     */
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

    /**
     * Checks if a path contains compound segments (multiple move commands)
     * @method isCompound
     * @memberof Snap.path
     * @param {string|Array|Element} path - Path string, path array, or path element
     * @returns {boolean} True if path has multiple move commands
     */
    Snap.path.isCompound = isCompound;

    /**
     * Checks if the eleme if compoubt
     * @type {isCompound}
     */
    elproto.isCompound = isCompound;

    elproto.getControlPoints = getControlPoints;
    /**
     * Gets control points for path segments
     * @method getControlPoints
     * @memberof Snap.path
     * @param {string|Array|Element} path - Path string, path array, or path element
     * @returns {Array} Array of control point coordinates
     */
    Snap.path.getControlPoints = getControlPoints;

    elproto.isPolygon = isPolygon;
    /**
     * Checks if a path represents a closed polygon
     * @method isPolygon
     * @memberof Snap.path
     * @param {string|Array|Element} path - Path string, path array, or path element
     * @returns {boolean} True if path is a closed polygon
     */
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

    /**
     * Splits a compound path into individual path segments
     * @method getCompoundSegments
     * @memberof Snap.path
     * @param {string|Array|Element} path - Path string, path array, or path element
     * @returns {Array} Array of individual path segments
     */
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

    /**
     * Element.getTotalLength @method
 *
     * Returns the length of the path in pixels (only works for `path` elements)
 * @returns {number} length
     */
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
    /**
     * Element.getPointAtLength @method
 *
     * Returns coordinates of the point located at the given length on the given path (only works for `path` elements)
 *
 * @param {number} length - length, in pixels, from the start of the path, excluding non-rendering jumps
 *
 * @returns {object} representation of the point:
     o {
     o     x: (number) x coordinate,
     o     y: (number) y coordinate,
     o     alpha: (number) angle of derivative
     o }
     */
    elproto.getPointAtLength = function (length) {
        {
            let path_str = getPath[this.type](this);
            return getPointAtLength(path_str, length);
        }
    };

    /**
     * Gets the point at a parametric value along the path
     * @method Element.getPointAt
     * @param {Number} t - Parametric value between 0 and 1
     * @returns {PointOnPath} Point coordinates and angle at parameter t
     */
    elproto.getPointAt = function (t) {
        t = Math.max(Math.min(1, t), 0);
        return this.getPointAtLength(t * this.getTotalLength());
    };

    /**
     * Reverses a path segment
     * @function reverse_seg
     * @param {Array} seg - Path segment to reverse
     * @returns {Array} Reversed path segment
     */
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

    /**
     * Reverses the direction of a path, polygon, or polyline
     * @method Element.reverse
     * @returns {Element} Element for chaining
     */
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
    /**
     * Element.getSubpath @method
 *
     * Returns subpath of a given element from given start and end lengths (only works for `path` elements)
 *
 * @param {number} from - length, in pixels, from the start of the path to the start of the segment
 * @param {number} to - length, in pixels, from the start of the path to the end of the segment
     * Extracts a substring from a path definition based on start and end positions
     * @method Element.getSubpath
     * @param {number} from - Start position as percentage (0-1) of total path length
     * @param {number} to - End position as percentage (0-1) of total path length
     * @returns {string} Path string definition for the extracted segment
     */
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

    /**
     * Describes a single anchor point within a path segment, including the
     * control handles that precede and follow it.
     *
     * @param {{x:number,y:number}|PathPoint} center
     *        The anchor point position, or an existing {@link PathPoint} to clone.
     * @param {{x:number,y:number}} [before]
     *        Handle leading into the point (a.k.a. the "previous" handle).
     * @param {{x:number,y:number}} [after]
     *        Handle exiting the point (a.k.a. the "next" handle).
     * @param {string} [ending]
     *        Optional ending flag describing how the point terminates a segment.
     */
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

    /**
     * Determines the type of a path point based on its control handles
     * @method getPointType
     * @memberof Snap.path
     * @param {Object} c - Center point coordinates
     * @param {Object} a - After control handle
     * @param {Object} b - Before control handle
     * @returns {string} Point type: 'corner', 'smooth', or 'symmetric'
     */
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

    /**
     * Annotates a collection of {@link PathPoint}s with arc-length metadata.
     *
     * @param {PathPoint[]} pathPoints
     *        Ordered list of points describing the path.
     * @param {Snap.PolyBezier[]|Array} [beziers]
     *        Optional cached Bézier segments. When omitted they are recomputed.
     * @param {boolean} [close=false]
     *        When `true`, a synthetic closing point mirroring the first anchor is appended.
     * @param {Object} [data]
     *        Extra key/value pairs replicated onto each point for downstream consumers.
     */
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
     * Recomputes tangent handles to smooth the curve through a {@link PathPoint}.
     * @method smoothCorner
     * @memberof Snap.path
     * @param {{x:number,y:number}} center
     *        The anchor to be smoothed.
     * @param {{x:number,y:number}} after
     *        The outgoing handle from the anchor.
     * @param {{x:number,y:number}} before
     *        The incoming handle to the anchor.
     * @param {boolean} [symmetric=false]
     *        When `true`, both handles are forced to be symmetric.
     * @param {boolean} [modify_points=false]
     *        When `true`, the original handle objects are mutated in place.
     * @returns {(Array|undefined)}
     *          Returns `[new_after, new_before]` unless `modify_points` is `true`, in which case the handles are mutated and `undefined` is returned.
     * @todo Implement auto-smooth heuristics similar to Inkscape.
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

    /**
     * Generates {@link PathPoint} descriptors for the element's path data.
     *
     * @returns {PathPoint[]}
     *          Ordered points enriched with control handles and segment metadata.
     */
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

    /**
     * Builds cubic Bézier curve descriptions from path analysis points.
     *
     * When called with no arguments, it will attempt to call `getSegmentAnalysis()`
     * on the current context (`this`). Passing a truthy non-array first argument is
     * treated as the `segmented` flag, matching the legacy API behaviour.
     *
     * @param {(PathPoint[]|{getSegmentAnalysis:Function}|boolean)} [anals]
     *        Optional segment analysis result or boolean shorthand for `segmented`.
     * @param {boolean} [segmented=false]
     *        When `true`, the returned array is chunked per logical path segment.
     * @returns {Array<Array|Object>|undefined}
     *          An array of cubic Bézier descriptors, or nested arrays when segmented.
     */
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

    /**
     * Converts path to array of Bézier curves
     * @method Element.toBeziers
     * @param {Boolean} [segmented] - If true, returns segmented curves
     * @returns {Array} Array of Bézier curve definitions
     */
    elproto.toBeziers = toBeziers;
    /**
     * Converts path to array of Bézier curves
     * @method toBeziers
     * @memberof Snap.path
     * @param {string|Array} path - Path string or path array
     * @param {Boolean} [segmented] - If true, returns segmented curves
     * @returns {Array} Array of Bézier curve definitions
     */
    Snap.path.toBeziers = toBeziers

    /**
     * Converts the current path element into a {@link Snap.polyBezier} instance.
     * @method Element.toPolyBezier
     * @returns {Snap.PolyBezier} A poly-bézier representation of the element suitable for tessellation
     */
    elproto.toPolyBezier = function () {
        return Snap.polyBezier(this.toBeziers());
    };

    /**
     * Computes a cubic Bézier curve that interpolates four third-points.
     *
     * @param {{x:number,y:number}} p1 The start point of the curve.
     * @param {{x:number,y:number}} p2 The first interior control point.
     * @param {{x:number,y:number}} p3 The second interior control point.
     * @param {{x:number,y:number}} p4 The end point of the curve.
     * @returns {Array<{x:number,y:number}>}
     *          Array describing the resulting cubic Bézier points.
     */
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

    /**
     * Creates cubic Bézier control points from three intermediate points
     * @method cubicFromThirdPoints
     * @memberof Snap.path
     * @param {Object} p1 - Start point
     * @param {Object} p2 - First intermediate point
     * @param {Object} p3 - Second intermediate point
     * @param {Object} p4 - End point
     * @returns {Array} Array of cubic Bézier control points
     */
    Snap.path.cubicFromThirdPoints = cubicFromThirdPoints;

    Snap._.box = box; //for backward compatibility
    Snap.box = box;

    Snap.registerType("bbox", BBox)

    /**
     * Finds dot coordinates on the given cubic beziér curve at the given t
     * @method findDotsAtSegment
     * @memberof Snap.path
     * @param {number} p1x - x of the first point of the curve
     * @param {number} p1y - y of the first point of the curve
     * @param {number} c1x - x of the first anchor of the curve
     * @param {number} c1y - y of the first anchor of the curve
     * @param {number} c2x - x of the second anchor of the curve
     * @param {number} c2y - y of the second anchor of the curve
     * @param {number} p2x - x of the second point of the curve
     * @param {number} p2y - y of the second point of the curve
     * @param {number} t - position on the curve (0..1)
     * @returns {object} point information including coordinates and anchor points
     * @returns {number} returns.x - x coordinate of the point
     * @returns {number} returns.y - y coordinate of the point
     * @returns {object} returns.m - left anchor coordinates
     * @returns {object} returns.n - right anchor coordinates
     * @returns {object} returns.start - start point coordinates
     * @returns {object} returns.end - end point coordinates
     * @returns {number} returns.alpha - angle of the curve derivative at the point
     */
    Snap.path.findDotsAtSegment = findDotsAtSegment;
    /**
     * Returns the bounding box of a given cubic beziér curve
     * @method bezierBBox
     * @memberof Snap.path
     * @param {number} p1x - x of the first point of the curve
     * @param {number} p1y - y of the first point of the curve
     * @param {number} c1x - x of the first anchor of the curve
     * @param {number} c1y - y of the first anchor of the curve
     * @param {number} c2x - x of the second anchor of the curve
     * @param {number} c2y - y of the second anchor of the curve
     * @param {number} p2x - x of the second point of the curve
     * @param {number} p2y - y of the second point of the curve
     * @returns {object} bounding box
     * @returns {number} returns.x - x coordinate of the left top point of the box
     * @returns {number} returns.y - y coordinate of the left top point of the box
     * @returns {number} returns.x2 - x coordinate of the right bottom point of the box
     * @returns {number} returns.y2 - y coordinate of the right bottom point of the box
     * @returns {number} returns.width - width of the box
     * @returns {number} returns.height - height of the box
     */
    Snap.path.bezierBBox = bezierBBox;
    /**
     * Returns `true` if given point is inside bounding box
     * @method isPointInsideBBox
     * @memberof Snap.path
     * @param {object} bbox - bounding box
     * @param {number} x - x coordinate of the point
     * @param {number} y - y coordinate of the point
     * @returns {boolean} `true` if point is inside
     */
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
    /**
     * Returns `true` if two bounding boxes intersect
     * @method isBBoxIntersect
     * @memberof Snap.path
     * @param {object} bbox1 - first bounding box
     * @param {object} bbox2 - second bounding box
     * @returns {boolean} `true` if bounding boxes intersect
     */
    Snap.path.isBBoxIntersect = isBBoxIntersect;
    /**
     * Finds intersections of two paths
     * @method intersection
     * @memberof Snap.path
     * @param {string} path1 - path string
     * @param {string} path2 - path string
     * @returns {array} Array of intersection points with coordinates and segment information
     */
    Snap.path.intersection = pathIntersection;
    /**
     * Returns number of intersections between two paths
     * @method intersectionNumber
     * @memberof Snap.path
     * @param {string} path1 - path string
     * @param {string} path2 - path string
     * @returns {number} Number of intersection points
     */
    Snap.path.intersectionNumber = pathIntersectionNumber;
    /**
     * Checks if path overlaps with rectangle
     * @method isPathOverlapRect
     * @memberof Snap.path
     * @param {string} path - path string
     * @param {object} rect - rectangle definition
     * @returns {boolean} `true` if path overlaps rectangle
     */
    Snap.path.isPathOverlapRect = isPathOverlapRect;
    /**
     * Snap.path.isPointInside @method
 *
     * Utility method
 *
     * Returns `true` if given point is inside a given closed path.
     *
     * Note: fill mode doesn’t affect the result of this method.
 * @param {string} path - path string
 * @param {number} x - x of the point
 * @param {number} y - y of the point
 * @returns {boolean} `true` if point is inside the path
     */
    Snap.path.isPointInside = isPointInsidePath;
    /**
     * Snap.path.getBBox @method
 *
     * Utility method
 *
     * Returns the bounding box of a given path
     * @memberof Snap.path
 * @param {string} path - path string
 * @returns {object} bounding box
     o {
     o     x: (number) x coordinate of the left top point of the box,
     o     y: (number) y coordinate of the left top point of the box,
     o     x2: (number) x coordinate of the right bottom point of the box,
     o     y2: (number) y coordinate of the right bottom point of the box,
     o     width: (number) width of the box,
     o     height: (number) height of the box
     o }
     */
    Snap.path.getBBox = pathBBox;
    Snap.path.get = getPath;
    /**
     * Snap.path.toRelative @method
 *
     * Utility method
 *
     * Converts path coordinates into relative values
 * @param {string} path - path string
 * @returns {array} path string
     */
    Snap.path.toRelative = pathToRelative;
    /**
     * Snap.path.toAbsolute @method
 *
     * Utility method
 *
     * Converts path coordinates into absolute values
 * @param {string} path - path string
 * @returns {array} path string
     */
    Snap.path.toAbsolute = pathToAbsolute;
    /**
     * Snap.path.toCubic @method
 *
     * Utility method
 *
     * Converts path to a new path where all segments are cubic beziér curves
 * @param {string|array} pathString - path string or array of segments
 * @returns {array} array of segments
     */
    Snap.path.toCubic = path2curve;
    /**
     * Snap.path.map @method
 *
     * Transform the path string with the given matrix
 * @param {string} path - path string
 * @param {object} matrix - see @Matrix
 * @returns {string} transformed path string
     */
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
        /**
         * Retrieves the current scroll offset for the specified axis.
         *
         * @param {"x"|"y"} xy Indicates which axis to measure.
         * @param {Element|Snap|undefined} [el] Optional element used to resolve the owning document.
         * @returns {number} The scroll offset in pixels for the requested axis.
         */
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
        /**
         * Normalises DOM, touch, and pointer events for Snap elements.
         *
         * @param {HTMLElement|Document} obj A DOM node to attach the native listener to.
         * @param {string} type The canonical mouse event name.
         * @param {Function} fn The handler invoked with normalised coordinates.
         * @param {Element} element The Snap element used as `this` when invoking the handler.
         * @returns {Function} A disposer that removes the underlying native listeners.
         */
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
    /**
     * Handles the active drag gesture by relaying movement coordinates to registered listeners.
     *
     * @param {MouseEvent|TouchEvent} e The original DOM event.
     */
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
        /**
         * Concludes all active drag gestures and removes the shared move/up listeners.
         *
         * @param {MouseEvent|TouchEvent} e The original DOM event that ended the drag.
         */
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
    /**
     * Generates pointer helper methods such as `element.click`, `element.mousemove`, and their
     * corresponding `un*` counterparts. These helpers normalise mouse, touch, and pointer events,
     * optionally invoke handlers with a custom scope, and expose the event coordinates adjusted for
     * document scroll.
     *
     * Each generated method supports two calling conventions:
     * - `element.eventName(handler, [scope], [data])` to bind a listener.
     * - `element.eventName()` to trigger previously bound listeners for the same event type.
     *
     * @param {Function} fn The event handler. When omitted the previously registered handlers are invoked.
     * @param {Object} [scope] Optional `this` context passed to the handler.
     * @param {*} [data] Arbitrary data stored alongside the handler metadata.
     * @returns {Element} The current element, allowing chaining.
     *
     * @example
     * element.click(function (event, x, y) {
     *     console.log("Clicked at", x, y);
     * });
     *
     * @example
     * element.unclick(handler);
     */
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
    /**
     * Adds hover-in and hover-out handlers to the element using `mouseover` and `mouseout` events.
     *
     * @param {Function} f_in Handler executed when the pointer enters the element.
     * @param {Function} f_out Handler executed when the pointer leaves the element.
     * @param {Object} [scope_in] Optional context bound to the hover-in handler.
     * @param {Object} [scope_out] Optional context bound to the hover-out handler.
     * @returns {Element} The current element for chaining.
     */
    elproto.hover = function (f_in, f_out, scope_in, scope_out) {
        return this.mouseover(f_in, scope_in).mouseout(f_out, scope_out || scope_in);
    };
    /**
     * Removes previously registered hover handlers from the element.
     *
     * @param {Function} f_in The hover-in handler to unregister.
     * @param {Function} f_out The hover-out handler to unregister.
     * @returns {Element} The current element for chaining.
     */
    elproto.unhover = function (f_in, f_out) {
        return this.unmouseover(f_in).unmouseout(f_out);
    };
    const draggable = [];
    // SIERRA unclear what _context_ refers to for starting, ending, moving the drag gesture.
    // SIERRA Element.drag(): _x position of the mouse_: Where are the x/y values offset from?
    // SIERRA Element.drag(): much of this member's doc appears to be duplicated for some reason.
    // SIERRA Unclear about this sentence: _Additionally following drag events will be triggered: drag.start.<id> on start, drag.end.<id> on end and drag.move.<id> on every move._ Is there a global _drag_ object to which you can assign handlers keyed by an element's ID?
    /**
     * Adds drag gesture handlers to the element.
     *
     * Additional `drag` events are triggered for convenience:
     * - `drag.start.<id>` when the gesture begins.
     * - `drag.move.<id>` while the pointer moves.
     * - `drag.end.<id>` when the gesture finishes.
     * - `drag.over.<id>` when the element is dragged over another element.
     *
     * Handler invocation details:
     * - The start handler receives `(x, y, event)` where `x` and `y` are the pointer coordinates.
     * - The move handler receives `(dx, dy, x, y, event)` where `dx`/`dy` are deltas from the start point.
     * - The end handler receives `(event)`.
     *
     * @param {Function} [onmove] Handler for pointer movement.
     * @param {Function} [onstart] Handler fired when the drag starts.
     * @param {Function} [onend] Handler fired when the drag ends.
     * @param {Object} [move_scope] Optional context for the move handler.
     * @param {Object} [start_scope] Optional context for the start handler.
     * @param {Object} [end_scope] Optional context for the end handler.
    * @param {AltClickEventSpecification} [alt_click_event] Optional alternate click trigger when the drag is extremely short. Accepts a timeout in milliseconds or `[event, timeout]` where `event` can be an event name or callback.
     * @returns {Element} The current element to support chaining.
     */
    elproto.drag = function (onmove, onstart, onend, move_scope, start_scope, end_scope, alt_click_event) {
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

        let time;

        function start(e, x, y) {
            // (e.originalEvent || e).preventDefault();
            if (alt_click_event) time = Date.now();
            el._drag.x = x;
            el._drag.y = y;
            el._drag.id = e.identifier;
            !drag.length && Snap.mousemove(dragMove)
                .mouseup(dragUp);
            drag.push({el: el, move_scope: move_scope, start_scope: start_scope, end_scope: end_scope});
            onstart && eve.on("snap.drag.start." + el.id, onstart);
            onmove && eve.on("snap.drag.move." + el.id, onmove);
            if (alt_click_event) {
                eve.on("snap.drag.end." + el.id, () => {
                    let cl_t = (typeof alt_click_event === "number") ? alt_click_event : 500;
                    if (Array.isArray(alt_click_event)
                        && typeof alt_click_event[1] === "number"
                        && (typeof alt_click_event[0] === "string"
                            || typeof alt_click_event[0] === "function")) {
                        [alt_click_event, cl_t] = alt_click_event;
                    }
                    if (Date.now() - time < cl_t) {
                        if (typeof alt_click_event === "string") {
                            eve(alt_click_event)
                        }
                        if (typeof alt_click_event === "function") {
                            alt_click_event()
                        } else {
                           el.node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
                        }
                        eve("snap.drag.click." + el.id)
                    }
                })
            }
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
     * Element.onDragOver @method *
     * Shortcut to assign event handler for `drag.over.<id>` event, where `id` is the element's `id` (see @Element.id) * @param {function} f - handler for event, first argument would be the element you are dragging over
    */
    // elproto.onDragOver = function (f) {
    //     f ? eve.on("snap.drag.over." + this.id, f) : eve.unbind("snap.drag.over." + this.id);
    // };
    /**
     * Removes all drag-related handlers from the element and detaches shared listeners when applicable.
     *
     * @returns {Element} The current element for chaining.
     */
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

    /**
     * Removes every registered mouse, touch, and drag listener from the element.
     *
     * @returns {Element} The current element for chaining.
     */
    elproto.removeAllMouseListeners = function () {
        const events = this.events || [];
        let l = events.length;
        while (l--) {
            const event = events[l];
            this["un" + event.name] && this["un" + event.name](event.f)
        }

        this.undrag();
        this.unhover();
        return this;
    };

    /**
     * Copies registered event listeners from another element, optionally preserving the original scopes.
     *
     * @param {Element} el Source element whose listeners should be duplicated.
     * @param {boolean} [preserveScopes=false] When `true`, retains the original listener scopes.
     * @param {boolean} [skip_drag=false] When `true`, drag handlers are ignored.
     * @returns {Element} The current element for chaining.
     */
    elproto.copyListeners = function (el, preserveScopes, skip_drag) {
        if (!el.events) return this;

        el.events.forEach((ev) => {
            if (ev.data && ev.data.type === "drag") {
                if (!skip_drag) this.drag.apply(this, ev.data.params)
            } else {
                this[ev.name](ev.f, (preserveScopes) ? ev.scope : undefined);
            }
        });

        return this;
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
Snap_ia.plugin(function(Snap, Element, Paper, glob, Fragment, eve) {
  var elproto = Element.prototype,
      pproto = Paper.prototype,
      rgurl = /^\s*url\((.+)\)/,
      Str = String,
      $ = Snap._.$;
  Snap.filter = {};
  /**
   * Paper.filter @method
 *
   * Creates a `<filter>` element
 *
 * @param {string} filstr - SVG fragment of filter provided as a string
 * @returns {object} @Element
   * Note: It is recommended to use filters embedded into the page inside an empty SVG element.
   > Usage
   | var f = paper.filter('<feGaussianBlur stdDeviation="2"/>'),
   |     c = paper.circle(10, 10, 10).attr({
   |         filter: f
   |     });
  */
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
    const ElementClass = Snap.getClass("Element");
    const element = new ElementClass(filter);
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
  /**
   * Snap.filter.blur @method
 *
   * Returns an SVG markup string for the blur filter
 *
 * @param {number} x - amount of horizontal blur, in pixels
 * @param {number} y - #optional amount of vertical blur, in pixels
 * @returns {string} filter representation
   > Usage
   | var f = paper.filter(Snap.filter.blur(5, 10)),
   |     c = paper.circle(10, 10, 10).attr({
   |         filter: f
   |     });
  */
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
  /**
   * Snap.filter.shadow @method
 *
   * Returns an SVG markup string for the shadow filter
 *
 * @param {number} dx - #optional horizontal shift of the shadow, in pixels
 * @param {number} dy - #optional vertical shift of the shadow, in pixels
 * @param {number} blur - #optional amount of blur
 * @param {string} color - #optional color of the shadow
 * @param {number} opacity - #optional `0..1` opacity of the shadow
   * or
 * @param {number} dx - #optional horizontal shift of the shadow, in pixels
 * @param {number} dy - #optional vertical shift of the shadow, in pixels
 * @param {string} color - #optional color of the shadow
 * @param {number} opacity - #optional `0..1` opacity of the shadow
   * which makes blur default to `4`. Or
 * @param {number} dx - #optional horizontal shift of the shadow, in pixels
 * @param {number} dy - #optional vertical shift of the shadow, in pixels
 * @param {number} opacity - #optional `0..1` opacity of the shadow
 * @returns {string} filter representation
   > Usage
   | var f = paper.filter(Snap.filter.shadow(0, 2, .3)),
   |     c = paper.circle(10, 10, 10).attr({
   |         filter: f
   |     });
  */
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
  /**
   * Snap.filter.grayscale @method
 *
   * Returns an SVG markup string for the grayscale filter
 *
 * @param {number} amount - amount of filter (`0..1`)
 * @returns {string} filter representation
  */
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
  /**
   * Snap.filter.sepia @method
 *
   * Returns an SVG markup string for the sepia filter
 *
 * @param {number} amount - amount of filter (`0..1`)
 * @returns {string} filter representation
  */
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
  /**
   * Snap.filter.saturate @method
 *
   * Returns an SVG markup string for the saturate filter
 *
 * @param {number} amount - amount of filter (`0..1`)
 * @returns {string} filter representation
  */
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
  /**
   * Snap.filter.hueRotate @method
 *
   * Returns an SVG markup string for the hue-rotate filter
 *
 * @param {number} angle - angle of rotation
 * @returns {string} filter representation
  */
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
  /**
   * Snap.filter.invert @method
 *
   * Returns an SVG markup string for the invert filter
 *
 * @param {number} amount - amount of filter (`0..1`)
 * @returns {string} filter representation
  */
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
  /**
   * Snap.filter.brightness @method
 *
   * Returns an SVG markup string for the brightness filter
 *
 * @param {number} amount - amount of filter (`0..1`)
 * @returns {string} filter representation
  */
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
  /**
   * Snap.filter.contrast @method
 *
   * Returns an SVG markup string for the contrast filter
 *
 * @param {number} amount - amount of filter (`0..1`)
 * @returns {string} filter representation
  */
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
    const box = Snap.box,
        is = Snap.is,
        firstLetter = /^[^a-z]*([tbmlrc])/i,
        toString = function () {
            return "T" + this.dx + "," + this.dy;
        };

    /**
     * @typedef {Object} AlignOffset
     * @property {number} dx Horizontal shift required for alignment.
     * @property {number} dy Vertical shift required for alignment.
     * @property {function(): string} toString Serialises the offset as an SVG transform string (e.g. `"T10,-5"`).
     */

    /**
     * Returns the translation vector required to align this element with a target element, Snap set, or raw bounding box.
     * If no target is provided, the current paper (parent `<svg>`) is used by default. Passing a string as the first
     * argument is treated as the `way` so you can call `el.getAlign("top")` directly.
     *
     * @param {Snap.Element|Snap.Paper|Snap.BBox|Element|Object|string} [el] Alignment target. When a string is provided it is treated as the `way` argument.
     * @param {string} [way="center"] Alignment mode: "top", "middle", "bottom", "left", "center", or "right".
     * @returns {AlignOffset} Offset needed to align the element.
     *
     * @example <caption>Apply the translation directly as a transform</caption>
     * const shift = el.getAlign(el2, "top");
     * el.transform(el.transform().localMatrix.toTransformString() + shift.toString());
     *
     * @example <caption>Use the numeric values for custom positioning</caption>
     * const topOffset = el.getAlign(el2, "top");
     * const dy = topOffset.dy;
     * // position some helper guides with `dy`
     */
    Element.prototype.getAlign = function (el, way) {
        if (way == null && is(el, "string")) {
            way = el;
            el = null;
        }
        el = el || this.paper;
        const bx = el.getBBox ? el.getBBox() : box(el),
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
    /**
     * Aligns this element with a target element or bounding box by applying the translation returned from {@link Element#getAlign}.
     * The method is chainable and does not reset the existing transformation matrix; it simply appends the calculated shift.
     *
     * @param {Snap.Element|Snap.Paper|Snap.BBox|Element|Object|string} [el] Alignment target. When a string is provided it is treated as the `way` argument.
     * @param {string} [way="center"] Alignment mode: "top", "middle", "bottom", "left", "center", or "right".
     * @returns {Snap.Element} The current element for chaining.
     *
     * @example <caption>Align the element to the top of another element</caption>
     * el.align(el2, "top");
     *
     * @example <caption>Align relative to the parent SVG by passing only the way</caption>
     * el.align("middle");
     */
    Element.prototype.align = function (el, way) {
        return this.transform("..." + this.getAlign(el, way));
    };

    /**
     * Aligns this element together with other elements or bounding boxes. The method resolves a shared anchor box—either
     * the explicit anchor provided, or one derived from the combined bounding boxes—and then applies {@link Element#align}
     * to every member of the set.
     *
     * @param {Snap.Set|Array<Snap.Element|Snap.BBox|Object>} [els=[]] Elements, sets, or bounding boxes to align alongside this element.
     * @param {string} [way="center"] Alignment mode: "top", "middle", "bottom", "left", "center", or "right".
     * @param {string|Snap.Element|Snap.BBox|Object} [anchor_id] Named anchor, element, or bounding box to align against.
     * @returns {number|false} Number of elements moved, or `false` if no anchor can be resolved.
     *
     * @example <caption>Align a group to the center of the first element</caption>
     * const movedCount = el.alignAll([el2, el3], "center", el);
     * // movedCount === 3 when all three elements were repositioned
     *
     * @example <caption>Align several elements to the top edge of an element with id="anchor"</caption>
     * el.alignAll([el2, el3], "top", "anchor");
     */
    Element.prototype.alignAll = function (els, way, anchor_id) {
        if (way == null && anchor_id == null && is(els, "string")) {
            anchor_id = null;
            way = els;
            els = [];
        } else if (anchor_id == null && way != null && !is(way, "string")) {
            anchor_id = way;
            way = null;
        }

        way = way || "center";


        const alignSet = new Snap.Set([this, ...els.filter((el) => is(el, "element"))]);

        if (!alignSet.length) {
            return this;
        }

        let anchorElement = null,
            anchorBox = null;

        if (anchor_id != null) {
            if (is(anchor_id, "string")) {
                const needle = anchor_id;
                anchorElement = alignSet.filter((el) => el.getId() === anchor_id)[0];

                if (!anchorElement) {
                    anchorElement = this.paper.select('#' + anchor_id);
                }
                if (anchorElement) {
                    anchorBox = box(anchorElement.getBBox());
                } else {
                    return false;
                }
            } else if (Snap.is(anchor_id, "Element")) {
                anchorElement = anchor_id;
                anchorBox = box(anchorElement.getBBox());
            } else if (anchor_id && anchor_id.getBBox && is(anchor_id.getBBox, "function")) {
                anchorBox = anchor_id.getBBox();
            } else if (anchor_id) {
                try {
                    anchorBox = box(anchor_id);
                } catch (er) {
                    return false;
                }
            }
        }

        if (!anchorBox) {
            const boxes = Array.from(new Snap.Set([this, ...els])).map((el) => (el.getBBox) ?? el.getBBox()).filter(Boolean);
            const n = boxes.length;
            if (way[0].toLowerCase() === 'c') {
                let CX_bar = boxes.map(b => b.cx).sum() / n,
                    CY_bar = boxes.map(b => b.cy).sum() / n;
                anchorBox = box(CX_bar - 10, CY_bar - 10, 20, 20);
            } else {
                let X_bar = boxes.map(b => b.x).sum() / n,
                    Y_bar = boxes.map(b => b.y).sum() / n,
                    X2_bar = boxes.map(b => b.x2).sum() / n,
                    Y2_bar = boxes.map(b => b.y2).sum() / n;

                anchorBox = box(X_bar, Y_bar, X2_bar - X_bar, Y2_bar - Y2_bar);
            }
        }

        if (anchorElement && !anchorBox) {
            anchorBox = box(anchorElement.getBBox());
        }

        if (!anchorBox) {
            return this;
        }

        let moved = 0
        alignSet.forEach(function (item) {
            if (!item || !item.getBBox || !is(item.getBBox, "function")) {
                return;
            }
            item.align(anchorElement || anchorBox, way);
            ++moved
        });

        return moved;
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
    /**
     * Snap.mui @property *
     * Contain Material UI colours.
     | Snap().rect(0, 0, 10, 10).attr({fill: Snap.mui.deeppurple, stroke: Snap.mui.amber[600]});
     # For colour reference: <a href="https://www.materialui.co">https://www.materialui.co</a>.
    */
    Snap.mui = {};
    /**
     * Snap.flat @property *
     * Contain Flat UI colours.
     | Snap().rect(0, 0, 10, 10).attr({fill: Snap.flat.carrot, stroke: Snap.flat.wetasphalt});
     # For colour reference: <a href="https://www.materialui.co">https://www.materialui.co</a>.
    */
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
    /**
     * Snap.importMUIColors @method *
     * Imports Material UI colours into global object.
     | Snap.importMUIColors();
     | Snap().rect(0, 0, 10, 10).attr({fill: deeppurple, stroke: amber[600]});
     # For colour reference: <a href="https://www.materialui.co">https://www.materialui.co</a>.
    */
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

return Snap_ia;
}));
;
