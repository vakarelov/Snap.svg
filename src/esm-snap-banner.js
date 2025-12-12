const Snap = (function (glob, factory) {
    return factory(glob, glob.eve_ia || glob.eve, glob.mina);
})(__snapGlobal, function (window, eve, mina) {
    "use strict";
    let Snap;
