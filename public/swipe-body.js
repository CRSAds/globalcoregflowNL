// ✅ swipe-body.js — loader pas weg na visuals, geen flikker, fonts & dev-elementen geregeld
(function () {

  console.log("🧩 swipe-body.js gestart");;

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
  
// ============================================================
// 📊 Visit tracking — 1x per sessie (Supabase)
// ============================================================

(function registerVisitOnce() {
  try {
    // voorkom dubbele registraties
    if (sessionStorage.getItem("visitRegistered") === "true") return;

    const params = new URLSearchParams(window.location.search);

    // tracking ophalen (zelfde keys als elders in funnel)
    const payload = {
      t_id: sessionStorage.getItem("t_id")
        || params.get("t_id")
        || crypto.randomUUID(),

      offer_id: sessionStorage.getItem("offer_id")
        || params.get("offer_id")
        || null,

      aff_id: sessionStorage.getItem("aff_id")
        || params.get("aff_id")
        || null,

      sub_id: sessionStorage.getItem("sub_id")
        || params.get("sub_id")
        || null,

      page_url: `${location.origin}${location.pathname}`,
      user_agent: navigator.userAgent
    };

    // markeer direct als verstuurd (ook als request faalt)
    sessionStorage.setItem("visitRegistered", "true");
    sessionStorage.setItem("t_id", payload.t_id);

    // fire & forget
    fetch("https://globalcoregflow-nl.vercel.app/api/visit.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => {
      // bewust leeg: bezoek tracking mag funnel nooit breken
    });

  } catch {
    // absolute stilte bij fouten
  }
})();

})(); // Sluit de hoofd-IIFE (swipe-body.js)
