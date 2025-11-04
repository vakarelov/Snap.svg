Snap.plugin(function (Snap, Element, Paper, glob, Fragment, eve) {

    function Polygon(vertices, edges) {
        if (!edges) {
            let l = vertices.length;
            edges = vertices.map((v, i) => {
                return {
                    x: vertices[(i + 1) % l].x - v.x,
                    y: vertices[(i + 1) % l].y - v.y
                }
            })
        }
        this.vertex = vertices;
        this.edge = edges;
    }

//include appropriate test case code.
    function sat(polygonA, polygonB) {
        if (!(polygonA instanceof Polygon)) polygonA = new Polygon(polygonA);
        if (!(polygonB instanceof Polygon)) polygonB = new Polygon(polygonB);
        let perpendicularLine = null;
        let dot = 0;
        const perpendicularStack = [];
        let amin = null;
        let amax = null;
        let bmin = null;
        let bmax = null;
        for (let i = 0; i < polygonA.edge.length; i++) {
            perpendicularLine = {
                x: -polygonA.edge[i].y,
                y: polygonA.edge[i].x
            };
            perpendicularStack.push(perpendicularLine);
        }
        for (let i = 0; i < polygonB.edge.length; i++) {
            perpendicularLine = {
                x: -polygonB.edge[i].y,
                y: polygonB.edge[i].x
            };
            perpendicularStack.push(perpendicularLine);
        }
        for (let i = 0; i < perpendicularStack.length; i++) {
            amin = null;
            amax = null;
            bmin = null;
            bmax = null;
            for (let j = 0; j < polygonA.vertex.length; j++) {
                dot = polygonA.vertex[j].x *
                    perpendicularStack[i].x +
                    polygonA.vertex[j].y *
                    perpendicularStack[i].y;
                if (amax === null || dot > amax) {
                    amax = dot;
                }
                if (amin === null || dot < amin) {
                    amin = dot;
                }
            }
            for (var j = 0; j < polygonB.vertex.length; j++) {
                dot = polygonB.vertex[j].x *
                    perpendicularStack[i].x +
                    polygonB.vertex[j].y *
                    perpendicularStack[i].y;
                if (bmax === null || dot > bmax) {
                    bmax = dot;
                }
                if (bmin === null || dot < bmin) {
                    bmin = dot;
                }
            }
            if ((amin <= bmax && amin >= bmin) ||
                (bmin <= amax && bmin >= amin)) {
                continue;
            } else {
                return false;
            }
        }
        return true;
    }

    Snap.polygons = Snap.polygons || {}

    Snap.polygons.con_overlap = function (shape1, shape2) {
        return Snap.polygons.pointInPolygon(shape1[0], shape2, true) ||
            Snap.polygons.pointInPolygon(shape2[0], shape1, true) ||
            sat(shape1, shape2);
    }

    Snap.polygons.sat = sat;

})