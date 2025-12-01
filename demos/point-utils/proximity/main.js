(function () {
    const WIDTH = 960;
    const HEIGHT = 960;
    const PADDING_X = 20;
    const PADDING_Y = 20;
    const BRUTE_THRESHOLD = 25000;
    const COLOR_A = "#38bdf8";
    const COLOR_B = "#fbbf24";

    const stage = Snap("#proximity-stage");
    stage.attr({width: WIDTH, height: HEIGHT, viewBox: `0 0 ${WIDTH} ${HEIGHT}`});

    const countAInput = document.getElementById("count-a");
    const countBInput = document.getElementById("count-b");
    const countALabel = document.getElementById("count-a-value");
    const countBLabel = document.getElementById("count-b-value");
    const refreshBtn = document.getElementById("refresh");
    const denseBtn = document.getElementById("dense");
    const solverModeSelect = document.getElementById("solver-mode");

    const info = {
        nearestA: document.getElementById("nearest-a"),
        nearestB: document.getElementById("nearest-b"),
        distA: document.getElementById("dist-a"),
        distB: document.getElementById("dist-b"),
        pairLength: document.getElementById("pair-length"),
        pairMode: document.getElementById("pair-mode"),
        pairComparisons: document.getElementById("pair-comparisons"),
        pairSpeedup: document.getElementById("pair-speedup")
    };

    const layers = {
        lines: stage.g().attr({id: "pair-layer"}),
        points: stage.g().attr({id: "points-layer"}),
        overlay: stage.g().attr({id: "overlay-layer"})
    };

    const pairLine = stage.line(0, 0, 0, 0).attr({
        stroke: "#f97316",
        "stroke-width": 2.2,
        "stroke-dasharray": "10 6",
        opacity: 0
    });

    const pointer = stage.circle(0, 0, 6).attr({
        fill: "none",
        stroke: "#ffffff",
        "stroke-width": 1.5,
        opacity: 0
    });

    const pointerLineA = stage.line(0, 0, 0, 0).attr({
        stroke: COLOR_A,
        "stroke-width": 1.5,
        opacity: 0
    });

    const pointerLineB = stage.line(0, 0, 0, 0).attr({
        stroke: COLOR_B,
        "stroke-width": 1.5,
        opacity: 0
    });

    layers.lines.add(pairLine);
    layers.overlay.add(pointerLineA, pointerLineB, pointer);

    const state = {
        setA: [],
        setB: [],
        kdA: null,
        kdB: null,
        pointShapesA: [],
        pointShapesB: []
    };

    function init() {
        refreshBtn.addEventListener("click", randomizeSets);
        denseBtn.addEventListener("click", () => {
            countAInput.value = 160;
            countBInput.value = 160;
            updateCountLabels();
            randomizeSets();
        });
        countAInput.addEventListener("input", updateCountLabels);
        countBInput.addEventListener("input", updateCountLabels);
        countAInput.addEventListener("change", randomizeSets);
        countBInput.addEventListener("change", randomizeSets);
        solverModeSelect.addEventListener("change", drawNearPairs);

        stage.mousemove(handlePointer);
        stage.mouseleave(resetPointer);

        updateCountLabels();
        randomizeSets();
    }

    function randomizeSets() {
        state.setA = randomPoints(parseInt(countAInput.value, 10));
        state.setB = randomPoints(parseInt(countBInput.value, 10));
        rebuild();
    }

    function rebuild() {
        layers.points.removeChildren();
        state.pointShapesA = [];
        state.pointShapesB = [];

        drawPointSet(state.setA, COLOR_A, state.pointShapesA);
        drawPointSet(state.setB, COLOR_B, state.pointShapesB);

        state.kdA = Snap.kdTree(state.setA);
        state.kdB = Snap.kdTree(state.setB);

        drawNearPairs();
        resetPointer();
    }

    function drawPointSet(points, color, store) {
        points.forEach((point) => {
            const circle = stage.circle(point[0], point[1], 4.5).attr({
                fill: color,
                stroke: "#020617",
                "stroke-width": 1.2,
                opacity: 0.9
            });
            layers.points.add(circle);
            store.push(circle);
        });
    }

    function drawNearPairs() {
        if (!state.setA.length || !state.setB.length) {
            pairLine.attr({opacity: 0});
            info.pairLength.textContent = "--";
            info.pairMode.textContent = "--";
            info.pairComparisons.textContent = "--";
            info.pairSpeedup.textContent = "--";
            return;
        }
        const stats = computeClosestPairStats(state.setA, state.setB, solverModeSelect.value);
        if (!stats || !stats.pair) {
            pairLine.attr({opacity: 0});
            info.pairLength.textContent = "--";
            info.pairMode.textContent = "--";
            info.pairComparisons.textContent = "--";
            info.pairSpeedup.textContent = "--";
            return;
        }
        const p1 = stats.pair[0];
        const p2 = stats.pair[1];
        pairLine.attr({
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y,
            opacity: 1
        });
        info.pairLength.textContent = `${stats.distance.toFixed(2)} px`;
        info.pairMode.textContent = stats.mode;
        info.pairComparisons.textContent = formatComparisonLabel(stats);
        info.pairSpeedup.textContent = stats.speedup <= 1.05 ? "~1x (baseline)" : `${stats.speedup.toFixed(1)}x`;
    }

    function handlePointer(event, x, y) {
        if (!state.kdA || !state.kdB) {
            return;
        }
        const pt = stage.getCursorPoint(x, y);
        pointer.attr({cx: pt.x, cy: pt.y, opacity: 1});

        const nearestA = state.kdA.nearest_dist([pt.x, pt.y], 1);
        const pointA = toXY(nearestA[0]);
        pointerLineA.attr({
            x1: pt.x,
            y1: pt.y,
            x2: pointA.x,
            y2: pointA.y,
            opacity: 1
        });
        info.nearestA.textContent = `${pointA.x.toFixed(1)}, ${pointA.y.toFixed(1)}`;
        info.distA.textContent = `${nearestA[1].toFixed(1)} px`;

        const nearestB = state.kdB.nearest_dist([pt.x, pt.y], 1);
        const pointB = toXY(nearestB[0]);
        pointerLineB.attr({
            x1: pt.x,
            y1: pt.y,
            x2: pointB.x,
            y2: pointB.y,
            opacity: 1
        });
        info.nearestB.textContent = `${pointB.x.toFixed(1)}, ${pointB.y.toFixed(1)}`;
        info.distB.textContent = `${nearestB[1].toFixed(1)} px`;
    }

    function resetPointer() {
        pointer.attr({opacity: 0});
        pointerLineA.attr({opacity: 0});
        pointerLineB.attr({opacity: 0});
        info.nearestA.textContent = "--";
        info.nearestB.textContent = "--";
        info.distA.textContent = "--";
        info.distB.textContent = "--";
    }

    function updateCountLabels() {
        countALabel.textContent = countAInput.value;
        countBLabel.textContent = countBInput.value;
    }

    function randomPoints(num) {
        const target = Math.max(0, num);
        if (!target) {
            return [];
        }
        const extra = Math.max(1, Math.ceil(target * 0.05));
        const overshoot = target + extra;
        const working = Snap.randomPoints(overshoot, [PADDING_X, WIDTH - PADDING_X], [PADDING_Y, HEIGHT - PADDING_Y])
            .map((p) => ({x: p.x, y: p.y}));
        pruneClosestPairs(working, target);
        return working.slice(0, target).map((pt) => [pt.x, pt.y]);
    }

    function pruneClosestPairs(points, desired) {
        const tolerance = 0.001;
        while (points.length > desired) {
            const info = Snap.closestPair(points);
            if (!info || !info.pair || info.pair.length < 2) {
                points.length = desired;
                break;
            }
            const target = toXY(info.pair[1]);
            const index = findPointMatch(points, target, tolerance);
            if (index >= 0) {
                points.splice(index, 1);
            } else {
                points.pop();
            }
        }
    }

    function findPointMatch(points, target, tolerance) {
        for (let i = 0; i < points.length; ++i) {
            if (Math.abs(points[i].x - target.x) <= tolerance && Math.abs(points[i].y - target.y) <= tolerance) {
                return i;
            }
        }
        return -1;
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

    function toPointObject(point) {
        return {x: point[0], y: point[1]};
    }

    function computeClosestPairStats(setA, setB, solverMode = "auto") {
        if (!setA.length || !setB.length) {
            return null;
        }
        const totalPairs = setA.length * setB.length;
        const kdPlan = planKdStrategy(setA, setB);
        const kdComparisons = estimateKdComparisons(kdPlan.indexed.length, kdPlan.queries.length);
        const forceBrute = solverMode === "brute";
        const forceKd = solverMode === "kd";
        const useBrute = forceBrute || (!forceKd && totalPairs < BRUTE_THRESHOLD);
        if (useBrute) {
            let best = Infinity;
            let pair = null;
            let comparisons = 0;
            for (let i = 0; i < setA.length; ++i) {
                for (let j = 0; j < setB.length; ++j) {
                    comparisons += 1;
                    const d2 = Snap.len2(setA[i][0], setA[i][1], setB[j][0], setB[j][1]);
                    if (d2 < best) {
                        best = d2;
                        pair = [setA[i], setB[j]];
                    }
                }
            }
            if (!pair) {
                return null;
            }
            return {
                pair: pair.map(toPointObject),
                distance: Math.sqrt(best),
                mode: forceBrute ? "Brute-force (forced)" : "Brute-force",
                comparisons,
                baselineComparisons: totalPairs,
                kdComparisons,
                speedup: 1
            };
        }

        let {indexed, queries, swap} = kdPlan;
        const kd = Snap.kdTree(indexed);
        let best = Infinity;
        let pair = null;
        for (let i = 0; i < queries.length; ++i) {
            const nearest = kd.nearest_dist(queries[i], 1, true);
            if (nearest[1] < best) {
                best = nearest[1];
                pair = [nearest[0], queries[i]];
            }
        }
        if (!pair) {
            return null;
        }
        if (swap) {
            pair = [pair[1], pair[0]];
        }
        const comparisons = kdComparisons;
        const speedup = totalPairs / Math.max(1, comparisons);
        return {
            pair: pair.map(toPointObject),
            distance: Math.sqrt(best),
            mode: forceKd ? "KD-tree assisted (forced)" : "KD-tree assisted",
            comparisons,
            baselineComparisons: totalPairs,
            kdComparisons,
            speedup
        };
    }

    function planKdStrategy(setA, setB) {
        let indexed = setA;
        let queries = setB;
        let swap = false;
        if (queries.length > indexed.length) {
            swap = true;
            [indexed, queries] = [queries, indexed];
        }
        return {indexed, queries, swap};
    }

    function estimateKdComparisons(indexedLength, queryLength) {
        const depth = Math.max(1, Math.log2(Math.max(indexedLength, 2)));
        return Math.round(queryLength * depth);
    }

    function formatComparisonLabel(stats) {
        if (!stats) {
            return "--";
        }
        const bruteLabel = `brute ≈ ${formatNumber(stats.baselineComparisons)}`;
        const kdLabel = stats.kdComparisons ? `KD ≈ ${formatNumber(stats.kdComparisons)}` : null;
        if (kdLabel && stats.mode.startsWith("KD")) {
            return `${kdLabel}, ${bruteLabel}`;
        }
        if (kdLabel) {
            return `${bruteLabel}, ${kdLabel}`;
        }
        return bruteLabel;
    }

    function formatNumber(value) {
        if (!isFinite(value)) {
            return "--";
        }
        if (value >= 1_000_000) {
            return (value / 1_000_000).toFixed(1) + "M";
        }
        if (value >= 1_000) {
            return (value / 1_000).toFixed(1) + "K";
        }
        return Math.round(value).toString();
    }

    // Cursor mapping handled via Snap.Element#getCursorPoint

    init();
})();
