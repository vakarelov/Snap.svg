export = eve;
declare function eve(group: any, name: any, scope: any, ...args: any[]): any[];
declare namespace eve {
    export let isEve: boolean;
    /**
     * eve.a @method

     * Async version of eve that returns an array of promises from all listeners.
     * All listener functions are wrapped to ensure they return promises.
 * @param {string} name - name of the *event*, dot (`.`) or slash (`/`) separated
 * @param {object} scope - context for the event handlers
 * @param {...any} varargs - the rest of arguments will be sent to event handlers
 * @returns {array} array of promises from the listeners
    */
    export function a(group: any, name: string, scope: object, ...args: any[]): any[];
    /**
     * eve.all @method

     * Async version that returns a single promise resolving to an array of all listener results.
     * Waits for all promises to resolve before returning the results array.
 * @param {string} name - name of the *event*, dot (`.`) or slash (`/`) separated
 * @param {object} scope - context for the event handlers
 * @param {...any} varargs - the rest of arguments will be sent to event handlers
 * @returns {Promise} promise that resolves to array of results from all listeners
    */
    export function all(group: any, name: string, scope: object, ...args: any[]): Promise<any>;
    /**
     * eve.localEve @method
 *
     * Creates a local eve instance that operates within a specific event group.
     * All events fired through this instance will be scoped to the specified group.
 *
 * @param {string} group_id - identifier for the event group
 *
 * @returns {function} local eve instance with all eve methods scoped to the group
    */
    export function localEve(group_id: string): Function;
    /**
     * eve.logEvents @method
 *
     * Enables or disables event logging for debugging purposes.
     * When enabled, tracks event firing statistics including call count and listener count.
 *
 * @param {boolean} off - if true, disables logging; if false or undefined, enables logging
    */
    export function logEvents(off: boolean): void;
    import _events = n;
    export { _events };
    export { event_groups as _all_events };
    import _snap_events = global_event.n;
    export { _snap_events };
    export let group: any;
    /**
     * eve.listeners @method

     * Internal method which gives you array of all event handlers that will be triggered by the given `name`.
 * @param {string} name - name of the event, dot (`.`) or slash (`/`) separated
 * @returns {array} array of event handlers
    */
    export function listeners(name: string, group: any, skip_global: any): any[];
    /**
     * eve.separator @method

     * If for some reason you don’t like default separators (`.` or `/`) you can specify yours
     * here. Be aware that if you pass a string longer than one character it will be treated as
     * a list of characters.
 * @param {string} separator - new separator. Empty string resets to default: `.` or `/`.
    */
    export function separator(sep: any): void;
    /**
     * eve.setGroup @method
 *
     * Sets the current active event group for subsequent event operations.
     * If no group is specified, resets to the default group.
 *
 * @param {string} group - #optional name of the event group to set as active
    */
    export function setGroup(group: string): void;
    /**
     * eve.fireInGroup @method
 *
     * Fires an event within a specific event group context.
     * Temporarily switches to the specified group, fires the event, then restores the previous group.
 *
 * @param {string} group - name of the event group to fire the event in
 * @param {...any} varargs - event arguments to pass to eve()
 *
 * @returns {array} array of returned values from the listeners
    */
    export function fireInGroup(group: string, ...args: any[]): any[];
    /**
     * eve.addGlobalEventType @method
 *
     * Adds a global event type to the global event list.
     * Be aware that this will not add the event to the local event list. Adding a global type may prevent local events
     * starting with the same name from being triggered.
 *
 * @param {string} name - name of the global event type to add
    */
    export function addGlobalEventType(name: string): void;
    /**
     * eve.on @method
 *
     * Binds given event handler with a given name. You can use wildcards “`*`” for the names:
     | eve.on("*.under.*", f);
     | eve("mouse.under.floor"); // triggers f
     * Use @eve to trigger the listener.
 *
 * @param {string} name - name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
 * @param {function} f - event handler function
 *
 * @param {array} name - if you don’t want to use separators, you can use array of strings
 * @param {function} f - event handler function
 *
 * @returns {function} returned function accepts a single numeric parameter that represents z-index of the handler. It is an optional feature and only used when you need to ensure that some subset of handlers will be invoked in a given order, despite of the order of assignment.
     > Example:
     | eve.on("mouse", eatIt)(2);
     | eve.on("mouse", scream);
     | eve.on("mouse", catchIt)(1);
     * This will ensure that `catchIt` function will be called before `eatIt`.
     *
     * If you want to put your handler before non-indexed handlers, specify a negative value.
     * Note: I assume most of the time you don’t need to worry about z-index, but it’s nice to have this feature “just in case”.
    */
    export function on(name: string, f: Function, group: any): Function;
    /**
     * eve.f @method
 *
     * Returns function that will fire given event with optional arguments.
     * Arguments that will be passed to the result function will be also
     * concated to the list of final arguments.
     | el.onclick = eve.f("click", 1, 2);
     | eve.on("click", function (a, b, c) {
     |     console.log(a, b, c); // 1, 2, [event object]
     | });
 * @param {string} event - event name
 * @param {...any} varargs - and any other arguments
 * @returns {function} possible event handler function
    */
    export function f(event: string, ...args: any[]): Function;
    /**
     * eve.stop @method
 *
     * Is used inside an event handler to stop the event, preventing any subsequent listeners from firing.
    */
    export function stop(): void;
    /**
     * eve.nt @method
 *
     * Could be used inside event handler to figure out actual name of the event.
 *
 * @param {string} subname - #optional subname of the event
 *
 * @returns {string} name of the event, if `subname` is not specified
     * or
 * @returns {boolean} `true`, if current event’s name contains `subname`
    */
    export function nt(subname: string): string;
    /**
     * eve.nts @method
 *
     * Could be used inside event handler to figure out actual name of the event.
 * *
 * @returns {array} names of the event
    */
    export function nts(): any[];
    export function off(name: any, f: any, group: any): void;
    export function unbind(name: any, f: any, group: any): void;
    /**
     * eve.alias @method
 *
     * Sets up namespace alias mappings for backward compatibility.
     * Allows translating top-level event namespaces from one name to another.
     * When an event is fired, registered, or removed with an aliased namespace,
     * it will be automatically translated to the target namespace.
 *
 * @param {object} aliases - object containing key-value pairs where keys are alias names
     *   and values are the target namespace names they should be translated to
 *
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
    export function alias(aliases: object): void;
    /**
     * eve.clearAliases @method
 *
     * Clears all namespace alias mappings.
 *
    */
    export function clearAliases(): void;
    /**
     * eve.getAliases @method
 *
     * Returns a copy of the current namespace alias mappings.
 *
 * @returns {object} copy of current alias mappings
    */
    export function getAliases(): object;
    export function is(arg0: any, arg1: any, arg2: any): boolean;
    /**
     * eve.once @method
 *
     * Binds given event handler with a given name to only run once then unbind itself.
     | eve.once("login", f);
     | eve("login"); // triggers f
     | eve("login"); // no listeners
     * Use @eve to trigger the listener.
 *
 * @param {string} name - name of the event, dot (`.`) or slash (`/`) separated, with optional wildcards
 * @param {function} f - event handler function
 *
 * @returns {function} same return function as @eve.on
    */
    export function once(name: string, f: Function, group: any): Function;
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
    export function filter(group: any, name: any, data: any, ...args: any[]): any;
    export { version };
    export function toString(): string;
}
declare var n: {};
declare namespace event_groups {
    namespace _default { }
    export { _default as default };
}
declare namespace n_1 {
    namespace snap {
        let n_2: {};
        export { n_2 as n };
    }
    namespace drag {
        let n_3: {};
        export { n_3 as n };
    }
    namespace ia {
        let n_4: {};
        export { n_4 as n };
    }
    namespace global {
        let n_5: {};
        export { n_5 as n };
    }
}
declare const version: "1.0.0";
