(function () {
    const svg = Snap("#mobius-stage");
    const width = 720;
    const height = 520;
    const warpCenter = {x: width / 2, y: height / 2};

    const background = svg.rect(0, 0, width, height)
        .attr({fill: "#1e0713"});

    const grid = svg.g().attr({pointerEvents: "none"});
    const cols = Math.round(width / 40);
    const rows = Math.round(height / 40);
    grid.grid(width, height, rows, cols, {
        fill: "none",
        stroke: "#431322",
        "stroke-width": 0.8,
        opacity: 0.5
    }, null, grid);

    const referenceCircle = svg.circle(warpCenter.x, warpCenter.y, 190)
        .attr({
            fill: "#f9731622",
            stroke: "#fdba74",
            strokeDasharray: "10 8",
            strokeWidth: 2
        });

    svg.text(warpCenter.x, warpCenter.y - 200, "reference disk")
        .attr({fill: "#fed7aa", fontSize: 13, textAnchor: "middle"});

    const focusMarker = svg.circle(warpCenter.x, warpCenter.y, 6)
        .attr({fill: "#fb7185", stroke: "#450a0a", strokeWidth: 2});

    const motif = svg.g();
    motif.path("M-80 -30 Q-40 -110 20 -80 T90 -30 L70 60 Q40 110 -20 80 T-90 30 Z")
        .attr({fill: "#fb7185", stroke: "#fff", strokeWidth: 3, opacity: 0.95});
    motif.path("M-40 -10 C-10 -60 40 -60 70 -10 S20 70 -30 20 Z")
        .attr({fill: "#fef2f2", opacity: 0.65});
    motif.add(svg.circle(0, 0, 8).attr({fill: "#1f2937", stroke: "#fee2e2", strokeWidth: 2}));
    motif.attr({cursor: "grab"});
    motif.translate(warpCenter.x, warpCenter.y - 10, "id");

    const statusEl = document.getElementById("mobius-status");
    const toggleBtn = document.getElementById("toggle-warp");
    const resetBtn = document.getElementById("reset-shape");
    const sliderRadius = document.getElementById("focus-radius");
    const sliderAngle = document.getElementById("focus-angle");
    const sliderRotation = document.getElementById("focus-rotation");
    const sliderOutputs = {
        radius: document.querySelector('[data-field="focus-radius"]'),
        angle: document.querySelector('[data-field="focus-angle"]'),
        rotation: document.querySelector('[data-field="focus-rotation"]')
    };

    let currentWarp = null;
    let warpId = null;

    function updateSliderLabels() {
        sliderOutputs.radius.textContent = `${sliderRadius.value} px`;
        sliderOutputs.angle.textContent = `${sliderAngle.value}°`;
        sliderOutputs.rotation.textContent = `${sliderRotation.value}°`;
    }

    function buildTransform() {
        const radius = +sliderRadius.value;
        const angleDeg = +sliderAngle.value;
        const spin = +sliderRotation.value;
        const theta = Snap.rad(angleDeg);
        const focus = {
            x: warpCenter.x + Math.cos(theta) * radius,
            y: warpCenter.y + Math.sin(theta) * radius
        };
        focusMarker.attr({cx: focus.x, cy: focus.y});
        return Snap.NonlinTransforms.mobiusDisk(focus, spin, {
            referenceCircle: {
                center: warpCenter,
                radius: 190
            },
            origin: warpCenter
        });
    }

    function applyTransform() {
        currentWarp = buildTransform();
        if (warpId) {
            motif.addWarp(currentWarp, null, warpId);
        }
        updateStatus();
    }

    function updateStatus(bbox) {
        const box = bbox || motif.getBBox();
        const pos = box ? `${Math.round(box.cx)}, ${Math.round(box.cy)}` : "";
        const label = warpId ? "Warp active" : "Warp inactive";
        statusEl.textContent = pos ? `${label} (${pos})` : label;
    }

    toggleBtn.addEventListener("click", () => {
        if (warpId) {
            motif.removeWarp(warpId);
            warpId = null;
            toggleBtn.textContent = "Enable transform";
        } else {
            warpId = motif.addWarp(currentWarp || buildTransform());
            toggleBtn.textContent = "Disable transform";
        }
        updateStatus();
    });

    resetBtn.addEventListener("click", () => {
        sliderRadius.value = 110;
        sliderAngle.value = 35;
        sliderRotation.value = 80;
        motif.translate(warpCenter.x, warpCenter.y - 10, "id");
        motif.attr({cursor: "grab"});
        updateSliderLabels();
        applyTransform();
    });

    [sliderRadius, sliderAngle, sliderRotation].forEach((input) => {
        input.addEventListener("input", () => {
            updateSliderLabels();
            applyTransform();
        });
    });

    eve.on("drag.move.ongoing", function (el) {
        if (el && el.id === motif.id) {
            updateStatus(el.getBBox());
        }
    });

    updateSliderLabels();
    currentWarp = buildTransform();
    warpId = motif.addWarp(currentWarp);
    toggleBtn.textContent = "Disable transform";
    motif.move();
    updateStatus();
})();
