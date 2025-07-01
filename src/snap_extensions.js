(function (root) {
    let Snap_ia = root.Snap_ia || root.Snap;

    //Global Snap Plugin
    Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {

        const STRICT_MODE = true;
        //Snap Constants
        /**
         * If placed as the first argument for an element constructor function called on a element, the new element is
         * placed after current. This overrides the behaviour where the new element will be added inside of grouplike elements.
         * @type {string}
         */
        Snap.FORCE_AFTER = '__force_after';

        /**
         * Returns a bitmap position indicator of two element. As follows:
         * Bits    Number    Meaning
         000000    0    Elements are identical.
         000001    1    The nodes are in different documents (or one is outside of a document).
         000010    2    Node B precedes Node A.
         000100    4    Node A precedes Node B.
         001000    8    Node B contains Node A.
         010000    16    Node A contains Node B.
         Based on code from: Compare Position - MIT Licensed, John Resig
         * @param a the first element
         * @param b the second element (or this element)
         * @return {number}
         */
        Snap._compareDomPosition = function (a, b) {
            a = a.node || a;
            b = b.node || b;

            return a.compareDocumentPosition ?
                a.compareDocumentPosition(b) :
                a.contains ?
                    (a != b && a.contains(b) && 16) +
                    (a != b && b.contains(a) && 8) +
                    (a.sourceIndex >= 0 && b.sourceIndex >= 0 ?
                        (a.sourceIndex < b.sourceIndex && 4) +
                        (a.sourceIndex > b.sourceIndex && 2) :
                        1)
                    + 0 : 0;
        };

        /**
         * Compares the observable position of two elements (above or below). Note that the observable position is opposite to the DOM order.
         * Care should be used when comparing an element to any parent group, because any element will be counted as
         * below the group.
         * @param a The first element
         * @param b the second
         * @return {number} -1 if a is below b, 1 if a is above b, and 0 if the same.
         */
        Snap.positionComparator = function (a, b) {
            const comp = Snap._compareDomPosition(a, b);
            // console.log("A: " + a.getId(), "B: " + b.getId(), comp, "B<A " + (comp & 2), "A<B " + (comp & 4), "BcA " + (comp & 8), "AcB " + (comp & 16));
            if (comp & 8) {
                return -1;
            }
            if (comp & 16) {
                return 1;
            }
            return (comp & 4) ? -1 :
                (comp & 2) ? 1 : 0;
        };

        Snap.positionComparator.inverse = function (a, b) {
            return Snap.positionComparator(b, a);
        };

        Snap.fromPolar = function (r, phi) {
            return {x: r * Math.cos(phi), y: r * Math.sin(phi)};
        };

        Snap.toPolar = function (x, y) {
            return {
                phi: (Math.atan2(y, x) + 2 * Math.PI) % 2 * Math.PI,
                r: Snap.len(x, y, 0, 0),
            };
        };

        Snap.fromPolar_deg = function (r, phi) {
            let rad = Snap.rad(phi);
            return {x: r * Math.cos(rad), y: r * Math.sin(rad)};
        };

        Snap.toPolar_deg = function (x, y) {
            return {
                phi: Snap.deg(((Math.atan2(y, x) + 2 * Math.PI) % 2 * Math.PI)),
                r: Snap.len(x, y, 0, 0),
            };
        };

        Snap.normalize = function (x, y) {
            if (typeof x === 'object' && x.hasOwnProperty('x')) {
                y = x.y;
                x = x.x;
            }

            const l = Snap.len(x, y, 0, 0);
            if (l === 0) return Snap.zero();

            return {x: x / l, y: y / l};

        };

        Snap.orthogonal = function (x, y, lefthand) {
            if (typeof x === 'object' && x.hasOwnProperty('x')) {
                y = x.y;
                x = x.x;
            }
            if (lefthand) {
                return {x: y, y: -x};
            } else {
                return {x: -y, y: x};
            }
        };

        Snap.v_c_mult = function (c, x, y) {
            if (typeof x == 'object') {
                y = x.y || x[1] || 0;
                x = x.x || x[0] || 0;
            }
            return {x: c * x, y: c * y};
        }

        Snap.v_add = function (x1, y1, x2, y2) {
            if (typeof y1 === 'object') {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == 'object') {
                y1 = x1.y || x1[1] || 0;
                x1 = x1.x || x1[0] || 0;
            }
            return {x: x1 + x2, y: y1 + y2};
        }

        Snap.v_subtract = function (x1, y1, x2, y2) {
            if (typeof y1 === 'object') {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == 'object') {
                y1 = x1.y || x1[1] || 0;
                x1 = x1.x || x1[0] || 0;
            }
            return {x: x1 - x2, y: y1 - y2};
        }

        Snap.v_mid = function (x1, y1, x2, y2) {
            if (typeof y1 === 'object') {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == 'object') {
                y1 = x1.y || x1[1] || 0;
                x1 = x1.x || x1[0] || 0;
            }
            return {x: (x1 + x2) / 2, y: (y1 + y2) / 2};
        }

        Snap.dot = function (x1, y1, x2, y2) {
            if (typeof y1 === 'object') {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == 'object') {
                y1 = x1.y || x1[1] || 0;
                x1 = x1.x || x1[0] || 0;
            }
            return x1 * x2 + y1 * y2;
        }

        Snap.cross = function (x1, y1, x2, y2) {
            if (typeof y1 === 'object') {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == 'object') {
                y1 = x1.y || x1[1] || 0;
                x1 = x1.x || x1[0] || 0;
            }
            return x1 * y2 - x2 * y1;
        }

        Snap.project = function (x1, y1, x2, y2) {
            if (typeof y1 === 'object') {
                x2 = y1.x || y1[0] || 0;
                y2 = y1.y || y1[1] || 0;
            }
            if (typeof x1 == 'object') {
                y1 = x1.y || x1[1] || 0;
                x1 = x1.x || x1[0] || 0;
            }
            let dotProduct = Snap.dot(x1, y1, x2, y2);
            let lengthSquared = Snap.len2(x2, y2);
            let scalar = dotProduct ? dotProduct / lengthSquared : 0;
            return {x: scalar * x2, y: scalar * y2};
        }
        Snap.zero = function () {
            return {x: 0, y: 0};
        }

        Snap.vectorPointToLine = function (p, lp1, lp2, normalize, sq_error) {
            sq_error = sq_error || 1e-5;
            if (Snap.len2(lp1.x, lp1.y, lp2.x, lp2.x) < sq_error) {
                const ret = {x: lp1.x - p.x, y: lp1.y - p.y};
                if (normalize) {

                }
            }
            let x0 = p.x || +p[0] || 0, y0 = p.y || +p[1] || 0,
                x1 = lp1.x || +lp1[0] || 0, y1 = lp1.y || +lp1[1] || 0,
                x2 = lp2.x || +lp2[0] || 0, y2 = lp2.y || +lp2[1] || 0;

            let num = Math.abs(
                (y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1);
            let denum = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

            let distance = num / denum;

            const orthogonal = Snap.orthogonal({x: x2 - x1, y: y2 - y1});
            let norm = Snap.normalize(orthogonal);

            const distance_vector = {
                x: x0 + distance * norm.x,
                y: y0 + distance * norm.y,
            };

            if (Snap.len2(x1, y1, distance_vector.x, distance_vector.y) <
                Snap.len2(x1, y1, x0, y0)) {
                return (normalize) ?
                    norm :
                    {x: distance * norm.x, y: distance * norm.y};  //in this case the norm vector is towards the line
            } else {
                return (normalize) ? {x: -norm.x, y: -norm.y} : {
                    x: -distance * norm.x,
                    y: -distance * norm.y,
                }; // in this case the norm vector is way from the line.
            }
        };

        /**
         * Checks if an angle is between to other angles, where an angle is
         * between when it is withing the smaller segment of the other angles.
         * @param a1 reference angle 1
         * @param a2 reference angle 2
         * @param target the target angle to check
         * @returns {boolean}
         */
        Snap.angle_between = function (a1, a2, target) {
            let dif_1_2 = (Math.abs(a1 - a2) + 360) % 360;
            dif_1_2 > 180 && (dif_1_2 = 360 - dif_1_2);
            let dif_1_t = (Math.abs(a1 - target) + 360) % 360;
            dif_1_t > 180 && (dif_1_t = 360 - dif_1_t);
            let dif_2_t = (Math.abs(a2 - target) + 360) % 360;
            dif_2_t > 180 && (dif_2_t = 360 - dif_2_t);

            return (dif_1_t + dif_2_t) <= dif_1_2 + 1e-12;
        };

        Snap.angle_normalize = function (angle, bwn_neg_pos, rad) {
            if (rad) {
                if (bwn_neg_pos) {
                    angle = (angle + Math.PI) % (2 * Math.PI) - Math.PI;
                    return (angle > -Math.PI) ? angle : -angle;
                } else {
                    return angle - Math.floor(angle / (2 * Math.PI)) * 2 * Math.PI;
                }
            } else {
                if (bwn_neg_pos) {
                    angle = (angle + 180 + 360) % 360 - 180;
                    return angle > -180 ? angle : -angle;
                } else {
                    return (angle >= 0 ? angle : (360 - ((-angle) % 360))) % 360
                }
            }
        }

        Snap.getSafeDistance = function (ct, el, top) {
            // if (top === undefined) top = false;
            const bbox = el.getBBox();
            if (ct.x < bbox.x || ct.x > bbox.x2 || ct.y < bbox.y || ct.y >
                bbox.y2) return 0;
            if (top) return ct.y - bbox.y;
            return Math.max(Snap.len(ct.x, ct.y, bbox.x, bbox.y),
                Snap.len(ct.x, ct.y, bbox.x2, bbox.y),
                Snap.len(ct.x, ct.y, bbox.x, bbox.y2),
                Snap.len(ct.x, ct.y, bbox.x2, bbox.y2));
        };

        Snap.groupToGroupChangeOfBase = function (from, to) {
            const fromMatrix = from.transform().totalMatrix;
            const toMatrix_inv = to.transform().totalMatrix.invert();
            return toMatrix_inv.multLeft(fromMatrix);
        }

        /**
         * Helper function to determine whether there is an intersection between the two polygons described
         * by the lists of vertices. Uses the Separating Axis Theorem
         *
         * @param a an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
         * @param b an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
         * @return true if there is any intersection between the 2 polygons, false otherwise
         */
        Snap.polygonsIntersectConcave = function (a, b) {
            //todo use points
            const polygons = [a, b];
            let minA, maxA, projected, i, i1, j, minB, maxB;

            for (i = 0; i < polygons.length; i++) {

                // for each polygon, look at each edge of the polygon, and determine if it separates
                // the two shapes
                const polygon = polygons[i];
                for (i1 = 0; i1 < polygon.length; i1++) {

                    // grab 2 vertices to create an edge
                    const i2 = (i1 + 1) % polygon.length;
                    const p1 = polygon[i1];
                    const p2 = polygon[i2];

                    // find the line perpendicular to this edge
                    const normal = {x: p2.y - p1.y, y: p1.x - p2.x};

                    minA = maxA = undefined;
                    // for each vertex in the first shape, project it onto the line perpendicular to the edge
                    // and keep track of the min and max of these values
                    for (j = 0; j < a.length; j++) {
                        projected = normal.x * a[j].x + normal.y * a[j].y;
                        if (minA === undefined || projected < minA) {
                            minA = projected;
                        }
                        if (maxA === undefined || projected > maxA) {
                            maxA = projected;
                        }
                    }

                    // for each vertex in the second shape, project it onto the line perpendicular to the edge
                    // and keep track of the min and max of these values
                    minB = maxB = undefined;
                    for (j = 0; j < b.length; j++) {
                        projected = normal.x * b[j].x + normal.y * b[j].y;
                        if (minB === undefined || projected < minB) {
                            minB = projected;
                        }
                        if (maxB === undefined || projected > maxB) {
                            maxB = projected;
                        }
                    }

                    // if there is no overlap between the projects, the edge we are looking at separates the two
                    // polygons, and we know there is no overlap
                    if (maxA < minB || maxB < minA) {
                        // CONSOLE("polygons don't intersect!");
                        return false;
                    }
                }
            }
            return true;
        };

        Snap.polygonExpand = function (points, distance) {
            const expandedPoints = [];
            const numPoints = points.length;

            // Compute the centroid of the polygon
            let centroid = {x: 0, y: 0};
            for (let i = 0; i < numPoints; i++) {
                centroid.x += points[i].x;
                centroid.y += points[i].y;
            }
            centroid.x /= numPoints;
            centroid.y /= numPoints;

            for (let i = 0; i < numPoints; i++) {
                const current = points[i];
                const prev = points[(i - 1 + numPoints) % numPoints];
                const next = points[(i + 1) % numPoints];

                // Calculate normalized direction vectors
                const prevDir = Snap.normalize({x: current.x - prev.x, y: current.y - prev.y});
                const nextDir = Snap.normalize({x: next.x - current.x, y: next.y - current.y});

                // Calculate outward normal vectors by rotating direction vectors 90 degrees
                const prevNormal = {x: -prevDir.y, y: prevDir.x};
                const nextNormal = {x: -nextDir.y, y: nextDir.x};

                // Average the normals to maintain the original angles better
                const offsetDir = Snap.normalize({
                    x: prevNormal.x + nextNormal.x,
                    y: prevNormal.y + nextNormal.y
                });

                // Determine the direction of expansion based on the centroid
                const directionToCentroid = Snap.normalize({
                    x: centroid.x - current.x,
                    y: centroid.y - current.y
                });

                // Ensure the offset direction is outward
                const dotProduct = Snap.dot(offsetDir, directionToCentroid);
                const outwardDir = dotProduct > 0 ? {x: -offsetDir.x, y: -offsetDir.y} : offsetDir;

                // Offset the current point by the distance along the computed direction
                expandedPoints.push({
                    x: current.x + outwardDir.x * distance,
                    y: current.y + outwardDir.y * distance
                });
            }

            return expandedPoints;
        }
        Snap.load = function (url, callback, scope, data, filter, fail, fail_scope, _eve) {
            if (typeof scope === 'function') {
                if (scope.isEve) {
                    _eve = scope;
                    scope = undefined;
                } else {
                    _eve = fail_scope;
                    fail_scope = data;
                    fail = scope;
                    data = undefined;
                    filter = undefined;
                }
            }

            if (typeof data === 'function') {
                if (data.isEve) {
                    _eve = data;
                    data = undefined;
                } else {
                    _eve = fail;
                    fail_scope = filter;
                    fail = data;
                    data = undefined;
                    filter = undefined;
                }
            }

            if (typeof fail_scope === 'function' && fail_scope.isEve) {
                _eve = fail_scope;
                scope = fail_scope;
            }

            if (data) {
                //already processed
                var f = Snap.parse(data, filter);
                scope ? callback.call(scope, f) : callback(f);
            } else {
                let post_data = undefined;
                if (Array.isArray(url)) {
                    post_data = url[1];
                    url = url[0];
                }
                _eve = _eve || eve;
                _eve(['com', 'load'], undefined, url);
                Snap.ajax(url, post_data, function (req) {
                    let data = undefined;
                    if (req.responseText.startsWith('Base64:')) {
                        data = atob(req.responseText.slice(7));
                    }
                    if (req.responseText.startsWith('LZBase64:')) {
                        if (window.LZString !== undefined) {
                            data = LZString.decompressFromBase64(req.responseText.slice(9));
                        } else {
                            fail.call(fail_scope, 'LZString is not loaded');
                            return;
                        }
                    }
                    const f = Snap.parse(data || req.responseText, filter);
                    scope ?
                        callback.call(scope, f, data || req.responseText) :
                        callback(f, data || req.responseText);
                }, undefined, fail, fail_scope);
            }
        };


        function decode_json(json, decript = undefined, map = undefined, system = undefined) {
            let attr = (system && (system.attr || system.attributes)) || "A";
            let type = (system && system.type) || "T";
            let children = (system && system.children) || "C";

            if (typeof json === "string") {
                try {
                    json = JSON.parse(json);
                } catch (e) {
                    return "";
                }
            }

            let xmlStr = "";

            if (!map && json['_']) {
                map = json['_'];
            }

            if (!map || typeof map !== "object") {
                throw new Error("No map provided");
            }

            if (decript && typeof decript === "function") {
                map = decript(map);
            }

            const typeName = map[json[type]] || json[type];

            if (typeName === 'svg') {
                xmlStr += "<svg";
            } else {
                xmlStr += "<" + typeName;
            }

            if (json[attr]) {
                for (const [key, value] of Object.entries(json[attr])) {
                    let attribute = map[key] || key;
                    if (typeof value === "object") {
                        let valueStr = "";
                        for (const [styleKey, styleValue] of Object.entries(value)) {
                            let styleAttr = map[styleKey] || styleKey;
                            if (typeof styleValue === "object") {
                                let styleValueStr = "";
                                for (const [styleKey2, styleValue2] of Object.entries(styleValue)) {
                                    let styleAttr2 = map[styleKey2] || styleKey2;
                                    styleValueStr += `${styleAttr2}:${styleValue2};`;
                                }
                                valueStr += `${styleAttr}:${styleValueStr}`;
                            } else {
                                valueStr += `${styleAttr}:${styleValue};`;
                            }
                        }
                        xmlStr += ` ${attribute}="${valueStr}"`;
                    } else {
                        xmlStr += ` ${attribute}="${value}"`;
                    }
                }
            }

            if (json[children]) {
                xmlStr += ">";
                let text_added = false;
                for (const child of json[children]) {
                    if (typeof child === "string") {
                        xmlStr += (text_added ? '\n' : "") + child;
                        text_added = true;
                    } else {
                        xmlStr += decode_json(child, decript, map, system);
                        text_added = false;
                    }
                }
                xmlStr += `</${typeName}>`;
            } else {
                xmlStr += "/>";
            }

            return xmlStr;
        }

        Snap.jsonToSvg = decode_json;

        Snap.rgb2cmyk = function (r, g, b) {
            let computedC = 0;
            let computedM = 0;
            let computedY = 0;
            let computedK = 0;

            if (r == null || g == null || b == null ||
                isNaN(r) || isNaN(g) || isNaN(b)) {
                // alert ('Please enter numeric RGB values!');
                return {c: 0, m: 0, y: 0, k: 0};
            }
            if (r < 0 || g < 0 || b < 0 || r > 1 || g > 1 || b > 1) {
                // alert ('RGB values must be in the range 0 to 255.');
                return {c: 0, m: 0, y: 0, k: 0};
            }

            // BLACK
            if (r === 0 && g === 0 && b === 0) {
                computedK = 1;
                return {c: 0, m: 0, y: 0, k: 1};
            }

            computedC = 1 - (r);
            computedM = 1 - (g);
            computedY = 1 - (b);

            const minCMY = Math.min(computedC,
                Math.min(computedM, computedY));
            computedC = (computedC - minCMY) / (1 - minCMY);
            computedM = (computedM - minCMY) / (1 - minCMY);
            computedY = (computedY - minCMY) / (1 - minCMY);
            computedK = minCMY;

            return {c: computedC, m: computedM, y: computedY, k: computedK};
        };

        Snap.cmykToRgb = function (c, m, y, k) {

            let result = {r: 0, g: 0, b: 0};

            result.r = round((1 - c) * (1 - k) * 255);
            result.g = round((1 - m) * (1 - k) * 255);
            result.b = round((1 - y) * (1 - k) * 255);

            return result;
        };

        /**
         * Changes the format of style from string to object and vice versa
         * @param {String | Object} style a string or object presentation of a style
         * @return {String | Object} returns an object or string presentation of the style respectively
         */
        Snap.convertStyleFormat = function (style) {
            let result;
            if (!style) return {};
            if (typeof style === 'string') {
                result = {};
                const coms = style.split(';');
                let i = 0, com;
                for (; i < coms.length; ++i) {
                    com = coms[i].split(':');
                    if (com.length === 2) result[com[0].replace(/\s/g,
                        '')] = com[1].replace(/\s/g, '');
                }
                return result;
            } else if (typeof style === 'object') {
                result = [];
                for (let stl in style) {
                    if (style.hasOwnProperty(stl)) {
                        result.push(stl + ':' + style[stl]);
                    }
                }
                return result.join(';');
            }

        };

        Snap.camelToHyphen = function (str) {
            return str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
        }

        Snap.toCamelCase = function (str) {
            return str.replace(/[-_]+([a-z])/gi, function ($1, letter) {
                return letter.toUpperCase();
            });
        }

        Snap.waitFor = function (condition, callback, timelimit, fail_callback) {
            timelimit = timelimit || 1000;
            let step = 10;
            if (Array.isArray(timelimit)) {
                step = (typeof timelimit[1] === 'number') ? timelimit[1] : step;
                timelimit = (typeof timelimit[0] === 'number') ?
                    timelimit[0] :
                    1000;
            }
            const start_time = Date.now();
            let timer = setInterval(function () {
                if (condition()) {
                    clearInterval(timer);
                    // console.log("Success waiting");
                    callback();
                } else if (Date.now() - start_time > timelimit) {
                    clearInterval(timer);
                    if (fail_callback) fail_callback();
                }
            }, step);
        };


        /**
         * Validate url format
         * @param url_string the url string
         * @param relative whether to validate a relative string
         * @return {boolean} true iff a valid url
         */

        Snap.isUrl = function (url_string, relative) {
            if (relative) {
                const pattern = /^(?!www\.|(?:http|ftp)s?:\/\/|[A-Za-z]:\\|\/\/)[^\s]*$/;
                return pattern.test(url_string);
            } else {
                try {
                    new URL(url_string);
                    return true;
                } catch (_) {
                    return false;
                }
            }
        }

        Snap.isEmptyObject = function (obj) {
            for (var prop in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                    return false;
                }
            }
            return true;
        }

        const htmlEntities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&#38;': '&',
            '&#60;': '<',
            '&#62;': '>'
            // '&quot;': '"',
            // '&#39;': "'"
        };
        Snap.AI_name_fix = function (str) {
            if (!str) return '';
            const result = str.replace(/_(x[0-9A-F]{2})_/g, function (_, b) {
                return String.fromCharCode('0' + b);
            }).replace(/(.+)(_\d+_)$/, function (_, id) {
                return id;
            }).replace(/&[a-zA-Z0-9#]+;/g, function (match) {
                return htmlEntities[match] || match;
            });
            return result.replace(/ /g, '_');

        };

        Snap.dimFromElement = function (el, dim) {
            if (!Snap.is(el, 'Element')) return el;
            return el.getBBox()[dim];
        }

        Snap.varDimension = function (str, space, negative) {

            if (typeof str === "number") return str;

            let max = Infinity, min = 0;
            if (Array.isArray(str)) {
                min = str[1] || 0;
                max = str[2] || Infinity;
                str = str[0];
            }

            const repls_percent = function (a, b) {
                b = b.replace('%', '');
                return String(space * b / 100);
            };
            const reg_percent = /(\d*\.?\d*%)/g;
            str = str.replace(reg_percent, repls_percent);

            try {
                if (typeof max === 'string') max = math.evaluate(
                    max.replace(reg_percent, repls_percent));
            } catch (e) {
                max = Infinity;
            }

            try {
                if (typeof min === 'string') min = math.evaluate(
                    min.replace(reg_percent, repls_percent));
            } catch (e) {
                min = 0;
            }

            try {
                str = math.evaluate(str);
            } catch (e) {
                str = space;
            }

            if (negative) {
                return Math.min(Math.max(str, -max), max);
            }
            return Math.min(Math.max(str, min), max);
        }

    });


    //Matrix functions
    Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {
        //Matrix Extentions

        Snap.Matrix.prototype.apply = function (point, node) {
            let ret = {};
            ret.x = this.x(point.x || point[0] || 0, point.y || +point[1] || 0);
            ret.y = this.y(point.x || point[0] || 0, point.y || point[1] || 0);
            return ret;
        };


        Snap.Matrix.prototype.twoPointTransform = function (
            p1_x, p1_y, p2_x, p2_y, toP1_x, toP1_y, toP2_x, toP2_y) {
            const l1 = [p2_x - p1_x, p2_y - p1_y],
                l2 = [toP2_x - toP1_x, toP2_y - toP1_y];

            const scale = (Snap.len(l2[0], l2[1]) /
                (Snap.len(l1[0], l1[1]) || 1e-12));
            let angle = Snap.angle(l1[0], l1[1], l2[0], l2[1], 0, 0);

            const eq_matrix = [
                [p1_x, -p1_y, 1, 0],
                [p1_y, p1_x, 0, 1],
                [p2_x, -p2_y, 1, 0],
                [p2_y, p2_x, 0, 1],
            ];
            let solution;
            try {
                solution = math.lusolve(eq_matrix,
                    [toP1_x, toP1_y, toP2_x, toP2_y]).map((c) => c[0]);
            } catch (e) {
                return null;
            }

            this.a = solution[0];
            this.b = solution[1];
            this.c = -solution[1];
            this.d = solution[0];
            this.e = solution[2];
            this.f = solution[3];

            return this;
        };
    })

}(typeof window !== "undefined" ? window : (global)))