(function (root) {
//Global Snap Plugin
    Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {

        const STRICT_MODE = true;

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

        let _ = {};

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
            if (l === 0) return {x: 0, y: 0};

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

        Snap.angle_between = function (a1, a2, target) {
            let dif_1_2 = (Math.abs(a1 - a2) + 360) % 360;
            dif_1_2 > 180 && (dif_1_2 = 360 - dif_1_2);
            let dif_1_t = (Math.abs(a1 - target) + 360) % 360;
            dif_1_t > 180 && (dif_1_t = 360 - dif_1_t);
            let dif_2_t = (Math.abs(a2 - target) + 360) % 360;
            dif_2_t > 180 && (dif_2_t = 360 - dif_2_t);

            return (dif_1_t + dif_2_t) <= dif_1_2 + 1e-12;
        };

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

        Snap.load = function (
            url, callback, scope, data, filter, fail, fail_scope) {
            if (typeof scope === 'function') {
                fail_scope = data;
                fail = scope;
                data = undefined;
                filter = undefined;
            }

            if (typeof data === 'function') {
                fail_scope = filter;
                fail = data;
                data = undefined;
                filter = undefined;
            }

            if (data) {
                //already processed
                var f = Snap.parse(data, filter);
                scope ? callback.call(scope, f) : callback(f);
            } else {
                eve(['com', 'load'], undefined, url);
                Snap.ajax(url, function (req) {
                    const f = Snap.parse(req.responseText, filter);
                    scope ?
                        callback.call(scope, f, req.responseText) :
                        callback(f, req.responseText);
                }, undefined, fail, fail_scope);
            }
        };

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

            const url_regex = /^[a-z](?:[-a-z0-9\+\.])*:(?:\/\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:])*@)?(?:\[(?:(?:(?:[0-9a-f]{1,4}:){6}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|::(?:[0-9a-f]{1,4}:){5}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|v[0-9a-f]+\.[-a-z0-9\._~!\$&'\(\)\*\+,;=:]+)\]|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3}|(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=])*)(?::[0-9]*)?(?:\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))*)*|\/(?:(?:(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))+)(?:\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))*)*)?|(?:(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))+)(?:\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))*)*|(?!(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@])))(?:\?(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@])|[\uE000-\uF8FF\uF0000-\uFFFFD\u100000-\u10FFFD\/\?])*)?(?:\#(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@])|[\/\?])*)?$/i;

            const url_relative_regex = /^(?:[a-z](?:[-a-z0-9\+\.])*:(?:\/\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:])*@)?(?:\[(?:(?:(?:[0-9a-f]{1,4}:){6}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|::(?:[0-9a-f]{1,4}:){5}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|v[0-9a-f]+\.[-a-z0-9\._~!\$&'\(\)\*\+,;=:]+)\]|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3}|(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=])*)(?::[0-9]*)?(?:\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))*)*|\/(?:(?:(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))+)(?:\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))*)*)?|(?:(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))+)(?:\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))*)*|(?!(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@])))(?:\?(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@])|[\uE000-\uF8FF\uF0000-\uFFFFD\u100000-\u10FFFD\/\?])*)?(?:\#(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@])|[\/\?])*)?|(?:\/\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:])*@)?(?:\[(?:(?:(?:[0-9a-f]{1,4}:){6}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|::(?:[0-9a-f]{1,4}:){5}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3})|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|v[0-9a-f]+\.[-a-z0-9\._~!\$&'\(\)\*\+,;=:]+)\]|(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])(?:\.(?:[0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])){3}|(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=])*)(?::[0-9]*)?(?:\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))*)*|\/(?:(?:(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))+)(?:\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))*)*)?|(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=@])+)(?:\/(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@]))*)*|(?!(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@])))(?:\?(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@])|[\uE000-\uF8FF\uF0000-\uFFFFD\u100000-\u10FFFD\/\?])*)?(?:\#(?:(?:%[0-9a-f][0-9a-f]|[-a-z0-9\._~\uA0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u10000-\u1FFFD\u20000-\u2FFFD\u30000-\u3FFFD\u40000-\u4FFFD\u50000-\u5FFFD\u60000-\u6FFFD\u70000-\u7FFFD\u80000-\u8FFFD\u90000-\u9FFFD\uA0000-\uAFFFD\uB0000-\uBFFFD\uC0000-\uCFFFD\uD0000-\uDFFFD\uE1000-\uEFFFD!\$&'\(\)\*\+,;=:@])|[\/\?])*)?)$/i;

            return (relative) ?
                url_relative_regex.test(url_string) :
                url_regex.test(url_string);
        };


        Snap.AI_name_fix = function (str) {
            if (!str) return '';
            const result = str.replace(/_(x[0-9A-F]{2})_/g, function (_, b) {
                return String.fromCharCode('0' + b);
            }).replace(/(.+)(_\d+_)$/, function (_, id) {
                return id;
            });
            return result;
        };

    });

    //Matrix functions
    Snap_ia.plugin(function (Snap, Element, Paper, global, Fragment, eve) {
        //Matrix Extentions

        Snap.Matrix.prototype.apply = function (point, node) {
            let ret = {};
            // if (node === undefined) {
            //     ret = {x: 0, y: 0};
            // } else {
            //     ret = _.svgPoint(node);
            // }
            ret.x = this.x(point.x || point[0] || 0, point.y || +point[1] || 0);
            ret.y = this.y(point.x || point[0] || 0, point.y || point[1] || 0);
            return ret;
        };

        Snap.Matrix.prototype.isIdentity = function () {
            return this.a === 1 && !this.b && !this.c && this.d === 1 &&
                !this.e && !this.f;
        };

        Snap.Matrix.prototype.toArray = function () {
            return [this.a, this.b, this.c, this.d, this.e, this.f];
        };

        Snap.Matrix.prototype.equals = function (m) {
            return this.a === m.a && this.b === m.b && this.c === m.c &&
                this.d === m.d && this.e === m.e && this.f === m.f;
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

}(window || this))