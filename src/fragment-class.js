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
