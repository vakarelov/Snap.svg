/*
 * Copyright (c) 2018.  Orlin Vakarelov
 */
Snap_ia.plugin(function (Snap, _future_me_, Paper, glob, Fragment, eve) {
        const hub = Snap._.hub;
        const ID = Snap._.id;
        const $ = Snap._.$;
        const has = 'hasOwnProperty';

        /**
         * Element constructor
         * Wraps an SVG element with Snap methods
         * 
         * @class Snap.Element
         * @param {SVGElement} el Underlying DOM node.
         */
        function Element(el) {
            if (el.snap in hub) {
                return hub[el.snap];
            }
            let svg;
            try {
                svg = el.ownerSVGElement;
            } catch (e) {
            }
            /**
             * Element.node
             [ property (object) ]
             *
             * Gives you a reference to the DOM object, so you can assign event handlers or just mess around.
             > Usage
             | // draw a circle at coordinate 10,10 with radius of 10
             | var c = paper.circle(10, 10, 10);
             | c.node.onclick = function () {
             |     c.attr("fill", "red");
             | };
             */
            this.node = el;
            if (svg) {
                const PaperClass = Snap.getClass("Paper");
                this.paper = new PaperClass(svg);
            }
            /**
             * Element.type
             [ property (string) ]
             *
             * SVG tag name of the given element.
             */
            this.type = (el.tagName || el.nodeName
                || ((Snap._.glob.win.jQuery && el instanceof jQuery) ? "jquery" : null));
            if (this.type) this.type = this.type.toLowerCase();
            const id = this.id = ID(this);
            this.anims = {};
            this._ = {
                transform: [],
            };
            el.snap = id;
            if (this.type === "div") {
                console.log(id, this.node);
            }
            hub[id] = this;
        }

        // Register the Element class with Snap
        Snap.registerClass("Element", Element);

        const elproto = Element.prototype,
            is = Snap.is,
            Str = String,
            unit2px = Snap._unit2px,
            make = Snap._.make,
            getSomeDefs = Snap._.getSomeDefs,
            wrap = Snap._.wrap,
            min = Math.min,
            max = Math.max,
            INITIAL_BBOX = 'initial_bbox';

    /**
     * Computes the minimal bounding box that encloses every box from the provided collection.
     * @param {Snap.BBox[]} bboxes Collection of bounding boxes to merge.
     * @returns {Snap.BBox|undefined} A Snap-ified bounding box describing the union of all input boxes, or
     * `undefined` when no input boxes are provided.
     */
    Snap.joinBBoxes = function (bboxes) {
            const len = bboxes.length;
            if (len == 1) return bboxes[0];
            if (!Snap.path) return;
            const box = {};
            if (len) {
                box.x = bboxes[0].x;
                box.y = bboxes[0].y;
                box.x2 = bboxes[0].x2;
                box.y2 = bboxes[0].y2;
            } else {
                return;
            }
            for (let i = 1; i < len; ++i) {
                box.x = min(bboxes[i].x, box.x);
                box.y = min(bboxes[i].y, box.y);
                box.x2 = max(bboxes[i].x2, box.x2);
                box.y2 = max(bboxes[i].y2, box.y2);
            }
            return Snap.box(box);
        };

    /**
     * Converts a list of points into an axis-aligned bounding box in the current coordinate system.
     * @function
     * @name Snap.bBoxFromPoints
    * @param {Point2DList} points Points that should be enclosed in the resulting bounding box.
     * @param {Snap.Matrix} [matrix] Optional matrix to apply to every point before evaluating the box.
     * @returns {Snap.BBox} Bounding box that contains the transformed point cloud.
     */
    Snap.bBoxFromPoints = boxFromPoints;

    /**
     * Intersects a bounding box with a clip-path region, optionally applying an additional matrix to the clip-path.
     * @param {Snap.BBox|null} box Bounding box to adjust by the clip-path.
     * @param {Element|null} clip_path Clip-path element that constrains the box.
     * @param {Snap.Matrix} [matrix] Transformation applied to the clip-path before the intersection is computed.
     * @returns {Snap.BBox|null} Intersected bounding box or `null` when no box is supplied.
     */
    const clip_path_box_helper = function (box, clip_path, matrix) {
            if (box && clip_path) {
                if (matrix && !matrix.isIdentity()) {
                    const old_trans = clip_path.attr('transform');
                    clip_path.attr({transform: matrix.toString()});
                    box = box.intersect(clip_path.getBBox());
                    clip_path.attr({transform: old_trans});
                } else {
                    box = box.intersect(clip_path.getBBox());
                }
            }
            return box;
        };

    /**
     * Collects representative points for the element's geometry.
     * @param {boolean} [use_local_transform=false] When true, applies the element's local matrix to the returned points.
     * @param {boolean} [skip_hidden=false] When true, ignores children with `display: none`.
    * @returns {Point2DList} Array of points that describe the element footprint.
     */
    elproto.getPoints = function (use_local_transform, skip_hidden) {
            let result = [];
            let rx, ry, matrix;
            switch (this.type) {
                case 'polyline':
                case 'polygon':
                    const points = this.attr('points');
                    for (let i = 0, l = Math.floor(points.length / 2) * 2; i < l; i = i +
                        2) {
                        result.push({x: +points[i], y: +points[i + 1]});
                    }
                    break;
                case 'rect':
                    const x = +this.attr('x'), y = +this.attr('y'), w = +this.attr('width'),
                        h = +this.attr('height');
                    result = [
                        {x: x, y: y},
                        {x: x + w, y: y},
                        {x: x + w, y: y + h},
                        {x: x, y: y + h},
                    ];
                    break;
                case 'path':
                    result = this.getPointSample();
                    break;
                case 'line':
                    result = [
                        {x: this.attr('x1'), y: this.attr('y1')},
                        {x: this.attr('x2'), y: this.attr('y2')},
                    ];
                    break;
                case 'circle':
                    rx = +this.attr('r');
                    ry = rx;
                case 'ellipse':
                    rx = rx || +this.attr('rx');
                    ry = ry || +this.attr('ry');
                    let cx = +this.attr('cx');
                    let cy = +this.attr('cy');
                    let inc = Math.PI / 10;
                    let angles = [...Array(20).keys()].map((i) => i * inc);
                    result = angles.map((a) => {
                        return {
                            x: rx * Math.cos(a) + cx,
                            y: ry * Math.sin(a) + cy,
                        };
                    });
                    break;
                case 'g':
                case 'symbol':
                    result = [];
                    let children = this.getChildren(true), ch;
                    for (let i = 0, l = children.length; i < l; ++i) {
                        if (skip_hidden && (children[i].node.style.display === 'none' || children[i].attr("display") === "none")) continue;
                        const pts = children[i].getPoints(true, skip_hidden);
                        if (window.now && children[i].type === "use") console.log(children[i], Snap.convexHull(pts));
                        pts && pts.length && (result = [...result, ...pts]);
                    }
                    break;
                // matrix = (this.getCoordMatrix) ? this.getCoordMatrix(true) : this.transform().diffMatrix;
                // matrix = this.getLocalMatrix();
                case 'use': //todo:
                    let targ = this.getUseTarget();
                    if (targ) {
                        let x = this.attr('x') || 0,
                            y = this.attr('y') || 0;
                        // matrix = Snap.matrix().add(this.getLocalMatrix().translate(this.attr('x') || 0, this.attr('y') || 0));
                        result = targ.getPoints(true);
                        if (x || y) {
                            const trans_m = Snap.matrix().translate(x, y);
                            result = result.map((p) => trans_m.apply(p));
                        }
                        if (targ.type === 'symbol') {
                            let height = +this.attr('height'),
                                width = +this.attr('width');
                            //todo: implement viewbox
                        }
                    }
                    break;
                case 'text':
                case 'tspan':
                case 'image':
                case 'foreignObject':
                default:
                    let bb = this.getBBox({approx: false, without_transform: true});
                    result = [
                        {x: bb.x, y: bb.y},
                        {x: bb.x2, y: bb.y},
                        {x: bb.x2, y: bb.y2},
                        {x: bb.x, y: bb.y2},
                    ];

            }
            if (result.length && use_local_transform) {
                matrix = matrix || this.getLocalMatrix();
                if (!matrix.isIdentity()) result = result.map(matrix.apply.bind(matrix));
            }
            // if (window.hasOwnProperty("go")) {
            //     let max = -Infinity;
            //     result.forEach((p) => max = Math.max(max, p.x));
            //     console.log(this.type, this.getId(), max);
            // }
            return result;
        };

    /**
     * Builds the convex hull for an element, optionally applying its current transform.
     * @param {boolean} [with_transform=false] When true, returns the hull in global coordinates.
     * @param {boolean} [skip_hidden=false] When true, excludes hidden descendants while computing the hull.
    * @returns {(Point2DList|null)} Array of hull vertices ordered clockwise, or `null` for unresolved targets.
     */
    elproto.getCHull = function (with_transform, skip_hidden) {

            let el = this.getUseTarget();
            if (!el) return null;
            const is_use = this.type === 'use';

            if (!with_transform && el.c_hull && (el.type !== "g" || !skip_hidden)) return el.c_hull;

            let m;

            if (is_use &&
                (this.node.hasAttribute('x') || this.node.hasAttribute('y'))) {
                const x = +this.attr('x')
                const y = +this.attr('y');
                if (x || y) {
                    m = Snap.matrix().translate(x, y);
                }
            }

            if (with_transform) {
                const localMatrix = this.getLocalMatrix();
                m = (m) ? m.multLeft(m) : localMatrix;

                if (!m.isIdentity()) {
                    let el = this.getUseTarget();
                    let chull = el.getCHull();
                    return chull.map((p) => m.apply(p));
                }
            }

            let points = el.getPoints(is_use, skip_hidden);
            points = Snap.convexHull(points);
            if (m && !m.isIdentity()) {
                points = points.map((p) => m.apply(p));
            }
            if ((el.type !== "g" || !skip_hidden)) this.c_hull = points;
            return points;
        };

    /**
     * Resolves the underlying element referenced by a `<use>` node.
     * @returns {Element|null} Resolved target element or `null` when no referenced node is available.
     */
    elproto.getUseTarget = function () {
            if (this.type !== 'use') return this;
            if (this.use_target) {
                return this.use_target;
            } else {
                const href = this.attr('xlink:href') || this.attr('href');
                if (href) {
                    const elementId = href.substring(href.indexOf('#') + 1);
                    return this.use_target = Snap.elementFormId(elementId) ||
                        this.paper.select('#' + elementId) ||
                        wrap(this.node.ownerDocument.getElementById(elementId));
                }
            }
            return null;
        };

    /**
     * Persists the provided matrix on the element instance for subsequent lookups.
     * @param {Snap.Matrix} m Matrix to assign as the element's current transform cache.
     */
    elproto.saveMatrix = function (m) {
            this.matrix = m;
            if (this.type === 'image' && m.f) {
                // console.log("saving matrix", this.getId(), m.toString())
            }
        }

    /**
    * Generates a bounding box from a set of points, optionally applying a matrix prior to evaluation.
    * @param {Point2DList} points Collection of 2D points to enclose.
     * @param {Snap.Matrix} [matrix] Matrix used to transform the points before computing the bounds.
     * @returns {Snap.BBox} Bounding box covering the (transformed) points.
     */
    function boxFromPoints(points, matrix) {
            let min_x = Infinity, max_x = -Infinity, min_y = Infinity,
                max_y = -Infinity;
            if (matrix && !matrix.isIdentity()) {
                points = points.map((p) => matrix.apply(p));
            }
            points.forEach((p) => {
                min_x = Math.min(min_x, p.x);
                max_x = Math.max(max_x, p.x);
                min_y = Math.min(min_y, p.y);
                max_y = Math.max(max_y, p.y);
            });
            // console.log("Approx bbox", points.length);
            return Snap.box(min_x, min_y, max_x - min_x, max_y - min_y);
        }

    /**
     * Returns the bounding-box descriptor for the current element with optional control over caching, transforms, and
     * clip-path intersection.
     * The returned descriptor exposes the canonical {@link Snap.BBox} API enriched with helper fields such as `cx`,
     * `cy`, `path`, `vb`, and circle radii (`r0`, `r1`, `r2`).
     * @param {boolean|Element|Snap.Matrix|Object} [settings] When `true`, omits the local transform from the answer. A
     * {@link Element} scopes the result relative to an ancestor. A {@link Snap.Matrix} explicitly defines the applied
     * transform. An options object may contain `without_transform`, `cache_bbox`, `include_clip_path`, `approx`,
     * `skip_hidden`, `relative_parent`, `relative_coord`, or `matrix` flags for fine-grained control.
     * @returns {Snap.BBox|null} Bounding-box descriptor or `null` if it can't be resolved (e.g. hidden `<use>` target).
     */
        elproto.getBBox = function (settings) {
            if (!this.paper) {
                // console.log("No paper", this.getId());
            }
            let isWithoutTransform, cache_bbox, include_clip_path, relative_parent,
                matrix, approx = true, skip_hidden = false;
            if (typeof settings === 'boolean') {
                isWithoutTransform = settings;
            } else if (typeof settings === 'object') {
                if (settings instanceof Element) {
                    if (this.isChildOf && this.isChildOf(settings)) {
                        relative_parent = settings;
                    }
                } else if (settings.isMatrix) {
                    matrix = settings;
                } else {
                    isWithoutTransform = settings.without_transform;
                    cache_bbox = settings.cache_bbox;
                    include_clip_path = settings.include_clip_path;
                    approx = settings.approx;
                    skip_hidden = settings.skip_hidden;

                    if (settings.relative_parent && this.isChildOf &&
                        this.isChildOf(relative_parent)) {
                        relative_parent = settings.relative_parent;
                    }

                    if (settings.relative_coord) {
                        matrix = (this.getCoordMatrix) ?
                            this.getCoordMatrix(undefined, true) :
                            undefined;
                    }

                    matrix = matrix || settings.matrix;
                }
            }

            if (!matrix && relative_parent) {
                matrix = this.getLocalMatrix();
                let p = this;
                //get the transform between this and the relative_parent
                while ((p = p.parent()) && p !== relative_parent && p.type !== 'svg') {
                    matrix.multLeft(p.getLocalMatrix());
                }
            }

            if (approx) {
                if (!isWithoutTransform) matrix = matrix || this.getLocalMatrix();
                let points = this.getCHull(undefined, skip_hidden);
                if (points) {
                    return boxFromPoints(points, matrix);
                }
            }

            let clip_path;
            if (include_clip_path) {
                //todo: fix this
                clip_path = this.attr('clip-path');
                if (clip_path === 'none') clip_path = undefined;
                if (clip_path) {
                    clip_path = clip_path.trim().slice(4, -1);
                    clip_path = this.paper.select(clip_path);
                }
            }

            let saved_bb = this.attr('bbox');
            if (saved_bb) { //todo
                saved_bb = saved_bb.split(' ');
                //todo make sure this works with realative parent
                if (!include_clip_path || saved_bb[4] === 'cp') return Snap.box(saved_bb);
            }

            if (!Snap.Matrix || !Snap.path) {
                return this.node.getBBox();
            }
            let el = this,
                matrix_for_x_y_attrs = new Snap.Matrix;
            if (false && el.removed) {
                return Snap.box();
            }

            if (this.type === 'tspan' || this.type === 'text') {
                let clientRect = Snap.measureTextClientRect(this);

                let p = {x: +clientRect.left, y: clientRect.top};
                this.c_hull = [
                    p, {x: p.x + clientRect.width, y: p.y},
                    {x: p.x + clientRect.width, y: p.y + clientRect.height},
                    {x: p.x, y: p.y + clientRect.height}];
                settings = Object.assign({}, settings);
                settings.approx = true;
                const bBox1 = this.getBBox(settings);
                return bBox1;
            }

            while (el.type === 'use') {
                if (!isWithoutTransform) {
                    matrix_for_x_y_attrs = matrix_for_x_y_attrs.add(el.getLocalMatrix().translate(el.attr('x') || 0, el.attr('y') || 0));
                }

                el = this.getUseTarget();

                if (!el) return null;
            }

            if (el.type === 'g') {
                el.saveMatrix(el.getLocalMatrix(true));

                let protected_region = el.attr('protected');
                if (!!protected_region) {
                    const region = el.select('[region="1"]'); //todo: optimize and rework this
                    if (region) {
                        const clone = region.clone(true, undefined, true);
                        var box = clone.addTransform(el.matrix).getBBox(isWithoutTransform);
                        clone.remove();
                        if (cache_bbox) {
                            this.attr('bbox',
                                box.x + ' ' + box.y + ' ' + box.width + ' ' + box.height +
                                ((clip_path) ? ' cp' : ''));
                            this.data(INITIAL_BBOX,
                                {bbox: box, matrix: this.getLocalMatrix(true)});
                        }
                        return clip_path_box_helper(box, clip_path, el.matrix);
                    }
                }

                const children = el.getChildren();
                let bboxes = children.map(function (elm) {
                    // console.log(el.id + " - " + elm.id + ": " + (Date.now() - timer));
                    // timer = Date.now();
                    if (skip_hidden && (elm.node.style.display === 'none' || elm.attr("display") === "none")) {
                        console.log("In empty");
                        return null;
                    }
                    let box;
                    if (elm.hasOwnProperty('getBBox')) {
                        let m = el.matrix;
                        if (matrix) m = m.clone().multLeft(matrix);
                        box = elm.getBBox(m);
                    } else {
                        let elm_cl = elm.clone(true, undefined, true);
                        elm_cl.addTransform(el.matrix);
                        if (matrix) elm_cl.addTransform(matrix);
                        box = elm_cl.getBBox(isWithoutTransform);
                        if (+cache_bbox === 1) {
                            elm.attr('bbox',
                                box.x + ' ' + box.y + ' ' + box.width + ' ' + box.height +
                                ((clip_path) ? ' cp' : ''));
                            elm.data(INITIAL_BBOX, {bbox: box, matrix: elm.getLocalMatrix(true)});
                        }
                        elm_cl.remove(true, true);
                    }
                    return box;
                });

                bboxes = bboxes.filter(function (n) {
                    return n !== null && (n.width || n.height) && !isNaN(n.width) &&
                        !isNaN(n.height);
                });

                if (bboxes.length) {
                    var box = Snap.joinBBoxes(bboxes);
                    box.translate(matrix_for_x_y_attrs);
                    if (cache_bbox) {
                        this.attr('bbox',
                            box.x + ' ' + box.y + ' ' + box.width + ' ' + box.height +
                            ((clip_path) ? ' cp' : ''));
                        this.data(INITIAL_BBOX,
                            {bbox: box, matrix: this.getLocalMatrix(true)});
                    }
                    return clip_path_box_helper(box, clip_path, el.matrix);
                    //this only works in Strict mode
                    const p1 = el.matrix.apply({x: box.x, y: box.y}),
                        p2 = el.matrix.apply({x: box.x2, y: box.y2});
                    var box = Snap.box({x: p1.x, y: p1.y, x2: p2.x, y2: p2.y});
                    if (cache_bbox) {
                        this.attr('bbox',
                            box.x + ' ' + box.y + ' ' + box.width + ' ' + box.height +
                            ((clip_path) ? ' cp' : ''));
                        this.data(INITIAL_BBOX,
                            {bbox: box, matrix: this.getLocalMatrix(true)});
                    }
                    return clip_path_box_helper(box, clip_path, el.matrix);
                } else {
                    try {
                        let box;
                        if (matrix && !matrix.isIdentity()) {
                            const t = el.attr('transform');
                            el.addTransform(matrix);
                            box = el.node.getBBox();
                            el.attr('transform', t);
                        } else {
                            box = el.node.getBBox();
                        }

                        if (cache_bbox) {
                            this.attr('bbox',
                                box.x + ' ' + box.y + ' ' + box.width + ' ' + box.height +
                                ((clip_path) ? ' cp' : ''));
                            this.data(INITIAL_BBOX,
                                {bbox: box, matrix: this.getLocalMatrix(true)});
                        }
                        box = Snap.box(box.x, box.y, box.width, box.height);
                        return clip_path_box_helper(box, clip_path, el.matrix);

                    } catch (e) {
                        //Display:none is set and an exception is called.
                        this.attr('bbox', '');
                        this.removeData(INITIAL_BBOX);
                        return null;
                    }
                }
            }

            const _ = el._,
                pathfinder = Snap.path.get[el.type] || Snap.path.get.deflt;
            try {
                if (isWithoutTransform) {
                    _.bboxwt = pathfinder ?
                        Snap.path.getBBox(el.realPath = pathfinder(el)) :
                        Snap.box(el.node.getBBox());
                    return Snap.box(_.bboxwt);
                } else {
                    el.realPath = pathfinder(el);
                    el.saveMatrix(el.transform().localMatrix);
                    // el.matrix = el.transform().globalMatrix;
                    matrix_for_x_y_attrs.add(el.matrix);
                    if (matrix) matrix_for_x_y_attrs.multLeft(matrix);
                    _.bbox = Snap.path.getBBox(
                        Snap.path.map(el.realPath, matrix_for_x_y_attrs));
                    let box = Snap.box(_.bbox);
                    if (cache_bbox) this.attr('bbox',
                        box.x + ' ' + box.y + ' ' + box.width + ' ' + box.height);
                    return clip_path_box_helper(box, clip_path, el.matrix);
                }
            } catch (e) {
                // Firefox doesn’t give you bbox of hidden element
                return Snap.box();
            }
        };

    /**
     * Convenience wrapper around {@link Element#getBBox} that enforces approximate convex-hull evaluation.
     * @param {Object} [setting={}] Optional settings forwarded to {@link Element#getBBox}.
     * @returns {Snap.BBox|null} Approximate bounding box or `null` on failure.
     */
    elproto.getBBoxApprox = function (setting) {
            setting = setting || {};
            setting.approx = true;
            return this.getBBox(setting);
        };
    /**
     * Forces precise bounding-box computation for the element, ignoring cached approximations.
     * @param {boolean|Object|Snap.Matrix} [settigns] Options forwarded to {@link Element#getBBox}.
     * @returns {Snap.BBox|null} Exact bounding box or `null` on failure.
     */
    elproto.getBBoxExact = function (settigns) {
            if (settigns && typeof settigns === 'object' && settigns.isMatrix) {
                return this.getBBox({approx: false, matrix: settigns});
            }
            if (typeof settigns === 'boolean') settigns = {without_transform: settigns};
            settigns = settigns || {};
            settigns.approx = false;
            return this.getBBox(settigns);
        };

    /**
     * Registers or triggers attribute change monitors on the element.
     * @param {string|string[]} attr Attribute name or list of names to monitor.
     * @param {Function} [callback_val] Callback invoked with the attribute's current value when changes occur. When
     * omitted, previously registered callbacks for `attr` are executed immediately.
     * @returns {Element} The current element for chaining.
     */
    elproto.attrMonitor = function (attr, callback_val) {
            if (typeof callback_val === 'function') {
                if (!this._attr_monitor) {
                    this._attr_monitor = {};
                }
                this._attr_monitor[attr] = this._attr_monitor[attr] || [];
                this._attr_monitor[attr].push(callback_val);
                return this;
            }
            if (Array.isArray(attr)) {
                attr.forEach((a) => this.attrMonitor(a));
            } else if (this._attr_monitor && this._attr_monitor[attr]) {
                this._attr_monitor[attr].forEach((callback) => callback.call(this, this.attr(attr)));
            }
            return this
        }

        const propString = function () {
            return this.string;
        };

    /**
     * Parses the transform attribute of an element, caching and returning the corresponding matrix.
     * @param {Element} el Element whose transform should be extracted.
     * @param {string|Array|Snap.Matrix} [tstr] Optional transform override in string, array, or matrix form.
     * @returns {Snap.Matrix|undefined} Parsed matrix when no explicit transform is supplied.
     */
    function extractTransform(el, tstr) {
            if (tstr == null) {
                var doReturn = true;
                if (el.type == 'linearGradient' || el.type == 'radialGradient') {
                    tstr = el.node.getAttribute('gradientTransform');
                } else if (el.type == 'pattern') {
                    tstr = el.node.getAttribute('patternTransform');
                } else {
                    if (!el.node.getAttribute) {
                        console.log('node problem');
                    } else {
                        tstr = el.node.getAttribute('transform') || el.node.style.transform;
                    }

                }
                if (!tstr) {
                    return new Snap.Matrix;
                }
                tstr = Snap._.svgTransform2string(tstr);
            } else {
                if (!Snap._.rgTransform.test(tstr)) {
                    tstr = Snap._.svgTransform2string(tstr);
                } else {
                    tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || '');
                }
                if (is(tstr, 'array')) {
                    tstr = Snap.path ? Snap.path.toString.call(tstr) : Str(tstr);
                }
                el._.transform = tstr;
            }
            const command = Str(tstr[0]).toLowerCase()[0];
            let m;
            if (!tstr || command == 'm') {
                m = Snap._.transform2matrix(tstr);
            } else {
                m = Snap._.transform2matrix(tstr, el.getBBoxExact(true));
            }

            el.saveMatrix(m);
            if (doReturn) {
                return m;
            }
        }

    /**
     * Strict transform parser that bypasses compatibility heuristics used by {@link extractTransform}.
     * @param {Element} el Element whose transform should be parsed.
     * @param {string|Array|Snap.Matrix} [tstr] Optional transform override.
     * @returns {Snap.Matrix|undefined} Parsed matrix when reading from the DOM.
     */
    function extractTransformStrict(el, tstr) {
            if (tstr == null) {
                var doReturn = true;
                if (el.type == 'linearGradient' || el.type == 'radialGradient') {
                    tstr = el.node.getAttribute('gradientTransform');
                } else if (el.type == 'pattern') {
                    tstr = el.node.getAttribute('patternTransform');
                } else {
                    tstr = el.node.getAttribute('transform');
                }
                if (!tstr) {
                    return new Snap.Matrix;
                }
            } else {
                if (!Snap._.rgTransform.test(tstr)) {
                    tstr = Snap._.svgTransform2string(tstr);
                    tstr = Snap._.svgTransform2string(tstr);
                } else {
                    tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || '');
                }
                if (is(tstr, 'array')) {
                    tstr = Snap.path ? Snap.path.toString.call(tstr) : Str(tstr);
                }
                el._.transform = tstr;
            }
            const m = Snap._.transform2matrixStrict(tstr);
            el.saveMatrix(m);
            if (doReturn) {
                return m;
            }
        }

    /**
     * Clears cached convex hull data for the element's ancestors.
     * @param {Element} el Element whose parents should be invalidated.
     * @param {boolean} [efficient=false] When true, stops once an ancestor without cached hull data is found.
     */
    function clearParentCHull(el, efficient) {
            let parent = el.parent();
            while (parent && parent.type !== 'svg') {
                if (parent.c_hull) {
                    parent.c_hull = undefined;
                } else if (efficient) {
                    break;
                }
                parent = parent.parent();
            }
        }

    /**
     * Clears cached convex hull data for the element and optionally its ancestors.
     * @param {boolean} [force_top=true] Forces invalidation up to the root when truthy.
     */
    elproto.clearCHull = function (force_top) {
            force_top = true;
            this.c_hull = undefined;
            clearParentCHull(this, !force_top);
        }

        /**
         * Element.transform @method
 *
         * Gets or sets transformation of the element
 *
 * @param {string} tstr - transform string in Snap or SVG format
 * @returns {Element} the current element
         * or
 * @returns {object} transformation descriptor:
         o {
         o     string (string) transform string,
         o     globalMatrix (Matrix) matrix of all transformations applied to element or its parents,
         o     localMatrix (Matrix) matrix of transformations applied only to the element,
         o     diffMatrix (Matrix) matrix of difference between global and local transformations,
         o     global (string) global transformation as string,
         o     local (string) local transformation as string,
         o     toString (function) returns `string` property
         o }
         */
    /**
     * Gets or sets the element transform.
     * @param {string|Snap.Matrix} [tstr] Transform string or matrix to apply. When omitted, returns a descriptor with
     * the current transform matrices.
     * @param {boolean} [do_update=false] When true, refreshes cached bounding boxes after applying the transform.
     * @param {Snap.Matrix|boolean} [matrix] Optional matrix used for cache updates or a boolean forwarded as the
     * `apply` flag.
     * @param {boolean} [apply] Internal flag controlling partner propagation.
     * @returns {Element|Object} Element for chaining when setting transforms, or an object with aggregate matrices when
     * querying.
     */
    elproto.transform = function (tstr, do_update, matrix, apply) {
            if (typeof matrix === 'boolean') {
                apply = matrix;
                matrix = undefined;
            }

            const _ = this._;
            if (tstr == null) {
                let papa = this;
                const global = this.getGlobalMatrix()
                const local = extractTransform(this);
                const ms = [local];
                const m = new Snap.Matrix;
                let i;
                const localString = local.toTransformString(),
                    string = Str(local) == Str(this.matrix) ?
                        Str(_.transform) : localString;
                while ((papa.type != 'svg' && papa.type != 'body') && (papa = papa.parent())) {
                    ms.push(extractTransform(papa));
                }
                i = ms.length;
                while (i--) {
                    m.add(ms[i]);
                }
                return {
                    string: string,
                    globalMatrix: global,
                    totalMatrix: m,
                    localMatrix: local,
                    diffGlobalMatrix: global.clone().add(local.invert()),
                    diffMatrix: m.clone().add(local.invert()),
                    global: global.toTransformString(),
                    total: m.toTransformString(),
                    local: localString,
                    toString: propString,
                };
            }
            if (tstr instanceof Snap.Matrix) {
                this.saveMatrix(tstr);
                this._.transform = tstr.toTransformString();
            } else {
                extractTransform(this, tstr);
            }

            if (this.node) {
                if (this.type == 'linearGradient' || this.type == 'radialGradient') {
                    $(this.node, {gradientTransform: this.matrix});
                } else if (this.type == 'pattern') {
                    $(this.node, {patternTransform: this.matrix});
                } else {
                    if (do_update) this.updateBBoxCache(undefined, apply);

                    // clearParentCHull(this);

                    this.clearCHull();
                    try {
                        if (!(Snap.is(this.node, "SVGElement"))) {
                            let toTransformString = this.matrix.toString();
                            // this.node.setAttribute("transform", toTransformString);
                            this.node.style.transform = toTransformString;

                        } else {
                            $(this.node, {transform: this.matrix});
                        }
                        this.attrMonitor("transform");
                        var dom_partner = this._dom_partner;
                        if (dom_partner) {
                            let tars_str;
                            for (let i = 0, l = dom_partner.length, dom; i < l; ++i) {
                                dom = dom_partner[i];
                                const top_matrix = dom._top_matrix;
                                if (top_matrix) {
                                    tars_str = top_matrix.clone().add(this.getLocalMatrix()).toString();
                                } else {
                                    tars_str = this.node.getAttribute('transform');
                                }
                                if (dom.css) {
                                    dom.css({transform: tars_str});
                                } else if (glob.jQuery) {
                                    dom = jQuery(dom);
                                    dom.css({transform: tars_str});
                                }
                            }

                        }
                        var element_partner = this._element_partner;
                        if (element_partner && element_partner.length) {
                            for (let i = 0, l = element_partner.length; i < l; ++i) {
                                let elementPartnerElement = element_partner[i];
                                if (Snap.is(elementPartnerElement.node, "SVGElement")) {
                                    $(elementPartnerElement.node, {transform: this.matrix});
                                } else {
                                    elementPartnerElement.setStyle({transform: this.matrix});
                                }

                            }
                        }

                    } catch (e) {
                        console.log(e);
                    }
                }
            }

            if (this._partner_childern) {
                this._partner_childern.forEach((id) =>
                    this._propagateTransToPartnersChild(Snap.elementFormId(id), Snap.Matrix()));
            }

            return this;
        };

    /**
     * Translates a parsed transform token array into a {@link Snap.Matrix} instance.
     * @param {Array} tdata Result from {@link Snap._.svgTransform2string} parsing.
     * @returns {Snap.Matrix} Matrix representing the combined transform.
     */
    function transform2matrix(tdata) {
            let m = new Snap.Matrix;
            if (tdata) {
                for (var i = 0, l = tdata.length; i < l; ++i) {
                    let t = tdata[i],
                        tlen = t.length,
                        command = Str(t[0]).toLowerCase();
                    if (command === 't' && tlen === 2) {
                        m.translate(t[1], 0);
                    } else if (command === 't' && tlen === 3) {
                        m.translate(t[1], t[2]);
                    } else if (command === 'r') {
                        m.rotate(t[1], t[2], t[3]);
                    } else if (command === 's') {
                        m.scale(t[1], t[2], t[3], t[4]);
                    } else if (command === 'm' && tlen === 7) {
                        m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
                    }
                }
            }
            return m;
        }

    /**
     * Normalises the element's current transform attribute and saves it as a matrix.
     */
    elproto.transToMatrix = function () {
            let tstr = "";
            if (this.type === 'linearGradient' || this.type === 'radialGradient') {
                tstr = this.node.getAttribute('gradientTransform') || "";
            } else if (this.type === 'pattern') {
                tstr = this.node.getAttribute('patternTransform') || "";
            } else {
                tstr = this.node.getAttribute('transform') || "";
            }

            tstr = tstr.trim().toLowerCase();
            if (tstr &&
                !(tstr.startsWith('matrix(') && tstr.indexOf(')') === tstr.length -
                    1)) {
                let tarr = Snap._.svgTransform2string(tstr);
                const matrix = transform2matrix(tarr);
                let m = matrix.toString();

                // console.log("Fixing transform for", this.getId(), tstr, "to", m);
                if (this.type === 'linearGradient' || this.type === 'radialGradient') {
                    this.node.setAttribute('gradientTransform', m); //getAttribute("gradientTransform");
                    this.attrMonitor('gradientTransform')
                } else if (this.type === 'pattern') {
                    this.node.setAttribute('patternTransform', m);
                    this.attrMonitor('patternTransform')
                } else {
                    // this.node.setAttribute('transform', m);
                    this.transform(m)
                }
                this.saveMatrix(matrix);
            }
        };

    /**
     * Updates the cached bounding box after a transformation or clears it when the new transform is incompatible.
     * @param {Snap.Matrix} [matrix] Matrix describing the current transformation.
     * @param {boolean|number} [apply] When `-1`, clears the cache entirely. Otherwise controls whether child caches are
     * updated.
     * @param {boolean} [_skip_parent=false] Skips parent cache updates when truthy.
     */
    elproto.updateBBoxCache = function (matrix, apply, _skip_parent) {
            //if apply is negative, erase all bbox catches
            if (apply === -1) {
                this.eraseBBoxCache();
                return;
            }

            const old_bbox_data = this.data(INITIAL_BBOX);
            if (!old_bbox_data) return;

            const current_matrix = matrix || this.getLocalMatrix(true);
            // matrix = matrix.multLeft(old_bbox_data.matrix.invert());

            matrix = old_bbox_data.matrix.invert().multLeft(current_matrix);

            if (matrix.isIdentity()) return;

            console.log(matrix.e, matrix.f);

            // const transform = this.transform();

            // let saved_bb = this.attr("bbox");

            let old_bbox = old_bbox_data.bbox;

            // saved_bb = saved_bb.split(" ");
            // const old_bbox = Snap.box(saved_bb);

            if (!apply && !matrix.split().noRotation) {
                this.eraseBBoxCache();
                const parent = this.parent();
                if (!parent) return;
                let parent_bbox = parent.data(INITIAL_BBOX);
                if (!parent_bbox) return;

                const new_c = matrix.apply({x: old_bbox.cx, y: old_bbox.cy});
                const new_x = matrix.apply({x: old_bbox.x, y: old_bbox.y});
                const new_x2 = matrix.apply({x: old_bbox.x2, y: old_bbox.y});
                const r = max(Snap.len(new_c.x, new_c.y, new_x.x, new_x.y),
                    Snap.len(new_c.x, new_c.y, new_x2.x, new_x2.y));

                this.eraseParentBBoxCache({x: new_c.x - r, y: new_c.y - r, r: r});
                this.eraseBBoxCache();
                return;
            }

            let p1 = matrix.apply({x: +old_bbox.x, y: old_bbox.y});
            let p2 = matrix.apply({x: +old_bbox.x2, y: old_bbox.y2});

            const new_bbox = Snap.box(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y),
                Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y));
            this.attr({
                bbox: new_bbox.x + ' ' + new_bbox.y + ' ' + new_bbox.width + ' ' +
                    new_bbox.height,
            });

            this.data(INITIAL_BBOX, {bbox: new_bbox, matrix: current_matrix});

            if (this.isGroupLike()) {
                this.getChildren().forEach(function (el) {
                    el.updateBBoxCache(matrix, true, true);
                });
            }

            if (!_skip_parent) {

                this.expandParenBBoxCatch(new_bbox);
            }

        };

    /**
     * Expands cached bounding boxes up the parent chain when the current element grows in size.
     * @param {Snap.BBox|{x:number,y:number,r:number}} bbox_circ Bounding region describing the new extent.
     * @param {boolean} [is_circle=false] Indicates that `bbox_circ` represents a circle definition.
     */
    elproto.expandParenBBoxCatch = function (bbox_circ, is_circle) {
            const parent = this.parent();
            if (!parent) return;
            let saved_bb = parent.attr('bbox');
            if (!saved_bb) return;
            saved_bb = saved_bb.split(' ');
            const p_bbox = Snap.box(saved_bb);

            if (is_circle) {
                if (!p_bbox.contains(bbox_circ)) {
                    const new_parent_bbox = Snap.joinBBoxes([
                        p_bbox,
                        Snap.box(bbox_circ.x - bbox_circ.r, bbox_circ.y - bbox_circ.r,
                            2 * bbox_circ.r, 2 * bbox_circ.r)]);
                    parent.attr({bbox: new_parent_bbox.vb()});
                    parent.expandParenBBoxCatch(new_parent_bbox);
                }
                return;
            }

            if (!p_bbox.contains(bbox_circ)) {
                const new_parent_bbox = Snap.joinBBoxes([p_bbox, bbox_circ]);
                parent.attr({bbox: new_parent_bbox.vb()});
                parent.expandParenBBoxCatch(new_parent_bbox);
            }
        };

        /**
         * Erases the parent (and higher) cached bboxes, because the element has been transformed in way that its bbox cannot
         * be computed fast.
         * @param bbox_circle a bbox or a circle region that contains the element. If provided, parent (and higher) bboxes
         * are erased only if region extrudes from the parent bbox. Otherwise, there is no need to remove.
         */
    /**
     * Invalidates cached bounding boxes stored on parent elements.
     * @param {Snap.BBox|{x:number,y:number,r:number}} [bbox_circle] Bounding region used to decide whether the parent
     * caches still contain the element.
     */
    elproto.eraseParentBBoxCache = function (bbox_circle) {
            const parent = this.parent();
            if (!parent) return;
            let parent_bb = parent.attr('bbox');
            if (!parent_bb) return;

            if (bbox_circle) {
                const parent_bbox = Snap.box(parent_bb.split(' '));
                //circle is provided
                if (typeof bbox_circle.r === 'number') {
                    if (!parent_bbox.containsCircle(bbox_circle)) {
                        parent.attr({bbox: ''}); //erase
                        parent.removeData(INITIAL_BBOX);
                        const expanded_bb = Snap.joinBBoxes([
                            parent_bbox,
                            Snap.box(bbox_circle.x - bbox_circle.r,
                                bbox_circle.y - bbox_circle.r, 2 * bbox_circle.r,
                                2 * bbox_circle.r)]);
                        parent.eraseParentBBoxCache(expanded_bb);
                    }
                } else {
                    if (!parent_bbox.contains(bbox_circle)) {
                        parent.attr({bbox: ''}); //erase
                        parent.removeData(INITIAL_BBOX);
                        const expanded_bb = Snap.joinBBoxes([parent_bbox, bbox_circle]);
                        parent.eraseParentBBoxCache(expanded_bb);
                    }
                }

                return;
            }

            parent.attr({bbox: ''}); //erase
            parent.removeData(INITIAL_BBOX);
            parent.eraseParentBBoxCache();

        };

    /**
     * Removes the cached bounding box from the element and, recursively, its children.
     */
    elproto.eraseBBoxCache = function () {
            this.attr({bbox: ''});
            this.removeData(INITIAL_BBOX);
            if (this.isGroupLike()) {
                this.getChildren().forEach(function (el) {
                    el.eraseBBoxCache();
                });
            }
        };

    /**
     * Retrieves the element's local matrix, parsing it from the DOM when not cached.
     * @param {boolean} [strict=false] Enforces strict parsing semantics for the transform attribute.
     * @returns {Snap.Matrix} Local transformation matrix.
     */
    elproto.getLocalMatrix = function (strict) {
            if (this.matrix) return this.matrix;
            if (strict) {
                return extractTransformStrict(this);
            } else {
                return extractTransform(this);
            }
        };

    /**
     * Returns the element's current global transformation matrix using the DOM CTM API.
     * @returns {Snap.Matrix} Global matrix representing the element's absolute transform.
     */
    elproto.getGlobalMatrix = function () {
            const ctm = this.node.getCTM ? this.node.getCTM() : null;
            let matrix = new Snap.Matrix(ctm);
            return matrix;
        }

    /**
     * Registers a DOM or Snap partner that should mirror this element's transformations and style updates.
     * @param {Element|HTMLElement|Object} el_dom Partner reference (Snap element, DOM node, or jQuery-like wrapper).
     * @param {boolean} [strict] Reserved flag for stricter partner synchronisation.
     */
    elproto.setPartner = function (el_dom, strict) {
            if (el_dom.paper && this.paper === el_dom.paper
                // || el_dom instanceof Element
            ) {
                const el_part = this._element_partner || [];

                if (!el_part.includes(el_dom)) {
                    el_part.push(el_dom);
                }
                this._element_partner = el_part;
            } else
                // if (el_dom instanceof HTMLElement || el_dom.css)
                {
                const dom_part = this._dom_partner || [];
                if (el_dom instanceof HTMLElement) el_dom = Snap(el_dom);
                if (!dom_part.includes(el_dom)) {
                    dom_part.push(el_dom);
                }
                this._dom_partner = dom_part;
            }

            if (this.paper) {
                this.paper._partner_map = this.paper._partner_map || {};
                this.paper._partner_map[this.id] = this;
            }

            // if (strict) {
            //
            // }
        };

    /**
     * Updates the registry of partner children when elements are added or removed.
     * @param {Element} el Child element that was added or removed.
     * @param {boolean} [remove=false] Indicates whether the child should be removed from the registry.
     * @returns {Element} Current element for chaining.
     */
    elproto._updatePartnerChild = function (el, remove) {
            if (this.type === 'svg' || this.type === 'defs') return;

            if (remove) {
                if (this._partner_childern && this._partner_childern.length) {
                    const index = this._partner_childern.findIndex((id) => id === el.id);
                    if (index >= 0) {
                        this._partner_childern.splice(index, 1);
                        if (!this._partner_childern.length) {
                            delete this._partner_childern;
                            // console.log("Removing partner child", el.id, "from", this.id);
                            let parent = this.parent();
                            parent && parent._updatePartnerChild(this, true);
                        }
                    }
                }
                return this;
            }

            this._partner_childern = this._partner_childern || [];
            if (!this._partner_childern.includes(el.id)) {
                this._partner_childern.push(el.id);
                // this._partner_childern.push(el); //temp
                // console.log("Adding partner child", el.id, "to", this.id);
                let parent = this.parent();
                parent && parent._updatePartnerChild(this);
            }
        }

    /**
     * Propagates transformation updates to partner children.
     * @param {Element} el Partner child receiving the propagated transform.
     * @param {Snap.Matrix} [trans] Matrix to apply; defaults to the current element's global matrix.
     */
    elproto._propagateTransToPartnersChild = function (el, trans) {
            if (!el) return;
            if (trans) {
                let matrix = trans.clone().add(this.getLocalMatrix(true));
                el._applyToPartner(matrix);
            } else {
                el._applyToPartner(this.getGlobalMatrix());
            }
        };

    /**
     * Applies the provided matrix to each registered partner, keeping their transforms aligned.
     * @param {Snap.Matrix} matrix Matrix to propagate.
     */
    elproto._applyToPartner = function (matrix) {
            const partners = this.getPartners();
            if (partners) {
                const loc = this.getLocalMatrix();
                const m = matrix.clone().add(loc).toString();
                for (let i = 0, l = partners.length, dom; i < l; ++i) {
                    dom = partners[i];
                    dom._top_matrix = matrix.clone();
                    if (dom.css) {
                        dom.css({transform: m});
                    } else if (glob.jQuery) {
                        dom = jQuery(dom);
                        dom.css({transform: m});
                    }
                }
            }

            if (this._partner_childern) {
                this._partner_childern.forEach((id) => this._propagateTransToPartnersChild(Snap.elementFormId(id), matrix));
            }
        }


    /**
     * Removes partner associations or optionally deletes the partner nodes themselves.
     * @param {'dom'|'element'|Element|HTMLElement|Snap|boolean} [el_type] Partner type or specific partner reference.
     * @param {boolean} [remove_elements=false] When true, removes the partner elements from the DOM/SVG tree.
     */
    elproto.removePartner = function (el_type, remove_elements) {

            if (typeof el_type === 'boolean') {
                remove_elements = el_type;
                el_type = undefined;
            }
            if (!el_type) {
                this.removePartner('dom', remove_elements);
                this.removePartner('element', remove_elements);

            } else if (el_type === 'dom') {
                remove_elements && this._dom_partner &&
                this._dom_partner.forEach((el) => el.remove());
                this.removeData('dom_partner');
            } else if (el_type === 'element') {
                remove_elements && this._element_partner &&
                this._element_partner.forEach((el) => el.remove());
                this.removeData('element_partner');
            } else if (el_type instanceof Element) {
                let dom_parts = this._dom_partner;
                if (dom_parts) {
                    const jq_el = Snap(el_type);
                    const index = dom_parts.findIndex((el) => el === jq_el);
                    if (index >= 0) {
                        remove_elements && dom_parts[index].remove();
                        dom_parts.splice(index, 1);
                        if (!dom_parts.length) {
                            this.removeData('dom_partner');
                        }
                    }
                }
            } else if (el_type.paper || el_type.remove) {
                let element_partner = this._element_partner;
                if (element_partner) {
                    const index = element_partner.findIndex((el) => el === el_type);
                    if (index >= 0) {
                        remove_elements && element_partner[index].remove();
                        element_partner.splice(index, 1);
                        if (!element_partner.length) {
                            this.removeData('element_partner');
                        }
                    }
                }
            } else {
                return;
            }

            if (this.paper && !this.hasPartner()) {
                this.paper._partner_map && delete this.paper._partner_map[this.id];
            }
        };

    /**
     * Determines whether any partners are currently registered with the element.
     * @returns {boolean} True when at least one DOM or Snap partner exists.
     */
    elproto.hasPartner = function () {
            return !!(this._dom_partner || this._element_partner);
        };

    /**
     * Returns registered partners filtered by type.
     * @param {'dom'|'element'|'both'} [el_type] Desired partner category.
     * @returns {Array|Object|undefined} Matching partners or `undefined` when none exist.
     */
    elproto.getPartners = function (el_type) {
            if (!el_type) {
                return this._dom_partner || this._element_partner;
            } else if (el_type === 'dom') {
                return this._dom_partner;
            } else if (el_type === 'element') {
                return this._element_partner;
            } else if (el_type === "both") {
                return {dom: this._dom_partner, element: this._element_partner};
            }
        }

    /**
     * Applies style updates to registered partners, mirroring key display-related properties.
     * @param {Object} style_obj Style object whose `opacity` and `display` values are forwarded to partners.
     */
    elproto.setPartnerStyle = function (style_obj) {
            let obj = {};
            if (style_obj.hasOwnProperty(
                'opacity')) obj.opacity = style_obj.opacity;
            if (style_obj.hasOwnProperty(
                'display')) obj.display = style_obj.display;
            let dom = this._dom_partner;
            dom && dom.forEach((e) => e.css(obj));
            let el = this._element_partner;
            el && el.forEach((e) => e.attr(obj));
        };

        /**
         * Returns the element's parent element.
         * @returns {Element} Parent element wrapper.
         */
        elproto.parent = function () {
            return wrap(this.node.parentNode);
        };

        /**
         * Assigns a new paper instance to the element and all of its descendants.
         * @param {Paper} paper Target paper instance.
         * @param {boolean} [force=false] When true, reassigns even if the paper is unchanged.
         * @returns {Element} Current element for chaining.
         */
        elproto.setPaper = function (paper, force) {
            if (!paper instanceof Paper ||
                (!force && this.paper === paper)) return this;

            this.paper = paper;
            this.getChildren().forEach((ch) => ch.setPaper(paper, force));
            return this;
        };

        /**
         * Appends the provided element (or set) to the current element.
         * @param {Element|Set|Array<Element>} el Element, set, or array to append.
         * @returns {Element} Parent element for chaining.
         */
        elproto.append = elproto.add = function (el) {

            if (el) {
                clearParentCHull(this);
                if (el.type === 'set' || Array.isArray(el)) {
                    const it = this;
                    el.forEach(function (el) {
                        it.add(el);
                    });
                    return this;
                }

                // el = Snap(wrap(el));
                el = wrap(el);
                if ((el.hasPartner && el.hasPartner()) || el._partner_childern) {
                    let parent = el.parent();
                    if (parent !== this) parent._updatePartnerChild(el, "remove");
                    this._updatePartnerChild(el);
                    this._propagateTransToPartnersChild(el);
                }
                const node = (this.div) ? this.div.node : this.node;
                node.appendChild(el.node);

                // if (this.sub_children && this.sub_children.length > 0) {
                //     this.sub_children.push(el);
                // } else {
                //     this.sub_children = [el];
                // }
                if (el.setPaper && this.paper && el.type !== 'svg' && el.paper !== this.paper) {
                    el.setPaper(this.paper);
                }

                if (el.domChangeReact && el.domChangeReact instanceof "function") {
                    el.domChangeReact();
                }
            }
            return this;
        };
    /**
     * Appends the current element to the specified parent.
     * @param {Element} el Parent element that will receive this node.
     * @returns {Element} Child element for chaining.
     */
        elproto.appendTo = function (el) {
            if (el) {
                clearParentCHull(this);
                el = wrap(el);
                el.append(this);
            }
            return this;
        };
    /**
     * Prepends the specified element (or set) to the current element.
     * @param {Element|Set} el Element to prepend.
     * @returns {Element} Parent element for chaining.
     */
        elproto.prepend = function (el) {
            if (el) {
                clearParentCHull(this);
                if (el.type == 'set') {
                    const it = this;
                    let first;
                    el.forEach(function (el) {
                        if (first) {
                            first.after(el);
                        } else {
                            it.prepend(el);
                        }
                        first = el;
                    });
                    return this;
                }
                el = wrap(el);
                const parent = el.parent();
                this.node.insertBefore(el.node, this.node.firstChild);
                this.add && this.add();
                el.paper = this.paper;
                this.parent() && this.parent().add();
                parent && parent.add();
            }
            return this;
        };
    /**
     * Prepends this element to the specified parent.
     * @param {Element} el Parent element to receive this node.
     * @returns {Element} Child element for chaining.
     */
        elproto.prependTo = function (el) {
            el = wrap(el);
            el.prepend(this);
            return this;
        };
    /**
     * Inserts the provided element before the current element.
     * @param {Element|Set} el Element to insert.
     * @returns {Element} Parent element for chaining.
     */
        elproto.before = function (el) {
            clearParentCHull(this);
            if (el.type == 'set') {
                const it = this;
                el.forEach(function (el) {
                    const parent = el.parent();
                    it.node.parentNode.insertBefore(el.node, it.node);
                    parent && parent.add();
                });
                this.parent().add();
                return this;
            }
            el = wrap(el);
            var parent = el.parent();
            this.node.parentNode.insertBefore(el.node, this.node);
            this.parent() && this.parent().add();
            parent && parent.add();
            el.paper = this.paper;
            return this;
        };
    /**
     * Inserts the provided element after the current element.
     * @param {Element} el Element to insert.
     * @returns {Element} Parent element for chaining.
     */
        elproto.after = function (el) {
            el = wrap(el);
            clearParentCHull(this);
            const parent = el.parent();
            if (this.node.nextSibling) {
                this.node.parentNode.insertBefore(el.node, this.node.nextSibling);
            } else {
                if (this.node.parentNode) {
                    this.node.parentNode.appendChild(el.node);
                } else {
                    parent.add(el);
                }

            }
            this.parent() && this.parent().add();
            parent && parent.add();
            el.paper = this.paper;
            return this;
        };
    /**
     * Inserts the current element before the provided sibling.
     * @param {Element} el Sibling element used as insertion point.
     * @returns {Element} Parent element for chaining.
     */
        elproto.insertBefore = function (el) {
            el = wrap(el);
            clearParentCHull(el);
            const parent = this.parent();
            el.node.parentNode.insertBefore(this.node, el.node);
            this.paper = el.paper;
            parent && parent.add();
            el.parent() && el.parent().add();
            return this;
        };
    /**
     * Inserts the current element after the provided sibling.
     * @param {Element} el Sibling element used as insertion reference.
     * @returns {Element} Parent element for chaining.
     */
        elproto.insertAfter = function (el) {
            el = wrap(el);
            clearParentCHull(el);
            const parent = this.parent();
            el.node.parentNode.insertBefore(this.node, el.node.nextSibling);
            this.paper = el.paper;
            parent && parent.add();
            el.parent() && el.parent().add();
            return this;
        };
    /**
     * Removes the element from the DOM and detaches partner associations.
     * @returns {Array<Element>} Collection of child elements that were detached alongside this element.
     */
        elproto.remove = function () {
            clearParentCHull(this);
            const parent = this.parent();
            if (parent) parent._updatePartnerChild(this, true);
            this.undrag();
            if (this.removePartner) this.removePartner(true);

            this.node.parentNode && this.node.parentNode.removeChild(this.node);
            // if (parent.sub_children) {
            //     var index = parent.sub_children.indexOf(this);
            //     if (index > -1) parent.sub_children.splice(index, 1);
            // }
            delete this.paper;
            this.removed = true;

            delete eldata[this.id];
            // parent && parent.add();
            return this.getChildren();
        };
    /**
     * Removes all child elements from the DOM.
     */
        elproto.removeChildren = function () {
            this.getChildren().forEach(function (el) {
                el.remove();
            });
            if (this.hasOwnProperty('sub_children')) this.sub_children = [];

            return this;
        };

        /*
         * Element.getChildren
         * @method
         *
         * Returns an array of the children of the element, filtering out non-geometric elements. It shoulc be called
         * for the groups or the topmost svg element.
         * */
        elproto.getChildren = function (visible, include_text) {
            if (this.sub_children) return this.sub_children;

            // if (this.type !== "g" && this.type !== "text" && this.type !== "svg" && this.type !== "clipPath" && this.type !== "defs") {
            //     return [];
            // }
            let children = this.children();
            const that = this;
            children = children.filter(
                function (el) {
                    if (include_text && el.node.nodeType === 3) return true;

                    if (el._ghost_element) return false;

                    el.paper = that.paper;
                    if (typeof visible === 'string') return (visible === el.type);

                    if (visible) {
                        return (el.type === 'circle' || el.type === 'ellipse' || el.type ===
                            'line' || el.type === 'g' || el.type === 'path' || el.type ===
                            'polygon' || el.type === 'polyline' || el.type === 'rect' ||
                            el.type === 'text' || el.type === 'tspan' || el.type ===
                            'use' || el.type === 'image');
                    } else {
                        return !(el.node.nodeType > 1 ||
                            el.type === 'defs' ||
                            el.type === 'desc');
                    }
                },
            );

            return children;

            // return children.map(function (el) {
            //     // if (el.nodeType > 1) return el;
            //     // let snap = Snap(el);
            //     // if (!snap.paper) {
            //          //This shouldn't be needed.
            //     // }
            //     // return snap;
            // });
        };

    /**
     * Determines whether the element contains any non-meta child nodes.
     * @returns {boolean} True when at least one meaningful child exists.
     */
    elproto.hasChildren = function () {
            if (this.type !== 'g' || this.type !== 'svg' || this.type !== 'clipPath') {
                return false;
            }
            const children = this.children();
            let i = 0, el;
            for (; i < children.length; ++i) {
                el = children[i];
                if (!(el.type === '#text' ||
                    el.type === '#comment' ||
                    el.type === 'defs' ||
                    el.type === 'desc')) {
                    return true;
                }
            }
            return false;
        };

        /**
         * Returns the first descendant matching the provided CSS selector.
         * @param {string} query CSS selector compatible with SVG.
         * @returns {Element|null} Wrapped element or `null` when not found.
         */
        elproto.select = function (query) {
            query = replaceNumericIdSelectors(query);
            return wrap(this.node.querySelector(query));
        };
        /**
         * Returns all descendants matching the provided CSS selector.
         * @param {string} query CSS selector compatible with SVG.
         * @returns {Array<Element>|Set} Collection containing all matches.
         */
        elproto.selectAll = function (query) {
            query = replaceNumericIdSelectors(query);
            const nodelist = this.node.querySelectorAll(query),
                set = (Snap.set || Array)();
            for (let i = 0; i < nodelist.length; ++i) {
                set.push(wrap(nodelist[i]));
            }
            return set;
        };

    /**
     * Transforms numeric ID selectors into attribute selectors for SVG compatibility.
     * @param {string} cssQuery Raw CSS selector string.
     * @returns {string} Selector with numeric ID references translated.
     */
    function replaceNumericIdSelectors(cssQuery) {
            // Regular expression to match ID selectors starting with a number
            const regex = /#(\d[\w-]*)/g;

            // Replace each matched ID selector
            const modifiedQuery = cssQuery.replace(regex, (_, id) => `[id="${id}"]`);

            return modifiedQuery;
        }

    /**
     * Resolves an attribute value into pixels.
     * @param {string} attr Attribute name.
     * @param {string|number} [value] Optional raw value; defaults to the current attribute.
     * @returns {number} Attribute value converted to pixels.
     */
        elproto.asPX = function (attr, value) {
            if (value == null) {
                value = this.attr(attr);
            }
            return +unit2px(this, attr, value);
        };
// SIERRA Element.use(): I suggest adding a note about how to access the original element the returned <use> instantiates. It's a part of SVG with which ordinary web developers may be least familiar.
    /**
     * Creates a `<use>` element referencing this element or one matched by the provided selector and appends it.
     * @param {string} [css_ref] CSS reference resolving to an element to clone.
     * @param {number} [x] Optional x-offset applied to the generated `<use>`.
     * @param {number} [y] Optional y-offset applied to the generated `<use>`.
     * @returns {Element|undefined} The newly created `<use>` element, or `undefined` when the selector fails.
     */
        elproto.addUse = function (css_ref, x, y) {
            let use,
                id = this.node.id;

            if (css_ref !== undefined && typeof css_ref === 'string') {
                var select = this.paper.select(css_ref);
                if (select) {
                    use = select.use();
                    if (typeof x == 'number' && typeof y == 'number') {
                        use.attr({x: x, y: y});
                    }
                    this.append(use);
                }
                return use;
            }

            if (!id) {
                id = this.id;
                $(this.node, {
                    id: id,
                });
            }
            if (this.type === 'linearGradient' || this.type === 'radialGradient' ||
                this.type === 'pattern') {
                use = make(this.type, this.node.parentNode);
            }
            if (this.type === 'svg') {
                use = make('use', this.node);
            } else {
                use = make('use', this.node.parentNode);
            }
            $(use.node, {
                'href': '#' + id,
            });
            use.use_target = this;
            return use;
        };

        elproto.use = elproto.addUse;

    /**
     * Normalises IDs within a cloned subtree to avoid collisions.
     * @param {Element} el Root element containing cloned nodes.
     * @param {Function} [id_rename_callback] Callback returning the new ID for a given current ID.
     */
    function fixids(el, id_rename_callback) {
            const els = el.selectAll('*');
            let it;
            const url = /^\s*url\(("|'|)(.*)\1\)\s*$/,
                ids = [],
                uses = {};

            function urltest(it, name) {
                let val = $(it.node, name);
                val = val && val.match(url);
                val = val && val[2];
                if (val && val.charAt() == '#') {
                    val = val.substring(1);
                } else {
                    return;
                }
                if (val) {
                    uses[val] = (uses[val] || []).concat(function (id) {
                        const attr = {};
                        attr[name] = Snap.url(id);
                        $(it.node, attr);
                    });
                }
            }

            function linktest(it) {
                let val = $(it.node, 'href');
                if (val && val.charAt() == '#') {
                    val = val.substring(1);
                } else {
                    return;
                }
                if (val) {
                    uses[val] = (uses[val] || []).concat(function (id) {
                        it.attr('href', '#' + id);
                    });
                }
            }

            for (var i = 0, ii = els.length; i < ii; ++i) {
                it = els[i];
                urltest(it, 'fill');
                urltest(it, 'stroke');
                urltest(it, 'filter');
                urltest(it, 'mask');
                urltest(it, 'clip-path');
                linktest(it);
                const oldid = $(it.node, 'id');
                if (oldid) {
                    const new_id = (id_rename_callback) ? id_rename_callback(oldid) : it.id;
                    $(it.node, {id: new_id});
                    ids.push({
                        old: oldid,
                        id: new_id,
                    });
                }
            }
            for (i = 0, ii = ids.length; i < ii; ++i) {
                const fs = uses[ids[i].old];
                if (fs) {
                    let j = 0;
                    const jj = fs.length;
                    for (; j < jj; j++) {
                        fs[j](ids[i].id);
                    }
                }
            }
        }

    /**
     * Clones the element, optionally hiding it, renaming IDs, or performing a deep `use` expansion.
     * @param {boolean} [hidden] When true, skips inserting the clone into the DOM.
     * @param {Function} [id_rename_callback] Callback used to generate unique IDs for the clone and descendants.
     * @param {boolean} [deep_copy=false] When true, expands `<use>` references into actual nodes.
     * @returns {Element} Cloned element.
     */
        elproto.clone = function (hidden, id_rename_callback, deep_copy) {
            if (typeof hidden === 'function') {
                id_rename_callback = hidden;
                hidden = undefined;
            }
            const id = this.attr('id');
            const clone = wrap(this.node.cloneNode(true));
            if (!hidden) clone.insertAfter(this);
            if ($(clone.node, 'id')) {
                const new_id = (id_rename_callback) ?
                    id_rename_callback($(clone.node, 'id')) :
                    clone.id;
                $(clone.node, {id: new_id});
            }
            fixids(clone, id_rename_callback);
            clone.paper = this.paper;
            if (id && !id_rename_callback) clone.attr('id', id);
            if (deep_copy) clone.removeUses();
            return clone;
        };

        const groupLikeTest = {
            //svg tags
           g: true,
           mask: true,
           pattern: true,
           symbol: true,
           clippath: true,
           defs: true,
           svg: true,
            //html tags now
           body: true,
           head: true,
           div: true,
           p: true,
           span: true,
           ul: true,
           ol: true,
           li: true,
           table: true,
           tbody: true,
           thead: true,
           tfoot: true,
           tr: true,
           td: true,
           th: true,
           section: true,
           article: true,
           aside: true,
           nav: true,
           main: true,
           form: true,
           fieldset: true,
           legend: true,
           label: true
        };
        /**
         * Determines whether the element behaves like a grouping container.
         * @returns {boolean} True for group-like elements.
         */
        elproto.isGroupLike = function () {
            return !!groupLikeTest[this.type];
        };

        /**
         * Recursively expands `<use>` elements into standalone clones.
         */
        elproto.removeUses = function () {
            if (this.isGroupLike()) {
                this.getChildren().forEach(function (el) {
                    el.removeUses();
                });
                return;
            }

            if (this.type === 'use') {
                let matrix = this.getLocalMatrix(true);
                const x = +this.attr('x');
                const y = +this.attr('y');
                matrix = matrix.multLeft(Snap.matrix().translate(x, y));
                if (!this.use_target) {
                    const href = this.attr('xlink:href') || this.attr('href');
                    if (href) {
                        const elementId = href.substring(href.indexOf('#') + 1);
                        this.use_target = Snap.elementFormId(elementId) ||
                            wrap(this.node.ownerDocument.getElementById(elementId));
                        if (!this.use_target) {
                            console.log('Cannot fine use');
                        }
                    } else {
                        return;
                    }
                }
                let clone;
                if (this.use_target.type === 'symbol') {
                    clone = this.paper.g();
                    clone.add(this.getChildren());
                } else {
                    clone = this.use_target.clone();
                }

                this.after(clone);
                clone.removeUses();
                clone.addTransform(matrix);
                clone.attr('id', this.getId());
                this.remove();
            }
        };

    /**
     * Moves the element into the shared `<defs>` section.
     * @returns {Element} Current element for chaining.
     */
        elproto.toDefs = function () {
            const defs = getSomeDefs(this);
            defs.appendChild(this.node);
            return this;
        };
    /**
     * Converts the current element into a reusable `<pattern>` definition.
     * @param {number|Object} [x] X coordinate or bounding-box object.
     * @param {number} [y]
     * @param {number} [width]
     * @param {number} [height]
     * @returns {Element} Pattern element that now owns the node.
     */
        elproto.pattern = elproto.toPattern = function (x, y, width, height) {
            const p = make('pattern', getSomeDefs(this));
            if (x == null) {
                x = this.getBBox();
            }
            if (is(x, 'object') && 'x' in x) {
                y = x.y;
                width = x.width;
                height = x.height;
                x = x.x;
            }
            $(p.node, {
                x: x,
                y: y,
                width: width,
                height: height,
                patternUnits: 'userSpaceOnUse',
                id: p.id,
                viewBox: [x, y, width, height].join(' '),
            });
            p.node.appendChild(this.node);
            return p;
        };

        /**
         * Converts the current element into a `<marker>` definition.
         * @param {number|Object} [x] X coordinate or bounding-box-like descriptor containing marker data.
         * @param {number} [y]
         * @param {number} [width]
         * @param {number} [height]
         * @param {number} [refX]
         * @param {number} [refY]
         * @returns {Element} Marker element referencing the current node.
         */
        elproto.marker = function (x, y, width, height, refX, refY) {
            const p = make('marker', getSomeDefs(this));
            if (x == null) {
                x = this.getBBox();
            }
            if (is(x, 'object') && 'x' in x) {
                y = x.y;
                width = x.width;
                height = x.height;
                refX = x.refX || x.cx;
                refY = x.refY || x.cy;
                x = x.x;
            }
            $(p.node, {
                viewBox: [x, y, width, height].join(' '),
                markerWidth: width,
                markerHeight: height,
                orient: 'auto',
                refX: refX || 0,
                refY: refY || 0,
                id: p.id,
            });
            p.node.appendChild(this.node);
            return p;
        };
        const eldata = {};
        /**
         * Element.data @method
 *
         * Adds or retrieves given value associated with given key. (Don’t confuse
         * with `data-` attributes)
         *
         * See also @Element.removeData
 * @param {string} key - key to store data
 * @param {any} value - #optional value to store
 * @returns {object} @Element
         * or, if value is not specified:
 * @returns {any} value
         > Usage
         | for (var i = 0, i < 5, i++) {
         |     paper.circle(10 + 15 * i, 10, 10)
         |          .attr({fill: "#000"})
         |          .data("i", i)
         |          .click(function () {
         |             alert(this.data("i"));
         |          });
         | }
         */
        elproto.data = function (key, value) {
            const data = eldata[this.id] = eldata[this.id] || {};
            if (arguments.length == 0) {
                Snap._dataEvents && eve(['snap', 'data', 'get', this.id], this, data, null);
                return data;
            }
            if (arguments.length == 1) {
                if (Snap.is(key, 'object')) {
                    for (let i in key) if (key[has](i)) {
                        this.data(i, key[i]);
                    }
                    return this;
                }
                Snap._dataEvents && eve(['snap', 'data', 'get', this.id], this, data[key], key);
                return data[key];
            }
            data[key] = value;
            Snap._dataEvents && eve(['snap', 'data', 'set', this.id], this, value, key);
            return this;
        };
        /**
         * Element.removeData @method
 *
         * Removes value associated with an element by given key.
         * If key is not provided, removes all the data of the element.
 * @param {string} key - #optional key
 * @returns {object} @Element
         */
        elproto.removeData = function (key) {
            if (key == null) {
                eldata[this.id] = {};
            } else {
                eldata[this.id] && delete eldata[this.id][key];
            }
            return this;
        };
        /**
         * Element.outerSVG @method
 *
         * Returns SVG code for the element, equivalent to HTML's `outerHTML`.
         *
         * See also @Element.innerSVG
 * @returns {string} SVG code for the element
         */
        /**
         * Element.toString @method
 *
         * See @Element.outerSVG
         */
        elproto.outerSVG = elproto.toString = toString(1);
        /**
         * Element.innerSVG @method
 *
         * Returns SVG code for the element's contents, equivalent to HTML's `innerHTML`
 * @returns {string} SVG code for the element
         */
        elproto.innerSVG = toString();

        function toString(type) {
            return function () {
                let res = type ? '<' + this.type : '';
                const attr = this.node.attributes,
                    chld = this.node.childNodes;

                // var comp_style = window.getComputedStyle(this.node);
                //
                // if (comp_style.hasOwnProperty("cursor") && comp_style.cursor !== "auto" ){
                //  console.log(comp_style.cursor);
                // }

                if (type) {
                    let quote_rep;
                    for (var i = 0, ii = attr.length; i < ii; ++i) {
                        quote_rep = (attr[i].name === 'style') ? '\'' : '\\"';
                        res += ' ' + attr[i].name + '="' +
                            attr[i].value.replace(/"/g, quote_rep) + '"';
                    }
                }
                if (chld.length) {
                    type && (res += '>');
                    for (i = 0, ii = chld.length; i < ii; ++i) {
                        if (chld[i].nodeType == 3) {
                            res += chld[i].nodeValue;
                        } else if (chld[i].nodeType == 1) {
                            res += wrap(chld[i]).toString();
                        }
                    }
                    type && (res += '</' + this.type + '>');
                } else {
                    type && (res += '/>');
                }
                return res;
            };
        }

        elproto.toDataURL = function () {
            if (window && window.btoa) {
                const bb = this.getBBox(),
                    svg = Snap.format(
                        '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{width}" height="{height}" viewBox="{x} {y} {width} {height}">{contents}</svg>',
                        {
                            x: +bb.x.toFixed(3),
                            y: +bb.y.toFixed(3),
                            width: +bb.width.toFixed(3),
                            height: +bb.height.toFixed(3),
                            contents: this.outerSVG(),
                        });
                return 'data:image/svg+xml;base64,' +
                    btoa(unescape(encodeURIComponent(svg)));
            }
        };
        /**
         * Fragment.select @method
 *
         * See @Element.select
         */
        Fragment.prototype.select = elproto.select;
        /**
         * Fragment.selectAll @method
 *
         * See @Element.selectAll
         */
        Fragment.prototype.selectAll = elproto.selectAll;
    }
)
;
