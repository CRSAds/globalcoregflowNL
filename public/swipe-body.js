// ✅ swipe-body.js — loader pas weg na visuals, geen flikker, fonts & dev-elementen geregeld
(function () {
  console.log("🧩 swipe-body.js gestart");

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

      if (start !== null) {
        window.__loaderVisibleMs = Math.round(now - start);
      }

      console.timeEnd?.("loader_visible");

      if (typeof performance !== "undefined" && performance.mark) {
        performance.mark("loader:hidden");
        try {
          performance.measure("loader:duration", "loader:created", "loader:hidden");
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
        console.warn("⚠️ Visuals-event niet ontvangen — forceer loader verwijdering");
        hideLoader();
      }
    }, 3500);
  })();

  // === Style/dev-secties verbergen op live ===
  window.addEventListener("load", () => {
    const host = window.location.hostname;
    const isEditor = host.includes("app.swipepages.com");

    document.querySelectorAll('[id^="style-"], [id^="dev-"]').forEach(el => {
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
        fontWeight: s.fontWeight
      };
    };

    const titleRef = getStyle("#style-settings .typo-h1");
    const bodyRef = getStyle("#style-settings .typo-body");
    const termsRef = getStyle("#style-settings .typo-actievoorwaarden") || bodyRef;

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
    document.documentElement.style.setProperty("--campaign-primary", fallback);
    console.log("🎨 Campagnekleur standaard ingesteld:", fallback);
  });

  // === Master background ===
  document.addEventListener("DOMContentLoaded", () => {
    const bg = document.getElementById("master-bg");
    if (!bg?.src) return;
    document.querySelectorAll(".needs-master-bg").forEach(sec => {
      sec.style.backgroundImage = `url('${bg.src}')`;
      sec.style.backgroundSize = "cover";
      sec.style.backgroundPosition = "center";
      sec.style.backgroundRepeat = "no-repeat";
    });
  });

  // =============================================================
  // 🚪 Exit intent → toon Swipe Pages popup (Sovendus exit)
  // + forceer lazy-loaded images
  // + MINI-SCROLL hack
  // + Sovendus iframe PAS laden zodra popup opent (1x)
  // + ✅ LOG Sovendus impression zodra iframe echt verschijnt
  // =============================================================
  (function setupSovendusExitPopupTrigger() {
    const POPUP_CLASS = "sovendus-exit-popup";
    const INACTIVITY_MS = 25000;

    let shown = false;
    let inactivityTimer = null;

    // ✅ Sovendus exit iframe slechts 1x laden
    let sovendusLoaded = false;

    // 🔵 Sovendus exit impression slechts 1x loggen
    let sovendusExitLogged = false;

    function getPopupEl() {
      return document.querySelector(`.${POPUP_CLASS}`);
    }

    // =============================================================
    // 🖼️ Forceer lazy-loaded images + mini-scroll
    // =============================================================
    function forceLoadImages(container) {
      if (!container) return;

      let count = 0;

      container.querySelectorAll("img[data-src]").forEach((img) => {
        if (!img.src || img.src !== img.dataset.src) {
          img.src = img.dataset.src;
          count++;
        }
      });

      container.querySelectorAll("[data-bg], [data-background-image]").forEach((el) => {
        const bg =
          el.getAttribute("data-bg") ||
          el.getAttribute("data-background-image");

        if (bg && (!el.style.backgroundImage || el.style.backgroundImage === "none")) {
          el.style.backgroundImage = `url('${bg}')`;
          el.style.backgroundSize = "cover";
          el.style.backgroundPosition = "center";
          el.style.backgroundRepeat = "no-repeat";
          count++;
        }
      });

      window.scrollBy(0, 1);
      setTimeout(() => window.scrollBy(0, -1), 50);

      console.log("🖼️ [ExitPopup] Afbeeldingen geforceerd + mini-scroll:", count);
    }

    // =============================================================
    // ✅ Bepaal API-origin (NIET via location.host)
    // - Als FLOW_LOG_ENDPOINT bestaat: pak origin daarvan
    // - Anders fallback naar globalcoregflow-nl
    // =============================================================
    function getApiBase() {
      try {
        if (window.FLOW_LOG_ENDPOINT) {
          return new URL(window.FLOW_LOG_ENDPOINT).origin;
        }
      } catch (e) {}
      return "https://globalcoregflow-nl.vercel.app";
    }

    // =============================================================
    // 📡 LOG Sovendus exit impression (iframe detectie)
    // =============================================================
    function observeAndLogSovendusExitIframe() {
      if (sovendusExitLogged) return;

      const container = document.getElementById("sovendus-exit-container");
      if (!container) return;

      async function logImpression() {
        if (sovendusExitLogged) return;

        const t_id = sessionStorage.getItem("t_id");
        if (!t_id) {
          console.warn("[SovendusExit] Geen t_id → geen logging");
          return;
        }

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

        const API_BASE = getApiBase();
        const url = `${API_BASE}/api/sovendus-impression.js`;

        console.log("📡 [SovendusExit] Iframe geladen → impression loggen", { ...payload, url });

        try {
          const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true,
          });

          if (!r.ok) {
            const txt = await r.text().catch(() => "");
            console.error("[SovendusExit] Impression API non-200", r.status, txt);
          }
        } catch (err) {
          console.error("[SovendusExit] Impression API fout", err);
        }
      }

      // Iframe al aanwezig?
      if (container.querySelector("iframe")) {
        logImpression();
        return;
      }

      const observer = new MutationObserver(() => {
        if (container.querySelector("iframe")) {
          observer.disconnect();
          logImpression();
        }
      });

      observer.observe(container, { childList: true, subtree: true });
    }

    // =============================================================
    // 🎁 Sovendus pas laden wanneer popup opent
    // =============================================================
    function loadSovendusExitIframe() {
      if (sovendusLoaded) return;

      const container = document.getElementById("sovendus-exit-container");
      if (!container) {
        console.warn("[SovendusExit] #sovendus-exit-container niet gevonden");
        return;
      }

      sovendusLoaded = true;

      console.log("🎁 [SovendusExit] Sovendus iframe wordt geladen (exit popup)");

      container.style.minHeight = "60px";
      container.style.display = "block";
      container.style.width = "100%";

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
        console.log("✅ [SovendusExit] Sovendus script geladen (exit popup)");
        observeAndLogSovendusExitIframe(); // 🔵 hier gebeurt het
      };

      script.onerror = () => {
        console.error("❌ [SovendusExit] Fout bij laden Sovendus script");
        sovendusLoaded = false;
      };

      document.body.appendChild(script);
    }

    // =============================================================
    // 🚪 Popup tonen
    // =============================================================
    function showPopup(reason) {
      if (shown) return;

      const popup = getPopupEl();
      if (!popup) {
        console.warn(`[ExitPopup] Popup .${POPUP_CLASS} niet gevonden`);
        return;
      }

      shown = true;

      const wrapper = popup.closest(".tatsu-popup-container") || popup;
      wrapper.style.display = "block";
      popup.style.display = "block";

      forceLoadImages(wrapper);
      loadSovendusExitIframe();

      console.log("🚪 [ExitPopup] Popup geopend via:", reason);
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

    // ===== Desktop exit =====
    document.addEventListener("mouseleave", (e) => {
      if (shown) return;
      if (e.clientY <= 0) showPopup("desktop-exit");
    });

    // ===== Mobile inactivity =====
    function resetInactivity() {
      if (shown) return;
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        showPopup("mobile-inactive");
      }, INACTIVITY_MS);
    }

    ["touchstart", "scroll", "click", "mousemove", "keydown"].forEach((evt) => {
      document.addEventListener(evt, resetInactivity, { passive: true });
    });

    resetInactivity();

    // ===== Close handlers =====
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
  })();

  // =============================================================
  // 📞 IVR POPUP AUTO-CLOSE NA CALL CLICK (TATSU)
  // =============================================================
  (function setupIvrPopupAutoClose() {
    const CLOSE_AFTER_MS = 10000; // 10 seconden
    let timerStarted = false;

    function closePopup(callPopup) {
      if (!callPopup) return;

      const container = callPopup.closest(".tatsu-popup-container");
      const mask = container?.querySelector(".popup-mask");

      if (container) container.style.display = "none";
      if (mask) mask.style.display = "none";

      console.log("📞 [IVR] Tatsu popup-container automatisch gesloten");
    }

    document.addEventListener("click", (e) => {
      const callBtn = e.target.closest(".ivr-call-btn");
      if (!callBtn) return;

      const callPopup = callBtn.closest(".call-pop-up");
      if (!callPopup) {
        console.warn("📞 [IVR] ivr-call-btn klik, maar geen .call-pop-up gevonden");
        return;
      }

      if (timerStarted) return;
      timerStarted = true;

      console.log("📞 [IVR] Call button geklikt → start auto-close timer");

      setTimeout(() => {
        closePopup(callPopup);
      }, CLOSE_AFTER_MS);
    });
  })();

})();
