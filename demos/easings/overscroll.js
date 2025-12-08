(function initOverscrollProbe() {
    const RUBBER_TIGHTNESS = 0.75;
    const OVERSHOOT_GAIN = 1; // 6;
    const BOARD_OFFSET_GAIN = 380;

    const ready = () => {
        if (!window.mina || typeof mina.rubber !== "function") {
            console.warn("mina.rubber easing is unavailable; overscroll demo disabled.");
            return;
        }

        const docEl = document.documentElement;
        const pageContent = document.getElementById("page-content");
        const wrapper = document.getElementById("demo-wrapper");
        const board = document.getElementById("easing-board");
        const transformTarget = pageContent || wrapper || board;
        if (transformTarget) {
            transformTarget.style.willChange = "transform";
        }

        const indicator = document.createElement("div");
        indicator.id = "overscroll-indicator";
        Object.assign(indicator.style, {
            position: "fixed",
            top: "1rem",
            right: "1rem",
            width: "64px",
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(5,5,5,0.8)",
            color: "#e4e4e4",
            fontFamily: "monospace",
            fontSize: "12px",
            zIndex: "9999",
            pointerEvents: "auto",
            boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
        });

        const track = document.createElement("div");
        Object.assign(track.style, {
            position: "relative",
            height: "180px",
            width: "12px",
            margin: "0 auto 8px auto",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.05)",
        });

        const thumb = document.createElement("div");
        Object.assign(thumb.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "26px",
            borderRadius: "6px",
            background: "linear-gradient(135deg,#5cd1ff,#7b8bff)",
            boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
            transform: "translateY(0)",
            transition: "transform 0.1s ease-out",
        });

        track.appendChild(thumb);
        indicator.appendChild(track);

        const label = document.createElement("div");
        label.textContent = "overshoot 0.000";
        label.style.textAlign = "center";
        indicator.appendChild(label);

        const toggle = document.createElement("label");
        Object.assign(toggle.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            marginTop: "8px",
            cursor: "pointer",
            fontSize: "11px",
        });

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = true;
        checkbox.setAttribute("aria-label", "Toggle overscroll effect");

        const toggleText = document.createElement("span");
        toggleText.textContent = "effect";

        toggle.appendChild(checkbox);
        toggle.appendChild(toggleText);
        indicator.appendChild(toggle);

        document.body.appendChild(indicator);

        const easing = (typeof mina.rubber.withParams === "function")
            ? mina.rubber.withParams(RUBBER_TIGHTNESS)
            : function (n) { return mina.rubber(RUBBER_TIGHTNESS, n); };

        let effectEnabled = true;
        let rafId = null;
        const requestUpdate = () => {
            if (rafId != null) {
                return;
            }
            rafId = requestAnimationFrame(applyOverscroll);
        };

        const updateEnabledState = () => {
            effectEnabled = checkbox.checked;
            indicator.style.opacity = effectEnabled ? "1" : "0.65";
            requestUpdate();
        };
        checkbox.addEventListener("change", updateEnabledState);

        const applyOverscroll = () => {
            rafId = null;
           const scroller = document.scrollingElement || document.documentElement;
            const scrollTop = scroller.scrollTop;
            const maxScroll = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
            const rawProgress = Math.min(1, Math.max(0, scrollTop / maxScroll));
            const eased = easing(rawProgress);
            const overshoot = eased - rawProgress;
            const amplified = overshoot * OVERSHOOT_GAIN;

            const thumbProgress = effectEnabled ? eased : rawProgress;
            const trackSpan = track.clientHeight - thumb.clientHeight;
            const translateY = trackSpan > 0 ? trackSpan * thumbProgress : 0;
            thumb.style.transform = `translateY(${translateY}px)`;
            label.textContent = effectEnabled
                ? `overshoot ${amplified.toFixed(3)}`
                : `linear ${rawProgress.toFixed(3)}`;

            if (transformTarget) {
                const offset = effectEnabled
                    ? amplified * BOARD_OFFSET_GAIN
                    : 0;
                transformTarget.style.transform = `translateY(${offset}px)`;
                transformTarget.style.transition = transformTarget.style.transition || "transform 0.12s ease-out";
            }
        };

        window.addEventListener("scroll", requestUpdate, { passive: true });
        window.addEventListener("resize", requestUpdate);
        updateEnabledState();
        requestUpdate();
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", ready, { once: true });
    } else {
        ready();
    }
})();
