(function (root) {
    "use strict";
    let Snap_ia = (typeof window !== "undefined") ? window.Snap || window.Snap_ia : root.Snap;
    Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {

        //GUI-DEPENDENT INTERACTION FUNCTIONS
        //These extensions require IADesigner library

        /**
         * Applies a cursor style to the element (and optionally its descendants).
         * URL-based cursors are applied inline, while standard cursors reuse CSS classes for better reuse.
         *
         * @function Snap.Element#setCursor
         * @param {string} cursorStyle A standard CSS cursor value or `url(...)`.
         * @param {boolean} [apply_to_children=false] When true, propagate the cursor to all descendants.
         * @param {string} [class_pref="IA_Designer_Cursor"] Prefix used for generated cursor classes.
         * @returns {Snap.Element} The element to facilitate call chaining.
         * @example
         * handle.setCursor('move', true);
         * All child grips will now display the move cursor.
         */
        Element.prototype.setCursor = function (cursorStyle, apply_to_children, class_pref = "IA_Designer_Cursor") {
            //todo: allow url.
            if (!cursorStyle) {
                cursorStyle = 'default';
            }

            if (cursorStyle.startsWith("url(")) {
                // Direct style assignment for URL-based cursors
                this.node.style.cursor = cursorStyle;
                this.removeClass("IA_Designer_Cursor", true);
            } else if (!this.hasClass("IA_Designer_Cursor_" + cursorStyle)) {
                // Class-based cursor styling for standard cursors
                this.node.style.cursor = "inherit";
                this.removeClass("IA_Designer_Cursor", true);
                this.addClass("IA_Designer_Cursor_" + cursorStyle);
            }

            if (apply_to_children) {
                const children = this.getChildren();

                for (let i = 0; i < children.length; ++i) {
                    children[i].setCursor(cursorStyle);
                }
            }

            return this;
        };

        /**
         * Approximates the dominant direction of the element by sampling points along its outline.
         * GUI-dependent version that creates visualization circles.
         *
         * @function Snap.Element#getDirectionLineWithGui
         * @param {number} [sample=100] Number of sampling points used along the path or polygon.
         * @param {Object} gui Helper object used for visualization (expects `svgRoot`).
         * @returns {Array<number>|null} `[angle, intercept]` pair in degrees and intercept, or `null` if undetermined.
         */
        Element.prototype.getDirectionLineWithGui = function (sample, gui) {
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
                        let c = gui.svgRoot.circle(p.x, p.y, .3).attr({id: 'c' + i, fill: 'red'});
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
        };

        /**
         * Corrects the scale of the element based on the current zoom level from the GUI.
         * 
         * @function Snap.Element#correctScale
         * @param {number} [center_x=0] X coordinate of the scaling center.
         * @param {number} [center_y=0] Y coordinate of the scaling center.
         * @param {Object} [gui] GUI object containing layer and zoom information.
         * @returns {Snap.Element} The element for chaining.
         */
        Element.prototype.correctScale = function (center_x, center_y, gui) {
            // return this;
            let scale = 1;
            if (center_x === undefined) center_x = 0;
            if (center_y === undefined) center_y = 0;
            if (gui && gui.layers.getCurrentNavLayer() &&
                (scale = 1 / Number(gui.layers.getZoom())) && !isNaN(scale) &&
                !(scale === 1)) {
                this.scale(scale, scale, center_x, center_y, 'id');
            }
            return this;
        };

        /**
         * Enables drag-to-select behaviour, drawing a temporary rectangle and emitting events during the interaction.
         *
         * @function Snap.Element#regionSelect
         * @param {Object} gui GUI instance used for event publishing and zoom lookups.
         * @param {Object} [rect_style] Optional style overrides for the selection rectangle.
         * @param {Array|string} [end_event] Event key to emit when selection ends.
         * @param {Array|string} [move_event] Event key to emit while the selection rectangle is being resized.
         * @param {Snap.Element} [target_group] Element that will host the temporary rectangle.
         * @param {boolean} [send_click=false] Reserved for future click passthrough behaviour.
         * @returns {Snap.Element} The element for chaining.
         */
        Element.prototype.regionSelect = function (gui, rect_style, end_event, move_event, target_group, send_click) {
            // if (this.paper !== this) return;

            let container = target_group;
            let that = this;
            if (!container) {
                if (gui && gui.handlerGroup) {
                    container = gui.handlerGroup;
                } else {
                    container = this.paper;
                }
            }

            let select, start_point, start_t, append;

            function make_rect(el, cursorPoint, rectStyle) {
                const dash_size = (gui && gui.layers.getZoom()) ?
                    5 / gui.layers.getZoom() :
                    5;
                const stroke_width = (gui && gui.layers.getZoom()) ?
                    .5 / gui.layers.getZoom() :
                    .5;
                rectStyle = Object.assign({
                    fill: 'none',
                    stroke: 'red',
                    strokeWidth: stroke_width,
                    strokeDasharray: dash_size + ', ' + dash_size,
                }, rectStyle || {});
                return el.rect(cursorPoint.x, cursorPoint.y, 0, 0, {id: "select_rect"}).setStyle(rectStyle);
            }

            const startRegionSelect = function (x, y, ev, el, gui) {
                if (el.data('active')) return;
                eve(['drag', 'regionSelect', 'start']);
                // console.log("StartRotDrag in");
                el.data('active', true);
                start_t = Date.now();

                start_point = el.getCursorPoint(x, y,
                    // gui.layers.getCurrentNavLayer()
                );

                // console.log("Init Select", container);
                // console.log("dash: " + dash_size);

                append = ev.shiftKey || ev.ctrlKey;

            };

            const regionSelMove = function (dx, dy, x, y, el, gui) {
                const cursorPoint = el.getCursorPoint(x, y,
                    // gui.layers.getCurrentNavLayer()
                );
                // var pt = el.paper.node.createSVGPoint();

                dx = Math.abs(cursorPoint.x - start_point.x);
                dy = Math.abs(cursorPoint.y - start_point.y);

                if (Date.now() - start_t > 200 && dx > 5 && dy > 5) {
                    if (!select) {
                        select = make_rect(el, start_point, rect_style);
                    }
                }
                // console.log(x, y, cursorPoint.x, cursorPoint.y);
                if (select) {

                    const select_def = {
                        x: Math.min(start_point.x, cursorPoint.x),
                        y: Math.min(start_point.y, cursorPoint.y),
                        width: dx,
                        height: dy,
                    };
                    select.attr(select_def);

                    if (move_event) {
                        gui.eve(move_event, this, select_def)
                    }
                }
            };

            let endRegionSelect = function (ev, el) {
                console.log(select);
                if (select) {
                    const appendElements = append || ev.shiftKey || ev.ctrlKey;

                    gui.eve(end_event || ['drag', 'regionSelect', 'end'], el, select,
                        appendElements);
                    select.remove();
                    select = undefined;
                } else {
                    // if (send_click) {
                    //     const event = new Event('click');
                    //     that.node.dispatchEvent(event)
                    // }
                }
                el.data('active', false);
                gui.eve(['drag', 'regionSelect', 'done'], el);
            };

            return this.drag(
                function (dx, dy, x, y) {
                    regionSelMove(dx, dy, x, y, container, gui);
                },
                function (x, y, ev) {
                    startRegionSelect(x, y, ev, container, gui);
                },
                function (ev) {
                    endRegionSelect(ev, container);
                },
            );
        };


        /**
         * Registers higher-level interaction events on the element.
         * Supports click, press, hold, and longpress event types with flexible handler definitions.
         * The handler can be a direct function, a GUI operation descriptor, or an Eve event string.
         *
         * @function Snap.Element#addInteractionEvent
         * @param {('click'|'press'|'hold'|'longpress')} type Event type to attach.
         * @param {Function|Object|string|Function[]|Object[]|string[]} action_description Handler definition or array of handlers.
         * @param {Object} [other_params] Additional properties merged into the action descriptor.
         * @param {boolean} [replace=false] When true, replaces existing handlers instead of adding to them.
         * @param {Object} [gui] GUI instance exposing an `eve` event dispatcher.
         * @returns {Snap.Element} The element for chaining.
         * @example
         *  Simple function handler
         * rect.addInteractionEvent('click', () => console.log('clicked'));
         * 
         *  Operation string handler
         * button.addInteractionEvent('click', 'saveDocument');
         * 
         *  Multiple handlers
         * icon.addInteractionEvent('press', [handler1, handler2]);
         */
        Element.prototype.addInteractionEvent = function (
            type, action_description, other_params, replace, gui) {

            if (other_params && other_params.eve) {
                gui = other_params;
                other_params = undefined;
            }
            if (typeof replace === "object" && replace.eve) {
                gui = replace;
                replace = undefined;
            }

            if (Array.isArray(action_description)) {
                for (let i = 0; i < action_description.length; ++i) {
                    this.addInteractionEvent(type, action_description[i]);
                }
                return;
            }

            let index = undefined;
            if (typeof action_description === 'function') {
                const other_stored_functions = this.data('stored-function') || [];
                other_stored_functions.push(action_description);
                this.data('stored-function', other_stored_functions);
                action_description = {
                    'stored-function': other_stored_functions.length - 1,
                };
            }

            if (typeof action_description === "string") {
                action_description = {'operation': action_description}
            }

            if (action_description && action_description['message'] && gui) {

                this.addMessage(action_description['message'], gui.eve);

                delete action_description['message'];
            }

            if (other_params) {
                for (let key in other_params) if (other_params.hasOwnProperty(
                    key)) {
                    action_description[key] = other_params[key];
                }
            }

            const event = type + '-event';
            if (this.data(event)) {
                if (replace) {
                    if (action_description) {
                        this.data(event, [action_description]);
                    } else {
                        this.removeData(event);
                    }
                } else {
                    let actions = this.data(event);
                    actions.push(action_description);
                    this.data(event, actions);
                }
            } else {
                this.data(event, [action_description]);
            }

        };

        /**
         * Adds a click event handler to the element and sets the cursor to pointer.
         * 
         * @function Snap.Element#addClickEvent
         * @param {Function|Object|string|Array} action_description Handler function, configuration object, operation string, or array of handlers.
         * @param {Object} [other_params] Additional parameters to merge into the action description.
         * @param {boolean} [replace=false] Whether to replace existing handlers or add to them.
         * @param {Object} [gui] GUI object for accessing eve events and other functionality.
         * @returns {Snap.Element} The element itself for chaining.
         */
        Element.prototype.addClickEvent = function (
            action_description, other_params, replace, gui) {
            this.setCursor('pointer');
            return this.addInteractionEvent('click', action_description,
                other_params, replace);
        };

        /**
         * Adds a press event handler (mousedown/touchdown) to the element.
         * 
         * @function Snap.Element#addPressEvent
         * @param {Function|Object|string|Array} action_description Handler function, configuration object, operation string, or array of handlers.
         * @param {Object} [other_params] Additional parameters to merge into the action description.
         * @param {boolean} [replace=false] Whether to replace existing handlers or add to them.
         * @param {Object} [gui] GUI object for accessing eve events and other functionality.
         * @returns {Snap.Element} The element itself for chaining.
         */
        Element.prototype.addPressEvent = function (
            action_description, other_params, replace, gui) {
            return this.addInteractionEvent('press', action_description,
                other_params, replace);
        };

        /**
         * Adds a hold event handler that fires continuously while pressed.
         * 
         * @function Snap.Element#addHoldEvent
         * @param {Function|Object|string|Array} action_description Handler function, configuration object, operation string, or array of handlers.
         * @param {Object} [other_params] Additional parameters to merge into the action description.
         * @param {boolean} [replace=false] Whether to replace existing handlers or add to them.
         * @param {Object} [gui] GUI object for accessing eve events and other functionality.
         * @returns {Snap.Element} The element itself for chaining.
         */
        Element.prototype.addHoldEvent = function (
            action_description, other_params, replace, gui) {
            return this.addInteractionEvent('hold', action_description,
                other_params, replace);
        };

        /**
         * Adds a long press event handler to the element.
         * 
         * @function Snap.Element#addLongpressEvent
         * @param {Function|Object|string|Array} action_description Handler function, configuration object, operation string, or array of handlers.
         * @param {Object} [other_params] Additional parameters to merge into the action description.
         * @param {boolean} [replace=false] Whether to replace existing handlers or add to them.
         * @param {Object} [gui] GUI object for accessing eve events and other functionality.
         * @returns {Snap.Element} The element itself for chaining.
         */
        Element.prototype.addLongpressEvent = function (
            action_description, other_params, replace, gui) {
            return this.addInteractionEvent('longpress', action_description,
                other_params, replace);
        };

        /**
         * Adds a tooltip message that appears on mouseover.
         * This function needs a listener to display the message. Intended for use with IA Designer.
         * 
         * @function Snap.Element#addMessage
         * @param {string} message Message text to display.
         * @param {Function} eve Event dispatcher function.
         * @returns {void}
         */
        Element.prototype.addMessage = function (message, eve) {
            let in_fun = () => {
                eve(["gui", "message"], undefined, message);
            };
            this.mouseover(in_fun);

            let out_fun = () => {
                eve(["gui", "tooltip", "clear"])
            };
            this.mouseout(out_fun);

            this.data("_message_helper_funs", [in_fun, out_fun])
        }

        /**
         * Removes the tooltip message handlers added by addMessage.
         * 
         * @function Snap.Element#removeMessage
         * @returns {void}
         */
        Element.prototype.removeMessage = function () {
            const funs = this.data("_message_helper_funs");
            if (funs) {
                this.unmouseover(funs[0]);
                this.unmouseout(funs[1]);
                this.removeData("_message_helper_funs");
            }
        }

        /**
         * Converts the element to a bitmap image using canvas rendering.
         * 
         * @function Snap.Element#getBitmap
         * @param {number|number[]} [width] Target width in pixels, or [width, height, x, y] array for custom dimensions.
         * @param {number} [border=0] Border size to add around the element.
         * @param {Object} gui GUI object providing SVG encapsulation utilities.
         * @param {Function} callback Function called with the resulting bitmap data.
         * @param {boolean} [base64=false] Whether to return base64 string instead of ImageData.
         * @returns {void}
         */
        Element.prototype.getBitmap = function (
            width, border, gui, callback, base64) {
            let height;
            let bbox;
            border = border || 0;
            if (width) {
                if (!isNaN(width)) {
                    width = Math.min(width, gui.panelWidth * 2);
                    bbox = this.getBBoxApprox();
                    height = (bbox.height + 2 * border) *
                        (width / (bbox.width + 2 * border));
                }
                if (Array.isArray(width)) {
                    let x = width[2] || 0;
                    let y = width[3] || 0;
                    height = width[1];
                    width = width[0];
                    bbox = {x, y, width, height};
                }
                // console.log("ratios", width / height, bbox.width / bbox.height);
            }
            let disp = this.attr('display');
            this.attr({display: ''});
            let svg_data = gui._.svgEncapsulateBox(this, border, width, height,
                bbox);
            this.attr({display: disp});

            let canvas = document.createElement('canvas');

            // canvas_div.append(canvas);
            // canvas = canvas[0];
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');

            const img = new Image();

            let svg = new Blob([svg_data], {type: 'image/svg+xml'});
            const DOMURL = root.URL || root.webkitURL || root;
            const url = DOMURL.createObjectURL(svg);

            let time = performance.now();

            const that = this;
            img.addEventListener('load', function () {
                context.drawImage(img, 0, 0, width, height, 0, 0, width, height);
                // that.temp_image_canvas = canvas;
                DOMURL.revokeObjectURL(url);
                // console.log(performance.now() - time);
                let ret = (base64) ? canvas.toDataURL() :
                    context.getImageData(0, 0, width, height);
                callback(ret);
                canvas.remove();
            });

            img.onerror = function () {
                console.log('problem with svg');
                console.log(svg_data);
                callback(null);
                canvas.remove();
            };

            img.src = url;

        };

        /**
         * Creates a canvas overlay positioned over the element.
         * 
         * @function Snap.Element#getCanvasOverly
         * @param {number|number[]} [scale=1] Scale factor, or [scaleX, scaleY] array for non-uniform scaling.
         * @param {number} [width_pix] Canvas width in pixels. Defaults to element width.
         * @param {number} [height_pix] Canvas height in pixels. Defaults to element height.
         * @returns {{container: Snap.Element, canvas: HTMLCanvasElement}} Object with the container element and canvas node.
         */
        Element.prototype.getCanvasOverly = function (
            scale, width_pix, height_pix) {
            let scalex, scaley;
            scale = scale || 1;
            if (Array.isArray(scale) && scale.length === 2) {
                scalex = scale[0];
                scaley = scale[1];
            } else {
                scalex = scaley = scale;
            }

            // let bbox = this.getBBoxRot(this.transform().totalMatrix.split().rotate);
            let bbox = this.getBBox();
            // console.log("co", bbox, width_pix, height_pix, bbox.width / bbox.height, width_pix / height_pix);
            // this.after(bbox.rect(this.paper).attr({fill: "none", stroke: "black"}));
            width_pix = width_pix || bbox.width;
            height_pix = height_pix || bbox.height;

            const html = '<canvas id="' + this.getId() + '_canvas" ' +
                'width="' + width_pix + '" ' +
                'height="' + height_pix + '"></canvas>';
            const fo = this.htmlInsert(Snap.FORCE_AFTER, 0, 0, width_pix,
                height_pix, html);

            fo.fitInBox({
                width: bbox.width * scalex,
                height: bbox.height * scaley,
                cx: bbox.cx,
                cy: bbox.cy,
            }, true);

            let canvas = fo.select('canvas');
            canvas = canvas.node;

            return {container: fo, canvas: canvas};
        };

        /**
         * Creates a rasterized image of the element and places it in front of the element.
         * 
         * @function Snap.Element#rasterize
         * @param {Object} gui GUI object providing SVG encapsulation utilities.
         * @param {number} [scale=1] Scale factor for the rasterization.
         * @param {number|string} [border=0] Border size to add around the element. Can be a number or percentage string.
         * @param {boolean} [remove=false] Whether to remove the original element after rasterization.
         * @returns {Promise<Snap.Element>} Promise that resolves with the new image element.
         */
        Element.prototype.rasterize = function (gui, scale, border, remove) {
            scale = scale || 1;

            let that = this;
            border = border || 0;
            let bbox = this.getBBox();
            if (typeof border === 'string' &&
                border.endsWith('%')) border = Math.ceil(
                bbox.r2() * (+border.replace('%', '')) / 100);
            const promise = new Promise((resolve, reject) => {
                let make = function (base64) {
                    let img = that.image(Snap.FORCE_AFTER, base64, bbox.x - border,
                        bbox.y - border,
                        bbox.width + 2 * border, bbox.height + 2 * border);
                    img.attr({id: that.getId() + '_raster'});
                    console.log(bbox, img.getBBox());
                    if (remove) that.remove();
                    resolve(img);
                };

                this.getBitmap(bbox.width * scale, border, gui, make, true);
            });

            return promise;
        };

    });
}(window || this))