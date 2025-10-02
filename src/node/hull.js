Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    const _hull = require("hull.js");
    /**
     * Computes a concave hull for a given set of points and proxies the call to the underlying hull.js implementation.
     *
    * @param {PointCollection} points - Collection of points.
    *        Accepts an array of coordinate tuples, a flat numeric array, or point objects with `x`/`y`.
     * @param {number} [concavity] - Maximum concavity allowed by hull.js. Use `Infinity` (or omit) for a convex hull.
     * @param {"simple"|undefined} [format] - Optional hull.js format flag. When omitted the output matches the input shape.
    * @returns {(Array.<NumberPair>|Point2DList|null)} The computed hull or `null` when the input is invalid.
     */
    Snap.hull = function (points, concavity, format) {
        //filter incorrect pionts;
        points = points.filter(function (p){
            return (!isNaN(p[0]) && !isNaN(p[1]))
                ||  (!isNaN(p["x"]) && !isNaN(p["y"]))
        })

        if (Array.isArray(points[0])) {
            return _hull(points, concavity, format);
        }
        if (!isNaN(points[0]) && points.length % 2 === 0) {
            let pts = [];
            for (let i = 0, l = points.length; i < l; i += 2) {
                pts.push([+points[i], +points[i + 1]]);
            }
            return _hull(pts, concavity, format);
        }
        if (typeof points[0] === "object" && points[0].hasOwnProperty("x") && points[0].hasOwnProperty("y")) {
            points = points.map((p) => [+p.x, +p.y]);
            return _hull(points, concavity, format).map((p) => {
                return {x: p[0], y: p[1]}
            });
        }

        return null;
    };

    /**
     * Convenience wrapper for `Snap.hull` that forces a convex hull by setting concavity to `Infinity`.
     *
    * @param {PointCollection} points - Collection of input points.
     * @param {"simple"|undefined} [format] - Optional hull.js format flag.
    * @returns {(Array.<NumberPair>|Point2DList|null)} Closed convex hull without the repeated last point.
     */
    Snap.convexHull = function (points, format) {
        const hull = Snap.hull(points, Infinity, format);
        hull && hull.pop();
        return hull
    }

});