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
Snap.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    var objectToString = Object.prototype.toString,
        Str = String,
        E = "";

    /**
     * Represents a 2D affine transformation matrix with six coefficients.
     * Accepts individual numeric coefficients, an `SVGMatrix`-like object, a matrix string, or another `Matrix` instance.
     * When invoked without arguments, an identity matrix is produced.
     *
     * @class
     * @alias Snap.Matrix
     */
    class Matrix {
        /**
         * Creates a new Matrix instance.
         * @param {number|SVGMatrix|string|Matrix} [a=1] - Either an existing matrix representation or the `a` component.
         * @param {number} [b=0] - The `b` coefficient when numeric values are provided.
         * @param {number} [c=0] - The `c` coefficient when numeric values are provided.
         * @param {number} [d=1] - The `d` coefficient when numeric values are provided.
         * @param {number} [e=0] - The `e` translation component when numeric values are provided.
         * @param {number} [f=0] - The `f` translation component when numeric values are provided.
         */
        constructor(a, b, c, d, e, f) {
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

        /**
         * Multiplies the current matrix on the right by the supplied affine transform.
         * If another {@link Matrix} instance is provided, its coefficients will be applied directly.
         *
         * @param {number|Matrix} a - Either another matrix or the `a` coefficient of the multiplier.
         * @param {number} [b] - The `b` coefficient of the multiplier.
         * @param {number} [c] - The `c` coefficient of the multiplier.
         * @param {number} [d] - The `d` coefficient of the multiplier.
         * @param {number} [e] - The `e` translation component of the multiplier.
         * @param {number} [f] - The `f` translation component of the multiplier.
         * @returns {Matrix} The matrix instance for chaining.
         */
        add(a, b, c, d, e, f) {
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
        }

        /**
         * Alias for {@link add} - multiplies on the right.
         * @see add
         */
        multRight(a, b, c, d, e, f) {
            return this.add(a, b, c, d, e, f);
        }

        /**
         * Returns a clone of the current matrix multiplied on the right by the supplied transform.
         *
         * @param {number|Matrix} a - Either another matrix or the `a` coefficient of the multiplier.
         * @param {number} [b] - The `b` coefficient of the multiplier.
         * @param {number} [c] - The `c` coefficient of the multiplier.
         * @param {number} [d] - The `d` coefficient of the multiplier.
         * @param {number} [e] - The `e` translation component of the multiplier.
         * @param {number} [f] - The `f` translation component of the multiplier.
         * @returns {Matrix} A new matrix containing the multiplied result.
         */
        plus(a, b, c, d, e, f) {
            if (a && a instanceof Matrix) {
                return this.plus(a.a, a.b, a.c, a.d, a.e, a.f);
            }

            return this.clone().add(a, b, c, d, e, f);
        }

        /**
         * Multiplies all affine coefficients by a scalar.
         *
         * @param {number} c - Scalar value applied to each coefficient.
         * @returns {Matrix} The matrix instance for chaining.
         */
        scMult(c) {
            this.a *= c;
            this.b *= c;
            this.c *= c;
            this.d *= c;
            this.f *= c;
            this.e *= c;
            return this;
        }

        /**
         * Returns a clone of the matrix scaled by the supplied scalar.
         *
         * @param {number} c - Scalar value applied to each coefficient.
         * @returns {Matrix} A new matrix instance with scaled coefficients.
         */
        timesSc(c) {
            return this.clone().scMult(c);
        }

        /**
         * Multiplies the current matrix on the left by the supplied affine transform (pre-multiplication).
         * Accepts a single matrix, an array of matrices, or individual coefficients.
         *
         * @param {number|Matrix|Array<number|Matrix>} a - Matrix, array of matrices, or the `a` coefficient of the multiplier.
         * @param {number} [b] - The `b` coefficient when numeric values are provided.
         * @param {number} [c] - The `c` coefficient when numeric values are provided.
         * @param {number} [d] - The `d` coefficient when numeric values are provided.
         * @param {number} [e] - The `e` translation component when numeric values are provided.
         * @param {number} [f] - The `f` translation component when numeric values are provided.
         * @returns {Matrix} The matrix instance for chaining.
         */
        multLeft(a, b, c, d, e, f) {
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
        }

        /**
         * Computes the inverse of the affine matrix.
         *
         * @returns {Matrix} A new matrix representing the inverse transform.
         */
        invert() {
            var me = this,
                x = me.a * me.d - me.b * me.c;
            return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
        }

        /**
         * Creates an exact copy of the matrix.
         *
         * @returns {Matrix} A new matrix with identical coefficients.
         */
        clone() {
            return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
        }

        /**
         * Applies a translation to the matrix.
         *
         * @param {number} x - Horizontal translation distance.
         * @param {number} y - Vertical translation distance.
         * @returns {Matrix} The matrix instance for chaining.
         */
        translate(x, y) {
            this.e += x * this.a + y * this.c;
            this.f += x * this.b + y * this.d;
            return this;
        }

        /**
         * Applies a scale transformation to the matrix.
         *
         * @param {number} x - Horizontal scale factor; `1` leaves the axis unchanged.
         * @param {number} [y=x] - Vertical scale factor; defaults to {@link x} when omitted.
         * @param {number} [cx] - Optional horizontal origin around which to scale.
         * @param {number} [cy] - Optional vertical origin around which to scale.
         * @returns {Matrix} The matrix instance for chaining.
         */
        scale(x, y, cx, cy) {
            y == null && (y = x);
            (cx || cy) && this.translate(cx, cy);
            this.a *= x;
            this.b *= x;
            this.c *= y;
            this.d *= y;
            (cx || cy) && this.translate(-cx, -cy);
            return this;
        }

        /**
         * Applies a rotation to the matrix.
         *
         * @param {number} a - Rotation angle in degrees.
         * @param {number} [x=0] - Horizontal origin around which to rotate.
         * @param {number} [y=0] - Vertical origin around which to rotate.
         * @returns {Matrix} The matrix instance for chaining.
         */
        rotate(a, x, y) {
            a = Snap.rad(a);
            x = x || 0;
            y = y || 0;
            var cos = +Math.cos(a).toFixed(9),
                sin = +Math.sin(a).toFixed(9);
            this.add(cos, sin, -sin, cos, x, y);
            return this.add(1, 0, 0, 1, -x, -y);
        }

        /**
         * Skews the matrix along the x-axis.
         *
         * @param {number} x - Angle, in degrees, to skew along the x-axis.
         * @returns {Matrix} The matrix instance for chaining.
         */
        skewX(x) {
            return this.skew(x, 0);
        }

        /**
         * Skews the matrix along the y-axis.
         *
         * @param {number} y - Angle, in degrees, to skew along the y-axis.
         * @returns {Matrix} The matrix instance for chaining.
         */
        skewY(y) {
            return this.skew(0, y);
        }

        /**
         * Applies a simultaneous skew transform on both axes.
         *
         * @param {number} [x=0] - Angle, in degrees, to skew along the x-axis.
         * @param {number} [y=0] - Angle, in degrees, to skew along the y-axis.
         * @returns {Matrix} The matrix instance for chaining.
         */
        skew(x, y) {
            x = x || 0;
            y = y || 0;
            x = Snap.rad(x);
            y = Snap.rad(y);
            var c = Math.tan(x).toFixed(9);
            var b = Math.tan(y).toFixed(9);
            return this.add(1, b, c, 1, 0, 0);
        }

        /**
         * Transforms a point and returns its x-coordinate.
         *
         * @param {number} x - Original x-coordinate.
         * @param {number} y - Original y-coordinate.
         * @returns {number} The transformed x-coordinate.
         */
        x(x, y) {
            return x * this.a + y * this.c + this.e;
        }

        /**
         * Transforms a point and returns its y-coordinate.
         *
         * @param {number} x - Original x-coordinate.
         * @param {number} y - Original y-coordinate.
         * @returns {number} The transformed y-coordinate.
         */
        y(x, y) {
            return x * this.b + y * this.d + this.f;
        }

        /**
         * Applies a pseudo-random translation, rotation, and scaling around an optional origin.
         * Useful for generating varied transforms for effects or automated testing.
         *
         * @param {number} [cx=0] - Horizontal origin for rotation and scaling.
         * @param {number} [cy=0] - Vertical origin for rotation and scaling.
         * @param {boolean} [positive=false] - When `true`, restricts translations to positive offsets.
         * @param {number} [distance=300] - Maximum translation distance along each axis.
         * @param {boolean} [diff_scale=false] - When `true`, allows non-uniform (x/y) scaling.
         * @param {boolean} [skip_rotation=false] - When `true`, prevents random rotation.
         * @param {boolean} [skip_scale=false] - When `true`, prevents random scaling.
         * @returns {Matrix} The matrix instance for chaining.
         */
        randomTrans(cx, cy, positive, distance, diff_scale, skip_rotation, skip_scale) {
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
        }

        /**
         * Returns a coefficient of the matrix by index (`0 → a`, `5 → f`).
         *
         * @param {number} i - Index of the coefficient (0-5).
         * @returns {number} The coefficient rounded to nine decimal places.
         */
        get(i) {
            return +this[Str.fromCharCode(97 + i)].toFixed(9);
        }

        /**
         * Serialises the matrix into an SVG `matrix(a,b,c,d,e,f)` transform string.
         *
         * @returns {string} SVG transform string representing the matrix.
         */
        toString() {
            return "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")";
        }

        /**
         * Returns the translation components (`e`, `f`) rounded to nine decimal places.
         *
         * @returns {number[]} A two-item array `[e, f]`.
         */
        offset() {
            return [this.e.toFixed(9), this.f.toFixed(9)];
        }

        /**
         * Compares the matrix with another instance within an optional tolerance.
         *
         * @param {Matrix} m - Matrix to compare against.
         * @param {number} [error] - Optional absolute tolerance per coefficient.
         * @returns {boolean} `true` if all coefficients match within the tolerance.
         */
        equals(m, error) {
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

        /**
         * Checks whether the matrix equals the identity transform.
         *
         * @returns {boolean} `true` when all non-identity coefficients are zero.
         */
        isIdentity(error ) {
            if (!error) return this.a === 1 && !this.b && !this.c && this.d === 1 &&
                !this.e && !this.f;

            return Math.abs(this.a - 1) <= error &&
                Math.abs(this.b) <= error &&
                Math.abs(this.c) <= error &&
                Math.abs(this.d - 1) <= error &&
                Math.abs(this.e) <= error &&
                Math.abs(this.f) <= error;
        }

        /**
         * Returns the matrix coefficients as an array `[a, b, c, d, e, f]`.
         *
         * @returns {number[]} Array of the six coefficients.
         */
        toArray() {
            return [this.a, this.b, this.c, this.d, this.e, this.f];
        }

        to2dArray() {
            return [[this.a, this.c, this.e], [this.b, this.d, this.f], [0, 0, 1]];
        }

        /**
         * Computes the determinant of the affine matrix.
         *
         * @returns {number} Determinant value (`a * d - b * c`).
         */
        determinant() {
            return this.a * this.d - this.b * this.c;
        }

        /**
         * Decomposes the matrix into intuitive primitives (translation, rotation, scale, shear).
         * Optionally records any pre-translation that occurred before the core linear transform.
         *
         * @param {boolean} [add_pre_translation=false] - When `true`, include the pre-translation offset (`px`, `py`).
         * @returns {object} Parts describing the transform.
         * @returns {number} return.dx - Final translation along the x-axis.
         * @returns {number} return.dy - Final translation along the y-axis.
         * @returns {number} [return.px] - Optional pre-translation along the x-axis (only when `add_pre_translation` is `true`).
         * @returns {number} [return.py] - Optional pre-translation along the y-axis (only when `add_pre_translation` is `true`).
         * @returns {number} return.scalex - Scale factor applied along the x-axis. Negative when the matrix mirrors across an axis.
         * @returns {number} return.scaley - Scale factor applied along the y-axis.
         * @returns {number} return.shear - Shear factor that skews the y-axis relative to the x-axis.
         * @returns {number} return.rotate - Rotation in degrees, measured after the scale/shear decomposition.
         * @returns {boolean} return.isSimple - `true` when the matrix can be expressed as translate → rotate → uniform scale (or no rotation).
         * @returns {boolean} return.isSuperSimple - `true` when the matrix is only translate → uniform scale (no rotation or shear).
         * @returns {boolean} return.noRotation - `true` when the matrix has neither rotation nor shear.
         */
        split(add_pre_translation) {
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
            out.scalex = Math.sqrt(norm(row[0]));
            normalize(row[0]);

            out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
            row[1] = [row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear];

            out.scaley = Math.sqrt(norm(row[1]));
            normalize(row[1]);
            out.shear /= out.scaley;

            if (this.determinant() < 0) {
                out.scalex = -out.scalex;
            }

            // rotation
            var sin = row[0][1],
                cos = row[1][1];
            if (cos < 0) {
                out.rotate = Snap.deg(Math.acos(cos));
                if (sin < 0) {
                    out.rotate = 360 - out.rotate;
                }
            } else {
                out.rotate = Snap.deg(Math.asin(sin));
            }

            out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
            out.isSuperSimple = !+out.shear.toFixed(9) && out.scalex.toFixed(9) == out.scaley.toFixed(9) && !out.rotate;
            out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
            return out;
        }

        /**
         * Provides a lightweight decomposition returning translation, rotation, and scale components.
         *
         * @returns {{dx:number, dy:number, r:number, scalex:number, scaley:number}} Simplified transform description.
         */
        split2() {
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

        /**
         * Serialises the matrix into Snap's short transform string format.
         *
         * @param {object} [shorter] - Optional decomposition result to reuse.
         * @returns {string} A transform string compatible with Snap.svg syntax.
         */
        toTransformString(shorter) {
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
        }

        /**
         * Identifies the object as a matrix instance.
         *
         * @returns {boolean} Always returns `true` for matrix instances.
         */
        isMatrix() {
            return true;
        }

        /**
         * Computes an affine transform mapping two source points to two destination points.
         *
         * @param {number} x1 - X-coordinate of the first source point.
         * @param {number} y1 - Y-coordinate of the first source point.
         * @param {number} x1Prime - X-coordinate of the first destination point.
         * @param {number} y1Prime - Y-coordinate of the first destination point.
         * @param {number} x2 - X-coordinate of the second source point.
         * @param {number} y2 - Y-coordinate of the second source point.
         * @param {number} x2Prime - X-coordinate of the second destination point.
         * @param {number} y2Prime - Y-coordinate of the second destination point.
         * @returns {Matrix} A new matrix performing the inferred transform.
         */
        twoPointTransformMatrix(x1, y1, x1Prime, y1Prime, x2, y2, x2Prime, y2Prime) {
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

        /**
         * Splits a matrix into translation/scale and rotation/shear factors.
         *
         * @param {Matrix} [m=this] - Matrix to decompose.
         * @returns {{0:Matrix, 1:Matrix, trans_scale:Matrix, rot_shear:Matrix, scalex:number, scaley:number, rotate:number, shear:number, dx:number, dy:number}} Matrices and scalars describing the decomposition.
         */
        rotScaleSplit(m) {
            m = m || this;
            const split = m.split();
            const tm = new Matrix().translate(split.dx, split.dy);
            const rm = new Matrix().rotate(split.rotate);
            const scm = new Matrix().scale(split.scalex, split.scaley);
            const shm = new Matrix().skew(split.shear);

            /**
             * Conjugates an affine transform by a base matrix (`base * m * base^{-1}`).
             *
             * @param {Matrix} m - Matrix to conjugate.
             * @param {Matrix} base - Base matrix providing the reference frame.
             * @returns {Matrix} The conjugated matrix.
             * @private
             */
            function rightLeftFlipMatrix(m, base) {
                let inv = base.clone().invert();
                return base.clone().multRight(m).multRight(inv);
            }

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
    }

    // Helper functions for Matrix
    function norm(a) {
        return a[0] * a[0] + a[1] * a[1];
    }

    function normalize(a) {
        var mag = Math.sqrt(norm(a));
        a[0] && (a[0] /= mag);
        a[1] && (a[1] /= mag);
    }

    Snap.registerType("matrix", Matrix);

    /**
     * General matrix operations for 2D array-based matrices.
     * @namespace Matrix.gen
     */
    Matrix.gen = {
        /**
         * Adds two matrices element-wise.
         * @param {number[][]|Matrix} A - First matrix as 2D array.
         * @param {number[][]|Matrix} B - Second matrix as 2D array with same dimensions as A.
         * @returns {number[][]} Result matrix C where C[i][j] = A[i][j] + B[i][j].
         */
        add: function(A, B) {
            if (A instanceof Matrix) {
                A = A.to2dArray();
            }
            if (B instanceof Matrix) {
                B = B.to2dArray();
            }
            if (!A || !B || !A.length || !B.length) {
                throw new Error("Invalid matrix input");
            }
            if (A.length !== B.length || A[0].length !== B[0].length) {
                throw new Error("Matrix dimensions must match for addition");
            }
            
            const rows = A.length;
            const cols = A[0].length;
            const C = [];
            
            for (let i = 0; i < rows; i++) {
                C[i] = [];
                for (let j = 0; j < cols; j++) {
                    C[i][j] = A[i][j] + B[i][j];
                }
            }
            
            return C;
        },
        
        /**
         * Multiplies two matrices.
         * @param {number[][]|Matrix} A - First matrix with dimensions m×n.
         * @param {number[][]|Matrix} B - Second matrix with dimensions n×p.
         * @returns {number[][]} Result matrix C with dimensions m×p where C[i][j] = Σ(A[i][k] * B[k][j]).
         */
        multiply: function(A, B) {
             if (A instanceof Matrix) {
                A = A.to2dArray();
            }
            if (B instanceof Matrix) {
                B = B.to2dArray();
            }
            if (!A || !B || !A.length || !B.length) {
                throw new Error("Invalid matrix input");
            }
            if (A[0].length !== B.length) {
                throw new Error("Matrix dimensions incompatible for multiplication: A columns must equal B rows");
            }
            
            const m = A.length;      // rows in A
            const n = A[0].length;   // cols in A, rows in B
            const p = B[0].length;   // cols in B
            const C = [];
            
            for (let i = 0; i < m; i++) {
                C[i] = [];
                for (let j = 0; j < p; j++) {
                    C[i][j] = 0;
                    for (let k = 0; k < n; k++) {
                        C[i][j] += A[i][k] * B[k][j];
                    }
                }
            }
            
            return C;
        },
        
        /**
         * Multiplies a matrix by a scalar.
         * @param {number} c - Scalar value.
         * @param {number[][]|Matrix} A - Matrix as 2D array.
         * @returns {number[][]} Result matrix C where C[i][j] = c * A[i][j].
         */
        cMultiply: function(c, A) {
             if (A instanceof Matrix) {
                A = A.to2dArray();
            }
            if (!A || !A.length) {
                throw new Error("Invalid matrix input");
            }
            
            const rows = A.length;
            const cols = A[0].length;
            const C = [];
            
            for (let i = 0; i < rows; i++) {
                C[i] = [];
                for (let j = 0; j < cols; j++) {
                    C[i][j] = c * A[i][j];
                }
            }
            
            return C;
        }
    };

    /**
     * Exposes the {@link Matrix} constructor on the `Snap` namespace.
     *
    * @type {Function}
     */
    Snap.Matrix = Matrix;
    /**
     * Factory helper mirroring the {@link Matrix} constructor signature.
     *
     * @param {number|SVGMatrix|string|Matrix} [a] - Either an existing matrix representation or the `a` coefficient.
     * @param {number} [b] - The `b` coefficient when numeric values are provided.
     * @param {number} [c] - The `c` coefficient when numeric values are provided.
     * @param {number} [d] - The `d` coefficient when numeric values are provided.
     * @param {number} [e] - The `e` translation component when numeric values are provided.
     * @param {number} [f] - The `f` translation component when numeric values are provided.
     * @returns {Matrix} A new matrix instance.
     */
    Snap.matrix = function (a, b, c, d, e, f) {
        return new Matrix(a, b, c, d, e, f);
    };
});
