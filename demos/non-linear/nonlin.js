(function () {
    const VIEWBOX = { width: 800, height: 600 };

    function non_lin_demos(group) {
        const paper = group.paper;
        const statusTitle = paper.text(VIEWBOX.width / 2, 40, "Initializing non-linear demos...");
        statusTitle.attr({
            "font-size": 22,
            "font-weight": 600,
            fill: "#1c1f34",
            "text-anchor": "middle"
        });
        const statusCommand = paper.text(VIEWBOX.width / 2, 64, "Preparing transforms");
        statusCommand.attr({
            "font-size": 16,
            "font-weight": 400,
            fill: "#3b3f54",
            "text-anchor": "middle"
        });

        let grid = group.grid(200, 400, 10, 10, { fill: "#ffef99", stroke: "#b79032", "stroke-width": 1 });
        grid.makePath({ recursive: true });

        function randomFillColor() {
            const hue = Math.floor(Math.random() * 360);
            const sat = 35 + Math.random() * 45;
            const light = 35 + Math.random() * 35;
            return `hsl(${hue}, ${sat.toFixed(1)}%, ${light.toFixed(1)}%)`;
        }

        grid.getChildren().forEach(function (child) {
            child.attr("fill", randomFillColor());
        });

        const wave = Snap.NonlinTransforms.sineWave("x", 10, 120, Math.PI / 4, 0.002);
        let bend2 = Snap.NonlinTransforms.bendCantilever({ x: 200, y: 0 }, { x: 200, y: 400 }, 70);
        let compose = Snap.NonlinTransforms.compose(wave, bend2);
        grid.getChildren().forEach(ch => {
            ch.genTransform(compose);
            ch.getTransformFix();
        });

        const twistTween = Snap.NonlinTransforms.parametrize("rotate3d", [
            [1, 1, .5],
            [0, 360],
            { origin: { x: 150, y: 120, z: 100 } },
        ]);

        mina.setTimeout(() => grid.animateGenTransform(twistTween, 2000, mina.easeinout), 100);

        const demoEase = (mina && mina.easeinout) ? mina.easeinout : function (t) {
            return t;
        };
        const demoQueue = [];
        const defaultPause = 600;

        const updateStatus = (message, command) => {
            statusTitle.attr({ text: message });
            statusCommand.attr({ text: command || "" });
        };

        function queueDemo(label, command, runner, duration, pause) {
            demoQueue.push({
                label: label,
                command: command,
                runner: runner,
                duration: duration || 3000,
                pause: pause || defaultPause
            });
        }

        function runDemo(index) {
            if (index >= demoQueue.length) {
                updateStatus("Finished non-linear transform demos ✔");
                return;
            }
            const entry = demoQueue[index];
            updateStatus(entry.label, entry.command);
            try {
                entry.runner();
            } catch (err) {
                console.error("Demo runner failed", entry.label, err);
            }
            mina.setTimeout(function () {
                runDemo(index + 1);
            }, entry.duration + entry.pause);
        }

        queueDemo("Demo 1 – diagonal sine wave axis sweep", "Snap.NonlinTransforms.parametrize(\"sineWave\", [...])", function () {
            const diagonalAxis = [{ x: -220, y: -160 }, { x: 220, y: 160 }];
            const sineTween = Snap.NonlinTransforms.parametrize("sineWave", [
                diagonalAxis,
                [0, 32],
                140,
                [0, Math.PI * 2],
                0.0012,
            ]);
            grid.animateGenTransform(sineTween, 3200, demoEase);
        }, 3200);

        queueDemo("Demo 2 – cantilever bend along custom axis", "Snap.NonlinTransforms.parametrize(\"cantilever\", [...])", function () {
            const cantileverTween = Snap.NonlinTransforms.parametrize("cantilever", [
                { x: -120, y: -80 },
                320,
                45,
                [0, Math.PI / 3],
                1.1,
                [{ x: -200, y: 140 }, { x: 220, y: -110 }],
                0.001,
            ]);
            grid.animateGenTransform(cantileverTween, 3600, demoEase);
        }, 3600);

        queueDemo("Demo 3 – spring bend with diagonal rod", "Snap.NonlinTransforms.parametrize(\"springBend\", [...])", function () {
            const springTween = Snap.NonlinTransforms.parametrize("springBend", [
                { x: -150, y: -120 },
                360,
                [0, Math.PI / 2],
                1.05,
                { from: { x: -220, y: -60 }, to: { x: 200, y: 130 } },
                0.0008,
            ]);
            grid.animateGenTransform(springTween, 3200, demoEase);
        }, 3200);

        queueDemo("Demo 4 – radial ripple pulse", "Snap.NonlinTransforms.parametrize(\"radialRipple\", [...])", function () {
            const rippleTween = Snap.NonlinTransforms.parametrize("radialRipple", [
                { x: 0, y: 0 },
                [0, 45],
                120,
                0.008,
                [0, Math.PI * 2],
            ]);
            grid.animateGenTransform(rippleTween, 3000, demoEase);
        }, 3000);

        queueDemo("Demo 5 – bulge to pinch sweep", "Snap.NonlinTransforms.parametrize(\"bulge\", [...])", function () {
            const bulgeTween = Snap.NonlinTransforms.parametrize("bulge", [
                { x: 0, y: 0 },
                180,
                [-0.45, 0.45],
            ]);
            grid.animateGenTransform(bulgeTween, 2600, demoEase);
        }, 2600);

        queueDemo("Demo 6 – 3D tumble with perspective projection", "Snap.NonlinTransforms.compose(perspective, rotate3d)", function () {
            const projector = function (pt) {
                return { x: pt.x, y: pt.y };
            };
            const tumbleTween = function (t) {
                const yaw = -30 + 60 * t;
                const pitch = 25 * Math.sin(t * Math.PI * 2);
                const roll = 15 * Math.cos(t * Math.PI * 2);
                const rotate = Snap.NonlinTransforms.compose(
                    Snap.NonlinTransforms.rotateY(yaw, { origin: { x: 0, y: 0, z: 0 } }),
                    Snap.NonlinTransforms.rotateX(pitch, { origin: { x: 0, y: 0, z: 0 } }),
                    Snap.NonlinTransforms.rotateZ(roll, { origin: { x: 0, y: 0, z: 0 } })
                );
                return Snap.NonlinTransforms.compose(
                    Snap.NonlinTransforms.perspective(900, { project: projector }),
                    rotate
                );
            };
            grid.animateGenTransform(tumbleTween, 3800, demoEase);
        }, 3800, 800);

        queueDemo("Demo 7 – twist/pinch spiral stress test", "Snap.NonlinTransforms.parametrize(\"twistPinch\", [...])", function () {
            const twistPinchTween = Snap.NonlinTransforms.parametrize("twistPinch", [
                { x: 0, y: 0 },
                220,
                [0, 720],
                [0.2, 0.6],
            ]);
            grid.animateGenTransform(twistPinchTween, 3200, demoEase);
        }, 3200);

        queueDemo("Demo 8 – bendCantilever tip sweep", "Snap.NonlinTransforms.parametrize(\"bendCantilever\", [...])", function () {
            const bendTween = Snap.NonlinTransforms.parametrize("bendCantilever", [
                { x: -120, y: -160 },
                { x: 180, y: 140 },
                [0, 120],
                0.001,
            ]);
            grid.animateGenTransform(bendTween, 3400, demoEase);
        }, 3400);

        const TAU = Math.PI * 2;

        queueDemo("Demo 9 – compound sine + bulge warp", "Snap.NonlinTransforms.compose(sineWave, bulge)", function () {
            const axis = [{ x: -220, y: 120 }, { x: 220, y: -80 }];
            const comboTween = function (t) {
                const sineAmp = 15 + 25 * Math.sin(t * TAU);
                const sinePhase = TAU * t;
                const sine = Snap.NonlinTransforms.sineWave(axis, sineAmp, 130, sinePhase, 0.0005);
                const bulgeStrength = -0.25 + 0.5 * Math.sin(t * TAU);
                const bulgeCenter = {
                    x: 60 * Math.sin(t * TAU * 0.5),
                    y: -40 + 40 * Math.cos(t * TAU * 0.5),
                };
                const bulge = Snap.NonlinTransforms.bulge(bulgeCenter, 200, bulgeStrength);
                return Snap.NonlinTransforms.compose(sine, bulge);
            };
            grid.animateGenTransform(comboTween, 3600, demoEase);
        }, 3600);

        queueDemo("Demo 10 – dual radial ripple interference", "Snap.NonlinTransforms.compose(radialRipple, radialRipple)", function () {
            const dualRipple = function (t) {
                const orbitRadius = 140;
                const cx = orbitRadius * Math.cos(t * TAU);
                const cy = orbitRadius * Math.sin(t * TAU);
                const rippleA = Snap.NonlinTransforms.radialRipple({ x: cx, y: cy }, 25, 100, 0.01, t * TAU);
                const rippleB = Snap.NonlinTransforms.radialRipple({ x: -cx, y: -cy }, -18, 120, 0.01, -t * TAU);
                return Snap.NonlinTransforms.compose(rippleA, rippleB);
            };
            grid.animateGenTransform(dualRipple, 3200, demoEase);
        }, 3200);

        queueDemo("Demo 11 – adaptive cantilever falloff sweep", "Snap.NonlinTransforms.parametrize(\"cantilever\", [...])", function () {
            const adaptiveCantilever = Snap.NonlinTransforms.parametrize("cantilever", [
                { x: -80, y: -60 },
                280,
                60,
                [0, Math.PI / 4],
                1,
                { points: [{ x: -200, y: -140 }, { x: 200, y: 40 }] },
                [0.0005, 0.003],
            ]);
            grid.animateGenTransform(adaptiveCantilever, 3600, demoEase);
        }, 3600);

        queueDemo("Demo 12 – spring recoil along horizontal rail", "Snap.NonlinTransforms.parametrize(\"springBend\", [...])", function () {
            const recoilTween = Snap.NonlinTransforms.parametrize("springBend", [
                { x: 0, y: -160 },
                420,
                [0, Math.PI / 1.5],
                [0.8, 1.3],
                { from: { x: -220, y: 0 }, to: { x: 220, y: 0 } },
                [0.0003, 0.0015],
            ]);
            grid.animateGenTransform(recoilTween, 3400, demoEase);
        }, 3400);

        queueDemo("Demo 13 – 3D carousel orbit", "Snap.NonlinTransforms.compose(perspective, rotateX/Y/Z)", function () {
            const projector = function (pt) {
                return { x: pt.x, y: pt.y };
            };
            const carouselTween = function (t) {
                const yaw = (t * 360) - 180;
                const tilt = 12 * Math.sin(t * TAU * 1.5);
                const sway = 6 * Math.cos(t * TAU);
                const rotation = Snap.NonlinTransforms.compose(
                    Snap.NonlinTransforms.rotateY(yaw, { origin: { x: 0, y: 0, z: 0 } }),
                    Snap.NonlinTransforms.rotateX(tilt, { origin: { x: 0, y: 0, z: 0 } }),
                    Snap.NonlinTransforms.rotateZ(sway, { origin: { x: 0, y: 0, z: 0 } })
                );
                const translation = Snap.NonlinTransforms.translate3d(0, 0, -120);
                return Snap.NonlinTransforms.compose(
                    Snap.NonlinTransforms.perspective(820, { project: projector }),
                    rotation,
                    translation
                );
            };
            grid.animateGenTransform(carouselTween, 4000, demoEase);
        }, 4000, 800);

        const initialDemoDelay = 2700;
        mina.setTimeout(function () {
            runDemo(0);
        }, initialDemoDelay);
    }

    document.addEventListener("DOMContentLoaded", function () {
        const paper = Snap("#demo-svg");
        paper.clear();
        paper.rect(0, 0, VIEWBOX.width, VIEWBOX.height).attr({
            fill: "rgba(16, 24, 48, 0.04)"
        });
        const group = paper.g();

        non_lin_demos(group);
        group.fitInBox({ width: VIEWBOX.width * .5, height: VIEWBOX.height * .5, cx: VIEWBOX.width / 2, cy: VIEWBOX.height / 2 }, true);

        let on = true
        group.click(() => {
            if (on) {
                mina.pauseAll();
            } else {
                mina.resumeAll();
            }
            on = !on
        });
    });
})();