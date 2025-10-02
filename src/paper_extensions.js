(function (root) {
        let Snap_ia = root.Snap_ia || root.Snap;

        //Paper functions, require snap_extensions and element_extensions
        Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {
            const paper_element_extension = {};
            /**
             * Registers a lazily executed Paper extension that can augment any SVG root.
             * Extensions are executed later through {@link Snap.Paper#processExtensions}.
             *
             * @function Snap.Paper#addExtension
             * @param {string} name Unique identifier for the extension.
             * @param {function(Element):void} processor Callback that receives the root element to extend.
             * @example
             * paper.addExtension('highlight', (root) => {
             *     root.addClass('is-highlighted');
             * });
             */
            let addExtension = function (name, processor) {
                if (typeof processor === "function") paper_element_extension[name] = processor;
            };
            Paper.prototype.addExtension = addExtension;
            Paper.prototype.addExtension.skip = true;

            /**
             * Executes all registered extensions against the supplied SVG root. Each extension is invoked
             * with the root element so that it can perform DOM manipulations or add helpers.
             *
             * @function Snap.Paper#processExtensions
             * @param {Element} root Root SVG element that will receive all registered extensions.
             * @example
             * paper.processExtensions(paper.select('svg'));
             */
            Paper.prototype.processExtensions = function (root) {
                for (const name in paper_element_extension) {
                    paper_element_extension[name](root);
                }
            }

            Paper.prototype.processExtensions.skip = true;

            /**
             * Creates a `<clipPath>` element and optionally populates it with content or attributes.
             *
             * @function Snap.Paper#clipPath
             * @param {Object|Snap.Element} [first] Attribute map or element to append immediately.
             * @returns {Snap.Element} Newly created clipPath element.
             * @example
             * const clip = paper.clipPath({ id: 'avatarClip' });
             * clip.add(paper.circle(50, 50, 40));
             */
            Paper.prototype.clipPath = function (first) {
                let attr;
                const el = this.el('clipPath');
                if (first && !first.paper) {
                    el.attr(first);
                } else if (first && first.paper) {
                    el.add(first);
                }
                return el;
            };

            /**
             * Creates an SVG `<a>` anchor element and assigns optional href/target attributes.
             *
             * @function Snap.Paper#a
             * @param {string} [href] Hyperlink reference (internal or external).
             * @param {string} [target] Target attribute such as `_blank`.
             * @returns {Snap.Element} Anchor element ready for child content.
             * @example
             * const link = paper.a('https://example.com', '_blank');
             * link.add(paper.text(0, 0, 'Open example'));
             */
            Paper.prototype.a = function (href, target) {
                const el = this.el('a');
                if (href || target) {
                    const attr = {};
                    href && (attr.href = href);
                    target && (attr.target = target);
                    el.attr(attr);
                }
                return el;
            };

            /**
             * Wraps an element (or text) with a styled rectangle and optional click handler to form a button.
             *
             * @function Snap.Paper#button
             * @param {Snap.Element|string} el Element or string label to display inside the button.
             * @param {number} [border=0] Padding around the element in SVG units.
             * @param {function(MouseEvent):void} [action] Click handler assigned to the button group.
             * @param {Object|string} [background_style] Style map or CSS string applied to the background rect.
             * @param {Object|string} [style] Style map or CSS string applied to the wrapper group.
             * @returns {Snap.Element} Group containing the clickable button and its background.
            * @example
            * const btn = paper.button('Save', 4, () => console.log('Saving...'));
            * btn.addClass('ui-button');
             */
            Paper.prototype.button = function (el, border, action, background_style, style) {
                border = border || 0;
                if (typeof el === 'string') {
                    el = this.text(0, 0, el);
                }
                const button = el.group();
                const bbox = el.getBBox();
                const background = this.rect(bbox.x - border, bbox.y - border, bbox.width + 2 * border, bbox.height + 2 * border);
                if (background_style) {
                    background.setStyle(background_style);
                } else {
                    background.attr("opacity", 0);
                }
                el.before(background);
                if (style) button.setStyle(style);

                if (action) {
                    button.addClickEvent(action);
                }
                button.add([background, el]);
                return button;
            }

            /**
             * Creates a `<foreignObject>` container, injecting optional HTML markup into the node.
             *
             * @function Snap.Paper#foreignObject
             * @param {number|Object} [x] X coordinate or attribute object.
             * @param {number} [y] Y coordinate when numeric arguments are used.
             * @param {number|string} [width] Width of the foreignObject.
             * @param {number|string} [height] Height of the foreignObject.
             * @param {string} [html] Inner HTML markup injected into the foreignObject.
             * @returns {Snap.Element} The created foreignObject element.
            * @example
            * paper.foreignObject(10, 10, 120, 40, '<div>Inline HTML</div>');
             */
            Paper.prototype.foreignObject = function (x, y, width, height, html) {
                if (typeof width === 'string' && height === undefined && html ===
                    undefined) {
                    html = width;
                    width = undefined;
                    height = undefined;
                }
                let attr = {};
                if (Snap.is(x, 'object')) {
                    attr = x;
                } else if (x != null) {
                    attr = {
                        x: x,
                        y: y,
                        width: width || '',
                        height: height || '',
                    };
                }
                const el = this.el('foreignObject', attr);
                el.node.innerHTML = html || '';
                return el;
            };

            /**
             * Creates a managed foreignObject container whose inner `<div>` is exposed via `el.div` for
             * easier manipulation. Accepts HTML, Snap elements, or arrays of elements.
             *
             * @function Snap.Paper#htmlInsert
             * @param {number} x X coordinate.
             * @param {number} y Y coordinate.
             * @param {number|string} width Width of the container.
             * @param {number|string} height Height of the container.
             * @param {string|Snap.Element|Snap.Element[]} [html] Content injected into the inner div.
             * @param {Object|string} [style] Style applied to the inner div.
             * @returns {Snap.Element} ForeignObject element with an accessible `div` property.
            * @example
            * const widget = paper.htmlInsert(0, 0, 200, 100, '<p>Hello UI</p>');
            * widget.div.addClass('widget-shell');
             */
            Paper.prototype.htmlInsert = function (
                x, y, width, height, html, style) {
                const div = '<div xmlns="http://www.w3.org/1999/xhtml" class="IA_Designer_html"></div>';
                const el = this.foreignObject(x, y, width, height, div);
                let div_el;
                if (el.type !== "foreignObject" && el.hasPartner()) {
                    let partners = el.getPartners("dom");
                    div_el = partners[0];
                } else {
                    div_el = el.node.firstChild;
                }
                el.div = Snap(div_el);
                if (html) {
                    const type = typeof html;
                    let root = el.div.select(".IA_Designer_html") || el.div;
                    if (type === 'string') {
                        root.node.innerHTML = html;
                    } else if (type === 'object' && html.paper || Array.isArray(html)) {
                        root.add(html);
                    }
                }
                if (style) el.div.setStyle(style);
                return el;
            };

            /**
             * Creates a nested Snap canvas rendered inside a foreignObject, returning references to the
             * embedded instance via `el.embeddedSvg`.
             *
             * @function Snap.Paper#embeddedSVG
             * @param {number} x X coordinate of the container.
             * @param {number} y Y coordinate of the container.
             * @param {number} width Width of the embedded SVG viewport.
             * @param {number} height Height of the embedded SVG viewport.
             * @param {Snap.Element|Snap.Element[]} [element] Elements to add to the embedded canvas.
             * @param {Snap.Element|Array<number>} [viewBox] Element or `[x, y, width, height]` defining the viewBox.
             * @returns {Snap.Element} ForeignObject with `embeddedSvg` pointing to the inner Snap instance.
             * @example
             * const embedded = paper.embeddedSVG(0, 0, 200, 200);
             * embedded.embeddedSvg.circle(100, 100, 40).attr({ fill: '#5bc0de' });
             */
            Paper.prototype.embeddedSVG = function (
                x, y, width, height, element, viewBox) {
                if (viewBox && viewBox.getBBox) {
                    let bb = viewBox.getBBox;
                    viewBox = [bb.x, bb.y, bb.width, bb.height];
                }
                !viewBox && (viewBox = [0, 0, width, height]);

                let el = this.htmlInsert(x, y, width, height);
                let embedded_svg = Snap(width, height);
                embedded_svg.attr({id: this.getId() + '_innersvg'});
                el.div.append(embedded_svg.node);
                el.embeddedSvg = embedded_svg;
                embedded_svg.embedded = true;
                if (element) {
                    embedded_svg.add(element);
                    element.paper = embedded_svg.paper;
                }

                return el;
            };

            /**
             * Creates a `<canvas>` element inside a foreignObject and exposes the native node via `el.canvas`.
             *
             * @function Snap.Paper#canvas
             * @param {number} x X coordinate of the foreignObject.
             * @param {number} y Y coordinate of the foreignObject.
             * @param {number} width Canvas width in pixels.
             * @param {number} height Canvas height in pixels.
             * @param {string} [id] Base id used for the foreignObject and canvas elements.
             * @returns {Snap.Element} ForeignObject containing the created canvas element.
             * @example
             * const canvasFo = paper.canvas(0, 0, 300, 150, 'chart');
             * const ctx = canvasFo.canvas.getContext('2d');
             * ctx.fillRect(0, 0, 300, 150);
             */
            Paper.prototype.canvas = function (x, y, width, height, id) {
                id = id || String.rand(8, 'alpha');
                const html = '<canvas id="' + id + '_canvas" ' +
                    'width="' + width + '" ' +
                    'height="' + height + '"></canvas>';
                const fo = this.foreignObject(0, 0, width, height, html);

                if (el.type !== "foreignObject" && el.hasPartner()) {
                    let div_el = Snap(el.getPartners("dom")[0]);
                    fo.canvas = div_el.select('canvas').node;
                } else {
                    fo.canvas = fo.select('canvas').node;
                }

                fo.attr({id: id});
                return fo;
            };

            /**
             * Creates a simple HTML `<input type="text">` form inside a foreignObject.
             *
             * @function Snap.Paper#textInputBox
             * @param {string} id Element id assigned to the wrapping div.
             * @param {number} x X coordinate of the foreignObject.
             * @param {number} y Y coordinate of the foreignObject.
             * @param {number} width Width of the input container.
             * @param {number} height Height of the input container.
             * @returns {Snap.Element} ForeignObject containing the form markup.
             */
            const textInputBox = function (id, x, y, width, height) {
                const html = '<div id ="' + id +
                    '" xmlns="http://www.w3.org/1999/xhtml">' +
                    '<form>' +
                    '<input type="text" value="test">' +
                    '</form>' +
                    '</div>';
                return this.foreignObject(x, y, width, height, html);
            };
            textInputBox.skip = true;
            Paper.prototype.textInputBox = textInputBox;

            /**
             * Draws a screen-space constant point marker with optional label support.
             *
             * @function Snap.Paper#point
             * @param {Snap.Element|number|number[]} group Target group or x coordinate.
             * @param {number} [x] X coordinate when `group` is provided.
             * @param {number} [y] Y coordinate when `group` is provided.
             * @param {string|number} [color] Fill color or radius when numeric.
             * @param {number|string} [size=1] Base radius expressed in screen pixels.
             * @param {string|null} [label] Optional label text (use `null` to suppress).
             * @param {Object} [label_style] Additional label styling options such as `dx`/`dy`.
             * @returns {Snap.Element} Created marker element or wrapper group when labeled.
             */
            /**
             * Draws an SVG grid made of horizontal and vertical lines. This helper is useful when you need the
             * underlying line elements; for a rectangular cell grid see the later `Snap.Paper#grid` override.
             *
             * @name Snap.Paper#gridLines
             * @private
             * @param {number} x X coordinate of the grid origin.
             * @param {number} y Y coordinate of the grid origin.
             * @param {number} width Total width of the grid.
             * @param {number} height Total height of the grid.
             * @param {number|Object|Snap.Element} columns Column count, attribute map, or existing container element.
             * @param {number} rows Number of rows (used when `columns` is numeric).
             * @param {number} [stroke_width=1] Stroke width applied to grid lines.
             * @param {Object} [style] Attribute map applied to the grid lines.
             * @param {boolean} [elements=false] When truthy, returns separate horizontal/vertical collections.
             * @returns {Snap.Element|Object} Grid group or object `{ lines, columns, rows }` when `elements` is true.
             */
            Paper.prototype.grid = function (
                x,
                y,
                width,
                height,
                columns,
                rows,
                stroke_width,
                style,
                elements
            ) {
                if (typeof x === 'object') {
                    label_style = label;
                    label = size;
                    size = color;
                    color = y;
                    y = x[1] || x.y;
                    x = x[0] || x.x;
                }
                if (typeof color === 'number') {
                    label_style = label;
                    label = size;
                    size = color;
                    color = undefined;
                }
                size = size || 1;
                const r = group.getFromScreenDistance(size);
                let pt = this.circle(x, y, r);
                pt.attr({
                    stroke: 'white',
                    fill: color || 'black',
                    strokeWidth: size / 2 || 1,
                    is_point: 1,
                    'vector-effect': 'non-scaling-stroke',
                    class: 'IA_Designer_point',
                });

                if (label !== null) {
                    const pt_gr = pt.g();
                    pt_gr.add(pt);
                    let dx = 5;
                    let dy = 5;
                    if (label_style) {
                        dx = label_style.dx || 5;
                        dy = label_style.dy || 5;
                    }
                    let lb = pt_gr.text(x + dx, y + dy, label);
                    if (label_style) lb.setStyle(label_style);
                    pt = pt_gr;
                }

                group.add(pt);
                return pt;
            };


            Paper.prototype.getFromScreenDistance = Element.prototype.getFromScreenDistance;

            Paper.prototype.getFromScreenDistance.skip = true;

            /**
             * Draws a circle by delegating to {@link Snap.Paper#ellipse} so that width and height scale
             * consistently when transforms are applied.
             *
             * @function Snap.Paper#circle
             * @param {number} x X coordinate of the centre.
             * @param {number} y Y coordinate of the centre.
             * @param {number} r Circle radius.
             * @param {Object} [attr] Attribute map for the circle element.
             * @returns {Snap.Element} Created ellipse element representing the circle.
             */
            Paper.prototype.circle = function (x, y, r, attr) {
                return this.ellipse(x, y, r, r, attr);
            };

            /**
             * Measures text by temporarily drawing it within the SVG, returning the associated bounding box.
             *
             * @function Snap.Paper#measureText
             * @param {string} text Text to measure.
             * @param {Object} [font_style] Attribute map (e.g. `font-size`, `font-family`).
             * @param {Snap.Element} [group] Optional group to which the transient text is added.
             * @returns {Snap.BBox} Bounding box of the rendered text.
             */
            const measureText = function (text, font_style, group) {
                const text_el = this.text(0, 0, text);
                if (font_style) text_el.attr(font_style);
                if (group) group.add(text_el);
                const box = text_el.getBBox();
                text_el.remove();
                return box;
            };
            measureText.skip = true;
            Paper.prototype.measureText = measureText;

            /**
             * Renders text containing newline characters as stacked tspans, with configurable spacing.
             *
             * @function Snap.Paper#multilineText
             * @param {number} x X coordinate of the first baseline.
             * @param {number} y Y coordinate of the first baseline.
             * @param {string|string[]} text Text value or list of lines.
             * @param {Object} [attr] Attribute map applied to the text element.
             * @param {number} [linespace=1.2] Line spacing expressed in em units.
             * @param {number} [first_tab=0] Initial horizontal offset for the first line.
             * @returns {Snap.Element} Text element containing the generated tspans.
             */
            Paper.prototype.multilineText = function (
                x, y, text, attr, linespace, first_tab) {
                linespace = linespace || 1.2;
                first_tab = first_tab || 0;
                if (typeof text === 'string') text = text.split(/\\n/g);
                let text_tab = this.text(x, y, text, attr);
                let tspans = text_tab.getChildren(true);
                for (let i = 0, l = tspans.length; i < l; ++i) {
                    tspans[i].attr({
                        x: x + ((i) ? 0 : first_tab),
                        dy: (i) ? (linespace + 'em') : '.6em',
                    });
                }

                return text_tab;
            };

            /**
             * Creates an image-based border using nine-slice scaling and optional background colour fill.
             *
             * @function Snap.Paper#borderImage
             * @param {Snap.Element|string} image_url Image element or URL used for the border slices.
             * @param {number} [border=0] Border width around the target rectangle.
             * @param {number} x X coordinate of the top-left corner.
             * @param {number} y Y coordinate of the top-left corner.
             * @param {number} width Target width of the border frame.
             * @param {number} height Target height of the border frame.
             * @param {string} [color="white"] Background colour used if the source image contains transparency.
             * @returns {Snap.Element} Group containing the tiled border graphics.
             */
            Paper.prototype.borderImage = function (image_url, border, x, y, width, height, color) {
                color = color || "white"
                border = border || 0;

                let group, background, img, crop = "full";
                if (Snap.is(image_url, "element")) {
                    img = image_url;
                    group = img.group();
                    if (img.node.hasAttribute("transform")) {
                        group.transform(img.node.getAttribute("transform"));
                        img.attr("transform", "");
                    }
                    !border && (border = img.attr("border") || 0);
                    const img_size = img.attr("crop");
                    if (img_size !== undefined) {
                        crop = img_size
                    }
                    if (image_url.type === "image"
                        || image_url.type === "rect") {
                        x = x || img.attr("x") || 0;
                        y = y || img.attr("y") || 0;
                        width = width || img.attr("width");
                        height = height || img.attr("height");
                    } else {
                        const bb = img.getBBox();
                        x = x || bb.x || 0;
                        y = y || bb.y || 0;
                        width = width || bb.width;
                        height = height || bb.height;
                    }

                    let stored_color = img.attr("border_color") || img.attr("border-color");
                    if (stored_color) {
                        color = stored_color;
                    }
                } else if (typeof image_url === "string") {
                    group = this.g();
                    img = group.image(image_url)
                }
                width = Number(width || 0); // allow other formats for width
                height = Number(height || 0);
                x = x || 0;
                y = y || 0;

                let params = compute_border_image_params(x, y, width, height, border, crop);

                const rect = group.rect(params.b_x, params.b_y, params.b_width, params.b_height);
                if (typeof color === 'object') {
                    rect.setStyle(color)
                } else {
                    rect.setStyle({fill: color})
                }

                img.before(rect);

                group._img = img;
                group._rect = rect

                image_border_update_internal(group, params);

                //automatic update functionality
                let attributeFilter = ['x', 'y', 'width', 'height', 'border', 'crop'];
                let border_image_observer = new MutationObserver(function (mutationList) {
                    let params_of_el = {};
                    // console.log(mutationList);
                    for (const mutation of mutationList) {
                        for (const attr of attributeFilter) {
                            params_of_el[attr] = group.attr(attr);
                        }
                    }

                    const params = compute_border_image_params(params_of_el.x, params_of_el.y, params_of_el.width, params_of_el.height, params_of_el.border, params_of_el.crop);

                    image_border_update_internal(group, params, true);
                    if (params_of_el["fill"]) {
                        group._rect.attr("fill", "");
                    }
                },);
                border_image_observer.observe(group.node, {
                    attributes: true,
                    attributeOldValue: true,
                    // attributeFilter: attributeFilter,
                });
                group._observer = border_image_observer;
                group.isBorderImage = true;

                group.addClass("IA_border_image");

                // console.log("Making Border", img.getId());

                return group;
            }

            addExtension("borderImage", function (root) {
                if (!root || !root.selectAll) return;
                const targets = root.selectAll('[border], [class*="IA_border_image"]');

                targets.forEach((target) => {
                    if (target._ghost_element || target.isBorderImage) return; //skip processing ghost images
                    const classes = (target.attr('class') || "").toLowerCase();
                    if (classes.includes("ia_border_image")) {
                        let match = classes.match(/ia_border_image(_(\S+))?/);
                        if (match && match.length) {
                            if (match[2] == null) {
                                target.attr('border', match[2]);
                            }

                            target.removeClass(match[0])
                        }

                        match = classes.match(/ia_border_crop(_(\S+))?/);
                        if (match && match.length) {
                            if (match[2] == null) {
                                target.attr('crop', match[2]);
                            }
                            target.removeClass(match[0])
                        }
                    }

                    root.paper.borderImage(target);
                    if (target.node.hasAttribute('border')) target.node.removeAttribute('border');
                    if (target.node.hasAttribute('crop')) target.node.removeAttribute('crop');
                })
            })

            function compute_border_image_params(x, y, width, height, border, crop) {
                let [computed_border, increment] = compute_border(border, Number(width), Number(height));

                let params = {
                    x: Number(x),
                    y: Number(y),
                    width: Number(width),
                    height: Number(height),
                    b_x: Number(x),
                    b_y: Number(y),
                    b_width: Number(width),
                    b_height: Number(height),
                    border: border,
                    increment: Number(increment),
                    crop: crop
                }

                if (increment) {
                    params.b_x = params.x - computed_border;
                    params.b_y = params.y - computed_border;
                    params.b_width = params.width + 2 * computed_border;
                    params.b_height = params.height + 2 * computed_border;
                }

                if (!increment) {
                    params.x += computed_border;
                    params.y += computed_border;
                    params.width -= 2 * computed_border;
                    params.height -= 2 * computed_border;
                }
                return params;
            }

            function compute_border_image_crop(crop, x, y, width, height) {
                if (crop === undefined || crop === 'full'
                    || crop == 1 || crop == 100) return [x, y, width, height];

                const dim_w = width >= height;
                const c = {x: x + width / 2, y: y + height / 2}
                if (crop === "square") {
                    width = (dim_w) ? height : width;
                    height = (dim_w) ? height : width;
                } else if (!isNaN(crop) && crop > 1) {
                    width = (dim_w) ? width * crop / 100 : width;
                    height = (dim_w) ? height : height * crop / 100;
                } else if (!isNaN(crop) && crop < 1 && crop >= 0) {
                    width = (dim_w) ? height + (width - height) * crop : width;
                    height = (dim_w) ? height : width + (height - width) * crop;
                }

                x = (dim_w) ? c.x - width / 2 : x;
                y = (dim_w) ? y : c.y - height / 2;

                return [x, y, width, height];
            }

            function image_border_update_internal(group, params, skip_group) {
                let increment = params.increment || 0;
                if (!skip_group) group.attr({
                    border: params.border,
                    // increment: increment,
                    x: (increment) ? params.x : params.b_x,
                    y: (increment) ? params.y : params.b_y,
                    width: (increment) ? params.width : params.b_width,
                    height: (increment) ? params.height : params.b_height,
                    crop: params.crop || "full"
                });

                if (params.crop !== null) {
                    if (!group._crop_rec) {
                        group._crop_rec = group.rect();
                        group._img.createClipPath(group._crop_rec)
                    }
                    const border = params.x - params.b_x;
                    if (group._crop_rec) {
                        let [x, y, width, height]
                            = compute_border_image_crop(params.crop, params.x, params.y, params.width, params.height)
                        group._crop_rec.attr({
                            x: x,
                            y: y,
                            width: width,
                            height: height
                        })

                        params.b_x = x - border;
                        params.b_y = y - border;
                        params.b_width = width + 2 * border;
                        params.b_height = height + 2 * border;
                    }
                }

                group._rect.attr({
                    x: params.b_x,
                    y: params.b_y,
                    width: params.b_width,
                    height: params.b_height
                })

                let type = group._img.type;
                if (type === "image" || type === "rect") {
                    group._img.attr({
                        x: params.x,
                        y: params.y,
                        width: params.width,
                        height: params.height
                    })
                } else {
                    group._img.fitInBox({
                        cx: params.x + params.width / 2,
                        cy: params.y + params.height / 2,
                        width: params.width,
                        height: params.height
                    }, true)
                }
            }

            function compute_border(border, width, height) {
                let increment = false;
                if (typeof border === 'string') {
                    border = border.trim();
                    if (border.startsWith("+")) {
                        increment = true;
                        border.replace("+", "");
                    }
                    if (border.includes("%")) {
                        if (border.includes("%w")) {
                            border.replace("%w", "");
                            border = width * (Number(border) / 100);
                        } else if (border.includes("%h")) {
                            border.replace("%h", "");
                            border = height * (Number(border) / 100);
                        } else {
                            border.replace("%h", "");
                            border = Math.max(width, height) * (Number(border) / 100);
                        }
                    }
                }

                return [Number(border), increment];
            }

        });

        //Shape builders
        Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {

                /**
                 * Builds a circle from a centre point and a point lying on its circumference.
                 *
                 * @function Snap.Paper#circleCentPoint
                 * @param {number|Object} x1 Centre x coordinate or `{x, y}` object.
                 * @param {number|Object} y1 Centre y coordinate or `{x, y}` object when `x1` is numeric.
                 * @param {number} x2 X coordinate of the circumference point.
                 * @param {number} y2 Y coordinate of the circumference point.
                 * @returns {Snap.Element} Circle element derived from the two points.
                 */
                Paper.prototype.circleCentPoint = function (x1, y1, x2, y2) {
                    if (typeof y1 === "object" && y1.hasOwnProperty("x")) {
                        x2 = y1.x;
                        y2 = y1.y;
                    }

                    if (typeof x1 === "object" && y1.hasOwnProperty("x")) {
                        y1 = x1.y;
                        x1 = x1.x;
                    }


                    return this.circle(x1, y1, Snap.len(x1, y1, x2, y2));
                };


                /**
                 * Builds a circle from two points defining the endpoints of a diameter.
                 *
                 * @function Snap.Paper#circleTwoPoints
                 * @param {number|Object} x1 First point x coordinate or `{x, y}` object.
                 * @param {number|Object} y1 First point y coordinate or `{x, y}` object when `x1` is numeric.
                 * @param {number} x2 Second point x coordinate.
                 * @param {number} y2 Second point y coordinate.
                 * @returns {Snap.Element} Circle passing through the two provided points.
                 */
                Paper.prototype.circleTwoPoints = function (x1, y1, x2, y2) {
                    if (typeof y1 === "object" && y1.hasOwnProperty("x")) {
                        x2 = y1.x;
                        y2 = y1.y;
                    }

                    if (typeof x1 === "object" && y1.hasOwnProperty("x")) {
                        y1 = x1.y;
                        x1 = x1.x;
                    }


                    return this.circle((x1 + x2) / 2, (y1 + y2) / 2, Snap.len(x1, y1, x2, y2) / 2);
                };

                /**
                 * Builds a circle that passes through three distinct points.
                 *
                 * @function Snap.Paper#circleThreePoints
                 * @param {number|Object} x1 First point x coordinate or `{x, y}` object.
                 * @param {number|Object} y1 First point y coordinate or `{x, y}` object when `x1` is numeric.
                 * @param {number|Object} x2 Second point x coordinate or `{x, y}` object.
                 * @param {number} y2 Second point y coordinate.
                 * @param {number} x3 Third point x coordinate.
                 * @param {number} y3 Third point y coordinate.
                 * @returns {Snap.Element|null} Circle through the three points, or `null` if the points are colinear.
                 */
                Paper.prototype.circleThreePoints = function (x1, y1, x2, y2, x3, y3) {

                    if (typeof x2 === "object" && x2.hasOwnProperty("x")) {
                        x3 = x2.x;
                        y3 = x2.y;
                    }

                    if (typeof y1 === "object" && y1.hasOwnProperty("x")) {
                        x2 = y1.x;
                        y2 = y1.y;
                    }

                    if (typeof x1 === "object" && y1.hasOwnProperty("x")) {
                        y1 = x1.y;
                        x1 = x1.x;
                    }

                    const yDelta_a = y2 - y1;
                    const xDelta_a = x2 - x1;
                    const yDelta_b = y3 - y2;
                    const xDelta_b = x3 - x2;

                    const aSlope = yDelta_a / xDelta_a;
                    const bSlope = yDelta_b / xDelta_b;

                    const c_x = (aSlope * bSlope * (y1 - y3) + bSlope * (x1 + x2) - aSlope * (x2 + x3)) / (2 * (bSlope - aSlope));
                    const c_y = -1 * (c_x - (x1 + x2) / 2) / aSlope + (y1 + y2) / 2;

                    if (c_x === Infinity || c_y === Infinity) return null;

                    const r = Snap.len(c_x, c_y, x1, y1);

                    if (r > 100000) return null;

                    return this.circle(c_x, c_y, r)
                };


                /**
                 * Constructs an ellipse from the general quadratic equation coefficients.
                 *
                 * @function Snap.Paper#ellipseFromEquation
                 * @param {number} A Coefficient for $x^2$.
                 * @param {number} B Coefficient for $xy$.
                 * @param {number} C Coefficient for $y^2$.
                 * @param {number} D Coefficient for $x$.
                 * @param {number} E Coefficient for $y$.
                 * @param {number} [F=-1] Constant term.
                 * @param {boolean} [properties_only=false] When true, returns ellipse properties instead of an element.
                 * @returns {Snap.Element|Object|null} Ellipse element or property object; `null` when coefficients do not represent an ellipse.
                 */
                Paper.prototype.ellipseFromEquation = function (A, B, C, D, E, F, properties_only) {
                    if (typeof F === "boolean") {
                        properties_only = F;
                        F = -1
                    }

                    if (F === undefined) F = -1;

                    let den = 4 * A * C - B * B;
                    if (den == 0) {
                        return null;
                    }
                    let cx = (B * E - 2 * C * D) / den;
                    let cy = (B * D - 2 * A * E) / den;

                    // evaluate the a coefficient of the ellipse equation in normal form
                    // E(x,y) = a*(x-cx)^2 + b*(x-cx)*(y-cy) + c*(y-cy)^2 = 1
                    // where b = a*B , c = a*C, (cx,cy) == centre
                    let num = A * cx * cx
                        + B * cx * cy
                        + C * cy * cy
                        - F;


                    //evaluate ellipse rotation angle
                    let rot = Math.atan2(-B, -(A - C)) / 2;
//      cerr << "rot = " << rot << endl;
                    let swap_axes = false;
                    if (Math.abs(rot - 0) < 1e-6) {
                        rot = 0;
                    }
                    if (Math.abs(rot - Math.PI / 2) < 1e-12 || rot < 0) {
                        swap_axes = true;
                    }

                    // evaluate the length of the ellipse rays
                    const cosrot = Math.cos(rot);
                    const sinrot = Math.sin(rot);
                    const cos2 = cosrot * cosrot;
                    const sin2 = sinrot * sinrot;
                    const cossin = cosrot * sinrot;

                    den = A * cos2 + B * cossin + C * sin2;

//
//        rx2 = num/roots[0];
//        ry2 = num/roots[1];

                    if (den === 0) {
                        return null
                    }
                    const rx2 = num / den;
                    if (rx2 < 0) {
                        return null;
                    }
                    let rx = Math.sqrt(rx2);

                    den = C * cos2 - B * cossin + A * sin2;
                    if (den === 0) {
                        return null;
                    }
                    const ry2 = num / den;
                    if (ry2 < 0) {
                        return null;
                    }

                    let ry = Math.sqrt(ry2);

                    // the solution is not unique so we choose always the ellipse
                    // with a rotation angle between 0 and PI/2
                    if (swap_axes) {
                        //swap(rx, ry);
                        const temp = rx;
                        rx = ry;
                        ry = temp;
                    }
                    if (Math.abs(rot - Math.PI / 2) < 1e-6
                        || Math.abs(rot - Math.PI / 2) < 1e-6
                        || Math.abs(rx - ry) < 1e-12
                    ) {
                        rot = 0;
                    } else {
                        if (rot < 0) {
                            rot += Math.PI / 2;
                        }
                    }

                    if (properties_only) {
                        return {
                            x: cx,
                            y: cy,
                            rx: rx,
                            ry: ry,
                            angle: Snap.deg(rot)
                        }
                    } else {
                        return this.ellipse(cx, cy, rx, ry).rotate(Snap.deg(rot), cx, cy)
                    }
                };

                /**
                 * Splits an annulus into equal angular segments and renders them as path elements.
                 *
                 * @function Snap.Paper#diskSegments
                 * @param {number} num_segments Number of segments to generate.
                 * @param {number} [angle] Angular span in radians; defaults to a full circle.
                 * @param {number} [start_angle=0] Angle offset applied to the first segment.
                 * @param {number} inner_rad Inner radius of the annulus.
                 * @param {number} outer_rad Outer radius of the annulus.
                 * @param {Object|Array|function} [style] Styling applied to each segment.
                 * @param {string} [id] Base id assigned to generated segments.
                 * @param {Snap.Element} [group] Group that receives the generated segments.
                 * @param {string} [class_name] Class name appended to each path.
                 * @returns {Snap.Element} Group containing all generated segments, or the last path when no group is supplied.
                 */
                Paper.prototype.diskSegments = function (num_segments, angle, start_angle, inner_rad, outer_rad, style, id, group, class_name) {
                    if (!group && num_segments > 1) {
                        group = this.g()
                    }

                    if (!id && group) id = group.getId();

                    if (!angle) angle = 2 * Math.PI / num_segments;

                    let d, p1, p2, p3, p4, c, angle_step, insc_rad, path, place;
                    for (let i = 0; i < num_segments; ++i) {
                        angle_step = angle * i + start_angle; //Adding Pi to reposition upwards.
                        p1 = Snap.fromPolar(inner_rad, angle_step - angle / 2);
                        p2 = Snap.fromPolar(outer_rad, angle_step - angle / 2);
                        p3 = Snap.fromPolar(outer_rad, angle_step + angle / 2);
                        p4 = Snap.fromPolar(inner_rad, angle_step + angle / 2);

                        d = "M " + p1.x + "," + p1.y +
                            " L " + p2.x + "," + p2.y +
                            " A " + outer_rad + "," + outer_rad + ",0,0,1," + p3.x + "," + p3.y +
                            " L " + p4.x + "," + p4.y +
                            " A " + (inner_rad) + "," + (inner_rad) + ",0,0,0," + p1.x + "," + p1.y;

                        path = this.paper.path(d);
                        if (id) path.attr("id", id + "_" + i);
                        if (style) {
                            if (Array.isArray(style)) {
                                path.attr("style", style[i]);
                            } else if (typeof style === "function") {
                                style(path, group, i, inner_rad, outer_rad, angle_step, angle, [p1, p2, p3, p4]);
                            } else {
                                path.setStyle(style);
                            }
                        }

                        if (class_name) {
                            path.addClass(class_name);
                        }

                        if (group) group.add(path);
                    }

                    return (group) ? group : path;
                };

                /**
                 * Creates a donut-shaped path by subtracting an inner circle from an outer circle.
                 *
                 * @function Snap.Paper#disk
                 * @param {number} cx Centre x coordinate.
                 * @param {number} cy Centre y coordinate.
                 * @param {number} our_rad Outer radius of the disk.
                 * @param {number} inner_rad Inner radius of the disk.
                 * @returns {Snap.Element} Path element representing the disk with even-odd fill rule.
                 */
                Paper.prototype.disk = function (cx, cy, our_rad, inner_rad) {
                    const outer = this.circle(cx, cy, our_rad).toDefs();
                    const inner = this.circle(cx, cy, inner_rad).toDefs();

                    const d = Snap.path.toPath(outer, true) + " " + Snap.path.toPath(inner, true);

                    outer.remove();
                    inner.remove();

                    return this.path(d).attr({fillRule: "evenodd"});
                };

                /**
                 * Places repeated symbols along an arc, rotating each instance to face outward.
                 *
                 * @function Snap.Paper#arcFan
                 * @param {number} rad Radius of the arc.
                 * @param {number} angle Total angular span in degrees.
                 * @param {number} step Number of symbol placements along the arc.
                 * @param {Snap.Element|Object} symbol Element or descriptor used to render each symbol.
                 * @param {Object|Array|function} [style] Styling applied to the generated elements.
                 * @param {string} [id] Base id assigned to the generated elements.
                 * @param {Snap.Element} [group] Group that receives the generated elements.
                 * @returns {Snap.Element} Group containing the repeated symbols.
                 */
                Paper.prototype.arcFan = function (rad, angle, step, symbol, style, id, group) {
                    if (!group) {
                        group = this.g()
                    }

                    if (!id) id = group.getId();

                    let processor;

                    const that = this;
                    if (symbol.paper) {
                        const box = symbol.getBBox();
                        processor = function (p, angle, id) {
                            const copy = symbol.clone().attr("id", id);
                            copy.translate(p.x, p.y, undefined, box.cx, box.y2);
                            copy.rotate(angle, p.x, p.y);
                            return copy;
                        }
                    } else if (symbol.type === "line") {
                        processor = function (p, angle, id) {
                            const p2 = {
                                x: p.x + symbol.l * Math.cos(angle * Math.PI * 2 / 360),
                                y: p.y + symbol.l * Math.sin(angle * Math.PI * 2 / 360)
                            };
                            return that.line(p.x, p.y, p2.x, p2.y).attr("id", id);
                        }
                    } else if (symbol.type === "circle") {
                        processor = function (p, angle, id) {
                            return that.circle(p.x, p.y, symbol.r).attr("id", id);
                        }
                    } else {
                        return undefined;
                    }

                    for (let a = -angle / 2, i = 0, inc = angle / (step - 1); i < step; ++i, a += inc) {
                        const p = Snap.fromPolar(rad, Snap.rad(a));
                        const el = processor(p, a, id + "_" + i);
                        if (style) {
                            if (Array.isArray(style)) {
                                el.attr("style", style[i]);
                            } else if (typeof style === "function") {
                                style(el, group, i, a, p);
                            } else {
                                el.setStyle(style);
                            }
                        }
                        group.add(el);
                    }

                    return group;
                };

                /**
                 * Creates a uniform rectangular grid of `<rect>` elements.
                 *
                 * @function Snap.Paper#grid
                 * @param {number} width Overall grid width.
                 * @param {number} height Overall grid height.
                 * @param {number} rows Number of rows.
                 * @param {number} cols Number of columns.
                 * @param {Object|function} [style] Style map or callback applied to each cell.
                 * @param {string} [id] Base id assigned to generated cells.
                 * @param {Snap.Element} [group] Group that receives the cells.
                 * @returns {Snap.Element} Group containing all generated rectangles.
                 */
                Paper.prototype.grid = function (width, height, rows, cols, style, id, group) {
                    if (!group) {
                        group = this.g()
                    }

                    if (!id) id = group.getId();

                    let style_fun;
                    if (typeof style !== "function") {
                        style_fun = function (rect) {
                            rect.setStyle(style)
                        }
                    } else {
                        style_fun = style;
                    }

                    const rect_w = width / cols;
                    const rect_h = height / rows;

                    for (let i = 0, j, rect; i < cols; ++i) {
                        for (j = 0; j < rows; j++) {
                            rect = this.rect(i * rect_w, j * rect_h, rect_w, rect_h).attr({
                                id: id + "_" + i + "_" + j,
                                position: i + ", " + j
                            });

                            style_fun(rect, i, j);
                            group.add(rect);
                        }
                    }

                    return group;
                };

                /**
                 * Creates a zigzag polyline between two points or across a specified horizontal width.
                 *
                 * @function Snap.Paper#zigzag
                 * @param {Object} p1 Starting point `{x, y}`.
                 * @param {Object|number} p2_width Second point `{x, y}` or horizontal length in pixels.
                 * @param {number} period Length of a single zigzag period.
                 * @param {number} amplitude Vertical displacement from the centre line.
                 * @param {boolean} [reverice=false] When true, inverts the initial zigzag direction.
                 * @returns {Snap.Element} Polyline element representing the zigzag path.
                 */
                Paper.prototype.zigzag = function (p1, p2_width, period, amplitude, reverice) {
                    const p2 = (typeof p2_width === "number") ? {x: p1.x + p2_width, y: p1.y} : p2_width;

                    const length = (typeof p2_width === "number") ? p2_width : Snap.len(p1.x, p1.y, p2.x, p2.y);

                    const num_periods = round(length / period);
                    period = length / num_periods;

                    amplitude = (reverice) ? -amplitude : amplitude;

                    const v = {x: period / 2 * (p2.x - p1.x) / length, y: period / 2 * (p2.y - p1.y) / length};
                    const norm = {x: -amplitude * (p2.y - p1.y) / length, y: amplitude * (p2.x - p1.x) / length};

                    const points = [p1.x, p1.y];
                    for (let i = 1, px, py, amp_dir; i < 2 * num_periods; ++i) {
                        amp_dir = (-1) * (i % 2);
                        px = (i * v.x + p1.x) + (norm.x) * amp_dir;
                        py = (i * v.y + p1.y) + (norm.y) * amp_dir;
                        points.push(px);
                        points.push(py);
                    }
                    points.push(p2.x);
                    points.push(p2.y);

                    return this.polyline(points);
                }
            }
        );

        Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {
            //Add paper functions to elements


            /**
             * If placed as the first argument for an element constructor function called on a element, the new element is
             * placed after current. This overrides the behaviour where the new element will be added inside group-like elements.
             * @type {string}
             */
            Snap.FORCE_AFTER = Snap.FORCE_AFTER || '__force_after';

            /*
            * Functions that should not be transferred to element should have a property "skip" set to true.
            * */

            //Add paper functions to elements

            function paperMetForEl(method) {
                return function () {
                    let force_after = false;
                    if (arguments[0] === Snap.FORCE_AFTER) {
                        force_after = true;
                        Array.prototype.shift.apply(arguments);
                    }
                    const result = method.apply(this, arguments);
                    if (!force_after && this.isGroupLike()) {
                        return result;
                    } else {
                        this.after(result);
                        return result;
                    }

                };
            }

            Paper.paperMetForEl = paperMetForEl;

            //make all paper construction methods work for Elements
            for (var method in Paper.prototype) if (Paper.prototype.hasOwnProperty(
                method)) {
                if (!Paper.prototype[method].skip) {
                    Element.prototype[method] = Element.prototype[method] ||
                        paperMetForEl(Paper.prototype[method]);
                }
            }
        })


    }(typeof window !== "undefined" ? window : (global))
)
;