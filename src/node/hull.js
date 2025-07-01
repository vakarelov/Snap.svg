Snap_ia.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {
    const _hull = require("hull.js");
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

    Snap.convexHull = function (points, format) {
        const hull = Snap.hull(points, Infinity, format);
        hull && hull.pop();
        return hull
    }

});