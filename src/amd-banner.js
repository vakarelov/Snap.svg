(function (glob, factory) {
    // AMD support
    if (typeof define == "function" && define.amd) {
        // Define as an anonymous module
        define(["eve"], function (eve) {
            return factory(glob, eve);
        });
    } else if (typeof exports != "undefined") {
        // Next for Node.js or CommonJS
        // When bundled, eve and mina are already loaded in this file
        // When standalone, they would be required as external modules
        var eve = glob.eve_ia || glob.eve || (typeof require !== "undefined" ? require("eve") : undefined);
        var mina = glob.mina || (typeof require !== "undefined" ? require("mina") : undefined);
        module.exports = factory(glob, eve, mina);
    } else {
        // Browser globals (glob is window)
        // Snap adds itself to window
        factory(glob, glob.eve_ia, glob.mina);
    }
}(typeof window !== "undefined" ? window : (global || this), function (window, eve, mina) {
//amd-Banner
    "use strict";
    let Snap;
