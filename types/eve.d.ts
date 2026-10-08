/**
 * TypeScript reference for Eve, the event dispatcher bundled with Snap.svg.
 *
 * Events are named with dot- or slash-separated segments, such as
 * `"snap.attr.change"`, or supplied as a string array such as
 * `["snap", "attr", "change"]`. Register listeners with `on`/`once`, fire
 * them by calling the exported function, and remove them with `off`.
 *
 * ```ts
 * import eve = require("snapsvg/eve");
 *
 * const setOrder = eve.on("panel.open", (panelId: string) => {
 *   console.log(panelId);
 * });
 * setOrder(1); // Run before listeners with larger z-index values.
 * eve("panel.open", null, "settings");
 * eve.off("panel.open"); // Remove the listener.
 * ```
 *
 * Eve supports wildcard listener segments (`*`, which must match one segment,
 * and `?`, which may match zero or one), separate event groups, aliases for
 * top-level namespaces, synchronous dispatch, and promise-based dispatch.
 * The exported declaration describes the module; it does not declare
 * `window.eve` or Snap.svg's `window.eve_ia` globals.
 */
export = eve;

/**
 * Fires an event in the currently selected group. `scope` becomes the
 * listener's `this` value when it is an object; non-object values are instead
 * prepended to the listener arguments. Remaining arguments are passed to each
 * matching listener in registration/order sequence.
 *
 * @param name Event name as separated text or a list of segments.
 * @param scope Listener context, or the first event argument when non-object.
 * @param args Additional listener arguments.
 * @returns Listener results in an array with `firstDefined`, `lastDefined`,
 *   and `getErrors` helpers. Thrown listener errors are recorded as EveError values.
 */
declare function eve(name: eve.EventName, scope?: unknown, ...args: any[]): eve.EventResults;
/**
 * Fires an event in the group identified by `group.id`, without changing the
 * currently selected group.
 */
declare function eve(group: eve.EventGroup, name: eve.EventName, scope?: unknown, ...args: any[]): eve.EventResults;

declare namespace eve {
    /** One event name: separated text (`"menu.open"`) or ordered segments. */
    type EventName = string | string[];
    /**
     * A single event name or a collection of event names. For registration and
     * removal, comma-separated names in a string are also accepted at runtime.
     */
    type EventPattern = EventName | EventName[];
    /**
     * Listener invoked with the fired event's arguments. Its `this` value is
     * the object scope supplied to dispatch, when one is supplied.
     */
    type EventListener = (...args: any[]) => unknown;
    /**
     * Function returned by `on`/`once`. Calling it with a number sets listener
     * order; calling it without a number does not remove the listener.
     */
    type EventOrderSetter = (zIndex?: number) => void;
    /** Callback returned by `f`, which dispatches the captured event. */
    type EventCallback = (...args: any[]) => void;

    /** Group object passed as the first argument when firing a grouped event. */
    interface EventGroup {
        /** Name of the event group. */
        id: string;
    }

    /** Special filter argument whose `eve` property names the filter event. */
    interface EventFilterContext {
        eve: EventName;
    }

    /** Error record placed in a sync/async result array when a listener throws. */
    interface EveError {
        /** Stable error-record name. */
        readonly name: "EveError";
        /** Message copied from the thrown value when available. */
        readonly message: string;
        /** Original thrown value, retained without coercion. */
        readonly original: unknown;
        /** Marker used internally by result helpers. */
        readonly isEveError: true;
    }

    /**
     * Synchronous listener results. A listener that throws contributes an
     * `EveError` result rather than aborting dispatch; Eve also emits
     * `global.error`. `getErrors()` extracts the error records.
     */
    interface EventResults<T = unknown> extends Array<T> {
        /** Returns the first result that is neither `undefined` nor an EveError. */
        firstDefined(): T | undefined;
        /** Returns the last result that is neither `undefined` nor an EveError. */
        lastDefined(): T | undefined;
        /** Returns error records produced by listeners. */
        getErrors(): EveError[];
    }

    /** Promise for each matching listener when using `a()`. */
    interface EventPromiseResults<T = unknown> extends Array<Promise<T>> {
        /** Returns the first promise entry that is neither `undefined` nor an EveError. */
        firstDefined(): Promise<T> | undefined;
        /** Returns the last promise entry that is neither `undefined` nor an EveError. */
        lastDefined(): Promise<T> | undefined;
        /** Resolves with error records after the listener promises settle. */
        getErrors(): Promise<EveError[]>;
    }

    /** Internal listener trie, exposed only for debugging/compatibility. */
    interface EventTree {
        /** Child event-name segments. */
        n: Record<string, EventTree>;
        /** Handlers registered exactly at this node. */
        f?: EventListener[];
    }

    /** Event dispatch counters populated while `logEvents()` is enabled. */
    interface EventLog {
        [group: string]: {
            /** `[total dispatch count, largest listener count observed]`. */
            [eventName: string]: [callCount: number, maxListenerCount: number];
        };
    }

    interface EveMethods {
        /** `true` for Eve emitters; useful when accepting a generic callable. */
        isEve: boolean;
        /** Optional group label; the global emitter initializes this as undefined. */
        group: string | undefined;
        /** Current group tree; internal debugging/compatibility surface. */
        _events: Record<string, EventTree>;
        /** Event trees indexed by group; internal debugging surface. */
        _all_events: Record<string, EventTree>;
        /** Globally registered event tree; internal debugging surface. */
        _snap_events: Record<string, EventTree>;
        /** Dispatch statistics, present only after logging is enabled. */
        _log?: EventLog;
        /**
         * Dispatches matching listeners asynchronously. Each listener is
         * scheduled through a promise and contributes one promise in the
         * returned array; thrown errors become resolved `EveError` values.
         */
        a(name: EventName, scope?: unknown, ...args: any[]): EventPromiseResults;
        /** `a` overload that dispatches into the group identified by `group.id`. */
        a(group: EventGroup, name: EventName, scope?: unknown, ...args: any[]): EventPromiseResults;
        /**
         * Dispatches matching listeners asynchronously and resolves once all
         * listener promises settle. The resolved result array has the same
         * helper methods as synchronous results.
         */
        all(name: EventName, scope?: unknown, ...args: any[]): Promise<EventResults>;
        /** `all` overload that dispatches into the group identified by `group.id`. */
        all(group: EventGroup, name: EventName, scope?: unknown, ...args: any[]): Promise<EventResults>;
        /**
         * Creates a callable emitter whose firing, registration, and removal
         * methods are bound to `groupId`. The group is also selected globally
         * as a side effect of creation.
         */
        localEve(groupId: string): LocalEve;
        /** Enables event statistics; pass `true` to disable and discard the log. */
        logEvents(off?: boolean): void;
        /**
         * Returns listeners matching an event name, considering wildcards,
         * group listeners, and global listeners. `skipGlobal` omits the global
         * event tree.
         */
        listeners(name: EventName, group?: string, skipGlobal?: boolean): EventListener[];
        /**
         * Changes the separators recognized in string event names. Each
         * character in a multi-character value is treated as a separator.
         * An omitted or empty value restores dot and slash.
         */
        separator(separator?: string): void;
        /**
         * Selects the current group for future ungrouped operations. An
         * omitted or empty group selects the default group.
         */
        setGroup(group?: string): void;
        /** Temporarily selects `group`, fires the event, then restores the prior group. */
        fireInGroup(group: string, name: EventName, scope?: unknown, ...args: any[]): EventResults;
        /**
         * Adds a top-level event type to the global tree. Registering a global
         * type can take precedence over a local event with the same first part.
         */
        addGlobalEventType(name: string): void;
        /**
         * Registers a handler for one or more event names. `*` matches exactly
         * one required segment; `?` matches zero or one segment. The returned
         * setter assigns a numeric z-index; lower values run first.
         */
        on(name: EventPattern, listener: EventListener, group?: string): EventOrderSetter;
        /**
         * Creates a callback that dispatches `name`. Arguments passed to the
         * returned callback are appended after the bound arguments.
         */
        f(name: EventName, ...args: any[]): EventCallback;
        /** Stops the current synchronous dispatch after the current listener. */
        stop(): void;
        /** Returns the active event name, or undefined outside dispatch. */
        nt(): string | undefined;
        /** Tests whether the active event name contains this complete segment. */
        nt(subname: string): string | boolean | undefined;
        /** Returns the active event name as segments; call only during dispatch. */
        nts(): string[];
        /**
         * Removes matching handlers. Omit `listener` to remove all handlers
         * matching the pattern; omit `name` to clear the currently active
         * event tree.
         */
        off(name?: EventPattern, listener?: EventListener, group?: string): void;
        /** Alias for {@link off}. */
        unbind(name?: EventPattern, listener?: EventListener, group?: string): void;
        /**
         * Maps top-level event-name segments to replacement names. The mapping
         * is applied when registering, firing, querying, and removing events.
         */
        alias(aliases: Record<string, string>): void;
        /** Removes all namespace aliases. */
        clearAliases(): void;
        /** Returns a copy of the namespace aliases. */
        getAliases(): Record<string, string>;
        /** Checks whether the given function (including a once-wrapper) is registered. */
        is(name: EventPattern, listener: EventListener, group?: string): boolean;
        /**
         * Registers a handler removed after its first invocation. Returns the
         * same z-index setter as `on`.
         */
        once(name: EventPattern, listener: EventListener, group?: string): EventOrderSetter;
        /**
         * Runs listeners for `name` with a mutable `{data, isFilter: true}`
         * context and returns the final `data`. Listeners should mutate
         * `this.data`; extra arguments are forwarded.
         */
        filter<T>(name: EventName, data: T, ...args: any[]): T;
        /** Filter overload that executes in the group identified by `group.id`. */
        filter<T>(group: EventGroup, name: EventName, data: T, ...args: any[]): T;
        /** Filter overload for a context object whose `eve` field names the event. */
        filter<T>(context: EventFilterContext, data: T, ...args: any[]): T;
        /** Converts an event name to its current separator-delimited parts. */
        normalize(name: EventPattern): string[] | string[][] | undefined;
        /** Returns the Eve version string. */
        version: string;
        /** Returns a descriptive version string. */
        toString(): string;
    }

    /**
     * Callable event emitter with its event operations bound to one group.
     * Firing uses the group's event tree, while other copied utilities retain
     * their normal global behavior unless specifically overridden here.
     */
    type LocalEve =
        ((name: EventName, scope?: unknown, ...args: any[]) => EventResults) &
        Omit<EveMethods, "group" | "a" | "all" | "on" | "once" | "off" | "unbind" | "f" | "filter"> &
        {
            /** Group identifier used by this emitter's firing and listener methods. */
            group: string;
            /** Fires asynchronously in this emitter's group, returning one promise per listener. */
            a(name: EventName, scope?: unknown, ...args: any[]): EventPromiseResults;
            /** Resolves after all listeners in this emitter's group have settled. */
            all(name: EventName, scope?: unknown, ...args: any[]): Promise<EventResults>;
            /** Registers one or more event patterns in the bound group. */
            on(name: EventPattern, listener: EventListener): EventOrderSetter;
            /** Registers a listener removed after its first call. */
            once(name: EventPattern, listener: EventListener): EventOrderSetter;
            /** Removes matching listeners from the bound group. */
            off(name?: EventPattern, listener?: EventListener): void;
            /** Alias for {@link off}. */
            unbind(name?: EventPattern, listener?: EventListener): void;
            /** Creates a callback that fires an event in the bound group. */
            f(name: EventName, ...args: any[]): EventCallback;
            /** Runs the filter chain for an event in the bound group. */
            filter<T>(name: EventName, data: T, ...args: any[]): T;
        };

    /** Marker that identifies this callable as an Eve instance. */
    const isEve: true;
    /** Optional group label; the global emitter initializes this as undefined. */
    let group: string | undefined;
    /** Active event tree used internally; exposed for debugging/compatibility. */
    const _events: Record<string, EventTree>;
    /** Event trees indexed by group; exposed for debugging. */
    const _all_events: Record<string, EventTree>;
    /** Global event tree; exposed for debugging. */
    const _snap_events: Record<string, EventTree>;
    /** Event statistics, present only while logging is enabled. */
    let _log: EventLog | undefined;
    /**
     * Dispatches listeners asynchronously. Each listener is invoked through a
     * promise, and thrown errors become resolved EveError values in the result
     * promises.
     */
    function a(name: EventName, scope?: unknown, ...args: any[]): EventPromiseResults;
    /** Dispatches asynchronously in the group identified by `group.id`. */
    function a(group: EventGroup, name: EventName, scope?: unknown, ...args: any[]): EventPromiseResults;
    /**
     * Dispatches asynchronously and resolves after every listener settles.
     * The resolved array contains listener values or EveError records.
     */
    function all(name: EventName, scope?: unknown, ...args: any[]): Promise<EventResults>;
    /** Dispatches asynchronously in the group identified by `group.id`. */
    function all(group: EventGroup, name: EventName, scope?: unknown, ...args: any[]): Promise<EventResults>;
    /**
     * Creates an event callable scoped to a named group. Its `on`, `once`,
     * `off`, `unbind`, `a`, `all`, `f`, and `filter` methods also use that
     * group. Creation additionally selects this group on the global emitter.
     */
    function localEve(groupId: string): LocalEve;
    /** Enables event statistics; pass `true` to disable and discard the log. */
    function logEvents(off?: boolean): void;
    /**
     * Returns handlers matching an event name, accounting for wildcard
     * patterns and global listeners. Set `skipGlobal` to omit global handlers.
     */
    function listeners(name: EventName, group?: string, skipGlobal?: boolean): EventListener[];
    /**
     * Changes separators used to split string event names. Every character in
     * the supplied string becomes a separator; an empty/omitted value restores
     * dot and slash.
     */
    function separator(separator?: string): void;
    /** Selects the group used by ungrouped calls; empty or omitted selects default. */
    function setGroup(group?: string): void;
    /** Temporarily selects `group`, fires the event, then restores the previous group. */
    function fireInGroup(group: string, name: EventName, scope?: unknown, ...args: any[]): EventResults;
    /**
     * Adds a top-level event type to the global event tree. A global type may
     * take precedence over a local event beginning with the same segment.
     */
    function addGlobalEventType(name: string): void;
    /**
     * Registers listeners for one or more event names. `*` must match one
     * segment; `?` may match zero or one segment. Lower numeric z-index values
     * are dispatched first; the returned function sets that value.
     */
    function on(name: EventPattern, listener: EventListener, group?: string): EventOrderSetter;
    /**
     * Creates a callback that dispatches `name`, followed by captured
     * arguments and then arguments supplied to the returned callback.
     */
    function f(name: EventName, ...args: any[]): EventCallback;
    /** Stops the current synchronous dispatch after its current listener. */
    function stop(): void;
    /** Returns the active event name, or `undefined` when no event is dispatching. */
    function nt(): string | undefined;
    /** Tests whether the active name contains this complete event segment. */
    function nt(subname: string): string | boolean | undefined;
    /** Returns the current event name as segments; call while an event is dispatching. */
    function nts(): string[];
    /**
     * Removes matching listeners. Omit `listener` to remove all listeners
     * matching the name; omit `name` to clear the currently active event tree.
     */
    function off(name?: EventPattern, listener?: EventListener, group?: string): void;
    /** Alias for {@link off}. */
    function unbind(name?: EventPattern, listener?: EventListener, group?: string): void;
    /**
     * Maps the first event-name segment to another name. Aliases are applied
     * during registration, dispatch, querying, and removal.
     */
    function alias(aliases: Record<string, string>): void;
    /** Removes all namespace aliases. */
    function clearAliases(): void;
    /** Returns a copy of the namespace aliases. */
    function getAliases(): Record<string, string>;
    /** Tests whether a function, including a once-wrapper's original, is registered. */
    function is(name: EventPattern, listener: EventListener, group?: string): boolean;
    /** Registers a listener removed after its first invocation; returns an order setter. */
    function once(name: EventPattern, listener: EventListener, group?: string): EventOrderSetter;
    /**
     * Runs listeners with a mutable `{data, isFilter: true}` context and
     * returns its final `data`. Filter listeners should mutate `this.data`;
     * additional arguments are forwarded to each listener.
     */
    function filter<T>(name: EventName, data: T, ...args: any[]): T;
    /** Runs a filter in the group identified by `group.id`. */
    function filter<T>(group: EventGroup, name: EventName, data: T, ...args: any[]): T;
    /** Uses `context.eve` as the event name and returns the mutated data. */
    function filter<T>(context: EventFilterContext, data: T, ...args: any[]): T;
    /**
     * Splits a string using the current separator, or returns an array name
     * unchanged. Nested event-name arrays are preserved.
     */
    function normalize(name: EventPattern): string[] | string[][] | undefined;
    /** Package version string. */
    const version: string;
    /** Returns a human-readable string containing the Eve version. */
    function toString(): string;
}
