/*
 * Copyright (c) 2018.  Orlin Vakarelov
 */
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {

    const ERROR = 1e-12;

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

    BBox.prototype.clone = function () {
        return new BBox(this.x, this.y, this.width, this.height);
    };

    BBox.prototype.r1 = function () {
        return Math.min(this.width, this.height) / 2;
    };

    BBox.prototype.r2 = function () {
        return Math.max(this.width, this.height) / 2;
    };

    BBox.prototype.r0 = function () {
        return Math.sqrt(this.width * this.width + this.height * this.height) / 2;
    };

    BBox.prototype.diag = function () {
        return Math.sqrt(this.width * this.width + this.height * this.height);
    };

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

    BBox.prototype.path = function () {
        return rectPath(this.x, this.y, this.width, this.height);
    };

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

    BBox.prototype.vb = function () {
        return [this.x, this.y, this.width, this.height].join(' ');
    };

    BBox.prototype.ration = function () {
        return this.width / this.height;
    };

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

    BBox.prototype.containsCircle = function (circle) {
        return this.x <= circle.x - circle.r && this.y <= circle.y - circle.r &&
            this.x2 >= circle.x + circle.r && this.y2 >= circle.y + circle.r;
    };

    BBox.prototype.center = function () {
        return {x: this.cx, y: this.cy};
    };

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
                return {x: this.cx, y: this.y2};
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

    BBox.prototype.isOverlap = function (box) {
        if (!box) return false;

        const x = Math.max(this.x, box.x),
            y = Math.max(this.y, box.y),
            x2 = Math.min(this.x2, box.x2),
            y2 = Math.min(this.y2, box.y2);

        return x < x2 && y < y2;

    }

    BBox.prototype.union = function (box) {
        if (!box) return this;
        const x = Math.min(this.x, box.x),
            y = Math.min(this.y, box.y),
            x2 = Math.max(this.x2, box.x2),
            y2 = Math.max(this.y2, box.y2);

        return new BBox(x, y, x2 - x, y2 - y);
    };

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
     * Translates the box by x and y units
     * @param  x an number or matrix. If matrix, only the f and e values are used
     * @param  y
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
     * Scales the box by sx and sy factors arpound center (cx,cy).
     * @param sx
     * @param sy
     * @param cx
     * @param cy
     */
    BBox.prototype.scale = function (sx, sy, cx, cy) {
        if (sy == null) sy = sx;
        if (cx == null) cx = sx;
        if (cy == null) cy = sy;
        this.w = this.width *= sx;
        this.h = this.height *= sy;

        this.x = cx - (cx - this.x) * sx;
        this.y = cy - (cy - this.y) * sy;
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;
        this.cx = this.x + this.width / 2;
        this.cy = this.y + this.height / 2;
    }

    BBox.prototype.getBBox = function () {
        return this;
    };

    /**
     * Returns a new bbox with the same first corner, that contains the rotation of this bbox at a given angle.
     * A property "old_corner" is added to the new bbox, giving the coord of the first corner of the rotates bbox.
     * @param angle
     * @return {BBox}
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

    BBox.prototype.getBBox = function () {
        return this;
    };

//Snap begins here
    Snap._.transform2matrixStrict = function transform2matrixStrict(tstr) {
        const tdata = Snap.parseTransformString(tstr),
            m = new Snap.Matrix;
        if (tdata) {
            let i = 0;
            const ii = tdata.length;
            for (; i < ii; ++i) {
                const t = tdata[i],
                    tlen = t.length,
                    command = String(t[0]).toLowerCase(),
                    absolute = t[0] != command,
                    inver = absolute ? m.invert() : 0;
                // x1,
                // y1,
                // x2,
                // y2,
                // bb;
                // if (command == "t" && tlen == 2) {
                //     m.translate(t[1], 0);
                // } else if (command == "t" && tlen == 3) {
                //     if (absolute) {
                //         x1 = inver.x(0, 0);
                //         y1 = inver.y(0, 0);
                //         x2 = inver.x(t[1], t[2]);
                //         y2 = inver.y(t[1], t[2]);
                //         m.translate(x2 - x1, y2 - y1);
                //     } else {
                //         m.translate(t[1], t[2]);
                //     }
                // } else if (command == "r") {
                //     if (tlen == 2) {
                //         bb = bb || bbox;
                //         m.rotate(t[1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                //     } else if (tlen == 4) {
                //         if (absolute) {
                //             x2 = inver.x(t[2], t[3]);
                //             y2 = inver.y(t[2], t[3]);
                //             m.rotate(t[1], x2, y2);
                //         } else {
                //             m.rotate(t[1], t[2], t[3]);
                //         }
                //     }
                // } else if (command == "s") {
                //     if (tlen == 2 || tlen == 3) {
                //         bb = bb || bbox;
                //         m.scale(t[1], t[tlen - 1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                //     } else if (tlen == 4) {
                //         if (absolute) {
                //             x2 = inver.x(t[2], t[3]);
                //             y2 = inver.y(t[2], t[3]);
                //             m.scale(t[1], t[1], x2, y2);
                //         } else {
                //             m.scale(t[1], t[1], t[2], t[3]);
                //         }
                //     } else if (tlen == 5) {
                //         if (absolute) {
                //             x2 = inver.x(t[3], t[4]);
                //             y2 = inver.y(t[3], t[4]);
                //             m.scale(t[1], t[2], x2, y2);
                //         } else {
                //             m.scale(t[1], t[2], t[3], t[4]);
                //         }
                //     }
                // } else
                if (command == 'm' && tlen == 7) {
                    m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
                }
            }
        }
        return m;
    };

    const elproto = Element.prototype,
        is = Snap.is,
        clone = Snap._.clone,
        has = 'hasOwnProperty',
        p2s = /,?([a-z]),?/gi,
        toFloat = parseFloat,
        PI = Math.PI,
        mmin = Math.min,
        mmax = Math.max,
        pow = Math.pow,
        abs = Math.abs,
        STRICT_MODE = true;

    function paths(ps) {
        // return;
        const p = paths.ps = paths.ps || {};
        if (p[ps]) {
            p[ps].sleep = 100;
        } else {
            p[ps] = {
                sleep: 100,
            };
        }
        mina.setTimeout(function () {
            for (let key in p) if (p[has](key) && key != ps) {
                p[key].sleep--;
                !p[key].sleep && delete p[key];
            }
        });
        return p[ps];
    }

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

    function toString(path) {
        path = path || this;
        return path.join(',').replace(p2s, '$1');
    }

    function pathClone(pathArray) {
        const res = clone(pathArray);
        res.toString = toString;
        return res;
    }

    function getPointAtSegmentLength(
        p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length) {
        if (length == null) {
            return bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
        } else {
            return findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y,
                getTotLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length));
        }
    }

    function getLengthFactory(istotal, subpath) {
        function O(val) {
            return +(+val).toFixed(3);
        }

        return Snap._.cacher(function (path, length, onlystart) {
            if (path instanceof Element) {
                path = getPath[path.type](path);
            }
            path = path2curve(path);
            let x, y, p, l, sp = '';
            const subpaths = {};
            let point,
                len = 0;
            let i = 0;
            const ii = path.length;
            for (; i < ii; ++i) {
                p = path[i];
                if (p[0] == 'M') {
                    x = +p[1];
                    y = +p[2];
                } else {
                    l = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                    if (len + l > length) {
                        if (subpath && !subpaths.start) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4],
                                p[5], p[6], length - len);
                            sp += [
                                'C' + O(point.start.x),
                                O(point.start.y),
                                O(point.m.x),
                                O(point.m.y),
                                O(point.x),
                                O(point.y),
                            ];
                            if (onlystart) {
                                return sp;
                            }
                            subpaths.start = sp;
                            sp = [
                                'M' + O(point.x),
                                O(point.y) + 'C' + O(point.n.x),
                                O(point.n.y),
                                O(point.end.x),
                                O(point.end.y),
                                O(p[5]),
                                O(p[6]),
                            ].join();
                            len += l;
                            x = +p[5];
                            y = +p[6];
                            continue;
                        }
                        if (!istotal && !subpath) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4],
                                p[5], p[6], length - len);
                            return point;
                        }
                    }
                    len += l;
                    x = +p[5];
                    y = +p[6];
                }
                sp += p.shift() + p;
            }
            subpaths.end = sp;
            point = istotal ?
                len :
                subpath ?
                    subpaths :
                    findDotsAtSegment(x, y, p[0], p[1], p[2], p[3], p[4], p[5], 1);
            return point;
        }, null, Snap._.clone);
    }

    const getTotalLength = getLengthFactory(1),
        getPointAtLength = getLengthFactory(),
        getSubpathsAtLength = getLengthFactory(0, 1);

    function findDotsAtSegment(
        p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t, point_only) {
        const t1 = 1 - t,
            t13 = pow(t1, 3),
            t12 = pow(t1, 2),
            t2 = t * t,
            t3 = t2 * t,
            x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x,
            y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y;
        if (point_only) return {x: x, y: y};
        const mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x),
            my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y),
            nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x),
            ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y),
            ax = t1 * p1x + t * c1x,
            ay = t1 * p1y + t * c1y,
            cx = t1 * c2x + t * p2x,
            cy = t1 * c2y + t * p2y,
            alpha = 90 - Math.atan2(mx - nx, my - ny) * 180 / PI;
        // (mx > nx || my < ny) && (alpha += 180);
        return {
            x: x,
            y: y,
            m: {x: mx, y: my},
            n: {x: nx, y: ny},
            start: {x: ax, y: ay},
            end: {x: cx, y: cy},
            alpha: alpha,
        };
    }

    function bezierBBox(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
        if (!Snap.is(p1x, 'array')) {
            p1x = [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y];
        }
        const bbox = curveDim.apply(null, p1x);
        return box(
            bbox.min.x,
            bbox.min.y,
            bbox.max.x - bbox.min.x,
            bbox.max.y - bbox.min.y,
        );
    }

    function isPointInsideBBox(bbox, x, y) {
        return x >= bbox.x &&
            x <= bbox.x + bbox.width &&
            y >= bbox.y &&
            y <= bbox.y + bbox.height;
    }

    function isBBoxIntersect(bbox1, bbox2) {
        bbox1 = box(bbox1);
        bbox2 = box(bbox2);

        const number = abs(bbox1.cx - bbox2.cx);
        const number2 = (bbox1.width + bbox2.width) / 2;
        if (number >= number2) return false;
        return abs(bbox1.cy - bbox2.cy) < (bbox1.height + bbox2.height) / 2;

        // return isPointInsideBBox(bbox2, bbox1.x, bbox1.y)
        //     || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y)
        //     || isPointInsideBBox(bbox2, bbox1.x, bbox1.y2)
        //     || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y2)
        //     || isPointInsideBBox(bbox1, bbox2.x, bbox2.y)
        //     || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y)
        //     || isPointInsideBBox(bbox1, bbox2.x, bbox2.y2)
        //     || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y2)
        //     || (bbox1.x < bbox2.x2 && bbox1.x > bbox2.x
        //     || bbox2.x < bbox1.x2 && bbox2.x > bbox1.x)
        //     && (bbox1.y < bbox2.y2 && bbox1.y > bbox2.y
        //     || bbox2.y < bbox1.y2 && bbox2.y > bbox1.y);
    }

    function base3(t, p1, p2, p3, p4) {
        const t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
            t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
        return t * t2 - 3 * p1 + 3 * p2;
    }

    function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z) {
        if (z == null) {
            z = 1;
        }
        z = z > 1 ? 1 : z < 0 ? 0 : z;
        const z2 = z / 2,
            n = 12,
            Tvalues = [
                -.1252,
                .1252,
                -.3678,
                .3678,
                -.5873,
                .5873,
                -.7699,
                .7699,
                -.9041,
                .9041,
                -.9816,
                .9816],
            Cvalues = [
                0.2491,
                0.2491,
                0.2335,
                0.2335,
                0.2032,
                0.2032,
                0.1601,
                0.1601,
                0.1069,
                0.1069,
                0.0472,
                0.0472];
        let sum = 0;
        for (let i = 0; i < n; ++i) {
            const ct = z2 * Tvalues[i] + z2,
                xbase = base3(ct, x1, x2, x3, x4),
                ybase = base3(ct, y1, y2, y3, y4),
                comb = xbase * xbase + ybase * ybase;
            sum += Cvalues[i] * Math.sqrt(comb);
        }
        return z2 * sum;
    }

    function getTotLen(x1, y1, x2, y2, x3, y3, x4, y4, ll) {
        if (ll < 0 || bezlen(x1, y1, x2, y2, x3, y3, x4, y4) < ll) {
            return;
        }
        const t = 1;
        let step = t / 2,
            t2 = t - step,
            l;
        const e = .01;
        l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        while (abs(l - ll) > e) {
            step /= 2;
            t2 += (l < ll ? 1 : -1) * step;
            l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        }
        return t2;
    }

    function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        if (
            mmax(x1, x2) < mmin(x3, x4) ||
            mmin(x1, x2) > mmax(x3, x4) ||
            mmax(y1, y2) < mmin(y3, y4) ||
            mmin(y1, y2) > mmax(y3, y4)
        ) {
            return;
        }
        const nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) *
                (x3 * y4 - y3 * x4),
            ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4);
        let denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (!denominator) {
            return;
        }
        const px = nx / denominator,
            py = ny / denominator,
            px2 = +px.toFixed(2),
            py2 = +py.toFixed(2);
        if (
            px2 < +mmin(x1, x2).toFixed(2) ||
            px2 > +mmax(x1, x2).toFixed(2) ||
            px2 < +mmin(x3, x4).toFixed(2) ||
            px2 > +mmax(x3, x4).toFixed(2) ||
            py2 < +mmin(y1, y2).toFixed(2) ||
            py2 > +mmax(y1, y2).toFixed(2) ||
            py2 < +mmin(y3, y4).toFixed(2) ||
            py2 > +mmax(y3, y4).toFixed(2)
        ) {
            return;
        }
        return {x: px, y: py};
    }

    function inter(bez1, bez2) {
        return interHelper(bez1, bez2);
    }

    function interCount(bez1, bez2) {
        return interHelper(bez1, bez2, 1);
    }

    function interHelper(bez1, bez2, justCount) {
        const bbox1 = bezierBBox(bez1),
            bbox2 = bezierBBox(bez2);
        if (!isBBoxIntersect(bbox1, bbox2)) {
            return justCount ? 0 : [];
        }
        const l1 = bezlen.apply(0, bez1),
            l2 = bezlen.apply(0, bez2),
            n1 = ~~(l1 / 8),
            n2 = ~~(l2 / 8),
            dots1 = [],
            dots2 = [],
            xy = {};
        let res = justCount ? 0 : [];
        for (var i = 0; i < n1 + 1; ++i) {
            var p = findDotsAtSegment.apply(0, bez1.concat(i / n1));
            dots1.push({x: p.x, y: p.y, t: i / n1});
        }
        for (i = 0; i < n2 + 1; ++i) {
            p = findDotsAtSegment.apply(0, bez2.concat(i / n2));
            dots2.push({x: p.x, y: p.y, t: i / n2});
        }
        for (i = 0; i < n1; ++i) {
            for (let j = 0; j < n2; j++) {
                const di = dots1[i],
                    di1 = dots1[i + 1],
                    dj = dots2[j],
                    dj1 = dots2[j + 1],
                    ci = abs(di1.x - di.x) < .001 ? 'y' : 'x',
                    cj = abs(dj1.x - dj.x) < .001 ? 'y' : 'x',
                    is = intersect(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y);
                if (is) {
                    if (xy[is.x.toFixed(4)] == is.y.toFixed(4)) {
                        continue;
                    }
                    xy[is.x.toFixed(4)] = is.y.toFixed(4);
                    const t1 = di.t + abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) *
                            (di1.t - di.t),
                        t2 = dj.t + abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) *
                            (dj1.t - dj.t);
                    if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
                        if (justCount) {
                            res++;
                        } else {
                            res.push({
                                x: is.x,
                                y: is.y,
                                t1: t1,
                                t2: t2,
                            });
                        }
                    }
                }
            }
        }
        return res;
    }

    function isPathOverlapRect(path, rect) {
        const path_bbox = path.getBBox();
        const rect_bbox = rect.getBBox();
        if (!isBBoxIntersect(path_bbox, rect_bbox)) return false;

        //Check if the path box in completely inside the rect box

        if (rect_bbox.x <= path_bbox.x && path_bbox.x2 <= rect_bbox.x2 &&
            rect_bbox.y <= path_bbox.y && path_bbox.y2 <= rect_bbox.y2) {
            return true;
        }

        return pathIntersectionNumber(getPath[path.type](path),
            rectPath(rect_bbox.x, rect_bbox.y, rect_bbox.w, rect_bbox.h)) > 0;

    }

    function pathIntersection(path1, path2) {
        return interPathHelper(path1, path2);
    }

    function pathIntersectionNumber(path1, path2) {
        return interPathHelper(path1, path2, 1);
    }

    function interPathHelper(path1, path2, justCount) {
        path1 = path2curve(path1);
        path2 = path2curve(path2);
        let x1, y1, x2, y2, x1m, y1m, x2m, y2m, bez1, bez2,
            res = justCount ? 0 : [];
        let i = 0;
        const ii = path1.length;
        for (; i < ii; ++i) {
            const pi = path1[i];
            if (pi[0] == 'M') {
                x1 = x1m = pi[1];
                y1 = y1m = pi[2];
            } else {
                if (pi[0] == 'C') {
                    bez1 = [x1, y1].concat(pi.slice(1));
                    x1 = bez1[6];
                    y1 = bez1[7];
                } else {
                    bez1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
                    x1 = x1m;
                    y1 = y1m;
                }
                let j = 0;
                const jj = path2.length;
                for (; j < jj; j++) {
                    const pj = path2[j];
                    if (pj[0] == 'M') {
                        x2 = x2m = pj[1];
                        y2 = y2m = pj[2];
                    } else {
                        if (pj[0] == 'C') {
                            bez2 = [x2, y2].concat(pj.slice(1));
                            x2 = bez2[6];
                            y2 = bez2[7];
                        } else {
                            bez2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
                            x2 = x2m;
                            y2 = y2m;
                        }
                        const intr = interHelper(bez1, bez2, justCount);
                        if (justCount) {
                            res += intr;
                        } else {
                            let k = 0;
                            const kk = intr.length;
                            for (; k < kk; k++) {
                                intr[k].segment1 = i;
                                intr[k].segment2 = j;
                                intr[k].bez1 = bez1;
                                intr[k].bez2 = bez2;
                            }
                            res = res.concat(intr);
                        }
                    }
                }
            }
        }
        return res;
    }

    function isPointInsidePath(path, x, y) {
        const bbox = pathBBox(path);
        return isPointInsideBBox(bbox, x, y) &&
            interPathHelper(path, [['M', x, y], ['H', bbox.x2 + 10]], 1) % 2 == 1;
    }

    function pathBBox(path) {
        // console.log("Path BBox");
        // console.trace();
        const pth = paths(path);
        if (pth.bbox) {
            return clone(pth.bbox);
        }
        if (!path) {
            return box();
        }
        path = path2curve(path);
        let x = 0,
            y = 0,
            X = [],
            Y = [],
            p;
        let i = 0;
        const ii = path.length;
        for (; i < ii; ++i) {
            p = path[i];
            if (p[0] == 'M') {
                x = p[1];
                y = p[2];
                X.push(x);
                Y.push(y);
            } else {
                const dim = curveDim(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                X = X.concat(dim.min.x, dim.max.x);
                Y = Y.concat(dim.min.y, dim.max.y);
                x = p[5];
                y = p[6];
            }
        }
        const xmin = mmin.apply(0, X),
            ymin = mmin.apply(0, Y),
            xmax = mmax.apply(0, X),
            ymax = mmax.apply(0, Y),
            bb = box(xmin, ymin, xmax - xmin, ymax - ymin);
        pth.bbox = clone(bb);
        return bb;
    }

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

    function ellipsePath(x, y, rx, ry, a) {
        if (a == null && ry == null) {
            ry = rx;
        }
        x = +x;
        y = +y;
        rx = +rx;
        ry = +ry;
        if (a != null) {
            var rad = Math.PI / 180,
                x1 = x + rx * Math.cos(-ry * rad),
                x2 = x + rx * Math.cos(-a * rad),
                y1 = y + rx * Math.sin(-ry * rad),
                y2 = y + rx * Math.sin(-a * rad),
                res = [['M', x1, y1], ['A', rx, rx, 0, +(a - ry > 180), 0, x2, y2]];
        } else {
            res = [
                ['M', x, y],
                ['m', 0, -ry],
                ['a', rx, ry, 0, 1, 1, 0, 2 * ry],
                ['a', rx, ry, 0, 1, 1, 0, -2 * ry],
                ['z'],
            ];
        }
        res.toString = toString;
        return res;
    }

    function groupPathStrict(el) {
        const children = el.getChildren();
        let comp_path = [],
            comp_path_string = '',
            pathfinder,
            child,
            path,
            m = new Snap.Matrix;

        for (var i = 0, max = children.length; i < max; ++i) {
            child = children[i];

            while (child.type == 'use') { //process any use tags
                m = m.add(el.getLocalMatrix(STRICT_MODE).translate(el.attr('x') || 0, el.attr('y') || 0));
                if (child.original) {
                    child = child.original;
                } else {
                    const href = el.attr('xlink:href');
                    child = child.original = child.node.ownerDocument.getElementById(
                        href.substring(href.indexOf('#') + 1));
                }
            }

            pathfinder = Snap.path.get[child.type] || Snap.path.get.deflt;
            path = pathfinder(child); //convert the element ot path
            path = Snap.path.map(path, m.add(child.getLocalMatrix(STRICT_MODE)));
            comp_path = comp_path.concat(path);
        }

        for (var i = 0, max = comp_path.length, command; i < max; ++i) {
            command = comp_path[i];
            comp_path_string += command.shift();
            comp_path_string += command.toString();
        }

        return comp_path_string;
    }

    var unit2px = Snap._unit2px,
        getPath = {
            path: function (el) {
                return el.attr('d');
            },
            circle: function (el) {
                const attr = unit2px(el);
                return ellipsePath(attr.cx, attr.cy, attr.r);
            },
            ellipse: function (el) {
                const attr = unit2px(el);
                return ellipsePath(attr.cx || 0, attr.cy || 0, attr.rx, attr.ry);
            },
            rect: function (el) {
                const attr = unit2px(el);
                return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height,
                    attr.rx, attr.ry);
            },
            image: function (el) {
                const attr = unit2px(el);
                return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height);
            },
            line: function (el) {
                return 'M' + [
                    el.attr('x1') || 0,
                    el.attr('y1') || 0,
                    el.attr('x2'),
                    el.attr('y2')];
            },
            polyline: function (el) {
                return 'M' + el.attr('points');
            },
            polygon: function (el) {
                return 'M' + el.attr('points') + 'z';
            },
            foreignObject: function (el) {
                var attr = unit2px(el);
                return rectPath(attr.x || 0, attr.y || 0, attr.width, attr.height);
            },
            g: function (el) {
                if (STRICT_MODE) {
                    return groupPathStrict(el);
                } else {
                    const bbox = el.node.getBBox();
                    return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
                }
            },
            deflt: function (el) {
                const bbox = el.node.getBBox();
                return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
            },
        };
    getPath['clipPath'] = getPath['g'];

    function pathToRelative(pathArray) {
        const pth = paths(pathArray),
            lowerCase = String.prototype.toLowerCase;
        if (pth.rel) {
            return pathClone(pth.rel);
        }
        if (!Snap.is(pathArray, 'array') ||
            !Snap.is(pathArray && pathArray[0], 'array')) {
            pathArray = Snap.parsePathString(pathArray);
        }
        const res = [];
        let x = 0,
            y = 0,
            mx = 0,
            my = 0,
            start = 0;
        if (pathArray[0][0] == 'M') {
            x = pathArray[0][1];
            y = pathArray[0][2];
            mx = x;
            my = y;
            start++;
            res.push(['M', x, y]);
        }
        let i = start;
        const ii = pathArray.length;
        for (; i < ii; ++i) {
            let r = res[i] = [];
            const pa = pathArray[i];
            if (pa[0] != lowerCase.call(pa[0])) {
                r[0] = lowerCase.call(pa[0]);
                switch (r[0]) {
                    case 'a':
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +(pa[6] - x).toFixed(3);
                        r[7] = +(pa[7] - y).toFixed(3);
                        break;
                    case 'v':
                        r[1] = +(pa[1] - y).toFixed(3);
                        break;
                    case 'm':
                        mx = pa[1];
                        my = pa[2];
                    default:
                        let j = 1;
                        const jj = pa.length;
                        for (; j < jj; j++) {
                            r[j] = +(pa[j] - (j % 2 ? x : y)).toFixed(3);
                        }
                }
            } else {
                r = res[i] = [];
                if (pa[0] == 'm') {
                    mx = pa[1] + x;
                    my = pa[2] + y;
                }
                let k = 0;
                const kk = pa.length;
                for (; k < kk; k++) {
                    res[i][k] = pa[k];
                }
            }
            const len = res[i].length;
            switch (res[i][0]) {
                case 'z':
                    x = mx;
                    y = my;
                    break;
                case 'h':
                    x += +res[i][len - 1];
                    break;
                case 'v':
                    y += +res[i][len - 1];
                    break;
                default:
                    x += +res[i][len - 2];
                    y += +res[i][len - 1];
            }
        }
        res.toString = toString;
        pth.rel = pathClone(res);
        return res;
    }

    function pathToAbsolute(pathArray) {
        const pth = paths(pathArray);
        if (pth.abs) {
            return pathClone(pth.abs);
        }
        if (!is(pathArray, 'array') || !is(pathArray && pathArray[0], 'array')) { // rough assumption
            if (is(pathArray, 'object') && pathArray.type) {
                pathArray = getPath[pathArray.type](pathArray);
            }
            pathArray = Snap.parsePathString(pathArray);
        }
        if (!pathArray || !pathArray.length) {
            return [['M', 0, 0]];
        }
        let res = [],
            x = 0,
            y = 0,
            mx = 0,
            my = 0,
            start = 0,
            pa0;
        if (pathArray[0][0] == 'M') {
            x = +pathArray[0][1];
            y = +pathArray[0][2];
            mx = x;
            my = y;
            start++;
            res[0] = ['M', x, y];
        }
        const crz = pathArray.length == 3 &&
            pathArray[0][0] == 'M' &&
            pathArray[1][0].toUpperCase() == 'R' &&
            pathArray[2][0].toUpperCase() == 'Z';
        let r, pa, i = start;
        const ii = pathArray.length;
        for (; i < ii; ++i) {
            res.push(r = []);
            pa = pathArray[i];
            pa0 = pa[0];
            if (pa0 != pa0.toUpperCase()) {
                r[0] = pa0.toUpperCase();
                switch (r[0]) {
                    case 'A':
                        r[1] = pa[1];
                        r[2] = pa[2];
                        r[3] = pa[3];
                        r[4] = pa[4];
                        r[5] = pa[5];
                        r[6] = +pa[6] + x;
                        r[7] = +pa[7] + y;
                        break;
                    case 'V':
                        r[1] = +pa[1] + y;
                        break;
                    case 'H':
                        r[1] = +pa[1] + x;
                        break;
                    case 'R':
                        var dots = [x, y].concat(pa.slice(1));
                        for (var j = 2, jj = dots.length; j < jj; j++) {
                            dots[j] = +dots[j] + x;
                            dots[++j] = +dots[j] + y;
                        }
                        res.pop();
                        res = res.concat(catmullRom2bezier(dots, crz));
                        break;
                    case 'O':
                        res.pop();
                        dots = ellipsePath(x, y, pa[1], pa[2]);
                        dots.push(dots[0]);
                        res = res.concat(dots);
                        break;
                    case 'U':
                        res.pop();
                        res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                        r = ['U'].concat(res[res.length - 1].slice(-2));
                        break;
                    case 'M':
                        mx = +pa[1] + x;
                        my = +pa[2] + y;
                    default:
                        for (j = 1, jj = pa.length; j < jj; j++) {
                            r[j] = +pa[j] + (j % 2 ? x : y);
                        }
                }
            } else if (pa0 == 'R') {
                dots = [x, y].concat(pa.slice(1));
                res.pop();
                res = res.concat(catmullRom2bezier(dots, crz));
                r = ['R'].concat(pa.slice(-2));
            } else if (pa0 == 'O') {
                res.pop();
                dots = ellipsePath(x, y, pa[1], pa[2]);
                dots.push(dots[0]);
                res = res.concat(dots);
            } else if (pa0 == 'U') {
                res.pop();
                res = res.concat(ellipsePath(x, y, pa[1], pa[2], pa[3]));
                r = ['U'].concat(res[res.length - 1].slice(-2));
            } else {
                let k = 0;
                const kk = pa.length;
                for (; k < kk; k++) {
                    r[k] = pa[k];
                }
            }
            pa0 = pa0.toUpperCase();
            if (pa0 != 'O') {
                switch (r[0]) {
                    case 'Z':
                        x = +mx;
                        y = +my;
                        break;
                    case 'H':
                        x = r[1];
                        break;
                    case 'V':
                        y = r[1];
                        break;
                    case 'M':
                        mx = r[r.length - 2];
                        my = r[r.length - 1];
                    default:
                        x = r[r.length - 2];
                        y = r[r.length - 1];
                }
            }
        }
        res.toString = toString;
        pth.abs = pathClone(res);
        return res;
    }

    function l2c(x1, y1, x2, y2) {
        return [x1 + (x2 - x1) / 3, y1 + (y2 - y1) / 3,
            x1 + 2 * (x2 - x1) / 3, y1 + 2 * (y2 - y1) / 3,
            x2, y2];
    }

    function q2c(x1, y1, ax, ay, x2, y2) {
        const _13 = 1 / 3,
            _23 = 2 / 3;
        return [
            _13 * x1 + _23 * ax,
            _13 * y1 + _23 * ay,
            _13 * x2 + _23 * ax,
            _13 * y2 + _23 * ay,
            x2,
            y2,
        ];
    }

    function a2c(
        x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
        // for more information of where this Math came from visit:
        // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
        const _120 = PI * 120 / 180;
        let rad = PI / 180 * (+angle || 0),
            res = [],
            xy;
        const rotate = Snap._.cacher(function (x, y, rad) {
            const X = x * Math.cos(rad) - y * Math.sin(rad),
                Y = x * Math.sin(rad) + y * Math.cos(rad);
            return {x: X, y: Y};
        });
        if (!rx || !ry) {
            return [x1, y1, x2, y2, x2, y2];
        }
        if (!recursive) {
            xy = rotate(x1, y1, -rad);
            x1 = xy.x;
            y1 = xy.y;
            xy = rotate(x2, y2, -rad);
            x2 = xy.x;
            y2 = xy.y;
            var cos = Math.cos(PI / 180 * angle),
                sin = Math.sin(PI / 180 * angle),
                x = (x1 - x2) / 2,
                y = (y1 - y2) / 2;
            let h = x * x / (rx * rx) + y * y / (ry * ry);
            if (h > 1) {
                h = Math.sqrt(h);
                rx = h * rx;
                ry = h * ry;
            }
            var rx2 = rx * rx,
                ry2 = ry * ry,
                k = (large_arc_flag == sweep_flag ? -1 : 1) *
                    Math.sqrt(abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) /
                        (rx2 * y * y + ry2 * x * x))),
                cx = k * rx * y / ry + (x1 + x2) / 2,
                cy = k * -ry * x / rx + (y1 + y2) / 2,
                f1 = Math.asin(((y1 - cy) / ry).toFixed(9)),
                f2 = Math.asin(((y2 - cy) / ry).toFixed(9));

            f1 = x1 < cx ? PI - f1 : f1;
            f2 = x2 < cx ? PI - f2 : f2;
            f1 < 0 && (f1 = PI * 2 + f1);
            f2 < 0 && (f2 = PI * 2 + f2);
            if (sweep_flag && f1 > f2) {
                f1 = f1 - PI * 2;
            }
            if (!sweep_flag && f2 > f1) {
                f2 = f2 - PI * 2;
            }
        } else {
            f1 = recursive[0];
            f2 = recursive[1];
            cx = recursive[2];
            cy = recursive[3];
        }
        let df = f2 - f1;
        if (abs(df) > _120) {
            const f2old = f2,
                x2old = x2,
                y2old = y2;
            f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
            x2 = cx + rx * Math.cos(f2);
            y2 = cy + ry * Math.sin(f2);
            res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old,
                [f2, f2old, cx, cy]);
        }
        df = f2 - f1;
        const c1 = Math.cos(f1),
            s1 = Math.sin(f1),
            c2 = Math.cos(f2),
            s2 = Math.sin(f2),
            t = Math.tan(df / 4),
            hx = 4 / 3 * rx * t,
            hy = 4 / 3 * ry * t,
            m1 = [x1, y1],
            m2 = [x1 + hx * s1, y1 - hy * c1],
            m3 = [x2 + hx * s2, y2 - hy * c2],
            m4 = [x2, y2];
        m2[0] = 2 * m1[0] - m2[0];
        m2[1] = 2 * m1[1] - m2[1];
        if (recursive) {
            return [m2, m3, m4].concat(res);
        } else {
            res = [m2, m3, m4].concat(res).join().split(',');
            const newres = [];
            let i = 0;
            const ii = res.length;
            for (; i < ii; ++i) {
                newres[i] = i % 2 ?
                    rotate(res[i - 1], res[i], rad).y :
                    rotate(res[i], res[i + 1], rad).x;
            }
            return newres;
        }
    }

    function findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
        const t1 = 1 - t;
        return {
            x: pow(t1, 3) * p1x + pow(t1, 2) * 3 * t * c1x + t1 * 3 * t * t * c2x +
                pow(t, 3) * p2x,
            y: pow(t1, 3) * p1y + pow(t1, 2) * 3 * t * c1y + t1 * 3 * t * t * c2y +
                pow(t, 3) * p2y,
        };
    }

// Returns bounding box of cubic bezier curve.
// Source: http://blog.hackers-cafe.net/2009/06/how-to-calculate-bezier-curves-bounding.html
// Original version: NISHIO Hirokazu
// Modifications: https://github.com/timo22345
    function curveDim(x0, y0, x1, y1, x2, y2, x3, y3) {
        const tvalues = [],
            bounds = [[], []];
        let a, b, c, t, t1, t2, b2ac, sqrtb2ac;
        for (let i = 0; i < 2; ++i) {
            if (i == 0) {
                b = 6 * x0 - 12 * x1 + 6 * x2;
                a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
                c = 3 * x1 - 3 * x0;
            } else {
                b = 6 * y0 - 12 * y1 + 6 * y2;
                a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
                c = 3 * y1 - 3 * y0;
            }
            if (abs(a) < ERROR) {
                if (abs(b) < ERROR) {
                    continue;
                }
                t = -c / b;
                if (0 < t && t < 1) {
                    tvalues.push(t);
                }
                continue;
            }
            b2ac = b * b - 4 * c * a;
            sqrtb2ac = Math.sqrt(b2ac);
            if (b2ac < 0) {
                continue;
            }
            t1 = (-b + sqrtb2ac) / (2 * a);
            if (0 < t1 && t1 < 1) {
                tvalues.push(t1);
            }
            t2 = (-b - sqrtb2ac) / (2 * a);
            if (0 < t2 && t2 < 1) {
                tvalues.push(t2);
            }
        }

        let x, y, j = tvalues.length;
        const jlen = j;
        let mt;
        while (j--) {
            t = tvalues[j];
            mt = 1 - t;
            bounds[0][j] = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t *
                x2 + t * t * t * x3;
            bounds[1][j] = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t *
                y2 + t * t * t * y3;
        }

        bounds[0][jlen] = x0;
        bounds[1][jlen] = y0;
        bounds[0][jlen + 1] = x3;
        bounds[1][jlen + 1] = y3;
        bounds[0].length = bounds[1].length = jlen + 2;

        return {
            min: {x: mmin.apply(0, bounds[0]), y: mmin.apply(0, bounds[1])},
            max: {x: mmax.apply(0, bounds[0]), y: mmax.apply(0, bounds[1])},
        };
    }

    function path2curve(path, path2, expand_only, process_arc) {
        if (typeof path2 === 'boolean' || typeof path2 === 'number') {
            process_arc = expand_only;
            expand_only = path2;
            path2 = undefined;
        }
        const pth = !path2 && paths(path);
        if (!path2 && !expand_only && pth.curve) {
            return pathClone(pth.curve);
        }
        if (!path2 && expand_only && pth.curve_exp) {
            return pathClone(pth.curve_exp);
        }
        var p = pathToAbsolute(path),
            p2 = path2 && pathToAbsolute(path2),
            attrs = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
            attrs2 = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
            processPath = function (path, d, pcom) {
                let nx, ny;
                if (!path) {
                    return ['C', d.x, d.y, d.x, d.y, d.x, d.y];
                }
                !(path[0] in {T: 1, Q: 1}) && (d.qx = d.qy = null);
                switch (path[0]) {
                    case 'M':
                        d.X = path[1];
                        d.Y = path[2];
                        break;
                    case 'A':
                        if (!expand_only || process_arc) path = ['C'].concat(
                            a2c.apply(0, [d.x, d.y].concat(path.slice(1))));
                        break;
                    case 'S':
                        if (pcom == 'C' || pcom == 'S') { // In "S" case we have to take into account, if the previous command is C/S.
                            nx = d.x * 2 - d.bx;          // And reflect the previous
                            ny = d.y * 2 - d.by;          // command's control point relative to the current point.
                        } else {                            // or some else or nothing
                            nx = d.x;
                            ny = d.y;
                        }
                        path = ['C', nx, ny].concat(path.slice(1));
                        break;
                    case 'T':

                        if (pcom == 'Q' || pcom == 'T') { // In "T" case we have to take into account, if the previous command is Q/T.
                            d.qx = d.x * 2 - d.qx;        // And make a reflection similar
                            d.qy = d.y * 2 - d.qy;        // to case "S".
                        } else {                            // or something else or nothing
                            d.qx = d.x;
                            d.qy = d.y;
                        }

                        if (expand_only) {
                            path = ['Q', d.qx, d.qy, path[1], path[2]];
                        } else {
                            path = ['C'].concat(
                                q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
                        }

                        break;
                    case 'Q':
                        if (!expand_only) {
                            d.qx = path[1];
                            d.qy = path[2];
                            path = ['C'].concat(
                                q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
                        }
                        break;
                    case 'L':
                        if (!expand_only) path = ['C'].concat(
                            l2c(d.x, d.y, path[1], path[2]));
                        break;
                    case 'H':
                        if (expand_only) {
                            path = ['L', path[1], d.y];
                        } else {
                            path = ['C'].concat(l2c(d.x, d.y, path[1], d.y));
                        }

                        break;
                    case 'V':
                        if (expand_only) {
                            path = ['L', d.x, path[1]];
                        } else {
                            path = ['C'].concat(l2c(d.x, d.y, d.x, path[1]));
                        }

                        break;
                    case 'Z':
                        if (Math.abs(d.x - d.X) > ERROR
                            || Math.abs(d.y - d.Y) > ERROR) {
                            if (expand_only) {
                                path = ['L', d.X, d.Y];
                            } else {
                                path = ['C'].concat(l2c(d.x, d.y, d.X, d.Y));
                            }
                        } else {
                            path = null;
                        }

                        break;
                }
                return path;
            }

            ,
            fixArc = function (pp, i) {
                if (pp[i] && pp[i].length > 7) {
                    pp[i].shift();
                    const pi = pp[i];
                    while (pi.length) {
                        pcoms1[i] = 'A'; // if created multiple C:s, their original seg is saved
                        p2 && (pcoms2[i] = 'A'); // the same as above
                        pp.splice(i++, 0, ['C'].concat(pi.splice(0, 6)));
                    }
                    pp.splice(i, 1);
                    ii = mmax(p.length, p2 && p2.length || 0);
                }
            },
            fixM = function (path1, path2, a1, a2, i) {
                if (path1 && path2 && path1[i][0] == 'M' && path2[i][0] != 'M') {
                    path2.splice(i, 0, ['M', a2.x, a2.y]);
                    a1.bx = 0;
                    a1.by = 0;
                    a1.x = path1[i][1];
                    a1.y = path1[i][2];
                    ii = mmax(p.length, p2 && p2.length || 0);
                }
            },
            toIncr = function (attr, seg) {
                let segleng = seg.length;
                switch (seg[0]) {
                    case 'C':
                    case 'Q':
                        attr.x = seg[segleng - 2];
                        attr.y = seg[segleng - 1];
                        attr.bx = toFloat(seg[segleng - 4]) || attr.x;
                        attr.by = toFloat(seg[segleng - 3]) || attr.y;
                        break;
                    default:
                        attr.x = seg[segleng - 2];
                        attr.y = seg[segleng - 1];
                        attr.bx = attr.x;
                        attr.by = attr.y;
                        break;
                }
            },
            pcoms1 = [], // path commands of original path p
            pcoms2 = [], // path commands of original path p2
            pfirst = '', // temporary holder for original path command
            pcom = ''; // holder for previous path command of original path
        let filter = false, filter2 = false;
        for (var i = 0, ii = mmax(p.length, p2 && p2.length || 0); i < ii; ++i) {
            p[i] && (pfirst = p[i][0]); // save current path command

            if (pfirst != 'C') // C is not saved yet, because it may be result of conversion
            {
                pcoms1[i] = pfirst; // Save current path command
                i && (pcom = pcoms1[i - 1]); // Get previous path command pcom
            }

            p[i] = processPath(p[i], attrs, pcom); // Previous path command is inputted to processPath

            if (!p[i]) {
                filter = true;
            }

            if (!expand_only) {
                if (pcoms1[i] != 'A' && pfirst == 'C') pcoms1[i] = 'C'; // A is the only command
                // which may produce multiple C:s
                // so we have to make sure that C is also C in original path

                fixArc(p, i); // fixArc adds also the right amount of A:s to pcoms1
            }

            if (p2) { // the same procedures is done to p2
                p2[i] && (pfirst = p2[i][0]);
                if (pfirst != 'C') {
                    pcoms2[i] = pfirst;
                    i && (pcom = pcoms2[i - 1]);
                }
                p2[i] = processPath(p2[i], attrs2, pcom);
                if (!p2[i]) {
                    filter2 = true;
                }
                if (!expand_only) {
                    if (pcoms2[i] != 'A' && pfirst == 'C') {
                        pcoms2[i] = 'C';
                    }

                    fixArc(p2, i);
                }
            }
            fixM(p, p2, attrs, attrs2, i);
            fixM(p2, p, attrs2, attrs, i);

            // if (true) {
            p[i] && toIncr(attrs, p[i]);
            p2 && p2[i] && toIncr(attrs2, p2[i]);
            // }else {
            //     attrs.x = seg[seglen - 2];
            //     attrs.y = seg[seglen - 1];
            //     attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
            //     attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
            //     attrs2.bx = p2 && (toFloat(seg2[seg2len - 4]) || attrs2.x);
            //     attrs2.by = p2 && (toFloat(seg2[seg2len - 3]) || attrs2.y);
            //     attrs2.x = p2 && seg2[seg2len - 2];
            //     attrs2.y = p2 && seg2[seg2len - 1];
            // }

        }
        if (filter) p = p.filter(Boolean);
        if (filter2) p2 = p2.filter(Boolean);

        if (!p2) {
            if (!expand_only) {
                pth.curve = pathClone(p);
            } else {
                pth.curve_exp = pathClone(p);
            }

        }
        return p2 ? [p, p2] : p;
    }

    elproto.toPathArray = function (expand_only, process_arc) {
        if (this.type !== "path") return [];
        return path2curve(this, undefined, expand_only, process_arc);
    }

    elproto.getNumberPathSegments = function () {
        let path_str = getPath[this.type](this);

        let c_segs = path2curve(path_str, false, true);
        c_segs = removeRedundantCSegs(c_segs);
        return c_segs.length;
    }

    function removeRedundantCSegs(curves) {
        const result = [];
        let last = [];
        for (let i = 0, l = curves.length, crv; i < l; ++i) {
            crv = curves[i];
            if (!last.length || crv[0] !== "C"
                || last[0] !== crv[1] || last[0] !== crv[3] || last[0] !== crv[5]
                || last[1] !== crv[2] || last[1] !== crv[4] || last[1] !== crv[6]) {
                result.push(crv);
                last[0] = crv[crv.length - 2];
                last[1] = crv[crv.length - 1];
            }
        }
        return result;
    }


    function getControlPoints(path, segment_points, skip_same_last) {
        if (path === undefined || typeof path === 'boolean') {
            skip_same_last = segment_points;
            segment_points = path;
            path = this;
        }

        path = path2curve(path, undefined, true, !segment_points);

        const result = [];
        let last_start = 0;
        for (let i = 0, l = path.length, command; i < l; ++i) {
            command = path[i];
            switch (command[0]) {
                case 'M':
                    if (skip_same_last && result.length) {
                        let s = result[last_start], e = result[result.length - 1];
                        if (Math.abs(s[0] - e[0]) < ERROR && Math.abs(s[1] - e[1]) <
                            ERROR) { //points are the same
                            result.pop();
                        }
                    }
                    result.push([+command[1], +command[2]]);
                    last_start = result.length - 1;
                    break;
                case 'L':
                    result.push([+command[1], +command[2]]);
                    break;
                case 'Q':
                    if (!segment_points) {
                        result.push([+command[1], +command[2]]);
                    }
                    result.push([+command[3], +command[4]]);
                    break;
                case 'C':
                    if (!segment_points) {
                        result.push([+command[1], +command[2]]);
                        result.push([+command[3], +command[4]]);
                    }
                    result.push([+command[5], +command[6]]);
                    break;
                case 'A':
                    result.push([+command[6], +command[7]]);
                    break;

            }
        }

        if (skip_same_last && result.length) {
            let s = result[last_start], e = result[result.length - 1];
            if (Math.abs(s[0] - e[0]) < ERROR && Math.abs(s[1] - e[1]) < ERROR) { //points are the same
                result.pop();
            }
        }

        return result;
    }

    function isPolygon(path) {
        path = path || this;
        if (path.type === 'polygon' || path.type === 'polyline' || path.type === 'line') return true;
        if (path.type !== 'path') return false;

        if (isCompound(path)) return false;
        let path_instr = path2curve(path, undefined, true);
        const coms = ['m', 'l', 'z'];
        for (let i = 0; i < path_instr.length; i++) {
            if (coms.indexOf(path_instr[i][0].toLowerCase()) === -1) return false;
        }
        return true;
    }

    function near(p1, p2) {
        return Math.abs(p1.x - p2.x) < 1e-8 && Math.abs(p1.y - p2.y) < 1e-8;
    }

    function getPointSample(path, sample) {
        if (!path || typeof path === 'number') {
            sample = path;
            path = this;
        }
        if (path.type !== 'path') return null;

        sample = Math.max((sample || 10), 2);

        let bazrs = path.toBeziers();
        let points = [];
        let inc = 1 / (sample - 1);
        let t_s = [...Array(sample - 2).keys()].map((_, i) => (i + 1) * inc);
        for (let i = 0, l = bazrs.length; i < l; ++i) {
            let bez = bazrs[i];
            let p = bez.points[0];
            if (!i || !near(p, points[points.length - 1])) {
                points.push(p);
            }
            if (bez.points.length > 2) t_s.forEach((t) => points.push(bez.get(t)));
            p = bez.points[bez.points.length - 1];
            if (!near(p, points[0])) {
                points.push(p);
            }
        }

        return points;
    }

    elproto.getPointSample = getPointSample;

    function mapPath(path, matrix) {
        if (!matrix) {
            return path;
        }
        let x, y, i, j, ii, jj, pathi;
        path = path2curve(path);
        for (i = 0, ii = path.length; i < ii; ++i) {
            pathi = path[i];
            for (j = 1, jj = pathi.length; j < jj; j += 2) {
                x = matrix.x(pathi[j], pathi[j + 1]);
                y = matrix.y(pathi[j], pathi[j + 1]);
                pathi[j] = x;
                pathi[j + 1] = y;
            }
        }
        return path;
    }

// http://schepers.cc/getting-to-the-point
    function catmullRom2bezier(crp, z) {
        const d = [];
        let i = 0;
        const iLen = crp.length;
        for (; iLen - 2 * !z > i; i += 2) {
            const p = [
                {x: +crp[i - 2], y: +crp[i - 1]},
                {x: +crp[i], y: +crp[i + 1]},
                {x: +crp[i + 2], y: +crp[i + 3]},
                {x: +crp[i + 4], y: +crp[i + 5]},
            ];
            if (z) {
                if (!i) {
                    p[0] = {x: +crp[iLen - 2], y: +crp[iLen - 1]};
                } else if (iLen - 4 == i) {
                    p[3] = {x: +crp[0], y: +crp[1]};
                } else if (iLen - 2 == i) {
                    p[2] = {x: +crp[0], y: +crp[1]};
                    p[3] = {x: +crp[2], y: +crp[3]};
                }
            } else {
                if (iLen - 4 == i) {
                    p[3] = p[2];
                }
                if (!i) {
                    p[0] = {x: +crp[i], y: +crp[i + 1]};
                }
            }
            d.push([
                'C',
                (-p[0].x + 6 * p[1].x + p[2].x) / 6,
                (-p[0].y + 6 * p[1].y + p[2].y) / 6,
                (p[1].x + 6 * p[2].x - p[3].x) / 6,
                (p[1].y + 6 * p[2].y - p[3].y) / 6,
                p[2].x,
                p[2].y,
            ]);
        }

        return d;
    }

// export
    Snap.path = paths;

    /*\
     * Snap.path.getTotalLength
     [ method ]
     **
     * Returns the length of the given path in pixels
     **
     - path (string) SVG path string
     **
     = (number) length
     \*/
    Snap.path.getTotalLength = getTotalLength;
    /*\
     * Snap.path.getPointAtLength
     [ method ]
     **
     * Returns the coordinates of the point located at the given length along the given path
     **
     - path (string) SVG path string
     - length (number) length, in pixels, from the start of the path, excluding non-rendering jumps
     **
     = (object) representation of the point:
     o {
     o     x: (number) x coordinate,
     o     y: (number) y coordinate,
     o     alpha: (number) angle of derivative
     o }
     \*/
    Snap.path.getPointAtLength = getPointAtLength;
    /*\
     * Snap.path.getSubpath
     [ method ]
     **
     * Returns the subpath of a given path between given start and end lengths
     **
     - path (string) SVG path string
     - from (number) length, in pixels, from the start of the path to the start of the segment
     - to (number) length, in pixels, from the start of the path to the end of the segment
     **
     = (string) path string definition for the segment
     \*/
    Snap.path.getSubpath = function (path, from, to) {
        if (this.getTotalLength(path) - to < 1e-6) {
            return getSubpathsAtLength(path, from).end;
        }
        const a = getSubpathsAtLength(path, to, 1);
        return from ? getSubpathsAtLength(a, from).end : a;
    };

    Snap.path.toPath = function (el, string_only) {
        const type = el.type;
        if (type === 'path') return (string_only) ? el.attr('d') : el;
        if (!getPath.hasOwnProperty(type)) return null;

        const d = getPath[type](el);

        if (string_only) return d;

        const path = el.paper.path(d);
        el.after(path);

        if (el.getGeometryAttr) {
            //This assumes iaDesigner
            const attrs = el.attrs(el.getGeometryAttr(), true); //Copy all attributes except the geometry ones
            attrs.id = el.getId() + '_path';
            path.attr(attrs);
        }

        return path;
    };

    function isCompound(path) {
        if (!path) path = this;
        if (typeof path === 'object' && path.type && path.type ===
            'path') path = path.attr('d');
        if (typeof path !== 'string' && !Array.isArray(path)) return false;
        let segs = Array.isArray(path) ? path : pathToAbsolute(path);
        segs = segs.filter(function (instr) {
            return instr[0] == 'M' || instr[0] == 'm';
        });
        return segs.length > 1;
    }

    Snap.path.isCompound = isCompound;

    /**
     * Checks if the eleme if compoubt
     * @type {isCompound}
     */
    elproto.isCompound = isCompound;

    elproto.getControlPoints = getControlPoints;
    Snap.path.getControlPoints = getControlPoints;

    elproto.isPolygon = isPolygon;
    Snap.path.isPolygon = isPolygon;

    function getPathCompoundSegments(path) {
        if (!path) path = this;
        let ret_type = (typeof path === 'string') ? 'string' : 'array';
        if (typeof path === 'object' && path.type && path.type ===
            'path') path = path.attr('d');
        if (typeof path !== 'string' && !Array.isArray(path)) return null;
        let segs = Array.isArray(path) ? path : pathToAbsolute(path);

        const result = [];
        try {
            for (let i = 0, l = segs.length, instr, part; i < l; ++i) {
                instr = segs[i];
                if (instr[0] == 'M' || instr[0] == 'm') {
                    path = [instr];
                    result.push(path);
                } else {
                    path.push(instr);
                }
            }
        } catch (e) {
            return null;
        }

        if (ret_type === 'string') {
            return result.map(function (path) {
                return toString(path);
            });
        }

        return result;
    }

    Snap.path.getCompoundSegments = getPathCompoundSegments;
    elproto.getCompoundSegments = getPathCompoundSegments;

    function polygonLength(el, close, matrix) {

        let points = (Array.isArray(el)) ? el : el.attr('points');

        matrix = matrix || (el.getLocalMatrix && el.getLocalMatrix());
        let to_tarns = matrix && !matrix.isIdentity();
        let length = 0;
        let prev = {x: +points[0], y: +points[1]}, next;
        if (to_tarns) prev = matrix.apply(prev);
        for (let i = 2, l = points.length; i < l; i += 2) {
            next = {x: +points[i], y: +points[i + 1]};
            if (to_tarns) next = matrix.apply(next);
            length += Snap.len(prev.x, prev.y, next.x, next.y);
            prev = next;
        }

        if (close) {
            next = {x: +points[0], y: +points[1]};
            if (to_tarns) next = matrix.apply(next);
            length += Snap.len(prev.x, prev.y, next.x, next.y);
        }

        return length;
    }

    /*\
     * Element.getTotalLength
     [ method ]
     **
     * Returns the length of the path in pixels (only works for `path` elements)
     = (number) length
     \*/
    elproto.getTotalLength = function () {
        if (this.type === 'path' && this.node.getTotalLength) {
            return this.node.getTotalLength();
        }

        if (this.type === 'polyline') {
            return polygonLength(this);
        }

        if (this.type === 'polygon') {
            return polygonLength(this, true);
        }

        if (this.type === 'rect') {
            const x = this.attr('x'),
                y = this.attr('y'),
                w = this.attr('width'),
                h = this.attr('height');

            return polygonLength([x, y, x + w, y, x + w, y + h, x, y + h], true,
                this.getLocalMatrix());
        }

        if (this.type === 'line') {
            let x1 = +this.attr('x1'),
                y1 = +this.attr('y1'),
                x2 = +this.attr('x2'),
                y2 = +this.attr('y2');

            let m = this.getLocalMatrix();
            if (!m.isIdentity()) {
                const p1 = m.apply([x1, y1]);
                const p2 = m.apply([x2, y2]);

                x1 = p1.x;
                y1 = p1.y;
                x2 = p2.x;
                y2 = p2.y;
            }

            return Snap.len(x1, y1, x2, y2);
        }

        //no full affine transforms supported
        if (this.type === 'ellipse') {
            //using Ramanujan approximation
            let rx = +this.attr('rx'),
                ry = +this.attr('ry');

            const h = (rx - ry) ** 2 / (rx + ry) ** 2;

            return Math.PI * (rx + ry) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h)));

        }

        if (this.type === 'cirle') {
            let r = +this.attr('r');

            return 2 * Math.PI * r;
        }

    };
// SIERRA Element.getPointAtLength()/Element.getTotalLength(): If a <path> is broken into different segments, is the jump distance to the new coordinates set by the _M_ or _m_ commands calculated as part of the path's total length?
    /*\
     * Element.getPointAtLength
     [ method ]
     **
     * Returns coordinates of the point located at the given length on the given path (only works for `path` elements)
     **
     - length (number) length, in pixels, from the start of the path, excluding non-rendering jumps
     **
     = (object) representation of the point:
     o {
     o     x: (number) x coordinate,
     o     y: (number) y coordinate,
     o     alpha: (number) angle of derivative
     o }
     \*/
    elproto.getPointAtLength = function (length) {
        {
            let path_str = getPath[this.type](this);
            return getPointAtLength(path_str, length);
        }
    };

    /**
     * Gets the point at a parametric value
     * @param t an number in [0,1].
     */
    elproto.getPointAt = function (t) {
        t = Math.max(Math.min(1, t), 0);
        return this.getPointAtLength(t * this.getTotalLength());
    };

    function reverse_seg(seg) {
        function last(com) {
            return com.splice(-2)
        }

        function appd(seg, p) {
            p.forEach((v) => seg.push(v))
        }

        function to_points(vals) {
            const res = [];
            for (let i = 0; i < vals.length - 1; i += 2) {
                res.push([vals[i], vals[i + 1]])
            }
            return res;
        }

        const cop = seg.slice().reverse();

        let point;
        cop.forEach((com, i) => {
            if (!i) seg[i] = ["M"];
            point = last(com);
            appd(seg[i], point);
            let points = com.splice(1);
            if (com[0] === "M") return;
            seg[i + 1] = com;
            if (com[0] === "A") {
                appd(com, [points[0], points[1], points[2], points[3],
                    (+points[4]) ? "0" : "1"]);
            } else {
                points = to_points(points);
                points.reverse();
                points.forEach((p) => appd(com, p))
            }
        })
    }

    elproto.reverse = function () {
        const type = this.type;
        if (type !== "path" && type !== "polygon" && type !== "polyline") {
            return this;
        }

        if (type === "path") {
            let coms = path2curve(this, true);
            console.log(coms.toString());
            const segs = [];
            {
                let seg;
                coms.forEach((com) => {
                    if (com[0] === "M") {
                        seg = [com];
                        segs.push(seg);
                    } else {
                        seg.push(com);
                    }
                })
            }
            segs.reverse();
            segs.forEach(reverse_seg);

            console.log(segs.toString())

            this.attr({d: segs})
        } else {
            let points = this.attr("points");
            points = points.map((v, i) =>
                (i % 2 === 0) ? [v, points[i + 1]] : undefined
            ).filter(Boolean);
            points.reverse();
            this.attr({points: points});
        }
        return this;
    }

// SIERRA Element.getSubpath(): Similar to the problem for Element.getPointAtLength(). Unclear how this would work for a segmented path. Overall, the concept of _subpath_ and what I'm calling a _segment_ (series of non-_M_ or _Z_ commands) is unclear.
    /*\
     * Element.getSubpath
     [ method ]
     **
     * Returns subpath of a given element from given start and end lengths (only works for `path` elements)
     **
     - from (number) length, in pixels, from the start of the path to the start of the segment
     - to (number) length, in pixels, from the start of the path to the end of the segment
     **
     = (string) path string definition for the segment
     \*/
    elproto.getSubpath = function (from, to) {
        return Snap.path.getSubpath(this.attr('d'), from, to);
    };

    PathPoint.MIDDLE = 'mid';//0;
    PathPoint.END = 'end'; //1;
    PathPoint.START = 'start'; //2;
    PathPoint.START_END = 'start_end'; //3;

    PathPoint.CORNER = 'corner'; //1;
    PathPoint.SMOOTH = 'smooth'; //2;
    PathPoint.SYMMETRIC = 'symmetric'; //3;

    function PathPoint(center, before, after, ending) {
        let type, bezier;
        if (center instanceof PathPoint) {
            ending = center.ending;
            before = (center.b) ? Object.assign({}, center.b) : undefined;
            after = (center.a) ? Object.assign({}, center.a) : undefined;
            type = center.type;
            bezier = center.bezier;
            center = Object.assign({}, center.c);
        }
        this.c = center;
        this.a = after;
        this.b = before;
        this.ending = ending;
        this.bezeir = undefined;
        this.type = undefined;
    }

    Snap.registerClass("PathPoint", PathPoint);

    function getPointType(c, a, b) {
        const angle = Math.abs(
            Snap.angle(a.x, a.y, b.x, b.y, c.x, c.y));
        if (Math.abs(angle - 180) < 1) {
            if (Math.abs(Snap.len2(b.x, b.y, c.y, c.y) -
                Snap.len2(a.x, a.y, c.y, c.y)) < 1e-5) {
                return PathPoint.SYMMETRIC;
            }
            return PathPoint.SMOOTH;
        }
        return PathPoint.CORNER;
    }

    Snap.path.getPointType = getPointType;

    PathPoint.prototype.clone = function () {
        return new PathPoint(this);
    }

    PathPoint.prototype.getType = function () {
        if (this.type) return this.type;
        if (!this.a || !this.b) return undefined;
        this.type = getPointType(this.c, this.a, this.b);

        return this.type;
    }

    PathPoint.prototype.isCorner = function () {
        return this.getType() === PathPoint.CORNER;
    }

    PathPoint.prototype.isSmooth = function (not_symmetric) {
        return this.getType() === PathPoint.SMOOTH || (!not_symmetric && this.getType() === PathPoint.SYMMETRIC);
    }

    PathPoint.prototype.isSymmetric = function () {
        return this.getType() === PathPoint.SYMMETRIC;
    }

    PathPoint.prototype.addMeasurements = function (pathPoints, beziers, close, data) {
        beziers = beziers || Snap.path.toBeziers(pathPoints);
        const total_length = beziers.reduce((len, bz) => len + bz.length(), 0);
        let temp_rel_l = 0, temp_l = 0;
        pathPoints.forEach((p, i) => {
            if (i) {
                const length = beziers[i - 1].length();
                temp_l += length;
                p.length_from_prev = length;
                p.tot_length = temp_l;

                const rel_length = length / total_length; //normalize
                temp_rel_l += rel_length;
                p.rel_length_from_prev = rel_length;
                p.tot_rel_length = temp_rel_l; /*At portion of total length 0-1*/
                p.bezeir = beziers[i - 1];
            } else {
                p.length_from_prev = 0;
                p.tot_length = 0;
                p.rel_length_from_prev = 0;
                p.tot_rel_length = 0;
            }
            if (data) {
                for (let key in data) if (data.hasOwnProperty(key)) {
                    p[key] = data[key];
                }
            }
        });

        if (close) {
            let end_p = new PathPoint(pathPoints[0]);
            //normalize

            const length = beziers[beziers.length - 1].length();
            end_p.length_from_prev = length;
            end_p.tot_length = total_length;

            end_p.rel_length_from_prev = length / total_length;
            end_p.tot_rel_length = 1;
            end_p.bezeir = beziers[beziers.length - 1];
            if (data) {
                for (let key in data) if (data.hasOwnProperty(key)) {
                    end_p[key] = data[key];
                }
            }

            pathPoints.push(end_p);
        }
    }

    /**
     * Computes new bezier tangent control points around a point to make the curve
     * @param center the main point.
     * @param after the after control point
     * @param before the before control point
     * @param symmetric whether to make the control tangents points symmetric
     * @param modify_points if true, the before and after points objects are modified, instead of new points being returned.
     * @returns {undefined|*[]} If modify_points is true, nothing is returend, otherwise, array [new_after, new_before]
     * is returned.
     * TODO: implement auto-smooth, as in: https://stackoverflow.com/questions/61564459/algorithm-behind-inkscapes-auto-smooth-nodes
     */
    Snap.path.smoothCorner = function (center, after, before, symmetric, modify_points) {
        const type = Snap.path.getPointType(center, after, before);
        if ((symmetric && type === PathPoint.SYMMETRIC)
            || (!symmetric && type === PathPoint.SMOOTH)) return (modify_points) ? undefined : [after, before];

        let angle = Snap.angle(after.x, after.y, before.x, before.y, center.x, center.y);

        angle = (angle + 180) % 360 - 180;

        const sign = (angle < 0) ? -1 : 1;
        let dif = sign * (180 - Math.abs(angle)) / 2;
        // console.log(angle, dif);
        const matrix_b = Snap.matrix().rotate(-dif, center.x, center.y);
        const matrix_a = Snap.matrix().rotate(dif, center.x, center.y);

        const new_before = matrix_b.apply(before);
        const new_after = matrix_a.apply(after);

        if (symmetric) {
            const b_l = Snap.len(center.x, center.y, new_before.x, new_before.y);
            const a_l = Snap.len(center.x, center.y, new_after.x, new_after.y);

            const l = (a_l + b_l) / 2;

            new_after.x = center.x + (new_after.x - center.x) * (l / a_l);
            new_after.y = center.y + (new_after.y - center.y) * (l / a_l);

            new_before.x = center.x + (new_before.x - center.x) * (l / b_l);
            new_before.y = center.y + (new_before.y - center.y) * (l / b_l);
        }

        if (modify_points) {
            after.x = new_after.x;
            after.y = new_after.y;
            before.x = new_before.x;
            before.y = new_before.y;
        }
        return (modify_points) ? undefined : [new_after, new_before]
    }


    function seg_find_segments(anals) {
        anals = anals || this;

        let segments = [];

        let indxs = anals.map((s, i) => (s.ending === PathPoint.START
            || s.ending === PathPoint.START_END) ? i : undefined).filter(Boolean);

        for (let i = 0, l = indxs.length + 1, start = 0; i < l; ++i) {
            segments.push(anals.slice(start, indxs[i]));
            start = indxs[i];
        }

        // if (!segments.length) segments.push(anals); //add the whole part if no segments
        return segments;
    }

    function bezeirs(anals) {
        anals = anals || this;

        let result = [];
        let prev, to_close;
        for (let i = 0, l = anals.length; i < l; ++i) {
            let next = anals[i];
            if (!prev) {
                prev = next;
                if (prev.ending === PathPoint.START_END) {
                    to_close = prev;
                }
                continue;
            }

            if (prev.a && next.b) {
                const bz = Snap.bezier(prev.c.x, prev.c.y, prev.a.x, prev.a.y, next.b.x,
                    next.b.y, next.c.x, next.c.y);
                if (prev.ending === PathPoint.START || prev.ending === PathPoint.START_END) {
                    bz.start = true;
                }
                result.push(bz);
            }

            if (next.ending === PathPoint.END || i === l - 1) {
                if (to_close) {
                    const bz = Snap.bezier(next.c.x, next.c.y, next.a.x, next.a.y, to_close.b.x,
                        to_close.b.y, to_close.c.x, to_close.c.y);
                    result.push(bz);
                    to_close = undefined;
                }
                prev = undefined;
            } else if (next.ending === PathPoint.START || next.ending === PathPoint.START_END) {
                if (to_close && prev) {
                    const bz = Snap.bezier(prev.c.x, prev.c.y, prev.a.x, prev.a.y, to_close.b.x,
                        to_close.b.y, to_close.c.x, to_close.c.y);
                    result.push(bz);
                }

                to_close = (next.ending === PathPoint.START_END) ? next : undefined;

                prev = next;
            } else {
                prev = next;
            }

        }

        return result;
    }

    elproto.getSegmentAnalysis = function () {
        let path_str = getPath[this.type](this);

        let c_segs = path2curve(path_str, false, true);
        c_segs = removeRedundantCSegs(c_segs);

        let prev, joins = [], segments = [];
        for (let i = 0, l = c_segs.length, seg, last; i < l; ++i) {
            seg = c_segs[i];

            if (i) last = joins[joins.length - 1];

            if (seg[0] === 'M') {
                if (i) { //this is a later segment
                    if (last.c.x === seg[1] && last.c.y === seg[2]) {
                        //check for connection with previous
                        break; //redundant point
                    }

                    //check for previous closed segment
                    let start_seg = joins[segments[segments.length - 1]];
                    if (start_seg.c.x === last.c.x && start_seg.c.y === last.c.y) {
                        start_seg.ending = PathPoint.START_END;
                        start_seg.b = last.b;
                        joins.pop();
                    } else {
                        last.ending = PathPoint.END;
                    }
                }
                segments.push(joins.length);

                joins.push(new PathPoint({
                    x: seg[1],
                    y: seg[2]
                }, undefined, undefined, PathPoint.START));

                continue;
            }

            //This is Curve
            let a = {x: seg[1], y: seg[2]},
                b = {x: seg[3], y: seg[4]},
                c = {x: seg[5], y: seg[6]};

            last.a = a;
            joins.push(new PathPoint(c, b, undefined, undefined));
        }

        //Check for closed segment
        let start_seg = joins[segments[segments.length - 1]];
        let last = joins[joins.length - 1];
        if (Math.abs(start_seg.c.x - last.c.x) < ERROR && Math.abs(start_seg.c.y - last.c.y) < ERROR) {
            start_seg.ending = PathPoint.START_END;
            start_seg.b = last.b;
            joins.pop();
        } else {
            last.ending = PathPoint.END;
        }

        joins.forEach((pp) => pp.getType());
        joins.segments = seg_find_segments.bind(joins);

        return joins;
    };

    function toBeziers(anals, segmented) {
        if (anals && !Array.isArray(anals) && !anals.getSegmentAnalysis) {
            segmented = anals;
            anals = undefined;
        }
        anals = anals || ((this.getSegmentAnalysis) ? this.getSegmentAnalysis() : undefined);
        if (anals.getSegmentAnalysis) anals = anals.getSegmentAnalysis();

        if (!anals) return undefined;

        let bezs = bezeirs(anals);
        if (segmented) {
            const res = [[]];
            let cur = res[0];
            bezs.forEach((bz, i) => {
                if (i && bz.start) {
                    cur = [bz];
                    res.push(cur);
                } else {
                    cur.push(bz);
                }
            });
            bezs = res;
        }

        return bezs;
    }

    elproto.toBeziers = toBeziers;
    Snap.path.toBeziers = toBeziers

    elproto.toPolyBezier = function () {
        return Snap.polyBezier(this.toBeziers());
    };

    function cubicFromThirdPoints(p1, p2, p3, p4) {
        let m = [
            [1, 0, 0, 0],
            [-0.83333333333333, 3, -1.5, 0.3333333333333],
            [0.333333333333333, -1.5, 3, -0.8333333333333],
            [0, 0, 0, 1],
        ];

        let x = [[p1.x], [p2.x], [p3.x], [p4.x]],
            y = [[p1.y], [p2.y], [p3.y], [p4.y]];

        let new_x, new_y;
        if (math.matrix) {
            m = math.matrix(m);
            new_x = math.multiply(m, x).toArray(); //math.matrix(x).toArray();
            new_y = math.multiply(m, y).toArray(); // math.matrix(y).toArray();
        } else {
            new_x = math.multiply(m, x);
            new_y = math.multiply(m, y);
        }

        return [
            p1,
            {x: new_x[1][0], y: new_y[1][0]},
            {x: new_x[2][0], y: new_y[2][0]},
            p4];
    }

    Snap.path.cubicFromThirdPoints = cubicFromThirdPoints;

    Snap._.box = box; //for backward compatibility
    Snap.box = box;

    Snap.registerType("bbox", BBox)

    /*\
     * Snap.path.findDotsAtSegment
     [ method ]
     **
     * Utility method
     **
     * Finds dot coordinates on the given cubic beziér curve at the given t
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     - t (number) position on the curve (0..1)
     = (object) point information in format:
     o {
     o     x: (number) x coordinate of the point,
     o     y: (number) y coordinate of the point,
     o     m: {
     o         x: (number) x coordinate of the left anchor,
     o         y: (number) y coordinate of the left anchor
     o     },
     o     n: {
     o         x: (number) x coordinate of the right anchor,
     o         y: (number) y coordinate of the right anchor
     o     },
     o     start: {
     o         x: (number) x coordinate of the start of the curve,
     o         y: (number) y coordinate of the start of the curve
     o     },
     o     end: {
     o         x: (number) x coordinate of the end of the curve,
     o         y: (number) y coordinate of the end of the curve
     o     },
     o     alpha: (number) angle of the curve derivative at the point
     o }
     \*/
    Snap.path.findDotsAtSegment = findDotsAtSegment;
    /*\
     * Snap.path.bezierBBox
     [ method ]
     **
     * Utility method
     **
     * Returns the bounding box of a given cubic beziér curve
     - p1x (number) x of the first point of the curve
     - p1y (number) y of the first point of the curve
     - c1x (number) x of the first anchor of the curve
     - c1y (number) y of the first anchor of the curve
     - c2x (number) x of the second anchor of the curve
     - c2y (number) y of the second anchor of the curve
     - p2x (number) x of the second point of the curve
     - p2y (number) y of the second point of the curve
     * or
     - bez (array) array of six points for beziér curve
     = (object) bounding box
     o {
     o     x: (number) x coordinate of the left top point of the box,
     o     y: (number) y coordinate of the left top point of the box,
     o     x2: (number) x coordinate of the right bottom point of the box,
     o     y2: (number) y coordinate of the right bottom point of the box,
     o     width: (number) width of the box,
     o     height: (number) height of the box
     o }
     \*/
    Snap.path.bezierBBox = bezierBBox;
    /*\
     * Snap.path.isPointInsideBBox
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if given point is inside bounding box
     - bbox (string) bounding box
     - x (string) x coordinate of the point
     - y (string) y coordinate of the point
     = (boolean) `true` if point is inside
     \*/
    Snap.path.isPointInsideBBox = isPointInsideBBox;
    Snap.closest = function (x, y, X, Y) {
        let r = 100,
            b = box(x - r / 2, y - r / 2, r, r);
        const inside = [],
            getter = X[0].hasOwnProperty('x') ? function (i) {
                return {
                    x: X[i].x,
                    y: X[i].y,
                };
            } : function (i) {
                return {
                    x: X[i],
                    y: Y[i],
                };
            };
        let found = 0;
        while (r <= 1e6 && !found) {
            for (var i = 0, ii = X.length; i < ii; ++i) {
                const xy = getter(i);
                if (isPointInsideBBox(b, xy.x, xy.y)) {
                    found++;
                    inside.push(xy);
                    break;
                }
            }
            if (!found) {
                r *= 2;
                b = box(x - r / 2, y - r / 2, r, r);
            }
        }
        if (r == 1e6) {
            return;
        }
        let len = Infinity,
            res;
        for (i = 0, ii = inside.length; i < ii; ++i) {
            const l = Snap.len(x, y, inside[i].x, inside[i].y);
            if (len > l) {
                len = l;
                inside[i].len = l;
                res = inside[i];
            }
        }
        return res;
    };
    /*\
     * Snap.path.isBBoxIntersect
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if two bounding boxes intersect
     - bbox1 (string) first bounding box
     - bbox2 (string) second bounding box
     = (boolean) `true` if bounding boxes intersect
     \*/
    Snap.path.isBBoxIntersect = isBBoxIntersect;
    /*\
     * Snap.path.intersection
     [ method ]
     **
     * Utility method
     **
     * Finds intersections of two paths
     - path1 (string) path string
     - path2 (string) path string
     = (array) dots of intersection
     o [
     o     {
     o         x: (number) x coordinate of the point,
     o         y: (number) y coordinate of the point,
     o         t1: (number) t value for segment of path1,
     o         t2: (number) t value for segment of path2,
     o         segment1: (number) order number for segment of path1,
     o         segment2: (number) order number for segment of path2,
     o         bez1: (array) eight coordinates representing beziér curve for the segment of path1,
     o         bez2: (array) eight coordinates representing beziér curve for the segment of path2
     o     }
     o ]
     \*/
    Snap.path.intersection = pathIntersection;
    Snap.path.intersectionNumber = pathIntersectionNumber;
    Snap.path.isPathOverlapRect = isPathOverlapRect;
    /*\
     * Snap.path.isPointInside
     [ method ]
     **
     * Utility method
     **
     * Returns `true` if given point is inside a given closed path.
     *
     * Note: fill mode doesn’t affect the result of this method.
     - path (string) path string
     - x (number) x of the point
     - y (number) y of the point
     = (boolean) `true` if point is inside the path
     \*/
    Snap.path.isPointInside = isPointInsidePath;
    /*\
     * Snap.path.getBBox
     [ method ]
     **
     * Utility method
     **
     * Returns the bounding box of a given path
     - path (string) path string
     = (object) bounding box
     o {
     o     x: (number) x coordinate of the left top point of the box,
     o     y: (number) y coordinate of the left top point of the box,
     o     x2: (number) x coordinate of the right bottom point of the box,
     o     y2: (number) y coordinate of the right bottom point of the box,
     o     width: (number) width of the box,
     o     height: (number) height of the box
     o }
     \*/
    Snap.path.getBBox = pathBBox;
    Snap.path.get = getPath;
    /*\
     * Snap.path.toRelative
     [ method ]
     **
     * Utility method
     **
     * Converts path coordinates into relative values
     - path (string) path string
     = (array) path string
     \*/
    Snap.path.toRelative = pathToRelative;
    /*\
     * Snap.path.toAbsolute
     [ method ]
     **
     * Utility method
     **
     * Converts path coordinates into absolute values
     - path (string) path string
     = (array) path string
     \*/
    Snap.path.toAbsolute = pathToAbsolute;
    /*\
     * Snap.path.toCubic
     [ method ]
     **
     * Utility method
     **
     * Converts path to a new path where all segments are cubic beziér curves
     - pathString (string|array) path string or array of segments
     = (array) array of segments
     \*/
    Snap.path.toCubic = path2curve;
    /*\
     * Snap.path.map
     [ method ]
     **
     * Transform the path string with the given matrix
     - path (string) path string
     - matrix (object) see @Matrix
     = (string) transformed path string
     \*/
    Snap.path.map = mapPath;
    Snap.path.toString = toString;
    Snap.path.clone = pathClone;

    Snap.path.getPointSample = getPointSample;
})
;
