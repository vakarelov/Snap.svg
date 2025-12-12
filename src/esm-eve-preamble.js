const __eveGlobal = typeof globalThis !== "undefined" ? globalThis :
    (typeof self !== "undefined" ? self :
        (typeof window !== "undefined" ? window :
            (typeof global !== "undefined" ? global : Function("return this")())));

if (typeof global === "undefined") {
    // eslint-disable-next-line no-var
    var global = __eveGlobal;
}
