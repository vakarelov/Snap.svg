(function () {
    const width = 960;
    const height = 620;
    const svg = Snap('#comparison');
    const datasetSelect = document.getElementById('dataset');
    const concavityInput = document.getElementById('concavity');
    const pointTargetInput = document.getElementById('pointTarget');
    const pointTargetLabel = document.getElementById('pointTargetValue');
    const shuffleButton = document.getElementById('shuffle');
    const stats = {
        points: document.getElementById('pointCount'),
        concaveArea: document.getElementById('concaveArea'),
        convexArea: document.getElementById('convexArea'),
        efficiency: document.getElementById('efficiency'),
        concavePerimeter: document.getElementById('concavePerimeter'),
        convexPerimeter: document.getElementById('convexPerimeter')
    };

    const background = svg.rect(0, 0, width, height);
    const bgGradient = svg.gradient('r(0.5, 0.1, 0.8)#0b1120-#01050f');
    background.attr({ fill: bgGradient });

    const convexPath = svg.path('').attr({
        fill: 'rgba(248, 113, 113, 0.12)',
        stroke: '#f87171',
        'stroke-width': 2,
        'stroke-dasharray': '10 8'
    });
    const concavePath = svg.path('').attr({
        fill: 'rgba(52, 211, 153, 0.2)',
        stroke: '#34d399',
        'stroke-width': 3
    });
    const centroidLayer = svg.g();
    const concaveCentroid = centroidLayer.circle(0, 0, 6).attr({
        fill: '#34d399',
        stroke: '#0f172a',
        'stroke-width': 2,
        opacity: 0
    });
    const convexCentroid = centroidLayer.circle(0, 0, 5).attr({
        fill: '#f87171',
        stroke: '#0f172a',
        'stroke-width': 2,
        opacity: 0
    });
    const pointLayer = svg.g();

    let targetPoints = Number(pointTargetInput.value);
    pointTargetLabel.textContent = targetPoints;
    let points = buildDataset(datasetSelect.value);
    let concavity = Number(concavityInput.value);

    datasetSelect.addEventListener('change', function () {
        points = buildDataset(this.value);
        render();
    });

    concavityInput.addEventListener('input', function (evt) {
        concavity = Number(evt.target.value);
        drawHulls();
    });

    shuffleButton.addEventListener('click', function () {
        points = buildDataset(datasetSelect.value, true);
        render();
    });

    pointTargetInput.addEventListener('input', function (evt) {
        targetPoints = Number(evt.target.value);
        pointTargetLabel.textContent = targetPoints;
        points = buildDataset(datasetSelect.value, true);
        render();
    });

    function buildDataset(mode, shuffleSeed) {
        const total = Math.max(3, Math.round(targetPoints));
        const result = [];
        const jitter = shuffleSeed ? Math.random() * 120 + 60 : 100;
        if (mode === 'ring') {
            const ringCount = total < 6 ? total : Math.max(6, Math.round(total * 0.8));
            const innerCount = Math.max(0, total - ringCount);
            for (let i = 0; i < ringCount; i++) {
                const angle = (Math.PI * 2 * i) / ringCount;
                const radius = 200 + Math.sin(i * 0.7) * 40;
                result.push([
                    clamp(Math.cos(angle) * radius + width / 2 + randomBetween(-20, 20), 40, width - 40),
                    clamp(Math.sin(angle) * radius + height / 2 + randomBetween(-20, 20), 40, height - 40)
                ]);
            }
            for (let i = 0; i < innerCount; i++) {
                result.push([
                    clamp(width / 2 + Math.cos(i) * 60 + randomBetween(-30, 30), 40, width - 40),
                    clamp(height / 2 + Math.sin(i) * 60 + randomBetween(-30, 30), 40, height - 40)
                ]);
            }
            return result;
        }
        if (mode === 'arc') {
            const baseY = height * 0.35;
            const arcCount = total < 4 ? total : Math.max(4, Math.round(total * 0.7));
            const scatterCount = Math.max(0, total - arcCount);
            for (let i = 0; i < arcCount; i++) {
                const ratio = arcCount === 1 ? 0 : i / (arcCount - 1);
                const x = ratio * (width - 80) + 40;
                const y = baseY + Math.sin(i * 0.35) * 140 + randomBetween(-40, 40);
                result.push([
                    clamp(x + randomBetween(-20, 20), 40, width - 40),
                    clamp(y + randomBetween(-20, 20), 40, height - 40)
                ]);
            }
            for (let i = 0; i < scatterCount; i++) {
                result.push([
                    randomBetween(80, width - 80),
                    randomBetween(height * 0.55, height - 40)
                ]);
            }
            return result;
        }
        const clusters = [
            { x: width * 0.3, y: height * 0.35 },
            { x: width * 0.65, y: height * 0.3 },
            { x: width * 0.52, y: height * 0.7 }
        ];
        for (let i = 0; i < total; i++) {
            const c = clusters[i % clusters.length];
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * jitter;
            result.push([
                clamp(c.x + Math.cos(angle) * radius, 40, width - 40),
                clamp(c.y + Math.sin(angle) * radius, 40, height - 40)
            ]);
        }
        return result;
    }

    function render() {
        drawPoints();
        drawHulls();
        stats.points.textContent = points.length;
    }

    function drawPoints() {
        pointLayer.removeChildren();
        points.forEach(function (pt) {
            pointLayer.circle(pt[0], pt[1], 4).attr({
                fill: '#e2e8f0',
                stroke: 'none',
                opacity: 0.9
            });
        });
    }

    function drawHulls() {
        if (points.length < 3) {
            concavePath.attr({ d: '' });
            convexPath.attr({ d: '' });
            concaveCentroid.attr({ opacity: 0 });
            convexCentroid.attr({ opacity: 0 });
            stats.concaveArea.textContent = '0';
            stats.convexArea.textContent = '0';
            stats.efficiency.textContent = '0%';
            stats.concavePerimeter.textContent = '0';
            stats.convexPerimeter.textContent = '0';
            return;
        }
        const concave = Snap.hull(points.slice(), concavity);
        const convex = Snap.convexHull(points.slice());
        concavePath.attr({ d: pathFromPoints(concave) });
        convexPath.attr({ d: pathFromPoints(convex) });

        updateStats(concave, convex);
    }

    function updateStats(concavePoints, convexPoints) {
        const concaveList = toPointObjects(concavePoints);
        const convexList = toPointObjects(convexPoints);
        const concaveArea = concaveList.length >= 3 ? Snap.polygons.polygonArea(concaveList) : 0;
        const convexArea = convexList.length >= 3 ? Snap.polygons.polygonArea(convexList) : 0;
        stats.concaveArea.textContent = concaveArea.toFixed(0);
        stats.convexArea.textContent = convexArea.toFixed(0);
        stats.efficiency.textContent = convexArea > 0
            ? Math.round((concaveArea / convexArea) * 100) + '%'
            : '0%';
        stats.concavePerimeter.textContent = perimeter(concavePoints).toFixed(0);
        stats.convexPerimeter.textContent = perimeter(convexPoints).toFixed(0);

        const concaveCentroidPoint = concaveList.length >= 3 ? Snap.polygons.polygonCentroid(concaveList) : null;
        const convexCentroidPoint = convexList.length >= 3 ? Snap.polygons.polygonCentroid(convexList) : null;
        if (concaveCentroidPoint) {
            concaveCentroid.attr({
                cx: concaveCentroidPoint.x,
                cy: concaveCentroidPoint.y,
                opacity: 1
            });
        } else {
            concaveCentroid.attr({ opacity: 0 });
        }
        if (convexCentroidPoint) {
            convexCentroid.attr({
                cx: convexCentroidPoint.x,
                cy: convexCentroidPoint.y,
                opacity: 1
            });
        } else {
            convexCentroid.attr({ opacity: 0 });
        }
    }

    function pathFromPoints(list) {
        if (!list || list.length === 0) {
            return '';
        }
        return list
            .map(function (pt, idx) {
                return (idx === 0 ? 'M' : 'L') + pt[0] + ',' + pt[1];
            })
            .join(' ') + 'Z';
    }

    function toPointObjects(list) {
        if (!Array.isArray(list)) {
            return [];
        }
        return list.map(function (pt) {
            return Array.isArray(pt)
                ? { x: pt[0], y: pt[1] }
                : { x: pt.x, y: pt.y };
        });
    }

    function perimeter(list) {
        if (!list || list.length < 2) {
            return 0;
        }
        let length = 0;
        for (let i = 0; i < list.length; i++) {
            const current = list[i];
            const next = list[(i + 1) % list.length];
            const dx = next[0] - current[0];
            const dy = next[1] - current[1];
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    render();
})();
