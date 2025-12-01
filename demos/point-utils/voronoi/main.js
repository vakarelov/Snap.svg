(function () {
    const WIDTH = 960;
    const HEIGHT = 600;
    const PADDING = 40;
    const COLORS = ["#38bdf8", "#fb7185", "#a3e635", "#facc15", "#c084fc", "#f472b6"];

    const stage = Snap("#voronoi-stage");
    stage.attr({viewBox: `0 0 ${WIDTH} ${HEIGHT}`});

    const slider = document.getElementById("site-count");
    const sliderValue = document.getElementById("site-count-value");
    const regenerateBtn = document.getElementById("regenerate");
    const clearBtn = document.getElementById("clear");
    const toggleTriangles = document.getElementById("toggle-triangles");
    const togglePair = document.getElementById("toggle-pair");
    const nearestLabel = document.getElementById("nearest-label");
    const nearestDistance = document.getElementById("nearest-distance");
    const polygonSize = document.getElementById("polygon-size");

    const layers = {
        triangles: stage.g().attr({id: "delaunay-layer"}),
        polygons: stage.g().attr({id: "voronoi-layer"}),
        points: stage.g().attr({id: "points-layer"}),
        overlays: stage.g().attr({id: "overlay-layer"})
    };

    const closestPairLine = stage.line(0, 0, 0, 0).attr({
        stroke: "#f97316",
        "stroke-dasharray": "6 4",
        "stroke-width": 2,
        opacity: 0
    });
    const closestPairHandles = [
        stage.circle(0, 0, 6).attr({
            fill: "rgba(249, 115, 22, 0.2)",
            stroke: "#f97316",
            "stroke-width": 2,
            opacity: 0
        }),
        stage.circle(0, 0, 6).attr({
            fill: "rgba(249, 115, 22, 0.2)",
            stroke: "#f97316",
            "stroke-width": 2,
            opacity: 0
        })
    ];

    layers.overlays.add(closestPairLine, closestPairHandles[0], closestPairHandles[1]);

    const state = {
        points: [],
        vor: null,
        kd: null,
        cells: [],
        cellShapes: [],
        pointShapes: [],
        activeIndex: -1
    };

    function init() {
        regenerateBtn.addEventListener("click", regeneratePoints);
        clearBtn.addEventListener("click", () => {
            state.points = [];
            updateSliderLabel(true);
            redraw();
        });
        slider.addEventListener("input", () => updateSliderLabel(false));
        slider.addEventListener("change", regeneratePoints);
        toggleTriangles.addEventListener("change", () => drawTriangles(state.vor));
        togglePair.addEventListener("change", () => drawClosestPair(state.points));

        stage.mousemove(handlePointerMove);
        stage.mouseleave(handlePointerLeave);
        stage.click(handleStageClick);

        regeneratePoints();
    }

    function regeneratePoints() {
        const count = parseInt(slider.value, 10);
        state.points = Snap.randomPoints(count, [PADDING, WIDTH - PADDING], [PADDING, HEIGHT - PADDING])
            .map(p => [p.x, p.y]);
        updateSliderLabel(true);
        redraw();
    }

    function handleStageClick(event, x, y) {
        const pt = stage.getCursorPoint(x, y);
        state.points.push([pt.x, pt.y]);
        updateSliderLabel(true);
        redraw();
    }

    function handlePointerMove(event, x, y) {
        if (!state.kd || state.points.length === 0) {
            return;
        }
        const pt = stage.getCursorPoint(x, y);
        const nearestInfo = state.kd.nearest_dist([pt.x, pt.y], 1);
        const nearestPoint = toXY(nearestInfo[0]);
        const idx = findPointIndex(nearestPoint);
        if (idx >= 0) {
            highlightIndex(idx);
            nearestLabel.textContent = `${nearestPoint.x.toFixed(1)}, ${nearestPoint.y.toFixed(1)}`;
            nearestDistance.textContent = `${nearestInfo[1].toFixed(1)} px`;
            polygonSize.textContent = state.cells[idx] ? `${state.cells[idx].length} vertices` : "--";
        }
    }

    function handlePointerLeave() {
        highlightIndex(-1);
        nearestLabel.textContent = "--";
        nearestDistance.textContent = "--";
        polygonSize.textContent = "--";
    }

    function updateSliderLabel(showActual) {
        if (showActual) {
            sliderValue.textContent = state.points.length;
        } else {
            sliderValue.textContent = slider.value;
        }
    }

    function redraw() {
        clearLayers();
        if (state.points.length === 0) {
            state.vor = null;
            state.kd = null;
            state.cells = [];
            drawPoints();
            return;
        }

        if (state.points.length >= 2) {
            state.vor = Snap.voronoi(state.points);
            state.cells = state.points.map((_, index) => normalizePolygon(state.vor.getPolygon(index)));
            state.kd = Snap.kdTree(state.points);
        } else {
            state.vor = null;
            state.cells = [];
            state.kd = Snap.kdTree(state.points);
        }

        drawTriangles(state.vor);
        drawPolygons();
        drawPoints();
        drawClosestPair(state.points);
    }

    function clearLayers() {
        layers.triangles.removeChildren();
        layers.polygons.removeChildren();
        layers.points.removeChildren();
        state.cellShapes = [];
        state.pointShapes = [];
        state.activeIndex = -1;
    }

    function drawPolygons() {
        if (!state.cells.length) {
            return;
        }
        state.cells.forEach((polygon, index) => {
            if (!polygon.length) {
                state.cellShapes[index] = null;
                return;
            }
            const path = polygonToPath(polygon);
            const color = COLORS[index % COLORS.length];
            const element = stage.path(path).attr({
                fill: color + "33",
                stroke: color,
                "stroke-width": 1.5
            });
            layers.polygons.add(element);
            state.cellShapes[index] = element;
        });
    }

    function drawPoints() {
        state.points.forEach((point, index) => {
            const color = COLORS[index % COLORS.length];
            const circle = stage.circle(point[0], point[1], 5).attr({
                fill: color,
                stroke: "#0f172a",
                "stroke-width": 1.5
            });
            layers.points.add(circle);
            state.pointShapes[index] = circle;
        });
    }

    function drawTriangles(vor) {
        layers.triangles.removeChildren();
        if (!toggleTriangles.checked || !vor) {
            return;
        }
        const triangles = vor.getTriangle();
        triangles.forEach((triangle) => {
            if (!triangle) {
                return;
            }
            const coords = triangle.map(toXY);
            const path = `M${coords[0].x},${coords[0].y}L${coords[1].x},${coords[1].y}L${coords[2].x},${coords[2].y}Z`;
            const element = stage.path(path).attr({
                fill: "none",
                stroke: "rgba(255,255,255,0.15)",
                "stroke-width": 1
            });
            layers.triangles.add(element);
        });
    }

    function drawClosestPair(points) {
        if (!togglePair.checked || points.length < 2) {
            closestPairLine.attr({opacity: 0});
            closestPairHandles.forEach((handle) => handle.attr({opacity: 0}));
            return;
        }
        const normalizedPoints = points.map((pt) => toXY(pt));
        const info = Snap.closestPair(normalizedPoints);
        if (!info || !info.pair) {
            closestPairLine.attr({opacity: 0});
            closestPairHandles.forEach((handle) => handle.attr({opacity: 0}));
            return;
        }
        const p1 = toXY(info.pair[0]);
        const p2 = toXY(info.pair[1]);
        closestPairLine.attr({
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            opacity: 1
        });
        closestPairHandles[0].attr({cx: p1.x, cy: p1.y, opacity: 1});
        closestPairHandles[1].attr({cx: p2.x, cy: p2.y, opacity: 1});
    }

    function highlightIndex(index) {
        if (state.activeIndex === index) {
            return;
        }
        if (state.activeIndex >= 0) {
            resetHighlight(state.activeIndex);
        }
        state.activeIndex = index;
        if (index < 0) {
            return;
        }
        const poly = state.cellShapes[index];
        const point = state.pointShapes[index];
        if (poly) {
            const strokeColor = Snap.color(poly.attr("stroke"));
            poly.attr({
                fill: `rgba(${strokeColor.r}, ${strokeColor.g}, ${strokeColor.b}, 0.35)`,
                "stroke-width": 2.5
            });
        }
        if (point) {
            point.attr({r: 7});
        }
    }

    function resetHighlight(index) {
        const poly = state.cellShapes[index];
        const point = state.pointShapes[index];
        if (poly) {
            const baseColor = COLORS[index % COLORS.length];
            poly.attr({
                fill: baseColor + "33",
                "stroke-width": 1.5
            });
        }
        if (point) {
            point.attr({r: 5});
        }
    }

    function normalizePolygon(polygon) {
        if (!polygon) {
            return [];
        }
        return polygon.map(toXY);
    }

    function polygonToPath(polygon) {
        if (!polygon.length) {
            return "";
        }
        let path = `M${polygon[0].x},${polygon[0].y}`;
        for (let i = 1; i < polygon.length; ++i) {
            path += `L${polygon[i].x},${polygon[i].y}`;
        }
        return path + "Z";
    }

    function toXY(point) {
        if (!point) {
            return {x: 0, y: 0};
        }
        if (Array.isArray(point)) {
            return {x: point[0], y: point[1]};
        }
        return {x: point.x, y: point.y};
    }

    function findPointIndex(target) {
        for (let i = 0; i < state.points.length; ++i) {
            const point = state.points[i];
            if (Math.abs(point[0] - target.x) < 0.01 && Math.abs(point[1] - target.y) < 0.01) {
                return i;
            }
        }
        return -1;
    }

    // stage already exposes Snap's cursor helper via getCursorPoint

    init();
})();
