(function () {
    const svg = Snap("#warp-stage");
    const width = 720;
    const height = 480;
    const warpCenter = {x: width / 2, y: height / 2};

    const backdrop = svg.rect(0, 0, width, height)
        .attr({
            fill: "#0f172a",
            stroke: "#1e293b",
            strokeWidth: 0
        });

    const coarseGrid = svg.g().attr({pointerEvents: "none"});
    const fineGrid = svg.g().attr({pointerEvents: "none"});
    const coarseRows = Math.round(height / 40);
    const coarseCols = Math.round(width / 40);
    const fineRows = Math.round(height / 20);
    const fineCols = Math.round(width / 20);

    coarseGrid.grid(width, height, coarseRows, coarseCols, {
        fill: "none",
        stroke: "#1f2937",
        "stroke-width": 0.7,
        opacity: 0.55
    }, null, coarseGrid);

    fineGrid.grid(width, height, fineRows, fineCols, {
        fill: "none",
        stroke: "#1e293b",
        "stroke-width": 0.45,
        opacity: 0.35
    }, null, fineGrid);

    const fieldCircle = svg.circle(warpCenter.x, warpCenter.y, 170)
        .attr({fill: "#0ea5e926", stroke: "#38bdf8", strokeDasharray: "6 6", strokeWidth: 2});
    svg.text(warpCenter.x, warpCenter.y - 190, "Warp field")
        .attr({
            fill: "#bae6fd",
            fontSize: 14,
            textAnchor: "middle"
        });

            const region = fieldCircle;
            const border = {distance: 20, mode: "outside"};

    function createGridProbe(paper, size, cells) {
        const g = paper.g();
        const half = size / 2;
        const panel = g.rect(-half, -half, size, size, 12)
            .attr({fill: "#083344", stroke: "#22d3ee", strokeWidth: 2, opacity: 0.9});

        panel.grid(size, size, cells, cells, {
            fill: "none",
            stroke: "#14b8a6",
            strokeWidth: 0.8,
            opacity: 0.6
        }).translate(-half, -half);

        g.rect(-half, -half, size, size)
            .attr({fill: "none", stroke: "#0ea5e9", strokeWidth: 1.5, strokeDasharray: "8 8", opacity: 0.75});
        const midLines = paper.g();
        midLines.line(-half, 0, half, 0).attr({stroke: "#fff", fill: "none", strokeWidth: 2, opacity: 0.5})
            .line(0, -half, 0, half).attr({stroke: "#fff", fill: "none", strokeWidth: 2, opacity: 0.5});
        g.add(midLines);
        g.circle(0, 0, 5).attr({fill: "#facc15", stroke: "#0f172a", strokeWidth: 1});
        g.text(0, half + 20, "grid probe").attr({fill: "#e0f2fe", fontSize: 14, textAnchor: "middle"});
        g.attr({cursor: "grab", "pointer-events": "all"});
        return g;
    }

    const probe = createGridProbe(svg, 140, 10);
    probe.translate(warpCenter.x, warpCenter.y - 10, "id");

    const warpPresets = {
        twistPinch: {
            description: "Pinches the grid inward while twisting close to the probe center.",
            factory: () => Snap.NonlinTransforms.twistPinch(warpCenter, 220, 35, 0.28)
        },
        bulge: {
            description: "Bulges outward inside a soft radius so nearby squares puff up.",
            factory: () => Snap.NonlinTransforms.bulge(warpCenter, 160, 0.4)
        },
        ripple: {
            description: "Pushes concentric ripples through the lattice for gentle wave motion.",
            factory: () => Snap.NonlinTransforms.radialRipple(warpCenter, 15, 70, 0.003, Math.PI / 3)
        },
        sineDepth: {
            description: "Slides the field along a sine wave and tilts it for a subtle faux-3D hover.",
            factory: () => {
                const axis = [
                    {x: warpCenter.x - 280, y: warpCenter.y - 60},
                    {x: warpCenter.x + 280, y: warpCenter.y + 60}
                ];
                const sine = Snap.NonlinTransforms.sineWave(axis, 58, 190, Math.PI / 8, 0.0012);
                const lift = Snap.NonlinTransforms.translate3d(0, 0, -110);
                const tilt = Snap.NonlinTransforms.rotateX(-18, {origin: {x: warpCenter.x, y: warpCenter.y, z: 0}});
                const perspective = Snap.NonlinTransforms.perspective(880, {
                    origin: {x: warpCenter.x, y: warpCenter.y, z: 0},
                    project: (pt) => ({x: pt.x, y: pt.y})
                });
                // Compose sine displacement with a shallow 3D tilt to keep the warp feeling dimensional.
                return Snap.NonlinTransforms.compose(perspective, tilt, lift, sine);
            }
        }
    };

    const warpSelect = document.getElementById("warp-select");
    const statusEl = document.getElementById("status");
    const toggleBtn = document.getElementById("toggle");
    const resetBtn = document.getElementById("reset");
    const descriptionEl = document.getElementById("warp-description");

            let activeWarpName = warpSelect.value;
            let currentWarp = (warpPresets[activeWarpName] || warpPresets.twistPinch).factory();
            let warpId = probe.addWarp(currentWarp, region, border, undefined, {max_size: 50}); //no need to add max_size again because the path will be modified once
            descriptionEl.textContent = (warpPresets[activeWarpName] || warpPresets.twistPinch).description;
            probe.move();

    function updateStatusText(bbox) {
        const box = bbox || probe.getBBox();
        const pos = box ? `${Math.round(box.cx)}, ${Math.round(box.cy)}` : "";
        const label = warpId ? "Warp active" : "Warp inactive";
        statusEl.textContent = pos ? `${label} (${pos})` : label;
    }

            function setWarp(name) {
                const preset = warpPresets[name] || warpPresets.twistPinch;
                currentWarp = preset.factory();
                activeWarpName = name;
                descriptionEl.textContent = preset.description;
                if (warpId) {
                    probe.removeWarp(warpId);
                    warpId = probe.addWarp(currentWarp, region, border);
                }
                updateStatusText();
            }

            toggleBtn.addEventListener("click", () => {
                if (warpId) {
                    probe.removeWarp(warpId);
                    warpId = null;
                    toggleBtn.textContent = "Enable warp";
                } else {
                    warpId = probe.addWarp(currentWarp, region, border);
                    toggleBtn.textContent = "Disable warp";
                }
                updateStatusText();
            });

    resetBtn.addEventListener("click", () => {
        probe.translate(warpCenter.x, warpCenter.y - 10, "id");
        probe.attr({cursor: "grab"});
        if (warpId) {
            probe.addWarp(currentWarp, null, warpId);
        }
        updateStatusText();
    });

    eve.on("drag.move.ongoing", function (el) {
        if (el && el.id === probe.id) {
            updateStatusText(el.getBBox());
        }
    });

    warpSelect.addEventListener("change", function () {
        setWarp(this.value);
    });

    updateStatusText();
})();
