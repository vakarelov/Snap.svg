Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {

    ///////////////// Bezier Library

    //Based on https://github.com/Pomax/bezierjs
    /**
     * Bezier curve constructor. The constructor argument can be one of three things:
     *
     * 1. array/4 of {x:..., y:..., z:...}, z optional
     * 2. numerical array/8 ordered x1,y1,x2,y2,x3,y3,x4,y4
     * 3. numerical array/12 ordered x1,y1,z1,x2,y2,z2,x3,y3,z3,x4,y4,z4
     *
     */
    const Bezier = function (coords) {
        this.id = String.rand(4);
        let args = (coords && coords.forEach) ? coords : [].slice.call(arguments);
        let coordlen = false;
        if (typeof args[0] === 'object') {
            coordlen = args.length;
            const newargs = [];
            args.forEach(function (point) {
                if (Array.isArray(point)) {
                    point.forEach((c) => newargs.push(c));
                } else {
                    ['x', 'y', 'z'].forEach(function (d) {
                        if (typeof point[d] !== 'undefined') {
                            newargs.push(point[d]);
                        }
                    });
                }
            });
            args = newargs;
        }
        let higher = false;
        const len = args.length;
        if (coordlen) {
            if (coordlen > 4) {
                if (arguments.length !== 1) {
                    throw new Error(
                        'Only new Bezier(point[]) is accepted for 4th and higher order curves');
                }
                higher = true;
            }
        } else {
            if (len !== 6 && len !== 8 && len !== 9 && len !== 12) {
                if (arguments.length !== 1) {
                    throw new Error(
                        'Only new Bezier(point[]) is accepted for 4th and higher order curves');
                }
            }
        }
        const _3d = (!higher && (len === 9 || len === 12)) ||
            (coords && coords[0] &&
                (typeof coords[0].z !== 'undefined'
                    || (Array.isArray(coords[0]) && coords[0].length === 3)
                )
            );
        this._3d = _3d;
        const points = [];
        let idx = 0;
        const step = (_3d ? 3 : 2);
        for (; idx < len; idx += step) {
            let point;

            point = {
                x: args[idx],
                y: args[idx + 1],
            };
            if (_3d) {
                point.z = args[idx + 2];
            }

            points.push(point);
        }
        this.order = points.length - 1;
        this.points = points;
        const dims = ['x', 'y'];
        if (_3d) dims.push('z');
        this.dims = dims;
        this.dimlen = dims.length;
        (function (curve) {
            const a = utils.align(points, {p1: points[0], p2: points[curve.order]});
            for (let i = 0; i < a.length; ++i) {
                if (abs(a[i].y) > 0.0001) {
                    curve._linear = false;
                    return;
                }
            }
            curve._linear = true;
        }(this));
        this._t1 = 0;
        this._t2 = 1;
        this.update();
    };

    Bezier.fromSVG = function (svgString) {
        let list = svgString.match(/[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/g).map(parseFloat);
        const relative = /[cq]/.test(svgString);
        if (!relative) return new Bezier(list);
        list = list.map(function (v, i) {
            return i < 2 ? v : v + list[i % 2];
        });
        return new Bezier(list);
    };

    function getABC(n, S, B, E, t) {
        if (typeof t === 'undefined') {
            t = 0.5;
        }
        const u = utils.projectionratio(t, n),
            um = 1 - u,
            C = {
                x: u * S.x + um * E.x,
                y: u * S.y + um * E.y,
            },
            s = utils.abcratio(t, n),
            A = {
                x: B.x + (B.x - C.x) / s,
                y: B.y + (B.y - C.y) / s,
            };
        return {A: A, B: B, C: C};
    }

    Bezier.quadraticFromPoints = function (p1, p2, p3, t) {
        if (typeof t === 'undefined') {
            t = 0.5;
        }
        // shortcuts, although they're really dumb
        if (t === 0) {
            return new Bezier(p2, p2, p3);
        }
        if (t === 1) {
            return new Bezier(p1, p2, p2);
        }
        // real fitting.
        const abc = getABC(2, p1, p2, p3, t);
        return new Bezier(p1, abc.A, p3);
    };

    Bezier.cubicFromPoints = function (S, B, E, t, d1) {
        if (typeof t === 'undefined') {
            t = 0.5;
        }
        const abc = getABC(3, S, B, E, t);
        if (typeof d1 === 'undefined') {
            d1 = utils.dist(B, abc.C);
        }
        const d2 = d1 * (1 - t) / t;

        const selen = utils.dist(S, E),
            lx = (E.x - S.x) / selen,
            ly = (E.y - S.y) / selen,
            bx1 = d1 * lx,
            by1 = d1 * ly,
            bx2 = d2 * lx,
            by2 = d2 * ly;
        // derivation of new hull coordinates
        const e1 = {x: B.x - bx1, y: B.y - by1},
            e2 = {x: B.x + bx2, y: B.y + by2},
            A = abc.A,
            v1 = {x: A.x + (e1.x - A.x) / (1 - t), y: A.y + (e1.y - A.y) / (1 - t)},
            v2 = {x: A.x + (e2.x - A.x) / (t), y: A.y + (e2.y - A.y) / (t)},
            nc1 = {x: S.x + (v1.x - S.x) / (t), y: S.y + (v1.y - S.y) / (t)},
            nc2 = {
                x: E.x + (v2.x - E.x) / (1 - t),
                y: E.y + (v2.y - E.y) / (1 - t),
            };
        // ...done
        return new Bezier(S, nc1, nc2, E);
    };

    const getUtils = function () {
        return utils;
    };

    Bezier.getUtils = getUtils;

    Bezier.prototype = {
        getUtils: getUtils,
        valueOf: function () {
            return this.toString();
        },
        toString: function (point_sep) {
            return utils.pointsToString(this.points, point_sep);
        },
        clone: function () {
            return new Bezier(this.points.slice());
        },
        toSVG: function (relative) {
            if (this._3d) return false;
            const p = this.points,
                x = p[0].x,
                y = p[0].y,
                s = ['M', x, y, (this.order === 2 ? 'Q' : 'C')];
            let i = 1;
            const last = p.length;
            for (; i < last; ++i) {
                s.push(p[i].x);
                s.push(p[i].y);
            }
            return s.join(' ');
        },

        update: function () {
            // one-time pointAt derivative coordinates
            this.dpoints = [];
            let p = this.points, d = p.length, c = d - 1;
            for (; d > 1; d--, c--) {
                const list = [];
                let j = 0, dpt;
                for (; j < c; j++) {
                    dpt = {
                        x: c * (p[j + 1].x - p[j].x),
                        y: c * (p[j + 1].y - p[j].y),
                    };
                    if (this._3d) {
                        dpt.z = c * (p[j + 1].z - p[j].z);
                    }
                    list.push(dpt);
                }
                this.dpoints.push(list);
                p = list;
            }
            this.computedirection();
        },

        computedirection: function () {
            const points = this.points;
            const angle = utils.angle(points[0], points[this.order], points[1]);
            this.clockwise = angle > 0;
        },

        length: function () {
            if (this.order === 1) {
                let sum = (this.points[0].x - this.points[1].x) ** 2
                    + (this.points[0].y - this.points[1].y) ** 2;

                if (this._3d) sum += (this.points[0].z - this.points[1].z) ** 2;

                return Math.sqrt(sum);
            }

            return utils.length(this.derivative.bind(this));
        },
        _lut: [],
        getLUT: function (steps) {
            steps = steps || 100;
            if (this._lut.length === steps) {
                return this._lut;
            }
            this._lut = [];
            for (let t = 0; t <= steps; t++) {
                this._lut.push(this.compute(t / steps));
            }
            return this._lut;
        },
        on: function (point, error) {
            error = error || 5;
            const lut = this.getLUT(), hits = [];
            let c, t = 0;
            for (let i = 0; i < lut.length; ++i) {
                c = lut[i];
                if (utils.dist(c, point) < error) {
                    hits.push(c);
                    t += i / lut.length;
                }
            }
            if (!hits.length) return false;
            return t /= hits.length;
        },

        project: function (point) {
            // step 1: coarse check
            const LUT = this.getLUT(),
                l = LUT.length - 1,
                closest = utils.closest(LUT, point);
            let mdist = closest.mdist;
            const mpos = closest.mpos;

            if (mpos === 0 || mpos === l) {
                var t = mpos / l, pt = this.compute(t);
                pt.t = t;
                pt.d = mdist;
                return pt;
            }

            // step 2: fine check
            var ft, t, p, d,
                t1 = (mpos - 1) / l,
                t2 = (mpos + 1) / l,
                step = 0.1 / l;
            mdist += 1;
            for (t = t1, ft = t; t < t2 + step; t += step) {
                p = this.compute(t);
                d = utils.dist(point, p);
                if (d < mdist) {
                    mdist = d;
                    ft = t;
                }
            }
            p = this.compute(ft);
            p.t = ft;
            p.d = mdist;
            return p;
        },

        get: function (t) {
            return this.compute(t);
        },
        point: function (idx) {
            return this.points[idx];
        },
        first: function () {
            return this.points[0];
        },
        last: function () {
            return this.points[this.points.length - 1];
        },
        lastTarget: function () {
            return this.points[this.points.length - 2]
        },
        firstTarget: function () {
            return this.points[1]
        },
        compute: function (t) {
            // shortcuts
            if (t === 0) {
                return this.points[0];
            }
            if (t === 1) {
                return this.points[this.order];
            }

            let p = this.points;
            const mt = 1 - t;

            // linear?
            if (this.order === 1) {
                ret = {
                    x: mt * p[0].x + t * p[1].x,
                    y: mt * p[0].y + t * p[1].y,
                };
                if (this._3d) {
                    ret.z = mt * p[0].z + t * p[1].z;
                }
                return ret;
            }

            // quadratic/cubic curve?
            if (this.order < 4) {
                const mt2 = mt * mt,
                    t2 = t * t;
                let a, b, c, d = 0;
                if (this.order === 2) {
                    p = [p[0], p[1], p[2], ZERO];
                    a = mt2;
                    b = mt * t * 2;
                    c = t2;
                } else if (this.order === 3) {
                    a = mt2 * mt;
                    b = mt2 * t * 3;
                    c = mt * t2 * 3;
                    d = t * t2;
                }
                var ret = {
                    x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x,
                    y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y,
                };
                if (this._3d) {
                    ret.z = a * p[0].z + b * p[1].z + c * p[2].z + d * p[3].z;
                }
                return ret;
            }

            // higher order curves: use de Casteljau's computation
            const dCpts = JSON.parse(JSON.stringify(this.points));
            while (dCpts.length > 1) {
                for (let i = 0; i < dCpts.length - 1; ++i) {
                    dCpts[i] = {
                        x: dCpts[i].x + (dCpts[i + 1].x - dCpts[i].x) * t,
                        y: dCpts[i].y + (dCpts[i + 1].y - dCpts[i].y) * t,
                    };
                    if (typeof dCpts[i].z !== 'undefined') {
                        dCpts[i] = dCpts[i].z + (dCpts[i + 1].z - dCpts[i].z) * t;
                    }
                }
                dCpts.splice(dCpts.length - 1, 1);
            }
            return dCpts[0];
        },
        tAtLength: function (length, precision, tot_length) {
            precision = precision || 1;
            tot_length = tot_length || this.length();

            //Linear case
            if (this.order === 1) {
                return length / tot_length;
            }

            let t = .5;
            let lev = 2;
            let more = 100;
            while (more--) {
                let spl = this.split(t);
                let l = spl.left.length();
                if (utils.approximately(l, length, precision)) {
                    return t;
                }
                if (l < length) {
                    t += 1 / 2 ** lev;
                } else {
                    t -= 1 / 2 ** lev;
                }
                ++lev;
            }
            return t;
        },
        getPointAtLength(length, precision) {
            let t = this.tAtLength(length, precision);
            let p = this.compute(t);
            let der = this.derivative(t);
            p.alpha = 180 + 90 - Math.atan2(der.x, der.y) * 180 / Math.PI;
            return p;
        },
        raise: function () {
            var p = this.points, np = [p[0]], i, k = p.length, pi, pim;
            for (var i = 1; i < k; ++i) {
                pi = p[i];
                pim = p[i - 1];
                np[i] = {
                    x: (k - i) / k * pi.x + i / k * pim.x,
                    y: (k - i) / k * pi.y + i / k * pim.y,
                };
            }
            np[k] = p[k - 1];
            return new Bezier(np);
        },
        derivative: function (t) {
            const mt = 1 - t;
            let a, b, c = 0,
                p = this.dpoints[0];
            if (this.order === 1) {
                p = [p[0], ZERO, ZERO];
                a = 1;
            }
            if (this.order === 2) {
                p = [p[0], p[1], ZERO];
                a = mt;
                b = t;
            }
            if (this.order === 3) {
                a = mt * mt;
                b = mt * t * 2;
                c = t * t;
            }
            const ret = {
                x: a * p[0].x + b * p[1].x + c * p[2].x,
                y: a * p[0].y + b * p[1].y + c * p[2].y,
            };
            if (this._3d) {
                ret.z = a * p[0].z + b * p[1].z + c * p[2].z;
            }
            return ret;
        },
        inflections: function () {
            return utils.inflections(this.points);
        },
        normal: function (t) {
            return this._3d ? this.__normal3(t) : this.__normal2(t);
        },
        __normal2: function (t) {
            const d = this.derivative(t);
            const q = sqrt(d.x * d.x + d.y * d.y);
            return {x: -d.y / q, y: d.x / q};
        },
        __normal3: function () {
            // see http://stackoverflow.com/questions/25453159
            const r1 = this.derivative(t),
                r2 = this.derivative(t + 0.01),
                q1 = sqrt(r1.x * r1.x + r1.y * r1.y + r1.z * r1.z),
                q2 = sqrt(r2.x * r2.x + r2.y * r2.y + r2.z * r2.z);
            r1.x /= q1;
            r1.y /= q1;
            r1.z /= q1;
            r2.x /= q2;
            r2.y /= q2;
            r2.z /= q2;
            // cross product
            const c = {
                x: r2.y * r1.z - r2.z * r1.y,
                y: r2.z * r1.x - r2.x * r1.z,
                z: r2.x * r1.y - r2.y * r1.x,
            };
            const m = sqrt(c.x * c.x + c.y * c.y + c.z * c.z);
            c.x /= m;
            c.y /= m;
            c.z /= m;
            // rotation matrix
            const R = [
                c.x * c.x, c.x * c.y - c.z, c.x * c.z + c.y,
                c.x * c.y + c.z, c.y * c.y, c.y * c.z - c.x,
                c.x * c.z - c.y, c.y * c.z + c.x, c.z * c.z];
            // normal vector:
            const n = {
                x: R[0] * r1.x + R[1] * r1.y + R[2] * r1.z,
                y: R[3] * r1.x + R[4] * r1.y + R[5] * r1.z,
                z: R[6] * r1.x + R[7] * r1.y + R[8] * r1.z,
            };
            return n;
        },
        hull: function (t) {
            let p = this.points,
                _p = [],
                pt;
            const q = [];
            let idx = 0,
                i = 0,
                l = 0;
            q[idx++] = p[0];
            q[idx++] = p[1];
            q[idx++] = p[2];
            if (this.order === 3) {
                q[idx++] = p[3];
            }
            // we lerp between all points at each iteration, until we have 1 point left.
            while (p.length > 1) {
                _p = [];
                for (i = 0, l = p.length - 1; i < l; ++i) {
                    pt = utils.lerp(t, p[i], p[i + 1]);
                    q[idx++] = pt;
                    _p.push(pt);
                }
                p = _p;
            }
            return q;
        },
        split: function (t1, t2) {
            // shortcuts
            if (t1 === 0 && !!t2) {
                return this.split(t2).left;
            }
            if (t2 === 1) {
                return this.split(t1).right;
            }

            if (this.order === 0) {
                const p1 = this.points[0],
                    p2 = this.points[2];
                const at_t1 = {
                    x: p1.x + t1 * (p2.x - p1.x),
                    y: p1.y + t1 * (p2.y - p1.y),
                };
                if (this._3d) at_t1.z = p1.z + t1 * (p2.z - p1.z);
                const result = {
                    left: new Bezier([p1, at_t1]),
                    right: new Bezier([at_t1, p2]),
                };

            }
            if (this.order > 1) {
                const q = this.hull(t1);
                var result = {
                    left: this.order === 2 ?
                        new Bezier([q[0], q[3], q[5]]) :
                        new Bezier([q[0], q[4], q[7], q[9]]),
                    right: this.order === 2 ?
                        new Bezier([q[5], q[4], q[2]]) :
                        new Bezier([q[9], q[8], q[6], q[3]]),
                    // span: q,
                };
            }
            // make sure we bind _t1/_t2 information!
            result.left._t1 = utils.map(0, 0, 1, this._t1, this._t2);
            result.left._t2 = utils.map(t1, 0, 1, this._t1, this._t2);
            result.right._t1 = utils.map(t1, 0, 1, this._t1, this._t2);
            result.right._t2 = utils.map(1, 0, 1, this._t1, this._t2);

            // no shortcut: use "de Casteljau" iteration.

            // if we have no t2, we're done
            if (!t2) {
                return result;
            }

            // if we have a t2, split again:
            t2 = utils.map(t2, t1, 1, 0, 1);
            const subsplit = result.right.split(t2);
            return subsplit.left;
        },

        extrema: function () {
            const dims = this.dims,
                result = {};
            let roots = [],
                p, mfn;
            dims.forEach(function (dim) {

                mfn = function (v) {
                    return v[dim];
                };

                p = this.dpoints[0].map(mfn);

                result[dim] = utils.droots(p);
                if (this.order === 3) {
                    p = this.dpoints[1].map(mfn);
                    result[dim] = result[dim].concat(utils.droots(p));
                }
                result[dim] = result[dim].filter(function (t) {
                    return (t >= 0 && t <= 1);
                });
                roots = roots.concat(result[dim].sort());
            }.bind(this));
            roots.sort();
            result.values = roots;
            return result;
        },

        bbox: function () {
            const extrema = this.extrema(), result = {};
            this.dims.forEach(function (d) {
                result[d] = utils.getminmax(this, d, extrema[d]);
            }.bind(this));
            return result;
        },

        overlaps: function (curve) {
            const lbbox = this.bbox(),
                tbbox = curve.bbox();
            return utils.bboxoverlap(lbbox, tbbox);
        },

        offset: function (t, d) {
            if (typeof d !== 'undefined') {
                const c = this.get(t);
                const n = this.normal(t);
                const ret = {
                    c: c,
                    n: n,
                    x: c.x + n.x * d,
                    y: c.y + n.y * d,
                };
                if (this._3d) {
                    ret.z = c.z + n.z * d;
                }
                ;
                return ret;
            }

            if (this._linear) {
                const nv = this.normal(0);
                const coords = this.points.map(function (p) {
                    const ret = {
                        x: p.x + t * nv.x,
                        y: p.y + t * nv.y,
                    };
                    if (p.z && n.z) {
                        ret.z = p.z + t * nv.z;
                    }
                    return ret;
                });
                return [new Bezier(coords)];
            }
            const reduced = this.reduce();
            return reduced.map(function (s) {
                return s.scale(t);
            });
        },

        simple: function () {
            if (this.order === 3) {
                const a1 = utils.angle(this.points[0], this.points[3], this.points[1]);
                const a2 = utils.angle(this.points[0], this.points[3], this.points[2]);
                if (a1 > 0 && a2 < 0 || a1 < 0 && a2 > 0) return false;
            }
            const n1 = this.normal(0);
            const n2 = this.normal(1);
            let s = n1.x * n2.x + n1.y * n2.y;
            if (this._3d) {
                s += n1.z * n2.z;
            }
            const angle = abs(acos(s));
            return angle < pi / 3;
        },

        reduce: function () {
            let i, t1 = 0, t2 = 0;
            const step = 0.01;
            let segment;
            const pass1 = [], pass2 = [];
            // first pass: split on extrema
            let extrema = this.extrema().values;
            if (extrema.indexOf(0) === -1) {
                extrema = [0].coancat(extrema);
            }
            if (extrema.indexOf(1) === -1) {
                extrema.push(1);
            }

            for (t1 = extrema[0], i = 1; i < extrema.length; ++i) {
                t2 = extrema[i];
                segment = this.split(t1, t2);
                segment._t1 = t1;
                segment._t2 = t2;
                pass1.push(segment);
                t1 = t2;
            }

            // second pass: further reduce these segments to simple segments
            pass1.forEach(function (p1) {
                t1 = 0;
                t2 = 0;
                while (t2 <= 1) {
                    for (t2 = t1 + step; t2 <= 1 + step; t2 += step) {
                        segment = p1.split(t1, t2);
                        if (!segment.simple()) {
                            t2 -= step;
                            if (abs(t1 - t2) < step) {
                                // we can never form a reduction
                                return [];
                            }
                            segment = p1.split(t1, t2);
                            segment._t1 = utils.map(t1, 0, 1, p1._t1, p1._t2);
                            segment._t2 = utils.map(t2, 0, 1, p1._t1, p1._t2);
                            pass2.push(segment);
                            t1 = t2;
                            break;
                        }
                    }
                } //end while

                if (t1 < 1) {
                    segment = p1.split(t1, 1);
                    segment._t1 = utils.map(t1, 0, 1, p1._t1, p1._t2);
                    segment._t2 = p1._t2;
                    pass2.push(segment);
                }
            });
            return pass2;
        },

        reverse: function () {
            this.points.reverse();
            this.update();
            if (this._lut && this._lut.length > 0) this._lut = this._lut.reverse();
        },

        scale: function (d) {
            const order = this.order;
            let distanceFn = false;
            if (typeof d === 'function') {
                distanceFn = d;
            }
            if (distanceFn && order === 2) {
                return this.raise().scale(distanceFn);
            }

            // TODO: add special handling for degenerate (=linear) curves.
            const clockwise = this.clockwise;
            const r1 = distanceFn ? distanceFn(0) : d;
            const r2 = distanceFn ? distanceFn(1) : d;
            const v = [this.offset(0, 10), this.offset(1, 10)];
            const o = utils.lli4(v[0], v[0].c, v[1], v[1].c);
            if (!o) {
                throw new Error('cannot scale this curve. Try reducing it first.');
            }
            // move all points by distance 'd' wrt the origin 'o'
            const points = this.points, np = [];

            // move end points by fixed distance along normal.
            [0, 1].forEach(function (t) {
                const p = np[t * order] = utils.copy(points[t * order]);
                p.x += (t ? r2 : r1) * v[t].n.x;
                p.y += (t ? r2 : r1) * v[t].n.y;
            }.bind(this));

            if (!distanceFn) {
                // move control points to lie on the intersection of the offset
                // derivative vector, and the origin-through-control vector
                [0, 1].forEach(function (t) {
                    if (this.order === 2 && !!t) return;
                    const p = np[t * order];
                    const d = this.derivative(t);
                    const p2 = {x: p.x + d.x, y: p.y + d.y};
                    np[t + 1] = utils.lli4(p, p2, o, points[t + 1]);
                }.bind(this));
                return new Bezier(np);
            }

            // move control points by "however much necessary to
            // ensure the correct tangent to endpoint".
            [0, 1].forEach(function (t) {
                if (this.order === 2 && !!t) return;
                const p = points[t + 1];
                const ov = {
                    x: p.x - o.x,
                    y: p.y - o.y,
                };
                let rc = distanceFn ? distanceFn((t + 1) / order) : d;
                if (distanceFn && !clockwise) rc = -rc;
                const m = sqrt(ov.x * ov.x + ov.y * ov.y);
                ov.x /= m;
                ov.y /= m;
                np[t + 1] = {
                    x: p.x + rc * ov.x,
                    y: p.y + rc * ov.y,
                };
            }.bind(this));
            return new Bezier(np);
        },

        outline: function (d1, d2, d3, d4) {
            d2 = (typeof d2 === 'undefined') ? d1 : d2;
            const reduced = this.reduce(),
                len = reduced.length,
                fcurves = [];
            let bcurves = [],
                p,
                alen = 0;
            const tlen = this.length();

            const graduated = (typeof d3 !== 'undefined' && typeof d4 !== 'undefined');

            function linearDistanceFunction(s, e, tlen, alen, slen) {
                return function (v) {
                    const f1 = alen / tlen, f2 = (alen + slen) / tlen, d = e - s;
                    return utils.map(v, 0, 1, s + f1 * d, s + f2 * d);
                };
            };

            // form curve oulines
            reduced.forEach(function (segment) {
                slen = segment.length();
                if (graduated) {
                    fcurves.push(
                        segment.scale(linearDistanceFunction(d1, d3, tlen, alen, slen)));
                    bcurves.push(segment.scale(
                        linearDistanceFunction(-d2, -d4, tlen, alen, slen)));
                } else {
                    fcurves.push(segment.scale(d1));
                    bcurves.push(segment.scale(-d2));
                }
                alen += slen;
            });

            // reverse the "return" outline
            bcurves = bcurves.map(function (s) {
                p = s.points;
                if (p[3]) {
                    s.points = [p[3], p[2], p[1], p[0]];
                } else {
                    s.points = [p[2], p[1], p[0]];
                }
                return s;
            }).reverse();

            // form the endcaps as lines
            var fs = fcurves[0].points[0],
                fe = fcurves[len - 1].points[fcurves[len - 1].points.length - 1],
                bs = bcurves[len - 1].points[bcurves[len - 1].points.length - 1],
                be = bcurves[0].points[0],
                ls = utils.makeline(bs, fs),
                le = utils.makeline(fe, be),
                segments = [ls].concat(fcurves).concat([le]).concat(bcurves),
                slen = segments.length;

            return new PolyBezier(segments);
        },
        outlineshapes: function (d1, d2) {
            d2 = d2 || d1;
            const outline = this.outline(d1, d2).curves;
            const shapes = [];
            let i = 1;
            const len = outline.length;
            for (; i < len / 2; ++i) {
                const shape = utils.makeshape(outline[i], outline[len - i]);
                shape.startcap.virtual = (i > 1);
                shape.endcap.virtual = (i < len / 2 - 1);
                shapes.push(shape);
            }
            return shapes;
        },

        intersects: function (curve) {
            if (!curve) return this.selfintersects();
            if (curve.points.length === 2) {
                return this.lineIntersects(curve);
            }
            if (curve instanceof Bezier) {
                curve = curve.reduce();
            }
            return this.curveintersects(this.reduce(), curve);
        },

        lineIntersects: function (line) {

            if (Array.isArray(line)) line = {p1: line[0], p2: line[1]};

            const p1 = line.p1 || line.points[0];
            const p2 = line.p2 || line.points[1];
            const mx = Math.min(p1.x, p2.x),
                my = Math.min(p1.y, p2.y),
                MX = Math.max(p1.x, p2.x),
                MY = Math.max(p1.y, p2.y),
                self = this;

            return utils.roots(this.points, line).filter(function (t) {
                const p = self.get(t);
                return utils.between(p.x, mx, MX) && utils.between(p.y, my, MY);
            });
        },

        selfintersects: function () {
            const reduced = this.reduce();
            // "simple" curves cannot intersect with their direct
            // neighbour, so for each segment X we check whether
            // it intersects [0:x-2][x+2:last].
            let i;
            const len = reduced.length - 2;
            let results = [], result, left, right;
            for (i = 0; i < len; ++i) {
                left = reduced.slice(i, i + 1);
                right = reduced.slice(i + 2);
                result = this.curveintersects(left, right);
                results = results.concat(result);
            }
            return results;
        },

        curveintersects: function (c1, c2) {
            const pairs = [];
            // step 1: pair off any overlapping segments
            c1.forEach(function (l) {
                c2.forEach(function (r) {
                    if (l.overlaps(r)) {
                        pairs.push({left: l, right: r});
                    }
                });
            });
            // step 2: for each pairing, run through the convergence algorithm.
            let intersections = [];
            pairs.forEach(function (pair) {
                const result = utils.pairiteration(pair.left, pair.right);
                if (result.length > 0) {
                    intersections = intersections.concat(result);
                }
            });
            return intersections;
        },

        arcs: function (errorThreshold) {
            errorThreshold = errorThreshold || 0.5;
            const circles = [];
            return this._iterate(errorThreshold, circles);
        },
        _error: function (pc, np1, s, e) {
            const q = (e - s) / 4,
                c1 = this.get(s + q),
                c2 = this.get(e - q),
                ref = utils.dist(pc, np1),
                d1 = utils.dist(pc, c1),
                d2 = utils.dist(pc, c2);
            return abs(d1 - ref) + abs(d2 - ref);
        },
        _iterate: function (errorThreshold, circles) {
            let s = 0, e = 1, safety;
            // we do a binary search to find the "good `t` closest to no-longer-good"
            do {
                safety = 0;

                // step 1: start with the maximum possible arc
                e = 1;

                // points:
                const np1 = this.get(s);
                let np2, np3, arc, prev_arc;

                // booleans:
                let curr_good = false, prev_good = false, done;

                // numbers:
                let m = e, prev_e = 1, step = 0;

                // step 2: find the best possible arc
                do {
                    prev_good = curr_good;
                    prev_arc = arc;
                    m = (s + e) / 2;
                    step++;

                    np2 = this.get(m);
                    np3 = this.get(e);

                    arc = utils.getccenter(np1, np2, np3);
                    const error = this._error(arc, np1, s, e);
                    curr_good = (error <= errorThreshold);

                    done = prev_good && !curr_good;
                    if (!done) prev_e = e;

                    // this arc is fine: we can move 'e' up to see if we can find a wider arc
                    if (curr_good) {
                        // if e is already at max, then we're done for this arc.
                        if (e >= 1) {
                            prev_e = 1;
                            prev_arc = arc;
                            break;
                        }
                        // if not, move it up by half the iteration distance
                        e = e + (e - s) / 2;
                    }

                    // this is a bad arc: we need to move 'e' down to find a good arc
                    else {
                        e = m;
                    }
                }
                while (!done && safety++ < 100);

                if (safety >= 100) {
                    console.error('arc abstraction somehow failed...');
                    break;
                }

                // console.log("[F] arc found", s, prev_e, prev_arc.x, prev_arc.y, prev_arc.s, prev_arc.e);

                prev_arc = (prev_arc ? prev_arc : arc);
                circles.push(prev_arc);
                s = prev_e;
            }
            while (e < 1);
            return circles;
        },
    };

    /**
     * Poly Bezier
     * @param {[type]} curves [description]
     */
    var PolyBezier = function (curves) {
        this.curves = [];
        this._3d = false;
        if (!!curves) {
            this.curves = curves.map((bz) => {
                if (Snap.is(bz, "bezier")) {
                    return bz;
                } else {
                    return new Bezier(bz);
                }
            });
            this._3d = this.curves[0]._3d;
        }
    };

    PolyBezier.prototype = {
        valueOf: function () {
            return this.toString();
        },
        toString: function () {
            const res = this.curves.map((c) => c.toString());
            return res.join(' ');
        },
        clone: function () {
            return new PolyBezier(this.curves.map((bz) => bz.clone()));
        },
        toSVG: function () {
            const deg_to_command = [undefined, 'L', 'Q', 'C'];
            let res = '';
            let prev, c, last_p, points;
            for (let i = 0, l = this.curves.length; i < l; ++i) {
                c = this.curves[i];
                points = c.points;
                if (prev) {
                    last_p = prev[prev.length - 1];
                    let prefix = ' ';
                    const same_degree = points.length === prev.length;
                    if (!c.start && utils.approximately(last_p.x, points[0].x)
                        && utils.approximately(last_p.y, points[0].y)) {
                        prefix = ((same_degree) ?
                            ' '
                            :
                            ' ' + deg_to_command[points.length - 1] + points[0].x + ',' +
                            points[0].y);
                    } else {
                        !c.start && console.log(i, prev, points);
                        // prev();
                        prefix = '     M' + points[0].x + ',' + points[0].y;
                    }
                    res += ' ' + prefix + ' ' +
                        utils.pointsToString(points.slice(1), ', ', ' ', true);
                } else {
                    res += ' M' + points[0].x + ',' + points[0].y;
                    res += ' ' + deg_to_command[points.length - 1]
                        + utils.pointsToString(points.slice(1), ', ', ' ', true);

                }
                prev = points;
            }
            return res;
        },
        getPoints: function () {
            return this.curves.map((bz) => bz.points);
        },
        getFirstPoint: function () {
            return this.curves[0].points[0];
        },
        getLastPoint: function () {
            let c = this.curves[this.curves.length - 1];
            return c.points[c.order];
        },
        addCurve: function (curve) {
            this.curves.push(curve);
            this._3d = this._3d || curve._3d;
        },
        length: function () {
            return this.curves.map(function (v) {
                return v.length();
            }).reduce(function (a, b) {
                return a + b;
            });
        },
        getPointAtLength(length, precision) {
            let inc = 0;
            this.lengths = this.lengths || this.curves.map((c) => {
                inc += c.length();
                return inc;
            });
            const i = this.lengths.findIndex((l) => length <= l + 1e-10);
            if (i === -1) {
                return null;
            }

            length = (i) ? length - this.lengths[i - 1] : length;
            length = Math.max(0, length);
            return this.curves[i].getPointAtLength(length, precision);
        },
        curve: function (idx) {
            return this.curves[idx];
        },
        bbox: function () {
            const c = this.curves;
            const bbox = c[0].bbox();
            for (let i = 1; i < c.length; ++i) {
                utils.expandbox(bbox, c[i].bbox());
            }
            return bbox;
        },
        offset: function (d) {
            let offset = [];
            this.curves.forEach(function (v) {
                offset = offset.concat(v.offset(d));
            });
            return new PolyBezier(offset);
        },
        lineIntersects: function (line) {
            let intersections = [];
            this.curves.forEach(function (c, i) {
                const items = c.lineIntersects(line);
                if (items && items.length) {
                    intersections = intersections.concat(items.map((t_val) => {
                        return {curve: c, t: t_val, i: i};
                    }));
                }

            });
            return intersections;
        },
        intersect: function (curve) {
            let intersections = [];
            this.curves.forEach(function (c, i) {
                const items = c.intersect(curve);
                intersections = intersections.concat(items.map((t_val) => {
                    return {curve: c, t: t_val, i: i};
                }));
            });

            return intersections;
        },
        reverse: function () {
            let p1 = this.curves[0].first();
            this.curves.reverse();
            // console.log(this.getPoints());
            this.curves.forEach((bz) => bz.reverse());
            // console.log(this.getPoints());
            let p2 = this.curves[this.curves.length - 1].last();
            if (p2 !== p2) {
                console.log('Wrong', p1, p2);
            }
        },
        toPolyBezier: function () {
            return this;
        },
        toBeziers: function () {
            return this.curves;
        },
    };

    PolyBezier.prototype.getBBox = PolyBezier.bbox;
    PolyBezier.prototype.getControlPoints = PolyBezier.prototype.getPoints;

    //UTILITY Functions

    // math-inlining.
    var abs = Math.abs,
        cos = Math.cos,
        sin = Math.sin,
        acos = Math.acos,
        atan2 = Math.atan2,
        sqrt = Math.sqrt,
        pow = Math.pow,
        // cube root function yielding real bezier_roots
        crt = function (v) {
            return (v < 0) ? -pow(-v, 1 / 3) : pow(v, 1 / 3);
        },
        // trig constants
        pi = Math.PI,
        tau = 2 * pi,
        quart = pi / 2,
        // float precision significant decimal
        epsilon = 0.00001;

    // a zero coordinate, which is surprisingly useful
    var ZERO = {x: 0, y: 0, z: 0};

    // Bezier utility functions
    var utils = {
        // Legendre-Gauss abscissae with n=24 (x_i values, defined at i=n as the bezier_roots of the nth order Legendre polynomial Pn(x))
        Tvalues: [
            -0.0640568928626056260850430826247450385909,
            0.0640568928626056260850430826247450385909,
            -0.1911188674736163091586398207570696318404,
            0.1911188674736163091586398207570696318404,
            -0.3150426796961633743867932913198102407864,
            0.3150426796961633743867932913198102407864,
            -0.4337935076260451384870842319133497124524,
            0.4337935076260451384870842319133497124524,
            -0.5454214713888395356583756172183723700107,
            0.5454214713888395356583756172183723700107,
            -0.6480936519369755692524957869107476266696,
            0.6480936519369755692524957869107476266696,
            -0.7401241915785543642438281030999784255232,
            0.7401241915785543642438281030999784255232,
            -0.8200019859739029219539498726697452080761,
            0.8200019859739029219539498726697452080761,
            -0.8864155270044010342131543419821967550873,
            0.8864155270044010342131543419821967550873,
            -0.9382745520027327585236490017087214496548,
            0.9382745520027327585236490017087214496548,
            -0.9747285559713094981983919930081690617411,
            0.9747285559713094981983919930081690617411,
            -0.9951872199970213601799974097007368118745,
            0.9951872199970213601799974097007368118745,
        ],

        // Legendre-Gauss weights with n=24 (w_i values, defined by a function linked to in the Bezier primer article)
        Cvalues: [
            0.1279381953467521569740561652246953718517,
            0.1279381953467521569740561652246953718517,
            0.1258374563468282961213753825111836887264,
            0.1258374563468282961213753825111836887264,
            0.1216704729278033912044631534762624256070,
            0.1216704729278033912044631534762624256070,
            0.1155056680537256013533444839067835598622,
            0.1155056680537256013533444839067835598622,
            0.1074442701159656347825773424466062227946,
            0.1074442701159656347825773424466062227946,
            0.0976186521041138882698806644642471544279,
            0.0976186521041138882698806644642471544279,
            0.0861901615319532759171852029837426671850,
            0.0861901615319532759171852029837426671850,
            0.0733464814110803057340336152531165181193,
            0.0733464814110803057340336152531165181193,
            0.0592985849154367807463677585001085845412,
            0.0592985849154367807463677585001085845412,
            0.0442774388174198061686027482113382288593,
            0.0442774388174198061686027482113382288593,
            0.0285313886289336631813078159518782864491,
            0.0285313886289336631813078159518782864491,
            0.0123412297999871995468056670700372915759,
            0.0123412297999871995468056670700372915759,
        ],

        arcfn: function (t, derivativeFn) {
            const d = derivativeFn(t);
            let l = d.x * d.x + d.y * d.y;
            if (typeof d.z !== 'undefined') {
                l += d.z * d.z;
            }
            return sqrt(l);
        },

        between: function (v, m, M) {
            return (m <= v && v <= M) || utils.approximately(v, m) ||
                utils.approximately(v, M);
        },

        approximately: function (a, b, precision) {
            return abs(a - b) <= (precision || epsilon);
        },

        length: function (derivativeFn) {
            const z = 0.5;
            let sum = 0;
            const len = utils.Tvalues.length;
            let i, t;
            for (i = 0; i < len; ++i) {
                t = z * utils.Tvalues[i] + z;
                sum += utils.Cvalues[i] * utils.arcfn(t, derivativeFn);
            }
            return z * sum;
        },

        map: function (v, ds, de, ts, te) {
            const d1 = de - ds, d2 = te - ts, v2 = v - ds, r = v2 / d1;
            return ts + d2 * r;
        },

        lerp: function (r, v1, v2) {
            const ret = {
                x: v1.x + r * (v2.x - v1.x),
                y: v1.y + r * (v2.y - v1.y),
            };
            if (!!v1.z && !!v2.z) {
                ret.z = v1.z + r * (v2.z - v1.z);
            }
            return ret;
        },

        pointToString: function (sep, p) {
            let s = p.x + sep + p.y;
            if (typeof p.z !== 'undefined') {
                s += sep + p.z;
            }
            return s;
        },

        pointsToString: function (points, point_coord_sep, points_sep, skip_parent) {
            let f = utils.pointToString.bind(undefined, (point_coord_sep || ' '));
            points_sep = points_sep || ', ';
            const join = points.map(f).join(points_sep);
            return ((skip_parent) ? '' : '[') + join + ((skip_parent) ? '' : ']');
        },

        copy: function (obj) {
            return JSON.parse(JSON.stringify(obj));
        },

        angle: function (o, v1, v2) {
            let dx1 = v1.x - o.x,
                dy1 = v1.y - o.y,
                dx2 = v2.x - o.x,
                dy2 = v2.y - o.y;
            const cross = dx1 * dy2 - dy1 * dx2,
                m1 = sqrt(dx1 * dx1 + dy1 * dy1),
                m2 = sqrt(dx2 * dx2 + dy2 * dy2);
            let dot;
            dx1 /= m1;
            dy1 /= m1;
            dx2 /= m2;
            dy2 /= m2;
            dot = dx1 * dx2 + dy1 * dy2;
            return atan2(cross, dot);
        },

        // round as string, to avoid rounding errors
        round: function (v, d) {
            const s = '' + v;
            const pos = s.indexOf('.');
            return parseFloat(s.substring(0, pos + 1 + d));
        },

        dist: function (p1, p2) {
            const dx = p1.x - p2.x,
                dy = p1.y - p2.y;
            return sqrt(dx * dx + dy * dy);
        },

        closest: function (LUT, point) {
            let mdist = pow(2, 63), mpos, d;
            LUT.forEach(function (p, idx) {
                d = utils.dist(point, p);
                if (d < mdist) {
                    mdist = d;
                    mpos = idx;
                }
            });
            return {mdist: mdist, mpos: mpos};
        },

        abcratio: function (t, n) {
            // see ratio(t) note on http://pomax.github.io/bezierinfo/#abc
            if (n !== 2 && n !== 3) {
                return false;
            }
            if (typeof t === 'undefined') {
                t = 0.5;
            } else if (t === 0 || t === 1) {
                return t;
            }
            const bottom = pow(t, n) + pow(1 - t, n), top = bottom - 1;
            return abs(top / bottom);
        },

        projectionratio: function (t, n) {
            // see u(t) note on http://pomax.github.io/bezierinfo/#abc
            if (n !== 2 && n !== 3) {
                return false;
            }
            if (typeof t === 'undefined') {
                t = 0.5;
            } else if (t === 0 || t === 1) {
                return t;
            }
            const top = pow(1 - t, n), bottom = pow(t, n) + top;
            return top / bottom;
        },

        lli8: function (x1, y1, x2, y2, x3, y3, x4, y4) {
            const nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) *
                    (x3 * y4 - y3 * x4),
                ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) *
                    (x3 * y4 - y3 * x4),
                d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
            if (d == 0) {
                return false;
            }
            return {x: nx / d, y: ny / d};
        },

        lli4: function (p1, p2, p3, p4) {
            const x1 = p1.x, y1 = p1.y,
                x2 = p2.x, y2 = p2.y,
                x3 = p3.x, y3 = p3.y,
                x4 = p4.x, y4 = p4.y;
            return utils.lli8(x1, y1, x2, y2, x3, y3, x4, y4);
        },

        lli: function (v1, v2) {
            return utils.lli4(v1, v1.c, v2, v2.c);
        },

        makeline: function (p1, p2) {

            const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y, dx = (x2 - x1) / 3,
                dy = (y2 - y1) / 3;
            return new Bezier(x1, y1, x1 + dx, y1 + dy, x1 + 2 * dx, y1 + 2 * dy, x2,
                y2);
        },

        findbbox: function (sections) {
            let mx = 99999999, my = mx, MX = -mx, MY = MX;
            sections.forEach(function (s) {
                const bbox = s.bbox();
                if (mx > bbox.x.min) mx = bbox.x.min;
                if (my > bbox.y.min) my = bbox.y.min;
                if (MX < bbox.x.max) MX = bbox.x.max;
                if (MY < bbox.y.max) MY = bbox.y.max;
            });
            return {
                x: {min: mx, mid: (mx + MX) / 2, max: MX, size: MX - mx},
                y: {min: my, mid: (my + MY) / 2, max: MY, size: MY - my},
            };
        },

        shapeintersections: function (s1, bbox1, s2, bbox2) {
            if (!utils.bboxoverlap(bbox1, bbox2)) return [];
            const intersections = [];
            const a1 = [s1.startcap, s1.forward, s1.back, s1.endcap];
            const a2 = [s2.startcap, s2.forward, s2.back, s2.endcap];
            a1.forEach(function (l1) {
                if (l1.virtual) return;
                a2.forEach(function (l2) {
                    if (l2.virtual) return;
                    const iss = l1.intersects(l2);
                    if (iss.length > 0) {
                        iss.c1 = l1;
                        iss.c2 = l2;
                        iss.s1 = s1;
                        iss.s2 = s2;
                        intersections.push(iss);
                    }
                });
            });
            return intersections;
        },

        makeshape: function (forward, back) {
            const bpl = back.points.length;
            const fpl = forward.points.length;
            const start = utils.makeline(back.points[bpl - 1], forward.points[0]);
            const end = utils.makeline(forward.points[fpl - 1], back.points[0]);
            const shape = {
                startcap: start,
                forward: forward,
                back: back,
                endcap: end,
                bbox: utils.findbbox([start, forward, back, end]),
            };
            const self = utils;
            shape.intersections = function (s2) {
                return self.shapeintersections(shape, shape.bbox, s2, s2.bbox);
            };
            return shape;
        },

        getminmax: function (curve, d, list) {
            if (!list) return {min: 0, max: 0};
            let min = 0xFFFFFFFFFFFFFFFF, max = -min, t, c;
            if (list.indexOf(0) === -1) {
                list = [0].concat(list);
            }
            if (list.indexOf(1) === -1) {
                list.push(1);
            }
            let i = 0;
            const len = list.length;
            for (; i < len; ++i) {
                t = list[i];
                c = curve.get(t);
                if (c[d] < min) {
                    min = c[d];
                }
                if (c[d] > max) {
                    max = c[d];
                }
            }
            return {min: min, mid: (min + max) / 2, max: max, size: max - min};
        },

        arePointsBetween: function (p1, p2, points) {
            // Calculate the direction vector of the line formed by the reference points
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;

            // Normalize the direction vector
            const length = Math.sqrt(dx * dx + dy * dy);
            const normalizedDx = dx / length;
            const normalizedDy = dy / length;

            // Calculate the dot product of the normalized direction vector and each point
            const dotProducts = points.map(point => {
                const delta_x = point.x - p1.x;
                const delta_y = point.y - p1.y;
                return delta_x * normalizedDx + delta_y * normalizedDy;
            });

            // Check if all dot products are within the range [0, length]
            return dotProducts.every(dotProduct => dotProduct >= 0 && dotProduct <= length);
        },

        // Define a function to test if points are collinear within a given epsilon
        arePointsCollinear: function (points, epsilon) {
            epsilon = epsilon || 1e-10;

            if (points.length < 3) {
                // Collinearity requires at least 3 points
                return false;
            }

            // Calculate the slope between the first two points
            const x0 = points[0].x;
            const y0 = points[0].y;
            const x1 = points[1].x;
            const y1 = points[1].y;

            const initialSlope = (x1 - x0) !== 0 ? (y1 - y0) / (x1 - x0) : Infinity;

            // Check if the remaining points have approximately the same slope
            for (let i = 2; i < points.length; i++) {
                const xi = points[i].x;
                const yi = points[i].y;

                const currentSlope = (xi - x0) !== 0 ? (yi - y0) / (xi - x0) : Infinity;

                // Compare the current slope with the initial slope
                if (Math.abs(currentSlope - initialSlope) > epsilon) {
                    return false; // Points are not collinear within epsilon
                }
            }

            return true; // Points are collinear within epsilon
        },

        align: function (points, line) {
            const p1 = line.p1 || line.points[0];
            const p2 = line.p2 || line.points[1];
            const tx = p1.x,
                ty = p1.y,
                a = -atan2(p2.y - ty, p2.x - tx),
                d = function (v) {
                    return {
                        x: (v.x - tx) * cos(a) - (v.y - ty) * sin(a),
                        y: (v.x - tx) * sin(a) + (v.y - ty) * cos(a),
                    };
                };
            return points.map(d);
        },

        allSameSideOfZero: function (arr) {
            if (arr.length === 0) {
                // If the array is empty, you can consider it as all on the same side of zero.
                return true;
            }

            const referenceSign = Math.sign(arr[0]);

            for (let i = 1; i < arr.length; i++) {
                if (!arr[i] || Math.sign(arr[i]) !== referenceSign) {
                    return false;
                }
            }

            return true;
        },

        roots: function (points, line) {
            line = line || {p1: {x: 0, y: 0}, p2: {x: 1, y: 0}};
            let order = points.length - 1;

            if (utils.arePointsCollinear(points) &&
                utils.arePointsBetween(points[0], points[points.length - 1], points.slice(1, -1))) {
                order = 1;
                points = [points[0], points[points.length - 1]];
            }

            const p_aligned = utils.align(points, line);

            if (utils.allSameSideOfZero(p_aligned.map((p)=>p.y))){
                return [];
            }
            const reduce = function (t) {
                return 0 <= t && t <= 1;
            };

            if (order === 1) {
                const p1 = line.p1 || line.points[0];
                const p2 = line.p2 || line.points[1];
                const l_line = utils.dist(p1, p2);
                const l_curve = utils.dist(points[0], points[1]);

                if (p_aligned[0].y * p_aligned[1].y <= 0) {

                    if (p_aligned[1].x === p_aligned[0].x) {
                        return (p_aligned[0].x >= 0 && p_aligned[0].x < l_line) ? [
                            abs(
                                p_aligned[0].y) / l_curve] : [];
                    } else {
                        let a = (p_aligned[1].y - p_aligned[0].y) /
                            (p_aligned[1].x - p_aligned[0].x);
                        let b = p_aligned[0].y - a * p_aligned[0].x;
                        let root = -b / a;
                        if (root < l_line) {
                            const d_root = utils.dist(p_aligned[0], {x: root, y: 0});
                            return [d_root / l_curve];
                        } else {
                            return [];
                        }
                    }
                }
                return [];
            }

            const epsilon = 1e-10; // A small epsilon value for comparison
            // see http://www.trans4mind.com/personal_development/mathematics/polynomials/cubicAlgebra.htm
            if (order === 3) {
                let pa = p_aligned[0].y,
                    pb = p_aligned[1].y,
                    pc = p_aligned[2].y,
                    pd = p_aligned[3].y,
                    d = (-pa + 3 * pb - 3 * pc + pd);

                //ChatGPT generated. TODO: does it work always
                if (Math.abs(d) < epsilon) {
                    // Handle the special case when 'd' is close to zero
                    // Treat it as a quadratic Bezier curve and compute the intersection points

                    order = 2;
                    //reverse of the equation pb = q0 + 2/3(q1 - q0)
                    p_aligned[1].y = (3 / 2) * (pb - pa / 3);
                    p_aligned[2].y = p_aligned[3].y;

                    //let order 2 to take over.

                } else {
                    let a = (3 * pa - 6 * pb + 3 * pc) / d,
                        b = (-3 * pa + 3 * pb) / d,
                        c = pa / d,

                        p = (3 * b - a * a) / 3,
                        p3 = p / 3,
                        q = (2 * a * a * a - 9 * a * b + 27 * c) / 27,
                        q2 = q / 2,
                        discriminant = q2 * q2 + p3 * p3 * p3,
                        u1, v1, x1, x2, x3;
                    if (discriminant < 0) {
                        var mp3 = -p / 3,
                            mp33 = mp3 * mp3 * mp3,
                            r = sqrt(mp33),
                            t = -q / (2 * r),
                            cosphi = t < -1 ? -1 : t > 1 ? 1 : t,
                            phi = acos(cosphi),
                            crtr = crt(r),
                            t1 = 2 * crtr;
                        x1 = t1 * cos(phi / 3) - a / 3;
                        x2 = t1 * cos((phi + tau) / 3) - a / 3;
                        x3 = t1 * cos((phi + 2 * tau) / 3) - a / 3;
                        return [x1, x2, x3].filter(reduce);
                    } else if (discriminant === 0) {
                        u1 = q2 < 0 ? crt(-q2) : -crt(q2);
                        x1 = 2 * u1 - a / 3;
                        x2 = -u1 - a / 3;
                        return [x1, x2].filter(reduce);
                    } else {
                        const sd = sqrt(discriminant);
                        u1 = crt(-q2 + sd);
                        v1 = crt(q2 + sd);
                        return [u1 - v1 - a / 3].filter(reduce);
                    }
                }
            }

            if (order === 2) {
                let a = p_aligned[0].y,
                    b = p_aligned[1].y,
                    c = p_aligned[2].y,
                    d = a - 2 * b + c;
                if (Math.abs(d) > epsilon) {
                    let m1 = -sqrt(b * b - a * c),
                        m2 = -a + b,
                        v1 = -(m1 + m2) / d,
                        v2 = -(-m1 + m2) / d;
                    return [v1, v2].filter(reduce);
                } else if (b !== c && Math.abs(d) <= epsilon) {
                    let v = (2 * b - c) / 2 * (b - c);
                    return [v].filter(reduce);
                }
                return [];
            }


        },

        droots: function (p) {
            // quadratic bezier_roots are easy
            if (p.length === 3) {
                var a = p[0],
                    b = p[1],
                    c = p[2],
                    d = a - 2 * b + c;
                if (d !== 0) {
                    const m1 = -sqrt(b * b - a * c),
                        m2 = -a + b,
                        v1 = -(m1 + m2) / d,
                        v2 = -(-m1 + m2) / d;
                    return [v1, v2];
                } else if (b !== c && d === 0) {
                    return [(2 * b - c) / (2 * (b - c))];
                }
                return [];
            }

            // linear bezier_roots are even easier
            if (p.length === 2) {
                var a = p[0], b = p[1];
                if (a !== b) {
                    return [a / (a - b)];
                }
                return [];
            }
        },

        inflections: function (points) {
            var p = utils.align(points, {p1: points[0], p2: points[3]}),
                a = p[2].x * p[1].y,
                b = p[3].x * p[1].y,
                c = p[1].x * p[2].y,
                d = p[3].x * p[2].y,
                v1 = 18 * (-3 * a + 2 * b + 3 * c - d),
                v2 = 18 * (3 * a - b - 3 * c),
                v3 = 18 * (c - a);

            if (utils.approximately(v1, 0)) return [];

            var trm = v2 * v2 - 4 * v1 * v3,
                sq = Math.sqrt(trm),
                d = 2 * v1;

            if (utils.approximately(d, 0)) return [];

            return [(sq - v2) / d, -(v2 + sq) / d].filter(function (r) {
                return (0 <= r && r <= 1);
            });
        },

        bboxoverlap: function (b1, b2) {
            const dims = ['x', 'y'], len = dims.length;
            let i, dim, l, t, d;
            for (i = 0; i < len; ++i) {
                dim = dims[i];
                l = b1[dim].mid;
                t = b2[dim].mid;
                d = (b1[dim].size + b2[dim].size) / 2;
                if (abs(l - t) >= d) return false;
            }
            return true;
        },

        expandbox: function (bbox, _bbox) {
            if (_bbox.x.min < bbox.x.min) {
                bbox.x.min = _bbox.x.min;
            }
            if (_bbox.y.min < bbox.y.min) {
                bbox.y.min = _bbox.y.min;
            }
            if (_bbox.z && _bbox.z.min < bbox.z.min) {
                bbox.z.min = _bbox.z.min;
            }
            if (_bbox.x.max > bbox.x.max) {
                bbox.x.max = _bbox.x.max;
            }
            if (_bbox.y.max > bbox.y.max) {
                bbox.y.max = _bbox.y.max;
            }
            if (_bbox.z && _bbox.z.max > bbox.z.max) {
                bbox.z.max = _bbox.z.max;
            }
            bbox.x.mid = (bbox.x.min + bbox.x.max) / 2;
            bbox.y.mid = (bbox.y.min + bbox.y.max) / 2;
            if (bbox.z) {
                bbox.z.mid = (bbox.z.min + bbox.z.max) / 2;
            }
            bbox.x.size = bbox.x.max - bbox.x.min;
            bbox.y.size = bbox.y.max - bbox.y.min;
            if (bbox.z) {
                bbox.z.size = bbox.z.max - bbox.z.min;
            }
        },

        pairiteration: function (c1, c2) {
            const c1b = c1.bbox(),
                c2b = c2.bbox(),
                r = 100000,
                threshold = 0.5;
            if (c1b.x.size + c1b.y.size < threshold && c2b.x.size + c2b.y.size <
                threshold) {
                return [
                    ((r * (c1._t1 + c1._t2) / 2) | 0) / r + '/' +
                    ((r * (c2._t1 + c2._t2) / 2) | 0) / r];
            }
            const cc1 = c1.split(0.5),
                cc2 = c2.split(0.5);
            let pairs = [
                {left: cc1.left, right: cc2.left},
                {left: cc1.left, right: cc2.right},
                {left: cc1.right, right: cc2.right},
                {left: cc1.right, right: cc2.left}];
            pairs = pairs.filter(function (pair) {
                return utils.bboxoverlap(pair.left.bbox(), pair.right.bbox());
            });
            let results = [];
            if (pairs.length === 0) return results;
            pairs.forEach(function (pair) {
                results = results.concat(
                    utils.pairiteration(pair.left, pair.right),
                );
            });
            results = results.filter(function (v, i) {
                return results.indexOf(v) === i;
            });
            return results;
        },

        getccenter: function (p1, p2, p3) {
            const dx1 = (p2.x - p1.x),
                dy1 = (p2.y - p1.y),
                dx2 = (p3.x - p2.x),
                dy2 = (p3.y - p2.y);
            const dx1p = dx1 * cos(quart) - dy1 * sin(quart),
                dy1p = dx1 * sin(quart) + dy1 * cos(quart),
                dx2p = dx2 * cos(quart) - dy2 * sin(quart),
                dy2p = dx2 * sin(quart) + dy2 * cos(quart);
            // chord midpoints
            const mx1 = (p1.x + p2.x) / 2,
                my1 = (p1.y + p2.y) / 2,
                mx2 = (p2.x + p3.x) / 2,
                my2 = (p2.y + p3.y) / 2;
            // midpoint offsets
            const mx1n = mx1 + dx1p,
                my1n = my1 + dy1p,
                mx2n = mx2 + dx2p,
                my2n = my2 + dy2p;
            // intersection of these lines:
            const arc = utils.lli8(mx1, my1, mx1n, my1n, mx2, my2, mx2n, my2n),
                r = utils.dist(arc, p1);
            let // arc start/end values, over mid point:
                s = atan2(p1.y - arc.y, p1.x - arc.x);
            const m = atan2(p2.y - arc.y, p2.x - arc.x);
            let e = atan2(p3.y - arc.y, p3.x - arc.x),
                _;
            // determine arc direction (cw_third/ccw_third correction)
            if (s < e) {
                // if s<m<e, arc(s, e)
                // if m<s<e, arc(e, s + tau)
                // if s<e<m, arc(e, s + tau)
                if (s > m || m > e) {
                    s += tau;
                }
                if (s > e) {
                    _ = e;
                    e = s;
                    s = _;
                }
            } else {
                // if e<m<s, arc(e, s)
                // if m<e<s, arc(s, e + tau)
                // if e<s<m, arc(s, e + tau)
                if (e < m && m < s) {
                    _ = e;
                    e = s;
                    s = _;
                } else {
                    e += tau;
                }
            }
            // assign and done.
            arc.s = s;
            arc.e = e;
            arc.r = r;
            return arc;
        },
    };

    Snap.bUtils = utils;
    //Define bezier factory

    Snap.registerType('Bezier', Bezier);
    Snap.registerType('PolyBezier', PolyBezier);

    Snap.bezier = function () {
        return new (Bezier.bind.apply(Bezier,
            [undefined, ...Array.prototype.slice.call(arguments)]))();
    };

    for (let fun in Bezier) if (Bezier.hasOwnProperty(fun)) {
        Snap.bezier[fun] = Bezier[fun];
    }

    Snap.polyBezier = function () {
        return new (PolyBezier.bind.apply(PolyBezier,
            [undefined, ...Array.prototype.slice.call(arguments)]))();
    };

    for (let fun in PolyBezier) if (PolyBezier.hasOwnProperty(fun)) {
        Snap.PolyBezier[fun] = PolyBezier[fun];
    }

});
