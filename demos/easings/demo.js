(function init() {
            const ready = () => {
                if (!window.Snap || !window.mina || typeof mina.isEasing !== "function") {
                    console.warn("Snap.svg library missing. Please include it before this script.");
                    return;
                }

                const params = new URLSearchParams(window.location.search);
                const useRise = (() => {
                    if (!params.has("rise")) {
                        return false;
                    }
                    const value = params.get("rise");
                    if (value === null || value === "") {
                        return true;
                    }
                    const normalized = value.toLowerCase();
                    return !["0", "false", "no", "off"].includes(normalized);
                })();

                const svgEl = document.getElementById("easing-board");
                svgEl.style.width = "100%";
                svgEl.style.height = "auto";

                const baseWidth = 1800;
                const columns = 6;
                const cellW = baseWidth / columns;
                const cellH = cellW * 1.5;

                const easingEntries = buildEasingEntries();
                const total = easingEntries.length;
                const rows = Math.ceil(total / columns);
                const baseHeight = Math.max(cellH, rows * cellH);

                svgEl.setAttribute("viewBox", `0 0 ${baseWidth} ${baseHeight}`);
                svgEl.style.aspectRatio = `${baseWidth} / ${baseHeight}`;
                const paper = Snap(svgEl);
                window.main_paper = paper;

                const startAllBtn = Snap(document.getElementById("start-all"));
                const stopAllBtn = Snap(document.getElementById("stop-all"));
                const controllers = [];
                const registerController = (controller) => controllers.push(controller);
                const projectileArcColor = "#5cd1ff";
                const padding = 26;

                const sanitizeId = (input) => {
                    if (!input) {
                        return "entry";
                    }
                    return input
                        .toString()
                        .trim()
                        .replace(/[^a-zA-Z0-9_-]+/g, "-")
                        .replace(/^-+/, "")
                        .replace(/-+$/, "") || "entry";
                };

                paper.rect(0, 0, baseWidth, baseHeight).attr({ fill: "#050505", id: "board-background" });

                easingEntries.forEach((entry, idx) => {
                    const entrySlug = sanitizeId(entry.name || `entry-${idx}`);
                    const entryId = `demo-${entrySlug}-${idx}`;
                    const idFor = (suffix) => `${entryId}-${suffix}`;
                    const col = idx % columns;
                    const row = Math.floor(idx / columns);
                    const originX = col * cellW;
                    const originY = row * cellH;

                    let container = paper.g();
                    container.attr({ id: idFor("group") });
                    const background = container.rect(originX, originY, cellW, cellH);
                    background.attr({
                        fill: (row + col) % 2 === 0 ? "#0d0d0d" : "#101010",
                        stroke: "#1c1c1c",
                        strokeWidth: 1,
                        id: idFor("background"),
                    });

                    const guideYStart = originY + padding * 2;
                    const guideYEnd = originY + cellH - padding * 2.75;
                    const overshootBoundary = originY + cellH - padding * 0.75;
                    const centerX = originX + cellW / 2;

                    const groundLine = container.line(originX + padding, guideYEnd, originX + cellW - padding, guideYEnd)
                        .attr({ stroke: "#1c1c1c", id: idFor("ground-line") });
                    const overshootLine = container.line(originX + padding, overshootBoundary, originX + cellW - padding, overshootBoundary)
                        .attr({ stroke: "#202020", strokeDasharray: "3 6", id: idFor("overshoot-line") });
                    const centerLine = container.line(centerX, guideYStart, centerX, guideYEnd)
                        .attr({ stroke: "#272727", strokeDasharray: "6 6", id: idFor("center-line") });
                    const label = container.text(originX + padding, originY + padding * 1.5, entry.name);
                    label.attr({ fill: "#eaeaea", fontSize: 18, fontFamily: "monospace", id: idFor("label") });
                    if (entry.detail) {
                        container.text(originX + padding, originY + padding * 3.1, entry.detail)
                            .attr({ fill: "#999", fontSize: 16, fontFamily: "monospace", id: idFor("detail") });
                    }

                    const icon = createStartIcon({
                        container,
                        x: originX + cellW - padding * 1.5,
                        y: originY + padding * 1.5,
                        idBase: idFor("icon"),
                    });

                    const sharedContext = {
                        container,
                        entry,
                        originX,
                        originY,
                        cellW,
                        cellH,
                        padding,
                        centerX,
                        guideYStart,
                        guideYEnd,
                        overshootBoundary,
                        icon,
                        useRise,
                        entryId,
                        idFor,
                        paper,
                    };

                    const controller = (entry.type === "projectile")
                        ? createProjectileArcDemo(sharedContext)
                        : createDropDemo({ ...sharedContext, easingFn: entry.easing });
                    registerController(controller);
                });

                startAllBtn.click(() => {
                    controllers.forEach((controller, idx) => {
                        if (!controller.isRunning()) {
                            // controller.start({ delay: idx * 75 });
                            controller.start({ delay: 0 });
                        }
                    });
                });

                stopAllBtn.click(() => {
                    controllers.forEach((controller) => controller.stop());
                });

                // Height now follows width automatically via aspectRatio.

                function buildEasingEntries() {
                    const entries = [];
                    const seenFns = new Set();
                    Object.keys(mina)
                        .filter((name) => typeof mina[name] === "function" && mina.isEasing(name))
                        .sort((a, b) => a.localeCompare(b))
                        .forEach((name) => {
                            const fn = mina[name];
                            if (seenFns.has(fn)) {
                                return;
                            }
                            seenFns.add(fn);
                            entries.push({ name, easing: fn, type: "drop" });
                        });

                    const variants = [
                        {
                            name: "elastic.amp1.6_per0.22",
                            detail: "withParams(1.6, 0.22)",
                            easing: mina.elastic.withParams(1.6, 0.22),
                        },
                        {
                            name: "elastic.amp0.8_per0.5",
                            detail: "withParams(0.8, 0.5)",
                            easing: mina.elastic.withParams(0.8, 0.5),
                        },
                        {
                            name: "bounceGen.5x",
                            detail: "bounceGen(5, 0.82)",
                            easing: mina.bounceGen.withParams(5, 0.82),
                        },
                        {
                            name: "bounceGen.tight",
                            detail: "bounceGen(3, 0.45)",
                            easing: mina.bounceGen.withParams(3, 0.45),
                        },
                        {
                            name: "pulseLinear.multi",
                            detail: "pulseLinear(1, 0.35, 3)",
                            easing: mina.pulseLinear.withParams(1, 0.35, 3),
                        },
                        {
                            name: "pulseDecay.slowFade",
                            detail: "pulseDecay(1, 0.45, 4)",
                            easing: mina.pulseDecay.withParams(1, 0.45, 4),
                        },
                        {
                            name: "projectile.mid0.35",
                            detail: "apex@35%",
                            easing: mina.projectile.withParams(0.35),
                        },
                        {
                            name: "projectile.mid0.65",
                            detail: "apex@65%",
                            easing: mina.projectile.withParams(0.65),
                        },
                        {
                            name: "cBezier.overshoot",
                            detail: "cubicBezier(0.1, 1.1, 0.8, -0.1)",
                            easing: mina.cubicBezier.withParams(0.1, 1.1, 0.8, -0.1),
                        },
                        {
                            name: "elastic.dualPhase",
                            detail: "withParams(1.9, 0.18)",
                            easing: mina.elastic.withParams(1.9, 0.18),
                        },
                        {
                            name: "pulseEaseInOut.offset",
                            detail: "pulseEaseInOut(1, 0.7, 2)",
                            easing: mina.pulseEaseInOut.withParams(1, 0.7, 2),
                        },
                        {
                            name: "compose.easeIn_spring",
                            detail: "compose(easeInCubic, springOut)",
                            easing: mina.compose.withParams(mina.easeInCubic, mina.springOut),
                        },
                        {
                            name: "compose.pulse_back",
                            detail: "compose(pulseLinear, backout)",
                            easing: mina.compose.withParams(
                                mina.pulseLinear.withParams(1, 0.4, 1.25),
                                mina.backout
                            ),
                        },
                        {
                            name: "compose.delayBounce",
                            detail: "compose(delay 0.2, bounceOut)",
                            easing: mina.compose.withParams(
                                mina.delay.withParams(0.2, mina.easeOutQuad),
                                mina.bounceOut
                            ),
                        },
                        {
                            name: "delay.halfElastic",
                            detail: "delay(0.5, elasticOut)",
                            easing: mina.delay.withParams(0.5, mina.elasticOut),
                        },
                        {
                            name: "delay.stutterPulse",
                            detail: "delay(0.35, pulseEaseInOut)",
                            easing: mina.delay.withParams(0.35, mina.pulseEaseInOut.withParams(1, 0.55, 1.5)),
                        },
                    ];

                    variants.forEach((variant) => entries.push({ ...variant, type: "drop" }));

                    entries.push({
                        name: "projectile.manualArc",
                        detail: "linear-x + projectile-y",
                        type: "projectile",
                        projectileEase: mina.projectile.withParams(0.4),
                    });

                    return entries;
                }

                function createStartIcon({ container, x, y, idBase = "start-icon" }) {
                    const radius = 20;
                    const circle = container.circle(x, y, radius).attr({
                        fill: "#0b0b0b",
                        stroke: "#ff7d00",
                        strokeWidth: 1,
                        id: `${idBase}-circle`,
                    });
                    const triangle = container.path([
                        "M", x - radius * 0.35, y - radius * 0.5,
                        "L", x + radius * 0.45, y,
                        "L", x - radius * 0.35, y + radius * 0.5,
                        "Z",
                    ].join(" ")).attr({ fill: "#ff7d00", id: `${idBase}-triangle` });
                    const group = container.g(circle, triangle).attr({
                        cursor: "pointer",
                        opacity: 0.45,
                        id: `${idBase}-group`,
                    });
                    const setState = (active) => group.attr({ opacity: active ? 1 : 0.45 });
                    return { group, setState };
                }

                function createGraphRenderer({ container, idFor, graphX, graphY, graphSize, baselineYTarget }) {
                    const baseY = graphY + graphSize;
                    const group = container.g().attr({
                        id: idFor("graph-group"),
                        "pointer-events": "none",
                    });
                    const state = {
                        samples: [],
                        lastProgress: -Infinity,
                        sampleStep: 1 / 45,
                        minValue: -0.2,
                        maxValue: 1.2,
                    };

                    const range = state.maxValue - state.minValue || 1;
                    const zeroNormalized = (0 - state.minValue) / range;
                    const zeroRawY = graphY + graphSize * (1 - zeroNormalized);
                    const baselineOffset = typeof baselineYTarget === "number"
                        ? baselineYTarget - zeroRawY
                        : 0;
                    const valueToY = (value) => {
                        const clamped = Math.max(state.minValue, Math.min(state.maxValue, value));
                        const normalized = (clamped - state.minValue) / range;
                        return graphY + graphSize * (1 - normalized) + baselineOffset;
                    };

                    const baselineY = valueToY(0);
                    const polyline = group.polyline([
                        graphX, baselineY,
                        graphX, baselineY,
                    ]).attr({
                        fill: "none",
                        stroke: "#ff7d00",
                        strokeWidth: 2,
                        id: idFor("graph-polyline"),
                        "vector-effect": "non-scaling-stroke",
                    });

                    group.line(graphX, valueToY(1), graphX + graphSize, valueToY(1)).attr({
                        stroke: "rgba(255, 255, 255, 0.25)",
                        strokeDasharray: "4 6",
                        strokeWidth: 1,
                        id: idFor("graph-level-line"),
                        "vector-effect": "non-scaling-stroke",
                    });

                    const buildPointString = () => {
                        const startPoint = `${graphX},${valueToY(0)}`;
                        if (!state.samples.length) {
                            return `${startPoint}`;
                        }
                        return [startPoint, ...state.samples.map(([px, py]) => `${px},${py}`)].join(" ");
                    };

                    const refreshPolyline = () => {
                        polyline.attr({ points: buildPointString() });
                    };

                    const clampValue = (value) => valueToY(value);

                    const reset = () => {
                        state.samples = [];
                        state.lastProgress = -Infinity;
                        refreshPolyline();
                    };

                    const addSample = (progress, easedValue) => {
                        const sanitizedProgress = Math.max(0, Math.min(1, progress));
                        if (sanitizedProgress - state.lastProgress < state.sampleStep && sanitizedProgress < 1) {
                            return;
                        }
                        state.lastProgress = sanitizedProgress;
                        const x = graphX + graphSize * sanitizedProgress;
                        const y = clampValue(easedValue);
                        state.samples.push([x, y]);
                        refreshPolyline();
                    };

                    return { reset, addSample };
                }

                function createDropDemo(context) {
                    const {
                        container,
                        easingFn,
                        centerX,
                        guideYStart,
                        guideYEnd,
                        overshootBoundary,
                        icon,
                        useRise,
                        entry,
                        padding,
                        originX,
                        originY,
                        idFor,
                        cellW,
                        cellH,
                    } = context;

                    const graphSize = Math.max(40, Math.min(cellW - padding * 2, guideYEnd - (originY + padding)));
                    const graphX = Math.max(originX + padding, centerX - graphSize / 2);
                    const graphY = guideYEnd - graphSize;
                    const graph = createGraphRenderer({
                        container,
                        idFor,
                        graphX,
                        graphY,
                        graphSize,
                        baselineYTarget: guideYEnd,
                    });

                    const ballRadius = Math.min(16, Math.max(12, cellW * 0.03));
                    const ball = container.circle(centerX, guideYStart, ballRadius)
                        .attr({ fill: "#ff7d00", id: idFor("ball") });
                    container.circle(centerX, guideYStart, 5)
                        .attr({ fill: "#2f2f2f", id: idFor("start-marker") });
                    container.circle(centerX, guideYEnd, 5)
                        .attr({ fill: "#2f2f2f", id: idFor("end-marker") });
                    container.circle(centerX, overshootBoundary, 2)
                        .attr({ fill: "#2f2f2f", opacity: 0.6, id: idFor("overshoot-marker") });

                    if (entry.detail && entry.detail.includes("apex")) {
                        container.text(originX + padding, guideYStart - padding * 0.5, entry.detail)
                            .attr({ fill: "#6fcbe5", fontSize: 10, fontFamily: "monospace", id: idFor("apex-detail") });
                    }

                    const state = {
                        running: false,
                        autoLoop: false,
                        loopTimer: null,
                        startDelayTimer: null,
                        activeAnim: null,
                    };
                    const durationDown = 2200;
                    const durationUp = 1400;

                    const clearTimer = (key) => {
                        if (state[key]) {
                            clearTimeout(state[key]);
                            state[key] = null;
                        }
                    };

                    const stop = () => {
                        clearTimer("loopTimer");
                        clearTimer("startDelayTimer");
                        state.autoLoop = false;
                        state.running = false;
                        if (state.activeAnim && typeof state.activeAnim.stop === "function") {
                            state.activeAnim.stop();
                        }
                        state.activeAnim = null;
                        ball.attr({ cy: guideYStart });
                        graph.reset();
                        icon.setState(false);
                    };

                    const scheduleFallLoop = (delay) => {
                        clearTimer("loopTimer");
                        if (!state.autoLoop) {
                            return;
                        }
                        state.loopTimer = setTimeout(() => {
                            state.loopTimer = null;
                            fall();
                        }, delay);
                    };

                    const fall = () => {
                        if (!state.autoLoop) {
                            stop();
                            return;
                        }
                        if (state.activeAnim && typeof state.activeAnim.stop === "function") {
                            state.activeAnim.stop();
                        }
                        graph.reset();
                        ball.attr({ cy: guideYStart });
                        state.activeAnim = Snap.animate(0, 1, (progress) => {
                            const eased = easingFn(progress);
                            const cy = guideYStart + (guideYEnd - guideYStart) * eased;
                            ball.attr({ cy });
                            graph.addSample(progress, eased);
                        }, durationDown, mina.linear, () => {
                            graph.addSample(1, easingFn(1));
                            state.activeAnim = null;
                            if (!state.autoLoop) {
                                stop();
                                return;
                            }
                            if (useRise) {
                                rise();
                            } else {
                                scheduleFallLoop(1000);
                            }
                        });
                    };

                    const rise = () => {
                        if (!state.autoLoop) {
                            stop();
                            return;
                        }
                        if (state.activeAnim && typeof state.activeAnim.stop === "function") {
                            state.activeAnim.stop();
                        }
                        const delta = guideYEnd - guideYStart;
                        state.activeAnim = Snap.animate(0, 1, (progress) => {
                            const eased = mina.projectile(progress);
                            const cy = guideYEnd - delta * eased;
                            ball.attr({ cy });
                        }, durationUp, mina.linear, () => {
                            state.activeAnim = null;
                            scheduleFallLoop(250);
                        });
                    };

                    const start = ({ delay = 0 } = {}) => {
                        if (state.running) {
                            return;
                        }
                        const begin = () => {
                            state.startDelayTimer = null;
                            state.autoLoop = true;
                            state.running = true;
                            icon.setState(true);
                            fall();
                        };
                        if (delay > 0) {
                            state.startDelayTimer = setTimeout(begin, delay);
                        } else {
                            begin();
                        }
                    };

                    icon.group.click(() => {
                        if (state.running) {
                            stop();
                        } else {
                            start();
                        }
                    });

                    return {
                        start,
                        stop,
                        isRunning: () => state.running,
                    };
                }
                function createProjectileArcDemo(context) {
                    const {
                        paper,
                        icon,
                        guideYEnd,
                        guideYStart,
                        originX,
                        originY,
                        cellW,
                        padding,
                        entry,
                        container,
                        idFor,
                        centerX,
                        cellH,
                    } = context;

                    const projectileEase = entry.projectileEase || mina.projectile;
                    const startX = originX + padding * 1.5;
                    const endX = originX + cellW - padding * 1.5;
                    const baseY = guideYEnd;
                    const arcHeight = Math.max(40, (guideYEnd - guideYStart) * 0.7);
                    const apexY = baseY - arcHeight;
                    const horizontalDelta = endX - startX;
                    const verticalDelta = apexY - baseY;
                    const transformEasing = {
                        default: mina.linear,
                        dx: mina.linear,
                        dy: projectileEase,
                    };

                    const sampledPath = (() => {
                        const steps = 48;
                        const d = ["M", startX, baseY];
                        for (let i = 1; i <= steps; i++) {
                            const progress = i / steps;
                            const x = startX + (endX - startX) * progress;
                            const y = baseY - arcHeight * projectileEase(progress);
                            d.push("L", x, y);
                        }
                        return d.join(" ");
                    })();
                    const graphSize = Math.max(40, Math.min(cellW - padding * 2, baseY - (originY + padding)));
                    const graphX = Math.max(originX + padding, centerX - graphSize / 2);
                    const graphY = baseY - graphSize;
                    const graph = createGraphRenderer({
                        container,
                        idFor,
                        graphX,
                        graphY,
                        graphSize,
                        baselineYTarget: baseY,
                    });

                    const referencePath = container.path(sampledPath)
                        .attr({
                            stroke: "#2a6b80",
                            strokeWidth: 1,
                            fill: "none",
                            strokeDasharray: "6 6",
                            id: idFor("projectile-path"),
                        });

                    const ball = container.circle(0, 0, 10)
                        .attr({
                            fill: projectileArcColor,
                            stroke: "#0e1b20",
                            strokeWidth: 1,
                            id: idFor("projectile-ball"),
                        });
                    const arrow = container.path("M -6 0 L -14 -4 L -14 4 Z")
                        .attr({ fill: projectileArcColor, opacity: 0.8, id: idFor("projectile-arrow") });
                    const projectileGroup = container.g(ball, arrow)
                        .attr({ id: idFor("projectile-group") });
                    projectileGroup.translate(startX, baseY, "id");
                    const arcDuration = 2600;

                    const state = {
                        running: false,
                        autoLoop: false,
                        loopTimer: null,
                        startDelayTimer: null,
                        activeAnim: null,
                        graphAnim: null,
                    };

                    const clearTimer = (key) => {
                        if (state[key]) {
                            clearTimeout(state[key]);
                            state[key] = null;
                        }
                    };

                    const stop = () => {
                        clearTimer("loopTimer");
                        clearTimer("startDelayTimer");
                        if (state.graphAnim && typeof state.graphAnim.stop === "function") {
                            state.graphAnim.stop();
                            state.graphAnim = null;
                        }
                        if (state.activeAnim && typeof state.activeAnim.stop === "function") {
                            state.activeAnim.stop();
                        }
                        state.activeAnim = null;
                        state.autoLoop = false;
                        state.running = false;
                        icon.setState(false);
                        graph.reset();
                        projectileGroup.translate(startX, baseY, "id");
                    };

                    const scheduleArc = (delay) => {
                        clearTimer("loopTimer");
                        if (!state.autoLoop) {
                            return;
                        }
                        state.loopTimer = setTimeout(() => {
                            state.loopTimer = null;
                            fireArc();
                        }, delay);
                    };

                    const fireArc = () => {
                        if (!state.autoLoop) {
                            stop();
                            return;
                        }
                        if (state.graphAnim && typeof state.graphAnim.stop === "function") {
                            state.graphAnim.stop();
                            state.graphAnim = null;
                        }
                        if (state.activeAnim && typeof state.activeAnim.stop === "function") {
                            state.activeAnim.stop();
                            state.activeAnim = null;
                        }
                        projectileGroup.translate(startX, baseY, "id");
                        graph.reset();

                        state.graphAnim = Snap.animate(0, 1, (progress) => {
                            const eased = projectileEase(progress);
                            graph.addSample(progress, eased);
                        }, arcDuration, mina.linear, () => {
                            graph.addSample(1, projectileEase(1));
                            state.graphAnim = null;
                        });

                        state.activeAnim = projectileGroup.translateAnimate(
                            arcDuration,
                            horizontalDelta,
                            verticalDelta,
                            undefined,
                            0,
                            0,
                            false,
                            transformEasing
                        );

                        state.activeAnim.then(() => {
                            state.activeAnim = null;
                            if (!state.autoLoop) {
                                stop();
                                return;
                            }
                            scheduleArc(400);
                        });
                    };

                    const start = ({ delay = 0 } = {}) => {
                        if (state.running) {
                            return;
                        }
                        const begin = () => {
                            state.startDelayTimer = null;
                            state.autoLoop = true;
                            state.running = true;
                            icon.setState(true);
                            fireArc();
                        };
                        if (delay > 0) {
                            state.startDelayTimer = setTimeout(begin, delay);
                        } else {
                            begin();
                        }
                    };

                    icon.group.click(() => {
                        if (state.running) {
                            stop();
                        } else {
                            start();
                        }
                    });

                    return {
                        start,
                        stop,
                        isRunning: () => state.running,
                    };
                }
            };

            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", ready);
            } else {
                ready();
            }
        })();

