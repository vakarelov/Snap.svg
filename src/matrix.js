// Copyright (c) 2013 Adobe Systems Incorporated. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    var objectToString = Object.prototype.toString,
        Str = String,
        math = Math,
        E = "";

    function Matrix(a, b, c, d, e, f) {
        if (b == null && objectToString.call(a) == "[object SVGMatrix]") {
            this.a = a.a;
            this.b = a.b;
            this.c = a.c;
            this.d = a.d;
            this.e = a.e;
            this.f = a.f;
            return;
        }
        if (b == null && typeof a === "string") {
            a = a.replace("matrix(", "").replace("(", "").replace(")", "");
            a = a.split(",");
            this.a = +a[0] || 0;
            this.b = +a[1] || 0;
            this.c = +a[2] || 0;
            this.d = +a[3] || 0;
            this.e = +a[4] || 0;
            this.f = +a[5] || 0;
            return;
        }
        if (a != null) {
            this.a = +a;
            this.b = +b;
            this.c = +c;
            this.d = +d;
            this.e = +e;
            this.f = +f;
        } else {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
        }
    }

    Snap.registerType("matrix", Matrix);

    (function (matrixproto) {
        /*\
         * Matrix.add
         [ method ]
         **
         * Adds, in the sense of multiplying to the right the given matrix to existing one. This is not matrix addition
         - a (number)
         - b (number)
         - c (number)
         - d (number)
         - e (number)
         - f (number)
         * or
         - matrix (object) @Matrix
        \*/
        matrixproto.add = function (a, b, c, d, e, f) {
            if (a && a instanceof Matrix) {
                return this.add(a.a, a.b, a.c, a.d, a.e, a.f);
            }
            var aNew = a * this.a + b * this.c,
                bNew = a * this.b + b * this.d;
            this.e += e * this.a + f * this.c;
            this.f += e * this.b + f * this.d;
            this.c = c * this.a + d * this.c;
            this.d = c * this.b + d * this.d;

            this.a = aNew;
            this.b = bNew;
            return this;
        };

        matrixproto.multRight = matrixproto.add;

        matrixproto.plus = function (a, b, c, d, e, f) {
            if (a && a instanceof Matrix) {
                return this.plus(a.a, a.b, a.c, a.d, a.e, a.f);
            }

            return this.clone().add(a, b, c, d, e, f);
        };
        matrixproto.scMult = function (c) {
            this.a *= c;
            this.b *= c;
            this.c *= c;
            this.d *= c;
            this.f *= c;
            this.e *= c;
            return this;
        };
        matrixproto.timesSc = function (c) {
            return this.clone().scMult(c);
        };
        /*\
         * Matrix.multLeft
         [ method ]
         **
         * Multiplies a passed affine transform to the left: M * this.
         - a (number)
         - b (number)
         - c (number)
         - d (number)
         - e (number)
         - f (number)
         * or
         - matrix (object) @Matrix
        \*/
        Matrix.prototype.multLeft = function (a, b, c, d, e, f) {
            if (Array.isArray(a)) {
                if (a[0] instanceof Matrix) {
                    for (let i = a.length - 1; i > -1; --i) {
                        this.multLeft(a[i])
                    }
                    return this;
                }
                if (typeof a[0] === "number") {
                    return this.multLeft(a[0] || 0, a[1] || 0,
                        a[2] || 0, a[3] || 0, a[4] || 0, a[5] || 0);
                }
                return this;
            }

            if (a && a instanceof Matrix) {
                return this.multLeft(a.a, a.b, a.c, a.d, a.e, a.f);
            }
            var aNew = a * this.a + c * this.b,
                cNew = a * this.c + c * this.d,
                eNew = a * this.e + c * this.f + e;
            this.b = b * this.a + d * this.b;
            this.d = b * this.c + d * this.d;
            this.f = b * this.e + d * this.f + f;

            this.a = aNew;
            this.c = cNew;
            this.e = eNew;
            return this;
        };
        /*\
         * Matrix.invert
         [ method ]
         **
         * Returns an inverted version of the matrix
         = (object) @Matrix
        \*/
        matrixproto.invert = function () {
            var me = this,
                x = me.a * me.d - me.b * me.c;
            return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
        };
        /*\
         * Matrix.clone
         [ method ]
         **
         * Returns a copy of the matrix
         = (object) @Matrix
        \*/
        matrixproto.clone = function () {
            return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
        };
        /*\
         * Matrix.translate
         [ method ]
         **
         * Translate the matrix
         - x (number) horizontal offset distance
         - y (number) vertical offset distance
        \*/
        matrixproto.translate = function (x, y) {
            this.e += x * this.a + y * this.c;
            this.f += x * this.b + y * this.d;
            return this;
        };
        /*\
         * Matrix.scale
         [ method ]
         **
         * Scales the matrix
         - x (number) amount to be scaled, with `1` resulting in no change
         - y (number) #optional amount to scale along the vertical axis. (Otherwise `x` applies to both axes.)
         - cx (number) #optional horizontal origin point from which to scale
         - cy (number) #optional vertical origin point from which to scale
         * Default cx, cy is the middle point of the element.
        \*/
        matrixproto.scale = function (x, y, cx, cy) {
            y == null && (y = x);
            (cx || cy) && this.translate(cx, cy);
            this.a *= x;
            this.b *= x;
            this.c *= y;
            this.d *= y;
            (cx || cy) && this.translate(-cx, -cy);
            return this;
        };
        /*\
         * Matrix.rotate
         [ method ]
         **
         * Rotates the matrix
         - a (number) angle of rotation, in degrees
         - x (number) horizontal origin point from which to rotate
         - y (number) vertical origin point from which to rotate
        \*/
        matrixproto.rotate = function (a, x, y) {
            a = Snap.rad(a);
            x = x || 0;
            y = y || 0;
            var cos = +math.cos(a).toFixed(9),
                sin = +math.sin(a).toFixed(9);
            this.add(cos, sin, -sin, cos, x, y);
            return this.add(1, 0, 0, 1, -x, -y);
        };
        /*\
         * Matrix.skewX
         [ method ]
         **
         * Skews the matrix along the x-axis
         - x (number) Angle to skew along the x-axis (in degrees).
        \*/
        matrixproto.skewX = function (x) {
            return this.skew(x, 0);
        };
        /*\
         * Matrix.skewY
         [ method ]
         **
         * Skews the matrix along the y-axis
         - y (number) Angle to skew along the y-axis (in degrees).
        \*/
        matrixproto.skewY = function (y) {
            return this.skew(0, y);
        };
        /*\
         * Matrix.skew
         [ method ]
         **
         * Skews the matrix
         - y (number) Angle to skew along the y-axis (in degrees).
         - x (number) Angle to skew along the x-axis (in degrees).
        \*/
        matrixproto.skew = function (x, y) {
            x = x || 0;
            y = y || 0;
            x = Snap.rad(x);
            y = Snap.rad(y);
            var c = math.tan(x).toFixed(9);
            var b = math.tan(y).toFixed(9);
            return this.add(1, b, c, 1, 0, 0);
        };
        /*\
         * Matrix.x
         [ method ]
         **
         * Returns x coordinate for given point after transformation described by the matrix. See also @Matrix.y
         - x (number)
         - y (number)
         = (number) x
        \*/
        matrixproto.x = function (x, y) {
            return x * this.a + y * this.c + this.e;
        };
        /*\
         * Matrix.y
         [ method ]
         **
         * Returns y coordinate for given point after transformation described by the matrix. See also @Matrix.x
         - x (number)
         - y (number)
         = (number) y
        \*/
        matrixproto.y = function (x, y) {
            return x * this.b + y * this.d + this.f;
        };

        matrixproto.randomTrans = function (cx, cy, positive, distance, diff_scale, skip_rotation, skip_scale) {
            distance = distance || 300;
            cx = cx || 0;
            cy = cy || 0;
            let angle = (skip_rotation) ? 0 : 360 * Math.random();
            let scalex = (Math.random() < .5) ? .5 + .5 * Math.random() : 1 + 3 * Math.random();
            let scaley = (diff_scale) ? (Math.random() < .5) ? .5 + .5 * Math.random() : 1 + 3 * Math.random() : scalex;

            if (skip_scale) {
                scalex = 1;
                scaley = 1;
            }

            let dx = (positive) ? distance * Math.random() : distance * (Math.random() - .5),
                dy = (positive) ? distance * Math.random() : distance * (Math.random() - .5);

            return this.translate(dx, dy).rotate(angle, cx + dx, cy + dy).scale(scalex, scaley, cx + dx, cy + dy);
        };

        matrixproto.get = function (i) {
            return +this[Str.fromCharCode(97 + i)].toFixed(9);
        };
        matrixproto.toString = function () {
            return "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")";
        };
        matrixproto.offset = function () {
            return [this.e.toFixed(9), this.f.toFixed(9)];
        };

        matrixproto.equals = function (m, error) {
            if (!m) return false;
            if (error == null) {
                return this.a === m.a && this.b === m.b && this.c === m.c && this.d === m.d && this.e === m.e && this.f === m.f;
            }
            return Math.abs(this.a - m.a) <= error &&
                Math.abs(this.b - m.b) <= error &&
                Math.abs(this.c - m.c) <= error &&
                Math.abs(this.d - m.d) <= error &&
                Math.abs(this.e - m.e) <= error &&
                Math.abs(this.f - m.f) <= error;
        }
        matrixproto.isIdentity = function () {
            return this.a === 1 && !this.b && !this.c && this.d === 1 &&
                !this.e && !this.f;
        };

        matrixproto.toArray = function () {
            return [this.a, this.b, this.c, this.d, this.e, this.f];
        };

        function norm(a) {
            return a[0] * a[0] + a[1] * a[1];
        }

        function normalize(a) {
            var mag = math.sqrt(norm(a));
            a[0] && (a[0] /= mag);
            a[1] && (a[1] /= mag);
        }

        /*\
         * Matrix.determinant
         [ method ]
         **
         * Finds determinant of the given matrix.
         = (number) determinant
        \*/
        matrixproto.determinant = function () {
            return this.a * this.d - this.b * this.c;
        };
        /*\
         * Matrix.split
         [ method ]
         **
         * Splits matrix into primitive transformations
         = (object) in format:
         o dx (number) translation by x
         o dy (number) translation by y
         o scalex (number) scale by x
         o scaley (number) scale by y
         o shear (number) shear
         o rotate (number) rotation in deg
         o isSimple (boolean) could it be represented via simple transformations
        \*/
        matrixproto.split = function (add_pre_translation) {
            var out = {};
            // translation
            out.dx = this.e;
            out.dy = this.f;

            //pre-translation
            if (add_pre_translation) {
                let m = this.clone();
                m.e -= this.e;
                m.f -= this.f;
                let inv = m.invert();

                m = this.clone();
                m.multLeft(inv);
                out.px = m.e;
                out.py = m.f;
            }


            // scale and shear
            var row = [[this.a, this.b], [this.c, this.d]];
            out.scalex = math.sqrt(norm(row[0]));
            normalize(row[0]);

            out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
            row[1] = [row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear];

            out.scaley = math.sqrt(norm(row[1]));
            normalize(row[1]);
            out.shear /= out.scaley;

            if (this.determinant() < 0) {
                out.scalex = -out.scalex;
            }

            // rotation
            var sin = row[0][1],
                cos = row[1][1];
            if (cos < 0) {
                out.rotate = Snap.deg(math.acos(cos));
                if (sin < 0) {
                    out.rotate = 360 - out.rotate;
                }
            } else {
                out.rotate = Snap.deg(math.asin(sin));
            }

            out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
            out.isSuperSimple = !+out.shear.toFixed(9) && out.scalex.toFixed(9) == out.scaley.toFixed(9) && !out.rotate;
            out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
            return out;
        };

        matrixproto.split2 = function getTransform() {
            let a = this.a,
                b = this.b,
                c = this.c,
                d = this.d,
                e = this.e,
                f = this.f;

            const dx = e;
            const dy = f;
            const r = Math.atan2(b, a);
            const scx = Math.sqrt(a * a + b * b);
            const scy = (a * d - b * c) / scx;

            return {dx: dx, dy: dy, r: Snap.deg(r), scalex: scx, scaley: scy};
        }

        /*\
         * Matrix.toTransformString
         [ method ]
         **
         * Returns transform string that represents given matrix
         = (string) transform string
        \*/
        matrixproto.toTransformString = function (shorter) {
            var s = shorter || this.split();
            if (!+s.shear.toFixed(9)) {
                s.scalex = +s.scalex.toFixed(9);
                s.scaley = +s.scaley.toFixed(9);
                s.rotate = +s.rotate.toFixed(9);
                return (s.dx || s.dy ? "t" + [+s.dx.toFixed(9), +s.dy.toFixed(9)] : E) +
                    (s.rotate ? "r" + [+s.rotate.toFixed(9), 0, 0] : E) +
                    (s.scalex != 1 || s.scaley != 1 ? "s" + [s.scalex, s.scaley, 0, 0] : E);
            } else {
                return "m" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)];
            }
        };

        matrixproto.isMatrix = function () {
            return true;
        }

        matrixproto.twoPointTransformMatrix = function (x1, y1, x1Prime, y1Prime, x2, y2, x2Prime, y2Prime) {
            // Calculate distances before and after transformation
            const distanceBefore = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const distanceAfter = Math.sqrt(Math.pow(x2Prime - x1Prime, 2) + Math.pow(y2Prime - y1Prime, 2));

            // Scale factor
            const s = distanceAfter / distanceBefore;

            // Calculate rotation angle theta
            const dotProduct = (x2Prime - x1Prime) * (x2 - x1) + (y2Prime - y1Prime) * (y2 - y1);
            const determinant = (x2Prime - x1Prime) * (y2 - y1) - (y2Prime - y1Prime) * (x2 - x1);
            const theta = Math.atan2(determinant, dotProduct);

            // Calculate components of the transformation matrix
            const a = s * Math.cos(theta);
            const b = s * Math.sin(theta);
            const c = -s * Math.sin(theta);
            const d = s * Math.cos(theta);

            // Calculate translation components
            const e = x1Prime - (a * x1 + c * y1);
            const f = y1Prime - (b * x1 + d * y1);

            // Return the transformation matrix
            return new Snap.Matrix(a, b, c, d, e, f);
        }

        function rightLeftFlipMatrix(m, base) {
            let inv = base.clone().invert();
            return base.clone().multRight(m).multRight(inv);
        }

        function rotScaleSplit(m) {
            m = m || this;
            const split = m.split();
            const tm = new Matrix().translate(split.dx, split.dy);
            const rm = new Matrix().rotate(split.rotate);
            const scm = new Matrix().scale(split.scalex, split.scaley);
            const shm = new Matrix().skew(split.shear);

            const rot_shear = rightLeftFlipMatrix(rm.multRight(shm), tm);
            const trans_scale = scm.multLeft(tm);

            return {
                0: trans_scale,
                1: rot_shear,
                trans_scale: trans_scale,
                rot_shear: rot_shear,
                scalex: split.scalex,
                scaley: split.scaley,
                rotate: split.rotate,
                shear: split.shear,
                dx: split.dx,
                dy: split.dy
            };
        }

        matrixproto.rotScaleSplit = rotScaleSplit;

    })(Matrix.prototype);
    /*\
     * Snap.Matrix
     [ method ]
     **
     * Matrix constructor, extend on your own risk.
     * To create matrices use @Snap.matrix.
    \*/
    Snap.Matrix = Matrix;
    /*\
     * Snap.matrix
     [ method ]
     **
     * Utility method
     **
     * Returns a matrix based on the given parameters
     - a (number)
     - b (number)
     - c (number)
     - d (number)
     - e (number)
     - f (number)
     * or
     - svgMatrix (SVGMatrix)
     = (object) @Matrix
    \*/
    Snap.matrix = function (a, b, c, d, e, f) {
        return new Matrix(a, b, c, d, e, f);
    };
});
