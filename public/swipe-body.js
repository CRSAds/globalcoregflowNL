// ✅ swipe-body.js — loader pas weg na visuals, geen flikker, fonts & dev-elementen geregeld
(function () {
  console.log("🧩 swipe-body.js gestart");

  // =============================================================
  // 🔧 Sovendus logging helpers (NIEUW – veilig)
  // =============================================================
  function getApiBase() {
    try {
      if (window.FLOW_LOG_ENDPOINT) {
        return new URL(window.FLOW_LOG_ENDPOINT).origin;
      }
    } catch (e) {}
    return "https://globalcoregflow-nl.vercel.app";
  }

  function postSovendusEvent(payload) {
    const url = `${getApiBase()}/api/sovendus-impression.js`;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }

  function observeIframeClicks(containerId, source) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let clicked = false;

    container.addEventListener(
      "click",
      () => {
        if (clicked) return;

        const t_id = sessionStorage.getItem("t_id");
        if (!t_id) return;

        clicked = true;

        postSovendusEvent({
          t_id,
          offer_id: sessionStorage.getItem("offer_id") || "unknown",
          sub_id:
            sessionStorage.getItem("sub_id") ||
            sessionStorage.getItem("aff_id") ||
            "unknown",
          source,
          event: "click",
        });

        console.log(`🖱️ [Sovendus:${source}] iframe click gelogd`);
      },
      { once: true }
    );
  }

  // 🔎 Performance marker — script start
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark("swipe-body:start");
  }

  // === Loader-stijl + structuur ===
  document.addEventListener("DOMContentLoaded", () => {
    const now = (typeof performance !== "undefined" && performance.now)
      ? performance.now()
      : Date.now();
    window.__loaderStart = now;
    console.time?.("loader_visible");

    if (typeof performance !== "undefined" && performance.mark) {
      performance.mark("loader:created");
    }

    if (!document.getElementById("page-loader")) {
      const loader = document.createElement("div");
      loader.id = "page-loader";
      loader.innerHTML = `<div class="loader-inner"><div class="loader-spinner"></div></div>`;
      document.body.prepend(loader);
    }

    const style = document.createElement("style");
    style.textContent = `
      #page-loader {
        position: fixed; inset: 0;
        background: #fff;
        display: flex; justify-content: center; align-items: center;
        z-index: 999999;
        opacity: 1; visibility: visible;
        transition: opacity 1s ease, visibility 1s ease;
      }
      #page-loader.fade-out { opacity: 0; visibility: hidden; }
      .loader-spinner {
        width: 60px; height: 60px;
        border: 5px solid #ddd; border-top-color: #ff006e;
        border-radius: 50%; animation: spin 1s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .loader-inner { animation: loaderPulse 1.5s ease-in-out infinite; }
      @keyframes loaderPulse {
        0%,100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
      }
    `;
    document.head.appendChild(style);
  });

  // === Loader verbergen na visuals of fallback ===
  (function () {
    let done = false;
    function hideLoader() {
      if (done) return;
      done = true;

      const start = typeof window.__loaderStart === "number" ? window.__loaderStart : null;
      const now = (typeof performance !== "undefined" && performance.now)
        ? performance.now()
        : Date.now();

      if (start !== null) window.__loaderVisibleMs = Math.round(now - start);
      console.timeEnd?.("loader_visible");

      const loader = document.getElementById("page-loader");
      if (loader) {
        loader.classList.add("fade-out");
        setTimeout(() => loader.remove(), 900);
      }
    }

    window.__hidePageLoader = hideLoader;
    window.addEventListener("visuals:assets-ready", hideLoader);
    window.addEventListener("load", () => setTimeout(hideLoader, 1200));

    setTimeout(() => {
      const loader = document.getElementById("page-loader");
      if (loader) hideLoader();
    }, 3500);
  })();

  // =============================================================
  // 🚪 EXIT POPUP — Sovendus (AANGEPAST: show + click logging)
  // =============================================================
  (function setupSovendusExitPopupTrigger() {
    const POPUP_CLASS = "sovendus-exit-popup";
    const INACTIVITY_MS = 25000;

    let shown = false;
    let sovendusLoaded = false;
    let sovendusShowLogged = false;

    function getPopupEl() {
      return document.querySelector(`.${POPUP_CLASS}`);
    }

    function logShowOnce() {
      if (sovendusShowLogged) return;

      const t_id = sessionStorage.getItem("t_id");
      if (!t_id) return;

      sovendusShowLogged = true;

      postSovendusEvent({
        t_id,
        offer_id: sessionStorage.getItem("offer_id") || "unknown",
        sub_id:
          sessionStorage.getItem("sub_id") ||
          sessionStorage.getItem("aff_id") ||
          "unknown",
        source: "exit",
        event: "show",
      });

      console.log("👁️ [Sovendus:exit] show gelogd");
    }

    function loadSovendusExitIframe() {
      if (sovendusLoaded) return;

      const container = document.getElementById("sovendus-exit-container");
      if (!container) return;

      sovendusLoaded = true;

      const t_id = sessionStorage.getItem("t_id") || crypto.randomUUID();
      const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

      window.sovConsumer = {
        consumerSalutation: sessionStorage.getItem("gender") || "",
        consumerFirstName: sessionStorage.getItem("firstname") || "",
        consumerLastName: sessionStorage.getItem("lastname") || "",
        consumerEmail: sessionStorage.getItem("email") || "",
      };

      window.sovIframes = window.sovIframes || [];
      window.sovIframes.push({
        trafficSourceNumber: "5592",
        trafficMediumNumber: "1",
        sessionId: t_id,
        timestamp,
        iframeContainerId: "sovendus-exit-container",
      });

      const script = document.createElement("script");
      script.src = "https://api.sovendus.com/sovabo/common/js/flexibleIframe.js";
      script.async = true;

      script.onload = () => {
        logShowOnce();
        observeIframeClicks("sovendus-exit-container", "exit");
      };

      document.body.appendChild(script);
    }

    function showPopup(reason) {
      if (shown) return;
      const popup = getPopupEl();
      if (!popup) return;

      shown = true;
      const wrapper = popup.closest(".tatsu-popup-container") || popup;
      wrapper.style.display = "block";
      popup.style.display = "block";

      loadSovendusExitIframe();
      console.log("🚪 [ExitPopup] geopend via:", reason);
    }

    document.addEventListener("mouseleave", e => {
      if (!shown && e.clientY <= 0) showPopup("desktop-exit");
    });

    let inactivityTimer;
    function resetInactivity() {
      if (shown) return;
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => showPopup("mobile-inactive"), INACTIVITY_MS);
    }

    ["touchstart", "scroll", "mousemove", "click", "keydown"].forEach(evt =>
      document.addEventListener(evt, resetInactivity, { passive: true })
    );

    resetInactivity();
  })();

  // =============================================================
  // 🔁 FLOW Sovendus click + show (NIEUW, minimaal)
  // =============================================================
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("sovendus-container-1");
    if (!container) return;

    let showLogged = false;

    const observer = new MutationObserver(() => {
      if (container.querySelector("iframe") && !showLogged) {
        showLogged = true;

        postSovendusEvent({
          t_id: sessionStorage.getItem("t_id"),
          offer_id: sessionStorage.getItem("offer_id") || "unknown",
          sub_id:
            sessionStorage.getItem("sub_id") ||
            sessionStorage.getItem("aff_id") ||
            "unknown",
          source: "flow",
          event: "show",
        });

        observeIframeClicks("sovendus-container-1", "flow");
        observer.disconnect();
      }
    });

    observer.observe(container, { childList: true, subtree: true });
  });

})();
