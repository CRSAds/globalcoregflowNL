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
  // 📞 IVR POPUP AUTO-CLOSE NA CALL CLICK (TATSU POPUP)
  // =============================================================
  (function setupIvrPopupAutoClose() {
    const CLOSE_AFTER_MS = 10000; // 10 seconden
    let timerStarted = false;
  
    function closePopup(popup) {
      if (!popup) return;
  
      popup.classList.remove("tatsu-popup--active");
      popup.style.display = "none";
  
      console.log("📞 [IVR] Tatsu popup automatisch gesloten");
    }
  
    document.addEventListener("click", (e) => {
      const callBtn = e.target.closest(".ivr-call-btn");
      if (!callBtn) return;
  
      const popup = callBtn.closest(".tatsu-popup");
      if (!popup) {
        console.warn("📞 [IVR] ivr-call-btn klik, maar geen .tatsu-popup gevonden");
        return;
      }
  
      if (timerStarted) return;
      timerStarted = true;
  
      console.log("📞 [IVR] Call button geklikt → start auto-close timer");
  
      setTimeout(() => {
        closePopup(popup);
      }, CLOSE_AFTER_MS);
    });
  })();

})();
