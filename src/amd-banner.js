(function (glob, factory) {
    // AMD support
    if (typeof define == "function" && define.amd) {
        // Define as an anonymous module
        define(["eve"], function (eve) {
            return factory(glob, eve);
        });
    } else if (typeof exports != "undefined") {
        // Next for Node.js or CommonJS
        var eve = require("eve");
        var mina = require("mina");
        module.exports = factory(glob, eve, mina);
    } else {
        // Browser globals (glob is window)
        // Snap adds itself to window
        factory(glob, glob.eve_ia, glob.mina);
    }
}(typeof window !== "undefined" ? window : (global || this), function (window, eve, mina) {
//amd-Banner
    "use strict";
