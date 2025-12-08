/* global eve */
(function () {
    const width = 960;
    const height = 620;
    const canvasPadding = 20;
    const svg = Snap('#overlap');
    const overlapLabel = document.getElementById('overlapStatus');
    const areaLabel = document.getElementById('areaValue');
    const shuffleButton = document.getElementById('shuffle');
    const handleToggle = document.getElementById('toggleHandles');

    const background = svg.rect(0, 0, width, height).attr({ fill: '#030712' });
    drawGrid();

    const moveLimits = {
        min_x: canvasPadding,
        max_x: width - canvasPadding,
        min_y: canvasPadding,
        max_y: height - canvasPadding
    };

    const polygonLayer = svg.g();
    const intersectionLayer = svg.g();

    const templates = {
        alpha: [
            { x: 140, y: 160 },
            { x: 260, y: 110 },
            { x: 330, y: 190 },
            { x: 300, y: 310 },
            { x: 180, y: 320 },
            { x: 120, y: 240 }
        ],
        beta: [
            { x: 620, y: 180 },
            { x: 760, y: 160 },
            { x: 810, y: 260 },
            { x: 740, y: 360 },
            { x: 600, y: 340 },
            { x: 540, y: 250 }
        ]
    };

    const layers = [
        createPolygonLayer('alpha', '#f472b6'),
        createPolygonLayer('beta', '#60a5fa')
    ];

    shuffleLayers();
    analyzeOverlap();

    shuffleButton.addEventListener('click', function () {
        shuffleLayers(true);
        analyzeOverlap();
    });

    handleToggle.addEventListener('change', function () {
        const visible = this.checked;
        layers.forEach(function (layer) {
            layer.handles.forEach(function (handle) {
                handle.attr({
                    opacity: visible ? 1 : 0,
                    'pointer-events': visible ? 'auto' : 'none'
                });
            });
        });
    });

    function drawGrid() {
        const gridGroup = svg.g();
        const spacing = 40;
        for (let x = 0; x <= width; x += spacing) {
            gridGroup.line(x, 0, x, height).attr({
                stroke: 'rgba(148,163,184,0.06)',
                'stroke-width': x % 200 === 0 ? 1.2 : 0.6
            });
        }
        for (let y = 0; y <= height; y += spacing) {
            gridGroup.line(0, y, width, y).attr({
                stroke: 'rgba(148,163,184,0.06)',
                'stroke-width': y % 200 === 0 ? 1.2 : 0.6
            });
        }
    }

    function createPolygonLayer(id, color) {
        const group = polygonLayer.g();
        const polygon = group.polygon('0,0 10,0 10,10 0,10').attr({
            fill: color,
            'fill-opacity': 0.45,
            stroke: darkerColor(color, 0.25),
            'stroke-width': 3,
            cursor: 'move'
        });
        const handles = [];
        const layer = {
            id: id,
            group: group,
            polygon: polygon,
            handles: handles,
            points: copyPoints(templates[id])
        };

        layer.points.forEach(function (pt, idx) {
            const handle = group.circle(pt.x, pt.y, 7).attr({
                fill: '#fff',
                stroke: '#0f172a',
                'stroke-width': 2,
                cursor: 'pointer'
            });
            handle.data('index', idx);
            handle.data('layer', layer);
            handle.drag(handleDragMove, handleDragStart, handleDragEnd);
            handles.push(handle);
        });

        enableLayerDragging(layer);

        updateLayer(layer);
        return layer;
    }

    function updateLayer(layer) {
        layer.polygon.attr({ points: stringifyPoints(layer.points) });
        layer.handles.forEach(function (handle, idx) {
            const pt = layer.points[idx];
            handle.attr({ cx: pt.x, cy: pt.y });
        });
    }

    function handleDragStart(x, y, ev) {
        if (ev) {
            ev.stopPropagation();
        }
        const layer = this.data('layer');
        this.data('origin', {
            x: layer.points[this.data('index')].x,
            y: layer.points[this.data('index')].y
        });
    }

    function handleDragMove(dx, dy, x, y, ev) {
        if (ev) {
            ev.stopPropagation();
        }
        const layer = this.data('layer');
        const index = this.data('index');
        const origin = this.data('origin');
        const next = clampPoint({
            x: origin.x + dx,
            y: origin.y + dy
        });
        layer.points[index] = next;
        this.attr({ cx: next.x, cy: next.y });
        updateLayer(layer);
        analyzeOverlap();
    }

    function handleDragEnd(ev) {
        if (ev) {
            ev.stopPropagation();
        }
    }

    function enableLayerDragging(layer) {
        layer.group.move({
            limits: moveLimits,
            coordTarget: svg
        });

        const startEvent = 'snap.drag.start.' + layer.group.id;
        const moveEvent = 'snap.drag.move.' + layer.group.id;
        const endEvent = 'snap.drag.end.' + layer.group.id;

        eve.on(startEvent, function (x, y, event) {
            layer.dragState = {
                origin: copyPoints(layer.points)
            };
            layer.polygon.attr({ 'fill-opacity': 0.55 });
            if (event) {
                event.stopPropagation();
            }
        });

        eve.on(moveEvent, function (dx, dy, x, y, event) {
            if (!layer.dragState) {
                return;
            }
            const delta = getDragDelta(layer.group);
            layer.points = layer.dragState.origin.map(function (pt) {
                return clampPoint({
                    x: pt.x + delta.x,
                    y: pt.y + delta.y
                });
            });
            analyzeOverlap();
            if (event) {
                event.stopPropagation();
            }
        });

        eve.on(endEvent, function (event) {
            layer.group.transform('');
            updateLayer(layer);
            layer.polygon.attr({ 'fill-opacity': 0.45 });
            layer.dragState = null;
            analyzeOverlap();
            if (event) {
                event.stopPropagation();
            }
        });
    }

    function getDragDelta(element) {
        const startMatrix = element.data('ot');
        if (!startMatrix) {
            return { x: 0, y: 0 };
        }
        const matrix = element.getLocalMatrix(true);
        return {
            x: matrix.e - startMatrix.e,
            y: matrix.f - startMatrix.f
        };
    }

    function analyzeOverlap() {
        const shapeA = layers[0].points.map(toPointObject);
        const shapeB = layers[1].points.map(toPointObject);
        const overlapping = Snap.polygons.con_overlap(shapeA, shapeB);
        overlapLabel.textContent = overlapping ? 'Overlapping' : 'No overlap';
        overlapLabel.style.color = overlapping ? '#34d399' : '#f87171';

        intersectionLayer.removeChildren();
        if (!overlapping) {
            areaLabel.textContent = '0';
            return;
        }
        const intersections = Snap.polygons.intersect(shapeA, shapeB) || [];
        let totalArea = 0;
        intersections.forEach(function (polygon) {
            totalArea += Snap.polygons.polygonArea(polygon);
            intersectionLayer.path(pointsToPath(polygon)).attr({
                fill: 'rgba(251,191,36,0.55)',
                stroke: '#facc15',
                'stroke-width': 2
            });
        });
        areaLabel.textContent = totalArea.toFixed(1);
    }

    function pointsToPath(points) {
        return points.map(function (pt, idx) {
            return (idx === 0 ? 'M' : 'L') + pt.x + ',' + pt.y;
        }).join(' ') + 'Z';
    }

    function stringifyPoints(points) {
        return points.map(function (pt) {
            return pt.x + ',' + pt.y;
        }).join(' ');
    }

    function toPointObject(pt) {
        return { x: pt.x, y: pt.y };
    }

    function clampPoint(pt) {
        return {
            x: Math.max(canvasPadding, Math.min(width - canvasPadding, pt.x)),
            y: Math.max(canvasPadding, Math.min(height - canvasPadding, pt.y))
        };
    }

    function copyPoints(list) {
        return list.map(function (pt) {
            return { x: pt.x, y: pt.y };
        });
    }

    function shuffleLayers(withNoise) {
        layers.forEach(function (layer) {
            const template = templates[layer.id];
            const bbox = bounds(template);
            const padding = 80;
            const targetX = randomBetween(padding, width - padding - bbox.width);
            const targetY = randomBetween(padding, height - padding - bbox.height);
            layer.points = template.map(function (pt) {
                return clampPoint({
                    x: pt.x - bbox.x + targetX + (withNoise ? randomBetween(-30, 30) : 0),
                    y: pt.y - bbox.y + targetY + (withNoise ? randomBetween(-30, 30) : 0)
                });
            });
            updateLayer(layer);
        });
    }

    function bounds(points) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        points.forEach(function (pt) {
            minX = Math.min(minX, pt.x);
            minY = Math.min(minY, pt.y);
            maxX = Math.max(maxX, pt.x);
            maxY = Math.max(maxY, pt.y);
        });
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    function randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    function darkerColor(color, factor) {
        const c = Snap.color(color);
        const clampedFactor = Math.max(0, Math.min(1, factor || 0));
        const darkerBrightness = Math.max(0, c.b * (1 - clampedFactor));
        return Snap.hsb(c.h, c.s, darkerBrightness);
    }
})();
