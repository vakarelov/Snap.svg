(function (root) {

    let Snap_ia = root.Snap_ia || root.Snap;
//Element Extansions
    Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {

        //ELEMENT Functions

        let _ = {};

        /**
         * Resolves the DOM identifier used by this element.
         * If the element does not yet have an `id` attribute, one is generated
         * from Snap's internal identifier and applied to the node so future
         * lookups remain stable.
         *
         * @function Snap.Element#getId
         * @returns {string} A non-empty identifier guaranteed to be set on the element.
         * @example
         * const rect = paper.rect(0, 0, 100, 50);
         * const id = rect.getId();
         * Ensures the DOM node now has an id attribute you can query with document.getElementById(id)
         */
        Element.prototype.getId = function () {
            let id = this.attr('id');
            if (!id) {
                id = this.id;
                this.attr('id', id);
            }
            return id;
        };

        /**
         * Sets the element `id` and updates all references that point at the original value.
         * This is particularly useful when importing foreign SVG fragments that may clash
         * with existing identifiers inside the current paper.
         *
         * @function Snap.Element#setIdFollowRefs
         * @param {string|undefined} [id] A custom identifier. When omitted a unique suffix is appended to the original id.
         * @param {Snap.Element|undefined} [from_group] Optional group that scopes the reference search.
         * @returns {Snap.Element} Returns the element to allow chaining.
         * @example
         * symbol.setIdFollowRefs('icon-symbol');
         *  All <use> nodes targeting the original id now point to #icon-symbol.
         */
        Element.prototype.setIdFollowRefs = function (id, from_group) {
            if (id instanceof Element) {
                from_group = id;
                id = undefined;
            }
            let orig = this.getId();

            if (!id) {
                let rand = String.rand || function () {
                    let inc = 1;
                    return () => {
                        return String(inc++);
                    };
                }();

                id = orig + '_' + rand(4);
                while (this.paper.selectAll('#' + id).length) {
                    id = orig + '_' + rand(4);
                }
            }

            const references = this.getReferringToMe(from_group);
            this.attr('id', id);
            const type = this.type;
            references.forEach((ref) => {
                switch (type) {
                    case 'clipPath': {
                        const attr = 'url("#' + orig + '")';
                        const new_attr = 'url("#' + id + '")';
                        const cp = ref.attr('clip-path');
                        if (cp === attr) {
                            ref.attr('clip-path', new_attr);
                        }
                        if (ref.node.style.clipPath === attr) {
                            ref.node.style.clipPath = new_attr;
                        }
                        break;
                    }
                    case 'mask': {
                        const attr = 'url("#' + orig + '")';
                        const new_attr = 'url("#' + id + '")';
                        if (ref.attr('mask') === attr) {
                            ref.attr('mask', new_attr);
                        }
                        if (ref.node.style.mask === attr) {
                            ref.node.style.mask = new_attr;
                        }
                        break;
                    }
                    case 'pattern':
                    case 'linearGradient':
                    case 'lineargradient':
                    case 'radialGradient':
                    case 'radialgradient': {
                        const attr = 'url("#' + orig + '")';
                        const new_attr = 'url("#' + id + '")';
                        let attr1 = ref.attr('fill');
                        if (Snap.is(attr1, "Element")) {
                            attr1 = 'url("#' + attr1.attr("id") + '")';
                        }
                        if (attr1 === attr) {
                            ref.attr('fill', new_attr);
                        }
                        if (ref.node.style.fill === attr) {
                            ref.node.style.fill = new_attr;
                        }
                        let stroke = ref.attr('stroke');
                        if (stroke && Snap.is(stroke, "Element")) {
                            stroke = 'url("#' + stroke.attr("id") + '")';
                        }
                        if (stroke === attr) {
                            ref.attr('stroke', new_attr);
                        }
                        if (ref.node.style.stroke === attr) {
                            ref.node.style.stroke = new_attr;
                        }
                        if (ref.attr('href') === "#" + orig) {
                            ref.attr('href', '#' + id);
                        }
                        break;
                    }
                    case 'symbol':
                    default: {
                        const attr = '#' + orig;
                        const new_attr = '#' + id;
                        if (ref.attr('href') === attr) {
                            ref.attr('href', new_attr);
                        }
                        if (ref.attr('xlink:href') === attr) {
                            ref.attr('xlink:href', new_attr);
                        }
                    }
                }

            });

            return this;
        };
        /**
         * Retrieves the top-level SVG root associated with the current element.
         *
         * @function Snap.Element#getTopSVG
         * @returns {Snap.Element} Snap wrapper around the root `<svg>` element.
         */
        Element.prototype.getTopSVG = function () {
            return Snap(this.paper.node);
        };

        /**
         * Gets all elements that use the current element as a reference.
         * This is useful mainly for clipPath, mask, pattern, gradients or symbol element,
         * however, it can be used with any other element for a <use> tag.
         *
         * @function Snap.Element#getReferringToMe
         * @param {Snap.Element} [in_group] Optional container restricting where references are searched.
         * @returns {Snap.Set} Collection of referencing elements.
         */
        Element.prototype.getReferringToMe = function (in_group) {
            in_group = in_group || this.paper;
            const id = this.getId();
            switch (this.type) {
                case 'clippath': {
                    const css = '[clip-path="url(#' + id + ')"]';
                    // + ','+ '[style*="clip-path: url(#' + id + ')"]'
                    // + ','+ '[style*="clip-path:url(#' + id + ')"]';
                    let found = in_group.selectAll(css);
                    if (found.length === 0) {
                        found = in_group.selectAll('[style*="clip-path:"]');
                        found = found.filter((el) => {
                            let cp_val = el.node.style.clipPath;
                            if (cp_val) cp_val = cp_val.replace('url("#', '').replace('")', '');
                            return cp_val === id;
                        });
                    }
                    return found;
                }
                case 'mask': {
                    let found = in_group.selectAll(
                        '[mask="url(#' + id + ')"]',
                        // + ',' + '[style*="mask: url(#' + id + ')"]' + ',',
                        // + '[style*="mask:url(#' + id + ')"]',
                    );
                    if (found.length === 0) {
                        found = in_group.selectAll('[style*="mask:"]');
                        found = found.filter((el) => {
                            let cp_val = el.node.style.mask;
                            if (cp_val) cp_val = cp_val.replace('url("#', '').replace('")', '');
                            return cp_val === id;
                        });
                    }
                    return found;
                }
                case 'pattern':
                case 'linearGradient':
                case 'lineargradient':
                case 'radialGradient':
                case 'radialgradient': {
                    let found = in_group.selectAll(
                        '[fill="url(#' + id + ')"]'
                        + ',' + '[href="url(#' + id + ')"]'
                        + ',' + '[href="#' + id + '"]'
                        + ',' + '[style*="fill: url(#' + id + ')"]'
                        + ',' + '[style*="fill:url(#' + id + ')"]'
                        + ',' + '[stroke="url(#' + id + ')"]'
                        + ',' + '[style*="stroke: url(#' + id + ')"]'
                        + ',' + '[style*="stroke:url(#' + id + ')"]',
                    );
                    return found;
                }
                case 'symbol':
                default: {
                    const css = 'use[*|href="#' + id + '"]';
                    let found = in_group.selectAll(css);
                    return found;
                }
            }

        };

        /**
         * Reparents the element into another group while preserving its visual position.
         *
         * @function Snap.Element#repositionInGroup
         * @param {Snap.Element} group The new group-like container or root svg.
         * @returns {Snap.Element|undefined} Returns the element when the move succeeds, otherwise leaves it untouched.
         * @example
         * const layer = paper.g();
         * rect.repositionInGroup(layer); // rect visually remains in place but becomes a child of `layer`
         */
        Element.prototype.repositionInGroup = function (group) {
            if (!group.isGroupLike() && group.type !== 'svg') return;
            if (this.parent() === group) return;
            const diffMatrix = this.transform().diffMatrix;
            const gr_Matrix = group.transform().totalMatrix;
            const new_trans = diffMatrix.multLeft(gr_Matrix.invert());
            group.add(this);
            this.addTransform(new_trans);
        };

        /**
         * Converts a global SVG point to the local coordinate space of the element.
         * The conversion accounts for nested transforms by multiplying the relevant matrices.
         *
         * @function Snap.Element#globalToLocal
         * @param {DOMPoint} globalPoint The point expressed in the global coordinate system.
         * @param {Snap.Element} coordTarget The element that produced the original global coordinates.
         * @returns {DOMPoint} A new DOMPoint positioned in this element's local space.
         * @example
         * const cursor = rect.getCursorPoint(evt.clientX, evt.clientY, rect);
         * const local = rect.globalToLocal(cursor, rect);
         */
        Element.prototype.globalToLocal = function (globalPoint, coordTarget) {

            let ctm = coordTarget.node.getCTM();
            const globalToLocal = ctm ? ctm.inverse().multiply(this.node.getCTM()) : this.node.getCTM();
            globalToLocal.e = globalToLocal.f = 0;
            return globalPoint.matrixTransform(globalToLocal);
        };

        /**
         * Translates screen coordinates (usually from pointer events) into the element's local coordinate system.
         *
         * @function Snap.Element#getCursorPoint
         * @param {number} x The screen-space X coordinate (e.g. `event.clientX`).
         * @param {number} y The screen-space Y coordinate (e.g. `event.clientY`).
         * @param {Snap.Element} [coordTarget=this] Optional element that originated the event; defaults to the element itself.
         * @returns {DOMPoint} A DOMPoint describing the local coordinates.
         * @example
         * svg.node.addEventListener('mousemove', evt => {
         *   const {x, y} = rect.getCursorPoint(evt.clientX, evt.clientY);
         *   rect.attr({ x, y });
         * });
         */
        Element.prototype.getCursorPoint = function (x, y, coordTarget) {
            const pt = this.paper.node.createSVGPoint();
            coordTarget = coordTarget || this;

            pt.x = x;
            pt.y = y;

            // Adjust the coordinates for the scroll position
            pt.x = x - Snap.window().scrollX;
            pt.y = y - Snap.window().scrollY;


            let screenCTM = coordTarget.node.getScreenCTM();
            // console.log(screenCTM, this.paper.screenCTM_compensation_matrix)

            if (this.paper.screenCTM_compensation_matrix) {
                screenCTM = new DOMMatrix([
                    screenCTM.a,
                    screenCTM.b,
                    screenCTM.c,
                    screenCTM.d,
                    screenCTM.e,
                    screenCTM.f
                ])
                // screenCTM = screenCTM_new.multiply(this.paper.screenCTM_compensation_matrix);

                screenCTM = this.paper.screenCTM_compensation_matrix.multiply(screenCTM);
            }

            const matrix = screenCTM.inverse();
            const domPoint = pt.matrixTransform(matrix);
            // console.log(pt, domPoint, screenCTM, matrix);
            return domPoint;
        };

    /**
     * Converts a screen-space distance to the distance in the element's local coordinate space.
     *
     * @param {number} d Distance expressed in CSS pixels.
     * @returns {number} Equivalent SVG units for the current element.
     */
        function fromScreenDistance(d) {
            if (this.type !== 'svg' && this.type !== 'g') return this.parent().getFromScreenDistance(d);
            let pt = this.paper.node.createSVGPoint();

            pt.x = d;
            pt.y = 0;

            const matrix = this.node.getScreenCTM().inverse();
            matrix.e = 0;
            matrix.f = 0;

            pt = pt.matrixTransform(matrix);
            return (pt.y) ? Math.sqrt(pt.x * pt.x + pt.y * pt.y) : Math.abs(pt.x);
        }
    /**
     * Returns the distance in local SVG units that corresponds to a screen-space measurement.
     *
     * @function Snap.Element#getFromScreenDistance
     * @param {number} distance Distance in CSS pixels (for example, from a pointer delta).
     * @returns {number} Equivalent distance in the element's coordinate system.
     */
    Element.prototype.getFromScreenDistance = fromScreenDistance;

    /**
     * Computes the rendered width of the element, following CSS if intrinsic width is unavailable.
     *
     * @function Snap.Element#getClientWidth
     * @param {boolean} [skip_style=false] When true the computed CSS width is ignored.
     * @returns {number} Width in pixels.
     */
    Element.prototype.getClientWidth = function (skip_style) {
            if (this.node.clientWidth) return this.node.clientWidth;
            if (!skip_style) {
                let width = Snap.window().getComputedStyle(this.node).width;
                if (width.endsWith('px')) {
                    width = parseInt(width);
                } else if (width.endsWith('%')) {
                    width = parseInt(width) / 100 * this.parent().getClientWidth();
                } else if (width === 'auto' || width === 'inherit') {
                    width = this.parent().getClientWidth();
                }
                return +width;
            }
            const parent = this.parent();
            if (parent) {
                return parent.getClientWidth();
            } else {
                return 0;
            }
        }
    /**
     * Computes the rendered height of the element, falling back to CSS or parent dimensions when needed.
     *
     * @function Snap.Element#getClientHeight
     * @param {boolean} [skip_style=false] When true the computed CSS height is ignored.
     * @returns {number} Height in pixels.
     */
    Element.prototype.getClientHeight = function (skip_style) {
            if (this.node.clientHeight) return this.node.clientHeight;
            if (!skip_style) {
                let height = Snap.window().getComputedStyle(this.node).height;
                if (height.endsWith('px')) {
                    height = parseInt(height);
                } else if (height.endsWith('%')) {
                    height = parseInt(height) / 100 * this.parent().getClientHeight();
                } else if (height === 'auto' || height === 'inherit') {
                    height = this.parent().getClientHeight();
                }
                return +height;
            }
            const parent = this.parent();
            if (parent) {
                return parent.getClientHeight();
            } else {
                return 0;
            }
        }
    /**
     * Determines whether the element overlaps the provided rectangle. Groups recurse into children.
     *
     * @function Snap.Element#isInRect
     * @param {Snap.Element|DOMRect} rect Rectangle definition to test against.
     * @returns {boolean} True when the element intersects the rectangle.
     */
    Element.prototype.isInRect = function (rect) {
            // var box = rect.node.getBBox(); //get a proper SVGRect element
            if (this.type == 'g') {
                const children = this.getChildren();
                let i = 0;
                const max = children.length;
                for (; i < max; ++i) {
                    if (children[i].isInRect(rect)) return true;
                }
                return false;
            } else {
                // var node = el.paper.node;
                // var checkEnclosure = node.checkEnclosure(el.node, box);
                // var checkIntersection = node.checkIntersection(el.node, box);
                return this.isOverlapRect(rect);
            }
        };
        /**
         * Approximates the dominant direction of the element by sampling points along its outline.
         *
         * @function Snap.Element#getDirectionLine
         * @param {number} [sample=100] Number of sampling points used along the path or polygon.
         * @returns {Array<number>|null} `[angle, intercept]` pair in degrees and intercept, or `null` if undetermined.
         */
        Element.prototype.getDirectionLine = function (sample) {
            if (!root.ss) return null;
            sample = sample || 100;
            let el = this;
            let line_slope_intersect = null;
            switch (this.type) {
                case 'polygon':
                case 'polyline':
                case 'path':
                    const l = el.getTotalLength();
                    const inc = l / sample;
                    const points = [];
                    for (let i = 0, d = 0, p; i < sample; ++i, d += inc) {
                        p = el.getPointAtLength(d);
                        points.push([p.x, p.y]);
                    }

                    line_slope_intersect = ss.linearRegression(points);

                    if (isNaN(line_slope_intersect.m)
                        || Math.abs(line_slope_intersect.m) === Infinity) {
                        line_slope_intersect.m = 90;
                        break;
                    }

                    line_slope_intersect.m = Snap.deg(
                        Math.atan(line_slope_intersect.m));
                    line_slope_intersect = [
                        line_slope_intersect.m,
                        line_slope_intersect.b];
                    break;
                case 'ellipse':
                    //todo
                    break;
                case 'rect':
                //todo
                case 'g':
            }

            return line_slope_intersect;
        };        /**
         * Calculates the center of mass for the element.
         * 
         * @function Snap.Element#centerOfMass
         * @returns {{x:number,y:number}} Point representing the center of mass.
         */
        Element.prototype.centerOfMass = function () {
            const cm = this.paper.node.createSVGPoint();
            if (this.attr('center_mass_x') !== null &&
                this.attr('center_mass_y') !== null) {
                cm.x = Number(this.attr('center_mass_x'));
                cm.y = Number(this.attr('center_mass_y'));
                // return cm;
                return this.getLocalMatrix(STRICT_MODE).apply(cm);
                // return this.data("center_mass");
            }
            const bBox = this.getBBox();
            cm.x = bBox.cx;
            cm.y = bBox.cy;

            // this.attr("center_mass_x", cm.x);
            // this.attr("center_mass_y", cm.y);
            //This is temporary, it should get the center from the object attributes and apply transform to it.
            return cm;
        };

        /**
         * Gets the center point for rotation operations.
         * 
         * @function Snap.Element#centerRotation
         * @returns {{x:number,y:number}} Point around which the element should rotate.
         */
        Element.prototype.centerRotation = function () {
            //todo: fix this
            return this.centerOfMass();
        };


        let old_remove = Element.prototype.remove;

        /**
         * Removes the element from the DOM along with any associated linked resources and partners.
         * 
         * @function Snap.Element#remove
         * @param {boolean} [skip_linked=false] When true, linked resources are not automatically removed.
         * @param {boolean} [skip_reg_fun_childern] Reserved parameter for internal use.
         * @returns {Snap.Element} The removed element.
         */
        Element.prototype.remove = function (skip_linked, skip_reg_fun_childern) {
            if (!skip_linked && IA_Designer &&
                IA_Designer.class_defs.LINKED_RESOURCE) {
                let recourse_class = this.data(
                    IA_Designer.class_defs.LINKED_RESOURCE) || [];
                if (!Array.isArray(
                    recourse_class)) recourse_class = [recourse_class];

                if (this.isGroupLike()) {
                    this.selectAll('.' + IA_Designer.class_defs.HAS_LINKED_RESOURCE).forEach(
                        (el) => recourse_class.push(
                            el.data(IA_Designer.class_defs.LINKED_RESOURCE)),
                    );
                }
                if (recourse_class.length) {
                    recourse_class.forEach(
                        (class_name) => {
                            if (class_name) {
                                let linked = this.paper.selectAll('.' + recourse_class);
                                if (linked.length) {
                                    linked.forEach((el) => el.remove());
                                }
                            }
                        },
                    );
                }
            }

            if (this.paper && this.paper._partner_map) {
                let partners_of_desendents = Object.values(this.paper._partner_map).filter((el) => {
                    return this.isParentOf(el);
                });
                partners_of_desendents.forEach((el) => {
                    el.removePartner(true);
                });
            }

            this.cleanupAfterRemove();

            return old_remove.bind(this)();
        };

        /**
         * Hides the element by setting its display style to 'none'.
         * 
         * @function Snap.Element#hide
         * @returns {void}
         */
        Element.prototype.hide = function () {
            this.setStyle("display", "none");
        }

        /**
         * Shows the element by resetting its display style.
         * 
         * @function Snap.Element#show
         * @returns {void}
         */
        Element.prototype.show = function () {
            this.setStyle("display", "");
        }

        /**
         * Removes the element after fading it out over a specified duration.
         * 
         * @function Snap.Element#removeSlowly
         * @param {number} [time=500] Duration of the fade-out animation in milliseconds.
         * @returns {void}
         */
        Element.prototype.removeSlowly = function (time) {
            if (time === undefined) time = 500;
            this.animate({opacity: 0}, time, undefined, () => this.remove());
        }

        /**
         * Hides the element with a fade-out animation.
         * 
         * @function Snap.Element#hideSlowly
         * @param {number} [time=500] Duration of the fade-out animation in milliseconds.
         * @param {Function} [after] Optional callback executed after the animation completes.
         * @returns {void}
         */
        Element.prototype.hideSlowly = function (time, after) {
            if (time === undefined) time = 500;
            this.animate({opacity: 0}, time, undefined, () => {
                this.setStyle("display", "none")
                typeof after === "function" && after();
            });
        }

        /**
         * Shows the element with a fade-in animation.
         * 
         * @function Snap.Element#showSlowly
         * @param {number} [time=500] Duration of the fade-in animation in milliseconds.
         * @param {Function} [after] Optional callback executed after the animation completes.
         * @returns {void}
         */
        Element.prototype.showSlowly = function (time, after) {
            if (time === undefined) time = 500;
            let opacity = +this.attr("opacity") || 1;
            this.setStyle({"display": "", opacity: 0});
            this.animate({opacity: opacity}, time, undefined, () => {
                    typeof after === "function" && after()
                }
            );
        }

        /**
         * Flattens a group by moving all its children to the parent level and applies the group's transformation and styling to each child.
         * The group element is removed after flattening.
         * 
         * @function Snap.Element#flatten
         * @param {boolean} [process_css=false] When true, propagates the group's classes and styles to all children.
         * @returns {Snap.Element} The element (for non-groups) or undefined after removal (for groups).
         */
        Element.prototype.flatten = function (process_css) {
            if (!this.isGroupLike()) return this;
            const children = this.getChildren();
            let after_el = this;
            let trans = this.getLocalMatrix();
            let cl, style;
            if (process_css) {
                cl = this.attr("class");
                style = this.getStyle();
            }

            if (trans.isIdentity()) trans = undefined;
            for (let i = 0, l = children.length; i < l; ++i) {
                const child = children[i];
                if (trans) child.addTransform(trans);
                if (process_css) {
                    if (cl) child.addClass(cl);
                    if (style) {
                        const ch_style = child.getStyle();
                        const new_style = Object.assign(
                            Object.assign({}, style), ch_style);
                        child.setStyle(new_style)
                    }
                }
                after_el.after(child);
                after_el = child;
            }
            this.remove();
        }

        /**
         * Wraps the element in an anchor element for linking functionality.
         * 
         * @function Snap.Element#anchorEmbed
         * @param {string} href The URL or link destination.
         * @param {string} [target] Optional target attribute for the anchor (e.g., '_blank', '_self').
         * @returns {void}
         */
        Element.prototype.anchorEmbed = function (href, target) {
            let a = this.paper.a(href, target);
            this.after(a);
            a.add(this);
        };

        /**
         * Records a change to the element, using a bit code. Used to updating the state of the server
         *
         * @function Snap.Element#recordChange
         * @param {string} [exclude_attribute] (only relevant if to_leafs is true) excludes element that have a given
         * system attribute set to true. For example, to exclude protected element
         * @param {boolean} [to_leafs] weather to apply the changes only to the leafs (non-group elements) of a group.
         * @param {Function} [f] Optional callback function to execute after recording changes.
         *
         * The arguments (after above system arguments) are passed as string tokens: "transform", "points", "style", "new", "reorder", "attribute", "effect", "clip"
         */
        Element.prototype.recordChange = function (exclude_attribute, to_leafs, f) {

            // if (this.isLocal()) return;

            if (typeof to_leafs === 'boolean' && to_leafs && this.type === 'g' &&
                !(exclude_attribute && this.attr(exclude_attribute))) {
                const args = arguments;
                this.getChildren(true).forEach(function (el) {
                    el.recordChange.apply(el, args);
                });
            }

            const arg_start = (typeof to_leafs === 'boolean') ? 2 :
                (typeof exclude_attribute === 'boolean') ? 1 : 0;
            let changes = +this.attr('changes') || 0;
            for (let i = arg_start, l = arguments.length; i < l; ++i) {
                if (typeof arguments[i] === 'function') {
                    f = arguments[i];
                }
                switch (arguments[i]) {
                    case 'transform':
                        changes |= 1;
                        break;
                    case 'points':
                        changes |= 2;
                        break;
                    case 'style':
                        changes |= 4;
                        break;
                    case 'new':
                        changes |= 8;
                        break;
                    case 'reorder':
                        changes |= 16;
                        break;
                    case 'attribute':
                        changes |= 32;
                        break;
                    case 'effect':
                        changes |= 64;
                        break;
                    case 'delete':
                        changes |= 128;
                        break;
                    case 'clip':
                        changes |= 256;
                }
            }

            this.data('changes', changes || '');
            // _eve(['gui', 'change'], undefined, this);
            if (f && typeof f === 'function') f(this);
        };

        /**
         * Returns changes to the element
         * 
         * @function Snap.Element#readChanges
         * @returns {Array} of the following, in this order:
         * "delete", "new", "points", "transform", "reorder", "style", "attribute", "effect", "clip"
         */
        Element.prototype.readChanges = function () {
            let changes = [], cur_changes;
            if (cur_changes = +this.data('changes')) {
                if (cur_changes & 128) changes.push('delete');
                if (cur_changes & 8) changes.push('new');
                if (cur_changes & 2) changes.push('points');
                if (cur_changes & 1) changes.push('transform');
                if (cur_changes & 16) changes.push('reorder');
                if (cur_changes & 4) changes.push('style');
                if (cur_changes & 32) changes.push('attribute');
                if (cur_changes & 64) changes.push('effect');
                if (cur_changes & 256) changes.push('clip');

            }
            return changes;
        };

        /**
         * Marks the element as local-only, preventing it from being synced to a server.
         * 
         * @function Snap.Element#localOnly
         * @param {boolean} [reverse=false] When true, removes the local-only flag.
         * @returns {Snap.Element} The element for method chaining.
         */
        Element.prototype.localOnly = function (reverse) {
            this.attr({local: (reverse) ? '' : 1});
            return this;
        };

        /**
         * Checks whether the element or any of its ancestors are marked as local-only.
         * 
         * @function Snap.Element#isLocal
         * @param {Node} [node] Optional DOM node to check; defaults to the element's node.
         * @returns {boolean} True if the element is local-only.
         */
        Element.prototype.isLocal = function (node) {
            if (node) {
                if (node.tagName.toLowerCase() === 'svg') return false;
                return node.hasAttribute('local') ||
                    (node.parentElement && this.isLocal(node.parentElement));
            }

            return this.node.hasAttribute('local') ||
                this.isLocal(this.node.parentElement);
        };

        /**
         * Gets or sets the first point of a path, polyline, or polycurve element.
         * 
         * @function Snap.Element#pathFirstPoint
         * @param {number|Object} [x] X coordinate or point object. If omitted, returns the current first point.
         * @param {number} [y] Y coordinate (only used if x is a number).
         * @returns {Snap.Element|Object} The element for chaining when setting, or point object {x, y} when getting.
         */
        Element.prototype.pathFirstPoint = function (x, y) { //Avoid setting the first point of a poly object
            const type = this.type;

            if (type !== 'path' && type !== 'polycurve' && type !==
                'polyline') return this;
            let points, regex, isPath, m, path;
            regex = /(M?\s*(-?\d*\.?\d+)[,|\s]+(-?\d*\.?\d+))(.+)/;
            isPath = (type == 'path');
            points = (isPath) ? this.attr('path') : this.attr('points');
            if ((m = regex.exec(points)) !== null) {
                if (x == undefined && y == undefined) { // A getter method.
                    return {
                        x: Number(m[2]),
                        y: Number(m[3]),
                    };
                } else { //set the first point
                    if (typeof x == 'object') {
                        y = x.y || x[1] || undefined;
                        x = x.x || x[0] || undefined;
                    }

                    if (isPath) {
                        path = 'M ' + x + ' ' + y + ' ' + m[4];
                        this.attr('path', path);
                    } else {
                        path = x + ', ' + y + ' ' + m[4];
                        this.attr('points', path);
                    }
                }
            }
            return this;
        };

        /**
         * Converts the element to a path element while preserving all non-geometric attributes.
         * 
         * @function Snap.Element#makePath
         * @returns {Snap.Element} The converted path element or the original element if already a path or group.
         */
        Element.prototype.makePath = function () {
            if (this.isGroupLike() || this.type === 'path') return this;

            let path_str = Snap.path.toPath(this, true);

            const geom = this.getGeometryAttr(true);
            let attr_obj = {};
            geom.forEach((attr) => attr_obj[attr] = '');
            this.attr(attr_obj);
            this.attr({path: path_str});

            this.node.outerHTML = this.node.outerHTML.replace(this.type,
                'path data-temp="temp"');

            let node = document.querySelector('[data-temp="temp"]');

            this.node = node;
            this.attr('data-temp', '');

            this.type = 'path';

            return this;
        };

        /**
         * Creates a clip path and applies it to the element.
         * 
         * @function Snap.Element#createClipPath
         * @param {Snap.Element} path The path element to use for clipping.
         * @param {string} [id] Optional ID for the clip path; auto-generated if omitted.
         * @returns {Snap.Element} The created clipPath element.
         */
        Element.prototype.createClipPath = function (path, id) {
            const clipPath = this.clipPath();
            if (id) {
                clipPath.attr({id: id});
            } else {
                id = clipPath.getId();
            }
            this.before(clipPath);
            clipPath.add(path);
            this.attr('clip-path', 'url(#' + id + ')');
            return clipPath;
        };

        /**
         * Creates a mask and applies it to the element.
         * 
         * @function Snap.Element#createMask
         * @param {Snap.Element} path The path element to use for masking.
         * @param {string} [id] Optional ID for the mask; auto-generated if omitted.
         * @returns {Snap.Element} The created mask element.
         */
        Element.prototype.createMask = function (path, id) {
            const mask = this.mask();
            if (id) {
                mask.attr({id: id});
            } else {
                id = mask.getId();
            }
            this.before(mask);
            mask.add(path);
            this.attr('mask', 'url(#' + id + ')');
            return mask;
        };

        /**
         * Localizes a linked element (clipPath or mask) by updating its ID and all references.
         * 
         * @function Snap.Element#linkedElementLocalise
         * @returns {void}
         */
        Element.prototype.linkedElementLocalise = function () {
            if (this.type !== "clipPath" && this.type !== "mask") return;
            let old_id = this.getId();
            let new_id = old_id + "_" + this.paper.id;
            let attr = (this.type === "mask") ? "mask" : "clip-path";
            let url = 'url("#' + old_id + '")';
            let selector = `[${attr}*=\'${url}\'], [style*=\'${url}\']`;
            let linked = this.paper.selectAll(selector);

            linked.forEach((el) => {
                let attr_obj = {};
                attr_obj[attr] = 'url("#' + new_id + '")';
                linked.attr(attr_obj);
            })
            this.attr('id', new_id);
        }

        /**
         * Converts the element to a polyBezier representation.
         * 
         * @function Snap.Element#toPolyBezier
         * @returns {Snap.Element} A polyBezier element created from the element's bezier curves.
         */
        Element.prototype.toPolyBezier = function () {
            return Snap.polyBezier(this.toBeziers());
        };

        /**
         * Gets the first point of the element's geometry.
         * 
         * @function Snap.Element#getFirstPoint
         * @param {boolean} [use_local_transform=false] Whether to apply the element's local transformation matrix.
         * @returns {{x:number,y:number}} The first point of the element.
         */
        Element.prototype.getFirstPoint = function (use_local_transform) {
            const type = this.type;
            let point;
            if (type === 'path' || type === 'polycurve' || type === 'polyline') {
                point = _.svgPoint(this.pathFirstPoint(), this);
            } else if (this.node.attributes.hasOwnProperty('x') &&
                this.node.attributes.hasOwnProperty('y')) {
                point = _.svgPoint(Number(this.attr('x')), Number(this.attr('y')),
                    this);
            } else if (type === 'g') {
                const children = this.getChildren;
                const first = children()[0];
                let second;
                if (first.node.covpoly && children.length > 1 &&
                    (second = children[1]).type === 'polygon') {
                    point = second.getFirstPoint();
                } else {
                    point = (first).getFirstPoint();
                }

            } else {
                const bBox = this.getBBox();
                point = _.svgPoint(bBox);
            }

            if (use_local_transform) {
                point = this.getLocalMatrix(STRICT_MODE).apply(point);
            }

            return point;
        };

        /**
         * Sets the first point of the element's geometry.
         * 
         * @function Snap.Element#setFirstPoint
         * @param {number|{x:number,y:number}|number[]} x X coordinate or point object/array.
         * @param {number} [y] Y coordinate (required if x is a number).
         * @returns {Snap.Element} The element itself for chaining.
         */
        Element.prototype.setFirstPoint = function (x, y) {
            if (typeof x == 'object') {
                y = x.y || x[1] || undefined;
                x = x.x || x[0] || undefined;
            }

            if (this.type == 'path') { //If the path is not defined in relative coordinates the operation will modify the geometry
                this.pathFirstPoint(x, y);
            }

            if (this.node.attributes.hasOwnProperty('x') &&
                this.node.attributes.hasOwnProperty('y')) {
                this.attr({x: x, y: y});
            }

            if (this.node.attributes.hasOwnProperty('cx') &&
                this.node.attributes.hasOwnProperty('cy')) {
                this.attr({cx: x, cy: y});
            }

            return this;
        };

        /**
         * Gets the last point of the element's geometry.
         * 
         * @function Snap.Element#getLastPoint
         * @param {boolean} [use_local_transform=false] Whether to apply the element's local transformation matrix.
         * @returns {{x:number,y:number}} The last point of the element.
         */
        Element.prototype.getLastPoint = function (use_local_transform) {
            let points = this.getControlPoints();
            let point = points[points.length - 1];
            if (use_local_transform) {
                point = this.getLocalMatrix(STRICT_MODE).apply(point);
            }
            point = _.svgPoint(point.x || point[0], point.y || point[1]);

            return point;
        };

        /**
         * Returns a map of selected attributes for the element.
         *
         * @function Snap.Element#attrs
         * @param {string[]|Object} attributes List or map of attribute names to retrieve.
         * @param {boolean} [inverse=false] When true, returns every attribute except the supplied ones.
         * @returns {Object<string, any>} A dictionary of attribute values.
         * @example
         * const geometry = rect.attrs(['x', 'y', 'width', 'height']);
         */
        Element.prototype.attrs = function (attributes, inverse) {
            const result = {};
            const handler = (attr) => {
                const value = this.attr(attr);
                if (value !== undefined) result[attr] = value;
            };
            if (!inverse) {
                if (attributes.forEach) {
                    attributes.forEach(handler);
                } else {
                    Object.keys(attributes).forEach(handler);
                }
            }
            if (inverse) {
                Array.from(this.node.attributes).forEach(function (attr) {
                    attr = attr.nodeName;
                    if ((attributes.indexOf && attributes.indexOf(attr) === -1) || !attributes.hasOwnProperty(attr)) {
                        handler(attr);
                    }
                });
            }

            return result;
        };

        /**
         * Gets the geometry-related attributes for the element based on its type.
         * 
         * @function Snap.Element#getGeometryAttr
         * @param {boolean} [names_only=false] If true, returns only attribute names, otherwise returns values.
         * @returns {string[]|Object} Array of attribute names or object with attribute values.
         */
        Element.prototype.getGeometryAttr = function (names_only) {
            const el = this;

            let attributes;
            switch (this.type) {
                case 'rect':
                    attributes = ['x', 'y', 'width', 'height', 'rx', 'ry'];
                    return names_only ? attributes : this.attrs(attributes);
                case 'ellipse':
                    attributes = ['cx', 'cy', 'rx', 'ry'];
                    return names_only ? attributes : this.attrs(attributes);
                case 'circle':
                    attributes = ['cx', 'cy', 'r'];
                    return names_only ? attributes : this.attrs(attributes);
                case 'line':
                    attributes = ['x1', 'y1', 'x2', 'y2'];
                    return names_only ? attributes : this.attrs(attributes);
                case 'path':
                    attributes = ['d'];
                    return names_only ? attributes : this.attrs(attributes);
                case 'polygon':
                case 'polyline':
                    attributes = ['points'];
                    return names_only ? attributes : this.attrs(attributes);
                case 'image':
                case 'use':
                    attributes = ['x', 'y', 'width', 'height'];
                    return names_only ? attributes : this.attrs(attributes);
                case 'text':
                case 'tspan':
                    attributes = ['x', 'y', 'dx', 'dy'];
                    return names_only ? attributes : this.attrs(attributes);
            }
            return [];
        };

        /**
         * Collects all attributes from the underlying DOM node.
         * Style attributes are converted into key/value maps via `Snap.convertStyleFormat`.
         *
         * @function Snap.Element#getAttributes
         * @returns {Object<string, any>} Dictionary containing attribute names and values.
         */
        Element.prototype.getAttributes = function () {
            const ret = {};
            const attrMap = this.node.attributes;
            for (let i = 0, l = attrMap.length, name; i < l; ++i) {
                name = attrMap[i].name;
                ret[name] = (name !== 'style') ?
                    attrMap[i].nodeValue :
                    Snap.convertStyleFormat(attrMap[i].nodeValue);
            }

            return ret;
        };

        /**
         * Toggles pointer event transparency for the element.
         *
         * @function Snap.Element#transparentToMouse
         * @param {boolean} [remove=false] When true, restores the previous pointer-events value.
         * @param {string} [type] Optional pointer-event value to reapply when removing transparency.
         * @returns {Snap.Element} The element for chaining.
         */
        Element.prototype.transparentToMouse = function (remove = false, type) {
            if (remove) {
                this.attr('pointer-events', type || '');
            } else {
                this.attr('pointer-events', 'none');
            }
            return this;
        };

        /**
         * Checks whether the element overlaps a given rectangle.
         *
         * @function Snap.Element#isOverlapRect
         * @param {Snap.Element} rect Rectangle element used for hit-testing.
         * @returns {boolean} True when the element intersects the rectangle.
         */
        Element.prototype.isOverlapRect = function (rect) {
            return Snap.path.isPathOverlapRect(this, rect);
        };

        /**
         * Tests polygon overlap between the element and another geometry.
         *
         * @function Snap.Element#isOverlap
         * @param {number[][]|Object} el Either an array of points or an object exposing `getCHull`.
         * @returns {boolean} True when the convex hulls intersect.
         */
        Element.prototype.isOverlap = function (el) {
            let points;
            if (Array.isArray(el)) {
                points = el;
            } else if (typeof el === "object" && el.getCHull) {
                points = el.getCHull(true);
            } else {
                return false;
            }
            let cHull = this.getCHull(true);
            if (cHull && points) {
                return Snap.polygons.con_overlap(cHull, points);
            }
            return false;
        }

        //Actions
    
        // Helper function for rounding numbers
        function round(num, decimals = 0) {
            const factor = Math.pow(10, decimals);
            return Math.round(num * factor) / factor;
        }
        /**
         * Enables drag-based translation for the element.
         *
         * @function Snap.Element#move
         * @param {Object} [select] Selection context providing GUI helpers.
         * @param {Snap.Element} [el=this] Optional proxy element to move.
         * @param {Object} [mcontext] Context object passed to move callbacks.
         * @param {Object} [scontext] Context object passed to start callbacks.
         * @param {Object} [econtext] Context object passed to end callbacks.
         * @returns {Snap.Element} The element for chaining.
         */
        Element.prototype.move = function (
            select, el, mcontext, scontext, econtext) {
            if (el == undefined) {
                el = this;
            }
            let coordTarget;
            if (mcontext) {
                if (mcontext.limits) {
                    if (!scontext) scontext = {};
                    scontext.limits = mcontext.limits;
                }
                if (mcontext.coordTarget) {
                    coordTarget = mcontext.coordTarget;
                }
                if (mcontext.use_cache) {
                    econtext = econtext || {};
                    econtext.use_cache = true;
                }
            } else if (select && select.gui && select.gui.layers) {
                coordTarget = select.gui.layers.getCurrentNavLayer();
            } else {
                coordTarget = el.paper;
            }

            const mv = _.move.bind(mcontext || {});
            const smv = _.startMove.bind(scontext || {});
            const emv = _.endMove.bind(econtext || {});

            return this.drag(function (dx, dy, x, y, ev) {
                    ev.stopPropagation();
                    mv(dx, dy, x, y, el, coordTarget);
                }, function (x, y, ev) {
                    ev.stopPropagation();
                    smv(x, y, ev, el, select, coordTarget);
                }, function (ev) {
                    ev.stopPropagation();
                    emv(ev, el, select);
                }, mcontext, scontext, econtext,
            );
        };

        /**
         * Adds drag-based rotation behaviour to the element.
         *
         * @function Snap.Element#revolve
         * @param {{x:number,y:number}} [center] Rotation pivot; defaults to the element's bounding box centre.
         * @param {Snap.Element} [coordTarget] Element whose coordinate system is used for cursor tracking.
         * @param {Object} [mcontext] Context passed to rotation move callbacks.
         * @param {Object} [scontext] Context passed to rotation start callbacks.
         * @param {Object} [econtext] Context passed to rotation end callbacks.
         * @returns {Snap.Element} The element for chaining.
         */
        Element.prototype.revolve = function (
            center, coordTarget, mcontext, scontext, econtext) {

            if (center === undefined) {
                let bbox = this.getBBox();
                center = {x: bbox.cx, y: bbox.cy};
            }
            let limits,
                initial_angle = 0;
            if (mcontext) {
                if (mcontext.limits) {
                    limits = mcontext.limits;
                }
                if (mcontext.coordTarget) {
                    coordTarget = mcontext.coordTarget;
                }
                if (mcontext.initial) {
                    if (!scontext) scontext = {};
                    scontext.initial = mcontext.initial;
                }
            }
            coordTarget = coordTarget || this.paper;

            const el = this;

            const rev = _.revolve.bind(mcontext || {});
            const srev = _.startRevolve.bind(scontext || {});
            const erev = _.endRevolve.bind(econtext || {});

            return this.drag(function (dx, dy, x, y, ev) {
                    ev.stopPropagation();
                    rev(dx, dy, x, y, el, center, coordTarget);
                }, function (x, y, ev) {
                    ev.stopPropagation();
                    srev(x, y, ev, el, center, coordTarget, coordTarget);
                }, function (ev) {
                    ev.stopPropagation();
                    erev(ev, el, center, coordTarget);
                }, mcontext, scontext, econtext,
            );
        };

        /**
         * Creates a drag shadow clone for the element enabling drag-and-drop interactions.
         *
         * @function Snap.Element#makeDraggable
         * @param {Snap.Element} [drop_target] Target element queried during the drag lifecycle.
         * @param {number|Object} [animate] Animation parameters for returning the clone to its origin.
         * @param {Array|string} [end_event] Event identifier triggered after a successful drop.
         * @param {Array|string} [move_event] Event identifier emitted while dragging.
         * @param {*} [data] Arbitrary payload forwarded with drag events.
         * @param {Function} [local_eve=eve] Event emitter used to publish drag lifecycle events.
         * @param {Snap.Element} [alt_element] Alternative element used for cloning and opacity adjustments.
         * @returns {Snap.Element} The element for chaining.
         */
        Element.prototype.makeDraggable = function (drop_target, animate, end_event, move_event, data, local_eve, alt_element) {

            local_eve = local_eve || eve;

            let el = alt_element || this;
            let original_trans;
            let start_point;
            let original_opacity;

            const params = {
                localPoint: undefined,
                globalPoint: undefined,
                clone: undefined,
                data: data,
                target: drop_target
            }

            //Start
            const smv = (x, y) => {
                original_opacity = this.attr("opacity") || 1;
                params.clone = el.clone();
                params.clone.attr({opacity: original_opacity * .5})
                el.attr({opacity: original_opacity / 3});
                params.clone.repositionInGroup(params.clone.getTopSVG());
                original_trans = params.clone.getLocalMatrix(STRICT_MODE);
                start_point = params.clone.getCursorPoint(x, y, params.clone.paper)
                // console.log("start", x, y, original_trans, start_point)
                local_eve(['drag', 'make_draggable', 'start', this.id], this, drop_target);
            };

            //move
            const mv = (dx, dy, ax, ay) => {

                if (dx == null || dy == null) return;

                params.clone.translate_glob(dx, dy, original_trans);

                // console.log("run", dx, dy, ax, ay)
                params.localPoint = {x: dx, y: dy};
                params.globalPoint = {x: ax, y: ay};


                if (move_event) {
                    local_eve(move_event, this, params)
                } else {
                    local_eve(['drag', 'make_draggable', 'ongoing', this.id], this, params);
                }

            };

            //End
            const emv = () => {
                const recover = () => {
                    el.attr({opacity: original_opacity});
                    params.clone && params.clone.remove();
                }
                if (!params.localPoint) return recover();

                if (end_event) {
                    local_eve(end_event, this, params);
                } else {
                    local_eve(['drag', 'make_draggable', 'end', this.id], this, params);
                }
                // console.log("end", localPt.x, localPt.y)
                if (animate) {
                    params.clone.animateTransform(original_trans, animate, mina.easeinout, recover)
                } else {
                    params.clone.transform(original_trans);
                    recover();
                }
            };

            return this.drag((dx, dy, x, y, ev) => {
                    ev.stopPropagation();
                    mv(dx, dy, x, y, this,);
                }, function (x, y, ev) {
                    // console.log(ev.target);
                    ev.stopPropagation();
                    smv(x, y, ev);
                }, function (ev) {
                    ev.stopPropagation();
                    // console.log(ev);
                    emv();
                },
            );
        }

        //Helper Functions

        _.move = function (xxdx, xxdy, ax, ay, el, coordTarget) {
            // var tdx, tdy;
            if (coordTarget === undefined) {
                coordTarget = el.paper;
            }
            const cursorPoint = el.getCursorPoint(ax, ay, coordTarget);
            const pt = el.paper.node.createSVGPoint();

            pt.x = cursorPoint.x - el.data('op').x;
            pt.y = cursorPoint.y - el.data('op').y;

            const localPt = el.globalToLocal(pt, coordTarget),
                lim = el.data('relative_limit');

            if (lim) {
                if (lim.dim) {
                    if (lim.dim == 'x') {
                        localPt.y = 0;
                    } else if (lim.dim == 'y') {
                        localPt.x = 0;
                    }
                }

                let dist, dist_lim_min, dist_lim_max;

                if (lim.max_y != undefined) {
                    dist_lim_max = (typeof lim.max_y === "function") ?
                        lim.max_y() :
                        lim.max_y;
                    localPt.y = Math.min(localPt.y, dist_lim_max);
                }

                if (lim.min_y != undefined) {
                    dist_lim_min = (typeof lim.min_y === "function") ?
                        lim.min_y() :
                        lim.min_y;
                    localPt.y = Math.max(localPt.y, dist_lim_min);
                }

                if (lim.min_x != undefined) {
                    dist_lim_min = (typeof lim.min_x === "function") ?
                        lim.min_x() :
                        lim.min_x;
                    localPt.x = Math.max(localPt.x, dist_lim_min);
                }

                if (lim.max_x != undefined) {
                    dist_lim_max = (typeof lim.max_x === "function") ?
                        lim.max_x() :
                        lim.max_x;
                    localPt.x = Math.min(localPt.x, dist_lim_max);
                }

                // console.log("Local point: ", localPt.x, localPt.y, pt, dist_lim_min, dist_lim_max, coordTarget);
            }

            // el.transform(el.data('ot').toTransformString() + "t" + [localPt.x, localPt.y]);
            if (el.data('change_xy_attributes')) {
                const ox = el.data('ox');
                el.attr({
                    x: localPt.x + ox,
                    y: localPt.y + el.data('oy'),
                });
            } else {
                el.translate_glob(localPt.x, localPt.y, el.data('ot'));
                // el.rotate(.2*(Date.now() - el.data("t")), localPt.x + el.data('op').x, localPt.y + el.data('op').y)
            }

            eve(['drag', 'move', 'ongoing', el.id], el);
        };

        _.startMove = function (x, y, ev, el, select, coordTarget) {
            if (el.data('active')) return;
            // console.log("StartRotDrag in");
            el.data('active', true);
            el.data('s', true);
            el.data('t', Date.now());

            // el.data('ibb', el.getBBox());
            el.data('op', el.getCursorPoint(x, y, coordTarget));
            const localMatrix = el.getLocalMatrix(STRICT_MODE);
            el.data('ot', localMatrix);
            if (select) {
                eve(['drag', 'move', 'select', 'start'], el, [localMatrix]);
            } else {
                eve(['drag', 'move', 'start', el.id], el);
            }

            const limits = this.limits;
            if (limits) {
                let bbox;

                if (select) {
                    bbox = select.getBBox();
                } else {
                    bbox = el.getBBox();
                }

                const relative_limit = {};

                if (limits.min_x !== undefined) {
                    let x_offset = (limits.center) ? bbox.cx : bbox.x;
                    relative_limit.min_x = (typeof limits.min_x === 'function') ?
                        limits.min_x() - x_offset : limits.min_x - x_offset;
                }

                if (limits.max_x !== undefined) {
                    let x2_offset = (limits.center) ? bbox.cx : bbox.x2;
                    relative_limit.max_x = (typeof limits.max_x === 'function') ?
                        limits.max_x() - x2_offset : limits.max_x - x2_offset;
                }

                if (limits.min_y !== undefined) {
                    let y_offset = (limits.center) ? bbox.cy : bbox.y;
                    relative_limit.min_y = (typeof limits.min_y === 'function') ?
                        limits.min_y() - y_offset : limits.min_y - y_offset;
                }

                if (limits.max_y !== undefined) {
                    let y2_offset = (limits.center) ? bbox.cy : bbox.y2;
                    relative_limit.max_y = (typeof limits.max_y === 'function') ?
                        limits.max_y() - y2_offset : limits.max_y - y2_offset;
                }

                // console.log("Rel Limits: ", relative_limit.min_x, relative_limit.max_x);

                relative_limit.dim = limits.dim;
                relative_limit.snap_y = relative_limit.snap_y = function (val) {
                    return val;
                };
                if (limits.snap) {
                    if (Array.isArray(limits.snap)) {
                        relative_limit.snap_y = relative_limit.snap_y = function (val) {
                            return Snap.snapTo(limits.snap, val);
                        };
                    } else if (typeof limits.snap === 'object') {
                        if (Array.isArray(limits.snap.x)) {
                            relative_limit.snap_x = function (val) {
                                return Snap.snapTo(limits.snap.x, val);
                            };
                        }
                        if (Array.isArray(limits.snap.y)) {
                            relative_limit.snap_y = function (val) {
                                return Snap.snapTo(limits.snap.y, val);
                            };
                        }
                    }
                }

                el.data('relative_limit', relative_limit);
            }

            if (el.data('change_xy_attributes')) {
                el.data('ox', Number(el.attr('x')));
                el.data('oy', Number(el.attr('y')));
            }
            el.data('s', false);
        };

        _.endMove = function (ev, el, select) {
            if (el.data('active')) {
                while (el.data('s') || (Date.now() - el.data('t') < 200)) {
                }
                if (this.use_cache) el.updateBBoxCache(undefined, true);
                if (select) {
                    const cur_matrix = el.getLocalMatrix(STRICT_MODE);
                    const old_matrix = el.data('ot');
                    // el.updateBBoxCache(old_matrix.invert().multLeft(cur_matrix), true);
                    eve(['drag', 'move', 'select', 'end'], el,
                        [cur_matrix, old_matrix]);
                } else {
                    eve(['drag', 'move', 'end', el.id], el);
                }
                el.data('active', false);
            }
        };

        _.revolve = function (dx, dy, ax, ay, el, center, coordTarget) {

            const limits = this.limits;
            const newPoint = el.getCursorPoint(ax, ay, coordTarget);
            const tcr = el.data('tcr');
            let d_angle = (Snap.angle(tcr.x, tcr.y, newPoint.x, newPoint.y) -
                90) - el.data('pointer_angle');
            const abs_angle = el.data('angle');
            let abs_angle_new = (abs_angle + d_angle === 360) ?
                360 :
                (abs_angle + d_angle + 360) % 360;
            let adjusted_new = abs_angle_new;
            if (limits) {
                let dist, angle_lim_min, angle_lim_max;
                angle_lim_min = (limits.min instanceof Function) ?
                    limits.min() :
                    limits.min;
                angle_lim_max = (limits.max instanceof Function) ?
                    limits.max() :
                    limits.max;

                const barrier = angle_lim_min + 360 === angle_lim_max;
                const rel_angle = (abs_angle_new - angle_lim_min === 360) ?
                    360 :
                    (abs_angle_new - angle_lim_min + 360) % 360;

                if (abs_angle_new > angle_lim_max ||
                    (abs_angle_new < angle_lim_min && abs_angle_new + 360 >
                        angle_lim_max)) {
                    if (abs_angle_new > angle_lim_max) {
                        // console.log("lim: ", abs_angle_new, angle_lim_max);
                        abs_angle_new = (abs_angle_new - angle_lim_max < angle_lim_min -
                            (abs_angle_new - 360)) ? angle_lim_max : angle_lim_min;

                    } else {
                        abs_angle_new = (angle_lim_min - abs_angle_new > abs_angle_new +
                            360 - angle_lim_max) ? angle_lim_max : angle_lim_min;
                        // console.log("lim2: ", abs_angle_new)
                    }
                    adjusted_new = rel_angle;
                } else if (barrier) {
                    const last_rel = (el.data('last_angle')[0] - angle_lim_min ===
                        360) ?
                        360 :
                        (el.data('last_angle')[0] - angle_lim_min + 360) % 360;
                    // let diff = abs_angle_new - last;
                    // if (diff > 180) {
                    //     diff -= 360
                    // } else if (diff < -180) {
                    //     diff += 360
                    // }

                    // const decreasing = diff <= 0;
                    // console.log(rel_angle, last_rel);
                    if (rel_angle > 180 && last_rel < 10) {
                        abs_angle_new = angle_lim_min;
                        adjusted_new = 0;
                    } else if (rel_angle < 180 && last_rel > 350) {
                        abs_angle_new = angle_lim_max;
                        adjusted_new = 360;
                    } else {
                        adjusted_new = rel_angle;
                    }
                }

                d_angle = abs_angle_new - abs_angle;

            }

            el.rotate(d_angle, tcr.x, tcr.y, el.data('tot'));

            el.data('last_angle', [abs_angle_new, adjusted_new]);
            eve(['drag', 'revolve', 'ongoing', el.id], el, abs_angle_new, adjusted_new, newPoint);
        };

        _.startRevolve = function (x, y, ev, el, center, coordTarget) {

            if (el.data('active')) return;
            // console.log("StartRotDrag in");
            el.data('active', true);
            el.data('s', true);
            el.data('t', Date.now());

            el.data('tcr', center);
            const op = el.getCursorPoint(x, y, coordTarget);

            el.data('op', op);
            const localMatrix = el.getLocalMatrix(STRICT_MODE);
            el.data('tot', localMatrix);
            const initial_angle = this.initial || 0;
            const angle_measure = round(
                localMatrix.split().rotate + initial_angle, 2); //Rounding to avoid numerical instability
            el.data('angle', (angle_measure + 360) % 360);
            el.data('last_angle', [(angle_measure + 360) % 360, undefined]);
            // const el_fp = el.getFirstPoint();
            const angle = Snap.angle(center.x, center.y, op.x, op.y) - 90;
            el.data('pointer_angle', angle);

            el.data('s', false);

            eve(['drag', 'revolve', 'start', el.id], el);

        };

        _.endRevolve = function (ev, el, center) {

            if (el.data('active')) {
                while (el.data('s') || (Date.now() - el.data('t') < 200)) {
                }
                el.data('active', false);
                eve(['drag', 'revolve', 'end', el.id], el, el.data('last_angle')[0],
                    el.data('last_angle')[1]);
            }
        };

        _.svgPoint = function (x, y, node) {
            if (arguments.length === 1 && typeof x === 'object' &&
                x.hasOwnProperty('paper')) {
                node = x;
                x = undefined;
            }
            if (x === undefined && y === undefined) {
                x = y = 0;
            }
            if (typeof x == 'object') {
                y = x.y;
                x = x.x;
            }
            let pt = {};
            if (node) {
                pt = node.paper.node.createSVGPoint();
            }

            pt.x = x;
            pt.y = y;
            return pt;
        };

        // Helper function for rounding numbers
        function round(num, decimals = 0) {
            const factor = Math.pow(10, decimals);
            return Math.round(num * factor) / factor;
        }


        //copy _ to Snap._
        Object.assign(Snap._, _);


        const STRICT_MODE = true;

        /**
         * Applies scaling relative to the element's current transformation matrix.
         *
         * @function Snap.Element#scale
         * @param {number} x Scale factor along the X axis.
         * @param {number} [y=x] Scale factor along the Y axis.
         * @param {number} [cx=0] X coordinate of the scaling centre.
         * @param {number} [cy=0] Y coordinate of the scaling centre.
         * @param {Snap.Matrix|string|boolean} [prev_trans] Optional base matrix or configuration flag.
         * @param {boolean} [use_cache] When true, reuse cached bounding boxes.
         * @returns {Snap.Element} The element for chaining.
         */
        Element.prototype.scale = function (
            x, y, cx, cy, prev_trans, use_cache) {
            if (typeof prev_trans === 'boolean') {
                use_cache = prev_trans;
                prev_trans = undefined;
            }
            if (prev_trans === undefined) {
                prev_trans = this.getLocalMatrix(STRICT_MODE);
            }
            if (prev_trans === 'id' || prev_trans === true) {
                prev_trans = Snap.matrix();
            }
            //TODO processes input.

            const scale_matrix = Snap.matrix().scale(x, y, cx, cy);

            const matrix = prev_trans.clone().multLeft(scale_matrix);
            this.transform(matrix, use_cache, true);
            // if (this.data("center_mass")) this.data("center_mass", matrix.apply(this.data("center_mass")));
            return this;

        };

        /**
         * Translates the element within its local coordinate system.
         *
         * @function Snap.Element#translate
         * @param {number} x Translation along the X axis.
         * @param {number} y Translation along the Y axis.
         * @param {Snap.Matrix|string|boolean} [prev_trans] Optional base matrix or configuration flag.
         * @param {number} [cx=0] Optional X offset applied before translation.
         * @param {number} [cy=0] Optional Y offset applied before translation.
         * @param {boolean} [use_bbox_cache=false] When true, updates cached bounding boxes eagerly.
         * @returns {Snap.Element} The element for chaining.
         */
        Element.prototype.translate = function (
            x, y, prev_trans, cx, cy, use_bbox_cache) {

            if (typeof cx === 'boolean') {
                use_bbox_cache = cx;
                cx = 0;
                cy = 0;
            } else if (isNaN(cx) || isNaN(cy)) {
                cx = 0;
                cy = 0;
            }
            // if (this.data("change_xy_attributes")) {
            //     this.attr({x: Number(this.attr('x')) + (x - cx),
            //     y: Number(this.attr('y')) + (y - cy)});
            //     return this;
            // }

            if (prev_trans === undefined) {
                prev_trans = this.getLocalMatrix(STRICT_MODE);
            }
            if (prev_trans === 'id' || prev_trans === true) {
                prev_trans = Snap.matrix();
            }
            let trans_matrix;
            trans_matrix = Snap.matrix().translate(x - cx, y - cy);

            // const matrix = trans_matrix.multLeft(prev_trans);
            const matrix = prev_trans.clone().multLeft(trans_matrix);

            this.transform(matrix, use_bbox_cache, true); //The last parameter forces change of cache

            // if (this.data("center_mass")) this.data("center_mass", matrix.apply(this.data("center_mass")))
            return this;

        };

        /**
         * Animates a translation (movement) of the element over time.
         * 
         * @function Snap.Element#translateAnimate
         * @param {number|number[]} duration Animation duration in milliseconds, or [duration, easing] array.
         * @param {number} x Horizontal offset to animate to.
         * @param {number} y Vertical offset to animate to.
         * @param {Snap.Matrix|string|boolean} [prev_trans] Previous transformation matrix to build upon.
         * @param {number} [cx=0] X offset to subtract from translation.
         * @param {number} [cy=0] Y offset to subtract from translation.
         * @param {boolean} [use_bbox_cache] Whether to use bounding box cache.
         * @returns {Snap.Element} The element itself for chaining.
         */
        Element.prototype.translateAnimate = function (duration,
                                                       x, y, prev_trans, cx, cy, use_bbox_cache) {

            let easing = mina.easeinout;
            if (Array.isArray(duration)) {
                easing = duration[1];
                duration = duration[0];
            }

            if (typeof cx === 'boolean') {
                use_bbox_cache = cx;
                cx = 0;
                cy = 0;
            } else if (isNaN(cx) || isNaN(cy)) {
                cx = 0;
                cy = 0;
            }

            if (prev_trans === undefined) {
                prev_trans = this.getLocalMatrix(STRICT_MODE);
            }
            if (prev_trans === 'id' || prev_trans === true) {
                prev_trans = Snap.matrix();
            }
            let trans_matrix;
            trans_matrix = Snap.matrix().translate(x - cx, y - cy);

            // const matrix = trans_matrix.multLeft(prev_trans);
            const matrix = prev_trans.clone().multLeft(trans_matrix);

            let cache_function;
            if (use_bbox_cache) cache_function = () => this.transform(matrix, use_bbox_cache, true); //The last parameter forces change of cache

            return this.animateTransform(matrix, duration, easing, cache_function);

            // if (this.data("center_mass")) this.data("center_mass", matrix.apply(this.data("center_mass")))
            return this;

        };

        /**
         * Translates the element in global coordinates.
         * 
         * @function Snap.Element#translate_glob
         * @param {number} x Horizontal offset in global coordinates.
         * @param {number} y Vertical offset in global coordinates.
         * @param {Snap.Matrix|string|boolean} [prev_trans] Previous transformation matrix to build upon.
         * @param {number} [cx=0] X offset to subtract from translation.
         * @param {number} [cy=0] Y offset to subtract from translation.
         * @param {boolean} [use_cache] Whether to use bounding box cache.
         * @returns {Snap.Element} The element itself for chaining.
         */
        Element.prototype.translate_glob = function (
            x, y, prev_trans, cx, cy, use_cache) {

            if (typeof cx === 'boolean') {
                use_cache = cx;
                cx = 0;
                cy = 0;
            } else if (isNaN(cx) || isNaN(cy)) {
                cx = 0;
                cy = 0;
            }
            // if (this.data("change_xy_attributes")) {
            //     this.attr({x: Number(this.attr('x')) + (x - cx),
            //     y: Number(this.attr('y')) + (y - cy)});
            //     return this;
            // }

            if (prev_trans === undefined) {
                prev_trans = this.getLocalMatrix(STRICT_MODE);
            }
            if (prev_trans === 'id' || prev_trans === true) {
                prev_trans = Snap.matrix();
            }
            let trans_matrix;
            trans_matrix = Snap.matrix().translate(x - cx, y - cy);

            const matrix = trans_matrix.multLeft(prev_trans);
            // const matrix = prev_trans.clone().multLeft(trans_matrix);

            this.transform(matrix, use_cache, true);
            // if (this.data("center_mass")) this.data("center_mass", matrix.apply(this.data("center_mass")))
            return this;

        };

        /**
         * Rotates the element by the specified angle around an optional center point.
         * 
         * @function Snap.Element#rotate
         * @param {number} ang Rotation angle in degrees.
         * @param {number} [cx] X coordinate of the center point for rotation.
         * @param {number} [cy] Y coordinate of the center point for rotation.
         * @param {Snap.Matrix|string|boolean} [prev_trans] Previous transformation matrix to build upon.
         * @param {boolean} [use_cache] Whether to use bounding box cache.
         * @returns {Snap.Element} The element itself for chaining.
         */
        Element.prototype.rotate = function (
            ang, cx, cy, prev_trans, use_cache) {
            if (typeof prev_trans === 'boolean') {
                use_cache = prev_trans;
                prev_trans = undefined;
            }
            if (prev_trans === undefined) {
                prev_trans = this.getLocalMatrix(STRICT_MODE);
            }

            if (prev_trans === 'id' || prev_trans === true) {
                prev_trans = Snap.matrix();
            }
            // console.log("Mathrix 2: " + prev_trans.toString());
            const rot_matrix = Snap.matrix().rotate(ang, cx, cy);

            // const matrix = prev_trans.clone().multLeft(rot_matrix);
            const matrix = rot_matrix.add(prev_trans);

            this.transform(matrix, use_cache);
            // if (this.data("center_mass")) this.data("center_mass", matrix.apply(this.data("center_mass")))
            return this;
        };

        /**
         * Mirrors the element along the specified direction or axis.
         *
         * @function Snap.Element#reflect
         * @param {('x'|'y'|'vertical'|'horizontal'|number|Snap.Element)} direction Axis keyword, angle in degrees, or line element.
         * @param {number} [cx] X coordinate of the reflection centre.
         * @param {number} [cy] Y coordinate of the reflection centre.
         * @param {Snap.Matrix|string|boolean} [prev_trans] Optional base matrix or configuration flag.
         * @param {boolean} [use_catch=false] When true, updates cached bounding boxes.
         * @returns {Snap.Element} The element for chaining.
         */
        Element.prototype.reflect = function (
            direction, cx, cy, prev_trans, use_catch) {
            if (typeof prev_trans === 'boolean') {
                use_catch = prev_trans;
                prev_trans = undefined;
            }

            let bbox;
            if (cx == null) {
                bbox = this.getBBox();
                cx = bbox.cx;
            }
            if (cy == null) {
                bbox = bbox || this.getBBox();
                cy = bbox.cy;
            }

            if (direction === 'x' || direction === 'vertical') {
                return this.scale(1, -1, cx, cy, prev_trans, use_catch);
            }
            if (direction === 'y' || direction === 'horizontal') {
                return this.scale(-1, 1, cx, cy, prev_trans, use_catch);
            }
            if (typeof direction === 'number') { //angle
                return this.rotate(-direction, cx, cy, prev_trans, use_catch).reflect('x', cx, cy, use_catch).rotate(direction, cx, cy, use_catch);
            }
            if (typeof direction === 'object' && direction.type === 'line') {
                const line = direction;
                const x1 = Number(line.attr('x1'));
                const y1 = Number(line.attr('y1'));
                const x2 = Number(line.attr('x2'));
                const y2 = Number(line.attr('y2'));
                return this.reflect(Snap.angle(x1, y1, x2, y2), x1, x2, prev_trans,
                    use_catch);
            }
        };

        /**
         * Adds a transformation matrix to the element's existing transformation.
         * 
         * @function Snap.Element#addTransform
         * @param {Snap.Matrix} matrix Transformation matrix to add.
         * @param {Snap.Matrix} [prev_trans] Previous transformation matrix to build upon. If not provided, uses the element's current local matrix.
         * @returns {Snap.Element} The element itself for chaining.
         */
        Element.prototype.addTransform = function (matrix, prev_trans) {
            if (prev_trans === undefined) {
                prev_trans = this.getLocalMatrix(); // this.getLocalMatrix(STRICT_MODE);
            }

            matrix = prev_trans.clone().multLeft(matrix);
            this.transform(matrix);
            return this;
        };

        if (false) { //todo: finish conversion
            /**
             * Ellips ransform.
             *
             * @function Snap.Element#ellipseTransform
             * @param {*} m
             * @returns {*}
             */
            Element.prototype.ellipseTransform = function (m) {
                this.addTransform(m);
                m = this.getLocalMatrix();

                let new_center, m_noTrans, cosrot, sinrot, A, a_m_noTrans,
                    determinant, angle, V, rx, ry, coeff, Q,
                    invm,
                    temp_val;

                // Drop the translation component of the transformation.

                //It remains to figure out what the new angle and radii must be.

                let split = m.split();

                m.translate(-split.dx, -split.dy);

                angle = Snap.rad(split.rotation);

                // Check the degenerate case where the transformation colapses the ellipse to line

                cosrot = Math.cos(this.angle);
                sinrot = Math.sin(this.angle);

                rx = +this.attr('rx');
                ry = +this.attr('ry');

                A = Snap.matrix( //moves the coord-system to match the ellipse dimensions and angle.

                    rx * cosrot,  // The invere of this will map the ellipese (at origine) to the unit circle

                    ry * sinrot,
                    -ry * sinrot,
                    ry * cosrot,
                    0,
                    0,
                );
                a_m_noTrans = A.multLeft(m);

                determinant = a_m_noTrans.determinant();
                //non-invertible transformation. Collapses the ellipse to a line

                if (Math.sqrt(Math.abs(determinant)) < 1e-5) {
                    if (a_m_noTrans.a != 0) {
                        angle = Math.atan2(a_m_noTrans[2], a_m_noTrans[0]);  //angle between x-axis and (a,c)

                    } else {
                        if (a_m_noTrans.get6V(1) != 0) {
                            angle = atan2(a_m_noTrans.get6V(3), a_m_noTrans.get6V(1)); //angle between x-axis and (b,d)

                        } else {
                            angle = M_PI_2;
                        }
                    }
                    V = new Point(Math.cos(angle), Math.sin(angle));
                    a_m_noTrans.transform(V);
                    rx = V.length();
                    angle = atan2(V.y, V.x);

                    this.center = new_center;
                    this.radius_x = rx;
                    this.radius_y = 0;
                    this.setAngle(angle);
                    return this;
                }

                //Now lets do the work for the non-degenerate case.

                //Move the to implicit form: Ax^2 + Bxy + Cy^2 + Dx + Ey + F = 0

                // We only care about A, B and C because they are the non-translational coefficients.

                coeff = this.implicitFormCoefficients();

                Q = new AffineTransformation([
                    coeff[0],
                    coeff[1] / 2,
                    coeff[1] / 2,
                    coeff[2],
                    0,
                    0,
                ]);

                //Get the inverse of the transformation. The new ellipse will be such that if its points are taken back (by the inverse)

                //the will fall on the original ellipse, i.e. they will satisfy the original equation.

                invm = m_noTrans.inverse();
                //C++ code        Q = invm * Q;

                Q = AffineTransformation.composeTransformations([Q, invm]);

                //C++ code:          swap(invm[1], invm[2]);

                temp_val = invm.get6V(1);
                invm.set6V(1, invm.get6V(2));
                invm.set6V(2, temp_val);
                Q = AffineTransformation.composeTransformations([invm, Q]);
                //C++ code           Ellipse e(Q[0], 2 * Q[1], Q[3], 0, 0, -1);

                this.setFromEquation(Q.get6V(0), 2 * Q.get6V(1), Q.get6V(3), 0, 0,
                    -1);
                this.setCenter(new_center);

                return this;
            };
        }

    /**
     * Collects every non-group child within the element's subtree.
     *
     * @param {boolean} [invisible=false] Whether hidden elements should be included.
     * @param {Snap.Element[]} [_arr] Accumulator used by the recursive implementation.
     * @returns {Snap.Element[]} List of leaf elements.
     */
    Element.prototype.getLeafs = function (invisible, _arr) {
            _arr = _arr || [];
            if (this.type !== 'g') {
                _arr.push(this);
                return _arr;
            }

            this.getChildren(!invisible).forEach((ch) => ch.getLeafs(invisible, _arr));

            return _arr;
        };

    /**
     * Builds an array with the element and its ancestors (excluding the root SVG by default).
     *
     * @param {Function|boolean} [callback] Mapper invoked as `(element, index)`; providing a boolean is treated as `skip_current`.
     * @param {boolean} [skip_current=false] When `true`, start from the parent instead of the current element.
     * @param {boolean} [toCoord] Stops when a coordinate root is reached.
     * @param {boolean} [include_top_svg=false] Include the top-level SVG element in the result.
     * @returns {Array<*>} Either the element chain or the mapped output.
     */
    Element.prototype.getParentChain = function (
            callback, skip_current, toCoord, include_top_svg) {
            if (typeof callback !== 'function') {
                include_top_svg = toCoord;
                toCoord = skip_current;
                skip_current = callback;
                callback = undefined;
            }
            let parent = (skip_current && this.type !== 'svg') ?
                this.parent() :
                this;
            let i = 0;
            let ret = [];
            while (parent) {
                if (toCoord && parent.coordRoot) break;

                if (parent.type === 'svg' && !include_top_svg) break;

                if (callback) {
                    ret.push(callback(parent, i));
                } else {
                    ret.push(parent);
                }

                if (parent.type === 'svg') break;

                parent = parent.parent();
                ++i;

            }
            return ret.reverse();
        };

        /**
         * Gets the coordinate transformation matrix for the element.
         * 
         * @function Snap.Element#getCoordMatrix
         * @param {boolean} [strict] Whether to use strict mode for matrix computation.
         * @param {boolean} [full] Whether to include the element itself in the computation.
         * @returns {Snap.Matrix} The coordinate transformation matrix.
         */
        Element.prototype.getCoordMatrix = function (strict, full) {
            strict = strict || STRICT_MODE;
            let parent_matrixes = this.getParentChain(
                (el) => el.getLocalMatrix(true), !full, true);
            parent_matrixes = parent_matrixes.filter((m) => !m.isIdentity());
            return Snap.matrix().multLeft(parent_matrixes);
        };

        /**
         * Gets the real bounding box using relative coordinates.
         * 
         * @function Snap.Element#getRealBBox
         * @returns {Object} Bounding box object with x, y, width, height properties.
         */
        Element.prototype.getRealBBox = function () {
            return this.getBBoxApprox({relative_coord: true});
        };

        /**
         * Gets the exact real bounding box using relative coordinates.
         * 
         * @function Snap.Element#getRealBBoxExact
         * @returns {Object} Exact bounding box object with x, y, width, height properties.
         */
        Element.prototype.getRealBBoxExact = function () {
            return this.getBBoxExact({relative_coord: true});
        };

        /**
         * Pushes the current transformation down to descendant elements, optionally skipping specific attributes.
         *
         * @param {string} [exclude_attribute] Attribute name that, when present on an element, prevents propagation.
         * @param {Snap.Matrix} [_transform] Matrix to prepend before propagating; defaults to the element's local transform.
         * @param {boolean} [full=false] When `true`, also applies the transform to geometry attributes (paths, polygons, etc.).
         * @returns {Snap.Element} The current element.
         */
        Element.prototype.propagateTransform = function (
            exclude_attribute, _transform, full) {
            if (typeof exclude_attribute === 'boolean') {
                full = exclude_attribute;
                exclude_attribute = undefined;
            }
            if (_transform) this.addTransform(_transform);
            //The transform should not be propagated if a clip or a mask is defined.
            // Otherwise, it will not be applied correctly.
            if (this.attr('clip-path') !== 'none' || this.attr('mask') !==
                'none') {
                let cp = this.attr('clip-path'), mk = this.attr('mask');
                return;
            }
            if (exclude_attribute && this.attr(exclude_attribute)) return;
            const local_transform = this.getLocalMatrix();
            const is_identity = local_transform.isIdentity();
            if (this.isGroupLike()) {
                if (!is_identity) {
                    const units = this.data('units') ||
                        {x: {x: 1, y: 0}, y: {x: 0, y: 1}};
                    const u_x = local_transform.apply(units.x);
                    const u_y = local_transform.apply(units.y);
                    const origin = local_transform.apply(Snap.zero());

                    units.x = {x: u_x.x - origin.x, y: u_x.y - origin.y};
                    units.y = {x: u_y.x - origin.x, y: u_y.y - origin.y};
                    this.data('units', units);
                }
                if (!is_identity || full) {
                    this.getChildren(/*true*/).forEach(function (el) {
                        el.propagateTransform(exclude_attribute, local_transform, full);
                    });
                }
                this.attr('transform', '');
            } else if (full && !is_identity) {
                if (this.type === 'path') {
                    const original = this.attr('d');
                    const d = Snap.path.map(original, local_transform);
                    this.attr({'d': d, 'transform': ''});
                    // console.log("Fixing", original, d, local_transform.toString());
                } else if (this.type === 'polygone' || this.type === 'polyline') {
                    let points = this.attr('points');
                    for (let i = 0, l = points.length(); i < l; ++i) {
                        if (i % 2) {
                            points[i / 2] = [+points[i]];
                        } else {
                            points[(i - 1) / 2].push(+points[i]);
                        }
                    }
                    points.splice(Math.floor(points.length / 2));
                    points = points.map((p) => local_transform.apply(p));
                    this.attr({points: points});
                    this.transform(Snap.matrix());

                } else if (this.type === 'line') {
                    let p1 = local_transform.apply(
                            {x: +this.attr('x1'), y: +this.attr('y1')}),
                        p2 = local_transform.apply(
                            {x: +this.attr('x2'), y: +this.attr('y2')});
                    this.attr(
                        {x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, transform: ''});
                    this.transform(Snap.matrix());
                }
            }
            return this;
        };

        /**
         * Normalizes the transformation of all `foreignObject` elements within the current element.
         *
         * This function adjusts the transformation of `foreignObject` elements to ensure they are correctly
         * positioned and scaled relative to the current element. It does this by computing the appropriate
         * transformation matrices and applying them to each `foreignObject`.
         *
         * Steps:
         * 1. Check if the current element is a group-like element. If not, the function returns immediately.
         * 2. Select all `foreignObject` elements within the current element.
         * 3. Retrieve the transformation information of the current element.
         * 4. Invert the transformation matrix of the current element.
         * 5. Iterate over each `foreignObject` element and performs the following:
         *    - Retrieve the transformation information of the `foreignObject`.
         *    - Compute the transformation matrix from the current element to the `foreignObject`.
         *    - Split the transformation matrix into rotation, shear, and scale components.
         *    - Compute the new local transformation matrix for the `foreignObject`.
         *    - Applie the new transformation matrix to the `foreignObject`.
         *    - Compute and update the new attributes (`x`, `y`, `width`, `height`) of the `foreignObject`.
         *
         * @returns {void}
         */
        Element.prototype.foreignObjectNormalize = function () {
            if (!this.isGroupLike) return;
            let fos = this.selectAll('foreignObject');
            const transform_info = this.transform();
            const trans_above_inv = transform_info.diffMatrix.invert();
            fos.forEach((fo) => {

                const fo_trans_info = fo.transform();
                //matrix from this to above fo
                const above = fo_trans_info.diffMatrix.clone().multLeft(trans_above_inv);
                //matrix from this to fo
                const relative_global = fo_trans_info.totalMatrix.multLeft(trans_above_inv);
                const rot_scale_split = relative_global.rotScaleSplit();

                const loc_matrix_new = rot_scale_split.rot_shear.multLeft(above.invert());

                fo.transform(loc_matrix_new);

                //Compute new attributes
                let x = (+fo.attr("x")) || 0, y = (+fo.attr("y")) || 0;
                let w = +fo.attr("width") || 0, h = +fo.attr("height") || 0;
                const p_new = rot_scale_split.trans_scale.apply([x, y]);
                const w_new = rot_scale_split.scalex * w;
                const h_new = rot_scale_split.scaley * h;
                fo.attr({
                    x: p_new.x,
                    y: p_new.y,
                    width: w_new,
                    height: h_new
                });
                // console.log("FO:", "x:", x, y, "w:", w, h, "x_n:", p_new.x, p_new.y, "w_new:", w_new, "h_new:", h_new, loc_matrix_new.toString());
            })
        }

        /**
         * Fits the element within an external bounding box, scaling and aligning as requested.
         *
         * @function Snap.Element#fitInBox
         * @param {Snap.Element|Object|number[]} external_bBox Bounding box definition or element providing `getBBox()` data.
         * @param {boolean|string} [preserve_proportions=false] Preserve aspect ratio or align using "top", "bottom", "left", "right".
         * @param {boolean} [scale_down=false] When true, only allow shrinking (no enlargement).
         * @param {boolean} [matrix_only=false] Return the computed matrix instead of mutating the element.
         * @returns {Snap.Element|Snap.Matrix} The element (mutated) or the matrix when `matrix_only` is true.
         * @example
         * rect.fitInBox([200, 120, 100, 60], true);
         */
        Element.prototype.fitInBox = function (
            external_bBox, preserve_proportions, scale_down, matrix_only) {

            let al; //alignment
            if (typeof preserve_proportions === "string") {
                al = preserve_proportions;
                preserve_proportions = true;
            }

            if (al) {
                al = al.charAt(0).toLowerCase();
                if (!['t', 'b', 'l', 'r'].includes(al)) al = undefined;
            }

            if (external_bBox.paper) {
                // var matrix = external_bBox.getLocalMatrix();
                external_bBox = external_bBox.getBBox();
            }

            if (Array.isArray(external_bBox)) {
                external_bBox = {
                    width: external_bBox[0],
                    height: external_bBox[1],
                    cx: external_bBox[2],
                    cy: external_bBox[3]
                }
            }

            if (!external_bBox.hasOwnProperty("cx") || al) {
                external_bBox = Snap.box(external_bBox);
            }

            let m = this.getLocalMatrix();
            if (external_bBox.height && external_bBox.width) {
                let bBox = this.getBBox();

                let x_scale = external_bBox.width / bBox.width;
                let y_scale = external_bBox.height / bBox.height;

                if (preserve_proportions) {
                    x_scale = y_scale = Math.min(x_scale, y_scale);
                }

                if (scale_down) {
                    x_scale = Math.min(x_scale, 1);
                    y_scale = Math.min(y_scale, 1);
                }
                let p_x, p_y;
                switch (al) {
                    case 'l':
                        p_x = 'x';
                        p_y = 'cy';
                        break;
                    case 't':
                        p_x = 'cx';
                        p_y = 'y';
                        break;
                    case 'r':
                        p_x = 'x2';
                        p_y = 'cy';
                        break;
                    case 'b':
                        p_x = 'cx';
                        p_y = 'y2';
                        break;
                    default:
                        p_x = 'cx';
                        p_y = 'cy';
                        break;
                }

                // m.scale(x_scale, y_scale, bBox[p_x], bBox[p_y]);
                m.multLeft(Snap.matrix().translate(-bBox[p_x], -bBox[p_y]))
                    .multLeft(Snap.matrix().scale(x_scale, y_scale))
                    .multLeft(Snap.matrix().translate(bBox[p_x], bBox[p_y]));

                // const cm = m.clone();
                // this.translate( bBox.cx, bBox.cy, undefined, external_bBox.cx, external_bBox.cy);
                let px = (external_bBox[p_x] != null) ? external_bBox[p_x] : bBox[p_x];
                let py = (external_bBox[p_y] != null) ? external_bBox[p_y] : bBox[p_y];
                if (px !== bBox[p_x] || py !== bBox[p_y]) {
                    const dx = px - bBox[p_x];
                    const dy = py - bBox[p_y];
                    // m.translate(dx, dy);
                    let trasn = Snap.matrix().translate(dx, dy);
                    m.multLeft(trasn);
                    // m = trasn.multLeft(m);
                }

                // const _bbox = this.getBBox();
                // console.log(this.getId(), this, _bbox);
            }
            if (matrix_only) return m.clone();
            // this.attr("transform", m);
            this.transform(m);
            return this;
        };

    /**
     * Scales the element so it completely covers the supplied bounding box.
     *
     * @param {Snap.Element|{width:number,height:number,cx:number,cy:number}} external_bBox Bounding box or element supplying `getBBox()` data.
     * @param {boolean} [scale_up=false] When `true`, avoids shrinking elements that are already larger than the box.
     * @returns {Snap.Element} The transformed element.
     */
    Element.prototype.fillInBox = function (external_bBox, scale_up) {
            if (external_bBox.paper) {
                // var matrix = external_bBox.getLocalMatrix();
                external_bBox = external_bBox.getBBox();
            }

            if (external_bBox.height && external_bBox.width) {
                let bBox = this.getBBox();

                let x_scale = external_bBox.width / bBox.width;
                let y_scale = external_bBox.height / bBox.height;

                x_scale = y_scale = Math.max(x_scale, y_scale);

                if (scale_up) {
                    x_scale = Math.max(x_scale, 1);
                    y_scale = Math.max(y_scale, 1);
                }

                this.scale(x_scale, y_scale, bBox.cx, bBox.cy);
                // this.translate( bBox.cx, bBox.cy, undefined, external_bBox.cx, external_bBox.cy);
                this.translate((external_bBox.cx - bBox.cx),
                    (external_bBox.cy - bBox.cy));
            }
        };

        /**
         * Emulates filling an element with an image by creating a surrogate group and clipping the image to the shape.
         *
         * @param {Snap.Element|string} image Image element or its id. Each image instance can serve a single fill unless cloned.
         * @param {boolean} [fit_element=false] When `true`, scales the image to fit the element's bounding box.
         * @param {boolean} [preserve_proportons=false] Controls whether aspect ratio is preserved when fitting.
         * @returns {Snap.Element} The surrogate group wrapping the filled element.
         */
        Element.prototype.fillImage = function (
            image, fit_element, preserve_proportons) {
            if (this.type === 'g') return this;

            //process image
            if (typeof image === 'string') {
                let topSVG = this.getTopSVG();
                const temp_im = topSVG.select('#' + image);
                if (!temp_im) return this;

                image = temp_im;
            }

            //create surrogate

            let id = this.getId();
            const group_placement = this.paper.g().attr({
                id: id,
                target_id: '_' + id,
                surrogate: 1,
                transform: this.getLocalMatrix(),
            });
            this.attr({id: '_' + id, transform: '', fill: 'none'});
            this.after(group_placement);

            const clip = this.paper.clipPath().attr({id: id + '_clip'});
            clip.add(this.clone());

            group_placement.add(clip);

            const clip_group = group_placement.g();
            clip_group.add(image);

            clip_group.attr({clipPath: 'url(#' + clip.getId() + ')'});

            if (fit_element) {
                if (preserve_proportons) {
                    image.fillInBox(this.getBBox(true));
                } else {
                    mage.fitInBox(this.getBBox(true));
                }

            }

            group_placement.add(this);
            return group_placement;

        };

        Element.prototype.isClockwise = function (other_points) {
            const points = other_points || this.getControlPoints();
            let sum = 0, nx, ny, px, py;
            for (let i = 0, l = points.length, p, n; i < l; ++i) {
                p = points[i];
                n = points[(i + 1) % l];
                nx = n[0] || n.x || 0;
                ny = n[1] || n.y || 0;
                px = p[0] || p.x || 0;
                py = p[1] || p.y || 0;
                sum += (nx - px) * (ny + py);
            }
            return sum >= 0;
        };

        Element.prototype.distanceTo = function (x, y) {
            if (typeof x === 'object' && x.x !== undefined && x.y !== undefined) {
                y = x.y;
                x = x.x;
            }

            switch (this.type) {
                case 'line':
                    const x1 = this.attr('x1');
                    const y1 = this.attr('y1');
                    const x2 = this.attr('x2');
                    const y2 = this.attr('y2');

                    if ((x1 - x1) === 0 && (y1 - y2) === 0) {
                        return Snap.len(x, y, x1, y1);
                    }

                    let angle = Math.abs(Snap.angle(x, y, x1, y1, x2, y2));
                    angle = (angle < 180) ? angle : (360 - angle);
                    if (angle > 90) {
                        return Snap.len(x, y, x1, y1);
                    }

                    angle = Math.abs(Snap.angle(x, y, x2, y2, x1, y1));
                    angle = (angle < 180) ? angle : (360 - angle);
                    if (angle > 90) {
                        return Snap.len(x, y, x2, y2);
                    }

                    const num = Math.abs(
                        (y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1);
                    const denum = Math.sqrt(
                        Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

                    return num / denum;

                //TODO: other cases
            }

            return null;

        };

        const style_reforamt = function (style, val) {
            switch (style) {
                case 'opacity':
                    val = String(val);
                    if (val.charAt(val.length - 1) === '%') {
                        val = Number(val.substring(0, val.length - 1)) / 100;
                    }
                    break;
            }
            return val;
        };

    /**
     * Applies CSS styles to the element, accepting either a declaration string or an object map.
     *
     * @param {string|Object} style CSS text or a property map. When a property name is provided, `value` supplies the value.
     * @param {string} [value] Value used when `style` is a single property name.
     * @returns {Snap.Element} The element with updated style.
     */
    Element.prototype.setStyle = function (style, value) {
            if (!style) return this;
            let that = this; //we may need change the object to a surrogate;
            if (typeof style === 'string') {
                const isStyleAttribute = style.indexOf(':') === -1;
                if (isStyleAttribute) {
                    const obj = {};
                    obj[style] = value;
                    style = obj;
                }

                if (!isStyleAttribute) {
                    style = Snap.convertStyleFormat(style);
                }
            }

            if (typeof style === 'object') {
                for (let style_name in style) {
                    if (style.hasOwnProperty(style_name)) {
                        if (style_name === 'imageFill') {
                            if (typeof style[style_name] === 'string') {
                                that = that.fillImage(style[style_name], true, true);
                            } else {
                                const im_id = style[style_name]['id'];
                                const fit = style[style_name]['fit'];
                                const aspect = style[style_name]['preserveAspectRatio'];
                                that = that.fillImage(im_id, fit, aspect);
                            }
                            continue;
                        }
                        // if (style[style_name] === "" || style[style_name] === undefined) {
                        //     delete that.node.style[style];
                        // } else
                        {
                            if (style_name === 'class') {
                                const class_name = style[style_name];
                                if (/-?[_a-zA-Z]+[_a-zA-Z0-9-]*/gm.test(class_name)) {
                                    //is string is passed that does not generate a style, we assume that this is a class name instead
                                    this.addClass(class_name);
                                }
                            } else {
                                const stl = style_reforamt(style_name, style[style_name]) ||
                                    '';
                                that.node.style[style_name] = stl;

                            }
                        }

                    }
                }
                if (that.hasPartner()) that.setPartnerStyle(style);
            }

            return that;
        };

    /**
     * Retrieves the element's style declarations as an object map or a subset of properties.
     *
     * @param {string[]|Object} [properties] Optional list (or object keys) specifying which properties to read from computed styles.
     * @returns {Object<string,string>} Map of style property names to values.
     */
    Element.prototype.getStyle = function (properties) {
            /*Explicit list of properties we get from computed style*/
            if (properties) {
                if (typeof properties === 'object' && !Array.isArray(properties)) {
                    properties = Object.keys(properties);
                }
                let ret = {};
                const node = this.node;
                const comp_style = root.getComputedStyle(node);
                for (let i = 0, style, val; i < properties.length; ++i) {
                    style = properties[i];
                    val = comp_style[style];
                    if (val !== undefined) {
                        ret[style] = val;
                    }
                }
                return ret;
            }

            let style = this.attr('style');
            let ret = {};

            if (style) {
                style = style.split(';');
                style.forEach((st) => {
                    if (st) {
                        let pair = st.split(':', 2);
                        ret[[pair[0].trim()]] = (pair[1]) ? pair[1].trim() : '';
                    }
                });
            }

            return ret;
        };

        const styles = {
            'alignment-baseline': true,
            'baseline-shift': true,
            'clip-path': true,
            'clip-rule': true,
            'color': true,
            'color-interpolation': true,
            'color-interpolation-filters': true,
            'color-rendering': true,
            'cursor': true,
            'direction': true,
            'display': true,
            'dominant-baseline': true,
            'fill': true,
            'fill-opacity': true,
            'fill-rule': true,
            'filter': true,
            'flood-color': true,
            'flood-opacity': true,
            'font-family': true,
            'font-size': true,
            'font-size-adjust': true,
            'font-stretch': true,
            'font-style': true,
            'font-variant': true,
            'font-weight': true,
            'glyph-orientation-horizontal': true,
            'glyph-orientation-vertical': true,
            'image-rendering': true,
            'letter-spacing': true,
            'lighting-color': true,
            'marker-end': true,
            'marker-mid': true,
            'marker-start': true,
            'mask': true,
            'opacity': true,
            'overflow': true,
            'paint-order': true,
            'pointer-events': true,
            'shape-rendering': true,
            'stop-color': true,
            'stop-opacity': true,
            'stroke': true,
            'stroke-dasharray': true,
            'stroke-dashoffset': true,
            'stroke-linecap': true,
            'stroke-linejoin': true,
            'stroke-miterlimit': true,
            'stroke-opacity': true,
            'stroke-width': true,
            'text-anchor': true,
            'text-decoration': true,
            'text-rendering': true,
            'unicode-bidi': true,
            'vector-effect': true,
            'visibility': true,
            'word-spacing': true,
            'writing-mode': true,
        };
    /**
     * Converts style-related attributes into inline CSS declarations stored in the `style` attribute.
     *
     * @param {boolean|Function} [recursive=false] When `true`, processes descendants; if a function is passed it is treated as `f`.
     * @param {Function} [f] Optional callback triggered when a style change is recorded.
     * @returns {Snap.Element} The current element.
     */
    Element.prototype.moveAttrToStyle = function (recursive, f) {
            if (typeof recursive === 'function') {
                f = recursive;
                recursive = false;
            }
            const attrs = this.getAttributes();
            let found = false;
            for (let attr in attrs) if (attrs.hasOwnProperty(attr)) {
                if (styles[attr]) {
                    found = true;
                    if (!attrs.style) {
                        attrs.style = {};
                    }
                    attrs.style[attr] = attrs[attr];

                    attrs[attr] = '';
                }
            }
            if (found) {
                const style = attrs.style;
                delete attrs.style;
                this.attr(attrs);
                this.setStyle(style);
                // const st = this.attr('style');
                this.recordChange('style', 'attributes', f);
            }

            if (recursive && this.isGroupLike()) {
                this.getChildren().forEach((ch) => ch.moveAttrToStyle(recursive));
            }

            return this;
        };

    /**
     * Copies computed styles from another element onto this element for display purposes.
     *
     * @param {Snap.Element} source Element whose computed style should be cloned.
     * @returns {Snap.Element} The current element.
     */
    Element.prototype.copyComStyle = function (source) {
            const styles = root.getComputedStyle(source.node);
            if (styles.cssText !== '') {
                this.node.style.cssText = styles.cssText;
            } else {
                const cssText = Array.from(styles).reduce(
                    (css, propertyName) =>
                        `${css}${propertyName}:${styles.getPropertyValue(
                            propertyName,
                        )};`,
                );

                this.node.style.cssText = cssText;
            }
            return this;
        };

        /**
         * Checks if this element is positioned above another element in the DOM.
         * 
         * @function Snap.Element#isAbove
         * @param {Snap.Element} el Element to compare against.
         * @returns {boolean} True if this element is above the other element.
         */
        Element.prototype.isAbove = function (el) {
            return Snap.positionComparator(this, el) > 0;
        };

        /**
         * Checks if this element is positioned below another element in the DOM.
         * 
         * @function Snap.Element#isBelow
         * @param {Snap.Element} el Element to compare against.
         * @returns {boolean} True if this element is below the other element.
         */
        Element.prototype.isBelow = function (el) {
            return Snap.positionComparator(el, this) > 0;
        };

        /**
         * Checks if this element is a parent of another element.
         * 
         * @function Snap.Element#isParentOf
         * @param {Snap.Element} el Element to check.
         * @returns {boolean} True if this element is a parent of the given element.
         */
        Element.prototype.isParentOf = function (el) {
            return !!(Snap._compareDomPosition(this, el) & 16);
        };

        /**
         * Checks if this element is a child of another element.
         * 
         * @function Snap.Element#isChildOf
         * @param {Snap.Element} el Element to check.
         * @returns {boolean} True if this element is a child of the given element.
         */
        Element.prototype.isChildOf = function (el) {
            return !!(Snap._compareDomPosition(this, el) & 8);
        };

        /**
         * Finds a parent element that matches the given CSS selector or function.
         * 
         * @function Snap.Element#selectParent
         * @param {string|Function} css_select CSS selector string or predicate function.
         * @param {boolean} [outside_svg=false] Whether to search outside the SVG element.
         * @returns {Snap.Element|null} Matching parent element or null if none found.
         */
        Element.prototype.selectParent = function (css_select, outside_svg) {
            if ((!outside_svg && this.type === 'svg') || this.node === Snap.window().document) return null;

            if (typeof css_select === 'function') {
                if (css_select(this)) return this;
            } else {
                if (this.node.matches(css_select)) return this;
            }

            return this.parent().selectParent(css_select, outside_svg);
        };

        /**
         * Finds the closest ancestor (including self) that matches the given CSS selector.
         * 
         * @function Snap.Element#closest
         * @param {string} css_select CSS selector string.
         * @param {boolean} [outside_svg=false] Whether to search outside the SVG element.
         * @returns {Snap.Element|null} Matching element or null if none found.
         */
        Element.prototype.closest = function (css_select, outside_svg) {
            if (this.node.matches(css_select)) return this;

            return this.selectParent(css_select, outside_svg);
        }

        /**
         * Gets the bounding box of the element after rotating it by a specified angle.
         * 
         * @function Snap.Element#getBBoxRot
         * @param {number} angle Rotation angle in degrees.
         * @param {number|{x:number,y:number}|boolean} [cx] X coordinate of rotation center, or point object, or boolean for aprox parameter.
         * @param {number} [cy] Y coordinate of rotation center.
         * @param {boolean} [aprox=false] Whether to use approximate bounding box calculation.
         * @param {Object} [settings] Additional settings for bounding box calculation.
         * @returns {Object} Bounding box after rotation with x, y, width, height properties.
         */
        Element.prototype.getBBoxRot = function (angle, cx, cy, aprox, settings) {
            if (typeof cx === 'boolean') {
                aprox = cx;
                cx = undefined;
                settings = cy;
                cy = undefined;
            }
            angle = (angle + 360) % 180;
            if (angle < 1e-5) return (aprox) ?
                this.getBBoxApprox() :
                this.getBBoxExact();

            let bbox;
            if (cx == undefined) {
                bbox = this.getBBox();
                cx = bbox.cx;
                cy = bbox.cy;
            }
            if (typeof cx === 'object' && cx.x != undefined && cx.y !=
                undefined) {
                cy = cx.y;
                cx = cx.y;
            }

            const old_transform = this.getLocalMatrix(STRICT_MODE);
            this.rotate(-angle, cx, cy);
            bbox = (aprox) ? this.getBBoxApprox() : this.getBBoxExact();
            this.attr({transform: old_transform});

            return bbox;
        };

//             Element.prototype.animateTransform_old = function (
//                 matrix, duration, easing, after_callback, easing_direct_matrix,
//                 procesor) {
//
//                 if (typeof after_callback === 'boolean') {
//                     procesor = easing_direct_matrix;
//                     easing_direct_matrix = after_callback;
//                     after_callback = undefined;
//                 }
//
//                 const dom_partner = this._dom_partner;
//                 const element_partner = this._element_partner;
//
//                 if (easing_direct_matrix) {
//                     console.log(easing_direct_matrix);
//                 }
//
//                 easing_direct_matrix = easing && easing_direct_matrix;
//
//                 // const fps = (IA_Designer && IA_Designer.is_safari) ? 24 : 30; //12
//                 // const ts = 1000 / fps; //time step;
//                 const loc = this.getLocalMatrix(true);
//                 const dif = {
//                     a: matrix.a - loc.a,
//                     b: matrix.b - loc.b,
//                     c: matrix.c - loc.c,
//                     d: matrix.d - loc.d,
//                     e: matrix.e - loc.e,
//                     f: matrix.f - loc.f,
//                 };
//
//                 if (easing_direct_matrix) {
//                     easing = easing(loc, matrix);
//                 }
//
//                 if (!duration) {
//                     console.log('Zero duration');
//                 }
//
//                 // const steps = Math.ceil(duration / ts) || 1;
//
//                 // let cur = 0;
//                 const that = this;
//                 let init_time;
//                 // let id = this.getId();
//
//                 let stop = false
//                 const handler = function (time) {
//
//                     if (stop) return;
//
//                     if (init_time === undefined) init_time = time;
//
//                     let t = time - init_time;
//
//                     let done = false;
//                     if (t >= duration - 30) {
//                         t = duration || 1;
//                         done = true;
//                     }
//
//                     t /= (duration || 1);
//
//                     let step_matrix;
//
//                     if (!done) {
//                         if (easing_direct_matrix) {
//                             step_matrix = easing(t).toString();
//                             // console.log(id, done, t, step_matrix);
//                         } else {
//                             if (easing) t = easing(t, loc, matrix);
//                             step_matrix = 'matrix('
//                                 + (loc.a + dif.a * t) + ','
//                                 + (loc.b + dif.b * t) + ','
//                                 + (loc.c + dif.c * t) + ','
//                                 + (loc.d + dif.d * t) + ','
//                                 + (loc.e + dif.e * t) + ','
//                                 + (loc.f + dif.f * t) + ')';
//                             // console.log(id, done, t, step_matrix);
//                         }
//                     } else {
//                         step_matrix = matrix.toString();
//                         // console.log(id, done, t, step_matrix);
//                     }
//
//                     if (isNaN(loc.a + dif.a * t)) {
//                         // console.log("problem", loc, dif, t);
//                     }
//
//                     if (procesor) {
//                         let processed_matrix = procesor(step_matrix);
//                         if (processed_matrix) {
//                             step_matrix = processed_matrix;
//                         }
//                     }
//
//                     if (done) {
//                         that.transform(matrix)
//                     } else {
//                         // that.node.setAttribute('transform', step_matrix);
//                         that.transform(step_matrix)
//                         // console.log(step_matrix);
//                         that.saveMatrix(undefined);
//                     }
//                     // console.log("anim", count, t, time, call_number, that.getId(), that.node);
//
//                     if (dom_partner) dom_partner.forEach(
//                         (dom) => dom.css('transform', step_matrix));
//                     if (element_partner) element_partner.forEach((el) => {
//                         // el.node.setAttribute("transform", step_matrix);
//                         // el.node.style.transform = step_matrix;
//                         if (done) {
//                             that.transform(matrix)
//                         } else {
//                             // if (el.node instanceof SVGElement) {
//                             if (Snap.is(el.node, "SVGElement")) {
//                                 // el.node.setAttribute('transform', step_matrix);
//                                 el.transform(step_matrix)
//                             } else {
//                                 el.node.style['transform'] = step_matrix;
//                                 // el.transform(step_matrix)
//                             }
//                             that.saveMatrix(undefined);
//                         }
//                     });
//
//                     if (done) {
//                         if (after_callback && typeof after_callback === 'function') {
//                             after_callback(that);
//                         }
//                     } else {
//                         requestAnimationFrame(handler);
//                     }
//
// // console.log(new_time - time, ts);
// // time = new_time;
//                 };
//                 // handler();
//                 //
//                 // let timer = setInterval(handler, ts);
//
//                 requestAnimationFrame(handler);
//
//                 // this.data("on_move", timer);
//
//                 return {
//                     stop: () => {
//                         stop = true;
//                     },
//                     pause: () => {
//                         stop = performance.now();
//                     },
//                     resume: () => {
//                         if (typeof stop === 'number') {
//                             init_time += performance.now() - stop;
//                             requestAnimationFrame(handler);
//                         }
//                     }
//                 }
//             };

        /**
         * Animates a transformation matrix change over time.
         * 
         * @function Snap.Element#animateTransform
         * @param {Snap.Matrix} matrix Target transformation matrix to animate to.
         * @param {number} duration Animation duration in milliseconds.
         * @param {Function} [easing] Easing function for the animation.
         * @param {Function} [after_callback] Function to call when animation completes.
         * @param {boolean} [easing_direct_matrix=false] Whether easing function works directly on matrices.
         * @param {Function} [processor] Optional function to process the transformation matrix during animation.
         * @returns {Object} Animation control object with stop, pause, and resume methods.
         */
        Element.prototype.animateTransform = function (
            matrix, duration, easing, after_callback, easing_direct_matrix, processor) {


            if (typeof after_callback === 'boolean') {
                processor = easing_direct_matrix;
                easing_direct_matrix = after_callback;
                after_callback = undefined;
            }

            const dom_partner = this._dom_partner;
            const element_partner = this._element_partner;

            const loc = this.getLocalMatrix(true);
            const dif = {
                a: matrix.a - loc.a,
                b: matrix.b - loc.b,
                c: matrix.c - loc.c,
                d: matrix.d - loc.d,
                e: matrix.e - loc.e,
                f: matrix.f - loc.f,
            };

            if (easing_direct_matrix) {
                easing = easing(loc, matrix);
            }

            if (!duration) {
                console.log('Zero duration');
            }

            const el = this;
            const start = mina.time();
            const end = start + duration;

            const set = function (res) {
                let step_matrix;
                let t = res[0];
                const done = t >= .99999;
                if (!done) {
                    if (easing_direct_matrix) {
                        step_matrix = easing(t).toString();
                    } else {
                        step_matrix = 'matrix('
                            + (loc.a + dif.a * t) + ','
                            + (loc.b + dif.b * t) + ','
                            + (loc.c + dif.c * t) + ','
                            + (loc.d + dif.d * t) + ','
                            + (loc.e + dif.e * t) + ','
                            + (loc.f + dif.f * t) + ')';
                    }
                } else {
                    step_matrix = matrix.toString();
                }

                if (processor) {
                    let processed_matrix = processor(step_matrix);
                    if (processed_matrix) {
                        step_matrix = processed_matrix;
                    }
                }

                if (!done) {
                    el.transform(step_matrix);
                    el.saveMatrix(undefined);
                } else {
                    el.transform(matrix)
                }

                if (dom_partner) dom_partner.forEach(
                    (dom) => dom.css('transform', step_matrix));
                if (element_partner) element_partner.forEach((el) => {
                    // el.node.setAttribute("transform", step_matrix);
                    // el.node.style.transform = step_matrix;
                    if (done) {
                        el.transform(matrix)
                    } else {
                        // if (el.node instanceof SVGElement) {
                        if (Snap.is(el.node, "SVGElement")) {
                            // el.node.setAttribute('transform', step_matrix);
                            el.transform(step_matrix)
                        } else {
                            el.node.style['transform'] = step_matrix;
                            // el.transform(step_matrix)
                        }
                        el.saveMatrix(undefined);
                    }
                });

                if (done) {
                    // if (after_callback && typeof after_callback === 'function') {
                    //     after_callback(el);
                    // }
                }
            };

            const anim = mina(
                [0],
                [1],
                start,
                end,
                mina.time,
                set,
                (easing_direct_matrix) ? mina.linear : (easing || mina.linear)
            );

            el.anims[anim.id] = anim;
            // anim._attrs = attrs;
            anim._callback = after_callback;
            eve.once("snap.mina.finish." + anim.id, function () {
                eve.off("snap.mina.*." + anim.id);
                delete el.anims[anim.id];
                after_callback && (typeof after_callback === 'function') && after_callback.call(el);
            });
            eve.once("snap.mina.stop." + anim.id, function () {
                eve.off("snap.mina.*." + anim.id);
                delete el.anims[anim.id];
            });
            eve(["snap", "animcreated", el.id], anim);

            return anim;
        };

        function val_generator(path, default_val) {
            let length, factor = 1, as_function = false;
            if (Array.isArray(path)) {
                factor = path[1] || 1;
                as_function = path[2] || false;
                path = path[0];
            }

            if (as_function) {
                const scp0 = path.getFirstPoint();
                const scp1 = path.getLastPoint();
                length = Math.abs(scp1.x - scp0.x);
                path = path.toPolyBezier();
            } else {
                length = (path.getTotalLength) ?
                    path.getTotalLength() :
                    path.length();
            }

            let fun = function (t) {
                let val = default_val;
                if (as_function) {
                    const p0 = path.getFirstPoint();
                    let x = p0.x + t * length;
                    const interset = path.lineIntersects(
                        [{x: x, y: -100000}, {x: x, y: 100000}]);
                    if (interset.length) {
                        let int_p = interset[0].curve.compute(interset[0].t);
                        val = factor * int_p.y;
                    } else {
                        // if there if no intersect, nudge x a bit.
                        let x_eps = (t === 0) ? x + 1e-5 : x - 1e-5;
                        const interset = path.lineIntersects(
                            [{x: x_eps, y: -100000}, {x: x_eps, y: 100000}]);
                        if (interset.length) {
                            let int_p = interset[0].curve.compute(interset[0].t);
                            val = factor * int_p.y;
                        }
                    }
                } else {
                    let p = path.getPointAtLength(length * t);
                    val = factor * p.y;
                }
                return val;
            };

            return fun;
        }

        let _animateOnPath = function (el, absolute, path, duration,
                                       scale_path,
                                       rot_path,
                                       easing, after_callback, during_callback) {
            if (typeof scale_path === 'function') {
                after_callback = easing;
                easing = scale_path;
                scale_path = undefined;
            }
            if (easing == null) {
                easing = mina.linear;
            }
            let init_time;
            // let id = el.getId();
            const p_length = (path.getTotalLength) ? path.getTotalLength() :
                path.length();
            const p0 = path.getFirstPoint(true);
            let p_last;

            let scale_fun, rot_fun;

            const bbox = el.getBBox();
            const initial_matrix = el.getLocalMatrix();

            // console.log("Start", el.getId(), bbox, el.getBBox());

            if (scale_path) {
                if (absolute) {
                    const split = initial_matrix.split();

                    initial_matrix.multLeft(Snap.matrix().scale(1 / split.scalex, 1 / split.scaley, bbox.cx, bbox.cy));
                }
                scale_fun = (typeof scale_path === 'function') ?
                    scale_path :
                    val_generator(scale_path, 1);
            }

            // console.log("Start", el.getId(), initial_matrix);

            if (rot_path) {
                if (absolute) {
                    const split = initial_matrix.split();

                    initial_matrix.multLeft(
                        Snap.matrix().rotate(-split.rotate, bbox.cx, bbox.cy));
                }
                if (rot_path === true || !isNaN(rot_path)) {
                    const angle_inc = (rot_path === true) ? 0 : rot_path;
                    rot_fun = function (t, p, length) {
                        if (p && Snap.is(p, 'Element')) {
                            p = p.getPointAtLength(t * length);
                        }
                        if (p && p.hasOwnProperty('alpha')) {
                            return p.alpha + 180 + angle_inc;
                        }
                        if (p && Snap.is(p, 'PolyBezier')) {

                        }

                    };
                } else {
                    rot_fun = (typeof rot_path === 'function') ?
                        rot_path :
                        val_generator(rot_path, 0);
                }
            }

            if (absolute) initial_matrix.multLeft(
                Snap.matrix().translate(p0.x - bbox.cx, p0.y - bbox.cy));

            // console.log("Start_m", el.getId(), initial_matrix.a, initial_matrix.e);

            const center = (absolute) ? p0 : el.getBBox().center();

            const dom_partner = el._dom_partner;
            const element_partner = el._element_partner;

            const set = function (res) {
                // console.log("anim", cur);

                let t = res[0];

                let done = t >= .99999;

                t = easing(t);
                let extra = 0;
                if (t > 1) {
                    extra = 1;
                    t = 2 - t;// 1 - (t - 1)
                } else if (t < 0) {
                    extra = -1;
                    t = -t;
                }

                let pt = path.getPointAtLength(p_length * t);

                if (extra > 0) {
                    p_last = p_last || path.getLastPoint(true);
                    pt = {
                        x: 2 * p_last.x - pt.x,
                        y: 2 * p_last.y - pt.y,
                        alpha: pt.alpha,
                    };
                }

                if (extra < 0) {
                    pt = {
                        x: 2 * p0.x - pt.x,
                        y: 2 * p0.y - pt.y,
                        alpha: pt.alpha,
                    };
                }

                let transl = Snap.matrix().translate(pt.x - p0.x, pt.y - p0.y);

                // console.log(el.getId(), pt.x, t, transl.e);

                let scale;
                if (scale_fun) {
                    scale = scale_fun(t);

                    if (scale !== 1) {
                        const new_c = transl.apply(center);
                        const trans_scl = Snap.matrix().scale(scale, scale, new_c.x, new_c.y);

                        transl.multLeft(trans_scl);
                    }
                    // console.log(el.getId() + "t_s", transl.a, transl.e, scale);
                }


                let angle;
                if (rot_fun) {
                    angle = rot_fun(t, pt);
                    const new_c = transl.apply(center);
                    if (angle !== 0) {
                        const trans_rot = Snap.matrix().rotate(angle, new_c.x, new_c.y);

                        transl.multLeft(trans_rot);
                    }
                }

                const step_matrix = initial_matrix.clone().multLeft(transl);

                // console.log(el.getId() + "m", step_matrix.a, step_matrix.e,
                //     initial_matrix, initial_matrix.clone().multLeft(transl))

                if (done) {
                    el.transform(step_matrix)
                } else {
                    // el.node.setAttribute('transform', step_matrix);
                    el.transform(step_matrix)
                    el.saveMatrix(undefined);
                }

                if (dom_partner) dom_partner.forEach(
                    (dom) => dom.css('transform', step_matrix));
                if (element_partner) element_partner.forEach((el) => {
                    if (done) {
                        el.transform(step_matrix)
                    } else {
                        // el.node.setAttribute('transform', step_matrix);
                        el.transform(step_matrix)
                        el.saveMatrix(undefined);
                    }
                });

                during_callback && during_callback(t, el, scale, angle);

                // if (done) {
                // if (after_callback && typeof after_callback === 'function') {
                //     after_callback(el);
                // }
                // }

            };

            const start = mina.time();
            const end = start + duration;
            const anim = mina([0], [1], start, end, mina.time, set)

            el.anims[anim.id] = anim;
            // anim._attrs = attrs;
            anim._callback = after_callback;
            eve.once("snap.mina.finish." + anim.id, function () {
                eve.off("snap.mina.*." + anim.id);
                delete el.anims[anim.id];
                after_callback && (typeof after_callback === 'function') && after_callback.call(el);
            });
            eve.once("snap.mina.stop." + anim.id, function () {
                eve.off("snap.mina.*." + anim.id);
                delete el.anims[anim.id];
            });
            eve(["snap", "animcreated", el.id], anim);

            return anim;
        };

        Element.prototype.animateOnPath = function (path, duration, scale_path,
                                                    rot_path,
                                                    easing, after_callback, during_callback) {
            return _animateOnPath(this, false, path, duration, scale_path,
                rot_path,
                easing, after_callback, during_callback);
        };

        Element.prototype.animateOnPathAbsolute = function (path, duration,
                                                            scale_path,
                                                            rot_path,
                                                            easing,
                                                            after_callback, during_callback) {
            return _animateOnPath(this, true, path, duration, scale_path,
                rot_path,
                easing, after_callback, during_callback);
        };

        Element.prototype.jiggle = function (zoom_factor) {
            return;

            zoom_factor = zoom_factor || 1;
            // var save_tras = this.attr("transform") || "";
            const el = this;
            if (this.data('jig')) return;
            this.data('jig', true);
            const old_trans = el.getLocalMatrix(STRICT_MODE);
            const jig = old_trans.clone();

            const x_disp = 1 / zoom_factor;
            const y_disp = 3 / zoom_factor;

            jig.e = old_trans.e - x_disp;
            jig.f = old_trans.f - y_disp;

            el.animate({transform: jig}, 50, mina.linear,
                function () {
                    el.animate({transform: old_trans}, 50, mina.linear
                        , function () {
                            el.data('jig', '');
                        },
                    );
                });

        };

        Element.prototype.forEach = function (callback, apply_to_root) {
            if (apply_to_root) callback(this);
            const children = this.getChildren();
            for (let i = 0, l = children.length; i < l; ++i) {
                children[i].forEach(callback, true);
            }
        };

        Element.prototype.g_a = function () {
            let args = Array.from(arguments);
            args.unshift(Snap.FORCE_AFTER);
            return this.g.apply(this, args);
        };

        Element.prototype.group = function (attr) {
            let g = this.g_a();
            g.add(this);
            if (attr) g.attr(attr);
            return g;
        };

        Element.prototype.ungroup = Element.prototype.flatten;


    });
}(window || this))