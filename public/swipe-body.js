// ✅ swipe-body.js — Loader, styling en specifieke Sovendus tracking
(function () {

  console.log("🧩 swipe-body.js gestart");

  // 🔎 Performance marker — script start
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark("swipe-body:start");
  }

  // === Loader-stijl + structuur ===
  document.addEventListener("DOMContentLoaded", () => {
    const now = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
    window.__loaderStart = now;

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
      const loader = document.getElementById("page-loader");
      if (loader) {
        loader.classList.add("fade-out");
        setTimeout(() => loader.remove(), 900);
      }
    }
    window.__hidePageLoader = hideLoader;
    window.addEventListener("visuals:assets-ready", hideLoader);
    window.addEventListener("load", () => setTimeout(hideLoader, 1200));
    setTimeout(() => { if (!done) hideLoader(); }, 3500);
  })();

  // === Style/dev-secties verbergen op live ===
  window.addEventListener("load", () => {
    const isEditor = window.location.hostname.includes("app.swipepages.com");
    if (!isEditor) {
      document.querySelectorAll('[id^="style-"], [id^="dev-"]').forEach((el) => {
        el.style.display = "none";
        el.style.visibility = "hidden";
        el.style.height = "0";
      });
    }
  });

  // === Fonts uit style-settings overnemen ===
  window.addEventListener("load", () => {
    const getStyle = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return { fontFamily: s.fontFamily, fontSize: s.fontSize, color: s.color, lineHeight: s.lineHeight, fontWeight: s.fontWeight };
    };
    const titleRef = getStyle("#style-settings .typo-h1");
    const bodyRef = getStyle("#style-settings .typo-body");
    const titleEl = document.getElementById("campaign-title");
    const paraEl = document.getElementById("campaign-paragraph");
    if (titleEl && titleRef) Object.assign(titleEl.style, titleRef);
    if (paraEl && bodyRef) Object.assign(paraEl.style, bodyRef);
  });

  // === 🎨 Campagnekleur & Background ===
  window.addEventListener("load", () => {
    document.documentElement.style.setProperty("--campaign-primary", "#14B670");
    const bg = document.getElementById("master-bg");
    if (bg?.src) {
      document.querySelectorAll(".needs-master-bg").forEach((sec) => {
        sec.style.backgroundImage = `url('${bg.src}')`;
        sec.style.backgroundSize = "cover";
      });
    }
  });

  // =============================================================
  // 💰 Sovendus Exit Button Tracking (€0,30)
  // =============================================================
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#sovendus-exit-button") || 
                e.target.closest('a[href*="sovendus.com/directlink/ad4558b5-bd79-4645-a01e-c1a4dd85b424"]');

    if (btn) {
      const t_id = sessionStorage.getItem("t_id") || "unknown";
      const offer_id = sessionStorage.getItem("offer_id") || "unknown";
      const sub_id = sessionStorage.getItem("sub_id") || sessionStorage.getItem("aff_id") || "unknown";

      fetch("https://globalcoregflow-nl.vercel.app/api/sovendus-impression.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          t_id: t_id,
          offer_id: offer_id,
          sub_id: sub_id,
          event: "click",
          source: "sovendus_exit_direct"
        }),
        keepalive: true 
      }).catch(() => {});
    }
  });

  // ============================================================
  // 📊 Visit tracking — 1x per sessie (Supabase)
  // ============================================================
  (function registerVisitOnce() {
    try {
      if (sessionStorage.getItem("visitRegistered") === "true") return;
      const params = new URLSearchParams(window.location.search);
      const payload = {
        t_id: sessionStorage.getItem("t_id") || params.get("t_id") || crypto.randomUUID(),
        offer_id: sessionStorage.getItem("offer_id") || params.get("offer_id") || null,
        aff_id: sessionStorage.getItem("aff_id") || params.get("aff_id") || null,
        sub_id: sessionStorage.getItem("sub_id") || params.get("sub_id") || null,
        page_url: `${location.origin}${location.pathname}`,
        user_agent: navigator.userAgent
      };
      sessionStorage.setItem("visitRegistered", "true");
      sessionStorage.setItem("t_id", payload.t_id);
      fetch("https://globalcoregflow-nl.vercel.app/api/visit.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch {}
  })();

})();
