/*
 * Copyright (c) 2018.  Orlin Vakarelov
 */
Snap.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {

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
                return {x: this.cx, y: this.y};
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
