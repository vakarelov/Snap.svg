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
// build: 2025-10-10

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
        Snap._.hub_rem = {};
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
        Snap._.make = make;

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
    class Fragment {
        constructor(frag) {
            this.node = frag;
        }
    }

    // Register the Fragment class with Snap
    Snap.registerClass("Fragment", Fragment);

    // Note: select and selectAll methods will be added to Fragment.prototype
    // in element-class.js after Element class is defined, since Fragment
    // shares these methods with Element. See element-class.js for implementation.

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
        const has = "hasOwnProperty";


        /**
         * Element class
         * Wraps an SVG element with Snap methods
         *
         * @class Snap.Element
         * @param {SVGElement} el Underlying DOM node.
         */
        class Element {
            constructor(el) {
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
            INITIAL_BBOX = "initial_bbox";

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
                    const old_trans = clip_path.attr("transform");
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
                case "polyline":
                case "polygon":
                    const points = this.attr("points");
                    for (let i = 0, l = Math.floor(points.length / 2) * 2; i < l; i = i +
                        2) {
                        result.push({x: +points[i], y: +points[i + 1]});
                    }
                    break;
                case "rect":
                    const x = +this.attr("x"), y = +this.attr("y"), w = +this.attr("width"),
                        h = +this.attr("height");
                    result = [
                        {x: x, y: y},
                        {x: x + w, y: y},
                        {x: x + w, y: y + h},
                        {x: x, y: y + h},
                    ];
                    break;
                case "path":
                    result =  this.getPointSample();
                    break;
                case "line":
                    result = [
                        {x: this.attr("x1"), y: this.attr("y1")},
                        {x: this.attr("x2"), y: this.attr("y2")},
                    ];
                    break;
                case "circle":
                    rx = +this.attr("r");
                    ry = rx;
                case "ellipse":
                    rx = rx || +this.attr("rx");
                    ry = ry || +this.attr("ry");
                    let cx = +this.attr("cx");
                    let cy = +this.attr("cy");
                    let inc = Math.PI / 10;
                    let angles = [...Array(20).keys()].map((i) => i * inc);
                    result = angles.map((a) => {
                        return {
                            x: rx * Math.cos(a) + cx,
                            y: ry * Math.sin(a) + cy,
                        };
                    });
                    break;
                case "g":
                case "symbol":
                    result = [];
                    let children = this.getChildren(true), ch;
                    for (let i = 0, l = children.length; i < l; ++i) {
                        if (skip_hidden && (children[i].node.style.display === "none" || children[i].attr("display") === "none")) continue;
                        const pts = children[i].getPoints(true, skip_hidden);
                        if (window.now && children[i].type === "use") console.log(children[i], Snap.convexHull(pts));
                        pts && pts.length && (result = [...result, ...pts]);
                    }
                    break;
                // matrix = (this.getCoordMatrix) ? this.getCoordMatrix(true) : this.transform().diffMatrix;
                // matrix = this.getLocalMatrix();
                case "use": //todo:
                    let targ = this.getUseTarget();
                    if (targ) {
                        let x = this.attr("x") || 0,
                            y = this.attr("y") || 0;
                        // matrix = Snap.matrix().add(this.getLocalMatrix().translate(this.attr('x') || 0, this.attr('y') || 0));
                        result = targ.getPoints(true);
                        if (x || y) {
                            const trans_m = Snap.matrix().translate(x, y);
                            result = result.map((p) => trans_m.apply(p));
                        }
                        if (targ.type === "symbol") {
                            let height = +this.attr("height"),
                                width = +this.attr("width");
                            //todo: implement viewbox
                        }
                    }
                    break;
                case "text":
                case "tspan":
                case "image":
                case "foreignObject":
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
            const is_use = this.type === "use";

            if (!with_transform && el.c_hull && (el.type !== "g" || !skip_hidden)) return el.c_hull;

            let m;

            if (is_use &&
                (this.node.hasAttribute("x") || this.node.hasAttribute("y"))) {
                const x = +this.attr("x")
                const y = +this.attr("y");
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
            if (this.type !== "use") return this;
            if (this.use_target) {
                return this.use_target;
            } else {
                const href = this.attr("xlink:href") || this.attr("href");
                if (href) {
                    const elementId = href.substring(href.indexOf("#") + 1);
                    return this.use_target = Snap.elementFormId(elementId) ||
                        this.paper.select("#" + elementId) ||
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
            if (this.type === "image" && m.f) {
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
            if (typeof settings === "boolean") {
                isWithoutTransform = settings;
            } else if (typeof settings === "object") {
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
                while ((p = p.parent()) && p !== relative_parent && p.type !== "svg") {
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
                clip_path = this.attr("clip-path");
                if (clip_path === "none") clip_path = undefined;
                if (clip_path) {
                    clip_path = clip_path.trim().slice(4, -1);
                    clip_path = this.paper.select(clip_path);
                }
            }

            let saved_bb = this.attr("bbox");
            if (saved_bb) { //todo
                saved_bb = saved_bb.split(" ");
                //todo make sure this works with realative parent
                if (!include_clip_path || saved_bb[4] === "cp") return Snap.box(saved_bb);
            }

            if (!Snap.Matrix || !Snap.path) {
                return this.node.getBBox();
            }
            let el = this,
                matrix_for_x_y_attrs = new Snap.Matrix;
            if (false && el.removed) {
                return Snap.box();
            }

            if (this.type === "tspan" || this.type === "text") {
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

            while (el.type === "use") {
                if (!isWithoutTransform) {
                    matrix_for_x_y_attrs = matrix_for_x_y_attrs.add(el.getLocalMatrix().translate(el.attr("x") || 0, el.attr("y") || 0));
                }

                el = this.getUseTarget();

                if (!el) return null;
            }

            if (el.type === "g") {
                el.saveMatrix(el.getLocalMatrix(true));

                let protected_region = el.attr("protected");
                if (!!protected_region) {
                    const region = el.select("[region=\"1\"]"); //todo: optimize and rework this
                    if (region) {
                        const clone = region.clone(true, undefined, true);
                        var box = clone.addTransform(el.matrix).getBBox(isWithoutTransform);
                        clone.remove();
                        if (cache_bbox) {
                            this.attr("bbox",
                                box.x + " " + box.y + " " + box.width + " " + box.height +
                                ((clip_path) ? " cp" : ""));
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
                    if (skip_hidden && (elm.node.style.display === "none" || elm.attr("display") === "none")) {
                        console.log("In empty");
                        return null;
                    }
                    let box;
                    if (elm.hasOwnProperty("getBBox")) {
                        let m = el.matrix;
                        if (matrix) m = m.clone().multLeft(matrix);
                        box = elm.getBBox(m);
                    } else {
                        let elm_cl = elm.clone(true, undefined, true);
                        elm_cl.addTransform(el.matrix);
                        if (matrix) elm_cl.addTransform(matrix);
                        box = elm_cl.getBBox(isWithoutTransform);
                        if (+cache_bbox === 1) {
                            elm.attr("bbox",
                                box.x + " " + box.y + " " + box.width + " " + box.height +
                                ((clip_path) ? " cp" : ""));
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
                        this.attr("bbox",
                            box.x + " " + box.y + " " + box.width + " " + box.height +
                            ((clip_path) ? " cp" : ""));
                        this.data(INITIAL_BBOX,
                            {bbox: box, matrix: this.getLocalMatrix(true)});
                    }
                    return clip_path_box_helper(box, clip_path, el.matrix);
                    //this only works in Strict mode
                    const p1 = el.matrix.apply({x: box.x, y: box.y}),
                        p2 = el.matrix.apply({x: box.x2, y: box.y2});
                    var box = Snap.box({x: p1.x, y: p1.y, x2: p2.x, y2: p2.y});
                    if (cache_bbox) {
                        this.attr("bbox",
                            box.x + " " + box.y + " " + box.width + " " + box.height +
                            ((clip_path) ? " cp" : ""));
                        this.data(INITIAL_BBOX,
                            {bbox: box, matrix: this.getLocalMatrix(true)});
                    }
                    return clip_path_box_helper(box, clip_path, el.matrix);
                } else {
                    try {
                        let box;
                        if (matrix && !matrix.isIdentity()) {
                            const t = el.attr("transform");
                            el.addTransform(matrix);
                            box = el.node.getBBox();
                            el.attr("transform", t);
                        } else {
                            box = el.node.getBBox();
                        }

                        if (cache_bbox) {
                            this.attr("bbox",
                                box.x + " " + box.y + " " + box.width + " " + box.height +
                                ((clip_path) ? " cp" : ""));
                            this.data(INITIAL_BBOX,
                                {bbox: box, matrix: this.getLocalMatrix(true)});
                        }
                        box = Snap.box(box.x, box.y, box.width, box.height);
                        return clip_path_box_helper(box, clip_path, el.matrix);

                    } catch (e) {
                        //Display:none is set and an exception is called.
                        this.attr("bbox", "");
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
                    if (cache_bbox) this.attr("bbox",
                        box.x + " " + box.y + " " + box.width + " " + box.height);
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
            if (settigns && typeof settigns === "object" && settigns.isMatrix) {
                return this.getBBox({approx: false, matrix: settigns});
            }
            if (typeof settigns === "boolean") settigns = {without_transform: settigns};
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
            if (typeof callback_val === "function") {
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
                if (el.type == "linearGradient" || el.type == "radialGradient") {
                    tstr = el.node.getAttribute("gradientTransform");
                } else if (el.type == "pattern") {
                    tstr = el.node.getAttribute("patternTransform");
                } else {
                    if (!el.node.getAttribute) {
                        console.log("node problem");
                    } else {
                        tstr = el.node.getAttribute("transform") || el.node.style.transform;
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
                    tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || "");
                }
                if (is(tstr, "array")) {
                    tstr = Snap.path ? Snap.path.toString.call(tstr) : Str(tstr);
                }
                el._.transform = tstr;
            }
            const command = Str(tstr[0]).toLowerCase()[0];
            let m;
            if (!tstr || command == "m") {
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
                if (el.type == "linearGradient" || el.type == "radialGradient") {
                    tstr = el.node.getAttribute("gradientTransform");
                } else if (el.type == "pattern") {
                    tstr = el.node.getAttribute("patternTransform");
                } else {
                    tstr = el.node.getAttribute("transform");
                }
                if (!tstr) {
                    return new Snap.Matrix;
                }
            } else {
                if (!Snap._.rgTransform.test(tstr)) {
                    tstr = Snap._.svgTransform2string(tstr);
                    tstr = Snap._.svgTransform2string(tstr);
                } else {
                    tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || "");
                }
                if (is(tstr, "array")) {
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
            while (parent && parent.type !== "svg") {
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
            if (typeof matrix === "boolean") {
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
                while ((papa.type != "svg" && papa.type != "body") && (papa = papa.parent())) {
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
                if (this.type == "linearGradient" || this.type == "radialGradient") {
                    $(this.node, {gradientTransform: this.matrix});
                } else if (this.type == "pattern") {
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
                                    tars_str = this.node.getAttribute("transform");
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
                    if (command === "t" && tlen === 2) {
                        m.translate(t[1], 0);
                    } else if (command === "t" && tlen === 3) {
                        m.translate(t[1], t[2]);
                    } else if (command === "r") {
                        m.rotate(t[1], t[2], t[3]);
                    } else if (command === "s") {
                        m.scale(t[1], t[2], t[3], t[4]);
                    } else if (command === "m" && tlen === 7) {
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
            if (this.type === "linearGradient" || this.type === "radialGradient") {
                tstr = this.node.getAttribute("gradientTransform") || "";
            } else if (this.type === "pattern") {
                tstr = this.node.getAttribute("patternTransform") || "";
            } else {
                tstr = this.node.getAttribute("transform") || "";
            }

            tstr = tstr.trim().toLowerCase();
            if (tstr &&
                !(tstr.startsWith("matrix(") && tstr.indexOf(")") === tstr.length -
                    1)) {
                let tarr = Snap._.svgTransform2string(tstr);
                const matrix = transform2matrix(tarr);
                let m = matrix.toString();

                // console.log("Fixing transform for", this.getId(), tstr, "to", m);
                if (this.type === "linearGradient" || this.type === "radialGradient") {
                    this.node.setAttribute("gradientTransform", m); //getAttribute("gradientTransform");
                    this.attrMonitor("gradientTransform")
                } else if (this.type === "pattern") {
                    this.node.setAttribute("patternTransform", m);
                    this.attrMonitor("patternTransform")
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
                bbox: new_bbox.x + " " + new_bbox.y + " " + new_bbox.width + " " +
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
            let saved_bb = parent.attr("bbox");
            if (!saved_bb) return;
            saved_bb = saved_bb.split(" ");
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
            let parent_bb = parent.attr("bbox");
            if (!parent_bb) return;

            if (bbox_circle) {
                const parent_bbox = Snap.box(parent_bb.split(" "));
                //circle is provided
                if (typeof bbox_circle.r === "number") {
                    if (!parent_bbox.containsCircle(bbox_circle)) {
                        parent.attr({bbox: ""}); //erase
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
                        parent.attr({bbox: ""}); //erase
                        parent.removeData(INITIAL_BBOX);
                        const expanded_bb = Snap.joinBBoxes([parent_bbox, bbox_circle]);
                        parent.eraseParentBBoxCache(expanded_bb);
                    }
                }

                return;
            }

            parent.attr({bbox: ""}); //erase
            parent.removeData(INITIAL_BBOX);
            parent.eraseParentBBoxCache();

        };

        /**
         * Removes the cached bounding box from the element and, recursively, its children.
         */
        elproto.eraseBBoxCache = function () {
            this.attr({bbox: ""});
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
            if (this.type === "svg" || this.type === "defs") return;

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
         * @param {"dom"|"element"|Element|HTMLElement|Snap|boolean} [el_type] Partner type or specific partner reference.
         * @param {boolean} [remove_elements=false] When true, removes the partner elements from the DOM/SVG tree.
         */
        elproto.removePartner = function (el_type, remove_elements) {

            if (typeof el_type === "boolean") {
                remove_elements = el_type;
                el_type = undefined;
            }
            if (!el_type) {
                this.removePartner("dom", remove_elements);
                this.removePartner("element", remove_elements);

            } else if (el_type === "dom") {
                remove_elements && this._dom_partner &&
                this._dom_partner.forEach((el) => el.remove());
                this.removeData("dom_partner");
            } else if (el_type === "element") {
                remove_elements && this._element_partner &&
                this._element_partner.forEach((el) => el.remove());
                this.removeData("element_partner");
            } else if (el_type instanceof Element) {
                let dom_parts = this._dom_partner;
                if (dom_parts) {
                    const jq_el = Snap(el_type);
                    const index = dom_parts.findIndex((el) => el === jq_el);
                    if (index >= 0) {
                        remove_elements && dom_parts[index].remove();
                        dom_parts.splice(index, 1);
                        if (!dom_parts.length) {
                            this.removeData("dom_partner");
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
                            this.removeData("element_partner");
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
         * @param {"dom"|"element"|"both"} [el_type] Desired partner category.
         * @returns {Array|Object|undefined} Matching partners or `undefined` when none exist.
         */
        elproto.getPartners = function (el_type) {
            if (!el_type) {
                return this._dom_partner || this._element_partner;
            } else if (el_type === "dom") {
                return this._dom_partner;
            } else if (el_type === "element") {
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
                "opacity")) obj.opacity = style_obj.opacity;
            if (style_obj.hasOwnProperty(
                "display")) obj.display = style_obj.display;
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
                if (el.type === "set" || Array.isArray(el)) {
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
                if (el.setPaper && this.paper && el.type !== "svg" && el.paper !== this.paper) {
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
                if (el.type == "set") {
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
            if (el.type == "set") {
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
            if (this.hasOwnProperty("sub_children")) this.sub_children = [];

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
                    if (typeof visible === "string") return (visible === el.type);

                    if (visible) {
                        return (el.type === "circle" || el.type === "ellipse" || el.type ===
                            "line" || el.type === "g" || el.type === "path" || el.type ===
                            "polygon" || el.type === "polyline" || el.type === "rect" ||
                            el.type === "text" || el.type === "tspan" || el.type ===
                            "use" || el.type === "image");
                    } else {
                        return !(el.node.nodeType > 1 ||
                            el.type === "defs" ||
                            el.type === "desc");
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
            if (this.type !== "g" || this.type !== "svg" || this.type !== "clipPath") {
                return false;
            }
            const children = this.children();
            let i = 0, el;
            for (; i < children.length; ++i) {
                el = children[i];
                if (!(el.type === "#text" ||
                    el.type === "#comment" ||
                    el.type === "defs" ||
                    el.type === "desc")) {
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

            if (css_ref !== undefined && typeof css_ref === "string") {
                var select = this.paper.select(css_ref);
                if (select) {
                    use = select.use();
                    if (typeof x == "number" && typeof y == "number") {
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
            if (this.type === "linearGradient" || this.type === "radialGradient" ||
                this.type === "pattern") {
                use = make(this.type, this.node.parentNode);
            }
            if (this.type === "svg") {
                use = make("use", this.node);
            } else {
                use = make("use", this.node.parentNode);
            }
            $(use.node, {
                "href": "#" + id,
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
            const els = el.selectAll("*");
            let it;
            const url = /^\s*url\(("|'|)(.*)\1\)\s*$/,
                ids = [],
                uses = {};

            function urltest(it, name) {
                let val = $(it.node, name);
                val = val && val.match(url);
                val = val && val[2];
                if (val && val.charAt() == "#") {
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
                let val = $(it.node, "href");
                if (val && val.charAt() == "#") {
                    val = val.substring(1);
                } else {
                    return;
                }
                if (val) {
                    uses[val] = (uses[val] || []).concat(function (id) {
                        it.attr("href", "#" + id);
                    });
                }
            }

            for (var i = 0, ii = els.length; i < ii; ++i) {
                it = els[i];
                urltest(it, "fill");
                urltest(it, "stroke");
                urltest(it, "filter");
                urltest(it, "mask");
                urltest(it, "clip-path");
                linktest(it);
                const oldid = $(it.node, "id");
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
            if (typeof hidden === "function") {
                id_rename_callback = hidden;
                hidden = undefined;
            }
            const id = this.attr("id");
            const clone = wrap(this.node.cloneNode(true));
            if (!hidden) clone.insertAfter(this);
            if ($(clone.node, "id")) {
                const new_id = (id_rename_callback) ?
                    id_rename_callback($(clone.node, "id")) :
                    clone.id;
                $(clone.node, {id: new_id});
            }
            fixids(clone, id_rename_callback);
            clone.paper = this.paper;
            if (id && !id_rename_callback) clone.attr("id", id);
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

            if (this.type === "use") {
                let matrix = this.getLocalMatrix(true);
                const x = +this.attr("x");
                const y = +this.attr("y");
                matrix = matrix.multLeft(Snap.matrix().translate(x, y));
                if (!this.use_target) {
                    const href = this.attr("xlink:href") || this.attr("href");
                    if (href) {
                        const elementId = href.substring(href.indexOf("#") + 1);
                        this.use_target = Snap.elementFormId(elementId) ||
                            wrap(this.node.ownerDocument.getElementById(elementId));
                        if (!this.use_target) {
                            console.log("Cannot fine use");
                        }
                    } else {
                        return;
                    }
                }
                let clone;
                if (this.use_target.type === "symbol") {
                    clone = this.paper.g();
                    clone.add(this.getChildren());
                } else {
                    clone = this.use_target.clone();
                }

                this.after(clone);
                clone.removeUses();
                clone.addTransform(matrix);
                clone.attr("id", this.getId());
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
            const p = make("pattern", getSomeDefs(this));
            if (x == null) {
                x = this.getBBox();
            }
            if (is(x, "object") && "x" in x) {
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
                patternUnits: "userSpaceOnUse",
                id: p.id,
                viewBox: [x, y, width, height].join(" "),
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
            const p = make("marker", getSomeDefs(this));
            if (x == null) {
                x = this.getBBox();
            }
            if (is(x, "object") && "x" in x) {
                y = x.y;
                width = x.width;
                height = x.height;
                refX = x.refX || x.cx;
                refY = x.refY || x.cy;
                x = x.x;
            }
            $(p.node, {
                viewBox: [x, y, width, height].join(" "),
                markerWidth: width,
                markerHeight: height,
                orient: "auto",
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
                Snap._dataEvents && eve(["snap", "data", "get", this.id], this, data, null);
                return data;
            }
            if (arguments.length == 1) {
                if (Snap.is(key, "object")) {
                    for (let i in key) if (key[has](i)) {
                        this.data(i, key[i]);
                    }
                    return this;
                }
                Snap._dataEvents && eve(["snap", "data", "get", this.id], this, data[key], key);
                return data[key];
            }
            data[key] = value;
            Snap._dataEvents && eve(["snap", "data", "set", this.id], this, value, key);
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
                let res = type ? "<" + this.type : "";
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
                        quote_rep = (attr[i].name === "style") ? "'" : "\\\"";
                        res += " " + attr[i].name + "=\"" +
                            attr[i].value.replace(/"/g, quote_rep) + "\"";
                    }
                }
                if (chld.length) {
                    type && (res += ">");
                    for (i = 0, ii = chld.length; i < ii; ++i) {
                        if (chld[i].nodeType == 3) {
                            res += chld[i].nodeValue;
                        } else if (chld[i].nodeType == 1) {
                            res += wrap(chld[i]).toString();
                        }
                    }
                    type && (res += "</" + this.type + ">");
                } else {
                    type && (res += "/>");
                }
                return res;
            };
        }

        elproto.toDataURL = function () {
            if (window && window.btoa) {
                const bb = this.getBBox(),
                    svg = Snap.format(
                        "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" width=\"{width}\" height=\"{height}\" viewBox=\"{x} {y} {width} {height}\">{contents}</svg>",
                        {
                            x: +bb.x.toFixed(3),
                            y: +bb.y.toFixed(3),
                            width: +bb.width.toFixed(3),
                            height: +bb.height.toFixed(3),
                            contents: this.outerSVG(),
                        });
                return "data:image/svg+xml;base64," +
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
    class Paper {
        constructor(w, h) {
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
                res = Snap._.make("svg", glob.doc.body);
                $(res.node, {
                    height: h,
                    version: 1.1,
                    width: w,
                    xmlns: xmlns,
                });
            }
            return res;
        }
    }

    // Register the Paper class with Snap
    Snap.registerClass("Paper", Paper);

    var proto = Paper.prototype,
        is = Snap.is;
    /**
     * Draws a rectangle on the paper.
     *
     * @function Snap.Paper#rect
     * @function Snap.Element#rect
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
     * @function Snap.Element#circle
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
     * @function Snap.Element#image
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
     * @function Snap.Element#ellipse
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
     * @function Snap.Element#path
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
     * @function Snap.Element#g
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
     * @function Snap.Element#svg
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
     * @function Snap.Element#mask
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
     * @function Snap.Element#ptrn
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
     * @function Snap.Element#use
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
     * @function Snap.Element#symbol
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
     * @function Snap.Element#text
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
     * @function Snap.Element#line
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
     * @function Snap.Element#polyline
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
     * @function Snap.Element#polygon
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
         * @function Snap.Element#gradient
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
         * @function Snap.Element#gradientLinear
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
         * @function Snap.Element#gradientRadial
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
     * @function Snap.Paper#el
     * @function Snap.Element#el
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

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function _ccw(p1, p2, p3) {
    return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]) <= 0;
}

function _tangent(pointset) {
    const res = [];
    for (let t = 0; t < pointset.length; t++) {
        while (res.length > 1 && _ccw(res[res.length - 2], res[res.length - 1], pointset[t])) {
            res.pop();
        }
        res.push(pointset[t]);
    }
    res.pop();
    return res;
}

// pointset has to be sorted by X
function convex(pointset) {
    const upper = _tangent(pointset),
          lower = _tangent(pointset.reverse());
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

        const xPropertyName = format[0].slice(1);
        const yPropertyName = format[1].slice(1);
        const _getXY = function(pt) {
            return [pt[xPropertyName], pt[yPropertyName]];
        };

        return pointset.map(_getXY);
    },

    fromXy: function(pointset, format) {
        if (format === undefined) {
            return pointset.slice();
        }

        const xPropertyName = format[0].slice(1);
        const yPropertyName = format[1].slice(1);
        const _getObj = function(pt) {
            const obj = {};
            obj[xPropertyName] = pt[0];
            obj[yPropertyName] = pt[1];
            return obj;
        };

        return pointset.map(function(pt) {
            return _getObj(pt);
        });
    }

};
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
/* The license text can be found in the LICENSE file */

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
        const concave = points.concat([points[0]]);
        return format ? formatUtil.fromXy(concave, format) : concave;
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

    return format ? formatUtil.fromXy(concave, format) : concave;
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
    /**
     * Computes a concave hull for a given set of points and proxies the call to the underlying hull.js implementation.
     *
    * @param {PointCollection} points - Collection of points.
    *        Accepts an array of coordinate tuples, a flat numeric array, or point objects with `x`/`y`.
     * @param {number} [concavity] - Maximum concavity allowed by hull.js. Use `Infinity` (or omit) for a convex hull.
     * @param {"simple"|undefined} [format] - Optional hull.js format flag. When omitted the output matches the input shape.
    * @returns {(Array.<NumberPair>|Point2DList|null)} The computed hull or `null` when the input is invalid.
     */
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

    /**
     * Convenience wrapper for `Snap.hull` that forces a convex hull by setting concavity to `Infinity`.
     *
    * @param {PointCollection} points - Collection of input points.
     * @param {"simple"|undefined} [format] - Optional hull.js format flag.
    * @returns {(Array.<NumberPair>|Point2DList|null)} Closed convex hull without the repeated last point.
     */
    Snap.convexHull = function (points, format) {
        const hull = Snap.hull(points, Infinity, format);
        hull && hull.pop();
        return hull
    }

});
},{"hull.js":4}]},{},[6]);

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
        E = "";

    /**
     * Represents a 2D affine transformation matrix with six coefficients.
     * Accepts individual numeric coefficients, an `SVGMatrix`-like object, a matrix string, or another `Matrix` instance.
     * When invoked without arguments, an identity matrix is produced.
     *
     * @class
     * @alias Snap.Matrix
     */
    class Matrix {
        /**
         * Creates a new Matrix instance.
         * @param {number|SVGMatrix|string|Matrix} [a=1] - Either an existing matrix representation or the `a` component.
         * @param {number} [b=0] - The `b` coefficient when numeric values are provided.
         * @param {number} [c=0] - The `c` coefficient when numeric values are provided.
         * @param {number} [d=1] - The `d` coefficient when numeric values are provided.
         * @param {number} [e=0] - The `e` translation component when numeric values are provided.
         * @param {number} [f=0] - The `f` translation component when numeric values are provided.
         */
        constructor(a, b, c, d, e, f) {
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
        add(a, b, c, d, e, f) {
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
        }

        /**
         * Alias for {@link add} - multiplies on the right.
         * @see add
         */
        multRight(a, b, c, d, e, f) {
            return this.add(a, b, c, d, e, f);
        }

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
        plus(a, b, c, d, e, f) {
            if (a && a instanceof Matrix) {
                return this.plus(a.a, a.b, a.c, a.d, a.e, a.f);
            }

            return this.clone().add(a, b, c, d, e, f);
        }

        /**
         * Multiplies all affine coefficients by a scalar.
         *
         * @param {number} c - Scalar value applied to each coefficient.
         * @returns {Matrix} The matrix instance for chaining.
         */
        scMult(c) {
            this.a *= c;
            this.b *= c;
            this.c *= c;
            this.d *= c;
            this.f *= c;
            this.e *= c;
            return this;
        }

        /**
         * Returns a clone of the matrix scaled by the supplied scalar.
         *
         * @param {number} c - Scalar value applied to each coefficient.
         * @returns {Matrix} A new matrix instance with scaled coefficients.
         */
        timesSc(c) {
            return this.clone().scMult(c);
        }

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
        multLeft(a, b, c, d, e, f) {
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
        }

        /**
         * Computes the inverse of the affine matrix.
         *
         * @returns {Matrix} A new matrix representing the inverse transform.
         */
        invert() {
            var me = this,
                x = me.a * me.d - me.b * me.c;
            return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
        }

        /**
         * Creates an exact copy of the matrix.
         *
         * @returns {Matrix} A new matrix with identical coefficients.
         */
        clone() {
            return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
        }

        /**
         * Applies a translation to the matrix.
         *
         * @param {number} x - Horizontal translation distance.
         * @param {number} y - Vertical translation distance.
         * @returns {Matrix} The matrix instance for chaining.
         */
        translate(x, y) {
            this.e += x * this.a + y * this.c;
            this.f += x * this.b + y * this.d;
            return this;
        }

        /**
         * Applies a scale transformation to the matrix.
         *
         * @param {number} x - Horizontal scale factor; `1` leaves the axis unchanged.
         * @param {number} [y=x] - Vertical scale factor; defaults to {@link x} when omitted.
         * @param {number} [cx] - Optional horizontal origin around which to scale.
         * @param {number} [cy] - Optional vertical origin around which to scale.
         * @returns {Matrix} The matrix instance for chaining.
         */
        scale(x, y, cx, cy) {
            y == null && (y = x);
            (cx || cy) && this.translate(cx, cy);
            this.a *= x;
            this.b *= x;
            this.c *= y;
            this.d *= y;
            (cx || cy) && this.translate(-cx, -cy);
            return this;
        }

        /**
         * Applies a rotation to the matrix.
         *
         * @param {number} a - Rotation angle in degrees.
         * @param {number} [x=0] - Horizontal origin around which to rotate.
         * @param {number} [y=0] - Vertical origin around which to rotate.
         * @returns {Matrix} The matrix instance for chaining.
         */
        rotate(a, x, y) {
            a = Snap.rad(a);
            x = x || 0;
            y = y || 0;
            var cos = +Math.cos(a).toFixed(9),
                sin = +Math.sin(a).toFixed(9);
            this.add(cos, sin, -sin, cos, x, y);
            return this.add(1, 0, 0, 1, -x, -y);
        }

        /**
         * Skews the matrix along the x-axis.
         *
         * @param {number} x - Angle, in degrees, to skew along the x-axis.
         * @returns {Matrix} The matrix instance for chaining.
         */
        skewX(x) {
            return this.skew(x, 0);
        }

        /**
         * Skews the matrix along the y-axis.
         *
         * @param {number} y - Angle, in degrees, to skew along the y-axis.
         * @returns {Matrix} The matrix instance for chaining.
         */
        skewY(y) {
            return this.skew(0, y);
        }

        /**
         * Applies a simultaneous skew transform on both axes.
         *
         * @param {number} [x=0] - Angle, in degrees, to skew along the x-axis.
         * @param {number} [y=0] - Angle, in degrees, to skew along the y-axis.
         * @returns {Matrix} The matrix instance for chaining.
         */
        skew(x, y) {
            x = x || 0;
            y = y || 0;
            x = Snap.rad(x);
            y = Snap.rad(y);
            var c = Math.tan(x).toFixed(9);
            var b = Math.tan(y).toFixed(9);
            return this.add(1, b, c, 1, 0, 0);
        }

        /**
         * Transforms a point and returns its x-coordinate.
         *
         * @param {number} x - Original x-coordinate.
         * @param {number} y - Original y-coordinate.
         * @returns {number} The transformed x-coordinate.
         */
        x(x, y) {
            return x * this.a + y * this.c + this.e;
        }

        /**
         * Transforms a point and returns its y-coordinate.
         *
         * @param {number} x - Original x-coordinate.
         * @param {number} y - Original y-coordinate.
         * @returns {number} The transformed y-coordinate.
         */
        y(x, y) {
            return x * this.b + y * this.d + this.f;
        }

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
        randomTrans(cx, cy, positive, distance, diff_scale, skip_rotation, skip_scale) {
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
        }

        /**
         * Returns a coefficient of the matrix by index (`0 → a`, `5 → f`).
         *
         * @param {number} i - Index of the coefficient (0-5).
         * @returns {number} The coefficient rounded to nine decimal places.
         */
        get(i) {
            return +this[Str.fromCharCode(97 + i)].toFixed(9);
        }

        /**
         * Serialises the matrix into an SVG `matrix(a,b,c,d,e,f)` transform string.
         *
         * @returns {string} SVG transform string representing the matrix.
         */
        toString() {
            return "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")";
        }

        /**
         * Returns the translation components (`e`, `f`) rounded to nine decimal places.
         *
         * @returns {number[]} A two-item array `[e, f]`.
         */
        offset() {
            return [this.e.toFixed(9), this.f.toFixed(9)];
        }

        /**
         * Compares the matrix with another instance within an optional tolerance.
         *
         * @param {Matrix} m - Matrix to compare against.
         * @param {number} [error] - Optional absolute tolerance per coefficient.
         * @returns {boolean} `true` if all coefficients match within the tolerance.
         */
        equals(m, error) {
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
        isIdentity() {
            return this.a === 1 && !this.b && !this.c && this.d === 1 &&
                !this.e && !this.f;
        }

        /**
         * Returns the matrix coefficients as an array `[a, b, c, d, e, f]`.
         *
         * @returns {number[]} Array of the six coefficients.
         */
        toArray() {
            return [this.a, this.b, this.c, this.d, this.e, this.f];
        }

        to2dArray() {
            return [[this.a, this.c, this.e], [this.b, this.d, this.f], [0, 0, 1]];
        }

        /**
         * Computes the determinant of the affine matrix.
         *
         * @returns {number} Determinant value (`a * d - b * c`).
         */
        determinant() {
            return this.a * this.d - this.b * this.c;
        }

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
        split(add_pre_translation) {
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
            out.scalex = Math.sqrt(norm(row[0]));
            normalize(row[0]);

            out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
            row[1] = [row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear];

            out.scaley = Math.sqrt(norm(row[1]));
            normalize(row[1]);
            out.shear /= out.scaley;

            if (this.determinant() < 0) {
                out.scalex = -out.scalex;
            }

            // rotation
            var sin = row[0][1],
                cos = row[1][1];
            if (cos < 0) {
                out.rotate = Snap.deg(Math.acos(cos));
                if (sin < 0) {
                    out.rotate = 360 - out.rotate;
                }
            } else {
                out.rotate = Snap.deg(Math.asin(sin));
            }

            out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
            out.isSuperSimple = !+out.shear.toFixed(9) && out.scalex.toFixed(9) == out.scaley.toFixed(9) && !out.rotate;
            out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
            return out;
        }

        /**
         * Provides a lightweight decomposition returning translation, rotation, and scale components.
         *
         * @returns {{dx:number, dy:number, r:number, scalex:number, scaley:number}} Simplified transform description.
         */
        split2() {
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
        toTransformString(shorter) {
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
        }

        /**
         * Identifies the object as a matrix instance.
         *
         * @returns {boolean} Always returns `true` for matrix instances.
         */
        isMatrix() {
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
        twoPointTransformMatrix(x1, y1, x1Prime, y1Prime, x2, y2, x2Prime, y2Prime) {
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
         * Splits a matrix into translation/scale and rotation/shear factors.
         *
         * @param {Matrix} [m=this] - Matrix to decompose.
         * @returns {{0:Matrix, 1:Matrix, trans_scale:Matrix, rot_shear:Matrix, scalex:number, scaley:number, rotate:number, shear:number, dx:number, dy:number}} Matrices and scalars describing the decomposition.
         */
        rotScaleSplit(m) {
            m = m || this;
            const split = m.split();
            const tm = new Matrix().translate(split.dx, split.dy);
            const rm = new Matrix().rotate(split.rotate);
            const scm = new Matrix().scale(split.scalex, split.scaley);
            const shm = new Matrix().skew(split.shear);

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
    }

    // Helper functions for Matrix
    function norm(a) {
        return a[0] * a[0] + a[1] * a[1];
    }

    function normalize(a) {
        var mag = Math.sqrt(norm(a));
        a[0] && (a[0] /= mag);
        a[1] && (a[1] /= mag);
    }

    Snap.registerType("matrix", Matrix);

    /**
     * General matrix operations for 2D array-based matrices.
     * @namespace Matrix.gen
     */
    Matrix.gen = {
        /**
         * Adds two matrices element-wise.
         * @param {number[][]|Matrix} A - First matrix as 2D array.
         * @param {number[][]|Matrix} B - Second matrix as 2D array with same dimensions as A.
         * @returns {number[][]} Result matrix C where C[i][j] = A[i][j] + B[i][j].
         */
        add: function(A, B) {
            if (A instanceof Matrix) {
                A = A.to2dArray();
            }
            if (B instanceof Matrix) {
                B = B.to2dArray();
            }
            if (!A || !B || !A.length || !B.length) {
                throw new Error("Invalid matrix input");
            }
            if (A.length !== B.length || A[0].length !== B[0].length) {
                throw new Error("Matrix dimensions must match for addition");
            }
            
            const rows = A.length;
            const cols = A[0].length;
            const C = [];
            
            for (let i = 0; i < rows; i++) {
                C[i] = [];
                for (let j = 0; j < cols; j++) {
                    C[i][j] = A[i][j] + B[i][j];
                }
            }
            
            return C;
        },
        
        /**
         * Multiplies two matrices.
         * @param {number[][]|Matrix} A - First matrix with dimensions m×n.
         * @param {number[][]|Matrix} B - Second matrix with dimensions n×p.
         * @returns {number[][]} Result matrix C with dimensions m×p where C[i][j] = Σ(A[i][k] * B[k][j]).
         */
        multiply: function(A, B) {
             if (A instanceof Matrix) {
                A = A.to2dArray();
            }
            if (B instanceof Matrix) {
                B = B.to2dArray();
            }
            if (!A || !B || !A.length || !B.length) {
                throw new Error("Invalid matrix input");
            }
            if (A[0].length !== B.length) {
                throw new Error("Matrix dimensions incompatible for multiplication: A columns must equal B rows");
            }
            
            const m = A.length;      // rows in A
            const n = A[0].length;   // cols in A, rows in B
            const p = B[0].length;   // cols in B
            const C = [];
            
            for (let i = 0; i < m; i++) {
                C[i] = [];
                for (let j = 0; j < p; j++) {
                    C[i][j] = 0;
                    for (let k = 0; k < n; k++) {
                        C[i][j] += A[i][k] * B[k][j];
                    }
                }
            }
            
            return C;
        },
        
        /**
         * Multiplies a matrix by a scalar.
         * @param {number} c - Scalar value.
         * @param {number[][]|Matrix} A - Matrix as 2D array.
         * @returns {number[][]} Result matrix C where C[i][j] = c * A[i][j].
         */
        cMultiply: function(c, A) {
             if (A instanceof Matrix) {
                A = A.to2dArray();
            }
            if (!A || !A.length) {
                throw new Error("Invalid matrix input");
            }
            
            const rows = A.length;
            const cols = A[0].length;
            const C = [];
            
            for (let i = 0; i < rows; i++) {
                C[i] = [];
                for (let j = 0; j < cols; j++) {
                    C[i][j] = c * A[i][j];
                }
            }
            
            return C;
        }
    };

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
    const math = Snap.window().math || {multiply: Snap.Matrix.gen.multiply};//if math.js not loaded, fallback to Snap,Matrix

    if (!BBox || !box) {
        throw new Error("Snap BBox extension must be loaded before the path extension.");
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
                if (command == "m" && tlen == 7) {
                    m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
                }
            }
        }
        return m;
    };

    const elproto = Element.prototype,
        is = Snap.is,
        clone = Snap._.clone,
        has = "hasOwnProperty",
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
        return path.join(",").replace(p2s, "$1");
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
            let x, y, p, l, sp = "";
            const subpaths = {};
            let point,
                len = 0;
            let i = 0;
            const ii = path.length;
            for (; i < ii; ++i) {
                p = path[i];
                if (p[0] == "M") {
                    x = +p[1];
                    y = +p[2];
                } else {
                    l = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                    if (len + l > length) {
                        if (subpath && !subpaths.start) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4],
                                p[5], p[6], length - len);
                            sp += [
                                "C" + O(point.start.x),
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
                                "M" + O(point.x),
                                O(point.y) + "C" + O(point.n.x),
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
        if (!Snap.is(p1x, "array")) {
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
                    ci = abs(di1.x - di.x) < .001 ? "y" : "x",
                    cj = abs(dj1.x - dj.x) < .001 ? "y" : "x",
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
            if (pi[0] == "M") {
                x1 = x1m = pi[1];
                y1 = y1m = pi[2];
            } else {
                if (pi[0] == "C") {
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
                    if (pj[0] == "M") {
                        x2 = x2m = pj[1];
                        y2 = y2m = pj[2];
                    } else {
                        if (pj[0] == "C") {
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
            interPathHelper(path, [["M", x, y], ["H", bbox.x2 + 10]], 1) % 2 == 1;
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
            if (p[0] == "M") {
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
                ["M", +x + +rx, y],
                ["l", w - rx * 2, 0],
                ["a", rx, ry, 0, 0, 1, rx, ry],
                ["l", 0, h - ry * 2],
                ["a", rx, ry, 0, 0, 1, -rx, ry],
                ["l", rx * 2 - w, 0],
                ["a", rx, ry, 0, 0, 1, -rx, -ry],
                ["l", 0, ry * 2 - h],
                ["a", rx, ry, 0, 0, 1, rx, -ry],
                ["z"],
            ];
        }
        const res = [["M", x, y], ["l", w, 0], ["l", 0, h], ["l", -w, 0], ["z"]];
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
                res = [["M", x1, y1], ["A", rx, rx, 0, +(a - ry > 180), 0, x2, y2]];
        } else {
            res = [
                ["M", x, y],
                ["m", 0, -ry],
                ["a", rx, ry, 0, 1, 1, 0, 2 * ry],
                ["a", rx, ry, 0, 1, 1, 0, -2 * ry],
                ["z"],
            ];
        }
        res.toString = toString;
        return res;
    }

    function groupPathStrict(el) {
        const children = el.getChildren();
        let comp_path = [],
            comp_path_string = "",
            pathfinder,
            child,
            path,
            m = new Snap.Matrix;

        for (var i = 0, max = children.length; i < max; ++i) {
            child = children[i];

            while (child.type == "use") { //process any use tags
                m = m.add(el.getLocalMatrix(STRICT_MODE).translate(el.attr("x") || 0, el.attr("y") || 0));
                if (child.original) {
                    child = child.original;
                } else {
                    const href = el.attr("xlink:href");
                    child = child.original = child.node.ownerDocument.getElementById(
                        href.substring(href.indexOf("#") + 1));
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
                return el.attr("d");
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
                return "M" + [
                    el.attr("x1") || 0,
                    el.attr("y1") || 0,
                    el.attr("x2"),
                    el.attr("y2")];
            },
            polyline: function (el) {
                return "M" + el.attr("points");
            },
            polygon: function (el) {
                return "M" + el.attr("points") + "z";
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
    getPath["clipPath"] = getPath["g"];

    function pathToRelative(pathArray) {
        const pth = paths(pathArray),
            lowerCase = String.prototype.toLowerCase;
        if (pth.rel) {
            return pathClone(pth.rel);
        }
        if (!Snap.is(pathArray, "array") ||
            !Snap.is(pathArray && pathArray[0], "array")) {
            pathArray = Snap.parsePathString(pathArray);
        }
        const res = [];
        let x = 0,
            y = 0,
            mx = 0,
            my = 0,
            start = 0;
        if (pathArray[0][0] == "M") {
            x = pathArray[0][1];
            y = pathArray[0][2];
            mx = x;
            my = y;
            start++;
            res.push(["M", x, y]);
        }
        let i = start;
        const ii = pathArray.length;
        for (; i < ii; ++i) {
            let r = res[i] = [];
            const pa = pathArray[i];
            if (pa[0] != lowerCase.call(pa[0])) {
                r[0] = lowerCase.call(pa[0]);
                switch (r[0]) {
                    case "a":
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +(pa[6] - x).toFixed(3);
                        r[7] = +(pa[7] - y).toFixed(3);
                        break;
                    case "v":
                        r[1] = +(pa[1] - y).toFixed(3);
                        break;
                    case "m":
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
                if (pa[0] == "m") {
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
                case "z":
                    x = mx;
                    y = my;
                    break;
                case "h":
                    x += +res[i][len - 1];
                    break;
                case "v":
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
        if (!is(pathArray, "array") || !is(pathArray && pathArray[0], "array")) { // rough assumption
            if (is(pathArray, "object") && pathArray.type) {
                pathArray = getPath[pathArray.type](pathArray);
            }
            pathArray = Snap.parsePathString(pathArray);
        }
        if (!pathArray || !pathArray.length) {
            return [["M", 0, 0]];
        }
        let res = [],
            x = 0,
            y = 0,
            mx = 0,
            my = 0,
            start = 0,
            pa0;
        if (pathArray[0][0] == "M") {
            x = +pathArray[0][1];
            y = +pathArray[0][2];
            mx = x;
            my = y;
            start++;
            res[0] = ["M", x, y];
        }
        const crz = pathArray.length == 3 &&
            pathArray[0][0] == "M" &&
            pathArray[1][0].toUpperCase() == "R" &&
            pathArray[2][0].toUpperCase() == "Z";
        let r, pa, i = start;
        const ii = pathArray.length;
        for (; i < ii; ++i) {
            res.push(r = []);
            pa = pathArray[i];
            pa0 = pa[0];
            if (pa0 != pa0.toUpperCase()) {
                r[0] = pa0.toUpperCase();
                switch (r[0]) {
                    case "A":
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +pa[6] + x;
                        r[7] = +pa[7] + y;
                        break;
                    case "V":
                        r[1] = +pa[1] + y;
                        break;
                    case "H":
                        r[1] = +pa[1] + x;
                        break;
                    case "R":
                        var dots = [x, y].concat(pa.slice(1));
                        for (var j = 2, jj = dots.length; j < jj; j++) {
                            dots[j] = +dots[j] + x;
                            dots[++j] = +dots[j] + y;
                        }
                        res.pop();
                        res = res.concat(catmullRom2bezier(dots, crz));
                        break;
                    case "O":
                        res.pop();
                        dots = ellipsePath(x, y, pa[1], pa[2]);
                        dots.push(dots[0]);
                        res = res.concat(dots);
                        break;
                    case "U":
                        res.pop();
                        res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                        r = ["U"].concat(res[res.length - 1].slice(-2));
                        break;
                    case "M":
                        mx = +pa[1] + x;
                        my = +pa[2] + y;
                    default:
                        for (j = 1, jj = pa.length; j < jj; j++) {
                            r[j] = +pa[j] + (j % 2 ? x : y);
                        }
                }
            } else if (pa0 == "R") {
                dots = [x, y].concat(pa.slice(1));
                res.pop();
                res = res.concat(catmullRom2bezier(dots, crz));
                r = ["R"].concat(pa.slice(-2));
            } else if (pa0 == "O") {
                res.pop();
                dots = ellipsePath(x, y, pa[1], pa[2]);
                dots.push(dots[0]);
                res = res.concat(dots);
            } else if (pa0 == "U") {
                res.pop();
                res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                r = ["U"].concat(res[res.length - 1].slice(-2));
            } else {
                let k = 0;
                const kk = pa.length;
                for (; k < kk; k++) {
                    r[k] = pa[k];
                }
            }
            pa0 = pa0.toUpperCase();
            if (pa0 != "O") {
                switch (r[0]) {
                    case "Z":
                        x = +mx;
                        y = +my;
                        break;
                    case "H":
                        x = r[1];
                        break;
                    case "V":
                        y = r[1];
                        break;
                    case "M":
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
            res = [m2, m3, m4].concat(res).join().split(",");
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
        if (typeof path2 === "boolean" || typeof path2 === "number") {
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
                    return ["C", d.x, d.y, d.x, d.y, d.x, d.y];
                }
                !(path[0] in {T: 1, Q: 1}) && (d.qx = d.qy = null);
                switch (path[0]) {
                    case "M":
                        d.X = path[1];
                        d.Y = path[2];
                        break;
                    case "A":
                        if (!expand_only || process_arc) path = ["C"].concat(
                            a2c.apply(0, [d.x, d.y].concat(path.slice(1))));
                        break;
                    case "S":
                        if (pcom == "C" || pcom == "S") { // In "S" case we have to take into account, if the previous command is C/S.
                            nx = d.x * 2 - d.bx;          // And reflect the previous
                            ny = d.y * 2 - d.by;          // command's control point relative to the current point.
                        } else {                            // or some else or nothing
                            nx = d.x;
                            ny = d.y;
                        }
                        path = ["C", nx, ny].concat(path.slice(1));
                        break;
                    case "T":

                        if (pcom == "Q" || pcom == "T") { // In "T" case we have to take into account, if the previous command is Q/T.
                            d.qx = d.x * 2 - d.qx;        // And make a reflection similar
                            d.qy = d.y * 2 - d.qy;        // to case "S".
                        } else {                            // or something else or nothing
                            d.qx = d.x;
                            d.qy = d.y;
                        }

                        if (expand_only) {
                            path = ["Q", d.qx, d.qy, path[1], path[2]];
                        } else {
                            path = ["C"].concat(
                                q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
                        }

                        break;
                    case "Q":
                        if (!expand_only) {
                            d.qx = path[1];
                            d.qy = path[2];
                            path = ["C"].concat(
                                q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
                        }
                        break;
                    case "L":
                        if (!expand_only) path = ["C"].concat(
                            l2c(d.x, d.y, path[1], path[2]));
                        break;
                    case "H":
                        if (expand_only) {
                            path = ["L", path[1], d.y];
                        } else {
                            path = ["C"].concat(l2c(d.x, d.y, path[1], d.y));
                        }

                        break;
                    case "V":
                        if (expand_only) {
                            path = ["L", d.x, path[1]];
                        } else {
                            path = ["C"].concat(l2c(d.x, d.y, d.x, path[1]));
                        }

                        break;
                    case "Z":
                        if (Math.abs(d.x - d.X) > ERROR
                            || Math.abs(d.y - d.Y) > ERROR) {
                            if (expand_only) {
                                path = ["L", d.X, d.Y];
                            } else {
                                path = ["C"].concat(l2c(d.x, d.y, d.X, d.Y));
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
                        pcoms1[i] = "A"; // if created multiple C:s, their original seg is saved
                        p2 && (pcoms2[i] = "A"); // the same as above
                        pp.splice(i++, 0, ["C"].concat(pi.splice(0, 6)));
                    }
                    pp.splice(i, 1);
                    ii = mmax(p.length, p2 && p2.length || 0);
                }
            },
            fixM = function (path1, path2, a1, a2, i) {
                if (path1 && path2 && path1[i][0] == "M" && path2[i][0] != "M") {
                    path2.splice(i, 0, ["M", a2.x, a2.y]);
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
                    case "C":
                    case "Q":
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
            pfirst = "", // temporary holder for original path command
            pcom = ""; // holder for previous path command of original path
        let filter = false, filter2 = false;
        for (var i = 0, ii = mmax(p.length, p2 && p2.length || 0); i < ii; ++i) {
            p[i] && (pfirst = p[i][0]); // save current path command

            if (pfirst != "C") // C is not saved yet, because it may be result of conversion
            {
                pcoms1[i] = pfirst; // Save current path command
                i && (pcom = pcoms1[i - 1]); // Get previous path command pcom
            }

            p[i] = processPath(p[i], attrs, pcom); // Previous path command is inputted to processPath

            if (!p[i]) {
                filter = true;
            }

            if (!expand_only) {
                if (pcoms1[i] != "A" && pfirst == "C") pcoms1[i] = "C"; // A is the only command
                // which may produce multiple C:s
                // so we have to make sure that C is also C in original path

                fixArc(p, i); // fixArc adds also the right amount of A:s to pcoms1
            }

            if (p2) { // the same procedures is done to p2
                p2[i] && (pfirst = p2[i][0]);
                if (pfirst != "C") {
                    pcoms2[i] = pfirst;
                    i && (pcom = pcoms2[i - 1]);
                }
                p2[i] = processPath(p2[i], attrs2, pcom);
                if (!p2[i]) {
                    filter2 = true;
                }
                if (!expand_only) {
                    if (pcoms2[i] != "A" && pfirst == "C") {
                        pcoms2[i] = "C";
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
        if (path === undefined || typeof path === "boolean") {
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
                case "M":
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
                case "L":
                    result.push([+command[1], +command[2]]);
                    break;
                case "Q":
                    if (!segment_points) {
                        result.push([+command[1], +command[2]]);
                    }
                    result.push([+command[3], +command[4]]);
                    break;
                case "C":
                    if (!segment_points) {
                        result.push([+command[1], +command[2]]);
                        result.push([+command[3], +command[4]]);
                    }
                    result.push([+command[5], +command[6]]);
                    break;
                case "A":
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
        if (path.type === "polygon" || path.type === "polyline" || path.type === "line") return true;
        if (path.type !== "path") return false;

        if (isCompound(path)) return false;
        let path_instr = path2curve(path, undefined, true);
        const coms = ["m", "l", "z"];
        for (let i = 0; i < path_instr.length; i++) {
            if (coms.indexOf(path_instr[i][0].toLowerCase()) === -1) return false;
        }
        return true;
    }

    function near(p1, p2) {
        return Math.abs(p1.x - p2.x) < 1e-8 && Math.abs(p1.y - p2.y) < 1e-8;
    }

    function getPointSample(path, sample) {
        if (!path || typeof path === "number") {
            sample = path;
            path = this;
        }
        if (path.type !== "path") return null;

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
                "C",
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
        if (type === "path") return (string_only) ? el.attr("d") : el;
        if (!getPath.hasOwnProperty(type)) return null;

        const d = getPath[type](el);

        if (string_only) return d;

        const path = el.paper.path(d);
        el.after(path);

        if (el.getGeometryAttr) {
            //This assumes iaDesigner
            const attrs = el.attrs(el.getGeometryAttr(), true); //Copy all attributes except the geometry ones
            attrs.id = el.getId() + "_path";
            path.attr(attrs);
        }

        return path;
    };

    function isCompound(path) {
        if (!path) path = this;
        if (typeof path === "object" && path.type && path.type ===
            "path") path = path.attr("d");
        if (typeof path !== "string" && !Array.isArray(path)) return false;
        let segs = Array.isArray(path) ? path : pathToAbsolute(path);
        segs = segs.filter(function (instr) {
            return instr[0] == "M" || instr[0] == "m";
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
        let ret_type = (typeof path === "string") ? "string" : "array";
        if (typeof path === "object" && path.type && path.type ===
            "path") path = path.attr("d");
        if (typeof path !== "string" && !Array.isArray(path)) return null;
        let segs = Array.isArray(path) ? path : pathToAbsolute(path);

        const result = [];
        try {
            for (let i = 0, l = segs.length, instr, part; i < l; ++i) {
                instr = segs[i];
                if (instr[0] == "M" || instr[0] == "m") {
                    path = [instr];
                    result.push(path);
                } else {
                    path.push(instr);
                }
            }
        } catch (e) {
            return null;
        }

        if (ret_type === "string") {
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

        let points = (Array.isArray(el)) ? el : el.attr("points");

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
        if (this.type === "path" && this.node.getTotalLength) {
            return this.node.getTotalLength();
        }

        if (this.type === "polyline") {
            return polygonLength(this);
        }

        if (this.type === "polygon") {
            return polygonLength(this, true);
        }

        if (this.type === "rect") {
            const x = this.attr("x"),
                y = this.attr("y"),
                w = this.attr("width"),
                h = this.attr("height");

            return polygonLength([x, y, x + w, y, x + w, y + h, x, y + h], true,
                this.getLocalMatrix());
        }

        if (this.type === "line") {
            let x1 = +this.attr("x1"),
                y1 = +this.attr("y1"),
                x2 = +this.attr("x2"),
                y2 = +this.attr("y2");

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
        if (this.type === "ellipse") {
            //using Ramanujan approximation
            let rx = +this.attr("rx"),
                ry = +this.attr("ry");

            const h = (rx - ry) ** 2 / (rx + ry) ** 2;

            return Math.PI * (rx + ry) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h)));

        }

        if (this.type === "cirle") {
            let r = +this.attr("r");

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
        return Snap.path.getSubpath(this.attr("d"), from, to);
    };

    PathPoint.MIDDLE = "mid";//0;
    PathPoint.END = "end"; //1;
    PathPoint.START = "start"; //2;
    PathPoint.START_END = "start_end"; //3;

    PathPoint.CORNER = "corner"; //1;
    PathPoint.SMOOTH = "smooth"; //2;
    PathPoint.SYMMETRIC = "symmetric"; //3;

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

            if (seg[0] === "M") {
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
            getter = X[0].hasOwnProperty("x") ? function (i) {
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

Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {

    ///////////////// Bezier Library

    //Based on https://github.com/Pomax/bezierjs
    /**
     * Creates a Bezier curve instance from a flexible set of coordinate inputs.
     *
     * Accepts:
     * 1. An array of `{x, y, z?}` control points (2D or 3D).
     * 2. A flat numeric array in the order `x1, y1, x2, y2, ...`.
     * 3. Individual numeric arguments matching the flat array forms above.
     *
    * @constructor
    * @param {...any} coords Control points defining the curve.
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

    /**
     * Creates a Bezier curve from an SVG path segment string (`C`/`c` or `Q`/`q`).
     * @param {string} svgString SVG path command string containing curve coordinates.
     * @returns {Bezier} New Bezier instance representing the parsed curve.
     */
    Bezier.fromSVG = function (svgString) {
        let list = svgString.match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g).map(parseFloat);
        const relative = /[cq]/.test(svgString);
        if (!relative) return new Bezier(list);
        list = list.map(function (v, i) {
            return i < 2 ? v : v + list[i % 2];
        });
        return new Bezier(list);
    };

    /**
     * Computes helper points used when fitting curves through three constraints.
     * @param {number} n Curve order (2 for quadratic, 3 for cubic).
    * @param {Point2D} S Start point.
    * @param {Point2D} B Through point.
    * @param {Point2D} E End point.
     * @param {number} [t=0.5] Parameter position of the through point.
    * @returns {{A: Point2D, B: Point2D, C: Point2D}} Helper points.
     */
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

    /**
     * Fits a quadratic Bezier curve through three points with an optional parameter for the middle point.
    * @param {Point2D} p1 Start point.
    * @param {Point2D} p2 Through point.
    * @param {Point2D} p3 End point.
     * @param {number} [t=0.5] Parameter value of `p2` along the curve.
     * @returns {Bezier} New quadratic Bezier passing through the provided points.
     */
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

    /**
     * Fits a cubic Bezier curve through a start/through/end configuration.
    * @param {Point2D} S Start point.
    * @param {Point2D} B Through point.
    * @param {Point2D} E End point.
     * @param {number} [t=0.5] Parameter value describing where `B` lies along the curve.
     * @param {number} [d1] Tangent distance from the start point; used to adjust curvature.
     * @returns {Bezier} New cubic Bezier matching the constraints.
     */
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

    /**
     * Exposes the internal utility helpers backing the Bezier implementation.
     * @returns {Object} Collection of utility functions used by the Bezier library.
     */
    const getUtils = function () {
        return utils;
    };

    Bezier.getUtils = getUtils;

    Bezier.prototype = {
        /**
         * Returns the shared Bezier utility helpers.
         * @returns {Object}
         */
        getUtils: getUtils,
        /**
         * Returns the curve representation when coerced to a primitive.
         * @returns {string}
         */
        valueOf: function () {
            return this.toString();
        },
        /**
         * Serialises the curve control points into a string.
         * @param {string} [point_sep] Optional separator inserted between points.
         * @returns {string} String representation of the control points.
         */
        toString: function (point_sep) {
            return utils.pointsToString(this.points, point_sep);
        },
        /**
         * Creates a duplicate of the current curve.
         * @returns {Bezier} New Bezier instance with copied control points.
         */
        clone: function () {
            return new Bezier(this.points.slice());
        },
        /**
         * Serialises the curve to an SVG path command string.
         * @param {boolean} [relative=false] Whether to keep coordinates relative (currently unused).
         * @returns {string|false} SVG string for 2D curves or `false` when exporting 3D curves.
         */
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

    /**
     * Rebuilds cached derivative points and directional metadata after control point changes.
     */
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

    /**
     * Computes the clockwise orientation of the curve based on the first segment.
     */
    computedirection: function () {
            const points = this.points;
            const angle = utils.angle(points[0], points[this.order], points[1]);
            this.clockwise = angle > 0;
        },

    /**
     * Calculates the curve length using numeric approximation for non-linear curves.
     * @returns {number} Curve length in coordinate units.
     */
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
    /**
     * Generates a lookup table of curve points for fast approximations.
     * @param {number} [steps=100] Number of segments to precompute.
    * @returns {Point3DList} Array of sampled points along the curve.
     */
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
    /**
     * Tests whether a given point lies on the curve within an error threshold.
    * @param {Point2D} point Point to test.
     * @param {number} [error=5] Allowed deviation in coordinate units.
     * @returns {false|number} False when outside tolerance, or average parameter value when hit(s) found.
     */
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

    /**
     * Projects a point onto the curve and returns the closest position.
    * @param {Point2D} point External point to project.
    * @returns {{x: number, y: number, z: (number|undefined), t: number, d: number}} Closest point with parameter `t` and distance `d`.
     */
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

        /**
         * Alias for {@link Bezier#compute}.
         * @param {number} t Parameter in [0, 1].
         * @returns {Point3D} Point on the curve.
         */
        get: function (t) {
            return this.compute(t);
        },
        /**
         * Returns the control point at the specified index.
         * @param {number} idx Control point index.
         * @returns {Point3D}
         */
        point: function (idx) {
            return this.points[idx];
        },
        /**
         * Returns the starting control point.
         * @returns {Point3D}
         */
        first: function () {
            return this.points[0];
        },
        /**
         * Returns the end control point.
         * @returns {Point3D}
         */
        last: function () {
            return this.points[this.points.length - 1];
        },
        /**
         * Returns the last control handle preceding the end point.
         * @returns {Point3D}
         */
        lastTarget: function () {
            return this.points[this.points.length - 2]
        },
        /**
         * Returns the first control handle following the start point.
         * @returns {Point3D}
         */
        firstTarget: function () {
            return this.points[1]
        },
        /**
         * Evaluates the curve at the provided parameter value.
         * @param {number} t Parameter in [0, 1].
         * @returns {Point3D} Point on the curve.
         */
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
        /**
         * Approximates the parameter whose arc length equals the provided distance.
         * @param {number} length Target arc length along the curve.
         * @param {number} [precision=1] Desired precision in coordinate units.
         * @param {number} [tot_length] Optional cached total length.
         * @returns {number} Parameter value in [0, 1].
         */
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
    /**
     * Returns the point lying at the specified arc length along the curve.
     * @param {number} length Target arc length from the start of the curve.
     * @param {number} [precision=1] Precision forwarded to {@link Bezier#tAtLength}.
    * @returns {{x: number, y: number, z: (number|undefined), alpha: number}} Point with tangent angle in degrees.
     */
    getPointAtLength(length, precision) {
            let t = this.tAtLength(length, precision);
            let p = this.compute(t);
            let der = this.derivative(t);
            p.alpha = 180 + 90 - Math.atan2(der.x, der.y) * 180 / Math.PI;
            return p;
        },
    /**
     * Elevates the degree of the curve by one while preserving its shape.
     * @returns {Bezier} Raised-degree curve instance.
     */
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
    /**
     * Evaluates the first derivative at parameter `t`.
     * @param {number} t Parameter in [0, 1].
    * @returns {Point3D} Tangent vector at the specified parameter.
     */
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
        /**
         * Computes the inflection parameters for the curve.
         * @returns {Array<number>} Parameter values where inflections occur.
         */
        inflections: function () {
            return utils.inflections(this.points);
        },
        /**
         * Returns the normal vector for the curve at parameter `t`.
         * @param {number} t Parameter in [0, 1].
         * @returns {Point3D} Normalised normal vector.
         */
        normal: function (t) {
            return this._3d ? this.__normal3(t) : this.__normal2(t);
        },
        /**
         * Computes the 2D unit normal at parameter `t`.
         * @private
         * @param {number} t Parameter in [0, 1].
         * @returns {Point2D}
         */
        __normal2: function (t) {
            const d = this.derivative(t);
            const q = sqrt(d.x * d.x + d.y * d.y);
            return {x: -d.y / q, y: d.x / q};
        },
        /**
         * Computes the 3D unit normal at parameter `t` using a nearby tangent.
         * @private
         * @param {number} t Parameter in [0, 1].
         * @returns {Point3D}
         */
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
    /**
     * Returns the intermediate hull points generated by the de Casteljau algorithm.
     * @param {number} t Parameter in [0, 1].
    * @returns {Point3DList} Sequence of hull points.
     */
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
    /**
     * Splits the curve at `t1` (and optionally `t2`) returning the resulting sub-curves.
     * @param {number} t1 First split parameter.
     * @param {number} [t2] Optional second parameter to extract the middle segment.
     * @returns {{left:Bezier,right:Bezier}|Bezier} Pair of curves or a single middle segment when `t2` supplied.
     */
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

    /**
    * Calculates the curve extrema in each dimension.
    * @returns {ExtremaCollection} Extrema parameter collections.
     */
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

    /**
    * Returns the axis-aligned bounding box for the curve.
    * @returns {Range3D}
     */
    bbox: function () {
            const extrema = this.extrema(), result = {};
            this.dims.forEach(function (d) {
                result[d] = utils.getminmax(this, d, extrema[d]);
            }.bind(this));
            return result;
        },

        /**
         * Tests whether two curves' bounding boxes overlap.
         * @param {Bezier} curve Curve to compare against.
         * @returns {boolean} True when the bounding boxes overlap.
         */
        overlaps: function (curve) {
            const lbbox = this.bbox(),
                tbbox = curve.bbox();
            return utils.bboxoverlap(lbbox, tbbox);
        },

        /**
         * Offsets the curve by a distance or generates offset segments across its length.
         * @param {number} t Parameter or offset distance depending on usage.
         * @param {number} [d] Optional explicit distance when sampling a point offset.
         * @returns {Array.<Bezier>|OffsetGeometry} Offset geometry.
         */
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

    /**
     * Determines whether the curve is simple (monotonic enough for offsetting).
     * @returns {boolean} True when the curve is considered simple.
     */
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

    /**
     * Splits the curve into simple segments suitable for offsetting and intersections.
     * @returns {Array<Bezier>} Array of simple sub-curves covering the original curve.
     */
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

    /**
     * Reverses the order of control points and updates cached data.
     */
    reverse: function () {
            this.points.reverse();
            this.update();
            if (this._lut && this._lut.length > 0) this._lut = this._lut.reverse();
        },

    /**
     * Scales (offsets) the curve by a uniform distance or distance function.
     * @param {number|Function} d Constant offset distance or function returning distance per parameter.
     * @returns {Bezier} New curve scaled away from the original.
     */
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

    /**
     * Builds an outline polygon around the curve, optionally with graduated offsets.
     * @param {number} d1 Leading-side offset distance.
     * @param {number} [d2=d1] Trailing-side offset distance.
     * @param {number} [d3] Leading offset at the end of the curve for graduated outlines.
     * @param {number} [d4] Trailing offset at the end of the curve for graduated outlines.
     * @returns {PolyBezier} PolyBezier describing the outline.
     */
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
    /**
     * Generates closed outline shapes for the curve.
     * @param {number} d1 Leading offset distance.
     * @param {number} [d2=d1] Trailing offset distance.
     * @returns {Array<Object>} Shape descriptors representing the outlined regions.
     */
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

    /**
     * Computes intersections between this curve and another curve or line.
    * @param {(Bezier|Point2DList)} [curve] Curve or line to test; omitted for self-intersections.
     * @returns {Array<Object>} Intersection descriptors.
     */
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

    /**
     * Finds intersections between the curve and a line segment.
    * @param {{p1: Point2D, p2: Point2D}|Point2DList} line Line definition.
     * @returns {Array<number>} Parameter values of intersections along the curve.
     */
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

    /**
     * Finds self-intersections in the curve.
     * @returns {Array<Object>} Intersection descriptors.
     */
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

    /**
     * Calculates intersections between two arrays of Bezier segments.
     * @param {Array<Bezier>} c1 First set of segments.
     * @param {Array<Bezier>} c2 Second set of segments.
     * @returns {Array<Object>} Intersection descriptors.
     */
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

    /**
     * Approximates the curve with circular arcs.
     * @param {number} [errorThreshold=0.5] Maximum allowed deviation.
     * @returns {Array<Object>} Arc descriptors approximating the curve.
     */
    arcs: function (errorThreshold) {
            errorThreshold = errorThreshold || 0.5;
            const circles = [];
            return this._iterate(errorThreshold, circles);
        },
        /**
         * Computes the approximation error for a proposed arc segment.
         * @private
         * @param {Point2D} pc Candidate circle centre.
         * @param {Point2D} np1 Start point of the segment.
         * @param {number} s Start parameter.
         * @param {number} e End parameter.
         * @returns {number} Combined deviation from the circle.
         */
        _error: function (pc, np1, s, e) {
            const q = (e - s) / 4,
                c1 = this.get(s + q),
                c2 = this.get(e - q),
                ref = utils.dist(pc, np1),
                d1 = utils.dist(pc, c1),
                d2 = utils.dist(pc, c2);
            return abs(d1 - ref) + abs(d2 - ref);
        },
        /**
         * Iteratively fits arc segments to the curve.
         * @private
         * @param {number} errorThreshold Maximum allowed deviation.
         * @param {Array<Object>} circles Accumulator for generated arcs.
         * @returns {Array<Object>} Collection of fitted arcs.
         */
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
     * Constructs a poly-bezier wrapper around multiple curve segments.
     * @param {Array<Bezier|Array>} [curves] Collection of Bezier instances or control point arrays.
     * @constructor
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
        /**
         * Returns the SVG path representation when coerced to a primitive.
         * @returns {string}
         */
        valueOf: function () {
            return this.toString();
        },
        /**
         * Serialises the poly-bezier into an SVG path string.
         * @returns {string}
         */
        toString: function () {
            const res = this.curves.map((c) => c.toString());
            return res.join(' ');
        },
        /**
         * Produces a deep copy of the poly-bezier.
         * @returns {PolyBezier}
         */
        clone: function () {
            return new PolyBezier(this.curves.map((bz) => bz.clone()));
        },
        /**
         * Converts the poly-bezier into a valid SVG path command string.
         * @returns {string}
         */
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
        /**
         * Returns the control points for each constituent curve.
         * @returns {Array.<Point3DList>}
         */
        getPoints: function () {
            return this.curves.map((bz) => bz.points);
        },
        /**
         * Returns the first control point across all curves.
         * @returns {Point3D}
         */
        getFirstPoint: function () {
            return this.curves[0].points[0];
        },
        /**
         * Returns the final control point across all curves.
         * @returns {Point3D}
         */
        getLastPoint: function () {
            let c = this.curves[this.curves.length - 1];
            return c.points[c.order];
        },
        /**
         * Appends a curve to the collection.
         * @param {Bezier} curve Curve to add.
         */
        addCurve: function (curve) {
            this.curves.push(curve);
            this._3d = this._3d || curve._3d;
        },
        /**
         * Computes the combined length of all curve segments.
         * @returns {number}
         */
        length: function () {
            return this.curves.map(function (v) {
                return v.length();
            }).reduce(function (a, b) {
                return a + b;
            });
        },
    /**
     * Samples a point along the poly-bezier at a specified arc length.
     * @param {number} length Arc length from the start of the poly-bezier.
     * @param {number} [precision=1] Precision forwarded to segment sampling.
    * @returns {{x: number, y: number, z: (number|undefined), alpha: number}|null} Point or `null` when length exceeds total.
     */
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
        /**
         * Retrieves the curve at the provided index.
         * @param {number} idx Segment index.
         * @returns {Bezier}
         */
        curve: function (idx) {
            return this.curves[idx];
        },
        /**
         * Calculates the bounding box over all curve segments.
         * @returns {Range3D}
         */
        bbox: function () {
            const c = this.curves;
            const bbox = c[0].bbox();
            for (let i = 1; i < c.length; ++i) {
                utils.expandbox(bbox, c[i].bbox());
            }
            return bbox;
        },
    /**
     * Offsets every segment by the specified distance and returns a new poly-bezier.
     * @param {number} d Offset distance.
     * @returns {PolyBezier}
     */
    offset: function (d) {
            let offset = [];
            this.curves.forEach(function (v) {
                offset = offset.concat(v.offset(d));
            });
            return new PolyBezier(offset);
        },
    /**
     * Finds intersections between the poly-bezier and a line segment.
    * @param {{p1: Point2D, p2: Point2D}|Point2DList} line Line definition.
    * @returns {Array.<{curve: Bezier, t: number, i: number}>}
     */
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
    /**
     * Finds intersections between the poly-bezier and another curve.
     * @param {Bezier|PolyBezier} curve Target curve.
    * @returns {Array.<{curve: Bezier, t: number, i: number}>}
     */
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
    /**
     * Reverses the order of all curve segments and their control points.
     */
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
        /**
         * Returns the instance itself for API symmetry.
         * @returns {PolyBezier}
         */
        toPolyBezier: function () {
            return this;
        },
        /**
         * Returns the raw array of underlying Bezier curves.
         * @returns {Array<Bezier>}
         */
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


/**
 * @fileoverview Polygon intersection and geometric operations library
 * Based on https://github.com/vrd/js-intersect
 * Provides functions for polygon intersection, point-in-polygon testing, and related geometric calculations.
 * 
 * @typedef {Object} Point
 * @property {Number} x - X coordinate
 * @property {Number} y - Y coordinate
 * @property {Number} [t] - Parametric position along edge (0-1)
 * @property {Number} [theta] - Polar angle for point classification
 * 
 * @typedef {Array<Point>} Polygon
 * Array of points representing polygon vertices in order
 * 
 * @typedef {Array<Point>} Edge
 * Array of exactly two points representing an edge
 */

//code based on https://github.com/vrd/js-intersect

Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    /**
     * Namespace for polygon-related operations
     * @namespace Snap.polygons
     */
    Snap.polygons = Snap.polygons || {}
    
    /**
     * Finds the intersection of two polygons
     * @function intersect
     * @memberof Snap.polygons
     * @param {Array<Point>} fig1 - First polygon as array of points
     * @param {Array<Point>} fig2 - Second polygon as array of points
     * @returns {Array<Array<Point>>|false} Array of intersection polygons or false if no intersection
     * @example
     * const poly1 = [{x: 0, y: 0}, {x: 10, y: 0}, {x: 10, y: 10}, {x: 0, y: 10}];
     * const poly2 = [{x: 5, y: 5}, {x: 15, y: 5}, {x: 15, y: 15}, {x: 5, y: 15}];
     * const intersection = Snap.polygons.intersect(poly1, poly2);
     */
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

    /**
     * Aligns vertices of one polygon with vertices of another polygon within tolerance
     * @function alignPolygon
     * @private
     * @param {Array<Point>} polygon - Polygon to align
     * @param {Array<Point>} points - Reference points for alignment
     * @returns {Array<Point>} Aligned polygon
     */
    function alignPolygon(polygon, points) {
        for (let i = 0; i < polygon.length; i++) {
            for (let j = 0; j < points.length; j++) {
                if (distance(polygon[i], points[j]) < 0.00000001)
                    polygon[i] = points[j];
            }
        }
        return polygon;
    }

    /**
     * Calculates Euclidean distance between two points
     * @function distance
     * @private
     * @param {Point} p1 - First point
     * @param {Point} p2 - Second point
     * @returns {Number} Distance between the points
     */
    function distance(p1, p2) {
        const dx = Math.abs(p1.x - p2.x);
        const dy = Math.abs(p1.y - p2.y);
        return Math.sqrt(dx*dx + dy*dy);
    }

    /**
     * Validates that polygons have at least 3 vertices
     * @function checkPolygons
     * @private
     * @param {Array<Point>} fig1 - First polygon
     * @param {Array<Point>} fig2 - Second polygon
     * @returns {Boolean} True if both polygons are valid, false otherwise
     */
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

    /**
     * Creates array of all polygon edges with intersection points
     * @function edgify
     * @private
     * @param {Array<Point>} fig1 - First polygon
     * @param {Array<Point>} fig2 - Second polygon
     * @returns {Array<Array<Point>>} Array of edge segments
     */
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

    /**
     * Adds new unique points to a points array
     * @function addNewPoints
     * @private
     * @param {Array<Point>} newPoints - Points to add
     * @param {Array<Point>} points - Existing points array
     */
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

    /**
     * Sorts points along an edge by their parametric position (t value)
     * @function sortPoints
     * @private
     * @param {Array<Point>} points - Points with t values to sort
     * @returns {Array<Point>} Sorted points array
     */
    function sortPoints(points) {
        const p = points;
        p.sort((a,b) => {
            if (a.t > b.t) return 1;
            if (a.t < b.t) return -1;
        });
        return p;
    }

    /**
     * Converts polygon vertices to array of edges
     * @function getEdges
     * @private
     * @param {Array<Point>} fig - Polygon vertices
     * @returns {Array<Array<Point>>} Array of edges, each edge is array of two points
     */
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

    /**
     * Finds intersection points between two edges
     * @function findEdgeIntersection
     * @private
     * @param {Array<Point>} edge1 - First edge as array of two points
     * @param {Array<Point>} edge2 - Second edge as array of two points
     * @returns {Array<Point>} Array of intersection points with t parameter
     */
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

    /**
     * Classifies position of a point relative to an edge
     * @function classifyPoint
     * @private
     * @param {Point} p - Point to classify
     * @param {Array<Point>} edge - Edge as array of two points
     * @returns {Object} Classification result with location and theta/t values
     */
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

    /**
     * Calculates polar angle of an edge in degrees
     * @function polarAngle
     * @private
     * @param {Array<Point>} edge - Edge as array of two points
     * @returns {Number|Boolean} Angle in degrees or false if zero-length edge
     */
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

    /**
     * Checks if a point exists in an array of points
     * @function pointExists
     * @private
     * @param {Point} p - Point to check
     * @param {Array<Point>} points - Array of points to search
     * @returns {Boolean} True if point exists, false otherwise
     */
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

    /**
     * Checks if an edge exists in an array of edges
     * @function edgeExists
     * @private
     * @param {Array<Point>} e - Edge to check
     * @param {Array<Array<Point>>} edges - Array of edges to search
     * @returns {Boolean} True if edge exists, false otherwise
     */
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

    /**
     * Compares two edges for equality (considering both directions)
     * @function equalEdges
     * @private
     * @param {Array<Point>} edge1 - First edge
     * @param {Array<Point>} edge2 - Second edge
     * @returns {Boolean} True if edges are equal, false otherwise
     */
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

    /**
     * Creates polygons from an array of edges using edge-following algorithm
     * @function polygonate
     * @private
     * @param {Array<Array<Point>>} edges - Array of edges
     * @returns {Array<Array<Point>>} Array of polygons found
     */
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

    /**
     * Checks if a polygon already exists in an array of polygons
     * @function polygonExists
     * @private
     * @param {Array<Point>} polygon - Polygon to check
     * @param {Array<Array<Point>>} polygons - Array of polygons to search
     * @returns {Boolean} True if polygon exists, false otherwise
     */
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

    /**
     * Filters polygons based on intersection mode and position relative to input polygons
     * @function filterPolygons
     * @private
     * @param {Array<Array<Point>>} polygons - Array of polygons to filter
     * @param {Array<Point>} fig1 - First input polygon
     * @param {Array<Point>} fig2 - Second input polygon
     * @param {String} mode - Filter mode: "intersect", "cut1", "cut2", or "sum"
     * @returns {Array<Array<Point>>} Filtered polygons array
     */
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

    /**
     * Removes polygons smaller than minimum area threshold
     * @function removeSmallPolygons
     * @private
     * @param {Array<Array<Point>>} polygons - Array of polygons
     * @param {Number} minSize - Minimum area threshold
     * @returns {Array<Array<Point>>} Array of polygons above threshold
     */
    function removeSmallPolygons(polygons, minSize) {
        const big = [];
        for (let i = 0; i < polygons.length; i++) {
            if (polygonArea(polygons[i]) >= minSize) {
                big.push(polygons[i]);
            }
        }
        return big;
    }

    /**
     * Calculates the area of a polygon using the shoelace formula
     * @function polygonArea
     * @memberof Snap.polygons
     * @param {Array<Point>} p - Polygon vertices
     * @returns {Number} Area of the polygon
     * @example
     * const square = [{x: 0, y: 0}, {x: 10, y: 0}, {x: 10, y: 10}, {x: 0, y: 10}];
     * const area = Snap.polygons.polygonArea(square); // Returns 100
     */
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

    /**
     * Finds a point guaranteed to be inside a polygon
     * @function getPointInsidePolygon
     * @private
     * @param {Array<Point>} polygon - Polygon vertices
     * @returns {Point|undefined} Point inside polygon or undefined if none found
     */
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

    /**
     * Gets the bounding box dimensions of a polygon
     * @function getSize
     * @private
     * @param {Array<Point>} polygon - Polygon vertices
     * @returns {Object} Object with min/max x and y coordinates
     */
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

    /**
     * Tests if a point is inside a polygon using ray casting algorithm
     * @function findPointInsidePolygon
     * @memberof Snap.polygons
     * @param {Point|Array<Number>} point - Point to test (object with x,y or array [x,y])
     * @param {Array<Point>} polygon - Polygon vertices
     * @param {Boolean} [count_side] - Whether to count points on polygon boundary as inside
     * @returns {Boolean} True if point is inside polygon, false otherwise
     * @example
     * const polygon = [{x: 0, y: 0}, {x: 10, y: 0}, {x: 10, y: 10}, {x: 0, y: 10}];
     * const isInside = Snap.polygons.pointInPolygon({x: 5, y: 5}, polygon); // Returns true
     */
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

    /**
     * Calculates midpoints of all edges
     * @function getMidpoints
     * @private
     * @param {Array<Array<Point>>} edges - Array of edges
     * @returns {Array<Point>} Array of midpoints
     */
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

    /**
     * Debug utility function to log objects as JSON
     * @function log
     * @private
     * @param {*} obj - Object to log
     */
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
},{"dup":4,"robust-linear-solve":17}],3:[function(require,module,exports){
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
},{"incremental-convex-hull":5,"uniq":26}],4:[function(require,module,exports){
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
},{"robust-orientation":18,"simplicial-complex":22}],6:[function(require,module,exports){
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
var support = require('./support.js');

var ARRAY_BUFFER_SUPPORT = support.ARRAY_BUFFER_SUPPORT;
var SYMBOL_SUPPORT = support.SYMBOL_SUPPORT;

/**
 * Function able to iterate over almost any iterable JS value.
 *
 * @param  {any}      iterable - Iterable value.
 * @param  {function} callback - Callback function.
 */
module.exports = function forEach(iterable, callback) {
  var iterator, k, i, l, s;

  if (!iterable) throw new Error('obliterator/forEach: invalid iterable.');

  if (typeof callback !== 'function')
    throw new Error('obliterator/forEach: expecting a callback.');

  // The target is an array or a string or function arguments
  if (
    Array.isArray(iterable) ||
    (ARRAY_BUFFER_SUPPORT && ArrayBuffer.isView(iterable)) ||
    typeof iterable === 'string' ||
    iterable.toString() === '[object Arguments]'
  ) {
    for (i = 0, l = iterable.length; i < l; i++) callback(iterable[i], i);
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

    while (((s = iterator.next()), s.done !== true)) {
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
};

},{"./support.js":14}],14:[function(require,module,exports){
exports.ARRAY_BUFFER_SUPPORT = typeof ArrayBuffer !== 'undefined';
exports.SYMBOL_SUPPORT = typeof Symbol !== 'undefined';

},{}],15:[function(require,module,exports){
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
},{}],16:[function(require,module,exports){
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
},{"robust-compress":15,"robust-scale":19,"robust-sum":21,"two-product":23}],17:[function(require,module,exports){
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
},{"robust-determinant":16}],18:[function(require,module,exports){
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
},{"robust-scale":19,"robust-subtract":20,"robust-sum":21,"two-product":23}],19:[function(require,module,exports){
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
},{"two-product":23,"two-sum":24}],20:[function(require,module,exports){
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
},{}],21:[function(require,module,exports){
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
},{}],22:[function(require,module,exports){
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

},{"bit-twiddle":1,"union-find":25}],23:[function(require,module,exports){
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
},{}],24:[function(require,module,exports){
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
},{}],25:[function(require,module,exports){
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
},{}],26:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    const _voronoi = require("./voronoi.js");
    const KDTree = require('mnemonist/kd-tree');

    /**
     * Lightweight wrapper around Voronoi diagram results, providing helpers to access faces and dual triangles.
     *
     * Instances are produced by {@link Snap.voronoi} and expose a familiar API to iterate over Voronoi polygons,
     * query Delaunay triangles, and bridge between both representations.  The wrapper keeps the original input
     * points alongside derived structures so downstream code can be purely geometric without re-shaping data.
     *
     * Typical usage pairs polygon queries with rendering helpers, for example highlighting the Voronoi cell of a
     * selected anchor or generating adjacency graphs for interaction design.
     *
     * @constructor
     * @param {Array<Array<number>>|Array<{x:number,y:number}>} points Input points used to build the Voronoi diagram.
     * @param {Array<Array<number>>} cells Voronoi cell definitions referencing indices in {@link positions}.
     * @param {Array<Array<number>>|Array<{x:number,y:number}>} positions Coordinates of Voronoi vertices.
     * @param {Array<Array<number>>} triangles Delaunay triangles backing the Voronoi diagram (may contain -1 for infinity).
     */
    function Voronoi(points, cells, positions, triangles) {
        this.cells = cells;
        this.positions = positions;
        this.triangles = triangles;
        this.points = points;
        this.length = cells.length;
    }

    /**
     * Gets a Voronoi polygon for a specific point or all polygons when no index is provided.
     *
     * The polygons are returned as raw coordinate arrays so they can be rendered directly with Snap paths
     * or consumed by computational geometry utilities.  When called without arguments the method eagerly
     * materialises every cell in order, which is handy when building hit-testing structures or exporting
     * the entire diagram to JSON.
     *
     * @param {number} [index] Target point index. Omit to retrieve polygons for all input points.
     * @returns {Array<Array<number>>|Array<Array<Array<number>>>|undefined} Polygon vertices or list of polygons, or `undefined` when index is out of range.
     * @example
     * const vor = Snap.voronoi([[0, 0], [50, 20], [20, 80]]);
     * const polygon = vor.getPolygon(1); // -> [[...x,y], ...]
     * const allPolygons = vor.getPolygon();
     */
    Voronoi.prototype.getPolygon = function (index) {

        if (index === undefined) {
            const ret = [];
            for (let i = 0; i < this.length; ++i) {
                ret.push(this.getPolygon(i))
            }
            return ret;
        }

        if (index >= this.length) return;
        let cell = this.cells[index];
        cell = cell.filter((v) => v !== -1)
        const map = cell.map((p_inx) => {
            return this.positions[p_inx]
        });
        return map;
    }

    /**
     * Gets a triangle from the dual Delaunay triangulation.
     *
     * The dual triangles share vertices with the input point cloud, making them ideal for mesh-based
     * interpolation, proximity graphs, or debugging the Voronoi construction. Infinite triangles (those
     * touching the super triangle introduced by the triangulation algorithm) are filtered out so the
     * returned coordinates are always safe to render.
     *
     * @param {number} [index] Triangle index to return. When omitted, returns all finite triangles.
     * @returns {Array<Array<number>>|Array<Array<Array<number>>>|null} Triangle vertex coordinates, list of triangles, or `null` for invalid/degenerate indices.
     * @example
     * const triangles = vor.getTriangle();
     * triangles.forEach(tri => paper.polygon(tri.flat()));
     */
    Voronoi.prototype.getTriangle = function (index) {

        if (index === undefined) {
            const ret = [];
            for (let i = 0; i < this.triangles.length; ++i) {
                const t = this.getTriangle(i);
                if (t) ret.push(t);
            }
            return ret;
        }

        // Check if index is valid
        if (index < 0 || index >= this.triangles.length) return null;

        const triangle = this.triangles[index];

        // Check if this is an infinite triangle (containing -1)
        if (triangle.includes(-1)) return null;

        // Map triangle indices to actual positions
        return triangle.map(pointIndex => this.points[pointIndex]);
    };

    /**
     * Collects all finite triangles incident to a given point index.
     *
     * This helper is useful when estimating local curvature around an anchor, extracting
     * neighbor relationships, or computing Laplacian smoothing weights because it returns
     * only the bounded triangles that share the selected point.
     *
     * @param {number} point_index Target point index within {@link Voronoi#points}.
     * @returns {Array<Array<Array<number>>>} Array of triangles touching the point.
     * @example
     * const incident = vor.getPointTriangles(2);
     * const neighbours = new Set(incident.flat().map(([x, y]) => `${x},${y}`));
     */
    Voronoi.prototype.getPointTriangles = function (point_index) {
        // Check if point_index is valid
        if (point_index < 0 || point_index >= this.points.length) return [];

        const result = [];

        // Iterate through all triangles
        for (let i = 0; i < this.triangles.length; i++) {
            const triangle = this.triangles[i];

            // If the triangle contains our point and is finite, add it to results
            if (triangle.includes(point_index) && !triangle.includes(-1)) {
                result.push(this.getTriangle(i));
            }
        }

        return result;
    };

    Snap.registerClass("Voronoi", Voronoi);

    /**
     * Builds a Voronoi diagram for the supplied points.
     *
     * Behind the scenes the function delegates to the lightweight {@link module:voronoi} implementation and
     * then wraps the result in a {@link Voronoi} helper so callers can seamlessly transition between the
     * Voronoi and Delaunay representations. Both array-based (`[[x, y], ...]`) and object-based (`[{x, y}]`)
     * coordinate collections are accepted and automatically normalised.
     *
     * Typical use cases include:
     * - Highlighting the Voronoi cell beneath the pointer for interaction heavy UIs.
     * - Computing adjacency graphs for mesh editing or path finding.
     * - Exporting diagram data to downstream data visualisation pipelines.
     *
     * @param {Array<Array<number>>|Array<{x:number,y:number}>} points 2D points as `[x, y]` tuples or `{x, y}` objects.
     * @returns {Voronoi} Voronoi helper exposing convenience methods.
     * @example
     * const anchors = [{x: 10, y: 15}, {x: 80, y: 35}, {x: 50, y: 90}];
     * const vor = Snap.voronoi(anchors);
     * paper.path("M" + vor.getPolygon(0).join("L") + "Z").attr({fill: "rgba(0,0,0,0.1)"});
     */
    Snap.voronoi = function (points) {
        const is_objPoint = points[0].hasOwnProperty("x");
        if (is_objPoint) points = toArrayPoints(points);
        const vor = _voronoi(points);
        if (is_objPoint) vor.positions = toObjPoints(vor.positions);
        return new Voronoi(points, vor.cells, vor.positions, vor.triangles);
    };

    /**
     * Performs a stable merge sort using the supplied comparator.
     *
     * This internal helper powers geometric routines that require deterministic ordering, such as the
     * divide-and-conquer closest-pair solver.  It operates on shallow copies of the input array so callers
     * do not need to worry about mutating upstream data structures.
     *
     * @param {Array<*>} points Items to sort.
     * @param {Function} comp Comparator returning a negative, zero, or positive value.
     * @returns {Array<*>} Sorted copy of `points`.
     */
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

    /**
     * Converts `[x, y]` tuples to `{x, y}` objects.
     *
     * The plugin accepts both tuple and object shapes for coordinates.  Normalising them with this helper
     * ensures downstream routines can rely on property access without branching on array indexes.
     *
     * @param {Array<Array<number>>} point_arrray Array of coordinate tuples.
     * @returns {Array<{x:number,y:number}>} Converted object points.
     */
    function toObjPoints(point_arrray) {
        return point_arrray.map((p) => {
            return {x: p[0], y: p[1]}
        })
    }

    /**
     * Converts `{x, y}` points to `[x, y]` tuples.
     *
     * Symmetric companion to {@link toObjPoints}.  Some third-party computational geometry packages expect
     * plain arrays, so this helper keeps interoperability friction-free.
     *
     * @param {Array<{x:number,y:number}>} point_arrray Array of object-based coordinates.
     * @returns {Array<Array<number>>} Converted tuple points.
     */
    function toArrayPoints(point_arrray) {
        return point_arrray.map((p) => {
            return [p.x, p.y];
        })
    }

    /**
     * Recursive divide-and-conquer closest pair solver.
     *
     * This is the workhorse behind {@link Snap.closestPair}.  It expects the input to be pre-sorted on both
     * axes and recursively partitions the point set, checking only a constant window of candidates in the
     * merge step.  The implementation follows the classic $\Theta(n \log n)$ algorithm.
     *
     * @private
     * @param {Array<{x:number,y:number}>} Px Points sorted by the X axis.
     * @param {Array<{x:number,y:number}>} Py Points sorted by the Y axis.
     * @returns {{distance:number, pair:Array<{x:number,y:number}>}} Closest pair information.
     */
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

    /**
     * Finds the closest pair of 2D points using a divide-and-conquer strategy.
     *
     * The helper accepts heterogeneous inputs and returns both the minimal distance and the participating points.
     * Typical scenarios include collision avoidance for draggable anchors, proximity-based snapping, or
     * pre-filtering segments before executing more expensive geometric tests.
     *
     * @param {Array<Array<number>>|Array<{x:number,y:number}>} points Input points.
     * @returns {{distance:number, pair:Array<{x:number,y:number}>}} Closest pair data.
     * @example
     * const {distance, pair} = Snap.closestPair([[10, 20], [35, 25], [18, 24]]);
     * console.log(distance); // -> shortest separation
     * console.log(pair);     // -> the two closest anchors as {x, y} objects
     */
    Snap.closestPair = function (points) {
        if (Array.isArray(points[0])) points = toObjPoints(points);
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

    /**
     * Attaches the original point descriptors to the KDTree instance for downstream lookups.
     * @param {Array<Array<number>>|Array<{x:number,y:number}>} points Original point payloads.
     */
    KDTree.prototype.attachPoints = function (points) {
        this.points = points;
    }

    /**
     * Finds the nearest neighbours while reporting axis-aligned offsets and Euclidean distance.
     * @deprecated This overload is superseded by the streamlined variant defined later in this file.
     * @param {Array<number>|{x:number,y:number}} point Query point.
     * @param {number} [num=1] Number of neighbours to return.
     * @param {boolean} [sqere_dist=false] When `true`, returns squared distance values.
     * @returns {Array|Array[]} Array describing the nearest neighbour(s) with axis deltas.
     */
    KDTree.prototype.nearest_dist = function (point, num, sqere_dist) {
        num = Math.floor(num || 1);
        let points = this.nearest(point, num);

        switch (this._ax) {
            case 1:
                if (num > 1) {
                    return points.map((p) => [p,
                        Math.abs((point[0] || point.x || 0) - (p[0] || p.x || 0)),
                        dist(point, p)])
                } else {
                    return [points,
                        Math.abs((point[0] || point.x || 0) - (points[0] || points.x || 0)),
                        dist(point, points, sqere_dist)]
                }
            case 2:
                if (num > 1) {
                    return points.map((p) => [p,
                        Math.abs((point[1] || point.y || 0) - (p[1] || p.y || 0)),
                        dist(point, p)])
                } else {
                    return [points,
                        Math.abs((point[1] || point.y || 0) - (points[1] || points.y || 0)),
                        dist(point, points, sqere_dist)]
                }
            default:
                if (num > 1) {
                    return points.map((p) => [p, dist(point, p)])
                } else {
                    return [points, dist(point, points, sqere_dist)]
                }
        }
    }


    /**
     * Computes the Euclidean or squared distance between two 2D points.
     * @param {Array<number>|{x:number,y:number}} p1 First point.
     * @param {Array<number>|{x:number,y:number}} p2 Second point.
     * @param {boolean} [sq=false] When `true`, returns squared distance.
     * @returns {number} Distance between `p1` and `p2`.
     */
    function dist(p1, p2, sq) {
        if (sq) {
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

    /**
     * Finds the nearest neighbours using the KDTree, returning only Euclidean distance metadata.
     * @param {Array<number>|{x:number,y:number}} point Query point.
     * @param {number} [num=1] Number of neighbours to retrieve.
     * @param {boolean} [sqere_dist=false] When `true`, distances are squared.
     * @returns {Array|Array[]} Nearest neighbour result.
     */
    KDTree.prototype.nearest_dist = function (point, num, sqere_dist) {
        num = Math.floor(num || 1);
        let points = this.nearest(point, num);

        if (num > 1) {
            return points.map((p) => [p, dist(point, p)])
        } else {
            return [points, dist(point, points, sqere_dist)]
        }
    }

    /**
     * Creates a KDTree helper for the given set of points.
     * @param {Array<Array<number>>|Array<{x:number,y:number}>} points Points to index.
     * @param {('x'|'y'|1|undefined)} [dim] Optional axis restriction (`"x"`/`"y"` or `1`).
  * @returns {KDTree} KDTree instance augmented with metadata.
     */
    Snap.kdTree = function (points, dim) {
        let xs, ys, ax = [];
        const x_only = dim === 1 || dim === "x";
        const y_only = dim === 1 || dim === "y";
        if (!dim || x_only) {
            xs = points.map((p) => (p.hasOwnProperty("x") ? p.x : p[0]));
            ax.push(xs)
        }

        if (!dim || y_only) {
            ys = points.map((p) => (p.hasOwnProperty("y") ? p.y : p[1]));
            ax.push(ys)
        }

        let kd = KDTree.fromAxes(ax)
        kd._ax = (x_only) ? 1 : ((y_only) ? 2 : null)
        kd.attachPoints(points);

        return kd;
    }

    /**
     * Builds a KDTree constrained to the X axis.
     * @param {Array<Array<number>>|Array<{x:number,y:number}>} points Points to index.
  * @returns {KDTree} KDTree instance.
     */
    Snap.kdTreeX = function (points) {
        return Snap.kdTree(points, "x");
    }

    /**
     * Builds a KDTree constrained to the Y axis.
     * @param {Array<Array<number>>|Array<{x:number,y:number}>} points Points to index.
  * @returns {KDTree} KDTree instance.
     */
    Snap.kdTreeY = function (points) {
        return Snap.kdTree(points, "y");
    }

    // Binary heap implementation from:
    // http://eloquentjavascript.net/appendix2.html

    /**
     * @class BinaryHeap
     * @classdesc Minimal binary heap implementation parametrized by a scoring function.
     * @param {Function} scoreFunction Function used to score items in the heap.
     */
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

    /**
     * Creates a binary heap backed by the provided scoring function.
     * @param {Function} score Score function returning numeric priority values.
     * @returns {BinaryHeap}
     */
    Snap.binaryHeap = function (score) {
        return new BinaryHeap(score);
    }

    /**
     * Generates random point samples within the supplied bounds.
     * @param {number} num Amount of random points.
     * @param {Array<number>|number} x_dim Range `[min, max]` or max value for the X axis.
     * @param {Array<number>|number} y_dim Range `[min, max]` or max value for the Y axis.
     * @returns {Array<{x:number,y:number}>} Randomly generated points.
     */
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


    /**
     * Brute-force closest pair between two point sets.
     * @private
     * @param {Array<{x:number,y:number}>} ps1 First point set.
     * @param {Array<{x:number,y:number}>} ps2 Second point set.
     * @returns {{d:number,pair:Array<{x:number,y:number}>}} Closest pair descriptor.
     */
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

    /**
     * KDTree-accelerated closest pair search between two point sets.
     * @private
     * @param {Array<{x:number,y:number}>} ps1 First point set.
     * @param {Array<{x:number,y:number}>} ps2 Second point set.
     * @returns {{d:number,pair:Array<{x:number,y:number}>}} Closest pair descriptor.
     */
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

    /**
     * Chooses the most efficient algorithm to find the closest pair between two point sets.
     * @param {Array<{x:number,y:number}>} set1 First point set.
     * @param {Array<{x:number,y:number}>} set2 Second point set.
     * @returns {{d:number,pair:Array<{x:number,y:number}>}} Closest pair descriptor.
     */
    Snap.nearPairs = function (set1, set2) {
        if (set1.length * set2.length < 25000) {
            return clPairs_BF(set1, set2);
        } else {
            return clPairs_KD(set1, set2);
        }
    }
});
},{"./voronoi.js":28,"mnemonist/kd-tree":8}],28:[function(require,module,exports){
"use strict"

const triangulate = require("delaunay-triangulate");
const circumcenter = require("circumcenter");
const uniq = require("uniq");

/** @type {Function} */
module.exports = voronoi

/**
 * Numerical comparator optimized for integer values.
 *
 * Used to deduplicate Voronoi star indices when the geometry has a dimensionality greater than two.
 * Keeping the comparator inline allows {@link module:uniq} to short-circuit quickly, reducing allocations
 * in heavy diagram workloads.
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function compareInt(a, b) {
  return a - b
}

/**
 * Specialized Voronoi computation for the one-dimensional case.
 *
 * While uncommon, 1D inputs appear when snapping along a guide or evaluating parametric curves.  This
 * helper arranges breakpoints along the line and computes midpoint separators without performing a full
 * 2D triangulation.
 *
 * @param {Array<Array<number>>} points One-dimensional points expressed as `[x]` tuples.
 * @returns {{cells:Array<Array<number>>, positions:Array<Array<number>>}} Voronoi descriptors for 1D.
 * @example
 * const {cells, positions} = voronoi1D([[0], [10], [35]]);
 * // Each cell stores indices into `positions`, describing intervals on the line.
 */
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



/**
 * Computes Voronoi cells for the supplied point cloud.
 *
 * The routine wraps a Delaunay triangulation produced by {@link module:delaunay-triangulate} and derives the
 * circumcentres that form the Voronoi vertices.  Degenerate simplices that reference the super triangle are
 * marked with `-1` so callers can easily skip unbounded faces.  The resulting structure is designed to be fed
 * into higher level helpers such as {@link Snap.voronoi}.
 *
 * @param {Array<Array<number>>} points Input points.
 * @returns {{cells:Array<Array<number>>, positions:Array<Array<number>>, triangles:Array<Array<number>>}} Voronoi diagram representation.
 * @example
 * const {cells, positions} = voronoi([[0, 0], [50, 10], [25, 75]]);
 * // cells -> index references into positions array forming each Voronoi face
 */
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

      // Handle empty stars case
      if(dual.length === 0) {
        dualCells[i] = [];
        continue;
      }

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
},{"circumcenter":2,"delaunay-triangulate":3,"uniq":26}]},{},[27]);

return Snap_ia;
}));
;
