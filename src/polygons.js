
/**
 * @fileoverview Polygon intersection and geometric operations library
 * Based on https://github.com/vrd/js-intersect
 * Provides functions for polygon intersection, point-in-polygon testing, and related geometric calculations.
 * 
 * @typedef {Object} Point
 * @property {Number} x - X coordinate
 * @property {Number} y - Y coordinate
 * @property {Number} [t] - Parametric position along edge (0-1)
 * @property {Number} [theta] - Polar angle for point classification
 * 
 * @typedef {Array<Point>} Polygon
 * Array of points representing polygon vertices in order
 * 
 * @typedef {Array<Point>} Edge
 * Array of exactly two points representing an edge
 */

//code based on https://github.com/vrd/js-intersect

Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    /**
     * Namespace for polygon-related operations
     * @namespace Snap.polygons
     */
    Snap.polygons = Snap.polygons || {}
    
    /**
     * Finds the intersection of two polygons
     * @function intersect
     * @memberof Snap.polygons
     * @param {Array<Point>} fig1 - First polygon as array of points
     * @param {Array<Point>} fig2 - Second polygon as array of points
     * @returns {Array<Array<Point>>|false} Array of intersection polygons or false if no intersection
     * @example
     * const poly1 = [{x: 0, y: 0}, {x: 10, y: 0}, {x: 10, y: 10}, {x: 0, y: 10}];
     * const poly2 = [{x: 5, y: 5}, {x: 15, y: 5}, {x: 15, y: 15}, {x: 5, y: 15}];
     * const intersection = Snap.polygons.intersect(poly1, poly2);
     */
    function intersect(fig1, fig2) {
        let fig2a = alignPolygon(fig2, fig1);
        if (!checkPolygons(fig1, fig2a)) {
            return false;
        }
        const edges = edgify(fig1, fig2a);
        const polygons = polygonate(edges);
        const filteredPolygons = filterPolygons(polygons, fig1, fig2a, "intersect");
        return filteredPolygons;
    }

    Snap.polygons.intersect = intersect;

    /**
     * Aligns vertices of one polygon with vertices of another polygon within tolerance
     * @function alignPolygon
     * @private
     * @param {Array<Point>} polygon - Polygon to align
     * @param {Array<Point>} points - Reference points for alignment
     * @returns {Array<Point>} Aligned polygon
     */
    function alignPolygon(polygon, points) {
        for (let i = 0; i < polygon.length; i++) {
            for (let j = 0; j < points.length; j++) {
                if (distance(polygon[i], points[j]) < 0.00000001)
                    polygon[i] = points[j];
            }
        }
        return polygon;
    }

    /**
     * Calculates Euclidean distance between two points
     * @function distance
     * @private
     * @param {Point} p1 - First point
     * @param {Point} p2 - Second point
     * @returns {Number} Distance between the points
     */
    function distance(p1, p2) {
        const dx = Math.abs(p1.x - p2.x);
        const dy = Math.abs(p1.y - p2.y);
        return Math.sqrt(dx*dx + dy*dy);
    }

    /**
     * Validates that polygons have at least 3 vertices
     * @function checkPolygons
     * @private
     * @param {Array<Point>} fig1 - First polygon
     * @param {Array<Point>} fig2 - Second polygon
     * @returns {Boolean} True if both polygons are valid, false otherwise
     */
    //check polygons for correctness
    function checkPolygons(fig1, fig2) {
        const figs = [fig1, fig2];
        for (let i = 0; i < figs.length; i++) {
            if (figs[i].length < 3) {
                console.error("Polygon " + (i+1) + " is invalid!");
                return false;
            }
        }
        return true;
    }

    /**
     * Creates array of all polygon edges with intersection points
     * @function edgify
     * @private
     * @param {Array<Point>} fig1 - First polygon
     * @param {Array<Point>} fig2 - Second polygon
     * @returns {Array<Array<Point>>} Array of edge segments
     */
    //create array of edges of all polygons
    function edgify(fig1, fig2) {
        //create primary array from all edges
        const primEdges = getEdges(fig1).concat(getEdges(fig2));
        const secEdges = [];
        //check every edge
        for(let i = 0; i < primEdges.length; i++) {
            let points = [];
            //for intersection with every edge except itself
            for(let j = 0; j < primEdges.length; j++) {
                if (i != j) {
                    const interPoints = findEdgeIntersection(primEdges[i], primEdges[j]);
                    addNewPoints(interPoints, points);
                }
            }
            //add start and end points to intersection points
            startPoint = primEdges[i][0];
            startPoint.t = 0;
            endPoint = primEdges[i][1];
            endPoint.t = 1;
            addNewPoints([startPoint, endPoint], points);
            //sort all points by position on edge
            points = sortPoints(points);
            //break edge to parts
            for (let k = 0; k < points.length - 1; k++) {
                const edge = [
                    {x: points[k].x, y: points[k].y},
                    {x: points[k + 1].x, y: points[k + 1].y}
                ];
                // check for existanse in sec.array
                if (!edgeExists(edge, secEdges)) {
                    //push if not exists
                    secEdges.push(edge);
                }
            }
        }
        return secEdges;
    }

    /**
     * Adds new unique points to a points array
     * @function addNewPoints
     * @private
     * @param {Array<Point>} newPoints - Points to add
     * @param {Array<Point>} points - Existing points array
     */
    function addNewPoints(newPoints, points) {
        if (newPoints.length > 0) {
            //check for uniqueness
            for (let k = 0; k < newPoints.length; k++) {
                if (!pointExists(newPoints[k], points)) {
                    points.push(newPoints[k]);
                }
            }
        }
    }

    /**
     * Sorts points along an edge by their parametric position (t value)
     * @function sortPoints
     * @private
     * @param {Array<Point>} points - Points with t values to sort
     * @returns {Array<Point>} Sorted points array
     */
    function sortPoints(points) {
        const p = points;
        p.sort((a,b) => {
            if (a.t > b.t) return 1;
            if (a.t < b.t) return -1;
        });
        return p;
    }

    /**
     * Converts polygon vertices to array of edges
     * @function getEdges
     * @private
     * @param {Array<Point>} fig - Polygon vertices
     * @returns {Array<Array<Point>>} Array of edges, each edge is array of two points
     */
    function getEdges(fig) {
        const edges = [];
        const len = fig.length;
        for (let i = 0; i < len; i++) {
            edges.push([
                {x: fig[(i % len)].x, y: fig[(i % len)].y},
                {x: fig[((i+1) % len)].x, y: fig[((i+1) % len)].y}
            ]);
        }
        return edges;
    }

    /**
     * Finds intersection points between two edges
     * @function findEdgeIntersection
     * @private
     * @param {Array<Point>} edge1 - First edge as array of two points
     * @param {Array<Point>} edge2 - Second edge as array of two points
     * @returns {Array<Point>} Array of intersection points with t parameter
     */
    function findEdgeIntersection(edge1, edge2) {
        const x1 = edge1[0].x;
        const x2 = edge1[1].x;
        const x3 = edge2[0].x;
        const x4 = edge2[1].x;
        const y1 = edge1[0].y;
        const y2 = edge1[1].y;
        const y3 = edge2[0].y;
        const y4 = edge2[1].y;
        const nom1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
        const nom2 = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);
        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        const t1 = nom1 / denom;
        const t2 = nom2 / denom;
        const interPoints = [];
        //1. lines are parallel or edges don't intersect
        if (((denom === 0) && (nom1 !== 0)) || (t1 <= 0) || (t1 >= 1) || (t2 < 0 ) || (t2 > 1)) {
            return interPoints;
        }
        //2. lines are collinear
        else if ((nom1 === 0) && (denom === 0)) {
            //check if endpoints of edge2 lies on edge1
            for (var i = 0; i < 2; i++) {
                var classify = classifyPoint(edge2[i], edge1);
                //find position of this endpoints relatively to edge1
                if (classify.loc == "ORIGIN" || classify.loc == "DESTINATION") {
                    interPoints.push({x: edge2[i].x, y: edge2[i].y, t: classify.t});
                }
                else if (classify.loc == "BETWEEN") {
                    x = +((x1 + classify.t*(x2 - x1)).toPrecision(10));
                    y = +((y1 + classify.t*(y2 - y1)).toPrecision(10));
                    interPoints.push({x: x, y: y, t: classify.t});
                }
            }
            return interPoints;
        }
        //3. edges intersect
        else {
            for (var i = 0; i < 2; i++) {
                var classify = classifyPoint(edge2[i], edge1);
                if (classify.loc == "ORIGIN" || classify.loc == "DESTINATION") {
                    interPoints.push({x: edge2[i].x, y: edge2[i].y, t: classify.t});
                }
            }
            if (interPoints.length > 0) {
                return interPoints;
            }
            var x = +((x1 + t1*(x2 - x1)).toPrecision(10));
            var y = +((y1 + t1*(y2 - y1)).toPrecision(10));
            interPoints.push({x: x, y: y, t: t1});
            return interPoints;
        }
        return interPoints;
    }

    /**
     * Classifies position of a point relative to an edge
     * @function classifyPoint
     * @private
     * @param {Point} p - Point to classify
     * @param {Array<Point>} edge - Edge as array of two points
     * @returns {Object} Classification result with location and theta/t values
     */
    function classifyPoint(p, edge) {
        const ax = edge[1].x - edge[0].x;
        const ay = edge[1].y - edge[0].y;
        const bx = p.x - edge[0].x;
        const by = p.y - edge[0].y;
        const sa = ax * by - bx * ay;
        if ((p.x === edge[0].x) && (p.y === edge[0].y)) {
            return {loc: "ORIGIN", t: 0};
        }
        if ((p.x === edge[1].x) && (p.y === edge[1].y)) {
            return {loc: "DESTINATION", t: 1};
        }
        let theta = (polarAngle([edge[1], edge[0]]) -
            polarAngle([{x: edge[1].x, y: edge[1].y}, {x: p.x, y: p.y}])) % 360;
        if (theta < 0) {
            theta = theta + 360;
        }
        if (sa < -0.0000000001) {
            return {loc: "LEFT", theta: theta};
        }
        if (sa > 0.00000000001) {
            return {loc: "RIGHT", theta: theta};
        }
        if (((ax * bx) < 0) || ((ay * by) < 0)) {
            return {loc: "BEHIND", theta: 0};
        }
        if ((Math.sqrt(ax * ax + ay * ay)) < (Math.sqrt(bx * bx + by * by))) {
            return {loc: "BEYOND", theta: 180};
        }
        let t;
        if (ax !== 0) {
            t = bx/ax;
        } else {
            t = by/ay;
        }
        return {loc: "BETWEEN", t: t};
    }

    /**
     * Calculates polar angle of an edge in degrees
     * @function polarAngle
     * @private
     * @param {Array<Point>} edge - Edge as array of two points
     * @returns {Number|Boolean} Angle in degrees or false if zero-length edge
     */
    function polarAngle(edge) {
        const dx = edge[1].x - edge[0].x;
        const dy = edge[1].y - edge[0].y;
        if ((dx === 0) && (dy === 0)) {
            //console.error("Edge has zero length.");
            return false;
        }
        if (dx === 0) {
            return ((dy > 0) ? 90 : 270);
        }
        if (dy === 0) {
            return ((dx > 0) ? 0 : 180);
        }
        const theta = Math.atan(dy / dx) * 360 / (2 * Math.PI);
        if (dx > 0) {
            return ((dy >= 0) ? theta : theta + 360);
        } else {
            return (theta + 180);
        }
    }

    /**
     * Checks if a point exists in an array of points
     * @function pointExists
     * @private
     * @param {Point} p - Point to check
     * @param {Array<Point>} points - Array of points to search
     * @returns {Boolean} True if point exists, false otherwise
     */
    function pointExists(p, points) {
        if (points.length === 0) {
            return false;
        }
        for (let i = 0; i < points.length; i++) {
            if ((p.x === points[i].x) && (p.y === points[i].y)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if an edge exists in an array of edges
     * @function edgeExists
     * @private
     * @param {Array<Point>} e - Edge to check
     * @param {Array<Array<Point>>} edges - Array of edges to search
     * @returns {Boolean} True if edge exists, false otherwise
     */
    function edgeExists(e, edges) {
        if (edges.length === 0) {
            return false;
        }
        for (let i = 0; i < edges.length; i++) {
            if (equalEdges(e, edges[i]))
                return true;
        }
        return false;
    }

    /**
     * Compares two edges for equality (considering both directions)
     * @function equalEdges
     * @private
     * @param {Array<Point>} edge1 - First edge
     * @param {Array<Point>} edge2 - Second edge
     * @returns {Boolean} True if edges are equal, false otherwise
     */
    function equalEdges(edge1, edge2) {
        if (((edge1[0].x === edge2[0].x) &&
            (edge1[0].y === edge2[0].y) &&
            (edge1[1].x === edge2[1].x) &&
            (edge1[1].y === edge2[1].y)) || (
            (edge1[0].x === edge2[1].x) &&
            (edge1[0].y === edge2[1].y) &&
            (edge1[1].x === edge2[0].x) &&
            (edge1[1].y === edge2[0].y))) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Creates polygons from an array of edges using edge-following algorithm
     * @function polygonate
     * @private
     * @param {Array<Array<Point>>} edges - Array of edges
     * @returns {Array<Array<Point>>} Array of polygons found
     */
    function polygonate(edges) {
        const polygons = [];
        let polygon = [];
        const len = edges.length;
        const midpoints = getMidpoints(edges);
        //start from every edge and create non-selfintersecting polygons
        for (let i = 0; i < len - 2; i++) {
            const org = {x: edges[i][0].x, y: edges[i][0].y};
            const dest = {x: edges[i][1].x, y: edges[i][1].y};
            let currentEdge = i;
            let point;
            let p;
            let direction;
            let stop;
            //while we havn't come to the starting edge again
            for (direction = 0; direction < 2; direction++) {
                polygon = [];
                stop = false;
                while ((polygon.length === 0) || (!stop)) {
                    //add point to polygon
                    polygon.push({x: org.x, y: org.y});
                    point = undefined;
                    //look for edge connected with end of current edge
                    for (let j = 0; j < len; j++) {
                        p = undefined;
                        //except itself
                        if (!equalEdges(edges[j], edges[currentEdge])) {
                            //if some edge is connected to current edge in one endpoint
                            if ((edges[j][0].x === dest.x) && (edges[j][0].y === dest.y)) {
                                p = edges[j][1];
                            }
                            if ((edges[j][1].x === dest.x) && (edges[j][1].y === dest.y)) {
                                p = edges[j][0];
                            }
                            //compare it with last found connected edge for minimum angle between itself and current edge
                            if (p) {
                                const classify = classifyPoint(p, [org, dest]);
                                //if this edge has smaller theta then last found edge update data of next edge of polygon
                                if (!point ||
                                    ((classify.theta < point.theta) && (direction === 0)) ||
                                    ((classify.theta > point.theta) && (direction === 1))) {
                                    point = {x: p.x, y: p.y, theta: classify.theta, edge: j};
                                }
                            }
                        }
                    }
                    //change current edge to next edge
                    org.x = dest.x;
                    org.y = dest.y;
                    dest.x = point.x;
                    dest.y = point.y;
                    currentEdge = point.edge;
                    //if we reach start edge
                    if ((org.x == edges[i][0].x) &&
                        (org.y == edges[i][0].y) &&
                        (dest.x == edges[i][1].x) &&
                        (dest.y == edges[i][1].y)) {
                        stop = true;
                        //check polygon for correctness
                        /*for (var k = 0; k < allPoints.length; k++) {
                          //if some point is inside polygon it is incorrect
                          if ((!pointExists(allPoints[k], polygon)) && (findPointInsidePolygon(allPoints[k], polygon))) {
                            polygon = false;
                          }
                        }*/
                        for (k = 0; k < midpoints.length; k++) {
                            //if some midpoint is inside polygon (edge inside polygon) it is incorrect
                            if (findPointInsidePolygon(midpoints[k], polygon)) {
                                polygon = false;
                            }
                        }
                    }
                }
                //add created polygon if it is correct and was not found before
                if (polygon && !polygonExists(polygon, polygons)) {
                    polygons.push(polygon);
                }
            }
        }
        //console.log("polygonate: " + JSON.stringify(polygons));
        return polygons;
    }

    /**
     * Checks if a polygon already exists in an array of polygons
     * @function polygonExists
     * @private
     * @param {Array<Point>} polygon - Polygon to check
     * @param {Array<Array<Point>>} polygons - Array of polygons to search
     * @returns {Boolean} True if polygon exists, false otherwise
     */
    function polygonExists(polygon, polygons) {
        //if array is empty element doesn't exist in it
        if (polygons.length === 0) return false;
        //check every polygon in array
        for (let i = 0; i < polygons.length; i++) {
            //if lengths are not same go to next element
            if (polygon.length !== polygons[i].length) continue;
            //if length are same need to check
            else {
                //if all the points are same
                for (let j = 0; j < polygon.length; j++) {
                    //if point is not found break forloop and go to next element
                    if (!pointExists(polygon[j], polygons[i])) break;
                    //if point found
                    else {
                        //and it is last point in polygon we found polygon in array!
                        if (j === polygon.length - 1) return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Filters polygons based on intersection mode and position relative to input polygons
     * @function filterPolygons
     * @private
     * @param {Array<Array<Point>>} polygons - Array of polygons to filter
     * @param {Array<Point>} fig1 - First input polygon
     * @param {Array<Point>} fig2 - Second input polygon
     * @param {String} mode - Filter mode: "intersect", "cut1", "cut2", or "sum"
     * @returns {Array<Array<Point>>} Filtered polygons array
     */
    function filterPolygons(polygons, fig1, fig2, mode) {
        const filtered = [];
        let c1, c2;
        let point;
        const bigPolygons = removeSmallPolygons(polygons, 0.0001);
        for(let i = 0; i < bigPolygons.length; i++) {
            point = getPointInsidePolygon(bigPolygons[i]);
            c1 = findPointInsidePolygon(point, fig1);
            c2 = findPointInsidePolygon(point, fig2);
            if (
                ((mode === "intersect") && c1 && c2) || //intersection
                ((mode === "cut1") && c1 && !c2) ||     //fig1 - fig2
                ((mode === "cut2") && !c1 && c2) ||     //fig2 - fig2
                ((mode === "sum") && (c1 || c2))) {     //fig1 + fig2
                filtered.push(bigPolygons[i]);
            }
        }
        //console.log("filtered: " + JSON.stringify(filtered));
        return filtered;
    }

    /**
     * Removes polygons smaller than minimum area threshold
     * @function removeSmallPolygons
     * @private
     * @param {Array<Array<Point>>} polygons - Array of polygons
     * @param {Number} minSize - Minimum area threshold
     * @returns {Array<Array<Point>>} Array of polygons above threshold
     */
    function removeSmallPolygons(polygons, minSize) {
        const big = [];
        for (let i = 0; i < polygons.length; i++) {
            if (polygonArea(polygons[i]) >= minSize) {
                big.push(polygons[i]);
            }
        }
        return big;
    }

    /**
     * Calculates the area of a polygon using the shoelace formula
     * @function polygonArea
     * @memberof Snap.polygons
     * @param {Array<Point>} p - Polygon vertices
     * @returns {Number} Area of the polygon
     * @example
     * const square = [{x: 0, y: 0}, {x: 10, y: 0}, {x: 10, y: 10}, {x: 0, y: 10}];
     * const area = Snap.polygons.polygonArea(square); // Returns 100
     */
    function polygonArea(p) {
        const len = p.length;
        let s = 0;
        for (let i = 0; i < len; i++) {
            s += Math.abs((p[i % len].x * p[(i + 1) % len].y) - (p[i % len].y *
                p[(i + 1) % len].x));
        }
        return s/2;
    }

    Snap.polygons.polygonArea = polygonArea;

    /**
     * Finds a point guaranteed to be inside a polygon
     * @function getPointInsidePolygon
     * @private
     * @param {Array<Point>} polygon - Polygon vertices
     * @returns {Point|undefined} Point inside polygon or undefined if none found
     */
    function getPointInsidePolygon(polygon) {
        let point;
        const size = getSize(polygon);
        const edges = getEdges(polygon);
        let y = size.y.min + (size.y.max - size.y.min) / Math.PI;
        const dy = (size.y.max - size.y.min) / 13;
        let line = [];
        let points;
        let interPoints = [];
        let pointsOK = false;
        while (!pointsOK) {
            line = [{x: (size.x.min - 1), y: y},{x: (size.x.max + 1), y: y}];
            //find intersections with all polygon edges
            for (var i = 0; i < edges.length; i++) {
                points = findEdgeIntersection(line, edges[i]);
                //if edge doesn't lie inside line
                if (points && (points.length === 1)) {
                    interPoints.push(points[0]);
                }
            }
            interPoints = sortPoints(interPoints);
            //find two correct interpoints
            for (var i = 0; i < interPoints.length - 1; i++) {
                if (interPoints[i].t !== interPoints[i+1].t) {
                    //enable exit from loop and calculate point coordinates
                    pointsOK = true;
                    point = {x: ((interPoints[i].x + interPoints[i+1].x) / 2), y: y};
                }
            }
            //all points are incorrect, need to change line parameters
            y = y + dy;
            if (((y > size.y.max) || (y < size.y.min)) && (pointsOK === false)) {
                pointsOK = true;
                point = undefined;
            }
        }
        return point;
    }

    /**
     * Gets the bounding box dimensions of a polygon
     * @function getSize
     * @private
     * @param {Array<Point>} polygon - Polygon vertices
     * @returns {Object} Object with min/max x and y coordinates
     */
    function getSize(polygon) {
        const size = {
            x: {
                min: polygon[0].x,
                max: polygon[0].x
            },
            y: {
                min: polygon[0].y,
                max: polygon[0].y
            }
        };
        for (let i = 1; i < polygon.length; i++) {
            if (polygon[i].x < size.x.min) size.x.min = polygon[i].x;
            if (polygon[i].x > size.x.max) size.x.max = polygon[i].x;
            if (polygon[i].y < size.y.min) size.y.min = polygon[i].y;
            if (polygon[i].y > size.y.max) size.y.max = polygon[i].y;
        }
        return size;
    }

    /**
     * Tests if a point is inside a polygon using ray casting algorithm
     * @function findPointInsidePolygon
     * @memberof Snap.polygons
     * @param {Point|Array<Number>} point - Point to test (object with x,y or array [x,y])
     * @param {Array<Point>} polygon - Polygon vertices
     * @param {Boolean} [count_side] - Whether to count points on polygon boundary as inside
     * @returns {Boolean} True if point is inside polygon, false otherwise
     * @example
     * const polygon = [{x: 0, y: 0}, {x: 10, y: 0}, {x: 10, y: 10}, {x: 0, y: 10}];
     * const isInside = Snap.polygons.pointInPolygon({x: 5, y: 5}, polygon); // Returns true
     */
    function findPointInsidePolygon(point, polygon, count_side) {
        if (Array.isArray(point)) point = {x:point[0], y:point[1]};

        let cross = 0;
        const edges = getEdges(polygon);
        let classify;
        let org, dest;
        for (let i = 0; i < edges.length; i++) {
            [org, dest] = edges[i];
            classify = classifyPoint(point, [org, dest]);
            if (  (
                    (classify.loc === "RIGHT") &&
                    (org.y < point.y) &&
                    (dest.y >= point.y)
                ) ||
                (
                    (classify.loc === "LEFT") &&
                    (org.y >= point.y) &&
                    (dest.y < point.y)
                )
            ) {
                cross++;
            }
            if (classify.loc === "BETWEEN") return !!count_side;
        }
        if (cross % 2) {
            return true;
        } else {
            return false;
        }
    }

    Snap.polygons.pointInPolygon = findPointInsidePolygon;

    /**
     * Calculates midpoints of all edges
     * @function getMidpoints
     * @private
     * @param {Array<Array<Point>>} edges - Array of edges
     * @returns {Array<Point>} Array of midpoints
     */
    function getMidpoints(edges) {
        const midpoints = [];
        let x, y;
        for (let i = 0; i < edges.length; i++) {
            x = (edges[i][0].x + edges[i][1].x) / 2;
            y = (edges[i][0].y + edges[i][1].y) / 2;
            midpoints.push({x: x, y: y});
        }
        return midpoints;
    }

    /**
     * Debug utility function to log objects as JSON
     * @function log
     * @private
     * @param {*} obj - Object to log
     */
    function log(obj) {
        console.log(JSON.stringify(obj));
    }

});