import eve from "./eve.esm.mjs";

const __minaGlobal = typeof globalThis !== "undefined" ? globalThis :
    (typeof self !== "undefined" ? self :
        (typeof window !== "undefined" ? window :
            (typeof global !== "undefined" ? global : Function("return this")())));

if (typeof global === "undefined") {
    // eslint-disable-next-line no-var
    var global = __minaGlobal;
}

if (!__minaGlobal.eve_ia) {
    __minaGlobal.eve_ia = eve;
}

if (!__minaGlobal.eve) {
    __minaGlobal.eve = eve;
}
