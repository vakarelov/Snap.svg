Snap.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {

    const mathMax = Math.max;
    const mathMin = Math.min;
    const mathAbs = Math.abs;
    const TWO_PI = Math.PI * 2;

    function clamp01(t) {
        if (!isFinite(t)) {
            return 0;
        }
        return t < 0 ? 0 : (t > 1 ? 1 : t);
    }

    function isPlainObject(val) {
        return !!val && Object.prototype.toString.call(val) === "[object Object]";
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function lerpValue(from, to, t) {
        if (typeof from === "number" && typeof to === "number") {
            return lerp(from, to, t);
        }
        if (Array.isArray(from) && Array.isArray(to) && from.length === to.length) {
            const out = [];
            for (let i = 0; i < from.length; i++) {
                out[i] = lerpValue(from[i], to[i], t);
            }
            return out;
        }
        if (isPlainObject(from) && isPlainObject(to)) {
            const out = {};
            const keys = Object.keys(from);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (typeof from[key] === "number" && typeof to[key] === "number") {
                    out[key] = lerp(from[key], to[key], t);
                } else {
                    out[key] = t < 1 ? from[key] : to[key];
                }
            }
            return out;
        }
        return t < 1 ? from : to;
    }

    function isRangeArray(val) {
        return Array.isArray(val) && val.length === 2 &&
            typeof val[0] === "number" && typeof val[1] === "number";
    }

    function buildObjectRangeSpec(obj) {
        if (!isPlainObject(obj)) {
            return null;
        }
        const keys = Object.keys(obj);
        if (!keys.length) {
            return null;
        }
        const entries = [];
        let hasAnimated = false;
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = obj[key];
            if (isRangeArray(value)) {
                entries.push({key: key, type: "range", from: value[0], to: value[1]});
                hasAnimated = true;
            } else if (isPlainObject(value) && "from" in value && "to" in value) {
                entries.push({key: key, type: "range", from: value.from, to: value.to});
                hasAnimated = true;
            } else {
                entries.push({key: key, type: "fixed", value: value});
            }
        }
        return hasAnimated ? entries : null;
    }

    function resolveObjectRange(entries, eased) {
        const out = {};
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry.type === "range") {
                out[entry.key] = lerpValue(entry.from, entry.to, eased);
            } else {
                out[entry.key] = entry.value;
            }
        }
        return out;
    }

    function ensurePoint(pt, fallback) {
        const fp = fallback || {x: 0, y: 0};
        if (!pt) {
            return {x: fp.x, y: fp.y};
        }
        const x = +pt.x;
        const y = +pt.y;
        return {
            x: isFinite(x) ? x : fp.x,
            y: isFinite(y) ? y : fp.y,
        };
    }

    function ensurePointLike(value, fallback) {
        if (Array.isArray(value)) {
            if (value.length >= 2) {
                return ensurePoint({x: value[0], y: value[1]}, fallback);
            }
            return ensurePoint(null, fallback);
        }
        return ensurePoint(value, fallback);
    }

    function resolveAxisEndpoints2D(axisSpec) {
        if (!axisSpec) {
            return null;
        }
        if (Array.isArray(axisSpec)) {
            if (axisSpec.length === 2) {
                const first = ensurePointLike(axisSpec[0], null);
                const second = ensurePointLike(axisSpec[1], null);
                if (first && second) {
                    return [first, second];
                }
            }
            if (axisSpec.length === 4 && axisSpec.every(function (val) {
                return typeof val === "number" && isFinite(val);
            })) {
                return [
                    ensurePoint({x: axisSpec[0], y: axisSpec[1]}, null),
                    ensurePoint({x: axisSpec[2], y: axisSpec[3]}, null),
                ];
            }
        }
        if (isPlainObject(axisSpec)) {
            if (Array.isArray(axisSpec.points) && axisSpec.points.length >= 2) {
                const first = ensurePointLike(axisSpec.points[0], null);
                const second = ensurePointLike(axisSpec.points[1], null);
                if (first && second) {
                    return [first, second];
                }
            }
            const from = axisSpec.from || axisSpec.start || axisSpec.p0 || axisSpec.a;
            const to = axisSpec.to || axisSpec.end || axisSpec.p1 || axisSpec.b;
            if (from && to) {
                return [ensurePointLike(from, null), ensurePointLike(to, null)];
            }
        }
        return null;
    }

    function buildAxisFrame(axisSpec, options) {
        const opts = options || {};
        const defaultAxis = opts.defaultAxis === "x" ? "x" : "y";
        const fallbackOrigin = ensurePoint(opts.origin, {x: 0, y: 0});
        let origin = fallbackOrigin;
        let direction = defaultAxis === "x" ? {x: 1, y: 0} : {x: 0, y: 1};
        let axisLabel = typeof axisSpec === "string" ? axisSpec.toLowerCase() : defaultAxis;
        let axisLength = 0;
        const endpoints = resolveAxisEndpoints2D(axisSpec);
        if (endpoints && endpoints[0] && endpoints[1]) {
            origin = endpoints[0];
            const dx = endpoints[1].x - endpoints[0].x;
            const dy = endpoints[1].y - endpoints[0].y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len >= 1e-6) {
                direction = {x: dx / len, y: dy / len};
                axisLength = len;
                axisLabel = "custom";
            }
        } else if (axisSpec && typeof axisSpec === "object" && !Array.isArray(axisSpec)) {
            if (axisSpec.origin) {
                origin = ensurePoint(axisSpec.origin, origin);
            }
            if (axisSpec.direction) {
                const dir = ensurePoint(axisSpec.direction, null);
                const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
                if (len >= 1e-6) {
                    direction = {x: dir.x / len, y: dir.y / len};
                    axisLabel = axisLabel || "custom";
                }
            }
        } else if (typeof axisSpec === "string") {
            if (axisLabel !== "x" && axisLabel !== "y") {
                axisLabel = defaultAxis;
            }
            direction = axisLabel === "x" ? {x: 1, y: 0} : {x: 0, y: 1};
        } else {
            axisLabel = defaultAxis;
            direction = defaultAxis === "x" ? {x: 1, y: 0} : {x: 0, y: 1};
        }
        origin = ensurePoint(origin, fallbackOrigin);
        if (axisLabel !== "x" && axisLabel !== "y") {
            axisLabel = "custom";
        }
        let ortho;
        if (axisLabel === "x") {
            ortho = {x: 0, y: 1};
        } else if (axisLabel === "y") {
            ortho = {x: 1, y: 0};
        } else {
            const raw = Snap.normalize({x: -direction.y, y: direction.x}) || {x: -direction.y, y: direction.x};
            const mag = Math.sqrt(raw.x * raw.x + raw.y * raw.y) || 1;
            ortho = {x: raw.x / mag, y: raw.y / mag};
        }
        return {
            origin: origin,
            direction: direction,
            ortho: ortho,
            axisLabel: axisLabel,
            axisLength: axisLength,
            toLocal: function (pt) {
                const source = ensurePoint(pt, origin);
                const relX = source.x - origin.x;
                const relY = source.y - origin.y;
                return {
                    x: relX * ortho.x + relY * ortho.y,
                    y: relX * direction.x + relY * direction.y,
                };
            },
            fromLocal: function (localPt) {
                const loc = ensurePoint(localPt, {x: 0, y: 0});
                return {
                    x: origin.x + ortho.x * loc.x + direction.x * loc.y,
                    y: origin.y + ortho.y * loc.x + direction.y * loc.y,
                };
            },
        };
    }

    function ensurePoint3D(pt, fallback) {
        const fb = fallback || {x: 0, y: 0, z: 0};
        if (!pt) {
            return {x: fb.x || 0, y: fb.y || 0, z: fb.z || 0};
        }
        const x = +pt.x;
        const y = +pt.y;
        const z = pt.z == null ? fb.z : +pt.z;
        return {
            x: isFinite(x) ? x : (isFinite(fb.x) ? +fb.x : 0),
            y: isFinite(y) ? y : (isFinite(fb.y) ? +fb.y : 0),
            z: isFinite(z) ? z : (isFinite(fb.z) ? +fb.z : 0),
        };
    }

    const MATRIX_GEN = (Snap.Matrix && Snap.Matrix.gen) || null;
    const IDENTITY_4 = [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ];

    function cloneMatrix4(m) {
        return (m && m.length === 4) ? m.map(function (row) {
            return row.slice(0, 4);
        }) : identityMatrix4();
    }

    function identityMatrix4() {
        return cloneMatrix4(IDENTITY_4);
    }

    function multiplyMatrix4(A, B) {
        return MATRIX_GEN.multiply(A, B);
    }

    function normalizeMatrix4(value) {
        if (!value) {
            return identityMatrix4();
        }
        if (Array.isArray(value)) {
            if (value.length === 4 && Array.isArray(value[0])) {
                return value.slice(0, 4).map(function (row) {
                    const clone = row.slice(0, 4);
                    while (clone.length < 4) {
                        clone.push(0);
                    }
                    return clone;
                });
            }
            if (value.length === 16) {
                return [
                    value.slice(0, 4),
                    value.slice(4, 8),
                    value.slice(8, 12),
                    value.slice(12, 16),
                ];
            }
        }
        if (typeof value === "string") {
            const match = value.match(/matrix3d\s*\(([^)]+)\)/i);
            const source = match ? match[1] : value;
            const parts = source.split(/[\s,]+/).filter(Boolean).map(Number);
            if (parts.length === 16) {
                return [
                    parts.slice(0, 4),
                    parts.slice(4, 8),
                    parts.slice(8, 12),
                    parts.slice(12, 16),
                ];
            }
        }
        if (value && typeof value === "object") {
            const keys = ["m11", "m12", "m13", "m14", "m21", "m22", "m23", "m24", "m31", "m32", "m33", "m34", "m41", "m42", "m43", "m44"];
            const entries = keys.map(function (key) {
                const num = +value[key];
                return isFinite(num) ? num : null;
            });
            if (entries.every(function (entry) { return entry != null; })) {
                return [
                    entries.slice(0, 4),
                    entries.slice(4, 8),
                    entries.slice(8, 12),
                    entries.slice(12, 16),
                ];
            }
        }
        return identityMatrix4();
    }

    function translationMatrix4(tx, ty, tz) {
        const m = identityMatrix4();
        m[0][3] = +tx || 0;
        m[1][3] = +ty || 0;
        m[2][3] = +tz || 0;
        return m;
    }

    function scaleMatrix4(sx, sy, sz) {
        const m = identityMatrix4();
        m[0][0] = (sx == null ? 1 : +sx) || 0;
        m[1][1] = (sy == null ? m[0][0] : +sy) || 0;
        m[2][2] = (sz == null ? m[0][0] : +sz) || 0;
        return m;
    }

    function rotationMatrixX(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return [
            [1, 0, 0, 0],
            [0, c, -s, 0],
            [0, s, c, 0],
            [0, 0, 0, 1],
        ];
    }

    function rotationMatrixY(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return [
            [c, 0, s, 0],
            [0, 1, 0, 0],
            [-s, 0, c, 0],
            [0, 0, 0, 1],
        ];
    }

    function rotationMatrixZ(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return [
            [c, -s, 0, 0],
            [s, c, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ];
    }

    function normalizeVector3(vec, fallback) {
        const fb = fallback || {x: 0, y: 0, z: 1};
        const source = ensurePoint3D(vec, fb);
        const mag = Math.sqrt(source.x * source.x + source.y * source.y + source.z * source.z);
        if (!mag || !isFinite(mag)) {
            return normalizeVector3(fb, {x: 0, y: 0, z: 1});
        }
        return {
            x: source.x / mag,
            y: source.y / mag,
            z: source.z / mag,
        };
    }

    function rotationAxisMatrix(axis, angle) {
        const v = normalizeVector3(axis, {x: 0, y: 0, z: 1});
        const c = Math.cos(angle || 0);
        const s = Math.sin(angle || 0);
        const t = 1 - c;
        return [
            [t * v.x * v.x + c, t * v.x * v.y - s * v.z, t * v.x * v.z + s * v.y, 0],
            [t * v.y * v.x + s * v.z, t * v.y * v.y + c, t * v.y * v.z - s * v.x, 0],
            [t * v.z * v.x - s * v.y, t * v.z * v.y + s * v.x, t * v.z * v.z + c, 0],
            [0, 0, 0, 1],
        ];
    }

    function perspectiveMatrix(distance) {
        const d = Math.max(1e-6, isFinite(+distance) ? +distance : 1);
        return [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 1 / d, 1],
        ];
    }

    function vectorSubtract(a, b) {
        const pa = ensurePoint3D(a, {x: 0, y: 0, z: 0});
        const pb = ensurePoint3D(b, {x: 0, y: 0, z: 0});
        const diff = Snap.v_subtract(pa, pb);
        return {
            x: diff.x,
            y: diff.y,
            z: pa.z - pb.z,
        };
    }

    function vectorCross(a, b) {
        const pa = ensurePoint3D(a, {x: 0, y: 0, z: 0});
        const pb = ensurePoint3D(b, {x: 0, y: 0, z: 0});
        return {
            x: pa.y * pb.z - pa.z * pb.y,
            y: pa.z * pb.x - pa.x * pb.z,
            z: Snap.cross(pa, pb),
        };
    }

    function vectorDot(a, b) {
        const pa = ensurePoint3D(a, {x: 0, y: 0, z: 0});
        const pb = ensurePoint3D(b, {x: 0, y: 0, z: 0});
        const xy = Snap.dot(pa, pb);
        return xy + (pa.z * pb.z);
    }

    function lookAtMatrix(eye, target, up) {
        const eyePt = ensurePoint3D(eye, {x: 0, y: 0, z: 1});
        const targetPt = ensurePoint3D(target, {x: 0, y: 0, z: 0});
        const upVec = normalizeVector3(up || {x: 0, y: 1, z: 0}, {x: 0, y: 1, z: 0});
        const zAxis = normalizeVector3(vectorSubtract(eyePt, targetPt), {x: 0, y: 0, z: 1});
        const xAxis = normalizeVector3(vectorCross(upVec, zAxis), {x: 1, y: 0, z: 0});
        const yAxis = vectorCross(zAxis, xAxis);
        return [
            [xAxis.x, xAxis.y, xAxis.z, -vectorDot(xAxis, eyePt)],
            [yAxis.x, yAxis.y, yAxis.z, -vectorDot(yAxis, eyePt)],
            [zAxis.x, zAxis.y, zAxis.z, -vectorDot(zAxis, eyePt)],
            [0, 0, 0, 1],
        ];
    }

    function applyOriginToMatrix(matrix, origin) {
        if (!origin) {
            return cloneMatrix4(matrix);
        }
        const toOrigin = translationMatrix4(-origin.x, -origin.y, -origin.z);
        const back = translationMatrix4(origin.x, origin.y, origin.z);
        return multiplyMatrix4(back, multiplyMatrix4(matrix, toOrigin));
    }

    function transformPointWithMatrix(matrix, point, divideW) {
        const vec = [[point.x], [point.y], [point.z], [1]];
        const result = multiplyMatrix4(matrix, vec);
        const w = (result[3] && result[3][0]) || 1;
        const denom = (divideW === false || !isFinite(w) || Math.abs(w) < 1e-9) ? 1 : w;
        const inv = 1 / denom;
        return {
            x: (result[0] && result[0][0] != null ? result[0][0] : 0) * inv,
            y: (result[1] && result[1][0] != null ? result[1][0] : 0) * inv,
            z: (result[2] && result[2][0] != null ? result[2][0] : 0) * inv,
            w: w,
        };
    }

    function resolveAxisInput(axis) {
        if (typeof axis === "string") {
            const lower = axis.toLowerCase();
            if (lower === "x") {
                return {x: 1, y: 0, z: 0};
            }
            if (lower === "y") {
                return {x: 0, y: 1, z: 0};
            }
            if (lower === "z") {
                return {x: 0, y: 0, z: 1};
            }
        }
        if (Array.isArray(axis)) {
            return ensurePoint3D({x: axis[0], y: axis[1], z: axis[2]}, {x: 0, y: 0, z: 1});
        }
        return ensurePoint3D(axis, {x: 0, y: 0, z: 1});
    }

    function buildMatrixTransform(matrix, options) {
        const opts = options || {};
        const fallbackPoint = ensurePoint3D(opts.fallbackPoint, {x: 0, y: 0, z: 0});
        const divideW = opts.divideByW !== false;
        const projector = typeof opts.project === "function" ? opts.project : null;
        const targetMatrix = applyOriginToMatrix(normalizeMatrix4(matrix), opts.origin ? ensurePoint3D(opts.origin, fallbackPoint) : null);
        return function matrixTransform(pt) {
            const source = ensurePoint3D(pt, fallbackPoint);
            const mapped = transformPointWithMatrix(targetMatrix, source, divideW);
            if (projector) {
                const projected = projector(mapped, pt);
                if (projected) {
                    return projected;
                }
            }
            return mapped;
        };
    }

    function memoizeSamples(samples, axisKey) {
        if (!samples || !samples.length) {
            return null;
        }
        const sorted = samples.slice().sort(function (a, b) {
            return (a[axisKey] || 0) - (b[axisKey] || 0);
        });
        return {
            axis: axisKey,
            samples: sorted,
            minAxis: sorted[0][axisKey] || 0,
            maxAxis: sorted[sorted.length - 1][axisKey] || 0,
        };
    }

    function sampleAtAxis(cache, axisValue) {
        if (!cache) {
            return null;
        }
        const axis = cache.axis;
        const samples = cache.samples;
        const len = samples.length;
        if (!len) {
            return null;
        }
        if (axisValue <= cache.minAxis) {
            return samples[0];
        }
        if (axisValue >= cache.maxAxis) {
            return samples[len - 1];
        }
        let low = 0;
        let high = len - 1;
        while (low <= high) {
            const mid = (low + high) >> 1;
            const value = samples[mid][axis];
            if (value < axisValue) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        const i2 = mathMin(low, len - 1);
        const i1 = mathMax(i2 - 1, 0);
        const s1 = samples[i1];
        const s2 = samples[i2];
        const span = (s2[axis] || 0) - (s1[axis] || 0) || 1;
        const ratio = (axisValue - (s1[axis] || 0)) / span;
        return {
            x: lerp(s1.x || 0, s2.x || 0, ratio),
            y: lerp(s1.y || 0, s2.y || 0, ratio),
        };
    }

    const TRANSFORM_FLAG = "_ia_nlt_transform";
    const TRANSFORM_NAME = "_ia_nlt_name";

    function tagTransform(fn, name) {
        if (typeof fn !== "function" || typeof name !== "string" || !name) {
            return fn;
        }
        Object.defineProperty(fn, TRANSFORM_NAME, {
            value: name,
            configurable: true,
            enumerable: false,
            writable: true,
        });
        return fn;
    }

    /**
     * Utility collection of reusable non-linear R^2 -> R^2 transforms.
     * Each builder returns a point-mapping function compatible with genTransform.
     */
    class NonlinTransforms {
        constructor() {
            this._registry = Object.create(null);
            this._linearEase = (glob.mina && glob.mina.linear) || function (t) {
                return t;
            };
            this.identity = this._markTransform(function identityTransform(pt) {
                return {
                    x: pt && isFinite(pt.x) ? pt.x : 0,
                    y: pt && isFinite(pt.y) ? pt.y : 0,
                };
            });
            this.register("identity", function () {
                return this.identity;
            });
            this._autoRegisterPrototype();
            const defaults = glob && glob.SnapNonlinTransformsDefaults;
            if (defaults) {
                this.use(defaults);
            }
        }

        register(name, factory) {
            if (typeof name !== "string" || typeof factory !== "function") {
                return this;
            }
            this._registry[name] = factory;
            return this;
        }

        has(name) {
            return !!this._registry[name];
        }

        list() {
            return Object.keys(this._registry);
        }

        build(name) {
            const factory = this._registry[name];
            if (!factory) {
                return null;
            }
            const args = Array.prototype.slice.call(arguments, 1);
            return this._ensureTransform(factory.apply(this, args));
        }

        compose() {
            const self = this;
            const stack = [];
            function pushEntry(entry) {
                if (entry == null) {
                    return;
                }
                const matrixTransform = self._wrapMatrixTransform(entry);
                const transform = matrixTransform || self._ensureTransform(entry);
                transform && stack.push(transform);
            }
            for (let i = 0; i < arguments.length; i++) {
                const entry = arguments[i];
                if (Array.isArray(entry)) {
                    for (let j = 0; j < entry.length; j++) {
                        pushEntry(entry[j]);
                    }
                    continue;
                }
                pushEntry(entry);
            }
            if (!stack.length) {
                return this.identity;
            }
            if (stack.length === 1) {
                return stack[0];
            }
            return this._markTransform(function composedTransform(pt) {
                let current = pt;
                for (let i = stack.length - 1; i >= 0; i--) {
                    const fn = stack[i];
                    current = fn(current) || current;
                }
                return current || self.identity(pt);
            });
        }

        /**
         * Registers multiple presets at once. Accepts arrays, plain objects, or method names.
         * @param {Array|Object|string} presets
         */
        use(presets) {
            if (!presets) {
                return this;
            }
            if (Array.isArray(presets)) {
                for (let i = 0; i < presets.length; i++) {
                    this._registerPresetEntry(presets[i]);
                }
                return this;
            }
            if (typeof presets === "string") {
                this._registerPresetEntry({name: presets});
                return this;
            }
            if (isPlainObject(presets)) {
                const keys = Object.keys(presets);
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    this._registerPresetEntry({name: key, factory: presets[key]});
                }
            }
            return this;
        }

        /**
         * Creates a transform resolver whose parameters evolve with t in [0, 1].
         * @example
         * const tween = Snap.NonlinTransforms.parametrize('twistPinch', [
         *     {x: 200, y: 200},
         *     [20, 160],
         *     [0, 360],
         *     [0, 0.5],
         * ]);
         * element.animateGenTransform(tween, 1200, mina.easeinout);
         */
        parametrize(transformRef, paramDefs, easingDefs) {
            const trans_factory = this._resolveFactory(transformRef);
            if (!trans_factory) {
                return function () {
                    return null;
                };
            }
            const params = Array.isArray(paramDefs) ? paramDefs : [];
            const parsed = [];
            let variableCount = 0;
            for (let i = 0; i < params.length; i++) {
                const def = params[i];
                if (typeof def === "function") {
                    parsed.push({kind: "fn", fn: def});
                    continue;
                }
                if (Array.isArray(def) && def.length === 2) {
                    parsed.push({kind: "range", from: def[0], to: def[1]});
                    variableCount++;
                    continue;
                }
                if (isPlainObject(def) && "from" in def && "to" in def) {
                    parsed.push({kind: "range", from: def.from, to: def.to});
                    variableCount++;
                    continue;
                }
                if (isPlainObject(def)) {
                    const spec = buildObjectRangeSpec(def);
                    if (spec) {
                        parsed.push({kind: "object-range", spec: spec});
                        variableCount++;
                        continue;
                    }
                }
                parsed.push({kind: "fixed", value: def});
            }
            const easeList = this._normalizeEasing(easingDefs, variableCount);
            const self = this;
            return function (t) {
                const clamped = clamp01(t == null ? 0 : t);
                const args = new Array(parsed.length);
                let variableCursor = 0;
                for (let i = 0; i < parsed.length; i++) {
                    const item = parsed[i];
                    if (item.kind === "range") {
                        const ease = easeList[variableCursor] || easeList[easeList.length - 1];
                        const eased = ease ? clamp01(ease(clamped)) : clamped;
                        args[i] = lerpValue(item.from, item.to, eased);
                        variableCursor++;
                    } else if (item.kind === "object-range") {
                        const ease = easeList[variableCursor] || easeList[easeList.length - 1];
                        const eased = ease ? clamp01(ease(clamped)) : clamped;
                        args[i] = resolveObjectRange(item.spec, eased);
                        variableCursor++;
                    } else if (item.kind === "fn") {
                        args[i] = item.fn.call(self, clamped);
                    } else {
                        args[i] = item.value;
                    }
                }
                return self._ensureTransform(trans_factory.apply(self, args));
            };
        }

        /**
         * Builds a twist/pinch transform that rotates points around a center while
         * easing the rotation toward the given radius.
         * @param {{x:number,y:number}} center Anchor the twist effect.
         * @param {number} radius Distance over which the twist fully fades out.
         * @param {number} twist Degrees of rotation applied near the center.
         * @param {number} pinch 0..1 factor pulling the radius inward.
         * @returns {function({x:number,y:number}):{x:number,y:number}} Point mapper.
         * @example
         * const twistTween = Snap.NonlinTransforms.parametrize("twistPinch", [
         *     {x: 200, y: 200},
         *     180,
         *     [0, 360],
         *     0.35,
         * ]);
         * element.animateGenTransform(twistTween, 800, mina.easeinout);
         */
        twistPinch(center, radius, twist, pinch) {
            const c = ensurePoint(center, {x: 0, y: 0});
            const r = Math.max(1, +radius || 0);
            const t = isFinite(twist) ? +twist : 0;
            const p = isFinite(pinch) ? +pinch : 0;
            return this._markTransform(createTwistPinchTransform(c, r, t, p));
        }

        /**
         * Creates concentric ripples that modulate distance from a center point.
         * @param {{x:number,y:number}} center Ripple origin.
         * @param {number} amplitude Maximum radial displacement.
         * @param {number} wavelength Distance between ripple crests.
         * @param {number} decay Exponential falloff per unit distance.
         * @param {number} phase Additional phase offset in radians.
         * @returns {function({x:number,y:number}):{x:number,y:number}} Point mapper.
         * @example
         * const ripple = Snap.NonlinTransforms.radialRipple({x: 0, y: 0}, 30, 80, 0.01, 0);
         * paper.circle(0, 0, 200).attr({transform: ripple});
         */
        radialRipple(center, amplitude, wavelength, decay, phase) {
            const c = ensurePoint(center, {x: 0, y: 0});
            const amp = isFinite(amplitude) ? +amplitude : 0;
            const wave = mathMax(1e-6, isFinite(wavelength) ? +wavelength : 1);
            const decayFactor = mathMax(0, isFinite(decay) ? +decay : 0);
            const phaseShift = isFinite(phase) ? +phase : 0;
            return this._markTransform(function ripple(pt) {
                const dx = pt.x - c.x;
                const dy = pt.y - c.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (!dist) {
                    return {x: pt.x, y: pt.y};
                }
                const attenuation = decayFactor ? Math.exp(-decayFactor * dist) : 1;
                const offset = amp * attenuation * Math.sin((dist / wave) * TWO_PI + phaseShift);
                const scale = (dist + offset) / dist;
                return {
                    x: c.x + dx * scale,
                    y: c.y + dy * scale,
                };
            });
        }

        /**
         * Expands or contracts points inside a radius to simulate a bulge/pinch.
         * @param {{x:number,y:number}} center Bulge origin.
         * @param {number} radius Influence radius for the bulge.
         * @param {number} strength Positive = bulge outward, negative = pinch inward.
         * @returns {function({x:number,y:number}):{x:number,y:number}} Point mapper.
         * @example
         * const bulgeTween = Snap.NonlinTransforms.parametrize("bulge", [
         *     {x: 320, y: 140},
         *     120,
         *     [-0.3, 0.5],
         * ]);
         * element.animateGenTransform(bulgeTween, 600, mina.easeout);
         */
        bulge(center, radius, strength) {
            const c = ensurePoint(center, {x: 0, y: 0});
            const r = mathMax(1e-3, isFinite(radius) ? +radius : 0);
            const s = isFinite(strength) ? +strength : 0;
            return this._markTransform(function bulgeTransform(pt) {
                const dx = pt.x - c.x;
                const dy = pt.y - c.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (!dist) {
                    return {x: pt.x, y: pt.y};
                }
                const ratio = mathMin(1, dist / r);
                const influence = 1 - ratio * ratio;
                const delta = 1 + s * influence;
                return {
                    x: c.x + dx * delta,
                    y: c.y + dy * delta,
                };
            });
        }

        /**
         * Offsets points along one axis using a sinusoidal displacement.
         * @param {"x"|"y"|Array|Object} axis Axis descriptor (string or two points) whose coordinate drives the sine.
         * @param {number} amplitude Peak offset applied to the orthogonal axis.
         * @param {number} wavelength Distance for one full sine cycle.
         * @param {number} phase Phase shift in radians.
         * @param {number} decay Exponential attenuation along the driving axis.
         * @returns {function({x:number,y:number}):{x:number,y:number}} Point mapper.
         * @example
         * const waveTween = Snap.NonlinTransforms.parametrize("sineWave", [
         *     "x",
         *     25,
         *     120,
         *     [0, Math.PI * 2],
         *     0.002,
         * ]);
         * path.animateGenTransform(waveTween, 1000, mina.easeinout);
         */
        sineWave(axis, amplitude, wavelength, phase, decay) {
            const axisInput = axis == null ? "x" : axis;
            const defaultAxis = (typeof axisInput === "string" && axisInput === "y") ? "y" : "x";
            const axisFrame = buildAxisFrame(axisInput, {origin: {x: 0, y: 0}, defaultAxis: defaultAxis});
            const amp = isFinite(amplitude) ? +amplitude : 0;
            const wave = mathMax(1e-6, isFinite(wavelength) ? +wavelength : 1);
            const phaseShift = isFinite(phase) ? +phase : 0;
            const decayFactor = mathMax(0, isFinite(decay) ? +decay : 0);
            return this._markTransform(function sineTransform(pt) {
                const point = ensurePoint(pt, {x: 0, y: 0});
                const local = axisFrame.toLocal(point);
                const axisValue = local.y;
                const orthoValue = local.x;
                const attenuation = decayFactor ? Math.exp(-decayFactor * mathAbs(axisValue)) : 1;
                const offset = amp * attenuation * Math.sin((axisValue / wave) * TWO_PI + phaseShift);
                const nextLocal = {
                    x: orthoValue + offset,
                    y: axisValue,
                };
                return axisFrame.fromLocal(nextLocal);
            });
        }

        /**
         * Warps points using a cantilever beam deflection profile.
         * @param {{x:number,y:number}} origin Reference origin for normalization.
         * @param {number} length Normalized beam length.
         * @param {number} EI Flexural rigidity (E * I) controlling stiffness.
         * @param {number} thetaTip Tip rotation in radians.
         * @param {number} gain Multiplier applied to deflection magnitude.
         * @param {"x"|"y"|Array|Object} axis Axis descriptor (string or two points) along which the beam extends.
         * @param {number} falloff Exponential attenuation away from the beam plane.
         * @returns {function({x:number,y:number}):{x:number,y:number}} Point mapper.
         * @example
         * const bend = Snap.NonlinTransforms.cantilever({x: 0, y: 0}, 400, 80, 0.2, 1, "y", 0.001);
         * element.genTransform(bend(Snap.path.getPointAtLength(path, 0)));
         */
        cantilever(origin, length, EI, thetaTip, gain, axis, falloff) {
            const L = mathMax(1e-3, isFinite(length) ? +length : 1);
            const samples = cantileverSmallDeflection(L, mathMax(1e-3, +EI || 1), 64, +thetaTip || 0);
            const axisInput = axis == null ? "y" : axis;
            const horizontalSamples = typeof axisInput === "string" && axisInput === "x";
            const axisKey = horizontalSamples ? "x" : "y";
            const oriented = horizontalSamples ? samples.map(function (pt) {
                return {x: pt.y, y: pt.x};
            }) : samples;
            return this._curveWarp(oriented, {
                origin: origin,
                axis: axisInput,
                axisKey: axisKey,
                deflectionKey: axisKey === "x" ? "y" : "x",
                gain: isFinite(gain) ? +gain : 1,
                falloff: mathMax(0, isFinite(falloff) ? +falloff : 0),
            });
        }

        /**
         * Follows a circular-arc spring profile to bend points along a rod.
         * @param {{x:number,y:number}} origin Reference origin for normalization.
         * @param {number} length Spring length used to generate the arc samples.
         * @param {number} angle Total bend angle in radians.
         * @param {number} gain Multiplier applied to the deflection samples.
         * @param {"x"|"y"|Array|Object} axis Axis descriptor (string or two points) along which the spring extends.
         * @param {number} falloff Exponential attenuation away from the spring plane.
         * @returns {function({x:number,y:number}):{x:number,y:number}} Point mapper.
         * @example
         * const springTween = Snap.NonlinTransforms.parametrize("springBend", [
         *     {x: 0, y: 0},
         *     300,
         *     [0, Math.PI / 3],
         *     1,
         *     "y",
         *     0.0005,
         * ]);
         * element.animateGenTransform(springTween, 1200, mina.easeinout);
         */
        springBend(origin, length, angle, gain, axis, falloff) {
            const L = mathMax(1e-3, isFinite(length) ? +length : 1);
            const points = bentSpring(L, 64, +angle || 0);
            const axisInput = axis == null ? "y" : axis;
            const horizontalSamples = typeof axisInput === "string" && axisInput === "x";
            const axisKey = horizontalSamples ? "x" : "y";
            const oriented = horizontalSamples ? points.map(function (pt) {
                return {x: pt.y, y: pt.x};
            }) : points;
            return this._curveWarp(oriented, {
                origin: origin,
                axis: axisInput,
                axisKey: axisKey,
                deflectionKey: axisKey === "x" ? "y" : "x",
                gain: isFinite(gain) ? +gain : 1,
                falloff: mathMax(0, isFinite(falloff) ? +falloff : 0),
            });
        }

        /**
         * Bends space around a cantilever segment defined by two endpoints.
         * Points are projected onto the rod, the rod is bent via small-deflection
         * beam theory, and offsets are reapplied using the local bent normal.
         *
         * @param {{x:number,y:number}} fixed Clamp point (origin) of the rod.
         * @param {{x:number,y:number}} tip Point describing the initial straight tip.
         * @param {number} thetaTip Tip rotation in degrees applied to the rod end.
         * @param {number} [falloff=0] Optional exponential attenuation away from the rod.
         * @returns {function({x:number,y:number}):{x:number,y:number}} Point mapper.
         * @example
         * const bendTween = Snap.NonlinTransforms.parametrize("bendCantilever", [
         *     {x: 80, y: 80},
         *     {x: 80, y: 320},
         *     [0, 120],
         *     0.35,
         * ]);
         * paper.path(pathString).animateGenTransform(bendTween, 900, mina.easeinout);
         */
        bendCantilever(fixed, tip, thetaTip, falloff=0) {
            thetaTip = Snap.rad(thetaTip)
            const clamp = ensurePoint(fixed, {x: 0, y: 0});
            const tipPoint = ensurePoint(tip, {x: clamp.x, y: clamp.y + 1});
            const axisVec = {
                x: tipPoint.x - clamp.x,
                y: tipPoint.y - clamp.y,
            };
            const length = Snap.len(clamp.x, clamp.y, tipPoint.x, tipPoint.y);
            if (!length || !isFinite(length)) {
                return this.identity;
            }
            const rotation = isFinite(thetaTip) ? +thetaTip : 0;
            const falloffFactor = mathMax(0, isFinite(falloff) ? +falloff : 0);
            const axisDir = Snap.normalize(axisVec);
            const axisNormal = Snap.normalize(Snap.orthogonal(axisDir, true));
            const localToWorld = function (vec) {
                return {
                    x: axisNormal.x * (vec && vec.x || 0) + axisDir.x * (vec && vec.y || 0),
                    y: axisNormal.y * (vec && vec.x || 0) + axisDir.y * (vec && vec.y || 0),
                };
            };
            const segments = 64;
            return this._markTransform(function bendCantileverTransform(pt) {
                const point = ensurePoint(pt, clamp);
                const rel = {
                    x: point.x - clamp.x,
                    y: point.y - clamp.y,
                };
                const progress = mathMin(length, mathMax(0, Snap.dot(rel, axisDir)));
                const projected = {
                    x: clamp.x + axisDir.x * progress,
                    y: clamp.y + axisDir.y * progress,
                };
                const distanceVec = {
                    x: point.x - projected.x,
                    y: point.y - projected.y,
                };
                const bendState = cantileverSmallBend(progress, rotation, length, segments);
                const centerWorld = {
                    x: clamp.x + axisDir.x * bendState.position.y + axisNormal.x * bendState.position.x,
                    y: clamp.y + axisDir.y * bendState.position.y + axisNormal.y * bendState.position.x,
                };
                const normalWorld = Snap.normalize(localToWorld({
                    x: Math.cos(bendState.angle),
                    y: -Math.sin(bendState.angle),
                }));
                const tangentWorld = Snap.normalize(localToWorld({
                    x: Math.sin(bendState.angle),
                    y: Math.cos(bendState.angle),
                }));
                const normalOffset = Snap.dot(distanceVec, axisNormal);
                const tangentOffset = Snap.dot(distanceVec, axisDir);
                const attenuation = falloffFactor ? Math.exp(-falloffFactor * mathAbs(normalOffset)) : 1;
                return {
                    x: centerWorld.x + normalWorld.x * normalOffset * attenuation + tangentWorld.x * tangentOffset,
                    y: centerWorld.y + normalWorld.y * normalOffset * attenuation + tangentWorld.y * tangentOffset,
                };
            });
        }

        /**
         * Builds a general 3D transform from an explicit 4x4 matrix description.
         *
         * The matrix may be provided as a CSS `matrix3d(...)` string, a flat array of
         * 16 numbers, a nested `[[row]]` array, or an object exposing `m11..m44`.
         * The returned mapper can be fed directly into `element.genTransform` or
         * composed with other non-linear transforms.
         *
         * @param {(Array<number>|number[][]|string|Object)} matrixValue Matrix descriptor compatible with CSS matrix3d formats.
         * @param {Object} [options]
         * @param {Point3D} [options.origin] Pivot applied before/after the matrix (translate->matrix->translate back).
         * @param {Point3D} [options.fallbackPoint={x:0,y:0,z:0}] Default coordinate used when an input point omits xyz.
         * @param {boolean} [options.divideByW=true] Skip the homogeneous divide when the matrix represents an affine-only stage.
         * @param {function({x:number,y:number,z:number,w:number},Point3D):Point3D} [options.project] Optional projector run after the multiply (e.g., drop `z`).
         * @returns {function(Point3D):Point3D} Point-mapping function suitable for `genTransform`.
         *
         * @example
         * const tilt = Snap.NonlinTransforms.matrix3d(
         *     "matrix3d(1,0,0,0, 0,0.9,-0.4,0, 0,0.4,0.9,0, 0,0,0,1)",
         *     {origin: {x: 200, y: 150, z: 0}}
         * );
         * paper.path(pathString).genTransform(tilt);
         */
        matrix3d(matrixValue, options) {
            const transform = buildMatrixTransform(matrixValue || identityMatrix4(), options);
            return this._markTransform(transform);
        }

        /**
         * Creates a standard 3D translation matrix.
         *
         * @param {number} [tx=0] Offset along the X axis.
         * @param {number} [ty=0] Offset along the Y axis.
         * @param {number} [tz=0] Offset along the Z axis (positive moves the viewer).
         * @param {Object} [options] Same optional parameters accepted by {@link matrix3d} (origin, projector...).
         * @returns {function(Point3D):Point3D}
         *
         * @example
         * const pan = Snap.NonlinTransforms.translate3d(120, 40, 0);
         * meshPath.genTransform(pan);
         */
        translate3d(tx, ty, tz, options) {
            return this.matrix3d(translationMatrix4(tx, ty, tz), options);
        }

        /**
         * Scales points along each axis independently.
         *
         * @param {number} sx Scale applied to X coordinates.
         * @param {number} [sy=sx] Scale applied to Y coordinates (defaults to {@link sx}).
         * @param {number} [sz=sx] Scale applied to Z coordinates (defaults to {@link sx}).
         * @param {Object} [options] Forwarded to {@link matrix3d}; supply `origin` to scale about a pivot.
         * @returns {function(Point3D):Point3D}
         *
         * @example
         * const squashTween = Snap.NonlinTransforms.parametrize("scale3d", [
         *     [1, 1.2],
         *     [1, 0.8],
         *     1,
         *     {origin: {x: 160, y: 90, z: 0}},
         * ]);
         * element.animateGenTransform(squashTween, 600, mina.easeinout);
         */
        scale3d(sx, sy, sz, options) {
            return this.matrix3d(scaleMatrix4(sx, sy, sz), options);
        }

        /**
         * Rotates points around the X axis.
         *
         * @param {number} angle Rotation angle in degrees (positive rotates toward Y).
         * @param {Object} [options] Optional {@link matrix3d} settings (common use: `{origin: {x,y,z}}`).
         * @returns {function(Point3D):Point3D}
         *
         * @example
         * const flip = Snap.NonlinTransforms.rotateX(-35, {origin: {x: 240, y: 180, z: 0}});
         * path.genTransform(flip);
         */
        rotateX(angle, options) {
            return this.matrix3d(rotationMatrixX(Snap.rad(angle || 0)), options);
        }

        /**
         * Rotates points around the Y axis.
         *
         * @param {number} angle Rotation angle in degrees (positive rotates toward Z).
         * @param {Object} [options] Optional {@link matrix3d} settings.
         * @returns {function(Point3D):Point3D}
         *
         * @example
         * const swivelTween = Snap.NonlinTransforms.parametrize("rotateY", [
         *     [0, 25],
         * ]);
         * polyline.animateGenTransform(swivelTween, 500, mina.easeout);
         */
        rotateY(angle, options) {
            return this.matrix3d(rotationMatrixY(Snap.rad(angle || 0)), options);
        }

        /**
         * Rotates points around the Z axis (behaves like a classic 2D rotation).
         *
         * @param {number} angle Rotation angle in degrees.
         * @param {Object} [options] Optional {@link matrix3d} settings.
         * @returns {function(Point3D):Point3D}
         *
         * @example
         * const spin = Snap.NonlinTransforms.rotateZ(90);
         * group.genTransform(spin);
         */
        rotateZ(angle, options) {
            return this.matrix3d(rotationMatrixZ(Snap.rad(angle || 0)), options);
        }

        /**
         * Rotates around an arbitrary axis in 3D space.
         *
         * Two call styles are supported:
         * - `rotate3d([x, y, z], angle, options)` where the first argument describes the axis.
         * - `rotate3d(x, y, z, angle, options)` numeric signature, similar to CSS `rotate3d`.
         * Axis descriptors may also be strings (`"x"`, `"y"`, `"z"`) or `{x,y,z}` objects.
         *
         * @param {(number|Array|Object|string)} ax Axis descriptor or X component.
         * @param {(number|Object)} ay Rotation angle (degrees) when {@link ax} is descriptive, otherwise the Y component.
         * @param {(number|Object)} [az] Z component for numeric usage or `options` when {@link ax} is descriptive.
         * @param {number} [angle] Rotation angle in degrees when numeric signature is used.
         * @param {Object} [options] Optional projector/origin settings.
         * @returns {function(Point3D):Point3D}
         *
         * @example
         * // Rotate up to 30 degrees around the vector (0, 1, 1)
         * const twistTween = Snap.NonlinTransforms.parametrize("rotate3d", [
         *     [0, 1, 1],
         *     [0, 30],
         *     {origin: {x: 150, y: 120, z: 0}},
         * ]);
         * path.animateGenTransform(twistTween, 800, mina.easeinout);
         */
        rotate3d(ax, ay, az, angle, options) {
            let axisVector;
            let theta;
            let opts;
            if (Array.isArray(ax) || isPlainObject(ax) || typeof ax === "string") {
                axisVector = resolveAxisInput(ax);
                theta = ay;
                opts = az;
            } else {
                axisVector = ensurePoint3D({x: ax, y: ay, z: az}, {x: 0, y: 0, z: 1});
                theta = angle;
                opts = options;
            }
            const radians = Snap.rad(theta || 0);
            return this.matrix3d(rotationAxisMatrix(axisVector, radians), opts);
        }

        /**
         * Applies a perspective divide that simulates a camera positioned on the Z axis.
         *
         * @param {number} distance Distance from the viewer to the projection plane (must be > 0).
         * @param {Object} [options] Optional projector/origin overrides; commonly supply `project` to drop the resulting `z`.
         * @returns {function(Point3D):Point3D}
         *
         * @example
         * const persp = Snap.NonlinTransforms.perspective(800, {
         *     project: (pt) => ({x: pt.x, y: pt.y})
         * });
         * path.genTransform(Snap.NonlinTransforms.compose(persp, some3dTransform));
         */
        perspective(distance, options) {
            return this.matrix3d(perspectiveMatrix(distance), options);
        }

        /**
         * Builds a classic "look-at" matrix using eye, target, and up vectors.
         *
         * @param {Point3D} eye Camera position in world space.
         * @param {Point3D} target Point the camera is focused on.
         * @param {Point3D} [up={x:0,y:1,z:0}] Up vector (defaults to +Y).
         * @param {Object} [options] Optional projector/origin overrides, forwarded to {@link matrix3d}.
         * @returns {function(Point3D):Point3D}
         *
         * @example
         * const view = Snap.NonlinTransforms.lookAt(
         *     {x: 0, y: 0, z: 600},
         *     {x: 0, y: 0, z: 0},
         *     {x: 0, y: 1, z: 0}
         * );
         * surface.genTransform(view);
         */
        lookAt(eye, target, up, options) {
            return this.matrix3d(lookAtMatrix(eye, target, up), options);
        }

        _curveWarp(samples, options) {
            const axisKey = (options && options.axisKey) === "x" ? "x" : "y";
            const deflectionKey = (options && options.deflectionKey) || (axisKey === "x" ? "y" : "x");
            const cache = memoizeSamples(samples, axisKey);
            if (!cache) {
                return this.identity;
            }
            const origin = ensurePoint(options && options.origin, {x: 0, y: 0});
            const axisInput = options && options.axis != null ? options.axis : axisKey;
            const axisFrame = buildAxisFrame(axisInput, {origin: origin, defaultAxis: axisKey});
            const gain = isFinite(options && options.gain) ? +options.gain : 1;
            const falloff = mathMax(0, isFinite(options && options.falloff) ? +options.falloff : 0);
            const minAxis = cache.minAxis;
            const maxAxis = cache.maxAxis;
            const span = (maxAxis - minAxis) || 1;
            return this._markTransform(function curveWarp(pt) {
                const point = ensurePoint(pt, origin);
                const local = axisFrame.toLocal(point);
                const axisCoord = local.y;
                const normalized = clamp01(axisCoord / span);
                const sampleAxis = minAxis + normalized * span;
                const sample = sampleAtAxis(cache, sampleAxis) || {x: 0, y: 0};
                const deflection = (sample[deflectionKey] || 0) * gain;
                const attenuation = falloff ? Math.exp(-falloff * mathAbs(local.x)) : 1;
                const nextLocal = {
                    x: local.x + deflection * attenuation,
                    y: axisCoord,
                };
                return axisFrame.fromLocal(nextLocal);
            });
        }

        _resolveFactory(ref) {
            if (typeof ref === "string") {
                return this._registry[ref] || null;
            }
            if (typeof ref === "function") {
                if (ref._ia_nlt_transform) {
                    return function () {
                        return ref;
                    };
                }
                return ref;
            }
            return null;
        }

        _normalizeEasing(easingDefs, count) {
            const list = [];
            if (Array.isArray(easingDefs)) {
                for (let i = 0; i < count; i++) {
                    list[i] = typeof easingDefs[i] === "function" ? easingDefs[i] : this._linearEase;
                }
                return list.length ? list : [this._linearEase];
            }
            const ease = typeof easingDefs === "function" ? easingDefs : this._linearEase;
            for (let i = 0; i < count; i++) {
                list[i] = ease;
            }
            return list.length ? list : [this._linearEase];
        }

        _ensureTransform(fn) {
            if (typeof fn !== "function") {
                return null;
            }
            return this._markTransform(fn);
        }

        _wrapMatrixTransform(entry) {
            if (!Snap.is(entry, "matrix") || typeof entry.apply !== "function") {
                return null;
            }
            const matrix = entry;
            return this._markTransform(function matrixTransform(pt) {
                const point = ensurePoint(pt, {x: 0, y: 0});
                const applied = matrix.apply({x: point.x, y: point.y});
                if (Array.isArray(applied)) {
                    return ensurePoint({x: applied[0], y: applied[1]}, point);
                }
                return ensurePoint(applied, point);
            });
        }

        _markTransform(fn) {
            if (typeof fn !== "function") {
                return null;
            }
            if (!fn[TRANSFORM_FLAG]) {
                Object.defineProperty(fn, TRANSFORM_FLAG, {
                    value: true,
                    configurable: false,
                    enumerable: false,
                    writable: false,
                });
            }
            return fn;
        }

        _registerPresetEntry(entry) {
            if (!entry) {
                return;
            }
            let name;
            let resolver = null;
            if (typeof entry === "string") {
                name = entry;
            } else if (Array.isArray(entry)) {
                name = entry[0];
                resolver = entry[1];
            } else if (isPlainObject(entry)) {
                name = entry.name || entry.id || entry.key;
                resolver = entry.factory || entry.fn;
                if (!resolver && typeof entry.method === "string") {
                    const methodName = entry.method;
                    if (typeof this[methodName] === "function") {
                        resolver = function () {
                            return this[methodName].apply(this, arguments);
                        };
                    }
                }
            }
            if (!resolver && typeof name === "string" && typeof this[name] === "function") {
                resolver = function () {
                    return this[name].apply(this, arguments);
                };
            }
            if (typeof name !== "string" || !resolver) {
                return;
            }
            this.register(name, resolver);
        }

        _autoRegisterPrototype() {
            const proto = NonlinTransforms.prototype;
            const props = Object.getOwnPropertyNames(proto);
            for (let i = 0; i < props.length; i++) {
                const key = props[i];
                if (key === "constructor") {
                    continue;
                }
                const method = proto[key];
                if (typeof method !== "function") {
                    continue;
                }
                const taggedName = method[TRANSFORM_NAME];
                if (!taggedName) {
                    continue;
                }
                this.register(taggedName, function () {
                    return method.apply(this, arguments);
                });
            }
        }

    }

    NonlinTransforms.prototype.cantileverSmallBend = cantileverSmallBend

    Object.defineProperty(NonlinTransforms, "annotate", {
        value: function (fn, name) {
            return tagTransform(fn, name);
        },
        enumerable: false,
        configurable: false,
        writable: false,
    });

    tagTransform(NonlinTransforms.prototype.twistPinch, "twistPinch");
    tagTransform(NonlinTransforms.prototype.radialRipple, "radialRipple");
    tagTransform(NonlinTransforms.prototype.bulge, "bulge");
    tagTransform(NonlinTransforms.prototype.sineWave, "sineWave");
    tagTransform(NonlinTransforms.prototype.cantilever, "cantilever");
    tagTransform(NonlinTransforms.prototype.springBend, "springBend");
    tagTransform(NonlinTransforms.prototype.bendCantilever, "bendCantilever");
    tagTransform(NonlinTransforms.prototype.matrix3d, "matrix3d");
    tagTransform(NonlinTransforms.prototype.translate3d, "translate3d");
    tagTransform(NonlinTransforms.prototype.scale3d, "scale3d");
    tagTransform(NonlinTransforms.prototype.rotateX, "rotateX");
    tagTransform(NonlinTransforms.prototype.rotateY, "rotateY");
    tagTransform(NonlinTransforms.prototype.rotateZ, "rotateZ");
    tagTransform(NonlinTransforms.prototype.rotate3d, "rotate3d");
    tagTransform(NonlinTransforms.prototype.perspective, "perspective");
    tagTransform(NonlinTransforms.prototype.lookAt, "lookAt");

    Snap.NonlinTransforms = new NonlinTransforms();


    /**
     * Small-deflection cantilever centerline under tip rotation (linear beam theory).
     * x is the original axial coordinate (0 at clamp, L at tip).
     * Returns points (X, Y) where X is lateral deflection, Y is axial position.
     *
     * @param {number} L - Beam length.
     * @param {number} EI - Flexural rigidity (E * I).
     * @param {number} numPoints - Number of samples along the beam.
     * @param {number} thetaTip - Tip rotation in radians (small angles).
     * @returns {Array<{x:number, y:number}>}
     */
    function cantileverSmallDeflection(L, EI, numPoints, thetaTip) {
        const P = (2 * EI * thetaTip) / (L * L); // equivalent tip load
        const pts = [];
        for (let i = 0; i <= numPoints; i++) {
            const x = (i / numPoints) * L; // axial coordinate along the beam
            const w = (P * x * x / (6 * EI)) * (3 * L - x); // lateral deflection
            pts.push({ x: w, y: x });
        }
        return pts;
    }

    /**
     * Computes the bent position and outward normal for a point along the cantilever.
     * Uses the small-angle deflection profile plus an inextensible arc assumption
     * to move the point in both axes instead of offsetting along one axis only.
     *
     * @param {number|{y:number}} point - Distance from the clamp along the original rod (0..L).
     * @param {number} thetaTip - Tip rotation in radians (small angles).
     * @param {number} L - Beam length.
     * @param {number} [segments=64] - Integration slices for the arc reconstruction.
     * @returns {{position:{x:number,y:number}, normal:{x:number,y:number}, angle:number}}
     */
    function cantileverSmallBend(point, thetaTip, L, segments) {
        const length = Math.max(1e-6, isFinite(L) ? Math.abs(L) : 0);
        const tipRotation = isFinite(thetaTip) ? thetaTip : 0;
        const clampDistance = clamp01(resolvePointDistance(point) / (length || 1)) * length;
        const slices = Math.max(1, segments && isFinite(segments) ? Math.floor(segments) : 64);

        if (!clampDistance) {
            return {
                position: {x: 0, y: 0},
                normal: {x: -1, y: 0},
                angle: 0,
            };
        }

        const slopeFactor = tipRotation / (length * length);
        const step = clampDistance / slices;
        let posX = 0;
        let posY = 0;
        let angle = 0;

        for (let i = 0; i < slices; i++) {
            const mid = step * (i + 0.5);
            const slope = slopeAt(mid, slopeFactor, length);
            angle = Math.atan(slope);
            posX += Math.sin(angle) * step;
            posY += Math.cos(angle) * step;
        }

        const normal = Snap.normalize({
            x: -Math.cos(angle),
            y: Math.sin(angle),
        });

        return {
            position: {x: posX, y: posY},
            normal: normal,
            angle: angle,
        };

        function resolvePointDistance(input) {
            if (typeof input === "number") {
                return Math.max(0, Math.min(length, input));
            }
            if (input && typeof input === "object" && isFinite(input.y)) {
                return Math.max(0, Math.min(length, +input.y));
            }
            return 0;
        }

        function slopeAt(x, factor, beamLength) {
            // dw/dx of the small-deflection solution for a cantilever with equivalent tip load.
            return factor * (2 * beamLength * x - x * x);
        }

    }


    /**
     * Compute bent spring positions as a circular arc.
     * @param {number} length - Total length of the spring (rod).
     * @param {number} numPoints - Number of discrete points.
     * @param {number} angle - Bend angle in radians (displacement of top point).
     * @returns {Array<{x:number, y:number}>} Array of point coordinates.
     */
    function bentSpring(length, numPoints, angle) {
        const points = [];

        // Handle straight rod case (angle = 0)
        if (Math.abs(angle) < 1e-8) {
            for (let i = 0; i <= numPoints; i++) {
                const t = (i / numPoints) * length;
                points.push({ x: 0, y: t });
            }
            return points;
        }

        // Radius of circular arc
        const R = length / angle;

        for (let i = 0; i <= numPoints; i++) {
            const phi = (i / numPoints) * angle;
            const x = R * Math.sin(phi);
            const y = R * (1 - Math.cos(phi));
            points.push({ x, y });
        }

        return points;
    }

    /**
     * Creates a non-linear transform that twists points around `center`
     * while gently pinching them toward the origin based on radius.
     *
     * @param {{x:number,y:number}} center - rotation anchor
     * @param {number} radius - distance after which the effect fades out
     * @param {number} twist - degrees of rotation applied at the center
     * @param {number} pinch - 0..1 pinch strength (0=no pinch, 1=full pinch)
     */
    function createTwistPinchTransform(center, radius, twist, pinch) {
        const cx = center.x;
        const cy = center.y;
        const maxR = Math.max(1e-6, radius);
        const pinchAmt = Math.max(0, Math.min(1, pinch));
        twist = Snap.rad(twist)

        return function (pt) {
            const dx = pt.x - cx;
            const dy = pt.y - cy;
            const r = Math.sqrt(dx * dx + dy * dy);
            const t = Math.min(r / maxR, 1);            // falloff 0→1 within radius
            const angle = Math.atan2(dy, dx);
            const twistedAngle = angle + twist * (1 - t * t); // more twist near center
            const pinchedRadius = r * (1 - pinchAmt * (1 - t)); // pull center inward

            return {
                x: cx + pinchedRadius * Math.cos(twistedAngle),
                y: cy + pinchedRadius * Math.sin(twistedAngle),
            };
        };
    }
});