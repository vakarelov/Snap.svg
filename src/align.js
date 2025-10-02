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
