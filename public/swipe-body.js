// ✅ swipe-body.js — loader pas weg na visuals, geen flikker, fonts & dev-elementen geregeld
(function () {
  console.log("🧩 swipe-body.js gestart");

  // =============================================================
  // 📊 Sovendus click / impression tracking (NIEUW – add-only)
  // =============================================================
  let sovendusVisible = false;
  let sovendusContext = null; // "exit" | "flow"
  let sovendusClickLogged = false;

  // 🔎 Performance marker — script start
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark("swipe-body:start");
  }

  // === Loader-stijl + structuur ===
  document.addEventListener("DOMContentLoaded", () => {
    const now =
      typeof performance !== "undefined" && performance.now
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
      loader.innerHTML = `
        <div class="loader-inner">
          <div class="loader-spinner"></div>
        </div>
      `;
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

      const start =
        typeof window.__loaderStart === "number" ? window.__loaderStart : null;
      const now =
        typeof performance !== "undefined" && performance.now
          ? performance.now()
          : Date.now();

      if (start !== null) {
        window.__loaderVisibleMs = Math.round(now - start);
      }

      console.timeEnd?.("loader_visible");

      if (typeof performance !== "undefined" && performance.mark) {
        performance.mark("loader:hidden");
        try {
          performance.measure(
            "loader:duration",
            "loader:created",
            "loader:hidden"
          );
        } catch (e) {}
      }

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
      if (loader) {
        console.warn(
          "⚠️ Visuals-event niet ontvangen — forceer loader verwijdering"
        );
        hideLoader();
      }
    }, 3500);
  })();

  // === Style/dev-secties verbergen op live ===
  window.addEventListener("load", () => {
    const host = window.location.hostname;
    const isEditor = host.includes("app.swipepages.com");

    document
      .querySelectorAll('[id^="style-"], [id^="dev-"]')
      .forEach((el) => {
        if (!isEditor) {
          el.style.display = "none";
          el.style.visibility = "hidden";
          el.style.opacity = "0";
          el.style.height = "0";
          el.style.overflow = "hidden";
        }
      });

    console.log(
      isEditor
        ? "✏️ Editor gedetecteerd — helper-secties zichtbaar"
        : "✅ Style/dev-secties verborgen op live site"
    );
  });

  // === Fonts uit style-settings overnemen ===
  window.addEventListener("load", () => {
    const getStyle = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        color: s.color,
        lineHeight: s.lineHeight,
        fontWeight: s.fontWeight,
      };
    };

    const titleRef = getStyle("#style-settings .typo-h1");
    const bodyRef = getStyle("#style-settings .typo-body");
    const termsRef =
      getStyle("#style-settings .typo-actievoorwaarden") || bodyRef;

    const titleEl = document.getElementById("campaign-title");
    const paraEl = document.getElementById("campaign-paragraph");
    const actieEl = document.getElementById("actievoorwaarden");

    if (titleEl && titleRef) Object.assign(titleEl.style, titleRef);
    if (paraEl && bodyRef) Object.assign(paraEl.style, bodyRef);
    if (actieEl && termsRef) Object.assign(actieEl.style, termsRef);

    console.log("✅ Fontstijlen toegepast vanuit style-settings");
  });

  // === 🎨 Campagnekleur ===
  window.addEventListener("load", () => {
    const fallback = "#14B670";
    document.documentElement.style.setProperty(
      "--campaign-primary",
      fallback
    );
    console.log("🎨 Campagnekleur standaard ingesteld:", fallback);
  });

  // === Master background ===
  document.addEventListener("DOMContentLoaded", () => {
    const bg = document.getElementById("master-bg");
    if (!bg?.src) return;
    document.querySelectorAll(".needs-master-bg").forEach((sec) => {
      sec.style.backgroundImage = `url('${bg.src}')`;
      sec.style.backgroundSize = "cover";
      sec.style.backgroundPosition = "center";
      sec.style.backgroundRepeat = "no-repeat";
    });
  });

  // =============================================================
  // 🚪 Exit intent → Sovendus popup
  // =============================================================
  (function setupSovendusExitPopupTrigger() {
    const POPUP_CLASS = "sovendus-exit-popup";
    const INACTIVITY_MS = 25000;

    let shown = false;
    let inactivityTimer = null;
    let sovendusLoaded = false;
    let sovendusExitLogged = false;

    function getPopupEl() {
      return document.querySelector(`.${POPUP_CLASS}`);
    }

    function forceLoadImages(container) {
      if (!container) return;

      let count = 0;

      container.querySelectorAll("img[data-src]").forEach((img) => {
        if (!img.src || img.src !== img.dataset.src) {
          img.src = img.dataset.src;
          count++;
        }
      });

      container
        .querySelectorAll("[data-bg], [data-background-image]")
        .forEach((el) => {
          const bg =
            el.getAttribute("data-bg") ||
            el.getAttribute("data-background-image");

          if (
            bg &&
            (!el.style.backgroundImage ||
              el.style.backgroundImage === "none")
          ) {
            el.style.backgroundImage = `url('${bg}')`;
            el.style.backgroundSize = "cover";
            el.style.backgroundPosition = "center";
            el.style.backgroundRepeat = "no-repeat";
            count++;
          }
        });

      window.scrollBy(0, 1);
      setTimeout(() => window.scrollBy(0, -1), 50);

      console.log(
        "🖼️ [ExitPopup] Afbeeldingen geforceerd + mini-scroll:",
        count
      );
    }

    function getApiBase() {
      try {
        if (window.FLOW_LOG_ENDPOINT) {
          return new URL(window.FLOW_LOG_ENDPOINT).origin;
        }
      } catch (e) {}
      return "https://globalcoregflow-nl.vercel.app";
    }

    async function logExitImpression() {
      if (sovendusExitLogged) return;

      const t_id = sessionStorage.getItem("t_id");
      if (!t_id) return;

      sovendusExitLogged = true;

      const payload = {
        t_id,
        offer_id: sessionStorage.getItem("offer_id") || "unknown",
        sub_id:
          sessionStorage.getItem("sub_id") ||
          sessionStorage.getItem("aff_id") ||
          "unknown",
        source: "exit",
      };

      const url = `${getApiBase()}/api/sovendus-impression.js`;

      try {
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      } catch (e) {
        console.error("[SovendusExit] Impression fout", e);
      }
    }

    function loadSovendusExitIframe() {
      if (sovendusLoaded) return;

      const container = document.getElementById("sovendus-exit-container");
      if (!container) return;

      sovendusLoaded = true;

      const t_id = sessionStorage.getItem("t_id") || crypto.randomUUID();
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:TZ.]/g, "")
        .slice(0, 14);

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
      script.src =
        "https://api.sovendus.com/sovabo/common/js/flexibleIframe.js";
      script.async = true;
      script.onload = logExitImpression;
      document.body.appendChild(script);
    }

    function showPopup(reason) {
      if (shown) return;
      const popup = getPopupEl();
      if (!popup) {
        console.warn(
          `[ExitPopup] Popup .${POPUP_CLASS} niet gevonden`
        );
        return;
      }

      shown = true;

      const wrapper =
        popup.closest(".tatsu-popup-container") || popup;
      wrapper.style.display = "block";
      popup.style.display = "block";

      forceLoadImages(wrapper);
      loadSovendusExitIframe();

      // === NIEUW: markeer zichtbaarheid + context
      sovendusVisible = true;
      sovendusContext = "exit";

      console.log("🚪 [ExitPopup] Popup geopend via:", reason);
    }

    document.addEventListener("mouseleave", (e) => {
      if (!shown && e.clientY <= 0) showPopup("desktop-exit");
    });

    function resetInactivity() {
      if (shown) return;
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(
        () => showPopup("mobile-inactive"),
        INACTIVITY_MS
      );
    }

    function hidePopup(reason) {
      const popup = getPopupEl();
      if (!popup) return;

      const wrapper = popup.closest(".tatsu-popup-container") || popup;
      const mask = wrapper.querySelector(".popup-mask");

      popup.style.display = "none";
      wrapper.style.display = "none";
      if (mask) mask.style.display = "none";

      console.log("🚪 [ExitPopup] Popup gesloten via:", reason);
    }

    document.addEventListener("click", (e) => {
      const popup = getPopupEl();
      if (!popup) return;

      const wrapper = popup.closest(".tatsu-popup-container") || popup;
      const visible = window.getComputedStyle(wrapper).display !== "none";
      if (!visible) return;

      if (e.target.classList.contains("popup-mask")) {
        hidePopup("mask");
        return;
      }

      if (e.target.closest(".close-icon")) {
        hidePopup("close-icon");
        return;
      }
    });

    ["touchstart", "scroll", "click", "mousemove", "keydown"].forEach(
      (evt) =>
        document.addEventListener(evt, resetInactivity, {
          passive: true,
        })
    );

    resetInactivity();
  })();

  // =============================================================
  // 🖱️ Sovendus approx click detectie (NIEUW)
  // =============================================================
  function getApiBase() {
    try {
      if (window.FLOW_LOG_ENDPOINT) {
        return new URL(window.FLOW_LOG_ENDPOINT).origin;
      }
    } catch (e) {}
    return "https://globalcoregflow-nl.vercel.app";
  }

  function logSovendusEvent(event, context) {
    const t_id = sessionStorage.getItem("t_id");
    if (!t_id) return;

    const payload = {
      t_id,
      offer_id: sessionStorage.getItem("offer_id") || "unknown",
      sub_id:
        sessionStorage.getItem("sub_id") ||
        sessionStorage.getItem("aff_id") ||
        "unknown",
      source: "sovendus",
      event,
      context,
      approx: event === "click",
      ts: Date.now(),
    };

    fetch(`${getApiBase()}/api/sovendus-impression.js`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }

  document.addEventListener("visibilitychange", () => {
    if (
      document.visibilityState === "hidden" &&
      sovendusVisible &&
      !sovendusClickLogged
    ) {
      sovendusClickLogged = true;
      logSovendusEvent("click", sovendusContext);
    }
  });

})();
