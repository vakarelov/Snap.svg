(function () {
    const width = 960;
    const height = 600;
    const concavityInput = document.getElementById('concavity');
    const concavityLabel = document.getElementById('concavityValue');
    const pointTargetInput = document.getElementById('pointTarget');
    const pointTargetLabel = document.getElementById('pointCountValue');
    const pointCounter = document.getElementById('pointCount');
    const resetButton = document.getElementById('resetPoints');
    const clearButton = document.getElementById('clearPoints');
    const svg = Snap('#playground');

    const background = svg.rect(0, 0, width, height).attr({
        fill: '#020c1b',
        stroke: '#11203b',
        'stroke-width': 2
    });

    const cloudLayer = svg.g();
    const hullLayer = svg.g();
    const pointLayer = svg.g();
    const hullPath = hullLayer.path('').attr({
        fill: 'rgba(56, 189, 248, 0.15)',
        stroke: '#38bdf8',
        'stroke-width': 3
    });
    const cloudSamples = scatterSamples(320);

    let targetCount = Number(pointTargetInput.value);
    let points = seedPoints(targetCount);
    let concavity = Number(concavityInput.value);

    concavityLabel.textContent = concavity;
    pointTargetLabel.textContent = targetCount;

    background.click(function (evt) {
        const pos = pointerToCanvas(evt);
        points.push([
            clamp(pos.x, 12, width - 12),
            clamp(pos.y, 12, height - 12)
        ]);
        rebuildPoints();
    });

    concavityInput.addEventListener('input', function (evt) {
        concavity = Number(evt.target.value);
        concavityLabel.textContent = concavity;
        redrawHull();
    });

    pointTargetInput.addEventListener('input', function (evt) {
        targetCount = Number(evt.target.value);
        pointTargetLabel.textContent = targetCount;
        points = seedPoints(targetCount);
        rebuildPoints();
    });

    resetButton.addEventListener('click', function () {
        points = seedPoints(targetCount);
        rebuildPoints();
    });

    clearButton.addEventListener('click', function () {
        points = [];
        rebuildPoints();
    });

    function seedPoints(count) {
        const seeded = [];
        for (let i = 0; i < count; i++) {
            const cluster = i < count * 0.4 ? 1 : 2;
            const padding = 80;
            const x = cluster === 1
                ? randomBetween(padding, width / 2)
                : randomBetween(width / 2 - 40, width - padding);
            const y = randomBetween(padding, height - padding);
            seeded.push([x, y]);
        }
        return seeded;
    }

    function rebuildPoints() {
        pointLayer.removeChildren();
        pointCounter.textContent = points.length;

        points.forEach((pt, index) => {
            const node = pointLayer.circle(pt[0], pt[1], 7).attr({
                fill: '#fbbf24',
                stroke: '#0f172a',
                'stroke-width': 2,
                cursor: 'grab'
            });
            node.data('index', index);
            node.data('start', { x: pt[0], y: pt[1] });
            node.drag(onDragMove, onDragStart, noop);
        });

        redrawHull();
    }

    function redrawHull() {
        if (points.length < 3) {
            hullPath.attr({ d: '' });
            cloudLayer.removeChildren();
            return;
        }
        const hullPoints = Snap.hull(points.slice(), concavity);
        if (!hullPoints || hullPoints.length === 0) {
            hullPath.attr({ d: '' });
            cloudLayer.removeChildren();
            return;
        }
        hullPath.attr({ d: pointsToPath(hullPoints) });
        renderInteriorPoints(hullPoints);
    }

    function onDragStart() {
        this.data('start', {
            x: this.attr('cx'),
            y: this.attr('cy')
        });
        this.attr({ cursor: 'grabbing' });
    }

    function onDragMove(dx, dy) {
        const index = this.data('index');
        const origin = this.data('start');
        const nextX = clamp(origin.x + dx, 12, width - 12);
        const nextY = clamp(origin.y + dy, 12, height - 12);
        this.attr({ cx: nextX, cy: nextY });
        points[index] = [nextX, nextY];
        redrawHull();
    }

    function noop() {
        this.attr({ cursor: 'grab' });
    }

    function randomBetween(min, max) {
        return Math.round(Math.random() * (max - min) + min);
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function pointerToCanvas(evt) {
        const rect = svg.node.getBoundingClientRect();
        return {
            x: ((evt.clientX - rect.left) / rect.width) * width,
            y: ((evt.clientY - rect.top) / rect.height) * height
        };
    }

    function pointsToPath(list) {
        return list
            .map(function (pt, idx) {
                return (idx === 0 ? 'M' : 'L') + pt[0] + ',' + pt[1];
            })
            .join(' ') + 'Z';
    }

    function renderInteriorPoints(hullPoints) {
        cloudLayer.removeChildren();
        if (!hullPoints || hullPoints.length < 3) {
            return;
        }
        const polygon = toPointObjects(hullPoints);
        cloudSamples.forEach(function (sample) {
            if (Snap.polygons.pointInPolygon(sample, polygon, true)) {
                cloudLayer.circle(sample.x, sample.y, 2).attr({
                    fill: 'rgba(56,189,248,0.45)',
                    stroke: 'none'
                });
            }
        });
    }

    function toPointObjects(list) {
        return list.map(function (pt) {
            return Array.isArray(pt)
                ? { x: pt[0], y: pt[1] }
                : { x: pt.x, y: pt.y };
        });
    }

    function scatterSamples(count) {
        const samples = [];
        const padding = 16;
        for (let i = 0; i < count; i++) {
            samples.push({
                x: randomBetween(padding, width - padding),
                y: randomBetween(padding, height - padding)
            });
        }
        return samples;
    }

    rebuildPoints();
})();
