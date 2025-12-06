console.log('🎨 Bezier 3D Projection Demo Loaded');

// Check if Snap and bezier plugin are available
if (typeof Snap === 'undefined') {
    console.error('Snap not found! Make sure snap.svg_ia.js is loaded.');
    alert('Error: Snap library not loaded. Check console for details.');
} else if (typeof Snap.bezier === 'undefined') {
    console.error('Snap.bezier not found! Make sure bezier.js plugin is loaded.');
    alert('Error: Bezier plugin not loaded. Check console for details.');
} else {
    console.log(' Snap loaded successfully');
    console.log(' Bezier plugin loaded successfully');
}

// Initialize Snap.svg instances for each view
const svgs = {
    xy: Snap('#svg-xy'),
    xz: Snap('#svg-xz'),
    yz: Snap('#svg-yz'),
    persp: Snap('#svg-persp'),
    iso: Snap('#svg-iso'),
    perspFloat: Snap('#svg-persp-float')  // Floating perspective view
};

// ViewBox state for panning - stores current pan offset for each view
const viewBoxState = {
    xy: { x: 0, y: 0, width: 600, height: 280 },
    xz: { x: 0, y: 0, width: 600, height: 280 },
    yz: { x: 0, y: 0, width: 600, height: 280 },
    persp: { x: 0, y: 0, width: 600, height: 300 },
    iso: { x: 0, y: 0, width: 600, height: 300 },
    perspFloat: { x: 0, y: 0, width: 400, height: 250 }
};

// Initialize viewBox for all SVGs
Object.keys(svgs).forEach(key => {
    const svg = svgs[key];
    const state = viewBoxState[key];
    svg.attr({
        viewBox: `${state.x} ${state.y} ${state.width} ${state.height}`
    });
});

// Animation state
let animationFrame = null;

// Global 3D control points data (centered around origin for better perspective)
const controlPoints3D = [
    {x: -100, y: -50, z: 50},
    {x: -50, y: 50, z: 150},
    {x: 50, y: 50, z: 150},
    {x: 100, y: -50, z: 50}
];

// Eve event system for coordinating updates
const eve = Snap.eve || window.eve;

// Coordinate updates across all views
function emitControlPointChange(index, dimension, value) {
    controlPoints3D[index][dimension] = value;
    eve('controlpoint.changed', null, index, dimension, value);
}

function emitCameraChange(param, value) {
    eve('camera.changed', null, param, value);
}

// Subscribe to control point changes
eve.on('controlpoint.changed', function(index, dimension, value) {
    console.log(`Control point ${index} ${dimension} changed to ${value}`);
    updateCurve();
    // Update sliders if they exist
    const sliderId = `p${index}-${dimension}`;
    const slider = document.getElementById(sliderId);
    if (slider && Math.abs(parseInt(slider.value) - value) > 0.5) {
        slider.value = value;
        const valSpan = document.getElementById(sliderId + '-val');
        if (valSpan) valSpan.textContent = Math.round(value);
    }
});

// Subscribe to camera changes
eve.on('camera.changed', function(param, value) {
    console.log(`Camera ${param} changed to ${value}`);
    updateCurve();
    // Update slider if it exists
    const slider = document.getElementById(param);
    if (slider && Math.abs(parseInt(slider.value) - value) > 0.5) {
        slider.value = value;
        const valSpan = document.getElementById(param + '-val');
        if (valSpan) valSpan.textContent = Math.round(value);
    }
});

// Draw camera icon showing position and view direction
function drawCameraIcon(snapSvg, camX, camY, camZ, targetX, targetY, targetZ, offsetX, offsetY, scale, plane, flipY, canvasHeight) {
    const cameraGroup = snapSvg.g().attr({ id: 'camera-icon' });

    // Project camera and target positions to 2D based on plane
    const transform = (x, y, z) => {
        let sx, sy;
        if (plane === 'xy') {
            sx = offsetX + x * scale;
            sy = flipY ? (offsetY + canvasHeight - offsetY - 10 - y * scale) : (offsetY + y * scale);
        } else if (plane === 'xz') {
            sx = offsetX + x * scale;
            sy = flipY ? (offsetY + canvasHeight - offsetY - 10 - z * scale) : (offsetY + z * scale);
        } else if (plane === 'yz') {
            sx = offsetX + y * scale;
            sy = flipY ? (offsetY + canvasHeight - offsetY - 10 - z * scale) : (offsetY + z * scale);
        }
        return {x: sx, y: sy};
    };

    const camPos = transform(camX, camY, camZ);
    const targetPos = transform(targetX, targetY, targetZ);

    // Draw viewing direction line (dashed)
    cameraGroup.line(camPos.x, camPos.y, targetPos.x, targetPos.y).attr({
        stroke: '#FF6B6B',
        strokeWidth: 1.5,
        strokeDasharray: '3,3',
        opacity: 0.5
    });

    // Calculate direction vector for camera cone
    const dx = targetPos.x - camPos.x;
    const dy = targetPos.y - camPos.y;
    const dist = Snap.len(dx,dy);

    if (dist > 0.1) {
        const dirX = dx / dist;
        const dirY = dy / dist;

        // Perpendicular vector
        const perpX = -dirY;
        const perpY = dirX;

        // Camera cone (field of view indicator)
        const coneLength = 30;
        const coneWidth = 15;

        const coneEndX = camPos.x + dirX * coneLength;
        const coneEndY = camPos.y + dirY * coneLength;

        const cone1X = coneEndX + perpX * coneWidth;
        const cone1Y = coneEndY + perpY * coneWidth;
        const cone2X = coneEndX - perpX * coneWidth;
        const cone2Y = coneEndY - perpY * coneWidth;

        // Draw camera cone
        const conePath = `M${camPos.x},${camPos.y} L${cone1X},${cone1Y} L${cone2X},${cone2Y} Z`;
        cameraGroup.path(conePath).attr({
            fill: '#FF6B6B',
            fillOpacity: 0.15,
            stroke: '#FF6B6B',
            strokeWidth: 1,
            strokeOpacity: 0.3
        });
    }

    // Draw draggable camera position circle
    const cameraCircle = cameraGroup.circle(camPos.x, camPos.y, 6).attr({
        fill: '#FF6B6B',
        stroke: 'white',
        strokeWidth: 2,
        cursor: 'move'
    });

    // Make camera draggable in this plane
    // Define inverse transform function for coordinate conversion
    const inverseTransform = (sx, sy) => {
        let wx, wy;
        if (plane === 'xy') {
            wx = (sx - offsetX) / scale;
            wy = flipY ? (offsetY + canvasHeight - offsetY - 10 - sy) / scale : (sy - offsetY) / scale;
        } else if (plane === 'xz') {
            wx = (sx - offsetX) / scale;
            wy = flipY ? (offsetY + canvasHeight - offsetY - 10 - sy) / scale : (sy - offsetY) / scale;
        } else if (plane === 'yz') {
            wx = (sx - offsetX) / scale;
            wy = flipY ? (offsetY + canvasHeight - offsetY - 10 - sy) / scale : (sy - offsetY) / scale;
        }
        return {x: wx, y: wy};
    };

    // Enable move behavior using transforms
    cameraCircle.move();

    // Set up event listeners for camera movement
    eve.on(`drag.move.start.${cameraCircle.id}`, function() {
        const el = this;
        el.attr({ fillOpacity: 0.7 });
    });

    eve.on(`drag.move.ongoing.${cameraCircle.id}`, function() {
        const el = this;
        // Get current transformed position
        const bbox = el.getBBox();
        const cx = bbox.cx;
        const cy = bbox.cy;

        // Convert to world coordinates
        const worldPos = inverseTransform(cx, cy);

        // Update camera position based on plane
        if (plane === 'xy') {
            emitCameraChange('camX', worldPos.x);
            emitCameraChange('camY', worldPos.y);
        } else if (plane === 'xz') {
            emitCameraChange('camX', worldPos.x);
            emitCameraChange('camZ', worldPos.y);
        } else if (plane === 'yz') {
            emitCameraChange('camY', worldPos.x);
            emitCameraChange('camZ', worldPos.y);
        }
    });

    eve.on(`drag.move.end.${cameraCircle.id}`, function() {
        const el = this;
        el.attr({ fillOpacity: 1 });
    });

    // Draw camera label
    cameraGroup.text(camPos.x + 10, camPos.y - 10, '📷').attr({
        fontSize: 14,
        opacity: 0.7
    });

    // Draw target point
    cameraGroup.circle(targetPos.x, targetPos.y, 4).attr({
        fill: '#FFD93D',
        stroke: 'white',
        strokeWidth: 1.5,
        opacity: 0.8
    });

    return cameraGroup;
}

// Draw coordinate axes with custom labels
function drawAxes(snapSvg, offsetX, offsetY, width, height, scale, xLabel, yLabel) {
    const axisGroup = snapSvg.g().attr({ id: 'coord' });

    // Horizontal axis (red)
    axisGroup.line(offsetX, offsetY + height, offsetX + width, offsetY + height).attr({
        stroke: '#f44336',
        strokeWidth: 1,
        opacity: 0.3,
        strokeDasharray: '5,5'
    });

    // Vertical axis (blue for Z, green for Y)
    const vColor = yLabel === 'Z' ? '#2196F3' : '#4CAF50';
    axisGroup.line(offsetX, offsetY, offsetX, offsetY + height).attr({
        stroke: vColor,
        strokeWidth: 1,
        opacity: 0.3,
        strokeDasharray: '5,5'
    });

    // Add axis labels
    axisGroup.text(offsetX + width + 5, offsetY + height + 5, xLabel).attr({
        fill: '#f44336',
        fontSize: 12,
        fontWeight: 'bold',
        opacity: 0.6
    });

    axisGroup.text(offsetX - 15, offsetY - 5, yLabel).attr({
        fill: vColor,
        fontSize: 12,
        fontWeight: 'bold',
        opacity: 0.6
    });

    // Grid lines (lighter)
    for (let i = 50; i < width; i += 50) {
        axisGroup.line(offsetX + i * scale, offsetY, offsetX + i * scale, offsetY + height).attr({
            stroke: '#ccc',
            strokeWidth: 0.5,
            opacity: 0.15
        });
    }

    for (let i = 50; i < height; i += 50) {
        axisGroup.line(offsetX, offsetY + i * scale, offsetX + width, offsetY + i * scale).attr({
            stroke: '#ccc',
            strokeWidth: 0.5,
            opacity: 0.15
        });
    }

    return axisGroup;
}

// Reset view to original position and zoom
function resetView(viewName) {
    const state = viewBoxState[viewName];
    if (!state) return;

    // Reset to original viewBox
    const originalSizes = {
        xy: { width: 600, height: 280 },
        xz: { width: 600, height: 280 },
        yz: { width: 600, height: 280 },
        persp: { width: 600, height: 300 },
        iso: { width: 600, height: 300 },
        perspFloat: { width: 400, height: 250 }
    };

    const original = originalSizes[viewName];
    state.x = 0;
    state.y = 0;
    state.width = original.width;
    state.height = original.height;

    svgs[viewName].attr({
        viewBox: `${state.x} ${state.y} ${state.width} ${state.height}`
    });

    updateCurve();
    console.log(`Reset view ${viewName}`);
}

// Zoom view - always zooms to center of current viewport
function zoomView(viewName, delta) {
    const state = viewBoxState[viewName];
    if (!state) return;

    const zoomFactor = delta > 0 ? 0.95 : 1.05;
    const oldWidth = state.width;
    const oldHeight = state.height;

    // Calculate new dimensions
    state.width *= zoomFactor;
    state.height *= zoomFactor;

    // Zoom towards center of current viewport
    // The center stays at the same position in world coordinates
    state.x += (oldWidth - state.width) / 2;
    state.y += (oldHeight - state.height) / 2;

    // Apply new viewBox
    svgs[viewName].attr({
        viewBox: `${state.x} ${state.y} ${state.width} ${state.height}`
    });

    // Update background size to cover new viewBox
    const bgElement = svgs[viewName].select(`#bg-${viewName}`);
    if (bgElement) {
        bgElement.attr({
            x: state.x - state.width,
            y: state.y - state.height,
            width: state.width * 3,
            height: state.height * 3
        });
    }

    console.log(`Zoom ${viewName}: viewBox(${state.x.toFixed(0)}, ${state.y.toFixed(0)}, ${state.width.toFixed(0)}, ${state.height.toFixed(0)})`);
}

// Setup panning on background for a view
function setupViewPanning(snapSvg, viewName) {
    const state = viewBoxState[viewName];
    if (!state) return;

    // Create a transparent background rectangle for capturing pan gestures
    const bgRect = snapSvg.rect(0, 0, state.width * 2, state.height * 2).attr({
        fill: 'transparent',
        cursor: 'grab',
        id: `bg-${viewName}`
    });

    // Move background to back
    bgRect.prependTo(snapSvg);

    // Double-click to reset view
    bgRect.dblclick(function() {
        resetView(viewName);
    });

    let startViewBox = { x: 0, y: 0 };

    // Use .drag() directly instead of .move() to avoid transform shake
    bgRect.drag(
        // Move function
        function(dx, dy) {
            // Update viewBox based on drag delta (opposite direction)
            state.x = startViewBox.x - dx;
            state.y = startViewBox.y - dy;

            // Apply new viewBox - smooth panning with no redraw
            snapSvg.attr({
                viewBox: `${state.x} ${state.y} ${state.width} ${state.height}`
            });
        },
        // Start function
        function() {
            this.attr({ cursor: 'grabbing' });

            // Store starting viewBox
            startViewBox = { x: state.x, y: state.y };
        },
        // End function
        function() {
            this.attr({ cursor: 'grab' });

            // Update background size to cover new viewBox position
            this.attr({
                x: state.x - state.width,
                y: state.y - state.height,
                width: state.width * 3,
                height: state.height * 3
            });

            console.log(`Pan end ${viewName}: viewBox(${state.x.toFixed(0)}, ${state.y.toFixed(0)})`);
        }
    );

    // Add mouse wheel zoom support - zooms to center of viewport
    const svgNode = snapSvg.node;
    svgNode.addEventListener('wheel', function(e) {
        e.preventDefault();
        zoomView(viewName, e.deltaY);
    }, { passive: false });

    return bgRect;
}

// Draw a Bezier curve on an SVG with control points and polygon
function drawBezierCurve(snapSvg, bezier2d, offsetX, offsetY, scale, xLabel, yLabel, flipY, cameraInfo, planeName) {
    // Preserve background element if it exists
    const bgElement = planeName ? snapSvg.select(`#bg-${planeName}`) : null;

    snapSvg.clear();

    // Restore and update background for panning
    if (planeName) {
        if (bgElement) {
            bgElement.prependTo(snapSvg);
            // Update background size based on current viewBox
            const state = viewBoxState[planeName];
            if (state) {
                bgElement.attr({
                    x: state.x - state.width,
                    y: state.y - state.height,
                    width: state.width * 3,
                    height: state.height * 3
                });
            }
        } else {
            setupViewPanning(snapSvg, planeName);
        }
    }

    if (!bezier2d || !bezier2d.points) return;

    const canvasHeight = 260;

    // Draw coordinate axes for orthographic views only (not perspective or iso)
    if (planeName && (planeName === 'xy' || planeName === 'xz' || planeName === 'yz')) {
        drawAxes(snapSvg, offsetX, offsetY, 360, canvasHeight - offsetY - 10, scale, xLabel || 'X', yLabel || 'Y');
    }

    // Draw camera icon if this is an orthographic view and camera info provided
    if (cameraInfo && planeName !== 'persp' && planeName !== 'iso') {
        const plane = (xLabel === 'X' && yLabel === 'Y') ? 'xy' :
                      (xLabel === 'X' && yLabel === 'Z') ? 'xz' : 'yz';
        drawCameraIcon(
            snapSvg,
            cameraInfo.camX, cameraInfo.camY, cameraInfo.camZ,
            cameraInfo.targetX, cameraInfo.targetY, cameraInfo.targetZ,
            offsetX, offsetY, scale, plane, flipY, canvasHeight
        );
    }

    const points = bezier2d.points;

    // Transform points to screen coordinates (flip Y if needed so Z points up)
    const transform = (p) => ({
        x: offsetX + p.x * scale,
        y: flipY ? (offsetY + canvasHeight - offsetY - 10 - p.y * scale) : (offsetY + p.y * scale)
    });

    // Inverse transform for drag handling
    const inverseTransform = (sx, sy) => ({
        x: (sx - offsetX) / scale,
        y: flipY ? (offsetY + canvasHeight - offsetY - 10 - sy) / scale : (sy - offsetY) / scale
    });

    const screenPoints = points.map(transform);

    // Draw control polygon (light orange)
    const polygonPath = screenPoints.map((p, i) =>
        (i === 0 ? 'M' : 'L') + p.x + ',' + p.y
    ).join(' ');
    snapSvg.path(polygonPath).attr({
        stroke: '#FF9800',
        strokeWidth: 1,
        strokeOpacity: 0.3,
        fill: 'none'
    });

    // Build the bezier curve path using transformed coordinates
    let curvePath;
    if (screenPoints.length === 3) {
        // Quadratic bezier
        curvePath = `M${screenPoints[0].x},${screenPoints[0].y} Q${screenPoints[1].x},${screenPoints[1].y} ${screenPoints[2].x},${screenPoints[2].y}`;
    } else if (screenPoints.length === 4) {
        // Cubic bezier
        curvePath = `M${screenPoints[0].x},${screenPoints[0].y} C${screenPoints[1].x},${screenPoints[1].y} ${screenPoints[2].x},${screenPoints[2].y} ${screenPoints[3].x},${screenPoints[3].y}`;
    } else {
        // For higher order curves, sample points
        curvePath = 'M' + screenPoints[0].x + ',' + screenPoints[0].y;
        for (let t = 0; t <= 1; t += 0.02) {
            const pt = bezier2d.compute(t);
            const screenPt = transform(pt);
            curvePath += ' L' + screenPt.x + ',' + screenPt.y;
        }
    }

    // Draw the Bezier curve (blue)
    snapSvg.path(curvePath).attr({
        stroke: '#2196F3',
        strokeWidth: 2.5,
        fill: 'none',
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
    });

    // Draw draggable control points on top (only for orthographic views)
    if (planeName && (planeName === 'xy' || planeName === 'xz' || planeName === 'yz')) {
        screenPoints.forEach((p, i) => {
            let color, radius;
            if (i === 0) {
                color = '#4CAF50'; // Start point - green
                radius = 5;
            } else if (i === screenPoints.length - 1) {
                color = '#f44336'; // End point - red
                radius = 5;
            } else {
                color = '#FF9800'; // Control points - orange
                radius = 4;
            }

            const circle = snapSvg.circle(p.x, p.y, radius).attr({
                fill: color,
                stroke: 'white',
                strokeWidth: 1.5,
                cursor: 'move'
            });

            // Determine which dimensions this plane controls
            let dim1, dim2;
            if (planeName === 'xy') {
                dim1 = 'x'; dim2 = 'y';
            } else if (planeName === 'xz') {
                dim1 = 'x'; dim2 = 'z';
            } else if (planeName === 'yz') {
                dim1 = 'y'; dim2 = 'z';
            }

            // Store metadata on the element for use in event handlers
            circle.data('pointIndex', i);
            circle.data('dim1', dim1);
            circle.data('dim2', dim2);
            circle.data('inverseTransform', inverseTransform);

            // Make control points draggable using move() wrapper
            // Set up event listeners for control point movement
            eve.on(`drag.move.start.${circle.id}`, function() {
                const el = this;
                el.attr({ fillOpacity: 0.7 });
                console.log(`Move start for point ${el.data('pointIndex')}`);
            });

            eve.on(`drag.move.ongoing.${circle.id}`, function() {
                const el = this;
                // Get current transformed position using getBBox which returns screen coordinates
                const bbox = el.getBBox();
                const screenX = bbox.cx;
                const screenY = bbox.cy;

                // Get the original circle attributes (not transformed)
                const origCx = parseFloat(el.attr('cx'));
                const origCy = parseFloat(el.attr('cy'));

                // Get the transform matrix
                const matrix = el.getLocalMatrix();

                console.log(`Move ongoing - Point ${el.data('pointIndex')}: screen(${screenX.toFixed(1)}, ${screenY.toFixed(1)}), orig(${origCx.toFixed(1)}, ${origCy.toFixed(1)}), matrix(${matrix.e.toFixed(1)}, ${matrix.f.toFixed(1)})`);

                // Convert transformed screen coordinates back to world coordinates
                const invTransform = el.data('inverseTransform');
                const worldPos = invTransform(screenX, screenY);

                // Update the 3D control point based on plane
                const idx = el.data('pointIndex');
                const d1 = el.data('dim1');
                const d2 = el.data('dim2');

                console.log(`  -> World: ${d1}=${worldPos.x.toFixed(1)}, ${d2}=${worldPos.y.toFixed(1)}`);

                if (d1 && d2) {
                    emitControlPointChange(idx, d1, worldPos.x);
                    emitControlPointChange(idx, d2, worldPos.y);
                }
            });

            eve.on(`drag.move.end.${circle.id}`, function() {
                const el = this;
                el.attr({ fillOpacity: 1 });
                console.log(`Move end for point ${el.data('pointIndex')}`);
            });

            // Enable move behavior using transforms
            circle.move();
        });
    } else {
        // For perspective and isometric views, just draw non-draggable points
        screenPoints.forEach((p, i) => {
            let color, radius;
            if (i === 0) {
                color = '#4CAF50';
                radius = 5;
            } else if (i === screenPoints.length - 1) {
                color = '#f44336';
                radius = 5;
            } else {
                color = '#FF9800';
                radius = 4;
            }

            snapSvg.circle(p.x, p.y, radius).attr({
                fill: color,
                stroke: 'white',
                strokeWidth: 1.5
            });
        });
    }
}

// Update all projections
function updateCurve() {
    try {
        // Create 3D curve using global control points
        const curve3d = Snap.bezier([
            {x: controlPoints3D[0].x, y: controlPoints3D[0].y, z: controlPoints3D[0].z},
            {x: controlPoints3D[1].x, y: controlPoints3D[1].y, z: controlPoints3D[1].z},
            {x: controlPoints3D[2].x, y: controlPoints3D[2].y, z: controlPoints3D[2].z},
            {x: controlPoints3D[3].x, y: controlPoints3D[3].y, z: controlPoints3D[3].z}
        ]);

        console.log('3D Curve created:', curve3d);
        console.log('Is 3D:', curve3d._3d);

        // Perspective projection - use camera controls
        const camX = parseInt(document.getElementById('camX').value);
        const camY = parseInt(document.getElementById('camY').value);
        const camZ = parseInt(document.getElementById('camZ').value);
        const focal = parseInt(document.getElementById('focal').value);

        document.getElementById('camX-val').textContent = camX;
        document.getElementById('camY-val').textContent = camY;
        document.getElementById('camZ-val').textContent = camZ;
        document.getElementById('focal-val').textContent = focal;

        // Calculate target as center of control points
        const targetX = (controlPoints3D[0].x + controlPoints3D[3].x) / 2;
        const targetY = (controlPoints3D[0].y + controlPoints3D[3].y) / 2;
        const targetZ = (controlPoints3D[0].z + controlPoints3D[1].z + controlPoints3D[2].z + controlPoints3D[3].z) / 4;

        const projPersp = curve3d.projectPerspective({
            focalLength: focal,
            camera: {x: camX, y: camY, z: camZ},
            target: {x: targetX, y: targetY, z: targetZ}
        });
        drawBezierCurve(svgs.persp, projPersp, 250, 140, 1.2, 'X', 'Y', false, null, 'persp');

        // Also draw to floating perspective view
        drawBezierCurve(svgs.perspFloat, projPersp, 200, 120, 1.0, 'X', 'Y', false, null, 'persp-float');

        // Isometric-like projection
        const projIso = curve3d.projectCustom(function(p) {
            const angle = Math.PI / 6; // 30 degrees
            return {
                x: p.x - p.z * Math.cos(angle),
                y: p.y + p.z * Math.sin(angle)
            };
        });
        drawBezierCurve(svgs.iso, projIso, 150, 50, 1.0, 'X', 'Y', false, null, 'iso');

        // Prepare camera info for orthographic views
        const cameraInfo = {
            camX: camX,
            camY: camY,
            camZ: camZ,
            targetX: targetX,
            targetY: targetY,
            targetZ: targetZ,
            showInXY: true
        };

        // XY Plane (Top View) - X horizontal, Y vertical (no flip)
        const projXY = curve3d.projectToPlane('xy');
        drawBezierCurve(svgs.xy, projXY, 180, 130, 0.8, 'X', 'Y', false, cameraInfo, 'xy');

        // XZ Plane (Front View) - X horizontal, Z vertical (flip Y so Z points up)
        const projXZ = curve3d.projectToPlane('xz');
        drawBezierCurve(svgs.xz, projXZ, 180, 40, 0.8, 'X', 'Z', true, cameraInfo, 'xz');

        // YZ Plane (Side View) - Y horizontal, Z vertical (flip Y so Z points up)
        const projYZ = curve3d.projectToPlane('yz');
        drawBezierCurve(svgs.yz, projYZ, 180, 40, 0.8, 'Y', 'Z', true, cameraInfo, 'yz');

        console.log(' All projections updated successfully');
    } catch (e) {
        console.error('Error updating curve:', e);
        // Show error in SVGs
        Object.values(svgs).forEach(svg => {
            svg.clear();
            svg.text(190, 125, 'Error: ' + e.message).attr({
                textAnchor: 'middle',
                fill: '#f44336',
                fontSize: 12
            });
        });
    }
}

function resetCurve() {
    // Reset to initial values
    const initial = [
        {x: -100, y: -50, z: 50},
        {x: -50, y: 50, z: 150},
        {x: 50, y: 50, z: 150},
        {x: 100, y: -50, z: 50}
    ];

    initial.forEach((pt, i) => {
        emitControlPointChange(i, 'x', pt.x);
        emitControlPointChange(i, 'y', pt.y);
        emitControlPointChange(i, 'z', pt.z);
    });
}

function animateRotation() {
    if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
        return;
    }

    let angle = 0;
    const animate = () => {
        try {
            const curve3d = Snap.bezier([
                {x: controlPoints3D[0].x, y: controlPoints3D[0].y, z: controlPoints3D[0].z},
                {x: controlPoints3D[1].x, y: controlPoints3D[1].y, z: controlPoints3D[1].z},
                {x: controlPoints3D[2].x, y: controlPoints3D[2].y, z: controlPoints3D[2].z},
                {x: controlPoints3D[3].x, y: controlPoints3D[3].y, z: controlPoints3D[3].z}
            ]);

            // Get current camera configuration
            const staticCameraX = parseInt(document.getElementById('camX').value);
            const staticCameraY = parseInt(document.getElementById('camY').value);
            const staticCameraZ = parseInt(document.getElementById('camZ').value);
            const focal = parseInt(document.getElementById('focal').value);

            const targetX = (controlPoints3D[0].x + controlPoints3D[3].x) / 2;
            const targetY = (controlPoints3D[0].y + controlPoints3D[3].y) / 2;
            const targetZ = (controlPoints3D[0].z + controlPoints3D[1].z + controlPoints3D[2].z + controlPoints3D[3].z) / 4;

            // Calculate radius: distance from static camera to target
            const dx = staticCameraX - targetX;
            const dz = staticCameraZ - targetZ;
            const radius = Math.sqrt(dx * dx + dz * dz);

            // Calculate starting angle from static camera position
            const startAngle = Math.atan2(staticCameraZ - targetZ, staticCameraX - targetX);
            const currentAngle = startAngle + angle;

            // Camera orbits in XZ plane (horizontal circle)
            const cameraX = targetX + radius * Math.cos(currentAngle);
            const cameraZ = targetZ + radius * Math.sin(currentAngle);

            const projPersp = curve3d.projectPerspective({
                focalLength: focal,
                camera: {x: cameraX, y: staticCameraY, z: cameraZ},
                target: {x: targetX, y: targetY, z: targetZ}
            });

            drawBezierCurve(svgs.persp, projPersp, 250, 140, 1.2, 'X', 'Y', false, null, 'persp');

            angle += 0.05;
            if (angle < Math.PI * 2) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                animationFrame = null;
                updateCurve(); // Reset to normal view
            }
        } catch (e) {
            console.error('Animation error:', e);
            animationFrame = null;
        }
    };

    animate();
}

function resetCamera() {
    emitCameraChange('camX', 0);
    emitCameraChange('camY', 250);
    emitCameraChange('camZ', -100);
    emitCameraChange('focal', 600);
    // Update sliders
    document.getElementById('camX').value = 0;
    document.getElementById('camY').value = 250;
    document.getElementById('camZ').value = -100;
    document.getElementById('focal').value = 600;
}

// Add event listeners for all control point sliders (only z dimension)
for (let i = 0; i < 4; i++) {
    const sliderId = `p${i}-z`;
    const slider = document.getElementById(sliderId);
    if (slider) {
        slider.addEventListener('input', function(e) {
            const value = parseFloat(this.value);
            emitControlPointChange(i, 'z', value);
        });
    }
}

// Add camera control event listeners
['camX', 'camY', 'camZ', 'focal'].forEach(id => {
    document.getElementById(id).addEventListener('input', function(e) {
        const value = parseFloat(this.value);
        emitCameraChange(id, value);
    });
});

// Initialize when page loads
function initializeDemo() {
    console.log('Initializing demo...');
    setTimeout(() => {
        if (typeof Snap !== 'undefined' && typeof Snap.bezier === 'function') {
            updateCurve();
            console.log('✅ Demo initialized successfully!');
        } else {
            console.error('❌ Required libraries not loaded');
            console.error('Snap:', typeof Snap);
            console.error('Snap.bezier:', typeof Snap?.bezier);
            document.querySelectorAll('svg').forEach(svg => {
                svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#f44336" font-size="12">Error: Libraries not loaded</text>';
            });
        }
    }, 100);
}

// Handle both cases: page already loaded or still loading
if (document.readyState === 'loading') {
    // Page is still loading, wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', initializeDemo);
} else {
    // Page has already loaded (happens with htmlpreview.github.io and late-loaded scripts)
    initializeDemo();
}

// ===== Floating Perspective View Controls =====
const floatingPerspective = Snap(document.getElementById('floatingPerspective'));
const perspectiveViewInMain = Snap(document.querySelector('.perspective-grid'));
let floatingViewHidden = false;

// Check if perspective view is visible in viewport
function isPerspectiveViewVisible() {
    if (!perspectiveViewInMain) return true;
    const rect = perspectiveViewInMain.node.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    // Consider it hidden if the top is above the viewport
    return rect.bottom > 0 && rect.top < windowHeight;
}

// Handle scroll to show/hide floating perspective
function handleScroll() {
    if (floatingViewHidden) return; // User manually closed it

    const perspectiveVisible = isPerspectiveViewVisible();

    if (!perspectiveVisible) {
        floatingPerspective.addClass('visible');
    } else {
        floatingPerspective.removeClass('visible');
    }
}

// Hide floating perspective (user action)
function hideFloatingPerspective() {
    floatingPerspective.removeClass('visible');
    floatingViewHidden = true;
}

// Show floating perspective again when scrolled
function resetFloatingView() {
    floatingViewHidden = false;
    handleScroll();
}

// Add scroll listener with throttle
let scrollTimeout;
window.addEventListener('scroll', function() {
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleScroll, 50);
}, { passive: true });

// Check on resize
window.addEventListener('resize', handleScroll, { passive: true });

// Initial check
setTimeout(handleScroll, 500);

// ===== Make Floating View Draggable =====
(function() {
    const header = floatingPerspective.select('.view-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.node.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // Touch events for mobile
    header.node.addEventListener('touchstart', dragStart);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', dragEnd);

    function dragStart(e) {
        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target === header.node || header.node.contains(e.target)) {
            if (!e.target.classList.contains('close-btn')) {
                isDragging = true;
            }
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            // Keep within viewport bounds
            const rect = floatingPerspective.node.getBoundingClientRect();
            const maxX = window.innerWidth - rect.width - 20;
            const maxY = window.innerHeight - rect.height - 20;

            xOffset = Math.max(-rect.width + 100, Math.min(maxX + rect.left, xOffset));
            yOffset = Math.max(-rect.height + 60, Math.min(maxY + rect.top, yOffset));

            setTranslate(xOffset, yOffset, floatingPerspective);
        }
    }

    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
        el.translate(xPos, yPos, "id"); //id makes it as if identity matri is used as a bases
    }
})();

// Make functions globally accessible
window.hideFloatingPerspective = hideFloatingPerspective;
window.resetFloatingView = resetFloatingView;

