// ✅ swipe-body.js — loader pas weg na visuals, geen flikker, fonts & dev-elementen geregeld
(function () {
  console.log("🧩 swipe-body.js gestart");

  // 🔎 Performance marker — script start
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark("swipe-body:start");
  }

  // === Loader-stijl + structuur ===
  document.addEventListener("DOMContentLoaded", () => {
    // 🔎 Start loader visible timer (fallback op Date.now)
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

      // 🔎 Loader timing stoppen + bewaren in window.__loaderVisibleMs
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

    // Expose lokaal voor fallback
    window.__hidePageLoader = hideLoader;

    window.addEventListener("visuals:assets-ready", hideLoader);
    window.addEventListener("load", () => setTimeout(hideLoader, 1200));

    // 🚨 Nood-fallback: forceer verwijdering na 3.5s via dezelfde functie
    setTimeout(() => {
      const loader = document.getElementById("page-loader");
      if (loader) {
        console.warn("⚠️ Visuals-event niet ontvangen — forceer loader verwijdering via hideLoader()");
        if (typeof window.__hidePageLoader === "function") {
          window.__hidePageLoader();
        } else {
          loader.classList.add("fade-out");
          setTimeout(() => loader.remove(), 900);
        }
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
    const getComputedFontStyle = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const style = window.getComputedStyle(el);
      return {
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        color: style.color,
        lineHeight: style.lineHeight,
        fontWeight: style.fontWeight,
      };
    };

    const titleRef = getComputedFontStyle("#style-settings .typo-h1");
    const bodyRef = getComputedFontStyle("#style-settings .typo-body");
    const termsRef =
      getComputedFontStyle("#style-settings .typo-actievoorwaarden") || bodyRef;

    const titleEl = document.getElementById("campaign-title");
    const paragraphEl = document.getElementById("campaign-paragraph");
    const actieEl = document.getElementById("actievoorwaarden");

    if (titleEl && titleRef) Object.assign(titleEl.style, titleRef);
    if (paragraphEl && bodyRef) Object.assign(paragraphEl.style, bodyRef);
    if (actieEl && termsRef) Object.assign(actieEl.style, termsRef);

    console.log("✅ Fontstijlen toegepast vanuit style-settings");
  });

  // === 🎨 Campagnekleur: vaste fallback (geen detectie meer) ===
  window.addEventListener("load", () => {
    const fallback = "#14B670"; // standaard groene campagnetint
    document.documentElement.style.setProperty("--campaign-primary", fallback);
    console.log("🎨 Campagnekleur standaard ingesteld:", fallback);
  });

  // === Master background (zelfde logica behouden) ===
  document.addEventListener("DOMContentLoaded", () => {
    const masterBgImg = document.getElementById("master-bg");
    if (!masterBgImg) return;
    const bgUrl = masterBgImg.src;
    if (!bgUrl) return;
    document.querySelectorAll(".needs-master-bg").forEach(section => {
      section.style.backgroundImage = `url('${bgUrl}')`;
      section.style.backgroundSize = "cover";
      section.style.backgroundPosition = "center";
      section.style.backgroundRepeat = "no-repeat";
    });
  });

  // === Real User Monitoring (RUM) ===
  (function () {
    let sent = false;

    function sendPerfLog() {
      if (sent) return;
      sent = true;

      let loaderVisible = null;
      let initFirstSection = null;

      // 1️⃣ Loader-duur uit eigen variabele of Performance API
      if (typeof window.__loaderVisibleMs === "number") {
        loaderVisible = window.__loaderVisibleMs;
      } else if (typeof performance !== "undefined" && performance.getEntriesByName) {
        const loaderMeasure = performance.getEntriesByName("loader:duration")[0];
        if (loaderMeasure) loaderVisible = Math.round(loaderMeasure.duration);
      }

      // 2️⃣ Time-to-first-section uit eigen variabele of Performance API
      if (typeof window.__initFirstSectionMs === "number") {
        initFirstSection = window.__initFirstSectionMs;
      } else if (typeof performance !== "undefined" && performance.getEntriesByName) {
        const initMeasure = performance.getEntriesByName("initFlow:time-to-first-section")[0];
        if (initMeasure) initFirstSection = Math.round(initMeasure.duration);
      }

      const payload = {
        ts: Date.now(),
        url: location.href,
        userAgent: navigator.userAgent,
        loaderVisible,
        initFirstSection,
        measures: []
      };

      fetch("https://globalcoregflow-nl.vercel.app/api/perf-log.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }

    // ❗ Alleen na volledige pageload loggen, zodat alle timings gezet zijn
    window.addEventListener("load", () => {
      // kleine delay zodat hideLoader + initFlow klaar zijn
      setTimeout(sendPerfLog, 4000);
    });
  })();

})();
